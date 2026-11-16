#!/usr/bin/env node
// Sound cue sheet generator for SC 08 (БИТВА КОМАНД: ";freeze" -> Granny's hair dryer, the teleport chase (desert, ocean,
// mountain + snack), "I invented it", the jail ping-pong, eleven minutes, the size duel (the boot), Dad + Zoe + Pancake,
// Zoe's trace "he's a PERSON", battery 3%, "TELEPORT ME TO THE ADMIN!" -> white).
// Every time below is computed from the voice timeline exactly like scenes/s08.js does (L(id).a / .b, .word()),
// so when the real voice replaces the provisional timeline, re-run:
//   node audio/cues/gen_sc08.js && python3 audio/validate_cues.py audio/cues/sc08.json
// Output: audio/cues/sc08.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { ease } = require('../../rig/svg');
const { L } = V;

// ---------------------------------------------------------------- timing (copied from scenes/s08.js)
const lerp = (a, b, k) => a + (b - a) * k;
const START = V.scene('SC 08').start, END = V.scene('SC 09').start;   // == main.js RANGES for SC 08
const n = Array.from({ length: 19 }, (_, i) => L('08.' + i));
const Wd = (i, w, k = 0) => n[i].word(w, k).t0;
const We = (i, w, k = 0) => n[i].word(w, k).t1;

const d1 = n[1].a - 0.1;                    // B  frozen solid
const d2 = n[2].a - 0.25;                   // C1 Granny streaks in
const d3 = Wd(2, "Granny's") - 0.1;         // C2 the hair dryer melts the ice
const d4 = n[3].a - 0.1;                    // D  "Th-thanks, Granny!"
const d5 = Wd(3, 'Teleport') - 0.1;         // E  ;tp me away
const d6 = n[4].a - 0.05;                   // F1 desert
const d7 = Wd(4, 'He') - 0.1;               // F1b he was there (parasol)
const d8 = Wd(4, 'To', 1) - 0.12;           // F2 ocean
const d9 = Wd(4, 'He', 1) - 0.1;            // F2b he was there (coconut)
const d10 = Wd(4, 'To', 2) - 0.12;          // F3 mountain
const d11 = Wd(4, 'He', 2) - 0.1;           // F3b he was there... with a snack
const d12 = n[5].a - 0.1;                   // G  "Teleport is my command. I invented it."
const d13 = n[6].a - 0.1;                   // H  ;jail Admin
const d14 = n[7].a - 0.1;                   // I  ;unjail me
const d14b = Wd(7, 'Jail') - 0.12;          // I2 ;jail you
const d15 = n[8].a - 0.1;                   // J  ping-pong
const d16 = n[9].a - 0.1;                   // K  eleven minutes
const d17 = n[10].a - 0.1;                  // L1 ;size me 100
const d17b = n[10].b - 0.05;                // L2 you grow; ;size me 1000
const d18 = n[11].b + 0.05;                 // N1 the boot
const d18b = Wd(12, 'had') + 0.1;           // N2 tilt up the giant
const d18c = Math.min(n[12].b + 0.55, n[13].a - 0.75);   // N3 the shadow (the beat)
const d19 = n[13].a - 0.15;                 // O1 Dad flies in
const d20 = Wd(13, 'Can') - 0.1;            // O2 "Can you hear me now?!"
const d21 = n[14].a - 0.1;                  // P1 "Yes! I can hear you!"
const d22 = Wd(14, 'Everybody') - 0.1;      // P2 everybody (+ Pancake pounces on the cape)
const d23 = n[15].a - 0.1;                  // Q1 Zoe hacks on Dad's back
const d24 = Wd(15, "he's", 1) - 0.1;        // Q2 her screen: PERSON
const d25 = n[16].a - 0.1;                  // R1 "Then I'm going there."
const d26 = Wd(16, 'Teleport') - 0.1;       // R2 ;tp me to Admin
const d27 = n[17].a - 0.1;                  // S  battery 3%
const d28 = n[18].a - 0.1;                  // T  TELEPORT ME TO THE ADMIN!

const tFreeze = n[0].b;
const tMelt0 = d3 + 0.25, tMelt1 = d4 - 0.15;
const tTp = n[3].b;
const tChomp = Wd(4, 'snack');
const tInvent = Wd(5, 'invented');
const tGrow = n[10].b;
const tBoot = d18 + 0.18;
const tPounce = Wd(14, 'Everybody') + 0.35;
const tPerson = Wd(15, 'PERSON');
const tReal = Wd(15, 'REAL');
const tThree = Wd(17, 'three');
const tGo = Wd(18, 'ADMIN');

// the jail ping-pong (summit): ENTER moments of the chat feed
const e1 = n[6].b;                                   // you: ;jail Admin
const e2 = We(7, 'me');                               // ADMIN: ;unjail me
const e3 = n[7].b;                                    // ADMIN: ;jail you
const e4 = We(8, 'me');                               // you: ;unjail me
const e5 = We(8, 'you');                              // you: ;jail you
const eGap = Math.max(0.3, Wd(8, 'unjail', 1) - e5);  // the beat before "UN-JAIL ME!"
const e6 = e5 + 0.35 * eGap;                          // ADMIN: ;unjail me (instant)
const e7 = e5 + 0.7 * eGap;                           // ADMIN: ;jail you (instant)
const e8 = n[8].b;                                    // you: ;UNJAIL ME
const HX = 740, AX = 1190;
// shot J camera (camKeys with ease.out)
const at = (x, y, zoom = 1) => ({ x, y, zoom });
const J_KEYS = [[d15, at(970, 430, 1.1)], [e4, at(970, 430, 1.1)], [e4 + 0.1, at(800, 420, 1.3)], [e5, at(800, 420, 1.3)], [e5 + 0.1, at(1150, 400, 1.3)], [e7, at(1150, 400, 1.3)], [e7 + 0.1, at(820, 440, 1.45)], [d16, at(860, 440, 1.6)]];
function camKeys(t, keys, easing = ease.inOut) {
  if (t <= keys[0][0]) return { ...keys[0][1] };
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i], [t1, b] = keys[i + 1];
    if (t <= t1) {
      const u = easing(Math.max(0, Math.min(1, (t - t0) / (t1 - t0))));
      return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), zoom: lerp(a.zoom, b.zoom, u) };
    }
  }
  return { ...keys[keys.length - 1][1] };
}

// typing span of a command = K.typeProgress(t, line, from, to): from word t0 to word t1
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
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));                 // pan from screen x
// world x on a parallax layer k seen by cam at(cx, _, zoom) (env.camTf)
const PK = (wx, cx, zoom = 1, k = 1) => P(960 + (1 + (zoom - 1) * k) * (wx - 960 - (cx - 960) * k));
const PW = (wx, cx, zoom = 1) => PK(wx, cx, zoom, 1);
const PJ = (wx, t) => { const c = camKeys(t, J_KEYS, ease.out); return PW(wx, c.x, c.zoom); };
const sfx = [];
const add = (t, name, g, pan, note) => sfx.push([r3(t), name, g, pan, note]);
// keyboard bursts (~1 s each) while the command's letters appear
function typing(t0, t1, g, pan, note) {
  for (let t = t0, k = 0; t < t1 - 0.25 || k === 0; t += 0.9, k++) add(t, 'typing', k ? g - 2 : g, pan, k ? note + ' (cont.)' : note);
}
// ENTER: key click + confirm ding
function enter(t, g, pan, note) {
  add(t, 'click', g, pan, `ENTER: ${note}`);
  add(t + 0.03, 'confirm', g - 1, pan, `confirm: ${note}`);
}
// a cage drops onto someone (SETS.cage: lands at drop 0.7 = a + 0.294; scene shakes at a + 0.3)
function cageDrop(a, pan, who, g = 0) {
  add(a + 0.02, 'whoosh_down', g - 6, pan, `a cage drops onto ${who}`);
  add(a + 0.29, 'metal_clank', g + 2, pan, `CLANG: the cage slams down on ${who} (shake)`);
  add(a + 0.3, 'metal_hit', g - 1, pan, 'cage impact');
  add(a + 0.32, 'stamp', g - 3, pan, 'jailed');
}
const cageVanish = (b, pan, who, g = 0) => add(b, 'poof', g - 1, pan, `the cage around ${who} vanishes`);

// ================================================================= SFX, shot by shot
// ---- A. "Freeze." — he points, the sky types it, ENTER: an icy blast
{
  const pA = PK(1250, 960, 1, 0.22), pChat = PK(640, 960, 1, 0.12);
  add(START - 0.12, 'whoosh', -2, -0.3, 'whip-pan in from the VS card');
  add(START + 0.02, 'swish', -6, pA, 'the Admin points at you');
  add(START, 'typing', -1, pChat, "the sky chat types ';freeze you' (heavy)");
  enter(tFreeze, 0, pChat, ';freeze you');
  add(tFreeze, 'boom', 2, 0, 'ADMIN command: heavy hit (shake)');
  add(tFreeze + 0.02, 'sub_drop', 0, 0, 'ADMIN command: sub drop');
  add(tFreeze + 0.05, 'shock', -3, 0, 'freeze: crackling cold');
  add(tFreeze + 0.06, 'wind_gust', -5, 0, 'the icy wind of the command burst');
}
// ---- B. "He froze you solid." — the ice block rises, CRACKLE!
add(d1 - 0.03, 'glass', 1, 0, 'freeze: the ice block shoots up around you (flash)');
add(d1 + 0.05, 'egg_crack', -1, P(1500), "'CRACKLE!' ice crackles (shake)");
add(d1 + 0.18, 'glass', -5, P(1300), 'crackle');
add(d1 + 0.3, 'stone', -9, 0, 'ice settling');
add(d1 + 0.5, 'sparkle', -12, 0, 'frost sparkles');
// ---- C1. "Hold still, sweetie!" — Granny streaks across the roof on a fire trail and skids to a stop
add(d2 - 0.1, 'whoosh', -3, 0.3, 'whip-pan');
add(d2, 'whoosh_long', 1, -0.5, 'Granny streaks in at 1500 km/h');
add(d2 + 0.02, 'jetpack', -4, -0.4, 'her fire trail roars');
add(d2 + 0.35, 'poof', -8, PW(560 - 120, 960, 1.12), 'dust cloud');
add(d2 + 0.4, 'skid', 1, PW(560, 960, 1.12), 'SKRRRT: she skids to a stop');
add(d3 - 0.4, 'toggle', -4, PW(560, 960, 1.12), 'click: the hair dryer switches on');
// ---- C2. "Granny's got a hair dryer!" — FWOOOSH, the ice melts in a second
{
  const pG = PW(560, 900, 1.5), pH = PW(1150, 900, 1.5);
  add(d3 + 0.05, 'jetpack', -2, pG, 'the hair dryer roars (hot air)');
  add(d3 + 0.1, 'wind_gust', 2, P(860), "'FWOOOSH' hot air blast");
  add(d3 + 0.9, 'wind_gust', -5, P(1000), 'hot air keeps blowing');
  add(tMelt0, 'sizzle', -5, pH, 'the ice block melts');
  add(tMelt0 + 0.2, 'steam_hiss', -5, pH, 'steam rises');
  add(tMelt0 + 0.45, 'glass', -8, pH, 'ice cracks as it shrinks');
  add(tMelt1 - 0.05, 'splash', -5, pH, 'the last of the ice collapses into a puddle');
}
// ---- D. "Th-thanks, Granny!" — soaked, icicles, teeth chattering
add(d4 + 0.1, 'wind_gust', -13, PW(640, 1100, 2.0), "Granny's dryer still blowing");
add(d4 + 0.15, 'glass', -12, PW(1150, 1100, 2.0), 'icicles tinkle as you shiver');
add(d4 + 0.6, 'splat', -12, PW(1150, 1100, 2.0), 'drips');
add(d4 + 0.95, 'glass', -14, PW(1150, 1100, 2.0), 'icicles tinkle');
// ---- E. "Teleport... me... away!" — ;tp me away -> beam -> gone
{
  const [a, b] = typeSpan(n[3], 'Teleport', 'away');
  const pH = PW(1150, 1060, 1.55);
  typing(a, b, -2, P(1000), "shivering typing ';tp me away'");
  enter(tTp, -1, P(1000), ';tp me away');
  add(tTp + 0.02, 'teleport', 1, pH, "teleport: you squash into a beam and you're gone (flash)");
}
// ---- F. the chase: per location an arrival (flash + whoosh + beam), a location sting with the card, then "He was there."
function arrive(t, pH, name, flavour) {
  add(t - 0.12, 'whoosh', -2, pH, `whoosh: you materialise in the ${name} (white flash, beam)`);
  add(t + 0.05, 'orch_hit', -2, P(250), `'${name.toUpperCase()}' location card + sting`);
  add(t + 0.07, 'pop', -6, P(250), 'card pops');
  if (flavour) add(t + flavour[0], flavour[1], flavour[2], flavour[3], flavour[4]);
}
function reveal(t, pA, pH, name) {
  add(t - 0.08, 'whoosh', -3, 0.3, `whip-pan: he was there (${name})`);
  add(t, 'boom', -1, pA, "'He was there.' (shake)");
  add(t + 0.06, 'squeak', -8, pH, 'you, shocked');
}
const leave = (t, pH, name) => { add(t - 0.12, 'click', -8, pH, `ENTER: ;tp me (out of the ${name})`); add(t - 0.02, 'teleport', -3, pH, `you beam out of the ${name}`); };
// F1 desert (parasol)
arrive(d6, PW(900, 960, 1.0), 'desert', [0.3, 'wind_gust', -9, -0.2, 'hot desert gust']);
add(d6 + 0.6, 'swish', -10, PW(900, 960, 1.05), 'phew: you wipe your brow');
reveal(d7, PW(1320, 1060, 1.2), PW(900, 1060, 1.2), 'parasol');
leave(d8 - 0.22, PW(900, 1060, 1.24), 'desert');
// F2 ocean (knee-deep, coconut)
arrive(d8, PW(1060, 1000, 1.08), 'ocean', [0.25, 'splash', -9, 0.3, 'waves on the tiny island']);
reveal(d9, PW(1560, 1180, 1.1), PW(1060, 1180, 1.1), 'coconut');
add(d9 + 0.05, 'splash', -5, PW(1560, 1180, 1.1), 'he stands knee-deep in the waves');
leave(d10 - 0.22, PW(1060, 1180, 1.16), 'ocean');
// F3 mountain (the snack)
arrive(d10, PW(820, 960, 0.86), 'mountain', [0.25, 'wind_gust', -6, -0.2, 'icy mountain wind']);
add(d10 + 0.4, 'whoosh_long', -10, 0, 'camera rises to the summit');
reveal(d11, PW(1110, 1000, 1.3), PW(820, 1000, 1.3), 'with a snack');
add(tChomp - 0.45, 'swish', -9, PW(1110, 1000, 1.38), 'he lifts the sandwich');
add(tChomp, 'chomp', 2, P(1260), "'CHOMP' — a big bite of the sandwich");
add(tChomp + 0.35, 'chomp', -9, PW(1110, 1000, 1.39), 'chewing');
// ---- G. "Teleport is my command. ... I invented it." (the patent)
add(d12 + 0.05, 'chomp', -11, PW(1110, 1120, 1.62), 'chewing');
add(d12 + 0.4, 'chomp', -13, PW(1110, 1120, 1.62), 'chewing');
add(tInvent - 0.12, 'record_scratch', 0, 0, "'I invented it.' — the chase music scratches to a stop");
add(tInvent - 0.08, 'pop', -3, P(820), "the framed 'PATENT No. 0001' certificate pops up");
add(tInvent - 0.05, 'paper', -7, P(820), 'certificate');
add(tInvent + 0.25, 'shine', -8, P(1000), 'the gold seal glints');
// ---- H. "Jail... Admin!" — you jail him
{
  const pFeed = P(420), pA = PW(AX, 970, 1.12);
  const [a] = typeSpan(n[6]);
  typing(a, e1, -2, pFeed, "typing ';jail Admin'");
  enter(e1, -1, pFeed, ';jail Admin');
  cageDrop(e1, pA, 'the Admin');
}
// ---- I. "Un-jail me." (on him) -> I2 "Jail YOU." (on you)
{
  const pFeed = P(400);
  typing(n[7].a, e2, -4, pFeed, "the Admin types ';unjail me' (heavy)");
  enter(e2, -2, pFeed, ';unjail me (ADMIN)');
  add(e2 + 0.01, 'boom', -4, PW(AX, AX, 1.55), 'ADMIN command: bass hit');
  cageVanish(e2 + 0.03, PW(AX, AX, 1.55), 'the Admin');
  add(d14b - 0.1, 'whoosh', -3, -0.3, 'whip-pan to you');
  typing(Wd(7, 'Jail'), e3, -4, pFeed, "the Admin types ';jail you' (heavy)");
  enter(e3, -2, pFeed, ';jail you (ADMIN)');
  add(e3 + 0.01, 'boom', -2, PW(HX, HX, 1.55), 'ADMIN command: bass hit');
  cageDrop(e3, PW(HX, HX, 1.55), 'you');
}
// ---- J. the ping-pong: the camera snaps to whoever just got caged
{
  const pFeed = P(400);
  typing(n[8].a, e4, -2, pFeed, "you type ';unjail me'");
  enter(e4, -1, pFeed, ';unjail me');
  cageVanish(e4 + 0.03, PJ(HX, e4), 'you');
  add(e4 + 0.02, 'whoosh', -9, -0.2, 'camera snaps');
  typing(Wd(8, 'Jail'), e5, -2, pFeed, "you type ';jail you'");
  enter(e5, -1, pFeed, ';jail you');
  add(e5 + 0.02, 'whoosh', -9, 0.2, 'camera snaps (flash)');
  add(e5 + 0.04, 'whoosh_down', -7, PJ(AX, e5 + 0.1), 'a cage drops onto the Admin...');
  add(e5 + 0.04, 'typing', -5, pFeed, "the Admin instantly types ';unjail me' / ';jail you'");
  add(e6, 'click', -3, pFeed, 'ENTER: ;unjail me (ADMIN, instant)');
  add(e6 + 0.01, 'boom', -6, PJ(AX, e6), 'ADMIN command: bass hit');
  cageVanish(e6 + 0.02, PJ(AX, e6), 'the Admin (before it even lands)');
  add(e5 + 0.3, 'metal_clank', -6, PJ(AX, e5 + 0.3), 'the vanishing cage still rattles the summit (shake)');
  add(e7, 'click', -3, pFeed, 'ENTER: ;jail you (ADMIN, instant)');
  add(e7 + 0.01, 'boom', -3, PJ(HX, e7 + 0.1), 'ADMIN command: bass hit (flash)');
  add(e7 + 0.02, 'whoosh', -9, -0.2, 'camera snaps');
  cageDrop(e7, PJ(HX, e7 + 0.3), 'you', -1);
  typing(Wd(8, 'unjail', 1), e8, 0, pFeed, "furious typing ';UNJAIL ME'");
  enter(e8, 0, pFeed, ';UNJAIL ME');
  cageVanish(e8 + 0.03, PJ(HX, e8), 'you');
}
// ---- K. "This went on for eleven minutes." — time-lapse: every location, cages strobing, a spinning clock
{
  const dur = d17 - d16;
  add(d16 + 0.02, 'pop', -4, P(1640), 'the spinning clock pops in');
  add(d16 + 0.12, 'pop', -7, P(1640), "'+00:00' pops");
  for (let t = d16 + 0.1, k = 0; t < d17 - 0.3; t += 0.9, k++) add(t, 'money_counter', k ? -9 : -7, P(1640), k ? 'clock + timer spinning (cont.)' : 'clock + timer spin to +11:00');
  typing(d16, d17, -9, P(300), 'both keep mashing their keyboards; chat spam scrolls');
  for (let k = 1; k <= 3; k++) {
    const t = d16 + (k / 4.4) * dur;
    add(t - 0.05, 'whoosh', -6, 0, `time-lapse jump to location ${k + 1} (white frame)`);
    add(t, 'teleport', -9, 0, 'teleport flicker');
  }
  // cages strobing at 7 Hz: a clank on every second flip, alternating sides
  for (let k = Math.ceil(d16 * 7), j = 0; k / 7 < d17 - 0.1; k += 2, j++) add(k / 7, 'metal_clank', j % 2 ? -14 : -12, j % 2 ? 0.17 : -0.15, 'cages strobe: you / him / you / him');
}
// ---- L1. "Fine! Size me... one hundred!" (back on the roof, hair a mess)
{
  const tF = Wd(10, 'Fine');
  const [a, b] = typeSpan(n[10], 'Size', 'hundred');
  add(tF - 0.03, 'thud', -2, 0, "'Fine!' you slam the laptop (shake)");
  add(tF + 0.05, 'steam_hiss', -6, PW(900, 900, 1.5), 'steam out of your ears');
  typing(a, b, 0, P(900), "furious typing ';size me 100'");
  enter(tGrow, 0, P(900), ';size me 100');
}
// ---- L2. you grow over the city; the Admin, now tiny, types ;size me 1000
{
  const pA = PW(1420, 1000, 1.04);
  add(tGrow + 0.03, 'upgrade', 1, PW(760, 960, 1.2), 'size up: you shoot up over the city (flash)');
  add(tGrow + 0.05, 'whoosh_up', -2, PW(760, 960, 1.2), 'the camera pulls back as you grow');
  add(d17b + 0.1, 'rumble', -2, 0, 'the city rumbles');
  add(d17b + 0.15, 'level_up', -5, PW(760, 960, 1.0), 'size 100 reached');
  add(d17b + 0.4, 'thud', 1, PW(760, 960, 1.0), 'giant feet plant (shake)');
  add(d17b + 0.42, 'sub_drop', -3, PW(760, 960, 1.0), 'giant weight');
  const [a, b] = typeSpan(n[11]);
  typing(a, b, -5, pA, "the tiny Admin types ';size me 1000' in his sky chat (heavy)");
  enter(n[11].b, -2, pA, ';size me 1000 (ADMIN)');
}
// ---- N1. BOOM: a giant boot lands next to you
{
  const pB = PW(1460, 960, 1.0), pH = PW(420, 960, 1.0);
  add(d18 - 0.02, 'whoosh_down', 1, pB, 'a giant boot drops out of the sky');
  add(d18 + 0.01, 'upgrade', -6, pB, 'ADMIN size-up');
  add(tBoot - 0.02, 'boom', 4, pB, "'BOOM' the giant boot lands");
  add(tBoot, 'sub_drop', 3, pB, 'BOOM: the landing of something huge');
  add(tBoot + 0.01, 'impact', 2, pB, 'BOOM impact (big shake)');
  add(tBoot + 0.04, 'rumble', 0, 0, 'the whole city shakes');
  add(tBoot + 0.06, 'poof', -4, pB, 'dust ring bursts out');
  add(tBoot + 0.03, 'jump', -6, pH, 'giant you is bounced off the ground');
  add(tBoot + 0.25, 'squeak', -7, pH, 'you: shocked');
}
// ---- N2. "He always had a bigger number." tilt up the boot... the robe... up to his face above the clouds
add(d18b, 'whoosh_long', -4, 0.2, 'the camera tilts up... and up...');
add(d18c - 0.35 - 1.5, 'reverse_swell', -3, 0.2, 'swell into his face high above the clouds');
add(d18b + 0.6, 'wind_gust', -9, 0.25, 'past the cloud band');
// ---- N3. the beat: you look up as his shadow swallows you
add(d18c + 0.02, 'rumble', -12, 0, 'the shadow creeps over you');
add(d18c + 0.05, 'heartbeat', -6, 0, 'the beat');
add(d18c + 0.5, 'gulp', -2, PW(420, 440, 2.0), 'giant gulp');
// ---- O1. "Nobody messes with my kid!" — Dad flies in (Zoe on his back) and screeches to a hover
add(d19 - 0.1, 'whoosh', -2, -0.3, 'whip-pan');
add(d19, 'whoosh_long', 1, 0.5, 'Dad flies in from the right, superhero style');
add(d19 + 0.02, 'jetpack', -4, 0.4, 'flight roar');
add(d19 + 0.1, 'wind_gust', -7, 0.2, 'clouds rush past');
add(d19 + 0.7, 'skid', -5, P(1150), 'he screeches to a hover');
add(Wd(13, 'kid') - 0.1, 'shine', -3, P(1050), 'heroic sparkle on "kid!"');
// ---- O2. "Can you hear me now?!" — in front of the Admin's giant face of light
add(Wd(13, 'Can'), 'wind_gust', -9, P(1120), 'sound rings blast out of Dad');
add(Wd(13, 'hear') - 0.05, 'whoosh', -11, P(900), 'sound rings roll toward the face');
// ---- P1. "Yes! I can hear you!" — the face of light, annoyed; Dad blown back
{
  const tY = Wd(14, 'Yes');
  add(tY, 'boom', 2, PW(820, 960, 1.05), "'Yes!' (big shake)");
  add(tY + 0.02, 'wind_gust', 0, PW(1000, 960, 1.05), 'golden sound rings blast out of his mouth');
  add(tY + 0.05, 'whoosh', -4, 0.35, 'Dad and Zoe are blown back');
  add(tY + 0.45, 'dizzy', -7, PW(1420, 960, 1.08), "Dad's eyes swirl");
  add(Wd(14, 'hear'), 'boom', -3, PW(820, 960, 1.1), "'hear' shake");
}
// ---- P2. "Everybody can hear you!" — the city covers its ears; giant Pancake pounces on the Admin's cape
{
  const tE = Wd(14, 'Everybody');
  add(tE, 'boom', 2, P(1500), "'EVERYBODY' (big shake)");
  add(tE + 0.02, 'rumble', -2, 0, 'huge sound rings shake the whole city');
  add(tE + 0.05, 'wind_gust', -4, 0.4, 'sound blast');
  add(tPounce - 0.45, 'whoosh_long', -3, -0.4, 'giant Pancake leaps');
  add(tPounce - 0.02, 'monster_growl', 0, P(1100), "'MROW!' Pancake pounces (softened growl)");
  add(tPounce, 'thud', -2, P(1180), 'he lands on the robe hem');
  add(tPounce + 0.05, 'cloth', -4, P(1180), 'claws in the cape');
  add(tPounce + 0.3, 'thud', -6, P(1180), 'cling wobble (shake)');
}
// ---- Q1. "I'm in his logs! He's not a program..." — Zoe types on Dad's back
typing(d23, d24, -7, PW(1050, 1000, 1.42), 'Zoe hacks on her laptop');
add(d23 + 0.05, 'wind_gust', -10, 0.2, 'flying, speed lines');
// ---- Q2. her screen: PROGRAM -> PERSON, typing from: somewhere REAL
{
  for (let k = Math.ceil((d24 - d23) * 1.5), j = 0; d23 + k / 1.5 < d25; k++, j++) add(d23 + k / 1.5, 'beep', -14, P(600), j ? 'log line prints' : 'ADMIN.log trace scrolls');
  add(tPerson - 0.1, 'error', -6, P(1325), 'PROGRAM gets struck out');
  add(tPerson + 0.02, 'stamp', 0, P(1430), "'PERSON ✓' slams on (green flash)");
  add(tPerson + 0.05, 'confirm', -3, P(1430), 'PERSON ✓');
  const tTy = Wd(15, 'typing');
  for (let t = Math.ceil(tTy * 1.2) / 1.2; t < tReal - 0.4; t += 1 / 1.2) add(t, 'beep', -10, P(1360), 'location radar ping');
  add(tReal - 0.5, 'pop', -4, P(1360), "'SOMEWHERE REAL' pops");
  add(tReal, 'boom', 0, P(1360), "'REAL!'");
}
// ---- R1. "Then I'm going there." — the giant you, determined (gold aura); Dad and Zoe hover by your face
add(d25 + 0.05, 'forcefield', -10, 0, 'your gold aura hums back on');
add(Wd(16, 'there') - 0.1, 'cloth', -8, 0, 'determined nod');
add(d25 + 0.3, 'jetpack', -16, PW(980, 620, 1.8), 'Dad hovering nearby');
// ---- R2. "Teleport me... to the Admin!" — typing (no ENTER yet)
{
  const [a, b] = typeSpan(n[16], 'Teleport', 'Admin');
  typing(a, b, -1, 0, "determined typing ';tp me to Admin'");
}
// ---- S. "Warning. Battery... three percent." — the laptop screen
{
  const tW = Wd(17, 'Warning');
  add(d27 + 0.02, 'tv_on', -8, 0, 'cut to the laptop screen');
  add(tW - 0.05, 'alarm_beep', -1, 0, "'WARNING' popup");
  add(tW - 0.03, 'ui_pop', -4, 0, 'popup pops');
  add(Wd(17, 'Battery'), 'countdown_tick', -8, 0, 'tick');
  add(tThree, 'buzzer_wrong', -1, 0, "'Battery: 3%' (shake)");
  add(tThree + 0.05, 'powerdown', -8, 0, 'battery drops 7% -> 3%');
  for (let k = Math.ceil((tThree * 4 - 1) / 2); (2 * k + 1) / 4 < d28 - 0.1; k++) if ((2 * k + 1) / 4 > tThree + 0.2) add((2 * k + 1) / 4, 'beep', -7, 0, 'red low-battery blink');
}
// ---- T. "TELEPORT ME TO THE ADMIN!" — ENTER -> beam -> gone -> white
add(tGo - 4.0, 'riser_long', -3, 0, 'long riser from the battery warning into the jump');
add(tGo - 1.5, 'reverse_swell', -2, 0, 'swell into ENTER (camera pushes in)');
enter(tGo, 1, 0, ';tp me to Admin');
add(tGo + 0.01, 'teleport', 3, 0, 'teleport: you squash into the beam (shake)');
add(tGo + 0.02, 'impact', 3, 0, 'the beam + flash + big shake');
add(tGo + 0.15, 'portal_enter', -1, 0, 'sucked into the white-out');

sfx.sort((p, q) => p[0] - q[0]);

// ================================================================= MUSIC (tiles [START, END])
const M = (start, end, mood, energy, inn, out) => ({ start: r3(start), end: r3(end), mood, energy, in: inn, out });
const music = [
  M(START, tTp, 'power', 0.65, 'cut', 'cut'),           // ;freeze, frozen solid, Granny's hair dryer FWOOOSH, ;tp me away
  M(tTp, tInvent - 0.12, 'chase', 0.8, 'cut', 'scratch'), // the teleport chase: desert, ocean, mountain, CHOMP, "Teleport is my command." -> scratch
  M(tInvent - 0.12, d13, 'silence', 0, 'cut', 'cut'),   // "I invented it." + the PATENT
  M(d13, d17, 'chaos', 0.85, 'cut', 'tapestop'),        // the jail ping-pong, eleven minutes of it -> runs out of steam
  M(d17, d18c, 'epic', 0.8, 'cut', 'sting'),            // the size duel: 100 -> 1000, BOOM, the tilt up -> button on his face
  M(d18c, d19, 'silence', 0, 'cut', 'cut'),             // the shadow, gulp
  M(d19, d23, 'hook', 0.7, 'cut', 'fade'),              // Dad flies in (heroic), "Can you hear me now?!", MROW!
  M(d23, d25, 'mystery', 0.45, 'swell', 'cut'),         // Zoe's trace: he's a PERSON, typing from somewhere REAL
  M(d25, d27, 'power', 0.55, 'cut', 'cut'),             // "Then I'm going there." ;tp me to Admin
  M(d27, END, 'climax', 0.7, 'cut', 'sting'),           // battery 3% countdown tension -> TELEPORT ME TO THE ADMIN! -> white
];

// ================================================================= AMBIENCE (beds per location)
const B = (start, end, name, gain_db) => ({ start: r3(start), end: r3(end), name, gain_db });
const ambience = [
  B(START, d6, 'wind', -12),               // the rooftop, high above the city
  B(START, d6, 'night', -12),              // the night city below
  B(d6, d8, 'wind', -16),                  // desert heat: a light hot breeze
  B(d8, d10, 'ocean', -6),                 // the tiny island: waves
  B(d10, d16, 'wind', -7),                 // the mountain summit: wind
  B(d16, d17, 'wind', -12),                // the time-lapse through every location
  B(d17, d19, 'wind', -12),                // the roof, the giants over the city
  B(d17, d19, 'night', -12),
  B(d19, d24, 'wind', -7),                 // flying high above the clouds
  B(d24, d25, 'wind', -16),                // Zoe's screen
  B(d25, END, 'wind', -10),                // the giant you, the laptop, the jump
  B(d25, END, 'night', -16),
];

// ================================================================= FOOTSTEPS (nobody walks: Granny's streak is a pose + fire trail)
const footsteps = [];

// ================================================================= write
const out = { scene: 'SC 08', start: r3(START), end: r3(END), music, ambience, footsteps, sfx };
const J = (x) => JSON.stringify(x);
const txt = '{\n' +
  `  "scene": ${J(out.scene)},\n  "start": ${out.start},\n  "end": ${out.end},\n` +
  `  "music": [\n${music.map((x) => '    ' + J(x)).join(',\n')}\n  ],\n` +
  `  "ambience": [\n${ambience.map((x) => '    ' + J(x)).join(',\n')}\n  ],\n` +
  `  "footsteps": [${footsteps.length ? '\n' + footsteps.map((x) => '    ' + J(x)).join(',\n') + '\n  ' : ''}],\n` +
  `  "sfx": [\n${sfx.map((x) => '    ' + J(x)).join(',\n')}\n  ]\n}\n`;
const dst = path.join(__dirname, 'sc08.json');
fs.writeFileSync(dst, txt);
console.log(`${dst}: ${music.length} music segments, ${ambience.length} beds, ${footsteps.length} footstep runs, ${sfx.length} sfx`);
