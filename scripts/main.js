(function () {
  "use strict";

  var reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  function prefersReducedMotion() {
    return reduceMotionQuery.matches;
  }

  /* ---------------- Theme toggle ---------------- */
  var root = document.documentElement;
  var toggleBtn = document.getElementById("theme-toggle");
  var STORAGE_KEY = "site-theme";

  function applyTheme(theme) {
    if (theme === "light" || theme === "dark") {
      root.setAttribute("data-theme", theme);
    } else {
      root.removeAttribute("data-theme");
    }
  }

  var savedTheme = null;
  try {
    savedTheme = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    /* localStorage unavailable, fall back to system preference */
  }
  applyTheme(savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      var current = root.getAttribute("data-theme") || (prefersDark ? "dark" : "light");
      var next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (e) {
        /* ignore */
      }
    });
  }

  /* ---------------- Helpers ---------------- */
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return escapeHtml(dateStr);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  var externalLinkIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>' +
    '<path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg>';

  var pdfIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
    '<path d="M14 2v6h6"/></svg>';

  var folderIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>';

  /* ---------------- Scroll reveal ---------------- */
  var revealObserver = null;
  if ("IntersectionObserver" in window && !prefersReducedMotion()) {
    revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
  }

  function observeReveal(el, index) {
    if (!el) return;
    el.classList.add("reveal");
    if (typeof index === "number") {
      el.style.setProperty("--reveal-delay", Math.min(index * 70, 350) + "ms");
    }
    if (revealObserver) {
      revealObserver.observe(el);
    } else {
      el.classList.add("is-visible");
    }
  }

  document.querySelectorAll("[data-reveal]").forEach(function (el, i) {
    observeReveal(el, i % 6);
  });

  /* ---------------- Nav active link + smooth scroll ---------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));
  var navList = document.querySelector(".nav-links");
  var navIndicator = document.getElementById("nav-indicator") || document.querySelector(".nav-indicator");
  function isSamePageHash(href) {
    return typeof href === "string" && href.charAt(0) === "#";
  }

  var sections = navLinks
    .map(function (link) {
      var href = link.getAttribute("href");
      if (!isSamePageHash(href)) return null;
      return document.getElementById(href.slice(1));
    })
    .filter(Boolean);

  function moveNavIndicator(link) {
    if (!navIndicator || !navList || !link) return;
    var linkRect = link.getBoundingClientRect();
    var listRect = navList.getBoundingClientRect();
    navIndicator.style.width = linkRect.width + "px";
    navIndicator.style.transform = "translateX(" + (linkRect.left - listRect.left) + "px)";
  }

  function setActiveLink(id) {
    navLinks.forEach(function (link) {
      var isActive = link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "true");
        moveNavIndicator(link);
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  window.addEventListener("resize", function () {
    var activeLink = navLinks.filter(function (l) {
      return l.classList.contains("is-active");
    })[0];
    if (activeLink) moveNavIndicator(activeLink);
  });

  if ("IntersectionObserver" in window && sections.length) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActiveLink(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach(function (section) {
      navObserver.observe(section);
    });
  }

  var navHeightVar = getComputedStyle(root).getPropertyValue("--nav-height");
  var navHeight = parseInt(navHeightVar, 10) || 68;

  navLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      var href = link.getAttribute("href");
      if (!isSamePageHash(href)) return; /* cross-page link (e.g. uoh.html) — let the browser navigate normally */
      var id = href.slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 8;
      window.scrollTo({ top: top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      setActiveLink(id);
      history.replaceState(null, "", "#" + id);
    });
  });

  /* ---------------- Back to top ---------------- */
  var backToTop = document.getElementById("back-to-top");
  if (backToTop) {
    var ticking = false;
    function updateBackToTop() {
      backToTop.classList.toggle("is-visible", window.scrollY > 480);
      ticking = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(updateBackToTop);
          ticking = true;
        }
      },
      { passive: true }
    );
    updateBackToTop();

    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
  }

  /* ---------------- Floating background blobs: scroll parallax ---------------- */
  var blobs = Array.prototype.slice.call(document.querySelectorAll(".blob"));
  if (blobs.length && !prefersReducedMotion()) {
    var blobSpeeds = [0.06, -0.05, 0.09, -0.08];
    var blobTicking = false;
    function updateBlobParallax() {
      var y = window.scrollY;
      blobs.forEach(function (blob, i) {
        var speed = blobSpeeds[i % blobSpeeds.length];
        /* "translate" is an independent CSS property from "transform", so this
           scroll-driven offset composes cleanly with the ambient drift keyframe
           animation (which animates "transform") without either overwriting the other. */
        blob.style.translate = "0 " + y * speed + "px";
      });
      blobTicking = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!blobTicking) {
          window.requestAnimationFrame(updateBlobParallax);
          blobTicking = true;
        }
      },
      { passive: true }
    );
  }

  /* ---------------- Subtle hero parallax ---------------- */
  var heroPhoto = document.querySelector(".hero-photo");
  if (heroPhoto && !prefersReducedMotion()) {
    var parallaxTicking = false;
    function updateParallax() {
      var offset = Math.min(window.scrollY, 400);
      heroPhoto.style.transform = "translateY(" + offset * 0.08 + "px)";
      parallaxTicking = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!parallaxTicking) {
          window.requestAnimationFrame(updateParallax);
          parallaxTicking = true;
        }
      },
      { passive: true }
    );
  }

  /* ---------------- PDF preview modal ---------------- */
  var pdfModal = document.getElementById("pdf-modal");
  var pdfFrame = document.getElementById("pdf-modal-frame");
  var pdfTitleEl = document.getElementById("pdf-modal-title");
  var pdfOpenLink = document.getElementById("pdf-modal-open-link");
  var lastFocusedEl = null;

  function openPdfModal(fileUrl, title) {
    if (!pdfModal) return;
    lastFocusedEl = document.activeElement;
    /* Cache-bust: browsers aggressively cache PDFs loaded in an <iframe>,
       so without this, replacing a PDF file on disk keeps showing the old
       one until a hard refresh. A fresh query string forces a real fetch
       every time the preview opens. */
    var freshUrl = fileUrl + (fileUrl.indexOf("?") === -1 ? "?" : "&") + "v=" + Date.now();
    pdfFrame.src = freshUrl;
    pdfFrame.title = title + " (PDF preview)";
    pdfTitleEl.textContent = title;
    pdfOpenLink.href = freshUrl;
    if (typeof pdfModal.showModal === "function") {
      pdfModal.showModal();
    } else {
      pdfModal.setAttribute("open", "");
    }
  }

  function closePdfModal() {
    if (!pdfModal) return;
    if (typeof pdfModal.close === "function") {
      pdfModal.close();
    } else {
      pdfModal.removeAttribute("open");
    }
  }

  if (pdfModal) {
    pdfModal.addEventListener("click", function (e) {
      if (e.target === pdfModal) {
        closePdfModal();
      }
    });

    pdfModal.addEventListener("close", function () {
      pdfFrame.src = "";
      if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
        lastFocusedEl.focus();
      }
    });

    var closeBtn = document.getElementById("pdf-modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", closePdfModal);
    }
  }

  var viewCvBtn = document.getElementById("view-cv-btn");
  if (viewCvBtn) {
    viewCvBtn.addEventListener("click", function () {
      openPdfModal("assets/CV.pdf", "Salman Alwajaan — CV");
    });
  }

  /* ---------------- Project / certificate cards ---------------- */
  var imageWrapHtml = function (image) {
    return image
      ? '<div class="project-card-image-wrap"><img class="project-card-image" src="' +
        escapeHtml(image) +
        '" alt="" loading="lazy" width="800" height="500"></div>'
      : "";
  };

  function buildSimpleCard(p) {
    var isPdf = p.type === "pdf";
    var tag = isPdf ? "button" : "a";
    var card = document.createElement(tag);
    card.className = "project-card";

    if (isPdf) {
      card.type = "button";
    } else {
      card.href = p.url;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
    }

    var badge = isPdf
      ? '<span class="project-card-badge">' + pdfIcon + " Read PDF</span>"
      : '<span class="project-card-badge">' + externalLinkIcon + " Visit link</span>";

    var cta = isPdf
      ? '<span class="project-card-cta">Open preview ' + externalLinkIcon + "</span>"
      : '<span class="project-card-cta">Visit project ' + externalLinkIcon + "</span>";

    card.innerHTML =
      imageWrapHtml(p.image) +
      '<div class="project-card-body">' +
      '<div class="project-card-top">' +
      "<h3 class=\"project-card-title\">" + escapeHtml(p.title) + "</h3>" +
      badge +
      "</div>" +
      "<p class=\"project-card-desc\">" + escapeHtml(p.description) + "</p>" +
      cta +
      "</div>";

    if (isPdf) {
      card.addEventListener("click", function () {
        openPdfModal(p.file, p.title);
      });
    }

    return card;
  }

  function buildFolderCard(p) {
    var card = document.createElement("div");
    card.className = "project-card project-card-folder";

    var itemsHtml = (p.items || [])
      .map(function (item) {
        var isPdf = item.type === "pdf";
        var icon = isPdf ? pdfIcon : externalLinkIcon;
        var label = item.title || (isPdf ? "Document" : "Link");
        if (isPdf) {
          return (
            '<button type="button" class="folder-item" data-pdf-file="' +
            escapeHtml(item.file) +
            '" data-pdf-title="' +
            escapeHtml(item.title || p.title) +
            '">' +
            '<span class="folder-item-icon">' + icon + "</span>" +
            '<span class="folder-item-label">' + escapeHtml(label) + "</span>" +
            '<span class="folder-item-cta">' + externalLinkIcon + "</span>" +
            "</button>"
          );
        }
        return (
          '<a class="folder-item" href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener noreferrer">' +
          '<span class="folder-item-icon">' + icon + "</span>" +
          '<span class="folder-item-label">' + escapeHtml(label) + "</span>" +
          '<span class="folder-item-cta">' + externalLinkIcon + "</span>" +
          "</a>"
        );
      })
      .join("");

    card.innerHTML =
      imageWrapHtml(p.image) +
      '<div class="project-card-body">' +
      '<div class="project-card-top">' +
      "<h3 class=\"project-card-title\">" + escapeHtml(p.title) + "</h3>" +
      '<span class="project-card-badge">' + folderIcon + " " + (p.items || []).length + " items</span>" +
      "</div>" +
      "<p class=\"project-card-desc\">" + escapeHtml(p.description) + "</p>" +
      '<div class="project-card-folder-items">' + itemsHtml + "</div>" +
      "</div>";

    card.querySelectorAll(".folder-item[data-pdf-file]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openPdfModal(btn.getAttribute("data-pdf-file"), btn.getAttribute("data-pdf-title"));
      });
    });

    return card;
  }

  function buildProjectCard(p) {
    return p.type === "folder" ? buildFolderCard(p) : buildSimpleCard(p);
  }

  function buildCertificateCard(c) {
    var hasLink = !!(c.file || c.url);
    var tag = hasLink ? (c.file ? "button" : "a") : "div";
    var card = document.createElement(tag);
    card.className = "project-card" + (hasLink ? "" : " is-static");

    if (hasLink) {
      if (c.file) {
        card.type = "button";
      } else {
        card.href = c.url;
        card.target = "_blank";
        card.rel = "noopener noreferrer";
      }
    }

    var meta = [c.issuer, c.date ? formatDate(c.date) : null].filter(Boolean).join(" · ");

    card.innerHTML =
      imageWrapHtml(c.image) +
      '<div class="project-card-body">' +
      '<div class="project-card-top">' +
      "<h3 class=\"project-card-title\">" + escapeHtml(c.title) + "</h3>" +
      "</div>" +
      (meta ? "<p class=\"project-card-desc\">" + escapeHtml(meta) + "</p>" : "") +
      (hasLink
        ? '<span class="project-card-cta">' + (c.file ? "Open preview" : "View credential") + " " + externalLinkIcon + "</span>"
        : "") +
      "</div>";

    if (hasLink && c.file) {
      card.addEventListener("click", function () {
        openPdfModal(c.file, c.title);
      });
    }

    return card;
  }

  /* ---------------- Render a data-driven grid section ---------------- */
  function renderGridSection(sectionEl, gridEl, items, buildFn, emptyMessage) {
    if (!sectionEl || !gridEl) return;
    if (!items || items.length === 0) {
      if (emptyMessage) {
        /* Stays visible with a placeholder instead of hiding, so
           the section is easy to find before content is added. */
        gridEl.innerHTML = '<p class="empty-state">' + emptyMessage + "</p>";
        return;
      }
      sectionEl.style.display = "none";
      var navItem = document.getElementById("nav-item-" + sectionEl.id);
      if (navItem) navItem.style.display = "none";
      return;
    }
    gridEl.innerHTML = "";
    items.forEach(function (item, i) {
      var card = buildFn(item, i);
      gridEl.appendChild(card);
      observeReveal(card, i);
    });
  }

  function renderProjects(projects) {
    projects = projects || [];
    var bySection = {};
    projects.forEach(function (p) {
      var key = p.section || "hidden";
      if (!bySection[key]) bySection[key] = [];
      bySection[key].push(p);
    });

    renderGridSection(document.getElementById("featured"), document.getElementById("featured-grid"), bySection.featured, buildProjectCard);
    renderGridSection(document.getElementById("other"), document.getElementById("other-grid"), bySection.Other, buildProjectCard);
    renderGridSection(document.getElementById("uoh"), document.getElementById("uoh-grid"), bySection.UOH, buildProjectCard);
  }

  function renderCertificates(certificates) {
    renderGridSection(
      document.getElementById("certificates"),
      document.getElementById("certificates-grid"),
      certificates,
      buildCertificateCard,
      "No certificates added yet — add entries to data/certificates.json to see them here."
    );
  }

  /* ---------------- Load data ---------------- */
  function loadJSON(path) {
    return fetch(path).then(function (res) {
      if (!res.ok) throw new Error("Failed to load " + path);
      return res.json();
    });
  }

  Promise.all([
    loadJSON("data/projects.json").catch(function () {
      return null;
    }),
    loadJSON("data/certificates.json").catch(function () {
      return [];
    })
  ]).then(function (results) {
    var projects = results[0];
    var certificates = results[1];

    if (projects === null) {
      ["featured-grid", "other-grid", "uoh-grid"].forEach(function (id) {
        var grid = document.getElementById(id);
        if (grid) grid.innerHTML = '<p class="empty-state">Could not load projects right now.</p>';
      });
    } else {
      renderProjects(projects);
    }

    renderCertificates(certificates);

    if (window.TechField && typeof window.TechField.init === "function") {
      window.TechField.init();
    }
  });

  /* ---------------- Hero entrance ---------------- */
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      document.body.classList.add("is-loaded");
    });
  });
})();
