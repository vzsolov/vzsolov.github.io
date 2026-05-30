# New2 Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current home page layout (hero + static map + year-by-year timeline) with the new2 collage design (interactive Leaflet map centred in a photo-tile mosaic with country filter chips), remove the Atlas/Journal/Editorial style switcher everywhere, and leave all 21 Hebrew journal pages and trip page journals untouched.

**Architecture:** Five sequential file replacements — home.css, home.js, index.html, trip.js, and a batch Python script that patches all 21 trip wrapper pages — each committed independently so rollback is granular. No build step; all files are static HTML/CSS/JS served by GitHub Pages.

**Tech Stack:** Vanilla HTML/CSS/JS · Leaflet 1.9.4 (CDN) · CARTO basemap tiles · Google Fonts (Spectral, Hanken Grotesk, Space Mono) · Python 3 (batch patch script only)

---

## Context for the implementer

This is a static GitHub Pages site at `/data/sync/vztravel/vzsolov.github.io/`. No npm, no build step. Start a local server to test: `./test.sh` (runs `python3 -m http.server 8791` from the repo root). Visit `http://localhost:8791/` to see the home page and `http://localhost:8791/greece24.html` for a trip page.

Key files:
- `assets/trips.js` — all trip data (`TRIPS`, `PLACES`, `STATS`, `BASE=""`)
- `assets/home.css` — palette tokens + layout (shared by index + trip pages)
- `assets/home.js` — home page logic
- `assets/trip.js` — trip page logic (journal load + lightbox)
- `assets/trip.css` — trip page styles (untouched)
- `assets/journal.css` — Hebrew RTL journal prose styles (untouched)
- `index.html` — home page shell
- `{trip}.html` — 21 trip wrapper pages (e.g. `greece24.html`)

The reference template is at `/data/sync/vztravel/new2/`. Screenshots are in `/data/sync/vztravel/new2/screenshots/`.

---

## Task 1: Replace assets/home.css

**Files:**
- Modify: `assets/home.css` (full replacement)

- [ ] **Step 1: Replace the file with the Atlas-only stylesheet from new2**

Write this exact content to `assets/home.css`:

```css
/* =========================================================================
   VZsolov Trip Repo — home stylesheet (Atlas edition)
   data-theme = light | dark
   Mobile-first; breakpoints at 600 / 760 / 1160.
   ========================================================================= */

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--ink);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  transition: background .4s ease, color .4s ease;
  overflow-x: hidden;
}
img { display: block; max-width: 100%; }
a { color: inherit; }

/* ---- shared design tokens ---- */
:root {
  --maxw: 1240px;
  --gut: clamp(18px, 5vw, 56px);
  --radius: 3px;
  --ease: cubic-bezier(.22,.61,.36,1);
  --shadow-card: 0 1px 2px rgba(0,0,0,.04), 0 12px 30px -18px rgba(0,0,0,.45);
}

/* ====================== PALETTE — ATLAS ====================== */
[data-dir="atlas"] {
  --font-display: "Spectral", Georgia, serif;
  --font-body: "Hanken Grotesk", system-ui, sans-serif;
  --font-accent: "Space Mono", monospace;
  --font-mono: "Space Mono", monospace;
}
[data-dir="atlas"][data-theme="light"] {
  --bg: #ece3d0; --surface: #f6f0e1; --surface-2: #e6dcc6;
  --ink: #292419; --muted: #6b6353; --faint: #8f8672;
  --line: rgba(41,36,25,.2); --line-soft: rgba(41,36,25,.1);
  --accent: #a8512a; --accent-ink:#8f4220; --olive: #5f6a3e; --sand: #b98f57;
}
[data-dir="atlas"][data-theme="dark"] {
  --bg: #181309; --surface: #211a0f; --surface-2: #2a2113;
  --ink: #ece1c9; --muted: #a89d83; --faint: #837a64;
  --line: rgba(236,225,201,.2); --line-soft: rgba(236,225,201,.1);
  --accent: #c96c3b; --accent-ink:#d67e4f; --olive: #94a064; --sand: #c39d63;
}

/* ====================== LAYOUT HELPERS ====================== */
.wrap { width: 100%; max-width: var(--maxw); margin-inline: auto; padding-inline: var(--gut); }
.eyebrow {
  font-family: var(--font-mono); font-size: 12px; letter-spacing: .22em;
  text-transform: uppercase; color: var(--accent-ink); margin: 0;
}

/* ====================== CONTROL BAR ====================== */
.cbar {
  position: sticky; top: 0; z-index: 60;
  display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  padding: 10px var(--gut);
  background: color-mix(in oklab, var(--bg) 86%, transparent);
  backdrop-filter: blur(14px) saturate(1.2);
  border-bottom: 1px solid var(--line-soft);
}
.cbar .brand {
  font-family: var(--font-display); font-weight: 600; font-size: 17px;
  letter-spacing: -.01em; margin-right: auto; white-space: nowrap;
}
.cbar .brand b { color: var(--accent-ink); font-weight: 600; }
.iconbtn {
  width: 38px; height: 38px; flex: none; display: grid; place-items: center;
  background: var(--surface-2); border: 1px solid var(--line-soft);
  border-radius: 50%; cursor: pointer; color: var(--ink); transition: all .25s var(--ease);
}
.iconbtn:hover { border-color: var(--accent); color: var(--accent-ink); }
.iconbtn svg { width: 17px; height: 17px; }
.cbar .seg-label { font-family: var(--font-mono); font-size: 10px; letter-spacing:.18em; text-transform:uppercase; color: var(--faint); }
@media (max-width: 760px) { .cbar .seg-label { display: none; } }
@media (max-width: 470px) {
  .cbar { gap: 8px; }
  .iconbtn { width: 34px; height: 34px; }
  .cbar .brand-rest { display: none; }
}

/* ====================== HERO ====================== */
.hero { position: relative; padding: clamp(56px, 11vw, 130px) 0 clamp(40px, 7vw, 76px); overflow: hidden; }
.hero::before {
  content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .6;
  background:
    radial-gradient(120% 80% at 50% -10%, color-mix(in oklab, var(--sand) 22%, transparent), transparent 60%),
    repeating-linear-gradient(115deg, transparent 0 22px, color-mix(in oklab, var(--ink) 3%, transparent) 22px 23px);
}
[data-theme="dark"] .hero::before { opacity: .4; }
.hero .wrap { position: relative; }
.hero-kicker { display: flex; align-items: center; gap: 12px; margin-bottom: 22px; }
.hero-kicker .rule { height: 1px; flex: 1; background: var(--line); max-width: 90px; }
.hero h1 {
  font-family: var(--font-display); font-weight: 500;
  font-size: clamp(2.7rem, 9vw, 6.4rem); line-height: .98; letter-spacing: -.02em;
  margin: 0 0 .35em; text-wrap: balance;
}
.hero h1 em { font-style: italic; color: var(--accent-ink); }
.hero .lede {
  font-size: clamp(1.05rem, 2.4vw, 1.4rem); color: var(--muted);
  max-width: 46ch; margin: 0; text-wrap: pretty;
}
.hero-meta {
  margin-top: 30px; display: flex; flex-wrap: wrap; gap: 10px 22px;
  font-family: var(--font-mono); font-size: 12px; letter-spacing: .14em;
  text-transform: uppercase; color: var(--faint);
}
.hero-meta span { display: inline-flex; align-items: center; gap: 8px; }
.hero-meta span::before { content: ""; width: 5px; height: 5px; background: var(--accent); border-radius: 50%; }

/* ====================== STATS BAND ====================== */
.stats {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px;
  background: var(--line-soft);
  border-block: 1px solid var(--line); margin-top: clamp(30px, 6vw, 60px);
}
.stat { background: var(--bg); padding: clamp(22px, 4vw, 40px) clamp(16px, 3vw, 28px); }
.stat .n { font-family: var(--font-display); font-size: clamp(2.4rem, 6vw, 3.8rem); line-height: 1; font-weight: 500; letter-spacing: -.02em; }
.stat .n small { font-size: .42em; color: var(--accent-ink); vertical-align: super; font-family: var(--font-mono); letter-spacing: 0; }
.stat .l { margin-top: 10px; font-family: var(--font-mono); font-size: 11.5px; letter-spacing: .18em; text-transform: uppercase; color: var(--muted); }
@media (min-width: 760px) { .stats { grid-template-columns: repeat(4, 1fr); } }

/* ====================== SECTION HEADS ====================== */
.section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin: clamp(54px,9vw,104px) 0 clamp(26px,4vw,40px); }
.section-head h2 { font-family: var(--font-display); font-weight: 500; font-size: clamp(1.9rem, 5vw, 3rem); line-height: 1.02; letter-spacing: -.02em; margin: .12em 0 0; }
.section-head h2 em { font-style: italic; color: var(--accent-ink); }
.section-head .note { font-family: var(--font-mono); font-size: 11.5px; letter-spacing: .15em; text-transform: uppercase; color: var(--faint); text-align: right; max-width: 16ch; }

.archive > .section-head { margin-top: clamp(34px, 6vw, 70px); margin-bottom: clamp(30px, 4.5vw, 50px); align-items: flex-start; }
.archive > .section-head > div { flex: 1 1 auto; min-width: 0; }
.archive > .section-head h2 { font-size: clamp(2.3rem, 6.4vw, 4.3rem); line-height: .98; letter-spacing: -.02em; }
.archive > .section-head .note { margin-top: .7em; }

/* ====================== COLLAGE: MAP + MOSAIC ====================== */
.archive { margin-top: clamp(18px, 3vw, 34px); }

/* filter bar */
.filterbar {
  position: sticky; top: 57px; z-index: 30;
  display: flex; align-items: center; gap: 14px;
  padding: 11px 0; margin-bottom: clamp(14px,2vw,22px);
  background: color-mix(in oklab, var(--bg) 90%, transparent);
  backdrop-filter: blur(10px) saturate(1.2);
  border-bottom: 1px solid var(--line-soft);
}
.filterbar .chips { display: flex; gap: 8px; overflow-x: auto; flex: 1; scrollbar-width: none; -webkit-overflow-scrolling: touch; padding: 1px 0; }
.filterbar .chips::-webkit-scrollbar { display: none; }
.chip {
  flex: none; font-family: var(--font-mono); font-size: 11px; letter-spacing: .1em; text-transform: uppercase;
  color: var(--muted); background: var(--surface-2); border: 1px solid var(--line-soft);
  border-radius: 100px; padding: 7px 13px; cursor: pointer; white-space: nowrap; transition: all .2s var(--ease);
}
.chip:hover { color: var(--accent-ink); border-color: var(--accent); }
.chip[aria-pressed="true"] { background: var(--accent); color: #fff; border-color: var(--accent); box-shadow: 0 2px 8px -3px var(--accent); }
.chip .ct { opacity: .55; margin-left: 6px; font-size: 9.5px; }
.filterbar .resultcount { flex: none; font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--faint); }
@media (max-width: 640px) { .filterbar .resultcount { display: none; } }

/* collage grid */
.collage {
  --cell: 43vw;
  display: grid; gap: clamp(8px, 1.1vw, 14px);
  grid-template-columns: repeat(2, 1fr); grid-auto-rows: var(--cell);
  grid-auto-flow: dense;
}
.collage .map { grid-column: 1 / 3; grid-row: 1 / 3; }
@media (min-width: 760px) {
  .collage { --cell: 25vw; grid-template-columns: repeat(4, 1fr); }
  .collage .map { grid-column: 2 / 4; grid-row: 2 / 4; }
}
@media (min-width: 1160px) {
  .collage { --cell: 196px; grid-template-columns: repeat(6, 1fr); }
  .collage .map { grid-column: 3 / 5; grid-row: 2 / 4; }
}

/* interactive map cell */
.map {
  position: relative; height: 100%; min-height: 0;
  border: 1px solid var(--line); border-radius: var(--radius);
  background: var(--surface-2); overflow: hidden; isolation: isolate;
}
.map .leaflet-container { width: 100%; height: 100%; background: var(--surface-2); font-family: var(--font-mono); }
.map .leaflet-tile-pane { filter: sepia(.5) saturate(1.2) brightness(1.02) hue-rotate(-8deg) contrast(.96); }
[data-theme="dark"] .map .leaflet-tile-pane { filter: sepia(.45) saturate(1.15) brightness(.88) hue-rotate(-6deg); }
.map .leaflet-control-attribution { background: color-mix(in oklab, var(--bg) 82%, transparent); color: var(--faint); font-size: 9px; }
.map .leaflet-control-attribution a { color: var(--muted); }
.map .leaflet-bar { border: 0; box-shadow: 0 2px 10px -4px rgba(0,0,0,.5); }
.map .leaflet-bar a { background: var(--surface); color: var(--ink); border-color: var(--line-soft); font-family: var(--font-mono); width: 28px; height: 28px; line-height: 28px; }
.map .leaflet-bar a:hover { background: var(--surface-2); color: var(--accent-ink); }

/* custom markers */
.map-pin { display: grid; place-items: center; width: 22px; height: 22px; }
.map-pin .dot {
  position: relative; width: 14px; height: 14px; border-radius: 50%; background: var(--accent);
  border: 2.5px solid var(--surface); box-shadow: 0 2px 7px rgba(0,0,0,.4), 0 0 0 1px var(--accent);
  transition: transform .2s var(--ease);
}
.map-pin.big .dot { width: 19px; height: 19px; background: var(--accent-ink); box-shadow: 0 2px 9px rgba(0,0,0,.45), 0 0 0 1px var(--accent-ink); }
.map-pin .dot::after { content: ""; position: absolute; inset: -6px; border-radius: 50%; border: 1px solid var(--accent); opacity: .4; animation: ping 3s var(--ease) infinite; }
.map-pin:hover .dot { transform: scale(1.18); }
@keyframes ping { 0%{transform:scale(.6);opacity:.5} 80%,100%{transform:scale(1.9);opacity:0} }

.map .leaflet-tooltip.atlas-tip {
  background: var(--ink); color: var(--bg); border: 0; box-shadow: 0 4px 14px -6px rgba(0,0,0,.6);
  font-family: var(--font-mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase;
  padding: 4px 9px; border-radius: 3px;
}
.map .leaflet-tooltip.atlas-tip::before { display: none; }

.compass { position: absolute; top: 12px; right: 14px; width: 42px; height: 42px; opacity: .85; z-index: 1200; color: var(--ink); pointer-events: none; filter: drop-shadow(0 1px 3px rgba(0,0,0,.35)); }
.coordreadout {
  position: absolute; left: 12px; bottom: 11px; z-index: 1200; pointer-events: none;
  font-family: var(--font-mono); font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink);
  background: color-mix(in oklab, var(--bg) 80%, transparent); padding: 5px 9px; border-radius: 3px; border: 1px solid var(--line-soft);
}
@media (max-width: 600px) { .compass { display: none; } }

/* trip tiles */
.tile { position: relative; overflow: hidden; border-radius: var(--radius); border: 1px solid var(--line); background: var(--surface-2); }
.tile .ph { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .8s var(--ease); }
.tile.noimg { background: repeating-linear-gradient(135deg, var(--surface) 0 9px, var(--surface-2) 9px 18px); }
.tile.noimg .ph { display: none; }
.tile .scrim { position: absolute; inset: 0; z-index: 1; background: linear-gradient(to top, rgba(0,0,0,.66) 0%, rgba(0,0,0,.16) 42%, rgba(0,0,0,0) 66%); transition: opacity .4s; }
.tile a.cover { position: absolute; inset: 0; z-index: 2; }
.tile:hover .ph { transform: scale(1.07); }

.tile .meta { position: absolute; left: 0; right: 0; bottom: 0; z-index: 3; padding: clamp(9px,1.1vw,14px); pointer-events: none; color: #fff; }
.tile .meta .region { font-family: var(--font-mono); font-size: 9px; letter-spacing: .16em; text-transform: uppercase; color: color-mix(in oklab, var(--sand) 70%, #fff); }
.tile .meta h3 { font-family: var(--font-display); font-weight: 600; font-size: 1.02rem; line-height: 1.04; letter-spacing: -.01em; margin: 2px 0 0; text-shadow: 0 1px 12px rgba(0,0,0,.5); }
.tile .meta .yr { display: block; margin-top: 3px; font-family: var(--font-mono); font-size: 9.5px; letter-spacing: .12em; color: rgba(255,255,255,.72); }

.tile .tlinks { position: absolute; top: 0; left: 0; right: 0; z-index: 4; display: flex; gap: 6px; flex-wrap: wrap; padding: clamp(8px,1vw,12px); opacity: 0; transform: translateY(-4px); transition: opacity .3s var(--ease), transform .3s var(--ease); }
.tile:hover .tlinks, .tile:focus-within .tlinks { opacity: 1; transform: none; }
.tile .tlinks a {
  font-family: var(--font-mono); font-size: 9px; letter-spacing: .1em; text-transform: uppercase; text-decoration: none;
  color: #fff; background: color-mix(in oklab, var(--ink) 50%, transparent); backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,.3); border-radius: 100px; padding: 5px 10px; transition: all .2s var(--ease);
}
.tile .tlinks a:hover { background: var(--accent); border-color: var(--accent); }
.tile.hide { display: none; }

.noresults { font-family: var(--font-mono); font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--faint); padding: 44px 0; text-align: center; }
@media (prefers-reduced-motion: reduce) { .tile .tlinks { opacity: 1; transform: none; } .map-pin .dot::after { animation: none; } }

/* ====================== FOOTER ====================== */
.foot { margin-top: clamp(60px, 10vw, 120px); border-top: 1px solid var(--line); padding: clamp(40px,7vw,72px) 0; }
.foot .wrap { display: grid; gap: 30px; }
.foot h2 { font-family: var(--font-display); font-weight: 500; font-size: clamp(1.8rem,5vw,2.8rem); line-height: 1.05; margin: 0; letter-spacing: -.02em; max-width: 18ch; }
.foot h2 em { font-style: italic; color: var(--accent-ink); }
.foot .links { display: flex; flex-wrap: wrap; gap: 12px; }
.foot .links a { font-family: var(--font-mono); font-size: 11px; letter-spacing: .14em; text-transform: uppercase; text-decoration: none; border: 1px solid var(--line); border-radius: 100px; padding: 9px 16px; transition: all .25s var(--ease); }
.foot .links a:hover { border-color: var(--accent); color: var(--accent-ink); }
.foot .fine { font-family: var(--font-mono); font-size: 11px; letter-spacing: .1em; color: var(--faint); }
@media (min-width: 760px) { .foot .wrap { grid-template-columns: 1fr auto; align-items: center; } }

/* reveal on scroll */
.reveal { opacity: 0; transform: translateY(22px); transition: opacity .7s var(--ease), transform .7s var(--ease); }
.reveal.in { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) { .reveal { opacity: 1; transform: none; } }
```

- [ ] **Step 2: Start the server and verify the CSS loads without errors**

```bash
./test.sh &
```

Visit `http://localhost:8791/index.html`. The page will look broken (old HTML + new CSS) — that's expected. Open browser DevTools → Console, verify no 404 for `home.css`. Kill the server with `kill %1`.

---

## Task 2: Replace assets/home.js

**Files:**
- Modify: `assets/home.js` (full replacement)

- [ ] **Step 1: Write the new home.js**

Write this exact content to `assets/home.js`:

```js
/* =========================================================================
   VZsolov Trip Repo — home page logic (Atlas + Leaflet collage edition)
   ========================================================================= */
(function () {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const el = (t, cls, html) => { const e = document.createElement(t); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  /* ---- persisted theme ---- */
  const store = {
    get theme() { return localStorage.getItem("vz-theme") || "light"; },
    set theme(v) { localStorage.setItem("vz-theme", v); },
  };
  function applyTheme(v) { root.setAttribute("data-theme", v); store.theme = v; if (window.__vzSwapTiles) window.__vzSwapTiles(v); }
  root.setAttribute("data-dir", "atlas");
  applyTheme(store.theme);

  /* ---- stats band ---- */
  const statEls = [
    { n: STATS.trips, l: "Journeys logged" },
    { n: STATS.countries, l: "Countries" },
    { n: (STATS.yearsTo - STATS.yearsFrom + 1), l: `Years · ${STATS.yearsFrom}–${STATS.yearsTo}` },
    { n: STATS.continents, l: "Continents" },
  ];
  const statsWrap = $("#stats");
  if (statsWrap) statEls.forEach(s => {
    const d = el("div", "stat");
    d.innerHTML = `<div class="n">${s.n}</div><div class="l">${s.l}</div>`;
    statsWrap.appendChild(d);
  });

  /* ---- per-country trip counts ---- */
  const counts = {};
  TRIPS.forEach(t => counts[t.country] = (counts[t.country] || 0) + 1);

  /* ---- collage tiles ---- */
  const collage = $("#collage");
  const tiles = [];
  if (collage) TRIPS.forEach(t => {
    const tile = el("article", "tile");
    tile.dataset.country = t.country;
    const films = t.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join("");
    tile.innerHTML = `
      <img class="ph" loading="lazy" src="${BASE + t.img}" alt="${t.title} ${t.year}"
           onerror="this.closest('.tile').classList.add('noimg')" />
      <div class="scrim"></div>
      <a class="cover" href="${t.page}" aria-label="${t.title} ${t.year}"></a>
      <div class="tlinks">
        <a href="${t.page}">Journal</a>
        ${films}
      </div>
      <div class="meta">
        <span class="region">${t.region}</span>
        <h3>${t.title}</h3>
        <span class="yr">${t.year}</span>
      </div>`;
    collage.appendChild(tile);
    tiles.push(tile);
  });

  /* ---- filter chips ---- */
  const filtersWrap = $("#filters");
  const resultCount = $("#resultcount");
  const noResults = $("#noresults");
  const places = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
  let active = "all";

  function makeChip(key, label, count) {
    const c = el("button", "chip");
    c.dataset.key = key;
    c.setAttribute("aria-pressed", key === active);
    c.innerHTML = count != null ? `${label}<span class="ct">${count}</span>` : label;
    c.addEventListener("click", () => setFilter(key));
    return c;
  }
  if (filtersWrap) {
    filtersWrap.appendChild(makeChip("all", "All trips", TRIPS.length));
    places.forEach(p => filtersWrap.appendChild(makeChip(p, p, counts[p])));
  }

  function setFilter(key) {
    active = key;
    let shown = 0;
    tiles.forEach(tile => {
      const match = key === "all" || tile.dataset.country === key;
      tile.classList.toggle("hide", !match);
      if (match) shown++;
    });
    document.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", c.dataset.key === key));
    if (resultCount) resultCount.textContent = key === "all" ? `${TRIPS.length} journeys` : `${shown} in ${key}`;
    if (noResults) noResults.hidden = shown > 0;
    if (window.__vzHighlight) window.__vzHighlight(key);
  }

  function scrollToCollage() {
    const sec = $(".archive");
    if (!sec) return;
    const y = sec.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  /* ---- Leaflet interactive map ---- */
  const mapEl = $("#map");
  if (mapEl && window.L) {
    const TILES = {
      light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      dark:  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    };
    const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

    const map = L.map(mapEl, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
      worldCopyJump: true,
    });

    let tileLayer = L.tileLayer(TILES[store.theme] || TILES.light, {
      attribution: ATTR, maxZoom: 11, minZoom: 2, subdomains: "abcd",
    }).addTo(map);
    window.__vzSwapTiles = (theme) => { if (tileLayer) tileLayer.setUrl(TILES[theme] || TILES.light); };

    const markers = {};
    const bounds = [];
    PLACES.forEach(p => {
      if (counts[p.country] == null) return;
      const big = counts[p.country] > 1;
      const icon = L.divIcon({
        className: "",
        html: `<div class="map-pin ${big ? "big" : ""}"><span class="dot"></span></div>`,
        iconSize: [22, 22], iconAnchor: [11, 11],
      });
      const m = L.marker([p.lat, p.lon], { icon, riseOnHover: true }).addTo(map);
      const n = counts[p.country];
      m.bindTooltip(`${p.country} · ${n} trip${n > 1 ? "s" : ""}`, {
        className: "atlas-tip", direction: "top", offset: [0, -10], opacity: 1,
      });
      m.on("click", () => { setFilter(p.country); scrollToCollage(); });
      markers[p.country] = m;
      bounds.push([p.lat, p.lon]);
    });

    if (bounds.length) map.fitBounds(bounds, { padding: [38, 38] });
    else map.setView([48, 14], 4);

    map.on("click", () => map.scrollWheelZoom.enable());
    map.on("mouseout", () => map.scrollWheelZoom.disable());

    const coord = $("#coordreadout");
    const fmt = (v, pos, neg) => `${Math.abs(v).toFixed(1)}°${v >= 0 ? pos : neg}`;
    function showCenter() { const c = map.getCenter(); if (coord) coord.textContent = `${fmt(c.lat, "N", "S")} · ${fmt(c.lng, "E", "W")}`; }
    map.on("mousemove", e => { if (coord) coord.textContent = `${fmt(e.latlng.lat, "N", "S")} · ${fmt(e.latlng.lng, "E", "W")}`; });
    map.on("mouseout", showCenter);
    map.on("moveend", showCenter);
    showCenter();

    window.__vzHighlight = (key) => {
      Object.entries(markers).forEach(([country, m]) => {
        const node = m.getElement();
        if (!node) return;
        node.style.transition = "opacity .25s";
        node.style.opacity = (key === "all" || key === country) ? "1" : ".28";
      });
    };

    const fix = () => map.invalidateSize();
    setTimeout(fix, 60); setTimeout(fix, 350);
    window.addEventListener("resize", fix);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fix);
  }

  /* ---- pre-filter from ?place=Greece (e.g. back-link from trip page) ---- */
  const wanted = new URLSearchParams(location.search).get("place");
  if (wanted && places.includes(wanted)) setFilter(wanted);
  else setFilter("all");

  /* ---- theme toggle ---- */
  const tBtn = $("#themeBtn");
  if (tBtn) tBtn.addEventListener("click", () => applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"));

  /* ---- reveal on scroll ---- */
  const io = new IntersectionObserver((ents) => {
    ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach(n => io.observe(n));
})();
```

- [ ] **Step 2: Verify JS has no syntax errors**

```bash
node --check assets/home.js
```

Expected: no output (exit 0).

---

## Task 3: Rewrite index.html

**Files:**
- Modify: `index.html` (full replacement)

- [ ] **Step 1: Write the new index.html**

Write this exact content to `index.html`:

```html
<!DOCTYPE html>
<html lang="en" data-dir="atlas" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>VZsolov Trip Repo</title>
  <meta name="description" content="A travel photo-journal — trips logged across Europe and beyond, 2012 to today." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;1,500&family=Hanken+Grotesk:wght@400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
  <link href="assets/home.css" rel="stylesheet" />
</head>
<body>

  <!-- ============ CONTROL BAR ============ -->
  <div class="cbar">
    <div class="brand">VZsolov <b class="brand-rest">Trip Repo</b></div>
    <span class="seg-label">An atlas of every journey</span>
    <button class="iconbtn" id="themeBtn" title="Toggle light / dark" aria-label="Toggle light or dark theme">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4.2"></circle>
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"></path>
      </svg>
    </button>
  </div>

  <!-- ============ HERO ============ -->
  <header class="hero">
    <div class="wrap">
      <div class="hero-kicker">
        <p class="eyebrow">A travel photo-journal</p>
        <span class="rule"></span>
      </div>
      <h1>Roads taken,<br /><em>kept in pictures.</em></h1>
      <p class="lede">Every trip we've made — fjords and deserts, alpine passes and island light — gathered year by year, with films and full photo journals for each.</p>
      <div class="hero-meta">
        <span>Europe &amp; beyond</span>
        <span>2012 — present</span>
        <span>Stills &amp; films</span>
      </div>
      <div class="stats" id="stats"></div>
    </div>
  </header>

  <main class="wrap">

    <!-- ============ COLLAGE: MAP IN THE CENTRE, TRIPS AROUND IT ============ -->
    <section class="archive">
      <div class="section-head">
        <div>
          <p class="eyebrow">The whole atlas</p>
          <h2>Every trip, <em>around the map.</em></h2>
        </div>
        <p class="note">Tap a marker or a place to filter the mosaic</p>
      </div>

      <div class="filterbar">
        <div class="chips" id="filters"></div>
        <span class="resultcount" id="resultcount"></span>
      </div>

      <div class="collage" id="collage">
        <div class="map" id="map">
          <svg class="compass" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.3">
            <circle cx="24" cy="24" r="21"></circle>
            <path d="M24 6 L28 24 L24 42 L20 24 Z" fill="currentColor" stroke="none" opacity=".5"></path>
            <path d="M6 24 L24 20 L42 24 L24 28 Z" fill="currentColor" stroke="none" opacity=".25"></path>
            <text x="24" y="13" text-anchor="middle" font-size="7" fill="currentColor" stroke="none" font-family="monospace">N</text>
          </svg>
          <div class="coordreadout" id="coordreadout">—° · —°</div>
        </div>
        <!-- trip tiles injected by home.js -->
      </div>
      <p class="noresults" id="noresults" hidden>No trips logged here yet.</p>
    </section>

  </main>

  <!-- ============ FOOTER ============ -->
  <footer class="foot">
    <div class="wrap">
      <h2>Got a place we <em>should</em> see next?</h2>
      <div class="links">
        <a href="about.html">About</a>
        <a href="contact.html">Contact</a>
        <a href="https://vimeo.com/vzsolov" target="_blank" rel="noopener">Vimeo</a>
        <a href="https://github.com/vzsolov/vzsolov.github.io" target="_blank" rel="noopener">Source</a>
      </div>
    </div>
    <div class="wrap" style="margin-top:26px;">
      <p class="fine">© <span id="yr"></span> VZsolov Trip Repo · redesigned travel archive</p>
    </div>
  </footer>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <script src="assets/trips.js"></script>
  <script src="assets/home.js"></script>
  <script>document.getElementById("yr").textContent = new Date().getFullYear();</script>

</body>
</html>
```

- [ ] **Step 2: Start the server and verify the home page**

```bash
./test.sh &
```

Visit `http://localhost:8791/`. Verify:
- Hero shows "Roads taken, *kept in pictures.*" with lede and meta tags
- Stats band shows 4 numbers (21 / 14 / 13 / 2)
- Collage grid renders below with photo tiles
- Leaflet map loads in the centre of the collage (may take a second)
- Compass SVG appears top-right of the map cell
- Coord readout shows at bottom-left of map
- Filter chips row is visible and sticky on scroll ("All trips" + one chip per country)
- Theme toggle button works (light ↔ dark)
- Kill the server: `kill %1`

---

## Task 4: Update assets/trip.js

Remove the `applyDir` function and `data-dir-btn` event listeners. Everything else stays identical.

**Files:**
- Modify: `assets/trip.js` (targeted edit — replace lines 13–23)

- [ ] **Step 1: Write the updated trip.js**

Write this exact content to `assets/trip.js`:

```js
/* =========================================================================
   Trip detail / journal logic
   URL: czechia24.html  (window.TRIP_ID = "czechia24" set before this script)
   ========================================================================= */
const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
const GRID = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>';

(function () {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);

  /* ---- persisted theme ---- */
  const store = {
    get theme() { return localStorage.getItem("vz-theme") || "light"; },
    set theme(v) { localStorage.setItem("vz-theme", v); },
  };
  const applyTheme = v => { root.setAttribute("data-theme", v); store.theme = v; };
  applyTheme(store.theme);
  const tBtn = $("#themeBtn");
  if (tBtn) tBtn.addEventListener("click", () => applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"));

  /* ---- resolve trip ---- */
  const slug = (window.TRIP_ID || new URLSearchParams(location.search).get("id") || "").replace(/\.html$/, "");
  const idx = Math.max(0, TRIPS.findIndex(t => t.page.replace(/\.html$/, "") === slug));
  const trip = TRIPS[idx];
  const place = PLACES.find(p => p.country === trip.country);
  document.title = `${trip.title} ${trip.year} · VZsolov Trip Repo`;

  const coord = place
    ? `${Math.abs(place.lat).toFixed(1)}°${place.lat >= 0 ? "N" : "S"}, ${Math.abs(place.lon).toFixed(1)}°${place.lon >= 0 ? "E" : "W"}`
    : "";

  /* ---- hero ---- */
  $("#crumb").innerHTML = `<a href="index.html">Archive</a><span class="sep">/</span><a href="index.html#y${trip.year}">${trip.year}</a><span class="sep">/</span><b>${trip.title}</b>`;
  $("#yearbig").textContent = trip.year;
  $("#title").textContent = trip.title;
  const subBits = [trip.country, trip.region, coord].filter(Boolean).map(s => `<span>${s}</span>`).join("");
  $("#sub").innerHTML = subBits;

  const filmBtns = trip.links.map(l =>
    `<a class="btn primary" href="${l.url}" target="_blank" rel="noopener">${PLAY} Watch ${l.label}</a>`).join("");
  $("#actions").innerHTML = filmBtns +
    `<a class="btn" href="index.html">${GRID} All trips</a>`;

  /* ---- shots: shared between loadJournal and lightbox ---- */
  const shots = [];

  /* ---- load journal ---- */
  (async function loadJournal() {
    const jEl = $("#journal");
    const loadEl = $("#jloading");
    if (!trip.journal || !jEl) return;
    try {
      const res = await fetch(trip.journal);
      if (!res.ok) throw new Error(res.status);
      const raw = await res.text();
      const doc = new DOMParser().parseFromString(raw, "text/html");
      const base = trip.journal.replace(/[^/]+$/, "");
      doc.querySelectorAll("img").forEach(img => {
        const src = img.getAttribute("src") || "";
        if (src && !src.startsWith("http") && !src.startsWith("/")) {
          img.setAttribute("src", base + src);
        }
      });
      const wrapper = document.createElement("div");
      wrapper.className = "journal-prose";
      wrapper.innerHTML = doc.body.innerHTML;
      if (loadEl) loadEl.remove();
      jEl.appendChild(wrapper);
      const imgs = [...wrapper.querySelectorAll("img")];
      shots.length = 0;
      imgs.forEach(img => shots.push(img.src));
      imgs.forEach((img, i) => img.addEventListener("click", () => openLB(i)));
    } catch (e) {
      if (loadEl) loadEl.textContent = "Journal unavailable.";
    }
  })();

  /* ---- prev / next trip ---- */
  const later = TRIPS[idx - 1];
  const earlier = TRIPS[idx + 1];
  const navHTML = (t, dir, cls) => t
    ? `<a class="${cls}" href="${t.page}"><span class="dir">${dir}</span><span class="ttl">${t.title}&nbsp;'${String(t.year).slice(2)}</span></a>`
    : `<span class="${cls} disabled"><span class="dir">${dir}</span><span class="ttl">—</span></span>`;
  $("#tnav").innerHTML = navHTML(earlier, "← Earlier trip", "prev") + navHTML(later, "Later trip →", "next");

  /* ====================== LIGHTBOX ====================== */
  const lb = $("#lbox"), lbImg = $("#lbImg"), lbCount = $("#lbCount");
  let cur = 0;
  function openLB(i) { cur = i; render(); lb.classList.add("open"); document.body.style.overflow = "hidden"; }
  function closeLB() { lb.classList.remove("open"); document.body.style.overflow = ""; }
  function step(d) { cur = (cur + d + shots.length) % shots.length; render(); }
  function render() { lbImg.src = shots[cur]; lbCount.textContent = `${String(cur + 1).padStart(2, "0")} / ${String(shots.length).padStart(2, "0")}`; }
  $("#lbClose").addEventListener("click", closeLB);
  $("#lbPrev").addEventListener("click", e => { e.stopPropagation(); step(-1); });
  $("#lbNext").addEventListener("click", e => { e.stopPropagation(); step(1); });
  lb.addEventListener("click", e => { if (e.target === lb) closeLB(); });
  document.addEventListener("keydown", e => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLB();
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
  });
})();
```

- [ ] **Step 2: Verify JS has no syntax errors**

```bash
node --check assets/trip.js
```

Expected: no output (exit 0).

---

## Task 5: Update cbar on all 21 trip wrapper pages

Remove the `<span class="seg-label">Style</span>` + `<div class="seg">` block and insert the Atlas label in its place. Run a Python script from the repo root.

**Files:**
- Modify: `czechia24.html`, `cyprus24.html`, `greece24.html`, `holland23.html`, `corfu23.html`, `romania23.html`, `austira22.html`, `iceland22.html`, `greece20.html`, `france19.html`, `greece19.html`, `austira18.html`, `montenegro18.html`, `greece17.html`, `lapland17.html`, `thailand16.html`, `georgia15.html`, `iceland14.html`, `norway13.html`, `ireland12.html`, `praga12.html`

- [ ] **Step 1: Run the batch patch script**

Run from the repo root (`/data/sync/vztravel/vzsolov.github.io/`):

```bash
python3 - <<'PYEOF'
import re
from pathlib import Path

PAGES = [
    "czechia24.html", "cyprus24.html", "greece24.html",
    "holland23.html", "corfu23.html", "romania23.html",
    "austira22.html", "iceland22.html",
    "greece20.html",
    "france19.html", "greece19.html",
    "austira18.html", "montenegro18.html",
    "greece17.html", "lapland17.html",
    "thailand16.html",
    "georgia15.html",
    "iceland14.html",
    "norway13.html",
    "ireland12.html", "praga12.html",
]

SEG_PATTERN = re.compile(
    r'\s*<span class="seg-label">Style</span>\s*'
    r'<div class="seg"[^>]*>.*?</div>',
    re.DOTALL,
)
NEW_LABEL = '\n    <span class="seg-label" style="margin-left:auto;">VZsolov Trip Repo · Atlas</span>'
THEME_BTN = '<button class="iconbtn" id="themeBtn"'

for page in PAGES:
    p = Path(page)
    if not p.exists():
        print(f"  not found: {page}")
        continue
    content = p.read_text(encoding="utf-8")
    updated = SEG_PATTERN.sub("", content)
    updated = updated.replace(THEME_BTN, NEW_LABEL + "\n    " + THEME_BTN, 1)
    if updated != content:
        p.write_text(updated, encoding="utf-8")
        print(f"  updated: {page}")
    else:
        print(f"  no change: {page}")
PYEOF
```

Expected output: 21 lines, each reading `  updated: <page>.html`.

- [ ] **Step 2: Spot-check one file to confirm the edit**

```bash
grep -n "seg-label\|seg\b\|data-dir-btn" greece24.html
```

Expected output (exactly 1 line — the new label, no seg div):

```
    <span class="seg-label" style="margin-left:auto;">VZsolov Trip Repo · Atlas</span>
```

- [ ] **Step 3: Confirm no trip page still contains the seg div**

```bash
grep -l 'data-dir-btn' *.html
```

Expected: no output (all removed).

---

## Task 6: End-to-end verification

- [ ] **Step 1: Start the local server**

```bash
./test.sh
```

- [ ] **Step 2: Verify home page**

Visit `http://localhost:8791/`:
- Hero renders: large serif heading, lede text, meta tags, stats band (4 boxes)
- Archive section below: "The whole atlas" eyebrow + "Every trip, around the map." heading
- Filter chip row: "All trips 21" chip active (orange), country chips alongside
- Collage grid: photo tiles fill the grid; Leaflet map occupies the centre cell
- Map shows dot markers for 14 countries; hovering a marker shows tooltip ("Greece · 5 trips")
- Clicking a map marker filters the tiles and scrolls to the collage
- Clicking a filter chip filters tiles and dims non-matching map markers
- Theme toggle (sun icon): switches between warm paper (light) and dark backgrounds; map basemap swaps
- Clicking any tile or "Journal" link navigates to the trip page

- [ ] **Step 3: Verify a trip page (journal embed)**

Visit `http://localhost:8791/greece24.html`:
- Cbar: backlink "The Archive" on left, "VZsolov Trip Repo · Atlas" label centred-right, theme toggle on right
- No Atlas/Journal/Editorial buttons anywhere
- Trip hero: year, title, breadcrumb, country/region/coord, film button(s), "All trips" button
- Journal section: Hebrew RTL text loads and flows right-to-left
- Photos in journal: clickable, open lightbox
- Lightbox: ←/→ navigation, Escape to close
- Prev/next trip navigation at bottom

- [ ] **Step 4: Verify dark mode persists across navigation**

Toggle to dark on the home page → navigate to `greece24.html` → confirm dark mode is still active (localStorage persisted). Toggle back to light on the trip page → navigate home → confirm light mode.

- [ ] **Step 5: Verify a second trip page**

Visit `http://localhost:8791/iceland22.html`:
- Cbar has no style switcher
- Journal loads in Hebrew RTL
- Prev/next links work

- [ ] **Step 6: Stop the server**

```bash
# Ctrl+C in the terminal running test.sh
```
