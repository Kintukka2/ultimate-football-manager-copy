# UFM 27 visual measurements

Raw values behind `UFMWiz_Visual_System.html` and `ufmwiz-tokens.css`. Taken on 29 Oct 2026 from Ultimate Football Manager **27.4.0**.

## Sources

| Source | What it gives | Method |
|---|---|---|
| Store screenshots, native resolution (8 × 2796×1290 iPhone, 8 × 2732×2048 iPad, 15 Google Play) | Values as rendered on screen | Region sampling (median of a box; top-decile luminance for text) and median-cut clustering (24 colours per image) |
| Android build 27.4.0 (`com.gamebasics.ufm`, versionCode 1792503486), Google Play-signed | Values as authored | Unity Addressables bundles read with UnityPy: 2,400 sprites from 29 atlases, 52 rarity frames, 4 fonts, TextMeshPro materials |
| Additional screenshots (archives, localised sets, YouTube frames) | Coverage of screens the store set doesn't show | See `SCREENSHOTS.md` |

The extracted sprites, fonts and frames were used only to take measurements. None of them are in this repository.

## Grounds (authored sprite → rendered)

| Surface | Authored | Rendered |
|---|---|---|
| Header band (`ui_frame_header_background`) | `#26251D` / `#22221B` (list header, footer, input) | `#22211C` (match report, training, market) |
| HUD bar / side panel (`ui_navigationbar_frame`) | `#0E0E0B` | `#0E0E0C` |
| Hub tile (`ui_tile_background`) | `#191815` | — |
| List row (`ui_listitem_background`) | `#423C27` / `#3C3521`, edge `#564E36` | `#3B3521`, `#413A26` |
| Selected row (`ui_listitem_background_selected`) | `#766C4E` / `#746A4C`, edge `#867D61` | `#5C553C` (tactics list) |
| Page ground outside panels | — | `#171813` |
| Panel body | `#000000` | `#030303`, `#060606` |

**Warmth.** Across the 12 interface screenshots, 80.7% of dark pixels (max channel 9–49) have R > B; mean R−B = +4.6 (n = 803,764). Non-black clusters sit at hue 40–60°.

## Buttons (authored, top / middle / bottom of sprite)

| Sprite | Shows as | Top | Mid | Bottom |
|---|---|---|---|---|
| `button_large_yellow` | gold foil | — | eleven stops below | — |
| `button_large_lightblue` | pale gold | `#F8DD84` | `#EACC75` | `#D7B664` |
| `button_large_darkblue` | olive-brown | `#574830` | `#4D3F2A` | `#423624` |
| `button_large_green` | lime | `#BFE557` | `#ADD34D` | `#97BF43` |
| `button_large_neonblue` | cyan | `#00EAF7` | `#00DBE9` | `#00C5D5` |
| `button_large_red` | red | `#F62D2B` | `#E82927` | `#D42422` |
| `button_large_purple` | purple | `#793BC5` | `#6934B2` | `#5A2D9C` |
| `button_large_gray` | grey | `#C1C2C2` | `#AFB0B0` | `#989999` |
| `button_small_gold` | gold square (HUD "+") | `#E8CE8C` | `#E4C980` | `#DFBF70` |

Gold foil, left to right across the middle of `button_large_yellow`: `#DBC59E #CBA76D #C69429 #D6B736 #ECDD6C #FEFBCA #F9F4B2 #E5D04A #D1AE31 #BE8826 #C9A971`.

Brush streak (`gold_corner`), 5th / 50th / 95th percentile by brightness: `#9C6F2D`, `#C2A473`, `#EEDCA8`.

Rendered: active tab `#F3D87F` with text `#444230`; inactive tab `#54452E` with text `#E1CA95`.

## Text (rendered)

| Role | Value | Where measured |
|---|---|---|
| Title | `#FFFFFF` | Match report, knockout rows, score |
| Gold subtitle | `#E0CA94`–`#E1CA94` | Match report, training, market (three screens, within one step) |
| Gold label | `#FCE684`, `#FDE57C` | "Possession", "FINISHED" |
| Selected tactic title | `#D8BF66` | Tactics list |
| State word | `#CECBCA` | "Inactive" |
| Ink on gold | `#444230` | Active tab |
| Ink on card metal | `#362614` (OVR), `#352510` (name), `#37250C` (stats) | Gold card, market |
| Positives / Suggestions | `#50F99D` / `#FEF750` | Match report feedback |

## Meaning sets (authored)

| Set | Values |
|---|---|
| Focus | −2 `#FF1513`, −1 `#EBB200`, 0 `#D7C690`, +1 `#00C3A0`, +2 `#79E900` |
| Chemistry level | 1 `#AFDE7E`, 2 `#46EF68`, 3 `#1DFFE1`; indicator ground `#0E4543` |
| Position glow | good `#00FD89`, near `#E57703`, wrong `#E50021`; lineup marker `#40FF66` / `#FF0000` |
| Fitness chip (rendered) | 100: `#76E055` on `#142A00`; 75: `#E09B03` on `#281C00` |
| Match bars (rendered) | home `#038390`, away `#A00000`, track `#494949` |
| Status badges | aqua `#3BDD9E`, gold `#F0DB7D`, green `#C3F756`, purple `#C27DF0`, yellow `#FFFFA1` |
| Tiers | Amateur `#D3AD8D`, Semi-Pro `#A9C4C4` / `#4894A1`, Pro `#F7CF5C` / `#CDAA42`, Legendary `#DDCFC8` / `#4D365D` |
| Strength hex | bronze `#D7793F → #ED934D → #AB5524`, silver `#C9C9C9 → #E2E2E3 → #9A9A9A`, gold `#EDC76A → #FEE09B → #DAA848` |
| Currencies | Money `#1DE994`, Gems `#EB2B44`, Energy `#AB40E8` |
| Mode frames | League `#4C3E26 → #75613B → #A08451`, Quick Match `#291839 → #3F2959 → #56397A`, Weekend League `#79861B → #475316 → #2A3611` (logo `#C6F704`) |
| Input | default `#22221B` / rim `#E9D38D`, invalid rim `#CC2222`, disabled `#3E3E3E` / rim `#727272` |
| Progress | gold fill `#E1C467`, green fill `#00B885` |

## Card frames (authored, `*_playercard_background`)

| Quality | Size | Vertical samples (6% → 92%) | Rim |
|---|---|---|---|
| Bronze | 640×854 | `#C18A60 #E6B58C #E6B58C #CD986E #C69066 #B3794F #9E5A35` | `#FFD6BD` |
| Silver | 640×854 | `#9DAFBA #C3D4DD #C3D4DD #ACBDC8 #A4B5C0 #8A9BA6 #5F727D` | `#E2EFF7` |
| Gold | 640×854 | `#CDB96D #E9DF8F #EADF90 #DDC674 #D8BE67 #C4A252 #98763A` | `#FAF9BB` |
| Gold Rare | 639×870 | `#C8A958 #E3C970 #EBD27A #E4C76F #DAB862 #C8A251 #AE853F` | `#7E5223` (inner band) |
| New Season | 689×906 | `#EADBB6 #B1935D #323030 #343434 #222021 #0D0B0B #42301C` | `#FEF9E3` |

**Silhouette** (gold frame, alpha > 50%): collar notch to 5.3% at the centre of the top edge; shoulders 1.2% at x = 40%, 11.4% at x = 2%; straight sides from 20% to 72% height at x = 1.6%; waist step to 5.8% between 72% and 80%; hem tapers from 85% to a point at 98.7%.

## Rarity chips (authored, `*_playercard_hexagon`, 86×96)

| Rarity key | Fill | Rim |
|---|---|---|
| `academics` | `#2A3F36` | `#8E5723` |
| `africacup` | `#1E721D` | `#F6DF28` |
| `autumn` | `#4A1A21` | `#E99A71` |
| `bronze` | `#DCA981` | `#C68C63` |
| `carnival` | `#003322` | `#E0AC24` |
| `centurions` | `#330209` | `#F6E4AA` |
| `champions` | `#0036B5` | `#F2CC00` |
| `championsevolution` | `#0C2250` | `#F2C800` |
| `championsfinals` | `#C1B3AA` | `#F6EAC8` |
| `christmas` | `#CA0202` | `#F2C800` |
| `clubhoppers` | `#00427D` | `#EE2244` |
| `dealmakers` | `#000000` | `#313131` |
| `england2stars` | `#FDECE0` | `#E84242` |
| `europeanevolutions` | `#004FD9` | `#BD51D9` |
| `futurestars` | `#162D50` | `#86B7D7` |
| `gamechangers` | `#1E4C33` | `#D0AF21` |
| `gold` | `#E6D687` | `#D8BA68` |
| `goldenball` | `#45290E` | `#D9B974` |
| `goldrare` | `#E8C975` | `#BE9959` |
| `harvest` | `#341806` | `#DEB659` |
| `hiddengemss` | `#401D5A` | `#FFE658` |
| `legacy` | `#F0C796` | `#8E544D` |
| `matchday` | `#1D252A` | `#F3A90B` |
| `mavericks` | `#191B1C` | `#9C9C9C` |
| `missingstars` | `#23265D` | `#C96EED` |
| `mostwanted` | `#121C1D` | `#DB748B` |
| `neon` | `#270691` | `#CF1CE7` |
| `newseason` | `#1F1F1F` | `#D1BD9D` |
| `newyear` | `#846CAC` | `#3F347F` |
| `platinum` | `#111926` | `#DBFFFF` |
| `playerpicks` | `#011911` | `#7BEFB2` |
| `potm` | `#121C1D` | `#B39EE9` |
| `ptc` | `#170E08` | `#CBAE66` |
| `recordbreakers` | `#2E1F28` | `#E94242` |
| `screamers` | `#3B1A3A` | `#424169` |
| `shapeshifters` | `#103E3B` | `#8BAABD` |
| `silver` | `#BBCCD5` | `#9EB2BB` |
| `spring` | `#37C1FE` | `#D6EF00` |
| `starter` | `#002233` | `#43B66E` |
| `summerheat` | `#B9E39E` | `#F7DF88` |
| `superheroes` | `#0B2040` | `#9F9F9F` |
| `tots` | `#011612` | `#E7D17F` |
| `totw` | `#121C1D` | `#E9CF33` |
| `toty` | `#232B3F` | `#EED32C` |
| `totynominees` | `#1A416D` | `#E7C879` |
| `transferstars` | `#011529` | `#4DEDD8` |
| `veterans` | `#584022` | `#C89F6E` |
| `weekendleague` | `#121C1D` | `#ABC96B` |
| `world26` | `#507695` | `#E8E8E8` |
| `world26champions` | `#2A170B` | `#EEE874` |
| `world26evolutions` | `#34548E` | `#EEEEBB` |
| `world26weekly` | `#0A0A08` | `#2E6EBB` |

## Fonts (embedded name tables)

| File | Family | Designer / foundry | Licence |
|---|---|---|---|
| `BebasNeuePro-Bold` | Bebas Neue Pro Bold, v1.000, © 2019 | Ryoichi Tsunekawa, Dharma Type | Commercial |
| `RobotoCondensed-Bold` | Roboto Condensed Bold, v2.137 | Christian Robertson, Google | Apache 2.0 |
| `Downstairs` | Downstairs Regular, v1.00, Nov 2021 | Anang F & Malik Wsn, Gassstype Studio | Commercial |
| `NotoSansArabic-Bold` | Noto Sans Arabic Bold, v2.004 | Monotype | OFL 1.1 |

**Free substitutes**, by mean glyph intersection-over-union at matched cap height:
- Bebas Neue Pro caps → Bebas Neue 0.977 (width ×1.00); Fjalla One 0.841.
- Bebas Neue Pro lowercase → Sofia Sans Extra Condensed 700 0.874 (×1.02); Saira Extra Condensed 700 0.814.
- Roboto Condensed Bold → Roboto Condensed 700 0.988.
- Downstairs → Sedgwick Ave Display 0.352. No usable match.

## TextMeshPro materials (authored)

| Material | Face | Outline | Underlay |
|---|---|---|---|
| `BebasNeuePro-Bold SDF Material` | white | — | black α 0.25, offset Y −0.2, dilate 0.03, softness 0.2 |
| `RobotoCondensed-Bold SDF Material` | white, dilate 0.02 | — | black α 0.25, offset Y −0.2, dilate 0.03, softness 0.2 |
| `RobotoCondensed-Bold SDF Material_Pack` | white | black α 0.7, width 0.02 | black α 0.25, offset Y −0.97, softness 0.2 |
| `Downstairs Atlas Material` | white, dilate 0.02 | black α 1, width 0.048 | black α 1, offset Y −0.167, dilate 0.106 |

## Naming note

UFM 27's UI kit keeps Football Head Coach's sprite names under a new skin. `button_large_darkblue` is olive-brown, `button_large_lightblue` and `button_hexagon_lightblue` are pale gold, and `button_large_neonblue` is cyan. The Addressables remote catalog is served from `live-assets.footballheadcoach.com`.
