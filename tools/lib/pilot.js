import { createHash } from 'node:crypto';
import { RUNGS } from './manifest.js';

export const HARNESSES = ['ChatGPT', 'Claude', 'Gemini'];
export const PILOT_SEED = 'mwer-pilot-0.1';

// Deterministic Fisher-Yates driven by SHA-256, so the plan never changes
// unless the seed or the set of manifests does.
export function seededShuffle(items, seed) {
  const out = [...items];
  let counter = 0;
  const random = () => createHash('sha256').update(`${seed}:${counter++}`).digest().readUInt32BE(0) / 2 ** 32;
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const pad = n => String(n).padStart(2, '0');

// entries: [{ slug, manifest }], one S3 manifest per architecture.
// Every architecture x rung becomes a cell with a neutral code. Plays are
// Tier A (each S3 cell in all three harnesses) and Tier B (S0-S2 in one
// harness each, rotated so every architecture's ladder meets all three).
export function planPilot(entries, vocab, seed = PILOT_SEED) {
  const order = [...vocab.architectures.keys()];
  const sorted = [...entries].sort((a, b) => order.indexOf(a.manifest.sealed.primary) - order.indexOf(b.manifest.sealed.primary));
  const groups = new Map(seededShuffle(sorted.map(e => e.slug), `${seed}:groups`).map((slug, i) => [slug, `G${pad(i + 1)}`]));

  const cells = seededShuffle(
    sorted.flatMap(e => RUNGS.map(rung => ({ slug: e.slug, group: groups.get(e.slug), rung }))),
    `${seed}:cells`,
  ).map((cell, i) => ({ code: `P-${pad(i + 1)}`, ...cell }));

  const plays = [];
  sorted.forEach((entry, g) => {
    const byRung = Object.fromEntries(cells.filter(c => c.slug === entry.slug).map(c => [c.rung, c]));
    for (const harness of HARNESSES) plays.push({ tier: 'A', code: byRung.S3.code, group: byRung.S3.group, harness });
    ['S0', 'S1', 'S2'].forEach((rung, r) => {
      plays.push({ tier: 'B', code: byRung[rung].code, group: byRung[rung].group, harness: HARNESSES[(g + r) % HARNESSES.length] });
    });
  });
  plays.sort((a, b) => a.tier.localeCompare(b.tier) || a.code.localeCompare(b.code) || HARNESSES.indexOf(a.harness) - HARNESSES.indexOf(b.harness));
  const counters = { A: 0, B: 0 };
  plays.forEach(p => { p.play = `${p.tier}${pad(++counters[p.tier])}`; });

  return { cells: cells.sort((a, b) => a.code.localeCompare(b.code)), plays };
}
