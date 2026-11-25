#!/usr/bin/env node
// Sound cue sheet generator for SC 07 · OBSESSION: the school bell + Mrs. Krump's pointer taps and the glare sting, Benji's
// jump / idea bulb / potato battery pop, the whip to the MATHLETES (glasses glint, INT 95 plates counting), the VS card and
// the PICKED stamp, the FRIENDSHIP −50 heart (pop, crack, split + sub drop, then silence), the potato bulb fizzling out, the
// number bubbles, the dead laugh (cricket, FUN: 0%), home: door, footsteps, dishes, the quest marker + toast with its tiny
// +5 XP coin, the +50 XP waypoint shimmer, Mom's marker powering down, the door closing, ENERGY rolling 2% -> 1% (alarm beep),
// the run + skid in the living room, Grandpa's plate pop + glitch on "whole truth", the HUD clock rolling THU -> SAT.
// Every time comes from the voice timeline exactly like scenes/s07.js: the cut list + beats come from the scene's own
// times(V) (built only from L(id).a/.b and .word()). When the voice changes:
//   node audio/cues/gen_sc07.js && python3 audio/validate_cues.py audio/cues/sc07.json
// Output: audio/cues/sc07.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { times, DAYS } = require('../../scenes/s07');
const { L } = V;

const { START: T0, END, C, B } = times(V);                         // == main.js RANGES for SC 07
const l = (i) => L('07.' + i);

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const lerp = (a, c, k) => a + (c - a) * k;
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));     // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(t), name, g, r3(pan), note]); };

// ================================================================= SFX, shot by shot (same order as scenes/s07.js)
// ---- 1. Room 12: the board, pointer taps
add(T0, 'whoosh', -6, 0, 'white whip in from the street (SC 06)');
add(T0 + 0.05, 'bell', -12, 0.3, 'school bell');
add(T0 + 0.15, 'ui_pop', -8, P(500), "Mrs. Krump's boss plate pops");
add(T0 + 0.5, 'ui_pop', -12, P(1700), "Benji's plate pops (cold)");
add(B.tap1, 'tap', -2, P(560), 'pointer TAP on "Science fair"');
add(B.tap1 + 0.03, 'poof', -16, P(560), 'chalk dust');
add(B.tap2, 'tap', -2, P(600), 'pointer TAP on "Partners"');
add(B.tap2 + 0.03, 'poof', -16, P(600), 'chalk dust');
// ---- 2. "Choose wisely." smash-zoom, the glare
add(C.krump, 'zoom_in', -4, P(700), 'smash-zoom on Mrs. Krump');
add(B.glare - 0.1, 'dramatic', -10, 0, 'dun dun DUNN under "wisely"');
add(B.glare, 'shine', -2, P(800), 'glare glint across her glasses');
// ---- 3. "Partners again?" Benji waves
add(C.benji, 'whoosh', -10, 0.3, 'whip to the shared desk');
add(B.wave, 'cloth', -14, P(1300), 'Benji waving');
add(C.benji + 0.2, 'ui_pop', -14, P(700), '??? over the hero');
// ---- 4. the idea + the potato battery
add(B.stand, 'jump', -8, P(1000), 'Benji jumps up from his seat');
add(B.stand + 0.05, 'squeak', -14, P(1000), 'chair squeak');
add(B.idea - 0.05, 'chime', -6, P(1400), 'idea bulb!');
add(B.idea, 'pop', -10, P(1400), 'bulb pops in');
add(B.potato, 'pop', -4, P(960), 'the potato battery pops into his hands');
add(B.potato + 0.05, 'sparkle', -10, P(960), 'sparkles');
add(B.battery - 0.05, 'ui_pop', -8, P(1400), 'tooltip: POTATO BATTERY · SUCCESS 3%');
add(B.battery + 0.1, 'electric', -18, P(960), 'the tiny bulb buzzes');
// ---- 5. "Actually, Benji..." — collar tug
add(C.actually + 0.15, 'cloth', -14, P(800), 'nervous collar tug');
add(C.actually + 0.6, 'gulp', -10, P(800), 'awkward gulp');
// ---- 6. the MATHLETES
add(C.smart - 0.05, 'whoosh', -6, 0.5, 'whip-pan to the smart kids');
add(B.them - 0.25, 'ui_pop', -8, P(600), 'ADA · INT 95');
add(B.them - 0.13, 'ui_pop', -8, P(1300), 'ISAAC · INT 95');
add(B.them - 0.05, 'money_counter', -14, 0, 'INT counts up to 95');
add(B.them + 0.02, 'shine', -4, 0, 'glasses glint in sync');
// ---- 7. the VS card
add(C.vs, 'whoosh', -8, -0.3, 'whip back + dim');
add(C.vs + 0.1, 'swish', -6, -0.4, 'SMART KIDS card slides in');
add(C.vs + 0.2, 'swish', -6, 0.4, 'BENJI card slides in');
add(C.vs + 0.45, 'boom', -8, 0, 'VS slams');
add(B.ninety, 'stamp', -2, -0.3, 'PICKED stamp on "ninety-five"');
add(B.ninety + 0.15, 'powerdown', -12, 0.35, 'Benji\'s card goes cold and dim');
add(B.intel, 'confirm', -10, -0.3, 'choice confirmed');
// ---- 8–10. "Since when do you care about levels?" — FRIENDSHIP −50 — "That number hurt more than any other."
add(B.heart, 'heart_pop', -6, P(960), 'a red heart pops between them');
add(B.crack, 'glass', -2, P(960), 'the heart CRACKS');
add(B.split, 'glass', 0, P(960), 'it splits in two');
add(B.split + 0.02, 'sub_drop', -4, 0, 'heavy drop (music out)');
add(B.heart + 0.5, 'error', -16, P(960), 'FRIENDSHIP −50 chip shakes on');
add(B.crack + 0.05, 'heartbeat', -14, P(700), 'the hero flinches');
add(B.bulbOut, 'electric', -14, P(980), 'the potato bulb fizzles');
add(B.bulbOut + 0.2, 'powerdown', -14, P(980), '...and goes out');
// ---- 11. "Your new partners were very smart."
add(C.partners, 'whoosh', -10, 0.4, 'cut to the MATHLETES table');
add(B.smart, 'shine', -6, 0, 'glasses glint');
// ---- 12. number bubbles (same schedule as numberBubbles() in s07.js)
for (let i = 0; i < 6; i++) { const tb = lerp(C.numbers + 0.05, C.laugh - 0.5, i / 5); add(tb, 'chat_pop', -8, i % 2 ? 0.35 : -0.35, `number bubble ${i + 1}`); }
// ---- 13. the forced laugh dies
add(C.laugh + 0.1, 'boing', -14, 0, 'his forced laugh (shoulders bounce)');
add(C.laugh + 0.3, 'swish', -12, -0.3, 'ADA turns to stare');
add(C.laugh + 0.35, 'swish', -12, 0.3, 'ISAAC turns to stare');
add(B.once - 0.1, 'ui_pop', -8, 0, 'tooltip: LAUGHS 0 · FUN 0%');
add(B.once + 0.15, 'error', -14, 0, 'FUN: 0%');
add(B.once + 0.4, 'cricket', -8, 0.2, 'awkward silence');
// ---- 14. "...This is boring." Benji alone through the window
add(C.boring + 0.3, 'snore', -18, P(1100), 'a bored half-snore (zzz)');
add(B.glance, 'blink', -8, P(1100), 'he glances at the window: Benji alone');
// ---- 15. home, evening
add(C.home, 'whoosh', -6, -0.5, 'whip home');
add(C.home + 0.05, 'door_open', -12, 0.6, 'he comes in through the doorway');
add(C.home + 0.6, 'dishes', -12, -0.5, 'Mom at the sink');
add(B.quest - 0.15, 'notify', -6, -0.5, 'quest marker "!" over Mom');
// ---- 16. "Help Mom. Five XP."
add(B.help - 0.15, 'ui_pop', -6, 0.3, 'NEW QUEST toast drops in');
add(B.help + 0.1, 'typing', -16, 0.3, 'title types in');
add(B.five + 0.1, 'coin', -12, 0.5, 'the tiny +5 XP chip');
add(C.help + 1.4, 'dishes', -14, -0.6, 'scrubbing');
// ---- 17. "Sorry, Mom. Gotta go."
add(C.sorry + 0.2, 'swish', -12, -0.6, 'Mom looks over her shoulder');
add(B.go, 'swish', -10, 0.4, 'thumb over the shoulder');
// ---- 18. the +50 XP waypoint
add(C.fifty, 'whoosh', -8, 0.4, 'cut wide');
add(B.fifty - 0.2, 'robux', -4, 0.7, '+50 XP waypoint glows in the doorway');
add(B.fifty, 'notify', -6, 0.7, 'quest tracker: MOVE MR. PIKE\'S COUCH');
add(B.fifty + 0.05, 'ui_pop', -10, 0.5, 'quest arrow at his feet');
add(B.fifty + 0.3, 'powerdown', -12, -0.8, "Mom's marker greys out");
// ---- 19–20. "I'm fine." — the door, alone
add(C.alone + 0.15, 'door_close', -10, 0.8, 'he is gone');
add(C.alone + 1.1, 'dishes', -12, -0.4, 'she turns back to the dishes');
add(C.alone + 2.0, 'dishes', -16, -0.4, 'washing');
// ---- 21. ENERGY 1%
add(B.energy - 0.3, 'ui_pop', -8, -0.2, "Mom's plate pops (cold)");
add(B.one - 0.05, 'money_counter', -12, -0.2, 'ENERGY rolls 2% -> 1%');
add(B.one + 0.3, 'alarm_beep', -14, -0.2, '1% blinks red');
// ---- 22. the living room: run, "Kid." skid
add(C.kid, 'whoosh', -10, 0.3, 'cut: the hero rushes through');
add(B.kid - 0.05, 'skid', -2, P(1150), 'skids to a stop on "Kid."');
add(C.kid + 0.1, 'ui_pop', -14, P(1400), "Grandpa's plate");
// ---- 24. "Stats don't lie." pointing at the plate
add(C.stats, 'whoosh', -10, -0.3, 'whip to the hero');
add(C.stats + 0.1, 'ui_pop', -10, P(1500), 'GRANDPA LOU · LV 87');
add(B.point - 0.15, 'swish', -8, P(1300), 'he points at the plate');
// ---- 25. "...the whole truth" — the plate glitches
add(B.whole, 'glitch', -8, P(1100), "Grandpa's plate flickers");
add(B.whole + 0.5, 'ui_close', -12, P(1100), 'the plate fades');
// ---- 26. the beat: "???", days roll TUE -> SAT, white
add(C.out + 0.4, 'blink', -10, 0, 'he looks up at his own ???');
// the day label switches at dk = i / DAYS.length (dk = seg(t, B.days, END - 0.35), as in shotOut)
for (let i = 1; i < DAYS.length; i++) add(lerp(B.days, END - 0.35, i / DAYS.length), 'countdown_tick', -8, 0.6, DAYS[i]);
add(END - 1.5, 'reverse_swell', -6, 0, 'swell into the white (SC 08: Saturday, the fair)');

// ================================================================= MUSIC (tiles [T0, END])
const music = [
  { start: T0, end: C.vs, mood: 'quest', energy: 0.45, in: 'cut', out: 'cut' },                        // Room 12, Benji's idea (still bouncy)
  { start: C.vs, end: B.heart, mood: 'cold', energy: 0.5, in: 'cut', out: 'cut' },                     // INT 95 vs LV 4 — he picks the numbers
  { start: B.heart, end: C.hurt, mood: 'silence', energy: 0, in: 'cut', out: 'cut' },                   // FRIENDSHIP −50: the crack in silence
  { start: C.hurt, end: C.partners, mood: 'sad', energy: 0.25, in: 'fade', out: 'fade' },               // "That number hurt more than any other."
  { start: C.partners, end: B.once, mood: 'cold', energy: 0.5, in: 'cut', out: 'tapestop' },            // the smart table: numbers, numbers
  { start: B.once, end: C.home, mood: 'silence', energy: 0, in: 'cut', out: 'cut' },                    // never laughed once / "...This is boring."
  { start: C.home, end: C.fine, mood: 'cold', energy: 0.35, in: 'fade', out: 'cut' },                   // Mom's +5 XP quest, the +50 waypoint
  { start: C.fine, end: C.kid, mood: 'sad', energy: 0.28, in: 'cut', out: 'fade' },                     // "I'm fine." / ENERGY 1%
  { start: C.kid, end: C.out, mood: 'tender', energy: 0.3, in: 'fade', out: 'cut' },                    // Grandpa: "What are you really looking at?"
  { start: C.out, end: END, mood: 'cold', energy: 0.45, in: 'swell', out: 'fade' },                     // the days roll to Saturday
].map((s) => ({ ...s, start: r3(s.start), end: r3(s.end) }));

// ================================================================= AMBIENCE
const amb = [];
const bed = (a, b, name, g) => { if (b > a) amb.push({ start: r3(Math.max(a, T0)), end: r3(Math.min(b, END)), name, gain_db: g }); };
bed(T0, C.home, 'room', -18);                       // the classroom
bed(T0, C.home, 'crowd', -30);                      // a class murmuring very softly
bed(C.home, C.kid, 'kitchen', -16);                 // evening kitchen
bed(C.home, END, 'night', -26);                     // dusk crickets outside
bed(C.kid, END, 'room', -18);                       // the living room

// ================================================================= FOOTSTEPS (cycles from the scene code: steps every π/K s)
const steps = [];
const st = (a, b, iv, surface, g, pan) => { if (b > a) steps.push({ start: r3(Math.max(a, T0)), end: r3(Math.min(b, END)), interval: r3(iv), surface, gain_db: g, pan: r3(pan) }); };
st(C.home, C.home + 1.3, Math.PI / 9, 'hard', -12, 0.5);           // heroIn(): AC.walk((t - C.home) * 9), tiles
st(C.sorry + 0.3, C.fifty, Math.PI / 9, 'hard', -16, 0.4);         // backing toward the door
st(C.kid, B.kid - 0.1, Math.PI / 16, 'wood', -8, 0.1);            // shotKid: AC.run((t - C.kid) * 16)

const out = { scene: 'SC 07', start: r3(T0), end: r3(END), music, ambience: amb, footsteps: steps, sfx: sfx.sort((a, b) => a[0] - b[0]) };
const file = path.join(__dirname, 'sc07.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
console.log(`wrote ${file}: ${music.length} music, ${amb.length} ambience, ${steps.length} footsteps, ${sfx.length} sfx`);
