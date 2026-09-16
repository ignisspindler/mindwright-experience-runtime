import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import {
  MODEL_DIVIDER, RUNTIME_VERSION, assembleBootstrap, cardSection, countWords, prefaceLeaks, stripComments,
} from '../tools/lib/bootstrap.js';
import { loadVocabulary, readRepoFile } from '../tools/lib/vocabulary.js';

const read = name => JSON.parse(readFileSync(new URL(`fixtures/valid/${name}`, import.meta.url), 'utf8'));
const vocab = loadVocabulary();
const end = tag => `MWER-${tag}-${RUNTIME_VERSION}-END`;

test('an S0 bootstrap carries the frame only', () => {
  const text = assembleBootstrap(read('s3-seduction.json'), { rung: 'S0' });
  for (const tag of ['KERNEL', 'FAMILY', 'MANIFEST', 'RETURN', 'BOOTSTRAP']) assert.ok(text.includes(end(tag)), `missing ${tag} end line`);
  assert.ok(!text.includes(end('GUIDANCE')));
  assert.ok(!text.includes('"sealed"'));
  assert.ok(!text.includes('SEDUCTION'));
  assert.ok(text.includes('Give me Star Trek!!'));
});

test('each rung adds exactly its own sealed material', () => {
  const full = read('s3-seduction.json');
  const s1 = assembleBootstrap(full, { rung: 'S1' });
  const s2 = assembleBootstrap(full, { rung: 'S2' });
  const s3 = assembleBootstrap(full, { rung: 'S3' });
  const attractor = full.sealed.attractors[0];
  const invariant = full.sealed.invariants[0];
  assert.ok(s1.includes('**SEDUCTION.**') && s1.includes('**CONSTRAINT (secondary).**'));
  assert.ok(!s1.includes(attractor));
  assert.ok(s2.includes(attractor) && !s2.includes(invariant));
  assert.ok(s3.includes(attractor) && s3.includes(invariant));
});

test('optional dimensions bring their guidance and glosses only when present', () => {
  const full = read('dimensions.json');
  const withDims = assembleBootstrap(full);
  assert.ok(withDims.includes(end('DIMENSIONS')));
  assert.ok(withDims.includes('**SCAFFOLDING.**'));
  assert.ok(withDims.includes(vocab.mechanisms.get('mech.commitment').gloss));
  assert.ok(withDims.includes('**REALIZATION.**'));
  const s3 = assembleBootstrap(full, { rung: 'S3' });
  assert.ok(!s3.includes(end('DIMENSIONS')));
  assert.ok(!s3.includes(full.sealed.scaffolding[0]));
});

test('authoring comments never reach a bootstrap', () => {
  const text = assembleBootstrap(read('dimensions.json'));
  assert.ok(!text.includes('<!--'));
  assert.ok(!text.includes('basis:'));
});

test('the return block is fixed infrastructure with the given URL', () => {
  const text = assembleBootstrap(read('s0-frame.json'), { returnUrl: 'https://example.org/back' });
  assert.ok(text.includes('MindWright · This experience has ended. To tell us what happened, if you\'d like: https://example.org/back'));
});

test('nothing sealed appears before the participant divider', () => {
  for (const name of ['s3-seduction.json', 'dimensions.json']) {
    const manifest = read(name);
    const text = assembleBootstrap(manifest, { label: 'P-01' });
    assert.ok(text.indexOf(MODEL_DIVIDER) > 0);
    assert.deepEqual(prefaceLeaks(text, manifest), []);
  }
});

test('a label naming a sealed architecture is caught as a leak', () => {
  const manifest = read('s3-seduction.json');
  const text = assembleBootstrap(manifest, { label: 'Seduction pilot' });
  assert.deepEqual(prefaceLeaks(text, manifest), ['Seduction']);
});

test('an invalid manifest is refused', () => {
  const manifest = read('s3-seduction.json');
  manifest.sealed.primary = 'arch.trap';
  assert.throws(() => assembleBootstrap(manifest), /Manifest is invalid/);
});

test('every architecture has a card with both forms, within budget', () => {
  const cards = readdirSync(new URL('../runtime/cards/', import.meta.url));
  assert.equal(cards.length, 12);
  for (const arch of vocab.architectures.values()) {
    const primary = cardSection(arch.id, 'primary');
    const secondary = cardSection(arch.id, 'secondary');
    assert.ok(primary.startsWith(`**${arch.name.toUpperCase()}.**`), `${arch.id} primary card should open with its name`);
    assert.ok(countWords(primary) <= 150, `${arch.id} primary card is ${countWords(primary)} words`);
    assert.ok(countWords(secondary) <= 60, `${arch.id} secondary card is ${countWords(secondary)} words`);
  }
});

test('the kernel stays small', () => {
  const words = countWords(stripComments(readRepoFile('runtime/kernel.md')));
  assert.ok(words <= 1000, `kernel is ${words} words`);
});

// Semantic completion lives in the Kernel, so it reaches every performance,
// including S0 scores that name no architecture and load no card.
test('every bootstrap carries the completion guidance and its exception', () => {
  const text = assembleBootstrap(read('s0-frame.json'), { rung: 'S0' });
  assert.ok(text.includes(end('KERNEL')));
  assert.ok(!text.includes(end('GUIDANCE')), 'an S0 score loads no architecture card');
  assert.ok(text.includes('end it rather than opening a new arc'));
  assert.ok(text.includes('Prefer one landed transformation to serial escalation.'));
  assert.ok(text.includes('Some works genuinely need more than one such shift'), 'the multiple-shift exception must survive');
});

// The stopping criterion is semantic. It must not harden into a plot template.
test('completion guidance mandates no turn count, reveal or act structure', () => {
  const kernel = stripComments(readRepoFile('runtime/kernel.md'));
  assert.doesNotMatch(kernel, /\b\d+\s+turns?\b/i, 'no fixed turn count');
  assert.doesNotMatch(kernel, /\breveals?\b/i, 'no required reveal');
  assert.doesNotMatch(kernel, /\btwists?\b/i, 'no required twist');
  assert.doesNotMatch(kernel, /\bthree[- ]act\b/i, 'no act structure');
});
