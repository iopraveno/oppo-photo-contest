'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { PHOTOWALK } from '@/lib/config';
import { attendanceOpen, findSignupByToken, getSeatCounts, RSVP_SAMPLE } from '@/lib/photowalk';
import { attendanceNotifyEmail } from '@/lib/photowalk-email';
import { sendMail } from '@/lib/mail';

const PAGE = '/photowalk/potvrzeni';

function back(token: string, extra: Record<string, string> = {}): never {
  redirect(`${PAGE}?${new URLSearchParams({ t: token, ...extra }).toString()}`);
}

async function notifyTeam(...args: Parameters<typeof attendanceNotifyEmail>) {
  const to = (process.env.PHOTOWALK_NOTIFY_EMAILS || '').split(',').map((e) => e.trim()).filter(Boolean);
  if (to.length) await sendMail({ ...attendanceNotifyEmail(...args), to });
}

/** "Ano, dorazím" / "Nedorazím, uvolním místo" from the confirmation page. */
export async function answerAttendance(formData: FormData) {
  const token = String(formData.get('t') || '');
  const answer = formData.get('answer') === 'no' ? 'no' : 'yes';

  // The sample from the admin's test e-mail shows the next state without saving anything.
  if (token === RSVP_SAMPLE) back(token, { ukazka: answer });

  const signup = await findSignupByToken(token);
  if (!signup) back(token);
  if (!attendanceOpen()) back(token);

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  if (answer === 'yes') {
    if (signup.status === 'confirmed') {
      await supabase.from('photowalk_signups').update({ attendance: 'yes', attendance_at: now }).eq('id', signup.id);
    } else if (signup.status === 'declined' && signup.attendance === 'no') {
      // Gave the place up earlier and changed their mind: only while a place is still free.
      const counts = await getSeatCounts();
      if (counts.confirmed >= PHOTOWALK.capacity) back(token, { chyba: 'plno' });
      const { error } = await supabase
        .from('photowalk_signups')
        .update({ status: 'confirmed', confirmed_at: now, attendance: 'yes', attendance_at: now })
        .eq('id', signup.id);
      if (!error) await notifyTeam(signup, 'back', { ...counts, confirmed: counts.confirmed + 1 });
    }
  } else if (signup.status === 'confirmed') {
    // Giving the place up frees the square on /photowalk, so the team can confirm someone from the waiting list.
    const { error } = await supabase
      .from('photowalk_signups')
      .update({ status: 'declined', attendance: 'no', attendance_at: now })
      .eq('id', signup.id);
    if (!error) {
      const counts = await getSeatCounts();
      await notifyTeam(signup, 'freed', counts);
    }
  }

  revalidatePath('/photowalk');
  revalidatePath('/admin/photowalk');
  back(token);
}
