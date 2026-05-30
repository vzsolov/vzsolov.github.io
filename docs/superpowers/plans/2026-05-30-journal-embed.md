# Journal Embed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the separate photo gallery on trip pages with the Google Docs journal rendered inline — text and photos woven together, lazy-loaded, lightbox-enabled, styled with the new design.

**Architecture:** Five coordinated changes: (1) new `assets/journal.css` scopes prose typography to `.journal-prose`; (2) `assets/trip.js` is fully rewritten to remove gallery discovery and add a `loadJournal()` async function that fetches the journal HTML, fixes relative image paths, injects content, and wires the lightbox; (3) all 21 trip wrapper HTMLs are regenerated to remove the lead+gallery sections and add a `#journal` div; (4) `tools/convert_journal.py` converts Google Docs exports to new-design HTML (reusable for future trips); (5) the script is run on all 21 existing journal files.

**Tech Stack:** Vanilla HTML/CSS/JS. Python 3 + BeautifulSoup4 for journal conversion. GitHub Pages static hosting.

---

## File Map

| Action | File |
|--------|------|
| Create | `assets/journal.css` |
| Rewrite | `assets/trip.js` |
| Create | `tools/convert_journal.py` |
| Regenerate (bash) | All 21 root-level trip wrapper `.html` files |
| Convert (Python) | All 21 journal HTML files under `YEAR/country/` |

---

## Task 1: Create assets/journal.css

**Files:**
- Create: `assets/journal.css`

- [ ] **Step 1: Write assets/journal.css**

```css
/* =========================================================================
   VZsolov Trip Repo — journal prose styles
   Scoped to .journal-prose — applies in both standalone journal pages
   and when journal content is embedded in trip pages.
   ========================================================================= */

.journal-prose {
  max-width: 72ch;
  margin: 2rem auto 4rem;
  font-family: var(--font-body);
  font-size: 1.05rem;
  line-height: 1.75;
  color: var(--ink);
}

.journal-prose p {
  margin: 0 0 1.25em;
}

.journal-prose h1 {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  font-weight: 600;
  line-height: 1.2;
  margin: 3rem 0 1.5rem;
  color: var(--ink);
}

.journal-prose h2 {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 600;
  margin: 2.5rem 0 1rem;
  color: var(--ink);
}

.journal-prose h3 {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 2rem 0 0.75rem;
}

.journal-prose figure {
  margin: 2.5rem 0;
}

.journal-prose figure img {
  width: 100%;
  height: auto;
  border-radius: var(--radius);
  display: block;
  cursor: zoom-in;
}

.journal-prose img {
  width: 100%;
  height: auto;
  border-radius: var(--radius);
  display: block;
  cursor: zoom-in;
}

.journal-prose a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.journal-prose a:hover { color: var(--accent-ink); }

.journal-prose strong { font-weight: 600; }

/* ---- journal loading spinner ---- */
#jloading {
  padding: 3rem 0;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

/* ---- journal section spacing ---- */
.journal-section {
  margin-top: 1rem;
}
```

- [ ] **Step 2: Verify file was created**

```bash
grep -c 'journal-prose\|journal-section\|jloading' /data/sync/vztravel/vzsolov.github.io/assets/journal.css
```

Expected: `3`

- [ ] **Step 3: Commit**

```bash
cd /data/sync/vztravel/vzsolov.github.io
git add assets/journal.css
git commit -m "feat: add journal.css prose styles"
```

---

## Task 2: Rewrite assets/trip.js

**Files:**
- Rewrite: `assets/trip.js`

Complete rewrite — removes lead image, gallery auto-discovery, and journal button. Adds `shots` at IIFE scope and `loadJournal()` async function. All other logic (dir/theme, hero, prev/next, lightbox) is unchanged.

- [ ] **Step 1: Write the complete new assets/trip.js**

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
  const el = (t, cls, html) => { const e = document.createElement(t); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  /* ---- persisted direction + theme (shared with Home) ---- */
  const store = {
    get dir() { return localStorage.getItem("vz-dir") || "atlas"; },
    set dir(v) { localStorage.setItem("vz-dir", v); },
    get theme() { return localStorage.getItem("vz-theme") || "light"; },
    set theme(v) { localStorage.setItem("vz-theme", v); },
  };
  const applyDir = v => { root.setAttribute("data-dir", v); document.querySelectorAll("[data-dir-btn]").forEach(b => b.setAttribute("aria-pressed", b.dataset.dirBtn === v)); store.dir = v; };
  const applyTheme = v => { root.setAttribute("data-theme", v); store.theme = v; };
  applyDir(store.dir); applyTheme(store.theme);
  document.querySelectorAll("[data-dir-btn]").forEach(b => b.addEventListener("click", () => applyDir(b.dataset.dirBtn)));
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

- [ ] **Step 2: Verify no gallery/lead references remain**

```bash
grep -n 'gallery\|leadImg\|discover\|gloading\|journalBtn' \
  /data/sync/vztravel/vzsolov.github.io/assets/trip.js
```

Expected: no output.

- [ ] **Step 3: Verify loadJournal and shots are present**

```bash
grep -n 'loadJournal\|const shots' /data/sync/vztravel/vzsolov.github.io/assets/trip.js
```

Expected: 2 lines — one `const shots = []` and one `loadJournal`.

- [ ] **Step 4: Commit**

```bash
cd /data/sync/vztravel/vzsolov.github.io
git add assets/trip.js
git commit -m "feat: replace gallery with journal loader in trip.js"
```

---

## Task 3: Create tools/convert_journal.py

**Files:**
- Create: `tools/convert_journal.py`

- [ ] **Step 1: Install beautifulsoup4**

```bash
pip install beautifulsoup4
```

Expected: `Successfully installed beautifulsoup4-...` (or "already satisfied").

- [ ] **Step 2: Create tools/ directory and write the script**

```bash
mkdir -p /data/sync/vztravel/vzsolov.github.io/tools
```

Write this exact content to `/data/sync/vztravel/vzsolov.github.io/tools/convert_journal.py`:

```python
#!/usr/bin/env python3
"""
convert_journal.py — Convert Google Docs HTML exports to VZsolov journal format.

Usage (from repo root):
    python3 tools/convert_journal.py path/to/journal.html [...]

Modifies files in-place. Journal files live two levels deep (YEAR/country/file.html)
so ../../assets/ correctly resolves to the repo's assets/ directory.

Already-converted files (containing 'journal-prose') are skipped.
To re-convert, restore the original first:
    git checkout -- path/to/file.html
"""

import sys
from pathlib import Path
from bs4 import BeautifulSoup

FONTS = (
    "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;"
    "0,6..72,500;1,6..72,400;1,6..72,500&family=Playfair+Display:ital,wght@0,500;"
    "0,600;0,700;1,500&family=Spectral:ital,wght@0,400;0,500;0,600;1,500&family="
    "Hanken+Grotesk:wght@400;500;600;700&family=Karla:wght@400;500;600;700&family="
    "Caveat:wght@500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap"
)

CBAR = """\
  <div class="cbar">
    <a class="backlink" href="../../index.html">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"></path></svg>
      The Archive
    </a>
    <button class="iconbtn" id="themeBtn" title="Toggle light / dark" aria-label="Toggle light or dark theme">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4.2"></circle>
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"></path>
      </svg>
    </button>
  </div>"""

THEME_SCRIPT = """\
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
  </script>"""


def convert_file(path: Path) -> None:
    raw = path.read_text(encoding="utf-8")

    if "journal-prose" in raw:
        print(f"  skip (already converted): {path}")
        return

    soup = BeautifulSoup(raw, "html.parser")
    body = soup.find("body")
    if not body:
        print(f"  skip (no body tag found): {path}")
        return

    # 1. Unwrap all <span> elements — keep text/children, discard tag
    for span in body.find_all("span"):
        span.unwrap()

    # 2. Convert image-only <p> tags to <figure>
    for p in body.find_all("p"):
        imgs = p.find_all("img")
        if imgs and not p.get_text(strip=True):
            figure = soup.new_tag("figure")
            for img in imgs:
                clean = soup.new_tag("img")
                clean["src"] = img.get("src", "")
                clean["alt"] = img.get("alt", "")
                clean["loading"] = "lazy"
                figure.append(clean)
            p.replace_with(figure)

    # 3. Wrap any remaining bare <img> tags (not already in <figure>) in <figure>
    for img in body.find_all("img"):
        if img.parent and img.parent.name != "figure":
            figure = soup.new_tag("figure")
            clean = soup.new_tag("img")
            clean["src"] = img.get("src", "")
            clean["alt"] = img.get("alt", "")
            clean["loading"] = "lazy"
            img.replace_with(figure)
            figure.append(clean)

    # 4. Strip class and style attributes — keep only content-relevant attributes
    KEEP = {"src", "alt", "href", "loading", "target", "rel"}
    for tag in body.find_all(True):
        tag.attrs = {k: v for k, v in tag.attrs.items() if k in KEEP}

    # 5. Remove empty <p> tags
    for p in body.find_all("p"):
        if not p.get_text(strip=True) and not p.find("img"):
            p.decompose()

    # 6. Extract title from first <h1>, fall back to filename stem
    h1 = body.find("h1")
    title = h1.get_text(strip=True) if h1 else path.stem

    content = body.decode_contents().strip()

    output = f"""<!DOCTYPE html>
<html lang="en" data-dir="atlas" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>{title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="{FONTS}" rel="stylesheet" />
  <link href="../../assets/home.css" rel="stylesheet" />
  <link href="../../assets/journal.css" rel="stylesheet" />
</head>
<body>
{CBAR}
  <main class="wrap">
    <article class="journal-prose">
{content}
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
{THEME_SCRIPT}
</body>
</html>
"""
    path.write_text(output, encoding="utf-8")
    print(f"  converted: {path}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    for arg in sys.argv[1:]:
        p = Path(arg)
        if not p.exists():
            print(f"  not found: {p}")
        else:
            convert_file(p)


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Test the script on one journal file (dry run)**

```bash
cd /data/sync/vztravel/vzsolov.github.io
python3 tools/convert_journal.py 2024/greece/greece24.html
```

Expected output: `  converted: 2024/greece/greece24.html`

- [ ] **Step 4: Verify the converted file has the right structure**

```bash
grep -c 'journal-prose\|assets/journal.css\|loading="lazy"' \
  /data/sync/vztravel/vzsolov.github.io/2024/greece/greece24.html
```

Expected: `3`

- [ ] **Step 5: Verify image paths are still relative (not broken by script)**

```bash
grep -o 'src="[^"]*"' /data/sync/vztravel/vzsolov.github.io/2024/greece/greece24.html | head -3
```

Expected: lines like `src="images/image38.jpg"` (relative paths preserved for standalone use).

- [ ] **Step 6: Verify the idempotency guard — running again skips the file**

```bash
python3 tools/convert_journal.py 2024/greece/greece24.html
```

Expected output: `  skip (already converted): 2024/greece/greece24.html`

- [ ] **Step 7: Commit**

```bash
cd /data/sync/vztravel/vzsolov.github.io
git add tools/convert_journal.py 2024/greece/greece24.html
git commit -m "feat: add convert_journal.py, convert greece24 as proof of concept"
```

---

## Task 4: Regenerate all 21 trip wrapper HTML files

**Files:**
- Regenerate: all 21 root-level trip `.html` wrapper files

The wrappers need three changes from the previous version:
1. Add `<link href="assets/journal.css" rel="stylesheet" />` to `<head>`
2. Remove the `<figure class="lead">` and gallery `<section>` from `<main>`
3. Replace them with `<section class="journal-section"><div id="journal"><div id="jloading">…</div></div></section>`

Run this bash script from the repo root:

- [ ] **Step 1: Run the generation script**

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
  <link href="assets/journal.css" rel="stylesheet" />
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

    <section class="journal-section">
      <div id="journal">
        <div id="jloading"><span class="spin"></span> Loading journal…</div>
      </div>
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

- [ ] **Step 2: Verify journal.css link is present in all 21 wrappers**

```bash
grep -l 'assets/journal.css' /data/sync/vztravel/vzsolov.github.io/*.html \
  | grep -v 'about\|contact\|index' | wc -l
```

Expected: `21`

- [ ] **Step 3: Verify no gallery or lead elements remain**

```bash
grep -l 'id="gallery"\|id="leadImg"\|id="gloading"' \
  /data/sync/vztravel/vzsolov.github.io/*.html
```

Expected: no output.

- [ ] **Step 4: Verify journal section is present**

```bash
grep -c 'id="journal"' /data/sync/vztravel/vzsolov.github.io/greece24.html
```

Expected: `1`

- [ ] **Step 5: Commit**

```bash
cd /data/sync/vztravel/vzsolov.github.io
git add czechia24.html cyprus24.html greece24.html holland23.html corfu23.html \
        romania23.html austira22.html iceland22.html greece20.html france19.html \
        greece19.html austira18.html montenegro18.html greece17.html lapland17.html \
        thailand16.html georgia15.html iceland14.html norway13.html ireland12.html \
        praga12.html
git commit -m "feat: update all 21 trip wrappers with journal section"
```

---

## Task 5: Convert all remaining 20 journal HTML files

**Files:**
- Convert: all journal HTML files listed in `assets/trips.js` except `2024/greece/greece24.html` (already done in Task 3)

- [ ] **Step 1: Run convert_journal.py on the remaining 20 journal files**

```bash
cd /data/sync/vztravel/vzsolov.github.io
python3 tools/convert_journal.py \
  2024/czechia/czechia24.html \
  2024/cyprus/cyprus24.html \
  2023/holland/holland23.html \
  2023/corfu/corfu.html \
  2023/romania/romania.html \
  2022/austria/austria22.html \
  2022/iceland/iceland22.html \
  2020/greece/greece_20.html \
  2019/france/france19.html \
  2019/greece/greece19.html \
  2018/austria/austria18.html \
  2018/montenegro/montenegro18.html \
  2017/greece/greece17.html \
  2017/lapland/lapland17.html \
  2016/thailand/thailand16.html \
  2015/georgia/georgia15.html \
  2014/iceland/iceland2014.html \
  2013/norway/norway13.html \
  2012/ireland/ireland12.html \
  2012/praga/praga12.html
```

Expected: 20 lines of `  converted: path/to/file.html`

- [ ] **Step 2: Verify all 21 journal files now contain journal-prose**

```bash
grep -rl 'journal-prose' /data/sync/vztravel/vzsolov.github.io/20* | wc -l
```

Expected: `21`

- [ ] **Step 3: Spot-check a converted file for correct structure**

```bash
grep -n 'journal-prose\|loading="lazy"\|assets/journal.css\|../../assets/home.css' \
  /data/sync/vztravel/vzsolov.github.io/2023/corfu/corfu.html | head -8
```

Expected: lines showing each of those strings present.

- [ ] **Step 4: Verify image count in a converted file matches expectations**

```bash
grep -c 'loading="lazy"' /data/sync/vztravel/vzsolov.github.io/2024/greece/greece24.html
```

Expected: `66` (the 66 images we confirmed earlier in the Greece journal).

- [ ] **Step 5: Commit**

```bash
cd /data/sync/vztravel/vzsolov.github.io
git add 2024/ 2023/ 2022/ 2020/ 2019/ 2018/ 2017/ 2016/ 2015/ 2014/ 2013/ 2012/
git commit -m "feat: convert all 20 remaining journal HTML files to new design"
```

---

## Self-Review

**Spec coverage:**
- ✅ `assets/journal.css` — Task 1
- ✅ `assets/trip.js` rewrite (remove gallery, add `loadJournal`, move `shots` to IIFE scope) — Task 2
- ✅ `tools/convert_journal.py` with idempotency guard — Task 3
- ✅ All 21 trip wrappers regenerated (journal.css link, `#journal` div, no lead/gallery) — Task 4
- ✅ All 21 journal HTML files converted — Tasks 3 + 5
- ✅ Script stored in repo for future trips — Task 3

**No placeholders:** All steps contain exact code, commands, and expected output.

**Type consistency:** `shots` declared as `const shots = []` in Task 2 (trip.js IIFE scope); `loadJournal()` calls `shots.length = 0` and `shots.push(...)` — consistent. `openLB(i)` called from `loadJournal()` and defined in lightbox section — consistent (both in same IIFE). `#journal` and `#jloading` referenced in trip.js match the HTML added in Task 4.
