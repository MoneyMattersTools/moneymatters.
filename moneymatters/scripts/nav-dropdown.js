// About Us nav dropdown (Contact) — §20. Click/tap-toggleable so it works
// identically for keyboard, touch, and mouse users, inside both the
// desktop row nav and the collapsed mobile nav.
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-dropdown-toggle');
  var menu = document.querySelector('.nav-dropdown-menu');
  if (!toggle || !menu) return;

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
