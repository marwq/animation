#!/usr/bin/env node
// Sound cue sheet generator for SC 09 (DELETE SAVE).
// Times come from the voice timeline exactly like scenes/s09.js (the module derives CUT/beats from L(id)/.word() and exports
// them). Re-run when the voice changes:
//   node audio/cues/gen_sc09.js && python3 audio/validate_cues.py audio/cues/sc09.json
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const S09 = require('../../scenes/s09');
const { L } = V;
const { CUT, beats: B } = S09;

const A = Array.from({ length: 11 }, (_, i) => L('09.' + i));
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const RANGE = require('../../scenes/main').RANGES.find((r) => r.id === 'SC 09');
const START = RANGE.a, END = RANGE.b;

const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= START - 0.5 && t < END) sfx.push([r3(Math.max(START, t)), name, g, pan, note]); };

// ================================================================= SFX
// ---- 1. the frozen town; DELETE SAVE? pops into the sky
add(START + 0.05, 'static', -14, 0, 'frozen world hum');
add(B.tDel - 0.05, 'ui_pop', -2, 0, 'DELETE SAVE? window pops open');
add(B.tDel, 'notify', -6, 0, 'system chime');
add(B.tDel + 0.4, 'glitch', -12, P(1640), 'Tip glitches softly');
// ---- 2. the yard
add(CUT.yard, 'whoosh', -8, 0.2, 'cut to the yard');
add(CUT.yard + 1.0, 'glitch', -14, P(1400), 'Tip flicker');
// ---- 3. the fine print: the respawn icon gets a red X
add(CUT.fine + 0.1, 'zoom_in', -6, 0, 'zoom on the fine print');
add(CUT.fine + 0.12, 'ui_pop', -8, P(1660), 'respawn icon pops');
add(w(0, 'respawns.') - 0.05, 'stamp', 0, P(1660), 'red X slams over the respawn icon');
add(w(0, 'respawns.'), 'buzzer_wrong', -6, P(1660), 'NO MORE RESPAWNS');
// ---- 4. "Ever." / "TONIGHT!"
add(CUT.ever + 0.05, 'gulp', -4, P(900), 'the hero gulps');
add(w(1, 'TONIGHT!') - 0.06, 'zoom_in', -6, 0, 'smash zoom');
add(CUT.poster + 0.08, 'stamp', 1, P(1000), 'TONIGHT! stamped over the poster');
add(CUT.poster + 0.1, 'dramatic', -4, 0, 'dun-dun');
// ---- 5. the nightmare full house
add(CUT.house, 'heartbeat', -4, 0, 'heartbeat: the whole school watching');
add(CUT.house + 0.9, 'heartbeat', -4, 0, 'heartbeat');
add(w(1, 'EVERYONE?!'), 'crowd_gasp', -2, 0, 'the whole house gasps');
add(w(1, 'EVERYONE?!') + 0.05, 'zoom_in', -4, 0, 'dolly zoom');
// ---- 6. Ivy
add(CUT.ivy, 'whoosh', -10, -0.2, 'back to the yard');
add(w(2, 'With') - 0.2, 'cloth', -8, P(1200), "Ivy's hand on his shoulder");
add(CUT.look + 0.2, 'heartbeat', -10, 0, 'silence: he looks up at YES');
// ---- 7. the fails
add(CUT.fails + 0.1, 'whoosh_long', -10, -0.4, 'slow pan across the frozen ghosts');
for (const [t0, word, note] of [[CUT.c56, 'crashes.', '× 56 skate crashes'], [CUT.c31, 'jokes.', '× 31 bad jokes'], [CUT.c1, 'goldfish.', '× 1 very surprised goldfish']]) {
  add(t0, 'whoosh', -4, 0.5, 'a photo card slides in');
  add(t0 + 0.25, 'paper', -8, 0, 'card lands on the stack');
  add(w(3, word) - 0.05, 'stamp', -1, P(1300), note);
}
add(CUT.c56 + 0.5, 'skid', -12, P(800), 'ghost skaters wipe out');
add(CUT.c56 + 1.1, 'skid', -13, P(1100), 'another wipe-out');
add(CUT.c31 + 0.5, 'cricket', -6, P(1500), 'the joke dies: crickets');
add(CUT.c1 + 0.4, 'bubbles', -8, 0, "Gary's bowl");
add(w(3, 'surprised') , 'boing', -6, 0, "Gary's eyes go wide");
add(CUT.face, 'whoosh', -6, 0, 'the cards scatter off his face');
add(CUT.face + 1.2, 'harp_up', -10, 0, 'his face softens');
add(CUT.trying + 0.1, 'magic', -6, 0, 'the ghosts get back up');
add(CUT.trying + 0.3, 'shine', -8, 0, 'golden rims');
// ---- 8. Okay. Delete.
add(CUT.okay + 0.1, 'cloth', -10, P(1000), 'he nods');
add(CUT.press + 0.05, 'whoosh_up', -8, P(600), 'he reaches for YES');
add(B.tPress, 'click', 0, P(640), 'YES pressed');
add(B.tPress + 0.03, 'confirm', -2, P(640), 'confirm');
// ---- 9. BOOM: every ghost pops, colour floods back
add(B.tPress + 0.3, 'reverse_swell', -2, 0, 'the save deletes');
add(B.tPress + 0.32, 'shine', 0, 0, 'white flash');
add(B.tPress + 0.34, 'confetti', -2, 0, 'block confetti bursts');
for (let i = 0; i < 10; i++) add(B.tPress + 0.36 + i * 0.07, 'pop', -8 - (i % 3) * 2, r3(Math.sin(i * 1.7) * 0.7), 'a ghost pops into cubes');
add(B.tPress + 0.4, 'magic', -4, 0, 'colour floods back from the hero');
add(B.tPress + 0.6, 'tada', -4, 0, 'golden hour');
add(B.tPress + 0.42, 'glass', -8, 0, 'the window bursts into blocks');
// ---- 10. Save deleted: the town
add(CUT.townG - 0.12, 'whoosh', -4, 0.3, 'whip to the town');
add(CUT.townG + 0.1, 'wind_gust', -10, 0, 'birds take off');
add(CUT.townG + 0.3, 'engine', -10, P(1600), 'the bus drives off');
add(CUT.townG + 0.6, 'car_horn', -14, P(1700), 'bus horn');
add(A[6].a, 'achievement', -6, P(250), 'Save deleted toast');
// ---- 11. the pancake
add(CUT.pancake + 0.1, 'loading', -10, 0, 'the hanging pancake spinner');
add(B.tPancake - 0.38, 'fall_whistle', -8, 0, 'it finally falls');
add(B.tPancake, 'splat', 0, 0, 'PLOP! on the pan');
add(B.tPancake + 0.02, 'pan_clang', -4, 0, 'pan clang');
add(B.tPancake + 0.05, 'sizzle', -12, 0, 'sizzle');
add(w(6, 'Respawn...') - 0.05, 'ui_pop', -8, 0, 'RESPAWN: DISABLED pill');
add(w(6, 'disabled.'), 'powerdown', -6, 0, 'disabled');
// ---- 12. Dad unfreezes
add(CUT.dad - 0.12, 'whoosh', -4, -0.3, 'whip to the front yard');
for (let i = 0; i < 6; i++) add(CUT.dad + 0.2 + i * (Math.PI / 4.2), 'boing', -12, P(1500), "Bea's trampoline");
add(w(7, 'Wait.') - 0.05, 'blink', -6, P(1000), 'Dad blinks, looks around');
add(w(7, 'Why') + 0.2, 'cloth', -10, P(1000), 'scratches his head');
// ---- 13. Tip's goodbye
add(CUT.tip, 'whoosh', -10, 0.2, 'back to the golden yard');
add(A[8].a + 0.4, 'sparkle', -10, P(1300), 'the first pixels break off Tip');
add(B.tTipFade0, 'harp_up', -6, P(1300), 'Tip starts to dissolve');
add(B.tTipFade0 + 1.0, 'sparkle', -8, P(1300), 'pixels drift up');
add(B.tTipGone - 0.9, 'magic', -6, P(1300), 'the last spark');
add(B.tTipGone - 0.2, 'chime', -6, P(1300), 'Tip is gone');
add(CUT.thanks + 0.2, 'harp_up', -10, P(1240), 'the spark rises into the sunset');
add(CUT.flag + 0.4, 'thud', -6, P(800), 'the flag falls into the grass');
add(CUT.flag + 0.45, 'powerdown', -8, P(800), 'its glow dies');
// ---- 14. Lives remaining: one
add(CUT.lives, 'heart_pop', -6, 0, 'LIVES: ∞');
add(B.tOne, 'heart_pop', -2, 0, 'LIVES: 1');
add(B.tOne + 0.02, 'tap', -8, 0, 'counter bump');
add(END - 0.35, 'whoosh_long', -14, 0, 'dusk dip into the show');

// ================================================================= music / ambience / footsteps
const music = [
  { start: START, end: CUT.ever, mood: 'sad', energy: 0.3, in: 'fade', out: 'cut' },
  { start: CUT.ever, end: CUT.ivy, mood: 'glitch_build', energy: 0.6, in: 'cut', out: 'cut' },
  { start: CUT.ivy, end: CUT.trying, mood: 'tender', energy: 0.4, in: 'fade', out: 'fade' },
  { start: CUT.trying, end: B.tPress, mood: 'wonder', energy: 0.5, in: 'swell', out: 'cut' },
  { start: B.tPress, end: CUT.dad, mood: 'epic', energy: 0.9, in: 'cut', out: 'fade' },
  { start: CUT.dad, end: CUT.tip, mood: 'playful', energy: 0.45, in: 'fade', out: 'fade' },
  { start: CUT.tip, end: CUT.lives, mood: 'tender', energy: 0.4, in: 'fade', out: 'fade' },
  { start: CUT.lives, end: END, mood: 'warm', energy: 0.5, in: 'swell', out: 'fade' },
].map((s) => ({ ...s, start: r3(s.start), end: r3(s.end) }));
const ambience = [
  { start: START, end: B.tPress, name: 'wind', gain_db: -16 },
  { start: B.tPress + 0.3, end: CUT.pancake, name: 'birds', gain_db: -12 },
  { start: CUT.pancake, end: CUT.dad, name: 'kitchen', gain_db: -16 },
  { start: CUT.dad, end: END, name: 'birds', gain_db: -14 },
  { start: CUT.townG, end: CUT.pancake, name: 'town', gain_db: -16 },
].map((s) => ({ ...s, start: r3(s.start), end: r3(s.end) }));
const footsteps = [
  { start: CUT.walk, end: END, interval: r3(Math.PI / 7), surface: 'hard', gain_db: -12, pan: 0 },
].map((s) => ({ ...s, start: r3(s.start), end: r3(s.end) }));

sfx.sort((a, b) => a[0] - b[0]);
const out = { scene: 'SC 09', start: r3(START), end: r3(END), music, ambience, footsteps, sfx };
fs.writeFileSync(path.join(__dirname, 'sc09.json'), JSON.stringify(out, null, 1));
console.log(`sc09.json: ${sfx.length} sfx, ${music.length} music segments, ${(END - START).toFixed(1)} s`);
