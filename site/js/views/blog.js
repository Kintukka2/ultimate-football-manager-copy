// Blog: every post as a hub tile with the brush corner, the series in the
// band, a gold hairline. Never a screenshot.

import { esc, dayYear } from '../lib/util.js';
import { POSTS } from '../data/posts.js';

export function render() {
  const tiles = POSTS.map((p) => `<a class="ptile" href="blog/${p.slug}/">
      <span class="ptile__band">${esc(p.series)}</span>
      <b>${esc(p.title)}</b>
      <span class="ptile__dek">${esc(p.dek)}</span>
      <small>${dayYear(p.date)} · game version ${esc(p.version)}</small>
    </a>`).join('');
  return `<div class="wrap"><div class="ptiles">${tiles}</div></div>`;
}

export function mount(body) { body.innerHTML = render(); }
