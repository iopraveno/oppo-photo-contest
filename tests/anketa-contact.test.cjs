const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const ts = require('typescript');
const compile = (filename) => ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
require.extensions['.ts'] = (module, filename) => module._compile(compile(filename), filename);
const contact = require('../lib/anketa-contact.ts');
const { ANKETA } = require('../lib/survey-anketa.ts');
const answers = Object.fromEntries(ANKETA.questions.map(q => [q.id, q.kind === 'single' ? q.options[0].value : q.ranked ? ['cena', 'ergonomie_design', 'fotoaparaty', 'baterie'] : [q.options[0].value]]));

function actionHarness() {
  const inserts = [];
  const client = { from: () => ({
    select: () => ({ eq: () => ({ gte: async () => ({ count: 0 }) }) }),
    insert: async row => { inserts.push(row); return { error: null }; },
  }) };
  const mocks = {
    'next/headers': { headers: async () => new Headers({ 'user-agent': 'test' }) },
    '@/lib/supabase/admin': { createAdminClient: () => client },
    '@/lib/env': { isSupabaseConfigured: () => true },
    '@/lib/security': { clientIp: async () => '127.0.0.1', hashIp: () => 'test-hash' },
    '@/lib/survey': require('../lib/survey.ts'),
    '@/lib/survey-anketa': { ANKETA },
    '@/lib/anketa-contact': contact,
  };
  const filename = path.resolve(__dirname, '../app/dotaznik/anketa/actions.ts');
  const module = new Module(filename);
  module.require = spec => {
    assert.ok(Object.hasOwn(mocks, spec), `Unexpected action dependency: ${spec}`);
    return mocks[spec];
  };
  module._compile(compile(filename), filename);
  return { submit: module.exports.submitAnketa, inserts };
}

test('skipping drops any stale email or consent; opt-in must be a literal boolean', () => {
  for (const newsletter of [undefined, false, 'true', 'false', 1]) {
    assert.deepEqual(contact.cleanAnketaContact({ newsletter, email: 'person@example.com', consent: true }), { email: null, consent: false });
  }
});

test('opt-in validates email and explicit consent and normalizes the address', () => {
  assert.deepEqual(contact.cleanAnketaContact({ newsletter: true, email: ' Person@Example.com ', consent: true }), { email: 'person@example.com', consent: true });
  for (const email of [undefined, '', 'bad-address', 'x@y', 'a'.repeat(120) + '@example.com']) {
    assert.ok(contact.cleanAnketaContact({ newsletter: true, email, consent: true }).error);
  }
  for (const consent of [undefined, false, 'true', 'false', 1]) {
    assert.ok(contact.cleanAnketaContact({ newsletter: true, email: 'person@example.com', consent }).error);
  }
});

test('server anonymous branch stores all answers and no contact or consent metadata', async () => {
  const { submit, inserts } = actionHarness();
  assert.deepEqual(await submit({ answers, newsletter: false, email: 'stale@example.com', consent: true }), { ok: true });
  assert.equal(inserts.length, 1);
  assert.deepEqual(inserts[0].answers, answers);
  assert.equal(inserts[0].email, null);
  assert.equal(inserts[0].contact_consent, false);
  assert.deepEqual(inserts[0].open_answers, {});
});

test('server opt-in stores normalized email and server-authored proof of consent', async () => {
  const { submit, inserts } = actionHarness();
  assert.deepEqual(await submit({ answers, newsletter: true, email: ' Person@Example.com ', consent: true }), { ok: true });
  const row = inserts[0];
  assert.equal(row.email, 'person@example.com');
  assert.equal(row.contact_consent, true);
  assert.equal(row.open_answers.newsletter_consent_version, contact.ANKETA_CONSENT_VERSION);
  assert.equal(row.open_answers.newsletter_consent_text, contact.ANKETA_CONSENT_TEXT);
  assert.ok(Number.isFinite(Date.parse(row.open_answers.newsletter_consent_at)));
});

test('invalid opt-in, missing answers, or honeypot never writes to the database', async () => {
  const { submit, inserts } = actionHarness();
  assert.equal((await submit({ answers, newsletter: true, email: 'bad', consent: true })).ok, false);
  assert.equal((await submit({ answers, newsletter: true, email: 'person@example.com', consent: false })).ok, false);
  assert.equal((await submit({ answers: {}, newsletter: false })).ok, false);
  assert.deepEqual(await submit({ answers, website: 'bot' }), { ok: true });
  assert.equal(inserts.length, 0);
});

test('older clients may submit anonymous answers without newsletter fields', async () => {
  const { submit, inserts } = actionHarness();
  assert.deepEqual(await submit({ answers }), { ok: true });
  assert.equal(inserts[0].email, null);
  assert.equal(inserts[0].contact_consent, false);
});
