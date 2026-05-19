---
date: 2026-05-19
status: active
tags:
  - work
  - index
---

# Work Notes — Index

Map of decision notes, explorations, and dated working memos. Each entry links to a file in `work/` with frontmatter, topic, and status.

## Open questions (decisions pending)

- **Markdown editor choice** — `react-markdown-editor-lite` vs `milkdown` vs `@uiw/react-md-editor`. Criteria: Polish character support, wikilink rendering inside editor, mobile rendering, bundle size, extensibility for `![[embeds]]`. Resolve in stage **d**.
- **Slugify strategy for Polish characters** — keep diacritics in URLs (percent-encoded), transliterate (`ą` → `a`), or hash. Affects deep-linking + readability + sync key stability. Resolve before stage **c** (push script needs deterministic keys).
- **Realtime channel granularity for pins** — single channel for all pins vs per-shelf vs per-book. Affects free-tier egress. Resolve in stage **e**.
- **Image storage** — Supabase `wiki-attachments` bucket vs commit images into repo. Trade-off: bucket = egress cost + dynamic; repo = bandwidth-free + needs rebuild on image change. Resolve in stage **c**.
- **Wikilink resolution timing** — convert wikilinks at push-time (store app-form in DB) vs render-time (store vault-form, resolve in React). Affects DB shape and rendering perf. Resolve in stage **c**.

## Decisions made

_(none yet — populate as decisions land; one line per decision, link to `work/YYYY-MM-DD-<slug>.md`)_

## Active explorations

_(none yet)_

## Note convention

When creating a work note, place it in `work/` with filename `YYYY-MM-DD-<slug>.md` and frontmatter:

```yaml
---
date: YYYY-MM-DD
status: open | decided | superseded
tags: [decision, area/<area>]
related: ["[[OtherNote]]"]
---
```

Then add a one-line entry above with a wikilink and the status.
