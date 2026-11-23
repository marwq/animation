#!/usr/bin/env node
// Sound cue sheet generator for SC 07 · EVERYBODY'S DAD (the lobby at sunset, the first obby over water): the pixel wipe in,
// the edge + jump guide, the fast-forward time-lapse (splashes + the clock rolling to 2:47:00), "Okay." (knuckle crack), the
// real keyboard press, the tiny hop + SPLASH, the split "Space... BAR!", the run + leap + cartoon hang + SPLASH 2, the sigh,
// the noobs joining (toasts + footsteps), the caps chat, the thumbs up, the rain cloud, the noob's jump (NICE!), the jump
// panels, COMEDY NIGHT (spotlight, the confused noobs, the cube tumbleweed, BA-DUM TSS, the LOL flood), the crate speech
// (FALLS 200, the cheer), the sunset time-lapse, the DAD!! flood + the new nametag, the KID's tug, the hearts, the group hug,
// Noodle's line, the side hug, the hero alone, the match cut to the real hero (the family laughing).
// Every time comes from the voice timeline exactly like scenes/s07.js: the cut list (CUT) and the beats (BEATS) are imported
// from the scene module itself (built only from L(id).a/.b and .word()); the rest is re-derived with the same expressions.
// When the voice changes:  node audio/cues/gen_sc07.js && python3 audio/validate_cues.py audio/cues/sc07.json
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { CUT: C, BEATS: B } = require('../../scenes/s07');
const { L } = V;

const A = Array.from({ length: 12 }, (_, i) => L('07.' + i));
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;
const T0 = V.scene('SC 07').start, END = V.scene('SC 08').start;    // == main.js RANGES for SC 07

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));     // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(t), name, g, pan, note]); };

// ================================================================= SFX, shot by shot (same order as scenes/s07.js)
// ---- 1. "And Dad?" pixel wipe in from Tycoon Valley, tilt down onto the hot dog
add(T0, 'pixel_wipe', -6, 0, 'pixel wipe in from SC 06');
add(T0 + 0.1, 'whoosh_down', -8, 0, 'tilt down from the sunset sky');
add(w(0, 'Dad'), 'pop', -8, P(1100), '"?" pops over the hot dog');
// ---- 2. the edge: he peeks down; the dotted jump arc draws itself; JUMP! arrow
add(C.edge, 'whoosh', -10, 0, 'cut to the edge');
add(C.edge + 0.35, 'gulp', -6, P(900), 'peeks down at the water');
for (let i = 0; i < 5; i++) add(w(0, 'first') - 0.1 + i * 0.12, 'tap', -14, P(800 + i * 80), 'jump guide dot');
add(w(0, 'jump') + 0.25, 'ui_pop', -6, P(1400), 'JUMP! arrow');
// ---- 3. "For almost three hours." the fast-forward: falls on loop, the clock rolls to 2:47:00, FALLS 198
add(C.lapse, 'vhs_clunk', -6, 0, 'fast-forward x600');
add(C.lapse + 0.05, 'money_counter', -8, P(1420), 'TIME ON STAGE 1 rolling');
add(C.lapse + 0.6, 'money_counter', -10, P(1420), 'counter rolling');
for (let n = 0; n < 6; n++) { const t = C.lapse + (n + 0.62) / 2.6; if (t < B.tFF1) add(t, 'splash', -10 - n, P(560), 'fast-forward splash #' + (n + 1)); }
add(B.tFF1, 'boom', -2, P(1420), '2:47:00 lands, FALLS 198');
// ---- 4. "Okay." the knuckle crack
add(C.okay, 'whoosh', -10, 0, 'close on the hot dog');
add(w(1, 'Okay') + 0.25, 'egg_crack', -6, P(700), 'bun-arm crack');
add(w(1, 'Okay') + 0.38, 'egg_crack', -8, P(1250), 'CRACK!');
// ---- 5. "Space... bar." the real keyboard, the finger lands
add(C.key, 'whoosh', -8, 0, 'cut to the real keyboard');
add(B.tPress1, 'click', 0, P(1000), 'the SPACE BAR press');
add(B.tPress1 + 0.02, 'zoom_in', -8, 0, 'PRESS smash');
// ---- 6. the tiny hop, the windmill, SPLASH
add(B.tHop1, 'jump_game', -4, P(820), 'a tiny hop');
add(B.tHop1 + 0.26, 'slip', -6, P(860), 'windmilling on the edge');
add(B.tTopple1, 'whoosh_down', -6, P(900), 'topples off');
add(B.tSplash1, 'splash', 0, P(1000), 'SPLASH!');
add(B.tSplash1 + 0.3, 'bubbles', -10, P(1000), 'bubbles');
add(B.tSplash1 + 0.05, 'pop', -10, P(150), 'FALLS 199');
// ---- 7. "Space... BAR!" the split: the real Dad yelling | the respawn + the run-up
add(C.yell, 'whoosh', -6, -0.5, 'real Dad panel slides in');
add(C.yell + 0.06, 'whoosh', -6, 0.5, 'game panel slides in');
add(B.tResp1, 'respawn', -4, P(1500), 'the hot dog respawns');
add(w(1, 'Space', 1), 'impact', -8, P(470), 'SPACE...');
add(w(1, 'bar', 1), 'boom', -2, P(520), 'BAR!');
// ---- 8. the run, the leap, the cartoon hang, SPLASH 2
add(B.tLeap, 'jump_game', -2, P(900), 'the leap');
add(B.tLeap + 0.02, 'whoosh_up', -6, P(900), 'up');
add(B.tApex, 'squeak', -4, P(960), 'stops in mid-air');
add(B.tApex + 0.2, 'cricket', -10, P(1200), 'the hang: he looks at us');
add(B.tDrop, 'whoosh_down', -2, P(960), 'drops');
add(B.tSplash2, 'big_splash', 2, P(960), 'SPLASH!!');
add(B.tSplash2 + 0.35, 'bubbles', -8, P(960), 'bubbles');
add(B.tSplash2 + 0.5, 'boing', -12, P(1050), 'a sandal floats up');
add(B.tSplash2 + 0.05, 'pop', -10, P(150), 'FALLS 200');
// ---- 9. "But then something strange happened." respawn, sits down, sighs; a noob peeks in
add(B.tResp2, 'respawn', -6, P(900), 'respawn');
add(B.tResp2 + 1.0, 'cloth', -12, P(900), 'the sigh');
add(w(2, 'strange'), 'pop', -8, P(1100), '"?"');
// ---- 10. the noobs gather: three join toasts
add(C.gather, 'whoosh', -10, 0, 'crane wide');
add(w(2, 'new') - 0.1, 'notify', -6, 0.6, 'Guest_3217 joined the server');
add(w(2, 'started') - 0.1, 'notify', -7, 0.6, 'lil_noob_7 joined the server');
add(w(2, 'around'), 'notify', -8, 0.6, 'Guest_8846 joined the server');
// ---- 11. "You can do it, kiddo!" caps chat
add(C.kiddo, 'whoosh', -10, 0, 'cut');
add(A[3].a - 0.25, 'chat_pop', -6, P(600), 'caps bubble');
add(A[3].a - 0.05, 'typing', -10, P(600), 'CAPS typing');
// ---- 12. "I believe in you!" thumbs up, rays
add(C.believe, 'zoom_in', -10, 0, 'push in');
add(w(3, 'believe'), 'shine', -4, P(960), 'two thumbs up');
add(w(3, 'believe') + 0.05, 'sparkle', -8, P(960), 'burst');
// ---- 13. "I don't believe in ME..." the little rain cloud
add(w(3, 'ME') - 0.05, 'poof', -6, P(1100), 'the rain cloud pops');
// ---- 14. "...but I believe in you!" the noob runs, jumps, lands: NICE!
add(B.tJump, 'jump_game', -2, P(800), 'the noob jumps');
add(B.tLandJ, 'land', -4, P(1200), 'lands on the red platform');
add(B.tLandJ + 0.02, 'confirm', -4, P(1300), 'NICE! check');
add(B.tLandJ + 0.1, 'crowd_cheer', -8, 0, 'the noobs cheer');
// ---- 15. "He cheered for every jump." three jump panels on the words
add(C.cheer, 'whoosh', -10, 0, 'cut to the dance');
[w(4, 'cheered'), w(4, 'every'), w(4, 'jump')].forEach((tw, j) => {
  add(tw - 0.05, 'ui_pop', -6, P(330 + 630 * j), 'jump panel ' + (j + 1));
  add(tw + 0.35, 'jump_game', -10, P(330 + 630 * j), 'panel noob lands');
  add(tw + 0.4, 'coin', -10, P(330 + 630 * j), '+1');
});
// ---- 16. "He told terrible jokes." COMEDY NIGHT: spotlight, the caps question
add(C.jokes, 'toggle', -4, 0, 'spotlight on');
add(C.jokes + 0.1, 'ui_pop', -8, P(250), 'COMEDY NIGHT tag');
add(A[5].a - 0.2, 'chat_pop', -8, P(1000), 'caps bubble');
add(A[5].a, 'typing', -12, P(1000), 'typing the joke');
add(w(5, 'road') + 0.1, 'blink', -8, 0, 'confused noobs');
// ---- 17. "He couldn't!" Dad cracking himself up
add(C.punch, 'zoom_in', -8, 0, 'close on Dad');
// ---- 17b. "...stuck in the lobby!" deadpan noobs + the cube tumbleweed
add(C.deadpan + 0.1, 'cricket', -2, 0, 'nobody laughs');
add(C.deadpan + 0.15, 'wind_gust', -12, -0.4, 'the cube tumbleweed rolls through');
// ---- 18. "Like me!" ta-da, the drum kit rises, BA-DUM TSS
add(w(5, 'Like'), 'zoom_in', -4, 0, 'smash zoom');
add(B.tRim - 0.3, 'whoosh_up', -10, P(1560), 'the drum kit rises');
add(B.tRim, 'rimshot', 2, P(1560), 'BA-DUM TSS!');
// ---- 19. the LOL flood
add(C.lol, 'kids_laugh', 0, 0, 'the noobs crack up');
for (let i = 0; i < 10; i++) add(C.lol + 0.1 + i * 0.11, 'chat_pop', -12 - (i % 3), r3((hash(i * 3.1) - 0.5) * 1.2), 'LOL / XD / DAD JOKE!!');
// ---- 20. "Listen up, kids!" he scrambles onto the crate
add(C.crate, 'whoosh', -10, 0, 'cut to the crate');
add(C.crate + 0.1, 'cloth', -8, P(960), 'climbs');
add(C.crate + 0.5, 'land', -6, P(960), 'on top of the crate');
add(A[6].a - 0.1, 'chat_pop', -8, P(1100), 'caps bubble');
// ---- 21. "Falling is not failing!" heroic low angle, fist up
add(C.notfail, 'whoosh', -10, 0, 'low angle');
add(w(6, 'not'), 'orch_hit', -2, P(1000), 'fist up, burst');
// ---- 22. "Failing is when you stop trying!" the faces
add(C.trying + 0.1, 'sparkle', -10, 0, 'star eyes');
// ---- 23. "I fell two hundred times today!" FALLS 200, the cheer
add(w(6, 'hundred'), 'pop', -2, P(250), 'FALLS 200 bumps');
add(w(6, 'today'), 'crowd_cheer', -2, 0, 'the crowd cheers');
add(w(6, 'today') + 0.1, 'applause', -8, 0, 'applause');
// ---- 24. "By sunset..." the time-lapse
add(C.sunset, 'whoosh_long', -6, 0, 'time-lapse, crane up');
add(C.sunset + 0.05, 'vhs_clunk', -10, 0, 'fast-forward');
add(C.sunset + 0.1, 'money_counter', -12, P(250), 'the clock flies');
// ---- 25. "...the whole server was calling him Dad." the DAD!! flood, the nametag
add(C.dadname + 0.2, 'crowd_cheer', -6, 0, '"DAD!!"');
for (let i = 0; i < 12; i++) add(C.dadname + 0.3 + i * 0.25, 'chat_pop', -12 - (i % 3), r3((hash(i * 5.3) - 0.5) * 1.2), 'DAD!! bubble');
add(B.tDadName, 'achievement', -2, P(960), 'nametag DadBod1978 -> DAD');
add(B.tDadName + 0.1, 'heart_pop', -6, P(960), 'hearts');
// ---- 26. "Mister Hot Dog?" the tug
add(C.tug, 'whoosh', -12, 0, 'low cut');
for (let i = 0; i < 3; i++) add(C.tug + 0.25 + i * 0.26, 'cloth', -12, P(1250), 'tug on the sleeve');
add(A[8].a - 0.2, 'chat_pop', -8, P(1300), 'lil_noob_7 bubble');
// ---- 27. "Can you be my dad too?"
add(C.kidcu, 'music_box', -10, 0, 'the KID close-up');
// ---- 28. "Of course, kiddo." split: real Dad touched | kneeling hot dog
add(C.ofc, 'whoosh', -8, 0, 'split');
add(C.ofc + 0.3, 'heart_pop', -4, P(1500), 'hearts');
add(C.ofc + 0.1, 'blush', -8, P(480), 'the real Dad tears up');
// ---- 29. "Everybody gets a dad today!" the group hug
add(w(9, 'Everybody'), 'cloth', -6, P(960), 'arms wide');
add(w(9, 'Everybody') + 0.1, 'crowd_cheer', -6, 0, 'everyone piles in');
add(w(9, 'Everybody') + 0.2, 'heart_pop', -4, P(960), 'hearts everywhere');
add(A[9].a - 0.15, 'chat_pop', -10, P(960), 'caps bubble');
// ---- 30. Noodle
add(C.noodle, 'whoosh', -12, 0, 'cut to Noodle');
add(A[10].a - 0.2, 'chat_pop', -8, P(700), 'NoodleBoi bubble');
// ---- 31. "My dad never plays with me." the side hug
add(w(10, 'plays') - 0.4, 'cloth', -10, P(900), 'Dad\'s arm round Noodle');
add(w(10, 'plays') + 0.3, 'sparkle', -14, P(900), 'warm sparkle');
// ---- 32. the hero alone
add(C.far, 'wind_gust', -12, -0.3, 'the hero, alone, far away');
// ---- 33. "...He's MY dad."
add(C.mine, 'heartbeat', -10, 0, 'letterbox, jealous');
// ---- 34. match cut to the real hero
add(C.real, 'whoosh', -8, 0, 'match cut to the real hero');
add(C.real + 0.25, 'giggle', -6, 0.4, 'the family laughing at their screens');
sfx.sort((a, b) => a[0] - b[0]);

// ================================================================= music (tiles [T0, END])
const M = [];
const seg_ = (a, b, mood, energy, inn, out) => { if (b - a > 0.05) M.push({ start: r3(a), end: r3(b), mood, energy, in: inn, out }); };
seg_(T0, C.lapse, 'lobby', 0.45, 'fade', 'cut');                    // "And Dad?" still on stage 1
seg_(C.lapse, C.okay, 'montage', 0.85, 'cut', 'sting');            // the fast-forward, 2:47:00
seg_(C.okay, B.tSplash1, 'epic', 0.4, 'swell', 'scratch');          // "Okay. Space... bar." mock-heroic -> SPLASH
seg_(B.tSplash1, B.tApex, 'playful', 0.55, 'cut', 'cut');           // the respawn, "BAR!", the run-up
seg_(B.tApex, B.tDrop, 'silence', 0, 'cut', 'cut');                 // the cartoon hang
seg_(B.tDrop, C.sit, 'playful', 0.5, 'cut', 'fade');                // SPLASH 2
seg_(C.sit, C.kiddo, 'mystery', 0.35, 'fade', 'cut');               // "something strange happened", the noobs gather
seg_(C.kiddo, B.tJump, 'warm', 0.45, 'swell', 'cut');               // "You can do it, kiddo!"
seg_(B.tJump, C.jokes, 'family', 0.75, 'cut', 'cut');               // the jump, the dance, every jump
seg_(C.jokes, C.deadpan, 'playful', 0.45, 'cut', 'cut');            // COMEDY NIGHT
seg_(C.deadpan, B.tRim, 'silence', 0, 'cut', 'cut');                // crickets + tumbleweed
seg_(B.tRim, C.crate, 'playful', 0.7, 'cut', 'cut');                // BA-DUM TSS, the LOL flood
seg_(C.crate, C.sunset, 'epic', 0.6, 'swell', 'sting');             // the crate speech
seg_(C.sunset, C.tug, 'warm', 0.75, 'swell', 'fade');               // by sunset... DAD!!
seg_(C.tug, C.far, 'tender', 0.45, 'fade', 'fade');                 // the KID, "Everybody gets a dad today!", Noodle
seg_(C.far, END, 'sad', 0.35, 'fade', 'cut');                       // the hero alone; "...He's MY dad." -> the real hero

// ================================================================= ambience + footsteps
const amb = [];
const bed = (a, b, name, g) => { if (b - a > 0.05) amb.push({ start: r3(a), end: r3(b), name, gain_db: g }); };
const REAL = [[C.key, C.hop1], [C.yell, C.leap], [C.ofc, C.everyb], [C.real, END]];
let a = T0;
for (const [r0, r1] of REAL) { bed(a, r0, 'town', -18); bed(r0, r1, 'room', -14); a = r1; }
bed(C.gather, C.tug, 'crowd', -16);
bed(C.tug, C.real, 'crowd', -20);
bed(T0, C.gather, 'ocean', -20);
const steps = [];
const run = (s0, s1, interval, surface, g, pan) => { if (s1 - s0 > 0.1) steps.push({ start: r3(s0), end: r3(s1), interval: r3(interval), surface, gain_db: g, pan }); };
run(C.lapse, B.tFF1, 0.18, 'hard', -14, -0.3);                               // the fast-forward walks off the edge
run(B.tResp1 + 0.35, w(1, 'bar', 1) - 0.1, Math.PI / 9, 'hard', -12, 0.5);   // backing up for the run-up
run(C.leap, B.tLeap, Math.PI / 24, 'hard', -8, 0);                           // the run
run(w(2, 'strange'), w(2, 'strange') + 0.9, Math.PI / 10, 'hard', -14, -0.2); // the noob peeks in
run(C.gather, C.gather + 2.8, 0.16, 'hard', -12, 0);                          // the noobs walking in
run(B.tJump - 0.3, B.tJump, Math.PI / 26, 'hard', -10, -0.1);                // the noob's run-up
run(w(9, 'Everybody') + 0.1, w(9, 'Everybody') + 0.9, 0.12, 'hard', -12, 0);  // the group hug rush

const out = { scene: 'SC 07', start: r3(T0), end: r3(END), music: M, ambience: amb, footsteps: steps, sfx };
fs.writeFileSync(path.join(__dirname, 'sc07.json'), JSON.stringify(out, null, 1));
console.log(`sc07.json: ${sfx.length} sfx, ${M.length} music segments, ${amb.length} beds, ${steps.length} footstep runs`);
