// Advanced Budget Tool — native interactive calculator (MoneyMatters+).
// Splits spending into fixed vs. variable expenses and gives a personalized
// savings recommendation: how much variable spending needs to be to hit a
// 20% savings rate, given the fixed costs already committed.

(function () {
  var SAVINGS_GOAL_PCT = 20;

  var FIXED_CATEGORIES = [
    { key: 'housing', label: 'Housing (rent / mortgage)' },
    { key: 'insurance', label: 'Insurance' },
    { key: 'debt', label: 'Loan & debt payments' },
    { key: 'subscriptions', label: 'Subscriptions & memberships' },
    { key: 'otherfixed', label: 'Other fixed' },
  ];
  var VARIABLE_CATEGORIES = [
    { key: 'food', label: 'Food & groceries' },
    { key: 'transportation', label: 'Transportation' },
    { key: 'entertainment', label: 'Entertainment' },
    { key: 'shopping', label: 'Shopping' },
    { key: 'othervariable', label: 'Other variable' },
  ];

  var incomeInput = document.getElementById('adv-budget-income');
  var resultsEl = document.getElementById('adv-budget-results');
  if (!incomeInput || !resultsEl) return;

  var fixedInputs = {};
  FIXED_CATEGORIES.forEach(function (cat) {
    fixedInputs[cat.key] = document.getElementById('adv-budget-' + cat.key);
  });
  var variableInputs = {};
  VARIABLE_CATEGORIES.forEach(function (cat) {
    variableInputs[cat.key] = document.getElementById('adv-budget-' + cat.key);
  });

  function groupRows(categories, inputs, groupTotal) {
    return categories.map(function (cat) {
      var amount = toolParseNumber(inputs[cat.key] ? inputs[cat.key].value : 0);
      var pct = groupTotal > 0 ? (amount / groupTotal) * 100 : 0;
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
    var income = toolParseNumber(incomeInput.value);

    var fixedTotal = FIXED_CATEGORIES.reduce(function (sum, cat) {
      return sum + toolParseNumber(fixedInputs[cat.key] ? fixedInputs[cat.key].value : 0);
    }, 0);
    var variableTotal = VARIABLE_CATEGORIES.reduce(function (sum, cat) {
      return sum + toolParseNumber(variableInputs[cat.key] ? variableInputs[cat.key].value : 0);
    }, 0);
    var totalSpent = fixedTotal + variableTotal;
    var net = income - totalSpent;
    var netIsNegative = net < 0;

    var recommendedVariableCap = income * (1 - SAVINGS_GOAL_PCT / 100) - fixedTotal;
    var recommendationHtml;
    if (recommendedVariableCap < 0) {
      recommendationHtml = 'Your fixed expenses alone are ' + toolFormatCurrency(fixedTotal) + ', more than ' + (100 - SAVINGS_GOAL_PCT) + '% of your income. Hitting a ' + SAVINGS_GOAL_PCT + '% savings rate here means reducing a fixed commitment (housing, debt, or subscriptions) before variable spending can make the difference.';
    } else if (variableTotal > recommendedVariableCap) {
      recommendationHtml = 'To hit a ' + SAVINGS_GOAL_PCT + '% savings rate given your fixed costs, keep variable spending under ' + toolFormatCurrency(recommendedVariableCap) + '/mo &mdash; about ' + toolFormatCurrency(variableTotal - recommendedVariableCap) + ' less than you entered.';
    } else {
      recommendationHtml = 'At this fixed cost level, you can spend up to ' + toolFormatCurrency(recommendedVariableCap) + '/mo on variable expenses and still hit a ' + SAVINGS_GOAL_PCT + '% savings rate. You are within that.';
    }

    resultsEl.innerHTML = '' +
      '<div class="tool-stat">' +
        '<span class="tool-stat-label">' + (netIsNegative ? 'Monthly Deficit' : 'Monthly Surplus') + '</span>' +
        '<div class="tool-stat-value' + (netIsNegative ? ' is-negative' : '') + '">' + toolFormatCurrency(net) + '</div>' +
        '<p class="tool-stat-sub">' + toolFormatCurrency(totalSpent) + ' spent of ' + toolFormatCurrency(income) + ' income entered.</p>' +
      '</div>' +
      '<p class="tool-breakdown-group-label">Fixed: ' + toolFormatCurrency(fixedTotal) + ' (' + toolFormatPercent(income > 0 ? (fixedTotal / income) * 100 : 0, 0) + ' of income)</p>' +
      '<ul class="tool-breakdown">' + groupRows(FIXED_CATEGORIES, fixedInputs, fixedTotal) + '</ul>' +
      '<p class="tool-breakdown-group-label">Variable: ' + toolFormatCurrency(variableTotal) + ' (' + toolFormatPercent(income > 0 ? (variableTotal / income) * 100 : 0, 0) + ' of income)</p>' +
      '<ul class="tool-breakdown">' + groupRows(VARIABLE_CATEGORIES, variableInputs, variableTotal) + '</ul>' +
      '<p class="tool-note"><strong>Personalized recommendation:</strong> ' + recommendationHtml + ' This uses a ' + SAVINGS_GOAL_PCT + '% savings-rate target as a general guideline, not personalized advice. Your right number depends on your goals and timeline.</p>' +
      '<div class="tool-next-steps">' +
        '<a href="../../index.html?start=health-score">Check your Financial Health Score</a>' +
        '<a href="../../contact.html">Talk to an advisor</a>' +
      '</div>';
  }

  incomeInput.addEventListener('input', render);
  FIXED_CATEGORIES.concat(VARIABLE_CATEGORIES).forEach(function (cat) {
    var input = fixedInputs[cat.key] || variableInputs[cat.key];
    if (input) toolDebounceInput(input, render);
  });

  render();
})();
