# Contributing

Thanks for taking a look. This plugin is deliberately small: two files, no build
step, no runtime dependencies. Keeping it that way is the main design constraint —
please read the rules below before sending a patch.

## Ground rules

- **No build step.** `client.js` ships as-is and is loaded by the host's module
  loader (`window.__ModuleLoader__.load(...)`). Do not introduce JSX, TypeScript,
  a bundler, or an import map.
- **No runtime dependencies.** `react` is provided by the host. Anything else has
  to be justified in the PR.
- **ES5-shaped client code.** `var`, `function` declarations, no optional
  chaining or `??` in `client.js` — the file is loaded verbatim into a page whose
  parser target we do not control.
- **Both strings tables move together.** Every new UI string goes into
  `STRINGS.zh` **and** `STRINGS.en`, and the two must stay at the same key count.
- **User-facing text is localized.** An English-only label in a Chinese UI (or the
  reverse) is a bug, not a follow-up.

## Setup

Requires Node.js 20 or newer. There is nothing to install.

```bash
git clone https://github.com/hseons/dsh-cmdk.git
cd dsh-cmdk
npm run verify      # syntax check + full test suite
```

## Testing

Tests live in `tests/` and run in plain Node — no framework, no browser:

```bash
npm test                     # every file
node tests/search.test.cjs   # one file
```

`tests/helpers/client.cjs` loads `client.js` inside a `vm` with a fake React and
exposes internal functions through a source-level injection point. That is how
the panel logic is tested without rendering. If you move the line
`exports.apply = apply;` in `client.js`, update the helper — it fails loudly with
`injection point moved`.

What to cover when you add behaviour:

| Area | File |
| --- | --- |
| Scoring, modes, query parsing, panel routing | `tests/search.test.cjs` |
| Message context panel, window sizing | `tests/context.test.cjs` |
| Provider registration, extensions panel | `tests/extensions.test.cjs` |
| Settings rows, toggles, hotkey capture | `tests/settings.test.cjs` |
| First screen, folding, relative time, usage | `tests/first-screen.test.cjs` |
| `window.__DSH_CMDK__` surface | `tests/apply.test.cjs` |
| HTTP routes, session index, event text | `tests/host.test.mjs` |

A patch that changes behaviour without a test for it will be sent back. This is
the whole reason the suite exists.

## Manual check

Before opening a PR, load the plugin in a running DSH web profile:

1. Link the repository into the profile's `node_modules` (a symlink works).
2. Reload the page.
3. Press the palette hotkey, then walk the surface you touched: modes (`>` `@`
   `#` `/` `=` `?`), the settings panel, the extensions panel, and a full-text
   search that returns a message-level hit.

The plugin talks to the host through `/cmdk/*`; those routes are guarded by the
host's own request check, so a route that returns 401 means the page session is
missing, not that the route is broken.

## Commits and releases

- Commit subjects follow `type: summary` (`feat:`, `fix:`, `docs:`, `test:`,
  `chore:`).
- `CHANGELOG.md` gets an entry **in the same commit** as the change, under the
  version being released.
- Version bumps are semver: new UI surface → minor, fixes → patch.
- A release is not done until all three channels agree: `npm publish`, a
  `vX.Y.Z` tag, and the CHANGELOG entry.

## Reporting bugs

Open an issue with:

- the DSH version and the plugin version (the `?` panel shows both),
- what you typed and what you expected,
- whether the console shows an error from `client.js` or the `/cmdk/*` routes.

Screenshots help when the problem is layout.
