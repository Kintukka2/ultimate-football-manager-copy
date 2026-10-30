// Renders the bitmaps the site needs but can't draw at request time: the
// launcher icons, the Apple touch icon and the social card. Everything else is
// drawn in code; these have to be real files because a crawler, a home screen
// and iOS won't run any.
//
// Built from the same mark, tokens and components the site uses, so a social
// card can't drift from the lockup. The type is checked as well as declared:
// document.fonts.check() only says a family is declared, not that its file
// arrived, so each face is loaded explicitly and the run fails if one didn't,
// rather than shipping a card set in a fallback sans (FHCWiz lost a wordmark
// that way).
//
//   node tools/build.mjs && node tools/make-images.mjs
//
// The icons come from site/icon.svg, which the build writes from the mark.
// Needs Playwright (npm install --no-save playwright).

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadPlaywright } from './browser-check.mjs';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Roboto+Condensed:wght@700&family=Sofia+Sans+Extra+Condensed:wght@700&display=swap">';
const FACES = ['100px "Bebas Neue"', '700 34px "Sofia Sans Extra Condensed"'];
const DEFS = '<svg class="defs"><defs><marker id="ah" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="2.6" markerHeight="2.6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#FFFFFF"/></marker></defs></svg>';

// The mown board, full bleed, with the W of the WM scaled into the middle:
// the maskable icon keeps it inside Android's 80% safe circle, and iOS rounds
// the corners itself.
const W = [[20, 26], [35, 60], [50, 32], [65, 60], [80, 26]];
const stripes = (w) => [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${(i * w) / 8}" y="0" width="${w / 8}" height="${w}" fill="${i % 2 ? '#164530' : '#123A27'}"/>`).join('');
const wOnly = W.map(([x, y]) => `<circle cx="${x + 1.3}" cy="${y + 2}" r="7" fill="#000" opacity=".4"/>`).join('')
  + `<polyline points="${W.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`
  + W.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="7" fill="${i === 4 ? '#FF6B1A' : '#fff'}"/>`).join('');
const fullBleed = (size, scale) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">${stripes(100)}<g transform="translate(50 50) scale(${scale}) translate(-50 -43)">${wOnly}</g></svg>`;

async function jobs() {
  const mark = (await readFile(join(SITE, 'icon.svg'), 'utf8')).trim();
  const { wm } = await import(pathToFileURL(join(SITE, 'js/lib/board.js')).href);
  const css = (await Promise.all(['tokens', 'ufm', 'site'].map((f) => readFile(join(SITE, `css/${f}.css`), 'utf8')))).join('\n');
  const sized = (w, h, top) => `<body style="margin:0;background:transparent">${mark.replace('<svg ', `<svg width="${w}" height="${h}" style="display:block;margin-top:${top}px" `)}</body>`;
  return [
    { file: 'icon-512.png', w: 512, h: 512, html: sized(512, 450, 31), transparent: true },
    { file: 'icon-192.png', w: 192, h: 192, html: sized(192, 169, 11), transparent: true },
    { file: 'icon-maskable-512.png', w: 512, h: 512, html: `<body style="margin:0">${fullBleed(512, 0.62)}</body>` },
    { file: 'apple-touch-icon.png', w: 180, h: 180, html: `<body style="margin:0">${fullBleed(180, 0.8)}</body>` },
    // The game's warm black on the left with the line in Bebas and the gold
    // subtitle; our board on the right; the wordmark with its bib rule. No
    // card art, no portraits, no game logo (Brand Book, Assets).
    {
      file: 'og.png', w: 1200, h: 630, fonts: true,
      html: `<html><head>${FONTS}<style>${css}
        body{margin:0;width:1200px;height:630px;overflow:hidden;display:grid;grid-template-columns:640px 560px;background:#0E0E0B}
        .l{position:relative;background:#000;padding:64px 56px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;border-right:1px solid #E9D38D}
        .l::before{content:"";position:absolute;inset:0;background:var(--tex-streak) no-repeat left bottom/420px 280px;transform:scaleX(-1);opacity:.35}
        .l>*{position:relative}
        h1{margin:0;font-family:var(--ufm-display);font-weight:400;font-size:100px;line-height:.92;color:#fff;letter-spacing:.01em}
        h1 em{font-style:normal;white-space:nowrap;background:var(--ufm-foil);-webkit-background-clip:text;background-clip:text;color:transparent}
        p{margin:18px 0 0;font-family:var(--ufm-mixed);font-weight:700;font-size:34px;line-height:1.1;color:#E1CA94}
        .wordmark{align-self:flex-start;font-size:54px;border-bottom-width:5px}
        .r{display:grid;place-items:center;padding:40px}
        .r .board{width:470px}</style></head>
        <body>${DEFS}<div class="l"><div><h1>The maths<br>behind <em>every card</em>.</h1><p>Free tools for Ultimate Football Manager 27</p></div><span class="wordmark"><i>UFM</i>WIZ</span></div><div class="r">${wm()}</div></body></html>`,
    },
  ];
}

export async function makeImages({ log = console.log } = {}) {
  const pw = loadPlaywright();
  if (!pw) throw new Error('Playwright is not installed: npm install --no-save playwright && npx playwright install chromium');
  const browser = await pw.chromium.launch();
  try {
    for (const j of await jobs()) {
      const page = await browser.newPage({ viewport: { width: j.w, height: j.h } });
      await page.setContent(j.html, { waitUntil: 'networkidle' });
      if (j.fonts) {
        const missing = await page.evaluate(async (faces) => {
          const out = [];
          for (const f of faces) { const got = await document.fonts.load(f); if (!got.length) out.push(f); }
          return out;
        }, FACES);
        if (missing.length) throw new Error(`${j.file}: these faces did not load, so nothing was written: ${missing.join(', ')}`);
      }
      await page.waitForTimeout(150);
      await page.screenshot({ path: join(SITE, j.file), omitBackground: !!j.transparent });
      await page.close();
      log(`make-images: ${j.file}`);
    }
  } finally {
    await browser.close();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await makeImages();
