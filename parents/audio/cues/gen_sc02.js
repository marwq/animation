#!/usr/bin/env node
// Sound cue sheet generator for SC 02 · LEGEND OF CUBE CITY + the Saturday family meeting (36.93–148.63 s).
// Cube City by day: the hero drops onto the plaza (freeze + YOU card), the school photo flash, the castle crane + LEGEND,
// the stats montage (LVL 1 -> 99, #1 BASE, the arena KO, 2,001), the castle tour (carpet, a noob dives into the lava pool,
// the trophy wall, the hop onto the throne, the record scratch on "just a chair", the coins flying out), Noodle (run-in
// freeze, fist bump, the real-life split, 400 bosses, BRO x4, NEW UPDATE, the Block King teaser, gulp), DarkBlade (the
// landing + clan, the profile, the noob who says hi, the standoff in chat bubbles, the shrinking castle, LOSING STREAK,
// BURN, DarkBlade fumes) — then the pull-out from the tablet into the Saturday kitchen: the freeze-frame intros (Dad +
// NINTENDO stamps, Mom + volume + SHH, Granny + knit/DING + UNDEFEATED), FAMILY MEETING (confetti, flip chart, the pointer,
// the NINTENDO 90% smash), "It's Cube City", the dimmed decision, TONIGHT + FAMILY GAME NIGHT, board games, "No, dear."
// (record scratch), the device triptych, the silent cereal flake, "my SERVER?!", the dolly zoom, the beaming family.
// Every time is derived from the voice timeline exactly like scenes/s02.js: the cut list (C) and the word beats (b) come
// from scenes/s02_env.timing() (built only from L(id).a/.b and .word()); the in-shot times below repeat the scene code's
// own expressions. When the voice changes:
//   node audio/cues/gen_sc02.js && python3 audio/validate_cues.py audio/cues/sc02.json
// Output: audio/cues/sc02.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { L } = V;
const { C, b, T0, END } = require('../../scenes/s02_env').timing();

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const lerp = (a, c, k) => a + (c - a) * k;
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));     // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(t), name, g, r3(pan), note]); };
const l = (i) => L('02.' + i);

// in-shot times (the same expressions as in scenes/s02_game.js / s02.js)
const open = { tLand: T0 + 0.42, fz: b.you + 0.06, hop: b.you - 0.16 };
const flashT = b.kid - 0.04;
const tR = b.legend - 0.22;
const lvLand = C.level + 0.42;
const arena = { tHit: b.arena - 0.02, tDash: b.wins - 0.2 };
const lava = { tJ: b.pool - 0.05 }; lava.tIn = lava.tJ + 0.5;
const throne = { tW1: b.is - 0.05, tLand: b.throne + 0.02 };
const nood = { fz0: b.noodle + 0.08 }; nood.fz1 = Math.max(nood.fz0 + 0.3, b.friend - 0.6); nood.end = b.friend - 0.08;
const boss = { t0: b.but5 + 0.05, t1: b.together - 0.05 };
const dark = { tLand: b.darkblade - 0.12, fz: b.darkblade + 0.18 };
const angry = { tHi: b.why - 0.15, tRun: b.angry - 0.05 };
const tP = b.YOU8 - 0.08;
const L8a = l(8).a, A15a = l(15).a;
const fzDad = b.dad + 0.08, fzMom = b.mom + 0.08, fzGran = b.granny + 0.08;
const join = { tg: b.were - 0.06, td: b.YOUR - 0.1, tm: b.game18 - 0.1 };
const flakeLand = C.server - 0.3;

// ================================================================= SFX, shot by shot (same order as scenes/s02.js SHOTS)
// ---- whip-pans (white streak flash) on these cuts — scenes/s02.js WHIPS
for (const [tc, dir] of [[C.legend, -1], [C.level, 1], [C.base, -1], [C.welcome, 1], [C.lava, 1], [C.noodle, -1], [C.bro, 1], [C.king, 1], [C.dark, -1], [C.taunt, 1], [C.meeting, 1], [C.no, -1]]) {   // the END whip's whoosh is in SC 03's sheet (148.63)
  add(tc - 0.09, 'whoosh', -7, 0.3 * dir, 'whip-pan');
}
// ---- 1. "This is you." — PLAY, the hero drops onto the plaza, hop, freeze + YOU card
add(T0, 'vhs_clunk', -8, -0.6, '▶ PLAY: the rewind from SC 01 lands on Cube City by day');
add(T0 + 0.05, 'whoosh_down', -4, 0, 'the hero drops in from the sky');
add(open.tLand, 'land', 0, 0, 'lands on the plaza (dust puffs)');
add(open.tLand + 0.02, 'thud', -6, 0, 'camera shake');
add(open.hop, 'jump_game', -4, 0, 'he turns and hops: arms up');
add(open.fz, 'record_scratch', -2, 0, 'freeze-frame "this is you"');
add(open.fz + 0.03, 'swish', -6, 0.5, 'YOU · LVL 99 card slams in');
add(open.fz + 0.12, 'sparkle', -8, 0.5, 'card sparkles');
// ---- 2. "In real life, you're just a kid." — the school photo
add(C.photo, 'whoosh', -8, 0, 'the taped photo spins in');
add(flashT, 'camera_flash', 0, 0, 'the photographer\'s flash on "kid"');
add(b.kid + 0.2, 'stamp', -2, 0.3, 'JUST A KID stamp');
// ---- 3. "But in Cube City... you're a legend." — crane up the castle
add(C.legend + 0.1, 'whoosh_long', -6, 0, 'crane up the castle');
add(b.legend - 1.5, 'reverse_swell', -6, 0, 'into LEGEND');
add(tR, 'swish', -4, -0.2, 'sword up');
add(b.legend, 'impact', 0, 0, 'LEGEND title slams in (shake)');
add(b.legend + 0.02, 'shine', -3, -0.2, 'the sword glints');
add(b.legend + 0.05, 'confetti', -4, 0, 'confetti');
// ---- 4. "Level ninety-nine." — LVL 1 -> 99
add(C.level, 'jump_game', -4, -0.6, 'the hero leaps in');
add(lvLand, 'land', -4, -0.4, 'lands');
for (let i = 0; i < 3; i++) add(b.level + 0.1 + i * 0.6, 'money_counter', -8, 0.4, 'level counter rolls up');
add(b.ninety, 'level_up', 0, 0.4, 'LVL 99!');
add(b.ninety + 0.02, 'confetti', -6, 0, 'confetti');
add(b.ninety + 0.25, 'ui_pop', -4, 0.4, 'MAX LEVEL ribbon');
// ---- 5. "The best base in Tycoon Valley." — #1 BASE
add(b.best - 0.05, 'achievement', -2, 0, '#1 BASE badge');
for (let i = 0; i < 5; i++) add(b.tycoon + i * 0.11, 'pop', -10, P(960 + (i - 2) * 100), `star ${i + 1}`);
add(b.valley, 'sparkle', -6, 0, 'the castle sparkles');
// ---- 6. "Two thousand wins in the arena." — the KO
add(C.arena, 'crowd_cheer', -8, 0, 'arena stands');
add(C.arena + 0.05, 'ui_pop', -8, -0.9, 'WINS counter');
add(b.two, 'money_counter', -8, -0.9, 'wins roll to 2,000');
add(arena.tDash, 'whoosh', -6, 0, 'the hero dashes in');
add(arena.tHit - 0.08, 'swish', -4, 0.2, 'golden slash');
add(arena.tHit, 'punch', 2, 0.25, 'POW!');
add(arena.tHit + 0.02, 'boing', -4, 0.3, 'the opponent flies out of the arena');
add(arena.tHit + 0.05, 'whoosh_up', -6, 0.5, 'KO flight');
add(arena.tHit + 0.1, 'crowd_cheer', -2, 0, 'the crowd erupts');
// ---- 7. "Two thousand and ONE." — +1
add(b.one - 0.1, 'sparkle', -6, 0.7, 'the KO\'d player twinkles in the sky');
add(b.one, 'ka_ching', -2, 0.5, 'WINS 2,001');
add(b.one + 0.02, 'pop', -6, 0.3, '+1');
// ---- 8. "Welcome to my castle." — the red carpet
add(C.welcome + 0.05, 'whoosh_long', -8, 0, 'the red carpet unrolls');
add(b.castle, 'harp_up', -6, 0, 'the castle sparkles');
// ---- 9. "Lava pool." — a noob dives in
for (let t = C.lava + Math.PI / 9; t < lava.tJ; t += Math.PI / 9) add(t, 'boing', -12, -0.6, 'the noob bounces on the diving board');
add(lava.tJ, 'jump_game', -4, -0.6, 'the noob dives');
add(lava.tJ + 0.05, 'whoosh', -8, -0.7, 'backflip');
add(lava.tIn, 'splat', -2, -0.9, 'into the lava');
add(lava.tIn + 0.02, 'sizzle', -4, -0.9, 'sizzle');
// ---- 10. "Trophy room."
for (let i = 0; i < 3; i++) add(C.trophy + 0.2 + i * 0.4, 'squeak', -12, 0.3, 'polishing the #1 cup');
add(b.room - 0.1, 'shine', -4, 0, 'shine sweeps across 400 cups');
// ---- 11. "And this... is my throne."
add(throne.tW1, 'jump_game', -4, 0.2, 'the hop onto the throne');
add(throne.tLand, 'land', -4, 0.2, 'lands on the cushion');
add(throne.tLand + 0.03, 'angel', -4, 0.2, 'spotlight + choir');
// ---- 12. "The throne was just a chair." — deadpan
add(C.chair, 'record_scratch', 0, 0, 'deadpan: grey, the music stops');
add(b.chair - 0.05, 'ui_pop', -6, 0.6, 'museum label: FIG. 1 — A CHAIR');
// ---- 13. "A very expensive chair." — the coins fly out
add(C.tag, 'zoom_in', -6, 0, 'push in on the price tag');
add(b.very - 0.1, 'ui_pop', -8, -0.9, 'COINS counter');
add(b.expensive, 'coins', 0, 0.4, 'coins burst out of the wallet');
add(b.expensive + 0.05, 'money_counter', -6, -0.9, '99,999 -> 1');
add(b.expensive + 0.08, 'powerdown', -6, 0.5, '-99,999');
add(b.chair2 + 0.15, 'gulp', -4, 0, 'the hero sweats');
// ---- 14. "That's Noodle. Your best friend." — run-in, freeze, fist bump
add(nood.fz0, 'record_scratch', -4, -0.4, 'freeze on Noodle');
add(nood.fz0 + 0.03, 'swish', -6, 0, 'NOODLE card');
add(b.friend - 0.05, 'punch', -4, 0.4, 'fist bump');
add(b.friend, 'pop', -6, 0.4, 'BFF!');
add(b.friend + 0.02, 'sparkle', -8, 0.4, 'burst');
// ---- 15. "You've never met in real life..." — split
add(C.met, 'whoosh', -6, -0.4, 'left panel slides in');
add(C.met + 0.04, 'whoosh', -6, 0.4, 'right panel slides in');
add(C.met + 0.15, 'ui_pop', -10, 0, 'REAL LIFE labels');
add(b.real5, 'pop', -6, 0.5, '??? over the silhouette');
// ---- 16. "...four hundred bosses together." — montage
for (let i = 0; i < 8; i++) add(lerp(boss.t0, boss.t1, i / 7), 'stamp', -8, P([300, 1620, 260, 1660, 620, 1300, 130, 1790][i]), `boss card ${i + 1}: DEFEATED`);
add(C.bosses + 0.05, 'ui_pop', -8, 0, 'BOSSES BEATEN pill');
add(b.four - 0.15, 'money_counter', -8, 0, 'boss counter rolls to 400');
add(b.together - 0.12, 'jump_game', -6, 0, 'they hop for the high five');
add(b.together, 'slap', 0, 0, 'high five');
add(b.together + 0.02, 'crowd_cheer', -8, 0, 'TEAM!');
// ---- 17. NOODLE: "Bro! Bro, bro, bro!"
b.bro.forEach((tb, i) => { add(tb - 0.04, 'jump_game', -8, 0, `hop ${i + 1}`); add(tb, 'pop', -6, P([420, 1500, 380, 1540][i]), `BRO! ${i + 1}`); });
// ---- 18. "New update!"
add(b.newW - 0.1, 'notify', 0, 0, 'NEW UPDATE banner');
add(C.update + 0.02, 'jump_game', -8, -0.3, 'Noodle hops');
// ---- 19. "The Block King is coming!" — the teaser
add(C.king, 'rumble', -2, 0.2, 'the Block King rises over the city');
add(b.block - 0.08, 'impact', -2, 0, 'THE BLOCK KING title');
add(b.king, 'thunder', -4, -0.5, 'lightning left');
add(b.coming - 0.05, 'thunder', 0, 0.5, 'lightning right + flash');
add(b.coming + 0.1, 'monster_growl', -6, 0.2, 'his eyes glow');
// ---- 20. the two friends gulp
add(C.gulp + 0.1, 'gulp', 0, 0.2, 'gulp');
// ---- 21. "And that's DarkBlade." — the landing
add(C.dark + 0.05, 'whoosh_down', -4, 0, 'DarkBlade falls from the sky');
add(dark.tLand, 'impact', 2, 0, 'superhero landing');
add(dark.tLand + 0.01, 'rock_drop', -6, 0, 'the ground cracks');
for (let j = 0; j < 4; j++) add(dark.tLand + 0.12 * (j + 1), 'land', -8, P([1300, 1600, 1800, 800][j]), `clan member ${j + 1} lands`);
add(dark.fz, 'record_scratch', -4, 0, 'freeze');
add(dark.fz + 0.03, 'swish', -6, -0.4, 'DARKBLADE card');
// ---- 22. "Nobody knows who he really is." — profile
add(C.who + 0.05, 'ui_pop', -4, 0.5, 'PLAYER PROFILE card');
for (const t of [C.who + 0.15, b.who - 0.05, b.really - 0.05, b.is7 - 0.05]) add(t, 'blink', -8, 0.6, 'profile row: ???');
for (const t of [b.who, b.really, b.is7]) add(t - 0.05, 'pop', -12, -0.3, 'a ? orbits');
// ---- 23. "...why he's always so angry." — the noob says hi
add(angry.tHi, 'chat_pop', -4, 0.5, '"hi :)"');
add(b.always - 0.1, 'steam_hiss', -6, -0.1, 'DarkBlade\'s eyes flare, steam');
add(angry.tRun, 'squeak', -6, 0.5, 'the noob bolts');
add(angry.tRun + 0.03, 'whoosh', -8, 0.7, 'runs off');
add(b.angry - 0.1, 'ui_pop', -8, 0.9, 'MOOD: ANGRY 24/7');
// ---- 24. "You got lucky last time, YOU." — the standoff
add(L8a - 0.3, 'chat_pop', -4, -0.1, 'DarkBlade\'s chat bubble');
add(L8a, 'typing', -12, -0.1, 'typed letter by letter');
add(b.YOU8 - 0.15, 'swish', -4, 0.4, 'the sword points at YOU');
add(tP, 'zoom_in', -4, 0, 'smash-in on "YOU"');
add(tP + 0.05, 'pop', -8, -0.5, '! over the hero');
// ---- 25. "Enjoy your little castle." — the castle shrinks
add(b.enjoy - 0.3, 'chat_pop', -4, 0.3, 'bubble');
add(b.enjoy, 'typing', -12, 0.3, 'typed');
add(b.little - 0.05, 'slide_down', -6, 0, 'the castle shrinks');
add(b.castle8 + 0.1, 'crowd_laugh', -10, -0.4, 'the clan: HAHA / lol');
// ---- 26. YOU: "Enjoy your little losing streak." — BURN
add(b.losing - 0.05, 'ui_pop', -4, 0.5, 'LOSING STREAK x47 badge');
add(b.streak, 'sad_trombone', -8, 0.5, 'losing streak');
add(b.streak + 0.2, 'crowd_gasp', -4, -0.6, 'Noodle: OOOOH!');
add(b.streak + 0.35, 'boom', -2, 0.5, 'BURN!');
add(b.streak + 0.37, 'sizzle', -8, 0.5, 'the BURN badge flames');
// ---- 27. (beat) DarkBlade fumes
add(C.fume, 'steam_hiss', -2, 0, 'DarkBlade fumes');
add(C.fume + 0.12, 'giggle', -6, 0.6, 'clan: lol');
add(C.fume + 0.26, 'giggle', -8, 0.8, 'clan: hehe');
// ---- 28. "But on Saturday morning... real life happened." — the pull-out from the tablet
add(C.sat, 'whoosh_long', -4, 0, 'pull out of the tablet into the kitchen');
add(b.saturday, 'ui_pop', -6, 0, 'SATURDAY · 8:00 AM');
add(b.morning + 0.3, 'paper', -10, 0.1, 'Dad turns a page');
add(b.happened + 0.15, 'squeak', -6, -0.4, 'the hero notices: !');
// ---- 29. "There's Dad. An accountant." — freeze + card, star eyes
add(fzDad, 'record_scratch', -4, 0, 'freeze on Dad');
add(fzDad + 0.03, 'swish', -6, -0.4, 'DAD card');
add(b.accountant - 0.05, 'ui_pop', -8, -0.4, 'ACCOUNTANT ribbon');
add(b.accountant + 0.05, 'ka_ching', -6, 0, 'star eyes');
// ---- 30. "He thinks every video game is called 'the Nintendo.'"
add(C.dadNin + 0.05, 'pop', -4, 0.4, 'thought bubble');
for (const [i, t] of [b.every, b.video, b.game, b.called].entries()) add(t - 0.05, 'pop', -8, P([1130, 1550, 1130, 1550][i]), `game card ${i + 1}`);
for (let i = 0; i < 4; i++) add(b.nintendo + i * 0.1, 'stamp', -4, P([1130, 1550, 1130, 1550][i]), `NINTENDO stamp ${i + 1}`);
// ---- 31. "There's Mom. A very quiet librarian." — freeze + card, volume
add(fzMom, 'record_scratch', -4, 0, 'freeze on Mom');
add(fzMom + 0.03, 'swish', -6, -0.4, 'MOM card');
add(b.quiet - 0.1, 'ui_pop', -8, 0.6, 'VOLUME OSD');
for (let i = 0; i < 4; i++) add(b.quiet + i * 0.12, 'beep', -14, 0.6, 'volume steps down');
// ---- 32. "She says 'shh' more than any other word."
add(b.shh - 0.12, 'swish', -6, -0.4, 'the finger goes up');
add(b.more - 0.2, 'ui_pop', -6, 0.4, "MOM'S TOP WORDS chart");
add(b.more, 'slide_up', -8, 0.5, 'the SHH bar grows off the chart');
// ---- 33. "And there's Granny. She knits. She bakes." — freeze + card
add(fzGran, 'record_scratch', -4, 0, 'freeze on Granny');
add(fzGran + 0.03, 'swish', -6, 0.5, 'GRANNY card');
add(b.knits - 0.05, 'typing', -6, 0, 'needles clicking in a frenzy');
add(b.knits + 0.05, 'whoosh_up', -8, 0.3, 'a scarf shoots out');
add(b.bakes - 0.1, 'whoosh', -8, 0.8, 'the cookie tray slides in');
add(b.bakes + 0.15, 'bell', -2, 0.6, 'DING!');
// ---- 34. "...never lost an argument in her life." — scoreboard
add(b.and13 - 0.05, 'ui_pop', -4, -0.4, 'ARGUMENTS scoreboard');
add(b.and13, 'money_counter', -8, -0.4, 'WON rolls to 9,999');
add(b.lost, 'boing', -8, -0.3, 'LOST: 0');
add(b.life - 0.05, 'stamp', 0, -0.4, 'UNDEFEATED');
add(b.life + 0.35, 'shine', -4, 0.1, 'glint on her glasses');
// ---- 35. DAD: "Family meeting!" — he pops up at the flip chart
add(C.meeting + 0.05, 'boing', -4, -0.4, 'Dad pops up at the flip chart');
add(b.meeting - 0.05, 'paper', -8, 0, 'the FAMILY MEETING bunting drops');
add(b.meeting, 'confetti', -2, -0.2, 'confetti');
add(b.meeting + 0.02, 'tada', -6, -0.2, 'party!');
// ---- 36. "...eleven hours a day in..." — the chart flips, the circle
add(b.noticed, 'paper', -4, -0.5, 'the chart page flips');
add(b.eleven + 0.05, 'squeak', -8, -0.5, 'marker circles 11 HRS/DAY');
for (let i = 0; i < 3; i++) add(b.eleven + 0.08 + i * (Math.PI / 20) * 2, 'tap', -12, -0.5, 'pointer taps');
add(b.hours, 'pop', -6, -0.7, '!!');
// ---- 37. "...the Nintendo." — smash on NINTENDO 90%
add(b.nintendo14 - 0.03, 'zoom_in', -4, 0, 'smash zoom');
add(b.nintendo14, 'boom', 0, 0, 'NINTENDO 90%');
for (let i = 0; i < 3; i++) add(b.nintendo14 + (Math.PI / 18) * (0.5 + 2 * i), 'tap', -10, 0.2, 'pointer taps the pie');
// ---- 38. YOU: "It's not a Nintendo, Dad. It's Cube City." — tablet up
add(A15a - 0.1, 'swish', -6, -0.2, 'the tablet goes up');
add(b.cube15 - 0.05, 'shine', -4, -0.1, 'the tablet glows: CUBE CITY');
add(b.cube15 + 0.1, 'blink', -10, -0.5, 'Dad: ?');
// ---- 39. MOM: "So we made a decision." — the lights dim
add(b.decision - 0.1, 'dramatic', -4, 0.3, 'the room dims');
// ---- 40. "Tonight is Family Game Night." — TONIGHT + the title
add(b.tonight, 'stamp', 0, 0.5, 'TONIGHT');
add(b.family16 - 0.12, 'orch_hit', -2, 0, 'FAMILY GAME NIGHT title');
add(b.family16 - 0.1, 'jump', -8, -0.5, 'Dad\'s jazz hands');
add(b.night, 'confetti', -4, 0, 'confetti');
// ---- 41. YOU: "Oh. Board games. Okay, that's fine—"
add(b.board - 0.1, 'pop', -6, 0.4, 'thought bubble: board game');
add(b.okay + 0.1, 'harp_up', -8, -0.5, 'phew~');
// ---- 42. GRANNY: "No, dear." — the needles stop
add(C.no, 'record_scratch', 0, 0, 'everything stops');
add(b.no - 0.05, 'metal_clank', -10, 0.6, 'clink: the needles stop');
// ---- 43. "We're joining YOUR game." — the device triptych
for (const [t0, x] of [[join.tg, 320], [join.td, 960], [join.tm, 1600]]) {
  add(t0, 'whoosh_down', -6, P(x), 'a panel slams down');
  add(t0 + 0.25, 'impact', -4, P(x), 'panel lands');
  add(t0 + 0.28, 'tv_on', -8, P(x), 'the device lights up: CUBE CITY');
}
// ---- 44. ⏱ the cereal flake falls back into the bowl (silent beat)
add(C.flake + 0.06, 'slide_down', -14, 0.1, 'the flake slips off the spoon');
add(flakeLand, 'splat', -10, 0.2, 'plip.');
// ---- 45. YOU: "You're joining... my SERVER?!"
add(b.server - 0.03, 'zoom_in', -4, 0, 'smash zoom');
add(b.server, 'boom', 2, 0, 'my SERVER?!');
// ---- 46. "It was the scariest sentence you had ever heard." — dolly zoom
add(C.scary, 'riser', -8, 0, 'dolly zoom');
add(b.scariest - 0.05, 'thunder', -2, 0, 'lightning outside');
add(b.ever, 'heartbeat', -6, 0, 'heartbeat');
// ---- 47. the family beams with their devices — whip out to SC 03
add(C.family, 'tv_on', -8, 0.3, 'the devices light up');
add(C.family + 0.05, 'jump', -10, -0.7, 'Dad bounces');
add(C.family + 0.1, 'sparkle', -8, 0.4, 'sparkles');
add(C.family + 0.8, 'gulp', -2, -0.4, 'the hero gulps');
sfx.sort((p, q) => p[0] - q[0]);

// ================================================================= music (tiles [T0, END])
const seg = (start, end, mood, energy, inn, out) => ({ start: r3(start), end: r3(end), mood, energy, in: inn, out });
const M = [
  seg(T0, open.fz, 'lobby', 0.6, 'cut', 'scratch'),            // Cube City by day, "This is you" — scratch on the freeze
  seg(open.fz, C.legend, 'playful', 0.35, 'cut', 'cut'),        // the card + the school photo: just a kid
  seg(C.legend, C.level, 'epic', 0.75, 'swell', 'cut'),         // the castle crane: LEGEND
  seg(C.level, C.welcome, 'montage', 0.85, 'cut', 'sting'),     // stats montage: LVL 99, #1 BASE, the KO, 2,001
  seg(C.welcome, C.chair, 'lobby', 0.55, 'cut', 'scratch'),     // the castle tour — record scratch on "just a chair"
  seg(C.chair, C.tag, 'silence', 0, 'cut', 'cut'),              // deadpan: FIG. 1 — A CHAIR
  seg(C.tag, C.noodle, 'playful', 0.4, 'cut', 'cut'),           // a very expensive chair
  seg(C.noodle, C.met, 'playful', 0.6, 'cut', 'cut'),           // Noodle runs in, BFF
  seg(C.met, C.bosses, 'warm', 0.4, 'fade', 'cut'),             // never met in real life
  seg(C.bosses, C.king, 'montage', 0.85, 'cut', 'cut'),         // 400 bosses, bro bro bro, NEW UPDATE
  seg(C.king, C.dark, 'boss', 0.7, 'swell', 'sting'),           // the Block King teaser — sting into the gulp
  seg(C.dark, C.streak, 'mystery', 0.55, 'cut', 'cut'),         // DarkBlade + the standoff
  seg(C.streak, C.sat, 'playful', 0.5, 'cut', 'tapestop'),      // the BURN — the game music tape-stops into real life
  seg(C.sat, C.meeting, 'family', 0.45, 'fade', 'cut'),         // Saturday kitchen: the family intros
  seg(C.meeting, C.decision, 'showtime', 0.55, 'cut', 'cut'),   // Dad's FAMILY MEETING presentation
  seg(C.decision, C.tonight, 'mystery', 0.35, 'cut', 'cut'),    // the lights dim: a decision
  seg(C.tonight, C.boardG, 'family', 0.8, 'cut', 'cut'),        // TONIGHT: FAMILY GAME NIGHT!
  seg(C.boardG, C.no, 'warm', 0.4, 'cut', 'scratch'),           // board games, phew — record scratch on "No, dear."
  seg(C.no, C.joining, 'silence', 0, 'cut', 'cut'),             // the needles stop
  seg(C.joining, C.flake, 'epic', 0.7, 'cut', 'cut'),           // the device triptych
  seg(C.flake, C.server, 'silence', 0, 'cut', 'cut'),           // ⏱ the cereal flake
  seg(C.server, C.scary, 'chaos', 0.75, 'cut', 'cut'),          // my SERVER?!
  seg(C.scary, C.family, 'mystery', 0.5, 'swell', 'sting'),     // the scariest sentence
  seg(C.family, END, 'family', 0.6, 'cut', 'fade'),             // the family beams -> SC 03 (that evening)
];

// ================================================================= ambience + footsteps
const amb = [
  { start: r3(T0), end: r3(C.photo), name: 'town', gain_db: -12 },
  { start: r3(C.legend), end: r3(C.level), name: 'wind', gain_db: -14 },
  { start: r3(C.base), end: r3(C.arena), name: 'wind', gain_db: -14 },
  { start: r3(C.arena), end: r3(C.welcome), name: 'crowd', gain_db: -10 },
  { start: r3(C.welcome), end: r3(C.lava), name: 'birds', gain_db: -14 },
  { start: r3(C.lava), end: r3(C.met), name: 'room', gain_db: -14 },
  { start: r3(C.met), end: r3(C.bosses), name: 'night', gain_db: -16 },
  { start: r3(C.bro), end: r3(C.king), name: 'room', gain_db: -14 },
  { start: r3(C.king), end: r3(C.gulp), name: 'wind', gain_db: -10 },
  { start: r3(C.gulp), end: r3(C.dark), name: 'room', gain_db: -14 },
  { start: r3(C.dark), end: r3(C.who), name: 'wind', gain_db: -12 },
  { start: r3(C.angry), end: r3(C.sat), name: 'birds', gain_db: -14 },
  { start: r3(C.sat), end: r3(END), name: 'kitchen', gain_db: -12 },
  { start: r3(C.sat), end: r3(C.decision), name: 'birds', gain_db: -18 },
];
const steps = [
  // the hero's dash in the arena: run(t * 16)
  { start: r3(arena.tDash), end: r3(arena.tHit - 0.12), interval: r3(Math.PI / 16), surface: 'soft', gain_db: -8, pan: 0 },
  // the walk to the throne: walk(t * 9)
  { start: r3(C.throne), end: r3(throne.tW1), interval: r3(Math.PI / 9), surface: 'hard', gain_db: -8, pan: 0.1 },
  // Noodle runs in: run(tt * 14) — before and after his freeze-frame
  { start: r3(C.noodle), end: r3(nood.fz0), interval: r3(Math.PI / 14), surface: 'hard', gain_db: -8, pan: -0.4 },
  { start: r3(nood.fz1), end: r3(nood.end), interval: r3(Math.PI / 14), surface: 'hard', gain_db: -8, pan: 0 },
  // the noob walks up to DarkBlade (walk(t * 11)) and then runs off (run(t * 18))
  { start: r3(C.angry), end: r3(angry.tHi), interval: r3(Math.PI / 11), surface: 'soft', gain_db: -10, pan: 0.4 },
  { start: r3(angry.tRun), end: r3(Math.min(angry.tRun + 0.9, C.taunt)), interval: r3(Math.PI / 18), surface: 'soft', gain_db: -10, pan: 0.6 },
].filter((s) => s.end - s.start > 0.15);

const out = { scene: 'SC 02', start: r3(T0), end: r3(END), music: M, ambience: amb, footsteps: steps, sfx };
fs.writeFileSync(path.join(__dirname, 'sc02.json'), JSON.stringify(out, null, 1));
console.log(`sc02.json: ${sfx.length} sfx, ${M.length} music segments, ${amb.length} beds, ${steps.length} footstep runs`);
