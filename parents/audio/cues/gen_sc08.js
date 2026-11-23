#!/usr/bin/env node
// Sound cue sheet generator for SC 08 · THE RAGE-QUIT: the family laughing at their screens + their trophy panels (BEST
// FIGHTER / RICHEST PLAYER / EVERYONE'S FAVORITE), "And you..." (the music drains), the leaderboard slide #2 -> #47 + THE SON
// stamp, the boiling face, the SLAM (monitor down like a laptop lid, keys flying -> silence), everyone turns, the rant (MY
// GAME!, HIRED! / TAKEN! stamps, the smash zoom on EVERYTHING), "Sweetie...", "I wish you never joined!", the run up the
// stairs + the door SLAM, the silent living room (the clock, Dad's glasses coming off), Granny's knitting needles + the
// pointing needle, the knock + the door, Dad's steps and the bed creak, the soft bedroom talk (polaroids, the NOT NOW, DAD
// pile), the roll-over, the clock flip, the ALARM (siren, sub drop, the Block King's eyes, everything RESET), the riser into
// SC 09.
// Every time comes from the voice timeline exactly like scenes/s08.js: the cut list (CUT) and the beats (BEATS) are imported
// from the scene module itself (built only from L(id).a/.b and .word()); the rest is re-derived with the same expressions.
// When the voice changes:  node audio/cues/gen_sc08.js && python3 audio/validate_cues.py audio/cues/sc08.json
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { CUT: C, BEATS: B, nnCount } = require('../../scenes/s08');
const { L } = V;

const A = Array.from({ length: 14 }, (_, i) => L('08.' + i));
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;
const T0 = V.scene('SC 08').start, END = V.scene('SC 09').start;    // == main.js RANGES for SC 08

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));     // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(t), name, g, pan, note]); };

// ================================================================= SFX, shot by shot (same order as scenes/s08.js)
// ---- 1. "Your mom was the best fighter." Mom laughing; her arena panel pops: BEST FIGHTER
add(T0, 'whoosh', -8, 0, 'cut into the living room (white smash)');
add(T0 + 0.1, 'giggle', -10, 0, 'the family laughing at their screens');
add(C.mom + 0.15, 'ui_pop', -4, P(1430), 'BEST FIGHTER panel');
add(C.mom + 0.3, 'punch', -10, P(1430), 'KO in the arena');
add(B.tBest, 'achievement', -6, P(1760), '#1');
// ---- 2. "Your granny was the richest player." whip right; coins
add(C.granny, 'whoosh', -6, 0.4, 'whip-pan to Granny');
add(C.granny + 0.12, 'ui_pop', -4, P(490), 'RICHEST PLAYER panel');
add(B.tRich, 'ka_ching', -2, P(490), 'the coins');
add(B.tRich + 0.1, 'coins', -8, P(1650), '$$$');
// ---- 3. "Your dad was everyone's favorite." whip left; the DAD crowd
add(C.dad, 'whoosh', -6, -0.4, 'whip-pan to Dad');
add(C.dad + 0.12, 'ui_pop', -4, P(1430), "EVERYONE'S FAVORITE panel");
add(C.dad + 0.3, 'crowd_cheer', -14, P(1430), 'the DAD crowd (inside the game)');
add(B.tFav, 'heart_pop', -6, P(560), 'hearts over the real Dad');
// ---- 4. "And you..." from behind the hero
add(C.behind, 'whoosh_long', -14, 0, 'slow push from behind the hero');
add(C.behind + 0.2, 'giggle', -14, 0.3, 'laughing, far away');
// ---- 5. "...were just 'the son.'" the board: YOU slides #2 -> #47, THE SON
add(C.board, 'click', -10, 0, 'the monitor');
add(C.board + 0.15, 'slide_down', -6, 0, 'YOU slides down the board');
add(C.board + 0.2, 'powerdown', -10, 0, '#2 -> #47');
add(B.tSon, 'stamp', 0, P(1080), 'THE SON stamp');
// ---- 6. the boiling face
add(C.seethe, 'heartbeat', -4, 0, 'he boils');
add(C.seethe + 0.25, 'steam_hiss', -6, P(600), 'steam');
// ---- 7. SLAM
add(C.slam, 'whoosh', -8, 0, 'hands grab the monitor');
add(B.tSlam - 0.1, 'whoosh_down', -6, 0, 'down it goes');
add(B.tSlam, 'impact', 3, 0, 'SLAM! the monitor face-down');
add(B.tSlam + 0.01, 'thud', 0, 0, 'desk hit');
for (let i = 0; i < 4; i++) add(B.tSlam + 0.05 + i * 0.07, 'click', -10, r3((hash(i) - 0.5) * 0.6), 'keycaps flying');
add(B.tSlam + 0.12, 'bonk', -12, 0.3, 'the mouse jumps');
// ---- 8. "This is MY game!" everyone turns
add(C.mygame, 'jump', -6, P(700), 'he jumps out of the chair');
add(B.tTurnFam, 'swish', -6, P(1000), 'Dad turns');
add(B.tTurnFam + 0.04, 'swish', -7, P(1340), 'Mom turns');
add(B.tTurnFam + 0.08, 'swish', -8, P(1750), 'Granny turns');
add(B.tTurnFam + 0.1, 'crowd_gasp', -10, 0.4, 'the family gasps');
add(w(2, 'MY'), 'boom', -4, P(980), 'MY GAME!');
// ---- 9. "My friends! My server!" the panels + stamps
add(B.tFriends - 0.15, 'ui_pop', -4, P(1440), 'Noodle at the factory');
add(B.tFriends + 0.43, 'stamp', -2, P(1450), 'HIRED!');
add(B.tServer - 0.15, 'ui_pop', -4, P(1500), 'the DAD crowd');
add(B.tServer + 0.43, 'stamp', -2, P(1500), 'TAKEN!');
// ---- 10. "You're taking EVERYTHING!" smash zoom
add(B.tEvery - 0.06, 'zoom_in', -2, 0, 'smash zoom');
add(B.tEvery, 'boom', 0, 0, 'EVERYTHING!');
add(B.tEvery + 0.1, 'steam_hiss', -6, P(700), 'steam');
// ---- 11. MOM: "Sweetie..."
add(C.sweetie, 'cloth', -12, P(1100), 'Mom lowers her tablet');
// ---- 12. "I wish you never joined!" he bolts
add(B.tJoined, 'zoom_in', -8, 0, 'push in on "joined"');
add(B.tGo, 'skid', -6, P(700), 'spins round');
add(B.tGo + 0.05, 'whoosh', -4, 0.5, 'bolts out of frame');
// ---- 13. the stairs + the door SLAM
add(C.stairs, 'whoosh', -6, 0.3, 'whip to the stairs');
add(B.tDoor, 'door_close', 4, P(1560), 'the door SLAMS');
add(B.tDoor + 0.02, 'impact', -4, P(1560), 'SLAM!!');
// ---- 14. the silent living room: the clock; Dad's glasses come off; "Maybe we pushed too hard."
for (let i = 0; i < 4; i++) add(C.silent + 0.1 + i * 0.5, 'countdown_tick', -16, P(1750), 'the wall clock ticks');
add(B.tGlass0, 'cloth', -12, P(1000), 'Dad raises his hand');
add(B.tGlassOff, 'glass', -10, P(1000), 'the glasses come off');
add(B.tGlassOff + 0.2, 'cloth', -14, P(1000), 'lowers them');
// ---- 15. "Go talk to him, dear." knitting needles
for (let i = 0; i < 6; i++) add(C.gtalk + 0.15 + i * 0.36, 'click', -18, P(1250), 'knitting needles');
// ---- 16. "Not you." Mom half-up, the needle
add(C.notyou - 0.05, 'cloth', -8, P(1000), 'Mom starts to get up');
add(w(6, 'Not') - 0.05, 'swish', -6, P(1500), 'the needle comes up');
add(C.him - 0.2, 'thud', -14, P(1000), 'Mom sits back down');
// ---- 17. "Him." the needle swings to Dad
add(C.him + 0.05, 'swish', -4, P(1300), 'the needle swings to Dad');
add(B.tHim, 'zoom_in', -4, 0, 'snap zoom onto Dad');
add(B.tHim + 0.3, 'gulp', -4, P(760), 'Dad gulps');
// ---- 18. the bedroom: knock, the door opens
add(C.door - 0.04, 'door_knock', -4, 0.5, 'knock knock');
add(B.tOpen, 'door_open', -6, 0.6, 'the door opens, hall light');
add(A[7].a + 0.3, 'cloth', -14, -0.4, 'the hero pulls the duvet up');
// ---- 19. Dad crosses the room and sits on the bed edge
add(B.tSit1 - 0.1, 'squeak', -12, 0, 'the bed creaks');
add(B.tSit1, 'cloth', -12, 0, 'sits');
// ---- 22. "noob?"
add(B.tNoob - 0.1, 'pop', -8, P(1200), '"noob?" thought pops');
// ---- 23. a year of polaroids
[[w(9, 'been') - 0.1, 470], [w(9, 'world') - 0.05, 960], [w(9, 'whole') - 0.1, 1450]].forEach(([t, x], j) => {
  add(t, 'camera_flash', -10, P(x), 'polaroid ' + (j + 1));
  add(t + 0.2, 'paper', -12, P(x), 'lands');
});
add(w(9, 'year') - 0.1, 'chime', -10, 0, '365 DAYS');
// ---- 24. "With you." the lamp warms
add(B.tWith - 0.3, 'harp_up', -14, 0, 'the warm glow');
// ---- 27. NOT NOW, DAD x200: the pile + the counter
add(C.notnow + 0.05, 'camera_flash', -10, P(700), 'the first memory');
{
  let last = 1;
  for (let t = w1(11, 'Dad'); t < B.tHundred + 0.06; t += 0.02) {
    const n = nnCount(t);
    if (n >= last + Math.max(1, Math.floor(n / 6))) { add(t, 'paper', -14 - Math.min(6, n / 40), r3((hash(n) - 0.5) * 0.8), 'snapshot #' + n); last = n; }
  }
}
add(w1(11, 'Dad'), 'money_counter', -12, 0, 'the counter rolls');
add(B.tHundred, 'pop', -4, 0, 'x200');
// ---- 28. he rolls over
add(B.tRoll - 0.2, 'cloth', -10, -0.4, 'the hero rolls over to face Dad');
add(C.clock - 0.5, 'electric', -16, 0.7, 'the first red flicker');
// ---- 29. the clock: 10:59 -> 11:00
add(C.clock, 'whoosh', -12, 0, 'cut to the bedside clock');
add(B.tPM, 'beep', -4, P(960), '11:00');
// ---- 30. the alarm
add(B.tAlarm, 'alarm', 2, 0.6, 'the PC flashes red');
add(B.tAlarm + 0.02, 'sub_drop', 2, 0, 'the alarm hit');
add(B.tSitUp, 'cloth', -8, -0.2, 'the hero sits bolt upright');
add(B.tAlarm + 0.3, 'whoosh_long', -8, 0.4, 'push to the monitor');
// ---- 31. SYSTEM: the banner, the Block King's eyes
add(C.warn - 0.1, 'glitch', -6, 0, 'WARNING banner');
add(C.warn, 'siren', -6, 0, 'siren');
add(B.tKing - 0.1, 'monster_growl', -4, P(960), 'the Block King on the monitor');
add(B.tAwake, 'boom', 0, P(960), 'his eyes ignite');
add(B.tAwake + 0.1, 'rumble', -6, 0, 'rumble');
// ---- 32. "If the server falls..."
add(C.faces, 'heartbeat', -6, 0, 'scared');
add(C.faces + 0.9, 'siren', -8, 0, 'siren');
// ---- 33. "...everything resets!"
for (let j = 0; j < 4; j++) add(C.resets + j * 0.08, 'pop', -8, P([540, 1380, 540, 1380][j]), 'record tile');
add(B.tResets - 0.15, 'money_counter', -8, 0, 'everything rolls back to zero');
add(B.tResets, 'glitch_long', -2, 0, 'pixel glitch');
add(B.tResets + 0.3, 'stamp', 0, 0, 'RESET');
add(B.tResets + 0.1, 'powerdown', -6, 0, 'reset');
// ---- 34. the hero's face; the red flash into SC 09
add(C.final, 'zoom_in', -10, 0, 'push in on the hero');
add(END - 2.0, 'riser', -4, 0, 'into SC 09 (red flash)');
sfx.sort((a, b) => a[0] - b[0]);

// ================================================================= music (tiles [T0, END])
const M = [];
const seg_ = (a, b, mood, energy, inn, out) => { if (b - a > 0.05) M.push({ start: r3(a), end: r3(b), mood, energy, in: inn, out }); };
seg_(T0, C.behind, 'family', 0.5, 'cut', 'fade');                  // the family's trophies
seg_(C.behind, B.tSlam, 'sad', 0.35, 'fade', 'cut');               // "And you... just the son", the boiling
seg_(B.tSlam, C.mygame, 'silence', 0, 'cut', 'cut');               // SLAM -> silence
seg_(C.mygame, C.sweetie, 'epic', 0.55, 'cut', 'cut');             // the rant
seg_(C.sweetie, B.tDoor, 'sad', 0.4, 'fade', 'cut');               // "Sweetie..." / "I wish you never joined!" / the run
seg_(B.tDoor, C.gtalk, 'silence', 0, 'cut', 'cut');                // the silent living room
seg_(C.gtalk, C.door, 'tender', 0.25, 'fade', 'fade');             // Granny: "Go talk to him."
seg_(C.door, C.clock, 'tender', 0.4, 'fade', 'fade');              // the bedroom talk
seg_(C.clock, B.tAlarm, 'mystery', 0.35, 'fade', 'cut');           // "at eleven p.m...."
seg_(B.tAlarm, END, 'boss', 0.85, 'cut', 'cut');                   // the alarm -> SC 09

// ================================================================= ambience + footsteps
const amb = [];
const bed = (a, b, name, g) => { if (b - a > 0.05) amb.push({ start: r3(a), end: r3(b), name, gain_db: g }); };
bed(T0, C.stairs, 'room', -14);
bed(C.stairs, B.tDoor + 0.3, 'room', -16);
bed(B.tDoor + 0.3, C.door, 'night', -12);
bed(C.door, END, 'night', -12);
const steps = [];
const run = (s0, s1, interval, surface, g, pan) => { if (s1 - s0 > 0.1) steps.push({ start: r3(s0), end: r3(s1), interval: r3(interval), surface, gain_db: g, pan }); };
run(B.tGo, C.stairs, Math.PI / 22, 'wood', -6, 0.5);               // he bolts
run(C.stairs, B.tDoor - 0.12, 0.09, 'wood', -4, 0.3);              // up the stairs (a blur)
run(C.walk, B.tSit0, Math.PI / 7, 'wood', -12, 0.2);               // Dad crosses the bedroom

const out = { scene: 'SC 08', start: r3(T0), end: r3(END), music: M, ambience: amb, footsteps: steps, sfx };
fs.writeFileSync(path.join(__dirname, 'sc08.json'), JSON.stringify(out, null, 1));
console.log(`sc08.json: ${sfx.length} sfx, ${M.length} music segments, ${amb.length} beds, ${steps.length} footstep runs`);
