// Squad Builder: a formation, eleven of your cards, and the Chemistry and team
// OVR they make, before you buy anyone. Four Lineup Presets, as in the game.
// The pitch is the game's surface (warm black, gold lines) because it carries
// cards; the board is ours, so it only appears as the empty state.

import { esc, on, load, save, one, signed } from '../lib/util.js';
import { FORMATIONS, formation as formationById, slotsFor } from '../data/football.js';
import { CHEMISTRY } from '../data/game.js';
import { myCards, normalize } from '../lib/cards.js';
import { summarize, refit, autoOrder, place, cardH, PITCH, cleanThresholds, KINDS } from '../lib/squad.js';
import { shirtCard, shortName, rarityChip } from '../ui/card.js';
import { openDialog, confirmDialog, toast } from '../ui/dialog.js';
import { pickCard } from '../ui/picker.js';
import { emptySquad } from '../lib/board.js';

const PRESETS = 4;
const norm = (s) => String(s ?? '').trim().toLowerCase();
const blank = () => ({ formationId: FORMATIONS[0].id, slots: Array(11).fill(null) });

// ---- state -------------------------------------------------------------------
function cleanCard(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const { card, errors } = normalize(raw);
  return errors.length ? null : { ...card, source: raw.source || 'mine' };
}

function readState() {
  const raw = load('squads', null);
  const presets = Array.from({ length: PRESETS }, (_, i) => {
    const p = Array.isArray(raw) ? raw[i] : null;
    if (!p || typeof p !== 'object') return blank();
    return { formationId: formationById(p.formationId).id, slots: Array.from({ length: 11 }, (_, k) => cleanCard(p.slots?.[k])) };
  });
  let active = Number(load('squads:active', 0));
  if (!(Number.isInteger(active) && active >= 0 && active < PRESETS)) active = 0;
  return { presets, active, thresholds: cleanThresholds(load('chem:thresholds', null)), mine: 0 };
}

function persist(state) {
  save('squads', state.presets);
  save('squads:active', state.active);
}

// A card you edit in My cards is the same card on the pitch.
function refresh(state) {
  for (const p of state.presets) {
    p.slots = p.slots.map((c) => {
      if (!c) return null;
      const latest = myCards.get(c.id);
      return latest ? { ...latest, source: 'mine' } : c;
    });
  }
  state.mine = myCards.all().length;
}

// ---- markup ------------------------------------------------------------------
const CHEV = '<svg viewBox="0 0 12 12" aria-hidden="true" width="12" height="12"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// Pitch lines in faint gold hairline. The pitch is 100 wide and 140 tall.
const MARKINGS = '<svg class="sq-lines" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true">'
  + '<g fill="none" stroke="#E9D38D" stroke-width="1" vector-effect="non-scaling-stroke">'
  + '<rect x="3" y="3" width="94" height="134" vector-effect="non-scaling-stroke"/>'
  + '<path d="M3 70 H97" vector-effect="non-scaling-stroke"/>'
  + '<circle cx="50" cy="70" r="11" vector-effect="non-scaling-stroke"/>'
  + '<path d="M21 3 V25 H79 V3 M37 3 V10 H63 V3" vector-effect="non-scaling-stroke"/>'
  + '<path d="M21 137 V115 H79 V137 M37 137 V130 H63 V137" vector-effect="non-scaling-stroke"/>'
  + '</g><g fill="#E9D38D"><circle cx="50" cy="70" r=".8"/><circle cx="50" cy="18" r=".7"/><circle cx="50" cy="122" r=".7"/></g></svg>';

function toolbar(state, s) {
  const tabs = state.presets.map((p, i) => {
    const n = p.slots.filter(Boolean).length;
    return `<button class="tab${i === state.active ? ' is-on' : ''}" type="button" role="tab" aria-selected="${i === state.active}" data-preset="${i}" aria-label="Lineup ${i + 1}${n ? `, ${n} players` : ''}"><span class="sq-lword">Lineup </span>${i + 1}${n ? `<span class="sq-count" aria-hidden="true">${n}</span>` : ''}</button>`;
  }).join('');
  return `<div class="tabs tabs--sm sq-presets" role="tablist" aria-label="Lineup Presets">${tabs}</div>
    <div class="sq-actions">
      <button class="btn btn--sm btn--olive" type="button" data-formation-open aria-haspopup="dialog"><span class="sq-flabel">Formation</span> ${esc(s.formation.name)} ${CHEV}</button>
      ${state.mine ? '<button class="btn btn--sm" type="button" data-auto>Auto order</button>' : ''}
      <button class="btn btn--sm btn--red" type="button" data-clear${s.filled ? '' : ' disabled'}>Clear</button>
    </div>`;
}

function pitch(s) {
  const pts = place(s.rows);
  const h = cardH();
  const slots = s.rows.map((r) => {
    const pt = pts.find((p) => p.i === r.i);
    const style = `left:${(pt.x - PITCH.cardW / 2).toFixed(2)}%;top:${(pt.y - h / 2).toFixed(2)}%`;
    if (!r.card) {
      return `<div class="sq-slot is-empty" style="${style}" role="button" tabindex="0" data-slot="${r.i}" aria-label="${esc(r.pos)}: empty. Select player">`
        + `<span class="sq-card">${shirtCard(null, { label: r.pos })}</span></div>`;
    }
    const label = `${r.pos}: ${r.card.name}, ${r.card.ovr} OVR, Chemistry ${signed(r.chem)}${r.fit === 'wrong' ? ', out of position' : ''}`;
    return `<div class="sq-slot is-${r.fit}" style="${style}" role="button" tabindex="0" data-slot="${r.i}" aria-label="${esc(label)}">`
      + `<span class="sq-card">${shirtCard(r.card)}</span>`
      + `<span class="sq-name">${esc(shortName(r.card.name))}</span>`
      + `<span class="pips" data-l="${r.chem}" aria-hidden="true"><i></i><i></i><i></i></span></div>`;
  }).join('');
  return `<div class="sq-pitch" style="--card-w:${PITCH.cardW}%;aspect-ratio:1 / ${PITCH.ratio}" role="group" aria-label="Lineup in ${esc(s.formation.name)}">${MARKINGS}${slots}</div>
    <p class="sq-legend"><span><i style="background:#00FD89"></i>Their position</span><span><i style="background:#E57703"></i>One of their other positions</span><span><i style="background:#E50021"></i>Out of position</span></p>
    <p class="muted sq-note">Tap a slot to add a card. Bench slots don't count for Chemistry and aren't in the builder yet.</p>`;
}

const EMPTY = `<div class="boardempty">${emptySquad()}<h2>No squad yet</h2>`
  + '<p>Pick a formation and drop in the cards you own. The builder shows your Chemistry before you spend a coin on the market.</p>'
  + '<div class="row"><button class="btn btn--sm" type="button" data-first>Add a player</button></div></div>';

function groupsTable(s) {
  const shown = s.groups.filter((g) => g.count >= 2 || g.step > 0);
  const rest = s.groups.length - shown.length;
  if (!shown.length) return '<p class="empty-line">No two starters share a nationality, league or special rarity yet.</p>';
  const rows = shown.map((g) => {
    const name = g.kind === 'rarity' ? rarityChip(g.id) : esc(g.name);
    const next = g.step >= CHEMISTRY.max ? 'Max' : g.next ? `${signed(g.next.step)} at ${g.next.at}` : '<span class="muted" title="Enter this threshold in Thresholds">Not set</span>';
    return `<tr><td><small class="sq-kind">${esc(g.label)}</small>${name}</td><td class="n big">${g.count}</td>`
      + `<td class="n big${g.step ? ' pos-t' : ''}">${g.step ? signed(g.step) : '0'}</td><td class="sq-next">${next}</td></tr>`;
  }).join('');
  return `<div class="dtable-wrap"><table class="dtable sq-groups"><thead><tr><th>Group</th><th class="n">Starters</th><th class="n">Boost</th><th>Next</th></tr></thead><tbody>${rows}</tbody></table></div>`
    + (rest ? `<p class="muted sq-rest">${rest} more ${rest === 1 ? 'group has' : 'groups have'} one starter each.</p>` : '');
}

function summary(s) {
  if (!s.filled) return EMPTY;
  const hex = (v, cap, lg = false) => `<figure class="sq-hexfig"><span class="hexchip${lg ? ' hexchip--lg' : ''}"><i>${v == null ? '–' : one(v)}${lg ? '<small>OVR</small>' : ''}</i></span><figcaption>${cap}</figcaption></figure>`;
  const pips = Math.round(s.chem);
  return `<div class="panel"><div class="panel__head"><h2>${esc(s.formation.name)}</h2><span>${s.filled} of 11 starters</span></div>
    <div class="panel__body">
      <div class="sq-hexes">${hex(s.ovr, 'Team', true)}${hex(s.lines.ATT, 'ATT')}${hex(s.lines.MID, 'MID')}${hex(s.lines.DEF, 'DEF')}</div>
      <div class="sq-chm" aria-label="Team Chemistry ${signed(s.chem, 1)}"><span class="pips" data-l="${pips}" aria-hidden="true"><i></i><i></i><i></i></span><b>${signed(s.chem, 1)}</b><span>CHM</span></div>
      <p class="muted sq-fine">Team OVR here is the average of your starters with their Chemistry; ${one(s.base)} without it. The game also counts the bench, by a weight it sets on its server, so its number can differ.</p>
    </div></div>
    <div class="panel"><div class="panel__head"><h2>Chemistry</h2><span>What each group is worth</span></div><div class="panel__body">${groupsTable(s)}</div></div>`;
}

function thresholdsPanel(ts) {
  const game = CHEMISTRY.thresholds;
  const rows = KINDS.map(({ kind, label }) => `<tr><td>${esc(label)}</td>${[0, 1, 2].map((i) => {
    const fromGame = game[kind][i] != null && game[kind][i] === ts[kind][i];
    return `<td class="n"><input class="field sq-th${fromGame ? ' is-game' : ''}" type="number" min="1" max="11" inputmode="numeric" placeholder="?" value="${ts[kind][i] ?? ''}" data-th="${kind}" data-step="${i}" aria-label="${esc(label)} ${signed(i + 1)}: starters needed"${fromGame ? ' title="From the game\'s help"' : ''}></td>`;
  }).join('')}</tr>`).join('');
  return `<div class="panel"><div class="panel__head"><h2>Thresholds</h2><span>Starters each step takes</span></div>
    <div class="panel__body">
      <div class="dtable-wrap"><table class="dtable sq-ths"><thead><tr><th>Group</th><th class="n">+1</th><th class="n">+2</th><th class="n">+3</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="hint sq-thnote">The gold numbers are from the game's help: a nationality is +1 at 2 starters and +2 at 5. Read the rest from the game's Chemistry view and type them in. They're kept in this browser.</p>
      <button class="linkbtn" type="button" data-th-reset>Back to the game's numbers</button>
    </div></div>`;
}

function view(state) {
  const p = state.presets[state.active];
  const s = summarize(p.formationId, p.slots, state.thresholds);
  return `<div class="wrap sq">
    <div class="sq-bar" data-region="bar">${toolbar(state, s)}</div>
    <div class="grid cols-side sq-layout">
      <section class="sq-main" data-region="pitch" aria-label="Pitch">${pitch(s)}</section>
      <aside class="sq-side stack"><div class="stack" data-region="summary">${summary(s)}</div><div data-region="thresholds">${thresholdsPanel(state.thresholds)}</div></aside>
    </div>
  </div>`;
}

// ---- the page ----------------------------------------------------------------
export function render() {
  return view({ presets: Array.from({ length: PRESETS }, blank), active: 0, thresholds: cleanThresholds(null), mine: 0 });
}

export function mount(body) {
  const state = readState();
  refresh(state);
  const cur = () => state.presets[state.active];

  const paint = (regions) => {
    if (!regions) { body.innerHTML = view(state); return; }
    const p = cur();
    const s = summarize(p.formationId, p.slots, state.thresholds);
    const parts = { bar: () => toolbar(state, s), pitch: () => pitch(s), summary: () => summary(s), thresholds: () => thresholdsPanel(state.thresholds) };
    for (const r of regions) { const el = body.querySelector(`[data-region="${r}"]`); if (el) el.innerHTML = parts[r](); }
  };
  const commit = () => { persist(state); paint(['bar', 'pitch', 'summary']); };
  body._squad = { state, paint };

  async function fill(i, pos) {
    const p = cur();
    const others = p.slots.filter((c, k) => c && k !== i);
    const names = new Set(others.map((c) => norm(c.name)));
    const c = await pickCard({ pos, title: 'Select player', exclude: new Set(others.map((c2) => c2.id)), filter: (x) => !names.has(norm(x.name)) });
    if (!c) return;
    // The game's own rule, and its own words.
    if (names.has(norm(c.name))) { toast('A variant of this player is already in your lineup.'); return; }
    p.slots[i] = c;
    state.mine = myCards.all().length;
    commit();
  }

  async function openSlot(i) {
    const p = cur();
    const s = summarize(p.formationId, p.slots, state.thresholds);
    const row = s.rows[i];
    if (!row.card) return fill(i, row.pos);
    const v = await openDialog({
      title: row.card.name, sub: `${row.pos} slot in ${s.formation.name}`, body: slotDetail(row, s), wide: true,
      actions: [{ label: 'Remove', kind: 'red', value: 'remove' }, { label: 'Change player', value: 'change' }],
    });
    if (v === 'remove') { p.slots[i] = null; commit(); }
    if (v === 'change') fill(i, row.pos);
  }

  async function chooseFormation() {
    const p = cur();
    const tiles = FORMATIONS.map((f) => {
      const dots = slotsFor(f).map((sl) => `<i style="left:${sl.x}%;top:${sl.y}%"></i>`).join('');
      const onF = f.id === p.formationId;
      return `<button type="button" class="sq-ftile${onF ? ' is-on' : ''}" data-value="${f.id}" aria-pressed="${onF}"><span class="sq-fmini" aria-hidden="true">${dots}</span><b>${esc(f.name)}</b></button>`;
    }).join('');
    const v = await openDialog({ title: 'Formations', sub: 'Pick how your eleven line up', body: `<div class="sq-ftiles">${tiles}</div>`, wide: true });
    const id = Number(v);
    if (!id || id === p.formationId) return;
    const to = formationById(id);
    const { slots, dropped } = refit(p.slots, p.formationId, id);
    p.formationId = id;
    p.slots = slots;
    commit();
    if (dropped.length) {
      const where = [...new Set(dropped.map((c) => c.pos[0]))].join(', ');
      toast(`${dropped.length} ${dropped.length === 1 ? 'player' : 'players'} came off: ${to.name} has no slot for ${where}.`);
    }
  }

  on(body, 'click', '[data-preset]', (e, b) => {
    state.active = Number(b.dataset.preset);
    persist(state);
    paint(['bar', 'pitch', 'summary']);
  });
  on(body, 'click', '[data-slot]', (e, el) => openSlot(Number(el.dataset.slot)));
  on(body, 'keydown', '[data-slot]', (e, el) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSlot(Number(el.dataset.slot)); }
  });
  on(body, 'click', '[data-first]', () => {
    const rows = slotsFor(formationById(cur().formationId));
    const st = rows.find((r) => r.pos === 'ST') || rows[0];
    fill(st.i, st.pos);
  });
  on(body, 'click', '[data-formation-open]', chooseFormation);
  on(body, 'click', '[data-auto]', () => {
    const p = cur();
    const before = p.slots.filter(Boolean).length;
    const next = autoOrder(p.formationId, p.slots, myCards.all());
    const added = next.filter(Boolean).length - before;
    if (!added) { toast('None of your cards fits an empty slot.'); return; }
    p.slots = next;
    commit();
    toast(`Auto order added ${added} ${added === 1 ? 'player' : 'players'}.`);
  });
  on(body, 'click', '[data-clear]', async () => {
    const ok = await confirmDialog({
      title: 'Clear lineup', sub: `Lineup ${state.active + 1}`, message: 'Take every player off this lineup?',
      detail: 'The cards stay in My cards.', ok: 'Clear', okKind: 'red',
    });
    if (!ok) return;
    cur().slots = Array(11).fill(null);
    commit();
  });
  on(body, 'input', '[data-th]', (e, input) => {
    const v = input.value.trim();
    state.thresholds[input.dataset.th][Number(input.dataset.step)] = v === '' ? null : Number(v);
    state.thresholds = cleanThresholds(state.thresholds);
    input.classList.remove('is-game');
    save('chem:thresholds', state.thresholds);
    paint(['pitch', 'summary']);
  });
  on(body, 'click', '[data-th-reset]', () => {
    state.thresholds = cleanThresholds(CHEMISTRY.thresholds);
    save('chem:thresholds', state.thresholds);
    paint(['pitch', 'summary', 'thresholds']);
  });
  myCards.subscribe(() => {
    const had = state.mine;
    refresh(state);
    if (!!had !== !!state.mine) paint(['bar']);
  });
  paint();
}

export function show(body) {
  const sq = body._squad;
  if (!sq) return;
  refresh(sq.state);
  sq.paint(['bar', 'pitch', 'summary']);
}

function slotDetail(row, s) {
  const c = row.card;
  const mine = s.groups.filter((g) => g.slots.includes(row.i));
  const earning = mine.filter((g) => g.step > 0);
  const raw = earning.reduce((a, g) => a + g.step, 0);
  const why = earning.length
    ? earning.map((g) => `<li><span class="sq-kind">${esc(g.label)}</span> ${g.kind === 'rarity' ? rarityChip(g.id) : esc(g.name)}: ${g.count} starters, <b class="pos-t">${signed(g.step)}</b></li>`).join('')
      + (raw > CHEMISTRY.max ? `<li>That adds up to ${signed(raw)}; a player tops out at ${signed(CHEMISTRY.max)}.</li>` : '')
    : '<li>No Chemistry yet: no other starter shares their nationality, league or special rarity, or the threshold isn\'t entered.</li>';
  const fit = {
    fits: `Plays here: ${esc(row.pos)} is their position.`,
    near: `${esc(row.pos)} is one of their other positions.`,
    wrong: `Out of position: they play ${esc(c.pos.join(', '))}. The game lowers a player's OVR away from their positions. By how much isn't printed, so it isn't counted here.`,
  }[row.fit];
  return `<div class="sq-detail"><div class="sq-detail__card">${shirtCard(c)}</div><div>
    <div class="kv"><div><span>Printed OVR</span><b>${c.ovr}</b></div><div${row.chem ? ' class="is-met"' : ''}><span>Chemistry</span><b>${signed(row.chem)}</b></div><div><span>With Chemistry</span><b>${row.eff}</b></div></div>
    <p class="sq-fit sq-fit--${row.fit}">${fit}</p>
    <ul class="sq-why">${why}</ul>
  </div></div>`;
}
