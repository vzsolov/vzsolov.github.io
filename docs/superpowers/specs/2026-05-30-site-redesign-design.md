# Site Redesign Design — VZsolov Trip Repo

**Date:** 2026-05-30  
**Status:** Approved

## Goal

Replace the current TemplateMo "Simple House" Bootstrap/jQuery/parallax site with the new clean design from `new/`. The new design has three visual styles (Atlas, Journal, Editorial), light/dark theme toggle, a stats band, a map with country pins, and a year-grouped timeline on the home page. Trip pages auto-discover gallery images and link out to the existing hand-authored photo-journal HTML files.

## Constraints

- Old URLs are preserved (`greece24.html`, not `Trip.html?id=greece24`)
- Existing subdirectory journal HTML files (`2024/greece/greece24.html`, etc.) are untouched
- Old `css/`, `js/`, `img/` directories are kept (still used by journal pages)
- GitHub Pages static hosting — no server-side logic

## Architecture

### File structure after migration

```
vzsolov.github.io/
├── assets/              ← NEW (copied from new/)
│   ├── home.css
│   ├── home.js
│   ├── trip.css
│   ├── trip.js          ← one line changed: window.TRIP_ID support
│   └── trips.js         ← journal field added per trip
│
├── index.html           ← REPLACED (new Home design)
├── greece24.html        ← REPLACED (thin ~25-line wrapper)
├── czechia24.html       ← REPLACED (thin wrapper)
├── [all 21 trip pages]  ← REPLACED as thin wrappers
│
├── about.html           ← UPDATED (new nav + footer, content kept)
├── contact.html         ← UPDATED (new nav + footer, content kept)
│
├── 2024/, 2023/, ...    ← UNTOUCHED (journal HTMLs + images)
├── css/, js/, img/      ← KEPT
```

### Data layer — `assets/trips.js`

All trip metadata lives here. One addition: a `journal` field per entry pointing to the old subdirectory HTML:

```js
{ year: 2024, title: "Greece", country: "Greece", region: "Mediterranean",
  page: "greece24.html", img: "2024/greece/images/image1.jpg",
  links: [{ label: "Film", url: "https://vimeo.com/..." }],
  journal: "2024/greece/greece24.html" }
```

`BASE` is set to `""` so image paths are repo-relative (works on GitHub Pages; the `new/` prototype had it pointing at the live site for testing).

### Home page — `index.html`

Direct replacement with `new/Home.html` content. References `assets/home.css`, `assets/trips.js`, `assets/home.js`. No other changes needed — home.js already renders the stats band, map pins, and year timeline from TRIPS data.

### Trip pages — each `greece24.html`, etc.

Each root-level trip file becomes a thin wrapper (~25 lines). It shares the full Trip.html body markup but sets one variable before loading the JS:

```html
<script>window.TRIP_ID = "greece24";</script>
<script src="assets/trips.js"></script>
<script src="assets/trip.js"></script>
```

The title tag is pre-filled: `<title>Greece 2024 · VZsolov Trip Repo</title>`.

### Trip logic — `assets/trip.js`

One line changes in slug resolution:

```js
// before:
const slug = (new URLSearchParams(location.search).get("id") || "").replace(/\.html$/, "");

// after:
const slug = (window.TRIP_ID || new URLSearchParams(location.search).get("id") || "").replace(/\.html$/, "");
```

Additionally, the `#actions` div rendering is updated so that when a trip has a `journal` field, a **"Open full journal →"** link is always rendered alongside the film buttons — not just as a fallback when images aren't found.

### about.html / contact.html

These pages keep their existing body content but get the new control bar (`<div class="cbar">`) at the top and the new `<footer class="foot">` at the bottom, plus `assets/home.css` replaces the old template CSS link. The old template header/parallax/nav block is removed.

## Components

| Component | File | Responsibility |
|-----------|------|----------------|
| Trip data | `assets/trips.js` | All metadata, image paths, Vimeo links, journal URLs |
| Home styles | `assets/home.css` | Tokens, palettes (3 dirs × 2 themes), hero, map, timeline, cards |
| Trip styles | `assets/trip.css` | Trip hero, gallery grid, lightbox, prev/next nav |
| Home logic | `assets/home.js` | Stats, map pins, timeline cards, theme/dir persistence |
| Trip logic | `assets/trip.js` | Slug lookup, hero render, image discovery, lightbox, nav |

## Data flow

```
User lands on index.html
  → home.css styles applied
  → trips.js loaded (TRIPS, PLACES, STATS)
  → home.js renders: stats band, map pins, year timeline cards
  → Card click → greece24.html

User lands on greece24.html
  → home.css + trip.css applied
  → window.TRIP_ID = "greece24" set
  → trips.js loaded → TRIPS array available
  → trip.js: looks up trip by TRIP_ID, renders hero + film + journal buttons
  → trip.js: scans images/ directory for gallery photos
  → Gallery click → lightbox opens
  → "Open full journal →" → 2024/greece/greece24.html (new tab)
```

## Error handling / edge cases

- **No images found:** trip.js already has a fallback block; with the `journal` field always rendered in `#actions`, the user always has a path to the content regardless.
- **Missing journal field:** old trips that have no separate journal HTML simply omit the field; trip.js renders the journal button only when `trip.journal` is truthy.
- **Trip.html?id=slug:** still works — the `window.TRIP_ID || URLSearchParams` fallback means the standalone Trip.html from `new/` continues to function for testing.

## Out of scope

- Leaflet map integration (placeholder in Home.html is kept as-is)
- Adding new trips
- Redesigning the subdirectory journal HTML files
