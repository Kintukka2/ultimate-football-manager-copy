// Pack odds. The game's info button shows "the odds for at least 1 player in
// this pack", which is a chance per pack: p. Packs are independent, so the
// chance of at least one hit in n packs is 1 - (1 - p)^n.

export function atLeastOne(p, n) {
  if (!(p > 0) || !(n > 0)) return 0;
  if (p >= 1) return 1;
  return 1 - (1 - p) ** n;
}

// The fewest packs that give at least `target` chance of a hit.
export function packsFor(p, target) {
  if (!(p > 0)) return Infinity;
  if (p >= 1 || !(target > 0)) return target > 0 ? 1 : 0;
  return Math.ceil(Math.log(1 - target) / Math.log(1 - p));
}

// On average, a hit takes 1 / p packs.
export const expectedPacks = (p) => (p > 0 ? 1 / p : Infinity);

// Read a typed percentage: "2.5", "2.5%", "2,5" -> 0.025. Out of range -> NaN.
export function parsePercent(s) {
  const n = Number(String(s).replace('%', '').replace(',', '.').trim());
  return n > 0 && n <= 100 ? n / 100 : NaN;
}
