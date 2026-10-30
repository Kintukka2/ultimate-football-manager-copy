// Saved data: the site's compatibility contract (VERSIONING.md). These run
// against a stand-in localStorage, because a migration that throws or skips
// fails silently in a browser: the page just looks brand new.

import test from 'node:test';
import assert from 'node:assert/strict';

class Storage {
  constructor(init = {}) { this.m = new Map(Object.entries(init)); }
  get length() { return this.m.size; }
  key(i) { return [...this.m.keys()][i] ?? null; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
}
const fresh = (init) => { globalThis.localStorage = new Storage(init); return globalThis.localStorage; };

const util = await import('../site/js/lib/util.js');
const { load, save, migrateStorage, exportBackup, readBackup, restoreBackup, SCHEMA, BACKUP_FORMAT } = util;
const P = 'ufmwiz:v1:';

test('data saved by 0.1.0, before the schema key existed, still loads', () => {
  const ls = fresh({ [P + 'mycards']: JSON.stringify([{ id: 'a', name: 'Test Striker', ovr: 80, pos: ['ST'] }]), [P + 'wl:plan']: '{"qp":20}' });
  assert.equal(migrateStorage(), SCHEMA);
  assert.equal(load('mycards', [])[0].name, 'Test Striker');
  assert.equal(load('wl:plan', {}).qp, 20);
  assert.equal(ls.getItem(P + '_schema'), String(SCHEMA), 'the schema is recorded once there is data');
});

test('a browser with nothing saved gets no schema key until it saves', () => {
  const ls = fresh();
  migrateStorage();
  assert.equal(ls.getItem(P + '_schema'), null);
  save('packs:calc', { chance: '2.5' });
  assert.equal(ls.getItem(P + '_schema'), String(SCHEMA));
});

test('a migration step runs once, in order, and records where it got to', () => {
  const ls = fresh({ [P + 'squads']: '[{"f":8}]', [P + '_schema']: '1' });
  const ran = [];
  const steps = [
    { to: 3, run(s) { ran.push(3); s.set('squads', s.get('squads').map((q) => ({ ...q, three: true }))); } },
    { to: 2, run(s) { ran.push(2); s.set('squads', s.get('squads').map((q) => ({ formationId: q.f }))); } },
  ];
  assert.equal(migrateStorage({ steps, target: 3 }), 3);
  assert.deepEqual(ran, [2, 3]);
  assert.deepEqual(JSON.parse(ls.getItem(P + 'squads')), [{ formationId: 8, three: true }]);
  assert.equal(ls.getItem(P + '_schema'), '3');
  migrateStorage({ steps, target: 3 });
  assert.deepEqual(ran, [2, 3], 'and does not run again');
});

test('a step that throws leaves the data where the last good step put it', () => {
  const ls = fresh({ [P + 'ptc']: '[]', [P + '_schema']: '1' });
  const warn = console.warn; console.warn = () => {};
  try {
    const steps = [{ to: 2, run(s) { s.set('ptc', [{ ok: 1 }]); } }, { to: 3, run() { throw new Error('bad step'); } }];
    assert.equal(migrateStorage({ steps, target: 3 }), null);
  } finally { console.warn = warn; }
  assert.equal(ls.getItem(P + '_schema'), '2', 'the next load retries from 2, not 1');
  assert.equal(ls.getItem(P + 'ptc'), '[{"ok":1}]');
});

test('data from a newer schema than this code knows is left alone', () => {
  const ls = fresh({ [P + 'ptc']: '"future"', [P + '_schema']: '9' });
  assert.equal(migrateStorage({ steps: [{ to: 2, run(s) { s.set('ptc', 'clobbered'); } }], target: 2 }), 9);
  assert.equal(ls.getItem(P + 'ptc'), '"future"');
});

test('storage that throws falls back instead of breaking the page', () => {
  globalThis.localStorage = { get length() { throw new Error('blocked'); }, key() { throw new Error('blocked'); }, getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() {} };
  assert.deepEqual(load('mycards', []), []);
  assert.equal(save('mycards', []), false);
  assert.deepEqual(exportBackup('0.2.0').data, {});
});

test('a backup carries every key and restores through the migrations', () => {
  fresh({ [P + 'mycards']: '[1,2]', [P + 'squads:active']: '2', other: 'not ours' });
  const b = exportBackup('0.2.0');
  assert.equal(b.format, BACKUP_FORMAT);
  assert.deepEqual(Object.keys(b.data).sort(), ['mycards', 'squads:active']);
  const ls = fresh({ [P + 'mycards']: '[9]', [P + 'ptc']: '[]', other: 'kept' });
  const info = restoreBackup(JSON.parse(JSON.stringify(b)));
  assert.deepEqual(info.keys.sort(), ['mycards', 'squads:active']);
  assert.equal(ls.getItem(P + 'mycards'), '[1,2]');
  assert.equal(ls.getItem(P + 'ptc'), null, 'a restore replaces, it does not merge');
  assert.equal(ls.getItem('other'), 'kept', 'nothing outside our namespace is touched');
  assert.throws(() => readBackup({ format: 'something-else', data: {} }), /not a UFMWiz backup/);
  assert.throws(() => readBackup({ format: BACKUP_FORMAT, schema: SCHEMA + 1, data: {} }), /newer version/);
});
