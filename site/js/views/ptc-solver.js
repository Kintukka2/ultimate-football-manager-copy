// PTC Solver: enter a Player Trade Challenge and the cards you plan to trade
// in, and see what it still needs. Challenges are kept in this browser.

import { esc, on, load, save, uid, one, day } from '../lib/util.js';
import { evaluate, KINDS, PROPS, prop, cmpsFor, DISTINCT_PROPS, defaultReq, exampleChallenge, cleanReq } from '../lib/ptc.js';
import { POSITIONS } from '../data/football.js';
import { QUALITIES, RARITIES } from '../data/rarities.js';
import { myCards } from '../lib/cards.js';
import { tradeIn } from '../lib/board.js';
import { shirtCard } from '../ui/card.js';
import { openDialog, confirmDialog, toast } from '../ui/dialog.js';
import { pickCard } from '../ui/picker.js';

const KEY = 'ptc', ACTIVE = 'ptc:active';
let list = [];
let activeId = null;
let root = null;

// ---- state ------------------------------------------------------------------
function fit(ch) {
  const size = Math.max(1, Math.min(23, Number(ch.size) || 1));
  const cards = (ch.cards || []).slice(0, size);
  while (cards.length < size) cards.push(null);
  return { ...ch, size, cards, reqs: ch.reqs || [] };
}
function readState() {
  list = (load(KEY, []) || []).filter((c) => c && c.id).map(fit);
  activeId = load(ACTIVE, null);
  if (!list.some((c) => c.id === activeId)) activeId = list[0]?.id ?? null;
}
function persist() { save(KEY, list); save(ACTIVE, activeId); }
const active = () => list.find((c) => c.id === activeId) || null;
function replace(ch) {
  const i = list.findIndex((c) => c.id === ch.id);
  if (i >= 0) list[i] = fit(ch); else list.push(fit(ch));
  activeId = ch.id;
  persist();
  paint();
}

// ---- page ---------------------------------------------------------------------
function emptyState() {
  return `<div class="wrap"><div class="boardempty">${tradeIn()}
    <h2>Set up your first challenge</h2>
    <p>Copy what the PTC asks for: how many players, the average rating, any positions or rarities. Then add the cards you plan to trade in.</p>
    <div class="row"><button type="button" class="btn" data-act="new">Create challenge</button><button type="button" class="btn btn--olive" data-act="example">Try an example</button></div>
  </div></div>`;
}

function answer(ch, e) {
  if (ch.done) {
    return `<div class="ptc-done"><p><b class="pos-t">Complete${ch.doneAt ? ` on ${day(ch.doneAt)}` : ''}.</b> These cards were traded in. A repeatable PTC can be run again with new cards.</p>
      <button type="button" class="btn btn--sm btn--olive" data-act="again">Run again</button></div>`;
  }
  if (e.complete) {
    const extra = e.surplus === null ? '' : e.surplus > 0.05 ? ` You are ${one(e.surplus)} OVR above the average.` : ' You are exactly on the average.';
    return `<p class="ptc-answer"><b class="pos-t">Ready to submit.</b> Every requirement is met.${extra}</p>`;
  }
  // A count's need ("2 more needed") only makes sense beside what it counts.
  const needs = e.unmet.map((r) => (!r.needText ? `${r.label}: not met yet`
    : ['count', 'distinct'].includes(r.req.kind) ? `${r.label}: ${r.needText.replace(/^./, (c) => c.toLowerCase())}` : r.needText));
  return `<p class="ptc-answer"><b>${e.unmet.length === 1 ? 'One requirement' : `${e.unmet.length} requirements`} to go.</b> ${esc(needs.slice(0, 2).join('. '))}.</p>`;
}

function slots(ch) {
  return ch.cards.map((c, i) => {
    const label = c ? `Slot ${i + 1}: ${c.name}, ${c.ovr} ${c.pos[0]}` : `Slot ${i + 1}: empty, pick a card`;
    return `<button type="button" class="ptc-slot" data-slot="${i}" aria-label="${esc(label)}"${ch.done ? ' disabled' : ''}>`
      + `${shirtCard(c, { label: 'Select player' })}${c && c.sellable === false ? '<span class="ptc-slot__tag">Unsellable</span>' : ''}</button>`;
  }).join('');
}

function reqRows(e) {
  return e.rows.map((r) => `<div class="req${r.met ? ' is-met' : ''}">
      <span class="req__label">${esc(r.label)}${!r.met && r.needText ? `<small class="req__need">${esc(r.needText)}</small>` : ''}</span>
      <b>${esc(r.current)}</b></div>`).join('');
}

function page() {
  const ch = active();
  if (!ch) return emptyState();
  const e = evaluate(ch);
  const opts = list.map((c) => `<option value="${esc(c.id)}"${c.id === ch.id ? ' selected' : ''}>${esc(c.name)}${c.done ? ' · Complete' : ''}</option>`).join('');
  return `<div class="wrap ptc">
  <div class="ptc-bar">
    <label class="sr-only" for="ptcSelect">Active challenge</label>
    <select class="field ptc-select" id="ptcSelect" data-act="select">${opts}</select>
    <button type="button" class="btn btn--sm btn--olive" data-act="edit"${ch.done ? ' disabled' : ''}>Edit challenge</button>
    <button type="button" class="btn btn--sm" data-act="new">New challenge</button>
    <button type="button" class="btn btn--sm btn--olive" data-act="duplicate">Duplicate</button>
    <button type="button" class="btn btn--sm btn--red" data-act="delete">Delete</button>
  </div>
  ${answer(ch, e)}
  <div class="grid cols-side ptc-layout">
    <section class="panel ptc-cards" aria-label="Cards to submit">
      <div class="panel__head"><h2>Cards to submit</h2><span>${e.filled} of ${ch.size}</span>
        <div class="head-actions"><button type="button" class="btn btn--xs btn--red" data-act="clear"${e.filled && !ch.done ? '' : ' disabled'}>Clear all</button></div></div>
      <div class="panel__body">
        <p class="hint">Tap a slot to pick one of your cards or type one in. Enter each card's base OVR, not one raised by Focus or Chemistry.</p>
        <div class="ptc-slots">${slots(ch)}</div>
        ${ch.done ? '' : `<div class="ptc-foot"><span class="ptc-status">${e.complete ? 'Ready to trade in.' : 'Complete the requirements to submit.'}</span>
          <button type="button" class="btn btn--foil" data-act="complete"${e.complete ? '' : ' disabled'}>Complete</button></div>`}
      </div>
    </section>
    <aside class="panel ptc-req" aria-label="Requirements">
      <div class="panel__head"><h2>${esc(ch.name)}</h2><span>Requirements</span></div>
      <div class="panel__body"><div class="reqs">${reqRows(e)}</div></div>
    </aside>
  </div>
</div>`;
}

function paint() { if (root) root.innerHTML = page(); }

export function render() {
  readState();
  return page();
}

// ---- the setup dialog -----------------------------------------------------------
const sel = (f, opts, val, extra = '') => `<select class="field" data-f="${f}" ${extra}>${opts.map(([v, l]) =>
  `<option value="${esc(v)}"${String(v) === String(val) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
const numIn = (f, val, min, max, label) => `<input class="field" type="number" inputmode="numeric" data-f="${f}" value="${esc(val)}" min="${min}" max="${max}" aria-label="${esc(label)}">`;
const word = (w) => `<span class="ptc-row__word">${esc(w)}</span>`;

const OPS = [['gte', 'At least'], ['lte', 'At most'], ['eq', 'Exactly']];
const CMP_LABEL = { gt: 'higher than', gte: 'at least', lt: 'lower than', lte: 'at most', eq: 'exactly', ne: 'not' };
const CAT_LABEL = { eq: 'is', ne: 'is not' };
const LINES = [['ATT', 'ATT'], ['MID', 'MID'], ['DEF', 'DEF'], ['GK', 'GK']];

function defaultValue(propId) {
  const p = prop(propId);
  if (propId === 'pos') return 'ST';
  if (propId === 'line') return 'ATT';
  if (propId === 'quality') return 'gold';
  if (propId === 'rarity') return 'team-of-the-week';
  if (propId === 'sellable') return 'no';
  if (propId === 'age') return 25;
  return p.type === 'num' ? 75 : '';
}

function valueControl(w) {
  const v = w.value;
  switch (w.prop) {
    case 'pos': return sel('value', POSITIONS.map((p) => [p, p]), v, 'aria-label="Position"');
    case 'line': return sel('value', LINES, v, 'aria-label="Line"');
    case 'quality': return sel('value', QUALITIES.map((q) => [q.id, q.name]), v, 'aria-label="Quality"');
    case 'rarity': return sel('value', RARITIES.map((r) => [r.id, r.name]), v, 'aria-label="Rarity"');
    case 'sellable': return sel('value', [['yes', 'Sellable'], ['no', 'Unsellable']], v === true ? 'yes' : v === false ? 'no' : v, 'aria-label="Sellable"');
    default:
      return prop(w.prop).type === 'num'
        ? numIn('value', v, 0, 99, prop(w.prop).name)
        : `<input class="field" type="text" data-f="value" value="${esc(v)}" placeholder="${esc(prop(w.prop).name)}" aria-label="${esc(prop(w.prop).name)}">`;
  }
}

function condHTML(w, i, count) {
  const cmps = cmpsFor(w.prop).map((c) => [c, prop(w.prop).type === 'num' ? CMP_LABEL[c] : CAT_LABEL[c]]);
  return `<div class="ptc-cond" data-cond="${i}">${word(i ? 'and' : 'where')}
    ${sel('prop', PROPS.map((p) => [p.id, p.name]), w.prop, 'data-rr aria-label="Property"')}
    ${sel('cmp', cmps, w.cmp, 'aria-label="Comparison"')}
    ${valueControl(w)}
    ${i ? '<button type="button" class="linkbtn" data-delcond>Remove</button>' : count < 2 ? '<button type="button" class="linkbtn" data-addcond>Add condition</button>' : ''}</div>`;
}

function rowHTML(r) {
  const kind = sel('kind', KINDS.map((k) => [k.id, k.name]), r.kind, 'data-rr aria-label="Requirement"');
  const del = '<button type="button" class="iconbtn" data-delrow aria-label="Remove requirement">&times;</button>';
  let fields = '', conds = '';
  switch (r.kind) {
    case 'count': {
      const where = r.where?.length ? r.where : [{ prop: 'pos', cmp: 'eq', value: 'ST' }];
      fields = `${sel('op', OPS, r.op, 'aria-label="How many"')}${numIn('n', r.n, 0, 23, 'Number of players')}${word('players')}`;
      conds = where.map((w, i) => condHTML(w, i, where.length)).join('');
      break;
    }
    case 'avg': fields = sel('cmp', [['gte', 'at least'], ['lte', 'at most']], r.cmp, 'aria-label="Comparison"') + numIn('value', r.value, 1, 99, 'Average rating'); break;
    case 'min': case 'max': fields = numIn('value', r.value, 1, 99, 'Rating'); break;
    case 'sum': fields = word('at least') + numIn('value', r.value, 1, 2277, 'Total rating'); break;
    case 'distinct': fields = `${sel('op', OPS, r.op, 'aria-label="How many"')}${numIn('value', r.value, 0, 23, 'How many different')}`
      + sel('prop', DISTINCT_PROPS.map((d) => [d.id, d.many]), r.prop, 'aria-label="Different what"'); break;
    default: break;
  }
  return `<div class="ptc-row" data-row>${kind}${fields}${del}${conds}</div>`;
}

// Read a row back as it stands, before any tidying.
function readRow(el) {
  const f = (name, scope = el) => scope.querySelector(`:scope > [data-f="${name}"]`)?.value;
  const r = { kind: f('kind') };
  if (r.kind === 'count') {
    r.op = f('op'); r.n = f('n');
    r.where = [...el.querySelectorAll('[data-cond]')].map((c) => ({ prop: f('prop', c), cmp: f('cmp', c), value: f('value', c) }));
  } else if (r.kind === 'distinct') { r.op = f('op'); r.value = f('value'); r.prop = f('prop'); } else { r.cmp = f('cmp'); r.value = f('value'); }
  return r;
}

function setupHTML(ch) {
  return `<form class="form ptc-setup" novalidate>
    <div class="form__grid">
      <label class="lbl" style="grid-column: span 2"><span>Name</span><input class="field" name="name" value="${esc(ch.name)}" placeholder="As the PTC is called in the game"></label>
      <label class="lbl"><span>Number of players</span><input class="field" name="size" type="number" inputmode="numeric" min="1" max="23" value="${esc(ch.size)}"></label>
    </div>
    <h3 class="sub" style="margin-top:6px">Requirements</h3>
    <p class="hint">One row for each line on the PTC screen. The number of players is always checked.</p>
    <div class="ptc-rows" data-rows>${ch.reqs.map(rowHTML).join('')}</div>
    <button type="button" class="btn btn--sm btn--lime" data-addrow>Add requirement</button>
    <p class="bad-t" data-err hidden></p>
  </form>`;
}

function setup(ch, isNew) {
  return openDialog({
    title: isNew ? 'New challenge' : 'Edit challenge',
    sub: 'What the PTC asks for',
    body: setupHTML(ch), wide: true,
    actions: [{ label: 'Cancel', kind: 'olive', value: 'cancel' }, { label: 'Save challenge', value: 'save', manual: true }],
    onMount(d, close) {
      const rows = d.querySelector('[data-rows]');
      const err = d.querySelector('[data-err]');
      const swap = (el, r) => { el.outerHTML = rowHTML(r); };
      on(d, 'change', '[data-rr]', (e, t) => {
        const el = t.closest('[data-row]');
        if (t.dataset.f === 'kind') return swap(el, defaultReq(t.value));
        const r = readRow(el);
        const c = t.closest('[data-cond]');
        if (c) {
          const w = r.where[Number(c.dataset.cond)];
          w.cmp = prop(w.prop).type === 'num' ? 'gte' : 'eq';
          w.value = defaultValue(w.prop);
        }
        swap(el, r);
      });
      on(d, 'click', '[data-addrow]', () => { rows.insertAdjacentHTML('beforeend', rowHTML(defaultReq('count'))); });
      on(d, 'click', '[data-delrow]', (e, b) => b.closest('[data-row]').remove());
      on(d, 'click', '[data-addcond]', (e, b) => {
        const el = b.closest('[data-row]');
        const r = readRow(el);
        r.where.push({ prop: 'ovr', cmp: 'gte', value: 75 });
        swap(el, r);
      });
      on(d, 'click', '[data-delcond]', (e, b) => {
        const el = b.closest('[data-row]');
        const r = readRow(el);
        r.where.splice(Number(b.closest('[data-cond]').dataset.cond), 1);
        swap(el, r);
      });
      d.querySelector('[data-value="save"]').addEventListener('click', () => {
        const form = d.querySelector('form');
        const size = Number(form.elements.size.value);
        const fail = (m) => { err.hidden = false; err.textContent = m; err.scrollIntoView({ block: 'nearest' }); };
        if (!Number.isInteger(size) || size < 1 || size > 23) return fail('Number of players is a whole number from 1 to 23.');
        const reqs = [];
        for (const el of rows.querySelectorAll('[data-row]')) {
          const { req, error } = cleanReq(readRow(el));
          if (error) { el.classList.add('is-bad'); return fail(error); }
          el.classList.remove('is-bad');
          reqs.push(req);
        }
        close({ ...ch, name: form.elements.name.value.trim() || 'Challenge', size, reqs });
      });
    },
  }).then((v) => (v && typeof v === 'object' ? v : null));
}

// ---- actions ------------------------------------------------------------------------
async function act(name) {
  const ch = active();
  switch (name) {
    case 'new': {
      const fresh = { id: uid(), name: `Challenge ${list.length + 1}`, size: 5, reqs: [defaultReq('avg')], cards: [], done: false };
      const out = await setup(fit(fresh), true);
      if (out) replace(out);
      break;
    }
    case 'example':
      replace(exampleChallenge(uid()));
      toast('Example loaded: the game\'s own strikers PTC.');
      break;
    case 'edit': {
      const out = await setup(ch, false);
      if (out) replace(out);
      break;
    }
    case 'duplicate':
      replace({ ...structuredClone(ch), id: uid(), name: `${ch.name} (copy)`, done: false, doneAt: undefined });
      toast('Challenge copied.');
      break;
    case 'delete':
      if (await confirmDialog({ title: 'Delete challenge?', message: `Delete "${ch.name}"?`, detail: 'Its requirements and the cards on it go. Your cards stay in My cards.', ok: 'Delete', okKind: 'red' })) {
        list = list.filter((c) => c.id !== ch.id);
        activeId = list[0]?.id ?? null;
        persist();
        paint();
      }
      break;
    case 'clear':
      if (await confirmDialog({ title: 'Clear all cards?', message: 'Take every card off this challenge?', detail: 'Your cards stay in My cards.', ok: 'Clear all', okKind: 'red' })) {
        replace({ ...ch, cards: [] });
      }
      break;
    case 'again':
      replace({ ...ch, cards: [], done: false, doneAt: undefined });
      break;
    case 'complete': {
      const e = evaluate(ch);
      if (!e.complete) return;
      const detail = e.surplus === null ? '' : e.surplus > 0.05 ? `You are ${one(e.surplus)} OVR above the requirement.` : 'You are exactly on the requirement.';
      const ok = await confirmDialog({
        title: 'Complete challenge?', sub: 'These cards will be traded in',
        message: 'Are you sure you want to permanently trade in these players?', detail,
        ok: 'Complete', okKind: 'foil',
      });
      if (!ok) return;
      const used = ch.cards.filter(Boolean);
      myCards.remove(used.filter((c) => c.source === 'mine').map((c) => c.id));
      replace({ ...ch, done: true, doneAt: new Date().toISOString().slice(0, 10) });
      toast(`Challenge complete. ${used.length === 1 ? '1 card' : `${used.length} cards`} traded in.`);
      break;
    }
    default: break;
  }
}

async function slot(i) {
  const ch = active();
  if (!ch || ch.done) return;
  const current = ch.cards[i];
  const exclude = new Set(ch.cards.filter(Boolean).map((c) => c.id));
  if (current) {
    const v = await openDialog({
      title: current.name, sub: `Slot ${i + 1} · ${current.ovr} ${current.pos[0]}`,
      body: `<div class="ptc-peek">${shirtCard(current)}</div>`,
      actions: [{ label: 'Remove', kind: 'red', value: 'remove' }, { label: 'Change card', kind: 'olive', value: 'change' }],
    });
    if (v === 'remove') { ch.cards[i] = null; replace(ch); return; }
    if (v !== 'change') return;
    exclude.delete(current.id);
  }
  const card = await pickCard({ title: `Slot ${i + 1}`, exclude });
  if (!card) return;
  const fresh = active();
  fresh.cards[i] = card;
  replace(fresh);
}

export function mount(body) {
  root = body;
  readState();
  paint();
  on(body, 'click', 'button[data-act]', (e, b) => { if (!b.disabled) act(b.dataset.act); });
  on(body, 'change', 'select[data-act="select"]', (e, s) => { activeId = s.value; persist(); paint(); });
  on(body, 'click', '[data-slot]', (e, b) => { if (!b.disabled) slot(Number(b.dataset.slot)); });
}

// Coming back to the page: My cards may have changed on another page.
export function show() {
  readState();
  paint();
}
