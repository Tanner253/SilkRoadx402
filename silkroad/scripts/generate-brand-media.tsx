/**
 * Brand media generator — OpenFund
 *
 * Renders the social banner (600x200) and profile picture (500x500) from the
 * live <PiggyBank> component, so the brand art can never drift from the
 * mascot on the site. Palette comes from app/globals.css.
 *
 * Usage:
 *   npx tsx scripts/generate-brand-media.tsx            banner, avatar, site icons
 *   npx tsx scripts/generate-brand-media.tsx --poses    also a pose contact sheet
 *
 * Output: public/images/brand/ (social) and app/icon.png, app/apple-icon.png
 * (Next.js serves these as the site favicon / home-screen icon).
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { PiggyBank, type PiggyPose } from '../components/mascot/PiggyBank';

const OUT = resolve(__dirname, '../public/images/brand');
const APP = resolve(__dirname, '../app');

/* Palette — hsl() tokens from app/globals.css, resolved to hex. */
const C = {
  bg: '#F6F3EC', // --background
  bgWarm: '#FBF9F4', // --card
  ink: '#2A2D26', // --foreground
  forest: '#3D5136', // .fund-button
  sage: '#59684A', // .fund-intro h1 em
  muted: '#696B60', // .fund-description
  rule: '#D5D8CB', // --border
};

/** The mascot as an SVG fragment placed at (x, y), `width` px wide. */
function pig(pose: PiggyPose, x: number, y: number, width: number) {
  const markup = renderToStaticMarkup(createElement(PiggyBank, { pose, size: width, still: true }));
  return `<g transform="translate(${x} ${y})">${markup}</g>`;
}

const pool = (cx: number, cy: number, rx: number, ry: number) => `
  <defs><radialGradient id="pool"><stop offset="0%" stop-color="${C.bgWarm}"/>
  <stop offset="100%" stop-color="${C.bgWarm}" stop-opacity="0"/></radialGradient></defs>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#pool)"/>`;

function banner() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200" viewBox="0 0 600 200">
  <rect width="600" height="200" fill="${C.bg}"/>
  ${pool(456, 106, 160, 110)}

  <circle cx="46" cy="47" r="3.4" fill="${C.sage}"/>
  <text x="58" y="51" font-family="Segoe UI, Arial" font-size="10" font-weight="600"
        letter-spacing="2.1" fill="${C.sage}">OPEN FUNDRAISING</text>
  <text x="44" y="94" font-family="Segoe UI, Arial" font-size="38" font-weight="700"
        letter-spacing="-1" fill="${C.ink}">OpenFund</text>
  <text x="45" y="126" font-family="Segoe UI, Arial" font-size="16" fill="${C.muted}">Good things start with
    <tspan font-family="Georgia" font-style="italic" font-size="18" fill="${C.sage}"> a little.</tspan></text>
  <line x1="45" y1="146" x2="300" y2="146" stroke="${C.rule}" stroke-width="1"/>
  <text x="45" y="167" font-family="Segoe UI, Arial" font-size="11" letter-spacing=".35"
        fill="${C.muted}">Wallet to wallet · No KYC · <tspan fill="${C.forest}" font-weight="600">$OPENFUND</tspan></text>

  ${pig('receiving', 348, -4, 224)}
</svg>`;
}

function avatar() {
  // Pig's visual bounds are ~x 60..410, y 60..360 of its 440x400 box, so at
  // 400px wide it sits centred inside the circular crop avatars get.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
  <rect width="500" height="500" fill="${C.bg}"/>
  ${pool(250, 280, 220, 180)}
  ${pig('receiving', 28, 64, 420)}
</svg>`;
}

/** Link-preview card (Open Graph / X), 1200x630. */
function ogImage() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${C.bg}"/>
  ${pool(870, 330, 380, 280)}
  <circle cx="92" cy="170" r="6" fill="${C.sage}"/>
  <text x="112" y="177" font-family="Segoe UI, Arial" font-size="19" font-weight="600" letter-spacing="3.6" fill="${C.sage}">NO-KYC CHARITY</text>
  <text x="86" y="290" font-family="Segoe UI, Arial" font-size="92" font-weight="700" letter-spacing="-3" fill="${C.ink}">OpenFund</text>
  <text x="90" y="360" font-family="Segoe UI, Arial" font-size="34" fill="${C.muted}">Good things start with
    <tspan font-family="Georgia" font-style="italic" font-size="38" fill="${C.sage}"> a little.</tspan></text>
  <line x1="90" y1="410" x2="560" y2="410" stroke="${C.rule}" stroke-width="2"/>
  <text x="90" y="458" font-family="Segoe UI, Arial" font-size="22" fill="${C.muted}">No KYC · No wallet connection · ETH on Robinhood Chain</text>
  <text x="90" y="496" font-family="Segoe UI, Arial" font-size="20" fill="${C.muted}">Charity, wallet to wallet · <tspan fill="${C.forest}" font-weight="600">$OPENFUND on pons</tspan></text>
  ${pig('receiving', 600, 120, 540)}
</svg>`;
}

/** Square app icon: the pig filling a cream tile, legible down to 16px. */
function siteIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="${C.bg}"/>
  ${pig('idle', 4, 30, 504)}
</svg>`;
}

function poseSheet() {
  const poses: PiggyPose[] = ['idle', 'sleep', 'happy', 'receiving'];
  const cells = poses
    .map((pose, i) => {
      const x = (i % 2) * 440;
      const y = Math.floor(i / 2) * 400;
      return `${pig(pose, x, y, 440)}<text x="${x + 14}" y="${y + 24}" font-family="Arial" font-size="15" fill="#9a9a9a">${pose}</text>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="880" height="800"><rect width="880" height="800" fill="${C.bg}"/>${cells}</svg>`;
}

async function render(name: string, svg: string, w: number, h: number) {
  // Rasterise at 3x and downsample for clean anti-aliased edges.
  await sharp(Buffer.from(svg), { density: 72 * 3 })
    .resize(w, h, { kernel: 'lanczos3' })
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/${name}`);
  console.log(`  ${name}  ${w}x${h}`);
}

void (async () => {
  mkdirSync(OUT, { recursive: true });
  console.log('Rendering OpenFund brand media ->', OUT);
  await render('openfund-banner-600x200.png', banner(), 600, 200);
  await render('openfund-profile-500x500.png', avatar(), 500, 500);
  await render('openfund-og-1200x630.png', ogImage(), 1200, 630);
  for (const [name, size] of [['icon.png', 512], ['apple-icon.png', 180]] as const) {
    await sharp(Buffer.from(siteIcon()), { density: 72 * 2 }).resize(size, size, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(`${APP}/${name}`);
    console.log(`  app/${name}  ${size}x${size}`);
  }
  if (process.argv.includes('--poses')) {
    const dest = process.argv[process.argv.indexOf('--poses') + 1];
    const file = dest && !dest.startsWith('--') ? dest : `${OUT}/_poses.png`;
    await sharp(Buffer.from(poseSheet()), { density: 144 }).resize(880, 800).png().toFile(file);
    console.log(`  poses -> ${file}`);
  }
})();
