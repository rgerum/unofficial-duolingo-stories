# Story review checklists

These checklists drive the **agentic story review**: an LLM agent reads a
story and reports issues that mechanical checks cannot find. They complement
two other layers:

1. **Editor lint** (`src/lib/editor/lint/`) — deterministic checks shown live
   in the story editor (hint alignment, missing audio, question structure,
   typography regexes, …). Purely mechanical rules belong there, not here.
   Per-language *typography regexes* go in
   `src/lib/editor/lint/language_configs.ts`.
2. **Human review** — the existing peer-approval workflow. The agentic review
   prepares and speeds up human review; it does not replace approvals.

## How a review agent uses these files

- Always load `global.md`.
- If `languages/<short>.md` exists for the course's learning language (e.g.
  `languages/es.md` for Spanish courses), load it as well; it extends and can
  override the global checklist.
- Run the mechanical lint first (or read its stored findings) and do **not**
  repeat what it already reports.
- Follow the output format defined in `global.md`.

The planned Discord integration: when a contributor opens a thread in the
"Ask for reviews" channel, an agent resolves the linked stories, runs the
lint + this checklist against them, and replies in the thread.

## Adding a language checklist

Copy `languages/_template.md` to `languages/<short>.md` (the language's short
code as used by the course, e.g. `fr`, `pt`, `ja`) and fill in the sections.
Keep entries observable and specific — "check X, it is wrong when Y" — so the
agent can verify them against the text. Anything expressible as a regex should
instead be added to `language_configs.ts` so contributors see it live in the
editor.
