// Basic Budget Tool — native interactive calculator.
// Compares actual monthly spending against widely-used budgeting guideline percentages.

(function () {
  var CATEGORIES = [
    { key: 'housing', label: 'Housing', target: 28 },
    { key: 'transportation', label: 'Transportation', target: 15 },
    { key: 'food', label: 'Food', target: 12 },
    { key: 'utilities', label: 'Utilities', target: 8 },
    { key: 'insurance', label: 'Insurance', target: 10 },
    { key: 'savings', label: 'Savings & Debt Repayment', target: 20 },
    { key: 'other', label: 'Discretionary / Other', target: 7 },
  ];

  var incomeInput = document.getElementById('budget-income');
  var resultsEl = document.getElementById('budget-results');
  if (!incomeInput || !resultsEl) return;

  var inputs = {};
  CATEGORIES.forEach(function (cat) {
    inputs[cat.key] = document.getElementById('budget-' + cat.key);
  });

  function tagFor(diff, isSavings) {
    var flagged = isSavings ? -diff : diff;
    if (flagged <= 3) return { cls: 'good', text: 'On Track' };
    if (flagged <= 8) return { cls: 'caution', text: 'Watch' };
    return { cls: 'attention', text: isSavings ? 'Too Low' : 'Over Target' };
  }

  function render() {
    var income = toolParseNumber(incomeInput.value);
    var totalSpent = 0;
    var rows = '';

    CATEGORIES.forEach(function (cat) {
      var amount = toolParseNumber(inputs[cat.key] ? inputs[cat.key].value : 0);
      totalSpent += amount;
      var actualPct = income > 0 ? (amount / income) * 100 : 0;
      var diff = actualPct - cat.target;
      var tag = tagFor(diff, cat.key === 'savings');
      var barPct = toolClamp(actualPct, 0, 100);
      var targetPct = toolClamp(cat.target, 0, 100);
      var recommended = income > 0 ? (income * cat.target) / 100 : 0;

      rows += '' +
        '<li>' +
          '<div class="tool-breakdown-top">' +
            '<span class="tool-breakdown-name">' + cat.label + '</span>' +
            '<span class="tool-tag ' + tag.cls + '">' + tag.text + '</span>' +
          '</div>' +
          '<div class="tool-bar-track">' +
            '<div class="tool-bar-fill' + (diff > 8 && cat.key !== 'savings' ? ' is-over' : '') + '" style="width:' + barPct + '%"></div>' +
            '<div class="tool-bar-target" style="left:' + targetPct + '%"></div>' +
          '</div>' +
          '<div class="tool-breakdown-figures">' + toolFormatCurrency(amount) + ' actual (' + toolFormatPercent(actualPct, 1) + ') &middot; recommended ' + toolFormatCurrency(recommended) + ' (' + cat.target + '%)</div>' +
        '</li>';
    });

    var net = income - totalSpent;
    var netIsNegative = net < 0;

    resultsEl.innerHTML = '' +
      '<div class="tool-stat">' +
        '<span class="tool-stat-label">' + (netIsNegative ? 'Monthly Deficit' : 'Monthly Surplus') + '</span>' +
        '<div class="tool-stat-value' + (netIsNegative ? ' is-negative' : '') + '">' + toolFormatCurrency(net) + '</div>' +
        '<p class="tool-stat-sub">' + toolFormatCurrency(totalSpent) + ' spent of ' + toolFormatCurrency(income) + ' income entered.</p>' +
      '</div>' +
      '<ul class="tool-breakdown">' + rows + '</ul>' +
      '<p class="tool-note">Target percentages are a general budgeting guideline (28% housing, 15% transportation, 12% food, 8% utilities, 10% insurance, 20% savings/debt repayment, 7% discretionary), not personalized advice — your right mix depends on your city, family size, and goals. The recommended $ column is simply that target percentage applied to the income you entered.</p>' +
      '<div class="tool-next-steps">' +
        '<a href="../../index.html?start=health-score">Check your Financial Health Score</a>' +
        '<a href="../../contact.html">Talk to an advisor</a>' +
      '</div>';
  }

  incomeInput.addEventListener('input', render);
  CATEGORIES.forEach(function (cat) {
    if (inputs[cat.key]) toolDebounceInput(inputs[cat.key], render);
  });

  render();
})();
