import { createHash } from 'node:crypto';
import { checkSchema } from './schema-check.js';
import { loadVocabulary, readRepoJSON } from './vocabulary.js';

export const RUNGS = ['S0', 'S1', 'S2', 'S3'];

// Sealed fields each rung adds. Everything else in `sealed` is an optional
// dimension (scaffolding, mechanisms, operators, expectation, realization).
const RUNG_FIELDS = {
  S1: ['primary', 'secondary'],
  S2: ['attractors'],
  S3: ['invariants', 'secrets'],
};
export const DIMENSION_FIELDS = ['scaffolding', 'mechanisms', 'operators', 'expectation', 'realization'];

const schema = readRepoJSON('schema/manifest.schema.json');

// Sorted keys, no whitespace: the form the digest is computed over.
export function canonicalJSON(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonicalJSON(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function computeDigest(manifest) {
  const hash = createHash('sha256').update(canonicalJSON({ ...manifest, digest: null }));
  return `sha256:${hash.digest('hex')}`;
}

// The pilot variant of a manifest at a rung: sealed fields above that rung
// and all optional dimensions are removed. A truncated variant is a different
// score, so it carries no id or digest of its own.
export function truncate(manifest, rung) {
  const level = RUNGS.indexOf(rung);
  if (level < 0) throw new Error(`Unknown rung: ${rung}`);
  const variant = structuredClone(manifest);
  variant.id = null;
  variant.digest = null;
  variant.provenance.derived_from = manifest.id ?? manifest.provenance.derived_from ?? null;
  if (level === 0) {
    delete variant.sealed;
    return variant;
  }
  const sealed = {};
  for (const r of RUNGS.slice(1, level + 1)) {
    for (const field of RUNG_FIELDS[r]) {
      if (manifest.sealed?.[field] !== undefined) sealed[field] = structuredClone(manifest.sealed[field]);
    }
  }
  variant.sealed = sealed;
  return variant;
}

export function validateManifest(manifest, vocab = loadVocabulary()) {
  const errors = checkSchema(schema, manifest);
  const warnings = [];
  if (errors.length) return { errors, warnings };

  const { visible, sealed, provenance } = manifest;

  if (sealed) {
    const hasContent = Object.keys(sealed).some(k => k !== 'primary');
    if (!sealed.primary && hasContent) errors.push('$.sealed: sealed content requires a primary architecture');

    if (sealed.primary) {
      const arch = vocab.architectures.get(sealed.primary);
      if (!arch) errors.push(`$.sealed.primary: unknown architecture ${sealed.primary}`);
      else if (arch.family !== visible.family) {
        errors.push(`$.sealed.primary: ${sealed.primary} belongs to the ${arch.family} family, but the manifest's family is ${visible.family}`);
      }
    }
    for (const id of sealed.secondary ?? []) {
      if (!vocab.architectures.has(id)) errors.push(`$.sealed.secondary: unknown architecture ${id}`);
      if (id === sealed.primary) errors.push(`$.sealed.secondary: ${id} is already the primary`);
    }
    for (const id of sealed.mechanisms ?? []) {
      if (!vocab.mechanisms.has(id)) errors.push(`$.sealed.mechanisms: unknown mechanism ${id}`);
    }
    for (const id of sealed.operators ?? []) {
      if (!vocab.operators.has(id)) errors.push(`$.sealed.operators: unknown operator ${id}`);
    }

    if ((sealed.invariants?.length || sealed.secrets?.length) && !sealed.attractors?.length) {
      warnings.push('$.sealed: invariants or secrets without attractors; truncation to S2 will leave nothing to add at that rung');
    }
    (sealed.scaffolding ?? []).forEach((gate, i) => {
      if (/\bturns?\s*\d|\bscenes?\b|["“”]/i.test(gate)) {
        warnings.push(`$.sealed.scaffolding[${i}]: reads like a scene, turn or scripted line; scaffolding describes conditions`);
      }
    });

    const visibleText = [visible.title, visible.premise, visible.role, visible.setting.description]
      .filter(Boolean).join(' ').toLowerCase();
    for (const id of [sealed.primary, ...(sealed.secondary ?? [])].filter(Boolean)) {
      const name = vocab.architectures.get(id)?.name.toLowerCase();
      if (name && new RegExp(`\\b${name}\\b`).test(visibleText)) {
        warnings.push(`$.visible: mentions "${name}", the name of a sealed architecture`);
      }
    }
  }

  if (provenance.mode === 'composed') {
    if (!provenance.composer) errors.push('$.provenance: a composed manifest must record its composer version and seed');
    if (sealed?.realization) warnings.push('$.sealed.realization: a composed manifest carries authored realization');
  }

  if (manifest.id && !manifest.digest) errors.push('$.digest: a registered manifest (with an id) must carry its digest');
  if (manifest.digest && manifest.digest !== computeDigest(manifest)) errors.push('$.digest: does not match the manifest content');

  return { errors, warnings };
}
