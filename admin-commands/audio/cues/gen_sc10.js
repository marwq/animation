#!/usr/bin/env node
// Sound cue sheet generator for SC 10 (ИСПРАВИТЬ ВСЁ: fixing everything at dawn, Brick, ";unadmin me").
// Every time below is computed from the voice timeline exactly like scenes/s10.js does (L(id).a / .b, .word()),
// so when the real voice replaces the provisional timeline, re-run:
//   node audio/cues/gen_sc10.js && python3 audio/validate_cues.py audio/cues/sc10.json
// Output: audio/cues/sc10.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { L } = V;

// ---------------------------------------------------------------- timing (copied from scenes/s10.js)
const START = V.scene('SC 10').start, END = V.scene('SC 11').start;   // == main.js RANGES for SC 10
const M = Array.from({ length: 22 }, (_, i) => L('10.' + i));

const tWith = M[0].word('With').t0, tCharger = M[0].word('charger').t0, tCup = M[0].word('cup').t0;
const c1 = tWith - 0.1;                                  // charger + tea
const c2 = M[1].a - 0.15;                                // ";size all cats 1" (over the shoulder)
const c3 = M[1].b + 0.06;                                // cats shrink into their owners' arms (+ ";unfly the bus")
const c4 = M[2].b + 0.12;                                // the bus lands, everybody claps
const c5 = M[3].word('flying').t0 - 0.05;                // the bath guy drops back into his bathroom
const c6 = M[3].word('every', 1).t0 - 0.1;               // "Every giant thing." — giant Pancake -> the hero's arms
const c7 = M[3].word('every', 2).t0 - 0.1;               // "Every Granny. Well. Almost every Granny."
const tWell = M[3].word('Well').t0, tGranny2 = M[3].word('Granny', 1).t0;
const c8 = M[4].a - 0.1;                                 // Granny: "Leave me fast, sweetie!"
const tBefore = M[4].word('before').t0;
const c9 = M[4].b - 0.05;                                // Dad lands in his chair | split: Mom finds the note
const c10 = M[5].word('From').t0 - 0.12;                 // "From YOU? Oh, it's official now."
const tOh = M[5].word('Oh').t0, tOfficial = M[5].word('official').t0;
const c11 = M[6].a - 0.1;                                // the empty schoolyard; Brick in the cage; ";unjail Brick"
const tBrickW = M[8].word('Brick').t1;
const c12 = M[8].word('Hey').t0 - 0.12;                  // quiet two-shot
const c13 = M[9].word('Nobody').t0 - 0.15;               // Brick close: "Nobody else does."
const c14 = M[10].a - 0.08;                              // "Oh." — "You know you could just... sit with us?"
const c15 = M[12].a - 0.1;                               // cookie two-shot
const tHalf = M[13].a, tDeal = M[14].a;
const c16 = M[15].a - 0.12;                              // server room: "The panel can keep one command for you. Forever."
const tKeep = M[15].word('keep').t0, tForever = M[15].word('Forever').t0, tAny = M[15].word('Any').t0;
const c17 = M[16].a - 0.1;                               // dreams: fast forever / big forever / never picked last
const DREAM_T = [M[16].word('fast').t0, M[16].word('Big').t0, M[16].word('Never').t0];
const c17b = M[17].a - 0.1;                              // "You think about it..."
const c18 = M[17].word('for').t0 - 0.1;                  // ...for a long time — the silent look at the family monitors
const gS = M[17].b, gE = M[18].a;                        // the silent beat
const c19 = gS + 0.36 * (gE - gS);                       // the cursor blinks, ";unadmin me" typed slowly, Enter
const tEnter = gE - 0.14;
const c20 = gE - 0.02;                                   // SYSTEM: "Admin rights... removed. Thanks for playing."
const tRemoved = M[18].word('removed').t0, tThanks = M[18].word('Thanks').t0;
const c21 = M[19].a - 0.1;                               // "Hm. In two thousand years... the second person to type that."
const c22 = M[20].a - 0.1;                               // "Who was the first?" — "Me." (wink) -> flash
const tMe = M[21].a;
const tSnap = M[13].word('HALF').t0 + 0.15;              // the cookie snaps in half
const HX = 1220, HXY = 760, BRX = 1150;                  // hero (server room), hero (schoolyard), Brick / the cage

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));          // pan from screen x
const PW = (wx, cx, z) => P(960 + z * (wx - cx));                        // world x seen by a cam at(cx, _, z)
const PK = (wx, cx, z, k) => P(960 + (1 + (z - 1) * k) * (wx - 960 - (cx - 960) * k)); // parallax layer k (CS.toScreen)
const PS = (wx) => P(960 + 0.72 * (wx - 960));                           // the dawn shop street (STREET_K = 0.72)
const KMID = 0.4;                                                        // CS.KF.mid (giant cats on the skyline)
const sfx = [];
const add = (t, name, g, pan, note) => sfx.push([r3(t), name, g, pan, note]);
// keyboard bursts (~1 s each) while the command's letters appear
function typing(t0, t1, g, pan, note) {
  for (let t = t0, k = 0; t < t1 - 0.5 || k === 0; t += 0.9, k++) add(t, 'typing', k ? g - 2 : g, pan, k ? note + ' (cont.)' : note);
}
// ENTER: key click + confirm ding
function enter(t, g, pan, note) {
  add(t, 'click', g, pan, `ENTER: ${note}`);
  add(t + 0.03, 'confirm', g - 1, pan, `confirm: ${note}`);
}

// ================================================================= SFX, shot by shot
// ---- 0. "So you go back." — flash; the hero lands on his roof at dawn (E.teleIn at START + 0.12, 0.55 s)
{
  const tLand = START + 0.12 + 0.55 * 0.55;
  add(START, 'teleport', -1, PW(960, 885, 1.05), 'teleport arrival on the roof: white flash');
  add(START + 0.12, 'whoosh_down', -6, PW(960, 885, 1.05), 'the hero drops out of the beam');
  add(tLand, 'land', -3, PW(960, 885, 1.05), 'lands on the roof (squash + dust)');
  add(START + 1.0, 'monster_growl', -16, PK(720, 890, 1.1, KMID), 'a giant cat grumbles lazily on the skyline (softened)');
}
// ---- 1. "With the old man's spare charger. And a cup of tea." — the golden charger portal, battery 1% -> 100%, a sip
{
  const pp = PW(1240, 1005, 1.9), pl = PW(1030, 1005, 1.9);
  add(c1, 'portal_open', -5, pp, 'the little golden charger portal swirls open');
  add(tCharger - 0.15, 'whoosh', -9, pp, 'the cable snakes out of the portal');
  add(tCharger + 0.2, 'click', -3, pl, 'the charger plugs into the laptop');
  add(tCharger + 0.22, 'electric', -11, pl, 'charging zap');
  add(tCharger + 0.12, 'upgrade', -6, pl, 'battery charging 1% -> 100%');
  add(tCharger + 0.1, 'money_counter', -11, pl, 'battery % rolls up');
  add(tCharger + 0.75, 'money_counter', -12, pl, 'battery % rolls up (cont.)');
  add(tCharger + 1.3, 'level_up', -3, P(1500), "'100%!' bang");
  add(tCup - 0.15, 'glass', -10, PW(940, 1000, 1.95), 'the teacup lifted');
  add(tCup + 0.3, 'gulp', -7, P(700), "'sip'");
}
// ---- 2. ";size all cats 1" — over the shoulder, typed carefully; command bursts on every giant cat
{
  const pc = P(1180);
  add(c2 + 0.02, 'chat_pop', -6, pc, 'chat bar pops');
  typing(M[1].a, M[1].b, -4, pc, "careful typing ';size all cats 1'");
  enter(M[1].b - 0.02, -2, pc, ';size all cats 1');
  [720, 1100, 1328, 420].forEach((gx, i) => add(M[1].b + i * 0.06, 'pop', -10, PK(gx, 1020, 1.22, KMID), `command burst on giant cat ${i + 1}`));
  add(M[1].b + 0.04, 'harp_down', -3, 0, 'size-down: every cat starts shrinking');
}
// ---- 3. the giant cats on the shop roofs shrink into their owners' arms (+ ";unfly the bus" typed meanwhile)
{
  add(c3 - 0.12, 'whoosh', -5, 0.21, 'whip-pan to the shop street');
  const ROOF = [[-620, 0.0, null], [380, 0.12, 560], [1560, 0.48, 1380], [2520, 0.78, null]];
  ROOF.forEach(([x, d, owner], i) => {
    const t0 = c3 + d;
    if (!owner) {
      add(t0 + 0.02, 'poof', -6, PS(x), `roof cat ${i + 1} shrinks away in a poof`);
      add(t0 + 0.05, 'powerdown', -11, PS(x), 'size-down');
    } else {
      add(t0, i === 1 ? 'harp_down' : 'powerdown', -6, PS(x), `roof cat ${i + 1} shrinks and drops`);
      add(t0 + 0.55, 'pop', -8, PS(owner), 'the kitten lands in its owner\'s arms');
      add(t0 + 0.6, 'heart_pop', -9, PS(owner), 'hug: a heart pops');
    }
  });
  add(Math.max(c3 + 0.02, M[2].a - 0.25), 'chat_pop', -8, P(460), "next chat bar pops: ';unfly the bus'");
  typing(M[2].a, M[2].b, -4, P(460), "typing ';unfly the bus'");
  enter(M[2].b, -3, P(460), ';unfly the bus');
}
// ---- 4. "You bring back every flying thing." — the bus floats down onto the street; everybody claps
{
  const pb = PW(1040, 1005, 1.45);
  add(c4, 'powerdown', -5, pb, 'unfly: the bus stops floating');
  add(c4 + 0.05, 'whoosh_down', -4, pb, 'the bus sinks down to the street');
  add(c4 + 0.68, 'thud', 1, pb, 'the bus lands (squash + dust)');
  add(c4 + 0.7, 'metal_clank', -5, pb, 'bus suspension clunks');
  add(c4 + 0.75, 'slap', -6, P(760), "'CLAP!'");
  add(c4 + 0.78, 'applause', -6, pb, 'the passengers applaud');
  add(c4 + 0.95, 'slap', -7, P(1280), "'CLAP!'");
}
// ---- 5. the bath guy drops back into his own bathroom — PLOP
add(c5, 'slide_down', -4, 0, 'the bath guy drops through the ceiling hole');
add(c5 + 0.4, 'big_splash', 3, 0, 'he lands in his own tub (shake)');
add(c5 + 0.43, 'pop', -1, P(1400), "'PLOP!' bang");
add(c5 + 0.6, 'bubbles', -12, 0, 'bath bubbles settle');
// ---- 6. "Every giant thing." — the skyline giants poof away, giant Pancake shrinks right into the hero's arms
{
  [[0, 720], [1, 1100], [3, 420]].forEach(([i, gx]) => add(c6 + 0.05 + i * 0.12, 'poof', -10, PK(gx, 1080, 1.28, KMID), `skyline giant cat ${i + 1} poofs small`));
  const t0 = c6 + 0.12, pp = PK(1328, 1080, 1.28, KMID), ph = PW(960, 1060, 1.35);
  add(t0, 'poof', 2, pp, 'giant Pancake: POOF!');
  add(t0 + 0.02, 'harp_down', -3, pp, 'size-down: Pancake shrinks');
  add(t0 + 0.25, 'whoosh', -7, r3((pp + ph) / 2), 'Pancake arcs through the air');
  add(t0 + 0.75, 'body_fall', -5, ph, "'flomp' into the hero's arms");
}
// ---- 7. "Every Granny. Well. Almost every Granny." — ";unspeed Granny" typed... a fire streak... SCREECH
{
  const ws = M[3].words;
  add(c7 + 0.02, 'chat_pop', -8, P(680), 'chat bar pops');
  typing(ws[9][1], ws[10][2], -4, P(680), "typing ';unspeed Granny' (no ENTER)");
  add(tWell + 0.02, 'whoosh_long', 0, 0, "'Well.' a fire streak tears across the sky");
  add(tWell + 0.05, 'jetpack', -7, 0, 'the fire trail roars');
  add(tGranny2 - 0.55, 'whoosh', -2, 0.6, 'Granny blazes in from the right');
  add(tGranny2 - 0.05, 'skid', 3, PW(1300, 1040, 1.38), "'SCREECH!' Granny stops dead (shake)");
  add(tGranny2 + 0.2, 'steam_hiss', -9, PW(1360, 1040, 1.38), 'the fire trail fizzles out');
}
// ---- 8. Granny: "Leave me fast, sweetie! I've never been early before!" — the command backspaces; she zooms away
{
  typing(M[4].word('never').t0, tBefore, -9, P(700), "';unspeed Granny' backspaced away");
  add(tBefore - 0.05, 'whoosh_long', 1, -0.3, 'Granny rockets off to the left');
  add(tBefore, 'jetpack', -6, -0.3, 'her fire trail');
  add(tBefore + 0.05, 'orch_hit', -6, P(520), "'WHOOSH!' bang");
  add(tBefore + 0.12, 'swish', -11, PW(900, 1080, 1.7), "the hero's head whips after her");
}
// ---- 9. Dad drops into his chair, still on the call | split: Mom finds a sticky note
{
  const pd = PW(640, 570, 1.45);
  add(c9, 'whoosh_down', -5, pd, 'Dad drops out of the sky');
  add(c9 + 0.28, 'body_fall', -2, pd, 'Dad lands in his chair');
  add(c9 + 0.3, 'squeak', -7, pd, 'the chair springs squeak');
  add(c9 + 0.31, 'pop', -4, P(880), "'PLOP' bang");
  add(M[5].a - 0.12, 'whoosh', -5, 0.35, 'split screen slides in: Mom');
  add(M[5].a + 0.05, 'paper', -12, P(1360), 'Mom turns the sticky note over');
}
// ---- 10. "From YOU? Oh, it's official now." — she sticks it on the fridge
{
  const pm = PW(1250, 1390, 1.7), pf = PW(1478, 1375, 1.63);
  add(tOh - 0.2, 'swish', -12, 0, 'camera eases back');
  add(tOh + 0.1, 'blush', -6, pm, 'Mom blushes');
  add(tOfficial - 0.35, 'swish', -11, pf, 'the note goes onto the fridge door');
  add(tOfficial - 0.02, 'slap', -6, pf, 'note slapped on the fridge');
  add(tOfficial, 'stamp', 1, P(1500), "'OFFICIAL!' bang (shake)");
  add(tOfficial + 0.12, 'heart_pop', -7, pm, 'hearts around Mom');
}
// ---- 11. "And then... Brick." — the empty schoolyard; the hero walks in; ";unjail Brick" — the cage dissolves
{
  const pc = PW(700, 930, 1.28), pb = PW(BRX, 930, 1.28);
  add(M[8].a - 0.25, 'chat_pop', -11, pc, 'chat bar pops (small)');
  typing(M[8].a, tBrickW, -9, pc, "soft typing ';unjail Brick'");
  enter(tBrickW, -6, pc, ';unjail Brick');
  add(tBrickW + 0.05, 'sparkle', -6, pb, 'the cage dissolves in a green burst');
  add(tBrickW + 0.1, 'metal_clank', -13, pb, 'the bars fade');
  add(tBrickW + 0.4, 'cloth', -13, pb, 'Brick slowly stands up');
}
// ---- 15. "...Can I still have the cookie?" — "HALF the cookie." — "...Deal."
{
  add(M[12].b - 0.1, 'cloth', -13, PW(820, 965, 1.33), 'the hero holds out the cookie');
  add(tSnap, 'egg_crack', -4, PW(820, 965, 1.36), "'SNAP!' the cookie breaks in half");
  add(tDeal - 0.15, 'swish', -13, PW(1090, 970, 1.42), 'Brick takes his half');
  add(tDeal + 0.02, 'chime', -9, PW(1300, 970, 1.45), 'warm rays + sparkles: Brick smiles');
}
// ---- 16. server room: "One last thing. The panel can keep one command for you. Forever. Any command you want."
{
  const ps = PW(HX - 160, 880, 1.25);
  add(c16 + 0.05, 'swish', -13, PW(480, 870, 1.22), "the old man's finger goes up");
  add(tKeep - 0.1, 'ui_pop', -4, ps, "'KEEP 1 COMMAND' slot pops");
  add(tForever, 'shine', -4, PW(HX + 60, 890, 1.27), "'∞' scales in: Forever");
  add(tForever + 0.05, 'magic', -10, PW(HX + 140, 890, 1.27), 'sparkles around the slot');
  add(tAny - 0.3, 'equip', -7, PW(HX, 900, 1.28), 'the laptop opens to the command chips');
  add(tAny - 0.25, 'ui_close', -9, ps, 'the slot closes');
}
// ---- 17. "You could be fast forever. Big forever. Never picked last again." — dream bubbles
{
  const FX = [['whoosh', 'fast forever: running with speed lines'], ['upgrade', 'big forever: a giant you'], ['tada', "never picked last: '#1 PICK!'"]];
  add(c17, 'harp_up', -9, 0, 'dreamy: the thought bubbles begin');
  DREAM_T.forEach((w, i) => {
    const pan = P([300, 960, 1620][i]);
    add(w - 0.15, 'pop', -5, pan, `dream bubble ${i + 1} pops`);
    add(w + 0.05, FX[i][0], -11, pan, FX[i][1]);
  });
}
// ---- 17b. "You think about it..." — the bubbles fade
add(c17b, 'harp_down', -13, 0, 'the dream bubbles fade away');
// ---- 18. the silent beat (c18 .. c19 + 0.3): NO sfx at all, only room tone
// ---- 19. ";unadmin me" — slowly. Enter.
typing(c19 + 0.3, tEnter - 0.06, -9, 0, "slowly typing ';unadmin me'");
enter(tEnter, -4, 0, ';unadmin me');
add(tEnter + 0.02, 'shine', -8, 0, 'white flash on ENTER');
// ---- 20. "Admin rights... removed. Thanks for playing." — the gold drains out of the laptop back to the crown
{
  const ph = PW(HX, 1485, 1.27), pcr = PW(1834, 1492, 1.29);
  add(c20 + 0.1, 'powerdown', -2, ph, 'admin rights drain out of the laptop');
  add(c20 + 0.3, 'magic', -8, 0, 'golden particles stream to the crown');
  add(tRemoved - 0.15, 'ui_pop', -4, PW(1250, 1485, 1.27), "'Admin rights removed.' system box");
  add(tThanks - 0.2, 'sparkle', -3, pcr, 'the crown sparks: rays + sparkles');
  add(tThanks - 0.05, 'notify', -7, PW(1250, 1490, 1.29), "'Thanks for playing! :)' line");
  add(tThanks + 0.05, 'chime', -9, pcr, 'the crown glows');
}
// ---- 21. "Hm. In two thousand years..." — proud nod, sparkles
add(c21 + 0.15, 'sparkle', -13, 0, 'the old man glows with pride');
// ---- 22. "Who was the first?" — "Me." (wink) -> flash into the morning
add(tMe - 0.1, 'zoom_in', -7, -0.2, 'push-in on the old man');
add(tMe - 0.02, 'blink', -6, P(600), 'the wink');
add(tMe + 0.02, 'shine', -1, P(690), "cheeky sparkle 'ting' on the wink: 'Me.'");
add(END - 0.45, 'teleport', -2, 0, 'white flash: back home');

sfx.sort((p, q) => p[0] - q[0]);

// ================================================================= MUSIC (tiles [START, END])
const M_ = (start, end, mood, energy, inn, out) => ({ start: r3(start), end: r3(end), mood, energy, in: inn, out });
const music = [
  M_(START, tWell, 'hook', 0.65, 'swell', 'tapestop'),      // dawn repair montage: charger, cats, bus, bath, Pancake, "Every Granny."
  M_(tWell, tGranny2, 'silence', 0, 'cut', 'cut'),          // "Well." — the fire streak
  M_(tGranny2, c9, 'playful', 0.6, 'cut', 'cut'),           // SCREECH! "Leave me fast, sweetie!" WHOOSH
  M_(c9, c11, 'warm', 0.45, 'cut', 'fade'),                 // Dad lands in his chair, Mom's sticky note: "official now"
  M_(c11, c16, 'tender', 0.3, 'fade', 'fade'),              // Brick: "Nobody else does." ... HALF the cookie ... "Deal."
  M_(c16, c17, 'mystic', 0.4, 'fade', 'cut'),               // "The panel can keep one command for you. Forever."
  M_(c17, c18, 'wonder', 0.45, 'cut', 'fade'),              // dream bubbles: fast / big / picked first -> "You think about it..."
  M_(c18, tEnter, 'silence', 0, 'cut', 'cut'),              // the TRUE silent beat: the family on the monitors, ";unadmin me"
  M_(tEnter, END, 'tender', 0.35, 'swell', 'sting'),        // Admin rights removed ... "Me." -> button on the flash
];

// ================================================================= AMBIENCE (beds per location)
const B = (start, end, name, gain_db) => ({ start: r3(start), end: r3(end), name, gain_db });
const ambience = [
  B(START, c3, 'birds', -10),              // the roof at dawn
  B(START, c3, 'town', -16),
  B(START, c3, 'wind', -14),
  B(c1, c2, 'portal_hum', -15),            // the charger portal
  B(c3, c5, 'birds', -10),                 // the shop street / the bus
  B(c3, c5, 'town', -13),
  B(c5, c6, 'room', -12),                  // the bathroom
  B(c6, c9, 'birds', -10),                 // back on the roof
  B(c6, c9, 'town', -16),
  B(c6, c9, 'wind', -14),
  B(c9, c11, 'room', -12),                 // home: Dad's living room
  B(M[5].a - 0.12, c11, 'kitchen', -13),   // Mom's kitchen
  B(c11, c16, 'birds', -13),               // the empty schoolyard at dawn
  B(c16, END, 'vault_hum', -15),           // the server room
  B(c16, END, 'room', -17),
];

// ================================================================= FOOTSTEPS
const footsteps = [
  // Granny blazes in: A.run(t * 40) -> a step every PI/40 s (0.0785; the mixer floor is 0.08)
  { start: r3(tGranny2 - 0.55), end: r3(tGranny2), interval: 0.08, surface: 'hard', gain_db: -11, pan: 0.4 },
  // ...and zooms off again
  { start: r3(tBefore), end: r3(tBefore + 0.45), interval: 0.08, surface: 'hard', gain_db: -11, pan: -0.3 },
  // the hero walks into the empty schoolyard: A.walk((t - c11) * 9) -> a step every PI/9 s
  { start: r3(c11), end: r3(M[7].a - 0.2), interval: r3(Math.PI / 9), surface: 'hard', gain_db: -12, pan: PW(300, 950, 1.04) },
];

// ================================================================= sanity: the beats must match the scene module's own
try {
  const sb = require('../../scenes/s10').beats;
  const mine = { c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16, c17, c17b, c18, c19, c20, c21, c22, START, END };
  for (const k of Object.keys(mine)) if (Math.abs(sb[k] - mine[k]) > 1e-6) console.warn(`WARN beat ${k}: scene ${sb[k]} != generator ${mine[k]} (re-copy the timing block from scenes/s10.js)`);
} catch (e) { console.warn('(could not cross-check against scenes/s10.js: ' + e.message + ')'); }

// ================================================================= write
const out = { scene: 'SC 10', start: r3(START), end: r3(END), music, ambience, footsteps, sfx };
const J = (x) => JSON.stringify(x);
const txt = '{\n' +
  `  "scene": ${J(out.scene)},\n  "start": ${out.start},\n  "end": ${out.end},\n` +
  `  "music": [\n${music.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "ambience": [\n${ambience.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "footsteps": [\n${footsteps.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "sfx": [\n${sfx.map((m) => '    ' + J(m)).join(',\n')}\n  ]\n}\n`;
const dst = path.join(__dirname, 'sc10.json');
fs.writeFileSync(dst, txt);
console.log(`${dst}: ${music.length} music segments, ${ambience.length} beds, ${footsteps.length} footstep runs, ${sfx.length} sfx`);
