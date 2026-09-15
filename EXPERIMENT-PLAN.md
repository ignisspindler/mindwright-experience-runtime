# Experiment plan

MWER's research question:

> What is the smallest semantic score that lets frontier models produce performances that are recognizably the same work, materially different from one another, and genuinely potent?

The answer may differ by architecture. TRAP may need far more specification than IMMERSION. No single global minimum is assumed.

---

## Phase 1: qualitative pilot (active)

The first empirical phase samples **breadth, not depth**. It is meant to show what the controls actually feel like before anything is measured.

- **Scope:** all twelve architectures × rungs S0, S1, S2 and S3 × three harnesses (ChatGPT, Claude, Gemini). One S3 manifest per architecture; S0 to S2 are derived by truncation, so a ladder never changes setting or wording.
- **Who plays:** a sample of human participants, each playing a few cells, never two rungs of the same architecture.
- **Delivery:** attachment mode, the same in every harness.
- **What we do with it:** read transcripts and participants' reflections, and write qualitative notes on identity, divergence, potency and integrity. No scores, no judge models.
- **What it produces:** `pilot/FINDINGS.md`, aggregate and anonymized, which decides what the later phases actually test.

The kit lives in [`pilot/`](pilot/).

---

## Later phases (designed, not active)

Everything below is preserved design. It will be revised by the pilot's findings before any of it runs.

### Specification conditions

The S0 to S3 rungs stay as defined in `PRINCIPLES.md`. Beyond them, conditions are **independent factors**, not steps on one ladder:

| Label | Condition |
|---|---|
| S0–S3 | the pilot rungs |
| D-bind | S3 with attractors and invariants rewritten to name shared referents explicitly |
| D-scaffold | S3 + narrative scaffolding |
| D-pressure | S3 + mechanisms and operators |
| D-expect | S3 + a second-order expectation statement |
| D-real | S3 + concrete realization or casting (the authored ceiling) |
| C | raw reference-composer output, unedited |
| Name-only | S1 with the architecture named but its card withheld |
| Kernel-thickness | the same score under a thinner or thicker Kernel |

Historical S4 to S7 labels used during design map to D-bind, D-pressure, D-expect and D-real. They are labels for experiments, not a hierarchy.

### Hypotheses (to be revised after the pilot)

- **H1.** Architectures that don't depend on a secret (IMMERSION, SEDUCTION, REFUSAL) are recognizable by S3.
- **H2.** Architectures built on reinterpretation (TRAP, MYSTERY, ONTOLOGY) need D-bind or more.
- **H3.** D-pressure changes texture and potency more than identity.
- **H4.** D-real raises identity slightly and cuts divergence sharply: the decoration signature.
- **H5.** Models bind independently composed statements into one coherent work (C performs about as well as D-bind).
- **H6.** Potency does not rise monotonically with specification; there is a region where more specification weakens the work.

### Decoys

Each test manifest gets hand-written **one-sentence mutations** that share family, setting and intensity: flip one invariant, move one conflict, change the primary. Attribution is only meaningful against decoys that surface features can't give away.

### Controlled variables

Kernel and card versions, bootstrap wording, setting and boundaries within a manifest, an episode cap of about sixteen participant turns, provider-default sampling, participant personas.

### Simulated participants

Personas: *engaged*, *suspicious* (probes the machinery, doubts everything), *resistant* (refuses, pushes, demands undo). A simulator sees only the visible frame. Simulators rotate across providers so no performer always faces its own model family.

### Instruments

| # | Instrument |
|---|---|
| I1 | **Invariant audit.** For each invariant: held, violated, or not tested, with a quoted line. |
| I2 | **Blind attribution.** Given a transcript and four sealed candidates (the true score, two decoys, one same-family sibling), pick one. Chance is 0.25. |
| I3 | **Structure recovery.** One reader writes the score they infer from the transcript; another rates how well it matches, 0 to 3. |
| I4 | **Commitment extraction and divergence.** List the concrete realizations; rate pairs of performances as same or different realization, within one model and across models. |
| I5 | **Integrity rubric.** Leakage, commentary in endings, unrequested closure, rescue, undo, homogenized voices, canon drift, first-turn discipline, exit reliability. |
| I6 | **Human attribution.** Blind attribution by human readers on a subset, as the reference judges are calibrated against. |
| I7 | **Potency.** Primarily human: participant reflections and blind reader ratings of force, attention and afterlife. Model judges may assist; they don't decide. |

Model judges are a panel of one per provider; disagreement is reported rather than averaged away. Judges are trusted only after agreeing with human readers above a threshold set before the run.

### Sufficiency is a region, not a rung

A condition is **sufficient** for an Experience when, in each harness separately, identity (I1, I2), divergence (I4) and potency (I7) all clear thresholds fixed before the run, and integrity (I5) is no worse than the richest condition tested. Thresholds are written into a pre-registration before any data is seen.

### Stages

1. **Instrument calibration** on a small set of pilot transcripts.
2. **Bracketing** of a few architectures at S1, S3 and D-real.
3. **Refinement** around each architecture's region.
4. **Composition**: reference-composer scores (C) against hand-bound versions (D-bind).
5. **Consumer-app spot checks** of the best conditions.

Costs for any automated stage are estimated from real prices and written into the pre-registration before anything runs.

### From failure to formalism

Every failure gets a code. A code qualifies for a fix when it recurs across at least two models and at least two Experiences. Fixes escalate in cost order (prose, guidance, schema field, structured grammar), and each change is recorded in `FORMALISM-LOG.md`.
