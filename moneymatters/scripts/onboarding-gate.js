(function () {
  var STORAGE_KEY = 'mm_gate_seen';

  // The homepage hero already presents this exact same choice, unblocked,
  // as its primary content — stacking a modal on top of it would just
  // hide identical content behind identical content. Every other page
  // gets the gate.
  var path = window.location.pathname;
  if (/(^|\/)index\.html$/.test(path) || /\/$/.test(path)) return;

  if (window.sessionStorage.getItem(STORAGE_KEY)) return;

  function markSeen() {
    try { window.sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
  }

  function rootPrefix() {
    var homeLink = document.querySelector('header nav a[href$="index.html"]');
    if (!homeLink) return '';
    var href = homeLink.getAttribute('href');
    return href.replace(/index\.html$/, '');
  }

  fetch('/api/session')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data && data.loggedIn) {
        markSeen();
        return;
      }
      showGate();
    })
    .catch(function () {
      showGate();
    });

  function showGate() {
    var root = rootPrefix();
    var overlay = document.createElement('div');
    overlay.className = 'mm-gate-overlay';
    overlay.innerHTML =
      '<div class="mm-gate-modal" role="dialog" aria-modal="true" aria-labelledby="mm-gate-heading" tabindex="-1">' +
        '<button type="button" class="mm-gate-skip" id="mm-gate-skip">Skip, just show me the site <span aria-hidden="true">&times;</span></button>' +
        '<span class="kicker"><span class="kicker-dot"></span>Before you dive in</span>' +
        '<h2 id="mm-gate-heading">Where do you actually stand with money?</h2>' +
        '<p class="mm-gate-sub">Pick a starting point — free, takes under 2 minutes. Or skip and browse freely.</p>' +
        '<div class="entry-grid mm-gate-grid">' +
          '<a class="connect-card" id="mm-gate-health-score" href="' + root + 'index.html?start=health-score">' +
            '<h3>Check my Financial Health Score</h3>' +
            '<p>A quick, honest read on where you stand — and what to do next.</p>' +
            '<span class="connect-btn">Start <span aria-hidden="true">&rarr;</span></span>' +
          '</a>' +
          '<a class="connect-card" id="mm-gate-net-worth" href="' + root + 'individual-tools/basic-tools/net-worth-calculator.html">' +
            '<h3>See my Net Worth</h3>' +
            '<p>Add up what you own and owe to see the full picture.</p>' +
            '<span class="connect-btn">Start <span aria-hidden="true">&rarr;</span></span>' +
          '</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    document.documentElement.classList.add('mm-gate-open');

    ['mm-gate-health-score', 'mm-gate-net-worth'].forEach(function (id) {
      document.getElementById(id).addEventListener('click', markSeen);
    });

    var skipBtn = document.getElementById('mm-gate-skip');
    var modal = overlay.querySelector('.mm-gate-modal');
    var focusable = overlay.querySelectorAll('a, button');
    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    function closeGate() {
      markSeen();
      document.documentElement.classList.remove('mm-gate-open');
      overlay.remove();
      document.removeEventListener('keydown', onKeydown);
    }

    function onKeydown(e) {
      if (e.key === 'Escape') {
        closeGate();
        return;
      }
      if (e.key === 'Tab' && focusable.length) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    skipBtn.addEventListener('click', closeGate);
    overlay.addEventListener('click', function (e) {
      if (!modal.contains(e.target)) closeGate();
    });
    document.addEventListener('keydown', onKeydown);
    skipBtn.focus();
  }
})();
