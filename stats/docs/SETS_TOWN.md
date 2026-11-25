# School sets — `scenes/sets_town.js`

**OAKHILL MIDDLE SCHOOL — the Owls.** A red-brick two-storey school with a cream columned entrance (pediment clock,
cupola + owl weather vane), a letter-board marquee and a yellow bus out front. Inside: cream walls over **violet + sage
double-stacked lockers**, a lilac checker floor, **purple + gold** school colours and the **owl face** as the logo (the
owl that "sees everything" — fits the stats theme). Mrs. Krump's Room 12 is dusty blue with a green **chalkboard** and oak
desks; the gym is pale-lilac block with purple wall mats and a hanging scoreboard; the cafeteria is sage with a letter-board
menu. Contact sheet: `concept/sets_town.png` (`node tools/sheet_town.js`; the hero, s .5, stands on the FLOOR lines;
`--only key1,key2`, `--full DIR` for full-size tiles, `--noref` hides the hero).

```js
const ST = require('./sets_town');           // DEFS are loaded by main.js automatically (ids prefixed `st`)
const { FLOOR, SPOTS } = ST;
```

## Conventions

- Every set is drawn in **world space** for the 1920×1080 frame (camera at rest = the frame), padded far past the
  edges: pans of ±600 px and zoom-outs to ~.5 never show a gap (the hallway runs x −3300…5600).
- `t` (absolute seconds) only drives idle motion (clouds, flag, banners, hamster wheel, steam, mystery-meat bubbles,
  crowd bob/chatter, walking extras, bus wheels). **Pass a constant `t` to freeze it.**
- **Room sets** (`mirror`, `classroom`, `gym`, `cafeteria`): `set(t, o)` returns everything composited at k 1;
  `set.layers(t, o)` → `{ bg, mid, front, fg, light, frontRows }`:

| layer | what | draw with |
|---|---|---|
| `bg` | seen through the windows (sky, yard) | `view(cam, bg, 0.6)` |
| `mid` | the room: walls, floor, back furniture, cheap crowd, floor light patches | `view(cam, mid, 1)` |
| *characters of row i* | drawn just **before** `frontRows[i]` | |
| `frontRows[i]` | furniture fronts, back → front (table fronts, counters, the mirror frame) | `view(cam, …, 1)` |
| `front` | all `frontRows` joined | |
| *characters on the FLOOR line* | | |
| `fg` | occluders close to the camera ('' except the mirror's `face` frame) | `view(cam, fg, 1)` |
| `light` | special light only (cafeteria quiet spot, mirror flicker) — usually '' | `view(cam, light, 1)` |

- **`set.compose(t, o, between, after, cam)`** does the interleaving: `between` = svg or an array (one per front row,
  back → front), `after` = FLOOR-line characters; with `cam` it applies the camera (bg at parallax .6, the rest at k 1).
  Characters are passed in world coordinates.
- **Camera sets** (`hallway`, `schoolExterior`) take the camera: `set(t, cam, o)`; `set.layers(t, cam, o)` returns
  `{ bg, mid, front, fg, light }` **already transformed** (parallax inside); **`set.compose(t, cam, o, back, after)`**
  slots world-space characters in (`back` before `front`, `after` before `fg`). Draw your own world-space extras with
  `K.view(cam, svg, 1)`.
- `FLOOR[set]` = feet y of the main stand line (s .5 there); `SPOTS[set]` = anchors with a recommended `s`
  (`scaleAt(y)` where depth matters); `SPOTS[set].cams` = ready framings `{x, y, zoom}` for `K.camKeys` / `K.view`.
- Helpers: `camAt(x, y, zoom, sx = 960, sy = 540)` → a cam putting world (x, y) at screen (sx, sy);
  `toScreen(cam, x, y, k)` → `[sx, sy, zoom]` (place HUD plates/tooltips over world anchors); `camTf(cam, k)` (= `K.E.camTf`);
  `viewRect(cam, k, pad)` → visible world rect `[x0, x1, y0, y1]`.
- **Plates:** walls are kept calm in the band just above head height (stand-line heads top out at y ≈ 485 for s .5 at
  y 960; plates float at ≈ 330–470). Busy decor sits higher (y < 330) or between the stand spots.

```
FLOOR: hallway 960 · hallwayDeep 960 · mirror 1460 (hero from behind) · classroom 1082 (front row, seated) ·
       gym 960 · fair 1060 · cafeteria 1000 (the lane) · schoolExterior 960 (sidewalk)
```

---

## 1. `hallway(t, cam, o)` — camera-taking, parallax (SC01 cold open, SC02 Benji/Tank, SC04)

### view `'side'` (default) — the locker wall; pan along x

Cream wall with a purple/gold cove, drop ceiling with fluorescent panels, **violet + sage locker banks** (y 470…800,
some with open doors and stickers), a checker floor in perspective (its vanishing point follows the camera).
World map (k 1): courtyard windows −2840…−1500 (bench under them) · **ROOM 10** (science lab) −1240 · bulletin board
−650 (LOST: GERALD hamster, CHESS CLUB, BAKE SALE) · hall clock 955 + "HOMEWORK IS DUE. — K." · **ROOM 12 · MRS. KRUMP
1190** · fountain/bottle filler 1995 · **trophy case HALL OF FAME 2130…2730** · DODGEBALL / READ posters · **BOYS
restroom 3920** · CAFETERIA → sign 4560 · OWLS SEE EVERYTHING poster 5300.

**Draw order:** `bg` (courtyard, k .5) · `mid` (k 1: wall, lockers, doors, floor, cheap crowd) · *back-line
characters* · `front` ('') · *main/front-line characters* · `fg` (hanging GO OWLS! banners k 1.12 + foreground pillars
k 1.3) · `light`. → `hallway.compose(t, cam, o, backLine, mainLine)`.

| SPOTS.hallway | value | notes |
|---|---|---|
| `scaleAt(y)` | `.5 (y + 140) / 1100` | 850 → .45 · 960 → .5 · 1050 → .54 |
| `lines.back / main / front` | y 850 s .45 · y 960 s .5 · y 1050 s .54 | students walking: back line along the lockers |
| `walk` | x −3100…5400, y 960, s .5 | Tank's walk / Max's run line |
| `walkers[7]` | x −600…2500 on y 880 / 960 | ready positions for plated students |
| `krumpDoor` | (1190, 812) s .433, door top 246 | Mrs. Krump in the doorway (`doorOpen: 1`) |
| `krumpOut` | (1250, 905) s .475 | stepped out into the hall |
| `room10Door` / `restroomDoor` | (−1240 / 3920, 812) s .433 | `restroomOpen` opens the BOYS door (tiles + stall inside) |
| `fountain` | (1960, 840) s .445 | drinking from the bottle filler |
| `trophy` | (2430, 330), case x 2130…2730 | |
| `bench.seats[3]` | x −2330 / −2170 / −2010, y 858, s .44 | hips on the bench (use a sitting pose) |
| `clock`, `posters.{scienceFair, homework, lostHamster, beKind}`, `windows[3]` | | |

cams: `wide` {0,0,1} · `krump` camAt(1190, 560, 1.45) · `krumpClose` camAt(1220, 470, 2.1) · `room10` ·
`trophy` camAt(2430, 520, 1.35) · `restroom` camAt(3920, 560, 1.25) · `windows` camAt(−2170, 520, 1) ·
`long` camAt(1100, 560, .62) (a long stretch, crowds) · `low` camAt(960, 760, 1.25) (feet/legs) · `pan[2]` (x −800 → 2600).

### view `'deep'` — one-point perspective down the hall (Tank walks down the middle, kids scatter)

Vanishing point (960, 420). Both walls of lockers, Krump's door (left wall, opens with `doorOpen`), ROOM 14 (left), the
trophy case + bottle filler + BOYS door (right), a **GO OWLS!** banner across the hall, the bright double doors + EXIT at
the far end, ceiling panels, checker floor with a light streak. Characters scale with depth:
`SPOTS.hallway.deep.scaleAt(y) = .5 (y − 420) / 540` (y 960 → .5). Draw back → front (sort by y).

| SPOTS.hallway.deep | value |
|---|---|
| `at(D, off)` | floor point `{x, y, s}` at depth D (0.4 near … 5.9 far; 1.41 = s .5), `off` sideways (±820 = the walls) |
| `centre` | x 960, y 600…1060 — Tank's line |
| `tankStart / tankMid / tankEnd` | (960, 585) s .153 · (960, 800) s .352 · (960, 1028) s .563 |
| `krumpDoor` / `krumpOut` | (586, 826) s .376 / (671, 842) s .391 |
| `restroomDoor` | (1149, 625) s .19 |
| `maxRun[2]` | (1078, 593) s .16 → (544, 1028) s .563 — Max runs diagonally toward the camera |
| `wallL(D)` / `wallR(D)` | where kids press against the lockers at depth D |

cams: `deep` {0,0,1} · `deepPush` camAt(960, 560, 1.4) · `deepKrump` camAt(660, 620, 1.9) · `deepLow` camAt(960, 700, 1.15).

**Options:** `view`, `doorOpen 0..1` (Room 12; warm light spills onto the floor), `restroomOpen 0..1`,
`crowd 0..1` (cheap students: at the lockers / walking on the back line; deep: along both walls + a few walkers),
`scatter 0..1` (students press against the lockers, arms up, O mouths, looking at the middle — Tank's walk),
`pillars` (side, default true), `banner` (text, default 'GO OWLS!'), `clock` ('8:05').
`hallway.crowdAt(t, o)` returns the cheap crowd's `[{x, y, s, …}]` so you can put plates over them too.

## 1b. `mirror(t, o)` — the boys' room (SC01 "???")

**`view: 'over'`** (default): over the hero's shoulder into a long wall mirror (glass x 300…1620, y 110…620) above a
counter with two sinks; sage tiles with a purple band, a fluorescent fixture (`flicker`), soap, paper towels, a sticky
note on the glass ("YOU LOOK GREAT :)" — `note: false` or your own text). The mirror shows the reflected restroom
(stalls, hand dryer, door). **The reflection is yours to draw**: a flipped hero, clipped by the static clip path:

```js
const M = ST.SPOTS.mirror, r = M.reflection;
const refl = S.g(S.g(actor('you', t, { x: r.x, y: r.y, s: r.s, face: 'confused' }), `translate(${2 * r.x} 0) scale(-1 1)`), null, { 'clip-path': `url(#${M.clip})` });
o += ST.mirror.compose(t, {}, [refl], actor('you', t, { ...M.hero }), cam);   // mid · reflection · frame · counter · hero
// then the "???" plate at toScreen(cam, M.qmarks.x, M.qmarks.y)
```

Order: `mid` · *reflection (clipped)* · `frontRows[0]` (frame, glare, note) · `frontRows[1]` (counter, sinks) ·
*hero from behind* · `light`. The clip works under any camera as long as the reflection is in the same camera group.

**`view: 'face'`**: the camera IS the mirror — the hero faces us across the sink, the restroom (stalls, door, hand dryer,
WASH YOUR HANDS) behind him; the steel mirror frame rims the screen (`fg`). Order: `mid` · *hero* · `front` (counter edge
+ faucet) · `fg` (frame) · `light`.

| SPOTS.mirror | value |
|---|---|
| `hero` | (560, 1460) s .82 `view: 'back'` — back of his head bottom-left |
| `reflection` | (1030, 780) s .52 `flip: true` — head ≈ y 285…500 inside the glass |
| `qmarks` | (1030, 215) — "???" above the reflection |
| `clip` / `glass` | `'stMirrorClip'` / x 300…1620, y 110…620 |
| `sink` / `sinkR` | (600, 650) / (1320, 650) |
| `face.hero` / `face.qmarks` | (960, 1090) s .7 / (960, 330) |

cams: `over` · `reflection` camAt(1030, 400, 1.7) · `qmarks` camAt(1030, 300, 2.2) · `face` · `faceClose` camAt(960, 560, 1.35).
Options: `view`, `flicker 0..1`, `note` (text | false).

---

## 2. `classroom(t, o)` — Room 12, Mrs. Krump (SC04, SC07)

One wide view: the **green chalkboard** (x 70…870, y 130…460) + **Mrs. Krump's oak desk** (front-left: apple, a tall
HOMEWORK pile, MRS. KRUMP nameplate, a PATIENCE mug, red pens, a pointer), CLASS RULES poster ("1. BE ON TIME · 2. NO
EXCUSES · 3. SEE RULE 2"), clock, three windows with half-down blinds (the yard = `bg`, k .6), **Gerald the hamster** on
the sill (wheel spins with `t`), a bookshelf, three rows of **paired student tables** (kids face the camera — turn them a
little toward the board with `turn: −0.3`), the **MATHLETES** smart kids' table off-frame right (pan to `cams.smart`).
Tables have full front panels, so seated kids are hidden from the belly down. Wall/floor junction y 700.

**Order:** `mid` · row-3 kids · `frontRows[0]` (row-3 tables + row-2 chairs) · row-2 kids **+ the teacher behind her
desk** · `frontRows[1]` (row-2 tables, her desk, row-1 chairs, smart chairs) · row-1 kids **+ smart kids** ·
`frontRows[2]` (row-1 tables + the smart table) · *FLOOR line: `teacherFront`* · `light`.

```js
const C = ST.SPOTS.classroom;
o += ST.classroom.compose(t, { quiz: true }, [row3, row2 + actor('teacher', t, { ...C.teacher }), actor('you', t, { ...C.heroDesk }) + actor('benji', t, { ...C.benjiDesk })], '', cam);
```

| SPOTS.classroom | value |
|---|---|
| `rows[3][6]` (back → front) | row 3: tables 1100/1660/2220, top 640, seats y 783 s .34 · row 2: tables 840/1380/1940, top 748, seats y 924 s .42 · row 1: tables 1100/1660/2220, top 872, seats y 1082 s .5 (2 seats per table, ±112·k) |
| `seats` | flat list |
| `heroDesk` / `benjiDesk` | (988, 1082) / (1212, 1082) s .5 — front row, shared table, right by the teacher |
| `dogKid` | (1474, 924) s .42 — "My dog ate it!" (row 2, visible between the hero and the right table) |
| `smartTable` | x 2780, top 820; `seats[3]` x 2624 / 2780 / 2936, y 1013, s .46 |
| `teacher` | (370, 930) s .5 — standing behind her desk (desk top y 768) |
| `teacherFront` | (760, 1000) s .52 — in front, by the board (draw after `frontRows`) |
| `teacherDesk` | x 110…640, top 768; `homework` (276, 690), `apple`, `mug` |
| `board` / `boardPoint` | text centre (470, 295), x 70…870, y 130…460 / pointer tip (820, 330) |
| `quizPaper` | (988, 860) — the hero's pop quiz (DIFFICULTY: IMPOSSIBLE tooltip) |
| `clock` (1020, 120) · `hamster` (2460, 490) · `window` (1850, 340) | |
| `outside` | (1900, 560) s .18 **in bg space** — the yard bench seen through the windows (pass svg via `o.outside`) |

cams: `wide` · `room` camAt(1340, 560, .72) · `teacher` camAt(470, 480, 1.3) (board + teacher) · `teacherClose`
camAt(380, 600, 1.9) · `board` camAt(470, 300, 1.75) · `heroDesk` camAt(1100, 760, 1.6) (hero + Benji) · `heroClose` /
`benji` (zoom 2.3) · `dogKid` camAt(1474, 650, 1.9) · `quiz` camAt(988, 840, 3) · `smart` camAt(2780, 740, 1.5) ·
`window` camAt(1850, 380, 1.4).

**Options:** `board: [lines]` (chalk; 1 line huge, 2–4 lines with an underlined title; default
`['HOMEWORK', 'ON MY DESK.', 'NOW.']`; with `quiz` → `['POP QUIZ!', '20 QUESTIONS']`) — e.g. SC07
`['SCIENCE FAIR', 'PARTNERS:', 'CHOOSE WISELY.']`; `quiz` (papers + pencils on every table); `clock` ('9:15');
`outside` (svg in the window view, bg space — e.g. Benji alone on the yard bench for SC07's "through the glass");
`blinds 0..1` (default .3); `hamster` (default true).

---

## 3. `gym(t, o)` — dodgeball / SCIENCE FAIR (SC04, SC07, SC11)

Across the court: pale-lilac block wall with a purple/gold stripe, **purple wall mats**, steel trusses with caged lamps,
grilled clerestory windows, **CHAMPS 2019 / 2023** banners, the hanging **scoreboard** (HOME/GUEST, 2:00, period),
pulled-out **bleachers** at the left with a cheap crowd, a climbing wall + hoop + LOCKERS door at the right. Maple floor
(junction y 680) with the purple centre line (x 960), attack lines, the gold **OWLS** centre circle, foam balls on the
centre line and a ball cart. Light shafts from the windows are in `mid` (behind the players).
`scaleAt(y) = .5 (y + 40) / 1000`.

**Dodgeball order:** `mid` (+ bleacher crowd) · *everyone on the court* · `light`. (`frontRows` are empty here.)

| SPOTS.gym | value |
|---|---|
| `teamA[4]` | (200, 1010) .525 · (430, 935) .488 · (660, 1000) .52 · (320, 862) .451 — face right: `view: 'side', flip: true` |
| `teamB[4]` | (1720, 1010) · (1290, 940) · **(1520, 1000) = hero** · (1600, 862) — face left |
| `hero` | (1520, 1000) s .52 |
| `lineup[6]` | x 520…1470 (step 190), y 840, s .44 — kids against the mats waiting to be picked (SORT BY STRENGTH) |
| `captain` | (1660, 1030) s .535 — the hero picking (`view: 'side'`, pointing left) |
| `coach` | (70, 990) s .515 — by the ball cart |
| `bleachers[4]` | seated spots on the tiers (hips), s .36….32 |
| `scoreboard` (960, 220) · `centre` (960, 905) · `hoop` (2640, 342) | |

cams: `court` · `wide` {0, −60, .8} · `teamA` camAt(440, 640, 1.5) · `teamB` camAt(1480, 640, 1.5) · `lineup`
camAt(1000, 580, 1.25) · `hero` camAt(1520, 620, 1.9) · `scoreboard` camAt(960, 230, 2) (VICTORY!) · `bleachers`.

**Options:** `scoreboard: ['HOME', '3', 'GUEST', '0']` or text (`'VICTORY!'`), `clock` ('2:00'),
`balls: 'line'` (default) | `'scatter'` | `false`, `crowd 0..1` (bleacher kids, default .8), `cheer 0..1` (bleacher kids
arms up, O mouths).

### `fair: true` — the SCIENCE FAIR

A big **OAKHILL SCIENCE FAIR** banner replaces the scoreboard (pass `scoreboard` to keep it), bunting along the walls,
a back row of 7 project tables (tri-folds: crystals, magnets, volcano, solar system, plants, plants + music, do fish
sleep?) with parents walking the aisle (cheap crowd, `parents 0..1`), and the front row: **POTATO POWER!** (the hero +
Benji: two potatoes, copper/zinc strips, wires, a tiny bulb with `bulb 0..1` glow — default .25 "kind of"), and the smart
kids' **QUANTUM PHOTO-** table (dark cloth, LED strip, laptop graph, molecule model, spinning mini turbine).

**Order:** `mid` · back-row exhibitors (`backKids`) · `frontRows[0]` (back tables + walking parents) · *aisle people* ·
*front-table kids (standing behind the tables, at the ends beside the tri-folds)* · `frontRows[1]` (front tables) ·
*FLOOR line (judge, visitors)* · `light`. → `gym.compose(t, { fair: true }, [backKids, frontKids], judge, cam)`.

| SPOTS.gym.fair | value |
|---|---|
| `potato` / `bulb` | table x 620, top 890 / bulb (729, 768) — LIGHT tooltip, glow |
| `heroFair` / `benjiFair` | (400, 1060) / (850, 1060) s .5 — behind the potato table, at its ends |
| `smart` / `smartKids[3]` | table x 1420, top 890 / (1100, 1060) · (1740, 1060) · (1880, 1075) |
| `judge` | (990, 1070) s .53 — between the tables, in front |
| `aisle` | y 862, s .451 — parents' walk line |
| `backKids[7]` | behind the back-row tables, y 841, s .38 |

cams: `fair` · `potato` camAt(620, 720, 1.7) · `bulb` camAt(729, 768, 3.2) · `smart` camAt(1420, 700, 1.6) · `aisle`.
Options: `fair`, `bulb 0..1`, `ribbon: 'potato' | 'smart' | false` (blue 1st ribbon), `parents 0..1`, `crowd` (bleachers, default .35).

---

## 4. `cafeteria(t, o)` — lunch, Tank's reveal (SC01 lunch lady, SC02, SC04 food stats, SC05, SC11)

Sage walls over a purple/gold chevron frieze and white tiles, three tall arched windows (left, `bg` = the yard), the
**FUEL UP, OWLS!** mural, clock, recycle/trash bins; the **lunch line** on the right: kitchen pass-through (cans, ladles,
a steaming stock pot), the **TODAY'S LUNCH** letter board (PIZZA · $2 / BROCCOLI · FREE / MYSTERY MEAT · ???), a steel
counter with a sneeze guard and the pans — **rectangle pizza, broccoli, MYSTERY MEAT** (grey lumps, popping bubbles,
green stink lines), mash, corn — with name tents (the meat's says "???"). Doors with porthole windows + EXIT far right.
Three long tables with attached benches: far (always-on cheap crowd, chatting), back, front (**YOU + Benji** at the
right end, trays in front). Tank walks in along the **lane** (y 1000) from the right and stops at the end of the table.

**Order:** `mid` (+ far table and its crowd) · back-table kids · `frontRows[0]` (back table) · front-table kids ·
`frontRows[1]` (front table + trays) · lunch lady · `frontRows[2]` (counter) · *lane: Tank, line kids* · `light`.
→ `cafeteria.compose(t, o, [backKids, heroAndBenji, lunchLady], tankAndLine, cam)`.

| SPOTS.cafeteria | value |
|---|---|
| `heroSeat` / `benjiSeat` | (760, 1084) / (540, 1084) s .5 — front table top 874 |
| `seats.front[7]` / `seats.back[5]` | y 1084 s .5 (x −1080…760) / y 920 s .4 (x −120…860) |
| `tray.{pizza, broccoli, meat, milk, sandwich}` | (707, 846) · (790, 852) · (845, 848) · (895, 842) · (640, 846) — the hero's tray (tooltips: +20 HAPPINESS, +50 HEALTH −50 FUN, ???) |
| `food.{pizza, broccoli, meat, potato}` | (1360, 670) · (1580, 656) · (1800, 650) · (2020, 664) — tops of the pans on the counter |
| `lunchLady` | (1730, 885) s .47 — behind the counter, right over the mystery meat (LV 50 · SECRET SKILL) |
| `line[4]` | x 1380…2040, y 940/950, s .47 — kids queuing in front of the counter |
| `lane` | x −1200…3000, y 1000, s .5 |
| `tankPath[3]` / `tankStop` | (2900 → 1900 → 1080, 1000) / (1080, 1000) — Tank looms at the table end, the hero at 760 |
| `doors` | (2880, 644) |

cams: `wide` · `room` {300, −40, .8} · `table` camAt(700, 780, 1.6) · `heroClose` camAt(760, 700, 2.3) · `tray`
camAt(780, 850, 3) · `tank` camAt(980, 560, 1.3) (Tank + the table) · `tankLow` camAt(1080, 640, 1.6) · `line`
camAt(1700, 580, 1.35) · `food` camAt(1580, 640, 2.2) · `meat` camAt(1800, 630, 2.8) · `lunchLady` camAt(1740, 560, 1.7).

**Options:** `quiet 0..1` — **the noise drops** (SC05): the room behind fades/dims toward lilac-grey, the far/back
crowd stops talking and looks right (at Tank), the counter dims, the window light softens and a soft warm pool + beam
falls on `tankStop` (animate 0 → 1 over ~1 s on "Then you saw it"); `crowd 0..1` (cheap kids, default 1), `trays`,
`heroTray` (default true), `steam`, `menu: [title, …lines]`, `clock` ('12:05').

---

## 5. `schoolExterior(t, cam, o)` — the front of the school, morning (SC04 "School was a whole new game")

Peach-and-blue morning sky with a low sun (left), drifting clouds and birds, the town + the **OAKHILL water tower**
peeking over the roof, trees behind, the brick school (two rows of white-framed windows), the cream entrance pavilion
(OAKHILL MIDDLE SCHOOL frieze, pediment clock, 4 columns, purple doors, steps), the cupola + owl weather vane, the owl
flag, hedges, the **marquee** (WELCOME BACK OWLS! / SCIENCE FAIR FRI), the yellow bus in the bus loop (right), a bike
rack, big trees on the lawn, the walkway, the sidewalk (stand line y 960) and the street. Strong perspective:
`scaleAt(y) = .5 (y − 425) / 535` (door .164 · marquee .27 · bus door .27 · sidewalk .5).
Parallax: sky k 0 · sun .04 · clouds/birds .1 · town + water tower .3 · trees behind the roof .65 · school/grounds 1 ·
foreground bushes 1.3. **Order:** `bg` · `mid` · *back* · `front` ('') · *after* · `fg` · `light`.

| SPOTS.schoolExterior | value |
|---|---|
| `sidewalk` | x −2400…4200, y 960, s .5 |
| `walkway` | x 960, y 610 (doors) … 990 (sidewalk) — scale with `scaleAt` |
| `door` | (960, 600) s .164 — at the top of the steps |
| `marquee` | post base (420, 760); text centre (420, 650) |
| `bus` / `busDoor` | (1960, 700) / (1580, 712) s .268 — kids getting off |
| `flag` | (300, 20) |

cams: `front` {0,0,1} · `establish` {0, −140, .75} (whole school + cupola + sky) · `sky` camAt(960, 60, 1) ·
`cupola` camAt(960, 0, 2) · `door` camAt(960, 470, 1.8) · `marquee` camAt(420, 620, 1.9) · `bus` camAt(1900, 560, 1.35) ·
`sidewalk` camAt(960, 800, 1.3).

**Options:** `time: 'morning'` (default) | `'day'`, `crowd 0..1` (kids walking up the walkway, along the sidewalk and at
the bus door; default .6), `bus` (default true), `busX` (offset — drive it in/out), `marquee: [line1, line2]`, `flag`.
`schoolExterior.crowdAt(t, o)` returns the walking kids for plates.

---

## Cheap people — `people(list, o)`

Background R6 kids/adults drawn as a few colour-bucketed paths (sizes in rig units: a person at s matches a rig
character at s; head top ≈ `y − 900 s` for kids, `y − 1020 s` for adults). Used by every set's crowd and available to
scenes:

```js
ST.people([{ x, y, s, i, kind: 'kid'|'adult', pose: 'stand'|'walk', ph, speed, view: 'front'|'back', arms: 'down'|'up'|'wave',
             look: -1..1, mouth: 'smile'|'o'|'line'|'talk', lean, top, pants, hair, hairStyle }], { t, dim, dimCol, quiet, look, scared })
ST.crowdRow(x0, x1, y, s, { dx, seed, density, jit, gaps, kind, pose, view })   // deterministic row of people
```

## Props (exported)

`owl(x, y, s)` (logo) · `icon(kind)` (volcano, heart, hamster, ball, book, star, potato, atom, owl, arrow, chess, cupcake) ·
`poster(lines, x, y, {w, h, col, ink, head, icon, size, rot})` · `wallClock(x, y, r, '8:05', {t, rim})` ·
`lockerBank(x0, n, top, bot, {col: 'v'|'s', open, stickers})` · `hallDoor(x, base, {open, label, name, restroom})` ·
`trophy(kind, x, y, s)` / `trophyCase(x0, x1, top, base)` · `chalkboard(x0, y0, w, h, lines)` ·
`studentTable(cx, top, k, {quiz})` → [chairs, front] · `teacherDesk()` · `triFold(x, top, k, kind, t)` ·
`potatoBattery(x, top, k, bulb)` · `fairTable(cx, top, k, kind, t, {w, cloth, ribbon})` · `foamBall(x, y, r, col)` ·
`scoreboard(x, y, {scoreboard, clock})` · `lunchTable(x0, x1, top, k)` · `tray(x, y, k, items, t)` ·
`schoolBus(x, y, s, t)` · `marquee(x, y, s, lines)` · `tree`, `bush`, `cloud`, `bird`, `sunDisc`, `glow`.

## Shot guide (script → set)

- **SC01** cold open: `hallway` side `crowd: .8` + plated students on `walkers`/`lines`; Mrs. Krump at `krumpDoor` with
  `doorOpen` 0 → 1 (`cams.krump`); Tank down the middle in `view: 'deep'` with `scatter` 0 → 1 (`tankStart` → `tankEnd`,
  `cams.deepPush`); Max on `deep.maxRun` or the side `walk` line (whip-pan with `cams.pan`); the lunch lady in
  `cafeteria` `cams.lunchLady`; the mirror in `mirror` (`cams.reflection` push-in, then `view: 'face'` for the shout).
- **SC02** Benji tripping in the hallway (`lines.main`) and Tank taking lunch at the `cafeteria` table (`tank` framing).
- **SC04** `schoolExterior` (`establish` → `front`), `classroom` (`teacher`, `dogKid`, `quiz`, `heroDesk`), `gym`
  (`lineup` + `captain`, `teamA/teamB`, `scoreboard: 'VICTORY!'`), `cafeteria` (`food`, `tray`, `meat`).
- **SC05** `cafeteria`: `tank` / `tankLow` framings, `quiet` 0 → 1, `tray.sandwich` for the hand-over.
- **SC07** `classroom` board `['SCIENCE FAIR', 'PARTNERS:', 'CHOOSE WISELY.']`, Benji waving from `benjiDesk`, pan to
  `cams.smart`; "through the glass": draw Benji alone on the yard bench via `o.outside` (`SPOTS.classroom.outside`).
- **SC11** `gym` `fair: true` (`cams.potato`, `bulb` .15 → .3 flicker), `cafeteria` (Tank sits at `seats.front`).

## Performance (1920×1080, set only, headless Chromium, `node tools/sheet_town.js --noref`)

| set / framing | build ms | render ms |
|---|---|---|
| hallway side, crowd .8–1 (wide / krump / scatter) | 3–5 | 27–49 |
| hallway side `cams.long` (zoom .62, crowd 1) | ~4 | ~25–30 |
| hallway deep (crowd, scatter, push) | ~2 | 27 |
| mirror over / face | <1 | 15–19 |
| classroom (wide, quiz, smart, teacher) | 1–3 | 26–37 |
| gym dodgeball / pick + cheer | 2–3 | 23–32 |
| gym science fair | 2–3 | 44–47 |
| cafeteria / quiet 1 | 3 | 30–49 |
| school exterior (front / establish) | 3–4 | 42–50 |

Every set (all layers, crowds included) stays well under 90 ms built + rendered (worst ≈ 55 ms on a busy machine);
characters (~20 ms each at s .5) come on top. No filters, masks, blend modes or radial gradients; glows are stacked
translucent ellipses; textures (lockers, bricks, tiles, maple, cinder block, cork, blinds, grilles, chevrons) are
`<pattern>`s in DEFS; there are **no full-frame tint overlays** (grade with the scene's `look()`); the hallway floor
checker is generated only for the visible camera rect; cheap crowds are a handful of bucketed paths per depth band.
