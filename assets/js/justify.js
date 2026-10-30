/* Justified photo grid (the Behance-style "photo grid").
   Every image keeps its own shape; each row is scaled so its images share one height
   and the row fills the full width exactly. Row breaks are chosen with a small
   dynamic-programming search so every row stays close to the target height.

   Markup:  <div class="jgrid" data-size="m" data-gap="6">
              <figure class="jg-item" data-w="1200" data-h="800"><img …></figure> …
            </div>
   Call Justify.watch(el) once the grid is in the page.                                   */
(function () {
  "use strict";

  var SIZE = { s: 0.2, m: 0.3, l: 0.45 }; // target row height as a share of the grid width

  function ratioOf(item) {
    var w = parseFloat(item.getAttribute("data-w")), h = parseFloat(item.getAttribute("data-h"));
    if (w > 0 && h > 0) return w / h;
    var img = item.querySelector("img");
    if (img && img.naturalWidth && img.naturalHeight) return img.naturalWidth / img.naturalHeight;
    return 0; // not known yet
  }

  function layout(grid) {
    var items = Array.prototype.filter.call(grid.children, function (c) { return c.classList.contains("jg-item"); });
    var W = grid.clientWidth;
    if (!items.length || !W) return;
    var gap = parseFloat(grid.getAttribute("data-gap"));
    if (isNaN(gap)) gap = 6;
    grid.style.gap = gap + "px";
    var size = SIZE[grid.getAttribute("data-size")] || SIZE.m;
    var target = Math.max(120, W * size);
    if (W < 560) target = Math.max(110, W * (size + 0.12)); // phones: slightly taller rows

    var ar = items.map(function (it) { return ratioOf(it) || 1.5; });
    var n = ar.length;

    // rowHeight(i, j): height that makes images i..j-1 exactly fill W
    function rowHeight(i, j) {
      var sum = 0;
      for (var k = i; k < j; k++) sum += ar[k];
      return (W - gap * (j - i - 1)) / sum;
    }
    // Cost of a row: how far its height is from the target (squared, scaled).
    // The last row may stay at target height instead of being stretched.
    // Measured per image on a log scale, so very wide banners (728×90 etc.)
    // prefer their own rows instead of being squeezed into one thin strip.
    function cost(i, j) {
      var h = rowHeight(i, j);
      if (j === n && h > target) return 0;
      var d = Math.log(h / target);
      return d * d * (j - i);
    }
    var best = [0], from = [0];
    for (var j = 1; j <= n; j++) {
      best[j] = Infinity;
      for (var i = Math.max(0, j - 12); i < j; i++) {
        var c = best[i] + cost(i, j);
        if (c < best[j]) { best[j] = c; from[j] = i; }
      }
    }
    var rows = [], e = n;
    while (e > 0) { rows.unshift([from[e], e]); e = from[e]; }

    rows.forEach(function (r) {
      var i = r[0], j = r[1], last = j === n;
      var h = rowHeight(i, j), fill = true;
      if (last && h > target) { h = target; fill = false; }
      var used = 0;
      for (var k = i; k < j; k++) {
        var w = Math.floor(ar[k] * h);
        if (fill && k === j - 1) w = Math.floor(W - gap * (j - i - 1) - used); // absorb rounding
        used += w;
        items[k].style.width = w + "px";
        items[k].style.height = Math.round(h) + "px";
      }
    });
    grid.classList.add("is-laid-out");
  }

  function watch(grid) {
    if (!grid) return;
    layout(grid);
    grid.querySelectorAll("img").forEach(function (img) {
      if (!img.complete) img.addEventListener("load", function () { layout(grid); }, { once: true });
    });
    if (!grid.__jgObserved && window.ResizeObserver) {
      grid.__jgObserved = true;
      var lastW = grid.clientWidth;
      new ResizeObserver(function () {
        if (grid.clientWidth !== lastW) { lastW = grid.clientWidth; layout(grid); }
      }).observe(grid);
    }
  }

  window.Justify = { layout: layout, watch: watch };
})();
