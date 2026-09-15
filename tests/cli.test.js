// CLI behavior recorded from the tools before the core/adapter refactor
// (tests/fixtures/cli/). Each case compares exit status, stdout and stderr.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { repoRoot } from '../tools/lib/vocabulary.js';

const cwd = fileURLToPath(repoRoot);
const golden = (name, stream) => readFileSync(new URL(`fixtures/cli/${name}.${stream}`, import.meta.url), 'utf8');
const run = args => spawnSync(process.execPath, args, { cwd, encoding: 'utf8' });

// An uncaught error's stack frames name source files and absolute paths;
// only its message is behavior.
const errorMessage = stderr => {
  const lines = stderr.split('\n');
  const start = lines.findIndex(l => l.startsWith('Error: '));
  const end = lines.findIndex((l, i) => i > start && /^\s+at /.test(l));
  return `${lines.slice(start, end).join('\n')}\n`;
};

const cases = JSON.parse(readFileSync(new URL('fixtures/cli/cases.json', import.meta.url), 'utf8'));

for (const c of cases) {
  test(`CLI: ${c.name}`, () => {
    const result = run(c.args);
    assert.equal(result.status, c.status);
    assert.equal(result.stdout, golden(c.name, 'stdout'));
    if (c.stderr === 'error-message') assert.equal(errorMessage(result.stderr), golden(c.name, 'stderr'));
    else assert.equal(result.stderr, golden(c.name, 'stderr'));
  });
}

test('CLI: project --out writes the same bootstrap it would print', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mwer-'));
  try {
    const out = join(dir, 'bootstrap.md');
    const result = run(['tools/project.js', 'tests/fixtures/valid/s3-seduction.json', '--rung', 'S2', '--label', 'P-01', '--out', out]);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, '');
    assert.equal(readFileSync(out, 'utf8'), golden('project-rung-label', 'stdout'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
