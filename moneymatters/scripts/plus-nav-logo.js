// §42.2: for a logged-in Plus member, swap the standard nav wordmark icon
// for a distinct member mark - a visual signal of membership status.
// Placeholder mark (moneymatters-plus-mark.svg) until the provided asset
// is available; see DESIGN_SPEC.md §42. Derives the swap path from the
// existing icon's own src rather than a hardcoded "images/..." path, since
// this script is included at every page depth (root, blogs/, individual-
// tools/*/) with a different relative prefix each time.
(function () {
  function applyPlusNavLogo() {
    var icon = document.querySelector('.nav-logo-icon');
    if (!icon || icon.classList.contains('nav-logo-icon--plus')) return;
    var currentSrc = icon.getAttribute('src') || '';
    var dir = currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1);
    icon.setAttribute('src', dir + 'moneymatters-plus-mark.svg');
    icon.setAttribute('alt', 'MoneyMatters+ member');
    icon.classList.add('nav-logo-icon--plus');
  }

  // Exposed so a page that already knows the user's plan from its own data
  // (diagnostic.js's magic-link verify response, specifically) can apply
  // this immediately instead of waiting on the session check below - that
  // check's mmGetSession() call fires (and caches its result) at page
  // load, which on index.html happens BEFORE a same-load verify-confirm
  // click ever establishes the session, so it would otherwise permanently
  // cache loggedIn:false for that load and never pick up the swap.
  window.mmApplyPlusNavLogo = applyPlusNavLogo;

  if (typeof window.mmGetSession !== 'function') return;
  window.mmGetSession().then(function (session) {
    if (session && session.loggedIn && session.plan === 'plus') applyPlusNavLogo();
  });
})();
