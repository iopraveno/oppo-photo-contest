'use client';

import { useEffect, useRef, useState } from 'react';
import { embedUrl } from '@/lib/instagram';

/**
 * Instagram's own embed of a public post. The embed page reports its height with a
 * "MEASURE" message (the same one Instagram's embed.js listens for); we use it to size
 * the frame and keep a fixed height when no message arrives.
 */
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
  );
}
