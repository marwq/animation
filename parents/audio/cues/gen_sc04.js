#!/usr/bin/env node
// Sound cue sheet generator for SC 04 · ЛОББИ (the spawn plaza): the pixel-wipe reveal, the family popping in on the spawn
// pads with the three "joined the server" toasts (synced to SYSTEM), the hero's horror, the whole server turning, the three
// smash-zooms (Every. Single. Name.), Dad's CAPS LOCK + every heavy key of "HELLO SON. IT IS DAD. LOVE, DAD." (letters
// follow the voice), the players' lol, Noodle, RULE NUMBER ONE (three hits), Mom's emote wheel + the air kiss + the hearts +
// the crowd's aww, DarkBlade and the clan stomping in, MOMMY, the dead silence (crickets + the cube tumbleweed), the hot dog
// walking into the obby wall (BONK + steps in place), "Spacebar!", SPACE! BAR!, the untouched space bar, ears covered,
// DEAR EVERYONE. WHERE IS THE JUMP BUTTON. (pecked letter by letter) + send, the flood of 50 SPACEBAR replies, the hood,
// the dash to the tree, "I'm a tree", the noob kid, the family strolling over.
// Every time comes from the voice timeline exactly like scenes/s04.js: the cut list (CUT) and the in-shot beats (BEATS)
// are imported from the scene module itself (built only from L(id).a/.b and .word()); the typed letters are read back
// from G.chatSync (the same function the scene types with), the few remaining offsets are re-derived with the scene's
// expressions. When the voice changes:
//   node audio/cues/gen_sc04.js && python3 audio/validate_cues.py audio/cues/sc04.json
// Output: audio/cues/sc04.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const G = require('../../scenes/gameui');
const { CUT: C, BEATS: B } = require('../../scenes/s04');
const { L } = V;

const A = Array.from({ length: 15 }, (_, i) => L('04.' + i));
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;
const T0 = V.scene('SC 04').start, END = V.scene('SC 05').start;    // == main.js RANGES for SC 04

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const lerp = (a, c, k) => a + (c - a) * k;
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));     // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(t), name, g, pan, note]); };
// the moments a voice-synced chat line shows a new (non-space) letter, read back from G.chatSync
function letters(id, a, b) {
  const txt = L(id).text, n = txt.length, out = [];
  let prev = Math.round(G.chatSync(a, id) * n);
  for (let t = a; t < b; t += 1 / 120) {
    const k = Math.round(G.chatSync(t, id) * n);
    for (let i = prev; i < k; i++) if (txt[i] !== ' ') out.push([t, txt[i]]);
    prev = k;
  }
  return out;
}

// ================================================================= SFX, shot by shot (same order as scenes/s04.js)
// ---- 1-3. the spawns: pixel wipe, pad glow, POP, the toast (SYSTEM: "… joined the server.")
add(T0, 'pixel_wipe', -3, 0, 'pixel wipe reveals the spawn plaza');
for (const [tS, who, x] of [[B.dad, 'DadBod1978', 520], [B.mom, 'MOM_OFFICIAL', 690], [B.gran, 'GrannyGoodies', 990]]) {
  add(tS - 0.35, 'forcefield', -10, P(x), `${who}: the spawn pad lights up`);
  add(tS - 0.1, 'notify', -2, 0.6, `"${who} joined the server" toast`);
  add(tS, 'respawn', 0, P(x), `${who} pops in`);
  add(tS + 0.05, 'sparkle', -8, P(x), 'spawn sparkle');
}
add(B.dad + 0.4, 'swish', -10, P(520), 'the hot dog waves');
add(B.dad + 0.6, 'gulp', -8, P(1700), 'the hero, worried');
add(C.spawnMom, 'whoosh', -6, 0.2, 'whip to pad 2');
add(C.spawnGran, 'whoosh', -6, 0.2, 'whip to pad 3');
add(B.gran + 0.05, 'coins', -4, P(1000), 'Granny spawns in a spray of coins');
// ---- 4. the beat: the hero's face
add(C.horror, 'zoom_in', -4, 0, 'smash on the hero: oh no');
add(C.horror + 0.05, 'heartbeat', -6, 0, 'heart thumps');
// ---- 5. "The whole server saw it." — every player slowly turns
add(C.turn, 'whoosh', -8, 0, 'pull out to the wide');
for (let i = 0; i < 6; i++) add(A[1].a + 0.15 + i * 0.22, 'step_soft', -16, lerp(-0.6, 0.6, i / 5), 'players turn around (ripple)');
add(A[1].a + 1.4, 'crowd_gasp', -8, 0, 'the server gasps');
// ---- 6. "Every. Single. Name." — three smash-zooms on the nametags
[[C.names, 'EVERY. (DadBod1978)'], [B.single - 0.06, 'SINGLE. (MOM_OFFICIAL)'], [B.name - 0.06, 'NAME. (GrannyGoodies)']].forEach(([tc, n], i) => {
  add(tc, 'impact', -2 + i, 0, `smash-zoom: ${n}`);
  add(tc + 0.03, 'ui_pop', -6, 0, 'giant nametag pops');
  add(tc + 0.06, 'pop', -8, P(1560), 'word bang');
});
// ---- 7-10. CAPS LOCK + "HELLO SON. IT IS DAD. LOVE, DAD." — one heavy click per letter, with the voice
add(C.caps, 'whoosh', -8, 0, 'cut to the keyboard');
add(B.capsKey - 0.03, 'click', 0, -0.4, 'CAPS LOCK pressed');
add(B.capsKey, 'toggle', -4, -0.4, 'the CAPS LED goes green');
add(B.capsKey + 0.03, 'ui_pop', -8, -0.3, 'CAPS LOCK label');
for (const [t, ch] of letters('04.2', A[2].a - 0.3, A[2].b + 0.3)) add(t, 'click', /[A-Z]/.test(ch) ? -7 : -11, 0, `caps key "${ch}"`);
add(A[2].a - 0.3, 'chat_pop', -4, 0, "the hot dog's CAPS bubble pops");
add(C.hello, 'whoosh', -8, -0.2, 'cut to the plaza');
add(C.itIsDad, 'whoosh', -6, 0.2, 'split: the real Dad pecking | the bubble');
add(C.loveDad, 'whoosh', -8, 0, 'pull back to the plaza');
add(B.lol1 - 0.2, 'kids_laugh', -6, 0, 'the players snicker');
add(B.lol1, 'chat_pop', -6, 0.1, '"lol" bubble');
add(B.lol2, 'chat_pop', -6, 0.5, '"is that ur DAD lmao" bubble');
add(C.loveDad + 0.3, 'slap', -10, 0.2, 'the hero facepalms');
// ---- 11. Noodle: "Bro... is that your DAD?!"
add(C.noodle, 'whoosh', -6, 0.2, 'whip to Noodle');
add(A[3].a - 0.3, 'chat_pop', -4, P(1100), "Noodle's bubble");
add(w(3, 'that') - 0.2, 'swish', -10, P(960), 'Noodle points');
// ---- 12-13. "Rule number one, Dad! RULE NUMBER ONE!" — whisper-panic, then three hits
add(C.whisper, 'whoosh', -8, -0.2, 'cut to the hero at his PC');
B.rule.forEach((t, i) => { add(t - 0.04, 'impact', -3 + 2 * i, [-0.4, 0.4, 0][i], `${['RULE', 'NUMBER', 'ONE!'][i]} — smash zoom`); add(t, 'pop', -8, [-0.4, 0.4, 0][i], 'word bang'); });
// ---- 14-15. "Then Mom found the emote button." — the emote wheel on her tablet, the kiss
add(C.emote, 'whoosh', -6, 0.2, 'whip to Mom');
add(B.found, 'sparkle', -4, P(1300), 'Mom finds something (star eyes)');
add(B.found + 0.02, 'pop', -10, P(1460), '"!"');
add(C.wheel, 'whoosh', -6, 0, 'smash into the tablet');
add(C.wheel + 0.05, 'ui_pop', -4, 0.3, 'the emote wheel opens');
add(B.btn - 0.45, 'whoosh', -12, 0.5, "Mom's finger reaches for the kiss");
add(B.btn - 0.03, 'tap', -2, 0.2, 'taps KISS');
add(B.btn, 'confirm', -6, 0.2, 'kiss selected');
// ---- 16-17. "Mwah! Love you, honey!" — the air kiss, hearts fly at the hero, the crowd's aww
add(C.kiss, 'whoosh', -6, 0.2, 'cut to the plaza');
add(B.mwah, 'heart_pop', 0, P(450), 'MWAH! the big lips slam');
add(B.mwah + 0.1, 'whoosh_up', -10, 0, 'hearts arc towards the hero');
add(B.mwah + 1.05, 'heart_pop', -2, P(1400), "the hearts pop on the hero's face");
add(B.mwah + 1.08, 'blush', -4, P(1400), 'the hero blushes');
add(w(6, 'Love') - 0.3, 'chat_pop', -4, P(520), '"Love you, honey! <3" bubble');
for (let j = 0; j < 5; j++) { const ta = B.aww - 0.5 + j * 0.18; add(ta, 'chat_pop', -11, lerp(-0.5, 0.5, j / 4), `"aww" bubble #${j + 1}`); add(ta + 0.1, 'heart_pop', -14, lerp(-0.5, 0.5, j / 4), 'little hearts'); }
add(B.aww - 0.3, 'crowd_cheer', -14, 0, 'the server goes "awww"');
// ---- 18. DarkBlade + clan stride in: "Ha! The legend brought his MOMMY."
add(C.dark, 'whoosh', -4, -0.3, 'whip: DarkBlade and the clan stride in');
add(C.dark + 0.1, 'cloth', -8, 0.5, 'capes');
add(C.dark + 0.75, 'metal_clank', -6, 0.2, 'they stop, armour clanks');
add(A[7].a - 0.2, 'chat_pop', -4, 0.1, "DarkBlade's bubble");
add(B.ha + 0.1, 'crowd_laugh', -10, 0.4, 'the clan: HA HA');
add(B.mommy - 0.05, 'impact', 0, 0.1, 'MOMMY. — smash-zoom (shake)');
add(B.mommy, 'dramatic', -4, 0, 'dun-dun');
// ---- 19. silence — the whole server stares; the cube tumbleweed; Mom's glasses glint
add(C.silence, 'whoosh', -10, 0, 'pull out');
add(C.silence + 0.1, 'cricket', -4, 0.3, 'crickets');
add(C.silence + 0.2, 'wind_gust', -6, -0.6, 'the cube tumbleweed rolls across');
for (let i = 0; i < 4; i++) { const k = (i + 0.5) / 4; add(lerp(C.silence, C.dadGot, k), 'tap', -14, P(lerp(-900, 2000, k) * 0.86 + 100), 'tumbleweed cube bounce'); }
add(C.dadGot - 0.35, 'shine', -4, P(620), "Mom's glasses glint");
// ---- 20. "Don't worry, son."
add(C.dadGot, 'whoosh', -8, -0.2, 'cut to the real Dad');
add(w(8, 'son'), 'swish', -10, 0, 'Dad rolls up his sleeves');
// ---- 21. "Dad's got this. How do I jump?" — the hot dog marches into the obby wall
add(C.wall, 'whoosh', -4, 0.2, 'whip to the obby');
add(B.bonk, 'bonk', 2, P(1300), 'BONK! into the wall (shake)');
add(B.bonk + 0.05, 'dizzy', -6, P(1300), 'KO stars');
for (let t = B.bonk + 0.7; t < C.spacebar - 0.1; t += 0.7) add(t, 'thud', -16, P(1350), 'keeps walking into the wall');
add(B.how, 'squeak', -8, P(1200), '"?"');
// ---- 22-23. "Spacebar!" / "SPACE! BAR!" — yelled at the laptop
add(C.spacebar, 'whoosh', -8, -0.2, 'cut to the hero');
add(C.spaceBar, 'whoosh', -8, 0.2, 'cut to Dad');
add(B.space, 'impact', -4, -0.3, 'SPACE! (shake)');
add(B.space + 0.02, 'pop', -8, P(520), 'SPACE! bang');
add(B.bar - 0.04, 'impact', 1, 0.3, 'BAR! — smash-zoom (shake)');
add(B.bar, 'boom', -8, 0, 'BAR! boom');
add(A[10].b + 0.15, 'cricket', -10, 0.3, '"..." — nothing happens');
// ---- 24. "He did not press the spacebar." — the untouched space bar, cobwebs
add(C.notPress, 'whoosh', -8, 0, 'cut to the keyboard');
add(C.notPress + 0.1, 'shine', -6, 0, 'spotlight on the untouched space bar');
add(w(11, 'spacebar'), 'ui_pop', -4, 0, 'TIMES PRESSED: 0');
add(w(11, 'spacebar') + 0.1, 'error', -10, 0, 'zero');
// ---- 25. "He said it. Very loudly. To the computer." — the family covers their ears
add(C.saidIt, 'whoosh', -8, 0.2, 'cut to the couch');
add(B.loud - 0.15, 'cloth', -8, 0.3, 'Mom and Granny cover their ears');
add(B.loud, 'impact', -10, 0, 'shake');
// ---- 26. "...To the computer." — in the game: still walking into the wall
add(C.toComp, 'whoosh', -8, 0.2, 'cut to the hot dog');
add(C.toComp + 0.3, 'squeak', -10, P(1100), '"?"');
for (let t = C.toComp + 0.2; t < C.dear - 0.1; t += 0.7) add(t, 'thud', -16, P(1000), 'walking into the wall');
// ---- 27-28. "DEAR EVERYONE. WHERE IS THE JUMP BUTTON." — pecked letter by letter, then SEND
add(C.dear, 'whoosh', -8, -0.2, 'cut to the keyboard');
for (const [t, ch] of letters('04.12', A[12].a - 0.3, A[12].b + 0.2)) add(t, 'click', /[A-Z]/.test(ch) ? -6 : -10, -0.1, `caps key "${ch}"`);
add(C.where, 'whoosh', -6, 0.2, 'whip to the plaza wall');
add(A[12].a - 0.3, 'chat_pop', -6, 0.2, 'the caps bubble pops over the hot dog');
add(B.send, 'confirm', -2, -0.6, 'SEND');
add(B.send + 0.02, 'chat_pop', -2, -0.6, 'the message lands in the chat log');
// ---- 29-30. "Fifty players answered at the same time. Fifty players said SPACEBAR." — the flood
add(C.flood, 'whoosh', -6, 0.3, 'whip to the crowd');
for (let j = 0; j < 11; j++) {
  const ta = B.answered - 0.1 + 0.06 * j, tb = B.same + 0.04 * j, pan = r3(lerp(-0.6, 0.6, hash(j * 3.1)));
  add(ta, 'typing', -16, pan, `player ${j + 1} starts typing (dots)`);
  add(tb, 'chat_pop', -9, pan, `player ${j + 1}: SPACEBAR`);
}
for (let j = 0; j < 22; j++) add(lerp(B.same + 0.5, B.spacebarW + 0.6, j / 21) + 0.05 * hash(j), 'chat_pop', -13, r3(lerp(-0.7, 0.7, hash(j * 7.7))), 'the chat log floods');
add(B.same, 'notify', -6, -0.6, 'chat log +N counter');
add(C.flood2, 'zoom_in', -4, 0, 'smash-zoom on the flooded chat log');
add(B.spacebarW - 0.04, 'orch_hit', 2, 0, 'SPACEBAR slams over the log (shake)');
add(B.spacebarW, 'impact', -2, 0, 'shake');
// ---- 31. the beat: the hero hoods up and dashes for the tree
add(C.hood, 'zoom_in', -8, 0, 'smash on the hero');
add(B.hoodUp - 0.15, 'cloth', -2, 0, 'pulls up the hood');
add(B.hoodUp, 'poof', -8, 0, 'hood poof');
add(B.dash, 'whoosh', -2, -0.4, 'dashes off left');
// ---- 32. "Nobody look at me. I'm a tree. I'm a tree." — then the family strolls over
add(C.tree, 'whoosh', -6, -0.3, 'whip to the hide tree');
add(B.tree1 - 0.35, 'step_soft', -8, 0, 'steps out from behind the tree');
add(B.tree1 - 0.1, 'swish', -6, 0, 'arms up: branches');
add(B.tree1 - 0.05, 'cloth', -10, 0, 'leaves rustle');
add(B.tree2 + 0.2, 'pop', -10, P(1300), '(tree)');
add(B.tree2 + 0.3, 'zoom_in', -10, 0, 'push in on the sweating tree');
add(lerp(B.tree2 - 0.6, B.famIn + 0.4, 0.62), 'squeak', -10, -0.6, 'the noob kid stops: "?"');
add(B.hide, 'swish', -6, 0, 'the hero ducks back behind the tree');
sfx.sort((a, b) => a[0] - b[0]);

// ================================================================= music (tiles [T0, END])
const M = [];
const seg_ = (a, b, mood, energy, inn, out) => { if (b - a > 0.05) M.push({ start: r3(a), end: r3(b), mood, energy, in: inn, out }); };
seg_(T0, C.horror, 'lobby', 0.6, 'cut', 'cut');                       // the spawns (SYSTEM)
seg_(C.horror, C.turn, 'silence', 0, 'cut', 'cut');                    // the hero's face: oh no
seg_(C.turn, C.caps, 'mystery', 0.35, 'fade', 'sting');                // the whole server turns; Every. Single. Name.
seg_(C.caps, C.emote, 'playful', 0.45, 'cut', 'cut');                  // HELLO SON, Noodle, RULE NUMBER ONE
seg_(C.emote, C.dark, 'warm', 0.45, 'cut', 'cut');                     // the emote button, MWAH, awww
seg_(C.dark, C.silence, 'mystery', 0.55, 'cut', 'scratch');            // DarkBlade: the legend brought his MOMMY
seg_(C.silence, C.dadGot, 'silence', 0, 'cut', 'cut');                 // crickets + the tumbleweed
seg_(C.dadGot, C.flood, 'playful', 0.5, 'cut', 'cut');                 // the wall, SPACE! BAR!, DEAR EVERYONE
seg_(C.flood, C.hood, 'chaos', 0.85, 'cut', 'sting');                  // fifty players said SPACEBAR
seg_(C.hood, END, 'lobby', 0.45, 'cut', 'fade');                       // the hood, I'm a tree

// ================================================================= ambience + footsteps
const amb = [];
const bed = (a, b, name, g) => { if (b - a > 0.05) amb.push({ start: r3(a), end: r3(b), name, gain_db: g }); };
const REAL = [[C.caps, C.hello], [C.whisper, C.kiss], [C.dadGot, C.wall], [C.spacebar, C.toComp], [C.dear, C.where]];   // living-room shots
let a = T0;
for (const [r0, r1] of REAL) { bed(a, r0, 'town', -16); bed(r0, r1, 'room', -14); a = r1; }
bed(a, END, 'town', -16);
bed(T0, C.caps, 'crowd', -16);
bed(C.loveDad, C.whisper, 'crowd', -15);
bed(C.kiss, C.silence, 'crowd', -15);
bed(C.flood, C.hood, 'crowd', -12);
const steps = [];
const run = (s0, s1, interval, surface, g, pan) => { if (s1 - s0 > 0.1) steps.push({ start: r3(s0), end: r3(s1), interval: r3(interval), surface, gain_db: g, pan }); };
run(C.dark, C.dark + 0.9, Math.PI / 9, 'hard', -6, 0.4);              // DarkBlade + clan stride in (walk(t * 9))
run(Math.max(C.wall, B.bonk - 0.9), C.spacebar, Math.PI / 9, 'hard', -12, 0.3);        // the hot dog marches into the wall, then walks in place
run(C.toComp, C.dear, Math.PI / 9, 'hard', -14, 0.1);                 // still walking into the wall
run(C.where, C.flood2, Math.PI / 9, 'hard', -16, 0.3);
run(B.dash, C.tree, Math.PI / 16, 'hard', -8, -0.3);                  // the dash to the tree (run(t * 16))
run(B.famIn, B.famIn + 1.44, Math.PI / 9, 'hard', -10, 0.5);          // the family strolls over to the tree

const out = { scene: 'SC 04', start: r3(T0), end: r3(END), music: M, ambience: amb, footsteps: steps, sfx };
fs.writeFileSync(path.join(__dirname, 'sc04.json'), JSON.stringify(out, null, 1));
console.log(`sc04.json: ${sfx.length} sfx, ${M.length} music segments, ${amb.length} beds, ${steps.length} footstep runs`);
