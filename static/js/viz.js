// Hand-written SVG charts for the page. Every chart reads data.js; nothing is fetched.
"use strict";

const NS = "http://www.w3.org/2000/svg";
const INK = "#1d2830", MUTED = "#5e6773", FAINT = "#8a929c", GRID = "#eceef1", BASE = "#c9ced4";
const SPACE = Object.fromEntries(SPACES.map(s => [s.key, s]));

function el(tag, attrs = {}, parent = null) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
}
function text(parent, x, y, s, attrs = {}) {
  const t = el("text", { x, y, ...attrs }, parent);
  t.textContent = s;
  return t;
}
function lin(d0, d1, r0, r1) {
  const f = v => r0 + (v - d0) * (r1 - r0) / (d1 - d0);
  f.domain = [d0, d1];
  return f;
}
function niceTicks(lo, hi, n) {
  const span = hi - lo, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => span / s <= n) || 10 * mag;
  const out = [];
  for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(6));
  return out;
}
function svgRoot(host, w, h, label) {
  host.innerHTML = "";
  return el("svg", { viewBox: `0 0 ${w} ${h}`, role: "img", "aria-label": label }, host);
}
const fmt = v => (Math.round(v * 10) / 10).toFixed(1);

// ---------- tooltip ----------
const Tip = {
  node: null,
  show(evt, html) {
    this.node = this.node || document.getElementById("tip");
    this.node.innerHTML = html;
    this.node.style.opacity = 1;
    this.move(evt);
  },
  move(evt) {
    if (!this.node) return;
    const pad = 14, w = this.node.offsetWidth, vw = document.documentElement.clientWidth;
    let x = evt.pageX + pad;
    if (evt.clientX + pad + w > vw - 8) x = evt.pageX - w - pad;
    this.node.style.left = x + "px";
    this.node.style.top = (evt.pageY + pad) + "px";
  },
  hide() { if (this.node) this.node.style.opacity = 0; },
};
function hover(node, html) {
  node.addEventListener("mouseenter", e => Tip.show(e, typeof html === "function" ? html() : html));
  node.addEventListener("mousemove", e => Tip.move(e));
  node.addEventListener("mouseleave", () => Tip.hide());
}

// ---------- legend helper ----------
function legend(id, items) {
  const host = document.getElementById(id);
  if (!host) return;
  host.innerHTML = items.map(([kind, color, label]) => {
    const style = kind === "ring" || kind === "line" || kind === "dash" ? `border-color:${color}` : `background:${color}`;
    return `<span><i class="${kind}" style="${style}"></i>${label}</span>`;
  }).join("");
}

// =====================================================================================================
// §2 The world-action model, with hover notes
function drawModel() {
  const W = 880, H = 250, svg = svgRoot(document.getElementById("fig-model"), W, H, "The world–action model");
  const defs = el("defs", {}, svg);
  const m = el("marker", { id: "arr", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
  el("path", { d: "M0,1 L9,5 L0,9 z", fill: MUTED }, m);
  const arrow = (x1, y1, x2, y2, dash) => el("line", { x1, y1, x2, y2, stroke: MUTED, "stroke-width": 1.4, "marker-end": "url(#arr)", "stroke-dasharray": dash ? "4 3" : null }, svg);

  const part = (x, y, w, h, title, sub, note, fill = "#fff") => {
    const g = el("g", { class: "part-node", style: "cursor:help" }, svg);
    el("rect", { x, y, width: w, height: h, rx: 9, fill, stroke: INK, "stroke-width": 1.3 }, g);
    text(g, x + w / 2, y + h / 2 + (sub ? -3 : 5), title, { "text-anchor": "middle", "font-size": 14.5, "font-weight": 600, fill: INK });
    if (sub) text(g, x + w / 2, y + h / 2 + 15, sub, { "text-anchor": "middle", "font-size": 12, fill: MUTED });
    hover(g, note);
    return g;
  };

  // frames
  const frames = [["o0", "current"], ["o4", "future"], ["o8", "future"]];
  frames.forEach(([f, lab], i) => {
    const x = 18 + i * 78, y = 52;
    if (i > 0) { // three blank sheets behind each future block
      for (let k = 3; k >= 1; k--) el("rect", { x: x - k * 3, y: y - k * 3, width: 70, height: 55, rx: 3, fill: "#fff", stroke: BASE }, svg);
    }
    el("image", { href: `static/images/frames/${f}.jpg`, x, y, width: 70, height: 55, preserveAspectRatio: "xMidYMid slice" }, svg);
    el("rect", { x, y, width: 70, height: 55, rx: 3, fill: "none", stroke: "#9aa1aa" }, svg);
    text(svg, x + 35, y + 72, lab, { "text-anchor": "middle", "font-size": 12, fill: MUTED });
  });
  text(svg, 18, 30, "One window: 33 frames, every fourth encoded", { "font-size": 12, fill: FAINT });

  const noteEnc = `<div class="t">Frozen encoder</div><div class="m">Maps the frames to the visual space under study:<br>the current state and two future states (blocks of four frames).<br>The only part that changes between configurations.</div>`;
  part(254, 54, 136, 58, "Encoder ❄", "the space under study", noteEnc, "#f6f2fd");
  arrow(242, 83, 252, 83);

  // states
  const st = [["current", 410], ["future", 454], ["future", 498]];
  st.forEach(([lab, x], i) => {
    const g = el("g", {}, svg);
    el("rect", { x, y: 66, width: 34, height: 34, rx: 6, fill: i ? "#fff" : "#e7defa", stroke: "#7b45c2", "stroke-width": 1.3, "stroke-dasharray": i ? "3 2" : null }, g);
    text(g, x + 17, 120, lab, { "text-anchor": "middle", "font-size": 11.5, fill: MUTED });
  });
  arrow(390, 83, 406, 83);
  text(svg, 476, 52, "states", { "text-anchor": "middle", "font-size": 12, fill: FAINT });

  const noteWorld = `<div class="t">World Transformer</div><div class="m">Wan2.2-TI2V-5B architecture, 30 layers, about 5.0B parameters.<br>Pass 1 (training): denoises noised future states given the current one.<br>Pass 2 (training and inference): the future positions hold pure noise.</div>`;
  part(560, 44, 150, 78, "World Transformer", "predicts future states", noteWorld);
  arrow(532, 83, 556, 83);
  arrow(710, 83, 760, 83, true);
  text(svg, 766, 79, "future states", { "font-size": 12.5, fill: INK });
  text(svg, 766, 95, "pass 1, training only", { "font-size": 11.5, fill: FAINT });

  const noteAct = `<div class="t">Action expert</div><div class="m">30 layers, about 1.0B parameters. Reads the world Transformer<br>at every layer and denoises the 32-step action chunk;<br>ten steps at inference, from one pass of the world Transformer.</div>`;
  part(560, 168, 150, 56, "Action expert", "denoises actions", noteAct);
  [600, 635, 670].forEach(x => arrow(x, 124, x, 164));
  text(svg, 716, 148, "reads every layer", { "font-size": 11.5, fill: FAINT });
  arrow(710, 196, 760, 196);
  for (let i = 0; i < 4; i++) el("rect", { x: 766 + i * 22, y: 186, width: 18, height: 18, rx: 3, fill: "#5d8dfd", stroke: "#2346b8" }, svg);
  text(svg, 766, 226, "32-step action chunk", { "font-size": 12, fill: MUTED });
}

// §2 the six spaces
function drawSpaces() {
  const host = document.getElementById("spaces");
  const group = (kind, title, sub) => {
    const cards = SPACES.filter(s => s.kind === kind).map(s => `
      <div class="space"><div class="nm"><i style="background:${s.fill};border:1.5px solid ${s.color}"></i>${s.name}</div>
      <div class="ab">${s.about}</div></div>`).join("");
    return `<div class="sgrp"><div class="sh ${kind}">${title}<span>${sub}</span></div><div class="srow n${SPACES.filter(s => s.kind === kind).length}">${cards}</div></div>`;
  };
  host.innerHTML = group("recon", "Reconstruction latents", "from generators; the image can be redrawn from them") +
    group("repr", "Representation latents", "from pretrained encoders");
}

// =====================================================================================================
// §3 success against the loss
function chartMeasure() {
  const W = 880, H = 380, L = 62, R = 24, T = 18, B = 52;
  const svg = svgRoot(document.getElementById("fig-measure"), W, H, "Success against pretraining action loss");
  const x = lin(7.6, 9.0, L, W - R);
  const gGrid = el("g", { class: "grid" }, svg), gAxis = el("g", { class: "axis" }, svg);
  const gFit = el("g", {}, svg), gPts = el("g", {}, svg);
  niceTicks(7.6, 9.0, 7).forEach(v => {
    el("line", { x1: x(v), x2: x(v), y1: T, y2: H - B }, gGrid);
    text(gAxis, x(v), H - B + 18, v.toFixed(1), { "text-anchor": "middle" });
  });
  text(gAxis, (L + W - R) / 2, H - 10, "Pretraining action loss (×10⁻³), lower is better", { "text-anchor": "middle", class: "lbl" });
  const yLabel = text(gAxis, 16, (T + H - B) / 2, "", { "text-anchor": "middle", class: "lbl", transform: `rotate(-90 16 ${(T + H - B) / 2})` });
  const gY = el("g", { class: "axis" }, svg), gYGrid = el("g", { class: "grid" }, svg);
  svg.insertBefore(gYGrid, gGrid);
  const rText = text(svg, W - R - 4, T + 18, "", { "text-anchor": "end", "font-size": 15, "font-weight": 600, fill: INK });

  const all = {
    robotwin: MEASURE.robotwin.map(r => ({ p: r[0], label: r[1], second: r[2], coupling: r[3], loss: r[4], clean: r[5], random: r[6] })),
    liberoPlus: MEASURE.liberoPlus.map(r => ({ p: r[0], label: r[1], second: r[2], coupling: r[3], loss: r[4], plus: r[5] })),
  };
  // one persistent node per configuration (keyed by label + coupling), moved on toggle
  const nodes = new Map();
  const keyOf = d => d.label + "|" + (d.coupling || "");
  [...all.robotwin, ...all.liberoPlus].forEach(d => {
    const k = keyOf(d);
    if (nodes.has(k)) return;
    const g = el("g", { class: "mark" }, gPts);
    const s = SPACE[d.p];
    if (d.coupling) el("circle", { r: 5.2, fill: "#fff", stroke: s.color, "stroke-width": 2 }, g);
    else el("circle", { r: 7, fill: s.fill, stroke: s.color, "stroke-width": 1.5 }, g);
    el("circle", { r: 11, class: "hit" }, g);
    nodes.set(k, { g, d });
  });

  const views = {
    clean: { set: "robotwin", f: "clean", y: [70, 90], label: "Success in clean scenes (%)", r: MEASURE.r.clean },
    random: { set: "robotwin", f: "random", y: [0, 32], label: "Success in randomized scenes (%)", r: MEASURE.r.random },
    plus: { set: "liberoPlus", f: "plus", y: [44, 70], label: "LIBERO-Plus success (%)", r: MEASURE.r.plus },
  };
  function update(v) {
    const view = views[v], y = lin(view.y[0], view.y[1], H - B, T);
    gY.innerHTML = ""; gYGrid.innerHTML = "";
    niceTicks(view.y[0], view.y[1], 5).forEach(t => {
      el("line", { x1: L, x2: W - R, y1: y(t), y2: y(t) }, gYGrid);
      text(gY, L - 8, y(t) + 4, String(t), { "text-anchor": "end" });
    });
    yLabel.textContent = view.label;
    rText.textContent = `r = ${view.r.toFixed(2).replace("-", "−")}`;
    const data = all[view.set], shown = new Set(data.map(keyOf));
    // least-squares fit
    const n = data.length, mx = data.reduce((a, d) => a + d.loss, 0) / n, my = data.reduce((a, d) => a + d[view.f], 0) / n;
    const b = data.reduce((a, d) => a + (d.loss - mx) * (d[view.f] - my), 0) / data.reduce((a, d) => a + (d.loss - mx) ** 2, 0);
    gFit.innerHTML = "";
    el("line", { x1: x(7.6), y1: y(my + b * (7.6 - mx)), x2: x(9.0), y2: y(my + b * (9.0 - mx)), stroke: "#9aa0a8", "stroke-width": 1.5, "clip-path": "url(#clipM)" }, gFit);
    nodes.forEach(({ g, d }, k) => {
      const dd = data.find(e => keyOf(e) === k);
      if (!dd) { g.style.opacity = 0; g.style.pointerEvents = "none"; return; }
      g.style.opacity = 1; g.style.pointerEvents = "";
      g.style.transform = `translate(${x(dd.loss)}px, ${y(dd[view.f])}px)`;
      g.onmouseenter = e => Tip.show(e, `<div class="t">${dd.label}${dd.coupling ? ", " + dd.coupling : ""}</div><div class="m">loss ${dd.loss.toFixed(2)} · success ${fmt(dd[view.f])}%</div>`);
      g.onmousemove = e => Tip.move(e);
      g.onmouseleave = () => Tip.hide();
    });
  }
  const clip = el("clipPath", { id: "clipM" }, el("defs", {}, svg));
  el("rect", { x: L, y: T, width: W - L - R, height: H - T - B }, clip);
  update("clean");
  legend("leg-measure", [
    ...SPACES.map(s => ["", s.fill, s.name]),
    ["ring", MUTED, "two spaces, coupled (color: primary space)"],
  ]);
  return { update };
}

// =====================================================================================================
// §4 dumbbells: in domain -> out of domain
function chartGap() {
  const W = 880, rowH = 40, T = 26, B = 40, L = 150, R = 60;
  const order = ["wan", "flux2", "siglip", "dino", "vggt", "vjepa"];
  const H = T + B + order.length * rowH + 14;
  const svg = svgRoot(document.getElementById("fig-gap"), W, H, "Success in and out of domain for six spaces");
  const x = lin(0, 100, L, W - R);
  const gGrid = el("g", { class: "grid" }, svg), gAx = el("g", { class: "axis" }, svg);
  [0, 20, 40, 60, 80, 100].forEach(v => {
    el("line", { x1: x(v), x2: x(v), y1: T - 6, y2: H - B + 4 }, gGrid);
    text(gAx, x(v), H - B + 22, v, { "text-anchor": "middle" });
  });
  text(gAx, (L + W - R) / 2, H - 4, "Success (%)", { "text-anchor": "middle", class: "lbl" });
  const rows = {};
  order.forEach((k, i) => {
    const s = SPACE[k], cy = T + i * rowH + (i >= 2 ? 14 : 0) + rowH / 2;
    const g = el("g", {}, svg);
    text(g, L - 14, cy + 4, s.name, { "text-anchor": "end", "font-size": 13.5, fill: INK, "font-weight": 500 });
    const line = el("line", { y1: cy, y2: cy, stroke: s.color, "stroke-width": 2.5, "stroke-linecap": "round", class: "mark" }, g);
    const a = el("circle", { cy: 0, r: 6.5, fill: "#fff", stroke: s.color, "stroke-width": 2, class: "mark" }, g);
    const b = el("circle", { cy: 0, r: 7, fill: s.color, class: "mark" }, g);
    const la = text(g, 0, cy - 11, "", { "text-anchor": "middle", "font-size": 11.5, fill: MUTED, class: "mark" });
    const lb = text(g, 0, cy - 11, "", { "text-anchor": "middle", "font-size": 11.5, fill: INK, "font-weight": 600, class: "mark" });
    rows[k] = { cy, line, a, b, la, lb, g };
  });
  text(svg, 12, T + rowH / 2 - 14, "RECONSTRUCTION", { "font-size": 10.5, fill: "#d9820f", "letter-spacing": ".08em", "font-weight": 600 });
  text(svg, 12, T + 2 * rowH + 14 + rowH / 2 - 14, "REPRESENTATION", { "font-size": 10.5, fill: "#7b45c2", "letter-spacing": ".08em", "font-weight": 600 });
  el("line", { x1: 12, x2: W - R, y1: T + 2 * rowH + 7, y2: T + 2 * rowH + 7, stroke: GRID }, svg);

  function update(v) {
    const [fa, fb, na, nb] = v === "robotwin" ? ["c2c", "c2r", "clean", "randomized"] : ["libero", "plus", "original tasks", "LIBERO-Plus"];
    order.forEach(k => {
      const r = rows[k], va = SINGLE[k][fa], vb = SINGLE[k][fb];
      r.line.setAttribute("x1", x(Math.min(va, vb))); r.line.setAttribute("x2", x(Math.max(va, vb)));
      r.a.setAttribute("cx", x(va)); r.a.setAttribute("cy", r.cy);
      r.b.setAttribute("cx", x(vb)); r.b.setAttribute("cy", r.cy);
      r.la.setAttribute("x", x(va)); r.la.textContent = fmt(va);
      r.lb.setAttribute("x", x(vb)); r.lb.textContent = fmt(vb);
      r.g.onmouseenter = e => Tip.show(e, `<div class="t">${SPACE[k].name}</div><div class="m">${na}: ${fmt(va)}% → ${nb}: ${fmt(vb)}%</div>`);
      r.g.onmousemove = e => Tip.move(e); r.g.onmouseleave = () => Tip.hide();
    });
  }
  update("robotwin");
  return { update };
}

// §4 LIBERO-Plus by category
function chartCats() {
  const groupMean = (keys, i) => keys.reduce((a, k) => a + PLUS_BY_CATEGORY[k][i], 0) / keys.length;
  const recon = ["wan", "flux2"], repr = ["siglip", "dino", "vggt", "vjepa"];
  const rowsData = CATEGORIES.map((c, i) => ({ c, i, gap: groupMean(repr, i) - groupMean(recon, i) }))
    .sort((a, b) => b.gap - a.gap);
  const W = 880, rowH = 36, T = 14, B = 44, L = 150, R = 110;
  const H = T + B + rowsData.length * rowH;
  const svg = svgRoot(document.getElementById("fig-cats"), W, H, "LIBERO-Plus success by perturbation category");
  const x = lin(0, 100, L, W - R);
  const gGrid = el("g", { class: "grid" }, svg), gAx = el("g", { class: "axis" }, svg);
  [0, 20, 40, 60, 80, 100].forEach(v => {
    el("line", { x1: x(v), x2: x(v), y1: T - 4, y2: H - B + 4 }, gGrid);
    text(gAx, x(v), H - B + 22, v, { "text-anchor": "middle" });
  });
  text(gAx, (L + W - R) / 2, H - 4, "LIBERO-Plus success (%)", { "text-anchor": "middle", class: "lbl" });
  text(svg, W - R + 16, T - 1, "gap", { "font-size": 11.5, fill: FAINT });
  rowsData.forEach((r, j) => {
    const cy = T + j * rowH + rowH / 2 + 6, g = el("g", { style: "cursor:pointer" }, svg);
    el("rect", { x: 8, y: cy - rowH / 2, width: W - 16, height: rowH, fill: "transparent", class: "rowbg" }, g);
    text(g, L - 14, cy + 4, r.c, { "text-anchor": "end", "font-size": 13.5, fill: INK, "font-weight": 500 });
    const mr = groupMean(recon, r.i), mp = groupMean(repr, r.i);
    el("line", { x1: x(Math.min(mr, mp)), x2: x(Math.max(mr, mp)), y1: cy, y2: cy, stroke: mp >= mr ? "#d9c8f3" : "#f6d8a8", "stroke-width": 9, "stroke-linecap": "round" }, g);
    [...recon, ...repr].forEach(k => {
      const s = SPACE[k], v = PLUS_BY_CATEGORY[k][r.i];
      if (s.kind === "recon") el("rect", { x: x(v) - 6, y: cy - 6, width: 12, height: 12, rx: 2, fill: s.fill, stroke: s.color, "stroke-width": 1.5 }, g);
      else el("circle", { cx: x(v), cy, r: 6.5, fill: s.fill, stroke: s.color, "stroke-width": 1.5 }, g);
    });
    const gap = mp - mr;
    text(g, W - R + 16, cy + 4, (gap >= 0 ? "+" : "−") + fmt(Math.abs(gap)), { "font-size": 12.5, "font-weight": 600, fill: gap >= 0 ? "#6e3fae" : "#b0650a" });
    hover(g, () => `<div class="t">${r.c}: changes the ${CATEGORY_ABOUT[r.c]}</div>` +
      [...recon, ...repr].map(k => `<div class="m">${SPACE[k].name}: ${fmt(PLUS_BY_CATEGORY[k][r.i])}%</div>`).join("") +
      `<div class="m" style="margin-top:3px">representation mean − reconstruction mean: ${gap >= 0 ? "+" : "−"}${fmt(Math.abs(gap))}</div>`);
    g.addEventListener("mouseenter", () => g.querySelector(".rowbg").setAttribute("fill", "#f7f8fa"));
    g.addEventListener("mouseleave", () => g.querySelector(".rowbg").setAttribute("fill", "transparent"));
  });
  legend("leg-cats", [
    ...SPACES.map(s => [s.kind === "recon" ? "sq" : "", s.fill, s.name]),
    ["line", "#d9c8f3", "between the two group means"],
  ]);
}

// =====================================================================================================
// §5 the couplings table
function drawCouplings() {
  const body = document.querySelector("#couplings tbody");
  const yes = '<span class="yes">✓</span>', no = '<span class="no">✗</span>';
  const fam = (f, title) => `<tr class="fam"><td colspan="6">${title}</td></tr>` + COUPLINGS.filter(c => c.family === f).map(c => `
    <tr><td><span class="nm"><i style="background:${c.color}"></i>${c.name}</span></td><td class="ab">${c.about}</td>
    <td class="c">${yes}</td><td class="c">${f === "input" ? yes : no}</td><td class="c">${f === "input" ? yes : no}</td>
    <td class="c">${c.compute.toFixed(2)}×</td></tr>`).join("");
  body.innerHTML = fam("aligning", "Aligning couplings: B as a training target") + fam("input", "Input couplings: B as an input and a target");
}

// §5 coupled success against the second space alone: input couplings follow it, aligning couplings do not
function chartPairs() {
  const W = 880, H = 400, L = 64, R = 190, T = 22, B = 74;
  const svg = svgRoot(document.getElementById("fig-pairs"), W, H, "Success with V-JEPA 2.1 against the second space alone");
  const pairs = PAIRS.filter(p => p.second !== "vjepa");   // the self-pair is a control, discussed in the text
  const FAM = {
    aligning: { name: "B as a training target", members: "REPA, Feature Forcing", color: "#D47A06" },
    input: { name: "B as an input", members: "Fusion, Joint Attention, Multi-expert", color: "#5B6878" },
  };
  const gGrid = el("g", { class: "grid" }, svg), gAx = el("g", { class: "axis" }, svg);
  const gRef = el("g", {}, svg), gLines = el("g", {}, svg), gPts = el("g", {}, svg), gLab = el("g", {}, svg);
  const yLab = text(gAx, 16, (T + H - B) / 2, "", { "text-anchor": "middle", class: "lbl", transform: `rotate(-90 16 ${(T + H - B) / 2})` });
  text(gAx, (L + W - R) / 2, H - 8, "Second space alone (%)", { "text-anchor": "middle", class: "lbl" });
  const diag = el("line", { stroke: "#c3c8ce", "stroke-width": 1.2, "stroke-dasharray": "4 4" }, gRef);
  const vline = el("line", { x1: L, x2: W - R, stroke: "#7b45c2", "stroke-width": 1.6, "stroke-dasharray": "6 4" }, gRef);
  const vlab = text(gRef, L + 6, 0, "", { "font-size": 12, fill: "#7b45c2", "font-weight": 600 });

  // one dot per coupling and pair, one mean marker per family and pair
  const dots = [];
  pairs.forEach(p => COUPLINGS.forEach(c => {
    const g = el("g", { class: "mark" }, gPts);
    el("circle", { r: 4.5, fill: FAM[c.family].color, "fill-opacity": 0.32 }, g);
    el("circle", { r: 9, class: "hit" }, g);
    dots.push({ g, p, c });
  }));
  const means = { aligning: [], input: [] };
  Object.keys(FAM).forEach(f => pairs.forEach(p => {
    const g = el("g", { class: "mark" }, gLab);
    el("circle", { r: 6.5, fill: FAM[f].color, stroke: "#fff", "stroke-width": 2 }, g);
    el("circle", { r: 11, class: "hit" }, g);
    means[f].push({ g, p });
  }));
  const paths = Object.fromEntries(Object.keys(FAM).map(f => [f, el("path", { fill: "none", stroke: FAM[f].color, "stroke-width": 2.6, "stroke-linejoin": "round", "stroke-linecap": "round" }, gLines)]));
  const ends = Object.fromEntries(Object.keys(FAM).map(f => {
    const g = el("g", {}, gLab);
    const a = text(g, 0, 0, FAM[f].name, { "font-size": 13, "font-weight": 600, fill: FAM[f].color });
    const b = text(g, 0, 0, FAM[f].members, { "font-size": 11.5, fill: MUTED });
    return [f, { a, b }];
  }));

  function update(v) {
    v = +v;
    const xd = v ? [0, 24] : [70, 84], yd = v ? [0, 40] : [70, 90];
    const x = lin(xd[0], xd[1], L, W - R), y = lin(yd[0], yd[1], H - B, T);
    gGrid.innerHTML = ""; gAx.querySelectorAll(".tick").forEach(n => n.remove());
    niceTicks(yd[0], yd[1], 4).forEach(t => {
      el("line", { x1: L, x2: W - R, y1: y(t), y2: y(t) }, gGrid);
      text(gAx, L - 8, y(t) + 4, String(t), { "text-anchor": "end", class: "tick" });
    });
    // x ticks: the second spaces themselves, at their success alone
    const sorted = [...pairs].sort((a, b) => a.alone[v] - b.alone[v]);
    let lastX = -1e9, lastRow = 0;
    sorted.forEach(p => {
      const xv = x(p.alone[v]);
      lastRow = xv - lastX < 74 ? 1 - lastRow : 0;   // a name too close to the previous one drops a line
      const stagger = lastRow * 30; lastX = xv;
      el("line", { x1: xv, x2: xv, y1: T, y2: H - B }, gGrid);
      text(gAx, xv, H - B + 18 + stagger, p.name, { "text-anchor": "middle", class: "tick", fill: INK, "font-size": 12.5 });
      text(gAx, xv, H - B + 33 + stagger, fmt(p.alone[v]), { "text-anchor": "middle", class: "tick" });
    });
    yLab.textContent = v ? "Coupled with V-JEPA 2.1, randomized scenes (%)" : "Coupled with V-JEPA 2.1, clean scenes (%)";
    const lo = Math.max(xd[0], yd[0]), hi = Math.min(xd[1], yd[1]);
    diag.setAttribute("x1", x(lo)); diag.setAttribute("y1", y(lo)); diag.setAttribute("x2", x(hi)); diag.setAttribute("y2", y(hi));
    vline.setAttribute("y1", y(PRIMARY_ALONE[v])); vline.setAttribute("y2", y(PRIMARY_ALONE[v]));
    vlab.setAttribute("y", y(PRIMARY_ALONE[v]) - 7); vlab.textContent = `V-JEPA 2.1 alone, ${fmt(PRIMARY_ALONE[v])}%`;
    dots.forEach(({ g, p, c }) => {
      g.style.transform = `translate(${x(p.alone[v])}px, ${y(p[c.key][v])}px)`;
      g.onmouseenter = e => Tip.show(e, `<div class="t">${c.name}, V-JEPA 2.1 + ${p.name}</div><div class="m">${fmt(p[c.key][v])}% · ${p.name} alone ${fmt(p.alone[v])}%</div>`);
      g.onmousemove = e => Tip.move(e); g.onmouseleave = () => Tip.hide();
    });
    Object.keys(FAM).forEach(f => {
      const members = COUPLINGS.filter(c => c.family === f);
      const pts = sorted.map(p => [p, members.reduce((a, c) => a + p[c.key][v], 0) / members.length]);
      paths[f].setAttribute("d", pts.map(([p, m], i) => `${i ? "L" : "M"}${x(p.alone[v])},${y(m)}`).join(" "));
      means[f].forEach(({ g, p }) => {
        const m = members.reduce((a, c) => a + p[c.key][v], 0) / members.length;
        g.style.transform = `translate(${x(p.alone[v])}px, ${y(m)}px)`;
        g.onmouseenter = e => Tip.show(e, `<div class="t">${FAM[f].name}, mean of ${members.length}</div><div class="m">V-JEPA 2.1 + ${p.name}: ${fmt(m)}%</div>` +
          members.map(c => `<div class="m">${c.name}: ${fmt(p[c.key][v])}%</div>`).join(""));
        g.onmousemove = e => Tip.move(e); g.onmouseleave = () => Tip.hide();
      });
      const [lp, lm] = pts[pts.length - 1];
      ends[f].a.setAttribute("x", x(lp.alone[v]) + 14); ends[f].a.setAttribute("y", y(lm) + (f === "aligning" ? -2 : 4));
      ends[f].b.setAttribute("x", x(lp.alone[v]) + 14); ends[f].b.setAttribute("y", y(lm) + (f === "aligning" ? 13 : 19));
    });
  }
  update(1);
  legend("leg-pairs", [
    ["", FAM.aligning.color, "mean of the aligning couplings"], ["", FAM.input.color, "mean of the input couplings"],
    ["dash", "#7b45c2", "V-JEPA 2.1 alone"], ["dash", "#c3c8ce", "as good as the second space alone"],
  ]);
  return { update };
}

// §5 LIBERO-Plus: V-JEPA 2.1 aligned to Wan VAE
function chartAligned() {
  const order = CATEGORIES.map((c, i) => i);
  const W = 880, rowH = 34, T = 10, B = 44, L = 150, R = 30;
  const H = T + B + order.length * rowH;
  const svg = svgRoot(document.getElementById("fig-aligned"), W, H, "LIBERO-Plus success of V-JEPA 2.1 aligned to Wan VAE");
  const x = lin(0, 100, L, W - R);
  const gGrid = el("g", { class: "grid" }, svg), gAx = el("g", { class: "axis" }, svg);
  [0, 20, 40, 60, 80, 100].forEach(v => {
    el("line", { x1: x(v), x2: x(v), y1: T - 2, y2: H - B + 4 }, gGrid);
    text(gAx, x(v), H - B + 22, v, { "text-anchor": "middle" });
  });
  text(gAx, (L + W - R) / 2, H - 4, "LIBERO-Plus success (%)", { "text-anchor": "middle", class: "lbl" });
  order.forEach((i, j) => {
    const cy = T + j * rowH + rowH / 2 + 4, g = el("g", {}, svg);
    const w = PLUS_BY_CATEGORY.wan[i], v = PLUS_BY_CATEGORY.vjepa[i], f = PLUS_ALIGNED_TO_WAN.ff[i];
    text(g, L - 14, cy + 4, CATEGORIES[i], { "text-anchor": "end", "font-size": 13.5, fill: INK, "font-weight": 500 });
    el("line", { x1: x(Math.min(w, v)), x2: x(Math.max(f, w, v)), y1: cy, y2: cy, stroke: "#dfe2e6", "stroke-width": 2 }, g);
    el("rect", { x: x(w) - 6, y: cy - 6, width: 12, height: 12, rx: 2, fill: SPACE.wan.fill, stroke: SPACE.wan.color, "stroke-width": 1.5 }, g);
    el("circle", { cx: x(v), cy, r: 6.5, fill: SPACE.vjepa.fill, stroke: SPACE.vjepa.color, "stroke-width": 1.5 }, g);
    el("path", { d: `M${x(f)},${cy - 8} L${x(f) + 8},${cy} L${x(f)},${cy + 8} L${x(f) - 8},${cy} z`, fill: INK }, g);
    el("rect", { x: 8, y: cy - rowH / 2, width: W - 16, height: rowH, class: "hit" }, g);
    hover(g, `<div class="t">${CATEGORIES[i]}</div><div class="m">Wan VAE alone ${fmt(w)}% · V-JEPA 2.1 alone ${fmt(v)}%</div><div class="m">V-JEPA 2.1 aligned to Wan VAE by Feature Forcing: <b>${fmt(f)}%</b></div>`);
  });
  legend("leg-aligned", [["sq", SPACE.wan.fill, "Wan VAE alone"], ["", SPACE.vjepa.fill, "V-JEPA 2.1 alone"], ["sq", INK, "V-JEPA 2.1 aligned to Wan VAE (Feature Forcing)"]]);
}

// =====================================================================================================
// §6 pretraining data
function chartData() {
  const W = 880, H = 112, L = 0, R = 0, total = EMBODIMENTS.reduce((a, e) => a + e[1], 0);
  const svg = svgRoot(document.getElementById("fig-data"), W, H, "Pretraining hours by embodiment");
  const x = lin(0, total, L, W - R);
  const shade = i => { const t = i / (EMBODIMENTS.length - 1); const mix = (a, b) => Math.round(a + (b - a) * t); return `rgb(${mix(47, 196)},${mix(93, 210)},${mix(138, 226)})`; };
  let acc = 0;
  EMBODIMENTS.forEach(([name, h], i) => {
    const g = el("g", { style: "cursor:pointer" }, svg), x0 = x(acc), w = x(acc + h) - x0;
    el("rect", { x: x0 + 1, y: 10, width: Math.max(w - 2, 1), height: 36, rx: 3, fill: shade(i) }, g);
    if (w > name.length * 7 + 16) {  // the name fits inside its segment
      text(g, x0 + 8, 33, name, { "font-size": 12, fill: i < 5 ? "#fff" : INK, "font-weight": 500 });
    }
    hover(g, `<div class="t">${name}</div><div class="m">${Math.round(h).toLocaleString()} h · ${(100 * h / total).toFixed(0)}% of the data</div>`);
    acc += h;
  });
  text(svg, 0, 72, `${Math.round(total).toLocaleString()} hours of bimanual manipulation; 22,358 h on real robots (91%), 2,096 h in simulation (9%).`, { "font-size": 13, fill: MUTED });
  text(svg, 0, 94, "Hover a segment for its embodiment; RoboTwin 2.0, LIBERO, RoboCasa, and RoboDojo are not in the data.", { "font-size": 12, fill: FAINT });
}

// §6 benchmarks after pretraining
function chartSota() {
  const host = document.getElementById("fig-sota");
  const tg = document.getElementById("sota-toggle");
  tg.innerHTML = BENCHMARKS.map((b, i) => `<button data-v="${b.key}"${i ? "" : ' class="on"'}>${b.name.replace("RoboTwin 2.0, ", "RoboTwin, ")}</button>`).join("");
  function update(key) {
    const bm = BENCHMARKS.find(b => b.key === key);
    const rows = [
      ...OURS.map(o => ({ name: o.name, v: bm.ours[o.key], ours: o })),
      ...Object.entries(bm.published).map(([name, v]) => ({ name, v })),
    ].sort((a, b) => b.v - a.v);
    const W = 880, rowH = 26, T = 6, B = 40, L = 170, R = 56;
    const H = T + B + rows.length * rowH;
    const svg = svgRoot(host, W, H, bm.name);
    const max = key === "robodojo" ? 20 : 100, x = lin(0, max, L, W - R);
    const defs = el("defs", {}, svg);
    const pat = el("pattern", { id: "hatch", width: 6, height: 6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
    el("rect", { width: 6, height: 6, fill: "#7b45c2" }, pat);
    el("line", { x1: 0, y1: 0, x2: 0, y2: 6, stroke: "#f5a83d", "stroke-width": 2.4 }, pat);
    const gGrid = el("g", { class: "grid" }, svg), gAx = el("g", { class: "axis" }, svg);
    niceTicks(0, max, 5).forEach(v => {
      el("line", { x1: x(v), x2: x(v), y1: T, y2: H - B + 4 }, gGrid);
      text(gAx, x(v), H - B + 20, v, { "text-anchor": "middle" });
    });
    text(gAx, (L + W - R) / 2, H - 4, bm.unit, { "text-anchor": "middle", class: "lbl" });
    rows.forEach((r, i) => {
      const cy = T + i * rowH + rowH / 2, g = el("g", {}, svg);
      text(g, L - 10, cy + 4, r.name, { "text-anchor": "end", "font-size": 13, fill: r.ours ? INK : MUTED, "font-weight": r.ours ? 600 : 400 });
      const fill = r.ours ? (r.ours.hatch ? "url(#hatch)" : r.ours.color) : "#dfe5ef";
      const bar = el("rect", { x: L, y: cy - 8, width: Math.max(x(r.v) - L, 1), height: 16, rx: 3, fill, class: "growbar" }, g);
      bar.style.animationDelay = (i * 25) + "ms";
      text(g, x(r.v) + 6, cy + 4, fmt(r.v), { "font-size": 12, fill: r.ours ? INK : MUTED, "font-weight": r.ours ? 700 : 400 });
      el("rect", { x: 0, y: cy - rowH / 2, width: W, height: rowH, class: "hit" }, g);
      hover(g, `<div class="t">${r.name}</div><div class="m">${bm.name}: ${fmt(r.v)}${key === "robodojo" ? "" : "%"}${r.ours ? " · ours" : " · as published"}</div>`);
    });
  }
  update(BENCHMARKS[0].key);
  legend("leg-sota", [["sq", "#dfe5ef", "published policies"], ["sq", "#f5a83d", "Wan VAE"], ["sq", "#a48ce6", "V-JEPA 2.1"], ["sq", "#7b45c2", "V-JEPA 2.1 + Wan VAE (Feature Forcing)"]]);
  return { update };
}

// §6 real robot
function chartReal() {
  const models = [["wan", "Wan VAE", "#f5a83d"], ["vjepa", "V-JEPA 2.1", "#a48ce6"], ["ff", "V-JEPA 2.1 + Wan VAE", "#7b45c2"], ["pi05", "π0.5", "#c3cad5"]];
  const W = 880, H = 270, L = 48, R = 10, T = 16, B = 46;
  const svg = svgRoot(document.getElementById("fig-real"), W, H, "Real-robot success");
  const y = lin(0, 100, H - B, T), gw = (W - L - R) / REAL.length, bw = 30;
  const gGrid = el("g", { class: "grid" }, svg), gAx = el("g", { class: "axis" }, svg);
  [0, 25, 50, 75, 100].forEach(v => {
    el("line", { x1: L, x2: W - R, y1: y(v), y2: y(v) }, gGrid);
    text(gAx, L - 8, y(v) + 4, v, { "text-anchor": "end" });
  });
  text(gAx, 12, (T + H - B) / 2, "Success (%)", { "text-anchor": "middle", class: "lbl", transform: `rotate(-90 12 ${(T + H - B) / 2})` });
  REAL.forEach((c, i) => {
    const gx = L + gw * i + gw / 2;
    text(svg, gx, H - B + 22, c.name, { "text-anchor": "middle", "font-size": 13, fill: INK, "font-weight": 500 });
    models.forEach(([k, name, color], j) => {
      const s = c.values[k], v = 100 * s / c.trials, x0 = gx + (j - 2) * (bw + 6) + 3, g = el("g", {}, svg);
      el("rect", { x: x0, y: y(v), width: bw, height: y(0) - y(v), rx: 3, fill: color, class: "growbar v" }, g);
      text(g, x0 + bw / 2, y(v) - 6, `${s}/${c.trials}`, { "text-anchor": "middle", "font-size": 11.5, fill: k === "ff" ? INK : MUTED, "font-weight": k === "ff" ? 700 : 400 });
      hover(g, `<div class="t">${name}</div><div class="m">${c.name}: ${s} of ${c.trials} trials</div>`);
    });
  });
  legend("leg-real", models.map(([k, n, c]) => ["sq", c, n]));
}
