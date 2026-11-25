#!/usr/bin/env node
// Sound cue sheet generator for SC 11 · AFTER (no HUD — real-world sounds only, until the tablet's toggle at the very end):
// a harp sunrise + birds, the pancake sizzle and the big flip (pan clang, whoosh up, plop on the FOR MOM stack), Mom's
// slippers + yawn, "With my eyes." twinkle, the coffee sip; the science fair: the potato bulb sputters and lights (electric
// buzz + sparkle), dims on "Kind of! A little!", the run round the table, the back slap + giggles, the soft harp under the
// apology, the fist bump (and the bulb flaring); the cafeteria: Tank's heavy steps, the bench pats, the paper bag, the
// ketchup drops SPLAT, the three crack up; the afternoon kitchen: dishes, Grandpa knocks on the glass, the wink glint; the
// living room: the tablet, the swish, and the REALITY HUD toggle -> ON (toggle + tv_on + upgrade) into SC 12.
// Every time comes from the voice timeline exactly like scenes/s11.js: the cut list + beats come from the scene's own
// times(V) (built only from L(id).a/.b and .word()). When the voice changes:
//   node audio/cues/gen_sc11.js && python3 audio/validate_cues.py audio/cues/sc11.json
// Output: audio/cues/sc11.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const S11 = require('../../scenes/s11');
const { L } = V;

const { START: T0, END, C, B } = S11.times(V);                     // == main.js RANGES for SC 11
const l = (i) => L('11.' + i);

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));     // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(t), name, g, r3(pan), note]); };

// ================================================================= SFX, shot by shot (same order as scenes/s11.js)
// ---- 1. sunrise over the house
add(T0, 'harp_up', -6, 0, 'white fade into the morning (from the fair at dusk, SC 10)');
add(T0 + 0.3, 'chime', -14, 0.3, 'a soft morning chime');
// ---- 2. the pancake flip
add(C.stove, 'sizzle', -10, -0.4, 'pancakes sizzling');
add(B.flip - 0.06, 'pan_clang', -10, -0.4, 'the pan jerks up');
add(B.flip, 'whoosh_up', -6, -0.2, 'the pancake flies across the kitchen');
add(B.land, 'splat', -8, P(1400), 'plop! on top of the FOR MOM stack');
add(B.land + 0.05, 'sparkle', -12, P(1400), 'perfect landing');
// ---- 3. Mom shuffles in, yawning; he glances above her head: nothing there
add(C.mom + 0.2, 'sizzle', -18, -0.6, 'stove still going');
add(B.glance, 'blink', -8, P(300), 'he checks above her head — no plate, no numbers');
add(B.yawn, 'cloth', -10, P(1300), 'Mom stretches with a giant yawn');
// ---- 4–5. "Sit down, Mom." / "I can see you're tired."
add(C.sit, 'whoosh', -12, 0.2, 'cut');
add(C.tired + 0.1, 'stone', -22, -0.2, 'the chair scrapes as she sits');
// ---- 6. "With my eyes."
add(C.eyes, 'zoom_in', -6, 0, 'smash-zoom on the hero');
add(B.eyes, 'shine', -2, 0.1, 'twinkle in his eye');
add(B.eyes + 0.05, 'sparkle', -10, 0.1, 'sparkles');
// ---- 7. "...Thank you, sweetheart."
add(C.thanks + 0.3, 'blush', -14, 0, 'happy tears');
add(B.sip, 'gulp', -12, 0, 'a sip of coffee');
// ---- 8. "It works!" the bulb insert
add(C.works, 'whoosh', -8, 0.3, 'cut to the science fair');
add(B.works - 0.28, 'electric', -10, 0, 'the bulb sputters');
add(B.works, 'electric', -4, 0, 'the bulb lights up!');
add(B.works + 0.05, 'sparkle', -8, 0, 'sparks');
// ---- 9. "Kind of! A little!"
add(B.kind, 'powerdown', -14, P(700), 'the glow dims');
add(B.little, 'electric', -16, P(700), 'flicker');
add(C.kindOf + 0.1, 'jump', -12, P(1100), 'Benji bouncing');
// ---- 10. "Best partner ever." the run round the table
add(C.best + 0.05, 'whoosh', -10, -0.2, 'he dashes round the table');
add(B.ever - 0.05, 'slap', -8, P(1000), 'arm round Benji (back slap)');
add(B.ever + 0.1, 'giggle', -6, 0, 'both laugh');
// ---- 11–14. the apology
add(B.friend, 'harp_up', -14, 0, '"best friend" — Benji\'s eyes well up');
add(C.thanksB + 0.2, 'blush', -14, P(900), 'Benji wipes his eye');
// ---- 15. "...right?" — laughter + fist bump, the bulb flares
add(B.right + 0.3, 'giggle', -8, 0, 'they crack up');
add(B.bump, 'punch', -10, 0, 'fist bump');
add(B.bump + 0.02, 'electric', -10, P(400), 'the bulb flares');
add(B.bump + 0.05, 'sparkle', -10, 0, 'sparks');
// ---- 16. "Can I... sit here?" Tank arrives
add(C.tank, 'whoosh', -10, 0.5, 'cut to the cafeteria');
add(C.tank + 0.75, 'cloth', -14, P(1400), 'Tank fidgets with his hands');
// ---- 17. "Always." — pats the bench (pat = |sin(10 (t - C.always))| -> every π/10 s)
for (let k = 0; k < 3; k++) add(C.always + 0.2 + k * Math.PI / 10, 'tap', -10, 0.1, 'pat pat pat on the bench');
// ---- 18. the lunch his dad made
add(C.lunch, 'whoosh', -10, 0.3, 'cut: Tank sits with them');
add(C.lunch + 0.1, 'thud', -14, P(1300), 'Tank sits down heavily');
add(B.bag - 0.1, 'paper', -8, P(1300), 'the paper bag opens');
add(B.made, 'paper', -10, P(1400), 'the sandwich comes out');
add(B.made + 0.05, 'pop', -12, P(1400), 'ta-da (sandwich)');
// ---- 19. "It's... mostly ketchup." — the drops splat (times from the scene's drop physics)
add(C.ketchup, 'whoosh_down', -10, 0, 'insert on the sandwich');
S11.ketchupSplats().forEach((tt, i) => add(tt, 'splat', i === 3 ? -2 : -14, 0.2, i === 3 ? 'the big SPLAT on "ketchup"' : 'ketchup drip'));
// ---- 20. all three crack up
add(C.laugh, 'giggle', -4, 0, 'Benji, the hero and Tank laugh together');
// ---- 21. the afternoon kitchen: drying dishes; Grandpa knocks on the window
add(C.window, 'whoosh', -10, -0.4, 'cut home');
add(C.window + 0.05, 'dishes', -12, -0.4, 'Mom washes, the hero dries');
add(B.tap - 0.05, 'door_knock', -6, P(450), 'Grandpa taps on the glass');
// ---- 22. the wink
add(B.wink, 'shine', -4, 0, 'the wink');
add(B.wink + 0.05, 'sparkle', -12, 0, 'twinkle');
// ---- 23. the tablet
add(C.tablet, 'whoosh', -12, 0.2, 'cut to the living room');
add(B.pick, 'cloth', -12, 0.1, 'he picks the tablet up');
add(B.pick + 0.3, 'swish', -10, 0.1, 'tablet up');
// ---- 24. the insert: OFF -> ON
add(C.insert, 'zoom_in', -8, 0, 'insert on the screen');
add(C.insert + 0.4, 'squeak', -16, 0.6, 'Max climbs up to look');
add(B.reach - 0.4, 'swish', -12, -0.4, 'his thumb reaches in');
add(B.reach - 0.3, 'swish', -12, 0.5, "Max's dino claw reaches in");
add(B.on - 0.03, 'toggle', 0, 0, 'REALITY HUD: ON');
add(B.on, 'tv_on', -6, 0, 'the screen lights up');
add(B.on + 0.05, 'upgrade', -6, 0, 'cyan glow -> SC 12 (pet stats)');

// ================================================================= MUSIC (tiles [T0, END])
const music = [
  { start: T0, end: C.thanks, mood: 'homey', energy: 0.45, in: 'swell', out: 'cut' },                  // breakfast for Mom, no stats
  { start: C.thanks, end: C.works, mood: 'tender', energy: 0.3, in: 'cut', out: 'cut' },               // "...Thank you, sweetheart."
  { start: C.works, end: C.sorry, mood: 'playful', energy: 0.6, in: 'cut', out: 'cut' },               // "It works! Kind of!" — best partner
  { start: C.sorry, end: B.right, mood: 'tender', energy: 0.32, in: 'cut', out: 'cut' },               // the apology
  { start: B.right, end: C.tank, mood: 'playful', energy: 0.5, in: 'cut', out: 'sting' },              // "...right?" laughter, fist bump
  { start: C.tank, end: C.window, mood: 'homey', energy: 0.45, in: 'cut', out: 'cut' },                // Tank sits with them, ketchup
  { start: C.window, end: C.tablet, mood: 'tender', energy: 0.35, in: 'fade', out: 'fade' },           // Grandpa: "Best things in life..."
  { start: C.tablet, end: B.on, mood: 'wonder', energy: 0.35, in: 'fade', out: 'cut' },                // "one last time... just to check"
  { start: B.on, end: END, mood: 'levelup', energy: 0.55, in: 'cut', out: 'cut' },                     // the HUD theme is back (SC 12)
].map((s) => ({ ...s, start: r3(s.start), end: r3(s.end) }));

// ================================================================= AMBIENCE
const amb = [];
const bed = (a, b, name, g) => { if (b > a) amb.push({ start: r3(Math.max(a, T0)), end: r3(Math.min(b, END)), name, gain_db: g }); };
bed(T0, C.works, 'birds', -16);                     // the morning outside
bed(C.stove, C.works, 'kitchen', -16);
bed(C.works, C.tank, 'crowd', -20);                 // the science fair in the gym
bed(C.tank, C.window, 'crowd', -14);                // the cafeteria
bed(C.window, C.tablet, 'kitchen', -16);
bed(C.window, END, 'birds', -22);
bed(C.tablet, END, 'room', -18);

// ================================================================= FOOTSTEPS (cycles from the scene code: steps every π/K s)
const steps = [];
const st = (a, b, iv, surface, g, pan) => { if (b > a) steps.push({ start: r3(Math.max(a, T0)), end: r3(Math.min(b, END)), interval: r3(iv), surface, gain_db: g, pan: r3(pan) }); };
st(C.mom, C.mom + 1.1, Math.PI / 7, 'soft', -16, 0.5);              // momWalk(): AC.walk((t - C.mom) * 7), slippers
st(C.sit + 0.1, C.tired - 0.1, Math.PI / 8, 'soft', -18, 0.2);      // shotSit: walkFront((t - C.sit) * 8)
st(C.best + 0.05, B.ever - 0.12, Math.PI / 15, 'wood', -10, 0);     // shotBest: AC.run((t - C.best) * 15), gym floor
st(C.tank, C.tank + 0.7, Math.PI / 7, 'hard', -6, 0.5);             // shotTank: Tank's heavy walk((t - C.tank) * 7)

const out = { scene: 'SC 11', start: r3(T0), end: r3(END), music, ambience: amb, footsteps: steps, sfx: sfx.sort((a, b) => a[0] - b[0]) };
const file = path.join(__dirname, 'sc11.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
console.log(`wrote ${file}: ${music.length} music, ${amb.length} ambience, ${steps.length} footsteps, ${sfx.length} sfx`);
