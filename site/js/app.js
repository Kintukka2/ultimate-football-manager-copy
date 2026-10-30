// The app: every page on the site is a real HTML file (tools/build.mjs writes
// them, with the page already rendered), and this script takes over from there.
// A click on an internal link swaps the view in place and records the address;
// a modified click still opens a new tab, and a crawler just follows the href.

import { ROUTES, SITE, SHEET, match, byId } from './data/routes.js';
import { POSTS } from './data/posts.js';
import { $, $$, esc } from './lib/util.js';
import { setHelpTab } from './ui/help.js';

const base = new URL(document.baseURI);
const mounted = new Map();

const rel = (url) => {
  const u = new URL(url, base);
  if (u.origin !== base.origin || !u.pathname.startsWith(base.pathname)) return null;
  return u.pathname.slice(base.pathname.length);
};

function meta(route, params) {
  let title = route.title, desc = route.desc;
  if (route.id === 'post') {
    const p = POSTS.find((x) => x.slug === params.slug);
    if (p) { title = `${p.title} | UFMWiz`; desc = p.dek; }
  }
  if (title) document.title = title;
  if (desc) $('meta[name="description"]')?.setAttribute('content', desc);
  const path = (route.path || '').replace(/:([a-z]+)/g, (_, k) => params[k] ?? '');
  $('link[rel="canonical"]')?.setAttribute('href', `${SITE.origin}/${path}`);
}

function markNav(route) {
  const id = route.parent || route.id;
  $$('[data-nav]').forEach((a) => {
    if (a.dataset.nav === id) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  const more = $('#btnMore');
  if (more && SHEET.includes(id)) more.setAttribute('aria-current', 'page');
  else more?.removeAttribute('aria-current');
}

async function show(found, { scroll = true } = {}) {
  const { route, params } = found;
  const viewId = route.id;
  document.body.dataset.route = viewId;
  $$('.view').forEach((v) => { v.hidden = v.dataset.view !== viewId; });
  meta(route, params);
  markNav(route);
  closeSheet();
  setHelpTab(viewId);
  if (scroll) window.scrollTo(0, 0);
  const el = $(`#view-${viewId}`);
  if (!el) return;
  const body = $('.view__body', el);
  const ctx = { route, params, el, body, navigate };
  try {
    const mod = await import(`./views/${viewId}.js`);
    if (!mounted.has(viewId)) { mounted.set(viewId, mod); mod.mount?.(body, ctx); }
    mod.show?.(body, ctx);
  } catch (err) {
    console.error(err);
    body.insertAdjacentHTML('afterbegin', `<p class="advice">Something on this page didn't load. Reload to try again. <span class="muted">${esc(err.message)}</span></p>`);
  }
}

export function navigate(path, { replace = false } = {}) {
  const url = new URL(path, base);
  const found = match(rel(url) ?? '');
  if (!found) { location.href = url.href; return; }
  history[replace ? 'replaceState' : 'pushState']({}, '', url);
  show(found);
}

document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest('a[href]');
  if (!a || a.target || a.hasAttribute('download')) return;
  const r = rel(a.href);
  if (r === null || new URL(a.href).hash && r === rel(location.href)) return;
  const found = match(r);
  if (!found) return;
  e.preventDefault();
  if (r === rel(location.href)) { closeSheet(); window.scrollTo(0, 0); return; }
  history.pushState({}, '', new URL(a.href));
  show(found);
});
window.addEventListener('popstate', () => {
  const found = match(rel(location.href) ?? '');
  if (found) show(found, { scroll: false });
});

// ---- the phone's More sheet -------------------------------------------------
function closeSheet() {
  const s = $('#moreSheet');
  if (!s || s.hidden) return;
  s.hidden = true;
  $('#moreScrim').hidden = true;
  $('#btnMore').setAttribute('aria-expanded', 'false');
}
$('#btnMore')?.addEventListener('click', () => {
  const s = $('#moreSheet');
  const open = s.hidden;
  s.hidden = !open;
  $('#moreScrim').hidden = !open;
  $('#btnMore').setAttribute('aria-expanded', String(open));
});
$('#moreScrim')?.addEventListener('click', closeSheet);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

// ---- no paragraph ends on one word -----------------------------------------
// A word alone on the last line of a paragraph reads as a mistake, and the
// copy is too varied (views, posts, live numbers) to bind by hand. So the last
// two words of every prose block on the page are bound with a no-break space,
// whatever drew them, and again whenever a view redraws. Short strings are
// labels, not prose, and a block holding a control is left alone.
const PROSE = 'p, li, figcaption';
function bindLastWords(root) {
  root.querySelectorAll(PROSE).forEach((el) => {
    if (el.querySelector('input, select, textarea, button')) return;
    const text = el.textContent.trim();
    if (text.split(/\s+/).length < 6) return;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
    // The gap before the last word: skip trailing space, then the word.
    let seenWord = false;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const t = nodes[i].data;
      for (let j = t.length - 1; j >= 0; j--) {
        const ws = /\s/.test(t[j]);
        if (!ws) { seenWord = true; continue; }
        if (!seenWord) continue;
        if (t[j] !== '\u00a0') nodes[i].data = t.slice(0, j) + '\u00a0' + t.slice(j + 1);
        return;
      }
    }
  });
}
let bindQueued = false;
const queueBind = () => {
  if (bindQueued) return;
  bindQueued = true;
  requestAnimationFrame(() => { bindQueued = false; bindLastWords(document.querySelector('.main') || document.body); });
};
// Only added or replaced nodes are watched, never text edits, so binding a
// space can't wake the observer again.
new MutationObserver(queueBind).observe(document.querySelector('.main') || document.body, { childList: true, subtree: true });

// ---- offline ---------------------------------------------------------------
// The worker sits at the site root and controls every page under it. It needs
// a real origin, so a page opened from disk simply runs without it.
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('sw.js', base), { scope: base.pathname }).catch(() => {});
  });
}

// ---- start -----------------------------------------------------------------
const first = match(rel(location.href) ?? '') || { route: byId(document.body.dataset.route) || ROUTES[0], params: {} };
show(first, { scroll: false });
queueBind();
