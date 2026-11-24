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
const anketa = require('../lib/survey-anketa.ts');
const { ANKETA, anketaFlow } = anketa;

/** Walks the poll like a person would: first option everywhere, except where `pick` says otherwise. */
function walk(pick = {}) {
  const answers = {};
  const byId = new Map(ANKETA.questions.map((q) => [q.id, q]));
  for (let i = 0; ; i++) {
    const ids = anketaFlow(answers).filter((id) => byId.has(id));
    if (i >= ids.length) break;
    const q = byId.get(ids[i]);
    if (pick[q.id] !== undefined) answers[q.id] = pick[q.id];
    else if (q.kind === 'single') answers[q.id] = q.options[0].value;
    else answers[q.id] = [q.options[0].value];
    if (q.kind === 'rank' && q.check) answers[q.check.id] = 'ne';
  }
  return answers;
}

// Heard of wide phones, interested, no meeting.
const answers = walk({ meet: 'ne' });

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
    '@/lib/disposable': require('../lib/disposable.ts'),
    '@/lib/security': { clientIp: async () => '127.0.0.1', hashIp: () => 'test-hash' },
    '@/lib/survey': require('../lib/survey.ts'),
    '@/lib/survey-anketa': anketa,
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
  assert.equal(inserts[0].wants_meeting, false);
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

test('clients may submit anonymous answers without newsletter fields', async () => {
  const { submit, inserts } = actionHarness();
  assert.deepEqual(await submit({ answers }), { ok: true });
  assert.equal(inserts[0].email, null);
  assert.equal(inserts[0].contact_consent, false);
});

test('each branch keeps only its own questions', async () => {
  const { submit, inserts } = actionHarness();
  const notInterested = walk({ interest: 'ne' });
  const firstTime = walk({ aware: 'ne', meet: 'ne' });
  assert.ok(!('meet' in notInterested) && 'not_reason' in notInterested && !('channels' in notInterested));
  assert.ok('appeal' in firstTime && !('channels_rank' in firstTime) && !('interest' in firstTime));
  // Answers left over from a branch the person later left are dropped on the server.
  assert.deepEqual(await submit({ answers: { ...firstTime, benefits: ['video'], interest: 'ano' } }), { ok: true });
  assert.deepEqual(inserts[0].answers, firstTime);
  assert.deepEqual(await submit({ answers: notInterested }), { ok: true });
  assert.equal(inserts[1].wants_meeting, null);
});

test('meeting e-mail: required for yes, e-mail only, needs its own consent, stays out of the newsletter columns', async () => {
  const { submit, inserts } = actionHarness();
  const yes = walk({ meet: 'ano' });
  assert.equal((await submit({ answers: yes })).ok, false);
  assert.equal((await submit({ answers: yes, meetContact: 'jana@example.com' })).ok, false);
  assert.equal((await submit({ answers: yes, meetContact: '777 123 456', meetConsent: true })).ok, false);
  assert.deepEqual(await submit({ answers: yes, meetContact: ' Jana@Example.com ', meetName: 'Jana', meetConsent: true }), { ok: true });
  const row = inserts[0];
  assert.equal(row.wants_meeting, true);
  assert.equal(row.open_answers.meet_contact, 'jana@example.com');
  assert.equal(row.open_answers.contact_name, undefined); // no name is collected
  // One e-mail can serve both purposes, each with its own consent.
  assert.deepEqual(await submit({ answers: yes, meetContact: 'jana@example.com', meetConsent: true, newsletter: true, email: 'jana@example.com', consent: true }), { ok: true });
  assert.equal(inserts[1].open_answers.meet_contact, 'jana@example.com');
  assert.equal(inserts[1].email, 'jana@example.com');
  assert.equal(inserts[1].contact_consent, true);
  assert.equal(row.email, null);
  assert.equal(row.contact_consent, false);
  // "Raději ne" ignores a contact typed earlier.
  assert.deepEqual(await submit({ answers: walk({ meet: 'ne' }), meetContact: 'a@b.cz', meetConsent: true }), { ok: true });
  assert.equal(inserts[2].open_answers.meet_contact, undefined);
});

test('"something else" text is kept only when that option is picked', async () => {
  const { submit, inserts } = actionHarness();
  const withOther = walk({ meet: 'ne', benefits: ['video', 'jine'] });
  await submit({ answers: withOther, open: { benefits_jine: 'Dvě aplikace vedle sebe', concerns_jine: 'Nepatří sem' } });
  assert.equal(inserts[0].open_answers.benefits_jine, 'Dvě aplikace vedle sebe');
  assert.equal(inserts[0].open_answers.concerns_jine, undefined);
});
