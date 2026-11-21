import { createRequire } from 'node:module';
import { apply } from '../index.js';

const require = createRequire(import.meta.url);
const { createChecker } = require('./helpers/client.cjs');

/**
 * The host half is exercised without a running DSH: `apply` gets a fake service
 * container, and the routes it registers are called directly. Everything the
 * routes touch (session index, event log, title cache) is stubbed with the same
 * shapes the real services return.
 */

const check = createChecker('HOST');
const routes = new Map();

const sessions = [
  { header: { id: 's1', cwd: '/tmp/a', createdAt: 1 } },
  { header: { id: 's2', cwd: '/tmp/b', createdAt: 2 } },
  { header: { id: 'sub', origin: 'subagent', createdAt: 3 } },
];

const sessionQuery = {
  async listSessions() { return sessions; },
  async readTitleSnapshots(ids) {
    return ids.map((id) => ({ status: 'fulfilled', sessionId: id, value: { title: { title: 'title-' + id } } }));
  },
  async searchSessions({ limit }) {
    return { items: [{ header: { id: 's2', cwd: '/tmp/b', createdAt: 2 }, bestMatch: { seq: 42, snippet: '…登录失败…' } }] };
  },
  async filterEvents(id) {
    if (id === 's1') return [{ seq: 7, text: '一段包含登录 失败 的正文' }];
    return [];
  },
  async readEvent({ seq, before, after }) {
    return {
      startSeq: seq - before,
      endSeq: seq + after,
      events: [
        { seq: seq - 1, type: 'user/message', time: 1700000000000, data: { content: [{ type: 'text', text: '上一条\n带换行' }] } },
        { seq, type: 'assistant/message', time: 1700000001000, data: { message: { content: [{ type: 'text', text: '命中这条' }] } } },
        { seq: seq + 1, type: 'tool/result', time: 1700000002000, data: { message: { content: [{ type: 'text', text: '下一条' }] } } },
      ],
    };
  },
};

const ctx = {
  effect(fn) { fn(); return () => {}; },
  get(name) {
    if (name === 'webServer') {
      return { register(spec) { routes.set(spec.path, spec.handler); return () => {}; } };
    }
    if (name === 'sessionQuery') return sessionQuery;
    if (name === 'connection') return { requestRejection: () => false };
    return undefined;
  },
};

apply(ctx, {});

const call = async (path, query = '', method = 'GET') => {
  const handler = routes.get(path);
  if (!handler) throw new Error('missing route ' + path);
  let status = 0;
  let body = null;
  const res = {
    writeHead(code) { status = code; },
    end(payload) { if (payload) body = JSON.parse(String(payload)); },
    set statusCode(value) { status = value; },
    get statusCode() { return status; },
  };
  await handler({ url: path + (query ? '?' + query : ''), method, headers: { host: '127.0.0.1:1' } }, res);
  return { status, body };
};

try {
  const s = await call('/cmdk/sessions', 'q=' + encodeURIComponent('登录') + '&limit=5&depth=20');
  check.ok('sessions ok', s.status === 200, s);
  check.ok('hit has seq', s.body && s.body.hits[0] && s.body.hits[0].seq === 42, s.body && s.body.hits);
  check.ok('hit via index', s.body.hits[0].via === 'index', s.body.hits[0]);
  check.ok('subagent filtered', s.body.items.every((i) => i.sessionId !== 'sub'), s.body.items);
  check.ok('titles attached', s.body.items.find((i) => i.sessionId === 's1').title === 'title-s1', s.body.items);

  sessionQuery.searchSessions = async () => { throw new Error('index empty'); };
  const f = await call('/cmdk/sessions', 'q=' + encodeURIComponent('失败') + '&depth=4');
  check.ok('fallback scan', f.body.hits.length === 1 && f.body.hits[0].via === 'scan', f.body.hits);
  check.ok('scan seq', f.body.hits[0].seq === 7, f.body.hits[0]);

  sessionQuery.searchSessions = async ({ cursor }) =>
    cursor
      ? { items: [{ header: { id: 's3', createdAt: 2 }, bestMatch: { seq: 11, snippet: '下一页' } }] }
      : {
          items: [{ header: { id: 's1', createdAt: 2 }, bestMatch: { seq: 42, snippet: 'snip' } }],
          nextCursor: 'CURSOR-1',
        };
  const p1 = await call('/cmdk/sessions', 'q=' + encodeURIComponent('分页') + '&depth=4');
  check.ok('page one carries a cursor', p1.body.next === 'CURSOR-1', p1.body.next);
  const p2 = await call('/cmdk/sessions', 'q=' + encodeURIComponent('分页') + '&depth=4&cursor=CURSOR-1');
  check.ok('cursor is echoed back to the host', p2.body.hits.length === 1 && p2.body.hits[0].seq === 11, p2.body.hits);
  check.ok('last page has no cursor', p2.body.next === null, p2.body.next);

  const m = await call('/cmdk/message', 'sessionId=s2&seq=42&before=1&after=1');
  check.ok('message ok', m.status === 200, m);
  check.ok('message window', m.body.around.length === 3 && m.body.around[1].text === '命中这条', m.body.around);
  check.ok('message reads text blocks from data.content', m.body.around[0].text === '上一条\n带换行', m.body.around[0]);
  check.ok('message reports target seq and event type', m.body.targetSeq === 42 && m.body.around[1].type === 'assistant/message', m.body);
  check.ok('message keeps timestamps', m.body.around[0].time === 1700000000000, m.body.around[0]);

  const bad = await call('/cmdk/message', 'sessionId=s2');
  check.ok('message 400', bad.status === 400, bad);

  check.finish();
} catch (error) {
  console.error('  FAIL ' + error.message);
  process.exitCode = 1;
}
