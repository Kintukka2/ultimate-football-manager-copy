# Versioning policy

UFMWiz follows [Semantic Versioning 2.0.0](https://semver.org/), adapted for a
site rather than a library, the same way FHCWiz does. Read this before cutting
a release.

## `MAJOR.MINOR.PATCH`

SemVer is written for libraries, where "breaking" means breaking a public API.
UFMWiz has no API and nothing outside the repo depends on its code, so that
definition is replaced with one that means something here.

**The compatibility contract is the reader's saved data**, not the code:

- everything under the `ufmwiz:v1:` prefix in `localStorage` (My cards, PTCs,
  lineups, Chemistry thresholds, planner settings), and
- the files the site writes and reads back: the CSV of My cards and the
  backup file (`exportBackup` / `restoreBackup` in `site/js/lib/util.js`).

Function signatures, module shapes and CSS class names are free to change at
any time. That gives these rules.

### MAJOR: saved data will not survive

Bump when an upgrade **cannot** carry what people have saved forward: a schema
change no migration can handle, a backup or CSV format older files can't be
read in, or deliberately dropping saved data. It is about the promise, not the
size: a full redesign that keeps every saved card is MINOR; one field that
can't be migrated is MAJOR.

**Write a migration rather than bump MAJOR.** That is what `MIGRATIONS` in
`site/js/lib/util.js` is for.

### MINOR: something new, data intact

A new tool, page, post, rarity, event or card data; a visual change; a new
saved field that a migration fills in for older data.

### PATCH: corrections only

A wrong number fixed, a typo, a layout fault, a bug, with nothing new added.

## While in `0.x`

The site is pre-1.0 while its data has not settled (the card database ships
empty). The same rules apply: in 0.x a MINOR may also carry a data change, as
long as a migration carries the saved data with it. 1.0.0 is cut when the
card database opens and the saved-data shapes are ones we're prepared to keep.

## Where the version lives

The single source of truth is `SITE.version` in `site/js/data/routes.js`.

From it, and never by hand:

- every page's local asset URLs carry it (`css/site.css?v=0.2.0`), written by
  `tools/build.mjs` on every page it builds;
- the service worker's cache name and precache list carry it, written by
  `tools/sw.mjs` into `site/sw.js`.

> **Any change under `site/js/` or `site/css/` needs a version bump before it
> ships.** Not just a feature: a one-line fix too. The service worker serves a
> stamped stylesheet or script from its cache until the version changes, so
> changed code under an unchanged version reaches new visitors and not the ones
> who have been before, with nothing to tell the two apart. CI fails a pull
> request that changes either folder without changing the version.

Three things must agree at all times:

1. `SITE.version`
2. the newest released heading in `CHANGELOG.md`
3. the git tag

If they disagree, the git tag wins: it is the only one that is immutable.

## Tags

`vX.Y.Z`, matching the changelog heading exactly. Releases are published from
the repository's **Releases** page, which creates the tag:

- **Tag name**: `vX.Y.Z`, the newest changelog heading.
- **Target**: the merge commit of the release's pull request.
- **Date**: the day of the merge, not the day the branch started.
- **Notes**: written for players. What changed on the site, and anything they
  need to know about their saved data. The changelog is the detailed record.

**Never move or delete a published tag.** Supersede it with a new version.

## The storage schema is separate

The `v1` in `ufmwiz:v1:` is the namespace, **not** the app version and not the
schema. It never changes: renaming it would silently orphan everything people
have saved. The schema has its own number, `SCHEMA` in `site/js/lib/util.js`,
recorded in the browser under `ufmwiz:v1:_schema`.

To change the shape of saved data:

1. Bump `SCHEMA`.
2. Add a step to `MIGRATIONS` (`{ to, run(store) }`) that moves data from the
   schema before it, and is safe on data that never had the field it changes.
3. Add a case to `tests/store.test.mjs` with data in the old shape.

A step that throws stops the climb where it is, so the next page load retries,
and data from a newer schema than the code knows is left alone.

## Release checklist

1. Run the full set and see it green (CI runs the same on every push):
   ```sh
   npm run check
   ```
2. Decide the bump with the rules above.
3. Update `SITE.version` in `site/js/data/routes.js`.
4. Rebuild, so every page, the sitemap and the service worker carry it:
   ```sh
   node tools/build.mjs
   ```
5. In `CHANGELOG.md`, retitle `[Unreleased]` to the new version and date, and
   open a fresh `[Unreleased]` above it.
6. Push the branch, open a pull request, merge it once CI is green.
7. Publish the release: **Releases** → *Draft a new release* → tag `vX.Y.Z`,
   target the merge commit, notes for players. Publishing also runs
   `.github/workflows/indexnow.yml`, which waits for the live site to carry the
   new version and then sends every sitemap page to IndexNow. If a change goes
   out without a release, run that workflow from the Actions tab.
8. Check the three records agree.

## Changelog discipline

Group entries under `Added`, `Changed`, `Fixed`, `Removed`, `Deprecated` and
`Security`, per [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Write for the person deciding whether to upgrade: what changed for them and why
it mattered. Anything touching saved data is called out in its entry, every
time.
