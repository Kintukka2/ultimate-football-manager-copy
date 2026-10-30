// The form for a card you type in. Used by Players (add and edit), and by the
// card picker in the PTC Solver and Squad Builder.

import { esc } from '../lib/util.js';
import { POSITIONS, statsFor } from '../data/football.js';
import { QUALITIES, RARITIES } from '../data/rarities.js';
import { normalize } from '../lib/cards.js';

const opt = (v, label, sel) => `<option value="${esc(v)}"${sel ? ' selected' : ''}>${esc(label)}</option>`;

export function cardFormHTML(card = {}) {
  const pos = card.pos?.[0] || 'ST';
  const others = (card.pos || []).slice(1).join(' ');
  return `<form class="form" data-cardform novalidate>
  <div class="form__grid">
    <label class="lbl" style="grid-column: span 2"><span>Name</span><input class="field" name="name" value="${esc(card.name)}" placeholder="As printed on the card" required></label>
    <label class="lbl"><span>OVR</span><input class="field" name="ovr" type="number" min="1" max="99" inputmode="numeric" value="${esc(card.ovr ?? '')}" required></label>
    <label class="lbl"><span>Position</span><select class="field" name="pos0">${POSITIONS.map((p) => opt(p, p, p === pos)).join('')}</select></label>
    <label class="lbl"><span>Other positions <small>optional</small></span><input class="field" name="posx" value="${esc(others)}" placeholder="e.g. CAM RW"></label>
    <label class="lbl"><span>Quality</span><select class="field" name="quality">${QUALITIES.map((q) => opt(q.id, q.name, q.id === (card.quality || 'gold'))).join('')}</select></label>
    <label class="lbl" style="grid-column: span 2"><span>Rarity</span><select class="field" name="rarity">${RARITIES.map((r) => opt(r.id, r.name, r.id === (card.rarity || 'normal'))).join('')}</select></label>
    <label class="lbl"><span>Nationality</span><input class="field" name="nation" value="${esc(card.nation)}" placeholder="e.g. Spain"></label>
    <label class="lbl"><span>League</span><input class="field" name="league" value="${esc(card.league)}" placeholder="e.g. Spain 1"></label>
    <label class="lbl"><span>Club</span><input class="field" name="club" value="${esc(card.club)}"></label>
    <label class="lbl"><span>Age <small>optional</small></span><input class="field" name="age" type="number" min="15" max="50" value="${esc(card.age ?? '')}"></label>
  </div>
  <div class="form__grid" data-stats>${statInputs(pos, card.stats)}</div>
  <label class="check"><input type="checkbox" name="sellable"${card.sellable === false ? '' : ' checked'}> Sellable <span class="muted">Untick for an Unsellable card. It can still go into a PTC.</span></label>
  <p class="form__err bad-t" data-err hidden></p>
</form>`;
}

function statInputs(pos, stats = {}) {
  return statsFor(pos).map((s) => `<label class="lbl"><span>${s.label} <small>${s.name}</small></span>`
    + `<input class="field" name="${s.key}" type="number" min="1" max="99" inputmode="numeric" value="${esc(stats?.[s.key] ?? '')}"></label>`).join('');
}

// Keep the stat inputs in step with the position: a keeper has his own six.
export function wireCardForm(form) {
  const pos = form.elements.pos0;
  let was = pos.value === 'GK';
  pos.addEventListener('change', () => {
    const gk = pos.value === 'GK';
    if (gk !== was) form.querySelector('[data-stats]').innerHTML = statInputs(pos.value, {});
    was = gk;
  });
}

// Returns { card, errors }. The id of the card being edited is kept.
export function readCardForm(form, id) {
  const f = form.elements;
  const raw = {
    id, name: f.name.value, ovr: f.ovr.value,
    pos: [f.pos0.value, ...f.posx.value.split(/[\s,/]+/)],
    quality: f.quality.value, rarity: f.rarity.value,
    nation: f.nation.value, league: f.league.value, club: f.club.value, age: f.age.value,
    sellable: f.sellable.checked, stats: {},
  };
  for (const s of statsFor(f.pos0.value)) raw.stats[s.key] = f[s.key]?.value;
  const out = normalize(raw);
  const err = form.querySelector('[data-err]');
  err.hidden = !out.errors.length;
  err.textContent = out.errors[0] || '';
  return out;
}
