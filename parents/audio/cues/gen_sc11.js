#!/usr/bin/env node
// Sound cue sheet generator for SC 11 · JUMP, DAD! (the climax): the REPLAY (bonk + splash), the VS slam, the whip-tilt up
// 100 floors, the real Dad over the JUMP!-taped space bar, every jump of the climb (route from scenes/s11_env.js), the slip,
// the checkpoints, the server chant + chat flood, DarkBlade's JUMP!, the wobble on floor 88, the final gap, the slow-motion
// leap (music drops out: heartbeat + wind), GRAB, the dive into the crystal (glass + explosion + light), the dome shatter,
// the attack, the crumble, VICTORY at dawn, the summit teleport + toss, Mom on the couch, the big jump, the hug, MVP.
// Every time comes from the voice timeline exactly like scenes/s11.js: the cut list (CUT), the beats (BEATS) and the jump
// route (HOPS) are imported from the scene module itself (built only from L(id).a/.b and .word()). When the voice changes:
//   node audio/cues/gen_sc11.js && python3 audio/validate_cues.py audio/cues/sc11.json
// Output: audio/cues/sc11.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { CUT: C, BEATS: B, HOPS } = require('../../scenes/s11');
const { L } = V;

const l = (i) => L('11.' + i);
const T0 = V.scene('SC 11').start, END = V.scene('SC 12').start;    // == main.js RANGES for SC 11

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const lerp = (a, c, k) => a + (c - a) * k;
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));     // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(t), name, g, pan, note]); };
const inAny = (t, wins) => wins.some(([a, b]) => t >= a && t < b);

// ================================================================= SFX, shot by shot (same order as scenes/s11.js)
// ---- 1. "Dad." the hot dog at the foot of the tower
add(T0, 'whoosh_up', -8, 0, 'whip-tilt in from SC 10');
add(C.dad + 0.5, 'gulp', -4, 0.1, 'the hot dog gulps, looking up');
// ---- 2. the REPLAY: walking into the wall, BONK; the splash; CAN'T JUMP
add(C.replay, 'rewind', -6, 0, 'grey REPLAY flashback');
add(C.replay + 0.05, 'vhs_clunk', -10, -0.4, 'VHS overlay');
add(B.bonk, 'bonk', 0, 0.05, 'BONK! the hot dog walks into the wall');
add(C.splash, 'whoosh_down', -6, 0.1, 'off the start block');
add(B.splash, 'big_splash', 0, 0.05, 'SPLASH! into the water');
add(B.splash + 0.1, 'stamp', -2, -0.25, "CAN'T JUMP stamp");
// ---- 3. back at the foot of the tower
add(C.look, 'whoosh', -8, 0, 'cut back to the tower');
add(C.look + 0.2, 'wind_gust', -8, 0, 'the tower disappears into the night');
// ---- 4. VS card
add(C.vs, 'whoosh', -4, -0.5, 'the hot dog panel slides in');
add(C.vs + 0.08, 'whoosh', -4, 0.5, 'the tower panel slides in');
add(B.vs + 0.12, 'orch_hit', 2, 0, 'VS slams in');
add(B.vs + 0.14, 'impact', -4, 0, 'VS shake');
// ---- 5. whip-tilt up 100 floors
add(C.tilt, 'whoosh_long', -2, 0, 'whip-tilt up the tower');
add(C.tilt + 0.05, 'riser', -4, 0, 'floor counter rolling 1 -> 100');
for (let i = 0; i < 10; i++) add(lerp(C.tilt + 0.1, B.top - 0.05, i / 9), 'tap', -14, -0.6, 'counter tick');
add(B.top, 'impact', -2, 0, '100! arrives at the summit');
add(B.top + 0.03, 'shine', -2, 0.1, 'the crystal glints');
add(B.top + 0.2, 'magic', -8, 0.1, 'crystal hum');
// ---- 6. the real Dad sweating, tongue out
add(C.real, 'whoosh', -8, 0, 'cut to the living room');
add(C.real + 0.2, 'heartbeat', -6, 0, 'tension');
add(C.real + 0.6, 'cloth', -12, -0.1, 'Dad flexes his fingers');
add(C.real + 1.05, 'heartbeat', -6, 0, 'tension');
// ---- 7. the keyboard: finger hovering, sweat drops, CLICK
add(C.keys, 'zoom_in', -10, 0.2, 'push in on the space bar');
for (const [d, x] of [[0.35, -0.2], [0.8, 0.3], [1.15, 0]]) add(C.keys + d + 0.45, 'tap', -10, x, 'a sweat drop lands on a key');
add(B.press, 'click', 2, 0, 'CLICK! the space bar');
add(B.press + 0.01, 'impact', -4, 0, 'smash zoom');
// ---- 8-12. the climb: every visible jump of the route + checkpoints
const VIS = [[C.jump1, C.gasp], [C.again, C.watch], [C.climb2, C.chant], [C.climb3, C.dark], [C.wobble, C.realWob], [C.gap, C.you]];
for (const h of HOPS) {
  if (!inAny(h.t0, VIS) && !inAny(h.t1, VIS)) continue;
  const auto = h.t1 - h.t0 < 0.35;
  if (inAny(h.t0, VIS)) add(h.t0, 'jump_game', auto ? -8 : -2, 0, `jump ${h.a} -> ${h.b}`);
  if (inAny(h.t1, VIS)) add(h.t1, 'land', auto ? -12 : -4, 0, `lands on ${h.b}`);
}
add(B.land1 + 0.02, 'sparkle', -6, 0, 'he LANDED (burst + !!!)');
add(B.land1 + 0.05, 'ui_pop', -10, -0.8, 'FLOOR 1/100 HUD pops in');
add(C.gasp, 'crowd_gasp', 0, 0, 'the fighters freeze and gasp');
add(C.gasp + 0.08, 'chat_pop', -6, -0.3, '"HE JUMPED?!"');
add(B.land3 + 0.08, 'confirm', -10, 0, 'fist pump on floor 3');
add(B.slip, 'slip', 0, 0, 'he lands on the ice and slips');
add(B.slip + 0.05, 'skid', -4, 0.1, 'SKRRT! sliding to the edge');
add(B.slip + 0.6, 'whoosh', -10, -0.1, 'windmilling arms');
add(B.slip + 1.1, 'whoosh', -10, 0.1, 'windmilling arms');
add(B.catch, 'harp_up', -6, 0, '...and didn\'t fall (PHEW!)');
add(B.land10, 'level_up', -2, 0, 'checkpoint 10 saved (green wave)');
add(B.land10 + 0.05, 'ui_pop', -8, -0.8, 'Checkpoint saved toast');
// ---- 13-14. the server stops fighting; Noodle starts the chant
add(C.watch, 'whoosh', -8, 0, 'cut to the battlefield');
add(C.watch + 0.1, 'crowd_gasp', -4, 0, 'everyone turns to the tower');
add(C.watch + 0.25, 'chat_pop', -8, 0.6, 'chat: is that the hot dog??');
add(C.watch + 0.65, 'chat_pop', -8, 0.6, 'chat: HE JUMPED');
add(C.watch + 0.5, 'squeak', -12, -0.7, 'the Block King: ?');
add(B.chant[0] - 0.3, 'chat_pop', -6, 0, "Noodle's bubble");
add(B.chant[2], 'impact', -8, 0.5, 'JUMP! bang');
add(B.chant[3], 'impact', -6, 0.5, 'DAD! bang');
add(B.chant[2] + 0.05, 'crowd_cheer', -6, 0, 'the players join the chant');
// ---- 15-17. montage + the chanting wide + checkpoint 60
add(C.climb2, 'whoosh_up', -6, 0, 'whip up to floor 21');
add(C.climb2b, 'whoosh_up', -6, 0, 'whip up to floor 37');
for (let i = 0; i < 14; i++) add(lerp(C.climb2 + 0.1, C.climb3 - 0.1, i / 13) + 0.05 * hash(i), 'chat_pop', -14, r3((hash(i * 3.3) - 0.5) * 1.2), 'chat flood: JUMP DAD');
add(C.chant, 'crowd_cheer', 0, 0, 'the whole server chants');
for (let k = Math.ceil(C.chant * 1.85); k / 1.85 < C.climb3; k++) add(k / 1.85, 'impact', -9, k % 2 ? P(1010) : P(560), k % 2 ? 'DAD! (chant beat)' : 'JUMP! (chant beat)');
add(C.climb3, 'whoosh_up', -6, 0, 'whip up to floor 57');
{ const cp = HOPS.find((h) => h.b === 60); if (cp) { add(cp.t1, 'level_up', -6, 0, 'checkpoint 60'); add(cp.t1 + 0.05, 'ui_pop', -10, -0.8, 'toast'); } }
// ---- 18. DarkBlade
add(C.dark, 'whoosh', -8, 0, 'cut to DarkBlade');
add(l(5).a - 0.3, 'chat_pop', -6, 0, "DarkBlade's bubble");
add(l(5).a, 'swish', -8, 0.2, 'sword pump');
add(B.darkJump - 0.04, 'zoom_in', -6, 0, 'smash zoom');
add(B.darkJump, 'metal_hit', -2, 0, 'JUMP!! sword thrust to the sky');
add(B.darkJump + 0.02, 'crowd_cheer', -6, 0.3, 'the clan roars');
// ---- 19-21. icy floor 88: no no no... okay
add(B.land88, 'slip', 0, 0.2, 'lands on the ice of floor 88');
add(B.land88 + 0.05, 'skid', -4, 0.3, 'sliding to the edge');
add(l(6).a - 0.25, 'chat_pop', -8, 0.1, 'CAPS bubble pops');
for (let i = 0; i < 3; i++) add(B.land88 + 0.25 + i * 0.26, 'whoosh', -12, 0.3, 'windmilling');
add(C.realWob, 'whoosh', -8, 0, 'cut to the real Dad leaning');
add(C.realWob + 0.1, 'cloth', -8, 0.2, 'the whole family leans right');
add(C.okay, 'wind_gust', -8, 0.3, 'teetering over the abyss');
add(B.okay2, 'land', -6, 0, 'back onto the ice');
add(B.okay3, 'sparkle', -8, 0, "thumbs-up: I'm okay!");
add(l(6).word('Okay').t0, 'typing', -12, 0, 'caps typing');
// ---- 22. floor 99, the final gap
add(C.gap + 0.05, 'notify', -6, 0, 'FINAL JUMP banner unfurls');
add(B.land99 + 0.35, 'dramatic', -2, 0.3, 'the gap revealed');
// ---- 23. "JUMP, DAD, JUMP!"
add(C.you, 'whoosh', -8, 0, 'cut to the hero');
B.youW.forEach((w, i) => { add(w - 0.04, 'zoom_in', -8, 0, `smash zoom ${i + 1}`); add(w, 'impact', -6 + i * 2, 0, `"${['JUMP', 'DAD', 'JUMP'][i]}"`); });
add(C.you + 0.1, 'crowd_cheer', -6, 0, 'the crowd behind him');
// ---- 24-26. "For my son." + the press
add(C.son1, 'wind_gust', -8, -0.2, 'wind at the edge of floor 99 (letterbox)');
add(C.son1 + 0.2, 'heartbeat', -4, 0, 'heartbeat');
add(C.son2 + 0.1, 'heartbeat', -4, 0, 'heartbeat');
add(B.press2 - 0.02, 'click', 3, 0, 'the space bar SLAMMED');
add(B.press2, 'sub_drop', -2, 0, 'smash zoom + white flash');
// ---- 27-30. the slow-motion leap, GRAB, up, the dive, the crystal shatters
add(B.launch, 'jump_game', 0, -0.2, 'the final jump');
add(B.launch + 0.05, 'whoosh_long', -4, 0.2, 'slow-motion flight across the giant moon');
add(B.launch + 0.15, 'wind_gust', -8, 0, 'slow-mo wind');
add(B.launch + 0.35, 'heartbeat', -2, 0, 'slow-mo heartbeat');
add(B.launch + 0.8, 'heartbeat', -2, 0, 'slow-mo heartbeat');
add(B.grab - 0.25, 'fall_whistle', -8, 0.4, "he's short...");
add(B.grab, 'slap', 2, 0.2, 'GRAB! hands slap the lip');
add(B.grab + 0.02, 'crowd_gasp', -6, 0, 'the server gasps');
add(B.grab + 0.08, 'rock_drop', -10, -0.2, 'pebbles knocked off the lip fall into the abyss');
add(B.grab + 0.15, 'squeak', -12, -0.1, 'fingers slipping on the lip');
add(C.pull + 0.05, 'cloth', -8, -0.1, 'hauling himself up (HNNG!)');
add(C.pull + 0.08, 'impact', -10, -0.3, 'HNNG! bang');
add(B.up, 'thud', -4, -0.1, 'feet on the summit');
for (let t = C.dive + 0.05; t < B.dive; t += Math.PI / 16) add(t, 'step', -8, 0, 'two steps run-up');
add(B.dive, 'whoosh', -2, 0.2, 'the hot dog dives head-first');
add(B.hit - 0.55, 'reverse_swell', -2, 0, 'into the impact');
add(B.hit, 'glass', 4, 0.2, 'the crystal shatters');
add(B.hit + 0.01, 'explosion', 0, 0, 'full-frame light burst');
add(B.hit + 0.05, 'shine', -2, 0, 'light');
// ---- 31. "NO!" the dome shatters
add(C.no + 0.08, 'glass', 0, -0.4, 'the shield dome shatters');
add(C.no + 0.1, 'powerdown', -4, -0.4, 'the shield is gone');
add(C.no + 0.15, 'rumble', -6, -0.4, 'the Block King recoils');
add(C.no + 0.3, 'ui_close', -8, 0, 'boss bar: SHIELD BROKEN');
// ---- 32. everyone attacks
add(C.attack, 'crowd_cheer', 2, 0.3, 'CHARGE!');
for (let i = 0; i < 9; i++) {
  const t = C.attack + 0.25 + i * 0.13;
  add(t, 'swish', -6, -0.4, `slash ${i + 1}`);
  add(t + 0.05, i % 4 === 3 ? 'impact' : 'punch', i % 4 === 3 ? 0 : -5, -0.4, i % 4 === 3 ? 'CRIT hit' : 'hit');
}
add(C.attack + 0.6, 'stone', -6, -0.5, 'stone chips fly');
// ---- 33. "Defeated... by a HOT DOG?!"
for (let i = 0; i < 4; i++) for (let k = 0; k < 2; k++) add(C.defeat + i * 0.37 + k * 1.5, 'punch', -9, -0.2, 'hits keep landing');
add(B.hotdog - 0.35, 'ui_pop', -4, 0.6, 'spectator cam: LIVE hot dog');
add(B.hotdog + 0.3, 'dizzy', -4, -0.2, 'X eyes on "DOG?!"');
// ---- 34. the crumble
add(C.crumble, 'rumble', -4, -0.5, 'cracks glowing');
add(B.crumble, 'explosion', 2, -0.5, 'the Block King bursts');
add(B.crumble + 0.05, 'rock_drop', -2, -0.5, 'stone cubes tumble');
add(B.crumble + 0.35, 'confetti', -2, -0.4, 'cube confetti burst');
add(B.crumble + 0.5, 'stone', -6, -0.5, 'cubes land');
add(B.crumble + 1.05, 'metal_clank', -4, -0.3, 'the crown hits the ground');
add(B.crumble + 0.25, 'crowd_cheer', 0, 0, 'the server cheers');
// ---- 35. VICTORY at dawn
add(B.victory - 0.1, 'orch_hit', 2, 0, 'VICTORY!');
add(B.victory, 'tada', 0, 0, 'victory card');
add(B.victory + 0.05, 'confetti', -4, 0, 'confetti rain');
add(B.victory + 0.4, 'harp_up', -6, -0.5, 'dawn: the sky turns gold');
add(B.saved - 0.1, 'upgrade', -4, 0, 'SERVER HEALTH refills');
add(B.saved + 1.1, 'achievement', -4, 0, 'server saved 100%');
// ---- 36. the summit: everyone teleports in
add(C.summit, 'whoosh_up', -6, 0, 'whip up to the summit');
for (let i = 0; i < 9; i++) add(B.pops + i * 0.09, 'teleport', -9, r3((hash(i * 2.1) - 0.5) * 1.0), `player ${i + 1} teleports in`);
add(C.summit + 0.12, 'notify', -6, 0, '"Everyone teleported to the summit!"');
add(C.summit + 0.7, 'crowd_cheer', -2, 0, 'they lift him up');
// ---- 37. real Mom jumps on the couch
add(C.mom, 'whoosh', -8, 0, 'cut to the living room');
add(B.momJump + 0.02, 'boing', -2, 0.3, 'Mom springs up onto the couch');
for (let t = B.momJump + 0.25; t < C.toss - 0.05; t += Math.PI / 6.5) add(t, 'boing', -10, 0.3, 'bouncing on the cushions');
// ---- 38. the toss
for (const t0 of B.toss) { add(t0, 'whoosh_up', -2, 0, 'tossed into the sunrise'); add(t0 + 0.02, 'crowd_cheer', -4, 0, 'WOOO'); add(t0 + 1.05, 'land', -8, 0, 'caught'); }
add(C.toss + 0.05, 'chat_pop', -6, -0.4, "Mom's CAPS bubble");
add(l(11).word("THAT'S", 1).t0, 'typing', -10, -0.4, 'caps typing');
for (let i = 0; i < 3; i++) add(C.toss + 0.1 + i * 0.6, 'heart_pop', -8, -0.4, 'hearts from Mom');
// ---- 39. "I did a jump!" + the hero runs in
add(C.did + 0.05, 'chat_pop', -6, 0, 'I DID A JUMP! bubble');
for (let t = C.did + 0.3; t < C.sonReal; t += Math.PI / 7.5) add(t, 'jump_game', -12, 0, 'happy hops');
// ---- 40. real Dad turns to his son
add(C.sonReal, 'whoosh', -8, 0, 'cut to the living room');
add(C.sonReal + 0.55, 'cloth', -8, 0.1, 'arms up');
// ---- 41. one more giant JUMP
add(B.bigJump - 0.02, 'jump_game', 0, 0, 'the giant jump');
add(B.bigJump + 0.02, 'whoosh_up', -2, 0, 'up into the sunrise');
add(B.bigJump + 0.12, 'sparkle', -4, 0, 'JUMP! sparkles');
add(B.bigJump + 1.0, 'land', -4, 0, 'lands');
add(B.bigJump + 0.1, 'crowd_cheer', -2, 0, 'the crowd cheers');
// ---- 42. the hug
add(C.hug + 0.15, 'cloth', -10, 0, 'Dad opens his arms');
add(B.hug, 'thud', -6, 0.1, 'the hero jumps into the hug');
add(B.hug + 0.05, 'heart_pop', -6, 0, 'hearts');
add(B.hug + 0.2, 'kids_laugh', -12, 0, 'awww');
add(B.hundred, 'stamp', 0, 0.5, '100 JUMPS stamp');
add(B.hundred + 0.05, 'achievement', -4, -0.8, 'FLOOR 100/100');
// ---- 43. MVP + the dip to night
add(B.mvpA, 'whoosh', -4, P(560), 'MVP card flips in (left)');
add(B.mvpA + 0.3, 'achievement', 0, P(560), 'MVP medal pops');
add(B.mvpName - 0.05, 'tada', -2, P(560), 'DadBod1978 ribbon');
add(B.mvpName + 0.25, 'pop', -8, P(470), 'stat chip JUMPS 100');
add(B.mvpName + 0.4, 'pop', -8, P(650), 'stat chip CRYSTALS 1');
add(B.mvpA + 0.6, 'heart_pop', -10, P(1300), 'hearts over the hug');
add(B.out, 'whoosh_down', -6, 0, 'the card leaves');
add(END - 0.6, 'whoosh_long', -10, 0, 'pull back, dip to night');
// whip-cut whooshes on the remaining cuts
for (const c of [C.again, C.slip, C.cp10, C.noodle, C.wobble, C.okay, C.gap, C.defeat, C.did, C.bigJump, C.hug, C.mvp]) add(c, 'whoosh', -10, 0, 'whip cut');
sfx.sort((a, b) => a[0] - b[0]);

// ================================================================= music (tiles [T0, END])
const M = [];
const seg_ = (a, b, mood, energy, inn, out) => { if (b - a > 0.05) M.push({ start: r3(a), end: r3(b), mood, energy, in: inn, out }); };
seg_(T0, C.replay, 'epic', 0.4, 'swell', 'cut');                    // "Dad."
seg_(C.replay, C.look, 'playful', 0.5, 'cut', 'scratch');            // the REPLAY: bonk, splash
seg_(C.look, C.vs, 'silence', 0, 'cut', 'cut');                     // the beat: he looks all the way up
seg_(C.vs, C.real, 'epic', 0.9, 'cut', 'sting');                     // VS + the tilt up 100 floors
seg_(C.real, C.jump1, 'mystery', 0.3, 'fade', 'cut');               // the real Dad, "Space... bar."
seg_(C.jump1, C.watch, 'anthem', 0.55, 'swell', 'cut');              // he jumped, again, slipped, checkpoint
seg_(C.watch, C.wobble, 'anthem', 0.85, 'cut', 'cut');               // the server watches + chants, montages, DarkBlade
seg_(C.wobble, C.realWob, 'chaos', 0.6, 'cut', 'cut');               // no no no
seg_(C.realWob, C.gap, 'playful', 0.45, 'cut', 'sting');             // body english ... I'm okay!
seg_(C.gap, C.son1, 'climax', 0.75, 'swell', 'cut');                 // the final gap, JUMP, DAD, JUMP!
seg_(C.son1, C.press2, 'tender', 0.35, 'fade', 'cut');               // "For my son."
seg_(C.press2, B.hit, 'silence', 0, 'cut', 'cut');                   // slow motion: heartbeat + wind
seg_(B.hit, C.crumble, 'climax', 1.0, 'cut', 'cut');                 // the light, NO!, the attack
seg_(C.crumble, C.victory, 'epic', 0.85, 'cut', 'sting');            // the crumble
seg_(C.victory, C.mom, 'anthem', 1.0, 'cut', 'cut');                 // VICTORY, dawn, the summit
seg_(C.mom, C.hug, 'family', 0.75, 'cut', 'cut');                    // That's my husband! I did a jump!
seg_(C.hug, C.mvp, 'warm', 0.5, 'fade', 'cut');                      // the hug
seg_(C.mvp, END, 'anthem', 0.8, 'swell', 'fade');                    // MVP -> dip to night

// ================================================================= ambience + footsteps
const amb = [];
const bed = (a, b, name, g) => { if (b - a > 0.05) amb.push({ start: r3(a), end: r3(b), name, gain_db: g }); };
const REAL = [[C.real, C.jump1], [C.realWob, C.okay], [C.son2, C.leap], [C.mom, C.toss], [C.sonReal, C.bigJump]];
bed(T0, C.replay, 'wind', -14);
bed(C.replay, C.look, 'town', -16);
let a = C.look;
for (const [r0, r1] of REAL) { bed(a, r0, 'wind', -14); bed(r0, r1, 'room', -14); a = r1; }
bed(a, END, 'wind', -16);
bed(C.watch, C.wobble, 'crowd', -10);
bed(C.you, C.son1, 'crowd', -8);
bed(C.no, C.mom, 'crowd', -10);
bed(C.toss, C.sonReal, 'crowd', -12);
bed(C.bigJump, END, 'crowd', -13);
const steps = [];
const run = (s0, s1, interval, surface, g, pan) => { if (s1 - s0 > 0.1) steps.push({ start: r3(s0), end: r3(s1), interval: r3(interval), surface, gain_db: g, pan }); };
run(C.replay, C.splash, Math.PI / 11, 'hard', -10, 0, 'walking into the wall');
run(C.attack, C.defeat, Math.PI / 15, 'hard', -8, 0.2);               // the charge
run(C.did + 0.4, C.sonReal, Math.PI / 14, 'hard', -10, 0.4);          // the hero runs through the crowd
run(C.hug, B.hug, Math.PI / 14, 'hard', -10, 0.3);                     // ... and into the hug

const out = { scene: 'SC 11', start: r3(T0), end: r3(END), music: M, ambience: amb, footsteps: steps, sfx };
fs.writeFileSync(path.join(__dirname, 'sc11.json'), JSON.stringify(out, null, 1));
console.log(`sc11.json: ${sfx.length} sfx, ${M.length} music segments, ${amb.length} beds, ${steps.length} footstep runs`);
