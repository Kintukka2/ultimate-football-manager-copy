// Small helpers every view uses: escaping, delegation, storage and the number
// formats from the Brand Book (Numbers).

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

// One listener per view, matched by selector, so re-rendering never leaks.
export function on(root, type, sel, fn) {
  root.addEventListener(type, (e) => {
    const t = e.target.closest(sel);
    if (t && root.contains(t)) fn(e, t);
  });
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

// ---- storage: per-browser conveniences, and the cards you own --------------
// Storage can be missing or throw (private windows, blocked site data), so
// every read falls back and every write is allowed to fail quietly.
const PREFIX = 'ufmwiz:v1:';
export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch { return fallback; }
}
export function save(key, value) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; }
}

// ---- numbers, as a player already reads them -------------------------------
const MINUS = '−';
export const int = (n) => Math.round(n).toLocaleString('en-GB');
export const coins = (n) => int(n);
export const one = (n) => (Math.round(n * 10) / 10).toFixed(1);
export function signed(n, digits = 0) {
  const v = digits ? (Math.round(n * 10 ** digits) / 10 ** digits).toFixed(digits) : String(Math.round(n));
  if (Number(v) === 0) return digits ? (0).toFixed(digits) : '0';
  return (Number(v) > 0 ? '+' : MINUS) + v.replace('-', '');
}
// Odds: the chance first, then 1 in N. 0.025 -> "2.5% (1 in 40)".
export function odds(p) {
  if (!(p > 0)) return '0%';
  if (p >= 1) return '100%';
  const pct = p * 100;
  const s = pct >= 10 ? pct.toFixed(0) : pct >= 1 ? pct.toFixed(1).replace(/\.0$/, '') : pct.toPrecision(2).replace(/\.?0+$/, '');
  // Past even odds, "1 in N" stops meaning anything (72% is not "1 in 1").
  return p > 0.5 ? `${s}%` : `${s}% (1 in ${int(1 / p)})`;
}
export const percent = (p) => `${Math.round(p * 100)}%`;

// Timers in the game's own style: 7H 59M, 12D 17H.
export function timer(ms) {
  const m = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
  return d ? `${d}D ${h}H` : h ? `${h}H ${mm}M` : `${mm}M`;
}
// Timers in prose: "7 h 59 m".
export function hours(h) {
  const whole = Math.floor(h), m = Math.round((h - whole) * 60);
  return m ? `${whole} h ${m} m` : `${whole} h`;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// "Sat 31 Oct". Dates in the data are UTC days.
export function day(iso, weekday = true) {
  const d = new Date(iso + 'T00:00:00Z');
  return `${weekday ? DAYS[d.getUTCDay()] + ' ' : ''}${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}
export function dayYear(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
export function monthName(ym) {
  const [y, m] = ym.split('-').map(Number);
  return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1] + ' ' + y;
}
