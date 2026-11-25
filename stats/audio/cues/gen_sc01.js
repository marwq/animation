#!/usr/bin/env node
// Sound cue sheet generator for SC 01 · COLD OPEN — the HUD blinks on in the school hallway (plates popping over everyone),
// the sea of plates, Mrs. Krump's door + FINAL BOSS (boss bar, glare, flicker), "Homework. On my desk. NOW." (pointer, the
// stampede, the shockwave), Tank's stomping walk (kids scatter, LV 80, HP 3/100 blinking, his stomach growls), Max bursting
// out of a locker and tearing through the hall (CHAOS counting up, kids spinning), RAWR!, the lunch lady (ladle splats,
// LV 50, SECRET SKILL stamp, the mystery meat opens an eye), the slow-motion walk through everybody's plates (nothing over
// the hero), SELF-SCAN: NO DATA, the mirror "???", "Why do I get QUESTION MARKS?!", the swats ("nope!"), VHS PAUSE (record
// scratch), REWIND, the plates folding into the title card, the white flash into SC 02.
// Every time comes from the voice timeline exactly like scenes/s01.js: the cut list (CUT) and the beats (BEATS) are imported
// from the scene module itself (built only from L(id).a/.b and .word()). When the voice changes:
//   node audio/cues/gen_sc01.js && python3 audio/validate_cues.py audio/cues/sc01.json
// Output: audio/cues/sc01.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { CUT: C, BEATS: B } = require('../../scenes/s01');
const { L } = V;

const l = (i) => L('01.' + i);
const w = (i, word, n = 0) => l(i).word(word, n).t0;
const T0 = 0, END = V.scene('SC 02').start;                       // == main.js RANGES for SC 01

const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const lerp = (a, c, k) => a + (c - a) * k;
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(Math.max(T0, t)), name, g, r3(pan), note]); };

// ================================================================= SFX, shot by shot (same order as scenes/s01.js)
// ---- 1. the HUD blinks on: POV down the deep hall, plates pop in a wave (near → far)
add(T0, 'tv_on', -2, 0, 'the HUD "eyelid" opens (CRT line)');
add(T0 + 0.05, 'glitch', -8, 0, 'boot glitch');
add(B.crt - 0.05, 'ui_pop', -6, 0, 'HUD frame brackets fly in');
add(B.crt + 0.3, 'beep', -12, 0.6, 'minimap radar on');
for (let i = 0; i < 12; i++) {
  const t0 = lerp(B.wave0, B.wave1, i / 11);
  add(t0 + 0.05, 'ui_pop', i < 2 ? -3 : -8 - (i % 3), (i % 2 ? 1 : -1) * (0.15 + 0.04 * i), `plate ${i + 1} pops over a student`);
}
add(B.wave1 - 0.2, 'money_counter', -14, 0, 'numbers roll in the plates');
// ---- 2. the sea of plates
add(C.sea - 0.04, 'whoosh', -8, 0.3, 'cut to the long hall');
add(C.sea + 0.3, 'ui_pop', -6, -0.1, 'JAY · SKILL: NAPPING');
add(C.sea + 0.6, 'ui_pop', -6, 0.3, 'COACH · WHISTLE: LEGENDARY');
add(C.sea + 0.75, 'whistle', -18, 0.35, 'the coach toots his whistle (far)');
add(B.real - 0.25, 'zoom_in', -8, 0, 'push on "real life?"');
// ---- 3. Mrs. Krump's door
add(B.door, 'door_open', -4, P(1190), 'Room 12 door swings open');
add(B.step, 'crowd_gasp', -12, 0, 'the hall freezes');
add(B.krumpPlate, 'ui_pop', -2, P(1250), 'her plate pops (LV 99)');
add(B.krumpPlate + 0.25, 'money_counter', -12, P(1250), 'LV counts to 99');
// ---- 4. FINAL BOSS
add(C.boss, 'dramatic', 0, 0, 'FINAL BOSS sting (smash close-up)');
add(B.bossBar, 'impact', -4, 0, 'the boss bar slams in');
add(B.bossHit, 'shine', -2, 0.1, 'glasses glint');
add(B.bossHit, 'orch_hit', -6, 0, 'boss hit');
for (const ft of B.flick) add(ft, 'electric', -14, 0, 'the hall lights flicker');
// ---- 5. "Homework." — the pointer comes up
add(B.hw - 0.15, 'swish', -4, 0.2, 'pointer whips up');
add(B.hw - 0.1, 'cloth', -12, 0.1, 'cardigan');
// ---- 6. "On my desk." — the stampede
add(B.run - 0.3, 'whoosh', -10, -0.6, 'kids sprint past');
for (let j = 0; j < 4; j++) add(B.run - 0.15 + j * 0.3, 'paper', -10, -0.4 + j * 0.25, 'homework flutters');
// ---- 7. "NOW."
add(B.nowHit, 'boom', 2, 0, 'NOW. — smash-zoom');
add(B.nowHit + 0.02, 'wind_gust', -6, 0, 'the shockwave rings');
add(B.nowHit + 0.08, 'paper', -6, 0, 'papers blasted away');
// ---- 8. Tank walks down the middle
add(C.tank, 'rumble', -12, 0, 'heavy footsteps approach');
add(B.scatter + 0.05, 'crowd_gasp', -8, 0, 'kids flatten against the lockers');
add(B.scatter + 0.15, 'whoosh', -10, -0.4, 'a kid dives left');
add(B.scatter + 0.3, 'whoosh', -10, 0.4, 'a kid dives right');
for (let n = 0; n < 5; n++) add(C.tank + (Math.PI * (n + 0.5)) / 5.2, 'thud', -10 + n, 0, 'stomp (camera shake)');
add(B.tankPlate, 'ui_pop', -2, 0, "Tank's plate (LV 80)");
add(B.tankPlate + 0.25, 'money_counter', -12, 0, 'LV counts to 80');
// ---- 9. "But his health... is almost zero."
add(B.health - 0.1, 'zoom_in', -6, 0, 'push into the HP bar');
add(B.health, 'heartbeat', -6, 0, 'heartbeat');
add(B.health + 0.1, 'alarm_beep', -10, 0, 'HP 3/100 blinking red');
add(B.zero, 'heartbeat', -4, 0, 'heartbeat on "zero"');
add(B.zero + 0.05, 'alarm_beep', -8, 0, 'low HP warning');
add(B.growl, 'monster_growl', -14, 0, "Tank's stomach growls (grrrumble...)");
// ---- 10. Max in the locker
for (let k = 0; k < 4; k++) { const tt = B.rattle + 0.071 + k * 0.2856; if (tt < B.burst - 0.05) add(tt, 'metal_clank', -8, P(860), 'thump — the locker rattles'); }
add(B.burst, 'metal_hit', 0, P(860), 'BANG! the locker bursts open');
add(B.burst + 0.02, 'explosion_small', -8, P(860), 'papers explode out');
add(B.burst + 0.05, 'whoosh_up', -6, P(800), 'Max leaps out');
add(B.maxLand, 'land', -4, P(1000), 'Max lands');
// ---- 11. "Chaos: nine thousand, nine hundred ninety-nine." — Max tears through the hall
add(C.chaos, 'whoosh', -6, 0.3, 'Max takes off');
add(B.maxPlate, 'ui_pop', -2, 0, "Max's plate");
for (const [tw] of B.chaos) add(tw, 'money_counter', -6, 0, 'CHAOS counts up');
add(B.chaos[3][0] + 0.3, 'slide_up', -6, 0.2, 'CHAOS overflows: 9999!');
add(B.chaos[3][0] + 0.32, 'sparkle', -8, 0.2, 'overflow sparks');
{
  const X0 = 520, X1 = -1750;
  [40, -520, -1080, -1520].forEach((kx, j) => {
    const th = C.chaos + ((X0 - kx) / (X0 - X1)) * (C.rawr - C.chaos) - 0.04;
    add(th, 'bonk', -4, 0, 'Max bowls a kid over');
    add(th + 0.05, 'boing', -10, j % 2 ? 0.2 : -0.2, 'the kid spins');
    add(th + 0.1, 'paper', -14, 0, 'papers fly');
  });
}
// ---- 12. RAWR!
add(B.skid, 'skid', -4, 0, 'Max skids to a stop');
add(B.rawr, 'monster_roar', -2, 0, 'RAWR! (softened, pitched cute)');
add(B.rawr + 0.02, 'boom', -6, 0, 'smash-zoom');
add(B.rawr + 0.1, 'crowd_gasp', -10, 0, 'kids blown back');
// ---- 13. the lunch lady
for (const lt of B.ladle) add(lt + 0.35, 'splat', -6, P(1800), 'a ladle of mystery meat');
add(B.ladyPlate, 'ui_pop', -2, 0, 'her plate pops (LV 50)');
add(B.ladyPlate + 0.25, 'money_counter', -12, 0, 'LV counts to 50');
add(B.secret, 'stamp', -2, 0.3, 'SECRET SKILL: MYSTERY MEAT slaps on');
// ---- 14. the mystery meat
add(C.meat, 'zoom_in', -4, 0, 'smash-zoom on the pan');
add(C.meat + 0.05, 'bubbles', -14, 0, 'the meat bubbles');
add(B.meatTip, 'ui_pop', -4, 0.3, '??? tooltip');
add(B.eye, 'squeak', -6, 0, 'the meat OPENS AN EYE');
add(B.eye + 0.9, 'blink', -4, 0, 'it blinks');
// ---- 15. slow motion: everybody's stats
add(C.every - 0.1, 'whoosh_long', -10, 0, 'into slow motion');
add(B.lookUp + 0.05, 'loading', -10, 0, 'the reticle scans his own head');
add(B.lookUp + 0.45, 'error', -10, 0, 'nothing there');
// ---- 16. SELF-SCAN: NO DATA + the restroom door
add(C.door + 0.05, 'error', -6, 0, 'SELF-SCAN: NO DATA');
add(B.enter - 0.25, 'door_open', -6, 0.2, 'the BOYS room door');
// ---- 17. the mirror: "???"
add(B.qPop, 'glitch', -6, 0.1, '??? pops over the reflection');
add(B.qPop + 0.05, 'ui_pop', -6, 0.1, '');
add(B.qPop + 0.3, 'error', -10, 0.1, 'NO DATA');
// ---- 18–19. "Question marks? Why do I get QUESTION MARKS?!"
add(w(8, 'marks'), 'glitch', -12, 0.1, 'the ??? scramble');
add(B.qShout - 0.05, 'zoom_in', -2, 0, 'smash-zoom on QUESTION MARKS');
add(B.qShout, 'boom', -6, 0, '');
add(B.qShout + 0.05, 'glitch', -8, 0, 'the plate glitches');
// ---- 20. the swats
B.swats.forEach((ts, i) => {
  add(ts - 0.08, 'jump', -8, 0, 'he jumps');
  add(ts, 'swish', -4, i ? 0.3 : -0.3, 'swat!');
  add(ts + 0.05, 'whoosh', -8, i ? 0.4 : -0.4, 'the plate dodges');
  add(ts + 0.1, 'boing', -10, i ? 0.4 : -0.4, '"nope!"');
  add(ts + 0.42, 'land', -10, 0, '');
});
add(C.pause - 0.32, 'jump', -8, 0, 'third jump (freezes mid-air)');
// ---- 21. VHS PAUSE
add(C.pause, 'record_scratch', 0, 0, 'freeze — "Okay."');
add(C.pause + 0.02, 'vhs_clunk', -4, 0, 'PAUSE');
// ---- 22. REWIND
add(C.rewind - 0.02, 'vhs_clunk', -4, 0, 'REWIND button');
add(C.rewind + 0.05, 'rewind', 0, 0, 'tape rewinds through the cold open');
add(C.rewind + 0.9, 'rewind', -2, 0, '');
// ---- 23. the plates fold → title card
add(C.title, 'whoosh_long', -4, 0, 'the plates fold into one point');
add(B.slam - 0.02, 'impact', 2, 0, 'the TITLE slams in');
add(B.slam + 0.1, 'level_up', -4, 0, 'title shimmer');
add(B.slam + 0.4, 'shine', -6, 0.2, '');
add(B.out - 0.05, 'whoosh', -6, 0, 'white flash into SC 02');

// ================================================================= MUSIC (tiles [T0, END])
const music = [
  { start: T0, end: C.boss, mood: 'levelup', energy: 0.65, in: 'cut', out: 'cut' },          // the hook: main theme
  { start: C.boss, end: C.tank, mood: 'boss', energy: 0.75, in: 'cut', out: 'cut' },          // FINAL BOSS + NOW.
  { start: C.tank, end: C.health, mood: 'boss', energy: 0.6, in: 'cut', out: 'fade' },        // Tank's walk
  { start: C.health, end: C.locker, mood: 'mystery', energy: 0.3, in: 'fade', out: 'cut' },   // HP 3 … the growl
  { start: C.locker, end: C.lunch, mood: 'chaos', energy: 0.9, in: 'cut', out: 'sting' },     // Max → RAWR!
  { start: C.lunch, end: C.every, mood: 'quest', energy: 0.5, in: 'cut', out: 'fade' },       // the lunch lady, the meat
  { start: C.every, end: C.why, mood: 'mystery', energy: 0.35, in: 'fade', out: 'cut' },      // everybody's... except yours
  { start: C.why, end: C.pause, mood: 'playful', energy: 0.65, in: 'cut', out: 'scratch' },   // the shout + swats → scratch
  { start: C.pause, end: C.title, mood: 'silence', energy: 0, in: 'cut', out: 'cut' },        // PAUSE / REWIND (tape sfx)
  { start: C.title, end: END, mood: 'levelup', energy: 1, in: 'cut', out: 'sting' },          // the title card
].map((s) => ({ ...s, start: r3(s.start), end: r3(s.end) }));

// ================================================================= AMBIENCE
const amb = [];
const bed = (a, b, name, g) => { if (b > a) amb.push({ start: r3(Math.max(a, T0)), end: r3(Math.min(b, END)), name, gain_db: g }); };
bed(T0, C.boss, 'crowd', -16);          // hallway chatter
bed(C.boss, C.tank, 'crowd', -26);      // the hall holds its breath
bed(C.tank, C.lunch, 'crowd', -18);
bed(C.lunch, C.every, 'crowd', -14);    // the cafeteria
bed(C.every, C.door, 'crowd', -26);     // slow motion: muffled
bed(C.door, C.mirror, 'crowd', -20);
bed(C.mirror, C.pause, 'room', -16);    // the boys' room

// ================================================================= FOOTSTEPS (cycles from the scene code: steps every π/K s)
const steps = [];
const st = (a, b, iv, surface, g, pan) => { if (b > a) steps.push({ start: r3(Math.max(a, T0)), end: r3(Math.min(b, END)), interval: r3(iv), surface, gain_db: g, pan: r3(pan) }); };
st(B.crt, C.sea, Math.PI / 8.6, 'hard', -16, 0);                   // shOpen: POV walk (camera bob sin(t·8.6))
st(C.sea, C.krump, Math.PI / 7, 'hard', -18, 0.1);                 // shSea: walkers AC.walk(t·7)
st(B.step, B.step + 0.8, Math.PI / 6, 'hard', -10, P(1250));       // shKrump: walkFront(t·6) heels
st(B.run - 0.35, B.run + 1.9, Math.PI / 18, 'hard', -12, -0.2);    // shDesk: the stampede run(t·18)
st(C.tank, C.health, Math.PI / 5.2, 'hard', -4, 0);                // shTank: walkFront((t − CUT.tank)·5.2) — heavy
st(C.chaos, C.rawr - 0.1, Math.PI / 20, 'hard', -10, 0);           // shChaos: run((t − CUT.chaos)·20)
st(C.every, B.lookUp, Math.PI / 4.5, 'hard', -16, 0);              // shEvery: the hero's walk(t·4.5)
st(B.enter - 0.15, C.mirror, Math.PI / 7, 'hard', -14, 0.1);       // shDoor: walkFront(t·7)

sfx.sort((a, b) => a[0] - b[0]);
const out = { scene: 'SC 01', start: r3(T0), end: r3(END), music, ambience: amb, footsteps: steps, sfx };
const file = path.join(__dirname, 'sc01.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log('wrote', file, '—', sfx.length, 'sfx,', music.length, 'music segments,', amb.length, 'ambience beds,', steps.length, 'footstep runs');
