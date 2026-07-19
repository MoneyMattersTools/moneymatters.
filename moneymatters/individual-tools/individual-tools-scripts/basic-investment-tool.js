// Investment Management Tool — native interactive calculator.
// Compares current portfolio allocation against a rule-of-thumb target for the selected risk tolerance.

(function () {
  var RISK_TARGETS = {
    1: { label: 'Conservative', equities: 30, bonds: 60, cash: 10 },
    2: { label: 'Moderate', equities: 60, bonds: 35, cash: 5 },
    3: { label: 'Aggressive', equities: 90, bonds: 8, cash: 2 },
  };
  var EXPECTED_RETURN = { equities: 8, bonds: 4, cash: 2, other: 5 };
  var COLORS = { equities: '#62A974', bonds: '#C49A47', cash: '#1A2B23', other: '#9CA9A0' };
  var LABELS = { equities: 'Stocks / Equities', bonds: 'Bonds / Fixed Income', cash: 'Cash / Equivalents', other: 'Other / Alternative' };

  var ids = ['inv-equities', 'inv-bonds', 'inv-cash', 'inv-other'];
  var el = {};
  ids.forEach(function (id) { el[id] = document.getElementById(id); });
  var riskInputs = document.querySelectorAll('input[name="inv-risk"]');
  var resultsEl = document.getElementById('investment-results');
  if (!resultsEl || !riskInputs.length) return;

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
      '<p class="tool-note">' + gapNote + ' Target mix and expected returns (equities 8%, bonds 4%, cash 2%, other 5%) are long-run rule-of-thumb assumptions, not a projection or guarantee — actual returns vary and your right mix depends on your full financial picture.</p>' +
      '<div class="tool-next-steps">' +
        '<a href="../../index.html?start=health-score">Check your Financial Health Score</a>' +
        '<a href="../../contact.html">Talk to an advisor</a>' +
      '</div>';
  }

  ids.forEach(function (id) { toolDebounceInput(el[id], render); });
  riskInputs.forEach(function (input) { input.addEventListener('change', render); });

  render();
})();
