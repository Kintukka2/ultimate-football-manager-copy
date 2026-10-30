// The tactics board: UFMWiz's own surface, for our analysis only (Visual
// System, Board). Inline SVG on a 100-unit viewBox, six marks, one bib per
// figure, nothing gold and never a number the game owns. The arrowhead markers
// and the mark itself are defined once, in the page's <svg class="defs">.

const PAINT = '#EEF3EC', MARKER = '#FFFFFF', THEM = '#0C1712', BIB = '#FF6B1A';
const f1 = (n) => Math.round(n * 10) / 10;

export function magnet(x, y, kind = 'us', r = 6.5) {
  const fill = { us: MARKER, them: THEM, bib: BIB }[kind];
  const ring = kind === 'them' ? ` stroke="#FFFFFF" stroke-width="${f1(r * 0.3)}"` : '';
  return `<circle cx="${f1(x + r * 0.18)}" cy="${f1(y + r * 0.28)}" r="${f1(r)}" fill="#000" opacity=".4"/>`
    + `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${fill}"${ring}/>`;
}

// An empty slot: a dashed ring in line paint. The slot to fill first wears the bib.
export function slot(x, y, bib = false, r = 4.6) {
  return bib
    ? `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${BIB}" stroke-width="2.4"/>`
    : `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${PAINT}" stroke-width="1.8" stroke-dasharray="3 2.4" opacity=".8"/>`;
}

// A pass (solid) or a run (dashed), in marker, ending in an arrowhead.
export function line(d, kind = 'pass', { head = true, bib = false } = {}) {
  const dash = kind === 'run' ? ' stroke-dasharray="9 6"' : '';
  const mk = head ? ` marker-end="url(#ah${bib ? '-bib' : ''})"` : '';
  return `<path d="${d}" fill="none" stroke="${bib ? BIB : MARKER}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"${dash}${mk}/>`;
}

// Pitch lines: the ground, never the subject. Three per figure at most.
export const paint = (d) => `<path d="${d}" fill="none" stroke="${PAINT}" stroke-width="1.6" opacity=".55"/>`;

export const board = (viewBox, inner, label = '') =>
  `<div class="board"><svg viewBox="${viewBox}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${inner}</svg></div>`;

export const figure = (viewBox, inner, caption, label) =>
  `<figure class="boardfig">${board(viewBox, inner, label)}${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;

// The lockup's mark: the W of the WM, on its own little board.
export const mark = (cls = '') => `<svg class="${cls}" viewBox="0 0 100 88" aria-hidden="true"><use href="#mark-ufm"/></svg>`;
export const wordmark = () => '<span class="wordmark"><i>UFM</i>WIZ</span>';

// ---- figures the site reuses ----------------------------------------------

// The empty squad: dashed rings in a back four, three, three. The bib marks
// the slot to fill first.
export function emptySquad() {
  let s = paint('M50 2 V60') + paint('M100 16 H86 V46 H100') + paint('M0 16 H14 V46 H0');
  s += slot(7, 31);
  for (const y of [10, 24, 38, 52]) s += slot(26, y);
  for (const y of [15, 31, 47]) s += slot(48, y);
  s += slot(72, 12) + slot(72, 50) + slot(76, 31, true);
  s += `<path d="M76 28 V34 M73 31 H79" stroke="${BIB}" stroke-width="1.8" stroke-linecap="round"/>`;
  return board('0 0 100 62', s);
}

// Fifteen Weekend League games: thirteen wins, the one loss you can afford,
// and the bib on the fourteenth win, the one that makes rank 1.
export function fifteenGames() {
  let s = '';
  let k = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      const x = 14 + c * 18, y = 13 + r * 17;
      const kind = k === 9 ? 'them' : k === 14 ? 'bib' : 'us';
      s += magnet(x, y, kind, 5.4);
      k++;
    }
  }
  return board('0 0 100 60', s, 'Fifteen games: fourteen wins and one loss');
}

// A trade-in: five magnets, five passes into one bib. A PTC in one drawing.
export function tradeIn() {
  let s = paint('M64 6 V56');
  const ys = [8, 19.5, 31, 42.5, 54];
  ys.forEach((y) => { s += line(`M20 ${y} L${f1(72 - (31 - y) * 0.15)} ${f1(31 + (y - 31) * 0.35)}`, 'pass', { head: false }); });
  s += line('M70 31 L79 31', 'pass');
  ys.forEach((y) => { s += magnet(14, y, 'us', 5); });
  s += magnet(88, 31, 'bib', 6.5);
  return board('0 0 100 62', s);
}

// The WM: the defence an M in faint paint, the five forwards a W in marker.
export function wm() {
  let s = paint('M4 4 H96 V72 H4 Z') + paint('M4 38 H96') + `<circle cx="50" cy="38" r="8" fill="none" stroke="${PAINT}" stroke-width="1.6" opacity=".55"/>`;
  const M = [[24, 56], [37, 45], [50, 56], [63, 45], [76, 56]];
  const W = [[20, 13], [35, 28], [50, 15], [65, 28], [80, 13]];
  s += `<polyline points="${M.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${PAINT}" stroke-width="2" stroke-dasharray="3 3" opacity=".7"/>`;
  s += `<polyline points="${W.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#FFFFFF" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"/>`;
  s += magnet(50, 67, 'us', 4.4);
  M.forEach(([x, y]) => { s += magnet(x, y, 'us', 4.4); });
  W.forEach(([x, y], i) => { s += magnet(x, y, i === 4 ? 'bib' : 'us', 4.4); });
  return board('0 0 100 76', s, 'The WM formation: the defence makes an M, the five forwards make a W');
}
