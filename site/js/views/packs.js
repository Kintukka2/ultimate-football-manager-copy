// Packs: the odds the game publishes, turned into packs. No pack is hyped
// here and nothing is sold beside the odds (Brand Book, Legal).

import { esc, on, load, save, odds, int, percent } from '../lib/util.js';
import { atLeastOne, packsFor, expectedPacks, parsePercent } from '../lib/odds.js';
import { PACK_SIZES } from '../data/game.js';

const KEY = 'packs:calc';
const DEFAULTS = { chance: '2.5', packs: '10', price: '', currency: 'coins' };

function results(s) {
  const p = parsePercent(s.chance);
  const n = Math.max(1, Math.min(10000, Math.floor(Number(s.packs) || 0)));
  if (Number.isNaN(p)) return '<p class="hint bad-t">Enter the chance the pack\'s info screen shows, between 0 and 100%.</p>';
  const hit = atLeastOne(p, n);
  const price = Number(String(s.price).replace(/[, ]/g, ''));
  const per = expectedPacks(p);
  const cost = price > 0 ? `${int(price * per)} <small>${esc(s.currency)} a pull, on average</small>` : '<small>Add a price to see it</small>';
  const rows = [1, 5, 10, 20, 50, 100].map((k) => `<tr${k === n ? ' class="is-on"' : ''}><td class="big">${k}</td><td class="n">${odds(atLeastOne(p, k))}</td></tr>`).join('');
  return `<div class="kv">
      <div class="${hit >= 0.5 ? 'is-met' : ''}"><span>At least one in ${int(n)} pack${n === 1 ? '' : 's'}</span><b>${percent(hit) === '100%' && hit < 1 ? '>99%' : percent(hit)}</b></div>
      <div><span>Packs for an even chance</span><b>${int(packsFor(p, 0.5))}</b></div>
      <div><span>Packs for a 90% chance</span><b>${int(packsFor(p, 0.9))}</b></div>
      <div><span>Packs a pull takes, on average</span><b>${per < 10 ? per.toFixed(1) : int(per)}</b></div>
      <div><span>Cost of a pull</span><b>${cost}</b></div>
    </div>
    <p class="hint" style="margin-top:12px">${esc(odds(p))} a pack. Even ${int(packsFor(p, 0.9))} packs leave a ${percent(1 - atLeastOne(p, packsFor(p, 0.9)))} chance of nothing: odds don't add up to a guarantee.</p>
    <div class="dtable-wrap"><table class="dtable"><thead><tr><th>Packs opened</th><th class="n">Chance of at least one</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

export function render() {
  const s = { ...DEFAULTS, ...load(KEY, {}) };
  const sizes = PACK_SIZES.map((p) => `<tr><td><b>${esc(p.name)}</b>${p.note ? `<br><span class="muted">${esc(p.note)}</span>` : ''}</td><td class="n big">${p.players}</td></tr>`).join('');
  return `<div class="wrap grid cols-side packs">
    <div class="stack">
      <section class="panel">
        <div class="panel__head"><h2>Odds calculator</h2><span>What the odds mean in packs</span></div>
        <div class="panel__body">
          <p class="hint">Every pack's info button shows "the odds for at least 1 player in this pack" for each rating band and rarity. Put one of those chances here, and how many of that pack you'd open.</p>
          <form class="form__grid" data-calc onsubmit="return false">
            <label class="lbl"><span>Chance a pack shows</span><input class="field" name="chance" inputmode="decimal" value="${esc(s.chance)}" aria-describedby="pct-help"><small id="pct-help">In percent, e.g. 2.5</small></label>
            <label class="lbl"><span>Packs you'd open</span><input class="field" name="packs" type="number" min="1" max="10000" value="${esc(s.packs)}"></label>
            <label class="lbl"><span>Price a pack <small>optional</small></span><input class="field" name="price" inputmode="numeric" value="${esc(s.price)}" placeholder="e.g. 7,500"></label>
            <label class="lbl"><span>Paid in</span><select class="field" name="currency">${['coins', 'gems'].map((c) => `<option${c === s.currency ? ' selected' : ''}>${c}</option>`).join('')}</select></label>
          </form>
          <div data-out style="margin-top:16px">${results(s)}</div>
        </div>
      </section>
      <section class="panel">
        <div class="panel__head"><h2>Before you open one</h2></div>
        <div class="panel__body">
          <ul class="clean">
            <li><b>Check the card's market price first.</b> If the player you want is listed, buying them is a known price; a pack is a chance.</li>
            <li><b>Gold packs cost 7,500 coins</b> in UFM 27, up from UFM 26 (players report, September 2026).</li>
            <li><b>Pack Assign</b> shows which pulls upgrade your lineup after you open a pack, and some packs give a free extra player for watching an ad.</li>
            <li><b>Unsellable packs</b> give cards you can't list or quick-sell, but you can trade them into PTCs.</li>
          </ul>
        </div>
      </section>
    </div>
    <aside class="panel">
      <div class="panel__head"><h2>Pack sizes</h2><span>Players in each</span></div>
      <div class="panel__body" style="padding:8px 10px">
        <table class="dtable"><thead><tr><th>Pack</th><th class="n">Players</th></tr></thead><tbody>${sizes}</tbody></table>
        <p class="hint" style="margin:10px 4px 4px">The game defines 619 packs in all: coin and gem packs, rating-guaranteed packs from 65+ to 91+, position and nationality packs, and packs for every rarity event.</p>
      </div>
    </aside>
  </div>`;
}

export function mount(body) {
  body.innerHTML = render();
  on(body, 'input', '[data-calc]', () => {
    const f = body.querySelector('[data-calc]').elements;
    const s = { chance: f.chance.value, packs: f.packs.value, price: f.price.value, currency: f.currency.value };
    save(KEY, s);
    body.querySelector('[data-out]').innerHTML = results(s);
  });
}
