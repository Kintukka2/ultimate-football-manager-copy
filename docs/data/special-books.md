# The special books

The Collection Books have two kinds of book. The league books, one per league with a set per club, are in [club-leagues.md](club-leagues.md). This file covers the other kind: a special book per rarity, with its sets.

`data/ufm27-special-books.csv` holds each special book's index as the game shows it, one row per set. Each row has:

- `book`: the book as its cover names it;
- `rarity`: the book's rarity, as its id in `site/js/data/rarities.js`;
- `slot`: the set's place in the index;
- `set`: the set's name in the index.

`tests/books.test.mjs` fails if:

- a book's rarity isn't in the rarity list;
- two books share a rarity;
- a book's slots skip a number;
- the count of books changes from 14.

## Read on 6 November 2026

The books were read from a player's screenshots of the Collection Books screen and of each book's index.

- **The Collection Books screen** counts 14 special books. In name order: European Evolutions, Game Changers, Harvest, Matchday, Mavericks, New Season, Player of the Month, PTC, Screamers, Shape Shifters, Super Heroes, Team of the Week, Transfer Stars, Weekend League.
- **Which book is which.** The index doesn't print the book's name, but every set name gives it away. The one exception is PTC, whose sets are Introduction and Tier. It is the only book whose cover showed any progress (15%), and its Introduction set is at 66%.
- **Five books weren't captured.** Harvest, Matchday, Mavericks, New Season and Super Heroes each have one set. The player reported the count but sent no index screenshot, so their row has a slot and no set name.
- **Names.** The index prints every name in capitals, so the capitalisation in the file is ours. The spelling is the game's: the index runs three names together (Europeanevolutions, Gamechangers, Shapeshifters), and the Shape Shifters cover splits its own name in two.
- **The PTC book's Introduction set has a silver ball.** Every other set in the screenshots has a bronze one.

| Book | Rarity | Sets | The sets |
|---|---|---|---|
| European Evolutions | `european-evolutions` | 2 | #1, #2 |
| Game Changers | `game-changers` | 2 | #1, #2 |
| Harvest | `harvest` | 1 | not captured |
| Matchday | `matchday` | 1 | not captured |
| Mavericks | `mavericks` | 1 | not captured |
| New Season | `new-season` | 1 | not captured |
| Player of the Month | `player-of-the-month` | 3 | September, October, November |
| PTC | `ptc` | 2 | Introduction, Tier |
| Screamers | `screamers` | 3 | #1 to #3 |
| Shape Shifters | `shapeshifters` | 2 | #1, #2 |
| Super Heroes | `super-heroes` | 1 | not captured |
| Team of the Week | `team-of-the-week` | 10 | #1 to #10 |
| Transfer Stars | `transfer-stars` | 2 | #1, #2 |
| Weekend League | `weekend-league` | 1 | #1 |

The counts are as of the day read. Numbered and monthly sets, such as Team of the Week's and Player of the Month's, can grow, so read the index again before relying on a count.
