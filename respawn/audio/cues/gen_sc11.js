#!/usr/bin/env node
// Sound cue sheet generator for SC 11 (ПОСЛЕ — Saturday waffle joke, Monday "Sixty-four!", the skate park for real,
// BOOK OF FAILS · VOL. 2). Every time is derived from the voice timeline (scenes/vo.js L()/word()) through the SAME
// expressions scenes/s11.js animates with: s11.timing() re-derives the cut table C and the beat table B from vo on every run;
// s11.TR are the skate trick's beats. When the voice timeline changes, re-run:
//   node audio/cues/gen_sc11.js && python3 audio/validate_cues.py audio/cues/sc11.json
// Output: audio/cues/sc11.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const S11 = require('../../scenes/s11');

const { A, START, END, C, B } = S11.timing();
const TR = S11.TR;
const r3 = (x) => Math.round(x * 1000) / 1000;
// the sheet covers exactly main.js RANGES for SC 11: [scene start, SC 12 start)
if (Math.abs(START - V.scene('SC 11').start) > 1e-9 || Math.abs(END - V.scene('SC 12').start) > 1e-9) throw new Error('range mismatch');

// ================================================================= music (tiles START..END)
const music = [
  { start: START, end: B.ba, mood: 'playful', energy: 0.45, in: 'fade', out: 'cut' },                   // Saturday, the waffle joke
  { start: B.ba, end: C.laugh, mood: 'silence', energy: 0.3, in: 'cut', out: 'cut' },                  // BA-DUM TSS, "Waffles are square.", Dad deflates
  { start: C.laugh, end: C.cls, mood: 'warm', energy: 0.5, in: 'swell', out: 'cut' },                    // he laughs for real, "I LOVE it."
  { start: C.cls, end: C.skate, mood: 'playful', energy: 0.5, in: 'cut', out: 'fade' },                  // Monday: "Sixty-four!" — the class laughs with him
  { start: C.skate, end: TR.apex, mood: 'respawn', energy: 0.65, in: 'cut', out: 'tapestop' },           // the skate trick, for real
  { start: TR.apex, end: B.ouch, mood: 'silence', energy: 0.3, in: 'cut', out: 'cut' },                  // slow-motion hang: the board flips away
  { start: B.ouch, end: C.gift, mood: 'respawn', energy: 0.7, in: 'cut', out: 'sting' },                 // Ouch -> laughing on the asphalt -> 6/10 -> Attempt TWO!
  { start: C.gift, end: END, mood: 'warm', energy: 0.45, in: 'fade', out: 'fade' },                      // BOOK OF FAILS · VOL. 2 -> night (SC 12)
];

// ================================================================= ambience
const ambience = [
  { start: START, end: C.cls, name: 'kitchen', gain_db: -15 },
  { start: C.cls, end: C.skate, name: 'crowd', gain_db: -24 },        // classroom murmur
  { start: C.skate, end: C.gift, name: 'birds', gain_db: -12 },
  { start: C.skate, end: C.gift, name: 'town', gain_db: -24 },
  { start: C.gift, end: END, name: 'room', gain_db: -18 },
  { start: C.gift, end: END, name: 'birds', gain_db: -24 },           // garage door open
];

// ================================================================= footsteps (walkFront(t*9) -> one step every pi/9 s)
const footsteps = [
  { start: C.ouch, end: B.card - 0.1, interval: Math.PI / 9, surface: 'hard', gain_db: -12, pan: 0.4 },   // Ivy walks over with the card
].map((s) => ({ ...s, start: r3(s.start), end: r3(s.end), interval: r3(s.interval) }));

// ================================================================= sfx
const sfx = [];
const add = (t, name, gain = 0, pan = 0, note = '') => { if (t >= START - 4 && t < END) sfx.push([r3(t), name, gain, pan, note]); };
// ---- Saturday kitchen
add(START + 0.02, 'bubbles', -8, 0, 'SC 10\'s foam clears off the frame');
add(START + 0.05, 'whoosh_up', -10, 0, '');
add(B.satCard + 0.08, 'stamp', -4, 0.55, 'SATURDAY calendar page');
add(B.satCard + 0.12, 'chime', -14, 0.55, '');
add(B.brandNew - 0.2, 'swish', -10, -0.3, 'Dad raises the spatula with the waffle');
add(C.waffle, 'whoosh', -10, 0, 'whip to Dad');
add(B.school, 'pop', -6, 0.1, 'the waffle gets a graduation cap');
add(B.school + 0.03, 'sparkle', -8, 0.1, '');
add(B.rounded, 'impact', -12, 0, 'smash: jazz hands');
add(B.ba, 'rimshot', 0, -0.6, 'the full rimshot: BA-DUM TSS!');
add(B.tss + 0.1, 'cymbal', -10, -0.6, 'cymbal wobble');
add(B.square, 'record_scratch', -6, 0.2, '"Waffles are square." (dashed square outline)');
add(B.square + 0.05, 'ui_pop', -10, 0.2, '');
add(C.minute + 0.15, 'sad_trombone', -4, -0.2, 'Dad deflates');
add(C.minute + 0.45, 'slide_down', -12, -0.2, 'the cap slides, the waffle slips');
add(C.minute + 0.75, 'splat', -8, -0.2, 'the waffle flops into the pan');
add(C.minute + 0.78, 'pan_clang', -14, -0.2, '');
add(B.worst + 0.2, 'giggle', -10, 0.3, 'Bea giggles (gap-tooth grin)');
add(B.LOVE - 0.05, 'heart_pop', -4, -0.2, 'Dad re-inflates: love eyes');
add(B.LOVE + 0.05, 'boing', -10, -0.2, 'a little hop');
add(B.LOVE + 0.1, 'sparkle', -8, -0.2, '');
// ---- Monday class
add(C.cls, 'whoosh', -8, 0, 'whip to the classroom');
add(C.cls + 0.02, 'ui_pop', -10, -0.6, '"7 × 9 = ?" bubble');
add(C.cls + 0.05, 'ui_pop', -14, 0.8, 'MONDAY tag');
add(B.hand, 'whoosh_up', -4, 0, 'his hand shoots up FIRST');
add(B.hand + 0.08, 'chime', -10, 0.2, 'FIRST!');
add(B.write63 - 0.05, 'squeak', -6, 0, 'Mr. Fig writes 63 (marker squeak)');
add(B.write63 + 0.15, 'buzzer_wrong', -14, 0.5, 'the 64 gets a red cross');
add(A[6].a + 0.05, 'kids_laugh', -2, 0, 'the whole class laughs — and so does he');
add(B.fine, 'sparkle', -8, 0, '"And it was fine."');
add(B.fine + 0.05, 'chime', -12, 0, '');
// ---- the skate park, for real
add(C.skate, 'whoosh', -8, 0, 'whip to the skate park');
add(C.skate + 0.05, 'skate_roll', -6, -0.3, 'he rolls in');
add(B.real - 0.15, 'ui_pop', -8, -0.9, 'ATTEMPT 1 / LIVES: 1');
add(B.real, 'heartbeat', -12, 0, 'for real this time');
add(C.attempt, 'skate_roll', -4, -0.2, 'the run-up');
add(B.attempt, 'tap', -10, -0.9, 'ATTEMPT 1 bumps');
add(TR.base, 'whoosh', -6, 0.1, 'into the quarter-pipe');
add(TR.lip, 'whoosh_up', -4, 0.3, 'launch off the lip');
add(TR.apex, 'reverse_swell', -8, 0.3, 'slow-motion hang time');
add(TR.apex + 0.05, 'swish', -8, 0.4, 'the board kickflips away without him');
add(TR.off, 'fall_whistle', -8, 0.2, 'uh-oh');
add(B.ouch, 'body_fall', 0, 0, 'lands on his butt: OUCH!');
add(B.ouch + 0.02, 'thud', -2, 0, '');
add(B.ouch + 0.08, 'dizzy', -6, 0, 'stars');
add(B.ouch + 0.18, 'skid', -8, 0.4, 'the board clatters down');
add(C.ouch + 0.25, 'giggle', -6, -0.1, 'he flops back laughing');
add(B.card - 0.05, 'ui_pop', -4, 0.4, 'Ivy holds up 6/10');
add(B.card + 0.05, 'tada', -14, 0.4, '');
add(B.up, 'jump', -4, 0, 'he springs up, board overhead');
add(B.TWO, 'impact', -8, 0, '"Attempt TWO!"');
add(B.TWO + 0.02, 'level_up', -6, -0.9, 'ATTEMPT 2');
// ---- the workshop: BOOK OF FAILS · VOL. 2
add(C.gift, 'whoosh', -8, 0, 'whip to the workshop');
add(B.offer, 'cloth', -12, -0.1, 'Ivy holds out the new book');
add(B.take, 'paper', -8, 0.2, 'he takes it');
add(B.take + 0.05, 'sparkle', -6, 0.2, '');
add(B.take + 0.1, 'chime', -8, 0.2, '');
add(C.write1, 'paper', -12, 0, 'the book opens on the star tablecloth');
add(B.fail, 'typing', -16, -0.1, 'pencil scratch: FAIL #1:');
add(B.talent, 'typing', -16, -0.1, 'pencil: Talent show');
add(B.lesson, 'typing', -18, 0.1, 'pencil: LESSON:');
add(C.write2, 'paper', -14, 0, 'back to the page');
add(B.totally, 'typing', -16, 0.2, 'pencil: totally worth it!');
add(B.worth, 'stamp', -6, 0.2, 'a gold star sticker');
add(B.worth + 0.05, 'sparkle', -8, 0.2, '');
add(C.end + 0.05, 'giggle', -10, 0, 'they laugh');
add(END - 0.38, 'harp_down', -12, 0, 'dip to night (SC 12)');

sfx.sort((a, b) => a[0] - b[0]);
const out = {
  scene: 'SC 11', start: r3(START), end: r3(END),
  music: music.map((m) => ({ ...m, start: r3(m.start), end: r3(m.end) })),
  ambience: ambience.map((a) => ({ ...a, start: r3(a.start), end: r3(a.end) })),
  footsteps, sfx,
};
const file = path.join(__dirname, 'sc11.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log('wrote', file, `(${sfx.length} sfx, ${music.length} music segments)`);
