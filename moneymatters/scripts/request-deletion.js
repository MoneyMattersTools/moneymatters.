document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('delete-data-form');
  var statusEl = document.getElementById('delete-data-status');
  if (!form || !statusEl) return;

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var emailInput = document.getElementById('delete-email');
    var email = (emailInput.value || '').trim();
    var submitBtn = form.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    statusEl.hidden = false;
    statusEl.className = 'data-request-status';
    statusEl.textContent = 'Sending request…';

    fetch('/api/request-deletion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        submitBtn.disabled = false;
        if (result.ok && result.data.ok) {
          form.hidden = true;
          statusEl.className = 'data-request-status data-request-status--success';
          statusEl.textContent = result.data.alreadyPending
            ? "You already have a deletion request in progress for this email — we'll email you once it's complete."
            : "Request received. We'll email you at that address, and your data will be removed within 14 days.";
        } else if (result.data && result.data.error === 'rate_limited') {
          statusEl.className = 'data-request-status data-request-status--error';
          statusEl.textContent = 'Too many requests — please try again in a minute.';
        } else if (result.data && result.data.error === 'invalid_email') {
          statusEl.className = 'data-request-status data-request-status--error';
          statusEl.textContent = 'Please enter a valid email address.';
        } else {
          statusEl.className = 'data-request-status data-request-status--error';
          statusEl.textContent = 'Something went wrong. Please try again or contact us directly.';
        }
      })
      .catch(function () {
        submitBtn.disabled = false;
        statusEl.className = 'data-request-status data-request-status--error';
        statusEl.textContent = 'Something went wrong. Please try again or contact us directly.';
      });
  });
});
