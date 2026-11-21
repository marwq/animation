# CUBE CITY — the in-game sets (`scenes/sets_game.js`)

A blocky, candy-coloured toy city: every part is a brick with a lighter top face and studs, floating grass islands with
stepped dirt/stone undersides, cube clouds, chunky game signs (Lilita letters with a dark drop shadow), bold #151515
outlines, flat colours with one highlight + one shade per part. Clearly not the real house: pastel plaza tiles, saturated
blocks, a toy sky. Contact sheet: `concept/sets_game.png` (`node tools/sheet_game.js`; `--only plaza,tower` for some
tiles, `--full DIR` for full-size PNGs, `--noref` hides the reference hero + anchor marks). The sheet prints elements,
JS build ms and browser render ms of every tile (the SET alone, all layers, no characters).

```js
const GS = require('./sets_game');          // DEFS (ids `gs*`) are loaded by main.js automatically
const { FLOOR, SPOTS } = GS;
```

## Conventions

**Camera sets** — `plaza, arena, tycoon, tower, cityNight, cityDay`. `set(t, cam, o)` → svg; `set.layers(t, cam, o)` →
`{ bg, mid, front, fg, light }` **already transformed** by `cam = { zoom, x, y, fx, fy, sx, sy }` (straight from
`K.camKeys` / `K.shake`). Every sub-layer has its own parallax k (listed per set). `String(L)` = all layers.

```js
const L = GS.plaza.layers(t, cam, { time: 'sunset' });
let o = L.bg + L.mid;
o += K.view(cam, actor('you', t, { ...SPOTS.plaza.tree.hide }), 1);      // BEHIND front occluders (hide tree, sinking in the water…)
o += L.front;
o += K.view(cam, dadOnTheCrate + crowd, 1);                              // everyone on the floor / platforms (k 1)
o += L.fg + L.light;                                                      // light LAST (tints characters too)
```

Anchors carry `k` (1 unless stated). Draw on an anchor with `K.view(cam, svg, a.k)`; `GS.toScreen(cam, a)` (or
`toScreen(cam, x, y, k)`) → `{x, y, z}` = where it is on screen right now (for UI / FX overlays). `GS.camAt(x, y, zoom,
sx = 960, sy = 540)` → a cam that puts world point (x, y) of the k 1 plane at screen (sx, sy). Every set has ready framings
in `SPOTS[set].cams` (`K.camKeys` between them).

**Room sets** — `castleInterior, factoryInterior, avatarShop`. `set(t, o)` → svg (no camera); `set.layers(t, o)` →
world-space `{ bg, mid, front, fg, light }` (you apply the camera: `K.view(cam, L.bg, .7)`, the rest at k 1), or
`set.compose(t, o, behind, onFloor, cam)` (bg at parallax .7; `behind` = characters behind `front`, `onFloor` = after it).
Rooms are padded to x −2400…4300 (castle/factory) / −900…2820 (shop), so pans and zoom-outs to ~.6 never show an edge.

**Depth / crowds.** Each floor is a k 1 ground plane seen from a little above: characters further back (smaller y) are
smaller. `SPOTS[set].sAt(y)` gives the hero-sized scale at any feet-y. `SPOTS[set].lines` = crowd stand lines back → front
`{ y, k, s, x0, x1, gaps, hor }`; `GS.placeCrowd(line, n, seed, {x0, x1, gaps})` → `[{x, y, s, k, flip, i}]` spread along it
(jittered; draw them back → front, e.g. `K.draw.kid(i, p)`). Cheap far crowds: `GS.crowd(rows, {cheer, t, signs, light})`
(blocky heads + shoulders, colour-bucketed paths — what the arena stands use).

**Options.** `time: 'day' | 'sunset' | 'night'` on every set (tower + cityNight default to night). Values 0..1 animate —
ease them yourself between word times. `t` (absolute seconds) only drives idle motion (clouds, water, lava, flags,
torches, conveyor belts, crowd bob, neon): pass a constant `t` to freeze it. `flash: 0..1` = white flash in `light`.

**Tone.** Every fill goes through a per-frame `tone()` (day / sunset / night / attack-red / victory-dawn tints, distance
haze); `'!#RRGGBB'` colours are emissive (lit windows, neon, lava) and never darken. Characters must pop: the sets stay
softer/hazier than the cast and the floors are light pastels.

FLOOR (feet y of the main stand line, recommended hero `s`): `plaza 940 (.4) · arena 900 (.42) · tycoon 930 (.4) ·
castleInterior 980 (.5) · factoryInterior 1000 (.5; workers behind the belt 900, .45) · tower 960 (.36 on the
battlefield; .3 on the floors) · cityNight / cityDay 990 (.45, rooftop ledge) · avatarShop 900 (.5, podium)`.

---

## 1. `plaza(t, cam, o)` — spawn plaza / lobby + the first obby (SC01, SC04, SC07, SC12)

World (k 1, x −3400…6400): pastel lilac tile floor from the back hedge (y 640) to the camera (a gold path runs through the
middle). Left → right: the tree grove with the **HIDE tree** (x −620, in `front`), the 4 **SPAWN PADS** (x −150 / 150 / 450
/ 750, glowing cyan rings + rising light cubes), the signpost (ARENA ← · TYCOON VALLEY → · OBBY TOWER →), the tiered
**FOUNTAIN** (x 1380, gold star), the 3-step **BLEACHERS** (x 1720…2180), the speech **CRATE** (x 2330), the **PLAIN WALL**
= the obby's grey start block (x 2600…2910, top 700, "STAGE 1 / JUMP!" sign + flag 1), the **WATER** pool (x 2910…4190) with
three candy platforms (red / yellow / mint), the **STAGE 2** finish block with a checkpoint pad (x 4190…4790), more trees.
Behind: the portals terrace (k .8: ARENA x −640 · TYCOON VALLEY x 2560 · OBBY TOWER x 3700 — swirling arches with signs),
the leaderboard billboard (k .6, opt-in), the giant **CUBE CITY** letter-block sign on a floating island (k .5, letters bob),
the skyline with the far arena + obby tower (k .25), floating islands (k .14), cube clouds (k .06), sun/moon (k .03), sky.

**Options:** `time` · `pads: [k0, k1, k2, k3]` (spawn flash per pad: light beam + ring; pair it with the FX kit's pop) ·
`billboard` (`true` = TOP PLAYERS board on its scaffold; or svg centred on the screen box / `fn(w, h)` — gameui has its own
leaderboard billboard, so default none) · `skyscraper` (Granny's tower on the skyline, after SC06) · `wallSign: false` ·
`flowers` (foreground flower beds, k 1.3 — only for zoom ≥ 1 shots) · `flash`.

**Layers:** bg = sky…portals · mid = floor, hedge, pool (water body), trees, lamps, fountain, bleachers, pads, crate, wall,
platforms, finish · **front = the hide tree + the water in front of the water line** (an avatar falling in is drawn BEFORE
`front`, so the water covers it from y 955 down) · fg = flower beds (opt-in) · light = night glows (lamps, pads), sunset warm.

| anchor (k 1) | value | notes |
|---|---|---|
| `FLOOR.plaza` / `sAt(y)` | 940 / .4·(y − 420)/520 | |
| `SPOTS.plaza.pads[4]` | x −150 / 150 / 450 / 750, y 858, s .337 | the family pops in here (SC04) |
| `.wall` | {x0 2600, x1 2910, top 700, y 940} | the plain wall |
| `.wall.dad` | {x 2538, y 940, s .4, view 'side', flip true} | the hot dog walking into the wall (SC01/SC04) |
| `.start` | {x 2755, x0 2600, x1 2910, y 684, edge 2910} | standing ON the start block |
| `.platforms[3]` | x 3210 / 3590 / 3955 (x0…x1 3120…3300 / 3510…3670 / 3880…4030), y 684, s .4 | |
| `.gap` | {x0 2910, x1 3120, mid 3015, y 684} | THE first gap Dad can't jump |
| `.water` | {x0 2910, x1 4190, y 955, splash {3015, 955}} | water line: sink below it (draw before `front`) |
| `.finish` | {x0 4190, x1 4790, y 684, checkpoint {4490, 684}} | STAGE 2 |
| `.crate` | {x 2330, y 854 (feet on top), base 990, s .438} | Dad's speech (SC07) |
| `.bleachers[3]` | y 745 / 655 / 565, x 1750…2150 (narrower up), s .308 / .285 / .262 | noobs gathering |
| `.tree` | {x −620, y 975, hide {−620, 962, s .417}, peekL/peekR (±110)} | draw the hider BEFORE `front`; "I'm a tree" (SC04) |
| `.fountain` | {x 1380, y 790, rimY 690, s .285} | |
| `.signpost` {1030, 905} · `.sign` {600, 270, k .5} · `.billboard` {1860, 250, 520×290, k .6} · `.portals[3]` (k .8) | | |
| `.lines` | y 700 (.215) · 780 (.277) · 860 (.338) · 940 (.4) · 1030 (.469); x −2600…2560, gaps fountain/bleachers | crowd stand lines |

| cams | value | shows |
|---|---|---|
| `spawn` | {x −40, y 0, zoom 1} | pads + CUBE CITY sign (SC04 family pops in) |
| `wide` | {x 900, y −140, zoom .62} | the whole lobby, fountain → pool |
| `fountain` · `crate` · `wall` · `gap` · `obby` · `tree` · `finish` | camAt(…) | see the sheet |
| `sign` / `billboard` | {x −360, y −300, 1} / {x 1500, y −483, 1} | the letter sign / the board (k .5 / .6 objects) |

Tips: SC01 "Dad walks into the wall for 3 hours" = `cams.wall` at night with `wall.dad` in a walk cycle (feet stuck);
SC07 falling in = lerp from `start` over `gap.mid` down to `water.y + ~200` while drawing before `front`, splash at
`water.splash`; the crowd around the crate = `placeCrowd(lines[2..4], …)` + `bleachers`; the hero watching alone = far left
on `lines[1]` or on the top bleacher. SC12 double-jump lesson: `start` + `platforms`.

## 2. `arena(t, cam, o)` — the Battle Arena (SC01, SC02 montage, SC05, SC09, SC12)

The raised **RING** (sand top with a painted red ring + crossed swords, a stone border, a brick front face at the bottom of
the frame), back edge y 700 (x 180…1740), front edge y 1010 (x −80…2000); four corner pillars with torches (front ones in
`front`). Behind it: the barrier wall (k .9: dark arches, FIGHT! / NO NOOBS / GG ONLY / BATTLE ARENA panels, torches), the
central **gate tower with the SCOREBOARD** (k .8), the curved stands with a cheap crowd (4 tiers, k .7) under a rim of
pennants and hanging banners (crown / swords / star), sky (k 0).

**Options:** `time` · `crowd 0..1` (fill density; default 1, raid default 0) · `cheer 0..1` (arms up, bobbing, open mouths)
· `signs: ['GO MOM!', …]` (some cheering fans hold signs) · `board: [lines] | 'text'` (scoreboard; default
`['BATTLE ARENA', 'KING OF THE RING']`, e.g. `['YOU', '2000 WINS']`, `['MOM_OFFICIAL', '#1']`) · **`raid 0..1`** (the Block
King smashed it: a broken gap in the stands x 1180…1720 with jagged edges, torn banners, the scoreboard cracked + tilted +
flickering, cracks + rubble on the ring, fires + smoke, red pulse — use with `time: 'night'`) · `near` (dark crowd heads
from behind in the bottom corners, k 1.25) · `flash`.

**Layers:** bg = sky, stands (k .7), gate/board (k .8), barrier (k .9) · mid = ring + back pillars (+ raid rubble/fires) ·
front = the two front corner pillars · fg = near crowd (opt-in) · light = torch glows, raid glow/pulse.

| anchor | value | notes |
|---|---|---|
| `FLOOR.arena` / `sAt(y)` | 900 / .42·(y − 380)/520 | |
| `SPOTS.arena.duel[2]` | (640, 900) / (1280, 900) s .42 | 1-on-1 (SC05) |
| `.center` | (960, 880) s .404 | |
| `.ring` | {bx0 180, bx1 1740, back 700, fx0 −80, fx1 2000, front 1010, at(y) → {x0, x1}} | ring edge at any depth |
| `.edge` | L (12, 900) · R (1908, 900) | the ring edge on the stand line (knock-outs fly over it) |
| `.exit` | {x 1560, y 70, k .7} | the sky point above the stands where a KO'd player twinkles away (`toScreen`) |
| `.board` | {x 960, y 250, w 560, h 210, k .8} | the scoreboard screen (overlay gameui content here) |
| `.stands[4]` | shoulder lines y 486 / 396 / 306 / 216 (+ curve: `yAt(x)`), s .2 → .158, k .7 | a front-row fan |
| `.lines` | y 760 / 830 / 900 / 980 inside the ring | fighters / training class (SC12) |

cams: `ring` {0, 0, 1} · `wide` {0, −60, .8} · `duel` camAt(960, 640, 1.25) · `board` {0, −244, 1.6} · `stands`
{−500, −420, 1.7} (crowd close-up) · `edgeL` camAt(200, 640, 1.3) · `sky` {300, −500, 1} (the KO flight).

## 3. `tycoon(t, cam, o)` — Tycoon Valley (SC01, SC02, SC06, SC09, SC12)

Floating grass plots in the sky (top y 700 … front edge 990, a dirt-brick face and a stepped underside), joined by rope
plank bridges. Left → right: a mushroom-house plot (x −2700…−1650), **YOUR CASTLE** plot (x −1350…560), **GRANNY'S PLOT**
(x 820…2220), a pizza-shop plot (x 2480…3500). Behind: other players' bases on floating plots (k .55 / .3: dome, rocket,
farm, pirate ship, mushroom, NOOB box, pizza), cube clouds, sky.

**The castle** (centre x −330, base y 760): grey-lilac brick keep with battlements, two towers with stepped red roofs and
YOU flags, curtain walls, the **TROPHY ROOM** window (cups glinting inside) on the keep, a LVL 99 banner, the arched
wooden gate; the **LAVA POOL** in front-left (glowing, bubbling, "NO SWIMMING" sign).

**Granny's plot** — `granny: 0..4`: 0 empty plot (EMPTY PLOT / CLAIM ME! sign + claim pad) · 1 **cookie stand** (pink
striped awning, big cookie sign, cookie jar, "2 COINS", "3 FOR CUTE ONES"; Granny stands BEHIND the counter) · 2 **bakery**
(GRANNY'S BAKERY, pink stepped roof, display window, chimney) · 3 **factory** (pink brick, sawtooth roof, two chimneys with
cookie steam, GRANNY'S GOODIES sign, an outdoor conveyor belt with cookies riding it) · 4 **glass skyscraper GRANNY'S GOODIES
INC.** (three setbacks up to y −2450 through the clouds, vertical GRANNY banner, the **neon cookie** on top at y −2630).
Fractional values animate the change: the old building shrinks away top-first (first 35 %), the new one pops in brick by
brick bottom → top with squash + flying debris cubes (u .2 → 1). E.g. `granny: lerp(1, 4, ease(k))` over the time-lapse.

**Options:** `time` · `granny 0..4` · `billboard 0..1` (the giant billboard with Granny's face rises from below; default 1 at
granny ≥ 4) — text GRANNY'S GOODIES · BAKED WITH LOVE (AND PROFIT), portrait = a flat GrannyGoodies (curls, glasses + gold
monocle, pearls, fur collar) or `billboardFace` (svg centred on the portrait box) · `neon 0..1` (cookie sign lit; flicker it)
· `sold 0..1` (the SOLD sign slaps onto the castle gate and swings) + `castleSign` (its text: `'SOLD'`, `'COOKIE MUSEUM'`…) ·
**`smashed 0..1`** (the Block King: Granny's building cut off with a jagged top, rubble, smoke, fires at night, broken
cookies on the grass; castle towers knocked off; smoke on the back plots) · `belt` (outdoor belt speed) · `flash`.

**Layers:** bg = sky, clouds, back plots · mid = plots, bridges, castle, lava pool, Granny's building, billboard · **front =
the cookie-stand counter, the factory's outdoor belt, the SOLD sign** · fg '' · light.

| anchor | value | notes |
|---|---|---|
| `FLOOR.tycoon` / `sAt(y)` | 930 / .4·(y − 420)/510 | |
| `SPOTS.tycoon.castle` | {x −330, base 760} | |
| `.castle.roof` | (−330, 310) s .267 | the hero on the keep's roof (SC02) — use `cams.roof` |
| `.castle.front` | (−330, 930) s .4 · `.gate` (−330, 760) · `.sold` (−330, 564) = sign hook | Granny at the gate (SC06) |
| `.castle.trophyWindow` | x −330, y 275…485 | |
| `.castle.lava` | {x0 −1120, x1 −700, y0 800, y1 880, x −910, y 840} | |
| `.granny.stand` | (1520, 870) s .353, counterTop 742 | behind the cookie stand: draw BEFORE `front` |
| `.granny.front` | (1520, 930) s .4 | |
| `.granny.belt` | {x0 1160, x1 1900, y 854, workers[4] (1260 / 1460 / 1660 / 1840, 836, s .326)} | stage 3: friends behind the belt |
| `.granny.skyscraper` | {x 1520, top −2630, cookie (1520, −2630)} | |
| `.granny.billboard` | {x 2130, y 150, 900×470, portrait {1900, 150, 380×410}} | |
| `.plots[4]` · `.lines` (860 / 930 / 975, gaps between plots) | | friends carrying cookies (SC01) on `lines[1]` |

cams: `castle` camAt(−330, 520, .85) · `roof` (…, 1.7) · `gate` · `lava` · `trophyWindow` (2.2) · `stand` camAt(1520, 690,
1.2) · `granny` camAt(1400, 560, .8) (all stages fit) · `factory` · `skyscraper` camAt(1650, −1000, .28) (the whole tower +
billboard) · `top` camAt(1520, −2500, .9) (neon cookie) · `billboard` · `valley` {400, −200, .45}. Tilt up the tower:
`K.camKeys` from `cams.granny` to `cams.top`.

## 3b. `castleInterior(t, o)` — the tour (SC02)

A long hall for a left → right pan: **LAVA POOL** (x −640…420, sunk into the floor, a blue diving board, LAVA POOL / NO
RUNNING sign) · the **TROPHY WALL** (x 520…1640: shelves of ~150 cups glinting, TROPHY ROOM plate, the giant #1 cup on a
pedestal, "400 CUPS" counter) · the **THRONE** (x 2200) on a three-step dais under red curtains — a very expensive chair: a
gold gaming chair with a crown, red cushions, sparkles and a **99,999 price tag**. Stone walls, arched windows (bg = sky),
YOU banners, torches, a long red carpet. Options: `time`, `priceTag` (default true), `lava` (glow 0..1), `count` ('400'),
`flash`. Layers: front = the lava pool's front lip (an avatar in the pool is drawn before it).

| anchor | value |
|---|---|
| `FLOOR.castleInterior` | 980 (s .5) · `SPOTS.castleInterior.spots` lava (560) / trophies (1300) / throne (1800), y 980 |
| `.throne` | {x 2200, seat 640, s .5, y 793, sit {legL 90, legR 90, kneeL 90, kneeR 90}} — `actor('you', t, {x, y, s, ...sit})` sits him on the cushion |
| `.lava` {x0 −640, x1 420, y0 820, y1 1000} · `.trophies` {x0 520, x1 1640, y0 90, y1 700, cup (1080, 420)} | |

cams: `wide` {400, −100, .62} · `lava` · `trophies` · `throne` camAt(2200, 560, 1.15) · `tag` (the price tag, 2×).

## 3c. `factoryInterior(t, o)` — Granny's Goodies Inc. (SC06, SC09)

Pink-tiled walls, pipes, hanging lamps, round windows (bg), two brick **OVENS** with glowing mouths (left), the main
**CONVEYOR BELT** across the room (top y 740) = `front`: workers stand BEHIND it (legs hidden), cookies ride to the right;
an upper belt climbing to the cookie hopper (right), boxes, the GRANNY'S GOODIES INC. banner, a DAYS WITHOUT A COOKIE
INCIDENT: 0 board, a PRICES board (COOKIE 5 · WEEKENDS 10 · IF RUDE 15 · NO REFUNDS) and the **EMPLOYEE OF THE MONTH**
frame (photo slot `SPOTS.factoryInterior.employee` {x 1560, y 250, 230×250}; pass `employee: svg | fn(w, h)` centred on it —
e.g. Noodle's head — default a gold star; nameplate `employeeName` default 'NoodleBoi').
Options: `time`, `belt` (speed, 0 = stopped), `employee`, `employeeName`, `days`, `smashed 0..1` (rubble, broken cookies,
red tint), `flash`.

| anchor | value |
|---|---|
| `FLOOR.factoryInterior` | 1000 (s .5, in front of the belt) · `.pose` (1300, 1000) — Noodle posing by the frame |
| `.workers[6]` | x 200 / 560 / 1000 / 1360 / 1760 / 2160, y 900, s .45 — draw before `front` (hair nets are cast props) |
| `.belt` {x0 −1500, x1 3400, top 740} · `.ovens` (−560 / 10, 560) · `.hopper` (3050, 430) | |

cams: `wide` {0, −100, .62} · `belt` · `employee` (1.6) · `ovens` · `noodle` (the pose + frame).

## 4. `tower(t, cam, o)` — the OBBY TOWER, 100 floors over lava (SC10, SC11)

A long **vertical** world. Lava sea at y 1000 (animated, bubbles, glow, embers in fg). LEFT: the basalt **BATTLEFIELD**
plateau (x −2800…700, top 780…1010, tiled stone with a glowing purple rune circle, broken pillars, torches, banners) — the
raid fight (SC10). The purple brick **SPIRE** (x 1400…1600, glowing seams, a pink neon ring + big number every 10 floors)
rises out of the lava; **floors 1…99** are floating studded platforms zig-zagging around it, 210 px apart: floor i stands at
`y = 745 − 210·(i − 1)`; every 10th is a wide green **checkpoint** with a flag; floors 7 / 23 / 46 / 71 / 88 are **icy**
(slippery: "he slipped… and didn't fall"); every platform shows its glowing number. Floor 99 juts far LEFT → the **FINAL
GAP** (660 px) → the gold **TOP** platform (floor 100, y −19902) with the crystal **pedestal** and two 100 flags.
Background: night sky with stars, the big moon (k .02 — it stays in view the whole climb), far city lights (k .12, only near
the bottom), floating decor platforms (k .25) and cube clouds (k .45) generated at every height so the climb parallaxes.
Zoom-outs below .25 switch to a cheap silhouette LOD (`cams.full` shows all 100 floors).

**Options:** `time` ('night' default; 'day' / 'sunset' work) · `lava 0..1` (glow + bubbles + embers) · **`burst 0..1`** (the
crystal breaks: rays from `SPOTS.tower.crystal`, an expanding cyan ring, a white flash at the start) · **`dawn 0..1`**
(victory: sky + world turn gold, moon fades, the sun rises at the left) · `crystal` (draw a simple placeholder crystal —
normally scenes draw gameui's) · `flash`.

**Layers:** bg = sky, moon/sun, city, decor, clouds · mid = plateau, spire, platforms, top, lava · front '' · fg = embers ·
light = lava glow, burst, dawn wash.

| anchor | value | notes |
|---|---|---|
| `FLOOR.tower` / `sAt(y)` | 960 / .36·(y − 420)/540 | battlefield |
| `SPOTS.tower.base` | (560, 960) s .36 | Dad at the foot of the tower in the moonlight (SC10) |
| `.floors[99]` | {i, x, x0, x1, y (feet), s .3, cp, ice}; floor 1 (1139, 745), 2 (1351, 535), 3 (1658, 325) … 97 (1170, −19415), 98 (740, −19625), 99 (270, −19835) | `floors[i − 1]` |
| `.top` | {i 100, x 1500, x0 1050, x1 1950, y −19902, s .3} | |
| `.crystal` | (1500, −20005) | the crystal's base on the pedestal (gameui draws it) |
| `.finalGap` | {x0 390, x1 1050, mid 720, y −19835, edge (1050, −19910)} | `edge` = where Dad's hands grab the top's lip |
| `.boss` | (−1750, 830) | the Block King's feet on the back of the battlefield; ~3× the hero at that depth |
| `.lines` | y 850 / 910 / 960 / 1000, x −2700…650 | the raid crowd / the family formation |
| `.lavaY` 1000 · `.spire` {x0 1400, x1 1600} · `.plateau` | | |

cams: `base` camAt(700, 600, 1) · `battle` camAt(−900, 470, .6) · `climb` {600, −1100, .35} · `full` {600, −10000, .048}
(LOD; the crystal shows as a big cyan glow + gem at the summit — SC10 "the crystal on top of the tower!") · `finalGap` (floor 99 left, the top at right) · `top` (the summit) · `moon` (floor 99 against the moon) ·
**`GS.towerCam(i, zoom = 1, sx = 960, sy = 620)`** = a cam on floor i (also `SPOTS.tower.camFor`) — `K.camKeys` through
`towerCam(i)` for the climb montage; whip with white flashes between far-apart floors.

## 5. `cityNight(t, cam, o)` / `cityDay(t, cam, o)` — Cube City wide (SC01 open, SC02 "a legend", SC09, SC11 victory)

A panorama from a rooftop. Back → front: sky (k 0) · moon / sun (k .02) · clouds (k .06) · floating islands with bases
(k .12, day/victory) · the far skyline (k .18) · searchlights (k .3, night) · **LANDMARKS** (k .3): the colosseum (x 330),
**GRANNY'S GOODIES INC.** with the cookie (x 1560), the **OBBY TOWER** spire with the crystal glow (x 1840) · the **MID ROW**
of blocky buildings with studded roofs and signs OBBY / PIZZA / PETS / SHOP / GAMES (k .5, base 880) around a big **EMPTY
PLAZA** in the middle (x 640…1280; lilac tiles, the CUBE CITY letter blocks — knocked over at night — and a fountain) =
**where the giant BLOCK KING stands** · the front row (k .75, framing buildings off the frame edges) · the **rooftop ledge**
(k 1: tiles, parapet blocks, an AC unit, an antenna; stand line 990, s .45).

`cityNight` = the attack (purple-red sky, fires on roofs, smoke, red pulse, searchlights). `cityDay` = the same city by
day (blue sky, sun, floating islands, intact letters) — the "this is you, a legend" wide; `time: 'sunset'` also works.

**Options:** `boss 0..1` (smash damage: buildings near the plaza get jagged broken tops + rubble, more fires, smoke on the
landmarks) · **`victory 0..1`** (sky to the gold dawn, fires out, the sun rises, friendly cube confetti) · `ledge: false`
(no rooftop: the pure wide) · `letters` (CUBE CITY letters intact; day default true) · `searchlights` · `flash`.

**Layers / draw order:** `L.bg` (sky … mid row + fires) → **the boss** `K.view(cam, boss, .5)` → `L.mid` (front row + the
ledge) → characters on the ledge (k 1) → `L.light`. (front / fg are empty.) Extra keys: `L.sky` (everything behind the
mid row) and `L.row` (the mid row + plaza; `L.bg = L.sky + L.row`) — for the boss RISING from behind the city (SC09) draw
`L.sky + boss + L.row + L.mid + …` with the boss's feet below the plaza line, then lift him.

| anchor | value | notes |
|---|---|---|
| `SPOTS.cityNight.boss` | {x 960, y 900, k .5} | the Block King's feet on the plaza; at cam zoom 1 the sky above holds ~900 px — a boss ~900–1100 px tall fills it (use `cams.high` / `bossUp` for the full figure) |
| `.plaza` | {x0 640, x1 1280, y 880, k .5} | |
| `.landmarks` | arena (330, 560) · skyscraper cookie (1560, −35) · tower crystal (1840, −25), k .3 | point at them / FX on them |
| `.roofs[10]` | mid-row roof tops (k .5, s .13) | tiny players / the clan on the roofs |
| `.lines` | y 950 (.418) / 990 (.45), k 1 | on the ledge |
| `FLOOR.cityNight` / `sAt(y)` | 990 / .45·(y − 420)/570 | |

cams: `wide` {0, 0, 1} · `high` {0, −220, .8} (more sky, the whole boss) · `bossUp` {0, −700, 1} (the boss's head) · `ledge`
camAt(960, 700, 1.3) · `low` {0, 120, 1.15}.

## 6. `avatarShop(t, o)` — behind the avatar-editor UI (SC03)

A pastel boutique: AVATAR SHOP neon sign, hat shelves (top hat, cap, crown, propeller cap, cowboy, wizard, beanie,
traffic cone, chef hat — with price tags), a mirror, the costume rack (shirts, tutu, wings) and the **HOT DOG costume** on a
mannequin with a NEW! tag (far right), the glowing podium under a spotlight in the centre (the wall behind it is calm for
the UI panels). Options: `time`, `spot 0..1` (spotlight), `flash`. Room set.
SPOTS.avatarShop: `podium` (960, 900) s .5 · `hotdog` (2140, 760) · `mirror` (775, 490) · `hats` box. cams: `wide`,
`podium`, `hats`, `rack`, `hotdog`.

---

## Props + helpers (exported)

Toy primitives (all take a `tn = GS.tone({...})` colour transformer): `brick(x, y, w, h, d, col, tn, {studs, lw, rx})`
(front face + lighter top face with studs) · `brickBatch(tn)` (many bricks → a few paths) · `studsD` · `cubeCloud(x, y, s, tn,
col, seed)` · `cubeTree(x, y, s, tn, {kind 'round'|'tall'|'blossom', col, trunkW})` · `hedgeRow` · `cubeLamp(x, y, s, tn,
on)` · `signBoard(x, y, w, h, lines, tn, {col, post, size})` · `signText(txt, x, y, size, fill, tn)` · `grassPlot(x0, x1,
yBack, yFront, faceH, tn, seed)` (a floating plot) · `islandBottom` · `fire(x, y, s, t, seed)` · `smoke(x, y, s, t, k, seed,
col)` · `rubble(x, y, w, tn, seed, cols)` · `crowd(rows, opts)` · `spawnPad(x, y, s, tn, t, flash, night)` · `letterSign(txt,
x, y, size, tn, t)` · `portalArch` · `gameIcon(kind 'swords'|'coin'|'tower'|'cookie'|'crown'|'star', x, y, s, tn)` ·
`fountain` · `crate` · **`cubeWeed(x, y, s, rot)`** (the cube tumbleweed for SC04's silence beat) · `obbyFlag` ·
`checkpointPad` · `moon` · `sun` · `torch` · `banner` · `castle` · `soldSign(x, y, k, t, tn, text)` · `grannyBillboard` ·
`grannyPortrait` · `miniBase(kind, x, y, s, tn, t)` · `throneChair` · `cityBuilding` · `hatIcon` · `skyline` · `popBits`.

Helpers: `toScreen(cam, a)` · `camTf(cam, k)` · `vis(cam, k)` (visible rect of a layer) · `camAt` · `towerCam` ·
`placeCrowd(line, n, seed)` · `tone(o)` / `timeTone(o)` · `mix(a, b, k)` · `glow(x, y, r, id, op)` (small radial glows
`gsGlow{Warm,Cyan,Pink,Purple,Fire,White,Gold}`) · `C` (the candy palette) · `CANDY`.

## Scales at a glance

| set | hero s on FLOOR | other |
|---|---|---|
| plaza | .4 (940) | pads .337 · crate .438 · bleachers .308 / .285 / .262 · tree hide .417 · back line (700) .215 |
| arena | .42 (900) | ring back (760) .307 · front (980) .485 · stands crowd .2 → .158 (k .7) |
| tycoon | .4 (930) | castle roof .267 · cookie stand .353 · belt workers .326 · back line (860) .345 |
| castleInterior | .5 (980) | throne .5 (sit) |
| factoryInterior | .5 (1000) | workers behind the belt .45 (900) |
| tower | .36 (960, battlefield) | floors / top .3 · boss ≈ 3× the hero |
| cityNight / cityDay | .45 (990, ledge) | roofs (k .5) .13 · boss ~900–1100 px tall (k .5) |
| avatarShop | .5 (900, podium) | |

## Performance

No filters, masks or blend modes; textures are `<pattern>`s in DEFS; long sets cull to the visible range (the tower also
switches to a silhouette LOD below zoom .25); glows are small radial gradients; the crowds are colour-bucketed paths; one
`clipPath` only for a smashed building. Measured with `node tools/sheet_game.js` (set alone, all layers, build + render at
1920×1080, median of 5; the machine was shared, ±10 ms):

| set / framing | elements | build + render |
|---|---|---|
| plaza (spawn / wide / wall / obby / crowd / night / tree) | 530–620 | 36–58 ms |
| arena day cheer + signs / night cheer / raid | 380–510 | 32–74 ms |
| arena worst: night + raid .6 + full crowd cheering + near crowd | ~760 | ~79 ms |
| tycoon castle / stand / skyscraper / smashed night / museum | 520–700 | 29–49 ms |
| castleInterior / factoryInterior | 220–260 | 28–32 ms |
| tower base / battle / climb / final gap / top + burst | 200–310 | 22–40 ms |
| cityNight (boss 0 / 1 / victory) / cityDay | 340–520 | 30–69 ms |
| avatarShop | ~110 | ~20 ms |

The four-in-one tiles on the sheet are 4 sets in one frame (not one set). Characters (~20 ms each at s .5) come on top.
