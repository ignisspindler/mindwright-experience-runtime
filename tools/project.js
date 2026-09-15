#!/usr/bin/env node
// Assemble a bootstrap from a manifest. Usage:
//   node tools/project.js <manifest.json> [--rung S0|S1|S2|S3] [--label TEXT]
//                         [--return-url URL] [--out FILE]
// Without --out, the bootstrap is printed.
import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { assembleBootstrap, prefaceLeaks } from './lib/bootstrap.js';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    rung: { type: 'string' },
    label: { type: 'string' },
    'return-url': { type: 'string' },
    out: { type: 'string' },
  },
});

if (positionals.length !== 1) {
  console.error('usage: node tools/project.js <manifest.json> [--rung S0|S1|S2|S3] [--label TEXT] [--return-url URL] [--out FILE]');
  process.exit(2);
}

const manifest = JSON.parse(readFileSync(positionals[0], 'utf8'));
const bootstrap = assembleBootstrap(manifest, {
  rung: values.rung ?? null,
  label: values.label ?? null,
  ...(values['return-url'] ? { returnUrl: values['return-url'] } : {}),
});

const leaks = prefaceLeaks(bootstrap, manifest);
if (leaks.length) {
  console.error(`Sealed material appears before the divider: ${leaks.join('; ')}`);
  process.exit(1);
}

if (values.out) writeFileSync(values.out, bootstrap);
else process.stdout.write(bootstrap);
