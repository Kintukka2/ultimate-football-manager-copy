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
//
// The saved data is the site's compatibility contract (VERSIONING.md): a
// release that can't carry it forward is a MAJOR one. So the shape has a
// version of its own, SCHEMA, kept under one meta key beside the data, and
// every change to the shape ships as a step in MIGRATIONS rather than as a new
// namespace. The `v1` in the prefix is the namespace, not the schema, and it
// never changes: renaming it would orphan everything people have saved.
const PREFIX = 'ufmwiz:v1:';
const META = PREFIX + '_schema';
export const SCHEMA = 1;

// One entry per schema step, oldest first: { to, run(store) }. `run` moves
// the data from schema to - 1 up to `to`, through the small store below, and
// must be safe on data that never had the field it changes.
export const MIGRATIONS = [];

function rawStore() {
  return {
    keys() {
      const out = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX) && k !== META) out.push(k.slice(PREFIX.length));
      }
      return out;
    },
    get(key) {
      const raw = localStorage.getItem(PREFIX + key);
      return raw == null ? undefined : JSON.parse(raw);
    },
    set(key, value) { localStorage.setItem(PREFIX + key, JSON.stringify(value)); },
    remove(key) { localStorage.removeItem(PREFIX + key); },
  };
}

// The schema the saved data is at. No meta key means one of two things: a
// browser that has never saved anything (nothing to move), or data written
// by 0.1.0, which predates the key and is schema 1.
function storedSchema() {
  const raw = localStorage.getItem(META);
  const n = raw == null ? 1 : Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

// Brings saved data up to SCHEMA. Runs once per page, before the first read,
// and is safe to run again. A step that throws stops the climb where it is,
// so nothing is marked as migrated that wasn't, and the next load retries.
// Data from a newer schema than this code knows (an old cached copy of the
// site opened after a newer one) is left exactly as it is.
let migrated = false;
export function migrateStorage({ steps = MIGRATIONS, target = SCHEMA } = {}) {
  migrated = true;
  if (typeof localStorage === 'undefined') return null; // the build, in Node
  try {
    let at = storedSchema();
    if (at >= target) {
      if (localStorage.getItem(META) == null && rawStore().keys().length) localStorage.setItem(META, String(at));
      return at;
    }
    const store = rawStore();
    for (const step of steps.filter((s) => s.to > at && s.to <= target).sort((a, b) => a.to - b.to)) {
      step.run(store);
      at = step.to;
      localStorage.setItem(META, String(at));
    }
    return at;
  } catch (e) {
    console.warn('UFMWiz: saved data could not be brought up to date; it was left as it is.', e);
    return null;
  }
}

export function load(key, fallback) {
  try {
    if (!migrated) migrateStorage();
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch { return fallback; }
}
export function save(key, value) {
  try {
    if (!migrated) migrateStorage();
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    if (localStorage.getItem(META) == null) localStorage.setItem(META, String(SCHEMA));
    return true;
  } catch { return false; }
}

// ---- backup: everything this browser keeps, in one file --------------------
// Storage is per device and per browser, and clearing site data wipes it. So
// a backup holds every key at once, with the schema it was written at, and a
// restore migrates it forward the same way a page load does.
export const BACKUP_FORMAT = 'ufmwiz-backup';

export function exportBackup(appVersion = '') {
  const data = {};
  try {
    const store = rawStore();
    for (const k of store.keys()) {
      try { data[k] = store.get(k); } catch { /* one unreadable key is skipped, not fatal */ }
    }
  } catch { /* no storage: an empty backup */ }
  return { format: BACKUP_FORMAT, formatVersion: 1, schema: SCHEMA, appVersion, exportedAt: new Date().toISOString(), data };
}

// Reads a backup without applying it, so a dialog can say what it holds first.
export function readBackup(bundle) {
  if (!bundle || bundle.format !== BACKUP_FORMAT || typeof bundle.data !== 'object' || bundle.data === null) {
    throw new Error('That file is not a UFMWiz backup.');
  }
  if (Number(bundle.schema) > SCHEMA) throw new Error('That backup comes from a newer version of UFMWiz. Reload the site and try again.');
  return { keys: Object.keys(bundle.data), schema: Number(bundle.schema) || 1, exportedAt: bundle.exportedAt || null };
}

// Replaces what this browser keeps with the backup, then migrates it.
export function restoreBackup(bundle, { steps = MIGRATIONS, target = SCHEMA } = {}) {
  const info = readBackup(bundle);
  const store = rawStore();
  for (const k of store.keys()) store.remove(k);
  for (const k of info.keys) store.set(k, bundle.data[k]);
  localStorage.setItem(META, String(info.schema));
  migrateStorage({ steps, target });
  return info;
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
