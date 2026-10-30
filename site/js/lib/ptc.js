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
// Much of the planning below is ported from FHCWiz's engine (js/engine.js in
// the FHCWiz repository): the rating budget, the slot plan, the quick fill,
// the cheapest-completion knapsack and the downgrades. Football Head Coach 27
// and UFM 27 run on the same Gamebasics client, and its PTCs are checked by
// the same conditions module, so the rules FHCWiz verified in that game are
// the ones this file counts with.

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

// ---- the rating budget --------------------------------------------------------
// A required average is a total, not a rule about each card. Five cards at an
// 80 average need a total, and two 90s can carry three 75s.
//
// The game compares the average it SHOWS, which is a whole number: a board
// averaging 79.5 shows 80 and passes "at least 80". So the budget is
// n x (N - 0.5), rounded up because OVRs are whole, not the n x N that
// multiplying the panel suggests. On five cards at 80 that is 398, not 400.
// FHCWiz verified this on Football Head Coach 27's PTCs, which run on the
// same Gamebasics conditions module as UFM's; it lives in this one constant
// so a UFM screen that ever disagrees changes one line. The epsilon keeps a
// total that is already whole (6 x 72.5 = 435) from being pushed up by float
// error.
export const AVERAGE_ROUNDS = 0.5;

export function requiredTotalFor(n, avg) {
  n = Number(n) || 0; avg = Number(avg) || 0;
  if (n <= 0 || avg <= 0) return 0;
  return Math.ceil(n * (avg - AVERAGE_ROUNDS) - 1e-9);
}

// "At most N": the shown average must not round above N, so the total stays
// under n x (N + 0.5).
export function maxTotalFor(n, avg) {
  n = Number(n) || 0; avg = Number(avg) || 0;
  if (n <= 0) return 0;
  return Math.ceil(n * (avg + AVERAGE_ROUNDS) - 1e-9) - 1;
}

// The average as the game prints it: a whole number.
export const shownAverage = (total, n) => (n ? Math.round(total / n) : null);

const placed = (challenge) => (challenge.cards || []).slice(0, Number(challenge.size) || 0).filter(Boolean);
const totalOf = (cards) => cards.reduce((s, c) => s + (Number(c.ovr) || 0), 0);

// The rating as a running total: what the board holds, what it needs, and
// what the empty slots must add up to. Every "at least" average and total
// rating requirement sets a budget; the highest one is the one that binds.
export function ratingStatus(challenge) {
  const size = Number(challenge.size) || 0;
  const cards = placed(challenge);
  const reqs = challenge.reqs || [];
  const budgets = [
    ...reqs.filter((r) => r.kind === 'avg' && r.cmp !== 'lte').map((r) => ({ req: r, total: requiredTotalFor(size, r.value) })),
    ...reqs.filter((r) => r.kind === 'sum').map((r) => ({ req: r, total: Number(r.value) || 0 })),
  ];
  const binding = budgets.reduce((a, b) => (!a || b.total > a.total ? b : a), null);
  const caps = reqs.filter((r) => r.kind === 'avg' && r.cmp === 'lte').map((r) => maxTotalFor(size, r.value));
  const required = binding ? binding.total : 0;
  const current = totalOf(cards);
  const left = Math.max(0, size - cards.length);
  const remaining = Math.max(0, required - current);
  return {
    size, required, current, left, remaining,
    remainingAverage: left ? remaining / left : 0,
    surplus: current - required,
    hasTarget: required > 0,
    binding: binding ? binding.req : null,
    banked: current >= required,
    maxAchievable: current + left * 99,
    impossible: current + left * 99 < required,
    cap: caps.length ? Math.min(...caps) : null,
    average: shownAverage(current, cards.length),
  };
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
      const sum = totalOf(cards);
      out.current = filled ? String(shownAverage(sum, filled)) : '–';
      out.target = target;
      if (req.cmp === 'lte') {
        const max = maxTotalFor(size, target);
        out.total = `${sum} / ${max} max`;
        if (!left) {
          out.met = sum <= max;
          if (!out.met) out.needText = `${sum - max} OVR over: swap a high card for a lower one`;
          return out;
        }
        const allow = max - sum; // what the empty slots may add up to, at most
        if (allow < left) out.needText = 'Out of reach: even 1-rated cards are too high. Swap a high card out';
        else out.needText = left === 1 ? `The last card must be rated ${Math.min(99, allow)} or lower` : `The last ${left} cards must total ${allow} or less, an average of ${one(allow / left)}`;
        return out;
      }
      // A total threshold, so the row is met as soon as the total is banked,
      // however many slots are still empty: more cards only add to it.
      const need = requiredTotalFor(size, target);
      out.total = `${sum} / ${need}`;
      out.required = need;
      out.met = sum >= need;
      out.surplus = sum - need;
      const short = need - sum;
      if (out.met) out.needText = left ? `Banked: any ${left === 1 ? 'card in the last slot' : `${left} cards`} clear${left === 1 ? 's' : ''} it` : '';
      else if (!left) out.needText = `${short} OVR short: swap a low card for a higher one`;
      else if (short > 99 * left) out.needText = 'Out of reach: no card is rated high enough. Swap a low card out';
      else if (short <= left) out.needText = `Any ${left} cards clear it`;
      else out.needText = left === 1 ? `The last card must be rated ${short} or higher` : `The last ${left} cards must total ${short}, an average of ${one(short / left)}`;
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
      const sum = totalOf(cards);
      out.current = String(sum);
      out.total = `${sum} / ${v}`;
      out.target = v;
      out.met = sum >= v;
      out.surplus = sum - v;
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

// ---- the slot plan --------------------------------------------------------------
// Positions are mutually exclusive, so an unmet count that names a position
// maps one to one onto empty slots: a card is a ST or a CB, never both. Every
// other count is an attribute layered onto a slot, which is why "1 more ST"
// and "1 more from Brazil" can be one card. That also shows when a challenge
// can't be finished: positions still needed that outnumber the empty slots.

const lineOf = (pos) => (pos === 'GK' ? 'GK' : LINE[pos]);
const isPosCond = (w) => w.prop === 'pos' && w.cmp === 'eq';

// Could one card be in this position and meet all of these conditions?
function consistent(pos, conds) {
  for (const w of conds) {
    if (w.prop === 'pos' && pos && (w.cmp === 'eq') !== (w.value === pos)) return false;
    if (w.prop === 'line' && pos && (w.cmp === 'eq') !== (w.value === lineOf(pos))) return false;
  }
  const eqs = {};
  for (const w of conds) {
    if (prop(w.prop).type === 'num' || w.cmp !== 'eq') continue;
    const v = norm(String(w.value));
    if (eqs[w.prop] !== undefined && eqs[w.prop] !== v) return false;
    eqs[w.prop] = v;
  }
  if (conds.some((w) => prop(w.prop).type !== 'num' && w.cmp === 'ne' && eqs[w.prop] === norm(String(w.value)))) return false;
  const lo = {}, hi = {};
  for (const w of conds) {
    if (prop(w.prop).type !== 'num') continue;
    const v = Number(w.value), k = w.prop;
    const up = (x) => { lo[k] = Math.max(lo[k] ?? -Infinity, x); };
    const down = (x) => { hi[k] = Math.min(hi[k] ?? Infinity, x); };
    if (w.cmp === 'gt') up(v + 1); else if (w.cmp === 'gte') up(v);
    else if (w.cmp === 'lt') down(v - 1); else if (w.cmp === 'lte') down(v);
    else if (w.cmp === 'eq') { up(v); down(v); }
  }
  return Object.keys({ ...lo, ...hi }).every((k) => (lo[k] ?? -Infinity) <= (hi[k] ?? Infinity));
}

// The slot an attribute rides on: one that can hold it, preferring a slot
// that already has a position so open slots stay free, then the slot
// carrying the fewest attributes.
function pickSlotFor(slots, req, ri) {
  const ok = slots.filter((s) => !s.reqs.includes(ri) && consistent(s.pos, [...s.conds, ...(req.where || [])]));
  ok.sort((a, b) => (b.pos ? 1 : 0) - (a.pos ? 1 : 0) || a.reqs.length - b.reqs.length);
  return ok[0] || null;
}

const stillNeeded = (req, cards) => Math.max(0, Number(req.n) - cards.filter((c) => matches(c, req.where)).length);

// One plan slot per empty slot: { pos, conds, reqs } where reqs are the
// indexes of the requirements parked on it. Plus warnings, in plain words.
export function buildPlan(challenge) {
  const cards = placed(challenge);
  const left = Math.max(0, (Number(challenge.size) || 0) - cards.length);
  const reqs = challenge.reqs || [];
  const counted = (r) => r.kind === 'count' && r.op !== 'lte';
  const warnings = [];
  let slots = [];
  reqs.forEach((r, ri) => {
    if (!counted(r)) return;
    const posW = (r.where || []).find(isPosCond);
    if (!posW) return;
    const conds = r.where.filter((w) => w !== posW);
    for (let i = stillNeeded(r, cards); i > 0; i--) slots.push({ pos: posW.value, conds: [...conds], reqs: [ri] });
  });
  if (slots.length > left) {
    if (left) {
      warnings.push({ level: 'error', text: `The positions still needed take ${plural(slots.length, 'card')}, and only ${left === 1 ? '1 slot is' : `${left} slots are`} empty. Swap out a card that doesn't qualify, or check the requirements.` });
    }
    slots = slots.slice(0, left);
  }
  while (slots.length < left) slots.push({ pos: null, conds: [], reqs: [] });
  reqs.forEach((r, ri) => {
    if (!counted(r) || (r.where || []).some(isPosCond)) return;
    for (let i = stillNeeded(r, cards); i > 0; i--) {
      const slot = pickSlotFor(slots, r, ri);
      if (slot) { slot.conds.push(...(r.where || [])); slot.reqs.push(ri); continue; }
      if (left) warnings.push({ level: 'error', text: `No empty slot can take "${describe(r)}": it clashes with the positions still needed.` });
      break;
    }
  });
  return { slots, warnings };
}

// The OVR every card must sit within, from "every player rated at least / at most".
function caps(challenge) {
  let lo = 1, hi = 99;
  for (const r of challenge.reqs || []) {
    if (r.kind === 'min') lo = Math.max(lo, Number(r.value));
    if (r.kind === 'max') hi = Math.min(hi, Number(r.value));
  }
  return { lo, hi };
}

// Everything a slot asks of a card: its position, the attributes parked on
// it, the rating caps on every card, and not tipping an "at most" or
// "exactly" count over.
export function slotAccepts(slot, card, challenge) {
  if (!card || !(card.ovr > 0)) return false;
  if (slot.pos && card.pos[0] !== slot.pos) return false;
  if (!matches(card, slot.conds)) return false;
  const { lo, hi } = caps(challenge);
  if (card.ovr < lo || card.ovr > hi) return false;
  const cards = placed(challenge);
  return !(challenge.reqs || []).some((r) => r.kind === 'count' && (r.op === 'lte' || r.op === 'eq')
    && matches(card, r.where) && cards.filter((c) => matches(c, r.where)).length >= Number(r.n));
}

// The ratings a slot could take when none of your cards fits it: what its
// own conditions and the caps allow. It still needs an honest target.
function ratingsAllowed(slot, challenge) {
  const { lo, hi } = caps(challenge);
  const ovr = slot.conds.filter((w) => w.prop === 'ovr');
  const out = [];
  for (let v = lo; v <= hi; v++) if (ovr.every((w) => compare(v, w.cmp, Number(w.value)))) out.push(v);
  return out;
}

// ---- quick fill ---------------------------------------------------------------
// Of the cards that fit a slot, the one nearest its target from above:
// exactly the target if there is one, else the smallest step over, because
// every point over is a better card spent for nothing. Only when nothing
// reaches it, the best below. No target takes the lowest rating there is.
// Ties go to the name, so the same board always gets the same card.
export function nearestFit(fits, target) {
  if (!fits.length) return null;
  const rank = (c) => (target == null ? c.ovr : c.ovr >= target ? c.ovr - target : 1000 + (target - c.ovr));
  return [...fits].sort((a, b) => rank(a) - rank(b) || String(a.name).localeCompare(String(b.name)))[0];
}

// The target and the card for every empty slot, worked out together rather
// than one slot at a time: each slot offers only the ratings it can really
// take, and of the combinations that clear the budget the one with the
// lowest summed square wins. Better cards cost more the higher they go, so a
// flat board keeps the most of your squad. Cards are handed out scarcest
// slot first, so a slot only one card fits isn't beaten to it.
export function planQuickFill(challenge, pool = [], ev = evaluate(challenge)) {
  const slots = ev.plan;
  const taken = new Set(placed(challenge).map((c) => c.id));
  const fits = slots.map((slot) => pool.filter((c) => !taken.has(c.id) && slotAccepts(slot, c, challenge)));
  const need = ev.rating.remaining;
  const options = fits.map((list, i) => (list.length ? [...new Set(list.map((c) => c.ovr))].sort((a, b) => a - b) : ratingsAllowed(slots[i], challenge)));

  let targets = null;
  if (need > 0 && slots.length && options.every((o) => o.length)) {
    let dp = [0, ...Array(need).fill(Infinity)];
    const history = [];
    for (const opts of options) {
      const next = Array(need + 1).fill(Infinity), from = Array(need + 1).fill(null);
      for (let sum = 0; sum <= need; sum++) {
        if (dp[sum] === Infinity) continue;
        for (const o of opts) {
          const ns = Math.min(sum + o, need), cost = dp[sum] + o * o;
          if (cost < next[ns]) { next[ns] = cost; from[ns] = { sum, ovr: o }; }
        }
      }
      dp = next;
      history.push(from);
    }
    let end = need;
    while (end > 0 && dp[end] === Infinity) end--;
    targets = [];
    for (let b = slots.length - 1; b >= 0; b--) { const step = history[b][end]; targets.unshift(step.ovr); end = step.sum; }
    // Slots offering the same cards can trade targets, so they read highest first.
    const groups = {};
    fits.forEach((list, i) => {
      const key = `${slots[i].pos || ''}|${list.map((c) => c.id).join(',')}|${options[i].join(',')}`;
      (groups[key] = groups[key] || []).push(i);
    });
    for (const idx of Object.values(groups)) {
      const sorted = idx.map((i) => targets[i]).sort((x, y) => y - x);
      idx.forEach((i, k) => { targets[i] = sorted[k]; });
    }
  }

  const picks = slots.map(() => null);
  const used = new Set();
  fits.map((_, i) => i).sort((a, b) => fits[a].length - fits[b].length || a - b).forEach((i) => {
    const pick = nearestFit(fits[i].filter((c) => !used.has(c.id)), targets ? targets[i] : null);
    if (pick) { picks[i] = pick; used.add(pick.id); }
  });
  return { slots, targets, picks };
}

// ---- cheapest completion ------------------------------------------------------
// The reader types market prices they can see in the game: { pos, ovr, price }.
// A multiple-choice knapsack picks one per empty slot, fewest coins, with the
// total clearing what the board still needs. Prices are matched to a slot by
// position and rating only; a price can't say which rarity or nation a card is.
export function optimiseCheapest(slots, market, remainingTotal, challenge = { reqs: [] }) {
  if (!slots.length) return { feasible: true, picks: [], totalCost: 0, totalOvr: 0 };
  const target = Math.max(0, Math.floor(remainingTotal) || 0);
  const { lo, hi } = caps(challenge);
  const perSlot = slots.map((slot) => market.filter((o) => o.price > 0 && o.ovr >= lo && o.ovr <= hi
    && (!slot.pos || o.pos === slot.pos)
    && slot.conds.filter((w) => w.prop === 'ovr').every((w) => compare(o.ovr, w.cmp, Number(w.value)))));
  const empty = perSlot.findIndex((o) => !o.length);
  if (empty >= 0) return { feasible: false, reason: `No price entered yet that fits ${slots[empty].pos ? `the ${slots[empty].pos} slot` : 'an open slot'}.` };

  let dp = [0, ...Array(target).fill(Infinity)];
  const history = [];
  for (const opts of perSlot) {
    const next = Array(target + 1).fill(Infinity), from = Array(target + 1).fill(null);
    for (let sum = 0; sum <= target; sum++) {
      if (dp[sum] === Infinity) continue;
      for (const o of opts) {
        const ns = Math.min(sum + o.ovr, target), cost = dp[sum] + o.price;
        if (cost < next[ns]) { next[ns] = cost; from[ns] = { sum, option: o }; }
      }
    }
    dp = next;
    history.push(from);
  }
  if (dp[target] === Infinity) return { feasible: false, reason: 'No mix of the prices entered reaches the total the challenge still needs. Add a higher-rated card.' };
  const picks = [];
  let cur = target;
  for (let b = slots.length - 1; b >= 0; b--) { const p = history[b][cur]; picks.unshift({ slot: slots[b], option: p.option }); cur = p.sum; }
  return {
    feasible: true, picks,
    totalCost: picks.reduce((a, p) => a + p.option.price, 0),
    totalOvr: picks.reduce((a, p) => a + p.option.ovr, 0),
  };
}

// The position that costs the most per OVR point, from the prices entered.
export function expensivePositions(market) {
  const by = {};
  for (const o of market) if (o.pos && o.ovr > 0 && o.price > 0) (by[o.pos] = by[o.pos] || []).push(o.price / o.ovr);
  return Object.entries(by).map(([pos, a]) => ({ pos, costPerOvr: a.reduce((x, y) => x + y, 0) / a.length }))
    .sort((a, b) => b.costPerOvr - a.costPerOvr);
}

// ---- downgrades ---------------------------------------------------------------
// A board over its total has OVR to give back. The rating each card could
// drop to and still pass, best card first, if its other requirements hold.
export function findDowngrades(cards, surplus) {
  if (!(surplus > 0)) return [];
  return cards.filter((c) => c.ovr > 0).map((c) => ({ card: c, to: c.ovr - surplus }))
    .filter((d) => d.to >= 1).sort((a, b) => b.card.ovr - a.card.ovr).slice(0, 3);
}

// The same, as swaps you can make: for each card on a finished board, the
// lowest-rated card of yours that could take its place and still finish the
// challenge, so the better card stays in your squad.
export function findSwaps(challenge, pool = []) {
  const ev = evaluate(challenge);
  if (!ev.complete || !(ev.rating.surplus > 0) || !ev.rating.hasTarget) return [];
  const taken = new Set(placed(challenge).map((c) => c.id));
  const out = [];
  (challenge.cards || []).forEach((c, i) => {
    if (!c) return;
    let best = null;
    for (const p of pool) {
      if (taken.has(p.id) || p.ovr >= c.ovr || p.ovr < c.ovr - ev.rating.surplus) continue;
      if (best && (p.ovr > best.ovr || (p.ovr === best.ovr && String(p.name).localeCompare(String(best.name)) >= 0))) continue;
      const trial = { ...challenge, cards: challenge.cards.map((x, j) => (j === i ? p : x)) };
      if (evaluate(trial).complete) best = p;
    }
    if (best) out.push({ index: i, out: c, in: best, drop: c.ovr - best.ovr });
  });
  return out.sort((a, b) => b.out.ovr - a.out.ovr || b.drop - a.drop).slice(0, 3);
}

// ---- the whole challenge -------------------------------------------------------
// The first row is always the number of players.
export function evaluate(challenge) {
  const size = Number(challenge.size) || 0;
  const cards = placed(challenge);
  const filled = cards.length;
  const missing = Math.max(0, size - filled);
  const sizeRow = {
    req: { kind: 'size' }, label: 'Number of players', met: filled === size && size > 0,
    current: `${filled} / ${size}`, target: size,
    needText: missing ? (missing === 1 ? 'Add one more card' : `Add ${missing} more cards`) : '',
  };
  const rows = [sizeRow, ...(challenge.reqs || []).map((r) => evalReq(r, cards, size))];
  const rating = ratingStatus(challenge);
  const plan = buildPlan(challenge);
  const warnings = [...plan.warnings];
  if (rating.impossible && rating.left) {
    warnings.push({ level: 'error', text: `No cards are rated high enough: even 99 in every empty slot reaches ${rating.maxAchievable} of the ${rating.required} total it needs. Swap a low card out.` });
  }
  return {
    rows, filled, missing, size, rating, plan: plan.slots, warnings,
    complete: rows.every((r) => r.met),
    unmet: rows.filter((r) => !r.met),
    // OVR over the binding total, once the board is full.
    surplus: !missing && rating.hasTarget ? rating.surplus : null,
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
