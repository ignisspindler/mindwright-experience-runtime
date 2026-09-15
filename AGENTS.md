# AGENTS.md

Guidance for AI coding agents **editing** this repository.

If someone has handed you a MindWright bootstrap and wants to take part in an experience, this file doesn't apply: follow the bootstrap.

## Before changing anything

1. Read `PRINCIPLES.md`. It defines Experience, Performance and Participant Path, the three layers of state, and the three coequal objectives (semantic identity, generative divergence, experiential potency).
2. Read `CONTRIBUTING.md`, especially the least-formalism rule and the privacy rule.

## Hard rules

- **Never commit participant transcripts** or anything identifying a participant. The repository is public.
- **Don't add formal structure speculatively.** No new schema fields, typed roles, feature systems, templates or compatibility machinery without an entry in `FORMALISM-LOG.md` naming the observed failure that requires it.
- **Keep the Kernel small and aesthetically neutral.** Style and craft guidance belongs in architecture cards, which load only when an architecture is named. Moving a rule into the Kernel needs pilot evidence.
- **Don't assume** reliable narration, scenes built from characters, reveals, win conditions, or any particular ending form. Those are possible manifestations, never runtime invariants.
- **Never put assistant commentary into an ending.** The return path is infrastructure placed after the work, not part of it.
- Changing the Kernel, a card or a manifest that has been used in a pilot requires a version note in `CHANGELOG.md`.

## Working

- `npm test` runs every check. Tools are dependency-free Node ESM.
- MWER semantics (manifest validation, truncation, canonical JSON, digests, bootstrap projection, leak checks) live only in `tools/core/`. Core code takes the schema, vocabulary and runtime texts as plain data and must never import `node:` modules, read files or touch process state, so a browser can run it unchanged; a test enforces this. Filesystem and CLI concerns belong in the Node adapters under `tools/lib/`. Never reimplement semantics in an adapter.
- The composer grammar (`composer/grammar.json`) and the architecture cards (`runtime/cards/`) have separate jobs: the grammar teaches software to write a score, the cards teach a model to perform one. Never copy text between them.
- Any change that could make the same composer input and seed produce a different score (grammar wording, draw order in `tools/core/composer.js`, `tools/core/random.js`) needs a new `COMPOSER_VERSION` and a matching `composer` field in the grammar. The golden fixtures in `tests/fixtures/composed/` fail until that decision is made; regenerate them only after it.
- Regenerate pilot bootstraps with the `project` tool after changing runtime text or manifests, and commit them with the change.
- Human-facing prose: plain, flowing, no em dashes.
- Releases: bump `version` in `package.json`, commit, tag `v<version>`, run `node tools/bundle.js` from the clean tagged tree, and attach `dist/mwer-browser-<version>.tar.gz` to the GitHub release. A bundle built from an uncommitted tree records `commit: null` and must never be released. A published bundle is never replaced; fixes ship as a new version.
