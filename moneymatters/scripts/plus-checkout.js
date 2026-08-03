// Stripe subscription integration (test mode) — the sales page's "Get
// started" button. Requires a signed-in session (create-checkout-session.js
// looks the user up by their session email); if there isn't one, opens the
// existing nav sign-in modal instead of attempting checkout.
(function () {
  var btn = document.getElementById('plus-subscribe-btn');
  var errorEl = document.getElementById('plus-subscribe-error');
  if (!btn) return;

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  btn.addEventListener('click', function () {
    if (typeof window.mmGetSession !== 'function') return;
    if (errorEl) errorEl.hidden = true;

    window.mmGetSession().then(function (session) {
      if (!session || !session.loggedIn) {
        var signInTrigger = document.getElementById('nav-sign-in');
        if (signInTrigger) signInTrigger.click();
        showError('Sign in first, then click Get started again.');
        return;
      }

      btn.disabled = true;
      var originalText = btn.textContent;
      btn.textContent = 'Redirecting…';

      fetch('/api/create-checkout-session', { method: 'POST' })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && data.ok && data.url) {
            window.location.href = data.url;
            return;
          }
          btn.disabled = false;
          btn.textContent = originalText;
          showError('Something went wrong starting checkout. Please try again.');
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = originalText;
          showError('Something went wrong starting checkout. Please try again.');
        });
    });
  });
})();
