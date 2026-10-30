// Compare: two to four cards side by side, from the database or from My
// cards. The answer comes first (who leads, and by how much), then the cards,
// then every shared rating with the leader on each marked. The rules are in
// lib/compare.js.

import { esc, on, load, save } from '../lib/util.js';
import { POSITION_NAMES } from '../data/football.js';
import { rarity as rarityOf, quality as qualityOf } from '../data/rarities.js';
import { myCards, databaseCards, matchesQuery } from '../lib/cards.js';
import { cardSlugs } from '../lib/carddb.js';
import { MAX, compare, focusOptions, normalizePicks, linkQuery, readQuery } from '../lib/compare.js';
import { shirtCard, cardRow, rarityChip, shortName } from '../ui/card.js';
import { openDialog, toast } from '../ui/dialog.js';

const PICKS = 'compare', FOCUS = 'compare:focus';

let root = null, db = [], slugs = {}, picks = [], focus = '';

// The picks as cards, in slot order. One that has left the database or My
// cards since it was picked drops out.
function cardsOf(list = picks) {
  return list.map((p) => (p.src === 'db' ? db.find((c) => c.id === p.id) : myCards.get(p.id) && { ...myCards.get(p.id), source: 'mine' })).filter(Boolean);
}

function chip(c) {
  if (rarityOf(c.rarity).fill) return rarityChip(c.rarity);
  const q = qualityOf(c.quality);
  return `<span class="rchip rchip--base" style="--fill:${q.fill};--rim:${q.rim}"><i></i>${esc(q.name)}</span>`;
}

// The answer, before the table: who leads on the focus, or on OVR.
function verdict(cards, cmp) {
  if (cards.length < 2) return cards.length ? 'Add one more card to compare.' : 'Pick two to four cards to compare them stat by stat.';
  const names = (idx) => idx.map((i) => cards[i].name).join(' and ');
  const row = cmp.focusRow || cmp.ratings[0];
  const vals = row.vals;
  const nums = vals.filter((v) => typeof v === 'number');
  if (!nums.length) return `No card has ${esc(row.label)} recorded.`;
  const hi = Math.max(...nums);
  const top = vals.map((v, i) => (v === hi ? i : -1)).filter((i) => i >= 0);
  if (top.length === cards.length) return `Level on ${esc(row.label)}: ${hi} each.`;
  const rest = vals.filter((v, i) => typeof v === 'number' && !top.includes(i));
  const by = rest.length ? hi - Math.max(...rest) : null;
  return `<b>${esc(names(top))}</b> ${top.length > 1 ? 'lead' : 'leads'} on ${esc(row.label)} with ${hi}${by ? `, by ${by}` : ''}.`;
}

function slotsHTML(cards) {
  const out = [];
  for (let i = 0; i < MAX; i++) {
    const c = cards[i];
    out.push(c
      ? `<div class="cmp-slot"><div class="cmp-card">${shirtCard(c)}</div><b class="cmp-name">${esc(c.name)}</b>`
        + `<span class="cmp-from">${c.source === 'db' ? `<a href="ufm27/players/${slugs[c.id]}/">Card page ›</a>` : 'My cards'}</span>`
        + `<button type="button" class="btn btn--xs btn--olive" data-remove="${i}">Remove</button></div>`
      : `<button type="button" class="cmp-slot cmp-slot--empty" data-add><div class="cmp-card">${shirtCard(null, { label: 'Add card' })}</div></button>`);
  }
  return `<div class="cmp-slots">${out.join('')}</div>`;
}

function tableHTML(cards, cmp) {
  if (cards.length < 2) return '';
  // Two versions of one player share a surname, so the head carries the OVR too.
  const headCells = cards.map((c) => `<th class="n" scope="col">${esc(shortName(c.name))} ${c.ovr}</th>`).join('');
  const rating = (r) => `<tr class="${r.focus ? 'is-on' : ''}"><th scope="row"><b>${esc(r.label)}</b><small>${esc(r.name)}</small></th>${r.vals.map((v) =>
    `<td class="n${r.best != null && v === r.best ? ' cmp-best' : ''}">${v == null ? '–' : v}</td>`).join('')}</tr>`;
  const detail = (label, f) => `<tr class="cmp-detail"><th scope="row">${label}</th>${cards.map((c) => `<td class="n">${f(c)}</td>`).join('')}</tr>`;
  return `<div class="dtable-wrap cmp-tablewrap"><table class="dtable cmp-table">
    <thead><tr><th scope="col">Rating</th>${headCells}</tr></thead>
    <tbody>${cmp.ratings.map(rating).join('')}
      ${detail('Position', (c) => `<abbr title="${esc(POSITION_NAMES[c.pos[0]])}">${esc(c.pos.join(' '))}</abbr>`)}
      ${detail('Rarity', chip)}
      ${detail('Club', (c) => esc(c.club || '—'))}
      ${detail('Nationality', (c) => esc(c.nation || '—'))}
      ${detail('League', (c) => esc(c.league || '—'))}
      ${detail('Market', (c) => (c.sellable ? 'Sellable' : '<span class="pl-unsell">Unsellable</span>'))}
    </tbody></table></div>`;
}

function pageHTML() {
  const cards = cardsOf();
  const cmp = compare(cards, focus);
  const opts = focusOptions(cmp.shared);
  const focusSel = cards.length >= 2 ? `<label class="lbl cmp-focus"><span>Focus</span><select class="field" data-focus>
      <option value="">OVR</option>${opts.map((o) => `<option value="${esc(o.id)}"${o.id === focus ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}</select></label>` : '';
  const mine = cards.some((c) => c.source === 'mine');
  const q = linkQuery(cards, focus, slugs);
  const share = cards.length >= 2 ? `<button type="button" class="btn btn--sm btn--olive" data-share${q ? '' : ' disabled'}>Copy link</button>` : '';
  const shareNote = cards.length >= 2 && mine ? `<p class="hint cmp-note">${q ? 'The link carries the database cards only.' : 'A link can only carry database cards.'} Cards from My cards stay on this device.</p>` : '';
  const mixed = cmp.mixed ? '<p class="hint cmp-note">A keeper and an outfield card share only PAC, so that is the one stat they meet on.</p>' : '';
  return `<div class="wrap cmp">
    <p class="cmp-verdict">${verdict(cards, cmp)}</p>
    ${slotsHTML(cards)}
    <div class="row cmp-tools">${focusSel}<span class="spacer"></span>${share}</div>
    ${mixed}${shareNote}
    ${tableHTML(cards, cmp)}
  </div>`;
}

export function render() {
  return `<div class="wrap cmp"><p class="cmp-verdict">Pick two to four cards to compare them stat by stat.</p>${slotsHTML([])}</div>`;
}

function paint() { if (root) root.innerHTML = pageHTML(); }
function keep() { save(PICKS, picks); save(FOCUS, focus); }

function pick() {
  const taken = new Set(picks.map((p) => `${p.src}:${p.id}`));
  const pools = { db: db.filter((c) => !taken.has(`db:${c.id}`)), mine: myCards.all().filter((c) => !taken.has(`mine:${c.id}`)) };
  let tab = pools.db.length ? 'db' : 'mine', q = '';
  return openDialog({
    title: 'Add a card', sub: 'From the database or from My cards', wide: true,
    body: `<div class="tabs tabs--sm" role="tablist">
        <button class="tab" type="button" data-tab="db" role="tab">Database <span class="muted">${pools.db.length}</span></button>
        <button class="tab" type="button" data-tab="mine" role="tab">My cards <span class="muted">${pools.mine.length}</span></button></div>
      <input class="field cmp-q" type="search" placeholder="Search name, club, nation" data-q aria-label="Search cards">
      <div class="listwrap"><div class="list"><div class="list__rows" data-rows></div></div></div>`,
    actions: [{ label: 'Cancel', kind: 'olive', value: 'cancel' }],
    onMount(d, close) {
      const rows = d.querySelector('[data-rows]');
      const draw = () => {
        d.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('is-on', b.dataset.tab === tab));
        const list = pools[tab].filter((c) => matchesQuery(c, q)).sort((a, b) => b.ovr - a.ovr);
        rows.innerHTML = list.length
          ? list.map((c) => cardRow(c, { attrs: `role="button" tabindex="0" data-pick="${tab}:${esc(c.id)}"` })).join('')
          : `<p class="empty-line" style="padding:14px 16px">${pools[tab].length ? 'No card matches the search.' : tab === 'db' ? 'The database has no cards yet. Pick from My cards.' : 'You have no cards saved yet. Add them on Players.'}</p>`;
      };
      on(d, 'click', '[data-tab]', (e, b) => { tab = b.dataset.tab; draw(); });
      on(d, 'input', '[data-q]', (e, i) => { q = i.value; draw(); });
      const choose = (v) => { const [src, ...id] = v.split(':'); close({ src, id: id.join(':') }); };
      on(d, 'click', '[data-pick]', (e, r) => choose(r.dataset.pick));
      on(d, 'keydown', '[data-pick]', (e, r) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(r.dataset.pick); } });
      draw();
    },
  }).then((v) => (v && typeof v === 'object' ? v : null));
}

export function mount(body) {
  root = body;
  on(body, 'click', '[data-add]', async () => {
    const p = await pick();
    if (!p) return;
    picks = normalizePicks([...picks, p]);
    keep(); paint();
  });
  on(body, 'click', '[data-remove]', (e, b) => {
    picks.splice(Number(b.dataset.remove), 1);
    keep(); paint();
  });
  on(body, 'change', '[data-focus]', (e, s) => { focus = s.value; keep(); paint(); });
  on(body, 'click', '[data-share]', async () => {
    const q = linkQuery(cardsOf(), focus, slugs);
    if (!q) return;
    const url = new URL(`ufm27/compare/?${q}`, document.baseURI).href;
    try { await navigator.clipboard.writeText(url); toast('Link copied'); } catch { window.prompt('Copy this link', url); }
  });
  myCards.subscribe(() => { if (root?.isConnected) paint(); });
}

export async function show(body) {
  root = body;
  picks = normalizePicks(load(PICKS, []));
  focus = load(FOCUS, '') || '';
  db = await databaseCards();
  slugs = cardSlugs(db);
  // A shared link wins over what this browser had picked.
  const fromLink = readQuery(location.search, db, slugs);
  if (fromLink) { picks = fromLink.picks; focus = fromLink.focus; keep(); }
  paint();
}

// For Players: put a card on the comparison, keeping the four-card limit.
export function addToCompare(card) {
  const list = normalizePicks(load(PICKS, []));
  const ref = { src: card.source === 'db' ? 'db' : 'mine', id: card.id };
  if (list.some((p) => p.src === ref.src && p.id === ref.id)) return 'already';
  if (list.length >= MAX) return 'full';
  save(PICKS, [...list, ref]);
  return 'added';
}
