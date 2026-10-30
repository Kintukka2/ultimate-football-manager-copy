// Drawing the game's objects: the shirt card, the OVR hexagon, the rarity chip
// and the dense list row. These are the measured half of the system, so they
// only ever show the game's own data.

import { esc } from '../lib/util.js';
import { statsFor } from '../data/football.js';
import { rarity as rarityOf, quality as qualityOf } from '../data/rarities.js';

// Relative luminance, to pick the numerals: light fills take dark, dark take white.
export function lum(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function shade(hex, k) {
  const n = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const m = n.map((c) => Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k)));
  return '#' + m.map((c) => c.toString(16).padStart(2, '0')).join('');
}

// The chip pair for a card: its special rarity's, else its quality's.
export function chipFor(card) {
  const r = rarityOf(card.rarity);
  const c = r.fill ? r : qualityOf(card.quality);
  return { fill: c.fill, rim: c.rim, ink: lum(c.fill) > 0.4 ? '#1B1609' : '#FFFFFF', name: (r.fill ? r : qualityOf(card.quality)).name };
}

export function hexchip(value, card, cls = '') {
  const c = card ? chipFor(card) : { fill: '#E6D687', rim: '#D8BA68', ink: '#1B1609' };
  return `<span class="hexchip ${cls}" style="--fill:${c.fill};--rim:${c.rim};--chip-ink:${c.ink}"><i>${esc(value)}</i></span>`;
}

// A rarity chip with its name, for filters, legends and rows.
export function rarityChip(id, label = true) {
  const r = rarityOf(id);
  if (!r.fill) return label ? '<span class="rchip rchip--none">Normal</span>' : '';
  const ink = lum(r.fill) > 0.4 ? '#1B1609' : '#FFFFFF';
  return `<span class="rchip" style="--fill:${r.fill};--rim:${r.rim};--chip-ink:${ink}" title="${esc(r.name)}"><i></i>${label ? esc(r.name) : ''}</span>`;
}

const SILHOUETTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4.3"/><path d="M3.4 22.5c0-5.2 3.9-8.4 8.6-8.4s8.6 3.2 8.6 8.4z"/></svg>';

function metal(card) {
  const r = rarityOf(card.rarity);
  if (card.rarity === 'new-season') return { cls: 'ucard--season', style: '' };
  if (r.fill) {
    const ink = lum(r.fill) > 0.4 ? 'var(--ufm-ink-card)' : '#FFFFFF';
    const m = `linear-gradient(-8deg, transparent 0 64%, ${r.rim} 64% 66.5%, transparent 66.5% 70%, ${r.rim} 70% 71.5%, transparent 71.5%), linear-gradient(172deg, ${shade(r.fill, 0.18)} 0%, ${r.fill} 48%, ${shade(r.fill, -0.35)} 100%)`;
    return { cls: 'ucard--special', style: `--m:${m};--rim:${r.rim};--cink:${ink}` };
  }
  const q = qualityOf(card.quality).metal;
  return { cls: q === 'gold' ? '' : `ucard--${q}`, style: '' };
}

// The shirt card. Stats run two columns, PAC DRB / SHO DEF / PAS PHY.
export function shirtCard(card, { label = '' } = {}) {
  if (!card) {
    return `<div class="ucard ucard--empty"><div class="ucard__face">${SILHOUETTE}<em>${esc(label || 'Select player')}</em></div></div>`;
  }
  const { cls, style } = metal(card);
  const defs = statsFor(card.pos[0]);
  const order = [0, 3, 1, 4, 2, 5].map((i) => defs[i]);
  const stats = order.map((s) => `<span><em>${s.label}</em>${card.stats?.[s.key] ?? '–'}</span>`).join('');
  return `<div class="ucard ${cls}" style="${style}"><div class="ucard__face">`
    + `<div class="ucard__ovr"><b>${card.ovr}</b><span>${esc(card.pos[0])}</span></div>`
    + `<div class="ucard__name">${esc(shortName(card.name))}</div>`
    + `<div class="ucard__stats">${stats}</div></div></div>`;
}

// Cards print a surname: "Erling Haaland" -> "Haaland". A particle stays with
// it ("Virgil van Dijk" -> "van Dijk"), and so does a short last word.
const PARTICLES = new Set(['van', 'de', 'da', 'das', 'do', 'dos', 'di', 'del', 'della', 'der', 'den', 'le', 'la', 'ter', 'ten', 'von', 'el', 'al', 'bin', 'mac']);
export function shortName(name) {
  const parts = String(name).trim().split(/\s+/);
  if (parts.length < 2) return name;
  let i = parts.length - 1;
  while (i > 0 && PARTICLES.has(parts[i - 1].toLowerCase())) i--;
  if (i === parts.length - 1 && parts[i].length <= 3) i--;
  return parts.slice(i).join(' ');
}

// A plain two-colour shield for a club. We don't draw real crests; the
// colours are picked from the name, so a club always gets the same pair.
const KITS = [['#C8102E', '#FFFFFF'], ['#6CABDD', '#FFFFFF'], ['#034694', '#FFFFFF'], ['#FDE100', '#000000'], ['#A50044', '#004D98'],
  ['#FFFFFF', '#00529F'], ['#EF0107', '#FFFFFF'], ['#000000', '#FFFFFF'], ['#00A650', '#FFFFFF'], ['#FB090B', '#000000'],
  ['#132257', '#FFFFFF'], ['#7A263A', '#1BB1E7'], ['#E30613', '#FFF200'], ['#004170', '#DA291C'], ['#005CA9', '#FFFFFF']];
export function crest(club) {
  let h = 0;
  for (const ch of String(club || '?')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [c1, c2] = KITS[h % KITS.length];
  return `<span class="lrow__crest" style="--c1:${c1};--c2:${c2}" aria-hidden="true"></span>`;
}

// The standings row: crest, club over name, OVR hex, position, three stats.
export function cardRow(card, { on = false, attrs = '' } = {}) {
  const defs = statsFor(card.pos[0]).slice(0, 3);
  const stats = defs.map((s) => `<span class="lstat"><span>${s.label}</span><b>${card.stats?.[s.key] ?? '–'}</b></span>`).join('');
  return `<div class="lrow${on ? ' is-on' : ''}" ${attrs}>${crest(card.club)}`
    + `<span class="lrow__name"><small>${esc(card.club || card.nation || '—')}</small><b>${esc(card.name)}</b></span>`
    + `${hexchip(card.ovr, card)}<span class="lrow__pos">${esc(card.pos[0])}</span>${stats}</div>`;
}
