# Working agreements

Standing instructions for Claude Code on this repository. The rules that govern
the *product* live in `VERSIONING.md`, `docs/voice.md`, the Brand Book
(`brand/UFMWiz_Brand_Book.html`) and the Visual System
(`brand/UFMWiz_Visual_System.html`). This file points at them rather than
restating them, because a rule written down twice is a rule that will disagree
with itself.

## Reporting back

**Give the pull request URL, in full, every time a pull request is ready to
merge.** Not the number, not "the PR": the address, on its own line, so it can
be tapped from a phone. That includes the first time it opens and every later
point at which it becomes mergeable again: after CI turns green, after a fix is
pushed, after a conflict is resolved.

State the version and the tag to put on the merge commit alongside it.

## Branch and release

- When a pull request merges, restart the working branch from the merged
  default branch before starting the next piece of work. Never stack new work
  on merged history.
- Any change under `site/js/` or `site/css/` needs a version bump
  (`SITE.version` in `site/js/data/routes.js`). `VERSIONING.md` has the rules,
  the release steps, and the three records that must agree. CI fails a pull
  request that forgets.
- Work that has not merged yet can keep growing inside its own unreleased
  version rather than taking a new one.
- Every page is generated. Edit routes, posts and views, then run
  `node tools/build.mjs`; never edit a page under `site/` by hand.

## Data

- Card data comes only from what players can see in the game: entered by hand
  or imported from players' CSV submissions. Never take ratings, art or files
  from the game's build or servers, never invent a rating, a stat, a price or a
  date, and never fabricate anything about a real player. Test data uses
  made-up names.
- A rule the tools count with is either printed by the game or reported by
  players, and `site/js/data/game.js` says which. A reported figure is labelled
  "players report" with its month wherever a reader sees it.
- Colours are **measured**, never chosen by eye: the Visual System says how,
  and a rarity's chip pair is never recoloured.

## Design

- **Their data wears gold, our thinking goes on the board.** A surface showing
  the game's numbers uses the measured system (warm black, gold hairline,
  selection as a fill). Our analysis and diagrams go on the tactics board: one
  board per screen, one bib per figure, never a card, an OVR or gold on it.
- Advice inverts: tooltips, help and the tour are white boxes with dark text.
- Hexagons hold a number about a player or a squad, and nothing else.

## Writing

- `docs/voice.md` governs every word a reader sees. It has tripwires behind it
  (`tools/voice-check.mjs`, `tests/voice.test.mjs`). A tripwire that fires
  means rewrite the sentence, not work around the pattern.
- Never name one of our own files in anything a reader sees.
- Never "boss", no exclamation marks, no emoji, no pack hype.

## What the site publishes

`site/` is the whole website and the only folder Cloudflare Pages publishes.
Everything else is the repo's own: the research, the brand documents, the
tools and tests. **`brand/reference/` holds game screenshots kept for internal
design reference only; nothing from it may ever be copied into `site/`, linked
from a page, or used in a post or a social card.** A test fails if a page
references a screenshot.

## Before pushing

Run the full set, not just the tests:

```
node tools/build.mjs           node tools/sw.mjs --check
node --test tests/*.test.mjs   node tools/voice-check.mjs
node tools/browser-check.mjs
```

(`npm run check` runs all five.) After changing the mark, the tokens or the
social card, also run `node tools/make-images.mjs` and look at what it wrote.

Then look at the change in a browser, twice: at 1280 wide and at 390 wide,
which is the phone layout most readers get. `tools/browser-check.mjs` catches
page errors, sideways scrolling and a paragraph ending on one word; it can't
see a header that collapsed, a card that overlaps another or a colour that's
wrong. Anything under `site/js/` or `site/css/` is a phone change whether or
not it was meant as one.
