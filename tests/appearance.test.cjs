'use strict';

/**
 * The look of the list: one hue per group, a marker on the selected row, and
 * the mode chip in the header. These are pure functions, so they are asserted
 * directly rather than through a rendered DOM.
 */

const { loadClient, createChecker } = require('./helpers/client.cjs');

const check = createChecker('APPEARANCE');
const { internals: T } = loadClient(['GROUP_TINTS', 'GROUP_ORDER', 'tintOf', 'modeTint', 'renderRow', 'item']);

const noop = () => {};

try {
  const groups = ['recent', 'session', 'workspace', 'plugin', 'action', 'theme', 'system', 'ext'];
  check.ok(
    'every group has a tint',
    groups.every((group) => typeof T.GROUP_TINTS[group] === 'string'),
    Object.keys(T.GROUP_TINTS),
  );
  check.ok(
    'settings groups have a tint',
    ['setSearch', 'setBehavior', 'setLook', 'setKeys', 'setMaint'].every(
      (group) => typeof T.GROUP_TINTS[group] === 'string',
    ),
  );
  check.ok(
    'every ordered group resolves to a tint',
    T.GROUP_ORDER.every((group) => typeof T.tintOf({ key: '', group }) === 'string'),
    T.GROUP_ORDER.filter((group) => !T.tintOf({ key: '', group })),
  );

  check.ok('session tint', T.tintOf({ key: 'session:abc' }) === T.GROUP_TINTS.session);
  check.ok('context rows reuse the session tint', T.tintOf({ key: 'ctx:42' }) === T.GROUP_TINTS.session);
  check.ok('theme rows are pink', T.tintOf({ key: 'theme:dark' }) === T.GROUP_TINTS.theme);
  check.ok('language rows share the theme tint', T.tintOf({ key: 'lang:zh' }) === T.GROUP_TINTS.theme);
  check.ok('extension rows are orange', T.tintOf({ key: 'ext:provider:git' }) === T.GROUP_TINTS.ext);
  check.ok('docs rows share the extension tint', T.tintOf({ key: 'docs:snippet' }) === T.GROUP_TINTS.ext);
  check.ok('calc rows are teal', T.tintOf({ key: 'calc:result' }) === T.GROUP_TINTS.calc);
  check.ok('help rows are violet', T.tintOf({ key: 'help:usage' }) === T.GROUP_TINTS.help);
  check.ok('unknown keys fall back to the action tint', T.tintOf({ key: 'nonsense' }) === T.GROUP_TINTS.action);
  check.ok('a missing entry does not throw', T.tintOf(null) === T.GROUP_TINTS.action);

  check.ok('command mode is green', T.modeTint('command') === T.GROUP_TINTS.action);
  check.ok('session mode is indigo', T.modeTint('session') === T.GROUP_TINTS.session);
  check.ok('workspace mode is blue', T.modeTint('workspace') === T.GROUP_TINTS.workspace);
  check.ok('file mode is blue', T.modeTint('file') === T.GROUP_TINTS.file);
  check.ok('calc mode is teal', T.modeTint('calc') === T.GROUP_TINTS.calc);
  check.ok('help mode is violet', T.modeTint('help') === T.GROUP_TINTS.help);

  const row = T.item('session:abc', 'session', '登录问题', '3 小时前 · code/api', noop, null);
  const plain = T.renderRow(row, false, noop, noop, noop, 0, 'more', '');
  const chosen = T.renderRow(row, true, noop, noop, noop, 3, 'more', '');

  check.ok('an idle row has no marker', plain.children[0] === null, plain.children[0]);
  const marker = chosen.children[0];
  check.ok('the selected row carries a marker', marker && marker.props.style.width === 2.5, marker && marker.type);
  check.ok(
    'the marker uses the group tint',
    marker.props.style.background === T.GROUP_TINTS.session,
    marker.props.style.background,
  );
  check.ok(
    'the selected row is tinted, not just outlined',
    String(chosen.props.style.background).indexOf('color-mix') >= 0,
    chosen.props.style.background,
  );
  check.ok(
    'rows fade in with a stagger, capped so long lists do not crawl',
    chosen.props.style.animationDelay === '33ms' && plain.props.style.animationDelay === '0ms',
    [plain.props.style.animationDelay, chosen.props.style.animationDelay],
  );
  const tile = (chosen.children.find((child) => child && child.props && child.props.tint) || {}).props;
  check.ok('the icon tile receives the same tint', tile && tile.tint === T.GROUP_TINTS.session, tile && tile.tint);
  check.ok('the icon tile is a rounded square', tile && tile.active === true);

  check.finish();
} catch (error) {
  console.error('  FAIL ' + (error && error.message));
  process.exitCode = 1;
}
