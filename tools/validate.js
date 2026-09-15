#!/usr/bin/env node
// Validate manifests. Usage:
//   node tools/validate.js [file-or-dir ...]   (default: manifests/)
//   node tools/validate.js --digest file.json   print the digest too
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeDigest, validateManifest } from './lib/manifest.js';
import { loadVocabulary, repoRoot } from './lib/vocabulary.js';

const args = process.argv.slice(2);
const showDigest = args.includes('--digest');
const root = fileURLToPath(repoRoot);
const targets = args.filter(a => !a.startsWith('--'));
const files = (targets.length ? targets : [join(root, 'manifests')]).flatMap(collect);

function collect(path) {
  if (!existsSync(path)) return [];
  if (statSync(path).isDirectory()) return readdirSync(path).sort().flatMap(name => collect(join(path, name)));
  return path.endsWith('.json') ? [path] : [];
}

const vocab = loadVocabulary();
let failed = 0;

for (const file of files) {
  const name = relative(process.cwd(), file);
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    console.log(`FAIL  ${name}\n      not valid JSON: ${err.message}`);
    failed++;
    continue;
  }
  const { errors, warnings } = validateManifest(manifest, vocab);
  console.log(`${errors.length ? 'FAIL' : 'ok  '}  ${name}`);
  for (const e of errors) console.log(`      error: ${e}`);
  for (const w of warnings) console.log(`      warn:  ${w}`);
  if (showDigest && !errors.length) console.log(`      digest: ${computeDigest(manifest)}`);
  if (errors.length) failed++;
}

if (!files.length) console.log('No manifests found.');
process.exit(failed ? 1 : 0);
