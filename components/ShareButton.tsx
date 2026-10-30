'use client';

import { useState } from 'react';

export default function ShareButton({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Lovci světla', text, url });
        return;
      } catch {
        // user closed the share sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt('Zkopíruj odkaz:', url);
    }
  }

  return (
    <button type="button" className="btn btn-ghost" onClick={share}>
      {copied ? 'Odkaz zkopírován ✓' : 'Sdílet a sbírat hlasy'}
    </button>
  );
}
