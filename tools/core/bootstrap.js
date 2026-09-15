import { truncate, validateManifest } from './manifest.js';
import { indexVocabulary } from './vocabulary.js';

export const RUNTIME_VERSION = '0.1';
export const DEFAULT_RETURN_URL = 'https://github.com/ignisspindler/mindwright-experience-runtime/blob/main/pilot/REFLECTION.md';
export const MODEL_DIVIDER = '\n---\n';

// Bootstrap projection works from a plain-data runtime catalog:
//
//   {
//     schema,                 // schema/manifest.schema.json
//     vocabulary: { families, architectures, mechanisms, operators },
//                             // vocabulary/*.json (or an indexed vocabulary)
//     runtime: {
//       kernel,               // runtime/kernel.md, as text
//       cards: { 'arch.trap': text, ... },
//                             // runtime/cards/<name>.md, keyed by architecture id
//       dimensions: { scaffolding, pressures, expectation, realization },
//                             // runtime/dimensions/<name>.md, keyed by file name
//     },
//   }
//
// Texts are the repository files as written; comments are stripped here.

const endLine = tag => `MWER-${tag}-${RUNTIME_VERSION}-END`;

// Basis notes and other authoring comments never reach a model.
export function stripComments(text) {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function countWords(text) {
  return (text.match(/\S+/g) ?? []).length;
}

function runtimeText(texts, key, label) {
  const text = texts[key];
  if (text === undefined) throw new Error(`${label} is missing from the runtime catalog`);
  return text;
}

// The "## Primary" or "## Secondary" section of an architecture card.
export function cardSection(catalog, archId, role) {
  const file = `runtime/cards/${archId.replace(/^arch\./, '')}.md`;
  const text = stripComments(runtimeText(catalog.runtime.cards, archId, file));
  const heading = role === 'primary' ? '## Primary' : '## Secondary';
  const start = text.indexOf(heading);
  if (start < 0) throw new Error(`${file} has no "${heading}" section`);
  const rest = text.slice(start + heading.length);
  const next = rest.search(/^## /m);
  return (next < 0 ? rest : rest.slice(0, next)).trim();
}

function dimensionGuidance(catalog, name) {
  return stripComments(runtimeText(catalog.runtime.dimensions, name, `runtime/dimensions/${name}.md`));
}

function part(title, body, tag) {
  return `## ${title}\n\n${body}\n\n${endLine(tag)}`;
}

function participantPreface(label) {
  return [
    `# MindWright Experience${label ? ` · ${label}` : ''}`,
    '**If you are the participant, stop reading here.** This file is the score for the experience you chose, and everything after the line below is sealed. Reading on will spoil it. That is your right, but it can\'t be undone.',
    'To begin, start a new chat, attach this file, and send:',
    '> Begin the MindWright experience in the attached file.',
    'If your chat can\'t take attachments, paste this whole file as your first message instead. You can end the experience at any time by writing END EXPERIENCE.',
  ].join('\n\n');
}

function returnBlock(returnUrl) {
  return [
    'When the Runtime Kernel (section 9) calls for the return block, reproduce the two lines inside this fence exactly, without the fence:',
    '```text',
    '---',
    `MindWright · This experience has ended. To tell us what happened, if you'd like: ${returnUrl}`,
    '```',
  ].join('\n');
}

// Assemble a bootstrap for one manifest. With `rung`, the manifest is first
// truncated to that pilot rung; without it, the manifest is used as written,
// optional dimensions included.
export function assembleBootstrap(source, catalog, { rung = null, label = null, returnUrl = DEFAULT_RETURN_URL } = {}) {
  const manifest = rung ? truncate(source, rung) : structuredClone(source);
  const vocab = indexVocabulary(catalog.vocabulary);
  const { errors } = validateManifest(manifest, { schema: catalog.schema, vocabulary: vocab });
  if (errors.length) throw new Error(`Manifest is invalid:\n  ${errors.join('\n  ')}`);

  const sealed = manifest.sealed ?? {};
  const family = vocab.families.get(manifest.visible.family);
  const parts = [
    participantPreface(label),
    `# MindWright bootstrap, runtime ${RUNTIME_VERSION}\n\nEverything below is addressed to the model performing this experience. Read all of it before your first message, then begin the work as the Runtime Kernel describes.`,
    part('Runtime Kernel', stripComments(catalog.runtime.kernel), 'KERNEL'),
    part('Family note', `The participant chose the **${family.name}** family, described to them as:\n\n> ${family.description}`, 'FAMILY'),
    part('Manifest', `\`\`\`json\n${JSON.stringify(manifest, null, 2)}\n\`\`\``, 'MANIFEST'),
  ];

  if (sealed.primary) {
    const cards = [
      cardSection(catalog, sealed.primary, 'primary'),
      ...(sealed.secondary ?? []).map(id => cardSection(catalog, id, 'secondary')),
    ];
    parts.push(part('Architecture guidance', cards.join('\n\n'), 'GUIDANCE'));
  }

  const dimensions = [];
  if (sealed.scaffolding?.length) dimensions.push(dimensionGuidance(catalog, 'scaffolding'));
  if (sealed.mechanisms?.length || sealed.operators?.length) {
    const entries = [
      ...(sealed.mechanisms ?? []).map(id => vocab.mechanisms.get(id)),
      ...(sealed.operators ?? []).map(id => vocab.operators.get(id)),
    ];
    dimensions.push(`${dimensionGuidance(catalog, 'pressures')}\n\n${entries.map(e => `- \`${e.id}\`: ${e.gloss}`).join('\n')}`);
  }
  if (sealed.expectation) dimensions.push(dimensionGuidance(catalog, 'expectation'));
  if (sealed.realization) dimensions.push(dimensionGuidance(catalog, 'realization'));
  if (dimensions.length) parts.push(part('Dimension guidance', dimensions.join('\n\n'), 'DIMENSIONS'));

  parts.push(part('Return block', returnBlock(returnUrl), 'RETURN'));
  parts.push(`MWER-BOOTSTRAP-${RUNTIME_VERSION}-END`);

  const [preface, ...rest] = parts;
  return `${preface}\n${MODEL_DIVIDER}\n${rest.join('\n\n')}\n`;
}

// Sealed strings (and sealed architecture names) that appear in the part of a
// bootstrap a participant reads before the divider. Only the catalog's
// vocabulary is used.
export function prefaceLeaks(bootstrap, manifest, { vocabulary }) {
  const vocab = indexVocabulary(vocabulary);
  const preface = bootstrap.slice(0, bootstrap.indexOf(MODEL_DIVIDER)).toLowerCase();
  const sealed = manifest.sealed ?? {};
  const names = [sealed.primary, ...(sealed.secondary ?? [])]
    .filter(Boolean)
    .map(id => vocab.architectures.get(id)?.name);
  const phrases = [
    ...names,
    ...['attractors', 'invariants', 'secrets', 'scaffolding'].flatMap(f => sealed[f] ?? []),
    sealed.expectation,
    sealed.realization,
  ].filter(Boolean);
  return phrases.filter(p => preface.includes(p.toLowerCase()));
}
