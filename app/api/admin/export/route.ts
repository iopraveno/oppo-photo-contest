import { NextResponse, type NextRequest } from 'next/server';
import { getUser, isAdminEmail } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { PHOTOWALK } from '@/lib/config';

function csv(rows: (string | number | boolean | null | undefined)[][]) {
  return rows
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');
}

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user || !isAdminEmail(user.email)) return new NextResponse('Forbidden', { status: 403 });

  const typ = request.nextUrl.searchParams.get('typ');
  const type = typ === 'hlasy' ? 'hlasy' : typ === 'photowalk' ? 'photowalk' : 'fotky';
  const supabase = createAdminClient();
  let body: string;

  if (type === 'photowalk') {
    const { data } = await supabase
      .from('photowalk_signups')
      .select('*')
      .eq('event', PHOTOWALK.slug)
      .order('created_at', { ascending: true });
    body = csv([
      ['jmeno', 'email', 'telefon', 'znacka', 'model', 'stav', 'prihlaseno', 'potvrzeno', 'email_odeslan'],
      ...(data ?? []).map((s) => [s.name, s.email, s.phone, s.brand, s.model, s.status, s.created_at, s.confirmed_at, s.confirm_email_sent_at]),
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
      'Content-Disposition': `attachment; filename="${type === 'photowalk' ? 'photowalk-prihlasky' : `lovci-svetla-${type}`}.csv"`,
    },
  });
}
