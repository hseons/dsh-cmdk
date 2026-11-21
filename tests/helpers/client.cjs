'use strict';

/**
 * Loads `client.js` inside a vm with a fake React, so the pure logic (scoring,
 * panels, routing) can be tested without a browser or a bundler.
 *
 * `client.js` ships as a single file consumed by the host's module loader and
 * has no module exports of its own. Rather than sprinkle test-only branches
 * through the shipped file, the loader stitches one line in at a known
 * injection point — a source-level detail the test helper owns, not the
 * production file.
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const CLIENT = path.join(__dirname, '..', '..', 'client.js');
const INJECT = 'exports.apply = apply;';

function fakeReact() {
  return {
    createElement: (type, props, ...children) => ({ type, props, children }),
    Fragment: Symbol('Fragment'),
    useState: (init) => [typeof init === 'function' ? init() : init, () => {}],
    useEffect: () => {},
    useLayoutEffect: () => {},
    useRef: (value) => ({ current: value }),
    useMemo: (fn) => fn(),
    useCallback: (fn) => fn(),
    useSyncExternalStore: (subscribe, get) => get(),
  };
}

function memoryStorage(seed) {
  const map = new Map(Object.entries(seed || {}));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    clear: () => map.clear(),
    dump: () => Object.fromEntries(map),
  };
}

/**
 * @param {string[]} names internal bindings to expose as `internals`
 * @param {{ storage?: object, fetch?: Function, platform?: string }} [options]
 */
function loadClient(names, options) {
  const opts = options || {};
  const source = fs.readFileSync(CLIENT, 'utf8');
  if (!source.includes(INJECT)) {
    throw new Error('injection point moved; update tests/helpers/client.cjs (' + INJECT + ')');
  }
  const code = source.replace(INJECT, INJECT + '\n    exports.__t = { ' + names.join(', ') + ' };');

  const storage = opts.storage || memoryStorage();
  const requests = [];
  const fetchImpl =
    opts.fetch ||
    (async () => ({ ok: true, json: async () => ({}) }));

  const win = {
    __ModuleLoader__: { load: (spec) => { win.__spec = spec; } },
    localStorage: storage,
    addEventListener() {},
    removeEventListener() {},
    location: { origin: 'http://cmdk.test', href: 'http://cmdk.test/' },
  };

  const sandbox = {
    window: win,
    document: {
      createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
      documentElement: { style: { setProperty() {} } },
      body: {},
    },
    navigator: {
      platform: opts.platform || 'MacIntel',
      clipboard: { writeText: async () => {} },
    },
    localStorage: storage,
    fetch: (url, init) => {
      requests.push(String(url));
      return fetchImpl(String(url), init);
    },
    setTimeout,
    clearTimeout,
    AbortController,
    URL,
    console,
  };
  sandbox.self = win;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: 'client.js' });

  const React = fakeReact();
  const mod = win.__spec.factory((id) => {
    if (id === 'react') return React;
    throw new Error('unexpected require: ' + id);
  });

  return {
    api: mod,
    internals: mod.__t,
    storage,
    requests,
    window: win,
  };
}

/** Minimal assertion counter; throws at the end so `node --test` sees a failure. */
function createChecker(label) {
  let failures = 0;
  const ok = (name, cond, extra) => {
    if (cond) {
      console.log('  ok   ' + name);
      return;
    }
    failures += 1;
    console.log('  FAIL ' + name + (extra === undefined ? '' : ' → ' + JSON.stringify(extra)));
  };
  const finish = () => {
    if (failures) {
      throw new Error(label + ': ' + failures + ' failure(s)');
    }
    console.log('  ' + label + ' PASSED');
  };
  return { ok, finish, failures: () => failures };
}

const fakeCtx = () => ({
  theme: { setFontSize() {}, setTheme() {} },
  locale: {},
  sessions: { fork: async () => 'child' },
  uiWorkspace: { openSession() {}, openWorkspace() {}, startSession() {} },
  workspaces: {},
  layout: { selectPanel() {}, openRightbar() {}, closeRightbar() {} },
});

module.exports = { loadClient, createChecker, fakeCtx, memoryStorage, CLIENT };
