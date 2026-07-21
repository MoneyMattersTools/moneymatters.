document.addEventListener('DOMContentLoaded', function () {
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isFinePointer = window.matchMedia('(pointer: fine)').matches;

  // --- Cursor-follow spotlight (desktop, precise-pointer only) ---
  if (isFinePointer && !prefersReducedMotion) {
    var glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);

    var targetX = window.innerWidth / 2;
    var targetY = window.innerHeight / 2;
    var currentX = targetX;
    var currentY = targetY;
    var active = false;
    var raf = null;

    function onMove(e) {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!active) {
        active = true;
        glow.classList.add('is-active');
      }
    }
    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', function () {
      active = false;
      glow.classList.remove('is-active');
    });

    function tick() {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      glow.style.transform = 'translate3d(' + currentX + 'px,' + currentY + 'px,0)';
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  }

  // --- Film-grain overlay (static, cheap) ---
  if (!prefersReducedMotion) {
    var grain = document.createElement('div');
    grain.className = 'grain-overlay';
    document.body.appendChild(grain);
  }

  // --- Reveal on scroll for the new variants (additive to the existing
  // .fade-up observer in scroll-animations.js — separate observer so
  // that file doesn't need to change). ---
  var revealTargets = document.querySelectorAll('.reveal-scale, .reveal-stagger');
  if (revealTargets.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  }

  // --- Magnetic hover on primary CTAs (desktop only) ---
  if (isFinePointer && !prefersReducedMotion) {
    document.querySelectorAll('.magnetic').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var relX = e.clientX - rect.left - rect.width / 2;
        var relY = e.clientY - rect.top - rect.height / 2;
        el.style.setProperty('--mx', (relX * 0.18).toFixed(1) + 'px');
        el.style.setProperty('--my', (relY * 0.18).toFixed(1) + 'px');
      });
      el.addEventListener('mouseleave', function () {
        el.style.setProperty('--mx', '0px');
        el.style.setProperty('--my', '-2px');
      });
    });
  }
});
