#!/usr/bin/env node
// Sound cue sheet generator for SC 03 · СОЗДАНИЕ АВАТАРОВ (avatar creation): the evening house, the devices popping in
// ("GAMING SETUP"), the "Kind of." record scratch + loadout cards, Dad's one-finger hunt for the B, "DadBod1978" typing, the
// AGE / VISIBLE TO EVERYONE gag, the sticky-note password + WEAK!, "Dad. NO.", the avatar-shop clicking spree (17 clicks,
// the cart counting to 37, the HOT DOG SUIT slam), POOF → the hot dog, SAVED!, Mom's tablet slide + tea, the 100% GREY
// stamp, Granny shouting at the voice input, the BUY-only shop, her buying spree, the billionaire transformation (coins
// rain), RULE #1, "Got it, champ!", the three PLAY buttons → pixel wipe into SC 04.
// Every time below comes from the voice timeline exactly like scenes/s03.js: the cut list (CUT) and the in-shot beats
// (BEATS, incl. the SPREE click list) are imported from the scene module itself (built only from L(id).a/.b and .word()),
// and the few remaining in-shot offsets are re-derived here with the same expressions as the scene. When the voice changes:
//   node audio/cues/gen_sc03.js && python3 audio/validate_cues.py audio/cues/sc03.json
// Output: audio/cues/sc03.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { CUT: C, BEATS: B } = require('../../scenes/s03');
const { L } = V;

const A = Array.from({ length: 19 }, (_, i) => L('03.' + i));
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;
const T0 = V.scene('SC 03').start, END = V.scene('SC 04').start;    // == main.js RANGES for SC 03
const SPREE = B.SPREE;

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const lerp = (a, c, k) => a + (c - a) * k;
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));     // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(t), name, g, pan, note]); };

// ================================================================= SFX, shot by shot (same order as scenes/s03.js)
// ---- 1. "That evening," — the house at dusk, push into the bay window
add(T0, 'whoosh', -6, 0, 'white flash in from the Saturday kitchen');
add(T0 + 0.45, 'sparkle', -12, P(700), 'the window twinkles');
add(C.setup, 'whoosh', -4, 0.2, 'whip into the living room');
// ---- 2. "…turned into a gaming setup" — the devices pop in on the words
add(B.pc, 'tv_on', -4, P(598), 'the gaming PC screen flashes on');
add(B.pc + 0.05, 'ui_pop', -8, P(598), 'GAMING PC tag');
add(B.laptop, 'pop', -3, P(1000), "Dad's laptop pops onto his lap");
add(B.laptop + 0.05, 'ui_pop', -8, P(1000), 'LAPTOP tag');
add(B.tablet, 'pop', -4, P(1340), "Mom's tablet pops in");
add(B.tablet + 0.05, 'ui_pop', -8, P(1340), 'TABLET tag');
add(B.phone, 'pop', -4, P(1620), "Granny's phone at arm's length");
add(B.phone + 0.05, 'ui_pop', -8, P(1700), 'PHONE tag');
add(B.setup, 'orch_hit', -3, 0, 'GAMING SETUP title slams in');
add(B.setup + 0.1, 'sparkle', -8, 0, 'title sparkles');
// ---- 3. "Kind of." — record scratch, the loadout cards
add(C.kindof, 'record_scratch', 0, 0, 'Kind of. — smash cut to the loadout cards');
add(C.kindof + 0.05, 'level_up', -6, P(285), 'YOUR PC card: five stars');
add(B.kind + 0.12, 'buzzer_wrong', -8, P(735), "Dad's 1998 laptop card: one star");
add(B.of, 'ui_pop', -8, P(1185), "Mom's library tablet card");
add(B.of + 0.22, 'ui_pop', -8, P(1635), "Granny's phone card");
add(B.of + 0.3, 'squeak', -14, P(1185), '"meh" tags');
add(B.of + 0.6, 'slide_down', -12, P(735), "Dad's card droops");
add(C.dad - 0.9, 'loading', -10, P(740), 'LOADING... 3%');
// ---- 4. "Okay. Username." — Dad pulls his glasses down, leans into the screen
add(C.dad, 'whoosh', -8, 0, 'cut to Dad');
add(B.glasses, 'click', -10, P(1000), 'glasses down onto the nose');
add(w(1, 'Username') - 0.2, 'cloth', -12, P(1000), 'leans in to the screen');
// ---- 5. "D… A… D… Where's the B?" — the one-finger hunt
for (const [t, k, x] of [[B.pD1, 'D', 420], [B.pA, 'A', 330], [B.pD2, 'D', 420]]) {
  add(t - 0.04, 'click', -1, P(x), `PECK: the ${k} key`);
  add(t + 0.02, 'ui_pop', -12, P(x), `"${k}" pops above the key`);
}
add(w(1, "Where's"), 'squeak', -9, P(900), '"?" — the finger hovers, lost');
add(w(1, 'B'), 'squeak', -11, P(760), 'second "?"');
// ---- 6. "Dad, it's…" — the hero leans in pointing
add(C.heroB, 'whoosh', -6, -0.2, 'whip to the hero');
// ---- 7. "RIGHT there!" + "Got it!" — the glowing B, the jabs, the slam
add(C.keysB, 'zoom_in', -4, 0, 'smash-zoom on the B key');
add(B.right - 0.05, 'shine', -4, 0, 'the B lights up');
add(B.right, 'tap', -6, -0.2, "the hero's finger jabs at the B");
add(B.there, 'tap', -6, -0.2, 'jab');
add(B.there + 0.38, 'tap', -8, -0.2, 'jab');
add(B.pB - 0.04, 'click', 2, 0, "Dad's finger SLAMS the B (shake)");
add(B.pB, 'confirm', -4, 0, 'GOT IT!');
add(B.pB + 0.02, 'ui_pop', -6, 0.3, 'GOT IT! pops');
// ---- 8. "DadBod nineteen seventy-eight." — the name types into the editor with the voice
add(C.name, 'whoosh', -6, 0.2, 'whip to the avatar editor on the laptop');
add(w(3, 'DadBod'), 'typing', -6, -0.3, 'typing "Bod"');
add(w(3, 'nineteen'), 'typing', -6, -0.3, 'typing "19"');
add(w(3, 'nineteen') - 0.2, 'pop', -8, P(1670), 'SO PROUD picture-in-picture');
add(w(3, 'seventy-eight'), 'typing', -6, -0.3, 'typing "78"');
add(w1(3, 'seventy-eight') - 0.2, 'confirm', -8, -0.3, 'the name field checks green');
// ---- 9. "Why would you tell everyone your age?!" — split: the hero | 1978 circled, VISIBLE TO EVERYONE
add(C.age, 'zoom_in', -4, 0, 'smash into the split screen');
add(w(4, 'everyone'), 'swish', -6, P(1700), 'red marker circles "1978"');
add(w(4, 'everyone'), 'ui_pop', -6, P(1440), 'VISIBLE TO: EVERYONE pill');
for (let i = 0; i < 5; i++) add(w(4, 'everyone') + 0.12 + i * 0.07, 'blink', -14, P(1210 + i * 155), 'a pair of watching eyes pops');
add(B.age, 'pop', -2, P(1500), 'AGE: 48 arrow');
add(B.age, 'boing', -10, P(480), 'the hero throws his arms up');
// ---- 10. "And for the password…" — the sticky note on the bezel
add(C.pass, 'whoosh', -8, 0, 'back to the keyboard');
add(B.note + 0.05, 'whoosh', -10, -0.3, 'the finger swings to the sticky note');
add(B.note + 0.45, 'tap', -6, -0.5, 'taps the PASSWORD: password note');
add(B.note + 0.5, 'sparkle', -8, -0.5, 'note sparkles, "!!"');
// ---- 11. "password." — the dots type with the word, WEAK!
add(C.pass2, 'whoosh', -6, 0.2, 'whip to the password field');
for (let i = 0; i < 8; i++) add(lerp(B.pw0, B.pw1 - 0.05, i / 8), 'click', -10, -0.2, `password dot ${i + 1}`);
add(B.weak, 'buzzer_wrong', -1, 0.2, 'WEAK! tag slams on (red flash, shake)');
add(B.weak + 0.02, 'error', -6, 0.2, 'red flash');
// ---- 12. "Dad. NO." — facepalm, then the smash
add(C.no, 'whoosh', -8, 0, 'cut to the hero');
add(C.no + 0.1, 'slap', -6, -0.2, 'facepalm');
add(B.no2 - 0.04, 'impact', 2, 0, 'NO. — smash-zoom (shake, red tint)');
add(B.no2, 'pop', -4, P(1420), 'NO. bang');
// ---- 13. "Then Dad went to the avatar shop." — the starter noob walks to the podium
add(C.shop, 'whoosh', -4, 0.2, 'whip into the avatar shop');
add(B.shopOn - 0.1, 'magic', -6, 0, 'the podium spotlight switches on');
add(B.shopOn, 'sparkle', -6, 0, 'sparkles round the podium');
add(B.shopOn + 0.02, 'boing', -10, 0, 'the noob hops onto the podium');
// ---- 14. "And he clicked… everything." + the 2 s beat — the clicking spree
add(C.click, 'whoosh', -8, 0, 'cut to the editor');
add(SPREE[0].t, 'ui_pop', -8, 0, 'the IN CART counter pops in');
SPREE.forEach((c, i) => {
  const last = i === SPREE.length - 1;
  add(c.t - 0.03, 'click', last ? 0 : -3 - (i % 3), lerp(-0.2, 0.4, (i % 4) / 3), `CLICK #${i + 1}: ${c.id} (cart ${c.cart})`);
  if (!last) add(c.t + 0.04, i % 2 ? 'coin' : 'equip', -10, lerp(-0.4, 0.3, (i % 5) / 4), `${c.id} drops onto the avatar`);
});
add(w(7, 'everything') + 0.1, 'pop', -8, P(1695), 'PiP: the real Dad clicking like mad');
{
  const last = SPREE[SPREE.length - 1];
  add(last.t, 'ka_ching', 2, P(1300), 'the HOT DOG SUIT is bought (white flash)');
  add(last.t + 0.02, 'zoom_in', -6, P(1300), 'zoom lines on the hot dog card');
  add(last.t + 0.12, 'stamp', 0, P(620), '37 ITEMS IN CART slams in');
  add(last.t + 0.3, 'ui_pop', -6, P(620), '+ 1 HOT DOG SUIT');
}
// ---- 15. POOF — the hot dog; "Son…"
add(B.poof - 0.25, 'boing', -8, 0, 'the overloaded noob wobbles (hat tower)');
add(B.poof, 'poof', 2, 0, 'POOF!');
add(B.poof + 0.02, 'impact', -6, 0, 'poof shake');
add(B.poof + 0.08, 'boing', -4, 0, 'the hot dog pops out');
add(B.poof + 0.15, 'sparkle', -6, 0, 'sparkle ring');
add(B.poof + 0.98, 'squeak', -9, P(1180), '"?" over the hot dog');
// ---- 16. "why am I a hot dog?" — split: real Dad | the hot dog, the same head tilt
add(C.why, 'whoosh', -6, 0.2, 'whip into the split screen');
add(B.hot, 'zoom_in', -8, P(1440), 'the right panel pushes in on the hot dog');
add(B.hot, 'pop', -4, P(1440), 'HOT DOG?! bang');
// ---- 17-18. "I don't know, Dad. You did that." / "You know what?"
add(C.did, 'whoosh', -10, 0, 'cut to the deadpan hero');
add(w(9, 'You') - 0.1, 'swish', -10, -0.1, 'points at Dad');
add(C.know, 'whoosh', -10, 0, 'cut to Dad thinking');
add(C.know + 0.15, 'chime', -10, 0.1, 'one finger up: an idea');
// ---- 19. "I like it. I'm keeping it." — the hot dog poses, SAVED!
add(C.like, 'whoosh', -6, 0.2, 'whip back to the shop');
add(B.like, 'boing', -6, 0, 'the hot dog throws its arms up');
add(B.like + 0.05, 'sparkle', -6, 0, 'sparkle ring');
add(B.keep, 'ui_pop', -6, 0, 'DadBod1978 nametag pops');
add(B.keep + 0.05, 'stamp', 0, P(1450), 'SAVED! stamp (shake)');
add(B.keep + 0.15, 'confirm', -6, P(1450), 'saved');
add(B.keep + 0.3, 'chime', -10, P(1160), 'little dance notes');
// ---- 20. Mom: "I'm not really a gamer, sweetie. I'll just watch."
add(C.mom, 'whoosh', -8, -0.2, 'whip to Mom');
add(B.slide - 0.05, 'slide_down', -8, P(1400), 'slides the tablet onto the coffee table');
add(B.slide + 0.5, 'tap', -10, P(1500), 'the tablet lands on the table');
add(B.sip, 'gulp', -10, P(1300), 'sips her tea');
// ---- 21. "Mom…" — the hero holds up the tablet
add(C.grey, 'whoosh', -8, 0, 'cut to the hero with the tablet');
add(C.grey + 0.25, 'pop', -12, P(1270), '"?"');
// ---- 22. "you're completely grey." — the grey MOM_OFFICIAL, the colour picker, 100% GREY
add(C.grey2, 'whoosh', -6, 0.2, 'whip to the editor');
add(B.greyW - 0.3, 'zoom_in', -6, -0.3, 'push in on the grey avatar');
add(B.greyW, 'ui_pop', -6, P(1440), 'the colour picker: everything greyed out but GREY');
add(B.greyW + 0.15, 'stamp', -2, P(980), '100% GREY stamp');
// ---- 23. "Grey is classy, sweetie." — split: Mom sipping | the grey avatar sipping
add(C.classy, 'whoosh', -6, -0.2, 'whip into the split screen');
add(B.sip2, 'gulp', -10, -0.3, 'both sip their tea');
add(B.classy, 'shine', -4, P(1440), '"classy." sparkle');
// ---- 24. Granny: "HELLO, PHONE." — shouting at arm's length, Mom covers her ears
add(C.gran, 'whoosh', -6, 0.3, 'whip to Granny');
add(B.hello, 'impact', -10, P(1690), 'HELLO! (camera shake)');
add(B.hello + 0.2, 'cloth', -10, P(1300), 'Mom covers her ears');
add(B.phoneW, 'impact', -8, P(1690), 'PHONE! (shake)');
add(B.phoneW + 0.05, 'pop', -10, P(1590), '"!!"');
// ---- 25. "MAKE ME. A GAME. PERSON." — the shouted words fly into the phone's voice input
add(C.voice, 'whoosh', -6, 0, 'smash into the phone screen');
add(C.voice + 0.05, 'beep', -10, 0, 'voice input listening');
for (const x of ['MAKE', 'ME', 'A', 'GAME', 'PERSON']) {
  const t0 = A[14].word(x).t0, from = x.length % 2 ? 300 : 1620;
  add(t0, 'whoosh', -10, P(from), `"${x}" flies at the phone`);
  add(t0 + 0.38, 'typing', -10, 0, `"${x}" types into the box`);
}
add(A[14].word('PERSON').t0 + 0.1, 'alarm_beep', -12, 0, 'TOO LOUD!');
// ---- 26. "Which button is "go"?" — every button says BUY
add(C.which, 'whoosh', -6, 0.2, 'whip to the phone shop');
add(B.goQ, 'squeak', -8, P(700), '"?"');
add(B.goQ + 0.3, 'ui_pop', -8, 0, 'NO "GO" BUTTON note');
add(B.press1 - 0.04, 'tap', -2, -0.1, 'jab: BUY fur coat');
add(B.press1, 'ka_ching', -4, -0.1, 'bought the fur coat');
// ---- 27. "Oh! I bought something." — Granny's face
add(C.oh, 'whoosh', -8, 0, 'cut to Granny');
add(w(15, 'Oh'), 'pop', -6, P(1250), '"!" + shake');
add(w(15, 'bought'), 'stamp', -6, P(840), 'BOUGHT!');
add(w(15, 'bought') + 0.05, 'coin', -8, P(860), 'a coin flies up');
// ---- 28. the beat + "Granny pressed buttons at random…" — jab, jab, jab (coins rocket to 9.99M)
add(C.spree, 'whoosh', -6, -0.2, 'whip to the phone');
{
  const N = 6, t0 = C.spree + 0.15, dt = (C.trans - 0.1 - t0) / N;
  for (let j = 0; j < N; j++) {
    const tp = t0 + j * dt;
    add(tp - 0.03, 'tap', -3, lerp(-0.15, 0.15, (j % 3) / 2), `random jab #${j + 1}`);
    add(tp + 0.02, j % 2 ? 'coins' : 'ka_ching', -6, 0, `bought something (#${j + 1})`);
  }
  add(t0 + 2 * dt, 'money_counter', -10, 0.45, 'the coin balance rockets: 25,000 -> 9.99M');
}
// ---- 29. "…and somehow ended up looking like a billionaire." — the transformation
{
  const tR = B.reveal - 0.05;
  add(C.trans, 'whoosh', -6, 0.2, 'whip to the avatar shop');
  add(C.trans + 0.05, 'magic', -4, 0, 'the noob starts spinning in a sparkle tornado');
  add(C.trans + 0.4, 'riser_long', -6, 0, 'spin accelerates');
  for (const [id, tt] of [['furcoat', w(16, 'buttons')], ['pearls', w(16, 'random')], ['monocle', w(16, 'somehow')], ['cane', w(16, 'ended')], ['coin bag', w(16, 'looking')]]) {
    add(tt - 0.35, 'whoosh', -10, 0, `the ${id} flies in`);
    add(tt, 'equip', -4, 0, `${id} snaps on (burst)`);
  }
  add(w(16, 'like') - 0.2, 'reverse_swell', -4, 0, 'white-out builds');
  add(tR, 'tada', 2, 0, 'REVEAL: the billionaire Granny (white flash, shake)');
  add(tR + 0.02, 'poof', -2, 0, 'gold poof');
  add(tR + 0.1, 'coins', -2, 0, 'coins rain down');
  add(tR + 0.15, 'ui_pop', -6, 0, 'GrannyGoodies nametag');
  add(tR + 0.2, 'money_counter', -4, -0.5, 'the coin counter rolls to 9,999,999');
  add(tR + 0.6, 'coins', -8, 0.3, 'more coins');
}
// ---- 30-31. "Okay. Rule number one. Do NOT talk to my friends."
add(C.rule, 'whoosh', -8, -0.2, 'whip back to the living room');
add(B.rule, 'orch_hit', -2, 0, 'RULE #1 title slams in');
add(B.rule + 0.02, 'alarm_beep', -10, 0, 'alarm-red title');
add(B.not, 'impact', 1, -0.3, 'NOT — smash-zoom (shake)');
add(B.talk - 0.1, 'ui_pop', -6, 0, 'DO NOT TALK TO MY FRIENDS ribbon');
// ---- 32. "Got it, champ!" — thumbs up
add(C.champ, 'whoosh', -6, 0.3, 'whip to the family');
add(A[18].a, 'swish', -8, P(1000), 'thumbs up');
add(B.champ, 'shine', -4, P(1060), 'ding: the thumbs-up sparkles');
// ---- 33. the three PLAY buttons → into the laptop → pixel wipe
add(C.play, 'whoosh', -6, 0.2, 'cut to the three devices');
for (let i = 0; i < 3; i++) add(C.play + i * 0.08, 'ui_pop', -8, P([380, 1060, 1650][i]), `device ${i + 1} pops in`);
B.play.forEach((tp, i) => {
  const x = [380, 1060, 1650][i];
  add(tp - 0.02, 'click', -2, P(x), `${['Dad', 'Mom', 'Granny'][i]} presses PLAY`);
  add(tp + 0.18, 'loading', -12, P(x), 'JOINING...');
});
add(B.play[2] + 0.12, 'whoosh_long', -4, 0, 'zoom into the laptop screen');
add(END - 0.32, 'pixel_wipe', -2, 0, 'pixel wipe into Cube City');
sfx.sort((a, b) => a[0] - b[0]);

// ================================================================= music (tiles [T0, END])
const M = [];
const seg_ = (a, b, mood, energy, inn, out) => { if (b - a > 0.05) M.push({ start: r3(a), end: r3(b), mood, energy, in: inn, out }); };
seg_(T0, C.kindof, 'family', 0.6, 'swell', 'scratch');                // that evening, the gaming setup
seg_(C.kindof, C.dad, 'playful', 0.4, 'cut', 'cut');                  // kind of: the loadout cards
seg_(C.dad, B.no2 - 0.04, 'playful', 0.45, 'cut', 'sting');           // username, B, DadBod1978, password, "Dad."
seg_(B.no2 - 0.04, C.shop, 'silence', 0, 'cut', 'cut');               // NO.
seg_(C.shop, B.poof, 'montage', 0.9, 'swell', 'sting');               // the avatar shop + the clicking spree + the beat
seg_(B.poof, C.mom, 'playful', 0.5, 'cut', 'fade');                   // the hot dog: why am I a hot dog? I'm keeping it
seg_(C.mom, C.gran, 'family', 0.4, 'fade', 'cut');                    // Mom: grey is classy
seg_(C.gran, C.spree, 'playful', 0.55, 'cut', 'cut');                 // HELLO PHONE, which button is go
seg_(C.spree, C.trans, 'chaos', 0.7, 'cut', 'cut');                   // random buying spree
seg_(C.trans, C.rule, 'tycoon', 0.85, 'swell', 'sting');              // the billionaire transformation
seg_(C.rule, C.play, 'family', 0.5, 'cut', 'cut');                    // Rule number one / Got it, champ
seg_(C.play, END, 'lobby', 0.7, 'swell', 'cut');                      // PLAY -> joining Cube City

// ================================================================= ambience + footsteps
const amb = [];
const bed = (a, b, name, g) => { if (b - a > 0.05) amb.push({ start: r3(a), end: r3(b), name, gain_db: g }); };
bed(T0, C.setup, 'town', -16);                                        // the house at dusk
bed(C.setup, C.play, 'room', -15);                                    // the living room (the screens are on its devices)
const steps = [];
const run = (s0, s1, interval, surface, g, pan) => { if (s1 - s0 > 0.1) steps.push({ start: r3(s0), end: r3(s1), interval: r3(interval), surface, gain_db: g, pan }); };
run(C.shop, B.shopOn, Math.PI / 9, 'hard', -12, -0.2);                // the noob walks to the podium (walk(t * 9))

const out = { scene: 'SC 03', start: r3(T0), end: r3(END), music: M, ambience: amb, footsteps: steps, sfx };
fs.writeFileSync(path.join(__dirname, 'sc03.json'), JSON.stringify(out, null, 1));
console.log(`sc03.json: ${sfx.length} sfx, ${M.length} music segments, ${amb.length} beds, ${steps.length} footstep runs`);
