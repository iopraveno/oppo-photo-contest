import { NextResponse, type NextRequest } from 'next/server';
import { getUser, isAdminEmail, isPhotowalkAdminEmail, isSurveyAdminEmail } from '@/lib/auth';
import { formatResponseAnswer, labelOf, type Answers } from '@/lib/survey';
import { listResponses, sourceLabel, versionByExport } from '@/lib/survey-data';
import { createAdminClient } from '@/lib/supabase/admin';
import { PHOTOWALK } from '@/lib/config';

function csv(rows: (string | number | boolean | null | undefined)[][]) {
  return rows
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');
}

export async function GET(request: NextRequest) {
  const user = await getUser();
  const typ = request.nextUrl.searchParams.get('typ');
  const survey = versionByExport(typ);
  const type = survey ? 'survey' : typ === 'hlasy' ? 'hlasy' : typ === 'photowalk' ? 'photowalk' : 'fotky';
  const allowed =
    type === 'photowalk' ? isPhotowalkAdminEmail(user?.email) : type === 'survey' ? isSurveyAdminEmail(user?.email) : isAdminEmail(user?.email);
  if (!user || !allowed) return new NextResponse('Forbidden', { status: 403 });
  const supabase = createAdminClient();
  let body: string;

  if (survey) {
    // One column per question; matrix questions get one column per row. Values are the labels people saw.
    const def = survey.def;
    const cols: { head: string; get: (a: Record<string, unknown>) => string }[] = [];
    for (const q of [...def.questions, ...(def.archivedQuestions ?? [])]) {
      if (q.kind === 'matrix') {
        for (const r of q.rows) {
          cols.push({
            head: `${q.short}: ${r.label}`,
            get: (a) => {
              const v = a[q.id] as Record<string, string> | undefined;
              return v?.[r.value] ? labelOf(q, v[r.value]) : '';
            },
          });
        }
      } else {
        cols.push({ head: q.short, get: (a) => formatResponseAnswer(q, a as Answers) });
        const check = q.kind === 'rank' ? q.check : undefined;
        if (check) cols.push({ head: check.short, get: (a) => (a[check.id] === 'ano' ? 'ano' : a[check.id] === 'ne' ? 'ne' : '') });
      }
    }
    const contactName = Boolean(def.meeting?.contactInOpenAnswers);
    const responses = ((await listResponses(def.slug)) ?? []).slice().reverse();
    body = csv([
      [
        'odeslano', 'zdroj', 'zarizeni', 'doba_s', ...cols.map((c) => c.head), ...def.open.map((o) => o.label),
        ...(def.meeting
          ? contactName
            ? ['chce_na_setkani', 'email_setkani', 'jmeno', 'souhlas_setkani_cas']
            : ['chce_na_setkani', 'email', 'souhlas']
          : []),
        ...(def.newsletter ? ['email_novinky', 'souhlas_novinky', 'souhlas_novinky_cas', 'souhlas_novinky_verze', 'souhlas_novinky_text'] : []),
      ],
      ...responses.map((r) => [
        r.created_at, sourceLabel(r.src), r.device ?? '', r.duration_s ?? '',
        ...cols.map((c) => c.get(r.answers as Record<string, unknown>)),
        ...def.open.map((o) => r.open_answers?.[o.id] ?? ''),
        ...(def.meeting
          ? contactName
            ? [
                r.wants_meeting === true ? 'ano' : r.wants_meeting === false ? 'ne' : '',
                r.open_answers?.meet_contact ?? '',
                r.open_answers?.contact_name ?? '',
                r.open_answers?.meet_consent_at ?? '',
              ]
            : [r.wants_meeting === true ? 'ano' : r.wants_meeting === false ? 'ne' : '', r.email ?? '', r.contact_consent ? 'ano' : '']
          : []),
        ...(def.newsletter
          ? [
              r.email ?? '',
              r.contact_consent ? 'ano' : 'ne',
              r.open_answers?.newsletter_consent_at ?? '',
              r.open_answers?.newsletter_consent_version ?? '',
              r.open_answers?.newsletter_consent_text ?? '',
            ]
          : []),
      ]),
    ]);
  } else if (type === 'photowalk') {
    const { data } = await supabase
      .from('photowalk_signups')
      .select('*')
      .eq('event', PHOTOWALK.slug)
      .order('created_at', { ascending: true });
    body = csv([
      ['jmeno', 'email', 'telefon', 'znacka', 'model', 'stav', 'prihlaseno', 'potvrzeno', 'email_odeslan', 'ucast', 'odpoved', 'pripominka'],
      ...(data ?? []).map((s) => [
        s.name, s.email, s.phone, s.brand, s.model, s.status, s.created_at, s.confirmed_at, s.confirm_email_sent_at,
        s.attendance === 'yes' ? 'dorazi' : s.attendance === 'no' ? 'nedorazi' : '', s.attendance_at ?? '', s.reminder_sent_at ?? '',
      ]),
    ]);
  } else if (type === 'fotky') {
    const { data } = await supabase.from('entry_scores').select('*').order('votes', { ascending: false });
    body = csv([
      ['autor', 'odkaz', 'shot_on_oppo', 'skryto', 'hlasy', 'pridano'],
      ...(data ?? []).map((e) => [e.author_handle, e.permalink, e.shot_on_oppo, e.hidden, e.votes, e.created_at]),
    ]);
  } else {
    const rows: (string | number | null)[][] = [];
    for (let from = 0; ; from += 1000) {
      const { data } = await supabase
        .from('votes')
        .select('created_at, voter_email, ip_hash, entries(author_handle, permalink)')
        .order('created_at', { ascending: true })
        .range(from, from + 999);
      const page = (data ?? []) as unknown as {
        created_at: string;
        voter_email: string | null;
        ip_hash: string | null;
        entries: { author_handle: string; permalink: string } | null;
      }[];
      page.forEach((v) => rows.push([v.created_at, v.voter_email, v.ip_hash, v.entries?.author_handle ?? '', v.entries?.permalink ?? '']));
      if (page.length < 1000) break;
    }
    body = csv([['cas', 'email', 'ip_hash', 'autor', 'odkaz'], ...rows]);
  }

  return new NextResponse('﻿' + body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${
        survey ? survey.file : type === 'photowalk' ? 'photowalk-prihlasky' : `lovci-svetla-${type}`
      }.csv"`,
    },
  });
}
