import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { SITE_URL } from '@/lib/config';
import { ANKETA_TEXT } from '@/lib/survey-anketa';

// Share preview for /dotaznik/anketa: the poll's light look with the same two phone outlines as the page.
export const alt = ANKETA_TEXT.title;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
// Rendered once at build time, where public/ is on disk.
export const dynamic = 'force-static';

const read = (path: string) => readFile(join(process.cwd(), 'public', path));
const dataUrl = (buf: Buffer, type: string) => `data:${type};base64,${buf.toString('base64')}`;

export default async function Image() {
  const [medium, bold, logo] = await Promise.all([
    read('fonts/og/OPPOSans-500.ttf'),
    read('fonts/og/OPPOSans-700.ttf'),
    read('img/oppo-logo.png'),
  ]);
  // Same proportions as the page: about 72 x 148 mm next to 82 x 128 mm, bottom-aligned.
  const MM = 2.2;
  const phone = (wMm: number, hMm: number, name: string, note: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex', justifyContent: 'center', width: Math.round(wMm * MM), height: Math.round(hMm * MM), paddingTop: 14,
          border: '5px solid #3d3d4a', borderRadius: 30, background: 'linear-gradient(180deg, #ffffff 0%, #f3f5f4 100%)',
        }}
      >
        <div style={{ width: '26%', height: 7, borderRadius: 4, background: '#d8d8e0' }} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, marginTop: 20, color: '#1a1a1a' }}>{name}</div>
      <div style={{ fontSize: 20, fontWeight: 500, color: '#5e5e6e', marginTop: 2 }}>{note}</div>
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#f7f7f9', fontFamily: 'OPPO Sans', color: '#0e1a13' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: 640, padding: '0 0 0 72px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl(logo, 'image/png')} alt="" height={28} style={{ height: 28, marginBottom: 56, alignSelf: 'flex-start' }} />
          <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.06, letterSpacing: -2 }}>{ANKETA_TEXT.title}</div>
          <div style={{ fontSize: 28, fontWeight: 500, marginTop: 28, color: '#5b675f' }}>Krátký průzkum, zabere 2-4 minuty.</div>
          <div style={{ display: 'flex', marginTop: 40 }}>
            <div style={{ color: '#1b5e3a', fontSize: 28, fontWeight: 700, display: 'flex' }}>
              {`${SITE_URL.replace(/^https?:\/\/(www\.)?/, '')}/dotaznik/anketa`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '0 56px 0 0' }}>
          <div
            style={{
              display: 'flex', alignItems: 'flex-end', gap: 56, padding: '44px 52px 34px',
              background: 'linear-gradient(135deg, #f8fdfa 0%, #f2faf5 100%)', border: '2px solid #d4f0e0', borderRadius: 32,
            }}
          >
            {phone(72, 148, 'Běžný telefon', 'zhruba 20:9')}
            {phone(82, 128, 'Široký telefon', 'zhruba 16:10')}
          </div>
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
