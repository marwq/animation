#!/usr/bin/env node
// Sound cue sheet generator for SC 10 (ШОУ ТАЛАНТОВ БЕЗ РЕСПАУНА — the talent show, the climax).
// Every time is derived from the voice timeline through the SAME expressions the scene uses: scenes/s10_env.js
// times(V) (V = require('../../scenes/vo')) returns the cut table C and the beat table B that scenes/s10.js animates
// with. When the voice timeline changes, re-run:
//   node audio/cues/gen_sc10.js && python3 audio/validate_cues.py audio/cues/sc10.json
// Output: audio/cues/sc10.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { times, ST } = require('../../scenes/s10_env');

const TM = times(V);
const { START, END, C, B, n } = TM;
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r3 = (x) => Math.round(x * 1000) / 1000;
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));            // pan from screen x
const PW = (wx, cx = 960, z = 1) => P(960 + z * (wx - cx));               // world x seen by a camera centred on cx, zoom z
const tripAt = (u) => lerp(B.trip, B.land, u);                            // the act's slow-motion clock (s10.js tripU)

// ================================================================= music (tiles START..END)
const music = [
  { start: START, end: C.principal, mood: 'showtime', energy: 0.45, in: 'fade', out: 'cut' },          // perfect acts, the family
  { start: C.principal, end: C.noCp, mood: 'showtime', energy: 0.6, in: 'cut', out: 'sting' },          // the announcement -> "Science Magic!"
  { start: C.noCp, end: C.ladies, mood: 'mystery', energy: 0.35, in: 'fade', out: 'cut' },              // backstage nerves
  { start: C.ladies, end: B.trip, mood: 'showtime', energy: 0.55, in: 'swell', out: 'tapestop' },       // the act starts... the trip
  { start: B.trip, end: B.erupt, mood: 'silence', energy: 0.3, in: 'cut', out: 'cut' },                 // slow motion (sfx only)
  { start: B.erupt, end: B.gasp, mood: 'chaos', energy: 1, in: 'cut', out: 'scratch' },                 // KA-FOOSH -> SPLAT
  { start: B.gasp, end: B.scream + 0.45, mood: 'silence', energy: 0.3, in: 'cut', out: 'cut' },          // DEAD SILENCE, cricket, "Reset... RESET!"
  { start: B.scream + 0.45, end: C.slide, mood: 'tender', energy: 0.3, in: 'fade', out: 'fade' },       // Ivy's whisper: fail #313
  { start: C.slide, end: B.splash, mood: 'wonder', energy: 0.5, in: 'swell', out: 'cut' },              // she slides, he hesitates, he jumps
  { start: B.splash, end: n[10].a, mood: 'foam', energy: 1, in: 'cut', out: 'cut' },                    // the FOAM DISCO beat
  { start: n[10].a, end: C.noWin, mood: 'foam', energy: 0.75, in: 'cut', out: 'fade' },                 // chant, Mom, Bea, "Best. Disaster. Ever."
  { start: C.noWin, end: C.final, mood: 'warm', energy: 0.45, in: 'fade', out: 'cut' },                 // the trophies
  { start: C.final, end: END, mood: 'foam', energy: 0.7, in: 'swell', out: 'sting' },                   // the final two-shot -> SC 11
];

// ================================================================= ambience
const ambience = [
  { start: START, end: C.noCp, name: 'crowd', gain_db: -14 },          // the full house murmuring
  { start: C.noCp, end: C.ladies, name: 'crowd', gain_db: -22 },       // muffled through the curtain (backstage)
  { start: C.ladies, end: B.gasp, name: 'crowd', gain_db: -19 },
  // B.gasp .. C.slide: NOTHING — dead silence (only the cricket)
  { start: C.slide, end: END, name: 'crowd', gain_db: -13 },
];

// ================================================================= footsteps (cycles from s10.js: walk(t*K) / run(t*K) -> pi/K)
const footsteps = [
  { start: r3(C.mom), end: r3(B.momSit - 0.15), interval: r3(Math.PI / 13), surface: 'hard', gain_db: -13, pan: 0.45 },   // Mom hurries along the row
  { start: r3(C.walkOn + 0.15), end: r3(C.ladies), interval: r3(Math.PI / 11), surface: 'wood', gain_db: -11, pan: 0.4 }, // Ivy strides out onto the stage
  { start: r3(C.walk), end: r3(B.trip), interval: r3(Math.PI / 10), surface: 'wood', gain_db: -9, pan: -0.45 },           // the hero walks in with the tray
  { start: r3(C.slide), end: r3(B.dive), interval: r3(Math.PI / 16), surface: 'wood', gain_db: -8, pan: 0 },              // Ivy's run-up
  { start: r3(C.jump), end: r3(B.leap), interval: r3(Math.PI / 17), surface: 'wood', gain_db: -6, pan: -0.1 },            // his run-up
];

// ================================================================= SFX
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= START - 4 && t < END) sfx.push([r3(t), name, g, pan, note]); };

// whip-pans (s10.js whip(t, tc, dir) around these cuts)
const WHIPS = [[C.house, 1], [C.juggler, -1], [C.dad, -1], [C.sign, 1], [C.principal, -1], [C.noCp, 1], [C.people, 1], [C.walk, -1],
  [C.gasp, 1], [C.slide, 1], [C.disco2, 1], [C.foam1, -1], [C.foam3, 1], [C.mom2, -1], [C.phone, 1], [C.bea2, 1], [C.mushroom, -1],
  [C.best, 1], [C.noWin, -1], [C.pins, 1], [C.fair, -1]];
for (const [tc, d] of WHIPS) add(tc - 0.08, 'whoosh', -6, r3(0.3 * d), 'whip-pan');

// ---- Friday night: marquee, the full house, the perfect acts
add(START + 0.02, 'reverse_swell', -8, 0, 'fade in from white onto the TALENT SHOW marquee');
add(START + 0.35, 'sparkle', -10, P(1230), 'marquee bulbs chase, sparkles');
add(C.house + 0.3, 'powerdown', -14, 0, 'house lights dim over the full house');
add(C.juggler + 0.2, 'swish', -12, P(900), 'juggling pins');
add(C.juggler + 0.6, 'swish', -12, P(1020), 'juggling pins');
add(B.pin - 0.05, 'shine', -6, P(960), 'pin flourish, sparkles above her head');
add(C.twins + 0.25, 'tap', -10, P(800), 'twins: synchronized step');
add(C.twins + 0.65, 'tap', -10, P(1120), 'twins: synchronized step');
add(B.perfect - 0.05, 'tada', -3, 0, "twins' perfect final pose ('perfect')");
add(B.perfect, 'sparkle', -6, 0, 'sparkle burst over the twins');
add(B.perfect + 0.1, 'applause', -5, 0, 'the house applauds the perfect act');
// ---- the family
add(B.dadWave, 'pop', -9, P(800), 'Dad waves like a proud dad');
add(B.momSit, 'thud', -6, P(1000), 'Mom drops into her seat');
add(B.momSit + 0.1, 'cloth', -10, P(1000), 'phew! (scrubs, thermos)');
add(B.signUp - 0.1, 'paper', -6, P(860), 'Bea lifts her sign');
add(B.signUp, 'boing', -9, P(860), 'Bea bounces on Dad\'s lap');
add(C.sign + 0.2, 'heart_pop', -6, 0, 'GO MUSHROOM! sign close-up');
add(C.sign + 0.35, 'sparkle', -8, P(1420), 'sparkles on the sign, Bea peeks over the top');
// ---- the announcement
add(C.principal + 0.2, 'paper', -11, P(860), 'Pemberton holds her index card');
add(B.squint, 'blink', -10, 0, 'she squints at the card ("Ivy and...")');
add(B.spot - 0.02, 'impact', -3, P(1150), 'a spotlight SLAMS onto the hero in the wings ("you!")');
add(B.spot, 'shine', -6, P(1150), 'spotlight glare');
add(B.banner - 0.15, 'swish', -4, 0, 'the marquee flips...');
add(B.banner + 0.05, 'tada', -4, 0, '...to SCIENCE MAGIC!');
add(B.banner + 0.15, 'applause', -3, 0, 'applause');
// ---- backstage: no checkpoint, no reset, no pause menu
add(B.cp, 'error', -6, P(1280), "'no checkpoint': the dashed flag + red X");
add(C.noReset + 0.05, 'tap', -10, P(200), 'LIVES: 1 pill slides in');
add(B.reset - 0.05, 'ui_pop', -8, P(1380), 'RESET CHARACTER button (greyed, locked)');
add(B.reset + 0.15, 'buzzer_wrong', -6, P(1380), 'the locked button rattles');
add(B.snap, 'click', -1, P(1180), 'finger SNAP');
add(B.snap + 0.04, 'glitch', -4, P(760), 'the pause menu sputters');
add(B.snap + 0.45, 'error', -4, P(760), 'MENU UNAVAILABLE / RESPAWN DISABLED');
add(B.snap + 1.1, 'powerdown', -8, P(760), 'the menu collapses to a dot');
add(C.justYou + 0.1, 'heartbeat', -6, 0, 'just you... (knees knocking)');
for (let i = 0; i < 5; i++) add(lerp(B.four, B.people, i / 5), 'tap', -12, 0, 'PLAYERS IN SERVER counter rolls');
add(B.people, 'notify', -6, 0, 'PLAYERS IN SERVER: 400');
add(C.hands + 0.2, 'glass', -10, -0.1, 'flasks rattle on the shaking tray');
add(C.hands + 0.65, 'glass', -11, 0.1, 'clink');
add(C.hands + 1.05, 'heartbeat', -8, 0, 'heartbeat');
add(B.only - 0.1, 'gulp', -6, 0, 'he gulps ("Only one try.")');
add(C.oneTry + 0.3, 'cloth', -10, P(1400), "Ivy's hand on his shoulder");
add(C.ladies - 0.45, 'reverse_swell', -6, P(1745), 'Ivy strides into the bright stage light');
// ---- the act
add(B.spots - 0.02, 'impact', -1, 0, 'three spotlights SLAM on');
add(B.spots + 0.02, 'jump', -6, P(830), 'Ivy leaps into the light');
add(B.spots + 0.35, 'land', -6, P(830), 'Ivy lands, arms wide');
add(C.hat, 'drumroll', -7, 0, 'magician drumroll under her routine');
add(B.hatShow - 0.15, 'swish', -6, P(900), 'she flips the hat to show it empty');
add(B.hatShow + 0.25, 'magic', -6, P(900), 'wand tap on the hat');
add(C.walk + 0.25, 'glass', -14, -0.5, 'flasks clink as he walks in');
// the trip, slow motion
add(B.trip - 0.02, 'slip', -1, PW(ST.trip, 560, 2.6), 'his foot hooks the mic cable');
add(B.trip + 0.04, 'record_scratch', -6, 0, 'time stretches');
add(B.trip + 0.2, 'whoosh_long', -4, -0.2, 'slow-motion flight');
add(tripAt(0.12), 'glass', -6, -0.2, 'the flasks leave the tray');
add(tripAt(0.3), 'riser', -6, 0, 'riser toward the eruption');
add(tripAt(0.5), 'metal_clank', -3, PW(ST.mic, 900, 1.45), 'the mic stand topples over');
add(tripAt(0.7), 'metal_hit', -5, -0.1, 'the tray clatters on the floor');
add(tripAt(0.72), 'glass', -2, PW(935, 900, 1.45), 'green flask shatters');
add(tripAt(0.75), 'body_fall', 0, -0.3, 'he belly-flops onto the stage');
add(tripAt(0.9), 'glass', -4, PW(1215, 900, 1.45), 'yellow flask shatters');
add(B.land - 0.02, 'pop', -1, PW(ST.hat.x, 1000, 1.45), 'the pink flask drops INTO the hat');
// the eruption
add(B.erupt, 'big_splash', 3, PW(ST.hat.x, 1110, 0.86), 'KA-FOOSH! the hat erupts, way too early, huge');
add(B.erupt + 0.02, 'whoosh_up', 1, PW(ST.hat.x, 1110, 0.86), 'the foam column shoots up and curls over');
add(B.erupt + 0.1, 'steam_hiss', -5, PW(ST.hat.x, 1110, 0.86), 'foam hiss');
add(B.erupt + 0.15, 'bubbles', -5, 0.1, 'foam bubbling');
add(B.splat, 'splat', 3, PW(ST.prin, 1110, 0.86), 'SPLAT! it buries Principal Pemberton');
add(B.splat + 0.03, 'big_splash', -1, PW(ST.prin, 1110, 0.86), 'the foam lands');
add(B.gasp, 'crowd_gasp', 0, 0, 'the whole house GASPS');
// dead silence
add(B.chirp1, 'cricket', -6, -0.55, 'a cricket on the stage lip: chirp');
add(B.chirp1 + 0.45, 'cricket', -8, -0.55, 'chirp');
add(B.drip - 0.35, 'blink', -14, 0.5, "the principal's slow deadpan blink");
add(B.drip + 0.3, 'pop', -14, 0.5, 'plip: a foam drop falls off the principal');
// "Reset... reset... RESET!"
add(B.snap1, 'click', -2, 0.1, 'snap: "Reset..."');
add(B.snap1 + 0.05, 'glitch', -12, 0, 'a tiny menu flicker... nothing');
add(B.snap2, 'click', -2, 0.1, 'snap: "reset..."');
add(B.snap2 + 0.02, 'reverse_swell', -8, 0, 'a ghost of the RESPAWNING overlay flickers up');
add(B.snap2 + 0.1, 'glitch_long', -7, 0, 'it glitches');
add(B.snap2 + 0.35, 'powerdown', -6, 0, '...and dies');
add(B.scream - 0.05, 'zoom_in', -5, 0, 'smash zoom: "RESET!"');
add(B.scream + 0.1, 'error', -6, -0.7, 'LIVES: 1 pulses red');
// Ivy's whisper
add(B.book, 'paper', -8, 0.2, 'Ivy opens the BOOK OF FAILS');
add(B.n313, 'tap', -10, 0.2, '#313 circled');
add(B.wink, 'sparkle', -6, 0.2, 'the wink');
add(B.wink + 0.25, 'thud', -12, 0.2, 'she snaps the book shut');
add(B.wink + 0.4, 'cloth', -10, 0.2, 'she springs up');
// the slide, the hesitation, the jump
add(B.dive, 'jump', -4, 0, 'Ivy dives');
add(B.dive + 0.08, 'slide_down', -2, 0.1, 'WHEEE! belly-slide across the foam');
add(B.plunge, 'big_splash', -2, 0.3, 'SPLOOSH into the mound');
add(B.plunge + 0.3, 'giggle', -10, 0.2, 'a few giggles in the house');
add(C.hesitate + 0.2, 'heartbeat', -8, 0, 'he hesitates');
add(B.gulp, 'gulp', -4, 0, 'gulp');
add(B.breath, 'reverse_swell', -8, 0, 'deep breath');
add(B.leap, 'jump', -2, -0.1, 'he LEAPS');
add(B.leap + 0.05, 'whoosh_up', -4, 0, 'leap');
add(B.leap + 0.35, 'fall_whistle', -6, 0.1, 'cannonball!');
add(B.splash, 'big_splash', 3, 0.1, 'KER-SPLOOSH');
add(B.splash + 0.04, 'splash', 0, 0.1, 'splash body');
// ---- the FOAM DISCO
add(C.disco + 0.05, 'boing', -2, 0, 'they burst up out of the foam');
add(C.disco + 0.2, 'crowd_cheer', 0, 0, 'the house explodes');
add(C.disco + 0.3, 'confetti', -2, 0, 'confetti');
add(B.ball, 'slide_down', -8, 0, 'the disco ball drops from the flies');
add(B.ball + 0.8, 'shine', -4, 0, 'disco ball glints, beams start sweeping');
add(C.disco2 + 0.15, 'slide_down', -4, 0.3, 'Ivy rides the foam mound like a slide');
add(C.disco2 + 0.6, 'splash', -6, 0.1, 'foam spray');
B.chant.forEach((tw, i) => add(tw, 'thud', -8, 0, `FOAM! #${i + 1}: the house stomps`));
add(n[10].a + 0.05, 'crowd_cheer', -3, 0, 'FOAM! FOAM! chant');
add(B.chant[1] + 0.32, 'splat', -4, 0.5, 'a foam moustache lands on the principal');
add(B.chant[1] + 0.36, 'sparkle', -8, 0.5, 'moustache sparkle');
add(B.chant[2], 'applause', -4, -0.4, 'kids rush the stage edge, fists pumping');
add(B.chant[3] + 0.05, 'splat', -1, -0.3, 'WHOMP! the snowman gets its head');
add(B.chant[3] + 0.1, 'poof', -6, -0.3, 'foam puff');
add(C.mom2 + 0.1, 'crowd_laugh', -8, 0, 'Dad crying with laughter, Mom filming');
add(B.sent, 'notify', -4, 0, 'SENT! to WHOLE FAMILY (47)');
add(B.sent + 0.05, 'confirm', -6, 0, 'check mark');
add(C.bea2 + 0.2, 'boing', -9, 0.3, 'Bea bouncing on her chair');
add(B.brother - 0.03, 'zoom_in', -6, 0.3, 'punch-in: "THAT\'S MY BROTHER!"');
add(B.mush - 0.1, 'paper', -6, 0, 'crayon doodle scribbles around him');
add(B.mush, 'tada', -6, 0, 'the mushroom pose');
add(B.disaster - 0.03, 'impact', -8, 0.3, 'punch-in: "Disaster."');
add(B.ever - 0.03, 'impact', -6, 0.3, 'punch-in: "Ever."');
add(B.ever + 0.65, 'pop', -12, 0.35, 'a drop falls off the foam moustache');
add(B.smile, 'sparkle', -6, 0.3, 'the stern principal cracks a tiny smile');
add(n[13].b + 0.1, 'crowd_laugh', -6, 0, 'the house laughs');
// ---- the trophies
add(B.notWin - 0.1, 'whoosh', -8, 0.2, 'the 1st-place trophy goes right past him');
add(B.notWin + 0.1, 'sad_trombone', -8, -0.1, 'deflated hero');
add(C.pins + 0.4, 'swish', -12, 0.4, 'juggling pins');
add(B.won - 0.05, 'tada', -2, 0.35, 'the girl with seven bowling pins WON');
add(B.won, 'applause', 0, 0, 'applause');
add(B.won + 0.05, 'confetti', -4, 0.35, 'confetti');
add(B.won + 0.1, 'shine', -6, 0.35, 'trophy on her head glints');
add(B.fair, 'applause', -6, -0.3, '"Fair." — they nod and clap');
add(B.most - 0.05, 'achievement', -2, -0.2, 'MOST UNFORGETTABLE ACT goes up over his head');
add(B.most + 0.05, 'shine', -4, -0.2, 'trophy shine');
add(B.most + 0.15, 'crowd_cheer', -4, 0, 'cheer');
add(B.told + 0.2, 'kids_laugh', -8, 0, 'they crack up laughing');
add(B.fun, 'confetti', -2, 0, 'block confetti burst ("fun part!")');
add(B.fun + 0.05, 'crowd_cheer', -2, 0, 'cheer');
add(C.final2 + 0.1, 'applause', -2, 0, 'pull back: the whole house on its feet');
add(END - 0.3, 'big_splash', -3, 0, 'foam wipe out to SC 11');
add(END - 0.25, 'bubbles', -6, 0, 'foam bubbles cover the frame');

sfx.sort((a, b) => a[0] - b[0]);
const out = { scene: 'SC 10', start: r3(START), end: r3(END), music: music.map((m) => ({ ...m, start: r3(m.start), end: r3(m.end) })), ambience: ambience.map((a) => ({ ...a, start: r3(a.start), end: r3(a.end) })), footsteps, sfx };
const file = path.join(__dirname, 'sc10.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log('wrote', file, `(${sfx.length} sfx, ${music.length} music segments)`);
