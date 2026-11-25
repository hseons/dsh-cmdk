import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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

  // --- /cmdk/files: a real temporary tree, scanned for real -------------
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cmdk-files-'));
  const write = (rel) => {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, 'x'.repeat(rel.length));
  };
  write('README.md');
  write('src/app.js');
  write('src/lib/util.mjs');
  write('deep/one/two/three.js');
  write('node_modules/pkg/index.js');
  write('.git/config');
  write('.github/workflow.yml');

  const browse = await call('/cmdk/files', 'root=' + encodeURIComponent(root));
  check.ok('files browse ok', browse.status === 200, browse.body);
  check.ok('files browse returns the root', browse.body.root === fs.realpathSync(root), browse.body.root);
  check.ok('browse lists folders first', browse.body.items[0].kind === 'dir', browse.body.items.map((i) => i.name));
  check.ok('browse keeps top-level files', browse.body.items.some((i) => i.name === 'README.md'), browse.body.items);
  check.ok('browse does not recurse', !browse.body.items.some((i) => i.name === 'app.js'), browse.body.items.map((i) => i.name));
  check.ok('browse drops node_modules', !browse.body.items.some((i) => i.name === 'node_modules'), browse.body.items.map((i) => i.name));
  check.ok('browse drops .git but keeps .github', browse.body.items.some((i) => i.name === '.github') && !browse.body.items.some((i) => i.name === '.git'), browse.body.items.map((i) => i.name));

  const hit = await call('/cmdk/files', 'root=' + encodeURIComponent(root) + '&q=app');
  check.ok('files search finds a nested file', hit.body.items.some((i) => i.rel === 'src/app.js'), hit.body.items);
  check.ok('files search reports the relative dir', hit.body.items.find((i) => i.rel === 'src/app.js').relDir === 'src', hit.body.items);
  check.ok('files search carries size and mtime', hit.body.items.find((i) => i.rel === 'src/app.js').size > 0, hit.body.items);
  check.ok('files search skips node_modules', !hit.body.items.some((i) => i.rel.includes('node_modules')), hit.body.items);
  check.ok('files search keeps dot-folders on the allowlist', (await call('/cmdk/files', 'root=' + encodeURIComponent(root) + '&q=workflow')).body.items.some((i) => i.rel === '.github/workflow.yml'), null);

  // Abbreviations still match, but only while the letters stay together:
  // `rdm` finds README.md, `rdm` must not pull in every long file name.
  const abbrev = await call('/cmdk/files', 'root=' + encodeURIComponent(root) + '&q=rdm');
  check.ok('abbreviations match a compact subsequence', abbrev.body.items.some((i) => i.name === 'README.md'), abbrev.body.items);
  check.ok('sparse subsequences are dropped', !abbrev.body.items.some((i) => i.name === 'util.mjs'), abbrev.body.items);

  const exact = await call('/cmdk/files', 'root=' + encodeURIComponent(root) + '&q=README.md');
  check.ok('basename exact match ranks first', exact.body.items[0].rel === 'README.md', exact.body.items.map((i) => i.rel));

  const shallow = await call('/cmdk/files', 'root=' + encodeURIComponent(root) + '&q=three&depth=1');
  check.ok('depth caps the walk', !shallow.body.items.some((i) => i.rel === 'deep/one/two/three.js'), shallow.body.items);
  const deep = await call('/cmdk/files', 'root=' + encodeURIComponent(root) + '&q=three&depth=6');
  check.ok('depth reaches the file', deep.body.items.some((i) => i.rel === 'deep/one/two/three.js'), deep.body.items);

  const capped = await call('/cmdk/files', 'root=' + encodeURIComponent(root) + '&q=e&limit=1');
  check.ok('limit caps the answer', capped.body.items.length === 1 && capped.body.truncated === true, capped.body);

  const rel = await call('/cmdk/files', 'root=' + encodeURIComponent('relative/path'));
  check.ok('relative root rejected', rel.status === 400, rel);
  const gone = await call('/cmdk/files', 'root=' + encodeURIComponent(path.join(root, 'nope')));
  check.ok('missing root rejected', gone.status === 400, gone);

  const dflt = await call('/cmdk/files');
  check.ok('root defaults without a param', dflt.status === 200 && !!dflt.body.root, dflt.body);
  check.ok('default root is absolute', path.isAbsolute(dflt.body.root), dflt.body.root);

  const getOnly = await call('/cmdk/open-profile', '', 'GET');
  check.ok('open-profile stays POST only', getOnly.status === 405, getOnly);
  fs.rmSync(root, { recursive: true, force: true });

  check.finish();
} catch (error) {
  console.error('  FAIL ' + error.message);
  process.exitCode = 1;
}
