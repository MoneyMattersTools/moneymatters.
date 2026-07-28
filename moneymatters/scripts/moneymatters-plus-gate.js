// §30.5: swaps the public MoneyMatters+ sales page for the actual member
// offering once a session confirms Plan==='plus'. Defaults to the sales
// page for everyone (anonymous, free, or a failed/slow session check) —
// that's the correct fallback for a public marketing page, unlike the
// advanced-tool calculators, which fail closed to a locked state instead.
(function () {
  var memberView = document.getElementById('plus-member-view');
  var salesView = document.getElementById('plus-sales-view');
  if (!memberView || !salesView) return;

  fetch('/api/session')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data && data.loggedIn && data.plan === 'plus') {
        salesView.hidden = true;
        memberView.hidden = false;
      }
    })
    .catch(function () {});
})();
