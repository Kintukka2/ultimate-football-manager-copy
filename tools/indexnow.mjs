// Tells Bing (and every other IndexNow engine: Yandex, Seznam, Naver) which
// pages exist, so a new post is picked up within hours of a release rather
// than whenever the crawler next comes round. Google doesn't take part; it
// reads sitemap.xml and nothing else.
//
// How IndexNow proves the request is ours: the key below is served as a plain
// text file at the site root, and the engine fetches it before it believes
// the list. The key is public by design (it proves control of the domain, not
// identity), so it lives in the repo like any other file.
//
// It runs on its own when a release is published (.github/workflows/
// indexnow.yml). By then the release's pull request has merged and Cloudflare
// is deploying it, so the script first waits for the live site to carry this
// release's version: sending the list before the deploy lands would point the
// engines at pages that aren't there yet.
//
//   node tools/indexnow.mjs            wait for the deploy, then send
//   node tools/indexnow.mjs --dry-run  print what would be sent

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SITE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'site');
export const ORIGIN = 'https://ufmwiz.com';
export const HOST = 'ufmwiz.com';
export const KEY = 'dc044d447b3caf5aba6be349c7df3811';
export const KEY_FILE = `${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

// Every page in the sitemap, which is already the list of what a crawler
// should read. No second list that could disagree with it.
export async function urls() {
  const xml = await readFile(join(SITE_DIR, 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

export async function payload() {
  return { host: HOST, key: KEY, keyLocation: `${ORIGIN}/${KEY_FILE}`, urlList: await urls() };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The live front page carries the version in its asset URLs, so seeing
// ?v=<this version> there means the deploy has landed. Ten minutes is far
// longer than a Pages deploy takes; past it, something else is wrong.
async function waitForDeploy(version) {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`${ORIGIN}/`, { cache: 'no-store' });
      if (res.ok && (await res.text()).includes(`?v=${version}`)) return true;
    } catch { /* not up yet */ }
    await sleep(30000);
  }
  return false;
}

async function main() {
  const body = await payload();
  if (process.argv.includes('--dry-run')) { console.log(JSON.stringify(body, null, 2)); return; }
  const { SITE } = await import(pathToFileURL(join(SITE_DIR, 'js/data/routes.js')).href);
  if (!(await waitForDeploy(SITE.version))) {
    console.error(`indexnow: the live site never showed v${SITE.version}; nothing sent.`);
    process.exit(1);
  }
  // The engine checks this file itself; checking it here first turns a quiet
  // rejection on their side into a clear failure on ours.
  const live = await fetch(`${ORIGIN}/${KEY_FILE}`, { cache: 'no-store' });
  if ((live.ok ? (await live.text()).trim() : '') !== KEY) {
    console.error(`indexnow: ${ORIGIN}/${KEY_FILE} does not serve the key; nothing sent.`);
    process.exit(1);
  }
  const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });
  // 200 is accepted; 202 is accepted with the key still being checked.
  if (res.status !== 200 && res.status !== 202) {
    console.error(`indexnow: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  console.log(`indexnow: sent ${body.urlList.length} URLs for v${SITE.version} (${res.status})`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
