// Shared, single /api/session fetch per page load. Before this existed,
// onboarding-gate.js, sign-in.js, diagnostic.js, moneymatters-plus-gate.js,
// advanced-tools-gate.js, advanced-tool-gate.js, and tool-utils.js each
// called fetch('/api/session') independently — a single page view could
// carry 2-4 of these scripts at once (e.g. an advanced tool page loads
// onboarding-gate + sign-in + tool-utils + advanced-tool-gate), firing that
// many duplicate requests for the exact same result. Each /api/session call
// does 1-2 Airtable API calls server-side, so this was multiplying Airtable
// usage several times over for zero benefit. window.mmGetSession() caches
// the first call's promise per variant; every later caller on the page gets
// the same in-flight or resolved result instead of triggering a new request.
// Defined as a self-initializing global (not a real module) so load order
// only requires this script to run before the first caller, same as any
// other plain <script> tag on this site.
//
// advisorStatus is a separate, second Airtable lookup server-side that only
// the homepage dashboard (diagnostic.js) and the MoneyMatters+ member gate
// actually use — every other caller on every other page never reads it.
// Pass includeAdvisorStatus:true to get that variant; it's cached under its
// own key so a page that needs both (there are none today, but the shape
// supports it) doesn't collide with the plain, cheaper default.
window.mmGetSession = window.mmGetSession || (function () {
  var promises = {};
  return function mmGetSession(includeAdvisorStatus) {
    var key = includeAdvisorStatus ? 'withAdvisor' : 'plain';
    if (!promises[key]) {
      var url = includeAdvisorStatus ? '/api/session?advisor=1' : '/api/session';
      promises[key] = fetch(url)
        .then(function (res) { return res.json(); })
        .catch(function () { return { loggedIn: false }; });
    }
    return promises[key];
  };
})();
