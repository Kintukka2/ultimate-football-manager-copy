// Weekend League arithmetic. A win is 4 points and a loss 1, over 15 games,
// so a weekend always scores 15 + 3 x wins. Every number here is the game's
// rule except the QP figures, which are what players report (data/game.js).

import { WEEKEND_LEAGUE as WL } from '../data/game.js';

export const points = (wins, losses) => WL.win * wins + WL.loss * losses;

// The fewest total wins that reach a points target over a full weekend.
export function winsFor(target, games = WL.games) {
  const perWin = WL.win - WL.loss;
  return Math.max(0, Math.ceil((target - WL.loss * games) / perWin));
}

// Where a weekend stands: played games so far, wins among them, a target.
export function plan({ played = 0, wins = 0, target = WL.rank1, games = WL.games } = {}) {
  played = Math.max(0, Math.min(games, Math.floor(played)));
  wins = Math.max(0, Math.min(played, Math.floor(wins)));
  const left = games - played;
  const now = points(wins, played - wins);
  const best = now + WL.win * left;
  const totalWins = winsFor(target, games);
  const need = Math.max(0, totalWins - wins);
  return {
    played, wins, losses: played - wins, left, now, best, target,
    need,                       // wins still needed from the games left
    canLose: Math.max(0, left - need),
    reached: now >= target,
    possible: need <= left,
  };
}

// Wins to the qualification threshold at a given QP per win.
export function qpWins(qp, perWin = WL.qpPerWin, threshold = WL.qpThreshold) {
  if (!(perWin > 0)) return Infinity;
  return Math.max(0, Math.ceil((threshold - qp) / perWin));
}
