import { llmsText } from '@/lib/seo';

// Short factual summary of the contest for AI assistants (https://llmstxt.org).
export function GET() {
  return new Response(llmsText(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
