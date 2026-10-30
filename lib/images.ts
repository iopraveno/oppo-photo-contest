import manifest from './generated/images.json';

// public/img listed at build time by scripts/image-manifest.mjs (runs before `next build` and `next dev`).
const files = new Set<string>(manifest as string[]);

/** Returns the public URL of an image in public/img, or null when the file is not there. */
export function img(name: string): string | null {
  return files.has(name) ? `/img/${name}` : null;
}

/** Photos for the "Shot on OPPO" wall: public/img/mozaika/*.jpg in file-name order. */
export function mosaicPhotos(): string[] {
  return [...files].filter((f) => f.startsWith('mozaika/')).sort().map((f) => `/img/${f}`);
}

/** All photos of one theme: public/img/temata/<slug>.jpg, <slug>-2.jpg, … in order. */
export function themePhotos(slug: string): string[] {
  const re = new RegExp(`^temata/${slug}(-\\d+)?\\.(jpe?g|png|webp)$`, 'i');
  return [...files]
    .filter((f) => re.test(f))
    .sort((a, b) => a.length - b.length || a.localeCompare(b))
    .map((f) => `/img/${f}`);
}
