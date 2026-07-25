// Net Worth Calculator — native interactive calculator.
// Totals what you own against what you owe.

(function () {
  var ASSET_CATEGORIES = [
    { key: 'cash', label: 'Cash & savings' },
    { key: 'investments', label: 'Investment accounts' },
    { key: 'retirement', label: 'Retirement accounts' },
    { key: 'realestate', label: 'Real estate' },
    { key: 'vehicles', label: 'Vehicles' },
    { key: 'otherassets', label: 'Other assets' },
  ];

  var LIABILITY_CATEGORIES = [
    { key: 'mortgage', label: 'Mortgage balance' },
    { key: 'auto', label: 'Auto loans' },
    { key: 'student', label: 'Student loans' },
    { key: 'creditcard', label: 'Credit card debt' },
    { key: 'otherdebt', label: 'Other debt' },
  ];

  var resultsEl = document.getElementById('networth-results');
  if (!resultsEl) return;

  var assetInputs = {};
  ASSET_CATEGORIES.forEach(function (cat) {
    assetInputs[cat.key] = document.getElementById('networth-asset-' + cat.key);
  });
  var liabilityInputs = {};
  LIABILITY_CATEGORIES.forEach(function (cat) {
    liabilityInputs[cat.key] = document.getElementById('networth-liability-' + cat.key);
  });

  function breakdownRows(categories, inputs, total) {
    return categories.map(function (cat) {
      var amount = toolParseNumber(inputs[cat.key] ? inputs[cat.key].value : 0);
      var pct = total > 0 ? (amount / total) * 100 : 0;
      return '' +
        '<li>' +
          '<div class="tool-breakdown-top">' +
            '<span class="tool-breakdown-name">' + cat.label + '</span>' +
            '<span class="tool-breakdown-figures">' + toolFormatCurrency(amount) + '</span>' +
          '</div>' +
          '<div class="tool-bar-track">' +
            '<div class="tool-bar-fill" style="width:' + toolClamp(pct, 0, 100) + '%"></div>' +
          '</div>' +
        '</li>';
    }).join('');
  }

  function render() {
    var totalAssets = ASSET_CATEGORIES.reduce(function (sum, cat) {
      return sum + toolParseNumber(assetInputs[cat.key] ? assetInputs[cat.key].value : 0);
    }, 0);
    var totalLiabilities = LIABILITY_CATEGORIES.reduce(function (sum, cat) {
      return sum + toolParseNumber(liabilityInputs[cat.key] ? liabilityInputs[cat.key].value : 0);
    }, 0);
    var netWorth = totalAssets - totalLiabilities;
    var isNegative = netWorth < 0;

    resultsEl.innerHTML = '' +
      '<div class="tool-stat">' +
        '<span class="tool-stat-label">Net Worth</span>' +
        '<div class="tool-stat-value' + (isNegative ? ' is-negative' : '') + '">' + toolFormatCurrency(netWorth) + '</div>' +
        '<p class="tool-stat-sub">' + toolFormatCurrency(totalAssets) + ' in assets &minus; ' + toolFormatCurrency(totalLiabilities) + ' in liabilities.</p>' +
      '</div>' +
      '<p class="tool-breakdown-group-label">Assets — ' + toolFormatCurrency(totalAssets) + '</p>' +
      '<ul class="tool-breakdown">' + breakdownRows(ASSET_CATEGORIES, assetInputs, totalAssets) + '</ul>' +
      '<p class="tool-breakdown-group-label">Liabilities — ' + toolFormatCurrency(totalLiabilities) + '</p>' +
      '<ul class="tool-breakdown">' + breakdownRows(LIABILITY_CATEGORIES, liabilityInputs, totalLiabilities) + '</ul>' +
      '<div class="tool-next-steps">' +
        '<a href="../../index.html?start=health-score">Check your Financial Health Score</a>' +
        '<a href="../../connect-with-advisor.html">Talk to an advisor</a>' +
      '</div>';
  }

  ASSET_CATEGORIES.forEach(function (cat) {
    if (assetInputs[cat.key]) toolDebounceInput(assetInputs[cat.key], render);
  });
  LIABILITY_CATEGORIES.forEach(function (cat) {
    if (liabilityInputs[cat.key]) toolDebounceInput(liabilityInputs[cat.key], render);
  });

  render();
})();
