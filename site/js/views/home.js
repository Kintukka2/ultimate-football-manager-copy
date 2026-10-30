// Home: what the site does, the tools as the game's hub tiles, what is on
// this week, and the mark explained on the one board this page gets.

import { esc } from '../lib/util.js';
import { byId } from '../data/routes.js';
import { POSTS } from '../data/posts.js';
import { FORMATIONS } from '../data/football.js';
import { RARITIES } from '../data/rarities.js';
import { WEEKEND_LEAGUE } from '../data/game.js';
import { wm } from '../lib/board.js';
import { eventRows } from './events.js';

const CHEV = '<span class="chev" aria-hidden="true"><svg viewBox="0 0 14 14"><path d="M5 2.5 9.5 7 5 11.5" fill="none" stroke="#2A2110" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';

// Each tool is a hub tile: an art area in a mode's own colour, then the black
// label band with the gold chevron square. The note is the one fact a player
// would come for.
const TILES = [
  { id: 'ptc-solver', art: 'league', note: 'What a PTC still needs' },
  { id: 'squad-builder', art: 'challenge', note: 'Chemistry before you buy' },
  { id: 'players', art: 'db', note: 'Every card, any stat' },
  { id: 'weekend-league', art: 'wl', note: `Rank 1: ${WEEKEND_LEAGUE.rank1} points` },
  { id: 'packs', art: 'quick', note: 'Odds, counted in packs' },
  { id: 'events', art: 'events', note: 'What ends first' },
];

function tile({ id, art, note }) {
  const r = byId(id);
  return `<a class="hub" href="${r.path}"><span class="hub__art hub__art--${art}"><span class="hub__note">${esc(note)}</span></span>`
    + `<span class="hub__band"><b>${esc(r.nav)}</b>${CHEV}</span><span class="hub__sub">${esc(r.blurb)}</span></a>`;
}

export function render() {
  const specials = RARITIES.filter((r) => r.fill).length;
  return `<section class="masthead"><div class="wrap masthead__body">
    <p class="eyebrow">UFMWiz · Free tools for Ultimate Football Manager 27</p>
    <h1>The maths behind<br> <em>every card</em>.</h1>
    <p>Tools that do the counting so you can do the managing: which cards finish a PTC, whether an eleven clears its Chemistry steps, what a pack's odds mean in packs, and how many wins the Weekend League still needs.</p>
    <ul class="stats">
      <li><b>${FORMATIONS.length}</b>Formations</li>
      <li><b>${specials}</b>Special rarities</li>
      <li><b>${WEEKEND_LEAGUE.rank1}</b>Points for rank 1</li>
      <li><b>0</b>Game files</li>
    </ul>
  </div></section>
  <div class="wrap home">
    <section aria-labelledby="h-tools">
      <h2 class="sub" id="h-tools">The tools</h2>
      <div class="hubtiles home__tiles">${TILES.map(tile).join('')}</div>
    </section>
    <section class="home__split">
      <div>
        <div class="row home__head"><h2 class="sub">This week</h2><a class="more" href="${byId('events').path}">Full calendar ›</a></div>
        <div class="home__events" data-events>${eventRows({ limit: 4 })}</div>
      </div>
      <div>
        <div class="row home__head"><h2 class="sub">From the blog</h2><a class="more" href="${byId('blog').path}">All guides ›</a></div>
        <div class="home__posts">${POSTS.slice(0, 3).map((p) => `<a class="postline" href="blog/${p.slug}/"><b>${esc(p.title)}</b><span>${esc(p.dek)}</span></a>`).join('')}</div>
      </div>
    </section>
    <section class="home__mark">
      <figure class="boardfig">${wm()}</figure>
      <div>
        <h2 class="sub">Why a W</h2>
        <p class="soft">Herbert Chapman's Arsenal played a 3-2-2-3 from 1925, and coaches have drawn it as two letters ever since: the defence makes an M and the five forwards make a W. Our mark is that W, in magnets on a tactics board, with the right winger in the bib because that is where the move ends.</p>
        <p class="soft">When UFMWiz explains something, it draws it on that board. When it shows you the game's numbers, they look the way the game prints them.</p>
      </div>
    </section>
  </div>`;
}

export function mount(body) {
  body.innerHTML = render();
}

// The countdowns move, so redraw them each time the page is shown.
export function show(body) {
  const ev = body.querySelector('[data-events]');
  if (ev) ev.innerHTML = eventRows({ limit: 4 });
}
