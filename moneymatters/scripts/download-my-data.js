document.addEventListener('DOMContentLoaded', function () {
  var btn = document.getElementById('download-my-data-btn');
  var statusEl = document.getElementById('download-my-data-status');
  if (!btn || !statusEl) return;

  btn.addEventListener('click', function () {
    btn.disabled = true;
    statusEl.hidden = false;
    statusEl.className = 'data-request-status';
    statusEl.textContent = 'Preparing your download…';

    fetch('/api/download-my-data')
      .then(function (res) {
        if (res.status === 401) {
          // Not signed in — open the existing sign-in modal (same one the
          // nav "Sign In" link uses) rather than build a second one, then
          // let the visitor retry once they're actually authenticated.
          var navSignIn = document.getElementById('nav-sign-in');
          if (navSignIn) navSignIn.click();
          return Promise.reject({ handled: true, reason: 'not_authenticated' });
        }
        if (!res.ok) return Promise.reject({ handled: false });
        return res.json();
      })
      .then(function (data) {
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'moneymatters-data-export-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        btn.disabled = false;
        statusEl.className = 'data-request-status data-request-status--success';
        statusEl.textContent = 'Downloaded.';
      })
      .catch(function (err) {
        btn.disabled = false;
        if (err && err.reason === 'not_authenticated') {
          statusEl.className = 'data-request-status';
          statusEl.textContent = 'Sign in, then click Download my data again.';
          return;
        }
        statusEl.className = 'data-request-status data-request-status--error';
        statusEl.textContent = 'Something went wrong. Please try again or contact us directly.';
      });
  });
});
