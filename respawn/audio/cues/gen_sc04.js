#!/usr/bin/env node
// Sound cue sheet generator for SC 04 (THE TUTORIAL: Tip's rules, the tumble down the stairs + the first respawn, the stolen
// pancake joke, the pause menu, the opera test + RESET CHARACTER, the grin, out of the door).
// Every time below comes from the voice timeline exactly like scenes/s04.js does: the cut list is the SAME code
// (scenes/s04.js CUTS, built only from L(id).a/.b and .word()), and the in-shot beats are re-derived here with the same
// L()/word() expressions as the scene. When the voice changes, re-run:
//   node audio/cues/gen_sc04.js && python3 audio/validate_cues.py audio/cues/sc04.json
// Output: audio/cues/sc04.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { L } = V;
const { CUTS } = require('../../scenes/s04');

const A = Array.from({ length: 19 }, (_, i) => L('04.' + i));
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;
const T0 = V.scene('SC 04').start, END = V.scene('SC 05').start;    // == main.js RANGES for SC 04
const { d01, d02, d03, d04, d05, tSlip, tCrumble, tPop, d08, d09, d10, d11, d12, d13, tFlip, d14, d15, tLand, d16, d17, d18, d19, d20, d21, d22, tSnap, d23, d24, d25, d26, d27, d28, d28b, d29, tM, tPress2, tCr2, d31, d32, d33, d34, d35, d36, d37 } = CUTS;

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));          // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(t), name, g, pan, note]); };

// ================================================================= SFX, shot by shot (same order as scenes/s04.js)
for (const [tc, d] of [[d03, 1], [d12, 1], [d13, -1], [d18, 1], [d26, -1], [d31, 1], [d36, 1]]) add(tc - 0.1, 'whoosh', -4, r3(0.3 * d), 'whip-pan');
add(END - 0.12, 'whoosh', -2, 0.4, 'whip-pan into SC 05');

// ---- 1. 7:30: pull back from the clock, stretch, Tip pops in
add(d01, 'whoosh', -8, 0, 'pull back from the clock');
add(d01 + 0.3, 'cloth', -8, P(640), 'big sleepy stretch');
add(A[0].a - 0.1, 'whoosh', -6, 0.5, 'Tip zooms in');
add(A[0].a + 0.35, 'boing', -6, P(850), 'Tip lands by his face');
add(A[0].a - 0.05, 'ui_pop', -4, P(1260), 'tip card pops');
add(A[0].a + 0.1, 'typing', -14, P(1260), 'tip card types');
// ---- 2. the hologram diagram
add(d02, 'ui_pop', -4, 0, "'TUTORIAL 1/3' hologram unfolds");
add(w(0, 'mess'), 'bonk', -6, P(1150), 'mini-you trips');
add(w(0, 'mess') + 0.2, 'pop', -6, P(1150), 'mini-you crumbles into blocks');
add(w(0, 'back') - 0.1, 'slide_up', -8, 0, 'the arrow loops back to the flag');
add(w(0, 'checkpoint'), 'respawn', -6, P(560), 'mini-you pops on the checkpoint');
// ---- 3. the landing: the clock spins backwards
add(d03, 'door_open', -6, -0.4, 'out of his room onto the landing');
add(d03 + 0.2, 'rewind', -6, P(1100), "Tip's clock spins backwards");
add(d03 + 0.05, 'ui_pop', -6, P(1400), 'tip card pops');
// ---- 4. only YOU remember
add(w(0, 'YOU') - 0.15, 'boom', -2, 0, 'spotlight on him');
add(w(0, 'YOU'), 'orch_hit', -6, P(1250), "'YOU!'");
// ---- 5. "Yeah, right." — waving Tip off
add(w(1, 'right'), 'swish', -8, -0.2, 'dismissive wave');
// ---- 6. the tumble -> crumble -> RESPAWNING 3·2·1
add(tSlip - 0.02, 'slip', 2, -0.3, "'WHOOPS!' foot on Bea's skateboard");
add(tSlip + 0.02, 'skate_roll', -2, 0, 'the skateboard shoots down the stairs');
add(tSlip + 0.3, 'body_fall', -2, -0.1, 'tumble: first bounce');
add(tSlip + 0.55, 'bonk', 0, 0.1, "'BONK'");
add(tSlip + 0.8, 'bonk', 0, 0.3, "'BONK'");
add(tSlip + 0.75, 'metal_clank', -6, 0.5, 'the board hits the front door');
add(tSlip + 1.02, 'thud', 0, 0.4, 'he hits the hallway floor');
add(tCrumble, 'pop', 0, 0.4, 'crumbles into blocks');
add(tCrumble + 0.04, 'stone', -4, 0.4, 'blocks scatter');
add(tCrumble + 0.1, 'pixel_wipe', -8, 0, 'the fail');
add(tCrumble + 0.22, 'powerdown', -2, 0, 'the world freezes and greys: RESPAWNING');
add(w(2, 'three'), 'countdown_tick', -2, 0, 'digit 3 slams');
add(w(2, 'two'), 'countdown_tick', -2, 0, 'digit 2 slams');
add(w(2, 'one'), 'countdown_final', -2, 0, "digit 1 + 'YOU FELL DOWN THE STAIRS'");
add(tPop, 'respawn', 2, P(870), 'pop on the pad in his room');
add(tPop + 0.03, 'forcefield', -6, P(870), 'spawn protection shimmers');
add(tPop + 0.15, 'ui_pop', -8, P(1700), 'TIME 7:30 pill');
// ---- 8. In my room
add(d08 + 0.2, 'whoosh', -8, 0.6, 'Tip floats in through the door');
add(d08 + 0.9, 'boing', -8, 0.2, 'Tip settles');
// ---- 9/10. 7:30 AGAIN!
add(w(3, 'seven-thirty'), 'vhs_clunk', -6, P(560), 'the minute hand snaps back to 7:30');
add(w(3, 'seven-thirty') + 0.03, 'bell', -6, P(1380), "'7:30'");
add(d10 + 0.06, 'zoom_in', -2, 0, 'smash zoom on his face');
add(d10 + 0.1, 'boom', 0, 0, 'AGAIN!');
// ---- 11. Told ya!
add(d11 + 0.05, 'boing', -6, 0.2, 'Tip bounces, smug');
add(d11 + 0.2, 'sparkle', -10, 0.4, 'smug sparkles');
// ---- 12. the majestic step over the skateboard
add(d12, 'angel', -4, 0, 'heavenly choir: the majestic step');
add(d12 + 0.3, 'sparkle', -8, 0, 'sparkles around the skateboard');
// ---- 13. the kitchen: Dad's joke, the flip
add(d13 + 0.05, 'sizzle', -12, -0.3, 'pancake in the pan');
add(tFlip - 0.05, 'swish', -2, P(650), "Dad flips: 'FLIP!'");
add(tFlip, 'whoosh_up', -4, P(650), 'the pancake flies up out of frame');
// ---- 14. the stolen punchline
add(A[6].b + 0.05, 'rimshot', -2, 0, 'ba-dum-tss (he told it first)');
// ---- 15. the pancake comes down on Dad's head
add(tLand - 0.45, 'whoosh_down', -6, P(650), 'the pancake falls back');
add(tLand, 'splat', 0, P(650), "'FLOP.' on Dad's head");
add(tLand + 0.3, 'blink', -6, P(650), 'Dad blinks');
// ---- 17. BRAND NEW joke!
add(w(7, 'BRAND') + 0.03, 'zoom_in', -4, 0, 'smash zoom on Dad');
add(w(7, 'BRAND') + 0.05, 'orch_hit', -4, 0.3, "'BRAND NEW?!'");
// ---- 18. move your checkpoint
add(A[8].a - 0.05, 'ui_pop', -4, P(620), 'tip card pops');
add(w(8, 'move') - 0.1, 'magic', -8, 0, 'Tip draws an arrow in the air');
for (let i = 0; i < 3; i++) add(d18 + 0.3 + i * 0.6, 'chomp', -14, 0.3, 'he chews pancakes');
// ---- 19. carry the flag, plant it, wherever you want
add(d19, 'ui_pop', -4, 0, "'TUTORIAL 2/3' hologram");
add(w(8, 'carry'), 'step', -16, -0.2, 'mini-you marches with the flag');
add(w(8, 'plant'), 'thud', -2, 0, 'the flag is planted');
add(w(8, 'plant') + 0.05, 'confirm', -6, 0, 'mini toast: Checkpoint saved');
for (let i = 0; i < 3; i++) add(w(8, 'wherever') + i * 0.32, 'swish', -6, 0, ['SCHOOL', 'BEACH', 'THE MOON'][i]);
// ---- 20. reset yourself anytime
add(d20 + 0.05, 'ui_pop', -4, P(640), 'tip card pops');
add(w(8, 'reset'), 'poof', -2, P(500), 'Tip resets itself: poof');
add(w(8, 'reset') + 0.35, 'respawn', -4, P(500), 'Tip pops back');
// ---- 21. just open the menu
add(d21 + 0.02, 'ui_pop', -4, P(1180), 'tip card pops');
add(w(8, 'menu'), 'pop', -6, P(1600), 'the II icon pops');
// ---- 22. What menu? + the snap
add(d22 + 0.1, 'cloth', -10, 0.4, 'shrug');
add(tSnap, 'click', 3, 0.4, "'SNAP!'");
// ---- 23. the giant pause menu over a frozen kitchen
add(tSnap + 0.02, 'powerdown', -2, 0, 'the world freezes');
add(d23 + 0.05, 'ui_pop', 0, 0, 'the pause menu unfolds in the air');
add(d23 + 0.15, 'whoosh_up', -6, 0, 'buttons slide in');
add(w(10, 'pause'), 'sparkle', -8, 0, 'sparkle on "pause menu"');
// ---- 24. what happens if I press Leave Game?
add(w(11, 'press') - 0.3, 'click', -6, 0, 'hover: RESET CHARACTER');
add(w(11, 'Leave') - 0.05, 'click', -4, 0, 'hover: LEAVE GAME');
add(w(11, 'Leave'), 'beep', -8, 0, 'LEAVE GAME turns red');
// ---- 25. Don't press Leave Game
add(d25, 'whoosh', -2, 0.5, 'Tip slams in front of the button');
add(d25 + 0.1, 'buzzer_wrong', -4, 0, "TIP: Don't press");
add(d25 + 0.08, 'ui_pop', -6, P(1500), 'red tip card');
add(d26 - 0.35, 'ui_close', -4, 0, 'menu folds away (resume)');
// ---- 26-28b. the opera test
add(d26 + 0.05, 'pop', -8, P(300), "'TEST #1'");
add(w(13, 'KIIING') + 0.05, 'cymbal', -4, P(1500), "'KIIING!'");
add(d28 + 0.4, 'glass', -10, -0.1, 'the window starts to crack');
add(d28 + 0.5, 'slide_down', -8, P(760), 'the pancake slides off the spatula');
add(d28b + 0.2, 'glass', 2, -0.3, "'CRACK!'");
// ---- 29. Make it stop.
add(w(14, 'stop') + 0.3, 'dishes', -4, P(1300), "Bea's spoon clatters on the plate");
// ---- 30. RESET CHARACTER (smash cut)
add(tM, 'ui_pop', 0, 0.4, 'the menu slams open');
add(tPress2, 'click', 0, 0.4, 'RESET CHARACTER pressed');
add(tPress2 + 0.03, 'confirm', -2, 0.4, "'RESET!'");
add(tCr2, 'pop', 0, 0, 'blocks burst off the chair');
add(tCr2 + 0.03, 'stone', -4, 0, 'blocks scatter');
add(tCr2 + 0.18, 'pixel_wipe', -4, 0, 'white flash');
add(tCr2 + 0.3, 'respawn', 0, P(870), 'pop on the pad, 7:30');
add(tCr2 + 0.35, 'rewind', -8, 0.5, '<< rewound');
add(tCr2 + 0.45, 'tap', -6, P(200), 'RESET 7:30 pill');
// ---- 31. nobody remembered a thing
add(d31 + 0.1, 'sizzle', -12, -0.3, 'pancakes sizzle again');
add(d31 + 0.6, 'swish', -6, -0.3, 'Dad flips, happy');
add(d31 + 1.4, 'pan_clang', -10, -0.3, 'back into the pan');
// ---- 32/33. Bea, suspicious
add(d32 + 0.2, 'squeak', -12, 0, 'suspicious squint');
add(d33 + 0.4, 'gulp', -4, 0.3, 'he sweats');
// ---- 34. a GOOD day
add(w(17, 'think') - 0.2, 'cloth', -8, 0, 'leans back, hands behind his head');
add(w(17, 'GOOD') - 0.05, 'shine', -2, 0, 'sun rays on "GOOD"');
add(w(17, 'GOOD'), 'boing', -6, -0.3, 'Tip bounces');
// ---- 35. backpack + flag, out of the kitchen
add(d35 + 0.25, 'equip', -4, 0.3, 'backpack on, the flag sticks out');
// ---- 36. out of the front door
add(d36 + 0.05, 'door_open', -6, 0, 'front door');
// ---- 37. jump for joy
{
  const tJ = w(18, 'matter') - 0.25;
  add(tJ, 'jump', -2, 0, 'jump for joy');
  add(tJ + 0.05, 'confetti', -4, 0, 'block confetti + sparkles');
  add(tJ + 0.1, 'tada', -8, 0, 'tiny fanfare');
  add(tJ + 0.6, 'land', -4, 0, 'lands');
}

sfx.sort((p, q) => p[0] - q[0]);

// ================================================================= MUSIC (tiles [T0, END])
const M = (start, end, mood, energy, inn, out) => ({ start: r3(start), end: r3(end), mood, energy, in: inn, out });
const music = [
  M(T0, tSlip, 'tutorial', 0.45, 'cut', 'cut'),         // Tip's rules, the diagram, the clock, the spotlight, "Yeah, right"
  M(tSlip, tCrumble, 'chaos', 0.8, 'cut', 'scratch'),   // the tumble down the stairs
  M(tCrumble, tPop, 'silence', 0, 'cut', 'cut'),        // RESPAWNING 3·2·1 (ticks only)
  M(tPop, d12, 'respawn', 0.5, 'cut', 'cut'),           // I'm back, 7:30 AGAIN, Told ya
  M(d12, d13, 'epic', 0.7, 'swell', 'cut'),             // the majestic step over the skateboard
  M(d13, d15, 'playful', 0.4, 'cut', 'cut'),            // Dad's joke, stolen
  M(d15, d16, 'silence', 0, 'cut', 'cut'),              // the beat: FLOP
  M(d16, d18, 'playful', 0.5, 'cut', 'cut'),            // BRAND NEW joke
  M(d18, tSnap, 'tutorial', 0.45, 'cut', 'cut'),        // move the flag, reset yourself, What menu?
  M(tSnap, d23 + 0.4, 'silence', 0, 'cut', 'cut'),      // the snap: the world freezes
  M(d23 + 0.4, d25, 'wonder', 0.45, 'swell', 'cut'),    // Real life had a pause menu; Leave Game?
  M(d25, d26, 'chaos', 0.6, 'cut', 'sting'),            // Don't press Leave Game!
  M(d26, tCr2, 'silence', 0, 'cut', 'cut'),             // the opera (sung) + "Make it stop."
  M(tCr2, d31, 'respawn', 0.6, 'cut', 'sting'),         // RESET (fast)
  M(d31, d35, 'warm', 0.4, 'fade', 'cut'),              // calm breakfast, Bea's suspicion, the grin
  M(d35, END, 'perfect', 0.65, 'swell', 'cut'),         // "And it was." — out into the perfect day
];

// ================================================================= AMBIENCE
const B = (start, end, name, gain_db) => ({ start: r3(start), end: r3(end), name, gain_db });
const ambience = [
  B(T0, d03, 'birds', -14),            // the bedroom, morning
  B(T0, tSlip, 'room', -16),           // bedroom / landing
  B(tPop, d12, 'birds', -14),          // back in the bedroom
  B(d13, tSnap, 'kitchen', -10),       // the kitchen
  B(d26, tCr2, 'kitchen', -12),        // the opera in the kitchen
  B(d31, d36, 'kitchen', -10),         // breakfast again
  B(d36, END, 'birds', -8),            // the street, sunny morning
  B(d36, END, 'town', -16),
];

// ================================================================= FOOTSTEPS (intervals = π / walk-cycle rate in s04.js)
const F = (start, end, interval, surface, gain_db, pan = 0) => ({ start: r3(start), end: r3(end), interval: r3(interval), surface, gain_db, pan });
const tRun = d35 + 0.75, tOut = d36 + 0.2, tJ = w(18, 'matter') - 0.25;
const footsteps = [
  F(d02 + 0.1, d03 - 0.05, Math.PI / 7, 'wood', -14, 0),           // shuffling across the room (walk(t * 7))
  F(d03, d03 + 0.8, Math.PI / 7, 'wood', -14, -0.3),              // out onto the landing
  F(d05, tSlip, Math.PI / 8, 'wood', -12, -0.2),                  // to the stairs (walk(t * 8))
  F(d13, d13 + 0.7, Math.PI / 9, 'hard', -12, 0.5),               // into the kitchen (walk(t * 9))
  F(tRun, d36, Math.PI / 16, 'hard', -10, 0.6),                   // runs out (run(t * 16))
  F(tOut, tJ, Math.PI / 10, 'hard', -12, 0),                      // down the path, along the sidewalk (walk(t * 10))
  F(tJ + 0.65, END - 0.05, Math.PI / 10, 'hard', -12, 0.3),
];

// ================================================================= write
const out = { scene: 'SC 04', start: r3(T0), end: r3(END), music, ambience, footsteps, sfx };
const file = path.join(__dirname, 'sc04.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
console.log('wrote', file, sfx.length, 'sfx,', music.length, 'music segments');
