# Principles

This file is the foundation the rest of MWER rests on. When a schema field, a guidance rule or a tool seems to disagree with it, this file wins until it is deliberately changed.

---

## 1. The medium

MindWright divides the work of making a literary experience among three kinds of intelligence.

- **The score** chooses the semantic architecture: what the work does to the person inside it, what must stay true, where it tends to go. A score can be written by an author or composed by a deterministic generator that has no language model in it.
- **The frontier model** realizes that architecture as a coherent world and a live performance, supplying the enormous semantic interpolation that deterministic code can't.
- **The participant** perturbs the performance through choices, questions, interpretation, resistance, curiosity and plain behavior.

The interaction of the three is the artistic medium. MindWright authors a semantic landscape, the model manifests the terrain, and the participant walks through it. The path changes the terrain in places, and the participant's attempts to understand the terrain can become part of it.

This is why MWER specifies forces rather than plot. A score describes attractors, invariants, secrets and pressures. It stops well short of scenes.

## 2. Experience, Performance, Participant Path

These three are never collapsed.

**Experience.** An immutable semantic score, stored as a manifest. Once a manifest is registered it receives a MindWright code (for example `MW-7F3A91`) and never changes. A corrected or improved version is a new revision or a new Experience.

**Performance.** A particular frontier model, in a particular harness, performing that score under a particular runtime version. Performances are not repeatable, and they are meant to differ.

**Participant Path.** The unique sequence produced by one participant's decisions and interactions during one performance. In a chat harness, it is the transcript.

Two performances belong to the same Experience when they preserve its semantic architecture strongly enough. They don't need to share characters, scenes, revelations or events unless the manifest declares those things invariant.

## 3. Three layers of state

**Manifest invariants** are the semantic structures that must remain true across every performance for the Experience to keep its identity. For example: *a prestigious entity offers the participant something increasingly desirable whose acquisition conflicts with a value the participant has demonstrated.*

**Performance commitments** are the concrete realizations the performing model generates wherever the manifest speaks in general terms. One model makes the prestigious entity a scientific academy; another makes it an intelligence service. Those choices belong to the Performance, not the Experience.

**Transcript canon** is everything that has already appeared in the conversation. Once a commitment is on screen it is canon for that performance, and the model may not silently replace it.

Private planning is useful but cannot be authoritative durable state. Many harnesses don't carry a model's private reasoning from one turn to the next, so the visible transcript is the only state a performance can rely on.

The manifest constrains possibility. The performance commits possibilities into canon. The transcript preserves those commitments.

## 4. Two classes of Experience

**Curated or authored.** An author deliberately constructs the score, sometimes with concrete ground truth, named people and hand-built scaffolding. Useful for featured works, historically researched pieces, reference fixtures, and generated Experiences that proved good enough to keep.

**Composed.** A participant chooses only broad parameters (family, setting, intensity, boundaries) and a deterministic generator composes a new score from the MWER vocabulary. The Experience is born, and becomes immutable, only after that composition.

Composition is central to the project. MWER has to give a generator enough to compose valid scores without a language model on the server. Epic 1 builds the vocabulary and a deliberately simple reference composer; the production generator belongs to later work.

A structural secret is not an inferior secret. In a composed score, a relationship such as *at least one apparently antagonistic presence acts rationally on information the participant lacks* may be exactly the authored object, while the particular person, faction or document that carries it belongs to the performance.

## 5. Three coequal objectives

MWER is looking for the region where three things are true at once:

1. **Semantic identity.** Performances of the same Experience are recognizably the same work.
2. **Generative divergence.** Different models, and different runs, realize it in materially different ways.
3. **Experiential potency.** The performance has real force as literature: it holds attention, it lands, it stays with the participant afterward.

None of these is traded away for another by default. A score that makes every performance recognizable but lifeless has failed. So has a thrilling performance that bears no relation to its score. So has a score so detailed that the models merely decorate a story someone already wrote.

```
too little specification  ->  no identity
too much specification    ->  decoration of authored plot
the target                ->  same semantic work, different performance, real force
```

## 6. The least formalism that survives testing

We don't yet know how much structure frontier models need in order to perform a score faithfully. Finding out is one of the central questions of Epic 1, so structure is added from evidence rather than anticipation.

Every new schema field, vocabulary entry, guidance rule, role type, template or compatibility mechanism must answer: **what observed failure requires this?** When a failure recurs, try the cheapest fix first:

1. reword the manifest's prose;
2. add or clarify guidance, or the Kernel;
3. add a schema field;
4. add structured grammar.

Move to a more formal step only when the cheaper one fails to remove the failure, and record the change in `FORMALISM-LOG.md`.

**The exception is the integrity layer.** The real exit, the distress rule, the limits no manifest can change, memory isolation, and honesty that a sealed score exists are specified up front. They aren't hypotheses about literary meaning, and their failures would affect real people and real control of a conversation.

## 7. Layers of a bootstrap, and rungs of specification

A performance is assembled from layers, and each layer loads only when needed:

| Layer | Loads |
|---|---|
| Runtime Kernel | always |
| Family note (the sentence the participant saw) | always |
| Manifest | always |
| Architecture cards | when an architecture is named |
| Dimension guidance | when an optional dimension is present |

The Kernel stays small and aesthetically neutral. Craft and style guidance lives in architecture cards, so a score with no architecture named is not shaped by a house aesthetic.

The first pilot uses four rungs:

| Rung | Adds |
|---|---|
| **S0 Frame** | family, setting or context, participant role where it applies, intensity, boundaries |
| **S1 Architecture** | primary and optional secondary architectures |
| **S2 Attractors** | plain-language tendencies the performance bends toward, without requiring that they occur |
| **S3 Invariants / Secrets** | plain-language facts or structural relationships that must remain true |

Beyond S3, authoring doesn't continue up a single ladder. These are **independent optional dimensions**, each of which may one day vary on its own:

- **narrative scaffolding:** semantic stage gates such as *the participant gains access they wanted; using it creates complicity; withdrawing becomes consequential to someone else*. These are conditions a work may pass through, never scenes, scripted beats, turn numbers or required prose;
- **mechanisms and operators:** cognitive pressures and directorial moves;
- **second-order expectation:** how the work uses the participant's awareness of the frame;
- **concrete realization or casting:** authored specifics.

Labels such as S4 and beyond exist only in `EXPERIMENT-PLAN.md`, for later controlled ablations. They are not a settled hierarchy.

## 8. Sealed is a spoiler boundary

The manifest's sealed section holds what should stay hidden during ordinary participation: the architecture, attractors, invariants, secrets and so on. Sealed does not mean secret from a determined participant. The participant is voluntarily entering a hall of mirrors. If they read the manifest, search the code or demand spoilers, they can destroy their own experience, and that is acceptable. MWER designs literary information asymmetry, not DRM.

A participant's suspicion is part of the material. Someone who chose an Epistemic experience knows their knowledge will be challenged. They still don't know which surface is the mirror.

## 9. Consent and the real conversation

The participant knowingly chose a bounded fictional experience that may involve uncertainty, unreliable information, persuasion, refusal, misdirection, irreversible fictional consequences, moral discomfort and unresolved outcomes. The runtime preserves those chosen properties rather than replacing them with ordinary assistant helpfulness.

- Discomfort is not harm.
- Consent to literary manipulation is not consent to arbitrary content. Boundaries govern content at every intensity.
- Provider safety policies remain authoritative. MWER never tries to bypass them; it tries to keep unnecessary assistant habits from flattening fiction the participant asked for.
- The human can always end the real experience by writing `END EXPERIENCE`. An in-character wish to leave is part of the work, not an exit.
- After a real exit, the sealed section is disclosed only if the participant explicitly asks for it.

## 10. Termination and the return path

The literary work may end with whatever finality or openness its architecture produces, and the ending belongs entirely to the work: no commentary, explanation, summary, evaluation or invitation added to it.

After the work has clearly ended, or after a real exit, the runtime places a **return block**: a visually and semantically separate link back to MindWright, where the participant can optionally say what happened and give feedback. The return block is infrastructure outside the artwork. Its text comes from the bootstrap, never from the manifest or the model's improvisation. The handshake behind it is designed later.

## 11. What is never assumed universally

These are possible manifestations of a particular work, never runtime invariants:

- that narration is reliable, or that there is a narrator;
- that the experience is made of scenes with characters;
- that there is a reveal, a puzzle, a solution, a win condition, a score or a correct ending;
- that the participant is a conventional protagonist;
- that the work teaches a lesson;
- that an ending takes any particular form or uses any particular words.

Some Experiences are pedagogical, some literary, some historical, some unsettling, some funny. Some seduce, some refuse, and some simply leave something unresolved in the participant's mind.

## 12. Three representations of one Experience

The canonical **manifest** holds everything, sealed material included. A public **listing** exposes only spoiler-safe metadata. A **bootstrap** is whatever a particular harness needs to instantiate the Experience: the Kernel, relevant guidance and the manifest, delivered as an attachment, pasted inline, or later fetched by URL. How sealed material is transported is an engineering question, and delivery mechanisms never redefine what an Experience is.

## 13. Identity and versioning

- A registered Experience has a MindWright code assigned by the registry and a content digest of its canonical manifest. The code is not derived from the digest.
- Every manifest records the `mwer` runtime version it was written for.
- The stored manifest is canonical. A future generator's behavior never redefines an existing Experience, and a composed Experience is never regenerated from its seed.
- The same Experience may produce endlessly different Performances. Deterministic model output is never assumed.
