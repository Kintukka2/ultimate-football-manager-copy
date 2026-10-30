// One post. The header is the game's band like every page; the body is
// prose, and any board figure goes straight after the answer.

import { esc, dayYear } from '../lib/util.js';
import { POSTS } from '../data/posts.js';
import * as board from '../lib/board.js';

export function render({ params = {} } = {}) {
  const p = POSTS.find((x) => x.slug === params.slug);
  if (!p) {
    return `<header class="pagehead"><div class="wrap pagehead__in"><h1>Not found</h1><p>That post isn't on the board</p></div></header>
      <div class="wrap view__pad"><p class="soft">It may have moved. <a href="blog/">Every guide is on the blog ›</a></p></div>`;
  }
  const fig = p.figure && board[p.figure] ? `<figure class="boardfig">${board[p.figure]()}<figcaption>${esc(p.figureCaption || '')}</figcaption></figure>` : '';
  const html = fig ? p.html.replace('</p>', `</p>${fig}`) : p.html;
  return `<header class="pagehead"><div class="wrap pagehead__in"><h1>${esc(p.title)}</h1><p>${esc(p.dek)}</p></div></header>
    <article class="wrap view__pad">
      <p class="crumbs"><a href="blog/">Blog</a> · ${esc(p.series)}</p>
      <div class="prose">
        <p class="meta">${dayYear(p.date)} · checked on game version ${esc(p.version)}</p>
        ${html}
      </div>
    </article>`;
}

export function show(body, ctx) {
  body.innerHTML = render(ctx);
}
