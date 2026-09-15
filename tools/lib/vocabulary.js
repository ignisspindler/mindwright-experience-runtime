// Node adapter: repository file access, and the vocabulary read from disk.
import { readFileSync } from 'node:fs';
import { indexVocabulary, VOCABULARY_KINDS } from '../core/vocabulary.js';

export const repoRoot = new URL('../../', import.meta.url);

export function readRepoFile(relativePath) {
  return readFileSync(new URL(relativePath, repoRoot), 'utf8');
}

export function readRepoJSON(relativePath) {
  return JSON.parse(readRepoFile(relativePath));
}

// The vocabulary files as plain data: { families, architectures, mechanisms, operators }.
export function loadVocabularyData() {
  return Object.fromEntries(VOCABULARY_KINDS.map(kind => [kind, readRepoJSON(`vocabulary/${kind}.json`)]));
}

// Each vocabulary file is { version, about, entries: [{ id, ... }] }.
// Returned as Maps keyed by id, in file order.
export function loadVocabulary() {
  return indexVocabulary(loadVocabularyData());
}
