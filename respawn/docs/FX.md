# Respawn FX + game-UI kit — `scenes/respawn.js`

The visual signature of the video: Tip, the checkpoint, the block crumble, RESPAWNING 3·2·1, the pop, the pause menu,
attempt counters, toasts, system windows, lag/glitch, foam, confetti, rewind. Pure functions that return SVG strings,
deterministic in their inputs (all "randomness" comes from `hash(seed)`).

```js
const R = require('./respawn');            // DEFS (ids rsp*) are loaded by scenes/main.js automatically
```

Contact sheets: `concept/fx.png` (overview) and `concept/fx_tip.png`, `fx_world.png`, `fx_ui.png`, `fx_lag.png`,
`fx_foam.png`, `fx_motion.png` (fail → respawn time strips). Rebuild: `node tools/fx_sheet.js` (see the end of this doc).

## Ground rules

- **Units.** World FX — `checkpoint`, `flag`, `crumble`, `respawnPop`, `forcefield`, `respawnSeq` — use **actor units**:
  pass the same `s` as the `actor()` standing there (s .5 ≈ a 475 px tall hero) and the same feet point `(x, y)`.
  Tip, UI and foam use plain pixels at `s: 1`.
- **Draw order.** Things that have a `part` option: draw `part: 'back'` before the actor and `part: 'front'` after it
  (`checkpoint`, `respawnPop`). Everything else goes after the actor unless noted. Screen-space overlays
  (`respawnOverlay`, `saveWave`, `rewind`, `flash`, HUD, toasts) go last, outside the camera `view()`.
- **Time.** Every animated helper takes either `t` (the clock — wobble, blinks, spinners) and/or a progress value
  (`k`, `age`, `save`, `plant`, `press`, `broken`, `u`). Derive progress from the voice: `seg(t, L(id).word('X').t0, … + 0.4)`.
  Never hard-code absolute seconds (the timeline is provisional).
- **Design language.** green `#3DDC84` = checkpoint / save · yellow `#FFD43B` = Tip · red `#FF3B4E` = corruption ·
  grey `#7E8596` = respawn / ghost / paused. Titles in Lilita One, UI in Fredoka 700 (`R.T`, `R.TF` escape text).
- **Cost.** No filters, masks or blend modes. ClipPaths only in glitch slices, rolling digits and sheens.
  Every helper is < 2 ms of JS and ≈ one screenshot tick (≤ 16 ms) in Chromium; see the perf table at the end.

---

## 1. Tip — the tutorial helper

`R.tip({ x, y, s, t, look, mood, glitch, fade, label, bob, talk, tail, glow, blink, seed })` → svg

| option | meaning |
|---|---|
| `x, y` | centre of the bubble (≈ 132 × 104 px at `s: 1`, + the TIP tab on top, + glow). Typical: `s: 0.9–1.4` next to the hero at s .5 |
| `t` | clock: hover bob, sway, twinkles, auto blinks, **auto lip-sync** |
| `mood` | `'happy' \| 'smug' \| 'suspicious' \| 'worried' \| 'sad'`. Omitted → picked from the current TIP line's `[tags]` (smug/proud/whisper → smug, suspicious → suspicious, glitch/urgent/quickly → worried, else happy) |
| `talk` | omitted → mouth follows `V.viseme('TIP', t)` (automatic from the TIP voice lines). `false` = closed (mood mouth), a viseme letter `'A'..'H'/'X'`, a number 0..1 (open amount) or `true` (generic chatter) |
| `look` | `[x, y]` −1..1: eyes, mouth and a little body lean |
| `glitch` | 0..1: RGB-split copies, jitter, horizontal slice offsets (clip + use), stray red/cyan blocks, white flicker frames, the tab label scrambles (`T-T-TIP`, `7IP`, `TI#` …). SC01 / SC07–SC09: 0.3–0.7 while talking, 1 for spikes |
| `fade` | 0..1: the goodbye (SC09). Pixel squares break off and drift up from 0.06, the body shrinks and fades from 0.3, a final spark at 0.72–1, gone at 1. Run it over ~2–3 s |
| `label` / `bob` / `tail` / `glow` | TIP tab on/off · hover on/off · speech tail `-1` left (default), `1` right, `0` none · glow strength |

`R.tipCard(x, y, k, text, { t, w = 640, s, type = 1, size = 34, accent, showIcon, rot = -2 })` — yellow tutorial hint card
with a light-bulb badge. `k` 0..1 pops it in with overshoot (+ white flash, sparkles); pass a falling `k` to pop it out.
A leading `TIP:` is drawn in orange Lilita; the rest wraps to `w`. `type` 0..1 = typewriter reveal (sync to the words).

```js
const l = L('04.8');                                   // "TIP: You can move your checkpoint! ..."
o += R.tip({ x: 1450, y: 330, s: 1.1, t, look: [-1, 0.2] });
o += R.tipCard(620, 210, seg(t, l.a, l.a + 0.35), 'TIP: Carry the flag to move your checkpoint!',
               { t, type: seg(t, l.a, l.word('plant').t1) });
```

## 2. Checkpoint, flag

`R.checkpoint({ x, y, s, t, state, save, glow = 1, part = 'all', pole = true, flag = true })`
- `(x, y)` = pad centre on the floor (the hero's feet go there). Pad = 840 × 224 actor units + 62 thick (s .5 → 420 px wide).
  Pole (700 tall) + flag stand at the back-right so they peek out beside the hero.
- `state`: `'idle'` (dim, flag low and pale) · `'saved'` (glowing, flag up, LEDs chasing) · `'red'` (SC07: blinks red/dark at
  5 Hz, torn flag with a burn hole, cracks, sparks) · `'dead'` (SC09: grey, no glow, pole fallen across the pad, limp flag).
- `save` 0..1 = the save moment (default 0 for idle, 1 otherwise): flag shoots up with overshoot (0.02–0.32), pad flashes,
  two green pulse rings run out along the floor (to 5.6× the pad), sparkles burst, glow surges. ~0.8–1.0 s.
- `part`: `'back'` before the actor (glow, rings, haze, slab, pole, flag), `'front'` after it (light veil, motes, burst).

`R.flag({ x, y, s, rot, state, t, plant, grip = 0, wave = 1 })` — the portable flag. `(x, y)` = the point at `grip` along the
pole (0 = the spike, ≈ 0.3 = where a hand holds it; use `require('./acting').hand(angle, side)` for the hand point).
`plant` 0..1: slams down (0–0.18), dirt puff + pebbles + a green ring, damped wobble, then stands in a dirt mound.

`R.flagProp(t, { x, y, rot, s, state, layer = 'back' })` → `{ svg, layer }` — the flag sticking out of the hero's backpack;
put it in `pose.props` (body space, front view).

`R.tinyFlag(x, y, s, t, { blink = true, state })` — mini pad + flag (≈ 80 px at s 1) with a blinking glow — the last shot
in Gary's bowl (SC12). `blink: true` pulses; a number 0..1 sets the glow.

`R.saveWave(u, { x, width })` — the green "Checkpoint saved" light wave that sweeps through the whole frame from screen
x outward (u 0..1; the sweep itself takes ~0.35 of u, then the tint fades). SC03 "по комнате проходит зелёная волна", SC05.

## 3. Crumble — the fail

`R.crumble({ x, y, s, age, seed, colors, dir, spread = 1, floorY, ghost = 0, life = 1, chips = true, gravity = 1, pop = true })`
- `(x, y, s)` = the actor's feet/scale at the moment of the fail; stop drawing the actor at `age >= 0`.
- 24 two-tone blocks laid out like the hero (hair, face + 2 black "eye" bits, jacket, shirt, sleeves, hands, legs, shoes)
  + 10 small chips. 0–0.12 s: the white hero silhouette flashes and the blocks show through; a ring and spark lines pop.
  Blocks burst outward/up, tumble, land on `floorY` (default `y`), bounce once, settle **flat**, fade by ≈ 1.0–1.5 s × `life`.
- `dir`: number (−1..1 sideways bias) or `[dx, dy]` (e.g. `[1, -0.4]` = flung forward off the bike). `spread` scales speed.
- `colors`: `{ hair, skin, jacket, shirt, pants, shoe, line }` overrides (other characters) or an array of colours to cycle.
- `ghost` 0..1: grey translucent blocks (ghost copies, SC08).
- **Freeze it** (the world pauses under the overlay): pass a constant `age` (e.g. 0.36) — blocks hang in mid-air.
- **Rewind it** (SC01 → SC02 "кубики собираются обратно"): pass a decreasing `age` (see `rewindT`).

## 4. Respawn

`R.respawnOverlay(t, { t0, dur = 1.2, label = 'RESPAWNING', reason, count = 3, marks, style = 'full', x, y, s, wash = 1, flash = true, sub })`
- Screen space; returns `''` outside `[t0, t0 + dur]`.
- `style: 'full'` — grey wash + scanlines + corner brackets + blinking "II PAUSED", `RESPAWNING…`, a big digit that slams in
  (2.2× → 1× with overshoot) inside a progress ring with tick dots, a ring burst per digit, the red-x `reason` pill
  ("YOU FELL DOWN THE STAIRS"), and a white flash in the last 10 % (cut to the pad under it).
- `'banner'` — grey band across `y` with spinner + label + reason and `3 · 2 · 1` lighting up in a row (lighter wash).
- `'corner'` — small pill (spinner, label, digit) at `(x, y)` = its right edge (default top-right); no wash unless you pass `wash`.
- `'mini'` — only the digit + ring at `(x, y)` (e.g. over the crumbling hero).
- `marks: [tThree, tTwo, tOne]` — each digit slams exactly on that time (sync to the SYSTEM voice):
  `marks: ['three', 'two', 'one'].map((w) => L('04.2').word(w).t0)`.

`R.respawnPop({ x, y, s, age, col, blocks = true, part = 'all', height = 1900 })` — the reappearance, `(x, y)` = feet.
`age` −0.32..0: coloured blocks spiral in and a thin beam appears; 0: white core flash; 0–0.6: light pillar (back),
floor rings, rising sparkles + green bits (front). `part: 'back'` before the actor, `'front'` after.

`R.popPose(age, s)` → `{ hidden, sx, sy, lift }` — squash & stretch to spread into the actor's pose (stretch 1.3 → squash → settle
in ~0.4 s, drops from 140·s px). Don't draw the actor while `hidden`.

`R.forcefield({ x, y, s, t, k = 1, col, rim, seed })` — spawn-protection bubble around an actor: translucent green ellipse,
hex cells along the rim lit by a travelling shimmer band, gloss arc, twinkles, floor ring. `k` fades it; below 0.5 it
blinks out (every 3rd frame at 15 Hz) like expiring spawn protection. Draw after the actor.

### The one-call recipe: `R.respawnSeq(u, opts)`

```js
// u = seconds since the fail
const q = R.respawnSeq(t - tFail, {
  preset: 'standard',                         // 'standard' 1.6 s | 'fast' 0.5 s | 'corner' 1.1 s
  fail:  { x: 1260, y: 900, s: 0.5, dir: [0.6, -0.2] },   // where the hero broke (+ crumble options)
  spawn: { x: 700,  y: 900, s: 0.5 },          // the pad
  reason: 'YOU FELL DOWN THE STAIRS', t,       // t = clock for wobble
  overlay: { marks },                          // optional extra respawnOverlay options
});
// q.view: 'fail' | 'spawn' — which place the camera should show (the cut is hidden by the white flash)
// q.heroAt: 'fail' (u < 0) | 'spawn' (after the pop) | null;  q.pose = popPose fields for the hero on the pad
let w = world(q.view) + R.checkpoint({ ...SPAWN, t, part: 'back' }) + q.under;
if (q.heroAt) w += actor('you', t, { ...(q.heroAt === 'spawn' ? { ...SPAWN, ...q.pose } : FAIL_POSE) });
w += R.checkpoint({ ...SPAWN, t, part: 'front' }) + q.over;
return view(cam, w) + q.screen;
```

| preset | 0 → | timeline |
|---|---|---|
| `standard` (1.6 s) | crumble 0–0.36 s → **freeze** (blocks hang) under RESPAWNING 3·2·1 (0.3–1.3, white flash at the end) → cut → blocks converge 1.18–1.3 → pop 1.3 → forcefield to 3.2 (blinks out over the last 0.7) |
| `fast` (0.5 s) | crumble + white pop → white flash at 0.22 → cut → pop 0.3 → forcefield 1.1 s. For montages / repeated attempts |
| `corner` (1.1 s) | the crumble plays out fully while a corner pill counts 3·2·1 (0.08–0.94) → pop at 1.0. The world keeps going |

Override any timing with `timing: { ov: [start, dur, style], freeze, pop, conv, field, flashAt }`.

## 5. Pause menu

`R.escMenu({ x, y, s, k, hl, press, t, broken, title = 'PAUSED', footer = 'REAL LIFE  v1.0', items })`
- 720 × 540 at `s: 1`, `(x, y)` = centre. Translucent dark panel with a soft blue rim, header "II PAUSED", three buttons
  **RESUME [ESC] · RESET CHARACTER [R] · LEAVE GAME [L]** with icon badges and keycaps.
- `k` 0..1 unfolds it in the air: a horizontal line → panel with overshoot (0–0.6) → header (0.32–0.55) → buttons pop in one
  by one from the right (0.4–0.88); corner sparkles. ~0.6–0.8 s from the finger snap.
- `hl: 'resume' | 'reset' | 'leave'` — highlighted button (white; LEAVE turns red), bouncing yellow pointer, pulsing ring.
- `press` 0..1 — pushes the highlighted button down, white flash, ripple ring. Cut to `crumble` around press 0.4.
- `broken` 0..1 (SC10 finale, no menu): sputters (0–0.3: random partial panels + static), "MENU UNAVAILABLE" /
  "RESPAWN DISABLED" with RGB ghosts and a warning icon (0.3–0.76), collapses to a line (–0.88), a dot (–0.97), gone (1).
  ~1.2–1.6 s.

## 6. HUD

`R.counterHUD({ x, y, s, k, label, value, t, bump, theme, roll, from, anchor = 'left', icon, size = 66, labelSize = 30 })`
- Pill 96 px tall: icon badge · LABEL (Fredoka caps) · value (Lilita). `anchor` = which edge `x` is (`'left' | 'center' | 'right'`).
- `value`: number (formatted `4,816`), string (`'LOW'`) or `'∞'` (drawn, the font has no glyph).
- `theme`: `'white'` (retry icon), `'green'` (flag), `'red'` (warning, edge pulses), `'gold'` (star), `'grey'` (monitor).
  `icon`: `'retry' | 'flag' | 'warn' | 'star' | 'heart' | 'cal' | 'gfx' | 'check' | null`.
- `bump` 0..1 — elastic scale pop of the value + white flash + sparkles. Use `seg(t, tChange, tChange + 0.45)`.
- `roll` 0..1 + `from` — odometer: digits roll from `from` to `value` (ease-out), each column rolls when the lower one wraps.
- `k` 0..1 — pops/slides in from its anchor side.

| line | call |
|---|---|
| ATTEMPT 57 | `counterHUD({ x: 60, y: 80, label: 'ATTEMPT', value: 57, bump })` |
| ATTEMPTS TODAY: 214 | `{ label: 'ATTEMPTS TODAY:', value: 214, theme: 'gold', roll, from: 0 }` |
| THURSDAY · VERSION 412 | `{ label: 'THURSDAY · VERSION', value: 412, icon: 'cal' }` |
| FALLS: 4,816 | `{ label: 'FALLS:', value: 4816 }` |
| RESPAWNS USED: 9,999 | `{ label: 'RESPAWNS USED:', value: 9999, theme: 'red' }` |
| LIVES: ∞ / LIVES: 1 | `{ label: 'LIVES:', value: '∞', theme: 'green', icon: 'heart' }` → `{ value: 1, theme: 'white', icon: 'heart', bump }` |
| GRAPHICS: LOW | `R.lowGfxBadge(x, y, k, t, { bump })` |

`R.savedToast(x, y, k, { text = 'Checkpoint saved', t, out, s, anchor = 'left', size = 42 })` — dark-green pill: slides in with
overshoot, the check circle pops (0.25–0.6) and its check is drawn on (0.45–0.8), a ring and a sheen sweep; `out` 0..1 lifts
and fades it. Put it bottom-left above the captions (y ≈ 900) or top-centre; ~2 s on screen. Sync `k` to the SYSTEM line.

## 7. System windows, sky crack

`R.sysWindow({ x, y, w, h, k, theme, title, lines, small, buttons, hl, press, glitch, progress, icon, open = 'pop', t, s, seed })`
- An original game-OS alert: title bar (icon + Lilita title + window buttons), big icon left, `lines[0]` as a Lilita headline,
  further lines in Fredoka, `small` italic fine print, optional `progress` (12-block bar + %), optional `buttons`.
- Fonts, outline widths and bar height scale with the window — works from ~500 × 260 to **sky-size 1700 × 600**.
- `theme`: `'red'` (hazard-striped title, dark-red body with scanlines, alarm pulse, red halo) · `'grey'` · `'green'`.
- `icon`: `'warn' | 'check' | 'save' (cracked) | 'trash' | 'export' (spinner) | null` (default by theme).
- `hl`: button index or label; `press` 0..1 as in the menu. First button = theme accent (YES red on grey), others neutral.
- `glitch` 0..1: RGB halo copies, jitter, slice offsets, scrambled title and text. `open: 'crt'` = line → box (sky windows).

```js
// SC01 / SC08 — the red window fills the sky
R.sysWindow({ x: 900, y: 330, w: 1640, h: 560, k, open: 'crt', t, theme: 'red', title: 'WARNING',
  lines: ['SAVE FILE CORRUPTED', 'Respawns used: 9,999'], small: 'Too many respawns. The world may lag.', glitch: 0.15 })
// SC09
R.sysWindow({ x: 960, y: 420, w: 1100, h: 560, k, t, theme: 'grey', title: 'DELETE SAVE?', icon: 'trash',
  lines: ['Delete the save file?', 'Everything goes back to normal.'], small: 'Respawn will be disabled forever.',
  buttons: ['YES', 'NO'], hl: 'YES', press })
// SC03
R.sysWindow({ ..., theme: 'green', title: 'SYSTEM', icon: 'export', lines: ['FINAL CHECKPOINT REACHED', 'Exporting to real life…'], progress })
```

`R.skyCrack({ cx, cy, k, t, wheel = true, s = 1, seed, n = 9, glow })` — the sky cracks like a phone screen from `(cx, cy)`:
impact flash (0–0.14), 9 jagged cracks race out (0.04–0.55) with branches, web rings (0.4–0.9), shard tints, a dark hole with
a red rim and a spinning loading wheel (`wheel`), glass bits falling. Radius ≈ 820·s px. ~1 s for k 0 → 1.

## 8. Lag & glitch (all cheap)

| helper | what |
|---|---|
| `R.freezeT(t, [[a, b], …], catchUp = true)` | time stops inside each interval; `catchUp` → jumps back to real time after (lag spike), `false` → stays late |
| `R.freezeT(t, { every, hold, t0, seed, jitter })` | periodic freezes (birds frozen in the sky: animate them with `freezeT(t, …)`) |
| `R.stutterVoiceT(t, t0, len = .12, reps = 3)` | a skipping record: `[t0, t0+len]` plays `reps` times, then continues late. Loop poses (Dad "Why did the pan—", Mom "m-m-m-morning") |
| `R.rubberBand(t, { period, a, b, hold, t0, fps })` → `{ x, y, u, snap }` | a → b, wait, **teleport back to a** (the school bus). `fps` makes it choppy; draw an afterimage at the old spot while `snap > 0` |
| `R.lagJitter(t, seed, k, { fps = 8, amp = 16 })` → `{ dx, dy, rot }` | stepped hops (half the steps stand still) |
| `R.glitchSlices(svg, t, k, seed, { x, y, w, h, n, maxDx = 70, fps = 14, bars })` | horizontal slices of any group shifted sideways (clipped `<use>`s, intermittent). Pass the group's bbox as x/y/w/h |
| `R.rgbSplit(svg, k, { dx = 12, dy, t, op })` | red/cyan tinted copies behind the group (CSS tint classes, filters off) — ~1.3× the group's cost |
| `R.tint(svg, 'ghost' \| 'white' \| 'black' \| 'red' \| 'cyan', opacity)` | flat silhouette copy: `'ghost'` = grey fill + slate outline (frozen / ghost copies), `'white'` = pop flash of any character |
| `R.scramble(text, t, k, seed)` | junk-glyph text (`T-T-TIP` style errors) |
| `R.lowGfxBadge(x, y, k, t, { bump })` | "GRAPHICS: LOW" pill |
| `R.loadingTexture(x, y, w, h, t, { k, cell = 40, label, spin, rx })` | grey checker "texture not loaded" + shimmer + spinner + LOADING… |
| `R.greyWash(k, { x, y, w, h, col, dark })` | cheap "desaturate" of whatever is drawn below (grey + a little dark). Draw world → wash → characters to grey only the world |
| `R.pixelDissolve({ x, y, w, h, k, seed, colors, cell, dir, mode })` | ≤ 72 squares break off (`'out'`) or fly in and assemble (`'in'`); draw the object at opacity 1−k under it |
| `R.spinner(x, y, r, t, col)` | the classic dotted loading wheel |

## 9. Foam (elephant toothpaste)

All in px at `s: 1`, batched circles (3 paths for any number of blobs) + pastel stripes/swirls; outline 7 px.

- `R.foamFountain({ x, y, s, t, age, dir, h = 520, floorY, fall, curl, thick, stripes, pile, seed })` — erupts from `(x, y)`
  (hat / flask mouth): collar over the rim, a thick lumpy column with 2–3 pastel stripes running along the flow (they drift
  with `t`), rises `h`, curls over toward `dir` (−1 / 1) and falls to `floorY` (screen y; or `fall` px) where a pile grows
  (`pile`). `dir: 0` = straight up into a cauliflower crown. `age` = s since the eruption (grows over ~1 s, flows after).
- `R.foamPile(x, y, w, h, { t, seed, stripes })` — flat-bottomed mound standing on `y` (centre `x`).
- `R.foamBlobs(x, y, s, k, seed, { t })` — a dollop with drips (on a head / a shoulder), grows in with `k`.
- `R.foamSplash(x, y, age, { s, dir, n, seed })` — splat + flying drops with gravity (~1 s).
- `R.foamSnowman(x, y, s, t, { k })` — three foam balls, coal eyes, carrot, stick arms waving, a tiny top hat; `k` builds it.
- `R.foamMustache(x, y, s, t)` — curly foam moustache, `(x, y)` = under the nose (≈ 200 × 70 px at s 1) — the principal, SC10.

## 10. Confetti, lightning, rewind, flashes

- `R.blockConfetti({ x, y, age, n = 40 (≤ 80), spread, colors, s, seed, life = 3, up, power })` — cube confetti bursting up,
  then drifting with drag + sway, fading by `life`.
- `R.blockConfettiRain(t, { k, n = 60, seed, colors, s, speed, t0 })` — full-screen falling cubes; loops, or with `t0` one pass
  from above ("конфетти медленно оседает на город").
- `R.ghostPop({ x, y, s, age, seed })` — a ghost copy pops: white silhouette + ring + 12 colourful cubes (draw the ghost
  while `age < 0`). For hundreds of ghosts pop only the visible ~10–20 near camera with staggered ages; use the rain for the rest.
- `R.lightning({ x0, y0, x1, y1, seed, k, width, branches, flash = true })` — bolt grows (0–0.12), flickers, fades; branches,
  impact glow, full-frame flash. ~0.5–0.8 s.
- `R.rewind(t, k, { label = 'REWIND', clock, svg, seed })` — VHS ◀◀ overlay: tint, scanlines, tracking band, streaks, backward
  speed lines, OSD. Pass `svg` (your world) to also tear it with slices (returned first).
- `R.rewindT(t, a, b, from, to)` — as t runs a → b the source time runs `from` → `to` backwards (ease in-out).
- `R.flash(k, col = '#FFFFFF')` — full-frame flash.

---

## Recipes

**Standard fail → respawn (1.6 s)** — `respawnSeq` preset `standard` (above). Put the fail on a word
(`tFail = L(id).word('Fall').t0`), keep the reason short and in caps. Shake the camera 0.25 s at `tFail`
(`K.shake(t, tFail, 0.25, 16)`). Add `savedToast` / `counterHUD` bump after the pop if the attempt count matters.

**Synced to "Respawning in three… two… one" (SC04, SC07)**
```js
const l = L('04.2'), tFail = l.a - 0.6;          // the fall happens just before the line
// respawnSeq runs on u = t - tFail, so everything passed to it (timing, marks) is relative to the fail
const marks = ['three', 'two', 'one'].map((w) => l.word(w).t0 - tFail);
const q = R.respawnSeq(t - tFail, { preset: 'standard', fail, spawn, reason: 'YOU FELL DOWN THE STAIRS', t,
  timing: { ov: [l.a - 0.15 - tFail, l.b + 0.35 - (l.a - 0.15), 'full'], pop: l.b + 0.35 - tFail },
  overlay: { marks } });
// -> digit 3 slams on "three", 2 on "two", 1 on "one"; white flash + pop 0.35 s after the line
```
Standalone (`respawnOverlay(t, …)` called with the real clock) takes absolute marks: `marks: ['three', 'two', 'one'].map((w) => l.word(w).t0)`.

**Fast version (0.5 s)** — preset `fast`; or by hand: `crumble(age)` 0–0.25, `flash(1 - |u-0.22|/0.08)`, cut,
`respawnPop(age = u - 0.3)` + `popPose`, forcefield 1 s.

**Montage: "Attempt one… two… twenty-three" (SC05)** — one 0.6–0.9 s shot per attempt word: the trick, `crumble` with a new
`seed` and a different `dir` each time (`[1, -0.3]`, `[-1, -0.2]`, `[0.4, -0.8]`, into a bin: `floorY` higher), smash cut,
`counterHUD({ label: 'ATTEMPT', value: n, bump: seg(t, tWord, tWord + 0.45) })` top-left the whole time. For the
"cubes, cubes, cubes" beat use 3–4 crumbles at 0.35 s each, `life: 0.6`, alternating camera angles; skip the overlay.
Split-screen: 4 quarters (nested `<svg viewBox>` or clip rects), each a `respawnSeq(..., { preset: 'fast' })` offset by 0.15 s.

**Checkpoint saved (SC03, SC05, SC12)** — `checkpoint({ save: seg(t, tStep, tStep + 1.0) })` when the foot lands on the pad
(or when the flag is planted: `flag({ plant })` then `checkpoint` is optional), `saveWave(seg(t, tStep + 0.05, tStep + 0.85), { x: padScreenX })`,
`savedToast(70, 900, seg(t, L('03.11').a - 0.1, L('03.11').a + 0.35), { out: seg(t, L('03.11').b + 1.2, L('03.11').b + 1.6) })`.
SC12 whisper: just `tinyFlag` blinking + a small toast (`s: 0.7`).

**Pause menu (SC04 / SC05)** — finger snap → `escMenu({ k: seg(t, tSnap, tSnap + 0.7) })`; hover `hl: 'reset'` on the word;
`press: seg(t, tPress, tPress + 0.4)`; at `tPress + 0.25` close the menu (`k` back to 0 over 0.2 s) and start a
`respawnSeq` (preset `fast` or `corner`). SC04 "Don't press Leave Game": `hl: 'leave'` + Tip `mood: 'worried'`.

**No menu (SC10)** — `escMenu({ broken: seg(t, tSnap, tSnap + 1.4), t })` over the backstage; reuse for "Reset… RESET!":
three short `broken` runs (0 → 0.3 only) + a `counterHUD({ label: 'LIVES:', value: 1 })` blink.

**Lag (SC07)** — birds: animate with `freezeT(t, { every: 1.1, hold: 0.6, seed: i })`; bus: `rubberBand(t, { period: 1.6, a, b, fps: 10 })`
+ a `tint(bus, 'ghost', 0.4 * snap)` afterimage; Mom: `stutterVoiceT` on her pose; the pancake: freeze its `t`; the street
going low-gfx: `greyWash` + `loadingTexture` patches + `lowGfxBadge` bump; whole frame: `glitchSlices(world, t, 0.3)` on beats.
Respawn gone wrong: preset `corner` with `reason` and a Tip `glitch: 0.6` line; the checkpoint `state: 'red'`.

**Corrupted (SC01 end, SC08)** — red sky window (`open: 'crt'`, `glitch` 0.1–0.3 flickers), `skyCrack` in a corner with the
wheel, `counterHUD({ label: 'RESPAWNS USED:', value: 9999, theme: 'red', roll, from: 0 })`, red checkpoints, ghost copies
`tint(actor(...), 'ghost', 0.45)` looping their fails with `crumble({ ghost: 1 })`, Tip `glitch: 0.5`.

**Delete save (SC09)** — DELETE SAVE? window with `hl: 'YES'`, `press` on "Delete."; at the press: `flash(0.8)`, every visible
ghost → `ghostPop` (stagger ages by distance from the hero), `blockConfettiRain(t, { t0: tPress, n: 70 })`, colour back
(`greyWash` k 1 → 0 over 1.5 s), checkpoint `save` → `state: 'dead'`, Tip `fade: seg(t, L('09.8').b - 1.5, L('09.8').b + 1.2)`.

**Rewind (SC01 → SC02)** — over ~1.5 s: `rewind(t, k, { svg: world(rewindT(t, a, b, tNow, tMorning)), clock: 'MON 7:30 AM' })`
and `crumble({ age: decreasing })` so the blocks fly back together.

**Lightning (SC03)** — `lightning({ x0, y0: -40, x1: houseRoofX, y1: houseRoofY, k: seg(t, tHit, tHit + 0.7) })`, then the
green export window (`progress`) and a `flash(…, '#5CFF9A')` green wash for the monitor.

**Foam disco (SC06, SC10)** — rehearsal: `foamFountain({ dir: -1, age })` from the hat onto the hero + `foamBlobs` on his
head, then `respawnSeq` (the reset). Show: fountain `h: 600, thick: 1.4, s: 1.1, dir` toward the principal, `foamPile`s
growing (`w, h` eased), `foamMustache` on the principal, `foamSnowman({ k })`, `foamSplash` on jumps.

---

## Timings cheat-sheet

| effect | default duration |
|---|---|
| crumble (white pop 0.12 s) | blocks land ≈ 0.6–1.0 s, gone ≈ 1.5 s (× `life`) |
| respawnOverlay | `dur` 1.0–1.2 s (each digit `dur/3`, or `marks`), white flash in the last 10 % |
| respawnPop | −0.32 s (blocks converge) … 0.9 s |
| popPose | settles in ≈ 0.4 s |
| forcefield | 1.5–2 s, fade over 0.7 s (blinks below k .5) |
| checkpoint save | 0.8–1.0 s |
| flag plant | 0.18 slam + 0.5 puff (map `plant` over ~1 s) |
| saveWave | 0.6–0.9 s |
| escMenu open / press / broken | 0.6–0.8 s / 0.4 s / 1.2–1.6 s |
| savedToast | in 0.4 s, hold ~1.5 s, out 0.3 s |
| counter bump | 0.45 s; roll 0.8–2 s |
| sysWindow pop / crt | 0.35 s / 0.6 s |
| skyCrack | ≈ 1 s |
| Tip fade (goodbye) | 2–3 s |
| lightning | 0.5–0.8 s |
| ghostPop / blockConfetti | 1.4 s / 3 s |

## Performance (`node tools/fx_sheet.js --perf`)

Each effect alone on a flat 1920×1080 frame; JS = build time per call, svg = Chromium render minus the empty frame
(the screenshot timer has a ≈ 15 ms step, so "0–16" means "below one tick").

| effect | elems | JS ms | svg ms |
|---|---:|---:|---:|
| tip (talking) / glitch 1 / fade .6 | 22 / 37 / 26 | 0.3 | 0–11 |
| tipCard | 15 | 0.1 | 0 |
| checkpoint saved / save .3 | 30 / 37 | 0.3 | 1–17 |
| flag plant .3 | 16 | 0.1 | 5 |
| crumble age .3 (34 pieces) | 107 | 0.5–0.8 | 14–15 |
| respawnOverlay full | 24 | 0.2 | 20 |
| respawnPop age .1 | 7 | 0.1 | 6–8 |
| forcefield | 13 | 0.3 | 0–8 |
| escMenu open + press / broken | 53 / 17 | 0.2 | 14–16 / 0 |
| counterHUD rolling / savedToast | 17 / 12 | 0.7 / 0.1 | 0 |
| sysWindow sky-size / glitch .8 | 25 / 48 | 0.2 | 13–16 |
| skyCrack k 1 | 15 | 0.3 | 13–15 |
| saveWave | ≤ 6 | 0.03 | 0–8 |
| loadingTexture 600×400 | 16 | 0.05 | 0 |
| foamFountain / foamPile / foamSnowman | 22 / 13 / 29 | 1.6 / 0.2 / 0.2 | 0–16 |
| blockConfetti 80 / rain 60 | 240 / 180 | 0.4 / 0.3 | 11–16 |
| lightning k .3 / rewind overlay | 5 / 9 | 0.1 | 0–16 |
| hero actor (reference) | 108 | 0.7 | 13–15 |
| rgbSplit(hero) / glitchSlices(hero) | 326 / 132 | 0.4 | 23 / 28–32 |
| **street + pad + hero + pop + forcefield + Tip + HUD + toast** | 217 | 1.2 | **32–40** |
| **street + frozen crumble + RESPAWNING overlay** | 147 | 0.4 | **22** |

Budget hints: `rgbSplit` / `tint` copy the whole group's DOM (filters are switched off in the copies) — use them on
1–3 characters, not on crowds; `glitchSlices` re-rasterises the group once per slice — keep `n` ≤ 4 and give a tight bbox;
the radial-gradient glows are small ellipses (pad glow ≈ 700 × 220 · s), never full-frame.

## Contact sheets

```bash
node tools/fx_sheet.js                          # all sheets -> concept/fx.png + concept/fx_{tip,world,ui,lag,foam,motion}.png
node tools/fx_sheet.js --sheet ui,motion        # only some sheets
node tools/fx_sheet.js --only crumble,cp_ --full /tmp/fx   # some tiles, full-size PNGs into /tmp/fx (+ /tmp/fx_only.png)
node tools/fx_sheet.js --perf                   # the perf table above
```
