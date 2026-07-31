// DESIGN_SPEC.md §38.1: multi-layer parallax for the About Us scroll
// story, referencing the Firewatch game website's model (background/
// midground/foreground each drifting at a different rate on scroll).
// Deliberately a separate file from about-scroll-story.js so the beat
// text's one-time-reveal mechanic (IntersectionObserver, unobserve-on-
// first-reveal) is never touched by this — this file only ever adds
// inline transforms to the parallax layers and one entrance class to
// .story-parallax, nothing it does can affect .story-beat/.story-word.
(function () {
  var wrap = document.querySelector('.story-parallax-wrap');
  var parallax = document.querySelector('.story-parallax');
  var layers = document.querySelectorAll('.story-layer');
  if (!wrap || !parallax || !layers.length) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Entrance: fade the whole scene in once, the first time it scrolls
  // into view — independent IntersectionObserver from about-scroll-
  // story.js's beat-text one, on purpose (different element, different
  // concern, no shared state to keep in sync).
  if ('IntersectionObserver' in window) {
    var entrance = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          parallax.classList.add('is-active');
          entrance.unobserve(entry.target);
        });
      },
      { threshold: 0.05 }
    );
    entrance.observe(wrap);
  } else {
    parallax.classList.add('is-active');
  }

  if (reduceMotion) return;

  // .story-forest was position:sticky, so a layer's own
  // getBoundingClientRect() barely changes while it's pinned on screen —
  // driving the drift off that read as static for exactly the part of
  // the scroll where it's visible (this exact bug was hit and fixed in
  // §37.8). Scroll progress through .story-parallax-wrap (sized to
  // beats 1-3's combined height) instead, same fix as before.
  //
  // Different rate per depth — the actual parallax illusion: distant
  // things barely move, close things move a lot, same physics as real
  // depth perception and the same technique Firewatch's site (and
  // classic side-scrolling game backgrounds generally) use.
  var LAYER_RATES = { bg: 25, mid: 55, fore: 95 };
  var ticking = false;

  function rateFor(layer) {
    if (layer.classList.contains('story-layer--bg')) return LAYER_RATES.bg;
    if (layer.classList.contains('story-layer--mid')) return LAYER_RATES.mid;
    return LAYER_RATES.fore;
  }

  function update() {
    ticking = false;
    var rect = wrap.getBoundingClientRect();
    var scrollable = rect.height - window.innerHeight;
    var progress = scrollable > 0 ? (-rect.top) / scrollable : 0;
    progress = Math.min(1, Math.max(0, progress));
    var centered = progress - 0.5;

    layers.forEach(function (layer) {
      var drift = centered * rateFor(layer);
      layer.style.transform = 'translateY(' + drift.toFixed(1) + 'px)';
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
