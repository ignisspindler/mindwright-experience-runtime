// The portable semantic core (tools/core/) against the Node adapters
// (tools/lib/): same meaning, from supplied data instead of files.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import * as core from '../tools/core/index.js';
import * as nodeBootstrap from '../tools/lib/bootstrap.js';
import { loadCatalog } from '../tools/lib/catalog.js';
import * as nodeManifest from '../tools/lib/manifest.js';
import { repoRoot } from '../tools/lib/vocabulary.js';

const fixture = (dir, name) => JSON.parse(readFileSync(new URL(`fixtures/${dir}/${name}`, import.meta.url), 'utf8'));
const listFixtures = dir => readdirSync(new URL(`fixtures/${dir}/`, import.meta.url)).filter(n => n.endsWith('.json')).sort();

// The catalog as a browser would receive it: parsed JSON, with no Maps and no file access.
const catalog = JSON.parse(JSON.stringify(loadCatalog()));

const pilot = readdirSync(new URL('manifests/pilot/', repoRoot)).filter(n => n.endsWith('.json')).sort()
  .map(name => ({ name, manifest: JSON.parse(readFileSync(new URL(`manifests/pilot/${name}`, repoRoot), 'utf8')) }));

test('the portable core imports nothing platform-specific', () => {
  const dir = new URL('../tools/core/', import.meta.url);
  for (const name of readdirSync(dir)) {
    const source = readFileSync(new URL(name, dir), 'utf8');
    assert.doesNotMatch(source, /['"]node:|require\(|\bprocess\.|import\.meta|\bfetch\(|\bDeno\.|\bBun\./, `${name} reaches outside the core`);
    for (const [, specifier] of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      assert.ok(specifier.startsWith('./'), `${name} imports ${specifier}`);
    }
  }
});

test('the runtime catalog is plain JSON data covering every runtime file', () => {
  const loaded = loadCatalog();
  assert.deepEqual(JSON.parse(JSON.stringify(loaded)), loaded);
  assert.equal(Object.keys(loaded.runtime.cards).length, 12);
  for (const id of loaded.vocabulary.architectures.entries.map(e => e.id)) assert.ok(loaded.runtime.cards[id], `no card for ${id}`);
  assert.deepEqual(Object.keys(loaded.runtime.dimensions).sort(), ['expectation', 'pressures', 'realization', 'scaffolding']);
});

test('bootstrap assembly uses the supplied runtime assets, not the repository', () => {
  const supplied = {
    schema: catalog.schema,
    vocabulary: catalog.vocabulary,
    runtime: {
      kernel: 'SUPPLIED KERNEL TEXT <!-- authoring note -->',
      cards: {
        'arch.seduction': '<!-- note -->\n\n## Primary\n\n**SEDUCTION.** Supplied primary card.\n\n## Secondary\n\n**SEDUCTION (secondary).** Unused.',
        'arch.constraint': '## Primary\n\n**CONSTRAINT.** Unused.\n\n## Secondary\n\n**CONSTRAINT (secondary).** Supplied secondary card.',
      },
      dimensions: {},
    },
  };
  const text = core.assembleBootstrap(fixture('valid', 's3-seduction.json'), supplied, { rung: 'S3' });
  assert.ok(text.includes('## Runtime Kernel\n\nSUPPLIED KERNEL TEXT\n\nMWER-KERNEL-0.1-END'));
  assert.ok(text.includes('**SEDUCTION.** Supplied primary card.\n\n**CONSTRAINT (secondary).** Supplied secondary card.'));
  assert.ok(!text.includes('MINDWRIGHT RUNTIME KERNEL'));
  assert.ok(!text.includes('<!--'));

  const withoutCard = structuredClone(supplied);
  delete withoutCard.runtime.cards['arch.constraint'];
  assert.throws(() => core.assembleBootstrap(fixture('valid', 's3-seduction.json'), withoutCard), /runtime\/cards\/constraint\.md is missing from the runtime catalog/);
  assert.throws(() => core.assembleBootstrap(fixture('valid', 'dimensions.json'), { ...catalog, runtime: { ...catalog.runtime, dimensions: {} } }), /runtime\/dimensions\/scaffolding\.md is missing from the runtime catalog/);
});

test('manifest validation uses the supplied schema and vocabulary', () => {
  const manifest = fixture('valid', 's3-seduction.json');
  manifest.sealed.primary = 'arch.supplied_only';

  const vocabulary = structuredClone(catalog.vocabulary);
  vocabulary.architectures.entries.push({ id: 'arch.supplied_only', name: 'Supplied only', family: 'agency', gloss: 'Exists only in supplied data.' });
  assert.deepEqual(core.validateManifest(manifest, { schema: catalog.schema, vocabulary }).errors, []);
  assert.ok(core.validateManifest(manifest, { schema: catalog.schema, vocabulary: catalog.vocabulary }).errors
    .includes('$.sealed.primary: unknown architecture arch.supplied_only'));

  const schema = structuredClone(catalog.schema);
  schema.$defs.visible.properties.intensity.maximum = 3;
  assert.deepEqual(core.validateManifest(fixture('valid', 's3-seduction.json'), { schema, vocabulary: catalog.vocabulary }).errors,
    ['$.visible.intensity: must be at most 3']);
});

test('core and Node validation agree on every fixture and pilot manifest, warnings included', () => {
  const manifests = [
    ...listFixtures('valid').map(n => fixture('valid', n)),
    ...listFixtures('invalid').map(n => fixture('invalid', n).manifest),
    ...pilot.map(p => p.manifest),
  ];
  const scaffolded = fixture('valid', 's3-seduction.json');
  scaffolded.sealed.scaffolding = ['In scene 2 the captain offers the post.'];
  scaffolded.visible.role = 'A reluctant seduction target';
  manifests.push(scaffolded);
  for (const manifest of manifests) {
    assert.deepEqual(core.validateManifest(manifest, catalog), nodeManifest.validateManifest(manifest));
  }
  assert.equal(core.validateManifest(scaffolded, catalog).warnings.length, 2);
});

test('Node-backed and data-backed bootstraps are byte-for-byte identical', () => {
  const cases = [];
  for (const { name, manifest } of pilot) {
    for (const rung of core.RUNGS) cases.push([`${name} ${rung}`, manifest, { rung, label: 'P-00' }]);
    cases.push([`${name} unrung`, manifest, {}]);
  }
  cases.push(['dimensions', fixture('valid', 'dimensions.json'), { returnUrl: 'https://example.org/back' }]);
  cases.push(['dimensions S2', fixture('valid', 'dimensions.json'), { rung: 'S2', label: 'X' }]);
  for (const [label, manifest, options] of cases) {
    assert.equal(core.assembleBootstrap(manifest, catalog, options), nodeBootstrap.assembleBootstrap(manifest, options), label);
  }
});

test('committed pilot bootstraps are reproduced exactly from data', () => {
  const { cells } = JSON.parse(readFileSync(new URL('pilot/cells.json', repoRoot), 'utf8'));
  for (const cell of cells) {
    const manifest = JSON.parse(readFileSync(new URL(cell.manifest, repoRoot), 'utf8'));
    const committed = readFileSync(new URL(`pilot/bootstraps/${cell.code}.md`, repoRoot), 'utf8');
    assert.equal(core.assembleBootstrap(manifest, catalog, { rung: cell.rung, label: cell.code }), committed, cell.code);
  }
});

test('participant-preface leak detection is identical', () => {
  const manifest = fixture('valid', 'dimensions.json');
  const leaking = core.assembleBootstrap(manifest, catalog, { label: 'Mirror of the grain exchange' });
  assert.deepEqual(core.prefaceLeaks(leaking, manifest, catalog), ['Mirror']);
  assert.deepEqual(core.prefaceLeaks(leaking, manifest, catalog), nodeBootstrap.prefaceLeaks(leaking, manifest));

  const handmade = `# Title\n\n${manifest.sealed.secrets[0]} and ${manifest.sealed.expectation}${core.MODEL_DIVIDER}${manifest.sealed.realization}`;
  assert.deepEqual(core.prefaceLeaks(handmade, manifest, catalog), [manifest.sealed.secrets[0], manifest.sealed.expectation]);
  assert.deepEqual(core.prefaceLeaks(handmade, manifest, catalog), nodeBootstrap.prefaceLeaks(handmade, manifest));

  const seduction = fixture('valid', 's3-seduction.json');
  const labelled = core.assembleBootstrap(seduction, catalog, { label: 'Seduction pilot' });
  assert.deepEqual(core.prefaceLeaks(labelled, seduction, catalog), ['Seduction']);
  for (const { manifest: m } of pilot) {
    const text = core.assembleBootstrap(m, catalog, { rung: 'S3', label: 'P-00' });
    assert.deepEqual(core.prefaceLeaks(text, m, catalog), []);
  }
});

test('canonical JSON is unchanged', () => {
  const expected = '{"created":"2026-09-15T00:00:00Z","digest":null,"id":null,"mwer":"0.1","provenance":{"author":"MWER test fixtures","mode":"authored"},"revision":1,"visible":{"boundaries":{"exclude":[],"language":"clean","sexual":"none","violence":"none"},"family":"world","intensity":1,"setting":{"description":null,"path":["history","middle-east"],"request":null}}}';
  assert.equal(core.canonicalJSON(fixture('valid', 's0-frame.json')), expected);
  assert.equal(nodeManifest.canonicalJSON, core.canonicalJSON);
});

test('digests are unchanged', () => {
  const expected = {
    's0-frame.json': 'sha256:8a3e07dc85b7a94d92d3c89077ae7e156407e5f931160fe4b5bf8d0c381bb481',
    's3-seduction.json': 'sha256:c4075c3317d3dd1c743144f5e14bf1f7305dc811b813f761edb803df2a70791e',
    'dimensions.json': 'sha256:b2508c6bebfad22ab88fb40ebf6aec0a8b413b48b7b6981721a46ab0f39fcf23',
  };
  for (const [name, digest] of Object.entries(expected)) {
    const manifest = fixture('valid', name);
    assert.equal(core.computeDigest(manifest), digest, name);
    assert.equal(core.computeDigest({ ...manifest, digest }), digest, `${name} with its digest set`);
  }
  for (const { name, manifest } of pilot) {
    const nodeDigest = `sha256:${createHash('sha256').update(core.canonicalJSON({ ...manifest, digest: null })).digest('hex')}`;
    assert.equal(core.computeDigest(manifest), nodeDigest, name);
  }
});

test('the portable SHA-256 matches node:crypto', () => {
  assert.equal(core.sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  const inputs = ['', 'abc', 'Penelope · Ἰθάκη 🌊', '\uD800 lone surrogate', '"quoted"\n\t\\'];
  for (const n of [1, 54, 55, 56, 57, 63, 64, 65, 119, 120, 121, 1000, 100000]) inputs.push('a'.repeat(n));
  for (let i = 0; i < 200; i++) inputs.push(Array.from({ length: i * 7 }, (_, j) => String.fromCodePoint(32 + ((i * 31 + j * 17) % 20000))).join(''));
  for (const input of inputs) {
    assert.equal(core.sha256Hex(input), createHash('sha256').update(input).digest('hex'), `length ${input.length}`);
  }
});
