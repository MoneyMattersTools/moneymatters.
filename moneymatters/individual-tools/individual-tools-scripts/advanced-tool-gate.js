// §28.7: reveals the native Advanced Tool calculator only for a logged-in
// MoneyMatters+ session; everyone else (including anonymous visitors and
// free-plan users) sees the locked upsell panel, which is what's in the
// markup by default so the page fails closed if this check never resolves.
(function () {
  var locked = document.getElementById('tool-locked');
  var app = document.getElementById('tool-app');
  if (!locked || !app) return;

  window.mmGetSession()
    .then(function (data) {
      if (data && data.loggedIn && data.plan === 'plus') {
        locked.hidden = true;
        app.hidden = false;
        // The fade-up scroll-reveal observer (scroll-animations.js) never
        // adds .is-visible here: it ran while this section was still
        // hidden, so it was never a valid intersection target. Without
        // this, the now-unlocked calculator stays at opacity:0 forever.
        app.classList.add('is-visible');
      }
    })
    .catch(function () {});
})();
