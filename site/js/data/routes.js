// Every page on the site. The path is relative to the site root and is what the
// links, the generated pages (tools/build.mjs) and the router all read, so a
// page moves by changing it here and nowhere else. Tool paths are namespaced by
// edition, as on FHCWiz: the August reset moves them to /ufm28/ and keeps
// /ufm27/ as an archive.

export const SITE = {
  name: 'UFMWiz',
  origin: 'https://ufmwiz.com',
  version: '0.1.0',
  game: 'Ultimate Football Manager 27',
  build: '27.4.0',
};

export const ROUTES = [
  {
    id: 'home', path: '', nav: 'Home',
    title: 'UFMWiz: PTC Solver, Squad Builder and card database for UFM 27',
    desc: 'Free tools for Ultimate Football Manager 27 that do the counting: a PTC solver, a Chemistry squad builder, a card database, pack odds and a Weekend League planner. A fan project, not affiliated with Gamebasics.',
  },
  {
    id: 'ptc-solver', path: 'ufm27/ptc-solver/', nav: 'PTC Solver', short: 'Solver',
    head: 'PTC Solver', sub: 'Work out what a challenge still needs',
    blurb: 'Finish a Player Trade Challenge without the arithmetic',
    title: 'UFM 27 PTC Solver: what a Player Trade Challenge still needs | UFMWiz',
    desc: 'Enter any Ultimate Football Manager 27 Player Trade Challenge and the cards you plan to trade in. See which requirements are met, what is still missing and the lowest rating that closes the average.',
  },
  {
    id: 'players', path: 'ufm27/players/', nav: 'Players',
    head: 'Players', sub: 'Every card, filtered by any stat',
    blurb: 'The card database, and the cards you own',
    title: 'UFM 27 Players: card database with every stat | UFMWiz',
    desc: 'Search Ultimate Football Manager 27 cards by rating, position, league, nationality, rarity and any sub-stat, and keep a list of the cards you own for the PTC Solver and Squad Builder.',
  },
  {
    id: 'squad-builder', path: 'ufm27/squad-builder/', nav: 'Squad Builder', short: 'Squad',
    head: 'Squad Builder', sub: 'Lay out an eleven and see its Chemistry',
    blurb: 'Chemistry and team OVR before you buy anyone',
    title: 'UFM 27 Squad Builder: Chemistry and team OVR | UFMWiz',
    desc: 'Pick one of the 19 Ultimate Football Manager 27 formations, drop in your cards and see each starter\'s Chemistry, position fit and the team OVR before you spend a coin on the market.',
  },
  {
    id: 'packs', path: 'ufm27/packs/', nav: 'Packs',
    head: 'Packs', sub: 'What a pack holds and what the odds mean',
    blurb: 'Published odds turned into pulls',
    title: 'UFM 27 Packs: sizes and what the odds mean | UFMWiz',
    desc: 'Every Ultimate Football Manager 27 pack size, and a calculator that turns the odds the game publishes into how many packs a pull really takes.',
  },
  {
    id: 'weekend-league', path: 'ufm27/weekend-league/', nav: 'Weekend League', short: 'WL',
    head: 'Weekend League', sub: 'Qualify, then count the wins each rank needs',
    blurb: 'Qualification Points and the wins for each rank',
    title: 'UFM 27 Weekend League planner: QP and wins per rank | UFMWiz',
    desc: 'How many wins your Ultimate Football Manager 27 Weekend League still needs: Qualification Points to the threshold, then the wins out of 15 for any rank. Rank 1 takes 55 points.',
  },
  {
    id: 'events', path: 'ufm27/events/', nav: 'Events',
    head: 'Events', sub: 'What is live and what ends this week',
    blurb: 'The calendar, with what ends first',
    title: 'UFM 27 Events: what is live and what ends next | UFMWiz',
    desc: 'The Ultimate Football Manager 27 calendar: the live rarity events, the weekly Team of the Week and Weekend League, Player of the Month and the next Season Reset.',
  },
  {
    id: 'blog', path: 'blog/', nav: 'Blog',
    head: 'Blog', sub: 'Guides that show the working',
    blurb: 'Guides, with the arithmetic shown',
    title: 'UFMWiz Blog: Ultimate Football Manager 27 guides | UFMWiz',
    desc: 'Guides to Ultimate Football Manager 27 that lead with the answer and show the working: Chemistry, Fitness and Focus, the Weekend League and more.',
  },
  { id: 'post', path: 'blog/:slug/', parent: 'blog' },
  {
    id: 'compare', path: 'ufm27/compare/', nav: 'Compare',
    head: 'Compare', sub: 'Two to four cards, stat by stat',
    blurb: 'Two to four cards, stat by stat',
    title: 'UFM 27 Compare Players: cards side by side, stat by stat | UFMWiz',
    desc: 'Put two to four Ultimate Football Manager 27 cards side by side: OVR and every shared sub-stat, the leader on each, and a link that opens the same comparison.',
  },
  // The card database as pages. Each card and each hub is a real file,
  // written by tools/build.mjs from site/data/cards.json, and belongs to Players.
  { id: 'card', path: 'ufm27/players/:slug/', parent: 'players' },
  {
    id: 'best-cards', path: 'ufm27/best-cards/', parent: 'players',
    head: 'Best cards', sub: 'The database, ranked',
    title: 'Best UFM 27 cards: the top cards by OVR and by position | UFMWiz',
    desc: 'The best Ultimate Football Manager 27 cards in the UFMWiz database: the top ten by OVR, the best three at every position, and the best Unsellable cards.',
  },
  {
    id: 'rarities', path: 'ufm27/rarities/', parent: 'players',
    head: 'Rarities', sub: 'Every special set and its cards',
    title: 'UFM 27 rarities: every special set and its cards | UFMWiz',
    desc: 'Every special rarity in Ultimate Football Manager 27, from Team of the Week to Screamers, with the cards the UFMWiz database holds for each.',
  },
  { id: 'rarity', path: 'ufm27/rarities/:slug/', parent: 'players' },
  {
    id: 'clubs', path: 'ufm27/clubs/', parent: 'players',
    head: 'Clubs', sub: 'Cards by the club on the card',
    title: 'UFM 27 clubs: cards by club | UFMWiz',
    desc: 'Ultimate Football Manager 27 cards grouped by the club printed on the card, best first.',
  },
  { id: 'club', path: 'ufm27/clubs/:slug/', parent: 'players' },
  {
    id: 'positions', path: 'ufm27/positions/', parent: 'players',
    head: 'Positions', sub: 'The best cards in each of the twelve',
    title: 'UFM 27 positions: the best cards in each | UFMWiz',
    desc: 'Ultimate Football Manager 27 cards by position, from goalkeeper to striker, best first.',
  },
  { id: 'position', path: 'ufm27/positions/:slug/', parent: 'players' },
  {
    id: 'about', path: 'about/', nav: 'About',
    head: 'About', sub: 'A fan project, said clearly',
    title: 'About UFMWiz and privacy | UFMWiz',
    desc: 'What UFMWiz is, what it is not, where its data comes from and what it stores. An independent fan project for Ultimate Football Manager 27.',
  },
  // Served for any address that isn't a page; it has no path of its own.
  { id: 'notfound', path: null, head: 'Not found', sub: 'That page isn\'t on the board', title: 'Page not found | UFMWiz' },
];

export const byId = (id) => ROUTES.find((r) => r.id === id);

// The rail on a wide screen, in order.
export const RAIL = ['home', 'ptc-solver', 'players', 'compare', 'squad-builder', 'packs', 'weekend-league', 'events', 'blog'];
// The phone's thumb bar has room for four and More; the rest live in the sheet.
export const THUMB = ['home', 'ptc-solver', 'players', 'squad-builder'];
export const SHEET = ['compare', 'packs', 'weekend-league', 'events', 'blog', 'about'];

// Match a site-relative path ("ufm27/players/", "blog/x/") to a route.
export function match(rel) {
  let p = rel.replace(/^\/+/, '').replace(/index\.html$/, '');
  if (p && !p.endsWith('/')) p += '/';
  for (const r of ROUTES) {
    if (r.path == null) continue;
    if (!r.path.includes(':')) { if (r.path === p) return { route: r, params: {} }; continue; }
    const re = new RegExp('^' + r.path.replace(/:([a-z]+)/g, '(?<$1>[a-z0-9-]+)') + '$');
    const m = p.match(re);
    if (m) return { route: r, params: { ...m.groups } };
  }
  return null;
}
