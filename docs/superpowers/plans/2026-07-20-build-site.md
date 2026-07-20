# K100 Build Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn this repo into a public MkDocs Material site (build log, parts, and an interactive, click-to-highlight wiring harness diagram), auto-deployed to GitHub Pages.

**Architecture:** MkDocs Material renders markdown into the site; the wiring harness gets one custom page (`docs/wiring/index.md`) backed by a JSON data file (`docs/wiring/data/wiring-data.json`) and a small vanilla-JS renderer (`docs/wiring/wiring.js`) that draws an SVG diagram and highlights connected wires on click.

**Tech Stack:** MkDocs Material (Python), vanilla JS/SVG (no framework), GitHub Actions for build+deploy.

## Global Constraints

- Python 3.x, `mkdocs-material>=9.5,<10` (per spec's "Deployment" section).
- No formal automated test suite — per spec's "Testing" section, verification is manual (`mkdocs serve` + browser checks) at the end of each task. This replaces the usual write-test/run-test steps in this plan.
- `wiring-data.json` is authored solely by the repo owner (not third-party/user input), so the panel-rendering code in Task 4 does not need to sanitize its fields against XSS — treat this as a closed, trusted data source, not a general web input.
- Diagram component positions are manual (`x`/`y` in the JSON) — no auto-layout algorithm, per spec's "Wiring diagram data model" section.

---

### Task 1: Site scaffold (MkDocs Material + base pages)

**Files:**
- Create: `requirements.txt`
- Create: `mkdocs.yml`
- Create: `docs/index.md`
- Create: `docs/build-log/index.md`
- Create: `docs/parts.md`
- Create: `.gitignore`

**Interfaces:**
- Produces: a working `mkdocs serve` site with nav entries `Home`, `Build Log`, `Parts`. Later tasks (2-4) add `docs/wiring/` files and a `Wiring` nav entry to `mkdocs.yml` — this task's nav intentionally omits `Wiring` since that page doesn't exist yet (MkDocs errors on nav entries pointing to missing files).

- [ ] **Step 1: Create `requirements.txt`**

```
mkdocs-material>=9.5,<10
```

- [ ] **Step 2: Create `mkdocs.yml`**

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
```

- [ ] **Step 3: Create `docs/index.md`**

```markdown
# K100 Build

A running log of my BMW K100 build — parts, progress, and the wiring
harness as I trace it.

- [Build Log](build-log/index.md)
- [Parts](parts.md)
```

- [ ] **Step 4: Create `docs/build-log/index.md`**

```markdown
# Build Log

Dated entries will go here as work happens.
```

- [ ] **Step 5: Create `docs/parts.md`**

```markdown
# Parts

Parts list and sourcing notes will go here.
```

- [ ] **Step 6: Create `.gitignore`**

```
site/
__pycache__/
*.pyc
```

- [ ] **Step 7: Install dependencies and verify locally**

Run:
```bash
pip install -r requirements.txt
mkdocs build --strict
```
Expected: `mkdocs build --strict` completes with no warnings/errors (no broken nav references) and creates a `site/` directory.

Then run:
```bash
mkdocs serve &
sleep 2
curl -s http://127.0.0.1:8000/ | grep -o "K100 Build"
kill %1
```
Expected output: `K100 Build`

- [ ] **Step 8: Commit**

```bash
git add requirements.txt mkdocs.yml docs/index.md docs/build-log/index.md docs/parts.md .gitignore
git commit -m "Scaffold MkDocs Material site with home, build-log, and parts pages"
```

---

### Task 2: Wiring diagram data model + sample data

**Files:**
- Create: `docs/wiring/data/wiring-data.json`

**Interfaces:**
- Produces: the JSON shape every later task's JS code reads —
  `{ components: [{id, label, type, x, y, notes}], wires: [{id, from: {componentId, pin}, to: {componentId, pin}, color, gauge, circuit, notes}], circuits: [{id, name, color}] }`.
  Task 3's `wiring.js` fetches this exact file at `data/wiring-data.json` (relative to the `wiring/` page).

- [ ] **Step 1: Create `docs/wiring/data/wiring-data.json`**

```json
{
  "components": [
    { "id": "batt", "label": "Battery", "type": "power", "x": 40, "y": 40, "notes": "12V battery, negative ground" },
    { "id": "ign_sw", "label": "Ignition Switch", "type": "switch", "x": 200, "y": 40, "notes": "" },
    { "id": "fuse_box", "label": "Fuse Box", "type": "connector", "x": 200, "y": 160, "notes": "Pin 4 feeds ignition circuit" },
    { "id": "gnd", "label": "Frame Ground", "type": "ground", "x": 40, "y": 160, "notes": "" }
  ],
  "wires": [
    { "id": "w1", "from": { "componentId": "batt", "pin": "+" }, "to": { "componentId": "ign_sw", "pin": "1" }, "color": "#c0392b", "gauge": "14 AWG", "circuit": "ignition", "notes": "Red, main feed" },
    { "id": "w2", "from": { "componentId": "ign_sw", "pin": "2" }, "to": { "componentId": "fuse_box", "pin": "4" }, "color": "#c0392b", "gauge": "16 AWG", "circuit": "ignition", "notes": "" },
    { "id": "w3", "from": { "componentId": "batt", "pin": "-" }, "to": { "componentId": "gnd", "pin": "1" }, "color": "#2c3e50", "gauge": "14 AWG", "circuit": "ground", "notes": "Black, chassis ground" }
  ],
  "circuits": [
    { "id": "ignition", "name": "Ignition", "color": "#c0392b" },
    { "id": "ground", "name": "Ground", "color": "#2c3e50" }
  ]
}
```

- [ ] **Step 2: Verify the JSON is well-formed**

Run:
```bash
python3 -m json.tool docs/wiring/data/wiring-data.json > /dev/null && echo VALID
```
Expected output: `VALID`

- [ ] **Step 3: Commit**

```bash
git add docs/wiring/data/wiring-data.json
git commit -m "Add sample wiring diagram data (components, wires, circuits)"
```

---

### Task 3: SVG rendering + error handling

**Files:**
- Create: `docs/wiring/wiring.js`
- Create: `docs/wiring/wiring.css`
- Create: `docs/wiring/index.md`
- Modify: `mkdocs.yml` (add `extra_css`, `extra_javascript`, and the `Wiring` nav entry)

**Interfaces:**
- Consumes: `docs/wiring/data/wiring-data.json` shape from Task 2.
- Produces (for Task 4 to extend): constants `SVG_NS`, `CONTAINER_ID`; functions `createSvgRoot(container)`, `componentById(data, id)`, `renderWires(svg, data)`, `renderComponents(svg, data)`, `showMessage(container, text)`, `loadWiringDiagram()` (async, `DOMContentLoaded`-triggered). Rendered component `<g>` elements carry `data-component-id` and class `wiring-component`; rendered wire `<line>` elements carry `data-wire-id`, `data-circuit`, `data-from`, `data-to`.

- [ ] **Step 1: Create `docs/wiring/wiring.js`**

```js
const SVG_NS = "http://www.w3.org/2000/svg";
const CONTAINER_ID = "wiring-diagram";
const DATA_URL = "data/wiring-data.json";

function createSvgRoot(container) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 600 400");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "500");
  container.appendChild(svg);
  return svg;
}

function componentById(data, id) {
  return data.components.find((c) => c.id === id);
}

function renderWires(svg, data) {
  data.wires.forEach((wire) => {
    const from = componentById(data, wire.from.componentId);
    const to = componentById(data, wire.to.componentId);
    if (!from || !to) {
      console.warn(`Skipping wire ${wire.id}: unknown component reference`);
      return;
    }
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", from.x);
    line.setAttribute("y1", from.y);
    line.setAttribute("x2", to.x);
    line.setAttribute("y2", to.y);
    line.setAttribute("stroke", wire.color || "#999");
    line.setAttribute("stroke-width", "2");
    line.dataset.wireId = wire.id;
    line.dataset.circuit = wire.circuit || "";
    line.dataset.from = wire.from.componentId;
    line.dataset.to = wire.to.componentId;
    svg.appendChild(line);
  });
}

function renderComponents(svg, data) {
  data.components.forEach((component) => {
    const group = document.createElementNS(SVG_NS, "g");
    group.dataset.componentId = component.id;
    group.classList.add("wiring-component");

    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("cx", component.x);
    circle.setAttribute("cy", component.y);
    circle.setAttribute("r", "10");
    circle.setAttribute("fill", "#fff");
    circle.setAttribute("stroke", "#333");
    circle.setAttribute("stroke-width", "2");
    group.appendChild(circle);

    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("x", component.x + 14);
    label.setAttribute("y", component.y + 4);
    label.textContent = component.label;
    group.appendChild(label);

    svg.appendChild(group);
  });
}

function showMessage(container, text) {
  container.innerHTML = `<p class="wiring-message">${text}</p>`;
}

async function loadWiringDiagram() {
  const container = document.getElementById(CONTAINER_ID);
  if (!container) return;

  let data;
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
  } catch (err) {
    console.error("Failed to load wiring data:", err);
    showMessage(container, "No wiring data yet.");
    return;
  }

  const svg = createSvgRoot(container);
  renderWires(svg, data);
  renderComponents(svg, data);
}

document.addEventListener("DOMContentLoaded", loadWiringDiagram);
```

- [ ] **Step 2: Create `docs/wiring/wiring.css`**

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
```

- [ ] **Step 3: Create `docs/wiring/index.md`**

```markdown
# Wiring Harness

<div id="wiring-diagram"></div>
```

- [ ] **Step 4: Modify `mkdocs.yml`** — add `extra_css`, `extra_javascript`, and the `Wiring` nav entry

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

extra_css:
  - wiring/wiring.css
extra_javascript:
  - wiring/wiring.js
```

- [ ] **Step 5: Verify rendering**

Run:
```bash
mkdocs build --strict
mkdocs serve &
sleep 2
```
Open `http://127.0.0.1:8000/wiring/` in a browser.
Expected: an SVG with 4 labeled circles (Battery, Ignition Switch, Fuse Box, Frame Ground) and 3 colored lines connecting them.

- [ ] **Step 6: Verify the "missing data" fallback**

```bash
mv docs/wiring/data/wiring-data.json docs/wiring/data/wiring-data.json.bak
mkdocs build --strict   # rebuild so /wiring/ is served without the data file
```
Reload `http://127.0.0.1:8000/wiring/` in the browser.
Expected: the page shows the text "No wiring data yet." instead of a blank/broken page.

Restore the file:
```bash
mv docs/wiring/data/wiring-data.json.bak docs/wiring/data/wiring-data.json
mkdocs build --strict
```

- [ ] **Step 7: Verify the "dangling wire reference" fallback**

Temporarily edit `docs/wiring/data/wiring-data.json`, changing wire `w1`'s `to.componentId` from `"ign_sw"` to `"does_not_exist"`. Rebuild and reload `/wiring/`, then open the browser console.
Expected: the diagram still renders (3 remaining components/wires draw fine), and the console shows: `Skipping wire w1: unknown component reference`.

Revert the temporary edit so `wiring-data.json` matches Step 1 of Task 2 exactly, then rebuild:
```bash
mkdocs build --strict
kill %1
```

- [ ] **Step 8: Commit**

```bash
git add docs/wiring/wiring.js docs/wiring/wiring.css docs/wiring/index.md mkdocs.yml
git commit -m "Render wiring diagram from JSON data with missing-data and dangling-reference fallbacks"
```

---

### Task 4: Click-to-highlight interaction + side panel

**Files:**
- Modify: `docs/wiring/wiring.js`
- Modify: `docs/wiring/wiring.css`
- Modify: `docs/wiring/index.md`

**Interfaces:**
- Consumes: `renderComponents`/`renderWires` output element attributes from Task 3 (`data-component-id`, `data-wire-id`, class `wiring-component`).
- Produces: constant `PANEL_ID`; functions `attachInteraction(svg, data)`, `handleComponentClick(svg, data, componentId)`, `renderPanel(data, componentId, wires)`.

- [ ] **Step 1: Modify `docs/wiring/wiring.js`** — add `PANEL_ID` constant near the top (after `DATA_URL`)

```js
const PANEL_ID = "wiring-panel";
```

- [ ] **Step 2: Modify `docs/wiring/wiring.js`** — add the interaction functions (after `renderComponents`, before `showMessage`)

```js
function handleComponentClick(svg, data, componentId) {
  const wireLines = svg.querySelectorAll("line[data-wire-id]");
  const componentGroups = svg.querySelectorAll(".wiring-component");
  const connectedWires = data.wires.filter(
    (wire) => wire.from.componentId === componentId || wire.to.componentId === componentId
  );
  const connectedIds = new Set(connectedWires.map((wire) => wire.id));
  const connectedComponentIds = new Set([componentId]);
  connectedWires.forEach((wire) => {
    connectedComponentIds.add(wire.from.componentId);
    connectedComponentIds.add(wire.to.componentId);
  });

  wireLines.forEach((line) => {
    const isConnected = connectedIds.has(line.dataset.wireId);
    line.classList.toggle("wiring-highlighted", isConnected);
    line.classList.toggle("wiring-faded", !isConnected);
  });

  componentGroups.forEach((group) => {
    const isConnected = connectedComponentIds.has(group.dataset.componentId);
    group.classList.toggle("wiring-faded", !isConnected);
  });

  renderPanel(data, componentId, connectedWires);
}

function renderPanel(data, componentId, wires) {
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;
  const component = componentById(data, componentId);
  const items = wires
    .map((wire) => {
      const otherId =
        wire.from.componentId === componentId ? wire.to.componentId : wire.from.componentId;
      const other = componentById(data, otherId);
      return `<li><strong>${wire.color || "?"}</strong> (${wire.gauge || "?"}) to ${
        other ? other.label : otherId
      }${wire.notes ? ` &mdash; ${wire.notes}` : ""}</li>`;
    })
    .join("");
  panel.innerHTML = `<h4>${component ? component.label : componentId}</h4><ul>${items}</ul>`;
}

function attachInteraction(svg, data) {
  svg.querySelectorAll(".wiring-component").forEach((group) => {
    group.addEventListener("click", () => {
      handleComponentClick(svg, data, group.dataset.componentId);
    });
  });
}
```

- [ ] **Step 3: Modify `docs/wiring/wiring.js`** — call `attachInteraction` from `loadWiringDiagram`

Change:
```js
  const svg = createSvgRoot(container);
  renderWires(svg, data);
  renderComponents(svg, data);
}
```
to:
```js
  const svg = createSvgRoot(container);
  renderWires(svg, data);
  renderComponents(svg, data);
  attachInteraction(svg, data);
}
```

- [ ] **Step 4: Modify `docs/wiring/wiring.css`** — add interaction styles

```css
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

- [ ] **Step 5: Modify `docs/wiring/index.md`** — add the side panel container

```markdown
# Wiring Harness

<div id="wiring-diagram"></div>
<div id="wiring-panel" class="wiring-panel"></div>
```

- [ ] **Step 6: Verify interaction in the browser**

```bash
mkdocs build --strict
mkdocs serve &
sleep 2
```
Open `http://127.0.0.1:8000/wiring/`, click the "Battery" node.
Expected: the two wires touching Battery (`w1` and `w3`) turn bold, the Fuse Box node fades (not directly connected), and the panel below shows "Battery" with a list including `#c0392b (14 AWG) to Ignition Switch — Red, main feed` and `#2c3e50 (14 AWG) to Frame Ground — Black, chassis ground`.

```bash
kill %1
```

- [ ] **Step 7: Commit**

```bash
git add docs/wiring/wiring.js docs/wiring/wiring.css docs/wiring/index.md
git commit -m "Add click-to-highlight interaction and wire detail panel to wiring diagram"
```

---

### Task 5: GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `requirements.txt` from Task 1.
- Produces: a `gh-pages` branch pushed automatically on every push to `main`, which GitHub Pages serves once enabled in repo settings.

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy docs

on:
  push:
    branches:
      - main

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.x"

      - run: pip install -r requirements.txt

      - run: mkdocs gh-deploy --force
```

- [ ] **Step 2: Verify the workflow YAML is well-formed**

Run:
```bash
python3 -c "import yaml, sys; yaml.safe_load(open('.github/workflows/deploy.yml')); print('VALID')"
```
(If `pyyaml` isn't installed: `pip install pyyaml` first — it's only needed for this one-off syntax check, not a project dependency.)
Expected output: `VALID`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions workflow to deploy the site to GitHub Pages on push to main"
```

Note for after this plan is merged: the first push to `main` will create the `gh-pages` branch; GitHub Pages then needs to be pointed at that branch once (Settings → Pages → Source → `gh-pages`). This step happens outside this plan since it requires the repo's GitHub settings UI.

---

### Task 6: Root README update

**Files:**
- Modify: `README.md`

**Interfaces:** none (terminal task, no other task depends on this file).

- [ ] **Step 1: Modify `README.md`**

Replace the full contents with:

```markdown
# k100-build

A repo to document the K100 Build — a BMW K100 motorcycle build log, parts
list, and an interactive wiring harness diagram.

Live site: https://bryanwatt.github.io/k100-build/

Site source lives in `docs/`, built with [MkDocs Material](https://squidfunk.github.io/mkdocs-material/)
and deployed automatically via GitHub Actions on every push to `main`.

## Local preview

```bash
pip install -r requirements.txt
mkdocs serve
```
```

- [ ] **Step 2: Verify**

Run:
```bash
cat README.md
```
Expected: the new content above, with no leftover text from the old one-line README.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Update README to describe the site and link to the live GitHub Pages URL"
```
