import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from '../site/js/lib/cards.js';
import { DEFAULT_FILTER, filterCards, sortCards, band, SORTS } from '../site/js/lib/filter.js';

const card = (o) => normalize(o).card;
const CARDS = [
  card({ name: 'Test Striker', ovr: 84, pos: 'ST', quality: 'gold', nation: 'Spain', league: 'Spain 1', club: 'Test FC', pac: 88, sho: 86 }),
  card({ name: 'Test Playmaker', ovr: 81, pos: 'CM CAM', quality: 'rare', rarity: 'team-of-the-week', club: 'Sample United', pac: 70 }),
  card({ name: 'Test Keeper', ovr: 79, pos: 'GK', quality: 'gold', div: 80, ref: 82, sellable: 'no' }),
  card({ name: 'Test Back', ovr: 66, pos: 'LB', quality: 'silver', pac: 75 }),
];
const f = (o) => ({ ...DEFAULT_FILTER, ...o });
const names = (cs) => cs.map((c) => c.name);

test('position matches any position the card lists', () => {
  assert.deepEqual(names(filterCards(CARDS, f({ pos: 'CAM' }))), ['Test Playmaker']);
  assert.deepEqual(names(filterCards(CARDS, f({ pos: 'CM' }))), ['Test Playmaker']);
  assert.equal(filterCards(CARDS, f({ pos: 'RB' })).length, 0);
});

test('OVR range is inclusive and ignores empty bounds', () => {
  assert.deepEqual(names(filterCards(CARDS, f({ ovrMin: 79, ovrMax: 81 }))), ['Test Playmaker', 'Test Keeper']);
  assert.equal(filterCards(CARDS, f({ ovrMin: '', ovrMax: '' })).length, 4);
});

test('quality, rarity, sellable and search filters', () => {
  assert.deepEqual(names(filterCards(CARDS, f({ quality: 'silver' }))), ['Test Back']);
  assert.deepEqual(names(filterCards(CARDS, f({ rarity: 'team-of-the-week' }))), ['Test Playmaker']);
  assert.deepEqual(names(filterCards(CARDS, f({ sell: 'no' }))), ['Test Keeper']);
  assert.equal(filterCards(CARDS, f({ sell: 'yes' })).length, 3);
  assert.deepEqual(names(filterCards(CARDS, f({ q: 'spain' }))), ['Test Striker']);
});

test('sorting by a stat puts cards without it last, both ways', () => {
  assert.deepEqual(names(sortCards(CARDS, 'pac', 'desc')), ['Test Striker', 'Test Back', 'Test Playmaker', 'Test Keeper']);
  assert.deepEqual(names(sortCards(CARDS, 'pac', 'asc')), ['Test Playmaker', 'Test Back', 'Test Striker', 'Test Keeper']);
});

test('sorting by OVR and by name', () => {
  assert.deepEqual(names(sortCards(CARDS, 'ovr', 'desc')), ['Test Striker', 'Test Playmaker', 'Test Keeper', 'Test Back']);
  assert.deepEqual(names(sortCards(CARDS, 'name', 'asc')), ['Test Back', 'Test Keeper', 'Test Playmaker', 'Test Striker']);
  assert.deepEqual(names(sortCards(CARDS, 'name', 'desc')), ['Test Striker', 'Test Playmaker', 'Test Keeper', 'Test Back']);
});

test('sorting never reorders the input', () => {
  const before = names(CARDS);
  sortCards(CARDS, 'pac');
  assert.deepEqual(names(CARDS), before);
});

test('stat value bands at their edges', () => {
  assert.equal(band(59), 'low');
  assert.equal(band(60), 'mid');
  assert.equal(band(77), 'mid');
  assert.equal(band(78), 'high');
  assert.equal(band(undefined), '');
});

test('every sort key is unique', () => {
  const keys = SORTS.map((s) => s.key);
  assert.equal(new Set(keys).size, keys.length);
});
