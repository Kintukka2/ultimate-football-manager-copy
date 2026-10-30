// Compare: what two to four cards share, who leads, and the link that
// carries a comparison.

import test from 'node:test';
import assert from 'node:assert/strict';
import { sharedStats, focusOptions, bestOf, compare, normalizePicks, linkQuery, readQuery, MAX } from '../site/js/lib/compare.js';

const out = (id, ovr, s, extra = {}) => ({ id, name: id, ovr, pos: ['ST'], source: 'db', stats: { pac: s[0], sho: s[1], pas: s[2], drb: s[3], def: s[4], phy: s[5] }, ...extra });
const keeper = { id: 'k', name: 'k', ovr: 80, pos: ['GK'], source: 'db', stats: { div: 80, han: 78, kck: 70, ref: 82, spd: 55, gkp: 79 } };

test('outfield cards share all six; a keeper shares only PAC with them', () => {
  assert.deepEqual(sharedStats([out('a', 80, [1, 2, 3, 4, 5, 6]), out('b', 81, [1, 2, 3, 4, 5, 6])]), ['PAC', 'SHO', 'PAS', 'DRB', 'DEF', 'PHY']);
  assert.deepEqual(sharedStats([out('a', 80, [70, 2, 3, 4, 5, 6]), keeper]), ['PAC']);
  const c = compare([out('a', 80, [70, 2, 3, 4, 5, 6]), keeper]);
  assert.equal(c.mixed, true);
  assert.deepEqual(c.ratings.map((r) => r.key), ['OVR', 'PAC']);
  assert.deepEqual(c.ratings[1].vals, [70, 55], 'the keeper\'s Speed meets on PAC');
});

test('focus options: each stat, then each pair', () => {
  const o = focusOptions(['PAC', 'SHO', 'PAS']);
  assert.deepEqual(o.map((x) => x.id), ['PAC', 'SHO', 'PAS', 'PAC+SHO', 'PAC+PAS', 'SHO+PAS']);
});

test('the leader: highest value, nobody when level or alone', () => {
  assert.equal(bestOf([80, 85, 85]), 85);
  assert.equal(bestOf([80, 80]), null);
  assert.equal(bestOf([80, null]), null);
});

test('a pair in focus adds a sum row and names who leads, and by how much', () => {
  const c = compare([out('a', 80, [90, 70, 1, 1, 1, 1]), out('b', 84, [80, 85, 1, 1, 1, 1]), out('c', 70, [60, 60, 1, 1, 1, 1])], 'PAC+SHO');
  const sum = c.ratings.find((r) => r.kind === 'sum');
  assert.deepEqual(sum.vals, [160, 165, 120]);
  assert.deepEqual(c.top, [1]);
  assert.equal(c.margin, 5);
  assert.equal(c.ratings[0].best, 84, 'OVR still marks its own leader');
  const level = compare([out('a', 80, [90, 1, 1, 1, 1, 1]), out('b', 84, [90, 1, 1, 1, 1, 1])], 'PAC');
  assert.equal(level.level, true);
  assert.deepEqual(level.top, []);
});

test('picks: deduped, two kinds only, four at most', () => {
  const p = normalizePicks([{ src: 'db', id: 'a' }, { src: 'db', id: 'a' }, { src: 'mine', id: 'a' }, { src: 'x', id: 'b' }, { src: 'db', id: 'c' }, { src: 'db', id: 'd' }, { src: 'db', id: 'e' }]);
  assert.equal(p.length, MAX);
  assert.deepEqual(p.map((x) => `${x.src}:${x.id}`), ['db:a', 'mine:a', 'db:c', 'db:d']);
});

test('the link carries database cards by their page, and reads back', () => {
  const a = out('a', 80, [1, 2, 3, 4, 5, 6]), b = out('b', 81, [1, 2, 3, 4, 5, 6]);
  const mine = { ...out('m', 90, [1, 2, 3, 4, 5, 6]), source: 'mine' };
  const slugs = { a: 'card-a', b: 'card-b' };
  const q = linkQuery([a, mine, b], 'PAC+SHO', slugs);
  assert.equal(q, 'cards=card-a,card-b&focus=pac-sho');
  assert.deepEqual(readQuery('?' + q, [a, b], slugs), { picks: [{ src: 'db', id: 'a' }, { src: 'db', id: 'b' }], focus: 'PAC+SHO' });
  assert.equal(linkQuery([mine], '', slugs), '', 'my own cards stay on this device');
  assert.equal(readQuery('?cards=nobody', [a], slugs), null);
  assert.deepEqual(readQuery('?cards=card-b,ghost&focus=<script>', [a, b], slugs), { picks: [{ src: 'db', id: 'b' }], focus: '' });
});
