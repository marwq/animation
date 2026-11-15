// SC 05 · ГЛЮК — midnight in the attic: Juno almost done (12 islands, 300 bubbles), the game starts lagging, the Lag
// bites bubbles like cookies ("bub... bub... bubbles"), "I... am... the LAAAG", "more... FOOD", "Your game has three
// visits" ("...Rude."), the lag spills into real life (the pencil freezes mid-air, the cat rubber-bands), Grandpa comes up
// the hatch with a flashlight: 30 years night janitor at the Server Farm, 99 keys + the locker with the 1998 sandwich,
// a sepia flashback (young Otto shoos a tiny Lag with his mop), he feeds on traffic, the whole world is rushing, they
// want to starve him — and the glowing golden key: "Get your helmet, builder."
// Countdown: 18:00:00 ticking in real time, glitching more and more while the Lag is around (hidden in the flashback).
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const C = K.C;
const AC = require('./acting');
const SETS = require('./sets');
const FARM = require('./farm');
const X = require('./s04_env');
const { tf, TS, TFS, pop, at, shakeAll, clipTo, whip, smash, freezeAt, check, stamp, bloxy } = X;
const { lag } = require('../rig/lag');
const { keyRing, mop } = require('../rig/cast');
const { makeDesign } = require('../rig/r6');
const { drawCharacter } = require('../rig/body');
const L3 = require('../rig/looks3');
const { SPOTS } = SETS;

const B = Array.from({ length: 21 }, (_, i) => L('05.' + i));
const T0 = K.V.scene('SC 05').start, END = K.V.scene('SC 06').start;
const w = (i, word, n = 0) => B[i].word(word, n).t0;
const LINE = '#151515';

// ---------------------------------------------------------------- cuts (all from the voice)
const d01 = T0, tMid = w(0, 'midnight'), tDone = w(0, 'done');
const d02 = w(0, 'Twelve') - 0.1, tTwelve = w(0, 'Twelve'), tThree = w(0, 'Three');
const d03 = w(0, 'One') - 0.1, tTired = w(0, 'tired'), tBuilder = w(0, 'builder');
const d04 = B[1].a - 0.15, tStarted = w(1, 'started'), tLagging = w(1, 'lagging');
const d05 = B[2].a - 0.1, tMmm = B[2].a, tBub1 = w(2, 'bub'), tBub2 = w(2, 'bub', 1), tBubbles = w(2, 'bubbles');
const d06 = B[3].a - 0.08;
const d07 = B[4].a - 0.1, tI = B[4].a, tAm = w(4, 'am'), tThe = w(4, 'the');
const d08 = w(4, 'LAAAG') - 0.12, tLAAAG = w(4, 'LAAAG');
const d09 = B[5].a - 0.15, tMore1 = B[5].a, tMore2 = w(5, 'more', 1), tRushing = w(5, 'rushing'), tMore3 = w(5, 'more', 2);
const d10 = w(5, 'FOOD') - 0.12, tFood = w(5, 'FOOD');
const d11 = B[6].a - 0.1, tMY = w(6, 'MY');
const d12 = B[7].a - 0.1, tYour = B[7].a, tGame7 = w(7, 'game'), tHas = w(7, 'has'), tThree7 = w(7, 'three'), tVisits = w(7, 'visits');
const d13 = w(7, 'Nobody') - 0.1, tNobody = w(7, 'Nobody'), tWill = w(7, 'will'), tMiss = w(7, 'miss'), tIt = w(7, 'it');
const d14 = B[8].a - 0.12;
const d15 = B[9].a - 0.12, tCat = w(9, 'cat'), tLagged = w(9, 'lagged');
const d16 = tLagged - 0.08;
const d17 = w(9, 'In') - 0.1, tReal = w(9, 'REAL');
const d18 = B[10].a - 0.35, tSo = B[10].a, tBack = w(10, 'back');
const d19 = B[11].a - 0.1, tKNOW = w(11, 'KNOW');
const d20 = B[12].a - 0.1, tThirty = w(12, 'thirty');
const d21 = w(12, 'night') - 0.1, tJanitor = w(12, 'janitor'), tFarm = w(12, 'Server');
const d22 = B[13].a - 0.1, tLives = w(13, 'lives');
const d23 = B[14].a - 0.12, tKeys = w(14, 'keys');
const d24 = B[15].a - 0.1, tNinety = B[15].a, tOpen = w(15, 'open');
const d25 = w(15, 'One') - 0.1, tLocker = w(15, 'locker');
const d26 = w(15, "There's") - 0.1, tSandwich = w(15, 'sandwich'), tNineteen = w(15, 'nineteen');
const d27 = B[16].a - 0.1, tTiny = w(16, 'tiny');
const d28 = w(16, "I'd") - 0.1, tShoo = w(16, 'shoo'), tMopW = w(16, 'mop');
const d29 = w(16, 'But') - 0.1, tFeeds = w(16, 'feeds'), tTraffic = w(16, 'traffic');
const d30 = w(16, 'The', 1) - 0.1, tRushes = w(16, 'rushes'), tBigger = w(16, 'bigger');
const d31 = B[17].a - 0.1, tWhole = w(17, 'whole');
const d32 = w(17, 'the') - 0.1;
const d33 = B[18].a - 0.08, tShutting = w(18, 'shutting'), tStarve = w(18, 'starve'), tForever = w(18, 'Forever');
const d34 = w(18, 'To') - 0.1;
const d35 = B[19].a - 0.1, tStop = w(19, 'stop'), tShut = w(19, 'shut');
const d36 = B[20].a - 0.5, tHelmet = w(20, 'helmet'), tBuilderG = w(20, 'builder');

// ---------------------------------------------------------------- small helpers
const blinkK = (t, seed = 0) => { const b = (t + seed * 0.37) % 3.4; return b < 0.12 ? Math.sin((b / 0.12) * Math.PI) : 0; };
const juno = (t, pose, act) => actor('juno', t, pose, act);
const gpa = (t, pose, act) => actor('grandpa', t, pose, act);
const lagMouth = (t) => K.V.viseme('LAG', t);
// "how much lag is in the air" (drives HUD glitch + set lag)
function lagLevel(t) {
  if (t < d04) return 0;
  if (t < d05) return 0.15 * seg(t, tStarted, tLagging) + 0.1;
  if (t < d14) return 0.35;
  if (t < d18) return lerp(0.35, 0.75, seg(t, d14, d18));
  if (t < d20) return 0.5;
  return 0.25;
}
// young Otto for the flashback: brown beard + brows, same cap and cardigan
const YOUNG = L3.dress(makeDesign({
  hair: 'flatCap', eyeStyle: 'mid', top: 'shawlCardigan', sleeve: 'long', pantsShape: 'straight', size: 1.06,
  eye: { iris: '#4E7FB0', pupil: 0.95 }, brows: false, neutralMouth: 'smallSmile', acc: { bushyBrows: '#5A3A22' }, shoe: 'loafer',
  col: {
    skin: '#F2C9A8', skinShade: '#DDAE8A', hair: '#6A4430', hairShade: '#4E3020', hairHi: '#8E6A50',
    hat: '#8F7D64', hatShade: '#6F5F49', hatHi: '#B8A88A', beard: '#7A4E34', beardShade: '#613C26', beardType: 'big',
    top: '#E0A53A', topShade: '#C48A26', sleeve: '#E0A53A', cuff: '#C48A26', collar: '#EDBB5E', shirt: '#BFD8F2', shirtShade: '#9FBCE0', button: '#7A4E2C',
    pants: '#5A6E9A', pantsShade: '#46587E', sole: '#5A3B26', soleShade: '#432B1B', toe: '#6E4A30',
  },
}));
const youngOtto = (pose) => drawCharacter(YOUNG, { shade: true, shadow: true, ...pose });
// flashlight held in a front-view hand: body-space prop + world beam helper
function flashlightProp(arm, side = 1, rot = 0) {
  const [hx, hy] = AC.hand(arm, side);
  const o = S.g(S.rect(-22, -70, 44, 110, 10, ol('#3A3F4E', 6)) + S.rect(-30, -96, 60, 34, 10, ol('#5A6070', 6)) + S.ellipse(0, -96, 26, 8, { fill: '#FFF6C8' }), `translate(${f(hx)} ${f(hy)}) rotate(${f(rot)})`);
  return { svg: o, layer: 'front' };
}
// a light cone from (x, y) toward angle a (deg, 0 = right), length len, spread deg
function beam(x, y, a, len, spread = 16, op = 1) {
  const r = (spread * Math.PI) / 180;
  const p = `M0 0 L${f(len)} ${f(-Math.tan(r) * len)} L${f(len)} ${f(Math.tan(r) * len)} Z`;
  const p2 = `M0 0 L${f(len)} ${f(-Math.tan(r) * len * 0.5)} L${f(len)} ${f(Math.tan(r) * len * 0.5)} Z`;
  return S.g(S.path(p, { fill: 'url(#s05beam)', opacity: f(0.55 * op) }) + S.path(p2, { fill: 'url(#s05beam)', opacity: f(0.5 * op) }), `translate(${f(x)} ${f(y)}) rotate(${f(a)})`);
}
// big golden key; (x, y) = bow centre; glow 0..1
function goldKey(x, y, s = 1, rot = 0, glow = 1, t = 0) {
  let o = '';
  if (glow > 0) o += S.circle(0, 60, 260, { fill: 'url(#s05goldGlow)', opacity: f(glow) }) + K.rays(0, 60, 14, 300, '#FFF4C8', 0.25 * glow, t * 30);
  o += S.path('M-14 40 L14 40 L14 250 L-14 250 Z', ol('#FFC93C', 6)) + S.rect(14, 190, 40, 18, 4, ol('#FFC93C', 5)) + S.rect(14, 222, 30, 18, 4, ol('#FFC93C', 5));
  o += S.circle(0, 0, 56, ol('#FFC93C', 7)) + S.path(K.F.starPath(0, 0, 28), { fill: '#B97A0E' }) + S.path('M-36 -26 Q-20 -46 4 -44', ln(7, '#FFF4C4'));
  o += S.path('M-6 60 L-6 230', ln(5, '#FFF4C4', 0.8));
  if (glow > 0) o += K.F.sparkle(60, -50, 22 * (0.6 + 0.4 * Math.sin(t * 7))) + K.F.sparkle(-50, 160, 16 * (0.6 + 0.4 * Math.sin(t * 6 + 1)));
  return S.g(o, tf(x, y, s, rot));
}
// the main attic angle at night
function attic(t, cam, opts, chars, post = '') {
  const La = SETS.attic.layers(t, { night: true, juice: 12, ...opts });
  return view(cam, La.bg, 0.5) + view(cam, La.mid + chars, 1) + view(cam, La.fg, 1.2) + view(cam, La.light, 1) + post;
}
// reverse angle: from behind the laptop, looking at whoever sits at the desk. World space; content between bg and fg.
function reverseBg(t, lagK = 0) {
  let o = S.rect(-800, -600, 3520, 2280, 0, { fill: '#3A2A3A' });
  // far gable wall (shiplap) with the hatch side, boxes, coat hook
  let pl = '';
  for (let y = -200; y < 900; y += 46) pl += `M-800 ${y} L2720 ${y} `;
  o += S.rect(-800, -200, 3520, 1100, 0, { fill: '#2E5A57' }) + S.path(pl, ln(4, '#244A47', 0.8));
  o += S.rect(-800, 780, 3520, 600, 0, { fill: '#8A5A34' });
  // rafters converging upward
  for (const [x0, x1] of [[-200, 760], [2120, 1160], [200, 860], [1720, 1060]]) o += S.path(`M${x0} 900 L${x1} -400`, ln(70, LINE)) + S.path(`M${x0} 900 L${x1} -400`, ln(54, '#7A4A28'));
  // dark string lights (off)
  let bl = '';
  for (let i = 0; i < 9; i++) { const x = 120 + i * 210, y = 140 + Math.sin(i * 0.9) * 30; bl += S.ellipse(x, y, 12, 17, { fill: ['#7A3A5A', '#2E6A66', '#7A6A2A'][i % 3], stroke: LINE, 'stroke-width': 4 }); }
  o += S.path('M60 120 Q960 220 1860 120', ln(4, '#2C3040')) + bl;
  // boxes + the coat rack
  o += S.rect(1380, 560, 300, 230, 8, ol('#B9884A', 6)) + S.rect(1430, 420, 230, 150, 8, ol('#C79A5A', 6)) + TF('BOOKS', 1545, 505, 34, '#5A3A2A');
  o += S.rect(160, 600, 260, 190, 8, ol('#B9884A', 6)) + TF('XMAS', 290, 710, 40, '#8A2A2A');
  if (lagK > 0) o += SETS.lagBlocks(1360, 400, 340, 400, lagK, t, 21, 46, 'r') + SETS.lagBlocks(120, 560, 320, 240, lagK * 0.9, t, 23, 46, 'l');
  return o;
}
// the laptop lid seen from behind (foreground, bottom of frame)
function lidBack(x = 960, y = 900, s = 1, glow = 1) {
  let o = S.rect(-620, 0, 1240, 420, 40, ol('#2C303C', 10)) + S.rect(-590, 20, 1180, 30, 14, { fill: '#3E4352' });
  o += S.circle(0, 160, 40, { fill: '#5A6070' });
  o += S.g(S.path('M-14 3 Q-14 -12 0 -12 Q14 -12 14 3 Z', ol('#FFD21F', 3)) + S.rect(-17, 1, 34, 6, 3, ol('#FFD21F', 2.5)), 'translate(-380 140) scale(3) rotate(-8)');
  o += S.g(S.rect(-22, -9, 44, 18, 4, ol('#FF6FA8', 2.5)) + TF('BUILD', 0, 5, 11, '#FFFFFF'), 'translate(340 130) scale(3) rotate(6)');
  o += S.rect(-520, 60, 200, 40, 6, { fill: '#C9CFD8', opacity: 0.9, transform: 'rotate(-20 -420 80)' });
  // screen light spilling over the top edge
  o += S.rect(-600, -8, 1200, 14, 7, { fill: '#BFEFFF', opacity: f(0.7 * glow) });
  return S.g(o, tf(x, y, s));
}
// darkness around a light pool (screen space)
const darkness = (k = 1, cx = 960, cy = 560) => S.rect(-200, -200, 2320, 1480, 0, { fill: 'url(#s05dark)', opacity: f(k), transform: `translate(${f(cx - 960)} ${f(cy - 560)})` });
const screenGlow = (k = 1, cx = 960, cy = 600, col = 'url(#s05glowBlue)') => S.circle(cx, cy, 620, { fill: col, opacity: f(k) });
// Juno on the reverse angle (facing camera, lit by the screen)
function reverseShot(t, cam, junoPose, act, o = {}) {
  const lagK = o.lag || 0;
  let wd = reverseBg(t, lagK);
  wd += juno(t, { x: 960, y: 1330, s: 0.98, ...junoPose }, act);
  if (o.extra) wd += o.extra;
  let out = view(cam, wd, 1);
  const flick = o.flicker ? (hash(Math.floor(t * 12)) > 0.6 ? 0.55 : 1) : 1;
  out += darkness(0.92) + screenGlow(0.55 * flick, 960, 620, o.grey ? 'url(#s05glowGrey)' : 'url(#s05glowBlue)');
  out += view(cam, lidBack(960, 905, 1, flick) + (o.fg || ''), 1.15);
  return out;
}
// the game seen full-frame; tt = display time (may be frozen), opts → bubbleIsland
const game = (tt, opts) => SETS.bubbleIsland(tt, { visits: 3, ...opts });
// Lag mouth position for size (to aim bites)
const lagMouthY = (size) => 95 * 0.76 * size;

// ================================================================= SHOTS
// ---- 1. midnight in the attic
function deskClock(t) {
  const flip = seg(t, tMid - 0.05, tMid + 0.1);
  const txt = t < tMid ? '11:59' : '12:00';
  let o = S.rect(-62, -54, 124, 58, 12, ol('#2C303C', 5)) + S.rect(-52, -46, 104, 42, 6, { fill: '#10141C' });
  o += T(txt, 0, -12, 34, t < tMid ? '#FF5A5A' : '#7CFF6B') + TF('AM', 40, -36, 11, '#9AA6C0');
  if (flip > 0 && flip < 1) o += S.circle(0, -25, 60 * flip, { fill: 'none', stroke: '#7CFF6B', 'stroke-width': 6, opacity: f(1 - flip) });
  return S.g(o, 'translate(480 586)');
}
function shMidnight(t) {
  const cam = camKeys(t, [[d01, at(960, 540, 1.0)], [tMid + 0.3, at(820, 500, 1.15)], [d02, at(700, 470, 1.45)]], ease.inOut);
  const type = Math.sin(t * 22) * 6;
  const chars = deskClock(t) + juno(t, { x: 800, y: 912, s: 0.6, view: 'back', armL: 22 + type, armR: 22 - type, bodyY: 14 }, { arms: false });
  let o = attic(t, cam, { cat: 'bed' }, chars);
  o += C.pixelWipe(seg(t, d01, d01 + 0.7), 'reveal', true);
  return o;
}
// ---- 2. twelve islands, three hundred bubbles
function counterTag(x, y, label, val, k, done) {
  if (k <= 0) return '';
  let o = S.rect(-210, -54, 420, 108, 30, ol('#1B2340', 7)) + TF(label, -40, 18, 46, '#FFFFFF') + T(String(val), 120, 22, 62, '#FFD21F');
  if (done > 0) o += check(178, -50, 56, done);
  return S.g(o, tf(x, y, ease.outBack(clamp(k, 0, 1))));
}
function shCounts(t) {
  const cam = camKeys(t, [[d02, at(960, 500, 1.0)], [d03, at(960, 490, 1.06)]]);
  const isl = Math.round(lerp(9, 12, seg(t, tTwelve - 0.2, tTwelve + 0.25)));
  const bub = Math.round(lerp(212, 300, ease.out(seg(t, tThree - 0.1, tThree + 0.8))));
  const extra = seg(t, tThree - 0.1, tThree + 0.8);
  const scr = (sw, sh) => {
    let g = game(t, {});
    for (let i = 0; i < 26; i++) {
      const k = ease.outBack(clamp(extra * 26 - i, 0, 1));
      if (k <= 0) continue;
      const bx = 140 + hash(i * 3.7) * 1640, by = 160 + hash(i * 5.3) * 760, br = 18 + hash(i) * 26;
      g += S.circle(bx, by + Math.sin(t * 2 + i) * 6, br * k, { fill: '#FFFFFF', opacity: 0.25, stroke: '#8AF0FF', 'stroke-width': 4 });
    }
    return SETS.frameIn(g, sw, sh);
  };
  let wd = S.rect(-800, -600, 3520, 2280, 0, { fill: '#0E1020' }) + SETS.laptop(960, 1195, 3.62, scr, {});
  wd += X.cursor(1180 + Math.sin(t * 3) * 60, 520 + Math.cos(t * 2.3) * 40, 1.3, bump(t, tTwelve - 0.1, tTwelve + 0.1) + bump(t, tThree - 0.1, tThree + 0.1));
  let o = view(cam, wd, 1);
  o += counterTag(1450, 230, 'ISLANDS:', isl, seg(t, tTwelve - 0.15, tTwelve + 0.15), seg(t, tTwelve + 0.3, tTwelve + 0.6));
  o += counterTag(1450, 370, 'BUBBLES:', bub, seg(t, tThree - 0.15, tThree + 0.15), seg(t, tThree + 0.9, tThree + 1.2));
  o += darkness(0.4);
  return o;
}
// ---- 3. one very tired builder (reverse)
function juiceTower(t, x, y, fall) {
  let o = '';
  const cols = ['#FF8A3D', '#7CD45A', '#B07CFF', '#FF5A8A', '#3FC7E8'];
  for (let i = 0; i < 9; i++) {
    const r = Math.floor(i / 3), c = i % 3;
    const fx = fall * (c - 1 + r * 0.6) * 160, fy = fall * fall * 260 * (1 + r * 0.4), fr = fall * (hash(i) - 0.5) * 220;
    o += SETS.juiceBox(x + (c - 1) * 70 + r * 35 + fx, y - r * 104 + fy, 2, fr, cols[i % 5]);
  }
  return o;
}
function shTired(t) {
  const cam = camKeys(t, [[d03, at(960, 560, 1.0)], [d04, at(960, 540, 1.1)]]);
  const droop = bump(t, tTired - 0.2, tBuilder + 0.05), snap = bump(t, tBuilder, tBuilder + 0.4);
  const face = { name: snap > 0.2 ? 'shocked' : 'sleepy', eyes: { upper: snap > 0.2 ? 0 : lerp(0.55, 0.95, droop) }, fx: ['eyebags'] };
  const fall = ease.in(seg(t, tBuilder + 0.05, tBuilder + 0.6));
  return reverseShot(t, cam, { face, headRot: -14 * droop, bodyY: 30 * droop, lift: 16 * snap, armL: 12, armR: 12 }, { arms: false, energy: 0.4 }, { fg: juiceTower(t, 330, 930, fall) });
}
// ---- 4. the game starts lagging
function shLagging(t) {
  const fps = lerp(30, 3, seg(t, tStarted, tLagging));
  const tt = t < tStarted ? t : t < tLagging ? K.stutterT(t, fps) : tLagging;
  const cam = camKeys(t, [[d04, at(960, 540, 1.0)], [d05, at(960, 520, 1.1)]]);
  let o = view(cam, game(tt, { freeze: t > tLagging, freezeAt: tLagging }), 1);
  const sp = seg(t, tStarted, tStarted + 0.4);
  if (sp > 0) o += K.loadingWheel(1560, 230, 30 + 10 * seg(t, tLagging, tLagging + 0.5), t, '#B9C0CC', 8) ;
  o += K.pixelBlocks(0, 940, 1920, 140, t, 0.3 * seg(t, tLagging, d05), '#8A93A6', 70, 3);
  return o;
}
// ---- 5. mmm... bub... bub... bubbles
const BITE_AT = [[0, -0.62], [1, -0.85], [3, -1.05]];
function biteSpot(i, t) {
  const [bi, a] = BITE_AT[i];
  const b = SETS.bubbleIsland.ISLANDS[bi];
  return [b.x + Math.cos(a) * b.r, b.y + SETS.bubbleIsland.bob(bi, t) + Math.sin(a) * b.r, a];
}
function shBubbles(t) {
  const tt = freezeAt(t, [tBub1, tBub2, tBubbles], 0.32);
  const nb = seg(tt, tBub1, tBub1 + 0.18) + seg(tt, tBub2, tBub2 + 0.18) + seg(tt, tBubbles, tBubbles + 0.18);
  const cam = camKeys(t, [[d05, at(1100, 480, 1.0)], [d06, at(1150, 470, 1.05)]]);
  shakeAll(cam, t, [[tBub1, 0.2, 10], [tBub2, 0.2, 10], [tBubbles, 0.25, 14]]);
  let wd = game(tt, { bites: nb, grey: 0.15 + 0.1 * nb });
  // spinners gather into the Lag
  const gather = ease.inOut(seg(t, d05, tMmm + 0.5));
  const size = 0.62;
  let li = tt < tBub1 - 0.1 ? -1 : tt < tBub2 - 0.1 ? 0 : tt < tBubbles - 0.1 ? 1 : 2;
  let lx, ly;
  if (li < 0) { lx = 960; ly = 230; } else { const [bx, by, a] = biteSpot(li, tt); lx = bx + Math.cos(a) * 110; ly = by + Math.sin(a) * 110 - lagMouthY(size); }
  if (gather < 1) for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    wd += K.loadingWheel(lerp(960 + Math.cos(a) * 900, lx, gather), lerp(260 + Math.sin(a) * 500, ly, gather), 26, t + i * 0.2, '#9AA3B5', 8);
  }
  if (gather > 0.6) wd += S.g(lag({ x: lx, y: ly, size: size * clamp((gather - 0.6) / 0.4, 0.2, 1), t: tt, mouth: lagMouth(t), mood: 'hungry', glitch: 0.15, look: [-0.3, 0.6] }), null);
  let o = view(cam, wd, 1);
  for (const tb of [tBub1, tBub2, tBubbles]) o += K.bang('CHOMP', 1500, 820, seg(t, tb, tb + 0.08) * (1 - seg(t, tb + 0.3, tb + 0.4)), 90, -8, '#FFFFFF');
  return o;
}
// ---- 6. who said that?!
function shWho(t) {
  const cam = camKeys(t, [[d06, at(960, 540, 1.12)], [d07, at(960, 520, 1.2)]]);
  shakeAll(cam, t, [[d06 + 0.05, 0.4, 18]]);
  const jump = bump(t, d06, d06 + 0.45);
  return reverseShot(t, cam, { lift: 60 * jump, sy: 1 + 0.08 * jump, armL: 40 + 80 * jump, armR: 40 + 80 * jump, face: { name: 'scared', eyes: { pupil: 0.4 } } }, { arms: false, energy: 1.4 }, { flicker: true, grey: true });
}
// ---- 7. I... am... (the Lag rises in the laptop screen)
function shIAm(t) {
  const tt = freezeAt(t, [tI, tAm, tThe], 0.4);
  const rise = ease.out(seg(tt, d07, tThe + 0.3));
  const scr = (sw, sh) => SETS.frameIn(game(tt, { bites: 3, grey: 0.55, freeze: true, freezeAt: tLagging, hud: false }) + lag({ x: 960, y: lerp(1500, 760, rise), size: 2.4, t: tt, mouth: lagMouth(t), mood: 'neutral', glitch: 0.25, look: [0, 0.2], blink: 0 }), sw, sh);
  const S_ = SPOTS.attic.laptop.screen;
  const cam = camKeys(t, [[d07, at(S_.cx, S_.cy + 10, 3.0)], [d08, at(S_.cx, S_.cy, 3.4)]], ease.linear);
  let o = attic(t, cam, { screen: scr, lag: 0.1, cat: 'bed' }, '');
  if (tt !== t) o += K.loadingWheel(1780, 960, 30, t, '#FFFFFF', 8);
  return o;
}
// ---- 8. ...the LAAAG
function shLAAAG(t) {
  const cam = camKeys(t, [[d08, at(960, 560, 1.0)], [d09, at(960, 640, 1.35)]], ease.inOut);
  shakeAll(cam, t, [[tLAAAG, 1.6, 26]]);
  let wd = game(t, { bites: 3, grey: 0.85, hud: false });
  wd += lag({ x: 960, y: 520, size: 3.1, t, mouth: lagMouth(t), mood: 'hungry', glitch: 0.65, look: [0, 0.1] });
  let o = view(cam, wd, 1);
  o += K.pixelBlocks(0, 0, 1920, 1080, t, 0.22, '#8A93A6', 90, 7);
  o += smash(t, d08, 0.16, 0.9);
  return o;
}
// ---- 9-10. more players... more... rushing... more... FOOD
function shMore(t) {
  const tt = freezeAt(t, [tMore1, tMore2, tRushing, tMore3], 0.3);
  const grow = 1.25 + 0.14 * ((tt > tMore1) + (tt > tMore2) + (tt > tRushing) + (tt > tMore3));
  const cam = camKeys(t, [[d09, at(960, 520, 1.0)], [d10, at(960, 500, 1.12)]]);
  let wd = game(tt, { bites: 4, grey: 0.55 });
  const ly = 470, my = ly + lagMouthY(grow);
  // traffic: players streaming into his mouth
  for (let i = 0; i < 18; i++) {
    const u = ((tt * 0.9 + hash(i * 3.3)) % 1);
    const a = (i / 18) * Math.PI * 2 + 0.3;
    const sx = 960 + Math.cos(a) * 1300, sy = 560 + Math.sin(a) * 800;
    const e = ease.in(u);
    wd += bloxy(lerp(sx, 960, e), lerp(sy, my, e), lerp(1.3, 0.2, e), i, tt, { pose: 'fall', shadow: false });
  }
  wd += lag({ x: 960, y: ly, size: grow, t: tt, mouth: lagMouth(t), mood: 'hungry', glitch: 0.3, look: [0, 0.3] });
  let o = view(cam, wd, 1);
  if (tt !== t) o += K.loadingWheel(1800, 980, 28, t, '#FFFFFF', 8);
  return o;
}
function shFood(t) {
  const cam = camKeys(t, [[d10, at(960, 540, 1.0)], [tFood + 0.1, at(960, 640, 1.3)], [d11, at(960, 650, 1.35)]]);
  shakeAll(cam, t, [[tFood, 0.8, 34]]);
  let wd = S.rect(-800, -600, 3520, 2280, 0, { fill: '#7A8090' });
  wd += lag({ x: 960, y: 140, size: 5.4, t, mouth: lagMouth(t) || 'D', mood: 'hungry', glitch: 0.5, look: [0, 0.6] });
  let o = view(cam, wd, 1);
  o += smash(t, tFood, 0.14, 0.7);
  return o;
}
// ---- 11. get out of my game! (from inside the screen)
function lagBackSilhouette(x, y, s, t) {
  let o = '';
  const P = [[-230, 40, 110], [-90, 10, 150], [80, 0, 160], [240, 40, 120], [-160, -100, 110], [40, -130, 130], [200, -80, 100]];
  o += S.path(P.map(([px, py, r]) => `M${px - r - 10} ${py}a${r + 10} ${r + 10} 0 1 0 ${2 * (r + 10)} 0a${r + 10} ${r + 10} 0 1 0 ${-2 * (r + 10)} 0Z`).join(''), { fill: LINE });
  o += S.path(P.map(([px, py, r]) => `M${px - r} ${py}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`).join(''), { fill: '#5A6070' });
  for (let i = 0; i < 6; i++) o += K.loadingWheel(P[i][0], P[i][1] - 20, 34, t + i * 0.3, '#C9CED8', 8);
  return S.g(o, tf(x, y, s));
}
function screenBezel(t) {
  let o = S.path('M-50 -50 L1970 -50 L1970 1130 L-50 1130 Z M90 90 L90 990 L1830 990 L1830 90 Z', { fill: '#1A1D26', 'fill-rule': 'evenodd' });
  let sl = '';
  for (let y = 90; y < 990; y += 8) sl += `M90 ${y}h1740`;
  o += S.path(sl, { stroke: '#000', 'stroke-width': 2, opacity: 0.12 }) + S.rect(90, 90, 1740, 900, 10, { fill: 'none', stroke: '#0A0B10', 'stroke-width': 8 });
  return o;
}
function shGetOut(t) {
  const cam = camKeys(t, [[d11, at(960, 560, 1.15)], [tMY, at(960, 540, 1.28)], [d12, at(960, 540, 1.3)]]);
  shakeAll(cam, t, [[tMY, 0.4, 14]]);
  const shaky = Math.sin(t * 40) * 2;
  const stomp = bump(t, tMY - 0.05, tMY + 0.3);
  let o = reverseShot(t, cam, { headRot: shaky, armR: 100 + 10 * stomp, armL: 30, lift: 24 * stomp }, { arms: false, energy: 1.5 }, { grey: true, lag: 0.2 });
  o += lagBackSilhouette(380, 1020, 1.1, t);
  o += screenBezel(t);
  return o;
}
// ---- 12-13. your game has three visits / nobody will miss it
function bigVisits(x, y, s, n, crumble, t) {
  let o = S.rect(-330, -110, 660, 220, 50, { fill: '#1B2340', stroke: '#FFFFFF', 'stroke-width': 6, opacity: 0.9 }) + S.ellipse(-230, 0, 60, 38, { fill: '#FFFFFF' }) + S.circle(-230, 0, 22, { fill: '#1B2340' });
  o += T('VISITS:', -40, 34, 96, '#FFFFFF') + T(String(n), 210, 40, 130, '#FFD21F');
  if (crumble > 0) o += K.pixelBlocks(-330, -110, 660, 220, t, crumble, '#8A93A6', 44, 5);
  return S.g(o, tf(x, y, s));
}
function shVisits(t) {
  const tt = freezeAt(t, [tYour, tGame7, tHas, tThree7, tVisits], 0.32);
  const cam = camKeys(t, [[d12, at(960, 540, 1.0)], [d13, at(980, 520, 1.08)]]);
  let wd = game(tt, { bites: 4, grey: 0.6, hud: false });
  const grow = ease.outBack(seg(tt, tThree7, tThree7 + 0.3));
  wd += bigVisits(1300, 470, 0.7 + 0.45 * grow, 3, seg(tt, tVisits + 0.3, tVisits + 1.2), tt);
  wd += lag({ x: 520, y: 560, size: 1.5, t: tt, mouth: lagMouth(t), mood: tt > tVisits ? 'laugh' : 'neutral', glitch: 0.25, look: [0.9, -0.2] });
  let o = view(cam, wd, 1);
  if (tt !== t) o += K.loadingWheel(1800, 980, 28, t, '#FFFFFF', 8);
  return o;
}
function shMiss(t) {
  const tt = freezeAt(t, [tNobody, tWill, tMiss], 0.32);
  const isl = SETS.bubbleIsland.ISLANDS[0];
  const cam = camKeys(t, [[d13, at(820, 480, 1.15)], [tIt, at(780, 520, 1.45)], [d14, at(780, 520, 1.5)]]);
  shakeAll(cam, t, [[tIt, 0.4, 20]]);
  const grey = 0.6 + 0.35 * seg(tt, tNobody, tIt);
  const chomp = seg(tt, tIt, tIt + 0.2);
  let wd = game(tt, { bites: 4 + 2 * chomp, grey, hud: false });
  wd += lag({ x: 1180, y: 300, size: 1.7, t: tt, mouth: lagMouth(t) || (chomp > 0 && chomp < 1 ? 'D' : null), mood: tt > tIt + 0.2 ? 'laugh' : 'hungry', glitch: 0.3, look: [-0.8, 0.6] });
  let o = view(cam, wd, 1);
  if (tt !== t) o += K.loadingWheel(1800, 980, 28, t, '#FFFFFF', 8);
  o += smash(t, tIt, 0.1, 0.4);
  return o;
}
// ---- 14. ...Rude. (and the pencil rolls off the desk and freezes)
const PENCIL_FREEZE = () => d14 + 0.7;
function pencilProp(x, y, rot, s = 1) {
  return S.g(S.path('M0 0 L18 -9 L18 9 Z', ol('#F6CFAE', 3)) + S.rect(18, -9, 150, 18, 3, ol('#FFC928', 3)) + S.rect(168, -10, 24, 20, 5, ol('#FF8FA8', 3)), tf(x, y, s, rot));
}
function shRude(t) {
  const cam = camKeys(t, [[d14, at(980, 560, 1.15)], [d15, at(1040, 580, 1.22)]]);
  const tf0 = PENCIL_FREEZE();
  const roll = seg(t, d14, tf0 - 0.25), drop = seg(t, tf0 - 0.25, tf0);
  const px = lerp(1250, 1560, roll), py = 880 + 110 * drop * drop;
  const prot = roll * 540 + drop * 120;
  let fg = pencilProp(px, py, prot, 1.3);
  if (t > tf0) fg += K.loadingWheel(px + 80, py - 70, 26, t, '#FFFFFF', 8);
  return reverseShot(t, cam, { face: { name: 'sad', mouth: K.V.viseme('JUNO', t) || 'frown', eyes: { look: [0, 0.4] } }, headRot: -5, armL: 8, armR: 8 }, { arms: false, energy: 0.3 }, { grey: true, lag: 0.3, flicker: true, fg });
}
// ---- 15-17. it spills into real life
const CAT = { x: 1160, y: 900 };
function shPencil(t) {
  const tp = d15 + 0.35;
  const cam = camKeys(t, [[d15, at(1000, 720, 2.3)], [tCat - 0.05, at(1000, 740, 2.3)], [d16, at(1110, 780, 2.1)]], ease.inOut);
  let chars = '';
  if (t < tp) chars += pencilProp(1000, 700, 170, 0.75) + K.loadingWheel(1060, 650, 18, t, '#FFFFFF', 8);
  else chars += pencilProp(990, 912, 8, 0.75) + (t < tp + 0.15 ? S.circle(1000, 905, 40 * seg(t, tp, tp + 0.15), { fill: 'none', stroke: '#9FE2FF', 'stroke-width': 6 }) : '');
  const look = t < tp ? [-0.2, -1] : [-0.6, 0.6];
  chars += SETS.attic.cat(CAT.x, CAT.y, 0.8, t, { pose: 'sit' });
  let o = attic(t, cam, { lag: 0.35, cat: false }, chars);
  if (t >= tp && t < tp + 0.08) o += K.C.whiteFlash(0.4);
  return o;
}
function shCatLag(t) {
  const cam = camKeys(t, [[d16, at(960, 640, 1.2)], [d17, at(960, 620, 1.25)]]);
  const r = K.rubber(t, tLagged, 0.85, 420, 3);
  const step = Math.floor((t - tLagged) * 7);
  const cx = CAT.x + (t > tLagged ? r : 0);
  let cat = SETS.attic.cat(cx, CAT.y, 0.8, K.stutterT(t, 4), { pose: 'sit' });
  if (t > tLagged && t < tLagged + 0.85) cat = K.ghost(cat, 26, 0.3);
  const chars = juno(t, { x: 640, y: 1000, s: 0.62, turn: 0.4, armL: 40, armR: 40, face: { name: 'shocked', eyes: { look: [0.8, 0.3] } } }, { arms: false, energy: 0.6 }) + cat;
  let o = attic(t, cam, { lag: 0.5, cat: false }, chars);
  if (t > tLagged && step % 2 === 0 && t < tLagged + 0.85) o += K.pixelBlocks(0, 0, 1920, 1080, t, 0.1, '#8A93A6', 80, step);
  return o;
}
function shRealLife(t) {
  const cam = camKeys(t, [[d17, at(760, 560, 1.55)], [d18, at(760, 540, 1.7)]], ease.linear);
  const lagK = lerp(0.55, 0.8, seg(t, d17, d18));
  let j = juno(t, { x: 700, y: 1000, s: 0.62, turn: 0.2, armL: 30, armR: 30, headRot: 4 * Math.sin(t * 3) }, { arms: false, energy: 0.8 });
  j = K.ghost(j, 18 + 10 * Math.sin(t * 7), 0.25);
  const cat = SETS.attic.cat(CAT.x + K.rubber(t, d17 + 0.6, 0.6, 160, 2), CAT.y, 0.8, K.stutterT(t, 3), { pose: 'sit' });
  return attic(t, cam, { lag: lagK, cat: false }, j + cat);
}
// ---- 18-19. Grandpa comes up the hatch
const GP = { x: 1300 };
function shHatch(t) {
  const open = ease.inOut(seg(t, d18, d18 + 0.45));
  const rise = ease.out(seg(t, d18 + 0.35, tBack - 0.3));
  const cam = camKeys(t, [[d18, at(1150, 640, 1.25)], [tBack, at(1220, 620, 1.45)], [d19, at(1230, 620, 1.5)]]);
  const fy = lerp(1500, 1170, rise);
  const point = seg(t, tBack - 0.3, tBack);
  const g = gpa(t, { x: GP.x, y: fy, s: 0.62, turn: -0.3, armL: 20, armR: lerp(50, 90, point), props: [flashlightProp(lerp(50, 90, point), 1, lerp(-40, -80, point))], face: { name: 'determined', blink: blinkK(t, 2) } }, { arms: false, energy: 0.5 });
  const La = SETS.attic.layers(t, { night: true, juice: 12, lag: 0.6, hatchOpen: open, cat: false });
  let o = view(cam, La.bg, 0.5) + view(cam, La.mid + g + SETS.attic.hatchFront(t, { hatchOpen: open }), 1) + view(cam, La.fg, 1.2) + view(cam, La.light, 1);
  // hatch light + flashlight beam
  if (open > 0) o += view(cam, S.ellipse(1300, 900, 230 * open, 60 * open, { fill: '#FFE2A0', opacity: 0.35 }), 1);
  if (rise > 0.2) {
    const [hx, hy] = AC.hand(lerp(50, 90, point), 1);
    o += view(cam, beam(GP.x + hx * 0.62, fy + hy * 0.62 - 30, lerp(-90, -165, point), 900, 14, rise), 1);
  }
  return o;
}
function shYouKnow(t) {
  const cam = camKeys(t, [[d19, at(1020, 600, 1.15)], [tKNOW, at(1000, 590, 1.22)], [d20, at(1000, 590, 1.24)]]);
  const S_ = SPOTS.attic.laptop.screen;
  const scr = (sw, sh) => SETS.frameIn(game(t, { bites: 6, grey: 0.9, hud: false }) + lag({ x: 960, y: 700, size: 2.2, t, mood: 'laugh', glitch: 0.4, look: [0.8, 0] }), sw, sh);
  const La = SETS.attic.layers(t, { night: true, juice: 12, lag: 0.5, hatchOpen: 1, screen: scr, cat: 'bed' });
  const jump = bump(t, d19, d19 + 0.4);
  let chars = juno(t, { x: 820, y: 1000, s: 0.62, turn: 0.35, armL: 95, armR: 30, lift: 30 * jump }, { arms: false, energy: 1.4 });
  chars += gpa(t, { x: 1420, y: 1000, s: 0.64, turn: -0.35, armL: 20, armR: 40, props: [flashlightProp(40, 1, -60)], face: { name: 'neutral', mouth: 'line', blink: blinkK(t, 2) } }, { arms: false });
  let o = view(cam, La.bg, 0.5) + view(cam, La.mid + SETS.attic.hatchFront(t, { hatchOpen: 1 }) + chars, 1) + view(cam, La.fg, 1.2) + view(cam, La.light, 1);
  const [hx, hy] = AC.hand(40, 1);
  o += view(cam, beam(1420 + hx * 0.64, 1000 + hy * 0.64 - 40, -150, 700, 12, 0.8), 1);
  return o;
}
// ---- 20-21. thirty years, night janitor at the Server Farm
function gpaCloseBg(t) {
  return reverseBg(t, 0.15);
}
function shJanitor(t) {
  const cam = camKeys(t, [[d20, at(960, 560, 1.0)], [d21, at(960, 520, 1.12)]], ease.linear);
  let wd = gpaCloseBg(t) + gpa(t, { x: 960, y: 1480, s: 1.2, armL: 10, armR: 10, keys: false, headRot: 2 * Math.sin(t * 1.5) }, { arms: false, energy: 0.5 });
  let o = view(cam, wd, 1);
  // flashlight under the chin: dark all round, warm pool from below
  o += S.rect(-200, -200, 2320, 1480, 0, { fill: 'url(#s05dark2)' });
  o += S.ellipse(960, 760, 520, 600, { fill: 'url(#s05warm)', opacity: 0.6 });
  o += S.g(S.rect(-40, 0, 80, 220, 16, ol('#3A3F4E', 8)) + S.rect(-56, -40, 112, 60, 14, ol('#5A6070', 8)) + S.ellipse(0, -40, 48, 14, { fill: '#FFF6C8' }), 'translate(960 1000)');
  o += K.bang('30 YEARS', 1460, 300, pop(t, tThirty, 0.3) * (1 - seg(t, tThirty + 1.3, tThirty + 1.5)), 90, 6, '#FFD21F');
  return o;
}
function idBadge(t, hl) {
  let o = S.rect(-330, -210, 660, 420, 30, ol('#F4F1E6', 8)) + S.rect(-330, -210, 660, 90, 30, { fill: '#2E8BFF' }) + S.rect(-330, -150, 660, 30, 0, { fill: '#2E8BFF' });
  o += T('SERVER FARM', 0, -146, 58, '#FFFFFF');
  o += S.rect(-300, -90, 220, 260, 12, ol('#BFD8F2', 6));
  o += clipTo(-300, -90, 220, 260, youngOtto({ x: -190, y: 330, s: 0.42, face: { name: 'happy' } }));
  o += TF('NAME: OTTO', 90, -30, 40, '#2A2246') + TF('NIGHT JANITOR', 90, 30, 40, '#E8243C') + TF('SINCE 1994', 90, 86, 34, '#5A6070');
  o += S.rect(-40, 120, 280, 40, 8, { fill: '#2A2246' });
  for (let i = 0; i < 14; i++) o += S.rect(-30 + i * 19, 126, 6 + (i % 3) * 3, 28, 1, { fill: '#FFFFFF' });
  if (hl > 0) o += S.rect(-320, -200, 640, 70, 24, { fill: 'none', stroke: '#FFE14D', 'stroke-width': 10, opacity: f(hl) });
  o += S.circle(0, -190, 16, ol('#C9CFD8', 5));
  return o;
}
function shBadge(t) {
  const cam = camKeys(t, [[d21, at(960, 560, 1.0)], [tFarm, at(960, 480, 1.12)], [d22, at(960, 470, 1.18)]]);
  shakeAll(cam, t, [[tFarm, 0.3, 8]]);
  const up = ease.outBack(seg(t, d21, d21 + 0.4));
  let wd = gpaCloseBg(t) + gpa(t, { x: 960, y: 1620, s: 1.3, armL: 10, armR: 10, keys: false, face: { name: 'happy', eyes: { look: [0, 0.6] } } }, { arms: false, energy: 0.3 });
  wd += S.g(idBadge(t, seg(t, tFarm, tFarm + 0.3)), tf(960, lerp(1400, 620, up), 1.05, -4));
  wd += S.rect(1240, lerp(1500, 720, up), 140, 240, 60, ol('#EDC1A0', 7)); // thumb
  let o = view(cam, wd, 1) + S.rect(-200, -200, 2320, 1480, 0, { fill: 'url(#s05dark2)', opacity: 0.7 });
  o += S.ellipse(960, 600, 700, 500, { fill: 'url(#s05warm)', opacity: 0.35 });
  return o;
}
// ---- 22. where all of Roblox lives
function shFarm(t) {
  const cam = camKeys(t, [[d22, { zoom: 1.0, x: 0, y: 0 }], [d23, { zoom: 1.2, x: 0, y: 40 }]], ease.linear);
  const Lf = FARM.farmExterior(t, { cam, storm: 0.25 });
  let o = Lf.bg + Lf.mid;
  // games floating up out of the farm like glowing bubbles
  const kinds = FARM.BUBBLE_KINDS || [];
  let gb = '';
  for (let i = 0; i < 7; i++) {
    const u = ((t - d22) * 0.25 + i / 7) % 1;
    const x = 960 + Math.sin(i * 2.1 + t) * 420 * u + (i - 3) * 60, y = 760 - u * 680;
    gb += FARM.gameBubble ? FARM.gameBubble(x, y, 46 + 20 * hash(i), t, { kind: kinds[i % Math.max(1, kinds.length)] }) : '';
  }
  o += view(cam, S.g(gb, null, { opacity: 0.95 }), 1) + Lf.fg;
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#0A1030', opacity: 0.25 });
  return o;
}
// ---- 23-25. the keys
function keyCloseUp(t, swing) {
  return keyRing({ x: 0, y: 0, s: 1, swing, gold: true, n: 9 });
}
function shKeys(t) {
  const sl = ease.out(seg(t, d23, d23 + 0.2));
  let left = reverseBg(t, 0.1) + juno(t, { x: 560, y: 1500, s: 1.05, turn: 0.35, armL: 10, armR: 10, face: { name: 'amazed', eyes: { look: [0.7, 0.9] }, mouth: K.V.viseme('JUNO', t) || 'O' } }, { arms: false, energy: 0.5 });
  left += S.rect(-200, -200, 2320, 1480, 0, { fill: 'url(#s05dark2)', opacity: 0.6 }) + S.ellipse(560, 600, 520, 500, { fill: 'url(#s05glowBlue)', opacity: 0.4 });
  const swing = 22 * Math.sin((t - d23) * 9) * Math.exp(-(t - d23) * 0.8);
  let right = S.rect(800, 0, 1200, 1080, 0, { fill: '#C48A26' }) + S.rect(800, 0, 1200, 1080, 0, { fill: 'url(#s05knit)' }) + S.rect(800, 820, 1200, 260, 0, { fill: '#7A553A' });
  right += S.rect(800, 760, 1200, 70, 0, ol('#5A3B26', 6)) + S.rect(1360, 750, 120, 90, 14, ol('#C9A262', 6));
  right += S.g(keyCloseUp(t, swing), tf(1420, 790, 4.2));
  right += K.F.sparkle(1640, 720, 30 * Math.abs(Math.sin(t * 5))) + K.F.sparkle(1300, 1000, 22 * Math.abs(Math.sin(t * 6 + 1)));
  let o = clipTo(0, 0, 1920, 1080, S.g(right, `translate(${f(700 * (1 - sl))} 0)`));
  const id = S.uid('s05lp');
  o += S.clipDef(id, S.path('M0 0 L1000 0 L860 1080 L0 1080 Z')) + S.g(S.g(left, `translate(${f(-700 * (1 - sl))} 0)`), null, { 'clip-path': `url(#${id})` });
  o += S.path('M1000 -10 L860 1090', ln(26, LINE)) + S.path('M1000 -10 L860 1090', ln(14, '#FFFFFF'));
  return o;
}
function shNinetyNine(t) {
  const cam = camKeys(t, [[d24, at(1180, 560, 1.4)], [d25, at(1180, 540, 1.5)]]);
  const raise = ease.outBack(seg(t, d24, d24 + 0.35));
  const arm = lerp(20, 160, raise);
  const [hx, hy] = AC.hand(arm, 1);
  const swing = 14 * Math.sin(t * 7);
  const ring = { svg: S.g(keyRing({ x: 0, y: 0, s: 1, swing, gold: true, n: 9 }), `translate(${f(hx)} ${f(hy - 10)}) scale(2.4)`), layer: 'front' };
  let chars = gpa(t, { x: 1180, y: 1000, s: 0.64, turn: -0.15, armL: 20, armR: arm, keys: false, props: [ring], face: { name: 'smug' } }, { arms: false, energy: 0.6 });
  let o = attic(t, cam, { lag: 0.25, hatchOpen: 1, cat: 'bed' }, SETS.attic.hatchFront(t, { hatchOpen: 1 }) + chars);
  o += S.ellipse(1180, 520, 600, 520, { fill: 'url(#s05warm)', opacity: 0.35 });
  const k = pop(t, tNinety + 0.1, 0.35);
  if (k > 0) o += S.g(K.rays(0, 0, 14, 260, '#FFF4A8', 0.25, t * 30) + TS('99', 0, 60, 220, '#FFD21F') + TFS('KEYS', 0, 130, 60, '#FFFFFF'), tf(560, 430, k, -8));
  o += K.bang('SERVER FARM', 560, 680, pop(t, tOpen, 0.3), 70, -6, '#7CF7FF');
  return o;
}
function shLockerKey(t) {
  const cam = camKeys(t, [[d25, at(960, 540, 1.0)], [d26, at(960, 520, 1.15)]]);
  let wd = S.rect(-800, -600, 3520, 2280, 0, { fill: '#2A1E2E' }) + S.circle(960, 520, 520, { fill: 'url(#s05warm)', opacity: 0.6 });
  // fingers pinch one small key with a heart tag
  const pick = ease.outBack(seg(t, d25, d25 + 0.4));
  wd += S.g(S.rect(-170, -60, 260, 120, 60, ol('#EDC1A0', 8)) + S.rect(-20, -150, 120, 260, 56, ol('#EDC1A0', 8)), tf(1100, 700 - 80 * pick, 1, -20));
  let key = S.circle(0, -150, 46, ol('#C9CED8', 7)) + S.circle(0, -150, 16, { fill: '#2A1E2E', stroke: LINE, 'stroke-width': 5 }) + S.rect(-14, -110, 28, 220, 6, ol('#C9CED8', 6)) + S.rect(14, 60, 40, 20, 4, ol('#C9CED8', 5)) + S.rect(14, 90, 30, 18, 4, ol('#C9CED8', 5));
  key += S.path('M0 -196 L-80 -280', ln(6, '#E8243C')) + S.g(S.rect(-80, -40, 160, 80, 12, ol('#FFF4E6', 5)) + TF('LOCKER', 0, -2, 34, '#2A2246') + S.path(K.F.heartPath(0, 22, 9), { fill: '#FF4D7A' }), 'translate(-120 -320) rotate(-14)');
  wd += S.g(key, tf(980, 560 - 60 * pick, 1.1, 10 * Math.sin(t * 3)));
  return view(cam, wd, 1) + K.F.sparkle(1060, 380, 26 * Math.abs(Math.sin(t * 6)));
}
// ---- 26. the 1998 sandwich
function sandwich(x, y, s, t) {
  let o = S.path('M-200 0 Q-210 -40 -170 -50 L170 -50 Q210 -40 200 0 Q210 30 170 40 L-170 40 Q-210 30 -200 0 Z', ol('#B8A060', 7));
  o += S.path('M-190 -60 Q0 -90 190 -60 L170 -40 L-170 -40 Z', ol('#7FA04A', 6)); // ancient lettuce
  o += S.path('M-200 -110 Q-200 -170 -120 -175 L120 -175 Q200 -170 200 -110 Q205 -70 170 -66 L-170 -66 Q-205 -70 -200 -110 Z', ol('#A8985A', 7));
  for (let i = 0; i < 9; i++) o += S.circle(-160 + hash(i * 3) * 320, -150 + hash(i * 7) * 180, 12 + hash(i) * 16, { fill: ['#6FBF4A', '#4FA05A', '#9FD06A'][i % 3], stroke: LINE, 'stroke-width': 3 });
  o += S.g(S.rect(-6, -40, 12, 40, 4, ol('#F4F1E6', 3)) + S.path('M-26 -40 Q0 -70 26 -40 Z', ol('#FF7A59', 4)) + S.circle(-8, -50, 4, { fill: '#FFF' }), 'translate(120 -175)'); // a little mushroom grew
  let st = '';
  for (let i = 0; i < 3; i++) st += `M${-100 + i * 100} -200 q-20 -40 0 -80 q20 -40 0 -80 `;
  o += S.path(st, ln(8, '#9FD06A', 0.8));
  return S.g(o, tf(x, y, s, Math.sin(t * 2) * 2));
}
function shSandwich(t) {
  const open = ease.out(seg(t, d26, d26 + 0.5));
  const cam = camKeys(t, [[d26, at(960, 540, 1.0)], [tSandwich, at(960, 560, 1.15)], [d27, at(960, 570, 1.3)]]);
  shakeAll(cam, t, [[tNineteen, 0.4, 10]]);
  let wd = S.rect(-800, -600, 3520, 2280, 0, { fill: '#1C2448' });
  for (let i = -3; i < 8; i++) wd += S.rect(i * 300 + 40, 80, 260, 920, 10, ol('#5A6A8A', 6)) + S.rect(i * 300 + 70, 120, 200, 18, 4, { fill: '#3E4A6A' }) + S.rect(i * 300 + 70, 150, 200, 18, 4, { fill: '#3E4A6A' });
  // the open locker (inside dark, sandwich on the shelf)
  wd += S.rect(780, 80, 360, 920, 10, ol('#141A30', 6)) + S.rect(790, 500, 340, 16, 4, ol('#3E4A6A', 4));
  wd += sandwich(960, 490, 0.75, t);
  // flies orbiting
  for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.1; wd += S.g(S.ellipse(0, 0, 9, 6, { fill: LINE }) + S.ellipse(-4, -8, 7, 5, { fill: '#FFFFFF', opacity: 0.8 }) + S.ellipse(4, -8, 7, 5, { fill: '#FFFFFF', opacity: 0.8 }), tf(960 + Math.cos(a) * 180, 300 + Math.sin(a * 1.3) * 80)); }
  // sticky note 1998
  const nk = pop(t, tNineteen - 0.1, 0.3);
  wd += S.g(S.rect(-90, -80, 180, 160, 6, ol('#FFE36E', 5)) + T('1998', 0, 22, 64, '#E8243C') + TF('don\'t eat', 0, 62, 24, '#5A3A10'), tf(1040, 260, 0.9 + 0.3 * nk, 8));
  // the door swinging open (left hinge)
  wd += S.g(S.rect(0, 0, 360, 920, 10, ol('#6E7EA0', 6)) + S.rect(40, 40, 280, 18, 4, { fill: '#4A5A7A' }) + S.rect(40, 70, 280, 18, 4, { fill: '#4A5A7A' }) + S.rect(300, 440, 24, 80, 8, ol('#C9CED8', 4)) + TF('#7', 180, 300, 60, '#2A3550'), `translate(780 80) scale(${f(lerp(1, -0.35, open))} 1)`);
  let o = view(cam, wd, 1);
  // green stink cloud puffing out
  if (open > 0.3) for (let i = 0; i < 5; i++) { const a = (t - d26) * 0.7 + i * 0.2; o += S.circle(960 + Math.sin(i * 2 + t) * 200 * a, 560 - 120 * a, 60 + 90 * a, { fill: '#9FD06A', opacity: f(Math.max(0, 0.3 - 0.12 * a)) }); }
  return o;
}
// ---- 27-28. sepia flashback
function sepiaAisle(t, cam) {
  let o = S.rect(-800, -600, 3520, 2280, 0, { fill: '#E9D9B8' });
  o += S.rect(-800, 820, 3520, 700, 0, { fill: '#C9B48A' });
  let fl = '';
  for (let i = 0; i < 8; i++) fl += `M-800 ${850 + i * i * 9} L2720 ${850 + i * i * 9} `;
  o += S.path(fl, ln(3, '#A8926A', 0.6));
  for (let i = -2; i < 10; i++) {
    const x = i * 230;
    o += S.rect(x, 140, 200, 680, 10, ol('#8A7450', 6)) + S.rect(x + 16, 160, 168, 640, 6, { fill: '#6E5A3A' });
    for (let r = 0; r < 9; r++) {
      o += S.rect(x + 28, 180 + r * 68, 144, 50, 6, ol('#A8926A', 3));
      for (let k = 0; k < 4; k++) o += S.circle(x + 44 + k * 18, 205 + r * 68, 5, { fill: hash(i * 9 + r * 3 + k + Math.floor(t * 4)) > 0.45 ? '#FFF4C8' : '#8A7450' });
    }
  }
  o += S.rect(-800, -600, 3520, 720, 0, { fill: '#D9C79E' }) + S.path('M-800 120 L2720 120', ln(10, '#8A7450'));
  return o;
}
function filmLook(t) {
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#8A6A3A', opacity: 0.32 }) + S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s05sepiaVig)' });
  const step = Math.floor(t * 12);
  let sc = '';
  for (let i = 0; i < 3; i++) { const x = hash(step * 3.1 + i) * 1920; if (hash(step + i * 7) > 0.4) sc += `M${f(x)} 0 L${f(x + (hash(i + step) - 0.5) * 30)} 1080 `; }
  o += S.path(sc, ln(3, '#3A2A1A', 0.5));
  for (let i = 0; i < 10; i++) o += S.circle(hash(step * 1.7 + i * 3) * 1920, hash(step * 2.3 + i * 5) * 1080, 2 + hash(i + step) * 4, { fill: '#2A1A0A', opacity: 0.5 });
  o += TF('1994', 1760, 1010, 44, '#F4E6C8', { opacity: 0.85 });
  return o;
}
function tinyLag(x, y, s, t, mood = 'neutral', hop = 0) {
  return lag({ x, y: y - hop, size: s, t, mood, look: [-0.6, 0.2], blink: blinkK(t, 5) });
}
function shTiny(t) {
  const cam = camKeys(t, [[d27, at(1000, 560, 1.0)], [tTiny, at(1250, 640, 1.5)], [d28, at(1260, 650, 1.55)]], ease.inOut);
  const peek = ease.outBack(seg(t, tTiny - 0.6, tTiny));
  let wd = sepiaAisle(t, cam);
  wd += youngOtto({ x: 600, y: 990, s: 0.62, turn: 0.3, armL: 40, armR: 40, face: { name: 'happy', blink: blinkK(t, 3) }, props: [{ svg: mop({ x: 300, y: 0, rot: -14 + 6 * Math.sin(t * 4) }), layer: 'front' }] });
  wd += S.rect(1300, 140, 200, 680, 10, ol('#8A7450', 6)); // a rack he hides behind
  wd += tinyLag(lerp(1420, 1300, peek), 760, 0.22, t, 'neutral');
  wd += S.rect(1360, 140, 200, 680, 10, ol('#8A7450', 6)) + S.rect(1376, 160, 168, 640, 6, { fill: '#6E5A3A' });
  let o = view(cam, wd, 1) + filmLook(t);
  o += C.whiteFlash(0.8 * (1 - seg(t, d27, d27 + 0.3)));
  return o;
}
function shShoo(t) {
  const cam = camKeys(t, [[d28, at(1060, 640, 1.2)], [d29, at(1200, 640, 1.15)]]);
  const sw = bump(t, tShoo - 0.15, tShoo + 0.35);
  const arm = 40 + 70 * sw;
  const [hx, hy] = AC.hand(arm, 1);
  const rot = lerp(-14, -70, sw), d = 330;
  const mx = hx + d * Math.sin((rot * Math.PI) / 180), my = hy + d * Math.cos((rot * Math.PI) / 180);
  let wd = sepiaAisle(t, cam);
  wd += youngOtto({ x: 760, y: 990, s: 0.62, turn: 0.4, armL: 30, armR: arm, lean: 4 * sw, face: { name: sw > 0.3 ? 'determined' : 'happy', blink: blinkK(t, 3) }, props: [{ svg: mop({ x: mx, y: my, rot }), layer: 'front' }] });
  // the tiny Lag hops away (3 hops)
  const hu = seg(t, tShoo + 0.05, tMopW + 0.6);
  const hops = hu * 3, hi = Math.floor(Math.min(hops, 2.999)), hf = hops - hi;
  const lx = lerp(1150, 1750, hu), hop = hu > 0 && hu < 1 ? Math.sin(hf * Math.PI) * 110 : 0;
  wd += tinyLag(lx, 900, 0.22, t, hu > 0 ? 'scared' : 'neutral', hop);
  if (hu > 0) wd += C.dust(1150, 960, tShoo + 0.05, t);
  let o = view(cam, wd, 1) + filmLook(t);
  o += K.bang('SHOO!', 1100, 360, seg(t, tShoo, tShoo + 0.1) * (1 - seg(t, tShoo + 0.8, tShoo + 0.9)), 120, -8, '#F4E6C8');
  return o;
}
// ---- 29. he feeds on traffic (Juno's blueprint style)
function blueprintBg() {
  let o = S.rect(-800, -600, 3520, 2280, 0, { fill: '#2F6FD6' });
  let g = '';
  for (let x = -800; x < 2720; x += 80) g += `M${x} -600 L${x} 1680 `;
  for (let y = -600; y < 1680; y += 80) g += `M-800 ${y} L2720 ${y} `;
  return o + S.path(g, ln(2, '#FFFFFF', 0.15));
}
function shTraffic(t) {
  const cam = camKeys(t, [[d29, at(960, 540, 1.0)], [d30, at(1050, 540, 1.1)]]);
  let wd = blueprintBg();
  const grow = 0.55 + 0.35 * ease.out(seg(t, tFeeds, d30));
  // three cables of player icons flowing into him
  const paths = [[[-100, 200], [700, 380]], [[-100, 900], [700, 640]], [[2020, 160], [1250, 420]]];
  for (const [[x0, y0], [x1, y1]] of paths) wd += S.path(`M${x0} ${y0} L${x1} ${y1}`, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 8, 'stroke-dasharray': '24 18', opacity: 0.7 });
  for (let i = 0; i < 18; i++) {
    const [[x0, y0], [x1, y1]] = paths[i % 3];
    const u = ((t - d29) * 0.9 + hash(i) ) % 1;
    const x = lerp(x0, x1, u), y = lerp(y0, y1, u);
    wd += S.g(S.rect(-26, -26, 52, 52, 10, { fill: '#FFFFFF', opacity: 0.95 }) + S.circle(-9, -5, 4, { fill: '#2F6FD6' }) + S.circle(9, -5, 4, { fill: '#2F6FD6' }) + S.path('M-9 8 Q0 14 9 8', ln(3, '#2F6FD6')), tf(x, y, 1, Math.sin(t * 4 + i) * 10));
  }
  wd += lag({ x: 980, y: 520, size: grow, t, mood: 'hungry', mouth: t > tFeeds ? (Math.sin(t * 12) > 0 ? 'D' : 'B') : null, look: [-0.5, 0.2] });
  let o = view(cam, wd, 1);
  o += K.bang('TRAFFIC', 520, 180, pop(t, tTraffic, 0.3), 110, -6, '#FFFFFF');
  o += TFS('+1 player = +1 snack', 1450, 920, 44, '#FFE14D', { opacity: f(seg(t, tTraffic + 0.2, tTraffic + 0.4)) });
  return o;
}
// ---- 30. the more everyone rushes... the bigger he gets (Earth)
function shBigger(t) {
  const cam = camKeys(t, [[d30, at(960, 560, 0.95)], [tBigger, at(960, 520, 1.0)], [d31, at(960, 500, 1.06)]]);
  shakeAll(cam, t, [[tBigger, 1.0, 18]]);
  let wd = SETS.earth(t, { night: 0.8 });
  const E_ = SPOTS.earth;
  const top = [E_.cx, E_.cy - E_.r - 60];
  const nArc = Math.round(6 + 18 * seg(t, tRushes - 0.3, tRushes + 0.8));
  let arcs = '';
  for (let i = 0; i < nArc; i++) {
    const a = (hash(i * 3.3) * 1.6 + 0.8) * Math.PI;
    const sx = E_.cx + Math.cos(a) * E_.r * 0.85, sy = E_.cy + Math.sin(a) * E_.r * 0.6;
    const mx = (sx + top[0]) / 2 + (hash(i) - 0.5) * 400, my = Math.min(sy, top[1]) - 120;
    arcs += `M${f(sx)} ${f(sy)} Q${f(mx)} ${f(my)} ${f(top[0])} ${f(top[1])} `;
  }
  wd += S.path(arcs, { fill: 'none', stroke: '#FFE14D', 'stroke-width': 6, 'stroke-dasharray': '20 24', 'stroke-dashoffset': f(-t * 200), opacity: 0.85 });
  const size = lerp(0.45, 1.0, seg(t, d30, tRushes + 0.5)) + 1.9 * ease.outBack(seg(t, tBigger - 0.1, tBigger + 0.5));
  wd += lag({ x: top[0], y: top[1] - 30 * size, size, t, mood: 'hungry', mouth: null, glitch: 0.2 + 0.3 * seg(t, tBigger, tBigger + 0.5), look: [0, 0.6] });
  return view(cam, wd, 1);
}
// ---- 31-32. and today... the whole world is rushing at once
function shToday(t) {
  const cam = camKeys(t, [[d31, at(960, 540, 1.2)], [d32, at(960, 520, 1.32)]], ease.linear);
  return reverseShot(t, cam, { headRot: -4, armL: 10, armR: 10, face: { name: 'confused', fx: [], eyes: { look: [0.2, -0.3] } } }, { arms: false, energy: 0.5 }, { lag: 0.15 });
}
function shWorld(t) {
  const P = [0, 640, 1280];
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#FFFFFF' });
  P.forEach((px, i) => {
    const k = ease.out(seg(t, d32 + i * 0.18, d32 + i * 0.18 + 0.2));
    if (k <= 0) return;
    let pan = '';
    if (i === 0) {
      pan += S.g(X.obbyWorld(t, { archX: 2100 }), 'translate(-900 -320) scale(0.9)');
      for (let j = 0; j < 9; j++) pan += bloxy(((t - d32) * 500 + j * 90) % 760 - 60, 690 + (j % 2) * 30, 1.3, j + 40, t, { pose: 'run' });
    } else if (i === 1) {
      pan += S.g(X.serverBrowser(t, (t - d32) * 1600, 0), 'translate(-320 -60) scale(0.72)');
    } else {
      pan += S.g(SETS.earth(t, { night: 0.6 }), 'translate(-640 -100) scale(1.0)');
      let arcs = '';
      for (let j = 0; j < 14; j++) { const a = j * 0.45; arcs += `M${f(320 + Math.cos(a) * 300)} ${f(460 + Math.sin(a) * 300)} Q${f(320 + Math.cos(a) * 500)} ${f(460 + Math.sin(a) * 500)} 320 120 `; }
      pan += S.path(arcs, { fill: 'none', stroke: '#FFE14D', 'stroke-width': 5, 'stroke-dasharray': '16 20', 'stroke-dashoffset': f(-t * 260), opacity: 0.8 });
    }
    o += clipTo(px + 8, 8, 624, 1064, S.g(pan, `translate(${f(px)} ${f((1 - k) * -1080)})`));
  });
  o += K.bang('RUSH HOUR', 960, 900, pop(t, tWhole, 0.3), 110, -4, '#FF5A5A');
  return o;
}
// ---- 33-34. to starve him. Forever.
function shStarve(t) {
  const cam = camKeys(t, [[d33, at(960, 520, 1.05)], [d34, at(960, 500, 1.18)]], ease.linear);
  let wd = reverseBg(t, 0.2) + gpa(t, { x: 960, y: 1480, s: 1.2, armL: 10, armR: 10, keys: false, face: { name: 'sad', eyes: { look: [0, 0.3] } }, headRot: -3 }, { arms: false, energy: 0.4 });
  let o = view(cam, wd, 1) + S.rect(-200, -200, 2320, 1480, 0, { fill: 'url(#s05dark2)', opacity: 0.85 });
  o += S.ellipse(820, 560, 520, 600, { fill: 'url(#s05warm)', opacity: 0.4 });
  return o;
}
function shPlate(t) {
  const cam = camKeys(t, [[d34, at(960, 560, 1.0)], [tForever, at(960, 560, 1.06)], [d35, at(960, 520, 1.25)]]);
  let wd = S.rect(-800, -600, 3520, 2280, 0, { fill: '#5A6070' });
  for (let i = 0; i < 6; i++) wd += K.loadingWheel(200 + i * 300, 160 + (i % 2) * 60, 26, t + i, '#7A8090', 8);
  wd += lag({ x: 960, y: 470, size: 1.4, t: K.stutterT(t, 6), mood: 'scared', look: [0, 0.9] });
  // table, napkin, fork + knife, empty plate
  wd += S.rect(200, 760, 1520, 60, 14, ol('#C98A52', 7)) + S.rect(240, 820, 40, 300, 8, ol('#A86B3C', 6)) + S.rect(1640, 820, 40, 300, 8, ol('#A86B3C', 6));
  wd += S.ellipse(960, 760, 300, 60, ol('#FFFFFF', 7)) + S.ellipse(960, 756, 200, 36, { fill: '#EEF1F6' });
  wd += S.rect(560, 640, 22, 140, 8, ol('#C9CED8', 5)) + S.path('M550 640 L550 600 M571 640 L571 590 M592 640 L592 600', ln(8, '#C9CED8')) + S.rect(1340, 600, 26, 180, 10, ol('#C9CED8', 5));
  wd += S.path('M860 560 L1060 560 L1000 680 L920 680 Z', ol('#FFFFFF', 6)); // napkin bib
  wd += S.g(S.rect(-120, -50, 240, 100, 12, ol('#E8243C', 6)) + T('CLOSED', 0, 22, 54, '#FFFFFF'), tf(1500, 420, 1, -6 + 6 * Math.sin(t * 2)));
  if (t > tStarve) wd += S.circle(1000, 748, 6, { fill: '#B8A060', stroke: LINE, 'stroke-width': 2 }); // one crumb
  let o = view(cam, wd, 1);
  o += K.bang('FOREVER.', 960, 220, pop(t, tForever, 0.3), 120, 0, '#FFFFFF');
  return o;
}
// ---- 35. so if we stop the Lag...?
function shStop(t) {
  const cam = camKeys(t, [[d35, at(820, 600, 1.25)], [tStop, at(820, 560, 1.4)], [d36, at(820, 540, 1.55)]]);
  const stand = ease.out(seg(t, d35, d35 + 0.4));
  const fist = bump(t, tStop - 0.1, tStop + 0.6);
  const hope = seg(t, tShut - 0.3, tShut + 0.2);
  let chars = juno(t, { x: 820, y: 1000, s: 0.62, turn: lerp(0, 0.35, hope), bodyY: 40 * (1 - stand), armL: 25 + 20 * fist, armR: 25 + 20 * fist, headRot: 8 * hope, face: hope > 0.5 ? { name: 'happy', eyes: { look: [0.8, -0.2] } } : undefined }, { arms: false, energy: 1.2 });
  let o = attic(t, cam, { lag: 0.2, hatchOpen: 1, cat: 'bed' }, SETS.attic.hatchFront(t, { hatchOpen: 1 }) + chars);
  o += S.ellipse(820, 600, 500, 600, { fill: 'url(#s05warm)', opacity: 0.25 });
  return o;
}
// ---- 36. the golden key: "Get your helmet, builder."
function shGoldKey(t) {
  const cam = camKeys(t, [[d36, at(1020, 560, 1.15)], [tBuilderG, at(1060, 520, 1.3)], [END, at(1080, 500, 1.4)]]);
  const unhook = ease.inOut(seg(t, d36, d36 + 0.55));
  const arm = lerp(30, 150, unhook);
  const [hx, hy] = AC.hand(arm, 1);
  const glow = seg(t, d36 + 0.4, d36 + 0.8);
  const key = { svg: goldKey(hx, hy - 150, 0.9, 10, 0, t), layer: 'front' };
  const tap = bump(t, tHelmet - 0.1, tHelmet + 0.45);
  let chars = juno(t, { x: 760, y: 1000, s: 0.62, turn: 0.3, armL: 15, armR: 15 + 160 * tap, face: { name: t > tHelmet ? 'determined' : 'amazed', blink: blinkK(t, 1) } }, { arms: false });
  chars += gpa(t, { x: 1300, y: 1000, s: 0.64, turn: -0.3, armL: 20, armR: arm, goldKey: unhook < 0.3, props: unhook > 0.3 ? [key] : [], keysSwing: 20 * Math.sin(t * 9) * (1 - unhook) }, { arms: false, energy: 0.5 });
  let o = attic(t, cam, { lag: 0.1, hatchOpen: 1, cat: 'bed' }, SETS.attic.hatchFront(t, { hatchOpen: 1 }) + chars);
  // the key's glow over the darkness
  if (glow > 0) {
    const kx = 1300 + hx * 0.64, ky = 1000 + (hy - 150) * 0.64;
    o += view(cam, S.circle(kx, ky + 20, 320, { fill: 'url(#s05goldGlow)', opacity: f(0.8 * glow) }) + K.rays(kx, ky + 20, 14, 360, '#FFF4C8', 0.22 * glow, t * 30) + goldKey(kx, ky, 0.58, 10, 0, t) + K.F.sparkle(kx + 50, ky - 40, 18 * glow * Math.abs(Math.sin(t * 7))), 1);
  }
  if (tap > 0.4) o += view(cam, K.F.sparkle(760, 380, 34), 1);
  o += C.whiteFlash(seg(t, END - 0.18, END));
  return o;
}

// ================================================================= router
const SHOTS = [
  [d01, shMidnight], [d02, shCounts], [d03, shTired], [d04, shLagging], [d05, shBubbles], [d06, shWho], [d07, shIAm], [d08, shLAAAG], [d09, shMore], [d10, shFood],
  [d11, shGetOut], [d12, shVisits], [d13, shMiss], [d14, shRude], [d15, shPencil], [d16, shCatLag], [d17, shRealLife], [d18, shHatch], [d19, shYouKnow], [d20, shJanitor],
  [d21, shBadge], [d22, shFarm], [d23, shKeys], [d24, shNinetyNine], [d25, shLockerKey], [d26, shSandwich], [d27, shTiny], [d28, shShoo], [d29, shTraffic], [d30, shBigger],
  [d31, shToday], [d32, shWorld], [d33, shStarve], [d34, shPlate], [d35, shStop], [d36, shGoldKey],
];
const WHIPS = [d22, d26, d29, d32];
function shotAt(t) {
  let i = SHOTS.length - 1;
  while (i > 0 && t < SHOTS[i][0]) i--;
  return i;
}
function scene(t) {
  let o = SHOTS[shotAt(t)][1](t);
  for (const tc of WHIPS) if (Math.abs(t - tc) < 0.1) o += whip(t, tc, 1);
  return o;
}

// ---------------------------------------------------------------- countdown: 18:00:00 ticking, glitching with the Lag
function timer(t) {
  if (t >= d27 && t < d29) return null; // flashback
  const sec = 18 * 3600 - (t - T0);
  let g = lagLevel(t) * 0.6;
  for (const tw of [tBub1, tBub2, tBubbles, tI, tAm, tMore1, tMore2, tMore3, tYour, tGame7, tHas, tThree7, tVisits, tNobody, tWill, tMiss, tIt]) g = Math.max(g, 0.8 * (1 - seg(t, tw, tw + 0.3)) * (t >= tw ? 1 : 0));
  if (t >= tLAAAG && t < d09) g = 1;
  if (t >= tShutting && t < tShutting + 0.8) g = Math.max(g, 0.7);
  if (t >= tForever && t < tForever + 0.8) g = Math.max(g, 0.9);
  return g > 0.02 ? { sec, glitch: clamp(g, 0, 1) } : sec;
}
function look(t) {
  if (t >= d27 && t < d29) return { grade: 'warm', vignette: 1 };
  if ((t >= d04 && t < d06) || (t >= d08 && t < d11) || (t >= d12 && t < d14) || (t >= d29 && t < d31) || (t >= d34 && t < d35)) return { grade: null, vignette: 0.6 };
  if (t >= d22 && t < d23) return { grade: 'cool', vignette: 0.8 };
  return { grade: 'cool', vignette: 1 };
}
const DEFS = `<defs>
<radialGradient id="s05dark" cx="960" cy="560" r="1100" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0A0720" stop-opacity="0"/><stop offset="0.35" stop-color="#0A0720" stop-opacity="0.15"/><stop offset="0.7" stop-color="#0A0720" stop-opacity="0.6"/><stop offset="1" stop-color="#05040F" stop-opacity="0.85"/></radialGradient>
<radialGradient id="s05dark2" cx="960" cy="620" r="1150" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0A0720" stop-opacity="0"/><stop offset="0.38" stop-color="#0A0720" stop-opacity="0.25"/><stop offset="0.75" stop-color="#0A0720" stop-opacity="0.75"/><stop offset="1" stop-color="#05040F" stop-opacity="0.9"/></radialGradient>
<radialGradient id="s05glowBlue"><stop offset="0" stop-color="#9FE2FF" stop-opacity="0.45"/><stop offset="0.6" stop-color="#7FB8FF" stop-opacity="0.12"/><stop offset="1" stop-color="#7FB8FF" stop-opacity="0"/></radialGradient>
<radialGradient id="s05glowGrey"><stop offset="0" stop-color="#D5D9E0" stop-opacity="0.4"/><stop offset="0.6" stop-color="#A9ADB6" stop-opacity="0.12"/><stop offset="1" stop-color="#A9ADB6" stop-opacity="0"/></radialGradient>
<radialGradient id="s05warm"><stop offset="0" stop-color="#FFD98A" stop-opacity="0.55"/><stop offset="0.6" stop-color="#FFB86A" stop-opacity="0.15"/><stop offset="1" stop-color="#FFB86A" stop-opacity="0"/></radialGradient>
<radialGradient id="s05goldGlow"><stop offset="0" stop-color="#FFF2A8" stop-opacity="0.85"/><stop offset="0.5" stop-color="#FFD24A" stop-opacity="0.3"/><stop offset="1" stop-color="#FFD24A" stop-opacity="0"/></radialGradient>
<radialGradient id="s05sepiaVig" cx="0.5" cy="0.5" r="0.75"><stop offset="0.55" stop-color="#3A2A1A" stop-opacity="0"/><stop offset="1" stop-color="#3A2A1A" stop-opacity="0.6"/></radialGradient>
<linearGradient id="s05beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFF6C8" stop-opacity="0.9"/><stop offset="1" stop-color="#FFF6C8" stop-opacity="0"/></linearGradient>
<pattern id="s05knit" width="60" height="80" patternUnits="userSpaceOnUse"><path d="M10 0 Q30 20 10 40 Q-10 60 10 80 M50 0 Q30 20 50 40 Q70 60 50 80" fill="none" stroke="#A87420" stroke-width="6" opacity="0.6"/></pattern>
</defs>`;

module.exports = { scene, look, timer, DEFS, SHOTS };
