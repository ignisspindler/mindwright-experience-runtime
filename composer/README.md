# Composer grammar

> **Spoilers, in a structural sense.** This folder shows how composed scores are put together. It doesn't reveal any particular Experience, but it does show the shapes they can take.

`grammar.json` is the plain data the deterministic composer (`tools/core/composer.js`) uses to build a thin S3 score from a participant's visible choices and a seed. No language model is involved.

It is kept apart from `runtime/cards/` on purpose. A card teaches a performing model how to realize an architecture. The grammar teaches software how to write a score. They share a vocabulary and nothing else.

## What a score is made of

For each architecture, the grammar holds:

| Field | Used when | What it is |
|---|---|---|
| `object` | the architecture is primary | a noun phrase for what the participant is centrally engaged with, such as *the participant's account of what is happening* |
| `engagement` | the architecture is primary | a gerund phrase for that engagement, such as *acting on the participant's own account of what is happening* |
| `primary.attractors` | primary | whole attractor statements; one is chosen |
| `primary.core` | primary | the invariant that is always included |
| `primary.invariants` | primary | further invariants; one or two are chosen |
| `primary.secrets`, `secretRequired` | primary | secrets; TRAP, MYSTERY and ONTOLOGY always carry one |
| `secondary.inflections` | secondary | a clause that bends the primary attractor, such as *while every step narrows what remains possible* |
| `secondary.invariants`, `attractors`, `secrets` | secondary | statements written against `{object}` and `{engagement}` |

## How a secondary composes with a primary

A secondary never adds a free-standing slogan. The first secondary bends the primary's attractor with an inflection clause, and each secondary's other statements are written in terms of the **primary's** `object` and `engagement`. So a CONSTRAINT secondary on a TRAP primary produces *acting on the participant's own account of what is happening costs something else the participant values*, which ties the tradeoff to the mistaken model instead of listing it beside it.

Those two slots are the only substitution this grammar has. There is no general templating language, no pairwise table and no compatibility matrix.

## Rules for statements

- Structural only: relationships, pressures, asymmetries, what stays true, what begins hidden. Never names, scenes, events, dialogue, turn counts, endings or prose to reproduce.
- Boundary-neutral: nothing that presumes violence, sexual content or strong language, because the participant's boundaries pass through untouched.
- A statement starts with a capital letter or a slot and ends with a period. An inflection starts lowercase and has no final punctuation.
- A fragment can be limited to some intensities with `{ "text": "...", "intensity": [min, max] }`. Use this sparingly; the Runtime Kernel already defines what intensity permits.
- At every intensity, each primary needs at least one attractor and two eligible pool invariants, and each secondary needs at least one inflection, invariant and attractor. `validateGrammar()` checks all of this.

## Versioning

The grammar declares the composer version it belongs to. Any change that could make the same input and seed produce a different score, including rewording a single fragment, requires a new composer version, and the golden fixtures in `tests/fixtures/composed/` will fail until that decision is made.

## Inspecting output

```bash
node tools/compose.js --count 40
node tools/compose.js --family agency --intensity 4 --request "Give me Star Trek!!" --count 10
node tools/compose.js --seed "my seed" --family world --format json
```
