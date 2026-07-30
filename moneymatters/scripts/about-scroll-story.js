// About Us cinematic scroll story (DESIGN_SPEC.md §31, refined §32.4,
// dial replaced with a path/journey visual §34.1).
// Two independent GSAP ScrollTrigger systems share this page:
//   1. A whole-story scrub (unchanged from §31) driving the path visual
//      as a continuous function of scroll progress through #scroll-story
//      — never a per-beat snap. The traveler dot walks the path's exact
//      curve via SVGPathElement.getPointAtLength(), and the path itself
//      draws in via stroke-dashoffset, same technique the old dial's
//      ring used.
//   2. Per-beat pinning + word-level reveal (§32.4): each short beat
//      (1/2/3) is pinned for a fixed scroll distance so its content is
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
//      the word-reveal treatment on its heading for consistency. Beat 5
//      ("The Invitation", §34.2) is excluded from this system entirely —
//      it renders fully statically via the plain sitewide .fade-up
//      reveal, no pin, no word scrub — since gating the final CTA behind
//      a scroll-lock adds friction right at the conversion moment.
(function () {
  var story = document.getElementById('scroll-story');
  var visual = document.getElementById('story-visual');
  var pinBackdrop = document.getElementById('story-pin-backdrop');
  if (!story || !visual) return;

  var pathFill = document.getElementById('story-path-fill');
  var traveler = document.getElementById('story-traveler');
  var waypoints = [0, 1, 2, 3, 4].map(function (i) {
    return document.getElementById('story-waypoint-' + i);
  });
  // Roughly evenly spaced along the path, one per beat, slightly inset
  // from the very ends so they sit clearly on the visible curve rather
  // than right at its cropped edges.
  var WAYPOINT_FRACTIONS = [0.02, 0.26, 0.50, 0.74, 0.98];

  var pathLength = pathFill.getTotalLength();
  pathFill.style.strokeDasharray = pathLength.toFixed(1);

  waypoints.forEach(function (circle, i) {
    var pt = pathFill.getPointAtLength(WAYPOINT_FRACTIONS[i] * pathLength);
    circle.setAttribute('cx', pt.x.toFixed(1));
    circle.setAttribute('cy', pt.y.toFixed(1));
  });

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  // progress: 0 (top of the story, Beat 1 — journey just starting) to 1
  // (bottom, Beat 5 — arrived). Every visual property below is its own
  // continuous function of that single value.
  function render(progress) {
    pathFill.style.strokeDashoffset = (pathLength * (1 - progress)).toFixed(1);
    pathFill.style.opacity = (0.55 + progress * 0.45).toFixed(2);

    var travelerPt = pathFill.getPointAtLength(clamp01(progress) * pathLength);
    traveler.setAttribute('cx', travelerPt.x.toFixed(1));
    traveler.setAttribute('cy', travelerPt.y.toFixed(1));

    waypoints.forEach(function (circle, i) {
      circle.classList.toggle('is-reached', progress >= WAYPOINT_FRACTIONS[i] - 0.03);
    });
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
    // Calm, non-animated mid-journey frame; no pinning, no word
    // splitting — beats keep their real text and fall back to the
    // sitewide .fade-up reveal already on each <section>.
    render(0.5);
    return;
  }

  render(0);

  function init() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    // Counter rather than a plain toggle: onEnter/onLeave across adjacent
    // beats' pins can fire in either order on fast scroll or direction
    // reversal (onEnterBack/onLeaveBack), and a plain add/remove race
    // could leave the backdrop hidden while a beat is still pinned.
    var pinnedCount = 0;
    function pinEngaged() {
      pinnedCount++;
      if (pinBackdrop) pinBackdrop.classList.add('is-active');
    }
    function pinReleased() {
      pinnedCount = Math.max(0, pinnedCount - 1);
      if (pinBackdrop && pinnedCount === 0) pinBackdrop.classList.remove('is-active');
    }

    var wordTween = { opacity: 1, filter: 'blur(0px)', y: 0, stagger: 0.035, duration: 1, ease: 'power2.out' };
    var wordFrom = { opacity: 0, filter: 'blur(8px)', y: 10 };

    // §33.16 (still in force, per §34.1): the path shouldn't just react to
    // the whole-story scrub in the background — each beat's own pinned
    // timeline also pulses that beat's waypoint marker at the same
    // timeline position as its word reveal, so the identical scrubbed
    // value that blurs a beat's text into focus is the value animating
    // the path right at that beat's own point on it. Animates the
    // circle's r attribute directly rather than a transform scale, so it
    // doesn't need an SVG transform-origin workaround.
    var WAYPOINT_BASE_R = [7, 7, 7, 7, 9];
    var WAYPOINT_PULSE_R = [12, 12, 12, 12, 14];

    var lastBeatEnd = null;
    var wideBeats = [];
    var shortBeats = [];
    gsap.utils.toArray('.story-beat').forEach(function (beat) {
      // §34.2: the final Invitation beat now renders fully statically —
      // no pin, no word-by-word scrub, just the plain sitewide .fade-up
      // reveal every other non-story section already uses. Excluded from
      // this whole word-splitting/GSAP system entirely rather than just
      // left out of the pinned list — leaving its words wrapped in
      // .story-word spans (which start blurred/invisible) with nothing to
      // ever tween them to visible would leave the beat permanently
      // unreadable.
      if (beat.dataset.beat === '5') return;
      var heading = beat.querySelector('h1, h2');
      var lead = beat.querySelector(':scope > p');
      var words = [];
      if (heading) words = words.concat(splitWords(heading));
      if (lead) words = words.concat(splitWords(lead));
      if (!words.length) return;
      beat.__storyWords = words;
      (beat.classList.contains('story-beat--wide') ? wideBeats : shortBeats).push(beat);
    });

    // Beat 4: not pinned (see file header) — just reveal its heading (and
    // pulse its waypoint, index 3) as it naturally scrolls into view.
    wideBeats.forEach(function (beat) {
      var scrollTriggerConfig = { trigger: beat, start: 'top 75%', end: 'top 35%', scrub: 0.3 };
      gsap.fromTo(beat.__storyWords, wordFrom, Object.assign({}, wordTween, { scrollTrigger: scrollTriggerConfig }));
      var wp4 = waypoints[3];
      if (wp4) {
        gsap.fromTo(
          wp4,
          { attr: { r: WAYPOINT_BASE_R[3] } },
          { attr: { r: WAYPOINT_PULSE_R[3] }, scrollTrigger: scrollTriggerConfig }
        );
      }
    });

    ScrollTrigger.matchMedia({
      // Full scroll-jacked treatment: pin each short beat in turn so it's
      // the only thing gaining scroll-worthy content, gated to a real
      // scroll distance rather than flowing past in a fraction of a
      // scroll. Beats are pinned SEQUENTIALLY with an explicit refresh
      // after each one — 'top top' measures a beat's position in the
      // *current* layout, and without forcing a remeasure right after
      // each pin-spacer is inserted, every later beat's start position
      // was computed against the pre-pin (unspaced) layout, so their
      // ranges overlapped and multiple beats ended up pinned—and
      // stacked on top of each other—at once (confirmed live).
      '(min-width: 900px)': function () {
        shortBeats.forEach(function (beat, beatIndex) {
          var words = beat.__storyWords;
          var tl = gsap.timeline({
            scrollTrigger: {
              trigger: beat,
              start: 'top top',
              end: '+=' + Math.round(window.innerHeight * 1.15),
              pin: true,
              scrub: 0.3,
              // A pinned beat's own box can't reliably serve as the
              // occluder: GSAP sets inline width/max-width on it (higher
              // specificity than any class rule), and a sibling beat
              // revealed via .fade-up.is-visible gets its own
              // transform-based stacking context that paints in DOM
              // order regardless. #story-pin-backdrop is a plain fixed,
              // high-z-index element outside GSAP's pin sizing entirely;
              // is-pinned still marks the active beat (its own z-index +
              // vertical centering), and the shared backdrop tracks
              // whether *any* beat is currently pinned via a count, not
              // a plain toggle (adjacent beats' callbacks can fire in
              // either order on fast scroll).
              onEnter: function () { beat.classList.add('is-pinned'); pinEngaged(); },
              onEnterBack: function () { beat.classList.add('is-pinned'); pinEngaged(); },
              onLeave: function () { beat.classList.remove('is-pinned'); pinReleased(); },
              onLeaveBack: function () { beat.classList.remove('is-pinned'); pinReleased(); },
            },
          });
          // Words finish revealing well before the pin releases, leaving
          // real hold/reading time rather than the reveal eating the
          // whole pinned scroll distance.
          tl.fromTo(words, wordFrom, wordTween, 0);
          tl.to({}, { duration: 1.4 });

          // This beat's own waypoint (same index — shortBeats is
          // [beat1, beat2, beat3] in order) pulses across this same
          // timeline, from wherever it was left — continuous motion
          // across beats, not a per-beat reset.
          var wp = waypoints[beatIndex];
          if (wp) {
            tl.to(wp, { attr: { r: WAYPOINT_PULSE_R[beatIndex] }, ease: 'power1.inOut', duration: 2.2 }, 0);
          }

          // Force GSAP to remeasure the DOM now, with this beat's
          // pin-spacer already inserted, before the next beat's ScrollTrigger
          // is created and reads its own (now correctly shifted) position.
          ScrollTrigger.refresh();

          if (beatIndex === shortBeats.length - 1) {
            // This is the last pinned beat (3) — its own trigger's
            // resolved .end (a real, freshly-refreshed absolute scroll
            // position) is the one number in this whole setup that's
            // guaranteed correct, since it was measured immediately
            // after its own pin-spacer was inserted, right above. The
            // whole-story progress (driving the path/traveler) reaches
            // 1.0 by here and holds "arrived" through beats 4-5, which
            // matches those beats' own described visual state (dial/
            // path fully resolved, settled) rather than needing the
            // journey to resolve exactly at the page's true bottom.
            lastBeatEnd = tl.scrollTrigger.end;
          }
        });
      },
      // Mobile: pinning a full section is unreliable against mobile
      // browser chrome resize behavior, and the layout is already a
      // single stacked column there — scrub the same word reveal against
      // natural scroll-into-view instead, no pin, so there's no
      // pin-spacer sequencing concern to begin with.
      '(max-width: 899px)': function () {
        shortBeats.forEach(function (beat) {
          gsap.fromTo(beat.__storyWords, wordFrom, Object.assign({}, wordTween, {
            scrollTrigger: { trigger: beat, start: 'top 75%', end: 'top 40%', scrub: 0.3 },
          }));
        });
      },
    });

    // Created LAST, after every beat pin above has inserted its
    // pin-spacer — but even so, #scroll-story's own 'bottom bottom' kept
    // landing short of the narrative's real end in testing (mobile has no
    // pinned beats, so lastBeatEnd stays null there and 'bottom bottom'
    // — which works fine without any pin-spacer involved — is the
    // correct fallback).
    ScrollTrigger.create({
      trigger: story,
      start: 'top top',
      end: lastBeatEnd || 'bottom bottom',
      scrub: 0.4,
      onUpdate: function (self) {
        render(self.progress);
        // Safety net: the last beat's pin distance is a fixed viewport
        // multiple that may not land exactly on the page's real max
        // scroll once every beat's pin-spacer is accounted for. If that
        // ever leaves a pin's onLeave un-fired at the very bottom, the
        // backdrop would stay stuck active and permanently hide the
        // footer — force-clear it once scroll has nowhere further to go.
        if (self.progress >= 0.999 && pinBackdrop && pinBackdrop.classList.contains('is-active')) {
          pinnedCount = 0;
          pinBackdrop.classList.remove('is-active');
          document.querySelectorAll('.story-beat.is-pinned').forEach(function (b) { b.classList.remove('is-pinned'); });
        }
      },
    });

    ScrollTrigger.refresh();
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
