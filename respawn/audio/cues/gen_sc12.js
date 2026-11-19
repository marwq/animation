#!/usr/bin/env node
// Sound cue sheet generator for SC 12 (FINAL GAG + OUTRO + END SCREEN).
// Times come from the voice timeline exactly like scenes/s12.js (the module derives CUT/beats from L(id)/.word() and exports
// them). Re-run when the voice changes:
//   node audio/cues/gen_sc12.js && python3 audio/validate_cues.py audio/cues/sc12.json
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const S12 = require('../../scenes/s12');
const { L } = V;
const { CUT, beats: B } = S12;

const A = Array.from({ length: 3 }, (_, i) => L('12.' + i));
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const RANGE = require('../../scenes/main').RANGES.find((r) => r.id === 'SC 12');
const START = RANGE.a, END = RANGE.b;

const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= START - 0.5 && t < END) sfx.push([r3(Math.max(START, t)), name, g, pan, note]); };

// ================================================================= SFX
// ---- 1. night room, the whisper
add(START + 0.2, 'snore', -14, P(260), 'the hero sleeps');
add(B.tSaved - 0.02, 'chime', -10, P(1058), 'tiny flag pulses green in the bowl');
add(B.tSaved + 0.05, 'notify', -14, P(250), 'Checkpoint saved (small toast)');
add(B.tSaved + 1.4, 'snore', -15, P(260), 'snore');
// ---- 2. Gary
add(CUT.bowl + 0.2, 'bubbles', -10, 0, 'the bowl, close');
add(w(1, 'thing.'), 'blink', -6, 0, "Gary's slow blink");
add(CUT.turn + 0.2, 'swish', -12, 0, 'Gary slowly turns to camera');
add(B.tTurn1 - 0.3, 'riser', -8, 0, 'tension');
add(B.tGlow - 0.02, 'magic', -2, 0, "Gary's eyes glow green");
add(B.tGlow, 'dramatic', -2, 0, 'sting');
add(B.tGlow + 0.1, 'heart_pop', -8, P(1700), 'GARY · LIVES: ∞');
// ---- 3. the outro
add(CUT.outro - 0.02, 'whoosh_up', -4, 0, 'bright outro stage');
add(CUT.outro + 0.15, 'ui_pop', -8, -0.4, 'respawn cards swing in');
add(CUT.outro + 0.25, 'ui_pop', -9, 0.4, 'cards');
add(CUT.outro + 0.4, 'swish', -10, P(1100), 'he waves');
add(B.tYou - 0.12, 'zoom_in', -2, 0, 'smash zoom: what would YOU redo?');
add(B.tYou - 0.05, 'orch_hit', -2, 0, 'YOU');
for (let i = 0; i < 4; i++) {
  const step = Math.max(0.42, (CUT.one - CUT.tell - 0.2) / 4);
  add(CUT.tell + 0.15 + i * step, 'chat_pop', -6, P(1360), `comment bubble ${i + 1}`);
  add(CUT.tell + 0.4 + i * step, 'heart_pop', -12, P(1690), 'likes tick up');
}
add(CUT.one, 'whoosh', -6, -0.3, 'cut');
add(B.tOne, 'heart_pop', -2, 0, 'LIVES: 1');
add(B.tMake + 0.1, 'jump', -4, 0, 'he jumps');
add(B.tCount + 0.1, 'confetti', -2, 0, 'block confetti');
add(B.tCount + 0.12, 'tada', -4, 0, 'make it count');
add(B.tCount + 0.35, 'land', -6, 0, 'lands on the pad');
// ---- 4. the end screen
add(CUT.end, 'shine', -6, 0, 'end screen');
add(CUT.end + 0.25, 'pop', -8, P(290), 'subscribe circle');
add(CUT.end + 0.4, 'ui_pop', -8, P(1500), 'video slot 1');
add(CUT.end + 0.55, 'ui_pop', -8, P(1500), 'video slot 2');
for (let k = 0; CUT.end + 0.1 + k * 3.4 < END - 0.5; k++) add(CUT.end + 0.15 + k * 3.4, 'swish', -14, P(560), 'the hero waves');
add(CUT.end + 0.5, 'paper', -14, P(820), 'Ivy writes in the Book of Fails');
{
  const tg = CUT.end + 4.2;
  add(tg, 'pop', -6, P(170), 'Gary crumbles into orange cubes');
  add(tg + 0.04, 'stone', -10, P(170), 'tiny fish blocks');
  add(tg + 0.2, 'countdown_tick', -10, P(170), 'mini RESPAWNING 3');
  add(tg + 0.5, 'countdown_tick', -10, P(170), '2');
  add(tg + 0.8, 'countdown_final', -9, P(170), '1');
  add(tg + 1.1, 'respawn', -4, P(170), 'Gary respawns on his tiny flag');
  add(tg + 1.15, 'sparkle', -10, P(170), 'GARY: ATTEMPT 1');
}
add(END - 0.5, 'whoosh_long', -14, 0, 'fade out');

// ================================================================= music / ambience
const music = [
  { start: START, end: CUT.turn, mood: 'mystic', energy: 0.25, in: 'fade', out: 'cut' },
  { start: CUT.turn, end: CUT.outro, mood: 'mystery', energy: 0.4, in: 'cut', out: 'sting' },
  { start: CUT.outro, end: END, mood: 'outro', energy: 0.7, in: 'cut', out: 'fade' },
].map((s) => ({ ...s, start: r3(s.start), end: r3(s.end) }));
const ambience = [
  { start: START, end: CUT.outro, name: 'night', gain_db: -14 },
].map((s) => ({ ...s, start: r3(s.start), end: r3(s.end) }));

sfx.sort((a, b) => a[0] - b[0]);
const out = { scene: 'SC 12', start: r3(START), end: r3(END), music, ambience, footsteps: [], sfx };
fs.writeFileSync(path.join(__dirname, 'sc12.json'), JSON.stringify(out, null, 1));
console.log(`sc12.json: ${sfx.length} sfx, ${music.length} music segments, ${(END - START).toFixed(1)} s`);
