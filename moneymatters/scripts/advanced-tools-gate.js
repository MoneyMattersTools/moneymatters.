// §28.7: Tools page Advanced Tools cards are visible-but-locked by default
// (the markup already shows a lock badge and "Preview" CTA for everyone).
// For a logged-in MoneyMatters+ session, swap them to their unlocked state.
(function () {
  var cards = document.querySelectorAll('.advanced-tool-card');
  if (!cards.length) return;

  fetch('/api/session')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var isPlus = !!(data && data.loggedIn && data.plan === 'plus');
      if (!isPlus) return;
      cards.forEach(function (card) {
        var lock = card.querySelector('.advanced-tool-lock');
        var ctaLabel = card.querySelector('.advanced-tool-cta-label');
        if (lock) lock.hidden = true;
        if (ctaLabel) ctaLabel.textContent = 'Open tool';
      });
    })
    .catch(function () {});
})();
