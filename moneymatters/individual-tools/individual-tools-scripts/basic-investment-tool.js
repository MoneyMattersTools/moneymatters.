// Investment Management Tool — native interactive calculator.
// Compares current portfolio allocation against a rule-of-thumb target for the selected risk tolerance.

(function () {
  var RISK_TARGETS = {
    1: { label: 'Conservative', equities: 30, bonds: 60, cash: 10 },
    2: { label: 'Moderate', equities: 60, bonds: 35, cash: 5 },
    3: { label: 'Aggressive', equities: 90, bonds: 8, cash: 2 },
  };
  var EXPECTED_RETURN = { equities: 8, bonds: 4, cash: 2, other: 5 };
  var COLORS = { equities: '#34D399', bonds: '#E3B04B', cash: '#F2F6F3', other: '#718276' };
  var LABELS = { equities: 'Stocks / Equities', bonds: 'Bonds / Fixed Income', cash: 'Cash / Equivalents', other: 'Other / Alternative' };

  var ids = ['inv-equities', 'inv-bonds', 'inv-cash', 'inv-other'];
  var el = {};
  ids.forEach(function (id) { el[id] = document.getElementById(id); });
  var riskInputs = document.querySelectorAll('input[name="inv-risk"]');
  var resultsEl = document.getElementById('investment-results');
  if (!resultsEl || !riskInputs.length) return;

  var lastResult = null;
  var actions = toolWireResultsActions(resultsEl, 'investment', 'investment', 'Investment Tool', function () { return lastResult; });

  function currentRisk() {
    var checked = document.querySelector('input[name="inv-risk"]:checked');
    return checked ? checked.value : '2';
  }

  function conicGradient(segments) {
    var cursor = 0;
    var stops = [];
    segments.forEach(function (s) {
      if (s.pct <= 0) return;
      var start = cursor;
      cursor += s.pct;
      stops.push(s.color + ' ' + start + '% ' + cursor + '%');
    });
    if (!stops.length) return 'var(--mm-border) 0% 100%';
    return stops.join(', ');
  }

  function legendHtml(segments) {
    return segments
      .filter(function (s) { return s.pct > 0; })
      .map(function (s) {
        return '<li><span class="tool-legend-swatch" style="background:' + s.color + '"></span>' + LABELS[s.key] + ' &mdash; ' + toolFormatPercent(s.pct, 0) + '</li>';
      })
      .join('');
  }

  function render() {
    var equities = toolParseNumber(el['inv-equities'].value);
    var bonds = toolParseNumber(el['inv-bonds'].value);
    var cash = toolParseNumber(el['inv-cash'].value);
    var other = toolParseNumber(el['inv-other'].value);
    var total = equities + bonds + cash + other;

    var risk = RISK_TARGETS[currentRisk()];

    var currentPct = total > 0 ? {
      equities: (equities / total) * 100,
      bonds: (bonds / total) * 100,
      cash: (cash / total) * 100,
      other: (other / total) * 100,
    } : { equities: 0, bonds: 0, cash: 0, other: 0 };

    var currentSegments = [
      { key: 'equities', pct: currentPct.equities, color: COLORS.equities },
      { key: 'bonds', pct: currentPct.bonds, color: COLORS.bonds },
      { key: 'cash', pct: currentPct.cash, color: COLORS.cash },
      { key: 'other', pct: currentPct.other, color: COLORS.other },
    ];
    var targetSegments = [
      { key: 'equities', pct: risk.equities, color: COLORS.equities },
      { key: 'bonds', pct: risk.bonds, color: COLORS.bonds },
      { key: 'cash', pct: risk.cash, color: COLORS.cash },
    ];

    var currentReturn = total > 0
      ? (currentPct.equities / 100) * EXPECTED_RETURN.equities +
        (currentPct.bonds / 100) * EXPECTED_RETURN.bonds +
        (currentPct.cash / 100) * EXPECTED_RETURN.cash +
        (currentPct.other / 100) * EXPECTED_RETURN.other
      : 0;
    var targetReturn = (risk.equities / 100) * EXPECTED_RETURN.equities +
      (risk.bonds / 100) * EXPECTED_RETURN.bonds +
      (risk.cash / 100) * EXPECTED_RETURN.cash;

    var equityGap = currentPct.equities - risk.equities;
    var gapNote = total > 0
      ? (Math.abs(equityGap) < 5
          ? 'Your equity exposure is close to the ' + risk.label.toLowerCase() + ' target.'
          : 'Your equity exposure is ' + toolFormatPercent(Math.abs(equityGap), 0) + ' ' + (equityGap > 0 ? 'above' : 'below') + ' the ' + risk.label.toLowerCase() + ' target of ' + risk.equities + '%.')
      : 'Enter your portfolio holdings to see how your allocation compares.';

    var toolInputs = { risk: Number(currentRisk()) };
    if (equities > 0) toolInputs.equities = equities;
    if (bonds > 0) toolInputs.bonds = bonds;
    if (cash > 0) toolInputs.cash = cash;
    if (other > 0) toolInputs.other = other;

    lastResult = {
      headline: { label: 'Portfolio Value', value: toolFormatCurrency(total) },
      summary: [
        { label: 'Expected blended return', value: toolFormatPercent(currentReturn, 1) + ' vs. ' + toolFormatPercent(targetReturn, 1) + ' target' },
        { label: 'Risk profile', value: risk.label },
      ].concat(
        currentSegments.filter(function (s) { return s.pct > 0; }).map(function (s) {
          return { label: LABELS[s.key], value: toolFormatPercent(s.pct, 0) };
        })
      ),
      inputs: toolInputs,
    };

    resultsEl.innerHTML = '' +
      '<div class="tool-stat">' +
        '<span class="tool-stat-label">Portfolio Value</span>' +
        '<div class="tool-stat-value">' + toolFormatCurrency(total) + '</div>' +
        '<p class="tool-stat-sub">Expected blended return: ' + toolFormatPercent(currentReturn, 1) + ' vs. ' + toolFormatPercent(targetReturn, 1) + ' target for a ' + risk.label.toLowerCase() + ' profile.</p>' +
      '</div>' +
      '<div class="tool-donut-row">' +
        '<div class="tool-donut-block">' +
          '<h3>Current</h3>' +
          '<div class="tool-donut" style="background:conic-gradient(' + conicGradient(currentSegments) + ')"></div>' +
        '</div>' +
        '<div class="tool-donut-block">' +
          '<h3>' + risk.label + ' Target</h3>' +
          '<div class="tool-donut" style="background:conic-gradient(' + conicGradient(targetSegments) + ')"></div>' +
        '</div>' +
      '</div>' +
      '<ul class="tool-legend">' + legendHtml(currentSegments) + '</ul>' +
      '<p class="tool-note">' + gapNote + ' Target mix and expected returns (equities 8%, bonds 4%, cash 2%, other 5%) are long-run rule-of-thumb assumptions, not a projection or guarantee. Actual returns vary and your right mix depends on your full financial picture.</p>' +
      toolResultsActionsHtml('investment') +
      '<div class="tool-next-steps">' +
        '<a href="../../index.html?start=health-score">Check your Financial Health Score</a>' +
        '<a href="../../contact.html">Talk to an advisor</a>' +
      '</div>';
    actions.refresh();
  }

  ids.forEach(function (id) { toolDebounceInput(el[id], render); });
  riskInputs.forEach(function (input) { input.addEventListener('change', render); });

  render();

  // §38.5: pre-fill from a previously-saved result for returning,
  // signed-in visitors. `risk` is a radio group, not a plain input —
  // toolPrefillFromSaved only knows how to set .value, so that one field
  // is handled separately (checking the matching radio) rather than
  // passed through the shared helper.
  window.mmGetSession().then(function (data) {
    if (!data || !data.loggedIn || !data.tools || !data.tools.investment) return;
    var saved = data.tools.investment;
    if (saved.inputs && typeof saved.inputs.risk === 'number') {
      var radio = document.querySelector('input[name="inv-risk"][value="' + saved.inputs.risk + '"]');
      if (radio) radio.checked = true;
    }
    var idToInput = { equities: el['inv-equities'], bonds: el['inv-bonds'], cash: el['inv-cash'], other: el['inv-other'] };
    var filled = toolPrefillFromSaved(saved, idToInput);
    if (filled || (saved.inputs && typeof saved.inputs.risk === 'number')) render();
  }).catch(function () {});
})();
