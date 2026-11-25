#!/usr/bin/env node
// Sound cue sheet generator for SC 08 · THE FAIR: the whip in from home, NEW AREA: TOWN FAIR, Mom's DAY OFF tag + ENERGY roll,
// the dusk fair (carnival), PARTY 4/4, Max's hops + the inflatable dinosaur's rubber squeak, the JOURNAL snapshot, the wave of
// plates over thousands of heads + the fly-over, "Wait." (record scratch -> silence), the ghost of Max / PLAYER NOT FOUND, Mom's
// "MAX!" (ENERGY drains), NEW QUEST, the spinning quest arrow, WARNING / HUD OVERLOAD (alarm, glitches), the numbers flood,
// whip pans, strangers turning around (slap, stamp of the face plate), the spin, Mom's grab, SEARCH: GREEN DINOSAUR, the noise
// peak with the hero covering his ears — and then the drop into silence ("...couldn't see your brother.").
// Every time comes from the voice timeline exactly like scenes/s08.js: the cut list (C) and beats (B) come from
// scenes/s08_env.js times(V), built only from L(id).a/.b and .word(). When the voice changes:
//   node audio/cues/gen_sc08.js && python3 audio/validate_cues.py audio/cues/sc08.json
// Output: audio/cues/sc08.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const E = require('../../scenes/s08_env');
const { L } = V;

const { START: T0, END, C, B } = E.times(V);     // == main.js RANGES for SC 08
const l = (i) => L('08.' + i);

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const lerp = (a, c, k) => a + (c - a) * k;
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));     // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(t), name, g, r3(pan), note]); };

// ================================================================= SFX, shot by shot (same order as scenes/s08.js)
// ---- 1. the TOWN FAIR arch, the family walks in
add(T0, 'whoosh', -6, 0, 'whip in from home: the TOWN FAIR sign');
add(B.sat, 'tap', -10, 0.6, '"SAT" flashes in the HUD clock');
add(B.tilt, 'whoosh_down', -10, 0, 'tilt down from the sign to the family');
add(B.area, 'achievement', -4, 0, 'NEW AREA DISCOVERED: TOWN FAIR banner');
[770, 905, 1020, 1150].forEach((x, i) => add(B.famPlates + i * 0.12, 'ui_pop', -9, P(x), 'mini plate pops over the family'));
add(C.mom - 0.35, 'ui_close', -10, 0, 'banner folds away');
// ---- 2. Mom's first day off
add(C.mom, 'whoosh', -10, 0, 'cut to Mom');
add(B.momPlate, 'ui_pop', -4, -0.1, "Mom's plate: LV 38, ENERGY 2%");
add(B.dayoff - 0.05, 'cloth', -8, 0, 'Mom stretches her arms up');
add(B.dayoff, 'click', -4, 0.1, 'DAY OFF! tag slaps on');
add(B.dayoff + 0.02, 'sparkle', -8, 0.1, 'DAY OFF! sparkle');
add(B.year, 'upgrade', -4, 0, 'ENERGY rolls 2% -> 22%');
add(B.year + 0.05, 'money_counter', -10, 0, 'energy number rolling');
add(B.year + 0.3, 'coin', -8, 0.2, '+20% ENERGY pop');
// ---- 3. the fair, wide
add(C.wide, 'whoosh_long', -8, 0, 'crane over the dusk fair');
for (let i = 0; i < 4; i++) add(C.wide + 0.35 + i * 0.22, 'ui_pop', -15, lerp(-0.6, 0.6, i / 3), 'plates over the crowd');
// ---- 4. "Everybody stay together, okay?" — PARTY 4/4
add(C.together, 'whoosh', -10, 0, 'cut to the family at the cotton candy stand');
add(B.party, 'ui_pop', -4, -0.8, 'PARTY 4/4 panel pops');
add(B.party + 0.15, 'confirm', -10, -0.8, 'party roster');
for (let i = 0; i < 3; i++) add(C.together + 0.3 + i * 0.36, 'ui_pop', -15, 0.4, 'plates pop around the hero');
// ---- 5. "I wanna go UP!"
add(C.up, 'whoosh', -10, 0, 'cut to Max');
add(C.up + 0.05, 'ui_pop', -8, 0, 'MAX: CHAOS 9999');
for (let k = 0; k < 4; k++) add(C.up + 0.18 + k * Math.PI / 8.5, 'jump', -12, 0, 'Max hops');
add(B.up, 'boing', -6, 0, 'UP! big bounce');
add(B.up + 0.02, 'sparkle', -10, 0, 'UP! focus lines');
// ---- 6. "Way up! Where the clouds are!" — the inflatable dinosaur looks back at him
add(C.sky, 'whoosh_up', -8, 0, 'tilt up to the giant inflatable dinosaur');
add(B.clouds - 0.25, 'squeak', -6, 0.2, "the dinosaur's rubber eyes roll down to Max");
add(B.clouds + 0.2, 'sparkle', -10, 0.25, 'twinkle by its head');
// ---- 7. "Remember that." the JOURNAL snapshot
add(C.remember, 'whoosh', -10, 0, 'cut back to Max hopping');
add(B.freeze, 'camera_flash', -2, 0, 'SNAP: freeze frame');
add(B.freeze + 0.1, 'paper', -8, 0, 'polaroid card');
add(B.freeze + 0.45, 'notify', -6, 0, 'JOURNAL UPDATED: MAX WANTS TO GO UP');
// ---- 8. "It's important." the card flies into the HUD; the hero reads plates
add(C.hero + 0.2, 'whoosh', -8, -0.5, 'the card flies to the HUD corner');
add(C.hero + 0.95, 'pop', -6, -0.6, 'journal slot lands (pulse)');
for (let i = 0; i < 4; i++) add(C.hero + 0.1 + i * 0.2, 'ui_pop', -15, 0.3, 'plates pop where he looks');
// ---- 9. thousands of people -> thousands of numbers
add(C.people, 'whoosh', -8, 0, 'cut to the sea of heads');
for (let i = 0; i < 12; i++) add(B.wave + i * 0.085, 'ui_pop', -9 - (i % 3), lerp(-0.7, 0.7, i / 11), 'wave of plates over every head');
add(B.wave + 0.1, 'money_counter', -10, 0, 'numbers everywhere');
// ---- 10. the fly-over
add(C.over, 'whoosh_long', -6, -0.3, 'the camera flies over the crowd');
for (let i = 0; i < 6; i++) add(C.over + 0.3 + i * 0.48, 'ui_pop', -16, r3((hash(i * 3.1) - 0.5) * 1.2), 'plates passing below');
// ---- 11-12. "Wait. Where's Max?"
add(B.wait - 0.02, 'record_scratch', -2, 0, '"Wait." (music stops)');
add(B.wait + 0.05, 'swish', -8, 0, 'he turns');
add(C.gone, 'whoosh', -12, 0, 'cut to where Max stood');
add(C.gone + 0.1, 'heartbeat', -4, 0, 'nobody there');
add(B.lost - 0.25, 'glitch', -8, -0.2, 'LAST SEEN hologram of Max');
add(B.lost, 'error', -2, -0.8, 'PARTY 3/4 — MAX: SIGNAL LOST / PLAYER NOT FOUND');
add(C.gone + 0.3, 'whoosh_up', -16, -0.2, 'his dino balloon drifts up');
// ---- 13. "Max? MAX!"
add(C.momCall, 'whoosh', -10, 0, "cut to Mom's face");
add(B.max1 + 0.05, 'gulp', -10, 0, 'joy -> panic');
add(B.max2 - 0.05, 'zoom_in', -6, 0, 'smash zoom');
add(B.max2, 'impact', -4, 0, '"MAX!"');
add(B.max2 + 0.05, 'powerdown', -6, 0.4, 'her ENERGY drains 22 -> 1');
add(B.max2 + 0.1, 'alarm_beep', -12, 0.4, 'ENERGY 1% blinking');
add(B.max1 + 0.05, 'click', -8, 0.4, 'WORRIED tag');
// ---- 14-15. NEW QUEST: Find Max. Location... unknown.
add(C.quest, 'whoosh', -10, 0, 'cut to the hero + Mom in the crowd');
add(B.quest, 'whoosh_down', -8, 0, 'quest toast drops');
add(B.quest + 0.2, 'notify', -2, 0, 'NEW QUEST: Find Max');
add(B.find - 0.2, 'ui_pop', -6, 0, 'quest arrow ring at his feet');
add(B.find + 0.1, 'beep', -10, 0, 'FIND MAX · 120 m');
add(B.location, 'glitch', -4, 0, 'the arrow starts spinning');
add(B.location + 0.4, 'whoosh', -12, 0, 'arrow spin');
add(B.unknown, 'glitch_long', -6, 0, 'LOCATION: UNKNOWN (scrambles)');
// ---- 16-17. WARNING. Too many players. HUD OVERLOAD.
add(C.warn, 'whoosh', -10, 0, 'cut to the crowd: plates jitter');
add(B.warn, 'alarm_beep', -2, 0, 'WARNING');
add(B.warn + 0.1, 'siren', -10, 0, 'red edge pulse');
add(B.players, 'glitch', -6, 0.3, 'minimap floods with dots');
add(C.overload, 'zoom_in', -4, 0, 'smash zoom on the hero');
add(B.overload, 'glitch_long', 0, 0, 'HUD OVERLOAD: the whole HUD glitches');
add(B.overload + 0.02, 'impact', -4, 0, 'red flash');
add(B.overload + 0.05, 'static', -8, 0, 'static');
// ---- 18. numbers over everything
add(C.flood, 'riser', -6, 0, 'numbers rise over the sky, the rides, everyone');
[[C.flood + 0.1, -0.3], [C.flood + 0.5, 0.1], [C.flood + 0.9, -0.5], [C.flood + 1.3, 0.6]].forEach(([tt, p]) => add(tt, 'ui_pop', -10, p, 'tooltip: Ferris wheel / cotton candy / cloud / sky'));
for (let i = 0; i < 3; i++) add(C.flood + 0.4 + i * 0.8, 'glitch', -12, r3((hash(i) - 0.5)), 'flicker');
// ---- 19-20. "You looked everywhere." whip pans; "...were numbers."
B.whips.forEach((w, i) => add(w, 'whoosh', -6, i % 2 ? 0.4 : -0.4, `whip pan ${i + 1} across plated faces`));
add(C.see, 'zoom_in', -8, 0, 'POV push into the crowd');
add(B.numbers9, 'glitch', -4, 0, '"were numbers": the flood jumps');
// ---- 21-23. "Level twelve! Level forty! Level eight!"
[[C.lv12, B.lv12], [C.lv40, B.lv40], [C.lv8, B.lv8]].forEach(([c0, w], i) => {
  add(c0, 'slap', -8, -0.4, `hand on a stranger's shoulder (${['12', '40', '8'][i]})`);
  add(c0 + 0.2, 'swish', -10, 0, 'the stranger turns around');
  add(w - 0.04, 'stamp', -2, 0, `plate slams over the face: LV ${['12', '40', '8'][i]}`);
  add(w, 'buzzer_wrong', -12, 0, 'not Max');
});
// ---- 24. "I can't see FACES!" he spins
for (let i = 0; i < 4; i++) add(C.faces + 0.1 + i * 0.42, 'whoosh', -12, (i % 2 ? 0.4 : -0.4), 'spinning in the crowd');
add(B.faces, 'impact', -6, 0, '"FACES!" shake');
add(B.faces + 0.05, 'heartbeat', -4, 0, 'panic');
// ---- 25. Mom grabs him; even her face is a plate
add(C.dino, 'whoosh', -10, 0, 'cut: Mom runs in');
add(B.grab, 'cloth', -4, -0.1, 'Mom grabs his shoulders');
for (let i = 0; i < 3; i++) add(B.grab + 0.4 + i * 0.6, 'glitch', -12, -0.2, "the plate flickers over Mom's face");
// ---- 26. SEARCH: GREEN DINOSAUR -> 2,413 MATCHES
add(C.green, 'whoosh', -10, 0, 'cut to the sea of plates');
add(B.search - 0.15, 'ui_pop', -6, 0, 'search bar');
add(B.search, 'typing', -6, 0, 'G-R-E-E-N D-I-N-O-S-A-U-R');
add(B.results, 'error', -2, 0, '2,413 MATCHES');
add(B.results + 0.05, 'money_counter', -8, 0, 'match counter rolls');
// ---- 27-28. "I can't tell! Everybody's just... a number!"
add(C.tell, 'whoosh', -10, 0, 'cut to his face');
add(C.tell + 0.1, 'heartbeat', -2, 0, 'heartbeat');
add(C.number, 'whoosh_long', -6, 0, 'pull back: every face a plate');
add(B.number, 'glitch', -2, 0, '"a number!"');
// ---- 29. the flood fills the screen; he covers his ears
add(C.ears, 'glitch_long', 0, 0, 'the numbers fill the screen');
add(C.ears + 0.05, 'static', -4, 0, 'noise');
add(C.ears + 0.1, 'cloth', -8, 0, 'hands over his ears');
add(C.ears + 0.7, 'heartbeat', -2, 0, 'heartbeat');
add(C.ears + 1.6, 'heartbeat', -2, 0, 'heartbeat');
add(C.quiet - 2.0, 'riser', -4, 0, 'noise rising to the cut');
add(C.ears + 1.2, 'glitch', -6, 0.5, 'glitch burst');
add(C.ears + 2.2, 'glitch', -6, -0.5, 'glitch burst');
// ---- 30-31. silence: "You could see everyone's stats. But you couldn't see your brother."
add(C.quiet, 'sub_drop', -4, 0, 'everything drops into silence (the flood freezes, goes cold)');
add(C.brother + 0.2, 'whoosh_long', -16, 0, 'slow pull back: alone in a sea of numbers');
add(B.brother + 0.4, 'heartbeat', -12, 0, 'one last heartbeat');
sfx.sort((a, b) => a[0] - b[0]);

// ================================================================= music (tiles [T0, END])
const M = [];
const seg_ = (a, b, mood, energy, inn, out) => { if (b - a > 0.05) M.push({ start: r3(a), end: r3(b), mood, energy, in: inn, out }); };
seg_(T0, C.wide, 'carnival', 0.55, 'cut', 'cut');                     // the arch, Mom's day off
seg_(C.wide, C.together, 'carnival', 0.8, 'cut', 'cut');              // the fair, wide (no voice)
seg_(C.together, C.people, 'carnival', 0.5, 'cut', 'cut');            // stay together, I wanna go UP, remember that
seg_(C.people, B.wait, 'carnival', 0.75, 'cut', 'scratch');           // thousands of numbers + the fly-over
seg_(B.wait, C.momCall, 'silence', 0, 'cut', 'cut');                  // "Wait. Where's Max?"
seg_(C.momCall, C.warn, 'overload', 0.55, 'swell', 'cut');            // MAX! New quest. The arrow spins.
seg_(C.warn, C.flood, 'overload', 0.75, 'cut', 'cut');                // WARNING. HUD overload.
seg_(C.flood, C.looked, 'overload', 1.0, 'cut', 'cut');               // numbers over everything (no voice)
seg_(C.looked, C.ears, 'overload', 0.85, 'cut', 'cut');               // looked everywhere, LEVEL 12/40/8, FACES, green dinosaur
seg_(C.ears, C.quiet, 'overload', 1.0, 'cut', 'cut');                 // the noise peak, ears covered
seg_(C.quiet, END, 'sad', 0.3, 'fade', 'fade');                       // silence -> soft piano: "...your brother."

// ================================================================= ambience + footsteps
const amb = [];
const bed = (a, b, name, g) => { if (b - a > 0.05) amb.push({ start: r3(a), end: r3(b), name, gain_db: g }); };
bed(T0, B.wait, 'crowd', -10);
bed(B.wait, C.momCall, 'crowd', -16);
bed(C.momCall, C.quiet, 'crowd', -8);
bed(C.flood, C.quiet, 'static', -16);
bed(C.quiet, END, 'wind', -26);
const steps = [];
const run = (s0, s1, interval, surface, g, pan) => { if (s1 - s0 > 0.1) steps.push({ start: r3(s0), end: r3(s1), interval: r3(interval), surface, gain_db: g, pan }); };
run(T0, C.mom, Math.PI / 7.5, 'soft', -10, 0);                       // the family walks in under the arch (walkFront t*7.5)
run(C.wide, C.together, Math.PI / 8, 'soft', -12, -0.2);              // walking into the fair (walk t*8)
run(C.dino, B.grab, 0.22, 'soft', -8, -0.3);                          // Mom runs in

const out = { scene: 'SC 08', start: r3(T0), end: r3(END), music: M, ambience: amb, footsteps: steps, sfx };
fs.writeFileSync(path.join(__dirname, 'sc08.json'), JSON.stringify(out, null, 1));
console.log(`sc08.json: ${sfx.length} sfx, ${M.length} music segments, ${amb.length} beds, ${steps.length} footstep runs`);
