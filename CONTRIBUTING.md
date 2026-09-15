# Contributing

MWER is an artistic and research project. Contributions of every kind are welcome: new manifests, pilot runs, observations about how a model performed, and changes to the runtime itself.

## The one rule for changing the runtime

**Use the least formalism that survives testing.** Every new schema field, vocabulary entry, guidance rule or composition mechanism has to answer one question:

> What observed failure requires this?

"A model might need it" isn't enough. "Across repeated runs, models failed to preserve X without it" is. When you add structure, record it in [`FORMALISM-LOG.md`](FORMALISM-LOG.md) with the failure that justified it. Try the cheaper fix first, in this order: reword the manifest prose, clarify guidance or the Kernel, add a schema field, add structured grammar.

The integrity layer (real exit, distress, the limits no manifest can change, memory isolation, honesty that a sealed score exists) is the exception. It is specified up front, because its failures affect real people and real control of a conversation.

## Privacy: never commit participant material

This repository is public.

- **Never commit a participant's transcript**, in whole or in part, or anything that identifies a participant: names, handles, emails, share links to their chats, screenshots.
- Raw transcripts live in private storage outside git. `pilot/private/` is git-ignored as a backstop; don't rely on it.
- Published findings are aggregate. A quoted excerpt may appear only if that participant gave specific consent to anonymized publication, and only after anything identifying has been removed.
- If you ran an experience yourself and want to share your own transcript, that's your call, but put it in a pull request description or an issue first so it can be reviewed.

## Spoilers

Manifests are public. Mark any file that exposes sealed material with the spoiler notice used in `manifests/`. Don't paste sealed material into issue titles.

## Writing style

Write plainly. Prefer flowing sentences to fragments. Avoid em dashes and "it's not X, it's Y" constructions in human-facing prose. Runtime text addressed to models is imperative and short.

## Tests

```bash
npm test
```

Tools are dependency-free Node (ESM). Code is MIT; everything else is CC BY-NC-SA 4.0.
