(function () {
  var heroRoot = document.getElementById('diagnostic-hero');
  if (!heroRoot) return;

  var SOURCE_MAX_LENGTH = 120;

  // Traffic-source attribution (SITE_STRATEGY.md "Round 2 additions",
  // locked 2026-08-05) — captured once, at the moment someone actually
  // completes and submits the diagnostic, not on every pageview. Prefers
  // UTM params (real campaign intent) over referrer (which only tells you
  // the previous page, not why they clicked).
  function captureAttributionSource() {
    try {
      var params = new URLSearchParams(window.location.search);
      var utmSource = params.get('utm_source');
      if (utmSource) {
        var utmMedium = params.get('utm_medium');
        return ('utm:' + utmSource + (utmMedium ? '/' + utmMedium : '')).slice(0, SOURCE_MAX_LENGTH);
      }
      if (document.referrer) {
        var referrerHost = new URL(document.referrer).hostname.replace(/^www\./, '');
        if (referrerHost && referrerHost !== window.location.hostname) {
          return ('referrer:' + referrerHost).slice(0, SOURCE_MAX_LENGTH);
        }
      }
      return 'direct';
    } catch (e) {
      return 'direct';
    }
  }

  var QUESTIONS = [
    {
      id: 'q1',
      text: 'If your income stopped today, how many months could your savings cover?',
      options: [
        { value: 'a', label: "None — I don't have savings I can get to quickly" },
        { value: 'b', label: 'About 1 month' },
        { value: 'c', label: '3–5 months' },
        { value: 'd', label: '6+ months' },
      ],
    },
    {
      id: 'q2',
      text: 'Outside a mortgage, how does your debt feel right now?',
      options: [
        { value: 'a', label: 'More than I could pay off in 5 years at this pace' },
        { value: 'b', label: "A meaningful amount, but I'm paying it down steadily" },
        { value: 'c', label: 'A small, manageable amount' },
        { value: 'd', label: 'No non-mortgage debt' },
      ],
    },
    {
      id: 'q3',
      text: 'Do you know where your money actually goes each month?',
      options: [
        { value: 'a', label: 'Not really' },
        { value: 'b', label: 'I have a rough idea' },
        { value: 'c', label: 'I check in periodically' },
        { value: 'd', label: 'I track it closely' },
      ],
    },
    {
      id: 'q4',
      text: 'How much of what you earn actually stays yours?',
      options: [
        { value: 'a', label: "I'm not saving anything right now" },
        { value: 'b', label: 'Less than 5%' },
        { value: 'c', label: '5–15%' },
        { value: 'd', label: '15% or more' },
      ],
    },
    {
      id: 'q5',
      text: 'Are you contributing to a retirement account (401(k), IRA, etc.)?',
      options: [
        { value: 'a', label: "No, I'm not contributing" },
        { value: 'b', label: 'A little, inconsistently' },
        { value: 'c', label: "Regularly, but not sure it's enough" },
        { value: 'd', label: 'Regularly, and I feel on track' },
      ],
    },
    {
      id: 'q6',
      text: 'If something went wrong tomorrow, how protected would you feel?',
      options: [
        { value: 'a', label: 'Not at all' },
        { value: 'b', label: 'Somewhat' },
        { value: 'c', label: 'Reasonably' },
        { value: 'd', label: 'Well' },
      ],
    },
    {
      id: 'q7',
      text: 'How clear are you on your financial goals?',
      options: [
        { value: 'a', label: 'Not clear at all' },
        { value: 'b', label: 'I have a vague sense' },
        { value: 'c', label: "I have specific goals, haven't checked progress" },
        { value: 'd', label: 'Clear goals, and I check progress regularly' },
      ],
    },
  ];

  var BAND_COPY = {
    'Starting Point': {
      body: "You're at the beginning, and that's a real place to start from. Right now, the basics (an emergency fund, a handle on debt, knowing where your money goes) need the most attention.",
    },
    'Needs Work': {
      body: 'You are managing the basics, but a few gaps are costing you more than you think.',
    },
    'Solid Ground': {
      body: "You've built real habits that are working. A few targeted moves would tighten up the rest.",
    },
    Thriving: {
      body: "You're in strong shape across the board. From here, it's about optimizing and protecting what you've built.",
    },
  };

  var BAND_SLUG = {
    'Starting Point': 'starting',
    'Needs Work': 'needs-work',
    'Solid Ground': 'solid',
    Thriving: 'thriving',
  };

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var state = {
    email: '',
    answers: {},
    questionIndex: 0,
  };

  var steps = heroRoot.querySelectorAll('.hero-step');
  var heroVisual = document.getElementById('hero-visual');
  // Skips focus-management on the very first setStep() call (the page's
  // initial state, resolved from session/URL before the user has done
  // anything) so it doesn't fight the site-wide onboarding gate for focus —
  // the gate runs its own independent /api/session check and may still be
  // settling into its modal at that moment. Every later, user-driven step
  // change focuses the new panel's heading.
  var hasSetStepOnce = false;

  function focusStepHeading(name) {
    var panel = heroRoot.querySelector('.hero-step[data-step="' + name + '"]');
    if (!panel) return;
    var heading = panel.querySelector('h1, h2');
    var target = heading || panel;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus();
  }

  function setStep(name) {
    heroRoot.dataset.activeStep = name;
    steps.forEach(function (el) {
      if (el.getAttribute('data-step') === name) {
        el.removeAttribute('hidden');
      } else {
        el.setAttribute('hidden', '');
      }
    });
    if (hasSetStepOnce) focusStepHeading(name);
    hasSetStepOnce = true;
  }

  function el(id) {
    return document.getElementById(id);
  }

  // §37.6: a fresh (not-yet-logged-in) advisor-connect visitor still has to
  // go email → quiz → verify-link before an account exists at all — that
  // round trip through their inbox is a full page reload, so the "I came
  // here for advisor matching" intent can't live in a JS variable.
  // localStorage survives it (including opening the magic link in a new
  // tab). Scoped at module level (not inside init()) because it also has
  // to be cleared from the plain choice-screen button below, which isn't
  // part of the advisor-connect path at all — without that, a visitor who
  // starts the advisor-connect flow, abandons it, then runs an unrelated
  // diagnostic or sign-in within the TTL window gets misrouted into the
  // advisor checklist (caught live in §37 verification).
  var ADVISOR_INTENT_KEY = 'mm_advisor_connect_intent';
  var ADVISOR_INTENT_TTL_MS = 30 * 60 * 1000;
  function rememberAdvisorIntent() {
    try { window.localStorage.setItem(ADVISOR_INTENT_KEY, String(Date.now())); } catch (e) {}
  }
  function clearAdvisorIntent() {
    try { window.localStorage.removeItem(ADVISOR_INTENT_KEY); } catch (e) {}
  }
  function consumeAdvisorIntent() {
    try {
      var raw = window.localStorage.getItem(ADVISOR_INTENT_KEY);
      window.localStorage.removeItem(ADVISOR_INTENT_KEY);
      return !!raw && (Date.now() - parseInt(raw, 10)) < ADVISOR_INTENT_TTL_MS;
    } catch (e) {
      return false;
    }
  }

  // --- choice step ---
  var startBtn = el('start-health-score');
  if (startBtn) {
    startBtn.addEventListener('click', function () {
      clearAdvisorIntent();
      setStep('email');
      var input = el('diagnostic-email');
      if (input) input.focus();
    });
  }

  heroRoot.querySelectorAll('[data-back]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setStep(btn.getAttribute('data-back'));
    });
  });

  // --- email step ---
  var emailForm = el('diagnostic-email-form');
  if (emailForm) {
    emailForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = el('diagnostic-email');
      var errorEl = el('email-error');
      var value = (input.value || '').trim();
      if (!EMAIL_RE.test(value)) {
        errorEl.textContent = 'Enter a valid email address.';
        errorEl.hidden = false;
        return;
      }
      errorEl.hidden = true;
      state.email = value;
      state.questionIndex = 0;
      renderQuestion();
      setStep('quiz');
    });
  }

  // --- quiz step ---
  var quizBackBtn = el('quiz-back');
  if (quizBackBtn) {
    quizBackBtn.addEventListener('click', function () {
      if (state.questionIndex > 0) {
        state.questionIndex -= 1;
        renderQuestion();
      } else {
        setStep('email');
      }
    });
  }

  function renderQuestion() {
    var q = QUESTIONS[state.questionIndex];
    el('quiz-progress-label').textContent = 'Question ' + (state.questionIndex + 1) + ' of ' + QUESTIONS.length;
    el('quiz-progress-fill').style.width = Math.round(((state.questionIndex + 1) / QUESTIONS.length) * 100) + '%';
    el('quiz-question-text').textContent = q.text;
    el('quiz-error').hidden = true;

    var answersEl = el('quiz-answers');
    answersEl.innerHTML = '';
    q.options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-answer-btn';
      btn.textContent = opt.label;
      if (state.answers[q.id] === opt.value) btn.classList.add('is-selected');
      btn.addEventListener('click', function () {
        state.answers[q.id] = opt.value;
        if (state.questionIndex < QUESTIONS.length - 1) {
          state.questionIndex += 1;
          renderQuestion();
        } else {
          submitDiagnostic();
        }
      });
      answersEl.appendChild(btn);
    });
    // renderQuestion() rebuilds the answer list on every click, which
    // destroys the button the user just activated — move focus to the
    // (already-updated) question heading so keyboard focus doesn't get
    // stranded on a removed element, and so aria-live announces the change.
    el('quiz-question-text').focus();
  }

  function submitDiagnostic() {
    var errorEl = el('quiz-error');
    errorEl.hidden = true;
    fetch('/api/submit-diagnostic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: state.email, answers: state.answers, source: captureAttributionSource() }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok && data.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok) {
          errorEl.textContent = "Something went wrong sending your results. Please try again.";
          errorEl.hidden = false;
          return;
        }
        el('verify-email-display').textContent = state.email;
        setStep('verify');
      })
      .catch(function () {
        errorEl.textContent = "Something went wrong sending your results. Please try again.";
        errorEl.hidden = false;
      });
  }

  // --- advisor review intake (§17.2) ---
  var advisorCta = el('advisor-review-cta');
  var advisorConfirm = el('advisor-intake-confirm');

  // §37.6: shared by the manual "Review with an advisor" click below and
  // by init()'s ?start=advisor-connect handling, so a visitor who arrived
  // specifically to connect with an advisor lands on this step directly
  // instead of needing to notice and click the button themselves.
  function openAdvisorIntake() {
    // Reset in case this is a re-open after an earlier submit in the same
    // session — otherwise the panel would show the confirmation message
    // under a heading that still reads "What should your advisor know?".
    advisorForm.reset();
    advisorForm.hidden = false;
    advisorConfirm.hidden = true;
    if (netWorthWrap) netWorthWrap.hidden = true;
    setStep('advisor-intake');
  }

  if (advisorCta) {
    advisorCta.addEventListener('click', openAdvisorIntake);
  }

  // §21.2: separate, off-by-default opt-in for sharing the Financial
  // Health Score + Net Worth specifically — distinct from the situational
  // checklist above, which is about the user's goals, not their figures.
  var shareScoresCheckbox = el('advisor-intake-share-scores');
  var netWorthWrap = el('advisor-intake-networth-wrap');
  if (shareScoresCheckbox && netWorthWrap) {
    shareScoresCheckbox.addEventListener('change', function () {
      netWorthWrap.hidden = !shareScoresCheckbox.checked;
    });
  }

  var advisorForm = el('advisor-intake-form');
  if (advisorForm) {
    advisorForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var errorEl = el('advisor-intake-error');
      errorEl.hidden = true;
      var situational = Array.prototype.map.call(
        advisorForm.querySelectorAll('input[name="situational"]:checked'),
        function (input) { return input.value; }
      );
      var location = el('advisor-intake-location-input').value.trim();
      var details = el('advisor-intake-freetext-input').value.trim();
      var shareScores = !!(shareScoresCheckbox && shareScoresCheckbox.checked);
      var netWorthRangeRaw = el('advisor-intake-networth-input').value;
      var netWorthRange = shareScores && netWorthRangeRaw ? netWorthRangeRaw : null;
      var creditScoreRangeRaw = el('advisor-intake-credit-input').value;
      var creditScoreRange = shareScores && creditScoreRangeRaw ? creditScoreRangeRaw : null;
      var householdIncomeRangeRaw = el('advisor-intake-income-input').value;
      var householdIncomeRange = shareScores && householdIncomeRangeRaw ? householdIncomeRangeRaw : null;
      var urgencyChecked = advisorForm.querySelector('input[name="urgency"]:checked');
      var urgency = urgencyChecked ? urgencyChecked.value : null;
      var submitBtn = el('advisor-intake-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      fetch('/api/request-advisor-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situational: situational,
          location: location,
          details: details,
          shareScores: shareScores,
          netWorthRange: netWorthRange,
          creditScoreRange: creditScoreRange,
          householdIncomeRange: householdIncomeRange,
          urgency: urgency,
        }),
      })
        .then(function (res) { return res.json().catch(function () { return {}; }); })
        .then(function (result) {
          if (!result.ok) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send to our team';
            errorEl.textContent = 'Something went wrong. Please try again.';
            errorEl.hidden = false;
            return;
          }
          advisorForm.hidden = true;
          advisorConfirm.hidden = false;
          var confirmHeading = advisorConfirm.querySelector('p');
          if (confirmHeading) {
            confirmHeading.setAttribute('tabindex', '-1');
            confirmHeading.focus();
          }
        })
        .catch(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send to our team';
          errorEl.textContent = 'Something went wrong. Please try again.';
          errorEl.hidden = false;
        });
    });
  }

  // --- results rendering ---
  function animateScore(target) {
    var numberEl = el('score-number');
    var start = 0;
    var duration = 1200;
    var startTime = null;
    function frame(ts) {
      if (startTime === null) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      numberEl.textContent = Math.round(start + (target - start) * eased);
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // §45.3 root cause: renderResults() runs on every path that ever shows
  // the results step, not just a genuine fresh submission — a returning,
  // already-scored visitor whose session cookie is still valid hits it on
  // a plain homepage load (see the window.mmGetSession() branch below),
  // and a "log me in" magic link (verify-token purpose: 'returning_login')
  // hits it too, neither of which involved answering anything just now.
  // The feedback widget belongs only to the actual "just submitted"
  // moment, so it now requires an explicit opt-in per call site instead
  // of firing unconditionally.
  function renderResults(score, band, options) {
    var copy = BAND_COPY[band] || BAND_COPY['Needs Work'];
    el('score-band').textContent = band;
    el('score-copy').textContent = copy.body;
    animateScore(score);

    if (heroVisual) {
      Object.keys(BAND_SLUG).forEach(function (key) {
        heroVisual.classList.remove('hero-visual--band-' + BAND_SLUG[key]);
      });
      heroVisual.classList.add('hero-visual--band-' + (BAND_SLUG[band] || 'needs-work'));
    }

    setStep('results');

    // §38.9: post-quiz review widget, shared with the native tool pages
    // (individual-tools-scripts/tool-utils.js). Anchored right after the
    // "Explore all tools" links so it reads as part of the score panel,
    // not the separate dashboard beside it.
    var isFreshSubmission = !!(options && options.freshSubmission);
    if (isFreshSubmission && typeof toolShowFeedbackWidget === 'function') {
      var nextStepsEl = heroRoot.querySelector('[data-step="results"] .next-steps');
      if (nextStepsEl) toolShowFeedbackWidget(nextStepsEl, 'diagnostic');
    }
  }

  // --- dashboard (§28.1-4): purely additive to the score panel above,
  // not a redesign of it. Renders whichever tool results the user has
  // submitted, empty-state prompts for the rest, advisor status if any,
  // and a bonus combined-analysis panel for Plus accounts.
  var DASHBOARD_TOOLS = [
    { key: 'networth', label: 'Net Worth', href: 'individual-tools/basic-tools/net-worth-calculator.html' },
    { key: 'budget', label: 'Budget', href: 'individual-tools/basic-tools/basic-budget-tool.html' },
    { key: 'retirement', label: 'Retirement', href: 'individual-tools/basic-tools/basic-retirement-tool.html' },
    { key: 'investment', label: 'Investment', href: 'individual-tools/basic-tools/basic-investment-tool.html' },
    // Plus-only — matches the advanced tools' own access gate; a free
    // visitor would otherwise see a card linking to a tool they can't use.
    { key: 'advBudget', label: 'Advanced Budget', href: 'individual-tools/advanced-tools/advanced-budget-tool.html', plusOnly: true },
    { key: 'advInvestment', label: 'Advanced Investment', href: 'individual-tools/advanced-tools/advanced-investment-tool.html', plusOnly: true },
  ];

  // §29.7: one-time popup on real account creation (not on every login),
  // framed around a running community counter — doubles as a lightweight
  // growth-tracking proxy. Reuses .mm-gate-* modal chrome so it matches
  // the sign-in/onboarding modals exactly, no new chrome needed.
  function showFirstAccountPopup(count) {
    var overlay = document.createElement('div');
    overlay.className = 'mm-gate-overlay';
    var countText = typeof count === 'number' && count > 0
      ? 'You’re one of ' + count.toLocaleString('en-US') + ' people building this with us so far.'
      : 'Glad to have you here.';
    overlay.innerHTML =
      '<div class="mm-gate-modal mm-welcome-modal" role="dialog" aria-modal="true" aria-labelledby="mm-welcome-heading" tabindex="-1">' +
        '<h2 id="mm-welcome-heading">Welcome to MoneyMatters.</h2>' +
        '<p class="mm-welcome-sub">Building the MoneyMatters community, one story at a time.</p>' +
        '<p class="mm-welcome-count">' + countText + '</p>' +
        '<button type="button" class="mm-gate-skip" id="mm-welcome-close">Continue</button>' +
      '</div>';
    document.body.appendChild(overlay);
    document.documentElement.classList.add('mm-gate-open');

    function close() {
      document.documentElement.classList.remove('mm-gate-open');
      overlay.remove();
    }
    document.getElementById('mm-welcome-close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
  }

  // §44: the card value's size must scale to its actual content, not use
  // one static font-size tuned to a single example figure — that was the
  // same category of bug as §41's fixed-width overlap (a fix verified
  // against one case, not the general case). Shrinks from a max down to a
  // min, in whole pixels, until the value's natural single-line width fits
  // the space actually available inside the card — correct for $0 through
  // a 9-digit figure ($999,999,999) and for whatever a Budget/Retirement/
  // Investment headline value happens to be, not just Net Worth.
  var CARD_VALUE_MAX_FONT = 36;
  var CARD_VALUE_MIN_FONT = 15;

  function fitDashboardCardValues() {
    var dashEl = el('mm-dashboard');
    if (!dashEl) return;
    var values = dashEl.querySelectorAll('.mm-dashboard-card-value');
    Array.prototype.forEach.call(values, function (valueEl) {
      var available = valueEl.clientWidth;
      if (!available) return;
      var fontSize = CARD_VALUE_MAX_FONT;
      valueEl.style.fontSize = fontSize + 'px';
      while (valueEl.scrollWidth > available && fontSize > CARD_VALUE_MIN_FONT) {
        fontSize -= 1;
        valueEl.style.fontSize = fontSize + 'px';
      }
    });
  }

  var fitDashboardResizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(fitDashboardResizeTimer);
    fitDashboardResizeTimer = setTimeout(fitDashboardCardValues, 150);
  });

  function renderDashboard(data) {
    var dashEl = el('mm-dashboard');
    if (!dashEl) return;
    var tools = data.tools || {};

    var cardsHtml = DASHBOARD_TOOLS.filter(function (tool) {
      return !tool.plusOnly || data.plan === 'plus';
    }).map(function (tool) {
      var result = tools[tool.key];
      if (result && result.headline) {
        // §40.1: the sub-label is only useful when it clarifies what the
        // figure actually means (Budget's "Monthly Surplus", Retirement's
        // "Projected Shortfall") — Net Worth's headline label is just
        // "Net Worth" again, identical to the card's own "NET WORTH"
        // header right above it, and was also the thing physically
        // overlapping the MM+ Overview panel next to it. Redundant text
        // doesn't need to exist just because it happens to also collide.
        var subHtml = result.headline.label !== tool.label
          ? '<span class="mm-dashboard-card-sub">' + result.headline.label + '</span>'
          : '';
        return (
          '<a class="mm-dashboard-card" href="' + tool.href + '">' +
            '<span class="mm-dashboard-card-label">' + tool.label + '</span>' +
            '<span class="mm-dashboard-card-value">' + result.headline.value + '</span>' +
            subHtml +
          '</a>'
        );
      }
      return (
        '<a class="mm-dashboard-card mm-dashboard-card--empty" href="' + tool.href + '">' +
          '<span class="mm-dashboard-card-label">' + tool.label + '</span>' +
          '<span class="mm-dashboard-card-cta">Add your numbers →</span>' +
        '</a>'
      );
    }).join('');

    var advisorHtml = '';
    if (data.advisorStatus) {
      advisorHtml = '<p class="mm-dashboard-advisor">Advisor status: <strong>' + data.advisorStatus + '</strong></p>';
    }

    // §37.5: placeholder only for now — advisor call booking, Plus call
    // sign-ups, team messages, and new-tool links land in a later round.
    // No snapshot numbers here; those already live in the cards above.
    var plusHtml = '';
    if (data.plan === 'plus') {
      // §42.2: apply directly from data already in hand rather than
      // relying on plus-nav-logo.js's own session check, which caches its
      // result at page load — on a fresh magic-link arrival that resolves
      // before this verify completes, so it would never see the plan
      // change within the same page load otherwise.
      if (typeof window.mmApplyPlusNavLogo === 'function') window.mmApplyPlusNavLogo();
      plusHtml =
        '<div class="mm-dashboard-plus">' +
          '<span class="mm-dashboard-plus-badge">MM+ overview</span>' +
          '<p class="mm-dashboard-plus-soon">Coming Soon!</p>' +
        '</div>';
    }

    dashEl.innerHTML =
      '<h3 class="mm-dashboard-heading">Your Financial Snapshot</h3>' +
      '<div class="mm-dashboard-row">' +
        '<div class="mm-dashboard-grid">' + cardsHtml + '</div>' +
        plusHtml +
      '</div>' +
      advisorHtml;
    dashEl.hidden = false;
    fitDashboardCardValues();
  }

  function renderVerifyError(reason) {
    var messages = {
      expired: 'That link has expired. Start over below and we will send a fresh one.',
      already_used: 'That link has already been used. Start over below and we will send a fresh one.',
      invalid: "That link isn't valid. Start over below and we will send a fresh one.",
      server_error: 'Something went wrong on our end. Please try again in a moment.',
    };
    el('verify-error-message').textContent = messages[reason] || messages.invalid;
    setStep('verify-error');
  }

  // --- init: handle magic-link return, or check existing session ---
  function init() {
    var params = new URLSearchParams(window.location.search);
    var token = params.get('verify');
    var startParam = params.get('start');

    function stripStartParam() {
      var url = new URL(window.location.href);
      url.searchParams.delete('start');
      window.history.replaceState({}, '', url.toString());
    }

    // §33.26: the Advisor Connect page's CTA skips straight past the
    // choice step into email capture, same as ?start=health-score — but
    // it should read as its own entry point ("connect me with an
    // advisor"), not the generic Financial Health Score framing, since
    // that's what actually earns the click from that page.
    function applyAdvisorFraming() {
      var emailStep = heroRoot.querySelector('[data-step="email"]');
      if (!emailStep) return;
      var kicker = emailStep.querySelector('.kicker');
      var heading = emailStep.querySelector('h2');
      var sub = emailStep.querySelector('.hero-sub');
      if (kicker) kicker.textContent = 'Advisor Connect';
      if (heading) heading.textContent = '3 minutes here to connect you with the right advisor.';
      if (sub) sub.textContent = 'Enter your email so we can send your results and match you with a vetted advisor. No password needed.';
    }

    if (token) {
      // Strip the token from the URL immediately — it now lives only in this
      // closure. The verify call itself only fires on an explicit user click
      // below, never automatically on page load, so an email-security
      // scanner or link-prefetcher that merely loads this page (even one
      // that executes JS) can't silently consume the single-use token.
      var url = new URL(window.location.href);
      url.searchParams.delete('verify');
      window.history.replaceState({}, '', url.toString());

      setStep('verify-confirm');
      var confirmBtn = el('verify-confirm-btn');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', function () {
          setStep('verifying');
          fetch('/api/verify-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token }),
          })
            .then(function (res) {
              return res.json().then(function (data) {
                return { ok: res.ok && data.ok, data: data };
              });
            })
            .then(function (result) {
              if (!result.ok) {
                renderVerifyError(result.data && result.data.error);
                return;
              }
              // breakdown is only ever populated for a genuine fresh
              // scoring (verify-token.js sets it null for a returning-
              // login token, which reuses an existing score/band without
              // computing anything new) — the one reliable signal here
              // that this render is the "just submitted" moment, not a
              // returning visitor's sign-in link.
              renderResults(result.data.score, result.data.band, { freshSubmission: !!result.data.breakdown });
              if (result.data.isNewAccount) {
                showFirstAccountPopup(result.data.communityCount);
              }
              // §37.6: this visitor's original click came from the Advisor
              // Connect page — after the score reveal, continue straight
              // into the advisor checklist instead of stranding them on
              // the results step waiting for a second, separate click.
              var cameFromAdvisorConnect = consumeAdvisorIntent();
              // The dashboard (submitted tool results, plan, advisor
              // status) needs a live Users-table read that /api/verify-token
              // doesn't return — fetch it separately so the score reveal
              // itself isn't held up by the extra round trip.
              fetch('/api/session?advisor=1')
                .then(function (res) { return res.json(); })
                .then(function (sessionData) {
                  if (sessionData && sessionData.loggedIn) renderDashboard(sessionData);
                  if (cameFromAdvisorConnect) openAdvisorIntake();
                })
                .catch(function () {
                  if (cameFromAdvisorConnect) openAdvisorIntake();
                });
            })
            .catch(function () {
              renderVerifyError('server_error');
            });
        });
      }
      return;
    }

    // window.mmGetSession() already resolves to { loggedIn: false } on any
    // fetch/parse failure rather than rejecting (see scripts/session-client.js),
    // so the loggedIn-false branch below already covers what used to be a
    // separate .catch() — a network failure and "not logged in" land in the
    // exact same place, just without the input.focus() nicety.
    // true: this path calls renderDashboard() below, which shows advisor
    // status when present — needs the includeAdvisorStatus variant.
    window.mmGetSession(true)
      .then(function (data) {
        if (data && data.loggedIn && typeof data.healthScore === 'number') {
          // §37.6: a returning, already-scored visitor who clicked
          // "Connect with an Advisor" has already seen their score before —
          // send them straight to the checklist, full stop, no results
          // detour.
          if (startParam === 'advisor-connect') {
            stripStartParam();
            openAdvisorIntake();
            return;
          }
          renderResults(data.healthScore, data.healthBand);
          renderDashboard(data);
        } else if (startParam === 'health-score' || startParam === 'advisor-connect') {
          if (startParam === 'advisor-connect') {
            applyAdvisorFraming();
            rememberAdvisorIntent();
          } else {
            clearAdvisorIntent();
          }
          stripStartParam();
          setStep('email');
          var input = el('diagnostic-email');
          if (input) input.focus();
        } else {
          setStep('choice');
        }
      });
  }

  init();
})();
