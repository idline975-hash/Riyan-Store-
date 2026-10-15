import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const svgPath = path.resolve('public/icon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

// 1. Generate 192x192
const resvg192 = new Resvg(svgContent, {
  fitTo: { mode: 'width', value: 192 },
});
const png192 = resvg192.render().asPng();
fs.writeFileSync('public/pwa-192x192.png', png192);
console.log('✓ Generated public/pwa-192x192.png');

// 2. Generate 512x512
const resvg512 = new Resvg(svgContent, {
  fitTo: { mode: 'width', value: 512 },
});
const png512 = resvg512.render().asPng();
fs.writeFileSync('public/pwa-512x512.png', png512);
console.log('✓ Generated public/pwa-512x512.png');

// 3. Generate Apple Touch Icon 180x180
const resvgApple = new Resvg(svgContent, {
  fitTo: { mode: 'width', value: 180 },
});
const pngApple = resvgApple.render().asPng();
fs.writeFileSync('public/apple-touch-icon.png', pngApple);
console.log('✓ Generated public/apple-touch-icon.png');

// 4. Generate Maskable Icon 512x512 with safe padding:
// Base64 encode the SVG to embed in image tag with 15% margin
const base64Svg = Buffer.from(svgContent).toString('base64');
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f766e" />
      <stop offset="50%" stop-color="#0d9488" />
      <stop offset="100%" stop-color="#042f2e" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bgGradMask)" />
  <image href="data:image/svg+xml;base64,${base64Svg}" x="51" y="51" width="410" height="410" />
</svg>`;

const resvgMaskable = new Resvg(maskableSvg, {
  fitTo: { mode: 'width', value: 512 },
});
const pngMaskable = resvgMaskable.render().asPng();
fs.writeFileSync('public/pwa-maskable-512x512.png', pngMaskable);
console.log('✓ Generated public/pwa-maskable-512x512.png');

// Also copy favicon
fs.copyFileSync('public/icon.svg', 'public/favicon.svg');
console.log('✓ Generated public/favicon.svg');
