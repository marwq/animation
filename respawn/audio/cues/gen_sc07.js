#!/usr/bin/env node
// Sound cue sheet generator for SC 07 (ЛАГИ: the world starts to lag, wrong respawns).
// Every time below is computed from the voice timeline exactly like scenes/s07.js does (L(id).a / .b, .word()),
// so when the voice changes, re-run:
//   node audio/cues/gen_sc07.js && python3 audio/validate_cues.py audio/cues/sc07.json
// Output: audio/cues/sc07.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { L } = V;

// ---------------------------------------------------------------- timing (copied from scenes/s07.js)
const A = Array.from({ length: 17 }, (_, i) => L('07.' + i));
const T0 = V.TL.scenes['SC 07'].start;
const END = V.TL.scenes['SC 08'].start;               // == main.js RANGES for SC 07
const w = (i, word, n = 0) => A[i].word(word, n).t0;

const CUT = {};
CUT.room = T0;
CUT.disk = w(0, 'sssave') - 0.25;
const tHeavy = w(0, 'heavy');
CUT.face = w(0, 'The', 1) - 0.1;
const tLag = w(0, 'lllag');
CUT.lagq = A[1].a - 0.1;
CUT.mom = A[2].a - 0.15;
CUT.birds = A[3].a - 0.1;
const tFroze = w(3, 'froze');
CUT.bus = w(3, 'The', 1) - 0.1;
CUT.dog = w(3, 'same') - 0.12;
CUT.pancake = w(3, 'And') - 0.12;
const tFlip = w(3, 'pancake') - 0.05, tHang = w(3, 'just');
CUT.dad = A[4].a - 0.1;
CUT.low = A[5].a - 0.1;
CUT.y2006 = A[6].a - 0.1;
CUT.walk = A[7].a - 0.1;
const tTrip = w(7, 'wrong') + 0.05;
const tOv = tTrip + 0.32;
const MARKS = ['three', 'two', 'one'].map((x) => w(8, x));
const tPop1 = Math.max(MARKS[2] + 0.3, A[8].b + 0.02);
CUT.pole = tPop1 - 0.02;
const tNot = w(9, 'NOT');
CUT.poleCr = Math.max(A[9].b - 0.05, A[10].a - 0.12);
const tCr2 = CUT.poleCr + 0.07;
CUT.bowl = Math.min(A[10].b + 0.08, A[11].a - 0.2);
const tCr3 = A[12].a - 0.06;
CUT.bin = Math.min(A[12].b + 0.05, A[12].a + 0.32);
const tCr4 = A[14].a - 0.05;
CUT.cake = Math.min(A[14].b + 0.08, A[14].a + 0.45);
CUT.fig = Math.max(w(15, 'my') - 0.12, w(15, 'birthday') - 0.15);
CUT.tableau = A[16].a - 0.1;
CUT.case = w(16, 'To') - 0.12;
const tNobody = w(16, 'nobody'), tHow = w(16, 'how');
const TIP_SPIKES = [w(0, 'tttip'), w(0, 'sssave'), w(0, 'lllag')];
const WHIPS = [[CUT.birds, 1], [CUT.bus, 1], [CUT.pancake, -1], [CUT.low, 1], [CUT.tableau, -1]];
const GLITCHES = [CUT.mom, CUT.dog, CUT.dad, CUT.walk, CUT.case, CUT.lagq];

// cross-check against the scene module (warn if the copies drifted apart)
try {
  const M = require('../../scenes/s07');
  for (const [k, v] of Object.entries(CUT)) if (Math.abs((M.CUT[k] ?? v) - v) > 1e-6) console.warn(`WARN: CUT.${k} differs from scenes/s07.js (${v} vs ${M.CUT[k]})`);
} catch (e) { console.warn('(scenes/s07.js not loadable for the cross-check: ' + e.message + ')'); }

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));            // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 4 && t < END) sfx.push([r3(t), name, g, pan, note]); };

// ================================================================= SFX, shot by shot
for (const [tc, d] of WHIPS) add(tc - 0.12, 'whoosh', -3, r3(0.3 * d), 'whip-pan');
for (const tc of GLITCHES) add(tc - 0.04, 'glitch', -5, 0, 'glitch cut (lag spike)');

// ---- 1. night bedroom: the pad blinks red, Tip glitches
add(T0 + 0.1, 'glitch_long', -4, 0.1, 'red spike: the checkpoint starts blinking red');
for (let k = 0; k < 4; k++) add(T0 + 0.4 + k * 0.8, 'alarm_beep', -16, -0.05, 'the red pad blinks');
for (const tw of TIP_SPIKES) add(tw, 'glitch', -3, P(1150), 'Tip glitches (stuttered word)');
add(w(0, 'respawns') - 0.05, 'ui_pop', -6, P(300), 'RESPAWNS counter pops in');
for (let k = 0; k < 4; k++) add(w(0, 'respawns') + 0.1 + k * 0.18, 'tap', -12, P(300), 'counter ticks up');
// ---- 2. the giant floppy SAVE FILE gets heavy and drops
add(CUT.disk + 0.05, 'ui_pop', -6, 0, 'the SAVE FILE floppy floats in');
add(w(0, 'file') - 0.1, 'riser', -6, 0, 'the floppy swells, turning red');
add(tHeavy, 'whoosh_down', -2, 0, 'it drops like an anvil');
add(tHeavy + 0.2, 'impact', 3, 0, 'THUD! onto the checkpoint');
add(tHeavy + 0.2, 'thud', 0, 0, 'THUD body');
add(tHeavy + 0.22, 'glass', -6, 0, 'the floppy cracks');
add(tHeavy + 0.25, 'boing', -6, P(560), 'the hero jumps');
// ---- 3. the shot itself freezes on "l-l-lag"
add(tLag - 0.05, 'record_scratch', -2, 0, 'the frame freezes (LAG)');
add(tLag - 0.02, 'loading', -10, 0, 'loading wheel in the frozen frame');
add(tLag + 0.42, 'vhs_clunk', -4, 0, 'the frame catches up');
// ---- 4. "can't lag" — his body freezes, then snaps
{
  const tC = w(1, 'cant') + 0.05;
  add(tC, 'glitch', -3, P(660), 'his own body freezes (RGB split)');
  add(A[1].b + 0.12, 'vhs_clunk', -5, P(660), 'he snaps back');
}
// ---- 5. Friday morning: Mom stutters
add(CUT.mom + 0.1, 'ui_pop', -8, P(300), 'FRIDAY 7:30 AM pops in');
for (const [tw, len] of [[w(2, 'mmmmorning'), 0.13], [w(2, 'swswsweetie'), 0.15]]) for (let k = 0; k < 3; k++) add(tw + 0.05 + k * len, 'glitch', -8, P(1180), "Mom's pose frame-repeats");
add(w(2, 'swswsweetie') + 0.35, 'pop', -12, P(1300), 'a stuttering kiss on his head');
// ---- 6. birds froze in the sky
add(tFroze, 'powerdown', -6, -0.1, 'the birds freeze mid-flap');
add(tFroze + 0.05, 'glitch', -6, -0.2, 'freeze glitch');
add(tFroze + 0.2, 'loading', -10, 0, 'loading wheels over the frozen birds');
add(tFroze + 0.6, 'pop', -8, P(1300), "'...?' pops");
// ---- 7. the bus teleports back to the corner (rubber band)
add(CUT.bus + 0.1, 'engine', -10, 0.4, 'the school bus drives up');
for (let k = 1; ; k++) {
  const tt = CUT.bus + 0.2 + k * 1.6;
  if (tt >= CUT.dog) break;
  add(tt, 'teleport', -3, 0.5, 'the bus snaps back to the corner');
  add(tt + 0.02, 'glitch', -8, 0.5, 'teleport glitch');
}
// ---- 8. the dog stuck half inside the fence
add(CUT.dog + 0.2, 'loading', -10, P(400), 'loading wheel over the dog');
add(CUT.dog + 0.35, 'dog_bark', -10, P(400), 'the dog, stuck in the fence, barks (choppy)');
add(w(3, 'corner') - 0.12, 'whoosh', -1, 0.5, 'the bus blasts through the foreground');
add(w(3, 'corner') - 0.08, 'car_horn', -8, 0.3, 'bus horn');
add(w(3, 'corner') + 0.5, 'teleport', -5, 0, 'and snaps back (cyan flash)');
// ---- 9. Dad's pancake goes up... and stays there
add(CUT.pancake + 0.05, 'sizzle', -14, -0.3, 'the pan sizzles');
add(tFlip, 'swish', -2, -0.3, 'FLIP!');
add(tHang, 'record_scratch', -6, -0.3, 'the pancake stops dead in the air');
add(tHang + 0.1, 'loading', -10, -0.3, 'loading ring around the pancake');
// ---- 10. "That one's... thinking about it."
add(w(4, 'That') - 0.1, 'pop', -10, 0.3, "'...' pops");
add(w(4, 'thinking') - 0.1, 'loading', -4, -0.1, 'the pancake spins like a loading icon');
// ---- 11. the street switches to low graphics
{
  const a = w(5, 'switched') - 0.1, b = Math.max(w(5, 'graphics') + 0.7, A[5].b + 0.9);
  add(a, 'powerdown', -2, 0, 'GRAPHICS: LOW — the street powers down');
  for (let k = 0; k < 6; k++) add(a + ((b - a) * (k + 0.5)) / 6, 'pixel_wipe', -9 - (k % 2) * 2, r3(-0.5 + k * 0.2), 'objects pop into 2006 boxes');
  add(w(5, 'low') - 0.05, 'ui_pop', -4, P(300), 'GRAPHICS: LOW badge');
  add(w(5, 'low'), 'error', -8, P(300), 'badge bump');
}
// ---- 12. "...from two thousand and six?!"
add(w(6, 'two') - 0.06, 'zoom_in', -2, 0, 'smash zoom');
add(w(6, 'two'), 'impact', 0, 0, "'2006?!' slams in");
add(w(6, 'six'), 'boom', -3, 0, 'shake on "six"');
// ---- 13. he trips over a missing-collision box -> crumble -> glitched RESPAWNING
add(tTrip, 'body_fall', 0, -0.05, 'he trips over the grey box');
add(tTrip + 0.1, 'pop', -2, 0, 'he crumbles into blocks');
add(tTrip + 0.12, 'stone', -4, 0, 'blocks scatter');
add(tTrip + 0.15, 'pixel_wipe', -8, 0, 'crumble');
add(tOv, 'powerdown', -4, 0, 'the world greys under RESPAWNING');
add(MARKS[0], 'countdown_tick', -2, 0, '3');
add(MARKS[1], 'countdown_tick', -2, 0, '2');
add(MARKS[1] + 0.2, 'glitch', -6, 0, "label scrambles 'RESP@WN1NG'");
add(MARKS[2], 'countdown_final', -2, 0, '1');
add(MARKS[2] + 0.05, 'glitch_long', -6, 0, "'SPAWN POINT: ???' — the overlay tears");
// ---- 14. pop: on top of the very tall flagpole
add(tPop1, 'respawn', 0, 0, 'pop — at the top of the flagpole');
add(tPop1 + 0.05, 'error', -6, 0, 'red forcefield: wrong spawn');
add(tPop1 + 0.1, 'forcefield', -10, 0, 'forcefield shimmer');
add(tPop1 + 0.2, 'wind_gust', -6, 0.2, 'wind at the top of the pole');
add(tNot - 0.05, 'whoosh_long', -2, 0, 'pull-out reveal: tiny hero on a huge pole');
add(tNot, 'impact', -6, P(1320), "'NOT!' bang");
// ---- 15. "Respawning." — he crumbles off the pole
add(tCr2, 'pop', -2, 0, 'he crumbles on the pole');
add(tCr2 + 0.02, 'stone', -5, 0, 'blocks');
add(tCr2 + 0.05, 'fall_whistle', -8, 0, 'blocks fall all the way down');
add(tCr2, 'loading', -10, P(1800), 'corner RESPAWNING pill');
// ---- 16. tiny in Gary's fishbowl
add(CUT.bowl, 'respawn', -4, P(760), 'pop — tiny, inside the fishbowl');
add(CUT.bowl + 0.03, 'splash', -6, P(760), 'plop into the water');
add(A[11].a, 'bubbles', -6, P(760), '"Hi, Gary." comes out as bubbles');
add(A[11].b + 0.55, 'blink', -4, P(1200), 'Gary blinks. Slowly.');
add(A[11].b + 0.6, 'bubbles', -12, P(1200), 'Gary blows a bubble');
add(tCr3, 'pop', -6, P(760), 'tiny crumble');
add(tCr3 + 0.05, 'bubbles', -4, P(760), 'the blocks float up like bubbles');
add(tCr3 + 0.05, 'loading', -10, 0, 'RESPAWNING banner');
// ---- 17. the gym ball bin: balls rain on him, Coach Dee
add(CUT.bin, 'respawn', -4, P(1050), 'pop — inside the ball bin');
{
  const BIN = { x: 1760, y: 780, s: 0.42 }, inY = BIN.y - 150 * BIN.s, lvl = BIN.y - 460 * BIN.s;
  for (let i = 0; i < 9; i++) {
    const head = i === 3, land = head ? inY - 980 * BIN.s : lvl - 10 - (i % 3) * 18;
    const tl = CUT.bin + 0.08 + i * 0.13 + Math.sqrt((2 * (land - 120)) / 3200);
    if (tl >= tCr4) continue;
    if (head) { add(tl, 'bonk', 2, P(1100), 'BONK! a ball on his head'); add(tl + 0.02, 'boing', -6, P(1100), 'it bounces off'); }
    else add(tl, 'boing', -12 + (i % 2) * 2, P(900 + (i % 4) * 80), 'a dodgeball lands in the bin');
  }
}
add(CUT.bin + 0.15, 'squeak', -10, P(560), 'Coach Dee slowly pulls the whistle out of her mouth');
add(tCr4, 'pop', -4, P(1050), 'crumble among the balls');
add(tCr4 + 0.02, 'stone', -8, P(1050), 'blocks bounce on the balls');
add(tCr4 + 0.05, 'countdown_tick', -8, P(1050), 'mini ring countdown');
// ---- 18. bursting out of Mr. Fig's birthday cake
add(CUT.cake, 'respawn', -6, 0, 'pop');
add(CUT.cake + 0.06, 'splat', 3, 0, 'SPLAT! out of the cake');
add(CUT.cake + 0.08, 'impact', -2, 0, 'cake explodes (shake)');
add(CUT.cake + 0.4, 'splat', -10, 0.4, 'cake chunks land');
add(CUT.cake + 0.55, 'splat', -12, -0.4, 'cake chunks land');
add(CUT.fig - 0.05, 'cricket', -12, -0.3, 'the frozen teachers: dead silence');
// ---- 19. the tableau
add(w(16, 'birthday'), 'sparkle', -10, 0.2, 'sparkles around the hero in the cake');
// ---- 20. "To this day, nobody knows how." — the case photo
add(CUT.case + 0.2, 'paper', -4, 0, 'the polaroid drops onto the cork board');
add(CUT.case + 0.32, 'tap', -6, 0, 'push-pin');
add(tNobody, 'stamp', 0, P(1180), "'UNSOLVED' stamp");
add(tHow, 'pop', -6, P(520), "'???'");
add(END - 0.35, 'glitch_long', -4, 0, 'red alarm glitch bleeds in (to SC 08)');

// ---------------------------------------------------------------- music, ambience, footsteps
const music = [
  { start: T0, end: tLag - 0.05, mood: 'lag', energy: 0.4, in: 'fade', out: 'tapestop' },
  { start: tLag - 0.05, end: tLag + 0.42, mood: 'silence', energy: 0, in: 'cut', out: 'cut' },
  { start: tLag + 0.42, end: CUT.mom, mood: 'lag', energy: 0.35, in: 'cut', out: 'scratch' },
  { start: CUT.mom, end: CUT.low, mood: 'lag', energy: 0.5, in: 'cut', out: 'cut' },
  { start: CUT.low, end: Math.max(w(5, 'graphics') + 0.7, A[5].b + 0.9), mood: 'lag', energy: 0.45, in: 'cut', out: 'tapestop' },
  { start: Math.max(w(5, 'graphics') + 0.7, A[5].b + 0.9), end: tTrip, mood: 'lag', energy: 0.55, in: 'cut', out: 'cut' },
  { start: tTrip, end: tPop1, mood: 'lag', energy: 0.3, in: 'cut', out: 'cut' },
  { start: tPop1, end: CUT.case, mood: 'lag', energy: 0.75, in: 'cut', out: 'sting' },
  { start: CUT.case, end: END, mood: 'mystery', energy: 0.4, in: 'cut', out: 'scratch' },
];
const ambience = [
  { start: T0, end: CUT.mom, name: 'night', gain_db: -10 },
  { start: T0, end: CUT.mom, name: 'room', gain_db: -16 },
  { start: CUT.mom, end: CUT.birds, name: 'kitchen', gain_db: -10 },
  { start: CUT.birds, end: CUT.pancake, name: 'town', gain_db: -10 },
  { start: CUT.pancake, end: CUT.low, name: 'kitchen', gain_db: -10 },
  { start: CUT.low, end: tPop1, name: 'town', gain_db: -14 },
  { start: CUT.low + 1, end: tPop1, name: 'static', gain_db: -24 },
  { start: tPop1, end: CUT.bowl, name: 'wind', gain_db: -8 },
  { start: CUT.bowl, end: CUT.bin, name: 'room', gain_db: -14 },
  { start: CUT.bin, end: CUT.cake, name: 'room', gain_db: -12 },
  { start: CUT.cake, end: END, name: 'room', gain_db: -16 },
];
const footsteps = [
  { start: r3(CUT.walk + 0.05), end: r3(tTrip - 0.05), interval: r3(Math.PI / 9), surface: 'hard', gain_db: -10, pan: -0.1 },
];

const out = { scene: 'SC 07', start: r3(T0), end: r3(END), music: music.map((m) => ({ ...m, start: r3(m.start), end: r3(m.end) })), ambience: ambience.map((a) => ({ ...a, start: r3(a.start), end: r3(a.end) })), footsteps, sfx: sfx.sort((a, b) => a[0] - b[0]) };
// music must tile exactly: snap the first/last to the scene range
out.music[0].start = out.start; out.music[out.music.length - 1].end = out.end;
fs.writeFileSync(path.join(__dirname, 'sc07.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`wrote audio/cues/sc07.json: ${out.sfx.length} sfx, ${out.music.length} music segments`);
