import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadVocabulary, readRepoJSON } from '../tools/lib/vocabulary.js';

const vocab = loadVocabulary();

test('there are twelve architectures, three per family', () => {
  assert.equal(vocab.architectures.size, 12);
  for (const family of vocab.families.keys()) {
    const members = [...vocab.architectures.values()].filter(a => a.family === family);
    assert.equal(members.length, 3, `${family} has ${members.length} architectures`);
  }
});

test('ids are namespaced and unique within each vocabulary', () => {
  const prefixes = { architectures: 'arch.', mechanisms: 'mech.', operators: 'op.' };
  for (const [file, prefix] of Object.entries(prefixes)) {
    const entries = readRepoJSON(`vocabulary/${file}.json`).entries;
    assert.equal(new Set(entries.map(e => e.id)).size, entries.length, `${file} has duplicate ids`);
    for (const e of entries) assert.ok(e.id.startsWith(prefix), `${e.id} should start with ${prefix}`);
  }
});

test('every entry has a name and a gloss or description', () => {
  for (const [kind, map] of Object.entries(vocab)) {
    for (const e of map.values()) {
      assert.ok(e.name, `${kind} ${e.id} has no name`);
      assert.ok(e.gloss || e.description, `${kind} ${e.id} has no gloss or description`);
    }
  }
});

test('reveal policies are not operators', () => {
  assert.ok(!vocab.operators.has('op.reveal'));
  assert.ok(!vocab.operators.has('op.do_not_reveal'));
});
