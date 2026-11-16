#!/usr/bin/env node
// Sound cue sheet generator for SC 03 (НОУТБУК ЗА ДОЛЛАР: Server Street, the garage sale and the old man, the sale
// vanishes; night: the laptop boots, ;help -> the command chips, ;fly me -> BONK).
// Every time below is computed from the voice timeline exactly like scenes/s03.js does (L(id).a / .b, .word()),
// so when the real voice replaces the provisional timeline, re-run:
//   node audio/cues/gen_sc03.js && python3 audio/validate_cues.py audio/cues/sc03.json
// Output: audio/cues/sc03.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { SPOTS } = require('../../scenes/sets');
const { L } = V;

// ---------------------------------------------------------------- timing (copied from scenes/s03.js)
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const START = V.scene('SC 03').start, END = V.scene('SC 04').start;   // == main.js RANGES for SC 03
const A = Array.from({ length: 19 }, (_, i) => L('03.' + i));
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;

const d01 = START;
const d02 = w(0, 'garage') - 0.1;
const d03 = w(0, 'On', 1) - 0.08;
const d04 = A[1].a - 0.05;
const d05 = w(1, 'Since') - 0.08;
const d06 = A[2].a - 0.05;
const d07 = w(2, 'who') - 0.08;
const d08 = A[3].a - 0.05;
const d09 = w(3, "You'll") - 0.08;
const d10 = A[4].a - 0.05;
const d11 = A[5].a - 0.05;
const d12 = w(5, 'No') - 0.08;
const d13 = w(5, 'And') - 0.08;
const d14 = A[6].a - 0.05;
const d15 = A[7].a - 0.05;
const d16 = A[8].a - 0.05;
const d17 = w(8, "It's") - 0.08;
const d18 = A[9].a - 0.05;
const d19 = w(9, 'and') - 0.08;
const d20 = A[10].a - 0.05;
const d21 = w(10, 'Totally') - 0.08;
const d22 = A[11].a - 0.05;
const d23 = w(11, 'no') - 0.08;
const d24 = w(11, 'Just') - 0.08;
const d25 = A[12].a - 0.05;
const d26 = A[13].a - 0.05;
const d27 = A[14].a - 0.4;
const d28 = w(14, 'This') - 0.08;
const d29 = A[15].a - 0.05;
const d30 = w(15, 'You', 1) - 0.06;
const d31 = A[16].a - 0.05;
const d32 = w(16, 'Teleport') - 0.08;
const d33 = w(16, 'Kick') - 0.35;
const d34 = A[17].a - 0.05;
const d35 = w(17, 'So') - 0.08;
const d36 = A[18].a - 0.05;
const tOW = w(18, 'OW');
const d37 = tOW - 0.22;
const d38 = w(18, "There's") - 0.08;
const tVan0 = w(9, 'turn'), tGone = w(9, 'gone');      // the sale vanishes behind your back
const SHOT_CUTS = [d02, d03, d04, d05, d06, d07, d08, d09, d10, d11, d12, d13, d14, d15, d16, d17, d18, d19, d20, d21, d22, d23,
  d24, d25, d26, d27, d28, d29, d30, d31, d32, d33, d34, d35, d36, d37, d38];
const CUTS = SHOT_CUTS.filter((c) => ![d02, d22, d24, d25].includes(c));   // X.cutFlash at these
const WHIPS = [d02];
const tG = w(8, 'game');                                  // "It's not a GAME": the huge crowned shadow
const tHelpE = A[15].b + 0.02;                            // ENTER: ;help
const tFlyE = A[17].b + 0.04;                             // ENTER: ;fly me
const tK = w(16, 'Kick');
// the bedroom: hero / laptop x, command chips
const LX = 1390;
const CMD_WORD = ['Fly', 'Speed', 'Size', 'Jail', 'Teleport', 'God', 'Noclip', 'Freeze', 'Kick'];
const CHIP_X = [1010, 1160, 1330, 1510, 1700, 940, 1820, 1000, 1780];
const chipT = (i) => w(16, CMD_WORD[i]) - 0.05;
const GS = SPOTS.garageSale, OM = GS.oldman, SS = SPOTS.serverStreet;

// typing span of a command bar = K.typeProgress(t, line, from, to): from word t0 to word t1
function typeSpan(line, from = 0, to = null) {
  const ws = line.words;
  const key = (x) => x[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const i0 = typeof from === 'number' ? from : ws.findIndex((x) => key(x) === from.toLowerCase());
  const i1 = to === null ? ws.length - 1 : typeof to === 'number' ? to : ws.findIndex((x, i) => i >= i0 && key(x) === to.toLowerCase());
  return [ws[Math.max(0, i0)][1], ws[Math.max(0, i1)][2]];
}

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));          // pan from screen x
const PW = (wx, cx, z) => P(960 + z * (wx - cx));                        // world x seen by camAt(cx, _, z)
const sfx = [];
const add = (t, name, g, pan, note) => sfx.push([r3(t), name, g, pan, note]);
function typing(t0, t1, g, pan, note) {
  for (let t = t0, k = 0; t < t1 - 0.5 || k === 0; t += 0.9, k++) add(t, 'typing', k ? g - 2 : g, pan, k ? note + ' (cont.)' : note);
}

// ================================================================= SFX, shot by shot
// ---- 1. walking home on the normal evening street (from SC 02's white flash)
add(d01 + 0.3, 'swish', -14, 0, 'backpack bounce');
// ---- 2. "...a garage sale you've never seen before." — Server Street, the double take
{
  const tN = w(0, 'never');
  add(d02 + 0.5, 'electric', -15, 0.3, 'the street lamps flicker like they are loading');
  add(tN, 'squeak', -6, -0.45, 'you stop dead (sneakers)');
  add(tN + 0.05, 'swish', -8, -0.45, 'double take');
  add(w(0, 'before'), 'pop', -6, P(1500), "'GARAGE SALE?' tag");
}
// ---- 3. the street sign, still loading
add(d03 + 0.15, 'loading', -8, 0, "'LOADING STREET...' bar under the sign");
add(d03 + 0.9, 'electric', -12, -0.2, 'a lamp flickers');
add(d03 + 1.4, 'loading', -10, 0, 'still loading');
// ---- 5. "Since when do we have a Server Street?" — every window blinks at once
add(w(1, 'Server', 1), 'glitch', -7, 0, 'every window on the street blinks green');
// ---- 6. "And a very old man..." — he rises from behind the table
{
  const tO = w(2, 'old');
  add(tO - 0.1, 'slide_up', -5, PW(OM.x, 900, 1.05), 'the tiny old man rises from behind the table');
  add(tO + 0.05, 'squeak', -8, PW(GS.hero.x, 900, 1.05), 'you jump');
}
// ---- 7. "...like he's been waiting." — WAITING... 100%
add(d07 + 0.1, 'loading', -10, 0, "'WAITING... 97%' wheel");
add(w(2, 'waiting'), 'confirm', -6, 0, "'DONE WAITING' tick");
add(w(2, 'waiting') + 0.05, 'shine', -8, 0, 'his eyes twinkle');
// ---- 8. "Ahh. Finally."
add(w(3, 'Finally') - 0.15, 'cloth', -8, 0, 'he opens his arms');
// ---- 9. "You'll want the laptop." — it glows
add(w(3, 'laptop') - 0.05, 'magic', -4, 0, 'the dusty laptop glows green');
add(w(3, 'laptop') + 0.1, 'sparkle', -8, 0, 'sparkles round the laptop');
// ---- 10. "I didn't say anything."
add(w(4, 'anything'), 'pop', -11, PW(GS.hero.x + 40, GS.hero.x + 40, 2.3), "'?' over your head");
// ---- 11. "One dollar." — the laptop slides into your arms
{
  const tD = w(5, 'dollar');
  add(w(5, 'One'), 'ka_ching', -5, P(1210), "'$1' tag");
  add(tD - 0.1, 'whoosh', -8, PW(800, 860, 1.45), 'the laptop slides off the table');
  add(tD + 0.5, 'cloth', -8, PW(GS.hero.x, 860, 1.45), '...into your arms');
}
// ---- 12. "No refunds." — FINAL SALE
{
  const tR = w(5, 'refunds');
  add(tR, 'swish', -8, 0, "red line strikes out 'refunds'");
  add(tR + 0.1, 'stamp', -1, P(470), "'FINAL SALE' stamp");
}
// ---- 13. "And no questions." — the finger wag
add(w(5, 'questions') - 0.2, 'swish', -12, 0, 'finger wag');
// ---- 14. "Why does it say 'do not type'?"
add(w(6, 'do') - 0.1, 'zoom_in', -6, 0, "push in on the 'DO NOT TYPE' sticker");
add(w(6, 'do'), 'swish', -8, 0, 'red circle round the sticker');
// ---- 15. "That was a question." — BZZT
add(w(7, 'question'), 'buzzer_wrong', 0, P(1500), "'BZZT!' red X (shake)");
// ---- 16–17. "Oh, and one more thing... It's not a game." — the giant crowned shadow
add(d16 + 0.1, 'wind_gust', -12, 0, 'the light dims');
add(tG - 1.5, 'reverse_swell', -6, 0, 'push in on his eyes (swell peaks on GAME)');
add(tG - 0.35, 'shine', -6, 0, 'glint in his eyes');
add(tG - 0.04, 'whoosh', -6, 0, 'snap back to the wide');
add(tG, 'sub_drop', 2, 0, 'his shadow on the garage wall is HUGE, with a crown');
add(tG + 0.03, 'electric', -6, 0, 'the light flickers (shake)');
// ---- 18. you turn around, dig in your pockets... the sale starts to vanish behind you
add(d18 + 0.25, 'cloth', -8, 0, 'digging in your pockets');
[['lint', 0], ['a button', 1], ['gum?', 2]].forEach(([txt, i]) => add(d18 + 0.5 + i * 0.5, 'pop', -9, PW(950 + 70 * i, 820, 1.5), `out of the pocket: ${txt}`));
add(tVan0 + 0.3, 'magic', -13, -0.3, 'the sale quietly fades away behind you');
add(w(9, 'dollar'), 'paper', -4, PW(940, 820, 1.5), 'found the dollar!');
add(w(9, 'dollar') + 0.05, 'shine', -8, PW(940, 820, 1.5), 'dollar held up');
// ---- 19. "...and the whole garage sale is gone." — tumbleweed, crickets
add(d19 + 0.1, 'swish', -8, 0, 'you turn round');
add(tGone - 0.15, 'poof', -6, 0.2, 'the last of the sale is gone');
add(tGone + 0.2, 'wind_gust', -6, 0, 'a tumbleweed rolls across the empty lawn');
[[0.35, -3], [1.5, -5], [2.65, -7]].forEach(([dt, g]) => add(tGone + dt, 'cricket', g, P(1560), "'chirp.'"));
// ---- 20. "Cool. Cool cool cool."
add(d20 + 0.6, 'wind_gust', -12, 0, 'the tumbleweed keeps rolling');
// ---- 21. "Totally normal neighborhood." — and RUN
{
  const tN = w(10, 'neighborhood');
  add(tN + 0.08, 'squeak', -6, PW(720, 860, 1.2), 'sneakers spin');
  add(tN + 0.12, 'whoosh_long', 0, -0.35, "'ZOOM!' you run off with the laptop");
}
// ---- 22. night: the bedroom
add(d22 + 0.5, 'snore', -12, PW(1250, 1215, 1.2), 'Pancake asleep on the bed');
// ---- 23. "...no apps. No games." — two empty windows
add(w(11, 'apps') - 0.05, 'ui_pop', -4, -0.1, "'APPS: 0' window");
add(w(11, 'games') - 0.05, 'ui_pop', -4, 0.1, "'GAMES: 0' window");
// ---- 24. "Just one black screen... that knows your name."
add(w(11, 'name') + 0.05, 'glitch', -8, 0, 'a green glitch line on the black screen');
// ---- 25. SYSTEM: "Admin panel loaded. Welcome... you."
add(d25, 'tv_on', -6, 0, 'the admin panel boots');
typing(w(12, 'Admin'), w1(12, 'loaded'), -10, 0, "'Admin panel loaded.' types itself");
add(w(12, 'Welcome'), 'typing', -11, 0, "'Welcome...' types itself");
add(w(12, 'you'), 'chime', -6, 0, "'...you.'");
add(w(12, 'you') + 0.05, 'sparkle', -8, 0, 'sparkles');
// ---- 26. "It knows my username."
add(d26 + 0.32, 'chat_pop', -6, P(1610), "the empty '[you]:' chat bar pops up");
// ---- 27. Pancake flops on the keyboard
{
  const land = A[14].a - 0.12;
  add(d27, 'whoosh_down', -6, 0, 'Pancake drops from above');
  add(land, 'thud', 0, 0, "'FLOP!' on the keyboard (shake)");
  add(land + 0.02, 'typing', -5, 0, 'keys mashed by the cat');
  add(land + 0.5, 'typing', -11, 0, "';;;;;;;;' fills the screen");
}
// ---- 28. "This is a very spooky moment." — Pancake pours like liquid
add(d28 + 0.3, 'slide_down', -6, P(1140), 'you lift Pancake... he stretches like liquid');
// ---- 29. "So you do what anyone would do." — knuckles
add(w(15, 'anyone'), 'egg_crack', -3, P(1450), "'CRACK' knuckles");
add(w(15, 'anyone') + 0.15, 'egg_crack', -6, P(1450), 'knuckles');
// ---- 30. ;help
{
  const [a, b] = typeSpan(A[15], 'help', 'help');
  add(d30 + 0.05, 'typing', -10, 0, 'hands on the keys');
  typing(a, b, -4, 0, "typing ';help'");
  add(tHelpE, 'click', -2, 0, 'ENTER: ;help');
  add(tHelpE + 0.03, 'confirm', -3, 0, 'confirm: ;help (command burst)');
}
// ---- 31–32. SYSTEM: "Available commands: ..." — the chips fly out like holograms
add(d31, 'magic', -4, 0, 'holograms burst out of the screen');
add(d31 + 0.2, 'ui_pop', -5, 0, "'AVAILABLE COMMANDS' tag");
for (let i = 0; i < 8; i++) {
  const t = chipT(i), z = t < d32 ? 1.35 : 1.8;
  add(t, 'pop', -6, PW(CHIP_X[i], LX, z), `;${['fly', 'speed', 'size', 'jail', 'tp', 'god', 'noclip', 'freeze'][i]} chip flies out`);
}
add(chipT(5) + 0.05, 'shine', -9, PW(CHIP_X[5], LX, 1.8), ';god glints');
// ---- 33. "...Kick." — the red ;kick chip
add(tK - 0.05, 'glitch_long', -1, 0, 'the ;kick chip slams in red (shake, red flash)');
add(tK, 'boom', -3, 0, 'kick');
add(tK + 0.4, 'gulp', -4, 0, 'you, scared');
// ---- 34. "Admin commands. Like in a game."
add(w(17, 'game') - 0.2, 'cloth', -10, 0, 'shrug');
// ---- 35. "So, as a joke... you type: 'fly me.'"
{
  const [a, b] = typeSpan(A[17], 'fly', 'me');
  add((d35 + w(17, 'joke')) / 2, 'egg_crack', -6, 0, 'knuckles, again');
  typing(a, b, -3, 0, "typing ';fly me'");
  add(tFlyE, 'click', -2, 0, 'ENTER: ;fly me (shake)');
  add(tFlyE + 0.03, 'confirm', 0, 0, 'confirm: ;fly me');
  add(tFlyE + 0.12, 'ui_pop', -7, 0, "'Command accepted'");
}
// ---- 36. "I'm— I'm FLYING!" — you float off the bed
{
  const tF = w(18, 'FLYING'), tA = w(18, 'actually');
  add(d36, 'whoosh_up', -1, PW(LX, LX - 80, 1.25), 'FLY: you float up off the bed (command burst)');
  add(d36 + 0.1, 'magic', -7, PW(LX, LX - 80, 1.25), 'hover shimmer');
  add(tF, 'pop', -6, P(520), "'I'M FLYING!' tag");
  add(tA - 0.05, 'whoosh_up', -2, 0, '...accelerating up');
}
// ---- 37. "OW." — BONK
add(tOW, 'bonk', 3, 0, "'BONK!' head into the ceiling (smash-zoom, shake)");
add(tOW + 0.02, 'zoom_in', -5, 0, 'smash-zoom');
add(tOW + 0.45, 'dizzy', -4, 0, 'dizzy stars');
// ---- 38. "There's a ceiling."
add(d38 + 0.6, 'dizzy', -9, 0, 'stars still circling');
add(w(18, 'ceiling', 1), 'pop', -6, 0, "'THERE IS A CEILING' tag");

// ---- whip-pans + cut flashes (scene router)
for (const tc of WHIPS) add(tc - 0.1, 'whoosh', -3, -0.2, 'whip-pan onto Server Street');
for (const tc of CUTS) {
  if (sfx.some((e) => e[0] > tc - 0.25 && e[0] < tc + 0.25)) continue;               // already marked by a hit
  add(tc - 0.03, 'swish', -13, 0, 'cut flash');
}

sfx.sort((p, q) => p[0] - q[0]);

// ================================================================= MUSIC (tiles [START, END])
const M = (start, end, mood, energy, inn, out) => ({ start: r3(start), end: r3(end), mood, energy, in: inn, out });
const S = (start, end) => M(start, end, 'silence', 0, 'cut', 'cut');
const music = [
  M(START, tGone, 'mystic', 0.4, 'fade', 'cut'),     // Server Street, the old man, "It's not a game", the sale fades
  S(tGone, d22),                                     // gone: tumbleweed + crickets, "Cool cool cool", run
  M(d22, d31, 'mystery', 0.4, 'fade', 'cut'),        // night: the laptop boots, Pancake, ;help
  M(d31, d33, 'wonder', 0.55, 'cut', 'cut'),         // the command chips fly out
  S(d33, d34),                                       // "...Kick."
  M(d34, tFlyE, 'wonder', 0.4, 'fade', 'cut'),       // "Like in a game. So, as a joke..."
  M(tFlyE, tOW, 'power', 0.75, 'cut', 'cut'),        // ;fly me: I'M FLYING! -> BONK
  S(tOW, END),                                       // "OW. Ceiling. There's a ceiling."
];

// ================================================================= AMBIENCE (beds per location)
const B = (start, end, name, gain_db) => ({ start: r3(start), end: r3(end), name, gain_db });
const ambience = [
  B(START, d02, 'town', -12),              // the normal street, evening
  B(START, d02, 'birds', -16),
  B(d02, d22, 'night', -14),               // Server Street: eerie, empty
  B(d02, d22, 'wind', -18),
  B(d22, END, 'night', -12),               // the bedroom at night
];

// ================================================================= FOOTSTEPS
const footsteps = [];
const F = (start, end, interval, surface, gain_db, pan) => footsteps.push({ start: r3(start), end: r3(end), interval: r3(interval), surface, gain_db, pan });
{
  // walking home: AC.walk((t - START) * 7.2) -> a step every PI/7.2 s
  F(START, d02, Math.PI / 7.2, 'hard', -10, -0.09);
  // walking onto Server Street, slowing to a stop on "never" (ph = 7 (t - d02)(1 - stop): ~2 slower steps)
  F(d02 + 0.15, w(0, 'never') - 0.2, 0.5, 'hard', -11, -0.45);
  // backing away: AC.walkFront(t * 9) -> PI/9 s
  const tN = w(10, 'neighborhood');
  F(d21 + 0.1, tN + 0.1, Math.PI / 9, 'hard', -13, PW(780, 900, 1.15));
  // ...and RUN: AC.run(t * 34) -> PI/34 s
  F(tN + 0.1, Math.min(d22, tN + 0.7), Math.PI / 34, 'hard', -7, -0.45);
}

// ================================================================= write
const out = { scene: 'SC 03', start: r3(START), end: r3(END), music, ambience, footsteps, sfx };
const J = (x) => JSON.stringify(x);
const txt = '{\n' +
  `  "scene": ${J(out.scene)},\n  "start": ${out.start},\n  "end": ${out.end},\n` +
  `  "music": [\n${music.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "ambience": [\n${ambience.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "footsteps": [\n${footsteps.map((m) => '    ' + J(m)).join(',\n')}\n  ],\n` +
  `  "sfx": [\n${sfx.map((m) => '    ' + J(m)).join(',\n')}\n  ]\n}\n`;
const dst = path.join(__dirname, 'sc03.json');
fs.writeFileSync(dst, txt);
console.log(`${dst}: ${music.length} music segments, ${ambience.length} beds, ${footsteps.length} footstep runs, ${sfx.length} sfx`);
