// Events: the calendar, with whatever ends first at the top. Dates are UTC
// days. The game doesn't publish end times, so a day is the precision we give.

import { esc, day, dayYear, monthName } from '../lib/util.js';
import { EVENTS, EVENTS_AS_OF } from '../data/events.js';
import { rarity } from '../data/rarities.js';
import { byId } from '../data/routes.js';

const DAY = 86400000;
const EVERY = { week: 'Every week', weekend: 'Every weekend', month: 'Every month' };
const ORDER = { ending: 0, live: 1, month: 2, recurring: 3, soon: 4, next: 5, season: 6, ended: 7 };

function status(e, now) {
  const today = Math.floor(now / DAY) * DAY;
  if (e.end) {
    const start = Date.parse(e.start + 'T00:00:00Z');
    const end = Date.parse(e.end + 'T00:00:00Z');
    if (today > end) return today - end > 7 * DAY ? null : { k: 'ended', badge: 'Ended', when: `Ended ${day(e.end)}` };
    if (today < start) return { k: 'soon', badge: 'Soon', when: `Starts ${day(e.start)}` };
    const left = Math.round((end - today) / DAY);
    const when = left === 0 ? `Last day today, ${day(e.end)}` : left === 1 ? `Ends tomorrow, ${day(e.end)}` : `Ends ${day(e.end)}, ${left} days left`;
    return { k: left <= 1 ? 'ending' : 'live', badge: left <= 1 ? 'Ending' : 'Live', when };
  }
  if (e.month) {
    const cur = new Date(now).toISOString().slice(0, 7);
    if (e.month < cur) return null;
    return { k: 'month', badge: e.month === cur ? 'This month' : 'Soon', when: monthName(e.month) };
  }
  if (e.every) return { k: 'recurring', badge: EVERY[e.every], when: '' };
  if (e.next) return { k: 'next', badge: 'Next', when: 'Date not announced' };
  if (e.season) return { k: 'season', badge: 'Next', when: e.season };
  return { k: 'next', badge: 'Next', when: '' };
}

const SKEW = { ending: 'ending', live: 'live', month: 'new', recurring: 'weekly', soon: 'next', next: 'next', season: 'next', ended: 'weekly' };

function chip(e) {
  const r = e.rarity ? rarity(e.rarity) : null;
  if (!r || !r.fill) return '<span class="evrow__chip evrow__chip--reset" aria-hidden="true"></span>';
  return `<span class="evrow__chip" style="--fill:${r.fill};--rim:${r.rim}" aria-hidden="true"></span>`;
}

export function upcoming(now = Date.now()) {
  return EVENTS.map((e) => ({ e, s: status(e, now) }))
    .filter((x) => x.s)
    .sort((a, b) => ORDER[a.s.k] - ORDER[b.s.k]);
}

export function eventRows({ limit = Infinity, now = Date.now() } = {}) {
  return upcoming(now).slice(0, limit).map(({ e, s }) => {
    const link = e.link ? ` <a href="${byId(e.link).path}">Plan it ›</a>` : '';
    return `<div class="evrow evrow--${s.k}">${chip(e)}<div class="evrow__main"><b>${esc(e.name)}</b><span>${esc(e.what)}${link}</span></div>`
      + `<div class="evrow__when"><span class="skew skew--sm skew--${SKEW[s.k]}"><span>${esc(s.badge)}</span></span>${s.when ? `<small>${esc(s.when)}</small>` : ''}</div></div>`;
  }).join('');
}

export function render() {
  return `<div class="wrap">
    <p class="hint">Checked on ${dayYear(EVENTS_AS_OF)}. Dates are the game's, in UTC. The game doesn't publish end times, so an event that ends on a day may close at any hour of it.</p>
    <div class="events">${eventRows()}</div>
  </div>`;
}

export function mount(body) { body.innerHTML = render(); }
export function show(body) { body.innerHTML = render(); }
