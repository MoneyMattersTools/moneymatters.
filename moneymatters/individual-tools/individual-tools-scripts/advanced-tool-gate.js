// §28.7: reveals the native Advanced Tool calculator only for a logged-in
// MoneyMatters+ session; everyone else (including anonymous visitors and
// free-plan users) sees the locked upsell panel, which is what's in the
// markup by default so the page fails closed if this check never resolves.
(function () {
  var locked = document.getElementById('tool-locked');
  var app = document.getElementById('tool-app');
  if (!locked || !app) return;

  fetch('/api/session')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data && data.loggedIn && data.plan === 'plus') {
        locked.hidden = true;
        app.hidden = false;
      }
    })
    .catch(function () {});
})();
