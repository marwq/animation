# School sets — `scenes/sets_school.js`

**WILLOWBROOK MIDDLE SCHOOL — the Comets.** A long single-storey cream school with a teal fascia, lime colour-block
panels and white-framed windows, a teal entrance block with a round clock, a sky-blue barrel-roofed gym annex and a
skate area behind a chain-link fence. Inside: mint / sky-blue / sunny walls, lime + teal school colours, the yellow
**comet star** as the logo. Contact sheet: `concept/sets_school.png` (`node tools/sheet_school.js`; the hero, s .5,
stands on every FLOOR line; `--only key1,key2`, `--full DIR` for full-size tiles, `--noref` hides the hero).

```js
const SS = require('./sets_school');        // DEFS are loaded by main.js automatically (ids prefixed `ss`)
const { FLOOR, SPOTS } = SS;
```

## Conventions (same as the previous video's sets)

- Every set is drawn in **world space** for the 1920×1080 frame (camera at rest = the frame) and padded far past the
  edges: pans of ±600 px and zoom-outs to ~0.5 never show a gap (the schoolyard goes much further, see below).
- `t` (absolute seconds) only drives idle motion (flag, clouds, birds, balloons, rope, steam, bulbs, confetti).
  **Pass a constant `t` to freeze it.**
- Room sets: `set(t, opts)` returns everything composited; `set.layers(t, opts)` returns

| layer | what | draw with |
|---|---|---|
| `bg` | seen through windows (sky, trees, the yard) | `view(cam, bg, 0.5..0.8)` |
| `mid` | the room: walls, floor, furniture backs, chairs | `view(cam, mid, 1)` |
| *characters who sit/stand BEHIND furniture* | | |
| `front` | furniture fronts (desk tops, tables, the counter, the stage mic stand) | `view(cam, front, 1)` |
| *characters on the FLOOR line* | | |
| `fg` | occluders near the camera (audience heads, stage lip, chair backs) | `view(cam, fg, 1)` (see per set) |
| `light` | beams / glows / tints, **world space** | `view(cam, light, 1)` |
| `screen` | (gym only) screen-space slow-mo grade | last, **no camera** |

- Sets with several furniture rows also give `layers.frontRows` (back → front) for exact depth sorting.
- **`set.compose(t, opts, between, after, cam)`** does the interleaving for you: `between` = svg or an array (one per
  front row, back → front; each is drawn just before that row's furniture), `after` = the FLOOR-line characters.
  With `cam` it applies the camera (bg at parallax .6, the rest at k 1, `screen` without camera). Characters are
  passed in world coordinates. Example:
  ```js
  const C = SS.SPOTS.classroom;
  o += SS.classroom.compose(t, { quiz: true }, [row3Kids, row2Kids, actor('you', t, { ...C.heroDesk }) + actor('kid', t, { ...C.neighbour })], '', cam);
  ```
- `FLOOR[set]` = feet y of the main stand line (characters at **s .5** there); `SPOTS[set]` = anchors with a
  recommended `s`; `SPOTS[set].cams` = ready framings (`{x, y, zoom}`) for `K.camKeys` / `K.view`.
- Helpers: `camAt(x, y, zoom, sx = 960, sy = 540)` → a cam that puts world (x, y) at screen (sx, sy);
  `toScreen(cam, x, y, k)` → `[sx, sy, zoom]`; `camTf(cam, k)` (same as `K.E.camTf`).
- Hero-held props live in `rig/extras.js` (skateboard, dodgeball, lunch tray, spaghetti, ballBin, birthdayCake,
  micStand, trophy…). They are authored in hero body units: **pass the same `s` as a character standing at that spot.**

FLOOR: `schoolyard 960 · hallway 960 · classroom 1040 (seated rows: SPOTS) · classroomBoard 800 · gym 960 ·
cafeteria 960 · lounge 980 · auditorium 770 (stage) · auditoriumWings 960`.

---

## 1. `schoolyard(t, cam, opts)` — camera-taking, parallax

`schoolyard(t, cam, o)` returns the full frame; `schoolyard.layers(t, cam, o)` → `{ bg, mid, pole, front, fg, light }`
**already transformed** by the camera (`light` is screen space). Draw world-space characters with `K.view(cam, svg, 1)`.

**Draw order:** `bg` · `mid` · *(hero hugging the pole)* · `pole` · *(crowd / kids behind the skate props, y ≲ 820)* ·
`front` · *(everyone on the FLOOR line, riders on the ramp/rail)* · `fg` · `light`.

Parallax: sky k .1 · sun k .04 · clouds + birds k .12 · far hills k .3 · tree row behind the roof k .6 ·
building/ground/props k 1 · fg bushes k 1.3. World extends x −4600…7400, y −4400…3900.

**Depth scale** on the yard: `s = SPOTS.schoolyard.scaleAt(y) = 0.5·(y − 160)/800` (y 960 → .5, 840 → .425, 800 → .4,
692 → .33). Use it for kids at other depths.

World map (k = 1): basketball court x −3450…−1830 (hoop −2650) · left wing −1820…780 · **flagpole x 140**
(base y 830, top y −1900 — very tall) · **entrance block 780…1300, doors centred x 1040** (porch y 692, 3 steps to y 780,
walkway to the camera) · right wing 1300…2340 · gym annex 2340…3120 (GO COMETS mural) · **skate area 3150…5600**
(rail 3300…3700, dented trash can 3880, quarter-pipe 4200…4900) · fence + trees behind the skate area.

| SPOTS.schoolyard | value | notes |
|---|---|---|
| `door` | (1040, 692) s .333 | on the porch in front of the double doors (`doorL` 970 / `doorR` 1110) |
| `steps` | x 1040, top 692, bottom 780 | |
| `flagSpot` | (700, 840) s .425 | the checkpoint flag by the door (left of the steps, clear ground) |
| `walk` | (1040, 960) s .5 | the walkway on the stand line |
| `pole` / `poleTop` | x 140, base 830, top −1900 / gold ball (140, −1922) | |
| `hug` | (140, −1430) s .5 | hero hugging the very top (feet dangling); draw him **before** `pole` so the pole crosses him |
| `flag` | (146, −1886) 250×160 | the waving school flag |
| `rail` | x 3300…3700, top y 828, ground 968 | board line for grinds = `rail.y` |
| `trash` | (3880, 968), top 778 | the dented trash can (bail target) |
| `ramp.base / lip / deck / air / landing` | (4200, 968) / (4580, 588) / (4730, 576) / (4540, 258) / (4060, 968) | quarter-pipe faces LEFT; lip = coping; `air` = apex above the lip |
| `crowd[8]` | x 3300…4070, y 800/814, s ≈ .4 | kids watching (draw before `front`) |
| `benchSeats[4]` | y 744, s .383 | hips on the benches behind the crowd |
| `deckKids[2]` | (4700 / 4820, 576) s .5 | standing on the ramp deck |
| `hoop`, `court` | rim (−2650, 303) / stand (−2650, 960) | |
| `skyWindow` | screen (960, 250) 1080×400 | empty sky for the giant system window, framing `cams.wide`/`cams.red` |

| cams | `{x, y, zoom}` | shows |
|---|---|---|
| `door` | 80, 0, 1 | entrance, flag spot, walkway (pole at the left edge) |
| `doorClose` | camAt(880, 600, 1.7) | planting the flag |
| `wide` / `red` | 200, −230, .6 | the whole school + big sky (SC08 red sky window) |
| `skate` | 3120, 0, 1 | rail, trash can, quarter-pipe, crowd line |
| `ramp` | camAt(4420, 640, 1.25) | the ramp and the air above it |
| `crowd` | camAt(3650, 560, 1.35) | the watching kids |
| `poleTop` | camAt(140, −1670) | the hero hugging the top: only sky, clouds, birds, the flag |
| `poleClose` | camAt(140, −1680, 1.8) | |
| `poleWide` | camAt(560, −560, .36) | reveal: the whole pole, tiny hero on top, school below |
| `court` | −3550, 0, 1 | basketball court, willow, benches |

**Options**

- `time: 'morning' | 'day' | 'sunset'` (default day) — sky, sun, clouds, window reflections, tint.
- `red: 0..1` — corrupted Friday: alarm-red sky with scanlines + crawling pixel blocks, clouds go dark and clear out of
  the top-centre, pulsing red light over everything. Use `cams.red` and put the system window at `skyWindow`.
- `frozen: 0..1` — cold blue-grey "paused" tint + faint scanlines; flag droops, clouds/birds stop (also pass a
  constant `t` to freeze idle motion exactly).
- `lowGfx: 0..1` — "2006 low graphics": every object pops (random-ish, left → right bias) to a flat untextured box:
  beige wings, grey window squares, grey ground, cone/cube trees, grey sky, box clouds. Animate k 0 → 1 over ~1–2 s.
- `colorBack: 0..1` — colour floods back after the save is deleted: grey drain overlay with 4 golden-rimmed colour
  circles growing from `colorFrom: [sx, sy]` (screen; default [960, 620]). `undefined` = off, 0 = fully grey.
  Combine with `time: 'sunset'` for golden hour.
- `flag: false`, `pole: false` (draw your own), `crowdBench: false`, `clock` ('8:00' on the entrance clock).

Character scale: s .5 on the FLOOR line (y 960); s .33 at the door; s .4 at the crowd line; s .5 on ramp/rail/deck.

---

## 2. `classroom(t, opts)` — Mr. Fig's maths class

Two framings of one room (`opts.view`):

**`'class'` (default) — looking at the kids** from the whiteboard. Back wall: windows (left, `bg` = sky/trees/yard),
the wall clock (centre top), a pi strip, a bulletin board (TIMES TABLES, *MISTAKES HELP YOU GROW*, STAR STUDENTS,
SHAPES), cubbies with backpacks. Three rows of desks facing the camera; seated kids stand on the seat spots (their
feet are hidden by the desk; the desk top is at their belly). Front-row desks have an open space under the top, so
**sliding down behind/under the desk** works (`cams.heroDesk`). Use `compose()` or `layers.frontRows`:
`mid · row-3 kids · frontRows[0] · row-2 kids · frontRows[1] · row-1 kids · frontRows[2] · light`.

| SPOTS.classroom | value |
|---|---|
| `rows[3][5]` (back → front) | row 3: desk top 600, kids y 732 s .3 · row 2: desk 712, y 888 s .4 · row 1: desk 860, y 1080 s .5 (x −10, 480, 960, 1440, 1930) |
| `seats` | all on-screen seats (flat list) |
| `heroDesk` | (960, 1080) s .5 — YOU, front row centre, desk top y 860 |
| `neighbour` | (1440, 1080) s .5 — the kid who shouts "Fifty-six!" |
| `underDesk` | (960, 1080) — crouched under the desk (book box hides down to y 1002; lower him with y +, squash) |
| `teacher` | (170, 1060) s .52 — Mr. Fig at the front-left |
| `clock` | (960, 170) r 62 |

**`'board'` — the whiteboard** from the back of the room: `board` lines (default `['7 × 8 = ?']` written huge in blue
marker with a red underline; 2+ lines → title + smaller lines), the clock and MATH IS FUN poster (right), ROOM 104 door
(left), Mr. Fig's desk (mug, cactus, nameplate). `front` = the middle row of desks with cheap seated kids seen from
behind (`fill: false` hides them); `fg` = the two foreground chair backs (draw with **k 1**).
Order: `mid · Mr. Fig · front · foreground kids (view 'back') · fg`.

| SPOTS.classroom.board | value |
|---|---|
| `teacher` | (300, 790) s .42 — left of the board, point right at the sum |
| `teacherDesk` | (1730, 800) s .44 |
| `text` | (960, 330) — the sum |
| `seats[2]` | (380 / 1540, 1250) s .6 — foreground kids (hero + neighbour), draw `view: 'back'` |

cams: `class`, `heroDesk` camAt(960, 760, 1.65), `heroAndNeighbour` camAt(1200, 720, 1.35), `teacher` camAt(330, 720, 1.4),
`board`, `boardClose` camAt(960, 340, 1.6).

Options: `view`, `board: [lines]` (e.g. `['7 × 9 = ?']`, `['7 × 9 = ?', '64?  63!']`), `clock: '8:00'` (or hours as a
number), `quiz: true` (papers + pencils on every desk), `time: 'morning' | 'day'` (morning = warm sun beam), `fill`.

---

## 3. `gym(t, opts)` — dodgeball

Across the court: pale-blue block wall over a teal wainscot, steel trusses + dome lamps, high windows with light beams
(`light`), CHAMPS / STATE FINALS / COMETS banners, the big comet mural, **scoreboard**, wall hoop (left), climbing rope
(right), pulled-out **bleachers** at the far left (tiny crowd), maple floor with court lines; the centre line is x 960
with a lime centre circle. Stand line y 960.

| SPOTS.gym | value |
|---|---|
| `throwers[3]` | (230, 900) .45 · (430, 960) .5 · (640, 920) .47 — left team, `view: 'side', flip: true` (face right) |
| `team[2]` | (1290, 930) .48 · (1700, 905) .46 — YOUR team, face left |
| `dodge` | (1480, 960) s .5, zone x 1180…1820 — calm wall behind |
| `ballFace` | (1420, 560) — the frozen last ball at the hero's face |
| `bin` | (1760, 780) s .42 — `extras.ballBin.layers({x, y, s})`: draw `back`, the hero, `front` |
| `coach` | (1540, 800) s .43 — Coach Dee by the bin (SC07) · `coachFront` (200, 1000) s .53 |
| `bleachers[3]` | seated spectators (hips) s .3–.33 |
| `hoop` (300, 404) · `scoreboard` (1560, 300) · `rope` (1880, 640) · `centre` (960, 880) | |

cams: `court`, `dodge` camAt(1480, 720, 1.4), `ballFace` camAt(1440, 600, 2.2), `bin` camAt(1680, 620, 1.6),
`throwers` camAt(440, 700, 1.4).

Options: `scoreboard: ['HOME', '03', 'GUEST', '05']` or a string (`'ARE YOU A BALL?'`), `clock: '2:45'`,
`slowmo: 0..1` (bullet time: cool desaturated blue light + dark top/bottom grade + drifting light streaks — the
streaks/grade are `layers.screen`), `rope: false`, `balls: false` (loose balls on the floor), `bleacherKids: false`.

---

## 4. `cafeteria(t, opts)`

Sunny yellow walls over a white/teal tiled wainscot, big windows (right) with the yard, bunting, a clock (12:10),
the **PIZZA DAY!** menu board over the **lunch line** (left): steel counter, sneeze guard, pizza/salad/fruit pans with
steam, a milk cooler. Right: two long tables (top surface + edge + shadow underneath + an empty near bench).
`layers.frontRows = [counter, back table, front table]`; `compose(t, o, [lunchLady, backTableKids, frontTableKids], laneCharacters)`.
The **walking lane** is the stand line y 960, with the puddle + **wet-floor sign**.

| SPOTS.cafeteria | value |
|---|---|
| `lunchLady` | (300, 790) s .36 — behind the counter |
| `line[4]` | (660, 760) … (90, 770) s .38 — front of the line first, facing left |
| `seats.back[5]` | x 1240…2520, y 844, s .35 (table top 700) |
| `seats.front[4]` | x 1330, 1720, 2060, 2420, y 1004, s .45 (table top 820) |
| `heroSeat` | (1720, 1004) s .45 |
| `stage` | (1720, 905) s .45 — standing ON the bench behind the front table to tell the joke |
| `path[4]` | (2300 → 1300 → 860 → −300, y 960) — the principal's walk, right → left |
| `puddle` (860, 968) · `sign` (650, 940) · `slip` (880, 960) s .5 · `principalHit` (1180, 960) s .52 | the spaghetti gag |

cams: `wide`, `line` camAt(420, 640, 1.35), `spill` camAt(1000, 700, 1.25), `table` camAt(1720, 760, 1.45),
`laugh` {380, −40, .92} (the whole room).
Options: `menu: [title, lines…]`, `puddle: 0..1` (the spilt puddle by the wet-floor sign, default 1; 0 hides it),
`sign: false`, `trays: false`, `steam: false`, `clock`.

---

## 5. `lounge(t, opts)` — teachers' lounge, Mr. Fig's birthday

Peach striped wallpaper, a window with half-up blinds, the **HAPPY BIRTHDAY MR. FIG** pennant banner, balloons, a
corkboard (WHO TOOK MY YOGURT?), an OUT OF ORDER copier, a kitchenette (coffee machine with steam, mugs, microwave, a
fridge with notes), blue carpet. The table (cloth with a pink trim) is `front`.

| SPOTS.lounge | value |
|---|---|
| `cake` | (960, 724) s .5 — `extras.birthdayCake({x, y, s})` on the table top (use `.layers` to burst out of it) |
| `seats[2]` | (640 / 1280, 980) s .44 — seated behind the table (draw before `front`) |
| `behindCake` | (960, 860) s .42 — standing behind the table, face above the cake (Mr. Fig) |
| `ends[2]` | (330 / 1590, 980) s .5 — standing at the table ends |
| `coffee` | (1420, 960) s .48 |

cams: `wide`, `cake` camAt(960, 640, 1.7), `table` camAt(960, 700, 1.25).
Options: `banner` (text), `balloons: false`, `steam: false`, `frozen: 0..1` (balloons stop + cool tint — "all the
teachers froze").

---

## 6. `auditorium(t, opts)` — the TALENT SHOW

Purple house, gold proscenium with the comet crest, crimson velvet curtains with gold tiebacks and swag valance, a
marquee **TALENT SHOW** sign with chasing bulbs, starry cyclorama with bulb strings, warm wooden stage.
`opts.lights` = **house lights** (1 = house lit, before the show — default; 0 = show: house dark, stage bright, spots
stronger). `opts.view`:

**`'stage'`** (from the audience). Opening x 200…1720 / y 100…806; performers stand on y 770 (s .45); the stage front
edge is y 806 with footlights. The mic stand is the `front` layer (whoever speaks into it is drawn before `front`);
its cable snakes on the floor to the left wing. `fg` = two rows of audience heads **from behind** + seat backs
(silhouettes when dark; `cheer` raises arms and phones). Spotlight cones + pools are in `mid` (behind the performers).

| SPOTS.auditorium.stage | value |
|---|---|
| `ivy` / `hero` | (700, 770) / (1180, 770) s .45 |
| `principal` | (960, 770) s .46 — at the mic (mic base (960, 776), mic head y 449) |
| `principalSide` | (1460, 760) s .45 — stepped aside (gets foamed) |
| `cable` | (600, 790) — where the hero trips on the cable |
| `front` / `back` | (960, 795) s .47 / (960, 640) s .38 |
| `spots.centre / left / right` | {960, 760, 560} / {700, 765, 420} / {1220, 765, 420} — pass to `spots` |
| `opening` | x 200…1720, y 100…806 · `banner` (960, 205) |

Options: `spots: [{x, y, w}]` (pool centre on the floor + width; default one centre spot; `[]` = none),
`curtain: 0..1` (1 open, 0 closed), `confetti: 0..1` (falling paper, in `light`), `cheer`, `phones`, `wave`,
`banner` (text), `mic: x | false` (false: draw `extras.micStand` yourself).

**`'house'`** (from the stage). Seven raked rows of a full house (cheap crowd fill: ~350 people, colour-bucketed
paths), a balcony with tiny heads, the projection booth (its follow-spot beam shows when the lights dim), EXIT signs,
sconces. `fg` = the stage lip + footlights (hides the family's legs). Draw the family between `mid` and `fg`.

| SPOTS.auditorium.house | value |
|---|---|
| `dad` / `mom` | (770, 1238) / (950, 1238) s .5 — seated in the front-row gap (feet below the frame) |
| `bea` | (1130, 1036) s .5 — **standing on her seat** (her own design size makes her small) |
| `seat(x, row)` | rig feet for anyone seated in row 0…6 at x |
| `rows` | `[{y, s}]` front → back: 960 .5 · 707 .333 · 580 .25 · 504 .2 · 453 .167 · 417 .143 · 390 .125 |

Options: `cheer` (arms up, bobbing, smiles), `wave: true` (the cheer travels across), `phones` (raised phones),
`gasp` (O mouths, heads back), `lights` (dim: back rows fade into the dark, faces get a warm wash), `family: false`
(no gap), **`cam`** — pass the camera you view the layers with: people outside the view are culled (close-ups get
~2× cheaper). Zoom-outs below ~0.8 show the crowd's ends.

**`'wings'`** (backstage, stage left): dark walls, fly-rail ropes with sandbags and a pin rail, a ladder, road cases,
the stage manager's desk with a blue lamp, a colourful costume rack, glow-tape marks, a QUIET PLEASE / SHOW IN PROGRESS
sign; at the right the crimson curtain edge with a **bright sliver of stage**, spilling warm light across the floor onto
the hero spots (`light`).

| SPOTS.auditorium.wings | value |
|---|---|
| `hero` / `ivy` | (1150, 960) s .5 / (1420, 980) s .5 |
| `peek` | (1640, 960) s .5 — peeking through the gap |
| `gap` | x 1745, y 0…1000 — the bright sliver |

cams: `stage`, `stageClose` camAt(960, 560, 1.6), `banner` camAt(960, 230, 1.8), `house`, `family` camAt(960, 800, 1.6),
`wings`, `wingsClose` camAt(1180, 640, 1.5).

---

## 7. `hallway(t, opts)` (bonus)

A wide locker corridor (pan x −1100…3020): blue/lime locker banks (y 320…740), ROOM 105 and **ROOM 104 (Mr. Fig)**
doors, water fountain, trophy case, posters incl. **SCHOOL TALENT SHOW · FRIDAY!**, GO COMETS!, *MISTAKES ARE PROOF
YOU'RE TRYING*, fluorescent panels, glossy floor. Stand/run line y 960 (s .5).
SPOTS.hallway: `door` (1650, 745) s .36 · `door105` (−500, 745) · `run` x −900…2900 y 960 · `lockers` (900, 745) s .36 ·
`poster` (250, 170). cams: `wide`, `door` camAt(1650, 560, 1.3), `poster` camAt(250, 300, 1.6), `pan[2]` (x −900 / 1000).
Options: `doorOpen: 0..1`, `poster: [lines]`.

---

## Props (exported)

`locker(x, y, {w, h, col, open, num, s})` · `lockerRow(x0, x1, floorY, {col: 'blue'|'lime'|'teal', s})` ·
`schoolPoster(text | [lines], x, y, {w, h, col, ink, rot, s, size, icon: 'star'|'pi'|'heart'|'book'|'brain', tape})` ·
`trophyCase(x, floorY, s)` · `wetFloorSign(x, floorY, s)` · `trashCan(x, floorY, s, {dent 0..1, lid 'on'|'tilt'|'off', col})` ·
`bench(x, floorY, s, {col, low})` · `wallClock(x, y, r, '8:00', {rim, t})` · `comet(x, y, s, rot)` (logo) ·
`pennant`, `bunting(x0, x1, y, sag, n, cols, s)` · `schoolTree(x, y, s, {kind 'round'|'pine'|'willow', col, hi, low 'cone'|'cube'})` ·
`skateRamp(x, y, R, D, {col, low})` · `grindRail(x, y, L, h)` · `basketHoop(x, y, s)` · `floorBall(x, y, r)` ·
`balloon(x, y, r, col, t)` · `spotlight(x, y, w, op)` · `confettiFall(t, k, x0, x1)` · `marqueeBanner(x, y, s, t, text)` ·
`sconce(x, y, on)` · `stageMic(x, y, s)` · `cloud`, `bush` ·
`crowd(rows, opts)` — the cheap audience fill (sizes in rig units: a crowd member at s matches a rig character at s):
`rows: [{x0, x1, y (shoulder line), s, seed, gaps: [[xa, xb]], dx (seat pitch, 360), jit}]`,
`opts: {light 0..1, dark, lit, cheer, gasp, phones, wave, back (heads from behind), eyes, t}`.

## Camera tips

- Room sets: `K.view(cam, L.bg, 0.6) + K.view(cam, L.mid, 1) + … + K.view(cam, L.light, 1) + (L.screen || '')`, or just
  `set.compose(t, opts, between, after, cam)`.
- Characters must use the same camera as `mid` (k 1). For parallax-correct close-ups use the `cams` presets or
  `SS.camAt(worldX, worldY, zoom)`; `SS.toScreen(cam, x, y)` tells you where an anchor lands (for UI/FX overlays).
- Schoolyard: big vertical moves are fine (pole top at y −1900; the sky is padded to y −4400). Whip from `cams.door` to
  `cams.poleTop` for the "respawned on the flagpole" reveal, then out to `cams.poleWide`.
- Keep captions in mind: the stand lines are at y 960 (feet); faces sit at y ~ 500–650.

## Performance (1920×1080, set only, headless Chromium; `node tools/sheet_school.js --noref`)

| set / framing | build ms | render ms |
|---|---|---|
| schoolyard door / wide morning / skate / ramp | 1.6 | 21–28 |
| schoolyard poleTop / poleWide | 1.5 | 11–38 |
| schoolyard red 1 (wide) | 1.4 | 41 |
| schoolyard lowGfx (mid-morph) / sunset + colorBack + frozen | 0.8–1.0 | 34–39 |
| classroom class (+quiz) / board | 0.9 / 0.2 | 21–24 / 7–17 |
| gym / gym slowmo | 1.0 | 14–25 |
| cafeteria | 0.6 | 14–21 |
| lounge | 0.4 | 15 |
| auditorium stage (house lit / show + cheer + confetti) | 1.6 | 19–21 |
| auditorium house (full house) / + cheer, phones, wave, lights 0 | 7.3 / 8.1 | 54 / 80 |
| auditorium house close-up (`cams.family`, `cam` culling) | ~5 | 37–50 |
| auditorium wings | 0.2 | 8 |
| hallway | 0.3 | 6–20 |

Every set is < 90 ms built + rendered (worst: the cheering full house ≈ 88 ms). Characters (~20 ms each at s .5) come on
top. No filters, masks, blend modes or big radial gradients; glows are stacked translucent ellipses; textures are
`<pattern>`s in DEFS; the crowd is a handful of colour-bucketed paths per row (no small-scale patterns: those re-draw
every tile and are slow).
