# Ultimate Football Manager 27 (UFM 27): complete analysis

Snapshot date: **29 October 2026**. Build analysed: **27.4.0** (Android versionCode 1792503486, iOS 27.4.0 released 22 Oct 2026).

This document covers what the game is, where it came from, who makes it, how every system works, how it makes money, how players feel about it, and what it would take to rebuild it. It draws on three independent sources:

| Tag | Source | What it covers |
|---|---|---|
| **[APK]** | Static teardown of the official 27.4.0 Android package. It is signed with Google Play's app-signing key for `com.gamebasics.ufm` and carries Play's source stamp. I decoded its 5,632 English UI strings, the Unity Addressables catalog, the ScriptableObject definitions and the IL2CPP metadata (25,749 code string literals, 148,659 identifiers). | The game's own rules text, every screen, mode, currency, consumable, rarity and formation, and the tech stack |
| **[Store]** | Google Play and Apple App Store pages, raw JSON, version history, IAP lists and the store screenshots | Facts, dates, prices, the release timeline |
| **[HC]** | The official help centre at `ultimatefootballmanager.zendesk.com`, all 20 articles | Official rules explanations |
| **[Players]** | 223 App Store reviews from 9 countries, Google Play reviews in 8 languages with developer replies, and YouTube metadata | Real-world numbers such as energy regen, pack prices and payouts, plus sentiment |

Balance numbers that the server controls (exact drop rates, training durations, OVR weights) never ship in the client. Where this document gives such a number, it names the source: a screenshot, the help text, or a consistent player report.

---

## 1. What UFM 27 is, in one paragraph

UFM 27 is a free-to-play **mobile football club-management and card-collection game**. It is essentially **FIFA/EA FC Ultimate Team without the controller**. You create your own club and collect FUT-style cards of real footballers from packs, a player-to-player transfer market and Player Trade Challenges (its version of SBCs). You set formation, tactics and roles, and keep your squad's **Fitness**, **Focus** and **Chemistry** high. Then you watch **server-simulated** matches against other real managers' teams in daily leagues, energy-gated Quick Matches, a qualifier-based Weekend League and condition-based Challenge Matches. Each August the game hard-resets everyone's squad and coins for the new real-world season, and the title's year number goes up (UFM 26, then UFM 27). It is made by **Gamebasics BV** (Zoetermeer, the Netherlands), which now operates as **Miniclip Nederland** and is owned by Miniclip, itself majority-owned by **Tencent**. It is the soccer sibling of the studio's American-football game *Football Head Coach* and shares that game's codebase and asset CDN.

---

## 2. Fact sheet

| Field | Value | Source |
|---|---|---|
| Store name | Ultimate Football Manager 27 | [Store] |
| iOS display name / short name | "UFM: Ultimate Football Manager 27" / "UFM 27" | [APK] |
| Android launcher name | "UFM 27" | [APK] |
| App Store subtitle | "Elite Soccer Management Game" | [Store] |
| Play short description | "Be a football manager. Master tactics and dominate the league." | [Store] |
| Developer / seller | Gamebasics BV (Apple artist id 400201469; Play dev id 7184623397550987805) | [Store] |
| Operating studio | Miniclip Nederland (formerly Gamebasics), Buitenom 263, 2711 KB Zoetermeer, NL | [Store] |
| Parent companies | Miniclip (Neuchâtel, Switzerland), majority-owned by Tencent since Feb 2015 | public record |
| Android package / iOS id | `com.gamebasics.ufm` / `id6474134759` | [Store] |
| Current version | 27.4.0, 22 Oct 2026 (iOS) / 23 Oct 2026 (Play) | [Store] |
| Engine | Unity **6000.3.8f1** (Unity 6.3), IL2CPP, arm64-v8a | [APK] |
| Platforms | Android 11+ (min SDK 30, target SDK 36); iOS/iPadOS 16+; Apple-silicon Macs; visionOS; Windows via Google Play Games on PC | [APK] [Store] |
| Size | 344 MB (iOS); 286.6 MB XAPK (base 251.9 MB + arm64 split 34.7 MB) | [Store] [APK] |
| Price model | Free, with ads and in-app purchases | [Store] |
| IAP price range | US $0.49–$234.99 per item (Play); GB £0.49–£204.99; NL €0.49–€239.99 | [Store] |
| Age rating | Play "Everyone, In-Game Purchases (Includes Random Items)"; iOS 9+ "Loot Boxes, Advertising". In-game age gate: 13+ to create an account | [Store] [APK] |
| Google Play | 4.6★ from 35,857 ratings; **7,510,341 installs** (shown as "5M+") | [Store] |
| App Store | 4.8★ (US, 1,956 ratings); 15,081 ratings across 36 storefronts | [Store] |
| Store languages | EN, AR, NL, FR, DE, IT, PT, ES, TR | [Store] |
| Client string tables | 15 locales. The 9 store languages are complete (Portuguese is pt-BR); Indonesian, Danish, Norwegian, European Portuguese, Polish and Swedish are partial | [APK] |
| Support | In-game Zendesk; info.mnl@miniclip.com / support@miniclip.com | [Store] [APK] |
| Community | Discord `discord.gg/MqCUwf3nbP`; Reddit `r/UFM`; YouTube `@UltimateFootballManager` (952 subscribers) | [APK] [Store] |
| Revenue (third-party estimate) | Sensor Tower public bands: $100k–$500k/month on Play and $100k–$500k/month on iOS | third-party |

---

## 3. History and timeline

### 3.1 Lineage

1. **2001:** Jeroen and Bowie Derwort start *Online Soccer Manager (OSM)* in an attic room. Gamebasics BV is founded in 2004 with Frank Tijhuis.
2. **Feb 2015:** Tencent takes a majority stake in Miniclip.
3. **Sep 2020 / Jan 2021:** Miniclip acquires Gamebasics (announced 19 Jan 2021). The studio then had 60 staff and OSM had 3M+ monthly users.
4. **21 Jul 2022:** *Football Head Coach* (bundle `com.gamebasics.afm`, i.e. "American Football Manager") launches on iOS. It introduces the template UFM later copies: NFLPA-licensed player packs, a player market, daily training, Quick Match, and a yearly season reset with year-numbered titles.
5. **Nov 2022:** The studio expands as Miniclip Netherlands. It moves to the "stadium office" in Zoetermeer in Dec 2022 and now has over 90 staff.
6. **11 Dec 2023:** The Google Play app-signing certificate for `com.gamebasics.ufm` is generated, which is the project's registration date [APK cert]. The iOS app id falls in the same window.

**Proof that UFM is built on Football Head Coach's codebase [APK]:**
- The Addressables remote catalog points at `https://live-assets.footballheadcoach.com/assetbundles/Android/catalog_27.4.0.hash`.
- The code literal `footballheadcoach` ships in the binary.
- Orphaned American-football strings ship in UFM's localisation: "Plays & Drills Practice", "Situational Practice", "Game Strategy Practice".
- The Play privacy-policy link goes to `footballheadcoach.com/privacy-policy/`.
- The IAP SKU names are identical across both games (Small/Medium/Large/X-Large pack, Promo Bundle N).

### 3.2 UFM release timeline

| Date | Event | Source |
|---|---|---|
| 3 Dec 2024 | iOS soft launch, Philippines | [Store] |
| 23 Dec 2024 | Help centre goes live with 20 articles | [HC] |
| 21 Jan 2025 | Soft launch, Turkey | [Store] |
| 3 Apr 2025 | Android build 25.0.0 ("UFM 25" soft-launch line) | [Store] |
| 8 Apr 2025 | Soft launch, Netherlands | [Store] |
| Apr–May 2025 | 25.3.x adds Player Trade Challenges | [Players] |
| 28 May 2025 | Soft launch, UK | [Store] |
| 18 Jun 2025 | Soft launch, Germany | [Store] |
| **4–5 Aug 2025** | **Global launch as "UFM 26" (v26.0.0)**, with the database updated for 2025/26 | [Store] |
| 15 Aug 2025 | Studio launch post: "the game we've been building at Miniclip Nederland is finally here!" | gamebasics.nl |
| 4 Dec 2025 | Gamebasics named "Best Studio of 2025" at the Dutch Game Awards | gamebasics.nl |
| 19 Jan 2026 | 26.12.1: Collection Book improvements | [Store] |
| 27 Jan 2026 | 26.13.0: new background music | [Store] |
| 4 Mar 2026 | 26.15.0: new first-time user experience and mission flow, market price display, OVR-based match feedback | [Store] |
| **11 Mar 2026** | **26.16.0: Chemistry system added** | [Store] |
| **7 Apr 2026** | **26.18.0: Lineup Presets** | [Store] |
| 8 Jun 2026 | 26.22.1: World Cup takeover. A new game mode opens 9 June and the Scratch Calendar 11 June | [Store] |
| 23 Jul 2026 | 26.24.2: Season Trackers and Season Reset Tokens ("Get ready for UFM 27!") | [Store] |
| **25 Aug 2026** | **27.0.0, "UFM 27 is Live!"** Yearly reset, revamped UI, rebalanced economy, new player ratings, upgraded PTC page | [Store] |
| 15 Sep 2026 | 27.1.0: smarter player lists, redesigned Announcements | [Store] |
| 21 Sep 2026 | 27.2.0: Event Hub, Team Filter, Pack Assign, Bench Positions | [Store] |
| 7 Oct 2026 | 27.3.0 (same notes) | [Store] |
| 11–31 Oct 2026 | "Screamers Event Shop" Halloween event | [Store] |
| 22 Oct 2026 | 27.4.0: bug fixes | [Store] |
| Summer 2027 | Next yearly reset, as the in-game text says: "The next Yearly Reset is scheduled for the summer of 2027" | [APK] |

Release cadence: a client update roughly every 2–3 weeks. Content (events, packs, PTCs) is server-driven and changes weekly without a client update.

**Naming:** UFM is one app id that is renamed every season: UFM 25 (soft launch), then UFM 26 (2025/26), then UFM 27 (2026/27). Football Head Coach uses the same scheme. Two unrelated games share the name: *UFM: Ultimate Football Manager* by Ayrill (`com.ayrill.ufm`) and *Ultimate Football Club Manager*. SEGA/Sports Interactive's *Football Manager 27* is also an entirely different product.

---

## 4. "The story"

**UFM has no narrative campaign, characters or cutscenes.** It is a live-service card game. The "story" is the career arc the systems create for you:

1. **The contract.** Onboarding presents a **"Manager Contract"**. You sign by choosing a **manager name**, a **team name** (3–17 characters, letters and digits only) and a **team logo**. The welcome screen reads "Welcome, Manager — Start building your own football team". [APK]
2. **The squad reveal.** "Introducing… Your Lineup!": an initial squad pack and a first-time-user Draft Pick give you your starting XI. [APK]
3. **The climb.** You rise through **12 club tiers**, which the game calls your club's "reputation": "the more you progress and win the more fans your club will attract". They run Amateur 1–3, Semi-Pro 1–3, Pro 1–3 and Legendary 1–3. [APK]
4. **The football calendar.** The live-ops calendar follows the real season: Team of the Week, Player of the Month, Halloween "Screamers", Black Friday, Christmas, Team of the Year, Africa Cup, Carnival, Team of the Season, Champions League finalists, summer transfer "Movers", and a 2026 World Cup event. That World Cup event even has a five-chapter mini-narrative in its Scratch Calendar: "The Kickoff", "The Build-up", "The Tournament Trail", "The Climax", "The Final" ("Begin your journey across Canada, Mexico, and the USA…"). [APK]
5. **The reset.** Every summer the season ends and everyone starts over with a fresh squad. Your previous season's achievements buy a head start through Season Reset Tickets. [APK] [HC]

---

## 5. Onboarding and the core loop

### 5.1 First session [APK]
1. You choose **Play as Guest**, **Sign in with Apple** or **Sign in with Google (Play Games)**. A Facebook connection string also exists. The terms link to Miniclip's terms and privacy pages.
2. An age gate turns away anyone under 13.
3. The Manager Contract: manager name, team name and logo.
4. The lineup reveal, with an initial squad pack and an FTUE Draft Pick.
5. A missions tooltip ("Welcome to UFM — Start here"), then **Introduction PTCs** #1–#3, **Newcomer missions** and **OVR missions** #1–#9 that hand out packs.
6. A prompt to join your first League.

Players report a large welcome burst of energy and gems: "about 12 games on first log in". [Players]

### 5.2 Navigation [APK]
The bottom menu has six tabs:
- **Home:** dashboard, upcoming match, announcements and events.
- **Team:** lineup, playstyles, collection, Collection Book.
- **Staff:** Training Center, Fitness Coach, Injuries, Suspensions.
- **Market.**
- **Shop.**
- **Social:** leaderboards, comparisons, friends.

### 5.3 The daily loop
```
 ┌─► Check League fixture (1 match/day, simulated at a fixed time)
 │     └─ prepare: lineup ✓ bench ✓ positions ✓ roles ✓ fitness ✓ focus ✓ chemistry ✓ opponent ✓
 │
 ├─► Train up to 4 players (Short / Medium / Long) → Focus ↑, Fitness ↓
 ├─► Fitness Coach (energy bars / ads) → Fitness ↑
 ├─► Spend Quick Match energy (1 per match, max 3, ~7–8 h regen) → weekly win milestones, money, QP
 ├─► Open packs → Pack Assign upgrades → sell surplus on Market / feed PTCs
 ├─► Complete daily + weekly missions, event missions, PTCs
 └─► Collect: tier rewards, Collection Book points, event tickets → event shop
```
Players describe typical active time as **5–10 minutes a day**, mostly spent waiting on timers. [Players]

---

## 6. Player cards

### 6.1 Attributes [APK]

| | Outfield players | Goalkeepers |
|---|---|---|
| Headline | OVR (overall) | OVR |
| Sub-stats | **PAC** Pace, **SHO** Shooting, **PAS** Passing, **DRB** Dribbling, **DEF** Defense, **PHY** Physical | **DIV** Diving, **HAN** Handling, **KCK** Kicking, **REF** Reflexes, **PAC** Speed, **POS** Positioning |
| Bio data | Age, height (cm), weight (kg), nationality, league, team, rarity, quality | same |
| Dynamic state | **Fitness** %, **Focus** −2…+2, **Chemistry** 0…+3, **Form**, injured/suspended flags, sellable/unsellable, location (lineup / bench / reserves / on market) | same |

There is no XP, levelling, ageing, contract or retirement. A card's ratings only change when the developers push new real-world ratings, which they did for UFM 27, or when a **live/evolving rarity** gets upgraded. "Champions Evolution", "European Evolutions" and "World Evolutions" are evolving rarities, and players report Champions League cards upgrading as their club advances. [APK] [Players]

### 6.2 Positions [APK]
There are 12: **GK, CB, LB, RB, CDM, CM, CAM, LM, RM, LW, RW, ST**.
- Each card has a primary position and possibly secondary ones. The profile pitch shows where the player performs well, and "if you use this player in another position, their overall rating will be lowered".
- **UFM 27 cut most cards to a single position.** UFM 26 cards had about two, which became the most common UFM 27 complaint. The developer has acknowledged it. [Players] [HC]
- Since 27.2.0, **bench slots require specific positions** that fit your formation, and you can add only one bench player per position. [Store] [APK]
- You can't field two versions of the same real player: "A variant of this player is already in your lineup". [APK]

### 6.3 Quality tiers [APK]
**Bronze → Silver → Gold → Gold Rare → Elite → Premium**. The base cards come in bronze, silver and gold artwork, and the store screenshots show black-and-gold rares.

### 6.4 Special rarities (54 defined in 27.4.0) [APK]

| Theme | Rarities |
|---|---|
| Weekly/monthly real-world form | Team of the Week (TOTW), Player of the Month (POTM), Weekend League, Matchday |
| Annual awards | Team of the Year (TOTY), TOTY Nominees, Team of the Season (TOTS), Golden Ball, Champions, Champions Finalists, Champions Evolution |
| Seasonal/holiday | New Season, Kick-Off/European Evolutions, Autumn, Harvest, Screamers (Halloween), Black Friday, Christmas, Winter Glory, Frozen Elite, Ice Breakers, New Year, Carnival, Spring, Summer Heat |
| Tournaments | Africa Cup, World 26, World Champions, World Evolutions, World Weekly, England 2 Stars |
| Transfer windows | Transfer Stars (Movers), Club Hoppers, Deal Makers, Most Wanted |
| Archetypes | Academics, Breakouts, Centurions, Future Stars, Game Changers, Hidden Gems, Legacy, Mavericks, Missing Stars, Neon, Platinum, Player Picks, Record Breakers, Shapeshifters, Super Heroes, Veterans |
| System | Normal, Starter, PTC |

Each special rarity counts as a **Chemistry link** (see 7.3) and has its own **Collection Book**.

### 6.5 Sellable vs Unsellable
Many reward cards are **Unsellable**: they can't be listed or quick-sold, but they **can be traded into PTCs**. Unsellable cards include some silver, event and special cards. Any card in **any** lineup preset, even an inactive one, is locked from sale and marked with a shirt icon. [APK] [HC]

---

## 7. Team building

### 7.1 Lineup and team OVR [APK]
- **Team OVR** is the headline strength number, shown to one decimal (for example 86.2).
- In UFM 27 the formula is **weighted: the starting XI counts for X% and the bench for Y%**. The help string is `Help_Playstyle_1_Ovr_Weights`; the developer announced that substitutes now contribute. The weights are set on the server. [APK] [Players]
- The team screen shows **ATT / MID / DEF** sub-averages and a **CHM** (chemistry) bonus. One screenshot reads OVR 86.2, CHM +2.0, ATT 88.3, MID 88.0, DEF 84.0. [Store screenshots]
- **Auto order** fills the formation with your highest-rated eligible players. A view switch flips cards between OVR, Chemistry, Stats and Details.
- **Lineup Presets** (added in 26.18.0): **up to 4** saved lineups, each with its own formation, tactics and players. **One is active**, and the active lineup plays all matches. Lineups are also stored **per match mode**, so a Challenge Match lineup is separate from your main one. [APK]

### 7.2 Formations (19) [APK]
3-4-3 Flat · 3-4-3 Diamond · 3-5-2 · 4-4-2 Flat · 4-4-2 Holding · 4-3-3 Attack · 4-3-3 Defend · 4-3-3 Holding · 4-1-2-1-2 Wide · 4-1-2-1-2 Narrow · 4-1-3-2 · 4-1-4-1 · 4-2-3-1 Wide · 5-4-1 · 5-4-1 Diamond · 5-3-2 · 5-2-3 · 5-2-1-2 · 5-1-2-2

Formations are fixed presets; you can't drag players to custom spots. [Players]

### 7.3 Chemistry (added 11 Mar 2026) [APK]
- **What counts:** Starting-XI players who share a **Nationality (NAT)**, **League (LGE)** or **Special Rarity (RAR)** get a boost. **Each player can gain at most +3**, which adds **+3 to OVR and every sub-stat**.
- **Thresholds:** The boost is stepped. For nationality, **2 players give +1 and 5 players give +2**, with a higher count for +3. League and rarity have their own threshold tables.
- **What doesn't count:** Position on the pitch and adjacency are irrelevant. The **bench is excluded**.
- **Where it applies:** League matches, Weekend League and other modes.
- **Feedback:** Match feedback compares your average chemistry with the opponent's.

### 7.4 Roles [APK]
There are four role slots: **Captain**, **Penalties**, **Free kicks** and **Corners**. Match feedback shows what the engine looks at:
- the corner taker's **passing**;
- the free-kick and penalty takers' **shooting**;
- the **captain's fitness** ("Your captain was running on empty today").

Leaving a role unassigned is flagged as a preparation failure.

### 7.5 Tactics [APK]
**Five mentality presets** sit on the main panel: **Attacking, Control, Counter, Defensive, Long Ball**. Each one can be customised across General, Offense and Defense tabs:

| Setting | Options | In-game guidance |
|---|---|---|
| Tempo | Slow / Normal / Fast | Speed of play on the ball |
| Focus Build Up | Flanks / Middle / Mixed | Suit it to the number of wide players in your formation |
| Final Third | Dribble & Shoot / High Crosses / Hold Up Play / Run at Defenders / Through Balls / Mixed | "Consider your players' sub stats" |
| Run Behind Defense | Rare / Mixed / Often | Attackers' runs in behind |
| Defensive Line | Low / Normal / High | High helps pressing and offside traps but exposes you to counters |
| Defensive Width | Narrow / Normal / Wide | Match it to your defenders and their attackers |
| Pressing | Low / Normal / High | **More pressing tires players faster** |
| Tackling | Cautious / Normal / Hard | **Hard wins the ball more often but brings more yellow and red cards** |
| Offside Trap | Rare / Mixed / Often | Easier with fewer defenders and a higher line |
| Auto Substitutions | Rare / Balanced / Frequent | **Frequent subs preserve fitness and reduce bookings**; depth on the bench matters |

There are **no in-match interventions**. You can't make manual substitutions or tactic changes during the simulation; the developer confirmed this. [Players]

---

## 8. Condition systems: Fitness, Focus, injuries, suspensions

### 8.1 Fitness [APK]
- **Drain:** Players lose fitness **after every League match** and **after every training session**. Lower fitness hurts performance.
- **Regeneration:** **+1% per hour**, automatically. At that rate a player at 40% needs about 60 hours to get back to 100%, which is the game's most-cited pain point. [APK] [Players]
- **Quick Matches** drain fitness *during* the match, but **fitness resets afterwards**. "You can play as many Quick Matches as you'd like without draining the players' fitness." [APK]
- **Ways to restore it:**
  - At the Fitness Coach, spend **Energy Bars**: "Apply 1" or "Apply Fully (N)".
  - Watch a rewarded video.
  - Bulk boosts are blocked when overall fitness is already high.
- **Status bands:** Perfect Fitness / Good Fitness / Unfit.

### 8.2 Focus [APK]
- **What it is:** A temporary per-player boost from **−2 to +2**, shown by an arrow icon on the card. It **adds to OVR and every sub-stat**.
- **When it changes:** It is **re-rolled randomly after every League game** and can come out negative. That is why players say "performance drops every night".
- **Training** is the only way to raise it (see section 9).
- **Feedback:** The match-preparation checklist asks for a team Focus of at least +N, and match feedback compares your average focus with the opponent's.

### 8.3 Injuries [APK]
- Players get injured during League and Quick matches and are **substituted off**. The injury lasts a set number of hours, during which the player can't play any match.
- **Recovery:** Speed it up with **4-hour injury-timer reduction** consumables or by watching a video.
- **Notes:** "Sprained ankle" is the one injury name defined. Players almost never mention injuries in reviews, so they are rare.

### 8.4 Suspensions [APK]
- A **red card**, or a second yellow, suspends a player for a set number of **hours** that applies to every mode.
- **Reduction:** Shorten it with **4-hour suspension-reduction** consumables or a video.
- **Reducing the risk:** Hard tackling raises the chance of a red; frequent auto-subs lower booking risk.

---

## 9. Training [APK] [Store screenshots]

- **Slots:** **4 training slots** run at once. [Players, multi-language consensus]
- **Three session types:**

  | Type | Duration | Gem skip price seen |
  |---|---|---|
  | Short Training | shortest | |
  | Medium Training | **~4 h** (screenshot timer at 3 h 59 m) | 8 gems |
  | Long Training | **~8 h** (screenshot timer at 7 h 59 m) | 16 gems |

  Longer sessions give bigger, more reliable Focus gains. The UI shows a "minimum training forecast" and a "+X – +Y" Focus range per session.
- **Outcomes:** "Good Boost", "Great Boost" or **"Super Boost"**, the jackpot roll ("Chance of a super boost!").
- **Cost:** Training costs **Fitness**.
- **Cap:** Focus can't go above **+2**. Training a player who is already at max is refused.
- **Speeding up:**
  - pay **Gems**, as in the table above;
  - watch an ad to cut **120 minutes**;
  - use training-timer-reduction consumables of **0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8 or 10 hours**.
- **Claiming:** You claim a finished session manually ("Claim"). Players report that collecting trained players is tied to playing league games.
- **Team display:** The team panel shows the result as "Training impact", for example **+0.30 OVR** on a 78.7 team.
- **Community Missions** sometimes set a global goal: "Train as many players as possible as a community".

Because Focus re-rolls after every league game, the optimal rhythm is to **train right after each league match** and finish before the next league kick-off. Watch the "⏰ 1 hour left until the game" push notification.

---

## 10. The match engine

### 10.1 Where it runs
- **Simulation is server-side.** The client calls actions such as `FixtureSimulateByCurrencyAction` and `FixtureSimulateByVideoAction`, then downloads the resulting `MatchEvent` list. If the server fails, the client shows "Failed to simulate the match… your {currency} has been refunded". [APK]
- **League matches are simulated at a scheduled time** for everyone in the group ("Matchday {0} is currently simulating"). Quick, Weekend League and Challenge matches simulate on demand.
- **The client only replays events.** It has a **Match Experience** viewer you can toggle ("Show Match Experience"): a 3D stadium where **player cards stand in for players** and slide into action for shots, saves and goals. There is a clock, pause and skip-to-end. [APK] [Store screenshots]
- **Players find the presentation thin:** "you look at an empty pitch then when your player shoots you see the cards do the action". [Players]

### 10.2 What goes into a result
Every input the engine evidently reads, taken from the feedback and preparation systems [APK]:
- **Effective OVR:** base card, then position fit, then **Chemistry (+0…3)**, then **Focus (−2…+2)**, then **Fitness**.
- **Lineup balance:** "{player} is a clear weak link".
- **Completeness:** 11 starters and a full bench.
- **Roles:** captain fitness, and set-piece takers' SHO and PAS.
- **Tactics:** mentality and the ten sub-settings. Pressing affects fatigue; tackling affects cards.
- **Auto-sub frequency**, which affects fitness and bookings.
- **Randomness:** the feedback lines "We managed to defy the odds and win" and "Shocking to lose this game despite the chances created" exist precisely because upsets are built in.

Matchmaking draws on "level, skill, squad strength and tactics", according to developer replies. [Players]

**How much does OVR decide?** Player reports split. Some say "every game was won by the higher OVR"; many complain of losing to teams 4–6 OVR lower despite 70% possession. UFM 27 is widely felt to be more random than UFM 26. The design is an OVR-weighted probabilistic engine with significant variance. [Players]

### 10.3 Match events and phases [APK]
- **Events:** Kickoff, Goal, Shot, Miss, Save, Corner, Free kick, Penalty, Yellow Card, 2nd Yellow Card, Red Card, Injury, Substitution.
- **Phases:** First Half, Half-time, Second Half, **Extra time** (two halves with a break) and **Penalties**, for knockout ties.
- **Results:** Win, Draw or Loss in league, quick and group games. Every reward table has draw entries.

### 10.4 Match report [APK]
- **Tabs:** Summary · Events · Statistics · Lineup · Feedback, plus **Watch Replay**.
- **Statistics:** possession, total shots, shots on target, shots off target, saves, corners, fouls, offsides, yellow cards, red cards, injuries, substitutions.
- **Feedback:** a rules engine writes "Positives" and "Suggestions" lines across 15 categories: bookings, captain, chemistry, corner taker, free-kick taker, penalty taker, fitness, late goals, result vs expectation (dominant draw, upset loss, smash-and-grab win, wasteful win), lineup balance, lineup completeness, positions correct, roles assigned, training vs opponent, training overall.

### 10.5 Match Preparation checklist (before League games) [APK]
Lineup · Bench · Lineup Positions · Roles · Fitness · Training (team Focus ≥ +N) · Chemistry · Opponent comparison. Together these give a **Preparation level**: Limited, Bad, Decent, Good, Great or **Perfect**.

---

## 11. Game modes

### 11.1 League [APK]
- **Format:** "Play a daily match against other users. Matches are simulated based on your Players & Strategy." **One match per day.**
- **Group stage:** Teams are ranked by points, then goal difference, goals scored and head-to-head, with a lottery as the last tiebreak. The **top 2 of each group qualify**.
- **Knockouts:** The knockout draw uses group spots **A1…H1, A2…H2**, so there are **8 groups** feeding a **16-team bracket**.

  | Round | Legs |
  |---|---|
  | Round of 16 ("1/8 Final") | home and away |
  | Quarter-final | home and away |
  | Semi-final | home and away |
  | Final | single match |

  Ties can go to extra time and penalties.
- **Rewards** depend on how far you got (Group Stage, Final 16, Quarter Finalist, Semi Finalist, Runner Up, Champion). You get only the reward for the round where you finished.
- **Records:** League history (trophy cabinet, win/loss ratio, goals) **survives the yearly reset**. [HC]
- **Tiers:** Winning the league is "the fastest way to rank up in tiers".
- Players find the group draws often feel stacked against them.

### 11.2 Quick Match [APK] [Players]
- **Energy:** Each match costs **1 Quick Match Energy**. Energy **only regenerates while you have fewer than 3**, so a full bar wastes regen time.
- **Regen rate:** players report about **7–8 hours per energy**, up from about 4 hours earlier in UFM 26.
- **Extra energy:** gems; **one extra Quick Game per day via an ad**; Quick Match Tickets; mission rewards. The cap can rise through progression, and the store screenshot shows 4/3.
- **Opponents:** asynchronous, using other managers' saved teams. One player reports getting bot opponents unless they wait an hour between games. You can **skip an opponent once per hour by watching an ad**, or use a "refresh opponent" consumable.
- **Fitness:** resets after each match (see 8.1).
- **Weekly rewards** scale with the number of wins that week. Milestones in the data include 1, 4, 8, 13, 18, 23 and 50 wins; players cite 60 and 80 for top tiers. You get the reward of your current rank only, claimable when the weekly timer ends.
- **Per-match payouts scale with tier:** each tier has its own Win, Draw and Lose reward entry for both League and Quick matches. [APK]
- **UFM 27 cut payouts:** players report about $200 per quick win and $50 per loss, down from $500 and $300 in UFM 26. [Players]
- **Purpose:** The store pitches Quick Match as a risk-free tactics lab. In practice it is the main source of income and of Weekend League qualification points.

### 11.3 Weekend League (WL) [APK]
- **Unlock:** at tier **Amateur 2**.
- **Qualification:** Earn **Qualification Points (QP)** by winning League and Quick games. Players report a threshold of **1,500 QP in UFM 27** (up from 1,000) at about **10 QP per quick-match win**. [Players]
- **Registration:** Register before the weekend timer ends, then play **15 WL games** against other qualified managers. Opponents unlock over time through Fixture Tokens.
- **Scoring:** **Win = 4 points, Loss = 1 point.** There are **10 rank tiers**, and **rank 1 needs 55 points**. Since 3W + 15 ≥ 55, that means **at least 14 wins out of 15** for the top rank.
- **Prizes:** exclusive **Weekend League** rarity cards, WL Draft Picks (82+ and 85+) and an 86+ WL Unsellable Pack.
- **Leaderboards:** WL Tier points and WL OVR.

### 11.4 Challenge Match ("Conditional Match") [APK]
- **Entry:** Build a lineup that meets the current **base conditions**, which work like a squad-building puzzle. You only face teams that meet the same conditions.
- **Scoring:** **Win = 100 points, Loss = 30 points**, multiplied by your **lineup bonus multiplier**. You raise the multiplier by fielding players who meet the **bonus conditions**.
- **Pacing:** A new opponent arrives every N hours through Challenge Match Energy.
- **Rewards and ranking:** weekly rewards at point thresholds from 500 to 5,000, plus its own leaderboard (lineup average rating).
- **Lineup:** It uses a separate per-mode lineup.

### 11.5 Friendlies and friends [APK]
The client ships push templates for:
- "Friend request accepted!";
- "Your friend has played a friendly against you!" ("You have been Friendlied");
- "Start a friendly right away!";
- "A friend just started a league!" ("Start playing together in a league right away!").

Community Missions also count "Friendly Games". UFM 26 players complained there was no friends list, while UFM 27 developer replies now promote "play with friends". The friends-and-friendlies feature is wired into the UFM 27 client.

### 11.6 Event game modes
Event modes are time-limited, for example the **World Cup mode** in June–July 2026, which used single-nation lineups. They have their own reward videos ("Gamemode #1–#12 Reward Video Pack"). Players report event lineups can trap cards, which then become unsellable until the event ends. [APK] [Players]

---

## 12. Progression systems

### 12.1 Tiers (club reputation) [APK]

| Rank | Tiers |
|---|---|
| Amateur | Amateur 1, 2, 3 |
| Semi-Pro | Semi-Pro 1, 2, 3 |
| Pro | Pro 1, 2, 3 |
| Legendary | Legendary 1, 2, 3 |

- **Earning:** You gain **Tier Points** from League and Quick wins.
- **Rewards:** Each new tier gives bigger rewards, raises the money paid per match and unlocks content: the Weekend League at Amateur 2, plus tier PTCs and tier missions.
- **After a reset:** The yearly reset puts you back to a low tier. How high you restart depends on your previous progress.

### 12.2 Missions [APK]
- **Daily and Weekly:** Daily (about 25 templates) and Weekly mission sets. Clearing all of them gives a bonus reward.
- **Mission Paths:** Linear chains with a timer. You can **skip a stuck mission with gems**, and **gems also unlock side branches**.
- **Event missions:** for every rarity event.
- **Other collections:** Achievements; Newcomer, Introduction and FTUE missions; OVR missions; tier mission collections.
- **Tracker verbs** (what missions ask you to do):
  - play, win, score or keep a clean sheet in N games;
  - play with a formation that has 3 attackers, 4 or 5 midfielders, or 5 defenders;
  - play with every player in the correct position;
  - field N English, French, German, Dutch, Swedish, Turkish or Brazilian players;
  - buy, sell or list players on the market; quick-sell a player;
  - open packs, or buy bronze, silver or gold coin packs;
  - start, complete or fully train sessions (+2 Focus);
  - replenish fitness; reach N OVR;
  - complete PTCs;
  - change formation, lineup or tactics;
  - watch N ads;
  - spend N money.

### 12.3 Community Missions [APK]
These are server-wide shared goals ("work together with others"). In a set window, every player's actions count toward tiered global targets: trainings, players bought, League, Quick, Friendly or Weekend League games played, or packs opened. When the window closes, everyone can claim the tier the community reached.

### 12.4 Player Trade Challenges (PTCs), UFM's SBCs [APK] [HC]
- **How they work:** "Trade in cards that meet the requirements of the challenge to receive new cards or packs."
- **Types:**
  - Career: an increasing-difficulty path for you as a manager.
  - Repeatable: as many times as you like.
  - Tier-unlocked.
  - Event (temporary).
  - One-time.
  - Reruns.
  - Position, team, league and nation PTCs.
  - Monthly **Player of the Month** sets: complete all of them to get the final POTM player.
  - Easy, Normal and Hard variants.
- **Requirement grammar:**
  - Properties: position, line, OVR, quality, rarity, age, height, weight, nationality, league, team, a specific player, or any individual sub-stat.
  - Aggregations: average, minimum, maximum, sum, count or distinct count.
  - Comparisons: =, ≠, >, ≥, <, ≤.
  - Compound rules: all of, at least N of, at most N of.
  - Example: "3 players need to be a striker and be rated higher than 65."
- **Rewards:** These are often **Unsellable** cards, which can be fed into further PTCs.
- **Tools:** The client has an **auto-solve** action and a "Search on Market" button for missing pieces.
- **Player view:** PTCs are both the best-liked feature and a frequent complaint, because exchange rates can be harsh (for example five 75+ cards for one 75). [Players]

### 12.5 Collection Book [APK]
- **What it is:** a book per **club (League Books)** and per **special rarity (Special Books)**.
- **Points:** You earn **Collection Points (CP)** the **first** time you obtain each card, with special rarities worth more, plus bonuses for completing a group or book. **Selling a card afterwards doesn't lose the progress.**
- **Reward track:** thresholds every 250–500 CP up to **60,000 CP**, plus unique **logos** and **badges**.
- **Other:** It has its own leaderboard and a season tracker. Players report that collection rewards can raise the energy cap. [Players]

### 12.6 Leaderboards (8) [APK]
Team OVR · Tier Points · League Wins · Weekend League Tier Points · Weekend League OVR · Collection Book Points · Challenge Match Lineup Average Rating · Challenge Match Tier Points. Top-1 and top-100 finishers earn exclusive logos.

### 12.7 Cosmetics [APK]
**Team logos** are the cosmetic layer. You earn them from events, Collection Books, PTCs and leaderboard ranks, for example "Screamer – Logo 1–3" and "Leaderboard – Tierpoints – Top 1 Logo". Logos survive the yearly reset.

---

## 13. The economy

### 13.1 Currencies [APK]

| ID | Currency | Role |
|---|---|---|
| 1 | **Money** (also called coins, cash or "$") | Soft currency. Buys coin packs and market players. Earned from matches, sales, missions and ads. **Wiped at the yearly reset.** |
| 2 | **Gems** (red diamonds) | Premium currency. Bought with real money or earned. Buys premium packs, energy, fitness, training skips, mission skips and some PTC unlocks. **Carries over between seasons.** |
| 3 | Quick Match Energy | Gates Quick Matches; cap of 3 |
| 4 | Tier Points | Club reputation |
| 5–8, 12, 14, 17 | "Videos" | Rewarded-ad slots with their own cooldowns (for example "New video available in…") |
| 9 / 10 | Team / Manager name-change tokens | One every 30 days |
| 13 / 15 / 16 | Free fitness, injury and suspension boosts | Replenishing freebies |
| 19 / 20 | Weekend League Fixture Token / Qualification Points | WL gating |
| 22 | Collection Book Points | Collection track |
| 33 | Challenge Match Energy | Challenge Match gating |
| 38 | Inactivity Welcome Back Token | Re-engagement gift for lapsed players |
| 41 | **Season Reset Tickets** | Head-start currency after the reset |
| 26 / 27 | Compensation Currency #1 / #2 | Outage and bug make-goods |
| 11, 18, 21, 23–25, 32, 36, 37, 44, 45 | Event tickets: Summer Heat, Champions, Centurions, Christmas, Carnival, Spring, TOTS, World 26, **Screamer**, **Most Wanted** | Spent in each event's shop |
| 28–31, 34, 35, 39, 42, 43, 48 | "Track" progress counters: Signup, Progressive A, Legacy, TOTS, Player Picks, World 26, Scratch, RV, Daily Login | Drive the paid and free reward tracks |
| 47 | **Season Pass Test points** | A battle pass **in development**: "Season Pass Test – Premium pass" with 30 point-skip consumables (10–300 points) is defined in the client but not live |

The HUD shows the event token (with its countdown), Money, Gems with "+", and Energy with "+". [Store screenshots]

### 13.2 Consumables [APK]
- Quick Match Ticket
- Quick Match "refresh opponent"
- **Energy Bar** (fitness)
- Training-timer reductions from 0.5 h to 10 h
- 4 h injury reduction
- 4 h suspension reduction
- Weekend League Entry Ticket and Fixture
- Challenge Match Ticket
- "Mission Complete" (an instant mission completion)

### 13.3 Packs [APK]
- **Sizes:**

  | Name | Players |
  |---|---|
  | Single Pack | 1 |
  | Mini Pack | 3 |
  | Pack | 5 |
  | Plus Pack | 7 |
  | Large Pack | 10 |
  | Grand Pack | 12 |
  | Mega Pack | 20 |
  | Ultra Pack | 24 |
  | Supreme Pack | 30 |
  | Giga Pack | 40 |
  | Draft Pick | pick 1 of N |

- **Families:**
  - Bronze, Silver, Gold, Premium Gold, Pro Gold/Silver, Elite Gold and Elite Rare (coin and gem packs).
  - "N+ Player" guaranteed-rating packs, from 65+ to 91+.
  - Unsellable packs from 75+ to 86+.
  - Position packs: Attacker, Midfielder, Defender.
  - Nationality packs: Brazil, England, France, Germany, Netherlands, Spain.
  - For every rarity event: Draft Pick, Guaranteed, Non-Guaranteed, Mega, PTC and Mission packs, plus Plus, Large, Grand, Ultra and Supreme variants.
  - Monthly POTM packs.
  - Reward-video packs.
  - The definitions cover **619 packs** in total.
- **Disclosure:** The in-game info button shows "the odds for at least 1 player in this pack" by rating band and rarity, plus "Possible Top 100 Players in this Pack". Bundles advertise "N× Special rarity player guaranteed", "pick 1 of 3", "X% chance of a {rarity} player" and "Guaranteed N+ Player".
- **Pack Assign** (27.2.0): After opening, the game shows which pulls upgrade your lineup and lets you slot them in directly. Some packs offer **a free extra player for watching an ad**.
- **Coin prices:** In UFM 27 a gold pack costs **7,500 Money** (it rose in the rebalance). [Players]
- **Odds changes:** Players report the cap on free-reward pulls dropped from 94+ to 93. [Players]

### 13.4 Transfer market [APK] [HC]
- **Who trades:** It is **player-to-player**. Every listing comes from another UFM manager, and there are no AI clubs.
- **Listing:** You set an asking price **within a minimum and maximum allowed for that card**. The server enforces this with "price too high" and "price too low" errors. Listings stay live for **24 hours**, then expire.
- **Managing listings:** You can relist one or all expired listings or remove them, up to a maximum number of active listings.
- **Fees:** **A 5% commission** is taken on every sale.
- **Quick Sell** sells instantly at the card's **minimum allowed price**.
- **Buying:** Buyers can filter by age, height, weight, league, nationality, position, rarity, rating, team (27.2.0), a specific player, price range and sub-stat. They can compare with their own players in the same position and see market statistics.
- **Locks:** Cards in any lineup can't be listed.
- **Player reports:** Liquidity is low ("nobody buys the players we list"), sale money sometimes arrives only after a restart, and resale values are poor (an 88 bought for 100k sold for 82k). [Players]

### 13.5 Shop [APK] [Store]
- **Sections:** Promotions · Packs · Premium Packs · Gems · Energy · Fitness · Free (ad rewards).
- **Merchandising labels:** "Best Buy", "Most Popular", "{N}% extra value", purchase limits ("{0}/{1} left"), limited purchase windows, and "Special Deal".
- **Event shops** sell items for event tickets. You earn tickets through: special bundles, missions, daily logins, Quick Games, the Scratch Calendar and ads. The shops have a "Spending Day" and a "Last Day".
- **Real-money catalogue** (US App Store top 10):

  | Item | Price |
  |---|---|
  | Small Pack | $1.99 |
  | Medium Pack | $4.99 |
  | Large Pack | $9.99 |
  | X-Large Pack | $19.99 |
  | Promo Bundle 3 / 15 / 27 | $9.99 each |
  | Promo Bundle 16 | $29.99 |
  | Track – Progressive A #2.3 | $4.99 |
  | Track – Rarity #2 | $9.99 |

  Elsewhere the catalogue reaches 30+ numbered Promo Bundles (up to about $44.99), Progressive and Rarity tracks, World Cup "Pick A Side" bundles and RV tracks. The top Play price point is $234.99. There is **no subscription or VIP**.
- **Tracks** are reward ladders. Each step is free or paid, and you must claim or buy the previous step to unlock the next ("Claim or purchase the previous reward to unlock this one"). Daily-login tracks and Scratch Calendars are free variants. [APK] One player tallied "nearly £60" to reach the end of a TOTY/TOTS track. [Players]

### 13.6 Ads
Rewarded video is everywhere [APK]:
- skip an opponent (once an hour);
- one extra Quick Game a day;
- −120 minutes off training;
- fitness;
- injury and suspension reduction;
- free store players;
- a free extra pack pull;
- a "multistep" chain of 4 free rewards;
- mission rewards.

The mediation stack sits behind Miniclip's **MAds** SDK and bundles about 25 networks. See section 16.

---

## 14. Live operations: events

- **Event Hub** (27.2.0): one page per rarity event. Each event is built from modules:
  - Store;
  - Missions;
  - Mission Path;
  - Challenges (PTCs);
  - Collectibles (logos);
  - Collection Book;
  - Daily Login;
  - Scratch Calendar;
  - Progressive Deal (deals that unlock as you progress);
  - Bundles.

  [APK]
- **Cadence:** a new rarity event about every 2–4 weeks; weekly TOTW, monthly POTM, plus seasonal tent-poles.
- **Recent and current events:**
  - **World Cup 2026:** 9 June new mode, 11 June Scratch Calendar, World 26, World Weekly, World Evolutions, World Champions.
  - **New Season / European Evolutions:** UFM 27 launch, Aug–Sep 2026.
  - **Shapeshifters:** Oct 2026.
  - **Screamers Event Shop:** 11–31 Oct 2026, "collect event tokens, unlock strategic player packs".
  - **Most Wanted:** defined with its own logos, tickets and daily-login track, and next in line.
- **Remote configuration:** CleverTap drives the server-side tuning (for example `Market.Rarities` and `Missions.Order`) and the in-game pop-up templates (`UFMBundlePopupTemplate`, `UFMProductPopupTemplate`, `UFMEventPlayersPopupTemplate`, `UFMProductRewardPopupTemplate`, `UFMCenterPopupTemplate`). [APK]

---

## 15. The yearly Season Reset

- **Why:** "To ensure all the authentic players of that season will be in the game." It happens each summer. The UFM 26→27 reset was 25 Aug 2026, and the next one is in summer 2027. [APK] [HC]
- **What is wiped:** your squad, which becomes a fresh team for your new tier, Money, energy, and your tier (you restart low).
- **What you keep:** **Gems, logos, specific cards** announced in-game, and **league history**.
- **Head start:** In the weeks before the reset, **Season Trackers** convert your stats into projected **Season Reset Tickets**. You spend the tickets in the **New Season Event Shop** after the reset. Limited-time missions add more tickets. The trackers measure:
  - Lineup OVR
  - Tier
  - Coin amount
  - Collection Points
  - Leagues won (championships)
  - Weekend League matches
  - Unique Rookies

  Projected tickets can **fall** if your stats drop before the reset.
- **Player experience:** The reset drove most of the 1★ reviews in Aug–Sep 2026: "95 rated team, 3,000,000 coins and everything is wiped for a bronze team"; "from 95.4 to 71.1". There were also lost-points bugs at the switch. [Players]

---

## 16. Technology stack [APK, plus job postings]

| Layer | Implementation |
|---|---|
| Engine | Unity 6000.3.8f1, IL2CPP (libil2cpp.so 72 MB), Universal Render Pipeline (URP), Vulkan quality profiles (`ufm_vkquality.vkq`) |
| In-house framework | **"Titan"**, a shared Gamebasics/Miniclip NL client framework with modules for Api, Authentication, Economy, Missions, Conditions, CollectionBook, Packs, Market, Rewards, Rarities, Unlockables, SeasonReset, Leaderboards, Consumables, CoinStacks, Collectibles, Content, Settings, Consent, Segmentation, UserSupport, Ads, Haptics, Tweening, VFX and more. UFM-specific code lives in `UFM.*` (Modes is the largest, with 223 types, followed by Players, Missions, Playstyles, LiveOps, Tiers, Economy, SeasonReset, Leaderboards and others). |
| Client↔server | `TitanApi` REST actions (277 action interfaces and about 400 action classes, such as `LeagueJoinAction`, `MarketEntryBuyAction`, `UserPlayerTrainingStartAction`, `UserChallengeAutoSolveAction`), maintenance and excluded-version handling, token suspension (bans) |
| Networking libraries | BestHTTP (HTTP/2, WebSocket, SignalR, Socket.IO), UniTask, Newtonsoft JSON, protobuf |
| Content delivery | Unity Addressables. Local bundles for view controllers, atlases, audio, scenes and ScriptableObjects; the remote catalog lives at `live-assets.footballheadcoach.com` |
| Localisation | Unity Localization, 15 locales, about 5,600 keys |
| Backend | .NET microservices on **Kubernetes**, with **RabbitMQ** messaging and a **Google BigQuery** analytics warehouse (Miniclip NL job ad, Oct 2026) |
| Store / IAP | Unity IAP 5.4.3, Google Play Billing, StoreKit |
| Platform | Google Play Games (sign-in and achievements), Sign in with Apple, Play Integrity, in-app review, in-app updates |
| Miniclip SDKs | **Bacon** (platform/consent wrapper), **OneRing**, **MAds** (ad mediation) |
| Analytics / CRM | Firebase (Analytics, Cloud Messaging, Crashlytics), **AppsFlyer** (attribution), **CleverTap** (remote config, segmentation, in-app messaging), TikTok App Events, ByteDance APM |
| Ad networks bundled | AppLovin MAX, ironSource / Unity LevelPlay, Unity Ads, Google Mobile Ads / GAM, Meta Audience Network, Pangle, Mintegral, Moloco, Liftoff/Vungle, Digital Turbine (DT Exchange/Fyber), InMobi, Chartboost, BIGO Ads, Ogury, Smaato, Verve/PubNative, HyprMX, myTarget, Yandex Ads, Tencent GDT, maio, FIVE, zMaticoo, BidMachine, Amazon APS, Tapjoy (MRAID) |
| Consent / privacy | IAB TCF v2 consent, GDPR consent, targeted-ads toggle, iOS ATT prompt ("Show targeted ads that are relevant to you"), in-game account deletion |
| Support | Zendesk (in-game request forms), a separate Miniclip moderation desk for reporting inappropriate team or manager names |

**Data collection:**
- Google Play says the app shares approximate location, installed apps and device IDs with third parties for analytics, advertising and fraud prevention.
- Apple's label lists "Data Used to Track You": Location, Identifiers and Usage Data.

---

## 17. Licensing and content database

- **Players:** Real player names and photos are licensed, on cards for Haaland, Foden, Lamine Yamal, Pedri, Gavi, Raphinha, Donnarumma, Lewandowski, Bernardo Silva and others. **Some global stars are absent**, including Messi, Ronaldo and Neymar, and some cards show a silhouette instead of a photo. [Store screenshots] [Players]
- **Clubs: a mix of licensed and generic names.** [APK]
  - Real names include Manchester City, Barcelona, Ajax, PSV Eindhoven, Feyenoord, Club Brugge, Villarreal, Flamengo, Fluminense, Atlético Mineiro, Internacional and many Brazilian clubs.
  - Others carry **colour-coded stand-in names**: "Manchester Red", "Liverpool Red", "Liverpool Blue", "Milan Red White", "Milan Black Blue", "Paris Blue Red", "Dortmund Yellow", "Barcelona Blue White".
  - The screenshots show real kits with real crests and sponsors (Etihad, Spotify) for the licensed clubs.
- **Database size** [APK]:
  - **626 unique club names** and **347 nationalities**.
  - **30 leagues**:

    | Country | Divisions |
    |---|---|
    | England | 1–4 |
    | Germany | 1–3 |
    | Spain | 1–2 |
    | Italy | 1–2 |
    | France | 1–2 |
    | Netherlands, Portugal, Belgium, Scotland, Turkey, Austria, Switzerland, Denmark, Norway, Sweden, Poland, Romania, Ireland, Argentina, Brazil, South Korea, Australia | top flight only |

- **Licensing claim:** The UFM 26-era Apple description said "officially licensed game". The current copy makes no licensing claim and names no licensor. The developer cites "licence rights" for delayed card updates. [Store] [Players]

---

## 18. Reception

**Scores:** 4.6★ on Play (35.9K) and 4.8★ on the App Store. The US Play histogram is 83% five-star and 5% one-star. [Store]

**What players praise** [Players]:
- It is **low-maintenance**: "I don't need to constantly be online to progress".
- Quick daily sessions.
- FUT-style collecting and pack excitement.
- **PTCs** and events "pay off well".
- A clean, simple UI and tactics that "don't over complicate".

**What players complain about** [Players]:
1. **Energy:** about 7–8 h per Quick Match energy, with a cap of 3.
2. **Fitness:** **1%/hour** regen, so players stay tired for days.
3. **Focus:** re-rolls downward after every league game, which makes daily training feel like a chore.
4. **Pay-to-progress after about 3–4 days**, and bigger costs at the top end, via tracks and bundles.
5. **Results feel rigged:** losses to lower-OVR teams.
6. **UFM 27 changes:** single positions, bench counting toward OVR, a higher Weekend League threshold, lower payouts and pricier packs.
7. **Season reset:** wiped squads and spent money.
8. **Thin match presentation.**
9. **An illiquid market.**
10. **Bugs:** ads that won't close, sale money missing until restart, stuck loading at 30–38%, event-lineup locks, failed scratch-calendar finales.

**Counterpoint:** "Having an 87ish rated squad after playing two weeks… I've not spent any real money"; "This game can be F2P or P2P." [Players]

---

## 19. Strategy guide (derived from the mechanics)

1. **Field every player in his preferred position.** UFM 27 cards mostly have one position, and an out-of-position player loses OVR. Use 27.2.0's position-locked bench to cover every line.
2. **Build Chemistry deliberately.** Stack one league plus one nationality plus one special rarity across the XI to push players toward +3 each, which adds up to +3 OVR **and** +3 to every sub-stat. Adjacency doesn't matter, so pick the best 11 who share tags.
3. **Train after every league match.** Focus re-rolls after each league game, so start Long trainings right after the result and claim before the next kick-off. Spread the four slots across your lowest-Focus starters.
4. **Rotate with Lineup Presets.** Training and league games cost fitness and regen is 1%/h. Keep a second preset of fresh players, and use **Frequent** auto-subs in league games to spread minutes and lower booking risk.
5. **Spam Quick Matches without fear.** They don't drain fitness. **Never sit on 3 energy**, because regen stops at the cap, and always take the daily ad for the extra Quick Game.
6. **Assign every role.** Give penalties and free kicks to your highest **SHO**, corners to your highest **PAS**, and the captaincy to a starter with high fitness.
7. **Tune tactics to your squad.** Avoid **Hard** tackling unless you have depth, because cards turn into suspensions measured in hours. Pair High pressing with a fit squad. Use the Offside trap with a high line and few defenders.
8. **Weekend League:** Rank 1 needs **14 wins out of 15**. Enter at peak Focus, Fitness and Chemistry, because each WL game is worth far more than a Quick Match.
9. **Market:** Remove cards from **every** lineup preset before you list them. Price inside the allowed band, factor in the 5% fee, and list at peak hours, because listings expire after 24 hours. Quick Sell only when you need coins immediately.
10. **PTCs:** Feed them Unsellable and duplicate cards. Check the repeatable PTCs before you quick-sell surplus.
11. **Collection Book:** First-time pulls give CP even if you sell the card later, so buy cheap missing cards to climb the CP track.
12. **The reset economy:** Coins are wiped and **gems are kept**. In July and August, convert coins into tracker progress (OVR, CP, leagues won, WL matches) to earn Season Reset Tickets, and don't buy coin-value items right before the reset.

---

## 20. Comparison with Gamebasics' other games

| | Online Soccer Manager (2001–) | Football Head Coach (2022–) | **UFM (2024/25–)** |
|---|---|---|---|
| Sport | Soccer | American football | Soccer |
| You manage | A real club (Arsenal, Real Madrid…) in a league with friends or AI | Your own franchise | **Your own club** |
| Squad source | Real club rosters; transfers | NFLPA-licensed packs and market | **Real-player packs, a P2P market and PTCs** |
| Match | Simulated | Simulated | **Server-simulated; card-based 3D replay** |
| Season | Matches real football seasons; persistent | Yearly hard reset | **Yearly hard reset** |
| Codebase | Separate (native Android) | **Titan / Unity** | **Titan / Unity** (shares FHC's CDN and SKUs) |

---

## 21. Rebuild blueprint (for this repository)

The repo is named `ultimate-football-manager-copy`. This is the minimum architecture that reproduces UFM's design, mirroring the module split the shipped client uses.

### 21.1 Core domain model
```
User ─┬─ Club (name, logo, tier, tierPoints)
      ├─ Wallet {money, gems, energy, tokens..., tickets...}
      ├─ UserPlayer[] ── Player (realId, name, nationality, league, team, positions[], age, h, w)
      │                    └─ Card (rarity, quality, ovr, PAC/SHO/PAS/DRB/DEF/PHY | GK set, sellable)
      │      state: fitness%, focus(-2..+2), injuryUntil, suspensionUntil, location
      ├─ Playstyle[≤4] (matchMode, formationId, mentality+10 sub-settings, roles{C,PEN,FK,CK}, XI[11], bench[])
      ├─ Training[4 slots] (userPlayerId, type S/M/L, start, end, rolledFocusGain)
      ├─ MarketEntry[] (userPlayerId, price∈[min,max], expiresAt=+24h, status)
      ├─ MissionProgress[], ChallengeProgress[], CollectionBook(points, claimed[])
      └─ SeasonTracker(projectedTickets, collectedTickets)
Competition: League(8 groups → R16/QF/SF two-legged → Final), QuickMatch(weekly), WeekendLeague(QP, 15 games, 4/1 pts, 10 ranks), ConditionalMatch(conditions, multiplier, 100/30)
Content (server-driven): Rarity[], Pack[] (odds tables), Challenge[] (rule trees), Mission[], Event[] (modules), Product[] (IAP/tracks)
```

### 21.2 Systems to implement, in order
1. Accounts and onboarding (guest plus platform sign-in), club creation and the starter-squad pack.
2. Card database and import pipeline (yearly ratings refresh), positions and the out-of-position penalty.
3. Lineup, formations (19), tactics (5 presets × 10 settings), roles, presets, auto-order.
4. **Effective rating:** `eff = base − posPenalty + chemistry(0..3) + focus(−2..2)`, scaled by fitness. Team OVR = weighted XI plus bench.
5. **Match simulator** (server-authoritative): turn-based event generation driven by line ratings (ATT/MID/DEF), tactic modifiers (tempo, pressing → fatigue, tackling → cards, defensive line → counter and offside risk), set-piece takers' SHO/PAS, a randomness term, injuries and cards, auto-subs, extra time and penalties. It emits the event list the client replays.
6. Fitness (−per league match and training, +1%/h, Quick Match reset) and Focus (re-roll after a league game; training gain table with good/great/super rolls).
7. League scheduler (daily fixed-time simulation), Quick Match (energy that regenerates below the cap, async opponent snapshots, weekly milestones), Weekend League, Challenge Match.
8. Economy: wallet, packs with published odds, P2P market (min/max price band, 24 h expiry, 5% fee, quick sell), shop, rewarded ads.
9. PTC rule engine (property × aggregation × comparator × compound), missions and trackers, Collection Book, tiers, leaderboards, community missions.
10. Live-ops: an event framework (store, missions, path, PTC, daily login, scratch calendar, progressive deal) and remote config.
11. Season reset: trackers, then tickets, then a wipe, then the new-season shop.

### 21.3 Legal and IP boundaries
- **Real player names and photos need licences.** UFM pays for them; the absence of Messi and Ronaldo shows they are licensed piecemeal.
- **Unlicensed club names need stand-ins**, as UFM itself does with "Manchester Red".
- **Don't reuse Miniclip/Gamebasics assets.** UFM's art, text, logos and data are copyrighted, and this repository must not contain them. Use original assets and your own (or licensed) data.

---

## 22. Sources

**Primary: the game itself**
- Google Play distribution of `com.gamebasics.ufm` **27.4.0**, versionCode 1792503486, downloaded through the APKPure mirror for static analysis only.
  - Signing certificate SHA-1 `6408b578b9d9446f5cc5c97a72c045278b7e9f94` / SHA-256 `dbfb322c9d2f876dfa33f76914d78721a8ec884673f603f6f14ec75bfbced58b`, a Google Play App Signing key created 2023-12-11.
  - The package carries the Play source stamp and "frosting" blocks.
  - It was never installed or executed.
- Extracted: Unity Localization tables (English, 5,632 strings), Addressables settings, ScriptableObject definitions and IL2CPP metadata v39 (identifiers and literals).

**Official**
- Google Play: https://play.google.com/store/apps/details?id=com.gamebasics.ufm and data safety https://play.google.com/store/apps/datasafety?id=com.gamebasics.ufm
- App Store: https://apps.apple.com/us/app/ultimate-football-manager-27/id6474134759 and lookup API https://itunes.apple.com/lookup?id=6474134759
- Help centre: https://ultimatefootballmanager.zendesk.com/hc/en-gb/
- Studio: https://gamebasics.nl/en/ · launch post https://gamebasics.nl/ultimate-football-manager-live/ · Best Studio award https://gamebasics.nl/best-studio-award/
- Miniclip careers (tech stack): https://careers.miniclip.com/job/Zoetermeer-Senior-Backend-_Net-Developer/1326633955/
- Acquisition: https://gamespress.com/Miniclip-Acquires-Dutch-Developer-of-Online-Soccer-Manager-Gamebasics
- Football Head Coach: https://apps.apple.com/us/app/id1566854514
- Trailer: https://www.youtube.com/watch?v=SoVmukGIFpM ("UFM 078 Seasonal Progress")

**Third-party**
- https://www.dutchgamesindustry.nl/game/ultimate-football-manager
- https://mobilegamer.biz/new-game-digest-honor-of-kings-a-playable-qr-code-game-new-football-manager-titles-fresh-indie-stuff-more/
- https://app.sensortower.com/overview/com.gamebasics.ufm?country=US
- https://apppricinglab.com/app/google_play/com.gamebasics.ufm
- https://mwm.ai/apps/ultimate-football-manager/6474134759
- https://ultimate-football-manager.en.uptodown.com/android/versions
- https://apkpure.com/ultimate-football-manager/com.gamebasics.ufm/versions

**Community**
- App Store review RSS feeds (GB, US, NL, AU, CA, IE, IN, NG, ZA)
- Google Play reviews in EN, NL, DE, ES, FR, IT, PT-BR and TR, with developer replies
- YouTube guide metadata (INNDY and others)
- Reddit was not reachable from the research environment.
