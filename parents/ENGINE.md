# "What If Your PARENTS Joined Your Roblox Server?" — how to write a scene

Project: `/home/user/animation/parents`. 1920×1080, rendered at 30 fps (frames are SVG strings rendered by headless Chromium, `tools/render.js`). The video is about **13:00** long. Story and shot list: `script/SCRIPT.md` (Russian shot notes 🎬/💥/⏱ + the English voice lines).

**The real ElevenLabs voice exists** — `scenes/timeline.json` is built from the real takes by `voice/timeline.py` (with extra silent animation room after some lines, `AFTER` in that file). Still time animation **only through the voice API** (`L(id).a/.b`, `L(id).word(...)`) — never hard-code absolute seconds — so small re-timings stay safe.

The hero of the channel is **YOU** (`actor('you', …)`): orange bowl-cut hair, white face, huge round eyes, red open jacket, yellow T-shirt, dark green pants. In the game his avatar looks exactly the same (nametag YOU, LVL 99). He is in almost every scene; keep him on model. The NARRATOR talks to the viewer as "you" (second person); the hero has his own lines as YOU.

**Two worlds:** the real living room / house (real Dad, Mom, Grandma at their devices) and **Cube City**, the in-game world (their avatars: Dad = the hot dog DadBod1978, Mom = MOM_OFFICIAL, Grandma = GrannyGoodies; plus NoodleBoi, xX_DarkBlade_Xx, players, the Block King). Cut between them constantly: a line spoken by a real person at the keyboard pops up as chat over their avatar.

Quality references (same engine, earlier videos — study the level of dynamics and polish, **don't copy content**): `/home/user/animation/respawn/scenes/s02.js`, `s05.js`, `s10.js` and `/home/user/animation/admin-commands/scenes/s04.js`.

## Reference docs (read the ones you need)

| Doc | What |
|---|---|
| `docs/CAST.md` | every character key: the real family (dad, mom, grandma, teen mom 1998), their avatars (dadAvatar = hot dog, momAvatar, grandmaAvatar), YOU, noodle, darkblade (+ clan), players/noobs, the Block King boss — looks, sizes, options, props — sheets `concept/cast_*.png` |
| `docs/GAMEUI.md` | `scenes/gameui.js`: chat bubbles + chat log, "joined the server" toasts, leaderboard billboard, coins/HUD, emotes (hearts…), avatar-editor UI, device frames (laptop/tablet/phone/PC showing the game), combat FX (slash, KO, damage numbers), boss health bar + shield dome, party UI, VICTORY / MVP cards, server-health bar, typing capslock chat — sheet `concept/gameui.png`. `scenes/respawn.js` (the previous video's FX kit: crumble, respawnPop, counterHUD, sysWindow, foam, confetti…) is still available — see `/home/user/animation/respawn/docs/FX.md` |
| `docs/SETS_HOUSE.md` | `scenes/sets_house.js`: kitchen (Saturday breakfast), living room game-night setup (couch + 4 devices), hero's bedroom (night talk) — sheet `concept/sets_house.png` |
| `docs/SETS_GAME.md` | `scenes/sets_game.js`: Cube City — spawn plaza/lobby with the first obby over water, Battle Arena, Tycoon Valley (cookie stand → skyscraper, the hero's castle), the obby tower over lava (100 floors, crystal on top), the city at night with the Block King — sheet `concept/sets_game.png` |

## Files you may and may not touch

- **Write only** your own scene module(s) `scenes/sNN.js`, plus optional private helpers in `scenes/sNN_env.js`.
- **Read-only shared files:** `scenes/kit.js`, `scenes/gameui.js`, `scenes/respawn.js`, `scenes/vo.js`, `scenes/common.js`, `scenes/env.js`, `scenes/main.js`, `scenes/sets_house.js`, `scenes/sets_game.js`, `rig/*`, `voice/*`. If you need something different, copy it into your own file.
- `scenes/main.js` loads `sNN.js` by scene id and gives it time `t` in **absolute video seconds**. Your scene owns `[its first take start (or 0) … next scene's take start)`: get the range with `node -e "console.log(require('./scenes/main').RANGES)"`.

## Module contract

```js
'use strict';
const K = require('./kit');
const G = require('./gameui');    // game UI (docs/GAMEUI.md)
const R = require('./respawn');   // generic FX kit from the Respawn video
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;              // L('03.4') → line; .a/.b = speech start/end; .word('STAGE').t0/.t1
module.exports = {
  scene(t) { return '<svg elements…>'; },         // required: full 1920×1080 frame, without captions
  look(t) { return { grade: 'warm' }; },           // optional: 'warm' | 'cool' | 'night' | null, vignette 0..1
  DEFS: '<defs>…</defs>',                           // optional: static gradients/patterns with UNIQUE ids (prefix sNN)
  captionY(t) { return 1010; },                     // optional: move captions when they cover something
  noCaptions(t) { return false; },                  // optional
};
```

## Timing from the voice

- List a scene's lines: `node -e "const V=require('./scenes/vo');for(const l of V.TL.lines.filter(l=>l.scene==='SC 05'))console.log(l.id,l.speaker,l.speechStart.toFixed(2),l.speechEnd.toFixed(2),l.text)"`.
- Line ids are `take.index`, e.g. `05.3`; takes are 01 … 12 (one per scene).
- `L(id).a` / `L(id).b` = speech start/end; `L(id).word('ATTEMPT').t0`; `.word(w, n)` for the n-th repeat.
- **Captions, lip-sync and blinks are automatic.** `actor()` moves the mouth whenever that character speaks (YOU, DAD, MOM, GRANDMA, NOODLE, DARKBLADE, KID — real people and their avatars share the speaker; see docs/CAST.md for how avatars without mouths show speech, e.g. chat bubbles). SYSTEM is a voice only (show it as game toasts). Captions are drawn by `main.js`.
- Silent beats from the script (⏱) are already in the timeline as gaps after lines (`line.beatAfter`).

## Drawing characters

`actor(name, t, pose, act)` draws a rig character — the keys, sizes and options are in `docs/CAST.md`. Pose fields (all rig characters):

| Field | Meaning |
|---|---|
| `x, y` | Feet position in world/screen px |
| `s` | Scale: 0.5 ≈ 475 px tall for the hero |
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

Performance: a character ≈ 20 ms at s 0.5; giant close-ups of rig characters are expensive → pass `volume: false` for huge close-ups. Crowds: `K.draw.kid(i, pose)` / `K.draw.adult(i, pose)`.

## Kit (`scenes/kit.js`)

- Camera: `camKeys(t, [[t0,{zoom,x,y,rot}],…])`, `view(cam, svg, k)` (parallax k), `K.shake(t, t0, dur, amp)`, `K.shaken(...)`, `K.E.camTf(cam, k)`.
- System-ish UI: `K.loadingWheel(x, y, r, t, col, n)`, `K.popup(x, y, w, h, title, lines, k, {size, accent, icon})` the grey system window, `K.badge(x, y, title, sub, k, t)` golden toast, `K.timerHUD`, `K.clock`.
- Glitch: `K.rubber`, `K.ghost`, `K.stutterT`, `K.pixelBlocks`.
- Generic: `K.phone(...)`, `K.tv(x, y, s, inner, ticker, t)`, `K.rain`, `K.confetti`, `K.sparkles`, `K.rays`, `K.bang(text, x, y, k, size, rot, col)`, `K.nameTag`, `K.sky(top, bottom, id)`.
- Common (`K.C`): `C.whiteFlash(k)`, `C.pixelWipe(p, 'cover'|'reveal')`, `C.vhs(t, label)`, `C.staticNoise(t, k)`, `C.speedLines(...)`, `C.dust(...)`, `C.burst(...)`.
- Robux / admin-chat props (`coin`, `chatCommand`, …) still exist from older videos; this story doesn't need them.

## Visual language of this video

- **Colour script:** Cube City by day (saturated candy colours, blue sky, bright UI) ↔ the cosy real house (warm lamp light, beige/teal, Saturday morning sun) → evening game night (TV/laptop glow on faces) → the arena (stone, banners, golden light) → Tycoon Valley (pastel bakery pinks growing into a glass skyscraper) → the lobby at sunset (gold) → the emotional bedroom talk (dim blue, one warm lamp) → the Block King night (deep purple/red, fire, purple boss glow) → the obby tower over lava under the moon → victory dawn (gold + confetti) → the sleeping family (soft TV blue).
- **Two worlds, one cut:** match-cuts between a real person at the keyboard and their avatar doing the same thing (Dad shouts "JUMP!" at the laptop → the hot dog doesn't jump). Device frames (laptop/tablet/phone) showing the game are great transitions.
- **Game UI sells the comedy:** chat bubbles typed letter by letter (Dad's CAPS LOCK), "joined the server" toasts, the leaderboard billboard, coin counters, emote hearts, KO stars, the boss health bar.
- **Recurring gags:** Dad can't jump ("SPACE! BAR!"), Mom's sweet care-talk while destroying players, Granny's prices and rent, Noodle's "bro bro bro", DarkBlade's edgy act cracking.
- **Dynamic, never static:** cut or move the camera about every 3–4 s (~17 cuts/min): wides, close-ups, push-ins, pans, whip-pans (0.1 s white flash), smash-zooms on punchlines, split-screens (real face | avatar), montages synced to words. Characters always move: gestures, reactions, squash and stretch, jumps, real walk cycles.
- **Sync hits to words** with `L(id).word('X').t0`; give each line's payoff an accent (burst, `bang()`, shake, flash, sparkle).
- **Leave room for captions** at the bottom (y > 950) or move them with `captionY`.
- **Copy nothing** from the competitor channel (Skylox Story) or from our previous videos' scenes.

## Performance

A frame must render in under ~250 ms. Avoid CSS blend modes, SVG filters (other than the built-in body volume), masks, big radial gradients (≈ 220 ms per full frame) and thousands of tiny elements. Use `<pattern>` in `DEFS` for repeated textures. Keep particles under ~80 (block bursts included).

## Checking your work

```bash
cd /home/user/animation/parents
node tools/stills.js /tmp/<scratch>/check.png 61.0 62.5 64.0 …   # 3-column contact sheet of exact times; view it with Read
```

Render stills densely: at least one every ~1.5 s across your whole range, plus every important beat. Fix anything off-frame, overlapping the captions, or broken. A scene module must not throw for any `t` inside its range.
