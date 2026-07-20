# K100 Build Site — Design

## Context

This repo documents a BMW K100 motorcycle build. Content is primarily markdown
(build log, parts, notes), but the wiring harness is being traced by hand as
the build progresses and deserves something better than static photos or
one-off diagram images: an interactive diagram you can click through.

Audience: public/shareable — other K100 owners or forum/club members may land
on this as a reference, not just the owner.

## Approach

MkDocs Material renders the markdown content into a proper docs site (nav,
search, dark mode), auto-deployed to GitHub Pages via GitHub Actions.
Markdown stays the source of truth for the build log — no change to how that
content is authored. The wiring harness gets one custom page in that site: an
SVG diagram rendered client-side from a JSON data file, with a small
vanilla-JS layer for click-to-highlight interaction.

Alternatives considered:
- **Hand-rolled static HTML/CSS/JS** (no site generator): maximum control,
  but loses "just write markdown and it looks nice," and nav/styling would be
  manually maintained as the build log grows.
- **Markdown-only via GitHub's native rendering** + one standalone
  interactive HTML file: lowest possible overhead, but no unified
  site/search across build log entries, which cuts against the
  public/shareable goal.

MkDocs Material was chosen because it keeps markdown authoring exactly as
wanted while delivering a genuinely shareable site with minimal ongoing
maintenance (GitHub Actions handles the build/deploy step).

## Repo structure

```
docs/
  index.md                     # build overview/landing page
  build-log/                   # dated entries as work happens
  parts.md                     # parts list/sourcing notes
  wiring/
    index.md                   # the interactive diagram page
    data/wiring-data.json      # components, wires, circuits — source of truth
    wiring.js                  # renders SVG from the JSON, handles interaction
    wiring.css
mkdocs.yml                      # nav, theme (Material), site config
.github/workflows/deploy.yml    # build + push to GitHub Pages on push to main
```

Everything outside `wiring/` is plain markdown. `mkdocs serve` gives live
preview locally during authoring.

## Wiring diagram data model

`wiring-data.json` holds three arrays:

- `components`: `{id, label, type, x, y, notes}` — switches, relays,
  grounds, connectors, placed at manually-specified x/y coordinates. No
  auto-layout algorithm — manual placement is simpler and the harness layout
  is understood better by the person tracing it than a layout algorithm
  would infer it.
- `wires`: `{id, from: {componentId, pin}, to: {componentId, pin}, color,
  gauge, circuit, notes}`.
- `circuits`: `{id, name, color}` — used for the legend and for filtering in
  a later phase.

This file is edited directly as more of the harness is traced — appending
entries, not redrawing anything.

## Interaction

`wiring.js` fetches the JSON on page load and draws:
- components as SVG nodes (positioned via their `x`/`y`),
- wires as SVG paths, colored per their `color` field.

Clicking a component:
- highlights every wire touching that component (bold stroke),
- fades all other wires/components,
- opens a side panel listing those wires with gauge and notes.

Circuit-filter checkboxes (toggle visibility per `circuit` id) are an
explicit v2 addition, deferred until there's enough traced data that
decluttering by circuit is actually useful. The JSON schema already carries
the `circuit` field needed for this, so v2 is a JS-only addition — no data
migration required.

## Error handling

Scoped to what can plausibly happen in a small static site + one JS widget:

- Missing or malformed `wiring-data.json` → render a "no data yet" message
  instead of a blank or broken page.
- A wire referencing a component `id` that doesn't exist in `components` →
  skip rendering that wire and log a console warning, rather than breaking
  the whole diagram.

## Deployment

A GitHub Actions workflow triggers on push to `main`: installs
`mkdocs-material`, runs `mkdocs build`, and deploys the result to the
`gh-pages` branch (e.g. via `mkdocs gh-deploy` or
`peaceiris/actions-gh-pages`). No manual publish step.

## Testing

No formal test suite. This is a static docs site plus one small JS widget —
verification is manual: run `mkdocs serve` locally and confirm the diagram
renders and click-highlighting works against a handful of sample
components/wires before entering real harness data.

## Out of scope (for this spec)

- Circuit-filter UI (deferred to v2, see Interaction section).
- Any auto-layout or graph-routing algorithm for the diagram.
- Digitizing/redrawing factory wiring diagrams — this build is being traced
  from scratch, not sourced from an existing manual.
