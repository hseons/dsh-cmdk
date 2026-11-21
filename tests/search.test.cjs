'use strict';

const { loadClient, createChecker, fakeCtx } = require('./helpers/client.cjs');

const check = createChecker('SEARCH');
const { internals: T } = loadClient([
  'buildRoot',
  'buildActions',
  'parseQuery',
  'calc',
  'resolveProviderPrefix',
  'fuzzy',
  'scoreOf',
  'sessionItem',
  'readConfig',
  'writeConfig',
]);

const ctx = fakeCtx();

// --- query modes -----------------------------------------------------------
check.ok('plain query stays global', T.parseQuery('abc').mode === 'all');
check.ok('> narrows to commands', T.parseQuery('> abc').mode === 'command' && T.parseQuery('> abc').text === 'abc');
check.ok('@ narrows to sessions', T.parseQuery('@x').mode === 'session' && T.parseQuery('@x').text === 'x');
check.ok('# narrows to workspaces', T.parseQuery('# dsh').mode === 'workspace');
check.ok('? opens help', T.parseQuery('?').mode === 'help');
check.ok('= opens the calculator', T.parseQuery('= 1+1').mode === 'calc');

// --- calculator ------------------------------------------------------------
check.ok('precedence', T.calc('1+2*3') === '7', T.calc('1+2*3'));
check.ok('division', T.calc('10/4') === '2.5', T.calc('10/4'));
check.ok('caret is power', T.calc('2^10') === '1024', T.calc('2^10'));
check.ok('arbitrary code is refused', T.calc('alert(1)') === null);

// --- provider prefixes -----------------------------------------------------
const providers = [{ id: 'demo', prefix: 'demo', title: 'Demo', icon: 'plugin', commands: [] }];
const scoped = T.resolveProviderPrefix('demo hello', providers);
check.ok('prefix scopes the query', scoped.provider && scoped.provider.id === 'demo' && scoped.text === 'hello');
const plain = T.resolveProviderPrefix('hello world', providers);
check.ok('unknown prefix is not scoped', plain.provider === null && plain.text === 'hello world');

// --- root listing ----------------------------------------------------------
const catalog = [
  { sessionId: 's1', title: '修复登录', cwd: '/tmp/a', at: 1, snippet: '' },
  { sessionId: 's2', title: 'Refactor runner', cwd: '/tmp/b', at: 2, snippet: '' },
];
const hits = [{ sessionId: 's2', title: 'Refactor runner', cwd: '/tmp/b', at: 2, seq: 42, snippet: '…登录失败…', via: 'index' }];
const base = {
  providers,
  extHits: [],
  config: { contentDepth: 40, calc: true, frecency: true, disabledProviders: [] },
  version: '9.9.9',
  apply: () => {},
};
const root = (query, extra) =>
  T.buildRoot(ctx, 'zh', query, catalog, hits, [], {}, [], [], () => {}, { ...base, parsed: T.parseQuery(query), ...extra });

const r1 = root('登录');
check.ok('a search produces rows', r1.length > 0, r1.length);
check.ok('a content hit keeps its seq', r1.some((row) => row.key === 'session:s2:42'), r1.map((r) => r.key).join(','));
check.ok('every row declares a group', r1.every((row) => typeof row.group === 'string'));

const r2 = root('?');
check.ok('help lists keys and version', r2.some((r) => r.key === 'help:keys') && r2.some((r) => r.key === 'help:version'));

const r3 = root('= 6*7');
check.ok('calc mode returns the result only', r3.length === 1 && r3[0].title === '42', r3.map((r) => r.title));

const r4 = root('@ login');
check.ok('session mode drops actions', r4.every((row) => row.key.indexOf('session:') === 0), r4.map((r) => r.group).join(','));

const r5 = T.buildRoot(ctx, 'zh', 'x', null, null, null, null, null, null, () => {}, null);
check.ok('a null payload does not throw', Array.isArray(r5));

const extHit = [
  { id: 'demo.hit', providerId: 'demo', providerTitle: 'Demo', icon: 'plugin', title: '演示结果', subtitle: '', keywords: [], badge: '', score: null, run: () => undefined, actions: null, preview: null },
];
const r6 = root('demo hello', { extHits: extHit });
check.ok('provider hits show up scoped', r6.some((row) => row.key === 'demo:demo.hit'), r6.map((r) => r.key).join(','));
check.ok('provider scope hides global actions', !r6.some((row) => row.key.indexOf('cmd:') === 0));

// --- settings surface ------------------------------------------------------
const actions = T.buildActions(ctx, 'zh', () => {});
check.ok('font and depth commands exist', actions.some((r) => r.key === 'cmd:font-bigger') && actions.some((r) => r.key === 'cmd:depth'));
check.ok('settings panel is reachable', actions.some((r) => r.key === 'cmd:settings'));
check.ok('extensions panel is reachable', actions.some((r) => r.key === 'cmd:ext'));

T.writeConfig({ contentDepth: 999 });
check.ok('depth is clamped on write', T.readConfig().contentDepth === 200, T.readConfig().contentDepth);
T.writeConfig({ contentDepth: 12 });

check.finish();
