# THE TOWN FAIR — `scenes/sets_fair.js` (SC08 · SC09 · SC10)

A small-town carnival at dusk: candy-striped tents and food stalls, the Ferris wheel, the giant teacups, string lights,
balloons, the BALLOON POP game booth, the COTTON CANDY stand, Grandpa's bench under a lamp and **the giant inflatable
dinosaur** (bright orange with a butter belly, purple spots, yellow back plates — deliberately NOT green, so Max in his green
dino suit reads on top of it). Cut-out style: bold #151515 outlines, flat colours, one light + one shade per part; dusk =
purple-rose sky with an orange horizon, warm bulbs, lamp glows. Contact sheet: `concept/sets_fair.png`
(`node tools/sheet_fair.js`; `--only fair_dino,bench` for some tiles, `--full DIR` for full-size PNGs, `--noref` hides the
reference cast + anchor marks). The sheet prints elements, JS build ms and browser render ms of each tile (the SET alone, all
layers incl. the crowd, no characters).

```js
const FS = require('./sets_fair');          // DEFS (ids `sf*`) are loaded by main.js automatically
const { FLOOR, SPOTS, SIT, seatPose } = FS;
```

## Conventions (same as the earlier camera sets)

**Camera sets** — `fair`, `dinoTop`, `fairEntrance`: `set(t, cam, o)` → svg; `set.layers(t, cam, o)` →
`{ bg, mid, front, crowd, fg, light }` **already transformed** by `cam = { zoom, x, y, fx, fy, sx, sy }` (straight from
`K.camKeys` / `K.shake`). Every sub-layer has its own parallax k. `String(L)` = all layers.

```js
const cam = K.camKeys(t, [[a, FS.SPOTS.fair.cams.main], [b, FS.SPOTS.fair.cams.cotton]]);
const L = FS.fair.layers(t, cam, { crowd: 0.7 });
let o = L.bg + L.mid;
o += K.view(cam, actor('kid', t, { ...SPOTS.fair.cotton.vendor }), 1);   // BEHIND the front occluders (vendor behind the counter)
o += L.front;
o += K.view(cam, family, 1);                                              // everyone on the stand lines (k 1)
o += L.crowd;                                                             // packed crowd rows IN FRONT of the stand line (o.packed)
o += L.fg + L.light;                                                      // light LAST (lamp glows tint characters too)
```

Anchors carry `k` (1 unless stated). Draw on an anchor with `K.view(cam, svg, a.k)`; `FS.toScreen(cam, a)` (or
`toScreen(cam, x, y, k)`) → `{x, y, z}` = where it is on screen now (HUD plates / tooltips / quest markers). `FS.camAt(x, y,
zoom, sx = 960, sy = 540)` → a cam that puts world point (x, y) of the k 1 plane at screen (sx, sy). Ready framings:
`SPOTS[set].cams` (`K.camKeys` between them).

**Room set** — `fairBench(t, o)` → svg (no camera); `fairBench.layers(t, o)` → world-space `{ bg, mid, front, crowd, fg,
light }` (`light` is screen space); `fairBench.compose(t, o, behind, onFloor, cam)` applies the camera (bg at parallax .6,
fg at 1.15). The world is padded to x −900…2820, so pushes / zoom-outs to ~.7 never show an edge.

**Depth.** Each ground is a k 1 plane seen from a little above: characters further back (smaller y) are smaller.
`SPOTS[set].sAt(y)` = the hero scale at any feet-y. `SPOTS[set].lines` = stand lines back → front `{ y, k, s, x0, x1, gaps,
sAt }`; `FS.placeCrowd(line, n, seed, {x0, x1, gaps})` → `[{x, y, s, k, flip, i}]` (jittered, depth-scaled, sorted back →
front) to drop real characters (`K.draw.kid(i, p)` / `K.draw.adult(i, p)` / `actor`) into the crowd.

**Seated characters** (same convention as `sets_home.js`): a seat anchor is `{ x, hip, s, turn?, rot?, pose }` = where the
HIPS go. `FS.seatPose(spot, size, extra)` → `{ x, y: hip + 306·s·size, s, turn, rot, ...pose, ...extra }`, `size` = the rig
size factor from `rig/cast.js` (YOU 1, Grandpa 1.1, Max .56). `FS.SIT = { legL 45, legR 45, kneeL 60, kneeR 60 }` is the
front-view sit (knees a little apart, shins down — feet land ≈ 260·s·size below the hips); `FS.SIT_SIDE` = profile sit.

```js
o += K.view(cam, actor('grandpa', t, FS.seatPose(SPOTS.fair.bench.seats[1], 1.1, { face: 'happy' })), 1);
o += K.view(cam, actor('max', t, FS.seatPose({ ...SPOTS.fair.dino.seat(t, w), pose: FS.SIT }, 0.56, { rot: SPOTS.fair.dino.seat(t, w).rot })), 1);
```

## Options (all sets)

| option | values | what |
|---|---|---|
| `time` | `'afternoon'` · `'dusk'` · `'golden'` or weights `{ dusk: .4, golden: .6 }` | palette + sky + sun. Defaults: `fair` / `fairBench` dusk, `dinoTop` golden, `fairEntrance` afternoon. Golden = the warm HUD-off reunion light (warm wash + soft sun rays in `fair`). Weights crossfade smoothly — ease them over a beat. |
| `lights` | 0..1 | bulbs, lit signs/stall interiors, lamp globes + glows, ground light pools. Default dusk 1, golden .6, afternoon 0 |
| `crowd` | 0..1 | crowd-fill density of the rows BEHIND the stand lines (default .6; 0 = an empty fair) |
| `packed` | 0..1 | packed crowd rows IN FRONT of the stand line (`L.crowd`, y 1010 / 1096 / 1195 / 1307 / 1437) — "thousands of people", the hero lost in the crowd. Default 0 |
| `near` | 0..1 | (`fair`) dark backs of heads along the bottom edge (fg, k 1.3) — always placed at the frame bottom whatever the cam |
| `cheer` | 0..1 | crowd arms up + bounce + open mouths (applause under the dinosaur). `dinoTop` default 1 |
| `quiet` | 0..1 | the HUD-off silence: the crowd desaturates (78 %) and dims a little, the set desaturates 35 %. Cheap (palette only). Ease 1 → 0 for "then colours, music, laughter, faces" |
| `wobble` | 0..1 | the inflatable dinosaur's sway (neck/head ±7°, tail, body squash). Default .5. Anchors on the dino follow it — pass the same value to `seat/hug/climbAt` |
| `flash` | 0..1 | white flash in `light` |

`fair` extras: `canopy` (big string-light canopy across the top of the frame, fg k 1.3 — lovely for medium golden shots),
`balloon: {x, y, s}` (Max's dino balloon floating at a world point — "only his balloon bobbing"), `wheel` (Ferris wheel
speed, default 1 = one turn per minute), `spin` (teacups speed), `riders: false` (empty teacups), `dinoFace: 'roar'`,
`dinoLook: [x, y]` (−1..1 pupils), `dinoCol: {body, shade, belly, spots, plates, …}`.
`fairBench` extras: `bokeh` 0..1 (default 1), `fgBokeh` (soft foreground discs in the corners), `popcorn` (a popcorn box on
the bench end), `balloon` (Max's dino balloon tied to the armrest). `dinoTop` extras: `confetti` 0..1, `dinoFace`,
`dinoLook` (default looks down-right at the climber).

`t` (absolute seconds) only drives idle motion (wheel, swing ride, teacups, bulb twinkle, balloons, flags, crowd bob, dino
wobble): pass a constant `t` to freeze it.

---

## 1. `fair(t, cam, o)` — the fairground (SC08, SC09 wide, SC10)

World (k 1, x −3000…7000): sandy fairground from the back grass strip (y 700) to the camera, a lighter trodden midway band
(y 872…1050), scattered popcorn/ticket litter, light pools under lamps. Left → right on the k 1 plane:
the **TOWN FAIR arch** (x −2300, base 780) + **TICKETS** kiosk (x −1660) · **GRANDPA'S BENCH** (x −1050, base 905) under its
**lamp** (x −680) in a quiet gap of the crowd · the **BALLOON POP** game booth (x 150: balloon wall, a plush T-rex / bear / star
prizes, "3 DARTS $2" counter) · the **balloon cart** (x 880: a big bunch incl. two green dino balloons) · the **COTTON CANDY**
stand (x 1720: pink-white awning, bagged cotton candy, the spinning machine, a giant cotton candy on a cone on the roof) ·
the **GIANT TEACUPS** (x 3200: lilac platform with bulbs, a flowered teapot hub, 4 pastel cups orbiting + spinning with cheap
riders waving, white rail fence, TEACUPS sign) · the **GIANT INFLATABLE DINOSAUR** (x 5250, base 800, 1392 px tall, tether
ropes, blower duct, DINO BOUNCE sign). Lamp posts at x −680 / 1250 / 2450 / 4150 / 6350; string-light poles along the back
line with bulb strings at y ≈ 230…330 (k 1). Behind: the back row of tents + food stalls (POPCORN, CORN DOGS, LEMONADE,
SNOW CONES, FUNNEL CAKE, CANDY APPLES, PRIZES) with its own string lights (k .8) · the **FERRIS WHEEL** (k .6, hub
(1150, 190), r 430, 12 gondolas, chasing rim bulbs) + a swing ride (k .6, x 2950) · drifting lost balloons (k .45) · far
rides: drop tower + two big tops + tree line (k .3) · hills with the town, water tower, steeple, lit windows (k .12) ·
clouds (k .04) · sun / moon (k .02) · sky (k 0, flat stepped bands).

**Layers:** bg = sky … stall row (k .8) · mid = ground + every k 1 item depth-sorted (poles + strings, arch, ticket booth,
bench, lamps, booth, cart, cotton candy, teacups + fence, dinosaur, the 4 crowd-fill rows y 752…848) · **front = the game
booth counter + the cotton candy counter** (vendors drawn before it stand behind) · **crowd = packed rows** (`packed`) · fg =
near heads (`near`) + canopy lights (`canopy`) · light = lamp / stall / arch / wheel glows, golden rays + warm wash, dusk
floor fade, flash.

| anchor (k 1) | value | notes |
|---|---|---|
| `FLOOR.fair` / `sAt(y)` | 960 / .4·(y − 420)/540 | hero s .4 ≈ 380 px tall; head top ≈ y 580 at zoom 1 |
| `.lines[4]` | y 880 (s .341) · 920 (.37) · 960 (.4) · 1010 (.437), x −2600…6800 (880 has the bench gap −1420…−560) | stand lines for real characters (`placeCrowd`) |
| `.crowdRows` | back [752, 784, 816, 848] (in mid) · front [1010, 1096, 1195, 1307, 1437] (`packed`, L.crowd) | cheap fill rows |
| `.arch` | {x −2300, y 780, s .267}; `.under` (−2300, 786, s .271); `.sign` (−2300, 207) | the TOWN FAIR arch from inside the fair |
| `.ticket` | (−1660, 800) | |
| `.bench` | {x −1050, y 905, seatY 811}; `.seats[2]` = {x −1240 / −860, hip 811, s .359, turn ±.3, pose SIT}; `.front` (−1050, 960, s .4); `.lamp` (−680, 273) = the globe | `seatPose(seats[i], size)`; the crowd leaves the bench alone |
| `.booth` | {x 150, y 830}; `.vendor` (150, 790, s .274) — draw BEFORE `L.front`; `.front` (30, 960, s .4); `.counterTop` 678 | BALLOON POP |
| `.cart` | {x 880, y 880}; `.bunch` (880, 437) | the balloon bunch top |
| `.cotton` | {x 1720, y 845}; `.vendor` (1720, 805, s .285) — before `L.front`; `.front` (1980, 960, s .4); `.counterTop` 688; `.sign` (1720, 310) | "Cotton candy? Every kid goes to cotton candy." |
| `.teacups` | {x 3200, y 870, s .333, x0 2567, x1 3833}; `.gate` (3067, 930, s .378); `.front` (3200, 960, s .4) | riders are drawn by the set |
| `.ferris` | {x 1150, y 190, r 430, **k .6**}; `.top` (1150, −240, k .6); `.stand` (1150, 960, s .4, k 1) | the wheel is on the k .6 layer: aim at it with `toScreen(cam, SPOTS.fair.ferris.top)` |
| `.dino` | {x 5250, y 800, s .281, height 1392}; `.headTop` (4800, −590); `.base` (6180, 800) = tail tip on the ground; `.front` (4950, 960, s .4) | hero on the dinosaur is s .281 (1/5 of its height) |
| `.dino.seat(t, wobble = .5)` | → {x, y, hip, rot, s .281} on top of the head (≈ (4811, −594) at rest) | Max: `seatPose({...seat, pose: SIT}, .56, {rot})` |
| `.dino.hug(t, wobble)` | → {x, y, hip, rot, s} just behind Max on the head (≈ (4931, −579)) | the hero's feet / kneel point for the hug |
| `.dino.climbAt(u, t = 0, wobble = .5)` | u 0..1 → {x, y, rot, s .281}: 0 = tail tip (6209, 719) → up the tail → over the back (u .5 ≈ (5321, 31)) → up the neck → 1 = the hug spot | the climb path (feet on the surface; `rot` = slope, + = clockwise) |

| cams | value | shows |
|---|---|---|
| `main` | {0, 0, 1} | booth, balloon cart, the Ferris wheel above, cotton candy — the default fair look |
| `wide` | camAt(1800, 430, .55) | the fair from the booth to the teacups (use `crowd .8` + `packed .5`) |
| `crowd` | camAt(1300, 720, .62) | "thousands of people" — with `crowd 1, packed 1, near 1` a sea of heads (plates over `crowdHeads`) |
| `over` | camAt(1500, 860, .75) | low over the packed crowd — truck it sideways for "the camera flies over the crowd" |
| `arch` · `bench` · `booth` · `cotton` · `teacups` | camAt(−2250, 520, .85) · (−1000, 650, 1.2) · (250, 640, 1.05) · (1800, 660, 1.1) · (3200, 600, .9) | see the sheet |
| `ferris` | camAt(1150, 520, .85, 960, 600) | "I wanna go UP! Where the clouds are!" — the wheel fills the sky over the family |
| `dino` | camAt(5200, 240, .6) | the whole dinosaur + its crowd |
| `dinoFar` | camAt(4100, 260, .42) | "THERE! On top of the dinosaur!" from the teacups side (add `packed .4` so the foreground is people) |
| `dinoHead` | camAt(4850, −560, 1.15) | Max on the head / the hug, the fair far below |
| `run[4]` | camAt(800 / 1900 / 3300 / 4800, 470 / 470 / 470 / 420, .8) | "past the Ferris wheel… past the cotton candy… past the giant teacups" — `K.camKeys` through them while the runners stay at screen centre |

Helpers for this set: **`FS.crowdHeads(cam, o, which = 'all'|'back'|'front')`** → `[{x, y, s, row, i, kid}]` = screen
positions of the visible fill people's head tops (pass the same `crowd` / `packed` you pass to `fair`) — put a stat plate
over each one for the "sea of numbers"; `s` is the on-screen scale (~.1–.6) to size plates.

**Plate space (SC08):** at `cams.main` the stand-line heads top out at y ≈ 580; the band y 400…570 above them is mid-tone
awnings / signs / the balloon bunch — busy but darker than the plates. The cleanest sky above heads: `cams.ferris` (the
wheel + dusk sky) and `cams.dinoFar`. In `crowd` / `over` the plates float over other heads — that IS the overload gag.

**Shot tips.** SC08 open: `fairEntrance` (afternoon → dusk) then `fair` `cams.wide` dusk. Max "I wanna go UP" = `cams.ferris`.
"Thousands of people" = `cams.crowd` + `crowdHeads` plates, then `cams.over` trucking right (x +600 over 3 s). "Where's Max?"
= `cams.cotton` or `main` with `balloon: {x, y: 520, s: .45}` bobbing where Max stood. SC09 wide of the bench = `cams.bench`
(then cut to `fairBench`); the HUD-off moment: `quiet` 1 → 0 over ~2 s while `time` crossfades `{dusk: 1-k, golden: k}`.
SC10 search: `run` cams with `time 'golden'`, `canopy: true`; Tank's shoulders over the crowd = `packed .6` + the trio on
line 1010; "THERE!" = `cams.dinoFar` → `cams.dino` (Max on `dino.seat(t)`, `cheer` 1, `wobble` .7); the climb = lerp
`dino.climbAt(u)` with a run/climb cycle, then `dinoTop`.

## 2. `fairBench(t, o)` — Grandpa's bench (SC09, room set)

A close two-shot: the park bench (wood slats, black iron frame with curly armrests) centred at x 960 on the floor y 1000,
the vintage **lamp** at x 300 (globe y 165, warm glow + light cone + pool on the ground), a flowered hedge behind the bench,
and an out-of-focus carnival: soft Ferris wheel (no outlines), soft tent shapes, 64 bokeh discs in three loose arcs + big
soft discs, the stepped dusk sky. Calm and low-contrast — the faces carry the scene.

**Layers:** bg (blurred carnival, compose parallax .6) · mid (ground, hedge, lamp, bench, opt-in popcorn / balloon) · front ''
· fg (opt-in corner bokeh, parallax 1.15) · light (screen space: lamp glow + cone + pool, golden wash, flash).

| anchor | value | notes |
|---|---|---|
| `FLOOR.fairBench` | 1000 | |
| `SPOTS.fairBench.hero` / `.grandpa` (= `.seats[0/1]`) | {x 730 / 1190, hip 848, s .58, turn ±.3, pose SIT} | `seatPose(seats[i], size)`: YOU 1, Grandpa 1.1 |
| `.seatY` | 848 | the seat top (hips) |
| `.stand[2]` | (520, 1000, s .6) · (1440, 1000, s .6) | standing either side (Grandpa walking him over) |
| `.lamp` | (300, 165) | the globe |

cams: `wide` {0, 0, 1} · `two` camAt(960, 640, 1.12) · `hero` camAt(760, 600, 1.6) · `grandpa` camAt(1180, 560, 1.6) · `lamp`
camAt(420, 460, 1.3) · `up` camAt(960, 420, 1.05) (more sky over their heads: room for the swirling numbers before the X).

## 3. `dinoTop(t, cam, o)` — on top of the inflatable dinosaur (SC10 climax)

The same dinosaur drawn ×1.42 (hero s ≈ .4 on it): the head fills the left-centre (big friendly eyes looking at the climber,
smile with soft teeth), the neck runs down to the bottom-right with its plates; Max's seat is on top of the head at about
(811, 301). Behind (k .45) the fair far below: stall row, string lights and a **cheering crowd** (4 rows, s .1–.15) along the
bottom; the Ferris wheel (k .3) at the right, the hills (k .12), sky (default golden). `confetti` 0..1 throws cheap paper
confetti in `light`.

| anchor (k 1) | value | notes |
|---|---|---|
| `SPOTS.dinoTop.s` | .399 | hero scale on the dinosaur |
| `.seat(t, wobble = .5)` | ≈ (827, 295), hip, rot = the head's sway | Max: `seatPose({...seat, pose: SIT}, .56, {rot})` |
| `.hug(t, wobble)` | ≈ (997, 317) | the hero arriving beside Max (feet) |
| `.climbAt(u, t, wobble)` | u 0 = (1250, 1232) just below the frame → up the back of the neck → 1 = `hug` | `rot` = slope (steep: lean / rotate the climber) |
| `.headTop` | (811, 301) | at rest |
| `.crowd` | {y 1030, k .45, s .13} | the crowd's front row far below (aim reactions with `toScreen`) |

cams: `close` {0, 0, 1} · `wide` camAt(1000, 620, .78) (more crowd below) · `hug` camAt(860, 360, 1.35) · `max` camAt(780,
300, 1.7) (Max's RAWR) · `below` camAt(1100, 900, .9) (tilt down to the applause).

## 4. `fairEntrance(t, cam, o)` — the family arrives (SC08 open, "Mom's first day off")

The **TOWN FAIR** arch spans the path: candy-striped posts (x 492 / 1428) on plinths with pennants, an arched navy header with
rainbow letters, marquee bulbs, a WELCOME! ribbon and bunting; balloons tied to both posts; the red TICKETS kiosk outside
left; white picket fences with bunting to both sides; a sandy path running into the fair. Through the arch (k .7): tents, food
stalls, string lights and a crowd; the Ferris wheel + drop tower (k .5), tree line (k .3), hills (k .12), sky.

| anchor (k 1) | value | notes |
|---|---|---|
| `FLOOR.fairEntrance` / `sAt(y)` | 960 / .36·(y − 520)/440 | s .36 under the arch |
| `.under` | (960, 960, s .36) | standing under the arch |
| `.lines[4]` | y 920 (.327) / 960 (.36) x 560…1360 (between the posts) · 1010 (.401) / 1060 (.442) x −200…2120 | |
| `.walkIn` | from (1180, 1180, s .54) → to (960, 900, s .311) | walk into the fair (view 'back', s = sAt(y)) |
| `.arch` | {posts [492, 1428], sign (960, 186)} | |
| `.ticket` | (200, 940); `.window` (200, 712) | |

cams: `wide` {0, 0, 1} · `family` camAt(960, 700, 1.35) · `sign` camAt(960, 260, 1.4) · `low` camAt(960, 560, .85, 960, 600).

---

## Props + helpers (exported)

`inflatableDino(t, {tone, lw, wobble, face, look, col, sign, ropes})` (local units, origin = ground under the body, faces
left) · **`dinoBalloon(x, y, s, t, {tone, string})`** (Max's green foil T-rex balloon; s 1 ≈ 300 px) · `balloon(x, y, s, col,
t, {string})` · `cottonCandy(x, y, s, col)` (hand prop, origin = the grip) · `bench(tn, lw, w)` · `lampPost(tn, lw, on, h)` ·
`tent` · `stall` · `ferrisWheel(r, tn, lw, lit, t, {acc, speed})` · `teacupsRide` · `teacup` · `teapot` · `cottonCandyStand`
/ `cottonCounter` · `gameBooth` / `gameCounter` · `balloonCart` · `ticketBooth` · `archSign` · `swingRide` · `dropTower` ·
`bigTop` · `bunting(x0, y0, x1, y1, sag, size, tn)` · `lightsAcc(tn, lit, t)` (batched string lights: `.string()`, `.ring()`,
`.row()`, `.out()`) · `stripePole` · `awning` · `signBoard`. Props are authored in body units (a person ≈ 950 tall) and
placed with `scale(sAt(base))`, so they always match the cast; `lw = 6 / scale` keeps 6 px outlines.

Crowd: **`crowd(rows, {tone, t, cheer, light, faces, zoom, x0, x1})`** (cheap blocky R6 carnival-goers — rows `{y, s, seed,
dens, gaps, dx}`, deterministic per index so nothing flickers while the camera moves) · `crowdPeople(row, x0, x1, dens)` ·
`crowdHeads(cam, o, which)` · `placeCrowd(line, n, seed, o)`.

Helpers: `toScreen` · `camTf` · `vis(cam, k)` (visible rect of a layer) · `camAt` · `seatPose` · `SIT` / `SIT_SIDE` · `tone(o)`
/ `frameState(o)` (palette transformer; `'!#RRGGBB'` = emissive, never toned) · `mix` · `glow(x, y, r, id, op)` (small radial
glows `sfGlow{Warm,Pink,Cyan,Gold,White}`) · `dinoPose(t, wobble)` · `C` (the fair palette).

## Scales at a glance

| set | hero s on FLOOR | other |
|---|---|---|
| fair | .4 (960) | lines 880 .341 / 920 .37 / 1010 .437 · bench seats .359 · vendors .274 / .285 · teacups gate .378 · on the dinosaur .281 |
| fairBench | .58 (seated, hips 848) | standing either side .6 |
| dinoTop | .399 (on the dinosaur) | crowd below .1–.15 (k .45) |
| fairEntrance | .36 (960, under the arch) | 1010 .401 · 1060 .442 · walk-in .54 → .311 |

Cast size factors (rig/cast.js): YOU 1 · Mom 1.04 · Grandpa 1.1 · Max .56 · Benji .98 · Tank 1.35.

## Performance

No filters, masks or blend modes. The sky is 30 flat bands (a full-frame linear gradient costs ~15 ms); the ground has
batched specks instead of a full-frame pattern (~17 ms); far ground bands stop just below the next layer's ground (less
overdraw); every layer culls to its visible range; glows are small radial gradients (r ≤ ~300); the crowd is colour-bucketed
paths with one dark "silhouette" path per row for outlines (only hair/hats stroked) and LOD by on-screen scale; packed rows
are culled to the ones the camera sees. Measured with `node tools/sheet_fair.js` (set alone, all layers incl. crowd, build +
render at 1920×1080, median of 5) — the machine was shared with other agents' renders, so numbers move ±15 ms:

| set / framing | elements | build + render |
|---|---|---|
| fair main / cotton / teacups / ferris / dino / bench / arch / golden canopy | 440–800 | 30–70 ms |
| fair wide (crowd .8 + packed .5) · dinoFar (crowd 1, packed .5) | 800–1000 | 65–85 ms |
| fair crowd (crowd 1 + packed 1 + near) · over (packed 1, cheer) | 960–1080 | 68–90 ms |
| worst: fair wide + crowd 1 + packed 1 + near + canopy + cheer 1 | ~1070 | 85–100 ms (don't stack all of it at zoom .55) |
| fairBench | ~100 | 18–30 ms |
| dinoTop close / wide | 400–430 | 45–60 ms |
| fairEntrance wide / low | 440–480 | 40–65 ms |

The four-in-one tiles on the sheet are 4 sets in one frame (not one set). Characters (~20 ms each at s .5) come on top —
keep real characters in a packed-crowd shot to a handful and let the fill do the rest.
