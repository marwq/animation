# SETS_HOUSE — the family's real-life house (`scenes/sets_house.js`)

Contact sheet: `concept/sets_house.png` (`node tools/sheet_house.js`; `--only kitchen,living` for some tiles, `--full DIR`
for full-size PNGs, `--noref` hides the stand-ins / anchor marks). The sheet draws the real cast from `rig/cast.js`
(YOU, Dad, Mom, Granny) on the seat anchors and the `rig/extras.js` devices on the device anchors, and prints elements,
JS build ms and browser render ms for every tile (the SET ALONE, all layers, no characters).

```js
const H = require('./sets_house');     // DEFS are loaded by main.js automatically (ids `hs*`)
```

This is a NEW house (not the Respawn family's): butter-yellow kitchen with teal cabinets and a cherry-red fridge; the
beige / sage / deep-teal living room; YOUR periwinkle bedroom; a sage stairwell; a sky-blue house with a rust roof.

## Two kinds of sets

**Room sets** — `kitchen, livingRoom, bedroom, stairs, keyboardClose`. Fixed world for the 1920×1080 frame, padded to
x −900…2820, y −700…1800 (zoom-outs to ~0.55 and pans never show an edge). You apply the camera.

```js
const L = H.livingRoom.layers(t, { time: 'night', glow: 'all', tvScreen: myGameFn });
let o = view(cam, L.bg, 0.8) + view(cam, L.mid, 1);
o += view(cam, seated, 1);          // the family on the couch / armchair / desk chair: actor(name, t, H.seatPose(spot, size, pose))
o += view(cam, L.front, 1);         // couch + armchair + chair fronts: they hide the seated legs
o += view(cam, devices, 1);         // X.laptopOld / X.tablet / X.phone on SPOTS.livingRoom.devices (+ anyone between couch and table)
o += view(cam, L.table, 1);         // livingRoom only: the coffee table, snacks, mess, beanbag
o += view(cam, standing, 1);        // people standing on FLOOR.livingRoom (1000)
o += view(cam, L.fg, 1.2) + view(cam, L.light, 1);   // light LAST: night darkness + screen glows tint the characters too
// H.livingRoom(t, o) = all layers at k 1 (no characters)
```

| layer | what | parallax |
|---|---|---|
| `bg` | what is seen through windows (yard, sky, moon) | 0.6–0.85 |
| `mid` | the room: walls, floor, furniture backs, seat tops, props | 1 |
| `front` | furniture FRONTS (tablecloth, couch / armchair / chair fronts, duvet drop, banister) — after the seated, before the standing | 1 |
| `table` | livingRoom only: the coffee table (+ snacks, mess, beanbag) — after devices on laps, before FLOOR | 1 |
| `fg` | close occluders (`''` in all room sets) | 1.15–1.3 |
| `light` | sunbeams, lamp pools, night darkness, TV / screen glows, face glows, the red alarm | 1 (draw LAST) |

**Camera set** — `houseExterior(t, cam, o)` → svg; `.layers(t, cam, o)` → `{ bg, mid, fg, light }` **already
transformed** by `cam = { zoom, x, y, fx, fy, sx, sy }` (straight from `K.camKeys` / `K.shake`). Anchors carry `k`: draw
on them with `K.view(cam, svg, a.k)` between `L.mid` and `L.fg`; `H.toScreen(cam, a)` → screen point. `String(L)` = all.

### Seated characters: `H.seatPose(spot, size, pose)`

Every seat anchor is `{ x, hip, s, turn?, rot?, pose? }` = where the HIPS go. `H.seatPose(spot, size, extra)` returns
`{ x, y: hip + 306·s·size, s, turn, rot, ...spot.pose, ...extra }` — the feet position for straight legs, so a bigger adult
(`size` from docs/CAST.md: Dad 1.1, Mom / Granny ~1.0–1.06) still sits on the cushion. Straight legs are hidden by the
furniture front. Exception: Dad on the bed edge (`SPOTS.bedroom.bed.sit`) is drawn IN FRONT of the bed with the frog-legged
sit `{legL 90, legR 90, kneeL 90, kneeR 90}` (in `spot.pose`, applied automatically) — it reads as "sitting on the edge".
YOU facing camera in the gaming chair: same frog pose.

### Options common to all sets
`time` picks the palette (every fill goes through `tone()`; colours written `'!#RRGGBB'` are emissive: lit windows, LEDs,
screens); values `0..1` animate (ease them yourself); screens take an svg centred on (0,0) of the screen box **or**
`fn(w, h)`. `t` only drives idle motion (steam, curtains, birds, smoke, swing, TV flicker, alarm pulse, dust motes).

---

## 1. `kitchen(t, o)` — Saturday breakfast / the FAMILY MEETING (SC02, SC12)

Butter-yellow walls; LEFT: teal lower cabinets + butcher-block counter, cream upper cabinets, subway backsplash, utensil
rail, the white stove with the red KETTLE (steam), coffee maker, fruit bowl, toaster. Wall calendar (SAT circled). The wide
window over the table (red-gingham valance + café curtains, herb pots, a daisy pot) shows the backyard: fence, an oak with
a BIRD FEEDER, hopping birds, a lilac neighbour roof, the low morning sun. The wall clock (8:10) above Granny. RIGHT: the
cherry-red retro FRIDGE ("COOKIES" jar + bread box on top) covered in YOUR drawings (MY CASTLE, ME LVL 99, MY FAMILY, an A+,
the CHORES chart); the hall doorway (x 1890+). Terracotta checker floor. CENTRE: the breakfast table with a long cream
cloth (red folk band, little blue flowers, scalloped hem) = **layers.front**, four seats + breakfast: four cereal bowls
(YOUR blue one with a spoon), YOUR tablet propped on a stand, CUBE-O's cereal + milk, Dad's folded newspaper (THE DAILY
LEDGER) + teal mug, toast rack, daisy vase, OJ jug, the #1 MOM mug, the teapot, Granny's cookie plate + teacup; Granny's
knitting basket by her chair.

**Options:** `time 'morning'|'day'` (default morning: warm low sun, sunbeam on the table + dust motes) · `meeting` (paper
bunting **FAMILY MEETING** over the window + Dad's flip chart: **FAMILY MEETING** / pie chart TIME SPENT: "NINTENDO 90%",
"US" 10% / 11 HRS/DAY!!; the calendar says GAME) · `next` (SC12 next Saturday: YOUR crayon flip chart **FAMILY GAME NIGHT!**
— hot dog, grey knight, granny, you — SAME SERVER! SAME TIME! EVERY SATURDAY ♥; YOUR chair pushed back = you stand at
`SPOTS.kitchen.head`) · `chart 'meeting'|'next'|false` (override) · `paper` (default true; false when Dad holds it:
`H.newspaper(x, y, s, rot, tn, { open: true })`) · `tablet` (default true) · `bowls` (default true) · `steam` · `birds` ·
`clock` · `pendant` (a teal pendant lamp, off by default).

| anchor | value | notes |
|---|---|---|
| `FLOOR.kitchen` | 990 | stand line in front of the table, s .5 |
| `SPOTS.kitchen.seats.you` | {x 560, hip 718, s .45, turn .35} | left end, turned to the table; draw before `front` |
| `.seats.dad` / `.mom` | {x 800 / 1120, hip 714, s .45} | behind the table, facing camera |
| `.seats.grandma` | {x 1360, hip 718, s .45, turn −.35} | right end |
| `.head` | {x 372, y 884, s .45} | `next`: YOU standing at the head of the table by the flip chart |
| `.presenter` | {x 392, y 884, s .45} | `meeting`: Dad at his flip chart (chart at x 220, board ≈ x 90…350, y 315…640) |
| `.table` | {x0 455, x1 1465, back 668, top 712, hem 912} | seated bodies disappear behind y 668 |
| `.window` | {700, 150, 1220, 362} · `.ceiling` 40 · `.wallBase` 700 | |

Tips: the seated heads sit just under the window sill (y ≈ 380–420) — the plain wall behind faces is kept empty. Freeze-
frame portraits (SC02 "There's Dad…"): zoom 2.2 on a seat (`{zoom 2.2, x seat.x−960, y −150}`). "Cereal falls back into
the bowl" close-up: YOUR bowl is at (600, 708). Dad presenting: `meeting: true, paper: false`.

## 2. `livingRoom(t, o)` — GAME NIGHT (SC03, SC04, SC08, SC09, SC11, SC12)

The back wall (beige damask over a pale sage wainscot) + the LEFT side wall receding from the corner x 400 (gentle
perspective). On the side wall: the big **TV** above a walnut media console (game console, speaker, a trailing plant); a
window with rust curtains further left (x −430…−70, seen when you pan left). Back wall, left → right: **YOUR desk** with the
gaming PC dragged downstairs (big monitor on a stand facing camera, "LVL 99" sticky note, RGB keyboard + strip, mouse,
headset on a stand, RGB tower under the desk) and the black/mustard **gaming chair**; a shelf (books, YOUR old trophy, a
plant); the deep-teal **COUCH** (two back cushions, mustard + rose pillows, Granny's knitted throw on the right arm) under
the **gallery wall** (wedding photo, Mom's **ARCADE QUEEN 1998** photo, Dad's **ACCOUNTANT OF THE YEAR** certificate, baby
you, the beach family, young Granny with a cake, a HOME SWEET HOME cross-stitch); the mustard **floor lamp**; Granny's
dusty-rose wingback **ARMCHAIR** (doily, ruffled skirt) + her knitting basket; the **wall clock** above her; the hall
doorway with the bottom steps (x 1928…2170). Oak floor, a cream rug with a teal border; the walnut **coffee table**
(chips, popcorn, cans, cookies, controller) and a mustard **beanbag** front-left = `layers.table`.

**Options:** `time 'evening'|'night'|'midnight'` (default evening: lamp on, warm; night = mostly lit by the screens: a dark
blue wash + vignette, TV beam, PC glow; midnight = deeper blue) · **`glow`** `[{x, y, col, k, r}]` cheap screen-light pools
on faces (`col`: `'laptop'|'tablet'|'phone'|'pc'|'tv'|'red'|'warm'|'green'|'#hex'`; k 0..1; r ≈ 120–150) or `'all'` =
`H.deviceGlows()` (the four default pools on `SPOTS.livingRoom.faces`; `H.deviceGlows(['dad','mom'], k)` for a subset) ·
`glowK` multiplier · **`tvScreen`** svg|fn(w 300, h 210) (drawn slightly skewed into the side-wall TV, clipped; default: off
in the evening, a standby "ZZZ" screen at night, "STILL PLAYING?" when asleep) · `tv` (false = off) · `tvGlow 0..1` ·
`flicker 0..1` (TV light flicker, default .6 at night) · **`pcScreen`** svg|fn(w, h) (the monitor, box 290 × 168) · `pc`
(default true; false = draw extras' `X.gamingPC` yourself on `devices.pc.extras`) · `chair 'back'|'front'|false` ('back'
(default): YOU face the monitor, back view — the short chair back is in `front` and hides your body; 'front': the chair faces
camera, its back is in `mid`) · `lamp 0..1` (default 1 evening, 0 night) · **`mess 0..1`** (spilled chips + popcorn, tipped
can, pizza box, juice boxes, the yarn trail from Granny's basket, a sock, a chips bag) · **`asleep`** (SC12: midnight, mess
.8, slumped pillows, the TV asks STILL PLAYING?, clock 0:30, the gaming chair turned to camera) · **`blanket 0..1`** (Granny's
knitted throw over Dad's spot, its top edge rising from his knees (0) to his chest (1) — the hero tucking Dad in; 0 = folded
on the couch arm) · `tea` (the #1 MOM tea mug on the coffee table, steaming) · `boardGame` (the unused WORD TILES box) ·
`clock 'H:MM'` (default 7:05 / 11:00 / 0:30).

| anchor | value | notes |
|---|---|---|
| `FLOOR.livingRoom` / `.front` | 1000 (s .5) | in front of the coffee table |
| `SPOTS.livingRoom.seats.you` | {x 598, hip 772, s .5} | gaming chair: back view facing the monitor (chair 'back') or frog-sit facing camera ('front') |
| `.seats.dad` / `.mom` | {x 1000 / 1340, hip 760, s .5} | couch left / right; draw before `front` |
| `.seats.grandma` | {x 1752, hip 786, s .5, turn −.25} | armchair |
| `.faces` | you {598, 566} · dad {1000, 548} · mom {1340, 552} · grandma {1745, 598} | glow pools |
| `.devices.laptop` | {x 1000, y 812, s .5} | `X.laptopOld({...spot, face: 'lid'})` on Dad's knees (bottom centre); after `front` |
| `.devices.tablet` | {x 1340, y 716, s .5} | `X.tablet({...spot, face: 'back', landscape: true})` (centre) |
| `.devices.phone` | {x 1632, y 548, s .5} | `X.phone({...spot, face: 'back'})` Granny's arm's length (centre) |
| `.devices.pc` | screen {cx 598, cy 378, w 290, h 168} · keyboard {598, 626} · desk {x0 440, x1 760, top 632} · extras {x 598, y 634, s .44} | the built-in PC sits higher (its screen clears YOUR head) — prefer `pcScreen` |
| `.tv` | {cx 217, cy 336, w 300, h 210, pts [4 corners]} | the TV screen (side wall) |
| `.couch` | {x0 800, x1 1540, seat 722, front 772, back 520} · `.armchair` {x0 1598, x1 1902, seat 790} | |
| `.coffeeTable` | {x0 880, x1 1460, back 862, top 902, x 1170} · `.tea` {1292, 900} | Mom puts her tea down here (SC09) |
| `.blanket` | {x 1000, top0 812, top1 630} | where the throw's top edge is at blanket 0 / 1 (the hero's hands) |
| `.asleep` | dad {1000, hip 768, rot −5} · mom {1290, hip 772, rot −15} (leaning on Dad) · grandma {1752, hip 790, rot 9, turn −.25} · you {x 750, y 1012, s .5} (standing, covering Dad) · cam {zoom 1.22, x 250, y 60} | all s .5, use `H.seatPose(spot, size)` |
| `.hall` | {x0 1928, x1 2170, top 200, enter {x 2050, y 1000, s .5}} | the hero runs in from the stairs (SC09) |
| `.clock` {1772, 196, r 46} · `.lamp` {1578, 308} · `.corner` 400 · `.sideAt(x, h)` | | side-wall point, h 0 floor … 1 ceiling |

Camera tips: the game-night wide = `{zoom 1}`; two-shot Dad + Mom `{zoom 1.7, x 210, y −40}`; Granny + phone `{zoom 2,
x 740, y −20}`; YOUR monitor over your shoulder `{zoom 2.4, x −362, y −110}`; the TV `{zoom 2.6, x −743, y −204}` (or
fill the TV with a device frame and cut); the sleeping family = `SPOTS.livingRoom.asleep.cam`. For "the family laughing at
their screens" use `glow: 'all'` at night and animate `glowK` with the game action.

## 3. `bedroom(t, o)` — YOUR room: the talk + the 11 p.m. alarm (SC08, SC09)

Periwinkle walls with a white cube stencil and a pixel-block frieze (yellow / red / green / blue), glow-in-the-dark stars
(glowing at night), a grey-blue carpet with a round mustard rug. LEFT: the bedside table with **THE warm lamp** and the red
digital clock (10:59); the **bed** (teal headboard + footboard, white pillow, a green cube plushie, a teal cube-pattern duvet
whose front drop = `layers.front`) under the **window** (navy star curtains; night sky, moon, a branch). RIGHT: the trophy
shelf (gold + silver cups, a **2000 WINS** plaque, a cube buddy, a medal), the **CUBE CITY** poster (castle) and the
**BLOCK KING — COMING SOON** poster (foreshadowing SC09), the desk with the **gaming PC** (monitor, RGB keyboard, RGB tower,
green headphones), the empty black/green gaming chair with a red backpack, red sneakers on the rug, the door (KNOCK FIRST!).

**Options:** `time 'night'|'evening'|'day'` (default night: dim blue + moonlight beam) · `lamp 0..1` (default 1 at night, 0
by day: a warm pool around the bed — "one warm lamp") · `door 0..1` (opens; `hall` (default true) lights the hallway behind
it + a warm wedge on the floor) · **`alarm 0..1`** (the PC flashes RED: WARNING! screen with a pulsing triangle, red keyboard
+ tower, the whole room tinted red and pulsing at 1.4 Hz; `alarmPulse: false` = steady, you animate `alarm`) · `monitor`
svg|fn(w 296, h 172) · `pc` (default true) · `tuck 0..1` (the duvet pulled over YOU up to the shoulders) · `stars` ·
`clock` (bedside clock text, '11:00' for the alarm beat). `H.alarmScreen(w, h, t, k)` = the warning picture for any screen.

| anchor | value | notes |
|---|---|---|
| `FLOOR.bedroom` / `.stand` | 990 (s .5) | the rug at {1180, 980} |
| `SPOTS.bedroom.bed.lie` | {x 520, y 865, s .5, rot −90, view 'back'} | YOU on your side facing the wall, head on the pillow (left); draw before `front` |
| `.bed.sit` | {x 860, hip 726, s .5, turn −.4, floor 904, pose frog} | Dad on the bed edge: `H.seatPose(sit, 1.1)`; draw AFTER `front` |
| `.bed` | {x0 190, x1 1010, top 690, front 718, pillow {370, 650}} | |
| `.monitor.screen` | {cx 1398, cy 476, w 296, h 172} · `.desk` {x0 1180, x1 1620, top 640} · `.chair` {x 1420, seat 770, s .5} | |
| `.door` | {x0 1690, x1 1880, top 236, knob {1714, 500}, exit {x 1786, y 930, s .5}} | Dad knocks + walks in |
| `.lamp` {64, 500} · `.clock` {132, 584} · `.window` {330, 150, 650, 430} | | |

Camera tips: the talk two-shot `{zoom 1.45, x −220, y 30}` (bed + Dad); Dad's close-up `{zoom 2.6, x −100, y −110}`;
the hero's back `{zoom 2.4, x −560, y 60}`; the alarm reveal: push from the bed to the monitor `{zoom 2.6, x 438, y −64}`
while `alarm` goes 0 → 1.

## 4. `stairs(t, o)` — the hallway stairs (SC08 run up, SC09 run down at 11 p.m.)

Side view. The upstairs landing at the TOP RIGHT (floor y 420) with YOUR door (KNOCK FIRST!), the bathroom door, a hamper,
a night-light, a wall sconce and the beach photo; 12 walnut steps with a mustard runner descend to the LEFT to the
downstairs hall (floor y 940): the arch into the LIVING ROOM (the TV's blue flicker at night), Dad's jacket + Granny's
umbrella on the hooks, shoes, a runner rug. Sage leaf wallpaper over a deep-green wainscot following the slope; YOUR school
photos climb the wall from year 1 (bottom) to year 6 — from year 4 on you wear a gaming headset. Cream stair side panel
with moulding + the under-stair cupboard. **Front layer = the banister**: walnut handrail, one cream baluster per step, two
newel posts — YOU run BEHIND them. Hero scale **s .32**.

**Options:** `time 'night'|'evening'|'day'` (default night = 11 p.m.) · `heroDoor 0..1` (YOUR door opens) · `heroLight
'red'|'warm'|'blue'|false` (light from your room when the door is open; default red at night = the alarm) · `tvGlow 0..1`
(default 1 at night) · `lights` (the sconce; default on in the evening) · `nightLight` (default true).

| anchor | value |
|---|---|
| `SPOTS.stairs.steps[i]` | centre of tread i (0 = top … 11 = bottom): x = 1340 − 80·i, y = 460 + 40·i |
| `.landing` | {x0 1380, x1 2820, y 420, x 1460} · `.heroDoor` {x0 1480, x1 1660, top 16, x 1570} |
| `.bottom` | {x 330, y 940} · `FLOOR.stairs` 940 · `.arch` {x0 70, x1 330, top 514, x 200, enter {x 200, y 940, s .32}} |
| `.rise / .run / .slope` | 40 / 80 / .5 · `.noseY(x)` = nosing line · `.rail` {x0 390, y0 776, x1 1390, y1 270} |

Running down: side view (faces left by default) with `require('./acting').run(phase)`, lerp along `steps[]` (feet on the
tread, a small hop between treads); camera `{zoom 1.5, x 300, y −220}` on the landing → whip down to `{zoom 1.4, x −520,
y 180}` at the arch, then cut to the living room (enter from `SPOTS.livingRoom.hall.enter`).

## 5. `houseExterior(t, cam, o)` — the house from the street (establishing shots)

One plane at k 1: OUR HOUSE at x 960 (two storeys, sky-blue siding with white trim, rust hip roof with a centre dormer +
round attic window, brick chimney with smoke; the living-room **BAY WINDOW** at the left (TV glow + family silhouettes);
the porch with white columns, the **red front door** (number 27), porch light and the mustard porch swing; the kitchen window
with a flower box; upstairs: parents' window (left), Granny's lace-curtained window (centre), **YOUR window** (right, a CC
poster inside); the garage with a basketball hoop + Dad's beige minivan **DAD 78** on the driveway; the big oak with a tire
swing at the left; the teal mailbox (27) at the path; a box hedge along the sidewalk (stand line y 935), the road below.
Neighbours every 1700 px both ways (five palettes), back row of roofs + trees (k .5), hills + round trees (k .2), sky (k 0),
sun / moon (k .03), clouds (k .06), birds (k .7), streetlamps (x 60 + 1700·i), flower bushes at the bottom corners (fg k 1.25).

**Options:** `time 'morning'|'day'|'evening'|'night'` (default morning = Saturday: the rolled newspaper on the lawn, birds;
evening: dusk purple + lit windows + TV glow; night = 11 p.m.: moon + stars, streetlamps, only the porch light, the TV and
YOUR window glow) · `tvGlow 0..1` (default 1 at evening / night) · `silhouettes` (the family on the couch in the bay window) ·
`heroWindow 'off'|'lit'|'glow'|'alarm'` (default evening 'lit', night 'glow' = blue PC light; 'alarm' pulses red — SC08's
11 p.m. from outside) · `windows { living, kitchen, parents, granny, hero, porch, attic }` true/false overrides · `car`
(default true) · `carLights` · `paper` · `smoke` · `birds`.

| anchor (all k 1) | value |
|---|---|
| `FLOOR.houseExterior` / `.stand` | 935 — hero **s .22** on the sidewalk (s .18–.19 on the lawn / porch) |
| `SPOTS.houseExterior.house` | {x 960, base 700, door {940, 676}, porch {x 1030, y 676, s .17}, roofTop {960, 40}} |
| `.windows` | living {736, 584} · hero {1192, 356} · parents {728, 356} · granny {960, 360} · kitchen {1259, 578} · attic {960, 150} |
| `.path` {x 944, y0 730, y1 880} · `.lawn` {y0 720, y1 860, s .19} · `.driveway` {1490, 870} · `.car` {1478, 888} | |
| `.mailbox` {840, 905} · `.oak` {x 360, swing {268, 648}} · `.every` 1700 | |

Camera tips: establishing `{zoom .9, y −30}` (whole roof + street) or `{zoom .6}` (the neighbourhood); push into the bay
window `{zoom 2.4, x −224, y 44}` then cut inside to the living room; YOUR window at 11 p.m. `{zoom 2.6, x 232, y −184}`
with `heroWindow: 'alarm'`; truck along the street with `x` (neighbours repeat).

## 6. `keyboardClose(t, o)` — Dad's laptop, POV ("Where's the B?", "SPACE! BAR!", "I've been practicing")

Dad's chunky grey **DELL-O** laptop (the same one as `X.laptopOld`: a gold **#1** star sticker on the bezel) on his lap,
seen from above: the keyboard deck fills the lower frame in perspective (wider than the frame), dark keys with white
letters — E, A, S, N rubbed off — ESC/F-row, numbers, QWERTY, ASDF, ZXCV and a **HUGE SPACE BAR** (~750 px wide, y ≈ 693…767,
clear of the captions), the trackpad, an **I ♥ TAXES** sticker and a coffee ring on the palm rest, the sticky note
**PASSWORD: password** on the bezel. The lid rises from the hinge (y 400): only the screen's bottom 45 % is in frame. Around
it: the living room out of focus.

**Options:** `screen` svg|fn(w 1400, h 840) (the display; visible y 0…370 at rest — put the username field low, or pan up
`{y −420, zoom .85}` to see the whole display) · `time 'evening'|'night'|'day'` (default evening) · `glow 0..1` (screen light
on the keys; default .5 evening, 1 night) · `glowCol` · **`highlight`** `'B'` or `['B', 'SPACE']` (glowing yellow key top
+ rings) · **`press`** `{ key, k }` or an array (key pushed down) · **`caps`** (CAPS LOCK LED on — Dad's caps-lock chat) ·
**`jumpLabel`** (masking tape **JUMP!** on the space bar — SC11) · `crumbs` (cookie crumbs) · `notes` (default true) · `worn`
(default true).

| anchor | value |
|---|---|
| `SPOTS.keyboardClose.keys[label]` | {x, y (key-top centre), w, h, s} for all 75 keys: 'A'…'Z', '0'…'9', 'SPACE', 'ENTER', 'SHIFT', 'RSHIFT', 'CAPS', 'TAB', 'BACK', 'ESC', 'F1'…'F12', 'DEL', 'CTRL', 'FN', 'ALT', 'RALT', 'LEFT', 'DOWN', 'RIGHT', punctuation · `H.keyAt('b')` |
| e.g. | B {877, 655, w 97, h 66} · G {829, 588} · SPACE {931, 730, w 748, h 74} · ENTER {1626, 588} · CAPS {268, 588} |
| `.finger` | {829, 518} — Dad's fingertip hovering, hunting (above G) |
| `.hand` | {1500, 1090} — where his arm enters the frame |
| `.screen` | {cx 960, cy −50, w 1400, h 840, visible {y0 0, y1 370}} · `.hinge` 400 · `.trackpad` {960, 990} |

Camera tips: "Where's the B?": slow drift over the keys with the finger (`{zoom 1.3, x −80, y 60}`), `highlight: 'B'` on
"it's RIGHT there!"; SPACE BAR smash zoom `{zoom 2.2, x −30, y 190}`; SC11 sweat shot: `jumpLabel: true`, `press` the space
bar on the jump word.

---

## Props + helpers (exported)

`newspaper(x, y, s, rot, tn, {open})` (THE DAILY LEDGER; `open` = held spread, ~300 × 200 at s 1) · `cerealBox` (CUBE-O's) ·
`bowl(x, y, s, tn, {col, fill, spoon})` · `mug(x, y, s, tn, {col, label, handle, steam: t, tea})` · `cookiePlate` ·
`yarnBall` · `knitBasket` · `flipChart(x, y, s, tn, 'meeting'|'next'|'blank')` · `bunting(x, y, text, tn)` ·
`familyFrame(kind, x, y, w, h, rot, tn, {year})` (wedding, baby, arcade, cert, granny, beach, stitch, castle, school) ·
`plant` · `oakTree` · `hsCloud` · `hsBird` · `wallClock(x, y, r, 'H:MM', tn, {rim, face})` · `houseFront(x, base, tn, o)` ·
`nbHouse` · `dadCar(x, y, s, tn, {lights})` · `alarmScreen(w, h, t, k)` · `keyAt(label)` · `deviceGlows(who, k)` ·
`seatPose(spot, size, extra)`.

Helpers: `toScreen(cam, a)`, `camTf(cam, k)`, `vis(cam, k)`, `mix(a, b, k)`, `tone({morn, eve, night, mid, dim, red,
soft})`, `frameIn(svg, w, h)`, `glow(x, y, r, id, op)` (small radial glows `hsGlow{Warm,Blue,TV,Red,White,Purple,Green,Moon}`),
`pool()` (cel-shaded light pool), `darkRing()`, `faceGlows(list, k)`, `makeSet`, `layersOf`. All props default to the plain
day tone when `tn` is omitted.

## Scales at a glance

| set | stand line | scales |
|---|---|---|
| kitchen | 990 (s .5) | seats .45 · head / presenter .45 (y 884) |
| livingRoom | 1000 (s .5) | seats .5 · devices s .5 · asleep .5 · hall enter .5 |
| bedroom | 990 (s .5) | lie .5 · sit .5 · door exit .5 |
| stairs | 940 | **.32** |
| houseExterior | 935 | **.22** sidewalk · .17–.19 porch / lawn |
| keyboardClose | — | key boxes in px (Dad's hand prop at ≈ s 1–1.4) |

## Performance

No filters, masks or blend modes; textures are `<pattern>`s in DEFS; light pools are small radial gradients or stacked
ellipses; the exterior culls to the visible range per layer. Measured with `tools/sheet_house.js` (set alone, all layers,
JS build + browser render at 1920×1080, minus an empty-frame baseline; shared machine, ±10 ms):

| set | elements | build + render |
|---|---|---|
| kitchen (morning / meeting / next / day) | 350–430 | 21–38 ms |
| livingRoom (evening / night + glows + screens / asleep / mess) | 340–420 | 20–52 ms |
| bedroom (night / alarm / door / day) | 160–190 | 9–39 ms |
| stairs | 175–185 | 6–38 ms |
| houseExterior (any time, zoom .6…2.6) | 300–340 | 25–64 ms |
| keyboardClose | 130–145 | 31–61 ms |

A complete living-room frame with YOU, Dad, Mom and Granny (rig/cast.js) + the three extras devices renders in
**134–162 ms** (JS + Chromium + JPEG encode) — well under the 250 ms frame budget. The four-in-one quad tiles on the sheet
are 4 sets in one frame, not one set.
