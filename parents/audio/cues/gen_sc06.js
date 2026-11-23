#!/usr/bin/env node
// Sound cue sheet generator for SC 06 · GRANNY'S EMPIRE: MEANWHILE… in Tycoon Valley — the cookie stand pops up brick by
// brick, real Granny knitting with her phone ("Just a little one."), "Fresh cookies! Two coins!" (coins + ka-ching), three
// cookies for the cute KID, the time-lapse stand → bakery → factory → skyscraper (riser, pops, rumble, the money counter
// rocketing), the neon cookie flickering on, the billboard rising, the price stickers (5 / 10 on weekends), the RUDE TAX,
// the factory: NOW HIRING → HIRED!, the conga line of new staff, Noodle "She pays double! And there's dental!", the
// EMPLOYEE OF THE MONTH photo flash, SOLD slapped on YOUR castle, the rent agreement, "I'm your grandson!", "That's why
// it's only fifty, dear.", Granny strolling off, the wallet: 12 coins and a moth (crickets).
// Every time comes from the voice timeline exactly like scenes/s06.js: the cut list (CUT) and the beats (BEATS) are
// imported from the scene module itself (built only from L(id).a/.b and .word()). When the voice changes:
//   node audio/cues/gen_sc06.js && python3 audio/validate_cues.py audio/cues/sc06.json
// Output: audio/cues/sc06.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { CUT: C, BEATS: B } = require('../../scenes/s06');
const { L } = V;

const l = (i) => L('06.' + i);
const w = (i, word, n = 0) => l(i).word(word, n).t0;
const T0 = V.scene('SC 06').start, END = V.scene('SC 07').start;    // == main.js RANGES for SC 06

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const lerp = (a, c, k) => a + (c - a) * k;
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));     // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(t), name, g, r3(pan), note]); };

// ================================================================= SFX, shot by shot (same order as scenes/s06.js)
// ---- 1. MEANWHILE… the valley; the stand pops up brick by brick
add(T0 + 0.02, 'whoosh', -6, 0.4, 'whip in from the arena');
add(T0 + 0.1, 'ui_pop', -4, 0, 'MEANWHILE... banner unfurls');
add(T0 + 0.15, 'notify', -10, 0, 'banner');
for (let i = 0; i < 6; i++) add(B.tOpen + i * 0.12, 'pop', -8 - (i % 2) * 2, P(1400), 'a brick of the cookie stand pops in');
add(B.tOpen + 0.55, 'teleport', -6, P(1400), 'Granny pops in behind the counter');
add(B.tOpen + 0.6, 'sparkle', -10, P(1400), 'pink burst');
// ---- 2. "Just a little one." — real Granny knitting
add(C.little - 0.03, 'whoosh', -12, 0.3, 'cut to the living room');
for (let i = 0; i < 4; i++) add(C.little + 0.3 + i * 0.4, 'tap', -20, 0.4, 'knitting needles click');
add(w(0, 'little'), 'squeak', -8, 0.1, '"tiny!"');
// ---- 3. "Fresh cookies! Two coins!"
add(C.stand, 'whoosh', -10, 0.2, 'back to the stand');
add(l(1).a - 0.3, 'chat_pop', -6, 0.3, "Granny's bubble");
add(C.stand + 0.05, 'ui_pop', -10, 0.8, 'GRANNY coin pill');
add(B.tPay, 'coin', -4, 0.1, 'the first noob pays: coin');
add(B.tPay + 0.1, 'coin', -6, 0.15, 'coin 2');
add(B.tPay + 0.3, 'whoosh', -14, 0, 'a cookie tossed back');
add(B.tPay + 0.45, 'ka_ching', -4, 0.8, 'GRANNY 2');
add(B.tPay + 0.8, 'chomp', -10, -0.1, 'he bites the cookie');
// ---- 4. "Three for the cute ones!"
for (let k = 0; k < 3; k++) add(B.tCute3 - 0.1 + k * 0.18, 'pop', -8, 0.1, `cookie ${k + 1} for the KID`);
add(B.tCute3 + 0.35, 'buzzer_wrong', -14, -0.3, 'the grumpy noob gets none');
add(B.tCute3 + 0.4, 'heart_pop', -6, 0, 'hearts for the cute one');
add(B.tCute3 + 0.4, 'ka_ching', -6, 0.8, 'GRANNY 5');
// ---- 5. the time-lapse: bakery → factory → skyscraper; the money counter rockets
add(C.grow, 'riser_long', -4, 0, 'time-lapse');
add(C.grow + 0.05, 'ui_pop', -8, 0.7, '▶▶ x1000');
add(C.grow + 0.2, 'money_counter', -6, -0.6, 'GRANNY coins skyrocketing');
add(C.grow + 0.3, 'coins', -8, -0.6, 'coins fountain');
for (const [t, what] of [[B.tBak, 'bakery'], [B.tFac, 'factory'], [B.tSky, 'skyscraper']]) {
  add(t, 'whoosh', -6, 0, `smash: ${what}`);
  for (let i = 0; i < 5; i++) add(t + 0.15 + i * 0.13, 'pop', -12, (i - 2) * 0.15, `${what} bricks pop in`);
}
add(B.tFac + 0.6, 'steam_hiss', -14, 0.1, 'factory chimneys');
add(B.tSky + 0.2, 'rumble', -4, 0, 'the skyscraper grows to the clouds');
add(C.grow + 2.6, 'money_counter', -8, -0.6, 'still rolling');
add(C.grow + 2.8, 'coins', -10, -0.6, 'coins');
// ---- 6. the neon cookie on top flickers on — ka-ching
add(C.top - 0.04, 'whoosh_up', -6, 0, 'tilt up to the top');
add(B.tNeon, 'electric', -6, 0, 'neon flicker');
add(B.tNeon + 0.5, 'ka_ching', 0, 0, 'the neon cookie lights up');
add(B.tNeon + 0.52, 'sparkle', -6, 0, 'sparkles');
// ---- 7. the billboard rises
add(C.board - 0.03, 'whoosh', -8, 0.3, 'whip to the billboard');
add(C.board + 0.15, 'rumble', -4, 0.3, 'the billboard rises');
add(C.board + 0.95, 'thud', -2, 0.3, 'legs slam home');
add(C.board + 1.0, 'impact', -8, 0.3, 'shake');
// ---- 7b. "Cookies are now five coins."
add(C.five - 0.03, 'whoosh', -10, -0.3, 'close-up');
add(w(3, 'five') + 0.12, 'stamp', 0, 0.5, '5 COINS sticker slaps on');
add(w(3, 'five') + 0.05, 'ka_ching', -6, 0.5, 'price up');
add(w(3, 'five') + 0.2, 'ui_pop', -8, -0.2, 'NEW PRICE!');
// ---- 7c. "Ten coins on weekends." — the queue looks up
add(C.weekend - 0.03, 'whoosh', -8, 0.3, 'whip to the queue');
add(w(3, 'Ten') + 0.05, 'paper', -4, 0.4, 'the sticker flips to 10');
add(w(3, 'Ten') + 0.3, 'crowd_gasp', -8, 0, '"awww..."');
add(w(3, 'weekends') - 0.05, 'pop', -6, -0.6, 'the SAT/SUN calendar');
// ---- 8. "Fifteen..." — RUDE TAX
add(C.rude - 0.1, 'chat_pop', -6, 0, '"gimme a cookie >:("');
add(B.tRudeTag + 0.12, 'stamp', 0, 0.5, 'RUDE TAX +5 (stamp slams at k .3)');
add(B.tRudeTag + 0.05, 'buzzer_wrong', -8, 0.1, 'IF RUDE ... 15');
// ---- 9. "...if you're rude." — real Granny, sweetly
add(C.rudeReal - 0.03, 'whoosh', -12, 0.3, 'cut to the living room');
add(l(3).b - 0.4, 'shine', -6, 0.3, 'a glint on her glasses');
for (let i = 0; i < 3; i++) add(C.rudeReal + 0.2 + i * 0.4, 'tap', -20, 0.3, 'knitting needles');
// ---- 10. "She hired your friends." — NOW HIRING → HIRED!
add(C.hired - 0.03, 'whoosh', -6, -0.2, 'whip into the factory');
add(B.tHire + 0.14, 'stamp', 0, -0.6, 'HIRED! stamp');
// ---- 11. "Then she hired your friends' friends." — the conga line of new staff
add(C.more + 0.05, 'whoosh', -10, 0, 'pull out wide');
for (let i = 0; i < 10; i++) add(lerp(B.tHire2, C.noodle - 0.4, i / 9), 'click', -16, -0.7, 'STAFF counter ticks');
add(C.noodle - 0.4, 'level_up', -6, -0.7, 'STAFF 48');
// ---- 12. NOODLE: "Sorry, bro! She pays double! And there's dental!"
add(l(5).a - 0.3, 'chat_pop', -6, 0, "Noodle's bubble");
add(B.tDouble, 'coins', -4, 0, 'double pay');
add(B.tDouble + 0.05, 'ka_ching', -6, 0, 'x2!');
add(B.tDental, 'chime', -4, 0.5, 'BENEFITS: DENTAL card');
add(B.tDental + 0.05, 'shine', -2, 0, 'his teeth sparkle');
// ---- 13. EMPLOYEE OF THE MONTH
add(C.employee + 0.02, 'whoosh', -10, 0.2, 'to the frame');
add(B.tFlash, 'camera_flash', 0, 0.3, 'photo flash');
add(B.tFlash + 0.1, 'tada', -6, 0.3, 'EMPLOYEE OF THE MONTH: NoodleBoi');
// ---- 14. "I bought your castle, dear." — SOLD slaps on the gate
add(C.bought - 0.03, 'whoosh', -6, -0.3, 'whip to the castle');
add(l(6).a - 0.3, 'chat_pop', -6, 0.1, "Granny's bubble");
add(B.tSold, 'stamp', 2, -0.1, 'SOLD!');
add(B.tSold + 0.12, 'impact', -4, -0.1, 'the sign swings, shake');
add(B.tSold + 0.15, 'shock', -6, -0.4, 'the hero freezes');
add(B.tDeal - 0.1, 'coins', -6, 0.1, 'coins pop out of her money bag');
// ---- 15. "You BOUGHT my base?!"
add(B.tBought, 'zoom_in', -2, 0, 'smash-zoom on BOUGHT');
add(B.tBought + 0.02, 'impact', -6, 0, 'shake');
// ---- 16. "You can still live there. Rent is fifty coins a week." — the lease
add(l(8).a - 0.3, 'chat_pop', -6, 0.1, "Granny's bubble");
add(C.rent + 0.25, 'ui_pop', -8, -0.8, 'COINS 12 pill');
add(B.tLease, 'paper', -2, 0.6, 'RENT AGREEMENT');
add(w(8, 'fifty'), 'ka_ching', -6, 0.6, '50 COINS / WEEK');
// ---- 17. "Granny! I'm your grandson!" — real life
add(C.grandson - 0.03, 'whoosh', -12, 0, 'cut to the living room');
add(C.grandson + 0.15, 'squeak', -12, -0.5, 'the gaming chair swivels');
// ---- 18. "That's why it's only fifty, dear."
add(w(10, 'dear'), 'heart_pop', -6, 0.3, 'a heart on "dear"');
// ---- 19. Granny strolls off with her money bag
add(C.alone, 'whoosh', -14, 0, 'back to the castle');
for (let i = 0; i < 3; i++) add(C.alone + 0.15 + i * 0.25, 'coins', -16, 0.2 + i * 0.1, 'her money bag jingles');
// ---- 20. "You had twelve coins." — the wallet + the moth
add(C.wallet - 0.02, 'whoosh', -10, 0, 'insert: the wallet');
add(B.tWallet - 0.15, 'cloth', -4, 0, 'the wallet opens');
add(B.tWallet + 0.2, 'coin', -10, 0, 'three lonely coins');
add(B.tWallet + 0.3, 'ui_pop', -10, 0, '12 COINS');
add(B.tMoth, 'cricket', -6, 0.2, 'a moth flutters out');
// ---- 21. his deadpan face; the moth circles his crown
add(C.face + 0.3, 'cricket', -8, -0.2, 'crickets');
add(C.face + 0.5, 'sad_trombone', -10, 0, 'twelve coins');
add(END - 0.1, 'pixel_wipe', -6, 0, 'hand-over to the lobby');

// ================================================================= MUSIC (tiles [T0, END])
const music = [
  { start: T0, end: C.grow, mood: 'playful', energy: 0.45, in: 'cut', out: 'cut' },                     // the little cookie stand
  { start: C.grow, end: C.top, mood: 'tycoon', energy: 1, in: 'cut', out: 'sting' },                      // the time-lapse montage
  { start: C.top, end: C.board, mood: 'wonder', energy: 0.6, in: 'swell', out: 'cut' },                  // the neon cookie
  { start: C.board, end: C.hired, mood: 'tycoon', energy: 0.6, in: 'cut', out: 'cut' },                  // billboard + prices
  { start: C.hired, end: C.bought, mood: 'tycoon', energy: 0.55, in: 'cut', out: 'cut' },                // the factory, Noodle
  { start: C.bought, end: C.grandson, mood: 'heist', energy: 0.45, in: 'cut', out: 'cut' },              // she bought your castle
  { start: C.grandson, end: C.alone, mood: 'playful', energy: 0.35, in: 'cut', out: 'fade' },            // real life: "only fifty"
  { start: C.alone, end: C.wallet, mood: 'sad', energy: 0.25, in: 'fade', out: 'cut' },                  // alone at the SOLD gate
  { start: C.wallet, end: END, mood: 'silence', energy: 0, in: 'cut', out: 'cut' },                      // twelve coins + a moth
].map((s) => ({ ...s, start: r3(s.start), end: r3(s.end) }));

// ================================================================= AMBIENCE
const amb = [];
const bed = (a, b, name, g) => { if (b > a) amb.push({ start: r3(Math.max(a, T0)), end: r3(Math.min(b, END)), name, gain_db: g }); };
bed(T0, C.little, 'wind', -20);                     // floating plots in the sky
bed(T0, C.little, 'town', -18);
bed(C.little, C.stand, 'room', -14);
bed(C.stand, C.rudeReal, 'wind', -22);
bed(C.stand, C.rudeReal, 'town', -16);
bed(C.rudeReal, C.hired, 'room', -14);
bed(C.hired, C.bought, 'conveyor', -14);            // the factory
bed(C.bought, C.grandson, 'town', -18);
bed(C.bought, C.grandson, 'wind', -22);
bed(C.grandson, C.alone, 'room', -14);
bed(C.alone, END, 'wind', -20);                     // lonely
bed(C.wallet, END, 'town', -26);

// ================================================================= FOOTSTEPS (cycles from the scene code: steps every π/K s)
const steps = [];
const st = (a, b, iv, surface, g, pan) => { if (b > a) steps.push({ start: r3(Math.max(a, T0)), end: r3(Math.min(b, END)), interval: r3(iv), surface, gain_db: g, pan: r3(pan) }); };
st(C.more + 0.1, C.noodle, Math.PI / 10, 'hard', -12, 0);              // shMore: the conga line walk(t * 10 + k)
st(C.bought, B.tSold, Math.PI / 10, 'soft', -10, -0.4);                // shBought: the hero walks home walk((t - CUT.bought) * 10)
st(C.alone, C.wallet, Math.PI / 8, 'soft', -14, 0.2);                  // shAlone: Granny strolls off walk(t * 8)

sfx.sort((a, b) => a[0] - b[0]);
const out = { scene: 'SC 06', start: r3(T0), end: r3(END), music, ambience: amb, footsteps: steps, sfx };
const file = path.join(__dirname, 'sc06.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log('wrote', file, '—', sfx.length, 'sfx,', music.length, 'music segments,', amb.length, 'ambience beds,', steps.length, 'footstep runs');
