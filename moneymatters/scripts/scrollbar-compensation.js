// DESIGN_SPEC.md §48: replaces `html { scrollbar-gutter: stable both-edges; }`.
// That approach reserved a real gutter strip on the left edge that sat
// outside body's own box, so it could only ever paint a flat color (never
// body's actual background photos/gradients) — a visible seam against any
// non-flat background. This measures the real scrollbar width directly
// (not innerWidth - documentElement.clientWidth, which reads 0 on any page
// short enough not to currently need a scrollbar, which would make the
// compensation flicker on/off between pages — exactly the instability
// `scrollbar-gutter: stable` existed to prevent) and exposes it as a CSS
// variable that site-base.css applies as real body padding, so both edges
// render as part of body's own background.
//
// Must run synchronously, before body's first paint, or the padding would
// visibly snap in after an unpadded flash — hence: no defer/async, and
// placed as early as possible in <head> on every page.
(function () {
  var probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:100px;height:100px;overflow:scroll;';
  document.documentElement.appendChild(probe);
  var scrollbarWidth = probe.offsetWidth - probe.clientWidth;
  document.documentElement.removeChild(probe);
  if (scrollbarWidth > 0) {
    document.documentElement.style.setProperty('--mm-scrollbar-compensation', scrollbarWidth + 'px');
  }
})();
