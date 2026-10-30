// The generated site: every route has its page, every page points home from
// its depth, every internal link lands on a file, and the site's tokens are
// the Brand's tokens.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTES } from '../site/js/data/routes.js';
import { POSTS } from '../site/js/data/posts.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'site');
const exists = (f) => access(f).then(() => true, () => false);

const pages = [
  ...ROUTES.filter((r) => r.path != null && !r.path.includes(':')).map((r) => ({ path: r.path, title: r.title })),
  ...POSTS.map((p) => ({ path: `blog/${p.slug}/`, title: `${p.title} | UFMWiz` })),
];

test('every route has a page with its own title and a base back to the root', async () => {
  for (const p of pages) {
    const html = await readFile(join(SITE, p.path, 'index.html'), 'utf8');
    const depth = p.path.split('/').filter(Boolean).length;
    assert.match(html, new RegExp(`<base href="${depth ? '(\\.\\./){' + depth + '}' : '\\./'}">`), p.path);
    assert.ok(html.includes(`<title>${p.title.replace(/&/g, '&amp;')}</title>`), `${p.path} title`);
    assert.ok(html.includes('UFMWiz is an independent fan project.'), `${p.path} disclaimer`);
  }
});

test('internal links resolve to files that exist', async () => {
  for (const p of pages) {
    // Links resolve against the <base>, which is the site root, so drop the base itself.
    const html = (await readFile(join(SITE, p.path, 'index.html'), 'utf8')).replace(/<base [^>]+>/, '');
    const hrefs = [...html.matchAll(/\s(?:href|src)="([^"#]+)"/g)].map((m) => m[1])
      .filter((h) => !/^(https?:|data:|mailto:)/.test(h) && h !== p.path);
    for (const h of hrefs) {
      const clean = h.split('?')[0];
      const target = join(SITE, clean.endsWith('/') || clean === './' ? join(clean, 'index.html') : clean);
      assert.ok(await exists(target), `${p.path} links to missing ${h}`);
    }
  }
});

test('the site runs on the Brand tokens', async () => {
  const brand = (await readFile(join(ROOT, 'brand/ufmwiz-tokens.css'), 'utf8')).split('\n').filter((l) => !l.startsWith('@import')).join('\n');
  const site = await readFile(join(SITE, 'css/tokens.css'), 'utf8');
  assert.equal(site, brand, 'site/css/tokens.css has drifted from brand/ufmwiz-tokens.css');
});

test('no page uses a game screenshot or game art', async () => {
  for (const p of pages) {
    const html = await readFile(join(SITE, p.path, 'index.html'), 'utf8');
    assert.doesNotMatch(html, /screenshots\/|\.jpe?g"/, p.path);
  }
});
