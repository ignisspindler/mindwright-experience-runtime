#!/usr/bin/env node
// Compose scores for human inspection. A developer tool: nothing it prints is
// canonical repository data.
//
//   node tools/compose.js [--count 20] [--seed-prefix inspect] [--seed SEED]
//                         [--family all|epistemic|agency|identity|world]
//                         [--intensity all|1..5]
//                         [--path a/b] [--description TEXT] [--request TEXT] [--role TEXT]
//                         [--sexual none] [--violence implied] [--language moderate]
//                         [--exclude TEXT]... [--created TIMESTAMP] [--format text|json]
//
// With --seed, one score is composed (unless --count says otherwise).
// With "all", families and intensities cycle across the sample.
import { parseArgs } from 'node:util';
import { COMPOSER_VERSION, ComposerInputError, composeManifest } from './core/composer.js';
import { loadCatalog } from './lib/catalog.js';

const { values } = parseArgs({
  options: {
    count: { type: 'string' },
    'seed-prefix': { type: 'string', default: 'inspect' },
    seed: { type: 'string' },
    family: { type: 'string', default: 'all' },
    intensity: { type: 'string', default: 'all' },
    path: { type: 'string', default: '' },
    description: { type: 'string' },
    request: { type: 'string' },
    role: { type: 'string' },
    sexual: { type: 'string', default: 'none' },
    violence: { type: 'string', default: 'implied' },
    language: { type: 'string', default: 'moderate' },
    exclude: { type: 'string', multiple: true, default: [] },
    created: { type: 'string' },
    format: { type: 'string', default: 'text' },
  },
});

const catalog = loadCatalog();
const families = values.family === 'all' ? catalog.vocabulary.families.entries.map(f => f.id) : [values.family];
const intensities = values.intensity === 'all' ? [1, 2, 3, 4, 5] : [Number(values.intensity)];
const count = Number(values.count ?? (values.seed ? 1 : 20));
const created = values.created ?? new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const architectures = new Map(catalog.vocabulary.architectures.entries.map(a => [a.id, a.name]));

if (!Number.isInteger(count) || count < 1) {
  console.error('--count must be a positive integer');
  process.exit(2);
}

const manifests = [];
try {
  for (let i = 0; i < count; i++) {
    const seed = values.seed ? (count === 1 ? values.seed : `${values.seed}-${i + 1}`) : `${values['seed-prefix']}-${i + 1}`;
    manifests.push(composeManifest({
      family: families[i % families.length],
      setting: {
        path: values.path ? values.path.split('/') : [],
        description: values.description ?? null,
        request: values.request ?? null,
      },
      role: values.role ?? null,
      intensity: intensities[i % intensities.length],
      boundaries: { sexual: values.sexual, violence: values.violence, language: values.language, exclude: values.exclude },
      seed,
    }, catalog, { created }));
  }
} catch (error) {
  console.error(error instanceof ComposerInputError ? error.message : error.stack);
  process.exit(2);
}

if (values.format === 'json') {
  console.log(JSON.stringify(count === 1 ? manifests[0] : manifests, null, 2));
} else {
  console.log(`Composer ${COMPOSER_VERSION}: ${count} score${count === 1 ? '' : 's'}\n`);
  for (const m of manifests) {
    const { sealed, visible } = m;
    const list = items => (items.length ? items.map(t => `  - ${t}`).join('\n') : '  (none)');
    console.log([
      `== ${m.provenance.composer.seed} | ${visible.family} | intensity ${visible.intensity} ==`,
      `primary     ${architectures.get(sealed.primary)}`,
      `secondary   ${sealed.secondary.map(id => architectures.get(id)).join(', ') || '(none)'}`,
      'attractors',
      list(sealed.attractors),
      'invariants',
      list(sealed.invariants),
      'secrets',
      list(sealed.secrets),
      '',
    ].join('\n'));
  }
}
