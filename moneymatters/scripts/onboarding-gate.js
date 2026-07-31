(function () {
  var STORAGE_KEY = 'mm_gate_seen';

  // DESIGN_SPEC.md §16.1: applies site-wide now, homepage included —
  // reverses the earlier homepage exclusion.
  if (window.localStorage.getItem(STORAGE_KEY)) return;

  // §37.6: a `start` param means the visitor already chose a specific
  // entry point (e.g. the Advisor Connect CTA) before this gate ever
  // gets a chance to render — showing the generic "choose a place to
  // start" modal on top of that would mask the destination they just
  // clicked toward. Treat it the same as if the gate had been seen.
  if (/[?&]start=/.test(window.location.search)) {
    markSeen();
    return;
  }

  function markSeen() {
    try { window.localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
  }

  window.mmGetSession()
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
    var overlay = document.createElement('div');
    overlay.className = 'mm-gate-overlay';
    overlay.innerHTML =
      '<div class="mm-gate-modal" role="dialog" aria-modal="true" aria-labelledby="mm-gate-heading" tabindex="-1">' +
        '<h2 id="mm-gate-heading">Choose a place to start</h2>' +
        '<div class="entry-grid mm-gate-grid">' +
          '<a class="connect-card" id="mm-gate-health-score" href="/index.html?start=health-score">' +
            '<h3>Check my Financial Health Score</h3>' +
            '<p>A quick, honest read on where you stand, and what to do next.</p>' +
            '<span class="connect-btn">Start <span aria-hidden="true">&rarr;</span></span>' +
          '</a>' +
          '<a class="connect-card" id="mm-gate-net-worth" href="/individual-tools/basic-tools/net-worth-calculator.html">' +
            '<h3>See my Net Worth</h3>' +
            '<p>Add up what you own and owe to see the full picture.</p>' +
            '<span class="connect-btn">Start <span aria-hidden="true">&rarr;</span></span>' +
          '</a>' +
        '</div>' +
        '<div class="mm-gate-divider"><span>or</span></div>' +
        '<div class="mm-gate-returning" id="mm-gate-returning">' +
          '<p class="mm-gate-returning-label">Already have an account?</p>' +
          '<form id="mm-gate-returning-form" class="mm-gate-returning-form" novalidate>' +
            '<label for="mm-gate-returning-email" class="mm-gate-sr-only">Email</label>' +
            '<input type="email" id="mm-gate-returning-email" placeholder="you@example.com" autocomplete="email" required>' +
            '<button type="submit" id="mm-gate-returning-submit">Email me a login link</button>' +
          '</form>' +
          '<p class="mm-gate-returning-status" id="mm-gate-returning-status" hidden></p>' +
        '</div>' +
        '<button type="button" class="mm-gate-skip" id="mm-gate-skip">Skip, just show me the site</button>' +
      '</div>';
    document.body.appendChild(overlay);
    document.documentElement.classList.add('mm-gate-open');

    ['mm-gate-health-score', 'mm-gate-net-worth'].forEach(function (id) {
      document.getElementById(id).addEventListener('click', markSeen);
    });

    var skipBtn = document.getElementById('mm-gate-skip');
    var modal = overlay.querySelector('.mm-gate-modal');

    function getFocusable() {
      return Array.prototype.filter.call(
        overlay.querySelectorAll('a, button, input'),
        function (el) { return !el.hidden && el.offsetParent !== null; }
      );
    }

    function closeGate() {
      markSeen();
      document.documentElement.classList.remove('mm-gate-open');
      overlay.remove();
      document.removeEventListener('keydown', onKeydown);
      var wordmark = document.querySelector('header a[href$="index.html"]');
      if (wordmark) wordmark.focus();
    }

    function onKeydown(e) {
      if (e.key === 'Escape') {
        closeGate();
        return;
      }
      if (e.key === 'Tab') {
        var focusable = getFocusable();
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    // §16.2: a visitor with an existing account but no valid session
    // (cleared cookies, new device) can't be told apart from a brand-new
    // visitor until they identify themselves — this path sends a fresh
    // magic link to whatever email they enter. The response is identical
    // whether or not that email has an account (server-side, to avoid
    // leaking which emails are registered), so the UI always shows the
    // same generic confirmation.
    var returningForm = document.getElementById('mm-gate-returning-form');
    var returningEmail = document.getElementById('mm-gate-returning-email');
    var returningStatus = document.getElementById('mm-gate-returning-status');
    var returningSubmit = document.getElementById('mm-gate-returning-submit');
    var returningBox = document.getElementById('mm-gate-returning');

    returningForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = returningEmail.value.trim();
      if (!email) return;
      returningSubmit.disabled = true;
      returningSubmit.textContent = 'Sending…';
      // §37.6: this is an unrelated sign-in path — clear any advisor-connect
      // intent flag diagnostic.js may have set on an earlier, abandoned
      // visit, so this login link doesn't get misrouted into that checklist.
      try { window.localStorage.removeItem('mm_advisor_connect_intent'); } catch (err) {}
      fetch('/api/resend-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
      })
        .then(function (res) { return res.json().catch(function () { return {}; }); })
        .then(function () {
          returningForm.hidden = true;
          returningStatus.textContent = 'If that email has an account, a login link is on its way. Check your inbox.';
          returningStatus.hidden = false;
          markSeen();
        })
        .catch(function () {
          returningSubmit.disabled = false;
          returningSubmit.textContent = 'Email me a login link';
          returningStatus.textContent = 'Something went wrong. Please try again.';
          returningStatus.hidden = false;
        });
    });

    skipBtn.addEventListener('click', closeGate);
    overlay.addEventListener('click', function (e) {
      if (!modal.contains(e.target)) closeGate();
    });
    document.addEventListener('keydown', onKeydown);
    // §18.1: skip now reads as a quiet exit, not an equally-weighted
    // option — initial focus goes to the first real choice instead of it.
    document.getElementById('mm-gate-health-score').focus();
  }
})();
