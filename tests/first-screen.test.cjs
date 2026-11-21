'use strict';

const { loadClient, createChecker, fakeCtx } = require('./helpers/client.cjs');

const check = createChecker('FIRST SCREEN');
const { internals: T } = loadClient([
  'buildRoot',
  'buildUsage',
  'parseQuery',
  'relativeTime',
  'sessionItem',
  'bumpRecent',
  'readRecent',
]);

const ctx = fakeCtx();
const now = Date.now();
const catalog = [
  { sessionId: 's1', title: '登录改造', cwd: '/Users/mumu/code/api', at: now - 12 * 60000 },
  { sessionId: 's2', title: '缓存排查', cwd: '/Users/mumu/code/cache', at: now - 3 * 3600000 },
];
const workspaces = [{ workspaceId: 'w1', path: '/Users/mumu/code/api' }];

T.bumpRecent('session:s1');
T.bumpRecent('theme:dark');
T.bumpRecent('cmd:settings');
const recent = T.readRecent();

const root = (query, extra) =>
  T.buildRoot(ctx, 'zh', query, catalog, [], workspaces, recent, [], [], () => {}, {
    providers: [],
    extHits: [],
    config: { frecency: true, disabledProviders: [] },
    version: '',
    apply: () => {},
    ...extra,
  });

const first = root('', { parsed: T.parseQuery('') });
check.ok('sessions lead the first screen', first.some((r) => r.group === 'session'));
check.ok('system rows are folded away', !first.some((r) => r.group === 'system'));
check.ok('theme rows are folded away', !first.some((r) => r.group === 'theme'));
check.ok('one row holds everything else', first.filter((r) => r.key === 'more:all').length === 1);

const more = first.find((r) => r.key === 'more:all');
const parked = more.run().push.items;
check.ok('settings stay reachable', parked.some((r) => r.key === 'cmd:settings'));
check.ok('themes stay reachable', parked.some((r) => r.group === 'theme'));
check.ok('the badge matches the count', more.badge === String(parked.length), more.badge);

const switchWs = first.find((r) => r.key === 'more:workspace');
check.ok('workspaces get one entry point', !!switchWs);
check.ok('which opens a real panel', switchWs && switchWs.run().push.items.every((r) => r.group === 'workspace'));

check.ok('the recent band is capped at eight', first.filter((r) => r.group === 'recent').length <= 8);
check.ok('typing searches everything again', root('设置', { parsed: T.parseQuery('设置') }).some((r) => r.key === 'cmd:settings'));
check.ok('daily actions survive the fold', first.some((r) => r.key === 'cmd:new'));

// relative stamps
check.ok('minutes', T.relativeTime('zh', now - 12 * 60000) === '12 分钟前', T.relativeTime('zh', now - 12 * 60000));
check.ok('hours', T.relativeTime('zh', now - 5 * 3600000) === '5 小时前');
check.ok('yesterday', T.relativeTime('zh', now - 30 * 3600000) === '昨天');
check.ok('days', T.relativeTime('zh', now - 3 * 86400000) === '3 天前');
check.ok('just now', T.relativeTime('zh', now - 5000) === '刚刚');
check.ok('english', T.relativeTime('en', now - 12 * 60000) === '12m ago');
check.ok('missing timestamps stay quiet', T.relativeTime('zh', 0) === '');

const row = T.sessionItem(ctx, 'zh', catalog[0], { snippets: true });
check.ok('session rows lead with the stamp', row.sub.indexOf('12 分钟前') === 0, row.sub);
check.ok('and still show the path', row.sub.indexOf('api') > 0, row.sub);

// usage stats
const usage = T.buildUsage('zh');
check.ok('usage lists what was used', usage.length === 3, usage.map((r) => r.key));
check.ok('usage is weighted, not alphabetical', usage[0].key === 'usage:session:s1', usage[0].key);
check.ok('usage rows are read-only', usage.every((r) => typeof r.run !== 'function'));
check.ok('usage shows counts', usage.every((r) => r.badge));

const help = root('?', { parsed: T.parseQuery('?') });
check.ok('help links to the stats', help.some((r) => r.key === 'help:usage'));

// paging
const pageBase = {
  providers: [],
  extHits: [],
  config: { frecency: true, disabledProviders: [] },
  more: () => undefined,
};
const hit = [{ sessionId: 's9', title: 'T', cwd: '', at: now, seq: 3, snippet: 'snip' }];
const withNext = T.buildRoot(ctx, 'zh', 'x', [], hit, [], {}, [], [], () => {}, { ...pageBase, next: 'CUR', parsed: T.parseQuery('x') });
const withoutNext = T.buildRoot(ctx, 'zh', 'x', [], hit, [], {}, [], [], () => {}, { ...pageBase, next: null, parsed: T.parseQuery('x') });
check.ok('load-more appears only with a cursor', withNext.some((r) => r.key === 'session:more') && !withoutNext.some((r) => r.key === 'session:more'));

let asked = null;
const spied = T.buildRoot(ctx, 'zh', 'x', [], hit, [], {}, [], [], () => {}, { ...pageBase, next: 'CUR', parsed: T.parseQuery('x'), more: (n) => { asked = n; } });
spied.find((r) => r.key === 'session:more').run();
check.ok('load-more passes the needle along', asked === 'x', asked);

check.finish();
