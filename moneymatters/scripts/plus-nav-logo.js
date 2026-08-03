// §42.2: for a logged-in Plus member, swap the standard nav wordmark icon
// for a distinct member mark - a visual signal of membership status.
// Placeholder mark (moneymatters-plus-mark.svg) until the provided asset
// is available; see DESIGN_SPEC.md §42. Derives the swap path from the
// existing icon's own src rather than a hardcoded "images/..." path, since
// this script is included at every page depth (root, blogs/, individual-
// tools/*/) with a different relative prefix each time.
(function () {
  if (typeof window.mmGetSession !== 'function') return;

  window.mmGetSession().then(function (session) {
    if (!session || !session.loggedIn || session.plan !== 'plus') return;
    var icon = document.querySelector('.nav-logo-icon');
    if (!icon) return;
    var currentSrc = icon.getAttribute('src') || '';
    var dir = currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1);
    icon.setAttribute('src', dir + 'moneymatters-plus-mark.svg');
    icon.setAttribute('alt', 'MoneyMatters+ member');
    icon.classList.add('nav-logo-icon--plus');
  });
})();
