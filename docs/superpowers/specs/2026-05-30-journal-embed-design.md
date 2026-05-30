# Journal Embed Design

**Date:** 2026-05-30
**Status:** Approved

## Goal

Replace the separate photo gallery on trip pages with the original Google Docs journal — text and photos woven together as one flowing experience. The journal HTML files are converted from Google Docs export format to match the new design template. A reusable conversion script is stored in the repo so future trips can be onboarded the same way.

## Background

Each trip has a hand-authored Google Docs journal exported to HTML (e.g. `2024/greece/greece24.html`). These files are ~320 KB and contain paragraphs of text interspersed with ~66 local photos referenced as `images/imageN.jpg`. Previously they were iframed from the old site and then linked out as "Open full journal" from the new trip pages. The new design makes the journal the primary content of each trip page.

## What Changes

| File | Action |
|------|--------|
| `tools/convert_journal.py` | NEW — reusable conversion script |
| `assets/journal.css` | NEW — prose typography, `.journal-prose` scope |
| `assets/trip.js` | MODIFIED — remove gallery, add journal loader + lightbox rewire |
| All 21 trip wrapper `.html` | MODIFIED — remove lead + gallery sections, add `#journal` div, add `journal.css` link |
| All 21 journal HTML files | CONVERTED — run `convert_journal.py` on each |

## `tools/convert_journal.py`

### Inputs / Outputs

```
python3 tools/convert_journal.py 2024/greece/greece24.html
python3 tools/convert_journal.py 2024/czechia/czechia24.html 2024/cyprus/cyprus24.html ...
```

Modifies files **in-place**. Run from the repo root.

**Idempotency guard:** The script checks for the presence of `journal-prose` in the file. If found, the file is already converted and the script skips it with a message. To force re-conversion, delete the file and restore from git first (`git checkout -- path/to/file.html`).

### Processing pipeline (in order)

1. **Parse** with `BeautifulSoup(html, 'html.parser')`.
2. **Extract body content** — everything inside `<body>`.
3. **Unwrap all `<span>` elements** — Google Docs wraps every text run in a `<span class="cN">`. `unwrap()` keeps the text and discards the tag.
4. **Convert image paragraphs to figures** — find every `<p>` whose text content is empty and which contains at least one `<img>`; replace the entire `<p>` (and any residual wrapper divs) with `<figure><img src="..." alt="" loading="lazy"></figure>`. Strip all inline styles from the `<img>`.
5. **Strip remaining `class` and `style` attributes** from all elements (iterating `body.find_all(True)`). Keep `src`, `alt`, `href`, `loading`, `target`, `rel`.
6. **Remove empty `<p>` tags** — Google Docs emits many blank paragraphs.
7. **Output full new-design HTML template** wrapping the cleaned body content.

### Output template

```html
<!DOCTYPE html>
<html lang="en" data-dir="atlas" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title><!-- trip title from h1, or filename --></title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400;1,6..72,500&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Spectral:ital,wght@0,400;0,500;0,600;1,500&family=Hanken+Grotesk:wght@400;500;600;700&family=Karla:wght@400;500;600;700&family=Caveat:wght@500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
  <link href="../../assets/home.css" rel="stylesheet" />
  <link href="../../assets/journal.css" rel="stylesheet" />
</head>
<body>
  <div class="cbar">
    <a class="backlink" href="../../index.html">
      [back arrow SVG] The Archive
    </a>
    <button class="iconbtn" id="themeBtn" ...>[sun SVG]</button>
  </div>
  <main class="wrap">
    <article class="journal-prose">
      [CLEANED BODY CONTENT]
    </article>
  </main>
  <footer class="foot">
    <div class="wrap">
      <div class="links">
        <a href="../../index.html">All trips</a>
        <a href="https://vimeo.com/vzsolov" target="_blank" rel="noopener">Vimeo</a>
      </div>
    </div>
  </footer>
  <script>
    (function () {
      var root = document.documentElement;
      var theme = localStorage.getItem("vz-theme") || "light";
      var dir = localStorage.getItem("vz-dir") || "atlas";
      root.setAttribute("data-theme", theme);
      root.setAttribute("data-dir", dir);
      document.getElementById("themeBtn").addEventListener("click", function () {
        theme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", theme);
        localStorage.setItem("vz-theme", theme);
      });
    })();
  </script>
</body>
</html>
```

The title is extracted from the first `<h1>` found in the document, falling back to the filename stem.

All journal HTML files are at depth `YEAR/country/file.html` — two levels deep — so `../../assets/` is correct for all 21.

## `assets/journal.css`

Styles scoped to `.journal-prose`. Used both in standalone journal pages (applied to the `<article class="journal-prose">`) and when embedded in trip pages (applied to the fetched + injected wrapper div).

Key rules:
- `max-width: 72ch; margin: 3rem auto 4rem;` — comfortable reading line length
- `font-family: var(--font-body)` — inherits the active visual direction's body font
- `font-size: 1.05rem; line-height: 1.75;` — prose-optimised
- `figure { margin: 2rem 0; }` — space around photos
- `figure img { width: 100%; height: auto; border-radius: var(--radius); cursor: zoom-in; display: block; }` — responsive, lightbox-ready
- `p { margin: 0 0 1.25em; }`
- `h1, h2, h3 { font-family: var(--font-display); }`
- `a { color: var(--accent); text-decoration: underline; }`

## `assets/trip.js` — changes

### Remove
- Lead image code (`#leadImg`, `leadUrl`, `#lead` click listener)
- Gallery `discover()` async function entirely
- `#gcount`, `#gloading`, `#gallery` references
- Journal button from `#actions` (`journalBtn` and `trip.journal` conditional)
- Gallery fallback block

### Add: `loadJournal()`

```js
async function loadJournal() {
  const jEl = $("#journal");
  const loadEl = $("#jloading");
  if (!trip.journal || !jEl) return;
  try {
    const res = await fetch(trip.journal);
    if (!res.ok) throw new Error(res.status);
    const raw = await res.text();
    const doc = new DOMParser().parseFromString(raw, "text/html");
    // Fix relative image paths: images/ → 2024/greece/images/
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
    // Wire lightbox
    const imgs = [...wrapper.querySelectorAll("img")];
    shots.length = 0;
    imgs.forEach(img => shots.push(img.src));
    imgs.forEach((img, i) => img.addEventListener("click", () => openLB(i)));
    if (imgs.length) $("#gcount").textContent = `${imgs.length} photographs`;
  } catch (e) {
    if (loadEl) loadEl.textContent = "Journal unavailable.";
  }
}
loadJournal();
```

### Keep (unchanged)
- Hero rendering (year, title, location, film buttons)
- Lightbox code (open/close/prev/next/keyboard — `shots` array is now populated by `loadJournal`)
- Prev/next trip nav

### `#actions` rendering — remove journal button

```js
// before:
const journalBtn = trip.journal ? `...` : "";
$("#actions").innerHTML = filmBtns + journalBtn + `...All trips...`;

// after:
$("#actions").innerHTML = filmBtns + `<a class="btn" href="index.html">${GRID} All trips</a>`;
```

## Trip wrapper HTML — changes (all 21 files)

### Remove from `<main>`
```html
<!-- remove entirely: -->
<figure class="lead" id="lead" style="margin:0;">
  <img id="leadImg" alt="" />
</figure>

<section>
  <div class="gallery-head">
    <h2>The photographs</h2>
    <span class="count" id="gcount"></span>
  </div>
  <div class="gloading" id="gloading">...</div>
  <div class="gallery" id="gallery"></div>
</section>
```

### Add to `<main>` (after hero, before `<nav class="tnav">`)
```html
<section class="journal-section">
  <div id="journal">
    <div id="jloading"><span class="spin"></span> Loading journal…</div>
  </div>
</section>
```

### Add to `<head>`
```html
<link href="assets/journal.css" rel="stylesheet" />
```

## New trip page flow

```
Control bar
↓
Hero: large year number · title · country/region/coords · film button(s) · "All trips" button
↓
Journal section: fetched journal HTML — paragraphs + photos woven together
  (lazy-loaded images, click any photo → lightbox)
↓
Prev / next trip nav
↓
Footer
```

## Data flow

```
greece24.html loads
  → window.TRIP_ID = "greece24"
  → assets/trips.js (TRIPS array)
  → assets/trip.js
      → renders hero from TRIPS data
      → fetch("2024/greece/greece24.html")
          → DOMParser extracts body
          → image srcs prefixed with "2024/greece/"
          → injected into #journal as .journal-prose wrapper
          → all <img> wired to lightbox
      → renders prev/next nav
```

## Error handling

- If `fetch()` fails (offline, missing file): `#jloading` shows "Journal unavailable."
- If `trip.journal` is falsy (no journal defined for a trip): function returns early, `#journal` stays empty.
- `shots` array starts empty; lightbox still initialises but won't open until images load.

## `tools/convert_journal.py` — usage for future trips

When a new trip is added:
1. Export the Google Docs journal as HTML (File → Download → Web Page).
2. Place the exported HTML in the correct subdirectory (e.g. `2025/portugal/`).
3. Place trip photos in `2025/portugal/images/`.
4. Run: `python3 tools/convert_journal.py 2025/portugal/portugal25.html`
5. Add the trip entry to `assets/trips.js` (including `journal: "2025/portugal/portugal25.html"`).
6. Create the trip wrapper page `portugal25.html` using the standard template.

## Out of scope

- Right-to-left text direction (journal text alignment is handled by existing Google Docs heading styles; journal.css does not override `text-align`)
- Inline rich formatting from Google Docs (bold, underline) — stripped during conversion; prose reads cleanly without it
- Leaflet map integration (unchanged placeholder)
