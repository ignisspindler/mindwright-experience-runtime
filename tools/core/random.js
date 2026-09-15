import { sha256Hex } from './sha256.js';

// Deterministic, portable randomness for semantic selection.
//
// Algorithm: xoshiro128** (Blackman and Vigna), a 32-bit generator whose
// state updates use only 32-bit integer operations, so every JavaScript
// engine produces the same sequence. The four state words are the first
// 32 hex digits of SHA-256(key), read as big-endian unsigned integers.
//
// Keys are strings. Callers normalize their own inputs before building a key
// (the composer uses NFC-normalized seeds). Changing anything in this file
// changes composed scores and therefore requires a new composer version.

export const RANDOM_ALGORITHM = 'xoshiro128** seeded with SHA-256(key)';

const TWO_32 = 0x100000000;
const rotl = (x, k) => (x << k) | (x >>> (32 - k));

export function createRandom(key) {
  if (typeof key !== 'string' || key.length === 0) throw new Error('A random stream needs a non-empty string key');

  const hex = sha256Hex(key);
  const s = new Uint32Array(4);
  for (let i = 0; i < 4; i++) s[i] = parseInt(hex.slice(i * 8, i * 8 + 8), 16);
  if ((s[0] | s[1] | s[2] | s[3]) === 0) s[0] = 1; // the all-zero state is invalid for xoshiro

  function nextUint32() {
    const result = Math.imul(rotl(Math.imul(s[1], 5), 7), 9) >>> 0;
    const t = s[1] << 9;
    s[2] ^= s[0];
    s[3] ^= s[1];
    s[1] ^= s[2];
    s[0] ^= s[3];
    s[2] ^= t;
    s[3] = rotl(s[3], 11);
    return result;
  }

  // Uniform integer in [0, n), by rejection sampling so no value is favored.
  function int(n) {
    if (!Number.isInteger(n) || n < 1 || n > TWO_32) throw new Error(`Cannot draw an integer below ${n}`);
    const limit = TWO_32 - (TWO_32 % n);
    let x;
    do x = nextUint32(); while (x >= limit);
    return x % n;
  }

  function pick(list) {
    if (!list.length) throw new Error('Cannot pick from an empty list');
    return list[int(list.length)];
  }

  // True with probability k / n.
  function chance(k, n) {
    return int(n) < k;
  }

  // k distinct items, returned in their original list order.
  function sample(list, k) {
    const remaining = list.map((_, i) => i);
    const chosen = [];
    while (chosen.length < Math.min(k, list.length)) chosen.push(remaining.splice(int(remaining.length), 1)[0]);
    return chosen.sort((a, b) => a - b).map(i => list[i]);
  }

  return { nextUint32, int, pick, chance, sample };
}
