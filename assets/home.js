/* =========================================================================
   VZsolov Trip Repo — home page logic
   ========================================================================= */
(function () {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const el = (t, cls, html) => { const e = document.createElement(t); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  /* ---- persisted direction + theme ---- */
  const store = {
    get dir() { return localStorage.getItem("vz-dir") || "atlas"; },
    set dir(v) { localStorage.setItem("vz-dir", v); },
    get theme() { return localStorage.getItem("vz-theme") || "light"; },
    set theme(v) { localStorage.setItem("vz-theme", v); },
  };
  function applyDir(v) { root.setAttribute("data-dir", v); document.querySelectorAll("[data-dir-btn]").forEach(b => b.setAttribute("aria-pressed", b.dataset.dirBtn === v)); store.dir = v; }
  function applyTheme(v) { root.setAttribute("data-theme", v); store.theme = v; const t = $("#themeLabel"); if (t) t.textContent = v === "dark" ? "Dark" : "Light"; }
  applyDir(store.dir); applyTheme(store.theme);

  /* ---- stats ---- */
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

  /* ---- map pins ---- */
  const map = $("#map");
  if (map) {
    const LON0 = -25, LON1 = 105, LAT0 = 10, LAT1 = 70;
    const counts = {};
    TRIPS.forEach(t => counts[t.country] = (counts[t.country] || 0) + 1);
    PLACES.forEach(p => {
      const x = ((p.lon - LON0) / (LON1 - LON0)) * 100;
      const y = ((LAT1 - p.lat) / (LAT1 - LAT0)) * 100;
      const pin = el("div", "pin" + (counts[p.country] > 1 ? " big" : ""));
      pin.style.left = x + "%"; pin.style.top = y + "%";
      pin.innerHTML = `<span class="lbl">${p.country}${counts[p.country] > 1 ? " · " + counts[p.country] : ""}</span><span class="dot"></span>`;
      map.appendChild(pin);
    });
  }

  /* ---- timeline ---- */
  const tl = $("#timeline");
  if (tl) YEARS.forEach(year => {
    const trips = TRIPS.filter(t => t.year === year);
    const row = el("article", "year-row reveal");
    row.id = `y${year}`;
    const head = el("div", "year-head");
    head.innerHTML = `<div class="y">${year}</div><div class="y-meta">${trips.length} trip${trips.length > 1 ? "s" : ""}</div>`;
    const grid = el("div", "grid");
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
    row.appendChild(head); row.appendChild(grid);
    tl.appendChild(row);
  });

  /* ---- controls ---- */
  document.querySelectorAll("[data-dir-btn]").forEach(b => b.addEventListener("click", () => applyDir(b.dataset.dirBtn)));
  const tBtn = $("#themeBtn");
  if (tBtn) tBtn.addEventListener("click", () => applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"));

  /* ---- reveal on scroll ---- */
  const io = new IntersectionObserver((ents) => {
    ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach(n => io.observe(n));
})();
