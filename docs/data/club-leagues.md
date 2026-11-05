# Which league each club is in

`data/ufm27-clubs.csv` lists the 626 clubs in the game's text table. Its `league` column was filled on 1 November 2026 from each league's current season, as a starting point to check against the league books. Where a book disagrees, the book wins: correct the row.

21 of the 30 books have been read so far (see [Read off the league books](#read-off-the-league-books)). The other nine leagues are still the season lists.

## How it was filled

- Each of the 30 leagues' club lists comes from its English Wikipedia season article (linked below), after promotion and relegation. Leagues that run across two years use 2026–27; Argentina, Brazil, Ireland, Norway, South Korea and Sweden use their 2026 season.
- The game's real club names are short forms ("M'gladbach", "R. Union St.-G.", "Latium" for Lazio). They were matched to the season lists automatically where the match was clear, and by hand where it wasn't. `season_name` is the club as the season article names it.
- Every league ends up with exactly its real number of clubs, and no club in any season list is left without a game club.

## The 30 leagues

| League | Competition | Season | Clubs | Source | Book read |
|---|---|---|---|---|---|
| Argentina 1 | Argentine Primera División (Liga Profesional de Fútbol) | 2026 | 30 | [Wikipedia](https://en.wikipedia.org/wiki/2026_AFA_Liga_Profesional_de_F%C3%BAtbol) | 5 Nov 2026 |
| Australia 1 | A-League Men | 2026–27 | 12 | [Wikipedia](https://en.wikipedia.org/wiki/2026%E2%80%9327_A-League_Men) | 5 Nov 2026 |
| Austria 1 | Austrian Football Bundesliga | 2026–27 | 12 | [Wikipedia](https://en.wikipedia.org/wiki/2026%E2%80%9327_Austrian_Football_Bundesliga) | 5 Nov 2026 |
| Belgium 1 | Belgian Pro League | 2026–27 | 18 | [Wikipedia](https://en.wikipedia.org/wiki/2026%E2%80%9327_Belgian_Pro_League) | 5 Nov 2026 |
| Brazil 1 | Campeonato Brasileiro Série A | 2026 | 20 | [Wikipedia](https://en.wikipedia.org/wiki/2026_Campeonato_Brasileiro_S%C3%A9rie_A) | 5 Nov 2026 |
| Denmark 1 | Danish Superliga | 2026–27 | 12 | [Wikipedia](https://en.wikipedia.org/wiki/2026%E2%80%9327_Danish_Superliga) | 5 Nov 2026 |
| England 1 | Premier League | 2026–27 | 20 | [Wikipedia](https://en.wikipedia.org/wiki/2026%E2%80%9327_Premier_League) | 5 Nov 2026 |
| England 2 | EFL Championship | 2026–27 | 24 | [Wikipedia](https://en.wikipedia.org/wiki/2026%E2%80%9327_EFL_Championship) | 5 Nov 2026 |
| England 3 | EFL League One | 2026–27 | 24 | [Wikipedia](https://en.wikipedia.org/wiki/2026%E2%80%9327_EFL_League_One) | 5 Nov 2026 |
| England 4 | EFL League Two | 2026–27 | 24 | [Wikipedia](https://en.wikipedia.org/wiki/2026%E2%80%9327_EFL_League_Two) | 5 Nov 2026 |
| France 1 | Ligue 1 | 2026–27 | 18 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Ligue_1) | 5 Nov 2026 |
| France 2 | Ligue 2 | 2026–27 | 18 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Ligue_2) | 5 Nov 2026 |
| Germany 1 | Bundesliga | 2026–27 | 18 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Bundesliga) | 5 Nov 2026 |
| Germany 2 | 2. Bundesliga | 2026–27 | 18 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_2._Bundesliga) | 5 Nov 2026 |
| Germany 3 | 3. Liga | 2026–27 | 20 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_3._Liga) | 5 Nov 2026 |
| Ireland 1 | League of Ireland Premier Division | 2026 | 10 | [Wikipedia](https://en.wikipedia.org/wiki/2026_League_of_Ireland_Premier_Division) | 5 Nov 2026 |
| Italy 1 | Serie A | 2026–27 | 20 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Serie_A) | 5 Nov 2026 |
| Italy 2 | Serie B | 2026–27 | 20 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Serie_B) | 5 Nov 2026 |
| Netherlands 1 | Eredivisie | 2026–27 | 18 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Eredivisie) | 5 Nov 2026 |
| Norway 1 | Eliteserien | 2026 | 16 | [Wikipedia](https://en.wikipedia.org/wiki/2026_Eliteserien) | 5 Nov 2026 |
| Poland 1 | Ekstraklasa | 2026–27 | 18 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Ekstraklasa) | 5 Nov 2026 |
| Portugal 1 | Primeira Liga | 2026–27 | 18 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Primeira_Liga) | |
| Romania 1 | Liga I (SuperLiga) | 2026–27 | 16 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Liga_I) | |
| Scotland 1 | Scottish Premiership | 2026–27 | 12 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Scottish_Premiership) | |
| South Korea 1 | K League 1 | 2026 | 12 | [Wikipedia](https://en.wikipedia.org/wiki/2026_K_League_1) | |
| Spain 1 | La Liga | 2026–27 | 20 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_La_Liga) | |
| Spain 2 | Segunda División | 2026–27 | 22 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Segunda_División) | |
| Sweden 1 | Allsvenskan | 2026 | 16 | [Wikipedia](https://en.wikipedia.org/wiki/2026_Allsvenskan) | |
| Swiss 1 | Swiss Super League | 2026–27 | 12 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Swiss_Super_League) | |
| Turkey 1 | Süper Lig | 2026–27 | 18 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Süper_Lig) | |

## Read off the league books

`data/ufm27-league-books.csv` holds each book's index as the game shows it: the league, the club's slot in the index, and the club under its shown name. Where a book has been read, the clubs carrying that league in `data/ufm27-clubs.csv` are exactly the clubs in the book, and `tests/clubs.test.mjs` fails if they drift apart.

The 21 below were read on 5 November 2026, in two batches, from a player's screenshots of each book's index.

- **Which book is which.** The index doesn't print the book's name. Each screenshot was matched to its book by its clubs: every club on it carried the same league in the season list, and the counts matched that league's.
- **The Collection Books screen** counts 30 books, the same 30 as `data/ufm27-leagues.csv`. The covers name the country, with a number from the second tier down: England, then England 2, 3 and 4.
- **How the index runs.** Two facing pages of four columns by three rows, the left page filled before the right. `slot` follows that order. A book with more than 24 clubs runs on to a second spread: Argentina's slots 25 to 30.
- **The order is the game's own**, not alphabetical, and `slot` keeps it.
- **One name can be two clubs.** Kraków Red is both Cracovia and Wisła Kraków, and the Poland 1 book lists it twice, at slots 6 and 18.

| Book | Clubs | Against the season list |
|---|---|---|
| Argentina 1 | 30 | Agrees, once the three keys the book doesn't use are dropped (below) |
| Australia 1 | 12 | Agrees |
| Austria 1 | 12 | Agrees |
| Belgium 1 | 18 | Agrees |
| Brazil 1 | 20 | Agrees |
| Denmark 1 | 12 | Agrees |
| England 1 | 20 | Agrees |
| England 2 | 24 | Agrees |
| England 3 | 24 | Agrees |
| England 4 | 24 | Agrees |
| France 1 | 18 | Agrees |
| France 2 | 18 | Agrees. Laval is in it once, and both Laval keys keep the league (below) |
| Germany 1 | 18 | Agrees |
| Germany 2 | 18 | Agrees, once the key the book doesn't use is dropped (below) |
| Germany 3 | 20 | Agrees |
| Ireland 1 | 10 | Agrees |
| Italy 1 | 20 | Agrees |
| Italy 2 | 20 | Agrees |
| Netherlands 1 | 18 | Agrees, once the key the book doesn't use is dropped (below) |
| Norway 1 | 16 | Agrees, once the key the book doesn't use is dropped (below) |
| Poland 1 | 18 | Agrees |

## Clubs the game lists twice

Two keys in the game's table name the same club. Until its book is read, both rows carry the league. Once it is, the key the book uses keeps the league and the other is left blank. Where both keys show the same name, the book can't tell them apart, so both keep the league.

Settled by the Argentina book:

- Argentinos Juniors: the book has **Buenos Aires Crimson** (Argentinos Jrs.). The key "Argentinos Juniors" isn't in it.
- Defensa y Justicia: the book has **Florencio Varela Yellow** (Defensa). The key "Defensa y Justicia" isn't in it.
- Estudiantes de La Plata: the book has **La Plata Red** (Estudiantes). The key "Estudiantes" (Club Estudiantes de La Plata) isn't in it.

Settled by the Germany 2, Netherlands 1 and Norway 1 books:

- Greuther Fürth: the book has **Fürth Green**. The key "Fürth" isn't in it.
- AZ: the book has **AZ**. The key "AZ Alkmaar" isn't in it.
- Vålerenga: the book has **Oslo Blue** (Vålerenga Fotball). The key "Vålerenga" isn't in it.

Can't be settled from a book:

- France 2: Laval. Both keys (Laval MFC, Stade Laval) show as "Laval", and the book has one "Laval". Both rows keep France 2, and `tests/clubs.test.mjs` counts them once.

Still open:

- Romania 1: Sepsi OSK: Sepsi OSK, Sepsi OSK Sf. Gheorghe

## Left open

- **Racing** shows in the game as just "Racing". Racing Club (Avellaneda Blue), Racing Santander (Santander) and Racing de Ferrol (Ferrol) each already have their own key, so the league book will say which this is. It isn't Racing Club: the Argentina book has Avellaneda Blue and no "Racing". Spain 1 and Spain 2 are left.

## Not in any of the 30 leagues this season (82)

Relegated, or never in these divisions this season. They stay in the file with a blank league: if one turns up in a league book, give it that league.

- Aalborg Red (AaB)
- Adana Blue (Adana Demirspor)
- Ajaccio (AC Ajaccio)
- Almere City FC
- Amiens (Amiens SC)
- Antalya Red (Antalyaspor)
- Aue Purple (FC Erzgebirge Aue)
- Aveiro Red (AVS Futebol SAD)
- Bari
- Barrow
- Bastia (SC Bastia)
- Boavista Black (Boavista FC)
- Bodrum Blue (Bodrum FK)
- Brescia
- Bryne Red (Bryne FK)
- Bucharest Green (FC Metaloglobus)
- Buzău Red (FC Gloria Buzău)
- Caen (SM Caen)
- Carlisle (Carlisle United)
- Cartagena (FC Cartagena)
- Cittadella
- Cork Green (Cork City)
- Cosenza Red (Cosenza)
- Daegu Blue (Daegu FC)
- Dortmund II Yellow (B. Dortmund II)
- Drammen Blue (Strømsgodset IF)
- Faro White (Farense)
- FC Volendam
- FCV Dender EH
- Ferrol (Racing de Ferrol)
- Fredericia Red (FC Fredericia)
- Gdańsk Green (Lechia Gdańsk)
- Gdynia Yellow (Arka Gdynia)
- Haching Red (Unterhaching)
- Hannover II Red (Hannover 96 II)
- Harrogate (Harrogate Town)
- Hatay Red (Hatayspor)
- Haugesund Blue (FK Haugesund)
- Heracles Almelo
- Huesca (SD Huesca)
- Iași Blue (Politehnica Iași)
- Istanbul Red (Karagümrük SK)
- K. Beerschot VA
- Kayseri Red (Kayserispor)
- Klagenfurt Purple (Austria Klagenfurt)
- La Spezia (Spezia)
- León (Cultural Leonesa)
- Linz Blue (Blau-Weiss Linz)
- Livingston Yellow (Livingston)
- Martigues Blue (FC Martigues)
- Mendoza Blue (Godoy Cruz)
- Mielec Blue (Stal Mielec)
- Miranda de Ebro (CD Mirandés)
- Morecambe
- Munich Blue (1860 München)
- NAC Breda
- Nieciecza Orange (Bruk-Bet)
- Norrköping White (IFK Norrköping)
- Pescara
- Puszcza Green (Puszcza)
- Racing
- Reggio Maroon (Reggiana)
- RKC Waalwijk
- Ross Navy Blue (Ross County)
- Salerno (Salernitana)
- San Martín Green (San Martín)
- Sandhausen Black (SV Sandhausen)
- Schweinfurt Green (FC Schweinfurt 05)
- Sibiu Red (FC Hermannstadt)
- Sivas Red (Sivasspor)
- Skien Black (Odds BK)
- Slobozia Blue (Unirea Slobozia)
- Suwon Red (Suwon FC)
- Tondela Yellow (CD Tondela)
- Ulm White (SSV Ulm 1846)
- Vejle Red (Vejle Boldklub)
- Värnamo Blue (IFK Värnamo)
- Växjö Red (Östers IF)
- Western Red (Western United)
- Winterthur Red (FC Winterthur)
- Yverdon Green (Yverdon Sport FC)
- Zaragoza (Real Zaragoza)
