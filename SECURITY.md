# Security

## Scope

`dsh-cmdk` runs inside DeepSeek Harness: a host half (`index.js`) that registers
six HTTP routes under `/cmdk/*`, and a client half (`client.js`) that renders the
palette. Both run with the privileges of the profile that loads the plugin.

Relevant surface:

- **Routes.** Every `/cmdk/*` handler calls the host's own connection check
  before answering; a request that fails it gets the host's rejection, not data.
  A patch that adds a route must do the same.
- **Files opened on behalf of the user.** `/cmdk/open-profile` shells out to the
  platform's file manager. It takes no path from the request body — the target is
  resolved by the host.
- **Search input.** Query text is passed to the session index and to event
  filters as data; it is never concatenated into a shell command, a file path, or
  a regular expression assembled from user input.
- **Third-party providers.** Any page script can call
  `window.__DSH_CMDK__.registerProvider(...)`. Treat that surface as untrusted:
  providers run in the same page, so a hostile provider can do anything the page
  can. It also receives the current query text — do not register a provider that
  forwards queries somewhere you would not paste them by hand.
- **Local storage.** Settings and usage counters live in `localStorage` under
  `dsh-cmdk/*`. Nothing is sent anywhere; there is no telemetry and no network
  call beyond the host's own `/cmdk/*` routes.

## Reporting

Open a private security advisory on the repository, or email the maintainer
listed in `package.json`. Please include the plugin version (shown in the `?`
panel), the DSH version, and a reproduction. Do not open a public issue for a
vulnerability before there is a fix.

There is no bounty. Reports are acknowledged as time allows, usually within a
week.
