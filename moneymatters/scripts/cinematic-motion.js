document.addEventListener('DOMContentLoaded', function () {
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isFinePointer = window.matchMedia('(pointer: fine)').matches;
  // Utility pages (Tools + native tool calculators) opt out of ambient
  // atmosphere per DESIGN_SPEC.md §13 — working interfaces, not narrative
  // pages. Scroll-reveal and magnetic hover below stay on everywhere;
  // only the cursor-glow and grain-overlay are cinematic-only.
  var isUtilityPage = document.body.classList.contains('utility-page');
  // §38.4: the Tools hub page is a browsable landing/menu page, not a
  // working input form the way the individual calculators are — it gets
  // the glow back specifically via this class on its <body>, while the
  // calculators (and privacy-policy.html) keep the exemption unchanged.
  var glowExempt = isUtilityPage && !document.body.classList.contains('allow-cursor-glow');

  // --- Cursor-follow spotlight (desktop, precise-pointer only) ---
  if (isFinePointer && !prefersReducedMotion && !glowExempt) {
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
  if (!prefersReducedMotion && !isUtilityPage) {
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

  // --- Lightweight parallax drift on hero photo/video backdrops
  // (DESIGN_SPEC.md §14). Transform-only, passive scroll listener,
  // rAF-throttled — compositor-friendly, no layout thrash. Skipped
  // entirely on utility pages (none exist there) and reduced-motion. ---
  var mediaLayers = document.querySelectorAll('.hero-media-poster, .hero-media-video');
  if (mediaLayers.length && !prefersReducedMotion) {
    var parallaxTicking = false;
    function applyParallax() {
      parallaxTicking = false;
      mediaLayers.forEach(function (el) {
        var rect = el.parentElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        var offset = rect.top * 0.12;
        el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0) scale(1.08)';
      });
    }
    window.addEventListener('scroll', function () {
      if (!parallaxTicking) {
        parallaxTicking = true;
        requestAnimationFrame(applyParallax);
      }
    }, { passive: true });
    applyParallax();
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
