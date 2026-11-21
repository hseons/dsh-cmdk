'use strict';

const { loadClient, createChecker, fakeCtx } = require('./helpers/client.cjs');

const check = createChecker('EXTENSIONS');
const { internals: T } = loadClient([
  'buildProvidersPanel',
  'buildProviderDetail',
  'filterPanelRows',
  'buildRoot',
  'readConfig',
  'writeConfig',
  'registerProvider',
  'unregisterProvider',
  'listProviders',
  'providers',
]);

const ctx = fakeCtx();
const lang = 'zh';
const cmd = (id, title) => ({ id, title, run: () => undefined });

// Nothing registered yet: one hint row plus the docs entry.
const bare = T.buildProvidersPanel(ctx, lang, () => {});
check.ok('empty state is hint plus docs', bare.length === 2 && bare[1].key === 'ext:docs', bare.map((r) => r.key));

T.registerProvider({ id: 'zeta', title: 'Zeta', prefix: 'z', commands: [cmd('one', 'One')] });
T.registerProvider({ id: 'alpha', title: { zh: '阿尔法', en: 'Alpha' }, commands: [cmd('a1', 'A1'), cmd('a2', 'A2')], search: async () => [] });

const apply = (patch) => T.writeConfig(patch);
const rows = T.buildProvidersPanel(ctx, lang, apply);
const names = rows.map((r) => r.key);
check.ok('providers are listed alphabetically', names[0] === 'ext:provider:alpha' && names[1] === 'ext:provider:zeta', names);
check.ok('badges show command counts', rows.find((r) => r.key === 'ext:provider:alpha').badge.indexOf('2') === 0, rows.find((r) => r.key === 'ext:provider:alpha').badge);
check.ok('search support is spelled out', rows.find((r) => r.key === 'ext:provider:alpha').sub.indexOf('搜索') >= 0);
check.ok('docs row is last', names[names.length - 1] === 'ext:docs');

const detail = rows.find((r) => r.key === 'ext:provider:alpha').run().push;
check.ok('detail panel is searchable', detail.searchable === true);
const detailItems = typeof detail.items === 'function' ? detail.items() : detail.items;
const detailKeys = detailItems.map((r) => r.key);
check.ok('detail exposes toggle, copy and commands', ['ext:toggle:alpha', 'ext:copy:alpha', 'ext:cmd:alpha:a1', 'ext:cmd:alpha:a2'].every((k) => detailKeys.includes(k)), detailKeys);

const toggle = detailItems.find((r) => r.key === 'ext:toggle:alpha');
const off = toggle.run(apply);
check.ok('disabling reports back', off.keep === true && off.status);
check.ok('disable is persisted', T.readConfig().disabledProviders.indexOf('alpha') >= 0);

const parked = T.buildProvidersPanel(ctx, lang, apply).find((r) => r.key === 'ext:provider:alpha');
check.ok('a parked provider is visibly disabled', parked.dot === false && parked.badge === '已停用', parked.badge);
check.ok('a parked provider keeps its detail', typeof parked.run === 'function');

const root = T.buildRoot(ctx, lang, 'a1', [], [], [], {}, [], [], () => {}, {
  providers: T.providers,
  extHits: [],
  config: T.readConfig(),
  version: '9.9.9',
  apply,
});
check.ok('a parked provider contributes nothing', !root.some((row) => row.key && row.key.indexOf('alpha:') === 0));

// the panel rebuilds its rows on every render, so the toggle is re-read
const reopened = T.buildProvidersPanel(ctx, lang, apply).find((r) => r.key === 'ext:provider:alpha').run().push;
const reopenedRows = typeof reopened.items === 'function' ? reopened.items() : reopened.items;
reopenedRows.find((r) => r.key === 'ext:toggle:alpha').run();
check.ok('re-enabling clears the parking spot', T.readConfig().disabledProviders.length === 0);
const back = T.buildRoot(ctx, lang, 'a1', [], [], [], {}, [], [], () => {}, {
  providers: T.providers,
  extHits: [],
  config: T.readConfig(),
  version: '9.9.9',
  apply,
});
check.ok('re-enabled commands come back', back.some((row) => row.key && row.key.indexOf('alpha:') === 0), back.map((r) => r.key).join(','));

// Panel search
const settingsRows = T.buildRoot(ctx, lang, '设置', [], [], [], {}, [], [], () => {}, { providers: [], extHits: [], config: T.readConfig(), version: '', apply });
const panelRows = [{ key: 'set:font', group: 'setLook', title: '字号', sub: '', run: () => undefined }];
check.ok('empty search keeps every row', T.filterPanelRows(panelRows, '').length === 1);
check.ok('chinese narrows', T.filterPanelRows(panelRows, '字号').length === 1);
check.ok('pinyin narrows', T.filterPanelRows(panelRows, 'zh').length === 1);
check.ok('nonsense yields nothing', T.filterPanelRows(panelRows, 'zzzz').length === 0);
check.ok('settings are still searchable from the root', settingsRows.some((row) => row.key === 'cmd:settings'));

T.unregisterProvider('alpha');
T.unregisterProvider('zeta');
check.ok('unregister empties the list', T.listProviders().length === 0);

check.finish();
