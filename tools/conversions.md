# ODT Trip Journal → Blog Conversion Guide

Convert a trip journal exported from lemattayel.co.il (ODT format) into a fully
formatted blog page in this repo.

---

## Requirements

```
sudo apt install libreoffice jpegoptim
pip install beautifulsoup4
```

---

## The Pipeline (3 steps)

```
slovakia2.odt
     │
     ▼
1. LibreOffice HTML export   →  /tmp/<trip>_convert/<trip>.html + images
     │
     ▼
2. preprocess_<trip>.py      →  2025/<trip>/<trip>25.html (clean) + images/image1..N.jpg
     │
     ▼
3. convert_journal.py        →  2025/<trip>/<trip>25.html (final, with journal template)
     │
     ▼
4. compress_images.sh        →  images compressed in-place
```

---

## Step 1 — LibreOffice HTML Export

```bash
mkdir /tmp/<trip>_convert
libreoffice --headless --convert-to html --outdir /tmp/<trip>_convert adds/<trip>2.odt
```

LibreOffice renames all images as `<trip>_html_<last8hex>.jpg` (or `.png`).  
It also dumps junk divs (ads, taboola, dropdown menus) into the HTML — the
preprocessing step removes these.

---

## Step 2 — Preprocessing Script

Create `/tmp/preprocess_<trip>.py` based on the template below.  
Two things to customise per trip:

**a) SKIP_SRC** — images to exclude (not content):
- **Profile pic**: always `4,506 bytes`. Find it with:
  ```bash
  ls -la /tmp/<trip>_convert/*.jpg | sort -k5 -n | head -5
  ```
  The smallest file is the profile pic. Add its filename to `SKIP_SRC`.
- **Logo PNG** (if present): also small, usually ~9,625 bytes. Same method.

**b) Path constants** — `SRC_HTML`, `OUT_DIR`, `OUT_HTML` — match to trip year and slug.

### Preprocessing script template

```python
#!/usr/bin/env python3
import re, shutil
from pathlib import Path
from bs4 import BeautifulSoup

TRIP      = "slovakia"        # change per trip
YEAR      = "2025"
SRC_HTML  = Path(f"/tmp/{TRIP}_convert/{TRIP}2.html")
SRC_IMG_DIR = Path(f"/tmp/{TRIP}_convert")
OUT_DIR   = Path(f"/data/sync/vztravel/vzsolov.github.io/{YEAR}/{TRIP}")
IMG_OUT_DIR = OUT_DIR / "images"
OUT_HTML  = OUT_DIR / f"{TRIP}{YEAR[2:]}.html"

# Profile pic (4506 bytes) — find with: ls -la /tmp/<trip>_convert/*.jpg | sort -k5 -n | head -5
SKIP_SRC = {f"{TRIP}2_html_7e0a218d.jpg"}  # update suffix per trip

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    IMG_OUT_DIR.mkdir(parents=True, exist_ok=True)

    soup = BeautifulSoup(SRC_HTML.read_text(encoding="utf-8"), "html.parser")
    body = soup.find("body")

    # Remove ad/junk divs
    for div in body.find_all("div"):
        if isinstance(div.attrs, dict) and any(
            div.attrs.get("id", "").startswith(p)
            for p in ("dropdown-", "gpt-banner-", "taboola-", "google_ads_",
                      "trc_", "outer_", "rbox-", "internal_", "_cm-")
        ):
            div.decompose()

    for addr in body.find_all("address"):
        addr.decompose()

    for img in body.find_all("img"):
        if img.get("name", "").startswith("Object") or img.get("src", "") in SKIP_SRC:
            img.decompose()

    for p in body.find_all("p"):
        if re.match(r"^\d+$", p.get_text(strip=True)) and not p.find("img"):
            p.decompose()

    for font in body.find_all("font"):
        font.unwrap()

    for img in body.find_all("img"):
        if img.get("src", "").startswith("http"):
            img.decompose()

    # Renumber images in document order
    src_to_new, counter = {}, 0
    for img in body.find_all("img"):
        src = img.get("src", "")
        if not src:
            continue
        if src not in src_to_new:
            counter += 1
            src_to_new[src] = f"images/image{counter}.jpg"
        img["src"] = src_to_new[src]

    # Write clean HTML (no template yet)
    content = body.decode_contents().strip()
    OUT_HTML.write_text(
        f"<html><head><title></title></head><body>{content}</body></html>",
        encoding="utf-8"
    )
    print(f"Wrote {OUT_HTML}")

    # Clear and repopulate images dir
    for f in IMG_OUT_DIR.iterdir():
        f.unlink()
    for old_src, new_rel in src_to_new.items():
        src_file = SRC_IMG_DIR / old_src
        dst_file = IMG_OUT_DIR / Path(new_rel).name
        if src_file.exists():
            shutil.copy2(src_file, dst_file)
            print(f"  {old_src} -> {dst_file.name}")
        else:
            print(f"  WARNING: {src_file} not found")

    print(f"\n{counter} images written to {IMG_OUT_DIR}")

if __name__ == "__main__":
    main()
```

Run it:
```bash
python3 /tmp/preprocess_<trip>.py
```

---

## Step 3 — Apply Journal Template

```bash
# from repo root
python3 tools/convert_journal.py 2025/<trip>/<trip>25.html
```

`convert_journal.py` wraps the clean body content in the full page template
(fonts, CSS links, theme toggle, navbar).  
**It skips files that already contain `journal-prose`** — so always run the
preprocessor first to get a clean file before running this.

---

## Step 4 — Compress Images

```bash
bash compress_images.sh 2025/<trip>
```

Uses `jpegoptim --max=80 --strip-all`. Tracks processed files in
`.compressed_images.log` by `size:mtime` so already-compressed images are
never re-processed unless the file changes.

---

## Verify the Result

```python
import re
from pathlib import Path

html = Path("2025/<trip>/<trip>25.html").read_text()
nums = sorted(int(x) for x in re.findall(r"images/image(\d+)\.jpg", html))
print(f"img tags: {len(nums)}  range: {nums[0]}-{nums[-1]}")
gaps = [x for x in range(1, nums[-1]+1) if x not in nums]
print(f"gaps: {gaps or 'none'}")
```

Also verify the ODT count matches:
```python
import zipfile, re

SKIP_SIZE = {4506}  # profile pic bytes
with zipfile.ZipFile("adds/<trip>2.odt") as z:
    xml = z.read("content.xml").decode()
    refs = re.findall(r'xlink:href="(Pictures/[^"]+)"', xml)
    content = [r for r in refs if z.getinfo(r).file_size not in SKIP_SIZE]
print(f"ODT content images: {len(content)}")
```

Both numbers must match.

---

## Lessons Learned

| Issue | Cause | Fix |
|---|---|---|
| ODT image count vs repo count mismatch | Profile pic and/or logo PNG included in ODT but should be skipped | Identify by file size (profile pic = 4,506 bytes, logo ≈ 9,625 bytes); add to `SKIP_SRC` |
| `<figure>` count ≠ `<img>` count | Multiple images in the same ODT paragraph become one `<figure>` with multiple `<img>` tags | Normal — always count `<img>` tags, not `<figure>` tags |
| `lxml` not available | System Python may lack it | Use `re.findall` on raw XML instead of lxml parser |
| `convert_journal.py` skips the file | File already has `journal-prose` in it | Preprocessor must write a clean (template-free) HTML; never preprocess an already-converted file |
| Inserting missing images into existing HTML | Positional shifts break text-image alignment | Always rebuild from ODT when images are added — never patch an existing page |

---

## File Locations

| File | Purpose |
|---|---|
| `adds/<trip>.odt` | Original ODT from lemattayel.co.il |
| `adds/<trip>2.odt` | Updated ODT (use this as source of truth) |
| `tools/convert_journal.py` | Applies journal page template (Google Docs HTML or preprocessed ODT HTML) |
| `compress_images.sh` | JPEG compression with change tracking |
| `/tmp/<trip>_convert/` | Temporary LibreOffice export dir (safe to delete after) |
| `/tmp/preprocess_<trip>.py` | Per-trip preprocessing script (keep for re-runs) |
