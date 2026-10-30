// The dialog, assembled from the panel anatomy: band header, black body, band
// footer, one gold hairline. Cancel is olive; a commit that earns something is
// foil. And the toast, which is advice, so it inverts: a white box.

import { esc } from '../lib/util.js';

// openDialog resolves with the value of the action pressed, or null when the
// dialog is dismissed. onMount(el, close) wires anything inside the body.
export function openDialog({ title, sub = '', body = '', actions = [], wide = false, onMount } = {}) {
  return new Promise((resolve) => {
    const d = document.createElement('dialog');
    d.className = 'modal' + (wide ? ' modal--wide' : '');
    d.setAttribute('aria-label', title);
    d.innerHTML = `<div class="modal__head"><h2>${esc(title)}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</div>`
      + '<button class="iconbtn modal__x" type="button" data-close aria-label="Close">&times;</button>'
      + `<div class="modal__body">${body}</div>`
      + (actions.length ? `<div class="modal__foot">${actions.map((a) =>
        `<button type="button" class="btn btn--sm ${a.kind ? 'btn--' + a.kind : ''}" data-value="${esc(a.value)}"${a.manual ? ' data-manual' : ''}${a.disabled ? ' disabled' : ''}>${esc(a.label)}</button>`).join('')}</div>` : '');
    let done = false;
    const close = (value = null) => {
      if (done) return;
      done = true;
      d.close();
      d.remove();
      resolve(value);
    };
    d.addEventListener('click', (e) => {
      if (e.target === d) return close(null); // the backdrop
      const b = e.target.closest('[data-value],[data-close]');
      if (!b || !d.contains(b)) return;
      if (b.hasAttribute('data-close')) return close(null);
      if (b.dataset.manual === undefined) close(b.dataset.value);
    });
    d.addEventListener('cancel', (e) => { e.preventDefault(); close(null); });
    document.body.appendChild(d);
    d.showModal();
    if (onMount) onMount(d, close);
  });
}

export function confirmDialog({ title, sub = '', message, detail = '', ok = 'Confirm', okKind = '', cancel = 'Cancel' }) {
  return openDialog({
    title, sub,
    body: `<div class="modal__msg">${esc(message)}${detail ? `<span>${esc(detail)}</span>` : ''}</div>`,
    actions: [{ label: cancel, kind: 'olive', value: 'cancel' }, { label: ok, kind: okKind, value: 'ok' }],
  }).then((v) => v === 'ok');
}

let toastTimer = 0;
export function toast(message) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
  }
  t.textContent = message;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}
