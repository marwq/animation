#!/usr/bin/env node
// Sound cue sheet generator for SC 05 · TANK: Tank's boots stomping down the cafeteria lane (boss music), the shadow, "Level
// eighty." (the BOSS plate), the fighting-game boss intro + boss bar, the choice menu (clicks, buzzers, "TAKEN: BENJI" error, Benji's
// dive under the table), "Lunch." (fist on the table, trays jump) — then the music drops: the deep scan, heartbeats, the boss plate
// glitching away, HP 3/100 blinking, HUNGRY (stomach rumble) · TIRED · LONELY tags slapping on, silence on his face; the tiny "?"
// (chime) + smash-zoom; the sandwich tooltip, the hero's own stomach rumble, QUEST COMPLETE! (+37 HP roll, CHOMP), the memory
// bubble, the zipped lips, Mom's lunch tower popping out of the bag, half of it to Tank, FRIENDSHIP +1, Benji's spoon, "THANKS?!",
// THE RULE card and the +38 XP into the bar.
// Every time comes from the voice timeline exactly like scenes/s05.js: the cut list (CUT) and the beats (BEATS) are imported from
// the scene module itself (built only from L(id).a/.b and .word()). When the voice changes:
//   node audio/cues/gen_sc05.js && python3 audio/validate_cues.py audio/cues/sc05.json
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { CUT: C, BEATS: B } = require('../../scenes/s05');
const { L } = V;

const l = (i) => L('05.' + i);
const w = (i, word, n = 0) => l(i).word(word, n).t0;
const T0 = V.scene('SC 05').start, END = V.scene('SC 06').start;    // == main.js RANGES for SC 05

const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));     // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(t), name, g, r3(pan), note]); };

// ================================================================= SFX, shot by shot (same order as scenes/s05.js)
// ---- 1. the stomp: Tank's boots down the lane, the line kids shrink back
add(T0, 'dramatic', -2, 0, 'hard cut: the boss arrives');
B.steps.forEach((t, i) => add(t, 'thud', -6 - (i > 3 ? 4 : 0), i < 4 ? 0.4 : 0.15, `Tank's boot #${i + 1} (dust puff)`));
add(T0 + 0.35, 'crowd_gasp', -12, 0.5, 'the lunch line shrinks back');
// ---- 2. "for your lunch." — mid-bite freeze, the shadow falls over him
add(C.gulp + 0.15, 'chomp', -14, 0, 'the hero about to bite');
add(w(0, 'lunch') - 0.05, 'shock', -6, -0.1, 'he freezes (zoom lines)');
add(w(0, 'lunch') + 0.15, 'gulp', -8, -0.1, 'gulp');
add(C.gulp + 0.25, 'whoosh_down', -14, 0.6, "Tank's shadow creeps over the table");
// ---- 3. "Level eighty." — the red BOSS plate pops; the hero's "???"
add(C.lv + 0.1, 'ui_pop', -14, -0.2, "the hero's ??? plate");
add(w(0, 'Level') - 0.2, 'ui_pop', -4, 0.15, 'TANK · LV 80 · BOSS plate pops');
add(w(0, 'eighty'), 'impact', -6, 0.15, 'LV 80 — red flash');
add(B.tArrive, 'thud', -6, 0.2, 'Tank plants his feet at the table end');
// ---- 4. "A boss fight." — boss intro card + boss bar
add(C.boss, 'orch_hit', 2, 0, 'BOSS INTRO: freeze + red band slams across');
add(C.boss + 0.05, 'whoosh_long', -6, -0.4, 'the red band');
for (let i = 0; i < 4; i++) add(C.boss + 0.2 + i * 0.05, 'punch', -12, -0.2 + i * 0.12, `giant letter "${'TANK'[i]}" drops`);
add(C.boss + 0.55, 'metal_hit', -6, 0.6, 'LV 80 hexagon');
add(B.tBossBar, 'alarm_beep', -10, 0, 'the boss bar drops in');
add(B.tFight, 'boom', 0, 0, 'BOSS FIGHT! (shake)');
// ---- 5. "Run? Fight? Hide under the table?" — the choice menu
add(C.menu + 0.05, 'ui_pop', -6, 0.45, 'CHOOSE YOUR ACTION menu unfolds');
add(B.tRun - 0.1, 'click', -6, 0.45, 'RUN');
add(B.tRun + 0.28, 'buzzer_wrong', -12, 0.5, 'ESCAPE: 0%');
add(B.tDive, 'whoosh_down', -8, -0.7, 'Benji dives under the table');
add(B.tDive + 0.25, 'thud', -14, -0.7, 'Benji lands under the table');
add(B.tFightW - 0.05, 'tap', -8, 0.45, 'cursor → FIGHT');
add(B.tFightW + 0.28, 'buzzer_wrong', -12, 0.5, 'WIN: 0.01%');
add(B.tHide - 0.05, 'tap', -8, 0.45, 'cursor → HIDE UNDER TABLE');
add(B.tHide, 'slide_down', -12, -0.3, 'the hero sinks behind the table');
add(w(1, 'table') + 0.1, 'error', -8, 0.5, 'TAKEN: BENJI');
// ---- 6. "Lunch." — the fist on the table
add(B.tSlam, 'impact', 2, 0.2, 'THUD! — fist on the table');
add(B.tSlam + 0.04, 'dishes', -8, 0, 'trays + milk cartons jump');
add(B.tSlam + 0.1, 'shock', -12, -0.2, 'the hero jolts');
// ---- 7. "But then you saw it." — quiet: reticle + deep scan sweep through his eyes
add(C.saw, 'reverse_swell', -10, 0, 'the room goes quiet');
add(w(3, 'saw') - 0.1, 'blink', -12, 0.1, 'reticle locks on');
add(C.saw + 0.6, 'laser_sweep', -12, 0, 'DEEP SCAN sweep');
add(C.saw + 1.2, 'heartbeat', -10, 0, 'heartbeat');
// ---- 8. "Three health." — the boss plate glitches away, the real one: HP 100 → 3
add(B.tThree - 0.35, 'glitch', -8, 0.1, 'boss plate glitches');
add(B.tThree - 0.1, 'ui_pop', -8, 0.1, 'the real plate');
add(B.tThree, 'slide_down', -8, 0.1, 'HP drains 100 → 3');
add(B.tThree + 0.25, 'heartbeat', -6, 0, 'heartbeat (red edge pulse)');
for (let i = 0; i < 3; i++) add(B.tThree + 0.7 + i * 0.45, 'alarm_beep', -16, 0.1, 'HP 3/100 blinking');
// ---- 9. "Hungry." — stomach growl + tag
add(B.tHungry - 0.1, 'rumble', -8, 0.1, 'stomach growl ("grrr")');
add(B.tHungry, 'tap', -4, 0.15, 'HUNGRY tag slaps on');
// ---- 10. "Tired." — a yawn + tag
add(B.tTired, 'tap', -4, 0.15, 'TIRED tag slaps on');
add(B.tTired + 0.2, 'wind_gust', -22, 0, 'a long tired yawn (air)');
// ---- 11. "Lonely." — pull back: alone in the light
add(B.tLonely, 'tap', -4, 0.1, 'LONELY tag slaps on');
add(B.tLonely + 0.1, 'harp_down', -14, 0, 'sad little sting');
add(C.lonely + 0.1, 'whoosh_long', -20, 0, 'slow pull back');
// ---- 12. silence on his face
add(C.alone + 0.1, 'ui_close', -18, 0.1, 'the plate fades');
add(C.alone + 0.95, 'gulp', -12, 0.1, 'Tank swallows, looking at the sandwich');
// ---- 14. "...a tiny question mark."
add(C.above + 0.2, 'whoosh_up', -18, 0, 'tilt up into empty air');
add(B.tTiny, 'chime', -8, 0.1, 'the TINY "?" pops');
add(B.tTiny + 0.05, 'sparkle', -14, 0.1, 'twinkle');
add(B.tQ, 'zoom_in', -6, 0, 'smash-zoom on the "?"');
add(B.tQ + 0.05, 'notify', -10, 0, 'quest marker');
// ---- 15. "Here. Take the whole thing."
add(B.tHere - 0.1, 'cloth', -12, 0, 'he holds out the sandwich');
add(B.tHere + 0.2, 'ui_pop', -8, 0, 'TURKEY SANDWICH · +37 HP tooltip');
add(B.tTake, 'paper', -12, 0.2, 'Tank takes it');
// ---- 16. "I'm not that hungry." — his own stomach
add(w(6, 'hungry'), 'rumble', -8, 0.1, "the hero's stomach growls back");
// ---- 17. "...You're GIVING it to me?"
add(B.tGiving, 'zoom_in', -10, 0.1, 'push on GIVING');
// ---- 18. QUEST COMPLETE!
add(B.tComplete - 0.15, 'achievement', 0, 0, 'QUEST COMPLETE! banner');
add(B.tComplete, 'sparkle', -6, 0.2, 'the "?" bursts');
add(B.tComplete + 0.35, 'chime', -6, 0, '+37 HP chip slams');
// ---- 19. "Plus thirty-seven health." — HP 3 → 40, the first bite
add(C.hp + 0.05, 'ui_pop', -12, 0.1, 'the plate is back');
add(B.tHealth - 1.2, 'sparkle', -10, 0.1, '+37 HP pops off the sandwich');
add(B.tHealth - 0.25, 'heart_pop', -6, 0.1, '+37 HP lands in his HP bar');
add(B.tHealth - 0.2, 'money_counter', -10, 0.1, 'HP counts 3 → 40');
add(B.tBite, 'chomp', -2, 0.1, 'CHOMP!');
add(B.tBite + 0.45, 'chomp', -14, 0.1, 'chewing');
add(B.tBite + 0.25, 'pop', -12, 0.2, 'HUNGRY tag peels off');
// ---- 20. "Thanks... I guess."
add(C.thanks + 0.2, 'blush', -12, 0.1, 'shy blush');
// ---- 22. the memory bubble: Dad works nights
add(B.tBubble, 'magic', -12, 0.4, 'memory bubble opens');
for (let i = 0; i < 4; i++) add(B.tBubble + 0.5 + i * 0.5, 'countdown_tick', -22, 0.5, 'the night kitchen clock');
add(B.tNobody - 0.15, 'poof', -16, 0.4, 'the bubble shows the empty lunch bag');
// ---- 23. "Okay? Don't tell anybody."
add(B.tOkay - 0.05, 'whoosh', -12, 0, 'he leans in, gruff again');
// ---- 24. zip the lips
add(C.zip + 0.15, 'slide_up', -10, -0.1, 'zzzip — lips zipped');
// ---- 25. Mom's lunch tower
B.pile.forEach((t, i) => add(t, 'pop', -10 - (i % 3) * 2, 0.15, `lunch item #${i + 1} stacks on the tower`));
// ---- 26. "You can have half. Every day." — half the tower hops to Tank; FRIENDSHIP +1
for (let j = 0; j < 4; j++) add(B.tSlide + j * 0.08 + 0.3, 'whoosh_up', -16, 0.3, 'food hops into Tank\'s arms');
add(B.tHeart, 'heart_pop', -2, 0.2, 'FRIENDSHIP +1');
// ---- 27. Tank walks off; Benji pops up; the spoon; "THANKS?!"
add(B.tPop, 'boing', -6, -0.4, 'Benji pops up from under the table');
add(B.tSpoon + 0.35, 'metal_clank', -6, -0.4, 'the spoon drops ("clink")');
add(B.tThanks, 'zoom_in', -4, -0.4, 'smash-zoom on THANKS?!');
// ---- 28–30. THE RULE card, +38 XP into the bar
add(B.tRuleCard, 'notify', -4, 0.4, 'NEW RULE UNLOCKED card');
add(B.tLine1, 'heart_pop', -8, 0.4, 'KINDNESS = +HP (THEM)');
add(B.tLine2, 'coin', -6, 0.4, '...AND +XP (YOU!)');
add(B.tXP, 'shine', -6, -0.2, 'star eyes');
add(B.tXP + 0.05, 'sparkle', -6, 0.2, '+38 XP pops');
add(B.tXPland, 'coin', -2, -0.6, '+38 XP lands in the bar');
add(B.tXPland + 0.05, 'money_counter', -10, -0.6, 'XP counts 12 → 50');
// ---- 31. he rubs his hands at the bar; whip into SC 06
for (let i = 0; i < 3; i++) add(C.stare + 0.95 + i * 0.35, 'cloth', -16, 0, 'rubbing his hands');
add(END - 0.1, 'whoosh', -8, 0.3, 'whip into SC 06');

// ================================================================= MUSIC (tiles [T0, END])
const music = [
  { start: T0, end: C.boss, mood: 'boss', energy: 0.75, in: 'cut', out: 'cut' },          // the stomp: boss music
  { start: C.boss, end: C.menu, mood: 'boss', energy: 1, in: 'cut', out: 'sting' },        // BOSS INTRO card
  { start: C.menu, end: C.saw, mood: 'boss', energy: 0.55, in: 'cut', out: 'tapestop' },   // the menu, "Lunch." → the music drops
  { start: C.saw, end: C.three, mood: 'silence', energy: 0, in: 'cut', out: 'cut' },        // "But then you saw it." (heartbeat)
  { start: C.three, end: C.complete, mood: 'tender', energy: 0.25, in: 'fade', out: 'cut' },  // the reveal, the tiny "?", the sandwich
  { start: C.complete, end: C.thanks, mood: 'quest', energy: 0.7, in: 'cut', out: 'sting' },  // QUEST COMPLETE! + the bite
  { start: C.thanks, end: C.benji, mood: 'tender', energy: 0.3, in: 'fade', out: 'cut' },    // Dad works nights · half, every day
  { start: C.benji, end: C.rule, mood: 'playful', energy: 0.5, in: 'cut', out: 'cut' },      // "Did Tank just say THANKS?!"
  { start: C.rule, end: END, mood: 'levelup', energy: 0.55, in: 'swell', out: 'cut' },       // THE RULE — the main theme creeps in
].map((s) => ({ ...s, start: r3(s.start), end: r3(s.end) }));

// ================================================================= AMBIENCE
const amb = [];
const bed = (a, b, name, g) => { if (b > a) amb.push({ start: r3(Math.max(a, T0)), end: r3(Math.min(b, END)), name, gain_db: g }); };
bed(T0, C.saw, 'crowd', -14);         // cafeteria chatter
bed(C.saw, C.benji, 'room', -22);     // the noise drops
bed(C.complete, C.thanks, 'crowd', -26);
bed(C.benji, END, 'crowd', -16);      // the room is back

// ================================================================= FOOTSTEPS (cycles from the scene code: steps every π/K s)
const steps = [];
const st = (a, b, iv, surface, g, pan) => { if (b > a) steps.push({ start: r3(Math.max(a, T0)), end: r3(Math.min(b, END)), interval: r3(iv), surface, gain_db: g, pan: r3(pan) }); };
st(T0, B.tArrive, Math.PI / 8.5, 'hard', -6, 0.35);                       // shStomp/shGulp: AC.walk((t - tStep0) * 8.5) — boots
st(C.benji, C.benji + 0.55, Math.PI / 8, 'hard', -12, 0.5);               // shBenji: AC.walk((t - CUT.benji) * 8) — Tank walks off
st(C.benji + 1.5, C.rule, Math.PI / 8, 'hard', -14, 0.6);
st(C.kind, C.xp, Math.PI / 7, 'hard', -16, -0.3);                          // shKind: walkFront((t - CUT.kind) * 7) — toward the doors

sfx.sort((a, b) => a[0] - b[0]);
const out = { scene: 'SC 05', start: r3(T0), end: r3(END), music, ambience: amb, footsteps: steps, sfx };
const file = path.join(__dirname, 'sc05.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log('wrote', file, '—', sfx.length, 'sfx,', music.length, 'music segments,', amb.length, 'ambience beds,', steps.length, 'footstep runs');
