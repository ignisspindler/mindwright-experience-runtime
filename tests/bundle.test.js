import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as core from '../tools/core/index.js';
import { loadCatalog } from '../tools/lib/catalog.js';
import { readRepoJSON, repoRoot } from '../tools/lib/vocabulary.js';

const root = fileURLToPath(repoRoot);
const bundle = out => execFileSync(process.execPath, ['tools/bundle.js', '--out', out, '--allow-dirty'], { cwd: root, encoding: 'utf8' });
const sha256 = content => `sha256:${createHash('sha256').update(content).digest('hex')}`;

function listFiles(dir, prefix = '') {
  return readdirSync(join(dir, prefix), { withFileTypes: true }).flatMap(entry => (
    entry.isDirectory() ? listFiles(dir, join(prefix, entry.name)) : [join(prefix, entry.name)]
  ));
}

test('the browser bundle is complete, hashed, versioned and deterministic', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mwer-bundle-'));
  try {
    const a = join(dir, 'a');
    const b = join(dir, 'b');
    bundle(a);
    bundle(b);

    const manifest = JSON.parse(readFileSync(join(a, 'MANIFEST.json'), 'utf8'));
    assert.equal(manifest.version, readRepoJSON('package.json').version);
    assert.equal(manifest.runtime, core.RUNTIME_VERSION);
    assert.equal(manifest.composer, core.COMPOSER_VERSION);

    const present = listFiles(a).filter(p => p !== 'MANIFEST.json').sort();
    assert.deepEqual(present, Object.keys(manifest.files).sort());
    for (const path of present) {
      const content = readFileSync(join(a, path));
      assert.equal(manifest.files[path], sha256(content), path);
      assert.deepEqual(content, readFileSync(join(b, path)), `${path} differs between two builds`);
    }

    const coreDir = new URL('tools/core/', repoRoot);
    const coreFiles = readdirSync(coreDir).filter(n => n.endsWith('.js')).sort();
    assert.deepEqual(present.filter(p => p.startsWith('core/')), coreFiles.map(n => `core/${n}`));
    for (const name of coreFiles) {
      assert.deepEqual(readFileSync(join(a, 'core', name)), readFileSync(new URL(name, coreDir)), `core/${name} is not byte-identical`);
    }

    const catalog = loadCatalog();
    assert.deepEqual(JSON.parse(readFileSync(join(a, 'catalog.json'), 'utf8')), catalog);
    const catalogModule = (await import(pathToFileURL(join(a, 'catalog.js')).href)).default;
    assert.deepEqual(catalogModule, catalog);

    const bundled = await import(pathToFileURL(join(a, 'core', 'index.js')).href);
    const input = {
      family: 'agency',
      setting: { path: ['fiction'], request: 'Give me Star Trek!!' },
      intensity: 4,
      boundaries: { sexual: 'none', violence: 'implied', language: 'moderate', exclude: [] },
      seed: 'bundle',
    };
    const options = { created: '2026-09-15T00:00:00Z' };
    const fromBundle = bundled.composeManifest(input, catalogModule, options);
    assert.deepEqual(fromBundle, core.composeManifest(input, catalog, options));
    assert.equal(bundled.assembleBootstrap(fromBundle, catalogModule, { rung: 'S3' }), core.assembleBootstrap(fromBundle, catalog, { rung: 'S3' }));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
