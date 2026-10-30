// The card database as pages: a page per card, a hub per special rarity,
// club and position, their indexes, and the best cards. tools/build.mjs
// writes every one of them as a real file with the page already in it, so a
// crawler, and a reader with the script blocked, get the whole page; in the
// browser the same render() runs again only when the app moves to a page
// that wasn't the one loaded. Nothing is said about a card that the data
// doesn't hold: a stat nobody captured is a dash, never a number, and no
// price is written into a page. Prices are a reader's own log, in their
// browser.
//
// The route files (card.js, rarity.js, club.js, ...) each pick one kind.

import { esc, on, load, save, int, day } from '../lib/util.js';
import { POSITIONS, POSITION_NAMES, statsFor } from '../data/football.js';
import { RARITIES, rarity as rarityOf, quality as qualityOf, isSpecial } from '../data/rarities.js';
import { databaseCards } from '../lib/cards.js';
import { band } from '../lib/filter.js';
import { cardSlugs, rankCards, rankOf, ordinal, groupsOf, hubHref, hubValue, HUBS } from '../lib/carddb.js';
import { shirtCard, hexchip, rarityChip, crest } from '../ui/card.js';
import { toast } from '../ui/dialog.js';
import { SITE } from '../data/routes.js';

const plural = (n, one, many = one + 's') => `${n.toLocaleString('en-GB')} ${n === 1 ? one : many}`;
const posName = (p) => POSITION_NAMES[p] || p;
const setName = (c) => (isSpecial(c.rarity) ? rarityOf(c.rarity).name : qualityOf(c.quality).name);
const an = (n) => (/^(8|11|18)/.test(String(n)) ? 'an' : 'a');

// The chip in a row: a special rarity's pair, or a base card's quality pair.
function chip(c, label = true) {
  if (rarityOf(c.rarity).fill) return rarityChip(c.rarity, label);
  const q = qualityOf(c.quality);
  return `<span class="rchip rchip--base" style="--fill:${q.fill};--rim:${q.rim}" title="${esc(q.name)}"><i></i>${label ? esc(q.name) : ''}</span>`;
}

// One card as a link in a list: the standings row, the same as on Players.
function linkRow(c, slugs) {
  const stats = statsFor(c.pos[0]).slice(0, 3).map((s) => `<span class="lstat"><span>${s.label}</span><b>${c.stats?.[s.key] ?? '–'}</b></span>`).join('');
  return `<a class="lrow pl-row cp-row" href="ufm27/players/${slugs[c.id]}/">${crest(c.club)}`
    + `<span class="lrow__name"><small>${esc(c.club || c.nation || '—')}</small><b>${esc(c.name)}</b></span>`
    + `<span class="pl-row__rar">${chip(c)}</span>${hexchip(c.ovr, c)}<span class="lrow__pos">${esc(c.pos[0])}</span>${stats}</a>`;
}
const rows = (list, slugs) => `<div class="listwrap pl-list"><div class="list"><div class="list__rows">${list.map((c) => linkRow(c, slugs)).join('')}</div></div></div>`;

const head = (h1, sub) => `<header class="pagehead"><div class="wrap pagehead__in"><h1>${esc(h1)}</h1><p>${esc(sub)}</p></div></header>`;
const crumbs = (trail) => `<nav class="crumbs" aria-label="Breadcrumb"><a href="ufm27/players/">Players</a>${trail.map((t) =>
  ` · ${t.href ? `<a href="${t.href}">${esc(t.name)}</a>` : `<span>${esc(t.name)}</span>`}`).join('')}</nav>`;
const range = (list) => {
  const hi = list[0].ovr, lo = list[list.length - 1].ovr;
  return lo === hi ? `${hi} OVR` : `${lo}–${hi} OVR`;
};
const noCards = (what) => `<p class="soft cp-none">There are no ${what} in the database yet. It fills as players submit the cards they can see in the game. Until then, keep your own in <a href="ufm27/players/">My cards</a>.</p>`;

function world(cards) {
  const list = (cards || []).filter((c) => c.source === 'db' || !c.source);
  const slugs = cardSlugs(list);
  // Hubs exist for a card's first position only, so only those positions link.
  const posHubs = new Set(groupsOf('position', list).keys());
  return { list, slugs, posHubs, bySlug: Object.fromEntries(list.map((c) => [slugs[c.id], c])) };
}

// ---- the card --------------------------------------------------------------

function cardMeta(c) {
  const defs = statsFor(c.pos[0]);
  const have = defs.every((d) => c.stats?.[d.key] != null);
  const words = have ? defs.slice(0, 3).map((d) => `${d.label} ${c.stats[d.key]}`) : [];
  return {
    title: `${c.name} ${c.ovr} ${isSpecial(c.rarity) ? rarityOf(c.rarity).name : c.pos[0]} | UFM 27 card ratings and stats | UFMWiz`,
    desc: `${c.name}'s ${setName(c)} card in Ultimate Football Manager 27: ${an(c.ovr)} ${c.ovr} OVR ${posName(c.pos[0]).toLowerCase()}`
      + `${c.club ? ` for ${c.club}` : ''}${words.length ? `, with ${words[0]}, ${words[1]} and ${words[2]}` : ''}.`,
  };
}

function cardPage(c, w) {
  const slug = w.slugs[c.id];
  const defs = statsFor(c.pos[0]);
  const rarityHub = hubHref('rarity', HUBS.rarity.of(c));
  const clubHub = hubHref('club', c.club);
  const posHub = hubHref('position', c.pos[0]);
  const link = (href, html) => (href ? `<a href="${href}">${html}</a>` : html);
  const fact = (k, v) => `<div><dt>${k}</dt><dd>${v}</dd></div>`;
  const facts = '<dl class="pl-facts">'
    + fact('Positions', c.pos.map((p) => link(w.posHubs.has(p) ? hubHref('position', p) : '', `<abbr title="${esc(posName(p))}">${esc(p)}</abbr>`)).join(' '))
    + fact(isSpecial(c.rarity) ? 'Rarity' : 'Quality', link(rarityHub, chip(c)))
    + (isSpecial(c.rarity) ? fact('Quality', esc(qualityOf(c.quality).name)) : '')
    + fact('Nationality', esc(c.nation || '—'))
    + fact('League', esc(c.league || '—'))
    + fact('Club', c.club ? link(clubHub, esc(c.club)) : '—')
    + (c.age ? fact('Age', esc(c.age)) : '')
    + fact('Market', c.sellable ? 'Sellable' : '<span class="pl-unsell">Unsellable</span> <small class="muted">Can still go into a PTC</small>')
    + '</dl>';
  const tiles = defs.map((s) => {
    const v = c.stats?.[s.key];
    const b = band(v);
    return `<div class="stattile${b ? ' st-' + b : ''}"><b>${v ?? '–'}</b><span>${esc(s.name)}</span></div>`;
  }).join('');
  const atPos = w.list.filter((x) => x.pos[0] === c.pos[0]);
  const pr = rankOf(c, atPos), all = rankOf(c, w.list);
  const rank = (label, r, href) => `<div><span>${esc(label)}</span><b>${r.level ? '=' : ''}${ordinal(r.rank)} <small>of ${int(r.of)}</small></b>${href ? `<a href="${href}">See them ›</a>` : ''}</div>`;

  const others = rankCards(w.list.filter((x) => x.name === c.name && x.id !== c.id), w.slugs);
  // More cards: the set's best, else the club's, else the position's.
  let more = isSpecial(c.rarity) ? w.list.filter((x) => x.rarity === c.rarity && x.name !== c.name) : [];
  let moreBy = isSpecial(c.rarity) ? rarityOf(c.rarity).name : '';
  let moreHref = rarityHub;
  if (more.length < 4 && c.club) { more = w.list.filter((x) => x.club === c.club && x.name !== c.name); moreBy = c.club; moreHref = clubHub; }
  if (more.length < 4) { more = atPos.filter((x) => x.name !== c.name); moreBy = c.pos[0]; moreHref = posHub; }
  more = rankCards(more, w.slugs).slice(0, 8);

  return `<div data-key="card:${esc(slug)}">${head(c.name, `${c.ovr} ${c.pos[0]} · ${setName(c)}`)}
  <div class="wrap view__pad cp">
    ${crumbs([...(rarityHub ? [{ name: rarityOf(c.rarity).name, href: rarityHub }] : []), { name: c.name }])}
    <div class="cp-top">
      <div class="cp-cardcol">
        <div class="cp-card">${shirtCard(c)}</div>
        <div class="row cp-acts">
          <a class="btn btn--sm" href="ufm27/compare/?cards=${esc(slug)}">Compare</a>
          <a class="btn btn--sm btn--olive" href="ufm27/ptc-solver/">PTC Solver</a>
        </div>
      </div>
      <div class="cp-maincol stack">
        <section class="panel"><div class="panel__head"><h2>Card info</h2><span>As the card prints it</span></div><div class="panel__body">${facts}</div></section>
        <section class="panel" id="stats"><div class="panel__head"><h2>${esc(posName(c.pos[0]))} stats</h2></div><div class="panel__body">
          <div class="stattiles pl-tiles cp-tiles">${tiles}</div>
          <p class="pl-bands">The value colours are observed bands, not the game's: red below 60, orange from 60 to 77, green from 78.</p>
          <div class="kv cp-ranks">${rank(`${c.pos[0]} rank in the database`, pr, posHub)}${rank('Overall rank in the database', all, 'ufm27/best-cards/')}</div>
          <p class="hint cp-rankhow">Ranked by OVR, then by the six sub-stats added up. The database holds the cards players have submitted, not every card in the game.</p>
        </div></section>
      </div>
    </div>
    ${others.length ? `<section class="cp-sec" id="versions"><h2 class="sub">Other versions</h2>${rows(others, w.slugs)}</section>` : ''}
    <section class="panel cp-price" id="price" data-price="${esc(slug)}">
      <div class="panel__head"><h2>Your price</h2><span>Kept in this browser, never on the site</span></div>
      <div class="panel__body">
        <div data-price-out><p class="empty-line">No price logged yet. Log what you paid, or what it is listed at, and it builds a line here.</p></div>
        <form class="form__grid cp-priceform" data-price-form>
          <label class="lbl"><span>Date</span><input class="field" type="date" name="day" required></label>
          <label class="lbl"><span>Price in coins</span><input class="field" type="number" name="coins" min="0" step="1" inputmode="numeric" required></label>
          <button class="btn btn--sm" type="submit">Log price</button>
        </form>
      </div>
    </section>
    ${more.length ? `<section class="cp-sec" id="more"><div class="row cp-sechead"><h2 class="sub">More ${esc(moreBy)} cards</h2>${moreHref ? `<a class="more" href="${moreHref}">All of them ›</a>` : ''}</div>${rows(more, w.slugs)}</section>` : ''}
  </div></div>`;
}

// ---- the hubs --------------------------------------------------------------

const KIND_WORD = { rarity: 'Rarities', club: 'Clubs', position: 'Positions' };
const KIND_INDEX = { rarity: 'ufm27/rarities/', club: 'ufm27/clubs/', position: 'ufm27/positions/' };

function hubName(kind, v) {
  return kind === 'position' ? `${posName(v)}s` : kind === 'rarity' ? rarityOf(v).name : v;
}

function hubMeta(kind, v, list) {
  const n = list.length;
  if (kind === 'position') return { title: `Best UFM 27 ${posName(v)}s (${v}): every ${v} card | UFMWiz`, desc: `Every ${v} card in the UFMWiz database for Ultimate Football Manager 27, best first: ${plural(n, 'card')}.` };
  if (kind === 'rarity') return { title: `UFM 27 ${rarityOf(v).name} cards: every card, best first | UFMWiz`, desc: `Every ${rarityOf(v).name} card in the UFMWiz database for Ultimate Football Manager 27, best first: ${plural(n, 'card')}.` };
  return { title: `${v} cards in UFM 27: every card, best first | UFMWiz`, desc: `Every ${v} card in the UFMWiz database for Ultimate Football Manager 27, best first: ${plural(n, 'card')}.` };
}

function hubPage(kind, v, w) {
  const list = rankCards(w.list.filter((c) => HUBS[kind].of(c) === v), w.slugs);
  const slug = HUBS[kind].slug(v);
  const sub = list.length ? `${plural(list.length, 'card')}, ${range(list)}` : 'No cards yet';
  const intro = kind === 'position'
    ? `<p class="hint">A ${esc(v)} card is rated on ${statsFor(v).map((s) => esc(s.name)).join(', ').replace(/, ([^,]*)$/, ' and $1')}. Cards are listed by their first position.</p>`
    : kind === 'rarity' ? `<p class="hint">${rarityChip(v)} Every card in the set counts as one Chemistry group: starters who share it get a boost.</p>` : '';
  return `<div data-key="${kind}:${esc(slug)}">${head(hubName(kind, v), sub)}
  <div class="wrap view__pad cp">
    ${crumbs([{ name: KIND_WORD[kind], href: KIND_INDEX[kind] }, { name: hubName(kind, v) }])}
    ${intro}
    ${list.length ? rows(list, w.slugs) : noCards(`${hubName(kind, v)} cards`)}
  </div></div>`;
}

const INDEX_OF = { rarities: 'rarity', clubs: 'club', positions: 'position' };

function indexPage(indexKind, w) {
  const kind = INDEX_OF[indexKind];
  const groups = groupsOf(kind, w.list);
  const tile = (v, n) => {
    const name = kind === 'position' ? `${v} · ${posName(v)}` : hubName(kind, v);
    const lead = kind === 'rarity' ? rarityChip(v, false) : kind === 'club' ? crest(v) : '';
    const inner = `${lead}<span class="cp-hub__t"><b>${esc(name)}</b><span>${n ? plural(n, 'card') : 'No cards yet'}</span></span>`;
    return n ? `<a class="cp-hub" href="${hubHref(kind, v)}">${inner}</a>` : `<div class="cp-hub is-empty">${inner}</div>`;
  };
  let values;
  if (kind === 'rarity') values = RARITIES.filter((r) => isSpecial(r.id)).map((r) => r.id);
  else if (kind === 'position') values = POSITIONS;
  else values = [...groups.keys()].sort((a, b) => a.localeCompare(b));
  const body = values.length
    ? `<div class="cp-hubs">${values.map((v) => tile(v, groups.get(v)?.length || 0)).join('')}</div>`
    : noCards('clubs');
  const note = kind === 'rarity' ? '<p class="hint">Every special rarity the game has, with the set\'s own chip colours. A set links to its page once the database holds one of its cards.</p>' : '';
  return `<div class="wrap cp" data-key="${indexKind}:">${note}${body}</div>`;
}

function bestPage(w) {
  if (!w.list.length) return `<div class="wrap cp" data-key="best:">${noCards('cards')}</div>`;
  const ranked = rankCards(w.list, w.slugs);
  const byPos = POSITIONS.map((p) => [p, ranked.filter((c) => c.pos[0] === p).slice(0, 3)]).filter(([, l]) => l.length);
  const unsell = ranked.filter((c) => !c.sellable).slice(0, 10);
  return `<div class="wrap cp" data-key="best:">
    <p class="hint">Ranked by OVR, then by the six sub-stats added up. This is the database, which holds the ${plural(w.list.length, 'card')} players have submitted so far, not every card in the game.</p>
    <section class="cp-sec"><h2 class="sub">The top ten</h2>${rows(ranked.slice(0, 10), w.slugs)}</section>
    <section class="cp-sec"><h2 class="sub">The best at each position</h2>
      ${byPos.map(([p, l]) => `<div class="row cp-sechead"><h3 class="cp-h3">${esc(p)} · ${esc(posName(p))}</h3><a class="more" href="${hubHref('position', p)}">Every ${esc(p)} ›</a></div>${rows(l, w.slugs)}`).join('')}
    </section>
    ${unsell.length ? `<section class="cp-sec"><h2 class="sub">The best Unsellable cards</h2><p class="hint">They can't be listed or quick-sold, but every one can go into a PTC.</p>${rows(unsell, w.slugs)}</section>` : ''}
  </div>`;
}

// ---- one renderer for every kind -------------------------------------------

function notFound() {
  return `<div data-key="missing:">${head('Not found', 'That card isn\'t in the database')}
    <div class="wrap view__pad"><p class="soft">It may have been renamed when a second version arrived. <a href="ufm27/players/">Every card is on Players ›</a></p></div></div>`;
}

export function pageFor(kind, params, cards) {
  const w = world(cards);
  if (kind === 'card') {
    const c = w.bySlug[params.slug];
    return c ? { html: cardPage(c, w), ...cardMeta(c), path: `ufm27/players/${params.slug}/` } : { html: notFound() };
  }
  if (kind in HUBS) {
    const v = hubValue(kind, params.slug, w.list);
    if (!v) return { html: notFound() };
    const list = w.list.filter((c) => HUBS[kind].of(c) === v);
    return { html: hubPage(kind, v, w), ...hubMeta(kind, v, list), path: hubHref(kind, v) };
  }
  if (kind === 'best') return { html: bestPage(w) };
  return { html: indexPage(kind, w) };
}

// Every page of one kind the build should write, as route params.
export function pagesOf(kind, cards) {
  const w = world(cards);
  if (kind === 'card') return w.list.map((c) => ({ slug: w.slugs[c.id] }));
  if (kind in HUBS) return [...groupsOf(kind, w.list).keys()].map((v) => ({ slug: HUBS[kind].slug(v) }));
  return [];
}

// ---- the reader's price log, on a card page --------------------------------

const PRICES = 'prices';
function priceOut(slug) {
  const log = (load(PRICES, {}) || {})[slug] || [];
  if (!log.length) return '<p class="empty-line">No price logged yet. Log what you paid, or what it is listed at, and it builds a line here.</p>';
  const sorted = [...log].sort((a, b) => (a.day < b.day ? -1 : 1));
  const last = sorted[sorted.length - 1];
  let chart = '';
  if (sorted.length > 1) {
    const vals = sorted.map((p) => p.coins), lo = Math.min(...vals), hi = Math.max(...vals);
    const x = (i) => 4 + (i / (sorted.length - 1)) * 292, y = (v) => (hi === lo ? 30 : 54 - ((v - lo) / (hi - lo)) * 48);
    chart = `<svg class="cp-chart" viewBox="0 0 300 60" role="img" aria-label="Your logged prices, oldest to newest"><polyline points="${sorted.map((p, i) => `${x(i).toFixed(1)},${y(p.coins).toFixed(1)}`).join(' ')}" fill="none" stroke="#E9D38D" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${sorted.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.coins).toFixed(1)}" r="2.6" fill="#E9D38D"/>`).join('')}</svg>`;
  }
  return `<div class="kv cp-pricekv"><div><span>Last logged, ${esc(day(last.day))}</span><b>${int(last.coins)} <small>coins</small></b></div>${sorted.length > 1 ? `<div><span>Lowest you logged</span><b>${int(Math.min(...sorted.map((p) => p.coins)))} <small>coins</small></b></div>` : ''}</div>${chart}
    <table class="dtable cp-pricetable"><thead><tr><th>Date</th><th class="n">Coins</th><th></th></tr></thead><tbody>${[...sorted].reverse().map((p) => `<tr><td>${esc(day(p.day))}</td><td class="n">${int(p.coins)}</td><td class="n"><button type="button" class="linkbtn" data-price-del="${esc(p.day)}|${p.coins}">Remove</button></td></tr>`).join('')}</tbody></table>`;
}

function wirePrices(body) {
  const box = body.querySelector('[data-price]');
  if (!box || box.dataset.wired) return;
  box.dataset.wired = '1';
  const slug = box.dataset.price;
  const out = box.querySelector('[data-price-out]');
  const form = box.querySelector('[data-price-form]');
  form.elements.day.value = new Date().toISOString().slice(0, 10);
  const paint = () => { out.innerHTML = priceOut(slug); };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const dayV = form.elements.day.value, coins = Math.round(Number(form.elements.coins.value));
    if (!dayV || !(coins >= 0)) return;
    const all = load(PRICES, {}) || {};
    (all[slug] = all[slug] || []).push({ day: dayV, coins });
    save(PRICES, all);
    form.elements.coins.value = '';
    paint();
    toast('Price logged');
  });
  on(box, 'click', '[data-price-del]', (e, b) => {
    const [d, n] = b.dataset.priceDel.split('|');
    const all = load(PRICES, {}) || {};
    const list = all[slug] || [];
    const i = list.findIndex((p) => p.day === d && String(p.coins) === n);
    if (i >= 0) list.splice(i, 1);
    save(PRICES, all);
    paint();
  });
  paint();
}

// ---- the view, for each route file -----------------------------------------

export function makeView(kind) {
  const render = ({ params = {}, cards = [] } = {}) => pageFor(kind, params, cards).html;
  async function show(body, ctx) {
    const params = ctx.params || {};
    const key = kind === 'best' ? 'best:' : kind in HUBS || kind === 'card' ? `${kind}:${params.slug || ''}` : `${kind}:`;
    const have = body.firstElementChild?.dataset?.key;
    const cards = await databaseCards();
    if (have !== key) body.innerHTML = render({ params, cards });
    const page = pageFor(kind, params, cards);
    // A page reached by a click inside the app: give it its own title and
    // canonical, the same ones the file carries.
    if (page.title) {
      document.title = page.title;
      document.querySelector('meta[name="description"]')?.setAttribute('content', page.desc);
      document.querySelector('link[rel="canonical"]')?.setAttribute('href', `${SITE.origin}/${page.path}`);
    }
    if (kind === 'card') wirePrices(body);
  }
  return { render, show };
}
