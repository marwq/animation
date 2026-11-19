#!/usr/bin/env node
// Sound cue sheet generator for SC 01 (COLD OPEN — RESPAWN).
// Every time is derived from the voice timeline exactly like scenes/s01.js does: the scene module computes its cuts and beats
// from L(id).a/.b and .word() (scenes/vo), and exports them (CUT, beats) — so when the voice changes, re-run:
//   node audio/cues/gen_sc01.js && python3 audio/validate_cues.py audio/cues/sc01.json
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const S01 = require('../../scenes/s01');
const { L } = V;
const { CUT, beats: B } = S01;

const A = Array.from({ length: 8 }, (_, i) => L('01.' + i));
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const RANGE = require('../../scenes/main').RANGES.find((r) => r.id === 'SC 01');
const START = RANGE.a, END = RANGE.b;

const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= START - 0.5 && t < END) sfx.push([r3(Math.max(START, t)), name, g, pan, note]); };
// the crumble recipe: hit -> pop + stones + pixel wipe
const crumble = (t, pan, note) => { add(t, 'pop', -2, pan, `${note}: hero bursts into blocks`); add(t + 0.04, 'stone', -4, pan, `${note}: blocks scatter`); add(t + 0.08, 'pixel_wipe', -8, pan, `${note}: pixel wipe`); };
// RESPAWNING 3·2·1 ticks spread over an overlay [t0, t0 + dur] (thirds) or explicit marks
const ticks = (marks, pan, note) => { add(marks[0], 'countdown_tick', -4, pan, `${note}: 3`); add(marks[1], 'countdown_tick', -4, pan, `${note}: 2`); add(marks[2], 'countdown_final', -3, pan, `${note}: 1`); };
const thirds = (t0, dur) => [t0, t0 + dur / 3, t0 + (2 * dur) / 3];
const pop = (t, pan, note) => { add(t, 'respawn', 0, pan, `${note}: pop on the checkpoint`); add(t + 0.05, 'forcefield', -8, pan, `${note}: spawn forcefield`); add(t + 0.12, 'sparkle', -10, pan, `${note}: sparkles`); };

// ================================================================= SFX
// ---- 1. the bike ride
add(0, 'whoosh', -2, 0.3, 'whip-in on the speeding bike');
add(0.05, 'skate_roll', -6, P(800), 'bike wheels rolling fast down the hill');
add(0.6, 'wind_gust', -8, 0, 'wind rushing past');
add(1.0, 'skate_roll', -8, P(900), 'wheels (cont.)');
add(B.tHit - 0.85, 'whoosh_up', -8, P(960), '"look, no hands!" arms shoot up');
add(B.tHit, 'impact', 1, P(900), 'front wheel slams the bump');
add(B.tHit + 0.02, 'metal_hit', -2, P(900), 'bike frame clangs');
add(B.tHit + 0.06, 'fall_whistle', -6, P(1000), 'he flies over the handlebars');
add(B.tHit + 0.55, 'metal_clank', -6, P(1100), 'the bike lands upside down');
crumble(B.tCr1, P(980), 'mid-air');
add(B.tCr1 + 0.3, 'powerdown', -4, 0, 'world freezes, grey PAUSED wash');
add(B.tCr1 + 0.32, 'reverse_swell', -8, 0, 'RESPAWNING...');
ticks(B.marks1, 0, 'RESPAWNING');
add(B.tPop1 - 0.06, 'camera_flash', -8, 0, 'white flash, cut to the pad');
pop(B.tPop1, P(960), 'bike #1');
add(B.tPop1 + 0.1, 'tap', -8, P(200), 'RESPAWNS: 1 counter');
// ---- 2. attempt two: AT the lens
add(CUT.lens - 0.12, 'whoosh', -2, 0.3, 'whip-pan');
add(CUT.lens + 0.05, 'skate_roll', -6, P(600), 'riding down again');
add(B.tHit2, 'impact', 1, P(500), 'the bump again');
add(B.tHit2 + 0.02, 'metal_hit', -3, P(500), 'bike clangs');
add(B.tHit2 + 0.04, 'zoom_in', -2, 0, 'he flies straight at the camera');
add(B.tLens, 'splat', 3, 0, 'SPLAT! face squashed on the lens');
add(B.tLens + 0.01, 'glass', -2, 0, 'the lens cracks');
add(B.tLens + 0.02, 'bonk', -2, 0, 'thud on the glass');
crumble(B.tCr2, 0, 'on the lens');
add(B.tCr2 + 0.2, 'camera_flash', -8, 0, 'white flash');
pop(B.tPop2, P(960), 'fast respawn');
add(B.tPop2 + 0.12, 'dizzy', -6, P(960), 'dizzy swirl eyes, orbiting stars');
add(B.tPop2 + 0.05, 'tap', -8, P(200), 'RESPAWNS: 2');
// ---- 3. cafeteria
add(CUT.cafe - 0.12, 'whoosh', -2, 0.3, 'whip-pan to the cafeteria');
add(CUT.cafe + 0.2, 'dishes', -12, P(300), 'lunch-line clatter');
add(B.tSlip, 'slip', 0, P(900), 'foot hits the puddle');
add(B.tSlip + 0.02, 'squeak', -4, P(900), 'sneaker squeak');
add(B.tSlip + 0.06, 'whoosh_up', -6, P(1000), 'tray launched (slow-mo)');
add(B.tSlip + 0.1, 'reverse_swell', -10, 0, 'slow-motion swell');
add(B.tSlip + 0.5, 'body_fall', -2, P(900), 'he lands flat on his back');
add(B.tSlip + 0.75, 'metal_clank', -6, P(1100), 'the tray clatters on the floor');
add(B.tSlip + 0.78, 'dishes', -8, P(1100), 'milk + plate scatter');
add(B.tSplat - 0.04, 'zoom_in', -4, P(1180), 'smash zoom on Pemberton');
add(B.tSplat, 'splat', 3, P(1180), 'SPLAT! spaghetti on the principal');
add(B.tSplat + 0.08, 'crowd_gasp', -6, P(1300), 'the cafeteria gasps');
crumble(B.tCr3, P(700), 'shame');
{
  const t0 = B.tCr3 + 0.04, dur = Math.max(0.3, B.tPop3 - 0.04 - t0);
  add(t0, 'powerdown', -6, 0, 'banner: RESPAWNING · SPAGHETTI INCIDENT');
  ticks(thirds(t0, dur), 0, 'banner');
}
pop(B.tPop3, P(400), 'cafeteria');
add(B.tPop3 + 0.05, 'tap', -8, P(200), 'RESPAWNS: 3');
add(B.tPop3 + 0.6, 'squeak', -12, P(700), 'tiptoeing around the puddle');
// ---- 4. gym
add(CUT.gym - 0.12, 'whoosh', -2, -0.3, 'whip-pan to the gym');
add(CUT.gym + 0.08, 'whistle', -6, P(1800), "Coach Dee's whistle");
add(B.tThrow1, 'whoosh', -2, P(600), 'the dodgeball is thrown');
add(B.tFace, 'bonk', 4, P(1400), 'BONK! ball to the face');
add(B.tFace + 0.02, 'slap', -2, P(1400), 'slap of rubber');
crumble(B.tCr4, P(1450), 'gym');
add(CUT.replay, 'vhs_clunk', -4, 0, 'REPLAY cut-in');
add(CUT.replay + 0.05, 'whoosh_long', -8, -0.3, 'slow-motion replay of the ball');
ticks(thirds(CUT.replay + 0.05, CUT.pop4 - CUT.replay - 0.05), 0.6, 'corner RESPAWNING pill');
add(Math.min(CUT.pop4 - 0.3, CUT.replay + 0.6), 'bonk', -6, P(1300), 'replay: the hit again (slow)');
pop(B.tPop4, P(1480), 'gym');
add(B.tPop4 + 0.05, 'tap', -8, P(200), 'RESPAWNS: 4');
add(B.tPop4 + 0.3, 'reverse_swell', -6, 0, 'bullet time');
add(Math.max(B.tPop4 + 0.35, B.tCatch - 0.75), 'whoosh_long', -4, P(800), 'the ball flies in slow motion');
add(B.tCatch, 'slap', 2, P(1300), 'CATCH! one hand, without looking');
add(B.tCatch + 0.02, 'orch_hit', -2, 0, 'catch accent');
add(B.tCatch + 0.1, 'crowd_gasp', -8, P(900), 'kids gasp');
add(B.tBack, 'whoosh', -4, P(1200), 'he flips the ball back, still not looking');
add(B.tBonk, 'bonk', 2, P(500), 'BONK! the thrower gets it');
add(B.tBonk + 0.2, 'body_fall', -4, P(450), 'thrower falls over');
add(B.tBonk + 0.3, 'kids_laugh', -10, P(800), 'kids laugh');
add(CUT.easy + 0.1, 'swish', -8, P(1300), 'ball spinning on his finger');
// ---- 5. parkour "real life is just an obby"
{
  const K = B.PK;
  add(CUT.run - 0.12, 'whoosh', -2, 0.3, 'whip to Main Street');
  add(K.tL - 0.18, 'jump', -4, P(700), 'jump onto the bench');
  add(K.tL + 0.12, 'land', -4, P(900), 'lands on the bench');
  add(K.tL + 0.12, 'level_up', -10, P(900), 'STAGE 1 tick');
  add(K.tJ - 0.1, 'jump', -4, P(900), 'leap to the bus roof');
  add(K.tJ + 0.32, 'metal_hit', -8, P(1000), 'lands on the bus roof');
  add(K.tJ + 0.32, 'level_up', -9, P(1000), 'STAGE 2 tick');
  add(K.tO, 'jump_game', -4, P(1100), 'front-flip off the bus');
  add(K.tO + 0.15, 'whoosh', -6, P(1100), 'flip');
  add(K.tW, 'land', -2, P(960), 'stuck the landing');
  add(K.tW + 0.05, 'level_up', -8, P(960), 'STAGE 3 tick');
  add(K.tP - 0.05, 'thud', -2, P(1000), 'plants the checkpoint flag');
  add(K.tP, 'confirm', -4, P(1000), 'flag planted');
  add(K.tP + 0.05, 'achievement', -4, 0, 'green save wave + Checkpoint saved');
  add(K.tP + 0.1, 'chime', -8, P(200), 'toast');
}
// ---- 6. the hard switch: sunset, lag, ghosts
add(CUT.dark, 'sub_drop', 2, 0, 'hard cut: the lagging sunset town');
add(CUT.dark + 0.02, 'glitch_long', -4, 0, 'world lags');
for (let i = 0; i < 8; i++) add(CUT.dark + 0.3 + i * 0.28, 'poof', -12 - (i % 3), r3(Math.sin(i * 2.3) * 0.7), 'ghost copies appear everywhere');
add(B.tWin - 0.05, 'tv_on', -2, 0, 'giant red window crt-opens in the sky');
add(B.tWin, 'alarm', 0, 0, 'SAVE FILE CORRUPTED');
add(B.tWin + 0.05, 'error', -4, 0, 'error chime');
add(B.tWin + 0.4, 'siren', -10, 0, 'alarm siren');
// ---- 7. Tip glitching + the counter
add(CUT.tip + 0.02, 'glitch', -4, P(1350), 'Tip glitches in');
add(CUT.tip + 0.05, 'chat_pop', -8, P(1350), 'Tip pops');
add(CUT.tip + 0.9, 'static', -12, P(1350), 'Tip flickers');
add(CUT.count, 'ui_pop', -4, 0, 'RESPAWNS USED pill slams in');
for (let t = CUT.count + 0.1; t < B.t9k + 0.3; t += 0.08) add(t, 'click', -14, 0, 'digits rolling');
add(B.t9k + 0.35, 'impact', -4, 0, '9,000');
for (let t = B.t9h - 0.1; t < B.t9h + 0.3; t += 0.08) add(t, 'click', -14, 0, 'digits rolling');
add(B.t9h + 0.35, 'impact', -4, 0, '9,900');
for (let t = B.t99 - 0.15; t < B.t99 + 0.35; t += 0.08) add(t, 'click', -14, 0, 'digits rolling');
add(B.t99, 'boom', 0, 0, '9,999 — red flash');
add(B.t99 + 0.02, 'alarm_beep', -6, 0, 'counter alarm');
for (const [t, k] of [[B.t9k, 0], [B.t9h, 1], [B.t99, 2]]) for (let i = 0; i < 3; i++) add(t + i * 0.08, 'poof', -12, r3(Math.sin((k * 3 + i) * 1.9) * 0.6), 'more ghosts pop into existence');
add(w(5, 'lot.') + 0.1, 'gulp', -2, P(900), 'the hero gulps');
// ---- 8. "Okay, okay!"
add(CUT.okay, 'glitch', -8, 0, 'cut');
add(CUT.okay + 0.6, 'slip', -12, P(1300), 'ghost slips behind him');
add(CUT.okay + 1.2, 'bonk', -12, P(600), 'ghost hit by a ball behind him');
add(B.tLittle - 0.1, 'zoom_in', -4, 0, 'smash zoom on "a LITTLE"');
add(B.tLittle + 0.15, 'whoosh', -4, P(1300), 'a ghost cyclist crashes through the foreground');
add(B.tLittle + 0.35, 'impact', -4, P(1400), 'ghost crash, camera shake');
// ---- 9. the sky cracks
add(B.tCrack, 'glass', 4, 0, 'the sky cracks like a phone screen');
add(B.tCrack + 0.02, 'impact', 0, 0, 'crack impact');
add(B.tCrack + 0.25, 'rumble', -6, 0, 'the world freezes');
add(B.tCrack + 0.6, 'loading', -6, P(1080), 'loading wheel spins in the crack');
// ---- 10. the rewind
add(B.tRwA, 'vhs_clunk', -2, 0, 'REWIND');
add(B.tRwA + 0.02, 'rewind', 2, 0, 'everything winds backwards');
add(B.tRwA + 0.4, 'reverse_swell', -6, 0, 'ghosts suck back into blocks');
add(B.tRwB, 'rewind', 0, 0, 'the cold open flickers backwards');
add(B.tRwB + 0.5, 'static', -12, 0, 'VHS tracking hiss');
add(B.tRwC, 'reverse_swell', -4, P(700), 'the blocks fly back together on the first checkpoint');
add(B.tRwC + 1.0, 'pop', -6, P(700), 'he is whole again');
add(B.tPlay, 'vhs_clunk', -4, 0, '▶ PLAY');
add(B.tPlay + 0.03, 'click', -8, 0, 'play button');
add(END - 0.3, 'shine', -8, 0, 'white flash into Monday');

// ================================================================= music / ambience / footsteps
const music = [
  { start: START, end: CUT.dark, mood: 'respawn', energy: 0.85, in: 'cut', out: 'tapestop' },
  { start: CUT.dark, end: B.tWin, mood: 'lag', energy: 0.45, in: 'fade', out: 'cut' },
  { start: B.tWin, end: CUT.crack, mood: 'corrupt', energy: 0.7, in: 'cut', out: 'sting' },
  { start: CUT.crack, end: B.tRwA, mood: 'glitch_build', energy: 0.5, in: 'cut', out: 'tapestop' },
  { start: B.tRwA, end: B.tPlay, mood: 'silence', energy: 0.3, in: 'cut', out: 'cut' },
  { start: B.tPlay, end: END, mood: 'playful', energy: 0.4, in: 'swell', out: 'cut' },
].map((s) => ({ ...s, start: r3(s.start), end: r3(s.end) }));
const ambience = [
  { start: START, end: CUT.cafe, name: 'birds', gain_db: -12 },
  { start: CUT.cafe, end: CUT.gym, name: 'crowd', gain_db: -16 },
  { start: CUT.gym, end: CUT.run, name: 'crowd', gain_db: -18 },
  { start: CUT.run, end: CUT.dark, name: 'town', gain_db: -14 },
  { start: CUT.dark, end: B.tRwA, name: 'wind', gain_db: -14 },
  { start: B.tWin, end: B.tRwA, name: 'static', gain_db: -22 },
  { start: B.tRwA, end: END, name: 'static', gain_db: -18 },
].map((s) => ({ ...s, start: r3(s.start), end: r3(s.end) }));
const footsteps = [
  { start: CUT.cafe, end: B.tSlip, interval: r3(Math.PI / 11), surface: 'hard', gain_db: -10, pan: P(700) },
  { start: B.tPop3 + 0.28, end: CUT.gym, interval: r3(Math.PI / 12), surface: 'soft', gain_db: -14, pan: P(600) },
  { start: CUT.run, end: B.PK.tL - 0.18, interval: r3(Math.PI / 15), surface: 'hard', gain_db: -9, pan: P(700) },
  { start: B.PK.tJ + 0.32, end: B.PK.tO, interval: r3(Math.PI / 16), surface: 'wood', gain_db: -11, pan: P(1000) },
].filter((s) => s.end - s.start > 0.15).map((s) => ({ ...s, start: r3(s.start), end: r3(s.end) }));

sfx.sort((a, b) => a[0] - b[0]);
const out = { scene: 'SC 01', start: r3(START), end: r3(END), music, ambience, footsteps, sfx };
fs.writeFileSync(path.join(__dirname, 'sc01.json'), JSON.stringify(out, null, 1));
console.log(`sc01.json: ${sfx.length} sfx, ${music.length} music segments, ${(END - START).toFixed(1)} s`);
