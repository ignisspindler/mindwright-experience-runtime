import { validateManifest } from './manifest.js';
import { createRandom } from './random.js';
import { checkSchema } from './schema-check.js';
import { indexVocabulary } from './vocabulary.js';

// The deterministic composer: participant-visible choices plus a seed become
// a thin S3 score, with no language model. It works from supplied data:
//
//   catalog: { schema, vocabulary, grammar }   (grammar = composer/grammar.json)
//
// A composed score depends only on COMPOSER_VERSION, the normalized input and
// the seed. `created` is metadata supplied by the caller and never enters
// composition. Anything that could change the score for the same version,
// input and seed (the grammar, the draw order below, the random algorithm)
// requires a new COMPOSER_VERSION.

export const COMPOSER_VERSION = '0.1.0';

const SLOTS = ['object', 'engagement'];
const SLOT_PATTERN = /\{(object|engagement)\}/g;

// 0, 1 or 2 secondaries, with one secondary twice as likely as none or two.
const SECONDARY_COUNTS = [0, 1, 1, 2];

export class ComposerInputError extends Error {
  constructor(errors) {
    super(`Composer input is invalid:\n  ${errors.join('\n  ')}`);
    this.name = 'ComposerInputError';
    this.errors = errors;
  }
}

// The input reuses the manifest schema's own definitions for the visible frame.
function inputSchema(schema) {
  const visible = schema.$defs.visible.properties;
  return {
    $defs: schema.$defs,
    type: 'object',
    additionalProperties: false,
    required: ['family', 'setting', 'intensity', 'boundaries', 'seed'],
    properties: {
      family: visible.family,
      setting: visible.setting,
      role: visible.role,
      intensity: visible.intensity,
      boundaries: visible.boundaries,
      seed: { type: 'string', minLength: 1 },
    },
  };
}

// Validates composer input and returns it normalized: optional fields become
// null, arrays are copied, and the seed is Unicode NFC-normalized. Setting text
// and role pass through exactly as given.
export function normalizeComposerInput(input, { schema }) {
  const errors = checkSchema(inputSchema(schema), input);
  if (!errors.length && !/\S/u.test(input.seed)) errors.push('$.seed: must contain a non-whitespace character');
  if (errors.length) throw new ComposerInputError(errors);
  return {
    family: input.family,
    setting: {
      path: [...input.setting.path],
      description: input.setting.description ?? null,
      request: input.setting.request ?? null,
    },
    role: input.role ?? null,
    intensity: input.intensity,
    boundaries: { ...input.boundaries, exclude: [...input.boundaries.exclude] },
    seed: input.seed.normalize('NFC'),
  };
}

const fragmentText = fragment => (typeof fragment === 'string' ? fragment : fragment?.text);

function eligible(fragments, intensity) {
  return (fragments ?? [])
    .filter(f => typeof f === 'string' || (Array.isArray(f?.intensity) && intensity >= f.intensity[0] && intensity <= f.intensity[1]))
    .map(fragmentText);
}

const capitalize = text => text.charAt(0).toUpperCase() + text.slice(1);

// Resolve a secondary fragment against the primary architecture's phrases.
export function bindToPrimary(text, primaryEntry) {
  return capitalize(text.replace(SLOT_PATTERN, (_, slot) => primaryEntry[slot]));
}

export function validateGrammar(grammar, vocabulary) {
  const vocab = indexVocabulary(vocabulary);
  const errors = [];
  if (grammar?.composer !== COMPOSER_VERSION) errors.push(`grammar is for composer ${grammar?.composer}, but this is composer ${COMPOSER_VERSION}`);

  const entries = Array.isArray(grammar?.architectures) ? grammar.architectures : [];
  const ids = entries.map(e => e?.id);
  for (const id of vocab.architectures.keys()) if (!ids.includes(id)) errors.push(`${id}: missing from the grammar`);
  for (const id of ids) if (!vocab.architectures.has(id)) errors.push(`${id}: not an architecture in the vocabulary`);
  if (new Set(ids).size !== ids.length) errors.push('an architecture appears more than once');

  for (const entry of entries) {
    const at = path => `${entry?.id}.${path}`;

    const statement = (text, path, { slots = false, clause = false } = {}) => {
      if (typeof text !== 'string' || !text.trim()) {
        errors.push(`${at(path)}: must be a non-empty string`);
        return;
      }
      for (const [, name] of text.matchAll(/\{([^{}]*)\}/g)) {
        if (!slots || !SLOTS.includes(name)) errors.push(`${at(path)}: unexpected slot {${name}}`);
      }
      if (/[{}]/.test(text.replace(/\{[^{}]*\}/g, ''))) errors.push(`${at(path)}: unbalanced brace`);
      if (/\s{2,}|^\s|\s$/.test(text)) errors.push(`${at(path)}: irregular whitespace`);
      if (clause) {
        if (!/^[a-z]/.test(text) || /[.!?;,]$/.test(text)) errors.push(`${at(path)}: an inflection starts lowercase and has no final punctuation`);
      } else if (!(/^[A-Z]/.test(text) || (slots && /^\{(object|engagement)\}/.test(text))) || !text.endsWith('.')) {
        errors.push(`${at(path)}: a statement starts with a capital letter${slots ? ' or a slot' : ''} and ends with a period`);
      }
    };

    const fragments = (list, path, options) => {
      if (!Array.isArray(list)) {
        errors.push(`${at(path)}: must be a list`);
        return;
      }
      list.forEach((fragment, i) => {
        if (typeof fragment !== 'string') {
          const range = fragment?.intensity;
          const valid = Array.isArray(range) && range.length === 2 && range.every(Number.isInteger) && range[0] >= 1 && range[0] <= range[1] && range[1] <= 5;
          if (!valid) errors.push(`${at(`${path}[${i}]`)}: intensity must be [min, max] within 1 to 5`);
        }
        statement(fragmentText(fragment), `${path}[${i}]`, options);
      });
    };

    for (const phrase of SLOTS) {
      if (typeof entry?.[phrase] !== 'string' || !/^[a-z]/.test(entry[phrase]) || /[.{}]/.test(entry[phrase])) {
        errors.push(`${at(phrase)}: must be a lowercase phrase without braces or a final period`);
      }
    }

    const primary = entry?.primary ?? {};
    const secondary = entry?.secondary ?? {};
    fragments(primary.attractors, 'primary.attractors');
    statement(primary.core, 'primary.core');
    fragments(primary.invariants, 'primary.invariants');
    fragments(primary.secrets, 'primary.secrets');
    if (typeof primary.secretRequired !== 'boolean') errors.push(`${at('primary.secretRequired')}: must be true or false`);
    fragments(secondary.inflections, 'secondary.inflections', { clause: true });
    fragments(secondary.invariants, 'secondary.invariants', { slots: true });
    fragments(secondary.attractors, 'secondary.attractors', { slots: true });
    fragments(secondary.secrets, 'secondary.secrets', { slots: true });

    for (let level = 1; level <= 5; level++) {
      const count = list => eligible(Array.isArray(list) ? list : [], level).length;
      if (count(primary.attractors) < 1) errors.push(`${at('primary.attractors')}: nothing eligible at intensity ${level}`);
      if (count(primary.invariants) < 2) errors.push(`${at('primary.invariants')}: fewer than two eligible at intensity ${level}`);
      if (primary.secretRequired === true && count(primary.secrets) < 1) errors.push(`${at('primary.secrets')}: a secret is required but none is eligible at intensity ${level}`);
      for (const key of ['inflections', 'invariants', 'attractors']) {
        if (count(secondary[key]) < 1) errors.push(`${at(`secondary.${key}`)}: nothing eligible at intensity ${level}`);
      }
    }
  }
  return errors;
}

function streamFor(input, label) {
  return createRandom(JSON.stringify(['mwer-composer', COMPOSER_VERSION, input.family, input.seed, label]));
}

// The sealed S3 score for normalized input. Two independent random streams,
// keyed by composer version, family, seed and a label:
//   "architectures": primary, secondary count, each secondary, in that order.
//   "statements": primary attractor, first secondary's inflection, first
//     secondary's invariant, second secondary's attractor-or-invariant choice
//     and statement, extra primary invariants, primary secret, then one
//     chance at a secret per secondary.
// Intensity is not part of the key: it only narrows which fragments are
// eligible, so the same seed keeps its architectures across intensities.
export function composeSealed(input, { vocabulary, grammar }) {
  const grammarErrors = validateGrammar(grammar, vocabulary);
  if (grammarErrors.length) throw new Error(`Composition grammar is invalid:\n  ${grammarErrors.join('\n  ')}`);

  const vocab = indexVocabulary(vocabulary);
  const entries = new Map(grammar.architectures.map(entry => [entry.id, entry]));

  const choose = streamFor(input, 'architectures');
  const primary = choose.pick([...vocab.architectures.values()].filter(a => a.family === input.family).map(a => a.id));
  const count = SECONDARY_COUNTS[choose.int(SECONDARY_COUNTS.length)];
  const secondary = [];
  while (secondary.length < count) {
    secondary.push(choose.pick([...vocab.architectures.keys()].filter(id => id !== primary && !secondary.includes(id))));
  }

  const draw = streamFor(input, 'statements');
  const lead = entries.get(primary);
  const [first, second] = secondary.map(id => entries.get(id));
  const pool = fragments => eligible(fragments, input.intensity);
  const bind = text => bindToPrimary(text, lead);

  let attractor = draw.pick(pool(lead.primary.attractors));
  if (first) attractor = `${attractor.slice(0, -1)}, ${draw.pick(pool(first.secondary.inflections))}.`;
  const attractors = [attractor];

  const boundInvariants = [];
  if (first) boundInvariants.push(bind(draw.pick(pool(first.secondary.invariants))));
  if (second) {
    if (draw.chance(1, 2)) attractors.push(bind(draw.pick(pool(second.secondary.attractors))));
    else boundInvariants.push(bind(draw.pick(pool(second.secondary.invariants))));
  }

  const extra = secondary.length === 0 ? 1 + draw.int(2) : 1;
  const invariants = [lead.primary.core, ...draw.sample(pool(lead.primary.invariants), extra), ...boundInvariants];

  const secrets = [];
  const leadSecrets = pool(lead.primary.secrets);
  if (leadSecrets.length && (lead.primary.secretRequired || draw.chance(1, 2))) secrets.push(draw.pick(leadSecrets));
  for (const entry of [first, second]) {
    if (!entry) continue;
    const bound = pool(entry.secondary.secrets);
    if (bound.length && draw.chance(1, 3)) secrets.push(bind(draw.pick(bound)));
  }

  return { primary, secondary, attractors, invariants, secrets };
}

// A complete, valid, unregistered manifest. `created` must be supplied.
export function composeManifest(input, catalog, { created } = {}) {
  const normalized = normalizeComposerInput(input, catalog);
  const createdPattern = new RegExp(catalog.schema.properties.created.pattern, 'u');
  if (typeof created !== 'string' || !createdPattern.test(created)) {
    throw new Error('composeManifest needs options.created, a UTC timestamp such as 2026-09-15T00:00:00Z. The clock never enters composition, so the caller supplies it.');
  }

  const manifest = {
    mwer: catalog.schema.properties.mwer.const,
    id: null,
    revision: 1,
    created,
    digest: null,
    provenance: {
      mode: 'composed',
      composer: { version: COMPOSER_VERSION, seed: normalized.seed },
    },
    visible: {
      family: normalized.family,
      setting: normalized.setting,
      role: normalized.role,
      intensity: normalized.intensity,
      boundaries: normalized.boundaries,
    },
    sealed: composeSealed(normalized, catalog),
  };

  const { errors } = validateManifest(manifest, catalog);
  if (errors.length) throw new Error(`Composed manifest failed validation:\n  ${errors.join('\n  ')}`);
  return manifest;
}
