/* =========================================================================
   VZsolov Trip Repo — home page logic (Atlas + Leaflet collage edition)
   ========================================================================= */
(function () {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const el = (t, cls, html) => { const e = document.createElement(t); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  /* ---- persisted theme ---- */
  const store = {
    get theme() { return localStorage.getItem("vz-theme") || "light"; },
    set theme(v) { localStorage.setItem("vz-theme", v); },
  };
  function applyTheme(v) { root.setAttribute("data-theme", v); store.theme = v; if (window.__vzSwapTiles) window.__vzSwapTiles(v); }
  root.setAttribute("data-dir", "atlas");
  applyTheme(store.theme);

  /* ---- stats band ---- */
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

  /* ---- per-country trip counts ---- */
  const counts = {};
  TRIPS.forEach(t => counts[t.country] = (counts[t.country] || 0) + 1);

  /* ---- collage tiles ---- */
  const collage = $("#collage");
  const tiles = [];
  if (collage) TRIPS.forEach(t => {
    const tile = el("article", "tile");
    tile.dataset.country = t.country;
    const films = t.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join("");
    tile.innerHTML = `
      <img class="ph" loading="lazy" src="${BASE + t.img}" alt="${t.title} ${t.year}"
           onerror="this.closest('.tile').classList.add('noimg')" />
      <div class="scrim"></div>
      <a class="cover" href="${t.page}" aria-label="${t.title} ${t.year}"></a>
      <div class="tlinks">
        <a href="${t.page}">Journal</a>
        ${films}
      </div>
      <div class="meta">
        <span class="region">${t.region}</span>
        <h3>${t.title}</h3>
        <span class="yr">${t.year}</span>
      </div>`;
    collage.appendChild(tile);
    tiles.push(tile);
  });

  /* ---- filter chips ---- */
  const filtersWrap = $("#filters");
  const resultCount = $("#resultcount");
  const noResults = $("#noresults");
  const places = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
  let active = "all";

  function makeChip(key, label, count) {
    const c = el("button", "chip");
    c.dataset.key = key;
    c.setAttribute("aria-pressed", key === active);
    c.innerHTML = count != null ? `${label}<span class="ct">${count}</span>` : label;
    c.addEventListener("click", () => setFilter(key));
    return c;
  }
  if (filtersWrap) {
    filtersWrap.appendChild(makeChip("all", "All trips", TRIPS.length));
    places.forEach(p => filtersWrap.appendChild(makeChip(p, p, counts[p])));
  }

  function setFilter(key) {
    active = key;
    let shown = 0;
    tiles.forEach(tile => {
      const match = key === "all" || tile.dataset.country === key;
      tile.classList.toggle("hide", !match);
      if (match) shown++;
    });
    document.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", c.dataset.key === key));
    if (resultCount) resultCount.textContent = key === "all" ? `${TRIPS.length} journeys` : `${shown} in ${key}`;
    if (noResults) noResults.hidden = shown > 0;
    if (window.__vzHighlight) window.__vzHighlight(key);
  }

  function scrollToCollage() {
    const sec = $(".archive");
    if (!sec) return;
    const y = sec.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  /* ---- Leaflet interactive map ---- */
  const mapEl = $("#map");
  if (mapEl && window.L) {
    const TILES = {
      light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      dark:  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    };
    const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

    const map = L.map(mapEl, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
      worldCopyJump: true,
    });

    let tileLayer = L.tileLayer(TILES[store.theme] || TILES.light, {
      attribution: ATTR, maxZoom: 11, minZoom: 2, subdomains: "abcd",
    }).addTo(map);
    window.__vzSwapTiles = (theme) => { if (tileLayer) tileLayer.setUrl(TILES[theme] || TILES.light); };

    const markers = {};
    const bounds = [];
    PLACES.forEach(p => {
      if (counts[p.country] == null) return;
      const big = counts[p.country] > 1;
      const icon = L.divIcon({
        className: "",
        html: `<div class="map-pin ${big ? "big" : ""}"><span class="dot"></span></div>`,
        iconSize: [22, 22], iconAnchor: [11, 11],
      });
      const m = L.marker([p.lat, p.lon], { icon, riseOnHover: true }).addTo(map);
      const n = counts[p.country];
      m.bindTooltip(`${p.country} · ${n} trip${n > 1 ? "s" : ""}`, {
        className: "atlas-tip", direction: "top", offset: [0, -10], opacity: 1,
      });
      m.on("click", () => { setFilter(p.country); scrollToCollage(); });
      markers[p.country] = m;
      bounds.push([p.lat, p.lon]);
    });

    if (bounds.length) map.fitBounds(bounds, { padding: [38, 38] });
    else map.setView([48, 14], 4);

    map.on("click", () => map.scrollWheelZoom.enable());
    map.on("mouseout", () => map.scrollWheelZoom.disable());

    const coord = $("#coordreadout");
    const fmt = (v, pos, neg) => `${Math.abs(v).toFixed(1)}°${v >= 0 ? pos : neg}`;
    function showCenter() { const c = map.getCenter(); if (coord) coord.textContent = `${fmt(c.lat, "N", "S")} · ${fmt(c.lng, "E", "W")}`; }
    map.on("mousemove", e => { if (coord) coord.textContent = `${fmt(e.latlng.lat, "N", "S")} · ${fmt(e.latlng.lng, "E", "W")}`; });
    map.on("mouseout", showCenter);
    map.on("moveend", showCenter);
    showCenter();

    window.__vzHighlight = (key) => {
      Object.entries(markers).forEach(([country, m]) => {
        const node = m.getElement();
        if (!node) return;
        node.style.transition = "opacity .25s";
        node.style.opacity = (key === "all" || key === country) ? "1" : ".28";
      });
    };

    const fix = () => map.invalidateSize();
    setTimeout(fix, 60); setTimeout(fix, 350);
    window.addEventListener("resize", fix);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fix);
  }

  /* ---- pre-filter from ?place=Greece (e.g. back-link from trip page) ---- */
  const wanted = new URLSearchParams(location.search).get("place");
  if (wanted && places.includes(wanted)) setFilter(wanted);
  else setFilter("all");

  /* ---- theme toggle ---- */
  const tBtn = $("#themeBtn");
  if (tBtn) tBtn.addEventListener("click", () => applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"));

  /* ---- reveal on scroll ---- */
  const io = new IntersectionObserver((ents) => {
    ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach(n => io.observe(n));
})();
