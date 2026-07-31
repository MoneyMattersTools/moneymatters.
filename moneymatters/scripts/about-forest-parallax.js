// DESIGN_SPEC.md §37.8: purely visual addition to the §36 forest imagery —
// deliberately a separate file from about-scroll-story.js so the one-time
// reveal mechanic it drives (IntersectionObserver, unobserve-on-first-reveal)
// is never touched by this. Drifts each .story-forest img on scroll for a
// subtle "living forest" feel; the reveal's own opacity/scale transition
// stays on the .story-forest container itself, a different element, so the
// two never fight over the same transform.
(function () {
  var story = document.getElementById('scroll-story');
  var images = document.querySelectorAll('.story-forest img');
  if (!story || !images.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // .story-forest is position:sticky, so the images' own getBoundingClientRect
  // barely changes for as long as they're pinned on screen — driving the
  // drift off that would look static for exactly the part of the scroll
  // where it's visible. Instead, use scroll progress through the whole
  // #scroll-story block (how far the sticky forest has been "stuck" for).
  var DRIFT_RANGE_PX = 70;
  var ticking = false;

  function update() {
    ticking = false;
    var rect = story.getBoundingClientRect();
    var scrollable = rect.height - window.innerHeight;
    var progress = scrollable > 0 ? (-rect.top) / scrollable : 0;
    progress = Math.min(1, Math.max(0, progress));
    var drift = (progress - 0.5) * DRIFT_RANGE_PX;

    images.forEach(function (img) {
      // The right-side image is mirrored via CSS (transform: scaleX(-1));
      // setting img.style.transform here would otherwise silently replace
      // that rule instead of adding to it, since inline style always wins.
      var mirror = img.closest('.story-forest--right') ? 'scaleX(-1) ' : '';
      img.style.transform = mirror + 'translateY(' + drift.toFixed(1) + 'px) scale(1.12)';
    });
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
})();
