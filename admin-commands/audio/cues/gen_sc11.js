#!/usr/bin/env node
// Sound cue sheet generator for SC 11 (ПОСЛЕ: the normal morning after — Brick picks you first, Dad misses the sky office,
// Granny is still fast, Zoe and the "nice try." sticky note, Pancake types ";size pancake 2" by himself: "Command accepted",
// "...PANCAKE.", the tiny golden ADMIN crown).
// Every time below is computed from the voice timeline exactly like scenes/s11.js does (L(id).a / .b, .word()),
// so when the real voice replaces the provisional timeline, re-run:
//   node audio/cues/gen_sc11.js && python3 audio/validate_cues.py audio/cues/sc11.json
// Output: audio/cues/sc11.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { L } = V;
const { lerp, clamp } = require('../../rig/svg');

// ---------------------------------------------------------------- timing (copied from scenes/s11.js)
const A = Array.from({ length: 11 }, (_, i) => L('11.' + i));
const T0 = V.scene('SC 11').start, END = V.scene('SC 12').start;     // == main.js RANGES for SC 11
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;

const CUT = {};
CUT.morning = T0;
CUT.pick = A[1].a - 0.1;
CUT.brick = w(1, 'Except') - 0.1;
CUT.point = w(1, 'And') - 0.12;
CUT.dad = A[2].a - 0.1;
CUT.sky = w(2, 'I') - 0.1;
CUT.granny = A[3].a - 0.1;
CUT.bus = w(3, "She's") - 0.12;
CUT.walk = w(3, 'She', 1) - 0.1;
CUT.zoe = A[4].a - 0.12;
CUT.zoe2 = A[5].a - 0.1;
CUT.you = A[6].a - 0.12;
CUT.cat = A[7].a - 0.12;
CUT.type = w(7, 'But') - 0.12;
CUT.accept = A[8].a - 0.05;
CUT.gasp = A[9].a - 0.1;
CUT.panel = A[10].a - 0.1;
CUT.crown = w(10, 'It') - 0.12;
{
  const ks = Object.keys(CUT);
  for (let i = 1; i < ks.length; i++) if (CUT[ks[i]] < CUT[ks[i - 1]] + 0.2) CUT[ks[i]] = CUT[ks[i - 1]] + 0.2;
}
const tEnter = A[7].b + 0.05;
const tAdmin = w(10, 'admin');
const WHIPS = [[CUT.dad, 1], [CUT.granny, 1], [CUT.zoe, 1], [CUT.brick, 1]];

// typing span of a command bar = K.typeProgress(t, line, from, to): from word t0 to word t1
function typeSpan(line, from = 0, to = null) {
  const ws = line.words;
  const key = (x) => x[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const i0 = typeof from === 'number' ? from : ws.findIndex((x) => key(x) === from.toLowerCase());
  const i1 = to === null ? ws.length - 1 : typeof to === 'number' ? to : ws.findIndex((x, i) => i >= i0 && key(x) === to.toLowerCase());
  return [ws[Math.max(0, i0)][1], ws[Math.max(0, i1)][2]];
}

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));               // pan from screen x
const PC = (wx, cam) => P(960 + (cam.zoom ?? 1) * (wx - 960 - (cam.x || 0))); // world x seen through a scene cam {zoom, x}
const sfx = [];
const add = (t, name, g, pan, note) => sfx.push([r3(t), name, g, pan, note]);
function typing(t0, t1, g, pan, note) {
  for (let t = t0, k = 0; t < t1 - 0.5 || k === 0; t += 0.9, k++) add(t, 'typing', k ? g - 2 : g, pan, k ? note + ' (cont.)' : note);
}
// peaks of max(0, sin((t - t0) * f)) after t0, before t1 (taps)
function peaks(t0, t1, f, max = 4, base = t0) {
  const out = [];
  const per = (2 * Math.PI) / f;
  for (let t = base + Math.PI / 2 / f; t < t1 && out.length < max; t += per) if (t >= t0) out.push(t);
  return out;
}

// ================================================================= SFX, shot by shot
// whip-pans (scene router + shBrick: whip() over tc ± 0.1)
for (const [tc, d] of WHIPS) add(tc - 0.12, 'whoosh', -3, r3(0.3 * d), 'whip-pan');

// ---- 1. a normal morning... "Mostly." (you leave for school; tilt up: the bathtub guy still floats by)
const tMostly = w(0, 'Mostly');
add(CUT.morning + 0.45, 'door_close', -12, PC(760, { zoom: 1.12, x: 0 }), 'you head out the front door for school');
add(tMostly - 0.15, 'whoosh', -9, 0, 'camera tilts up to the sky ("Mostly.")');
add(tMostly + 0.2, 'bubbles', -10, -0.3, 'the bathtub guy is still floating over town');
add(tMostly + 0.65, 'squeak', -9, -0.2, 'rubber-duck squeak from the flying bathtub');

// ---- 2. gym: picked last (kids picked one by one run off; a tumbleweed)
const tPicked = w(1, 'picked'), tLast = w(1, 'last');
{
  const cam = { zoom: 1.5, x: -320 };
  [[300, 1], [420, 6], [540, 11], [660, 13]].forEach(([x], j) => add(tPicked - 0.5 + j * 0.28, 'swish', -11, PC(x, cam), `kid ${j + 1} gets picked and runs off`));
  add(tLast, 'wind_gust', -4, 0.2, 'picked last... a tumbleweed rolls through the gym');
  add(tLast + 0.6, 'cricket', -8, 0, 'awkward silence');
}

// ---- 3. "Except now Brick is team captain." (whip; Brick steps in, CAPTAIN! sash)
{
  const tCap = w(1, 'captain');
  add(CUT.brick + 0.4, 'land', -4, 0, 'Brick steps into frame, chest out');
  add(tCap, 'shine', -4, P(1460), 'CAPTAIN! sash flashes');
  add(tCap + 0.05, 'sparkle', -8, 0, 'sparkles round Captain Brick');
}

// ---- 4. "And he picks you first." (Brick points, shy blush; whip to you: shock -> JOY)
const tFirst = w(1, 'first');
{
  const tPicks = w(1, 'picks'), tYou = w(1, 'you', 1);
  const pBrick = PC(420, { zoom: 1.6, x: 400 - 960 });
  add(tPicks - 0.2, 'swish', -6, pBrick, 'Brick points at you');
  add(tPicks + 0.1, 'blush', -7, pBrick, 'shy smile, blushing');
  add(tYou - 0.1, 'whoosh', -4, 0.3, 'whip-pan to you');
  add(tFirst, 'confetti', -1, 0, 'JOY: confetti bursts');
  add(tFirst, 'boing', -6, 0, 'you spring up with joy');
  if (tFirst + 0.35 < CUT.dad) add(tFirst + 0.35, 'land', -10, 0, '...bounce');
}

// ---- 5. Dad: "Can you hear me now?" (taps the headset; "You're muted")
{
  const tNow = w(2, 'now');
  const pDad = PC(640, { zoom: 1.75, x: 470 - 960 });
  peaks(A[2].a, Math.min(tNow, CUT.sky), 16, 3, 0).forEach((t, k) => add(t, 'tap', k ? -13 : -11, pDad, 'Dad taps his headset'));
  add(tNow, 'error', -4, P(800), '"You\'re muted" pops up');
}

// ---- 6. "...I miss the sky office." (dreamy thought bubble)
{
  const tB = w(2, 'sky') - 0.3;
  add(tB, 'harp_up', -4, P(560), 'dreamy thought bubble: Dad flying in the sky office');
  add(tB + 0.05, 'pop', -9, P(560), 'the bubble pops in');
}

// ---- 7. Granny is still fast: the kitchen pancake blur, ZOOM!
{
  const tFast = w(3, 'fast');
  const pG = PC(830, { zoom: 1.85, x: 830 - 960 + 60 });
  add(CUT.granny + 0.05, 'sizzle', -6, pG, 'pancakes sizzling at super speed');
  add(CUT.granny + 0.2, 'whoosh', -7, pG, "Granny's arms are a blur");
  add(CUT.granny + 0.5, 'dishes', -12, 0.3, 'pancakes slap onto the growing stack');
  add(CUT.granny + 0.85, 'whoosh', -9, 0.15, 'pancakes fly from the pan to the stack');
  add(tFast, 'whoosh_long', -3, P(1380), 'ZOOM!');
  add(tFast + 0.1, 'pan_clang', -8, pG, 'the pan flips');
  add(tFast + 0.3, 'blink', -9, pG, "Granny's smug wink");
}

// ---- 8. "She's never been late again." (the bus stop: she's already there, knitting; the bus pulls in)
{
  const tLate = w(3, 'late');
  const cam = { zoom: 1.36, x: 240 };
  add(CUT.bus, 'engine', -4, P(100), 'the bus pulls in');
  for (const dt of [0.2, 0.55, 0.9]) if (CUT.bus + dt < tLate - 0.1) add(CUT.bus + dt, 'click', -15, PC(1450, cam), 'knitting needles click');
  add(tLate - 0.1, 'steam_hiss', -5, PC(780, cam), 'the bus air brakes hiss');
  peaks(tLate, CUT.walk, 14, 3).forEach((t, k) => add(t, 'tap', k ? -11 : -9, PC(1450, cam), 'Granny taps her wristwatch'));
  add(tLate + 0.1, 'chat_pop', -6, PC(1020, cam), '"?!" from the bus');
}

// ---- 9. "She also walks to the store... faster than the car." (tracking shot)
{
  const tFaster = w(3, 'faster'), tCar = w(3, 'car');
  add(CUT.walk, 'engine', -3, -0.2, 'the car drives alongside Granny');
  add(CUT.walk + 0.05, 'wind_gust', -10, -0.1, 'speed lines: Granny power-walking');
  add(tFaster + 0.3, 'chat_pop', -6, -0.3, '"?!" from the driver');
  add(tFaster + 0.4, 'car_horn', -5, -0.35, 'the car honks as Granny pulls ahead');
  add(tCar - 0.05, 'whoosh_long', -1, P(1500), 'WHOOSH: Granny beats the car to the store');
}

// ---- 10. Zoe checks your monitor every day
add(CUT.zoe + 0.2, 'cloth', -11, PC(1030, { zoom: 1.5, x: 930 - 960 }), 'Zoe leans in to check the monitor');

// ---- 11. "Your password sticky note is still facing the window." (thumb at the window, "...")
{
  const tWin = w(5, 'window');
  add(w(5, 'facing') - 0.2, 'swish', -8, P(1100), 'thumb jab toward the window');
  add(tWin + 0.1, 'blink', -6, P(420), '"..." deadpan');
}

// ---- 12. "Yeah. But now it says 'nice try.'" (proud; smash-zoom onto the note)
const tNice = w(6, 'nice');
add(CUT.you + 0.1, 'shine', -10, 0, 'smug sparkle');
add(tNice - 0.1, 'zoom_in', -1, 0, 'smash-zoom onto the sticky note');
add(tNice - 0.04, 'sparkle', -5, 0, '"nice try." note + sparkles (flash)');

// ---- 13. Pancake walks along the bed and plops onto the old laptop: CLACK!
const tSits = w(7, 'sits'), tKey = w(7, 'keyboard');
{
  const cam = { zoom: 2.6, x: 1440 - 960 };
  const pLap = PC(1390, cam);
  add(tSits - 0.25, 'jump', -10, PC(1450, { zoom: 2.55, x: 1500 - 960 }), 'Pancake hops onto the laptop');
  add(tSits, 'thud', -5, pLap, 'plop');
  add(tSits + 0.05, 'click', -2, PC(1600, cam), 'CLACK! the keys get squashed');
  add(tSits + 0.06, 'tv_on', -10, pLap, 'the old laptop wakes up (admin panel glows)');
  add(tSits + 0.1, 'boing', -10, pLap, 'squash-wobble');
  typing(tSits + 0.1, tKey + 0.4, -7, pLap, 'cat belly mashes the keys: jjjjkkkk;;;;');
}

// ---- 14. close-up: the screen types ";size pancake 2" by itself
{
  const [a, b] = typeSpan(A[7], 'now', 'does');
  add(w(7, 'now') - 0.1, 'ui_pop', -6, 0, "a command bar pops in (user: pancake)");
  typing(a, b, -5, 0, "';size pancake 2' types itself");
  add(w(7, 'does'), 'blink', -8, 0, 'Pancake opens one smug eye');
  add(tEnter, 'click', -3, 0, 'ENTER (pressed by a paw)');
}

// ---- 15. "Command accepted." — POP: Pancake grows (size 2)
{
  const pLap = PC(1390, { zoom: 2.3, x: 1400 - 960 });
  add(A[8].a, 'confirm', -1, 0, '"Command accepted" stamp pops');
  add(tEnter + 0.12, 'upgrade', 0, pLap, 'size up: Pancake grows');
  add(tEnter + 0.4, 'thud', -4, pLap, 'the laptop creaks under the bigger cat (shake)');
  add(tEnter + 0.45, 'boing', -5, pLap, 'squash-wobble + flash');
}

// ---- 16. "...PANCAKE." (whispered, horrified)
add(CUT.gasp, 'zoom_in', -5, 0, 'snap to your horrified face');

// ---- 17. "The panel didn't keep one command." (the bigger smug cat on the laptop)
add(CUT.panel + 1.45, 'blink', -8, PC(1390, { zoom: 1.5, x: 1300 - 960 }), 'Pancake blinks, smug');

// ---- 18. "It kept one admin." — the tiny golden ADMIN crown drops on; slow push-in
add(tAdmin - 0.05, 'whoosh_down', -8, 0, 'the tiny golden crown drops in');
add(tAdmin + 0.15, 'equip', -1, 0, 'the crown lands on Pancake (flash)');
add(tAdmin + 0.2, 'shine', -3, 0, 'golden glint');
add(tAdmin + 0.3, 'sparkle', -7, 0, 'sparkles round the crown');
add(tAdmin + 1.2, 'blink', -6, 0, 'contented blink');
add(tAdmin + 2.5, 'blink', -6, 0, 'second slow blink');

// ================================================================= MUSIC (tiles [T0, END])
const M = (start, end, mood, energy, inn, out) => ({ start: r3(start), end: r3(end), mood, energy, in: inn, out });
function tile(a, b, list) {
  const pts = list.map((x) => x.slice());
  pts[0][0] = a;
  for (let i = 1; i < pts.length; i++) if (pts[i][0] < pts[i - 1][0] + 0.2) pts[i][0] = pts[i - 1][0] + 0.2;
  const keep = pts.filter((p, i) => i === 0 || p[0] < b - 0.2);
  return keep.map((p, i) => M(p[0], i + 1 < keep.length ? keep[i + 1][0] : b, ...p.slice(1)));
}
const music = tile(T0, END, [
  [T0, 'warm', 0.45, 'fade', 'cut'],                     // a normal morning... mostly; the gym pick line
  [tLast - 0.1, 'silence', 0, 'cut', 'cut'],             // picked last: tumbleweed + cricket
  [CUT.brick, 'tender', 0.5, 'swell', 'sting'],          // Brick is captain... and picks you first -> sting of joy
  [tFirst, 'silence', 0, 'cut', 'cut'],                  // the sting rings over the confetti
  [CUT.dad, 'playful', 0.45, 'cut', 'cut'],              // Dad: muted, misses the sky office
  [CUT.granny, 'playful', 0.65, 'cut', 'cut'],           // Granny is still fast (pancakes, bus, faster than the car)
  [CUT.zoe, 'explainer', 0.4, 'cut', 'sting'],           // Zoe and the sticky note -> button on "nice try."
  [tNice - 0.04, 'silence', 0, 'cut', 'cut'],
  [CUT.cat, 'playful', 0.45, 'cut', 'fade'],             // Pancake still sits on your keyboard (CLACK!)
  [CUT.type, 'mystic', 0.45, 'swell', 'sting'],          // "But now... when he does..." types by itself -> sting on "Command accepted"
  [tEnter + 0.45, 'silence', 0, 'cut', 'cut'],           // "...PANCAKE."
  [CUT.panel, 'mystic', 0.35, 'fade', 'cut'],            // "The panel didn't keep one command."
  [CUT.crown, 'hook', 0.6, 'cut', 'sting'],              // "It kept one admin." -> cheeky button on the crown
  [tAdmin + 0.2, 'silence', 0, 'cut', 'cut'],            // +1.5 s: Pancake blinks contentedly in his crown
]);

// ================================================================= AMBIENCE (beds per location)
const B = (start, end, name, gain_db) => ({ start: r3(start), end: r3(end), name, gain_db });
const ambience = [
  B(T0, CUT.pick, 'birds', -8),                 // morning outside the house
  B(T0, CUT.pick, 'town', -16),
  B(CUT.pick, CUT.dad, 'room', -9),             // the gym
  B(CUT.dad, CUT.granny, 'room', -12),          // the living room (Dad's call)
  B(CUT.granny, CUT.bus, 'kitchen', -10),       // Granny's kitchen
  B(CUT.bus, CUT.zoe, 'town', -8),              // the street: bus stop, store
  B(CUT.bus, CUT.zoe, 'birds', -12),
  B(CUT.zoe, END, 'room', -12),                 // your room
  B(CUT.zoe, END, 'birds', -20),                // through the window
];

// ================================================================= FOOTSTEPS
const footsteps = [];
// you walk to school (tiny, wide): AC.walk(t * 9) / AC.walkFront(t * 9) -> a step every PI/9 s
footsteps.push({ start: r3(CUT.morning + 0.6), end: r3(tMostly), interval: r3(Math.PI / 9), surface: 'hard', gain_db: -16, pan: PC(910, { zoom: 1.12, x: 0 }) });
// picked kids run off to the captain: AC.run(t * 14) -> a step every PI/14 s
footsteps.push({ start: r3(tPicked - 0.5), end: r3(tPicked - 0.5 + 3 * 0.28 + 0.6), interval: r3(Math.PI / 14), surface: 'wood', gain_db: -10, pan: -0.35 });
// Granny power-walks faster than the car: AC.walk(t * 30) -> a step every PI/30 s
footsteps.push({ start: r3(CUT.walk), end: r3(CUT.zoe), interval: r3(Math.PI / 30), surface: 'hard', gain_db: -8, pan: P(960 - 1.32 * 160) });
// Pancake pads along the bed (cat walk cycle t * 5.2: four paws -> soft pads every ~0.3 s)
footsteps.push({ start: r3(CUT.cat), end: r3(tSits - 0.25), interval: r3(Math.PI / 5.2 / 2), surface: 'soft', gain_db: -16, pan: 0.02 });

// ================================================================= sanity + write
sfx.sort((a, b) => a[0] - b[0]);
const inRange = (x) => x.start >= T0 - 1e-6 && x.end <= END + 1e-6 && x.end > x.start;
const sfxOk = sfx.filter((e) => e[0] >= T0 - 4 && e[0] < END);
if (sfxOk.length !== sfx.length) console.warn(`dropped ${sfx.length - sfxOk.length} sfx outside the scene`);
const out = { scene: 'SC 11', start: r3(T0), end: r3(END), music, ambience: ambience.filter(inRange), footsteps: footsteps.filter(inRange), sfx: sfxOk };
const J = (x) => JSON.stringify(x);
const txt = '{\n' +
  `  "scene": ${J(out.scene)},\n  "start": ${out.start},\n  "end": ${out.end},\n` +
  `  "music": [\n${out.music.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "ambience": [\n${out.ambience.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "footsteps": [\n${out.footsteps.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "sfx": [\n${out.sfx.map((m) => '    ' + J(m)).join(',\n')}\n  ]\n}\n`;
const dst = path.join(__dirname, 'sc11.json');
fs.writeFileSync(dst, txt);
console.log(`${dst}: ${out.music.length} music segments, ${out.ambience.length} beds, ${out.footsteps.length} footstep runs, ${out.sfx.length} sfx`);
