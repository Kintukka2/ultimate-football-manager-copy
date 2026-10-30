// Writes every page of the site from one template: a real HTML file per
// address, with that page's title, description and canonical, a <base> that
// points back to the root from its depth, and the page already rendered so a
// crawler that never runs the script still reads it. Run it after changing
// routes, posts or a view's render(); the output is committed.
//
//   node tools/build.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const { ROUTES, SITE, RAIL, THUMB, SHEET, byId } = await import(join(ROOT, 'js/data/routes.js'));
const { POSTS } = await import(join(ROOT, 'js/data/posts.js'));

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const V = SITE.version;

// ---- the mark, defined once per page --------------------------------------
const GRASS_A = '#123A27', GRASS_B = '#164530', FRAME = '#9AA6B0';
const W = [[20, 26], [35, 60], [50, 32], [65, 60], [80, 26]];
const magnet = (x, y, fill, r = 7) => `<circle cx="${x + r * 0.18}" cy="${y + r * 0.28}" r="${r}" fill="#000" opacity=".4"/><circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const MARK_INNER = `<rect x="3" y="3" width="94" height="82" rx="7" fill="${GRASS_A}"/>`
  + [12.5, 37.5, 62.5, 87.5].map((x) => `<rect x="${x}" y="3" width="12.5" height="82" fill="${GRASS_B}"/>`).join('')
  + `<rect x="3" y="3" width="94" height="82" rx="7" fill="none" stroke="${FRAME}" stroke-width="3"/>`
  + `<polyline points="${W.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`
  + W.map(([x, y], i) => magnet(x, y, i === 4 ? '#FF6B1A' : '#FFFFFF')).join('');
const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 88">${MARK_INNER}</svg>`;
const FAVICON = 'data:image/svg+xml,' + encodeURIComponent(MARK_SVG).replace(/'/g, '%27');
const DEFS = `<svg class="defs" aria-hidden="true" focusable="false"><defs>`
  + '<marker id="ah" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="2.6" markerHeight="2.6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#FFFFFF"/></marker>'
  + '<marker id="ah-bib" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="2.6" markerHeight="2.6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#FF6B1A"/></marker>'
  + `<symbol id="mark-ufm" viewBox="0 0 100 88">${MARK_INNER}</symbol></defs></svg>`;
const markUse = (cls) => `<svg class="${cls}" viewBox="0 0 100 88" aria-hidden="true"><use href="#mark-ufm"/></svg>`;
const WORDMARK = '<span class="wordmark"><i>UFM</i>WIZ</span>';

// ---- nav glyphs, inline like every other graphic ---------------------------
const G = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const GLYPH = {
  home: G('<path d="M3 11 12 4l9 7"/><path d="M5.5 9.5V20h13V9.5"/>'),
  'ptc-solver': G('<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17"/>'),
  players: G('<path d="M12 4.5 9 3 4 5v5l1 1v8.5l7 2 7-2V11l1-1V5l-5-2z"/>'),
  'squad-builder': G('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18"/><circle cx="12" cy="12" r="3"/>'),
  more: G('<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>'),
};

const href = (r) => esc(r.path || './');
const railHTML = RAIL.map((id) => { const r = byId(id); return `<a class="rail__item" href="${href(r)}" data-nav="${id}">${esc(r.nav)}</a>`; }).join('\n    ');
const thumbHTML = THUMB.map((id) => { const r = byId(id); return `<a href="${href(r)}" data-nav="${id}">${GLYPH[id]}<span>${esc(r.short || r.nav)}</span></a>`; }).join('\n  ');
const sheetHTML = SHEET.map((id) => { const r = byId(id); return `<a href="${href(r)}" data-nav="${id}">${esc(r.nav)}<span>${esc(r.blurb || r.sub)}</span></a>`; }).join('\n  ');

// ---- views -----------------------------------------------------------------
const VIEW_IDS = ROUTES.map((r) => r.id);
const modules = {};
for (const id of VIEW_IDS) {
  try { modules[id] = await import(join(ROOT, `js/views/${id}.js`)); } catch (e) {
    if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e;
    modules[id] = {};
  }
}

function viewsHTML(current, params) {
  return VIEW_IDS.map((id) => {
    const r = byId(id);
    const on = id === current;
    const head = r.head && id !== 'home' && id !== 'post'
      ? `<header class="pagehead"><div class="wrap pagehead__in"><h1>${esc(r.head)}</h1><p>${esc(r.sub)}</p></div></header>` : '';
    const body = on && modules[id].render ? modules[id].render({ params, build: true }) : '';
    return `<main id="view-${id}" class="view" data-view="${id}"${on ? '' : ' hidden'}>${head}<div class="view__body">${body}</div></main>`;
  }).join('\n');
}

function page({ route, params = {}, path, base, title, desc }) {
  const canonical = `${SITE.origin}/${path}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<!-- Pins every relative URL to the site root from this page's depth, so the
     same links work on every page and after the app moves the address. -->
<base href="${base}">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="theme-color" content="#0E0E0B">
<meta name="color-scheme" content="dark">
<link rel="icon" href="${FAVICON}">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="manifest" href="manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="UFMWiz">
<meta property="og:site_name" content="UFMWiz">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="${route.id === 'post' ? 'article' : 'website'}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${SITE.origin}/og.png?v=${V}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${SITE.origin}/#website`, name: 'UFMWiz', alternateName: ['UFM Wiz', 'UFMWIZ'], url: `${SITE.origin}/`, inLanguage: 'en', isAccessibleForFree: true, about: { '@id': `${SITE.origin}/#game` } },
      { '@type': 'VideoGame', '@id': `${SITE.origin}/#game`, name: 'Ultimate Football Manager 27', alternateName: ['UFM 27', 'UFM'], author: { '@type': 'Organization', name: 'Gamebasics' } },
    ],
  })}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Roboto+Condensed:ital,wght@0,400;0,500;0,700;1,700&family=Sofia+Sans+Extra+Condensed:wght@700&display=swap">
<link rel="stylesheet" href="css/tokens.css?v=${V}">
<link rel="stylesheet" href="css/ufm.css?v=${V}">
<link rel="stylesheet" href="css/site.css?v=${V}">
<link rel="stylesheet" href="css/views.css?v=${V}">
<link rel="stylesheet" href="css/ptc.css?v=${V}">
<link rel="stylesheet" href="css/squad.css?v=${V}">
<link rel="stylesheet" href="css/players.css?v=${V}">
<script type="module" src="js/app.js?v=${V}"></script>
</head>
<body data-route="${route.id}">
${DEFS}
<div class="shell">
  <nav class="rail" aria-label="Sections">
    <a class="rail__brand" href="./" data-nav="home" aria-label="UFMWiz home">${markUse('')}${WORDMARK}</a>
    ${railHTML}
    <p class="rail__foot">A fan project. Not affiliated with Gamebasics or Miniclip.</p>
  </nav>
  <div class="main">
    <a class="topbar" href="./" aria-label="UFMWiz home">${markUse('')}${WORDMARK}</a>
${viewsHTML(route.id, params)}
    <footer class="foot"><div class="wrap">
      <p>UFMWiz is an independent fan project. It is not affiliated with, endorsed by or sponsored by Gamebasics BV or Miniclip. Ultimate Football Manager and UFM are trademarks of their respective owners. Player names and ratings are shown as reference data only.</p>
      <p>Your cards, squads and challenges are kept in this browser and nowhere else.</p>
      <nav aria-label="Site">${['about', 'blog', 'events'].map((id) => `<a href="${href(byId(id))}">${esc(byId(id).nav)}</a>`).join('')}<span>v${V}</span></nav>
    </div></footer>
  </div>
</div>
<nav class="mnav" aria-label="Sections">
  ${thumbHTML}
  <button id="btnMore" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="moreSheet">${GLYPH.more}<span>More</span></button>
</nav>
<div class="sheet-scrim" id="moreScrim" hidden></div>
<div class="sheet" id="moreSheet" role="dialog" aria-label="More sections" hidden>
  ${sheetHTML}
</div>
</body>
</html>
`;
}

// ---- write -----------------------------------------------------------------
const out = [];
async function emit(rel, html) {
  const file = join(ROOT, rel);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
  out.push(rel);
}
const baseFor = (path) => '../'.repeat(path.split('/').filter(Boolean).length) || './';

for (const route of ROUTES) {
  if (route.path == null || route.path.includes(':')) continue;
  await emit(join(route.path, 'index.html'), page({ route, path: route.path, base: baseFor(route.path), title: route.title, desc: route.desc }));
}
const post = byId('post');
for (const p of POSTS) {
  const path = `blog/${p.slug}/`;
  await emit(join(path, 'index.html'), page({ route: post, params: { slug: p.slug }, path, base: baseFor(path), title: `${p.title} | UFMWiz`, desc: p.dek }));
}
// Served for any missing address, at any depth, so its base is absolute.
const nf = byId('notfound');
await emit('404.html', page({ route: nf, path: '404', base: '/', title: nf.title, desc: 'That page is not on UFMWiz.' }));

const urls = out.filter((f) => f.endsWith('index.html')).map((f) => `${SITE.origin}/${f.replace(/index\.html$/, '')}`);
await emit('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
await emit('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE.origin}/sitemap.xml\n`);
await emit('icon.svg', MARK_SVG + '\n');
console.log(`Wrote ${out.length} files:\n  ${out.join('\n  ')}`);
