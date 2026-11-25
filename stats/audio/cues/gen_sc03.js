#!/usr/bin/env node
// Sound cue sheet generator for SC 03 · THE UPDATE: night gaming (keys), the update window (notify), the title glint, the
// house at night (crickets, the SYSTEM bubble), 4,812 pages (paper storm + counter + STAMP), the click on ACCEPT, the deadpan
// echo over PAGE 1 (cricket, the little-X glint), INSTALLING... REALITY (loading, riser, glitches) → the pixel burst (impact,
// pixel wipe, upgrade), the house window bursting (magic, boot typing), lights out (power down, silence); the morning (birds,
// snore, eyes snap open), LOADING REALITY → ONLINE + a pop per tooltip, the bed bounce, the sock gag, the alarm clock ENEMY
// (alarm beeps, VS orchestra hit, boss music), the pillow SMACK (CRIT, feathers, the clock flies, ENEMY DEFEATED, +12 XP);
// the kitchen: the toaster ticking → POP + silence + a smoke cough, Mom's 2 % (low-battery beep), four coffees (gulps, the
// mugs clunk, +1 % coins), NEW RECORD (ta-da, confetti, she snores), Grandpa's crown + flex, Max's CHAOS sparks + RAWR, the
// swat through the plate (glitch), the head shake + cricket, the dome glint, "Watch this!" → the flip → BIG SPLASH → −50 /
// NO DAMAGE, "This... is... AMAZING" (wonder + angel choir), Biscuit's loading → ERROR (glitch) → GOOD BOY (arf arf), the
// whip into SC 04.
// Every time comes from the voice timeline exactly like scenes/s03.js: the cut list (CUT) and the beats (BEATS) are imported
// from the scene module itself (built only from L(id).a/.b and .word()). When the voice changes:
//   node audio/cues/gen_sc03.js && python3 audio/validate_cues.py audio/cues/sc03.json
// Output: audio/cues/sc03.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { CUT: C, BEATS: B } = require('../../scenes/s03');
const { L } = V;

const l = (i) => L('03.' + i);
const T0 = V.scene('SC 03').start, END = V.scene('SC 04').start;    // == main.js RANGES for SC 03

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const lerp = (a, c, k) => a + (c - a) * k;
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));     // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(t), name, g, r3(pan), note]); };

// ================================================================= SFX, shot by shot (same order as scenes/s03.js)
// ---- 1. night gaming → the update window pops on his monitor
add(T0 + 0.02, 'typing', -16, P(1200), 'gaming: keyboard mashing');
add(B.win - 0.02, 'notify', 0, P(1150), 'Update available — the window pops on the monitor');
add(B.win, 'ui_pop', -6, P(1150), 'window unfolds');
add(B.win + 0.12, 'swish', -14, P(1100), 'his head tilts');
// ---- 2. the monitor close-up: Reality HUD v1.0
add(C.screen, 'zoom_in', -10, 0, 'push into the screen');
add(B.reality - 0.05, 'shine', -6, P(900), 'glint across "Reality HUD v1.0"');
add(B.zero, 'sparkle', -8, P(1150), 'v1.0 twinkle');
// ---- 3. the house at night
add(C.night - 0.04, 'whoosh', -12, -0.3, 'whip to the house');
add(B.strange, 'glitch', -14, P(1020), 'his window flickers (strange)');
add(B.popped - 0.1, 'notify', -6, P(1080), 'SYSTEM bubble pops out of his window');
// ---- 4. terms: pages fly at the camera
add(C.terms, 'zoom_in', -8, 0, 'smash back to the screen');
add(B.scroll0, 'whoosh_long', -6, 0, 'the scrollbar thumb flies down');
for (let i = 0; i < 3; i++) add(B.scroll0 + 0.1 + i * 0.4, 'paper', -6 - i, i % 2 ? 0.4 : -0.4, 'pages blast out of the screen');
// ---- 5. the room buried in 4,812 pages
add(C.flood, 'whoosh_long', -4, 0.2, 'paper storm out of the monitor');
for (let i = 0; i < 5; i++) add(C.flood + 0.15 + i * 0.42, 'paper', -6 - (i % 2) * 3, [0.3, -0.4, 0.6, -0.2, 0.5][i], 'pages rain on the room');
add(C.flood + 0.1, 'money_counter', -12, 0, 'the page counter rolls');
add(C.flood + 1.1, 'money_counter', -12, 0, 'the page counter rolls');
add(B.pages - 0.04, 'stamp', 0, 0, '4,812 PAGES slams on');
add(B.pages, 'paper', -6, P(1180), 'one page lands on his head');
// ---- 6. split: "Accept." — he clicks without looking
add(C.accept, 'swish', -8, 0, 'split-screen slides in');
add(B.click - 0.02, 'click', 0, P(600), 'click — ACCEPT');
add(B.click + 0.15, 'confirm', -4, P(600), '✓ ACCEPTED');
add(B.nobody - 0.05, 'cloth', -14, P(1450), 'smug shrug');
// ---- 7. the narrator's echo: PAGE 1 drifts down onto the pile
add(C.page - 0.03, 'whoosh', -14, -0.3, 'cut to the floor');
add(C.page + 0.3, 'cricket', -12, 0.3, 'deadpan silence');
add(C.page + 0.6, 'paper', -12, -0.2, 'page one drifting down');
add(B.land, 'paper', -8, 0, 'page one lands on the pile');
add(B.land + 0.4, 'shine', -10, 0.05, 'the little X glints (page one, rule 1.2)');
add(B.cover, 'paper', -8, 0.3, 'the next page covers it');
// ---- 8. INSTALLING... REALITY
add(C.install, 'loading', -4, 0, 'install progress');
add(B.reality2 - 2.0, 'riser', -4, 0, 'build to the burst');
add(B.reality2 - 0.6, 'glitch', -10, -0.2, 'the window glitches');
add(B.reality2 - 0.25, 'glitch', -8, 0.2, 'the window glitches');
add(B.reality2 - 0.02, 'impact', 0, 0, 'white flash — reality');
add(B.reality2, 'pixel_wipe', -2, 0, 'pixels burst at the camera');
add(B.reality2 + 0.05, 'upgrade', -4, 0, 'INSTALL COMPLETE');
// ---- 9. the room floods with pixels
add(C.burst, 'whoosh_long', -4, 0.2, 'blast wave through the room');
add(C.burst + 0.05, 'glitch_long', -10, 0.3, 'pixels everywhere');
add(C.burst + 0.1, 'paper', -6, -0.3, 'pages blown up off the piles');
add(C.burst + 0.3, 'forcefield', -8, 0.4, 'cyan shock rings');
// ---- 10. the house: the window bursts into the night, then everything goes dark
add(C.house, 'magic', -4, P(1020), 'the window bursts with light');
add(C.house + 0.15, 'typing', -14, P(1020), 'boot log rising into the sky');
add(C.house + 0.55, 'dog_bark', -18, -0.5, 'a neighbour dog barks at the light');
add(B.dark - 0.05, 'powerdown', -4, 0, 'every light goes out');
// ---- 11. morning: asleep → eyes snap open
add(C.wake + 0.08, 'snore', -10, 0.1, 'asleep');
add(B.eyes, 'zoom_in', -6, 0, 'eyes snap open');
add(B.eyes + 0.02, 'shine', -6, 0, 'cyan glint in his eyes');
// ---- 12. POV: LOADING REALITY → ONLINE → tooltips on everything
add(C.pov, 'tv_on', -8, 0, 'the HUD boots over his vision');
add(C.pov + 0.1, 'loading', -6, 0, 'LOADING REALITY...');
add(B.blink, 'blink', -8, 0, 'blink');
add(B.every - 0.02, 'confirm', -2, 0, '100 % — REALITY HUD ONLINE');
add(B.every + 0.02, 'shine', -6, 0, 'white flash');
[[-0.6, 0.1], [0.6, 0.18], [-0.6, 0.26], [0.6, 0.34]].forEach(([pan, d]) => add(B.every + d, 'ui_pop', -12, pan, 'HUD frame corners fly in'));
add(B.every + 0.5, 'swish', -12, 0, 'XP bar slides up');
[640, 90, 730, 1325, 870, 1325, 1755, 1030].forEach((x, i) => add(lerp(B.tipA, B.tipB, i / 7), 'ui_pop', -10, P(x), 'tooltip pops (everything has stats)'));
// ---- 13. "My bed has stats." — the bounce
add(C.bed, 'whoosh', -12, -0.2, 'cut');
add(B.bed - 0.18, 'ui_pop', -4, P(1400), 'BED · COMFORT +50');
add(B.bed, 'boing', -10, 0, 'bed springs');
add(B.stats1, 'boing', -8, 0, 'bed springs');
// ---- 14. "My SOCK has stats." — at arm's length
add(C.sock, 'whoosh', -12, 0.2, 'cut');
add(B.sock - 0.18, 'ui_pop', -4, P(1300), 'SOCK · CURSED · SMELL +99');
add(B.sock, 'steam_hiss', -16, P(1300), 'stink lines');
add(B.stats2, 'gulp', -8, 0, 'he gags');
// ---- 15. "My alarm clock is an ENEMY?!"
add(C.alarm, 'whoosh', -10, -0.4, 'whip to the nightstand');
add(B.alarm - 0.05, 'alarm_beep', 0, -0.2, 'the alarm clock rings');
add(B.alarm + 0.95, 'alarm_beep', -2, -0.2, 'still ringing');
add(B.clock - 0.2, 'ui_pop', -4, 0.1, 'ALARM CLOCK · ENEMY tooltip');
add(B.clock - 0.15, 'error', -10, 0.1, 'red ENEMY tag');
// ---- 16. VS card
add(C.vs, 'whoosh', -4, -0.6, 'YOU slides in');
add(C.vs + 0.05, 'whoosh', -4, 0.6, 'ALARM CLOCK slides in');
add(B.enemy, 'orch_hit', 0, 0, 'VS slams');
add(B.enemy + 0.05, 'alarm_beep', -6, 0.5, 'the boss keeps ringing');
add(B.enemy + 0.1, 'ui_pop', -8, 0, 'boss bar drops in');
// ---- 17. the fight
add(B.launch, 'jump', -4, 0.1, 'leaps off the bed');
add(B.hit - 0.1, 'swish', -2, -0.2, 'pillow swing');
add(B.hit, 'punch', 2, -0.4, 'SMACK');
add(B.hit + 0.01, 'impact', -4, -0.4, 'POW! −999 CRITICAL');
add(B.hit + 0.04, 'pop', -8, -0.4, 'feathers burst');
add(B.hit + 0.08, 'whoosh_up', -6, -0.6, 'the clock flies off');
add(B.hit + 0.12, 'powerdown', -8, 0, 'boss bar drains');
add(B.hit + 0.85, 'metal_clank', -10, -0.8, 'the clock lands off-screen');
add(B.landF, 'land', -4, -0.3, 'lands');
add(B.hit + 0.42, 'achievement', -2, 0.2, 'ENEMY DEFEATED!');
add(B.xpPop, 'sparkle', -6, -0.3, '+12 XP pops');
add(B.xpLand, 'coin', -2, -0.6, '+12 XP lands in the bar');
// ---- 18. the toaster: BURN CHANCE 80 %
add(C.toaster, 'whoosh', -10, 0.2, 'cut to the kitchen');
for (let t = C.toaster + 0.3; t < B.burned - 0.2; t += 0.5) add(t, 'countdown_tick', -16, -0.2, 'toaster timer ticking');
add(B.eighty - 0.28, 'ui_pop', -4, -0.2, 'TOASTER · BURN CHANCE 80%');
add(B.burn - 0.1, 'sizzle', -12, -0.2, 'the slots glow red');
add(B.burn + 0.25, 'gulp', -10, 0.3, 'nervous gulp');
// ---- 19. "It burned." — POP
add(B.burned - 0.02, 'pop', 0, -0.2, 'the toast pops out: charcoal');
add(B.burned + 0.02, 'boing', -10, -0.2, 'toast springs up');
add(B.burned + 0.08, 'poof', -6, 0, 'black smoke in his face');
add(B.burned + 0.2, 'ui_pop', -8, -0.3, 'TOAST · BURNT 100%');
add(l(7).b + 0.55, 'poof', -8, 0.1, 'he coughs a smoke puff');
// ---- 20. "Mom was smiling."
add(C.mom, 'whoosh', -12, -0.2, 'cut to Mom');
add(B.smiling - 0.05, 'sparkle', -6, 0, 'sparkles around her smile');
// ---- 21. "Her energy was two percent."
add(B.energy - 0.32, 'ui_pop', -4, 0, 'MOM · LV 38 plate');
add(B.two - 0.03, 'zoom_in', -6, 0, 'smash-zoom');
add(B.two + 0.02, 'alarm_beep', -10, 0, 'ENERGY 2% blinks red');
add(B.two + 0.08, 'error', -12, 0.3, 'low battery');
// ---- 22. "Good morning, sweetheart!"
add(C.gm, 'whoosh', -12, 0.2, 'cut');
add(l(9).a + 0.1, 'cloth', -14, -0.4, 'Mom waves');
add(l(9).b - 0.2, 'gulp', -10, 0.2, 'he stares at her 2%');
// ---- 23. coffee 1 + 2
add(C.coffee, 'ui_pop', -8, 0.1, 'COFFEE · +1% ENERGY tooltip');
B.sips.slice(0, 2).forEach((s, i) => { add(s - 0.05, 'gulp', -6, 0.1, `sip ${i + 1}`); add(s + 0.05, 'sparkle', -12, 0.1, '+1% ENERGY pops'); });
B.lands.slice(0, 2).forEach((s, i) => add(s, 'coin', -6, 0, `+1% lands (${3 + i}%)`));
// ---- 24. "She drank four." — chug, chug, clunk, clunk
add(C.four, 'whoosh', -12, -0.2, 'cut');
B.sips.slice(2).forEach((s, i) => add(s - 0.08, 'gulp', -4, -0.1, `chug ${i + 3}`));
B.slams.forEach((s, i) => add(s, 'dishes', -4, -0.5, `mug ${i + 3} slams on the counter`));
B.lands.slice(2).forEach((s, i) => add(s, 'coin', -8, 0, `+1% (${5 + i}%)`));
// ---- 25. "Six percent. A new record."
add(C.six, 'zoom_in', -6, 0, 'push to the plate');
add(B.six, 'money_counter', -12, 0, '6% bumps');
add(B.record - 0.08, 'stamp', -2, 0.3, 'NEW RECORD! stamp');
add(B.record, 'tada', -4, 0, 'new record fanfare');
add(B.record + 0.02, 'confetti', -6, 0, 'confetti');
add(B.doze + 0.1, 'snore', -12, -0.1, 'Mom dozes off, smiling');
// ---- 26. Grandpa LV 87
add(C.gpa, 'whoosh', -12, 0.3, 'cut to Grandpa');
add(B.gpa - 0.15, 'ui_pop', -4, 0, 'GRANDPA LOU · LV 87 plate');
add(B.e87 - 0.12, 'cloth', -10, 0, 'the flex');
add(B.e87, 'shine', -4, -0.1, 'crown sparkle on LV 87');
// ---- 27. Max: infinite health
add(C.max, 'whoosh', -12, -0.3, 'cut to Max');
add(B.max - 0.25, 'ui_pop', -4, 0, 'MAX · CHAOS 9999 · HP ∞');
add(B.max, 'electric', -16, 0.1, 'CHAOS overflow sparks');
add(B.inf, 'magic', -8, 0.1, '∞ shimmer');
add(B.health - 0.08, 'monster_growl', -12, 0.2, 'RAWR (cute)');
// ---- 28-29. "Why are you staring…" — the swat through the plate
add(C.stare, 'whoosh', -14, 0.3, 'cut');
add(B.head - 0.25, 'swish', -6, 0.2, 'he swats above his head');
add(B.head, 'glitch', -8, 0, 'his hand goes through the plate');
// ---- 30. "No reason! Nice... hair"
add(l(13).a + 0.02, 'swish', -12, -0.2, 'head shake');
add(l(13).a + 0.2, 'swish', -12, 0.2, 'head shake');
add(B.hair - 0.1, 'cloth', -14, 0.2, 'thumbs up');
add(B.hair + 0.1, 'shine', -10, 0.3, 'forced-grin sparkle');
add(l(13).b + 0.02, 'cricket', -10, 0, 'awkward');
// ---- 31. "I don't have hair."
add(B.hair2 - 0.03, 'shine', 0, -0.1, 'the bald dome glints');
add(B.hair2 + 0.05, 'ui_pop', -8, 0.2, 'HAIR · FOUND: 0');
add(l(14).b + 0.08, 'rimshot', -10, 0, 'ba-dum-tss');
// ---- 32. "Watch this!"
add(C.watch, 'boing', -8, 0, 'Max pops up on his booster');
add(l(15).a + 0.3, 'electric', -12, 0, 'CHAOS spikes');
// ---- 33. the flip → SPLASH
add(B.launchM, 'whoosh_up', -2, -0.4, 'Max launches');
add(B.launchM + 0.3, 'whoosh', -6, -0.4, 'the flip');
add(B.splash - 0.02, 'big_splash', 2, -0.4, 'SPLASH into the cereal');
add(B.splash, 'splat', -2, -0.2, 'milk everywhere');
add(B.splash + 0.05, 'pop', -10, 0.3, 'cereal rings fly');
add(B.splash + 0.12, 'splat', -8, 0.4, 'milk hits the hero + Grandpa');
// ---- 34. −50 … NO DAMAGE
add(C.immune + 0.1, 'punch', -8, 0.2, '−50 damage number');
add(C.immune + 0.4, 'stamp', -4, -0.1, 'NO DAMAGE');
// ---- 35-36. "This... is... AMAZING."
add(C.wow + 0.1, 'ui_pop', -12, -0.5, 'toast tooltip');
add(C.wow + 0.3, 'ui_pop', -12, -0.1, 'cereal tooltip');
add(C.amazing, 'zoom_in', -2, 0, 'smash-zoom on AMAZING');
add(B.amazing, 'angel', -8, 0, 'heavenly choir');
add(B.amazing + 0.05, 'sparkle', -6, 0, 'star eyes');
// ---- 37. Biscuit's stats didn't even load
add(C.biscuit, 'whoosh', -12, 0.5, 'cut to Biscuit');
add(C.biscuit + 0.05, 'loading', -8, 0.5, 'LOADING STATS... (stuck at 99%)');
add(B.load, 'beep', -12, 0.5, 'loader stutters');
add(B.load + 0.33, 'beep', -14, 0.5, 'loader stutters');
// ---- 38. Error. Too good.
add(B.error - 0.04, 'error', 0, 0.5, 'ERROR: TOO GOOD');
add(B.error, 'glitch', -2, 0.5, 'HUD glitch');
add(B.good - 0.05, 'heart_pop', -6, 0.5, 'the very good boy face');
add(B.good + 0.4, 'dog_bark', -8, 0.5, 'arf arf');
// ---- 39. the hero pets Biscuit → whip to SC 04
for (let i = 0; i < 3; i++) add(C.end + 0.2 + i * 0.7, 'cloth', -16, 0.2, 'pat pat');
for (let t = C.end; t < END; t += 0.02) if (Math.sin(t * 2.3) > 0.93 && Math.sin((t - 0.02) * 2.3) <= 0.93) add(t, 'glitch', -14, 0.4, 'the ERROR plate glitches');
add(END - 0.15, 'whoosh', -4, 0.4, 'white whip into SC 04');

// ================================================================= MUSIC (tiles [T0, END])
const music = [
  { start: T0, end: C.terms, mood: 'install', energy: 0.4, in: 'fade', out: 'cut' },                     // the update window, the night house
  { start: C.terms, end: B.click, mood: 'install', energy: 0.75, in: 'cut', out: 'scratch' },             // 4,812 pages … click
  { start: B.click, end: C.install, mood: 'mystery', energy: 0.3, in: 'cut', out: 'cut' },                // "Nobody reads those." (page one)
  { start: C.install, end: B.reality2, mood: 'install', energy: 0.9, in: 'swell', out: 'sting' },         // INSTALLING... REALITY
  { start: B.reality2, end: B.dark, mood: 'install', energy: 1, in: 'cut', out: 'cut' },                  // the burst, the window in the night
  { start: B.dark, end: C.wake, mood: 'silence', energy: 0, in: 'cut', out: 'cut' },                     // lights out
  { start: C.wake, end: C.pov, mood: 'homey', energy: 0.3, in: 'fade', out: 'cut' },                     // the next morning…
  { start: C.pov, end: B.every, mood: 'install', energy: 0.6, in: 'cut', out: 'sting' },                  // LOADING REALITY → ONLINE
  { start: B.every, end: C.alarm, mood: 'quest', energy: 0.55, in: 'cut', out: 'cut' },                   // everything has stats
  { start: C.alarm, end: C.toaster, mood: 'boss', energy: 0.85, in: 'cut', out: 'sting' },                // the alarm clock mini boss
  { start: C.toaster, end: B.burned, mood: 'quest', energy: 0.4, in: 'cut', out: 'scratch' },             // BURN CHANCE 80 %
  { start: B.burned, end: C.mom, mood: 'silence', energy: 0, in: 'cut', out: 'cut' },                    // it burned.
  { start: C.mom, end: C.stare, mood: 'homey', energy: 0.5, in: 'fade', out: 'cut' },                    // Mom 2 %, coffees, Grandpa, Max
  { start: C.stare, end: C.nohair, mood: 'playful', energy: 0.35, in: 'cut', out: 'cut' },               // "Nice... hair"
  { start: C.nohair, end: C.watch, mood: 'silence', energy: 0, in: 'cut', out: 'cut' },                  // "I don't have hair."
  { start: C.watch, end: C.wow, mood: 'chaos', energy: 0.85, in: 'cut', out: 'sting' },                  // Watch this! → SPLASH
  { start: C.wow, end: C.biscuit, mood: 'wonder', energy: 0.6, in: 'swell', out: 'cut' },                // This... is... AMAZING.
  { start: C.biscuit, end: B.error, mood: 'homey', energy: 0.35, in: 'cut', out: 'cut' },                // Biscuit loading...
  { start: B.error, end: END, mood: 'playful', energy: 0.45, in: 'cut', out: 'fade' },                   // ERROR: TOO GOOD → school
].map((s) => ({ ...s, start: r3(s.start), end: r3(s.end) }));

// ================================================================= AMBIENCE
const amb = [];
const bed = (a, b, name, g) => { if (b > a) amb.push({ start: r3(Math.max(a, T0)), end: r3(Math.min(b, END)), name, gain_db: g }); };
bed(T0, C.night, 'night', -14);                      // the bedroom at night (crickets + room tone)
bed(C.night, C.terms, 'night', -10);                 // outside: crickets
bed(C.terms, C.house, 'night', -18);
bed(C.house, B.dark + 0.4, 'night', -10);            // outside again
bed(B.dark + 0.4, C.wake, 'night', -22);             // dark, fading
bed(C.wake, C.toaster, 'birds', -14);                // morning bedroom: birds through the window
bed(C.wake, C.toaster, 'room', -20);
bed(C.toaster, END, 'kitchen', -14);                 // the kitchen (fridge hum)
bed(C.toaster, END, 'birds', -24);

// ================================================================= FOOTSTEPS — none: nobody walks in SC 03 (the leap, the landing,
// the mugs and the splash are single SFX above)
const steps = [];

sfx.sort((a, b) => a[0] - b[0]);
const out = { scene: 'SC 03', start: r3(T0), end: r3(END), music, ambience: amb, footsteps: steps, sfx };
const file = path.join(__dirname, 'sc03.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log('wrote', file, '—', sfx.length, 'sfx,', music.length, 'music segments,', amb.length, 'ambience beds,', steps.length, 'footstep runs');
