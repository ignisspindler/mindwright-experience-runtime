import { readFileSync } from 'node:fs';

export const repoRoot = new URL('../../', import.meta.url);

export function readRepoFile(relativePath) {
  return readFileSync(new URL(relativePath, repoRoot), 'utf8');
}

export function readRepoJSON(relativePath) {
  return JSON.parse(readRepoFile(relativePath));
}

// Each vocabulary file is { version, about, entries: [{ id, ... }] }.
// Returned as Maps keyed by id, in file order.
export function loadVocabulary() {
  const load = name => new Map(readRepoJSON(`vocabulary/${name}.json`).entries.map(e => [e.id, e]));
  return {
    families: load('families'),
    architectures: load('architectures'),
    mechanisms: load('mechanisms'),
    operators: load('operators'),
  };
}
