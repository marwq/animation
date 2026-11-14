# Robux video: how to write a scene

Project: `/home/user/animation/robux-real`. The video is 1920×1080 at 60 fps and ~13:39 long. Frames are SVG strings rendered by headless Chromium (`tools/render.js`).

**The voice already exists.** `scenes/timeline.json` (built by `voice/timeline.py` from `voice/takes/*`) fixes when every line and every word is spoken. Animation is timed **to the voice**: never hard-code absolute seconds, derive them from lines and words.

Quality reference: **`scenes/s01.js`** (the cold open). Read it first; every scene should be at least this dynamic.

## Files you may and may not touch

- **Write only** your own scene module `scenes/sNN.js`, plus optional private helpers in `scenes/sNN_env.js`.
- **Do not edit** shared files: `scenes/kit.js`, `scenes/vo.js`, `scenes/common.js`, `scenes/env.js`, `scenes/main.js`, `rig/*`, `voice/*`. Copy what you need into your own file instead.
- `scenes/main.js` loads `sNN.js` by scene id and gives it time `t` in **absolute video seconds**. Your scene owns `[its first line's take start (or 0) … next scene's take start)`, which you get from `V.scene('SC NN')`.

## Module contract

```js
'use strict';
const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;              // L('03.4') → line; .a/.b = speech start/end; .word('MILLIONAIRE').t0/.t1
module.exports = {
  scene(t) { return '<svg elements…>'; },         // required: full 1920×1080 frame, without captions
  look(t) { return { grade: 'warm' }; },           // optional: 'warm' | 'cool' | 'night' | null, vignette 0..1
  DEFS: '<defs>…</defs>',                           // optional: static gradients/patterns with UNIQUE ids (prefix sNN)
  captionY(t) { return 1010; },                     // optional: move captions when they cover something
  noCaptions(t) { return false; },                  // optional
};
```

## Timing from the voice

- `node -e "const V=require('./scenes/vo');for(const l of V.TL.lines.filter(l=>l.scene==='SC 05'))console.log(l.id,l.speaker,l.speechStart.toFixed(2),l.speechEnd.toFixed(2),l.text)"` lists the lines of a scene.
  - Line ids are `take.index`, e.g. `05.3`. The takes are 01, 02, 03, 04, 05, 06, 06b, 07, 08a, 08b, 09, 10, 11, 12, 13.
- `L(id).a` / `L(id).b` give the speech start/end. `L(id).word('COINS').t0` gives one word; pass `n` to `.word(w, n)` for the n-th repeat.
- `V.scene('SC 05')` gives `{start, end}` of that take block. Your module also renders the gap until the next scene starts.
- **Captions, lip-sync and blinks are automatic.** `actor()` moves the mouth whenever that character speaks. Captions are drawn by `main.js`.

## Drawing characters

`actor(name, t, pose, act)`:
- `name` is one of `ty mia pickle dad mom grandma thirty anchor scammer butler`.
- `K.draw.kid(i, pose)` draws a random background kid; `i` picks the design.

Pose fields:

| Field | Meaning |
|---|---|
| `x, y` | Feet position in world/screen px |
| `s` | Scale: 0.5 ≈ 475 px tall, 0.62 ≈ 590 px tall |
| `view` | `'front'` (default), `'side'` (faces screen-left), `'back'` |
| `flip` | Mirror (side view then faces right) |
| `turn` | −1..1, three-quarter turn in front view |
| `armL, armR` | Front view: degrees outward from hanging. 0 = down, 90 = horizontal, 180 = up. Side view: rotation, + = forward/up |
| `legL, legR, kneeL, kneeR` | Thigh angle and knee bend in degrees. Run/walk cycles come from `require('./acting')`: `run(phase)`, `walk(phase)`, `walkFront(phase)`; spread them into the pose |
| `lean` | Torso tilt (deg) |
| `bodyY` | Squash/bob (+ = down) |
| `headRot, headY` | Head tilt and offset |
| `rot, rotY` | Rotate the whole body around y = rotY (flips, falling) |
| `lift` | Jump height (px, body space) |
| `sx, sy` | Squash and stretch |
| `shadow` | Floor shadow on/off |
| `props` | `[{svg, layer:'front'\|'back'\|'mid'\|'top'}]`, in BODY space: feet at 0,0, head ≈ y −560…−980, shoulders ±100/−515 |
| `face` | Expression name or object (see below) |

Face expression names: `neutral happy talkHappy joy excited amazed shocked scared scream angry determined sad crying smug deadpan nervous confused sneaky yuck dizzy rich love oof sleepy cute`.

A face object can also set:
- `mouth`: `line smile smallSmile frown smirk wavy cat grin bigGrin o O scream wail yawn teeth tongue uh`;
- `eyes`: `{type:'closed'|'happy'|'star'|'heart'|'robux'|'swirl'|'x', look:[x,y], pupil, upper}`;
- `fx`: list of `sweat sweat2 blush tears question exclaim anger sparkles zzz redface steam eyebags hearts`.

**Auto-acting** (`act` argument): when the character speaks, the face comes from the line's `[tags]`, with talking gestures, head bob and blinks. Control it with `act = {energy:0..2, arms:false (keep your arm pose), face:'name'}`. An explicit `pose.face` wins, but lip-sync stays on.

Hand position for props in front view: `require('./acting').hand(armAngle, side)` returns body-space `[x, y]` (side +1 = screen-right arm).

The cast (see `concept/cast_lineup.png`):
- **Ty**: teal beanie, mustard hoodie.
- **Mia**: lilac top bun, pink cardigan, bored half-lids, phone.
- **Pickle**: orange bowl cut, green pickle hoodie, ONE red shoe plus a sock.
- **Dad**: moustache, shirt and tie.
- **Mom**: auburn waves, sunglasses on her head.
- **Grandma**: grey bun, round purple glasses, pink headset.
- **thirty**: the Thirty Percent Guy, a tiny green goblin accountant with a visor. **He grows over the story:** use a bigger `s`, and in SC08/SC10 he's building-sized.
- **anchor**: news anchor Chip.
- **scammer**: a sign "FREE ROBUX" instead of a head.
- **butler**: Jeeves 3000, a chrome robot.

## Kit (`scenes/kit.js`)

**Camera:**
- `camKeys(t, [[t0,{zoom,x,y}],…])` eases between keys. `(x, y)` = how far the look-at point is from screen centre: the point `(960+x, 540+y)` lands at centre, and zoom scales around it.
- `view(cam, svg, k)` applies the camera with parallax `k` (bg 0.3–0.9, fg 1).
- `K.shake(t, t0, dur, amp)` → `{sx, sy}`; set `cam.sx/sy`.
- `K.E.camTf(cam, k)` gives the raw transform.

**Props and UI:**
- `K.coin(x, y, r, rot, spin)` draws a Robux coin; `K.grayCoin(...)` a grey one.
- `K.robuxText(x, y, '5,000', size)` and `K.priceTag(x, y, amount, s, rot)`.
- `K.gamePass(x, y, title, price, s, k, iconSvg)` pops up when `k` goes 0→1.
- `K.phone(x, y, s, rot, screenSvg)`: screen box `-150..150 × -280..280`.
- `K.tv(x, y, s, innerSvg, tickerText, t)`: news TV, screen box `-800..800 × -450..450`.
- `K.chart(x, y, w, h, pts[[u,v]], k, col, label)` draws a price graph.
- `K.counter(x, y, value, s)` shows a balance HUD.

**Particles and effects:**
- `K.coinRain(t, n, opts)`, `K.coinBurst(x, y, ageSec, n, power, r, seed)`, `K.rain(t, n)`, `K.confetti(t, t0)`, `K.sparkles([[x,y,r]], t)`.
- `K.rays(cx, cy, n, r, col, op, rot)`.
- `K.bang(text, x, y, k, size, rot, col)` writes punchy onomatopoeia.
- `K.nameTag(text, x, y)`.

**Common (`K.C`):**
- `C.whiteFlash(k)`, `C.pixelWipe(p, 'cover'|'reveal')`, `C.vhs(t, label)`, `C.staticNoise(t, k)`.
- `C.speedLines(x0, x1, y, n, seed, col, spread)`, `C.dust(x, y, t0, t)`, `C.burst(x, y, k)`.

**Old environment helpers (`K.E`)** — clouds, sun, layer, camTf. Use them only as primitives; **build NEW backgrounds** for this video.

## Style rules

- **Dynamic, never static.** Cut or change the camera about every 3–4 s, roughly 17 cuts/min.
  - Mix wide shots, close-ups, push-ins, pans, whip-pans (white flash 0.1 s at the cut), smash-zooms on punchlines, split-screens, quick montages synced to words.
  - Characters always move: gestures, reactions, squash and stretch, jumps, walks with real steps.
- **One location per joke** where the script asks for it. Build original, colourful backgrounds (gradients, simple shapes, a few details, no clutter), with parallax layers where the camera moves.
- **Sync visual hits to words:** `L(id).word('X').t0`. Give the payoff of each line a visual accent such as a burst, `bang()`, shake, flash or sparkle.
- **Leave room for captions** at the bottom (y > 950) or move them with `captionY`.
- **Copy nothing** from the competitor (Skylox Story) and nothing from the previous video.

## Performance

A frame must render in under ~250 ms.
- **Avoid:** CSS blend modes, SVG filters (other than the built-in body volume), masks, and thousands of tiny elements.
- **Use** `<pattern>` in `DEFS` for repeated textures (see `coinPile` in s01).
- **Keep** particle counts under about 80.

## Checking your work

```bash
cd /home/user/animation/robux-real
node tools/stills.js /tmp/<scratch>/check.png 61.0 62.5 64.0 …   # 3-column contact sheet of exact times; view it with Read
node scenes/main.js /tmp/<scratch>/clip.mp4 30 60 75            # optional short low-fps clip (slow: ~4 frames/s)
```

Render stills densely: at least one every ~1.5 s across your whole range, plus every important beat. Fix anything off-frame, overlapping the captions, or broken. A scene module must not throw for any `t` inside its range.
