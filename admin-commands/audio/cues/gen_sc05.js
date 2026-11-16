#!/usr/bin/env node
// Sound cue sheet generator for SC 05 (ШКОЛА: the laptop goes to school — ;jail Brick, ;tp to the front of the line,
// ;speed me + the sonic-boom mile, ;noclip me into Principal Pratt's office, the popularity montage, Zoe's warning,
// the dark room: "Somebody... reads the logs.").
// Every time below is computed from the voice timeline exactly like scenes/s05.js does (L(id).a / .b, .word()),
// so when the real voice replaces the provisional timeline, re-run:
//   node audio/cues/gen_sc05.js && python3 audio/validate_cues.py audio/cues/sc05.json
// Output: audio/cues/sc05.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { L } = V;
const { ease, lerp, clamp } = require('../../rig/svg');

const seg = (t, a, b) => clamp((t - a) / Math.max(1e-6, b - a), 0, 1);

// ---------------------------------------------------------------- timing (copied from scenes/s05.js)
const A = Array.from({ length: 21 }, (_, i) => L('05.' + i));
const T0 = V.scene('SC 05').start, END = V.scene('SC 06').start;     // == main.js RANGES for SC 05
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;

const CUT = {};
CUT.yard = T0;
CUT.line = A[1].a - 0.32;
CUT.low = w(1, 'Lunch') - 0.12;
CUT.jail = A[2].a - 0.12;
const tJail = A[2].b + 0.02;
CUT.cage = tJail + 0.06;
const tCage = w(3, 'CAGE');
CUT.stare = A[4].a - 0.1;
const tCouldnt = w(4, "couldn't");
CUT.tp = A[5].a - 0.15;
const tTp = A[5].b + 0.02;
CUT.gym = w(6, 'The') - 0.15;
CUT.speed = A[7].a - 0.12;
const tSpeed = A[7].b + 0.02;
CUT.boom = tSpeed + 0.04;
CUT.score = w(8, 'zero') - 0.1;
const tThree = w(8, 'three');
CUT.shoes = w(8, 'Your') - 0.15;
CUT.coach = A[9].a - 0.12;
CUT.socks = w(9, 'Also') - 0.15;
CUT.cls = A[10].a - 0.1;
CUT.nclip = A[11].a - 0.12;
const tNoclip = A[11].b + 0.02;
CUT.walk = A[12].a - 0.05;
CUT.office = w(12, 'It') - 0.1;
CUT.pratt = A[13].a - 0.12;
CUT.two = w(13, 'Did') - 0.12;
CUT.no = A[14].a - 0.1;
const tAway = A[14].b + 0.02;
CUT.fall = tAway + 0.04;
CUT.pop = w(15, 'you') - 0.12;
CUT.wanted = A[16].a - 0.1;
CUT.yes = w(16, 'And') - 0.1;
CUT.fly = w(16, 'To') - 0.08;
CUT.split = w(16, 'everybody', 1) + 0.18;
CUT.kid1 = A[17].a - 0.1;
CUT.kid2 = w(17, 'No') - 0.08;
CUT.kid3 = w(17, 'No', 1) - 0.1;
CUT.zoe = w(18, 'Please') - 0.15;
CUT.logs = w(18, 'The') - 0.1;
CUT.zoe2 = w(18, 'Somebody') - 0.12;
CUT.relax = A[19].a - 0.12;
CUT.dark = A[20].a - 0.1;
CUT.eyes = w(20, 'the') - 0.06;
// keep the cuts in order even if the real voice squeezes them (min 0.2 s per shot)
{
  const ks = Object.keys(CUT);
  for (let i = 1; i < ks.length; i++) if (CUT[ks[i]] < CUT[ks[i - 1]] + 0.2) CUT[ks[i]] = CUT[ks[i - 1]] + 0.2;
}
const tFlyKid = w(17, 'No') - 0.16, tGiant = w1(17, 'GIANT') + 0.02, tBoth = A[17].b + 0.02;
const WHIPS = [[CUT.line, 1], [CUT.gym, 1], [CUT.cls, 1], [CUT.pop, 1], [CUT.wanted, 1], [CUT.zoe, 1], [CUT.fly, 1], [CUT.split, -1]];

// typing span of a command bar = K.typeProgress(t, line, from, to): from word t0 to word t1
function typeSpan(line, from = 0, to = null) {
  const ws = line.words;
  const key = (x) => x[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const i0 = typeof from === 'number' ? from : ws.findIndex((x) => key(x) === from.toLowerCase());
  const i1 = to === null ? ws.length - 1 : typeof to === 'number' ? to : ws.findIndex((x, i) => i >= i0 && key(x) === to.toLowerCase());
  return [ws[Math.max(0, i0)][1], ws[Math.max(0, i1)][2]];
}
// kit.camKeys (default ease.inOut)
function camKeys(t, keys, easing = ease.inOut) {
  if (t <= keys[0][0]) return { ...keys[0][1] };
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i], [t1, b] = keys[i + 1];
    if (t <= t1) {
      const u = easing(seg(t, t0, t1));
      const o = {};
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) o[k] = lerp(a[k] ?? b[k], b[k] ?? a[k], u);
      return o;
    }
  }
  return { ...keys[keys.length - 1][1] };
}

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));               // pan from screen x
const PC = (wx, cam) => P(960 + (cam.zoom ?? 1) * (wx - 960 - (cam.x || 0))); // world x seen through a scene cam {zoom, x}
const sfx = [];
const add = (t, name, g, pan, note) => sfx.push([r3(t), name, g, pan, note]);
// keyboard bursts (~1 s each) while the command's letters appear
function typing(t0, t1, g, pan, note) {
  for (let t = t0, k = 0; t < t1 - 0.5 || k === 0; t += 0.9, k++) add(t, 'typing', k ? g - 2 : g, pan, k ? note + ' (cont.)' : note);
}
// ENTER: key click + confirm ding
function enter(t, g, pan, note) {
  add(t, 'click', g - 2, pan, `ENTER: ${note}`);
  add(t + 0.03, 'confirm', g, pan, `confirm: ${note}`);
}

// ================================================================= SFX, shot by shot
// whip-pans (scene router + shFly/shSplit: whip() over tc ± 0.1)
for (const [tc, d] of WHIPS) add(tc - 0.12, 'whoosh', -3, r3(0.3 * d), 'whip-pan');

// ---- 1. the schoolyard: you walk in with the laptop, turn to camera on "laptop"
const tLap = w(0, 'laptop'), tStop = tLap - 0.25;
const yardCam = (t) => { const u = ease.inOut(seg(t, CUT.yard + 0.25, tLap - 0.05)); const hx = lerp(-160, 900, seg(t, CUT.yard, tStop)); return { zoom: lerp(1.42, 1.5, u), x: lerp(40, hx - 900, u) }; };
const yardHeroPan = (t) => PC(lerp(-160, 900, seg(t, CUT.yard, tStop)), yardCam(t));
add(T0 + 0.25, 'bell', -12, 0.3, 'school bell rings across the schoolyard (establishing)');
add(tStop, 'swish', -10, yardHeroPan(tStop), 'you stop and spin to face the camera');
add(tLap, 'shine', -4, yardHeroPan(tLap), 'the laptop glows on "laptop"');
add(tLap + 0.05, 'sparkle', -8, yardHeroPan(tLap), 'green sparkles pop over the laptop');

// ---- 2. the lunch line: Brick barges in, SHOVE!
const tMove1 = w(1, 'Move');
const lineCam = { zoom: 1.2, x: 170 };
add(tMove1 - 0.02, 'punch', -1, PC(1000, lineCam), 'SHOVE! Brick body-checks you out of line');
add(tMove1, 'thud', -6, PC(1380, lineCam), 'shove: camera shake + dust puff');
add(tMove1 + 0.02, 'boing', -8, PC(1000, lineCam), 'you squash-wobble from the shove');
add(tMove1 + 0.06, 'squeak', -8, PC(940, lineCam), 'your sneakers squeak as you slide back');

// ---- 3. low angle: "Lunch money."
add(CUT.low, 'boom', -6, P(1180), 'low angle: Brick looms over you');
add(CUT.low + 0.1, 'cloth', -8, P(1180), 'Brick holds out his hand ("Lunch money.")');

// ---- 4. ;jail Brick (the command types, ENTER)
{
  const [a, b] = typeSpan(A[2], 'Jail', 'Brick');
  add(CUT.jail, 'ui_pop', -6, 0, "the ';jail Brick' command bar pops in");
  typing(a, b, -3, 0, "typing ';jail Brick'");
  enter(tJail, -1, 0, ';jail Brick');
  add(tJail + 0.02, 'zoom_in', -4, 0, 'zoom lines burst around your smirk');
}

// ---- 5. the cage slams down; "Who put a CAGE on me?!"
const tLand = tJail + 0.46 * 0.7;
const pB = PC(1380, { zoom: 1.08, x: 260 });
add(tJail + 0.08, 'whoosh_down', -2, pB, 'the cage drops out of nowhere');
add(tLand, 'metal_hit', 3, pB, 'SLAM! the cage slams down over Brick (flash + big shake)');
add(tLand + 0.03, 'thud', -2, pB, 'the floor shakes');
add(tLand + 0.08, 'metal_clank', -3, pB, 'cage bars rattle');
add(tLand + 0.15, 'stamp', -2, pB, 'JAILED');
add(tLand + 0.05, 'jump', -10, P(700), 'kids and the lunch lady jump in fright');
for (let t = w(3, 'Who'), k = 0; t < CUT.stare - 0.15; t += 0.33, k++) {
  if (Math.abs(t - tCage) < 0.12) continue;
  add(t, 'metal_clank', k % 2 ? -9 : -7, pB, 'Brick grabs the bars and shakes the cage');
}
add(tCage - 0.07, 'zoom_in', -2, 0, 'smash-zoom on "CAGE"');
add(tCage, 'boom', -3, 0, 'flash + shake on "CAGE"');

// ---- 6. everybody stares; smash-zoom on "couldn't move"
{
  const med = { zoom: 1.18, x: 300 };
  add(w(4, 'first'), 'camera_flash', -6, PC(750, med), 'a kid snaps a photo of caged Brick');
  add(w(4, 'ever'), 'camera_flash', -7, PC(750, med), '...and another one');
  add(tCouldnt - 0.07, 'zoom_in', -2, 0, 'smash-zoom on "couldn\'t move"');
  add(tCouldnt + 0.05, 'metal_clank', -5, 0, 'NNNGH! Brick strains against the bars');
  add(tCouldnt + 0.3, 'metal_clank', -8, 0, 'straining (bars creak)');
  add(w(4, 'move') + 0.15, 'slide_down', -6, 0, 'Brick gives up and sags');
}

// ---- 7. ;tp me to the front of the line -> pop! the lunch lady jumps (EEK!)
{
  const [a, b] = typeSpan(A[5], 'Teleport', 'line');
  const cam = { zoom: 1.19, x: 745 };
  add(CUT.tp, 'ui_pop', -6, 0, "the ';tp me to front of line' command bar pops in");
  typing(a, b, -4, 0, "typing ';tp me to front of line'");
  enter(tTp, -1, 0, ';tp me to front of line');
  add(tTp + 0.02, 'teleport', 1, r3((PC(900, cam) + PC(1880, cam)) / 2), 'teleport: you vanish from your spot in line...');
  add(tTp + 0.06, 'thud', -9, 0, 'little camera shake');
  add(tTp + 0.08, 'pop', -3, PC(1880, cam), '...and pop out at the very front');
  add(tTp + 0.12, 'boing', -5, PC(1800, cam), 'the lunch lady jumps out of her skin');
  add(tTp + 0.18, 'squeak', -3, PC(1580, cam), 'EEK!');
  add(tTp + 0.2, 'swish', -9, PC(1800, cam), 'her ladle flips through the air');
  add(tTp + 0.7, 'land', -8, PC(1800, cam), 'she lands again');
}

// ---- 8. gym: "The mile run." TWEEET!
const tRun = w(6, 'run');
add(tRun - 0.1, 'slide_up', -1, PC(270, { zoom: 1.22, x: -380 }), 'TWEEET! Coach blows the whistle');
add(tSpeed + 0.02 - 1.5, 'reverse_swell', -4, 0, 'swell into the sonic boom');

// ---- 9. "Speed me." (whisper; the laptop on the track)
{
  const [a, b] = typeSpan(A[7], 'Speed', 'me');
  add(CUT.speed, 'ui_pop', -8, 0, "the ';speed me' command bar pops in");
  typing(a, b, -6, 0, "typing ';speed me' (whisper)");
  enter(tSpeed, -2, 0, ';speed me');
  add(tSpeed + 0.01, 'zoom_in', -3, 0, 'zoom lines');
}

// ---- 10. SONIC BOOM: 4 laps in half a second, runners blown over, the whistle melts, skid stop
{
  const cam = { zoom: 1.04, x: -20 };
  const tStopRun = tSpeed + 0.6;
  add(tSpeed + 0.02, 'impact', 3, 0, 'BOOM! sonic boom (white flash, big shake)');
  add(tSpeed + 0.03, 'wind_gust', -2, 0, 'the shockwave ring blasts across the gym');
  add(tSpeed + 0.05, 'whoosh_long', 0, 0, 'you streak around the track: a fire trail');
  add(tSpeed + 0.05, 'ui_pop', -9, P(250), 'LAP 1/4 counter pops');
  for (let k = 1; k <= 3; k++) {
    const t = tSpeed + 0.05 + 0.55 * k / 4;
    add(t, 'countdown_tick', -10, P(250), `LAP ${k + 1}/4`);
    if (k !== 2) add(t, 'whoosh', -4, k === 1 ? -0.3 : 0.3, 'another lap whips past');
  }
  add(tSpeed + 0.15, 'sizzle', -6, PC(240, cam), "the coach's whistle starts melting");
  add(tSpeed + 0.35, 'slide_down', -7, PC(240, cam), 'the melting whistle droops and drips');
  add(tSpeed + 0.4, 'body_fall', -4, PC(880, cam), 'the other runners get blown over');
  add(tStopRun, 'skid', 0, PC(1560, cam), 'speed: you skid to a stop');
  add(tStopRun + 0.1, 'steam_hiss', -6, PC(1560, cam), 'your shoes are smoking');
  add(tStopRun + 0.3, 'boing', -12, PC(1560, cam), 'little squash-wobble');
}

// ---- 11. the scoreboard: 0:00.3, NEW RECORD!
add(tThree - 0.07, 'zoom_in', -1, 0, 'smash-zoom on the scoreboard');
add(tThree, 'beep', -3, 0, 'the scoreboard flips to 0:00.3');
add(tThree + 0.05, 'sparkle', -8, 0, 'sparkles round the scoreboard');
add(tThree + 0.15, 'achievement', -2, 0, 'NEW RECORD! banner');

// ---- 12. close-up: the shoes do not survive (burn, crumble to ash; socks, toes wiggle)
{
  const tSh = w(8, 'shoes'), tNot = w(8, 'not'), tSurv = w(8, 'survive');
  add(tSh, 'whoosh', -3, 0, 'FWOOSH: the sneakers catch fire');
  add(tSh + 0.05, 'sizzle', -2, 0, 'the sneakers char and glow');
  add(tSh + 0.3, 'steam_hiss', -6, P(1220), 'smoke pours off the shoes');
  add(tNot, 'egg_crack', -3, P(700), 'the shoes crack');
  add(tNot + 0.08, 'stone', -4, P(1220), '*crumble*: they fall apart into ash chunks');
  add(tSurv + 0.05, 'paper', -10, 0, 'ash flakes settle');
  add(tSurv + 0.1, 'squeak', -8, P(760), 'toes wiggle through the socks');
  add(tSurv + 0.4, 'squeak', -10, P(1280), '...wiggle');
}

// ---- 13. Coach: "That's... a new world record." (melted whistle, stopwatch)
{
  const tRec = w(9, 'record');
  add(CUT.coach + 0.15, 'steam_hiss', -12, P(830), 'the melted whistle is still smoking');
  add(tRec, 'countdown_tick', -8, P(1210), 'the stopwatch shakes: 0:00.3');
  add(tRec, 'shine', -4, P(1420), 'WORLD RECORD! pops');
  add(tRec + 0.05, 'sparkle', -8, P(1400), 'sparkles');
}

// ---- 14. "Also... where are your shoes?" — socks, two burnt soles smoking behind you (+1 s silent beat)
const tShoes9 = w(9, 'shoes');
const tStab = A[9].b + 0.08;                           // comic music sting right after "shoes?"
{
  const cam = { zoom: 1.32, x: -60 };
  add(CUT.socks + 0.1, 'sizzle', -12, PC(1375, cam), 'two burnt soles smoking behind you');
  add(tShoes9, 'squeak', -8, PC(1080, cam), 'you look down: toes wiggle');
  add(tShoes9 + 0.3, 'squeak', -10, PC(1080, cam), '...wiggle');
  add(tShoes9 + 0.62, 'gulp', -6, PC(1080, cam), 'nervous gulp (sweat)');
  add(tStab + 0.35, 'cricket', -8, 0, 'awkward silent beat, standing in your socks');
}

// ---- 15. "Math test. You didn't study."
{
  const tStudy = w(10, 'study');
  add(CUT.cls + 0.25, 'paper', -12, -0.2, 'test papers rustle, everyone scribbling');
  add(CUT.cls + 1.1, 'paper', -14, 0.3, 'pencils scribble');
  add(tStudy - 0.05, 'zoom_in', -4, 0, 'push-in on your panicked face');
  add(tStudy + 0.1, 'gulp', -5, 0, '?! — you did NOT study');
}

// ---- 16. ;noclip me (close, sneaky; ENTER -> ghost)
{
  const [a, b] = typeSpan(A[11], 'Noclip', 'me');
  add(CUT.nclip, 'ui_pop', -8, 0, "the ';noclip me' command bar pops in");
  typing(a, b, -4, 0, "typing ';noclip me'");
  enter(tNoclip, -1, 0, ';noclip me');
  add(tNoclip + 0.03, 'portal_enter', 0, 0, 'noclip: you turn see-through, scanlines shimmer');
}

// ---- 17. "Noclip lets you walk through walls." — the ghost walks into the chalkboard
const tWalls = w(12, 'walls');
const tWalk0 = A[12].a + 0.25, tWalk1 = tWalls - 0.05;
add(CUT.walk + 0.05, 'whoosh_up', -10, 0, 'the ghost floats up out of the chair');
add(tWalls - 0.05, 'portal_enter', -3, 0, 'you walk straight INTO the chalkboard');
add(tWalls + 0.02, 'magic', -8, 0, 'ripples spread across the board');

// ---- 18. "It does NOT let you choose which wall." — Principal Pratt's office: CRACK!, out steps the hero
const OFFX = 1360;
const offCam = { zoom: 1.1, x: 70 };
const tChoose = w(12, 'choose'), tWall12 = w(12, 'wall');
{
  const tDoes = w(12, 'does'), tNot = w(12, 'NOT'), tWhich = w(12, 'which');
  add(tDoes, 'stone', -8, PC(OFFX, offCam), "the office wall starts to crack");
  add(tNot, 'rock_drop', 1, PC(OFFX, offCam), "CRACK! a you-shaped hole bursts through Pratt's wall (shake)");
  add(tNot + 0.03, 'explosion_small', -5, PC(OFFX, offCam), 'plaster dust puff');
  add(tNot + 0.45, 'rock_drop', -10, PC(OFFX, offCam), 'debris settles');
  add(tWhich, 'glitch', -6, PC(OFFX, offCam), 'the noclip flickers off');
  add(tWall12 + 0.25, 'blink', -8, PC(700, offCam), 'Pratt looks up from his coffee');
}

// ---- 19./20. "Young man. Did you just walk through my wall?" (record scratch, point, snap-zoom onto the hole)
{
  const tDid = w(13, 'Did'), tWall13 = w(13, 'wall');
  add(CUT.two, 'record_scratch', -1, 0, 'music scratches off: "Did you just walk through my wall?"');
  add(tDid, 'swish', -8, PC(700, { zoom: 1.12, x: 70 }), 'Pratt points at the hole in his wall');
  add(tWall13 - 0.05, 'zoom_in', -3, PC(OFFX, { zoom: 1.2, x: 110 }), 'snap-zoom onto the you-shaped hole');
  add(tWall13 + 0.02, 'boom', -2, 0, 'flash on "wall?"');
}

// ---- 21. "...No? Noclip... me... AWAY!"
const tNc = w(14, 'Noclip');
{
  const [a, b] = typeSpan(A[14], 'Noclip', 'AWAY');
  add(A[14].a + 0.05, 'cloth', -10, 0, 'nervous shrug ("...No?")');
  add(w(14, 'No') + 0.4, 'gulp', -5, 0, 'gulp');
  add(tNc - 0.15, 'ui_pop', -6, 0, "the ';noclip me AWAY' command bar pops in");
  typing(a, b, -2, 0, "frantic typing ';noclip me AWAY'");
  enter(tAway, 0, 0, ';noclip me AWAY');
  add(tAway + 0.02, 'zoom_in', -4, 0, 'zoom lines');
}

// ---- 22. through the floor: FWOOP!, a hero-shaped hole; Pratt sips his coffee ("By lunch...")
{
  const cam = { zoom: 1.12, x: 90 };
  add(tAway + 0.02, 'portal_enter', 1, PC(OFFX, cam), 'noclip: you drop straight through the floor');
  add(tAway + 0.05, 'whoosh_down', 0, PC(OFFX, cam), 'FWOOP!');
  add(tAway + 0.06, 'pop', -6, PC(OFFX, cam), 'a you-shaped hole pops into the floor');
  add(tAway + 0.1, 'thud', -5, PC(OFFX, cam), 'shake + dust puff');
  add(tAway + 0.75, 'body_fall', -14, PC(OFFX, cam), 'muffled landing on the floor below');
  add(w(15, 'lunch') + 0.15, 'gulp', -10, PC(700, cam), 'Pratt sips his coffee, unbothered');
}

// ---- 23. "...the most popular kid in school." (mobbed in the hallway, MOST POPULAR badge)
{
  const tPop = w(15, 'popular'), tKid = w(15, 'kid');
  const camAt = (t) => camKeys(t, [[CUT.pop, { zoom: 1.55, x: 0 }], [CUT.wanted, { zoom: 1.02, x: 0 }]], ease.out);
  add(CUT.pop + 0.3, 'chat_pop', -6, PC(560, camAt(CUT.pop + 0.3)), '"MAKE ME FLY!" bubble');
  add(tKid - 0.2, 'chat_pop', -6, PC(1380, camAt(tKid - 0.2)), '"JAIL MY BROTHER!" bubble');
  add(tPop, 'achievement', -1, 0, 'MOST POPULAR — BADGE EARNED!');
}

// ---- 24. "Everybody wanted a command." (faces pushing into the lens, request bubbles)
add(w(16, 'Everybody'), 'chat_pop', -4, P(420), '"FLY ME!" bubble');
add(w(16, 'wanted'), 'chat_pop', -4, P(1480), '"SPEED ME!" bubble');
add(w(16, 'a'), 'chat_pop', -5, P(760), '"MAKE ME TALL!" bubble');
add(w(16, 'command'), 'chat_pop', -4, P(1180), '"JAIL MY BROTHER!" bubble');

// ---- 25. "And you said yes." (typing like a pianist; six commands stack up)
{
  const t0 = CUT.yes + 0.12, step = Math.max(0.12, (CUT.fly - 0.1 - t0) / 6);
  typing(t0, CUT.fly - 0.1, -3, 0, 'typing commands like a pianist');
  for (let i = 0; i < 6; i++) add(t0 + i * step + step * 0.75, 'confirm', -9, i % 2 ? P(1550) : P(370), `command ${i + 1}/6 sent`);
  add(w(16, 'yes'), 'orch_hit', -2, 0, 'YES!');
}

// ---- 26. "To everybody." (montage 1: kids fly down the hallway both ways) — whooshes as the flyers cross the frame centre
{
  const flyers = [[-300, 2400], [2500, -200], [-500, 2300]];
  const cross = flyers.map(([x0, x1], j) => {
    for (let t = CUT.fly - 0.1; t <= CUT.split + 0.1; t += 0.005) {
      const x = lerp(x0, x1, seg(t, CUT.fly - 0.1, CUT.split + 0.1));
      const sx = 960 + (x - 960 - 200 * seg(t, CUT.fly, CUT.split));
      if ((x1 > x0 && sx >= 960) || (x1 < x0 && sx <= 960)) return t;
    }
    return lerp(CUT.fly, CUT.split, (j + 1) / 4);
  });
  // two flyers go right, one goes left: they all cross at nearly the same moment -> one long whoosh + one the other way
  add(Math.min(cross[0], cross[2]) - 0.25, 'whoosh_long', -3, 0.15, 'kids fly down the hallway (fly commands for everybody)');
  add(cross[1] - 0.1, 'whoosh', -6, -0.2, 'another kid flies past the other way');
}

// ---- 27. montage 2 (split screen): a giant head BONKs the lockers | a little brother in a mini cage
add(CUT.split + 0.15, 'bonk', -2, P(260), 'BONK! the giant-headed kid hits the lockers');
if (CUT.split + 0.6 < CUT.kid1) add(CUT.split + 0.6, 'bonk', -7, P(330), '...and again');
add(CUT.split + 0.07, 'metal_clank', -6, P(1065), 'a little brother gets a mini cage');

// ---- 28. KID: "Make me fly!" -> ;fly kid -> up he goes
{
  const tF = w1(17, 'fly');
  const kidPan = PC(720, { zoom: 1.32, x: 30 });
  add(tF - 0.1, 'ui_pop', -8, P(1330), "the ';fly kid' command bar pops in");
  typing(tF, tFlyKid - 0.04, -6, P(1330), "typing ';fly kid'");
  enter(tFlyKid, -2, P(1330), ';fly kid');
  add(tFlyKid + 0.04, 'whoosh_up', 0, kidPan, 'fly: the kid shoots up into the air');
  add(tFlyKid + 0.04, 'boing', -6, kidPan, 'squash-and-stretch launch');
  add(tFlyKid + 0.12, 'jetpack', -10, kidPan, 'he hovers near the ceiling');
}

// ---- 29. KID (floating): "No, wait, make me GIANT!" -> ;size kid 10 -> he grows, BONKs the ceiling
{
  const tM = w(17, 'make', 1);
  const kidPan = PC(720, { zoom: 0.92, x: -150 });
  add(tM - 0.1, 'ui_pop', -8, P(1380), "the ';size kid 10' command bar pops in");
  typing(tM, tGiant - 0.04, -5, P(1380), "typing ';size kid 10'");
  enter(tGiant, -2, P(1380), ';size kid 10');
  add(tGiant + 0.03, 'upgrade', 0, kidPan, 'size up: the kid balloons to giant size');
  add(tGiant + 0.05, 'whoosh_long', -5, 0, 'flash + the camera pulls way back');
  add(tGiant + 0.1, 'rumble', -3, kidPan, 'giant growth rumble');
  add(tGiant + 0.3, 'bonk', 2, kidPan, 'BONK! his head slams the ceiling (shake)');
  add(tGiant + 0.32, 'thud', -2, kidPan, 'ceiling impact');
  add(tGiant + 0.55, 'rock_drop', -7, kidPan, 'ceiling debris falls');
}

// ---- 30. KID (giant): "No, wait, BOTH!" -> ;fly kid -> CRASH through the ceiling
const tCrash = tBoth + 0.15;
{
  const tB = w(17, 'BOTH');
  const kidPan = PC(720, { zoom: 0.86, x: -120 });
  add(tB - 0.12, 'ui_pop', -8, P(1400), "the ';fly kid' command bar pops in");
  typing(tB, tBoth - 0.03, -4, P(1400), "typing ';fly kid' (again)");
  enter(tBoth, -1, P(1400), ';fly kid');
  add(tBoth + 0.04, 'whoosh_up', 2, kidPan, 'fly: the GIANT kid launches upward');
  add(tBoth + 0.06, 'jetpack', -2, kidPan, 'flying thrust');
  add(tCrash, 'impact', 3, kidPan, 'CRASH! straight through the ceiling (flash, big shake)');
  add(tCrash + 0.02, 'rock_drop', 0, kidPan, 'ceiling chunks break loose');
  add(tCrash + 0.45, 'rock_drop', -6, P(700), 'debris rains down into the hallway');
}

// ---- 31. Zoe: "Stop. Please." (dust falling)
add(CUT.zoe + 0.35, 'rock_drop', -12, P(1200), 'the last bits of ceiling drop behind Zoe');

// ---- 32. "The logs." (insert: the admin log scrolls, LOGGED tag)
add(CUT.logs, 'swish', -10, P(1600), "Zoe's finger slides in");
add(CUT.logs + 0.05, 'loading', -10, 0, 'the admin log scrolls: every command is saved');
add(CUT.logs + 0.3, 'tap', -8, P(1380), 'Zoe taps the screen');
add(w(18, 'logs'), 'stamp', -3, P(1560), 'red LOGGED tag pops');
add(w(18, 'logs') + 0.12, 'alarm_beep', -12, P(1560), 'the red dot blinks');

// ---- 33. "Somebody is going to notice." (the giant kid's sneakers kick from the ceiling hole)
add(CUT.zoe2 + 0.3, 'rock_drop', -12, P(890), 'plaster crumbs drop from the hole');
add(CUT.zoe2 + 0.5, 'swish', -12, P(820), "the giant kid's sneakers kick in the ceiling hole");
add(CUT.zoe2 + 1.2, 'swish', -13, P(960), '...kick');

// ---- 34. "Zoe. Relax. Nobody reads the logs." (laughs, leans on a locker; push-in to cocky)
{
  const relaxCam = { zoom: 1.6, x: 60 };
  add(CUT.relax + 0.05, 'metal_clank', -12, PC(1180, relaxCam), 'you lean on a locker, laughing');
  add(w(19, 'Nobody') - 0.05, 'zoom_in', -6, PC(1180, relaxCam), 'push-in: cocky');
  add(w(19, 'logs'), 'shine', -5, PC(1180, { zoom: 2.3, x: 230 }), 'cocky sparkle on "logs"');
}

// ---- 35. the dark room: the log scrolls, a wrinkled hand stops it
const tReads = w(20, 'reads'), stopT = tReads + 0.25, tLogs20 = w(20, 'logs');
add(CUT.dark, 'tv_on', -12, 0, 'hard cut to black: an old monitor glows in a dark room');
add(CUT.dark + 0.1, 'loading', -10, 0, 'the log keeps scrolling: fly me, speed Granny, jail Brick...');
add(tReads - 0.15, 'cloth', -10, P(1700), 'a wrinkled hand reaches in (cardigan sleeve)');
add(stopT, 'tap', -2, P(1120), 'one finger stops the scrolling');
add(stopT + 0.02, 'heartbeat', -8, 0, 'tension');

// ---- 36. the eyes glint
add(tLogs20 - 1.5, 'reverse_swell', -8, 0, 'swell into the eye glint');
add(tLogs20, 'shine', -2, 0, 'the eyes glint in the dark');
add(tLogs20 + 0.02, 'sub_drop', -4, 0, 'low drone hit: "Somebody... reads the logs."');

// ================================================================= MUSIC (tiles [T0, END])
// each entry starts where the previous one ends; [start, mood, energy, in, out]
const M = (start, end, mood, energy, inn, out) => ({ start: r3(start), end: r3(end), mood, energy, in: inn, out });
function tile(a, b, list) {
  const pts = list.map((x) => x.slice());
  pts[0][0] = a;
  for (let i = 1; i < pts.length; i++) if (pts[i][0] < pts[i - 1][0] + 0.2) pts[i][0] = pts[i - 1][0] + 0.2;
  const keep = pts.filter((p, i) => i === 0 || p[0] < b - 0.2);
  return keep.map((p, i) => M(p[0], i + 1 < keep.length ? keep[i + 1][0] : b, ...p.slice(1)));
}
const music = tile(T0, END, [
  [T0, 'hook', 0.55, 'cut', 'cut'],                      // swagger: you walk into school with the laptop
  [CUT.line, 'heist', 0.5, 'cut', 'cut'],                // the lunch line: Brick barges in, "Lunch money."
  [CUT.jail, 'power', 0.75, 'cut', 'sting'],             // ;jail Brick -> SLAM -> "Who put a CAGE on me?!" (button)
  [CUT.stare, 'playful', 0.45, 'fade', 'cut'],           // the cafeteria laughs, ;tp -> EEK!
  [CUT.gym, 'action', 0.55, 'cut', 'cut'],               // gym: "The mile run." TWEEET!
  [CUT.speed, 'silence', 0, 'cut', 'cut'],               // hush for the whispered "Speed me."
  [tSpeed, 'chase', 1.0, 'cut', 'sting'],                // SONIC BOOM, 4 laps, 0:00.3 NEW RECORD -> button on the cut to the shoes
  [CUT.shoes, 'silence', 0, 'cut', 'cut'],               // the shoes burn and crumble in silence
  [CUT.coach, 'playful', 0.4, 'fade', 'sting'],          // "a new world record... where are your shoes?" -> comic sting
  [tStab, 'silence', 0, 'cut', 'cut'],                   // +1 s: standing in your socks (cricket)
  [CUT.cls, 'heist', 0.45, 'cut', 'cut'],                // math test, didn't study, ;noclip me
  [tNoclip, 'mystery', 0.45, 'swell', 'scratch'],        // ghost walks through the chalkboard... into Pratt's office
  [CUT.two, 'silence', 0, 'cut', 'cut'],                 // "Did you just walk through my wall?" "...No?"
  [tNc - 0.15, 'power', 0.8, 'cut', 'sting'],            // ;noclip me AWAY -> FWOOP (button)
  [CUT.fall, 'silence', 0, 'cut', 'cut'],                // Pratt sips his coffee. "By lunch..."
  [CUT.pop, 'montage', 0.75, 'cut', 'cut'],              // most popular kid, everybody wants a command, YES, flying kids
  [CUT.kid1, 'chaos', 0.9, 'cut', 'sting'],              // fly / GIANT / BOTH -> button on the CRASH
  [tCrash, 'mystic', 0.4, 'fade', 'cut'],                // Zoe: "Stop. Please. The logs."
  [CUT.relax, 'hook', 0.4, 'cut', 'cut'],                // cocky: "Relax. Nobody reads the logs."
  [CUT.dark, 'mystic', 0.3, 'cut', 'fade'],              // the dark room, the old hand, the eyes (ends on the low drone)
]);

// ================================================================= AMBIENCE (beds per location)
const B = (start, end, name, gain_db) => ({ start: r3(start), end: r3(end), name, gain_db });
const ambience = [
  B(T0, CUT.line, 'birds', -8),                 // the schoolyard
  B(T0, CUT.line, 'town', -16),
  B(CUT.line, CUT.gym, 'crowd', -10),           // cafeteria chatter
  B(CUT.line, CUT.gym, 'kitchen', -18),         // cafeteria kitchen hum
  B(CUT.gym, CUT.cls, 'room', -8),              // the big gym
  B(CUT.cls, CUT.office, 'room', -12),          // the classroom (test silence)
  B(CUT.office, CUT.pop, 'room', -14),          // Principal Pratt's quiet office
  B(CUT.pop, CUT.zoe, 'crowd', -7),             // the hallway mob
  B(CUT.zoe, CUT.dark, 'crowd', -14),           // the hallway after the crash
  B(CUT.zoe2, CUT.dark, 'birds', -18),          // the sky through the ceiling hole
  B(CUT.dark, END, 'vault_hum', -12),           // the dark room: low machine drone
];

// ================================================================= FOOTSTEPS
const footsteps = [];
// you walking in: AC.walk((t - CUT.yard) * 8.5) -> a step every PI/8.5 s
footsteps.push({ start: r3(CUT.yard), end: r3(tStop), interval: r3(Math.PI / 8.5), surface: 'hard', gain_db: -9, pan: yardHeroPan((CUT.yard + tStop) / 2) });
// two kids heading for the doors: AC.walk(t * 8)
footsteps.push({ start: r3(CUT.yard), end: r3(CUT.line), interval: r3(Math.PI / 8), surface: 'hard', gain_db: -17, pan: 0.4 });
// Brick barging in: AC.walk((t - CUT.line) * 14)
footsteps.push({ start: r3(CUT.line), end: r3(tMove1), interval: r3(Math.PI / 14), surface: 'hard', gain_db: -5, pan: PC(950, { zoom: 1.18, x: 160 }) });
// the ghost walks to the chalkboard: AC.walkFront((t - t0) * 9)
footsteps.push({ start: r3(tWalk0), end: r3(tWalk1), interval: r3(Math.PI / 9), surface: 'wood', gain_db: -13, pan: 0 });
// stepping out of the wall into the office: AC.walkFront((t - tChoose) * 10)
footsteps.push({ start: r3(tChoose - 0.15), end: r3(tWall12), interval: r3(Math.PI / 10), surface: 'wood', gain_db: -10, pan: PC(OFFX, offCam) });
// the hallway mob hopping around you
footsteps.push({ start: r3(CUT.pop), end: r3(CUT.wanted), interval: 0.22, surface: 'hard', gain_db: -15, pan: 0 });

// ================================================================= sanity + write
sfx.sort((a, b) => a[0] - b[0]);
const inRange = (x) => x.start >= T0 - 1e-6 && x.end <= END + 1e-6 && x.end > x.start;
const sfxOk = sfx.filter((e) => e[0] >= T0 - 4 && e[0] < END);
if (sfxOk.length !== sfx.length) console.warn(`dropped ${sfx.length - sfxOk.length} sfx outside the scene`);
const out = { scene: 'SC 05', start: r3(T0), end: r3(END), music, ambience: ambience.filter(inRange), footsteps: footsteps.filter(inRange), sfx: sfxOk };
const J = (x) => JSON.stringify(x);
const txt = '{\n' +
  `  "scene": ${J(out.scene)},\n  "start": ${out.start},\n  "end": ${out.end},\n` +
  `  "music": [\n${out.music.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "ambience": [\n${out.ambience.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "footsteps": [\n${out.footsteps.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "sfx": [\n${out.sfx.map((m) => '    ' + J(m)).join(',\n')}\n  ]\n}\n`;
const dst = path.join(__dirname, 'sc05.json');
fs.writeFileSync(dst, txt);
console.log(`${dst}: ${out.music.length} music segments, ${out.ambience.length} beds, ${out.footsteps.length} footstep runs, ${out.sfx.length} sfx`);
