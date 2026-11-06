// The special books against the rarity list. data/ufm27-special-books.csv is
// each special book's index as the game shows it, one row per set; every book
// belongs to one rarity in site/js/data/rarities.js (docs/data/special-books.md).

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCSV } from '../site/js/lib/cards.js';
import { RARITIES } from '../site/js/data/rarities.js';

const [head, ...rows] = parseCSV(readFileSync(new URL('../data/ufm27-special-books.csv', import.meta.url), 'utf8'));
const sets = rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
const books = new Map();
for (const s of sets) {
  if (!books.has(s.book)) books.set(s.book, []);
  books.get(s.book).push(s);
}

test('the Collection Books screen counts 14 special books', () => {
  assert.equal(books.size, 14);
});

test('each special book is one rarity, and no rarity has two books', () => {
  const ids = new Set(RARITIES.map((r) => r.id));
  const seen = new Map();
  for (const [book, rows] of books) {
    const rarities = new Set(rows.map((r) => r.rarity));
    assert.equal(rarities.size, 1, `${book} names more than one rarity`);
    const [id] = rarities;
    assert.ok(ids.has(id), `${book}: ${id} is not in rarities.js`);
    assert.ok(!seen.has(id), `${id} has two books, ${seen.get(id)} and ${book}`);
    seen.set(id, book);
  }
});

test('each book numbers its sets 1 to n and names none twice', () => {
  for (const [book, rows] of books) {
    assert.deepEqual(rows.map((r) => Number(r.slot)), rows.map((_, i) => i + 1), `${book} slots`);
    const named = rows.map((r) => r.set).filter(Boolean);
    assert.equal(new Set(named).size, named.length, `${book} names a set twice`);
  }
});
