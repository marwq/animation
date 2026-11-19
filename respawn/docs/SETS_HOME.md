# SETS_HOME — home + town backgrounds (`scenes/sets_home.js`)

Contact sheet: `concept/sets_home.png` (`node tools/sheet_home.js`; `--only kitchen,town` for some tiles, `--full DIR` for
full-size PNGs, `--noref` hides the hero / anchor marks). The sheet prints elements, JS build ms and browser render ms for
every tile (the SET ALONE, all layers, no characters).

```js
const H = require('./sets_home');     // DEFS are loaded by main.js automatically (ids `sh*`)
```

## Two kinds of sets

**Room sets** — `heroRoom, deskClose, deskFace, stairs, kitchen, workshop`. Fixed world for the 1920×1080 frame, padded to
x −900…2820, y −700…1800 (zoom-outs to ~0.55 and pans never show an edge). You apply the camera.

```js
const L = H.kitchen.layers(t, { time: 'morning' });          // { bg, mid, front, fg, light }
let o = view(cam, L.bg, 0.8) + view(cam, L.mid, 1);
o += view(cam, dadBehindTheIsland, 1);                        // characters BEHIND/INSIDE furniture
o += view(cam, L.front, 1);                                   // island / table / blanket / chair back / rehearsal table
o += view(cam, charactersOnTheFloor, 1);                      // everyone standing on FLOOR.kitchen
o += view(cam, L.fg, 1.2) + view(cam, L.light, 1);            // light LAST (it tints characters too)
// H.kitchen(t, o) = all layers at k 1 (no characters)
```

| layer | what | parallax |
|---|---|---|
| `bg` | what is seen through windows / doorways (sky, yard, street, storm) | 0.6–0.85 |
| `mid` | the room: walls, floor, furniture backs, props | 1 |
| `front` | furniture FRONTS: draw after the characters behind them, before the ones on the floor | 1 |
| `fg` | close occluders (all rooms: `''` for now) | 1.15–1.3 |
| `light` | night darkness, monitor/lamp glows, flashes, green/red washes | 1 (draw LAST) |

**Camera sets** — `street, town, obbyWorld`. `set(t, cam, o)` → svg; `set.layers(t, cam, o)` → `{ bg, mid, fg, light }`
**already transformed** by `cam = { zoom, x, y, fx, fy, sx, sy }` (straight from `K.camKeys` / `K.shake`). Every sub-layer
has its own parallax k. Anchors carry `k`: draw on them with `K.view(cam, svg, a.k)` between `L.mid` and `L.fg`;
`H.toScreen(cam, a)` → where an anchor is on screen right now. `String(L)` = all four layers.

```js
const L = H.town.layers(t, cam, { time: 'golden', red: 0.8 });
let o = L.bg + L.mid;
for (const a of H.SPOTS.town.roofs) o += K.view(cam, ghostYou({ x: a.x, y: a.y, s: a.s }), a.k);
o += K.view(cam, hero({ x: 760, y: H.FLOOR.town, s: 0.26 }), 1) + L.fg + L.light;
```

Screens (`heroRoom` / `deskClose` monitor) take an svg centred on (0,0) of the screen box **or** `fn(w, h)`, e.g.
`monitor: H.gameScreen(t, { jump: u })`.

Common option conventions: values `0..1` animate (ease them yourself between word times); `time` picks the palette;
`lowGfx`, `glitch`, `frozen`/`freezeAt`, `red`, `gray` exist where the story needs them (see each set).

---

## 1. `heroRoom(t, o)` — YOUR attic bedroom (SC02, SC03, SC04, SC07, SC12)

Mint pixel-plus wallpaper over a peach wainscot, attic slope at the upper LEFT (string lights along it), honey plank floor
(wall seam y 770) with a lavender rug = the checkpoint's spot. LEFT: bed (head + pillow at the left), MEGA OBBY poster and a
cork board (photo of you + Ivy). Window centre-left with a mustard roller blind + coral curtains. Wall clock above Gary's
spot at the left end of the gaming desk. Big monitor (front view), RGB keyboard + under-desk strip, red gaming chair seen
from behind, shelf (500 trophy, Ivy's rocket, mini-you figure), desk lamp, headphones on a hook, the door (far right).

**Options:** `time 'morning'|'day'|'night'` (default day) · `clock 'H:MM'` or hours number (default `'7:30'`) ·
`monitor` svg|fn(w,h) (default: off/black) · `monitorGlow 0..1` (light thrown by the screen at night, default 1 when a monitor is
set) · `storm 0..1` (storm sky, animated rain on the glass, wind in curtains + tree) · `flash 0..1` (lightning bolt in the
window + white flash + window light on the floor) · `greenGlow 0..1` (room lit green from screen + checkpoint) ·
`redBlink 0..1` (red alarm light; blink it yourself, e.g. `Math.floor(t*3)%2`) · `door 0..1` (opens onto the dark landing) ·
`sleep` (blanket pulled up over a sleeping hero) · `chair` (default true) · `chairX` (default 1210) · `mess 0..1` (default
.35: sock, comic → sneakers, game cases, pizza box, hoodie, paper balls; the rug centre stays clear) · `blind 0..1` (roller
blind, default .22) · `lights 0..1` (string-light glow, default 1 at night) · `lamp` (desk lamp on) · `headphones` (default
true; hide when he wears them) · `lowGfx 0..1` · `glitch 0..1` (grey "missing texture" squares + horizontal jitter).

**Layers:** front = blanket (+ the gaming chair back). Night = dark-blue palette, monitor light pool + soft vignette rings
(or moonlight from the window when the monitor is off), glowing string lights, RGB strip.

| anchor | value | notes |
|---|---|---|
| `FLOOR.heroRoom` | 990 | stand line, hero s .5 |
| `SPOTS.heroRoom.checkpoint` | {x 870, y 905, s .5} | `R.checkpoint({...spot, t})` — pad fills the rug |
| `.bowl` | {x 1058, y 630, s .2} | `fishbowl({x, y, s})` (rig/extras.js) on the desk top, under the clock |
| `.clock` | {x 1035, y 200, r 50} | zoom here for "7:30 AGAIN" |
| `.monitor.screen` | {cx 1355, cy 455, w 470, h 264} | the monitor's screen box |
| `.desk` | {x0 980, x1 1660, top 630} | |
| `.chair` | {x 1210, seat 742, s .42} | sit him in `view:'back'` with hips on `seat`, draw before `front` (chair back hides the body, head shows) |
| `.bed` | {x0 84, x1 644, top 690, pillow {180, 660}} | |
| `.bed.lie` | {x 330, y 905, s .45, rot −90} | lying, head on the pillow; draw before `front` with `sleep: true` |
| `.bed.sit` | {hip 698, feet 880, x0 300, x1 600} | sitting on the bed edge |
| `.door` | {x0 1700, x1 1888, top 286, knob {1722, 540}, exit {1794, 778, s .38}} | walking out: `door: 1`, hero at `exit` |
| `.window` | {x0 660, y0 170, x1 940, y1 520} | |
| `.wallBase` / `.ceiling` / `.slopeY(x)` | 770 / 70 / attic slope | |

Camera tips: the 2 AM wide = `{zoom 1}` with hero in the chair; push in on `.clock` (zoom 3+) or `.bowl` (zoom 4: Gary's
blink; SC07 tiny-you-in-the-bowl uses the fishbowl's own layers). For the screen use `deskClose`; for his lit face `deskFace`.

## 1b. `deskClose(t, o)` — the gaming close-up

Camera right at the desk: monitor screen 1100×620 centred (1000, 420), RGB keyboard + mouse pad on the desk surface (back
edge y 800), Gary's bowl at the left (bigger), the wall clock above it, a slice of the stormy window at the far left,
headphones on a stand + juice box at the right. Same options as heroRoom (`time, clock, monitor, monitorGlow, storm, flash,
greenGlow, redBlink, lamp, lowGfx, glitch, headphones`).

| anchor | value |
|---|---|
| `SPOTS.deskClose.screen` | {cx 1000, cy 420, w 1100, h 620} |
| `.hands` | L {760, 905} (WASD) · R {1500, 925} (mouse) · keyboard box x 600–1300, y 852–968 — arms come in from the bottom edge |
| `.bowl` | {x 240, y 884, s .47} |
| `.clock` | {x 286, y 196, r 84} |

## 1c. `deskFace(t, o)` — reverse shot from inside the monitor

The hero sits in his big red gaming chair facing the camera, lit by the screen; behind him the dark bedroom (window with
the storm at the left, poster, the door). Draw him between `mid` (room + chair) and `front` (desk edge + keyboard from the far
side, juice box, mouse). Options: `time, storm, flash, greenGlow, redBlink, lowGfx` + `glow 'blue'|'green'|'red'|'orange'|
'white'|'#hex'` (screen-light colour; default blue at night, none by day) · `glowK 0..1` · `flicker 0..1` (game light).

| anchor | value |
|---|---|
| `SPOTS.deskFace.hero` | {x 960, seat 830, s .9} — front view, hips on the seat: `y = seat + 306*s` with straight legs (hidden by the desk) |
| `FLOOR.deskFace` | 830 (the seat) |
| `.hands` | L {820, 960}, R {1420, 960} · `.deskTop` 870 |

## 2. `stairs(t, o)` — side view, landing → 12 steps → hallway (SC04 tumble)

Your door (DO NOT DISTURB) on the upstairs landing (floor y 430, top-left), a round window, 12 carpeted steps descending to
the RIGHT, the downstairs hallway (floor y 937) with the teal front door, coat hook (raincoat + Bea's backpack), shoes,
plant. Six family photos climb the wall along the slope (Dad, Mom, Bea, baby you, Gary, family) above a wall handrail;
under-stairs cupboard; living-room doorway under the landing. Front layer = the two newel posts. Hero scale **s .34**.

Options: `time 'morning'|'day'|'night'` (default morning: sunbeam from the round window) · `skate` (Bea's skateboard on step 1)
· `heroDoor 0..1` (your door opens) · `lowGfx` · `glitch`.

| anchor | value |
|---|---|
| `SPOTS.stairs.steps[i]` | centre of tread i: x = 599 + 78·i, y = 469 + 39·i (i 0…11) |
| `.landing` | {x0 −900, x1 560, y 430, x 470} · `.heroDoor` {x0 230, x1 410, top 10, x 320} |
| `.bottom` | {x 1630, y 937} · `.floor` 937 · `FLOOR.stairs` 937 |
| `.skate` | {x 677, y 508, s .6, rot 0, step 1} — when it flies off, set `skate:false` and draw `H.skateboard(x, y, s, rot)` |
| `.rise/.run/.slope` | 39 / 78 / .5 |
| `.frontDoor` {x0 1690, x1 1880, top 467} · `.livingDoor` · `.rail` · `.roundWindow` | |

Tumble: lerp the hero along `steps[]` with `rot` spinning (rot pivots at the torso), squash on each tread; crumble on step
~8–11 (the FX kit's crumble). Camera: start zoomed on the landing (zoom 1.8 at x −250, y −200), whip down to the bottom.

## 3. `kitchen(t, o)` — the family kitchen (SC02, SC04, SC06 dinner, SC07, SC11)

Cream walls + mint hex-tile backsplash, open shelves, copper hood. The window over the sink shows the STREET (lavender house
across, a power line with 3 birds + 2 flying birds that freeze). LEFT: fridge (Bea's mushroom drawing "BRO", calendar with
FRI ★ TALENT SHOW). CENTRE-LEFT: the **kitchen island** with the cooktop and frying pan — Dad stands BEHIND it facing the
camera. RIGHT: breakfast table with a gingham cloth (front layer; hides seated legs) and three chairs behind it (Bea's with a
pink booster), pendant lamp, frying-pan clock, Mom's teal coat + bag on the hooks by the yellow back door.

Options: `time 'morning'|'evening'` (evening = dinner: dusk window, lamp glow, dinner plates) · `meal 'pancakes'|'dinner'` ·
`panCake` (default true) · `stack` (pancake stack on the island, default true) · `steam` (default true) · `coat` (default
true; false = Mom has left) · `birds` (default true) · `frozen 0..1` + `freezeAt` (birds stuck mid-flap, steam stops) ·
`clock` · `lowGfx 0..1` · `glitch 0..1`.

**Layers:** front = the island (with pan, pancake stack, utensil crock) + the table.

| anchor | value | notes |
|---|---|---|
| `FLOOR.kitchen` | 990 | stand line, s .5 |
| `SPOTS.kitchen.dad` | {x 650, y 820, s .5} | behind the island (draw before `front`) |
| `.pan` | {x 650, y 612} | the pancake in the pan |
| `.panHang` | {x 650, y 300} | the frozen pancake "thinking about it" (SC07); pancake on Dad's head: pan → his head |
| `.stack` | {x 930, y 632} | |
| `.seats[]` | Bea {x 1300, hip 712, s .3} · you {1490, hip 830, s .42} · Mom/Dad {1680, hip 840, s .45}; `.y` = feet with straight legs | draw before `front` |
| `.table` | {x0 1150, x1 1830, top 742} | |
| `.coat` | {x 1370, y 330} · `.backDoor` {x0 1660, x1 1860, top 250, exit {1760, 800, s .42}} | Mom runs out the back door |
| `.window` {640,150,1080,470} · `.birds` {y 252} · `.clock` {1240, 170, r 62} · `.lamp` {1580, 330} · `.fridge` · `.island` | | |

Tips: the opera-on-a-chair gag: put the hero on a chair at x ~950, y 990 (in front of everything). Jumping-for-a-checkpoint
(SC02): hero centre-front. Glitch SC07: `glitch` + `frozen` + `panHang`.

## 4. `workshop(t, o)` — Ivy's garage lab (SC02, SC06, SC11)

The open garage door on the LEFT shows the driveway and the street (day or sunset). Plywood back wall with the rocket
sneakers' SCORCH MARK (a starburst with two sneaker prints), pegboard with painted tool outlines over the workbench (vise,
half-built robot head, clamp lamp, pencil mug), metal rack of half-built inventions (robot arm, toaster-drone, BOOM? box,
jars, goggles), wooden sign **IVY'S LAB — KNOCK FIRST (OR EXPLODE)**, chalkboard **DAYS SINCE LAST EXPLOSION: 0**, rafters with
string lights, fire extinguisher. FRONT-CENTRE: the folding **rehearsal table** (purple star cloth) = `front`.

Options: `time 'day'|'evening'` · `soot 0..1` (smudges on walls/floor) · `boom 0..1` (fresh hit: smoke cloud rising + embers +
lava glow; 0 = the old faint mark) · `poster` (SCHOOL TALENT SHOW — FRIDAY · "IVY & YOU: SCIENCE MAGIC!" pinned on the
pegboard) · `quiet` (sad beat: dusk + dim + desaturated, string lights off, one warm work-lamp pool, garage door half down) ·
`days` (chalkboard number) · `door 0..1` (garage door down) · `table` (default true) · `lowGfx`.

| anchor | value |
|---|---|
| `FLOOR.workshop` | 990 (s .5) |
| `SPOTS.workshop.table` | {x0 700, x1 1180, top 760, x 940} · `.hat` {1070, 754} · `.flasks` {820, 754} (props from rig/extras.js stand on the cloth) |
| `.behindTable` | {x 940, y 900, s .46} (Ivy presenting behind the table: draw before `front`) |
| `.scorch` | {x 780, y 430} (where Ivy hits the wall in SC02) |
| `.ivy` {1300, 990, s .5} · `.bench` {x0 900, x1 1520, top 600} · `.peg` · `.rack` {shelves 300/480/660} · `.opening` {x0 −260, x1 620, y0 150} · `.outside` {y 800, s .3} | |

## 5. `gameScreen(t, o)` → `fn(w, h)` — MEGA OBBY: 1000 STAGES

For any screen box (monitor, deskClose, a phone, a giant window). A 1600×900 design box FIT into w×h (the sky fills the rest;
the HUD hugs the real corners; clipped to the box). Endless zig-zag tower of neon studded platforms around a spire over
lava; the hero's mini avatar (orange bowl cut, red jacket, yellow shirt, green pants) on the current stage's checkpoint; the
golden final platform with the big 1000 flag. HUD: `STAGE 999` pill, title, `FALLS: 4,816 · RESPAWNS: 4,816`, progress bar.

Options: `stage` (999) · `falls`, `respawns` (4816) · `jump 0..1` (the final jump; the view scrolls up with him; at 1 the HUD
says 1000) · `fall 0..1` (falls into the lava, splash + block bits at the end) · `respawn 0..1` (pops on the checkpoint
inside a forcefield ring) · `win 0..1` (green flood + FINAL CHECKPOINT! banner + block confetti — SC03's "screen floods green")
· `lava 0..1` · `hud` · `title` · `avatar` (false hides him) · `run` (avatar run phase).

## 5b. `obbyWorld(t, cam, o)` — full-frame "inside the game" (SC02 fearless, cutaways)

Same look, real size: course of neon platforms on pillars over a lava sea, world x −300…5600 (move RIGHT). Parallax: sky 0,
pixel moon .03, far towers .12, floating deco platforms + MEGA OBBY sign .4, course + lava 1, rising embers 1.2 (fg).
Hero (rig) **s .4**. Options: `stage` (number of the first checkpoint, default 997) · `lava 0..1` · `win 0..1` · `flag 0..1`.

| anchor | value |
|---|---|
| `FLOOR.obbyWorld` / `.start` | 748 / {x 200, y 748} |
| `SPOTS.obbyWorld.platforms[]` | 13 × {x, x0, x1, y (stand line), k 1, kill, cp, final}: x 260, 900, 1240(kill), 1590, 1960, 2340(cp), 2720, 3040(kill), 3380, 3760(cp), 4140, 4480(kill), 5020(final) |
| `.checkpoints[]` | {260, 748}, {2340, 668}, {3760, 548} (labels stage, stage+1, stage+2) |
| `.final` | {x 5020, y 388, flag {5040, 88}} · `.lavaY` 950 |

## 6. `street(t, cam, o)` — the family's street (SC01 bike crash, SC04/SC07 outside, SC08 frozen yard)

One plane (k 1) holds houses, front yards, the white picket fence, the sidewalk (stand line y 935) and the road (bottom).
World x −2600…6400: the **hill** at the left (x −1500…250; the sidewalk climbs 470 px — ground at any x =
`SPOTS.street.standY(x)`), the **bump** (lifted slab + root) at x 300, **our house** at x 900 (two storeys, peach siding,
dark-teal roof, chimney, your gable window, house number 42, red mailbox at the gate), **Bea's trampoline** in the yard
(x 1560), **Ivy's house** with the open garage (x 2320), a yellow house, the **bus stop + STOP sign** at the corner (side street
x 3560–3860), more houses. Behind: back row of roofs + trees (k .55), hills with the water tower (k .2), sky (k 0), clouds
(k .06), flying birds (k .7); power poles + three wires along the fence line (k 1) with birds on the top wire; falling
leaves; branches hanging in from the top (fg k 1.25). Hero **s .34** on the sidewalk.

Options: `time 'morning'|'day'|'sunset'` (default morning) · **`lowGfx 0..1`** — objects pop one by one (each has its own
threshold; a white blink + squash as it switches) into 2006 graphics: flat beige/grey boxes, cube/cone trees, box clouds,
square sun, fence → grey wall, poles → boxes, straight wires; the ground, road and sky flatten smoothly. Animate 0 → 1 over
~1.5 s · `frozen 0..1` + `freezeAt` (stutters, then everything stops at `freezeAt`: birds stuck mid-flap, leaves hanging) ·
`red 0..1` (alarm-red void sky + red-tinted world + siren pulse) · `dog: x | { x, flip, walk, s, through }` (the dog on the
sidewalk; `through: true` = it is half inside the fence plane — the lag gag) · `bus: x | { x, flip, sign, s, ghost }` (school bus
on the road; rubber-band its x with `K.rubber`) · `birds` · `leaves` · `checkpoint` (soft green glow on the sidewalk spot).

| anchor (all k 1) | value |
|---|---|
| `FLOOR.street` / `.stand` | 935 · on the hill `SPOTS.street.standY(x)` |
| `.hill` | {x0 −1500, x1 250, top 465, start {x −1700, y 465}} — bike starts at the top |
| `.bump` | {x 300, y 935} — the bike hits it, he flies over the bars |
| `.checkpoint` | {x 700, y 935} — respawn by the house (pad s .34) |
| `.house` | {x 900, base 680, door {900, 680}, heroWindow {900, 198}, roofTop {900, 70}} |
| `.yard` | {y0 700, y1 860, s .27} — Dad frozen mid-yard at y ~830 s .3 |
| `.trampoline` | {x 1560, y 728, s .22} — Bea's feet on the mat |
| `.fence` | {y 880, x0 −2000, x1 3500, gate {x0 800, x1 1000}} |
| `.ivy.garage` · `.busStop` {3420, 935} · `.corner` · `.busLane` {y 1085 (wheels), s 1} · `.poles` {x0 470, every 1250, topY(x)} | |

Camera tips: default `{x 0}` frames the house; bike crash `{x −1300, zoom .85}` then follow; bus stop `{x 2600}`; lowGfx
reveal `{x 0, zoom .9}` holding still while it pops.

## 7. `town(t, cam, o)` — wide shots of Willowbrook (SC01 corrupted sunset, SC07 lag, SC08–SC09)

Seen from a little above; rows step up with depth: sky (k 0; **top-centre kept empty** for the giant system window), hills +
the WILLOWBROOK water tower (k .12), back row with **Willowbrook Middle School** (k .25 — same design as `sets_school.js`: long
single-storey cream building, teal fascia, lime panels, teal entrance block with the clock, sky-blue barrel-roof gym, very tall
silver flagpole with the lime/teal flag at the left of the entrance), roofs row + the park with a pond, fountain and bench
(k .42), MAIN STREET shops with awnings and flat roofs (BAKERY, LEVEL UP, SCOOPS, HARDWARE, BOOKS, PIZZA, FLOWERS, DINER —
k .68), the street (k 1: sidewalk y 990, lamps, planter trees, bench, the parked school bus).

Options: `time 'day'|'sunset'|'golden'|'night'` · **`red 0..1`** (corrupted Friday: alarm-red void with a pixel grid,
scanlines, drifting dead pixels and a siren pulse; the world tinted dark red; window area stays empty) · `crack 0..1` (only
darkens the sky a touch — the FX kit draws the crack in `SPOTS.town.crack`) · `frozen 0..1` + `freezeAt` · `lowGfx 0..1` (LOD
pops like the street) · `gray 0..1` (drained of colour) · **`colorBack 0..1`** — colour floods back: a circle grows from
`colorFrom` (screen point `{x, y}` or anchor `{x, y, k}`, e.g. the hero's feet) revealing the town at `colorTime` (default
`'golden'`) with red/gray/lowGfx/frozen off; a white-gold ring + a few coloured blocks ride the edge. Pass the current state
as the other options (e.g. `{ red: 1, frozen: 1, colorBack: k, colorFrom: heroAnchor }`) · `bus: x | {…} | false` (default
1560) · `birds`.

| anchor | value |
|---|---|
| `FLOOR.town` | 990 (k 1, hero s .26) |
| `SPOTS.town.street[]` | stand lines: {y 990, k 1, s .26} · {y 908, k .68, s .17} (in front of the shops) · {y 690, k .42, s .11} · {y 542, k .25, s .065} |
| `.roofs[]` | 21 spots: 9 house ridges (k .42, s .11), 10 shop parapets (k .68, s .17), school roof + gym (k .25, s .065) |
| `.lamps[]` | lamp heads x −650, 250, 1150, 2050 (y 581, k 1, s .26) |
| `.trees[]` | planter tree tops x −200, 700, 1600, 2500 (y 690, k 1) + 3 park trees (k .42) |
| `.busRoof` | {x 1560, y 878, k 1, s .26, x0 1330, x1 1790} |
| `.skyWindow` | {x 960, y 230, w 860, h 360, k 0} — keep the system window inside it |
| `.crack` {960, 230, r 440, k 0} · `.school` {1492, 540, k .25, flagTop {1390, 240}} · `.waterTower` {310, 270, k .12} · `.park` · `.bench` | |

Camera tips: `{zoom .7}` shows more rows for "hundreds of ghosts"; `{zoom 1.6, x 300, y 150}` = a street-level push-in. Many
ghost copies are expensive (a rig character ≈ 20 ms): draw far ones as cheap silhouettes / `K.draw.kid` at small s.

---

## Props + helpers (exported)

`skateboard(x, y, s, rot, tn)` (Bea's pink board, origin = under the wheels) · `pancake(x, y, s, rot)` · `schoolBus(x, y, s,
tn, {flip, sign 0..1, lowK, ghost})` (origin = under the wheels, 780×330 at s 1, faces left) · `streetDog(x, y, s, tn, {walk,
flip, lowK})` · `bird(x, y, s, tn, {flying, flap 0..1, flip, lowK})` · `wallClock(x, y, r, 'H:MM', tn, {rim, bells})` ·
`cloud`, `tree(x, y, s, tn, {lowK, sway, col})`, `pine` · `famHouse(x, base, tn, {lowK})` · `suburbHouse(x, base, i, tn)` ·
`trampoline(x, y, tn)` · `willowbrook(x0, base, tn, lk, t, night)` (the far school) · `shopFront(i, base, tn, lk, t, night)` ·
`lampPost(x, base, tn, lk, on)` · `miniAvatar(x, y, s, {run, up, rot, sq})` (the in-game hero) · `obbyPlat(x, y, w, {col, kill,
cp, final, flag, cpLabel, t})`.

Helpers: `toScreen(cam, a)`, `camTf(cam, k)`, `vis(cam, k)` (visible layer rect), `mix(a, b, k)`, `frameIn(svg, w, h)`,
`glow(x, y, r, id, op)` (small radial glows `shGlow{Warm,Green,Blue,Red,White,Lava}`), `pool()` (cel-shaded light pool),
`darkRing()` (vignette darkness with a soft elliptical hole), `redSky(x0, y0, x1, y1, k, t, {hole})`, `lowPop()`,
`tone({morn, eve, night, dim, low, gray, red})` — every fill goes through `tn.c(col)`, so one set renders at night / in low
graphics / drained / red; a colour written as `'!#RRGGBB'` is emissive (lit windows, LEDs) and is never toned. `tn` arguments of
the props default to the plain day tone.

## Scales at a glance

| set | hero s on FLOOR | other |
|---|---|---|
| heroRoom | .5 (990) | chair .42 · bed .45 · door exit .38 · bowl .2 · pad .5 |
| deskClose | — | bowl .47 |
| deskFace | .9 (seat 830) | |
| stairs | .34 | skateboard .6 |
| kitchen | .5 (990) | Dad behind island .5 · seats .3 / .42 / .45 |
| workshop | .5 (990) | behind the table .46 · outside .3 |
| obbyWorld | .4 (748) | |
| street | .34 (935) | yard .27–.3 · trampoline .22 · bus 1 |
| town | .26 (990) | .17 (k .68) · .11 (k .42) · .065 (k .25) |

## Performance

All sets: no filters, masks or blend modes; textures are `<pattern>`s in DEFS; long camera sets cull to the visible range;
light pools are small radial gradients or stacked ellipses. Measured with `tools/sheet_home.js` (set alone, all layers,
build + render at 1920×1080; the machine was shared, numbers ±10 ms):

| set | elements | build + render |
|---|---|---|
| heroRoom (day / night + monitor / storm + flash / green) | 255–355 | 27–48 ms |
| deskClose / deskFace | 65–155 | 22–45 ms |
| stairs | ~150 | 22–31 ms |
| kitchen | ~220 | 22–36 ms |
| workshop | 170–220 | 23–40 ms |
| gameScreen on the monitor (inside heroRoom night) | +~80 | +8 ms |
| obbyWorld | 90–130 | 26–29 ms |
| street (any option, incl. lowGfx .5 + red + dog + bus) | ~320–425 | 35–56 ms |
| town (day / red) | ~380 | 34–57 ms |
| town `colorBack` mid-flood (two towns + clip, B culled to the circle) | ~750 | 60–70 ms |

The four-in-one tiles on the sheet (quads) are 4 sets in one frame, not one set.
