#!/usr/bin/env node
// Sound cue sheet generator for SC 06 (СЛИШКОМ ИДЕАЛЬНО — the rehearsal resets, Thursday x412, the quiet workshop, dinner).
// Every time is derived from the voice timeline (scenes/vo.js L()/word()) through the SAME expressions scenes/s06.js animates
// with: s06.timing() re-derives the cut table C and the beat table B from vo on every run; MONT / LOOP are the montage
// constants of the scene. When the voice timeline changes, re-run:
//   node audio/cues/gen_sc06.js && python3 audio/validate_cues.py audio/cues/sc06.json
// Output: audio/cues/sc06.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const S06 = require('../../scenes/s06');

const { A, T0, END, C, B } = S06.timing();
const { MONT, LOOP } = S06;
const START = T0;
const r3 = (x) => Math.round(x * 1000) / 1000;
// the sheet covers exactly main.js RANGES for SC 06: [scene start, SC 07 start)
if (Math.abs(START - V.scene('SC 06').start) > 1e-9 || Math.abs(END - V.scene('SC 07').start) > 1e-9) throw new Error('range mismatch');

// ================================================================= music (tiles START..END)
const music = [
  { start: START, end: B.blast, mood: 'playful', energy: 0.45, in: 'fade', out: 'scratch' },          // Wednesday rehearsal, the blueprint, "Ladies and gentlemen!"
  { start: B.blast, end: B.pop1, mood: 'silence', energy: 0.3, in: 'cut', out: 'cut' },                 // SPLOOSH -> the snap -> RESETTING 3·2·1
  { start: B.pop1, end: C.flask, mood: 'loop', energy: 0.55, in: 'cut', out: 'cut' },                    // "and again... and again" — the reset montage
  { start: C.flask, end: C.thu, mood: 'loop', energy: 0.4, in: 'cut', out: 'cut' },                       // he hands her the flask before she reaches; "so weird"
  { start: C.thu, end: C.book, mood: 'loop', energy: 0.65, in: 'cut', out: 'tapestop' },                  // THURSDAY · VERSION 412, the perfect trick, the too-perfect hero
  { start: C.book, end: C.kinder, mood: 'tender', energy: 0.3, in: 'fade', out: 'fade' },                  // Ivy closes the Book of Fails
  { start: C.kinder, end: C.best, mood: 'warm', energy: 0.35, in: 'swell', out: 'fade' },                  // the crayon kindergarten flashback
  { start: C.best, end: END, mood: 'sad', energy: 0.28, in: 'fade', out: 'fade' },                          // "I miss that guy", alone, dinner, Gary turns away
];

// ================================================================= ambience
const ambience = [
  { start: START, end: C.hat, name: 'room', gain_db: -18 },
  { start: C.hatReal, end: C.kinder, name: 'room', gain_db: -18 },          // (the blueprint insert is dry)
  { start: START, end: C.book, name: 'birds', gain_db: -24 },                // garage door open, daytime
  { start: C.best, end: C.dinner, name: 'room', gain_db: -16 },             // the quiet workshop
  { start: C.dinner, end: END, name: 'kitchen', gain_db: -15 },
];

// ================================================================= footsteps (walk(t*K) -> one step every pi/K s)
const footsteps = [
  { start: C.alone + 0.2, end: C.alone + 1.75, interval: Math.PI / 9, surface: 'hard', gain_db: -12, pan: -0.45 },   // Ivy walks out (walk(wu*9))
  { start: B.stick + 0.35, end: C.best - 0.05, interval: Math.PI / 9, surface: 'soft', gain_db: -18, pan: 0.1 },    // the little kids walking, stuck together
].map((s) => ({ ...s, start: r3(s.start), end: r3(s.end), interval: r3(s.interval) }));

// ================================================================= sfx
const sfx = [];
const add = (t, name, gain = 0, pan = 0, note = '') => { if (t >= START - 4 && t < END) sfx.push([r3(t), name, gain, pan, note]); };
// ---- Wednesday
add(START + 0.02, 'swish', -10, 0, 'out of SC 05\'s white flash into the workshop');
add(B.wed + 0.08, 'stamp', -3, -0.4, 'WEDNESDAY calendar page slams in');
add(B.reh + 0.06, 'stamp', 0, -0.35, 'REHEARSAL rubber stamp');
add(C.trick, 'whoosh', -8, 0.3, 'whip to Ivy and the easel');
add(B.sheet - 0.05, 'cloth', -6, -0.4, 'Ivy yanks the sheet off the easel');
add(B.sheet + 0.05, 'tada', -10, -0.4, 'ELEPHANT TOOTHPASTE! chart revealed');
add(B.sheet + 0.1, 'sparkle', -10, -0.3, 'sparkles');
add(C.hat, 'whoosh', -8, 0, 'whip to the blueprint insert');
add(C.hat + 0.05, 'paper', -10, 0, 'blueprint paper');
add(B.volcano, 'swish', -12, 0, 'the volcano draws itself on');
add(B.foamW, 'whoosh_up', -6, 0, 'FOAM!!! bursts out of the drawing');
add(B.foamW + 0.1, 'bubbles', -12, 0, '');
add(C.hatReal, 'pop', -16, 0, 'cut to the real hat');
add(B.burp, 'poof', -4, 0.1, 'the hat burps a puff of foam: pfft!');
add(B.burp + 0.05, 'bubbles', -12, 0.1, '');
add(C.ladies, 'whoosh', -8, -0.2, 'whip: two-shot');
add(B.gent, 'sparkle', -6, -0.3, 'showman flourish, hat held high');
add(B.gent + 0.05, 'tada', -12, -0.3, '');
add(B.ordinary, 'swish', -14, -0.3, 'she tilts the hat to show it is empty');
add(B.dip, 'magic', -8, 0, 'her hand dips into the hat');
add(C.know, 'tap', -14, 0.2, 'smash to the flat close-up');
add(B.iknow, 'cloth', -14, 0.2, 'he shrugs');
// ---- the blast and the first reset
add(B.pour, 'splash', -10, -0.2, 'the flask tips into the hat');
add(B.pour + 0.12, 'sizzle', -8, -0.2, 'fzzz...');
add(B.pour - 0.3, 'riser', -8, 0, 'build to the eruption');
add(B.blast, 'whoosh_up', 0, -0.1, 'the foam jet erupts sideways');
add(B.blast + 0.22, 'big_splash', 3, 0.4, 'SPLOOSH! foam in his face');
add(B.blast + 0.25, 'impact', -6, 0.4, 'camera shake');
add(B.blast + 0.3, 'bubbles', -6, 0.4, '');
add(B.blast + 0.4, 'steam_hiss', -10, 0.4, 'foam fizzing');
add(B.blast + 0.6, 'giggle', -10, -0.2, 'Ivy can\'t help laughing');
add(C.drip + 0.35, 'pop', -18, 0.1, 'foam drip');
add(C.drip + 0.75, 'pop', -18, 0.1, 'foam drip');
add(B.snap, 'click', 0, 0.3, 'casual finger snap');
add(B.crumble, 'pop', -2, 0.1, 'he crumbles into blocks');
add(B.crumble + 0.03, 'stone', -4, 0.1, 'blocks');
add(B.crumble + 0.08, 'pixel_wipe', -8, 0, '');
{
  const ov0 = B.crumble + 0.1, dur = B.pop1 - B.crumble - 0.1;
  add(ov0, 'powerdown', -6, 0, 'grey RESETTING banner');
  add(ov0 + 0.02, 'countdown_tick', -4, 0.3, '3');
  add(ov0 + dur / 3, 'countdown_tick', -4, 0.3, '2');
  add(ov0 + (2 * dur) / 3, 'countdown_final', -2, 0.3, '1');
}
add(B.pop1, 'respawn', 0, 0.3, 'pop back onto the pad: the rehearsal starts over');
add(B.pop1 + 0.05, 'forcefield', -10, 0.3, '');
add(B.pop1 + 0.05, 'tap', -12, -0.9, 'RESETS: 1');
// ---- "and again": the knocked flask rewinds
add(B.knock, 'swish', -10, -0.3, 'Ivy\'s arm sweeps the green flask off the table');
add(B.crash, 'glass', -2, -0.5, 'CRASH!');
add(B.crash + 0.03, 'splash', -8, -0.5, '');
add(B.snap2, 'click', -2, 0.3, 'snap');
add(B.rew0, 'rewind', -2, 0, 'VHS rewind: the flask flies back up');
add(B.rew1 - 0.05, 'vhs_clunk', -8, 0, 'RESET');
add(B.rew1, 'tap', -12, -0.9, 'RESETS: 2');
// ---- "and again": Ivy's POV, fast pop
add(C.again2, 'whoosh', -10, 0, 'cut to Ivy\'s POV');
add(B.plop + 0.08, 'splat', -4, 0.3, 'a dollop of foam lands on his head');
add(B.fail3, 'pop', -4, 0.3, 'fast crumble');
add(B.fail3 + 0.02, 'stone', -8, 0.3, '');
add(B.fail3 + 0.3, 'respawn', -4, 0.3, 'fast pop');
// ---- the silent montage beat: micro-fails, each reset
{
  const names = ['splat', 'metal_hit', 'bonk', 'splash', 'slip'];
  const notes = ['PLOP: foam dollop', 'CLONK: the hat flips onto his head', 'BONK: a flask cork', 'ACHOO: Ivy sneezes foam', 'SLIP: foam puddle'];
  for (let i = 0; i < MONT.n; i++) {
    const t0 = MONT.a + i * MONT.p, kind = (i + 1) % 5, tf0 = Math.min(0.2, MONT.p * 0.45);
    const pan = [0.1, 0.3, 0.2][i % 3];
    add(t0, 'respawn', -12, pan, `montage loop ${i + 1}: pop`);
    add(t0 + tf0 * 0.8, names[kind], -4, pan, notes[kind]);
    add(t0 + tf0, 'pop', -8, pan, 'crumble');
    add(t0 + tf0 + 0.03, 'tap', -12, -0.9, 'RESETS counter rolls');
  }
  add(C.flask - 0.15, 'ui_pop', -8, -0.9, 'RESETS: 27');
}
// ---- the flask he hands her before she reaches; the sneeze; "on the ceiling"
add(C.flask, 'whoosh', -12, 0, 'cut');
add(B.take, 'glass', -14, 0.1, 'she takes the flask (clink)');
add(B.choo - 0.05, 'whoosh', -10, -0.3, 'the sneeze mime: ah-CHOO');
add(C.ceiling, 'tap', -14, 0.3, 'smash to his flat close-up');
add(B.ceil - 0.05, 'camera_flash', -8, -0.5, 'memory polaroid VERSION 87 pops');
add(B.ceil, 'paper', -10, -0.5, '');
add(C.dont, 'swish', -10, -0.6, 'the polaroid slides away');
add(B.dontDo, 'tap', -16, 0.3, 'finger wag');
add(B.dontDo + 0.2, 'tap', -16, 0.3, 'finger wag');
add(A[7].b + 0.15, 'cricket', -14, 0, 'awkward silence');
// ---- THURSDAY · VERSION 412
add(C.thu, 'whoosh', -6, 0, 'whip into the loop');
add(C.thu + 0.1, 'ui_pop', -6, 0, 'THURSDAY · VERSION counter');
for (let t = C.thu + LOOP; t < Math.min(B.four, C.perfect); t += LOOP) add(t, 'countdown_tick', -14, 0, 'the same moment loops: pop, again');
add(B.four - 0.15, 'whoosh_long', -6, 0, 'the frame shrinks into a wall of 412 identical Thursdays');
add(B.twelve, 'impact', -8, 0, 'VERSION 412');
add(B.twelve + 0.02, 'level_up', -12, 0, 'counter bump (hollow)');
add(C.perfect, 'whoosh_up', -6, -0.1, 'the perfect foam crown');
add(C.perfect + 0.1, 'bubbles', -12, -0.1, '');
add(B.perf1 - 0.05, 'stamp', -4, -0.4, 'PERFECT! stamp');
add(B.perf1, 'achievement', -8, -0.4, '');
add(C.youPerfect + 0.2, 'chime', -10, 0.3, 'grey quest marker spins over him');
add(B.YOU, 'impact', -10, 0, 'smash zoom on YOU');
// ---- the quiet part
add(B.close - 0.15, 'paper', -10, 0, 'pages');
add(B.close + 0.1, 'thud', -4, 0, 'Ivy closes the Book of Fails');
add(B.notEven - 0.2, 'reverse_swell', -10, 0.3, 'he fades toward a grey ghost');
add(B.here + 0.3, 'shine', -16, 0.3, 'colour returns');
add(C.kinder - 0.25, 'harp_up', -6, 0, 'into the crayon memory');
add(C.kinder + 0.05, 'magic', -14, 0, '');
add(B.glued + 0.1, 'squeak', -8, -0.3, 'the glue bottle squish');
add(B.stick, 'slap', -6, 0, 'hand on the backpack');
add(B.stick + 0.05, 'boing', -4, 0, 'stuck!');
add(B.stick + 0.55, 'giggle', -10, 0.1, 'the little kids laugh');
add(B.day0, 'chime', -12, -0.3, 'the crayon sun arcs over: the whole day');
add(B.day1, 'music_box', -12, 0.3, 'the moon');
add(C.best - 0.2, 'harp_down', -8, 0, 'back to the present');
add(B.leave + 0.3, 'cloth', -14, -0.1, 'Ivy turns to go');
// ---- dinner
add(C.dinner, 'dishes', -14, 0.4, 'dinner');
add(B.go - 0.05, 'ui_pop', -10, -0.6, 'the rimshot kit pops in, ready');
add(B.doctor + 0.3, 'cymbal', -18, -0.6, 'tss… the rimshot fizzles (no ba-dum)');
add(B.know, 'blink', -12, -0.2, 'Dad\'s smile freezes');
add(B.ALL, 'tap', -14, 0.3, 'accent on ALL');
{
  const flop = C.bea + 0.75 * (C.gary - C.bea);
  add(C.bea + 0.45 * (C.gary - C.bea), 'slide_down', -12, -0.4, 'the pancake slides off the lowered spatula');
  add(flop, 'splat', -10, -0.4, 'flop into the pan');
  add(flop + 0.03, 'pan_clang', -16, -0.4, '');
}
add(B.garyW + 0.2, 'blink', -12, 0.1, 'Gary\'s slow blink');
add(B.turn0, 'bubbles', -12, 0, 'Gary slowly turns...');
add(B.turn0 + 0.4, 'swish', -14, 0, '...his tail to the hero');
add(B.turn1 + 0.05, 'blink', -12, 0, 'blink');
add(END - 0.32, 'whoosh_down', -14, 0, 'dip to night blue (SC 07)');

sfx.sort((a, b) => a[0] - b[0]);
const out = {
  scene: 'SC 06', start: r3(START), end: r3(END),
  music: music.map((m) => ({ ...m, start: r3(m.start), end: r3(m.end) })),
  ambience: ambience.map((a) => ({ ...a, start: r3(a.start), end: r3(a.end) })),
  footsteps, sfx,
};
const file = path.join(__dirname, 'sc06.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log('wrote', file, `(${sfx.length} sfx, ${music.length} music segments)`);
