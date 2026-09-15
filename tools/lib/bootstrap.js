// Node adapter for bootstrap projection: the portable core in tools/core/,
// fed with the runtime catalog read from this repository.
import * as core from '../core/bootstrap.js';
import { loadCatalog } from './catalog.js';
import { loadVocabulary } from './vocabulary.js';

export { countWords, DEFAULT_RETURN_URL, MODEL_DIVIDER, RUNTIME_VERSION, stripComments } from '../core/bootstrap.js';

// The "## Primary" or "## Secondary" section of an architecture card.
export function cardSection(archId, role) {
  return core.cardSection(loadCatalog(), archId, role);
}

// Options: rung, label, returnUrl, and optionally an already-loaded vocabulary.
export function assembleBootstrap(source, { vocab, ...options } = {}) {
  const catalog = loadCatalog();
  if (vocab) catalog.vocabulary = vocab;
  return core.assembleBootstrap(source, catalog, options);
}

export function prefaceLeaks(bootstrap, manifest, vocab = loadVocabulary()) {
  return core.prefaceLeaks(bootstrap, manifest, { vocabulary: vocab });
}
