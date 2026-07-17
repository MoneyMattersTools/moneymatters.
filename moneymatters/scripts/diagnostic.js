(function () {
  var heroRoot = document.getElementById('diagnostic-hero');
  if (!heroRoot) return;

  var QUESTIONS = [
    {
      id: 'q1',
      text: 'If you lost your main source of income today, how many months of expenses could you cover with savings you could access quickly?',
      options: [
        { value: 'a', label: "None — I don't have savings I could access quickly" },
        { value: 'b', label: 'About 1 month' },
        { value: 'c', label: '3–5 months' },
        { value: 'd', label: '6+ months' },
      ],
    },
    {
      id: 'q2',
      text: 'Outside of a mortgage, how would you describe your debt (credit cards, loans, etc.)?',
      options: [
        { value: 'a', label: 'More than I could pay off in 5 years at my current pace' },
        { value: 'b', label: "A meaningful amount, but I'm paying it down steadily" },
        { value: 'c', label: 'A small, manageable amount' },
        { value: 'd', label: 'No non-mortgage debt' },
      ],
    },
    {
      id: 'q3',
      text: 'Do you know, roughly, where your money goes each month?',
      options: [
        { value: 'a', label: 'Not really' },
        { value: 'b', label: 'I have a rough idea' },
        { value: 'c', label: 'I check in periodically' },
        { value: 'd', label: 'I track it closely' },
      ],
    },
    {
      id: 'q4',
      text: 'About what share of your income are you currently able to save or invest, after expenses?',
      options: [
        { value: 'a', label: "I'm not saving anything right now" },
        { value: 'b', label: 'Less than 5%' },
        { value: 'c', label: '5–15%' },
        { value: 'd', label: '15% or more' },
      ],
    },
    {
      id: 'q5',
      text: 'Are you currently contributing to a retirement account (401(k), IRA, etc.)?',
      options: [
        { value: 'a', label: "No, I'm not contributing" },
        { value: 'b', label: 'A little, inconsistently' },
        { value: 'c', label: "Regularly, but not sure it's enough" },
        { value: 'd', label: 'Regularly, and I feel on track' },
      ],
    },
    {
      id: 'q6',
      text: 'If something went wrong tomorrow — job loss, illness, a big repair — how protected do you feel?',
      options: [
        { value: 'a', label: 'Not at all' },
        { value: 'b', label: 'Somewhat' },
        { value: 'c', label: 'Reasonably' },
        { value: 'd', label: 'Well' },
      ],
    },
    {
      id: 'q7',
      text: "How clear are you on your financial goals and whether you're on track?",
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
      body: "You're at the beginning, and that's a real place to start from. Right now, the basics — an emergency fund, a handle on debt, knowing where your money goes — need the most attention.",
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

  function setStep(name) {
    heroRoot.dataset.activeStep = name;
    steps.forEach(function (el) {
      if (el.getAttribute('data-step') === name) {
        el.removeAttribute('hidden');
      } else {
        el.setAttribute('hidden', '');
      }
    });
  }

  function el(id) {
    return document.getElementById(id);
  }

  // --- choice step ---
  var startBtn = el('start-health-score');
  if (startBtn) {
    startBtn.addEventListener('click', function () {
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
  }

  function submitDiagnostic() {
    var errorEl = el('quiz-error');
    errorEl.hidden = true;
    fetch('/api/submit-diagnostic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: state.email, answers: state.answers }),
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

  function tagForRatio(ratio) {
    if (ratio >= 0.8) return { cls: 'strong', label: 'Strong' };
    if (ratio >= 0.5) return { cls: 'good', label: 'Good' };
    return { cls: 'attention', label: 'Needs attention' };
  }

  function renderResults(score, band, breakdown) {
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

    var toggleBtn = el('score-breakdown-toggle');
    var listEl = el('score-breakdown');
    if (breakdown && breakdown.length) {
      listEl.innerHTML = '';
      breakdown.forEach(function (item) {
        var li = document.createElement('li');
        var tag = tagForRatio(item.earned / item.max);
        li.innerHTML =
          '<span class="breakdown-dimension">' + item.dimension + '</span>' +
          '<span class="breakdown-tag ' + tag.cls + '">' + tag.label + '</span>';
        listEl.appendChild(li);
      });
      toggleBtn.hidden = false;
      toggleBtn.addEventListener('click', function () {
        listEl.hidden = !listEl.hidden;
        toggleBtn.textContent = listEl.hidden ? 'See what is driving this' : 'Hide breakdown';
      });
    } else {
      toggleBtn.hidden = true;
    }

    setStep('results');
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
              renderResults(result.data.score, result.data.band, result.data.breakdown);
            })
            .catch(function () {
              renderVerifyError('server_error');
            });
        });
      }
      return;
    }

    fetch('/api/session')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.loggedIn && typeof data.healthScore === 'number') {
          renderResults(data.healthScore, data.healthBand, null);
        } else if (startParam === 'health-score') {
          stripStartParam();
          setStep('email');
          var input = el('diagnostic-email');
          if (input) input.focus();
        } else {
          setStep('choice');
        }
      })
      .catch(function () {
        if (startParam === 'health-score') {
          stripStartParam();
          setStep('email');
        } else {
          setStep('choice');
        }
      });
  }

  init();
})();
