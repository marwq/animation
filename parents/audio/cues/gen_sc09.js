#!/usr/bin/env node
// Sound cue sheet generator for SC 09 · THE BLOCK KING: the rise behind the city (rumble, riser, title sting, boss bar),
// "CUBE CITY... IS MINE!" (roar, lightning, shockwave), the three smashes (arena / Tycoon Valley / Granny's factory + the
// cookie on the lens), "MY COOKIES!" (music drop + boom), DarkBlade's clan flicked into the sky (slap, boing, twinkles,
// cricket + tumbleweed), Noodle's call (@YOU pings, the falling block), the server health 90 -> 50 -> 20 % (impacts, glitch,
// alarm), the bedroom (tender), the run down the stairs, "Bedtime." (scratch + boom), the silent beat (the tea cup clink,
// the headset click), "Let's go." (orchestra hit), Granny's knuckle cracks, the family logging in (four toasts) and the dive
// into the screen.
// Every time comes from the voice timeline exactly like scenes/s09.js: the cut list (C) and the beats (B) are computed by
// scenes/s09_env.js times09() from L(id).a/.b and .word() only. When the voice changes:
//   node audio/cues/gen_sc09.js && python3 audio/validate_cues.py audio/cues/sc09.json
// Output: audio/cues/sc09.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { times09 } = require('../../scenes/s09_env');

const TM = times09(V);
const { START: T0, END, C, B, n: LN } = TM;          // == main.js RANGES for SC 09

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const lerp = (a, c, k) => a + (c - a) * k;
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));     // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(t), name, g, pan, note]); };

// ================================================================= SFX, shot by shot (same order as scenes/s09.js)
// ---- A1/A2: the Block King rises behind the city
add(T0, 'sub_drop', -2, 0, 'red flash: the alarm becomes the night city');
add(T0 + 0.05, 'rumble', -2, 0, 'the ground shakes, rubble rising behind the city');
add(T0 + 0.5, 'stone', -8, 0.25, 'cubes tumbling off his crown');
add(B.king, 'boom', -2, 0, 'the purple eyes ignite on "King"');
add(B.king + 0.25, 'crowd_gasp', -10, 0.4, 'the players on the ledge flinch');
add(C.a2, 'rumble', -4, 0, 'he keeps rising, tilt up');
add(B.history - 2.0, 'riser', -6, 0, 'the rise builds to his full height');
add(B.title - 0.15, 'dramatic', -4, 0, 'THE BLOCK KING title drops in');
add(B.history + 0.1, 'impact', -2, 0, 'fully risen: purple flash');
add(B.history + 0.05, 'ui_pop', -6, 0, 'boss bar drops in');
// ---- B1/B2: "CUBE CITY... IS MINE!"
add(C.b1, 'whoosh', -6, 0.3, 'whip to the face close-up');
add(B.cube, 'monster_growl', -8, 0, 'the jaw grinds');
add(C.b2, 'zoom_in', -6, 0, 'smash-zoom out');
add(B.mine - 0.05, 'thunder', -4, -0.3, 'lightning on MINE');
add(B.mine, 'monster_roar', -6, 0, 'the roar (softened under the voice)');
add(B.mine + 0.02, 'impact', 0, 0, 'shockwave across the city');
add(B.mine + 0.25, 'rock_drop', -6, 0.3, 'debris raining down');
add(B.mine + 0.3, 'crowd_gasp', -8, -0.4, 'players flee across the ledge');
add(B.mineEnd + 0.3, 'stone', -6, 0, 'the fists go up, aiming at the arena');
// ---- C1/C2/C3: the smashes
const smash = (tc, tHit, x, dir, what) => {
  add(tc, 'whoosh', -6, dir * 0.3, 'whip-pan to ' + what);
  add(tHit - 0.34, 'whoosh_down', -4, P(x), 'the giant fist falls on ' + what);
  add(tHit, 'explosion', 0, P(x), what + ' smashed');
  add(tHit + 0.02, 'boom', -4, P(x), 'shockwave + white flash');
  add(tHit + 0.18, 'rock_drop', -6, P(x) + 0.1, 'cubes and rubble');
  add(tHit + 0.75, 'stone', -10, P(x), 'the fist lifts away');
};
add(B.arena - 0.35, 'crowd_gasp', -8, 0, 'the arena crowd sees the shadow');
smash(C.c1, B.arena, 960, -1, 'the arena');
smash(C.c2, B.tycoon, 900, 1, 'Tycoon Valley (castle towers)');
smash(C.c3, B.factory, 1000, -1, "Granny's cookie factory");
for (let i = 0; i < 5; i++) add(B.factory + 0.1 + i * 0.13, 'pop', -12, P(800 + i * 120), 'cookies flying');
add(LN[2].b + 0.15, 'whoosh', -4, 0.2, 'one cookie flies at the camera (slow motion)');
add(C.d1 - 0.27, 'egg_crack', -2, 0.2, 'the cookie cracks on the lens');
// ---- D1: "MY COOKIES!" (real Granny)
add(C.d1, 'whoosh', -8, 0.3, 'cut to the real living room');
add(B.cookies, 'boom', 0, 0.3, 'MY COOKIES! punch-in on Granny');
add(B.cookies + 0.15, 'steam_hiss', -6, 0.35, 'steam off her curlers');
// ---- E1/E2/E3: DarkBlade's clan
add(C.e1, 'whoosh', -6, -0.3, 'whip to DarkBlade on the roof');
add(LN[4].a - 0.3, 'chat_pop', -8, P(720), '"Clan, attack!" bubble');
add(LN[4].a - 0.1, 'shine', -6, P(780), 'sword raised, red glint');
add(LN[4].a, 'typing', -14, P(720), 'typing');
for (let i = 0; i < 4; i++) add(B.attack + i * 0.1, i ? 'jump' : 'whoosh_up', i ? -10 : -6, P(1000 + i * 120), 'the clan leaps off the roof');
add(B.flick - 0.05, 'swish', -6, 0.3, 'the boss winds up the flick');
add(B.flick, 'slap', 0, 0.3, 'FLICK');
add(B.flick + 0.03, 'boing', -4, 0.3, 'the clan launched');
const SKY = [230, 700, 1290, 1720];
for (let i = 0; i < 4; i++) {
  add(B.flick + i * 0.05 + 0.02, 'whoosh_up', -10, P(SKY[i]), 'clan member flies away');
  add(B.flick + i * 0.05 + 0.8, 'shine', -8, P(SKY[i]), 'twinkle in the sky');
}
add(LN[4].word('Clan', 1).t0 - 0.25, 'chat_pop', -10, P(300), '"Clan?" bubble');
add(C.e3, 'whoosh', -8, 0.3, 'whip to DarkBlade alone');
add(B.clan2 - 0.2, 'chat_pop', -6, 0, '"CLAN?!" bubble');
add(LN[4].b - 0.1, 'wind_gust', -10, 0.4, 'a tumbleweed rolls by');
add(LN[4].b + 0.3, 'cricket', -6, 0, 'awkward silence');
// ---- F1: Noodle
add(C.f1, 'whoosh', -6, -0.3, 'whip to Noodle');
add(C.f1 + 0.2, 'ui_pop', -8, -0.7, 'FRIENDS card: YOU offline');
add(LN[5].a - 0.3, 'chat_pop', -8, 0.1, "Noodle's bubble");
add(LN[5].a, 'typing', -12, 0.1, 'typing');
add(LN[5].word('ARE').t0, 'notify', -4, -0.6, '@YOU ping');
add(B.need - 0.3, 'whoosh_down', -6, 0.3, 'a stone block falls');
add(B.need, 'rock_drop', 0, 0.3, 'the block crashes next to Noodle');
add(B.need + 0.02, 'notify', -6, -0.6, '@YOU ping again');
// ---- G1-G4: the server health bar
add(C.g1, 'whoosh', -6, 0.3, 'whip to the city wide');
add(C.g1 + 0.1, 'ui_pop', -4, 0, 'SERVER HEALTH bar in');
for (const s0 of [C.g1 + 0.55, C.g1 + 1.45]) { add(s0, 'boom', -4, 0, 'double-fist slam'); add(s0 + 0.1, 'rock_drop', -10, 0.2, 'debris'); }
add(B.ninety, 'impact', -2, 0, '90 % (the arena wreck)');
add(B.ninety + 0.02, 'glitch', -8, 0, 'bar flash');
add(B.fifty, 'impact', 0, 0, '50 % (the factory wreck)');
add(B.fifty + 0.02, 'glitch', -6, 0, 'bar flash');
add(B.twenty, 'explosion', 0, 0, '20 %: red alarm, the boss roars');
add(B.twenty + 0.05, 'alarm', -6, 0, 'warning edges pulse');
// ---- H: the bedroom
add(C.h1, 'alarm_beep', -16, 0.4, 'the red PC warning in the bedroom');
add(C.h1 + 0.1, 'cloth', -10, 0.2, 'he turns to Dad');
add(B.dont - 0.25, 'cloth', -10, 0.2, 'Dad puts his glasses back on');
add(B.dont + 0.05, 'shine', -6, 0.25, 'sparkle on "don\'t"');
// ---- I: down the stairs, into the living room
add(C.i1, 'whoosh', -6, -0.3, 'whip to the stairs');
add(C.i2, 'whoosh', -6, -0.3, 'he bursts into the living room');
add(C.i2 + 0.5, 'skid', -4, 0.3, 'skid stop');
// ---- J: "It's eleven p.m., young man. Bedtime."
add(C.j1, 'whoosh', -8, 0.3, 'whip to the wall clock');
add(B.eleven, 'countdown_tick', -4, 0.3, 'the clock ticks to 11:00');
add(B.eleven + 0.05, 'bell', -12, 0.3, '11 o\'clock');
add(B.bedtime, 'boom', -2, -0.3, 'BEDTIME. punch-in');
add(B.bedtime + 0.15, 'slide_down', -8, 0.4, 'the hero deflates');
// ---- K: the silence -> the headset -> "Let's go."
add(B.clink, 'glass', -2, 0.1, 'the tea cup clinks down on the table');
add(C.k2, 'cloth', -12, 0, 'the headset lowers into frame');
add(B.click, 'click', -2, 0, 'the headset clicks on');
add(B.click + 0.02, 'tv_on', -8, 0, 'the cups light up');
add(B.click + 0.15, 'shine', -4, 0.1, 'glint on her glasses');
add(C.k3, 'whoosh_up', -4, 0, 'low angle, rays');
add(B.go, 'orch_hit', 2, 0, 'LET\'S GO.');
add(B.go + 0.02, 'impact', -2, 0, 'smash-zoom');
// ---- L: Granny cracks her knuckles
add(C.l1, 'whoosh', -6, 0.3, 'whip to Granny');
add(B.crack1, 'egg_crack', -2, 0.35, 'CRACK!');
add(B.crack2, 'egg_crack', -2, -0.2, 'CRACK!');
// ---- M: the whole family logs in
add(C.m1, 'whoosh', -8, -0.3, 'cut to the wide living room');
add(C.m1 + 0.3, 'tv_on', -6, 0, 'the screens light up');
add(C.m1 + 0.35, 'thud', -6, -0.05, 'Dad flops onto the couch');
add(C.m1 + 0.38, 'boing', -12, -0.05, 'couch squash');
add(C.m1 + 0.7, 'loading', -10, -0.4, 'JOINING SERVER...');
const PAN4 = [-0.33, 0.33, -0.33, 0.33];
B.pan.forEach((tp, i) => add(tp - 0.1, 'ui_pop', -4, PAN4[i], 'face panel pops in'));
for (let i = 0; i < 4; i++) add(B.logged + i * 0.12, 'notify', -6, PAN4[i], '"joined the server" toast');
add(B.together - 0.05, 'level_up', -2, 0, 'THE FAMILY IS ONLINE');
add(B.dive, 'whoosh_long', -4, 0, 'push into the screen');
add(END - 0.45, 'portal_enter', -4, 0, 'into the game -> white');
sfx.sort((a, b) => a[0] - b[0]);

// ================================================================= music (tiles [T0, END])
const M = [];
const seg_ = (a, b, mood, energy, inn, out) => { if (b - a > 0.05) M.push({ start: r3(a), end: r3(b), mood, energy, in: inn, out }); };
seg_(T0, C.c1, 'boss', 0.7, 'swell', 'cut');                       // the rise, CUBE CITY... IS MINE!
seg_(C.c1, C.d1, 'boss', 0.85, 'cut', 'scratch');                  // the three smashes -> scratch on MY COOKIES
seg_(C.d1, C.e1, 'silence', 0, 'cut', 'cut');                      // MY COOKIES! (voice + boom alone)
seg_(C.e1, C.e3, 'boss', 0.65, 'cut', 'tapestop');                 // Clan, attack! ... the flick
seg_(C.e3, C.f1, 'silence', 0, 'cut', 'cut');                      // CLAN?! + tumbleweed + cricket
seg_(C.f1, C.h1, 'boss', 0.8, 'cut', 'cut');                       // Noodle, the health bar 90 -> 20
seg_(C.h1, C.i1, 'tender', 0.35, 'fade', 'cut');                   // Dad... I can't win this alone. / Then don't.
seg_(C.i1, C.j1, 'epic', 0.6, 'swell', 'scratch');                 // down the stairs: Mom! Grandma!
seg_(C.j1, C.k1, 'playful', 0.3, 'cut', 'cut');                    // It's eleven p.m., young man. Bedtime.
seg_(C.k1, B.five, 'silence', 0, 'cut', 'cut');                    // the silent beat: the tea goes down
seg_(B.five, C.k3, 'epic', 0.4, 'swell', 'cut');                   // ...Five minutes.
seg_(C.k3, C.m1, 'epic', 0.9, 'cut', 'cut');                       // Let's go. / Granny's coming, dear.
seg_(C.m1, END, 'family', 0.75, 'swell', 'sting');                 // the whole family logged in. Together.

// ================================================================= ambience + footsteps
const amb = [];
const bed = (a, b, name, g) => { if (b - a > 0.05) amb.push({ start: r3(a), end: r3(b), name, gain_db: g }); };
bed(T0, C.d1, 'wind', -12);
bed(T0, C.d1, 'town', -18);
bed(C.d1, C.e1, 'night', -14);
bed(C.e1, C.h1, 'wind', -12);
bed(C.h1, END, 'night', -14);
const steps = [];
const run = (s0, s1, interval, surface, g, pan) => { s0 = Math.max(T0, s0); s1 = Math.min(END, s1); if (s1 - s0 > 0.1) steps.push({ start: r3(s0), end: r3(s1), interval: r3(interval), surface, gain_db: g, pan }); };
run(B.mine, C.c1, Math.PI / 16, 'hard', -12, 0);                     // players fleeing across the ledge
run(C.e2, B.flick, Math.PI / 18, 'hard', -14, 0.3);                 // the clan running at the boss
run(C.i1, C.i2, Math.PI / 15, 'wood', -6, 0);                       // the hero runs down the stairs
run(C.i1 + 0.55, C.i2, Math.PI / 12, 'wood', -10, 0.3);             // Dad follows
run(C.i2 - 0.2, C.i2 + 0.5, Math.PI / 15, 'wood', -6, 0.4);         // into the living room

const out = { scene: 'SC 09', start: r3(T0), end: r3(END), music: M, ambience: amb, footsteps: steps, sfx };
fs.writeFileSync(path.join(__dirname, 'sc09.json'), JSON.stringify(out, null, 1));
console.log(`sc09.json: ${sfx.length} sfx, ${M.length} music segments, ${amb.length} beds, ${steps.length} footstep runs`);
