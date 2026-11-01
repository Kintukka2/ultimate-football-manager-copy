# Which league each club is in

`data/ufm27-clubs.csv` lists the 626 clubs in the game's text table. Its `league` column was filled on 1 November 2026 from each league's current season, so it is a starting point to check against the league books, not a reading of them. Where a book disagrees, the book wins: correct the row.

## How it was filled

- Each of the 30 leagues' club lists comes from its English Wikipedia season article (linked below), after promotion and relegation. Leagues that run across two years use 2026–27; Argentina, Brazil, Ireland, Norway, South Korea and Sweden use their 2026 season.
- The game's real club names are short forms ("M'gladbach", "R. Union St.-G.", "Latium" for Lazio). They were matched to the season lists automatically where the match was clear, and by hand where it wasn't. `season_name` is the club as the season article names it.
- Every league ends up with exactly its real number of clubs, and no club in any season list is left without a game club.

## The 30 leagues

| League | Competition | Season | Clubs | Source |
|---|---|---|---|---|
| Argentina 1 | Argentine Primera División (Liga Profesional de Fútbol) | 2026 | 30 | [Wikipedia](https://en.wikipedia.org/wiki/2026_AFA_Liga_Profesional_de_F%C3%BAtbol) |
| Australia 1 | A-League Men | 2026–27 | 12 | [Wikipedia](https://en.wikipedia.org/wiki/2026%E2%80%9327_A-League_Men) |
| Austria 1 | Austrian Football Bundesliga | 2026–27 | 12 | [Wikipedia](https://en.wikipedia.org/wiki/2026%E2%80%9327_Austrian_Football_Bundesliga) |
| Belgium 1 | Belgian Pro League | 2026–27 | 18 | [Wikipedia](https://en.wikipedia.org/wiki/2026%E2%80%9327_Belgian_Pro_League) |
| Brazil 1 | Campeonato Brasileiro Série A | 2026 | 20 | [Wikipedia](https://en.wikipedia.org/wiki/2026_Campeonato_Brasileiro_S%C3%A9rie_A) |
| Denmark 1 | Danish Superliga | 2026–27 | 12 | [Wikipedia](https://en.wikipedia.org/wiki/2026%E2%80%9327_Danish_Superliga) |
| England 1 | Premier League | 2026–27 | 20 | [Wikipedia](https://en.wikipedia.org/wiki/2026%E2%80%9327_Premier_League) |
| England 2 | EFL Championship | 2026–27 | 24 | [Wikipedia](https://en.wikipedia.org/wiki/2026%E2%80%9327_EFL_Championship) |
| England 3 | EFL League One | 2026–27 | 24 | [Wikipedia](https://en.wikipedia.org/wiki/2026%E2%80%9327_EFL_League_One) |
| England 4 | EFL League Two | 2026–27 | 24 | [Wikipedia](https://en.wikipedia.org/wiki/2026%E2%80%9327_EFL_League_Two) |
| France 1 | Ligue 1 | 2026–27 | 18 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Ligue_1) |
| France 2 | Ligue 2 | 2026–27 | 18 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Ligue_2) |
| Germany 1 | Bundesliga | 2026–27 | 18 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Bundesliga) |
| Germany 2 | 2. Bundesliga | 2026–27 | 18 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_2._Bundesliga) |
| Germany 3 | 3. Liga | 2026–27 | 20 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_3._Liga) |
| Ireland 1 | League of Ireland Premier Division | 2026 | 10 | [Wikipedia](https://en.wikipedia.org/wiki/2026_League_of_Ireland_Premier_Division) |
| Italy 1 | Serie A | 2026–27 | 20 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Serie_A) |
| Italy 2 | Serie B | 2026–27 | 20 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Serie_B) |
| Netherlands 1 | Eredivisie | 2026–27 | 18 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Eredivisie) |
| Norway 1 | Eliteserien | 2026 | 16 | [Wikipedia](https://en.wikipedia.org/wiki/2026_Eliteserien) |
| Poland 1 | Ekstraklasa | 2026–27 | 18 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Ekstraklasa) |
| Portugal 1 | Primeira Liga | 2026–27 | 18 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Primeira_Liga) |
| Romania 1 | Liga I (SuperLiga) | 2026–27 | 16 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Liga_I) |
| Scotland 1 | Scottish Premiership | 2026–27 | 12 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Scottish_Premiership) |
| South Korea 1 | K League 1 | 2026 | 12 | [Wikipedia](https://en.wikipedia.org/wiki/2026_K_League_1) |
| Spain 1 | La Liga | 2026–27 | 20 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_La_Liga) |
| Spain 2 | Segunda División | 2026–27 | 22 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Segunda_División) |
| Sweden 1 | Allsvenskan | 2026 | 16 | [Wikipedia](https://en.wikipedia.org/wiki/2026_Allsvenskan) |
| Swiss 1 | Swiss Super League | 2026–27 | 12 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Swiss_Super_League) |
| Turkey 1 | Süper Lig | 2026–27 | 18 | [Wikipedia](https://en.wikipedia.org/wiki/2026–27_Süper_Lig) |

## Clubs the game lists twice

Two keys in the game's table name the same club. Both rows carry the league; the book will show which one the game actually uses.

- Argentina 1: Argentinos Juniors: Argentinos Juniors, Argentinos Jrs.
- Argentina 1: Defensa y Justicia: Defensa y Justicia, Defensa
- Argentina 1: Estudiantes de La Plata: Club Estudiantes de La Plata, Estudiantes
- France 2: Laval: Laval MFC, Stade Laval
- Germany 2: Greuther Fürth: Fürth, Fürth
- Netherlands 1: AZ: AZ, AZ Alkmaar
- Norway 1: Vålerenga: Vålerenga Fotball, Vålerenga
- Romania 1: Sepsi OSK: Sepsi OSK, Sepsi OSK Sf. Gheorghe

## Left open

- **Racing** shows in the game as just "Racing". Racing Club (Avellaneda Blue), Racing Santander (Santander) and Racing de Ferrol (Ferrol) each already have their own key, so the league book will say which this is.

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
