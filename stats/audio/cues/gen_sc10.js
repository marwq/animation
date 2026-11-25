#!/usr/bin/env node
// Sound cue sheet generator for SC 10 · WITHOUT STATS (the climax payoff, no HUD): true silence after the HUD shattered,
// the colour bloom (harp + magic), the fair's sounds coming back (a dart pops a balloon, the booth bell, kids laughing),
// faces; the memory bubbles (pop + cute RAWRs at Biscuit / the toaster / Grandpa, the pillow fort) -> eureka; Benji's run +
// skid + the map; Tank's "I'm tall." boom, the kneel, the hop, the rise; the run (footsteps from the run cycles, whips,
// pass-bys), the slow-motion trio (heavy slow footfalls, glint, orch hit), the snoring kid on the slow Ferris wheel, the
// cotton-candy kid swarm, the smash zoom on DINOSAUR, "THERE!", the dash + Tank's boost + the leap (BOING on the inflatable),
// the climb squeaks, Max's RAWR, the hug, the crowd's applause, the high five (Benji lifted), the slide down the tail (slide
// whistle), Mom's hug, "...Can we do it again?" -> record scratch, a cricket, everybody laughs, the crane back.
// Every time comes from the voice timeline exactly like scenes/s10.js: the cut list (C) and beats (B) are built by
// scenes/s10_env.js times(V) — only L(id).a/.b and .word() — and the cycle rates match the scene's run/walk code. When the
// voice changes:   node audio/cues/gen_sc10.js && python3 audio/validate_cues.py audio/cues/sc10.json
// Output: audio/cues/sc10.json (absolute video seconds).
'use strict';

const fs = require('fs');
const path = require('path');
const V = require('../../scenes/vo');
const { times } = require('../../scenes/s10_env');
const { L } = V;

const { START: T0, END, C, B } = times(V);
const l = (i) => L('10.' + i);

// ---------------------------------------------------------------- helpers
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (x, a, c) => Math.max(a, Math.min(c, x));
const P = (sx) => r3(clamp(((sx - 960) / 960) * 0.7, -1, 1));     // pan from screen x
const sfx = [];
const add = (t, name, g, pan, note) => { if (t >= T0 - 0.3 && t < END) sfx.push([r3(t), name, g, typeof pan === 'number' ? r3(pan) : 0, note]); };

// ================================================================= SFX, shot by shot (same order as scenes/s10.js)
// ---- 1. the reverse of SC 09's last shot: his face, silent and grey; the last glints of the shattered HUD glass
add(T0 + 0.05, 'shine', -14, P(1220), 'the last glint of HUD glass settles');
add(T0 + 0.35, 'sparkle', -18, P(560), 'glints vanish');
add(B.open, 'blink', -10, P(700), 'his eyes widen');
// ---- 2. POV: the grey fair; he blinks — "Just colors." colour blooms back
add(C.pov, 'whoosh', -14, 0.3, 'cut: the grey, silent fair');
add(B.colors - 0.2, 'blink', -8, 0, 'he blinks');
add(B.colors - 1.4, 'reverse_swell', -8, 0, 'into the colour bloom');
add(B.colors, 'harp_up', -2, 0, 'COLOUR floods back');
add(B.colors + 0.05, 'magic', -8, 0, 'the warm ring of light spreads');
add(B.colors + 0.3, 'sparkle', -10, 0.3, 'motes in the golden light');
// ---- 3. "And sounds." the fair is alive again
add(C.sounds, 'whoosh', -10, 0.3, 'whip to the booth');
add(C.sounds + 0.05, 'kids_laugh', -8, P(140), 'a kid laughing and jumping');
add(B.pop - 0.25, 'swish', -10, -0.4, 'a dart flies');
add(B.pop, 'pop', 0, -0.4, 'the balloon pops');
add(B.pop + 0.08, 'bell', -6, -0.4, 'booth bell: winner!');
add(B.pop + 0.1, 'crowd_cheer', -12, 0, 'the booth crowd cheers');
// ---- 4. "And faces." the dolly across laughing faces
add(C.faces, 'whoosh', -10, 0.4, 'whip to the faces');
add(C.faces + 0.1, 'giggle', -8, 0, 'people laughing');
add(C.faces + 0.2, 'chime', -10, 0.4, 'golden light');
// ---- 5. the hero seeing faces for the first time
add(C.heroFace, 'whoosh', -14, -0.3, 'cut');
add(C.heroFace + 0.05, 'sparkle', -8, 0, 'eyes full of light');
// ---- 6. "And you didn't need stats to know your brother."
add(C.stand, 'whoosh', -12, -0.3, 'cut back to the bench');
add(B.up, 'cloth', -8, P(700), 'he turns to Grandpa, a step');
add(B.up + 0.2, 'step_soft', -12, P(700), 'step');
add(B.fist, 'cloth', -6, P(700), 'fist up, determined');
add(B.fist + 0.05, 'shine', -10, P(700), 'determination glint');
// ---- 7. thinking: memory bubbles of who Max IS
add(B.memA - 0.05, 'pop', -4, P(1330), 'memory bubble: Max loves dinosaurs');
add(B.memA + 0.1, 'music_box', -10, P(1330), 'memory');
add(C.rawrs, 'poof', -10, P(1330), 'the bubble bursts');
add(B.rawr1 - 0.1, 'pop', -4, P(1120), 'bubble: RAWR at Biscuit');
add(B.rawr1 + 0.02, 'monster_growl', -12, P(1120), 'tiny RAWR');
add(B.rawr1 + 0.15, 'squeak', -10, P(1220), 'Biscuit jumps');
add(B.rawr2 - 0.1, 'pop', -4, P(1610), 'bubble: RAWR at the toaster');
add(B.rawr2 + 0.02, 'monster_growl', -12, P(1610), 'tiny RAWR');
add(B.rawr2 + 0.1, 'pop', -8, P(1700), 'the toast pops');
add(B.rawr3 - 0.1, 'pop', -4, P(1360), 'bubble: RAWR at Grandpa');
add(B.rawr3 + 0.02, 'monster_growl', -12, P(1360), 'tiny RAWR');
add(B.rawr3 + 0.12, 'slide_up', -10, P(1460), 'Grandpa startled');
add(C.high, 'poof', -8, P(1360), 'the RAWR bubbles burst');
add(B.memC - 0.05, 'pop', -4, P(1340), 'bubble: Max on top of the pillow fort');
add(B.memC + 0.1, 'harp_up', -10, P(1340), 'up high');
add(B.eureka - 0.02, 'shine', 0, P(500), 'EUREKA: his eyes snap up');
add(B.eureka, 'zoom_in', -4, 0, 'camera punch');
add(B.eureka + 0.03, 'pop', -6, P(1340), 'the bubble bursts into sparkles');
// ---- 8. Benji skids in with the fair map
add(C.benji, 'whoosh', -10, 0.3, 'whip');
add(B.skid, 'skid', -2, P(1100), 'Benji skids to a stop');
add(B.mapOut, 'paper', -4, P(1000), 'the map whipped out');
// ---- 8b. the map insert: the route draws itself
add(C.mapIns, 'paper', -2, 0, 'the map unfolds');
for (let i = 0; i < 4; i++) add(C.mapIns + 0.3 + i * 0.18, 'tap', -14, -0.2 + i * 0.12, 'finger traces the route');
add(C.eleven - 0.12, 'pop', -10, 0.15, 'X marks the dinosaur');
// ---- 8c. "I've been here eleven times!" — the glint, the little trip on his laces
add(C.eleven + 0.45, 'shine', -4, P(980), 'glasses glint');
add(B.trip, 'slip', -8, P(1000), 'trips on his laces');
add(B.trip + 0.12, 'squeak', -12, P(1000), 'catches himself');
// ---- 9. TANK: "I'm tall." — low angle, the sun behind him
add(C.tank, 'sub_drop', -6, 0, 'a huge shadow');
add(C.tank + 0.05, 'step', -6, 0, 'heavy step');
add(C.tank + 0.4, 'step', -6, 0, 'heavy step');
add(l(4).word('tall').t0 + 0.05, 'boom', -6, 0, '"tall." (comedic boom)');
add(C.tank + 0.2, 'angel', -14, 0, 'sun halo behind his head');
// ---- 10. "Get on." — he kneels, pats his shoulder, the hero hops on
add(C.getOn, 'whoosh', -12, -0.2, 'cut');
add(B.kneel + 0.25, 'thud', -6, P(1080), 'Tank kneels');
for (const d of [0.3, 0.55]) add(B.kneel + d, 'tap', -10, P(1120), 'pat pat on the shoulder');
add(B.hop, 'jump', -4, P(800), 'the hero hops');
add(B.hop + 0.02, 'whoosh_up', -8, P(900), 'up');
add(B.hopLand, 'land', -4, P(1080), 'onto Tank\'s shoulders');
// ---- 11. the rise: Tank stands up, the hero over the crowd
add(C.rise, 'whoosh_up', -2, 0, 'Tank rises — crane up');
add(C.rise + 0.15, 'rumble', -14, 0, 'the big guy stands');
add(B.point, 'orch_hit', -4, 0.1, 'the hero points: GO!');
add(B.point + 0.02, 'shine', -6, 0.1, 'sun flare');
// ---- 12-14. the run
add(C.run1, 'whoosh_long', -6, 0, 'the charge at the camera');
add(C.run2, 'whoosh', -6, 0.5, 'whip: past the cotton candy');
add(C.run2 + 0.6, 'whoosh', -12, 0.2, 'pass-by');
add(C.run3, 'whoosh', -6, 0.5, 'whip: past the giant teacups');
add(C.run3 + 0.4, 'kids_laugh', -14, 0.3, 'teacup riders');
add(C.scan, 'whoosh_up', -8, 0, 'crane up over the fair');
add(C.scan + 0.2, 'wind_gust', -16, 0, 'high wide');
// ---- 16. the slow-motion trio: "The kid with level four. The kid with three health. And you."
add(C.trio - 0.02, 'impact', -6, 0, 'slow motion hits');
add(C.trio + 0.05, 'whoosh_long', -10, 0, 'into slow motion');
add(B.four + 0.3, 'shine', -2, P(800), 'Benji\'s glasses glint');
add(B.three + 0.05, 'cloth', -8, 0.1, 'Tank sets his jaw');
add(B.you - 0.05, 'whoosh_up', -8, 0, 'tilt up to the hero');
add(B.you + 0.1, 'orch_hit', -2, 0, '"And you."');
add(B.you + 0.12, 'shine', -6, 0.2, 'sun flare');
// ---- 17. "Not the Ferris wheel." / "Max hates the Ferris wheel."
add(C.notFerris, 'whoosh', -10, -0.3, 'cut');
add(C.notFerris + 0.3, 'paper', -10, P(900), 'map flaps');
add(C.hates, 'whoosh_up', -10, 0, 'tilt up to the wheel');
// ---- 18. "It's too slow." — the wheel barely turns, a kid asleep in a gondola
add(C.slow, 'whoosh', -10, 0.3, 'cut');
add(C.slow + 0.15, 'snore', -4, 0.1, 'the kid in the gondola snores');
add(C.slow + 0.3, 'squeak', -14, 0.1, 'slow creak of the wheel');
// ---- 19-20. "Cotton candy?" / "Every kid goes to cotton candy."
add(C.candy + 0.05, 'skid', -6, -0.2, 'Tank stops by the stand');
add(C.kids, 'whoosh', -10, 0.3, 'cut');
add(C.kids + 0.05, 'kids_laugh', -4, 0, 'a sugar-high swarm');
add(C.kids + 0.3, 'giggle', -10, 0.3, 'kids jumping');
add(C.kids + 0.5, 'gulp', -10, 0, 'the vendor is overwhelmed');
// ---- 21-24. "No." / "Max doesn't want sweets." / "DINOSAUR." / "Up high."
add(C.no, 'whoosh', -10, 0, 'cut');
add(C.no + 0.1, 'swish', -10, -0.1, 'head shake');
add(C.no + 0.28, 'swish', -10, 0.1, 'head shake');
add(C.sweets, 'zoom_in', -10, 0, 'slow push');
add(C.sweets + 0.8, 'heartbeat', -8, 0, 'thinking');
add(C.dino, 'zoom_in', 0, 0, 'SMASH ZOOM');
add(C.dino + 0.02, 'boom', -2, 0, 'DINOSAUR.');
add(C.dino + 0.05, 'shine', -4, 0, 'eyes light up');
add(C.there - 2.0, 'riser', -6, 0, 'he looks up... (build to THERE!)');
// ---- 25. "THERE!" — whip to the dinosaur
add(C.there, 'whoosh', 0, 0.5, 'whip to the dinosaur');
add(C.there + 0.03, 'impact', -2, 0.3, 'THERE!');
add(C.there + 0.2, 'crowd_cheer', -12, 0.3, 'the crowd below the dino');
// ---- 26. "On top of the dinosaur!" — Max on the head, kicking his legs
add(C.top, 'whoosh', -8, 0, 'cut to Max');
add(C.top + 0.4, 'squeak', -12, -0.1, 'inflatable squeaks');
add(C.top + 1.1, 'squeak', -12, 0, 'inflatable squeaks');
// ---- 27. the dash: Tank's boost, the leap, BOING
add(C.dash, 'whoosh', -6, -0.4, 'cut: the charge');
add(B.plant, 'skid', -4, P(900), 'Tank plants his feet');
add(B.plant + 0.1, 'cloth', -8, P(900), 'the hero stands up on his shoulders');
add(B.leap, 'jump', -2, P(900), 'the LEAP');
add(B.leap + 0.02, 'whoosh_up', -4, P(1000), 'flying onto the dinosaur');
add(B.leap + 0.1, 'crowd_gasp', -8, 0.2, 'the crowd gasps');
add(B.land, 'boing', 0, P(1100), 'BOING on the inflatable');
add(B.land + 0.05, 'squeak', -6, P(1100), 'vinyl squeak');
for (let t = B.land + 0.3; t < C.rawr; t += 0.26) add(t, 'squeak', -12, P(1150), 'climbing squeaks');
// ---- 28. MAX: "RAWR!" while the hero climbs the neck into view
add(C.rawr, 'whoosh_up', -8, 0, 'cut to the head');
add(B.rawr, 'monster_growl', -6, P(820), 'Max\'s RAWR (cute)');
add(B.rawr + 0.05, 'boing', -10, P(820), 'the dino head wobbles');
for (let t = C.rawr + 0.15; t < C.found; t += 0.24) add(t, 'squeak', -12, P(1200), 'climbing up the neck');
add(B.rawr + 0.4, 'crowd_cheer', -8, 0, 'the crowd cheers the climber');
// ---- 29. "Found you, T-rex." — the hug on top
add(C.found, 'whoosh', -12, -0.2, 'cut');
add(B.hug, 'cloth', -4, 0, 'the hug');
add(B.hug + 0.05, 'boing', -12, 0, 'the inflatable squishes');
add(B.hug + 0.2, 'sparkle', -12, 0, 'golden light');
// ---- 30-31. "I was the king of the dinosaurs! RAWR!" — the crowd below applauds
add(C.king, 'whoosh', -12, 0.2, 'cut');
add(B.stand, 'boing', -8, -0.1, 'Max stands up on the head');
add(B.stand + 0.1, 'crowd_cheer', -6, 0, 'cheers');
add(B.stand + 0.2, 'confetti', -10, 0, 'confetti from below');
add(C.below, 'whoosh_down', -6, 0, 'tilt down to the crowd');
add(B.roar, 'monster_growl', -4, -0.1, 'RAWR!');
add(B.roar + 0.15, 'crowd_cheer', 2, 0, 'the whole crowd RAWRs back');
add(B.roar + 0.3, 'applause', -2, 0, 'applause');
// ---- 32. the high five — Benji lifted into the air by it
add(C.high5, 'whoosh', -8, -0.4, 'cut down below');
add(B.high5 - 0.15, 'jump', -8, 0.1, 'Benji jumps for it');
add(B.high5, 'slap', 2, 0.05, 'HIGH FIVE');
add(B.high5 + 0.15, 'whoosh_up', -6, 0.1, 'Benji lifted into the air');
add(B.high5 + 0.3, 'giggle', -8, 0.1, 'Benji, dangling, delighted');
// ---- 33. the slide down the whole dinosaur
add(C.slide, 'whoosh_down', -8, 0, 'cut wide');
add(B.slide, 'slide_down', -2, -0.3, 'WHEEE down the neck and the tail');
add(B.slide + 0.4, 'squeak', -8, 0, 'vinyl squeak');
add(B.slideEnd, 'boing', -4, 0.5, 'off the tail tip');
add(B.slideEnd + 0.3, 'land', -6, 0.5, 'landing');
// ---- 34. MOM: "Don't you EVER do that again!"
add(C.mom, 'whoosh', -10, -0.4, 'cut: Mom runs in');
add(B.grab, 'thud', -6, 0, 'she scoops them up');
add(B.grab + 0.03, 'cloth', -4, 0, 'the hug');
add(B.ever, 'cloth', -6, 0, 'squeeze on EVER');
add(B.grab + 0.6, 'applause', -12, 0, 'the crowd: awww');
// ---- 35. MAX: "...Can we do it again?"
add(C.again, 'zoom_in', -10, 0.2, 'push in on Max');
add(C.again + 0.3, 'sparkle', -8, 0.2, 'huge hopeful eyes');
// ---- 36. Mom's deadpan ... everybody laughs
add(C.react, 'record_scratch', -2, 0, 'Mom\'s deadpan stare');
add(C.react + 0.15, 'cricket', -10, 0, 'beat');
add(B.laugh, 'crowd_laugh', -6, 0, 'everybody bursts out laughing');
add(B.laugh + 0.05, 'kids_laugh', -8, 0, 'the boys laugh');
// ---- 37. the crane back -> warm white (SC 11: the next morning)
add(C.pull, 'whoosh_long', -8, 0, 'crane back');
add(C.pull + 0.3, 'harp_up', -8, 0, 'balloons rise into the golden sky');
add(B.out, 'chime', -10, 0, 'warm white into the next morning');

sfx.sort((a, b) => a[0] - b[0]);

// ================================================================= music (tiles [T0, END])
const M = [];
const seg_ = (a, b, mood, energy, inn, out) => { if (b - a > 0.05) M.push({ start: r3(a), end: r3(b), mood, energy, in: inn, out }); };
seg_(T0, B.colors - 0.1, 'silence', 0, 'cut', 'cut');               // true silence after the HUD shattered
seg_(B.colors - 0.1, C.stand, 'wonder', 0.5, 'swell', 'cut');        // colours, sounds, faces: seeing for the first time
seg_(C.stand, C.think, 'tender', 0.4, 'fade', 'cut');                // "you didn't need stats to know your brother"
seg_(C.think, C.benji, 'search', 0.4, 'fade', 'cut');                // heartbeat: who Max IS -> eureka
seg_(C.benji, C.rise, 'search', 0.6, 'cut', 'cut');                  // Benji + the map, Tank: "Get on."
seg_(C.rise, C.trio, 'search', 0.95, 'swell', 'cut');                // the rise + the run
seg_(C.trio, C.notFerris, 'search', 1.0, 'swell', 'cut');            // the slow-motion heroic trio
seg_(C.notFerris, C.upHigh, 'search', 0.55, 'cut', 'sting');         // Ferris wheel? cotton candy? No... DINOSAUR.
seg_(C.upHigh, C.there, 'silence', 0, 'cut', 'cut');                 // "Up high." (the riser)
seg_(C.there, C.found, 'search', 1.0, 'cut', 'cut');                 // THERE! the dash, the leap, the climb
seg_(C.found, C.mom, 'anthem', 0.9, 'swell', 'cut');                 // found you, king of the dinosaurs, applause, the slide
seg_(C.mom, C.react, 'anthem', 0.55, 'cut', 'scratch');              // Mom's hug ... "Can we do it again?"
seg_(C.react, B.laugh, 'silence', 0, 'cut', 'cut');                  // Mom's deadpan
seg_(B.laugh, END, 'homey', 0.7, 'cut', 'fade');                     // everybody laughs -> the next morning

// ================================================================= ambience + footsteps
const amb = [];
const bed = (a, b, name, g) => { if (b - a > 0.05) amb.push({ start: r3(a), end: r3(b), name, gain_db: g }); };
bed(B.colors, C.run1, 'crowd', -16);                                 // the fair comes back (quieter at the bench)
bed(C.run1, C.there, 'crowd', -11);                                  // running through the crowd
bed(C.there, END, 'crowd', -9);                                      // the crowd at the dinosaur
bed(B.colors + 0.5, C.run1, 'birds', -20);                           // golden evening
bed(C.top, C.found, 'wind', -18);                                    // up on the dinosaur
const steps = [];
const run = (s0, s1, interval, surface, g, pan) => { if (s1 - s0 > 0.1) steps.push({ start: r3(clamp(s0, T0, END)), end: r3(clamp(s1, T0, END)), interval: r3(interval), surface, gain_db: g, pan: r3(pan) }); };
run(C.benji, B.skid, Math.PI / 15, 'soft', -8, 0.4);                 // Benji runs in: AC.run(t * 15)
run(C.tank, C.tank + 0.45, Math.PI / 8, 'soft', -6, 0);             // Tank steps in: walkFront(t * 8)
run(C.run1, C.run2, Math.PI / 14, 'soft', -6, 0);                   // the charge: frontRun((t - C.run1) * 14)
run(C.run2, C.scan, Math.PI / 13, 'soft', -6, 0);                   // side tracking: sideRun(t, 13)
run(C.scan, C.trio, Math.PI / 12, 'soft', -10, 0);                  // the crane: sideRun(t, 12)
run(C.trio, C.notFerris, Math.PI / 3.4, 'soft', -2, 0);             // slow motion: frontRun((t - C.trio) * 3.4)
run(C.notFerris, C.hates, Math.PI / 9, 'soft', -10, -0.2);          // walking: walkFront(ph * 9)
run(C.hates, C.slow, Math.PI / 8, 'soft', -12, 0.2);                // walkFront(t * 8)
run(C.dash, B.plant, Math.PI / 14, 'soft', -4, -0.3);               // the dash: sideRun(t, 14)
run(C.mom, B.grab, Math.PI / 14, 'soft', -8, -0.4);                 // Mom runs in: AC.run(t * 14)

const out = { scene: 'SC 10', start: r3(T0), end: r3(END), music: M, ambience: amb, footsteps: steps, sfx };
fs.writeFileSync(path.join(__dirname, 'sc10.json'), JSON.stringify(out, null, 1));
console.log(`sc10.json: ${sfx.length} sfx, ${M.length} music segments, ${amb.length} beds, ${steps.length} footstep runs`);
