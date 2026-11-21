# Cube City game UI + FX kit — `scenes/gameui.js`

Everything the game itself draws on screen in "What If Your PARENTS Joined Your Roblox Server?": chat bubbles typed letter by
letter (Dad's CAPS LOCK), the chat window and its 50-reply flood, "joined the server" toasts, system banners, nametags, the
leaderboard billboard, coins / wins / level / timer HUD, the server-health bar, emotes and combat FX, the Block King's boss bar,
hex shield dome and crystal, party frames, VICTORY / MVP cards, the avatar shop, device frames, title cards and stamps.

Pure functions returning SVG strings, deterministic in their inputs (all "randomness" is `hash(seed)`).

```js
const G = require('./gameui');   // DEFS (ids gu*) are loaded by scenes/main.js automatically
const R = require('./respawn');  // the previous video's FX kit is still there (blockConfetti, crumble, sysWindow, flash...)
```

Contact sheets (look at them first): `concept/gameui.png` (four in-context shots) and `concept/gameui_chat.png`, `_hud`,
`_board`, `_fx`, `_motion` (time strips), `_boss`, `_results`, `_editor`, `_devices`, `_misc`. Rebuild: see the end.

## Ground rules

- **One original theme ("Cube City UI").** HUD overlays = **navy glass + teal rim** (`chatLog`, toasts, nametags, HUD pills,
  leaderboard). Menus / cards = **warm cream panels with a teal header** (avatar shop, keycaps, bubbles are white). Rewards =
  **gold** (victory, MVP, level). Alarms = **red + hazard stripes**. Boss = **purple**. The motif is the little isometric
  **cube** (`G.isoCube`, `G.cubeLogo`, the coin's emblem). Titles in Lilita One, UI in Fredoka 700/600. Palette: `G.P`.
  No Roblox logos, no Robux: Cube City has **coins** (`G.coinIcon`, gold disc with a cube).
- **Players & colours.** Known users get a fixed colour + portrait everywhere (`G.USERS`): YOU orange `#FF8A2B` (LVL 99,
  crown) · DadBod1978 mustard `#F2B705` (LVL 1) · MOM_OFFICIAL pink `#FF5FA8` · GrannyGoodies lilac `#B57BFF` · NoodleBoi
  teal `#17C3B2` · xX_DarkBlade_Xx red `#FF4B5C`. Unknown names get a stable colour from `G.userColor(name)`.
- **Units.** Plain screen px at `s: 1`, designed for the 1920×1080 frame. Draw HUD/screen-space UI **outside** your camera
  `view()`; draw world-attached UI (bubbles, nametags, hits, dome, crystal) inside it, at world coordinates.
- **Time.** Animated helpers take `k` (0..1 pop-in / progress, overshoot built in), `out` (0..1 leave), `age` (seconds since an
  event) and/or `t` (the clock: blinks, shimmer, bobbing). Derive them from the voice:
  `k: seg(t, L(id).a - 0.3, L(id).a)`, `age: t - L(id).word('MWAH').t0`. Never hard-code seconds — the voice gets re-timed.
- **Over a character.** `G.overHead(x, y, s, who)` → `{ head, tag, chat }` = head top, nametag centre and bubble tail tip for a
  cast actor standing at feet `(x, y)` with scale `s` (`who` = cast key: `'you' | 'dadAvatar' | 'momAvatar' | 'grandmaAvatar' |
  'noodle' | 'darkblade' | 'player' | 'noob' | 'kid' | 'dad' | 'mom' | 'grandma' | ...`, head tops in `G.HEAD_TOP`).
  Cast avatars draw their own small game tag; pass **`nametag: false`** in the actor pose when you use `G.nametag` (bigger,
  level chip, pops in) — or keep the built-in tag in wides and skip `G.nametag`.
- **Cost.** No filters, masks, blend modes or big radial gradients. ClipPaths only in scrolling lists, rolling digits, the MVP
  portrait and device screens. Every helper is < 1 ms of JS; see the perf table at the end.

---

## 1. Chat

### `G.chatBubble({ x, y, s, text, k, typed, caps, user, col, textCol, t, tail, out, maxW, size, dots, rot })`
Speech bubble over an avatar. `(x, y)` = the **tail tip** (use `overHead(...).chat`).
- `typed` 0..1 — letters shown (typewriter). The bubble is sized for the **whole** text so it doesn't jitter while typing;
  long text wraps at `maxW` (560 px, 620 caps). A blinking cursor (teal, red in caps) follows the last letter while `typed < 1`.
- `typed: 0` (or empty text) = the **"…" typing dots** bubble; the bubble grows into the full one on the first letters.
- `caps: true` — **Dad's CAPS LOCK**: upper-case Lilita One, every new letter stomps in bigger and the bubble jolts, a red
  `CAPS LOCK` tab with a blinking LED sits on the top-right corner.
- `k` 0..1 pops it in from the tail with overshoot + squash (~0.3 s); `out` 0..1 floats it up 60 px and fades.
- `user` — coloured name tab on the bubble's top-left (e.g. a random player's reply). `col` = bubble fill (default white).
- `tail` — `-1..1` where the tail sits along the bottom edge (0 centre, `-1` bubble extends right, `1` extends left),
  `false` = no tail (floating text box).

### `G.chatSync(t, lineId, { from, to, lead })` → typed 0..1
Letters follow the **spoken words** of a voice line: each word's letters appear between its `t0` and `t1`, the space after it at
`t1`, so a bubble whose text is the line's text types *exactly* along with the voice (works with Dad's pauses between
"HELLO SON." … "IT IS DAD."). `from`/`to` (word string or index) sync only part of the line (returns 0..1 over that part);
`lead` (s) types ahead (+) or behind (−) the voice.

### `G.chatLine(t, lineId, { hold = 1.6, pre = 0.3, text, ...chatSync opts })` → `{ text, typed, k, out }`
Everything for a bubble that speaks a voice line: pops in `pre` s before the first word, types with the voice, floats away
`hold` s after the line ends. Spread it into `chatBubble`.

### `G.chatLog({ x, y, w, h, lines, t, scroll, k, flood, floodSet, floodN, floodSeed, shake, input, send, title, s, size })`
The in-game chat window, `(x, y)` = top-left (bottom-left of the frame in game shots: e.g. `x: 30, y: 620, w: 600, h: 330`).
Newest message at the bottom, older ones scroll up and out (clipped).
- `lines: [{ user, text, col, at, sys }]` — `at` = arrival time (absolute s): the line slides in (0.22 s) with a flash; lines
  without `at` are always there. `sys: true` (or no `user`) = system line in mint with a cube bullet. `col` overrides colours.
- `scroll` — without `at`: how many lines are in (fractional = the last one sliding in).
- `flood` 0..1 — **the flood**: `floodN` (50) replies pour in after your lines, the window shakes and a red `+N` badge
  counts them. `floodSet`: `'spacebar'` (SC04 "Fifty players said SPACEBAR"), `'lol'` (SC07 jokes: LOL, XD, DAD JOKE!!),
  `'dad'` (SC07 "DAD!!", "best dad"), `'jump'` (SC11 chant), `'mix'`, or your own array of strings. Random usernames from
  `G.FLOOD_USERS`; `floodSeed` reshuffles.
- `input: { text, typed }` — the chat bar being typed (caps text is drawn in Lilita); `send` 0..1 = the Enter flash.
  Default shows "Press / to chat".

---

## 2. Server messages

### `G.joinToast({ x, y, k, out, user, text = 'joined the server', icon, who, col, t, s, anchor = 'right', size })`
"**DadBod1978** joined the server": navy glass card, the user's portrait with a green `+` badge that pops, the name in the
user's colour, a sheen sweep. `(x, y)` = the anchored edge's centre: `anchor 'right'` slides in from the right edge (default,
top-right stack), `'left'` from the left, `'center'` pops in place (big announcements). `icon` = a portrait key (`'dad'`,
`'cube'`…) or an svg for the 100-unit circle. ~0.35 s in.

### `G.joinStack(t, items, { x, y, gap = 116, hold = 4, dir = 1, s, anchor, size })`
A feed of toasts: `items: [{ user, at, text, hold, icon, col, who }]`; each enters at `at`, stays `hold` s, leaves, and the
others slide to close the gap. `dir 1` = newer below.

### `G.systemBanner({ k, out, text, theme, t, sub, x = 960, y = 190, w, s, size = 76 })`
Ribbon across the top of the frame. `theme`: `'info'` (teal, cube icons), `'party'` (purple, family heads — "Party formed:
"The Family""), `'alarm'` (red, hazard stripes top + bottom, blinking warning triangles, shake), `'victory'` (gold, stars,
spinning rays). `text` may hold `\n`: with 2+ lines the first is a 1.25× headline ("WARNING!"). `sub` = small line under it.
`k` unfurls it from the centre with overshoot (~0.5 s); `out` folds it away.

### `G.alarmEdges(t, k, { size = 190, rate = 3.2 })`
Pulsing red light on all four frame edges (cheap linear gradients). Pair with the alarm banner and the red screen (SC08→09).

---

## 3. Nametags

### `G.nametag({ x, y, s, who, name, level, col, crown, hp, portrait, k, t, bob, size = 34 })`
Floating name over an avatar: navy pill with a coloured rim and underline, white name, gold **LVL** chip, optional crown,
`hp` 0..1 bar under it, `portrait: true` adds the mini head. `who: 'you' | 'dad' | 'mom' | 'granny' | 'noodle' |
'darkblade'` fills name / level / colour / crown from the cast (YOU · LVL 99 + crown, DadBod1978 · LVL 1, MOM_OFFICIAL · 12,
GrannyGoodies · 7, NoodleBoi · 64, xX_DarkBlade_Xx · 88) — override any field (`level: 99, crown: true` on Mom at #1).
`(x, y)` = centre (`overHead(...).tag`). Bobs gently with `t` (`bob: false` to stop). `k` pops it.

---

## 4. Leaderboard

### `G.leaderboard({ rows, style, x, y, w, h, k, t, highlight, roll, title, unit, s, nShow, stand, lights })`
- `style: 'board'` (default) — the giant **in-world billboard**: navy frame with chasing marquee bulbs, gold `LEADERBOARD`
  plaque with crowns, RANK / PLAYER / WINS columns, medal badges for 1–3, portraits, names in user colours, crown on #1.
  `(x, y)` = centre, default 1100 × 860. `stand: true | px` adds two posts below it (SC01 "billboard in the night sky").
- `style: 'hud'` — compact top-right panel, `(x, y)` = its **top-right** corner (default 460 wide, `x: 1880, y: 40`). Long
  names are shrunk/ellipsised to fit.
- `rows: [{ rank, name, score, crown, from, scoreFrom, who, col, gold }]`, `highlight` = the name (or rank) to glow orange.
- **Rank changes:** give rows a `from` (old rank) and animate `roll` 0..1: rows slide from their old order to the new one,
  the rank number rolls (`#500 … #138 … #1`), a green ▲ shows on climbing rows, `scoreFrom` rolls the score. A row whose
  `from` is far beyond the board (`#500`) enters from below the bottom edge.
- `title` / `unit` (e.g. `'TOP TYCOONS'`, `'COINS'`), `nShow` rows (5).

### `G.rankClimb({ x, y, from = 500, to = 1, roll, k, t, s, name, label = 'RANK' })`
Big montage counter "#500 → #1": the number rolls with a pulsing green arrow; on #1 it turns gold with a crown and rays.

---

## 5. HUD

All pills share one look (`G.statPill`): navy glass, coloured rim, icon badge · LABEL · value; `anchor 'left' | 'right' |
'center'` = which edge `x` is; `k` slides/pops in from that side; `bump` 0..1 = elastic pop + sparkles (pass
`seg(t, tChange, tChange + 0.45)`); `roll` 0..1 + `from` = odometer digits (every column rolls when the one to its right
wraps).

| helper | use |
|---|---|
| `G.coinCounter({ x, y, value, roll, from, rocket, bump, k, t, s, anchor, label })` | coin pill. The hero's **12 coins**; Granny's money **skyrocketing**: `value: 9999999, from: 2, roll` + `rocket` 0..1 (green arrow, coins shooting up) |
| `G.winsCounter({ x, y, value, roll, from, bump, label = 'WINS' })` | trophy pill — "2,000" → "2,001" with `bump` on YOU's line |
| `G.timerHUD({ x = 960, y = 70, sec, text, label = 'TIME', hand, t, anchor = 'center' })` | stopwatch pill counting **up**, `H:MM:SS` ("3:12:45" walking into the wall; "2:47:00" SC07). Animate `sec` with t |
| `G.levelBadge({ x, y, level = 99, xp, bump, k, t, s, label = 'LVL' })` | gold hexagon "LVL 99" with an XP ring (`xp` 0..1) and a ray burst on `bump` |
| `G.serverHealth({ x = 960, y = 110, w = 1100, value, trail, hit, k, t, s, label })` | the big **SERVER HEALTH** bar: red fill, 10 % ticks, huge % readout, pale damage `trail` (old value) behind it, blinks + warning triangles under 30 %, `hit` 0..1 = white flash + shake |
| `G.statPill({ icon: svg, label, value, rim, col, ... })` | build your own (e.g. `icon: G.coinIcon(0, 0, 28)`) |
| `G.rollNum({ x, y, value, cur, size, col, anchor })` → `{ svg, w }` | the odometer number alone |

Also: `G.keycap({ x, y, w, h, label, press, led, size, k, t })` — a keyboard key (the **SPACEBAR** gag: `w: 520, label:
'SPACE'`; `label: 'CAPS LOCK', led: true`), `G.pointer(x, y, s, press, { hand })` — mouse cursor with click ripple.

---

## 6. Emotes + combat FX

| helper | what | duration |
|---|---|---|
| `G.emoteHearts({ x, y, age, n = 12, s, to: [x, y], spread, seed, life = 1.6 })` | hearts pop out and float up with a wobble — or, with `to`, fly in arcs to the target (the hero's face) and pop there. **Mom's air kiss** | ~1.8 s |
| `G.kissEmote({ x, y, age, s, to, text = 'MWAH!' })` | big puckering lips pop beside the mouth + "MWAH!" slams + a puff of hearts (to `to`) | ~1.8 s |
| `G.emoteWheel({ x, y, k, t, s, selected, press, items })` | the radial emote picker (wave · dance · laugh · kiss · cry · cheer), `selected` glows orange — "Mom found the emote button" | k ≈ 0.5 s |
| `G.danceNotes({ x, y, t, k, s, n = 5 })` | music notes bubbling up and swaying (Dad dancing for joy); continuous | loop |
| `G.slash({ x, y, age, angle, col, s, r = 170, dir, arc })` | anime crescent swoosh: coloured band, white core, speed lines, a spark at the tip. `angle` = direction the arc faces (deg), `dir` ±1 sweep | 0.34 s |
| `G.hitSpark({ x, y, age, s, col, seed, text })` | impact star + ring + flying chips; `text: 'POW!' / 'BONK!'` pops a word | 0.4–0.6 s |
| `G.damageNumber({ x, y, age, value, crit, heal, text, col, s, seed })` | "-25" pops, rises and drifts, fades; `crit`: bigger orange + "CRIT!" + star burst + shake; `heal`: green "+50"; `text: 'IMMUNE'` | 1 s |
| `G.koStars({ x, y, t, s, n = 4, r = 120, birds, k, text })` | dizzy stars + little cube birds orbiting the head (`(x, y)` = just above the head), `text: 'K.O.'` | loop |
| `G.knockoutFly({ x0, y0, age, dir, s, svg, cy, x1, y1, dur = 1.1, spin, arc })` | a player launched out of the arena: arcs up and away, shrinking + spinning with a puff trail, then a **twinkle star** "ping" at `(x1, y1)` (default `x0 + dir·760, 140`). `svg` = the character drawn with its feet at (0, 0) (`actor('darkblade', t, { x: 0, y: 0, s: .45, nametag: false })`, `cy` = its body centre above the feet, ~230 for s .45); default a generic noob | 1.1 + 0.7 s |
| `G.knockoutPath(age, opts)` → `{ x, y, sc, rot, u, gone }` | the same flight for your own drawing | |
| `G.comboText({ x, y, k, out, text = 'TRIPLE COMBO!', count, t, s, rot })` | gold lettering slams in from 2.6× and settles with shake, speed stripes, a red "3 HITS" chip | k ≈ 0.4 s |
| `G.swordRain({ t, age, n = 24, targets, x0, x1, y0, floorY, s, seed, dur = 0.8, stagger = 1.2 })` | golden swords rain down spinning; with `targets: [[x, y], ...]` (the hands) each lands upright **in a hand** with a glint and bounce; without, they stick in `floorY` | ~2 s |
| `G.potionPop({ x, y, age, s, col, text = '+HP' })` | a healing potion pops, wobbles, bursts into rising green crosses + "+HP" + ring | 1.4 s |
| `G.sword(x, y, s, rot)`, `G.potion(x, y, s, rot, col)`, `G.heart`, `G.crown`, `G.trophy`, `G.shieldIcon`, `G.lockIcon`, `G.clockIcon`, `G.serverIcon`, `G.coinIcon` | the drawings alone (props, pickups, icons) | |

---

## 7. Boss UI

### `G.bossBar({ name = 'THE BLOCK KING', value, shield, trail, hit, k, t, x = 960, y = 120, w = 1200, s, sub })`
Top-centre boss health bar: crowned name plate, boss portrait badge, purple→red fill with ticks, pale damage `trail`.
`shield` 0..1 = a cyan **hex overlay** with a moving sheen + a `SHIELD` lock chip (while shielded the % readout is hidden — the
bar is invulnerable), `hit` 0..1 = flash + shake, `sub` = small line under the bar ("DEFEATED... BY A HOT DOG?!").
`k` drops it in from the top.

### `G.shieldDome({ x, y, r, k, t, crack, shatter, hits, col = '#C77DFF', ry, crackAt, seed })`
The translucent **hex dome** around the boss — cheap (1 fill + 3 batched paths, ~110 cells precomputed on a sphere-warped
lattice). `(x, y)` = centre of its base on the ground, `r` = radius px (make it ≥ the boss height). A shimmer band sweeps the
cells; `hits: [{ x, y, age }]` (absolute px, age s) light the nearby cells and send a ripple — use it when swords bounce off
("My shield cannot break!"); `crack` 0..1 grows glowing cracks from the top (`crackAt: [x, y]`) and flickers above 0.6;
`shatter` 0..1 blows the cells outward and fades the dome (when the crystal breaks); `k` raises it from the ground with a flash.

### `G.crystal({ x, y, s, t, crack, k, glow, pedestal = true, beam, col, col2 })`
The glowing gem on top of the obby tower: a slowly turning faceted bipyramid (≈ 300 px tall at s 1, `(x, y)` = its centre),
soft glow, orbiting sparkles, stone pedestal, optional `beam` of light to the sky. `crack` 0..1 = light-leaking cracks (kept
inside the gem); above 0.6 it flickers and shakes.

### `G.crystalShatter({ x, y, age, s, burst = true, col, col2, seed })`
White core flash, ~30 gem shards flying out and falling, two shockwave rings and — `burst` — a **full-frame light burst**
(rays + white-out fading over ~1.2 s, drawn 8000 px big so it covers the frame inside any camera view). ~2 s.

### `G.bossCrumble({ x, y, w = 700, h = 900, s, age, seed, n = 40 })`
The Block King breaks apart: white flash over his body, ~40 stone cubes with purple glints burst out of the `w × h` region
above his feet `(x, y)` and tumble to the ground, then a gold ring and a big burst of colourful **cube confetti**
(`respawn.js` `blockConfetti`). Stop drawing the boss at `age 0`. ~3 s. Add `R.blockConfettiRain(t, { t0 })` for the sky.

---

## 8. Party + results

### `G.partyPanel({ x = 40, y = 220, members, k, t, s, title = 'PARTY · THE FAMILY', w = 470 })`
Party frames down the left side: a purple header with a heart, then one card per member: portrait, coloured name, a role chip
(`role: 'tank' | 'gear' | 'leader' | 'healer' | 'dps' | 'noob' | 'rogue'`), HP bar (`hp` 0..1 green→gold→red), `hit` 0..1 red
flash + shake, `heal` 0..1 green glow + plus. `members: [{ name, hp, role, who, col, gold, hit, heal }]` (default = The Family).
`k` slides the cards in one by one (~1 s for 4).

### `G.victoryCard({ k, out, t, x = 960, y = 400, s, title = 'VICTORY!', sub = 'SERVER SAVED' })`
Giant gold letters drop in one by one over crossed golden swords and spinning rays, a teal ribbon unfurls, twinkles.
k 0 → 1 ≈ 1.2 s. Pair with `systemBanner({ theme: 'victory' })` or confetti.

### `G.mvpCard({ name = 'DadBod1978', k, out, t, x = 960, y = 540, s, portrait, who, title = 'MVP', sub, stats })`
The MVP moment: a gold card **flips in** over spinning rays, the **MVP medal** pops on top, the portrait slot (circle r 175 on
the card's upper half), the orange name ribbon, "MOST VALUABLE PLAYER" and stat chips (`stats: [{ label: 'JUMPS', value:
'100' }, { label: 'CRYSTALS', value: '1' }]`). `portrait` = svg drawn around **(0, 0) = slot centre**, clipped to the circle —
the hot dog: `K.actor('dadAvatar', t, { x: 0, y: 390, s: 0.5, nametag: false, face: 'joy' })`. Default = the big cube
portrait. k 0 → 1 ≈ 1.4 s.

`G.ribbon(x, y, w, h, fill, text, size)` and `G.dropLetters(text, k, size, opts)` are the building blocks.

---

## 9. Avatar editor (SC03)

### `G.avatarEditor({ x = 960, y = 540, w = 1720, h = 940, s, k, t, tab, items, selected, hover, press, purchased, owned, preview, username, typed, nameOk, password, coins, bought, title = 'AVATAR SHOP', cols, rows, pointer })`
The character creator / shop, ≈ full frame at s 1:
- header: Cube City cube, title, coin balance (`coins`), close button.
- LEFT: a teal stage with spotlight and turntable — `preview` = svg with **feet at (0, 0) on the pedestal**, ~520 px of head
  room (`K.actor('dadAvatar', t, { x: 0, y: 0, s: 0.4, nametag: false })`); the **NAME** field typed letter by letter
  (`username`, `typed` 0..1, blinking cursor, "Pick a username" placeholder at 0, green check when done unless
  `nameOk: 0`) and an optional **PASS** field: `password: { text: 'password', typed, warn: 0..1 -> "WEAK!", show }`.
- RIGHT: tabs `G.TABS` (HATS FACES SHIRTS COSTUMES EXTRAS, `tab` highlighted) and a 4 × 2 grid of item cards: icon, name,
  coin price, orange **BUY** (or green OWNED for `owned: [ids]`). `items` = item objects or ids from `G.ITEMS`; default = the
  tab's items. COSTUMES: **HOT DOG SUIT**, Pizza, Banana, Dino Hoodie, Tutu Skirt, Gold Armor, Shark, Robot. HATS: top hat,
  cowboy, crown, propeller cap, chef, viking. FACES: shades, mustache, monocle, smile. EXTRAS: angel / dragon wings, cape,
  pot-lid shield, pearls, fur coat, golden cane. (`G.itemIcon(id, s)` draws any of them.)
- `selected` (id or index) = orange card, bouncing; `hover` = lifted; `press` 0..1 pushes its BUY; `purchased` 0..1 slams a
  green **PURCHASED!** stamp on it; `bought` = the number on the cart badge ("37 ITEMS IN CART" — Dad clicked everything).
- `pointer: { x, y, press, hand }` in **absolute** px. Aim it with `G.editorCard(sameOpts, idOrIndex)` → `{ x, y, bx, by }`
  (card centre, its BUY button).

---

## 10. Device frames

### `G.deviceFrame({ type, x, y, s, screen, glow, glowCol, k, t, rot, sticker, base, landscape, col })`
A device **showing game footage**, for UI-style / full-screen shots and transitions (zoom into a screen → cut to Cube City).
`(x, y)` = the **screen centre**. Screen sizes at s 1 (`G.deviceSize(type, landscape)`):

| type | screen | look |
|---|---|---|
| `laptopOld` | 960 × 600 | Dad's ancient grey laptop: thick bezel, webcam, "#1 DAD" star sticker (`sticker`), keyboard deck (`base: false` hides it), faint scanlines |
| `tablet` | 1000 × 690 | Mom's tablet in a teal case (`col`) |
| `phone` | 380 × 790 | Granny's phone in a pink case (`col`); `landscape: true` → 790 × 380 |
| `pc` | 1120 × 630 | the hero's gaming monitor: thin bezel, cycling RGB strip, stand |

`screen` = an svg authored for **1920 × 1080** (scaled to cover the screen and cropped — pass your Cube City world straight in)
or a function `(w, h) => svg` in screen px (0,0 = top-left; e.g. Granny's voice-typing text box). `glow` 0..1 = soft light
around it, `k` 0..1 = power on (CRT line for laptop/pc, fade for tablet/phone). The devices characters **hold** in the
living room are the cast's props (`rig/extras.js` `laptopOld / tablet / phone / gamingPC`, see docs/CAST.md) — same colours.

### `G.screenGlow(x, y, w, h, col = 'blue', k, { flicker, t })`
Cheap face-light: draw **over** a character's face (w × h ≤ ~600 px). `col 'blue' | 'warm' | 'red' | 'purple' | 'green' |
'white'` = a soft static radial gradient; a hex colour = three nested flat ellipses. `flicker: true` + `t` for TV flicker.

---

## 11. Misc

| helper | what |
|---|---|
| `G.bigTitle({ text, k, out, t, theme, sub, x, y, s, size = 180, rays, stagger })` | title-card lettering: letters drop in one by one and keep a gentle wave; `sub` ribbon; themes `'gold'` ("FAMILY GAME NIGHT"), `'retro'` (chrome + neon: "ARCADE QUEEN" / "STATE CHAMPION 1998"), `'teal'` (Cube City), `'night'` (THE BLOCK KING), `'alarm'`. `text` may hold `\n` |
| `G.stamp({ text = 'SOLD', k, out, x, y, s, rot = -12, col, size })` | rubber stamp slam: drops from 2.4×, slams, ink splats + shake, worn specks, double border — "SOLD" on the castle gate, "MVP", "TONIGHT", "PURCHASED!" |
| `G.tumbleweed({ x, y, s, t, rot, k, dust, dir })` | a tumbleweed made of little cubes: `(x, y)` = ground point; it rolls as you move `x` (or set `rot`), bounces with `t`, dust puffs (the awkward-silence beat after DarkBlade's line) |
| `G.wallet({ x, y, s, k, t, coins = 12, moth })` | the hero's wallet: `k` opens the flap and pops "12 COINS"; `moth` 0..1 = a moth flutters out ("You had twelve coins.") |
| `G.cubeLogo(x, y, s, { text = 'CUBE CITY', k })` | the game's logo |
| `G.portrait(who, x, y, r, { col, gold })` | mini head in a circle: `'you' 'dad' (hot dog) 'mom' (gold: armour helmet) 'granny' 'noodle' 'darkblade' 'kid' 'boss' 'cube'`, or null + `col` |
| `G.rewind`, `G.rewindT`, `G.flash`, `G.blockConfetti`, `G.blockConfettiRain`, `G.lightning` | re-exported from `respawn.js` (same API — /home/user/animation/respawn/docs/FX.md) |

---

## Recipes

**Dad's caps-lock typing synced to his voice (SC04 `04.2`, `04.12`).**
```js
const l = L('04.2');                                   // "HELLO SON. IT IS DAD. LOVE, DAD."
const oh = G.overHead(hx, hy, hs, 'dadAvatar');
w += actor('dadAvatar', t, { x: hx, y: hy, s: hs, nametag: false });
w += G.nametag({ who: 'dad', x: hx, y: oh.tag, t, s: 0.9 });
w += G.chatBubble({ x: hx, y: oh.chat, caps: true, t, ...G.chatLine(t, '04.2') });   // pops 0.3 s early, types with the words
// cut to the real Dad at the laptop: same text in the chat bar
o += G.chatLog({ x: 30, y: 620, w: 600, h: 330, t, lines, input: { text: l.text, typed: G.chatSync(t, '04.2') } });
// keyboard insert shot: G.keycap({ label: 'CAPS LOCK', led: true, press: bump(t, w0, w0 + 0.15) })
```
`04.12` "DEAR EVERYONE. WHERE IS THE JUMP BUTTON." works the same; send it to the log at the end:
`lines.push({ user: 'DadBod1978', text: L('04.12').text, at: L('04.12').b + 0.1 })` + `send: seg(t, L('04.12').b, L('04.12').b + 0.3)`.

**Join-toast stack synced to SYSTEM `04.0`.**
```js
const l = L('04.0');
o += G.joinStack(t, [
  { user: 'DadBod1978', at: l.word('DadBod1978').t0 - 0.1 },
  { user: 'MOM_OFFICIAL', at: l.word('MOM_OFFICIAL').t0 - 0.1 },
  { user: 'GrannyGoodies', at: l.word('GrannyGoodies').t0 - 0.1 },
], { x: 1880, y: 90, hold: 6 });
// in the world: R.respawnPop / a pop at each spawn on the same word times
```
For a single big centred announcement (SC12 "DarkBlade's mom joined the server") use
`G.joinToast({ x: 960, y: 200, anchor: 'center', s: 1.4, user: "DarkBlade's mom", who: 'mom', col: '#FF9AE0', k, out })` or
`G.systemBanner({ theme: 'info', text: "DarkBlade's mom joined the server", k })`.

**Chat flood (SC04 `04.13` "Fifty players answered… SPACEBAR").**
```js
const l = L('04.13');
const flood = seg(t, l.word('answered').t0, l.word('SPACEBAR').t1);     // 50 replies in ~4 s
o += G.chatLog({ x: 30, y: 560, w: 640, h: 420, t, lines: [{ user: 'DadBod1978', text: L('04.12').text }], flood, floodSet: 'spacebar' });
// smash-zoom: draw it again at s 1.6 for the punch on "SPACEBAR"; over-head bubbles for 3–4 near players with user tabs
```
SC07 jokes: `floodSet: 'lol'` on the punchline; "the whole server was calling him Dad": `'dad'`; SC11 chant: `'jump'`.

**Leaderboard climb (SC05 `05.8` "Ten minutes later… number one").** One board, three `roll` phases (#500 → #50 → #1):
```js
const l = L('05.8'), a = l.word('minutes').t0, b = l.word('one').t1;
const ph = seg(t, a, b) < 0.5 ? 0 : 1;                       // phase 0: 500 -> 50, phase 1: 50 -> 1
const roll = ph ? seg(t, lerp(a, b, 0.5), b) : seg(t, a, lerp(a, b, 0.5));
const rows = ph
  ? [{ rank: 1, from: 50, name: 'MOM_OFFICIAL', score: 2104 }, { rank: 2, from: 1, name: 'YOU', score: 2001 }, { rank: 3, from: 2, name: 'xX_DarkBlade_Xx', score: 1530 }, ...]
  : [{ rank: 48, from: 47, name: 'LavaLord', score: 120 }, { rank: 49, from: 48, ... }, { rank: 50, from: 500, name: 'MOM_OFFICIAL', score: 118, scoreFrom: 3 }];
o += G.leaderboard({ rows, highlight: 'MOM_OFFICIAL', roll, t });
o += G.rankClimb({ x: 1500, y: 300, from: ph ? 50 : 500, to: ph ? 1 : 50, roll, t, s: 0.6, name: 'MOM_OFFICIAL' });
```
SC01 opener: the same board standing in the night sky (`stand: 300`, inside the camera view). SC08 "#47 YOU": hud style,
`highlight: 'YOU'`.

**Granny's money (SC06 `06.2`).** `G.coinCounter({ value: 9999999, from: 2, roll: seg(t, L('06.2').a, L('06.2').b + 1), rocket: 1, t })`
top-left while the bakery grows; then `stamp({ text: 'SOLD' })` on the castle gate at "bought", and the hero's
`G.wallet({ k, moth })` + `G.coinCounter({ value: 12 })` on "You had twelve coins".

**Boss fight HUD (SC08 end → SC10).**
```js
// SC08 08.13 alarm
o += G.alarmEdges(t, seg(t, L('08.13').a - 0.2, L('08.13').a)) + G.systemBanner({ theme: 'alarm', text: 'WARNING!\nThe Block King has awakened!', sub: 'If the server falls... everything resets!', k: seg(t, L('08.13').a - 0.2, L('08.13').a + 0.3), t });
// SC09 09.6 "Ninety percent. Fifty. Twenty." — the bar drops on each word, damage trail lags 0.4 s
const l = L('09.6'), steps = [[l.word('Ninety').t0, 0.9], [l.word('Fifty').t0, 0.5], [l.word('Twenty').t0, 0.2]];
const valAt = (tt) => steps.reduce((v, [w, x]) => (tt >= w ? x : v), 1);
o += G.serverHealth({ value: valAt(t), trail: valAt(t - 0.4), hit: Math.max(...steps.map(([w]) => (t >= w && t < w + 0.4 ? (t - w) / 0.4 : 0))), t });
// SC10 fight: world = boss + dome (+ hits when swords land), HUD = boss bar + party + server health small
w += actor('boss', t, { ... }) + G.shieldDome({ x: bx, y: groundY, r: 640, t, hits, crack });
o += G.bossBar({ value: 0.94, shield: 1, t, sub: 'SHIELD UP · BREAK THE CRYSTAL' }) + G.partyPanel({ k: seg(t, L('10.0').a, L('10.0').a + 1.2), t, members });
o += G.systemBanner({ theme: 'party', text: 'Party formed: "The Family"', k: seg(t, L('10.0').a - 0.1, L('10.0').a + 0.4), out: seg(t, L('10.0').b + 1.2, L('10.0').b + 1.6), t });
// 10.2 "Swords for everyone!" — hands of everyone visible: G.swordRain({ age: t - L('10.2').word('Swords').t0, targets: hands, t })
// 10.7 potions: a few G.potionPop at staggered ages + partyPanel members' heal
// 10.9 "FOOLS! My shield cannot break!": slash + hitSpark at the dome edge + hits ripple + damageNumber({ text: 'IMMUNE' })
```

**The jump and the MVP moment (SC11).**
```js
w += G.crystal({ x: cx, y: cy, s: 0.8, t, beam: true, crack: seg(t, tLand, tHit) });       // cracks while Dad climbs up
w += G.crystalShatter({ x: cx, y: cy, age: t - tHit });                                       // the full-frame light at the hit
w += G.shieldDome({ ..., shatter: seg(t, tHit + 0.1, tHit + 0.9) });                          // the dome goes with it
w += G.bossCrumble({ x: bx, y: groundY, w: 800, h: 1100, age: t - L('11.9').b - 0.3 });       // after "...by a HOT DOG?!"
o += G.bossBar({ value: lerp(1, 0, seg(t, tHit, tHit + 0.6)), trail: 1, t, k: 1 - seg(t, L('11.10').a, L('11.10').a + 0.3) });
o += G.victoryCard({ k: seg(t, L('11.10').a - 0.1, L('11.10').a + 1.1), out: seg(t, L('11.10').b + 1.5, L('11.10').b + 1.9), t })
   + R.blockConfettiRain(t, { t0: L('11.10').a });
o += G.mvpCard({ k: seg(t, L('11.14').a - 0.2, L('11.14').a + 1.2), t, portrait: actor('dadAvatar', t, { x: 0, y: 390, s: 0.5, nametag: false, face: 'joy' }) });
// or in-world: nametag({ who: 'dad', crown: true }) + stamp({ text: 'MVP' }) + chatLog flood 'dad'
```

**Mom's air kiss (SC04 `04.6`).** `G.kissEmote({ x: mouthX + 60, y: mouthY, age: t - L('04.6').word('Mwah').t0, to: [heroFaceX, heroFaceY] })`
— plus `G.emoteWheel({ k, selected: 'kiss', press })` on "Then Mom found the emote button" (04.5), and a blush on the hero.

**Arena (SC05).** `slash` on each hit word + `hitSpark` 0.05 s later at the contact point + `damageNumber` (crit on the last),
`comboText({ count: 3 })` on the third, `koStars` over the loser. DarkBlade's exit: `knockoutFly({ svg: actor('darkblade', t,
{ x: 0, y: 0, s, nametag: false }), cy: 510 * s, age: t - tPunch, dir: 1 })` — the twinkle lands on "Good game!".

## Timing tips

| effect | sweet spot |
|---|---|
| chatBubble pop / leave | `k` over 0.3 s just before the first word; `out` 0.35 s, 1.2–2 s after the line |
| typing | `chatSync` (voice) — or ~12–18 letters/s for silent typing; Dad's caps: sync to the voice, he says it while typing |
| joinToast | in 0.35–0.4 s, hold 3–6 s, out 0.35 s; stack gap ≈ 110 px at s 1 |
| systemBanner | k over 0.5–0.7 s, hold ≥ 1.5 s, out 0.3 s |
| leaderboard roll | 0.8–1.5 s per phase (rank numbers roll ease-out) |
| odometer roll | 0.6–2 s; bump 0.45 s on single increments |
| slash → hitSpark → damage | 0, +0.05, +0.08 s; slash 0.34 s; spark 0.4 s; number 1 s |
| knockoutFly | 1.1 s flight + 0.7 s twinkle |
| emoteHearts / kissEmote | 1.6–1.8 s |
| swordRain | stagger 1.2 s, each falls 0.8 s |
| crystalShatter | light peaks at 0.06 s, gone ~1.3 s; shards to ~2 s |
| bossCrumble | flash 0.2 s, cubes land ~1 s, confetti burst at 0.35 s, gone ~3 s |
| victoryCard / mvpCard | 1.2 s / 1.4 s in |
| stamp | 0.5 s (slam at 0.3) |

## Performance (`node tools/gameui_sheet.js --perf`)

Each helper alone on a flat frame; JS = build time per call, svg = Chromium render minus the empty frame (≈ 34 ms; the
screenshot timer ticks in ~16 ms steps, so 0–16 means "below one tick").

| helper | elems | JS ms | svg ms |
|---|---:|---:|---:|
| chatBubble caps typing | 13 | 0.08 | 0–12 |
| chatLog 5 lines + input / flood .6 | 26 / 31 | 0.14 | 0–14 |
| joinStack ×3 | 71 | 0.18 | 0–14 |
| systemBanner alarm + edges | 28 | 0.06 | 0–15 |
| nametag ×6 | 60 | 0.17 | 0 |
| leaderboard board rolling / hud | 106 / 44 | 0.33 / 0.09 | 11–13 / 0–14 |
| coinCounter rolling + rocket | 106 | 0.27 | 0 |
| serverHealth low | 29 | 0.06 | 0–4 |
| emoteHearts 12 + kissEmote | 55 | 0.11 | 0–15 |
| slash + hitSpark + damage crit | 16 | 0.13 | 0–21 |
| swordRain 24 | 122 | 0.32 | 0–18 |
| bossBar shield | 42 | 0.07 | 0–19 |
| shieldDome r 640 + hits / shatter .3 | 9 / 39 | 0.26 / 0.14 | 13 / 2–17 |
| crystal + beam + crack | 18 | 0.06 | 0 |
| crystalShatter .1 (full-frame) | 36 | 0.05 | 16 |
| bossCrumble .5 | 237 | 0.32 | 15 |
| partyPanel ×4 | 128 | 0.20 | 0–14 |
| victoryCard / mvpCard | 49 / 48 | 0.20 / 0.11 | 15 / 16–18 |
| avatarEditor full | 274 | 0.58 | 19–25 |
| deviceFrame laptopOld | 21 | 0.11 | 16–22 |
| bigTitle retro | 68 | 0.15 | 16–18 |
| **composed: lobby (3 cast actors + bubble + tags + toasts + chat log + hearts)** | 541 | 9 | **78 total** |
| **composed: arena (3 actors + leaderboard + combo + hits + KO)** | 462 | 9 | **75 total** |
| **composed: boss fight (boss + hero + dome + bars + party)** | 550 | 4 | **67 total** |

Budget hints: a device frame with a whole world in its screen costs that world once more — keep the inner world light (no
crowds) or render the screen at a lower detail. `knockoutFly` / `mvpCard` with an actor `svg` cost one actor each.
`chatLog` only renders the ~10 visible messages even in a 50-message flood.

## Contact sheets

```bash
node tools/gameui_sheet.js                              # all sheets -> concept/gameui.png + concept/gameui_<sheet>.png
node tools/gameui_sheet.js --sheet chat,boss            # only some sheets (overview chat hud board fx motion boss results editor devices misc)
node tools/gameui_sheet.js --only chat_,dome --full DIR # some tiles; full-size PNGs into DIR (+ --out FILE for the grid)
node tools/gameui_sheet.js --perf                       # the perf table above
```
