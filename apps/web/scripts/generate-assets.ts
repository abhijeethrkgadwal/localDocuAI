/**
 * Renders social images and app icons into public/. Re-run after changing page titles:
 *   pnpm assets
 * Output is committed so builds stay fast and deterministic.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { DEFAULT_OG_IMAGE, ROUTE_META, type RouteMeta } from '../src/lib/routeMeta';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');

const PAPER = '#fffdf8';
const FONT = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wrap(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if ((line + ' ' + word).trim().length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = (line + ' ' + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

const BRAND_ICON_WHITE = `data:image/png;base64,${fs
  .readFileSync(path.join(publicDir, 'brand', 'icon-white.png'))
  .toString('base64')}`;

function logoMark(x: number, y: number, size: number): string {
  const pad = Math.round(size * 0.18);
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${Math.round(size * 0.19)}" fill="${PAPER}" fill-opacity="0.14"/>
  <image href="${BRAND_ICON_WHITE}" x="${x + pad}" y="${y + pad}" width="${size - pad * 2}" height="${size - pad * 2}"/>`;
}

const EYEBROW: Record<RouteMeta['kind'], string> = {
  home: 'Free, private PDF & Word tools',
  tool: 'Free PDF tool · runs in your browser',
  hub: 'Guides & comparisons',
  guide: 'Guide',
  compare: 'Comparison',
  info: 'LocalDocu',
  faq: 'LocalDocu',
};

function ogSvg(headline: string, eyebrow: string): string {
  let size = 68;
  let lines = wrap(headline, 26);
  if (lines.length > 3) {
    size = 56;
    lines = wrap(headline, 32);
  }
  const lineHeight = Math.round(size * 1.14);
  const blockTop = 330 - ((lines.length - 1) * lineHeight) / 2;
  const text = lines
    .map(
      (l, i) =>
        `<text x="80" y="${blockTop + i * lineHeight}" font-family="${FONT}" font-size="${size}" font-weight="700" fill="${PAPER}">${esc(l)}</text>`,
    )
    .join('\n  ');
  const chips = ['No upload', 'No sign-up', 'Works offline', 'Open source'];
  let chipX = 80;
  const chipSvg = chips
    .map((label) => {
      const w = Math.round(label.length * 12.4 + 44);
      const g = `<rect x="${chipX}" y="518" width="${w}" height="46" rx="23" fill="${PAPER}" fill-opacity="0.12" stroke="${PAPER}" stroke-opacity="0.35"/>
  <text x="${chipX + w / 2}" y="548" text-anchor="middle" font-family="${FONT}" font-size="22" font-weight="600" fill="${PAPER}">${label}</text>`;
      chipX += w + 14;
      return g;
    })
    .join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0B665F"/>
      <stop offset="60%" stop-color="#0F766E"/>
      <stop offset="100%" stop-color="#134E4A"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1080" cy="90" r="230" fill="#2BAE9F" opacity="0.16"/>
  <circle cx="1150" cy="600" r="160" fill="${PAPER}" opacity="0.05"/>
  ${logoMark(80, 64, 72)}
  <text x="170" y="112" font-family="${FONT}" font-size="34" font-weight="700" fill="${PAPER}">LocalDocu</text>
  <text x="80" y="${blockTop - lineHeight + 8}" font-family="${FONT}" font-size="24" font-weight="600" fill="#B6E3DC" letter-spacing="1.5">${esc(eyebrow.toUpperCase())}</text>
  ${text}
  ${chipSvg}
  <text x="1120" y="112" text-anchor="end" font-family="${FONT}" font-size="22" fill="#B6E3DC">localdocu.org</text>
</svg>`;
}

function renderPng(svg: string, width?: number): Buffer {
  const resvg = new Resvg(svg, {
    font: { loadSystemFonts: true, defaultFontFamily: 'Segoe UI' },
    ...(width ? { fitTo: { mode: 'width' as const, value: width } } : {}),
  });
  return resvg.render().asPng();
}

function write(rel: string, data: Buffer): void {
  const file = path.join(publicDir, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
  console.log(`  ${rel} (${Math.round(data.length / 1024)} KB)`);
}

const ICON_BG = '#0F766E';

/** Official white glyph on the brand teal; `glyphScale` keeps it inside maskable/iOS safe zones. */
function squareIconSvg(glyphScale: number, radius = 0): string {
  const size = Math.round(512 * glyphScale);
  const offset = (512 - size) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="${radius}" fill="${ICON_BG}"/>
  <image href="${BRAND_ICON_WHITE}" x="${offset}" y="${offset}" width="${size}" height="${size}"/>
</svg>`;
}

function ico(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, i) => {
    const entry = 6 + i * 16;
    header.writeUInt8(size >= 256 ? 0 : size, entry);
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    header.writeUInt8(0, entry + 2);
    header.writeUInt8(0, entry + 3);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.png)]);
}

console.log('Social images');
write(DEFAULT_OG_IMAGE.slice(1), renderPng(ogSvg('Tell it what to do. Your files stay on your device.', EYEBROW.home)));
for (const meta of Object.values(ROUTE_META)) {
  if (meta.ogImage === DEFAULT_OG_IMAGE) continue;
  write(meta.ogImage.slice(1), renderPng(ogSvg(meta.h1 ?? meta.title, EYEBROW[meta.kind])));
}

// pwa-192/512.png, favicon-32*.png and apple-touch-icon.png are official brand exports — not generated.
console.log('Icons');
write('icon-maskable-512.png', renderPng(squareIconSvg(0.5), 512));
write(
  'favicon.ico',
  ico([16, 32, 48].map((size) => ({ size, png: renderPng(squareIconSvg(0.72, 96), size) }))),
);
