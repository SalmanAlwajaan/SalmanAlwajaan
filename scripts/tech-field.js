/* ---------------------------------------------------------
   Tech field: floating background line-figures.
   Reads <symbol> ids from the sprite in index.html and scatters
   <use> instances across three fixed depth layers behind the
   page content. Purely decorative — see styles/main.css for the
   companion CSS block (search "Tech field").

   Tune density from FIGURE_CAP below. Add/remove a figure by
   editing the TECH_FIGURES array (id must match a <symbol id>).
--------------------------------------------------------- */
(function () {
  "use strict";

  var root = document.documentElement;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isOff() {
    return root.getAttribute("data-tech-field") === "off";
  }

  /* Cap the figure count at the widest breakpoint here; other
     breakpoints scale down from it. */
  var FIGURE_CAP = 46;

  function countForWidth(w) {
    if (w >= 1200) return FIGURE_CAP; // ~46
    if (w >= 480) return 26;
    return 15;
  }

  /* One entry per <symbol> in the index.html sprite. Every figure
     carries the same weight so the scatter is evenly distributed —
     bump an individual weight only if you want that one figure to
     show up more often than the rest. */
  var TECH_FIGURES = [
    { id: "tech-solar-panel-1", weight: 1 },
    { id: "tech-sun-rays", weight: 1 },
    { id: "tech-pylon", weight: 3 },
    { id: "tech-power-lines", weight: 1 },
    { id: "tech-wind-turbine", weight: 1 },
    { id: "tech-fixed-wing", weight: 5 },
    { id: "tech-battery", weight: 1 },
    { id: "tech-solar-thermal", weight: 1 },
    { id: "tech-heat-exchanger", weight: 1 },
    { id: "tech-hydrogen-tank", weight: 1 },
    { id: "tech-ev-charger", weight: 1 },
    { id: "tech-inverter", weight: 1 },
    { id: "tech-smart-meter", weight: 1 },
    { id: "tech-ac-source", weight: 1 },
    { id: "tech-resistor", weight: 1 },
    { id: "tech-capacitor", weight: 1 },
    { id: "tech-inductor", weight: 1 },
    { id: "tech-ground", weight: 1 },
    { id: "tech-transformer", weight: 3 },
    { id: "tech-diode", weight: 1 },
    { id: "tech-led", weight: 1 },
    { id: "tech-transistor", weight: 1 },
    { id: "tech-opamp", weight: 1 },
    { id: "tech-and-gate", weight: 1 },
    { id: "tech-or-gate", weight: 1 },
    { id: "tech-not-gate", weight: 1 },
    { id: "tech-ic-chip", weight: 1 },
    { id: "tech-pcb-trace", weight: 1 },
    { id: "tech-gear-small", weight: 1 },
    { id: "tech-gear-medium", weight: 1 },
    { id: "tech-gear-large", weight: 1 },
    { id: "tech-robot-arm", weight: 1 },
    { id: "tech-rover", weight: 1 },
    { id: "tech-gauge", weight: 1 },
    { id: "tech-protractor-arc", weight: 1 },
    { id: "tech-control-block", weight: 1 },
    { id: "tech-sine-wave", weight: 1 },
    { id: "tech-square-wave", weight: 1 },
    { id: "tech-pulse-train", weight: 1 },
    { id: "tech-wifi-arcs", weight: 1 },
    { id: "tech-dashed-path", weight: 1 }
  ];

  var WEIGHT_TOTAL = TECH_FIGURES.reduce(function (sum, f) {
    return sum + f.weight;
  }, 0);

  /* Fixed seed: layout is stable across reloads for a given
     viewport width, not fresh Math.random() each load. */
  var SEED = 20260831;

  function mulberry32(seed) {
    var s = seed;
    return function () {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pickFigure(rand) {
    var r = rand() * WEIGHT_TOTAL;
    for (var i = 0; i < TECH_FIGURES.length; i++) {
      r -= TECH_FIGURES[i].weight;
      if (r <= 0) return TECH_FIGURES[i];
    }
    return TECH_FIGURES[TECH_FIGURES.length - 1];
  }

  var LAYERS = [
    { name: "far", share: 0.4, size: [40, 72], opacity: 0.65, duration: [100, 140], depth: 0.15 },
    { name: "mid", share: 0.35, size: [72, 112], opacity: 0.9, duration: [80, 115], depth: 0.3 },
    { name: "near", share: 0.25, size: [112, 160], opacity: 1.15, duration: [60, 95], depth: 0.5 }
  ];

  var container = null;
  var layerEls = [];
  var initialized = false;
  var parallaxTicking = false;
  var resizeTimer = null;
  var lastBucket = null;

  function widthBucket(w) {
    if (w >= 1200) return "desktop";
    if (w >= 480) return "tablet";
    return "mobile";
  }

  function isInQuietColumn(xPct, vw) {
    /* Content lives in a centered column (max-width 800px). Keep
       that band clear-ish so text never sits under a figure at
       full strength. Below ~640px the column IS basically the
       whole viewport (only ~20-24px gutters either side), so
       quieting it there would mean quieting nearly every figure —
       skip the check on narrow screens and lean on low base
       opacity + lower density instead. */
    if (vw < 640) return false;
    var halfColumnPx = Math.min(300, vw * 0.26);
    var xPx = (xPct / 100) * vw;
    var centerPx = vw / 2;
    return Math.abs(xPx - centerPx) < halfColumnPx;
  }

  function shuffle(arr, rand) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function buildLayer(rand, layerDef, cellList, cols, rows, vw, vh, idPositions) {
    var frag = document.createDocumentFragment();
    /* Same-figure repeats must land much further apart than a single
       grid cell, so the same icon never reads as "doubled up" nearby. */
    var minSameIdDist = Math.min(vw, vh) * 0.35;
    var cellWPct = 100 / cols;
    var cellHPct = 100 / rows;

    for (var i = 0; i < cellList.length; i++) {
      var cell = cellList[i];
      var size = layerDef.size[0] + rand() * (layerDef.size[1] - layerDef.size[0]);

      /* One figure per grid cell, jittered within the cell so the
         layout still reads as organic scatter, not a rigid grid —
         but coverage stays even across the whole viewport instead
         of clumping wherever pure chance happened to land. */
      var x = (cell[1] + 0.18 + rand() * 0.64) * cellWPct;
      var y = (cell[0] + 0.18 + rand() * 0.64) * cellHPct;
      var xPxFinal = (x / 100) * vw;
      var yPxFinal = (y / 100) * vh;

      var figure = null;
      for (var fAttempt = 0; fAttempt < 8; fAttempt++) {
        var candidate = pickFigure(rand);
        var existing = idPositions[candidate.id] || [];
        var tooCloseToSameId = existing.some(function (p) {
          var dx2 = xPxFinal - p[0];
          var dy2 = yPxFinal - p[1];
          return Math.sqrt(dx2 * dx2 + dy2 * dy2) < minSameIdDist;
        });
        if (!tooCloseToSameId) {
          figure = candidate;
          break;
        }
      }
      if (!figure) figure = pickFigure(rand);
      if (!idPositions[figure.id]) idPositions[figure.id] = [];
      idPositions[figure.id].push([xPxFinal, yPxFinal]);

      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "tech-figure tech-figure--" + layerDef.name);
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      svg.setAttribute("viewBox", "0 0 64 64");

      var isAccent = rand() < 1 / 8;
      if (isAccent) svg.classList.add("tech-figure--accent");
      if (isInQuietColumn(x, vw)) svg.classList.add("tech-figure--quiet");

      var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      use.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#" + figure.id);
      use.setAttribute("href", "#" + figure.id);
      svg.appendChild(use);

      var duration = layerDef.duration[0] + rand() * (layerDef.duration[1] - layerDef.duration[0]);
      var delay = -rand() * duration;
      var tx = (rand() * 6 - 3).toFixed(2);
      var ty = (rand() * 6 - 3).toFixed(2);
      var rot = (rand() * 8 - 4).toFixed(2);

      svg.style.left = x.toFixed(2) + "%";
      svg.style.top = y.toFixed(2) + "%";
      svg.style.width = size.toFixed(0) + "px";
      svg.style.height = size.toFixed(0) + "px";
      svg.style.setProperty("--tf-opacity", layerDef.opacity.toFixed(2));
      svg.style.setProperty("--tf-duration", duration.toFixed(1) + "s");
      svg.style.setProperty("--tf-delay", delay.toFixed(1) + "s");
      svg.style.setProperty("--tf-tx", tx + "%");
      svg.style.setProperty("--tf-ty", ty + "%");
      svg.style.setProperty("--tf-rot", rot + "deg");

      frag.appendChild(svg);
    }

    return frag;
  }

  function generate() {
    if (!container || isOff()) return;

    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var total = countForWidth(vw);
    var rand = mulberry32(SEED);
    var idPositions = {};

    layerEls.forEach(function (el) {
      el.innerHTML = "";
    });

    /* Jittered grid: divide the viewport into cells (aspect-aware),
       shuffle them with the seeded RNG, and hand each layer its
       share. This is what actually guarantees even coverage —
       plain random x/y sampling looks clumpy in some spots and
       empty in others no matter how many rejection-sampling
       attempts you allow. */
    var aspect = vw / vh;
    var cols = Math.max(1, Math.round(Math.sqrt(total * aspect)));
    var rows = Math.max(1, Math.ceil(total / cols));
    var cells = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        cells.push([r, c]);
      }
    }
    shuffle(cells, rand);
    cells = cells.slice(0, total);

    var idx = 0;
    LAYERS.forEach(function (layerDef, i) {
      var count = Math.round(total * layerDef.share);
      var layerCells = cells.slice(idx, idx + count);
      idx += count;
      var frag = buildLayer(rand, layerDef, layerCells, cols, rows, vw, vh, idPositions);
      layerEls[i].appendChild(frag);
    });

    lastBucket = widthBucket(vw);
  }

  function updateParallax() {
    if (prefersReducedMotion() || isOff()) {
      parallaxTicking = false;
      return;
    }
    var y = window.scrollY;
    LAYERS.forEach(function (layerDef, i) {
      layerEls[i].style.transform = "translateY(" + (y * layerDef.depth).toFixed(2) + "px)";
    });
    parallaxTicking = false;
  }

  function onScroll() {
    if (!parallaxTicking) {
      window.requestAnimationFrame(updateParallax);
      parallaxTicking = true;
    }
  }

  function onResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      var bucket = widthBucket(window.innerWidth);
      if (bucket !== lastBucket) generate();
    }, 220);
  }

  function init() {
    if (initialized) return;
    container = document.getElementById("tech-field");
    if (!container) return;
    initialized = true;

    LAYERS.forEach(function (layerDef) {
      var el = document.createElement("div");
      el.className = "tech-layer tech-layer--" + layerDef.name;
      container.appendChild(el);
      layerEls.push(el);
    });

    if (isOff()) return;

    generate();

    if (!prefersReducedMotion()) {
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    window.addEventListener("resize", onResize);
  }

  window.TechField = { init: init };
})();
