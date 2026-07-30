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

  function toggleAccountMenu(email) {
    var existing = document.getElementById('mm-account-menu');
    if (existing) {
      existing.remove();
      return;
    }
    var menu = document.createElement('div');
    menu.className = 'mm-account-menu';
    menu.id = 'mm-account-menu';
    menu.innerHTML =
      '<p class="mm-account-menu-email">Signed in as ' + email + '</p>' +
      '<button type="button" class="mm-account-menu-signout" id="mm-account-signout">Sign out</button>';
    trigger.insertAdjacentElement('afterend', menu);

    document.getElementById('mm-account-signout').addEventListener('click', function () {
      fetch('/api/sign-out', { method: 'POST' })
        .catch(function () {})
        .then(function () { window.location.reload(); });
    });

    function onDocClick(e) {
      if (menu.contains(e.target) || e.target === trigger) return;
      menu.remove();
      document.removeEventListener('click', onDocClick);
    }
    setTimeout(function () { document.addEventListener('click', onDocClick); }, 0);
  }

  window.mmGetSession()
    .then(function (data) {
      if (data && data.loggedIn && data.email) {
        trigger.textContent = shortEmail(data.email);
        trigger.classList.add('nav-sign-in-link--account');
        trigger.addEventListener('click', function () { toggleAccountMenu(data.email); });
      } else {
        trigger.addEventListener('click', openModal);
      }
    })
    .catch(function () {
      trigger.addEventListener('click', openModal);
    });
})();
