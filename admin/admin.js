/* Portfolio Admin — edits data/*.json and uploads media.
   Two ways to save:
   1) GitHub: commits straight to your repository (the live site updates in ~1 minute).
   2) Folder on this computer (Chrome/Edge): writes into your local site folder.        */
(function () {
  "use strict";

  /* ================= State ================= */
  var FILES = { site: "data/site.json", projects: "data/projects.json", resume: "data/resume.json" };
  var S = {
    mode: null,          // "github" | "folder"
    gh: null,            // {owner, repo, branch, token}
    dir: null,           // FileSystemDirectoryHandle
    data: {},            // site, projects, resume
    dirty: {},           // key -> true
    pending: {},         // path -> {blob, url}
    urls: {},            // path -> object URL (after saving, for display)
    view: "projects",
    editing: null,       // project index
    editingText: null,   // module object being edited
    filter: ""
  };
  var root = document.getElementById("root");

  /* ================= Small helpers ================= */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "html") el.innerHTML = v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else if (k === "style" && typeof v === "object") Object.keys(v).forEach(function (p) { el.style.setProperty(p, v[p]); });
      else if (v === true) el.setAttribute(k, "");
      else el.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
  }
  var ICONS = {
    grid: "M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z",
    user: "M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.4 0-9 2.2-9 5v3h18v-3c0-2.8-4.6-5-9-5z",
    doc: "M6 2h9l5 5v15H6zm8 1.5V8h4.5zM9 12h8v2H9zm0 4h8v2H9z",
    gear: "M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3h-4l-.4 2.7c-.6.3-1.2.6-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1L11 21h4l.4-2.7c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z",
    ext: "M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14zM5 5h6v2H5v12h12v-6h2v8H3V5z",
    plus: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z",
    up: "M12 7l-6 6 1.4 1.4 4.6-4.6 4.6 4.6L18 13z",
    down: "M12 17l6-6-1.4-1.4-4.6 4.6-4.6-4.6L6 11z",
    copy: "M8 8h12v12H8zM4 4h12v2H6v10H4z",
    trash: "M6 7h12l-1 14H7zm3-4h6l1 2h4v2H4V5h4z",
    drag: "M9 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM9 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM9 16a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z",
    image: "M3 4h18v16H3zm2 2v9.6l4-4 3 3 4-4 3 3V6zm4.5 1.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4z",
    text: "M4 4h16v3h-2V6h-5v12h2v2H9v-2h2V6H6v1H4z",
    gridimg: "M3 3h8v8H3zm10 0h8v5h-8zm0 7h8v11h-8zM3 13h8v8H3z",
    video: "M3 5h13v14H3zm15 4 4-2.5v11L18 15z",
    divider: "M3 11h18v2H3zM7 5h10v2H7zm0 12h10v2H7z",
    star: "M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z",
    back: "M15.4 5.4 14 4l-8 8 8 8 1.4-1.4L8.8 12z",
    eye: "M12 5C6 5 2 12 2 12s4 7 10 7 10-7 10-7-4-7-10-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z",
    save: "M5 3h11l5 5v13H3V3zm2 2v5h9V5zm5 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    download: "M12 16 7 11l1.4-1.4 2.6 2.6V4h2v8.2l2.6-2.6L17 11zM5 20v-2h14v2z",
    close: "M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z",
    award: "M12 2a7 7 0 0 1 4.6 12.3L18 22l-6-3-6 3 1.4-7.7A7 7 0 0 1 12 2zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z",
    link: "M10.6 13.4a1 1 0 0 0 1.4 0l4-4a3 3 0 0 0-4.2-4.2l-1.5 1.5 1.4 1.4 1.5-1.5a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 0 0 1.4zm2.8-2.8a1 1 0 0 0-1.4 0l-4 4a3 3 0 0 0 4.2 4.2l1.5-1.5-1.4-1.4-1.5 1.5a1 1 0 1 1-1.4-1.4l4-4a1 1 0 0 0 0-1.4z",
    logout: "M10 3h10v18H10v-2h8V5h-8zm-.6 5 1.4 1.4L9.2 11H16v2H9.2l1.6 1.6L9.4 16l-4-4z"
  };
  function icon(name) {
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true");
    var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("fill", "currentColor"); p.setAttribute("d", ICONS[name]); s.appendChild(p);
    return s;
  }
  function iconBtn(name, label, onclick, cls) {
    return h("button", { type: "button", class: "icon-btn " + (cls || ""), title: label, "aria-label": label, onclick: onclick }, icon(name));
  }
  function slugify(s) {
    return String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "project";
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function md(t) {
    var html = window.marked ? window.marked.parse(t || "", { mangle: false, headerIds: false }) : "<p>" + (t || "") + "</p>";
    return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/(src)="\/?(assets\/[^"]*)"/g, function (m, a, p) { return a + '="' + src(p) + '"'; });
  }
  function store(key, val) { try { if (val == null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  function recall(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }

  var toastTimer;
  function toast(msg, isError) {
    var t = document.getElementById("toast");
    t.textContent = msg; t.className = "toast" + (isError ? " error" : ""); t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, isError ? 7000 : 3500);
  }
  function confirmBox(title, text, okLabel, danger) {
    return new Promise(function (resolve) {
      var m = document.getElementById("modal");
      var close = function (v) { m.hidden = true; m.innerHTML = ""; resolve(v); };
      m.innerHTML = "";
      m.appendChild(h("div", { class: "modal-box", role: "dialog", "aria-modal": "true", "aria-label": title },
        h("h2", { text: title }), h("p", { text: text }),
        h("div", { class: "modal-actions" },
          h("button", { type: "button", class: "btn", onclick: function () { close(false); } }, "Cancel"),
          h("button", { type: "button", class: "btn " + (danger ? "btn-danger-solid" : "btn-primary"), onclick: function () { close(true); } }, okLabel || "OK"))));
      m.hidden = false;
      m.querySelector(".btn:last-child").focus();
      m.onclick = function (e) { if (e.target === m) close(false); };
    });
  }
  function busy(msg) {
    var b = h("div", { class: "busy", role: "status" }, msg);
    document.body.appendChild(b);
    return function () { b.remove(); };
  }

  /* ================= Storage backends ================= */
  function b64encodeText(str) {
    var bytes = new TextEncoder().encode(str), bin = "";
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function b64decodeText(b64) {
    var bin = atob(b64.replace(/\s/g, "")), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function blobToB64(blob) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(String(r.result).split(",")[1]); };
      r.onerror = rej; r.readAsDataURL(blob);
    });
  }

  var GH = {
    api: function (path, opts) {
      opts = opts || {};
      var g = S.gh;
      return fetch("https://api.github.com/repos/" + g.owner + "/" + g.repo + path, {
        method: opts.method || "GET",
        headers: { "Authorization": "Bearer " + g.token, "Accept": "application/vnd.github+json", "Content-Type": "application/json" },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        cache: "no-store"
      }).then(function (r) {
        if (r.ok) return r.status === 204 ? null : r.json();
        return r.json().catch(function () { return {}; }).then(function (j) {
          var msg = j.message || ("HTTP " + r.status);
          if (r.status === 401) msg = "GitHub didn't accept the token. Check that it's copied fully and hasn't expired.";
          else if (r.status === 404) msg = "Repository or file not found. Check the username and repository name, and that the token has access to this repository.";
          else if (r.status === 403) msg = "The token can't write to this repository. Give it Contents: Read and write permission.";
          var e = new Error(msg); e.status = r.status; throw e;
        });
      });
    },
    check: function () { return GH.api(""); },
    read: function (path) {
      return GH.api("/contents/" + path.split("/").map(encodeURIComponent).join("/") + "?ref=" + encodeURIComponent(S.gh.branch))
        .then(function (j) { return b64decodeText(j.content || ""); });
    },
    commit: function (files, message) {
      var branch = encodeURIComponent(S.gh.branch), base;
      return GH.api("/git/ref/heads/" + branch).then(function (ref) {
        base = ref.object.sha;
        return GH.api("/git/commits/" + base);
      }).then(function (commit) {
        return Promise.all(files.map(function (f) {
          var b64 = typeof f.content === "string" ? Promise.resolve(b64encodeText(f.content)) : blobToB64(f.content);
          return b64.then(function (c) { return GH.api("/git/blobs", { method: "POST", body: { content: c, encoding: "base64" } }); })
            .then(function (b) { return { path: f.path, mode: "100644", type: "blob", sha: b.sha }; });
        })).then(function (tree) {
          return GH.api("/git/trees", { method: "POST", body: { base_tree: commit.tree.sha, tree: tree } });
        });
      }).then(function (tree) {
        return GH.api("/git/commits", { method: "POST", body: { message: message, tree: tree.sha, parents: [base] } });
      }).then(function (c) {
        return GH.api("/git/refs/heads/" + branch, { method: "PATCH", body: { sha: c.sha } });
      });
    }
  };

  var FOLDER = {
    handle: function (path, create) {
      var parts = path.split("/"), name = parts.pop();
      return parts.reduce(function (p, seg) {
        return p.then(function (d) { return d.getDirectoryHandle(seg, { create: !!create }); });
      }, Promise.resolve(S.dir)).then(function (d) { return d.getFileHandle(name, { create: !!create }); });
    },
    read: function (path) {
      return FOLDER.handle(path).then(function (fh) { return fh.getFile(); }).then(function (f) { return f.text(); });
    },
    write: function (path, content) {
      return FOLDER.handle(path, true).then(function (fh) { return fh.createWritable(); })
        .then(function (w) { return w.write(content).then(function () { return w.close(); }); });
    },
    commit: function (files) {
      return files.reduce(function (p, f) { return p.then(function () { return FOLDER.write(f.path, f.content); }); }, Promise.resolve());
    }
  };
  function backend() { return S.mode === "github" ? GH : FOLDER; }

  function src(p) {
    if (!p) return "";
    if (/^(https?:|data:|blob:)/.test(p)) return p;
    var k = p.replace(/^\/+/, "");
    if (S.pending[k]) return S.pending[k].url;
    if (S.urls[k]) return S.urls[k];
    if (S.mode === "github") return "https://raw.githubusercontent.com/" + S.gh.owner + "/" + S.gh.repo + "/" + S.gh.branch + "/" + k.split("/").map(encodeURIComponent).join("/");
    return "../" + k;
  }

  /* ================= Media ================= */
  function pickFiles(accept, multiple) {
    return new Promise(function (resolve) {
      var i = h("input", { type: "file", accept: accept, multiple: !!multiple, style: { display: "none" } });
      i.addEventListener("change", function () { resolve(Array.prototype.slice.call(i.files || [])); i.remove(); });
      document.body.appendChild(i); i.click();
    });
  }
  function loadImage(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () { res({ img: img, url: url }); };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error("Couldn't read " + file.name + " as an image.")); };
      img.src = url;
    });
  }
  function imageSize(url) {
    return new Promise(function (res, rej) {
      var i = new Image();
      i.onload = function () { res({ w: i.naturalWidth, h: i.naturalHeight }); };
      i.onerror = rej; i.src = url;
    });
  }
  // preset: {w,h,crop} fixed crop | {maxW} width limit only (tall screenshots keep their full length)
  var CANVAS_MAX_AREA = 16e6; // Safari/iOS refuse canvases larger than ~16.7 million pixels
  function original(file) { return { blob: file, ext: (file.name.split(".").pop() || "jpg").toLowerCase().replace("jpeg", "jpg") }; }
  function processImage(file, preset) {
    if (!/^image\/(jpeg|png|webp|bmp)$/.test(file.type)) return Promise.resolve(original(file));
    return loadImage(file).then(function (r) {
      var img = r.img, sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0, dw, dh;
      if (!preset.crop) {
        // Content images: keep the original file (full quality, no re-compression) unless it is wider than maxW.
        var keep = sw <= preset.maxW && file.type !== "image/bmp" && file.size <= 25e6;
        var tooBigForCanvas = Math.round(sh * preset.maxW / sw) * preset.maxW > CANVAS_MAX_AREA;
        if (keep || (tooBigForCanvas && file.size <= 25e6)) { URL.revokeObjectURL(r.url); return original(file); }
      }
      if (preset.crop) {
        var target = preset.w / preset.h;
        if (sw / sh > target) { var nw = sh * target; sx = (sw - nw) / 2; sw = nw; } else { var nh = sw / target; sy = (sh - nh) / 2; sh = nh; }
        dw = Math.min(preset.w, Math.round(sw)); dh = Math.round(dw / target);
      } else {
        var scale = Math.min(1, preset.maxW / sw, Math.sqrt(CANVAS_MAX_AREA / (sw * sh)));
        dw = Math.round(sw * scale); dh = Math.round(sh * scale);
      }
      var c = document.createElement("canvas"); c.width = dw; c.height = dh;
      var ctx = c.getContext("2d");
      var png = file.type === "image/png";
      if (!png) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, dw, dh); }
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
      URL.revokeObjectURL(r.url);
      return new Promise(function (res) {
        c.toBlob(function (b) {
          if (png && b && b.size > 1.5e6) c.toBlob(function (j) { res({ blob: j, ext: "jpg" }); }, "image/jpeg", 0.88);
          else res({ blob: b, ext: png ? "png" : "jpg" });
        }, png ? "image/png" : "image/jpeg", 0.88);
      });
    });
  }
  var PRESET = { cover: { w: 1440, h: 1170, crop: true }, avatar: { w: 640, h: 640, crop: true }, content: { maxW: 2880 }, none: null };
  function upload(file, preset, prefix) {
    if (file.size > 40e6) return Promise.reject(new Error(file.name + " is larger than 40 MB. Compress it first."));
    var p = preset ? processImage(file, preset) : Promise.resolve({ blob: file, ext: (file.name.split(".").pop() || "bin").toLowerCase() });
    return p.then(function (r) {
      var base = slugify(file.name.replace(/\.[^.]+$/, "")).slice(0, 40);
      var path = "assets/uploads/" + (prefix ? slugify(prefix) + "-" : "") + base + "-" + uid().slice(-5) + "." + r.ext;
      S.pending[path] = { blob: r.blob, url: URL.createObjectURL(r.blob) };
      markDirty("uploads");
      return "/" + path;
    });
  }

  /* ================= Load / save ================= */
  function loadAll() {
    var b = backend();
    return Promise.all(Object.keys(FILES).map(function (k) {
      return b.read(FILES[k]).then(function (t) { S.data[k] = JSON.parse(t); }, function (e) {
        if (k === "resume") { S.data.resume = { name: "", experience: [], education: [], certifications: [], skillGroups: [], projects: [], languages: [] }; return; }
        throw e;
      });
    })).then(function () {
      S.data.projects.forEach(normaliseProject);
      S.dirty = {};
    });
  }
  function normaliseProject(p) {
    if (!p.modules) {
      p.modules = [];
      if (p.body) p.modules.push({ type: "text", text: p.body });
      (p.gallery || []).forEach(function (g) { if (g.image) p.modules.push({ type: "image", image: g.image, caption: g.caption || "" }); });
      delete p.body; delete p.gallery;
    }
    p.status = p.status || "published";
    p.tools = p.tools || []; p.tags = p.tags || [];
    return p;
  }
  function markDirty(k) { S.dirty[k] = true; updateSaveState(); }
  function isDirty() { return Object.keys(S.dirty).length > 0; }
  function updateSaveState() {
    var el = document.getElementById("saveState");
    if (!el) return;
    el.textContent = isDirty() ? "Unsaved changes" : "All changes saved";
    el.className = "save-state" + (isDirty() ? " dirty" : "");
    var btn = document.getElementById("saveBtn");
    if (btn) btn.disabled = !isDirty();
  }
  function validate() {
    var seen = {};
    for (var i = 0; i < S.data.projects.length; i++) {
      var p = S.data.projects[i];
      if (!p.title || !p.title.trim()) return "Project " + (i + 1) + " needs a title.";
      p.slug = slugify(p.slug || p.title);
      if (seen[p.slug]) return "Two projects use the URL name \"" + p.slug + "\". Change one of them.";
      seen[p.slug] = 1;
    }
    return null;
  }
  // Copy of the data as a script, so the site also opens by double-clicking index.html
  function jsCopy(path, data) {
    return "window.CK_DATA = window.CK_DATA || {};\nwindow.CK_DATA[" + JSON.stringify(path) + "] = " + JSON.stringify(data, null, 2) + ";\n";
  }
  function referencedPaths() {
    var txt = JSON.stringify(S.data);
    return Object.keys(S.pending).filter(function (p) { return txt.indexOf(p) > -1; });
  }
  function save() {
    if (!isDirty()) return Promise.resolve();
    var problem = validate();
    if (problem) { toast(problem, true); return Promise.resolve(); }
    var files = [];
    Object.keys(FILES).forEach(function (k) {
      if (S.dirty[k]) {
        files.push({ path: FILES[k], content: JSON.stringify(S.data[k], null, 2) + "\n" });
        files.push({ path: FILES[k].replace(/\.json$/, ".js"), content: jsCopy(FILES[k], S.data[k]) });
      }
    });
    var media = referencedPaths();
    media.forEach(function (p) { files.push({ path: p, content: S.pending[p].blob }); });
    if (!files.length) { S.dirty = {}; updateSaveState(); return Promise.resolve(); }
    var names = Object.keys(S.dirty).filter(function (k) { return FILES[k]; }).join(", ") || "media";
    var done = busy(S.mode === "github" ? "Saving to GitHub…" : "Saving to your folder…");
    return backend().commit(files, "Update " + names + " from admin").then(function () {
      media.forEach(function (p) { S.urls[p] = S.pending[p].url; });
      S.pending = {}; S.dirty = {};
      updateSaveState();
      toast(S.mode === "github" ? "Saved. Your live site updates in about a minute." : "Saved to your folder.");
    }, function (e) {
      toast("Couldn't save: " + e.message, true);
    }).then(done);
  }
  function preview(hash) {
    var map = {};
    Object.keys(S.pending).forEach(function (p) { map["/" + p] = S.pending[p].url; });
    Object.keys(FILES).forEach(function (k) {
      var json = JSON.stringify(S.data[k]);
      Object.keys(map).forEach(function (p) { json = json.split(JSON.stringify(p).slice(1, -1)).join(map[p]); });
      store("ck-preview:" + FILES[k], JSON.parse(json));
    });
    window.open("../index.html?preview=1" + (hash ? "#" + hash : ""), "ck-preview");
  }


  /* ================= Cover cropper (drag to move, zoom, fill or fit) ================= */
  function cropper(srcUrl, outW, outH, title) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      if (/^https?:/.test(srcUrl) && srcUrl.indexOf(location.origin) !== 0) img.crossOrigin = "anonymous";
      img.onerror = function () { reject(new Error("load")); };
      img.onload = function () { open(img); };
      img.src = srcUrl;

      function open(img) {
        var iw = img.naturalWidth, ih = img.naturalHeight;
        var m = document.getElementById("modal");
        var stage = h("div", { class: "crop-stage", tabindex: "0", "aria-label": "Crop area. Drag or use arrow keys to move the image." });
        stage.style.aspectRatio = outW + " / " + outH;
        var pic = h("img", { src: srcUrl, alt: "", draggable: "false" });
        if (img.crossOrigin) pic.crossOrigin = "anonymous";
        stage.appendChild(pic);
        stage.appendChild(h("div", { class: "crop-grid", "aria-hidden": "true" }));
        var zoom = h("input", { type: "range", id: "cropZoom", min: "0", max: "1000", value: "0", "aria-label": "Zoom" });
        var bg = h("input", { type: "color", id: "cropBg", value: "#ffffff", "aria-label": "Background colour for empty space" });
        var info = h("span", { class: "muted mono" });
        var st = { s: 1, x: 0, y: 0, W: 0, H: 0 };
        var cover = function () { return Math.max(st.W / iw, st.H / ih); };
        var contain = function () { return Math.min(st.W / iw, st.H / ih); };
        var minS = function () { return contain(); };
        var maxS = function () { return cover() * 4; };
        var sliderToScale = function (v) { var a = minS(), b = maxS(); return a * Math.pow(b / a, v / 1000); };
        var scaleToSlider = function (sc) { var a = minS(), b = maxS(); return Math.round(1000 * Math.log(sc / a) / Math.log(b / a)); };
        function clamp() {
          var w = iw * st.s, hh = ih * st.s;
          st.x = w >= st.W ? Math.min(0, Math.max(st.W - w, st.x)) : Math.max(0, Math.min(st.W - w, st.x));
          st.y = hh >= st.H ? Math.min(0, Math.max(st.H - hh, st.y)) : Math.max(0, Math.min(st.H - hh, st.y));
        }
        function draw() {
          clamp();
          pic.style.width = (iw * st.s) + "px"; pic.style.height = (ih * st.s) + "px";
          pic.style.transform = "translate(" + st.x + "px," + st.y + "px)";
          stage.style.background = bg.value;
          var pct = Math.round(st.s / cover() * 100);
          info.textContent = "Original " + iw + " × " + ih + " · " + (pct >= 100 ? "fills frame" : "shows whole image") + " · " + pct + "%";
        }
        function setScale(ns, cx, cy) {
          ns = Math.max(minS(), Math.min(maxS(), ns));
          cx = cx == null ? st.W / 2 : cx; cy = cy == null ? st.H / 2 : cy;
          st.x = cx - (cx - st.x) * ns / st.s; st.y = cy - (cy - st.y) * ns / st.s; st.s = ns;
          zoom.value = scaleToSlider(ns); draw();
        }
        function center(sc) { st.s = sc; st.x = (st.W - iw * sc) / 2; st.y = (st.H - ih * sc) / 2; zoom.value = scaleToSlider(sc); draw(); }
        function measure() {
          var r = stage.getBoundingClientRect(), old = st.W;
          st.W = r.width; st.H = r.height;
          if (!old) center(cover()); else { var k = st.W / old; st.s *= k; st.x *= k; st.y *= k; draw(); }
        }
        // drag
        var drag = null;
        stage.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY, sx: st.x, sy: st.y }; stage.setPointerCapture(e.pointerId); stage.classList.add("dragging"); });
        stage.addEventListener("pointermove", function (e) { if (!drag) return; st.x = drag.sx + e.clientX - drag.x; st.y = drag.sy + e.clientY - drag.y; draw(); });
        var end = function () { drag = null; stage.classList.remove("dragging"); };
        stage.addEventListener("pointerup", end); stage.addEventListener("pointercancel", end);
        stage.addEventListener("wheel", function (e) {
          e.preventDefault();
          var r = stage.getBoundingClientRect();
          setScale(st.s * Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
        }, { passive: false });
        stage.addEventListener("keydown", function (e) {
          var d = e.shiftKey ? 40 : 10, k = { ArrowLeft: [d, 0], ArrowRight: [-d, 0], ArrowUp: [0, d], ArrowDown: [0, -d] }[e.key];
          if (k) { e.preventDefault(); st.x += k[0]; st.y += k[1]; draw(); }
          if (e.key === "+" || e.key === "=") setScale(st.s * 1.1);
          if (e.key === "-") setScale(st.s / 1.1);
        });
        zoom.addEventListener("input", function () { setScale(sliderToScale(+zoom.value)); });
        bg.addEventListener("input", draw);

        function close(v) { window.removeEventListener("resize", measure); document.removeEventListener("keydown", esc); m.hidden = true; m.innerHTML = ""; m.onclick = null; resolve(v); }
        function esc(e) { if (e.key === "Escape") close(null); }
        function apply() {
          var c = document.createElement("canvas"); c.width = outW; c.height = outH;
          var ctx = c.getContext("2d"), k = outW / st.W;
          ctx.fillStyle = bg.value; ctx.fillRect(0, 0, outW, outH);
          ctx.imageSmoothingQuality = "high";
          try {
            ctx.drawImage(img, st.x * k, st.y * k, iw * st.s * k, ih * st.s * k);
            c.toBlob(function (b) { close(b); }, "image/jpeg", 0.9);
          } catch (err) { close(null); reject(err); }
        }
        m.innerHTML = "";
        m.appendChild(h("div", { class: "modal-box crop-box", role: "dialog", "aria-modal": "true", "aria-label": title },
          h("div", { class: "crop-head" }, h("h2", { text: title }), h("span", { class: "muted mono", text: outW + " × " + outH + " px" })),
          h("p", { class: "muted", style: { margin: "0 0 12px" }, text: "Drag the image to position it. Use the slider or your trackpad to zoom." }),
          stage,
          h("div", { class: "crop-controls" },
            h("label", { class: "crop-zoom", for: "cropZoom" }, h("span", { class: "label", style: { margin: 0 } }, "Zoom"), zoom),
            h("div", { class: "file-row" },
              h("button", { type: "button", class: "btn btn-sm", onclick: function () { center(cover()); } }, "Fill frame"),
              h("button", { type: "button", class: "btn btn-sm", onclick: function () { center(contain()); } }, "Fit whole image"),
              h("label", { class: "file-row", style: { gap: "6px" } }, h("span", { class: "muted", style: { "font-size": "12.5px" } }, "Background"), bg))),
          info,
          h("div", { class: "modal-actions", style: { "margin-top": "16px" } },
            h("button", { type: "button", class: "btn", onclick: function () { close(null); } }, "Cancel"),
            h("button", { type: "button", class: "btn btn-primary", onclick: apply }, "Apply crop"))));
        m.hidden = false;
        m.onclick = function (e) { if (e.target === m) close(null); };
        document.addEventListener("keydown", esc);
        window.addEventListener("resize", measure);
        requestAnimationFrame(function () { measure(); stage.focus(); });
      }
    });
  }

  /* ================= Login ================= */
  function guessRepo() {
    var host = location.hostname, m = host.match(/^([\w-]+)\.github\.io$/i);
    if (!m) return { owner: "", repo: "" };
    var seg = location.pathname.split("/").filter(Boolean)[0];
    return { owner: m[1], repo: seg && seg !== "admin" ? seg : host };
  }
  function renderLogin(errorText) {
    var saved = recall("ck-admin-gh") || {};
    var g = guessRepo();
    var owner = h("input", { type: "text", id: "ghOwner", value: saved.owner || g.owner, placeholder: "your-github-username", autocomplete: "username" });
    var repo = h("input", { type: "text", id: "ghRepo", value: saved.repo || g.repo, placeholder: "your-username.github.io" });
    var branch = h("input", { type: "text", id: "ghBranch", value: saved.branch || "main" });
    var token = h("input", { type: "password", id: "ghToken", value: saved.token || "", placeholder: "github_pat_…", autocomplete: "off" });
    var remember = h("input", { type: "checkbox", id: "ghRemember", checked: saved.token ? true : false });
    var err = h("p", { class: "err", role: "alert", text: errorText || "" });
    var go = h("button", { type: "submit", class: "btn btn-primary btn-lg" }, "Connect & edit");
    var form = h("form", { class: "stack", onsubmit: function (e) {
      e.preventDefault();
      S.gh = { owner: owner.value.trim(), repo: repo.value.trim().replace(/^.*github\.com\//, "").replace(/\.git$/, ""), branch: branch.value.trim() || "main", token: token.value.trim() };
      if (S.gh.repo.indexOf("/") > -1) { var parts = S.gh.repo.split("/"); S.gh.owner = parts[0]; S.gh.repo = parts[1]; }
      if (!S.gh.owner || !S.gh.repo || !S.gh.token) { err.textContent = "Fill in your username, repository and token."; return; }
      go.disabled = true; err.textContent = "";
      S.mode = "github";
      GH.check().then(function (info) {
        if (info && info.permissions && info.permissions.push === false) throw new Error("This token can read the repository but can't save to it. Give it Contents: Read and write.");
        store("ck-admin-gh", remember.checked ? S.gh : { owner: S.gh.owner, repo: S.gh.repo, branch: S.gh.branch });
        return loadAll();
      }).then(startApp, function (e2) {
        S.mode = null; go.disabled = false;
        err.textContent = e2.message;
      });
    } },
      h("div", { class: "row" },
        h("label", { class: "field" }, h("span", { class: "label" }, "GitHub username"), owner),
        h("label", { class: "field" }, h("span", { class: "label" }, "Repository"), repo)),
      h("div", { class: "row" },
        h("label", { class: "field" }, h("span", { class: "label" }, "Branch"), branch),
        h("label", { class: "field" }, h("span", { class: "label" }, "Access token"), token)),
      h("label", { class: "switch" }, remember, "Remember me on this computer"),
      go, err);

    var canFolder = "showDirectoryPicker" in window;
    var folderErr = h("p", { class: "err", role: "alert" });
    var folderCard = h("div", { class: "card" },
      h("h2", { text: "Edit the folder on this computer" }),
      h("p", { text: "Works in Chrome or Edge while the site runs locally. Changes are written straight into your site folder; publish them with GitHub Desktop." }),
      h("button", { type: "button", class: "btn btn-lg", disabled: !canFolder, onclick: function () {
        window.showDirectoryPicker({ id: "ck-portfolio", mode: "readwrite" }).then(function (dir) {
          S.dir = dir; S.mode = "folder";
          return FOLDER.read("data/site.json").catch(function () {
            throw new Error("That folder doesn't look like the portfolio site. Choose the \"Chandan portfolio site\" folder (it contains index.html and a data folder).");
          }).then(loadAll);
        }).then(startApp, function (e) {
          S.mode = null;
          if (e && e.name !== "AbortError") folderErr.textContent = e.message;
        });
      } }, "Choose site folder"),
      canFolder ? null : h("p", { class: "muted", text: "This browser can't open folders. Use Chrome or Edge, or connect to GitHub." }),
      folderErr);

    root.className = "";
    root.innerHTML = "";
    root.appendChild(h("div", { class: "login" }, h("div", { class: "login-in" },
      h("div", { class: "login-head" }, h("span", { class: "logo" }, "CK"), h("div", null, h("h1", { text: "Portfolio admin" }), h("p", { class: "muted", style: { margin: "2px 0 0" }, text: "Add projects, edit your profile and update your resume." }))),
      h("div", { class: "login-grid" },
        h("div", { class: "card" },
          h("h2", { text: "Connect to GitHub" }),
          h("p", { text: "Saves go straight to your live site." }),
          h("ol", { class: "steps" },
            h("li", null, "Open ", h("a", { href: "https://github.com/settings/personal-access-tokens/new", target: "_blank", rel: "noopener" }, "GitHub → New fine-grained token"), "."),
            h("li", { text: "Repository access: Only select repositories → your portfolio repository." }),
            h("li", { text: "Permissions → Repository → Contents: Read and write. Generate, then paste it below." })),
          form),
        folderCard))));
    (owner.value ? token : owner).focus();
  }

  /* ================= App shell ================= */
  /* Warn when this tab is running an older admin than the one on the server
     (e.g. the tab was left open while an update was pushed). */
  var MY_VERSION = (function () {
    var el = document.querySelector('script[src*="admin.js"]');
    var m = el && el.getAttribute("src").match(/[?&]v=([\w.-]+)/);
    return m ? m[1] : "";
  })();
  var versionWarned = false;
  function checkVersion() {
    if (versionWarned || !MY_VERSION || location.protocol === "file:") return;
    fetch("index.html?check=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.text() : ""; }).then(function (html) {
      var m = html.match(/admin\.js\?v=([\w.-]+)/);
      if (!m || m[1] === MY_VERSION || versionWarned) return;
      versionWarned = true;
      var bar = h("div", { class: "update-bar", role: "alert" },
        h("span", { text: "A newer version of the admin is available. Save your changes, then reload before uploading more images." }),
        h("button", { type: "button", class: "btn btn-sm btn-primary", onclick: function () {
          if (isDirty() && !window.confirm("You have unsaved changes. Reload anyway?")) return;
          location.reload();
        } }, "Reload now"));
      document.body.appendChild(bar);
    }).catch(function () {});
  }
  function startApp() {
    checkVersion();
    window.addEventListener("focus", checkVersion);
    setInterval(checkVersion, 5 * 60 * 1000);
    window.addEventListener("beforeunload", function (e) { if (isDirty()) { e.preventDefault(); e.returnValue = ""; } });
    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
    });
    go(location.hash.slice(1) || "projects");
    window.addEventListener("hashchange", function () { go(location.hash.slice(1) || "projects", true); });
  }
  function go(view, fromHash) {
    var m = view.match(/^edit-(\d+)$/);
    if (m && S.data.projects[+m[1]]) { S.view = "edit"; S.editing = +m[1]; }
    else if (["projects", "profile", "resume", "certifications", "links", "settings"].indexOf(view) > -1) { S.view = view; S.editing = null; }
    else { S.view = "projects"; S.editing = null; }
    var target = S.view === "edit" ? "edit-" + S.editing : S.view;
    if (!fromHash && location.hash.slice(1) !== target) { location.hash = target; return; }
    S.editingText = null;
    render();
    window.scrollTo(0, 0);
  }
  function siteURL() {
    if (S.mode === "github") {
      var r = S.gh.repo;
      return /\.github\.io$/i.test(r) ? "https://" + r + "/" : "https://" + S.gh.owner + ".github.io/" + r + "/";
    }
    return "../index.html";
  }
  function render() {
    root.className = "";
    root.innerHTML = "";
    var nav = function (v, label, ic) {
      return h("a", { class: "rail-btn", href: "#" + v, "aria-current": String(S.view === v || (v === "projects" && S.view === "edit")) }, icon(ic), h("span", { text: label }));
    };
    var where = S.mode === "github" ? S.gh.owner + "/" + S.gh.repo + " · " + S.gh.branch : "Local folder: " + (S.dir && S.dir.name);
    var rail = h("nav", { class: "rail", "aria-label": "Admin" },
      h("div", { class: "brand" }, h("span", { class: "logo" }, "CK"), h("div", null, h("b", { text: "Portfolio" }), h("span", { text: "Admin" }))),
      nav("projects", "Projects", "grid"),
      nav("profile", "Profile", "user"),
      nav("resume", "Resume", "doc"),
      nav("certifications", "Certifications", "award"),
      nav("links", "Project links", "link"),
      nav("settings", "Settings", "gear"),
      h("a", { class: "rail-btn", href: siteURL(), target: "_blank", rel: "noopener" }, icon("ext"), h("span", { text: "View site" })),
      h("div", { class: "rail-spacer" }),
      h("div", { class: "rail-meta", text: where }));
    var main = h("main", { class: "main" });
    root.appendChild(h("div", { class: "shell" }, rail, main));
    ({ projects: viewProjects, edit: viewEditor, profile: viewProfile, resume: viewResume, certifications: viewCerts, links: viewLinks, settings: viewSettings })[S.view](main);
    updateSaveState();
  }
  function topBar(title, extra) {
    return h("header", { class: "bar" },
      extra && extra.before,
      h("h1", { text: title }),
      h("span", { class: "save-state", id: "saveState" }),
      extra && extra.after,
      h("button", { type: "button", class: "btn btn-primary", id: "saveBtn", onclick: save, title: "Save (Ctrl/Cmd + S)" }, icon("save"), "Save"));
  }

  /* ================= Projects list ================= */
  function viewProjects(main) {
    var P = S.data.projects;
    main.appendChild(topBar("Projects", { after: h("button", { type: "button", class: "btn", onclick: function () { preview("work"); } }, icon("eye"), "Preview") }));
    var page = h("div", { class: "page" });
    main.appendChild(page);
    var search = h("input", { type: "search", id: "projSearch", placeholder: "Search projects", value: S.filter, oninput: function () { S.filter = search.value; draw(); } });
    page.appendChild(h("div", { class: "toolbar" },
      h("button", { type: "button", class: "btn btn-primary", onclick: newProject }, icon("plus"), "New project"),
      h("div", { class: "grow" }, search),
      h("span", { class: "muted", text: "Drag cards to change the order on your site." })));
    var list = h("div", { class: "plist" });
    page.appendChild(list);
    function draw() {
      list.innerHTML = "";
      if (!P.length) {
        list.appendChild(h("div", { class: "empty-state", style: { "grid-column": "1 / -1" } }, h("p", { text: "No projects yet." }),
          h("button", { type: "button", class: "btn btn-primary", onclick: newProject }, icon("plus"), "Create your first project")));
        return;
      }
      var q = S.filter.trim().toLowerCase();
      P.forEach(function (p, i) {
        if (q && (p.title + " " + p.client + " " + p.category + " " + p.domain).toLowerCase().indexOf(q) < 0) return;
        var star = iconBtn("star", p.featured ? "Remove Featured badge" : "Mark as Featured", function () { p.featured = !p.featured; markDirty("projects"); draw(); }, "star");
        star.setAttribute("aria-pressed", String(!!p.featured));
        list.appendChild(h("article", { class: "pcard", "data-i": i },
          h("div", { class: "pcard-cover", onclick: function () { go("edit-" + i); } },
            p.cover ? h("img", { src: src(p.cover), alt: "", loading: "lazy" }) : h("div", { class: "ph", text: "No cover yet" })),
          h("div", { class: "pcard-body" },
            h("div", { class: "pcard-title", title: p.title, text: p.title || "Untitled" }),
            h("div", { class: "muted", style: { "font-size": "12.5px" }, text: [p.domain || p.category, p.client].filter(Boolean).join(" · ") || "No domain yet" }),
            h("div", { class: "pcard-foot" },
              h("span", { class: "pill " + (p.status === "draft" ? "pill-draft" : "pill-pub"), text: p.status === "draft" ? "Draft" : "Published" }),
              h("span", { class: "grow" }),
              star,
              iconBtn("copy", "Duplicate", function () {
                var c = clone(p); c.title += " (copy)"; c.slug = slugify(c.title) + "-" + uid().slice(-4); c.status = "draft";
                P.splice(i + 1, 0, c); markDirty("projects"); draw();
              }),
              iconBtn("trash", "Delete", function () {
                confirmBox("Delete \"" + p.title + "\"?", "It disappears from your site when you save. This can't be undone from the admin.", "Delete", true).then(function (ok) {
                  if (ok) { P.splice(i, 1); markDirty("projects"); draw(); }
                });
              }, "danger"),
              h("span", { class: "icon-btn drag", title: "Drag to reorder", "aria-hidden": "true" }, icon("drag"))))));
      });
    }
    draw();
    if (window.Sortable) {
      window.Sortable.create(list, { forceFallback: true, fallbackTolerance: 3, onStart: function () { document.body.classList.add("is-dragging"); }, onUnchoose: function () { document.body.classList.remove("is-dragging"); },
        animation: 150, handle: ".drag, .pcard-body", filter: "button", preventOnFilter: false,
        onEnd: function (e) {
          if (e.oldIndex === e.newIndex || S.filter) { draw(); return; }
          var item = P.splice(e.oldIndex, 1)[0]; P.splice(e.newIndex, 0, item); markDirty("projects"); draw();
        }
      });
    }
  }
  function newProject() {
    var p = normaliseProject({
      slug: "untitled-" + uid().slice(-5), title: "Untitled project", status: "draft", featured: false,
      client: "", category: "", domain: "", year: String(new Date().getFullYear()), date: new Date().toISOString().slice(0, 10),
      role: "", tools: [], tags: [], summary: "", cover: "", bg: "", modules: [], link: ""
    });
    S.data.projects.unshift(p);
    markDirty("projects");
    go("edit-0");
  }

  /* ================= Project editor (Behance-style) ================= */
  var MOD_LABEL = { text: "Text", image: "Image", grid: "Photo grid", video: "Video / embed", divider: "Spacer" };
  function newModule(type) {
    if (type === "text") return { type: "text", text: "" };
    if (type === "image") return { type: "image", image: "", caption: "", width: "full" };
    if (type === "grid") return { type: "grid", images: [], size: "m", gap: 6 };
    if (type === "video") return { type: "video", url: "", caption: "" };
    return { type: "divider" };
  }
  function embedInfo(url) {
    url = (url || "").trim(); var m;
    if ((m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{6,})/))) return { kind: "iframe", src: "https://www.youtube-nocookie.com/embed/" + m[1], name: "YouTube" };
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/))) return { kind: "iframe", src: "https://player.vimeo.com/video/" + m[1], name: "Vimeo" };
    if ((m = url.match(/loom\.com\/(?:share|embed)\/([\w-]+)/))) return { kind: "iframe", src: "https://www.loom.com/embed/" + m[1], name: "Loom" };
    if (/figma\.com\/(file|design|proto|board)\//.test(url)) return { kind: "iframe", src: "https://www.figma.com/embed?embed_host=share&url=" + encodeURIComponent(url), name: "Figma" };
    if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) return { kind: "video", src: src(url), name: "Video file" };
    if (/^https:\/\//.test(url)) return { kind: "iframe", src: url, name: "Embed" };
    return null;
  }
  function inkFor(hex) {
    var m = String(hex).replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!m) return "";
    var l = (0.299 * parseInt(m[1], 16) + 0.587 * parseInt(m[2], 16) + 0.114 * parseInt(m[3], 16)) / 255;
    return l > 0.6 ? "#111A30" : "#F3F4F8";
  }

  function viewEditor(main) {
    var i = S.editing, p = S.data.projects[i];
    var dirty = function () { markDirty("projects"); };
    var statusSel = h("select", { id: "pStatus", style: { width: "auto" }, onchange: function () { p.status = statusSel.value; dirty(); } },
      h("option", { value: "draft", selected: p.status === "draft" }, "Draft (hidden)"),
      h("option", { value: "published", selected: p.status !== "draft" }, "Published"));
    main.appendChild(topBar(p.title || "Untitled project", {
      before: h("a", { class: "btn", href: "#projects" }, icon("back"), "Projects"),
      after: [statusSel, h("button", { type: "button", class: "btn", onclick: function () { preview("p-" + slugify(p.slug || p.title)); } }, icon("eye"), "Preview")]
    }));

    var canvas = h("div", { class: "ed-canvas" + (p.bg ? " has-bg" : ""), style: { "--cbg": p.bg || "", "--cink": inkFor(p.bg) || "" } });
    var edMain = h("div", { class: "ed-main" }, canvas, adder());
    var ed = h("div", { class: "ed" }, edMain, sidePanel());
    main.appendChild(ed);
    drawCanvas();

    // Drag & drop images straight onto the canvas
    canvas.addEventListener("dragover", function (e) { if (hasFiles(e)) { e.preventDefault(); canvas.classList.add("dropping"); } });
    canvas.addEventListener("dragleave", function () { canvas.classList.remove("dropping"); });
    canvas.addEventListener("drop", function (e) {
      if (!hasFiles(e)) return;
      e.preventDefault(); canvas.classList.remove("dropping");
      addImageFiles(Array.prototype.slice.call(e.dataTransfer.files), p.modules.length);
    });
    function hasFiles(e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], "Files") > -1; }

    function addImageFiles(files, at) {
      files = files.filter(function (f) { return /^image\//.test(f.type) || /^video\//.test(f.type); });
      if (!files.length) return;
      var done = busy("Adding " + files.length + " file" + (files.length > 1 ? "s" : "") + "…");
      Promise.all(files.map(function (f) {
        return upload(f, /^video\//.test(f.type) ? null : PRESET.content, p.slug).then(function (path) {
          return /^video\//.test(f.type) ? { type: "video", url: path, caption: "" } : { type: "image", image: path, caption: "", width: "full" };
        });
      })).then(function (mods) {
        Array.prototype.splice.apply(p.modules, [at, 0].concat(mods)); dirty(); drawCanvas();
      }, function (e) { toast(e.message, true); }).then(done);
    }
    function insertModule(type, at) {
      if (type === "image") {
        pickFiles("image/*", true).then(function (files) { if (files.length) addImageFiles(files, at); });
        return;
      }
      var m = newModule(type);
      p.modules.splice(at, 0, m);
      if (type === "text") S.editingText = m;
      dirty(); drawCanvas();
      if (type === "grid") pickGrid(m);
    }
    function pickGrid(m) {
      pickFiles("image/*", true).then(function (files) {
        if (!files.length) return;
        var done = busy("Adding images…");
        Promise.all(files.map(function (f) {
          return upload(f, PRESET.content, p.slug).then(function (pa) {
            return imageSize(src(pa)).then(function (d) { return { image: pa, caption: "", w: d.w, h: d.h }; });
          });
        })).then(function (items) {
          items.forEach(function (it) { m.images.push(it); });
          dirty(); drawCanvas();
        }, function (e) { toast(e.message, true); }).then(done);
      });
    }

    function adder() {
      var b = function (type, ic) {
        return h("button", { type: "button", class: "adder-btn", onclick: function () { insertModule(type, p.modules.length); } }, icon(ic), MOD_LABEL[type]);
      };
      return h("div", { class: "adder" },
        h("p", { text: "Add content — or drag images onto the canvas" }),
        h("div", { class: "adder-btns" }, b("image", "image"), b("text", "text"), b("grid", "gridimg"), b("video", "video"), b("divider", "divider")));
    }
    function insertLine(at) {
      var wrap = h("div", { class: "insert" });
      var btn = h("button", { type: "button", title: "Insert content here", "aria-label": "Insert content here", onclick: function (e) {
        e.stopPropagation();
        var old = wrap.querySelector(".menu"); if (old) { old.remove(); return; }
        var menu = h("div", { class: "menu" }, Object.keys(MOD_LABEL).map(function (t) {
          return h("button", { type: "button", onclick: function () { menu.remove(); insertModule(t, at); } }, MOD_LABEL[t]);
        }));
        wrap.appendChild(menu);
        setTimeout(function () { document.addEventListener("click", function off() { menu.remove(); document.removeEventListener("click", off); }); });
      } }, icon("plus"));
      wrap.appendChild(btn);
      return wrap;
    }

    function drawCanvas() {
      canvas.innerHTML = "";
      canvas.className = "ed-canvas" + (p.bg ? " has-bg" : "");
      canvas.style.setProperty("--cbg", p.bg || "");
      canvas.style.setProperty("--cink", inkFor(p.bg) || "");
      if (!p.modules.length) {
        canvas.appendChild(h("div", { class: "drop", onclick: function () { insertModule("image", 0); } },
          h("p", { style: { margin: "0 0 4px", "font-weight": "600" }, text: "Start building your project" }),
          h("p", { style: { margin: 0 }, text: "Drop images here, click to upload, or use the buttons below." })));
        return;
      }
      p.modules.forEach(function (m, idx) {
        canvas.appendChild(insertLine(idx));
        canvas.appendChild(moduleBlock(m, idx));
      });
      canvas.appendChild(insertLine(p.modules.length));
      if (window.Sortable) {
        window.Sortable.create(canvas, { forceFallback: true, fallbackTolerance: 3, onStart: function () { document.body.classList.add("is-dragging"); }, onUnchoose: function () { document.body.classList.remove("is-dragging"); },
          animation: 150, handle: ".mb-handle", draggable: ".mb",
          onEnd: function (e) {
            var blocks = Array.prototype.slice.call(canvas.querySelectorAll(".mb"));
            var order = blocks.map(function (b) { return +b.getAttribute("data-idx"); });
            var changed = order.some(function (v, k) { return v !== k; });
            if (changed) { p.modules = order.map(function (k) { return p.modules[k]; }); dirty(); }
            drawCanvas();
          }
        });
      }
    }

    function moduleBlock(m, idx) {
      var tools = h("div", { class: "mb-tools" },
        h("span", { class: "icon-btn mb-handle", title: "Drag to move", "aria-hidden": "true" }, icon("drag")),
        iconBtn("up", "Move up", function () { if (idx > 0) { p.modules.splice(idx - 1, 0, p.modules.splice(idx, 1)[0]); dirty(); drawCanvas(); } }),
        iconBtn("down", "Move down", function () { if (idx < p.modules.length - 1) { p.modules.splice(idx + 1, 0, p.modules.splice(idx, 1)[0]); dirty(); drawCanvas(); } }),
        iconBtn("copy", "Duplicate", function () { p.modules.splice(idx + 1, 0, clone(m)); dirty(); drawCanvas(); }),
        iconBtn("trash", "Delete", function () { p.modules.splice(idx, 1); dirty(); drawCanvas(); }, "danger"));
      var block = h("section", { class: "mb", "data-idx": idx, "aria-label": MOD_LABEL[m.type] || "Block" },
        h("span", { class: "mb-type", text: MOD_LABEL[m.type] || m.type }), tools);
      add(block, ({ text: textModule, image: imageModule, grid: gridModule, video: videoModule, divider: function () { return h("div", { class: "md" }); } }[m.type] || function () { return h("div", { class: "md" }); })(m));
      return block;
    }

    function textModule(m) {
      var wrap = h("div", { class: "mt" });
      function view() {
        wrap.innerHTML = "";
        var v = h("div", { class: "mt-view prose", tabindex: "0", title: "Click to edit", html: m.text ? md(m.text) : "" });
        v.addEventListener("click", function (e) { if (e.target.closest("a")) e.preventDefault(); S.editingText = m; edit(); });
        v.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); S.editingText = m; edit(); } });
        wrap.appendChild(v);
      }
      function edit() {
        wrap.innerHTML = "";
        var ta = h("textarea", { "aria-label": "Text", placeholder: "Write your story. Start a line with ## for a heading, - for a list, > for a quote.", oninput: function () { m.text = ta.value; dirty(); grow(); } });
        ta.value = m.text || "";
        var grow = function () { ta.style.height = "auto"; ta.style.height = Math.max(220, ta.scrollHeight + 4) + "px"; };
        var wrapSel = function (before, after, placeholder) {
          var s = ta.selectionStart, e = ta.selectionEnd, sel = ta.value.slice(s, e) || placeholder;
          ta.setRangeText(before + sel + after, s, e, "end");
          ta.focus(); m.text = ta.value; dirty();
        };
        var line = function (prefix) {
          var s = ta.selectionStart, start = ta.value.lastIndexOf("\n", s - 1) + 1;
          ta.setRangeText(prefix, start, start, "end"); ta.focus(); m.text = ta.value; dirty();
        };
        var bar = h("div", { class: "mt-bar" },
          h("button", { type: "button", onclick: function () { line("## "); } }, "Heading"),
          h("button", { type: "button", onclick: function () { line("### "); } }, "Subheading"),
          h("button", { type: "button", onclick: function () { wrapSel("**", "**", "bold text"); } }, "B"),
          h("button", { type: "button", style: { "font-style": "italic" }, onclick: function () { wrapSel("_", "_", "italic text"); } }, "I"),
          h("button", { type: "button", onclick: function () { line("- "); } }, "• List"),
          h("button", { type: "button", onclick: function () { line("1. "); } }, "1. List"),
          h("button", { type: "button", onclick: function () { line("> "); } }, "Quote"),
          h("button", { type: "button", onclick: function () {
            var url = window.prompt ? window.prompt("Link address (https://…)") : null;
            if (url) wrapSel("[", "](" + url + ")", "link text");
          } }, "Link"),
          h("span", { style: { flex: 1 } }),
          h("button", { type: "button", onclick: function () { S.editingText = null; view(); } }, "Done"));
        wrap.appendChild(bar); wrap.appendChild(ta);
        setTimeout(function () { grow(); ta.focus(); });
        ta.addEventListener("blur", function () {
          setTimeout(function () { if (!wrap.contains(document.activeElement)) { S.editingText = null; view(); } }, 150);
        });
      }
      if (S.editingText === m) edit(); else view();
      return wrap;
    }
    function caption(obj) {
      var c = h("input", { type: "text", class: "cap", placeholder: "Add a caption (optional)", value: obj.caption || "", oninput: function () { obj.caption = c.value; dirty(); } });
      return c;
    }
    function imageModule(m) {
      if (!m.image) return h("div", { class: "drop", onclick: function () {
        pickFiles("image/*").then(function (f) {
          if (!f.length) return;
          upload(f[0], PRESET.content, p.slug).then(function (path) { m.image = path; dirty(); drawCanvas(); }, function (e) { toast(e.message, true); });
        });
      } }, "Click to choose an image");
      var widthSel = h("select", { style: { width: "auto" }, "aria-label": "Image width", onchange: function () { m.width = widthSel.value; dirty(); drawCanvas(); } },
        h("option", { value: "full", selected: m.width !== "contained" }, "Full width"),
        h("option", { value: "contained", selected: m.width === "contained" }, "With margins"));
      return h("div", null,
        h("figure", { class: "mi" + (m.width === "contained" ? " contained" : ""), style: { margin: 0 } }, h("img", { src: src(m.image), alt: m.caption || "" })),
        caption(m),
        h("div", { class: "mg-bar" }, widthSel,
          h("button", { type: "button", class: "btn btn-sm", onclick: function () {
            pickFiles("image/*").then(function (f) {
              if (!f.length) return;
              upload(f[0], PRESET.content, p.slug).then(function (path) { m.image = path; dirty(); drawCanvas(); }, function (e) { toast(e.message, true); });
            });
          } }, "Replace image")));
    }
    function gridModule(m) {
      if (!m.size) m.size = "m";
      if (m.gap == null) m.gap = 6;
      var sizeSel = h("select", { style: { width: "auto" }, "aria-label": "Row height", onchange: function () { m.size = sizeSel.value; dirty(); window.Justify && (grid.setAttribute("data-size", m.size), Justify.layout(grid)); } },
        [["s", "Compact rows"], ["m", "Standard rows"], ["l", "Large rows"]].map(function (o) { return h("option", { value: o[0], selected: m.size === o[0] }, o[1]); }));
      var gapSel = h("select", { style: { width: "auto" }, "aria-label": "Spacing between images", onchange: function () { m.gap = +gapSel.value; dirty(); window.Justify && (grid.setAttribute("data-gap", m.gap), Justify.layout(grid)); } },
        [[0, "No spacing"], [6, "Small spacing"], [12, "Medium spacing"], [20, "Large spacing"]].map(function (o) { return h("option", { value: o[0], selected: +m.gap === o[0] }, o[1]); }));
      var grid = h("div", { class: "mg jgrid", "data-size": m.size, "data-gap": m.gap });
      (m.images || []).forEach(function (g, k) {
        var item = h("div", { class: "mg-item jg-item", "data-k": k, "data-w": g.w || null, "data-h": g.h || null },
          h("img", { src: src(g.image), alt: g.caption || "" }),
          iconBtn("close", "Remove image", function () { m.images.splice(k, 1); dirty(); drawCanvas(); }));
        // remember sizes of older images once they load, so the live site lays out instantly
        if (!g.w) imageSize(src(g.image)).then(function (d) { g.w = d.w; g.h = d.h; }, function () {});
        grid.appendChild(item);
      });
      if (window.Sortable && m.images.length > 1) {
        window.Sortable.create(grid, { forceFallback: true, fallbackTolerance: 3, onStart: function () { document.body.classList.add("is-dragging"); }, onUnchoose: function () { document.body.classList.remove("is-dragging"); }, animation: 150, onEnd: function (e) {
          if (e.oldIndex === e.newIndex) { Justify.layout(grid); return; }
          m.images.splice(e.newIndex, 0, m.images.splice(e.oldIndex, 1)[0]); dirty(); drawCanvas();
        } });
      }
      if (window.Justify) requestAnimationFrame(function () { Justify.watch(grid); });
      return h("div", null,
        m.images.length ? grid : h("div", { class: "drop", onclick: function () { pickGrid(m); } }, "Click to choose images for the grid"),
        h("div", { class: "mg-bar" }, sizeSel, gapSel,
          h("button", { type: "button", class: "btn btn-sm", onclick: function () { pickGrid(m); } }, icon("plus"), "Add images"),
          m.images.length > 1 ? h("span", { class: "muted", style: { "font-size": "12px" }, text: "Images fit into rows automatically. Drag to reorder." }) : null));
    }
    function videoModule(m) {
      var info = h("div");
      var url = h("input", { type: "url", placeholder: "Paste a YouTube, Vimeo, Loom or Figma link", value: m.url || "", oninput: function () { m.url = url.value.trim(); dirty(); draw(); } });
      function draw() {
        info.innerHTML = "";
        var e = embedInfo(m.url);
        if (!m.url) return;
        if (!e) { info.appendChild(h("p", { class: "muted", text: "That doesn't look like a link. It should start with https://" })); return; }
        info.appendChild(h("div", { class: "ratio" }, e.kind === "video"
          ? h("video", { src: e.src, controls: true, playsinline: true, preload: "metadata" })
          : h("iframe", { src: e.src, title: e.name, loading: "lazy", allow: "autoplay; fullscreen; picture-in-picture", allowfullscreen: true })));
      }
      draw();
      return h("div", { class: "mv" },
        h("div", { class: "file-row" }, h("div", { style: { flex: 1, "min-width": "200px" } }, url),
          h("button", { type: "button", class: "btn btn-sm", onclick: function () {
            pickFiles("video/mp4,video/webm,video/quicktime").then(function (f) {
              if (!f.length) return;
              upload(f[0], null, p.slug).then(function (path) { m.url = path; url.value = path; dirty(); draw(); }, function (e) { toast(e.message, true); });
            });
          } }, "Upload video")),
        info, caption(m));
    }

    function sidePanel() {
      var side = h("aside", { class: "ed-side", "aria-label": "Project settings" });
      var f = function (label, key, opts) {
        opts = opts || {};
        var el = opts.multiline ? h("textarea", { rows: opts.rows || 3 }) : h("input", { type: opts.type || "text", list: opts.list || null, placeholder: opts.placeholder || "" });
        el.value = Array.isArray(p[key]) ? p[key].join(", ") : (p[key] || "");
        el.addEventListener("input", function () {
          p[key] = opts.array ? el.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean) : el.value;
          if (key === "title") {
            var t = document.querySelector(".bar h1"); if (t) t.textContent = el.value || "Untitled project";
            if (!slugTouched) { p.slug = slugify(el.value); slugEl.value = p.slug; drawHint(); }
          }
          dirty();
        });
        return h("label", { class: "field" }, h("span", { class: "label" }, label), el, opts.hint ? h("span", { class: "hint", text: opts.hint }) : null);
      };
      var cats = {}, doms = {};
      ["Healthcare", "SaaS", "Fintech", "E-commerce", "D2C", "Graphics", "Branding"].forEach(function (d) { doms[d] = 1; });
      S.data.projects.forEach(function (x) { if (x.category) cats[x.category] = 1; if (x.domain) doms[x.domain] = 1; });
      var dl = function (id, obj) { return h("datalist", { id: id }, Object.keys(obj).map(function (v) { return h("option", { value: v }); })); };

      // Cover
      var coverBox = h("div", { class: "cover-box", tabindex: "0", role: "button", "aria-label": "Cover image: click to upload or adjust" });
      var drawCover = function () {
        coverBox.innerHTML = "";
        if (p.cover) coverBox.appendChild(h("img", { src: src(p.cover), alt: "Cover" }));
        else coverBox.appendChild(h("span", { text: "Upload cover (1440 × 1170)" }));
      };
      var coverOriginal = null; // the full image picked this session, so re-cropping never loses quality
      var applyCover = function (blob) {
        var path = "assets/uploads/" + slugify(p.slug + "-cover").slice(0, 40) + "-" + uid().slice(-5) + ".jpg";
        S.pending[path] = { blob: blob, url: URL.createObjectURL(blob) };
        markDirty("uploads");
        p.cover = "/" + path; dirty(); drawCover(); drawCoverButtons();
      };
      var pickCover = function () {
        pickFiles("image/*").then(function (files) {
          if (!files.length) return;
          if (!/^image\/(jpeg|png|webp|bmp|gif)$/.test(files[0].type)) { toast("Choose a JPG, PNG or WebP image for the cover.", true); return; }
          coverOriginal = URL.createObjectURL(files[0]);
          cropper(coverOriginal, PRESET.cover.w, PRESET.cover.h, "Adjust cover").then(function (blob) { if (blob) applyCover(blob); });
        });
      };
      var adjustCover = function () {
        var source = coverOriginal || src(p.cover);
        cropper(source, PRESET.cover.w, PRESET.cover.h, "Adjust cover").then(function (blob) { if (blob) applyCover(blob); },
          function () { toast("This cover can't be re-cropped here. Click Change cover and pick the image again.", true); });
      };
      var coverBtns = h("div", { class: "file-row", style: { "margin-top": "8px" } });
      var drawCoverButtons = function () {
        coverBtns.innerHTML = "";
        add(coverBtns, [
          h("button", { type: "button", class: "btn btn-sm", onclick: pickCover }, p.cover ? "Change cover" : "Upload cover"),
          p.cover ? h("button", { type: "button", class: "btn btn-sm", onclick: adjustCover }, "Adjust crop") : null,
          h("span", { class: "hint", text: "1440 × 1170 px. You can drag, zoom or fit the image after choosing it." })
        ]);
      };
      drawCoverButtons();
      coverBox.addEventListener("click", function () { if (p.cover) adjustCover(); else pickCover(); });
      coverBox.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (p.cover) adjustCover(); else pickCover(); } });
      drawCover();

      var slugTouched = !/^untitled-/.test(p.slug || "");
      var slugHint = h("span", { class: "hint" });
      var drawHint = function () { slugHint.textContent = "Project link: …/#p-" + slugify(p.slug || p.title); };
      var slugEl = h("input", { type: "text", value: p.slug || "", oninput: function () { slugTouched = true; p.slug = slugEl.value; drawHint(); dirty(); } });
      slugEl.addEventListener("blur", function () { p.slug = slugify(slugEl.value || p.title); slugEl.value = p.slug; drawHint(); });
      drawHint();

      var featured = h("input", { type: "checkbox", checked: !!p.featured, onchange: function () { p.featured = featured.checked; dirty(); } });
      var color = h("input", { type: "color", value: p.bg || "#ffffff", "aria-label": "Background colour", oninput: function () { p.bg = color.value; dirty(); drawCanvas(); } });
      var sw = ["", "#FFFFFF", "#F4F1EC", "#E9EEF6", "#111A30", "#0B0B0B", "#1F3B2D"].map(function (c) {
        return h("button", { type: "button", title: c || "No background", "aria-label": c ? "Background " + c : "No background",
          style: { background: c || "linear-gradient(135deg, transparent 45%, #C2283B 45% 55%, transparent 55%)" },
          onclick: function () { p.bg = c; if (c) color.value = c; dirty(); drawCanvas(); } });
      });

      add(side, [
        h("h2", { text: "Project settings" }),
        h("div", { class: "field" }, h("span", { class: "label" }, "Cover image"), coverBox, coverBtns),
        f("Title", "title"),
        h("label", { class: "field" }, h("span", { class: "label" }, "URL name"), slugEl, slugHint),
        f("Short summary", "summary", { multiline: true, rows: 3, hint: "Shown on hover and at the top of the project." }),
        f("Domain", "domain", { list: "dlDoms", placeholder: "e.g. Healthcare", hint: "One word. It becomes a filter button above your projects. Pick one you used before, or type a new one." }),
        dl("dlDoms", doms),
        f("Client / company", "client"),
        h("div", { class: "row" }, f("Your role", "role"), f("Year", "year")),
        f("Published date", "date", { type: "date" }),
        f("Tools used", "tools", { array: true, placeholder: "Figma, Photoshop", hint: "Separate with commas." }),
        f("Tags", "tags", { array: true, placeholder: "Dashboard, Healthcare", hint: "Separate with commas." }),
        f("Live link", "link", { type: "url", placeholder: "https://" }),
        h("label", { class: "switch" }, featured, "Show Featured badge"),
        h("hr", { class: "side-sep" }),
        h("div", { class: "field" }, h("span", { class: "label" }, "Canvas background"),
          h("div", { class: "color-row" }, color, h("div", { class: "swatches" }, sw))),
        h("hr", { class: "side-sep" }),
        h("button", { type: "button", class: "btn btn-danger", onclick: function () {
          confirmBox("Delete this project?", "\"" + p.title + "\" will be removed from your site when you save.", "Delete", true).then(function (ok) {
            if (!ok) return;
            S.data.projects.splice(i, 1); markDirty("projects"); go("projects");
          });
        } }, icon("trash"), "Delete project")
      ]);
      return side;
    }
  }

  /* ================= Generic form helpers ================= */
  function bindField(obj, key, label, opts, onchange) {
    opts = opts || {};
    var el = opts.multiline ? h("textarea", { rows: opts.rows || 4 }) : h("input", { type: opts.type || "text", placeholder: opts.placeholder || "" });
    var v = obj[key];
    el.value = Array.isArray(v) ? (opts.lines ? v.join("\n") : v.join(", ")) : (v == null ? "" : v);
    el.addEventListener("input", function () {
      if (opts.lines) obj[key] = el.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
      else if (opts.array) obj[key] = el.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      else obj[key] = el.value;
      onchange && onchange();
    });
    return h("label", { class: "field" }, label ? h("span", { class: "label" }, label) : null, el, opts.hint ? h("span", { class: "hint", text: opts.hint }) : null);
  }
  function listSection(title, arr, renderItem, blank, onchange, open) {
    var body = h("div", { class: "section-body" });
    var count = h("span", { class: "count" });
    var det = h("details", { class: "section", open: !!open }, h("summary", null, title, count), body);
    function draw() {
      body.innerHTML = "";
      count.textContent = arr.length ? "(" + arr.length + ")" : "";
      arr.forEach(function (item, k) {
        var head = h("div", { class: "item-head" },
          h("b", { text: (renderItem.title && renderItem.title(item)) || "Item " + (k + 1) }),
          iconBtn("up", "Move up", function () { if (k) { arr.splice(k - 1, 0, arr.splice(k, 1)[0]); onchange(); draw(); } }),
          iconBtn("down", "Move down", function () { if (k < arr.length - 1) { arr.splice(k + 1, 0, arr.splice(k, 1)[0]); onchange(); draw(); } }),
          iconBtn("trash", "Remove", function () { arr.splice(k, 1); onchange(); draw(); }, "danger"));
        body.appendChild(h("div", { class: "item" }, head, renderItem(item, function () { onchange(); var t = renderItem.title && renderItem.title(item); if (t) head.firstChild.textContent = t; })));
      });
      body.appendChild(h("button", { type: "button", class: "btn", style: { "align-self": "flex-start" }, onclick: function () { arr.push(blank()); onchange(); draw(); } }, icon("plus"), "Add"));
    }
    draw();
    return det;
  }

  /* ================= Profile ================= */
  function viewProfile(main) {
    var s = S.data.site, dirty = function () { markDirty("site"); };
    main.appendChild(topBar("Profile", { after: h("button", { type: "button", class: "btn", onclick: function () { preview("about"); } }, icon("eye"), "Preview") }));
    var av = h("div", { class: "av" });
    var drawAv = function () {
      av.innerHTML = "";
      if (s.photo) av.appendChild(h("img", { src: src(s.photo), alt: "" }));
      else av.textContent = (s.name || "").split(/\s+/).map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase();
    };
    drawAv();
    // Banner (top of the profile page), cropped to 3200 × 480
    var bannerBox = h("div", { class: "banner-edit", role: "button", tabindex: "0", "aria-label": "Banner image: click to upload or adjust" });
    var bannerOriginal = null;
    var drawBanner = function () {
      bannerBox.innerHTML = "";
      bannerBox.style.backgroundImage = s.banner ? 'url("' + src(s.banner) + '")' : "";
      bannerBox.classList.toggle("is-empty", !s.banner);
      if (!s.banner) bannerBox.appendChild(h("span", { text: "Upload banner (3200 × 480). Without one, a soft indigo banner is used." }));
      bannerBtns.innerHTML = "";
      add(bannerBtns, [
        h("button", { type: "button", class: "btn btn-sm", onclick: pickBanner }, s.banner ? "Change banner" : "Upload banner"),
        s.banner ? h("button", { type: "button", class: "btn btn-sm", onclick: adjustBanner }, "Adjust crop") : null,
        s.banner ? h("button", { type: "button", class: "btn btn-sm btn-danger", onclick: function () { s.banner = ""; bannerOriginal = null; dirty(); drawBanner(); } }, "Remove") : null
      ]);
    };
    var applyBanner = function (blob) {
      var path = "assets/uploads/banner-" + uid().slice(-6) + ".jpg";
      S.pending[path] = { blob: blob, url: URL.createObjectURL(blob) };
      markDirty("uploads");
      s.banner = "/" + path; dirty(); drawBanner();
    };
    var pickBanner = function () {
      pickFiles("image/*").then(function (f) {
        if (!f.length) return;
        bannerOriginal = URL.createObjectURL(f[0]);
        cropper(bannerOriginal, 3200, 480, "Adjust banner").then(function (b) { if (b) applyBanner(b); });
      });
    };
    var adjustBanner = function () {
      cropper(bannerOriginal || src(s.banner), 3200, 480, "Adjust banner").then(function (b) { if (b) applyBanner(b); },
        function () { toast("This banner can't be re-cropped here. Click Change banner and pick the image again.", true); });
    };
    var bannerBtns = h("div", { class: "file-row" });
    bannerBox.addEventListener("click", function () { if (s.banner) adjustBanner(); else pickBanner(); });
    bannerBox.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (s.banner) adjustBanner(); else pickBanner(); } });
    drawBanner();
    var page = h("div", { class: "page page-narrow" },
      h("details", { class: "section", open: true }, h("summary", null, "Basics"),
        h("div", { class: "section-body" },
          h("div", { class: "field" }, h("span", { class: "label" }, "Banner"), bannerBox, bannerBtns),
          h("div", { class: "avatar-edit" }, av, h("div", { class: "file-row" },
            h("button", { type: "button", class: "btn", onclick: function () {
              pickFiles("image/*").then(function (f) {
                if (!f.length) return;
                upload(f[0], PRESET.avatar, "profile").then(function (path) { s.photo = path; dirty(); drawAv(); }, function (e) { toast(e.message, true); });
              });
            } }, "Upload photo"),
            h("button", { type: "button", class: "btn btn-danger", onclick: function () { s.photo = ""; dirty(); drawAv(); } }, "Remove"),
            h("span", { class: "hint muted", text: "Square crop, 640 × 640." }))),
          h("div", { class: "row" }, bindField(s, "name", "Name", null, dirty), bindField(s, "role", "Title", null, dirty)),
          h("div", { class: "row" }, bindField(s, "location", "Location", null, dirty), bindField(s, "availability", "Availability badge", { hint: "Leave empty to hide." }, dirty)),
          h("div", { class: "row" }, bindField(s, "email", "Email", { type: "email" }, dirty), bindField(s, "linkedin", "LinkedIn URL", { type: "url" }, dirty)),
          bindField(s, "behance", "Behance URL (optional)", { type: "url" }, dirty))),
      h("details", { class: "section", open: true }, h("summary", null, "About tab"),
        h("div", { class: "section-body" },
          bindField(s, "headline", "Headline", { multiline: true, rows: 2 }, dirty),
          bindField(s, "about", "About text", { multiline: true, rows: 9, hint: "Leave a blank line between paragraphs." }, dirty))),
      h("details", { class: "section", open: true }, h("summary", null, "Sidebar"),
        h("div", { class: "section-body" },
          bindField(s, "skills", "Skills", { multiline: true, rows: 5, lines: true, hint: "One per line." }, dirty),
          bindField(s, "tools", "Tools", { multiline: true, rows: 5, lines: true, hint: "One per line. Certifications come from the Resume section." }, dirty))));
    main.appendChild(page);
  }

  /* ================= Resume ================= */
  function viewResume(main) {
    var r = S.data.resume;
    ["skillGroups", "experience", "education", "certifications", "projects", "languages"].forEach(function (k) { if (!Array.isArray(r[k])) r[k] = []; });
    var paper = h("div", { class: "paper", "aria-label": "Resume preview" });
    var redraw = function () { paper.innerHTML = resumeHTML(r); };
    var dirty = function () { markDirty("resume"); redraw(); };
    var status = h("p", { class: "muted mono", role: "status", style: { margin: 0, "min-height": "1.3em" } });
    var dl = function (kind) {
      if (!window.ResumeExport) { toast("The export tool didn't load. Refresh the page.", true); return; }
      status.textContent = "Creating " + (kind === "pdf" ? "PDF" : "Word file") + "…";
      window.ResumeExport[kind](r).then(function () { status.textContent = "Downloaded."; }, function (e) { status.textContent = "Couldn't create the file: " + e.message; });
    };
    main.appendChild(topBar("Resume", { after: h("button", { type: "button", class: "btn", onclick: function () { preview("resume"); } }, icon("eye"), "Preview") }));

    var fileRow = function (key, label, accept) {
      var row = h("div", { class: "file-row" });
      var draw = function () {
        row.innerHTML = "";
        row.appendChild(h("span", { class: "label", style: { margin: 0, "min-width": "120px" } }, label));
        if (r[key]) {
          row.appendChild(h("code", { text: r[key].split("/").pop() }));
          row.appendChild(h("button", { type: "button", class: "btn btn-sm btn-danger", onclick: function () { r[key] = ""; dirty(); draw(); } }, "Remove"));
        } else {
          row.appendChild(h("span", { class: "muted", text: "Created from the content on this page" }));
        }
        row.appendChild(h("button", { type: "button", class: "btn btn-sm", onclick: function () {
          pickFiles(accept).then(function (f) {
            if (!f.length) return;
            upload(f[0], null, "resume").then(function (path) { r[key] = path; dirty(); draw(); }, function (e) { toast(e.message, true); });
          });
        } }, r[key] ? "Replace" : "Upload my own"));
      };
      draw();
      return row;
    };

    var form = h("div", null,
      h("details", { class: "section", open: true }, h("summary", null, "Header"),
        h("div", { class: "section-body" },
          h("div", { class: "row" }, bindField(r, "name", "Name", null, dirty), bindField(r, "location", "Location", null, dirty)),
          bindField(r, "title", "Headline / title", null, dirty),
          h("div", { class: "row" }, bindField(r, "email", "Email", { type: "email" }, dirty), bindField(r, "phone", "Phone", { hint: "Leave empty to keep it off the public site." }, dirty)),
          h("div", { class: "row" }, bindField(r, "linkedin", "LinkedIn URL", { type: "url" }, dirty), bindField(r, "website", "Portfolio URL", { type: "url" }, dirty)),
          bindField(r, "status", "Status line", { placeholder: "Immediate joiner · Open to relocate" }, dirty),
          bindField(r, "credential", "Credential line", null, dirty))),
      h("details", { class: "section", open: true }, h("summary", null, "Profile summary"),
        h("div", { class: "section-body" }, bindField(r, "summary", "", { multiline: true, rows: 7, hint: "Leave a blank line between paragraphs." }, dirty))),
      listSection("Core expertise", r.skillGroups, Object.assign(function (g, ch) {
        return h("div", { class: "stack" }, bindField(g, "name", "Group name", null, ch), bindField(g, "items", "Skills", { multiline: true, rows: 3, hint: "Separate skills with •" }, ch));
      }, { title: function (g) { return g.name; } }), function () { return { name: "", items: "" }; }, dirty),
      listSection("Experience", r.experience, Object.assign(function (x, ch) {
        return h("div", { class: "stack" },
          h("div", { class: "row" }, bindField(x, "role", "Role", null, ch), bindField(x, "company", "Company", null, ch)),
          h("div", { class: "row" }, bindField(x, "location", "Location", null, ch), bindField(x, "start", "Start", { placeholder: "Jan 2024" }, ch), bindField(x, "end", "End", { placeholder: "Present" }, ch)),
          bindField(x, "bullets", "Achievements", { multiline: true, rows: 6, lines: true, hint: "One point per line. The first three also show on the Experience tab." }, ch));
      }, { title: function (x) { return [x.role, x.company].filter(Boolean).join(" · "); } }), function () { return { role: "", company: "", location: "", start: "", end: "", bullets: [] }; }, dirty),
      listSection("Education", r.education, Object.assign(function (e, ch) {
        return h("div", { class: "row" }, bindField(e, "degree", "Degree", null, ch), bindField(e, "school", "School", null, ch), bindField(e, "year", "Year", null, ch));
      }, { title: function (e) { return [e.degree, e.school].filter(Boolean).join(" — "); } }), function () { return { degree: "", school: "", year: "" }; }, dirty),
      h("div", { class: "section note-box" }, h("p", { style: { margin: 0 } }, "Certifications are edited on their own page, with links and certificate images. ",
        h("a", { href: "#certifications" }, "Open Certifications →"))),
      h("details", { class: "section" }, h("summary", null, "Key projects & brands"),
        h("div", { class: "section-body" }, bindField(r, "projects", "", { multiline: true, rows: 9, lines: true, hint: "One per line." }, dirty))),
      listSection("Languages", r.languages, Object.assign(function (l, ch) {
        return h("div", { class: "row" }, bindField(l, "name", "Language", null, ch), bindField(l, "level", "Level", null, ch));
      }, { title: function (l) { return l.name; } }), function () { return { name: "", level: "" }; }, dirty),
      h("details", { class: "section" }, h("summary", null, "Download files"),
        h("div", { class: "section-body" },
          h("p", { class: "muted", style: { margin: 0 }, text: "By default, visitors get a PDF and a Word file built from this content, so they always match. Upload your own files only if you want to share a specially designed version." }),
          bindField(r, "fileName", "File name", { hint: "Without extension, e.g. Chandan_Kumar_Resume" }, dirty),
          fileRow("pdfFile", "PDF", "application/pdf,.pdf"),
          fileRow("docxFile", "Word", ".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document"))));

    var page = h("div", { class: "page" }, h("div", { class: "split" }, form,
      h("div", { class: "preview-col" },
        h("div", { class: "file-row" },
          h("button", { type: "button", class: "btn btn-primary", onclick: function () { dl("pdf"); } }, icon("download"), "Test PDF"),
          h("button", { type: "button", class: "btn", onclick: function () { dl("docx"); } }, icon("download"), "Test Word")),
        status, paper)));
    main.appendChild(page);
    redraw();
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function resumeHTML(r) {
    var out = "<h2>" + esc(r.name) + "</h2>";
    if (r.title) out += '<p class="t">' + esc(r.title) + "</p>";
    out += '<p class="c">' + [r.location, r.email, r.phone, r.linkedin && r.linkedin.replace(/^https?:\/\/(www\.)?/, "")].filter(Boolean).map(esc).join(" | ") + "</p>";
    var sub = [r.status, r.credential].filter(Boolean);
    if (sub.length) out += '<p class="c">' + sub.map(esc).join(" | ") + "</p>";
    var sec = function (t, b) { if (b) out += "<h3>" + esc(t) + "</h3>" + b; };
    sec("Profile summary", (r.summary || "").split(/\n{2,}/).filter(Boolean).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join(""));
    sec("Core expertise", r.skillGroups.length ? "<ul>" + r.skillGroups.map(function (g) { return "<li><b>" + esc(g.name) + "</b> – " + esc(g.items) + "</li>"; }).join("") + "</ul>" : "");
    sec("Professional experience", r.experience.map(function (x) {
      return '<div class="job"><div class="r"><b>' + esc(x.role) + "</b><span>" + esc([x.start, x.end].filter(Boolean).join(" – ")) + '</span></div><div class="r"><i>' + esc(x.company) + "</i><span>" + esc(x.location) + "</span></div><ul>" +
        (x.bullets || []).map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul></div>";
    }).join(""));
    sec("Education", r.education.length ? "<ul>" + r.education.map(function (e) { return "<li>" + esc([e.degree, e.school].filter(Boolean).join(" — ")) + (e.year ? " (" + esc(e.year) + ")" : "") + "</li>"; }).join("") + "</ul>" : "");
    sec("Certifications", r.certifications.length ? "<ul>" + r.certifications.map(function (c) { return "<li>" + esc([c.issuer, c.name].filter(Boolean).join(": ")) + (c.detail ? " — " + esc(c.detail) : "") + "</li>"; }).join("") + "</ul>" : "");
    sec("Key projects & brands", r.projects.length ? "<ul>" + r.projects.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul>" : "");
    sec("Languages", r.languages.length ? "<p>" + r.languages.map(function (l) { return esc(l.name) + (l.level ? " (" + esc(l.level) + ")" : ""); }).join(" • ") + "</p>" : "");
    return out;
  }

  /* ================= Image picker field (certificates, link thumbnails) ================= */
  function imageField(obj, key, label, hint, onchange) {
    var box = h("div", { class: "thumb-edit" });
    var draw = function () {
      box.innerHTML = "";
      if (obj[key]) box.appendChild(h("img", { src: src(obj[key]), alt: "" }));
      else box.appendChild(h("span", { class: "muted", text: "No image" }));
      box.appendChild(h("div", { class: "file-row" },
        h("button", { type: "button", class: "btn btn-sm", onclick: function () {
          pickFiles("image/*").then(function (f) {
            if (!f.length) return;
            upload(f[0], PRESET.content, key).then(function (path) { obj[key] = path; onchange(); draw(); }, function (e) { toast(e.message, true); });
          });
        } }, obj[key] ? "Change image" : "Upload image"),
        obj[key] ? h("button", { type: "button", class: "btn btn-sm btn-danger", onclick: function () { obj[key] = ""; onchange(); draw(); } }, "Remove") : null));
    };
    draw();
    return h("div", { class: "field" }, h("span", { class: "label" }, label), box, hint ? h("span", { class: "hint", text: hint }) : null);
  }

  /* ================= Certifications (stored in resume.json so the CV uses them too) ================= */
  function viewCerts(main) {
    var r = S.data.resume;
    if (!Array.isArray(r.certifications)) r.certifications = [];
    var dirty = function () { markDirty("resume"); };
    main.appendChild(topBar("Certifications", { after: h("button", { type: "button", class: "btn", onclick: function () { preview("certifications"); } }, icon("eye"), "Preview") }));
    main.appendChild(h("div", { class: "page page-narrow" },
      h("p", { class: "muted", style: { margin: "0 0 14px" }, text: "Each certificate shows as a card on the Certifications page of your site, and also appears on your resume." }),
      listSection("Certificates", r.certifications, Object.assign(function (c, ch) {
        return h("div", { class: "stack" },
          h("div", { class: "row" }, bindField(c, "name", "Certificate name", null, ch), bindField(c, "issuer", "Issued by", null, ch)),
          h("div", { class: "row" }, bindField(c, "detail", "Year / score", { placeholder: "2026 or 98%" }, ch), bindField(c, "url", "Certificate link", { type: "url", placeholder: "https://", hint: "Verification or credential page." }, ch)),
          imageField(c, "image", "Certificate image", "A photo or screenshot of the certificate. Visitors can click it to see it full size.", ch));
      }, { title: function (c) { return c.name; } }), function () { return { name: "", issuer: "", detail: "", url: "", image: "" }; }, dirty, true)));
  }

  /* ================= Project links (stored in site.json) ================= */
  function viewLinks(main) {
    var s = S.data.site;
    if (!Array.isArray(s.links)) s.links = [];
    var dirty = function () { markDirty("site"); };
    main.appendChild(topBar("Project links", { after: h("button", { type: "button", class: "btn", onclick: function () { preview("links"); } }, icon("eye"), "Preview") }));
    var auto = S.data.projects.filter(function (p) { return p.link && p.status !== "draft"; });
    main.appendChild(h("div", { class: "page page-narrow" },
      h("p", { class: "muted", style: { margin: "0 0 14px" }, text: "Live websites, apps and prototypes you worked on. They show on the Project Links page of your site." +
        (auto.length ? " Projects with a Live link (" + auto.map(function (p) { return p.title; }).join(", ") + ") are added there automatically." : " Any project with a Live link in its settings is also added there automatically.") }),
      listSection("Links", s.links, Object.assign(function (l, ch) {
        return h("div", { class: "stack" },
          h("div", { class: "row" }, bindField(l, "title", "Name", { placeholder: "Mamaearth website" }, ch), bindField(l, "domain", "Domain", { placeholder: "D2C" }, ch)),
          bindField(l, "url", "URL", { type: "url", placeholder: "https://" }, ch),
          bindField(l, "note", "Short note", { multiline: true, rows: 2, placeholder: "What you designed for it" }, ch),
          imageField(l, "image", "Thumbnail (optional)", "A screenshot of the site. Without one, a soft colour tile with the name is used.", ch));
      }, { title: function (l) { return l.title; } }), function () { return { title: "", url: "", domain: "", note: "", image: "" }; }, dirty, true)));
  }

  /* ================= Settings ================= */
  function viewSettings(main) {
    main.appendChild(topBar("Settings"));
    var info = S.mode === "github"
      ? [h("p", null, "Connected to ", h("b", { text: S.gh.owner + "/" + S.gh.repo }), " on branch ", h("b", { text: S.gh.branch }), "."),
         h("p", { class: "muted", text: "Each save creates one commit. GitHub Pages rebuilds your site within a minute or two." }),
         h("p", null, "Live site: ", h("a", { href: siteURL(), target: "_blank", rel: "noopener", text: siteURL() }))]
      : [h("p", null, "Editing the local folder ", h("b", { text: S.dir && S.dir.name }), "."),
         h("p", { class: "muted", text: "Saves are written into that folder. Publish them by committing and pushing with GitHub Desktop." })];
    main.appendChild(h("div", { class: "page page-narrow" },
      h("div", { class: "card stack" }, h("h2", { text: "Connection" }), info,
        h("div", { class: "file-row" },
          h("button", { type: "button", class: "btn", onclick: function () {
            var go2 = function () { S.mode = null; S.dir = null; S.data = {}; S.dirty = {}; S.pending = {}; location.hash = ""; renderLogin(); };
            if (isDirty()) confirmBox("Sign out with unsaved changes?", "Anything you haven't saved will be lost.", "Sign out", true).then(function (ok) { if (ok) go2(); });
            else go2();
          } }, icon("logout"), "Sign out"),
          S.mode === "github" ? h("button", { type: "button", class: "btn btn-danger", onclick: function () {
            store("ck-admin-gh", { owner: S.gh.owner, repo: S.gh.repo, branch: S.gh.branch });
            toast("The token was removed from this computer. You'll be asked for it next time.");
          } }, "Forget token on this computer") : null)),
      h("div", { class: "card stack", style: { "margin-top": "16px" } }, h("h2", { text: "Tips" }),
        h("ul", { class: "steps", style: { margin: 0 } },
          h("li", { text: "Save often with Ctrl/Cmd + S. Nothing reaches your site until you save." }),
          h("li", { text: "Images are resized for the web automatically (covers to 1440 × 1170, content images to 2400 px wide)." }),
          h("li", { text: "Set a project to Draft to keep working on it without it showing on your site." }),
          h("li", { text: "Use Preview to see unsaved changes exactly as visitors will." })))));
  }

  /* ================= Boot ================= */
  renderLogin();
})();
