/* Resume export — builds an ATS-friendly PDF (pdfmake) and Word file (docx) from data/resume.json.
   Libraries are loaded only when someone clicks a download button. */
(function () {
  "use strict";

  var NAVY = "#1B2A4A";
  var GREY = "#4A5266";
  var loaded = {};

  function base() {
    var s = document.querySelector('script[src*="resume-export.js"]');
    return s ? s.getAttribute("src").replace(/assets\/js\/resume-export\.js.*$/, "") : "";
  }
  function loadScript(src) {
    if (loaded[src]) return loaded[src];
    loaded[src] = new Promise(function (res, rej) {
      var el = document.createElement("script");
      el.src = src; el.onload = res;
      el.onerror = function () { delete loaded[src]; rej(new Error("Could not load " + src)); };
      document.head.appendChild(el);
    });
    return loaded[src];
  }
  function clean(s) { return String(s == null ? "" : s).trim(); }
  function paras(s) { return clean(s).split(/\n{2,}/).map(clean).filter(Boolean); }
  function dates(x) { return [clean(x.start), clean(x.end)].filter(Boolean).join(" – "); }
  function contactLine(r) {
    return [r.location, r.email, r.phone, r.website, r.linkedin && r.linkedin.replace(/^https?:\/\/(www\.)?/, "")]
      .map(clean).filter(Boolean).join("  |  ");
  }
  function fileName(r, ext) {
    return (clean(r.fileName) || (clean(r.name) || "Resume").replace(/\s+/g, "_") + "_Resume") + "." + ext;
  }
  function save(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }

  /* ---------------- PDF ---------------- */
  function pdfDoc(r) {
    var c = [];
    var h = function (t) {
      c.push({ text: t.toUpperCase(), style: "h", margin: [0, 12, 0, 2] });
      c.push({ canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.6, lineColor: NAVY }], margin: [0, 0, 0, 6] });
    };
    c.push({ text: clean(r.name), style: "name" });
    if (clean(r.title)) c.push({ text: clean(r.title), style: "title" });
    if (contactLine(r)) c.push({ text: contactLine(r), style: "contact" });
    var sub = [clean(r.status), clean(r.credential)].filter(Boolean).join("  |  ");
    if (sub) c.push({ text: sub, style: "contact", margin: [0, 1, 0, 0] });

    if (paras(r.summary).length) { h("Profile summary"); paras(r.summary).forEach(function (p) { c.push({ text: p, margin: [0, 0, 0, 4] }); }); }

    if ((r.skillGroups || []).length) {
      h("Core expertise");
      c.push({ ul: r.skillGroups.filter(function (g) { return clean(g.name) || clean(g.items); }).map(function (g) {
        return { text: [{ text: clean(g.name) + " – ", bold: true, color: NAVY }, clean(g.items)], margin: [0, 0, 0, 3] };
      }) });
    }

    if ((r.experience || []).length) {
      h("Professional experience");
      r.experience.forEach(function (x, i) {
        c.push({ columns: [
          { text: clean(x.role), bold: true, color: NAVY, fontSize: 10.5 },
          { text: dates(x), alignment: "right", width: "auto", color: GREY }
        ], margin: [0, i ? 8 : 0, 0, 0] });
        c.push({ columns: [
          { text: clean(x.company), italics: true },
          { text: clean(x.location), alignment: "right", width: "auto", color: GREY }
        ], margin: [0, 1, 0, 3] });
        var b = (x.bullets || []).map(clean).filter(Boolean);
        if (b.length) c.push({ ul: b.map(function (t) { return { text: t, margin: [0, 0, 0, 2] }; }) });
      });
    }

    if ((r.education || []).length) {
      h("Education");
      c.push({ ul: r.education.map(function (e) {
        return [clean(e.degree), clean(e.school)].filter(Boolean).join(" — ") + (clean(e.year) ? " (" + clean(e.year) + ")" : "");
      }) });
    }
    if ((r.certifications || []).length) {
      h("Certifications");
      c.push({ ul: r.certifications.map(function (x) {
        var t = [clean(x.issuer), clean(x.name)].filter(Boolean).join(": ") + (clean(x.detail) ? " — " + clean(x.detail) : "");
        return clean(x.url) ? { text: t, link: clean(x.url), color: NAVY } : t;
      }) });
    }
    var pr = (r.projects || []).map(clean).filter(Boolean);
    if (pr.length) { h("Key projects & brands"); c.push({ ul: pr }); }
    var lg = (r.languages || []).filter(function (l) { return clean(l.name); });
    if (lg.length) { h("Languages"); c.push({ text: lg.map(function (l) { return clean(l.name) + (clean(l.level) ? " (" + clean(l.level) + ")" : ""); }).join("  •  ") }); }

    return {
      pageSize: "A4", pageMargins: [40, 36, 40, 40],
      info: { title: clean(r.name) + " – Resume", author: clean(r.name) },
      content: c,
      defaultStyle: { font: "Roboto", fontSize: 9.5, lineHeight: 1.22, color: "#1F2430" },
      styles: {
        name: { fontSize: 20, bold: true, color: NAVY, alignment: "center" },
        title: { fontSize: 10.5, color: GREY, alignment: "center", margin: [0, 2, 0, 3] },
        contact: { fontSize: 8.8, color: GREY, alignment: "center" },
        h: { fontSize: 10, bold: true, color: NAVY, characterSpacing: 0.6 }
      }
    };
  }
  function downloadPdf(r) {
    var b = base();
    return loadScript(b + "assets/vendor/pdfmake.min.js")
      .then(function () { return loadScript(b + "assets/vendor/vfs_fonts.js"); })
      .then(function () {
        return new Promise(function (res) {
          window.pdfMake.createPdf(pdfDoc(r)).getBlob(function (blob) { save(blob, fileName(r, "pdf")); res(); });
        });
      });
  }

  /* ---------------- Word ---------------- */
  function downloadDocx(r) {
    return loadScript(base() + "assets/vendor/docx.umd.js").then(function () {
      var d = window.docx;
      var P = d.Paragraph, T = d.TextRun;
      var RIGHT = 10466; // twips: A4 width minus 0.6in margins
      var font = "Calibri";
      var run = function (text, o) { o = o || {}; o.text = text; o.font = font; o.size = o.size || 20; return new T(o); };
      var kids = [];
      var heading = function (t) {
        kids.push(new P({
          spacing: { before: 200, after: 80 },
          border: { bottom: { color: "1B2A4A", space: 2, style: d.BorderStyle.SINGLE, size: 6 } },
          children: [run(t.toUpperCase(), { bold: true, color: "1B2A4A", size: 21 })]
        }));
      };
      var bullet = function (children) { kids.push(new P({ bullet: { level: 0 }, spacing: { after: 40 }, children: children })); };
      var twoCol = function (left, right, lo, ro) {
        kids.push(new P({
          tabStops: [{ type: d.TabStopType.RIGHT, position: RIGHT }],
          spacing: { after: 20 },
          children: [run(left, lo), run("\t" + right, ro)]
        }));
      };

      kids.push(new P({ alignment: d.AlignmentType.CENTER, children: [run(clean(r.name), { bold: true, size: 40, color: "1B2A4A" })] }));
      if (clean(r.title)) kids.push(new P({ alignment: d.AlignmentType.CENTER, spacing: { after: 40 }, children: [run(clean(r.title), { size: 21, color: "4A5266" })] }));
      if (contactLine(r)) kids.push(new P({ alignment: d.AlignmentType.CENTER, children: [run(contactLine(r), { size: 18, color: "4A5266" })] }));
      var sub = [clean(r.status), clean(r.credential)].filter(Boolean).join("  |  ");
      if (sub) kids.push(new P({ alignment: d.AlignmentType.CENTER, children: [run(sub, { size: 18, color: "4A5266" })] }));

      if (paras(r.summary).length) { heading("Profile summary"); paras(r.summary).forEach(function (p) { kids.push(new P({ spacing: { after: 80 }, children: [run(p)] })); }); }
      if ((r.skillGroups || []).length) {
        heading("Core expertise");
        r.skillGroups.forEach(function (g) { if (clean(g.name) || clean(g.items)) bullet([run(clean(g.name) + " – ", { bold: true, color: "1B2A4A" }), run(clean(g.items))]); });
      }
      if ((r.experience || []).length) {
        heading("Professional experience");
        r.experience.forEach(function (x, i) {
          if (i) kids.push(new P({ spacing: { after: 40 }, children: [] }));
          twoCol(clean(x.role), dates(x), { bold: true, color: "1B2A4A", size: 21 }, { color: "4A5266" });
          twoCol(clean(x.company), clean(x.location), { italics: true }, { color: "4A5266" });
          (x.bullets || []).map(clean).filter(Boolean).forEach(function (b) { bullet([run(b)]); });
        });
      }
      if ((r.education || []).length) {
        heading("Education");
        r.education.forEach(function (e) {
          bullet([run([clean(e.degree), clean(e.school)].filter(Boolean).join(" — ") + (clean(e.year) ? " (" + clean(e.year) + ")" : ""))]);
        });
      }
      if ((r.certifications || []).length) {
        heading("Certifications");
        r.certifications.forEach(function (x) {
          bullet([run([clean(x.issuer), clean(x.name)].filter(Boolean).join(": ") + (clean(x.detail) ? " — " + clean(x.detail) : ""))]);
        });
      }
      var pr = (r.projects || []).map(clean).filter(Boolean);
      if (pr.length) { heading("Key projects & brands"); pr.forEach(function (p) { bullet([run(p)]); }); }
      var lg = (r.languages || []).filter(function (l) { return clean(l.name); });
      if (lg.length) { heading("Languages"); kids.push(new P({ children: [run(lg.map(function (l) { return clean(l.name) + (clean(l.level) ? " (" + clean(l.level) + ")" : ""); }).join("  •  "))] })); }

      var doc = new d.Document({
        creator: clean(r.name), title: clean(r.name) + " – Resume",
        styles: { default: { document: { run: { font: font, size: 20 } } } },
        sections: [{
          properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
          children: kids
        }]
      });
      return d.Packer.toBlob(doc).then(function (blob) { save(blob, fileName(r, "docx")); });
    });
  }

  window.ResumeExport = { pdf: downloadPdf, docx: downloadDocx, pdfDefinition: pdfDoc, save: save };
})();
