// Lists public/img at build time. Serverless functions on Vercel don't see public/,
// so the site reads this manifest instead of the file system.
import { readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(process.cwd(), 'public', 'img');
const files = [];
function walk(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(jpe?g|png|webp|svg)$/i.test(name)) files.push(relative(root, p).split('\\').join('/'));
  }
}
walk(root);
files.sort();
mkdirSync(join(process.cwd(), 'lib', 'generated'), { recursive: true });
writeFileSync(join(process.cwd(), 'lib', 'generated', 'images.json'), JSON.stringify(files, null, 2) + '\n');
console.log(`image manifest: ${files.length} files`);
