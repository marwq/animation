# SETS_HOME — the family's home + the neighbourhood (`scenes/sets_home.js`)

Contact sheet: `concept/sets_home.png` (`node tools/sheet_home.js`; `--only kitchen,street` for some tiles, `--full DIR`
for full-size PNGs, `--noref` hides the stand-ins / anchor marks). The sheet draws the hero (rig/r6) on every FLOOR line
and seat, look-alike stand-ins for Mom / Grandpa / Max / Mrs. Wells (the real cast from rig/cast.js once it has `max`), and
prints elements, JS build ms and browser render ms for every tile (the SET ALONE, all layers, no characters). The last
tile checks four documented camera framings (monitor fill, toaster, the 1979 photo, the fort reveal).

```js
const H = require('./sets_home');     // DEFS are loaded by main.js automatically (ids `sh*`)
```

This is a NEW family's home (nothing from the Parents / Respawn houses): YOUR teal + navy gamer bedroom with a pixel-heart
"HP bar" frieze, Mom's bakery-warm peach kitchen with blueberry cabinets and a cherry tablecloth, the sage living room
with the denim couch and Grandpa Lou's cognac recliner, a coral house with a navy roof on a street with Mrs. Wells'
lavender cottage, the oak with the ball and the corner shop. Warm, flat, bold `#151515` outlines. The wall right above
every seat / stand spot is kept plain, so **stat plates float on clean wall** (see "Plate space" in each set).

## Two kinds of sets

**Room sets** — `bedroom, kitchen, livingRoom`. Fixed world for the 1920×1080 frame, padded to x −900…2820,
y −700…1800 (zoom-outs to ~0.55 and pans never show an edge). You apply the camera.

```js
const L = H.kitchen.layers(t, { time: 'morning', mess: k });        // { bg, mid, front, fg, light }
let o = view(cam, L.bg, 0.8) + view(cam, L.mid, 1);
o += view(cam, seated, 1);           // the family at the table: actor(name, t, H.seatPose(H.SPOTS.kitchen.seats.max, size, pose))
o += view(cam, L.front, 1);          // table + cloth + breakfast: hides the seated legs
o += view(cam, standing, 1);         // Mom at the counter, YOU on FLOOR.kitchen (990)
o += view(cam, L.fg, 1.2) + view(cam, L.light, 1);   // light LAST: sunbeams / night / screen glow tint the characters too
// H.kitchen(t, o) = all layers at k 1 (no characters)
```

| layer | what | parallax |
|---|---|---|
| `bg` | what is seen through the windows (sky, yard, street) | 0.7–0.85 |
| `mid` | the room: walls, floor, furniture backs, props | 1 |
| `front` | furniture FRONTS (duvet + bed front, the chair back, table + cloth + breakfast, couch / recliner fronts, the dog bed) — after the seated, before the standing | 1 |
| `fg` | close occluders (`''` in all room sets) | 1.15–1.3 |
| `light` | sunbeams, dust motes, lamp pools, night darkness, screen glows, the update flash + pixels | 1 (draw LAST) |

**Camera sets** — `street(t, cam, o)`, `houseExterior(t, cam, o)` → svg; `.layers(t, cam, o)` → `{ bg, mid, fg, light }`
**already transformed** by `cam = { zoom, x, y, fx, fy, sx, sy }` (straight from `K.camKeys` / `K.shake`). Anchors carry
`k`: draw on them with `K.view(cam, svg, a.k)` between `L.mid` and `L.fg`; `H.toScreen(cam, a)` → `{ x, y, z, s }` = where
the anchor is on screen right now (s = a.s × zoom, handy for HUD plates). `String(L)` = all four layers.

```js
const L = H.street.layers(t, cam, { time: 'day' });
let o = L.bg + L.mid;
o += K.view(cam, actor('you', t, { x: 1300, y: H.FLOOR.street, s: 0.4 }), 1);
o += L.fg + L.light;
const p = H.toScreen(cam, H.SPOTS.street.ball);     // quest marker / tooltip over the ball on screen
```

### Seated characters: `H.seatPose(spot, size, pose)`

Every seat anchor is `{ x, hip, s, turn?, rot?, view?, pose? }` = where the HIPS go. `H.seatPose(spot, size, extra)` returns
`{ x, y: hip + 306·s·size, s, turn, rot, view, ...spot.pose, ...extra }` — the feet position for straight legs, so a
bigger adult (Grandpa ~1.12) or little Max (~0.62) still lands on the cushion (`size` = the rig size factor from
docs/CAST.md). Straight legs are hidden by the furniture front. Exceptions noted per anchor (`pose` is applied for you).

### Options common to all sets
`time` picks the palette (every fill goes through `tone()`; colours written `'!#RRGGBB'` are emissive: screens, lit
windows, LEDs). Values `0..1` animate (ease them yourself between word times). Screens take an svg centred on (0,0) of the
screen box **or** `fn(w, h)`. `t` only drives idle motion (curtains, steam, smoke, birds, leaves, the cat's tail, the
title-screen blink, the alarm shake).

---

## 1. `bedroom(t, o)` — YOUR gamer room (SC02 gaming, SC03 the update night → the HUD morning)

Teal walls under a navy band with a row of red **pixel hearts** (an HP-bar frieze) + an RGB LED strip, navy board wainscot,
honey plank floor with the grey **CONTROLLER RUG**. LEFT: the nightstand with the red twin-bell **ALARM CLOCK** (and a little
lamp); the walnut **bed** (pillow at the left, navy duvet with pixel hearts, a goblin plush) under the window (mustard
curtains; night sky + moon / sunrise, the neighbour's roof with a lit attic window, an oak branch). The **DRAGON PEAK — LV 90**
poster. RIGHT: the charcoal gaming desk with an RGB edge, the big **monitor** (o.pcScreen) on its stand, speakers, RGB
keyboard, goblin + dragon figurines, the RGB tower under the desk, a backpack; the purple **gaming chair**; the standing
**MIRROR**; the GAMER ZONE door just off-frame right (x 1950+). The smelly **SOCK** lies in front of the bed.

**Options:** `time 'night'|'morning'|'day'|'evening'` (default night: dark blue, moonbeam, glow stars, LED strip) ·
**`pcScreen`** svg|fn(w 400, h 230) (default at night: the DRAGON PEAK title screen `H.dragonTitle(w, h, t)`; off by day) ·
`pc` (default true) · **`glow`** 0..1 (screen light on YOUR head in the chair; default 1 at night when the monitor is on) or
`[{x, y, k, col, r}]` custom pools · `glowCol 'blue'|'cyan'|'white'|'pink'|'warm'` · **`pixels`** 0..1 (THE UPDATE: the
screen + room flash white-cyan at .02–.3, ~48 pixel squares burst out of the monitor across the room, fading at .85–1 —
animate 0 → 1 over ~1.5 s on "Installing… reality") · **`blackout`** 0..1 ("everything goes dark": room dimmed, monitor off,
fans dark) · **`ring`** 0..1 (the alarm clock rings: shakes, the hammer bangs, motion lines) · `clock 'H:MM'` (alarm clock,
default 7:00) · `alarmClock: false` (hide it when YOU grab / smash it — redraw with `H.alarmClock`) · **`tuck`** 0..1 (duvet: 0 folded at the foot … 1 up to the chin; default .7 in the morning, else 0 — use .9
with `bed.lie`, .7 with `bed.sitUp`) · `sock` (default true, with green stink lines) · `led` (default on night/evening) ·
`lamp` 0..1 (nightstand lamp) · `chair 'back'|'front'|false` (default 'back') · **`mirrorView`** svg|fn(w 126, h 456) (the
reflection inside the mirror glass, clipped) · `curtains` 0..1 (default .15) · `mess` 0..1 (default .5: backpack, game
cases, hoodie) · `stars`.

| anchor | value | notes |
|---|---|---|
| `FLOOR.bedroom` / `.stand` | 990 (s .5) | the rug centre {1030, 968} |
| `SPOTS.bedroom.bed.lie` | {x 495, y 892, s .5, rot −90} | YOU asleep on your back, head on the pillow (left); front view rotated; draw before `front` with `tuck: .9` |
| `.bed.sitUp` | {x 380, hip 690, s .5} | waking up / sitting up under the duvet: `H.seatPose(sitUp)`; draw before `front`, `tuck: .7` |
| `.bed.edge` | {x 760, hip 714, s .5, pose frog} | sitting on the bed edge, feet on the floor: draw AFTER `front` |
| `.bed` | {x0 160, x1 930, top 676, floor 905, pillow {344, 640}} | mattress top 676 |
| `.chair` | {x 1325, hip 792, s .5, view 'back', pose legs tucked} | `chair: 'back'` — YOU face the monitor; the chair back (front layer) hides your body, the head shows |
| `.chairFront` | {x 1325, hip 792, s .5, pose frog} | `chair: 'front'` — YOU in the chair facing camera |
| `.head` | {1325, 560} | YOUR head in the chair (glow target) |
| `.monitor.screen` | {cx 1325, cy 344, w 400, h 230} · `.desk` {x0 1040, x1 1610, top 620} | the screen clears YOUR head in the chair |
| `.alarm` | {x 90, y 565, s .72} | the clock's face centre · `H.alarmClock(x, 604, .72, tn, {ring, t})` to redraw it |
| `.sock` | {x 730, y 948, s .75} | `sock: false` + `H.sock(x, y, s, tn, {stink: t})` if someone picks it up |
| `.tips` | bed {640, 600} · sock {730, 898} · alarm {90, 470} · pc {1325, 200} · poster {870, 120} · chair {1325, 520} · rug {1030, 900} | tooltip anchors (bottom of the tooltip) |
| `.mirror` | {x0 1680, x1 1830, y0 236, y1 716, glass {cx 1755, cy 476, w 126, h 456}, stand {x 1755, y 990, s .5}} | YOU stand at `stand` in `view: 'back'`, the reflection goes in `mirrorView` |
| `.window` {360, 130, 700, 410} · `.door` {x0 1950, x1 2150, top 200, exit {2050, 990, s .5}} · `.ceiling` 40 · `.wallBase` 720 | | |

**Plate space:** the teal wall y 100…460 is free above the bed and between the poster and the mirror; above YOU in the chair
the plate overlaps the monitor's top — fine for the over-the-shoulder; move it up to y ~180 if the screen matters.

**Camera tips:** night wide `{zoom 1}`; over the shoulder `{zoom 1.8, x 365, y −110}`; the monitor fills the frame
`{zoom 4.8, x 365, y −196}` (2.4 = half the frame) — ideal for the update window + "Accept"; the wake-up `{zoom 1.8, x −580,
y −80}`; the alarm clock `{zoom 3, x −870, y 25}`; the sock `{zoom 3, x −230, y 330}`; the HUD-morning tooltip wide `{zoom
1}` with `time: 'morning'`, tips on bed / sock / alarm. The install: `pixels` 0 → 1 at `{zoom 1}` (or a slow pull-back to
`{zoom .85}`), then `blackout` 0 → 1.

## 2. `kitchen(t, o)` — Mom's bakery kitchen (SC02 breakfast, SC03 HUD breakfast, SC07 evening dishes, SC11 pancakes)

Peach walls with white dots, **blueberry** cabinets with brass knobs, a cream fish-scale backsplash, a honey butcher-block
counter, terracotta + cream hex floor. Off-frame LEFT (x < 40, pan left): the back door, FLOUR / SUGAR / COCOA canisters,
Mom's pink stand mixer, a stack of bakery boxes, open shelves (spice jars, RECIPES box), the cream **STOVE** with a frying
pan + red kettle. In frame: the big **COFFEE MACHINE** (BREW, carafe + steam) and the 4-mug tree, the **SINK** under the
window (cherry valance; the back yard: lawn, white picket fence, a yellow neighbour house, a tree, birds), the mint
**TOASTER**. CENTRE: the breakfast table — cream **cherry-print cloth** with a red border (= `front`) — mint chairs behind
it (Max's orange RAWR booster), Mom's chair at the left end; breakfast: DINO-O cereal, bowls (Max's green dino bowl,
YOUR blue one with a spoon, Grandpa's brown), milk, the cupcake stand under a glass dome, Grandpa's **#79** mug, toast, OJ.
RIGHT: the **TOWER of pink FLOUR POWER boxes** (300 cupcakes before sunrise — 8 tall + an open one), the wall clock, the
cream retro **FRIDGE** with Max's **RAWR!** T-rex, YOUR knight-vs-dragon drawing (LV 90), MY FAMLY, the bakery **ORDERS: 300
CUPCAKES ✓** note and the calendar **SAT: FAIR / DAY OFF ♥** (foreshadows SC08), more boxes on top; the doorway to the
living room (x 1990+).

**Options:** `time 'morning'|'evening'|'day'` (default morning: low sun + beam + dust motes; evening: dusk window, the
pendant lamp + an under-cabinet glow) · **`mess`** 0..1 (Max's cereal splash: up to 22 milk splats with droplets + drips and
cereal O's flying from his bowl over the wall, window, fridge, lamp, table and floor; Max's bowl turns to milk at > .5;
animate 0 → 1 fast with the jump) · **`dishes`** (SC07: the sink full of suds + bubbles, a wobbly tower of 9 dirty plates,
a pot, the drying rack, yellow gloves; hides the toaster) · **`pancakes`** (SC11: a crooked 5-pancake stack with a syrup
heart + butter, the **FOR MOM ♥** card, a dandelion in a glass and the syrup bottle at Mom's end; batter bowl + whisk, egg
shells, flour puddles on the counter + floor; a pancake in the pan) · **`toast`** 0..1 (the toaster: 0 in the slots … .35
popped up … 1 flying ~400 px high and spinning) · `burnt` 0..1 (default 1 — the HUD said 80 %) · `smoke` (default on when
toast > .2 and burnt) · **`cups`** 0..4 (Mom's empty coffee mugs lined up at her end — "she drank four") · `coffee`
(default true) · `boxes` (default true) · `bowls` · `steam` · `lamp` 0..1 (default 1 in the evening) · `clock 'H:MM'` ·
`birds` · `chairs`.

| anchor | value | notes |
|---|---|---|
| `FLOOR.kitchen` / `.front` | 990 (s .5) | in front of the table |
| `SPOTS.kitchen.seats.max` | {x 948, hip 648, s .45} | on the orange booster (hips higher) — `H.seatPose(spot, maxSize)` |
| `.seats.you` / `.grandpa` | {x 1205 / 1462, hip 708, s .45} | behind the table, facing camera |
| `.seats.mom` | {x 808, hip 712, s .45, turn .45} | the left end, turned to the table (SC11 "Sit down, Mom") |
| `.table` | {x0 760, x1 1590, back 640, top 690, hem 878, feet 905} | seated bodies disappear below y 690 |
| `.counterStand` / `.sinkStand` / `.stoveStand` | {420, 800, s .46} / {375, 790, s .46} / {−105, 800, s .46} | Mom at the counter / washing up (`view: 'back'`) / YOU cooking (pan right of you) |
| `.toaster` | {x 640, y 548, s .88, slot {640, 460}, tip {640, 380}, toastTop {640, 140}} | tooltip at `tip`; the toast peaks at `toastTop` with toast 1 |
| `.coffee` | {x 108, y 548, carafe {108, 510}, tip {108, 330}} | `H.mug(x, y, s, tn, {col, steam: t})` for Mom's cup in hand |
| `.pan` | {x −160, y 526} | the frying pan on the stove |
| `.maxBowl` / `.youBowl` | {952, 686} / {1195, 682} | bottom centre of the bowls (Max's jump target) |
| `.momPlate` / `.momCups` | {950, 686} / {856, 688} | SC11 pancakes / the coffee mugs |
| `.fridge` | {x0 1716, x1 1960, top 104, drawings {1800, 400}, calendar {1866, 212}} | |
| `.tower` | {x 1650, y 760, top 250, tip {1650, 220}} | the cupcake-box tower ("300 cupcakes") |
| `.outside` | {x 380, y 560, s .32, k .8, x0 210, x1 540} | someone passing OUTSIDE the window (SC11 Grandpa winks): draw between `bg` and `mid` with `view(cam, svg, .8)`; only the head + shoulders show in the glass (y 250…380) |
| `.window` {230, 120, 520, 380} · `.lamp` {1175, 160} · `.clock` {1650, 176, r 44} · `.door` {x0 1990, x1 2250, enter {2120, 990, s .5}} | | |

**Plate space:** the peach wall y 120…420 above the three seats is empty (only the pendant lamp, bottom y 168, between YOU
and Grandpa). Seated heads: Max ≈ y 470, YOU ≈ 415, Grandpa ≈ 380 (tops).

**Camera tips:** breakfast wide `{zoom 1}`; the table three-shot `{zoom 1.45, x 240, y −40}`; Max `{zoom 2.4, x −10, y −10}`;
Grandpa `{zoom 2.4, x 500, y −40}`; the toaster `{zoom 2.6, x −320, y −60}`; Mom + coffee at the counter `{zoom 1.8, x −540,
y −60}`; the fridge drawings / calendar `{zoom 2.6, x 880, y −170}`; the box tower `{zoom 1.6, x 690, y −120}`; SC11 at the
stove `{x −260}` (stove + Mom's seat in one frame) or `{zoom 1.5, x −420}`; Grandpa at the window `{zoom 2.6, x −585, y −285}`.

## 3. `livingRoom(t, o)` — couch, Grandpa's recliner, the pillow-fort floor (SC06, SC07, SC12)

Sage leaf wallpaper over a cream panelled wainscot, walnut plank floor. LEFT: the TV on a low walnut console (a game console,
Max's toy dino), the **photo wall** above it (the family, baby YOU, Max as a dino, Biscuit as a pup, Mom's FLOUR POWER grand
opening, Grandma + Grandpa's wedding), the big monstera. CENTRE: the **denim corduroy COUCH** under the wide window (mustard
curtains; the street: two houses + a tree), mustard / coral / dino-print cushions + an orange knitted throw; the round
**BRAIDED RUG** in front = the pillow-fort floor (Max's ABC blocks + a toy T-rex, a floor pillow). RIGHT: the side table
(lamp, Grandpa's newspaper + glasses case), **Biscuit's plaid DOG BED** (BISCUIT plate, a bone), **Grandpa Lou's cognac
leather RECLINER** (rolled arms, a doily, a patch, his slippers) turned toward the room, **THE 1979 ARM-WRESTLING PHOTO**
above it ("FINALS 1979": young Lou with hair and a dark moustache mid-match, a young woman with a heart in the crowd =
Grandma; gold "1979" plaque), the trophy shelf (the **"79" trophy** with an arm-wrestling topper — its tiny plaque says
FINALIST, foreshadowing SC09 —, THE ARM newspaper clipping, a #1 medal). The kitchen doorway at x 1996+.

**Options:** `time 'day'|'evening'|'night'` (default day: sunbeam from the window; evening: dusk + lamp; night: dark blue +
lamp) · **`fort`** 0..1 (the couch gives its cushions to the fort: the throw goes at .15, back cushions at .3 / .45 / .55,
pillows + the floor pillow at .5–.65, Max's toys at .5, seat cushions at .75 → a bare frame; the fort itself is
`X.pillowFort` from rig/extras.js, see below) · `tvScreen` svg|fn(w 330, h 190) (default off) · `tv` · `tvGlow` 0..1 ·
`lamp` 0..1 (default 1 evening / night) · `toys` (default true) · `dogBed` (default true) · `recline` 0..1 (the recliner's
footrest pops out) · `birds`.

| anchor | value | notes |
|---|---|---|
| `FLOOR.livingRoom` / `.front` | 1000 (s .5) | in front of the couch, on the rug |
| `SPOTS.livingRoom.seats.couchL` / `couchM` / `couchR` | {x 640 / 870 / 1100, hip 750, s .5} | draw before `front` |
| `.seats.armchair` | {x 1566, hip 780, s .5, turn −.3} | Grandpa in the recliner (`H.seatPose(spot, 1.12)`) |
| `.heads` | armchair {1560, 520} · couchL/M/R {640/870/1100, 520} | glow / reaction anchors |
| **`.fort`** | {x 860, y 930, s .5, x0 485, x1 1235, top 80} | `X.pillowFort({ ...H.SPOTS.livingRoom.fort, k, t })` AFTER `front` (bottom-centre on the rug; at k 1 it is 750 × 850 px and reaches y ≈ 80) with `fort: k` on the set |
| `.dogBed` | {x 1300, y 958, s .5, dog {x 1290, y 928, s .5}} | Biscuit lying / sitting on the cushion at `dog` (draw after `front`) |
| `.rug` {860, 912, rx 560, ry 112} · `.rugSit` {560, 940, s .5} | | Max on the floor |
| `.tv` | {cx 232, cy 440, w 330, h 190} | |
| `.photo79` | {x 1572, y 196, w 232, h 172} | `H.photoFrame('wrestle79', x, y, w, h, rot, tn)` to redraw it big for an insert |
| `.trophy` {1814, 286} · `.shelf` {x0 1744, x1 1960, y 386} | | the "79" trophy (tooltip anchor) |
| `.window` {590, 96, 1150, 350} · `.lamp` {1338, 430} · `.door` {x0 1996, x1 2240, enter {2110, 1000, s .5}} | | |

**Plate space:** above Grandpa (head top ≈ 415) the wall y 300…400 is clear — the 1979 photo ends at y 290, so his plate sits
right under the photo (a nice pairing). Couch heads (≈ 430): the plates land on the window sill area (y 330…420).

**Camera tips:** wide `{zoom 1}`; Grandpa + recliner `{zoom 1.9, x 600, y −80}`; the 1979 photo `{zoom 3.2, x 612, y −344}`;
the trophy `{zoom 3, x 854, y −250}`; the fort reveal `{zoom .85, x −100, y −60}` (ceiling to rug); Biscuit on his bed
`{zoom 2.4, x 340, y 340}`; couch two-shot `{zoom 1.6, x −90, y −20}`. SC12: Biscuit + Grandpa + Max with the tablet fit
`{zoom 1.25, x 260, y 60}`.

## 4. `street(t, cam, o)` — the neighbourhood (SC06 quest montage, SC07 "a 50-XP quest down the street")

One plane at k 1: front lawns (houses stand on y 700), white picket fence / hedges along the sidewalk (y 880…975, **stand
line 935**), the curb and the road. World x: **OUR HOUSE** at −760 (coral, navy roof, the bakery van on the driveway,
mailbox 12) with a mint neighbour at −1560; **MRS. WELLS' lavender cottage** at 520 (scalloped roof, pink awnings, rose
bushes, a ginger cat in the window, a gnome, a birdbath) with its picket fence and the open **GATE** (x 470…570) + her three
**grocery bags** on the sidewalk; the big **OAK** at 1380 with the **BALL** stuck in its crown (a few falling leaves); a
yellow house at 2150, a blue one at 2860; the **CORNER SHOP** at 3720 (brick, green parapet sign, striped awning, OPEN door,
shelves in the windows, apple / orange / melon crates, ICE CREAM sign); the side street at 4160…4560 (crosswalk, STOP sign);
more neighbours both ways forever. Streetlamps at x 240 + 1600·i. Behind: back roofs + trees (k .55), hills (k .2), sky
(k 0), sun (k .03), clouds (k .06), birds (k .7). fg (k 1.25): flower bushes peeking at the bottom edge every 2600 px.

**Options:** `time 'day'|'sunset'|'morning'` (default day; sunset = warm pink sky, lit windows, lamps on) · **`ball`**
(default true; false = rescued — draw it in a hand with `H.ball(x, y, s)`) · **`bags`** (default true; false when someone
carries them — `H.groceryBag(x, y, s, tn, {kind 0|1|2})`) · `birds` · `leaves` · `cars` (a parked blue car by the curb at
x 2900, default off) · `lamps` (default on at sunset).

| anchor (all k 1) | value |
|---|---|
| `FLOOR.street` / `.stand` | 935 — **hero s .4** on the sidewalk (walk y 880…975) |
| `SPOTS.street.wells` | {x 520, y 935, s .4} — Mrs. Wells in her gate opening |
| `.gate` {x 520, y 935, x0 470, x1 570} · `.bags` {x 688, y 945, s .82} · `.wellsDoor` {520, 700, s .3} | |
| `.ball` | {x 1449, y 517, s 1.05} — the ball in the oak (head top of a s .4 kid at the trunk ≈ 555: a jump reaches it) |
| `.oak` | {x 1380, y 935, trunk {1380, 868}, crownTop 280} |
| `.home` | {x −760, y 935, door {−916, 681, s .3}, mailbox {−990, 880}, van {−320, 862}} |
| `.shop` | {x 3720, y 935, door {3720, 880, s .4}} · `.side` {x0 4160, x1 4560} |
| `.cams` | wells {x 0} · oak {x 520} · home {x −1300} · shop {x 2800} · wide {zoom .6, x 300} |

**Camera tips:** the groceries quest `{x 0}` (Wells + the oak in one frame); the ball `{zoom 1.6, x 420, y −60}`; home
`{x −1300}`; the corner shop `{x 2800}` ("cool dog, random man" walks the sidewalk anywhere); montage = truck `x` with
`K.camKeys` (the street never ends) or whip between `.cams`; `{zoom .6}` for a wide "the whole street has quests" shot.
Plates over s .4 heads sit on the lawn / house walls (y 420…560) — clean, light backgrounds.

## 5. `houseExterior(t, cam, o)` — establishing shots (SC03 the update night, mornings)

OUR HOUSE big at x 960 (base y 780 on the lawn): coral siding + white trim, slate-navy hip roof with a front gable on the
right holding **YOUR round-top window** (flower box), Mom's window (left), Max's window (dino sticker), the porch with the
**mustard door (12)**, porch light and Grandpa's rocking chair, the long living-room window with a yellow flower box, the
brick chimney (smoke). The **FLOUR POWER bakery van** on the driveway (right), the mailbox, a maple with Max's tire swing,
Max's dino sprinkler, a hedge; the sidewalk (stand 930) + road; neighbours left / right (k 1), back roofs + trees (k .5),
hills (k .2), sky (k 0), moon / sun (k .03), clouds (k .06), birds (k .7).

**Options:** `time 'night'|'morning'|'day'|'evening'` (default night) · `heroWindow 'off'|'lit'|'glow'|'update'` (default
night 'glow' = flickering blue screen light + a blue glow; evening 'lit') · **`update`** 0..1 (the install seen from
outside: the window flashes white-cyan (.02–.4), a cyan glow + ~40 pixels burst out of the window into the night sky, the
whole frame flashes slightly; sets heroWindow 'update' automatically) · `windows { mom, max, living, porch }` overrides ·
`van` (default true) · `vanLights` · `smoke` · `stars` · `birds` (default by day).

| anchor (all k 1) | value |
|---|---|
| `FLOOR.houseExterior` / `.stand` | 930 — hero **s .22** on the sidewalk; `.lawn` {y0 780, y1 860, s .2}; `.porch` {x 710, y 754, s .19} |
| `SPOTS.houseExterior.heroWindow` | {x 1170, y 215} — YOUR window (push-in target) |
| `.windows` | mom {700, 420} · max {880, 420} · living {1140, 649} · hero {1170, 215} |
| `.door` {744, 754} · `.house` {x 960, base 780, roofTop {1170, 36}} · `.van` {1530, 874} · `.mailbox` {700, 876} | |
| `.cams` | establish {zoom 1} · wide {zoom .6} · window {zoom 2.4, x 210, y −325} |

**Camera tips:** the update night: hold `{zoom 1}` with the blue window, push to `.cams.window` while `update` 0 → 1, then cut
inside (bedroom with `pixels`) — or the reverse. The morning establishing: `time: 'morning'`, `{zoom .6}` → `{zoom 1}`.

---

## Props + helpers (exported)

`dragonTitle(w, h, t)` (the DRAGON PEAK title screen for any screen box) · `mug(x, y, s, tn, {col, label, handle, steam: t,
empty})` · `bowl(x, y, s, tn, {col, fill 'cereal'|'milk'|'empty', spoon, splash 0..1})` (splash = the milk crown for Max's
jump) · `cupcake(x, y, s, tn, {frost, cherry})` · `cupcakeBox(x, y, s, tn, {col, open})` · `toaster(x, y, s, tn, {toast,
burnt, smoke: t, lever, glow})` · `toast(x, y, s, rot, tn, {burnt})` · `alarmClock(x, y, s, tn, {ring, t, time})` ·
`sock(x, y, s, tn, {stink: t})` · `groceryBag(x, y, s, tn, {kind})` · `ball(x, y, s, tn, {col, rot})` · `photoFrame(kind, x, y,
w, h, rot, tn, {col, mat})` (`'wrestle79'|'bakery'|'babyYou'|'maxDino'|'biscuitPup'|'family'|'beach'|'wedding'`) ·
`trophy79(x, y, s, tn)` · `dogBed(x, y, s, tn, {bone, plate})` · `plant(x, y, s, tn, 'fern'|'snake'|'round'|'monstera', pot)`
· `leafTree(x, y, s, tn, {col, sway, ball})` · `shCloud` · `shBird(x, y, s, tn, {flap, flip})` · `wallClock(x, y, r, 'H:MM',
tn)` · `familyHouse(x, y, s, tn, {t, night, hero, update, win})` · `nbHouse(x, y, i, tn, {lit})` · `wellsCottage(x, y, tn)` ·
`cornerShop(x, y, tn)` · `bakeryVan(x, y, s, tn, {lights, flip})` · `streetLamp(x, y, tn, on)` · `pixelBurst(cx, cy, k, {n,
seed, spread, cols})` (the update's pixel squares — reuse for HUD install effects).

Helpers: `toScreen(cam, a)`, `camTf(cam, k)`, `vis(cam, k)` (visible rect of a layer), `mix(a, b, k)`, `tone({morn, eve,
sunset, night, dim, soft})` (every fill goes through `tn.c(col)`; `'!#hex'` = emissive), `frameIn(svg, w, h)`, `glow(x, y, r,
id, op)` (small radial glows `shGlow{Warm,Blue,Cyan,White,Moon,Pink,TV}`), `pool()`, `darkRing()`, `seatPose`, `makeSet`,
`layersOf`. Props default to the plain day tone when `tn` is omitted.

## Scales at a glance

| set | stand line | scales |
|---|---|---|
| bedroom | 990 (s .5) | bed lie / sitUp / edge .5 · chair .5 · mirror stand .5 |
| kitchen | 990 (s .5) | seats .45 (Max on the booster, hips 648) · counter / sink / stove .46 · outside .32 (k .8) |
| livingRoom | 1000 (s .5) | couch + recliner .5 · rugSit .5 · Biscuit on the bed .5 · fort s .5 |
| street | 935 | **.4** (sidewalk) · bags .82 · door .3 |
| houseExterior | 930 | **.22** sidewalk · .19–.2 porch / lawn |

## Performance

No filters, masks or blend modes; textures are `<pattern>`s in DEFS (hearts, cherries, hex floor, fish-scale, corduroy,
leaf paper, siding, shingles, bricks…); light pools are small radial gradients or stacked ellipses; the camera sets cull to
the visible range per layer. Measured with `tools/sheet_home.js` (set alone, all layers, JS build + browser render at
1920×1080 minus an empty-frame baseline; shared machine, ±15 ms):

| set | elements | build + render |
|---|---|---|
| bedroom (night / update burst / morning / blackout / evening) | 225–255 | 25–53 ms |
| kitchen (morning / mess 1 / evening dishes / pancakes) | 520–555 | 48–76 ms |
| livingRoom (day / fort / evening + TV) | 330–380 | 29–48 ms |
| street (any time, any x, zoom .6…1.6) | 365–395 | 34–53 ms |
| houseExterior (night / update / morning / evening, zoom .6…2.4) | 285–295 | 20–46 ms |

Full frames with characters (rig stand-ins, JS + Chromium + JPEG): kitchen + 5 characters + mess **162 ms**, living room +
4 characters **125 ms**, street + 2 characters **94 ms** — under the 250 ms budget. The four-in-one quad tiles on the sheet
are 4 sets in one frame, not one set.
