import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as core from '../tools/core/index.js';
import { loadCatalog } from '../tools/lib/catalog.js';
import { repoRoot } from '../tools/lib/vocabulary.js';

const catalog = JSON.parse(JSON.stringify(loadCatalog()));
const CREATED = '2026-09-15T00:00:00Z';
const FAMILIES = ['epistemic', 'agency', 'identity', 'world'];
const ARCHITECTURES = catalog.vocabulary.architectures.entries;

const input = (overrides = {}) => ({
  family: 'epistemic',
  setting: { path: ['history', 'north-atlantic'], description: 'A remote lighthouse station in the early twentieth century.', request: null },
  role: null,
  intensity: 3,
  boundaries: { sexual: 'none', violence: 'implied', language: 'moderate', exclude: [] },
  seed: 'lighthouse',
  ...overrides,
});

const sealedFor = (overrides, options = {}) => core.composeManifest(input(overrides), catalog, { created: CREATED, ...options }).sealed;
const statements = sealed => [...sealed.attractors, ...sealed.invariants, ...sealed.secrets];

// ---------------------------------------------------------------- randomness

function referenceXoshiro128(words) {
  const MASK = 0xffffffffn;
  let [a, b, c, d] = words.map(BigInt);
  const rotl = (x, k) => ((x << BigInt(k)) | (x >> BigInt(32 - k))) & MASK;
  return () => {
    const result = (rotl((b * 5n) & MASK, 7) * 9n) & MASK;
    const t = (b << 9n) & MASK;
    c ^= a; d ^= b; b ^= c; a ^= d; c ^= t; d = rotl(d, 11);
    return Number(result);
  };
}

test('the random stream is xoshiro128** seeded from SHA-256 of the key', () => {
  for (const key of ['a', 'lighthouse', '["mwer-composer","0.1.0","world","seed","statements"]', 'Ἰθάκη']) {
    const hex = core.sha256Hex(key);
    const reference = referenceXoshiro128([0, 1, 2, 3].map(i => parseInt(hex.slice(i * 8, i * 8 + 8), 16)));
    const random = core.createRandom(key);
    for (let i = 0; i < 2000; i++) assert.equal(random.nextUint32(), reference(), `${key} output ${i}`);
  }
});

test('the random stream is pinned: these values must never change within a composer version', () => {
  const random = core.createRandom('mwer');
  assert.deepEqual(Array.from({ length: 4 }, () => random.nextUint32()), PINNED_OUTPUTS);
});

test('random helpers stay in range and reject bad arguments', () => {
  const random = core.createRandom('helpers');
  const counts = [0, 0, 0];
  for (let i = 0; i < 3000; i++) counts[random.int(3)]++;
  for (const n of counts) assert.ok(n > 800 && n < 1200, `counts ${counts}`);
  assert.deepEqual(random.sample(['a', 'b', 'c', 'd'], 4), ['a', 'b', 'c', 'd']);
  assert.equal(new Set(random.sample([1, 2, 3, 4, 5], 3)).size, 3);
  assert.throws(() => random.int(0));
  assert.throws(() => random.pick([]));
  assert.throws(() => core.createRandom(''));
});

test('the composer never uses Math.random or a clock', () => {
  for (const file of ['composer.js', 'random.js']) {
    const source = readFileSync(new URL(`../tools/core/${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /Math\.random|Date\.now|new Date|performance\.now/, file);
  }
});

// ---------------------------------------------------------------- grammar

test('the grammar is valid for this composer version and covers every architecture', () => {
  assert.deepEqual(core.validateGrammar(catalog.grammar, catalog.vocabulary), []);
  assert.equal(catalog.grammar.composer, core.COMPOSER_VERSION);
  assert.deepEqual(catalog.grammar.architectures.map(a => a.id).sort(), ARCHITECTURES.map(a => a.id).sort());
});

test('grammar validation catches the mistakes it exists for', () => {
  const broken = structuredClone(catalog.grammar);
  broken.composer = '9.9.9';
  broken.architectures[0].secondary.invariants.push('A {character} appears.');
  broken.architectures[1].primary.attractors = [{ text: 'Only at the top.', intensity: [5, 5] }];
  broken.architectures[2].secondary.inflections.push('Starts with a capital.');
  broken.architectures.pop();
  const errors = core.validateGrammar(broken, catalog.vocabulary);
  assert.ok(errors.some(e => e.includes('composer 9.9.9')));
  assert.ok(errors.some(e => e.includes('unexpected slot {character}')));
  assert.ok(errors.some(e => e.includes('arch.mystery.primary.attractors: nothing eligible at intensity 1')));
  assert.ok(errors.some(e => e.includes('an inflection starts lowercase')));
  assert.ok(errors.some(e => e.includes('arch.inhabitation: missing from the grammar')));
  assert.throws(() => core.composeManifest(input(), { ...catalog, grammar: broken }, { created: CREATED }), /Composition grammar is invalid/);
});

test('every secondary fragment resolves cleanly against every other primary', () => {
  for (const lead of catalog.grammar.architectures) {
    for (const other of catalog.grammar.architectures) {
      if (other.id === lead.id) continue;
      for (const key of ['invariants', 'attractors', 'secrets']) {
        for (const fragment of other.secondary[key]) {
          const text = core.bindToPrimary(typeof fragment === 'string' ? fragment : fragment.text, lead);
          assert.doesNotMatch(text, /[{}]/, `${other.id} on ${lead.id}`);
          assert.match(text, /^[A-Z].*\.$/, `${other.id} on ${lead.id}: ${text}`);
        }
      }
    }
  }
});

// ---------------------------------------------------------------- input

test('composer input is validated with clear messages', () => {
  const invalid = [
    [{ family: 'cosmic' }, '$.family: must be one of'],
    [{ intensity: 0 }, '$.intensity: must be at least 1'],
    [{ intensity: 6 }, '$.intensity: must be at most 5'],
    [{ intensity: 2.5 }, '$.intensity: must be integer'],
    [{ seed: '' }, '$.seed: must not be empty'],
    [{ seed: '   ' }, '$.seed: must contain a non-whitespace character'],
    [{ seed: 42 }, '$.seed: must be string'],
    [{ boundaries: { sexual: 'explicit', violence: 'none', language: 'clean', exclude: [] } }, '$.boundaries.sexual: must be one of'],
    [{ boundaries: { sexual: 'none', violence: 'none', language: 'clean' } }, '$.boundaries: missing required field "exclude"'],
    [{ setting: { path: ['Science Fiction'] } }, '$.setting.path[0]: does not match'],
    [{ setting: { path: [], request: 'x'.repeat(501) } }, '$.setting.request: must be at most 500 characters'],
    [{ role: '' }, '$.role: must not be empty'],
    [{ title: 'A title' }, '"title" is not an allowed field'],
  ];
  for (const [overrides, expected] of invalid) {
    assert.throws(() => core.composeManifest(input(overrides), catalog, { created: CREATED }), error => {
      assert.ok(error instanceof core.ComposerInputError, `${expected}: ${error}`);
      assert.ok(error.errors.some(e => e.includes(expected)), `expected "${expected}" in ${JSON.stringify(error.errors)}`);
      return true;
    });
  }
  const missingSeed = input();
  delete missingSeed.seed;
  assert.throws(() => core.composeManifest(missingSeed, catalog, { created: CREATED }), /missing required field "seed"/);
  assert.throws(() => core.composeManifest(null, catalog, { created: CREATED }), /\$: must be object/);
});

test('creation time must be supplied explicitly and valid', () => {
  assert.throws(() => core.composeManifest(input(), catalog), /needs options\.created/);
  assert.throws(() => core.composeManifest(input(), catalog, { created: 'yesterday' }), /needs options\.created/);
});

test('normalization fills optional fields, copies arrays and NFC-normalizes the seed only', () => {
  const minimal = { family: 'world', setting: { path: [] }, intensity: 1, boundaries: { sexual: 'none', violence: 'none', language: 'clean', exclude: [] }, seed: 'Café' };
  const normalized = core.normalizeComposerInput(minimal, catalog);
  assert.deepEqual(normalized.setting, { path: [], description: null, request: null });
  assert.equal(normalized.role, null);
  assert.equal(normalized.seed, 'Café');
  assert.notEqual(normalized.setting.path, minimal.setting.path);
  const request = '  Vatican during Medici control  ';
  assert.equal(core.normalizeComposerInput({ ...minimal, setting: { path: [], request } }, catalog).setting.request, request);
  assert.deepEqual(
    core.composeManifest({ ...minimal, seed: 'Café' }, catalog, { created: CREATED }),
    core.composeManifest({ ...minimal, seed: 'Café' }, catalog, { created: CREATED }),
  );
});

// ---------------------------------------------------------------- output

test('a composed manifest has the documented shape and passes through unchanged frame fields', () => {
  const given = input({ role: 'A relief keeper.', setting: { path: ['history', 'europe'], description: null, request: 'Vatican during Medici control' } });
  const manifest = core.composeManifest(given, catalog, { created: CREATED });
  assert.deepEqual(Object.keys(manifest), ['mwer', 'id', 'revision', 'created', 'digest', 'provenance', 'visible', 'sealed']);
  assert.equal(manifest.mwer, '0.1');
  assert.equal(manifest.id, null);
  assert.equal(manifest.digest, null);
  assert.equal(manifest.revision, 1);
  assert.equal(manifest.created, CREATED);
  assert.deepEqual(manifest.provenance, { mode: 'composed', composer: { version: core.COMPOSER_VERSION, seed: 'lighthouse' } });
  assert.deepEqual(manifest.visible, { family: given.family, setting: given.setting, role: given.role, intensity: given.intensity, boundaries: given.boundaries });
  assert.deepEqual(Object.keys(manifest.sealed), ['primary', 'secondary', 'attractors', 'invariants', 'secrets']);
  assert.equal(manifest.visible.title, undefined);
  assert.deepEqual(core.validateManifest(manifest, catalog), { errors: [], warnings: [] });
});

// ---------------------------------------------------------------- determinism

test('same input and seed give the same score', () => {
  for (const family of FAMILIES) {
    for (let i = 0; i < 25; i++) {
      const given = input({ family, seed: `repeat-${i}`, intensity: 1 + (i % 5) });
      assert.deepEqual(core.composeManifest(given, catalog, { created: CREATED }), core.composeManifest(structuredClone(given), catalog, { created: CREATED }));
    }
  }
});

test('creation time never changes the score', () => {
  for (let i = 0; i < 40; i++) {
    const given = input({ family: FAMILIES[i % 4], seed: `clock-${i}` });
    const early = core.composeManifest(given, catalog, { created: '2000-01-01T00:00:00Z' });
    const late = core.composeManifest(given, catalog, { created: '2099-12-31T23:59:59.999Z' });
    assert.deepEqual(early.sealed, late.sealed);
    assert.deepEqual({ ...early, created: null }, { ...late, created: null });
  }
});

test('the score depends on the seed, and setting, role and boundaries never change it', () => {
  const scores = new Set();
  for (let i = 0; i < 60; i++) scores.add(JSON.stringify(sealedFor({ seed: `vary-${i}` })));
  assert.ok(scores.size > 40, `only ${scores.size} distinct scores from 60 seeds`);

  const base = sealedFor({ seed: 'frame' });
  assert.deepEqual(sealedFor({ seed: 'frame', setting: { path: ['fiction'], request: 'Give me Star Trek!!' } }), base);
  assert.deepEqual(sealedFor({ seed: 'frame', role: 'A clerk.' }), base);
  assert.deepEqual(sealedFor({ seed: 'frame', boundaries: { sexual: 'none', violence: 'none', language: 'clean', exclude: ['heights'] } }), base);
});

test('intensity keeps the architectures and only narrows eligible statements', () => {
  for (let i = 0; i < 200; i++) {
    const seed = `intensity-${i}`;
    const family = FAMILIES[i % 4];
    const at = level => sealedFor({ family, seed, intensity: level });
    const one = at(1);
    for (const level of [2, 3, 4, 5]) {
      assert.equal(at(level).primary, one.primary);
      assert.deepEqual(at(level).secondary, one.secondary);
    }
  }
  const limited = catalog.grammar.architectures.flatMap(a => [...a.primary.invariants, ...a.primary.secrets]).filter(f => typeof f !== 'string');
  for (let i = 0; i < 400; i++) {
    const texts = statements(sealedFor({ family: FAMILIES[i % 4], seed: `floor-${i}`, intensity: 1 }));
    for (const f of limited) if (f.intensity[0] > 1) assert.ok(!texts.includes(f.text), `"${f.text}" appeared at intensity 1`);
  }
});

// ---------------------------------------------------------------- distribution

test('across many seeds every primary, secondary and secondary count is reachable', () => {
  const primaries = new Map();
  const secondaries = new Map();
  const counts = [0, 0, 0];
  const perFamily = 1500;
  for (const family of FAMILIES) {
    for (let i = 0; i < perFamily; i++) {
      const sealed = core.composeSealed({ ...core.normalizeComposerInput(input({ family, seed: `spread-${i}` }), catalog) }, catalog);
      primaries.set(sealed.primary, (primaries.get(sealed.primary) ?? 0) + 1);
      counts[sealed.secondary.length]++;
      assert.ok(!sealed.secondary.includes(sealed.primary), 'a primary appeared as its own secondary');
      assert.equal(new Set(sealed.secondary).size, sealed.secondary.length);
      for (const id of sealed.secondary) secondaries.set(id, (secondaries.get(id) ?? 0) + 1);
      assert.equal(ARCHITECTURES.find(a => a.id === sealed.primary).family, family);
    }
  }
  for (const { id } of ARCHITECTURES) {
    const share = primaries.get(id) / perFamily;
    assert.ok(share > 0.25 && share < 0.42, `${id} is primary in ${(share * 100).toFixed(1)}% of its family`);
    assert.ok((secondaries.get(id) ?? 0) > 200, `${id} is a secondary only ${secondaries.get(id) ?? 0} times`);
  }
  const total = perFamily * FAMILIES.length;
  assert.ok(counts[0] / total > 0.18 && counts[0] / total < 0.32, `no secondaries: ${counts[0]}`);
  assert.ok(counts[1] / total > 0.42 && counts[1] / total < 0.58, `one secondary: ${counts[1]}`);
  assert.ok(counts[2] / total > 0.18 && counts[2] / total < 0.32, `two secondaries: ${counts[2]}`);
});

// ---------------------------------------------------------------- validity and structure

test('a wide cross-product of inputs always yields a valid, structural S3 score', () => {
  const settings = [
    { path: ['history', 'north-atlantic'], description: 'A remote lighthouse station in the early twentieth century.', request: null },
    { path: ['history', 'europe', 'italy'], description: null, request: 'Vatican during Medici control' },
    { path: [], description: null, request: 'Ἰθάκη, but told from the kitchens 🌊 {not a slot}' },
    { path: ['fiction', 'science-fiction'], description: null, request: 'x'.repeat(500) },
  ];
  const exclusions = [[], ['harm to animals', 'drowning']];
  const seeds = ['alpha', 'β', 'seed with spaces', '{object}'];
  // Rough markers of authored plot. Dialogue is also caught by the quote check below;
  // words like "said" and "named" appear in structural statements, so they aren't markers.
  const plot = /\b(scenes?|chapters?|turns?|dialogue|speech)\b/i;
  let composed = 0;
  for (const family of FAMILIES) {
    for (let intensity = 1; intensity <= 5; intensity++) {
      for (const exclude of exclusions) {
        for (const setting of settings) {
          for (const seed of seeds) {
            const manifest = core.composeManifest(
              input({ family, intensity, seed, setting, boundaries: { sexual: 'none', violence: 'implied', language: 'moderate', exclude } }),
              catalog,
              { created: CREATED },
            );
            composed++;
            assert.deepEqual(core.validateManifest(manifest, catalog).errors, []);
            const { sealed } = manifest;
            assert.ok(sealed.attractors.length >= 1 && sealed.attractors.length <= 3, 'attractor count');
            assert.ok(sealed.invariants.length >= 1 && sealed.invariants.length <= 4, 'invariant count');
            assert.ok(sealed.secrets.length <= 3, 'secret count');
            const texts = statements(sealed);
            assert.equal(new Set(texts).size, texts.length, 'a statement repeats');
            for (const text of texts) {
              assert.ok(text.trim().length > 0);
              assert.match(text, /^[A-Z][^{}]*\.$/, text);
              assert.doesNotMatch(text, /\s{2,}|\d|["“”]/, text);
              assert.doesNotMatch(text, plot, text);
            }
            if (['arch.trap', 'arch.mystery', 'arch.ontology'].includes(sealed.primary)) assert.ok(sealed.secrets.length >= 1);
          }
        }
      }
    }
  }
  assert.equal(composed, 640);
});

test('the first secondary bends the primary attractor instead of adding a separate one', () => {
  let checked = 0;
  for (let i = 0; i < 300 && checked < 60; i++) {
    const sealed = sealedFor({ family: FAMILIES[i % 4], seed: `bend-${i}` });
    if (!sealed.secondary.length) continue;
    const inflections = catalog.grammar.architectures.find(a => a.id === sealed.secondary[0]).secondary.inflections;
    assert.ok(inflections.some(clause => sealed.attractors[0].endsWith(`, ${clause}.`)), sealed.attractors[0]);
    checked++;
  }
  assert.equal(checked, 60);
});

test('composed manifests project into bootstraps at every rung without leaks', () => {
  for (let i = 0; i < 24; i++) {
    const manifest = core.composeManifest(input({ family: FAMILIES[i % 4], seed: `project-${i}`, intensity: 1 + (i % 5) }), catalog, { created: CREATED });
    for (const rung of core.RUNGS) {
      const text = core.assembleBootstrap(manifest, catalog, { rung, label: `C-${i}` });
      assert.deepEqual(core.prefaceLeaks(text, manifest, catalog), []);
      assert.ok(text.endsWith('MWER-BOOTSTRAP-0.1-END\n'));
    }
    const full = core.assembleBootstrap(manifest, catalog);
    for (const statement of statements(manifest.sealed)) assert.ok(full.includes(statement));
  }
});

// ---------------------------------------------------------------- goldens

const goldenDir = new URL('fixtures/composed/', import.meta.url);
const goldens = readdirSync(goldenDir).filter(n => n.endsWith('.json')).sort()
  .map(name => ({ name, ...JSON.parse(readFileSync(new URL(name, goldenDir), 'utf8')) }));

test('golden fixtures cover every family, several intensities and every secondary count', () => {
  assert.ok(goldens.length >= 5);
  assert.deepEqual([...new Set(goldens.map(g => g.manifest.visible.family))].sort(), [...FAMILIES].sort());
  assert.ok(new Set(goldens.map(g => g.manifest.visible.intensity)).size >= 4);
  assert.deepEqual([...new Set(goldens.map(g => g.manifest.sealed.secondary.length))].sort(), [0, 1, 2]);
});

for (const golden of goldens) {
  test(`golden composition ${golden.name} is unchanged for composer ${core.COMPOSER_VERSION}`, () => {
    assert.equal(golden.manifest.provenance.composer.version, core.COMPOSER_VERSION,
      'This golden belongs to another composer version. Decide on a version change before regenerating goldens.');
    assert.deepEqual(core.composeManifest(golden.input, catalog, { created: golden.created }), golden.manifest);
  });
}

// ---------------------------------------------------------------- inspection tool

test('the inspection tool composes readable samples and agrees with the core', () => {
  const cwd = fileURLToPath(repoRoot);
  const text = spawnSync(process.execPath, ['tools/compose.js', '--count', '8'], { cwd, encoding: 'utf8' });
  assert.equal(text.status, 0, text.stderr);
  assert.equal(text.stdout.match(/^== inspect-\d+ \| /gm).length, 8);

  const json = spawnSync(process.execPath, ['tools/compose.js', '--seed', 'tool', '--family', 'identity', '--intensity', '2', '--created', CREATED, '--format', 'json'], { cwd, encoding: 'utf8' });
  assert.equal(json.status, 0, json.stderr);
  const expected = core.composeManifest({
    family: 'identity', setting: { path: [], description: null, request: null }, role: null, intensity: 2,
    boundaries: { sexual: 'none', violence: 'implied', language: 'moderate', exclude: [] }, seed: 'tool',
  }, catalog, { created: CREATED });
  assert.deepEqual(JSON.parse(json.stdout), expected);

  const bad = spawnSync(process.execPath, ['tools/compose.js', '--family', 'cosmic'], { cwd, encoding: 'utf8' });
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /Composer input is invalid/);
});

// Filled in from the first run of this algorithm; see the pinned-values test.
const PINNED_OUTPUTS = JSON.parse(readFileSync(new URL('fixtures/composed/random-pinned.txt', import.meta.url), 'utf8'));
