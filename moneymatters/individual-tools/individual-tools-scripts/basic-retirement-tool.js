// Retirement Planning Tool — native interactive calculator.
// "Still working" projects savings to a target retirement date (4% rule for the target nest egg).
// "Already retired" checks whether current savings sustain a fixed annual withdrawal.

(function () {
  var toggleButtons = document.querySelectorAll('.tool-toggle button');
  var workingPanel = document.getElementById('ret-working-fields');
  var retiredPanel = document.getElementById('ret-retired-fields');
  var resultsEl = document.getElementById('retirement-results');
  if (!toggleButtons.length || !resultsEl) return;

  var mode = 'working';

  var ids = [
    'ret-current-age', 'ret-retire-age', 'ret-income', 'ret-current-savings',
    'ret-monthly-contribution', 'ret-return', 'ret-wage-replacement', 'ret-years-in-retirement',
    'ret-retired-age', 'ret-life-expectancy', 'ret-retired-savings', 'ret-annual-spending', 'ret-retired-return',
  ];
  var el = {};
  ids.forEach(function (id) { el[id] = document.getElementById(id); });

  function val(id, fallback) {
    var n = toolParseNumber(el[id] ? el[id].value : '');
    return n > 0 ? n : fallback;
  }

  function renderWorking() {
    var currentAge = val('ret-current-age', 35);
    var retireAge = val('ret-retire-age', 65);
    var income = val('ret-income', 0);
    var currentSavings = toolParseNumber(el['ret-current-savings'] ? el['ret-current-savings'].value : 0);
    var monthlyContribution = toolParseNumber(el['ret-monthly-contribution'] ? el['ret-monthly-contribution'].value : 0);
    var r = val('ret-return', 7) / 100;
    var wageReplacement = val('ret-wage-replacement', 80) / 100;
    var t = Math.max(retireAge - currentAge, 0);

    var targetAnnualSpend = income * wageReplacement;
    var targetNestEgg = targetAnnualSpend / 0.04;
    var fvSavings = toolFutureValueLumpSum(currentSavings, r, t);
    var fvContributions = toolFutureValueMonthlyAnnuity(monthlyContribution, r, t);
    var projected = fvSavings + fvContributions;
    var gap = targetNestEgg - projected;

    var gapHtml;
    if (gap > 0) {
      var factor = toolFutureValueMonthlyAnnuity(1, r, t);
      var neededFromContributions = targetNestEgg - fvSavings;
      var pmtNeeded = factor > 0 ? neededFromContributions / factor : 0;
      var additionalMonthly = Math.max(0, pmtNeeded - monthlyContribution);
      gapHtml = '' +
        '<div class="tool-stat">' +
          '<span class="tool-stat-label">Projected Shortfall</span>' +
          '<div class="tool-stat-value is-negative">' + toolFormatCurrency(gap) + '</div>' +
          '<p class="tool-stat-sub">To close this by age ' + retireAge + ', increase monthly savings by about ' + toolFormatCurrency(additionalMonthly) + ' (' + toolFormatCurrency(additionalMonthly * 12) + '/yr).</p>' +
        '</div>';
    } else {
      gapHtml = '' +
        '<div class="tool-stat">' +
          '<span class="tool-stat-label">Projected Surplus</span>' +
          '<div class="tool-stat-value">' + toolFormatCurrency(-gap) + '</div>' +
          '<p class="tool-stat-sub">You are on track to exceed your target nest egg by age ' + retireAge + ' at this savings rate.</p>' +
        '</div>';
    }

    resultsEl.innerHTML = gapHtml +
      '<ul class="tool-breakdown">' +
        '<li><div class="tool-breakdown-top"><span class="tool-breakdown-name">Target nest egg</span><span class="tool-breakdown-figures">' + toolFormatCurrency(targetNestEgg) + '</span></div></li>' +
        '<li><div class="tool-breakdown-top"><span class="tool-breakdown-name">Projected savings at ' + retireAge + '</span><span class="tool-breakdown-figures">' + toolFormatCurrency(projected) + '</span></div></li>' +
        '<li><div class="tool-breakdown-top"><span class="tool-breakdown-name">Years until retirement</span><span class="tool-breakdown-figures">' + t + '</span></div></li>' +
      '</ul>' +
      '<p class="tool-note">Target nest egg uses the 4% rule: (current income &times; wage replacement ratio) &divide; 4%. Projected savings compounds your current balance and monthly contributions at the return rate entered. This does not account for Social Security, pensions, or other retirement income — those would reduce the savings you actually need.</p>' +
      '<div class="tool-next-steps">' +
        '<a href="../../index.html?start=health-score">Check your Financial Health Score</a>' +
        '<a href="../../contact.html">Talk to an advisor</a>' +
      '</div>';
  }

  function renderRetired() {
    var currentAge = val('ret-retired-age', 65);
    var lifeExpectancy = val('ret-life-expectancy', 90);
    var currentSavings = val('ret-retired-savings', 0);
    var annualSpending = val('ret-annual-spending', 0);
    var r = val('ret-retired-return', 5) / 100;
    var n = Math.max(lifeExpectancy - currentAge, 1);

    var requiredPrincipal = toolPresentValueAnnuity(annualSpending, r, n);
    var gap = requiredPrincipal - currentSavings;

    var gapHtml;
    if (gap > 0) {
      var sustainableSpending = r === 0 ? currentSavings / n : (currentSavings * r) / (1 - Math.pow(1 + r, -n));
      var reduction = Math.max(0, annualSpending - sustainableSpending);
      gapHtml = '' +
        '<div class="tool-stat">' +
          '<span class="tool-stat-label">Additional $ Needed</span>' +
          '<div class="tool-stat-value is-negative">' + toolFormatCurrency(gap) + '</div>' +
          '<p class="tool-stat-sub">To sustain savings through age ' + lifeExpectancy + ', reduce annual spending by about ' + toolFormatCurrency(reduction) + ' (' + toolFormatCurrency(reduction / 12) + '/mo) — or plan to supplement with other income.</p>' +
        '</div>';
    } else {
      gapHtml = '' +
        '<div class="tool-stat">' +
          '<span class="tool-stat-label">Projected Surplus</span>' +
          '<div class="tool-stat-value">' + toolFormatCurrency(-gap) + '</div>' +
          '<p class="tool-stat-sub">Your current savings are projected to cover this spending rate through age ' + lifeExpectancy + '.</p>' +
        '</div>';
    }

    resultsEl.innerHTML = gapHtml +
      '<ul class="tool-breakdown">' +
        '<li><div class="tool-breakdown-top"><span class="tool-breakdown-name">Savings needed to sustain spending</span><span class="tool-breakdown-figures">' + toolFormatCurrency(requiredPrincipal) + '</span></div></li>' +
        '<li><div class="tool-breakdown-top"><span class="tool-breakdown-name">Current savings</span><span class="tool-breakdown-figures">' + toolFormatCurrency(currentSavings) + '</span></div></li>' +
        '<li><div class="tool-breakdown-top"><span class="tool-breakdown-name">Years of retirement remaining</span><span class="tool-breakdown-figures">' + n + '</span></div></li>' +
      '</ul>' +
      '<p class="tool-note">Savings needed is the present value of your annual spending as a fixed withdrawal stream over your remaining years, at the return rate entered. This does not account for Social Security, pensions, inflation, or other income — those would reduce the savings you actually need.</p>' +
      '<div class="tool-next-steps">' +
        '<a href="../../index.html?start=health-score">Check your Financial Health Score</a>' +
        '<a href="../../contact.html">Talk to an advisor</a>' +
      '</div>';
  }

  function render() {
    if (mode === 'working') {
      renderWorking();
    } else {
      renderRetired();
    }
  }

  toggleButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      mode = btn.getAttribute('data-mode');
      toggleButtons.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      workingPanel.hidden = mode !== 'working';
      retiredPanel.hidden = mode !== 'retired';
      render();
    });
  });

  ids.forEach(function (id) {
    if (el[id]) toolDebounceInput(el[id], render);
  });

  render();
})();
