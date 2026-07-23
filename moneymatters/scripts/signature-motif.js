(function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var wrap = document.createElement('div');
  wrap.className = 'mm-signature-motif';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML =
    '<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">' +
      '<g class="mm-sig-ticks">' +
        Array.from({ length: 24 }).map(function (_, i) {
          var angle = (i / 24) * 360;
          return '<line class="mm-sig-tick" transform="rotate(' + angle + ' 300 300)" x1="300" y1="42" x2="300" y2="' + (i % 3 === 0 ? 62 : 54) + '"/>';
        }).join('') +
      '</g>' +
      '<circle class="mm-sig-ring-track" cx="300" cy="300" r="230"/>' +
      '<circle class="mm-sig-ring-fill" cx="300" cy="300" r="230"/>' +
      '<circle class="mm-sig-ring-outer" cx="300" cy="300" r="270"/>' +
      '<g class="mm-sig-line">' +
        '<path class="mm-sig-line-path" d="M 130 380 Q 190 330 240 300 T 360 220 Q 410 190 460 130"/>' +
        '<circle class="mm-sig-dot mm-sig-dot-1" cx="460" cy="130" r="6"/>' +
        '<circle class="mm-sig-dot mm-sig-dot-2" cx="360" cy="220" r="4"/>' +
        '<circle class="mm-sig-dot mm-sig-dot-3" cx="240" cy="300" r="4"/>' +
      '</g>' +
    '</svg>';
  document.body.appendChild(wrap);

  if (reduceMotion) return;

  var ringFill = wrap.querySelector('.mm-sig-ring-fill');
  var lineGroup = wrap.querySelector('.mm-sig-line');
  var ticksGroup = wrap.querySelector('.mm-sig-ticks');
  var RING_CIRC = 2 * Math.PI * 230;
  ringFill.style.strokeDasharray = RING_CIRC.toFixed(1);

  var targetScroll = 0, currentScroll = 0;
  var targetX = 0, targetY = 0, currentX = 0, currentY = 0;
  var raf = null;

  function onScroll() {
    var doc = document.documentElement;
    var max = (doc.scrollHeight || 1) - doc.clientHeight;
    targetScroll = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    schedule();
  }
  function onPointerMove(e) {
    targetX = (e.clientX / window.innerWidth) - 0.5;
    targetY = (e.clientY / window.innerHeight) - 0.5;
    schedule();
  }
  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(tick);
  }
  function tick() {
    raf = null;
    currentScroll += (targetScroll - currentScroll) * 0.08;
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;

    var offset = RING_CIRC * (1 - currentScroll);
    ringFill.style.strokeDashoffset = offset.toFixed(1);
    ticksGroup.style.transform = 'rotate(' + (currentScroll * 40) + 'deg)';
    lineGroup.style.transform = 'translate(' + (currentX * -14).toFixed(1) + 'px, ' + (currentY * -10).toFixed(1) + 'px)';

    if (Math.abs(targetScroll - currentScroll) > 0.001 || Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
      schedule();
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
  }
  onScroll();
})();
