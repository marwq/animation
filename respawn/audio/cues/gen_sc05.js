#!/usr/bin/env node
// Sound cue sheet generator for SC 05 (ИДЕАЛЬНЫЙ ДЕНЬ — the perfect day at school: the flag by the door, the skateboard
// montage + the slow-mo attempt 57, the pop quiz reset, bullet-time dodgeball, the cafeteria joke, ATTEMPTS TODAY: 214).
// Every time below comes from the voice timeline exactly like scenes/s05.js does: the cut list (CUT) and the in-shot
// beats (BEATS) are imported from the scene module itself (built only from L(id).a/.b and .word()), and the few
// remaining in-shot offsets are re-derived here with the same expressions as the scene. When the voice changes, re-run:
//   node audio/cues/gen_sc05.js && python3 audio/validate_cues.py audio/cues/sc05.json
// Output: audio/cues/sc05.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { CUT, BEATS } = require('../../scenes/s05');
const { L } = V;

const A = Array.from({ length: 21 }, (_, i) => L('05.' + i));
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;
const T0 = V.scene('SC 05').start, END = V.scene('SC 06').start;    // == main.js RANGES for SC 05
const { tF1, tF2, tF23, tPlant, tLaunch, tLand, tSnap, tHl, tPress, tStamp, tWhistle, tReset, DODGES } = BEATS;

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const lerp = (a, c, k) => a + (c - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));     // pan from screen x
const PW = (wx, cx, z) => P(960 + z * (wx - cx));                  // world x seen by a camera centred on cx with zoom z
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(t), name, g, pan, note]); };
// a fail: hit + blocks
const crumble = (t, pan, note, g = 0) => { add(t, 'pop', g - 2, pan, `${note}: white pop`); add(t + 0.03, 'stone', g - 4, pan, `${note}: blocks scatter`); add(t + 0.35, 'rock_drop', g - 12, pan, `${note}: blocks land`); };
// counter roll ticks
const ticks = (a, b, step, g, pan, note) => { for (let t = a; t < b; t += step) add(t, 'tap', g, pan, note); };

// ================================================================= SFX, shot by shot (same order as scenes/s05.js)
// ---- 1. walking in (continues SC 04's whip-pan to the right)
add(T0, 'whoosh', -6, 0.3, 'whip-pan in from SC 04');
add(w(0, 'checkpoint'), 'sparkle', -6, P(560), 'the flag in the backpack glints on "checkpoint"');
add(w(0, 'school'), 'jump', -10, P(640), 'happy hop on "school"');
add(w(0, 'school') + 0.36, 'land', -12, P(640), 'lands from the hop');
// ---- 2. the flag comes out and slams into the ground; SYSTEM: "Checkpoint saved."
{
  const tGrab = w(0, 'backpack'), tSave = A[1].a;
  add(tGrab, 'swish', -2, P(700), 'yanks the flag out of the backpack');
  add(tGrab + 0.12, 'sparkle', -8, P(780), 'the raised flag sparkles');
  add(tPlant - 0.18, 'whoosh_down', -3, P(900), 'swings the flag down');
  add(tPlant, 'thud', 2, P(980), 'THUNK! the flag spikes into the ground (shake)');
  add(tPlant + 0.02, 'confirm', -2, P(980), 'planted: the checkpoint pad pops up');
  add(tPlant + 0.05, 'impact', -6, P(980), 'dirt puff');
  add(tSave - 0.1, 'ui_pop', -6, P(300), '"Checkpoint saved" toast');
  add(tSave - 0.05, 'level_up', -3, P(980), 'checkpoint saved: green wave sweeps the frame');
  add(tSave + 0.3, 'chime', -6, P(980), 'saved chime');
  add(tSave + 0.2, 'sparkle', -9, P(800), 'fist pump sparkles');
}
// ---- 3. whip-pan to the skate area; he rolls in
add(CUT.skate, 'whoosh', -2, 0.3, 'whip-pan to the skate area');
add(CUT.skate + 0.1, 'skate_roll', -4, -0.3, 'rolls in on the skateboard');
add(w(2, 'trick') + 0.05, 'sparkle', -9, P(1100), 'wink at the crowd');
// ---- 4. ATTEMPT 1: up the ramp, crumbles in the air (corner RESPAWNING pill)
add(CUT.a1, 'ui_pop', -8, P(200), 'ATTEMPT counter pops in');
add(CUT.a1 + 0.05, 'skate_roll', -3, -0.1, 'rides up the ramp');
add(w(2, 'one'), 'tap', -5, P(200), 'counter bump: 1');
add(tF1 - 0.3, 'whoosh_up', -4, 0.1, 'launch off the ramp');
add(tF1 - 0.01, 'impact', 0, P(1000), 'attempt 1 fails mid-air');
crumble(tF1, P(1000), 'attempt 1');
add(tF1 + 0.05, 'crowd_gasp', -8, -0.3, 'the crowd winces');
add(tF1 + 0.06, 'countdown_tick', -8, P(1750), 'corner RESPAWNING pill counts');
add(CUT.r1 - 0.06, 'countdown_final', -6, P(1750), 'corner pill hits 1 (white flash)');
// ---- 5. pop on the flag by the door, then he sprints back
{
  const tPop = CUT.r1 + 0.04;
  const tDash = tPop + Math.max(0.35, CUT.a2 - tPop - 0.42);
  add(tPop, 'respawn', -1, P(700), 'pops on the checkpoint by the door');
  add(tPop + 0.05, 'forcefield', -9, P(700), 'spawn forcefield shimmer');
  add(tPop + 0.45, 'pop', -7, P(1180), '"AGAIN!" bang');
  add(tDash, 'whoosh', -2, 0.4, 'sprints off right with the board');
}
// ---- 6. ATTEMPT 2: the rail, OOF, VHS rewind (counter rolls 2 -> 23)
{
  const tOl = Math.min(CUT.a2 + 0.3, tF2 - 0.4), tOn = tOl + 0.2;
  const tRw0 = tF2 + 0.3, tRw1 = CUT.a23 - 0.03;
  add(CUT.a2, 'skate_roll', -4, -0.4, 'rolls toward the rail');
  add(tOl, 'jump', -5, -0.1, 'ollie onto the rail');
  add(tOn, 'metal_hit', -5, 0, 'board lands on the rail');
  add(tOn + 0.02, 'skid', -7, 0, 'grind (sparks)');
  add(w(2, 'two'), 'tap', -5, P(200), 'counter bump: 2');
  add(tF2 - 0.01, 'bonk', 0, P(1200), 'OOF! slams onto the rail');
  crumble(tF2, P(1200), 'attempt 2');
  add(tF2 + 0.05, 'crowd_gasp', -9, -0.2, 'crowd winces');
  add(tRw0, 'vhs_clunk', -4, 0, 'REWIND: the VHS clunk');
  add(tRw0 + 0.02, 'rewind', -2, 0, 'blocks scrub back together');
  ticks(tRw0 + 0.15, tRw1 - 0.05, 0.22, -12, P(200), 'counter rolls 2 -> 23');
  add(tRw1 - 0.05, 'vhs_clunk', -8, 0, 'rewind ends');
}
// ---- 7. ATTEMPT 23: CLANG into the trash can
add(CUT.a23, 'skate_roll', -4, -0.3, 'rolls toward the trash can');
add(tF23 - 0.36, 'jump', -5, 0, 'jumps the can');
add(w(2, 'twenty-three'), 'tap', -5, P(200), 'counter bump: 23');
add(tF23 - 0.01, 'metal_hit', 3, P(1100), 'CLANG! into the trash can (big shake)');
add(tF23, 'impact', -3, P(1100), 'impact');
crumble(tF23 + 0.01, P(1100), 'attempt 23');
add(tF23 + 0.05, 'metal_clank', -6, P(1250), 'the lid flies off');
add(tF23 + 0.06, 'crowd_gasp', -8, -0.3, 'crowd gasps');
// ---- 8. split-screen montage: crumbles in every direction (2 -> 4 -> 9 panels), counter rolls 23 -> 56
{
  const dur = CUT.a57 - CUT.mont, d1 = dur * 0.3, d2 = dur * 0.6;
  add(CUT.mont, 'whoosh', -4, 0, 'smash cut into the split screen');
  add(CUT.mont, 'pixel_wipe', -8, 0, 'panels pop in');
  const phases = [[0, 2, 2], [d1, 4, 2], [d2, 9, 3]];
  phases.forEach(([t0, n, cols], ph) => {
    if (ph) add(CUT.mont + t0 - 0.03, 'camera_flash', -8, 0, `the grid splits into ${n} panels`);
    for (let i = 0; i < n; i++) {
      const crash = CUT.mont + t0 + i * 0.04 + 0.14 + 0.03 * (i % 3);
      if (ph === 2 && i % 2) continue;                       // 9 at once: every other one
      const sx = ((i % cols) + 0.5) * (1920 / cols);
      add(crash, i % 2 ? 'stone' : 'pop', ph === 2 ? -11 : -7, P(sx), `montage crumble #${i + 1} (${n} panels)`);
    }
  });
  ticks(CUT.mont + 0.05, CUT.a57 - 0.15, 0.18, -12, P(200), 'counter rolls 23 -> 56');
}
// ---- 9. ATTEMPT 57: the slow-motion kickflip (4 angles), PERFECT! landing on the deck
{
  const tAt = (p) => lerp(tLaunch, tLand, p);
  add(CUT.a57, 'skate_roll', -2, -0.2, 'attempt 57: rides up the ramp');
  add(w(3, 'fifty-seven'), 'tap', -4, P(200), 'gold counter bump: 57');
  add(tLaunch - 0.05, 'reverse_swell', -3, 0, 'into slow motion');
  add(tLaunch, 'whoosh_up', -2, 0.1, 'launch');
  add(tAt(0.3), 'whoosh_long', -4, 0, 'close-up: the board flips under his feet (slowed)');
  add(tAt(0.3) + 0.4, 'swish', -8, 0, 'the board spins');
  add(tAt(0.58), 'crowd_gasp', -4, -0.2, 'slow-motion crowd: mouths open, a juice box drops');
  add(tAt(0.8), 'whoosh', -6, 0.2, 'back to the wide: coming down');
  add(tLand, 'land', 2, P(960), 'lands perfectly on the deck');
  add(tLand + 0.02, 'skate_roll', -6, P(960), 'wheels on the deck');
  add(tLand + 0.03, 'orch_hit', -2, P(1460), '"PERFECT!" pops');
  add(tLand + 0.1, 'achievement', -5, P(1460), 'perfect-trick sting');
}
// ---- 10. KID: "WHOA! ... First try!" — the crowd goes wild
add(CUT.whoa, 'crowd_cheer', 0, 0, 'smash cut: the crowd goes wild');
add(CUT.whoa + 0.02, 'applause', -6, -0.1, 'applause');
add(CUT.whoa + 0.1, 'camera_flash', -10, -0.5, 'phones filming');
add(CUT.whoa + 0.4, 'camera_flash', -11, 0.35, 'phones filming');
// ---- 11. YOU: "Yeah. First try."
add(A[5].a, 'cloth', -10, P(900), 'brushes his shoulder');
add(w(5, 'First') + 0.1, 'shine', -6, P(1000), 'smug teeth glint');
// ---- 12. TIP whispers: "That was not first try."
add(CUT.tip1 - 0.02, 'chat_pop', -4, P(700), 'Tip pops in at his ear');
add(CUT.tip1, 'whoosh', -8, -0.3, 'whip');
add(A[6].a, 'ui_pop', -8, P(640), 'TIP card');
add(w(6, 'not'), 'tap', -3, P(300), 'ATTEMPT 57 slams in as evidence');
add(w(6, 'not') + 0.02, 'boing', -10, P(300), '57 counter bounce');
// ---- 13. Mr. Fig: "Pop quiz."
add(CUT.quiz, 'whoosh', -5, 0.3, 'whip to the classroom');
add(w(7, 'quiz') - 0.15, 'paper', -6, P(500), 'lifts the stack of quizzes');
// ---- 14. papers fly to every desk; "No talking."
{
  for (let n = 0; n < 15; n += 3) add(CUT.deal + 0.08 + n * 0.055, 'swish', -10, P(300 + n * 100), 'a quiz paper flies to a desk');
  add(CUT.deal + 0.5, 'paper', -10, -0.2, 'papers land on the desks');
  add(CUT.deal + 0.95, 'paper', -11, 0.3, 'papers land');
  add(CUT.deal + 0.9, 'gulp', -9, 0.2, 'the class gulps');
  add(w(7, 'No'), 'pop', -9, P(420), '"SHH." bang');
}
// ---- 15. "A pop quiz? No problem." — knuckle crack, lean back
add(CUT.read + 0.37, 'click', -2, P(1220), 'CRACK (knuckles)');
add(CUT.read + 0.72, 'click', -3, P(1220), 'CRACK (knuckles)');
add(w(8, 'No') - 0.1, 'cloth', -10, 0, 'leans back, smug');
add(w(8, 'No') + 0.2, 'sparkle', -11, 0, 'smug sparkle');
// ---- 16. reads all the questions (the sheet insert, rows light up)
{
  const a = w(8, 'read'), b = w(8, 'questions') + 0.5;
  add(CUT.readQ, 'paper', -7, -0.2, 'the quiz sheet');
  add(a, 'loading', -12, 0, 'eyes racing down the questions');
  ticks(a + 0.1, b, (b - a) / 6, -11, P(1880), 'QUESTIONS READ ticks up');
  add(b, 'confirm', -5, P(1700), '"Answers memorized" toast');
  add(b + 0.05, 'chime', -8, P(1700), 'memorized');
}
// ---- 17. the snap, the world pauses, ESC menu -> RESET CHARACTER -> crumble on the desk
add(tSnap, 'click', 0, P(1150), 'SNAP!');
add(tSnap + 0.02, 'powerdown', -5, 0, 'the world pauses (grey)');
add(tSnap + 0.06, 'ui_pop', -2, P(1380), 'ESC menu unfolds in the air');
add(tSnap + 0.62, 'click', -9, P(1380), 'highlight: RESUME');
add(tHl, 'click', -6, P(1380), 'highlight: RESET CHARACTER');
add(tPress, 'confirm', -2, P(1380), 'presses RESET CHARACTER');
crumble(tPress + 0.22, P(960), 'reset at the desk');
add(tPress + 0.24, 'pixel_wipe', -8, 0, 'menu folds away');
add(CUT.door2 - 0.08, 'camera_flash', -8, 0, 'white flash cut');
// ---- 18. pops on the flag at 8:00 AM, sprints for the doors
{
  const tPop = CUT.door2 + 0.05;
  const tRun = tPop + Math.min(0.5, (CUT.hall - tPop) * 0.45);
  add(tPop, 'respawn', 0, P(560), 'respawns on the flag by the door');
  add(tPop + 0.05, 'forcefield', -9, P(560), 'forcefield');
  add(tPop + 0.12, 'rewind', -8, P(1580), '"8:00 AM" clock spins back');
  add(tPop + 0.4, 'bell', -6, P(1580), '"8:00 AM — TIME RESET" stamp');
  add(tRun, 'whoosh', -4, 0.3, 'sprints for the doors');
  add(tRun + 0.6, 'door_open', -8, P(1300), 'through the school doors');
}
// ---- 19. hallway sprint, Tip struggling to keep up
{
  const tIn = CUT.write - Math.min(0.28, (CUT.write - CUT.hall) * 0.25);
  add(CUT.hall, 'whoosh', -4, -0.3, 'whip into the hallway');
  for (const kx of [160, 880]) {
    const tp = CUT.hall + ((kx + 760) / 2320) * (tIn - CUT.hall);
    add(tp, 'whoosh', -7, 0, 'blasts past a kid at the lockers');
    add(tp + 0.05, 'paper', -10, 0.1, "the kid's papers fly");
  }
  add(CUT.hall + 0.2, 'chat_pop', -10, -0.4, 'Tip zooms after him');
  add(tIn - 0.2, 'door_open', -6, P(1400), 'ROOM 104 door swings open');
}
// ---- 20. writes every answer without looking (Tip: "That's... cheating.")
{
  add(CUT.write, 'paper', -5, P(1100), 'slaps the quiz on the desk');
  for (let t = CUT.write + 0.1; t < CUT.done - 0.2; t += 0.35) add(t, 'swish', -12, P(1150), 'pencil blur scribbling');
  add(CUT.write + 0.15, 'steam_hiss', -15, P(1150), 'the paper smokes');
  add(CUT.write + 0.05, 'chat_pop', -8, P(1300), 'Tip hovers by the desk, squinting');
  add(A[9].a, 'ui_pop', -8, P(560), 'TIP card');
  ticks(CUT.write + 0.12, CUT.done - 0.3, 0.2, -12, P(1880), 'ANSWERS counter rolls 0 -> 20');
}
// ---- 20b. DONE! — the cheat-o-meter hits 100%
{
  const tOne = w(10, 'one'), tPc = w1(10, 'percent'), tCh = w(10, 'cheating');
  add(CUT.done + 0.02, 'jump', -8, 0, 'stands up');
  add(CUT.done + 0.05, 'paper', -5, 0.05, 'raises the finished quiz');
  add(CUT.done + 0.15, 'pop', -7, P(1300), '"DONE!" bang');
  add(tOne - 0.2, 'ui_pop', -8, 0, 'CHEATING meter appears');
  ticks(tOne, tPc, 0.15, -11, 0, 'meter rolls up');
  add(tCh, 'alarm_beep', -3, 0, 'CHEATING: 100%');
}
// ---- 21. the 100% stamp
add(CUT.grade, 'whoosh', -6, 0.2, 'the sheet slides in');
add(tStamp, 'stamp', 3, P(1200), 'the red 100% stamp SLAMS');
add(tStamp + 0.02, 'impact', -4, P(1200), 'stamp shake');
add(w(10, 'percent', 1), 'confetti', -3, 0, 'confetti');
add(w(10, 'percent', 1) + 0.02, 'tada', -5, P(1600), '"100%!"');
// ---- 22. Coach Dee: "Dodgeball! Let's GO!" — the whistle
add(CUT.gym, 'whoosh', -6, 0.3, 'whip to the gym');
add(w(11, 'GO'), 'whoosh', -5, 0, 'camera whips out to the court');
add(tWhistle, 'whistle', 1, P(500), "TWEEEET! Coach Dee's whistle");
// ---- 23. "Dodgeball?" — the left team fires
for (let j = 0; j < 3; j++) add(A[12].a + j * 0.08 + 0.06, 'whoosh', -5, P(500 + j * 200), `dodgeball #${j + 1} thrown`);
add(CUT.dodgeQ + 0.3, 'snore', -14, P(1500), 'you, yawning');
// ---- 24. the memory replay grid: every hit
{
  const tHit = w(12, 'hit');
  const apps = [CUT.memory, w(12, 'by'), w(12, 'every'), w(12, 'single'), w(12, 'ball'), w(12, 'ball') + 0.3];
  add(CUT.memory, 'vhs_clunk', -4, 0, 'REPLAY · EVERY HIT');
  add(CUT.memory + 0.05, 'rewind', -10, 0, 'memory replay');
  add(tHit - 0.01, 'bonk', 1, 0, 'BONK! the face hit (full frame)');
  crumble(tHit, 0, 'memory hit 1');
  add(tHit + 0.3, 'whoosh', -8, 0, 'the frame shrinks into the grid');
  const cx = [-0.45, 0, 0.45];
  for (let i = 1; i < 6; i++) {
    add(apps[i] - 0.03, 'ui_pop', -10, cx[i % 3], `memory panel ${i + 1} pops in`);
    add(apps[i] + 0.3, 'bonk', -4, cx[i % 3], `BONK in panel ${i + 1}`);
    add(apps[i] + 0.32, 'pop', -10, cx[i % 3], `panel ${i + 1}: crumble`);
  }
  add(w(12, 'ball') + 0.55, 'confirm', -6, 0.5, '"Every ball memorized" toast');
}
// ---- 25. bullet time: predicted paths, four dodges
{
  add(CUT.bullet, 'reverse_swell', -2, 0, 'bullet time');
  add(CUT.bullet + 0.05, 'zoom_in', -7, 0, 'slow push');
  const tCut = (DODGES[1].t + DODGES[2].t) / 2 + 0.1;
  DODGES.forEach((d, i) => {
    add(d.t - 1.25, 'laser_sweep', -13, -0.4, `predicted path #${i + 1} draws itself`);
    add(d.t - 0.35, 'swish', -5, 0.05, `dodge #${i + 1}`);
    add(d.t - 0.25, 'whoosh_long', d.balls > 1 ? -2 : -4, 0, `slow-motion ball${d.balls > 1 ? 's' : ''} pass${d.balls > 1 ? '' : 'es'} by`);
  });
  add(tCut, 'whoosh', -9, 0.3, 'angle change');
}
// ---- 26. the last ball hangs; two fingers
{
  const tP = CUT.pinch + Math.min(0.9, (CUT.coach - CUT.pinch) * 0.6);
  add(CUT.pinch, 'whoosh_long', -10, -0.4, 'the last ball drifts in (nearly frozen)');
  add(tP, 'sparkle', -2, P(1000), '*ting* — two fingers');
  add(tP + 0.03, 'chime', -7, P(1000), 'caught');
}
// ---- 27. time snaps back; Coach Dee in love
{
  const tBeen = w(13, 'BEEN');
  add(CUT.coach, 'whoosh_down', -4, 0, 'time snaps back to normal');
  for (let i = 0; i < 3; i++) add(CUT.coach + i * 0.07 + 0.32, i === 1 ? 'punch' : 'slap', -4 - i, 0.6, 'a ball slams into the wall');
  add(tBeen, 'heart_pop', -2, P(700), "Coach Dee's heart eyes");
  add(tBeen + 0.02, 'zoom_in', -5, 0, 'smash zoom on BEEN');
}
// ---- 28. Ivy: goggles down, finger pointed
add(w(14, 'You') - 0.02, 'equip', -8, P(700), "Ivy's goggles snap down");
add(w(14, "didn't") - 0.05, 'swish', -10, P(800), 'Ivy points');
// ---- 29. "Lucky guess." — the ball spins on one finger
add(CUT.lucky + 0.05, 'swish', -11, P(1200), 'spins the ball on a finger');
// ---- 30. Tip whispers to us
add(CUT.tip2, 'chat_pop', -3, P(520), 'Tip pops in close to camera');
add(CUT.tip2, 'whoosh', -8, -0.3, 'whip');
add(A[16].a, 'ui_pop', -8, P(1250), 'TIP card');
// ---- 31-32. the cafeteria: the joke; dead silence + a cricket
add(CUT.lunch, 'whoosh', -6, 0.3, 'whip to the cafeteria');
add(CUT.lunch + 0.1, 'dishes', -14, 0.4, 'cafeteria trays');
add(CUT.terrible + 0.25, 'cricket', -3, P(500), 'the joke dies: a cricket on the table');
add(CUT.terrible + 1.0, 'cricket', -6, P(500), 'cricket');
for (const [x, d] of [[600, 0.15], [800, 0.2], [960, 0.3], [1400, 0.5]]) add(lerp(CUT.terrible, CUT.reset, d), 'pop', -15, P(x), '"..." over a head');
// ---- 33. "Reset." — snap, crumble, FULL RESPAWNING overlay (JOKE: TERRIBLE)
{
  const tC = tReset + 0.06, t0 = tC + 0.04, dur = Math.max(0.5, CUT.tries - tC - 0.04);
  add(tReset - 0.05, 'click', -2, P(1100), 'snap');
  crumble(tC, P(960), 'reset at the lunch table');
  add(t0, 'powerdown', -4, 0, 'RESPAWNING overlay greys the room');
  add(t0 + 0.02, 'countdown_tick', -4, 0, 'RESPAWNING 3');
  add(t0 + dur / 3, 'countdown_tick', -4, 0, 'RESPAWNING 2');
  add(t0 + (2 * dur) / 3, 'countdown_final', -3, 0, 'RESPAWNING 1');
  add(CUT.tries - 0.02, 'respawn', -2, 0, 'respawn (white flash)');
}
// ---- 34. the strobe loop: TRY 2 ... 31
{
  const end = CUT.joke - 0.3;
  let prev = 2;
  for (let t = CUT.tries; t < end; t += 0.01) {
    const n = 2 + Math.floor(29 * Math.pow(seg(t, CUT.tries, end), 3));   // scene: 2 + floor(29 * ease.in(k)), ease.in = cubic
    if (n !== prev && n % 3 === 0) add(t, 'camera_flash', -12, 0, `TRY ${n}`);
    if (n !== prev) prev = n;
  }
  add(end, 'bell', -4, 0, 'TRY 31 (gold)');
}
// ---- 35-37. the joke on the bench; the milk kid sips; THE SURVIVORS + rimshot
add(w(18, 'pizza'), 'sparkle', -9, P(1200), 'raises the pizza slice');
add(CUT.fan + 0.1, 'bubbles', -12, P(700), 'the milk kid slurps through a bendy straw');
add(w(18, 'Survivors'), 'orch_hit', -4, 0, '"THE SURVIVORS" banner');
add(w(18, 'Survivors') + 0.35, 'rimshot', 0, P(1500), 'BA-DUM TSS!');
// ---- 38. the whole cafeteria laughs
add(CUT.laugh, 'crowd_laugh', 2, 0, 'the whole cafeteria laughs');
add(CUT.laugh + 0.05, 'kids_laugh', -1, 0.2, 'kids howling');
add(CUT.laugh + 1.1, 'body_fall', -5, 0.6, 'a kid falls off the bench');
add(CUT.laugh + 1.12, 'thud', -8, 0.6, 'thump');
// ---- 39. milk out of a nose
add(CUT.milk + 0.05, 'giggle', -4, P(800), 'the milk kid giggles');
add(w(19, 'milk') - 0.05, 'splash', -2, P(1100), 'milk shoots out of his nose');
add(w(19, 'nose'), 'splat', -2, P(1250), 'PFFFT!');
add(CUT.laugh2, 'kids_laugh', -2, 0, 'the table howls harder');
add(CUT.laugh2 + 0.1, 'splash', -10, P(700), 'milk still arcing');
// ---- 40. "best day of my LIFE!"
add(CUT.best, 'shine', -4, P(1000), 'golden rays');
add(CUT.best + 0.05, 'harp_up', -6, 0, 'he glows');
add(w(20, 'LIFE'), 'impact', -2, 0, 'smash zoom on LIFE');
add(w(20, 'LIFE') + 0.02, 'crowd_cheer', -2, 0, 'the cafeteria cheers');
// ---- 41. ATTEMPTS TODAY: 214
{
  const tTwo = w(20, 'Two'), tFt = w1(20, 'fourteen');
  add(CUT.count, 'whoosh', -6, 0, 'pull back');
  add(CUT.count + 0.05, 'ui_pop', -4, 0, 'ATTEMPTS TODAY counter');
  ticks(tTwo, tFt, 0.12, -11, 0, 'counter rolls 0 -> 214');
  for (let i = 0; i < 10; i++) {
    const a = lerp(tTwo - 0.1, tFt - 0.15, i / 9);
    add(a + 0.5, 'pop', -12, 0, `a fail of the day flies into the counter (${i + 1}/10)`);
  }
  add(tFt, 'achievement', 0, 0, '214!');
  add(tFt + 0.05, 'confetti', -5, 0, 'sparkles');
  add(A[20].b, 'tada', -4, 0, 'second bump on "row!"');
  add(END - 0.32, 'whoosh_up', -2, 0, 'the counter flies at the camera');
  add(END - 0.06, 'camera_flash', -5, 0, 'white flash to SC 06');
}
sfx.sort((a, b) => a[0] - b[0]);

// ================================================================= music (tiles [T0, END]) — mood `perfect`
const M = [];
const seg_ = (a, b, mood, energy, inn, out) => { if (b - a > 0.05) M.push({ start: r3(a), end: r3(b), mood, energy, in: inn, out }); };
seg_(T0, CUT.skate, 'perfect', 0.55, 'swell', 'cut');                   // walk in, the flag, saved
seg_(CUT.skate, tLaunch, 'perfect', 0.9, 'cut', 'cut');                 // the skate montage
seg_(tLaunch, tLand, 'wonder', 0.35, 'cut', 'cut');                     // slow-motion kickflip
seg_(tLand, CUT.tip1, 'perfect', 0.8, 'cut', 'scratch');                // PERFECT! WHOA! first try
seg_(CUT.tip1, CUT.quiz, 'silence', 0, 'cut', 'cut');                   // Tip's whisper in dead air
seg_(CUT.quiz, tSnap, 'perfect', 0.45, 'fade', 'tapestop');             // pop quiz (music stops with the pause)
seg_(tSnap, CUT.door2, 'silence', 0, 'cut', 'cut');                     // the world is paused
seg_(CUT.door2, CUT.done, 'perfect', 0.8, 'cut', 'cut');                // reset, sprint, write
seg_(CUT.done, CUT.gym, 'perfect', 0.55, 'cut', 'sting');               // 100% (sting on the cut)
seg_(CUT.gym, CUT.bullet, 'perfect', 0.65, 'cut', 'cut');               // dodgeball + the memory grid
seg_(CUT.bullet, CUT.coach, 'wonder', 0.35, 'cut', 'cut');              // bullet time, the pinch
seg_(CUT.coach, CUT.tip2, 'perfect', 0.55, 'cut', 'scratch');           // Coach, Ivy, "Lucky guess."
seg_(CUT.tip2, CUT.lunch, 'silence', 0, 'cut', 'cut');                  // Tip's 2nd whisper in dead air
seg_(CUT.lunch, CUT.terrible, 'perfect', 0.45, 'fade', 'scratch');      // the joke...
seg_(CUT.terrible, CUT.tries, 'silence', 0, 'cut', 'cut');              // ...terrible: cricket, RESPAWNING
seg_(CUT.tries, CUT.joke, 'perfect', 0.85, 'cut', 'cut');               // TRY 2..31 strobe
seg_(CUT.joke, CUT.laugh, 'perfect', 0.5, 'cut', 'sting');              // "The Survivors." (rimshot)
seg_(CUT.laugh, CUT.best, 'perfect', 0.85, 'cut', 'cut');               // the cafeteria laughs, milk
seg_(CUT.best, END, 'perfect', 1.0, 'swell', 'sting');                  // best day of my LIFE, 214

// ================================================================= ambience + footsteps
const amb = [];
const bed = (a, b, name, g) => { if (b - a > 0.05) amb.push({ start: r3(a), end: r3(b), name, gain_db: g }); };
bed(T0, CUT.quiz, 'birds', -9);
bed(CUT.skate, CUT.a57, 'crowd', -16);
bed(CUT.whoa, CUT.quiz, 'crowd', -12);
bed(CUT.quiz, tSnap, 'room', -13);
bed(CUT.door2, CUT.hall, 'birds', -11);
bed(CUT.hall, CUT.gym, 'room', -14);
bed(CUT.gym, CUT.bullet, 'crowd', -15);
bed(CUT.coach, CUT.tip2, 'crowd', -15);
bed(CUT.lunch, CUT.terrible, 'crowd', -12);
bed(CUT.joke, END, 'crowd', -10);
const steps = [];
const run = (a, b, interval, surface, g, pan) => { if (b - a > 0.1) steps.push({ start: r3(a), end: r3(b), interval: r3(interval), surface, gain_db: g, pan }); };
run(T0 + 0.1, CUT.plant - 0.05, Math.PI / 8.5, 'hard', -9, -0.25);                         // walk((t - T0) * 8.5)
{
  const tPop = CUT.r1 + 0.04, tDash = tPop + Math.max(0.35, CUT.a2 - tPop - 0.42);
  run(tDash, Math.min(tDash + 0.36, CUT.a2), Math.PI / 22, 'hard', -7, 0.3);                // run(t * 22)
  const tPop2 = CUT.door2 + 0.05, tRun = tPop2 + Math.min(0.5, (CUT.hall - tPop2) * 0.45);
  run(tRun, Math.min(tRun + 0.7, CUT.hall), Math.PI / 20, 'hard', -7, 0.2);                 // run(t * 20)
  const tIn = CUT.write - Math.min(0.28, (CUT.write - CUT.hall) * 0.25);
  run(CUT.hall + 0.05, tIn, Math.PI / 24, 'hard', -6, 0);                                    // run(t * 24) in the hallway
}
run(CUT.ivy, CUT.ivy + 0.8, Math.PI / 8, 'wood', -10, -0.2);                                 // Ivy: walkFront(t * 8)

// ================================================================= write
const out = { scene: 'SC 05', start: r3(T0), end: r3(END), music: M, ambience: amb, footsteps: steps, sfx };
const file = path.join(__dirname, 'sc05.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
console.log(`wrote ${file}: ${M.length} music segments, ${amb.length} ambience beds, ${steps.length} footstep runs, ${sfx.length} sfx`);
