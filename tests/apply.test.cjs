'use strict';

const { loadClient, createChecker } = require('./helpers/client.cjs');

const check = createChecker('APPLY');
const { api, window: win } = loadClient([]);

const ctx = {
  slots: { inject: (name, fn) => { fn(); return () => {}; }, register: (spec, fn) => fn() },
  locale: { getLocale: () => ({ active: 'zh' }), subscribe: () => () => {} },
  sessions: {},
  uiWorkspace: {},
  workspaces: {},
  theme: {},
};

const dispose = api.apply(ctx);
const exposed = win.__DSH_CMDK__;

check.ok('plugin exposes a public handle', !!exposed);
check.ok('the handle is versioned', exposed.version === 2, exposed.version);
check.ok(
  'v2 surface is complete',
  ['register', 'unregister', 'registerProvider', 'unregisterProvider', 'listProviders', 'open', 'close'].every(
    (key) => typeof exposed[key] === 'function',
  ),
  Object.keys(exposed),
);

check.ok(
  'a provider is accepted',
  exposed.registerProvider({
    id: 'demo',
    title: { zh: '演示', en: 'Demo' },
    prefix: 'demo',
    commands: [{ id: 'demo.hello', title: 'Hello', run: () => ({ status: 'ok' }) }],
    search: async () => [],
  }) === true,
);
check.ok('and listed back', exposed.listProviders().some((row) => row.id === 'demo'));

check.ok('legacy single commands still register', exposed.register({ id: 'legacy', title: 'Legacy', run: () => undefined }) === true);
check.ok('unregistering a provider works', exposed.unregisterProvider('demo') === true && exposed.listProviders().length === 0);
check.ok('unknown providers report false', exposed.unregisterProvider('nope') === false);
check.ok('a provider without commands or search is refused', exposed.registerProvider({ id: 'empty' }) === false);
check.ok('a command without a run function is refused', exposed.registerProvider({ id: 'broken', commands: [{ id: 'x', title: 'X' }] }) === false);

dispose();
check.ok('disposing removes the handle', typeof win.__DSH_CMDK__ === 'undefined');

check.finish();
