'use strict';

/**
 * Runs every `tests/*.test.{cjs,mjs}` file in its own process and prints one
 * summary. Each test file is self-contained: it loads the plugin half it covers,
 * asserts, and exits non-zero on failure.
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const DIR = __dirname;
const files = fs
  .readdirSync(DIR)
  .filter((name) => /\.test\.(cjs|mjs)$/.test(name))
  .sort();

if (!files.length) {
  console.error('no test files found in ' + DIR);
  process.exit(1);
}

let failed = 0;
const rows = [];

for (const file of files) {
  const label = file.replace(/\.test\.(cjs|mjs)$/, '');
  const started = Date.now();
  const run = spawnSync(process.execPath, [path.join(DIR, file)], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const took = Date.now() - started;
  const passed = run.status === 0;
  if (!passed) failed += 1;

  const okCount = (run.stdout.match(/^\s+ok\s/gm) || []).length;
  rows.push({ label, passed, okCount, took, output: passed ? '' : (run.stdout + run.stderr).trim() });
}

const width = rows.reduce((max, row) => Math.max(max, row.label.length), 0);
for (const row of rows) {
  const mark = row.passed ? 'PASS' : 'FAIL';
  console.log(
    mark + '  ' + row.label.padEnd(width) + '  ' + String(row.okCount).padStart(3) + ' checks  ' + String(row.took).padStart(4) + 'ms',
  );
  if (!row.passed) {
    console.log(row.output.split('\n').map((line) => '      ' + line).join('\n'));
  }
}

const total = rows.reduce((sum, row) => sum + row.okCount, 0);
console.log('\n' + (rows.length - failed) + '/' + rows.length + ' files, ' + total + ' checks');
if (failed) {
  console.error(failed + ' test file(s) failed');
  process.exit(1);
}
