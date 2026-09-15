// The portable MWER semantic core. Nothing under tools/core/ may touch the
// filesystem, the network, environment variables or process state: callers
// supply the schema, vocabulary and runtime texts as plain data. Node tools
// reach it through the adapters in tools/lib/.
export { canonicalJSON, computeDigest, DIMENSION_FIELDS, RUNGS, truncate, validateManifest } from './manifest.js';
export {
  assembleBootstrap, cardSection, countWords, DEFAULT_RETURN_URL, MODEL_DIVIDER, prefaceLeaks, RUNTIME_VERSION, stripComments,
} from './bootstrap.js';
export { checkSchema } from './schema-check.js';
export { sha256Hex } from './sha256.js';
export { indexVocabulary, VOCABULARY_KINDS } from './vocabulary.js';
