// Node adapter: builds the plain-data runtime catalog described in
// tools/core/bootstrap.js from this repository's files.
import { readdirSync } from 'node:fs';
import { loadVocabularyData, readRepoFile, readRepoJSON, repoRoot } from './vocabulary.js';

function markdownFiles(dir) {
  return readdirSync(new URL(`${dir}/`, repoRoot))
    .filter(name => name.endsWith('.md'))
    .sort()
    .map(name => [name.slice(0, -'.md'.length), readRepoFile(`${dir}/${name}`)]);
}

export function loadCatalog() {
  return {
    schema: readRepoJSON('schema/manifest.schema.json'),
    vocabulary: loadVocabularyData(),
    grammar: readRepoJSON('composer/grammar.json'),
    runtime: {
      kernel: readRepoFile('runtime/kernel.md'),
      cards: Object.fromEntries(markdownFiles('runtime/cards').map(([name, text]) => [`arch.${name}`, text])),
      dimensions: Object.fromEntries(markdownFiles('runtime/dimensions')),
    },
  };
}
