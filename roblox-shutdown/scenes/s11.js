// SC 11 · TEN SECONDS — the Lag deflates like a balloon into Buffer, a hamster-sized loading wheel: "...hi."
// The wall timer 00:00:03 → 00:00:02 → 00:00:01 → stops. SYSTEM: "Lag... not found. Shutdown... canceled!" — the red
// alarm palette flips to green; "Thanks for playing! Smiley face." while a green wave climbs the tower, races through
// the rack hall and the Archive's bubbles get their colours back. "We did it!" — "Ten seconds. That's all the world
// needed." — Dex runs in with a blade of grass — "Can I keep him?" — "...Fine. But you're feeding him."
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const { L } = K.V;
const C = K.C;
const A = require('./acting');
const F = require('./farm');
const LG = require('../rig/lag');
const E = require('./s09_env');
const { CORE, FL, camAt, pop, who, SOOT, SOOT_SIDE, runSide, coreShot, R, P, CI, EL, G, tr, OUT, TS, TFS, GREEN } = E;

const START = K.V.scene('SC 11').start, END = K.V.scene('SC 12').start;
const m = (i) => L('11.' + i);
const M = Array.from({ length: 9 }, (_, i) => m(i));
const tDefl = L('10.14').b + 0.04;                 // the deflation started at the end of SC 10
const tLand = tDefl + E.DEFLATE.dur;

// ---------------------------------------------------------------- beats
const b1 = Math.max(START, tLand + 0.02);           // Buffer: "...hi."
const b2 = M[1].a - 0.1;                            // the wall timer: 3 → 2 → 1 → stop; "Lag... not found."
const tFound = M[1].word('found').t0;
const b3 = M[1].word('Shutdown').t0 - 0.1;          // "Shutdown... canceled!" — green
const tCancel = M[1].word('canceled').t0;
const b4 = M[2].a - 0.1;                            // "Thanks for playing!" — green wave up the tower
const tSmiley = M[2].word('Smiley').t0;
const b5 = M[2].b + 0.2;                            // rack hall goes green
const b6 = b5 + 1.15;                               // the Archive: colour comes back
const b7 = M[3].a - 0.1;                            // "We did it!"
const b8 = M[4].a - 0.15;                           // Grandpa: "Ten seconds."
const b9 = M[5].a - 0.1;                            // Dex runs in with grass
const tTouched = M[5].word('TOUCHED', 1).t0;
const b10 = M[6].a - 0.25;                          // "We know, Dex."
const b11 = M[7].a - 0.1;                           // Pip: "Can I keep him?"
const b12 = M[8].a - 0.1;                           // "...Fine. But you're feeding him."
const tFeed = M[8].word('feeding').t0;

// ---------------------------------------------------------------- countdown + colour
const secAt = (t) => Math.max(1, 3 - (t - START));
const greenAt = (t) => seg(t, tCancel - 0.05, tCancel + 0.25);
function coreOpts(t, extra = {}) {
  const g = greenAt(t);
  return { alarm: g > 0.5 ? 0 : 1, green: g, greenWave: t < b4 ? g * 0.15 : 1, timer: K.clock(secAt(t)), broadcast: 1, dots: 0, spam: false, ...extra };
}
const glow = (t) => (t > tCancel ? GREEN : '#FF5A6E');

// ---------------------------------------------------------------- shots
// B1: tiny Buffer on the grate — "...hi."
function shotHi(t) {
  const cam = K.camKeys(t, [[b1, camAt(E.DEFLATE.land[0], FL - 95, 3.0)], [b2, camAt(E.DEFLATE.land[0], FL - 100, 3.15)]]);
  const talk = K.V.viseme('LAG', t);
  const open = talk && talk !== 'X' && talk !== 'A';
  const blink = bump(t, M[0].b + 0.05, M[0].b + 0.2);
  let chars = who('juno', t, { x: 2540, y: FL + 20, s: 0.5, turn: 0.4, armL: 10, armR: 10, face: 'shocked', volume: false }, { arms: false });
  chars += who('pip', t, { x: 2990, y: FL + 25, s: 0.5, turn: -0.4, armL: 10, armR: 10, face: 'amazed', volume: false }, { arms: false });
  chars += LG.buffer({ x: E.DEFLATE.land[0], y: FL, s: 0.75, t, mood: open ? 'surprised' : 'happy', blink, hop: 0, look: [0.2, -0.5] });
  return coreShot(t, cam, coreOpts(t), chars);
}
// B2/B3: the wall timer — 00:00:03 → 00:00:01, stop; "Lag... not found." → "Shutdown... canceled!" (green)
function shotWall(t) {
  const cam = E.shakes(K.camKeys(t, [[b2, { zoom: 2.0, x: 0, y: -700 }], [b4, { zoom: 2.15, x: 0, y: -720 }]]), t, [[tCancel, 0.4, 14]]);
  let o = coreShot(t, cam, coreOpts(t), '');
  // stuck digits: a stopped clock jitters once
  const stop = seg(t, START + 2.0, START + 2.15);
  if (stop > 0 && stop < 1) o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: 0.12 });
  const pk = seg(t, tFound - 0.05, tFound + 0.25);
  const out = seg(t, tCancel - 0.2, tCancel);
  if (pk > 0 && out < 1) o += K.popup(960, 760, 760, 200, 'SYSTEM', ['Lag... not found.'], pk * (1 - out), { size: 46, icon: '?' });
  // CANCELED stamp
  const sk = seg(t, tCancel, tCancel + 0.18);
  if (sk > 0) o += G(R(-420, -90, 840, 180, 26, { fill: 'none', stroke: GREEN, 'stroke-width': 18 }) + T('CANCELED!', 0, 50, 140, GREEN, OUT(10)), `translate(960 780) rotate(-8) scale(${f(lerp(2.4, 1, ease.out(sk)))})`, { opacity: f(sk) });
  o += E.flashAt(t, tCancel, 0.85, 0.25);
  return o;
}
// B4: the green wave climbs the tower — "Thanks for playing! Smiley face."
function shotWave(t) {
  const u = seg(t, b4, b5);
  const la = E.lowAngle(t, { alarm: 0, green: 1, greenWave: ease.inOut(u), lift: lerp(-200, 260, ease.inOut(u)), lamps: 1 });
  let o = la.bg;
  // sparkles rising with the wave
  for (let i = 0; i < 14; i++) {
    const ph = (t * 0.6 + hash(i)) % 1;
    o += K.F.sparkle(hash(i * 3.3) * 1920, 1080 - ph * 1200, 14 + 10 * Math.sin(t * 5 + i));
  }
  o += la.fg;
  const pk = seg(t, b4 + 0.05, b4 + 0.35);
  o += K.popup(960, 720, 760, 200, 'SYSTEM', ['Thanks for playing! :)'], pk, { size: 46, accent: '#2EB85C', icon: '✓' });
  const sk = seg(t, tSmiley, tSmiley + 0.25);
  if (sk > 0) o += G(CI(0, 0, 70, ol('#FFE14D', 8)) + CI(-22, -14, 9, { fill: '#151515' }) + CI(22, -14, 9, { fill: '#151515' }) + P('M-34 14 Q0 50 34 14', ln(9)), `translate(1360 640) rotate(${f(10 * Math.sin(t * 4))}) scale(${f(pop(sk))})`);
  return o;
}
// B5: the rack hall lights up green, rack after rack
function shotHall(t) {
  const u = seg(t, b5, b6);
  const cam = { zoom: 1.0, x: lerp(0, 200, u), y: 0 };
  const Ly = F.rackHall(t, cam, { green: 1, greenWave: ease.inOut(u) });
  return Ly.bg + Ly.mid + Ly.fg + Ly.light;
}
// B6: the Archive — the grey bubbles get their colour back; Bubble Island shines
function shotArchive(t) {
  const u = seg(t, b6, b7);
  const cam = { zoom: lerp(1.15, 1.4, ease.inOut(u)), x: lerp(220, 30, ease.inOut(u)), y: lerp(10, 70, ease.inOut(u)) };
  const Ly = F.archive(t, cam, { greyFrom: lerp(0.33, 1.05, ease.inOut(seg(t, b6, b7 - 0.2))), glow: 1 });
  let o = Ly.bg + Ly.mid + Ly.fg + (Ly.light || '');
  const J = F.ARCHIVE.juno;
  o += K.view(cam, K.sparkles([[J.x - 70, J.y - 60, 22], [J.x + 70, J.y - 40, 16], [J.x, J.y - 90, 26]], t), 1);
  return o;
}
// B7: "We did it! We actually DID it!"
function shotDidIt(t) {
  const cam = K.camKeys(t, [[b7, camAt(3150, 520, 1.15)], [b8, camAt(3150, 510, 1.25)]]);
  const hop = (ph) => Math.max(0, Math.sin(t * 7 + ph)) * 60;
  let chars = who('grandpa', t, { x: 3420, y: FL, s: 0.5, turn: -0.3, armL: 40 + 30 * Math.sin(t * 9), armR: 40 + 30 * Math.sin(t * 9 + 1), face: 'joy', keysSwing: 20 * Math.sin(t * 9) }, { arms: false });
  chars += who('pip', t, { x: 3250, y: FL + 20, s: 0.5, lift: hop(1.5), armL: 160, armR: 160, face: 'excited' }, { arms: false });
  chars += LG.buffer({ x: 3330, y: FL + 22, s: 0.6, t, mood: 'happy', hop: Math.max(0, Math.sin(t * 7 + 2.5)) });
  chars += who('juno', t, { x: 2980, y: FL + 30, s: 0.56, lift: hop(0), armL: 150 + 15 * Math.sin(t * 14), armR: 150 + 15 * Math.cos(t * 14), face: { name: 'joy', fx: ['tears'] } }, { arms: false, energy: 1.2 }, SOOT);
  let o = coreShot(t, cam, coreOpts(t), chars);
  o += K.view(cam, K.sparkles([[2900, 300, 26], [3300, 260, 20], [3100, 200, 30], [2800, 420, 18]], t), 1);
  if (t < b7 + 0.6) o += K.confetti(t, b7, 50, 7);
  return o;
}
// B8: Grandpa — "Ten seconds. That's all the world needed."
function shotGrandpa(t) {
  const cam = K.camKeys(t, [[b8, camAt(3160, 470, 1.85)], [b9, camAt(3170, 460, 2.0)]]);
  let chars = who('juno', t, { x: 2990, y: FL + 10, s: 0.52, turn: 0.55, armL: 10, armR: 14, face: { name: 'happy', fx: ['blush'], eyes: { look: [1, -0.3] } } }, { arms: false }, SOOT);
  chars += who('grandpa', t, { x: 3300, y: FL, s: 0.56, turn: -0.4, armL: 70, armR: 14, keysSwing: 4 * Math.sin(t * 2) }, { arms: false, energy: 0.5 });
  let o = coreShot(t, cam, coreOpts(t), chars);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FFE3A3', opacity: 0.08 });
  return o;
}
// B9: Dex runs in with a blade of grass — "I TOUCHED GRASS!"
function grassBlade(x, y, s = 1, rot = 0) {
  return G(P('M0 0 Q-10 -60 4 -150 Q14 -60 12 0 Z', ol('#4CC35E', 5)) + P('M4 -10 Q2 -60 5 -130', ln(3, '#2E9C47')), tr(x, y, s, rot));
}
function shotDex(t) {
  const stop = tTouched - 0.35;
  const running = t < stop;
  const x = running ? lerp(2200, 2840, seg(t, b9, stop)) : 2840;
  const cam = K.camKeys(t, [[b9, camAt(2400, 520, 1.3)], [stop, camAt(2860, 500, 1.5)], [b10, camAt(2880, 480, 1.6)]]);
  let chars = who('juno', t, { x: 3150, y: FL, s: 0.52, turn: -0.5, armL: 10, armR: 20, face: { name: 'happy', eyes: { look: [-1, 0] } } }, { arms: false }, SOOT);
  let dex;
  if (running) {
    const hand = E.sideHand(150);
    dex = runSide('dex', t, x, FL, 0.55, { rate: 16, pose: { armL: 150, props: [{ svg: grassBlade(hand[0], hand[1], 0.9, -20), layer: 'front' }] }, act: { face: 'excited' } });
  } else {
    const hold = A.hand(165, 1);
    dex = who('dex', t, { x, y: FL, s: 0.55, turn: 0.2, armR: 165, armL: 40, lift: 40 * bump(t, tTouched, tTouched + 0.4), face: { name: 'excited', eyes: { type: 'star' } }, props: [{ svg: grassBlade(hold[0], hold[1] + 20, 1.1, 0), layer: 'front' }] }, { arms: false });
  }
  chars += dex;
  let o = coreShot(t, cam, coreOpts(t), chars);
  if (!running) o += K.view(cam, K.sparkles([[x + 160, FL - 760, 30], [x + 230, FL - 680, 20], [x + 110, FL - 640, 18]], t) + C.burst(x + 170, FL - 700, seg(t, tTouched, tTouched + 0.5), GREEN), 1);
  return o;
}
// B10: "We know, Dex. We know."
function shotKnow(t) {
  const cam = K.camKeys(t, [[b10, camAt(3060, 520, 1.25)], [b11, camAt(3060, 520, 1.3)]]);
  const hold = A.hand(150, 1);
  let chars = who('grandpa', t, { x: 3360, y: FL - 10, s: 0.48, turn: -0.4, armL: 20, armR: 30, face: 'joy', volume: false }, { arms: false });
  chars += who('dex', t, { x: 2820, y: FL, s: 0.55, turn: 0.4, armR: 150, armL: 30, face: { name: 'excited', eyes: { type: 'star' } }, props: [{ svg: grassBlade(hold[0], hold[1] + 20, 1.1, 0), layer: 'front' }] }, { arms: false });
  chars += who('pip', t, { x: 3200, y: FL + 20, s: 0.5, turn: -0.2, armL: -25, armR: -25, face: 'happy', volume: false }, { arms: false });
  chars += LG.buffer({ x: 3200, y: FL - 245, s: 0.45, t, mood: 'happy' });
  chars += who('juno', t, { x: 3050, y: FL + 30, s: 0.55, turn: -0.3, armL: 20, armR: 60 + 20 * Math.sin(t * 6), face: 'joy' }, { arms: false, energy: 1.0 }, SOOT);
  return coreShot(t, cam, coreOpts(t), chars);
}
// B11: Pip cups Buffer in his hands — "Can I keep him?"
function shotKeep(t) {
  const u = seg(t, b11, b12);
  let o = R(0, 0, 1920, 1080, 0, { fill: '#0A1A14' }) + CI(960, 600, 900, { fill: 'url(#farmGlowGreen)', opacity: 0.55 });
  for (let i = 0; i < 9; i++) o += CI(hash(i * 3.7) * 1920, hash(i * 5.1) * 900, 40 + hash(i) * 70, { fill: '#46F58C', opacity: f(0.08 + 0.06 * Math.sin(t * 1.5 + i)) });
  const z = lerp(1, 1.06, u);
  let g = who('pip', t, { x: 960, y: 1186, s: 1.6, turn: 0, armL: -22, armR: -22, face: { name: 'cute', eyes: { look: [0, 0.6] } }, shadow: false }, { arms: false, energy: 0.3 });
  g += LG.buffer({ x: 960, y: 880, s: 1.8, t, mood: t > M[7].word('keep').t0 ? 'love' : 'happy', look: [0, -1], blink: bump(t, b11 + 0.4, b11 + 0.55) });
  o += G(g, `translate(960 540) scale(${f(z)}) translate(-960 -540)`);
  return o;
}
// B12: "...Fine. But you're feeding him." — Buffer chomps Dex's blade of grass
function shotFine(t) {
  const cam = K.camKeys(t, [[b12, camAt(3060, 500, 1.4)], [END, camAt(3060, 520, 1.25)]]);
  const sigh = bump(t, M[8].a - 0.1, M[8].word('But').t0);
  const jump = seg(t, tFeed - 0.1, tFeed + 0.35);
  const chomp = seg(t, tFeed + 0.35, tFeed + 0.8);
  const hold = A.hand(120, -1);
  const dexX = 3330;
  const bx = lerp(3150, dexX + hold[0] * 0.55, ease.inOut(jump)), by = lerp(FL - 260, FL + (hold[1] - 30) * 0.55, ease.inOut(jump)) - Math.sin(jump * Math.PI) * 120;
  let chars = who('grandpa', t, { x: 3500, y: FL - 10, s: 0.46, turn: -0.4, armL: 20, armR: 20, face: 'joy', volume: false }, { arms: false });
  chars += who('dex', t, { x: dexX, y: FL, s: 0.55, turn: -0.4, armL: 120, armR: 20, face: chomp > 0 ? 'shocked' : 'happy', props: chomp < 1 ? [{ svg: G(grassBlade(hold[0], hold[1] + 20, 1.1, 0), null, {}), layer: 'front' }] : [] }, { arms: false });
  chars += who('pip', t, { x: 3150, y: FL + 20, s: 0.5, turn: 0.1, armL: -22, armR: -22, face: jump > 0 ? 'amazed' : 'happy', volume: false }, { arms: false });
  chars += who('juno', t, { x: 2870, y: FL + 30, s: 0.56, turn: 0.4, armL: 20, armR: jump > 0 ? 70 : 20, bodyY: 12 * sigh, face: t < M[8].word('But').t0 ? { name: 'deadpan', eyes: { type: 'closed' } } : 'smug' }, { arms: false, energy: 0.6 }, SOOT);
  chars += LG.buffer({ x: bx, y: by, s: 0.45, t, mood: chomp > 0 ? 'love' : 'happy', hop: jump > 0 && jump < 1 ? 0.5 : 0 });
  let o = coreShot(t, cam, coreOpts(t), chars);
  if (chomp > 0 && chomp < 1) o += K.view(cam, K.bang('nom!', bx + 90, by - 120, seg(t, tFeed + 0.35, tFeed + 0.45), 50, -8, GREEN), 1);
  return o;
}

// ---------------------------------------------------------------- router
function scene(t) {
  E.STATE.wall = false;
  if (t < b1) return E.shotDeflate(t, tDefl, { timer: K.clock(secAt(t)) });
  if (t < b2) return shotHi(t);
  if (t < b4) return shotWall(t);
  if (t < b5) return shotWave(t);
  if (t < b6) return shotHall(t);
  if (t < b7) return shotArchive(t) + E.flashAt(t, b6, 0.3);
  if (t < b8) return shotDidIt(t);
  if (t < b9) return shotGrandpa(t);
  if (t < b10) return shotDex(t) + E.whip(t, b9, 1);
  if (t < b11) return shotKnow(t);
  if (t < b12) return shotKeep(t);
  return shotFine(t);
}
function timer(t) {
  if (E.STATE.wall) return null;
  if (t > tCancel) return null;                 // drawn by overlay() in green
  return { sec: secAt(t), glitch: t < b2 ? 0.5 : 0 };
}
function overlay(t) {
  if (t <= tCancel || E.STATE.wall) return '';
  if (t >= b11 && t < b12) return '';           // the quiet Pip close-up
  return E.greenPill(1, t, seg(t, tCancel, tCancel + 0.3));
}
const look = (t) => (t < tCancel ? { grade: 'cool', vignette: 1 } : { grade: 'warm', vignette: 0.8 });

module.exports = { scene, timer, overlay, look, secAt };
