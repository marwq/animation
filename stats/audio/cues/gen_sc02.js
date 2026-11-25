#!/usr/bin/env node
// Sound cue sheet generator for SC 02 · MEET EVERYONE: the iris opening out of SC 01's rewind point, the hero mashing his
// controller (monitor POV) → scrapbook freeze "YOU" (shutter, label slap, arrow), the dive into DRAGON PEAK (portal), coins,
// the enemy line-up (a badge pop per word + creature squeaks), the chest of items (magic, whoosh-ups, tooltip pops), the LV
// ladder → LV 90 orchestra hit; the goblin charge → one slash, -999, poof, coins; the dragon rises (rumble, roar, boss bar)
// → "Run." (fire breath); phew in the room, the monitor dies; the morning kitchen chaos; thought-bubble pops; Mom's freeze,
// the works-all-day triptych slams, the smile TING, "Probably." (sizzle + smoke), the 300-cupcake time-lapse (a pop per box,
// the rooster at sunrise), "asked about your day" (heart); Grandpa's freeze, the MON/TUE/WED rerun (tape clunks), "1979!"
// (orchestra hit), the sepia finals (film hiss, crowd, flashbulbs), the LEGEND stamp; Max's freeze, the spoon catapult, the
// tornado (wind, splats), the T-rex landing, RAWR; Biscuit's freeze, the GOOD BOY rosette, his desk bell; "Did I tell you
// about seventy-nine?" / "Every. Single. Day." (three zoom hits in silence); school: pixel wipe + bell, Benji's freeze, the
// dodgeball BONK, the wrong-answer buzzer, the shoelace trip + body fall, books landing, "I meant to do that!" TA-DA; the
// cafeteria: Tank's shadow, his freeze with censor bleeps, the redacted file, the BIG stamp, the stomach rumble, "Now." hit,
// the lunch hand-over, CHOMP, ducking + fists; night: the wish, the monitor glitches → hand-off to SC 03.
// Every time comes from the voice timeline exactly like scenes/s02.js: CUT + BEATS are imported from the scene module itself
// (built only from L(id).a/.b and .word()). When the voice changes:
//   node audio/cues/gen_sc02.js && python3 audio/validate_cues.py audio/cues/sc02.json
// Output: audio/cues/sc02.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { CUT: C, BEATS: B } = require('../../scenes/s02');
const { L } = V;

const la = (i) => L('02a.' + i), lb = (i) => L('02b.' + i);
const wa = (i, word, n = 0) => la(i).word(word, n).t0;
const wb = (i, word, n = 0) => lb(i).word(word, n).t0;
const T0 = V.scene('SC 02').start, END = V.scene('SC 03').start;    // == main.js RANGES for SC 02

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));     // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(Math.max(T0, t)), name, g, r3(pan), note]); };
// the scrapbook freeze-frame intro: shutter + label slap + the doodled arrow (+ the sub label)
const intro = (t, x, who, sub) => {
  add(t, 'camera_flash', -4, P(960), `freeze-frame: ${who}`);
  add(t + 0.22, 'stamp', -6, P(x), `${who} name label slaps on`);
  add(t + 0.4, 'whoosh', -14, P(x), 'the doodled arrow draws');
  if (sub !== undefined) add(sub, 'pop', -10, P(x), `${who}: sub label`);
};

// ================================================================= SFX, shot by shot (same order as scenes/s02.js)
// ---- 1. the iris opens from SC 01's rewind point; button mashing; freeze YOU; "games." fist pump
add(T0, 'reverse_swell', -8, 0, 'the rewind lands on one point');
add(T0 + 0.08, 'whoosh_up', -6, 0, 'iris opens');
for (let i = 0; i < 4; i++) add(T0 + 0.25 + i * 0.13, 'click', -16, i % 2 ? 0.1 : -0.1, 'controller buttons');
intro(B.tYou, 540, 'YOU');
add(B.tYouOut, 'tada', -4, 0.1, '"games." — fist pump, golden screen light');
add(B.tYouOut + 0.1, 'sparkle', -10, 0, 'sparkles');
// ---- 2. the dive into the monitor
add(C.dive + 0.05, 'whoosh_long', -6, 0.2, 'push into the monitor');
add(C.meadow - 0.08, 'portal_enter', -4, 0, 'through the screen into DRAGON PEAK');
// ---- 3. the meadow: coins
for (const cx of [260, 380, 500]) {
  const u = (cx - 20 + 120) / 680, t = C.dive + u * (C.enemy - C.dive);
  add(t, 'coin', t < C.meadow ? -16 : -8, P(cx), 'knight picks up a coin');
}
// ---- 4. every enemy has a level: a badge per word
const crit = [['splat', -14, 'slime squishes'], ['squeak', -14, 'shroom squeaks'], ['swish', -14, 'bat flaps'], ['monster_growl', -12, 'goblin growls']];
B.tE.forEach((t, i) => { add(t - 0.06, 'ui_pop', -4, P(400 + i * 420), `LV badge ${i + 1} pops`); add(t, crit[i][0], crit[i][1], P(400 + i * 420), crit[i][2]); });
// ---- 5. every item has stats
add(B.tI[0] - 0.05, 'magic', -4, 0, 'the chest bursts open');
add(B.tI[0], 'shine', -8, 0, 'light rays');
B.tI.forEach((t, i) => { const t0 = t + (i === 3 ? 0.22 : 0) - 0.05; add(t0, 'whoosh_up', -10, P(500 + i * 300), 'item flies out'); add(t0 + 0.28, 'ui_pop', -6, P(500 + i * 300), 'parchment tooltip'); });
add(B.tI[3] + 0.3, 'equip', -10, 0.4, 'boots land in the row');
// ---- 6. the LV ladder → LV 90
B.tStrongW.forEach((t, i) => add(t - 0.05, i < 4 ? 'ui_pop' : 'orch_hit', i < 4 ? -8 + i : -2, -0.55, i < 4 ? `ladder badge ${i + 1}` : 'LV 90 DRAGON slams on top'));
add(B.tStrong, 'rumble', -12, 0.4, 'the peak glows');
// ---- 7. the goblin
add(C.goblin, 'ui_pop', -10, 0.7, 'the facecam pops in (LIVE)');
add(C.goblin + 0.3, 'monster_growl', -8, 0.4, 'the goblin charges');
for (let i = 0; i < 3; i++) add(C.goblin + 0.5 + i * 0.3, 'step', -12, 0.35, 'goblin stomps');
add(B.tEasy - 0.12, 'swish', -2, 0.1, 'the slash');
add(B.tEasy, 'impact', 0, 0.15, 'hit');
add(B.tEasy + 0.04, 'poof', -4, 0.15, 'the goblin goes poof');
add(B.tEasy + 0.06, 'pop', -8, 0.2, '-999 CRIT');
add(B.tEasy + 0.12, 'coins', -6, 0.2, 'coins burst out');
add(B.tEasy + 0.6, 'ka_ching', -12, -0.6, 'coin counter +50');
// ---- 8. the dragon rises
add(C.dragon + 0.05, 'rumble', -2, 0.2, 'the ground shakes, the sky reddens');
add(C.dragon + 0.1, 'riser', -8, 0, 'something huge rises');
add(B.tDragon - 0.1, 'dramatic', -4, 0, 'the boss bar slides in');
add(B.tDragon, 'monster_roar', -2, 0.35, 'the dragon roars');
// ---- 9. "Run." — the fire breath
add(B.tRun - 0.05, 'whoosh', -6, -0.2, 'the knight turns and runs');
add(C.run + 0.12, 'whoosh_long', -2, 0.4, 'fire breath');
add(C.run + 0.2, 'sizzle', -8, 0.2, 'flames');
add(C.phew - 0.05, 'whoosh', -6, 0, 'whip back to the room');
// ---- 10. phew
add(C.phew + 0.55, 'pop', -12, 0.3, '"phew…" doodle');
// ---- 11. "But real life?" — the monitor dies, he gets up
add(B.tOff, 'tv_off', -4, 0.3, 'the monitor powers off');
add(B.tUp, 'squeak', -12, 0.3, 'the chair as he stands');
add(C.kitchen - 0.05, 'whoosh', -6, 0.5, 'whip to the kitchen');
// ---- 12. kitchen chaos
add(C.kitchen + 0.2, 'dog_bark', -12, -0.2, 'Biscuit zooming around');
for (let i = 0; i < 3; i++) add(C.kitchen + 0.3 + i * 0.55, 'swish', -16, -0.6, 'Mom juggling');
add(C.kitchen + 0.5, 'boing', -14, 0, 'Max bouncing on the booster');
add(B.tStop, 'step', -10, 0.7, 'the hero stops in the doorway');
// ---- 13. thought bubbles
B.tThink.forEach((t, i) => add(t, 'pop', -6, P([560, 830, 1500, 1560][i]), `thought bubble ${i + 1}`));
add(B.tThink[0] + 0.1, 'loading', -16, -0.4, "Mom's loading wheel");
// ---- 14. Mom
add(C.mom - 0.05, 'whoosh', -6, -0.4, 'whip to Mom');
add(C.mom + 0.2, 'swish', -12, 0, 'juggling');
intro(B.tMomF, 1420, 'MOM', B.tBakery);
add(B.tMomOut, 'whoosh', -12, 0, 'release');
// ---- 15. works all day — triptych
B.tWorks.forEach((t, i) => add(t - 0.1, 'whoosh_down', -6, P(320 + i * 640), `panel ${i + 1} slams down`));
B.tWorks.forEach((t, i) => add(t + 0.05, 'thud', -12, P(320 + i * 640), 'panel lands'));
add(B.tWorks[2] + 0.15, 'snore', -14, 0.5, 'asleep standing up');
// ---- 16. the smile
add(B.tSmiles, 'shine', -2, 0.1, 'smile TING');
add(B.tSmiles + 0.1, 'sparkle', -10, 0, 'sparkles');
// ---- 17-18. breakfast is ready… probably
add(C.morning - 0.05, 'whoosh', -8, -0.3, 'whip');
add(C.morning + 0.1, 'sizzle', -14, -0.5, 'the pan');
add(B.tReady, 'pan_clang', -8, -0.4, 'Mom presents the pan');
add(B.tProb - 0.1, 'sizzle', -4, 0, 'the egg burns');
add(B.tProb, 'steam_hiss', -6, 0.2, 'black smoke billows');
add(B.tProb + 0.45, 'alarm_beep', -16, 0.5, 'a polite smoke-alarm chirp');
// ---- 19. 300 cupcakes before sunrise (time-lapse)
add(C.cupcakes, 'whoosh', -8, 0.3, 'cut to pre-dawn');
{
  const a = C.cupcakes + 0.2, b = B.tSunrise - 0.1;
  for (let i = 1; i <= 12; i++) add(a + (i / 12) * (b - a), 'pop', -12, P(1650), `cupcake box ${i}`);
  for (let t = C.cupcakes + 0.2; t < B.tSunrise; t += 0.4) add(t, 'swish', -18, 0, 'Mom zipping (time-lapse)');
}
add(B.tSunrise - 0.1, 'chicken', -8, -0.5, 'rooster: sunrise');
add(B.tSunrise, 'shine', -8, -0.4, 'sunlight floods in');
// ---- 20. asked about your day
add(wa(6, 'day') - 0.1, 'heart_pop', -8, 0.2, 'hearts');
add(wa(6, 'And') + 0.5, 'blush', -12, 0.2, 'he blushes');
// ---- 21. Grandpa Lou
add(C.lou - 0.05, 'whoosh', -6, 0.4, 'whip to Grandpa');
add(C.lou + 0.3, 'gulp', -8, 0.3, 'a sip from the #79 mug');
intro(B.tLouF, 620, 'GRANDPA LOU');
// ---- 22. the rerun: MON / TUE / WED
{
  const Ld = (C.g79 - C.same) / 3;
  for (let d = 0; d < 3; d++) { const t = C.same + d * Ld; if (d) add(t, 'vhs_clunk', -6, 0, 'rewind: the same breakfast again'); add(t + 0.02, 'paper', -10, -0.7, `calendar: day ${d + 1}`); }
}
// ---- 23. "Nineteen seventy-nine!"
add(C.g79, 'whoosh_up', -8, 0.3, 'Grandpa rises');
add(B.t79, 'orch_hit', -2, -0.3, '1979 slams in');
add(B.t79 + 0.1, 'shine', -10, -0.3, 'retro title');
// ---- 24. the 1979 finals (sepia)
add(C.finals, 'vhs_clunk', -6, 0, 'old film starts');
add(C.finals + 0.1, 'rumble', -16, 0, 'arms straining');
const tFin = wa(8, 'finals');
add(tFin, 'crowd_cheer', -6, 0, 'the 1979 crowd');
for (let i = 0; i < 4; i++) add(tFin + i * 0.16, 'camera_flash', -8, P([300, 1640, 520, 1420][i]), 'flashbulb');
// ---- 25. "I was a legend!"
add(C.legend - 0.05, 'whoosh', -6, 0, 'back to breakfast');
add(C.legend + 0.05, 'swish', -10, 0.3, 'the flex');
add(B.tLegend, 'stamp', -2, -0.6, 'LEGEND stamp');
add(B.tLegend + 0.05, 'sparkle', -8, 0.3, 'biceps sparkle');
// ---- 26. Max
add(C.max - 0.05, 'whoosh', -6, -0.2, 'whip to Max');
add(C.max + 0.1, 'boing', -6, 0, 'spoon catapult');
add(C.max + 0.25, 'pop', -12, 0, 'cereal flies');
intro(B.tMaxF, 1420, 'MAX', B.tBro);
// ---- 27. "He's five."
add(C.five + 0.05, 'sparkle', -8, 0, 'claw up');
add(C.five + 0.6, 'pop', -10, 0.5, '"close enough"');
// ---- 28. the tornado
add(C.tornado + 0.1, 'jump', -8, 0, 'hops off the booster');
add(B.tSpin, 'wind_gust', 0, 0, 'spins up into a tornado');
add(B.tSpin + 0.05, 'whoosh_long', -4, 0, 'tornado');
for (let i = 0; i < 6; i++) add(B.tSpin + 0.4 + i * 0.42, 'splat', -10, i % 2 ? 0.5 : -0.5, 'cereal + milk splats');
add(B.tSpin + 0.8, 'dog_bark', -10, 0.4, 'Biscuit gives chase');
add(C.trex - 0.05, 'land', -4, 0, 'Max lands on the table');
// ---- 29-30. "I'm a T-rex! RAWR!"
add(C.trex + 0.05, 'boing', -10, 0, 'proud bounce');
add(B.tRawr - 0.05, 'zoom_in', -6, 0, 'smash zoom');
add(B.tRawr, 'monster_growl', -6, 0, 'RAWR (cute)');
add(B.tRawr + 0.02, 'impact', -8, 0, 'RAWR! lettering');
// ---- 31. Biscuit
add(C.biscuit + 0.4, 'dog_bark', -8, 0, 'happy bark (ears blown back)');
intro(B.tBisF, 560, 'BISCUIT');
// ---- 32-33. very good boy; his whole job
add(B.tGoodBoy - 0.1, 'stamp', -8, 0, 'GOOD BOY rosette pins on');
add(B.tGoodBoy, 'chime', -6, 0, 'good boy');
add(B.tGoodBoy + 0.1, 'sparkle', -10, 0, 'sparkles');
add(C.job - 0.05, 'whoosh', -8, -0.4, 'whip');
add(C.job + 0.35, 'bell', -12, 0.3, 'desk bell: on duty');
// ---- 34. "Did I tell you about seventy-nine?"
add(C.again - 0.05, 'whoosh', -8, 0.3, 'whip');
add(C.again + 0.2, 'squeak', -14, 0.4, 'Grandpa leans in');
// ---- 35-38. "Every day, Grandpa. Every. Single. Day."
add(C.everyday - 0.05, 'whoosh', -10, -0.2, 'whip');
for (const t of [C.e1, C.e2, C.e3]) { add(t, 'zoom_in', -4, 0, 'smash zoom'); add(t + 0.02, 'thud', -6, 0, 'deadpan hit'); }
// ---- 39. school: Benji
add(C.school - 0.3, 'pixel_wipe', -4, 0, 'pixel wipe to school');
add(C.school + 0.1, 'bell', -10, 0, 'school bell');
intro(B.tBenF, 520, 'BENJI', wb(4, 'best'));
add(B.tBenOut, 'heart_pop', -6, 0, 'BFF hop');
// ---- 40. bad at sports
add(C.sports - 0.05, 'whoosh', -6, 0.4, 'whip to the gym');
add(B.tSports - 0.5, 'whoosh', -6, 0.6, 'the dodgeball incoming');
add(B.tSports, 'bonk', 0, -0.4, 'BONK, straight to the face');
add(B.tSports + 0.05, 'boing', -8, -0.3, 'ball bounces off');
add(B.tSports + 0.15, 'dizzy', -10, -0.4, 'dizzy');
add(B.tSports + 0.2, 'kids_laugh', -14, 0.3, 'the team');
// ---- 41. bad at math
add(C.math - 0.05, 'whoosh', -6, -0.4, 'whip to the classroom');
add(B.tMath, 'buzzer_wrong', -6, -0.4, '2 + 2 = 22');
add(B.tMath + 0.05, 'swish', -12, -0.4, 'red pen circle');
// ---- 42. bad at shoelaces
add(C.laces - 0.05, 'whoosh', -6, 0.3, 'whip');
add(B.tLace, 'slip', -2, 0, 'steps on his lace');
add(B.tLace + 0.1, 'whoosh_down', -8, 0.1, 'trips');
add(B.tLace + 0.15, 'paper', -8, 0.2, 'books fly');
add(B.tLace + 0.45, 'body_fall', -2, 0.1, 'lands');
// ---- 43. "I'm okay!"
for (let i = 0; i < 3; i++) add(C.okay - 0.25 + i * 0.14 + Math.sqrt(700 / 1800), 'thud', -8, P(900 + i * 90), 'a book lands');
add(C.okay + 0.2, 'dizzy', -12, 0, 'dizzy stars');
// ---- 44. "I meant to do that!"
add(C.meant + 0.02, 'boing', -6, 0, 'springs up');
add(B.tBookHead, 'bonk', -2, 0, 'a book lands on his head');
add(B.tThat, 'tada', -4, 0, 'TA-DA');
add(B.tThat + 0.1, 'applause', -16, 0.6, 'one kid claps');
// ---- 45. the nicest person
add(C.nice - 0.05, 'whoosh', -8, 0.3, 'whip');
add(B.tNice + 0.3, 'paper', -10, 0.2, 'hands back the papers');
add(B.tNice + 0.45, 'heart_pop', -8, 0.2, 'hearts');
add(B.tNice + 0.6, 'sparkle', -12, 0, 'warm sparkle');
// ---- 46. Tank
add(C.tank - 0.05, 'whoosh', -6, 0.4, 'whip to the cafeteria');
add(wb(7, 'then'), 'dramatic', -4, 0.4, "a huge shadow falls (Tank's entrance)");
intro(B.tTankF, 520, 'TANK');
add(B.tTankF + 0.55, 'censor_bleep', -8, -0.5, 'sub label redacted');
// ---- 47. the redacted file
add(C.file + 0.05, 'paper', -6, 0.5, 'FILE: TANK slides in');
B.tFileW.forEach((t, i) => add(t, 'censor_bleep', -12 + i, 0.5, `line ${i + 1} redacted`));
add(B.tCrack, 'click', -8, -0.3, 'knuckles crack');
add(B.tCrack + 0.3, 'click', -10, -0.3, 'knuckles crack');
// ---- 48. "…he's big."
add(C.big, 'whoosh_up', -8, 0, 'tilt up from the boots');
add(B.tBig, 'stamp', -2, 0.6, 'BIG stamped on the file');
add(B.tBig + 0.02, 'boing', -12, 0, 'Tank swells');
// ---- 49. always hungry
add(B.tHungry - 0.2, 'rumble', -2, 0, 'stomach growl');
add(B.tHungry + 0.2, 'squeak', -14, 0, 'GRRRMBL…');
// ---- 50-51. "Lunch. Now."
add(C.lunch + 0.2, 'thud', -10, 0.1, 'Tank leans on the table');
add(C.now, 'zoom_in', -6, 0, 'smash zoom');
add(wb(8, 'Now'), 'impact', -2, 0, '"Now."');
add(wb(8, 'Now') + 0.05, 'dishes', -10, 0, 'trays rattle');
// ---- 52-53. the hand-over
add(B.tGive - 0.02, 'whoosh', -6, 0.1, 'the lunch bag, instantly');
add(B.tGive + 0.05, 'paper', -10, 0.1, 'paper bag');
add(B.tEnjoy, 'harp_up', -12, 0, 'presented like a waiter');
add(B.tEnjoy + 0.05, 'sparkle', -10, 0, 'sandwich sparkle');
add(B.tTake - 0.1, 'swish', -8, 0.2, 'Tank takes the sandwich');
// ---- 54. CHOMP
add(B.tBite, 'chomp', -2, 0.4, 'CHOMP');
// ---- 55-56. "One day…" / duck / fists
add(B.tStand, 'swish', -12, -0.3, 'a determined little fist');
add(B.tDuck - 0.05, 'whoosh_down', -6, -0.3, 'they drop behind the table');
B.tFist.forEach((t, i) => add(t, 'pop', -4, P(560 + i * 210), `fist ${i + 1} pops up`));
// ---- 57. night: the wish
add(C.night - 0.3, 'pixel_wipe', -8, 0, 'dark pixel wipe to night');
add(B.tReally, 'thud', -10, 0, 'flops back in the chair');
add(B.tReally + 0.05, 'squeak', -12, 0, 'gaming chair');
// ---- 58. "Be careful what you wish for." — the monitor flickers
B.FLICK.forEach((t, i) => { add(t - 0.02, i === B.FLICK.length - 1 ? 'glitch_long' : 'glitch', i < 2 ? -6 : -4, 0.3, 'the monitor flickers'); add(t, 'static', -12, 0.3, 'screen static'); });
add(END - 0.45, 'powerdown', -10, 0.3, 'the room dips (→ SC 03)');

// ================================================================= MUSIC (tiles [T0, END])
const tProb = B.tProb, tSun = B.tSunrise;
const music = [
  { start: T0, end: C.dive, mood: 'levelup', energy: 0.45, in: 'fade', out: 'cut' },               // "This is you."
  { start: C.dive, end: C.dragon, mood: 'adventure', energy: 0.6, in: 'swell', out: 'cut' },      // DRAGON PEAK: everything makes sense
  { start: C.dragon, end: C.phew, mood: 'boss', energy: 0.95, in: 'cut', out: 'sting' },          // the dragon, RUN
  { start: C.phew, end: C.real, mood: 'silence', energy: 0, in: 'cut', out: 'cut' },              // phew
  { start: C.real, end: tProb - 0.05, mood: 'homey', energy: 0.55, in: 'fade', out: 'scratch' },  // real life: the kitchen, Mom
  { start: tProb - 0.05, end: C.cupcakes, mood: 'silence', energy: 0, in: 'cut', out: 'cut' },    // "…Probably."
  { start: C.cupcakes, end: tSun + 0.3, mood: 'montage', energy: 0.8, in: 'cut', out: 'sting' },  // the cupcake time-lapse
  { start: tSun + 0.3, end: C.lou, mood: 'warm', energy: 0.4, in: 'fade', out: 'fade' },          // she still asked about your day
  { start: C.lou, end: C.finals, mood: 'homey', energy: 0.5, in: 'cut', out: 'cut' },             // Grandpa Lou, the rerun, 1979!
  { start: C.finals, end: C.legend, mood: 'epic', energy: 0.8, in: 'cut', out: 'cut' },           // the 1979 finals
  { start: C.legend, end: C.tornado, mood: 'homey', energy: 0.55, in: 'cut', out: 'cut' },        // legend, Max
  { start: C.tornado, end: C.trex, mood: 'chaos', energy: 0.95, in: 'cut', out: 'sting' },        // the tornado
  { start: C.trex, end: C.biscuit, mood: 'playful', energy: 0.65, in: 'cut', out: 'cut' },        // T-rex, RAWR
  { start: C.biscuit, end: C.again, mood: 'warm', energy: 0.45, in: 'fade', out: 'cut' },         // Biscuit, very good boy
  { start: C.again, end: C.e1, mood: 'homey', energy: 0.4, in: 'cut', out: 'cut' },               // "Did I tell you…"
  { start: C.e1, end: C.school - 0.3, mood: 'silence', energy: 0, in: 'cut', out: 'cut' },        // "Every. Single. Day."
  { start: C.school - 0.3, end: C.nice, mood: 'playful', energy: 0.6, in: 'cut', out: 'fade' },   // school: Benji
  { start: C.nice, end: C.tank, mood: 'tender', energy: 0.4, in: 'fade', out: 'cut' },            // the nicest person you know
  { start: C.tank, end: wb(8, 'Now') - 0.05, mood: 'mystery', energy: 0.5, in: 'cut', out: 'cut' }, // Tank
  { start: wb(8, 'Now') - 0.05, end: C.sure, mood: 'silence', energy: 0, in: 'cut', out: 'cut' }, // "Now."
  { start: C.sure, end: C.night - 0.3, mood: 'playful', energy: 0.35, in: 'cut', out: 'fade' },    // the hand-over, "probably not today"
  { start: C.night - 0.3, end: C.careful, mood: 'sad', energy: 0.3, in: 'fade', out: 'cut' },      // the wish
  { start: C.careful, end: END, mood: 'glitch_build', energy: 0.5, in: 'swell', out: 'fade' },     // be careful what you wish for (→ SC 03 install)
].map((s) => ({ ...s, start: r3(s.start), end: r3(s.end) }));

// ================================================================= AMBIENCE
const amb = [];
const bed = (a, b, name, g) => { if (b > a) amb.push({ start: r3(Math.max(a, T0)), end: r3(Math.min(b, END)), name, gain_db: g }); };
bed(T0, C.meadow, 'room', -16);                     // morning bedroom
bed(C.meadow, C.dragon, 'birds', -18);              // the game meadow
bed(C.dragon, C.phew, 'wind', -14);                 // the dragon
bed(C.phew, C.kitchen, 'room', -14);
bed(C.kitchen, C.finals, 'kitchen', -14);           // breakfast
bed(C.finals, C.legend, 'static', -22);             // old film hiss
bed(C.finals, C.legend, 'crowd', -14);              // the 1979 crowd
bed(C.legend, C.school, 'kitchen', -14);
bed(C.tornado, C.trex, 'wind', -10);                // the tornado
bed(C.school, C.sports, 'crowd', -20);              // hallway chatter
bed(C.sports, C.math, 'crowd', -16);                // gym
bed(C.math, C.laces, 'room', -18);                  // classroom
bed(C.laces, C.tank, 'crowd', -20);                 // hallway
bed(C.tank, C.night, 'crowd', -18);                 // cafeteria
bed(C.night, END, 'night', -14);                    // night bedroom

// ================================================================= FOOTSTEPS (cycles from the scene code: steps every π/K s)
const steps = [];
const st = (a, b, iv, surface, g, pan) => { if (b > a) steps.push({ start: r3(Math.max(a, T0)), end: r3(Math.min(b, END)), interval: r3(iv), surface, gain_db: g, pan: r3(pan) }); };
st(C.meadow, C.enemy, Math.PI / 9, 'soft', -12, 0);                  // shMeadow: knight AC.walk(t * 9) on grass
st(C.run + 0.05, C.phew, Math.PI / 22, 'soft', -8, -0.3);            // shRun: AC.run((t - CUT.run) * 22)
st(B.tUp + 0.35, C.kitchen, Math.PI / 9, 'wood', -12, 0.4);          // shReal: walk((t - tUp) * 9)
st(C.kitchen, B.tStop, Math.PI / 9, 'hard', -12, 0.7);               // shKitchen: walk((t - CUT.kitchen) * 9)
st(C.school, C.school + 1.0, Math.PI / 9, 'hard', -12, -0.3);        // shSchool: the hero's walk((tt - CUT.school) * 9)
st(C.laces, B.tLace, Math.PI / 9, 'hard', -8, -0.2);                 // shLaces: Benji's walk((t - CUT.laces) * 9)
st(wb(7, 'then'), B.tTankF, Math.PI / 6, 'hard', -4, 0.4);           // shTank: Tank's walkFront(tt * 6) — heavy
st(C.walk, C.oneday, Math.PI / 7, 'hard', -8, 0.5);                  // shWalk: walk((t - CUT.walk) * 7)
st(C.notToday, B.tDuck - 0.2, Math.PI / 7, 'hard', -12, 0.7);        // shNotToday: walk(t * 7) before the glance

sfx.sort((a, b) => a[0] - b[0]);
const out = { scene: 'SC 02', start: r3(T0), end: r3(END), music, ambience: amb, footsteps: steps, sfx };
const file = path.join(__dirname, 'sc02.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log('wrote', file, '—', sfx.length, 'sfx,', music.length, 'music segments,', amb.length, 'ambience beds,', steps.length, 'footstep runs');
