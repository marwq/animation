#!/usr/bin/env node
// Sound cue sheet generator for SC 09 · THE X: quiet. The frozen sea of numbers, Grandpa's hand ("Breathe, kid." — the plate
// slides off his face), the bench (the hero plops down), the 79 patch; the 1979 Super-8 flashback (projector rewind, a
// carnival oom-pah, the crowd), "You... LOST?" (record scratch), the arm insert (strain, BAM, the bell, 0:02), the whole town
// laughing, the night bench (crickets, footsteps, a heart), the match cut back ("Best loss of my whole life."), the plate that
// dissolves, numbers in the sky, the X lighting up (shine + CLOSE HUD?), the terms window from that night (rewind, highlighter,
// the red ring around 4,812), the press (click, power-down), "Reality HUD... off." -> the glass shatter -> TRUE silence.
// Every time comes from the voice timeline exactly like scenes/s09.js: the cut list (C) and beats (B) come from
// scenes/s09_env.js times(V), built only from L(id).a/.b and .word(). When the voice changes:
//   node audio/cues/gen_sc09.js && python3 audio/validate_cues.py audio/cues/sc09.json
// Output: audio/cues/sc09.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const E = require('../../scenes/s09_env');
const { L } = V;

const { START: T0, END, C, B } = E.times(V);     // == main.js RANGES for SC 09
const l = (i) => L('09.' + i);

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(t), name, g, r3(pan), note]); };

// ================================================================= SFX, shot by shot (same order as scenes/s09.js)
// ---- 1. "Breathe, kid." Grandpa's hand on his shoulder in the frozen sea of numbers
add(T0, 'heartbeat', -8, 0, 'still in the frozen sea of numbers');
add(B.hand, 'cloth', -6, 0.3, "Grandpa's hand lands on his shoulder");
add(B.breathe - 0.05, 'swish', -10, 0.3, "the plate slides off Grandpa's face");
add(B.breathe + 0.2, 'shine', -12, 0.3, 'the first clean face');
// ---- 2. "Sit with me for one second." the bench
add(C.bench, 'whoosh', -12, 0, 'cut to the bench under the lamp');
add(B.sit, 'thud', -8, -0.2, 'the hero plops down on the bench');
add(B.sit + 0.04, 'step_wood', -12, -0.2, 'bench creak');
// ---- 3-6. the story; the 79 patch; "I lost."
add(B.patch + 0.1, 'tap', -10, 0.3, 'Grandpa taps his 79 patch');
add(B.patch + 0.32, 'tap', -12, 0.3, 'tap');
add(C.finals, 'swish', -14, 0.3, 'cut: Grandpa remembering');
add(C.end, 'swish', -14, -0.3, 'cut: the hero looks up');
// ---- 7. FLASHBACK 1979: "Lost the final. In front of everybody."
add(C.fb1 - 0.05, 'rewind', -6, 0, 'into 1979 (film burn)');
add(C.fb1 + 0.1, 'vhs_clunk', -10, 0, 'Super-8 projector');
add(C.fb1 + 0.4, 'crowd_cheer', -12, 0, 'the 1979 crowd around the FINAL table');
add(B.everybody - 0.2, 'whoosh_long', -14, 0, 'pull back: in front of everybody');
// ---- 8. "You... LOST?"
add(C.youLost, 'record_scratch', -4, 0, 'back to today: "You..."');
add(B.LOST - 0.06, 'zoom_in', -6, -0.3, 'smash zoom on "LOST?"');
// ---- 9. "Arm went down in two seconds." the arm insert
add(C.arm, 'vhs_clunk', -10, 0, 'back to the film');
add(C.arm + 0.15, 'squeak', -12, 0, 'arms straining');
add(C.arm + 0.5, 'squeak', -14, 0.1, 'arms straining');
add(B.down - 0.08, 'whoosh_down', -6, -0.2, 'the arm goes down');
add(B.down + 0.08, 'punch', 0, -0.3, 'SLAM on the table');
add(B.down + 0.1, 'impact', -4, -0.3, 'BAM!');
add(B.two - 0.02, 'bell', -4, 0.5, 'the bell: match over');
add(B.two + 0.05, 'stamp', -4, 0.6, '0:02 stamp');
// ---- 10. "The whole town laughed."
add(C.laugh, 'swish', -12, 0, 'cut to the stage');
add(B.laughed - 0.5, 'crowd_laugh', 0, 0, 'the whole town laughs');
add(B.laughed - 0.2, 'kids_laugh', -8, 0.3, 'kids laughing');
add(B.laughed + 0.3, 'rimshot', -12, 0, 'HA HA! (young Lou grins sheepishly)');
// ---- 11. that night: "I met your grandma."
add(C.night, 'cricket', -10, 0, 'night: the same bench, the same lamp');
add(B.met - 0.8, 'step_soft', -12, -0.6, 'footsteps: a girl walks in');
add(B.met - 0.45, 'step_soft', -12, -0.5, 'footsteps');
add(B.met + 0.05, 'cloth', -10, -0.3, 'she sits down');
add(B.met + 0.1, 'paper', -14, -0.3, 'cotton candy');
add(B.grandma + 0.15, 'heart_pop', -4, 0, 'a heart pops');
// ---- 12. match cut: "Best loss of my whole life."
add(C.match, 'harp_up', -8, 0, 'dissolve: 1979 -> today');
// ---- 13-14. "Numbers tell you how strong somebody is. They don't tell you who they are."
add(C.numbers, 'swish', -14, 0.3, 'cut: Grandpa close');
add(B.strong, 'ui_pop', -12, 0.4, 'STR 79 flickers');
add(B.who - 0.2, 'cloth', -12, 0.3, 'hand on his heart');
add(B.who + 0.05, 'magic', -10, 0.3, 'the plate dissolves');
// ---- 15-16. "I think I stopped seeing people... I only saw numbers."
add(C.onlySaw, 'whoosh_up', -12, 0, 'tilt up: the sky full of numbers');
add(B.saw, 'glitch', -12, 0, 'numbers jitter');
// ---- 17-18. "What's that little X up in the corner?" / "...An X?"
add(B.hey + 0.3, 'cloth', -10, 0.4, 'Grandpa points at the corner');
add(B.X - 0.15, 'shine', -2, 0.9, 'the X lights up');
add(B.X + 0.25, 'notify', -8, 0.9, 'CLOSE HUD? chip');
add(C.anX, 'zoom_in', -6, 0.5, 'macro: the X');
// ---- 19. "It was on page one. Of four thousand, eight hundred and twelve."
add(C.page - 0.05, 'rewind', -8, 0, 'back to that night: the terms window');
add(C.page + 0.1, 'tv_on', -12, 0, 'the window');
add(B.pageOne - 0.1, 'swish', -8, -0.2, 'highlighter on line 1.2');
add(B.of - 0.15, 'whoosh', -12, 0.3, 'to the page counter');
add(B.twelve - 0.25, 'paper', -10, 0.4, 'a red ring around 4,812');
// ---- 20. the press; "Reality HUD... off." -> the glass shatter
add(C.press + 0.1, 'cloth', -8, 0.3, 'he reaches up to the corner');
add(B.press, 'click', 0, 0.9, 'presses the X');
add(B.press + 0.03, 'toggle', -6, 0.9, 'the X turns red');
add(B.press + 0.12, 'ui_pop', -10, 0, 'REALITY HUD... OFF');
add(B.press + 0.4, 'powerdown', -6, 0, 'the HUD powers down');
add(B.shatter, 'glass', 2, 0.6, 'the whole HUD shatters like glass');
add(B.shatter + 0.02, 'explosion_small', -8, 0.6, 'crack');
add(B.shatter + 0.5, 'shine', -10, -0.2, 'glints as the shards fall');
// ---- 21-22. true silence (the world comes back in SC 10)
add(C.clean + 0.25, 'blink', -12, -0.2, 'he blinks');
sfx.sort((a, b) => a[0] - b[0]);

// ================================================================= music (tiles [T0, END])
const M = [];
const seg_ = (a, b, mood, energy, inn, out) => { if (b - a > 0.05) M.push({ start: r3(a), end: r3(b), mood, energy, in: inn, out }); };
seg_(T0, C.fb1, 'tender', 0.3, 'swell', 'cut');                       // "Breathe, kid." ... "I lost."
seg_(C.fb1, C.youLost, 'carnival', 0.4, 'cut', 'scratch');            // 1979: the FINAL in front of everybody
seg_(C.youLost, C.arm, 'silence', 0, 'cut', 'cut');                   // "You... LOST?"
seg_(C.arm, C.night, 'carnival', 0.5, 'cut', 'sting');                // the slam, the town laughs
seg_(C.night, C.numbers, 'romance', 0.35, 'fade', 'cut');             // that night: grandma; best loss of my life
seg_(C.numbers, C.x, 'tender', 0.35, 'cut', 'cut');                   // numbers don't tell you who they are
seg_(C.x, C.page, 'mystery', 0.3, 'cut', 'cut');                      // the little X
seg_(C.page, C.press, 'install', 0.3, 'cut', 'cut');                  // the terms window: page one of 4,812
seg_(C.press, B.shatter, 'wonder', 0.4, 'swell', 'cut');              // he reaches up and presses
seg_(B.shatter, END, 'silence', 0, 'cut', 'cut');                     // the shatter -> TRUE silence

// ================================================================= ambience + footsteps
const amb = [];
const bed = (a, b, name, g) => { if (b - a > 0.05) amb.push({ start: r3(a), end: r3(b), name, gain_db: g }); };
bed(T0, C.fb1, 'crowd', -18);
bed(T0, C.bench, 'static', -24);
bed(C.fb1, C.youLost, 'crowd', -14);
bed(C.youLost, C.arm, 'crowd', -18);
bed(C.arm, C.night, 'crowd', -12);
bed(C.night, C.match, 'night', -14);
bed(C.match, C.page, 'crowd', -18);
bed(C.press, B.shatter, 'crowd', -20);
const steps = [];
const run = (s0, s1, interval, surface, g, pan) => { if (s1 - s0 > 0.1) steps.push({ start: r3(s0), end: r3(s1), interval: r3(interval), surface, gain_db: g, pan }); };
run(C.bench, B.sit - 0.35, Math.PI / 8, 'soft', -12, -0.4);           // the hero walks to the bench (walk t*8)

const out = { scene: 'SC 09', start: r3(T0), end: r3(END), music: M, ambience: amb, footsteps: steps, sfx };
fs.writeFileSync(path.join(__dirname, 'sc09.json'), JSON.stringify(out, null, 1));
console.log(`sc09.json: ${sfx.length} sfx, ${M.length} music segments, ${amb.length} beds, ${steps.length} footstep runs`);
