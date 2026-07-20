# K100 Build Site — Visual Styling Design

## Context

The site (built per [[2026-07-20-build-site-design]]) is live at
https://bryanwatt.github.io/k100-build/ but uses MkDocs Material's stock
default theme — generic indigo palette, no logo/favicon, no visual identity
tied to the K100 or motorcycles. This design covers giving it a distinct
look, arrived at through visual brainstorming (color/icon mockups shown in a
browser companion).

## Direction

**Palette:** BMW Motorsport's classic tricolor livery from the K100RS era —
light blue, violet, and red over near-black — rather than a generic BMW
roundel blue or a neutral/industrial palette (both considered and rejected
in favor of this one for its distinctiveness).

**Stripe as a persistent motif:** the three colors appear as a thin
horizontal gradient stripe along the bottom edge of the header, present on
every page (not just the homepage). This was chosen over a "colors only, no
literal stripe" alternative — the stripe is the more recognizable, more
distinctive option and reinforces the racing-livery reference throughout.

**Icon:** a wrench (from Material's bundled icon set) replaces the default
site icon in the header and serves as the favicon — chosen over a literal
motorcycle icon and over a plain "K100" text wordmark, since it reads as
"build/workshop" rather than "product."

**Accent color usage:** red is the interactive accent (links, active nav
underline); violet stays decorative (stripe only); the header/nav chrome
uses the same near-black background regardless of whether the visitor has
light or dark (slate) mode selected — only the page body content follows
Material's existing light/slate toggle, exactly as it does today.

**Typography:** unchanged (Material's default Roboto). Not part of what
made the site feel bland, so no scope here.

## In-scope fix: wiring diagram dark-mode colors

The final review of the original build ([[2026-07-20-build-site-design]])
flagged that `docs/wiring/wiring.css` hardcodes light-mode-only colors
(`#fafafa` background, `#ddd` border, `#900` message text) that look wrong
against Material's dark/slate scheme. Since this effort is specifically
about making the site's colors work well, this fix is included here: those
hardcoded values are replaced with Material's CSS custom properties (e.g.
`var(--md-default-bg-color)`, `var(--md-default-fg-color--light)`) so the
diagram adapts automatically to whichever scheme the visitor has selected,
consistent with the rest of the site.

## Implementation approach

- **Header/stripe color:** achieved via `extra_css`, not `theme.palette`'s
  named-color list (which doesn't offer the exact hex values needed).
  Material exposes its chrome colors as CSS custom properties
  (`--md-primary-fg-color`, etc.) — overriding those, plus a small
  `.md-header::after` rule with a 3-stop `linear-gradient` background for
  the stripe, is layered on top of the existing `theme.palette` block
  (light/slate schemes stay as-is; only the fixed chrome colors change).
- **Icon:** set via `theme.icon.logo` (Material's bundled wrench icon) and
  `theme.favicon` pointing at the same bundled icon asset.
- **Wiring diagram fix:** edits confined to `docs/wiring/wiring.css`;
  `docs/wiring/wiring.js` and the JSON data model are untouched.

## Out of scope

- Any change to page content/layout (homepage copy, photos, hero sections)
  — confirmed during brainstorming that the "bland" feeling was about
  theme/colors, not content.
- Typography changes.
- Circuit-filter UI or any other wiring-diagram behavior beyond the color
  fix above (still deferred per the original build's spec).

## Testing

Consistent with the original build's approach: no automated test suite.
Verification is `mkdocs build --strict` plus manual/headless-DOM checks
(the same jsdom technique used in the original build, since browser
automation isn't available in this environment) confirming the stripe
renders, the header/icon appear correctly, and the wiring diagram's colors
resolve correctly in both light and dark mode.
