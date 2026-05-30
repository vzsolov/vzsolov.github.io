# New2 Homepage Redesign — Design Spec

## Goal

Adopt the new2 collage layout (map in the centre of a photo-tile mosaic, country filter chips) as the home page, remove the Atlas/Journal/Editorial style switcher everywhere, and keep all 21 converted Hebrew photo-journal trip pages exactly as-is.

## Architecture

Replace `index.html`, `assets/home.css`, and `assets/home.js` wholesale with the new2 template versions adapted for our URL scheme (`t.page` instead of `Trip.html?id=slug`). Update all 21 trip wrapper pages and `assets/trip.js` to drop the style-switcher UI and logic. Everything else (trip.css, journal.css, trips.js, journal HTML files, convert_journal.py, test.sh) is untouched.

## Tech Stack

- Vanilla HTML/CSS/JS — no build step, no frameworks
- Leaflet 1.9.4 (CDN, same SRI hash as new2) for the interactive map
- CARTO light/dark basemap tiles
- Google Fonts: Spectral (display), Hanken Grotesk (body), Space Mono (mono/labels) — 3 fonts down from 7
- CSS custom properties for design tokens (`--bg`, `--ink`, `--accent`, etc.)
- `data-dir="atlas"` hardcoded on `<html>` everywhere — no runtime dir switching

---

## Section 1 — Architecture & Files

### Files replaced / rewritten

| File | Change |
|---|---|
| `index.html` | Replace with new2 Home.html structure (collage layout, Leaflet CDN, trimmed font stack) |
| `assets/home.css` | Replace with new2 version (Atlas-only palette, collage/tile/filterbar/Leaflet styles; drops journal/editorial blocks and static map/timeline layout CSS) |
| `assets/home.js` | Replace with new2 version (Leaflet init, collage tile rendering, filter chips); tiles link to `t.page` directly |
| All 21 trip wrapper pages | Cbar: remove seg-group + "Style" label; add `<span class="seg-label" style="margin-left:auto;">VZsolov Trip Repo · Atlas</span>` |
| `assets/trip.js` | Remove `applyDir()` and dir-button listeners; keep `applyTheme()` and theme toggle |

### Files unchanged

- `assets/trips.js` — data layer
- `assets/trip.css` — trip hero, gallery, lightbox, prev/next
- `assets/journal.css` — prose RTL Hebrew styles
- All 21 journal HTML files (Hebrew RTL) — untouched
- `tools/convert_journal.py`
- `test.sh`

---

## Section 2 — Home Page

### `index.html` structure

The page combines:
1. **new2 cbar** (no style switcher)
2. **Current hero + stats** (kept — the CSS already exists in new2/home.css; the heading/lede/meta/stats band are retained from the current index.html since they make the page more complete and are visually consistent with new2's screenshots)
3. **new2 archive section** (replaces the old custom map + year-by-year timeline)

> Note: new2/Home.html itself only contains the archive section (no hero), but new2/home.css defines all hero and stats styles. The screenshots in new2/screenshots/ show the full combined layout. We adopt the combined form.

```
<html lang="en" data-dir="atlas" data-theme="light">
  <head>
    3-font Google Fonts stack (Spectral, Hanken Grotesk, Space Mono)
    Leaflet 1.9.4 CSS (CDN, SRI hash)
    assets/home.css
  </head>
  <body>
    <div class="cbar">
      brand "VZsolov Trip Repo" (left)
      span.seg-label "An atlas of every journey" (right, before theme btn)
      #themeBtn (right)
    </div>

    <header class="hero">          <!-- kept from current index.html -->
      <div class="wrap">
        <div class="hero-kicker">eyebrow "A travel photo-journal" + rule</div>
        <h1>Roads taken, <em>kept in pictures.</em></h1>
        <p class="lede">Every trip we've made — ...</p>
        <div class="hero-meta">Europe & beyond · 2012 — present · Stills & films</div>
        <div class="stats" id="stats"></div>   <!-- rendered by home.js -->
      </div>
    </header>

    <main class="wrap">
      <section class="archive">
        <div class="section-head">  <!-- "The whole atlas" eyebrow + h2 + note -->
        <div class="filterbar">    <!-- sticky, country chips + result count -->
        <div class="collage" id="collage">
          <div class="map" id="map">  <!-- Leaflet fills this cell -->
            compass SVG
            coordreadout
          </div>
          <!-- trip tiles injected by home.js -->
        </div>
        <p class="noresults" hidden>
      </section>
    </main>

    <footer class="foot"> ... </footer>

    Leaflet 1.9.4 JS (CDN, SRI hash)
    assets/trips.js
    assets/home.js
    <script>document.getElementById("yr").textContent = ...</script>
  </body>
```

### Collage grid layout

- Mobile (default): 2-col, map spans col 1/3 row 1/3 (full-width top)
- 760px+: 4-col, map at col 2/4 row 2/4 (centre)
- 1160px+: 6-col, map at col 3/5 row 2/4 (centre)
- `grid-auto-flow: dense` fills gaps around the map cell

### Trip tiles

Each `<article class="tile">`:
- Cover photo (`<img class="ph" loading="lazy">`) with `onerror` → `.noimg` class
- Gradient scrim
- `<a class="cover">` linking to `t.page` (e.g. `greece24.html`)
- `.tlinks` (visible on hover): "Journal" link to `t.page` + Vimeo film links
- `.meta`: region (small caps mono), h3 title (serif), year

### Filter chips

- Chips: "All trips" always first, then one per unique country sorted by trip count descending
- `aria-pressed` toggling on active chip
- Filtering: `.hide` class on non-matching tiles
- Result count: `"21 journeys"` or `"3 in Greece"`
- `?place=Greece` query-param pre-selects a country filter on load (for back-links from trip pages)

### Leaflet map

- CARTO light basemap (`light_all`) / dark basemap (`dark_all`) — swaps on theme toggle via `window.__vzSwapTiles`
- CSS filter on `.leaflet-tile-pane`: `sepia(.5) saturate(1.2) brightness(1.02) hue-rotate(-8deg) contrast(.96)` (warm atlas paper tone)
- One custom `L.divIcon` dot-marker per country; larger (`big` class) if visited >1×
- Animated ping ring on each dot
- `L.marker.bindTooltip` shows "Country · N trips" on hover
- Clicking a marker calls `setFilter(country)` and scrolls to collage
- `map.scrollWheelZoom` disabled until first click; re-disabled on mouseout
- `window.__vzHighlight(key)` fades non-matching markers to 28% opacity
- `map.fitBounds(allMarkerCoords, {padding:[38,38]})` on load

### Theme

- `localStorage("vz-theme")` persists across pages
- `applyTheme(v)` sets `data-theme` on `<html>` and calls `__vzSwapTiles`
- No `applyDir` / no style direction in home.js

---

## Section 3 — Trip Pages

### Cbar update (all 21 wrapper pages)

Remove:
```html
<span class="seg-label">Style</span>
<div class="seg" role="group" aria-label="Visual direction">
  <button data-dir-btn="atlas" aria-pressed="true">Atlas</button>
  <button data-dir-btn="journal" aria-pressed="false">Journal</button>
  <button data-dir-btn="editorial" aria-pressed="false">Editorial</button>
</div>
```

Add (between backlink and themeBtn):
```html
<span class="seg-label" style="margin-left:auto;">VZsolov Trip Repo · Atlas</span>
```

### `assets/trip.js` changes

Remove:
- `applyDir()` function
- `dir-btn` click event listeners / `data-dir-btn` query

Keep unchanged:
- `applyTheme()` + theme toggle listener
- Journal load IIFE (`loadJournal`)
- Lightbox (`openLB`, `closeLB`, `step`, `render`, keyboard/click handlers)
- `#actions` rendering (film buttons + "All trips" link)
- Prev/next nav rendering

### CSS consequence

`assets/home.css` new2 version contains only `[data-dir="atlas"]` palette blocks. The `[data-dir="journal"]` and `[data-dir="editorial"]` blocks are gone. Because `data-dir="atlas"` is hardcoded on `<html>` in every page, all pages render correctly in Atlas mode with no runtime switching.

---

## Constraints

- All 21 trip URLs stay unchanged (`greece24.html`, `cyprus24.html`, etc.)
- Journal embed (fetch + inject `.journal-prose` div) stays unchanged in trip.js
- RTL/Hebrew display in `.journal-prose` stays via `assets/journal.css`
- No build step — all changes are static HTML/CSS/JS edits
- GitHub Pages compatible (no server-side logic)
