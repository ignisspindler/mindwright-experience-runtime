# MindWright Experience Runtime (MWER)

A portable runtime for generative literary experiences, performed by frontier language models.

> **Spoiler warning.** This repository is public, and parts of it are sealed material: `manifests/` and `pilot/` contain the hidden architecture of real experiences. If you intend to take part in one, don't read those folders first. Nothing here is locked away. You can spoil your own experience, and that's your choice to make.

---

## What this is

A participant chooses a broad kind of experience (Epistemic, Agency, Identity or World), a setting, and how intense they want it to be. They open it in a chat model they already use, such as ChatGPT, Claude or Gemini. They know they are entering a fiction. They don't know the machinery underneath it: which architecture was chosen, what must stay true, where the pressure will come from.

The model becomes the director, the world, its people and its narrator when one is needed. The participant becomes one of the literary materials.

MWER specifies **forces instead of plot**: attractors, invariants, secrets and pressures, written compactly enough that a deterministic generator can compose new ones and a frontier model can realize them as a world. Different models should perform the same score in materially different ways that remain recognizably the same work.

## Three things that are kept apart

| | What it is |
|---|---|
| **Experience** | An immutable score: the manifest. Identified by a MindWright code such as `MW-7F3A91`. |
| **Performance** | One model, in one harness, performing that score under one runtime version. Never repeatable. |
| **Participant Path** | What this person did inside this performance, and what it did to them. The transcript. |

Inside a performance there are three layers of state: **manifest invariants** hold everywhere, **performance commitments** are the concrete things the model invents, and **transcript canon** is what has already appeared and cannot be silently replaced. See [`PRINCIPLES.md`](PRINCIPLES.md).

## How a performance is assembled

A bootstrap is built from layers, and only the layers a manifest needs are included:

```
Runtime Kernel          always     integrity, consent, state, exit
Family note             always     the same sentence the participant saw
Manifest                always     visible frame + sealed fields for its rung
Architecture cards      S1 and up  guidance for each named architecture
Dimension guidance      if present scaffolding, mechanisms, expectation, realization
```

The rungs used in the first pilot:

| Rung | Adds |
|---|---|
| S0 Frame | family, setting, role, intensity, boundaries |
| S1 Architecture | primary and secondary architectures |
| S2 Attractors | tendencies the performance bends toward |
| S3 Invariants / Secrets | what must remain true |

## Status

**v0.1 draft, Phase 1:** the qualitative pilot is ready to play: all twelve architectures, rungs S0 to S3, in ChatGPT, Claude and Gemini, played by human participants. The central question is how thin a score can be while keeping identity, divergence and force. Nothing here is settled; formal structure is added only when observed failures require it (see [`FORMALISM-LOG.md`](FORMALISM-LOG.md)).

Want to take part? Start with [`pilot/README.md`](pilot/README.md), and don't read the manifests first.

## Map

| Path | What's there |
|---|---|
| [`PRINCIPLES.md`](PRINCIPLES.md) | The ontology and design rules everything else follows |
| [`runtime/`](runtime/) | The Runtime Kernel, architecture cards and optional-dimension guidance |
| [`vocabulary/`](vocabulary/) | Families, architectures, mechanisms and operators |
| [`schema/`](schema/) | The thin manifest schema |
| [`composer/`](composer/) | The composition grammar the deterministic composer uses to write new thin scores from a participant's choices and a seed |
| [`manifests/`](manifests/) | Manifests, including the twelve pilot drafts (spoilers) |
| [`pilot/`](pilot/) | Tester guide, consent, reflection, reading guide, plays and bootstraps (spoilers after each file's divider) |
| [`tools/`](tools/) | `validate`, `project` (assemble a bootstrap) and `pilot` (build the pilot). The semantics live in `tools/core/`, which runs in Node or a browser from supplied data; `tools/lib/` adapts it to this repository's files |
| [`EXPERIMENT-PLAN.md`](EXPERIMENT-PLAN.md), [`FORMALISM-LOG.md`](FORMALISM-LOG.md), [`DEVIATIONS.md`](DEVIATIONS.md) | Research design, the evidence rule for adding structure, and departures from the original brief |

```bash
npm test                                   # every check
node tools/validate.js manifests/pilot     # validate manifests
node tools/project.js <manifest> --rung S2 # assemble one bootstrap
node tools/pilot.js                        # regenerate the pilot
node tools/compose.js --count 40           # inspect composed scores
node tools/bundle.js                       # build the versioned browser bundle into dist/
```

## Using MWER in another application

Each release on GitHub (`v0.1.0`, …) carries `mwer-browser-<version>.tar.gz`: the portable core, the runtime catalog as JSON and as an ES module, licenses, and a `MANIFEST.json` with the source commit and a SHA-256 for every file. Vendor that bundle under a versioned path and verify it against its manifest; don't copy or edit MWER code by hand.

## Privacy

Participant transcripts are never committed to this repository. Published findings are aggregate, and any quoted excerpt appears only with that participant's specific consent. See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

- Specifications, runtime text, vocabulary, guidance, manifests and pilot materials: [CC BY-NC-SA 4.0](LICENSE).
- Code in `tools/` and `tests/`: [MIT](LICENSE-CODE).

Created by Eugene J. Geis at [Mindwright.ai](https://mindwright.ai). A companion to the course [You Are the Harness](https://github.com/ignisspindler/you-are-the-harness).
