'use strict';

const { loadClient, createChecker, memoryStorage } = require('./helpers/client.cjs');

const check = createChecker('FILES');
const { internals: T, storage } = loadClient(
  [
    'buildFiles',
    'buildRoot',
    'parseQuery',
    'fileItem',
    'formatSize',
    'readFileRoot',
    'writeFileRoot',
    'readFileRecent',
    'bumpFileRecent',
    'workspaceForPath',
    'fileSearchUrl',
  ],
  { storage: memoryStorage() },
);

const started = [];
const picked = [];
const ctx = {
  uiWorkspace: {
    startSession: (workspaceId, options) => {
      started.push({ workspaceId, options });
    },
    pickDirectory: () => {
      picked.push(true);
      return '/Users/mumu/code/next';
    },
    openSession() {},
    openWorkspace() {},
  },
  sessions: { fork: async () => 'child' },
  theme: { setFontSize() {}, setTheme() {} },
  locale: {},
  workspaces: {},
  layout: {},
};

const workspaces = [
  { workspaceId: 'w1', path: '/Users/mumu/code/api' },
  { workspaceId: 'w2', path: '/Users/mumu/code' },
];

const build = (needle, state, langs) =>
  T.buildFiles(ctx, langs || 'zh', needle, state, workspaces);

const row = (rows, key) => rows.find((entry) => entry.key === key);

// --- routing ------------------------------------------------------------
check.ok('`/` parses as the file mode', T.parseQuery('/src').mode === 'file' && T.parseQuery('/src').text === 'src');
check.ok('bare `/` is the browse mode', T.parseQuery('/').text === '');

// --- request URL --------------------------------------------------------
check.ok('no root keeps one query string', T.fileSearchUrl('', '') === '/cmdk/files?limit=60', T.fileSearchUrl('', ''));
check.ok('root is the first param', T.fileSearchUrl('/tmp', '') === '/cmdk/files?root=%2Ftmp&limit=60', T.fileSearchUrl('/tmp', ''));
check.ok('needle is encoded', T.fileSearchUrl('/tmp', 'a b') === '/cmdk/files?root=%2Ftmp&limit=60&q=a%20b', T.fileSearchUrl('/tmp', 'a b'));

// --- size and path helpers ---------------------------------------------
check.ok('bytes', T.formatSize(900) === '900 B');
check.ok('kilobytes', T.formatSize(2048) === '2.0 KB');
check.ok('megabytes', T.formatSize(3 * 1024 * 1024) === '3.0 MB');

// --- empty state --------------------------------------------------------
const bare = build('', { root: '/Users/mumu/code/api', items: [], for: '', loading: false });
check.ok('browse offers the root row', !!row(bare, 'file:root'), bare.map((r) => r.key));
check.ok('browse offers to change root', !!row(bare, 'file:choose'));
check.ok('browse offers the parent folder', !!row(bare, 'file:parent'));
check.ok('browse with no children says so', !!row(bare, 'file:empty'));

const noRoot = build('', { root: '', items: [], for: '', loading: false });
check.ok('no root shows the prompt', !!row(noRoot, 'file:no-root'), noRoot.map((r) => r.key));
const chosen = row(noRoot, 'file:no-root').run();
check.ok('picking a root goes through the system dialog', picked.length === 1);
returned(chosen, 'choosing a root resets to browsing');

function returned(value, label) {
  Promise.resolve(value).then((result) => {
    check.ok(label, result && result.fileRoot === '/Users/mumu/code/next' && result.query === '/', result);
  });
}

// --- listing and actions ------------------------------------------------
const listing = build('', {
  root: '/Users/mumu/code/api',
  items: [
    { kind: 'dir', name: 'src', path: '/Users/mumu/code/api/src', rel: 'src', relDir: '', size: 0, mtime: 0 },
    { kind: 'file', name: 'README.md', path: '/Users/mumu/code/api/README.md', rel: 'README.md', relDir: '', size: 2048, mtime: Date.now() - 60000 },
  ],
  for: '',
  loading: false,
});
check.ok('folders render with a trailing slash', row(listing, 'file:/Users/mumu/code/api/src').title === 'src/');
check.ok('folders are marked for the icon', row(listing, 'file:/Users/mumu/code/api/src').dir === true);
const fileRow = row(listing, 'file:/Users/mumu/code/api/README.md');
check.ok('files show size and age', fileRow.sub.indexOf('2.0 KB') === 0 && fileRow.sub.indexOf('分钟前') > 0, fileRow.sub);
check.ok('files carry an @ badge, folders do not', fileRow.badge === '@' && !row(listing, 'file:/Users/mumu/code/api/src').badge);

const enterDir = row(listing, 'file:/Users/mumu/code/api/src').run();
check.ok('entering a folder returns the new root', enterDir && enterDir.fileRoot === '/Users/mumu/code/api/src' && enterDir.query === '/', enterDir);
check.ok('entering a folder is remembered', T.readFileRoot() === '/Users/mumu/code/api/src', T.readFileRoot());

const insert = fileRow.run();
Promise.resolve(insert).then((result) => {
  check.ok('insert opens a draft with the @reference', started[0].options.prompt === '@README.md ' && started[0].options.whenDraftExists === 'append', started[0]);
  check.ok('insert picks the workspace that owns the file', started[0].workspaceId === 'w1', started[0].workspaceId);
  check.ok('insert reports a status', result && /README\.md/.test(result.status), result);
  check.ok('insert remembers the file', T.readFileRecent().some((hit) => hit.path === '/Users/mumu/code/api/README.md'), T.readFileRecent());
});

const actions = fileRow.actions();
// The search root can sit above several workspaces: attribution must follow the
// file, not the root.
const outerRoot = build('', { root: '/Users/mumu/code', items: [], for: '', loading: false });
const outerFile = row(
  build('app', {
    root: '/Users/mumu/code',
    items: [{ kind: 'file', name: 'app.js', path: '/Users/mumu/code/api/app.js', rel: 'api/app.js', relDir: 'api', size: 1, mtime: 0 }],
    for: 'app',
    loading: false,
  }),
  'file:/Users/mumu/code/api/app.js',
);
Promise.resolve(outerFile.run()).then(() => {
  check.ok('insert attributes by file path, not by search root', started[1] && started[1].workspaceId === 'w1', started[1] && started[1].workspaceId);
  check.ok('insert uses the path relative to the root', started[1] && started[1].options.prompt === '@api/app.js ', started[1] && started[1].options.prompt);
});


check.ok('file actions include copy/reveal/open', ['copy', 'copyrel', 'reveal', 'open'].every((suffix) => actions.some((a) => a.key.indexOf(':' + suffix) > 0)), actions.map((a) => a.key));

// --- workspace attribution ----------------------------------------------
check.ok('a nested root maps to the deepest workspace', T.workspaceForPath(workspaces, '/Users/mumu/code/api/src').workspaceId === 'w1');
check.ok('an unrelated root maps to nothing', T.workspaceForPath(workspaces, '/tmp/elsewhere') === null);
const wins = [
  { workspaceId: 'win1', path: 'C:\\Users\\mumu\\code\\api' },
  { workspaceId: 'win2', path: 'C:\\Users\\mumu\\code' },
];
check.ok('windows separators still map to a workspace', (T.workspaceForPath(wins, 'C:\\Users\\mumu\\code\\api\\src') || {}).workspaceId === 'win1', T.workspaceForPath(wins, 'C:\\Users\\mumu\\code\\api\\src'));
check.ok('windows paths do not map across workspaces', T.workspaceForPath(wins, 'C:\\Users\\mumu\\codex') === null);

// A cancelled folder picker must leave the palette open, not run(undefined).
const keptRoot = T.readFileRoot();
T.writeFileRoot('');
const noRootRows = T.buildFiles(ctx, 'zh', '', { root: '', items: [], loading: false, for: '' }, workspaces);
T.writeFileRoot(keptRoot);
const pickRow = noRootRows.filter((entry) => entry.key === 'file:no-root')[0];
check.ok('no root prompts for a folder', !!pickRow, noRootRows.map((entry) => entry.key));
const cancelled = ctx.uiWorkspace.pickDirectory;
ctx.uiWorkspace.pickDirectory = () => undefined;
Promise.resolve(pickRow.run()).then((result) => {
  ctx.uiWorkspace.pickDirectory = cancelled;
  check.ok('cancelling the folder picker keeps the palette open', result && result.keep === true, result);
});

// --- recent files --------------------------------------------------------
T.bumpFileRecent('/Users/mumu/code/api/a.js', 'a.js', 'a.js');
T.bumpFileRecent('/Users/mumu/code/api/b.js', 'b.js', 'b.js');
T.bumpFileRecent('/Users/mumu/code/api/a.js', 'a.js', 'a.js');
const recent = T.readFileRecent();
check.ok('recent files dedupe and lead with the latest', recent.length === 2 && recent[0].path === '/Users/mumu/code/api/a.js', recent);
const withRecent = build('', { root: '/Users/mumu/code/api', items: [], for: '', loading: false });
check.ok('browse lists recent files', withRecent.filter((r) => r.key.indexOf('file:recent:') === 0).length === 2, withRecent.map((r) => r.key));
check.ok('recent rows are labelled', row(withRecent, 'file:recent:/Users/mumu/code/api/a.js').sub.indexOf('最近用过') === 0);

// --- typed search --------------------------------------------------------
const searching = build('app', { root: '/Users/mumu/code/api', items: [{ kind: 'file', name: 'app.js', path: '/Users/mumu/code/api/src/app.js', rel: 'src/app.js', relDir: 'src', size: 10, mtime: 0 }], for: 'app', loading: false });
check.ok('typed search hides the root controls', !row(searching, 'file:root'));
check.ok('typed search keeps the matches', !!row(searching, 'file:/Users/mumu/code/api/src/app.js'));
check.ok('typed search drops stale rows', !row(build('x', { root: '/r', items: [{ kind: 'file', name: 'old.js', path: '/r/old.js', rel: 'old.js', relDir: '', size: 0, mtime: 0 }], for: 'app', loading: false }), 'file:/r/old.js'));
check.ok('stale state shows a loading row', !!row(build('x', { root: '/r', items: [], for: 'app', loading: false }), 'file:loading'));

const truncated = build('app', { root: '/r', items: [], for: 'app', loading: false, truncated: true });
check.ok('truncation is reported', !!row(truncated, 'file:truncated'));

const failed = build('app', { root: '/r', items: [], for: 'app', loading: false, error: 'HTTP 400' });
check.ok('errors replace the empty state', !!row(failed, 'file:error') && !row(failed, 'file:empty'), failed.map((r) => r.key));

// --- buildRoot delegates -------------------------------------------------
const delegated = T.buildRoot(ctx, 'zh', '/app', [], [], workspaces, {}, [], [], () => {}, {
  parsed: T.parseQuery('/app'),
  providers: [],
  extHits: [],
  config: { disabledProviders: [] },
  files: { root: '/Users/mumu/code/api', items: [], for: 'app', loading: false },
});
check.ok('buildRoot routes file mode to the file panel', delegated.every((r) => r.group === 'file'), delegated.map((r) => r.group));

setTimeout(() => {
  try {
    check.finish();
  } catch (error) {
    console.error('  FAIL ' + error.message);
    process.exitCode = 1;
  }
}, 20);
