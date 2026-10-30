// Players: the card database, and My cards, the cards you own. Both use the
// game's measured surfaces: the standings list with a rarity chip in every
// row, and beside it the selected card, its six sub-stats on the honeycomb.
// The database ships empty on purpose. Its cards come from what players can
// see in the game and submit; no rating is taken from the game's files.

import { esc, on, load, save, uid } from '../lib/util.js';
import { POSITIONS, POSITION_NAMES, statsFor } from '../data/football.js';
import { QUALITIES, RARITIES, rarity as rarityOf, quality as qualityOf } from '../data/rarities.js';
import { myCards, databaseCards, cardsFromCSV, cardsToCSV, CSV_COLUMNS } from '../lib/cards.js';
import { DEFAULT_FILTER, SORTS, filterCards, sortCards, band } from '../lib/filter.js';
import { shirtCard, hexchip, rarityChip, crest } from '../ui/card.js';
import { openDialog, confirmDialog, toast } from '../ui/dialog.js';
import { cardFormHTML, wireCardForm, readCardForm } from '../ui/cardform.js';
import { cardSlugs } from '../lib/carddb.js';
import { addToCompare } from './compare.js';

const KEPT = ['tab', 'pos', 'quality', 'rarity', 'ovrMin', 'ovrMax', 'sell', 'sort', 'dir'];
const plural = (n, one, many = one + 's') => `${n.toLocaleString('en-GB')} ${n === 1 ? one : many}`;

let st = null;            // the filters and the open tab
let db = [];              // database cards, once loaded
let dbLoaded = false;
let slugs = {};           // each database card's page, by card id
let root = null;
let navigate = null;

const tabOf = (s) => s.tab || 'mine';
const collection = (s, data) => (tabOf(s) === 'db' ? data.db : data.mine);
const results = (s, data) => sortCards(filterCards(collection(s, data), s), s.sort, s.dir);

// ---- pieces ----------------------------------------------------------------

// The chip in every row: a special rarity's pair, or for a base card its
// quality's pair, with the name in gold type as the system sets base qualities.
function chip(c, label = true) {
  if (rarityOf(c.rarity).fill) return rarityChip(c.rarity, label);
  const q = qualityOf(c.quality);
  return `<span class="rchip rchip--base" style="--fill:${q.fill};--rim:${q.rim}" title="${esc(q.name)}"><i></i>${label ? esc(q.name) : ''}</span>`;
}

// Three stats per row: the card's first three, unless the list is sorted on
// another of its stats, which then leads.
function statCols(c, sortKey) {
  const defs = statsFor(c.pos[0]);
  const lead = defs.find((s) => s.key === sortKey);
  const rest = defs.filter((s) => s !== lead);
  return (lead ? [lead, ...rest] : defs).slice(0, 3);
}

function row(c, s, on) {
  const stats = statCols(c, s.sort).map((x) => `<span class="lstat${x.key === s.sort ? ' is-sort' : ''}"><span>${x.label}</span><b>${c.stats?.[x.key] ?? '–'}</b></span>`).join('');
  return `<div class="lrow pl-row${on ? ' is-on' : ''}" role="button" tabindex="0" data-card="${esc(c.id)}" aria-pressed="${on}">`
    + crest(c.club)
    + `<span class="lrow__name"><small>${esc(c.club || c.nation || '—')}</small><b>${esc(c.name)}</b></span>`
    + `<span class="pl-row__rar">${chip(c)}</span>`
    + hexchip(c.ovr, c)
    + `<span class="lrow__pos">${esc(c.pos[0])}</span>${stats}</div>`;
}

function facts(c) {
  const fact = (k, v) => `<div><dt>${k}</dt><dd>${v}</dd></div>`;
  return '<dl class="pl-facts">'
    + fact('Positions', c.pos.map((p) => `<abbr title="${esc(POSITION_NAMES[p])}">${esc(p)}</abbr>`).join(' '))
    + fact(rarityOf(c.rarity).fill ? 'Rarity' : 'Quality', chip(c))
    + (rarityOf(c.rarity).fill ? fact('Quality', esc(qualityOf(c.quality).name)) : '')
    + fact('Nationality', esc(c.nation || '—'))
    + fact('League', esc(c.league || '—'))
    + fact('Club', esc(c.club || '—'))
    + (c.age ? fact('Age', esc(c.age)) : '')
    + fact('Market', c.sellable ? 'Sellable' : '<span class="pl-unsell">Unsellable</span>')
    + '</dl>';
}

function detailBody(c) {
  const tiles = statsFor(c.pos[0]).map((s) => {
    const v = c.stats?.[s.key];
    const b = band(v);
    return `<div class="stattile${b ? ' st-' + b : ''}"><b>${v ?? '–'}</b><span>${esc(s.name)}</span></div>`;
  }).join('');
  const compareBtn = `<button type="button" class="btn btn--sm btn--olive" data-act="compare" data-id="${esc(c.id)}">Compare</button>`;
  const acts = c.source === 'db'
    ? `<button type="button" class="btn btn--sm btn--lime" data-act="keep" data-id="${esc(c.id)}">Save card</button>${compareBtn}`
      + (slugs[c.id] ? `<a class="pl-link" href="ufm27/players/${slugs[c.id]}/">Card page ›</a>` : '')
    : `<button type="button" class="btn btn--sm" data-act="edit" data-id="${esc(c.id)}">Edit</button>${compareBtn}`
      + `<button type="button" class="btn btn--sm btn--red" data-act="delete" data-id="${esc(c.id)}">Delete</button>`;
  return `<div class="pl-detail__top"><div class="pl-detail__card">${shirtCard(c)}</div>${facts(c)}</div>`
    + `<div class="stattiles pl-tiles">${tiles}</div>`
    + '<p class="pl-bands">The value colours are observed bands, not the game\'s: red below 60, orange from 60 to 77, green from 78.</p>'
    + `<div class="row pl-acts">${acts}</div>`;
}

function detail(c) {
  if (!c) return '';
  return `<aside class="panel pl-detail" aria-label="${esc(c.name)}">`
    + `<div class="panel__head"><h2>${esc(c.name)}</h2><span>${esc(c.club || c.nation || '')}</span></div>`
    + `<div class="panel__body">${detailBody(c)}</div></aside>`;
}

const opt = (v, label, sel) => `<option value="${esc(v)}"${sel ? ' selected' : ''}>${esc(label)}</option>`;

const ACTIVE = ['quality', 'rarity', 'ovrMin', 'ovrMax', 'sell'];
const activeCount = (s) => ACTIVE.filter((k) => s[k] !== '' && s[k] != null).length;
const toggleLabel = (s) => (activeCount(s) ? `Filters (${activeCount(s)})` : 'Filters');

// On a phone the five secondary filters fold behind one button, so the list
// starts on the first screen; on a wide screen they are always out.
function filters(s) {
  const dirLabel = s.dir === 'asc' ? 'Lowest first' : 'Highest first';
  return `<div class="pl-filters${s.open ? ' is-open' : ''}">
    <label class="lbl pl-filters__q"><span>Search</span><input class="field" type="search" data-f="q" value="${esc(s.q)}" placeholder="Name, club, nation or league"></label>
    <label class="lbl pl-f-x"><span>Quality</span><select class="field" data-f="quality">${opt('', 'All', !s.quality)}${QUALITIES.map((q) => opt(q.id, q.name, q.id === s.quality)).join('')}</select></label>
    <label class="lbl pl-f-x pl-filters__rar"><span>Rarity <span data-rarchip>${s.rarity ? rarityChip(s.rarity, false) : ''}</span></span><select class="field" data-f="rarity">${opt('', 'All', !s.rarity)}${RARITIES.map((r) => opt(r.id, r.name, r.id === s.rarity)).join('')}</select></label>
    <label class="lbl pl-f-x pl-filters__n"><span>OVR from</span><input class="field" type="number" min="1" max="99" inputmode="numeric" data-f="ovrMin" value="${esc(s.ovrMin)}"></label>
    <label class="lbl pl-f-x pl-filters__n"><span>OVR to</span><input class="field" type="number" min="1" max="99" inputmode="numeric" data-f="ovrMax" value="${esc(s.ovrMax)}"></label>
    <label class="lbl pl-f-x"><span>Market</span><select class="field" data-f="sell">${opt('', 'All', !s.sell)}${opt('yes', 'Sellable', s.sell === 'yes')}${opt('no', 'Unsellable', s.sell === 'no')}</select></label>
    <div class="lbl pl-filters__sort"><span id="plSortLabel">Sort by</span><div class="pl-sort">
      <select class="field" data-f="sort" aria-labelledby="plSortLabel">${SORTS.map((o) => opt(o.key, o.label, o.key === s.sort)).join('')}</select>
      <button type="button" class="iconbtn" data-dir aria-label="${dirLabel}" title="${dirLabel}">${s.dir === 'asc' ? '&uarr;' : '&darr;'}</button>
    </div></div>
    <button type="button" class="btn btn--sm btn--olive pl-filters__toggle" data-act="morefilters" aria-expanded="${!!s.open}">${toggleLabel(s)}</button>
  </div>
  <div class="tabs tabs--sm pl-postabs" role="group" aria-label="Position">
    ${['', ...POSITIONS].map((p) => `<button type="button" class="tab${p === s.pos ? ' is-on' : ''}" data-pos="${p}" aria-pressed="${p === s.pos}"${p ? ` title="${esc(POSITION_NAMES[p])}"` : ''}>${p || 'All'}</button>`).join('')}
  </div>`;
}

function resultsHTML(s, data) {
  const all = collection(s, data);
  const list = results(s, data);
  const count = list.length === all.length ? plural(all.length, 'card') : `${list.length.toLocaleString('en-GB')} of ${plural(all.length, 'card')}`;
  if (!list.length) {
    return `<p class="pl-count">${count}</p><p class="empty-line">No card matches these filters. <button type="button" class="linkbtn" data-act="clearfilters">Clear filters</button></p>`;
  }
  const sel = list.find((c) => c.id === s.sel) || list[0];
  const head = '<div class="list__head pl-row"><span></span><span>Player</span><span class="pl-row__rar">Rarity</span><span class="n">OVR</span><span class="n">Pos</span><span class="n pl-head__stats">Stats</span></div>';
  return `<p class="pl-count">${count}</p>
  <div class="pl-layout">
    <div class="listwrap pl-list"><div class="list">${head}<div class="list__rows">${list.map((c) => row(c, s, c === sel)).join('')}</div></div></div>
    <div class="pl-side" data-detail>${detail(sel)}</div>
  </div>`;
}

function toolbar(n) {
  return `<div class="row pl-tools">
    <button type="button" class="btn btn--sm btn--lime" data-act="add">Add card</button>
    <button type="button" class="btn btn--sm btn--olive" data-act="import">Import CSV</button>
    ${n ? `<button type="button" class="btn btn--sm btn--olive" data-act="export">Export CSV</button>
    <button type="button" class="btn btn--sm btn--red" data-act="clear">Clear all</button>` : ''}
  </div>`;
}

const CSV_HINT = `One card per row, under a header row that names the columns. <b>name</b>, <b>ovr</b> and <b>position</b> are needed; the rest can be blank. A position can hold several, separated by spaces, primary first: <code>CM CAM</code>. Quality and rarity take the name on the card (Gold Rare, Team of the Week), and sellable takes yes or no.`;

function csvDetails() {
  return `<details class="pl-csv"><summary>The CSV format</summary><p>${CSV_HINT}</p><p class="pl-csvcols"><code>${CSV_COLUMNS.join(',')}</code></p></details>`;
}

function emptyDatabase() {
  return `<div class="panel pl-empty"><div class="panel__head"><h2>No cards here yet</h2><span>The database opens as players submit cards</span></div>
    <div class="panel__body">
      <p>Every card in the database will be one a player can see in the game and has typed in or sent as a CSV. No rating is taken from the game's files or servers, so the list starts empty and grows card by card.</p>
      <p>Until then, keep your own cards in My cards. The PTC Solver and the Squad Builder both pick from them.</p>
      <button type="button" class="btn btn--sm" data-act="gomine">Go to My cards</button>
    </div></div>`;
}

function emptyMine() {
  return '<p class="empty-line pl-mine-empty">You have no cards saved yet. Add them one at a time, or import a CSV of the ones you own.</p>';
}

function pageHTML(s, data) {
  const tab = tabOf(s);
  const coll = collection(s, data);
  const tabBtn = (id, label, n) => `<button type="button" class="tab${tab === id ? ' is-on' : ''}" data-tab="${id}" role="tab" aria-selected="${tab === id}">${label}${n == null ? '' : ` <span class="pl-tabn">${n.toLocaleString('en-GB')}</span>`}</button>`;
  const body = coll.length
    ? `${filters(s)}<div data-results>${resultsHTML(s, data)}</div>`
    : tab === 'db' ? emptyDatabase() : emptyMine();
  return `<div class="wrap pl">
    <div class="pl-top">
      <div class="tabs" role="tablist" aria-label="Which cards">${tabBtn('db', 'Database', data.dbLoaded ? data.db.length : null)}${tabBtn('mine', 'My cards', data.mine.length)}</div>
      ${tab === 'mine' ? toolbar(data.mine.length) : ''}
    </div>
    ${body}
    ${tab === 'mine' ? csvDetails() : ''}
    <nav class="pl-browse" aria-label="Browse the database">Browse the database: <a href="ufm27/best-cards/">Best cards</a><a href="ufm27/rarities/">Rarities</a><a href="ufm27/clubs/">Clubs</a><a href="ufm27/positions/">Positions</a><a href="ufm27/compare/">Compare</a></nav>
  </div>`;
}

// ---- the view --------------------------------------------------------------

export function render() {
  return pageHTML({ ...DEFAULT_FILTER, tab: 'mine' }, { db: [], mine: [], dbLoaded: false });
}

const data = () => ({ db, mine: myCards.all(), dbLoaded });
const keep = () => save('players', Object.fromEntries(KEPT.map((k) => [k, st[k]])));
const isPhone = () => window.matchMedia('(max-width: 860px)').matches;
function setDir(b) {
  if (!b) return;
  const label = st.dir === 'asc' ? 'Lowest first' : 'Highest first';
  b.innerHTML = st.dir === 'asc' ? '&uarr;' : '&darr;';
  b.title = label;
  b.setAttribute('aria-label', label);
}

function paint() { root.innerHTML = pageHTML(st, data()); }
function paintResults() {
  const r = root.querySelector('[data-results]');
  if (r) r.innerHTML = resultsHTML(st, data()); else paint();
}

function findCard(id) {
  return collection(st, data()).find((c) => c.id === id) || null;
}

function select(id) {
  const c = findCard(id);
  if (!c) return;
  if (isPhone()) {
    openDialog({
      title: c.name, sub: [c.club, c.nation].filter(Boolean).join(' · '),
      body: `<div class="pl-detail pl-detail--dialog">${detailBody(c)}</div>`,
      onMount(d, close) {
        on(d, 'click', '[data-act]', (e, b) => { close(); act(b.dataset.act, b.dataset.id); });
        on(d, 'click', 'a[href]', () => close());
      },
    });
    return;
  }
  st.sel = id;
  root.querySelectorAll('.pl-row[data-card]').forEach((r) => {
    const yes = r.dataset.card === id;
    r.classList.toggle('is-on', yes);
    r.setAttribute('aria-pressed', String(yes));
  });
  const side = root.querySelector('[data-detail]');
  if (side) side.innerHTML = detail(c);
}

function editCard(card) {
  const isNew = !card;
  return openDialog({
    title: isNew ? 'Add card' : 'Edit card',
    sub: isNew ? 'Type it in as the card shows it' : card.name,
    body: cardFormHTML(card || {}),
    wide: true,
    actions: [{ label: 'Cancel', kind: 'olive', value: 'cancel' }, { label: 'Save', value: 'save', manual: true }],
    onMount(d, close) {
      const form = d.querySelector('[data-cardform]');
      wireCardForm(form);
      const saveIt = () => {
        const { card: c, errors } = readCardForm(form, card?.id);
        if (errors.length) return;
        st.sel = myCards.upsert(c).id;
        if (isNew) { st.tab = 'mine'; keep(); }
        close('saved');
        toast(isNew ? `${c.name} added` : 'Card saved');
      };
      d.querySelector('[data-value="save"]').addEventListener('click', saveIt);
      form.addEventListener('submit', (e) => { e.preventDefault(); saveIt(); });
    },
  });
}

function importCSV() {
  let readyFor = null;
  return openDialog({
    title: 'Import CSV', sub: 'Add many cards at once',
    wide: true,
    body: `<p class="hint">${CSV_HINT}</p>
      <p class="pl-csvcols"><code>${CSV_COLUMNS.join(',')}</code></p>
      <div class="form">
        <label class="lbl"><span>Choose a file</span><input class="field pl-file" type="file" accept=".csv,text/csv,text/plain" data-file></label>
        <label class="lbl"><span>Or paste it here</span><textarea class="field" data-csv rows="8" spellcheck="false" placeholder="name,ovr,position,quality,rarity,nation,league,club&#10;Test Striker,84,ST,Gold,,Spain,Spain 1,Test FC"></textarea></label>
        <div class="pl-problems" data-problems hidden></div>
      </div>`,
    actions: [{ label: 'Cancel', kind: 'olive', value: 'cancel' }, { label: 'Import', value: 'import', manual: true }],
    onMount(d, close) {
      const ta = d.querySelector('[data-csv]');
      const box = d.querySelector('[data-problems]');
      const btn = d.querySelector('[data-value="import"]');
      d.querySelector('[data-file]').addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (file) { ta.value = await file.text(); readyFor = null; box.hidden = true; }
      });
      ta.addEventListener('input', () => { readyFor = null; btn.textContent = 'Import'; });
      btn.addEventListener('click', () => {
        const text = ta.value;
        const { cards, problems } = cardsFromCSV(text);
        const show = (lines, tail) => {
          box.hidden = false;
          box.innerHTML = `<ul>${lines.slice(0, 5).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`
            + (lines.length > 5 ? `<p>And ${plural(lines.length - 5, 'more row')} like these.</p>` : '') + (tail ? `<p>${tail}</p>` : '');
        };
        if (!cards.length) { show(problems.length ? problems : ['Paste a CSV or choose a file first.']); return; }
        if (problems.length && readyFor !== text) {
          readyFor = text;
          show(problems, `${plural(cards.length, 'card')} ready. Press Import again to add them and skip the ${plural(problems.length, 'row')} above.`);
          btn.textContent = `Import ${cards.length}`;
          return;
        }
        myCards.addMany(cards);
        st.tab = 'mine'; keep();
        close('imported');
        toast(`${plural(cards.length, 'card')} imported${problems.length ? `, ${plural(problems.length, 'row')} skipped` : ''}`);
      });
    },
  });
}

function exportCSV() {
  const cards = myCards.all();
  if (!cards.length) { toast('No cards to export.'); return; }
  const url = URL.createObjectURL(new Blob([cardsToCSV(cards)], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ufmwiz-my-cards.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`${plural(cards.length, 'card')} exported`);
}

async function act(what, id) {
  const card = id ? findCard(id) : null;
  if (what === 'add') editCard(null);
  else if (what === 'import') importCSV();
  else if (what === 'export') exportCSV();
  else if (what === 'edit' && card) editCard(card);
  else if (what === 'keep' && card) {
    myCards.upsert({ ...card, id: uid() });
    toast(`${card.name} saved to My cards`);
  } else if (what === 'delete' && card) {
    const ok = await confirmDialog({
      title: 'Delete this card?', sub: card.name,
      message: `${card.name} comes out of My cards.`,
      detail: 'It is only deleted from this browser.',
      ok: 'Delete', okKind: 'red',
    });
    if (ok) { myCards.remove(card.id); toast('Card deleted'); }
  } else if (what === 'clear') {
    const ok = await confirmDialog({
      title: 'Clear all cards?', sub: plural(myCards.all().length, 'card'),
      message: 'This deletes every card in My cards from this browser.',
      detail: 'Export a CSV first if you want them back.',
      ok: 'Clear all', okKind: 'red',
    });
    if (ok) { myCards.clear(); toast('My cards cleared'); }
  } else if (what === 'compare' && card) {
    const r = addToCompare(card);
    if (r === 'full') toast('Compare holds four cards. Remove one there first.');
    if (navigate) navigate('ufm27/compare/');
  } else if (what === 'gomine') { st.tab = 'mine'; keep(); paint(); }
  else if (what === 'morefilters') {
    st.open = !st.open;
    const f = root.querySelector('.pl-filters');
    f?.classList.toggle('is-open', st.open);
    root.querySelector('.pl-filters__toggle')?.setAttribute('aria-expanded', String(st.open));
  } else if (what === 'clearfilters') {
    Object.assign(st, { q: '', pos: '', quality: '', rarity: '', ovrMin: '', ovrMax: '', sell: '' });
    keep(); paint();
  }
}

export function mount(body, ctx) {
  root = body;
  navigate = ctx?.navigate || null;
  const saved = load('players', {}) || {};
  st = { ...DEFAULT_FILTER, ...Object.fromEntries(KEPT.filter((k) => saved[k] !== undefined).map((k) => [k, saved[k]])), q: '', sel: null, open: false };
  paint();
  databaseCards().then((cards) => {
    db = cards;
    slugs = cardSlugs(db);
    dbLoaded = true;
    if (!saved.tab) st.tab = db.length ? 'db' : 'mine';
    paint();
  });
  myCards.subscribe(() => { if (root.isConnected) paint(); });

  on(body, 'click', '[data-tab]', (e, b) => {
    if (st.tab === b.dataset.tab) return;
    st.tab = b.dataset.tab; st.sel = null; keep(); paint();
  });
  on(body, 'click', '[data-pos]', (e, b) => {
    st.pos = b.dataset.pos; keep();
    body.querySelectorAll('[data-pos]').forEach((x) => {
      x.classList.toggle('is-on', x === b);
      x.setAttribute('aria-pressed', String(x === b));
    });
    paintResults();
  });
  const syncToggle = () => { const t = body.querySelector('.pl-filters__toggle'); if (t) t.textContent = toggleLabel(st); };
  on(body, 'input', 'input[data-f]', (e, i) => { st[i.dataset.f] = i.value; if (i.dataset.f !== 'q') { keep(); syncToggle(); } paintResults(); });
  on(body, 'change', 'select[data-f]', (e, s) => {
    const k = s.dataset.f;
    st[k] = s.value;
    if (k === 'sort') {
      st.dir = s.value === 'name' ? 'asc' : 'desc';
      setDir(body.querySelector('[data-dir]'));
    }
    if (k === 'rarity') body.querySelector('[data-rarchip]').innerHTML = s.value ? rarityChip(s.value, false) : '';
    keep(); syncToggle(); paintResults();
  });
  on(body, 'click', '[data-dir]', (e, b) => {
    st.dir = st.dir === 'asc' ? 'desc' : 'asc';
    setDir(b);
    keep(); paintResults();
  });
  on(body, 'click', '.pl-row[data-card]', (e, r) => select(r.dataset.card));
  on(body, 'keydown', '.pl-row[data-card]', (e, r) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(r.dataset.card); }
  });
  on(body, 'click', '[data-act]', (e, b) => act(b.dataset.act, b.dataset.id));
}

// Coming back to the page: My cards may have changed elsewhere (a PTC trades
// cards in), so paint from the store again.
export function show() {
  if (root && st) paint();
}
