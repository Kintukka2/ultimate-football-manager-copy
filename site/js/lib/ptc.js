// The PTC engine: what a Player Trade Challenge asks for, and how far a set of
// cards is from it. Pure functions, no DOM, so the tests and the page share it.
//
// The game's requirement grammar is a property, an aggregation and a
// comparison, plus "at least N of". A challenge here:
//   { id, name, size, reqs: [...], cards: [card | null, ...one per slot], done }
// and a requirement is one of:
//   { kind: 'count', op: 'gte'|'lte'|'eq', n, where: [{ prop, cmp, value }, ...up to 2] }
//   { kind: 'avg', cmp: 'gte'|'lte', value }    average OVR of the cards
//   { kind: 'min', value }                       every card rated value or higher
//   { kind: 'max', value }                       every card rated value or lower
//   { kind: 'sum', value }                       total OVR at least value
//   { kind: 'distinct', prop, op: 'gte'|'lte'|'eq', value }   different nations, leagues...
// The number of players is always a requirement of its own.
//
// No rounding rule for the average is published, so the average is exact and
// compared directly.

import { LINE, OUTFIELD_STATS, GK_STATS } from '../data/football.js';
import { quality as qualityOf, rarity as rarityOf } from '../data/rarities.js';

const STAT_LABEL = Object.fromEntries([...OUTFIELD_STATS, ...GK_STATS].map((s) => [s.key, s.label]));

// The properties a count can filter on. `type` decides the comparisons offered.
export const PROPS = [
  { id: 'ovr', name: 'OVR', type: 'num' },
  { id: 'pos', name: 'Position', type: 'cat' },
  { id: 'line', name: 'Line', type: 'cat' },
  { id: 'quality', name: 'Quality', type: 'cat' },
  { id: 'rarity', name: 'Rarity', type: 'cat' },
  { id: 'nation', name: 'Nationality', type: 'text' },
  { id: 'league', name: 'League', type: 'text' },
  { id: 'club', name: 'Club', type: 'text' },
  { id: 'age', name: 'Age', type: 'num' },
  { id: 'sellable', name: 'Sellable', type: 'bool' },
  ...OUTFIELD_STATS.map((s) => ({ id: s.key, name: s.label, type: 'num', stat: true })),
  ...GK_STATS.filter((s) => s.key !== 'spd').map((s) => ({ id: s.key, name: s.label, type: 'num', stat: true })),
];
export const prop = (id) => PROPS.find((p) => p.id === id) || PROPS[0];

export const NUM_CMPS = ['gt', 'gte', 'lt', 'lte', 'eq', 'ne'];
export const CAT_CMPS = ['eq', 'ne'];
export const cmpsFor = (propId) => {
  const t = prop(propId).type;
  return t === 'num' ? NUM_CMPS : t === 'bool' ? ['eq'] : CAT_CMPS;
};

export const DISTINCT_PROPS = [
  { id: 'nation', one: 'nationality', many: 'nationalities' },
  { id: 'league', one: 'league', many: 'leagues' },
  { id: 'club', one: 'club', many: 'clubs' },
  { id: 'rarity', one: 'rarity', many: 'rarities' },
];

export const KINDS = [
  { id: 'count', name: 'Number of players who…' },
  { id: 'avg', name: 'Average rating' },
  { id: 'min', name: 'Every player rated at least' },
  { id: 'max', name: 'Every player rated at most' },
  { id: 'sum', name: 'Total rating' },
  { id: 'distinct', name: 'Different nations, leagues…' },
];

export function defaultReq(kind) {
  switch (kind) {
    case 'avg': return { kind, cmp: 'gte', value: 75 };
    case 'min': return { kind, value: 70 };
    case 'max': return { kind, value: 85 };
    case 'sum': return { kind, value: 350 };
    case 'distinct': return { kind, prop: 'nation', op: 'gte', value: 3 };
    default: return { kind: 'count', op: 'gte', n: 1, where: [{ prop: 'pos', cmp: 'eq', value: 'ST' }] };
  }
}

// ---- reading a card ---------------------------------------------------------
export function valueOf(card, propId) {
  switch (propId) {
    case 'ovr': return card.ovr;
    case 'age': return card.age ?? null;
    case 'pos': return card.pos[0];
    case 'line': return card.pos[0] === 'GK' ? 'GK' : LINE[card.pos[0]];
    case 'quality': return card.quality;
    case 'rarity': return card.rarity;
    case 'nation': case 'league': case 'club': return card[propId] || '';
    case 'sellable': return card.sellable !== false;
    default: return card.stats?.[propId] ?? null;
  }
}

const norm = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v);
function compare(a, cmp, b) {
  if (a === null || a === undefined || a === '') return cmp === 'ne' && b !== '' && b !== null;
  if (typeof b === 'number' || typeof a === 'number') {
    a = Number(a); b = Number(b);
  } else { a = norm(a); b = norm(b); }
  switch (cmp) {
    case 'gt': return a > b;
    case 'gte': return a >= b;
    case 'lt': return a < b;
    case 'lte': return a <= b;
    case 'ne': return a !== b;
    default: return a === b;
  }
}

export function matches(card, where = []) {
  return where.every((w) => {
    const p = prop(w.prop);
    let v = w.value;
    if (p.type === 'num') v = Number(v);
    if (p.type === 'bool') v = v === true || v === 'yes' || v === 'true';
    return compare(valueOf(card, w.prop), w.cmp, v);
  });
}

// ---- words: each requirement as a plain sentence in the game's terms -------
const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
const OP = { gte: 'At least', lte: 'At most', eq: 'Exactly' };

function rated(cmp, v, noun = 'rated') {
  return {
    gt: `${noun} higher than ${v}`, gte: `${noun} ${v} or higher`, lt: `${noun} lower than ${v}`,
    lte: `${noun} ${v} or lower`, eq: `${noun} exactly ${v}`, ne: `not ${noun} ${v}`,
  }[cmp];
}

export function describeWhere(w) {
  const v = w.value;
  const not = w.cmp === 'ne';
  switch (w.prop) {
    case 'ovr': return rated(w.cmp, v);
    case 'age': return {
      gt: `older than ${v}`, gte: `aged ${v} or older`, lt: `younger than ${v}`,
      lte: `aged ${v} or younger`, eq: `aged ${v}`, ne: `not aged ${v}`,
    }[w.cmp];
    case 'pos': return `${not ? 'not ' : ''}playing ${v}`;
    case 'line': return v === 'GK' ? `${not ? 'not ' : ''}playing in goal` : `${not ? 'not ' : ''}playing in ${v}`;
    case 'quality': return `${not ? 'not ' : ''}of ${qualityOf(v).name} quality`;
    case 'rarity': return `${not ? 'not ' : ''}from ${rarityOf(v).name}`;
    case 'nation': return `${not ? 'not ' : ''}from ${v || '…'}`;
    case 'league': return `${not ? 'outside' : 'in'} ${v || '…'}`;
    case 'club': return `${not ? 'not ' : ''}at ${v || '…'}`;
    case 'sellable': return (v === true || v === 'yes' || v === 'true') ? 'that are Sellable' : 'that are Unsellable';
    default: {
      const s = STAT_LABEL[w.prop] || w.prop.toUpperCase();
      return {
        gt: `with ${s} higher than ${v}`, gte: `with ${s} ${v} or higher`, lt: `with ${s} lower than ${v}`,
        lte: `with ${s} ${v} or lower`, eq: `with ${s} of exactly ${v}`, ne: `with ${s} other than ${v}`,
      }[w.cmp];
    }
  }
}

export function describe(req) {
  switch (req.kind) {
    case 'count': {
      const n = Number(req.n);
      const who = (req.where || []).map(describeWhere).join(' and ');
      return `${OP[req.op] || OP.gte} ${plural(n, 'player')}${who ? ' ' + who : ''}`;
    }
    case 'avg': return `Average rating ${req.cmp === 'lte' ? 'at most' : 'at least'} ${req.value}`;
    case 'min': return `Every player rated ${req.value} or higher`;
    case 'max': return `Every player rated ${req.value} or lower`;
    case 'sum': return `Total rating at least ${req.value}`;
    case 'distinct': {
      const d = DISTINCT_PROPS.find((x) => x.id === req.prop) || DISTINCT_PROPS[0];
      const n = Number(req.value);
      return `${OP[req.op] || OP.gte} ${plural(n, d.one, d.many)}`;
    }
    default: return 'Unknown requirement';
  }
}

// ---- evaluation -------------------------------------------------------------
const one = (n) => (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, '');

function evalReq(req, cards, size) {
  const filled = cards.length;
  const left = Math.max(0, size - filled);
  const label = describe(req);
  const out = { req, label, met: false, current: '', target: '', needText: '' };

  switch (req.kind) {
    case 'count': {
      const n = Number(req.n);
      const k = cards.filter((c) => matches(c, req.where)).length;
      out.current = `${k} / ${n}`;
      out.target = n;
      if (req.op === 'lte') {
        out.met = k <= n;
        if (!out.met) out.needText = `${k - n} too many: swap ${k - n === 1 ? 'one' : k - n} out`;
      } else if (req.op === 'eq') {
        out.met = k === n;
        if (k > n) out.needText = `${k - n} too many: swap ${k - n === 1 ? 'one' : k - n} out`;
        else if (k < n) out.needText = need(n - k, left);
      } else {
        out.met = k >= n;
        if (!out.met) out.needText = need(n - k, left);
      }
      return out;
    }
    case 'avg': {
      const target = Number(req.value);
      const sum = cards.reduce((s, c) => s + c.ovr, 0);
      const avg = filled ? sum / filled : null;
      out.current = avg === null ? '–' : one(avg);
      out.target = target;
      out.avg = avg;
      if (req.cmp === 'lte') {
        if (!left) { out.met = avg !== null && avg <= target; if (!out.met) out.needText = `${one(avg - target)} OVR too high: swap a high card for a lower one`; return out; }
        const allow = target * size - sum; // the remaining cards may total at most this
        if (allow < left) out.needText = 'Out of reach: even 1-rated cards are too high. Swap a high card out';
        else out.needText = left === 1 ? `The last card must be rated ${Math.min(99, Math.floor(allow))} or lower` : `The last ${left} cards must average ${one(allow / left)} or less`;
        return out;
      }
      if (!left) {
        out.met = avg !== null && avg >= target;
        out.surplus = avg - target;
        if (!out.met) out.needText = `${one(target - avg)} OVR short: swap a low card for a higher one`;
        return out;
      }
      const total = Math.ceil(target * size - sum - 1e-9); // what the empty slots must add up to
      if (total <= left) out.needText = left === 1 ? 'Any card in the last slot clears it' : `Any ${left} cards clear it`;
      else if (total > 99 * left) out.needText = 'Out of reach: no card is rated high enough. Swap a low card out';
      else out.needText = left === 1 ? `The last card must be rated ${total} or higher` : `The last ${left} cards must average ${one(total / left)} or more`;
      return out;
    }
    case 'min': case 'max': {
      const v = Number(req.value);
      const bad = cards.filter((c) => (req.kind === 'min' ? c.ovr < v : c.ovr > v));
      out.current = bad.length ? `${bad.length} ${req.kind === 'min' ? 'below' : 'above'}` : (filled ? 'All' : '–');
      out.target = v;
      if (bad.length) out.needText = `${bad.length === 1 ? bad[0].name + ' is' : bad.length + ' cards are'} rated ${req.kind === 'min' ? 'below' : 'above'} ${v}: swap ${bad.length === 1 ? 'it' : 'them'} out`;
      else if (left) out.needText = `The last ${left === 1 ? 'card' : left + ' cards'} must be rated ${v} or ${req.kind === 'min' ? 'higher' : 'lower'}`;
      out.met = !bad.length && !left;
      return out;
    }
    case 'sum': {
      const v = Number(req.value);
      const sum = cards.reduce((s, c) => s + c.ovr, 0);
      out.current = String(sum);
      out.target = v;
      out.met = sum >= v;
      if (!out.met) {
        const short = v - sum;
        if (!left) out.needText = `${short} OVR short: swap a low card for a higher one`;
        else if (short > 99 * left) out.needText = 'Out of reach: no card is rated high enough. Swap a low card out';
        else out.needText = left === 1 ? `The last card must be rated ${short} or higher` : `The last ${left} cards must total ${short} or more`;
      }
      return out;
    }
    case 'distinct': {
      const d = DISTINCT_PROPS.find((x) => x.id === req.prop) || DISTINCT_PROPS[0];
      const v = Number(req.value);
      const seen = new Set(cards.map((c) => norm(valueOf(c, d.id))).filter((x) => x));
      const k = seen.size;
      out.current = `${k} / ${v}`;
      out.target = v;
      if (req.op === 'lte') {
        out.met = k <= v;
        if (!out.met) out.needText = `${plural(k - v, d.one, d.many)} too many: swap cards to share one`;
      } else if (req.op === 'eq') {
        out.met = k === v;
        if (k > v) out.needText = `${plural(k - v, d.one, d.many)} too many: swap cards to share one`;
        else if (k < v) out.needText = needDistinct(v - k, left, d);
      } else {
        out.met = k >= v;
        if (!out.met) out.needText = needDistinct(v - k, left, d);
      }
      return out;
    }
    default:
      out.needText = 'Unknown requirement. Edit the challenge to fix it';
      return out;
  }
}

function need(more, left) {
  const t = `${more} more needed`;
  return left < more ? `${t}, and only ${left} ${left === 1 ? 'slot is' : 'slots are'} empty: swap out a card that doesn't qualify` : t;
}
function needDistinct(more, left, d) {
  const t = `${plural(more, 'more ' + d.one, 'more ' + d.many)} needed`;
  return left < more ? `${t}, and only ${left} ${left === 1 ? 'slot is' : 'slots are'} empty: swap a card for one from a new ${d.one}` : t;
}

// The whole challenge. The first row is always the number of players.
export function evaluate(challenge) {
  const size = Number(challenge.size) || 0;
  const cards = (challenge.cards || []).slice(0, size).filter(Boolean);
  const filled = cards.length;
  const missing = Math.max(0, size - filled);
  const sizeRow = {
    req: { kind: 'size' }, label: 'Number of players', met: filled === size && size > 0,
    current: `${filled} / ${size}`, target: size,
    needText: missing ? (missing === 1 ? 'Add one more card' : `Add ${missing} more cards`) : '',
  };
  const rows = [sizeRow, ...(challenge.reqs || []).map((r) => evalReq(r, cards, size))];
  const avgRows = rows.filter((r) => r.req.kind === 'avg' && r.req.cmp !== 'lte' && r.surplus !== undefined);
  const surplus = avgRows.length ? Math.min(...avgRows.map((r) => r.surplus)) : null;
  return {
    rows, filled, missing, size,
    complete: rows.every((r) => r.met),
    unmet: rows.filter((r) => !r.met),
    surplus,
  };
}

// The game's own example, from its PTC help.
export function exampleChallenge(id) {
  return {
    id, name: 'Strikers 65+', size: 5, done: false,
    reqs: [
      { kind: 'count', op: 'gte', n: 3, where: [{ prop: 'pos', cmp: 'eq', value: 'ST' }, { prop: 'ovr', cmp: 'gt', value: 65 }] },
      { kind: 'avg', cmp: 'gte', value: 70 },
    ],
    cards: Array(5).fill(null),
  };
}

// Tidy a requirement read from a form or storage: numbers as numbers, at most
// two conditions on a count. Returns { req, error }.
export function cleanReq(r) {
  const num = (v, lo, hi) => { const n = Number(v); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
  if (r.kind === 'count') {
    const n = num(r.n, 0, 23);
    if (n === null) return { error: 'The number of players is a whole number from 0 to 23.' };
    const where = [];
    for (const w of (r.where || []).slice(0, 2)) {
      const p = prop(w.prop);
      let value = w.value;
      if (p.type === 'num') {
        value = num(w.value, 0, 99);
        if (value === null) return { error: `${p.name} in a condition is a number from 0 to 99.` };
      } else if (p.type === 'bool') value = value === true || value === 'yes' || value === 'true';
      else if (!String(value ?? '').trim()) return { error: `Fill in the ${p.name.toLowerCase()} the condition asks for.` };
      else value = String(value).trim();
      const cmp = cmpsFor(w.prop).includes(w.cmp) ? w.cmp : cmpsFor(w.prop)[0];
      where.push({ prop: p.id, cmp, value });
    }
    return { req: { kind: 'count', op: OP[r.op] ? r.op : 'gte', n, where } };
  }
  if (r.kind === 'distinct') {
    const value = num(r.value, 0, 23);
    if (value === null) return { error: 'The number of different values is a whole number from 0 to 23.' };
    return { req: { kind: 'distinct', prop: DISTINCT_PROPS.some((d) => d.id === r.prop) ? r.prop : 'nation', op: OP[r.op] ? r.op : 'gte', value } };
  }
  if (r.kind === 'sum') {
    const value = num(r.value, 1, 99 * 23);
    if (value === null) return { error: 'The total rating is a whole number.' };
    return { req: { kind: 'sum', value } };
  }
  if (['avg', 'min', 'max'].includes(r.kind)) {
    const value = num(r.value, 1, 99);
    if (value === null) return { error: 'A rating is a number from 1 to 99.' };
    return { req: r.kind === 'avg' ? { kind: 'avg', cmp: r.cmp === 'lte' ? 'lte' : 'gte', value } : { kind: r.kind, value } };
  }
  return { error: 'Pick what the requirement asks for.' };
}
