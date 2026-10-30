// Compare: two to four cards side by side. Pure, so it is tested without a
// page; the view is views/compare.js.
//
// What gets compared is what every card shares. Outfield cards share all six
// sub-stats; a keeper shares only PAC with an outfield card (his Speed prints
// as PAC on the card), so that is the one stat row they get. OVR always
// compares. The focus is one shared stat, or two added together.

import { statsFor } from '../data/football.js';

export const MAX = 4;

const statsOf = (c) => statsFor(c?.pos?.[0]);
const num = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));

// Stats travel by the label the card prints, so a keeper's Speed and an
// outfield card's Pace meet on PAC.
export const statByLabel = (c, label) => {
  const d = statsOf(c).find((s) => s.label === label);
  return d ? num(c.stats?.[d.key]) : null;
};

// The labels every card shows, in the first card's order.
export function sharedStats(cards) {
  if (!cards?.length) return [];
  return statsOf(cards[0]).map((s) => s.label).filter((l) => cards.every((c) => statsOf(c).some((s) => s.label === l)));
}

const NAMES = {};
for (const pos of ['ST', 'GK']) for (const s of statsFor(pos)) NAMES[s.label] = NAMES[s.label] || s.name;
NAMES.PAC = 'Pace';
export const statName = (label) => NAMES[label] || label;

// Each shared stat on its own, then each pair: PAC, SHO, ..., PAC + SHO, ...
export function focusOptions(shared) {
  const out = (shared || []).map((l) => [l]);
  for (let i = 0; i < shared.length; i++) for (let j = i + 1; j < shared.length; j++) out.push([shared[i], shared[j]]);
  return out.map((keys) => ({ id: keys.join('+'), keys, label: keys.join(' + ') }));
}

// The highest value in a row, or null when it marks no one: fewer than two
// values to weigh, or every card level on it.
export function bestOf(values) {
  const nums = values.filter((v) => typeof v === 'number');
  if (nums.length < 2) return null;
  const hi = Math.max(...nums);
  return nums.every((v) => v === hi) ? null : hi;
}

const sumOf = (c, keys) => {
  const vals = keys.map((k) => statByLabel(c, k));
  return vals.every((v) => v !== null) ? vals.reduce((a, b) => a + b, 0) : null;
};

// The comparison. `ratings` is OVR and the shared stats, plus a row for a
// pair in focus; `top` is every card on the focus row's highest value, and
// empty when there is no focus or every card is level on it.
export function compare(cards, focusId = '') {
  cards = cards || [];
  const shared = sharedStats(cards);
  const focus = focusOptions(shared).find((o) => o.id === focusId) || null;
  const ratings = [{ kind: 'ovr', key: 'OVR', label: 'OVR', name: 'Overall', vals: cards.map((c) => num(c.ovr)) }];
  for (const l of shared) ratings.push({ kind: 'stat', key: l, label: l, name: statName(l), vals: cards.map((c) => statByLabel(c, l)) });
  if (focus && focus.keys.length > 1) {
    ratings.push({ kind: 'sum', key: focus.id, label: focus.label, name: focus.keys.map(statName).join(' + '), vals: cards.map((c) => sumOf(c, focus.keys)) });
  }
  for (const r of ratings) { r.best = bestOf(r.vals); r.focus = !!focus && r.key === focus.id; }
  const focusRow = ratings.find((r) => r.focus) || null;
  let top = [], value = null;
  if (focusRow) {
    const nums = focusRow.vals.filter((v) => typeof v === 'number');
    if (nums.length) {
      value = Math.max(...nums);
      focusRow.vals.forEach((v, i) => { if (v === value) top.push(i); });
    }
    if (top.length === cards.length) top = [];
  }
  // By how much the leader leads: the gap to the next best value.
  const rest = focusRow ? focusRow.vals.filter((v, i) => typeof v === 'number' && !top.includes(i)) : [];
  const margin = top.length && rest.length ? value - Math.max(...rest) : null;
  return {
    shared, focus, ratings, focusRow, top, value, margin,
    level: !!focusRow && value !== null && !top.length,
    mixed: cards.some((c) => statsOf(c) !== statsOf(cards[0])),
  };
}

// ---- what the page keeps ---------------------------------------------------
// The picks by where they came from and their id: { src: 'db' | 'mine', id }.
export function normalizePicks(raw) {
  const out = [];
  for (const p of Array.isArray(raw) ? raw : []) {
    if (!p || (p.src !== 'db' && p.src !== 'mine') || typeof p.id !== 'string' || !p.id) continue;
    if (out.some((x) => x.src === p.src && x.id === p.id) || out.length >= MAX) continue;
    out.push({ src: p.src, id: p.id });
  }
  return out;
}

// ---- the link --------------------------------------------------------------
// A comparison travels as ?cards=<card page>,<card page>&focus=pac-sho: the
// cards by the address of their own page, which a reader can read in the
// link. Only database cards have a page; a card from My cards stays on the
// device it was typed into.
export function linkQuery(cards, focusId, slugs) {
  const parts = cards.map((c) => (c.source === 'db' ? slugs[c.id] : null)).filter(Boolean);
  if (!parts.length) return '';
  return 'cards=' + parts.join(',') + (focusId ? '&focus=' + focusId.toLowerCase().replace('+', '-') : '');
}

// A link read back: the database picks it names, in its order, and its focus.
// Anything it names that the database doesn't hold is skipped.
export function readQuery(search, dbCards, slugs) {
  const params = new URLSearchParams(String(search || '').replace(/^\?/, ''));
  const list = params.get('cards');
  if (!list) return null;
  const bySlug = {};
  for (const c of dbCards || []) if (slugs[c.id]) bySlug[slugs[c.id]] = c.id;
  const picks = [];
  for (const s of list.split(',')) {
    const id = bySlug[s.trim().toLowerCase()];
    if (id && !picks.some((p) => p.id === id) && picks.length < MAX) picks.push({ src: 'db', id });
  }
  if (!picks.length) return null;
  const focus = String(params.get('focus') || '').toUpperCase().replace('-', '+');
  return { picks, focus: /^[A-Z]{3}(\+[A-Z]{3})?$/.test(focus) ? focus : '' };
}
