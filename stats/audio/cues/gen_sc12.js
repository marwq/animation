#!/usr/bin/env node
// Sound cue sheet generator for SC 12 · FINALE + OUTRO — Max's claw taps PET STATS (toggle), "Pet stats enabled." (the pink
// HUD, the scan sweep, lock-on), Biscuit LV counting to 1000, GOOD BOY ∞ (the very-good-boy face: choir + sparkles), Max
// gasps, Grandpa's glasses drop ("Level one thousand?"), "NOTHING!", Biscuit snoring (NAPS TODAY: 14 stamp), Max's hug + "He's
// a GOOD BOY!", "I KNEW it!" (jump, confetti, hearts), the tablet viewfinder on the hero (???), the slow reveal (glitch bits
// for "No level. No numbers.", reverse swell + harp into BIG BROTHER on "two words"), the side hug, Mom in the doorway, the
// outro line-up (plates pop on the narrator's words, the rolls), YOUR STAT: ???, the comment box (typing, bubbles), the end
// screen (slots, SUBSCRIBE click, bell, LEVEL UP), the fade.
// Every time comes from the voice timeline exactly like scenes/s12.js: the cut list (CUT) and the beats (BEATS) are imported
// from the scene module itself (built only from L(id).a/.b and .word()). When the voice changes:
//   node audio/cues/gen_sc12.js && python3 audio/validate_cues.py audio/cues/sc12.json
// Output: audio/cues/sc12.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { CUT: C, BEATS: B } = require('../../scenes/s12');
const { L } = V;

const l = (i) => L('12.' + i);
const w = (i, word, n = 0) => l(i).word(word, n).t0;
const T0 = V.scene('SC 12').start, END = V.DURATION;              // == main.js RANGES for SC 12

const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(Math.max(T0, t)), name, g, r3(pan), note]); };

// ================================================================= SFX, shot by shot (same order as scenes/s12.js)
// ---- 1. the claw pokes PET STATS
add(T0 + 0.02, 'whoosh', -12, 0.5, "Max's dino claw comes in");
add(B.poke, 'tap', 0, 0.3, 'tap! on the tablet');
add(B.poke + 0.03, 'toggle', -2, 0.3, 'PET STATS → ON');
// ---- 2. "Pet stats enabled." — the pink HUD, the scan
add(B.sys, 'ui_pop', -4, -0.2, 'SYSTEM pop-up');
add(B.sys + 0.15, 'chime', -8, -0.2, 'pet mode chime');
add(C.room, 'glitch', -10, 0, 'the HUD switches to PET STATS (pink)');
add(B.scan, 'laser_sweep', -10, -0.3, 'the pink scan sweeps the room');
add(B.lock, 'beep', -4, P(1180), 'lock-on: Biscuit');
// ---- 3. "Biscuit. Level one thousand."
add(B.name - 0.15, 'ui_pop', -2, 0, "Biscuit's plate pops");
add(B.lv0, 'money_counter', -6, 0, 'LV counts 1 → 1000');
add(B.lv0 + 0.85, 'money_counter', -6, 0, '');
add(B.lv1 - 0.05, 'coin', -6, 0, 'LV 1000');
add(B.lv1, 'dog_bark', -10, 0, 'proud little "arf"');
// ---- 4. "Good boy: infinite."
add(C.good, 'zoom_in', -4, 0, 'smash-zoom on Biscuit');
add(B.good, 'money_counter', -10, 0, 'GOOD BOY bar fills');
add(B.inf - 0.1, 'angel', -2, 0, 'GOOD BOY: ∞ — the very-good-boy face');
add(B.inf, 'sparkle', -4, 0, 'rays + sparkles');
add(B.inf + 0.05, 'shine', -6, 0, '');
// ---- 5. Max gasps
add(C.gasp + 0.05, 'blush', -8, 0, 'Max: star eyes, hands on cheeks');
add(C.gasp + 0.15, 'heart_pop', -8, 0.2, '∞ pops');
// ---- 6. "Level one thousand?" — the glasses drop
add(C.grandpa + 0.1, 'paper', -14, P(1560), 'Grandpa takes the tablet');
add(B.glasses, 'boing', -6, P(1560), 'glasses drop onto his nose');
add(B.glasses + 0.05, 'ui_pop', -10, P(1660), '!?');
// ---- 7. "That dog has never done anything!"
add(C.never, 'swish', -6, -0.2, 'he points across the room');
add(w(2, 'never') - 0.05, 'stamp', -6, -0.3, 'NOTHING!');
// ---- 8. Biscuit asleep
add(C.nap + 0.05, 'snore', -6, 0, 'Biscuit snores');
add(B.naps, 'stamp', -4, 0, 'NAPS TODAY: 14');
// ---- 9. "He's a GOOD BOY, Grandpa!"
add(C.defend + 0.05, 'cloth', -8, 0, 'Max hugs Biscuit');
add(B.goodBoy, 'heart_pop', -6, 0.1, 'Biscuit: heart eyes');
add(B.goodBoy + 0.4, 'dog_bark', -12, 0.1, 'happy arf');
// ---- 10. "I KNEW it!"
add(B.knew - 0.15, 'jump', -6, 0, 'Max jumps, fists up');
add(B.knew, 'confetti', -2, 0, 'confetti');
add(B.knew + 0.05, 'heart_pop', -4, 0.1, 'GOOD BOY CONFIRMED');
add(B.knew + 0.45, 'land', -8, 0, 'lands');
add(B.knew + 0.6, 'dog_bark', -10, 0.2, 'Biscuit begs');
// ---- 11. "What does yours say?" — the tablet viewfinder
add(C.point + 0.05, 'whoosh', -8, 0.3, 'Max raises the tablet');
add(C.point + 0.4, 'beep', -10, 0.3, 'viewfinder: ???');
add(C.point + 0.45, 'glitch', -14, 0.3, '');
// ---- 12–13. "For the first time, your stats loaded. No level. No numbers. Just two words."
add(B.loaded, 'loading', -10, 0, 'the ??? begins to stir');
add(B.noLevel, 'glitch', -14, 0, '"No level." — LV ?? crumbles');
add(B.noNum, 'glitch', -14, 0, '"No numbers." — digits float away');
add(B.two - 0.1 - 1.5, 'reverse_swell', -8, 0, 'swell into the flash');
add(B.two - 0.3, 'harp_up', -6, 0, 'the glass warms');
add(B.two, 'magic', -4, 0, 'BIG BROTHER appears letter by letter');
add(B.words1, 'chime', -6, 0, 'the heart badge beats');
// ---- 14. "Big brother."
add(C.bigbro + 0.3, 'sparkle', -12, 0, 'warm motes');
// ---- 15. "That's a good stat." — the side hug, Mom in the doorway
add(C.goodstat + 0.1, 'cloth', -10, 0.1, 'side hug');
add(C.goodstat + 0.45, 'heart_pop', -10, 0.1, '');
add(B.pull + 0.5, 'dog_bark', -16, 0.1, 'Biscuit wags');
// ---- 16. the outro line-up
add(C.outro - 0.05, 'whoosh_long', -4, 0, 'into the end card');
B.pops.forEach((tp, i) => add(tp - 0.1, 'ui_pop', -4, r3(-0.6 + i * 0.2), ['TANK HP 100/100', 'BENJI BEST FRIEND', 'MOM ENERGY 100%', 'BIG BROTHER', 'MAX CHAOS 9999', 'BISCUIT GOOD BOY ∞', 'GRANDPA LOU'][i]));
add(B.pops[0] + 0.15, 'money_counter', -12, -0.6, "Tank's HP rolls 3 → 100");
add(B.pops[2] + 0.15, 'money_counter', -12, -0.2, "Mom's ENERGY rolls 2 → 100");
add(B.head, 'boing', -10, 0, 'all the plates hop');
// ---- 17. "...what would it be?"
add(C.yourstat, 'stamp', -2, 0, 'YOUR STAT: ???');
add(C.yourstat + 0.1, 'sparkle', -10, 0, '? marks orbit');
// ---- 18. "Tell me in the comments!"
add(C.comments, 'ui_pop', -4, 0, 'the comment box slides up');
add(C.comments + 0.3, 'typing', -8, 0, "I'd want to see...");
add(C.comments + 1.25, 'click', -4, 0.4, 'COMMENT');
for (let i = 0; i < 5; i++) add(C.comments + 0.4 + i * 0.18, 'chat_pop', -8, r3(-0.5 + i * 0.25), 'idea bubbles float up');
// ---- 19. the end screen
add(C.end, 'whoosh', -6, 0, 'end screen');
add(C.end + 0.05, 'ui_pop', -6, -0.5, 'NEXT QUEST slot');
add(C.end + 0.2, 'ui_pop', -6, -0.5, 'BONUS LEVEL slot');
add(C.end + 0.35, 'ui_pop', -6, 0.5, 'subscribe circle');
add(C.end + 0.5, 'pop', -6, 0.5, 'SUBSCRIBE +100 XP');
add(B.click, 'click', 0, 0.5, 'the cursor clicks SUBSCRIBE');
add(B.click + 0.05, 'bell', -4, 0.7, 'the bell rings');
add(B.click + 0.1, 'sparkle', -6, 0.5, '');
add(B.click + 0.15, 'level_up', -2, 0.5, 'XP bar full → LEVEL UP!');
add(B.click + 0.3, 'achievement', -6, 0.5, '');

// ================================================================= MUSIC (tiles [T0, END])
const music = [
  { start: T0, end: C.good, mood: 'homey', energy: 0.5, in: 'fade', out: 'cut' },            // pet stats on, Biscuit LV 1000
  { start: C.good, end: C.gasp, mood: 'wonder', energy: 0.6, in: 'cut', out: 'cut' },        // GOOD BOY: ∞
  { start: C.gasp, end: C.point, mood: 'playful', energy: 0.55, in: 'cut', out: 'fade' },    // Grandpa outraged, Max
  { start: C.point, end: C.outro, mood: 'tender', energy: 0.4, in: 'fade', out: 'fade' },    // ??? → BIG BROTHER
  { start: C.outro, end: END, mood: 'levelup', energy: 0.8, in: 'swell', out: 'fade' },      // outro + end screen
].map((s) => ({ ...s, start: r3(s.start), end: r3(s.end) }));

// ================================================================= AMBIENCE
const amb = [];
const bed = (a, b, name, g) => { if (b > a) amb.push({ start: r3(Math.max(a, T0)), end: r3(Math.min(b, END)), name, gain_db: g }); };
bed(T0, C.outro, 'room', -16);          // the living room
bed(T0, C.outro, 'birds', -26);         // daylight through the window

// ================================================================= FOOTSTEPS
const steps = [];
const st = (a, b, iv, surface, g, pan) => { if (b > a) steps.push({ start: r3(Math.max(a, T0)), end: r3(Math.min(b, END)), interval: r3(iv), surface, gain_db: g, pan: r3(pan) }); };
st(B.momIn, B.momIn + 1.6, Math.PI / 6, 'wood', -16, 0.7);       // shGoodstat: Mom's walk(t·6) in from the kitchen

sfx.sort((a, b) => a[0] - b[0]);
const out = { scene: 'SC 12', start: r3(T0), end: r3(END), music, ambience: amb, footsteps: steps, sfx };
const file = path.join(__dirname, 'sc12.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log('wrote', file, '—', sfx.length, 'sfx,', music.length, 'music segments,', amb.length, 'ambience beds,', steps.length, 'footstep runs');
