export const VOCABULARY_KINDS = ['families', 'architectures', 'mechanisms', 'operators'];

// Vocabulary as plain data is one { version, about, entries: [{ id, ... }] }
// object per kind. Semantic code works from Maps keyed by id, in file order.
// Already-indexed vocabularies pass through unchanged.
export function indexVocabulary(vocabulary) {
  if (VOCABULARY_KINDS.every(kind => vocabulary[kind] instanceof Map)) return vocabulary;
  return Object.fromEntries(VOCABULARY_KINDS.map(kind => [kind, new Map(vocabulary[kind].entries.map(e => [e.id, e]))]));
}
