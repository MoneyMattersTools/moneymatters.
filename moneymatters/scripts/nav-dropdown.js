// Nav dropdowns (About Us -> Contact, Advisor Connect -> For Advisors,
// and the account menu once signed in — sign-in.js) — §20, generalized in
// §SITE_STRATEGY item 6 (locked 2026-08-08) to support more than one
// dropdown per page. Desktop reveal is pure CSS (:hover / :focus-within,
// see site-base.css) — this click/tap toggle is the mobile fallback only
// (touch devices have no hover state), but stays wired identically on
// every viewport so keyboard and screen-reader users get the same
// explicit open/close control regardless of pointer type.
//
// Exposed as window.mmWireDropdown so sign-in.js can wire up the account
// menu's toggle too — that one doesn't exist in the static HTML (built
// dynamically once mmGetSession() resolves, after this file's own
// DOMContentLoaded pass already ran its querySelectorAll snapshot).
window.mmWireDropdown = function (toggle) {
  var menu = document.getElementById(toggle.getAttribute('aria-controls'));
  if (!menu) return;

  function closeMenu() {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  }
  function openMenu() {
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
  }

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    if (menu.hidden) openMenu(); else closeMenu();
  });
  document.addEventListener('click', function (e) {
    if (!menu.hidden && !menu.contains(e.target) && e.target !== toggle) closeMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) {
      closeMenu();
      toggle.focus();
    }
  });
};

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.nav-dropdown-toggle').forEach(window.mmWireDropdown);
});
