// The page for any address that isn't one.

import { ROUTES } from '../data/routes.js';

export function render() {
  const links = ROUTES.filter((r) => r.nav).map((r) => `<a class="btn btn--olive btn--sm" href="${r.path || './'}">${r.nav}</a>`).join('');
  return `<div class="wrap"><p class="soft">Nothing lives at this address. It may have moved when the site did; everything that exists is one of these.</p><div class="row">${links}</div></div>`;
}

export function mount(body) { body.innerHTML = render(); }
