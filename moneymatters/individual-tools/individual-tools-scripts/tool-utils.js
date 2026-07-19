// Shared helpers for the native interactive tool pages (budget/retirement/investment).

function toolFormatCurrency(value, opts) {
  var maximumFractionDigits = (opts && opts.decimals) || 0;
  var sign = value < 0 ? '-' : '';
  var formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: maximumFractionDigits,
  }).format(Math.abs(value || 0));
  return sign + formatted;
}

function toolFormatPercent(value, decimals) {
  var d = decimals === undefined ? 0 : decimals;
  return (value || 0).toFixed(d) + '%';
}

function toolParseNumber(input) {
  var n = parseFloat(String(input || '').replace(/,/g, ''));
  return isNaN(n) || n < 0 ? 0 : n;
}

function toolClamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Future value of a lump sum compounded annually.
function toolFutureValueLumpSum(principal, annualRate, years) {
  return principal * Math.pow(1 + annualRate, years);
}

// Future value of an ordinary annuity of monthly contributions, compounded monthly.
function toolFutureValueMonthlyAnnuity(monthlyPayment, annualRate, years) {
  var months = years * 12;
  var monthlyRate = annualRate / 12;
  if (monthlyRate === 0) return monthlyPayment * months;
  return monthlyPayment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
}

// Present value of an ordinary annuity (used to size a retirement nest egg for a fixed payout stream).
function toolPresentValueAnnuity(annualPayment, annualRate, years) {
  if (annualRate === 0) return annualPayment * years;
  return annualPayment * ((1 - Math.pow(1 + annualRate, -years)) / annualRate);
}

function toolDebounceInput(el, handler) {
  el.addEventListener('input', handler);
  el.addEventListener('change', handler);
}
