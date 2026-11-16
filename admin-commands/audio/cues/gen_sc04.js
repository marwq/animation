#!/usr/bin/env node
// Sound cue sheet generator for SC 04 (ПРОВЕРКА КОМАНД: the hero tests the admin commands at home).
// Every time below is computed from the voice timeline exactly like scenes/s04.js does (L(id).a / .b, .word()),
// so when the real voice replaces the provisional timeline, re-run:
//   node audio/cues/gen_sc04.js && python3 audio/validate_cues.py audio/cues/sc04.json
// Output: audio/cues/sc04.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { L } = V;

// ---------------------------------------------------------------- timing (copied from scenes/s04.js)
const lerp = (a, b, k) => a + (b - a) * k;
const A = Array.from({ length: 28 }, (_, i) => L('04.' + i));
const SC = V.scene('SC 04');
const T0 = SC.start, END = V.scene('SC 05').start;    // == main.js RANGES for SC 04
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;

const c01 = T0;
const c02 = w(0, 'you') - 0.1;
const c03 = A[1].a - 0.1;
const c04 = w(1, 'For') - 0.1;
const c05 = A[2].a - 0.12;
const tSpeedE = A[2].b + 0.04;
const c06 = A[2].b + 0.12;
const c07 = w(3, 'four') - 0.1;
const tHundred = w(3, 'hundred') + 0.25;
const c08 = w(3, 'sweetie') - 0.12;
const c09 = w(3, 'Want') - 0.1;
const c10 = A[4].a - 0.1;
const c11 = w(4, 'At') - 0.1;
const c12 = A[5].a - 0.1;
const tUnspeedE = w(5, 'granny', 1);
const c13 = tUnspeedE + 0.06;
const c14 = w(6, 'the') - 0.1;
const c15 = A[7].a - 0.1;
const tSizeE = A[7].b + 0.04;
const c16 = A[7].b + 0.12;
const c17 = w(8, 'Ten', 1) - 0.1;
const tMeow = w(8, 'VERY');
const c18 = A[8].b + 0.15;
const c19 = A[9].a - 0.1;
const tOneE = w1(9, 'ONE');
const c20 = tOneE + 0.1;
const c21 = A[10].a + 0.15;
const c22 = w(10, 'But') - 0.1;
const c23 = A[11].a - 0.1;
const tTpE = A[11].b + 0.04;
const c24 = A[11].b + 0.24;
const c25 = w(12, 'Not') - 0.1;
const c26 = A[13].a - 0.1;
const c27 = A[14].a - 0.12;
const c28 = A[15].a - 0.1;
const tFlyE = A[15].b + 0.04;
const c29 = A[15].b + 0.12;
const c30 = w(16, 'outside') - 0.1;
const c31 = A[17].a - 0.1;
const c32 = w(17, 'Can') - 0.15;
const c33 = A[18].a - 0.1;
const c34 = w(18, 'First') - 0.12;
const tUnflyE = lerp(w(18, 'years'), A[18].b, 0.5);
const c35 = tUnflyE + 0.08;
const tSplash = c35 + 0.3;
const c36 = Math.max(A[19].a + 0.3, tSplash + 0.42);
const tGodE = A[19].b + 0.04;
const c37 = w(20, "won't") - 0.1;
const c39 = A[21].a + 0.15;
const c40 = w(21, 'She') - 0.1;
const c41 = A[22].a - 0.1;
const c42 = w(22, 'Like') - 0.1;
const c43 = A[23].a - 0.1;
const c44 = w(23, 'Fly') - 0.1;
const c45 = w(23, "They're") - 0.1;
const c46 = A[24].a - 0.1;
const c47 = A[25].a - 0.1;
const c48 = w(25, 'Every') - 0.12;
const c49 = w(25, 'Somebody') - 0.1;
const c50 = A[26].a - 0.1;
const c51 = A[27].a - 0.1;
const WHIPS = [[c03, 1], [c10, -1], [c14, 1], [c21, -1], [c26, 1], [c36, -1], [c39, 1], [c44, -1], [c45, 1]];

// typing span of a command bar = K.typeProgress(t, line, from, to): from word t0 to word t1
function typeSpan(line, from = 0, to = null) {
  const ws = line.words;
  const key = (x) => x[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const i0 = typeof from === 'number' ? from : ws.findIndex((x) => key(x) === from.toLowerCase());
  const i1 = to === null ? ws.length - 1 : typeof to === 'number' ? to : ws.findIndex((x, i) => i >= i0 && key(x) === to.toLowerCase());
  return [ws[Math.max(0, i0)][1], ws[Math.max(0, i1)][2]];
}

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));          // pan from screen x
const PW = (wx, cx, z) => P(960 + z * (wx - cx));                        // world x seen by a cam at(cx, _, z)
const sfx = [];
const add = (t, name, g, pan, note) => sfx.push([r3(t), name, g, pan, note]);
// keyboard bursts (~1 s each) while the command's letters appear; a follow-up burst only if it would not
// run far past the ENTER
function typing(t0, t1, g, pan, note) {
  for (let t = t0, k = 0; t < t1 - 0.5 || k === 0; t += 0.9, k++) add(t, 'typing', k ? g - 2 : g, pan, k ? note + ' (cont.)' : note);
}
// ENTER: key click + confirm ding
function enter(t, g, pan, note) {
  add(t, 'click', g, pan, `ENTER: ${note}`);
  add(t + 0.03, 'confirm', g - 1, pan, `confirm: ${note}`);
}

// ================================================================= SFX, shot by shot
// whip-pans (scene router: whip() over tc ± 0.1)
for (const [tc, d] of WHIPS) add(tc - 0.12, 'whoosh', -2, r3(0.3 * d), 'whip-pan');

// ---- 1. morning exterior, the laptop glowing in your window
add(c01 + 0.5, 'sparkle', -12, PW(594, 860, 1.0), 'the laptop glows green in your window');
// ---- 2. you + the laptop: "you start testing"
{
  const tT = w(0, 'testing');
  add(tT - 0.05, 'ui_pop', -4, P(560), "the ';' command bar pops up");
  add(tT, 'shine', -6, PW(1480, 1470, 1.95), 'sparkles on your smug face, laptop raised');
}
// ---- 3. Granny making ONE pancake, very slowly
add(c03 + 0.15, 'sizzle', -12, PW(772, 930, 1.42), 'the lonely pancake sizzles in the pan');
add(c03 + 0.5, 'ui_pop', -6, P(310), "'SPEED: 0.0001x' ticker pops");
add(c03 + 2.1, 'sizzle', -14, PW(772, 930, 1.42), 'still sizzling...');
// ---- 4. "For forty minutes": stopwatch, cobwebs
add(c04, 'pop', -4, P(1560), 'stopwatch pops in');
add(c04 + 0.15, 'snore', -10, PW(905, 820, 3.0), 'sleepy Granny, cobwebs growing on the spatula');
add(c04 + 0.1, 'money_counter', -8, P(1560), 'stopwatch hand spins through 40 minutes');
add(c04 + 0.75, 'money_counter', -10, P(1560), 'stopwatch spinning (cont.)');
add(w1(1, 'minutes') - 0.1, 'alarm_beep', -3, P(1560), "'40 MIN!' bang: the stopwatch beeps");
// ---- 5. ;speed Granny (whisper)
{
  const [a, b] = typeSpan(A[2]);
  typing(a, b, -6, P(500), "typing ';speed Granny' (whisper)");
  add(tSpeedE, 'click', -3, P(500), 'ENTER: ;speed Granny');
  add(tSpeedE + 0.03, 'confirm', -4, P(500), 'confirm: ;speed Granny');
}
// ---- 6. SPEED: the blur, wind, pancakes everywhere
add(c06, 'zoom_in', 0, PW(905, 960, 1.25), 'command hits Granny: shake, she stretches');
add(c06 + 0.2, 'whoosh_long', 2, 0, 'Granny turns into a speeding blur');
add(c06 + 0.28, 'wind_gust', 0, P(520), "'WHOOSH!' bang: wind tears through the kitchen");
add(c06 + 0.6, 'swish', -10, -0.2, 'pancake flies from the pan to the stack');
add(c06 + 0.95, 'swish', -11, 0.1, 'pancake flies');
add(c06 + 1.3, 'swish', -10, -0.1, 'pancake flies');
add(c06 + 1.6, 'swish', -12, 0.2, 'pancake flies');
// ---- 7. the stack climbs to the ceiling
add(c07 + 0.05, 'whoosh', -4, -0.3, "Granny's blur streaks past");
add(c07 + 0.05, 'money_counter', -6, P(300), 'pancake counter rolls up to 400');
add(tHundred - 0.05, 'bonk', 2, P(1300), "'CLONK!' the stack hits the ceiling");
add(tHundred - 0.03, 'thud', -2, P(1300), 'CLONK body: ceiling shakes');
add(tHundred, 'bell', -6, P(300), 'counter hits 400 and turns gold');
// ---- 8. "sweetie!" — Granny close, hair blown back
add(c08 + 0.1, 'sparkle', -10, 0.1, 'sparkles around hyper Granny');
// ---- 9. "Want to go to the store? I'll drive!"
{
  const tW = w(3, 'Want'), tS = w(3, 'store'), tI = w(3, "I'll");
  add(tW, 'coins', -4, PW(1800, 1420, 1.45), "'JINGLE!' Granny's car keys jangle");
  add(tS - 0.07, 'whoosh', -2, PW(1160, 1420, 1.45), 'Granny zips to a new spot');
  add(tI - 0.07, 'whoosh', -2, PW(1290, 1430, 1.5), 'Granny zips right up to you');
  add(tI - 0.02, 'gulp', -6, PW(1560, 1430, 1.5), 'you, scared');
  add(tI + 0.05, 'car_horn', -3, P(760), "'VROOM?' bang");
}
// ---- 10. Granny behind the wheel
add(c10 + 0.15, 'engine', 0, PW(1000, 1140, 1.7), "'VRRRM!' the car revs");
add(c10 + 0.95, 'engine', 2, PW(1000, 1100, 1.9), "'VRRRRRM!!' revs harder, smoke");
// ---- 11. the speedometer: 900 MPH
{
  const tN = w(4, 'nine'), tH = w(4, 'hour');
  add(c11 + 0.05, 'engine', -3, 0, 'engine roaring, needle climbing');
  add(tH - 2.0, 'riser', -2, 0, 'needle races toward 900 (riser peaks at the crack)');
  add(tN + 0.6, 'alarm_beep', -10, P(1500), 'TEMP gauge redlines');
  add(tH - 0.07, 'zoom_in', -2, 0, 'smash-zoom on the speedometer');
  add(tH - 0.03, 'impact', 3, 0, "'900 MPH' smash + flash, big shake");
  add(tH, 'glass', 0, 0, 'the speedometer glass cracks');
  add(tH + 0.05, 'metal_hit', -3, 0, 'the gauge breaks');
}
// ---- 12. ;unspeed Granny! (panic)
{
  const [a, b] = typeSpan(A[5], 0, 1);
  add(c12, 'engine', -2, PW(670, 1120, 1.55), 'the car spins in place, flames and smoke');
  add(c12 + 0.3, 'explosion_small', -10, PW(670, 1120, 1.55), 'exhaust backfire, flames');
  typing(a, b, -1, P(620), "frantic typing ';unspeed Granny'");
  add(c12 + 1.3, 'engine', -4, PW(670, 1150, 1.7), 'engine still screaming');
  add(w1(5, 'granny'), 'click', -1, P(620), 'ENTER: ;unspeed Granny');
  add(w(5, 'unspeed', 1), 'click', 0, P(900), 'ENTER! hammered again');
  add(tUnspeedE - 0.1, 'click', 1, P(450), 'ENTER!! hammered a third time');
  add(tUnspeedE - 0.07, 'confirm', -2, P(620), 'confirm: ;unspeed Granny');
}
// ---- 13. the car stops dead
add(c13 - 0.02, 'skid', 3, P(720), "'SCREEECH!' the car stops dead");
add(c13, 'powerdown', -4, PW(880, 1060, 1.22), 'speed drains out of Granny');
add(c13 + 0.05, 'metal_hit', -2, PW(880, 1060, 1.22), 'car squashes and shakes');
add(c13 + 0.3, 'steam_hiss', -10, PW(880, 1060, 1.22), 'smoke fizzles out');
add(c13 + 0.55, 'pop', -8, P(1000), "'putt...'");
add(c13 + 0.85, 'pop', -10, P(1000), "'...putt'");
// ---- 14. "Next... the cat." — Pancake eating a pancake
add(c14 + 0.1, 'chomp', -5, PW(380, 400, 2.4), "'nom' Pancake eats a pancake");
add(c14 + 0.35, 'chomp', -7, PW(380, 400, 2.4), "'nom'");
// ---- 15. ;size Pancake 10
{
  const [a, b] = typeSpan(A[7], 'Size', 'Pancake');
  const [a2] = typeSpan(A[7], 'ten', 'ten');
  typing(a, b, -3, P(1340), "typing ';size Pancake'");
  add(a2, 'typing', -6, P(1340), "typing the '0'");
  add(w1(7, 'Pancake') + 0.05, 'pop', -5, P(470), "'?' pops over the suspicious cat");
  enter(tSizeE, -2, P(1360), ';size Pancake 10');
}
// ---- 16. he grows (inside the kitchen)
add(c16 + 0.08, 'upgrade', 0, PW(380, 700, 1.3), 'size-up: Pancake starts growing');
add(c16 + 0.15, 'boing', 1, P(520), "'BOING!' he balloons");
add(c16 + 0.45, 'squeak', -4, PW(1720, 900, 0.92), 'you get squashed against the wall');
add(c16 + 0.58, 'rock_drop', 2, P(1350), "'CRUNCH!' his ears crack the ceiling");
add(c16 + 0.6, 'rumble', -2, 0, 'the kitchen shakes');
// ---- 17. exterior: the house rides on his back — MEOW
add(c17 - 0.08, 'sub_drop', 2, PW(760, 860, 0.8), 'reveal: a house-sized cat, the house on his back');
add(c17 + 0.3, 'thud', -2, PW(400, 860, 0.8), 'giant paw plants (shake)');
add(tMeow - 0.05, 'monster_growl', 1, -0.25, "'MEOW!!!' the giant meow (softened growl)");
add(tMeow, 'boom', 3, -0.15, 'MEOW shock rings, the whole street shakes');
add(tMeow + 0.05, 'rumble', -2, 0, 'street rumble');
add(tMeow + 0.12, 'whoosh', -8, 0.3, 'birds scatter');
add(tMeow + 0.25, 'siren', -7, P(1500), "'WEE-OO WEE-OO' car alarm");
// giant paw steps: the walk cycle runs at (c17 + (t - c17) * 0.15) * 5.2; a paw lands at every multiple of PI
{
  const ph = (t) => (c17 + (t - c17) * 0.15) * 5.2;
  for (let t = c17 + 0.6, prev = Math.floor(ph(c17 + 0.6) / Math.PI); t < c20; t += 0.01) {
    const k = Math.floor(ph(t) / Math.PI);
    if (k !== prev) { add(t, 'thud', -5, -0.2, 'giant paw step'); prev = k; }
  }
}
// ---- 18. the yawn: the whole street sways
add(c18 + 0.1, 'rumble', -4, 0, 'the street sways');
add(c18 + 0.15, 'monster_growl', -6, -0.2, "'Y A W N' the giant cat yawns (softened)");
add(c18 + 0.55, 'door_open', -4, P(1450), "'CREEEAK' the house creaks on his back");
// ---- 19. ;size Pancake 1! ONE!
{
  const [a, b] = typeSpan(A[9], 'Size', 'ONE');
  add(c19, 'rumble', -9, 0, 'ground still shaking under the giant cat');
  typing(a, b, -1, P(620), "frantic typing ';size Pancake 1'");
  enter(tOneE, 0, P(620), ';size Pancake 1');
  // the extra ENTER ring (cmd extraE) is only on screen while sh19 lasts
  if (w(9, 'ONE', 1) < c20) add(w(9, 'ONE', 1), 'click', 0, P(640), 'ENTER! hammered again');
}
// ---- 20. poof — normal size; the house drops back into its hole
{
  const tThud = c20 + 0.36;
  add(c20 - 0.04, 'harp_down', -2, PW(1020, 860, 0.86), 'size-down');
  add(c20 + 0.02, 'poof', 2, P(1300), "'POOF!' Pancake shrinks back to normal");
  add(c20 + 0.12, 'whoosh_down', -4, PW(760, 860, 0.86), 'the house drops');
  add(tThud, 'thud', 3, PW(760, 860, 0.86), "'THUD!' the house lands back in its hole");
  add(tThud + 0.01, 'sub_drop', 0, PW(760, 860, 0.86), 'THUD body, big shake + dust');
}
// ---- 21. the couch: "Then you got hungry" — Pancake flops onto your lap
{
  const land = c21 + 0.28, tH = w(10, 'hungry');
  add(c21 + 0.02, 'whoosh_down', -7, PW(1036, 1030, 1.75), 'Pancake drops from above');
  add(land, 'body_fall', -3, PW(1036, 1030, 1.75), "'FLOMP' the cat lands on the laptop");
  add(tH - 0.05, 'monster_growl', -12, PW(1120, 1030, 1.75), "'GRRRUMBLE' your tummy (softened growl)");
}
// ---- 22. but the fridge was SO far away
{
  const tF = w(10, 'fridge'), tSo = w(10, 'SO');
  add(tF - 0.15, 'whoosh_long', -4, 0.3, 'camera swoops down the endless hallway');
  add(tSo - 0.12, 'zoom_in', -2, 0, 'zoom lines on the tiny fridge');
  add(tSo - 0.05, 'pop', -4, 0, "'FRIDGE: 2.4 MI' sign pops");
}
// ---- 23. ;tp me to the fridge (lazy)
{
  const [a, b] = typeSpan(A[11]);
  typing(a, b, -6, P(620), "lazy typing ';tp me to the fridge'");
  enter(tTpE, -4, P(620), ';tp me to the fridge');
  add(tTpE + 0.02, 'teleport', 1, PW(1030, 1030, 2.1), "'BLIP!' you dissolve into pixels");
  add(tTpE + 0.04, 'pixel_wipe', -4, PW(1030, 1030, 2.1), 'pixel dissolve');
  add(tTpE + 0.12, 'thud', -12, PW(1036, 1030, 2.1), 'the laptop drops onto the couch');
}
// ---- 24. INSIDE the fridge
{
  const tDoor = c24 + 0.55;
  add(c24, 'teleport', -4, 0, 'pixels reassemble inside the fridge');
  add(c24 + 0.2, 'pop', -6, 0, 'you pop into shape between the milk and the cake');
  add(tDoor, 'door_close', 2, P(1500), "'SLAM!' the fridge door shuts");
  add(tDoor + 0.02, 'thud', -4, 0.3, 'SLAM shake');
  add(tDoor + 0.08, 'toggle', -6, 0.4, 'the fridge light goes off');
}
// ---- 25. the closed fridge: muffled... then chewing
{
  const chews = [A[12].b + 0.15, A[12].b + 0.45, A[12].b + 0.75];
  add(A[12].b + 0.08, 'swish', -12, 0, 'Pancake peers down from the fridge top');
  chews.forEach((c, i) => add(c, 'chomp', [-5, -4, -1][i], [-0.15, 0.2, 0.05][i], i === 2 ? "'NOM NOM' inside the fridge" : "'nom' inside the fridge"));
}
// ---- 26. "And Dad. Dad was in a very important meeting." (duck pyjamas)
{
  const tImp = w(13, 'important'), tMeet = w(13, 'meeting');
  add(w(13, 'very'), 'ui_pop', -2, P(1380), "'VERY IMPORTANT MEETING' banner pops");
  add(tImp - 0.25, 'swish', -8, 0, 'camera tilts down to the duck pyjamas');
  add(tImp + 0.2, 'squeak', -4, P(1300), "'quack' rubber-duck squeak");
  add(tMeet + 0.05, 'swish', -10, 0, 'camera tilts back up');
}
// ---- 27. split: Dad leaning into the laptop | the call: "You're muted"
add(c27, 'whoosh', -4, 0.35, 'split screen slides in');
for (const t of [A[14].a, w(14, 'Sir'), w(14, 'Sir', 1), w(14, 'can', 1)]) add(t, 'error', -9, P(1320), "\"You're muted\" bubble pops");
// ---- 28. sneaking behind the couch: ;fly Dad (whisper)
{
  const [a, b] = typeSpan(A[15]);
  typing(a, b, -6, P(560), "sneaky typing ';fly Dad'");
  enter(tFlyE, -4, P(560), ';fly Dad');
}
// ---- 29. Dad floats up and out of the window
{
  const s0 = c29 + 0.15, s1 = c30 - 0.05;
  const tOut = s0 + 0.6258 * (s1 - s0);                    // ease.inOut(u) = 0.72: he crosses the window
  add(c29 + 0.03, 'whoosh_up', 0, PW(610, 560, 1.4), 'fly: Dad lifts off his chair');
  add(c29 + 0.15, 'slide_up', -4, P(1250), "'WHOA-OA-OA!' Dad floats up, flailing");
  add(tOut - 0.2, 'whoosh_long', -5, -0.35, 'Dad drifts out through the open window');
}
// ---- 30. split: the confused boss | Dad above the tree
{
  const tTree = w(16, 'tree');
  add(c30 + 0.3, 'chick_peep', -12, 0.55, 'a little bird circles Dad');
  add(tTree - 0.1, 'zoom_in', -3, 0.5, 'camera dives to the treetop');
  add(tTree, 'orch_hit', -5, P(1500), "'TREE?!' bang");
}
// ---- 31. the sky office
{
  const tSky = w(17, 'sky');
  add(c31, 'wind_gust', -8, 0, 'high up in the sky');
  add(lerp(c31, c32, 0.45), 'whoosh', -12, 0, 'a bird flies past');
  add(tSky - 0.05, 'pop', -2, P(1500), "'SKY OFFICE' cloud sign pops");
}
// ---- 32. "Can you hear me now?" — a bird lands on his head
add(c32 + 0.1, 'swish', -10, 0.4, 'the bird swoops in');
add(c32 + 0.65, 'chick_peep', -6, -0.1, "'tweet' the bird perches on Dad's head");
// ---- 33. the boss: "Yes! Perfectly!"
{
  const tP = w(18, 'Perfectly');
  add(tP - 0.07, 'zoom_in', 0, -0.1, 'smash-zoom on the amazed boss');
  add(tP, 'level_up', -3, P(1500), "'PERFECT!' signal bars fill up");
  add(tP + 0.05, 'confetti', -2, 0, 'confetti burst');
}
// ---- 34. split: the boss in tears | you typing ;unfly Dad
{
  const [a, b] = typeSpan(A[18], 'time', 'years');
  add(c34, 'whoosh', -4, 0.35, 'split screen slides in');
  typing(a, b, -6, P(1400), "sneaky typing ';unfly Dad'");
  enter(tUnflyE, -3, P(1660), ';unfly Dad');
}
// ---- 35. ...SPLOOSH: the neighbour's pool
add(c35, 'powerdown', -3, PW(1570, 1420, 1.0), 'unfly: Dad stops floating');
add(c35 + 0.04, 'whoosh_down', 0, PW(1570, 1420, 1.0), 'Dad drops');
add(tSplash, 'big_splash', 3, P(1250), "'SPLOOSH!' into the neighbour's pool");
add(tSplash + 0.22, 'bubbles', -8, PW(1570, 1560, 1.5), 'the laptop rises out of the water');
// ---- 36. ;god me — golden aura
{
  const [, b] = typeSpan(A[19]);
  typing(c36, b, -3, P(560), "typing ';god me'");
  enter(tGodE, -2, P(560), ';god me');
  add(tGodE + 0.02, 'forcefield', -1, PW(1150, 1150, 1.9), 'god mode: gold aura snaps on (flash, shake)');
  add(tGodE + 0.05, 'angel', -2, 0, 'heavenly choir');
  add(tGodE + 0.1, 'sparkle', -6, PW(1150, 1150, 1.6), "rays + 'GOD MODE: ON' badge");
  const t1 = A[20].a + 0.05;
  add(t1 - 0.02, 'swish', -10, 0.4, 'a sticky note flies in');
  add(t1 + 0.14, 'shine', -1, P(1420), "'PING!' the note bounces off the aura");
}
// ---- 37. Mom: ping, ping, ping... and one sticks to HER
{
  const tS = w(20, 'sticky'), tN = w(20, 'notes'), tSt = w(20, 'stick');
  const throws = [c37 + 0.05, tS - 0.1, tN - 0.05, tSt - 0.3];
  throws.forEach((th, i) => add(th - 0.02, 'swish', -11, 0.45, `Mom throws sticky note ${i + 1}`));
  throws.slice(0, 3).forEach((th, i) => add(th + 0.14, 'shine', [-1, -2, -2][i], P([700, 1500, 900][i]), "'PING!' note bounces off"));
  add(throws[3] + 0.14, 'shine', -5, 0, 'the last note bounces...');
  add(tSt + 0.06, 'slap', -2, P(1560), "'thwap' ...and sticks to Mom's forehead");
}
// ---- 39. split: you call Zoe | Zoe picks up
add(c39 + 0.02, 'notify', -2, 0.35, "'RING RING!' Zoe's phone rings");
add(c39 + 0.2, 'powerdown', -12, -0.3, 'the god-mode aura fades');
add(w(21, 'called'), 'tap', -8, 0.4, 'Zoe picks up');
// ---- 40. "She was there in four minutes." — stopwatch, Zoe skids in
{
  const tMin = w(21, 'minutes');
  add(c40, 'pop', -4, P(330), 'stopwatch pops in');
  add(c40 + 0.15, 'money_counter', -8, P(330), 'stopwatch spins to 4:00');
  add(c40 + 1.0, 'money_counter', -10, P(330), 'stopwatch spinning (cont.)');
  add(tMin - 0.32, 'whoosh', -3, 0.55, 'Zoe sprints in from the right');
  add(tMin - 0.05, 'skid', 1, P(1450), "'SKRRRT!' Zoe skids to a stop");
}
// ---- 41. Zoe, stunned, lit green by the screen
add(c41 + 0.05, 'magic', -12, 0, 'floating admin code glows on her face');
// ---- 42. "Like, a REAL one."
{
  const tR = w(22, 'REAL', 1);
  add(tR - 0.07, 'zoom_in', -1, 0, 'smash-zoom on Zoe');
  add(tR, 'boom', -1, -0.05, "'REAL' flash + shake");
  add(w(22, 'For') - 0.08, 'swish', -9, 0, 'camera pulls back out');
}
// ---- 43. Zoe explains
add(w(23, 'anything'), 'orch_hit', -4, P(1450), "'ANYTHING!' bang");
// ---- 44. Fly. Teleport. Ban people. (cards pop)
{
  const tF = w(23, 'Fly'), tT = w(23, 'Teleport'), tB = w(23, 'Ban');
  add(tF - 0.05, 'pop', -2, P(400), "'FLY' card pops");
  add(tF + 0.05, 'whoosh_up', -9, P(400), 'fly icon');
  add(tT - 0.05, 'pop', -2, P(960), "'TELEPORT' card pops");
  add(tT + 0.05, 'teleport', -9, P(960), 'teleport icon');
  add(tB - 0.05, 'pop', -2, P(1520), "'BAN' card pops");
  add(tB + 0.12, 'stamp', -6, P(1520), 'ban hammer swings down');
}
// ---- 45. "the boss of the server" — a crown drops onto the server
{
  const tBoss = w(23, 'boss');
  add(tBoss - 0.25, 'whoosh_down', -6, PW(1260, 1080, 1.1), 'a golden crown drops');
  add(tBoss + 0.05, 'metal_clank', 0, PW(1260, 1080, 1.1), 'the crown lands on the server rack');
  add(tBoss + 0.1, 'shine', -3, P(1600), "'BOSS' bang, sparkles");
  add(tBoss + 0.2, 'thud', -8, PW(1260, 1080, 1.1), 'rack shake');
}
// ---- 46. "So I'm the boss... of real life?"
{
  const tReal = w(24, 'real'), tLife = w(24, 'life');
  add(tReal - 0.15, 'harp_up', -4, 0, 'daydream: gold aura returns');
  add(tReal + 0.15, 'shine', -4, PW(1150, 1150, 1.95), 'an ADMIN crown pops over your head');
  add(tLife - 0.02, 'zoom_in', -2, 0, "smash-zoom on 'real life?'");
}
// ---- 47. Zoe: "Admin panels have logs."
{
  const tLogs = w(25, 'logs');
  add(tLogs - 0.08, 'zoom_in', -2, 0.2, 'smash-zoom on Zoe');
  add(tLogs + 0.05, 'boom', 0, P(1450), "'LOGS.' bang");
}
// ---- 48. every command gets saved: the LOG screen
{
  const tSaved = w(25, 'saved'), tGets = w(25, 'gets');
  for (let i = 0; i < 8; i++) add(c48 + 0.05 + (i * (tGets - c48)) / 8, 'beep', -13, -0.25, `log row ${i + 1} prints`);
  for (let i = 0; i < 8; i++) add(tSaved + i * 0.06, 'stamp', i % 2 ? -4 : -2, P(1560), `'SAVED' stamp ${i + 1}`);
}
// ---- 49. "Somebody, somewhere... can see what you type." — the webcam LED
{
  const tSee = w(25, 'see'), tType = w(25, 'type');
  add(tSee - 0.05 - 1.5, 'reverse_swell', -6, 0, 'swell into the webcam light');
  add(tSee - 0.05, 'beep', -3, PW(1230, 985, 1.15), 'the webcam LED switches on');
  add(tType - 0.12, 'zoom_in', -4, 0.2, 'push in on the green LED');
  add(tType, 'heartbeat', -6, 0, 'someone is watching');
}
// ---- 50. "Relax. What could possibly go wrong?"
add(c50 + 0.05, 'cloth', -8, PW(1190, 1000, 1.35), 'you stretch out, arms behind your head');
add(c50 + 0.5, 'typing', -14, 0, "Pancake lying on the keyboard: 'jjjjjjj'");
// ---- 51. "Famous last words." — dusk, lightning
{
  const tW = w(27, 'words');
  add(c51, 'wind_gust', -8, 0, 'storm clouds roll over the house');
  add(tW, 'thunder', 3, 0.3, 'lightning flash + shake');
}

sfx.sort((p, q) => p[0] - q[0]);

// ================================================================= MUSIC (tiles [T0, END])
const tThud = c20 + 0.36, tDoor = c24 + 0.55, tMin = w(21, 'minutes'), tW = w(27, 'words');
const M = (start, end, mood, energy, inn, out) => ({ start: r3(start), end: r3(end), mood, energy, in: inn, out });
const music = [
  M(T0, c03, 'hook', 0.5, 'fade', 'cut'),             // the next morning: you start testing
  M(c03, c06, 'playful', 0.4, 'cut', 'cut'),          // Granny's 40-minute pancake, ;speed Granny (whisper)
  M(c06, c13, 'chaos', 0.85, 'cut', 'scratch'),       // the speed blur, 400 pancakes, the car, 900 MPH, UN-SPEED! -> SCREEECH
  M(c13, c14, 'silence', 0, 'cut', 'cut'),            // putt... putt...
  M(c14, tSizeE, 'hook', 0.5, 'cut', 'sting'),        // Next... the cat. ;size Pancake 10 -> button on ENTER
  M(tSizeE, c17, 'silence', 0, 'cut', 'cut'),         // comic drop-out: BOING, CRUNCH
  M(c17, c18, 'chaos', 0.9, 'cut', 'tapestop'),       // the giant cat + the house, MEOW -> winds down into the yawn
  M(c18, c19, 'silence', 0, 'cut', 'cut'),            // the yawn: the street sways
  M(c19, tThud, 'chaos', 0.85, 'cut', 'sting'),       // ;size Pancake ONE! -> POOF, button on the THUD
  M(tThud, tDoor, 'playful', 0.45, 'fade', 'cut'),    // hungry, the far fridge, ;tp me -> cut on the SLAM
  M(tDoor, c26, 'silence', 0, 'cut', 'cut'),          // dark fridge: "Not IN the fridge", nom nom
  M(c26, tFlyE, 'heist', 0.45, 'cut', 'cut'),         // Dad's very important meeting, sneaking ;fly Dad
  M(tFlyE, tSplash, 'playful', 0.55, 'cut', 'sting'), // Dad floats out, sky office, "Perfectly!", ;unfly -> SPLOOSH
  M(tSplash, c36, 'silence', 0, 'cut', 'cut'),        // bubbles
  M(c36, c39, 'power', 0.65, 'cut', 'cut'),           // ;god me, sticky notes ping off
  M(c39, tMin, 'hook', 0.55, 'cut', 'sting'),         // calling Zoe -> button on SKRRRT
  M(tMin, c43, 'wonder', 0.4, 'swell', 'cut'),        // "That's a real admin panel."
  M(c43, c46, 'explainer', 0.55, 'cut', 'cut'),       // in games admins can do anything (cards pop)
  M(c46, c47, 'hook', 0.5, 'cut', 'scratch'),         // "So I'm the boss... of real life?" -> "Listen to me."
  M(c47, c50, 'mystic', 0.45, 'cut', 'cut'),          // logs, SAVED stamps, the webcam LED
  M(c50, c51, 'playful', 0.4, 'cut', 'tapestop'),     // "Relax. What could possibly go wrong?"
  M(c51, tW, 'mystic', 0.5, 'cut', 'sting'),          // "Famous last words." -> sting on "words" + lightning
  M(tW, END, 'silence', 0, 'cut', 'cut'),             // thunder tail
];

// ================================================================= AMBIENCE (beds per location)
const B = (start, end, name, gain_db) => ({ start: r3(start), end: r3(end), name, gain_db });
const ambience = [
  B(T0, c02, 'birds', -8),                 // morning exterior
  B(c02, c10, 'kitchen', -10),             // kitchen: Granny, the speed blur
  B(c06 + 0.22, c09, 'wind', -10),         // the blur's wind in the kitchen
  B(c10, c14, 'birds', -8),                // outside: Granny's car
  B(c10, c14, 'town', -14),
  B(c14, c17, 'kitchen', -10),             // Pancake in the kitchen
  B(c17, c21, 'town', -12),                // the street with the giant cat
  B(c17, c21, 'birds', -10),
  B(c21, c24, 'room', -10),                // living room couch
  B(c24, c26, 'kitchen', -6),              // inside / outside the fridge (hum)
  B(c26, c30, 'room', -10),                // Dad's meeting
  B(c29, c30, 'birds', -16),               // the window is open
  B(c30, c33, 'birds', -10),               // Dad above the tree, sky office
  B(c30, c33, 'wind', -14),
  B(c33, c35, 'room', -12),                // the call, you in the living room
  B(c35, c36, 'birds', -8),                // the neighbour's pool
  B(c36, c44, 'room', -10),                // god mode, Mom, Zoe arrives, the couch
  B(c45, c46, 'vault_hum', -14),           // the server room
  B(c46, c51, 'room', -11),                // logs, webcam, "what could go wrong?"
  B(c51, END, 'night', -12),               // dusk, storm coming
  B(c51, END, 'wind', -14),
];

// ================================================================= FOOTSTEPS
const footsteps = [];
// Granny's speed blur: AC.run(t * 40) -> a step every PI/40 s (0.0785; the mixer floor is 0.08)
footsteps.push({ start: r3(c06 + 0.22), end: r3(c08), interval: 0.08, surface: 'wood', gain_db: -12, pan: 0 });
// you tapping your foot while waiting: legR = max(0, sin(14 t)) -> a tap lands at every (2k+1) PI / 14
{
  const tMin = w(21, 'minutes');
  const k0 = Math.ceil(((c40 + 0.1) * 14 / Math.PI - 1) / 2);
  const first = ((2 * k0 + 1) * Math.PI) / 14;
  if (first < tMin - 0.3) footsteps.push({ start: r3(first), end: r3(tMin - 0.3), interval: r3((2 * Math.PI) / 14), surface: 'wood', gain_db: -14, pan: PW(1180, 1420, 1.3) });
  // Zoe sprints in: AC.run(t * 30) -> a step every PI/30 s
  footsteps.push({ start: r3(tMin - 0.3), end: r3(tMin), interval: r3(Math.PI / 30), surface: 'wood', gain_db: -6, pan: 0.45 });
}

// ================================================================= write
const out = { scene: 'SC 04', start: r3(T0), end: r3(END), music, ambience, footsteps, sfx };
const J = (x) => JSON.stringify(x);
const txt = '{\n' +
  `  "scene": ${J(out.scene)},\n  "start": ${out.start},\n  "end": ${out.end},\n` +
  `  "music": [\n${music.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "ambience": [\n${ambience.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "footsteps": [\n${footsteps.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "sfx": [\n${sfx.map((m) => '    ' + J(m)).join(',\n')}\n  ]\n}\n`;
const dst = path.join(__dirname, 'sc04.json');
fs.writeFileSync(dst, txt);
console.log(`${dst}: ${music.length} music segments, ${ambience.length} beds, ${footsteps.length} footstep runs, ${sfx.length} sfx`);
