# Changelog

All notable changes to UFMWiz are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Version numbers follow [VERSIONING.md](VERSIONING.md); read that before cutting
a release.

## [Unreleased]

## [0.2.0] - Unreleased

### Added

- **Works offline, and installs to a home screen.** A service worker keeps the
  whole site, every tool, post and icon, for the release you have. A new
  release replaces it the next time you open the site, and the last one's copy
  is deleted, so nobody is left on old code.
- **Help on every tool page.** A "?" in the corner answers the questions each
  page raises, in the game's own words, and "Show me around" walks through the
  page one piece at a time.
- **No paragraph ends on one word alone**, on any page, at any width.

### Changed

- **Saved data has a schema version.** Everything the site keeps in your
  browser is now recorded with the shape it was saved in, so a later release
  can move it forward instead of losing it. Nothing you saved under 0.1.0
  changes or has to be re-entered.

## [0.1.0] - 2026-10-30

### Added

- **The UFMWiz site**: Home, the PTC Solver, Players (the card database and
  My cards, with CSV import and export), the Squad Builder (the 19 formations,
  Chemistry per starter, team OVR, four lineups), Packs (sizes and an odds
  calculator), the Weekend League planner, Events, the Blog with three guides,
  and About.
- Everything you enter is kept in your browser and nowhere else.
