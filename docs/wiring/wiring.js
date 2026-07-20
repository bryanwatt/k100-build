const SVG_NS = "http://www.w3.org/2000/svg";
const CONTAINER_ID = "wiring-diagram";
const DATA_URL = "data/wiring-data.json";
const PANEL_ID = "wiring-panel";

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
  attachInteraction(svg, data);
}

document.addEventListener("DOMContentLoaded", loadWiringDiagram);
