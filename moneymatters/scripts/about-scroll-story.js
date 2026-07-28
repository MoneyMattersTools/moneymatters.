// About Us cinematic scroll story (DESIGN_SPEC.md §31).
// The signature dial is a continuous function of scroll progress through
// #scroll-story, not five separate "state per beat" snaps — beat copy
// (real HTML, always in the DOM) supplies the narrative; this only drives
// the decorative, aria-hidden visual alongside it via GSAP ScrollTrigger.
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

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    // Calm, non-animated resolved-ish frame — beats themselves fall back
    // to the sitewide .fade-up reveal already on each <section>.
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
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
