// Rules and numbers from Ultimate Football Manager 27 that the tools count
// with. Each one says where it comes from, because the site shows its working.
//   game:     printed in the game's own interface or help text (build 27.4.0)
//   reported: what players report, with the month it was reported

export const AS_OF = '2026-10-30';

export const WEEKEND_LEAGUE = {
  games: 15,          // game
  win: 4,             // game
  loss: 1,            // game
  ranks: 10,          // game
  rank1: 55,          // game
  unlockTier: 'Amateur 2', // game
  qpThreshold: 1500,  // reported, Sep 2026 (1,000 in UFM 26)
  // QP a win gives: not printed, and the one figure players quote (about 10)
  // would make the threshold 150 wins, so the planner asks for it instead.
  qpPerWin: null,
};

export const CHALLENGE_MATCH = { win: 100, loss: 30 }; // game

// Chemistry, from the game's help text: starters who share a nationality, a
// league or a special rarity get a boost, up to +3 each, and the bench never
// counts. Only the first two nationality steps are printed anywhere. The rest
// live in the game's Chemistry view, so the Squad Builder lets you enter them.
export const CHEMISTRY = {
  max: 3,
  thresholds: {
    nation: [2, 5, null],  // +1 at 2 players, +2 at 5: game. +3: not printed
    league: [null, null, null],
    rarity: [null, null, null],
  },
};

export const FITNESS = {
  regenPerHour: 1,    // game: +1% an hour
};

export const QUICK_MATCH = {
  energyCap: 3,       // game: energy only regenerates below the cap
  hoursPerEnergy: 7.5, // reported, Sep 2026: about 7 to 8 hours
};

// Pack sizes, by the names the game prints.
export const PACK_SIZES = [
  { name: 'Single Pack', players: 1 },
  { name: 'Mini Pack', players: 3 },
  { name: 'Pack', players: 5 },
  { name: 'Plus Pack', players: 7 },
  { name: 'Large Pack', players: 10 },
  { name: 'Grand Pack', players: 12 },
  { name: 'Mega Pack', players: 20 },
  { name: 'Ultra Pack', players: 24 },
  { name: 'Supreme Pack', players: 30 },
  { name: 'Giga Pack', players: 40 },
  { name: 'Draft Pick', players: 1, note: 'Pick one of the players shown' },
];

export const TIERS = [
  { rank: 'Amateur', colour: '#D3AD8D', steps: ['Amateur 1', 'Amateur 2', 'Amateur 3'] },
  { rank: 'Semi-Pro', colour: '#A9C4C4', steps: ['Semi-Pro 1', 'Semi-Pro 2', 'Semi-Pro 3'] },
  { rank: 'Pro', colour: '#F7CF5C', steps: ['Pro 1', 'Pro 2', 'Pro 3'] },
  { rank: 'Legendary', colour: '#DDCFC8', steps: ['Legendary 1', 'Legendary 2', 'Legendary 3'] },
];
