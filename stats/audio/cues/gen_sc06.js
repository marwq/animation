#!/usr/bin/env node
// Sound cue sheet generator for SC 06 · LEVELLING UP: "+50 XP" into the bar → LEVEL UP!, "For being NICE?!", the cafeteria full of
// quest markers, QUEST SPREE! (the main theme at full tilt), the deed montage (bags, the lunch-lady compliment, the ball out of the
// oak, the hat, the soup, the dog) with an xpPop sparkle + coin for every deed, the 2×2 split-screen, the time-lapse LEVEL UPs
// (MON → WED → FRI), Tank's HP climbing day by day (tags peeling off, NEW FRIEND), Grandpa's glasses (+1 XP: a sad little trombone),
// Max's EPIC QUEST, the pillow fort built in fast-forward (TA-DA), +100 XP → LEVEL 21 — then the turn: the music goes cold, faces
// turn into XP chips, "helping points" (coins), and "Two XP? Not worth it." in silence.
// Every time comes from the voice timeline exactly like scenes/s06.js (CUT / BEATS are imported from the scene module, built only
// from L(id).a/.b and .word()). When the voice changes:
//   node audio/cues/gen_sc06.js && python3 audio/validate_cues.py audio/cues/sc06.json
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const H = require('../../scenes/hud');
const { CUT: C, BEATS: B } = require('../../scenes/s06');
const { L } = V;

const l = (i) => L('06.' + i);
const w = (i, word, n = 0) => l(i).word(word, n).t0;
const T0 = V.scene('SC 06').start, END = V.scene('SC 07').start;    // == main.js RANGES for SC 06
const FLY = H.XP_FLY;

const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(t), name, g, r3(pan), note]); };
// an xpPop: sparkle when it pops over the person, coin when it lands in the bar (bottom left)
const xp = (t0, amount, sx, note, g = 0) => { add(t0, 'sparkle', -10 + g, P(sx), `+${amount} XP pops (${note})`); add(t0 + FLY, 'coin', -6 + g, -0.5, `+${amount} XP lands in the bar`); };

// ================================================================= SFX, shot by shot (same order as scenes/s06.js)
// ---- 1. "Experience plus fifty!"
xp(B.tPop50, 50, 1300, 'the first kindness XP', 4);
add(B.tLand50 + 0.05, 'money_counter', -8, -0.5, 'XP 50 → 100');
// ---- 2. "Level up!"
add(C.lvlup, 'jump', -6, 0, 'he jumps up on the bench');
add(B.tLvl2 - 0.1, 'level_up', 2, 0.3, 'LEVEL UP! 1 → 2');
add(C.lvlup + 0.4, 'land', -10, 0, 'lands on the bench');
add(C.lvlup + 0.2, 'crowd_gasp', -16, 0, 'the cafeteria turns');
// ---- 3. "I'm leveling UP? For being NICE?!"
add(B.tUp, 'zoom_in', -6, 0, 'smash-zoom on UP');
add(B.tNICE, 'zoom_in', -4, 0, 'smash-zoom on NICE');
add(B.tNICE + 0.05, 'pop', -6, 0.5, 'NICE?! lettering');
// ---- 4. quest markers all over the cafeteria
for (let i = 0; i < 7; i++) add(C.marks + 0.15 + i * 0.12, 'notify', -12 - (i % 2) * 2, [-0.6, -0.2, -0.7, 0.1, 0.6, -0.8, 0.3][i], `quest marker #${i + 1}`);
// ---- 5. QUEST SPREE!
add(C.spree, 'whoosh_long', -6, 0.4, 'whip to the street');
for (let i = 0; i < 6; i++) add(C.spree + 0.15 + i * 0.1, 'notify', -16, -0.6 + i * 0.25, 'a marker over every neighbour');
add(B.tSpree - 0.15, 'orch_hit', 0, 0, 'QUEST SPREE! title slam');
add(B.tSpree - 0.1, 'whoosh', -8, 0, 'the ribbon unrolls');
// ---- 6. groceries
add(C.groc, 'whoosh', -8, 0.4, 'whip');
add(C.groc + 0.1, 'paper', -12, 0.1, 'grocery bags rustle');
add(B.tCarried + 0.4, 'paper', -10, -0.1, 'bags handed over');
xp(B.DEEDS.groc[0], 10, 640, 'groceries');
// ---- 7. the lunch lady compliment
add(C.lady, 'whoosh', -8, -0.4, 'whip');
add(B.tCompl + 0.05, 'heart_pop', -8, 0.3, 'she blushes, hearts');
xp(B.DEEDS.lady[0], 5, 1200, 'compliment');
// ---- 8. the ball from the tree
add(C.ball, 'whoosh', -8, 0.4, 'whip');
add(B.tGrab - 0.3, 'jump', -6, 0.2, 'jump');
add(B.tGrab, 'bonk', -4, 0.3, 'grabs the ball out of the oak');
add(B.tGrab + 0.05, 'sparkle', -12, 0.3, 'leaf burst');
add(B.tGrab + 0.3, 'land', -8, 0.2, 'lands');
add(B.tGrab + 0.8, 'giggle', -10, -0.2, 'the kid cheers');
xp(B.DEEDS.ball[0], 20, 1000, 'ball rescue');
// ---- 9. "Nice hat, Mrs. Wells!"
add(C.hat, 'whoosh', -8, 0.4, 'whip');
add(B.tHat - 0.1, 'ui_pop', -8, -0.3, 'LILAC HAT · STYLE +80 tooltip');
add(B.tHat + 0.1, 'heart_pop', -12, -0.2, 'she touches her hat, flattered');
xp(B.DEEDS.hat[0], 5, 800, 'hat compliment');
// ---- 10. "Great soup, lunch lady!"
add(C.soup, 'whoosh', -8, -0.4, 'whip');
add(C.soup + 0.15, 'gulp', -4, -0.2, 'a long slurp');
add(B.tSoup - 0.2, 'ui_pop', -8, -0.2, 'MYSTERY SOUP · ??? tooltip');
add(B.tSoup + 0.05, 'squeak', -12, -0.2, 'thumbs up (he goes a bit green)');
xp(B.DEEDS.soup[0], 5, 1200, 'soup compliment');
// ---- 11. "Cool dog, random man!"
add(C.dog, 'whoosh', -8, 0.4, 'whip');
add(B.tDog - 0.2, 'ui_pop', -10, 0.2, 'DOG · COOL ∞ plate');
add(B.tDog + 0.1, 'dog_bark', -8, 0.2, 'the dark corgi barks');
xp(B.DEEDS.dog[0], 5, 1100, 'dog compliment');
// ---- 12. the 2×2 split-screen of good deeds
add(C.grid, 'whoosh', -8, 0.4, 'whip');
B.GRID.forEach((t, i) => { add(t - 0.05, 'whoosh', -12, i % 2 ? 0.5 : -0.5, `panel ${i + 1} slides in`); add(t + 0.15, 'pop', -12, i % 2 ? 0.5 : -0.5, 'panel lands'); });
['g0', 'g1', 'g2', 'g3'].forEach((k, i) => xp(B.DEEDS[k][0], B.DEEDS[k][1], i % 2 ? 1400 : 500, `mini quest ${i + 1}`, -2));
// ---- 13. "Level two." — MON
add(C.two, 'whoosh', -8, 0.3, 'whip to Monday');
add(C.two + 0.05, 'stamp', -8, -0.6, 'MON day stamp');
add(B.tTwo, 'chime', -2, 0.4, 'LV 2 hexagon');
// ---- 14. "Level five." — WED
add(C.five, 'stamp', -8, -0.6, 'WED day stamp');
add(B.tFive - 0.2, 'level_up', 0, 0.3, 'LEVEL UP 2 → 5');
// ---- 15. "Level twenty." — FRI
add(C.twenty, 'stamp', -8, -0.6, 'FRI day stamp');
add(B.tTwenty - 0.3, 'riser', -8, 0, 'he floats up into the gold column');
add(B.tTwenty - 0.15, 'level_up', 2, 0.3, 'LEVEL UP 5 → 20');
add(B.tTwenty, 'orch_hit', 0, 0, 'LEVEL TWENTY');
add(B.tTwenty + 0.1, 'confetti', -6, 0, 'confetti');
add(l(5).b + 1.0, 'land', -10, -0.5, 'lands, starts to strut');
// ---- 16. "Every day, you shared your lunch with Tank."
add(C.days, 'whoosh', -8, -0.4, 'whip back to the cafeteria');
add(w(6, 'shared') - 0.1, 'paper', -12, -0.3, 'half a sandwich across the table');
// ---- 17–19. "Forty health. Sixty. Eighty."
[[C.forty, B.tForty], [C.sixty, B.tSixty], [C.eighty, B.tEighty]].forEach(([c, t], i) => {
  add(c, 'stamp', -12, 0.7, `day stamp ${['TUE', 'WED', 'THU'][i]}`);
  add(t - 0.15, 'heart_pop', -6, -0.4, `HP ${[40, 60, 80][i]}`);
  add(t - 0.1, 'money_counter', -12, -0.4, 'HP rolls');
});
add(B.tSixty + 0.05, 'pop', -10, -0.4, 'TIRED peels off');
add(B.tEighty + 0.05, 'pop', -10, -0.4, 'LONELY peels off');
add(B.tEighty + 0.3, 'chime', -6, -0.4, 'NEW FRIEND tag');
// ---- 20. "Your mom makes good sandwiches."
add(C.good + 0.1, 'chomp', -12, -0.4, 'Tank chews');
// ---- 21–24. Grandpa's glasses
add(C.glasses, 'whoosh', -8, 0.4, 'whip to the living room');
for (let i = 0; i < 3; i++) add(C.glasses + 0.3 + i * 0.35, 'cloth', -16, 0.5, 'Grandpa pats his pockets');
add(B.tGlassesW - 0.1, 'notify', -2, 0.5, '"!" + NEW QUEST: Find Grandpa\'s glasses');
add(C.gramps + 0.7, 'ui_close', -16, 0, 'quest toast folds away');
add(B.tHeadW - 0.25, 'ui_pop', -6, 0.4, "GRANDPA'S GLASSES · LOCATION: HIS HEAD");
add(B.tQC - 0.2, 'swish', -10, 0.3, 'he pulls the glasses down');
add(B.tQC - 0.1, 'achievement', -4, 0, 'QUEST COMPLETE toast');
// ---- 25. "Plus one experience." — a tiny +1 XP + the magnifier
add(B.tOneSpawn, 'sparkle', -16, 0.3, 'a tiny +1 XP');
add(B.tOneSpawn + FLY, 'coin', -14, -0.5, '+1 XP lands');
add(B.tOneSpawn + 0.8, 'zoom_in', -8, 0, 'magnifier on the XP bar');
add(B.tOneSpawn + 1.2, 'sad_trombone', -14, 0, '+1 XP = +0.6%');
// ---- 26. "Easiest quest in history."
add(C.easiest + 0.2, 'paper', -14, 0.5, "Grandpa's newspaper");
add(w(11, 'history') - 0.1, 'stamp', -2, 0.4, 'NEW RECORD stamp');
// ---- 27–28. Max: "Build me a pillow fort! The biggest one EVER!"
add(C.max, 'door_open', -10, 0.8, 'Max bursts in from the kitchen');
add(B.tPillow - 0.15, 'achievement', -4, -0.3, 'EPIC QUEST card');
add(B.tEVER, 'monster_growl', -8, 0.2, "Max's RAWR (cute)");
add(B.tEVER + 0.05, 'zoom_in', -6, 0.2, 'smash-zoom on EVER');
// ---- 29. the build (fast-forward)
add(C.build, 'riser', -8, 0, 'fast-forward build');
for (let i = 0; i < 10; i++) add(C.build + i * (C.reveal - C.build) / 10 + 0.3, 'pop', -12 - (i % 3) * 2, i % 2 ? 0.6 : -0.6, `cushion #${i + 1} lands`);
// ---- 30. EPIC QUEST COMPLETE
add(C.reveal, 'tada', 0, 0, 'the fort to the ceiling');
add(B.tEpic - 0.1, 'achievement', 2, 0, 'EPIC QUEST COMPLETE!');
// ---- 31. +100 XP → LEVEL 21
xp(B.tPop100, 100, 860, 'the fort', 4);
add(B.tLand100 + 0.05, 'money_counter', -8, -0.5, 'XP fills');
add(B.tLvl21 - 0.1, 'level_up', 2, 0.4, 'LEVEL UP 20 → 21');
add(B.tLvl21, 'confetti', -6, 0, 'confetti');
add(B.tLvl21 + 0.1, 'applause', -12, 0, 'the family cheers');
add(B.tLvl21 + 0.3, 'dog_bark', -10, 0.4, 'Biscuit begs and barks');
// ---- 32. the stare — the warmth drains out
add(C.stare + 0.3, 'reverse_swell', -10, 0, 'the cheering fades');
add(C.stare + 0.9, 'shine', -10, 0, 'XP glints in his eyes');
add(C.slowly - 0.2, 'sub_drop', -10, 0, 'into the cold');
// ---- 33. "...you stopped helping people." — faces become XP chips
for (let i = 0; i < 5; i++) add(C.people + i * 0.25, 'glitch', -18, -0.6 + i * 0.3, 'a face turns into an XP chip');
// ---- 34. "You started helping points."
add(C.points + 0.05, 'paper', -14, 0.3, 'the FRAGILE box');
[0, 0.35, 0.7].forEach((d, j) => xp(B.tPoints50 + d, 50, [1300, 300, 1650][j], 'helping points', -2));
// ---- 35–36. "Two XP? Not worth it."
add(C.twoxp + 0.1, 'notify', -18, 0.4, 'a grey "+2 XP" over Mrs. Wells');
add(w(15, 'Two') + 0.1, 'blink', -12, -0.2, 'his eyes flick to the number, not to her');
add(C.walk + 0.7, 'step', -8, 0.1, 'he steps over an apple');
add(C.walk + 1.0, 'skate_roll', -18, -0.1, 'the apple rolls away');
add(END - 0.1, 'whoosh', -8, 0.3, 'whip into SC 07');

// ================================================================= MUSIC (tiles [T0, END])
const music = [
  { start: T0, end: C.spree, mood: 'levelup', energy: 0.7, in: 'cut', out: 'cut' },          // +50 XP, LEVEL UP!, "For being NICE?!"
  { start: C.spree, end: C.days, mood: 'levelup', energy: 1, in: 'cut', out: 'sting' },       // QUEST SPREE montage → LEVEL 20
  { start: C.days, end: C.glasses, mood: 'warm', energy: 0.45, in: 'cut', out: 'cut' },       // lunch with Tank every day
  { start: C.glasses, end: C.max, mood: 'homey', energy: 0.45, in: 'cut', out: 'cut' },       // Grandpa's glasses
  { start: C.max, end: C.stare, mood: 'montage', energy: 0.9, in: 'cut', out: 'sting' },      // the EPIC pillow fort, LEVEL 21
  { start: C.stare, end: C.twoxp, mood: 'cold', energy: 0.35, in: 'fade', out: 'cut' },       // he stopped helping people
  { start: C.twoxp, end: END, mood: 'silence', energy: 0, in: 'cut', out: 'cut' },            // "Two XP? Not worth it."
].map((s) => ({ ...s, start: r3(s.start), end: r3(s.end) }));

// ================================================================= AMBIENCE
const amb = [];
const bed = (a, b, name, g) => { if (b > a) amb.push({ start: r3(Math.max(a, T0)), end: r3(Math.min(b, END)), name, gain_db: g }); };
bed(T0, C.spree, 'crowd', -16);          // cafeteria
bed(C.spree, C.lady, 'birds', -14);      // the street
bed(C.lady, C.ball, 'crowd', -18);       // cafeteria (lunch lady)
bed(C.ball, C.soup, 'birds', -14);
bed(C.soup, C.dog, 'crowd', -18);
bed(C.dog, C.grid, 'town', -16);
bed(C.two, C.days, 'birds', -16);
bed(C.days, C.glasses, 'crowd', -18);
bed(C.glasses, C.stare, 'room', -18);    // living room
bed(C.slowly, END, 'town', -20);         // the cold street
bed(C.slowly, END, 'wind', -24);

// ================================================================= FOOTSTEPS (cycles from the scene code: steps every π/K s)
const steps = [];
const st = (a, b, iv, surface, g, pan) => { if (b > a) steps.push({ start: r3(Math.max(a, T0)), end: r3(Math.min(b, END)), interval: r3(iv), surface, gain_db: g, pan: r3(pan) }); };
st(C.spree, C.groc, Math.PI / 18, 'hard', -10, -0.4);                 // shSpree: AC.run((t - CUT.spree) * 18)
st(C.groc, B.tCarried + 0.35, Math.PI / 9, 'hard', -12, 0.1);         // shGroc: walkFront((t - CUT.groc) * 9)
st(C.hat, C.soup, Math.PI / 14, 'hard', -12, 0);                      // shHat: run((t - CUT.hat) * 14)
st(C.dog, C.grid, Math.PI / 7, 'hard', -16, 0.4);                     // shDog: the man's walk((t - CUT.dog) * 7)
st(l(5).b + 1.1, C.days, Math.PI / 7, 'hard', -10, 0);                // shTwenty: the strut walk((t - A5.b) * 7)
st(C.max, C.max + 0.9, Math.PI / 18, 'wood', -10, 0.5);               // shMax: Max runs in run((t - CUT.max) * 18)
st(C.slowly, C.points, Math.PI / 7, 'hard', -12, 0);                  // shSlowly: walk((t - CUT.slowly) * 7)
st(C.points, C.twoxp, Math.PI / 6, 'hard', -12, 0.2);                 // shPoints: walk((t - CUT.points) * 6)
st(C.walk, END, Math.PI / 7, 'hard', -8, 0.2);                        // shWalk: walk((t - CUT.walk) * 7)

sfx.sort((a, b) => a[0] - b[0]);
const out = { scene: 'SC 06', start: r3(T0), end: r3(END), music, ambience: amb, footsteps: steps, sfx };
const file = path.join(__dirname, 'sc06.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log('wrote', file, '—', sfx.length, 'sfx,', music.length, 'music segments,', amb.length, 'ambience beds,', steps.length, 'footstep runs');
