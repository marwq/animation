#!/usr/bin/env node
// Sound cue sheet generator for SC 10 · THE FAMILY RAID: four spawn pops in the aisle of the cheering server, "Party
// formed" (level-up), the slow-motion formation walk (heavy steps, chat pops, THE FAMILY hit), the hero's orders (CLANG +
// TANK stamp, coins), Granny's sword rain (+ the sword that misses the hot dog: THUNK), the receipt, Mom's formation and the
// noobs' helmets (pop pop pop), the Block King's punches on the pot lid (wind-up, BLOCKED x3), the charge + slash, DarkBlade
// drops in and joins the party, the fist bump, potions x100, the raid plan, ATTACK!, the dome rising (forcefield) and every
// IMMUNE bounce, "FOOLS!", the tilt up to the crystal (target beep), the team falling apart in the hero's head, the slow pan
// to the hot dog in the moonlight, "Son. I've been practicing." (caps typing) and the tilt up the tower -> SC 11.
// Every time comes from the voice timeline exactly like scenes/s10.js: the cut list (C) and the beats (B) come from
// scenes/s09_env.js times10() (built from L(id).a/.b and .word() only); the few derived beats below use the same
// expressions as the scene code. When the voice changes:
//   node audio/cues/gen_sc10.js && python3 audio/validate_cues.py audio/cues/sc10.json
// Output: audio/cues/sc10.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { times10 } = require('../../scenes/s09_env');

const TM = times10(V);
const { START: T0, END, C, B, n: LN } = TM;          // == main.js RANGES for SC 10

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const lerp = (a, c, k) => a + (c - a) * k;
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));     // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(t), name, g, pan, note]); };
// screen x of a battlefield point for a camAt(cx, ., zoom) framing
const sxAt = (x, cx, z) => 960 + (x - cx) * z;

// ================================================================= SFX, shot by shot (same order as scenes/s10.js)
// ---- A1: spawn pops + PARTY FORMED
add(T0, 'teleport', -2, 0, 'white in: into Cube City');
const SPAWN_X = [-210, -420, 10, 220];
B.pops.forEach((tp, i) => { add(tp, 'respawn', -2, P(sxAt(SPAWN_X[i], -100, 1.22)), 'family member spawns'); add(tp + 0.05, 'sparkle', -10, P(sxAt(SPAWN_X[i], -100, 1.22)), 'spawn light'); });
add(B.formed - 0.1, 'level_up', -2, 0, 'PARTY FORMED banner');
add(B.pops[3] + 0.1, 'crowd_cheer', -4, 0, 'the server cheers');
// ---- A2: the slow-motion formation walk
add(C.a2, 'whoosh_long', -10, 0, 'slow motion begins');
for (let i = 0; i < 6; i++) { const a = C.a2 + 0.15 + i * 0.42 + hash(i + 2) * 0.2; add(a, 'chat_pop', -12, i % 2 ? 0.5 : -0.5, 'cheer bubble'); }
add(B.name - 0.1, 'ui_pop', -6, -0.8, 'party frames slide in');
for (let i = 0; i < 4; i++) add(B.name + 0.1 + i * 0.22, 'pop', -14, -0.8, 'party card');
add(B.family - 0.05, 'orch_hit', 0, 0.1, 'THE FAMILY title');
add(B.family + 0.05, 'shine', -6, 0.2, 'gold glint');
// ---- B1/B2: the orders
add(C.b1, 'whoosh', -8, 0.3, 'whip to the hero and Mom');
add(LN[1].word('Mom').t0 - 0.15, 'swish', -8, 0.2, 'the hero points at Mom');
add(B.tank, 'pan_clang', 0, -0.25, 'CLANG! on the pot lid');
add(B.tank + 0.3, 'stamp', -2, -0.5, 'TANK stamp');
add(C.b2, 'whoosh', -8, -0.3, 'whip to Granny');
add(B.gear - 0.2, 'ui_pop', -8, 0.7, 'coin counter');
add(B.gear - 0.05, 'coins', -2, 0.1, 'coins pop out of her money bag');
add(B.gear + 0.05, 'ka_ching', -4, 0.1, 'ka-ching');
// ---- C1: "Swords for everyone!" + the THUNK next to the hot dog
add(C.c1, 'whoosh', -8, 0.3, 'whip to the wide');
add(B.swords - 0.25, 'magic', -4, 0.1, 'Granny raises her cane');
add(B.swords, 'whoosh_down', -6, 0, 'golden swords rain down');
for (let i = 0; i < 9; i++) add(B.swords + 0.75 + i * 0.11, 'metal_clank', -12, r3((hash(i * 3.1) - 0.5) * 1.2), 'a sword lands in a hand');
add(B.swords + 0.9, 'equip', -6, -0.2, "the hero's sword");
add(B.swords + 1.25, 'metal_hit', -2, 0.4, "THUNK! a sword misses the hot dog's hand");
add(B.swords + 1.27, 'boing', -8, 0.4, 'blade wobbles in the floor');
add(B.swords + 0.2, 'money_counter', -8, 0.8, 'coins rolling down');
add(B.swords + 1.0, 'money_counter', -10, 0.8, 'coins rolling down');
// ---- C2: "Put it on my tab!"
add(C.c2, 'whoosh', -8, -0.3, 'whip to Granny');
add(C.c2 + 0.1, 'crowd_cheer', -6, 0, 'the server raises its swords');
add(LN[2].word('Put').t0, 'paper', -4, 0.4, 'the receipt unrolls');
add(B.tab, 'ka_ching', -2, 0.2, 'put it on my tab');
add(B.tab + 0.05, 'shine', -8, 0, 'wink');
add(LN[2].b + 0.3, 'sparkle', -8, 0, 'sparkles over the swords');
// ---- D1/D2: "Kids! Formation! And wear your helmets!"
add(C.d1, 'whoosh', -8, 0.3, 'whip to Mom');
add(B.kids - 0.15, 'swish', -4, -0.4, 'Mom raises her sword');
add(B.kids, 'shine', -6, -0.4, 'sword glow');
add(B.formation - 0.02, 'whoosh', -4, 0.2, 'everyone snaps into rows');
add(B.formation, 'orch_hit', -2, 0.3, 'FORMATION!');
add(B.formation + 0.05, 'jump', -10, 0.3, 'the rows hop');
add(C.d2, 'whoosh', -8, -0.3, 'whip to the three noobs');
const WS = [LN[3].word('wear').t0, LN[3].word('your').t0, B.helmets];
WS.forEach((w, j) => add(w + 0.05, 'pop', -4, [-0.3, 0, 0.3][j], 'helmet plops on'));
add(B.helmets + 0.1, 'bonk', -6, 0.3, 'last helmet bonk');
// ---- E1/E2: the Block King's punch on the pot lid
add(C.e1, 'whoosh', -6, -0.3, 'whip to the wide: the boss winds up');
add(B.block - 0.5, 'monster_growl', -6, -0.4, 'wind-up');
add(B.block - 0.45, 'stone', -8, -0.3, 'stone arm grinding');
add(B.block - 0.15, 'whoosh_down', -4, -0.1, 'the fist comes down');
add(B.block - 0.08, 'zoom_in', -6, 0, 'smash-zoom');
add(B.block, 'metal_hit', 2, -0.1, 'BLOCKED! fist on the pot lid');
add(B.block + 0.01, 'impact', -2, 0, 'shockwave');
add(B.block + 0.05, 'crowd_gasp', -10, 0.3, 'the noobs behind her flinch');
add(B.block + 0.2, 'rock_drop', -8, -0.2, 'stone chips');
add(C.e2, 'whoosh', -8, 0.3, 'cut: the fist keeps pressing');
add(C.e2 + 0.05, 'stone', -10, -0.4, 'stone grinding on the lid');
for (let i = 0; i < 4; i++) add(C.e2 + 0.2 + i * 0.36, 'metal_clank', -14, -0.35, 'sparks on the lid');
add(LN[4].word('behind').t0 + 0.1, 'heart_pop', -6, -0.2, "Mom's sweet look back");
// ---- F1-F4: the montage
const h1 = B.blocked + 0.05, h2 = B.punches + 0.05;
for (const h of [h1, h2]) { add(h - 0.13, 'whoosh_down', -6, -0.2, 'punch'); add(h, 'metal_hit', 0, -0.1, 'BLOCKED!'); add(h + 0.01, 'impact', -4, 0, 'block'); }
add(lerp(h1, h2, 0.55), 'whoosh', -10, -0.3, 'whip to the second angle');
add(C.f2, 'whoosh', -8, -0.3, 'whip to the charge');
add(B.attackSlash - 0.05, 'swish', 0, -0.1, 'the hero slashes');
add(B.attackSlash, 'punch', -2, -0.2, 'hit on the leg');
add(B.attackSlash + 0.03, 'impact', -4, -0.2, '-250 CRIT');
add(B.attackSlash + 0.12, 'monster_growl', -8, -0.5, 'the Block King recoils');
add(C.f3, 'whoosh_down', -4, 0.2, 'DarkBlade drops from the sky');
add(B.dbLand, 'land', 0, 0.2, 'DarkBlade lands');
add(B.dbLand + 0.02, 'boom', -4, 0.2, 'red shockwave');
add(B.joined - 0.1, 'notify', -2, 0, 'joined the party');
add(C.f4, 'whoosh', -12, -0.2, 'the rivals face each other');
add(C.f4 + 0.9, 'cloth', -10, 0.2, 'DarkBlade holds out a fist');
add(LN[6].a - 0.3, 'chat_pop', -8, 0.3, '"Just this once." bubble');
add(LN[6].a, 'typing', -14, 0.3, 'typing');
add(B.bump, 'punch', -4, 0, 'fist bump');
add(B.bump + 0.03, 'shine', -6, 0, 'BUMP!');
// ---- H1/H2: potions
add(C.h1, 'whoosh', -8, 0.3, 'whip to the wide');
for (let i = 0; i < 16; i++) { const a0 = B.potions - 0.2 + i * 0.15; if (i % 2 === 0) add(a0, 'swish', -14, 0.2, 'potion thrown'); add(a0 + 0.45, 'pop', -11, r3(0.1 + (hash(i) - 0.3) * 0.8), 'potion pops: +HP'); }
add(B.hundred, 'magic', -6, 0, 'the party heals');
add(B.hundred + 0.02, 'orch_hit', -6, 0.4, 'x100!');
add(B.hundred + 0.1, 'level_up', -8, -0.8, 'party HP bars refill');
add(C.h2, 'whoosh', -8, -0.3, 'whip to Granny and the hero');
add(B.discount + 0.2, 'stamp', 0, 0.3, 'FAMILY DISCOUNT stamp');
add(B.discount + 0.42, 'pop', -4, 0.5, '5% OFF');
add(B.discount + 0.6, 'cricket', -8, -0.3, "the hero's deadpan");
// ---- I1-I3: the raid plan + ATTACK!
add(C.i1, 'whoosh', -8, 0.3, 'whip: orders');
add(C.i1 + 0.05, 'ui_pop', -4, 0.2, 'RAID PLAN map');
add(B.left - 0.2, 'whoosh', -8, -0.4, 'Noodle -> left flank arrow');
add(B.left, 'pop', -6, -0.5, 'LEFT SIDE sign');
add(C.i2, 'whoosh', -8, -0.3, 'whip: right side');
add(B.right - 0.2, 'whoosh', -8, 0.4, 'DarkBlade -> right flank arrow');
add(B.right, 'pop', -6, 0.5, 'RIGHT SIDE sign');
add(C.i3, 'whoosh', -6, 0.3, 'whip to the wide battlefield');
add(C.i3 + 0.1, 'monster_roar', -6, -0.3, 'the Block King roars');
add(B.attack, 'orch_hit', 2, 0.3, 'ATTACK!');
add(B.attack + 0.05, 'crowd_cheer', -2, 0.2, 'the whole server charges');
// ---- J1: the dome rises, every hit bounces
add(B.dome - 1.5, 'reverse_swell', -8, 0, 'the dome is coming');
add(B.dome, 'forcefield', 2, 0, 'the shield dome rises');
add(B.dome + 0.02, 'impact', -4, 0, 'purple flash');
B.hits.forEach((h, i) => { const pan = i % 2 ? -0.5 : 0.5; add(h, 'metal_hit', -4, pan, 'sword hits the dome: IMMUNE'); add(h + 0.04, 'boing', -10, pan, 'bounced back'); });
// ---- K1/K2: "FOOLS! My shield cannot break!"
add(C.k1, 'whoosh', -8, 0, 'cut to the laughing face');
add(LN[9].a, 'boom', 0, 0, 'FOOLS!');
add(LN[9].a + 0.05, 'thunder', -10, 0, 'rumbling laugh');
for (let i = 0; i < 3; i++) add(LN[9].a + i * 0.18, 'pop', -10, [-0.4, 0.4, 0.3][i], 'HA');
add(C.k2, 'whoosh', -8, 0.3, 'whip to the wide');
const KW = [B.shield, B.cannot, B.break, LN[9].b + 0.35, LN[9].b + 0.75, LN[9].b + 1.1];
KW.forEach((h, i) => { const pan = i % 2 ? -0.5 : 0.5; add(h, 'metal_hit', -6, pan, 'IMMUNE'); add(h + 0.04, 'boing', -12, pan, 'bounced back'); });
add(B.break - 0.1, 'boom', -6, 0, 'the boss thumps his chest');
// ---- L1-L3: the crystal
add(C.l1, 'whoosh', -8, -0.3, 'whip to Noodle');
add(C.l1 + 0.1, 'shine', -4, 0.1, 'Noodle points up, star eyes');
add(C.l2, 'whoosh_long', -2, 0, 'whip-tilt up a hundred floors');
add(B.tower - 0.05, 'beep', -4, 0, 'TARGET: CRYSTAL');
add(B.tower, 'shine', -4, 0, 'the crystal glints');
add(B.tower + 0.1, 'magic', -8, 0, 'crystal hum');
add(C.l3, 'whoosh_down', -6, 0, 'back down to the team');
for (let i = 0; i < 4; i++) add(B.jump - 0.5 + i * 0.1, 'swish', -12, [-0.5, 0.5, -0.3, 0.3][i], 'everyone turns to the hero');
add(B.jump, 'squeak', -6, 0.2, '?');
// ---- M1/M2: "I can't! If I leave, the whole team falls apart!"
add(C.m1, 'whoosh', -8, 0.3, 'whip to the hero under the fist');
add(C.m1 + 0.05, 'stone', -8, 0, 'the fist pressing on his sword');
for (let i = 0; i < 6; i++) add(C.m1 + 0.1 + i * 0.25, 'metal_clank', -14, 0.1, 'sparks');
add(C.m2, 'pop', -4, 0.3, 'thought bubble');
for (let i = 0; i < 4; i++) add(B.falls - 0.15 + 0.25 + i * 0.13, 'thud', -10, P(1000 + i * 150), 'the mini team topples');
add(B.falls - 0.15 + 0.66, 'buzzer_wrong', -6, 0.3, 'red X');
// ---- N1/N2: "Everybody was fighting. Everybody... except one."
add(C.n1, 'whoosh', -8, 0.3, 'whip to the pan across the fight');
for (let i = 0; i < 6; i++) add(C.n1 + 0.2 + i * 0.34, 'metal_hit', -14, i % 2 ? -0.5 : 0.5, 'hits on the dome');
add(C.n2, 'whoosh_long', -10, 0.4, 'the camera drifts away from the fight');
add(B.except, 'wind_gust', -10, 0.3, 'over the lava, moonlight');
add(B.one, 'shine', -8, 0.1, 'the hot dog in the moonbeam');
// ---- O1-O3: "Son. I've been practicing."
add(C.o1, 'whoosh', -8, -0.3, 'whip to the real living room');
add(LN[13].a + 0.2, 'cloth', -10, -0.4, 'the hero turns to Dad');
add(C.o2, 'whoosh', -6, -0.5, 'split: the real Dad');
add(C.o2 + 0.15, 'whoosh', -6, 0.5, 'split: the hot dog');
add(C.o2 + 0.1, 'chat_pop', -8, 0.5, "Dad's caps-lock bubble");
add(LN[13].word("I've").t0, 'typing', -6, 0.5, 'CAPS LOCK typing');
add(C.o3, 'whoosh', -8, 0.3, 'back to the tower');
add(C.o3 + 0.5, 'whoosh_up', -6, 0, 'tilt up the tower toward the moon');
add(END - 2.0, 'riser', -8, 0, 'into SC 11');
sfx.sort((a, b) => a[0] - b[0]);

// ================================================================= music (tiles [T0, END])
const M = [];
const seg_ = (a, b, mood, energy, inn, out) => { if (b - a > 0.05) M.push({ start: r3(a), end: r3(b), mood, energy, in: inn, out }); };
seg_(T0, C.b1, 'anthem', 0.85, 'cut', 'cut');                      // spawn, Party formed, the slow-motion walk
seg_(C.b1, C.e1, 'family', 0.6, 'cut', 'cut');                     // tank / gear / swords on my tab / formation / helmets
seg_(C.e1, C.f4, 'boss', 0.85, 'cut', 'cut');                      // the punches, the charge, DarkBlade drops in
seg_(C.f4, C.g1, 'silence', 0, 'cut', 'cut');                      // the rivals stare
seg_(C.g1, C.h1, 'playful', 0.35, 'cut', 'cut');                   // "Just this once." + bump
seg_(C.h1, C.i3, 'family', 0.6, 'cut', 'cut');                     // potions, family discount, the raid plan
seg_(C.i3, C.k1, 'boss', 1.0, 'cut', 'sting');                     // ATTACK! the dome rises, IMMUNE x6
seg_(C.k1, C.l1, 'boss', 0.7, 'cut', 'cut');                       // FOOLS! My shield cannot break!
seg_(C.l1, C.m1, 'epic', 0.55, 'cut', 'cut');                      // the crystal on top of the tower
seg_(C.m1, C.n1, 'boss', 0.6, 'cut', 'fade');                      // I can't! the team falls apart
seg_(C.n1, C.o1, 'tender', 0.35, 'fade', 'cut');                   // Everybody... except one.
seg_(C.o1, END, 'epic', 0.45, 'swell', 'cut');                     // Son. I've been practicing.

// ================================================================= ambience + footsteps
const amb = [];
const bed = (a, b, name, g) => { if (b - a > 0.05) amb.push({ start: r3(a), end: r3(b), name, gain_db: g }); };
bed(T0, C.o1, 'wind', -14);
bed(T0, C.e1, 'crowd', -10);
bed(C.i3, C.n2, 'crowd', -10);
bed(C.o1, C.o3, 'night', -14);
bed(C.o3, END, 'wind', -14);
const steps = [];
const run = (s0, s1, interval, surface, g, pan) => { s0 = Math.max(T0, s0); s1 = Math.min(END, s1); if (s1 - s0 > 0.1) steps.push({ start: r3(s0), end: r3(s1), interval: r3(interval), surface, gain_db: g, pan }); };
run(C.a2, C.b1, Math.PI / 4.2, 'hard', -8, 0);                      // the slow-motion formation walk
run(C.e2, C.e2 + 1.5, Math.PI / 16, 'hard', -12, 0.3);              // the server runs behind Mom
run(C.f2, B.attackSlash, Math.PI / 16, 'hard', -8, -0.1);           // the hero leads the attack
run(LN[8].word('Everybody').t0, C.j1, Math.PI / 16, 'hard', -6, 0); // the charge
run(C.o3 + 0.25, C.o3 + 1.0, Math.PI / 8, 'hard', -10, 0.1);        // the hot dog steps toward the tower

const out = { scene: 'SC 10', start: r3(T0), end: r3(END), music: M, ambience: amb, footsteps: steps, sfx };
fs.writeFileSync(path.join(__dirname, 'sc10.json'), JSON.stringify(out, null, 1));
console.log(`sc10.json: ${sfx.length} sfx, ${M.length} music segments, ${amb.length} beds, ${steps.length} footstep runs`);
