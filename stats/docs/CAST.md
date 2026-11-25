# CAST — "What If You Could See Everyone's STATS in Real Life?"

Every character key, its look, size and pose options, Biscuit the corgi, the crowds, every prop, the hand / head anchors and perf.
Code: `rig/cast.js` (designs, draw functions, options, anchors), `rig/looks7.js` (hair, outfits, the bendable arm, legs/shoes,
face accessories, overlays, lite crowd humans — on top of looks3..6), `rig/extras.js` (props + Biscuit).
Contact sheets (`node tools/concept.js [lineup|expr|turn|props|crowd|all]`):

| Sheet | What |
|---|---|
| `concept/cast_lineup.png` | everyone at the same scale (s 0.7) with a sample stat plate hung at each `headTop()` anchor |
| `concept/cast_expressions.png` | 8 faces + side + back per character, the story kids, Biscuit's faces and poses |
| `concept/cast_turnaround.png` | front · turn ±0.6 · side · side flipped · back for every rig character (+ pajamas, day off, hood down, sash) |
| `concept/cast_props.png` | every prop in `rig/extras.js` + **every character option** |
| `concept/cast_crowd.png` | `kid(i)` / `adult(i)` 0..23 and a 96-figure fair crowd with the family |

## 1. Rig characters

Draw with `actor(key, t, pose, act)` from `scenes/kit.js` (auto lip-sync / blinks / gestures for `you mom grandpa max benji tank teacher kid`)
or directly with `require('../rig/cast').draw[key](pose)`. All the usual pose fields work (`x, y, s, view, flip, turn, armL/armR,
legL/legR, kneeL/kneeR, lean, bodyY, headRot, headY, rot, lift, sx, sy, face, props, volume, shadow`) — see ENGINE.md —
**plus `bendL / bendR`** (elbows, §2). Pass `t` (scene time) for animated bits (steam, zzz, balloon sway, laces, flag, toaster smoke).

Height = feet to the top of the head (hair / hood / hat) at **s 1**, size included (the hero is 951 tall, his head ≈ 280 wide).
The same numbers are `HEAD_TOP` in cast.js (§3).

| key | look | height @ s 1 | size | options |
|---|---|---|---|---|
| `you` | **THE HERO — unchanged construction** (byte-identical output without options): orange bowl cut, white face, huge eyes, red open jacket, yellow tee, dark green pants | 951 (hood 1064, headset 1120) | 1 | `headset: true\|0..1` (night gaming; RGB gaming headset, a number animates putting it on), `pajamas: true` (waking up: navy pyjamas with yellow stars + tiny game controllers, blue slippers — same head), `backpack: true\|'#hex'` (straps in front, the pack behind / on the back in side + back views), `apron: true` (cream "CHEF" apron — making breakfast), `hood: true` (red hood over the bob), `tablet: true` (both hands; `tabletFace`, `screen`, `glow`). His elbows bend with `bendL/bendR` too (only then is a bent arm drawn). |
| `mom` | busy bakery owner: short chestnut pixie under a **red polka-dot bandana** knotted on top, half-lidded tired eyes with **dark circles**, a **flour smudge** on her cheek, a smile; teal T-shirt + cream **bakery apron** (cupcake patch, coral stitching, a whisk in the pocket), jeans, coral sneakers | 1059 | 1.04 | `coffee: true\|'sip'` (mug at her chest / raised to her cheek; steams with `t`), `flour: 0..1` (default 0.5: cheek smudge + dust on the apron and hair; 0 = clean), `phone: true\|'ear'` (looking at it / on a call), `tired: 0..1` (droopier lids, worried brows, darker circles, slumped shoulders), `asleep: true` (dozing standing up: eyes shut, head drooping, floating Z's with `t`; combine with `coffee`), `dayoff: true` (the fair: coral-striped boat-neck tee, rolled light jeans, white sneakers, **straw sunhat** with a flower — no bandana, no flour; height 1073), `pan: true` (frying pan with an egg — the juggling beat) |
| `grandpa` | **Grandpa Lou**: tall, bald shiny dome with forehead wrinkles, big ears, fluffy white side tufts, droopy white brows, a **HUGE white walrus moustache** (wider than his head), dot eyes, moss-green cardigan with a big felt **"79" patch** (also big on the back), light-blue shirt, brown cords, loafers | 982 | 1.1 | `glasses: 'up'` (default — reading glasses on his forehead: the "find Grandpa's glasses" quest) `\| 'on' \| 'off'`, `sash: true` (his red **CHAMP '79** sash with a gold medal), `cane: true` (wooden cane in his left hand, sized to the floor), `armwrestle: true\|'flex'` (double-biceps flex: elbows up, biceps bulge, face `determined` unless given) `\| 'one'` (one arm), `flex` = same |
| `max` | little brother, 5: **SMALL** (≈ 0.6–0.67 of the hero; size 0.56 with a 1.16 head), the hero's big round eyes, freckles, blush; a green **dinosaur onesie** (cream belly, orange back spikes, a tail, claw mittens, dino feet with claws) whose **hood** has teeth, googly eyes and spikes | 664 (hood down 621) | 0.56 | `hood: 'up'` (default) `\| 'down'` (ginger curls like his brother; the hood lies behind his neck / hangs down his back), `balloon: true` (the **dinosaur balloon** on a string in his right hand; sways with `t`), `roar: true` (RAWR: claws up beside his head, mouth wide — face `{angry, mouth:'scream'}` unless given), `tablet: true` (holds the hero's tablet up, screen to us: final gag; `screen`, `glow`, `tabletFace`) |
| `biscuit` | the chubby corgi (non-rig, see §4) | sit 422 · walk 356 · beg 515 · sleep 240 | — | `pose 'sit'\|'walk'\|'beg'\|'sleep'`, `look`, `tongue`, `wag`, `face` (`'good'` = the final gag's VERY good boy), `flip`, `ears`, `coat` |
| `benji` | best friend: skinny (thin arms + legs) in an **oversized purple rocket hoodie** (baggy sleeves, hem over his hips, hood round the neck), teal + mustard **bobble hat**, **HUGE round glasses**, **braces** (on every mouth that shows teeth — talking shows them), brown high-water cords, red-striped socks, sneakers with **untied laces** (they flop with `t`) | 1081 | 0.98 | `books: true` (an armful hugged to his chest) `\| 'drop'` + `bookFall 0..1` (books fly), `fallen: true\|'sit'` (sat down hard, legs splayed, dizzy "I'm okay!") `\| 'flat'` (flat on his back on the floor, legs up), `potato: true` (holds the potato battery; `glow`), `map: true` (the fair map held open — SC 10), `laces: false` (tied, for once) |
| `tank` | the bully: **huge** (size 1.35), smallish head on a wide body, square stippled **buzz cut**, heavy block brows, a band-aid on his cheek, charcoal tee under a **patched, frayed denim vest** (bolt / X / heart patches, a skull on the back), olive cargo pants, brown work boots, **big brick fists** | 1237 | 1.35 | `lunch: true` (a stolen lunch bag dangling from his fist; `lunchName: 'YOU'` writes on it), `sandwich: true` (at his chest; `bite 0..1`), `ketchupLunch: true` (his dad's ketchup-soaked sandwich — SC 11), `shy: true` (softer: brows up, blush, eyes down, hands fidgeting, head tilt), `carry: true\|{ face, armL, armR, … }` (the hero on his shoulders, his hands up on the hero's shins — SC 10; see `carryAt()`) |
| `teacher` | **Mrs. Krump**: tall, a tall grey **beehive** (rings + a little plum bow), plum **cat-eye glasses**, a **red pen behind her ear**, red lips, stern brows, a long plum cardigan to the knees over a cream ruffled blouse with a cameo, grey skirt, dark stockings, low heels | 1340 | 1.12 | `pointer: true` (pointer stick in her right hand; `pointerRot` to aim it), `papers: true` (a stack of marked papers on her left arm), `glare: true\|0..1` (white glint across the glasses + a stern face), `redPen: true` (pen in hand) |
| `lunchLady` | "secret skill: mystery meat": big auburn curls in a hairnet, mint uniform, stained apron with a "DOT" name tag, a smirk | 1113 | 1.06 | `ladle: false` (default true: a soup ladle in her right hand) |
| `coach` | gym coach (dodgeball): red cap, navy tracksuit with white stripes, whistle on a lanyard, stubble | 1129 | 1.08 | — |
| `neighbor` | **Mrs. Wells** (the grocery quest, "Nice hat, Mrs. Wells!"): white curls under a **lilac cloche with a big pink flower**, dusty-rose coat with big buttons, pearls, stockings, low shoes | 1005 | 0.92 | `bags: 2` (default: a grocery bag in each hand) `\| 1 \| false`, `spill: 0..1` (apples roll out) |
| `fairWorker` | red-and-white striped shirt, red cap | 1071 | 1.04 | — |
| `kid(i)` / `adult(i)` | flat lite crowd humans (§5) | kid ≈ 770–880 · adult ≈ 900–1200 | 0.76–0.88 / 1.0–1.14 | `i` (fixed look per i) |

`D` holds the designs: `D.you, D.youPJ, D.mom, D.momDayoff, D.grandpa, D.max, D.maxHoodDown, D.benji, D.tank, D.teacher, D.lunchLady,
D.coach, D.neighbor, D.fairWorker` (+ `kidDesign(i)`, `adultDesign(i)`). `NAMES[key]` = display names.

**Voices** (kit.js SPEAKER): `you`→YOU, `mom`→MOM, `grandpa`→GRANDPA, `max`→MAX, `benji`→BENJI, `tank`→TANK, `teacher`→TEACHER,
`kid`→KID (use `actor('kid', t, { i: 0, … })` — kid 0 is the "my dog ate it" kid). The others are silent.

### Story beats → options (suggestions)

SC 02 Mom juggling: `mom { pan: true, phone: 'ear' }` · Grandpa's sash: `grandpa { sash: true, armwrestle: true }` · Max bites toast / RAWR:
`max { roar: true }` · Benji drops books: `benji { books: 'drop', bookFall }` then `{ fallen: true }` · Tank takes lunch: `tank { lunch: true }`.
SC 03 night gaming `you { headset: true }` + `X.gamingPC`; waking `you { pajamas: true }`; coffee ×4 `mom { coffee: 'sip', tired: 1 }`;
Max into the cereal `X.cerealBowl({ splash })`; Biscuit ERROR `biscuit { face: 'good' }`.
SC 05 `tank { sandwich: true }` / `{ shy: true }`. SC 06 glasses on the head `grandpa { glasses: 'up' }`; pillow fort `X.pillowFort({ k })`;
Mrs. Wells `neighbor { bags: 2 }`. SC 07 `mom { tired: 1 }`. SC 08–10 `mom { dayoff: true }`, `max { balloon: true }`, `benji { map: true }`,
`tank { carry: true }`. SC 11 `you { apron: true }` + `X.pancakes({ messy })`, `benji { potato: true, glow: 0.3 }`, `tank { ketchupLunch: true, shy: true }`.
SC 12 `max { tablet: true, hood: 'down' }`, `biscuit { pose: 'sit', face: 'good' }`.

## 2. Elbows and hands

* **`bendL / bendR`** (degrees) bend the elbow of every new character (and the hero — his arm is swapped for an identical bendable one
  only while a bend is set). Front / back view: **+ folds the forearm up/outward** (with the arm out at 90°, +100 = a bicep flex),
  **− folds it across the body** (arm 10–25° + bend −105…−130 = hand in front of the chest; both arms = crossed arms). Side view: + folds
  forward. Upper arm 134 (front) / 124 (side) of the 268 / 248 arm.
  Handy presets: hand at chest `armR 22, bendR -128` · crossed arms `armL 10, armR 10, bendL -105, bendR -105` · flex `arm 96, bend 104` ·
  claws up `arm 108, bend 66` · side view hold-in-front `armL 30, bendL 80`.
* `handAt(D.key, pose, side, grip = 236)` → grip point in **body space** (feet at 0, before size/scale), follows arm angle + bend, turn, view.
  `side +1` = screen-right arm (`armR`); in the side view use `-1` (the near arm is `armL`).
* `handPos(key, pose, side, grip)` → the same hand in **screen space** for the exact pose you draw (follows `x, y, s, size, flip, lift,
  bodyY, lean, rot`) — e.g. spawn steam, throw a ball, attach a HUD tooltip to a held item.
* `forearmAngle(pose, side)` → SVG rotation (deg) of the forearm (0 = pointing down) — rotate a held prop with the hand.
* `armPose(pose, side, [frontArm, frontBend], [sideArm, sideBend])` → pose defaults for holding something (explicit fields win).
* Props in your own pose: `props: [{ svg, layer }]` in body space; layers `'front'` (over everything), `'mid'` (after the torso, before
  the arms), `'back'` (behind the torso), `'top'`. Props are authored at the hero's scale: inside a body use s ≈ 0.5–0.7 (like cast.js does).
* Shoulders: ±`D[key].dims.shoulderX` at y −515: hero / mom / max / benji 100, grandpa 108, tank 128, teacher 96, lunch lady 118, coach 112,
  Mrs. Wells 104, fair worker 106.
* `carryAt(tankPose)` → `{ x, y, s }` = the feet position + scale for a rider sitting on Tank's shoulders (`draw.tank({ carry: true })`
  draws the hero there itself; use carryAt for Benji or a custom hero pose). Rider legs: `legL/legR 74, kneeL/kneeR 80`.

## 3. HUD anchors — where the stat plates go

`headTop(key, pose)` → `{ x, y }` = **screen point at the top of the head** for that draw's pose (`x, y, s, lift, bodyY, headY, sy`;
plus `hood` / `headset` for `you`, `dayoff` for `mom`, `hood: 'down'` for `max`, `pose` for `biscuit`, `i` for `kid`/`adult`). Hang the
plate a little above it (the lineup sheet shows a 26 px gap). `HEAD_TOP` = the raw table (body units at s 1, size included):

| key | head top | | key | head top |
|---|---|---|---|---|
| you | 951 (hood 1064, headset 1120) | | tank | 1237 |
| mom | 1059 (dayoff 1073) | | teacher | 1340 |
| grandpa | 982 | | lunchLady | 1113 |
| max | 664 (hood down 621) | | coach | 1129 |
| biscuit | sit 422 · walk 356 · beg 515 · sleep 240 | | neighbor | 1005 |
| benji | 1081 | | fairWorker | 1071 |
| kid(i) | ≈ 770–880 (per i: `headTop('kid', { i, … })`) | | adult(i) | ≈ 900–1200 (per i) |

Screen y = `y − HEAD_TOP × s` (plus lift/bob). It ignores `rot`: for tumbles fade the plate or pin it yourself.

## 4. Biscuit the corgi (non-rig)

`draw.biscuit(pose)` = `actor('biscuit', t, pose)` = `X.biscuit(pose)`. Chubby orange-and-white corgi, big ears, white blaze + chest
fluff, fluffy butt with a tiny tail. Feet at (x, y); use the **same s as the actors** next to him (sitting he reaches the hero's hip).

| field | meaning |
|---|---|
| `pose` | `'sit'` (front, default) · `'walk'` (side view facing screen-left, legs cycle + body bobs with `t`; `flip: true` faces right) · `'beg'` (up on his hind legs, paws up) · `'sleep'` (curled loaf, eyes shut, Z's rise with `t`, breathing) |
| `face` | `'happy'` (default: sparkly eyes, tongue) · **`'good'`** (closed happy eyes, blush, sparkles — GOOD BOY: ∞) · `'love'` (heart eyes) · `'neutral'` · `'shocked'` · `'sad'` · `'sleepy'`; rig face names map (`joy`→good, `scared`→shocked, …) |
| `look` | −1..1 or `[x, y]`: eye direction |
| `tongue` | true / false (default: out on happy faces) |
| `wag` | 0..1 (default 0.6): butt / tail wiggle, animate with `t` |
| `ears` | 0..1 (1 = up, 0 = flopped) |
| `coat`, `coat2` | recolour (another dog: "Cool dog, random man!" → `coat: '#4A3A2A'`) |
| `rot`, `shadow`, `flip` | as usual |

He costs ≈ 2–3 ms. `X.BISCUIT_TOP` = head tops per pose.

## 5. Crowds

`draw.kid(i, pose)` / `draw.adult(i, pose)` (or `actor('kid', t, { i, … })`): **flat lite humans** — no clips, no filters, ≈ 0.6–0.9 ms
each, every view, turn, arms, legs, face names, visemes (lip-sync) and fx. Random but fixed per `i`: skin tones, hair (crop, spiky, buzz,
bob, long, pony, pigtails, curly, afro, bun, bald), shirts with logos / numbers / stripes, open jackets, skirts, caps / beanies / sunhats /
headbands, glasses, beards (adults), sizes (kids 0.76–0.88, adults 1.0–1.14).
**Story kids:** `kid 0` = the "My dog ate it!" kid (spiky hair, green #9 tee — the KID voice), `kid 1` = the quiet kid with 85 STRENGTH
(grey hoodie, black hair), `kid 2` / `kid 3` = the INT 95 smart kids (glasses, blazer).
Wide fair shots: sort figures back to front, rows s 0.16 → 0.34; 100 figures ≈ 70 ms. `kidSpec(i)` / `adultSpec(i)` expose the specs.

## 6. Extras: props (`rig/extras.js`)

```js
const X = require('../rig/extras');              // or require('../rig/cast').extras
X.toaster(x, y, s, rot, { pop: 1, burn: 0.8 })   // positional ...
X.toaster({ x, y, s, pop: 1, burn: 0.8, t })     // ... or one object — every function accepts both
```

Pure functions → SVG strings; `rot` in degrees, `s` scale, **authored in the hero's body units** (pass the same `s` as the actors in
screen space). `DEFS` (`exScreen`, `exCoffee`) load automatically via scenes/main.js. Clip ids use `S.uid` (reset per frame).

| function | anchor · size @ s 1 | options |
|---|---|---|
| **Home** | | |
| `toaster({pop, burn, t})` | bottom centre on the counter · 320 × 230 | `pop 0..1` (0 down in the slots, 0.5 the jump, 1 settled half out), `burn 0..1` (toast golden → charcoal, red-hot slots, smoke with t) |
| `toast({burnt, t, smoke})` | centre · 140 × 180 | `burnt 0..1`; smokes above 0.6 |
| `cerealBowl({splash, t, col})` | bottom centre · 340 wide | `splash 0..1` (milk crown + flying cereal rings + drops: Max jumps in) |
| `pancakes({n, messy, syrup})` | bottom centre of the plate · 360 wide | `messy 0..1` (lopsided, one burnt, syrup flood, sliding butter) |
| `coffeeMug({steam, t, col, text, empty})` | centre of the mug · 150 × 130 | coral mug with a cupcake (or `text`) |
| `fryingPan({egg})` | the handle grip; the pan is to the left (−x) | |
| `alarmClock({ring, t, time})` | bottom centre · 220 × 280 | `ring 0..1` shakes + ring lines + hammer with t (the ENEMY) |
| `sock({smell, t})` | centre · 260 long | green stink lines |
| `pillowFort({k, t, w, h})` | **bottom centre on the floor**; s = the hero's scale there | `k 0..1`: 0 = 3 cushions on the floor, 0.45 = waist-high wall with a door + "MAX'S FORT · NO GROWNUPS" sign, 1 = four cushion rows + broom poles + checkered blanket roof + flag (t waves it). k-1 size 1500 × 1700 (750 × 850 px at s .5); `w`/`h` override |
| `gamingPC({screen, glow, t, off})` | bottom centre of the monitor stand · monitor 720 wide | screen 660 × 372; RGB tower + keyboard cycle with t; idle screen = a game with LV 50 / LV 90 tags |
| `tablet({face, screen, glow, landscape, col})` | centre · 360 × 500 | screen 300 × 420; `face: 'back'` (dino + star stickers) |
| `phone({face, screen, glow, col})` | centre · 208 × 392 | screen 176 × 340; coral case with a cupcake (Mom's) |
| **School** | | |
| `sandwich({bite, ketchup})` | centre · 240 × 190 | turkey wedge; `bite 0..1` bites the right end; `ketchup: true` drips (Tank's dad) |
| `lunchBag({name, open})` | the folded top = grip; hangs down 230 | brown paper; `name` written on it (default a heart) |
| `lunchTray({food, t})` | centre · 480 × 260 | `food`: array of up to 4 of `'pizza' 'broccoli' 'mystery' 'soup' 'milk' 'ketchup'` (mystery meat steams with t) |
| `ketchupBottle({squeeze})` | bottom centre · 120 × 320 | |
| `quizPaper({grade, title, name, lines})` | centre · 300 × 400 | "POP QUIZ"; `grade 'A+' \| 'F' \| …` red circle |
| `bookStack({n, fall, t})` | bottom centre · 260 wide | `fall 0..1` sends the books flying |
| `pointer({len, tip})` | the grip; points up (−y) at rot 0 · 560 | |
| `paperStack({grade})`, `redPen()` | centre | marked papers ('F') / the red pen |
| **Town · fairs** | | |
| `groceryBags({n, spill})` | the handles = grip; hangs ≈ 310 | baguette, leek, apple; `n 2`; `spill` rolls apples out |
| `ball({kind, r, spin})` | centre · r 60 | `'dodge'` (red) · `'soccer'` · `'beach'` |
| `paperBoat({t, col})` | bottom centre · 260 | bobs with t (Max's quest) |
| `potatoBattery({glow, t, sign})` | bottom centre · 540 wide | 3 potatoes, nails, wires, a bulb: `glow 0.3` = "it works! kind of" (flickers with t), sign "POTATO POWER!" |
| `fairMap({fold, mark, back})` | centre · 380 × 280 | Ferris wheel / candy / dino / cups + red dotted route + X; `fold 1` = folded |
| `dinoBalloon({string, t, col})` | the string's bottom end = grip; the balloon floats `string` (480) above | sways with t |
| `cottonCandy({col, col2})` | the cone bottom = grip · 340 tall | |
| `championSash({text, year})` | centre · 420 × 300 | "CHAMPION · 1979" sash + medal on its own |
| `woodCane({len})`, `ladle()` | the grip | |
| **Biscuit** | `biscuit(pose)` | §4 |

Helpers: `screenBox(x0, y0, w, h, r, screen, opts)`, `gameIdle(w, h)`, `DEVICE_SCREENS`, `A(args, …)` (the argument normaliser).

## 7. Performance (headless Chromium, 1920×1080 JPEG, 6 copies per frame, median)

| | ms per character |
|---|---|
| s 0.5 | you 12–13 · mom 12–13 · grandpa 17 · max 11 · benji 13 · tank 18 · teacher 16–20 · lunchLady 17–24 · coach 14 · neighbor 18 · fairWorker 9–16 · **biscuit 2–3** |
| close-up s 1.8 with volume | you 63 · mom 56 · grandpa 106 · max 14 · benji 62 · tank 94 · lunchLady 123 · coach 61 · neighbor 71 · fairWorker 58 |
| close-up s 1.8 `volume: false` | 3–15 for everyone → **pass `volume: false` for big close-ups** (the filter cost grows with the on-screen area) |
| crowds | **lite humans ≈ 0.6–0.9 ms each**: 60 at s 0.2 = 37 ms · 100 at s 0.16 = 71 ms · 40 at s 0.3 = 37 ms |

JS time is ≈ 1–4 ms per character. A family of four at s 0.5 ≈ 50 ms.

## 8. Gotchas

* **YOU is untouched**: `draw.you(pose)` without options (and without bends) is byte-identical to the original construction (checked on
  every deploy). His `pajamas` look is a separate design with the same head.
* Always draw through `draw.*` / `actor()`: per-draw options (flour, tired, hood down, laces, glare) go through `looks7.STATE` and are reset
  after each call — never call the design functions directly.
* **Option presets own their arms**: `coffee, phone, pan, cane, balloon, tablet, books, potato, map, fallen, shy, roar, armwrestle, carry,
  lunch, sandwich, pointer, papers, redPen, ladle, bags` set `armL/armR/bendL/bendR` and those WIN over the pose — so auto-acting
  gestures (which set `armL/armR` while a character talks) can't pull a held prop or a flex apart; the other arm still gestures.
  Pass **`freeArms: true`** to animate those arms yourself (the prop follows the hand). Other preset fields (lean, headRot, bodyY…) are
  only defaults.
* `max` is size 0.56 with a 1.16 head: use the **same `s`** as everyone else; his props (balloon, tablet) are already compensated.
* `tank { carry }` draws the hero **after** Tank (the hero's legs are in front of Tank's head); his `carry` object is merged into the hero's
  pose (face, arms…). For other riders use `carryAt()` and draw them after Tank.
* `benji { fallen: 'flat' }` rotates the whole rig (`rot −90`) and moves him down to the floor; `headTop` ignores rotation.
* Mrs. Krump's beehive is an unfiltered `under`/`over` layer on `D.teacher` (keeps the volume filter cheap) — if you build a custom
  design from `D.teacher`, keep its `under`/`over`.
* Lite humans (`kid`, `adult`) are flat by design (`volume` is forced off) — use them for crowds and backgrounds; the named cast is the
  "real" quality level for close shots.
* Biscuit is front-only in `sit`/`beg` and side-only in `walk`/`sleep`; `flip` mirrors him.
* Hand props in the back view go to the `'back'` layer (hidden behind the body), by design.
