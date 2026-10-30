// Choosing a card for a slot: one of yours, or one typed in on the spot.
// pickCard() resolves with a card, or null if the picker was closed.

import { esc, on } from '../lib/util.js';
import { myCards, matchesQuery } from '../lib/cards.js';
import { cardRow } from './card.js';
import { openDialog } from './dialog.js';
import { cardFormHTML, wireCardForm, readCardForm } from './cardform.js';

export function pickCard({ pos = '', title = 'Select player', exclude = new Set(), filter = null } = {}) {
  const mine = myCards.all().filter((c) => !exclude.has(c.id));
  let tab = mine.length ? 'mine' : 'new';
  let onlyPos = !!pos;
  let q = '';

  const body = `<div class="tabs tabs--sm" role="tablist">
      <button class="tab" type="button" data-tab="mine" role="tab">My cards <span class="muted">${mine.length}</span></button>
      <button class="tab" type="button" data-tab="new" role="tab">New card</button>
    </div>
    <div data-pane="mine" style="margin-top:14px">
      <div class="row" style="margin-bottom:10px">
        <input class="field" style="flex:1 1 200px" type="search" placeholder="Search name, club, nation" data-q aria-label="Search your cards">
        ${pos ? `<label class="check"><input type="checkbox" data-onlypos checked> Only ${esc(pos)}</label>` : ''}
      </div>
      <div class="listwrap"><div class="list"><div class="list__rows" data-rows></div></div></div>
    </div>
    <div data-pane="new" style="margin-top:14px">
      ${cardFormHTML({ pos: pos ? [pos] : ['ST'] })}
      <label class="check" style="margin-top:10px"><input type="checkbox" data-keep checked> Also save it to My cards</label>
    </div>`;

  return openDialog({
    title, sub: pos ? `A card for the ${pos} slot` : 'From your cards, or a new one',
    body, wide: true,
    actions: [{ label: 'Cancel', kind: 'olive', value: 'cancel' }, { label: 'Use this card', value: 'use', manual: true }],
    onMount(d, close) {
      const form = d.querySelector('[data-cardform]');
      wireCardForm(form);
      const useBtn = d.querySelector('[data-value="use"]');
      const rows = d.querySelector('[data-rows]');
      const paint = () => {
        d.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('is-on', b.dataset.tab === tab));
        d.querySelectorAll('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== tab; });
        useBtn.hidden = tab !== 'new';
        const list = mine.filter((c) => (!onlyPos || c.pos.includes(pos)) && matchesQuery(c, q) && (!filter || filter(c)))
          .sort((a, b) => b.ovr - a.ovr);
        rows.innerHTML = list.length
          ? list.map((c) => cardRow(c, { attrs: `role="button" tabindex="0" data-pick="${esc(c.id)}"` })).join('')
          : `<p class="empty-line" style="padding:14px 16px">${mine.length ? 'No card of yours matches. Clear the search, or make a new card.' : 'You have no cards saved yet. Make one in New card.'}</p>`;
      };
      on(d, 'click', '[data-tab]', (e, b) => { tab = b.dataset.tab; paint(); });
      on(d, 'input', '[data-q]', (e, i) => { q = i.value; paint(); });
      on(d, 'change', '[data-onlypos]', (e, i) => { onlyPos = i.checked; paint(); });
      const choose = (id) => close(mine.find((c) => c.id === id));
      on(d, 'click', '[data-pick]', (e, r) => choose(r.dataset.pick));
      on(d, 'keydown', '[data-pick]', (e, r) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(r.dataset.pick); } });
      useBtn.addEventListener('click', () => {
        const { card, errors } = readCardForm(form);
        if (errors.length) return;
        if (d.querySelector('[data-keep]').checked) close({ ...myCards.upsert(card), source: 'mine' });
        else close({ ...card, source: 'typed' });
      });
      paint();
    },
  }).then((v) => (v && typeof v === 'object' ? v : null));
}
