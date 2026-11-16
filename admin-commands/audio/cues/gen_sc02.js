#!/usr/bin/env node
// Sound cue sheet generator for SC 02 (ОБЫЧНЫЙ НУБ: the normal-life montage — pigeon, gym, obby, Dad, Mom, Granny,
// Pancake, Zoe, Brick, the dream — "Until the garage sale.").
// Every time below is computed from the voice timeline exactly like scenes/s02.js does (L(id).a / .b, .word()),
// so when the real voice replaces the provisional timeline, re-run:
//   node audio/cues/gen_sc02.js && python3 audio/validate_cues.py audio/cues/sc02.json
// Output: audio/cues/sc02.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { SPOTS } = require('../../scenes/sets');
const { L } = V;

// ---------------------------------------------------------------- timing (copied from scenes/s02.js)
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const START = V.scene('SC 02').start, END = V.scene('SC 03').start;   // == main.js RANGES for SC 02
const A = Array.from({ length: 20 }, (_, i) => L('02a.' + i));
const B = L('02b.0');
const w = (i, word, n = 0) => A[i].word(word, n).t0;

const c01 = START;
const c02 = w(0, 'Totally') - 0.1;
const c03 = w(0, 'Maybe') - 0.1;
const c04 = A[1].a - 0.05;
const c05 = w(1, 'Every') - 0.08;
const c06 = w(1, 'Even') - 0.08;
const c07 = A[2].a - 0.05;
const c08 = w(2, 'you') - 0.05;
const c09 = w(2, 'Even') - 0.08;
const c10 = A[3].a - 0.05;
const c11 = Math.min(A[3].b + 0.35, A[4].a - 0.4);
const c12 = w(4, 'The') - 0.08;
const c13 = w(4, 'It', 1) - 0.08;
const c14 = A[5].a - 0.05;
const c15 = w(5, 'Mostly') - 0.08;
const c16 = A[6].a - 0.05;
const c17 = w(6, 'How') - 0.08;
const c18 = w(6, 'NOW', 2) - 0.12;
const c19 = A[7].a - 0.05;
const c20 = w(7, 'She') - 0.08;
const c21 = A[8].a - 0.05;
const c22 = w(8, 'I') - 0.08;
const c23 = A[9].a - 0.05;
const c24 = w(9, 'and') - 0.08;
const c25 = w(9, 'at') - 0.08;
const c26 = A[10].a - 0.05;
const c27 = A[11].a - 0.05;
const c28 = w(11, 'He') - 0.08;
const c29 = w(11, 'Both') - 0.08;
const c30 = A[12].a - 0.05;
const c31 = w(12, 'She') - 0.08;
const c32 = w(12, 'and') - 0.08;
const c33 = A[13].a - 0.05;
const c34 = w(13, 'On') - 0.08;
const c35 = w(13, 'Facing') - 0.08;
const c36 = A[14].a - 0.05;
const c37 = A[15].a - 0.05;
const c38 = w(15, 'Brick') - 0.12;
const c39 = A[16].a - 0.05;
const c40 = w(16, 'Also') - 0.08;
const c41 = w(16, 'Also', 1) - 0.08;
const c42 = A[17].a - 0.05;
const c43 = w(17, 'Okay') - 0.08;
const c44 = A[18].a - 0.05;
const c45 = A[19].a - 0.05;
const c46 = w(19, 'Someone', 1) - 0.08;
const c47 = w(19, 'Someone', 2) - 0.08;
const c48 = w(19, 'Someone', 3) - 0.08;
const c49 = B.a - 0.05;
const c50 = B.word('Until').t0 - 0.08;
const tGarage = B.word('garage').t0 - 0.06;
const SHOT_CUTS = [c02, c03, c04, c05, c06, c07, c08, c09, c10, c11, c12, c13, c14, c15, c16, c17, c18, c19, c20, c21, c22, c23, c24, c25,
  c26, c27, c28, c29, c30, c31, c32, c33, c34, c35, c36, c37, c38, c39, c40, c41, c42, c43, c44, c45, c46, c47, c48, c49, c50];
const CUTS = SHOT_CUTS.filter((c) => ![c08, c12, c46, c47, c48, c49].includes(c));   // X.cutFlash at these
const WHIPS = [c04, c07, c14, c19, c23, c27, c30, c45];                                // X.whip at these
const DREAM = [c46, c47, c48, c49];                                                    // soft pink flashes
// beats used by several shots
const tf0 = w(0, 'is'), tf1 = w(0, 'Twelve') - 0.08;                // "This is you" freeze frame
const tGrab = w(0, 'normal', 1);                                    // the pigeon YOINK
const tLast = w(1, 'last');
const tRun = c08 + 0.08, tJ = w(2, 'first'), tS = Math.max(tJ + 0.42, w(2, 'jump') + 0.1);   // obby run / jump / lava
const tP = c49 + 0.25;                                              // the dream bubble pops

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));          // pan from screen x
const PW = (wx, cx, z) => P(960 + z * (wx - cx));                        // world x seen by camAt(cx, _, z)
const sfx = [];
const add = (t, name, g, pan, note) => sfx.push([r3(t), name, g, pan, note]);
function typing(t0, t1, g, pan, note) {
  for (let t = t0, k = 0; t < t1 - 0.5 || k === 0; t += 0.9, k++) add(t, 'typing', k ? g - 2 : g, pan, k ? note + ' (cont.)' : note);
}
// playerCard(user, ..., k = seg(t, tw - .1, tw + .25), out = seg(t, cOut - .3, cOut)) at top-left
function card(tw, cOut, who) {
  add(tw - 0.08, 'ui_pop', -4, P(330), `player card: ${who}`);
  if (cOut - 0.3 - tw > 0.8) add(cOut - 0.3, 'ui_close', -11, P(330), `player card out: ${who}`);
}

// ================================================================= SFX, shot by shot
// ---- 1. street: "This is you." (PLAY after the rewind, freeze frame)
add(c01 + 0.03, 'beep', -10, P(330), "'▶ PLAY · MONDAY 7:45 AM' (from white)");
add(tf0, 'camera_flash', -5, 0, "freeze frame: 'This is you.'");
add(tf0 + 0.04, 'pop', -6, P(1410), "'THIS IS YOU' call-out");
add(tf1, 'swish', -12, 0, 'unfreeze: walking on');
add(w(0, 'Twelve'), 'pop', -6, P(1380), "'12 YEARS OLD' tag");
// ---- 2. "Totally normal." — bite, thumbs up, NORMAL stamp
add(w(0, 'Totally') + 0.05, 'chomp', -5, P(1080), 'big bite of the sandwich');
add(w(0, 'normal') - 0.02, 'swish', -9, P(860), 'thumbs up');
add(w(0, 'normal') + 0.03, 'stamp', -2, P(1440), "'NORMAL' stamp");
// ---- 3. "...too normal." — the pigeon YOINK
add(w(0, 'too'), 'whoosh', -6, P(1440), 'the pigeon launches');
add(tGrab - 0.03, 'slide_up', 0, P(1100), "YOINK! the pigeon snatches the sandwich (shake)");
add(tGrab, 'chicken', -10, P(1100), "pigeon 'bawk'");
add(tGrab + 0.12, 'whoosh', -4, -0.45, 'the pigeon flies off up-left with it');
add(tGrab + 0.27, 'squeak', -8, 0, 'you, shocked');
// ---- 4. GYM — picked last
{
  for (let j = 0; j < 6; j++) {
    const tp = lerp(c04 + 0.15, tLast - 0.25, j / 5);
    add(tp, 'jump', -12, j % 2 ? 0.35 : -0.35, `kid #${j + 1} picked: jumps and runs to the captain`);
  }
  add(tLast, 'pop', -4, P(1420), "'PICKED LAST' tag");
}
// ---- 5. "Every time." — MON / TUE / WED panels
{
  const tT = w(1, 'time');
  [[c05, 350, 'MON'], [tT - 0.05, 960, 'TUE'], [tT + 0.3, 1570, 'WED']].forEach(([t, x, d]) => add(t, 'stamp', -6, P(x), `panel slams in: ${d}`));
}
// ---- 6. "Even after the kid with the broken arm." — LAST
{
  const tKid = w(1, 'kid'), tArm = w(1, 'arm');
  add(tKid + 0.02, 'jump', -9, PW(SPOTS.gym.pickLine[6].x, 960, 1.5), 'the kid with the cast is picked: jumps for joy');
  add(tArm - 0.03, 'zoom_in', -2, 0, 'smash-zoom on you, alone');
  add(tArm + 0.05, 'stamp', 1, P(1560), "'LAST' stamp (shake)");
}
// ---- 7. the desk: "In every obby..."
add(c07 + 0.12, 'typing', -11, PW(1062, 980, 1.25), 'gaming at the desk');
add(w(2, 'every'), 'pop', -6, P(1460), "'EVERY OBBY' tag");
add(c08 - 0.22, 'zoom_in', -4, 0, 'the camera dives into the monitor');
// ---- 8. the obby: run, jump, lava
add(tJ, 'jump_game', -2, PW(628, 700, 1.4), 'avatar jumps');
add(tJ + 0.22, 'slide_down', -6, PW(690, 700, 1.4), '...and falls short');
add(tS, 'splash', -2, 0, 'splash into the lava (shake)');
add(tS + 0.02, 'sizzle', -6, 0, 'lava sizzle');
add(tS + 0.03, 'thud', -6, 0, "'OOF!'");
add(tS + 0.05, 'beep', -11, 0, 'death counter 4999');
add(tS + 0.12, 'error', -3, 0, "'YOU DIED' drops in");
// ---- 9. "Easy Obby for Babies" title
{
  const ws = [[w(2, 'Easy'), 'EASY'], [w(2, 'Obby', 1), 'OBBY'], [w(2, 'for'), 'FOR']];
  for (const [t, x] of ws) add(t - 0.04, 'pop', -6, 0, `title word: ${x}`);
  add(w(2, 'Babies') - 0.04, 'pop', -5, 0, 'title word: BABIES');
  add(w(2, 'Babies'), 'chick_peep', -8, 0.15, 'baby peep');
}
// ---- 10. "That lava came out of NOWHERE!"
{
  const tN = A[3].word('NOWHERE').t0;
  add(c10 + 0.02, 'jump', -8, 0, 'you spring up into frame, furious');
  add(tN - 0.03, 'zoom_in', -2, 0, "smash-zoom on 'NOWHERE!' (shake)");
  add(tN + 0.05, 'steam_hiss', -4, 0, 'steam out of your ears');
}
// ---- 11–13. the avatar sinks slowly, thumbs up; the whole floor was lava; "It said so in the name."
add(c11, 'bubbles', -8, 0, 'the avatar sinking in the lava');
add(c11 + 0.15, 'shine', -8, P(1010), 'thumbs up');
add(c11 + 0.4, 'sizzle', -11, 0, 'lava sizzle');
add(c12 + 0.02, 'whoosh_long', -4, 0, 'pull back: the whole floor is lava');
add(w(4, 'floor', 1) - 0.02, 'pop', -6, 0, "'THE FLOOR' tag");
add(w(4, 'lava') - 0.02, 'pop', -4, P(1350), "'= LAVA'");
add(w(4, 'lava'), 'sizzle', -11, P(1350), 'lava');
add(w(4, 'name') - 0.12, 'zoom_in', -6, 0, 'push in on the title');
add(w(4, 'name') - 0.05, 'swish', -7, 0, "red marker circles 'LAVA' in the name");
// ---- 14. DAD: works from home
{
  const tD = w(5, 'Dad'), tW = w(5, 'works'), tH = w(5, 'home', 1);
  card(tD, c15, 'DAD');
  add(tW, 'pop', -7, P(1460), "'WORK' tag (shirt and tie)");
  add(tH, 'pop', -7, P(1490), "'HOME' tag");
  add(tH + 0.1, 'slide_down', -5, 0, 'tilt down: pajama pants with ducks');
}
// ---- 15. Dad taps the headset: "...if people can hear him."
add(w(5, 'hear') + 0.2, 'tap', -6, PW(SPOTS.livingRoom.dadChair.x + 60, 560, 1.55), 'taps the headset');
// ---- 16. the video call: "Can you hear me now?" (muted)
add(c16 + 0.02, 'ui_pop', -9, 0, 'video call window');
add(w(6, 'now'), 'error', -6, 0, 'MUTED icon pops');
// ---- 17. "How about now?" — tapping the headset
for (let n = 0; ; n++) {
  const t = c17 + (Math.PI / 2 + 2 * Math.PI * n) / 9;                 // tap = max(0, sin((t - c17) * 9)) peaks
  if (t >= c18 - 0.05) break;
  add(t, 'tap', n === 1 ? -4 : -7, 0, 'taps the headset again');
}
// ---- 18. "NOW?!" — the whole house shakes, the birds scatter
{
  const tN = w(6, 'NOW', 2);
  add(tN, 'boom', 2, 0, "'NOW?!' the house shakes (shockwave rings)");
  add(tN + 0.12, 'whoosh', -5, PW(250, 760, 1.05), 'the birds scatter off the roof');
}
// ---- 19. MOM
{
  const tM = w(7, 'Mom');
  add(c19 + 0.25, 'skid', -6, P(1250), 'Mom slides into frame');
  card(tM, c20, 'MOM');
}
// ---- 20. Mom zips round the kitchen slapping notes
{
  const spots = [500, 1480, 1000], Ls = (c21 - c20) / spots.length;
  spots.forEach((x, i) => {
    const s0 = c20 + i * Ls, prev = i ? spots[i - 1] : 1000;
    add(s0, 'whoosh', -7, PW((x + prev) / 2, 1000, 1.05), 'Mom zips (speed lines)');
    add(s0 + 0.55 * Ls, 'slap', -4, PW(x + 120, 1000, 1.05), "'SLAP!' a sticky note");
    add(s0 + 0.55 * Ls + 0.02, 'paper', -10, PW(x + 120, 1000, 1.05), 'sticky note');
  });
}
// ---- 21. "Room. Clean. Today." — three notes on your forehead
for (const word of ['Room', 'Clean', 'Today']) {
  const t = w(8, word);
  add(t, 'slap', -3, PW(1150, 980, 1.6), `note slapped on your forehead: ${word.toUpperCase()} (shake)`);
  add(t + 0.02, 'paper', -10, PW(1150, 980, 1.6), 'sticky note');
}
// ---- 22. "...so it's official." — KA-CHUNK
add(w(8, 'sticky') + 0.05, 'whoosh', -9, -0.3, 'a big rubber stamp comes in from the left');
add(w(8, 'official'), 'stamp', 3, 0, "'KA-CHUNK!' OFFICIAL stamped on your forehead");
// ---- 23. GRANNY, 91
{
  const tG = w(9, 'Granny');
  add(c23 + 0.2, 'engine', -13, 0, "Granny's tiny car putters along");
  card(tG, c24, 'GRANNY');
  add(w(9, 'ninety-one'), 'pop', -4, P(1500), "'91!' tag");
}
// ---- 24. "...she still drives to the store"
add(c24 + 0.4, 'engine', -15, 0, 'putt-putt...');
add(w(9, 'store'), 'pop', -6, P(1500), "'THE STORE' tag");
// ---- 25. the speedometer: 4 mph
add(w(9, 'four'), 'squeak', -10, 0, 'the needle creeps up to 4');
add(w(9, 'hour'), 'pop', -4, P(1520), "'4 MPH' tag");
// ---- 26. "...enjoy... the journey" — overtaken by a snail
{
  const tJn = A[10].word('journey').t0, tSw = A[10].word('sweetie').t0;
  add(tJn - 0.35, 'whoosh_long', -2, 0, "the snail zooms past ('ZOOM!')");
  add(tSw - 0.2, 'swish', -10, 0.1, 'Granny waves');
}
// ---- 27. PANCAKE
{
  const tPk = w(11, 'Pancake'), cb = SPOTS.livingRoom.catBed;
  add(c27 + 0.2, 'snore', -8, PW(cb.x, 1300, 1.3), 'Pancake snoring in his bed');
  card(tPk, c28, 'PANCAKE');
  add(w(11, 'laziest'), 'achievement', -4, P(1500), "'#1 LAZIEST' rosette");
  add(w(11, 'world'), 'snore', -10, 0, 'still snoring');
}
// ---- 28. "He moves twice a day." — MOVE #1 / MOVE #2
add(w(11, 'twice') - 0.05, 'pop', -5, P(510), "'MOVE #1' panel");
add(w(11, 'day') - 0.05, 'pop', -5, P(1410), "'MOVE #2' panel");
// ---- 29. "Both times to sit on your keyboard." — FLOP
{
  const tSit = w(11, 'sit'), land = tSit + 0.18;
  add(c29 + 0.05, 'typing', -9, 0, 'you, typing homework');
  add(tSit - 0.3, 'whoosh_down', -6, 0, 'Pancake drops from above');
  add(land, 'thud', 0, 0, "'FLOP!' on the keyboard (shake)");
  add(land + 0.02, 'typing', -5, 0, 'keys mashed by the cat');
  add(land + 0.6, 'typing', -11, 0, "'kkkkkkkk' fills the screen");
}
// ---- 30. ZOE: best friend
{
  card(w(12, 'Zoe'), c31, 'ZOE');
  add(w(12, 'best'), 'pop', -6, P(1440), "'BEST FRIEND' tag");
}
// ---- 31. "She knows everything about computers..."
typing(c31 + 0.05, c32, -6, PW(900, 1060, 1.6), 'Zoe types at hacker speed');
add(w(12, 'computers'), 'sparkle', -8, PW(904, 1060, 1.6), 'sparkle off her glasses');
// ---- 32. "...and she's not afraid to tell you."
add(c32 + 0.1, 'click', -8, PW(900, 1100, 1.5), 'Zoe snaps the laptop shut');
add(w(12, 'tell') - 0.1, 'pop', -6, P(760), "'ACTUALLY...' tag");
add(w(12, 'tell') + 0.1, 'gulp', -8, PW(1320, 1100, 1.5), 'you shrink');
// ---- 33–35. the password note, the window, the pigeon spy
add(c34 - 0.15, 'zoom_in', -8, 0, 'push in on the monitor');
add(w(13, 'monitor'), 'swish', -6, 0, 'red marker circles the password note');
add(c35 + 0.12, 'pop', -8, PW(330, 560, 1.45), 'the pigeon pops up in the window');
add(c35 + 0.4, 'squeak', -8, PW(390, 560, 1.45), "'!!'");
add(w(13, 'window') - 0.1, 'shine', -5, PW(390, 560, 1.45), 'the pigeon puts on spy sunglasses (glint)');
add(w(13, 'window'), 'swish', -10, 0, 'dashed line: pigeon -> password');
// ---- 36. "It's a SECRET sticky note!"
add(c36 + 0.05, 'paper', -6, PW(1575, 1360, 1.75), "you hold up the 'TOP SECRET' note");
add(A[14].word('SECRET').t0 - 0.03, 'zoom_in', -3, 0, "smash-zoom on 'SECRET' (shake)");
// ---- 37. "And then..." — a huge shadow falls
{
  const tT = w(15, 'then'), tB = w(15, "there's");
  add(c37 - 0.05, 'record_scratch', -2, 0, 'the music scratches: a shadow falls over the table');
  add(c37 + 0.05, 'whoosh_long', -10, 0.35, 'the shadow sweeps in from the right');
  add(tT, 'thud', -4, 0.45, 'heavy footstep (shake)');
  add(tB, 'thud', -2, 0.45, 'heavier footstep (shake)');
}
// ---- 38. "...there's Brick." — knuckles crack
{
  const tB = w(15, 'Brick');
  add(c38, 'dramatic', -2, 0, "Brick's reveal: dun dun DUNN");
  add(tB, 'egg_crack', -3, P(1300), "'CRACK!' knuckles");
  add(tB + 0.45, 'egg_crack', -5, P(1300), 'knuckles again');
  card(tB + 0.05, c39, 'BRICK');
  add(tB + 0.1, 'alarm_beep', -13, P(450), "'⚠ HUGE' badge");
}
// ---- 39. "Lunch money." — the coins hop over
{
  const tM = w(16, 'money');
  for (let i = 0; i < 2; i++) add(tM - 0.2 + (i * 0.15 + 0.6) * 0.6, 'coin', -8, PW(1150, 1000, 1.3), 'a coin lands in Brick\'s palm');
  add(tM + 0.35, 'coins', -3, PW(1200, 1000, 1.3), "'CLINK!'");
}
// ---- 40. "Also your cookie." — the giant hand
{
  const tC = w(16, 'cookie');
  add(tC - 0.35, 'whoosh_down', -6, P(1400), "Brick's giant hand reaches down");
  add(tC, 'tap', -5, P(1250), 'pinches cookie #1');
  add(tC + 0.03, 'pop', -6, P(420), "'COOKIE #1' tag");
  add(tC + 0.12, 'whoosh_up', -5, P(1550), 'the cookie is lifted away');
}
// ---- 41. "Also your OTHER cookie."
{
  const tO = w(16, 'OTHER');
  add(tO - 0.03, 'zoom_in', -3, 0, 'smash-zoom on Brick (shake)');
  add(tO, 'boom', -1, P(1100), 'he knows about the OTHER cookie');
  add(tO + 0.3, 'gulp', -6, -0.5, 'you gulp (off-screen left)');
}
// ---- 42. "No!"
{
  const tNo = A[17].word('No').t0;
  add(tNo, 'orch_hit', 0, 0, "'NO!' brave for one second (rays)");
  add(tNo + 0.03, 'shine', -6, 0, 'hero rays');
}
// ---- 43. "...Okay. Here. Have both cookies."
{
  const tH = A[17].word('Here').t0, tB = A[17].word('both').t0;
  add(tH - 0.15, 'swish', -10, 0, 'you hold out both cookies');
  add(tB + 0.3, 'swish', -8, P(1250), 'Brick takes them');
  for (let i = 0; i < 3; i++) add(tB + 0.65 + i * 0.3, 'chomp', -6 - i, P(1250), 'Brick munches');
}
// ---- 44. "Very brave. Very strong. Truly a legend." — slow claps
for (const t of [w(18, 'Very'), w(18, 'Very', 1), w(18, 'Truly')]) add(t, 'slap', -10, PW(720, 880, 1.55), 'Zoe: one slow clap');
add(w(18, 'legend'), 'achievement', -8, PW(1150, 880, 1.55), "'LEGEND' medal (sarcastic)");
// ---- 45. the night: the dream bubble
{
  const tD = w(19, 'dream');
  add(tD - 0.1, 'pop', -5, PW(1200, 1350, 1.35), 'the dream bubble appears');
  add(tD - 0.05, 'harp_up', -5, 0, 'dreamy');
  add(tD + 0.4, 'crowd_cheer', -16, PW(1200, 1350, 1.35), 'kids cheering inside the dream');
}
// ---- 46–48. the dream: strong, fast, picked first
for (const t of DREAM.slice(0, 3)) add(t - 0.05, 'sparkle', -8, 0, 'pink dream flash');
add(c46 + 0.05, 'whoosh_up', -6, 0, 'you lift Brick over your head');
add(w(19, 'strong'), 'level_up', -6, P(1500), "'STRONG' tag");
add(c47 + 0.2, 'jetpack', -10, 0, 'fire trail');
add(c47 + lerp(0, c48 - c47, 0.5) - 0.35, 'whoosh_long', -2, 0, 'you blaze across the sky');
add(w(19, 'fast'), 'pop', -5, P(1460), "'FAST' tag");
add(c48 + 0.05, 'crowd_cheer', -6, 0, 'the kids cheer');
add(w(19, 'never'), 'tada', -3, 0, "'PICKED FIRST!'");
add(w(19, 'last'), 'confetti', -3, 0, 'confetti');
// ---- 49. POP: back in bed
add(c49 - 0.05, 'sparkle', -11, 0, 'pink flash');
add(tP, 'pop', 1, P(1200), "'POP!' the dream bubble bursts");
add(tP + 0.4, 'snore', -10, PW(1530, 1300, 1.3), 'you, asleep');
add(B.word('Monday').t0, 'confirm', -8, P(1450), "'MONDAY ✓'");
// ---- 50. "Until the garage sale." — Server Street, the glowing laptop
add(c50 + 0.05, 'wind_gust', -12, 0, 'an eerie street that should not exist');
add(tGarage - 1.5, 'reverse_swell', -5, 0, 'the camera drifts down the street (peaks on the cut)');
add(tGarage, 'music_box', -4, 0, 'the garage sale: the dusty laptop');
add(tGarage + 0.15, 'magic', -10, 0, 'the laptop glows and pulses');
add(END - 0.15, 'shine', -8, 0, 'white flash into SC 03');

// ---- whip-pans + cut flashes (scene router)
for (const tc of WHIPS) add(tc - 0.1, 'whoosh', -3, -0.2, 'whip-pan');
for (const tc of CUTS) {
  if (WHIPS.includes(tc)) continue;
  if (sfx.some((e) => e[0] > tc - 0.25 && e[0] < tc + 0.25)) continue;                 // already marked by a hit
  add(tc - 0.03, 'swish', -13, 0, 'cut flash');
}

sfx.sort((p, q) => p[0] - q[0]);

// ================================================================= MUSIC (tiles [START, END])
const M = (start, end, mood, energy, inn, out) => ({ start: r3(start), end: r3(end), mood, energy, in: inn, out });
const S = (start, end) => M(start, end, 'silence', 0, 'cut', 'cut');
const music = [
  M(START, c04, 'hook', 0.6, 'cut', 'cut'),          // "This is you." the main theme, the pigeon YOINK
  M(c04, c07, 'playful', 0.45, 'cut', 'cut'),        // picked last in gym
  M(c07, tS, 'game', 0.65, 'cut', 'tapestop'),       // the obby: run, jump... lava
  S(tS, c09),                                        // YOU DIED
  M(c09, c10, 'game', 0.45, 'cut', 'cut'),           // "Easy Obby for Babies"
  S(c10, c12),                                       // "NOWHERE!" / the deadpan "It was the floor."
  M(c12, c14, 'game', 0.3, 'fade', 'cut'),           // the whole floor was lava, it said so in the name
  M(c14, c18, 'explainer', 0.5, 'cut', 'cut'),       // Dad works from home, "Can you hear me now?"
  S(c18, c19),                                       // "NOW?!"
  M(c19, c23, 'playful', 0.5, 'cut', 'cut'),         // Mom's sticky notes, OFFICIAL
  M(c23, c27, 'warm', 0.3, 'cut', 'cut'),            // Granny at 4 mph (slow comic), the snail
  M(c27, c30, 'playful', 0.35, 'cut', 'cut'),        // lazy Pancake, FLOP
  M(c30, c37, 'explainer', 0.45, 'cut', 'scratch'),  // Zoe, the password note -> Brick's shadow
  S(c37, c39),                                       // "And then... there's Brick." (dramatic sting sfx)
  M(c39, c42, 'sad', 0.35, 'cut', 'cut'),            // lunch money, the cookie, the OTHER cookie
  S(c42, c43),                                       // "No!"
  M(c43, c44, 'sad', 0.3, 'fade', 'cut'),            // "...Okay. Here. Have both cookies."
  S(c44, c45),                                       // Zoe, deadpan: "Truly a legend." (slow claps)
  M(c45, c46, 'tender', 0.35, 'fade', 'cut'),        // at night, you dream...
  M(c46, tP, 'wonder', 0.6, 'cut', 'cut'),           // strong, fast, picked first -> POP
  S(tP, c50),                                        // "Yeah. It was a normal Monday."
  M(c50, END, 'mystic', 0.4, 'swell', 'fade'),       // "Until the garage sale."
];

// ================================================================= AMBIENCE (beds per location)
const Bd = (start, end, name, gain_db) => ({ start: r3(start), end: r3(end), name, gain_db });
const ambience = [
  Bd(START, c04, 'birds', -8),             // Monday morning street
  Bd(START, c04, 'town', -12),
  Bd(c04, c07, 'crowd', -13),              // the gym
  Bd(c07, c08, 'room', -12),               // your room (the desk)
  Bd(c10, c11, 'room', -12),
  Bd(c14, c18, 'room', -12),               // living room: Dad's call
  Bd(c18, c19, 'birds', -8),               // house exterior
  Bd(c19, c23, 'kitchen', -10),            // Mom's kitchen
  Bd(c23, c27, 'town', -10),               // Granny's street
  Bd(c23, c27, 'birds', -10),
  Bd(c27, c30, 'room', -12),               // Pancake, the keyboard
  Bd(c30, c33, 'crowd', -14),              // school hallway
  Bd(c33, c37, 'room', -12),               // the password note
  Bd(c37, c45, 'crowd', -11),              // the cafeteria
  Bd(c45, c46, 'night', -10),              // bed at night
  Bd(c49, END, 'night', -11),              // back in bed / Server Street
];

// ================================================================= FOOTSTEPS
const footsteps = [];
const F = (start, end, interval, surface, gain_db, pan) => footsteps.push({ start: r3(start), end: r3(end), interval: r3(interval), surface, gain_db, pan });
{
  // the walk to school: AC.walk((te - START) * 7.5) -> a step every PI/7.5 s; frozen between tf0 and tf1
  const iv = Math.PI / 7.5;
  F(START, tf0, iv, 'hard', -10, -0.05);
  const k0 = Math.ceil(((tf0 - START) / iv) - 1e-6);
  F(START + k0 * iv + (tf1 - tf0), c02, iv, 'hard', -10, -0.05);
  // gym: the picked kids sprint off to the captains
  F(c04 + 0.3, Math.min(c05, tLast + 0.45), 0.1, 'wood', -14, 0);
  // the kid with the cast runs off (x moves for u .25..1 of seg(t, tKid + .25, tKid + 1.2))
  const tKid = w(1, 'kid');
  F(tKid + 0.49, Math.min(c07, tKid + 1.2), 0.12, 'wood', -12, -0.3);
  // obby avatar: AC.run((t - tRun) * 22) -> PI/22 s
  F(tRun, tJ, Math.PI / 22, 'hard', -11, PW(560, 700, 1.4));
  // Mom's zips between the notes: AC.run(t * 30) while fr < .33 of each slot
  const spots = [500, 1480, 1000], Ls = (c21 - c20) / spots.length;
  spots.forEach((x, i) => { const s0 = c20 + i * Ls; F(s0, s0 + 0.33 * Ls, Math.PI / 30, 'wood', -12, PW((x + (i ? spots[i - 1] : 1000)) / 2, 1000, 1.05)); });
  // Zoe + you walking down the hall: AC.walk((t - c30) * 7.5), you half a step behind (ph + 1.5)
  F(c30, c31, Math.PI / 7.5, 'hard', -11, 0.15);
  F(c30 + (Math.PI - 1.5) / 7.5, c31, Math.PI / 7.5, 'hard', -12, -0.25);
}

// ================================================================= write
const out = { scene: 'SC 02', start: r3(START), end: r3(END), music, ambience, footsteps, sfx };
const J = (x) => JSON.stringify(x);
const txt = '{\n' +
  `  "scene": ${J(out.scene)},\n  "start": ${out.start},\n  "end": ${out.end},\n` +
  `  "music": [\n${music.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "ambience": [\n${ambience.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "footsteps": [\n${footsteps.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "sfx": [\n${sfx.map((m) => '    ' + J(m)).join(',\n')}\n  ]\n}\n`;
const dst = path.join(__dirname, 'sc02.json');
fs.writeFileSync(dst, txt);
console.log(`${dst}: ${music.length} music segments, ${ambience.length} beds, ${footsteps.length} footstep runs, ${sfx.length} sfx`);
