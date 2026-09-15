import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { HARNESSES, planPilot, seededShuffle } from '../tools/lib/pilot.js';
import { loadVocabulary, repoRoot } from '../tools/lib/vocabulary.js';

const vocab = loadVocabulary();
const dir = new URL('manifests/pilot/', repoRoot);
const entries = readdirSync(dir).filter(n => n.endsWith('.json')).map(name => ({
  slug: name.replace(/\.json$/, ''),
  manifest: JSON.parse(readFileSync(new URL(name, dir), 'utf8')),
}));

test('the pilot has one manifest per architecture', () => {
  const primaries = entries.map(e => e.manifest.sealed.primary).sort();
  assert.deepEqual(primaries, [...vocab.architectures.keys()].sort());
});

test('pilot manifests use none of the optional dimensions', () => {
  for (const { slug, manifest } of entries) {
    for (const field of ['scaffolding', 'mechanisms', 'operators', 'expectation', 'realization']) {
      assert.equal(manifest.sealed[field], undefined, `${slug} uses ${field}`);
    }
  }
});

test('seeded shuffle is deterministic and a permutation', () => {
  const items = Array.from({ length: 20 }, (_, i) => i);
  assert.deepEqual(seededShuffle(items, 'x'), seededShuffle(items, 'x'));
  assert.deepEqual([...seededShuffle(items, 'x')].sort((a, b) => a - b), items);
});

test('every architecture x rung is a cell with a unique neutral code', () => {
  const { cells } = planPilot(entries, vocab);
  assert.equal(cells.length, 48);
  assert.equal(new Set(cells.map(c => c.code)).size, 48);
  for (const { slug } of entries) {
    assert.deepEqual(cells.filter(c => c.slug === slug).map(c => c.rung).sort(), ['S0', 'S1', 'S2', 'S3']);
  }
});

test('tier A covers every S3 cell in all harnesses; tier B rotates each ladder across all three', () => {
  const { cells, plays } = planPilot(entries, vocab);
  assert.equal(plays.length, 72);
  for (const { slug } of entries) {
    const mine = cells.filter(c => c.slug === slug);
    const s3 = mine.find(c => c.rung === 'S3').code;
    assert.deepEqual(plays.filter(p => p.code === s3).map(p => p.harness).sort(), [...HARNESSES].sort());
    const thinner = new Set(mine.filter(c => c.rung !== 'S3').map(c => c.code));
    const harnesses = plays.filter(p => thinner.has(p.code)).map(p => p.harness).sort();
    assert.deepEqual(harnesses, [...HARNESSES].sort(), `${slug} tier B harnesses`);
  }
});

test('committed pilot files match the generator', () => {
  execFileSync(process.execPath, [fileURLToPath(new URL('tools/pilot.js', repoRoot)), '--check'], { stdio: 'pipe' });
});
