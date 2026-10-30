// The calendar. Hand-maintained: update it when an event is announced and
// bump AS_OF. Dates are the game's (UTC); a date we don't have stays null
// rather than guessed, and the page says "not announced".

export const EVENTS_AS_OF = '2026-10-30';

export const EVENTS = [
  {
    id: 'screamers-shop', name: 'Screamers Event Shop', rarity: 'screamers',
    start: '2026-10-11', end: '2026-10-31',
    what: 'Collect event tokens and spend them in the Screamers shop before it closes. Tokens left over when it shuts are worth nothing.',
  },
  {
    id: 'shapeshifters', name: 'Shapeshifters', rarity: 'shapeshifters',
    month: '2026-10',
    what: 'The October rarity event: its own PTCs, missions and Collection Book.',
  },
  {
    id: 'most-wanted', name: 'Most Wanted', rarity: 'most-wanted', next: true,
    what: 'Expected next, with its own tickets, logos and daily-login track. The date is not announced.',
  },
  {
    id: 'totw', name: 'Team of the Week', rarity: 'team-of-the-week', every: 'week',
    what: 'New cards for real players\' form, every week.',
  },
  {
    id: 'weekend-league', name: 'Weekend League', rarity: 'weekend-league', every: 'weekend',
    what: 'Qualify with QP during the week, register before the timer ends, then play 15 games.',
    link: 'weekend-league',
  },
  {
    id: 'potm', name: 'Player of the Month', rarity: 'player-of-the-month', every: 'month',
    what: 'A monthly set of PTCs. Complete all of them for the final Player of the Month card.',
  },
  {
    id: 'season-reset', name: 'Season Reset', season: 'Summer 2027',
    what: 'Squads, coins and tiers reset. Gems, logos and league history carry over. The last reset was on 25 Aug 2026.',
  },
];
