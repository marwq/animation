#!/usr/bin/env node
// Sound cue sheet generator for SC 02 (ТЫ ОЧЕНЬ БОИШЬСЯ ОШИБИТЬСЯ: Mr. Fig's class, the Mega Obby, the kitchen family intros,
// Ivy's rocket sneakers, the talent-show poster).
// Every time below comes from the voice timeline exactly like scenes/s02.js does: the cut list + beats are the SAME code
// (scenes/s02_env.js timing(), built only from L(id).a/.b and .word()), and the few in-shot offsets are re-derived here
// with the same expressions as the scene. When the voice changes, re-run:
//   node audio/cues/gen_sc02.js && python3 audio/validate_cues.py audio/cues/sc02.json
// Output: audio/cues/sc02.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { timing } = require('../../scenes/s02_env');

const { A, B, C, b } = timing();
const T0 = V.scene('SC 02').start, END = V.scene('SC 03').start;    // == main.js RANGES for SC 02

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const lerp = (a, c, k) => a + (c - a) * k;
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));     // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(t), name, g, pan, note]); };

// ================================================================= SFX, shot by shot (same order as scenes/s02.js)
// whip-pans (scene router: whip() over tc ± 0.1)
for (const [tc, d] of [[C.games, 1], [C.hop, -1], [C.ivy, 1], [C.gary, -1], [C.horror, 1], [C.fun, -1]]) add(tc - 0.1, 'whoosh', -3, r3(0.3 * d), 'whip-pan');

// ---- 1. Monday: VHS PLAY tail, push in, freeze-frame on "you" + YOU tag, AGE 12 sticker
add(T0 + 0.02, 'vhs_clunk', -6, 0, 'rewind lands: VHS PLAY tail, white flash out');
add(T0 + 0.3, 'ui_pop', -8, P(1580), 'MONDAY · 8:00 AM title pops');
add(b.you, 'record_scratch', -2, 0, 'freeze-frame on "you"');
add(b.you + 0.02, 'camera_flash', -6, 0, 'freeze-frame flash, the still tilts');
add(b.you + 0.05, 'stamp', -2, P(1480), 'YOU name tag slams in');
add(b.twelve - 0.02, 'stamp', -5, P(1700), 'AGE 12 sticker slaps on');
// ---- 2. the player card
add(C.card - 0.05, 'whoosh', -4, 0, 'cut to the PLAYER 1 card');
add(b.smart - 0.05, 'ui_pop', -5, P(1400), 'SMART row slides in');
add(b.smart + 0.1, 'chime', -8, P(1500), 'stars fill: 4 of 5');
add(b.smart, 'sparkle', -10, P(560), 'smug sparkle over his head');
add(b.funny - 0.05, 'ui_pop', -5, P(1400), 'FUNNY row slides in');
add(b.funny, 'boing', -6, P(520), 'goofy ta-da jump, tongue out');
add(b.very - 0.35, 'ui_pop', -6, P(1300), 'FEAR OF MESSING UP row');
add(b.very, 'zoom_in', -2, 0, 'smash-zoom on the fear bar');
add(b.very + 0.05, 'alarm_beep', -4, P(1430), 'fear bar fills, red alarm light');
add(b.scared + 0.05, 'impact', 0, 0, 'smash to his terrified face: bar overflows MAX');
add(b.scared + 0.1, 'alarm', -8, 0, 'alarm pulses (overflow)');
add(b.scared + 0.2, 'glass', -6, P(1500), 'the card cracks');
// ---- 3. Mr. Fig at the board
add(C.board, 'whoosh', -6, 0, 'cut to the whiteboard');
for (let i = 0; i < 3; i++) add(b.anyone + 0.25 + i * 0.63, 'tap', -10, P(700), 'marker taps the 7 × 8');
add(b.anyone + 0.15, 'stamp', -4, P(1360), 'MR. FIG name tag');
// ---- 4. the blank class
add(b.eight + 0.2, 'cricket', -6, P(1520), 'silence: a cricket chirps');
// ---- 5. the twitching hand
add(b.fifty, 'cloth', -8, P(1100), 'hand twitches up... and down');
add(b.its, 'cloth', -6, P(1150), 'hand twitches higher... and down');
// ---- 6. the WHAT IF daydream
add(C.whatif, 'harp_up', -4, 0, 'daydream cloud frame');
add(C.whatif + 0.15, 'chat_pop', -6, P(1240), '"56!" bubble');
add(b.what + 0.12, 'buzzer_wrong', 0, 0, 'WRONG! giant red X');
add(b.what + 0.2, 'kids_laugh', -4, 0, 'the whole class laughs and points');
// ---- 7. triptych: he always knows
[b.always, b.know, b.answer].forEach((t, i) => { add(t - 0.05, 'swish', -6, P(320 + i * 640), `panel ${i + 1} slides in`); add(t + 0.2, 'chime', -10, P(490 + i * 640), 'right answer in the thought bubble'); });
// ---- 8. zipped mouth, hand yanked down
add(b.never - 0.05, 'slide_up', -4, 0, 'ZIP! the zipper closes his mouth');
add(b.say + 0.15, 'slap', -4, P(1150), 'NOPE. the hand is yanked down');
// ---- 9. heartbeat push-in
for (let t = C.wrong + 0.1; t < C.shout - 0.15; t += 1 / 1.2) add(t, 'heartbeat', -6, 0, 'heartbeat: what if you are wrong');
// ---- 10. the neighbour: FIFTY-SIX!
add(b.s56, 'orch_hit', 0, P(1300), 'the neighbour jumps up: FIFTY-SIX!');
add(b.s56 + 0.1, 'zoom_in', -4, P(1300), 'smash-zoom on the neighbour');
// ---- 11. CORRECT! claps, the star, the slow slide under the desk
add(b.correct, 'chat_pop', -6, P(330), 'CORRECT! bubble');
add(b.correct + 0.15, 'applause', -8, 0, 'the class claps');
add(b.correct + 0.25, 'whoosh_up', -10, P(900), 'gold star flies to the neighbour');
add(b.correct + 0.6, 'pop', -6, P(1440), 'star sticker lands on his forehead');
add(b.correct + 0.1, 'slide_down', -6, 0, 'the hero slowly slides under the desk');
// ---- 12. his room: headphones, WOOO
add(C.games + 0.2, 'jump_game', -8, P(1400), 'game sounds from the headset');
// ---- 13/14. the Mega Obby (same path as obbyHero() in the scene)
{
  const j0 = C.obby + 0.45, l0 = C.obby2 - 0.12, j1 = C.obby2 + 0.3, l1 = j1 + 0.75, j2 = b.fall - 0.55, tLava = b.fall + 0.1, tWall = lerp(j2, tLava, 0.5);
  add(C.obby + 0.1, 'ui_pop', -8, P(200), 'FALLS: 4,790 HUD slides in');
  add(j0, 'jump_game', -2, -0.1, 'fearless leap over the lava');
  add(j0 + 0.15, 'whoosh_up', -4, 0, 'front flip in the air');
  add(b.fearless + 0.05, 'orch_hit', -6, P(1420), 'FEARLESS! lettering');
  add(l0, 'land', -4, 0, 'lands the flip');
  add(j1, 'jump_game', -3, 0, 'leaps over the red kill platform');
  add(l1, 'land', -5, 0, 'lands');
  add(j2, 'jump_game', -3, 0.1, 'jumps for the next platform...');
  add(tWall, 'bonk', -2, 0.2, '...BONK, smacks into its side');
  add(tWall + 0.05, 'fall_whistle', -6, 0.2, 'falls toward the lava');
  add(tLava, 'splash', 0, 0.2, 'SPLASH into the lava');
  add(tLava + 0.02, 'sizzle', -6, 0.2, 'lava sizzle');
  add(tLava + 0.04, 'pop', -4, 0.2, 'crumbles into blocks');
  add(tLava + 0.1, 'stone', -8, 0.2, 'blocks scatter');
  add(tLava + 0.05, 'tap', -8, P(200), 'FALLS: 4,791 bumps');
  const popAt = b.respawn - tLava, ov0 = tLava + 0.08, ovDur = Math.max(0.4, popAt - 0.14);
  add(ov0, 'countdown_tick', -8, 0.6, 'corner pill: RESPAWNING 3');
  add(ov0 + ovDur / 3, 'countdown_tick', -8, 0.6, 'RESPAWNING 2');
  add(ov0 + (2 * ovDur) / 3, 'countdown_final', -6, 0.6, 'RESPAWNING 1');
  add(b.respawn - 0.12, 'reverse_swell', -8, 0, 'blocks converge on the checkpoint');
  add(b.respawn, 'respawn', -1, -0.1, 'POP: respawn on the checkpoint');
  add(b.respawn + 0.05, 'forcefield', -8, -0.1, 'spawn forcefield');
  add(b.respawn + 0.35, 'jump_game', -6, -0.1, 'happy hop: AGAIN!');
}
// ---- 15. kitchen: hopping on the spot for a checkpoint (hopAt(): period .62 from C.hop + .15, lands at .7 of each hop)
for (let n = 0; ; n++) {
  const t0 = C.hop + 0.15 + n * 0.62;
  if (t0 >= C.checked) break;
  add(t0, 'jump', -10, P(980), 'hop');
  if (t0 + 0.434 < C.checked) add(t0 + 0.434, 'land', -8, P(980), 'lands: a dashed "checkpoint?" ring flickers... nothing');
}
for (let t = C.hop + 0.3; t < C.checked; t += 1.5) add(t, 'swish', -14, P(650), 'Dad flips a pancake in the background');
// ---- 16. CHECKPOINT NOT FOUND
add(C.checked + 0.38, 'land', -6, P(980), 'one last hop');
add(b.checked + 0.05, 'error', -3, P(1340), 'CHECKPOINT NOT FOUND toast');
// ---- 17. Dad: the flip + DAD tag
add(C.dad + 0.15, 'swish', -4, P(700), 'Dad flips a pancake high');
add(C.dad + 1.2, 'pan_clang', -6, P(700), 'lands back in the pan');
add(b.dad - 0.02, 'stamp', -3, P(1420), 'DAD name tag');
// ---- 18. MON / TUE / WED
['MON', 'TUE', 'WED'].forEach((d, i) => add([b.makes, b.pancakes, b.every][i] - 0.1, 'swish', -6, P(320 + i * 640), `${d} panel drops in`));
add(b.morning - 0.1, 'pan_clang', -6, 0, 'all three Dads flip in sync');
// ---- 19. SAME JOKE TOLD: 1,461
add(b.same - 0.25, 'ui_pop', -6, 0, 'SAME JOKE TOLD counter');
add(b.same - 0.1, 'money_counter', -10, 0, 'counter rolls up to 1,461');
add(b.joke + 0.6, 'chime', -6, 0, 'counter lands on 1,461');
// ---- 21. the family mouths along (+ Gary)
add(C.along + 0.1, 'bubbles', -14, P(-200), "Gary's bowl bubbles (he mouths along too)");
// ---- 22/23. build-up, FLAT!, BA-DUM TSS
add(C.because + 0.1, 'drumroll', -10, 0, 'build-up: Dad leans in');
add(b.flat, 'splat', 0, P(520), 'FLAT! the pancake is slammed flat on the island');
add(b.flat + 0.02, 'zoom_in', -4, 0, 'smash-zoom on Dad');
add(b.rim - 0.35, 'ui_pop', -6, P(1690), 'drum kit pops into the corner');
add(b.rim, 'rimshot', 2, P(1690), 'BA-DUM TSS!');
add(b.rim + 0.3, 'crowd_laugh', -12, P(650), 'Dad laughs at his own joke');
// ---- 24. the table: cricket, BEA tag
add(C.bea + 0.1, 'cricket', -6, P(360), 'nobody laughs: cricket');
add(b.beaW - 0.02, 'stamp', -3, P(470), 'BEA name tag');
// ---- 25. Bea close: LIES TOLD 0, 100% HONEST
add(b.neverB, 'ui_pop', -6, 0, 'LIES TOLD: 0 counter');
add(b.lie, 'chime', -6, 0, 'counter bump');
add(b.lie + 0.35, 'stamp', -2, P(1480), '100% HONEST stamp');
// ---- 26-28. hair = mushroom = sad mushroom
add(C.hair, 'swish', -10, P(900), 'Bea turns, points the spoon');
add(C.mush, 'zoom_in', -3, 0, 'smash to the hair close-up');
add(b.mushroom, 'pop', -2, P(1380), 'the mushroom pops up next to him');
add(b.sadW - 0.05, 'sad_trombone', -3, 0, 'SAD: both droop');
add(b.sadW + 0.1, 'poof', -10, 0, 'tiny rain cloud appears');
// ---- 29/30. Gary
add(C.gary + 0.1, 'bubbles', -8, 0, "Gary's bowl");
add(b.gary - 0.02, 'stamp', -4, P(1430), 'GARY name tag');
add(b.goldfish - 0.3, 'swish', -12, 0, 'Gary turns to the camera');
add(C.seen, 'dramatic', -4, 0, 'extreme close-up: Gary has seen things');
add(b.things + 0.05, 'blink', -4, 0, 'slow blink');
// ---- 31/32. Mom
add(b.bye + 0.05, 'stamp', -4, P(470), 'MOM name tag');
add(b.loves - 0.05 + 0.15, 'heart_pop', -4, P(960), 'kiss on Bea\'s head: MWAH!');
add(b.long - 0.05 + 0.15, 'heart_pop', -4, P(1200), 'kiss on your head: MWAH!');
add(b.shift + 0.2, 'whoosh', -6, 0.5, 'Mom zooms off');
add(b.learn, 'sparkle', -10, P(1600), 'wink sparkle: mistakes are how we learn');
add(b.momOut + 0.12, 'door_close', -2, 0.3, 'SLAM! she is gone');
// ---- 33. mumble: the class laughing echoes in his head
add(b.laughed - 0.2, 'kids_laugh', -14, 0, 'HA HA echo (memory)');
// ---- 34. Ivy at work
add(C.ivy + 0.1, 'electric', -12, P(1000), 'soldering sparks on the rocket sneaker');
add(C.ivy + 0.9, 'sizzle', -14, P(1000), 'soldering');
add(b.ivyW - 0.02, 'stamp', -3, P(1450), 'IVY name tag');
// ---- 35. the polaroid
add(C.kinder, 'camera_flash', -6, 0, 'kindergarten polaroid drops in');
add(C.kinder + 0.2, 'paper', -10, 0, 'photo lands on the cork board');
// ---- 36. she builds inventions
add(b.inventions, 'ui_pop', -8, P(1560), 'ROCKET SNEAKERS v12 label');
// ---- 37. ignition, into the wall, KA-BOOM
add(C.launch + 0.1, 'jetpack', 0, P(1250), 'rocket sneakers ignite');
add(C.launch + 0.15, 'whoosh', -2, P(1000), 'she shoots into the wall');
add(b.hit, 'explosion', 3, P(800), 'KA-BOOM at the scorch mark');
add(b.hit + 0.02, 'boom', 0, P(800), 'explosion body, camera shake');
add(b.hit + 0.1, 'body_fall', -8, P(560), 'the hero is blown back');
// ---- 38. chalkboard: 1 -> 0, a stray sneaker whizzes past
add(b.lot - 0.05, 'tap', -6, 0, 'chalk: the 1 becomes 0');
add(b.lot + 0.2, 'whoosh', -4, -0.3, 'the other sneaker whizzes across the board');
// ---- 38b. the silent beat: explosion #2
add(C.boom2, 'jetpack', -4, -0.4, 'the stray sneaker loops round the garage');
add(C.boom2 + 0.2, 'whoosh_long', -6, 0, 'NOT AGAIN! he ducks');
add(C.boom2 + 0.6, 'explosion', 3, P(1760), 'KA-BLAM! it hits the BOOM? box');
add(C.boom2 + 0.62, 'impact', 0, P(1760), 'explosion #2 body');
add(C.boom2 + 1.2, 'rock_drop', -10, P(1600), 'debris rains down');
// ---- 39. sooty Ivy, FAIL #312
add(C.soot + 0.12, 'poof', -6, P(900), '*cough* smoke puff');
add(b.failW - 0.1, 'ui_pop', -6, P(200), 'FAIL # counter');
add(b.failW + 0.15, 'paper', -6, P(600), 'she opens the Book of Fails');
add(b.twelve2 + 0.3, 'level_up', -4, P(200), 'counter rolls to 312');
// ---- 40. the page: the pencil writes the lesson
add(b.lessonW, 'paper', -10, 0, 'page close-up');
add(b.neverW - 0.05, 'squeak', -12, 0, 'pencil: "never wear"');
add(b.sneakers2 - 0.6, 'squeak', -12, 0, 'pencil: "rocket sneakers..."');
add(b.indoors - 0.05, 'squeak', -8, 0, 'pencil: "INDOORS!!" underlined');
// ---- 41. the sneaker drops on her head
add(b.indoors - 0.1, 'whoosh_down', -6, P(630), 'a smoking sneaker falls from the ceiling');
add(b.indoors + 0.35, 'bonk', 0, P(630), 'BONK! on her head');
add(b.indoors + 0.45, 'dizzy', -8, P(630), 'swirly eyes');
// ---- 42. HOW are you HAPPY?
add(b.happy, 'zoom_in', -3, P(620), 'smash-zoom on HAPPY');
// ---- 43. one more way it doesn't work
add(b.now, 'sparkle', -10, P(1180), 'finger up, sparkle');
add(b.work, 'achievement', -2, P(1460), 'LESSON +1 achievement badge');
// ---- 44. Anyway! Big news!
add(C.anyway, 'whoosh', -4, 0.3, 'Ivy zips to the rack');
add(b.big, 'sparkle', -6, P(1300), 'the rolled poster raised');
// ---- 45. the poster
add(C.poster, 'slide_down', -4, 0, 'the poster unrolls');
add(b.signed, 'squeak', -6, 0, 'marker: "IVY & YOU: SCIENCE MAGIC!" scribbles in');
add(b.talent - 0.15, 'whoosh_up', -8, 0, 'tilt up to TALENT SHOW');
add(b.friday, 'stamp', 0, P(1500), 'FRIDAY! stamp');
// ---- 46. the WHOLE school
add(b.whole - 0.05, 'whoosh_long', -2, 0, 'zoom OUT: the packed auditorium');
add(b.whole + 0.3, 'orch_hit', -4, 0, 'THE WHOLE SCHOOL');
add(b.school - 0.1, 'shine', -4, 0, 'the follow spot swings onto us');
// ---- 47. the horror
add(b.whole2 - 0.03, 'zoom_in', 0, 0, 'smash-zoom: THE WHOLE SCHOOL?!');
add(b.whole2, 'impact', -2, 0, 'scream, shake');
// ---- 49. imagination flash: crumble on stage, NO RESPAWN
add(C.flash, 'glitch', -4, 0, 'imagination flash: on stage');
add(C.flash + 0.06, 'slip', -6, 0, 'he trips');
add(C.flash + 0.2, 'pop', -2, 0, 'crumbles into blocks');
add(C.flash + 0.22, 'stone', -6, 0, 'blocks scatter on the stage');
add(C.flash + 0.35, 'error', 0, 0, 'NO RESPAWN');
// ---- 50. that's the fun part!
add(b.funW, 'tada', -6, P(1180), 'jazz hands: FUN!');
add(b.funW + 0.02, 'confetti', -6, 0, 'confetti');
// ---- 51/52. the stare + the button
add(C.stare + 0.3, 'cricket', -10, 0, 'silent stare into the camera');
add(b.notW, 'blink', -8, 0, 'eye twitch');
add(b.fun2 - 0.1, 'alarm_beep', -6, P(1460), 'FEAR OF MESSING UP meter returns, overflowing');
add(END - 0.3, 'whoosh_down', -10, 0, 'dip to night (SC03)');

sfx.sort((p, q) => p[0] - q[0]);

// ================================================================= music (tiles [T0, END])
const M = [];
const seg = (start, end, mood, energy, inn, out) => M.push({ start: r3(start), end: r3(end), mood, energy, in: inn, out });
seg(T0, C.wrong, 'playful', 0.45, 'fade', 'cut');            // meet the hero: player card, Mr. Fig, the hand
seg(C.wrong, C.shout, 'mystery', 0.35, 'cut', 'scratch');     // heartbeat: what if you're wrong? -> FIFTY-SIX!
seg(C.shout, C.games, 'silence', 0, 'cut', 'cut');           // CORRECT!, claps, the slow slide (deadpan)
seg(C.games, C.hop, 'respawn', 0.85, 'cut', 'scratch');      // in games you're fearless: the main theme, lava, respawn
seg(C.hop, C.checked, 'playful', 0.3, 'cut', 'cut');         // hopping for a checkpoint
seg(C.checked, C.dad, 'silence', 0, 'cut', 'cut');           // "You checked." (CHECKPOINT NOT FOUND)
seg(C.dad, C.flat, 'warm', 0.45, 'swell', 'cut');           // at home: Dad, MON/TUE/WED, the joke
seg(C.flat, C.bea, 'silence', 0, 'cut', 'cut');              // FLAT! BA-DUM TSS ... cricket
seg(C.bea, C.seen, 'warm', 0.4, 'fade', 'cut');             // Bea, the mushroom, Gary
seg(C.seen, C.mom, 'mystery', 0.35, 'cut', 'cut');           // Gary has seen things
seg(C.mom, C.mumble, 'warm', 0.5, 'cut', 'fade');            // Mom rushes out
seg(C.mumble, C.ivy, 'sad', 0.3, 'fade', 'cut');             // mistakes are how we get laughed at
seg(C.ivy, C.launch, 'playful', 0.55, 'cut', 'cut');         // Ivy, kindergarten, inventions
seg(C.launch, C.soot, 'chaos', 0.8, 'cut', 'sting');         // they explode. a lot. (two explosions)
seg(C.soot, C.poster, 'playful', 0.5, 'cut', 'cut');         // FAIL #312, the Book of Fails, LESSON +1
seg(C.poster, C.horror, 'showtime', 0.7, 'swell', 'scratch'); // the talent show poster, the whole school
seg(C.horror, C.fun, 'glitch_build', 0.6, 'cut', 'cut');     // THE WHOLE SCHOOL?! what if I mess up -> NO RESPAWN
seg(C.fun, C.stare, 'playful', 0.5, 'cut', 'cut');           // that's the fun part!
seg(C.stare, B[10].a, 'silence', 0, 'cut', 'cut');           // the horrified stare
seg(B[10].a, END, 'sad', 0.25, 'cut', 'sting');              // "...it was not the fun part." -> SC03

// ================================================================= ambience + footsteps
const amb = [
  { start: r3(T0), end: r3(C.card), name: 'room', gain_db: -14 },          // classroom murmur
  { start: r3(C.board), end: r3(C.games), name: 'room', gain_db: -14 },
  { start: r3(C.hop), end: r3(C.seen), name: 'kitchen', gain_db: -12 },
  { start: r3(C.hop), end: r3(C.seen), name: 'birds', gain_db: -20 },
  { start: r3(C.mom), end: r3(C.ivy), name: 'kitchen', gain_db: -12 },
  { start: r3(C.ivy), end: r3(C.kinder), name: 'town', gain_db: -18 },      // the open garage door
  { start: r3(C.builds), end: r3(C.whole), name: 'town', gain_db: -18 },
  { start: r3(C.whole), end: r3(C.horror), name: 'crowd', gain_db: -12 },   // the whole school, waiting
  { start: r3(C.horror), end: r3(END - 0.3), name: 'town', gain_db: -20 },
];
const steps = [
  { start: r3(C.obby + 0.05), end: r3(C.obby + 0.45), interval: 0.196, surface: 'hard', gain_db: -12, pan: -0.2 },   // run(t*16) on cp0
  { start: r3(C.mom), end: r3(Math.min(B[1].b, C.remember)), interval: 0.175, surface: 'hard', gain_db: -10, pan: 0.2 },   // Mom run(t*18)
  { start: r3(C.builds), end: r3(C.builds + 1.3), interval: 0.35, surface: 'hard', gain_db: -10, pan: -0.4 },       // walk(t*9) into the garage
  { start: r3(C.anyway), end: r3(C.anyway + 0.5), interval: 0.196, surface: 'hard', gain_db: -10, pan: 0.3 },        // Ivy run(t*16)
].filter((s) => s.end > s.start);

const out = { scene: 'SC 02', start: r3(T0), end: r3(END), music: M, ambience: amb, footsteps: steps, sfx };
const file = path.join(__dirname, 'sc02.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
console.log(`wrote ${file}: ${M.length} music segments, ${amb.length} ambience beds, ${steps.length} footstep runs, ${sfx.length} sfx`);
