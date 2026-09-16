# Formalism log

Every piece of formal structure added to MWER after v0.1 is recorded here, with the observed failure that required it. See the least-formalism rule in [`PRINCIPLES.md`](PRINCIPLES.md#6-the-least-formalism-that-survives-testing).

## How to add an entry

A failure qualifies when it recurs across at least two models and at least two Experiences, at a specification that should have been enough. Try the cheapest fix first: reword the manifest, then clarify guidance or the Kernel, then add a schema field, then add structured grammar.

```
### YYYY-MM-DD: <what was added>
- Failure observed: <what kept going wrong, where, in which models>
- Evidence: <pilot or run identifiers; no participant-identifying material>
- Cheaper fixes tried: <what, and why they weren't enough>
- Change: <the structure added, and where>
```

## Log

### 2026-09-15: Composer grammar with two binding slots and intensity eligibility
- Failure observed: not a pilot failure. The composer brief required secondaries to shape one semantic landscape instead of adding free-standing slogans, and independently written sentences from two architectures had no way to refer to the same thing. This is the risk the deferred "typed semantic roles" and "statement templates" rows anticipated.
- Evidence: design requirement for composer 0.1.0; no pilot data yet.
- Cheaper fixes tried: plain concatenation of per-architecture sentences was rejected by the brief. Typed roles, provides/requires, feature vocabularies and pairwise templates were all judged heavier than needed.
- Change: `composer/grammar.json` gives each architecture two phrases, `object` and `engagement`, and secondary statements may use exactly those two slots, which always resolve to the primary's phrases. No other substitution exists. A fragment may carry an intensity range. Each primary has one `core` invariant that is always included, and TRAP, MYSTERY and ONTOLOGY always carry a secret. No compatibility exclusions. The pilot should test whether these composed scores hold identity before anything more is added.

---

## Deliberately deferred

These were proposed during design and are not built. Each one names the failure that would justify it.

| Deferred formalism | Failure that would justify it |
|---|---|
| **Typed semantic roles** (`roles.json`) | Composed scores leave co-referent phrases unconnected (the desirable thing and the sacrificed value never become one tension), hand-written relational prose fixes it, and a plain-language labeling convention doesn't. |
| **Bindings, provides / requires** | Composed scores contain statements that presuppose something no other statement introduces, and models don't repair it. |
| **Feature vocabulary and compatibility constraints** | Particular architecture pairs repeatedly produce incoherent or self-contradicting performances. Start with a hand-kept list of excluded pairs; move to features only if that list becomes unmaintainable. |
| **Affinity weights** | Uniform sampling produces measurably weaker identity, potency or integrity for some combinations than for others. |
| **Backtracking or constraint solving** | Simple sample-then-validate composition rejects too many draws. |
| **Statement templates with slots** | *Partly introduced in composer 0.1.0: two fixed slots only (see the log above).* A richer slot system would need evidence that composed sentences are too generic to distinguish sibling Experiences, or need setting-specific wording. |
| **Attachment targets for mechanisms and operators** | Listed mechanisms are applied to the wrong thing, or applied in ways that break invariants. |
| **Second-order expectation primitives** | Suspicious participants neutralize the architecture even with frame-awareness guidance, and a prose expectation statement fixes it. |
| **Dual-reading narration constraint** | Late reveals of structural secrets read as arbitrary or contradictory even with the "earn reinterpretation retroactively" guidance. |
| **Narration reliability setting** | Models make narration lie where fair play was intended, or refuse unreliable narration where a score asks for it in prose. |
| **Reveal and ending posture settings** | Prose invariants about endings are ignored (commentary added, endless drift) often enough to need a mapping. First instance seen 2026-09-16, in live testing: one long-form immersion performance opened a new conspiratorial arc after its principal shift had landed. One participant, one Experience, one model is below the bar for structure, so the cheap fix was taken instead (Kernel §9 wording). A mapping waits for recurrence across at least two models and two Experiences. |
| **Presences or casting fields** | Characters homogenize, or invariants about a presence's motives fail without named presences. |
| **Per-axis intensity caps as data** | The same intensity level produces wildly different amplitude across models, or level adherence is poor under the prose descriptions. |
| **Length or pacing field** | Performances end far too early or run far too long for the work. |
| **Setting modes** | Setting requests cause too many clarifying questions, refusals, or casting that ignores the request. |
| **Scaffolding gate strength** (for example, a gate that must be reached) | Authors repeatedly need a gate the work forces, and prose can't express it. |
| **A visible canon recap move** | Canon drift: models contradict their own commitments in long performances. |
| **Judge probe templates** | Plain-language invariants are too vague for judges to agree with each other or with human readers. |
| **Compiled glosses pinned inside manifests** | Vocabulary changes between versions alter how existing manifests perform. |
