import { buildIcs } from '@/lib/photowalk';

export function GET() {
  return new Response(buildIcs(), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="oppo-photowalk.ics"',
      'X-Robots-Tag': 'noindex',
    },
  });
}
