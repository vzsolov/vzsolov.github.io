# Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old TemplateMo Bootstrap/jQuery/parallax site with the new clean design (Atlas/Journal/Editorial styles, light/dark, stats band, map pins, year timeline on home; auto-discovering gallery + journal link on trip pages) while keeping all existing URLs and subdirectory journal HTML files untouched.

**Architecture:** Shared data file (`assets/trips.js`) drives both the home timeline and trip pages. `index.html` is the new home. Each trip page (e.g. `greece24.html`) is a ~25-line wrapper that sets `window.TRIP_ID` and loads the shared trip logic. The old subdirectory journal HTML files (`2024/greece/greece24.html`, etc.) are preserved and linked from the new trip pages via a prominent "Open full journal →" button.

**Tech Stack:** Vanilla HTML/CSS/JS. No build step. Google Fonts. GitHub Pages static hosting.

---

## File Map

| Action | File | What changes |
|--------|------|--------------|
| Copy   | `assets/` (5 files) | New directory from `new/assets/` |
| Modify | `assets/trips.js` | `BASE=""`, add `journal` field per trip |
| Modify | `assets/home.js` | Fix `Trip.html?id=slug` hrefs → `t.page`; add `id` to year rows |
| Modify | `assets/trip.js` | `window.TRIP_ID` support; fix `Home.html` → `index.html`; fix prev/next hrefs; add journal button |
| Replace | `index.html` | New Home design |
| Replace | `greece24.html` + 20 other trip pages | Thin wrapper per trip |
| Rewrite | `about.html` | New shell, preserved person card |
| Rewrite | `contact.html` | New shell, simplified content |

---

## Task 1: Copy assets directory

**Files:**
- Create: `assets/` (copy from `../new/assets/`)

- [ ] **Step 1: Copy the assets folder**

```bash
cp -r /data/sync/vztravel/new/assets /data/sync/vztravel/vzsolov.github.io/assets
```

- [ ] **Step 2: Verify all 5 files are present**

```bash
ls /data/sync/vztravel/vzsolov.github.io/assets/
```

Expected output:
```
home.css  home.js  trip.css  trip.js  trips.js
```

- [ ] **Step 3: Commit**

```bash
cd /data/sync/vztravel/vzsolov.github.io
git add assets/
git commit -m "feat: add new design assets (CSS, JS, data)"
```

---

## Task 2: Update assets/trips.js — set BASE and add journal fields

**Files:**
- Modify: `assets/trips.js`

The current file has `BASE = "https://vzsolov.github.io/"`. Change it to `""` so image paths are repo-relative. Add a `journal` field to each trip entry pointing to the subdirectory HTML that contains the hand-authored photo journal.

- [ ] **Step 1: Write the complete updated trips.js**

Write this exact content to `assets/trips.js`:

```js
/* Trip data for vzsolov.github.io.
   img/page paths are repo-relative. */
const BASE = "";

const TRIPS = [
  { year: 2024, title: "Czechia",    country: "Czechia",     region: "Central Europe", page: "czechia24.html",   img: "2024/czechia/images/image1.jpg",   links: [{ label: "Film", url: "https://vimeo.com/manage/videos/962269643" }],  journal: "2024/czechia/czechia24.html" },
  { year: 2024, title: "Cyprus",     country: "Cyprus",      region: "Mediterranean",  page: "cyprus24.html",    img: "2024/cyprus/images/image1.jpg",    links: [{ label: "Film", url: "https://vimeo.com/manage/videos/1011647508" }], journal: "2024/cyprus/cyprus24.html" },
  { year: 2024, title: "Greece",     country: "Greece",      region: "Mediterranean",  page: "greece24.html",    img: "2024/greece/images/image1.jpg",    links: [{ label: "Film", url: "https://vimeo.com/manage/videos/1030310873" }], journal: "2024/greece/greece24.html" },

  { year: 2023, title: "Holland",    country: "Netherlands", region: "Western Europe", page: "holland23.html",   img: "2023/holland/images/image00.jpg",  links: [{ label: "Film", url: "https://vimeo.com/832892370" }],               journal: "2023/holland/holland23.html" },
  { year: 2023, title: "Corfu",      country: "Greece",      region: "Ionian Sea",     page: "corfu23.html",     img: "2023/corfu/images/image1.jpg",     links: [{ label: "Film", url: "https://vimeo.com/851624284" }],               journal: "2023/corfu/corfu23.html" },
  { year: 2023, title: "Romania",    country: "Romania",     region: "Carpathians",    page: "romania23.html",   img: "2023/romania/images/image1.jpg",   links: [{ label: "Film", url: "https://vimeo.com/888736331" }],               journal: "2023/romania/romania23.html" },

  { year: 2022, title: "Austria",    country: "Austria",     region: "The Alps",       page: "austira22.html",   img: "2022/austria/images/image00.jpg",  links: [{ label: "Film", url: "https://vimeo.com/721761838" }],               journal: "2022/austria/austira22.html" },
  { year: 2022, title: "Iceland",    country: "Iceland",     region: "North Atlantic", page: "iceland22.html",   img: "2022/iceland/images/image00.jpg",  links: [{ label: "Film", url: "https://vimeo.com/779704019" }],               journal: "2022/iceland/iceland22.html" },

  { year: 2020, title: "Greece",     country: "Greece",      region: "Mediterranean",  page: "greece20.html",    img: "2020/greece/images/image1.jpg",    links: [{ label: "Film", url: "https://vimeo.com/493867577" }],               journal: "2020/greece/greece20.html" },

  { year: 2019, title: "Rhône-Alpes",country: "France",      region: "The Alps",       page: "france19.html",    img: "2019/france/images/image1.jpg",    links: [{ label: "Film", url: "https://vimeo.com/341654092" }],               journal: "2019/france/france19.html" },
  { year: 2019, title: "Greece",     country: "Greece",      region: "Mediterranean",  page: "greece19.html",    img: "2019/greece/images/image1.jpg",    links: [{ label: "Film", url: "https://vimeo.com/380936248" }],               journal: "2019/greece/greece19.html" },

  { year: 2018, title: "Austria",    country: "Austria",     region: "The Alps",       page: "austira18.html",   img: "2018/austria/images/image1.jpg",   links: [{ label: "Film", url: "https://vimeo.com/269239501" }],               journal: "2018/austria/austira18.html" },
  { year: 2018, title: "Montenegro", country: "Montenegro",  region: "Adriatic",       page: "montenegro18.html",img: "2018/montenegro/images/image1.jpg",links: [{ label: "Film", url: "https://vimeo.com/295442862" }],               journal: "2018/montenegro/montenegro18.html" },

  { year: 2017, title: "Crete",      country: "Greece",      region: "Mediterranean",  page: "greece17.html",    img: "2017/greece/images/image1.jpg",    links: [{ label: "Film", url: "https://vimeo.com/229401853" }],               journal: "2017/greece/greece17.html" },
  { year: 2017, title: "Lapland",    country: "Finland",     region: "The Arctic",     page: "lapland17.html",   img: "2017/lapland/images/image2.jpg",   links: [{ label: "Film", url: "https://vimeo.com/208193648" }],               journal: "2017/lapland/lapland17.html" },

  { year: 2016, title: "Thailand",   country: "Thailand",    region: "Southeast Asia", page: "thailand16.html",  img: "2016/thailand/images/image1.jpg",  links: [{ label: "Film", url: "https://vimeo.com/192307301" }],               journal: "2016/thailand/thailand16.html" },

  { year: 2015, title: "Georgia",    country: "Georgia",     region: "The Caucasus",   page: "georgia15.html",   img: "2015/georgia/images/image1.jpg",   links: [{ label: "Nature", url: "https://vimeo.com/218836340" }, { label: "Follow Me", url: "https://vimeo.com/180413605" }], journal: "2015/georgia/georgia15.html" },

  { year: 2014, title: "Iceland",    country: "Iceland",     region: "North Atlantic", page: "iceland14.html",   img: "2014/iceland/images/image1.jpg",   links: [{ label: "Nature", url: "https://vimeo.com/196623783" }, { label: "360°", url: "https://vimeo.com/102657979" }],   journal: "2014/iceland/iceland14.html" },

  { year: 2013, title: "Norway",     country: "Norway",      region: "The Fjords",     page: "norway13.html",    img: "2013/norway/images/image1.jpg",    links: [{ label: "Film", url: "https://vimeo.com/200458098" }],               journal: "2013/norway/norway13.html" },

  { year: 2012, title: "Ireland",    country: "Ireland",     region: "Atlantic Coast", page: "ireland12.html",   img: "2012/ireland/images/image1.jpg",   links: [{ label: "Film", url: "https://vimeo.com/199864810" }],               journal: "2012/ireland/ireland12.html" },
  { year: 2012, title: "Prague",     country: "Czechia",     region: "Central Europe", page: "praga12.html",     img: "2012/praga/images/image1.jpg",     links: [],                                                                     journal: "2012/praga/praga12.html" },
];

const COUNTRIES = [...new Set(TRIPS.map(t => t.country))];
const YEARS = [...new Set(TRIPS.map(t => t.year))].sort((a, b) => b - a);
const STATS = {
  trips: TRIPS.length,
  countries: COUNTRIES.length,
  yearsFrom: Math.min(...TRIPS.map(t => t.year)),
  yearsTo: Math.max(...TRIPS.map(t => t.year)),
  continents: 2,
};

/* Rough lon/lat for the map feature, one marker per country. */
const PLACES = [
  { country: "Iceland",     lat: 64.9,  lon: -19.0 },
  { country: "Ireland",     lat: 53.1,  lon: -8.2  },
  { country: "Netherlands", lat: 52.2,  lon: 5.3   },
  { country: "Norway",      lat: 61.0,  lon: 8.5   },
  { country: "Finland",     lat: 67.9,  lon: 26.5  },
  { country: "France",      lat: 45.5,  lon: 6.2   },
  { country: "Austria",     lat: 47.4,  lon: 13.3  },
  { country: "Czechia",     lat: 49.8,  lon: 15.0  },
  { country: "Romania",     lat: 45.9,  lon: 25.0  },
  { country: "Montenegro",  lat: 42.7,  lon: 19.3  },
  { country: "Greece",      lat: 39.0,  lon: 22.5  },
  { country: "Cyprus",      lat: 35.0,  lon: 33.2  },
  { country: "Georgia",     lat: 42.2,  lon: 43.4  },
  { country: "Thailand",    lat: 15.0,  lon: 101.0 },
];
```

- [ ] **Step 2: Verify BASE is set to empty string**

```bash
grep 'const BASE' /data/sync/vztravel/vzsolov.github.io/assets/trips.js
```

Expected: `const BASE = "";`

- [ ] **Step 3: Verify all 21 journal fields are present**

```bash
grep -c 'journal:' /data/sync/vztravel/vzsolov.github.io/assets/trips.js
```

Expected: `21`

- [ ] **Step 4: Verify the journal subdirectory HTML files actually exist**

```bash
grep 'journal:' /data/sync/vztravel/vzsolov.github.io/assets/trips.js \
  | sed "s/.*journal: \"\([^\"]*\)\".*/\1/" \
  | while read p; do
      [ -f "/data/sync/vztravel/vzsolov.github.io/$p" ] && echo "OK: $p" || echo "MISSING: $p"
    done
```

All lines should say `OK`. If any say `MISSING`, check the actual subdirectory structure with `ls /data/sync/vztravel/vzsolov.github.io/YEAR/` and correct the path in trips.js.

- [ ] **Step 5: Commit**

```bash
cd /data/sync/vztravel/vzsolov.github.io
git add assets/trips.js
git commit -m "feat: set BASE empty, add journal paths to all trips"
```

---

## Task 3: Update assets/home.js — fix trip card hrefs and add year anchor IDs

**Files:**
- Modify: `assets/home.js`

Two changes:
1. Card hrefs currently use `Trip.html?id=${slug}`. Since we keep old URLs, change these to `${t.page}` (which is already the filename like `greece24.html`). The `slug` const becomes unused and can be removed.
2. Year rows need an `id` attribute so the breadcrumb anchor (`#y2024`) from trip pages can scroll to them.

- [ ] **Step 1: Make the changes**

In `assets/home.js`, find this block (around line 58–75):

```js
    trips.forEach(t => {
      const card = el("article", "card");
      const slug = t.page.replace(/\.html$/, "");
      const links = t.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join("");
      card.innerHTML = `
        <a class="cover" href="Trip.html?id=${slug}">
          <img class="ph" loading="lazy" src="${BASE + t.img}" alt="${t.title} ${t.year}"
               onerror="this.style.opacity=0;this.parentElement.classList.add('noimg')" />
        </a>
        <div class="cap">
          <span class="region">${t.region}</span>
          <h3>${t.title}</h3>
        </div>
        <div class="links">
          <a class="blog" href="Trip.html?id=${slug}">Photo Journal</a>
          ${links}
        </div>`;
      grid.appendChild(card);
    });
```

Replace it with:

```js
    trips.forEach(t => {
      const card = el("article", "card");
      const links = t.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join("");
      card.innerHTML = `
        <a class="cover" href="${t.page}">
          <img class="ph" loading="lazy" src="${BASE + t.img}" alt="${t.title} ${t.year}"
               onerror="this.style.opacity=0;this.parentElement.classList.add('noimg')" />
        </a>
        <div class="cap">
          <span class="region">${t.region}</span>
          <h3>${t.title}</h3>
        </div>
        <div class="links">
          <a class="blog" href="${t.page}">Photo Journal</a>
          ${links}
        </div>`;
      grid.appendChild(card);
    });
```

Also find this line (around line 54):

```js
    const row = el("article", "year-row reveal");
```

Replace with:

```js
    const row = el("article", "year-row reveal");
    row.id = `y${year}`;
```

- [ ] **Step 2: Verify no Trip.html?id= references remain in home.js**

```bash
grep 'Trip.html' /data/sync/vztravel/vzsolov.github.io/assets/home.js
```

Expected: no output (empty).

- [ ] **Step 3: Verify year id is set**

```bash
grep 'row.id' /data/sync/vztravel/vzsolov.github.io/assets/home.js
```

Expected: `    row.id = \`y${year}\`;`

- [ ] **Step 4: Commit**

```bash
cd /data/sync/vztravel/vzsolov.github.io
git add assets/home.js
git commit -m "feat: fix home card hrefs to use page URLs, add year anchor IDs"
```

---

## Task 4: Update assets/trip.js — TRIP_ID support, fix refs, add journal button

**Files:**
- Modify: `assets/trip.js`

Four changes:
1. **Slug resolution:** check `window.TRIP_ID` before URLSearchParams so wrapper files can set their own slug.
2. **Breadcrumb links:** `Home.html` → `index.html`, year anchor `#year` → `#yyear`.
3. **Prev/next nav:** `Trip.html?id=${...}` → `${t.page}`.
4. **Journal button:** always render in `#actions` when `trip.journal` is set (not just as fallback).

- [ ] **Step 1: Fix slug resolution (line 28)**

Find:
```js
  const slug = (new URLSearchParams(location.search).get("id") || "").replace(/\.html$/, "");
```

Replace with:
```js
  const slug = (window.TRIP_ID || new URLSearchParams(location.search).get("id") || "").replace(/\.html$/, "");
```

- [ ] **Step 2: Fix breadcrumb links (line 39)**

Find:
```js
  $("#crumb").innerHTML = `<a href="Home.html">Archive</a><span class="sep">/</span><a href="Home.html#${trip.year}">${trip.year}</a><span class="sep">/</span><b>${trip.title}</b>`;
```

Replace with:
```js
  $("#crumb").innerHTML = `<a href="index.html">Archive</a><span class="sep">/</span><a href="index.html#y${trip.year}">${trip.year}</a><span class="sep">/</span><b>${trip.title}</b>`;
```

- [ ] **Step 3: Add journal button to #actions (lines 45–48)**

Find:
```js
  const filmBtns = trip.links.map(l =>
    `<a class="btn primary" href="${l.url}" target="_blank" rel="noopener">${PLAY} Watch ${l.label}</a>`).join("");
  $("#actions").innerHTML = filmBtns +
    `<a class="btn" href="Home.html">${GRID} All trips</a>`;
```

Replace with:
```js
  const filmBtns = trip.links.map(l =>
    `<a class="btn primary" href="${l.url}" target="_blank" rel="noopener">${PLAY} Watch ${l.label}</a>`).join("");
  const journalBtn = trip.journal
    ? `<a class="btn primary" href="${trip.journal}" target="_blank" rel="noopener">${GRID} Open full journal</a>`
    : "";
  $("#actions").innerHTML = filmBtns + journalBtn +
    `<a class="btn" href="index.html">${GRID} All trips</a>`;
```

- [ ] **Step 4: Fix prev/next hrefs (lines 114–116)**

Find:
```js
  const navHTML = (t, dir, cls) => t
    ? `<a class="${cls}" href="Trip.html?id=${t.page.replace(/\.html$/, "")}"><span class="dir">${dir}</span><span class="ttl">${t.title}&nbsp;'${String(t.year).slice(2)}</span></a>`
    : `<span class="${cls} disabled"><span class="dir">${dir}</span><span class="ttl">—</span></span>`;
```

Replace with:
```js
  const navHTML = (t, dir, cls) => t
    ? `<a class="${cls}" href="${t.page}"><span class="dir">${dir}</span><span class="ttl">${t.title}&nbsp;'${String(t.year).slice(2)}</span></a>`
    : `<span class="${cls} disabled"><span class="dir">${dir}</span><span class="ttl">—</span></span>`;
```

- [ ] **Step 5: Verify no Home.html or Trip.html references remain**

```bash
grep -n 'Home\.html\|Trip\.html' /data/sync/vztravel/vzsolov.github.io/assets/trip.js
```

Expected: no output.

- [ ] **Step 6: Verify TRIP_ID and journal button are present**

```bash
grep -n 'TRIP_ID\|journalBtn' /data/sync/vztravel/vzsolov.github.io/assets/trip.js
```

Expected: 2 lines — one with `window.TRIP_ID`, one with `journalBtn`.

- [ ] **Step 7: Commit**

```bash
cd /data/sync/vztravel/vzsolov.github.io
git add assets/trip.js
git commit -m "feat: TRIP_ID support, fix Home→index refs, add journal button"
```

---

## Task 5: Replace index.html with new Home design

**Files:**
- Modify: `index.html`

Use the `new/Home.html` as the basis. Three adjustments:
1. Fix footer links: change absolute `https://vzsolov.github.io/about.html` and `https://vzsolov.github.io/contact.html` to relative `about.html` and `contact.html`, and remove `target="_blank"` from internal links.
2. Script order: `trips.js` must load before `home.js`.
3. Remove the `target="_blank"` from About/Contact footer links (they're internal pages).

- [ ] **Step 1: Write index.html**

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
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400;1,6..72,500&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Spectral:ital,wght@0,400;0,500;0,600;1,500&family=Hanken+Grotesk:wght@400;500;600;700&family=Karla:wght@400;500;600;700&family=Caveat:wght@500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
  <link href="assets/home.css" rel="stylesheet" />
</head>
<body>
  <!-- ============ CONTROL BAR ============ -->
  <div class="cbar">
    <div class="brand">VZsolov <b class="brand-rest">Trip Repo</b></div>
    <span class="seg-label">Style</span>
    <div class="seg" role="group" aria-label="Visual direction">
      <button data-dir-btn="atlas" aria-pressed="true">Atlas</button>
      <button data-dir-btn="journal" aria-pressed="false">Journal</button>
      <button data-dir-btn="editorial" aria-pressed="false">Editorial</button>
    </div>
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
    <!-- ============ MAP ============ -->
    <section>
      <div class="section-head">
        <div>
          <p class="eyebrow">Where we've been</p>
          <h2>The map so far</h2>
        </div>
        <p class="note">Pins mark every country logged below</p>
      </div>
      <div class="map" id="map">
        <div class="graticule"></div>
        <svg class="compass" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.3">
          <circle cx="24" cy="24" r="21"></circle>
          <path d="M24 6 L28 24 L24 42 L20 24 Z" fill="currentColor" stroke="none" opacity=".5"></path>
          <path d="M6 24 L24 20 L42 24 L24 28 Z" fill="currentColor" stroke="none" opacity=".25"></path>
          <text x="24" y="13" text-anchor="middle" font-size="7" fill="currentColor" stroke="none" font-family="monospace">N</text>
        </svg>
        <span class="placeholder-tag">[ interactive map — Leaflet drops in here ]</span>
      </div>
    </section>

    <!-- ============ TIMELINE ============ -->
    <section class="timeline">
      <div class="section-head">
        <div>
          <p class="eyebrow">The archive</p>
          <h2>Year by year</h2>
        </div>
        <p class="note">Newest first · scroll to travel back</p>
      </div>
      <div id="timeline"></div>
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
      <p class="fine">© <span id="yr"></span> VZsolov Trip Repo</p>
    </div>
  </footer>

  <script src="assets/trips.js"></script>
  <script src="assets/home.js"></script>
  <script>document.getElementById("yr").textContent = new Date().getFullYear();</script>
</body>
</html>
```

- [ ] **Step 2: Verify index.html has the new structure**

```bash
grep -c 'assets/home.css\|assets/trips.js\|assets/home.js\|id="timeline"\|id="stats"' \
  /data/sync/vztravel/vzsolov.github.io/index.html
```

Expected: `5`

- [ ] **Step 3: Verify no old TemplateMo references remain**

```bash
grep -i 'templatemo\|parallax\|jquery\|tm-gallery' \
  /data/sync/vztravel/vzsolov.github.io/index.html
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
cd /data/sync/vztravel/vzsolov.github.io
git add index.html
git commit -m "feat: replace index.html with new Home design"
```

---

## Task 6: Generate all 21 trip wrapper pages

**Files:**
- Replace: `czechia24.html`, `cyprus24.html`, `greece24.html`, `holland23.html`, `corfu23.html`, `romania23.html`, `austira22.html`, `iceland22.html`, `greece20.html`, `france19.html`, `greece19.html`, `austira18.html`, `montenegro18.html`, `greece17.html`, `lapland17.html`, `thailand16.html`, `georgia15.html`, `iceland14.html`, `norway13.html`, `ireland12.html`, `praga12.html`

Each file is a thin wrapper: it sets `window.TRIP_ID` to its slug and loads the shared trip template logic. The body markup is identical across all files; only the `<title>` and the `window.TRIP_ID` value differ.

- [ ] **Step 1: Write a generation script and run it**

```bash
cd /data/sync/vztravel/vzsolov.github.io

FONTS='https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400;1,6..72,500&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Spectral:ital,wght@0,400;0,500;0,600;1,500&family=Hanken+Grotesk:wght@400;500;600;700&family=Karla:wght@400;500;600;700&family=Caveat:wght@500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap'

make_trip() {
  local FILE="$1" SLUG="$2" TITLE="$3"
  cat > "$FILE" <<HTMLEOF
<!DOCTYPE html>
<html lang="en" data-dir="atlas" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>${TITLE} · VZsolov Trip Repo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${FONTS}" rel="stylesheet" />
  <link href="assets/home.css" rel="stylesheet" />
  <link href="assets/trip.css" rel="stylesheet" />
</head>
<body>
  <div class="cbar">
    <a class="backlink" href="index.html">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"></path></svg>
      The Archive
    </a>
    <span class="seg-label">Style</span>
    <div class="seg" role="group" aria-label="Visual direction">
      <button data-dir-btn="atlas" aria-pressed="true">Atlas</button>
      <button data-dir-btn="journal" aria-pressed="false">Journal</button>
      <button data-dir-btn="editorial" aria-pressed="false">Editorial</button>
    </div>
    <button class="iconbtn" id="themeBtn" title="Toggle light / dark" aria-label="Toggle light or dark theme">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4.2"></circle>
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"></path>
      </svg>
    </button>
  </div>

  <main class="wrap">
    <header class="thero">
      <div class="yearbig" id="yearbig"></div>
      <p class="crumb" id="crumb"></p>
      <h1 id="title"></h1>
      <div class="sub" id="sub"></div>
      <div class="actions" id="actions"></div>
    </header>

    <figure class="lead" id="lead" style="margin:0;">
      <img id="leadImg" alt="" />
    </figure>

    <section>
      <div class="gallery-head">
        <h2>The photographs</h2>
        <span class="count" id="gcount"></span>
      </div>
      <div class="gloading" id="gloading"><span class="spin"></span> Gathering photographs…</div>
      <div class="gallery" id="gallery"></div>
    </section>

    <nav class="tnav" id="tnav"></nav>
  </main>

  <footer class="foot">
    <div class="wrap">
      <h2>Back to the <em>whole</em> archive.</h2>
      <div class="links">
        <a href="index.html">All trips</a>
        <a href="about.html">About</a>
        <a href="https://vimeo.com/vzsolov" target="_blank" rel="noopener">Vimeo</a>
      </div>
    </div>
  </footer>

  <div class="lbox" id="lbox" aria-hidden="true">
    <div class="lb-counter" id="lbCount"></div>
    <button class="lb-close" id="lbClose" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg></button>
    <button class="lb-nav lb-prev" id="lbPrev" aria-label="Previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"></path></svg></button>
    <img id="lbImg" alt="" />
    <button class="lb-nav lb-next" id="lbNext" aria-label="Next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"></path></svg></button>
  </div>

  <script>window.TRIP_ID = "${SLUG}";</script>
  <script src="assets/trips.js"></script>
  <script src="assets/trip.js"></script>
</body>
</html>
HTMLEOF
}

make_trip czechia24.html    czechia24    "Czechia 2024"
make_trip cyprus24.html     cyprus24     "Cyprus 2024"
make_trip greece24.html     greece24     "Greece 2024"
make_trip holland23.html    holland23    "Holland 2023"
make_trip corfu23.html      corfu23      "Corfu 2023"
make_trip romania23.html    romania23    "Romania 2023"
make_trip austira22.html    austira22    "Austria 2022"
make_trip iceland22.html    iceland22    "Iceland 2022"
make_trip greece20.html     greece20     "Greece 2020"
make_trip france19.html     france19     "Rhône-Alpes 2019"
make_trip greece19.html     greece19     "Greece 2019"
make_trip austira18.html    austira18    "Austria 2018"
make_trip montenegro18.html montenegro18 "Montenegro 2018"
make_trip greece17.html     greece17     "Crete 2017"
make_trip lapland17.html    lapland17    "Lapland 2017"
make_trip thailand16.html   thailand16   "Thailand 2016"
make_trip georgia15.html    georgia15    "Georgia 2015"
make_trip iceland14.html    iceland14    "Iceland 2014"
make_trip norway13.html     norway13     "Norway 2013"
make_trip ireland12.html    ireland12    "Ireland 2012"
make_trip praga12.html      praga12      "Prague 2012"

echo "Done"
```

- [ ] **Step 2: Verify all 21 files were created/overwritten**

```bash
ls /data/sync/vztravel/vzsolov.github.io/*.html | grep -v 'about\|contact\|index' | wc -l
```

Expected: `21`

- [ ] **Step 3: Verify each file has the correct TRIP_ID**

```bash
for f in /data/sync/vztravel/vzsolov.github.io/*.html; do
  slug=$(grep 'window.TRIP_ID' "$f" 2>/dev/null | sed "s/.*TRIP_ID = \"\([^\"]*\)\".*/\1/")
  [ -n "$slug" ] && echo "OK $f → $slug"
done | wc -l
```

Expected: `21`

- [ ] **Step 4: Spot-check one file**

```bash
grep -n 'TRIP_ID\|assets/trip\|assets/home\|backlink' \
  /data/sync/vztravel/vzsolov.github.io/greece24.html
```

Expected output (line numbers may vary):
```
  <a class="backlink" href="index.html">
  <link href="assets/home.css" rel="stylesheet" />
  <link href="assets/trip.css" rel="stylesheet" />
  <script>window.TRIP_ID = "greece24";</script>
  <script src="assets/trips.js"></script>
  <script src="assets/trip.js"></script>
```

- [ ] **Step 5: Commit**

```bash
cd /data/sync/vztravel/vzsolov.github.io
git add czechia24.html cyprus24.html greece24.html holland23.html corfu23.html \
        romania23.html austira22.html iceland22.html greece20.html france19.html \
        greece19.html austira18.html montenegro18.html greece17.html lapland17.html \
        thailand16.html georgia15.html iceland14.html norway13.html ireland12.html \
        praga12.html
git commit -m "feat: replace all 21 trip pages with new design wrappers"
```

---

## Task 7: Update about.html

**Files:**
- Rewrite: `about.html`

Keep: Zina's photo, name, role, social links (Facebook, Instagram, GitHub).  
Remove: old parallax header, Bootstrap classes, FontAwesome icon classes, old footer, jQuery scripts.  
Add: new control bar, new footer, theme persistence script.

- [ ] **Step 1: Write about.html**

```html
<!DOCTYPE html>
<html lang="en" data-dir="atlas" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>About · VZsolov Trip Repo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400;1,6..72,500&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Spectral:ital,wght@0,400;0,500;0,600;1,500&family=Hanken+Grotesk:wght@400;500;600;700&family=Karla:wght@400;500;600;700&family=Caveat:wght@500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
  <link href="assets/home.css" rel="stylesheet" />
</head>
<body>
  <div class="cbar">
    <a class="backlink" href="index.html">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"></path></svg>
      The Archive
    </a>
    <button class="iconbtn" id="themeBtn" title="Toggle light / dark" aria-label="Toggle light or dark theme">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4.2"></circle>
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"></path>
      </svg>
    </button>
  </div>

  <main class="wrap" style="padding-top:3rem; padding-bottom:4rem;">
    <header style="margin-bottom:2.5rem;">
      <p class="eyebrow">The people behind the trips</p>
      <h1>About</h1>
    </header>
    <figure style="display:flex; gap:2rem; align-items:flex-start; flex-wrap:wrap; margin:0;">
      <img src="img/zinaAboutPhoto.jpg" alt="Zina Solov"
           style="width:180px; height:180px; object-fit:cover; border-radius:4px; flex-shrink:0;" />
      <figcaption>
        <h2 style="margin:0 0 0.25rem 0;">Zina Solov</h2>
        <p style="margin:0 0 1rem 0; color:var(--muted);">Travel member · Hobby photographer</p>
        <nav style="display:flex; gap:1.25rem; flex-wrap:wrap;">
          <a href="https://www.facebook.com/zina.skoran" target="_blank" rel="noopener">Facebook</a>
          <a href="https://www.instagram.com/riki2086" target="_blank" rel="noopener">Instagram</a>
          <a href="https://github.com/vzsolov/vzsolov.github.io" target="_blank" rel="noopener">GitHub repo</a>
        </nav>
      </figcaption>
    </figure>
  </main>

  <footer class="foot">
    <div class="wrap">
      <div class="links">
        <a href="index.html">All trips</a>
        <a href="https://vimeo.com/vzsolov" target="_blank" rel="noopener">Vimeo</a>
        <a href="https://github.com/vzsolov/vzsolov.github.io" target="_blank" rel="noopener">Source</a>
      </div>
    </div>
  </footer>

  <script>
    (function () {
      var root = document.documentElement;
      var theme = localStorage.getItem("vz-theme") || "light";
      root.setAttribute("data-theme", theme);
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

- [ ] **Step 2: Verify old template references are gone**

```bash
grep -i 'templatemo\|parallax\|jquery\|tm-\|col-md' \
  /data/sync/vztravel/vzsolov.github.io/about.html
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /data/sync/vztravel/vzsolov.github.io
git add about.html
git commit -m "feat: update about.html to new design shell"
```

---

## Task 8: Update contact.html

**Files:**
- Rewrite: `contact.html`

The current contact.html has lorem ipsum placeholder content that was never customized. Replace with the new design shell and a minimal honest contact page (GitHub link only — there is no working form backend).

- [ ] **Step 1: Write contact.html**

```html
<!DOCTYPE html>
<html lang="en" data-dir="atlas" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Contact · VZsolov Trip Repo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400;1,6..72,500&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Spectral:ital,wght@0,400;0,500;0,600;1,500&family=Hanken+Grotesk:wght@400;500;600;700&family=Karla:wght@400;500;600;700&family=Caveat:wght@500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
  <link href="assets/home.css" rel="stylesheet" />
</head>
<body>
  <div class="cbar">
    <a class="backlink" href="index.html">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"></path></svg>
      The Archive
    </a>
    <button class="iconbtn" id="themeBtn" title="Toggle light / dark" aria-label="Toggle light or dark theme">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4.2"></circle>
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"></path>
      </svg>
    </button>
  </div>

  <main class="wrap" style="padding-top:3rem; padding-bottom:4rem;">
    <header style="margin-bottom:2.5rem;">
      <p class="eyebrow">Get in touch</p>
      <h1>Contact</h1>
    </header>
    <p style="max-width:520px; color:var(--muted);">
      Questions, suggestions, or just want to say where we should go next?
      Reach out via GitHub issues on the repo.
    </p>
    <nav style="display:flex; gap:1.25rem; margin-top:1.5rem; flex-wrap:wrap;">
      <a href="https://github.com/vzsolov/vzsolov.github.io/issues" target="_blank" rel="noopener"
         style="display:inline-flex; align-items:center; gap:.4em;">
        Open an issue on GitHub →
      </a>
    </nav>
  </main>

  <footer class="foot">
    <div class="wrap">
      <div class="links">
        <a href="index.html">All trips</a>
        <a href="about.html">About</a>
        <a href="https://vimeo.com/vzsolov" target="_blank" rel="noopener">Vimeo</a>
        <a href="https://github.com/vzsolov/vzsolov.github.io" target="_blank" rel="noopener">Source</a>
      </div>
    </div>
  </footer>

  <script>
    (function () {
      var root = document.documentElement;
      var theme = localStorage.getItem("vz-theme") || "light";
      root.setAttribute("data-theme", theme);
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

- [ ] **Step 2: Verify old template references are gone**

```bash
grep -i 'templatemo\|parallax\|jquery\|lorem\|accordion' \
  /data/sync/vztravel/vzsolov.github.io/contact.html
```

Expected: no output.

- [ ] **Step 3: Final overall check — no old template JS loaded in any top-level page**

```bash
grep -l 'jquery\|parallax\.min\|templatemo' \
  /data/sync/vztravel/vzsolov.github.io/*.html
```

Expected: no output. If any files are listed, they haven't been updated yet.

- [ ] **Step 4: Commit**

```bash
cd /data/sync/vztravel/vzsolov.github.io
git add contact.html
git commit -m "feat: update contact.html to new design shell"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ `assets/` folder copied (Task 1)
- ✅ `BASE=""` set, `journal` field added to all 21 trips (Task 2)
- ✅ Home card links use `t.page` not `Trip.html?id=` (Task 3)
- ✅ Trip pages use `window.TRIP_ID`, `Home.html` refs replaced, journal button added (Task 4)
- ✅ `index.html` replaced with new Home design (Task 5)
- ✅ All 21 trip pages replaced as thin wrappers (Task 6)
- ✅ `about.html` updated — old content preserved (Task 7)
- ✅ `contact.html` updated (Task 8)
- ✅ Old subdirectory journal HTMLs untouched (no task touches them)
- ✅ `css/`, `js/`, `img/` dirs untouched

**No placeholders:** All steps contain exact code, exact commands, and exact expected output.

**Type consistency:** `t.page` used consistently in both home.js (Task 3) and trip.js prev/next (Task 4). `trip.journal` field referenced in trip.js (Task 4) and defined in trips.js (Task 2). `window.TRIP_ID` set in wrapper files (Task 6) and read in trip.js (Task 4).
