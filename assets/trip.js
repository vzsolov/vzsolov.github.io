/* =========================================================================
   Trip detail / gallery logic
   URL:  czechia24.html  (window.TRIP_ID = "czechia24" set before this script)
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
  const journalBtn = trip.journal
    ? `<a class="btn primary" href="${trip.journal}" target="_blank" rel="noopener">${GRID} Open full journal</a>`
    : "";
  $("#actions").innerHTML = filmBtns + journalBtn +
    `<a class="btn" href="index.html">${GRID} All trips</a>`;

  /* ---- lead image ---- */
  const leadUrl = BASE + trip.img;
  const leadImg = $("#leadImg");
  leadImg.src = leadUrl;
  leadImg.alt = `${trip.title} ${trip.year}`;

  /* ---- gallery auto-discovery ---- */
  const base = leadUrl.replace(/[^/]+$/, "");          // …/images/
  const gallery = $("#gallery");
  const loading = $("#gloading");
  const shots = [leadUrl];                              // lightbox list (lead first)
  $("#lead").addEventListener("click", () => openLB(0));

  const nm = (i, pad) => "image" + String(i).padStart(pad, "0");
  const test = url => new Promise(res => { const im = new Image(); im.onload = () => res(true); im.onerror = () => res(false); im.src = url; });

  function addFigure(n, url) {
    if (url === leadUrl) return;                        // skip duplicate of lead
    const i = shots.length; shots.push(url);
    const fig = el("figure");
    fig.innerHTML = `<span class="fno">${String(n).padStart(2, "0")}</span>`;
    const im = el("img"); im.loading = "lazy"; im.src = url; im.alt = `${trip.title} ${trip.year} — ${n}`;
    im.addEventListener("load", () => requestAnimationFrame(() => fig.classList.add("in")));
    fig.appendChild(im);
    fig.addEventListener("click", () => openLB(i));
    gallery.appendChild(fig);
  }

  (async function discover() {
    const MAX = 120, STOP = 6;
    let pad = null, ext = null, start = 0;
    // find the first existing file + lock the naming scheme
    outer:
    for (let i = 0; i <= 4; i++)
      for (const p of [1, 2, 3])
        for (const e of [".jpg", ".JPG", ".jpeg", ".png"]) {
          if (await test(base + nm(i, p) + e)) { pad = p; ext = e; start = i; break outer; }
        }
    if (pad === null) { loading.remove(); fallback(); return; }

    addFigure(start, base + nm(start, pad) + ext);
    let miss = 0;
    for (let i = start + 1; i <= start + MAX; i++) {
      const url = base + nm(i, pad) + ext;
      if (await test(url)) { addFigure(i, url); miss = 0; }
      else { if (++miss >= STOP) break; }
    }
    loading.remove();
    if (shots.length > 1) $("#gcount").textContent = `${shots.length} photographs`;
    else fallback();

    function fallback() {
      $("#gcount").textContent = trip.journal ? "On the journal page" : "No photographs found";
      if (!trip.journal) return;
      const box = el("div", "gfallback");
      box.innerHTML =
        `<p>The full photo set for <b>${trip.title} ${trip.year}</b> lives on the original journal page.</p>` +
        `<a class="btn primary" href="${trip.journal}" target="_blank" rel="noopener">${GRID} Open full journal ↗</a>`;
      gallery.after(box);
    }
  })();

  /* ---- prev / next trip ---- */
  const later = TRIPS[idx - 1];   // newer
  const earlier = TRIPS[idx + 1]; // older
  const navHTML = (t, dir, cls) => t
    ? `<a class="${cls}" href="${t.page}"><span class="dir">${dir}</span><span class="ttl">${t.title}&nbsp;’${String(t.year).slice(2)}</span></a>`
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
