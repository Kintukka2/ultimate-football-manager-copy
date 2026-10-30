// Turns the card capture sheet, data/ufm27-extraction.csv, into the card
// database the site ships, site/data/cards.json. The sheet is what players
// read off their own cards and sent in (docs/data/card-submission.md); this
// splits its rows three ways:
//
//   published  a name, an OVR and a position that the card model accepts.
//              Goes into site/data/cards.json. Stats are not required: a
//              card page shows a dash for a stat nobody captured, and the
//              tools work off OVR, position, quality, rarity, nation, league
//              and club.
//   pending    a player we know about but can't show yet: no OVR, or no
//              position. Listed in docs/data/pending-cards.md with what it is
//              missing, ready to publish the moment that arrives.
//   a human    a row the model refuses (an OVR of 120, a position the game
//              doesn't have, the same card twice). Listed too, with why.
//
// The sheet is the only source: site/data/cards.json is written, never
// edited. A card's id is its page's address, so it is stable from build to
// build for as long as the card is.
//
//   node tools/build-cards.mjs           rewrite the two outputs
//   node tools/build-cards.mjs --check   fail if either is stale (CI)

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseCSV, normalize } from '../site/js/lib/cards.js';
import { cardSlugs } from '../site/js/lib/carddb.js';
import { rarity as rarityOf } from '../site/js/data/rarities.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CSV = join(ROOT, 'data/ufm27-extraction.csv');
const JSON_OUT = join(ROOT, 'site/data/cards.json');
const PENDING = join(ROOT, 'docs/data/pending-cards.md');

// The sheet's columns: the card as it prints, then who sent it, from where
// and when. Older sheets may name a column the way the in-app CSV does
// ("pos", "rating", "team"); those are read the same.
export const COLUMNS = ['name', 'ovr', 'position', 'quality', 'rarity', 'nation', 'league', 'club', 'age',
  'pac', 'sho', 'pas', 'drb', 'def', 'phy', 'div', 'han', 'kck', 'ref', 'spd', 'gkp', 'sellable',
  'contributor', 'source', 'captured', 'notes'];
const ALIAS = { pos: 'position', positions: 'position', rating: 'ovr', overall: 'ovr', nationality: 'nation', team: 'club', gkpos: 'gkp', speed: 'spd', handle: 'contributor', date: 'captured' };

const ABOUT = 'The UFMWiz card database. Every card here was read off a card in the game by a player and sent in; none was taken from the game\'s files or servers. Written by node tools/build-cards.mjs from data/ufm27-extraction.csv: do not edit by hand.';

export function split(text) {
  const rows = parseCSV(text);
  if (!rows.length) return { cards: [], pending: [], human: [] };
  const head = rows[0].map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, '')).map((h) => ALIAS[h] || h);
  const cards = [], pending = [], human = [];
  const seen = new Map();
  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const raw = {};
    head.forEach((h, j) => { raw[h] = (r[j] ?? '').trim(); });
    const from = raw.contributor || '';
    if (!raw.name) { human.push({ line, name: '', problem: 'No player name.' }); return; }
    const missing = [!raw.ovr && 'OVR', !raw.position && 'position'].filter(Boolean);
    if (missing.length) { pending.push({ line, raw, missing, from }); return; }
    const { card, errors } = normalize({ ...raw, id: 'x' });
    if (errors.length) { human.push({ line, name: raw.name, problem: errors[0] }); return; }
    const key = [card.name.toLowerCase(), card.rarity, card.quality, card.ovr, card.pos[0]].join('|');
    if (seen.has(key)) { human.push({ line, name: card.name, problem: `The same card as row ${seen.get(key)}.` }); return; }
    seen.set(key, line);
    cards.push({ card, meta: { contributor: from, source: raw.source || '', captured: raw.captured || '' } });
  });
  // Ids are the page addresses, worked out over every published card at once.
  const slugs = cardSlugs(cards.map((x, i) => ({ ...x.card, id: String(i) })));
  cards.forEach((x, i) => { x.card.id = slugs[String(i)]; });
  cards.sort((a, b) => (a.card.id < b.card.id ? -1 : 1));
  return { cards, pending, human };
}

export function cardsJSON({ cards }) {
  const dates = cards.map((x) => x.meta.captured).filter(Boolean).sort();
  const rowsOut = cards.map(({ card, meta }) => {
    const out = { id: card.id, name: card.name, ovr: card.ovr, pos: card.pos, quality: card.quality, rarity: card.rarity };
    for (const k of ['nation', 'league', 'club']) if (card[k]) out[k] = card[k];
    if (card.age) out.age = card.age;
    out.stats = card.stats;
    out.sellable = card.sellable;
    for (const k of ['contributor', 'captured']) if (meta[k]) out[k] = meta[k];
    return '    ' + JSON.stringify(out);
  });
  return `{\n  "about": ${JSON.stringify(ABOUT)},\n  "asOf": ${JSON.stringify(dates.at(-1) || null)},\n  "cards": [${rowsOut.length ? '\n' + rowsOut.join(',\n') + '\n  ' : ''}]\n}\n`;
}

const cell = (s) => String(s ?? '').replace(/\|/g, '\\|');

export function pendingMD({ cards, pending, human }) {
  const groups = {};
  for (const p of pending) {
    const set = p.raw.rarity ? rarityOf(p.raw.rarity.toLowerCase().replace(/[^a-z0-9]+/g, '-')).name : 'Base';
    (groups[set] = groups[set] || []).push(p);
  }
  let md = `# Cards we know about but can't show yet

Generated by \`node tools/build-cards.mjs\` from \`data/ufm27-extraction.csv\`.
Don't edit this by hand: fill the gap in the sheet instead, and the card moves
into the database on the next build.

A card reaches the database when it has a name, an **OVR** and a **position**.
Stats are not required: a card page shows a dash for a stat nobody captured.

| | Cards |
|---|---|
| In the database | ${cards.length} |
| Waiting here for an OVR or a position | ${pending.length} |
| Needs a human | ${human.length} |
`;
  md += '\n## Waiting for an OVR or a position\n';
  if (!pending.length) md += '\nNone.\n';
  for (const set of Object.keys(groups).sort()) {
    md += `\n### ${set} (${groups[set].length})\n\n| Row | Player | Position | Club | Missing | Sent by |\n|---|---|---|---|---|---|\n`;
    for (const p of groups[set]) md += `| ${p.line} | ${cell(p.raw.name)} | ${cell(p.raw.position || '—')} | ${cell(p.raw.club || '—')} | ${p.missing.join(', ')} | ${cell(p.from || '—')} |\n`;
  }
  md += '\n## Needs a human\n\n';
  md += human.length ? `| Row | Player | Why |\n|---|---|---|\n${human.map((h) => `| ${h.line} | ${cell(h.name || '—')} | ${cell(h.problem)} |`).join('\n')}\n` : 'None.\n';
  return md;
}

async function main(argv) {
  const check = argv.includes('--check');
  const parts = split(await readFile(CSV, 'utf8'));
  const outputs = [[JSON_OUT, cardsJSON(parts)], [PENDING, pendingMD(parts)]];
  if (check) {
    const stale = [];
    for (const [file, content] of outputs) {
      let now = null;
      try { now = await readFile(file, 'utf8'); } catch { /* missing */ }
      if (now !== content) stale.push(file.slice(ROOT.length + 1));
    }
    if (stale.length) {
      console.error(`Stale: ${stale.join(', ')}. Run node tools/build-cards.mjs, then node tools/build.mjs, and commit.`);
      process.exit(1);
    }
    console.log(`Card database current: ${parts.cards.length} cards, ${parts.pending.length} pending, ${parts.human.length} for a human.`);
    return;
  }
  for (const [file, content] of outputs) await writeFile(file, content);
  console.log(`Wrote ${parts.cards.length} cards, ${parts.pending.length} pending, ${parts.human.length} for a human. Now run node tools/build.mjs.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main(process.argv.slice(2));
