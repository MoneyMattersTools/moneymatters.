// DESIGN_SPEC.md §48. Originally replaced `html { scrollbar-gutter: stable
// both-edges; }`, which reserved a real gutter strip outside body's own
// box that could only ever paint a flat color, never body's actual
// background — a visible seam. §48 round 2 found that compensating via
// padding on body was worse: it inset every full-bleed section sitewide
// (header, .value-strip, hero photos, --mm-bg-deep sections) by the same
// amount, creating a more pervasive version of the same seam. Body is now
// fully unpadded again; this script only feeds one narrow, cosmetic
// correction (site-base.css's .newsletter-cta__inner transform nudge),
// not a sitewide layout property — so there's no seam/paint-order risk
// left, and no need to measure before first paint.
//
// Measures the REAL live discrepancy between the window and the document,
// not a synthetic probe: an earlier version used a hidden overflow:scroll
// div to estimate the browser's generic scrollbar rendering width, but
// that measures whether a scrollbar CAN exist, not whether THIS page
// currently has one taking real layout space — confirmed live to read a
// nonzero value even on setups with zero actual reserved space (overlay
// scrollbars, some headless/automated rendering contexts), which made the
// "corrected" element overshoot in the wrong direction instead of landing
// centered. innerWidth - clientWidth reflects the real, current page.
// Runs after full load (not immediately) since running this in <head>
// before body is parsed would always read 0 — the browser can't know yet
// whether the page will need to scroll.
(function () {
  function measure() {
    var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.documentElement.style.setProperty('--mm-scrollbar-compensation', scrollbarWidth + 'px');
    }
  }
  if (document.readyState === 'complete') {
    measure();
  } else {
    window.addEventListener('load', measure);
  }
})();
