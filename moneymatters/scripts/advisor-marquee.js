// §32.3: matches the advisor card row's drift speed to the sitewide
// .value-strip-track marquee's actual px/second rate (not just reusing
// its 240s duration, which would be wildly wrong for a much shorter
// track) — measures both tracks' real widths at runtime and derives a
// duration for this track that produces the identical rate.
(function () {
  var track = document.getElementById('advisor-preview-track');
  if (!track) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return; // CSS handles the static/scrollable fallback

  var TICKER_DURATION_S = 240; // must match .value-strip-track's animation-duration

  function applySpeed() {
    var halfWidth = track.scrollWidth / 2;
    if (!halfWidth) return;

    var pxPerSecond;
    var tickerTrack = document.querySelector('.value-strip-track');
    if (tickerTrack && tickerTrack.scrollWidth) {
      pxPerSecond = (tickerTrack.scrollWidth / 2) / TICKER_DURATION_S;
    } else {
      pxPerSecond = 40; // fallback if the ticker isn't present for some reason
    }

    track.style.animationDuration = (halfWidth / pxPerSecond).toFixed(1) + 's';
  }

  if (document.readyState === 'complete') applySpeed();
  else window.addEventListener('load', applySpeed);
})();
