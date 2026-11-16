# "What If You Had ADMIN COMMANDS in Real Life?" — how to write a scene

Project: `/home/user/animation/admin-commands`. 1920×1080, rendered at 30 fps (frames are SVG strings rendered by headless Chromium, `tools/render.js`). The video is about **13:16** long.

**The voice does NOT exist yet — the timeline is PROVISIONAL.** `scenes/timeline.json` was built by `voice/provisional.py` from the script with ESTIMATED word times. Later the real voice replaces it (`voice/timeline.py`) and every line and word moves a little. So animation must be timed **only through the voice API** (`L(id).a/.b`, `L(id).word(...)`, `V.scene(...)`) — never hard-code absolute seconds, never assume a gap length; make beats elastic (e.g. ease between two word times, hold poses until the next word) so they still work when words shift by ±20%.

The hero of the channel is **YOU** (`actor('you', …)`): orange bowl-cut hair, white face, huge round eyes, red open jacket, yellow T-shirt, dark green pants. He is in almost every scene; keep him on model. The NARRATOR talks to the viewer as "you" (second person), the hero has his own lines as YOU.

Quality references (same engine, earlier videos — study the level of dynamics and polish, **don't copy content**): `/home/user/animation/roblox-shutdown/scenes/s02.js`, `s04.js`, `s08.js`.

## Files you may and may not touch

- **Write only** your own scene module(s) `scenes/sNN.js`, plus optional private helpers in `scenes/sNN_env.js`.
- **Read-only shared files:** `scenes/kit.js`, `scenes/vo.js`, `scenes/common.js`, `scenes/env.js`, `scenes/main.js`, `scenes/sets.js` (home + school sets), `scenes/city.js` (city, world and server-room sets), `rig/*` (characters; `rig/cats.js` = Pancake and the giant cats), `voice/*`. If you need something different, copy it into your own file.
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
  DEFS: '<defs>…</defs>',                           // optional: static gradients/patterns with UNIQUE ids (prefix sNN)
  captionY(t) { return 1010; },                     // optional: move captions when they cover something
  noCaptions(t) { return false; },                  // optional
};
```

### Commands on screen
Every command is a chat line. Use `K.chatCommand(x, y, ';fly me', progress, { t, enter, theme, user, s })`: `progress` 0..1 = letters typed; drive it with `K.typeProgress(t, L(id), fromWord, toWord)` so the letters follow the spoken words; `enter` 0..1 flashes the bar when the command fires (right after the last word), then show the effect with `K.commandBurst(x, y, age, col)`. The Admin's commands use `theme: 'admin', user: 'ADMIN'` (white/gold, huge, in the sky). Errors: `K.denied(x, y, k)`, success: `K.accepted(x, y, k)`. The hero usually holds the laptop (prop) or the command floats near him.

## Timing from the voice

- List a scene's lines: `node -e "const V=require('./scenes/vo');for(const l of V.TL.lines.filter(l=>l.scene==='SC 05'))console.log(l.id,l.speaker,l.speechStart.toFixed(2),l.speechEnd.toFixed(2),l.text)"`.
- Line ids are `take.index`, e.g. `05.3`; takes are 01–13 (one per scene).
- `L(id).a` / `L(id).b` = speech start/end; `L(id).word('COINS').t0`; `.word(w, n)` for the n-th repeat.
- **Captions, lip-sync and blinks are automatic.** `actor()` moves the mouth whenever that character speaks. Captions are drawn by `main.js`.
- Silent beats from the script (⏱) are already in the timeline as gaps after lines (`line.beatAfter`).

## Drawing characters

`actor(name, t, pose, act)` draws a rig character (look at `concept/cast_lineup.png`, `cast_expressions.png`, `cast_turnaround.png`). Speaking characters lip-sync automatically (YOU, ZOE, BRICK, DAD, MOM, GRANNY, OLDMAN, ADMIN, ANCHOR, BOSS, PRINCIPAL, COACH, KID); the NARRATOR is off-screen.

| Key | Look | Height at s 1 (px) | Options |
|---|---|---|---|
| `you` | THE HERO: orange bowl cut, white face, huge eyes, red jacket, yellow T-shirt, dark green pants | 951 | — keep him on model |
| `zoe` | best friend: purple bob, big black glasses, orange cursor hoodie | 933 | `laptop: true \| 'closed' \| 'screen'`, `laptopScreen: svg` |
| `brick` | the bully: huge (1.3), backwards cap, tank top, brick fists | 1362 | sad/shy ending: `face: { name: 'sad', eyes: { look: [.6, .6] }, fx: ['blush', 'sweat'], mouth: 'wavy' }` |
| `dad` | balding, glasses, shirt + tie, duck pyjama bottoms, headset | 1040 | `headset: false` |
| `mom` | neat ponytail, apron, sticky notes | 1097 | `notes: true \| 'WORD'` (pad in her hand) |
| `granny` | 91: white curls, cardigan, glasses on a chain, slippers | 911 | `fast: true` (hair blown back; add `fireTrail`) |
| `oldman` | the garage-sale old man (secretly the Admin): tiny, long beard, cardigan, crown pin | 735 | — |
| `admin` | the ADMIN: white robe of code, golden ADMIN crown, face of pure light with gold eyes, no mouth (light pulses when he speaks) | 1485 | `glow: 0..1`; pass `t` in the pose (code scroll, cape) |
| `anchor` | Rex Ratings, news anchor | 1209 | — |
| `boss` | Mr. Gray, Dad's boss (video call) | 1049 | — |
| `principal` | Principal Pratt, mug | 1208 | `mug: false`, `steam: 0..1` (pass `t`) |
| `coach` | Coach Hale, whistle | 1170 | `whistle: 'mouth'` |

Crowds: `K.draw.kid(i, pose)` / `K.draw.adult(i, pose)` (or `actor('kid', t, { i, … })`; the KID line lip-syncs on the kid you draw with `actor`).

Props from `rig/cast.js` (body space, feet at 0,0 → usable in `pose.props`, or in screen space): `zoeLaptop({ x, y, s, rot, open, face, screen })`, `stickyNote(x, y, s, rot, text, col)`, `stickyStack({ x, y, s, rot, text, n })`, `coffeeMug({ x, y, s, rot, steam, t })`, `whistle(x, y, s, rot)`, `fireTrail({ x, y, len, angle, w, t, alpha })` or `fireTrail({ pts: [[x, y], …], w, t })` (Granny's flame trail). Hand positions: `[±(shoulderX + 252·sin a), −515 + 252·cos a]` with shoulderX 100 (Brick 128, Dad 104, Pratt 96, Coach 108), or `require('./acting').hand(a, side)`.

Cats (`require('../rig/cats')`, look at `concept/cats.png`): `pancake({ x, y, s, t, pose, mood, blink, crown, look, flip, rot, mouth, keyboard, zzz })` — poses `sit loaf walk sleep pounce lie paw`, moods `lazy smug happy surprised angry`, `mouth` `w smirk open o hiss meow`, `crown: true` = the final ADMIN gag; sitting Pancake ≈ 258 px at s 1 (in proportion with rig characters at the same s; s 6+ fills the frame). `cat({ …, coat, seed })` coats `black white grey calico siamese tabby`.

Performance: a character ≈ 20 ms at s 0.5 (Brick ≈ 35–48 ms); giant close-ups of rig characters are expensive (Brick at s 1.6 ≈ 200 ms) → pass `volume: false` for huge close-ups. 20 small cats ≈ 60 ms. Avoid big radial gradients (≈ 220 ms per full frame) and diagonal linear gradients.

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
- Command UI: `K.chatCommand`, `K.typeProgress`, `K.denied`, `K.accepted`, `K.commandBurst` (see "Commands on screen"). Glitch helpers still exist: `K.rubber`, `K.ghost`, `K.stutterT` (e.g. for kick / pixel-dissolve moments).
- Generic: `K.phone(...)`, `K.tv(x, y, s, inner, ticker, t)`, `K.rain`, `K.confetti`, `K.sparkles`, `K.rays`, `K.bang(text, x, y, k, size, rot, col)`, `K.nameTag`, `K.sky(top, bottom, id)`.
- Common (`K.C`): `C.whiteFlash(k)`, `C.pixelWipe(p, 'cover'|'reveal')`, `C.vhs(t, label)`, `C.staticNoise(t, k)`, `C.speedLines(...)`, `C.dust(...)`, `C.burst(...)`.
- Robux-video props (`coin`, `robuxText`, `priceTag`, `gamePass`, `coinRain`, …) still exist; use them only if the story needs them.

## Visual language of this video

- **Colour script:** cosy home (warm yellows, oranges) → school (sky blue, lockers) → garage sale on "Server Street" (eerie violet, flickering lamps) → city in chaos at sunset/night (purple, pink, neon pop-ups) → the Admin's cold white-gold light → the warm amber server room → soft dawn → bright normal morning.
- **Commands as a visual device:** the chat line types on the hero's words, ENTER flash, command burst at the target, then the effect with squash-and-stretch. The Admin's commands are giant white-gold chat windows in the sky.
- **Recurring gags:** Dad's "Can you hear me now?", Mom's sticky notes, Pancake on the keyboard, the Admin "always has a bigger number", Granny's speed fire-trail.
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

SHARED_SETS_PLACEHOLDER
