// Financial Health Score — server-side source of truth for questions/weights.
// Mirrors the question TEXT in moneymatters/scripts/diagnostic.js (client renders
// labels only; point values never leave the server).
const QUESTIONS = [
  { id: 'q1', dimension: 'Emergency fund', max: 18, points: { a: 0, b: 6, c: 13, d: 18 } },
  { id: 'q2', dimension: 'Non-mortgage debt', max: 16, points: { a: 0, b: 7, c: 12, d: 16 } },
  { id: 'q3', dimension: 'Spending awareness', max: 14, points: { a: 0, b: 6, c: 10, d: 14 } },
  { id: 'q4', dimension: 'Saving rate', max: 16, points: { a: 0, b: 6, c: 12, d: 16 } },
  { id: 'q5', dimension: 'Retirement contributions', max: 14, points: { a: 0, b: 5, c: 10, d: 14 } },
  { id: 'q6', dimension: 'Protection basics', max: 10, points: { a: 0, b: 4, c: 7, d: 10 } },
  { id: 'q7', dimension: 'Goal clarity', max: 12, points: { a: 0, b: 5, c: 8, d: 12 } },
];

const BANDS = [
  { key: 'Starting Point', min: 0, max: 40 },
  { key: 'Needs Work', min: 41, max: 64 },
  { key: 'Solid Ground', min: 65, max: 84 },
  { key: 'Thriving', min: 85, max: 100 },
];

function validateAnswers(answers) {
  if (!answers || typeof answers !== 'object') return false;
  return QUESTIONS.every((q) => {
    const val = answers[q.id];
    return typeof val === 'string' && Object.prototype.hasOwnProperty.call(q.points, val);
  });
}

function computeScore(answers) {
  let score = 0;
  const breakdown = QUESTIONS.map((q) => {
    const earned = q.points[answers[q.id]];
    score += earned;
    return { id: q.id, dimension: q.dimension, earned, max: q.max };
  });
  return { score, breakdown };
}

function determineBand(score) {
  const band = BANDS.find((b) => score >= b.min && score <= b.max) || BANDS[0];
  return band.key;
}

module.exports = { QUESTIONS, BANDS, validateAnswers, computeScore, determineBand };
