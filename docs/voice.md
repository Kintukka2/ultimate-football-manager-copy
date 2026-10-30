# UFMWiz: Voice

Every word a reader sees: headings, the gold sentence beside them, labels,
buttons, empty states, dialogs, help answers, the posts. The Brand Book
(`brand/UFMWiz_Brand_Book.html`, Voice, Words and Numbers) is where these come
from; this file turns them into rules a contributor can check a sentence
against, and names the tripwires that catch the ones with a mechanical
signature. The rules that carried over from FHCWiz's voice audit are the ones
that have nothing to do with which game the site is for.

## The teammate who has already done the maths

UFMWiz sounds like a player who knows the rules cold and tells you the answer
first. Short sentences, real numbers, the game's own words. Confident because
it is checked, never because it is loud.

## 1. Answer first

Lead with the number or the decision, then the reason. "You need 14 wins out
of 15" comes before any explanation of points. A post opens with the answer in
one or two sentences (the `answer` paragraph); a tool page opens with the line
that says what is still needed.

## 2. The game's words, spelled the game's way

Players search for what the game prints, so we print it too. The Words table in
the Brand Book is the list; the ones that slip most:

| Write | Never |
|---|---|
| PTC, Player Trade Challenge the first time on a page | SBC, squad building challenge |
| Focus | form, morale |
| Fitness (a player), Energy (a Quick Match) | stamina |
| Chemistry, CHM where space is tight | chem |
| coins (the HUD says Money) | cash, bucks |
| gems | diamonds, rubies |
| Unsellable | untradeable |
| Weekend League, WL | FUT Champions |
| Collection Book | album |

A rarity takes the name on the card ("Matchday", not its internal name), in
full the first time on a page.

## 3. Never "boss", never loud, never hype

- The game's coach calls the player "boss". That is the game's voice. Ours
  says "you".
- No exclamation marks and no emoji. A number that is checked doesn't need
  either.
- We report odds and value. We don't celebrate a pull, and nothing we write
  pushes spending.

## 4. Show the working, and say where a number came from

When a number decides something, show how it was reached in a line or a board
figure, so the reader can check us. A figure the game prints is stated. A
figure that comes from players says so: "players report", with the month
("players report, September 2026"). A rule that can change says when it was
checked, and posts carry the date and the game version at the top.

## 5. Numbers in the formats a player already reads

| Quantity | Format |
|---|---|
| Player OVR | 88 |
| Team OVR | 86.2, always one decimal |
| Chemistry | +3 a player, +2.0 a team |
| Focus | −2 to +2, with a true minus (−, not -) |
| Coins | 21,500 coins: a thousands separator, no symbol |
| Odds | 2.5% (1 in 40): the chance first; past even odds, the chance alone |
| Timers | 7H 59M in the interface, "7 h 59 m" or "about 8 hours" in prose |
| Fitness | 75%, no decimals |
| Dates | Sat 31 Oct, with the weekday when it matters; UTC |

Exact counts live in tiles, tables and the data. Prose rounds, or names the
number once where it does a job, because an exact count in a sentence expires
the day the data grows.

## 6. Say what the reader does and gets

The reader is the subject: "Tap a slot to add a card", not "Slots can be
selected to add cards". A sentence about the tool ("the solver cannot…") is
rewritten as what the reader can do instead. An empty state on a full page goes
on the board with one line of instruction; inside a working panel it is one
muted sentence, and it states the fact rather than apologising for it.

## 7. Don't defend the data, and don't name our files

- Claim a good property once, as a flat fact ("No ratings were taken from the
  game"), and never litigate it. Words like scraped, estimated and guesswork
  defend against an accusation nobody made.
- Never name a file, a path or an extension in anything a reader sees. Say
  what happened, not which file it went into. (Comments and `docs/` are for
  maintainers and may.)
- Don't rank your own points: "honestly", "to be honest", "worth being clear
  about". Cut the phrase and keep the point.

## 8. Interface copy

- Headers follow the game: a one-to-three-word title in caps, and a gold
  sentence beside it that says what the screen is for.
- Buttons are a verb, two words at most: Complete, Add card, Clear all.
  The result names what happened: "Challenge saved".
- Errors say what went wrong and how to fix it: "That lineup has 10 players.
  Add one more to check Chemistry."
- The acronym UFM is set only as the first half of the wordmark. Display type
  (h1 to h3) never carries it; prose names the game as Ultimate Football
  Manager 27, or UFM 27 where players would.
- No paragraph ends with one word alone on its last line. The app binds the
  last two words of every block of prose, and the browser check measures the
  rendered page at both widths.

## 9. House style

- **British spelling**: colour, favourite, grey, analyse, centre, defence.
  Except where the game prints a word its own way: the stat is Defense, the
  tactics tab is Defense.
- **One clause where one will do.** Subject, verb, object.
- **No em-dash asides** in interface copy. A colon or a full stop does the job.
- **Season-aware.** Everything in UFM resets in summer. Date any claim that can
  change, and say when advice expires.

## The tripwires

`tools/voice-check.mjs` reads every built page under `site/` as visible text
(tags, scripts and comments dropped; `title`, `alt`, `aria-label` and
`placeholder` kept), checks the headings on their own for the display-type
rule, and reads the string literals in the modules that write copy at run time
(`site/js/views`, `site/js/ui`, `site/js/data`) with comments dropped. CI runs
it, and `tests/voice.test.mjs` runs it too, after proving that every rule fires
on the Brand Book's own "Don't" examples and stays quiet on its "Do" ones.

It catches the faults with a mechanical signature: the game's words, "boss",
exclamation marks, emoji, pack hype, the true minus, the thousands separator,
our own file names, defending the data, apologising for the tool, ranking our
own points, the spelling and the acronym in display type. **Answering first,
showing the working and saying where a figure came from have no signature.**
Those still need reading.

When a tripwire fires, rewrite the sentence for the reader rather than working
around the pattern. If a word belongs where it is, add the phrase to `ALLOWED`
in `tools/voice-check.mjs` with a comment that says why.
