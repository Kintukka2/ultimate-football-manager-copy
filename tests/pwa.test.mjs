// The site as an installed app, against a real origin: a service worker
// can't register on file://. "Works offline" is the one claim a PWA makes
// that fails silently: nothing on screen changes when the worker stops
// caching, and you find out from somebody on a train. The same goes for the
// version keying: a release that stopped evicting the last one's cache would
// leave returning visitors on old code with nothing to show for it.
//
// Skipped, not failed, where Playwright isn't installed. CI installs it.

import test from 'node:test';
import assert from 'node:assert/strict';
import { serve, loadPlaywright } from '../tools/browser-check.mjs';
import { writeServiceWorker } from '../tools/sw.mjs';
import { SITE } from '../site/js/data/routes.js';
import { POSTS } from '../site/js/data/posts.js';

const pw = loadPlaywright();
const SHELL = `ufmwiz-shell-v${SITE.version}`;

test('the precache list matches the built site and its version', async () => {
  const r = await writeServiceWorker({ check: true });
  assert.equal(r.changed, false, 'site/sw.js is stale: run node tools/build.mjs');
  assert.equal(r.version, SITE.version);
  assert.ok(r.count > 20, `the worker precaches the whole shell (${r.count} entries)`);
});

test('installed and offline', { skip: !pw && 'Playwright is not installed' }, async (t) => {
  const server = await serve();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await pw.chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  t.after(async () => { await browser.close(); server.close(); });

  const activated = () => page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    // `ready` resolves as soon as there is an active worker, which can still
    // be mid-activate. Wait for the state rather than reading it once.
    const w = reg.active;
    if (w && w.state !== 'activated') {
      await new Promise((done) => {
        const check = () => { if (w.state === 'activated') done(); };
        w.addEventListener('statechange', check);
        check();
      });
    }
    return { scope: reg.scope, state: w && w.state };
  });

  await t.test('the manifest is installable and its icons exist', async () => {
    const res = await page.goto(`${origin}/manifest.json`);
    assert.equal(res.status(), 200);
    const m = JSON.parse(await res.text());
    for (const k of ['name', 'short_name', 'start_url', 'display', 'icons']) assert.ok(m[k], `the manifest states ${k}`);
    assert.equal(m.display, 'standalone');
    assert.ok(m.short_name.length <= 12, 'short_name fits under an icon');
    assert.ok(m.icons.some((i) => String(i.purpose).includes('maskable')), 'one icon is maskable, or Android crops the board');
    for (const size of ['192x192', '512x512']) assert.ok(m.icons.some((i) => i.sizes === size), `there is a ${size}`);
    for (const icon of m.icons) assert.equal((await page.request.get(new URL(icon.src, `${origin}/`).href)).status(), 200, `${icon.src} is there`);
  });

  await t.test('the worker registers and controls every page', async () => {
    await page.goto(`${origin}/`);
    const reg = await activated();
    assert.equal(reg.state, 'activated');
    assert.equal(new URL(reg.scope).pathname, '/', 'its scope is the whole site, blog included');
  });

  await t.test('the shell cache is named for this version', async () => {
    const names = await page.evaluate(() => caches.keys());
    assert.ok(names.includes(SHELL), `a cache named ${SHELL}, got ${JSON.stringify(names)}`);
  });

  await t.test('nothing from another origin is cached but the fonts', async () => {
    const urls = await page.evaluate(async () => {
      const out = [];
      for (const name of await caches.keys()) {
        if (name === 'ufmwiz-fonts') continue;
        for (const req of await (await caches.open(name)).keys()) out.push(req.url);
      }
      return out;
    });
    const foreign = urls.filter((u) => new URL(u).origin !== origin);
    assert.deepEqual(foreign, []);
  });

  await t.test('the site still opens, and is this version, with the network cut', async () => {
    await page.reload({ waitUntil: 'networkidle' });
    await context.setOffline(true);
    try {
      for (const path of ['/', '/ufm27/weekend-league/', `/blog/${POSTS[0].slug}/`]) {
        const res = await page.goto(origin + path, { waitUntil: 'domcontentloaded' });
        assert.equal(res?.status(), 200, `${path} came from the cache`);
        const html = await page.content();
        assert.ok(html.includes(`?v=${SITE.version}`), `${path} is v${SITE.version}, not a stale copy`);
        await page.waitForSelector('main:not([hidden]) .view__body *', { timeout: 5000 });
      }
      const text = await page.textContent('main:not([hidden])');
      assert.ok(text.includes(POSTS[0].title.split(':')[0]), 'the post is the post, not a fallback');
    } finally {
      await context.setOffline(false);
    }
  });

  await t.test('a release evicts the cache the release before it left', async () => {
    await page.goto(`${origin}/`);
    const seeded = await page.evaluate(async () => {
      await caches.open('ufmwiz-shell-v0.0.1');
      await caches.open('ufmwiz-fonts');
      await (await navigator.serviceWorker.getRegistration()).unregister();
      return caches.keys();
    });
    assert.ok(seeded.includes('ufmwiz-shell-v0.0.1'), 'the stale cache was seeded');
    await page.goto(`${origin}/`);
    await activated();
    const after = await page.evaluate(async () => {
      // Activate deletes the old caches before clients.claim(), but the
      // promise can resolve a tick before the delete lands.
      for (let i = 0; i < 40; i++) {
        const names = await caches.keys();
        if (!names.includes('ufmwiz-shell-v0.0.1')) return names;
        await new Promise((r) => setTimeout(r, 50));
      }
      return caches.keys();
    });
    assert.ok(!after.includes('ufmwiz-shell-v0.0.1'), 'the old release is gone');
    assert.ok(after.includes(SHELL), 'this release is there');
    assert.ok(after.includes('ufmwiz-fonts'), 'and the fonts, which belong to no release, are kept');
  });
});
