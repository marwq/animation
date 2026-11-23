#!/usr/bin/env node
// Sound cue sheet generator for SC 01 · COLD OPEN — the night city + the leaderboard billboard (join toasts, fireworks,
// MOM rolls to #1), the arena one-shot (spin, slash, TRIPLE K.O., two players fly out, one bonked flat), "Good game,
// sweetie!", the water bottle (+HP, REAL LIFE cam), Tycoon Valley (the tilt down the skyscraper, SERVER OWNERSHIP 50 %,
// HALF! stamp, the workers in aprons, the cane TAP, the sprint, KA-CHING), the hot dog walking into the wall (a BONK every
// 0.55 s, the 3:12:45 timer, time-lapse + cobweb), real Dad's "JUMP!", PRESS SPACE TO JUMP, the webcam, the floss emote,
// the laughing plaza + chat flood, the scream, the record-scratch freeze, the VHS rewind, the paused breakfast, the pixel
// wipe into Cube City by day.
// Every time comes from the voice timeline exactly like scenes/s01.js: the cut list (CUT), the beats (BEATS), the fireworks
// (ROCKETS), the bonk period (BONK) and the chat log (CHAT_LINES) are imported from the scene module itself (built only from
// L(id).a/.b and .word()). When the voice changes:
//   node audio/cues/gen_sc01.js && python3 audio/validate_cues.py audio/cues/sc01.json
// Output: audio/cues/sc01.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const S01 = require('../../scenes/s01');
const { CUT: C, BEATS: B, ROCKETS, BONK, CHAT_LINES, REW } = S01;
const { L } = V;

const l = (i) => L('01.' + i);
const T0 = 0, END = V.scene('SC 02').start;                         // == main.js RANGES for SC 01

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const lerp = (a, c, k) => a + (c - a) * k;
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));     // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 && t < END) sfx.push([r3(t), name, g, pan, note]); };
// the bonk impacts of the wall walk (scene: bonkPose, hit peak at u ≈ 0.51 of each BONK cycle from t = 0)
const bonks = (a, b) => { const out = []; for (let k = Math.ceil((a - 0.51 * BONK) / BONK); k * BONK + 0.51 * BONK < b; k++) out.push(k * BONK + 0.51 * BONK); return out; };
// the chat line pop time used by G.chatLine (pre 0.3 s before its first word)
const chatPop = (id, word, pre = 0.3) => L(id).word(word).t0 - pre;

// ================================================================= SFX, shot by shot (same order as scenes/s01.js)
// ---- 1. night Cube City: crane down to the billboard, the join toasts, fireworks
add(T0 + 0.05, 'reverse_swell', -8, 0, 'fade up from black over the night city');
add(T0 + 0.4, 'whoosh_down', -10, 0, 'the camera cranes down');
for (const [w, x] of [[B.parents, 1700], [B.joined, 1700], [B.roblox, 1700]]) add(w - 0.08, 'notify', -4, P(x), '"... joined the server" toast');
for (const [x, , d] of ROCKETS) {
  add(C.open + d - 0.45, 'whoosh_up', -14, P(x), 'firework rocket rises');
  add(C.open + d, 'explosion_small', -9, P(x), 'firework burst');
}
add(B.server - 0.05, 'zoom_in', -6, 0, 'push toward the billboard');
add(B.server, 'impact', -6, 0, 'shake on "server"');
// ---- 2. the billboard close-up: MOM rolls to #1
add(C.board, 'whoosh', -6, 0, 'smash cut to the board');
add(B.number - 0.1, 'slide_up', -4, -0.1, 'MOM_OFFICIAL rolls up past YOU');
add(B.one, 'orch_hit', 2, 0, '#1! — the board punches in');
add(B.one + 0.02, 'level_up', -4, 0.4, 'rank #1');
for (let i = 0; i < 5; i++) add(B.one + 0.02 + i * 0.12, 'explosion_small', -10, r3(-0.6 + 0.3 * i), 'fireworks behind the board');
add(B.one + 0.05, 'shine', -6, 0, 'golden rays');
// ---- 3. the arena: three players charge, Mom's spin one-shots them
add(C.arena, 'whoosh', -4, -0.3, 'whip to the arena');
add(C.arena + 0.05, 'crowd_cheer', -12, 0, 'the stands');
add(B.spin - 0.18, 'cloth', -10, 0, 'Mom winds up');
add(B.spin, 'swish', 0, -0.2, 'golden spin slash');
add(B.spin + 0.1, 'swish', -2, 0.2, 'second slash');
add(B.hit, 'impact', 2, 0, 'triple hit');
add(B.hit + 0.01, 'punch', 0, P(740), 'POW!');
add(B.hit + 0.03, 'bonk', -2, P(1190), 'BONK!');
add(B.hit + 0.05, 'punch', -4, P(1160), 'the third one');
add(B.hit + 0.06, 'ui_pop', -10, -0.2, '-999 damage numbers');
add(B.hit + 0.08, 'boing', -4, -0.5, 'player 1 launched out of the arena');
add(B.hit + 0.1, 'boing', -4, 0.5, 'player 2 launched out of the arena');
add(B.hit + 0.12, 'whoosh_up', -6, 0, 'they fly away');
add(B.hit + 0.1, 'body_fall', -6, P(1330), 'player 3 bonked flat into the sand');
add(B.hit + 0.18, 'orch_hit', 0, 0.4, 'TRIPLE K.O.!');
add(B.hit + 0.25, 'crowd_cheer', -4, 0, 'the crowd erupts');
add(B.hit + 0.3, 'dizzy', -10, P(1150), 'KO stars');
add(chatPop('01.2', 'Good'), 'chat_pop', -4, -0.1, '"Good game, sweetie!" bubble');
add(L('01.2').a, 'typing', -12, -0.1, 'the bubble types along');
// ---- 4. Mom close: sweet wave + hearts
add(C.momClose, 'whoosh', -8, 0, 'smash in on Mom');
add(C.momClose + 0.05, 'heart_pop', -4, -0.1, 'emote hearts');
add(B.hit + 1.0, 'sparkle', -6, -0.7, 'KO player twinkles away (left)');
add(B.hit + 1.12, 'sparkle', -6, 0.7, 'KO player twinkles away (right)');
// ---- 5. "Drink some water!" (+ REAL LIFE cam)
add(C.water, 'whoosh', -8, 0, 'cut: Mom + the flattened player');
add(C.water + 0.05, 'tv_on', -10, 0.5, 'REAL LIFE cam pops in');
add(C.water + 0.1, 'ui_pop', -8, 0.5, 'REAL LIFE label');
add(chatPop('01.2', 'Drink'), 'chat_pop', -4, -0.4, '"Drink some water!" bubble');
add(B.water - 0.1, 'whoosh', -6, 0.1, 'she tosses the water bottle');
add(B.potion, 'gulp', -2, P(1220), 'the bottle pops on him');
add(B.potion + 0.02, 'magic', -6, P(1220), '+HP');
add(B.potion + 0.1, 'sparkle', -8, P(1220), 'green crosses');
add(B.sitUp - 0.3, 'ui_close', -10, 0.5, 'REAL LIFE cam closes');
add(B.sitUp, 'boing', -4, P(1250), 'he pops back up');
add(B.sitUp + 0.2, 'pop', -8, P(1440), 'thumbs up');
// ---- 6. Tycoon Valley: tilt down Granny's skyscraper, SERVER OWNERSHIP 50 %
add(C.granny, 'whoosh', -6, 0.3, 'smash to the neon cookie');
add(C.granny + 0.35, 'whoosh_down', -4, 0.3, 'tilt down the skyscraper');
add(B.half - 0.12, 'ui_pop', -4, 0.5, 'SERVER OWNERSHIP card');
add(B.half, 'money_counter', -8, 0.5, 'the ring fills to 50 %');
add(B.server3 - 0.05, 'stamp', 0, 0.3, 'HALF! stamp');
// ---- 7. the friends in aprons carrying cookies
add(C.workers, 'whoosh', -6, -0.3, 'whip to the workers');
add(B.friends - 0.05, 'ui_pop', -8, -0.6, "GRANNY'S STAFF sign");
add(B.now - 0.1, 'pop', -8, -0.6, 'EMPLOYEES: 5');
// ---- 8. "Faster, boys!"
add(C.faster, 'whoosh', -8, 0.4, 'smash in on Granny');
add(chatPop('01.4', 'Faster'), 'chat_pop', -4, 0.2, '"Faster, boys!" bubble');
add(B.boys, 'thud', 0, -0.2, 'the cane TAP!');
add(B.boys + 0.01, 'impact', -4, 0, 'shake');
// ---- 9. the workers sprint (REAL LIFE cam: Granny + phone)
add(C.rush, 'whoosh_long', -4, -0.5, 'whip: they sprint');
add(C.rush + 0.05, 'ui_pop', -8, 0.5, 'REAL LIFE cam: Granny');
add(chatPop('01.4', 'Those', 0.15), 'chat_pop', -6, -0.4, '"Those cookies won\'t sell themselves!"');
add(C.cash - 0.25, 'ui_close', -10, 0.5, 'REAL LIFE cam closes');
// ---- 10. the coin counter rockets
add(C.cash, 'whoosh', -8, 0, 'smash: Granny rich');
add(C.cash + 0.02, 'ui_pop', -6, -0.8, 'coin counter');
add(C.cash + 0.05, 'money_counter', -2, -0.8, 'the counter rockets to 9,999,999');
add(B.cashHit, 'ka_ching', 2, 0.4, 'KA-CHING!');
add(B.cashHit + 0.05, 'coins', -2, 0.1, 'coin burst');
// ---- 11-15. the plaza: the hot dog walks into the wall (BONK every cycle in the wall shots)
const WALL = [[C.dad, C.realDad, -10], [C.noJump, C.webcam, -6]];
for (const [a, b, g] of WALL) for (const tb of bonks(a, b)) add(tb, 'bonk', tb >= C.wallClose && tb < C.timer ? g + 4 : g, 0.25, 'BONK — the hot dog walks into the wall');
add(C.dad, 'whoosh', -6, 0.5, 'whip to the plaza');
add(C.wallClose, 'zoom_in', -8, 0.2, 'close on the hot dog');
add(C.wallClose + 0.1, 'pop', -10, -0.3, 'DadBod1978 LVL 1 nametag');
add(C.timer, 'whoosh', -8, 0, 'pull back');
add(B.three - 0.08, 'impact', -2, 0, 'TIME 3:12:45 slams big');
add(B.three, 'countdown_tick', -6, 0, 'timer tick');
add(B.hours - 0.1, 'whoosh_long', -6, 0, 'time-lapse: players zip past');
add(B.hours, 'ui_pop', -10, 0, 'TIME-LAPSE label');
for (let i = 0; i < 6; i++) add(B.hours + i * 0.1, 'countdown_tick', -12, 0, 'the timer races');
add(B.hours + 0.35, 'cricket', -6, 0.3, 'a cobweb on the hot dog');
// ---- 12. real Dad: "JUMP!" into his mouse
add(C.realDad, 'whoosh', -6, 0, 'smash to the living room');
for (let i = 0; i < 3; i++) add(B.jump1 - 0.25 + i * 0.1, 'click', -6, 0, 'Dad mashes the mouse');
add(B.jump1, 'impact', 0, 0, '"JUMP!" shake + zoom');
add(B.jump1 + 0.02, 'zoom_in', -6, 0, 'smash zoom on Dad');
// ---- 13. the game: PRESS SPACE TO JUMP
add(C.noJump, 'whoosh', -8, 0, 'cut back to the hot dog');
add(C.noJump + 0.12, 'notify', -4, 0, 'PRESS SPACE TO JUMP');
add(C.noJump + 0.35, 'pop', -8, -0.3, '?');
// ---- 14. webcam: "Computer, I said JUMP!"
add(C.webcam, 'vhs_clunk', -8, 0, 'webcam view');
add(C.webcam + 0.1, 'beep', -12, -0.7, 'REC');
add(B.jump2, 'impact', 2, 0, '"JUMP!" — webcam shake');
add(B.jump2 + 0.02, 'zoom_in', -4, 0, 'zoom lines');
// ---- 15. the hot dog floss-dances instead
add(C.emote, 'whoosh', -8, 0.3, 'cut to the plaza');
add(C.emote + 0.12, 'equip', -4, 0.4, 'EMOTE: FLOSS');
add(C.emote + 0.2, 'boing', -8, 0.4, 'he flosses');
add(C.emote + 0.15, 'kids_laugh', -6, -0.4, 'the players laugh');
// ---- 16-17. the hero in the laughing plaza, the scream
add(C.hero, 'whoosh', -6, -0.4, 'whip to the hero');
add(C.hero, 'typing', -10, -0.2, '"lol is that ur dad" types');
add(C.hero + 0.05, 'chat_pop', -6, -0.2, 'PizzaKid bubble');
for (const ln of CHAT_LINES()) add(ln.at, 'chat_pop', -10, -0.7, `chat: ${ln.user}: ${ln.text}`);
add(B.my, 'impact', 0, 0, '"This is MY server!" smash');
add(B.my + 0.02, 'zoom_in', -6, 0, 'zoom lines');
add(B.my + 0.2, 'crowd_laugh', -8, 0, 'the plaza laughs');
add(C.scream, 'whoosh', -8, 0, 'smash close');
add(B.happen, 'impact', 0, 0, '"HAPPEN?!" shake');
add(B.happen + 0.02, 'whoosh_long', -4, 0, 'pull back to the whole plaza');
for (let i = 0; i < 5; i++) add(B.happen + i * 0.1, 'chat_pop', -6, r3(-0.5 + 0.25 * i), 'LOL / XD / DAD!! bubbles');
for (let i = 0; i < 12; i++) add(lerp(B.happen + 0.5, C.freeze - 0.1, i / 11), 'chat_pop', -14, r3(-0.8 + 0.6 * ((i * 7) % 5) / 4), 'chat flood');
add(B.happen + 0.3, 'kids_laugh', -6, 0, 'everyone laughs');
// ---- 18. "Well." — freeze frame
add(C.freeze, 'record_scratch', 2, 0, 'record scratch: freeze');
add(C.freeze + 0.02, 'camera_flash', -6, 0, 'the frame becomes a photo');
add(C.freeze + 0.2, 'pop', -6, 0.2, 'THE LEGEND? tag');
// ---- 19. the VHS rewind through the whole cold open
add(C.rewind, 'vhs_clunk', -4, 0, 'REWIND');
add(C.rewind + 0.02, 'rewind', 0, 0, 'tape rewinds');
const nRew = REW().length;
for (let i = 1; i < nRew; i++) add(lerp(C.rewind, C.breakfast, i / nRew), 'glitch', -10, 0, 'jump to the previous shot');
add(C.rewind + 0.1, 'static', -12, 0, 'tape noise');
// ---- 20. paused: Saturday 8:00 AM — the family breakfast
add(C.breakfast, 'impact', -8, 0, 'the rewind stops');
add(C.breakfast + 0.3, 'vhs_clunk', -6, 0, 'PAUSE');
add(B.breakfast - 0.15, 'ui_pop', -6, 0, 'FAMILY BREAKFAST title');
add(B.breakfast - 0.1, 'chime', -10, 0, 'Saturday morning');
// ---- 21. pixel wipe into Cube City by day
add(C.toDay, 'pixel_wipe', -4, 0, 'pixel wipe covers');
add(C.toDay + 0.55, 'pixel_wipe', -6, 0, 'pixel wipe reveals Cube City by day');
add(END - 0.55, 'vhs_clunk', -8, -0.6, 'PLAY');
add(END - 0.2, 'whoosh', -6, 0, 'white flash into SC 02');
sfx.sort((a, b) => a[0] - b[0]);

// ================================================================= music (tiles [T0, END])
const M = [];
const seg_ = (a, b, mood, energy, inn, out) => { if (b - a > 0.05) M.push({ start: r3(a), end: r3(b), mood, energy, in: inn, out }); };
seg_(T0, C.arena, 'hook', 0.55, 'swell', 'cut');                       // the night city + the leaderboard
seg_(C.arena, C.granny, 'arena', 0.7, 'cut', 'sting');                 // the one-shot + "Drink some water!"
seg_(C.granny, C.dad, 'tycoon', 0.65, 'cut', 'sting');                 // Granny's empire + KA-CHING
seg_(C.dad, C.emote, 'playful', 0.45, 'cut', 'cut');                   // the wall, 3 hours, "JUMP!"
seg_(C.emote, C.freeze, 'chaos', 0.75, 'cut', 'scratch');              // floss, laughter, the scream
seg_(C.freeze, C.rewind, 'silence', 0, 'cut', 'cut');                  // "Well."
seg_(C.rewind, C.breakfast, 'glitch_build', 0.5, 'cut', 'tapestop');   // the rewind
seg_(C.breakfast, END, 'family', 0.4, 'fade', 'cut');                  // Saturday breakfast -> SC 02

// ================================================================= ambience + footsteps
const amb = [];
const bed = (a, b, name, g) => { if (b - a > 0.05) amb.push({ start: r3(a), end: r3(b), name, gain_db: g }); };
bed(T0, C.arena, 'night', -14);
bed(T0, C.arena, 'town', -18);
bed(C.arena, C.granny, 'crowd', -12);
bed(C.granny, C.dad, 'wind', -18);
bed(C.dad, C.realDad, 'night', -16);
bed(C.realDad, C.emote, 'room', -14);                                  // real Dad + the webcam (the plaza in between)
bed(C.emote, C.freeze, 'crowd', -12);
bed(C.rewind, C.breakfast, 'static', -16);
bed(C.breakfast, C.toDay + 0.5, 'kitchen', -14);
bed(C.breakfast, C.toDay + 0.5, 'birds', -18);
bed(C.toDay + 0.5, END, 'town', -16);
const steps = [];
const run = (s0, s1, interval, surface, g, pan) => { if (s1 - s0 > 0.1) steps.push({ start: r3(s0), end: r3(s1), interval: r3(interval), surface, gain_db: g, pan }); };
run(C.arena, B.hit, Math.PI / 16, 'hard', -8, 0);                      // the three players charge: run((t - C.arena) * 16)
run(C.workers, C.faster, Math.PI / 9, 'hard', -10, -0.2);              // the workers walk: walk((t - C.workers) * 9)
run(C.rush, C.cash, Math.PI / 22, 'hard', -8, 0);                      // the sprint: run(u * 22)
run(C.dad, C.realDad, BONK / 2, 'hard', -12, 0.25);                    // the hot dog's stuck walk (2 steps per bonk cycle)
run(C.noJump, C.webcam, BONK / 2, 'hard', -12, 0.25);

const out = { scene: 'SC 01', start: r3(T0), end: r3(END), music: M, ambience: amb, footsteps: steps, sfx };
fs.writeFileSync(path.join(__dirname, 'sc01.json'), JSON.stringify(out, null, 1));
console.log(`sc01.json: ${sfx.length} sfx, ${M.length} music segments, ${amb.length} beds, ${steps.length} footstep runs`);
