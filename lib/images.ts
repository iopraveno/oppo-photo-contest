import 'server-only';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const IMG_DIR = join(process.cwd(), 'public', 'img');

/** Returns the public URL of an image in public/img, or null when the file is not there yet. */
export function img(name: string): string | null {
  return existsSync(join(IMG_DIR, name)) ? `/img/${name}` : null;
}

/** Photos for the "Shot on OPPO" wall: public/img/mozaika/*.jpg in file-name order. */
export function mosaicPhotos(): string[] {
  const dir = join(IMG_DIR, 'mozaika');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort()
    .map((f) => `/img/mozaika/${f}`);
}

/** All photos of one theme: public/img/temata/<slug>.jpg, <slug>-2.jpg, … in order. */
export function themePhotos(slug: string): string[] {
  const dir = join(IMG_DIR, 'temata');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => new RegExp(`^${slug}(-\\d+)?\\.(jpe?g|png|webp)$`, 'i').test(f))
    .sort((a, b) => a.length - b.length || a.localeCompare(b))
    .map((f) => `/img/temata/${f}`);
}
