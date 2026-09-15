import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { canonicalJSON, computeDigest, truncate, validateManifest } from '../tools/lib/manifest.js';

const read = (dir, name) => JSON.parse(readFileSync(new URL(`fixtures/${dir}/${name}`, import.meta.url), 'utf8'));
const list = dir => readdirSync(new URL(`fixtures/${dir}/`, import.meta.url)).filter(n => n.endsWith('.json')).sort();

for (const name of list('valid')) {
  test(`valid fixture ${name} has no errors`, () => {
    assert.deepEqual(validateManifest(read('valid', name)).errors, []);
  });
}

// Each invalid fixture is { "expect": "<substring of the error>", "manifest": {...} }.
for (const name of list('invalid')) {
  test(`invalid fixture ${name} is rejected for the right reason`, () => {
    const { expect, manifest } = read('invalid', name);
    const { errors } = validateManifest(manifest);
    assert.ok(errors.some(e => e.includes(expect)), `expected an error containing "${expect}", got ${JSON.stringify(errors)}`);
  });
}

test('canonical JSON ignores key order', () => {
  assert.equal(canonicalJSON({ b: 1, a: [{ d: 2, c: 3 }] }), canonicalJSON({ a: [{ c: 3, d: 2 }], b: 1 }));
});

test('a registered manifest with its computed digest validates', () => {
  const manifest = read('valid', 's3-seduction.json');
  manifest.id = 'MW-7F3A91';
  manifest.digest = computeDigest(manifest);
  assert.deepEqual(validateManifest(manifest).errors, []);
});

test('the digest does not depend on the digest field itself', () => {
  const manifest = read('valid', 's3-seduction.json');
  const before = computeDigest(manifest);
  manifest.digest = before;
  assert.equal(computeDigest(manifest), before);
});

test('truncation builds the S0-S3 ladder', () => {
  const full = read('valid', 'dimensions.json');
  assert.equal(truncate(full, 'S0').sealed, undefined);
  assert.deepEqual(Object.keys(truncate(full, 'S1').sealed).sort(), ['primary', 'secondary']);
  assert.deepEqual(Object.keys(truncate(full, 'S2').sealed).sort(), ['attractors', 'primary', 'secondary']);
  assert.deepEqual(Object.keys(truncate(full, 'S3').sealed).sort(), ['attractors', 'invariants', 'primary', 'secondary', 'secrets']);
});

test('truncation drops optional dimensions and identity, and every rung validates', () => {
  const full = read('valid', 'dimensions.json');
  full.id = 'MW-000001';
  full.digest = computeDigest(full);
  for (const rung of ['S0', 'S1', 'S2', 'S3']) {
    const variant = truncate(full, rung);
    assert.equal(variant.id, null);
    assert.equal(variant.digest, null);
    assert.equal(variant.provenance.derived_from, 'MW-000001');
    assert.equal(variant.sealed?.scaffolding, undefined);
    assert.equal(variant.sealed?.realization, undefined);
    assert.deepEqual(validateManifest(variant).errors, [], `${rung} should validate`);
  }
  assert.ok(full.sealed.scaffolding, 'truncation must not mutate the original');
});

test('scaffolding that reads like a scene is warned about', () => {
  const manifest = read('valid', 's3-seduction.json');
  manifest.sealed.scaffolding = ['In scene 2 the captain offers the post.'];
  const { errors, warnings } = validateManifest(manifest);
  assert.deepEqual(errors, []);
  assert.ok(warnings.some(w => w.includes('scaffolding[0]')));
});

test('an unknown rung is an error', () => {
  assert.throws(() => truncate(read('valid', 's0-frame.json'), 'S4'), /Unknown rung/);
});
