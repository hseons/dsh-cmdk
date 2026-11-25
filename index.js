/**
 * dsh-cmdk — host half.
 *
 * The palette itself is client-only (navigation, theme and workspace state all
 * live on the Client side). The Host half exists for the things a browser
 * sandbox cannot reach:
 *
 *   GET  /cmdk/info           → where this profile lives (home + profile dir)
 *   GET  /cmdk/sessions?q=    → full session catalogue + message-content hits
 *   GET  /cmdk/message        → the turns around one message (seq) of a session
 *   GET  /cmdk/files?root=    → workspace file index for the `/` prefix
 *   POST /cmdk/open-profile   → reveal the profile directory in Finder/Explorer
 *   GET  /cmdk/plugins        → installed bundles (name, version, enabled, dir)
 *   POST /cmdk/plugin         → enable/disable one bundle via pluginManager
 *
 * Every route goes through the connection trust fence first, so a random page
 * cannot probe the host filesystem through the loopback port.
 */
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const name = 'dsh-cmdk';
export const inject = ['webServer'];

const ROUTE = '/cmdk';

/** How long the session title catalogue stays warm between keystrokes. */
const CATALOG_TTL = 20_000;
const CATALOG_SIZE = 120;
/** How many of the newest sessions the content scan looks at per query. */
const DEFAULT_DEPTH = 40;
const MAX_DEPTH = 200;
/** Context rows are truncated at this many characters. */
const MAX_CONTEXT_CHARS = 4000;

/** The version this file ships with, read once from the package manifest. */
const PACKAGE_VERSION = (() => {
  try {
    const raw = fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8');
    const parsed = JSON.parse(raw);
    return typeof parsed.version === 'string' ? parsed.version : '';
  } catch {
    return '';
  }
})();

let catalogCache = { at: 0, items: [] };
/** Query → content hits, so held-down keys do not rescan the logs every 180 ms. */
const contentCache = new Map();
const CONTENT_TTL = 60_000;

function dshHome() {
  const fromEnv = process.env.DSH_HOME;
  return fromEnv && fromEnv.trim() ? fromEnv : path.join(os.homedir(), '.dsh');
}

/** Best-effort running profile directory (same order as the rest of the UI): env dir → env name → desktop. */
function profileDir() {
  const dir = process.env.DSH_PROFILE_DIR;
  if (dir && dir.trim()) return dir;
  const profile = process.env.DSH_PROFILE;
  if (profile && profile.trim()) return path.join(dshHome(), 'profiles', profile);
  return path.join(dshHome(), 'profiles', 'desktop');
}

function sendJson(res, code, payload) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8');
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': String(body.length),
  });
  res.end(body);
}

function readBody(req, limit = 16 * 1024) {
  return new Promise((resolve) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        req.destroy();
        resolve('');
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', () => resolve(''));
  });
}

/** Returns true when the request was already rejected (and answered). */
function refused(ctx, req, res) {
  const conn = ctx.get('connection') || ctx.connection;
  if (!conn || typeof conn.requestRejection !== 'function') return false;
  const code = conn.requestRejection({ headers: req.headers });
  if (code === undefined || code === null || code === false) return false;
  res.statusCode = typeof code === 'number' ? code : 403;
  res.end();
  return true;
}

function openInFileManager(target, options) {
  const reveal = !!(options && options.reveal);
  let command;
  let args;
  if (process.platform === 'darwin') {
    // `open -R` selects the file in its parent folder; without it `open` would
    // launch whatever app owns the extension, which is not what "reveal" means.
    command = 'open';
    args = reveal ? ['-R', target] : [target];
  } else if (process.platform === 'win32') {
    command = 'explorer';
    args = reveal ? ['/select,' + target] : [target];
  } else {
    command = 'xdg-open';
    args = [reveal ? path.dirname(target) : target];
  }
  return new Promise((resolve, reject) => {
    execFile(command, args, (error) => (error ? reject(error) : resolve()));
  });
}

/** Session ids are brand types at the type level but plain strings at runtime. */
function idOf(record) {
  return record && record.header && record.header.id ? String(record.header.id) : '';
}

/** Fold titles for a batch of ids; missing titles come back as ''. */
async function titlesFor(query, ids) {
  const out = new Map();
  if (!ids.length || typeof query.readTitleSnapshots !== 'function') return out;
  let results = [];
  try {
    results = await query.readTitleSnapshots(ids);
  } catch {
    return out;
  }
  for (const result of results || []) {
    if (!result || result.status !== 'fulfilled' || !result.value || !result.value.title) continue;
    const title = result.value.title.title;
    if (typeof title === 'string' && title.trim()) out.set(String(result.sessionId), title.trim());
  }
  return out;
}

/**
 * Human-facing sessions: no subagent branches, no seeded placeholders, and
 * never more than CATALOG_SIZE entries. Cached briefly so typing in the
 * palette does not re-read every log on each keystroke.
 */
async function sessionCatalog(ctx) {
  const now = Date.now();
  if (now - catalogCache.at < CATALOG_TTL && catalogCache.items.length) return catalogCache.items;

  const query = ctx.get('sessionQuery');
  if (!query || typeof query.listSessions !== 'function') return [];

  let records = [];
  try {
    records = await query.listSessions();
  } catch {
    return catalogCache.items;
  }

  const picked = (records || [])
    .filter((record) => {
      const header = record && record.header;
      if (!header || !header.id) return false;
      if (header.origin === 'subagent' || header.parentSession) return false;
      if (header.isSeeded) return false;
      return true;
    })
    .slice(0, CATALOG_SIZE);

  const titles = await titlesFor(query, picked.map(idOf).filter(Boolean));
  const items = picked
    .map((record) => {
      const sessionId = idOf(record);
      return {
        sessionId,
        title: titles.get(sessionId) || '',
        cwd: record.header && record.header.cwd ? record.header.cwd : '',
        at: record.header && record.header.createdAt ? record.header.createdAt : 0,
        snippet: '',
      };
    })
    .filter((item) => item.sessionId);

  catalogCache = { at: now, items };
  return items;
}

/**
 * Content hits. The SQLite full-text index can be empty in the wild (the
 * native session search reports "no matches" on such machines), so this walks
 * the newest sessions and uses the backend-independent `filterEvents` text
 * predicate instead: no index required, just the session logs.
 */
async function matchContent(ctx, text, limit, depth, cursor) {
  const query = ctx.get('sessionQuery');
  if (!query || text.length < 2) return { hits: [], next: null };

  const scanSize = Math.max(4, Math.min(MAX_DEPTH, Number(depth) || DEFAULT_DEPTH));
  const cursorParam = typeof cursor === 'string' ? cursor : '';
  const key = text + '\u0000' + String(scanSize) + '\u0000' + cursorParam;
  const cached = contentCache.get(key);
  if (cached && Date.now() - cached.at < CONTENT_TTL) {
    return { hits: cached.items.slice(0, limit), next: cached.next || null };
  }

  let hits = [];
  let next = null;

  // Indexed search first: it reports the seq of the matching message, so the
  // palette can jump to that turn instead of dumping you at the session top.
  if (typeof query.searchSessions === 'function') {
    try {
      const request = cursorParam ? { query: text, limit, cursor: cursorParam } : { query: text, limit };
      const found = await query.searchSessions(request);
      next = found && found.nextCursor ? String(found.nextCursor) : null;
      const rows = Array.isArray(found && found.items) ? found.items : [];
      const catalog = await sessionCatalog(ctx);
      const titles = new Map(catalog.map((item) => [item.sessionId, item.title]));
      hits = rows
        .map((row) => {
          const sessionId = idOf(row);
          const header = row && row.header ? row.header : {};
          const match = row && row.bestMatch ? row.bestMatch : null;
          return {
            sessionId,
            title: titles.get(sessionId) || '',
            cwd: header.cwd || '',
            at: header.createdAt || 0,
            seq: match && Number.isFinite(match.seq) ? match.seq : null,
            snippet: match && typeof match.snippet === 'string' ? match.snippet : '',
            via: 'index',
          };
        })
        .filter((item) => item.sessionId);
    } catch {
      hits = [];
    }
  }

  // Fallback: the full-text index can be empty in the wild, so walk the newest
  // sessions with the backend-independent text predicate. `depth` decides how
  // far back this goes; it is the one knob behind the "search depth" setting.
  if (!hits.length && !cursorParam && typeof query.filterEvents === 'function') {
    const catalog = await sessionCatalog(ctx);
    const scan = catalog.slice(0, scanSize);
    for (const item of scan) {
      let documents = [];
      try {
        documents = await query.filterEvents(item.sessionId, [{ kind: 'text', text }]);
      } catch {
        continue;
      }
      if (!Array.isArray(documents) || !documents.length) continue;
      const doc = documents.find((entry) => entry && typeof entry.text === 'string');
      if (!doc) continue;
      hits.push({
        sessionId: item.sessionId,
        title: item.title,
        cwd: item.cwd,
        at: item.at,
        seq: Number.isFinite(doc.seq) ? doc.seq : null,
        snippet: snippetAround(doc.text, text),
        via: 'scan',
      });
      if (hits.length >= limit) break;
    }
  }

  if (contentCache.size > 40) contentCache.clear();
  contentCache.set(key, { at: Date.now(), items: hits, next });
  return { hits, next };
}

/** Concatenated text blocks of one message-ish object. */
function blocksText(container) {
  if (!container || typeof container !== 'object') return '';
  const blocks = Array.isArray(container.content) ? container.content : null;
  if (!blocks) return '';
  const parts = [];
  for (const block of blocks) {
    if (block && block.type === 'text' && typeof block.text === 'string' && block.text.trim()) {
      parts.push(block.text);
    }
  }
  return parts.join('\n');
}

/**
 * Best-effort text of one session event.
 *
 * Session logs store messages as `{ type, seq, time, data }`, and the text sits
 * in `data.content[]` (user/developer) or `data.message.content[]`
 * (assistant/tool). Older call sites used `payload.text`, which never matches a
 * real log — the context panel silently rendered empty rows because of it.
 */
function eventText(event) {
  if (!event || typeof event !== 'object') return '';
  const data = event.data && typeof event.data === 'object' ? event.data : null;
  const candidates = [data, data && data.message, event.payload, event.message, event];
  for (const container of candidates) {
    const text = blocksText(container);
    if (text) return text;
  }
  for (const container of candidates) {
    if (!container || typeof container !== 'object') continue;
    if (typeof container.text === 'string' && container.text.trim()) return container.text;
  }
  return '';
}

/** 40 chars either side of the match, whitespace collapsed. */
function snippetAround(text, needle) {
  const flat = String(text || '').replace(/\s+/g, ' ');
  const at = flat.toLowerCase().indexOf(String(needle).toLowerCase());
  if (at < 0) return flat.slice(0, 120);
  const from = Math.max(0, at - 40);
  const to = Math.min(flat.length, at + needle.length + 60);
  return (from > 0 ? '…' : '') + flat.slice(from, to) + (to < flat.length ? '…' : '');
}


function workspaceStorePath() {
  return path.join(dshHome(), 'storages', 'workspace.json');
}

/** Workspaces live in the Client store; read the same file without touching it. */
function readWorkspaces() {
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(workspaceStorePath(), 'utf8'));
  } catch {
    return { items: [], archived: [] };
  }
  if (!raw || typeof raw !== 'object') return { items: [], archived: [] };
  const global = raw.global && typeof raw.global === 'object' ? raw.global : {};
  const table = (raw.tables && raw.tables.workspaces) || {};
  const items = [];
  for (const id of Array.isArray(global.workspaceIds) ? global.workspaceIds : Object.keys(table)) {
    const row = table[id];
    if (!row) continue;
    items.push({
      workspaceId: id,
      title: typeof row.title === 'string' ? row.title : '',
      path: typeof row.path === 'string' ? row.path : '',
      sessionIds: Array.isArray(row.sessionIds) ? row.sessionIds : [],
    });
  }
  return {
    items,
    archived: Array.isArray(global.archivedSessionIds) ? global.archivedSessionIds.slice() : [],
  };
}

/**
 * The `/` prefix browses the filesystem, which the browser sandbox cannot see.
 * The Host indexes one root at a time and hands back a flat ranked list.
 * Every dimension is bounded — depth, files scanned, wall clock, per-directory
 * entries — because a palette search must never stall the whole server.
 */
const FILE_SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  '.turbo',
  '.cache',
  'coverage',
  '__pycache__',
  '.venv',
  'venv',
  'target',
  'vendor',
  '.gradle',
  '.idea',
  'Pods',
  'DerivedData',
]);
/** Dot-folders worth searching; every other dot-folder is noise. */
const FILE_KEEP_HIDDEN = new Set(['.github', '.claude', '.cursor', '.dsh']);
const FILE_DEFAULT_DEPTH = 6;
const FILE_MAX_DEPTH = 12;
const FILE_DEFAULT_LIMIT = 40;
const FILE_MAX_LIMIT = 120;
const FILE_MAX_SCAN = 15000;
const FILE_MAX_MS = 400;
const FILE_MAX_PER_DIR = 2000;
const FILE_MAX_QUERY = 200;

/** An absolute, existing, fully resolved directory — or '' for "not usable". */
function normalizeRoot(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  const raw = value.trim();
  if (!path.isAbsolute(raw)) return '';
  try {
    const real = fs.realpathSync(raw);
    return fs.statSync(real).isDirectory() ? real : '';
  } catch {
    return '';
  }
}

/** The root a bare `/` opens with: first workspace, newest session, home. */
async function defaultFileRoot(ctx) {
  const workspaces = readWorkspaces();
  for (const workspace of workspaces.items) {
    const root = normalizeRoot(workspace.path);
    if (root) return root;
  }
  const catalog = await sessionCatalog(ctx).catch(() => []);
  for (const entry of catalog) {
    const root = normalizeRoot(entry.cwd);
    if (root) return root;
  }
  return os.homedir();
}

/**
 * Rank one path against the typed needle. Basename matches beat directory
 * matches; a basename subsequence (`rdm` → `README.md`) is the last resort and
 * still beats "no match".
 */
function fileScore(needle, name, rel) {
  const base = name.toLowerCase();
  if (base === needle) return 6;
  if (base.indexOf(needle) === 0) return 5;
  if (base.indexOf(needle) >= 0) return 4;
  if (rel.indexOf(needle) >= 0) return 3;
  let at = 0;
  let first = -1;
  let last = -1;
  for (let i = 0; i < base.length && at < needle.length; i += 1) {
    if (base.charAt(i) === needle.charAt(at)) {
      if (first < 0) first = i;
      last = i;
      at += 1;
    }
  }
  // A subsequence only counts while it stays compact: `capi` should find
  // GameKKCAPI, not every file whose letters happen to appear in order.
  if (at !== needle.length || last - first + 1 > needle.length * 2 + 2) return 0;
  return 1;
}

function fileRow(root, full, name, kind, score) {
  const rel = path.relative(root, full).split(path.sep).join('/');
  let stat = null;
  if (kind === 'file') {
    try {
      stat = fs.statSync(full);
    } catch {
      stat = null;
    }
  }
  const relDir = path.posix.dirname(rel);
  return {
    kind,
    name,
    path: full,
    rel,
    relDir: relDir === '.' ? '' : relDir,
    size: stat ? stat.size : 0,
    mtime: stat ? Math.round(stat.mtimeMs) : 0,
    score: score || 0,
  };
}

function readDirSafe(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.length > FILE_MAX_PER_DIR ? entries.slice(0, FILE_MAX_PER_DIR) : entries;
  } catch {
    return [];
  }
}

/** Kind of one directory entry; directory symlinks are skipped (cycle risk). */
function entryKind(entry, full) {
  if (entry.isDirectory()) return 'dir';
  if (entry.isFile()) return 'file';
  if (entry.isSymbolicLink()) {
    try {
      const stat = fs.statSync(full);
      return stat.isFile() ? 'file' : 'skip';
    } catch {
      return 'skip';
    }
  }
  return 'skip';
}

function scanFiles(root, options) {
  const needle = String(options.query || '').toLowerCase();
  const limit = options.limit;
  const depth = options.depth;
  const started = Date.now();
  const items = [];
  let scanned = 0;
  let truncated = false;
  let timedOut = false;

  if (!needle) {
    // Browsing: exactly one level, folders first, so Enter walks the tree
    // instead of dumping ten thousand descendants.
    for (const entry of readDirSafe(root)) {
      const full = path.join(root, entry.name);
      const kind = entryKind(entry, full);
      if (kind === 'skip') continue;
      if (kind === 'dir' && (FILE_SKIP_DIRS.has(entry.name) || (entry.name.charAt(0) === '.' && !FILE_KEEP_HIDDEN.has(entry.name)))) continue;
      if (entry.name === '.DS_Store') continue;
      items.push(fileRow(root, full, entry.name, kind, 0));
    }
    items.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'dir' ? -1 : 1));
    return { items: items.slice(0, limit), truncated: items.length > limit, scanned: items.length, timedOut: false };
  }

  const queue = [{ dir: root, level: 0 }];
  while (queue.length) {
    if (scanned >= FILE_MAX_SCAN || Date.now() - started > FILE_MAX_MS) {
      truncated = true;
      timedOut = Date.now() - started > FILE_MAX_MS;
      break;
    }
    const current = queue.shift();
    const entries = readDirSafe(current.dir);
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      const full = path.join(current.dir, entry.name);
      const kind = entryKind(entry, full);
      if (kind === 'skip') continue;
      const rel = path.relative(root, full).split(path.sep).join('/');
      if (kind === 'dir') {
        if (FILE_SKIP_DIRS.has(entry.name)) continue;
        if (entry.name.charAt(0) === '.' && !FILE_KEEP_HIDDEN.has(entry.name)) continue;
        if (current.level + 1 < depth) queue.push({ dir: full, level: current.level + 1 });
      } else {
        scanned += 1;
      }
      const score = fileScore(needle, entry.name, rel.toLowerCase());
      if (score > 0) items.push(fileRow(root, full, entry.name, kind, score));
      if (items.length >= limit * 4) {
        truncated = true;
        break;
      }
      if ((index & 31) === 31 && Date.now() - started > FILE_MAX_MS) {
        truncated = true;
        timedOut = true;
        break;
      }
    }
    if (truncated) break;
  }

  items.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.kind !== b.kind) return a.kind === 'file' ? -1 : 1;
    if (a.rel.length !== b.rel.length) return a.rel.length - b.rel.length;
    return b.mtime - a.mtime;
  });
  return { items: items.slice(0, limit), truncated, scanned, timedOut };
}

export function apply(ctx, config) {
  const server = ctx.get('webServer') || ctx.webServer;
  if (!server || typeof server.register !== 'function') {
    ctx.logger?.warn?.('dsh-cmdk: no webServer carrier, palette routes unavailable');
    return;
  }

  const disposers = [];

  disposers.push(
    server.register({
      kind: 'exact',
      path: ROUTE + '/info',
      handler: async (req, res) => {
        if (refused(ctx, req, res)) return;
        sendJson(res, 200, {
          ok: true,
          version: PACKAGE_VERSION,
          home: dshHome(),
          profile: profileDir(),
          platform: process.platform,
          arch: process.arch,
        });
      },
    }),
  );

  disposers.push(
    server.register({
      kind: 'exact',
      path: ROUTE + '/sessions',
      handler: async (req, res) => {
        if (refused(ctx, req, res)) return;
        let url;
        try {
          url = new URL(req.url || ROUTE, 'http://localhost');
        } catch {
          sendJson(res, 400, { ok: false, error: 'bad url' });
          return;
        }
        const text = (url.searchParams.get('q') || '').trim();
        const asked = Number(url.searchParams.get('limit'));
        const limit = Number.isFinite(asked) && asked > 0 ? Math.min(asked, 50) : 20;
        const depth = Number(url.searchParams.get('depth'));

        try {
          const catalog = await sessionCatalog(ctx);
          if (!text) {
            sendJson(res, 200, { ok: true, items: catalog, hits: [], total: catalog.length });
            return;
          }
          // The client filters titles locally (fuzzy + pinyin); the Host only
          // contributes the expensive part: message-content hits.
          const found = await matchContent(ctx, text, limit, depth, url.searchParams.get('cursor') || '');
          sendJson(res, 200, {
            ok: true,
            items: catalog,
            hits: found.hits,
            next: found.next,
            total: catalog.length,
          });
        } catch (error) {
          sendJson(res, 500, { ok: false, error: String((error && error.message) || error) });
        }
      },
    }),
  );

  // The turns around one message. Feeds the "preview" action on a content hit.
  disposers.push(
    server.register({
      kind: 'exact',
      path: ROUTE + '/message',
      handler: async (req, res) => {
        if (refused(ctx, req, res)) return;
        let url;
        try {
          url = new URL(req.url || ROUTE, 'http://localhost');
        } catch {
          sendJson(res, 400, { ok: false, error: 'bad url' });
          return;
        }
        const sessionId = url.searchParams.get('sessionId') || '';
        // `Number(null)` is 0, so an absent param must be rejected explicitly.
        const rawSeq = url.searchParams.get('seq');
        const seq = rawSeq === null || rawSeq === '' ? NaN : Number(rawSeq);
        if (!sessionId || !Number.isFinite(seq)) {
          sendJson(res, 400, { ok: false, error: 'sessionId and seq are required' });
          return;
        }
        const query = ctx.get('sessionQuery');
        if (!query || typeof query.readEvent !== 'function') {
          sendJson(res, 503, { ok: false, error: 'sessionQuery unavailable' });
          return;
        }
        const windowSize = (name) => {
          const raw = url.searchParams.get(name);
          if (raw === null || raw === '') return 2;
          const value = Number(raw);
          return Number.isFinite(value) ? Math.min(Math.max(Math.trunc(value), 0), 20) : 2;
        };
        try {
          const frame = await query.readEvent({
            sessionId,
            seq,
            before: windowSize('before'),
            after: windowSize('after'),
          });
          const events = Array.isArray(frame && frame.events) ? frame.events : [];
          sendJson(res, 200, {
            ok: true,
            targetSeq: seq,
            startSeq: frame && frame.startSeq,
            endSeq: frame && frame.endSeq,
            around: events
              .map((event) => {
                const full = eventText(event);
                return {
                  seq: Number.isFinite(event && event.seq) ? event.seq : null,
                  type: event && event.type ? String(event.type) : '',
                  time: Number.isFinite(event && event.time) ? event.time : 0,
                  text: full.slice(0, MAX_CONTEXT_CHARS),
                  clipped: full.length > MAX_CONTEXT_CHARS,
                };
              })
              .filter((row) => row.text),
          });
        } catch (error) {
          sendJson(res, 500, { ok: false, error: String((error && error.message) || error) });
        }
      },
    }),
  );

  disposers.push(
    server.register({
      kind: 'exact',
      path: ROUTE + '/workspaces',
      handler: (req, res) => {
        if (refused(ctx, req, res)) return;
        try {
          const data = readWorkspaces();
          sendJson(res, 200, { ok: true, items: data.items, archived: data.archived });
        } catch (error) {
          sendJson(res, 500, { ok: false, error: String((error && error.message) || error) });
        }
      },
    }),
  );

  disposers.push(
    server.register({
      kind: 'exact',
      path: ROUTE + '/files',
      handler: async (req, res) => {
        if (refused(ctx, req, res)) return;
        let url;
        try {
          url = new URL(req.url || ROUTE, 'http://localhost');
        } catch {
          sendJson(res, 400, { ok: false, error: 'bad url' });
          return;
        }
        const rawRoot = (url.searchParams.get('root') || '').trim();
        const text = (url.searchParams.get('q') || '').trim().slice(0, FILE_MAX_QUERY);
        const askedLimit = Number(url.searchParams.get('limit'));
        const limit = Number.isFinite(askedLimit) && askedLimit > 0 ? Math.min(Math.trunc(askedLimit), FILE_MAX_LIMIT) : FILE_DEFAULT_LIMIT;
        const askedDepth = Number(url.searchParams.get('depth'));
        const depth = Number.isFinite(askedDepth) && askedDepth > 0 ? Math.min(Math.trunc(askedDepth), FILE_MAX_DEPTH) : FILE_DEFAULT_DEPTH;
        const started = Date.now();

        let root = normalizeRoot(rawRoot);
        if (!root && rawRoot) {
          sendJson(res, 400, { ok: false, error: 'root must be an existing absolute directory' });
          return;
        }
        if (!root) {
          try {
            root = await defaultFileRoot(ctx);
          } catch {
            root = os.homedir();
          }
        }
        try {
          const found = scanFiles(root, { query: text, limit, depth });
          sendJson(res, 200, {
            ok: true,
            root,
            home: os.homedir(),
            query: text,
            depth,
            items: found.items,
            truncated: found.truncated,
            timedOut: found.timedOut,
            scanned: found.scanned,
            took: Date.now() - started,
          });
        } catch (error) {
          sendJson(res, 500, { ok: false, error: String((error && error.message) || error) });
        }
      },
    }),
  );

  disposers.push(
    server.register({
      kind: 'exact',
      path: ROUTE + '/open-profile',
      handler: async (req, res) => {
        if (refused(ctx, req, res)) return;
        if (req.method !== 'POST') {
          sendJson(res, 405, { ok: false, error: 'POST only' });
          return;
        }
        const raw = await readBody(req);
        let target = profileDir();
        let reveal = false;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed.path === 'string' && parsed.path.trim()) {
              target = parsed.path.trim();
            }
            reveal = !!(parsed && parsed.reveal);
          } catch {
            /* fall back to the profile directory */
          }
        }
        try {
          await openInFileManager(target, { reveal });
          sendJson(res, 200, { ok: true, path: target });
        } catch (error) {
          sendJson(res, 500, { ok: false, error: String(error && error.message ? error.message : error) });
        }
      },
    }),
  );

  disposers.push(
    server.register({
      kind: 'exact',
      path: ROUTE + '/plugins',
      handler: async (req, res) => {
        if (refused(ctx, req, res)) return;
        try {
          const manager = ctx.get('pluginManager') || ctx.pluginManager;
          const bundles = manager && typeof manager.listBundles === 'function' ? await manager.listBundles() : [];
          const items = bundles
            .filter((bundle) => bundle && bundle.installed && bundle.availability !== 'installation')
            .map((bundle) => ({
              name: bundle.name,
              version: bundle.version || '',
              enabled: !!bundle.enabled,
              dir: path.join(profileDir(), 'node_modules', ...bundle.name.split('/')),
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
          sendJson(res, 200, { ok: true, items });
        } catch (error) {
          sendJson(res, 500, { ok: false, error: String((error && error.message) || error) });
        }
      },
    }),
  );

  disposers.push(
    server.register({
      kind: 'exact',
      path: ROUTE + '/plugin',
      handler: async (req, res) => {
        if (refused(ctx, req, res)) return;
        if (req.method !== 'POST') {
          sendJson(res, 405, { ok: false, error: 'POST only' });
          return;
        }
        const raw = await readBody(req);
        let body = null;
        try {
          body = raw ? JSON.parse(raw) : null;
        } catch {
          sendJson(res, 400, { ok: false, error: 'invalid json' });
          return;
        }
        const name = body && typeof body.name === 'string' ? body.name.trim() : '';
        if (!name) {
          sendJson(res, 400, { ok: false, error: 'missing name' });
          return;
        }
        const manager = ctx.get('pluginManager') || ctx.pluginManager;
        if (!manager || typeof manager.setBundleEnabled !== 'function') {
          sendJson(res, 503, { ok: false, error: 'plugin manager unavailable' });
          return;
        }
        try {
          const result = await manager.setBundleEnabled(name, !!body.enabled);
          sendJson(res, 200, {
            ok: !result.error,
            changed: result.changed,
            application: result.application,
            error: result.error ? result.error.code || 'failed' : undefined,
          });
        } catch (error) {
          sendJson(res, 500, { ok: false, error: String((error && error.message) || error) });
        }
      },
    }),
  );

  ctx.effect(() => () => {
    for (const dispose of disposers) {
      try {
        dispose();
      } catch {
        /* already gone */
      }
    }
  });
}
