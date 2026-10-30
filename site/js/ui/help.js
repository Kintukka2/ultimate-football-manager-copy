// Help: a "?" on every tool page, with that page's answers, and a guided tour
// of it. Ported from FHCWiz's help, in UFMWiz's voice and system: advice
// inverts, so the panel and the tour bubble are white boxes with dark text,
// and the tour keeps the dark scrim. The answers lead with the answer, use the
// game's own words, and say "players report" for anything the game doesn't
// print (docs/voice.md).

import { esc } from '../lib/util.js';

// A tour step points at something already on the page. A step whose target
// is missing or hidden is skipped when the tour runs, so a tour written for a
// full page still works on an empty one.
export const TOURS = {
  'ptc-solver': [
    { target: '.boardempty', title: 'Start here', text: 'Set up a challenge from the game\'s requirement screen, or load the game\'s own example to see how the solver reads one.' },
    { target: '.ptc-bar', title: 'Your challenges', text: 'Set up a PTC, switch between the ones you have, or edit one. Each holds the number of players and every requirement the game lists.' },
    { target: '.ptc-answer', title: 'The answer', text: 'What the challenge still needs, in one line. It changes as you add cards.' },
    { target: '.ptc-slots', title: 'The slots', text: 'One per player the challenge asks for. Tap an empty one to pick one of your cards, or type a card in.' },
    { target: '.reqs', title: 'Requirements', text: 'The same list the game shows, with a running count. A row turns green when it is met.' },
    { target: '[data-act="complete"]', title: 'Complete', text: 'Unlocks when every requirement is met. Completing trades the cards in: they come out of My cards, as they leave your club in the game.' },
  ],
  players: [
    { target: '.pl-top', title: 'Two lists', text: 'Database holds the cards players have sent in. My cards holds yours, and the PTC Solver and Squad Builder pick from it.' },
    { target: '.pl-tools', title: 'Your cards', text: 'Add a card, or import a CSV of all of them at once. Export writes the same file back, which is also your backup.' },
    { target: '.pl-filters', title: 'Filters', text: 'Search by name, club, nation or league, and narrow by quality, rarity, rating or Sellable. Sort by any stat.' },
    { target: '.pl-postabs', title: 'Positions', text: 'One tap per position. All shows every card.' },
    { target: '.pl-list', title: 'The list', text: 'Tap a card to see it in full: its six stats, positions, nation, league and club.' },
  ],
  'squad-builder': [
    { target: '.sq-bar', title: 'Lineups and formations', text: 'Four lineups, like the game\'s presets, each with its own formation. Auto order fills the empty slots from your cards, best rating first.' },
    { target: '.sq-pitch', title: 'The pitch', text: 'Tap a slot to add a card. The pips under it are its Chemistry, and the glow says whether it is in its own position.' },
    { target: '.sq-side', title: 'The numbers', text: 'Team OVR, ATT, MID and DEF and the CHM badge, for the eleven on the pitch.' },
    { target: '[data-region="thresholds"]', title: 'Thresholds', text: 'How many starters each Chemistry step takes. Type in the ones the game\'s Chemistry view shows; they are kept in this browser.' },
  ],
  packs: [
    { target: '[data-calc]', title: 'The odds you see', text: 'Type a chance from a pack\'s info screen, how many of that pack you would open and, if you like, its price.' },
    { target: '[data-out]', title: 'What it means', text: 'The chance of at least one hit, the packs an even chance takes, and what a pull costs on average.' },
    { target: '.packs aside', title: 'Pack sizes', text: 'How many players each size of pack holds.' },
  ],
  'weekend-league': [
    { target: '.wl__tile', title: 'The rules', text: 'Fifteen games, 4 points a win and 1 a loss. Rank 1 is 55 points.' },
    { target: '[data-form="qualify"]', title: 'Qualify', text: 'Your QP and what a win gives you. The planner counts the wins to the threshold.' },
    { target: '[data-form="weekend"]', title: 'Your weekend', text: 'Games played and wins so far. It says how many of the games left you have to win.' },
    { target: '[data-out="table"]', title: 'Every result', text: 'The points for every number of wins, with the ones that reach your target lit.' },
  ],
  events: [
    { target: '.events', title: 'The calendar', text: 'What ends first is at the top. Live events, then the weekly and monthly ones, then what is next.' },
  ],
};

export const QUESTIONS = {
  'ptc-solver': [
    { q: 'How does the average work?', a: ['The game counts the total, not each card. An average of 80 over five cards is 400 OVR in all, so one 90 lets the other four average 77.5.'] },
    { q: 'Which OVR do I enter?', a: ['The card\'s base OVR. Focus and Chemistry raise the number on your lineup, and neither counts towards a PTC.'] },
    { q: 'What happens when I complete one?', a: ['The cards you used come out of My cards, because the game takes them when you trade them in. The challenge stays, marked complete.'] },
    { q: 'Where are my challenges kept?', a: ['In this browser, on this device, and nowhere else. Clearing site data removes them.'] },
  ],
  players: [
    { q: 'Why is the database empty?', a: ['No ratings were taken from the game. Cards are added from what players can see and send in, so the database grows card by card. My cards holds yours in the meantime.'] },
    { q: 'How do I add all my cards at once?', a: ['Import a CSV, one card per row, with at least a name, an OVR and a position. Put the main position first when a card has several.'] },
    { q: 'What do the stat colours mean?', a: ['They are the bands the game\'s player profile shows: red below 60, orange from 60 to 77, green from 78. The game doesn\'t publish its cut-offs, so these are observed.'] },
    { q: 'What does Unsellable mean?', a: ['The card can\'t be listed or quick-sold. It can still be traded into a PTC.'] },
  ],
  'squad-builder': [
    { q: 'How is Chemistry worked out?', a: ['Starters who share a nationality, a league or a special rarity get a boost, up to +3 each. Where they stand doesn\'t matter, and the bench never counts.'] },
    { q: 'Why are some thresholds blank?', a: ['The game\'s help prints two of them: +1 at 2 players of one nationality, +2 at 5. Read the rest from the game\'s Chemistry view and type them in once.'] },
    { q: 'Why is my team OVR different in the game?', a: ['The game also counts the bench, by a weight it sets on its servers, and adds each player\'s Focus. This shows the eleven with their Chemistry.'] },
    { q: 'What do the glows mean?', a: ['Green is the card\'s own position, orange one of its other positions, red out of position. Out of position lowers a card\'s OVR in the game.'] },
  ],
  packs: [
    { q: 'What is the chance a pack shows?', a: ['The chance of at least one player of that rating band or rarity in one pack, as the pack\'s info button shows it.'] },
    { q: 'Why aren\'t 40 packs a sure thing at 2.5%?', a: ['Each pack is a fresh roll. At 2.5% a pack, 40 packs give about a 64% chance of at least one, and it takes 91 for 90%.'] },
  ],
  'weekend-league': [
    { q: 'How many wins does rank 1 take?', a: ['14 of the 15. A win is 4 points and a loss 1, so 14 wins make 57 and 13 make 54, one short of 55.'] },
    { q: 'Why does it ask what a win is worth?', a: ['The game doesn\'t print the QP a win gives. Type the QP your last win showed and the planner counts the wins to the threshold.'] },
  ],
  events: [
    { q: 'Why are there no end times?', a: ['The game gives days, not hours, so an event that ends on a day can close at any hour of it.'] },
    { q: 'What happens at the Season Reset?', a: ['Each summer, squads, coins and tiers reset. Gems, logos and league history carry over. The last reset was on 25 Aug 2026.'] },
  ],
};

export const TOUR_PROMPT = 'Show me around';

const NAMES = { 'ptc-solver': 'PTC Solver', players: 'Players', 'squad-builder': 'Squad Builder', packs: 'Packs', 'weekend-league': 'Weekend League', events: 'Events' };

let tab = null;
let steps = [];
let index = 0;
const el = (id) => document.getElementById(id);

// The panel, the button and the tour layer are made once, at the end of the
// page, so no page template has to carry them.
function build() {
  if (el('helpFab')) return;
  if (!document.querySelector('link[href*="css/help.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/help.css';
    document.head.appendChild(link);
  }
  document.body.insertAdjacentHTML('beforeend', `
<button id="helpFab" class="help-fab" type="button" hidden aria-haspopup="dialog" aria-expanded="false" aria-controls="helpPanel" aria-label="Help with this page">?</button>
<section id="helpPanel" class="help-panel" role="dialog" aria-labelledby="helpTitle" hidden>
  <div class="help-panel__head"><h2 id="helpTitle">Help</h2><button class="help-x" type="button" id="helpClose" aria-label="Close help">&times;</button></div>
  <button class="help-tour" type="button" id="helpTour">${esc(TOUR_PROMPT)}</button>
  <div class="help-list" id="helpList"></div>
</section>
<div id="tourLayer" class="tour-layer" hidden>
  <div class="tour-catch" id="tourCatch"></div>
  <div class="tour-spot" id="tourSpot"></div>
  <div class="tour-bubble" id="tourBubble" role="dialog" aria-live="polite" aria-labelledby="tourTitle">
    <p class="tour-count" id="tourCount"></p>
    <h3 class="tour-title" id="tourTitle"></h3>
    <p class="tour-text" id="tourText"></p>
    <div class="tour-actions">
      <button type="button" class="tour-skip" id="tourEnd">Skip</button>
      <span class="tour-gap"></span>
      <button type="button" class="btn btn--olive btn--xs" id="tourPrev">Back</button>
      <button type="button" class="btn btn--xs" id="tourNext">Next</button>
    </div>
    <p class="tour-hint" id="tourHint"></p>
  </div>
</div>`);
  el('helpFab').addEventListener('click', () => (el('helpPanel').hidden ? openPanel() : closePanel()));
  el('helpClose').addEventListener('click', closePanel);
  el('helpTour').addEventListener('click', () => { closePanel(); setTimeout(startTour, 120); });
  el('tourNext').addEventListener('click', () => step(1));
  el('tourPrev').addEventListener('click', () => step(-1));
  el('tourEnd').addEventListener('click', endTour);
  // The backdrop moves on rather than quitting: losing the whole tour to a
  // stray tap is the worse mistake, and Skip is right there.
  el('tourCatch').addEventListener('click', () => step(1));
  document.addEventListener('keydown', (e) => {
    if (isTouring()) {
      if (e.key === 'Escape') { e.stopImmediatePropagation(); endTour(); }
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    } else if (e.key === 'Escape' && !el('helpPanel').hidden) closePanel();
  }, true);
}

function renderPanel() {
  el('helpTitle').textContent = `Help: ${NAMES[tab]}`;
  el('helpList').innerHTML = (QUESTIONS[tab] || []).map((item) =>
    `<details class="help-q"><summary>${esc(item.q)}</summary>${item.a.map((p) => `<p>${esc(p)}</p>`).join('')}</details>`).join('');
  el('helpTour').hidden = !hasTour();
}

export function openPanel() {
  if (!tab) return;
  renderPanel();
  el('helpPanel').hidden = false;
  el('helpFab').setAttribute('aria-expanded', 'true');
}

export function closePanel() {
  if (!el('helpPanel')) return;
  el('helpPanel').hidden = true;
  el('helpFab').setAttribute('aria-expanded', 'false');
}

// The panel is about the page you were on, so it closes when you leave it.
// A page with no help of its own (home, the blog, About) hides the button.
export function setHelpTab(routeId) {
  build();
  if (isTouring()) endTour();
  closePanel();
  tab = QUESTIONS[routeId] || TOURS[routeId] ? routeId : null;
  el('helpFab').hidden = !tab;
}

function visible(selector) {
  const node = document.querySelector(`main:not([hidden]) ${selector}`);
  if (!node) return null;
  const r = node.getBoundingClientRect();
  return r.width || r.height ? node : null;
}

const runnable = () => (TOURS[tab] || []).filter((s) => visible(s.target));
export const hasTour = () => runnable().length > 0;
const isTouring = () => !!el('tourLayer') && !el('tourLayer').hidden;

// Whether a tour actually started, so a caller can tell "shown" from "had
// nothing to point at".
export function startTour() {
  steps = runnable();
  if (!steps.length) return false;
  index = 0;
  el('tourLayer').hidden = false;
  document.body.classList.add('touring');
  window.addEventListener('resize', place);
  window.addEventListener('scroll', place, true);
  showStep();
  return true;
}

export function endTour() {
  if (!el('tourLayer')) return;
  el('tourLayer').hidden = true;
  document.body.classList.remove('touring');
  window.removeEventListener('resize', place);
  window.removeEventListener('scroll', place, true);
  steps = [];
}

function showStep() {
  const s = steps[index];
  if (!s) return endTour();
  const last = index === steps.length - 1;
  el('tourTitle').textContent = s.title;
  el('tourText').textContent = s.text;
  el('tourCount').textContent = `${index + 1} of ${steps.length}`;
  el('tourPrev').hidden = index === 0;
  el('tourNext').textContent = last ? 'Done' : 'Next';
  el('tourHint').textContent = last ? 'Tap anywhere to finish' : 'Tap anywhere to go on';
  // Instant, not smooth: the spotlight is placed from the box straight after.
  visible(s.target)?.scrollIntoView({ block: 'center', inline: 'nearest' });
  place();
  el('tourNext').focus({ preventScroll: true });
}

function place() {
  const s = steps[index];
  const node = s && visible(s.target);
  if (!node) return;
  const pad = 8, r = node.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
  const spot = el('tourSpot');
  const top = Math.max(r.top - pad, 4), left = Math.max(r.left - pad, 4);
  Object.assign(spot.style, {
    top: `${top}px`, left: `${left}px`,
    width: `${Math.min(r.right + pad, vw - 4) - left}px`, height: `${Math.min(r.bottom + pad, vh - 4) - top}px`,
  });
  const bubble = el('tourBubble');
  const bw = Math.min(340, vw - 24);
  bubble.style.width = `${bw}px`;
  // Below the target if it fits, else above it, else over its lower half.
  const bh = bubble.offsetHeight || 200;
  const below = r.bottom + pad + 12;
  const above = r.top - pad - 12 - bh;
  const y = below + bh < vh - 12 ? below : above > 12 ? above : Math.max(12, vh - bh - 12);
  bubble.style.top = `${y}px`;
  bubble.style.left = `${Math.min(Math.max(r.left, 12), vw - bw - 12)}px`;
}

function step(delta) {
  index = Math.max(0, index + delta);
  if (index >= steps.length) return endTour();
  showStep();
}
