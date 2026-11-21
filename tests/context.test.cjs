'use strict';

const { loadClient, createChecker, fakeCtx } = require('./helpers/client.cjs');

const check = createChecker('CONTEXT');

let around = [];
const loader = loadClient(
  ['openContext', 'roleLabel', 'nextCtxSize', 'CTX_SIZES', 'buildRoot'],
  { fetch: async () => ({ ok: true, json: async () => ({ ok: true, targetSeq: 42, around }) }) },
);
const T = loader.internals;
const ctx = fakeCtx();

around = [
  { seq: 40, type: 'user/message', time: 1700000000000, text: 'first line\nsecond line', clipped: false },
  { seq: 42, type: 'assistant/message', time: 1700000001000, text: '答案在这里', clipped: false },
  { seq: 44, type: 'tool/result', time: 1700000002000, text: 'x'.repeat(10), clipped: true },
];

(async () => {
  const panel = await T.openContext(ctx, 'zh', 's1', 42, 2, '答案');
  const rows = panel.push.items;

  check.ok('one window row plus one row per message', rows.length === 4, rows.length);
  check.ok('window row comes first and is adjustable', rows[0].key === 'ctx:window' && typeof rows[0].adjust === 'function' && rows[0].badge === '2');

  const hit = rows.find((row) => row.key === 'ctx:42');
  check.ok('the matched message is marked', hit && hit.dot === true);
  check.ok('line breaks survive', rows.find((row) => row.key === 'ctx:40').body.includes('\n'));
  check.ok(
    'role labels follow the event type',
    rows.find((r) => r.key === 'ctx:40').title.indexOf('你') === 0 &&
      rows.find((r) => r.key === 'ctx:42').title.indexOf('助手') === 0 &&
      rows.find((r) => r.key === 'ctx:44').title.indexOf('工具') === 0,
  );
  check.ok('clipped messages say so', rows.find((r) => r.key === 'ctx:44').sub.indexOf('已截断') > 0);
  check.ok('the request carries the window', loader.requests[0].includes('before=2') && loader.requests[0].includes('after=2'));

  const actions = hit.actions();
  check.ok('four actions per message', actions.length === 4 && actions.map((a) => a.key.split(':')[1]).join(',') === 'fork,ask,copy,open');

  const wider = await rows[0].adjust(1);
  check.ok('stepping the window replaces the panel', wider && wider.replace && wider.replace.items.length >= 1);
  check.ok('stepping asked for five', loader.requests[1].includes('before=5'));
  check.ok('sizes cycle and clamp', T.nextCtxSize(2, 1) === 5 && T.nextCtxSize(5, 1) === 10 && T.nextCtxSize(10, 1) === 10 && T.nextCtxSize(2, -1) === 2);
  check.ok('unknown event types read as system', T.roleLabel('zh', 'turn/start') === '系统');

  around = [];
  const empty = await T.openContext(ctx, 'zh', 's1', 42, 2, '');
  check.ok('an empty window explains itself', empty.push.items.some((row) => row.key === 'ctx:empty'));

  check.finish();
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
