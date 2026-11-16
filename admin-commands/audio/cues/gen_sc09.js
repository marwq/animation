#!/usr/bin/env node
// Sound cue sheet generator for SC 09 (ПРАВДА: the warm server room; the old man from the garage sale is the Admin).
// Every time below is computed from the voice timeline exactly like scenes/s09.js does (L(id).a / .b, .word()),
// so when the real voice replaces the provisional timeline, re-run:
//   node audio/cues/gen_sc09.js && python3 audio/validate_cues.py audio/cues/sc09.json
// Output: audio/cues/sc09.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { L } = V;

// ---------------------------------------------------------------- timing (copied from scenes/s09.js)
const START = V.scene('SC 09').start, END = V.scene('SC 10').start;   // == main.js RANGES for SC 09
const l = (i) => L('09.' + i);
const M = Array.from({ length: 16 }, (_, i) => l(i));

const tFull = M[0].word('Full').t0;
const b1 = M[0].word('Every').t0 - 0.12;                // the wall of live cities
const tLive = M[0].word('live').t0;
const b2 = M[1].a - 0.1;                                // the big chair (newspaper)
const tVery = M[1].word('very').t0, tMan = M[1].word('man').t0;
const b3 = M[1].word('The', 1).t0 - 0.1;                // "The old man from the garage sale."
const tGarage = M[1].word('garage').t0;
const b4 = M[2].a - 0.1;                                // "Ah. ... Would you like some tea?"
const tSit = M[2].word('Sit').t0, tTea = M[2].word('tea').t0;
const b5 = M[3].a - 0.08;                               // "YOU'RE the Admin?! You SOLD me the laptop!"
const tSold = M[3].word('SOLD').t0, tLaptop = M[3].word('laptop').t0, tYou2 = M[3].word('You', 0).t0;
const b6 = M[4].a - 0.1;                                // every hundred years (history on the main screen)
const b7 = M[5].a - 0.08;                               // "How old ARE you?"
const tYears = M[5].word('YEARS').t0, tAre = M[5].word('ARE').t0;
const b8 = M[6].a - 0.1;                                // "since the very first player joined"
const b9 = M[6].word('A').t0 - 0.3;                     // CUTAWAY: a very confused dinosaur
const tDino = M[6].word('dinosaur').t0;
const b10 = M[7].a - 0.05;                              // fly / fast / big / win
const WANT_T = [M[7].word('fly').t0, M[7].word('fast').t0, M[7].word('big').t0, M[7].word('Win').t0];
const b11 = M[8].a - 0.1;                               // CUTAWAY 1964: nine feet tall
const tMade = M[8].word('made').t0, tNine = M[8].word('nine', 0).t0, tTall = M[8].word('tall').t0;
const b12 = M[8].word('He', 0).t0 - 0.15;               // ...couldn't fit through any doors. He was very sad.
const tDoors = M[8].word('doors').t0, tSad = M[8].word('He', 1).t0;
const b13 = M[9].a - 0.1;                               // "...That's exactly what I did."
const b14 = M[10].a - 0.1;                              // "I read the logs. Every single one."
const tLogs = M[10].word('logs').t0, tSingle = M[10].word('Every').t0;
const b15 = M[11].a - 0.1;                              // FIND: help -> 0 results
const tTyped = M[11].word('typed').t0, tCommand = M[11].word('command').t0;
const b16 = M[11].word('help').t0 - 0.12;               // the hero's face, green; "And he was right."
const b17 = M[13].a - 0.1;                              // battery one percent
const b18 = M[14].a - 0.1;                              // "Now I'll type undo all ... Including you."
const tUndo = M[14].word('undo').t0, tAll = M[14].word('all').t1, tGoes = M[14].word('Everything').t0, tIncl = M[14].word('Including').t0;
const b19 = M[15].a - 0.06;                             // "Wait!"
const b20 = M[15].word('Let').t0 - 0.1;                 // "Let me fix it. Myself. One by one."
const tMyself = M[15].word('Myself').t0, tOne = M[15].word('One').t0;
const tOneBatt = M[13].word('one').t0;                  // battery 1% icon pops (+ shake)
const tType = M[14].word('type').t0;                    // the admin command bar pops
const HX = 1220;                                        // the hero on the rug (two-shots)
const SEATX = 480;                                      // the old man's big chair (s09_env SEAT.x)
const MANX = 1290;                                      // the 1964 fellow

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));          // pan from screen x
const PW = (wx, cx, z) => P(960 + z * (wx - cx));                        // world x seen by a cam at(cx, _, z)
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
// ---- 1. arrival: white flash, the hero drops out of a light column onto the rug (E.teleIn at START + 0.08, 0.55 s)
{
  const tLand = START + 0.08 + 0.55 * 0.55;
  add(START, 'teleport', -1, PW(HX, 1290, 1.6), 'teleport arrival: white flash, light column');
  add(START + 0.1, 'whoosh_down', -6, PW(HX, 1290, 1.6), 'the hero drops out of the beam');
  add(tLand, 'land', -3, PW(HX, 1290, 1.6), 'lands on the rug (squash + dust)');
  add(tLand + 0.35, 'sparkle', -14, PW(HX, 1290, 1.6), 'the beam pixels fade');
}
// ---- 2. every screen a different city: the CRT wall powers on one by one, LIVE badges
{
  add(b1 - 0.12, 'whoosh', -5, 0.21, 'whip-pan to the wall of screens');
  for (let i = 0; i < 6; i++) add(b1 + 0.05 + i * 0.16, 'tv_on', i % 2 ? -9 : -7, P([330, 960, 1590][i % 3]), `CRT ${i + 1} powers on (${['TOKYO', 'PARIS', 'OSLO', 'RIO', 'CAIRO', 'YOUR TOWN'][i]})`);
  add(tLive - 0.15, 'ui_pop', -6, 0, "the red 'LIVE' badges pop on every screen");
  add(tLive - 0.12, 'beep', -12, 0.3, 'LIVE badge blip');
}
// ---- 3. "And in the big chair... is a very old man." — the newspaper peeks, then comes down
add(tVery - 0.2, 'paper', -10, PW(SEATX, 510, 1.85), 'the newspaper dips: someone peeks');
add(tMan - 0.15, 'paper', -6, PW(SEATX, 500, 2.1), 'the paper comes down: a very old man');
// ---- 4. "The old man from the garage sale." — the polaroid + flash, the hero's double take
add(tGarage - 0.22, 'pop', -8, P(850), 'Server Street polaroid pops in');
add(tGarage - 0.05, 'camera_flash', -3, P(850), 'polaroid flash');
add(tGarage, 'squeak', -8, PW(HX, 855, 1.25), "the hero's double take");
// ---- 5. "Ah. You found the server room. Sit down. Would you like some tea?"
add(b4 + 0.02, 'paper', -9, PW(SEATX, 500, 2.05), 'the old man folds the paper away');
// "Sit down.": he pats the chair arm (pat = |sin((t - tSit) * 9)|, a pat lands each time it returns to 0)
for (let k = 1; tSit + (k * Math.PI) / 9 < tTea - 0.5; k++) add(tSit + (k * Math.PI) / 9, 'tap', k === 1 ? -14 : -16, PW(SEATX - 60, 505, 2.15), `pat ${k} on the chair arm`);
add(tTea - 0.45, 'dishes', -11, PW(SEATX + 60, 505, 2.2), 'teacup lifted from the saucer');
add(tTea + 0.02, 'glass', -10, PW(SEATX + 60, 505, 2.22), "'tea?' the cup offered, tiny clink");
// ---- 6. "YOU'RE the Admin?! You SOLD me the laptop!"
add(b5, 'swish', -7, PW(HX, 1190, 2.15), 'the hero points at the old man');
add(tYou2 - 0.1, 'whoosh', -7, PW(HX, 1200, 1.9), 'the laptop thrust out toward him');
add(tSold - 0.07, 'zoom_in', -2, PW(HX, 1200, 2.2), 'smash-zoom on the hero');
add(tSold - 0.04, 'record_scratch', -1, 0, 'music scratches to a stop');
add(tSold, 'boom', 2, P(1360), "'SOLD!' bang + big shake");
add(tLaptop - 0.1, 'swish', -9, PW(HX, 1200, 2.0), 'laptop shaken: laptop!');
// ---- 7. "Every hundred years, I give the panel to one person." — panel holders listed on the main screen
{
  const h0 = M[4].word('hundred').t0, s0 = M[4].word('see').t0;
  ['1726 a shepherd', '1826 a baker', '1926 a mailman'].forEach((who, i) => add(h0 + ((s0 - h0) * i) / 4.2 + 0.03, 'beep', -12, PW(960, 965, 1.32), `history row: ${who}`));
  add(h0 + ((s0 - h0) * 3) / 4.2 + 0.03, 'ui_pop', -6, PW(960, 980, 1.36), "history row '2026 — you' (highlighted)");
}
// ---- 8. "Every hundred YEARS? How old ARE you?"
add(tAre - 0.1, 'zoom_in', -5, PW(HX, 1195, 2.4), "push-in + small shake on 'ARE'");
// ---- 10. CUTAWAY — 65,000,000 B.C.: Dino1 joins; ';rrrawr' -> UNKNOWN COMMAND
{
  const U = (u) => b9 + u * (b10 - b9);
  const pd = PW(720, 940, 1.06), pl = PW(1250, 940, 1.06);
  add(b9 - 0.15, 'rewind', -9, 0, 'flashback: back to 65,000,000 B.C.');
  add(b9 - 0.12, 'whoosh', -4, -0.21, 'whip-pan (sepia streaks)');
  add(U(0.04), 'notify', -4, P(420), "'[SERVER]: Dino1 has joined the game' toast");
  add(U(0.06), 'pop', -7, P(820), "'?' over the dinosaur");
  add(U(0.18), 'squeak', -8, pd, 'tiny arms strain for the keyboard (way too short)');
  add(U(0.5), 'ui_close', -10, P(420), 'the toast slides away');
  add(U(0.56), 'chat_pop', -6, P(1540), 'chat bar pops');
  add(U(0.58), 'typing', -5, pl, "pecking ';rrrawr' with its beak");
  add(U(0.6), 'monster_growl', -11, pd, "'rrrawr' (softened, confused)");
  add(U(0.74), 'click', -3, pl, 'ENTER: ;rrrawr (peck)');
  add(U(0.78), 'buzzer_wrong', -3, P(1530), "'UNKNOWN COMMAND'");
}
// ---- 11. "Most people want to fly. Be fast. Be big. Win." — old CRT replays, one per word
{
  const FX = [['whoosh_up', 'fly: a player rockets up'], ['whoosh', 'fast: a player zooms past'], ['upgrade', 'big: a giant player'], ['achievement', 'win: the #1 trophy']];
  add(b10 - 0.12, 'whoosh', -5, 0.21, 'whip-pan to the replay CRTs');
  add(b10 + 0.02, 'static', -15, 0, "'NO SIGNAL' static on the dark CRTs");
  WANT_T.forEach((w, i) => {
    const pan = P(i % 2 ? 1420 : 500), cmd = [';fly me', ';speed me', ';size me 50', ';win everything'][i];
    add(w - 0.18, 'tv_on', -9, pan, `CRT ${i + 1} on (${['1873', '1911', '1958', '1999'][i]})`);
    add(w - 0.18 + 0.58 * 0.15, 'typing', -16, pan, `the replay types '${cmd}'`);   // chatCommand progress (k - 0.15) * 3
    add(w + 0.12, FX[i][0], -9, pan, `${FX[i][1]} ('${cmd}' replay)`);
  });
}
// ---- 12. CUTAWAY 1964 — ';size me 9 ft': BOING, nine feet tall
{
  const pm = PW(MANX, 1110, 1.08);
  add(b11 - 0.12, 'whoosh', -4, -0.21, 'whip-pan (sepia streaks)');
  add(b11, 'music_box', -5, 0, 'sepia old-film flavour: 1964');
  add(tMade - 0.3, 'chat_pop', -8, P(560), "Walter's chat bar pops");
  typing(tMade, tNine + 0.05, -5, P(560), "typing ';size me 9 ft'");
  enter(tNine + 0.05, -3, P(560), ';size me 9 ft');
  add(tNine + 0.05, 'upgrade', -2, pm, 'size-up: Walter shoots up to nine feet');
  add(tNine + 0.08, 'boing', 2, P(1650), "'BOING!' bang + shake");
  add(tTall - 0.15, 'shine', -7, pm, 'proud arm raise: nine feet tall');
}
// ---- 13. "He couldn't fit through any doors. He was very sad."
add(tDoors - 0.02, 'bonk', 3, P(760), "'BONK!' forehead into the door frame");
add(tDoors + 0.02, 'thud', -4, P(760), 'BONK body: he bounces back');
add(tDoors + 0.12, 'dizzy', -6, P(720), 'stars circling his head');
add(tSad - 0.1, 'sad_trombone', -3, P(900), "sad trombone: 'He was very sad' (rain cloud)");
// ---- 15. "I know. I read the logs. Every single one." — the hero's log fills every screen, the room turns green
add(tLogs - 0.2, 'loading', -11, PW(960, 770, 1.53), 'log rows start printing on the screens');
add(tSingle - 1.5, 'reverse_swell', -9, 0, "swell into 'Every single one'");
add(tSingle - 0.1, 'tv_on', -9, 0, 'every screen flares green');
// ---- 16. "And you never once typed a command..." — FIND: help -> 0 RESULTS
typing(tTyped - 0.1, tCommand - 0.1, -9, 0, "typing 'help' into FIND");
add(tCommand + 0.05, 'error', -4, 0, "'0 RESULTS' pops (small shake)");
add(tCommand + 0.08, 'sub_drop', -9, 0, 'the heavy truth lands');
// ---- 18. SYSTEM: "Battery... one percent." — red pulse, the 1% icon pops with a shake
for (let k = 0; b17 + (Math.PI / 2 + 2 * Math.PI * k) / 9 < b18; k++) {
  const tp = b17 + (Math.PI / 2 + 2 * Math.PI * k) / 9;
  if (Math.abs(tp - tOneBatt) > 0.25) add(tp, 'beep', -12, 0, `low-battery red pulse ${k + 1}`);
}
add(tOneBatt, 'alarm_beep', -2, P(1620), "battery warning: the '1%' icon pops (shake)");
// ---- 19. "Now I'll type undo all. Everything goes back. Including you."
{
  const pc = PW(560, 840, 1.25);
  add(tType - 0.2, 'chat_pop', -5, pc, "the white ADMIN chat bar pops");
  typing(tUndo, tAll, -3, pc, "the Admin types ';undo all'");
  add(tAll, 'sub_drop', -5, 0, 'the Admin command sits there, heavy (no ENTER yet)');
  add(b19 - 4.0, 'riser_long', -7, 0, "tension rises to 'Wait!'");
  add(tGoes - 0.1, 'rewind', -4, 0, 'rewind marks flicker on the wall screens');
  add(tIncl, 'glitch_long', -5, PW(HX, 860, 1.28), 'the hero flickers like a ghost: Including you');
}
// ---- 20. "Wait!"
add(b19 - 0.02, 'zoom_in', -1, PW(HX, 1170, 2.3), 'smash push-in on the hero');
add(b19 + 0.03, 'orch_hit', 2, P(640), "'WAIT!' bang + shake");
add(b19 + 0.05, 'swish', -6, PW(HX, 1170, 2.3), 'arm thrust out');
// ---- 21. "Let me fix it. Myself. One by one." — the hand lowers, the command backspaces, teleport out
{
  const pc = PW(600, 852, 1.32);
  add(tMyself - 0.2, 'cloth', -12, PW(SEATX, 852, 1.3), 'the old man lowers his hand, smiling');
  typing(tMyself, tOne + 0.2, -10, pc, "';undo all' backspaces away");
  add(tOne + 0.2, 'ui_close', -8, pc, 'the admin chat bar closes');
  add(END - 0.55, 'teleport', -1, PW(HX, 858, 1.45), 'teleport out: rising pixels');
  add(END - 0.35, 'whoosh_up', -5, PW(HX, 858, 1.45), 'pixels stream upward into the white flash');
}

sfx.sort((p, q) => p[0] - q[0]);

// ================================================================= MUSIC (tiles [START, END])
const M_ = (start, end, mood, energy, inn, out) => ({ start: r3(start), end: r3(end), mood, energy, in: inn, out });
const music = [
  M_(START, b4, 'mystic', 0.4, 'swell', 'fade'),          // the warm room, the live cities, the big chair, the garage-sale man
  M_(b4, tSold - 0.04, 'tender', 0.35, 'fade', 'scratch'), // "Ah. ... Would you like some tea?" "YOU'RE the Admin?!" -> scratch on SOLD
  M_(tSold - 0.04, b6, 'silence', 0, 'cut', 'cut'),       // SOLD! / laptop! — comic drop-out
  M_(b6, b9, 'tender', 0.35, 'fade', 'cut'),              // every hundred years; how old ARE you; the very first player
  M_(b9, b10, 'game', 0.7, 'cut', 'sting'),               // CUTAWAY: Dino1 joins, ;rrrawr, UNKNOWN COMMAND -> sting
  M_(b10, b11, 'mystic', 0.4, 'cut', 'cut'),              // "Most people want to fly. Be fast. Be big. Win." (CRT replays)
  M_(b11, tSad - 0.1, 'playful', 0.55, 'cut', 'tapestop'), // CUTAWAY 1964: BOING, BONK -> winds down
  M_(tSad - 0.1, b13, 'silence', 0, 'cut', 'cut'),        // the sad trombone has the floor
  M_(b13, b15, 'mystery', 0.35, 'fade', 'cut'),           // "...That's exactly what I did." "I read the logs." the screens turn green
  M_(b15, b17, 'tender', 0.4, 'swell', 'cut'),            // "you never once typed a command... to help somebody else." "And he was right."
  M_(b17, b18, 'silence', 0, 'cut', 'cut'),               // Battery... one percent.
  M_(b18, b19, 'glitch_build', 0.5, 'swell', 'sting'),    // "undo all... Including you." -> sting on "Wait!"
  M_(b19, b20, 'silence', 0, 'cut', 'cut'),               // Wait!
  M_(b20, END, 'hook', 0.45, 'swell', 'sting'),           // "Let me fix it. Myself. One by one." -> button on the teleport flash
];

// ================================================================= AMBIENCE
const B = (start, end, name, gain_db) => ({ start: r3(start), end: r3(end), name, gain_db });
const ambience = [
  B(START, b9, 'vault_hum', -15),          // the server room: humming racks
  B(START, b9, 'room', -16),
  B(b1, b2, 'town', -18),                  // the live city feeds
  B(b9, b10, 'birds', -14),                // 65,000,000 B.C.
  B(b9, b10, 'wind', -20),
  B(b10, b11, 'vault_hum', -15),           // the replay CRTs (still the server room)
  B(b11, b13, 'birds', -16),               // 1964 porch
  B(b11, b13, 'town', -22),
  B(tSad - 0.1, b13, 'rain', -17),         // his tiny rain cloud
  B(b13, END, 'vault_hum', -15),           // back in the server room
  B(b13, END, 'room', -16),
];

// ================================================================= FOOTSTEPS
// 1964: Walter walks to the door — A.walk((t - b12) * 9): a step every PI / 9 s until he bonks at tDoors
const footsteps = [
  { start: r3(b12), end: r3(tDoors - 0.02), interval: r3(Math.PI / 9), surface: 'wood', gain_db: -10, pan: P(1110) },
];

// ================================================================= sanity: the beats must match the scene module's own
try {
  const sb = require('../../scenes/s09').beats;
  const mine = { b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15, b16, b17, b18, b19, b20, START, END };
  for (const k of Object.keys(mine)) if (Math.abs(sb[k] - mine[k]) > 1e-6) console.warn(`WARN beat ${k}: scene ${sb[k]} != generator ${mine[k]} (re-copy the timing block from scenes/s09.js)`);
} catch (e) { console.warn('(could not cross-check against scenes/s09.js: ' + e.message + ')'); }

// ================================================================= write
const out = { scene: 'SC 09', start: r3(START), end: r3(END), music, ambience, footsteps, sfx };
const J = (x) => JSON.stringify(x);
const txt = '{\n' +
  `  "scene": ${J(out.scene)},\n  "start": ${out.start},\n  "end": ${out.end},\n` +
  `  "music": [\n${music.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "ambience": [\n${ambience.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "footsteps": [\n${footsteps.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "sfx": [\n${sfx.map((m) => '    ' + J(m)).join(',\n')}\n  ]\n}\n`;
const dst = path.join(__dirname, 'sc09.json');
fs.writeFileSync(dst, txt);
console.log(`${dst}: ${music.length} music segments, ${ambience.length} beds, ${footsteps.length} footstep runs, ${sfx.length} sfx`);
