// Filtering and sorting a list of cards, for the Players page. Pure, so the
// tests can hold it to the rules without a browser.

import { OUTFIELD_STATS, GK_STATS } from '../data/football.js';
import { matchesQuery } from './cards.js';

export const DEFAULT_FILTER = { q: '', pos: '', quality: '', rarity: '', ovrMin: '', ovrMax: '', sell: '', sort: 'ovr', dir: 'desc' };

export const SORTS = [
  { key: 'ovr', label: 'OVR' },
  { key: 'name', label: 'Name' },
  ...OUTFIELD_STATS.map((s) => ({ key: s.key, label: `${s.label} · ${s.name}` })),
  ...GK_STATS.map((s) => ({ key: s.key, label: `${s.name} (GK)` })),
];

const num = (v, fallback) => (v === '' || v == null || !Number.isFinite(Number(v)) ? fallback : Number(v));

// A position matches any position the card lists, not only its first: a CM
// who also plays CAM turns up under both.
export function filterCards(cards, f = DEFAULT_FILTER) {
  const min = num(f.ovrMin, -Infinity), max = num(f.ovrMax, Infinity);
  return cards.filter((c) => matchesQuery(c, f.q)
    && (!f.pos || c.pos.includes(f.pos))
    && (!f.quality || c.quality === f.quality)
    && (!f.rarity || c.rarity === f.rarity)
    && c.ovr >= min && c.ovr <= max
    && (!f.sell || (f.sell === 'yes') === c.sellable));
}

// Cards without the stat being sorted on (a keeper's PAC, a stat nobody typed
// in) go last whichever way the sort runs. Ties fall back to OVR, then name.
export function sortCards(cards, key = 'ovr', dir = 'desc') {
  const sign = dir === 'asc' ? 1 : -1;
  const val = (c) => (key === 'ovr' ? c.ovr : c.stats?.[key]);
  return [...cards].sort((a, b) => {
    if (key === 'name') return sign * a.name.localeCompare(b.name) || b.ovr - a.ovr;
    const va = val(a), vb = val(b);
    if (va == null && vb == null) return b.ovr - a.ovr || a.name.localeCompare(b.name);
    if (va == null) return 1;
    if (vb == null) return -1;
    return sign * (va - vb) || b.ovr - a.ovr || a.name.localeCompare(b.name);
  });
}

// The value colours on the player profile. The game doesn't publish its
// cut-offs, so these are the bands observed on its screens: 49 and 59 low,
// 72 and 73 mid, 78 and 79 high.
export function band(v) {
  if (v == null || v === '') return '';
  return v < 60 ? 'low' : v < 78 ? 'mid' : 'high';
}
