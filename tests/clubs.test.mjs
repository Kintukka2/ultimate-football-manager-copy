// The club list against the league books. data/ufm27-league-books.csv is each
// book's index as the game shows it; data/ufm27-clubs.csv gives every club a
// league. Where a book has been read the two must agree exactly, because the
// book wins (docs/data/club-leagues.md).

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCSV } from '../site/js/lib/cards.js';

function read(name) {
  const [head, ...rows] = parseCSV(readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

const clubs = read('ufm27-clubs.csv');
const leagues = new Set(read('ufm27-leagues.csv').map((r) => r.league));
const books = new Map();
for (const { league, slot, club } of read('ufm27-league-books.csv')) {
  if (!books.has(league)) books.set(league, []);
  books.get(league).push({ slot: Number(slot), club });
}

test('each book is one of the 30 leagues, its slots numbered 1 to n', () => {
  for (const [league, rows] of books) {
    assert.ok(leagues.has(league), `${league} is not in ufm27-leagues.csv`);
    assert.deepEqual(rows.map((r) => r.slot), rows.map((_, i) => i + 1), `${league} slots`);
  }
});

test('no club is in two books', () => {
  const seen = new Map();
  for (const [league, rows] of books) {
    for (const { club } of rows) {
      assert.ok(!seen.has(club) || seen.get(club) === league, `${club} is in ${seen.get(club)} and ${league}`);
      seen.set(club, league);
    }
  }
});

test('every club in a book is a club in the list, under the name the game shows', () => {
  const names = new Set(clubs.map((c) => c.club));
  for (const [league, rows] of books) {
    for (const { club } of rows) assert.ok(names.has(club), `${league}: ${club} is not in ufm27-clubs.csv`);
  }
});

// A shown name can stand for two clubs (Kraków Red is Cracovia and Wisła
// Kraków, and the Poland book lists it twice), and two keys can show the same
// name for the same club (both Laval keys are Stade Laval, and the France 2
// book lists it once). So a club is its shown name with its season club.
test('a league whose book has been read has exactly the clubs in it', () => {
  for (const [league, rows] of books) {
    const listed = new Map();
    for (const c of clubs) if (c.league === league) listed.set(`${c.club}\n${c.season_name}`, c.club);
    assert.deepEqual([...listed.values()].sort(), rows.map((r) => r.club).sort(), league);
  }
});
