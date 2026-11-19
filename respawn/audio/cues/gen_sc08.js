#!/usr/bin/env node
// Sound cue sheet generator for SC 08 (СОХРАНЕНИЕ ПОВРЕЖДЕНО: the alarm, the ghost-YOUs, the world freezes).
// Every time below is computed from the voice timeline exactly like scenes/s08.js does (L(id).a / .b, .word()),
// so when the voice changes, re-run:
//   node audio/cues/gen_sc08.js && python3 audio/validate_cues.py audio/cues/sc08.json
// Output: audio/cues/sc08.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { L } = V;

// ---------------------------------------------------------------- timing (copied from scenes/s08.js)
const A = Array.from({ length: 13 }, (_, i) => L('08.' + i));
const T0 = V.TL.scenes['SC 08'].start;
const END = V.TL.scenes['SC 09'].start;               // == main.js RANGES for SC 08
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;

const CUT = {};
CUT.alarm = T0;
const tCorr = w(0, 'corrupted');
CUT.count = w(0, 'Respawns') - 0.12;
const tRoll0 = w(0, 'nine'), tRoll1 = w1(0, 'ninetynine');
CUT.undone = A[1].a - 0.1;
CUT.back = w(1, 'came') - 0.1;
const tCame = w(1, 'came');
CUT.flood = A[1].b + 0.2;
CUT.tip1 = A[2].a - 0.1;
CUT.all = w(2, 'All') - 0.08;
CUT.never = w(2, 'They') - 0.1;
CUT.saved = w(2, 'They', 1) - 0.1;
const tSaved = w(2, 'saved');
CUT.kid = A[3].a - 0.1;
CUT.hundred = w(3, 'HUNDRED') - 0.12;
CUT.prin = A[4].a - 0.1;
CUT.again = w(4, 'AGAIN') - 0.1;
CUT.everyone = A[5].a - 0.1;
CUT.all9999 = w(5, 'All') - 0.1;
CUT.hide = A[5].b + 0.05;
CUT.literally = w(6, 'Literally') - 0.12;
CUT.dream = w(6, 'ive') - 0.12;
CUT.ivy = A[7].a - 0.12;
CUT.only = A[8].a - 0.1;
CUT.cool = A[9].a - 0.1;
CUT.dad = A[10].a - 0.15;
CUT.bea = A[11].a - 0.1;
CUT.tip2 = A[12].a - 0.1;
CUT.frozen = w(12, 'If') - 0.1;
CUT.forever = w(12, 'FOREVER') - 0.12;
const tFreeze = w(12, 'stuck');
const FLAG_T = [w(1, 'everything'), w(1, 'you'), w(1, 'had'), w(1, 'ever'), w(1, 'undone')];
const FLAG_X = [560, 1290, 880, 1700, 220];
const YG = [['skate', 380], ['ball', 1580], ['tray', 1820], ['foam', 640], ['trip', 190], ['stairs', 1000], ['ball', 1350]].map(([kind, x], i) => ({ kind, x, born: tCame + 0.06 + i * 0.12 }));
const GP = { skate: 2.3, ball: 2.0, tray: 2.4, stairs: 2.1, foam: 3.2, trip: 2.0 };
const EVENT = { skate: [0.36, 'body_fall'], ball: [0.3, 'bonk'], tray: [0.34, 'slip'], stairs: [0.1, 'body_fall'], foam: [0.02, 'splat'], trip: [0.33, 'body_fall'] };
const spagHits = [w(4, 'spaghetti') - 0.1, w(4, 'AGAIN') - 0.05];
const WHIPS = [[CUT.flood, 1], [CUT.kid, 1], [CUT.prin, -1], [CUT.everyone, 1], [CUT.ivy, -1], [CUT.tip2, 1]];
const GLITCHES = [CUT.count, CUT.tip1, CUT.never, CUT.hide, CUT.dream, CUT.dad, CUT.bea, CUT.frozen];

try {
  const M = require('../../scenes/s08');
  for (const [k, v] of Object.entries(CUT)) if (Math.abs((M.CUT[k] ?? v) - v) > 1e-6) console.warn(`WARN: CUT.${k} differs from scenes/s08.js (${v} vs ${M.CUT[k]})`);
} catch (e) { console.warn('(scenes/s08.js not loadable for the cross-check: ' + e.message + ')'); }

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };   // == kit.hash
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 4 && t < END) sfx.push([r3(t), name, g, pan, note]); };
// loop events of the near yard ghosts inside [a, b) (pan from world x through a cam centred at cx with zoom z)
function ghostLoops(a, b, cx, z, gain, only) {
  YG.forEach((g, i) => {
    if (only && !only.includes(i)) return;
    const [ue, name] = EVENT[g.kind];
    const Pp = GP[g.kind], t0 = g.born + 0.42 - 0.02 * Pp;
    for (let k = 0; k < 60; k++) {
      const te = t0 + (k + ue) * Pp;
      if (te < a) continue;
      if (te >= b) break;
      add(te, name, gain - (i % 3), P(960 + z * (g.x - cx)), `ghost loop: ${g.kind} fail`);
    }
  });
}

// ================================================================= SFX, shot by shot
for (const [tc, d] of WHIPS) add(tc - 0.12, 'whoosh', -3, r3(0.3 * d), 'whip-pan');
for (const tc of GLITCHES) add(tc - 0.04, 'glitch', -5, 0, 'glitch cut');

// ---- 1. the alarm: the sky floods red, the WARNING window crt-opens
const tW = w(0, 'Warning');
add(tW - 0.08, 'siren', 0, 0, 'the alarm siren over the town');
add(tW - 0.06, 'sub_drop', 2, 0, 'the sky floods red');
add(tW, 'alarm', -4, 0.2, 'alarm');
add(tW + 0.12, 'crowd_gasp', -8, 0, 'the kids look up');
add(tW + 0.3, 'rumble', -6, 0, 'red rumble');
add(tCorr - 0.12, 'tv_on', -2, 0, 'the giant sky window opens (crt)');
add(tCorr + 0.1, 'error', -4, 0, 'SAVE FILE CORRUPTED');
// ---- 2. "Respawns used: 9,999" rolls in the window
for (let t = tRoll0, k = 0; t < tRoll1 - 0.05; t += 0.12, k++) add(t, 'tap', -10 - (k % 2) * 2, 0, 'the number rolls');
add(tRoll1 - 0.05, 'impact', 2, 0, '9,999 lands (shake)');
add(tRoll1 - 0.03, 'alarm_beep', -4, 0, 'alarm beep');
add(tRoll1, 'glitch', -6, 0, 'the window glitches');
// ---- 3. red checkpoint flags slam into the yard
FLAG_T.forEach((tp, i) => {
  add(tp - 0.12, 'whoosh_down', -8, P(FLAG_X[i] - 60), 'a red flag falls from the sky');
  add(tp, 'thud', -2, P(FLAG_X[i] - 60), 'red flag slams into the ground');
  add(tp + 0.03, 'error', -12, P(FLAG_X[i] - 60), 'it blinks red');
});
// ---- 4. "came back" — ghosts pour out of the flags
add(tCame - 0.8, 'reverse_swell', -2, 0, 'build-up to "came back"');
add(tCame, 'boom', 2, 0, 'the ghosts burst out (shake)');
YG.forEach((g) => add(g.born, 'poof', -4, P(g.x - 60), `a ghost-YOU pours out of a flag (${g.kind})`));
add(tCame + 0.05, 'crowd_gasp', -6, 0, 'gasps');
add(tCame + 0.35, 'whoosh_up', -8, 0, 'more ghosts on the school roof');
ghostLoops(tCame + 0.5, CUT.flood, 960, 1, -12);
// ---- 5. the beat: the whole town fills up
for (let j = 0; j < 8; j++) add(CUT.flood - 0.1 + 0.05 + 1.2 * hash(j * 0.77), 'poof', -9 - (j % 3), r3(-0.6 + j * 0.17), 'ghosts pop onto lamps / the bus roof');
add(CUT.flood + 0.1, 'rumble', -6, 0, 'hundreds of ghosts');
add(CUT.flood + 1.2, 'glitch_long', -10, 0, 'static over the town');
// ---- 6. Tip: "those are your fails"
add(A[2].a, 'glitch', -2, P(1300), 'T-TIP (glitch)');
ghostLoops(CUT.tip1, CUT.all, 1000, 1.25, -12, [0, 1, 3]);
// ---- 7. "All of them." — 2x2 split
[CUT.all, w(2, 'All'), w(2, 'of'), w(2, 'them') + 0.18].forEach((tp, i) => add(tp, 'ui_pop', -4, r3(i % 2 ? 0.35 : -0.35), `split panel ${i + 1} pops in`));
add(w(2, 'of') + 0.2, 'body_fall', -10, -0.35, 'panel: stairs tumble');
add(w(2, 'them') + 0.1, 'bonk', -10, -0.35, 'panel: dodgeball to the face');
// ---- 8. "They never went away." — the steps
for (let k = 0; k < 4; k++) { const te = CUT.never + 0.25 + k * 0.5; if (te < CUT.saved) add(te, 'body_fall', -8 - k, 0, 'a ghost tumbles down the entrance steps'); }
add(CUT.never + 0.6, 'bubbles', -12, P(500), 'the foam ghost');
// ---- 9. "They were just... saved." — the red toast
add(tSaved - 0.05, 'notify', -2, 0, "red toast 'Fail saved x9,999'");
add(tSaved, 'error', -4, 0, 'toast error');
add(tSaved + 0.02, 'glitch_long', -8, P(1300), 'Tip glitches hard');
// ---- 10. the skate area: kids laugh at the ghost skaters
add(CUT.kid + 0.1, 'kids_laugh', -2, 0, 'the kids point and laugh');
add(CUT.kid + 0.15, 'skate_roll', -8, 0.2, 'ghost skaters roll');
for (let k = 0; k < 3; k++) add(CUT.kid + 0.5 + k * 0.8, 'body_fall', -10, r3(0.1 + 0.15 * k), 'a ghost falls off his skateboard');
add(CUT.kid + 2.0, 'giggle', -6, -0.3, 'giggles');
// ---- 11. "a HUNDRED times" — a waterfall of bails
add(CUT.hundred, 'zoom_in', -2, 0.2, 'smash zoom on the ramp');
for (let k = 0; k < 6; k++) add(CUT.hundred + 0.15 + k * 0.25, k % 2 ? 'skid' : 'body_fall', -8 - (k % 3), r3(-0.2 + 0.1 * k), 'ghost skaters bail off the lip one after another');
for (let t = w(3, 'HUNDRED') - 0.05, k = 0; t < w(3, 'HUNDRED') + 0.55; t += 0.1, k++) add(t, 'tap', -12, P(1700), 'SKATE FAILS counter rolls');
add(w(3, 'HUNDRED') + 0.6, 'alarm_beep', -8, P(1700), 'counter hits 100');
// ---- 12. Principal Pemberton showered with spaghetti
spagHits.forEach((h, k) => {
  add(h - 1.1 + 0.45 * 1.7 - 0.05, 'slip', -4, P(700), 'the ghost slips on the spaghetti tray');
  add(h - 0.45, 'swish', -4, P(900), 'spaghetti flies');
  add(h, 'splat', k ? 3 : 1, P(1250), k ? 'AGAIN: splat on her head' : 'SPLAT! spaghetti on the principal');
});
add(spagHits[0] + 0.3, 'giggle', -6, 0.5, 'kids giggle');
add(spagHits[1] - 0.02, 'zoom_in', -4, 0, 'smash zoom on her face');
add(spagHits[1] + 0.02, 'impact', -4, 0, 'AGAIN?! shake');
// ---- 13. the town: everyone points at the roofs
add(CUT.everyone + 0.2, 'crowd_gasp', -6, 0, 'the whole street points up at the ghosts');
add(CUT.everyone + 1.6, 'camera_flash', -8, P(1500), 'a mom films it on her phone');
add(CUT.everyone + 2.6, 'kids_laugh', -12, -0.3, 'laughter down the street');
// ---- 14. crane out: all 9,999
add(CUT.all9999 + 0.05, 'whoosh_long', -2, 0, 'crane out over the whole town');
for (let t = w(5, 'nine'), k = 0; t < w1(5, 'ninetynine') - 0.05; t += 0.14, k++) add(t, 'tap', -11 - (k % 2) * 2, 0, 'FAILS ON DISPLAY counter rolls');
add(w1(5, 'ninetynine'), 'impact', 0, 0, '9,999 (shake)');
add(w1(5, 'ninetynine') + 0.02, 'sub_drop', -4, 0, 'sub drop');
// ---- 15. the hero hides his face
add(CUT.hide + 0.1, 'kids_laugh', -6, 0, 'the kids laugh around him');
add(CUT.hide + 0.4, 'sad_trombone', -8, 0, 'he hides his face');
ghostLoops(CUT.hide, CUT.literally, 1040, 1.4, -13, [0, 1, 3]);
add(CUT.literally + 0.05, 'blink', -8, 0, 'he peeks out: "Literally."');
// ---- 16. "I've HAD this nightmare." — the dream bubble
add(CUT.dream + 0.05, 'ui_pop', -4, 0.3, 'the dream bubble pops up');
add(CUT.dream + 0.1, 'heartbeat', -6, -0.4, 'nightmare heartbeat');
add(CUT.dream + 0.3, 'kids_laugh', -16, 0.3, 'muffled laughter inside the dream');
// ---- 17. Ivy watches the ghost fall and get up (warm beat)
{
  const f1 = w(7, 'fiftysix'), f2 = w(7, 'fiftysix', 1);
  // the single skate ghost at x 3700 (ph 0.6): its crash at u 0.36 of 2.3 s
  for (let k = 0; k < 40; k++) { const te = (k + 0.36) * 2.3 - 0.6; if (te < CUT.ivy) continue; if (te >= CUT.dad) break; add(te, 'body_fall', -12, 0.35, 'the ghost falls off the skateboard (again)'); }
  add(f1 - 0.05, 'ui_pop', -6, 0.35, "'FELL: 56' counter");
  add(f1, 'error', -12, 0.35, 'red counter');
  add(f2, 'confirm', -4, 0.35, "'GOT UP: 56' — green");
  add(f2 + 0.05, 'chime', -6, 0.35, 'warm chime');
  add(f2 + 0.1, 'sparkle', -10, 0.35, 'sparkles');
}
add(w(9, 'cool'), 'shine', -6, 0, '"That\'s kind of cool." sparkles');
add(w(9, 'cool') + 0.1, 'harp_up', -10, 0, 'warm harp');
// ---- 18. Dad stuck in a loop
{
  const whys = [w(10, 'Why'), w(10, 'Why', 1), w(10, 'Why', 2)];
  whys.forEach((tw, k) => {
    if (k) { add(tw - 0.04, 'rewind', -4, 0, `loop ${k + 1}: Dad snaps back`); add(tw - 0.02, 'glitch', -6, 0, 'loop glitch'); add(tw - 0.03, 'ui_pop', -10, P(1800), `LOOP ${k + 1}`); }
    add(tw + 0.95, 'record_scratch', -8, 0, 'he gets stuck mid-sentence');
  });
}
// ---- 19. Bea stuck bouncing
{
  const helps = [w(11, 'Help'), w(11, 'Help', 1), w(11, 'Help', 2)];
  helps.forEach((th, k) => {
    add(th - 0.08, 'boing', -2, 0, `trampoline bounce ${k + 1} (exactly the same)`);
    if (k) add(th - 0.06, 'glitch', -8, 0, 'frame-repeat glitch');
  });
}
// ---- 20. Tip's warning, the frost, everything stops
add(CUT.tip2 + 0.1, 'wind_gust', -10, 0, 'an icy wind as the day starts to freeze');
add(CUT.tip2 + 0.2, 'glass', -14, -0.6, 'frost crackles at the edges');
add(w(12, 'fffreezing'), 'glitch_long', -4, P(1300), 'Tip: f-f-freezing (glitch)');
add(CUT.frozen + 0.3, 'glass', -10, 0.6, 'frost spreads');
add(tFreeze - 0.4, 'powerdown', -2, 0, 'the world slows down');
add(tFreeze, 'impact', 2, 0, 'FREEZE: everything stops');
add(tFreeze + 0.02, 'glass', -2, 0, 'ice crack');
add(tFreeze + 0.05, 'sub_drop', -2, 0, 'freeze sub drop');
add(CUT.forever, 'impact', 0, 0, 'smash cut: the frozen town');
add(CUT.forever + 0.05, 'whoosh_long', -4, 0, 'pull out over the frozen town');
add(CUT.forever + 0.6, 'rumble', -10, 0, 'frozen rumble');
add(CUT.forever + 1.2, 'static', -16, 0, 'a frozen hum');

// ---------------------------------------------------------------- music, ambience
const music = [
  { start: T0, end: CUT.undone, mood: 'corrupt', energy: 0.65, in: 'cut', out: 'cut' },
  { start: CUT.undone, end: CUT.tip1, mood: 'corrupt', energy: 0.85, in: 'swell', out: 'cut' },
  { start: CUT.tip1, end: CUT.ivy, mood: 'corrupt', energy: 0.5, in: 'cut', out: 'fade' },
  { start: CUT.ivy, end: CUT.dad, mood: 'tender', energy: 0.4, in: 'fade', out: 'scratch' },
  { start: CUT.dad, end: CUT.tip2, mood: 'loop', energy: 0.5, in: 'cut', out: 'cut' },
  { start: CUT.tip2, end: tFreeze, mood: 'corrupt', energy: 0.75, in: 'cut', out: 'tapestop' },
  { start: tFreeze, end: Math.min(END - 0.6, tFreeze + 1.6), mood: 'silence', energy: 0, in: 'cut', out: 'cut' },
  { start: Math.min(END - 0.6, tFreeze + 1.6), end: END, mood: 'mystery', energy: 0.25, in: 'swell', out: 'fade' },
];
const ambience = [
  { start: T0 + 0.05, end: tFreeze, name: 'wind', gain_db: -16 },
  { start: T0 + 0.5, end: END, name: 'static', gain_db: -24 },
  { start: CUT.kid, end: CUT.everyone, name: 'crowd', gain_db: -16 },
  { start: CUT.everyone, end: CUT.hide, name: 'town', gain_db: -12 },
  { start: CUT.hide, end: CUT.dream, name: 'crowd', gain_db: -16 },
  { start: CUT.dream, end: CUT.ivy, name: 'night', gain_db: -10 },
  { start: CUT.dad, end: CUT.tip2, name: 'birds', gain_db: -22 },
];

const out = { scene: 'SC 08', start: r3(T0), end: r3(END), music: music.map((m) => ({ ...m, start: r3(m.start), end: r3(m.end) })), ambience: ambience.map((a) => ({ ...a, start: r3(a.start), end: r3(a.end) })), footsteps: [], sfx: sfx.sort((a, b) => a[0] - b[0]) };
out.music[0].start = out.start; out.music[out.music.length - 1].end = out.end;
fs.writeFileSync(path.join(__dirname, 'sc08.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`wrote audio/cues/sc08.json: ${out.sfx.length} sfx, ${out.music.length} music segments`);
