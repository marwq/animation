#!/usr/bin/env node
// Sound cue sheet generator for SC 03 (CHECKPOINT 1000: 2 AM, the storm, MEGA OBBY, the lightning, Tip, "Checkpoint saved").
// Every time below comes from the voice timeline exactly like scenes/s03.js does: the cut list is the SAME code
// (scenes/s03.js CUTS, built only from L(id).a/.b and .word()), and the in-shot beats are re-derived here with the same
// L()/word() expressions as the scene. When the voice changes, re-run:
//   node audio/cues/gen_sc03.js && python3 audio/validate_cues.py audio/cues/sc03.json
// Output: audio/cues/sc03.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { L } = V;
const { CUTS } = require('../../scenes/s03');

const A = Array.from({ length: 13 }, (_, i) => L('03.' + i));
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;
const T0 = V.scene('SC 03').start, END = V.scene('SC 04').start;    // == main.js RANGES for SC 03
const { c01, c02, c03, c04, c05, c06, c07, c08, c09, c10, c11, c12, c13, c14, c15, c16, c17, c18, c19a, c19, c20, c21, c22, c23, c24, c25, c26, c27, c28, c29, c30, c31, c32, c33,
  tPress, tYes, tTouch, tStrike, tBurst, tPlant, tTipOut, tStep } = CUTS;

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));          // pan from screen x
const PW = (wx, cx, z) => P(960 + z * (wx - cx));                        // world x seen by a cam centred on cx at zoom z
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(t), name, g, pan, note]); };

// ================================================================= SFX, shot by shot (same order as scenes/s03.js)
for (const [tc, d] of [[c06, 1], [c09, -1], [c13, 1], [c26, -1]]) add(tc - 0.1, 'whoosh', -4, r3(0.3 * d), 'whip-pan');

// ---- 1. the house in the storm
add(c01 + 0.33, 'thunder', -2, 0.5, 'distant lightning over the street');
add(c01 + 0.6, 'rumble', -8, 0.3, 'thunder rolls');
// ---- 2/3. in bed, eyes open; the talent show is in four days
add(c02 + 0.7, 'thunder', -10, -0.2, 'window flashes, he stares at the ceiling');
add(c02 + 0.4, 'blink', -10, P(560), 'eyes dart');
add(c03 + 0.05, 'pop', -6, P(1250), 'thought bubble pops');
add(c03 + 0.3, 'kids_laugh', -12, P(1250), 'the laughing front row in the bubble');
add(w(0, 'four') - 0.05, 'stamp', -3, P(1460), "'4 DAYS' stamp slams");
add(w(0, 'days') + 0.2, 'gulp', -4, P(520), "'GULP'");
// ---- 4. tiptoe to the desk
add(c04 + 1.1, 'thunder', -8, -0.3, 'lightning beam through the window');
// ---- 5. the monitor wakes up; "scary" = thunder
add(c05 + 0.18, 'tv_on', -4, 0, 'the monitor switches on, blue light on his face');
add(w(0, 'scary') - 0.02, 'thunder', 2, -0.4, "'KRAKOOM!' lightning behind him");
add(w(0, 'scary'), 'squeak', -8, 0, 'he flinches');
add(w(0, 'scary') + 0.45, 'equip', -6, 0, 'headphones on');
// ---- 6. MEGA OBBY parkour
{
  const D = c07 - c06;
  for (const u of [0.12, 0.26, 0.38, 0.5, 0.62, 0.78, 0.9, 1.04]) {
    if (c06 + u * D - 0.16 < c07) add(c06 + u * D - 0.16, 'jump_game', -8, 0.1, 'avatar jumps to the next platform');
  }
  add(w(1, 'One') - 0.05, 'orch_hit', 0, 0, "'1000 STAGES' title slams");
}
// ---- 7. three months
add(c07 + 0.1, 'ui_pop', -8, P(1700), 'DAY counter pops in');
add(c07 + 0.2, 'money_counter', -10, P(1700), 'days + stages roll up');
add(c07 + 1.2, 'money_counter', -12, P(1700), 'rolling (cont.)');
add(c07 + 0.3, 'typing', -12, 0, 'hands on the keyboard');
add(w(1, 'three') - 0.05, 'bell', -6, P(1480), "'3 MONTHS' bang");
add(w(1, 'months'), 'pop', -6, P(1700), 'DAY 92 bump');
// ---- 8. the grid of falls
for (let i = 0; i < 6; i++) add(c08 + 0.25 + i * 0.6, 'splash', -14, r3(((i % 3) - 1) * 0.5), 'an avatar falls into the lava');
add(w(2, 'Four') - 0.1, 'ui_pop', -4, 0, 'FALLS counter pops');
add(w(2, 'Four'), 'money_counter', -6, 0, 'FALLS rolls up to 4,816');
add(w(2, 'eight'), 'money_counter', -7, 0, 'rolling (cont.)');
add(w(2, 'falls'), 'achievement', -6, 0, 'FALLS 4,816 bump');
// ---- 9. nobody laughed
{
  const tL = w(2, 'laughed');
  add(c09 + 0.12, 'jump_game', -6, 0, 'he jumps short');
  add(tL - 0.05, 'splash', -2, P(1100), 'into the lava');
  add(tL, 'pop', -4, P(1100), 'crumbles into blocks');
  add(tL + 0.05, 'stone', -8, P(1100), 'blocks sink in the lava');
  add(tL + 0.15, 'chat_pop', -8, P(1500), 'empty chat window opens: 0 online');
  add(tL + 0.4, 'cricket', -6, P(1500), 'nobody laughed');
  add(tL + 0.1, 'tap', -10, P(200), 'FALLS 4,817');
}
// ---- 10. you just... respawned
{
  const tP = w(2, 'respawned') + 0.05;
  add(tP - 0.75, 'loading', -10, P(1800), 'corner RESPAWNING pill counts');
  add(tP, 'respawn', -2, 0, 'pop on the checkpoint');
  add(tP + 0.05, 'forcefield', -8, 0, 'spawn protection');
  add(tP + 0.85 + 0.75 - 0.1, 'jump_game', -8, 0.3, 'off he goes again');
}
// ---- 11. "I wish real life had checkpoints."
add(w(3, 'checkpoints'), 'sparkle', -12, 0, 'a green glint in the screen light');
// ---- 12. 2:00
add(w(4, 'morning'), 'tap', -6, P(560), 'the minute hand ticks to 2:00');
add(w(4, 'morning') + 0.08, 'thunder', 0, -0.6, 'lightning in the window');
// ---- 13. STAGE 999
add(w(4, 'ninety-nine'), 'level_up', -6, 0, 'STAGE 999 bumps');
// ---- 14. one jump left
add(c14 + 0.25, 'whoosh_up', -8, 0, 'camera tilts up to the golden flag');
add(w(4, 'left') - 0.05, 'heartbeat', -4, 0, "'1 JUMP LEFT'");
// ---- 15/16. eyes, the finger
add(c15 + 0.1, 'heartbeat', -2, 0, 'ECU eyes, sweat');
add(c15 + 0.9, 'heartbeat', -2, 0, 'heartbeat');
add(tPress - 0.02, 'click', 2, 0, "'TAP!' SPACE");
add(tPress, 'jump_game', -2, 0, 'the jump');
// ---- 17. the slow-motion leap
add(c17, 'whoosh_long', -4, 0.2, 'slow-motion leap');
add(tTouch - 1.5, 'reverse_swell', -2, 0, 'swell into the touch');
add(tTouch, 'shine', 0, 0.3, 'his hand touches the final flag');
// ---- 18. lightning hits the house
add(tStrike - 0.02, 'thunder', 4, 0.2, 'lightning strikes the house');
add(tStrike, 'electric', 0, 0, 'the bolt hits the roof, sparks');
add(tStrike + 0.05, 'impact', 2, 0, "'KRA-KOOM!' white-out");
// ---- 19a. the power surge in the room
add(c19a, 'shock', -2, 0, 'power surge, the room flickers');
add(c19a + 0.25, 'glitch', -6, 0.3, "'BZZZT!' sparks over the desk");
add(c19a + 0.5, 'electric', -8, -0.3, 'sparks crawl along the monitor');
add(c19a + 0.6, 'riser', -10, 0, 'the screen floods the room with green (hum)');
// ---- 19/20. frozen YES; FINAL CHECKPOINT REACHED
add(c19, 'zoom_in', -6, 0, 'frozen in the YES pose');
add(c19 + 0.3, 'electric', -10, -0.5, 'sparks');
add(w(6, 'reached') - 0.05, 'ui_pop', -2, 0, 'SYSTEM window pops: FINAL CHECKPOINT REACHED');
add(w(6, 'reached') + 0.05, 'achievement', -4, 0, 'final checkpoint chime');
// ---- 21. Exporting... to real life
add(c21, 'ui_pop', -4, 0, 'the export window fills the frame');
add(w(6, 'Exporting'), 'loading', -6, 0, 'progress bar fills');
add(w(6, 'to'), 'loading', -6, 0, 'progress (cont.)');
add(w1(6, 'life') - 0.05, 'confirm', -2, 0, 'export 100%');
add(c21 + 0.4, 'electric', -12, -0.6, 'sparks');
// ---- 22. Exporting to WHAT?
add(w(7, 'WHAT') - 0.2, 'riser', -6, 0, 'the screen flares (riser into the burst)');
// ---- 23. the pad bursts out of the screen and loops round the room
add(c23, 'rumble', -4, P(1200), 'the screen bulges');
add(tBurst, 'explosion_small', 0, P(1250), 'the checkpoint pad bursts out of the screen');
add(tBurst + 0.02, 'whoosh_long', -2, P(900), 'the pad loops round the room');
add(tBurst + 0.05, 'cloth', -8, P(1240), 'he leaps out of the chair');
add(tBurst + 0.3, 'body_fall', -6, P(1240), 'he lands, ducks');
add(tPlant - 0.02, 'thud', 3, P(870), "'BOOM!' the pad slams into the rug");
add(tPlant, 'sub_drop', -2, 0, 'impact');
add(tPlant + 0.05, 'confirm', -8, P(870), 'the pad lights up');
// ---- 24. Tip squeezes out, bounces, WELCOME TO REAL LIFE!
add(c24 + 0.05, 'squeak', -6, 0, 'Tip squeezes through the screen');
add(tTipOut - 0.05, 'chat_pop', 0, 0, 'Tip pops free: Hiii!');
add(tTipOut, 'sparkle', -6, 0, 'burst of sparkles');
add(tTipOut + 0.3, 'boing', -4, 0.4, 'Tip bounces off the desk');
add(tTipOut + 0.75, 'boing', -3, -0.2, 'Tip bounces on the pad');
add(tTipOut + 1.15, 'heart_pop', -6, 0.2, 'Tip lands by his face');
add(w(8, 'Real') - 0.1, 'confetti', -4, 0, "'WELCOME TO REAL LIFE!' + block confetti");
add(w(8, 'Real') - 0.05, 'tada', -6, 0, 'welcome fanfare');
// ---- 25. the intro card
add(c25, 'whoosh', -2, 0.3, 'intro card slides in');
add(c25 + 0.12, 'stamp', -2, P(1380), "'TIP' name slams");
add(c25 + 0.4, 'ui_pop', -8, P(1390), 'CLASS: POP-UP');
for (let i = 0; i < 5; i++) add(c25 + 0.55 + i * 0.07, 'tap', -14, P(1450 + i * 48), 'helpfulness star');
add(w(8, 'tutorial') - 0.05, 'level_up', -4, P(1390), "'YOUR TUTORIAL!' pill pops");
// ---- 26. step on the checkpoint
add(w(8, 'TIP', 1) - 0.05, 'ui_pop', -4, P(620), 'tip card pops');
add(w(8, 'TIP', 1), 'typing', -12, P(620), 'tip card types');
add(w(8, 'checkpoint') - 0.1, 'pop', -6, P(870), 'pointer arrow bounces over the pad');
// ---- 27. backing away
add(w(9, 'pop-up'), 'swish', -6, P(1400), 'Tip spins happily');
// ---- 28. A HELPFUL talking pop-up!
add(w(10, 'HELPFUL') - 0.05, 'blush', -4, 0, 'Tip puffs up');
add(w(10, 'HELPFUL') + 0.05, 'stamp', -2, P(1450), "'HELPFUL!' stamp");
// ---- 29/30. the careful step; Checkpoint saved
add(tStep - 0.3, 'step_wood', -8, 0, 'careful foot lifts');
add(tStep, 'thud', -4, 0, 'foot lands on the pad');
add(tStep + 0.02, 'level_up', -2, 0, 'the flag shoots up');
add(tStep + 0.05, 'chime', -4, 0, 'save rings');
add(tStep + 0.05, 'whoosh_long', -6, 0, 'the green wave sweeps the room');
add(A[11].a - 0.1, 'achievement', -2, -0.5, "'Checkpoint saved' toast");
// ---- 31/32. Gary
add(c31 + 0.25, 'blink', -2, -0.2, "Gary's slow blink");
add(w(12, 'told'), 'bubbles', -10, -0.2, 'Gary turns away');
add(w(12, 'no') + 0.2, 'pop', -12, -0.2, 'one bubble');
// ---- 33. fast-forward to 7:30
add(c33, 'rewind', -4, 0, 'clock spins forward (fast-forward)');
add(c33 + 0.05, 'ui_pop', -8, P(1660), '>> OSD');
add(lerp(c33, END, 0.55), 'shine', -6, 0, 'night turns into morning (flash)');

sfx.sort((p, q) => p[0] - q[0]);

// ================================================================= MUSIC (tiles [T0, END])
const tP10 = w(2, 'respawned') + 0.05;
const M = (start, end, mood, energy, inn, out) => ({ start: r3(start), end: r3(end), mood, energy, in: inn, out });
const music = [
  M(T0, c05, 'mystery', 0.35, 'fade', 'cut'),          // night, storm, can't sleep, the talent show in four days
  M(c05, c06, 'tender', 0.3, 'cut', 'cut'),            // the monitor lights his face; KRAKOOM; headphones on
  M(c06, c09, 'game', 0.8, 'cut', 'cut'),              // MEGA OBBY parkour, 1000 STAGES, three months, 4,816 falls
  M(c09, tP10, 'sad', 0.3, 'cut', 'cut'),              // nobody laughed, nobody remembered
  M(tP10, c11, 'respawn', 0.5, 'cut', 'fade'),         // "...respawned." — the main theme, gentle
  M(c11, c12, 'tender', 0.3, 'fade', 'cut'),           // "I wish real life had checkpoints."
  M(c12, c17, 'climax', 0.55, 'cut', 'cut'),           // 2:00, STAGE 999, one jump left, eyes, the finger
  M(c17, tStrike, 'epic', 0.75, 'cut', 'sting'),       // the slow-motion leap -> touch
  M(tStrike, c19a, 'silence', 0, 'cut', 'cut'),        // the lightning strike (thunder only)
  M(c19a, c22, 'mystic', 0.5, 'swell', 'cut'),         // power surge, FINAL CHECKPOINT REACHED, Exporting to real life
  M(c22, tPlant, 'chaos', 0.85, 'cut', 'sting'),       // "Exporting to WHAT?" -> the pad bursts out -> BOOM
  M(tPlant, c24, 'silence', 0, 'cut', 'cut'),          // dust settles
  M(c24, c26, 'tutorial', 0.75, 'swell', 'cut'),       // Tip's big entrance, WELCOME TO REAL LIFE, the intro card
  M(c26, tStep, 'tutorial', 0.45, 'cut', 'cut'),       // step on the checkpoint, backing away, HELPFUL
  M(tStep, c31, 'respawn', 0.65, 'cut', 'sting'),      // Checkpoint saved (the theme, a short fanfare)
  M(c31, c33, 'playful', 0.3, 'cut', 'cut'),           // Gary saw the whole thing. Gary told no one.
  M(c33, END, 'tutorial', 0.5, 'swell', 'cut'),        // fast-forward to 7:30 (into SC 04's tutorial)
];

// ================================================================= AMBIENCE
const B = (start, end, name, gain_db) => ({ start: r3(start), end: r3(end), name, gain_db });
const ambience = [
  B(T0, c06, 'rain', -8),        // the storm outside / on the window
  B(T0, c06, 'night', -14),
  B(c07, c08, 'rain', -14),      // back at the desk (three months)
  B(c11, c17, 'rain', -12),      // the room at 2 AM
  B(c11, c17, 'room', -16),
  B(c18, c19a, 'rain', -4),      // exterior: the strike
  B(c19a, c33, 'rain', -14),     // the room, the storm continues
  B(c19a, c24, 'static', -18),   // the PC humming after the surge
  B(c33, END, 'birds', -10),     // morning
];

// ================================================================= FOOTSTEPS
const F = (start, end, interval, surface, gain_db, pan = 0) => ({ start: r3(start), end: r3(end), interval: r3(interval), surface, gain_db, pan });
const footsteps = [
  F(c04 + 0.15, c05 - 0.1, Math.PI / 9, 'wood', -12, -0.1),      // tiptoe to the desk (walk((t - c04) * 9))
  F(c27, Math.min(c28, c27 + 2.0), Math.PI / 11, 'wood', -12, 0.2), // backing away (walkFront(t * 11))
];

// ================================================================= write
const out = { scene: 'SC 03', start: r3(T0), end: r3(END), music, ambience, footsteps, sfx };
const file = path.join(__dirname, 'sc03.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
console.log('wrote', file, sfx.length, 'sfx,', music.length, 'music segments');
