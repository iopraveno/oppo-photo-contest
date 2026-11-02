'use client';

import { useEffect, useRef, useState } from 'react';
import { embedUrl } from '@/lib/instagram';

/**
 * Instagram's own embed of a public post. The embed page reports its height with a
 * "MEASURE" message (the same one Instagram's embed.js listens for); we use it to size
 * the frame and keep a fixed height when no message arrives.
 *
 * Everything under the photo is cropped away: the "View more on Instagram" row (44 px), the like /
 * comment / share bar (41 px), the like count (24 px) and the comment box (45 px), measured on the
 * live embed. The header with the author stays visible. When a post shows no like count the crop
 * takes up to 24 px off the bottom of the photo, which is the safer side to err on.
 */
const BOTTOM_CROP = 154;
export default function InstagramEmbed({ shortcode, author, fallbackHeight = 600 }: { shortcode: string; author: string; fallbackHeight?: number }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(fallbackHeight);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!/^https:\/\/(www\.)?instagram\.com$/.test(event.origin)) return;
      if (event.source !== ref.current?.contentWindow) return;
      let data: unknown = event.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      const msg = data as { type?: string; details?: { height?: number } };
      const h = msg?.details?.height;
      if (msg?.type === 'MEASURE' && typeof h === 'number' && h > 100 && h < 3000) setHeight(Math.ceil(h));
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div className="embed-wrap" style={{ height: Math.max(height - BOTTOM_CROP, 200) }}>
      <iframe
        ref={ref}
        className="embed"
        src={embedUrl(shortcode)}
        title={`Fotka od @${author} na Instagramu`}
        loading="lazy"
        scrolling="no"
        style={{ height }}
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
