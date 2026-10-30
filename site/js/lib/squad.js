// The Squad Builder's arithmetic, with no DOM: Chemistry, team OVR, the lines,
// moving cards between formations, and where each card sits on the pitch.
//
// Chemistry, from the game's help text: starters who share a nationality, a
// league or a special rarity get a boost once their group reaches a threshold.
// A starter's boosts add up to +3 at most, and the +3 goes on OVR and every
// sub-stat. Position and adjacency don't matter, and the bench never counts.

import { CHEMISTRY } from '../data/game.js';
import { LINE, formation as formationById, slotsFor } from '../data/football.js';
import { isSpecial, rarity as rarityOf } from '../data/rarities.js';
import { fitFor } from './cards.js';

export const KINDS = [
  { kind: 'nation', label: 'Nationality', key: (c) => c.nation },
  { kind: 'league', label: 'League', key: (c) => c.league },
  { kind: 'rarity', label: 'Special rarity', key: (c) => (isSpecial(c.rarity) ? c.rarity : '') },
];

// Three steps per kind, each a starter count or null where it isn't known.
export function cleanThresholds(raw) {
  const out = {};
  for (const { kind } of KINDS) {
    const src = Array.isArray(raw?.[kind]) ? raw[kind] : CHEMISTRY.thresholds[kind];
    out[kind] = [0, 1, 2].map((i) => {
      const v = src[i];
      const n = Number(v);
      return v !== null && v !== '' && v !== undefined && Number.isInteger(n) && n >= 1 && n <= 11 ? n : null;
    });
  }
  return out;
}

// The highest step whose threshold the group meets. A step we don't know the
// threshold of is skipped, not assumed: with +2 at 5 known and +1 unknown,
// five players are still at +2.
export function stepFor(count, ts) {
  let step = 0;
  ts.forEach((t, i) => { if (t != null && count >= t) step = i + 1; });
  return step;
}

// The next step this group can reach, as { step, at }, or null.
export function nextFor(count, ts) {
  for (let i = stepFor(count, ts); i < ts.length; i++) if (ts[i] != null && ts[i] > count) return { step: i + 1, at: ts[i] };
  return null;
}

const norm = (v) => String(v ?? '').trim().toLowerCase();

// cards: the eleven, by slot, with null for an empty slot.
// Returns { per: [chemistry | null], team: average | null, groups: [...] }.
export function chemistry(cards, thresholds) {
  const ts = cleanThresholds(thresholds);
  const groups = [];
  const index = {};
  cards.forEach((c, i) => {
    if (!c) return;
    for (const k of KINDS) {
      const raw = k.key(c);
      const key = norm(raw);
      if (!key) continue;
      const map = (index[k.kind] ||= {});
      if (!map[key]) {
        map[key] = { kind: k.kind, label: k.label, id: k.kind === 'rarity' ? raw : key, name: k.kind === 'rarity' ? rarityOf(raw).name : String(raw).trim(), count: 0, slots: [] };
        groups.push(map[key]);
      }
      map[key].count++;
      map[key].slots.push(i);
    }
  });
  for (const g of groups) {
    g.step = stepFor(g.count, ts[g.kind]);
    g.next = nextFor(g.count, ts[g.kind]);
    g.known = ts[g.kind].slice(g.step).every((t) => t != null);
  }
  const per = cards.map((c, i) => {
    if (!c) return null;
    const sum = groups.reduce((s, g) => s + (g.slots.includes(i) ? g.step : 0), 0);
    return Math.min(CHEMISTRY.max, sum);
  });
  const filled = per.filter((v) => v != null);
  const team = filled.length ? filled.reduce((a, b) => a + b, 0) / filled.length : null;
  const order = { nation: 0, league: 1, rarity: 2 };
  groups.sort((a, b) => b.step - a.step || b.count - a.count || order[a.kind] - order[b.kind] || a.name.localeCompare(b.name));
  return { per, team, groups };
}

const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

// Everything the summary shows for one lineup. Effective OVR is the printed
// OVR plus Chemistry; Focus and the out-of-position penalty aren't known for a
// typed card, so they aren't applied (the fit is shown instead).
export function summarize(formationId, slots, thresholds) {
  const f = formationById(formationId);
  const layout = slotsFor(f);
  const xi = layout.map((s) => slots?.[s.i] || null);
  const chem = chemistry(xi, thresholds);
  const rows = layout.map((s) => {
    const card = xi[s.i];
    const c = chem.per[s.i];
    return { ...s, card, chem: c, eff: card ? card.ovr + c : null, fit: fitFor(card, s.pos) };
  });
  const filled = rows.filter((r) => r.card);
  const lines = {};
  for (const L of ['ATT', 'MID', 'DEF']) lines[L] = avg(filled.filter((r) => LINE[r.pos] === L).map((r) => r.eff));
  return {
    formation: f, rows, filled: filled.length,
    ovr: avg(filled.map((r) => r.eff)),
    base: avg(filled.map((r) => r.card.ovr)),
    chem: chem.team, groups: chem.groups, lines,
  };
}

// Moving a lineup to another formation: a card keeps a slot of the position
// it was playing, else one of its own positions (primary first). The rest come
// off the pitch and are returned.
export function refit(slots, fromId, toId) {
  const from = slotsFor(formationById(fromId));
  const to = slotsFor(formationById(toId));
  const out = Array(to.length).fill(null);
  const pending = from.map((s) => ({ card: slots?.[s.i] || null, pos: s.pos })).filter((p) => p.card);
  const pass = (fits) => {
    for (const p of [...pending]) {
      const t = to.find((s) => !out[s.i] && fits(p, s));
      if (t) { out[t.i] = p.card; pending.splice(pending.indexOf(p), 1); }
    }
  };
  pass((p, s) => s.pos === p.pos);
  pass((p, s) => s.pos === p.card.pos[0]);
  pass((p, s) => p.card.pos.includes(s.pos));
  return { slots: out, dropped: pending.map((p) => p.card) };
}

// The game's Auto order, for the empty slots only: the highest-rated unused
// card whose position is the slot's, then one that lists it as another position.
export function autoOrder(formationId, slots, cards) {
  const layout = slotsFor(formationById(formationId));
  const out = layout.map((s) => slots?.[s.i] || null);
  const used = new Set(out.filter(Boolean).map((c) => c.id));
  const names = new Set(out.filter(Boolean).map((c) => norm(c.name)));
  const pool = [...cards].sort((a, b) => b.ovr - a.ovr);
  for (const test of [(c, s) => c.pos[0] === s.pos, (c, s) => c.pos.includes(s.pos)]) {
    for (const s of layout) {
      if (out[s.i]) continue;
      const c = pool.find((x) => !used.has(x.id) && !names.has(norm(x.name)) && test(x, s));
      if (c) { out[s.i] = c; used.add(c.id); names.add(norm(c.name)); }
    }
  }
  return out;
}

// ---- the pitch ---------------------------------------------------------------
// Card width in % of the pitch width, the pitch's height over its width, and
// the room under each card for its name and Chemistry pips, in % of height.
export const PITCH = { ratio: 1.4, cardW: 14, below: 4.6, gap: 0.8 };
export const cardH = (g = PITCH) => (g.cardW * (854 / 640)) / g.ratio;

// Where each slot's card centre sits, in % of the pitch. Formation depths are
// squeezed into the pitch; a card just off the centre line that would overlap
// a card on it steps out sideways to clear it; anything still overlapping is
// pushed apart up and down. Every move is worked out from the same positions
// and applied together, so a symmetric formation stays symmetric.
export function place(slots, g = PITCH) {
  const h = cardH(g);
  const need = h + g.below + g.gap;
  const wide = g.cardW + g.gap;
  const minY = h / 2 + 0.5, maxY = 100 - h / 2 - g.below - 0.5;
  const pts = slots.map((s) => ({ i: s.i, pos: s.pos, x: s.x, y: 8.5 + s.y * 0.85 }));
  const clash = (p, q) => Math.abs(p.x - q.x) < wide - 1e-6 && Math.abs(p.y - q.y) < need - 1e-6;
  for (const p of pts) {
    if (p.x === 50 || Math.abs(p.x - 50) >= wide) continue;
    if (pts.some((q) => q.x === 50 && clash(p, q))) p.x = p.x < 50 ? 50 - wide : 50 + wide;
  }
  for (let it = 0; it < 400; it++) {
    const dy = pts.map(() => 0);
    let moved = false;
    for (let a = 0; a < pts.length; a++) {
      for (let b = a + 1; b < pts.length; b++) {
        const p = pts[a], q = pts[b];
        if (!clash(p, q)) continue;
        const d = q.y - p.y;
        const push = (need - Math.abs(d)) / 2 + 0.01;
        const up = d > 0 || (d === 0 && p.i < q.i) ? a : b;
        dy[up] -= push; dy[up === a ? b : a] += push;
        moved = true;
      }
    }
    pts.forEach((p, k) => { p.y = Math.min(maxY, Math.max(minY, p.y + dy[k] * 0.5)); });
    if (!moved) break;
  }
  return pts;
}

// Every pair of cards that still overlaps, for the tests.
export function overlaps(pts, g = PITCH) {
  const need = cardH(g) + g.below;
  const bad = [];
  for (let a = 0; a < pts.length; a++) {
    for (let b = a + 1; b < pts.length; b++) {
      if (Math.abs(pts[a].x - pts[b].x) < g.cardW && Math.abs(pts[a].y - pts[b].y) < need - 0.05) bad.push([pts[a].pos, pts[b].pos]);
    }
  }
  return bad;
}
