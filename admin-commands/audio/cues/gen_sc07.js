#!/usr/bin/env node
// Sound cue sheet generator for SC 07 (АДМИН: the sky cracks, the biggest chat message ever, the ADMIN, the charge sheet,
// ";unfly all" -> the cats catch everyone, ";kick you" -> pixels, ";god me" -> gold, VS card -> FIGHT!).
// Every time below is computed from the voice timeline exactly like scenes/s07.js does (L(id).a / .b, .word()),
// so when the real voice replaces the provisional timeline, re-run:
//   node audio/cues/gen_sc07.js && python3 audio/validate_cues.py audio/cues/sc07.json
// Output: audio/cues/sc07.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { L } = V;

// ---------------------------------------------------------------- timing (copied from scenes/s07.js)
const lerp = (a, b, k) => a + (b - a) * k;
const START = V.scene('SC 07').start, END = V.scene('SC 08').start;   // == main.js RANGES for SC 07
const m = Array.from({ length: 12 }, (_, i) => L('07.' + i));
const Wd = (i, w, n = 0) => m[i].word(w, n).t0;
const We = (i, w, n = 0) => m[i].word(w, n).t1;

const c1 = Wd(0, 'The', 1) - 0.1;           // B  the biggest chat message (rooftop, low angle)
const c2 = m[1].a - 0.1;                    // C  the Admin: "Who. Gave you. Admin?"
const c3 = m[2].a - 0.1;                    // D  "...A garage sale?"
const c4 = m[3].a - 0.1;                    // E1 the bus
const c5 = Wd(3, 'You', 1) - 0.1;           // E2 the jailed child
const c6 = Wd(3, 'You', 2) - 0.1;           // E3 100,000 giant cats
const c7 = Math.min(Wd(3, 'GIANT') - 0.08, m[4].a - 0.45);   // E4 smash: his eyes
const c8 = m[4].a - 0.1;                    // F1 the log unrolls
const c8b = Wd(4, 'than') - 0.12;           // F2 ... all the way down to the street
const c9 = m[5].a - 0.1;                    // G1 "In my defense..."
const c10 = Wd(5, 'the') - 0.1;             // G2 the happy cats
const c11 = m[6].a - 0.12;                  // H  ;unfly all
const c12 = m[7].a - 0.05;                  // I  everyone hangs... and falls
const c13 = Wd(7, 'Lucky') - 0.1;           // J1 a cat catches the mailman
const c13b = Wd(7, 'VERY') - 0.3;           // J2 catches, catches, catches
const c14 = Math.min(m[7].b + 0.05, m[8].a - 1.1);   // K  set down gently + a lick (the beat)
const c15 = m[8].a - 0.1;                   // L  "And now... you."
const c16 = Wd(8, 'Kick') - 0.15;           // M  ;kick you -> dissolving
const c17 = Wd(9, 'God') - 0.1;             // N  ;god me -> gold
const c18 = Wd(10, 'dare') - 0.1;           // O1 his eyes narrow
const c19 = Wd(10, 'against') - 0.1;        // O2 the flare
const c20 = m[11].a - 0.1;                  // P1 the standoff
const c21 = Wd(11, 'admin') - 0.15;         // P2 VS card

const tCrack = Wd(0, 'crack'), tCame = Wd(0, 'came'), tMsg = Wd(0, 'message'), tBiggest = Wd(0, 'biggest');
const tFell = Wd(7, 'fell');
const tUnfly = m[6].b;                      // ENTER of ;unfly all
const tKick = m[8].b;                       // ENTER of ;kick you
const tGod = m[9].b;                        // ENTER of ;god me
const tFlare = Wd(10, 'ADMIN');
const tBegan = Wd(11, 'began');
// shot-local moments (from the shot functions)
const tRoll = Wd(5, 'really') - 0.15;       // G2: the calico flops onto its back
const tCatch = Wd(7, 'cats');               // J1: the white cat snaps the mailman out of the air
const rel = c14 + 0.55, lickA = c14 + 0.8;  // K: set down on the sidewalk, the lick starts
const tYou = Wd(8, 'you');                  // L2: the giant finger comes down at you

// typing span of a command / chat = K.typeProgress(t, line, from, to): from word t0 to word t1
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
// camK(X, Y, zEff, k) in s07: the layer k is seen at zoom zEff centred on X
const PC = (wx, X, zEff) => P(960 + zEff * (wx - X));
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

// ================================================================= SFX, shot by shot
// ---- A. the crack: a chat window squeezes out of the hole and hangs in the sky
add(START, 'thunder', -3, 0, 'white flash: the cracked sky rumbles over the city');
add(tCrack - 0.03, 'glass', 0, 0, "'...crack': the crack splinters wider (shake + flash)");
add(tCrack, 'rumble', -3, 0, 'crack shake');
add(tCame - 0.1, 'portal_open', -3, 0, 'something squeezes out of the crack');
add(tMsg - 0.02, 'chat_pop', 2, 0, 'the giant chat window pops out of the crack');
add(tMsg + 0.02, 'sub_drop', -3, 0, 'its weight hangs over the city');
add(tMsg + 0.1, 'notify', -2, 0, "chat 'ding' — the biggest message ever");
// ---- B. rooftop low angle: the window comes down until it covers the sky; the hero is TINY
add(c1, 'rumble', -5, 0, 'the window descends over the rooftop');
add(c1 + 0.15, 'whoosh_long', -6, 0, 'the huge window slides down the sky');
add(tBiggest - 0.03, 'boom', -1, 0, "'biggest': the window swells even bigger");
add(Wd(0, 'ever') - 0.1, 'gulp', -7, 0, 'tiny you, staring up');
add(c2 - 1.5, 'reverse_swell', -4, 0, 'light of something BIG builds behind the window');
add(c2 - 1.2, 'angel', -9, 0, 'divine glow behind the window');
// ---- C. the Admin rises; the sky chat types his words, a punch-in per word
{
  const w1 = Wd(1, 'Who'), w2 = Wd(1, 'Gave'), w3 = Wd(1, 'Admin');
  const pA = PK(1190, 1010, 1, 0.25), pChat = PK(560, 1010, 1, 0.12);
  add(c2 - 0.02, 'impact', 2, pA, 'white flash: the ADMIN appears (robe of code, crown, face of light)');
  add(c2 + 0.02, 'whoosh_up', -4, pA, 'he rises above the skyline');
  const [a, b] = typeSpan(m[1]);
  typing(a, b, -10, pChat, "the sky chat types 'Who. Gave you. Admin?'");
  add(w1, 'boom', -1, pA, "'Who.' shake");
  add(w2 - 0.05, 'zoom_in', -5, pA, "'Gave you.' punch-in");
  add(w2, 'boom', -2, pA, "'Gave you.' shake");
  add(w3 - 0.05, 'zoom_in', -4, pA, "'Admin?' punch-in");
  add(w3, 'boom', 2, pA, "'Admin?' big shake");
}
// ---- D. "...A garage sale?" tiny voice, spotlight, the $1 tag
add(c3 + 0.02, 'gulp', -6, 0, 'tiny nervous gulp');
add(c3 + 0.3, 'shine', -12, P(1110), 'the $1 garage-sale tag glints on the laptop');
add(Wd(2, 'sale') - 0.2, 'cloth', -9, 0, 'nervous shrug');
add(c3, 'cricket', -11, 0.3, "awkward silence on the '...'");
// ---- E1. exhibit A: the flying bus + the log ticket
{
  const tB = Wd(3, 'bus');
  add(c4 + 0.05, 'engine', -9, PW(lerp(520, 1180, 0.2), lerp(900, 1020, 0.2), 1.25), 'the flying bus drifts across the night sky');
  add(c4 + 0.4, 'dog_bark', -13, PW(380, 900, 1.25), 'a flying dog yaps');
  add(tB - 0.1, 'ui_pop', -2, P(1360), "'ADMIN LOG #0412  ;fly all' ticket pops");
  add(tB + 0.2, 'stamp', 1, P(1480), "red 'VIOLATION' stamp slams");
  add(tB + 0.22, 'error', -8, P(1480), 'VIOLATION buzz');
}
// ---- E2. exhibit B: Brick in the cage, swinging high above the city
{
  const tC = Wd(3, 'child');
  add(c5 + 0.05, 'metal_clank', -10, PW(760, 940, 1.18), 'the cage creaks on the crane cable');
  add(c5 + 0.1, 'wind_gust', -12, 0, 'wind high above the city');
  add(tC - 0.1, 'ui_pop', -2, P(1380), "'ADMIN LOG #0377  ;jail Brick' ticket pops");
  add(tC + 0.2, 'stamp', 1, P(1500), "red 'VIOLATION' stamp slams");
  add(tC + 0.22, 'error', -8, P(1500), 'VIOLATION buzz');
}
// ---- E3. exhibit C: 100,000 giant cats + the counter
{
  const tOne = Wd(3, 'one'), tCats = Wd(3, 'cats');
  add(c6 + 0.1, 'monster_growl', -13, PK(360, 820, 1.12, 0.75), 'a giant calico mrrrows (softened)');
  add(c6 + 0.5, 'snore', -14, P(1500), 'a giant siamese snores in the stadium');
  add(tOne - 0.2, 'ui_pop', -2, P(1400), "'GIANT CATS' counter pops");
  for (let t = tOne, k = 0; t < tCats - 0.2; t += 0.9, k++) add(t, 'money_counter', k ? -6 : -4, P(1400), k ? 'counter rolling (cont.)' : 'counter rolls up to 100,000');
  add(tCats, 'bell', -3, P(1400), 'counter hits 100,000');
}
// ---- E4. smash: GIANT. His eyes flare.
add(c7 - 0.05, 'zoom_in', -2, 0, "smash-zoom on the Admin's eyes");
add(c7, 'impact', 3, 0, "'GIANT.' white flash, eyes flare");
add(c7 + 0.02, 'sub_drop', 1, 0, 'GIANT weight, big shake');
// ---- F1. "Your log is longer..." the scroll unrolls from his hand
add(Wd(4, 'log') - 0.05, 'paper', -4, PK(880, 960, 1.07, 0.25), 'the log scroll starts to unroll');
add(Wd(4, 'log'), 'slide_down', -7, PK(880, 960, 1.07, 0.25), 'it unrolls... and unrolls');
add(Wd(4, 'longer') + 0.1, 'paper', -8, PK(880, 960, 1.04, 0.25), 'paper keeps rolling out of frame');
// ---- F2. "...than my beard." the log hangs down to the street and piles up
for (let k = 2; k <= 4; k += 2) add(c8b + (k / 5) * (c9 - c8b), 'paper', k === 4 ? -6 : -9, PW(1040, 1000, 1.03), `paper fold ${k} flops onto the pile`);
add(c8b + 0.05, 'thud', -10, PW(1040, 1000, 1.05), 'the scroll lands on the street');
// ---- G1. "In my defense..." finger up
add(Wd(5, 'In') - 0.05, 'swish', -8, P(1000), 'finger goes up');
// ---- G2. "...the cats look really happy." purring; one flops onto its back
{
  const X0 = 620, X1 = 700, X = (t) => lerp(X0, X1, (t - c10) / (c11 - c10));
  add(c10 + 0.05, 'rumble', -10, 0, "giant cats purring 'purr' (low rumble)");
  add(c10 + 0.1, 'monster_growl', -17, PC(330, X(c10), 1.75), 'deep purr (softened growl)');
  add(c10 + 0.15, 'pop', -9, P(1450), "'purr' lettering pops");
  add(c10 + 0.3, 'heart_pop', -10, -0.1, 'little hearts float up');
  add(tRoll, 'cloth', -8, PC(680, X(tRoll), 1.75), 'the calico tips over');
  add(tRoll + 0.28, 'body_fall', -5, PC(690, X(tRoll), 1.75), 'FLOMP: it lands on its back, wobbling');
  add(tRoll + 0.3, 'sparkle', -9, PC(700, X(tRoll), 1.75), 'happy sparkles');
  add(tRoll + 0.25, 'rumble', -6, P(1450), "'PRRR' — the big purr");
}
// ---- H. ;unfly all — the Admin types in the sky, ENTER slams the city
{
  const pA = PK(1300, 960, 1, 0.22), pChat = PK(640, 960, 1, 0.12);
  add(c11 + 0.02, 'whoosh_up', -7, pA, 'the Admin raises his arm');
  const [a, b] = typeSpan(m[6]);
  typing(a, b, -1, pChat, "the Admin types ';unfly all' in the sky (heavy)");
  add(tUnfly - 0.08, 'whoosh_down', -5, pA, 'his arm slams down on ENTER');
  enter(tUnfly, 1, pChat, ';unfly all');
  add(tUnfly, 'boom', 3, 0, 'ADMIN command: heavy hit, gold burst over the city, flash + shake');
  add(tUnfly + 0.02, 'sub_drop', 1, 0, 'ADMIN command: sub drop');
  add(tUnfly + 0.12, 'powerdown', -2, 0, 'unfly: every flyer in the city loses power');
}
// ---- I. everyone hangs in the air for a beat... and drops
{
  const items = [['mailman', 900], ['bathtub guy', 380], ['bus', 1500], ['flyer', 1250], ['flyer', 620], ['dog', 1720], ['dog', 200]];
  items.forEach(([who, x], i) => {
    if (![0, 2, 6].includes(i)) return;          // 3 of the 7 '!' pops get a blip; the rest is texture
    add(c12 + 0.15 + i * 0.05, 'pop', i ? -11 : -8, PW(x, 960, 1.18), `'!' over the ${who}`);
  });
  add(tFell - 0.3, 'blink', -8, 0, 'they all look at us...');
  add(tFell, 'fall_whistle', 0, 0, 'everyone falls at the same time');
  add(tFell + 0.02, 'whoosh_down', -2, 0, 'the drop');
  add(tFell + 0.05, 'slide_down', -8, -0.2, 'comic fall');
  add(tFell + 0.1, 'car_horn', -8, PW(1500, 960, 1.18), 'the bus honks as it drops');
  add(tFell + 0.15, 'dog_bark', -9, PW(1720, 960, 1.18), 'falling dogs yap');
  add(tFell + 0.2, 'whoosh_long', -6, 0, 'the camera falls with them onto the cats');
}
// ---- J1. "Lucky for them... cats" — a white giant cat snaps the mailman out of the air
{
  const X = lerp(990, 1010, 0.8), paw = 960 + 138 * 0.68 * 2.1 * 0.92;
  add(tCatch - 0.55, 'whoosh_down', -5, PC(paw, X, 1.3), 'the mailman tumbles down');
  add(tCatch - 0.05, 'swish', -6, PC(paw, X, 1.3), 'the paw shoots up');
  add(tCatch, 'thud', 0, PC(paw, X, 1.3), 'caught! (shake)');
  add(tCatch + 0.02, 'boing', -3, PC(paw, X, 1.3), 'the mailman bounces in the paw');
  add(tCatch + 0.02, 'pop', -3, P(1460), "'CATCH!' bang");
  add(tCatch + 0.08, 'sparkle', -9, PC(paw, X, 1.3), 'sparkles');
  add(tCatch + 0.25, 'monster_growl', -14, PC(960, X, 1.3), 'pleased giant-cat mrrp (softened)');
}
// ---- J2. "...VERY good at catching things." three catches on the words
{
  const X = 1005;
  const C = [
    { x: 420, s: 1.45, tc: Wd(7, 'VERY'), what: 'the bus' },
    { x: 990, s: 1.5, tc: Wd(7, 'catching'), what: 'the bathtub guy' },
    { x: 1580, s: 1.4, tc: Wd(7, 'things'), what: 'a dog + a flyer' },
  ];
  for (const c of C) {
    const pan = PC(c.x + 138 * 0.68 * c.s * 0.92, X, 1.15);
    add(c.tc, 'thud', -1, pan, `paw catches ${c.what} (shake)`);
    add(c.tc + 0.02, 'boing', -5, pan, 'bounce in the paw + star burst');
  }
  add(C[0].tc + 0.06, 'metal_hit', -6, PC(C[0].x + 125, X, 1.15), 'the bus clanks into the paw');
  add(C[1].tc + 0.05, 'splash', -5, PC(C[1].x + 129, X, 1.15), 'bathtub water sloshes');
  add(C[2].tc + 0.1, 'dog_bark', -6, PC(C[2].x + 121, X, 1.15), "the dog: 'arf!'");
}
// ---- K. the beat: the cat sets the mailman down... and licks his head
add(c14 + 0.05, 'monster_growl', -16, PW(850, 880, 1.45), 'the cat carries him by the collar like a kitten (soft)');
add(rel, 'land', -6, PW(800, 880, 1.5), 'set down on the sidewalk');
add(lickA + 0.05, 'splat', -8, PW(800, 880, 1.5), "SLURP: a big wet lick on the mailman's cap");
add(lickA + 0.08, 'squeak', -11, PW(800, 880, 1.5), "the mailman's squeak");
add(lickA + 0.22, 'sparkle', -13, PW(800, 880, 1.5), 'sparkles on the shiny wet cap');
// ---- L. "And now... you." — his eyes turn to you; the finger comes down; the spotlight snaps on
add(c15 + 0.1, 'heartbeat', -7, 0, 'the Admin slowly turns his eyes to you');
add(tYou - 0.12, 'whoosh_down', -2, -0.4, 'the giant finger comes down at you');
add(tYou, 'toggle', -4, PW(1120, 1020, 1.5), 'spotlight snaps on');
add(tYou + 0.03, 'boom', 2, PW(1120, 1020, 1.5), "'...you.' finger points (shake)");
add(tYou + 0.1, 'gulp', -6, PW(1120, 1020, 1.5), 'scared gulp');
// ---- M. ;kick you — ENTER, golden strike, the KICKED window, you dissolve from the feet
{
  const [a] = typeSpan(m[8], 'Kick', 'Kick');
  add(a, 'typing', -2, 0, "the sky chat types ';kick you' (heavy)");
  enter(tKick, 0, 0, ';kick you');
  add(tKick, 'boom', 3, 0, 'ADMIN command: heavy hit (shake + flash)');
  add(tKick + 0.01, 'sub_drop', 1, 0, 'ADMIN command: sub drop');
  add(tKick + 0.02, 'laser_zap', -4, 0, 'golden strike beam hits you');
  add(tKick + 0.12, 'glitch_long', 1, 0, 'kick: you start to dissolve into pixels from the feet');
  add(tKick + 0.15, 'ui_pop', -2, P(1480), "'YOU HAVE BEEN KICKED' window pops");
  add(tKick + 0.18, 'buzzer_wrong', -3, P(1480), 'DISCONNECTED: abuse of commands');
  for (let t = tKick + 0.9, k = 0; t < tGod - 0.2; t += 0.55, k++) add(t, 'glitch', -7 - (k % 2) * 2, k % 2 ? 0.15 : -0.15, 'pixels keep flaking off');
}
// ---- N. "God mode! GOD MODE ME!" — typing for your life; ENTER -> gold, the pixels fly back
{
  const [a, b] = typeSpan(m[9], 'God', 'ME');
  typing(a, b, 0, 0, "frantic typing ';god me'");
  enter(tGod, 1, 0, ';god me');
  add(tGod + 0.01, 'impact', 2, 0, 'GOLD flash + shake');
  add(tGod + 0.02, 'forcefield', 1, 0, 'god mode: the gold aura snaps on');
  add(tGod + 0.04, 'angel', -1, 0, 'heavenly choir');
  add(tGod + 0.02, 'ui_close', -4, P(1560), 'the KICKED window shrinks away');
  add(tGod + 0.06, 'pixel_wipe', -3, 0, 'the pixels fly back in');
  add(tGod + 0.15, 'level_up', -4, 0, "'GOD MODE: ON' badge pops");
}
// ---- O1. "You... dare..." his eyes narrow (extreme close-up)
add(c18 + 0.05, 'rumble', -8, 0, 'his eyes narrow');
add(Wd(10, 'use') - 0.05, 'heartbeat', -8, 0, 'menace');
add(tFlare - 1.5, 'reverse_swell', -3, 0, 'swell into the flare');
// ---- O2. "...against an ADMIN?" the flare; the sky splits further; you glow back
{
  const pA = PK(760, 980, 1.2, 0.45), pH = PK(1320, 980, 1.2, 0.75);
  add(c19 + 0.15, 'forcefield', -10, pH, 'your tiny golden glow on the rooftop');
  add(tFlare - 0.05, 'whoosh_up', -4, pA, 'his arms fly up');
  add(tFlare, 'impact', 3, pA, "'ADMIN?' the flare: white flash, rays");
  add(tFlare + 0.01, 'boom', 2, pA, 'big shake');
  add(tFlare + 0.03, 'glass', -1, 0, 'the sky splits further');
  add(tFlare + 0.1, 'thunder', -4, 0, 'the crack rumbles');
}
// ---- P1. the standoff: warm gold vs cold white-gold, wind streaks
add(c20 + 0.05, 'wind_gust', -4, 0, 'standoff wind');
add(c20 + 0.5, 'forcefield', -12, PW(470, 960, 1.1), "your aura hums");
add(Wd(11, 'first') - 0.05, 'wind_gust', -8, 0.2, 'wind');
// ---- P2. VS card: YOU vs ADMIN — ROUND 1 — FIGHT!
add(c21 - 0.12, 'whoosh', -1, 0.3, 'whip-pan into the VS card');
add(c21 + 0.02, 'whoosh_long', -3, -0.5, 'your portrait slides in from the left');
add(c21 + 0.04, 'whoosh_long', -3, 0.5, "the Admin's portrait slides in from the right");
add(c21 + 0.2, 'pop', -6, P(250), "'YOU' plate");
add(c21 + 0.25, 'pop', -6, P(1700), "'ADMIN' plate");
add(c21 + 0.22, 'orch_hit', 2, 0, "'VS' slams in");
add(tBegan - 0.55, 'bell', -1, 0, "'ROUND 1' (fight bell)");
add(tBegan - 0.02, 'orch_hit', 3, 0, "'FIGHT!' slam");
add(tBegan, 'impact', 2, 0, 'FIGHT! flash + shake');
add(tBegan + 0.02, 'cymbal', -2, 0, 'FIGHT! crash');

sfx.sort((p, q) => p[0] - q[0]);

// ================================================================= MUSIC (tiles [START, END])
const M = (start, end, mood, energy, inn, out) => ({ start: r3(start), end: r3(end), mood, energy, in: inn, out });
const music = [
  M(START, c1, 'mystic', 0.5, 'swell', 'cut'),        // the crack: a chat window squeezes out
  M(c1, c3, 'epic', 0.75, 'swell', 'sting'),          // the biggest chat message, the ADMIN: "Who. Gave you. Admin?" -> button
  M(c3, c4, 'silence', 0, 'cut', 'cut'),              // tiny voice: "...A garage sale?"
  M(c4, c10, 'climax', 0.7, 'cut', 'scratch'),        // the charge sheet: VIOLATION stamps, 100,000 cats, GIANT, the log, "In my defense..." -> scratch
  M(c10, c11, 'silence', 0, 'cut', 'cut'),            // "...the cats look really happy." purring
  M(c11, lickA, 'epic', 0.9, 'cut', 'sting'),         // ;unfly all, the fall, the cats catch everyone -> soft button on the lick
  M(lickA, c15, 'silence', 0, 'cut', 'cut'),          // the lick
  M(c15, tGod, 'glitch_build', 0.65, 'swell', 'cut'), // "And now... you." ;kick you, the pixel dissolve, "GOD MODE ME!"
  M(tGod, c20, 'power', 0.8, 'cut', 'cut'),           // gold! "You... dare...", the gold flare
  M(c20, tBegan, 'climax', 0.75, 'cut', 'sting'),     // the standoff, VS card -> fighting-game sting on FIGHT!
  M(tBegan, END, 'silence', 0, 'cut', 'cut'),         // FIGHT! tail
];

// ================================================================= AMBIENCE (beds)
const B = (start, end, name, gain_db) => ({ start: r3(start), end: r3(end), name, gain_db });
const ambience = [
  B(START, c21, 'night', -12),             // the night city below
  B(START, c21, 'wind', -13),              // wind high above the city
  B(START, c21, 'portal_hum', -19),        // the crack hums in the sky
  B(c20, c21, 'wind', -9),                 // the standoff: wind streaks
];

// ================================================================= FOOTSTEPS (nobody walks in SC 07)
const footsteps = [];

// ================================================================= write
const out = { scene: 'SC 07', start: r3(START), end: r3(END), music, ambience, footsteps, sfx };
const J = (x) => JSON.stringify(x);
const txt = '{\n' +
  `  "scene": ${J(out.scene)},\n  "start": ${out.start},\n  "end": ${out.end},\n` +
  `  "music": [\n${music.map((x) => '    ' + J(x)).join(',\n')}\n  ],\n` +
  `  "ambience": [\n${ambience.map((x) => '    ' + J(x)).join(',\n')}\n  ],\n` +
  `  "footsteps": [${footsteps.length ? '\n' + footsteps.map((x) => '    ' + J(x)).join(',\n') + '\n  ' : ''}],\n` +
  `  "sfx": [\n${sfx.map((x) => '    ' + J(x)).join(',\n')}\n  ]\n}\n`;
const dst = path.join(__dirname, 'sc07.json');
fs.writeFileSync(dst, txt);
console.log(`${dst}: ${music.length} music segments, ${ambience.length} beds, ${footsteps.length} footstep runs, ${sfx.length} sfx`);
