import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, describe, matches, exampleChallenge, cleanReq, valueOf } from '../site/js/lib/ptc.js';

let n = 0;
const card = (ovr, pos = 'ST', extra = {}) => ({
  id: `c${++n}`, name: `Player ${n}`, ovr, pos: [].concat(pos), quality: 'gold', rarity: 'normal',
  nation: 'Spain', league: 'Spain 1', club: 'Barcelona', age: 25, stats: { pac: 80, sho: 70 }, sellable: true, ...extra,
});
const ch = (size, reqs, cards) => ({ id: 't', name: 't', size, reqs, cards: [...cards, ...Array(Math.max(0, size - cards.length)).fill(null)] });
const row = (c, i = 1) => evaluate(c).rows[i];

test('the game\'s own example reads as the game writes it', () => {
  const ex = exampleChallenge('x');
  assert.equal(describe(ex.reqs[0]), 'At least 3 players playing ST and rated higher than 65');
  assert.equal(describe(ex.reqs[1]), 'Average rating at least 70');
  assert.equal(ex.size, 5);
});

test('number of players is always the first requirement', () => {
  const e = evaluate(ch(5, [], [card(70), card(71)]));
  assert.equal(e.rows[0].label, 'Number of players');
  assert.equal(e.rows[0].current, '2 / 5');
  assert.equal(e.rows[0].needText, 'Add 3 more cards');
  assert.equal(e.complete, false);
  assert.equal(e.missing, 3);
  assert.equal(evaluate(ch(5, [], [card(1), card(1), card(1), card(1)])).rows[0].needText, 'Add one more card');
});

test('count with a compound condition', () => {
  const reqs = exampleChallenge('x').reqs.slice(0, 1);
  const cards = [card(66), card(65), card(80, 'CM'), card(70)];
  const r = row(ch(5, reqs, cards));
  assert.equal(r.current, '2 / 3'); // 65 is not higher than 65, the CM is not a striker
  assert.equal(r.met, false);
  assert.equal(r.needText, '1 more needed');
  const full = row(ch(4, reqs, cards));
  assert.match(full.needText, /only 0 slots are empty: swap out a card/);
  assert.equal(row(ch(5, reqs, [...cards, card(90)])).met, true);
});

test('count at most and exactly', () => {
  const cards = [card(70), card(70), card(70, 'CB')];
  const atMost = row(ch(3, [{ kind: 'count', op: 'lte', n: 1, where: [{ prop: 'pos', cmp: 'eq', value: 'ST' }] }], cards));
  assert.equal(atMost.met, false);
  assert.equal(atMost.needText, '1 too many: swap one out');
  const exactly = row(ch(3, [{ kind: 'count', op: 'eq', n: 2, where: [{ prop: 'pos', cmp: 'eq', value: 'ST' }] }], cards));
  assert.equal(exactly.met, true);
  assert.equal(describe({ kind: 'count', op: 'eq', n: 1, where: [] }), 'Exactly 1 player');
});

test('the average says what the empty slots must average', () => {
  const avg80 = [{ kind: 'avg', cmp: 'gte', value: 80 }];
  const three = [card(80), card(80), card(74)];
  // 5 x 80 = 400; three cards give 234, so the last two must total 166, an 83 average
  assert.equal(row(ch(5, avg80, three)).needText, 'The last 2 cards must average 83 or more');
  // one slot left: 4 x 80 = 320 - 234 = 86
  assert.equal(row(ch(4, avg80, three)).needText, 'The last card must be rated 86 or higher');
  // an uneven total rounds the needed total up, never down
  assert.equal(row(ch(5, avg80, [card(80), card(80), card(75)])).needText, 'The last 2 cards must average 82.5 or more');
  // out of reach
  assert.match(row(ch(3, avg80, [card(40), card(40)])).needText, /^Out of reach/);
  // already clear with weak cards
  assert.equal(row(ch(3, [{ kind: 'avg', cmp: 'gte', value: 30 }], [card(90), card(90)])).needText, 'Any card in the last slot clears it');
});

test('the average is exact: 79.8 does not clear 80', () => {
  const r = row(ch(5, [{ kind: 'avg', cmp: 'gte', value: 80 }], [card(80), card(80), card(80), card(80), card(79)]));
  assert.equal(r.current, '79.8');
  assert.equal(r.met, false);
  assert.match(r.needText, /^0\.2 OVR short/);
});

test('surplus over the average, for the confirm dialog', () => {
  const e = evaluate(ch(2, [{ kind: 'avg', cmp: 'gte', value: 80 }], [card(81), card(82)]));
  assert.equal(e.complete, true);
  assert.equal(Math.round(e.surplus * 10) / 10, 1.5);
});

test('average at most', () => {
  const r = row(ch(3, [{ kind: 'avg', cmp: 'lte', value: 70 }], [card(75), card(75)]));
  assert.equal(r.needText, 'The last card must be rated 60 or lower');
  const full = row(ch(2, [{ kind: 'avg', cmp: 'lte', value: 70 }], [card(75), card(75)]));
  assert.equal(full.met, false);
});

test('every player rated at least / at most', () => {
  const min = row(ch(3, [{ kind: 'min', value: 75 }], [card(80), card(70, 'ST', { name: 'Low' })]));
  assert.equal(min.met, false);
  assert.equal(min.needText, 'Low is rated below 75: swap it out');
  const ok = row(ch(2, [{ kind: 'min', value: 75 }], [card(80), card(75)]));
  assert.equal(ok.met, true);
  const partial = row(ch(3, [{ kind: 'max', value: 80 }], [card(70)]));
  assert.equal(partial.met, false);
  assert.equal(partial.needText, 'The last 2 cards must be rated 80 or lower');
});

test('total rating', () => {
  const r = row(ch(3, [{ kind: 'sum', value: 240 }], [card(80), card(80)]));
  assert.equal(r.current, '160');
  assert.equal(r.needText, 'The last card must be rated 80 or higher');
  assert.equal(row(ch(2, [{ kind: 'sum', value: 150 }], [card(80), card(80)])).met, true);
});

test('different nationalities, leagues, clubs', () => {
  const cards = [card(70, 'ST', { nation: 'Spain' }), card(70, 'ST', { nation: 'spain ' }), card(70, 'ST', { nation: 'Brazil' })];
  const r = row(ch(4, [{ kind: 'distinct', prop: 'nation', op: 'gte', value: 3 }], cards));
  assert.equal(r.current, '2 / 3'); // case and spaces don't make a new nation
  assert.equal(r.needText, '1 more nationality needed');
  const lte = row(ch(3, [{ kind: 'distinct', prop: 'nation', op: 'lte', value: 1 }], cards));
  assert.equal(lte.needText, '1 nationality too many: swap cards to share one');
  assert.equal(describe({ kind: 'distinct', prop: 'league', op: 'eq', value: 2 }), 'Exactly 2 leagues');
});

test('conditions on every property', () => {
  const c = card(81, ['CAM', 'CM'], { quality: 'rare', rarity: 'team-of-the-week', age: 21, sellable: false, stats: { pac: 88 } });
  assert.equal(matches(c, [{ prop: 'pos', cmp: 'eq', value: 'CAM' }]), true);
  assert.equal(matches(c, [{ prop: 'pos', cmp: 'eq', value: 'CM' }]), false); // the card's position is the one it prints
  assert.equal(valueOf(c, 'line'), 'MID');
  assert.equal(valueOf(card(60, 'GK'), 'line'), 'GK');
  assert.equal(matches(c, [{ prop: 'quality', cmp: 'eq', value: 'rare' }]), true);
  assert.equal(matches(c, [{ prop: 'rarity', cmp: 'ne', value: 'normal' }]), true);
  assert.equal(matches(c, [{ prop: 'age', cmp: 'lte', value: 21 }]), true);
  assert.equal(matches(c, [{ prop: 'sellable', cmp: 'eq', value: false }]), true);
  assert.equal(matches(c, [{ prop: 'pac', cmp: 'gte', value: '85' }]), true);
  assert.equal(matches(c, [{ prop: 'sho', cmp: 'gte', value: 50 }]), false); // a stat nobody entered never qualifies
  assert.equal(matches(c, [{ prop: 'nation', cmp: 'eq', value: 'SPAIN' }]), true);
  assert.equal(matches(c, [{ prop: 'club', cmp: 'ne', value: 'Ajax' }]), true);
});

test('labels for each property', () => {
  const d = (w) => describe({ kind: 'count', op: 'gte', n: 2, where: [w] });
  assert.equal(d({ prop: 'line', cmp: 'eq', value: 'DEF' }), 'At least 2 players playing in DEF');
  assert.equal(d({ prop: 'line', cmp: 'eq', value: 'GK' }), 'At least 2 players playing in goal');
  assert.equal(d({ prop: 'quality', cmp: 'eq', value: 'gold' }), 'At least 2 players of Gold quality');
  assert.equal(d({ prop: 'rarity', cmp: 'eq', value: 'team-of-the-week' }), 'At least 2 players from Team of the Week');
  assert.equal(d({ prop: 'nation', cmp: 'eq', value: 'Brazil' }), 'At least 2 players from Brazil');
  assert.equal(d({ prop: 'league', cmp: 'ne', value: 'Spain 1' }), 'At least 2 players outside Spain 1');
  assert.equal(d({ prop: 'sellable', cmp: 'eq', value: false }), 'At least 2 players that are Unsellable');
  assert.equal(d({ prop: 'sho', cmp: 'gte', value: 80 }), 'At least 2 players with SHO 80 or higher');
  assert.equal(d({ prop: 'age', cmp: 'lt', value: 23 }), 'At least 2 players younger than 23');
  assert.equal(describe({ kind: 'min', value: 75 }), 'Every player rated 75 or higher');
  assert.equal(describe({ kind: 'sum', value: 400 }), 'Total rating at least 400');
});

test('a full, correct challenge is complete', () => {
  const ex = exampleChallenge('x');
  ex.cards = [card(70), card(72), card(68), card(71, 'CM'), card(69, 'CB')];
  const e = evaluate(ex);
  assert.equal(e.complete, true);
  assert.equal(e.unmet.length, 0);
});

test('cleanReq tidies form input and rejects nonsense', () => {
  assert.deepEqual(cleanReq({ kind: 'avg', cmp: 'gte', value: '80' }).req, { kind: 'avg', cmp: 'gte', value: 80 });
  assert.match(cleanReq({ kind: 'avg', value: '120' }).error, /1 to 99/);
  const c = cleanReq({ kind: 'count', op: 'gte', n: '3', where: [{ prop: 'ovr', cmp: 'gt', value: '65' }, { prop: 'pos', cmp: 'gt', value: 'ST' }, { prop: 'age', cmp: 'lt', value: 1 }] }).req;
  assert.equal(c.where.length, 2); // at most two conditions
  assert.equal(c.where[0].value, 65);
  assert.equal(c.where[1].cmp, 'eq'); // a position can't be "greater than"
  assert.match(cleanReq({ kind: 'count', op: 'gte', n: 1, where: [{ prop: 'nation', cmp: 'eq', value: '  ' }] }).error, /nationality/);
  assert.equal(cleanReq({ kind: 'count', op: 'gte', n: 1, where: [{ prop: 'sellable', cmp: 'eq', value: 'no' }] }).req.where[0].value, false);
});
