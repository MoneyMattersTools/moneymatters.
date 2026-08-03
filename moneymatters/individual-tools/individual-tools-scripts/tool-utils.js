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

// §28.2: shared "email me these results" / "save to my dashboard" widget
// for the native tools. Anonymous visitors get the email-only path (no
// account needed, matches how these tools have always worked); a session
// swaps it for a one-click save-and-email "Submit" action. The markup
// lives inside each tool's results panel, which gets its innerHTML fully
// replaced on every recalculation — so callers must call
// actions.refresh() at the end of their own render() to reapply the
// known login state each time, since the fresh HTML always starts from
// the anonymous-default markup.
function toolResultsActionsHtml(idPrefix) {
  return '' +
    '<div class="tool-results-actions">' +
      '<button type="button" class="tool-email-results-toggle" id="' + idPrefix + '-email-toggle">Email me these results</button>' +
      '<button type="button" class="tool-submit-dashboard-btn" id="' + idPrefix + '-submit-btn" hidden>Save to my dashboard</button>' +
      '<form class="tool-email-results-form" id="' + idPrefix + '-email-form" hidden novalidate>' +
        '<label for="' + idPrefix + '-email-input" class="sr-only">Email</label>' +
        '<input type="email" id="' + idPrefix + '-email-input" placeholder="you@example.com" autocomplete="email" required>' +
        '<button type="submit" id="' + idPrefix + '-email-submit">Send</button>' +
      '</form>' +
      '<p class="tool-email-results-status" id="' + idPrefix + '-status" hidden></p>' +
    '</div>';
}

function toolWireResultsActions(resultsEl, idPrefix, toolKey, toolLabel, getResult) {
  var isLoggedIn = false;

  function updateVisibility() {
    var toggle = document.getElementById(idPrefix + '-email-toggle');
    var submitBtn = document.getElementById(idPrefix + '-submit-btn');
    if (!toggle || !submitBtn) return;
    toggle.hidden = isLoggedIn;
    submitBtn.hidden = !isLoggedIn;
  }

  window.mmGetSession()
    .then(function (data) {
      isLoggedIn = !!(data && data.loggedIn);
      updateVisibility();
    })
    .catch(function () {});

  resultsEl.addEventListener('click', function (e) {
    if (e.target.closest('#' + idPrefix + '-email-toggle')) {
      var form = document.getElementById(idPrefix + '-email-form');
      form.hidden = !form.hidden;
      if (!form.hidden) document.getElementById(idPrefix + '-email-input').focus();
      return;
    }
    if (e.target.closest('#' + idPrefix + '-submit-btn')) {
      var result = getResult();
      var statusEl = document.getElementById(idPrefix + '-status');
      var submitBtn = document.getElementById(idPrefix + '-submit-btn');
      if (!result) return;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving…';
      fetch('/api/submit-tool-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: toolKey, headline: result.headline, summary: result.summary, inputs: result.inputs }),
      })
        .then(function (res) { return res.json().catch(function () { return {}; }); })
        .then(function (res) {
          if (!res.ok) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save to my dashboard';
            statusEl.textContent = 'Something went wrong. Please try again.';
            statusEl.hidden = false;
            return;
          }
          submitBtn.hidden = true;
          statusEl.textContent = 'Saved to your dashboard. Check your inbox for a copy.';
          statusEl.hidden = false;
          toolShowFeedbackWidget(resultsEl, toolKey);
        })
        .catch(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Save to my dashboard';
          statusEl.textContent = 'Something went wrong. Please try again.';
          statusEl.hidden = false;
        });
    }
  });

  resultsEl.addEventListener('submit', function (e) {
    var form = e.target.closest('#' + idPrefix + '-email-form');
    if (!form) return;
    e.preventDefault();
    var result = getResult();
    var input = document.getElementById(idPrefix + '-email-input');
    var statusEl = document.getElementById(idPrefix + '-status');
    var submitBtn = document.getElementById(idPrefix + '-email-submit');
    var email = input.value.trim();
    if (!email || !result) return;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    fetch('/api/email-tool-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, toolName: toolLabel, summary: result.summary }),
    })
      .then(function (res) { return res.json().catch(function () { return {}; }); })
      .then(function (res) {
        if (!res.ok) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send';
          statusEl.textContent = 'Something went wrong. Please try again.';
          statusEl.hidden = false;
          return;
        }
        form.hidden = true;
        statusEl.textContent = 'Sent. Check your inbox.';
        statusEl.hidden = false;
        toolShowFeedbackWidget(resultsEl, toolKey);
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send';
        statusEl.textContent = 'Something went wrong. Please try again.';
        statusEl.hidden = false;
      });
  });

  return { refresh: updateVisibility };
}

// §38.5: pre-fills a tool's input fields from that tool's previously-
// saved result, so a returning signed-in visitor can adjust specific
// numbers and re-submit instead of re-entering everything. Reads
// savedResult.inputs — a flat key->number map each tool saves alongside
// its display headline/summary specifically for this, since summary
// rows are display strings (some, like Budget's per-category line,
// compose several numbers into one string) and not safe to parse a
// single figure back out of in general. idToInput keys must match
// whatever keys that tool chose when it built `inputs` at save time.
// §38.9/§39.3: post-completion review widget — 1-5 stars plus an optional
// comment, specific to this tool. Deliberately NOT part of the results
// panel's own innerHTML (that panel gets fully replaced on every
// recalculation, per the file-level comment above toolResultsActionsHtml
// — a star rating living inside it would visibly reset every time the
// visitor tweaks an input after rating). Inserted once as a sibling
// right after the results panel instead, and only shown after a real
// "I'm done, I got value" signal (a successful save-to-dashboard or
// email-results submission), not on page load.
//
// §39.3 frequency rule: show on the 1st completion of a given tool, then
// every 5th one after that (not every single time) — tracked as a
// persistent per-tool count in localStorage (not sessionStorage: the
// count has to survive across visits/tab closes to mean anything, and
// this doesn't require an account the same way saving a result does, so
// there's no server-side place to keep it either). Dismissing the widget
// never counts as, or blocks, a future qualifying submission — it just
// closes this one instance; the same tool submitted a few more times
// will legitimately show it again at the next 1st/5th-multiple count.
function toolShowFeedbackWidget(resultsEl, toolKey) {
  var countKey = 'mm_tool_submit_count_' + toolKey;
  var count = 1;
  try {
    count = (parseInt(window.localStorage.getItem(countKey), 10) || 0) + 1;
    window.localStorage.setItem(countKey, String(count));
  } catch (e) {}
  if (count !== 1 && count % 5 !== 0) return;
  if (document.getElementById('mm-feedback-' + toolKey)) return;

  var widget = document.createElement('div');
  widget.className = 'tool-feedback-widget';
  widget.id = 'mm-feedback-' + toolKey;
  widget.innerHTML = '' +
    '<button type="button" class="tool-feedback-dismiss" aria-label="Dismiss">&times;</button>' +
    '<p class="tool-feedback-prompt">How useful was this?</p>' +
    '<div class="tool-feedback-stars" role="radiogroup" aria-label="Rating">' +
      [1, 2, 3, 4, 5].map(function (n) {
        return '<button type="button" class="tool-feedback-star" data-star="' + n + '" aria-label="' + n + ' star' + (n > 1 ? 's' : '') + '">&#9733;</button>';
      }).join('') +
    '</div>' +
    '<div class="tool-feedback-detail" hidden>' +
      '<label for="mm-feedback-comment-' + toolKey + '" class="sr-only">Optional comment</label>' +
      '<textarea id="mm-feedback-comment-' + toolKey + '" placeholder="Optional: anything you\'d add? (optional)" maxlength="600"></textarea>' +
      '<button type="button" class="tool-feedback-submit">Send feedback</button>' +
    '</div>' +
    '<p class="tool-feedback-thanks" hidden>Thanks for the feedback.</p>';

  resultsEl.parentElement.insertBefore(widget, resultsEl.nextSibling);

  var selectedRating = 0;
  var stars = widget.querySelectorAll('.tool-feedback-star');
  var detail = widget.querySelector('.tool-feedback-detail');
  var thanks = widget.querySelector('.tool-feedback-thanks');
  var submitBtn = widget.querySelector('.tool-feedback-submit');
  var commentEl = widget.querySelector('textarea');

  // Never forces a rating or comment — dismissing at any point (before or
  // after picking a star) just removes the widget, no submission, no
  // question asked.
  widget.querySelector('.tool-feedback-dismiss').addEventListener('click', function () {
    widget.remove();
  });

  function paintStars() {
    stars.forEach(function (star) {
      star.classList.toggle('is-selected', Number(star.dataset.star) <= selectedRating);
    });
  }

  stars.forEach(function (star) {
    star.addEventListener('click', function () {
      selectedRating = Number(star.dataset.star);
      paintStars();
      detail.hidden = false;
    });
  });

  submitBtn.addEventListener('click', function () {
    if (!selectedRating) return;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    fetch('/api/submit-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: toolKey, rating: selectedRating, comment: commentEl.value.trim() }),
    })
      .then(function (res) {
        // fetch() only rejects on a network failure — an HTTP error status
        // (e.g. a 500 while the tool_feedback migration is still pending,
        // see supabase/migrations/0003_add_tool_feedback.sql) resolves
        // just like a success does, so this has to check res.ok itself
        // rather than relying on .catch() to catch it.
        if (!res.ok) throw new Error('submit-feedback failed: ' + res.status);
        widget.querySelector('.tool-feedback-prompt').hidden = true;
        widget.querySelector('.tool-feedback-stars').hidden = true;
        detail.hidden = true;
        thanks.hidden = false;
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send feedback';
      });
  });
}

function toolPrefillFromSaved(savedResult, idToInput) {
  if (!savedResult || !savedResult.inputs || typeof savedResult.inputs !== 'object') return false;
  var filled = false;
  Object.keys(savedResult.inputs).forEach(function (key) {
    var input = idToInput[key];
    var value = savedResult.inputs[key];
    if (!input || typeof value !== 'number' || isNaN(value)) return;
    input.value = value;
    filled = true;
  });
  return filled;
}
