# Reality HUD v1.0 — `scenes/hud.js`

The signature visual device of "What If You Could See Everyone's STATS in Real Life?": the game overlay the hero sees over the
real world after the update. Stat plates over heads (name, LV, animated bars, status tags, BOSS variant), the hero's "???" that
finally becomes **BIG BROTHER**, item tooltips over objects, the LIE meter, quest markers / toasts / QUEST COMPLETE / the quest
arrow, the hero's XP bar, +XP pops, LEVEL UP, FRIENDSHIP ±, the update window with its 4,812-page terms, the LOADING REALITY
boot, the persistent HUD frame (with the tiny X nobody noticed), the SC08 numbers flood, HUD glitch, the X → glass shatter, and
montage helpers (SORT BY STRENGTH, the INT 95 vs LV 4 card, the EPIC QUEST card).

Pure functions returning SVG strings, deterministic in their inputs (all "randomness" is `hash(seed)`).

```js
const H = require('./hud');      // DEFS (ids hd*) are loaded by scenes/main.js automatically
```

Contact sheets (look at them first): `concept/hud.png` (four in-context shots across the story), `concept/hud_plates.png`,
`hud_objects.png`, `hud_quests.png`, `hud_xp.png`, `hud_system.png`, `hud_overload.png`, `hud_montage.png`, `hud_motion.png`
(time strips: plate pop-in, Tank's tags, the BIG BROTHER reveal, QUEST COMPLETE, the −50 heart, the LIE meter).
Rebuild: `node tools/hud_sheet.js` (see the end).

## Ground rules

- **The look.** Translucent ink-blue glass with faint scanlines, a thin bright **cyan inner rim**, a dark outer edge (readable
  on any background), corners **cut** at top-left + bottom-right and **AR target brackets** on the other two corners. Bars are
  **slanted and segmented** into cells. A thin **tether + diamond pin** ties every plate / tooltip to what it describes. Names and
  numbers in Lilita One, labels in Fredoka 700 letter-spaced caps. Every panel opens like a hologram (a bright line grows wide,
  then opens tall, with a white tick-flash) — that's the "pop".
- **Themes** (`H.TH`, any `theme:` option; or pass your own object): `cyan` (default) · `boss` (red, Mrs. Krump / Tank's boss
  fight) · `gold` (quests, XP, rewards) · `warm` (only the BIG BROTHER payoff) · `cold` (SC07 obsession — desaturated steel) ·
  `error` (magenta glitch, Biscuit) · `pet` (pink) · `green` (OK / picked) · `warn` (amber).
- **Colour script.** SC03–SC06: cyan, gold rewards. SC07: pass `theme: 'cold'` to plates (they get colder as he gets colder).
  SC08: cyan → glitch / error. SC09: the X → shatter. **SC10 and SC11: NO HUD at all** (except the one-second check of
  Benji's `benjiBest` plate at the end of SC11). SC12: pet stats + the warm BIG BROTHER.
- **Units.** Plain screen px at `s: 1`, designed for the 1920×1080 frame. A plate at `s: 1` is ≈ 300–460 px wide; over a hero
  at actor `s: 0.5` use plate `s: 0.8–1.0`, in close-ups 1.2–1.6. Draw HUD **outside** your camera `view()` in screen space
  when you want it crisp and constant-size (compute the head's screen point yourself), or **inside** it at world coords to
  have it zoom with the camera (strokes scale too — fine for push-ins).
- **Anchors.** Over-head helpers (`statPlate`, `miniPlate`, `heroPlate`, `lieMeter`) take `(x, y)` = **the top of the head**;
  the plate floats `lift` px above with its tether. `H.overHead(who, x, y, s, dy)` → `{ x, y }` from an actor's feet and scale.
  Its head-top table `H.HEAD_TOP` is **approximate** (the stats cast was drawn in parallel; `you` is measured, 960 body units):
  use the head anchors in `docs/CAST.md` when that exists, or pass `dy` / your own y.
- **Time.** Animated helpers take `k` (0..1 pop-in / progress, overshoot built in; running `k` back to 0 folds them away), `out`
  or `fade` (0..1 leave), `age` (seconds since an event) and/or `t` (the clock: bob, blink, sheen, radar sweep). Derive them from
  the voice: `k: seg(t, L(id).word('Hungry').t0 - 0.1, L(id).word('Hungry').t0 + 0.35)`, `age: t - L('05.8').a`.
  Never hard-code seconds.
- **Draw order.** world → characters → world-attached HUD (plates, tooltips, markers, pops) → `numbersFlood` → `hudFrame` →
  screen pop-ups (`systemMsg`, `questToast`, `questComplete`, `levelUp`) → `xpBar` (last, bottom strip). Captions are drawn
  by `main.js` on top of everything (y ≈ 1010) — the XP bar sits under their baseline, everything else should stay above
  y ≈ 940 or move the captions with `captionY`.
- **Cost.** No filters, masks, blend modes; no gradient fills except a tiny sheen band (gradient fills cost ≈ 0.08 ms per
  1000 px in this renderer — glows are stacked translucent ellipses). One clipPath in the update window's terms box, one per
  shard in `hudShatter({ svg })`. See the perf table at the end.

---

## 1. Stat plates

### `H.statPlate({ x, y, s, k, t, name, level, title, bars, tags, tagsK, boss, crown, theme, glitch, fade, error, lift, w, bob, tether, sheen, nameSize })`

| option | meaning |
|---|---|
| `x, y` | **head top** (tether pin). The plate floats `lift` px above (default 34, + tag rows) |
| `k` | 0..1 pop-in (~0.5 s): tether grows (0–0.3), the panel unfolds (0.12–0.62), name types in with a cursor, LV badge pops, bars **fill and the numbers count up** (0.5–1), tags slap in. `k` falling back to 0 = fold away |
| `name`, `level` | `'MOM'`, `38` (any string: `'???'`, `1000`) |
| `title` | small second line under the name (`'LEGEND (RETIRED)'`, `'SECRET SKILL: MYSTERY MEAT'`). With `boss` it becomes the red **banner** on the top edge (default `'FINAL BOSS'`) |
| `bars` | `[{ label, value, max = 100, col, from, roll, trail, fmt, text, blink, bump }]` — see below |
| `tags` | `['HUNGRY', 'TIRED', { text: 'LONELY', col, k }]` stickers slapped onto the bottom edge (scale 2.3 → 1, rotation settles, white impact flash + ticks). Colours by name (`H.TAG_COL`). Each tag's progress: its own `k`, else `tagsK` (a running count: tag *i* slaps while `tagsK` goes *i* → *i*+1), else they follow the plate's `k` one by one |
| `boss` | red theme, pulsing red aura, horns, banner with skulls ("FINAL BOSS") |
| `crown` | gold crown on the LV badge (Grandpa, Biscuit) |
| `theme` | see Themes (`'cold'` for SC07) |
| `glitch` | 0..1 jitter + RGB split + scrambled name / LV / values (SC08) |
| `fade` | 0..1 — emotional beats: fades + drifts up + shrinks a little; 1 = gone |
| `error` | `'ERROR: TOO GOOD'` — magenta error plate: blinking warning, "STATS FAILED TO LOAD", spinner, periodic glitch spikes (Biscuit, SC03) |
| `t` | clock: bob (`bob: false` stops it), sheen sweep every ~4.6 s, blinking |

**Bars.** `label` picks the colour (`H.BAR_COL`: HP green, ENERGY yellow, CHAOS magenta, PATIENCE orange, STR orange, INT blue,
GOOD BOY pink, BEST FRIEND gold …) and the number format: `HP` → `3/100`, `ENERGY` / `PATIENCE` / … → `2%`, others → `9999`.
`fmt: 'frac' | 'pct' | 'num'`, or `text` to print anything (`'MAX'`). `value: Infinity` (or `'∞'`) = a full shimmering bar with a
drawn ∞ sign (the fonts have no ∞ glyph — `H.richText` draws it inside any string). `value > max` = **overflow**: full bar, cells
flicker white, sparks fly off the top, the number shakes (CHAOS 9999). **Low values blink red** (≤ 12 %, follows the rolling
value; `blink: false` to stop, `true` to force) with a ⚠ by the number; any non-zero value keeps a visible sliver.
**Rolling:** `{ value: 40, from: 3, roll: 0..1 }` — heal: a white ghost leads, the fill follows, the number counts and pops;
damage (`value < from`): the fill drops fast, a white/red trail drains after it. `trail` = a static old value. `bump` 0..1 =
pop the number.

### `H.plateFor(who, overrides)` — the cast presets

| `who` | plate |
|---|---|
| `mom` | MOM · LV 38 · ENERGY 2 % (blinking red) |
| `grandpa` | GRANDPA LOU · LV 87 · "LEGEND (RETIRED)" · crown · STR 79 |
| `max` | MAX · LV 5 · CHAOS 9999 (overflow) · HP ∞ |
| `benji` | BENJI · LV 4 · HP 100/100 · tag CLUMSY |
| `benjiBest` | BENJI · LV 4 · BEST FRIEND: **MAX** (gold, SC11) |
| `tank` | TANK · LV 80 · HP 3/100 (blinking) · HUNGRY · TIRED · LONELY |
| `teacher` / `krump` | MRS. KRUMP · LV 99 · FINAL BOSS banner · PATIENCE 0 % |
| `biscuitError` | BISCUIT · LV ??? · ERROR: TOO GOOD (SC03) |
| `biscuit` | BISCUIT · LV 1000 · crown · GOOD BOY ∞ (pink, SC12) |
| `lunchLady` | LUNCH LADY · LV 50 · "SECRET SKILL: MYSTERY MEAT" |
| `smartKid` / `quietKid` / `mrsWells` | INT 95 · STR 85 · LV 71 extras |
| `you` | → `heroPlate(overrides)` |

Overrides are merged (`bars` / `tags` replace the preset's): `H.plateFor('mom', { x, y, s: .9, k, t, bars: [{ label: 'ENERGY', value: 6, from: 2, roll }] })`.
`H.PRESETS` holds the data.

### `H.miniPlate({ x, y, s, k, t, name, level, hp, col, theme, glitch, fade, tether })`
Compact `[LV 12] NAME` + thin bar for crowds (SC01 hallway, SC04 yard, SC08 "a sea of numbers"). ≈ 150–230 px at s 1, cheap
(≈ 0.05 ms JS). `hp` 0..1 (< 0.12 blinks red). Stagger `k` per person for a wave of plates popping on.

### `H.heroPlate({ x, y, s, t, k, reveal, fade, lift, text = 'BIG BROTHER' })`
Over the hero. `reveal 0`: **"???"** — LV ??, three bobbing question marks that flicker into junk glyphs, "SELF-SCAN: NO DATA",
static in a loader and a spinner that never finishes (SC01 mirror, every HUD shot). `reveal` 0.1–0.45: the ??? scramble harder
and dissolve while the glass warms from cyan to honey; 0.45–0.6 a soft flash, the panel becomes **rounded warm glass** (no
brackets, no cut corners), a heart badge pops; 0.5–0.9 **BIG BROTHER** fades in letter by letter (rising, settling); warm
glow + golden motes drift up; the heart beats. No level, no numbers. Give the whole reveal **3–4 s** (see the recipe).

### `H.overHead(who, x, y, s = 0.5, dy = 0)` → `{ x, y }`
Head-top point for an actor drawn with feet `(x, y)` and scale `s` (`who` a cast key or a number = body-unit height).

---

## 2. Objects

### `H.tooltip({ x, y, k, t, s, title, lines, rarity, pointer = true, side = 'up', dist = 64, dx, dy, theme, level, hp, w, out, bob })`
Item tooltip over an object. `(x, y)` = **the point on the object**: a pulsing ring + dot pin there, a leader line (with an elbow
when `dx`/`dy` shift the card) to the card, which floats `dist` px away on `side` (`'up' | 'down' | 'left' | 'right'`).
Card: rarity stripe on the left edge, title in the rarity colour, rarity chip (COMMON · UNCOMMON · RARE · EPIC · LEGENDARY ·
??? · CURSED · ENEMY · BOSS), separator, then `lines`:
- strings — signed numbers are found and coloured: `'COMFORT +50'`, `'+1% ENERGY'`, `'−50 FUN'` (+ green, − red, `80%` amber);
- objects `{ label, value, col }` — label in Fredoka, value in big Lilita (`{ label: 'DIFFICULTY:', value: 'IMPOSSIBLE', col: '#FF3355' }`).

`rarity: 'enemy' | 'boss'` → red card with a skull, `level` badge and `hp` (0..1) mini bar (the alarm clock).
`k` (~0.5 s): pin pops, leader draws, card unfolds from the leader, lines slide in one by one. `out` fades it up.

### `H.tipFor(key, overrides)` — presets (`H.TIPS`)
`bed` COMFORT +50 (rare) · `sock` SMELL +99 (cursed) · `alarm` ALARM CLOCK · LV 1 · **ENEMY** · `toaster` BURN CHANCE 80% ·
`toast` BURNT 100% · `coffee` +1% ENERGY · `pizza` +20 HAPPINESS (epic) · `broccoli` +50 HEALTH / −50 FUN · `mysteryMeat` ???
(mystery) · `quiz` POP QUIZ · DIFFICULTY: IMPOSSIBLE (boss) · `homework` EATEN BY DOG: 0% · `pillow` · `cereal` SPLASH +80 ·
`glasses` GRANDPA'S GLASSES · LOCATION: HIS HEAD (legendary) · `ball` STUCK IN TREE: YES · `sandwich` +37 HP.

### `H.lieMeter({ x, y, s, k, t, value = 99, label = 'LIE', lift, fade, theme })`
Over a head (`(x, y)` = head top). "LIE DETECTOR" panel: a green→red segmented gauge, a needle and a "LIE: 99%" readout.
`k` 0..1 (~1.2 s): unfolds (0.1–0.5), the needle **whips around elastically and the digits spin** (0.3–0.85), then LOCKS at
`value` (0.85–1): the number pops, and for `value ≥ 70` the panel blinks red with siren lights and a red **LIAR!** stamp slams on.

---

## 3. Quests

| helper | what |
|---|---|
| `H.questMarker({ x, y, s, t, kind = '!' \| '?', k, col, reward, glow, seed })` | the floating quest glyph over a head (`(x, y)` = head top; it hovers ~30 px above): chunky drawn **!** (or a Lilita **?**) in gold with a soft glow, bobbing and turning, a ground ring pulsing, a twinkle. `k` drops it in with a bounce. `reward: '+2 XP'` = a small chip beside it (the old lady "+2 XP", "Help Mom · +5 XP"). Tank's "tiny question mark": `kind: '?', s: 0.45`. `col: '#C9D3DD'` = unavailable grey |
| `H.questToast({ k, t, title = 'Find Max', sub, reward, kind = 'new' \| 'update' \| 'failed' \| 'complete', x = 960, y = 150, s, out, glitch, head, theme })` | the quest banner (gold glass): diamond icon (! / ✓ / ✕), header "NEW QUEST" / "QUEST UPDATED" / "QUEST FAILED" / "QUEST COMPLETE", the title types in, the reward chip pops. Drops from the top (`k` ~0.6 s), `out` lifts away. `glitch` for SC08 ("Location... unknown") |
| `H.questComplete({ k, t, reward = '+50 XP', title, x = 960, y = 330, s, out, epic, sub })` | **QUEST COMPLETE!** — gold rays, shockwave, the banner unfolds, a hex medal with a check that draws on, letters drop in one by one (0.22–0.6), then the reward chip **slams** under it and counts up (0.55–0.95): `'+37 HP'` green with a heart, `'+50 XP'` gold with a star. `epic: true` = purple "EPIC QUEST COMPLETE!" with more rays. k 0 → 1 ≈ 1.2 s |
| `H.questArrow({ x, y, angle = -90, t, glitch, k, s, label = 'FIND MAX', dist = '120 m', col, unknown })` | a navigation chevron lying on a ground ring around `(x, y)` (the hero's feet), pointing at screen angle `angle` (0 = right, −90 = away), label pill under it. `glitch` 0..1: it **spins wildly** with jerks, flickers red, the label scrambles to "LOCATION: UNKNOWN · ??? m" |
| `H.epicQuest({ k, t, title, reward = '+100 XP', x = 960, y = 300, s, out, stars = 5 })` / `H.pillowFort(o)` | the purple-gold **EPIC QUEST** offer card (title wraps into balanced lines, DIFFICULTY stars pop, reward chip). `pillowFort` = "BUILD THE BIGGEST PILLOW FORT EVER" · +100 XP |

---

## 4. The hero's XP

| helper | what |
|---|---|
| `H.xpBar({ x = 960, y = 1050, w = 1640, value, level, k, t, gain, from, roll, text, levelBump, s })` | gold segmented strip along the bottom edge, a gold **LV hexagon** at its left end, "XP 340 / 500" at the right (`text`, default `NN%`). `value` 0..1 = progress in the current level; `roll` + `from` slides the fill (white ghost leads). `gain` 0..1 = gold pulse + a star at the fill end (when an xpPop lands). `levelBump` 0..1 pops the hexagon with a ring. `k` slides it up from below. It lives under the captions' baseline — keep `w` ≤ 1640 so it clears the frame corners |
| `H.xpBarAt({ x, y, w, value, text, s })` → `[x, y]` | the end of the fill for a bar drawn with the same options — the `to` for `xpPop` |
| `H.xpPop({ x, y, age, amount = 10, to, text, col, s })` | "+10 XP" pops over a person (0–0.2 s, sparkle burst), hangs, then flies in an arc to `to` shrinking with a sparkle trail and lands at **`H.XP_FLY` = 1.0 s** with a ring burst (gone at 1.3 s). `text` for anything (`'+1% ENERGY'`) |
| `H.levelUp({ k, t, level, from = level − 1, x = 960, y = 380, s, out })` | the LEVEL UP burst: shockwave, rotating gold rays, glow, "LEVEL UP!" letters drop in (0.06–0.6), a hexagon counts `from` → `level` (0.45–0.8) and pops, rising chevrons, sparkles. k 0 → 1 ≈ 1.3 s |

## 5. Friendship

### `H.friendshipPop({ x, y, age, value = 1, s, hold, label })`
`+1`: a pink heart pops with a ring, beats twice, little hearts float off, chip "FRIENDSHIP +1"; rises and fades by ~2 s.
`−50`: a red heart pops, **cracks** down the middle (0.42–0.6, shaking), the halves split and fall with shards (0.72+), the red chip
"FRIENDSHIP −50" shakes on (0.5–0.7); fades by ~2.6 s. `hold: true` keeps the end state (heart split, chip) — for "That number
hurt more than any other." Stop drawing it (or fade with your own group) when the beat ends.

---

## 6. Update, boot, frame, system

### `H.updateWindow({ k, t, scroll, accept, install, x = 960, y = 530, s, glitch, pointer })`
"SYSTEM UPDATE — UPDATE AVAILABLE — **Reality HUD v1.0** — See everyone's stats. In real life." (1160 × 740 at s 1; for his
monitor use `s ≈ 0.4–0.6`, full-screen close-up `s 1`). Terms box with **PAGE 1 / 4,812**: at `scroll 0` page one is
readable — *"1.2 To switch the HUD off, press the little X in the corner."* (the SC09 payoff: it WAS on page one).
`scroll` 0 → 1: the page counter rolls to 4,812, the lines streak, the tiny scrollbar thumb flies down. DECLINE / **ACCEPT**
(pulsing). `accept` 0..1: the button squashes, flashes, ripples and turns green "✓ ACCEPTED" (from 0.35). `install` 0..1 swaps
the buttons for "INSTALLING... REALITY" + progress + spinner ("INSTALL COMPLETE" at 100 %). `pointer: { x, y, press }` draws a
mouse cursor (absolute px; `H.updateAcceptAt({ x, y, s })` → the ACCEPT button centre). The window's own title bar has the tiny X too.
`k` 0..1 opens it (line → box); `glitch` for the install flash.

### `H.pixelBurst({ x, y, age, n = 60 (≤ 80), seed, spread, cols, dur = 1.2 })`
"The screen flashes, pixels fly into the room": cyan/white/gold squares burst out of `(x, y)` (the monitor) and GROW as they
come at the camera, with a white core flash. Combine with `G.flash` / `R.flash` and a cut to black.

### `H.bootSequence(t, t0, { dur = 3.4, k, lines, clock })`
The morning boot over the (visible) room, from `t0`: dark scanline tint, a scan beam, **LOADING REALITY...** with the percent
stalling at 37 and 99, a segmented bar, a boot log typing bottom-left (`H.BOOT_LINES`: "> calibrating eyeballs ... OK",
"> scanning household ... 4 FOUND", ..., "> self-scan ... ???"), then at ≈ 0.62·dur: 100 %, white flash, "REALITY HUD v1.0 ·
ONLINE" with a check, a reveal sweep, and the **HUD frame assembles** in the corners while the overlay fades.
It draws `hudFrame` itself until `t0 + dur`; from then on draw `H.hudFrame({ t })` yourself. Returns `''` outside
`[t0, t0 + dur + 0.6]`.

### `H.hudFrame({ t, k, glitch, clock = '7:02 AM', day = 'MON', minimap = true, dots, quest, questSub, closeX = {}, theme, label })`
The persistent chrome whenever the HUD is ON: four corner brackets with ticks, top-left eye logo "REALITY HUD v1.0 · ● LIVE"
+ signal bars, top-right clock pill, the **minimap radar** (sweep; `dots: [[dx, dy, col], ...]` in −1..1, default a few people
and a yellow quest dot), an optional **quest tracker** under it (`quest: 'FIND MAX', questSub: 'LOCATION: UNKNOWN'`), and —
subtle, half-transparent, in the top-right corner at (1868, 50) — **the tiny X** (`closeX: { highlight, press, hint }`,
`false` to hide). `k` assembles it (~0.7 s: brackets fly in from off-screen, labels, radar, X last). `glitch` → `hudGlitch`.
Draw it in every HUD-on shot (screen space, after the world) — it's what says "you're looking through the HUD".

### `H.systemMsg({ k, t, text, sub, theme = 'info' | 'warn' | 'error' | 'ok' | 'off', icon, x = 960, y = 130, s, out, glitch, type, w })`
The SYSTEM voice as a HUD pop-up: a "◆ SYSTEM" tab, a round icon (info / ⚠ / ✓ / power; or `icon: 'paw' | 'eye' | 'down' | 'x' |
'bang' | 'skull' | ...`), the text typed in Lilita with a cursor (`type` 0..1, default follows `k`), optional `sub`. `warn`/`error`
add hazard stripes and blink. Lines: "Update available." (info) · "Installing... reality." (info) · "Quest complete!" (use
`questComplete`) · "Warning. Too many players. HUD overload." (warn) · "Reality HUD... off." (off) · "Pet stats enabled." (ok, paw).

### `H.bossBar({ k, t, name = 'MRS. KRUMP', sub = 'LV 99 · FINAL BOSS', value, from, roll, trail, hit, x = 960, y = 96, w = 1000, s })`
Top-of-frame boss bar in the HUD style (red, skull hexagon). SC01 teacher reveal, SC05 "A boss fight." (`name: 'TANK', sub: 'LV 80 · BOSS FIGHT?'`).
`hit` 0..1 flash + shake.

---

## 7. Overload + off

| helper | what |
|---|---|
| `H.numbersFlood({ t, k, seed, faces: [{ x, y, r }], n = 80 (≤ 90), tint = true, rect })` | SC08: numbers ("LV 12", "HP 80/100", "+5 XP", "999"...) and little plates swarm the frame; `k` 0..1 = how many (they pop in in a stable order, drift, and jitter harder above 0.6). Every face gets up to **3 opaque plates slammed onto it** (at `k` ≈ 0.22 / 0.42 / 0.62, +0.04 per face) so the faces disappear. Above 0.5: dark tint, red edge pulse, static bars. ≤ 120 text items |
| `H.hudGlitch(svg, t, k, { seed, drop = true, x, y, w, h })` | glitch any HUD layer: slice offsets, RGB split (cheap CSS tint copies), jitter, coloured scan bars, and (`drop`) whole-frame dropouts at high `k` |
| `H.closeX({ x = 1868, y = 50, k, t, highlight, press, s, hint = true })` | the tiny X. Subtle by default (`hudFrame` draws it). `highlight` 0..1: it grows ×2.2, a yellow ring pulses, chevrons point at it and a "CLOSE HUD? ▸" chip slides out over the clock. `press` 0..1: pushed in, turns red, flash + ripple |
| `H.hudShatter({ age, svg, cx = 1868, cy = 50, seed, cols, rows })` | all the HUD breaks like glass from the X: 0–0.25 s impact flash + a crack web spreading over the frame; from 0.22 s the shards (nearest first) fall, spin and fade by ~1.6 s; glints; `''` after 2.2 s. **With `svg`** (the HUD layer you were drawing: frame + plates + bar...) each shard clips and carries that content (5 × 3 grid = 30 shards) — stop drawing the HUD yourself from `age 0`. **Without** it's a glass-only layer (6 × 4 = 48 shards) — keep drawing the HUD until `age ≈ 0.25`, then drop it |

## 8. Montage helpers

| helper | what |
|---|---|
| `H.sortByStrength({ k, t, players, sort, pick, press, highlight, x = 960, y = 520, s, title })` | the dodgeball team list: title, a **SORT BY STRENGTH** button (`press` 0..1), rows `{ name, str }` with STR bars. `sort` 0..1 slides the rows into strength order (staggered, the movers shift right), `#` ranks re-number, #1 turns gold. `pick` = rows picked from the top (fractional = the next green ✓ slamming on). `highlight: 'QUIET KID'` pulses gold. Default players: KYLE 41, PRIYA 72, BENJI 4, QUIET KID 85, MARCUS 63, ZOE 58 (`H.DEFAULT_PLAYERS`) |
| `H.statCompare({ k, t, left, right, choose, x = 960, y = 470, s, title })` | SC07 VS card: `left` = `{ name: 'SMART KIDS', stat: 'INT', value: 95, col, sub: 'GENIUS' }`, `right` = `{ name: 'BENJI', stat: 'LV', value: 4, sub: 'CLUMSY' }`. Cards slide in, VS slams. `choose -1` (left) / `1` (right), fractional animates: the chosen card glows gold with rays and a PICKED stamp, the other turns cold, dims and shrinks |
| `H.epicQuest` / `H.pillowFort` | see Quests |

## 9. Primitives (build your own bits in the same look)

`H.panel(x, y, w, h, theme, { c, c2, shadow, scan, rimW, br, brackets, brOp, edge, op })` the glass panel ·
`H.softPanel(x, y, w, h, theme, r)` rounded warm glass · `H.segBar(x, y, w, h, p, col, { th, t, trail, ghost, blink, inf, cell, skew })` ·
`H.sheen(x, y, w, h, t)` · `H.glow(x, y, rx, ry, col, op, steps)` · `H.infinity(x, y, w, col)` · `H.richText(str, x, y, size, fill, 'L'|'F', anchor, extra)` (draws ∞) ·
`H.bangGlyph(x, top, h, col)` · `H.skullIcon` · `H.crownIcon` · `H.eyeLogo` · `H.icon(kind, x, y, r, col, t)` · `H.cham` / `H.para` / `H.diamondD` / `H.heartD` / `H.hexD` (path data) ·
`H.rays` · `H.sparkleBurst(x, y, u, r, n, col)` · `H.impactTicks` · `H.edgePulse(x, y, w, h, e)` · `H.unfold(k)` → `{ sx, sy, line }` · `H.slap(ki, rot0, rot1)` ·
`H.rollPair(from, to, u)` → `{ fast, slow }` · `H.glitchWrap(svg, t, g)` · `H.rgb(svg, dx)` · `H.TL` / `H.TF` (Lilita / Fredoka text, escaped) ·
`H.theme(name)`, `H.mixTheme(a, b, k)`, `H.TH`, `H.BAR_COL`, `H.TAG_COL`, `H.RARITY`.

---

## Recipes

```js
const K = require('./kit'), H = require('./hud');
const { seg, lerp, clamp } = K;
const { L } = K.V;
```

**Mom's plate at ENERGY 2 % while she smiles (SC03)** — the plate pops on "two", her face stays `joy`; each coffee rolls +1 %.
```js
const l = L('03.8'), c = L('03.10');
const head = H.overHead('mom', momX, momY, 0.55);
const sips = [c.a - 1.2, c.a - 0.2, c.word('four').t0, c.word('four').t1 + 0.3];     // four coffees (sync to her drinking)
const n = sips.filter((s) => t >= s).length, last = sips[Math.max(0, n - 1)];
o += K.actor('mom', t, { x: momX, y: momY, s: 0.55, face: 'joy' });
o += H.plateFor('mom', { ...head, s: 0.9, t, k: seg(t, l.word('energy').t0 - 0.3, l.word('two').t1),
  bars: [{ label: 'ENERGY', value: 2 + n, from: 1 + n, roll: n ? seg(t, last, last + 0.6) : undefined }] });
sips.forEach((s0) => { o += H.xpPop({ x: cupX, y: cupY, age: t - s0, text: '+1% ENERGY', to: [head.x + 60, head.y - 60] }); });
o += H.tipFor('coffee', { x: cupX, y: cupY, t, k: seg(t, sips[0] - 0.6, sips[0] - 0.2), out: seg(t, sips[0] + 0.3, sips[0] + 0.6) });
```

**Tank's reveal, tags one by one (SC05)** — the boss plate first, then a push-in: the HP number blinks, each tag slaps on its word.
```js
const l = L('05.3'), w = (x) => l.word(x).t0;
o += H.plateFor('tank', { ...H.overHead('tank', tx, ty, 0.6), s: 1.1, t, k: seg(t, L('05.0').word('eighty').t0 - 0.2, L('05.0').word('eighty').t1 + 0.2),
  tags: [{ text: 'HUNGRY', k: seg(t, w('Hungry') - 0.05, w('Hungry') + 0.35) },
         { text: 'TIRED',  k: seg(t, w('Tired')  - 0.05, w('Tired')  + 0.35) },
         { text: 'LONELY', k: seg(t, w('Lonely') - 0.05, w('Lonely') + 0.35) }] });
// "a tiny question mark": H.questMarker({ ...head, kind: '?', s: 0.45, t, k: seg(t, L('05.5').word('question').t0, L('05.5').word('question').t0 + 0.4) })
```
Draw the plate BEFORE the tags appear at full size (the tags overlap its bottom edge by design); the cafeteria can drop to a
soft focus + quieter grade while the tags land.

**Quest complete + HP jump (SC05)** — the banner on "complete", the bar rolls 3 → 40 on "health", then a heart.
```js
const q = L('05.8'), tc = q.word('complete').t0, th = q.word('health').t0;
o += H.plateFor('tank', { ...head, t, bars: [{ label: 'HP', value: 40, from: 3, roll: seg(t, th - 0.3, th + 0.9) }], tags: ['HUNGRY', 'TIRED', 'LONELY'] });
o += H.questComplete({ t, k: seg(t, tc - 0.5, tc + 0.8), reward: '+37 HP', out: seg(t, q.b + 0.6, q.b + 0.9) });
o += H.friendshipPop({ x: head.x + 150, y: head.y - 120, age: t - (L('05.12').b + 0.2) });           // "FRIENDSHIP +1" after "Every day."
```

**The XP spree montage (SC06)** — one 0.6–1.0 s shot per good deed, an `xpPop` from the person to the bar, the bar fills and
the level jumps on the narrator's numbers.
```js
const bar = { value: v, level: lvl, text: `${Math.round(v * 100)} / 100`, t };   // v / lvl from your montage timeline
o += H.xpBar({ ...bar, gain: seg(t, tArrive, tArrive + 0.4) });
o += H.xpPop({ x: px, y: py, age: t - tDeed, amount: 20, to: H.xpBarAt(bar) });   // lands at tDeed + H.XP_FLY
const lv = L('06.5');                                                              // "Level two. Level five. Level twenty."
[['two', 1, 2], ['five', 2, 5], ['twenty', 5, 20]].forEach(([w, a, b]) => {
  const t0 = lv.word(w).t0;
  if (t >= t0 - 0.2 && t < t0 + 1.0) o += H.levelUp({ t, k: seg(t, t0 - 0.2, t0 + 1.0), from: a, level: b, y: 360, s: 0.8 });
});
// the hero's own bar appears on SYSTEM "Experience plus fifty!": H.xpBar({ k: seg(t, L('06.0').a, L('06.0').a + 0.5), ... })
```

**The numbers flood that hides faces (SC08)** — miniPlates over the crowd first ("thousands of numbers"), then the flood rises
with the panic; faces = head centres of the people in shot (use the hero's too for the last beat).
```js
const k = seg(t, L('08.8').word('overload').t0, L('08.10').word('FACES').t0);      // 0 → 1 over the panic lines
o += world + crowd + hero;
o += H.numbersFlood({ t, k, faces, seed: shot });
o += H.questArrow({ x: heroX, y: heroFeetY, t, glitch: 1, s: 0.8 });
o += H.hudFrame({ t, glitch: 0.2 + 0.6 * k, quest: 'FIND MAX', questSub: 'LOCATION: UNKNOWN', clock: '4:47 PM', day: 'SAT' });
o += H.systemMsg({ t, theme: 'warn', text: 'HUD OVERLOAD', sub: 'Warning. Too many players.', k: seg(t, L('08.8').a - 0.2, L('08.8').a + 0.4), glitch: 0.3 });
// "Find Max. Location... unknown.": H.questToast({ title: 'Find Max', sub: 'Location... unknown', kind: 'new', glitch: seg(t, L('08.7').word('unknown').t0, L('08.7').b), ... })
```

**The X → shatter → silence (SC09)** — numbers drift around them on the bench (`numbersFlood` at k ≈ 0.25, `tint: false`), the X
is highlighted on Grandpa's "X", pressed before SYSTEM "off", the HUD shatters, then NOTHING.
```js
const tx = L('09.8').word('X').t0, tPress = L('09.11').a - 0.5, age = t - (tPress + 0.15);
const hud = H.hudFrame({ t, closeX: { highlight: seg(t, tx - 0.2, tx + 0.5), press: seg(t, tPress, tPress + 0.4) } }) + plates;
if (age < 0) o += hud;
else o += H.hudShatter({ age, svg: hud, cx: 1868, cy: 50 });                       // '' after 2.2 s: clean, warm, silent
// close-up insert of the X: draw H.closeX({ x: 960, y: 540, s: 5, highlight: 1, t, press }) over a blurred corner of the frame
```
Let the shards fall in silence; the SYSTEM "Reality HUD... off." can be a small `systemMsg({ theme: 'off' })` inside `hud`
(so it shatters too) or just the voice.

**"???" → BIG BROTHER (SC01 / SC12)** — SC01: `heroPlate` at reveal 0 over his reflection, glitching on "QUESTION MARKS".
SC12: Max points the tablet; the reveal starts on "your stats loaded" and the words land on "two words", before he says them.
```js
const n = L('12.6');
const reveal = seg(t, n.word('loaded').t0, n.word('words').t1);                   // ~4 s: ??? dissolve → warm → BIG BROTHER
o += H.heroPlate({ ...H.overHead('you', hx, hy, 0.55), s: 1.15, t, reveal, k: seg(t, L('12.5').b, L('12.5').b + 0.6) });
// keep the frame calm: no hudFrame, no other plates (Biscuit's can fade: fade: seg(t, n.a, n.a + 0.8)); slow push-in on his face
```

**Turning the HUD on one last time (SC11)** — a quick on/off: `hudFrame({ k })` up 0.3 s, `plateFor('benjiBest', { k })` pops,
hold ~1.2 s, both fold back (`k` → 0) on the narrator's "check one thing", and the world stays clean after.

**Plates rewind into one point (end of SC01)** — run every plate's `k` from 1 → 0 while lerping its `x, y` to one point:
`statPlate({ ...p, x: lerp(p.x, cx, u), y: lerp(p.y, cy, u), k: 1 - u })` with `u = seg(t, L('01.9').b, L('01.9').b + 0.6)`.

**Update night (SC03)** — `updateWindow` on his monitor; `scroll: seg(t, L('03.1').word('Terms').t0, L('03.1').word('pages').t1)`;
`accept: seg(t, L('03.2').word('Accept').t0, +0.5)`; `install: seg(t, L('03.4').a, L('03.4').b + 0.4)`; then `pixelBurst` + white
flash + cut to black. Morning: `bootSequence(t, L('03.5').a - 0.8)` over the room; tooltips (`bed`, `sock`, `alarm`) on his words.

## Timing tips

- Pop-ins: plate `k` 0.45–0.6 s; tooltip 0.4–0.5 s; marker 0.5 s; toast 0.6 s; questComplete 1.2 s; levelUp 1.3 s; lie meter
  1.2 s; boot 3.4 s; BIG BROTHER 3–4 s. Start pops 0.1–0.3 s **before** the word so the tick-flash lands on it.
- Tags / punchline values: slap on the word's `t0` (`k` over 0.3–0.4 s).
- Rolls: 0.6–1.2 s; damage feels better fast (0.5 s), heals slower (1 s).
- An `xpPop` lands at `age = H.XP_FLY` (1.0 s): start the bar's `gain` there.
- Emotional beats (Mom "I'm fine", Benji's −50, Grandpa's story, the payoff): fade plates with `fade` over ~0.6 s, keep faces clean.
- SC10–SC11: no HUD. Don't draw `hudFrame` there.

## Performance (`node tools/hud_sheet.js --perf`)

JS build time per call: statPlate 0.14 ms · heroPlate 0.19 · miniPlate 0.05 · tooltip 0.09 · lieMeter 0.10 · questMarker 0.03 ·
questToast 0.06 · questComplete 0.21 · questArrow 0.07 · xpBar 0.05 · xpPop 0.02 · levelUp 0.18 · friendshipPop 0.05 ·
updateWindow 0.10 · bootSequence 0.06 · hudFrame 0.12 · systemMsg 0.04 · numbersFlood (k 1) 0.7 · hudShatter 0.17 ·
sortByStrength 0.15 · statCompare 0.17.

Browser render, full 1920×1080 frame incl. screenshot (≈ 75 ms for a flat background alone):

| frame | ms | over the background |
|---|---|---|
| kitchen + hudFrame + 2 plates + 2 tooltips + xpBar + xpPop | 82–86 | +10–15 |
| numbersFlood k 1 + 5 faces + glitched hudFrame | 179 | +104 |
| hudShatter with `svg` (frame + 2 plates + bar), age .5 | 180 | +105 |
| hudShatter glass-only, age .5 | 122 | +47 |
| updateWindow (scroll .5) + boot overlay | 90–100 | +20 |
| questComplete + levelUp + 3 xpPops | 99–103 | +25 |

Notes: the expensive things in this renderer are **long strokes**, **large translucent areas**, **group opacity** (an offscreen
layer per group) and **gradient fills** (≈ 0.08 ms / 1000 px — a 220 px radial glow is +30 ms). The kit avoids them; when you
build your own bits, fade with `fill-opacity`/`stroke-opacity` on elements rather than a group `opacity` where you can.
`respawn.js`'s `rgbSplit` costs ~40 ms on a full-frame layer; `H.rgb` / `H.glitchWrap` / `H.hudGlitch` use cheap CSS tint
copies (~2 ms). In SC08 keep the world under the flood cheap (crowd via `K.draw.adult` / `humanKid`, no giant close-ups),
and use the glass-only shatter if a shot is already heavy.

## Rebuilding the sheets

```bash
node tools/hud_sheet.js                          # all sheets -> concept/hud.png + concept/hud_<sheet>.png
node tools/hud_sheet.js --sheet plates,motion    # some (overview plates objects quests xp system overload montage motion)
node tools/hud_sheet.js --sheet xp --out /tmp/x.png
node tools/hud_sheet.js --perf                   # JS + browser timings
```
The sheets use stand-in humans for Mom / Grandpa / Max / Benji / Tank / Mrs. Krump until the stats cast is in `rig/cast.js`
(the tool switches to the real keys automatically once `grandpa`, `benji` and `tank` exist).
