// Advanced Investment Tool — native interactive calculator (MoneyMatters+).
// Unlike the basic tool (category totals only), this tracks individual
// holdings by name, lets you categorize each one, and rolls them up into
// the same current-vs-target allocation comparison.

(function () {
  var RISK_TARGETS = {
    1: { label: 'Conservative', equities: 30, bonds: 60, cash: 10 },
    2: { label: 'Moderate', equities: 60, bonds: 35, cash: 5 },
    3: { label: 'Aggressive', equities: 90, bonds: 8, cash: 2 },
  };
  var EXPECTED_RETURN = { equities: 8, bonds: 4, cash: 2, other: 5 };
  var COLORS = { equities: '#34D399', bonds: '#E3B04B', cash: '#F2F6F3', other: '#718276' };
  var LABELS = { equities: 'Equities', bonds: 'Bonds', cash: 'Cash', other: 'Other' };

  var listEl = document.getElementById('adv-inv-holdings-list');
  var addBtn = document.getElementById('adv-inv-add-holding');
  var riskInputs = document.querySelectorAll('input[name="adv-inv-risk"]');
  var resultsEl = document.getElementById('adv-investment-results');
  if (!listEl || !addBtn || !resultsEl || !riskInputs.length) return;

  var nextId = 1;
  var holdings = [
    { id: nextId++, name: '', category: 'equities', value: '' },
    { id: nextId++, name: '', category: 'bonds', value: '' },
  ];

  var lastResult = null;
  // No `inputs` pre-fill for this tool — holdings are a dynamic named
  // list, not fixed form fields, so toolPrefillFromSaved's flat
  // key->input map doesn't apply the way it does for the other tools.
  // Save/summary/email still work fully; only "come back and see your
  // exact holdings pre-filled" doesn't.
  var actions = toolWireResultsActions(resultsEl, 'adv-investment', 'advInvestment', 'Advanced Investment Tool', function () { return lastResult; });

  function currentRisk() {
    var checked = document.querySelector('input[name="adv-inv-risk"]:checked');
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

  function renderHoldingsInputs() {
    listEl.innerHTML = holdings.map(function (h) {
      return '' +
        '<div class="tool-holding-row" data-holding-id="' + h.id + '">' +
          '<input type="text" class="tool-holding-name" placeholder="e.g. VOO, Vanguard 500" aria-label="Holding name" value="' + (h.name || '').replace(/"/g, '&quot;') + '">' +
          '<select class="tool-holding-category" aria-label="Category">' +
            '<option value="equities"' + (h.category === 'equities' ? ' selected' : '') + '>Equities</option>' +
            '<option value="bonds"' + (h.category === 'bonds' ? ' selected' : '') + '>Bonds</option>' +
            '<option value="cash"' + (h.category === 'cash' ? ' selected' : '') + '>Cash</option>' +
            '<option value="other"' + (h.category === 'other' ? ' selected' : '') + '>Other</option>' +
          '</select>' +
          '<input type="number" inputmode="decimal" min="0" class="tool-holding-value" placeholder="Value" aria-label="Value" value="' + (h.value || '') + '">' +
          '<button type="button" class="tool-holding-remove" aria-label="Remove holding">&times;</button>' +
        '</div>';
    }).join('');
  }

  function render() {
    var risk = RISK_TARGETS[currentRisk()];
    var total = holdings.reduce(function (sum, h) { return sum + toolParseNumber(h.value); }, 0);

    var categoryTotals = { equities: 0, bonds: 0, cash: 0, other: 0 };
    holdings.forEach(function (h) {
      categoryTotals[h.category] += toolParseNumber(h.value);
    });

    var currentPct = total > 0 ? {
      equities: (categoryTotals.equities / total) * 100,
      bonds: (categoryTotals.bonds / total) * 100,
      cash: (categoryTotals.cash / total) * 100,
      other: (categoryTotals.other / total) * 100,
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
      : 'Add your holdings to see how your allocation compares.';

    var holdingRows = holdings
      .filter(function (h) { return toolParseNumber(h.value) > 0; })
      .sort(function (a, b) { return toolParseNumber(b.value) - toolParseNumber(a.value); })
      .map(function (h) {
        var pct = total > 0 ? (toolParseNumber(h.value) / total) * 100 : 0;
        var name = h.name && h.name.trim() ? h.name.trim() : 'Unnamed holding';
        return '' +
          '<li>' +
            '<div class="tool-breakdown-top">' +
              '<span class="tool-breakdown-name">' + name + ' <span class="tool-tag good">' + LABELS[h.category] + '</span></span>' +
              '<span class="tool-breakdown-figures">' + toolFormatCurrency(toolParseNumber(h.value)) + ' (' + toolFormatPercent(pct, 0) + ')</span>' +
            '</div>' +
          '</li>';
      }).join('');

    var namedHoldings = holdings.filter(function (h) { return toolParseNumber(h.value) > 0; });
    var summary = namedHoldings.map(function (h) {
      var pct = total > 0 ? (toolParseNumber(h.value) / total) * 100 : 0;
      var name = h.name && h.name.trim() ? h.name.trim() : 'Unnamed holding';
      return { label: name + ' (' + LABELS[h.category] + ')', value: toolFormatCurrency(toolParseNumber(h.value)) + ' (' + toolFormatPercent(pct, 0) + ')' };
    });
    summary.unshift({ label: 'Risk profile', value: risk.label });
    lastResult = {
      headline: { label: 'Portfolio Value', value: toolFormatCurrency(total) },
      summary: summary.length > 1 ? summary : summary.concat([{ label: 'Holdings', value: 'None entered yet' }]),
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
      (holdingRows ? '<p class="tool-breakdown-group-label">Your holdings</p><ul class="tool-breakdown">' + holdingRows + '</ul>' : '') +
      '<p class="tool-note">' + gapNote + ' Target mix and expected returns (equities 8%, bonds 4%, cash 2%, other 5%) are long-run rule-of-thumb assumptions, not a projection or guarantee. Actual returns vary and your right mix depends on your full financial picture.</p>' +
      toolResultsActionsHtml('adv-investment') +
      '<div class="tool-spreadsheet">' +
        '<p class="first-p">Prefer a spreadsheet? Download an editable copy of what you entered.</p>' +
        '<button type="button" class="download-button" id="adv-investment-download">Download CSV</button>' +
      '</div>' +
      '<div class="tool-next-steps">' +
        '<a href="../../index.html?start=health-score">Check your Financial Health Score</a>' +
        '<a href="../../contact.html">Talk to an advisor</a>' +
      '</div>';
    actions.refresh();
  }

  listEl.addEventListener('input', function (e) {
    var row = e.target.closest('.tool-holding-row');
    if (!row) return;
    var h = holdings.find(function (x) { return x.id === Number(row.getAttribute('data-holding-id')); });
    if (!h) return;
    if (e.target.classList.contains('tool-holding-name')) h.name = e.target.value;
    if (e.target.classList.contains('tool-holding-value')) h.value = e.target.value;
    render();
  });

  listEl.addEventListener('change', function (e) {
    var row = e.target.closest('.tool-holding-row');
    if (!row) return;
    var h = holdings.find(function (x) { return x.id === Number(row.getAttribute('data-holding-id')); });
    if (!h) return;
    if (e.target.classList.contains('tool-holding-category')) {
      h.category = e.target.value;
      render();
    }
  });

  listEl.addEventListener('click', function (e) {
    if (!e.target.closest('.tool-holding-remove')) return;
    var row = e.target.closest('.tool-holding-row');
    var id = Number(row.getAttribute('data-holding-id'));
    holdings = holdings.filter(function (h) { return h.id !== id; });
    renderHoldingsInputs();
    render();
  });

  addBtn.addEventListener('click', function () {
    holdings.push({ id: nextId++, name: '', category: 'equities', value: '' });
    renderHoldingsInputs();
    render();
  });

  riskInputs.forEach(function (input) { input.addEventListener('change', render); });

  resultsEl.addEventListener('click', function (e) {
    if (!e.target.closest('#adv-investment-download')) return;
    toolDownloadCsv('advanced-investment-tool-results.csv', lastResult ? lastResult.summary : []);
  });

  var templateBtn = document.getElementById('adv-investment-template-download');
  if (templateBtn) {
    templateBtn.addEventListener('click', function () {
      toolDownloadCsv('advanced-investment-tool-template.csv', [
        { label: 'Holding name', value: '' },
        { label: 'Category (equities/bonds/cash/other)', value: '' },
        { label: 'Value', value: '' },
      ]);
    });
  }

  renderHoldingsInputs();
  render();
})();
