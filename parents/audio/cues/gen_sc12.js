#!/usr/bin/env node
// Sound cue sheet generator for SC 12 · AFTER + FINALE + END SCREEN — the MVP on the TV and the family asleep at 00:30 (snores,
// the wall clock, BEDTIME 11 PM crossed out, Mom's tablet taps), the hero tucks Dad in and hops onto the couch beside him,
// the calendar flips to the next Saturday, the ding-ding family meeting (FAMILY GAME NIGHT!, SAME SERVER! / SAME TIME!
// stamps), Granny's invoice, the Cube City montage (the hero's double jump + flip, Dad's jump 1 OK ... splash, Mom's training
// class swings, the sign-up sheet, the water bottle for DarkBlade, the Block King's castle SOLD -> the crown pops off, the
// giant cookie THUD -> COOKIE MUSEUM, tickets 12 -> 2 coins), "DarkBlade's mom joined the server" (the class freezes, the
// spawn, "...MOM?!", the moms' high five), the outro (push-in, WHO'S THE NOOB? roulette, the comment card) and the END SCREEN
// (subscribe circle + video slots, Dad's head-flip attempts and the final double jump, the chase across the roof).
// Every time comes from the voice timeline exactly like scenes/s12.js: the cut list (CUT), the beats (BEATS) and the rhythm
// constants (FX) are imported from the scene module itself (built only from L(id).a/.b and .word()). When the voice changes:
//   node audio/cues/gen_sc12.js && python3 audio/validate_cues.py audio/cues/sc12.json
// Output: audio/cues/sc12.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const K = require('../../scenes/kit');
const { CUT: C, BEATS: B, FX, doubleJumpLift } = require('../../scenes/s12');
const { L } = V;

const T0 = V.scene('SC 12').start, END = V.DURATION;                // == main.js RANGES for SC 12

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const lerp = (a, c, k) => a + (c - a) * k;
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));     // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 && t < END) sfx.push([r3(t), name, g, pan, note]); };
const chatPop = (id, word, pre = 0.3) => L(id).word(word).t0 - pre;
// the times in [a, b) where a periodic phase w·t + ph crosses 2πk + π/2 (the peaks of max(0, sin(...)))
const peaks = (a, b, w, ph = 0) => { const out = []; for (let k = Math.ceil(((a * w + ph) - Math.PI / 2) / (2 * Math.PI)); ; k++) { const t = (2 * Math.PI * k + Math.PI / 2 - ph) / w; if (t >= b) break; if (t >= a) out.push(t); } return out; };
// the first time in [a, b] where f(t) >= v (scan)
const firstAt = (a, b, fn, v, st = 0.005) => { for (let t = a; t <= b; t += st) if (fn(t) >= v) return t; return null; };

// ================================================================= SFX, shot by shot (same order as scenes/s12.js)
// ---- 1. the MVP on the TV -> pull back: everybody asleep
add(T0 + 0.05, 'tv_on', -14, -0.5, 'the TV still shows MVP: DadBod1978');
add(T0 + 0.35, 'whoosh_long', -12, 0, 'slow pull back from the TV');
add(B.nobody + 0.3, 'snore', -10, P(1000), 'Dad snores');
add(B.nobody + 0.9, 'snore', -14, P(1750), 'Granny snores');
// ---- 2. the clock: BEDTIME 11 PM -> crossed out, 12:30 AM
add(C.clock, 'whoosh', -10, 0.5, 'cut to Mom\'s BEDTIME note');
for (let i = 0; i < 3; i++) add(C.clock + 0.2 + i * 0.5, 'countdown_tick', -16, 0.6, 'the wall clock ticks');
add(B.eleven + 0.17, 'whoosh', -10, 0.6, 'whip to the clock');
add(B.eleven + 0.35, 'paper', -6, 0.3, 'BEDTIME 11 PM crossed out');
add(B.eleven + 0.36, 'ui_pop', -8, 0.4, '12:30 AM');
// ---- 3. "Not even Mom." — push in
add(C.mom, 'whoosh', -12, 0, 'push in on Mom');
add(B.momW - 0.05, 'pop', -8, 0.5, 'MOM: BEDTIME = 11 PM');
add(B.momW + 0.4, 'snore', -12, P(1290), 'Mom snores softly');
// ---- 4. "Five more minutes..." — her thumb still taps the tablet
for (let k = Math.ceil(C.momClose * FX.tap); k / FX.tap < C.blanket; k++) add(k / FX.tap, 'tap', -12, P(1250), 'Mom taps the tablet in her sleep');
add(C.momClose + 0.4, 'punch', -20, P(1300), 'a tiny K.O. on her screen');
// ---- 5. the hero pulls the throw over Dad
add(C.blanket, 'whoosh', -12, 0, 'cut: the hero by the couch');
add(C.blanket + 0.1, 'cloth', -4, P(900), 'he pulls the knitted throw up');
add(C.dad - 0.35, 'sparkle', -10, P(1000), 'tucked in');
// ---- 6-7. "Same time next week, champ?" / "Same time, Dad. Every week." -> he hops onto the couch
add(C.dad + 0.1, 'cloth', -12, P(1100), 'Dad stirs');
add(B.hop, 'jump', -10, P(800), 'the hero hops onto the couch');
add(B.land, 'thud', -12, P(860), 'lands on the cushion');
add(B.land + 0.02, 'cloth', -10, P(860), 'snuggles under the throw');
add(B.land + 0.1, 'heart_pop', -6, P(935), 'hearts');
// ---- 8. the calendar flips to the next Saturday
add(C.saturday, 'whoosh', -6, 0, 'whip to the next Saturday');
add(C.saturday + 0.02, 'ui_pop', -8, 0, 'the calendar pops');
for (let i = 1; i <= 6; i++) add(lerp(C.saturday + 0.1, B.saturday + 0.1, i / 7), 'paper', -8, 0, 'a page flips');
add(B.next - 0.1, 'whoosh', -12, 0, 'NEXT SATURDAY');
add(B.saturday + 0.15, 'paper', -6, 0, 'SAT circled');
add(B.saturday + 0.45, 'pop', -6, 0, 'GAME NIGHT! ♥');
add(C.meeting - 0.25, 'whoosh_down', -10, 0, 'the calendar drops away');
// ---- 9. the hero calls the meeting: ding ding ding
add(C.meeting, 'whoosh', -8, -0.3, 'whip to the kitchen');
for (const tp of peaks(B.called - 0.05, B.meetingW + 0.6, FX.ding, -B.called * FX.ding)) add(tp, 'bell', -8, P(600), 'ding! — the spoon taps the glass');
add(B.youW - 0.02, 'stamp', -4, 0.5, 'CHAIRMAN: YOU');
add(B.youW + 0.15, 'zoom_in', -10, -0.3, 'push in on the hero');
// ---- 10. FAMILY GAME NIGHT! / SAME SERVER! / SAME TIME!
add(C.gameNight, 'whoosh', -10, 0, 'cut');
add(B.family - 0.05, 'jump', -8, P(400), 'the hero jumps');
add(B.family - 0.05, 'confetti', -4, 0, 'block confetti');
add(B.family - 0.1, 'tada', -2, 0, 'FAMILY GAME NIGHT! title');
add(B.server - 0.25, 'whoosh', -10, 0, 'whip to Dad');
add(B.server - 0.05, 'stamp', 0, 0.3, 'SAME SERVER!');
add(B.server, 'cloth', -10, 0, 'Dad throws his arm up');
add(B.time - 0.05, 'whoosh', -10, 0.2, 'whip to Mom');
add(B.time - 0.05, 'stamp', 0, -0.4, 'SAME TIME!');
// ---- 11. Granny's invoice
add(C.rent, 'whoosh', -10, 0.4, 'close on Granny');
add(B.rentW - 0.25, 'paper', -4, 0.5, 'the INVOICE slides in');
add(B.rentW, 'ui_pop', -8, 0.5, 'CASTLE RENT 50');
add(B.dear + 0.05, 'whoosh', -8, -0.3, 'whip to the hero');
add(B.dear + 0.15, 'cricket', -6, -0.3, '"..." the hero, deadpan');
// ---- 12. Cube City: the hero's double jump (+ flip)
add(C.dj, 'whoosh', -6, 0.4, 'whip to Cube City');
add(C.dj + 0.05, 'ui_pop', -8, -0.6, 'DOUBLE JUMP: SPACE SPACE panel');
add(B.djHero1 - 0.04, 'click', -8, -0.5, 'SPACE');
add(B.djHero1, 'jump_game', -2, 0.05, 'jump 1');
add(B.djHero2 - 0.04, 'click', -8, -0.35, 'SPACE');
add(B.djHero2, 'jump_game', 0, 0.05, 'jump 2');
add(B.djHero2 + 0.02, 'whoosh', -6, 0.05, 'the flip');
add(B.djHero2 + 0.05, 'sparkle', -6, 0.3, 'x2!');
const heroLand = firstAt(B.djHero2 + 0.1, B.djHero2 + 2, (t) => -doubleJumpLift(t, B.djHero1, B.djHero2), -0.5);
if (heroLand) add(heroLand, 'land', -4, 0.05, 'the hero lands');
// ---- 13. Dad: one jump... then the second one -> splash
add(C.djDad, 'whoosh', -8, 0, 'cut to Dad');
add(B.dadJ1, 'jump_game', -2, -0.1, 'Dad\'s jump 1 (it works!)');
add(B.dadJ1 + 0.15, 'confirm', -6, 0.4, 'JUMP 1 OK!');
add(B.dadJ2, 'jump_game', -8, -0.1, 'jump 2...');
add(B.dadJ2 + 0.05, 'fall_whistle', -6, 0.1, 'flailing over the gap');
add(B.splash, 'big_splash', 0, 0.15, 'SPLASH');
add(B.splash + 0.05, 'sad_trombone', -4, 0.3, 'DOUBLE JUMP: FAILED');
add(B.splash + 0.4, 'bubbles', -8, 0.15, 'he bobs back up');
add(B.splash + 0.42, 'boing', -10, 0.15, 'treading water, waving');
// ---- 14. Mom's training class
add(C.klass, 'whoosh', -8, -0.4, 'whip to the arena');
add(B.training - 0.1, 'ui_pop', -6, 0, "MOM'S TRAINING CLASS");
add(B.klass, 'pop', -8, 0.6, 'FREE WATER!');
for (const tp of peaks(C.klass, C.signup, FX.swing)) add(tp, 'swish', -8, P(1300), 'Mom demonstrates a swing — the class copies her');
// ---- 15. the sign-up sheet: DarkBlade first
add(C.signup, 'whoosh', -10, 0, 'close on DarkBlade');
add(C.signup + 0.1, 'chat_pop', -6, -0.2, '"me first!!"');
add(C.signup + 0.2, 'typing', -10, -0.2, 'he types it');
add(B.signed - 0.3, 'paper', -4, 0.5, 'the SIGN-UP SHEET slides in');
add(B.signed, 'typing', -10, 0.5, 'names fill in');
add(B.first - 0.05, 'sparkle', -6, 0.6, '1st! star');
// ---- 16. "Thank you, Mrs. Mom." — the water bottle
add(C.thanks, 'whoosh', -10, 0, 'two-shot');
add(C.thanks + 0.1, 'cloth', -10, 0.1, 'Mom offers a water bottle');
add(B.thank, 'blush', -8, -0.1, 'DarkBlade blushes');
add(B.mrs - 0.12, 'pop', -8, 0, 'he takes the bottle');
add(B.mrs + 0.1, 'heart_pop', -6, -0.1, 'hearts');
// ---- 17. the Block King's castle: SOLD
add(C.castle, 'whoosh', -6, 0.4, 'whip to the Block King\'s castle');
add(C.castle + 0.1, 'rumble', -14, 0, 'the dark castle looms');
add(C.castle + 0.3, 'whoosh_down', -10, 0, 'tilt down from the stone crown');
add(B.bought - 0.1, 'coins', -2, 0.3, 'Granny pays');
add(B.bought + 0.05, 'stamp', 2, 0.05, 'SOLD!');
add(B.bought + 0.1, 'ka_ching', -4, 0.3, 'ka-ching');
add(B.castleW - 0.1, 'ui_pop', -8, 0.5, 'NEW OWNER: GrannyGoodies');
// ---- 18. COOKIE MUSEUM: the crown pops off, the giant cookie lands
add(C.museum, 'whoosh', -8, 0, 'wide on the castle');
add(B.crownPop, 'stone', -4, 0, 'the stone crown pops off');
add(B.crownPop + 0.02, 'whoosh_up', -6, -0.3, 'it flies away');
add(B.cookie - 0.3, 'fall_whistle', -6, 0, 'a giant cookie falls');
add(B.cookieLand, 'thud', 2, 0, 'THUD! on the keep');
add(B.cookieLand + 0.01, 'boom', -6, 0, 'shake');
add(B.museum - 0.12, 'magic', -4, 0, 'the castle turns pink: COOKIE MUSEUM');
add(B.museum - 0.05, 'tada', -4, 0.5, 'COOKIE MUSEUM sign');
// ---- 19. tickets: 10 coins (12 -> 2)
add(C.tickets, 'whoosh', -8, -0.3, 'whip to the ticket booth');
add(C.tickets + 0.05, 'ui_pop', -8, -0.8, 'coin counter: 12');
for (let i = 0; i < 5; i++) add(B.ten + 0.06 + i * 0.07, 'coin', -6, -0.1, 'a coin flies to Granny');
add(B.ten, 'money_counter', -6, -0.8, '12 -> 2');
add(B.coins + 0.3, 'squeak', -8, -0.2, 'two coins left');
// ---- 20. DarkBlade's mom joined the server
add(C.joined, 'whoosh', -8, 0, 'whip back to the class');
add(C.joined + 0.05, 'notify', 2, 0.25, '"DarkBlade\'s mom joined the server"');
add(B.sysMom, 'dramatic', 0, 0, 'the class freezes');
add(B.sysMom + 0.02, 'pop', -6, 0, '!');
add(B.spawn, 'respawn', -2, P(420), 'she spawns');
add(B.spawn + 0.1, 'sparkle', -6, P(420), 'spawn light');
// ---- 21. "...MOM?!"
add(C.momQ, 'impact', 0, 0, 'smash zoom on DarkBlade');
add(C.momQ + 0.02, 'zoom_in', -6, 0, 'zoom lines');
add(B.momQ + 0.1, 'shock', -6, 0.5, '!!!');
// ---- 22. the rolling pin, the moms' high five
add(C.chase, 'whoosh', -10, 0, 'cut');
for (let i = 0; i < 3; i++) add(C.chase + 0.15 + i * 0.22, 'swish', -12, P(600), 'she shakes the rolling pin');
add(B.highFive, 'slap', 2, 0.05, 'MOM HIGH FIVE!');
add(B.highFive + 0.02, 'sparkle', -6, 0.05, 'burst');
add(B.highFive + 0.05, 'heart_pop', -8, 0.05, 'hearts');
add(B.highFive + 0.1, 'crowd_cheer', -10, 0, 'the stands');
// ---- 23. the outro line-up at sunset
add(C.outro, 'whoosh', -6, 0, 'flash to the plaza at sunset');
add(B.your, 'impact', -4, 0, 'smash zoom: "if YOUR parents..."');
add(B.your + 0.02, 'zoom_in', -6, 0, 'zoom lines');
add(B.parents - 0.05, 'pop', -12, -0.3, 'the parents wave');
add(B.parents + 0.75, 'whoosh', -10, 0, 'pull back');
// ---- 24. WHO'S THE NOOB? roulette
add(C.noob, 'drumroll', -4, 0, 'roulette spotlight');
const hopT = [];
for (let k = 1; k <= FX.hops; k++) { const u = 1 - Math.pow(1 - k / FX.hops, 1 / 3); hopT.push(lerp(C.noob, B.noob + 0.05, u)); }   // inverse of ease.out (cubic)
void K;
hopT.slice(0, -1).forEach((tp, i) => add(tp, 'countdown_tick', -10, P([300, 520, 745, 985][(i + 1) % 4]), 'the spotlight hops'));
add(B.noob + 0.05, 'rimshot', 0, P(985), 'it lands on the hot dog: NOOB?');
add(B.noob + 0.1, 'pop', -6, P(985), 'NOOB? tag');
add(B.noob + 0.2, 'kids_laugh', -10, 0, 'the family laughs');
// ---- 25. Tell me in the comments!
add(C.comments, 'ui_pop', -6, 0, 'comment card');
add(B.tell + 0.2, 'typing', -6, 0, '"my dad. 100%"');
add(B.comments + 0.3, 'heart_pop', -4, 0.3, 'a like');
// ---- 26. END SCREEN
add(C.end, 'whoosh', -6, 0, 'flash to the rooftop: END SCREEN');
add(C.end + 0.25, 'ui_pop', -6, -0.6, 'subscribe circle');
add(C.end + 0.4, 'ui_pop', -8, 0.5, 'video slot 1');
add(C.end + 0.55, 'ui_pop', -8, 0.5, 'video slot 2');
// Dad's attempts every FX.dadCycle s: jump, flip onto his head, flip back; then the real double jump at B.dadDJ
for (let k = 0; ; k++) {
  const t0 = C.end + FX.dadOff + k * FX.dadCycle;
  if (t0 >= B.dadDJ) break;
  if (t0 > C.end) add(t0, 'jump_game', -8, P(900), 'Dad tries again');
  if (t0 + 0.4 < B.dadDJ) add(t0 + 0.4, 'whoosh', -10, P(900), '...the second jump flips him');
  if (t0 + 0.85 < B.dadDJ) { add(t0 + 0.85, 'bonk', -6, P(900), 'onto his head'); add(t0 + 0.9, 'dizzy', -12, P(900), 'dizzy stars'); }
  if (t0 + 1.65 < B.dadDJ) add(t0 + 1.65, 'boing', -10, P(900), 'flips back up');
}
add(B.dadDJ, 'jump_game', -2, P(900), 'the last try: jump 1');
add(B.dadDJ + 0.25, 'jump_game', 0, P(900), 'jump 2 — a real DOUBLE JUMP');
add(B.dadDJ + 0.45, 'achievement', 0, -0.3, 'DOUBLE JUMP!');
const dadLand = firstAt(B.dadDJ + 0.3, B.dadDJ + 2, (t) => -doubleJumpLift(t, B.dadDJ, B.dadDJ + 0.25, 700, 760, 3000), -0.5);
if (dadLand) { add(dadLand, 'land', -2, P(900), 'he lands it'); add(dadLand, 'confetti', -4, 0, 'confetti'); add(dadLand + 0.05, 'crowd_cheer', -8, -0.3, 'the family cheers'); }
add(END - 0.45, 'whoosh_down', -12, 0, 'fade to black');
sfx.sort((a, b) => a[0] - b[0]);

// ================================================================= music (tiles [T0, END])
const M = [];
const seg_ = (a, b, mood, energy, inn, out) => { if (b - a > 0.05) M.push({ start: r3(a), end: r3(b), mood, energy, in: inn, out }); };
seg_(T0, C.saturday, 'tender', 0.3, 'fade', 'fade');                  // the family asleep, "Every week."
seg_(C.saturday, C.dj, 'family', 0.55, 'swell', 'sting');            // next Saturday: the meeting, rent
seg_(C.dj, C.castle, 'lobby', 0.6, 'cut', 'cut');                     // the Cube City montage
seg_(C.castle, C.joined, 'tycoon', 0.6, 'cut', 'cut');                // the castle -> COOKIE MUSEUM, tickets
seg_(C.joined, B.sysMom, 'lobby', 0.5, 'cut', 'scratch');             // "DarkBlade's mom joined the server"
seg_(B.sysMom, C.chase, 'silence', 0, 'cut', 'cut');                  // the freeze, the spawn, "...MOM?!"
seg_(C.chase, C.outro, 'chaos', 0.6, 'cut', 'sting');                 // the rolling pin, the high five
seg_(C.outro, C.end, 'family', 0.5, 'swell', 'cut');                  // the outro question
seg_(C.end, END, 'outro', 0.8, 'cut', 'fade');                        // END SCREEN

// ================================================================= ambience + footsteps
const amb = [];
const bed = (a, b, name, g) => { if (b - a > 0.05) amb.push({ start: r3(a), end: r3(b), name, gain_db: g }); };
bed(T0, C.saturday, 'room', -16);
bed(T0, C.saturday, 'night', -20);
bed(C.saturday, C.dj, 'kitchen', -14);
bed(C.saturday, C.dj, 'birds', -18);
bed(C.dj, C.klass, 'town', -16);
bed(C.klass, C.castle, 'crowd', -14);
bed(C.castle, C.joined, 'wind', -18);
bed(C.castle, C.joined, 'town', -18);
bed(C.joined, C.outro, 'crowd', -14);
bed(C.outro, END, 'town', -18);
bed(C.end, END, 'wind', -20);
const steps = [];
const run = (s0, s1, interval, surface, g, pan) => { if (s1 - s0 > 0.1) steps.push({ start: r3(s0), end: r3(s1), interval: r3(interval), surface, gain_db: g, pan }); };
run(C.castle + 0.2, B.bought - 0.15, Math.PI / 9, 'hard', -10, 0.4);  // Granny walks in: walk((t - t0) * 9)
run(C.chase, B.highFive - 0.1, Math.PI / 9, 'hard', -10, -0.2);       // DarkBlade's mom stomps in: walkFront(u * 9)
run(C.end + 0.3, END - 0.4, Math.PI / 16, 'hard', -16, -0.3);          // the chase across the roof: run(t * 16)

const out = { scene: 'SC 12', start: r3(T0), end: r3(END), music: M, ambience: amb, footsteps: steps, sfx };
fs.writeFileSync(path.join(__dirname, 'sc12.json'), JSON.stringify(out, null, 1));
console.log(`sc12.json: ${sfx.length} sfx, ${M.length} music segments, ${amb.length} beds, ${steps.length} footstep runs`);
