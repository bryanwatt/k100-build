# K100 Site Visual Styling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the site's stock Material theme look with a distinct BMW-Motorsport-tricolor identity (persistent header stripe, wrench icon/favicon, near-black chrome), and fix the wiring diagram's hardcoded light-only colors so it works correctly in dark/slate mode.

**Architecture:** A new site-wide stylesheet (`docs/assets/site.css`) overrides Material's CSS custom properties for primary/accent colors and adds a decorative header stripe via a pure-CSS pseudo-element — no template overrides needed. `mkdocs.yml` wires in the new stylesheet, a bundled Material icon for the header logo, and a copied-in favicon asset. `docs/wiring/wiring.css` swaps its hardcoded hex colors for the same Material CSS custom properties so it adapts to whichever color scheme (light/slate) the visitor has selected.

**Tech Stack:** MkDocs Material 9.7.x (already installed), plain CSS (no preprocessor), Material's bundled icon set.

## Global Constraints

- Exact colors: header/chrome `#12151a`; stripe gradient stops `#00a1d6` → `#5a3d99` → `#e2001a`; accent `#e2001a`.
- Verified Material CSS custom property names (checked against the installed `mkdocs-material` 9.7.7 package's compiled CSS): `--md-primary-fg-color`, `--md-primary-fg-color--light`, `--md-primary-fg-color--dark`, `--md-accent-fg-color`, `--md-default-bg-color`, `--md-default-fg-color`, `--md-default-fg-color--lighter`. Do not invent variable names not in this list.
- `theme.icon.logo: material/wrench` is a verified-valid bundled icon reference (confirmed present at the installed package's `.icons/material/wrench.svg`).
- `theme.favicon` requires a real image file path relative to `docs_dir` — it does **not** accept the `material/<name>` bundle syntax (that syntax is logo-only). The favicon must be a real file copied into `docs/assets/`.
- No automated test suite (carried over from the original site build's spec) — verification is `mkdocs build --strict`, a real CSS-parse check via `tinycss2` (a one-off pip install for verification only — do not add it to `requirements.txt`), and re-running the existing jsdom regression scripts from the original build for Task 2 (since it touches the same file those scripts exercise).
- Scope is colors/icon only — no changes to page content, layout, or typography (per spec's "Out of scope").

---

### Task 1: Site-wide chrome — palette, header stripe, wrench icon/favicon

**Files:**
- Create: `docs/assets/site.css`
- Create: `docs/assets/favicon.svg`
- Modify: `mkdocs.yml`

**Interfaces:** none consumed from other tasks. Produces the site-wide `:root` color overrides and header stripe that Task 2 does not depend on (Task 2 only reads the same underlying Material CSS variables, not anything defined in `site.css` itself).

- [ ] **Step 1: Create `docs/assets/site.css`**

```css
:root {
  --md-primary-fg-color: #12151a;
  --md-primary-fg-color--light: #12151a;
  --md-primary-fg-color--dark: #12151a;
  --md-accent-fg-color: #e2001a;
}

.md-header::after {
  content: "";
  display: block;
  height: 4px;
  background: linear-gradient(
    to right,
    #00a1d6 0%, #00a1d6 33.33%,
    #5a3d99 33.33%, #5a3d99 66.66%,
    #e2001a 66.66%, #e2001a 100%
  );
}
```

- [ ] **Step 2: Create `docs/assets/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m22.7 19-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4"/></svg>
```

This is the exact bundled Material wrench icon (copied from the installed package's `.icons/material/wrench.svg`), reused as a real file since `theme.favicon` needs a path, not a bundle reference.

- [ ] **Step 3: Modify `mkdocs.yml`** — add `theme.icon.logo`, `theme.favicon`, and `docs/assets/site.css` to `extra_css`

Current content:
```yaml
site_name: K100 Build
theme:
  name: material
  palette:
    - scheme: default
      toggle:
        icon: material/brightness-7
        name: Switch to dark mode
    - scheme: slate
      toggle:
        icon: material/brightness-4
        name: Switch to light mode

nav:
  - Home: index.md
  - Build Log: build-log/index.md
  - Parts: parts.md
  - Wiring: wiring/index.md

exclude_docs: |
  superpowers/

extra_css:
  - wiring/wiring.css
extra_javascript:
  - wiring/wiring.js
```

Replace with:
```yaml
site_name: K100 Build
theme:
  name: material
  icon:
    logo: material/wrench
  favicon: assets/favicon.svg
  palette:
    - scheme: default
      toggle:
        icon: material/brightness-7
        name: Switch to dark mode
    - scheme: slate
      toggle:
        icon: material/brightness-4
        name: Switch to light mode

nav:
  - Home: index.md
  - Build Log: build-log/index.md
  - Parts: parts.md
  - Wiring: wiring/index.md

exclude_docs: |
  superpowers/

extra_css:
  - assets/site.css
  - wiring/wiring.css
extra_javascript:
  - wiring/wiring.js
```

- [ ] **Step 4: Verify the build succeeds**

```bash
mkdocs build --strict
```
Expected: completes with no warnings/errors.

- [ ] **Step 5: Verify the icon, favicon, and stripe are actually wired into the built output**

```bash
grep -o 'm22.7 19-9.1-9.1' site/index.html
```
Expected: one match — confirms the wrench SVG path was inlined into the header logo markup (Material inlines bundled icons as `<svg>` directly in the HTML).

```bash
grep -o 'assets/favicon.svg' site/index.html
```
Expected: at least one match — confirms the favicon `<link>` references the file we created.

```bash
test -f site/assets/site.css && echo "site.css built"
test -f site/assets/favicon.svg && echo "favicon.svg built"
grep -o 'assets/site.css' site/index.html
```
Expected: both files present in `site/`, and `site.css` referenced from the built page's `<head>`.

- [ ] **Step 6: Verify `site.css` is syntactically valid CSS (real parse, not just eyeballing)**

```bash
pip install tinycss2
python3 -c "
import tinycss2
with open('docs/assets/site.css') as f:
    rules = tinycss2.parse_stylesheet(f.read(), skip_whitespace=True, skip_comments=True)
errors = [r for r in rules if r.type == 'error']
print(f'{len(rules)} rules parsed, {len(errors)} errors')
for e in errors:
    print(e)
assert not errors, 'CSS parse errors found'
print('VALID')
"
```
Expected output ends with: `VALID` (and `0 errors`).

- [ ] **Step 7: Commit**

```bash
git add docs/assets/site.css docs/assets/favicon.svg mkdocs.yml
git commit -m "Add motorsport-tricolor header stripe, wrench icon, and favicon"
```

---

### Task 2: Wiring diagram dark-mode color fix

**Files:**
- Modify: `docs/wiring/wiring.css`

**Interfaces:** consumes the Material CSS custom properties confirmed in Global Constraints (`--md-default-bg-color`, `--md-default-fg-color`, `--md-default-fg-color--lighter`, `--md-accent-fg-color`). Does not touch `docs/wiring/wiring.js` or `docs/wiring/data/wiring-data.json` — the wire colors in that JSON represent real-world wire colors and are intentionally left as fixed hex values regardless of site theme.

- [ ] **Step 1: Modify `docs/wiring/wiring.css`**

Current content:
```css
#wiring-diagram svg {
  background: #fafafa;
  border: 1px solid #ddd;
}

#wiring-diagram text {
  font-size: 12px;
  font-family: sans-serif;
}

.wiring-message {
  color: #900;
  font-style: italic;
}

.wiring-component {
  cursor: pointer;
}

.wiring-faded {
  opacity: 0.15;
}

.wiring-highlighted {
  stroke-width: 4 !important;
}

.wiring-panel {
  margin-top: 1em;
  padding: 0.75em 1em;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9em;
}

.wiring-panel ul {
  padding-left: 1.2em;
}
```

Replace with:
```css
#wiring-diagram svg {
  background: var(--md-default-bg-color);
  border: 1px solid var(--md-default-fg-color--lighter);
}

#wiring-diagram text {
  font-size: 12px;
  font-family: sans-serif;
  fill: var(--md-default-fg-color);
}

.wiring-message {
  color: var(--md-accent-fg-color);
  font-style: italic;
}

.wiring-component {
  cursor: pointer;
}

.wiring-faded {
  opacity: 0.15;
}

.wiring-highlighted {
  stroke-width: 4 !important;
}

.wiring-panel {
  margin-top: 1em;
  padding: 0.75em 1em;
  border: 1px solid var(--md-default-fg-color--lighter);
  border-radius: 4px;
  font-size: 0.9em;
  background: var(--md-default-bg-color);
  color: var(--md-default-fg-color);
}

.wiring-panel ul {
  padding-left: 1.2em;
}
```

Note: `#wiring-diagram text` previously had no `fill` set at all, so component labels rendered in the browser's SVG default (black). That was invisible-on-dark-background risk was latent even before this fix (nothing set the SVG background to a dark color, so it never surfaced) — now that the background follows the color scheme, the text needs an explicit scheme-aware `fill` too, or labels would vanish against a dark background. This one addition is required by the same fix, not scope creep.

- [ ] **Step 2: Verify no hardcoded colors remain and the file is valid CSS**

```bash
grep -E '#fafafa|#ddd|#900' docs/wiring/wiring.css
echo "exit code: $?"
```
Expected: no matches, exit code `1` (grep found nothing).

```bash
python3 -c "
import tinycss2
with open('docs/wiring/wiring.css') as f:
    rules = tinycss2.parse_stylesheet(f.read(), skip_whitespace=True, skip_comments=True)
errors = [r for r in rules if r.type == 'error']
print(f'{len(rules)} rules parsed, {len(errors)} errors')
assert not errors, 'CSS parse errors found'
print('VALID')
"
```
Expected output ends with: `VALID`.

- [ ] **Step 3: Verify the build still succeeds**

```bash
mkdocs build --strict
```
Expected: completes with no warnings/errors.

- [ ] **Step 4: Regression-check against the existing jsdom scripts**

This file's class names (`wiring-component`, `wiring-faded`, `wiring-highlighted`, `wiring-panel`) are unchanged, but re-run the existing verification scripts from the original build to confirm nothing else broke:

```bash
node /private/tmp/claude-501/-Users-bryanwatt-Documents-GitHub-bryanwatt-k100-build/dd57bb19-7620-4508-a130-4d30ebeef630/scratchpad/verify-task3/verify.js
node /private/tmp/claude-501/-Users-bryanwatt-Documents-GitHub-bryanwatt-k100-build/dd57bb19-7620-4508-a130-4d30ebeef630/scratchpad/verify-task3/verify-task4.js
```
Expected: both print `ALL CHECKS PASSED` / `All tests passed!` respectively — these scripts test the JS/DOM behavior (rendering, fallbacks, click-highlight), which this CSS-only change should not affect. If either script is missing (scratch directory may not persist across sessions), note this in your report rather than fabricating output — re-create it from Task 3/4 of `docs/superpowers/plans/2026-07-20-build-site.md` if needed, or report that regression-checking was skipped and why.

- [ ] **Step 5: Commit**

```bash
git add docs/wiring/wiring.css
git commit -m "Fix wiring diagram colors to adapt to light/dark color scheme"
```
