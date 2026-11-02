import { ImageResponse } from 'next/og';
import { getEntry } from '@/lib/data';
import { CONTEST, SITE_URL } from '@/lib/config';

// Share preview for one photo: the contest visual with "Vote for the photo by @author".
// Instagram's own image can't be used without the Meta API, so the author's name carries the message.
export const alt = `Hlasuj pro fotku ve fotosoutěži OPPO ${CONTEST.name}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Assets come from the site itself: files in public/ are not bundled into serverless functions.
async function asset(path: string) {
  const res = await fetch(`${SITE_URL}${path}`, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`Share image asset ${path} returned ${res.status}`);
  return res.arrayBuffer();
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await getEntry(id);
  const handle = entry ? `@${entry.author_handle}` : CONTEST.name;
  // Long handles shrink so they always fit on one line.
  const handleSize = Math.min(96, Math.floor(1060 / (handle.length * 0.56)));

  const [bg, medium, bold] = await Promise.all([
    asset('/img/og-bg.jpg'),
    asset('/fonts/og/OPPOSans-500.ttf'),
    asset('/fonts/og/OPPOSans-700.ttf'),
  ]);
  const bgSrc = `data:image/jpeg;base64,${Buffer.from(bg).toString('base64')}`;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', fontFamily: 'OPPO Sans', color: '#fff' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bgSrc} width={1200} height={630} alt="" style={{ position: 'absolute', left: 0, top: 0 }} />
        <div style={{ position: 'absolute', left: 64, top: 172, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 30, fontWeight: 500 }}>{`OPPO Photo Contest  |  ${CONTEST.name}`}</div>
          <div style={{ fontSize: 60, fontWeight: 500, marginTop: 34 }}>Hlasuj pro fotku od</div>
          <div style={{ fontSize: handleSize, fontWeight: 700, marginTop: 4, lineHeight: 1.1 }}>{handle}</div>
        </div>
        <div
          style={{
            position: 'absolute',
            left: 64,
            bottom: 64,
            height: 64,
            padding: '0 34px',
            borderRadius: 32,
            background: '#fff',
            color: '#0b0b0b',
            fontSize: 28,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {SITE_URL.replace(/^https?:\/\//, '')}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'OPPO Sans', data: medium, weight: 500, style: 'normal' },
        { name: 'OPPO Sans', data: bold, weight: 700, style: 'normal' },
      ],
    },
  );
}
