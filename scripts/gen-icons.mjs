// One-off script to generate PWA/app icons from the Ellux logo SVG.
// Run with: node scripts/gen-icons.mjs
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'public/icons');
mkdirSync(outDir, { recursive: true });

const logoSvg = readFileSync(resolve(root, 'public/favicon.svg'));
const BG = '#080b14';

async function makeIcon(size, file, { padding = 0.18, background = BG } = {}) {
  const logoSize = Math.round(size * (1 - padding * 2));
  const logo = await sharp(logoSvg).resize(logoSize, logoSize, { fit: 'contain' }).toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(resolve(outDir, file));
  console.log('wrote', file);
}

await makeIcon(192, 'icon-192.png');
await makeIcon(512, 'icon-512.png');
await makeIcon(512, 'icon-maskable-512.png', { padding: 0.22 });
await makeIcon(180, 'apple-touch-icon.png', { padding: 0.16 });
