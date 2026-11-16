#!/usr/bin/env node
// Sound cue sheet generator for SC 12 (АУТРО: "what would you type first?", ";fly all" by Pancake, the end card).
// Every time below is computed from the voice timeline exactly like scenes/s12.js does (L(id).a / .b, .word()),
// so when the real voice replaces the provisional timeline, re-run:
//   node audio/cues/gen_sc12.js && python3 audio/validate_cues.py audio/cues/sc12.json
// Output: audio/cues/sc12.json (absolute video seconds). SC 12 is the end of the video: the music fades out exactly at END.
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { L } = V;

// ---------------------------------------------------------------- timing (copied from scenes/s12.js)
const START = V.scene('SC 12').start, END = V.DURATION;      // == main.js RANGES for SC 12 (the end of the video)
const l0 = L('12.0'), l1 = L('12.1'), l2 = L('12.2');

const tYou = l0.word('YOU').t0, tHad = l0.word('had').t0, tWhat = l0.word('what').t0;
const tTell = l0.word('Tell').t0, tComments = l0.word('comments').t0;
const tAnd = l1.a, tWith = l1.word('with').t0, tComes = l1.word('comes').t0, tCat = l1.word('cat').t0;
const tPancake = l2.a, tPut = l2.word('Put').t0, tLaptop = l2.word('laptop').t0, tDown = l2.word('DOWN').t0;
const tCard = Math.min(END - 8, tWith);                  // the end card is fully in by here (right side calm from now on)
const tPull = tAnd - 0.1;                                // camera pulls back to the end-card framing
const tFlop = tComes - 0.15;                             // Pancake flops onto the laptop
const tFloat = tComes + 0.55;                            // ...and everything starts floating
const tLift = tCat - 0.1;                                // the hero's feet leave the floor
const HX = 420, LAPX = 760;                              // the hero, the laptop on the desk
const CAMX = 860, CAMZ = 1.06;                           // CAM_CARD = at(860, 560, 1.06)

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));          // pan from screen x
const PW = (wx, cx, z) => P(960 + z * (wx - cx));                        // world x seen by a cam at(cx, _, z)
const sfx = [];
const add = (t, name, g, pan, note) => sfx.push([r3(t), name, g, pan, note]);
// keyboard bursts (~1 s each) while letters appear
function typing(t0, t1, g, pan, note) {
  for (let t = t0, k = 0; t < t1 - 0.5 || k === 0; t += 0.9, k++) add(t, 'typing', k ? g - 2 : g, pan, k ? note + ' (cont.)' : note);
}

// ================================================================= SFX
// ---- "So... if YOU had admin commands..." — points at you, push-in, 'YOU?!'
{
  const ph = PW(HX, 700, 1.6);
  add(tYou - 0.1, 'swish', -8, ph, 'the hero points at you');
  add(tYou - 0.06, 'zoom_in', -3, ph, 'quick push-in');
  add(tYou, 'orch_hit', -1, P(1560), "'YOU?!' bang (small shake)");
}
// ---- "...what would you type first?" — a giant chat bar cycles through ideas
add(tHad - 0.15, 'chat_pop', -4, P(1300), 'the big empty chat bar pops');
typing(tWhat - 0.1, tTell - 0.1, -9, P(1300), "ideas typed and deleted: ';fly me', ';size pizza 100', ';tp me to the moon', ';skip homework'");
// ---- "Tell us in the comments!" — the comment box + bouncing down arrow
add(tTell - 0.1, 'ui_pop', -3, P(1310), 'the chat bar turns into a comment box');
add(tTell + 0.05, 'notify', -8, P(1310), 'comment ding');
add(tTell + 0.11, 'boing', -9, P(1310), 'the down arrow bounces in');
typing(tComments, tComments + 14 / 22, -10, P(1200), "'I would type ;' typed into the box");
add(tPull - 0.1, 'ui_close', -6, P(1310), 'the comment box closes');
// ---- the end card slides in on the right (+ the camera pulls back); two video frames + the subscribe circle pop
{
  const k2t = (k) => tCard - 1.2 + 1.2 * k;
  add(tCard - 1.2, 'whoosh_long', -5, 0.5, 'the end-card panel slides in, camera pulls back');
  add(k2t(0.15) + 0.02, 'pop', -6, P(1540), "'WATCH NEXT' frame pops");
  add(k2t(0.3) + 0.02, 'pop', -7, P(1540), "'MORE VIDEOS' frame pops");
  add(k2t(0.45) + 0.02, 'pop', -5, P(1080), "'SUBSCRIBE' circle pops");
  add(k2t(0.45) + 0.06, 'bell', -8, P(1080), 'subscribe bell');
}
// ---- "And remember: with great commands..." — wise finger up
add(tPull + 0.2, 'shine', -10, PW(HX, CAMX, CAMZ), 'wise finger up');
// ---- "...comes great..." — Pancake (crown) flops onto the laptop: ';fly all' — Command accepted
{
  const pl = PW(LAPX, CAMX, CAMZ);
  add(tFlop, 'jump', -7, PW(LAPX + 120, CAMX, CAMZ), 'Pancake pounces');
  add(tFlop + 0.33, 'body_fall', -4, pl, "'flomp' onto the laptop keyboard");
  add(tFlop + 0.25, 'typing', -5, pl, "cat on the keys: 'kkkkkkkk' ;fly all");
  add(tFlop + 0.5, 'click', -4, pl, 'ENTER (paw): ;fly all');
  add(tFlop + 0.53, 'confirm', -3, P(560), "'Command accepted'");
  add(tFloat - 0.2, 'whoosh_up', 0, pl, ';fly all: the laptop, Pancake and the junk start floating up');
  add(tFloat, 'magic', -9, PW(500, CAMX, CAMZ), 'floating shimmer (left half of the room)');
  add(tLift, 'slide_up', -3, PW(HX, CAMX, CAMZ), "'...cat problems.' the hero's feet leave the floor");
}
// ---- "Pancake! Put. The laptop. DOWN!" — turns around, points, jabs; DOWN! comic hit
{
  const ph = PW(HX, CAMX, CAMZ);
  add(tPancake - 0.1, 'swish', -9, ph, 'the hero spins around (still floating)');
  add(tPancake, 'pop', -3, P(430), "'PANCAKE!' bang");
  add(tPut - 0.05, 'swish', -9, ph, "jab: 'Put.'");
  add(tPut + 0.02, 'blink', -6, PW(LAPX, CAMX, CAMZ), 'Pancake blinks, unimpressed');
  add(tLaptop - 0.05, 'swish', -9, ph, "jab: 'The laptop.'");
  add(tDown - 0.05, 'swish', -6, ph, "big jab: 'DOWN!'");
  add(tDown, 'boom', 3, P(770), "'DOWN!' comic hit + big shake");
  add(l2.b + 0.5, 'cricket', -11, ph, 'deadpan float: awkward cricket as the music fades');
}

sfx.sort((p, q) => p[0] - q[0]);

// ================================================================= MUSIC (tiles [START, END]) — the outro all the way, fading out at the very end
const music = [
  { start: r3(START), end: r3(END), mood: 'outro', energy: 0.6, in: 'cut', out: 'fade' },
];

// ================================================================= AMBIENCE (the hero's room, a bright normal morning)
const ambience = [
  { start: r3(START), end: r3(END), name: 'room', gain_db: -14 },
  { start: r3(START), end: r3(END), name: 'birds', gain_db: -20 },
];
const footsteps = [];

// ================================================================= sanity: the beats must match the scene module's own
try {
  const sb = require('../../scenes/s12').beats;
  const mine = { tCard, tPull, tFlop, tFloat, tLift, START, END };
  for (const k of Object.keys(mine)) if (Math.abs(sb[k] - mine[k]) > 1e-6) console.warn(`WARN beat ${k}: scene ${sb[k]} != generator ${mine[k]} (re-copy the timing block from scenes/s12.js)`);
} catch (e) { console.warn('(could not cross-check against scenes/s12.js: ' + e.message + ')'); }

// ================================================================= write
const out = { scene: 'SC 12', start: r3(START), end: r3(END), music, ambience, footsteps, sfx };
const J = (x) => JSON.stringify(x);
const txt = '{\n' +
  `  "scene": ${J(out.scene)},\n  "start": ${out.start},\n  "end": ${out.end},\n` +
  `  "music": [\n${music.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "ambience": [\n${ambience.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "footsteps": [],\n` +
  `  "sfx": [\n${sfx.map((m) => '    ' + J(m)).join(',\n')}\n  ]\n}\n`;
const dst = path.join(__dirname, 'sc12.json');
fs.writeFileSync(dst, txt);
console.log(`${dst}: ${music.length} music segments, ${ambience.length} beds, ${footsteps.length} footstep runs, ${sfx.length} sfx`);
