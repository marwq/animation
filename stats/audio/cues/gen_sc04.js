#!/usr/bin/env node
// Sound cue sheet generator for SC 04 · SCHOOL WITH STATS: the whip into the school front (school bell, a wave of plate
// pops, NEW AREA DISCOVERED), Benji's walk (LV 4 plate, the SHOELACES tooltip, the SPECIAL SKILL card, CLUMSY slap), the
// slow-motion trip (music tape-stops, books fly), the landing + book bonk + dizzy stars ("I'm okay!", −3 HP, SKILL USED);
// Room 12: the FINAL BOSS plate, "My dog ate it!" (Kevin stands up), the LIE DETECTOR (needle hunting, buzzer + LIAR!
// stamp, the MEANWHILE cutaway with the snoring dog), BOSS ATTACK: POP QUIZ! (orchestra hit), the papers slapping down,
// the DIFFICULTY roulette → IMPOSSIBLE (sub drop), NERVOUS slap / −7 HP, "my head?" (gulp), "No, ma'am!", "very nice...
// level." → the smash on her glare (music drops: heartbeat, PATIENCE slides below zero, ENRAGED); the gym (whistle, STR
// chips, SORT BY STRENGTH click + sort, PURE SCIENCE stamp, the picks ✓, PICKED, the FIRST smash-zoom, HIDDEN STAT), the
// wind-up (riser, SECRET: CANNON ARM, STR overflow) and three throws / three OUTs (+ Benji's dodge), VICTORY! (tada,
// confetti), WIN ×5/×9/×12 stamps, the speechless coach (crickets); the cafeteria (food tooltips, the mystery meat's
// glitchy "???" and bubbling, the spoon, the meat's eye opening), five quest markers dropping in, the IN GAMES = REAL LIFE
// split (8-bit blips), star eyes, "Real life has QUESTS?" (→ SC 05 hard-cuts to Tank).
// Every time comes from the voice timeline exactly like scenes/s04.js: the cut list (CUT) and the beats (BEATS) are imported
// from the scene module itself (built only from L(id).a/.b and .word()), the rest is re-derived here with L(). When the
// voice changes:
//   node audio/cues/gen_sc04.js && python3 audio/validate_cues.py audio/cues/sc04.json
// Output: audio/cues/sc04.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { CUT: C, BEATS: B } = require('../../scenes/s04');
const { L } = V;

const l = (i) => L('04.' + i);
const w = (i, word, n = 0) => l(i).word(word, n).t0;
const w1 = (i, word, n = 0) => l(i).word(word, n).t1;
const T0 = V.scene('SC 04').start, END = V.scene('SC 05').start;    // == main.js RANGES for SC 04

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));     // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(Math.max(t, T0)), name, g, r3(pan), note]); };

// ================================================================= SFX, shot by shot (same order as scenes/s04.js)
// ---- 1. the school front
add(C.ext, 'whoosh', -6, 0.4, 'whip in from the kitchen (white flash)');
add(C.ext + 0.2, 'bell', -12, 0.1, 'the school bell across the yard');
for (let j = 0; j < 6; j++) add(C.ext + 0.3 + j * 0.13, 'ui_pop', -16 + (j % 2) * 2, P(500 + j * 190), `mini plate #${j + 1} pops over a kid`);
add(C.ext + 0.95, 'ui_pop', -10, 0.05, 'the hero\'s "???" plate');
add(C.ext + 1.1, 'glitch', -18, 0.05, '??? flickers');
add(w(0, 'whole') - 0.3, 'notify', -2, 0, 'NEW AREA DISCOVERED banner drops');
add(w(0, 'whole'), 'shine', -8, 0, 'banner sheen');
// ---- 2. "Benji was level four."
add(B.tLv - 0.3, 'ui_pop', -6, P(500), 'BENJI plate unfolds');
add(B.tLv + 0.05, 'money_counter', -14, P(500), 'HP counts up to 100');
add(B.tFour, 'zoom_in', -8, 0, 'camera punch-in on "four"');
add(B.tFour + 0.02, 'pop', -12, P(500), 'LV 4');
// ---- 3. "His special skill was 'falling down.'"
add(C.skill, 'whoosh_down', -12, 0, 'cut down to his feet');
add(w(1, 'His') - 0.12, 'ui_pop', -6, 0.15, 'SHOELACES · UNTIED tooltip');
add(w(1, 'skill') + 0.15, 'whoosh_up', -12, 0, 'tilt up');
add(B.tFallDown - 0.18, 'ui_pop', -4, 0.4, 'SPECIAL SKILL card unfolds');
add(B.tFallDown + 0.15, 'shine', -6, 0.4, 'LEGENDARY chip');
add(B.tDown, 'tap', -4, -0.2, 'CLUMSY tag slaps onto his plate');
// ---- 4. "Hey, buddy!"
add(B.tHey - 0.1, 'cloth', -14, -0.1, 'Benji waves');
add(B.tBuddy, 'cloth', -16, 0.4, 'the hero waves back');
// ---- 5. "Whoa—" (slow motion)
add(C.trip, 'slip', 0, 0, 'the laces catch');
add(C.trip + 0.04, 'whoosh_long', -6, 0.1, 'slow-motion dive');
add(C.trip + 0.06, 'paper', -10, 0.1, 'the books burst out of his arms');
// ---- 6. "I'm okay!"
add(C.okay, 'body_fall', 0, 0.1, 'lands on his bottom');
add(C.okay + 0.02, 'thud', -4, 0.1, 'thud');
add(C.okay + 0.03, 'pop', -12, 0.3, '-3 damage number');
add(C.okay + 0.05, 'money_counter', -16, 0.1, 'HP 100 -> 97');
[[-0.2, -0.3], [-0.12, 0.3], [-0.02, -0.2], [0.06, 0.2]].forEach(([d, pan], i) => add(C.okay + d + 0.32, 'thud', -12, pan, `book ${i + 1} lands`));
add(B.tBonk + 0.32, 'bonk', -2, 0.05, 'the last book bonks his hat');
add(B.tBonk + 0.36, 'dizzy', -10, 0.05, 'dizzy stars');
add(l(2).b, 'notify', -6, 0, 'SKILL USED: FALLING DOWN');
add(C.krump - 0.1, 'whoosh', -6, 0.5, 'whip to Room 12');
add(C.krump - 0.05, 'bell', -6, 0, 'the bell rings for class');
// ---- 7. "Who forgot their homework?"
add(C.krump + 0.05, 'dramatic', -6, P(1300), 'FINAL BOSS plate (boss sting)');
add(C.krump + 0.1, 'ui_pop', -6, P(1300), 'plate unfolds');
add(C.krump + 0.6, 'alarm_beep', -16, P(1300), 'PATIENCE 0% blinks red');
add(w(3, 'homework') - 0.05, 'shine', -8, P(1300), 'glasses glint');
add(C.krump + 0.3, 'tap', -16, P(1500), 'pointer taps her palm');
add(C.krump + 1.2, 'tap', -16, P(1500), 'pointer taps her palm');
// ---- 8. "My dog ate it!"
add(C.dog + 0.05, 'cloth', -10, 0, 'Kevin stands up');
add(C.dog + 0.1, 'whoosh', -14, 0.1, 'hand shoots up');
add(C.dog + 0.18, 'ui_pop', -12, 0, 'KEVIN mini plate');
// ---- 9-10. the LIE DETECTOR
add(B.tLies - 0.22, 'ui_pop', -4, 0, 'LIE DETECTOR unfolds');
add(B.tLies + 0.2, 'money_counter', -10, 0, 'the needle hunts, digits spin');
for (let i = 0; i < 4; i++) add(B.tLies + 0.4 + i * 0.4, 'beep', -16, 0, 'measuring...');
add(C.lie99, 'zoom_in', -8, 0, 'punch-in');
add(B.t99 + 0.05, 'buzzer_wrong', 0, 0, 'LOCK: LIE 99%');
add(B.tLock, 'stamp', -2, 0.25, 'LIAR! stamp');
add(B.tLock + 0.1, 'alarm_beep', -12, 0, 'red alarm');
add(B.tPct - 0.4, 'whoosh', -8, -0.5, 'MEANWHILE AT KEVIN\'S HOUSE slides in');
add(B.tPct - 0.3, 'snore', -12, -0.5, 'the dog snores next to the homework');
add(B.tPct - 0.18, 'ui_pop', -10, -0.5, 'EATEN BY DOG: 0%');
add(B.tLock + 0.5, 'slide_down', -12, 0, 'Kevin sinks into his chair');
// ---- 11. "Pop quiz."
add(C.quiz, 'dramatic', -4, 0, 'the boss bar drops in');
add(C.quiz + 0.1, 'paper', -10, -0.2, 'she raises the stack');
add(B.tPopQ - 0.1, 'shine', -4, -0.2, 'glasses glint');
add(B.tPopQ, 'orch_hit', -2, 0.3, 'BOSS ATTACK: POP QUIZ!');
add(B.tPopQ + 0.02, 'impact', -6, 0, 'hit');
// ---- 12. "Twenty questions."
add(B.tQs - 0.44, 'whoosh', -10, -0.4, 'paper flies in');
add(B.tQs - 0.28, 'whoosh', -12, -0.4, 'second paper');
add(B.tQs - 0.02, 'slap', -4, P(780), 'slaps onto his desk');
add(B.tQs + 0.14, 'slap', -6, P(1140), 'and Benji\'s');
add(B.tQs + 0.2, 'stamp', -6, -0.4, '20 QUESTIONS');
// ---- 13. "Difficulty... impossible."
add(C.imp + 0.05, 'ui_pop', -6, -0.3, 'POP QUIZ tooltip');
for (let t = B.tDiff + 0.15; t < B.tImp - 0.05; t += 0.18) add(t, 'tap', -16, -0.3, 'difficulty roulette tick');
add(B.tImp, 'sub_drop', -2, 0, 'IMPOSSIBLE');
add(B.tImp + 0.02, 'orch_hit', -6, -0.3, 'boss card turns red (skull)');
add(B.tImp + 0.1, 'alarm_beep', -14, 0, 'red edge pulse');
// ---- 14. "Is that bad? That sounds bad."
add(B.tSounds, 'tap', -4, P(1150), 'NERVOUS slaps onto Benji\'s plate');
add(B.tBad2 + 0.02, 'pop', -10, P(1350), '-7 HP (stress)');
add(B.tBad2 + 0.05, 'money_counter', -16, P(1150), 'HP 97 -> 90');
// ---- 15. "Is there something on my head?"
add(C.head + 0.1, 'step_wood', -12, -0.4, 'Mrs. Krump at his desk');
add(C.head + 0.6, 'gulp', -6, 0.2, 'the hero gulps');
add(w(9, 'something') - 0.1, 'cloth', -14, -0.4, 'she touches her beehive');
// ---- 16. "No, ma'am!"
add(C.no + 0.05, 'swish', -10, 0.05, 'head shake');
add(C.no + 0.3, 'swish', -12, 0.05, 'hands waving');
// ---- 17. "Just your... very nice... level."
add(B.tYour, 'shine', -12, -0.3, 'his eyes flick up to her plate');
add(B.tNice - 0.1, 'pop', -12, 0.3, 'a sweaty thumbs-up');
// ---- 18. "...level." — the glare (music drops out)
add(C.glare, 'shock', -2, 0, 'smash on her face');
add(C.glare + 0.06, 'shine', -4, -0.2, 'glasses glint');
add(B.tLevel + 0.05, 'slide_down', -4, 0.5, 'PATIENCE rolls below zero');
add(B.tLevel + 0.2, 'alarm_beep', -10, 0.5, 'red edge pulse');
add(B.tLevel + 0.5, 'stamp', -2, 0.5, 'ENRAGED tag');
add(B.tLevel + 0.6, 'steam_hiss', -8, -0.2, 'anger marks');
add(B.tLevel + 0.7, 'heartbeat', -6, 0, 'silence... heartbeat');
// ---- 19. the gym
add(C.gym + 0.1, 'whistle', -2, -0.7, 'the coach blows the whistle');
for (let j = 0; j < 6; j++) add(B.tStrength - 0.2 + j * 0.09, 'ui_pop', -14, P(500 + j * 200), `STR chip #${j + 1}`);
// ---- 20. "Science. Pure science."
add(C.science, 'ui_pop', -4, -0.3, 'DODGEBALL · PICK TEAM panel');
add(B.tSci, 'click', -2, -0.3, 'SORT BY STRENGTH pressed');
add(B.tSci + 0.15, 'whoosh', -10, -0.3, 'rows sort');
add(B.tSci + 0.2, 'money_counter', -14, -0.3, 'ranks re-number');
add(B.tPure, 'stamp', -4, 0.3, 'PURE SCIENCE');
add(B.tPure + 0.4, 'shine', -10, -0.3, 'QUIET KID #1 highlight');
// ---- 21. "You. And you."
add(B.tYou1 - 0.05, 'swish', -10, 0.5, 'he points');
add(B.tYou1 + 0.1, 'confirm', -4, P(900), 'QUIET KID picked ✓');
add(B.tYou1 + 0.4, 'squeak', -14, P(900), 'who, me?');
add(B.tYou2 - 0.05, 'swish', -10, 0.5, 'points again');
add(B.tYou2 + 0.1, 'confirm', -6, P(700), 'PRIYA picked ✓');
add(B.tYou2 + 0.1, 'jump', -12, P(700), 'she hops out of the line');
add(B.tYou2 + 0.45, 'land', -14, P(780), 'lands');
// ---- 22. "And definitely you, eighty-five strength."
add(B.tDef - 0.22, 'ui_pop', -6, 0, 'QUIET KID plate');
add(B.t85, 'shine', -2, 0, 'STR 85 glows gold');
add(B.t85 + 0.02, 'zoom_in', -12, 0, 'zoom lines');
add(B.t85 + 0.3, 'stamp', -6, 0, 'PICKED');
// ---- 23. "You picked the quiet kid FIRST?"
add(B.tFirst, 'zoom_in', -4, -0.3, 'smash-zoom on "FIRST"');
add(B.tFirst + 0.02, 'shock', -10, -0.3, 'his arms fly out');
// ---- 24. "Trust me. He has a secret."
add(B.tTrust, 'cloth', -16, 0.1, 'hand on heart');
add(B.tSecret, 'magic', -6, 0.4, 'HIDDEN STAT: ???');
add(B.tSecret + 0.1, 'sparkle', -12, 0.2, 'sly sparkle');
// ---- 25. the wind-up (beat)
add(C.windup, 'whoosh_down', -10, 0, 'letterbox + low dutch angle');
add(C.windup + 0.05, 'riser', -4, 0, 'wind-up');
add(C.windup + 0.3, 'stamp', -4, 0.3, 'SECRET: CANNON ARM');
add(C.windup + 0.45, 'money_counter', -6, 0.3, 'STR 85 -> 185');
add(C.windup + 0.95, 'electric', -10, 0.3, 'STR overflow sparks');
// ---- 26. three throws, three OUTs; Benji's dodge
const TA_X = [890, 660, 430];                                           // team A targets (screen x, approx.)
B.tThrows.forEach((t0, k) => {
  add(t0, 'whoosh', -2, P(1200), `throw ${k + 1}`);
  add(t0 + B.FLY, k === 2 ? 'punch' : 'bonk', k === 2 ? 2 : 0, P(TA_X[k]), `hit ${k + 1}${k === 2 ? ' (CRIT!)' : ''}`);
  add(t0 + B.FLY + 0.04, 'pop', -10, P(TA_X[k]), '-85');
  add(t0 + B.FLY + 0.12, 'stamp', -8, P(TA_X[k]), 'OUT!');
  add(t0 + B.FLY + 0.05, 'crowd_cheer', -10 + k * 2, -0.5, 'the bleachers');
});
add(B.tBenjiDodge - 0.05, 'whoosh', -8, 0.6, 'a ball flies at Benji');
add(B.tBenjiDodge + 0.1, 'slip', -4, 0.7, 'he trips (special skill)');
add(B.tBenjiDodge + 0.15, 'body_fall', -6, 0.7, 'and sits down hard');
add(B.tBenjiDodge + 0.22, 'confirm', -6, 0.6, 'DODGE!');
// ---- 27. "You won."
add(C.victory, 'beep', -12, 0, 'scoreboard');
add(B.tWon - 0.02, 'tada', 0, 0, 'VICTORY!');
add(B.tWon, 'confetti', -4, 0, 'confetti');
add(B.tWon + 0.05, 'crowd_cheer', 0, 0, 'the gym erupts');
// ---- 28. "Every single game."
B.tWins.forEach((t, j) => add(t - 0.02, 'stamp', -2, P(520 + j * 440), `WIN ×${[5, 9, 12][j]}`));
B.tWins.forEach((t, j) => add(t + 0.05, 'beep', -14, 0, 'scoreboard ticks up'));
add(C.every + 0.1, 'applause', -8, 0, 'bleachers');
// ---- 29. the speechless coach
add(C.coach + 0.05, 'ui_pop', -8, 0.4, 'COACH plate');
add(C.coach + 0.45, 'tap', -4, 0.4, 'SPEECHLESS');
add(C.coach + 0.5, 'cricket', -10, 0, 'crickets');
add(C.lunch - 0.1, 'whoosh', -6, 0.5, 'whip to the cafeteria');
// ---- 30. "Even lunch had stats."
add(C.lunch + 0.12, 'ui_pop', -10, 0, 'LUNCH LADY plate');
add(B.tEven - 0.18, 'ui_pop', -6, -0.4, 'PIZZA +20 HAPPINESS');
add(B.tLunchW - 0.12, 'ui_pop', -6, -0.05, 'BROCCOLI +50 HEALTH −50 FUN');
add(B.tStats - 0.18, 'ui_pop', -6, 0.4, 'MASHED POTATO COMFORT +30');
// ---- 31. "The mystery meat just said 'question mark.'"
add(C.meat, 'bubbles', -8, 0, 'the mystery meat bubbles');
add(B.tMystery - 0.18, 'ui_pop', -6, 0.3, 'MYSTERY MEAT tooltip');
add(B.tMystery - 0.1, 'glitch', -10, 0.3, '"???"');
add(B.tSaid - 0.2, 'splat', -12, -0.2, 'the lunch lady\'s ladle plops');
[B.tQuestion, B.tQuestion + 0.22, B.tMark].forEach((t, j) => add(t, 'pop', -8, P(1250 + j * 150), `"?" ${j + 1} bubbles up`));
// ---- 32. "Should we eat it?"
add(C.eat + 0.25, 'squeak', -12, -0.2, 'the spoonful wobbles');
add(C.eat + 0.35, 'ui_pop', -10, -0.4, '"???" over the spoon');
// ---- 33. "Benji. It says..."
add(C.qmark + 0.25, 'slap', -10, -0.1, 'he catches Benji\'s wrist');
add(w(18, 'says'), 'metal_clank', -14, -0.2, 'the spoon goes down');
// ---- 34. "QUESTION MARK."
add(C.qzoom, 'zoom_in', -4, 0, 'smash into his tray');
add(B.tQM, 'glitch', -6, -0.3, '??? flashes red');
add(B.tMARK + 0.25, 'squeak', -4, 0.3, 'the meat opens one eye');
add(B.tMARK + 0.3, 'blink', -8, 0.3, 'blink');
add(B.tMARK + 0.9, 'blink', -10, 0.3, 'it blinks');
// ---- 35. the quest markers
B.quests.forEach((q, j) => add(q.at + 0.3, 'notify', -4 - j, clamp((q.x - 1000) / 1400, -0.8, 0.8), `"!" drops over ${q.note}`));
add(C.marks + 0.1, 'sparkle', -14, 0, 'markers shimmer');
// ---- 36. "Like in a game." — IN GAMES = REAL LIFE
add(C.game, 'whoosh', -8, -0.5, 'IN GAMES panel');
add(C.game + 0.12, 'whoosh', -8, 0.5, 'REAL LIFE panel');
add(C.game + 0.3, 'jump_game', -8, -0.5, '8-bit blip: the villager\'s "!"');
add(C.game + 0.35, 'pop', -6, 0, '=');
add(C.game + 0.45, 'notify', -6, 0.5, 'the lunch lady\'s "!"');
// ---- 37-38. "Quests? Real life has QUESTS?"
add(B.tQuests1 + 0.12, 'sparkle', -4, 0, 'star eyes');
add(B.tQuests1 + 0.15, 'shine', -8, 0, 'shine');
add(B.tQuests2 - 0.3, 'jump', -8, -0.1, 'he springs up, arms wide');
add(B.tQuests2 - 0.25, 'whoosh_up', -10, -0.1, 'whoosh');
add(l(20).b + 0.6, 'notify', -6, -0.6, 'one more "!" pops at the front table');
add(l(20).b + 0.4, 'magic', -12, 0, 'the room glitters with quests');

// ================================================================= MUSIC (moods of this video; tiles [T0, END])
const music = [
  { start: T0, end: C.trip, mood: 'quest', energy: 0.55, in: 'swell', out: 'tapestop' },        // school front, Benji's walk
  { start: C.trip, end: C.okay, mood: 'silence', energy: 0, in: 'cut', out: 'cut' },             // slow-motion "Whoa—"
  { start: C.okay, end: C.krump, mood: 'playful', energy: 0.5, in: 'cut', out: 'cut' },          // "I'm okay!"
  { start: C.krump, end: C.quiz, mood: 'boss', energy: 0.4, in: 'cut', out: 'cut' },             // Room 12: FINAL BOSS, the lie
  { start: C.quiz, end: B.tImp, mood: 'boss', energy: 0.75, in: 'cut', out: 'sting' },           // BOSS ATTACK: POP QUIZ!
  { start: B.tImp, end: C.bad, mood: 'silence', energy: 0, in: 'cut', out: 'cut' },              // IMPOSSIBLE (stunned)
  { start: C.bad, end: C.glare, mood: 'playful', energy: 0.35, in: 'fade', out: 'cut' },         // whispers, "my head?"
  { start: C.glare, end: C.gym, mood: 'silence', energy: 0, in: 'cut', out: 'cut' },             // the glare (heartbeat)
  { start: C.gym, end: C.windup, mood: 'quest', energy: 0.6, in: 'cut', out: 'cut' },            // picking by STRENGTH
  { start: C.windup, end: C.victory, mood: 'action', energy: 1.0, in: 'swell', out: 'sting' },   // the wind-up + throws
  { start: C.victory, end: C.coach, mood: 'levelup', energy: 0.9, in: 'cut', out: 'scratch' },   // VICTORY! every game
  { start: C.coach, end: C.lunch, mood: 'silence', energy: 0, in: 'cut', out: 'cut' },           // the speechless coach
  { start: C.lunch, end: C.meat, mood: 'quest', energy: 0.5, in: 'cut', out: 'cut' },            // food stats
  { start: C.meat, end: C.marks, mood: 'mystery', energy: 0.4, in: 'cut', out: 'cut' },          // the mystery meat
  { start: C.marks, end: END, mood: 'wonder', energy: 0.55, in: 'swell', out: 'cut' },           // quests! (SC05 cuts to the boss)
].map((s) => ({ ...s, start: r3(s.start), end: r3(s.end) }));

// ================================================================= AMBIENCE
const amb = [];
const bed = (a, b, name, g) => { if (b > a) amb.push({ start: r3(Math.max(a, T0)), end: r3(Math.min(b, END)), name, gain_db: g }); };
bed(T0, C.krump, 'town', -16);                       // the school front
bed(T0, C.krump, 'birds', -20);
bed(C.krump, C.gym, 'room', -14);                    // Room 12
bed(C.gym, C.coach, 'crowd', -16);                   // gym bleachers
bed(C.lunch, END, 'crowd', -12);                     // cafeteria chatter
bed(C.lunch, C.game, 'kitchen', -18);                // the lunch line

// ================================================================= FOOTSTEPS (cycles from the scene code: steps every π/K s)
const steps = [];
const st = (a, b, iv, surface, g, pan) => { if (b > a) steps.push({ start: r3(Math.max(a, T0)), end: r3(Math.min(b, END)), interval: r3(iv), surface, gain_db: g, pan: r3(pan) }); };
st(T0, C.benjiIn, Math.PI / 8.6, 'hard', -14, 0.1);                   // shExt: the hero's walkFront((t - c0) * 8.6)
st(C.benjiIn, C.hey, Math.PI / B.benjiPh, 'hard', -12, -0.3);         // shBenjiIn/shSkill: Benji's walk((t - CUT.benjiIn) * 6.5)
st(C.hey, C.trip, Math.PI / 8.5, 'hard', -12, -0.1);                  // shHey: walkFront((t - c0) * 8.5)

sfx.sort((a, b) => a[0] - b[0]);
const out = { scene: 'SC 04', start: r3(T0), end: r3(END), music, ambience: amb, footsteps: steps, sfx };
const file = path.join(__dirname, 'sc04.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log('wrote', file, '—', sfx.length, 'sfx,', music.length, 'music segments,', amb.length, 'ambience beds,', steps.length, 'footstep runs');
