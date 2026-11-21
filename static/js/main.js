"use strict";

document.addEventListener("DOMContentLoaded", () => {
  drawModel();
  drawSpaces();
  drawCouplings();
  chartCats();
  chartAligned();
  chartData();
  chartReal();
  const charts = { measure: chartMeasure(), gap: chartGap(), pairs: chartPairs(), sota: chartSota() };

  // light / dark: the toggle stores the reader's choice; without one, the page follows the system's setting
  const root = document.documentElement;
  const stored = () => { try { return localStorage.getItem("theme"); } catch (e) { return null; } };
  document.querySelector(".theme-toggle").addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
    if (!stored()) root.setAttribute("data-theme", e.matches ? "dark" : "light");
  });

  // segmented toggles: <span class="toggle" data-for="name"><button data-v="...">
  document.querySelectorAll(".toggle").forEach(tg => {
    tg.addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      tg.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
      charts[tg.dataset.for].update(b.dataset.v);
    });
  });

  // reveal figures as they scroll into view
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(n => io.observe(n));

  // highlight the section in the contents
  const links = [...document.querySelectorAll(".toc a")];
  const targets = links.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  const spy = () => {
    const y = window.scrollY + window.innerHeight * 0.3;
    let cur = targets[0];
    targets.forEach(t => { if (t.offsetTop <= y) cur = t; });
    links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + cur.id));
  };
  window.addEventListener("scroll", spy, { passive: true });
  spy();
});
