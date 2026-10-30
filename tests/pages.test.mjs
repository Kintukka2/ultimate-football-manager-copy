// The card database as pages: a page per card, a hub per special rarity,
// club and position, the indexes and the best cards. Built in memory from
// made-up cards (tests/fixtures/cards.json), so nothing here touches the
// committed site, and once more from the real, committed database.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { buildFiles, loadCards } from '../tools/build.mjs';
import { cardSlugs } from '../site/js/lib/carddb.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'site');
const FIXTURE = join(ROOT, 'tests/fixtures/cards.json');
const exists = (f) => access(f).then(() => true, () => false);
const byRel = (files) => Object.fromEntries(files.map((f) => [f.rel, f.content]));

async function brokenLinks(files) {
  const have = byRel(files);
  const broken = [];
  for (const f of files.filter((x) => x.rel.endsWith('.html'))) {
    const html = f.content.replace(/<base [^>]+>/, '');
    for (const [, h] of html.matchAll(/\s(?:href|src)="([^"#]+)"/g)) {
      if (/^(https?:|data:|mailto:|\/)/.test(h)) continue;
      const clean = h.split('?')[0];
      const rel = clean === './' ? 'index.html' : clean.endsWith('/') ? clean + 'index.html' : clean;
      if (!(rel in have) && !(await exists(join(SITE, rel)))) broken.push(`${f.rel} -> ${h}`);
    }
  }
  return broken;
}

test('an empty database builds clean: the indexes say so, and no card page is written', async () => {
  const files = buildFiles({ cards: [] });
  const rels = files.map((f) => f.rel);
  for (const p of ['ufm27/best-cards/', 'ufm27/rarities/', 'ufm27/clubs/', 'ufm27/positions/', 'ufm27/compare/']) {
    assert.ok(rels.includes(p + 'index.html'), `${p} is written`);
  }
  assert.ok(!rels.some((r) => /^ufm27\/players\/[^/]+\/index\.html$/.test(r)), 'no card pages');
  assert.match(byRel(files)['ufm27/best-cards/index.html'], /no cards in the database yet/);
  assert.match(byRel(files)['ufm27/rarities/index.html'], /Team of the Week/, 'the rarities index lists every set even before it has cards');
  assert.deepEqual(await brokenLinks(files), []);
});

test('the fixture: a page for every card and hub, every link landing on a page', async () => {
  const cards = await loadCards(FIXTURE);
  const files = buildFiles({ cards });
  const html = byRel(files);
  const slugs = cardSlugs(cards);
  for (const c of cards) assert.ok(`ufm27/players/${slugs[c.id]}/index.html` in html, `${c.name} has a page`);
  for (const h of ['ufm27/rarities/team-of-the-week/', 'ufm27/rarities/screamers/', 'ufm27/clubs/test-fc/', 'ufm27/clubs/demo-city/', 'ufm27/positions/st/', 'ufm27/positions/gk/']) {
    assert.ok(`${h}index.html` in html, `${h} is written`);
  }
  assert.ok(!('ufm27/rarities/normal/index.html' in html), 'base cards have no rarity hub');
  assert.deepEqual(await brokenLinks(files), []);
  const sitemap = html['sitemap.xml'];
  for (const c of cards) assert.ok(sitemap.includes(`/ufm27/players/${slugs[c.id]}/</loc>`), `${c.name} is in the sitemap`);
});

test('every page has its own title and canonical', async () => {
  const files = buildFiles({ cards: await loadCards(FIXTURE) });
  const pages = files.filter((f) => f.rel.endsWith('index.html'));
  const titles = pages.map((f) => f.content.match(/<title>([^<]*)<\/title>/)[1]);
  const canon = pages.map((f) => f.content.match(/<link rel="canonical" href="([^"]+)"/)[1]);
  assert.equal(new Set(titles).size, titles.length, 'titles are unique');
  assert.equal(new Set(canon).size, canon.length, 'canonicals are unique');
  for (const f of pages) {
    const want = 'https://ufmwiz.com/' + f.rel.replace(/index\.html$/, '');
    assert.ok(f.content.includes(`<link rel="canonical" href="${want}">`), `${f.rel} canonical`);
  }
});

test('a card page says what the card holds, and nothing it does not', async () => {
  const cards = await loadCards(FIXTURE);
  const html = byRel(buildFiles({ cards }));
  const totw = html['ufm27/players/test-striker-team-of-the-week/index.html'];
  assert.match(totw, /<title>Test Striker 90 Team of the Week \| UFM 27 card ratings and stats \| UFMWiz<\/title>/);
  assert.match(totw, /Unsellable/);
  assert.match(totw, /href="ufm27\/players\/test-striker\/"/, 'links its other version');
  assert.match(totw, /href="ufm27\/rarities\/team-of-the-week\/"/, 'links its set');
  assert.match(totw, /<b>91<\/b><span>Pace<\/span>/);
  assert.match(totw, /1st <small>of 3<\/small>/, 'the best of the three strikers');
  // A card with no stats captured shows dashes, never a number.
  const blank = html['ufm27/players/unicode-name/index.html'];
  assert.ok(blank, 'an accented name still gets a plain address');
  assert.equal((blank.match(/<div class="stattile"><b>–<\/b>/g) || []).length, 6);
  assert.doesNotMatch(blank, /, with PAC/, 'no stats in the description either');
  // No price is ever written into a page: prices are the reader's own.
  assert.doesNotMatch(totw, /\d[\d,]* coins/);
});

test('hubs and the best cards rank by OVR, then the stat total', async () => {
  const html = byRel(buildFiles({ cards: await loadCards(FIXTURE) }));
  const order = (page) => [...page.matchAll(/class="lrow pl-row cp-row" href="ufm27\/players\/([^/]+)\//g)].map((m) => m[1]);
  assert.deepEqual(order(html['ufm27/positions/st/index.html']), ['test-striker-team-of-the-week', 'test-striker', 'trial-forward']);
  assert.deepEqual(order(html['ufm27/rarities/team-of-the-week/index.html']), ['test-striker-team-of-the-week', 'sample-winger-team-of-the-week']);
  const best = html['ufm27/best-cards/index.html'];
  assert.equal(order(best)[0], 'test-striker-team-of-the-week');
  assert.match(best, /The best Unsellable cards/);
});

test('card addresses are stable and unique', () => {
  const c = (id, name, ovr, pos, rarity = 'normal', quality = 'gold') => ({ id, name, ovr, pos: [pos], rarity, quality });
  const s = cardSlugs([c('a', 'Test Player', 80, 'ST'), c('b', 'Test Player', 84, 'ST'), c('c', 'Test Player', 84, 'CF' === 'x' ? 'ST' : 'RW'), c('d', 'Other One', 70, 'CB', 'screamers')]);
  assert.equal(s.a, 'test-player-80');
  assert.equal(s.b, 'test-player-84-st');
  assert.equal(s.c, 'test-player-84-rw');
  assert.equal(s.d, 'other-one-screamers');
  assert.equal(new Set(Object.values(s)).size, 4);
});

test('the made-up cards never reach the committed database', async () => {
  const real = await readFile(join(SITE, 'data/cards.json'), 'utf8');
  const fixture = JSON.parse(await readFile(FIXTURE, 'utf8'));
  for (const c of fixture.cards) assert.ok(!real.includes(`"${c.name}"`), `${c.name} is a test card`);
});

test('the committed site is what the build writes', () => {
  const r = spawnSync(process.execPath, [join(ROOT, 'tools/build.mjs'), '--check'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
});

test('the capture sheet splits into published, pending and for a human', async () => {
  const { split, cardsJSON, pendingMD } = await import('../tools/build-cards.mjs');
  const csv = [
    'name,ovr,position,quality,rarity,club,pac,sho,pas,drb,def,phy,sellable,contributor,captured',
    'Test Striker,86,ST,Gold Rare,,Test FC,88,87,72,80,40,79,yes,TesterOne,2026-10-29',
    'Test Striker,90,ST RW,Gold,Team of the Week,Test FC,91,92,75,84,42,81,no,tester_two,2026-10-30',
    'Waiting Winger,,LW,Gold,Team of the Week,Sample United,,,,,,,,TesterOne,',
    'No Position,77,,Gold,,,,,,,,,,,',
    'Bad Rating,120,ST,Gold,,,,,,,,,,,',
    'Bad Spot,70,LWB,Gold,,,,,,,,,,,',
    'Test Striker,86,ST,Gold Rare,,Test FC,88,87,72,80,40,79,yes,Someone,',
    ',80,ST,,,,,,,,,,,,',
  ].join('\n');
  const parts = split(csv);
  assert.deepEqual(parts.cards.map((x) => x.card.id), ['test-striker', 'test-striker-team-of-the-week']);
  assert.deepEqual(parts.pending.map((p) => [p.raw.name, p.missing.join('+')]), [['Waiting Winger', 'OVR'], ['No Position', 'position']]);
  assert.deepEqual(parts.human.map((h) => h.line), [6, 7, 8, 9]);
  assert.match(parts.human[2].problem, /same card as row 2/);
  const json = JSON.parse(cardsJSON(parts));
  assert.equal(json.asOf, '2026-10-30');
  assert.equal(json.cards.find((c) => c.id === 'test-striker').contributor, 'TesterOne', 'contributors keep their own spelling');
  assert.equal(cardsJSON(parts), cardsJSON(split(csv)), 'the same sheet always writes the same file');
  assert.match(pendingMD(parts), /\| 4 \| Waiting Winger \| LW \| Sample United \| OVR \| TesterOne \|/);
});

test('the committed card database is what the sheet writes', () => {
  const r = spawnSync(process.execPath, [join(ROOT, 'tools/build-cards.mjs'), '--check'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
});
