// §27.3: interactive fee-comparison slider on the MoneyMatters+ page —
// drag your own portfolio size to see the 1% advisor fee scale, while the
// flat $60/year MM+ cost stays put. Replaces the previous static example.
(function () {
  var input = document.getElementById('fee-slider-input');
  var valueLabel = document.getElementById('fee-slider-value');
  var advisorValue = document.getElementById('fee-slider-advisor-value');
  var fill = document.getElementById('fee-slider-fill');
  if (!input || !valueLabel || !advisorValue || !fill) return;

  var MAX_PORTFOLIO = Number(input.max) || 500000;
  var MAX_FEE = MAX_PORTFOLIO * 0.01;

  function formatCurrency(value) {
    return '$' + Math.round(value).toLocaleString('en-US');
  }

  function render() {
    var portfolio = Number(input.value);
    var fee = portfolio * 0.01;
    valueLabel.textContent = formatCurrency(portfolio);
    advisorValue.textContent = formatCurrency(fee) + ' every year';
    var pct = 8 + (fee / MAX_FEE) * 92;
    fill.style.width = pct + '%';
  }

  input.addEventListener('input', render);
  render();
})();
