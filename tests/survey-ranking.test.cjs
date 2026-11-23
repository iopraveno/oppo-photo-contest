const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
// Compile the two dependency-free definitions with the project's TypeScript version.
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};
const { ANKETA } = require('../lib/survey-anketa.ts');
const { cleanAnswers, isAnswered, formatAnswer, formatResponseAnswer } = require('../lib/survey.ts');
const ranking = ANKETA.questions.at(-1);
const ordered = ['cena', 'fotoaparaty', 'baterie', 'ergonomie_design'];

test('all nine questions remain, with purchase before the final ranking', () => {
  assert.equal(ANKETA.questions.length, 9);
  assert.equal(ANKETA.questions.at(-2).id, 'purchase');
  assert.equal(ranking.ranked, true);
});

test('a complete ranking survives validation and exports in the chosen order', () => {
  assert.equal(isAnswered(ranking, ordered), true);
  assert.deepEqual(cleanAnswers({ [ranking.id]: ordered }, [ranking]), { answers: { [ranking.id]: ordered } });
  assert.equal(formatAnswer(ranking, ordered), ordered.map((v, i) => `${i + 1}. ${ranking.options.find(o => o.value === v).label}`).join('; '));
});

test('partial, duplicate, unknown and mixed opt-out rankings are rejected', () => {
  for (const invalid of [undefined, [], ['cena'], [...ordered, 'cena'], ['cena', 'cena', 'cena', 'cena'], ['fake', ...ordered.slice(1)], ['nic', ...ordered], 'cena']) {
    assert.equal(isAnswered(ranking, invalid), false);
    assert.ok(cleanAnswers({ [ranking.id]: invalid }, [ranking]).error);
  }
});

test('the final question exactly matches the approved priorities and has no opt-out', () => {
  assert.equal(ranking.title, 'Co je pro vás důležité při výběru telefonu?');
  assert.deepEqual(ranking.options.map(o => o.label), ['Ergonomie & design', 'Špičkové fotoaparáty', 'Velká baterie', 'Cena']);
  assert.equal(ranking.options.some(o => o.exclusive), false);
  assert.equal(isAnswered(ranking, ['nic']), false);
  assert.ok(cleanAnswers({ [ranking.id]: ['nic'] }, [ranking]).error);
});

test('historical answers keep their original labels in a separate export column', () => {
  const archived = ANKETA.archivedQuestions[0];
  const old = { convince: ['cena', 'vyzkouseni'] };
  assert.match(formatResponseAnswer(archived, old), /^Dřívější výběr bez pořadí: /);
  assert.match(formatResponseAnswer(archived, old), /Možnost si ho předem vyzkoušet/);
  const oldRanked = { convince_ranked: ['foto_baterie', 'ergonomie', 'cena', 'vyzkouseni'] };
  assert.match(formatResponseAnswer(archived, oldRanked), /^1\. Špičkové fotoaparáty a velká baterie/);
  assert.equal(formatResponseAnswer(ranking, old), '');
  assert.equal(formatResponseAnswer(ranking, oldRanked), '');
  assert.ok(cleanAnswers(oldRanked, [ranking]).error);
});

test('a full questionnaire accepts rankings while ordinary multi-choice keeps working', () => {
  const answers = Object.fromEntries(ANKETA.questions.map(q => [q.id, q.kind === 'single' ? q.options[0].value : q.ranked ? ordered : [q.options[0].value]]));
  assert.deepEqual(cleanAnswers(answers, ANKETA.questions), { answers });
  const multi = ANKETA.questions.find(q => q.id === 'benefits');
  assert.equal(isAnswered(multi, ['video']), true);
  assert.deepEqual(cleanAnswers({ benefits: ['video', 'zadna'] }, [multi]).answers.benefits, ['zadna']);
});
