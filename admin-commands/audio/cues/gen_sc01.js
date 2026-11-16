#!/usr/bin/env node
// Sound cue sheet generator for SC 01 (COLD OPEN: a flash-forward to the city in chaos at night).
// Every time below is computed from the voice timeline exactly like scenes/s01.js does (L(id).a / .b, .word()),
// so when the real voice replaces the provisional timeline, re-run:
//   node audio/cues/gen_sc01.js && python3 audio/validate_cues.py audio/cues/sc01.json
// Output: audio/cues/sc01.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { L } = V;

// ---------------------------------------------------------------- timing (copied from scenes/s01.js)
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const T0 = 0;                                     // == main.js RANGES: the first scene starts the video
const END = V.scene('SC 02').start;
const l0 = L('01.0'), l1 = L('01.1'), l2 = L('01.2'), l3 = L('01.3'), l4 = L('01.4'), l5 = L('01.5'), l6 = L('01.6');

const tAdmin = l0.word('admin').t0, tCmds = l0.word('commands').t0;
const tB = tAdmin - 0.12;                          // B: the command chips burst over the city
const tC = l0.word('In').t0 - 0.08;               // C: Brick in the cage ("In real life?")
const tD = l1.a - 0.1;                            // D: street, a command is typed -> the bus launches
const tType0 = l1.word('type').t0, tType1 = l1.word('chat').t1, tEnterD = l1.word('and').t0 + 0.05;
const tJust = l1.word('just').t0, tHappens = l1.word('happens').t0;
const tE = l2.a - 0.1;                            // E: Dad in orbit
const tF = l2.word('Your', 1).t0 - 0.08;          // F: Granny faster than sound
const tSound = l2.word('sound').t0;
const tG = l2.word('And').t0 - 0.08;              // G: the cat licking his paw...
const tReveal = l2.word('is', 2).t0;               // ...pull back: the size of a building
const tBuilding = l2.word('building').t0;
const tH = l3.a - 0.1;                            // H: YOU floating with the laptop
const tI = l3.word('Un').t0 - 0.14;               // I: close-up, typing ";unfly everyone"
const tEnter = l3.b + 0.04;
const tDenied = l4.a;                             // the PERMISSION DENIED stamp
const tDeniedW = l4.word('DENIED').t0;
const tK = l4.word('But').t0 - 0.1;               // K: "But I'm the admin!"
const tL = l5.a - 0.08;                           // L: the sky cracks, the Admin's chat
const tNo = l5.a, tIam = l5.word('I').t0;
const tM = l6.a - 0.06;                           // M: freeze frame + call-outs
const tN = l6.word("Let's").t0 - 0.12;            // N: VHS rewind to Monday
const tMonday = l6.word('Monday').t0;

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
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));          // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => sfx.push([r3(t), name, g, pan, note]);
// keyboard bursts (~1 s each) while the command's letters appear
function typing(t0, t1, g, pan, note) {
  for (let t = t0, k = 0; t < t1 - 0.5 || k === 0; t += 0.9, k++) add(t, 'typing', k ? g - 2 : g, pan, k ? note + ' (cont.)' : note);
}
// whip-pan (s06_env whip(t, t0, dir): white streaks for 0.16 s after the cut)
const whip = (t, dir, note) => add(t - 0.1, 'whoosh', -3, r3(-0.25 * dir), `whip-pan: ${note}`);

// ================================================================= SFX, shot by shot
// ---- A: fade up on the night city in chaos; the SERVER MESSAGE pop-ups appear one by one
add(T0, 'wind_gust', -6, 0, 'fade up: high above the night city');
add(T0 + 0.25, 'reverse_swell', -8, 0, 'the chaos city swells in');
{
  const POPS = [330, 1300, 760, 1700, 110, 1120, 2080, -300];     // city.js POPS x (k .3, near the frame centre)
  POPS.forEach((x, i) => {
    const t = 0.1 + (i * 0.085 / 1.15) * (tAdmin - 0.1);         // popK = 1.15 * seg(t, 0.1, tAdmin) reaches i * .085
    add(t, 'ui_pop', x < 0 || x > 1920 ? -13 : -9, P(x), `SERVER MESSAGE pop-up #${i + 1}`);
  });
}
// ---- B: "admin commands?" — the command chips burst out, the golden crown on "commands"
add(tB, 'pixel_wipe', -3, 0, 'flash: the admin command chips burst over the city');
{
  const n = 9, a0 = tAdmin - 0.05, a1 = l0.word('commands').t1;
  for (let i = 0; i < n; i++) {
    const ang = ((-160 + (i / (n - 1)) * 140) * Math.PI) / 180;
    add(a0 + (i / n) * (a1 - a0) * 0.9, 'pop', -11, P(960 + Math.cos(ang) * 560), `command chip #${i + 1} pops`);
  }
}
add(tCmds - 0.05, 'shine', -2, 0, 'the golden crown glints in the middle');
// ---- C: "In real life?" — Brick sulking in the cage on the crane
whip(tC, 1, 'to Brick in the cage');
add(tC + 0.05, 'wind_gust', -8, 0, 'wind high above the city');
add(tC + 0.12, 'metal_clank', -6, P(990), 'the cage jolts on its chain');
add(tC + 0.7, 'metal_clank', -12, P(990), 'chain creaks as the cage swings');
// ---- D: "You type it in the chat... and it just... happens." — ;fly bus
whip(tD, -1, 'to the street');
typing(tType0, tType1, -5, 0, "typing ';fly bus' in the chat bar");
add(tEnterD, 'click', -3, 0, 'ENTER: ;fly bus');
add(tEnterD + 0.03, 'confirm', -3, 0, 'confirm: ;fly bus');
add(tJust - 0.05, 'engine', -6, P(1014), 'the bus shudders, squashing down');
add(tJust + 0.1, 'rumble', -8, P(1014), 'the bus shakes on its wheels');
add(tHappens - 0.05, 'whoosh_up', 2, P(1014), "LAUNCH: the bus shoots up ('WHOOSH!')");
add(tHappens, 'jetpack', -3, P(1014), 'fly thrust under the bus');
add(tHappens + 0.02, 'thud', -4, P(1014), 'squash-stretch launch: shake + dust');
add(tHappens + 0.05, 'upgrade', -9, 0, 'green command burst');
// ---- E: "Your dad is in orbit."
whip(tE, 1, 'to Dad past the moon');
add(tE + 0.1, 'whoosh_long', -10, P(700), 'Dad tumbles slowly past the giant moon');
{
  const tb = l2.word('orbit').t0 - 0.2;
  const dx = lerp(560, 1060, seg(tb, tE, tF));
  add(tb, 'chat_pop', -6, P(dx + 420), "'Can you hear me now?' bubble");
}
// ---- F: "Your granny is faster than sound." — the sonic boom
whip(tF, -1, 'to Granny');
add(tF + 0.05, 'jetpack', -6, 0, "Granny's fire trail roars");
add(tSound - 0.45, 'whoosh_long', -3, 0, 'Granny accelerates');
add(tSound, 'impact', 3, P(700), "SONIC BOOM ('BOOM!'): cone + big shake");
add(tSound + 0.02, 'explosion_small', -6, P(520), 'boom crackle');
// ---- G: the cat licking his paw -> pull back: the size of a building
whip(tG, 1, 'to the cat close-up');
add(tG + 0.4, 'monster_growl', -14, P(900), 'contented giant purr while licking');
add(tReveal - 0.1, 'whoosh_long', -1, 0, 'big pull-back: the cat sits ON a skyscraper');
add(tReveal + 0.3, 'rumble', -8, 0, 'the tower creaks under the giant cat');
add(tBuilding, 'boom', 0, P(1500), "'?!' the size of a building");
// ---- H: YOU floating above the city with the laptop
whip(tH, -1, 'to YOU floating with the laptop');
add(tH + 0.05, 'wind_gust', -7, 0, 'wind round the floating hero');
add(tH + 0.3, 'typing', -11, P(900), 'frantic typing on the laptop');
// ---- I/J: ";unfly everyone" -> PERMISSION DENIED
whip(tI, 1, 'to the close-up');
{
  const [a, b] = typeSpan(l3, 'Un', 'everyone');
  typing(a, b, -4, P(780), "typing ';unfly everyone'");
}
add(tEnter, 'click', -2, P(1330), 'ENTER: ;unfly everyone (command burst)');
add(tDenied, 'buzzer_wrong', 2, P(1340), 'PERMISSION DENIED');
add(tDenied + 0.02, 'stamp', 1, P(1340), 'the red DENIED stamp slams (big shake)');
add(tDenied + 0.04, 'glitch', -3, 0, 'red frame flash + screen glitch');
add(tDeniedW - 0.04, 'zoom_in', -3, 0, "smash-zoom on 'DENIED?!'");
// ---- K: "But I'm the admin!" — shaking the laptop at the sky
whip(tK, -1, 'to YOU shaking the laptop at the sky');
add(tK + 0.05, 'cloth', -6, 0, 'arms up, shaking the laptop');
add(tNo - 1.5, 'reverse_swell', -2, 0, 'the sky starts to glow (swell peaks at the crack)');
// ---- L: "No. ... I am." — the sky cracks like glass, the Admin's giant chat
add(tNo - 0.02, 'impact', 4, 0, 'THE SKY CRACKS (white flash, big shake)');
add(tNo, 'glass', -1, 0, 'glass crack across the sky');
add(tNo + 0.02, 'thunder', 0, 0, 'thunder rolls out of the crack');
add(tNo + 0.05, 'rumble', 0, 0, 'low rumble');
add(tNo + 0.1, 'chat_pop', -2, 0, "the Admin's giant chat bubble emerges");
add(tNo + 0.02, 'typing', -9, 0, "'No.' types itself");
add(tIam - 0.02, 'typing', -9, 0, "'I am.' types itself");
add(tIam, 'boom', 2, 0, "'I am.': his eyes flare (flash + shake)");
add(tIam + 0.02, 'sub_drop', 0, 0, "the Admin's weight");
// ---- M: freeze frame + call-outs — "Things got a little... out of hand"
add(tM - 0.02, 'record_scratch', 0, 0, "FREEZE FRAME ('Yeah.')");
add(tM, 'camera_flash', -7, 0, 'freeze flash');
{
  const ft = tM - 0.02;
  const granX = 960 + Math.cos(ft * 0.55) * 1050;            // grannyLoop at the freeze (k .3)
  const calls = [['Things', 1640, 'DAD (in orbit)'], ['got', granX - 240, 'GRANNY (Mach 2)'], ['little', 640, 'PANCAKE (building-sized)'], ['out', 360, 'BRICK (jailed)'], ['hand', 760, 'YOU (not the admin)']];
  for (const [word, x, txt] of calls) add(l6.word(word).t0 - 0.03, 'pop', -6, P(x), `call-out: ${txt}`);
}
// ---- N: VHS rewind back to MONDAY
add(tN - 0.03, 'vhs_clunk', -2, 0, 'REWIND button');
add(tN + 0.03, 'rewind', 0, 0, 'VHS rewind: the night plays backwards');
add(tN + 1.1, 'rewind', -1, 0, 'rewind (cont.)');
{
  const n = 5, a = tN + 0.1;                                   // day counter SATURDAY -> ... -> MONDAY lands on "Monday"
  for (let k = 1; k < n; k++) add(a + (k / n) * (tMonday - a), 'countdown_tick', -8, P(1480), 'day counter rolls back');
  add(tMonday, 'pop', -4, P(1480), 'MONDAY pops (gold)');
  add(tMonday + 0.02, 'chime', -5, P(1480), 'MONDAY');
}
add(END - 0.22, 'vhs_clunk', -4, 0, 'PLAY: white flash into SC 02');

sfx.sort((p, q) => p[0] - q[0]);

// ================================================================= MUSIC (tiles [T0, END])
const M = (start, end, mood, energy, inn, out) => ({ start: r3(start), end: r3(end), mood, energy, in: inn, out });
const music = [
  M(T0, tDenied, 'chaos', 0.65, 'fade', 'cut'),            // the city in chaos, the fast list, ;unfly everyone
  M(tDenied, tK, 'silence', 0, 'cut', 'cut'),             // hard cut on PERMISSION DENIED
  M(tK, tNo, 'mystic', 0.45, 'swell', 'sting'),           // "But I'm the admin!" -> huge button as the sky cracks
  M(tNo, tM, 'silence', 0, 'cut', 'cut'),                 // sting tail + rumble under "No. ... I am."
  M(tM, tN, 'explainer', 0.35, 'cut', 'cut'),             // freeze frame, call-outs: "out of hand"
  M(tN, END, 'glitch_build', 0.6, 'cut', 'tapestop'),     // rewind to Monday, the tape stops
];

// ================================================================= AMBIENCE (beds per location)
const B = (start, end, name, gain_db) => ({ start: r3(start), end: r3(end), name, gain_db });
const ambience = [
  B(T0, tD, 'wind', -10),                  // wide, high above the city / Brick on the crane
  B(T0, tD, 'night', -14),
  B(tD, tE, 'town', -8),                   // the street: the bus
  B(tD, tE, 'crowd', -14),
  B(tF, tN, 'wind', -9),                   // Granny, the giant cat, floating above the city
  B(tF, tN, 'night', -14),
  B(tN, END, 'static', -15),               // the VHS rewind
];

// ================================================================= FOOTSTEPS (nobody walks: everyone flies)
const footsteps = [];

// ================================================================= write
const out = { scene: 'SC 01', start: r3(T0), end: r3(END), music, ambience, footsteps, sfx };
const J = (x) => JSON.stringify(x);
const txt = '{\n' +
  `  "scene": ${J(out.scene)},\n  "start": ${out.start},\n  "end": ${out.end},\n` +
  `  "music": [\n${music.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "ambience": [\n${ambience.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "footsteps": [${footsteps.length ? '\n' + footsteps.map((m) => '    ' + J(m)).join(',\n') + '\n  ' : ''}],\n` +
  `  "sfx": [\n${sfx.map((m) => '    ' + J(m)).join(',\n')}\n  ]\n}\n`;
const dst = path.join(__dirname, 'sc01.json');
fs.writeFileSync(dst, txt);
console.log(`${dst}: ${music.length} music segments, ${ambience.length} beds, ${footsteps.length} footstep runs, ${sfx.length} sfx`);
