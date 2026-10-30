// Weekend League planner: qualify, then count the wins a rank needs. The
// points rules are the game's; the QP figures are what players report, so
// they are settings you can correct.

import { esc, on, load, save, int } from '../lib/util.js';
import { plan, qpWins, points, winsFor } from '../lib/wl.js';
import { WEEKEND_LEAGUE as WL } from '../data/game.js';
import { fifteenGames } from '../lib/board.js';

const KEY = 'wl:plan';
const DEFAULTS = { qp: 0, perWin: '', threshold: WL.qpThreshold, played: 0, wins: 0, target: WL.rank1 };

const num = (v, d) => { const n = Number(String(v).replace(/[, ]/g, '')); return Number.isFinite(n) && n >= 0 ? n : d; };

function qualifyOut(s) {
  const need = qpWins(s.qp, s.perWin, s.threshold);
  const pct = Math.min(100, s.threshold > 0 ? (s.qp / s.threshold) * 100 : 0);
  const line = need === 0 ? '<b class="pos-t">Qualified.</b> Register before the weekend timer ends.'
    : Number.isFinite(need) ? `<b>${int(need)} more win${need === 1 ? '' : 's'}</b> at ${int(s.perWin)} QP a win.`
      : 'Type the QP your last win gave you, and this counts the wins left.';
  return `<div class="meter" role="img" aria-label="${int(s.qp)} of ${int(s.threshold)} QP"><span class="meter__fill" style="width:${pct}%"></span><span class="meter__val">${int(s.qp)} / ${int(s.threshold)} QP</span></div>
    <p class="wl__line">${line}</p>`;
}

function weekendOut(s) {
  const p = plan({ played: s.played, wins: s.wins, target: s.target });
  let verdict;
  if (p.reached) verdict = `<b class="pos-t">Done.</b> ${p.now} points already clears ${p.target}.`;
  else if (!p.possible) verdict = `<b class="bad-t">Out of reach.</b> The most you can still finish on is ${p.best} points, ${p.target - p.best} short of ${p.target}.`;
  else if (p.need === p.left) verdict = `<b>Win all ${p.left} games left.</b> There is no loss to spare.`;
  else verdict = `<b>Win ${p.need} of your last ${p.left}.</b> You can lose ${p.canLose} more.`;
  return `<p class="wl__line wl__verdict">${verdict}</p>
    <div class="kv">
      <div><span>Points now</span><b>${p.now}</b></div>
      <div><span>Games left</span><b>${p.left}</b></div>
      <div class="${p.possible ? '' : 'is-bad'}"><span>Wins still needed</span><b>${p.reached ? 0 : p.need}</b></div>
      <div><span>Most you can reach</span><b>${p.best}</b></div>
    </div>`;
}

function tableOut(target) {
  const need = winsFor(target);
  const rows = [];
  for (let w = WL.games; w >= Math.max(0, need - 4); w--) {
    const pts = points(w, WL.games - w);
    rows.push(`<tr${pts >= target ? ' class="is-on"' : ''}><td class="big">${w}</td><td>${WL.games - w}</td><td class="n big">${pts}</td><td class="${pts >= target ? 'pos-t' : ''}">${pts >= target ? 'Clears it' : `${target - pts} short`}</td></tr>`);
  }
  return `<table class="dtable"><thead><tr><th>Wins</th><th>Losses</th><th class="n">Points</th><th>Target ${target}</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
}

export function render() {
  const s = { ...DEFAULTS, ...load(KEY, {}) };
  const field = (name, label, value, extra = '') => `<label class="lbl"><span>${label}</span><input class="field" name="${name}" type="number" min="0" inputmode="numeric" value="${esc(value)}" ${extra}></label>`;
  return `<div class="wrap wl">
    <div class="mtile mtile--wl wl__tile"><b>${WL.games} games · rank 1 at ${WL.rank1} points</b><span>A win is ${WL.win} points, a loss ${WL.loss}, so a weekend scores ${WL.games} + 3 × wins. Unlocks at ${esc(WL.unlockTier)}.</span></div>
    <div class="grid cols-2" style="margin-top:16px">
      <section class="panel">
        <div class="panel__head"><h2>Qualify</h2><span>QP to the threshold</span></div>
        <div class="panel__body">
          <form class="form__grid" data-form="qualify" onsubmit="return false">
            ${field('qp', 'Your QP', s.qp)}
            ${field('perWin', 'QP a win gives', s.perWin, 'placeholder="From your last win"')}
            ${field('threshold', 'Threshold <small>reported</small>', s.threshold)}
          </form>
          <div data-out="qualify" style="margin-top:14px">${qualifyOut(s)}</div>
          <p class="hint" style="margin-top:12px">League and Quick Match wins earn QP. Players report a 1,500 QP threshold in UFM 27, up from 1,000 (September 2026); correct it if your screen shows another. The game doesn't print what a win is worth, so the planner asks.</p>
        </div>
      </section>
      <section class="panel">
        <div class="panel__head"><h2>Your weekend</h2><span>Wins each rank needs</span></div>
        <div class="panel__body">
          <form class="form__grid" data-form="weekend" onsubmit="return false">
            ${field('played', 'Games played', s.played, `max="${WL.games}"`)}
            ${field('wins', 'Wins so far', s.wins, `max="${WL.games}"`)}
            ${field('target', 'Points target', s.target, `max="${WL.games * WL.win}"`)}
          </form>
          <div data-out="weekend" style="margin-top:14px">${weekendOut(s)}</div>
          <p class="hint" style="margin-top:12px">Rank 1 is ${WL.rank1} points. The game has ${WL.ranks} rank tiers; for any other, type the target from your rank screen.</p>
        </div>
      </section>
    </div>
    <div class="grid cols-2" style="margin-top:16px">
      <section>
        <h2 class="sub">Points for every result</h2>
        <div class="dtable-wrap" data-out="table">${tableOut(s.target)}</div>
      </section>
      <section>
        <h2 class="sub">What rank 1 takes</h2>
        <figure class="boardfig">${fifteenGames()}<figcaption>Fifteen games. Thirteen wins in marker, the one loss you can afford, and the bib on the fourteenth win: the one that makes ${WL.rank1} points. <a href="blog/weekend-league-rank-1/">The working ›</a></figcaption></figure>
      </section>
    </div>
  </div>`;
}

export function mount(body) {
  body.innerHTML = render();
  on(body, 'input', '[data-form]', () => {
    const read = (form) => Object.fromEntries([...body.querySelector(`[data-form="${form}"]`).elements].map((i) => [i.name, i.value]));
    const raw = { ...read('qualify'), ...read('weekend') };
    const s = {
      qp: num(raw.qp, 0), perWin: raw.perWin === '' ? '' : num(raw.perWin, ''), threshold: num(raw.threshold, WL.qpThreshold),
      played: Math.min(WL.games, num(raw.played, 0)), wins: Math.min(WL.games, num(raw.wins, 0)),
      target: Math.min(WL.games * WL.win, num(raw.target, WL.rank1)),
    };
    s.wins = Math.min(s.wins, s.played);
    save(KEY, s);
    body.querySelector('[data-out="qualify"]').innerHTML = qualifyOut(s);
    body.querySelector('[data-out="weekend"]').innerHTML = weekendOut(s);
    body.querySelector('[data-out="table"]').innerHTML = tableOut(s.target);
  });
}
