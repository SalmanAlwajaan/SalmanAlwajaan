(function () {
  "use strict";

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

  /* ---------------- Projects ---------------- */
  function renderProjects(projects) {
    var grid = document.getElementById("project-grid");
    if (!grid) return;

    if (!projects || projects.length === 0) {
      grid.innerHTML = '<p class="empty-state">No projects yet. Add entries to data/projects.json to see them here.</p>';
      return;
    }

    grid.innerHTML = projects
      .map(function (p, i) {
        var image = p.image
          ? '<img class="project-card-image" src="' + escapeHtml(p.image) + '" alt="" loading="lazy" width="800" height="600">'
          : "";
        return (
          '<article class="project-card reveal" style="animation-delay:' + (i * 60) + 'ms">' +
          image +
          '<div class="project-card-body">' +
          "<h3 class=\"project-card-title\">" + escapeHtml(p.title) + "</h3>" +
          "<p class=\"project-card-desc\">" + escapeHtml(p.description) + "</p>" +
          '<a class="project-card-link" href="' + escapeHtml(p.url) + '" target="_blank" rel="noopener noreferrer">' +
          "View project " + externalLinkIcon +
          "</a>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  /* ---------------- Articles ---------------- */
  function renderArticles(articles) {
    var list = document.getElementById("article-list");
    if (!list) return;

    if (!articles || articles.length === 0) {
      list.innerHTML = '<p class="empty-state">No articles yet. Add entries to data/articles.json to see them here.</p>';
      return;
    }

    list.innerHTML = articles
      .map(function (a, i) {
        return (
          '<a class="article-row reveal" style="animation-delay:' + (i * 50) + 'ms" href="' +
          escapeHtml(a.url) + '" target="_blank" rel="noopener noreferrer">' +
          '<span class="article-title">' + escapeHtml(a.title) + "</span>" +
          '<span class="article-meta"><span class="article-source">' + escapeHtml(a.source) +
          "</span> &middot; " + formatDate(a.date) + "</span>" +
          "</a>"
        );
      })
      .join("");
  }

  /* ---------------- Load data ---------------- */
  function loadJSON(path) {
    return fetch(path).then(function (res) {
      if (!res.ok) throw new Error("Failed to load " + path);
      return res.json();
    });
  }

  loadJSON("data/projects.json")
    .then(renderProjects)
    .catch(function () {
      var grid = document.getElementById("project-grid");
      if (grid) grid.innerHTML = '<p class="empty-state">Could not load projects right now.</p>';
    });

  loadJSON("data/articles.json")
    .then(renderArticles)
    .catch(function () {
      var list = document.getElementById("article-list");
      if (list) list.innerHTML = '<p class="empty-state">Could not load articles right now.</p>';
    });
})();
