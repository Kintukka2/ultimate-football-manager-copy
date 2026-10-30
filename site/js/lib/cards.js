// The card model, the CSV format and "My cards", the cards you own, kept in
// this browser. Card data is what a player can see on the card and types in
// or imports, as on FHCWiz. Nothing is taken from the game's files or servers.
//
// A card:
//   { id, name, ovr, pos: ['CM', 'CAM'], quality, rarity, nation, league, club,
//     age, stats: { pac, sho, pas, drb, def, phy } | { div, han, kck, ref, spd, gkp },
//     sellable, source: 'mine' | 'db' }

import { POSITIONS, statsFor } from '../data/football.js';
import { QUALITIES, RARITIES } from '../data/rarities.js';
import { uid, load, save } from './util.js';

const QUALITY_IDS = new Set(QUALITIES.map((q) => q.id));
const RARITY_IDS = new Set(RARITIES.map((r) => r.id));
const STAT_KEYS = ['pac', 'sho', 'pas', 'drb', 'def', 'phy', 'div', 'han', 'kck', 'ref', 'spd', 'gkp'];

const slug = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Accept a rarity or quality by id or by the name the card shows.
function pick(value, ids, list) {
  const v = slug(value);
  if (ids.has(v)) return v;
  const hit = list.find((x) => slug(x.name) === v || slug(x.short) === v);
  return hit ? hit.id : null;
}

// Make any loose object into a card, and say what is wrong with it.
export function normalize(raw) {
  const errors = [];
  const name = String(raw.name ?? '').trim();
  if (!name) errors.push('A card needs a name.');
  const ovr = Number(raw.ovr);
  if (!Number.isInteger(ovr) || ovr < 1 || ovr > 99) errors.push('OVR is a whole number from 1 to 99.');
  let pos = Array.isArray(raw.pos) ? raw.pos : String(raw.pos ?? raw.position ?? '').split(/[\s,/|;]+/);
  pos = [...new Set(pos.map((p) => String(p).trim().toUpperCase()).filter(Boolean))];
  const badPos = pos.filter((p) => !POSITIONS.includes(p));
  if (!pos.length) errors.push('A card needs a position.');
  if (badPos.length) errors.push(`Unknown position: ${badPos.join(', ')}. Use ${POSITIONS.join(', ')}.`);
  const quality = raw.quality ? pick(raw.quality, QUALITY_IDS, QUALITIES) : 'gold';
  if (!quality) errors.push(`Unknown quality "${raw.quality}".`);
  const rarity = raw.rarity ? pick(raw.rarity, RARITY_IDS, RARITIES) : 'normal';
  if (!rarity) errors.push(`Unknown rarity "${raw.rarity}".`);
  const stats = {};
  const src = raw.stats || raw;
  for (const { key } of statsFor(pos[0])) {
    const v = src[key];
    if (v === undefined || v === null || v === '') continue;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1 || n > 99) errors.push(`${key.toUpperCase()} is a whole number from 1 to 99.`);
    else stats[key] = n;
  }
  const age = raw.age === undefined || raw.age === '' || raw.age === null ? null : Number(raw.age);
  const card = {
    id: raw.id || uid(),
    name, ovr, pos: pos.filter((p) => POSITIONS.includes(p)),
    quality: quality || 'gold', rarity: rarity || 'normal',
    nation: String(raw.nation ?? '').trim(),
    league: String(raw.league ?? '').trim(),
    club: String(raw.club ?? '').trim(),
    age: Number.isFinite(age) ? age : null,
    stats,
    sellable: !(raw.sellable === false || /^(no|false|0|unsellable)$/i.test(String(raw.sellable ?? ''))),
  };
  return { card, errors };
}

// ---- CSV: one card per row, with a header row ------------------------------
export const CSV_COLUMNS = ['name', 'ovr', 'position', 'quality', 'rarity', 'nation', 'league', 'club', 'age', ...STAT_KEYS, 'sellable'];

export function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

// Returns { cards, problems: ["Row 4: OVR is ..."] }. Rows with problems are skipped.
export function cardsFromCSV(text) {
  const rows = parseCSV(text);
  if (!rows.length) return { cards: [], problems: ['The file is empty.'] };
  const head = rows[0].map((h) => slug(h).replace(/-/g, ''));
  const alias = { pos: 'position', positions: 'position', rating: 'ovr', overall: 'ovr', nationality: 'nation', team: 'club', gkpos: 'gkp', speed: 'spd' };
  const cols = head.map((h) => alias[h] || h);
  if (!cols.includes('name') || !cols.includes('ovr')) return { cards: [], problems: ['The first row must name the columns, with at least name, ovr and position.'] };
  const cards = [], problems = [];
  rows.slice(1).forEach((r, i) => {
    const raw = {};
    cols.forEach((c, j) => { raw[c] = (r[j] ?? '').trim(); });
    const { card, errors } = normalize(raw);
    if (errors.length) problems.push(`Row ${i + 2}: ${errors[0]}`);
    else cards.push(card);
  });
  return { cards, problems };
}

export function cardsToCSV(cards) {
  const cell = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [CSV_COLUMNS.join(',')];
  for (const c of cards) {
    lines.push(CSV_COLUMNS.map((k) => {
      if (k === 'position') return cell(c.pos.join(' '));
      if (k === 'sellable') return c.sellable ? 'yes' : 'no';
      if (STAT_KEYS.includes(k)) return cell(c.stats?.[k]);
      return cell(c[k]);
    }).join(','));
  }
  return lines.join('\n') + '\n';
}

// ---- My cards --------------------------------------------------------------
const KEY = 'mycards';
const listeners = new Set();
let mine = null;

function read() {
  if (!mine) mine = (load(KEY, []) || []).map((c) => normalize(c).card);
  return mine;
}
function write() {
  save(KEY, mine);
  listeners.forEach((fn) => fn(mine));
}

export const myCards = {
  all: () => read().map((c) => ({ ...c, source: 'mine' })),
  get: (id) => read().find((c) => c.id === id) || null,
  upsert(card) {
    read();
    const i = mine.findIndex((c) => c.id === card.id);
    const clean = { ...card }; delete clean.source;
    if (i >= 0) mine[i] = clean; else mine.push(clean);
    write();
    return clean;
  },
  addMany(cards) { read(); mine.push(...cards.map((c) => ({ ...c, id: uid() }))); write(); },
  remove(ids) {
    const drop = new Set([].concat(ids));
    mine = read().filter((c) => !drop.has(c.id));
    write();
  },
  clear() { mine = []; write(); },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

// ---- the card database -----------------------------------------------------
// data/cards.json, maintained by hand or from players' submissions. It ships
// empty: no card ratings were taken from the game.
let db = null;
export async function databaseCards() {
  if (db) return db;
  try {
    const res = await fetch('data/cards.json', { cache: 'no-cache' });
    const json = res.ok ? await res.json() : { cards: [] };
    db = (json.cards || []).map((c) => ({ ...normalize(c).card, source: 'db' }));
  } catch { db = []; }
  return db;
}

// ---- reading a card --------------------------------------------------------
export const primary = (c) => c.pos[0];
export const fitFor = (c, slotPos) => (!c ? null : c.pos[0] === slotPos ? 'fits' : c.pos.includes(slotPos) ? 'near' : 'wrong');

export function matchesQuery(c, q) {
  if (!q) return true;
  const hay = `${c.name} ${c.club} ${c.nation} ${c.league} ${c.pos.join(' ')}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
}
