import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanThresholds, stepFor, nextFor, chemistry, summarize, refit, autoOrder, place, overlaps, PITCH,
} from '../site/js/lib/squad.js';
import { FORMATIONS, slotsFor, formation } from '../site/js/data/football.js';
import { CHEMISTRY } from '../site/js/data/game.js';

let n = 0;
const card = (o = {}) => ({ id: `c${++n}`, name: o.name || `Player ${n}`, ovr: 80, pos: ['CM'], quality: 'gold', rarity: 'normal', nation: '', league: '', club: '', stats: {}, sellable: true, ...o });

test('thresholds fall back to the game data and drop anything that is not a count', () => {
  assert.deepEqual(cleanThresholds(undefined), CHEMISTRY.thresholds);
  assert.deepEqual(cleanThresholds({ nation: [2, '5', ''], league: [3, 0, 12], rarity: ['x', null, 4.5] }), {
    nation: [2, 5, null], league: [3, null, null], rarity: [null, null, null],
  });
});

test('a step counts only thresholds that are known and met', () => {
  assert.equal(stepFor(1, [2, 5, null]), 0);
  assert.equal(stepFor(2, [2, 5, null]), 1);
  assert.equal(stepFor(4, [2, 5, null]), 1);
  assert.equal(stepFor(5, [2, 5, null]), 2);
  assert.equal(stepFor(11, [2, 5, null]), 2);
  assert.equal(stepFor(11, [null, null, null]), 0);
  // +1 unknown, +2 known: five players are still at +2
  assert.equal(stepFor(5, [null, 5, null]), 2);
  assert.equal(stepFor(9, [2, 5, 8]), 3);
});

test('the next step names the next known threshold above the count', () => {
  assert.deepEqual(nextFor(3, [2, 5, null]), { step: 2, at: 5 });
  assert.equal(nextFor(5, [2, 5, null]), null);
  assert.deepEqual(nextFor(3, [2, null, 8]), { step: 3, at: 8 });
  assert.equal(nextFor(9, [2, 5, 8]), null);
});

test('chemistry groups starters by nationality, league and special rarity, and ignores blanks', () => {
  const ts = { nation: [2, 5, null], league: [3, 6, null], rarity: [2, null, null] };
  const xi = [
    card({ nation: 'Spain', league: 'Spain 1' }),
    card({ nation: 'spain ', league: 'Spain 1' }),
    card({ nation: 'Brazil', league: 'Spain 1', rarity: 'screamers' }),
    card({ nation: '', league: '', rarity: 'screamers' }),
    card({ rarity: 'normal' }),
    null,
  ];
  const c = chemistry(xi, ts);
  assert.deepEqual(c.per, [2, 2, 2, 1, 0, null]);
  const spain = c.groups.find((g) => g.kind === 'nation' && g.id === 'spain');
  assert.equal(spain.count, 2);
  assert.equal(spain.name, 'Spain');
  assert.deepEqual(spain.next, { step: 2, at: 5 });
  assert.ok(!c.groups.some((g) => g.kind === 'rarity' && g.id === 'normal'), 'Normal is not a special rarity');
  assert.ok(!c.groups.some((g) => g.id === ''), 'a blank field never groups');
  assert.equal(c.team, 7 / 5);
});

test('a starter tops out at +3 however many groups they are in', () => {
  const ts = { nation: [2, 3, 4], league: [2, 3, 4], rarity: [2, 3, 4] };
  const xi = Array.from({ length: 4 }, () => card({ nation: 'France', league: 'France 1', rarity: 'neon' }));
  const c = chemistry(xi, ts);
  assert.deepEqual(c.per, [3, 3, 3, 3]);
  assert.equal(c.team, 3);
});

test('an empty lineup has no chemistry and no team OVR', () => {
  const s = summarize(8, Array(11).fill(null));
  assert.equal(s.filled, 0);
  assert.equal(s.ovr, null);
  assert.equal(s.chem, null);
  assert.deepEqual(s.lines, { ATT: null, MID: null, DEF: null });
  assert.equal(s.rows.length, 11);
});

test('team OVR is the average of the filled eleven with chemistry, and the lines split by slot', () => {
  const f = formation(8); // GK LB CB CB RB CM CM CAM LW ST RW
  const slots = Array(11).fill(null);
  slots[0] = card({ ovr: 80, pos: ['GK'], nation: 'Spain' });
  slots[9] = card({ ovr: 90, pos: ['ST'], nation: 'Spain' });
  slots[5] = card({ ovr: 70, pos: ['CDM'] });
  const s = summarize(f.id, slots, { nation: [2, null, null] });
  assert.equal(s.filled, 3);
  assert.equal(s.rows[0].eff, 81);
  assert.equal(s.rows[9].eff, 91);
  assert.equal(s.ovr, (81 + 91 + 70) / 3);
  assert.equal(s.base, 80);
  assert.deepEqual(s.lines, { ATT: 91, MID: 70, DEF: 81 });
  assert.equal(s.rows[9].fit, 'fits');
  assert.equal(s.rows[5].fit, 'wrong');
});

test('a new formation keeps cards where their position still has a slot', () => {
  const a = slotsFor(formation(8)); // 4-3-3 Attack
  const slots = a.map((s) => card({ pos: [s.pos] }));
  const { slots: out, dropped } = refit(slots, 8, 22); // 5-3-2: GK LB CB CB CB RB CM CM CM ST ST
  const kept = out.filter(Boolean);
  assert.equal(kept.length + dropped.length, 11);
  // 4-3-3 Attack has GK LB CB CB RB CM CM CAM LW ST RW: the CAM and the wingers have no slot
  assert.deepEqual(dropped.map((c) => c.pos[0]).sort(), ['CAM', 'LW', 'RW']);
  const to = slotsFor(formation(22));
  out.forEach((c, i) => { if (c) assert.equal(c.pos[0], to[i].pos); });
});

test('refit falls back to a card\'s other positions', () => {
  const slots = Array(11).fill(null);
  slots[7] = card({ pos: ['CAM', 'CM'] }); // CAM in 4-3-3 Attack
  const { slots: out, dropped } = refit(slots, 8, 22);
  assert.equal(dropped.length, 0);
  assert.equal(slotsFor(formation(22))[out.findIndex(Boolean)].pos, 'CM');
});

test('auto order fills empty slots with the best fitting unused cards, once each', () => {
  const pool = [card({ ovr: 70, pos: ['ST'] }), card({ ovr: 88, pos: ['ST'] }), card({ ovr: 85, pos: ['RW', 'ST'] }), card({ ovr: 99, pos: ['GK'] })];
  const out = autoOrder(8, Array(11).fill(null), pool);
  const f = slotsFor(formation(8));
  assert.equal(out[f.findIndex((s) => s.pos === 'ST')].ovr, 88);
  assert.equal(out[f.findIndex((s) => s.pos === 'RW')].ovr, 85);
  assert.equal(out[0].ovr, 99);
  assert.equal(new Set(out.filter(Boolean).map((c) => c.id)).size, out.filter(Boolean).length);
});

test('auto order never fields two versions of the same player', () => {
  const pool = [card({ name: 'Test Playmaker', ovr: 90, pos: ['CM'] }), card({ name: 'Test Playmaker', ovr: 95, pos: ['CM'] })];
  const out = autoOrder(8, Array(11).fill(null), pool);
  assert.equal(out.filter(Boolean).length, 1);
  assert.equal(out.filter(Boolean)[0].ovr, 95);
});

test('no two cards overlap on the pitch in any of the 19 formations', () => {
  assert.equal(FORMATIONS.length, 19);
  for (const f of FORMATIONS) {
    const pts = place(slotsFor(f));
    assert.deepEqual(overlaps(pts), [], f.name);
    for (const p of pts) {
      assert.ok(p.x - PITCH.cardW / 2 >= 0 && p.x + PITCH.cardW / 2 <= 100, `${f.name} ${p.pos} off the side`);
      assert.ok(p.y > 0 && p.y < 100, `${f.name} ${p.pos} off the end`);
    }
  }
});

test('the pitch keeps a symmetric formation symmetric', () => {
  for (const f of FORMATIONS) {
    const pts = place(slotsFor(f));
    for (const p of pts) {
      const mirror = pts.find((q) => Math.abs(q.x - (100 - p.x)) < 0.01 && Math.abs(q.y - p.y) < 0.01);
      assert.ok(mirror, `${f.name}: ${p.pos} has no mirror`);
    }
  }
});
