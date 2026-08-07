// Nav dropdowns (About Us -> Contact, Advisor Connect -> For Advisors) —
// §20, generalized in §SITE_STRATEGY item 6 (locked 2026-08-08) to support
// more than one dropdown per page. Desktop reveal is pure CSS (:hover /
// :focus-within, see site-base.css) — this click/tap toggle is the mobile
// fallback only (touch devices have no hover state), but stays wired
// identically on every viewport so keyboard and screen-reader users get
// the same explicit open/close control regardless of pointer type.
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.nav-dropdown-toggle').forEach(function (toggle) {
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
  });
});
