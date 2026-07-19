// One-off: generate branded favicon + app icons from public/logo.png.
// Run: node scripts/gen-favicon.mjs
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(root, '..', 'public', 'logo.png');
const pub = path.join(root, '..', 'public');
const appDir = path.join(root, '..', 'src', 'app');

// Trim transparent edges, fit on a transparent square canvas.
async function square(size) {
  return sharp(src)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

const png16 = await square(16);
const png32 = await square(32);
const png48 = await square(48);
const png180 = await square(180);
const png192 = await square(192);
const png512 = await square(512);

await writeFile(path.join(pub, 'favicon-16.png'), png16);
await writeFile(path.join(pub, 'favicon-32.png'), png32);
await writeFile(path.join(pub, 'apple-touch-icon.png'), png180);
await writeFile(path.join(pub, 'icon-192.png'), png192);
await writeFile(path.join(pub, 'icon-512.png'), png512);

// Real multi-size .ico for /favicon.ico requests (browsers + crawlers).
const ico = await pngToIco([png16, png32, png48]);
await writeFile(path.join(appDir, 'favicon.ico'), ico);

console.log('Favicons generated ✓');
