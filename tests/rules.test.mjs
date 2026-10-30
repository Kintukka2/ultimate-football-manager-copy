// The game's arithmetic the site leans on: Weekend League points, QP, pack
// odds, the formations and the number formats from the Brand Book.

import test from 'node:test';
import assert from 'node:assert/strict';
import { points, winsFor, plan, qpWins } from '../site/js/lib/wl.js';
import { atLeastOne, packsFor, expectedPacks, parsePercent } from '../site/js/lib/odds.js';
import { FORMATIONS, POSITIONS, slotsFor } from '../site/js/data/football.js';
import { RARITIES, QUALITIES } from '../site/js/data/rarities.js';
import { odds, signed, timer, int, day } from '../site/js/lib/util.js';

test('rank 1 takes 14 wins out of 15', () => {
  assert.equal(points(14, 1), 57);
  assert.equal(points(13, 2), 54);
  assert.equal(winsFor(55), 14);
  assert.equal(winsFor(15), 0);
  assert.equal(winsFor(60), 15);
});

test('a weekend in progress', () => {
  const p = plan({ played: 5, wins: 5, target: 55 });
  assert.deepEqual([p.now, p.left, p.need, p.canLose, p.possible], [20, 10, 9, 1, true]);
  const lost2 = plan({ played: 2, wins: 0, target: 55 });
  assert.equal(lost2.possible, false);
  assert.equal(lost2.best, 2 + 13 * 4);
  const done = plan({ played: 15, wins: 14, target: 55 });
  assert.equal(done.reached, true);
  assert.equal(done.need, 0);
  // wins can't exceed games played
  assert.equal(plan({ played: 3, wins: 9 }).wins, 3);
});

test('QP to the threshold', () => {
  assert.equal(qpWins(1020, 10, 1500), 48);
  assert.equal(qpWins(1500, 10, 1500), 0);
  assert.equal(qpWins(0, 0, 1500), Infinity);
});

test('pack odds', () => {
  assert.equal(atLeastOne(0.5, 2), 0.75);
  assert.equal(atLeastOne(0, 10), 0);
  assert.equal(atLeastOne(1, 1), 1);
  assert.equal(packsFor(0.025, 0.5), 28);
  assert.equal(packsFor(0.5, 0.75), 2);
  assert.equal(expectedPacks(0.025), 40);
  assert.equal(parsePercent('2,5%'), 0.025);
  assert.ok(Number.isNaN(parsePercent('0')));
  assert.ok(Number.isNaN(parsePercent('120')));
});

test('19 formations of eleven, one keeper each, on the pitch', () => {
  assert.equal(FORMATIONS.length, 19);
  assert.equal(new Set(FORMATIONS.map((f) => f.id)).size, 19);
  assert.equal(new Set(FORMATIONS.map((f) => f.name)).size, 19);
  for (const f of FORMATIONS) {
    assert.equal(f.positions.length, 11, f.name);
    assert.equal(f.positions.filter((p) => p === 'GK').length, 1, f.name);
    assert.ok(f.positions.every((p) => POSITIONS.includes(p)), f.name);
    const slots = slotsFor(f);
    for (const s of slots) assert.ok(s.x > 0 && s.x < 100 && s.y > 0 && s.y < 100, `${f.name} ${s.pos}`);
    const spots = new Set(slots.map((s) => `${s.x},${s.y}`));
    assert.equal(spots.size, 11, `${f.name}: two slots on one spot`);
    // the shape name counts the outfield lines: 4-3-3 has ten outfield players
    const outfield = f.name.split(' ')[0].split('-').reduce((a, b) => a + Number(b), 0);
    assert.equal(outfield, 10, f.name);
  }
});

test('rarities carry the measured chip pair', () => {
  assert.equal(RARITIES.filter((r) => r.fill).length, 48);
  for (const r of RARITIES.filter((x) => x.fill)) assert.match(r.fill + r.rim, /^#[0-9A-F]{6}#[0-9A-F]{6}$/);
  assert.equal(new Set(RARITIES.map((r) => r.id)).size, RARITIES.length);
  assert.deepEqual(QUALITIES.map((q) => q.name), ['Bronze', 'Silver', 'Gold', 'Gold Rare', 'Elite', 'Premium']);
});

test('number formats from the Brand Book', () => {
  assert.equal(odds(0.025), '2.5% (1 in 40)');
  assert.equal(odds(0.5), '50% (1 in 2)');
  assert.equal(signed(2, 1), '+2.0');
  assert.equal(signed(-2), '−2');
  assert.equal(signed(0), '0');
  assert.equal(timer((7 * 60 + 59) * 60000), '7H 59M');
  assert.equal(timer((12 * 24 + 17) * 3600000), '12D 17H');
  assert.equal(int(21500), '21,500');
  assert.equal(day('2026-10-31'), 'Sat 31 Oct');
});
