# CAST — "What If Your PARENTS Joined Your Roblox Server?"

Every character key, its look, size and pose options, the non-rig Block King, and every prop.
Code: `rig/cast.js` (draw functions + options), `rig/looks6.js` (hair, outfits, avatar heads, the hot-dog costume, overlays,
lite avatars, the Block King — on top of looks3..5), `rig/extras.js` (props and devices).
Contact sheets (`node tools/concept.js [lineup|avatars|expr|turn|boss|props|all]`):

| Sheet | What |
|---|---|
| `concept/cast_lineup.png` | everyone at the same scale (s 0.7): the real house on the left, Cube City avatars (with nametags) on the right |
| `concept/cast_avatars.png` | each real person next to their avatar, avatar options, DarkBlade + clan + DarkBlade's mom, 16 players + 16 noobs |
| `concept/cast_expressions.png` | 8 faces + side + back per character (incl. how avatars talk) |
| `concept/cast_turnaround.png` | front · turn ±0.6 · side · side flipped · back for every rig character |
| `concept/cast_boss.png` | the Block King: idle, rise, roar, smash k 0/1, hit, crack, burst, shield + talking, scale vs the hero |
| `concept/cast_props.png` | devices with game footage, house props, game props, **all character pose options** |

## 1. Rig characters

Draw with `actor(key, t, pose, act)` from `scenes/kit.js` (auto lip-sync / blinks / gestures for the keys in kit's SPEAKER map:
`you dad mom grandma momTeen noodle darkblade kid boss dadAvatar momAvatar grandmaAvatar`) or directly with
`require('../rig/cast').draw[key](pose)`. All the usual pose fields work (`x, y, s, view, flip, turn, armL/armR, legL/legR,
kneeL/kneeR, lean, bodyY, headRot, headY, rot, lift, sx, sy, face, props, volume, shadow`) — see ENGINE.md.
**Pass `t` (scene time) in the pose** for animated options (RGB, steam, capes, dizzy stars, propeller, boss idle).

Height = feet to the top of the hair / hat / costume at **s 1**, without nametag (the hero's head is ≈ 280 wide; he is 951 tall).

### The real family (the house)

| key | look | height @ s 1 | size | options |
|---|---|---|---|---|
| `you` | **THE HERO — unchanged construction** (byte-identical output without options): orange bowl cut, white face, huge eyes, red open jacket, yellow tee, dark green pants. In the game his avatar is the same character. | 951 (1124 with crown) | 1 | `nametag: 'YOU'\|true\|string` (floating game nametag + gold "LVL 99" tag; `lvl` changes the number; off by default — he is also the real kid), `crown: true\|'99'` (small gold LVL-99 crown on the bob), `sword: true\|'gold'\|'dark'` (right hand; `true` = steel; blade follows the arm; `swordRot`, `swordGlow`), `hood: true` (red hood pulled over the bob — "I'm a tree"), `headset: true\|0..1` (gaming headset with RGB cups + mic; a number animates putting it on: 0 = held 260 above the head, 1 = on), `tablet: true` (both hands, we see its back; `tabletFace: 'screen'`, `screen`, `glow`), `headphones` (old option) |
| `dad` | accountant: chubby (belly), receding grey-brown hair (bald shiny temples, a little comb-over island, bushy side tufts), **big walrus moustache**, thick brows, dot eyes, **reading glasses pushed up on the forehead**, light-blue shirt under a mustard **argyle sweater vest** (two pens peeking out), khakis, **white socks in brown sandals** | 1068 | 1.1 | `glasses: 'up'` (default) `\| 'on' \| 'off'`, `mouse: true` (holds a computer mouse to his ear like a phone, cable dangling), `newspaper: true\|'back'\|{title, headline, fold}` (held open with both hands — breakfast), `blanket: true` (asleep under a quilt from the chin to the knees — arms hidden), `sleepy: true` (sleepy face + zzz; combine with `blanket`) |
| `mom` | quiet librarian: auburn hair in a **neat bun with a pencil through it**, round burgundy glasses, sage **cardigan** over a cream blouse with a peter-pan collar (book brooch, bookmark ribbon in the pocket), plum A-line skirt, dark tights, burgundy flats, a touch of lipstick | 1124 | 1.04 | `mug: true\|'text'` ("#1 MOM" mug in the right hand, steams with `t`; `mugUp: true` raises it to sip), `headset: true\|0..1` (big pink/cyan gaming headset — her "game face"; a number animates putting it on), `pajamas: true` (night: lavender moon-print pajamas + fuzzy slippers, **tea cup** in the left hand; `cup: false` removes it, `steam`), `tablet: true` (both hands, we see the back with a LIBRARY sticker; `tabletFace: 'screen'`, `screen`, `glow`) |
| `grandma` | white curls, round gold glasses on a beaded chain, rosy pink cardigan over a dusty-blue **flowered dress**, fuzzy pink slippers with pompoms, pink cheeks | 954 | 0.9 | `knitting: true` (needles + pink swatch at her hands, yarn ball by her side), `phone: 'arm'` (phone held out at arm's length, we see its flowery back; `phoneFace: 'screen'`, `screen`, `glow`), `curlers: true` (pastel curlers in the curls — night), `cracking: true\|0..1` (knuckle-crack pose helper: arms cross in front, yellow crack bursts at the hands; animate the number for the pop) |
| `momTeen` | Mom at 16 in 1998: big teased bangs + high side ponytail with a neon scrunchie, freckles, oversized **colour-block windbreaker** (teal / purple / hot-pink stripe, yellow zip, smiley pin, "98" on the back), baggy light jeans, chunky white sneakers | 1003 | 0.95 | `trophy: true` (the huge **ARCADE QUEEN 1998** trophy held in front) `\| 'up'` (lifted over her head) |

### Cube City avatars (game characters: bolder, simpler, with nametags)

Avatars show a **floating game nametag by default** (dark pill, coloured name; scales with `s`, does not rotate with `rot`).
`nametag: false` hides it, a string replaces the name. `mvp: true` adds a gold MVP star to the tag (and a medal on the hot dog).

| key | look | height @ s 1 | size | options |
|---|---|---|---|---|
| `dadAvatar` | **DadBod1978 — the HOT DOG**: a tall red sausage with yellow mustard zigzags between two golden bun halves (toasted inner edges), a blocky face hole showing a simple avatar face with Dad's moustache, Dad's light-blue shirt sleeves sticking out of arm holes in the buns, khakis + white socks in sandals (like the real Dad). Back view: a costume zipper. | 1240 | 1.06 | `nametag` (default `'DadBod1978'`), `mvp: true` (gold MVP medal on a red ribbon + MVP star on the tag). His face lives in the face hole: lip-sync works, `headRot` gently tilts the face inside the hole. |
| `momAvatar` | **MOM_OFFICIAL**. `armor: 0` (default) = the plain **default grey avatar** (grey head, grey shirt, grey legs, simple smile, a plastic shine) + her round glasses ("Grey is classy"). `armor: 1` = **golden warrior armour**: gold helmet with a pink plume and a heart, heart breastplate, pauldrons, bracers, tassets, gold greaves with knee cops, gold boots, red cape, **pot-lid shield** on the left arm, gold sword in the right hand. Her skin stays grey under the armour. | 908 / 1192 | 1.02 | `armor: 0\|1`, `glasses` (default true), armour only: `shield: false`, `shieldUp: true` (raised to block), `shieldFlash 0..1` (glint), `sword: false\|'gold'\|'steel'` (default gold), `swordRot`, `swordGlow`, `cape: false`, `nametag` (default `'MOM_OFFICIAL'`), `lvl` |
| `grandmaAvatar` | **GrannyGoodies — the billionaire**: white curls, gold **monocle** on a chain, pink lipstick + lash flicks, cream **fur coat** to the knees with a fluffy **fur stole**, fur cuffs, open over a purple dress with **big pearls**, gold flats; **golden cane** + **money bag** | 996 | 0.94 | `cane` (default true; left hand), `bag` (default true; right hand), `coins 0..1` (coins popping out of the bag), `apron: true` (pink Granny's Goodies bakery apron with the cookie "GG" logo over the coat), `nametag` (default `'GrannyGoodies'`) |
| `noodle` | **NoodleBoi**: his head is a **ramen bowl** (cream bowl, red rim band, blue waves; noodle heap, half egg, naruto, spring onions, nori, two chopsticks sticking up) with a happy dot-eyed face on the bowl; navy **sushi hoodie** (big nigiri on the chest, maki rolls, kangaroo pocket, drawstrings), dark joggers, white sneakers | 1166 | 0.98 | `hairnet: true` (a net over the noodles), `apron: true` (Granny's Goodies factory apron), `badge: true\|'EMPLOYEE OF THE MONTH'` (gold rosette + name card on the chest), `nametag` (default `'NoodleBoi'`). The employee photo frame is `X.employeeFrame`. |
| `darkblade` | **xX_DarkBlade_Xx**: black spiky armour with red trim (glowing red X emblem), helmet with five spikes and a **T-visor with glowing red eyes — no mouth**, spiky pauldrons, gauntlets, jagged tassets, spiked boots, **tattered maroon cape**, big black sword with a red edge | 1020 | 1.0 | `sword` (default in the right hand; `'back'` = slung on his back, `false` = none; `swordRot`, `swordGlow`), `cape: false`, `shy: true` (visor pushed up: a shy kid's face shows — big purple eyes, blush, a mouth that lip-syncs; softer stance, no sword), `stars: true` (dizzy KO stars orbiting the head; pass `t`), `nametag` (default `'xX_DarkBlade_Xx'`) |
| `clan` | DarkBlade's clan: `draw.clan(i, pose)` or `actor('clan', t, { i })`. 5 variants (i mod 5): gunmetal + purple eyes + axe, maroon + horns + orange eyes + sword, navy + cyan crest + axe, charcoal + horns + green eyes + sword, plum + 5 spikes + pink eyes + axe | 930–960 | 0.94–1.0 | `weapon` (default per member, `'axe'\|'sword'\|false`), `stars: true`, `nametag: true\|string` (off by default; default names `DarkClan_N`) |
| `darkbladeMom` | the final gag: a big rounded dark-plum **beehive** with a pink band, stern brows, magenta top, white **apron with "MOM"** on it, pink fuzzy slippers, **rolling pin** raised | 1238 | 1.04 | `rollingPin: false`, `nametag` (default `'MOM'`) |
| `player` | generic players for crowds: `draw.player(i, pose)` — random skin / shirt colours, hats (cap, beanie, spiky hair, bob, headphones, cat ears, crown, top hat, viking helmet, bunny ears, ninja band, afro, ponytail), logos (star, heart, bolt, stripe, number), some sunglasses | ≈ 760–1000 | 0.86–1.02 | `sword: true\|'gold'\|'steel'\|'dark'` (right hand), `stars: true`, `nametag: true\|string` (default names like `PizzaLord`, `ObbyQueen`…) |
| `noob` / `kid` | tiny "noob" new players: plain starter avatars (bald, flat starter colours, simple smile). **`noob 0` = THE KID** (yellow head, blue shirt, green legs, a spinning **propeller cap**). `kid` is the same function, so `actor('kid', t, { i: 0, … })` lip-syncs the KID voice. | 704 (KID) / ≈ 600–690 | 0.66–0.76 | `stars`, `sword`, `nametag: true\|string` (KID → `lil_noob_7`, others `Guest_####`), `t` (propeller spin) |

Lite avatars (`player`, `noob`/`kid`) are flat (no clips, no filters, `volume` off) and support every view, arms, legs and the
face names (eye types, mouths, fx). Same `i` = same avatar.

Real-world crowd humans are still available for the API (`draw.humanKid(i, pose)`, `draw.adult(i, pose)`, `kidDesign(i)`,
`adultDesign(i)`) — the script hardly needs them.

### The Block King (non-rig boss)

`draw.blockKing(pose)` = `draw.boss(pose)`; **use `actor('boss', t, pose, { … })`** so the BOSS voice drives his jaw.
A giant of grey stone cubes (cracks, moss on the shoulders and head, moss drips), a tilted **gold crown** with purple/pink gems,
**glowing purple eye slits**, stone teeth and a jaw that drops when he talks, a **glowing purple crystal core** in the chest,
huge cube **fists** with knuckle grooves. Feet at (x, y); **≈ 1270 tall at s 1 (1530 with the arms up), ≈ 1490 wide** —
use **s 1.5–4** to fill the sky (the hero at s 0.5 is 475 px). Front view only (`flip` mirrors).

| field | meaning |
|---|---|
| `pose` | `'idle'` (default: arms hanging, slow breathing with `t`), `'rise'` (arms up and out, head up), `'smash'` with `k` 0..1 (0 = both fists raised overhead → 1 = slammed down in front, fists 1.2× bigger, body dips), `'roar'` (forearms flexed up, head back, jaw wide), `'hit'` (recoil: lean back, head turned, **X eyes**, arms flailing) |
| `rise` | 0..1: emerging from the ground — shifted down and cut at the feet line y (0 = hidden, 1 = standing) |
| `crack` | 0..1: glowing purple cracks spread over the cubes; **> 0.55 the cubes burst apart** (blocks fly outward, the crown pops off, debris falls). Use 1 + your own cube confetti for the final crumble. |
| `shield` | 0..1: brighter core + a pulsing ring round it (the dome itself is in `scenes/gameui.js`) |
| `t` | idle breathing, arm sway, eye and core flicker, falling debris |
| `face` | from `actor('boss', …)`: the jaw opens with the lip-sync visemes; eye names: `'oof'`/`'dizzy'` → X eyes, a small pupil (`shocked`) → round glowing eyes, blinks |
| `jaw`, `glow` | 0..1 overrides (jaw 1 = wide open) |
| `armL, armR, bendL, bendR, lean, fist` | arm angles like the rig (0 down, 90 out, 180 up), elbow bends (+ raises the forearm), lean (deg), fist scale. **A named preset (`rise/smash/roar/hit`) keeps its own arms** so auto-acting gestures can't break it — pass `freeArms: true` to override. `bodyY / headY / headRot` always add on top (voice bob). |
| `idle: false`, `shadow: false`, `lw` | no breathing; no ground shadow; outline width in local units (default keeps ≈ 14 px on screen at any `s`) |

## 2. How the avatars talk

* **Lip-sync is automatic** through `actor()`: real people and their avatars share a voice (DAD → `dad` and `dadAvatar`, MOM → `mom`, `momTeen`, `momAvatar`, GRANDMA → `grandma`, `grandmaAvatar`).
  In the game a line typed at the keyboard usually appears as **chat over the avatar** (`scenes/gameui.js`), so when the real person
  and their avatar are both on screen, keep the avatar's mouth still with an explicit mouth: `actor('dadAvatar', t, { face: { name: 'happy', mouth: 'smile' } })`
  (an explicit `mouth` always wins over the lip-sync).
* Mouths: `dadAvatar` (in the face hole), `momAvatar` (grey face), `grandmaAvatar`, `noodle` (on the bowl), lite avatars (the KID) all have normal mouths.
* **`darkblade` has NO mouth** with the visor down: his red eyes pulse brighter with the voice (the viseme drives the glow). His lines must be carried by **chat bubbles**. With `shy: true` his face shows and lip-syncs normally (use it for "Thank you, Mrs. Mom." / "...MOM?!").
* The **clan** has no mouths (visors) — they never speak.
* The **Block King** talks with his jaw (`actor('boss', …)`).

## 3. Extras: props and devices (`rig/extras.js`)

```js
const X = require('../rig/extras');              // or require('../rig/cast').extras
X.teaMug(x, y, s, rot, { text: '#1 MOM' })        // positional ...
X.teaMug({ x, y, s, rot, text: '#1 MOM', t })     // ... or one object — every function accepts both
```

* Pure functions → SVG strings; `rot` in degrees, `s` scale. **Authored in the hero's body units** (hero 951 tall at s 1): pass the same `s` as the actor in screen space, or use them inside a pose's `props` (body space, s ≈ 1).
* `DEFS` (`exGold`, `exScreen`, `exTea`) are loaded by `scenes/main.js` automatically. Clip ids use `S.uid` (reset per frame).

### Devices (all show game footage)

`screen` = an SVG string or a function `(w, h) => svg`, drawn in a local box `(0, 0)-(w, h)` clipped to the screen
(sizes in `X.DEVICE_SCREENS`). Without `screen` a little Cube City idle picture shows. `glow 0..1` = light spill in front, `off 0..1` dims the screen.

| function | anchor · size @ s 1 | screen box | options |
|---|---|---|---|
| `laptopOld({x,y,s,rot,face,screen,glow,sticker,open,off})` | bottom centre of the base on the table · 710 wide, 460 tall | 520 × 330 | Dad's ancient chunky grey "DELL-O" laptop. `face: 'screen'` (default) \| `'lid'` (back of the lid with a big **"#1 DAD" star sticker** + a strip of tape — use from behind Dad) \| `'side'` (`open 0..1` lid angle) |
| `tablet({x,y,s,rot,face,screen,glow,col,landscape,sticker})` | centre · 360 × 500 | 300 × 420 (portrait) | Mom's teal tablet. `face: 'back'` (camera + `sticker: 'library'` default \| `'bolt'` \| null), `landscape: true` rotates it 90° |
| `phone({x,y,s,rot,face,screen,glow,style})` | centre · 208 × 392 | 176 × 340 | `style: 'granny'` (default: pink flowery case + pop socket on the back) \| `'plain'` |
| `gamingPC({x,y,s,rot,screen,glow,t,tower,keyboard})` | bottom centre of the monitor stand on the desk · monitor 720 wide | 660 × 372 | big monitor + RGB tower to the right (fans, strip — colours cycle with `t`) + RGB keyboard |

### House

| function | anchor · size @ s 1 | options |
|---|---|---|
| `teaMug({x,y,s,rot,text,steam,t,col,ink,tea})` | centre of the mug body (handle right) · 150 × 125 | text `'#1 MOM'` (default; first word on its own line), `steam 0..1` animates with `t` |
| `teaCup({x,y,s,rot,steam,t,col,trim,saucer})` | centre of the saucer · 190 wide | dainty cup on a saucer |
| `cookie({x,y,s,rot,r,bite,glow})` | centre · r 40 | `bite 0..1` (up to three bites out of the rim), `glow` |
| `cookieTray({x,y,s,rot,n,steam,t})` | tray centre · 390 wide | 8 cookies |
| `cereal({x,y,s,rot,spoon,fall,spoonY,col})` | bottom centre of the bowl · 340 wide | spoon raised above the bowl with one flake on it; **`fall 0..1`: the flake slides off and drops back into the bowl** (the "cereal falls" beat) |
| `newspaper({x,y,s,rot,title,headline,fold,back})` | centre · 440 × 300 | "THE DAILY NEWS — TAX SEASON IS HERE!", `fold 0..1`, `back: true` (sports page) |
| `familyPhoto({x,y,s,rot,title,frame,crooked})` | centre · 320 × 260 frame | the family as simple heads (Dad, Mom, Granny, YOU); `title` plaque, `crooked` deg |
| `blanket({x,y,s,rot,w,h,col,col2,col3,t,wave})` | top centre (under the chin) · w 420 × h 520 | cosy patchwork quilt; `wave 0..1` breathing ripple with `t` |
| `knittingYarn({x,y,s,rot,col,col2,ball,needles,swatch})` | centre between the needles · `ball: [dx, dy]` | swatch hanging from two needles + yarn ball |
| `computerMouse({x,y,s,rot,cord,t})` | grip centre | cable dangles (`cord 0..1`) |
| `arcadeTrophy({x,y,s,rot,text,shine,t})` | bottom centre · ≈ 560 tall | gold cup with a joystick emblem on a purple base "ARCADE QUEEN 1998"; twinkles with `t` |

### Cube City

| function | anchor · size @ s 1 | options |
|---|---|---|
| `goldSword({x,y,s,rot,kind,glow,len})` | **grip**; blade up (−y) at rot 0 · 380 long | `kind: 'gold'` (Granny's swords for everyone) \| `'steel'` \| `'dark'` (DarkBlade, red edge + barbs) |
| `potion({x,y,s,rot,col,glow,label,t})` | centre of the round flask · 160 wide | healing potion (`'+'` label), liquid sloshes with `t` |
| `coinBag({x,y,s,rot,coins,col,sign})` | the tied neck (grip) · hangs down 260 | `$` sack; `coins 0..1` pops coins out |
| `potLid({x,y,s,rot,r,dent,flash})` | centre · r 120 | MOM_OFFICIAL's shield |
| `cane({x,y,s,rot,len,col})` | the hook (grip); shaft goes down 560 | gold with a purple gem |
| `rollingPin({x,y,s,rot,flour})` | centre · 420 long | |
| `axe({x,y,s,rot,col,edge,glow})` | grip, head up | clan axe |
| `mvpMedal({x,y,s,rot,text})` | medal centre (ribbon above) | |
| `employeeFrame({x,y,s,rot,title,name,inner})` | centre · 340 × 400 | gold frame "EMPLOYEE OF THE MONTH", `inner` = svg drawn at the picture's centre-bottom (e.g. `draw.noodle({ x: 0, y: 0, s: 0.2, nametag: false })`) |
| `screenBox(x0,y0,w,h,r,screen,opts)`, `cubeIdle(w,h)` | helpers for your own screens | |

## 4. Putting props in hands

* **`require('../rig/cast').handAt(D.key, pose, side)`** → grip point in body space (≈ 236 down the arm), handles shoulder width, shoulder height, turn and side view. `side +1` = screen-right arm (`armR`).
  Designs: `D.you, D.dad, D.mom, D.momPJ, D.grandma, D.momTeen, D.dadAvatar, D.momAvatar (= momAvatar0), D.momAvatar1, D.grandmaAvatar, D.noodle, D.darkblade, D.darkbladeMom`, plus `clanDesign(i)`, `playerDesign(i)`, `noobDesign(i)`.
  Shoulders: hero/mom/noodle ±100, dad ±118, momTeen ±112, grandmaAvatar ±108, darkblade ±104, **hot dog ±214 at y −566** (arms come out of the buns).
* Pass the prop in the pose: `props: [{ svg: X.goldSword({ x: h[0], y: h[1], rot: 20 }), layer: 'front' }]`.
  Layers: `'front'` over everything (held items), `'mid'` after the torso before the arms, `'back'` behind the torso (back view: things held in front), `'top'` outside the body transform.
* Arms are straight R6 blocks: "holding" at the chest ≈ 25–45°, lifting 120–160; the hand never reaches the mouth (Mom's `mugUp` and Dad's `mouse` cheat it beside the head).

## 5. Performance (headless Chromium, 1920×1080 JPEG, measured with 6 copies per frame)

| | ms per character |
|---|---|
| s 0.5 (≈ 475 px tall hero) | you 12 · dad 17 · mom 20 · grandma 13 · momTeen (+trophy) 13 · dadAvatar 15 · momAvatar 10 / armour 16 · grandmaAvatar 14 · noodle 12 · darkblade 18 · clan 14 · darkbladeMom 15 |
| close-up s 1.8 with volume | you 49 · dad 47 · mom 70 · grandma 54 · dadAvatar 66 · noodle 65 · grandmaAvatar 49 · momAvatar armour 40 · **darkblade 113** |
| close-up s 1.8 `volume: false` | 13–15 for everyone → **pass `volume: false` for big close-ups** (always for DarkBlade) |
| crowds | **noob ≈ 0.5–0.9 ms** each (60 noobs at s 0.15 = 29 ms; 50 at s 0.25 = 45 ms) · **player ≈ 0.8 ms** (40 at s 0.3 = 32 ms) |
| Block King | s 2: 28 ms · s 3: 18 ms · s 4 bursting (crack 0.8): 17 ms (no filters; it gets cheaper as it leaves the frame) |

JS time is ≈ 1–5 ms per character. A family of four at s 0.5 ≈ 48 ms.

## 6. Gotchas

* **YOU is untouched**: `draw.you(pose)` without options is byte-identical to the original construction. His options only add an `over` head layer (crown, hood, headset) or props (sword, tablet). His nametag is **off by default** (he is also the real kid) — pass `nametag: 'YOU'` in the game.
* **Avatar nametags are on by default** and are drawn in screen space after the body: they follow `x, y, s, lift, bodyY, headY` but not `rot` / `flip` — pass `nametag: false` for spins, falls, close-ups, or draw your own with `require('../rig/looks6').gameTag(x, y, s, { name, col, lvl, mvp })`.
* `kid` = `noob` (the noob kids of Cube City); **without `i` you get noob 0 = THE KID** with the propeller cap. `actor('clan', t, { i })`, `actor('player', t, { i })` work too.
* Capes (DarkBlade, armoured Mom) are drawn **behind the whole body** in the front and side views (an underlay with the character's transform, bob and lean) and as a front prop in the back view.
* The hot dog's face is drawn by the costume torso; `headRot` only tilts the face a little inside the hole. Its arms hang beside the buns (`handAt` knows the wide shoulders).
* DarkBlade's `shy` hides his sword and softens the default stance (arms in, slight head tilt); explicit pose fields still win.
* Mom's and YOU's `headset` accept a number: animate 0 → 1 for "she slowly puts on the headset".
* Dad's `glasses: 'off'` is a hard switch — cut on a beat or cover it with a hand move ("Dad slowly takes off his glasses").
* The Block King is front-view only; with a named preset his arms ignore `armL/armR` (auto-acting gestures) unless `freeArms: true`. `rise < 1` clips him at his feet line — draw the ground after him if you want debris in front.
* `grandma.cracking`, `momTeen.trophy`, `dad.newspaper`, `mom.tablet`, `grandma.knitting` set default arm angles — explicit `armL/armR` still win (props are placed at the resulting hands).
* Hand props in the back view go to the `'back'` layer (hidden behind the body), by design.
* Option state for the custom heads (hot-dog face, hairnet, apron, badge, shy) is passed through `looks6.STATE` during one draw call and reset right after — always draw through `draw.*` / `actor()`, never call the design functions directly.
