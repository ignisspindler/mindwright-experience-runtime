// Node adapter for manifest semantics: the portable core in tools/core/, with
// the schema read from this repository and the repository vocabulary as the
// default.
import * as core from '../core/manifest.js';
import { loadVocabulary, readRepoJSON } from './vocabulary.js';

export { canonicalJSON, computeDigest, DIMENSION_FIELDS, RUNGS, truncate } from '../core/manifest.js';

const schema = readRepoJSON('schema/manifest.schema.json');

export function validateManifest(manifest, vocab = loadVocabulary()) {
  return core.validateManifest(manifest, { schema, vocabulary: vocab });
}
