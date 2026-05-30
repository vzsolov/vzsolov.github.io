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
