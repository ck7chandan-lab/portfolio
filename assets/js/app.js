/* Chandan Kumar portfolio — renders everything from data/site.json, data/projects.json and data/resume.json.
   Edit content in the admin panel (/admin); no code changes needed. */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var state = { site: null, projects: [], resume: null, filter: "All" };
  var PREVIEW = /[?&]preview=1/.test(location.search);

  // Media paths are saved like "/assets/uploads/x.png". Make them relative so the
  // site works at a domain root, in a sub-folder, or on a GitHub Pages project URL.
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
    var html;
    if (window.marked) html = window.marked.parse(text, { mangle: false, headerIds: false });
    else html = text.split(/\n{2,}/).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
    return html.replace(/(src|href)="\/(assets\/[^"]*)"/g, '$1="$2"').replace(/<script[\s\S]*?<\/script>/gi, "");
  }
  function initials(name) {
    return (name || "").split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase();
  }
  function chips(el, items) {
    el.innerHTML = (items || []).filter(Boolean).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
  }
  function setLink(el, url) {
    if (url) { el.href = asset(url); el.hidden = false; } else { el.hidden = true; }
  }
  function visible(p) { return p && p.slug && p.title && (PREVIEW || p.status !== "draft"); }

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
    var s = state.site, r = state.resume || {};
    var ini = initials(s.name);
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
    else av.innerHTML = '<span>' + esc(ini) + "</span>";
    $("ownerAvatar").innerHTML = s.photo ? '<img src="' + esc(asset(s.photo)) + '" alt="">' : esc(ini);
    setLink($("liBtn"), s.linkedin);

    chips($("pSkills"), s.skills);
    chips($("pTools"), s.tools);
    $("pCerts").innerHTML = (r.certifications || []).map(function (c) {
      var name = c.url ? '<a href="' + esc(c.url) + '" target="_blank" rel="noopener">' + esc(c.name) + "</a>" : esc(c.name);
      return "<li><b>" + name + "</b><span>" + esc(c.issuer) + (c.detail ? " · " + esc(c.detail) : "") + "</span></li>";
    }).join("");

    var list = state.projects.filter(visible);
    $("statProjects").textContent = list.length;
    var domains = {};
    list.forEach(function (p) { if (p.domain) domains[p.domain] = 1; });
    $("statDomains").textContent = Object.keys(domains).length;

    $("aboutHeadline").textContent = s.headline || "";
    $("aboutBody").innerHTML = md(s.about);
    $("aboutEdu").textContent = (r.education || []).map(function (e) {
      return [e.degree, e.school].filter(Boolean).join(", ") + (e.year ? " (" + e.year + ")" : "");
    }).join(" · ");

    $("timeline").innerHTML = (r.experience || []).map(function (x) {
      var when = [x.start, x.end].filter(Boolean).join(" – ");
      return '<li><div class="when">' + esc(when) + "</div><div><h3>" + esc(x.role) +
        '</h3><p class="at">' + esc([x.company, x.location].filter(Boolean).join(" · ")) + "</p>" +
        ((x.bullets || []).length ? '<ul class="t-bullets">' + x.bullets.filter(Boolean).slice(0, 3).map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul>" : "") +
        "</div></li>";
    }).join("");

    $("emailText").textContent = s.email || "";
    $("mailBtn").href = "mailto:" + (s.email || "");
    $("moreName").textContent = (s.name || "").split(" ")[0];
  }

  /* ---------- Resume tab ---------- */
  function renderResume() {
    var r = state.resume;
    if (!r) { $("resumeSheet").innerHTML = '<p class="empty">Resume content is not available.</p>'; return; }
    var contact = [r.location, r.email, r.phone].filter(Boolean).map(esc);
    if (r.linkedin) contact.push('<a href="' + esc(r.linkedin) + '" target="_blank" rel="noopener">LinkedIn</a>');
    if (r.website) contact.push('<a href="' + esc(r.website) + '" target="_blank" rel="noopener">' + esc(r.website.replace(/^https?:\/\//, "")) + "</a>");
    var h = "";
    h += '<header class="rs-head"><h2>' + esc(r.name) + "</h2>";
    if (r.title) h += '<p class="rs-title">' + esc(r.title) + "</p>";
    h += '<p class="rs-contact">' + contact.join('<span aria-hidden="true"> · </span>') + "</p>";
    var sub = [r.status, r.credential].filter(Boolean);
    if (sub.length) h += '<p class="rs-sub">' + sub.map(esc).join(" · ") + "</p>";
    h += "</header>";
    var sec = function (title, body) { if (body) h += '<section class="rs-sec"><h3>' + esc(title) + "</h3>" + body + "</section>"; };
    sec("Profile summary", (r.summary || "").split(/\n{2,}/).filter(Boolean).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join(""));
    sec("Core expertise", (r.skillGroups || []).length ? '<ul>' + r.skillGroups.map(function (g) {
      return "<li><b>" + esc(g.name) + "</b> – " + esc(g.items) + "</li>";
    }).join("") + "</ul>" : "");
    sec("Professional experience", (r.experience || []).map(function (x) {
      return '<div class="rs-job"><div class="rs-row"><b>' + esc(x.role) + "</b><span>" + esc([x.start, x.end].filter(Boolean).join(" – ")) + "</span></div>" +
        '<div class="rs-row rs-co"><i>' + esc(x.company) + "</i><span>" + esc(x.location || "") + "</span></div>" +
        "<ul>" + (x.bullets || []).filter(Boolean).map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul></div>";
    }).join(""));
    sec("Education", (r.education || []).length ? "<ul>" + r.education.map(function (e) {
      return "<li>" + esc([e.degree, e.school].filter(Boolean).join(" — ")) + (e.year ? " (" + esc(e.year) + ")" : "") + "</li>";
    }).join("") + "</ul>" : "");
    sec("Certifications", (r.certifications || []).length ? "<ul>" + r.certifications.map(function (c) {
      var t = esc([c.issuer, c.name].filter(Boolean).join(": ")) + (c.detail ? " — " + esc(c.detail) : "");
      return "<li>" + (c.url ? '<a href="' + esc(c.url) + '" target="_blank" rel="noopener">' + t + "</a>" : t) + "</li>";
    }).join("") + "</ul>" : "");
    sec("Key projects & brands", (r.projects || []).filter(Boolean).length ? "<ul>" + r.projects.filter(Boolean).map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul>" : "");
    sec("Languages", (r.languages || []).length ? "<p>" + r.languages.map(function (l) { return esc(l.name) + (l.level ? " (" + esc(l.level) + ")" : ""); }).join(" · ") + "</p>" : "");
    $("resumeSheet").innerHTML = h;
  }
  function download(kind) {
    var r = state.resume, status = $("dlStatus");
    if (!r) return;
    var uploaded = kind === "pdf" ? r.pdfFile : r.docxFile;
    if (uploaded) {
      var a = document.createElement("a");
      a.href = asset(uploaded); a.download = ""; a.target = "_blank"; a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
      return;
    }
    if (!window.ResumeExport) { status.textContent = "The download tool didn't load. Refresh the page and try again."; return; }
    var btn = $(kind === "pdf" ? "dlPdf" : "dlDocx");
    btn.disabled = true;
    status.textContent = "Preparing your " + (kind === "pdf" ? "PDF" : "Word file") + "…";
    window.ResumeExport[kind](r).then(function () {
      status.textContent = (kind === "pdf" ? "PDF" : "Word file") + " downloaded.";
    }, function (e) {
      status.textContent = "Couldn't create the file: " + e.message;
    }).then(function () { btn.disabled = false; });
  }

  /* ---------- Work grid ---------- */
  function cardHTML(p) {
    return '<a class="card" href="#p-' + esc(p.slug) + '">' +
      '<div class="card-cover">' +
        (p.cover ? '<img loading="lazy" src="' + esc(asset(p.cover)) + '" alt="' + esc(p.title) + ' cover">' : '<div class="card-blank">' + esc(p.title) + "</div>") +
        (p.status === "draft" ? '<span class="badge badge-draft">Draft</span>' : p.featured ? '<span class="badge">Featured</span>' : "") +
        '<div class="card-over"><strong>' + esc(p.title) + "</strong><span>" + esc(p.summary || "") + "</span></div>" +
      "</div>" +
      '<p class="card-title">' + esc(p.title) + "</p>" +
      '<div class="card-meta"><p class="card-sub">' + esc(p.client || "") + '</p><span class="card-cat">' + esc(p.category || "") + "</span></div>" +
    "</a>";
  }
  function renderFilters() {
    var list = state.projects.filter(visible);
    var counts = { All: list.length };
    list.forEach(function (p) { if (p.category) counts[p.category] = (counts[p.category] || 0) + 1; });
    if (!counts[state.filter]) state.filter = "All";
    $("filters").innerHTML = Object.keys(counts).map(function (c) {
      return '<button type="button" data-filter="' + esc(c) + '" aria-pressed="' + (c === state.filter) + '">' +
        esc(c) + '<span class="count">' + counts[c] + "</span></button>";
    }).join("");
  }
  function renderGrid() {
    var list = state.projects.filter(visible).filter(function (p) { return state.filter === "All" || p.category === state.filter; });
    $("grid").innerHTML = list.map(cardHTML).join("");
    $("gridEmpty").hidden = list.length > 0;
  }

  /* ---------- Tabs ---------- */
  var TABS = ["work", "about", "experience", "resume"];
  function showTab(name) {
    TABS.forEach(function (t) {
      $("tab-" + t).setAttribute("aria-selected", String(t === name));
      $("panel-" + t).hidden = t !== name;
    });
    document.querySelectorAll("[data-tab-link]").forEach(function (a) {
      a.setAttribute("aria-current", String(a.getAttribute("data-tab-link") === name));
    });
  }

  /* ---------- Project modules (Behance-style canvas) ---------- */
  function embedURL(url) {
    url = (url || "").trim();
    var m;
    if ((m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{6,})/))) return { kind: "iframe", src: "https://www.youtube-nocookie.com/embed/" + m[1] };
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/))) return { kind: "iframe", src: "https://player.vimeo.com/video/" + m[1] };
    if ((m = url.match(/loom\.com\/(?:share|embed)\/([\w-]+)/))) return { kind: "iframe", src: "https://www.loom.com/embed/" + m[1] };
    if (/figma\.com\/(file|design|proto|board)\//.test(url)) return { kind: "iframe", src: "https://www.figma.com/embed?embed_host=share&url=" + encodeURIComponent(url) };
    if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) return { kind: "video", src: asset(url) };
    if (/^https:\/\//.test(url)) return { kind: "iframe", src: url };
    return null;
  }
  function moduleHTML(m, p) {
    var cap = function (c) { return c ? "<figcaption>" + esc(c) + "</figcaption>" : ""; };
    switch (m.type) {
      case "text":
        return m.text ? '<div class="mod mod-text prose">' + md(m.text) + "</div>" : "";
      case "image":
        return m.image ? '<figure class="mod mod-image' + (m.width === "contained" ? " is-contained" : "") + '"><img loading="lazy" src="' + esc(asset(m.image)) + '" alt="' + esc(m.caption || p.title) + '">' + cap(m.caption) + "</figure>" : "";
      case "grid":
        var imgs = (m.images || []).filter(function (g) { return g && g.image; });
        if (!imgs.length) return "";
        var gsize = { s: "s", m: "m", l: "l" }[m.size] || "m";
        var ggap = m.gap == null ? 6 : +m.gap;
        return '<div class="mod mod-grid jgrid" data-size="' + gsize + '" data-gap="' + ggap + '">' + imgs.map(function (g) {
          return '<figure class="jg-item"' + (g.w && g.h ? ' data-w="' + (+g.w) + '" data-h="' + (+g.h) + '"' : "") +
            '><img loading="lazy" src="' + esc(asset(g.image)) + '" alt="' + esc(g.caption || p.title) + '"' + (g.caption ? ' title="' + esc(g.caption) + '"' : "") + "></figure>";
        }).join("") + "</div>";
      case "video":
        var e = embedURL(m.url);
        if (!e) return "";
        var inner = e.kind === "video"
          ? '<video src="' + esc(e.src) + '" controls playsinline preload="metadata"></video>'
          : '<iframe src="' + esc(e.src) + '" title="' + esc(m.caption || "Embedded media") + '" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
        return '<figure class="mod mod-video"><div class="ratio">' + inner + "</div>" + cap(m.caption) + "</figure>";
      case "divider":
        return '<hr class="mod mod-divider">';
      default:
        return "";
    }
  }
  function renderProject(p) {
    var s = state.site;
    document.title = p.title + " — " + s.name;
    $("projTitle").textContent = p.title;
    $("projOwner").textContent = s.name;
    $("projClient").textContent = p.client || "";
    $("projSummary").textContent = p.summary || "";

    var meta = [["Role", p.role], ["Client", p.client], ["Domain", p.domain], ["Year", p.year], ["Published", p.date]]
      .filter(function (m) { return m[1]; });
    $("projMeta").innerHTML = meta.map(function (m) {
      return "<div><dt>" + m[0] + "</dt><dd>" + esc(m[1]) + "</dd></div>";
    }).join("");

    var mods = (p.modules || []).map(function (m) { return moduleHTML(m || {}, p); }).join("");
    var hasImage = (p.modules || []).some(function (m) { return m && (m.type === "image" || m.type === "grid"); });
    if (!hasImage && p.cover) mods = '<figure class="mod mod-image"><img src="' + esc(asset(p.cover)) + '" alt="' + esc(p.title) + '"></figure>' + mods;
    var canvas = $("projCanvas");
    canvas.innerHTML = mods || '<p class="empty">This project has no content yet.</p>';
    if (window.Justify) canvas.querySelectorAll(".jgrid").forEach(window.Justify.watch);
    canvas.style.setProperty("--canvas-bg", p.bg || "");
    canvas.classList.toggle("has-bg", !!p.bg);
    if (p.bg) canvas.style.setProperty("--canvas-ink", contrastInk(p.bg));

    chips($("projTools"), p.tools);
    chips($("projTags"), [p.category, p.domain].concat(p.tags || []).filter(Boolean));
    setLink($("projLink"), p.link);

    var others = state.projects.filter(visible).filter(function (o) { return o.slug !== p.slug; }).slice(0, 3);
    $("moreGrid").innerHTML = others.map(cardHTML).join("");
  }
  function contrastInk(hex) {
    var m = String(hex).replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!m) return "";
    var l = (0.299 * parseInt(m[1], 16) + 0.587 * parseInt(m[2], 16) + 0.114 * parseInt(m[3], 16)) / 255;
    return l > 0.6 ? "#111A30" : "#F3F4F8";
  }


  /* ---------- Image viewer (Behance-style lightbox) ----------
     Click 1: image fits inside the screen (never enlarged past its real size), centred.
     Click 2 (only if the image is bigger than the screen): real size, centred across, from the top.
     Esc / ✕ / click on the dark area closes it. ← → or the arrows move between images.        */
  var LB = { el: null, img: null, list: [], i: 0, actual: false, lastFocus: null };
  function lbBuild() {
    if (LB.el) return;
    var el = document.createElement("div");
    el.className = "lb"; el.hidden = true;
    el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Image viewer");
    el.innerHTML =
      '<div class="lb-scroll"><div class="lb-stage"><img class="lb-img" alt=""></div></div>' +
      '<button type="button" class="lb-btn lb-close" aria-label="Close">' +
        '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z"/></svg></button>' +
      '<button type="button" class="lb-btn lb-prev" aria-label="Previous image">' +
        '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M15.4 5.4 14 4l-8 8 8 8 1.4-1.4L8.8 12z"/></svg></button>' +
      '<button type="button" class="lb-btn lb-next" aria-label="Next image">' +
        '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="m8.6 18.6 1.4 1.4 8-8-8-8-1.4 1.4 6.6 6.6z"/></svg></button>' +
      '<div class="lb-count" aria-live="polite"></div>';
    document.body.appendChild(el);
    LB.el = el; LB.img = el.querySelector(".lb-img"); LB.scroll = el.querySelector(".lb-scroll");
    LB.img.addEventListener("click", function (e) { e.stopPropagation(); lbToggle(); });
    LB.img.addEventListener("load", lbFit);
    el.querySelector(".lb-close").addEventListener("click", lbClose);
    el.querySelector(".lb-prev").addEventListener("click", function (e) { e.stopPropagation(); lbGo(-1); });
    el.querySelector(".lb-next").addEventListener("click", function (e) { e.stopPropagation(); lbGo(1); });
    LB.scroll.addEventListener("click", function (e) { if (e.target !== LB.img) lbClose(); });
    document.addEventListener("keydown", function (e) {
      if (LB.el.hidden) return;
      if (e.key === "Escape") lbClose();
      else if (e.key === "ArrowRight") lbGo(1);
      else if (e.key === "ArrowLeft") lbGo(-1);
    });
    window.addEventListener("resize", function () { if (!LB.el.hidden) lbFit(); });
  }
  // Is the image bigger than the screen in either direction?
  function lbBig() {
    var img = LB.img, s = LB.scroll;
    return img.naturalWidth > s.clientWidth || img.naturalHeight > s.clientHeight;
  }
  function lbFit() {
    var img = LB.img;
    if (!img.naturalWidth) return;
    var big = lbBig();
    LB.el.classList.toggle("is-actual", LB.actual && big);
    LB.el.classList.toggle("can-zoom", big);
    if (LB.actual && big) {
      img.style.width = img.naturalWidth + "px"; img.style.height = img.naturalHeight + "px";
    } else {
      // fit: never larger than the real size, never larger than the screen
      var vw = LB.scroll.clientWidth, vh = LB.scroll.clientHeight;
      var k = Math.min(1, vw / img.naturalWidth, vh / img.naturalHeight);
      img.style.width = Math.floor(img.naturalWidth * k) + "px"; img.style.height = Math.floor(img.naturalHeight * k) + "px";
    }
  }
  function lbShow(i) {
    LB.i = (i + LB.list.length) % LB.list.length;
    LB.actual = false;
    var it = LB.list[LB.i];
    LB.el.classList.remove("is-actual", "can-zoom");
    LB.img.style.width = ""; LB.img.style.height = "";
    LB.img.src = it.src; LB.img.alt = it.alt || "";
    LB.scroll.scrollTop = 0; LB.scroll.scrollLeft = 0;
    var multi = LB.list.length > 1;
    LB.el.querySelector(".lb-prev").hidden = !multi;
    LB.el.querySelector(".lb-next").hidden = !multi;
    LB.el.querySelector(".lb-count").textContent = multi ? (LB.i + 1) + " / " + LB.list.length : "";
    if (LB.img.complete) lbFit();
  }
  function lbToggle() {
    if (!lbBig()) return;
    LB.actual = !LB.actual;
    lbFit();
    LB.scroll.scrollTop = 0;
    LB.scroll.scrollLeft = Math.max(0, (LB.scroll.scrollWidth - LB.scroll.clientWidth) / 2);
  }
  function lbGo(d) { if (LB.list.length > 1) lbShow(LB.i + d); }
  function lbOpen(list, i) {
    lbBuild();
    LB.list = list; LB.lastFocus = document.activeElement;
    LB.el.hidden = false;
    document.documentElement.classList.add("lb-open");
    lbShow(i);
    LB.el.querySelector(".lb-close").focus({ preventScroll: true });
  }
  function lbClose() {
    if (!LB.el || LB.el.hidden) return;
    LB.el.hidden = true;
    document.documentElement.classList.remove("lb-open");
    LB.img.removeAttribute("src");
    if (LB.lastFocus && LB.lastFocus.focus) LB.lastFocus.focus({ preventScroll: true });
  }
  function lbBind(canvas) {
    canvas.addEventListener("click", function (e) {
      var img = e.target.closest(".mod-image img, .jg-item img");
      if (!img) return;
      var all = Array.prototype.slice.call(canvas.querySelectorAll(".mod-image img, .jg-item img"));
      lbOpen(all.map(function (x) { return { src: x.currentSrc || x.src, alt: x.alt }; }), all.indexOf(img));
    });
  }

  /* ---------- Router: #work #about #experience #resume #contact #p-<slug> ---------- */
  function route() {
    var h = decodeURIComponent((location.hash || "").slice(1));
    if (h.indexOf("p-") === 0) {
      var p = state.projects.filter(visible).find(function (x) { return x.slug === h.slice(2); });
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
    if (TABS.indexOf(h) > -1) {
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
    $("dlPdf").addEventListener("click", function () { download("pdf"); });
    $("dlDocx").addEventListener("click", function () { download("docx"); });
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
    lbBind($("projCanvas"));
    window.addEventListener("hashchange", function () { lbClose(); route(); });
  }

  function load(path) {
    if (location.protocol === "file:" && window.CK_DATA && window.CK_DATA[path]) {
      return Promise.resolve(JSON.parse(JSON.stringify(window.CK_DATA[path])));
    }
    if (PREVIEW) {
      try {
        var draft = localStorage.getItem("ck-preview:" + path);
        if (draft) return Promise.resolve(JSON.parse(draft));
      } catch (e) {}
    }
    return fetch(path, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(path + " returned " + r.status);
      return r.json();
    });
  }

  function renderAll() {
    renderProfile();
    renderResume();
    renderFilters();
    renderGrid();
    route();
  }

  initTheme();
  bind();
  Promise.all([load("data/site.json"), load("data/projects.json"), load("data/resume.json").catch(function () { return null; })]).then(function (res) {
    state.site = res[0];
    state.projects = (res[1] || []).filter(function (p) { return p && p.slug && p.title; });
    state.resume = res[2];
    renderAll();
    if (PREVIEW) {
      var bar = document.createElement("div");
      bar.className = "preview-bar";
      bar.textContent = "Preview of unsaved changes";
      document.body.appendChild(bar);
      window.addEventListener("storage", function (e) {
        if (!e.key || e.key.indexOf("ck-preview:") !== 0) return;
        Promise.all([load("data/site.json"), load("data/projects.json"), load("data/resume.json")]).then(function (r2) {
          state.site = r2[0]; state.projects = r2[1] || []; state.resume = r2[2]; renderAll();
        });
      });
    }
  }).catch(function (err) {
    $("grid").innerHTML = '<p class="empty">Could not load the portfolio content (' + esc(err.message) +
      "). If you opened index.html straight from your computer, run it through a local server instead — see README.md.</p>";
  });
})();
