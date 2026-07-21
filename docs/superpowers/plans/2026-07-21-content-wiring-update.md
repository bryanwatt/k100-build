# K100 Site Content & Wiring Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a homepage banner photo, list the new wiring components on the Parts page, and expand the wiring diagram with the starter circuit and the mo.lock keyless ignition circuit.

**Architecture:** The homepage and parts pages get straightforward markdown/asset edits. The wiring diagram grows entirely within its existing JSON schema (`components`/`wires`/`circuits`) — no code changes beyond widening the SVG `viewBox` by one line in `wiring.js` so the new components have room.

**Tech Stack:** Same as prior work — MkDocs Material, plain markdown/JSON/CSS, `sips` (macOS built-in) for image resizing, no new dependencies.

## Global Constraints

- Source image: `/Users/bryanwatt/Documents/GitHub/bryanwatt/k100-build/k100-base.jpeg` (in the main repo checkout, NOT this worktree — it must be copied across, not moved).
- Wire gauges (confirmed with the user): starter circuit wires are **6 AWG** (thick/heavy — the user's "high awg" meant heavy-duty cable, not a literal high AWG number); mo.lock's three wires and the ignition relay's ground are **18 AWG**; the ignition relay's battery-supply and switched-output wires are **12 AWG**.
- No automated test suite (carried over from prior work) — verification is `mkdocs build --strict` plus a real jsdom execution check for Task 2 (JSON + JS changes), since this project's convention is to actually execute shipped code rather than infer behavior from reading it.
- The ignition relay's switched-output destination is intentionally unresolved — model it as a real placeholder component (`tbd_load`), never as a dangling wire reference (the diagram's existing error handling logs a warning and skips any wire pointing at a nonexistent component — that's for catching bugs, not for representing "not decided yet").

---

### Task 1: Homepage banner image

**Files:**
- Create: `docs/assets/k100-base.jpeg` (resized copy of the source photo)
- Modify: `docs/index.md`

**Interfaces:** none — independent of Tasks 2 and 3.

- [ ] **Step 1: Resize and copy the image**

```bash
sips --resampleWidth 1200 --setProperty formatOptions 70 \
  /Users/bryanwatt/Documents/GitHub/bryanwatt/k100-build/k100-base.jpeg \
  --out docs/assets/k100-base.jpeg
```
Expected: creates `docs/assets/k100-base.jpeg`. Verify with:
```bash
sips -g pixelWidth -g pixelHeight docs/assets/k100-base.jpeg
ls -la docs/assets/k100-base.jpeg
```
Expected: `pixelWidth: 1200`, and a file size well under 1MB (the same command produced a 406KB file from this exact source photo when tested).

- [ ] **Step 2: Modify `docs/index.md`** — add the banner image above the existing link list

Current content:
```markdown
# K100 Build

A running log of my BMW K100 build — parts, progress, and the wiring
harness as I trace it.

- [Build Log](build-log/index.md)
- [Parts](parts.md)
- [Wiring Harness](wiring/index.md)
```

Replace with:
```markdown
# K100 Build

![The K100](assets/k100-base.jpeg)

A running log of my BMW K100 build — parts, progress, and the wiring
harness as I trace it.

- [Build Log](build-log/index.md)
- [Parts](parts.md)
- [Wiring Harness](wiring/index.md)
```

- [ ] **Step 3: Verify the build succeeds and the image is wired in**

```bash
mkdocs build --strict
grep -o 'assets/k100-base.jpeg' site/index.html
test -f site/assets/k100-base.jpeg && echo "image built"
```
Expected: build completes with no warnings/errors; the grep finds a match; `image built` prints.

- [ ] **Step 4: Commit**

```bash
git add docs/assets/k100-base.jpeg docs/index.md
git commit -m "Add homepage banner photo of the K100"
```

---

### Task 2: Wiring diagram — starter circuit and keyless ignition (mo.lock)

**Files:**
- Modify: `docs/wiring/data/wiring-data.json`
- Modify: `docs/wiring/wiring.js` (one line — widen the `viewBox`)

**Interfaces:** none consumed from Task 1 or 3. Adds to the existing `components`/`wires`/`circuits` arrays — the schema itself (field names/nesting) is unchanged.

- [ ] **Step 1: Modify `docs/wiring/data/wiring-data.json`** — replace the full file content

```json
{
  "components": [
    { "id": "batt", "label": "Battery", "type": "power", "x": 40, "y": 40, "notes": "12V battery, negative ground" },
    { "id": "ign_sw", "label": "Ignition Switch", "type": "switch", "x": 200, "y": 40, "notes": "" },
    { "id": "fuse_box", "label": "Fuse Box", "type": "connector", "x": 200, "y": 160, "notes": "Pin 4 feeds ignition circuit" },
    { "id": "gnd", "label": "Frame Ground", "type": "ground", "x": 40, "y": 160, "notes": "" },
    { "id": "starter_relay", "label": "Starter Relay", "type": "relay", "x": 380, "y": 40, "notes": "Engages the starter motor from the start circuit" },
    { "id": "starter", "label": "Starter", "type": "motor", "x": 380, "y": 160, "notes": "Starter motor" },
    { "id": "mo_lock", "label": "mo.lock Keyless Ignition", "type": "module", "x": 560, "y": 40, "notes": "Keyless ignition module" },
    { "id": "ign_relay", "label": "Ignition Relay", "type": "relay", "x": 560, "y": 160, "notes": "Standard automotive relay switching ignition-fed accessories" },
    { "id": "tbd_load", "label": "TBD — Switched Accessory Load", "type": "placeholder", "x": 680, "y": 160, "notes": "Destination not yet determined; connects to the ignition relay's switched output once defined." }
  ],
  "wires": [
    { "id": "w1", "from": { "componentId": "batt", "pin": "+" }, "to": { "componentId": "ign_sw", "pin": "1" }, "color": "#c0392b", "gauge": "14 AWG", "circuit": "ignition", "notes": "Red, main feed" },
    { "id": "w2", "from": { "componentId": "ign_sw", "pin": "2" }, "to": { "componentId": "fuse_box", "pin": "4" }, "color": "#c0392b", "gauge": "16 AWG", "circuit": "ignition", "notes": "" },
    { "id": "w3", "from": { "componentId": "batt", "pin": "-" }, "to": { "componentId": "gnd", "pin": "1" }, "color": "#2c3e50", "gauge": "14 AWG", "circuit": "ground", "notes": "Black, chassis ground" },
    { "id": "w4", "from": { "componentId": "batt", "pin": "+" }, "to": { "componentId": "starter_relay", "pin": "supply-in" }, "color": "#c0392b", "gauge": "6 AWG", "circuit": "starter", "notes": "Red, heavy supply from battery" },
    { "id": "w5", "from": { "componentId": "batt", "pin": "-" }, "to": { "componentId": "starter_relay", "pin": "ground-in" }, "color": "#2c3e50", "gauge": "6 AWG", "circuit": "starter", "notes": "Black, heavy return to battery" },
    { "id": "w6", "from": { "componentId": "starter_relay", "pin": "motor-out" }, "to": { "componentId": "starter", "pin": "+" }, "color": "#c0392b", "gauge": "6 AWG", "circuit": "starter", "notes": "Red, heavy feed to starter motor" },
    { "id": "w7", "from": { "componentId": "starter_relay", "pin": "ground-out" }, "to": { "componentId": "starter", "pin": "ground" }, "color": "#2c3e50", "gauge": "6 AWG", "circuit": "starter", "notes": "Black, heavy return from starter motor" },
    { "id": "w8", "from": { "componentId": "batt", "pin": "+" }, "to": { "componentId": "mo_lock", "pin": "supply" }, "color": "#c0392b", "gauge": "18 AWG", "circuit": "keyless", "notes": "Red, small supply wire" },
    { "id": "w9", "from": { "componentId": "mo_lock", "pin": "signal-out" }, "to": { "componentId": "ign_relay", "pin": "switching-in" }, "color": "#27ae60", "gauge": "18 AWG", "circuit": "keyless", "notes": "Green, ignition trigger to relay switching input" },
    { "id": "w10", "from": { "componentId": "mo_lock", "pin": "ground" }, "to": { "componentId": "gnd", "pin": "2" }, "color": "#2c3e50", "gauge": "18 AWG", "circuit": "keyless", "notes": "Black, small ground wire" },
    { "id": "w11", "from": { "componentId": "batt", "pin": "+" }, "to": { "componentId": "ign_relay", "pin": "supply-in" }, "color": "#c0392b", "gauge": "12 AWG", "circuit": "keyless", "notes": "Red, medium supply from battery" },
    { "id": "w12", "from": { "componentId": "ign_relay", "pin": "switched-out" }, "to": { "componentId": "tbd_load", "pin": "in" }, "color": "#c0392b", "gauge": "12 AWG", "circuit": "keyless", "notes": "Red, switched output — target circuit not yet determined" },
    { "id": "w13", "from": { "componentId": "ign_relay", "pin": "ground" }, "to": { "componentId": "gnd", "pin": "3" }, "color": "#2c3e50", "gauge": "18 AWG", "circuit": "keyless", "notes": "Black, small ground wire" }
  ],
  "circuits": [
    { "id": "ignition", "name": "Ignition", "color": "#c0392b" },
    { "id": "ground", "name": "Ground", "color": "#2c3e50" },
    { "id": "starter", "name": "Starter", "color": "#f39c12" },
    { "id": "keyless", "name": "Keyless Ignition", "color": "#27ae60" }
  ]
}
```

- [ ] **Step 2: Verify the JSON is well-formed**

```bash
python3 -m json.tool docs/wiring/data/wiring-data.json > /dev/null && echo VALID
```
Expected: `VALID`

- [ ] **Step 3: Modify `docs/wiring/wiring.js`** — widen the viewBox

In `createSvgRoot`, change:
```js
  svg.setAttribute("viewBox", "0 0 600 400");
```
to:
```js
  svg.setAttribute("viewBox", "0 0 760 400");
```

- [ ] **Step 4: Verify the build succeeds**

```bash
mkdocs build --strict
```
Expected: completes with no warnings/errors.

- [ ] **Step 5: Real behavioral verification via headless DOM (Node + jsdom)**

This project's convention (established in the original build) is to execute the actual shipped code rather than infer correctness from reading it — no browser automation is available in this environment. Write this script to a scratch location (e.g. reuse `/private/tmp/claude-501/-Users-bryanwatt-Documents-GitHub-bryanwatt-k100-build/dd57bb19-7620-4508-a130-4d30ebeef630/scratchpad/verify-task3/` if it still exists from earlier in this session — it already has `jsdom` installed via `npm install jsdom --no-save`; otherwise create a fresh scratch dir and run `npm install jsdom --no-save --no-audit --no-fund` there first):

```js
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const REPO = "/Users/bryanwatt/Documents/GitHub/bryanwatt/k100-build/.claude/worktrees/k100-build-site";
const wiringJs = fs.readFileSync(path.join(REPO, "docs/wiring/wiring.js"), "utf8");
const dataText = fs.readFileSync(path.join(REPO, "docs/wiring/data/wiring-data.json"), "utf8");
const data = JSON.parse(dataText);

(async () => {
  const dom = new JSDOM(
    `<!doctype html><html><body><div id="wiring-diagram"></div><div id="wiring-panel" class="wiring-panel"></div></body></html>`,
    { runScripts: "outside-only" }
  );
  const { window } = dom;
  const warnings = [];
  window.console.warn = (...args) => warnings.push(args.join(" "));
  window.fetch = async () => ({ ok: true, json: async () => data });

  window.eval(wiringJs);
  await window.loadWiringDiagram();

  const svg = window.document.getElementById("wiring-diagram").querySelector("svg");
  const circles = svg.querySelectorAll("circle");
  const lines = svg.querySelectorAll("line[data-wire-id]");

  const starterRelayGroup = svg.querySelector('g[data-component-id="starter_relay"]');
  starterRelayGroup.dispatchEvent(new window.Event("click", { bubbles: true }));

  const wireState = {};
  lines.forEach((l) => { wireState[l.dataset.wireId] = l.getAttribute("class") || ""; });

  console.log("components rendered:", circles.length);
  console.log("wires rendered:", lines.length);
  console.log("viewBox:", svg.getAttribute("viewBox"));
  console.log("dangling-reference warnings:", warnings);

  const checks = [
    ["9 components rendered", circles.length === 9],
    ["13 wires rendered", lines.length === 13],
    ["viewBox widened to 0 0 760 400", svg.getAttribute("viewBox") === "0 0 760 400"],
    ["4 circuits in data", data.circuits.length === 4],
    ["starter circuit present", data.circuits.some((c) => c.id === "starter")],
    ["keyless circuit present", data.circuits.some((c) => c.id === "keyless")],
    ["w4 highlighted after clicking starter_relay", /wiring-highlighted/.test(wireState.w4)],
    ["w5 highlighted after clicking starter_relay", /wiring-highlighted/.test(wireState.w5)],
    ["w6 highlighted after clicking starter_relay", /wiring-highlighted/.test(wireState.w6)],
    ["w7 highlighted after clicking starter_relay", /wiring-highlighted/.test(wireState.w7)],
    ["w1 faded after clicking starter_relay (unrelated wire)", /wiring-faded/.test(wireState.w1)],
    ["no dangling-reference warnings", warnings.length === 0],
  ];

  let allPass = true;
  for (const [desc, pass] of checks) {
    console.log(`${pass ? "PASS" : "FAIL"}: ${desc}`);
    if (!pass) allPass = false;
  }
  console.log(allPass ? "\nALL CHECKS PASSED" : "\nSOME CHECKS FAILED");
  process.exit(allPass ? 0 : 1);
})();
```

Save as e.g. `verify-content-update.js` in the scratch dir and run with `node verify-content-update.js`. Expected: every check prints `PASS` and the script ends with `ALL CHECKS PASSED`. Paste the real output in your report — do not summarize it as a checklist without the actual run.

- [ ] **Step 6: Commit**

```bash
git add docs/wiring/data/wiring-data.json docs/wiring/wiring.js
git commit -m "Add starter circuit and mo.lock keyless ignition to the wiring diagram"
```

---

### Task 3: Parts page — list the new wiring components

**Files:**
- Modify: `docs/parts.md`

**Interfaces:** none.

- [ ] **Step 1: Modify `docs/parts.md`**

Current content:
```markdown
# Parts

Parts list and sourcing notes will go here.
```

Replace with:
```markdown
# Parts

Parts list and sourcing notes will go here.

## Electrical

- Starter Relay
- Starter
- mo.lock Keyless Ignition
- Ignition Relay (standard automotive relay)
```

- [ ] **Step 2: Verify**

```bash
mkdocs build --strict
cat docs/parts.md
```
Expected: build completes with no warnings/errors; the file shows the new list under an `## Electrical` heading.

- [ ] **Step 3: Commit**

```bash
git add docs/parts.md
git commit -m "List the starter and keyless ignition components on the Parts page"
```
