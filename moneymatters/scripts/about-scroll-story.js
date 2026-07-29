// About Us cinematic scroll story (DESIGN_SPEC.md §31, refined §32.4).
// Two independent GSAP ScrollTrigger systems share this page:
//   1. A whole-story scrub (unchanged from §31) driving the signature
//      dial as a continuous function of scroll progress through
//      #scroll-story — never a per-beat snap.
//   2. Per-beat pinning + word-level reveal (new, §32.4): each short beat
//      (1/2/3/5) is pinned for a fixed scroll distance so its content is
//      gated to actual scroll — not all visible/sitting there at once —
//      and its headline + lead paragraph reveal word-by-word with a
//      blur-to-focus tween, scrubbed to the first portion of that pin's
//      distance (the remainder is hold/reading time before the next beat
//      takes over). Beat 4 ("The Proof") is much taller than one
//      viewport — pinning it as a single unit would trap its lower
//      sub-sections off-screen for the whole pin, since GSAP's pin holds
//      the *entire* trigger element fixed rather than scrolling within
//      it. It's intentionally left unpinned, keeping its own established
//      .reveal-stagger pacing for the folded-in sub-sections, with just
//      the word-reveal treatment on its heading for consistency.
(function () {
  var story = document.getElementById('scroll-story');
  var visual = document.getElementById('story-visual');
  if (!story || !visual) return;

  var ticksGroup = document.getElementById('story-sig-ticks');
  var ringFill = document.getElementById('story-sig-ring-fill');
  var linePath = document.getElementById('story-sig-line-path');
  var goldAccent = document.getElementById('story-sig-gold-accent');
  var dots = visual.querySelectorAll('.story-sig-dot');

  for (var i = 0; i < 24; i++) {
    var angle = (i / 24) * 360;
    var tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tick.setAttribute('class', 'story-sig-tick');
    tick.setAttribute('transform', 'rotate(' + angle + ' 300 300)');
    tick.setAttribute('x1', '300');
    tick.setAttribute('y1', '42');
    tick.setAttribute('x2', '300');
    tick.setAttribute('y2', i % 3 === 0 ? '62' : '54');
    ticksGroup.appendChild(tick);
  }

  var RING_R = 230;
  var RING_CIRC = 2 * Math.PI * RING_R;
  ringFill.style.strokeDasharray = RING_CIRC.toFixed(1);

  var lineLength = linePath.getTotalLength();
  linePath.style.strokeDasharray = lineLength.toFixed(1);

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  // progress: 0 (top of the story, Beat 1 — "faint, unfilled, static") to
  // 1 (bottom, Beat 5 — "glowing/settled"). Every visual property below is
  // its own continuous function of that single value.
  function render(progress) {
    ringFill.style.strokeDashoffset = (RING_CIRC * (1 - progress)).toFixed(1);
    ringFill.style.opacity = (0.35 + progress * 0.65).toFixed(2);

    var lineProgress = clamp01((progress - 0.2) / 0.65);
    linePath.style.strokeDashoffset = (lineLength * (1 - lineProgress)).toFixed(1);
    dots.forEach(function (dot, idx) {
      var threshold = 0.3 + idx * 0.18;
      dot.style.opacity = progress > threshold ? '1' : '0';
    });

    var goldProgress = clamp01((progress - 0.55) / 0.25);
    goldAccent.style.opacity = goldProgress.toFixed(2);

    var glowProgress = clamp01((progress - 0.8) / 0.2);
    visual.style.filter = glowProgress > 0
      ? 'drop-shadow(0 0 ' + (glowProgress * 22).toFixed(0) + 'px rgba(52, 211, 153, 0.55))'
      : 'none';

    ticksGroup.setAttribute('transform', 'rotate(' + (progress * 50).toFixed(1) + ' 300 300)');
  }

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
    // Calm, non-animated resolved-ish dial frame; no pinning, no word
    // splitting — beats keep their real text and fall back to the
    // sitewide .fade-up reveal already on each <section>.
    render(0.5);
    return;
  }

  render(0);

  function init() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.create({
      trigger: story,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.4,
      onUpdate: function (self) { render(self.progress); },
    });

    gsap.utils.toArray('.story-beat').forEach(function (beat) {
      var heading = beat.querySelector('h1, h2');
      var lead = beat.querySelector(':scope > p');
      var words = [];
      if (heading) words = words.concat(splitWords(heading));
      if (lead) words = words.concat(splitWords(lead));
      if (!words.length) return;

      var wordTween = { opacity: 1, filter: 'blur(0px)', y: 0, stagger: 0.035, duration: 1, ease: 'power2.out' };
      var wordFrom = { opacity: 0, filter: 'blur(8px)', y: 10 };

      if (beat.classList.contains('story-beat--wide')) {
        // Beat 4: not pinned (see file header) — just reveal its heading
        // as it naturally scrolls into view.
        gsap.fromTo(words, wordFrom, Object.assign({}, wordTween, {
          scrollTrigger: { trigger: beat, start: 'top 75%', end: 'top 35%', scrub: 0.3 },
        }));
        return;
      }

      ScrollTrigger.matchMedia({
        // Full scroll-jacked treatment: pin the beat so it's the only
        // thing gaining scroll-worthy content, gated to a real scroll
        // distance rather than flowing past in a fraction of a scroll.
        '(min-width: 900px)': function () {
          var tl = gsap.timeline({
            scrollTrigger: {
              trigger: beat,
              start: 'top top',
              end: '+=' + Math.round(window.innerHeight * 1.15),
              pin: true,
              scrub: 0.3,
            },
          });
          // Words finish revealing well before the pin releases, leaving
          // real hold/reading time rather than the reveal eating the
          // whole pinned scroll distance.
          tl.fromTo(words, wordFrom, wordTween, 0);
          tl.to({}, { duration: 1.4 });
        },
        // Mobile: pinning a full section is unreliable against mobile
        // browser chrome resize behavior, and the layout is already a
        // single stacked column there — scrub the same word reveal
        // against natural scroll-into-view instead, no pin.
        '(max-width: 899px)': function () {
          gsap.fromTo(words, wordFrom, Object.assign({}, wordTween, {
            scrollTrigger: { trigger: beat, start: 'top 75%', end: 'top 40%', scrub: 0.3 },
          }));
        },
      });
    });

    ScrollTrigger.refresh();
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
