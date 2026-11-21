'use strict';

const { loadClient, createChecker, fakeCtx } = require('./helpers/client.cjs');

const { ok, finish } = createChecker('JUMP');

function makeDocument(hits) {
  const parent = { style: {}, scrollIntoView() {}, scrolled: 0 };
  let at = 0;
  return {
    parent,
    querySelector(selector) {
      return selector === '[data-conversation-scroll]' ? { root: true } : null;
    },
    createTreeWalker() {
      return {
        nextNode() {
          if (at >= hits.length) return null;
          const value = hits[at];
          at += 1;
          return { nodeValue: value, parentElement: parent };
        },
      };
    },
  };
}

// --- probe ------------------------------------------------------------------
{
  const { internals: T } = loadClient(['jumpProbe', 'jumpFindNode', 'jumpToMessage', 'sessionActions']);

  ok('probe collapses whitespace', T.jumpProbe('  a\n\n  b\t c  ') === 'a b c');
  ok('probe caps at 32 chars', T.jumpProbe('x'.repeat(80)).length === 32);
  ok('probe tolerates null', T.jumpProbe(null) === '');
  ok('probe tolerates a non-string', T.jumpProbe({}) === '');
}

// --- node lookup ------------------------------------------------------------
{
  const doc = makeDocument(['short', '一段包含登录 失败 的正文，足够长了']);
  const { internals: T } = loadClient(['jumpFindNode'], { document: doc });
  ok('finds the matching text node', T.jumpFindNode('一段包含登录') === doc.parent);
  ok('misses return null', T.jumpFindNode('完全不存在的片段啊啊啊') === null);
}

{
  // No scroller in the page: the session view has not rendered yet.
  const doc = { querySelector: () => null, createTreeWalker: () => ({ nextNode: () => null }) };
  const { internals: T } = loadClient(['jumpFindNode'], { document: doc });
  ok('no scroller means no node', T.jumpFindNode('一段包含登录 失败 的正文') === null);
}

{
  // Texts shorter than the guard are skipped so a stray "ok" cannot match.
  const doc = makeDocument(['ok', 'ok again']);
  const { internals: T } = loadClient(['jumpFindNode'], { document: doc });
  ok('short texts are ignored', T.jumpFindNode('ok') === null);
}

// --- jumping ----------------------------------------------------------------
{
  const calls = [];
  const ctx = fakeCtx();
  ctx.uiWorkspace.openSession = (id) => calls.push(id);
  const timers = [];
  const { internals: T } = loadClient(['jumpToMessage', 'sessionActions'], {
    document: makeDocument(['一段包含登录 失败 的正文，足够长了']),
    setInterval: (fn, ms) => {
      timers.push({ fn, ms });
      return timers.length;
    },
    clearInterval: (id) => calls.push('clear:' + id),
    setTimeout: () => 0,
  });

  const short = T.jumpToMessage(ctx, 'zh', 's1', 42, '#42');
  ok('short snippet never polls', timers.length === 0);
  ok('short snippet still opens the session', calls[0] === 's1');
  ok('short snippet reports why', short.status === '这条命中没有可定位的片段');

  const result = T.jumpToMessage(ctx, 'zh', 's2', 43, '一段包含登录 失败 的正文');
  ok('long snippet arms a poll', timers.length === 1);
  ok('poll interval is 140ms', timers[0].ms === 140);
  ok('long snippet reports progress', result.status === '正在定位这条消息…');

  timers[0].fn();
  ok('a match stops the poll', calls.indexOf('clear:1') >= 0);

  const actions = T.sessionActions(ctx, 'zh', { sessionId: 's3', title: 't', at: Date.now(), seq: 7, snippet: '一段包含登录 失败 的正文' });
  const jump = actions.find((row) => row.key === 'action:jump');
  ok('the session offers a jump action', Boolean(jump));
  ok('jump sits right after fork', actions.indexOf(jump) === actions.findIndex((row) => row.key === 'action:fork-here') + 1);
  ok('jump carries a hint', typeof jump.sub === 'string' && jump.sub.length > 0);

  const plain = T.sessionActions(ctx, 'zh', { sessionId: 's4', title: 't', at: Date.now() });
  ok('a hitless session has no jump action', !plain.some((row) => row.key === 'action:jump'));
}


// --- giving up --------------------------------------------------------------
{
  const cleared = [];
  const timers = [];
  const ctx = fakeCtx();
  ctx.uiWorkspace.openSession = () => {};
  const { internals: T } = loadClient(['jumpToMessage'], {
    document: { querySelector: () => null, createTreeWalker: () => ({ nextNode: () => null }) },
    setInterval: (fn, ms) => {
      timers.push({ fn, ms });
      return timers.length;
    },
    clearInterval: (id) => cleared.push(id),
    setTimeout: () => 0,
  });

  T.jumpToMessage(ctx, 'zh', 's9', 1, '一段足够长的正文用于探测命中位置');
  for (let i = 0; i < 25; i += 1) timers[0].fn();
  ok('the poll keeps going while it is still short of the cap', cleared.length === 0);

  timers[0].fn();
  ok('the 26th empty poll gives up', cleared.length === 1);
}

finish();
