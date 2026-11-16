#!/usr/bin/env node
// Sound cue sheet generator for SC 06 (ГОРОД В ХАОСЕ: ;fly all — the whole town takes off, the ;size all cats 100 typo,
// giant cats, "I'm the king of the city!", Zoe's log counter, Rex's breaking news, PERMISSION DENIED x2, the sky cracks).
// Every time below is computed from the voice timeline exactly like scenes/s06.js does (L(id).a / .b, .word()),
// so when the real voice replaces the provisional timeline, re-run:
//   node audio/cues/gen_sc06.js && python3 audio/validate_cues.py audio/cues/sc06.json
// Output: audio/cues/sc06.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const CS = require('../../scenes/city');
const { L } = V;
const { CITY, KF } = CS;

// ---------------------------------------------------------------- timing (copied from scenes/s06.js)
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const START = V.scene('SC 06').start, END = V.scene('SC 07').start;   // == main.js RANGES for SC 06
const m = Array.from({ length: 13 }, (_, i) => L('06.' + i));
const w = (i, word, n = 0) => m[i].word(word, n).t0;
const w1 = (i, word, n = 0) => m[i].word(word, n).t1;

const t2 = w(0, 'You') - 0.1;                     // rooftop: "You decide to think bigger."
const tBigger = w(0, 'bigger');
const t3 = m[1].a - 0.12;                         // close-up: ";fly all" typed on "Fly... ALL!"
const tFlyEnter = m[1].b + 0.04;
const t4 = m[2].a - 0.08;                         // wide: the whole town takes off
const tOff = w1(2, 'off');
const t5 = w(2, 'Including') - 0.1;               // the mailman
const t6 = w(2, 'Including', 1) - 0.1;            // a bus
const t7 = w(2, 'Including', 2) - 0.1;            // the guy in the bath
const tBath = w(2, 'bath');
const t8 = m[3].a - 0.08;                         // Pancake floating asleep next to YOU
const tBigAgain = w(3, 'big');
const t9 = w(3, 'Just') - 0.1;                    // typing without looking
const tTypoEnter = w1(3, 'little') + 0.22;
const t10 = w(3, 'But') - 0.1;                    // smash zoom: TYPO
const tTypo = w(3, 'typo');
const t11 = m[4].a - 0.08;                        // laptop screen: command accepted, cats found
const t12 = w(4, 'One') - 0.1;                    // wide: every cat balloons on "hundred"
const tHundred = w(4, 'hundred');
const t13 = m[5].a - 0.06;                        // the stadium cat
const t14 = w(5, 'in') - 0.05;                    // Pancake on the tower
const t15 = w(5, 'One') - 0.1;                    // the blimp, batted like yarn
const t16 = m[5].b - 0.05;                        // (silent beat) the water tower
const t17 = m[6].a - 0.08;                        // "I'm the king of the city!"
const t18 = w(6, "I'm", 1) - 0.1;                 // pull back: ADMIN OF EVERYTHING
const tEverything = w(6, 'EVERYTHING');
const t19 = m[7].a - 0.08;                        // Zoe flies up
const t20 = w(7, 'Somebody') - 0.1;               // Zoe close-up
const tDef = w(7, 'DEFINITELY');
const t21 = m[8].a - 0.08;                        // news studio
const t22 = w(8, 'Grandmas') - 0.1;               // footage: Granny
const tBarrier = w(8, 'barrier');
const t23 = w(8, 'And') - 0.1;                    // studio: the paw on the glass
const tGiant = w(8, 'giant');
const t24 = w(8, 'on') - 0.12;                    // footage: the cat on the mayor
const t25 = m[9].a - 0.08;                        // anchor: "Experts are asking one question."
const t26 = w(9, 'Who') - 0.12;                   // anchor ECU: "Who is doing this?"
const t27 = w(9, 'this');                         // YOU, caught (== SC 01)
const t28 = w(10, 'Un-fly') - 0.14;               // close-up: both commands
const tE1 = w1(10, 'all') + 0.06, tE2 = m[10].b + 0.05;
const tD1 = m[11].a, tD2 = w(11, 'Permission', 1);
const t31 = w(11, 'Your') - 0.08;                 // ADMIN RIGHTS UNDER REVIEW
const t32 = m[12].a - 0.06;                       // the sky... cracked
const tSky = w(12, 'sky'), tCracked = w(12, 'cracked');
// whip-pans: each shot's own whip(t, tN, dir)
const WHIPS = [[t2, 1], [t3, -1], [t5, 1], [t6, -1], [t7, 1], [t8, -1], [t9, 1], [t11, -1], [t12, 1], [t13, -1], [t14, 1], [t15, -1],
  [t16, 1], [t17, -1], [t18, 1], [t19, -1], [t20, 1], [t21, -1], [t23, 1], [t25, -1], [t28, 1], [t31, -1], [t32, 1]];

// s06_env camOn: camera that puts layer-k point (ax, ay) at screen (sx, sy) with that layer magnified zk
const camOn = (ax, ay, k, zk, sx = 960, sy = 540) => ({ zoom: 1 + (zk - 1) / k, x: (ax - 960 - (sx - 960) / zk) / k, y: (ay - 540 - (sy - 540) / zk) / k });
// typing span of a command bar = K.typeProgress(t, line, from, to): from word t0 to word t1 (same word matching as kit.js)
function typeSpan(line, from = 0, to = null) {
  const ws = line.words;
  const key = (x) => x[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const i0 = typeof from === 'number' ? from : ws.findIndex((x) => key(x) === from.toLowerCase());
  const i1 = to === null ? ws.length - 1 : typeof to === 'number' ? to : ws.findIndex((x, i) => i >= i0 && key(x) === to.toLowerCase());
  return [ws[Math.max(0, i0)][1], ws[Math.max(0, i1)][2]];
}

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));          // pan from screen x
const PC = (cam, a) => P(CS.toScreen(cam, a).x);                         // pan of a city point seen by a city cam
const sfx = [];
const add = (t, name, g, pan, note) => sfx.push([r3(t), name, g, pan, note]);
function typing(t0, t1, g, pan, note) {
  for (let t = t0, k = 0; t < t1 - 0.5 || k === 0; t += 0.9, k++) add(t, 'typing', k ? g - 2 : g, pan, k ? note + ' (cont.)' : note);
}
const POPS = [330, 1300, 760, 1700, 110, 1120, 2080, -300];              // city.js SERVER MESSAGE pop-ups (x)

// ================================================================= SFX, shot by shot
// ---- 1. "Saturday." — the calm city at sunset, title card
add(START + 0.02, 'pop', -3, 0, "'SATURDAY' title card pops");
add(START + 0.08, 'shine', -6, 0, 'title rays + sparkles');
// ---- 2. "You decide to think bigger." — the rooftop
add(tBigger - 0.03, 'zoom_in', -3, 0, "punch-in on 'bigger'");
add(tBigger + 0.03, 'sparkle', -7, P(1180), 'smug sparkles');
// ---- 3. "Fly... ALL!" — typed on his words, ENTER
{
  const [a, b] = typeSpan(m[1], 'Fly', 'ALL');
  typing(a, b, -3, P(760), "typing ';fly all'");
  add(w(1, 'ALL') - 0.03, 'zoom_in', -5, 0, "punch-in on 'ALL!'");
  add(tFlyEnter, 'click', -2, P(1330), 'ENTER: ;fly all (shake)');
  add(tFlyEnter + 0.03, 'confirm', 0, P(1330), 'confirm: ;fly all (green flash, command burst)');
}
// ---- 4. "The whole town took off." — the shockwave, everything lifts
{
  const cam = { zoom: 1.25, x: 180, y: -40 };
  const pan = PC(cam, { x: CITY.heroRoof.x - 40, y: CITY.heroRoof.y - 60, k: KF.near });
  add(t4 + 0.02, 'boom', 3, pan, "FLY ALL: the green shockwave rolls out over the city (shake)");
  add(t4 + 0.05, 'whoosh_up', 2, 0, 'the whole town lifts off');
  add(t4 + 0.1, 'rumble', -2, 0, 'the ground lets go');
  add(t4 + 0.6, 'wind_gust', -5, 0, 'everything floats up');
  add(t4 + 0.9, 'crowd_cheer', -10, 0, 'the town reacts');
  add(t4 + 1.0, 'metal_clank', -10, PC(cam, { x: 470, y: 520, k: KF.mid }), "Brick's cage swings up on the crane");
  for (let i = 0; i <= 6; i++) {                                    // popups = .55 * seg(t, tOff - .6, t5) reaches i * .085
    const t = tOff - 0.6 + ((i * 0.085) / 0.55) * (t5 - (tOff - 0.6));
    add(t, 'ui_pop', -11, P(clamp(POPS[i], 0, 1920)), `SERVER MESSAGE pop-up #${i + 1}`);
  }
}
// ---- 5. "Including the mailman." (+ a dog)
add(t5 + 0.05, 'whoosh_up', -4, 0, 'the mailman rises past');
add(t5 + 0.2, 'paper', -7, 0.1, 'letters flutter');
add(t5 + 0.45, 'dog_bark', -5, P(1500), 'a dog floats up too');
// ---- 6. "Including a bus." — BUS?!
add(t6 + 0.05, 'whoosh_up', -2, P(860), 'the bus rises past, passengers waving');
add(t6 + 0.15, 'engine', -8, P(860), 'bus engine');
add(w(2, 'bus') - 0.02, 'car_horn', -2, P(1500), "'BUS?!'");
// ---- 7. "Including a guy who was in the bath."
add(t7 + 0.05, 'whoosh_up', -4, 0, 'the bathtub rises into frame');
add(t7 + 0.15, 'splash', -5, 0, 'bath water sloshes');
add(tBath, 'squeak', -6, 0.2, 'rubber duck: he is perfectly calm, humming');
add(tBath + 0.3, 'bubbles', -12, 0.1, 'bubbles');
// ---- 8. Pancake floating asleep, the thought bubble ";size pancake 2"
add(t8 + 0.2, 'snore', -7, P(1220), 'Pancake snores, floating');
add(tBigAgain - 0.15, 'pop', -5, P(560), "thought bubble: ';size pancake 2'");
// ---- 9. typing without looking
typing(t9 + 0.1, tTypoEnter - 0.08, -4, P(760), "typing ';size all cats 100' without looking");
add(t9 + 0.6, 'snore', -10, P(1540), 'Pancake still snoring');
add(tTypoEnter, 'click', -2, P(1180), 'ENTER: ;size all cats 100');
add(tTypoEnter + 0.03, 'confirm', -3, P(1180), 'confirm: ;size all cats 100');
// ---- 10. "But you made a typo." — smash zoom, red circles, TYPO!
add(t10 - 0.02, 'zoom_in', 0, 0, 'smash-zoom on the chat (flash)');
add(tTypo - 0.35, 'swish', -7, P(985), "red marker circles 'all cats'");
add(tTypo - 0.1, 'swish', -8, P(1222), "red marker circles '100'");
add(tTypo, 'error', -2, P(1480), "'TYPO!'");
// ---- 11. SYSTEM: "Command: size... all cats. One hundred."
{
  const a = w(4, 'Command'), b = w(4, 'all'), c = w(4, 'One');
  add(a, 'confirm', -3, P(1460), "'Command accepted' badge");
  add(b, 'loading', -7, 0, "'Scanning for cats...'");
  for (let t = b + 0.4; t < c - 0.1; t += 0.95) add(t, 'money_counter', -8, 0, "'Cats found:' counter rolls to 100,000");
  add(c, 'beep', -8, 0, "'Resizing x100...'");
  add(tHundred - 2.0, 'riser', -2, 0, "the 'CAT SIZE x100' bar fills (peaks on 'hundred')");
}
// ---- 12. "...hundred." — every cat in the city balloons
{
  const cam = { zoom: lerp(1.08, 1.0, seg(tHundred, t12, t13)), x: 0, y: -220 };
  const R = CITY.roofs;
  const spots = [{ x: CITY.tower.x, y: CITY.tower.y - 80, k: KF.mid }, { x: 1290, y: 440, k: KF.mid }, { x: 1110, y: 560, k: KF.mid }, { x: CITY.stadium.x, y: CITY.stadium.y, k: KF.mid },
    { x: R[5].x0 + 70, y: R[5].y - 30, k: KF.near }, { x: R[7].x1 - 60, y: R[7].y - 40, k: KF.near }, { x: R[1].x0 + 90, y: R[1].y - 40, k: KF.near }];
  const growOrder = [0, 3, 1, 4, 2, 6, 5];
  const names = ['Pancake on the tower', 'the calico', 'the siamese', 'the stadium cat', 'the white cat', 'the tabby', 'the grey cat'];
  add(tHundred - 0.08, 'upgrade', 2, 0, 'SIZE UP: every cat in the city balloons x100');
  add(tHundred, 'rumble', 1, 0, 'the city shakes');
  add(tHundred + 0.02, 'sub_drop', -2, P(1520), "'x100'");
  spots.forEach((sp, i) => add(tHundred - 0.05 + growOrder.indexOf(i) * 0.09, 'pop', -9, PC(cam, sp), `${names[i]} balloons (command burst)`));
  add(tHundred + 0.5, 'monster_growl', -10, 0, 'a hundred giant cats, pleased');
}
// ---- 13. "Every cat" — the black cat curled up in the stadium
add(t13 + 0.15, 'snore', -2, 0, 'a giant black cat snoring in the stadium');
// ---- 14. "in the city." — Pancake licking his paw on the tower
add(t14 + 0.25, 'monster_growl', -11, P(700), 'Pancake purrs on the skyscraper');
add(t14 + 0.4, 'rumble', -12, P(700), 'the tower creaks');
// ---- 15. "One hundred times bigger." — the calico bats the NEWS 7 blimp like yarn
{
  const zk = (t) => lerp(1.9, 2.05, seg(t, t15, t16));
  add(t15 + 0.3, 'monster_growl', -12, P(1250), 'the calico, playful');
  for (let n = 0; ; n++) {
    const t = t15 + n * 0.62;                                       // a swat every .62 s: the blimp is knocked at each period start
    if (t >= t16 - 0.1) break;
    const cam = camOn(1230, 360, KF.mid, zk(t), 960, 520);
    const bx = 1150 - 70 * (n % 2 ? 0.6 : 1) + Math.sin(t * 0.7) * 10;
    add(t - 0.06, 'swish', -10, PC(cam, { x: 1320, y: 470, k: KF.mid }), 'giant paw swipes');
    add(t, 'punch', -4, PC(cam, { x: bx, y: 330, k: KF.mid }), "'BOP!' the blimp is batted");
    if (n === 1) add(t + 0.05, 'boing', -9, PC(cam, { x: bx, y: 330, k: KF.mid }), 'blimp bounces');
  }
}
// ---- 16. (silent beat) a grey cat slowly pushes the water tower off its roof... SPLOOSH
{
  const D = t17 - t16;
  const tTouch = t16 + 0.22 * D, tTeeter = t16 + 0.55 * D, tFall = t16 + 0.66 * D;
  const pan = P(960 + 2.6 * (CITY.waterTower.x - 1080));
  add(tTouch, 'metal_clank', -7, pan, 'the paw touches the water tower');
  add(tTeeter - 0.15, 'metal_hit', -9, pan, 'the tower teeters... creak');
  add(tFall, 'whoosh_down', -2, pan, '...and goes over');
  add(tFall + 0.3 * D, 'big_splash', 2, P(1360), "'SPLOOSH!'");
  add(tFall + 0.3 * D + 0.05, 'metal_hit', -6, P(1360), 'the tank crashes');
}
// ---- 17. "I'm the king of the city!"
add(t17 + 0.05, 'cloth', -6, 0, 'arms flung wide');
add(t17 + 0.1, 'angel', -5, 0, 'golden rays: king of the city');
// ---- 18. "I'm the ADMIN OF EVERYTHING!" — pull back across the flying city
add(t18 + 0.08, 'whoosh_long', -1, 0, 'big pull-back across the flying city');
add(t18 + 0.1, 'shine', -6, 0, 'rays + sparkles round you');
add(tEverything - 1.5, 'reverse_swell', -6, 0, "swell into 'EVERYTHING'");
// ---- 19. Zoe flies up with the log counter
add(t19 - 0.04, 'record_scratch', -1, 0, 'the king moment scratches to a stop');
add(t19 + 0.1, 'whoosh_up', -4, P(1300), 'Zoe flies up beside the roof');
add(w(7, 'nine'), 'money_counter', -8, P(1300), "LOG SIZE rolls to '9,000+'");
add(w(7, 'nine') + 0.1, 'gulp', -6, P(560), 'you, nervous');
add(w1(7, 'thousand') + 0.4, 'money_counter', -11, P(1300), 'the log keeps growing');
// ---- 20. "Somebody is DEFINITELY reading it!"
add(tDef - 0.03, 'zoom_in', -2, 0, "punch-in on 'DEFINITELY' (shake), Zoe points");
// ---- 21. BREAKING NEWS
add(t21 + 0.02, 'tv_on', -5, 0, 'cut to the NEWS 7 studio');
add(t21 + 0.05, 'pop', -2, 0, "'BREAKING NEWS' banner slams in");
add(w1(8, 'news') + 0.32, 'ui_close', -9, 0, 'the banner flips away');
// ---- 22. footage: Granny breaks the sound barrier
add(t22, 'static', -7, 0, 'cut to news footage');
add(t22 + 0.08, 'whoosh', -8, P(590), "lower third slides in: 'GRANDMA, 91'");
add(t22 + 0.1, 'jetpack', -8, 0, "Granny's fire trail");
add(tBarrier - 0.4, 'whoosh_long', -4, 0, 'Granny accelerates');
add(tBarrier, 'impact', 2, P(700), "SONIC BOOM ('BOOM!', shake)");
// ---- 23. the studio: a giant paw THUMPs the window
add(tGiant + 0.03, 'thud', 3, P(1400), "'THUMP!' a giant paw hits the studio window (shake)");
add(tGiant + 0.05, 'glass', -3, P(1400), 'the glass rattles');
add(tGiant + 0.3, 'monster_growl', -10, P(1400), 'the cat outside');
add(tGiant + 0.12, 'squeak', -9, -0.1, 'Rex flinches');
// ---- 24. footage: the cat sitting on the mayor
add(t24, 'static', -7, 0, 'cut to news footage');
add(t24 + 0.08, 'whoosh', -8, P(590), "lower third: 'LIVE: CITY HALL'");
add(t24 + 0.35, 'squeak', -11, P(1300), "the mayor's legs kick");
add(t24 + 0.6, 'monster_growl', -13, P(1040), 'the white cat purrs, comfy');
// ---- 26. "Who is doing this?" — anchor ECU
add(t26, 'zoom_in', -2, 0, 'smash-zoom on the anchor (flash, red tint)');
add(t26 + 0.05, 'dramatic', -2, 0, "'Who is doing this?'");
// ---- 27. YOU, caught (== SC 01)
add(t27, 'camera_flash', -9, 0, 'cut: you, caught floating with the laptop');
add(t27 + 0.3, 'gulp', -3, 0, 'gulp');
// ---- 28–30. ";unfly all", ";size all cats 1" -> PERMISSION DENIED x2
{
  const [a1, b1] = typeSpan(m[10], 'Un-fly', 'all');           // (kit matches 'Un-fly' to no word: the bar starts on "Okay!")
  typing(Math.max(a1, t28 + 0.1), b1, -3, P(760), "typing ';unfly all'");
  add(tE1, 'click', -2, P(1330), 'ENTER: ;unfly all');
  add(tE1 + 0.1, 'loading', -9, P(1600), 'spinner: waiting for the server');
  const [a2, b2] = typeSpan(m[10], 'Size', 'one');
  typing(a2, b2, -3, P(760), "typing ';size all cats 1'");
  add(tE2, 'click', -2, P(1330), 'ENTER: ;size all cats 1');
  add(tD1, 'buzzer_wrong', 1, P(1330), 'PERMISSION DENIED #1');
  add(tD1 + 0.02, 'stamp', 0, P(1330), 'red DENIED stamp (punch-in, shake)');
  add(tD1 + 0.04, 'glitch', -4, 0, 'red frame flash');
  add(tD2, 'buzzer_wrong', 2, P(1330), 'PERMISSION DENIED #2');
  add(tD2 + 0.02, 'stamp', 1, P(1330), 'second DENIED stamp (the frame tilts, shake)');
  add(tD2 + 0.04, 'glitch', -3, 0, 'red frame flash');
}
// ---- 31. "Your admin rights... are under review."
{
  const tY = w(11, 'Your'), tR = w(11, 'review');
  add(tY - 0.05, 'ui_pop', 0, P(1290), "the amber 'ADMIN RIGHTS UNDER REVIEW' window (flash)");
  add(tY + 0.05, 'alarm_beep', -9, P(1290), 'system alert');
  add(tY + 0.4, 'loading', -10, P(1290), 'slow review spinner');
  add(tR, 'heartbeat', -4, 0, 'you look up at the sky');
}
// ---- 32. "And that's when the sky... cracked."
add(t32 + 0.12, 'whoosh_long', -4, 0, 'the camera tilts up to the sky');
add(tCracked - 1.5, 'reverse_swell', -1, 0, 'the sky glows (swell peaks at the crack)');
add(tCracked - 0.02, 'impact', 4, 0, 'THE SKY CRACKS (white flash, big shake)');
add(tCracked, 'glass', 0, 0, 'glass crack across the sky');
add(tCracked + 0.02, 'thunder', 2, 0, 'thunder rolls out of the crack');
add(tCracked + 0.05, 'rumble', 0, 0, 'low rumble');
add(tCracked + 0.05, 'sub_drop', 0, 0, 'something enormous is coming');

// ---- whip-pans
for (const [tc, d] of WHIPS) add(tc - 0.1, 'whoosh', -3, r3(-0.25 * d), 'whip-pan');

sfx.sort((p, q) => p[0] - q[0]);

// ================================================================= MUSIC (tiles [START, END])
const M = (start, end, mood, energy, inn, out) => ({ start: r3(start), end: r3(end), mood, energy, in: inn, out });
const S = (start, end) => M(start, end, 'silence', 0, 'cut', 'cut');
const music = [
  M(START, t4, 'power', 0.55, 'fade', 'cut'),        // Saturday, think bigger, ;fly all
  M(t4, t8, 'chaos', 0.85, 'cut', 'cut'),            // the whole town takes off: mailman, bus, bath
  M(t8, tTypo, 'playful', 0.4, 'cut', 'sting'),      // Pancake big again, just a little... TYPO (comic button)
  S(tTypo, t11),
  M(t11, tHundred, 'glitch_build', 0.5, 'cut', 'cut'),  // SYSTEM: size all cats... one hundred (riser)
  M(tHundred, t16, 'chaos', 0.9, 'cut', 'cut'),      // every cat balloons: stadium, tower, the blimp
  S(t16, t17),                                       // silent beat: the water tower... SPLOOSH
  M(t17, t19, 'hook', 0.85, 'cut', 'scratch'),       // "I'm the king of the city! ...ADMIN OF EVERYTHING!"
  M(t19, t21, 'mystic', 0.4, 'fade', 'cut'),         // Zoe: your log is nine thousand lines long
  M(t21, t26, 'news', 0.6, 'cut', 'cut'),            // Rex Ratings' breaking news
  M(t26, tD1, 'glitch_build', 0.55, 'cut', 'cut'),   // "Who is doing this?" -> caught -> typing the fixes
  S(tD1, t31),                                       // PERMISSION DENIED x2
  M(t31, tCracked, 'mystery', 0.4, 'fade', 'sting'), // under review... the sky... CRACKED (big button)
  S(tCracked, END),                                  // sting tail + thunder + rumble
];

// ================================================================= AMBIENCE (beds per location)
const B = (start, end, name, gain_db) => ({ start: r3(start), end: r3(end), name, gain_db });
const ambience = [
  B(START, t21, 'town', -12),              // the city at sunset
  B(t2, t21, 'wind', -12),                 // rooftop, the flying city
  B(t4, t21, 'crowd', -15),                // the town took off
  B(t21, t22, 'room', -10),                // news studio
  B(t22, t23, 'wind', -10),                // footage: Granny
  B(t23, t24, 'room', -10),                // studio (the paw)
  B(t24, t25, 'crowd', -12),               // footage: city hall
  B(t25, t27, 'room', -10),                // studio
  B(t27, END, 'wind', -8),                 // floating above the night city (== SC 01)
  B(t27, END, 'night', -14),
];

// ================================================================= FOOTSTEPS (everyone is flying)
const footsteps = [];

// ================================================================= write
const out = { scene: 'SC 06', start: r3(START), end: r3(END), music, ambience, footsteps, sfx };
const J = (x) => JSON.stringify(x);
const txt = '{\n' +
  `  "scene": ${J(out.scene)},\n  "start": ${out.start},\n  "end": ${out.end},\n` +
  `  "music": [\n${music.map((x) => '    ' + J(x)).join(',\n')}\n  ],\n` +
  `  "ambience": [\n${ambience.map((x) => '    ' + J(x)).join(',\n')}\n  ],\n` +
  `  "footsteps": [${footsteps.length ? '\n' + footsteps.map((x) => '    ' + J(x)).join(',\n') + '\n  ' : ''}],\n` +
  `  "sfx": [\n${sfx.map((x) => '    ' + J(x)).join(',\n')}\n  ]\n}\n`;
const dst = path.join(__dirname, 'sc06.json');
fs.writeFileSync(dst, txt);
console.log(`${dst}: ${music.length} music segments, ${ambience.length} beds, ${footsteps.length} footstep runs, ${sfx.length} sfx`);
