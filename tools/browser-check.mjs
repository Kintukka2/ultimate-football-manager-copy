// Opens every page of the built site in a real browser, at the phone width
// most readers have (390) and at a desktop width (1280), and fails on what a
// green unit suite can't see:
//
//   - a page error or a console error
//   - a page wider than the screen (sideways scrolling on a phone)
//   - a paragraph that ends with one word alone on its last line
//
// The one-word check measures the rendered page rather than trusting a rule
// in the renderer, as FHCWiz learned: a rule that lives in one code path holds
// only for the text that goes through it. Every block of prose, at both
// widths: take its last line box, count the words whose own box sits on it,
// and fail on one.
//
//   node tools/browser-check.mjs                    serve site/ itself
//   node tools/browser-check.mjs --base http://localhost:8080
//   node tools/browser-check.mjs --shots <dir>      also save a screenshot per page
//
// Pages come from site/sitemap.xml, so a page the build writes is a page this
// checks, plus the not-found page.

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { readFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
};

// Plain on purpose: it stands in for Cloudflare Pages, and the only things
// that matter here are directory indexes, content types and a 404 page.
export function serve(root = ROOT) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel.endsWith('/')) rel += 'index.html';
      const file = normalize(join(root, rel));
      if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
        const nf = join(root, '404.html');
        res.writeHead(404, { 'Content-Type': TYPES['.html'] });
        return existsSync(nf) ? createReadStream(nf).pipe(res) : res.end('not found');
      }
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
      createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

export function loadPlaywright() {
  try { return createRequire(import.meta.url)('playwright'); } catch { return null; }
}

export async function pages(root = ROOT) {
  const xml = await readFile(join(root, 'sitemap.xml'), 'utf8');
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  return [...paths, '/no-such-page/'];
}

// Runs in the page. The tokens of each text node are measured one by one, and
// a word's LAST box decides its line: a hyphenated word that breaks starts on
// the line above, and its first box would miss the runt.
function findRunts() {
  const out = [];
  document.querySelectorAll('main:not([hidden]) p, main:not([hidden]) li, main:not([hidden]) figcaption').forEach((el) => {
    if (!el.offsetParent) return;
    const txt = (el.textContent || '').trim();
    if (txt.split(/\s+/).length < 6) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter((r) => r.height > 2);
    if (rects.length < 2) return;
    const lastTop = Math.round(rects[rects.length - 1].top);
    let onLast = 0;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      let at = 0;
      for (const tok of node.data.split(/([\s]+)/)) {
        if (tok.trim() && !/^[ ]+$/.test(tok)) {
          // A no-break space joins words into one token for the eye, so the
          // words either side of it are counted separately here.
          for (const part of tok.split(' ')) {
            if (part) {
              const wr = document.createRange();
              const start = at + tok.indexOf(part);
              wr.setStart(node, start); wr.setEnd(node, start + part.length);
              const boxes = wr.getClientRects();
              const tail = boxes[boxes.length - 1];
              if (tail && Math.round(tail.top) === lastTop) onLast++;
            }
          }
        }
        at += tok.length;
      }
    }
    if (onLast === 1) out.push(txt.slice(-50));
  });
  return out;
}

export async function check({ base, shots = null, widths = [390, 1280], log = console.log } = {}) {
  const pw = loadPlaywright();
  if (!pw) throw new Error('Playwright is not installed: npm install --no-save playwright && npx playwright install chromium');
  let server = null;
  if (!base) { server = await serve(); base = `http://127.0.0.1:${server.address().port}`; }
  const faults = [];
  const browser = await pw.chromium.launch();
  try {
    const list = await pages();
    for (const width of widths) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
      const page = await ctx.newPage();
      let current = '';
      page.on('pageerror', (e) => faults.push(`${width} ${current}: page error: ${e.message}`));
      // A failed load is reported by its address, which the console line
      // doesn't carry. The not-found page is meant to answer 404.
      page.on('response', (res) => {
        if (res.status() >= 400 && !(current === '/no-such-page/' && res.url().endsWith(current))) faults.push(`${width} ${current}: ${res.status()} ${res.url().replace(base, '')}`);
      });
      page.on('console', (m) => {
        if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) faults.push(`${width} ${current}: console: ${m.text()}`);
      });
      for (const path of list) {
        current = path;
        await page.goto(base + path, { waitUntil: 'networkidle' });
        await page.waitForTimeout(150);
        const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
        if (r.sw > r.iw) faults.push(`${width} ${path}: ${r.sw - r.iw}px wider than the screen`);
        for (const t of await page.evaluate(findRunts)) faults.push(`${width} ${path}: one word alone on the last line: …${t}`);
        if (shots) {
          await mkdir(shots, { recursive: true });
          await page.screenshot({ path: join(shots, `${width}-${(path.replace(/^\/|\/$/g, '') || 'home').replace(/\//g, '_')}.png`) });
        }
      }
      log(`browser-check: ${list.length} pages at ${width}px`);
      await ctx.close();
    }
  } finally {
    await browser.close();
    server?.close();
  }
  return faults;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
  const faults = await check({ base: arg('--base'), shots: arg('--shots') });
  if (faults.length) {
    console.error(`browser-check: ${faults.length} to fix\n  ${faults.join('\n  ')}`);
    process.exit(1);
  }
  console.log('browser-check: every page clean at 390 and 1280');
}
