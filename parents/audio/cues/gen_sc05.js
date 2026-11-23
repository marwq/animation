#!/usr/bin/env node
// Sound cue sheet generator for SC 05 · MOM IN THE ARENA: the hero bursts out of the hiding tree ("Practice jumping!" —
// Mom and Granny hop, the hot dog boings 6 px), the sprint to the Battle Arena, the LVL 99 pose, Mom pops in behind him,
// the split-screen "I'm just watching", the sneak attack (BONK), the glare, the slow-motion dodge (music drops out:
// heartbeat), the triple combo (punch, punch, CRIT + orchestra hit), the KO flight into a twinkle star, the sword THUNK in
// the silence, "Muscle memory.", the push into the ARCADE QUEEN photo, the 1998 VHS tape (arcade bleeps, NEW RECORD, the
// trophy, camera flashes), the polaroid flying back onto the wall, "I retired. For you.", TEN MINUTES LATER + the
// leaderboard roll #500 → #50 → #1 with the armour upgrades, the caring KO montage (pot-lid CLANG, TAP!, the toppling
// sleeper, the cereal bowl), a hundred KOs, HYDRATED!, DarkBlade's challenge, the standoff + tumbleweed, the one-hit BONK,
// "Good game!", the stretch, YOUR MOM IS A LEGEND!, "…I'm the legend.", real Mom sipping tea (+1 WIN).
// Every time comes from the voice timeline exactly like scenes/s05.js: the cut list (CUT) and the beats (BEATS) are
// imported from the scene module itself (built only from L(id).a/.b and .word()). When the voice changes:
//   node audio/cues/gen_sc05.js && python3 audio/validate_cues.py audio/cues/sc05.json
// Output: audio/cues/sc05.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { CUT: C, BEATS: B } = require('../../scenes/s05');
const { L } = V;

const l = (i) => L('05.' + i);
const w = (i, word, n = 0) => l(i).word(word, n).t0;
const T0 = V.scene('SC 05').start, END = V.scene('SC 06').start;    // == main.js RANGES for SC 05

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const lerp = (a, c, k) => a + (c - a) * k;
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));     // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(t), name, g, r3(pan), note]); };

// ================================================================= SFX, shot by shot (same order as scenes/s05.js)
// ---- 1. the hero bursts out of the hiding tree
add(B.tOut, 'cloth', -4, P(1000), 'bursts out of the tree (leaves rustle)');
add(B.tOut + 0.05, 'pop', -6, P(1000), 'green leaf burst');
add(B.tHood, 'whoosh', -12, P(1100), 'pulls the hood off');
add(B.tHood + 0.02, 'cloth', -10, P(1100), 'hood');
// ---- 2. "Practice jumping!" — Mom + Granny hop, the hot dog manages 6 px
add(B.tJ - 0.02, 'jump_game', -2, P(1150), 'Mom jumps');
add(B.tJ + 0.06, 'jump_game', -4, P(1500), 'Granny jumps');
add(B.tJ + 0.1, 'coins', -12, P(1500), "coins pop out of Granny's bag mid-air");
add(B.tJ + 0.1, 'boing', -4, P(700), 'the hot dog: a 6-px hop ("boing.")');
add(B.tJ + 0.48, 'land', -6, P(1150), 'Mom lands');
add(B.tJ + 0.56, 'land', -8, P(1500), 'Granny lands');
add(B.tJ + 0.27, 'ui_pop', -8, P(700), '"SPACE?" keycap over Dad');
// ---- 3. "I'll be in the arena!" — sprint off left
add(C.run + 0.05, 'whoosh', -8, -0.3, 'takes off');
add(C.arena - 0.04, 'whoosh_long', -4, -0.5, 'whip-pan to the arena');
// ---- 4. the arena: runs in, skids to a stop
add(C.arena + 0.1, 'crowd_cheer', -14, 0, 'arena crowd');
add(B.tStop - 0.15, 'skid', -4, 0, 'skids to a stop in the ring');
for (let i = 0; i < 4; i++) add(C.arena + 0.4 + i * 0.6, 'metal_clank', -18, i % 2 ? 0.4 : -0.4, 'sparring in the background');
// ---- 5. relief, a stretch, the LVL 99 pose
add(w(1, 'nobody') - 0.05, 'cloth', -12, 0, 'big stretch');
add(B.tPose - 0.05, 'equip', -6, 0.05, 'the gold sword out');
add(B.tPose, 'shine', -2, 0.05, 'LVL 99 pose + flash');
add(B.tPose + 0.05, 'crowd_cheer', -6, 0, 'the stands cheer');
for (let i = 0; i < 3; i++) add(C.relax + 1.0 + i * 0.55, 'metal_clank', -18, i % 2 ? 0.5 : -0.5, 'sparring');
// ---- 6. "But Mom followed you." — Mom pops in, the hero's eyes snap open
add(B.tMom, 'teleport', -6, -0.4, 'Mom pops in behind him');
add(B.tMom + 0.05, 'heart_pop', -10, -0.4, 'little hearts');
add(B.tSnap, 'shock', -2, 0.1, "the hero's eyes snap open (smash-zoom)");
add(B.tSnap + 0.02, 'zoom_in', -6, 0.1, 'zoom lines');
// ---- 7. split-screen: real Mom | her grey avatar — "I'm just watching."
add(C.split, 'whoosh', -8, -0.4, 'REAL LIFE panel slides in');
add(C.split + 0.1, 'whoosh', -8, 0.4, 'CUBE CITY panel slides in');
add(l(2).a - 0.3, 'chat_pop', -6, 0.3, "Mom's chat bubble");
add(l(2).a, 'typing', -14, -0.3, 'Mom types on the tablet');
add(B.tPalm, 'slap', -10, 0.6, 'the hero face-palms');
// ---- 8. the sneak attack — BONK
add(B.tHitMom - 0.1, 'swish', -4, -0.2, 'sword swing');
add(B.tHitMom, 'bonk', 0, -0.1, 'BONK! on Mom\'s head');
add(B.tHitMom + 0.06, 'pop', -12, -0.05, '-10');
add(B.tHitMom + 0.12, 'crowd_gasp', -8, 0, 'the stands gasp');
// ---- 9. the glare: the glasses glint
add(C.glare + 0.05, 'dramatic', -4, 0, 'the smile is gone');
add(C.glare + 0.38, 'shine', -2, -0.05, 'glint across the lenses');
// ---- 10. SLOW MOTION: the second swing, she bends back under it
add(C.slow, 'reverse_swell', -6, 0, 'time slows down');
add(C.slow + 0.15, 'heartbeat', -4, 0, 'slow-motion heartbeat');
add(B.tSwing2, 'whoosh_long', -4, -0.2, 'the slow swing over her');
add(C.slow + 0.85, 'heartbeat', -6, 0, 'heartbeat');
// ---- 11. the triple combo
add(B.tH1 - 0.06, 'swish', -6, -0.3, 'hit 1');
add(B.tH1, 'punch', 0, -0.35, 'POW! -25');
add(B.tH2 - 0.06, 'swish', -6, -0.3, 'hit 2');
add(B.tH2, 'punch', 1, -0.35, '-40');
add(B.tH3 - 0.08, 'whoosh_up', -4, -0.3, 'the uppercut');
add(B.tH3, 'impact', 3, -0.35, 'CRIT -999');
add(B.tH3 + 0.02, 'orch_hit', 2, 0, 'TRIPLE COMBO!');
add(B.tH3 + 0.1, 'cymbal', -6, 0.3, 'combo text slams in');
// ---- 12. the KO flight
add(B.tFly, 'whoosh_up', 0, -0.2, 'launched out of the arena');
add(B.tFly + 0.08, 'boing', -6, -0.2, 'boing');
add(C.fly + 0.05, 'crowd_gasp', -6, 0, 'everyone freezes');
add(B.tFly + 1.1, 'sparkle', -2, 0.55, 'twinkle star "ping"');
// ---- 13. silence — his sword spins down and sticks in the sand
add(C.stick, 'fall_whistle', -8, 0.2, 'the sword falls');
add(B.tStick, 'metal_hit', 0, 0.1, 'THUNK! into the sand');
add(B.tStick + 0.02, 'thud', -6, 0.1, 'sand');
add(B.tStick + 0.45, 'metal_clank', -6, -0.3, "another player's sword slips and clatters");
add(B.tStick + 0.6, 'cricket', -12, 0.4, 'stunned silence');
// ---- 14. "Mom... how did you DO that?"
add(w(4, 'DO'), 'zoom_in', -4, 0, 'smash-zoom on DO');
// ---- 15. "Oh. Muscle memory."
add(C.muscle + 0.1, 'cloth', -14, -0.5, 'a player bows');
add(C.muscle + 0.3, 'cloth', -14, 0.5, 'a player bows');
add(l(5).a - 0.3, 'chat_pop', -6, 0, 'chat bubble');
add(w(5, 'Muscle'), 'sparkle', -8, 0, 'pushes her glasses up');
// ---- 16. "That's when you learned the truth." — push into the ARCADE QUEEN photo
add(C.truth, 'whoosh', -10, 0, 'cut to the living room');
add(B.tGlint, 'shine', -2, 0.2, 'the photo glints');
add(B.tGlint + 0.1, 'zoom_in', -4, 0.2, 'push into the photo');
add(C.vhs1 - 0.3, 'rewind', -2, 0, 'back to 1998');
// ---- 17-19. 1998: the VHS tape
add(C.vhs1, 'vhs_clunk', -4, 0, 'PLAY');
for (let i = 0; i < 6; i++) add(C.vhs1 + 0.15 + i * 0.22, i % 2 ? 'laser_zap' : 'beep', -14, 0, 'arcade cabinet bleeps (button mashing)');
add(C.vhs1 + 0.1, 'money_counter', -10, 0, 'the score rolls');
add(B.tRecord, 'level_up', -2, 0, 'NEW RECORD! 999999');
add(B.tRecord + 0.1, 'crowd_cheer', -6, 0, 'the kids cheer');
add(C.vhs2, 'whoosh', -10, 0, 'whip to teen Mom');
add(C.vhs2 + 0.15, 'kids_laugh', -10, 0.2, 'kids celebrating');
add(C.vhs2 + 0.2, 'paper', -12, 0, 'prize tickets spill out');
add(C.vhs3, 'whoosh', -10, 0.3, 'whip to the stage');
add(w(6, 'champion') - 0.05, 'tada', -2, 0.2, 'ARCADE QUEEN title');
add(w(6, 'champion'), 'applause', -6, 0, 'the hall applauds');
add(w(6, 'champion') - 0.2, 'confetti', -8, 0, 'confetti rain');
B.flashT.forEach((t, i) => add(t, 'camera_flash', -8, [-0.4, 0.3, -0.1, 0.5][i], 'camera flash from the crowd'));
// ---- 20. PAUSE → the polaroid flies back onto the wall
add(C.photo, 'vhs_clunk', -6, 0, 'PAUSE');
add(C.photo + 0.18, 'camera_flash', 0, 0, 'the frame becomes a polaroid');
add(C.queen - 0.55, 'whoosh', -6, 0.2, 'the polaroid flies onto the wall');
add(C.queen - 0.02, 'tap', -8, 0.2, 'it lands in the frame');
// ---- 21. "They called me 'The Queen.' I retired."
add(w(7, 'Queen'), 'sparkle', -6, 0.4, 'a crown pops over her bun');
add(w(7, 'Queen') + 0.03, 'chime', -10, 0.4, 'crown');
add(C.retired, 'whoosh', -12, 0, 'close-up');
add(w(7, 'retired'), 'steam_hiss', -18, 0.3, 'the tea steams');
add(w(7, 'For') - 0.4, 'shine', -10, 0, 'a glint on her glasses');
// ---- 22. "For you." — the hero blushes, hearts fly in
add(w(7, 'For') + 0.2, 'heart_pop', -8, 0.4, 'hearts fly in');
add(w(7, 'For') + 0.6, 'heart_pop', -10, 0.1, 'hearts');
add(w(7, 'For') + 0.3, 'blush', -8, -0.2, 'the hero blushes');
add(C.later - 0.04, 'whoosh', -6, 0.5, 'whip to the arena');
// ---- 23. TEN MINUTES LATER — fast-forward
add(C.later + 0.02, 'pop', -4, 0, '10 MINUTES LATER card');
for (let i = 0; i < 4; i++) add(C.later + 0.08 + i * 0.12, 'countdown_tick', -12, 0, 'clock spins');
for (let i = 0; i < 4; i++) add(C.later - 0.1 + i * 0.16, 'boing', -16, i % 2 ? 0.5 : -0.5, 'fast-forward KOs');
// ---- 24. the leaderboard roll #500 → #50 → #1 + armour upgrades
add(C.board, 'whoosh', -6, 0.3, 'leaderboard in');
add(B.tRoll0, 'money_counter', -8, 0.3, 'rank rolls #500 → #50');
add(B.tRoll1 - 0.05, 'upgrade', -4, -0.6, 'upgrade: pot-lid shield + sword');
add(B.tRoll1, 'money_counter', -8, 0.3, 'rank rolls #50 → #1');
add(B.tOne, 'achievement', 0, 0.3, '#1 MOM_OFFICIAL');
add(B.tOne + 0.02, 'equip', -2, -0.6, 'golden armour');
add(B.tOne + 0.05, 'confetti', -4, 0.3, 'confetti');
add(B.tOne + 0.1, 'crowd_cheer', -2, 0, 'GO MOM!');
// ---- 25. golden MOM_OFFICIAL in the ring
add(C.pose + 0.05, 'land', -6, 0, 'pose bounce');
add(C.pose + 0.45, 'shine', -4, 0, 'shield glint');
add(C.pose + 0.1, 'crowd_cheer', -4, 0, 'the stands go wild');
// ---- 26. "Nice try, honey!" — POT-LID CLANG
add(C.nice - 0.04, 'whoosh', -8, 0.5, 'whip');
add(B.tNice - 0.08, 'swish', -6, 0, 'shield bash');
add(B.tNice, 'pan_clang', 2, -0.05, 'BONK! with the pot lid');
add(B.tNice + 0.05, 'whoosh_up', -4, 0.2, 'he flies out');
add(B.tNice + 1.1, 'sparkle', -6, 0.6, 'twinkle');
add(l(9).a - 0.3, 'chat_pop', -6, -0.2, 'chat bubble');
// ---- 27. "Sit up straight!" — TAP!, the sleeper sits up, then topples
add(C.sit - 0.04, 'whoosh', -8, -0.5, 'whip');
add(B.tTap, 'tap', -2, 0.05, 'TAP!');
add(B.tStraight, 'boing', -6, 0.05, 'sits up straight');
add(B.tStraight + 0.05, 'bell', -8, 0.05, 'POSTURE +10');
add(B.tTopple + 0.35, 'body_fall', -2, 0.1, 'topples over');
add(B.tTopple + 0.45, 'dizzy', -10, 0.1, 'K.O. stars');
// ---- 28. "Did you eat breakfast?" — a cereal bowl appears
add(C.bfast - 0.04, 'whoosh', -8, 0.5, 'whip');
add(B.tBowl, 'pop', -4, 0.3, 'a bowl of cereal');
add(B.tBowl + 0.05, 'dishes', -10, 0.3, 'bowl clink');
add(B.tBowl + 0.12, 'heart_pop', -8, 0.3, 'hearts');
add(B.tBowl + 0.5, 'chime', -10, 0.1, 'thumbs-up');
// ---- 29. "She defeated a hundred players."
add(C.hundred + 0.05, 'crowd_cheer', -4, 0, 'the stands roar');
B.koT.forEach((t, i) => { if (i % 2 === 0 || i < 6) add(t, i % 3 ? 'punch' : 'bonk', -10 - (i % 3) * 2, i % 2 ? 0.45 : -0.45, `KO #${i + 1}`); });
for (let i = 0; i < 6; i++) add(lerp(B.KO0, B.KO1, i / 5) + 0.05, 'whoosh_up', -12, i % 2 ? 0.6 : -0.6, 'noobs launched out');
add(B.KO0, 'money_counter', -10, -0.7, 'K.O. counter rolls');
add(B.KO1, 'level_up', -4, -0.7, 'K.O.s 100');
// ---- 30. "...every single one of them was hydrated."
B.benchT.forEach((t, j) => add(t, 'bubbles', -10, P(300 + 220 * j), '+H2O'));
B.benchT.forEach((t, j) => { if (j % 2) add(t + 0.25, 'gulp', -12, P(300 + 220 * j), 'a grateful sip'); });
add(B.tHydra + 0.15, 'stamp', -2, 0, 'HYDRATED! (stamp slams at k .3)');
// ---- 31. DarkBlade: "One on one, Mom!"
add(C.dark, 'dramatic', -4, 0, 'hush — DarkBlade walks out');
add(C.dark + 0.3, 'notify', -10, 0, 'his nametag');
add(l(11).a - 0.3, 'chat_pop', -4, 0, 'his chat bubble');
add(l(11).a, 'typing', -12, 0, 'typing');
// ---- 32. "Right now!" — smash-zoom on the visor
add(C.now, 'zoom_in', -2, 0, 'smash-zoom');
add(w(11, 'now'), 'impact', -4, 0, 'red eyes flare');
add(C.now + 0.05, 'chat_pop', -6, 0, 'CAPS bubble');
// ---- 33. "Okay, sweetie."
add(l(12).a, 'heart_pop', -8, 0.1, 'sweet little hearts');
// ---- 34. the standoff → the charge → one hit → he flies out
add(C.duel, 'wind_gust', -6, 0, 'standoff');
add(B.tCharge - 0.3, 'whistle', -14, 0.4, 'a lonely tumbleweed rolls by');
add(B.tCharge, 'whoosh', -6, 0.3, 'he charges');
add(B.tPunch - 0.05, 'swish', -4, -0.1, 'the flick');
add(B.tPunch, 'bonk', 3, -0.1, 'BONK! -9999');
add(B.tPunch + 0.01, 'impact', 2, -0.1, 'crit');
add(B.tPunch + 0.02, 'orch_hit', 2, 0, 'one hit');
add(B.tPunch + 0.08, 'whoosh_up', 0, 0.3, 'launched out of the arena');
add(B.tPunch + 0.3, 'crowd_cheer', 0, 0, 'the crowd explodes');
add(B.tPunch + 1.1, 'sparkle', 0, 0.7, 'DarkBlade twinkles away');
add(l(13).a - 0.3, 'chat_pop', -6, -0.4, '"Good game!"');
// ---- 35. "Don't forget to stretch!"
add(C.stretch + 0.1, 'cloth', -10, 0, 'she stretches; two players copy her');
add(C.stretch + 0.5, 'crowd_laugh', -10, 0, 'the stands laugh');
// ---- 36. NOODLE: "YOUR MOM IS A LEGEND!"
add(C.legend, 'crowd_cheer', -2, 0.2, 'Mom crowd-surfs');
add(l(14).a - 0.3, 'chat_pop', -4, 0.1, "Noodle's CAPS bubble");
add(w(14, 'LEGEND'), 'impact', -6, 0, 'shake on LEGEND');
add(C.legend + 0.1, 'confetti', -8, 0, 'confetti');
// ---- 37. "...I'm the legend." — a confetti cube lands on his crown
add(B.tLand, 'tap', -12, 0.1, 'one confetti cube lands on his crown');
// ---- 38. real life: Mom sips her tea; +1 WIN
add(C.tea - 0.04, 'whoosh', -10, -0.3, 'cut to the living room');
add(C.tea + 0.4, 'gulp', -10, 0.1, 'a calm sip of tea');
add(C.tea + 0.35, 'ui_pop', -8, -0.1, '+1 WIN');
add(C.tea + 0.8, 'ui_pop', -8, 0.2, '+1 WIN');
add(C.tea + 1.15, 'ui_pop', -8, -0.3, 'MOM #1');
add(END - 0.1, 'whoosh', -6, 0.5, 'whip out to Tycoon Valley');

// ================================================================= MUSIC (tiles [T0, END])
const music = [
  { start: T0, end: C.arena, mood: 'lobby', energy: 0.5, in: 'cut', out: 'cut' },                       // the plaza: "stay here!"
  { start: C.arena, end: C.momIn, mood: 'game', energy: 0.6, in: 'cut', out: 'sting' },                    // the arena, his kingdom
  { start: C.momIn, end: C.sneak, mood: 'playful', energy: 0.4, in: 'cut', out: 'cut' },                   // Mom "just watching"
  { start: C.sneak, end: C.slow, mood: 'mystery', energy: 0.4, in: 'cut', out: 'cut' },                    // the sneak attack + glare
  { start: C.slow, end: B.tH3, mood: 'silence', energy: 0, in: 'cut', out: 'cut' },                       // slow motion (heartbeat)
  { start: B.tH3, end: C.stick, mood: 'arena', energy: 1, in: 'cut', out: 'scratch' },                     // TRIPLE COMBO → K.O.
  { start: C.stick, end: C.how, mood: 'silence', energy: 0, in: 'cut', out: 'cut' },                      // THUNK — everyone froze
  { start: C.how, end: C.truth, mood: 'playful', energy: 0.35, in: 'fade', out: 'cut' },                  // "how did you DO that?"
  { start: C.truth, end: C.vhs1, mood: 'mystery', energy: 0.35, in: 'cut', out: 'cut' },                  // the truth...
  { start: C.vhs1, end: C.photo, mood: 'showtime', energy: 0.75, in: 'cut', out: 'tapestop' },            // 1998: the arcade queen
  { start: C.photo, end: C.later, mood: 'warm', energy: 0.35, in: 'fade', out: 'cut' },                   // "I retired. For you."
  { start: C.later, end: C.pose, mood: 'montage', energy: 0.9, in: 'cut', out: 'sting' },                 // ten minutes later → #1
  { start: C.pose, end: C.dark, mood: 'arena', energy: 0.85, in: 'cut', out: 'cut' },                     // the caring KO montage
  { start: C.dark, end: C.duel, mood: 'mystery', energy: 0.45, in: 'cut', out: 'cut' },                   // DarkBlade's challenge
  { start: C.duel, end: B.tPunch, mood: 'silence', energy: 0, in: 'cut', out: 'cut' },                    // the standoff
  { start: B.tPunch, end: C.me, mood: 'arena', energy: 1, in: 'cut', out: 'scratch' },                    // one hit, legend
  { start: C.me, end: C.tea, mood: 'sad', energy: 0.2, in: 'cut', out: 'cut' },                           // "...I'm the legend."
  { start: C.tea, end: END, mood: 'warm', energy: 0.35, in: 'fade', out: 'fade' },                       // real Mom sips her tea
].map((s) => ({ ...s, start: r3(s.start), end: r3(s.end) }));

// ================================================================= AMBIENCE
const amb = [];
const bed = (a, b, name, g) => { if (b > a) amb.push({ start: r3(Math.max(a, T0)), end: r3(Math.min(b, END)), name, gain_db: g }); };
bed(T0, C.arena, 'town', -16);                       // the plaza
bed(C.arena, C.split, 'crowd', -14);                 // the arena stands
bed(C.split, C.sneak, 'room', -18);                  // split-screen: the living room...
bed(C.split, C.sneak, 'crowd', -20);                 // ...and the arena
bed(C.sneak, C.slow, 'crowd', -14);
bed(C.slow, B.tH3, 'wind', -22);                     // slow motion: air
bed(B.tH3, C.stick, 'crowd', -10);
bed(C.how, C.truth, 'crowd', -18);
bed(C.truth, C.vhs1, 'room', -14);                   // real living room
bed(C.vhs1, C.photo, 'static', -24);                 // tape hiss
bed(C.vhs1, C.photo, 'crowd', -16);                  // the 1998 arcade
bed(C.photo, C.later, 'room', -14);
bed(C.later, C.dark, 'crowd', -10);
bed(C.dark, C.duel, 'crowd', -22);                   // hush
bed(C.duel, B.tPunch, 'wind', -14);                  // standoff wind
bed(B.tPunch, C.tea, 'crowd', -10);
bed(C.tea, END, 'room', -14);

// ================================================================= FOOTSTEPS (cycles from the scene code: steps every π/K s)
const steps = [];
const st = (a, b, iv, surface, g, pan) => { if (b > a) steps.push({ start: r3(Math.max(a, T0)), end: r3(Math.min(b, END)), interval: r3(iv), surface, gain_db: g, pan: r3(pan) }); };
st(C.run + 0.05, C.arena, Math.PI / 19, 'hard', -8, -0.3);           // shRun: AC.run((t - CUT.run) * 19)
st(C.arena, B.tStop - 0.1, Math.PI / 18, 'soft', -8, -0.1);          // shArena: run((t - CUT.arena) * 18) on sand
st(l(1).b + 0.2, C.split, Math.PI / 9, 'soft', -14, -0.4);           // shMomIn: Mom's walkFront(t * 9)
st(C.sneak + 0.05, B.tHitMom - 0.4, Math.PI / 7, 'soft', -16, -0.5); // shSneak: the tiptoe walk((t - CUT.sneak) * 7)
st(C.nice, B.tNice, Math.PI / 20, 'soft', -10, 0.4);                 // shNice: the attacker's run((t - CUT.nice) * 20)
st(C.hydra + 0.1, B.tHydra + 0.2, Math.PI / 11, 'soft', -12, 0);     // shHydra: Mom's walk((t - CUT.hydra) * 11)
st(C.dark + 0.1, l(11).a, Math.PI / 7, 'hard', -8, 0);               // shDark: DarkBlade's walkFront(t * 7) (armour)
st(B.tCharge, B.tPunch, Math.PI / 22, 'hard', -6, 0.3);              // shDuel: the charge run((t - tCharge) * 22)

sfx.sort((a, b) => a[0] - b[0]);
const out = { scene: 'SC 05', start: r3(T0), end: r3(END), music, ambience: amb, footsteps: steps, sfx };
const file = path.join(__dirname, 'sc05.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log('wrote', file, '—', sfx.length, 'sfx,', music.length, 'music segments,', amb.length, 'ambience beds,', steps.length, 'footstep runs');
