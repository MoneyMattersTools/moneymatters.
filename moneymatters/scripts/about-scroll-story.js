// About Us narrative beats (DESIGN_SPEC.md §31, forest visual §34.1/§36).
//
// §36 root-cause redirection: the previous GSAP ScrollTrigger pin-and-swap
// mechanic failed 3 rounds running (missing first beat, wrong vertical
// centering, disappear/reappear too fast, content gone when scrolling back
// up) and has been replaced entirely — not patched again. This file no
// longer uses GSAP at all:
//   - Beats live in normal document flow (see about-us-styling.css) —
//     no pinning, no pin-spacers, no scroll-distance math.
//   - Each beat's heading + lead paragraph reveal word-by-word ONCE, the
//     first time it scrolls into view, via a plain IntersectionObserver
//     (the same class of API the sitewide .fade-up reveal already uses
//     everywhere else on this site with zero reported bugs) + a CSS
//     transition with a per-word delay baked in as an inline style.
//   - The observer unobserve()s each beat immediately after its first
//     reveal — there is no code path that can ever remove .is-revealed
//     or re-trigger it, in either scroll direction. Scrolling back up
//     shows already-revealed content exactly as it is: static, fully
//     visible, real page content.
//   - Applies to beats 1-4 (Problem/Insight/Solution/Proof). Beat 4's own
//     folded-in sub-sections (3-step path, money-flow, vetted bento, FAQ)
//     keep their separate, pre-existing .reveal-stagger treatment,
//     unrelated to this file. Beat 5 ("The Invitation") is untouched —
//     already fully static per §34 item 2 — and never referenced here.
(function () {
  var story = document.getElementById('scroll-story');
  if (!story) return;

  // Wraps each word of an element's real text in a <span> for animation
  // targeting. The text itself never leaves the DOM — this only happens
  // after the browser (and any non-JS crawler) has already seen the full
  // real sentence in the initial HTML, and the wrapped words still spell
  // out the exact same content, just chopped into inline-block spans.
  function splitWords(el) {
    var tokens = el.textContent.split(/(\s+)/);
    el.innerHTML = '';
    var words = [];
    tokens.forEach(function (t) {
      if (t === '') return;
      if (/^\s+$/.test(t)) {
        el.appendChild(document.createTextNode(t));
        return;
      }
      var span = document.createElement('span');
      span.className = 'story-word';
      span.textContent = t;
      el.appendChild(span);
      words.push(span);
    });
    return words;
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    // No word-splitting, no observer — beats keep their real, plain text
    // and fall back to the sitewide .fade-up reveal already on each
    // <section>. Forest panels show at full opacity via the reduced-
    // motion override in about-us-styling.css.
    return;
  }

  // Beats 1-4 only — beat 5 stays exactly as-is (§34 item 2), never
  // touched by this file.
  var beats = Array.prototype.filter.call(story.querySelectorAll('.story-beat'), function (beat) {
    return beat.dataset.beat !== '5';
  });

  var WORD_STAGGER_MS = 35;
  beats.forEach(function (beat) {
    var heading = beat.querySelector('h1, h2');
    var lead = beat.querySelector(':scope > p');
    var words = [];
    if (heading) words = words.concat(splitWords(heading));
    if (lead) words = words.concat(splitWords(lead));
    words.forEach(function (word, i) {
      word.style.transitionDelay = (i * WORD_STAGGER_MS) + 'ms';
    });
  });

  if (!('IntersectionObserver' in window)) {
    // No observer support: reveal everything immediately rather than
    // leaving beats permanently blurred/invisible.
    beats.forEach(function (beat) { beat.classList.add('is-revealed'); });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        // One-time: stop watching this beat entirely, so nothing in this
        // file can ever act on it again — the only way .is-revealed could
        // be removed is if something else in the codebase did it, and
        // nothing does.
        observer.unobserve(entry.target);
      });
    },
    // Fires once a beat crosses into the vertical center band of the
    // viewport (not merely touching the top/bottom edge) — since each
    // beat's text sits centered within a full-viewport-tall section, this
    // times the reveal to roughly when the text itself is coming into
    // clear view, not the moment the section's top edge first appears.
    { threshold: 0, rootMargin: '-35% 0px -35% 0px' }
  );

  beats.forEach(function (beat) { observer.observe(beat); });
})();
