/* Chandan Kumar portfolio — renders everything from data/site.json and data/projects.json.
   Edit content in the CMS (or in those two files); no code changes needed. */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var state = { site: null, projects: [], filter: "All" };

  // CMS writes media paths like "/assets/uploads/x.png". Make them relative so the
  // site works at a domain root, in a sub-folder, or on GitHub Pages.
  function asset(p) {
    if (!p) return "";
    if (/^(https?:|data:|blob:)/.test(p)) return p;
    return p.replace(/^\/+/, "");
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function md(text) {
    text = text || "";
    if (window.marked) return window.marked.parse(text, { mangle: false, headerIds: false })
      .replace(/(src|href)="\/(assets\/[^"]*)"/g, '$1="$2"');
    return text.split(/\n{2,}/).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
  }
  function initials(name) {
    return (name || "").split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase();
  }
  function chips(el, items) {
    el.innerHTML = (items || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
  }
  function setLink(el, url) {
    if (url) { el.href = asset(url); el.hidden = false; } else { el.hidden = true; }
  }

  /* ---------- Theme ---------- */
  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem("ck-theme"); } catch (e) {}
    if (saved === "dark" || saved === "light") document.documentElement.setAttribute("data-theme", saved);
    $("themeBtn").addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      if (!cur) cur = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      var next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("ck-theme", next); } catch (e) {}
    });
  }

  /* ---------- Profile ---------- */
  function renderProfile() {
    var s = state.site;
    var ini = initials(s.name);
    document.title = s.name + " — " + s.role;
    $("brandName").textContent = s.name;
    $("brandMark").textContent = ini;
    $("footName").textContent = s.name;
    $("year").textContent = new Date().getFullYear();
    $("pName").textContent = s.name;
    $("pRole").textContent = s.role;
    $("pLoc").textContent = s.location || "";
    $("pAvail").textContent = s.availability || "";
    $("pAvail").hidden = !s.availability;

    var av = $("avatar");
    if (s.photo) av.innerHTML = '<img src="' + esc(asset(s.photo)) + '" alt="' + esc(s.name) + '">';
    else $("avatarInitials").textContent = ini;
    $("ownerAvatar").innerHTML = s.photo ? '<img src="' + esc(asset(s.photo)) + '" alt="">' : esc(ini);

    setLink($("cvBtn"), s.cv);
    setLink($("liBtn"), s.linkedin);

    chips($("pSkills"), s.skills);
    chips($("pTools"), s.tools);
    $("pCerts").innerHTML = (s.certifications || []).map(function (c) {
      return "<li><b>" + esc(c.name) + "</b><span>" + esc(c.issuer) + (c.note ? " · " + esc(c.note) : "") + "</span></li>";
    }).join("");

    $("statProjects").textContent = state.projects.length;
    var domains = {};
    state.projects.forEach(function (p) { if (p.domain) domains[p.domain] = 1; });
    $("statDomains").textContent = Object.keys(domains).length;

    $("aboutHeadline").textContent = s.headline || "";
    $("aboutBody").innerHTML = md(s.about);
    $("aboutEdu").textContent = s.education || "";

    $("timeline").innerHTML = (s.experience || []).map(function (x) {
      return '<li><div class="when">' + esc(x.period || "") + "</div><div><h3>" + esc(x.role) +
        '</h3><p class="at">' + esc(x.company) + "</p><p>" + esc(x.summary || "") + "</p></div></li>";
    }).join("");

    $("emailText").textContent = s.email || "";
    $("mailBtn").href = "mailto:" + (s.email || "");
    $("moreName").textContent = (s.name || "").split(" ")[0];
  }

  /* ---------- Work grid ---------- */
  function cardHTML(p) {
    return '<a class="card" href="#p-' + esc(p.slug) + '">' +
      '<div class="card-cover">' +
        (p.cover ? '<img loading="lazy" src="' + esc(asset(p.cover)) + '" alt="' + esc(p.title) + ' cover">' : "") +
        (p.featured ? '<span class="badge">Featured</span>' : "") +
        '<div class="card-over"><strong>' + esc(p.title) + "</strong><span>" + esc(p.summary || "") + "</span></div>" +
      "</div>" +
      '<p class="card-title">' + esc(p.title) + "</p>" +
      '<div class="card-meta"><p class="card-sub">' + esc(p.client || "") + '</p><span class="card-cat">' + esc(p.category || "") + "</span></div>" +
    "</a>";
  }
  function renderFilters() {
    var counts = { All: state.projects.length };
    state.projects.forEach(function (p) { if (p.category) counts[p.category] = (counts[p.category] || 0) + 1; });
    $("filters").innerHTML = Object.keys(counts).map(function (c) {
      return '<button type="button" data-filter="' + esc(c) + '" aria-pressed="' + (c === state.filter) + '">' +
        esc(c) + '<span class="count">' + counts[c] + "</span></button>";
    }).join("");
  }
  function renderGrid() {
    var list = state.projects.filter(function (p) { return state.filter === "All" || p.category === state.filter; });
    $("grid").innerHTML = list.map(cardHTML).join("");
    $("gridEmpty").hidden = list.length > 0;
  }

  /* ---------- Tabs ---------- */
  function showTab(name) {
    ["work", "about", "experience"].forEach(function (t) {
      $("tab-" + t).setAttribute("aria-selected", String(t === name));
      $("panel-" + t).hidden = t !== name;
    });
    document.querySelectorAll("[data-tab-link]").forEach(function (a) {
      a.setAttribute("aria-current", String(a.getAttribute("data-tab-link") === name));
    });
  }

  /* ---------- Project page ---------- */
  function renderProject(p) {
    var s = state.site;
    document.title = p.title + " — " + s.name;
    $("projTitle").textContent = p.title;
    $("projOwner").textContent = s.name;
    $("projClient").textContent = p.client || "";
    $("projSummary").textContent = p.summary || "";

    var meta = [["Role", p.role], ["Client", p.client], ["Domain", p.domain], ["Year", p.year]]
      .filter(function (m) { return m[1]; });
    $("projMeta").innerHTML = meta.map(function (m) {
      return "<div><dt>" + m[0] + "</dt><dd>" + esc(m[1]) + "</dd></div>";
    }).join("");

    $("projCover").innerHTML = p.cover ? '<img src="' + esc(asset(p.cover)) + '" alt="' + esc(p.title) + '">' : "";
    $("projCover").hidden = !p.cover;
    $("projBody").innerHTML = md(p.body);
    $("projBody").hidden = !p.body;

    $("projGallery").innerHTML = (p.gallery || []).filter(function (g) { return g && g.image; }).map(function (g) {
      return '<figure class="canvas-img"><img loading="lazy" src="' + esc(asset(g.image)) + '" alt="' + esc(g.caption || p.title) + '">' +
        (g.caption ? "<figcaption>" + esc(g.caption) + "</figcaption>" : "") + "</figure>";
    }).join("");

    chips($("projTools"), p.tools);
    chips($("projTags"), [p.category, p.domain].filter(Boolean));
    setLink($("projLink"), p.link);

    var others = state.projects.filter(function (o) { return o.slug !== p.slug; }).slice(0, 3);
    $("moreGrid").innerHTML = others.map(cardHTML).join("");
  }

  /* ---------- Router: #work #about #experience #contact #p-<slug> ---------- */
  function route() {
    var h = decodeURIComponent((location.hash || "").slice(1));
    if (h.indexOf("p-") === 0) {
      var p = state.projects.find(function (x) { return x.slug === h.slice(2); });
      if (p) {
        renderProject(p);
        $("profileView").hidden = true;
        $("projectView").hidden = false;
        window.scrollTo(0, 0);
        return;
      }
    }
    var wasProject = !$("projectView").hidden;
    $("projectView").hidden = true;
    $("profileView").hidden = false;
    document.title = state.site.name + " — " + state.site.role;
    if (h === "about" || h === "experience" || h === "work") {
      showTab(h);
      if (wasProject) window.scrollTo(0, 0);
    } else if (h === "contact") {
      requestAnimationFrame(function () { $("contact").scrollIntoView(); });
    } else {
      showTab("work");
    }
  }

  /* ---------- Events ---------- */
  function bind() {
    document.querySelector(".tabs").addEventListener("click", function (e) {
      var b = e.target.closest("[data-tab]");
      if (!b) return;
      var t = b.getAttribute("data-tab");
      if (location.hash !== "#" + t) location.hash = t; else showTab(t);
    });
    $("filters").addEventListener("click", function (e) {
      var b = e.target.closest("[data-filter]");
      if (!b) return;
      state.filter = b.getAttribute("data-filter");
      renderFilters();
      renderGrid();
    });
    $("copyBtn").addEventListener("click", function () {
      var email = state.site.email || "";
      var done = function () { $("copied").textContent = "Copied " + email; };
      var fallback = function () {
        var r = document.createRange();
        r.selectNodeContents($("emailText"));
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
        $("copied").textContent = "Email selected. Press Ctrl/Cmd + C to copy.";
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(email).then(done, fallback);
        else fallback();
      } catch (e) { fallback(); }
    });
    window.addEventListener("hashchange", route);
  }

  function load(path) {
    return fetch(path, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(path + " returned " + r.status);
      return r.json();
    });
  }

  initTheme();
  bind();
  Promise.all([load("data/site.json"), load("data/projects.json")]).then(function (res) {
    state.site = res[0];
    state.projects = (res[1] || []).filter(function (p) { return p && p.slug && p.title; });
    renderProfile();
    renderFilters();
    renderGrid();
    route();
  }).catch(function (err) {
    $("grid").innerHTML = '<p class="empty">Could not load the portfolio content (' + esc(err.message) +
      "). If you opened index.html straight from your computer, run it through a local server instead — see README.md.</p>";
  });
})();
