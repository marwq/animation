# CAST — "What If You Could RESPAWN in Real Life?"

Every character, its look, size and pose options, plus Gary, the fishbowl and every prop.
Code: `rig/cast.js` (rig characters), `rig/looks5.js` (their hair/clothes/overlays), `rig/extras.js` (Gary, bowl, props).
Contact sheets (`node tools/concept.js [lineup|expr|turn|props|crowd|all]`):

| Sheet | What |
|---|---|
| `concept/cast_lineup.png` | everyone at the same scale (s 0.75), Gary's bowl on a table, ghost-YOUs |
| `concept/cast_expressions.png` | 8 faces + side + back per character, Gary's yaw / blink / look / glowing eyes |
| `concept/cast_turnaround.png` | front · turn ±0.6 · side · side flipped · back for every rig character, ghostLite variants |
| `concept/cast_props.png` | every prop and its variants, the bowl with a tiny YOU inside, **all character pose options** |
| `concept/cast_crowd.png` | `draw.kid` / `draw.adult` crowds, 300 ghostLites in one `ghostCrowd` |

## 1. Rig characters

Draw with `actor(key, t, pose, act)` from `scenes/kit.js` (auto lip-sync for YOU, IVY, DAD, MOM, BEA, TEACHER, COACH,
PRINCIPAL, KID) or directly with `require('../rig/cast').draw[key](pose)`. All the usual pose fields work
(`x, y, s, view, flip, turn, armL/armR, legL/legR, kneeL/kneeR, lean, bodyY, headRot, headY, rot, lift, sx, sy, face, props, volume, shadow`) — see ENGINE.md.
**Pass `t` (scene time) in the pose** when you use animated options (flags wave, Bea's shoe lights blink, smoke, juggling pins).

Height = feet to the top of the hair / bun / props at **s 1** (the hero's head is ≈ 330 wide). `size` is the rig scale factor.

| key | who / look | height @ s 1 | size | options (all optional) |
|---|---|---|---|---|
| `you` | **the hero** — orange bowl cut, white face, huge round eyes, red open jacket, yellow tee, dark green pants. *Unchanged* construction. | 951 | 1 | `foam 0..1` (foam cap + drips on the head, blobs on shoulders/body), `backpack: true \| 'flag'` (school backpack; `'flag'` = green checkpoint flag sticking out; `flagSvg` replaces the flag, `flagGlow 0..1`), `headphones: true \| colour` |
| `ivy` | best friend, 12, inventor — big dark curls pulled up into a puff with a **wrench** stuck in it, brass goggles on the forehead, green patched overalls over an orange-striped long-sleeve tee, cheek band-aid, torn knee with a band-aid, yellow knee patch, purple high-tops, warm brown skin | 1150 (917 w/o puff) | 0.96 | `goggles: 'up' (default) \| 'down' \| false`, `soot 0..1` (smudges on face + clothes; ≥ 0.4 frizzes the hair, > 0.6 smoke wisps), `foam 0..1`, `book: true \| 'open' \| 2` (BOOK OF FAILS in her left hand; `'open'` = held open with both hands; `2` or `vol: 2` = VOL. 2), `rockets 0..1` (rocket boosters + flames on her sneakers — side view flames go backwards, front view downwards), `frizz: true` |
| `dad` | big bushy ginger beard, thick ginger brows, short ginger swoop, chunky (shoulders 122), blue plaid shirt with rolled sleeves, mustard **FLIP MASTER** apron (text on the lower apron — the beard hides the bib), fuzzy maroon slippers | 1115 | 1.14 | `spatula: true` (right hand), `pancake: true \| 'burnt'` (on the spatula; held flat, pointing out), `apron: false` (plain plaid shirt), `pancakeOnHead: true` |
| `mom` | ER nurse — teal V-neck scrubs (tunic hem), messy bun with a pink scrunchie, blue lanyard + RN ID badge, pens in the pocket, white clogs | 1173 | 1.06 | `thermos: true` (left hand), `phone: true` (right arm raised, filming; we see the phone's back; `phoneFace: 'screen'`) |
| `bea` | little sister, 6 — **0.70× the hero**, two big orange pigtail bunches with pink bobbles, blunt bangs, huge blue eyes, freckles, pink puff-sleeve dress with a yellow star, frilly socks, light-up sneakers, **missing front tooth** (shows with every teeth mouth) | 668 | 0.68 | `spoon: true \| 'full'` (right hand), `sign: true` (GO MUSHROOM! sign held in front with both hands) `\| 'up'` (sign on a stick above her head), `gapSmile: true` (gap-tooth grin), `t` (shoe lights) |
| `teacher` | Mr. Fig, maths — tall and thin (head scaled 0.86), neat glossy side part, thin glasses, pencil moustache, bored half-lids, pale-blue shirt, olive cable-knit vest, plum polka-dot bow tie, loafers | 1148 | 1.24 | `papers: true` (stack of POP QUIZ papers, left hand), `marker: true \| 'open'` (right hand) |
| `coach` | Coach Dee — athletic, lime sun visor, high black ponytail, purple track jacket with white stripes, whistle on a red cord, black track pants with side stripes | 1091 | 1.08 | `whistle: 'chest' (default) \| 'mouth'` (blowing it: mouth 'o'), `ball: true` (red dodgeball under the right arm; `ballCol`) |
| `principal` | Principal Pemberton — stern, silver hair in a tight doorknob bun, crimson cat-eye glasses, pearl earrings + pearl necklace, cream blouse, navy cardigan with a gold brooch, grey pencil skirt, sensible black shoes | 1173 | 1.08 | `foam 0..1` (covered in foam; > 0.3 adds a **foam moustache**), `spaghetti 0..1` (spaghetti draped on her head, a clump on her shoulder), `mic: true` (right hand) |
| `juggler` | the talent-show winner — sparkly magenta leotard + sleeves, pink tights, ballet bun with a gold headband, gold flats | 932 | 0.86 | `juggle: phase` (number, e.g. `t * 1.4`: 7 bowling pins in a cascade above her head, drives her arms), `pins: n` |
| `ghost` | ghost-YOU — the hero rig in cool greys, slate lines, faint cyan rim, **alpha 0.55** | 951 | 1 | `alpha` (0.55), `rim: false`, plus every YOU option (`foam`, `backpack`, `headphones`). `volume` defaults to false. |
| `ghostLite` | flat simplified ghost silhouette for crowds (bob helmet, eyes only, cyan-teal outline) | 950 | 1 | `alpha` (0.55; `1` = opaque & cheapest), `col` (fill), `rim: true` (thick cyan rim behind). Same pose fields (views, arms, legs, rot…). No faces / mouths. |
| `kid` | crowd kids (classmates, cafeteria, audience): random hair, skin, tops, glasses | ≈ 850 | 0.8–0.96 | `draw.kid(i, pose)` or `actor('kid', t, { i, ...pose })` — same `i` = same kid |
| `adult` | crowd adults (teachers' lounge, parents) | ≈ 1075 | 1.02–1.14 | `draw.adult(i, pose)` |

Also exported: `draw.ghostCrowd(poses[], { alpha })` (many ghostLites in ONE opacity group — see perf), `D` (designs),
`NAMES`, `kidDesign(i)`, `adultDesign(i)`, `handAt(design, pose, side)`, and re-exports `gary`, `fishbowl`, `extras`.

**Faces.** All expression names from ENGINE.md work for everyone. Character notes:
Ivy, Mom, Coach, Principal and the juggler have "mid" eyes with irises + lashes; Dad, Mr. Fig and most kids have dot eyes;
Bea has the hero's big eyes with blue irises. Mr. Fig's neutral face is already bored (half lids); Pemberton's is already stern.
Dad's thick brows and big beard follow the expression brows; his mouth sits on the beard (the moustache covers its top).

## 2. Extras: Gary, the fishbowl, props (`rig/extras.js`)

```js
const X = require('../rig/extras');           // or require('../rig/cast').extras
X.spatula(x, y, s, rot, { pancake: true })    // positional ...
X.spatula({ x, y, s, rot, pancake: true })    // ... or one object — every function accepts both
```

* Pure functions → SVG strings. `rot` in degrees, `s` scale.
* **Props are authored in the hero's body units** (hero 951 tall at s 1): use the actor's `s` in screen space, or `s ≈ 1` inside a rig pose's `props` (body space).
* Gradients: `DEFS` (`exWater`, `exGold`) are loaded by `scenes/main.js` automatically. Clip ids use `S.uid` (reset per frame).

### Gary the goldfish
`gary({ x, y, s, t, look: [x, y], blink 0..1, turn: 'side'|'front'|'tail', yaw, flip, glowEyes 0..1, mouth: 'o'|'line'|'open', bubble 0..1, lids, line })`
* (x, y) = body centre. At s 1 his body is 170 × 140, ≈ 290 long with the tail (a medium close shot).
* `turn` presets: `'side'` = profile facing screen-right (`flip` → left), `'front'` = facing the camera, `'tail'` = his fantail to the camera.
  For smooth turns animate **`yaw`** in degrees (0 front, 90 facing right, −90 left, 180 tail): the tail narrows edge-on and opens into a butterfly fantail.
  "Gary turns his tail on the hero" = animate yaw from ±90 to 180 (or flip so his tail points at the hero).
* `lids` (0.46) = the deadpan half-closed lids; `blink` closes them. `glowEyes 1` = green glowing eyes with a halo (the ending).
* `t` = swim (tail sway, fin flaps). `line` = stroke width in local units (6).

### The fishbowl
`fishbowl({ x, y, s, t, gary: {...}|false, garyFront, flag 0..1, flagSvg, inside: svg, bubbles, plant, water, line })`
* (x, y) = bottom centre on the desk; 600 wide × ≈ 490 tall at s 1. On the hero's desk use **s ≈ 0.45 × the hero's s** and `line: 7 * heroS / s` to match line weights.
* `gary` = options for the fish inside, in bowl-local units (default `{ x: -40, y: -230, s: 0.62 }` + your fields, e.g. `{ yaw: 0, glowEyes: 1, s: 1.1 }`); his line weight stays matched to the bowl whatever his `s`.
* `flag 0..1` = the small glowing checkpoint flag on the gravel; or pass the official one: `flagSvg: R.tinyFlag(0, 0, 2.4, t)` (placed on the gravel at local (−120, −30)).
* **`fishbowl.layers(opts)` → `{ back, front }`**: draw something between the water and the glass. Local frame: `fishbowl.LOCAL = { cx: 0, cy: -270, R: 300, gravelY: -44, waterY: -435 }` (multiply by s, add x, y).
  ```js
  const B = X.fishbowl.layers({ x: 960, y: 980, s: 1.4, t, gary: { yaw: -30, s: 1.1 }, garyFront: true });
  svg = B.back + actor('you', t, { x: 900, y: 980 - 70, s: 0.1, volume: false }) + B.front;   // tiny YOU on the gravel
  ```
  `garyFront: true` draws Gary in front of whatever you put inside (giant Gary staring at tiny YOU).

### Props (anchor = the point (x, y) refers to)

| function | anchor / size @ s 1 | options |
|---|---|---|
| `spatula(x,y,s,rot,{pancake, edge, col})` | grip; rot 0 = blade up; ≈ 400 long | `pancake: true\|'burnt'` stays level on the blade |
| `pancake(x,y,s,rot,flip,{burnt, butter})` | centre; 150 wide | `flip` 0..1 = one full flip (0 = lying flat, 0.25/0.75 edge-on/face-on, 0.5 upside down) |
| `pancakeStack({x,y,s,n,syrup,butter,plate})` | bottom centre of the plate | n pancakes (5) |
| `plate(x,y,s)` · `spoon(x,y,s,rot,{full})` | plate centre · spoon grip (bowl up) | |
| `bookOfFails(x,y,s,rot,{open, vol: 1\|2, title, pages})` | centre; closed 200×250, open 400×250 | `vol 2` = red "VOL. 2" cover (the ending); `pages: [[left lines], [right lines]]` |
| `topHat(x,y,s,rot,{mouth:'up'\|'down'\|'side', foam, band})` | `'up'`/`'side'`: centre of the opening; `'down'`: centre of the brim | `foam 0..1` erupts from the opening |
| `flask(x,y,s,rot,{col, fill, kind, bubbles, glow, t})` | bottom centre; 190 tall | `kind: 'erlenmeyer'\|'round'\|'beaker'\|'tube'` |
| `flaskTray({x,y,s,rot,cols,fill,tilt,t})` | tray centre; 340 wide | `tilt` tips the flasks |
| `skateboard(x,y,s,rot,{flipK, deck, graphic})` | deck centre; 440 long, wheels reach y+52 | `flipK` 0..1 = kickflip around the long axis (0.25 graphic side, 0.5 upside down, 0.75 grip side) |
| `dodgeball(x,y,s,rot,{col, squash, r})` | centre; r 62 | `squash 0..0.6` impact |
| `ballBin(...)` / **`ballBin.layers(...)` → {back, front}** | floor centre; 460 wide | `fill 0..1`; draw YOU between the layers to sit in the balls |
| `lunchTray(x,y,s,rot,{spaghetti, milk, apple})` | centre (held level) | `spaghetti 0..1` |
| `spaghetti(x,y,s,rot,{mode, k, t, seed, meatballs, sauce})` | `'plate'` heap · `'fly'` flying clump (k = spread) · `'splat'` on a surface (y = surface) · `'drape'` strands hanging from y | |
| `quizPaper(x,y,s,rot,{grade:'100%', title, name})` · `paperStack(...)` · `marker(...)` | centre · centre · grip (tip up) | |
| `birthdayCake({x,y,s,smash,text,candles,t})` / **`.layers(...)`** | bottom centre of the board; 600 wide | `smash 0..1` breaks the top open (chunks fly); text `'HAPPY BDAY MR. FIG'` |
| `trophy({x,y,s,text})` | bottom centre; ≈ 330 tall | text `'MOST UNFORGETTABLE ACT'` (3 lines) |
| `goSign({x,y,s,rot,stick,text,t})` | board centre; 400×290 | crayon "GO MUSHROOM!" + a mushroom-YOU; `stick: true` |
| `rocketSneakers({x,y,s,rot,flame,t,col,pair})` | sole bottom centre (side view, facing left) | `flame 0..1` |
| `thermos(...)` · `phone(...,{face:'back'\|'screen', rec, screen, t})` · `handMic(...)` | centre · centre · grip | |
| `micStand({x,y,s,cable,tripped,h})` | base centre on the floor; 620 tall | `cable: [[x,y],…]` local path; `tripped 0..1` tips it over |
| `bowlingPin(x,y,s,rot,{stripe, sparkle})` | centre | |
| `bicycle({x,y,s,rot,wheelSpin,col,flip,bars})` | ground point under the frame; faces screen-left | `wheelSpin` radians, `bars` handlebar rotation (crash) |
| `backpack({x,y,s,flag,t})` · `backpackWorn(view,{flag,t,flagSvg})` | bottom centre · body-space layers `{back, mid, top}` (used by YOU's option) | |
| `checkpointFlag({x,y,s,h,glow,t})` | foot of the pole | small flag; the big animated checkpoint is `R.flag()` in scenes/respawn.js |
| `foam({x,y,s,k,r,n,seed,drip})` | centre of a foam cluster | for the big foam FX use scenes/respawn.js (`foamFountain`, `foamPile`…) |

## 3. Putting props in hands

* Front view: `require('../scenes/acting').hand(armAngle, side)` → hand tip in body space for a character with shoulders at ±100 (YOU, Ivy, ghosts, principal…).
  For other widths use **`require('../rig/cast').handAt(D.key, pose, side)`** (handles shoulder width, turn and side view; returns the grip point ≈ 236 down the arm). `side +1` = screen-right arm (`armR`).
* Pass the prop in the pose: `props: [{ svg: X.spatula({ x: h[0], y: h[1], rot: 14 }), layer: 'front' }]`.
  Layers: `'front'` over everything (held items), `'mid'` after the torso but before the arms (things under an arm), `'back'` behind the torso (back view: things held in front), `'top'` outside the body transform (doesn't follow lean/bodyY).
* Example — YOU carrying the flask tray on stage:
  ```js
  const pose = { x, y, s: 0.5, armL: 26, armR: 26 };                 // hands at ±205, y ≈ -303 (body units)
  pose.props = [{ svg: X.flaskTray({ x: 0, y: -293, s: 1.15, t }), layer: 'front' }];   // tray ends sit in the hands
  actor('you', t, pose, { arms: false });
  ```
* Arms are straight R6 blocks: to "hold" something at the chest use arms ≈ 25–45°; raise to 120–160 to lift things; the hand is never at the mouth.

## 4. Performance (headless Chromium, 1920×1080 JPEG, measured)

| | ms per character |
|---|---|
| s 0.5 (≈ 475 px tall) | you 14 · ivy 18 · dad 16 · mom 15 · bea 10 · teacher 13 · coach 14 · principal 14 · juggler 10 · ghost 5 · kid 8 |
| option-heavy at s 0.5 | ivy soot + open book 26 · principal foam + spaghetti 18 · you foam + flag 13 · juggler juggling 14 |
| head close-up (s 1.8) with volume | you 40 · ivy **87** · dad 84 · mom 62 · teacher 67 · coach 66 · principal 64 · bea 21 · kid 32 |
| head close-up with `volume: false` | 15–21 for everyone → **pass `volume: false` for big close-ups** |
| ghostLite at s 0.15 | **0.46** opaque (`alpha: 1`) · **0.61** inside one `ghostCrowd` group · 1.1–1.3 with its own alpha · JS 0.04 |
| full `ghost` at s 0.4 | 4.5 |
| fishbowl s 1.4 + Gary s 2 | 23 (whole thing) |

300 ghostLites with per-ghost alpha ≈ 385 ms (too slow for one frame); in one `draw.ghostCrowd(poses)` ≈ 185 ms;
opaque ≈ 140 ms. For the "hundreds of ghosts" shots use `ghostCrowd` (or opaque lites + a translucent overlay) and keep the full `ghost` for the ≤ 10 hero ghosts in focus.

## 5. Gotchas

* **YOU is untouched**: `draw.you(pose)` without options produces exactly the original construction (byte-identical output). Options only add props / an `over` head layer.
* Head overlays (foam, goggles, headphones, pancake, spaghetti, whistle in mouth, soot, smoke) use the design's `over` hook, so they follow `headRot`/`headY` and the turn; body overlays (shoulder foam, soot on clothes, spaghetti clump) are `'front'` props.
* Mr. Fig's head is scaled 0.86 around the neck; his shoulders are at ±84 and Dad's at ±122 → use `handAt`, not `acting.hand`, for their props.
* Bea at the same `s` as YOU is 0.70× his height — don't shrink her again. Her lights blink only if you pass `t`.
* `actor('kid', t, { i: 5, ... })` picks the kid; without `i` you always get kid 0.
* Tiny YOU (fishbowl, s 0.05–0.1) renders fine; pass `volume: false, shadow: false` there.
* The backpack flag in the **back view** is drawn in the `'top'` layer (in front of the hair), so it ignores `lean`; for a leaning back view pass your own flag via `props`.
* The checkpoint flags in extras are simplified; for the official animated checkpoint use `R.flag`, `R.flagProp(t)` and `R.tinyFlag` from scenes/respawn.js (`backpack: 'flag', flagSvg: R.flag({ x: 0, y: 0, s: 0.95, t })` or `fishbowl({ flagSvg: R.tinyFlag(0, 0, 2.4, t) })`).
* Gary/fishbowl stroke widths scale with `s`; when they are small next to the hero pass `line` (see above).
* Character option values: `foam`/`soot`/`spaghetti` are 0..1 amounts; `foam: 1` covers the head but keeps the eyes readable; `soot ≥ 0.4` swaps Ivy's hair for the frizzed version (a hard switch — animate soot past 0.4 on a cut or during the explosion flash).
* Hand props in the back view go to the `'back'` layer (hidden behind the body), by design.
