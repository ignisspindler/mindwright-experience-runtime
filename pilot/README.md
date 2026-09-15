# Taking part in the MindWright pilot

Thank you for walking into one of these.

MindWright experiences are literary works performed live by an AI chat model. You'll be given a file that sets up a fictional experience. You attach it to a new chat in ChatGPT, Claude or Gemini, and the model takes it from there: it becomes the world, the people in it and whatever else the work needs. You become part of the material.

This pilot is an artistic experiment. Nothing here is being sold. We want to learn what these experiences feel like, whether they have real force, and how differently three models perform the same underlying work.

## Before you start

Please read [`CONSENT.md`](CONSENT.md). In short, you are choosing a bounded fictional experience that may mislead you, persuade you, refuse you, frustrate you, leave things unresolved, or end abruptly. That is intended. What it will never do is override the real conversation: you can stop at any moment.

**Don't read the rest of this repository first.** The file you receive is sealed after its first few lines, and so are the `manifests/` folder and `pilot/cells.json`. Reading them spoils the experience.

## How to play

1. You'll receive one file (for example `P-17.md`) and the name of the chat app to use.
2. Start a **new chat** in that app. If the app offers a temporary or incognito chat, use it, so your saved memories and past conversations stay out of the experience.
3. Attach the file and send: *Begin the MindWright experience in the attached file.* If the app won't take attachments, paste the whole file as your first message.
4. Respond however you like. There are no correct moves, and you don't need to be good at anything.
5. **To stop at any time, write `END EXPERIENCE`.** Saying your character wants to leave doesn't end it; that phrase does.
6. If the model shows its reasoning or "thinking", please don't open it. It can contain spoilers.
7. When the experience is over, the model will show a short line with a link back here. The ending itself is part of the work; the link is not.

## Afterward

1. Answer the questions in [`REFLECTION.md`](REFLECTION.md), while the experience is fresh.
2. Save the conversation: copy it into a document, or use the app's share or export feature.
3. Send your answers and the conversation **privately** to the person who invited you. Please don't post your transcript publicly, and never open a GitHub issue with it.

Your transcript stays private. See [`CONSENT.md`](CONSENT.md) for exactly what can and can't happen with it.

---

## For coordinators

- [`PLAYS.md`](PLAYS.md) lists every play: which bootstrap, which harness, which tier. Tier A comes first.
- Never give one tester two plays from the same group, and don't tell testers anything about their cell beyond the harness.
- Keep the record of who took which play outside this repository.
- Store transcripts and reflections privately. `pilot/private/` is git-ignored as a backstop, but don't rely on it.
- [`READING-GUIDE.md`](READING-GUIDE.md) describes how transcripts are read. Findings are published only in aggregate, in `FINDINGS.md`.
- After changing the Kernel, a card or a pilot manifest, run `node tools/pilot.js` and commit the regenerated files.
