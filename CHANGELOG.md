# Changelog

Versions follow the runtime (`mwer` field in every manifest). A manifest records the runtime version it was written for, so a change here never silently changes an existing Experience.

## Unreleased (0.1 draft)

- Repository scaffold, licenses, contribution and privacy rules.
- `PRINCIPLES.md`, `DEVIATIONS.md`, `FORMALISM-LOG.md` (with deliberately deferred formalisms) and `EXPERIMENT-PLAN.md` (the qualitative pilot active; full conformance design preserved for later).
- Vocabulary v0: four families, twelve architectures, 38 mechanisms and 19 operators, as one-line glosses.
- Thin manifest schema (rungs S0-S3 plus optional scaffolding, mechanisms, operators, expectation and realization), a dependency-free validator, and truncation to rungs.
- Runtime Kernel v0.1, twelve architecture cards with primary and secondary forms, and guidance for the optional dimensions.
- `tools/project.js`: bootstrap assembly with end lines, the fixed return block and a preface leak check.
- Twelve thin S3 pilot manifests, one per architecture, including The Lighthouse Keeper.
- Pilot kit: 48 bootstraps, 72 plays across ChatGPT, Claude and Gemini, tester guide, consent, reflection questions and reading guide.
- Kernel §12 now names which sections carry end lines, so the participant preface above the divider isn't mistaken for a damaged section.
- Refactor, no change in meaning: manifest semantics and bootstrap projection moved to a portable core (`tools/core/`) that works from a supplied plain-data catalog (schema, vocabulary, kernel, cards, dimension guidance) and uses a synchronous pure-JavaScript SHA-256, so the same code can run in a browser. `tools/lib/` is now a thin Node adapter with the same exports and CLI behavior. Recorded CLI goldens, fixed canonical-JSON and digest values, and byte-for-byte comparisons against every committed pilot bootstrap guard the equivalence.
