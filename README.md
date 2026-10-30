# ultimate-football-manager-copy

**UFMWiz**, a companion site for Gamebasics' *Ultimate Football Manager 27* and a sibling of FHCWiz: the site itself, and the research and design notes behind it.

## The site
`site/` is the whole website, ready to deploy as static files (Cloudflare Pages, Netlify or any web server). There is no framework and nothing to install.

| Address | Page |
|---|---|
| `/` | Home: the tools, this week's events, the blog |
| `/ufm27/ptc-solver/` | PTC Solver: what a Player Trade Challenge still needs |
| `/ufm27/players/` | Players: the card database, and the cards you own; a page per card, hubs per rarity, club and position, and Best cards |
| `/ufm27/compare/` | Compare: two to four cards, stat by stat |
| `/ufm27/squad-builder/` | Squad Builder: Chemistry and team OVR across the 19 formations |
| `/ufm27/packs/` | Packs: sizes, and what the published odds mean in packs |
| `/ufm27/weekend-league/` | Weekend League: QP to qualify, then the wins each rank needs |
| `/ufm27/events/` | Events: what is live and what ends first |
| `/blog/`, `/about/` | Guides, and what the site is and keeps |

```
npm run build   # write every page (and the service worker's precache) from routes, posts, cards and views
npm run cards   # turn data/ufm27-extraction.csv into site/data/cards.json and the pending list
npm test        # engines, formations, generated pages and links, storage, voice, offline
npm run check   # everything CI runs, including the browser check at 390 and 1280
npm run serve   # http://localhost:8080
```

Working agreements for changes are in [CLAUDE.md](CLAUDE.md), release rules in [VERSIONING.md](VERSIONING.md), the reader-facing voice in [docs/voice.md](docs/voice.md), and how card data is collected in [docs/data/](docs/data/).

How it is put together:
- Every address is a real HTML file written by `tools/build.mjs`, with the page already rendered for crawlers and a `<base>` that points back to the root. `site/js/app.js` then takes over and swaps views in place.
- `site/css/tokens.css` is `brand/ufmwiz-tokens.css` (a test keeps them equal), and `site/css/ufm.css` holds the Visual System's own component CSS on those tokens.
- The game's rules the tools count with live in `site/js/data/game.js`, each marked as printed by the game or reported by players.
- Cards, squads and challenges are saved in the visitor's browser and nowhere else. The card database, `site/data/cards.json`, ships empty: no ratings were taken from the game, so it fills from cards players can see and submit.

## Research
- [docs/UFM27-analysis.md](docs/UFM27-analysis.md): a complete analysis of Ultimate Football Manager 27. It covers the history, company, tech stack, every gameplay system, the economy, live-ops, reception, a strategy guide and a rebuild blueprint.

## Brand
- [brand/UFMWiz_Visual_System.html](brand/UFMWiz_Visual_System.html): the visual system. The game's look is measured from screenshots and from the values authored into the 27.4.0 build: grounds, seven colour ramps, the shipped fonts and their free substitutes, textures, components, the 52-rarity chip palette, UFMWiz's own tactics-board language (the W of the WM, six marks, the bib), rules and limits.
- [brand/UFMWiz_Brand_Book.html](brand/UFMWiz_Brand_Book.html): positioning, name and family architecture, voice, the game's vocabulary, number formats, editorial series, launch assets and legal.
- [brand/ufmwiz-tokens.css](brand/ufmwiz-tokens.css): the design tokens as CSS custom properties.
- [brand/reference/MEASUREMENTS.md](brand/reference/MEASUREMENTS.md): every raw value behind the tokens, with its source and method.
- [brand/reference/SCREENSHOTS.md](brand/reference/SCREENSHOTS.md): 265 unique screenshots of the game (UFM 25, 26 and 27), kept for internal design reference only.

Open the two HTML files in a browser. They need an internet connection only for Google Fonts.
