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
