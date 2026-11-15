# "What If Roblox Shut Down FOREVER?" — how to write a scene

Project: `/home/user/animation/roblox-shutdown`. 1920×1080, rendered at 30 fps (frames are SVG strings rendered by headless Chromium, `tools/render.js`). The video is **13:58** long.

**The voice already exists.** `scenes/timeline.json` (built by `voice/timeline.py` from `voice/takes/*`) fixes when every line and every word is spoken. Animation is timed **to the voice**: never hard-code absolute seconds, derive them from lines and words.

Quality references from the previous video (same engine, different story and characters — use them to see the expected level of dynamics and polish, **do not copy their content**): `/home/user/animation/robux-real/scenes/s01.js`, `s02.js`, `s08.js`.

## Files you may and may not touch

- **Write only** your own scene module(s) `scenes/sNN.js`, plus optional private helpers in `scenes/sNN_env.js`.
- **Read-only shared files:** `scenes/kit.js`, `scenes/vo.js`, `scenes/common.js`, `scenes/env.js`, `scenes/main.js`, `scenes/sets.js` (home + world sets), `scenes/farm.js` (road + Server Farm sets), `rig/*` (characters, `rig/lag.js` = the Lag, Buffer, Modbot), `voice/*`. If you need something different, copy it into your own file.
- `scenes/main.js` loads `sNN.js` by scene id and gives it time `t` in **absolute video seconds**. Your scene owns `[its first line's take start (or 0) … next scene's take start)`: get the range with `node -e "console.log(require('./scenes/main').RANGES)"`.

## Module contract

```js
'use strict';
const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;              // L('03.4') → line; .a/.b = speech start/end; .word('FOREVER').t0/.t1
module.exports = {
  scene(t) { return '<svg elements…>'; },         // required: full 1920×1080 frame, without captions
  look(t) { return { grade: 'warm' }; },           // optional: 'warm' | 'cool' | 'night' | null, vignette 0..1
  timer(t) { return 3600 * 22; },                  // optional: seconds left on the SHUTDOWN countdown HUD (null = hidden)
  DEFS: '<defs>…</defs>',                           // optional: static gradients/patterns with UNIQUE ids (prefix sNN)
  captionY(t) { return 1010; },                     // optional: move captions when they cover something
  noCaptions(t) { return false; },                  // optional
};
```

### The countdown HUD
`timer(t)` may return a number (seconds left) or `{ sec, glitch: 0..1, y, label }`. `main.js` draws the pill at the top centre. Story times per scene (show them, and let them tick down in real time inside a scene):
SC01 00:01:00 → ~00:00:35 · SC02 none (or 24:00:00 frozen during the rewind) · SC03 appears at the end 23:59:59 · SC04 22:00:00 → 20:00:00 (time-skips between montage beats are fine) · SC05 18:00:00 · SC06 12:00:00 · SC07 06:00:00 · SC08 03:00:00 · SC09 00:15:00 → 00:05:00 after the SYSTEM line · SC10 00:01:00 counting down in real time · SC11 00:00:03 → 00:00:01 then frozen, flashes green · SC12/SC13 hidden. When the HUD would cover something important, hide it or move it (`y`).

## Timing from the voice

- List a scene's lines: `node -e "const V=require('./scenes/vo');for(const l of V.TL.lines.filter(l=>l.scene==='SC 05'))console.log(l.id,l.speaker,l.speechStart.toFixed(2),l.speechEnd.toFixed(2),l.text)"`.
- Line ids are `take.index`, e.g. `05.3`; takes are 01–13 (one per scene).
- `L(id).a` / `L(id).b` = speech start/end; `L(id).word('COINS').t0`; `.word(w, n)` for the n-th repeat.
- **Captions, lip-sync and blinks are automatic.** `actor()` moves the mouth whenever that character speaks. Captions are drawn by `main.js`.
- Silent beats from the script (⏱) are already in the timeline as gaps after lines (`line.beatAfter`).

## Drawing characters

`actor(name, t, pose, act)` with `name` one of the rig cast (look at `concept/cast_lineup.png`, `cast_expressions.png`, `cast_turnaround.png`): speaking characters lip-sync automatically.

| Key | Look | Height (rig units × pose `s` = px) |
|---|---|---|
| `juno` | yellow hard hat with stickers, auburn pigtails, round glasses, denim overalls, red/white stripes, pencil behind her ear | ≈1015; pigtails make her ≈600 wide — leave room in two-shots |
| `dex` | electric-blue spikes, gamer headset, "PRO 1" jersey, fingerless gloves | ≈1130 |
| `pip` | tiny (size 0.72), green dino hood with a tail, missing front tooth, light-up shoes | ≈780 |
| `grandpa` | bald, flat cap, big white beard, mustard cardigan; key ring on the belt (`keys:false` hides it, `keysSwing` deg jingles it, `goldKey:false` after he uses the gold key) | ≈1056 |
| `dad` | bucket hat, brown beard, glasses, navy polo (`hat:false` = no hat) | ≈1147 |
| `mom` | dark messy bun with a pencil, teal knit (no lines) | ≈1190 |
| `anchor` | Brenda: huge blonde bouffant, magenta blazer, pearls | ≈1240 |
| `streamer` | backwards purple cap, white headset, neon green tee | ≈1080 |
| `cashier` | red cap, sleepy eyes, red vest | ≈1094 |
| `teacher` | Mr. Fig: bald with fluffy sides, bow tie, argyle vest (no lines) | ≈980 |

Crowds: `K.draw.kid(i, pose)`, `K.draw.adult(i, pose)`. Props from `rig/cast.js`: `keyRing({x, y, s, swing, gold, n})`, `mop({x, y, s, rot, len, bow})` (body-space, e.g. `props: [{ svg: mop({ x: hand(25, 1)[0] }), layer: 'front' }]`).

Non-rig characters (`require('../rig/lag')` or `K.draw.lag` etc.; they take these params, not rig poses):
- `lag({ x, y, size, t, mouth, mood, glitch, look, blink })` — centre at (x, y); height ≈ 380 × size px, width ≈ 560 × size (0.4 ≈ 150 px, 3 fills the frame). `mood`: neutral | hungry | angry | laugh | scared. Lip-sync: `mouth: K.V.viseme('LAG', t)` (null = closed). `glitch` 0..1 = RGB split + pixel slices. Use `t` (or `K.stutterT(t)`) to spin its wheels.
- `buffer({ x, y, s, t, mood, blink, hop, look })` — the shrunk Lag (feet at x, y; ≈120 px tall at s 1; next to kids at s 0.5 use s 0.5). Moods: happy | sad | surprised | sleepy | love | scared.
- `modbot({ x, y, s, t, face, roll, alarm, lean, talk, flip })` — wheel at (x, y), ≈880 px tall at s 1; `face` '!' | '?' | '#' | 'ok'; `roll` px spins the wheel; `alarm` 0..1 siren + beams; for its lines `talk: K.V.talking('MODBOT', t) ? 1 : 0`, `face: '#'` when "chat-filtered".

Performance: one character ≈ 20 ms at s 0.5, ≈ 35 ms at s 0.85 (mostly the volume filter). Lag size 3 ≈ 19 ms (32 ms with full glitch), Modbot ≈ 13 ms. Crowds of more than ~8 rig characters per frame get expensive: use `shade: false` or flat silhouettes for far crowds.

Pose fields (rig characters):

| Field | Meaning |
|---|---|
| `x, y` | Feet position in world/screen px |
| `s` | Scale: 0.5 ≈ 475 px tall, 0.62 ≈ 590 px tall (Pip is smaller by design) |
| `view` | `'front'` (default), `'side'` (faces screen-left), `'back'` |
| `flip` | Mirror (side view then faces right) |
| `turn` | −1..1, three-quarter turn in front view |
| `armL, armR` | Front view: degrees outward from hanging. 0 = down, 90 = horizontal, 180 = up. Side view: rotation, + = forward/up |
| `legL, legR, kneeL, kneeR` | Thigh angle and knee bend. Cycles from `require('./acting')`: `run(phase)`, `walk(phase)`, `walkFront(phase)`; spread them into the pose |
| `lean`, `bodyY`, `headRot`, `headY`, `rot`, `rotY`, `lift`, `sx`, `sy`, `shadow` | tilt, bob, head, whole-body rotation, jump height, squash/stretch, floor shadow |
| `props` | `[{svg, layer:'front'\|'back'\|'mid'\|'top'}]` in BODY space: feet at 0,0, head ≈ y −560…−980, shoulders ±100/−515 |
| `face` | Expression name or object |

Faces: `neutral happy talkHappy joy excited amazed shocked scared scream angry determined sad crying smug deadpan nervous confused sneaky yuck dizzy rich love oof sleepy cute`; object form `{ name, mouth, eyes:{type, look:[x,y], pupil, upper}, fx:[...] }` with mouths `line smile smallSmile frown smirk wavy cat grin bigGrin o O scream wail yawn teeth tongue uh`, eye types `closed happy star heart robux swirl x`, fx `sweat sweat2 blush tears question exclaim anger sparkles zzz redface steam eyebags hearts`.

Auto-acting (`act`): while a character speaks, the face comes from the line's `[tags]`, with gestures, head bob and blinks. `act = {energy:0..2, arms:false (keep your arm pose), face:'name'}`. An explicit `pose.face` wins; lip-sync stays on. `require('./acting').hand(armAngle, side)` gives a hand position for props.

## Kit (`scenes/kit.js`)

- Camera: `camKeys(t, [[t0,{zoom,x,y}],…])`, `view(cam, svg, k)` (parallax k), `K.shake(t, t0, dur, amp)`, `K.shaken(...)`, `K.E.camTf(cam, k)`.
- Shutdown helpers: `K.clock(sec)` → "HH:MM:SS"; `K.timerHUD(sec, opts)` (main.js draws it for you via `timer(t)`); `K.loadingWheel(x, y, r, t, col, n)`; `K.popup(x, y, w, h, title, lines, k, {size, accent, icon})` the grey system window; `K.badge(x, y, title, sub, k, t)` the golden "BADGE EARNED" toast.
- Lag effects: `K.stutterT(t, fps)` choppy time (animate with it to make motion "lag"); `K.rubber(t, t0, dur, amp, n)` rubber-band x offset; `K.pixelBlocks(x, y, w, h, t, k, col, size)` grey "still loading" squares; `K.ghost(svg, dx, k)` RGB-ghost duplicate.
- Generic: `K.phone(...)`, `K.tv(x, y, s, inner, ticker, t)`, `K.rain`, `K.confetti`, `K.sparkles`, `K.rays`, `K.bang(text, x, y, k, size, rot, col)`, `K.nameTag`, `K.sky(top, bottom, id)`.
- Common (`K.C`): `C.whiteFlash(k)`, `C.pixelWipe(p, 'cover'|'reveal')`, `C.vhs(t, label)`, `C.staticNoise(t, k)`, `C.speedLines(...)`, `C.dust(...)`, `C.burst(...)`.
- Robux-video props (`coin`, `robuxText`, `priceTag`, `gamePass`, `coinRain`, …) still exist; use them only if the story needs them.

## Visual language of this video

- **Colour script:** warm home (attic, living room: honey/orange/teal) → grey **lag** (desaturated, blocky, spinners) → cool blue **Server Farm** (blue/cyan LEDs, dark navy) → red **alarm** in the Core → golden **sunset** of the Great AFK → bright morning ending.
- **Lag as a visual device:** frames freezing (hold a pose, then jump), rubber-banding, textures loading as grey blocks, spinners, syllables repeating in captions. Use it wherever the Lag is near, and grow it over the story.
- **Recurring gags:** Pip's "Ding!" (a little elevator-bell sparkle), Dex's "no respawn", Grandpa's keys and mop, "Thanks for playing! Smiley face", the countdown.
- **Dynamic, never static:** cut or move the camera about every 3–4 s (~17 cuts/min): wides, close-ups, push-ins, pans, whip-pans (0.1 s white flash), smash-zooms on punchlines, split-screens, montages synced to words. Characters always move: gestures, reactions, squash and stretch, jumps, real walk cycles.
- **Sync hits to words** with `L(id).word('X').t0`; give each line's payoff an accent (burst, `bang()`, shake, flash, sparkle).
- **Leave room for captions** at the bottom (y > 950) or move them with `captionY`. Keep the top ~120 px clear when the HUD is visible.
- **Copy nothing** from the competitor channel (Skylox Story) or from our previous videos' scenes.

## Performance

A frame must render in under ~250 ms. Avoid CSS blend modes, SVG filters (other than the built-in body volume), masks, and thousands of tiny elements. Use `<pattern>` in `DEFS` for repeated textures. Keep particles under ~80.

## Checking your work

```bash
cd /home/user/animation/roblox-shutdown
node tools/stills.js /tmp/<scratch>/check.png 61.0 62.5 64.0 …   # 3-column contact sheet of exact times; view it with Read
```

Render stills densely: at least one every ~1.5 s across your whole range, plus every important beat. Fix anything off-frame, overlapping the captions, or broken. A scene module must not throw for any `t` inside its range.

## Shared sets

- **Home + world:** `scenes/sets.js` (index at the top of the file; contact sheet `concept/sets_home.png`). Room sets take `(t, opts)` and draw the full frame; most also have `.layers(t, opts)` → `{ bg, mid, fg, light }`: draw `bg` with parallax k ≈ 0.4–0.6, then `mid`, then your characters, then `fg` (occluders, k ≈ 1.15–1.3), then `light` (night/evening overlay, so characters get darkened too). Floors (`FLOOR`) and anchor points (`SPOTS`: laptop, router, couch seats, desks, hatch, …) are exported — use them so every scene stands characters in the same place.
- **Road + Server Farm:** `scenes/farm.js` (contact sheet `concept/sets_farm.png`), same conventions.
- Screens accept an SVG centred on the screen box or a function `(w, h) => svg`; `frameIn(svg, w, h)` puts a full 1920×1080 frame (e.g. `bubbleIsland(t)`) on a screen.
