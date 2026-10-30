import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluate, describe, matches, exampleChallenge, cleanReq, valueOf, requiredTotalFor, maxTotalFor, ratingStatus, buildPlan,
  slotAccepts, nearestFit, planQuickFill, optimiseCheapest, expensivePositions, findDowngrades, findSwaps,
} from '../site/js/lib/ptc.js';

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

test('the average says what the empty slots must total', () => {
  const avg80 = [{ kind: 'avg', cmp: 'gte', value: 80 }];
  const three = [card(80), card(80), card(74)];
  // 5 at 80 is a budget of 5 x 79.5 = 397.5, so 398; three cards give 234, the last two need 164
  const r = row(ch(5, avg80, three));
  assert.equal(r.total, '234 / 398');
  assert.equal(r.current, '78'); // the average as the game shows it, a whole number
  assert.equal(r.needText, 'The last 2 cards must total 164, an average of 82');
  // one slot left: 4 x 79.5 = 318, less 234 is 84
  assert.equal(row(ch(4, avg80, three)).needText, 'The last card must be rated 84 or higher');
  assert.equal(row(ch(5, avg80, [card(80), card(80), card(75)])).needText, 'The last 2 cards must total 163, an average of 81.5');
  assert.match(row(ch(3, avg80, [card(40), card(40)])).needText, /^Out of reach/);
  // a total already banked is met with slots still empty: more cards only add to it
  const banked = row(ch(3, [{ kind: 'avg', cmp: 'gte', value: 30 }], [card(90), card(90)]));
  assert.equal(banked.met, true);
  assert.equal(banked.needText, 'Banked: any card in the last slot clears it');
});

test('the budget is priced half a point under the stated average', () => {
  // The game compares the average it shows, a whole number (FHCWiz verified
  // this on the same Gamebasics conditions module), so n x (N - 0.5), rounded up.
  assert.equal(requiredTotalFor(11, 76), 831);
  assert.equal(requiredTotalFor(11, 80), 875);
  assert.equal(requiredTotalFor(5, 60), 298);
  assert.equal(requiredTotalFor(6, 73), 435); // 6 x 72.5 is whole, not nudged up
  assert.equal(requiredTotalFor(11, 80.5), 880);
  assert.equal(requiredTotalFor(0, 80), 0);
  const at = (avg, ovrs) => evaluate(ch(ovrs.length, [{ kind: 'avg', cmp: 'gte', value: avg }], ovrs.map((o) => card(o)))).rows[1].met;
  assert.equal(at(60, [60, 60, 60, 59, 59]), true, '298 passes a 60 average');
  assert.equal(at(60, [60, 60, 60, 59, 58]), false, '297 does not');
  const short = row(ch(5, [{ kind: 'avg', cmp: 'gte', value: 80 }], [card(80), card(80), card(80), card(79), card(78)]));
  assert.equal(short.current, '79');
  assert.equal(short.needText, '1 OVR short: swap a low card for a higher one');
});

test('the rating as a running total', () => {
  const r = ratingStatus(ch(11, [{ kind: 'avg', cmp: 'gte', value: 75 }], [card(82, 'RB')]));
  assert.equal(r.required, 820); // 11 x 74.5, rounded up
  assert.equal(r.current, 82);
  assert.equal(r.remaining, 738);
  assert.equal(r.left, 10);
  assert.equal(Math.round(r.remainingAverage * 10) / 10, 73.8);
  assert.equal(r.banked, false);
  // the highest budget binds: a total rating above the average's
  const both = ratingStatus(ch(5, [{ kind: 'avg', cmp: 'gte', value: 70 }, { kind: 'sum', value: 380 }], []));
  assert.equal(both.required, 380);
  assert.equal(both.binding.kind, 'sum');
  // an unreachable target is said so
  const e = evaluate(ch(3, [{ kind: 'avg', cmp: 'gte', value: 95 }], [card(40)]));
  assert.equal(e.rating.impossible, true);
  assert.equal(e.rating.maxAchievable, 40 + 198);
  assert.match(e.warnings[0].text, /reaches 238 of the 284 total it needs/);
});

test('surplus over the total, for the confirm dialog', () => {
  const e = evaluate(ch(2, [{ kind: 'avg', cmp: 'gte', value: 80 }], [card(81), card(82)]));
  assert.equal(e.complete, true);
  assert.equal(e.surplus, 4); // 163 against a budget of 2 x 79.5 = 159
  assert.equal(evaluate(ch(3, [{ kind: 'avg', cmp: 'gte', value: 80 }], [card(81), card(82)])).surplus, null); // not full yet
});

test('average at most', () => {
  assert.equal(maxTotalFor(2, 70), 140); // 141 would average 70.5, which shows as 71
  const r = row(ch(3, [{ kind: 'avg', cmp: 'lte', value: 70 }], [card(75), card(75)]));
  assert.equal(r.needText, 'The last card must be rated 61 or lower'); // 3 x 70.5 is 211.5: at most 211
  const full = row(ch(2, [{ kind: 'avg', cmp: 'lte', value: 70 }], [card(75), card(75)]));
  assert.equal(full.met, false);
  assert.equal(full.needText, '10 OVR over: swap a high card for a lower one');
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

// ---- the slot plan, ported from FHCWiz's buildRemainingPlan ----
const strikers = (n, extra = []) => ({ kind: 'count', op: 'gte', n, where: [{ prop: 'pos', cmp: 'eq', value: 'ST' }, ...extra] });
const fromNation = (n, nation) => ({ kind: 'count', op: 'gte', n, where: [{ prop: 'nation', cmp: 'eq', value: nation }] });

test('positions map onto empty slots, other requirements ride on them', () => {
  const { slots, warnings } = buildPlan(ch(3, [strikers(2, [{ prop: 'ovr', cmp: 'gt', value: 65 }]), fromNation(1, 'Brazil')], []));
  assert.equal(warnings.length, 0);
  assert.deepEqual(slots.map((s) => s.pos), ['ST', 'ST', null]);
  assert.deepEqual(slots[0].conds.map((w) => w.prop), ['ovr', 'nation'], 'the Brazil rides a striker slot, keeping the open slot free');
  assert.deepEqual(slots[2].conds, []);
  // a placed striker takes one slot off the plan
  assert.deepEqual(buildPlan(ch(3, [strikers(2)], [card(70)])).slots.map((s) => s.pos), ['ST', null]);
});

test('positions that outnumber the empty slots are said so', () => {
  const { slots, warnings } = buildPlan(ch(3, [strikers(3)], [card(70, 'CB')]));
  assert.equal(slots.length, 2);
  assert.equal(warnings[0].level, 'error');
  assert.equal(warnings[0].text, "The positions still needed take 3 cards, and only 2 slots are empty. Swap out a card that doesn't qualify, or check the requirements.");
});

test('a requirement no empty slot can hold is a conflict', () => {
  const inDef = { kind: 'count', op: 'gte', n: 1, where: [{ prop: 'line', cmp: 'eq', value: 'DEF' }] };
  const { warnings } = buildPlan(ch(2, [strikers(2), inDef], []));
  assert.equal(warnings.length, 1);
  assert.match(warnings[0].text, /^No empty slot can take "At least 1 player playing in DEF"/);
  // a rating range that can't be met on one slot is a clash too
  const high = { kind: 'count', op: 'gte', n: 1, where: [{ prop: 'ovr', cmp: 'gte', value: 85 }] };
  assert.equal(buildPlan(ch(1, [strikers(1, [{ prop: 'ovr', cmp: 'lte', value: 80 }]), high], [])).warnings.length, 1);
});

// ---- quick fill, ported from FHCWiz's quickPick / planQuickFill ----
test('quick add takes the target, steps over before it settles under', () => {
  const fits = [card(90, 'CB', { id: 'cb90' }), card(87, 'CB', { id: 'cb87' }), card(86, 'CB', { id: 'cb86' })];
  assert.equal(nearestFit(fits, 87).id, 'cb87');
  assert.equal(nearestFit(fits.filter((c) => c.id !== 'cb87'), 87).id, 'cb90', 'the smallest step over');
  assert.equal(nearestFit(fits, 95).id, 'cb90', 'the best under when nothing reaches it');
  assert.equal(nearestFit(fits, null).id, 'cb86', 'no target takes the lowest');
  assert.equal(nearestFit([], 80), null);
});

test('a slot accepts only what it asks for', () => {
  const challenge = ch(3, [{ kind: 'max', value: 88 }, { kind: 'count', op: 'lte', n: 1, where: [{ prop: 'rarity', cmp: 'eq', value: 'team-of-the-week' }] }],
    [card(80, 'CM', { rarity: 'team-of-the-week' })]);
  const slot = { pos: 'ST', conds: [{ prop: 'nation', cmp: 'eq', value: 'Brazil' }], reqs: [] };
  assert.equal(slotAccepts(slot, card(80, 'ST', { nation: 'Brazil' }), challenge), true);
  assert.equal(slotAccepts(slot, card(80, 'CM', { nation: 'Brazil' }), challenge), false, 'wrong position');
  assert.equal(slotAccepts(slot, card(80, 'ST', { nation: 'Spain' }), challenge), false, 'misses the attribute');
  assert.equal(slotAccepts(slot, card(90, 'ST', { nation: 'Brazil' }), challenge), false, 'over the 88 cap');
  assert.equal(slotAccepts(slot, card(80, 'ST', { nation: 'Brazil', rarity: 'team-of-the-week' }), challenge), false, 'would make two Team of the Week');
});

test('quick fill lands the budget exactly, and the + finishes the board', () => {
  const shelf = [];
  for (let v = 70; v <= 84; v++) for (let k = 0; k < 4; k++) shelf.push(card(v, 'ST', { id: `s${v}_${k}`, name: `Test Striker ${v}${k}` }));
  const challenge = ch(5, [{ kind: 'avg', cmp: 'gte', value: 77 }, strikers(5)], []);
  const ev = evaluate(challenge);
  const fill = planQuickFill(challenge, shelf, ev);
  assert.equal(fill.targets.reduce((a, b) => a + b, 0), ev.rating.remaining, 'targets sum to the budget, not a point over');
  assert.ok(Math.max(...fill.targets) - Math.min(...fill.targets) <= 1, 'and as flat as the cards allow');
  fill.picks.forEach((p, i) => assert.equal(p.ovr, fill.targets[i]));
  // press + on the first empty slot, five times
  for (let step = 0; step < 5; step++) {
    const f = planQuickFill(challenge, shelf);
    challenge.cards[challenge.cards.indexOf(null)] = f.picks[0];
  }
  const done = evaluate(challenge);
  assert.equal(done.complete, true);
  assert.equal(done.rating.current, done.rating.required, 'with nothing spent past the total');
});

test('quick fill hands a lone card to the slot that needs it, and skips used cards', () => {
  const gk = card(70, 'GK', { id: 'gk70' }), st = card(70, 'ST', { id: 'st70' });
  const challenge = ch(2, [{ kind: 'avg', cmp: 'gte', value: 70 }, { kind: 'count', op: 'gte', n: 1, where: [{ prop: 'pos', cmp: 'eq', value: 'GK' }] }], []);
  const fill = planQuickFill(challenge, [st, gk]);
  assert.equal(fill.slots[0].pos, 'GK');
  assert.equal(fill.picks[0].id, 'gk70', 'the only keeper goes to the keeper slot');
  assert.equal(fill.picks[1].id, 'st70', 'and the open slot takes the other card');
  challenge.cards[0] = gk;
  assert.equal(planQuickFill(challenge, [st, gk]).picks[0].id, 'st70', 'a card on the board is never offered again');
});

test('quick fill sets no targets once the rating is banked', () => {
  const challenge = ch(2, [{ kind: 'avg', cmp: 'gte', value: 50 }], [card(99)]);
  const fill = planQuickFill(challenge, [card(80, 'ST', { id: 'a' }), card(72, 'ST', { id: 'b' })]);
  assert.equal(fill.targets, null);
  assert.equal(fill.picks[0].id, 'b', 'and takes the lowest rating');
});

// ---- cheapest completion, ported from FHCWiz's optimiseCheapest ----
test('the optimiser picks the cheapest mix that clears the total', () => {
  const slots = [{ pos: 'ST', conds: [], reqs: [] }, { pos: 'CB', conds: [], reqs: [] }];
  const market = [{ pos: 'ST', ovr: 90, price: 100 }, { pos: 'ST', ovr: 85, price: 40 }, { pos: 'CB', ovr: 90, price: 500 }, { pos: 'CB', ovr: 95, price: 600 }];
  const res = optimiseCheapest(slots, market, 180);
  assert.equal(res.feasible, true);
  assert.equal(res.totalCost, 600);
  assert.ok(res.totalOvr >= 180);
  assert.equal(optimiseCheapest(slots, market, 180).totalCost, 600, 'the same answer twice: no state between runs');
  assert.equal(optimiseCheapest(slots, market, 0).totalCost, 540, 'no rating left to find: the cheapest card for each slot');
  assert.equal(optimiseCheapest([{ pos: null, conds: [], reqs: [] }], market, 0).totalCost, 40, 'an open slot takes a price for any position');
});

test('the optimiser says when it cannot finish', () => {
  const one = [{ pos: 'ST', conds: [], reqs: [] }];
  const short = optimiseCheapest(one, [{ pos: 'ST', ovr: 70, price: 10 }], 95);
  assert.equal(short.feasible, false);
  assert.match(short.reason, /^No mix of the prices entered reaches/);
  const none = optimiseCheapest([{ pos: 'GK', conds: [], reqs: [] }], [{ pos: 'ST', ovr: 90, price: 10 }], 90);
  assert.equal(none.feasible, false);
  assert.equal(none.reason, 'No price entered yet that fits the GK slot.');
  const capped = optimiseCheapest(one, [{ pos: 'ST', ovr: 90, price: 10 }], 0, { reqs: [{ kind: 'max', value: 85 }] });
  assert.equal(capped.feasible, false, 'a price over the cap on every card does not count');
  assert.equal(optimiseCheapest([], [], 50).totalCost, 0);
});

test('the dearest position per OVR point', () => {
  const p = expensivePositions([{ pos: 'ST', ovr: 80, price: 8000 }, { pos: 'CB', ovr: 80, price: 2000 }, { pos: 'ST', ovr: 70, price: 7000 }]);
  assert.deepEqual(p.map((x) => x.pos), ['ST', 'CB']);
});

// ---- downgrades, ported from FHCWiz's findDowngrades ----
test('downgrades: what a card could drop to and still pass', () => {
  assert.deepEqual(findDowngrades([card(80), card(88)], 3).map((d) => [d.card.ovr, d.to]), [[88, 85], [80, 77]]);
  assert.deepEqual(findDowngrades([card(80)], 0), []);
});

test('swaps keep your better cards and never break another requirement', () => {
  const challenge = ch(2, [{ kind: 'avg', cmp: 'gte', value: 80 }, strikers(1)], [card(90, 'ST', { id: 'top', name: 'Test Forward' }), card(80, 'CB', { id: 'cb80' })]);
  // 170 against a budget of 159: 11 over
  const pool = [card(82, 'ST', { id: 'st82', name: 'Test Backup' }), card(79, 'ST', { id: 'st79', name: 'Test Spare' }), card(70, 'CB', { id: 'cb70' }), card(75, 'CM', { id: 'cm75' })];
  const swaps = findSwaps(challenge, pool);
  assert.equal(swaps[0].out.id, 'top');
  assert.equal(swaps[0].in.id, 'st79', 'the lowest striker that still clears: 79 + 80 = 159');
  assert.equal(swaps.find((s) => s.out.id === 'cb80').in.id, 'cb70', 'any card can stand in for the CB');
  assert.equal(findSwaps(challenge, [card(85, 'CM', { id: 'cm85' })]).filter((s) => s.out.id === 'top').length, 0, 'the only striker is not swapped for a CM');
  assert.deepEqual(findSwaps(ch(2, [{ kind: 'avg', cmp: 'gte', value: 80 }], [card(80)]), pool), [], 'an unfinished board has nothing to give back');
});
