// Persistent "Sign In" nav link — DESIGN_SPEC.md §21.1. Reuses the same
// passwordless magic-link flow (and /api/resend-login endpoint) already
// built for onboarding-gate.js's "already have an account" path, but is
// reachable from the nav at any time, not just on a first ungated visit.
// Reuses .mm-gate-* classes from dark-system.css so it matches the gate
// modal's visual language exactly, with no new CSS needed.
(function () {
  var trigger = document.getElementById('nav-sign-in');
  if (!trigger) return;

  function openModal() {
    var overlay = document.createElement('div');
    overlay.className = 'mm-gate-overlay';
    overlay.innerHTML =
      '<div class="mm-gate-modal" role="dialog" aria-modal="true" aria-labelledby="mm-signin-heading" tabindex="-1">' +
        '<h2 id="mm-signin-heading">Sign in</h2>' +
        '<div class="mm-gate-returning" id="mm-signin-returning">' +
          '<p class="mm-gate-returning-label">Enter your email and we&rsquo;ll send you a link to log back in.</p>' +
          '<form id="mm-signin-form" class="mm-gate-returning-form" novalidate>' +
            '<label for="mm-signin-email" class="mm-gate-sr-only">Email</label>' +
            '<input type="email" id="mm-signin-email" placeholder="you@example.com" autocomplete="email" required>' +
            '<button type="submit" id="mm-signin-submit">Email me a login link</button>' +
          '</form>' +
          '<p class="mm-gate-returning-status" id="mm-signin-status" hidden></p>' +
        '</div>' +
        '<button type="button" class="mm-gate-skip" id="mm-signin-close">Cancel</button>' +
      '</div>';
    document.body.appendChild(overlay);
    document.documentElement.classList.add('mm-gate-open');

    var modal = overlay.querySelector('.mm-gate-modal');
    var closeBtn = document.getElementById('mm-signin-close');
    var form = document.getElementById('mm-signin-form');
    var emailInput = document.getElementById('mm-signin-email');
    var statusEl = document.getElementById('mm-signin-status');
    var submitBtn = document.getElementById('mm-signin-submit');

    function getFocusable() {
      return Array.prototype.filter.call(
        overlay.querySelectorAll('a, button, input'),
        function (el) { return !el.hidden && el.offsetParent !== null; }
      );
    }

    function closeModal() {
      document.documentElement.classList.remove('mm-gate-open');
      overlay.remove();
      document.removeEventListener('keydown', onKeydown);
      trigger.focus();
    }

    function onKeydown(e) {
      if (e.key === 'Escape') {
        closeModal();
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

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = emailInput.value.trim();
      if (!email) return;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
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
          form.hidden = true;
          statusEl.textContent = 'If that email has an account, a login link is on its way. Check your inbox.';
          statusEl.hidden = false;
        })
        .catch(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Email me a login link';
          statusEl.textContent = 'Something went wrong. Please try again.';
          statusEl.hidden = false;
        });
    });

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
      if (!modal.contains(e.target)) closeModal();
    });
    document.addEventListener('keydown', onKeydown);
    emailInput.focus();
  }

  // §29.3: once signed in, the nav should say who you are, not just offer
  // a generic "Sign In" link again — also the first real groundwork for
  // distinguishing MoneyMatters+ members later.
  function shortEmail(email) {
    return email.length > 22 ? email.slice(0, 19) + '…' : email;
  }

  // DESIGN_SPEC.md §49.5 (locked 2026-08-09): sign-out previously lived
  // in a one-off custom menu (click your own email, hope you notice it's
  // interactive) — replaced with the same hover-on-desktop/tap-on-mobile
  // dropdown pattern as the About Us / Advisor Connect nav items
  // (site-base.css's .nav-item-with-dropdown rules, wired through
  // nav-dropdown.js's window.mmWireDropdown), so finding sign-out uses
  // the same, already-familiar affordance as every other secondary nav
  // action instead of a bespoke pattern nothing else on the site used.
  function buildAccountMenu(email) {
    var wrapper = document.createElement('span');
    wrapper.className = 'nav-item-with-dropdown';
    wrapper.innerHTML =
      '<button type="button" class="nav-sign-in-link nav-sign-in-link--account" id="nav-sign-in">' + shortEmail(email) + '</button>' +
      '<button type="button" class="nav-dropdown-toggle" aria-expanded="false" aria-controls="nav-account-dropdown" aria-label="Account menu">&#9662;</button>' +
      '<div class="nav-dropdown-menu" id="nav-account-dropdown" hidden>' +
        '<button type="button" class="nav-dropdown-signout" id="nav-account-signout">Sign out</button>' +
      '</div>';
    trigger.replaceWith(wrapper);

    if (typeof window.mmWireDropdown === 'function') {
      window.mmWireDropdown(wrapper.querySelector('.nav-dropdown-toggle'));
    }

    document.getElementById('nav-account-signout').addEventListener('click', function () {
      fetch('/api/sign-out', { method: 'POST' })
        .catch(function () {})
        .then(function () { window.location.reload(); });
    });
  }

  window.mmGetSession()
    .then(function (data) {
      if (data && data.loggedIn && data.email) {
        buildAccountMenu(data.email);
      } else {
        trigger.addEventListener('click', openModal);
      }
    })
    .catch(function () {
      trigger.addEventListener('click', openModal);
    });
})();
