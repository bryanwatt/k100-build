# K100 Site — Homepage Image, Parts List, and Wiring Additions

## Context

Follow-on work to the site build ([[2026-07-20-build-site-design]]) and
styling pass ([[2026-07-20-site-styling-design]]). Three changes, agreed on
directly with the user (no open design questions remained after a short
round of clarifying questions on wire gauges):

1. A homepage photo (`k100-base.jpeg`, dropped into the repo root by the
   user) should appear on the site.
2. The new components being added to the wiring diagram should also be
   listed on the (currently empty) Parts page.
3. The wiring diagram gets its first real expansion beyond the original
   sample data: the starter circuit and the keyless ignition system.

(A fourth item the user raised — whether the header should be black in dark
mode — required no code change: the live site's `--md-primary-fg-color`
override is already scheme-independent, confirmed directly against the
deployed CSS. No task for it below.)

## Homepage image

`k100-base.jpeg` is a 5.7MB, 5712×4284 photo straight off an iPhone — too
large to ship as-is. It's resized (via macOS's built-in `sips`, no new
dependency) to a web-appropriate width and placed as a banner image near the
top of `docs/index.md`, above the existing link list.

## Parts page

`docs/parts.md` currently has only placeholder text. It gets a real list
including the four components this round adds to the wiring diagram
(Starter Relay, Starter, mo.lock Keyless Ignition, Ignition Relay) — a
starting point the user can expand with sourcing details later, not a
complete parts inventory (out of scope here).

## Wiring diagram additions

Two new circuits, matching the existing JSON schema exactly (no schema
changes):

- **Starter circuit** (new components: Starter Relay, Starter). Two
  heavy-duty connections (battery↔relay, relay↔starter), each a red+black
  pair at **6 AWG** — confirmed with the user that "high awg" here meant
  thick/heavy cable (low AWG number), not literally high-numbered thin wire.
- **Keyless ignition circuit** (new components: mo.lock module, a standard
  automotive Ignition Relay, and a placeholder "TBD — switched accessory
  load" node). mo.lock gets a red supply wire, a green trigger wire to the
  ignition relay's switching input, and a black ground wire, all **18
  AWG**. The ignition relay gets a red battery-supply wire and a red
  switched-output wire, both **12 AWG**, plus a black 18 AWG ground wire.

The switched-output destination is explicitly not yet decided (the user
said "will define connections later") — rather than a dangling reference
(which the diagram's existing error handling would skip and log a warning
for, treating it as a bug), it's modeled as a real placeholder component
labeled "TBD — switched accessory load", so the diagram honestly shows an
unresolved connection instead of a silently-dropped one.

The diagram's SVG `viewBox` widens from `600×400` to `760×400` (one line in
`wiring.js`) so the four new components and their labels have room; this
doesn't affect any of the diagram's existing interaction logic.

## Out of scope

- Circuit-filter UI (still deferred from the original build).
- Full parts inventory / sourcing links (only the four new wiring
  components are added to the Parts page).
- Any further header/dark-mode changes (confirmed already correct).

## Testing

Consistent with prior work: `mkdocs build --strict`, plus re-running the
existing jsdom scripts (extended with new assertions for the added
components/wires) since this changes both the JSON data and one line of
`wiring.js`.
