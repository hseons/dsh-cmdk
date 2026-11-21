'use strict';

const { loadClient, createChecker, fakeCtx } = require('./helpers/client.cjs');

const check = createChecker('SETTINGS');
const { internals: T } = loadClient([
  'buildSettings',
  'buildActions',
  'readConfig',
  'writeConfig',
  'hotkeyFromEvent',
  'hotkeyLabel',
  'DEFAULT_CONFIG',
  'FONT_KEY',
]);

const ctx = fakeCtx();
const apply = (patch) => T.writeConfig(patch);
const rows = T.buildSettings(ctx, 'zh', apply);
const keys = rows.map((row) => row.key);

const EXPECTED = [
  'set:fulltext',
  'set:depth',
  'set:snippets',
  'set:limit',
  'set:frecency',
  'set:calc',
  'set:plugins',
  'set:clear-recent',
  'set:font',
  'set:theme',
  'set:lang',
  'set:hotkey',
  'set:reset',
];
check.ok('every setting is present', EXPECTED.every((key) => keys.includes(key)), keys);
check.ok('settings span five sections', new Set(rows.map((r) => r.group)).size === 5, rows.map((r) => r.group));

const defaults = T.readConfig();
check.ok('defaults ship sane', defaults.contentDepth === 40 && defaults.resultLimit === 24 && defaults.hotkey === 'mod+k', defaults);

// toggles
const fullText = rows.find((r) => r.key === 'set:fulltext');
check.ok('toggles show their state', fullText.badge === '开', fullText.badge);
const off = fullText.toggle();
check.ok('toggling reports without closing', off.keep === true && T.readConfig().fullText === false);
// rows are snapshots; the panel rebuilds them on every render
const fresh = () => T.buildSettings(ctx, 'zh', apply);
fresh().find((r) => r.key === 'set:fulltext').toggle();
check.ok('toggling back restores', T.readConfig().fullText === true);

// numeric rows
const depth = rows.find((r) => r.key === 'set:depth');
check.ok('numbers show their value', depth.badge === '40', depth.badge);
fresh().find((r) => r.key === 'set:depth').adjust(1);
check.ok('arrow keys step the value', T.readConfig().contentDepth === 41, T.readConfig().contentDepth);
fresh().find((r) => r.key === 'set:depth').adjust(-10);
check.ok('shift steps by ten', T.readConfig().contentDepth === 31, T.readConfig().contentDepth);
const asked = depth.run();
check.ok('typing opens an input with the range', asked.input && asked.input.title.indexOf('4') > 0 && asked.input.title.indexOf('200') > 0, asked.input && asked.input.title);
check.ok('out-of-range input is refused', asked.input.submit('9999').keep === true && T.readConfig().contentDepth <= 200);
check.ok('valid input lands', asked.input.submit('60').keep === true && T.readConfig().contentDepth === 60, T.readConfig().contentDepth);

// hotkey capture
const hotkey = rows.find((r) => r.key === 'set:hotkey');
check.ok('hotkey row shows the binding', hotkey.badge === T.hotkeyLabel(T.readConfig().hotkey), hotkey.badge);
check.ok('hotkey row asks for a key', hotkey.run().capture === 'hotkey');
check.ok('modifier keys are read', T.hotkeyFromEvent({ key: 'k', metaKey: true, ctrlKey: true }) === 'mod+k', T.hotkeyFromEvent({ key: 'k', metaKey: true, ctrlKey: true }));
check.ok('stacked modifiers work', T.hotkeyFromEvent({ key: 'P', metaKey: true, ctrlKey: true, shiftKey: true }) === 'mod+shift+p');
check.ok('plain letters are ignored', T.hotkeyFromEvent({ key: 'k' }) === null);
check.ok('bare modifiers are ignored', T.hotkeyFromEvent({ key: 'Shift', shiftKey: true }) === null);
check.ok('labels render for mac', T.hotkeyLabel('mod+k') === '⌘K', T.hotkeyLabel('mod+k'));

// reset
const reset = rows.find((r) => r.key === 'set:reset');
const resetResult = reset.run();
check.ok('reset restores the defaults', resetResult.keep === true && T.readConfig().contentDepth === T.DEFAULT_CONFIG.contentDepth, T.readConfig().contentDepth);

// entry point
const actions = T.buildActions(ctx, 'zh', apply);
const entry = actions.find((r) => r.key === 'cmd:settings');
check.ok('settings is the first action', actions[0].key === 'cmd:settings', actions[0].key);
const panel = entry.run().push;
check.ok('its rows are rebuilt on open', typeof panel.items === 'function');
check.ok('and it can be searched in place', panel.searchable === true);

check.finish();
