// SC 09 · DELETE SAVE. Continues SC 08's frozen red town: the grey DELETE SAVE? window pops into the sky, the fine print
// ("Respawn will be disabled forever", the respawn icon gets a red X), the hero panics (TONIGHT! poster insert, the
// nightmare full house from the stage), Ivy: "Then you mess up. With me." -> silent look up at the button. The montage of
// his fails as photo cards (56 skate crashes, 31 bad jokes with crickets, one very surprised goldfish), the cards scatter off
// his softening face, the frozen ghosts get back up (golden rims: trying). "Okay. Delete." -> over-the-shoulder press on YES ->
// every ghost pops into block confetti, colour floods back (golden hour), birds fly + the bus drives over the town, the
// hanging pancake finally drops on the plate, Dad unfreezes mid-joke ("Why am I outside?"), Tip's slow goodbye dissolving into
// pixels, the last spark, the flag falls into the grass and goes dark, LIVES ∞ -> 1, walking off into the sunset (-> SC 10).
'use strict';

const K = require('./kit');
const R = require('./respawn');
const AC = require('./acting');
const SH = require('./sets_home');
const SS = require('./sets_school');
const X = require('../rig/extras');
const { draw } = require('../rig/cast');
const E = require('./s01_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const { tf, TS, TFS, pop, mod, at, toScr, shakeAll, frameTf, clipRect, whip, smash, zoomLines, boing, impact, sweat, failPose, ghostFail } = E;

const A = Array.from({ length: 11 }, (_, i) => L('09.' + i));
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;
const START = K.V.scene('SC 09').start, END = K.V.scene('SC 10').start;
const YD = SS.SPOTS.schoolyard;
const sAt = (y) => 0.5 * (y - 160) / 800;

// ================================================================= beats
const tDel = w(0, 'Delete');
const tPress = w(5, 'Delete.') + 0.12;
const tPancake = w(6, 'disabled.');
const tDoc = w(7, 'doctor?');
const tTipFade0 = w(8, "That's"), tTipGone = Math.max(A[8].b + 1.3, w(8, 'count.') + 1.2);
const tFlag = A[9].b - 0.25;
const tOne = w(10, 'one.');

const CUT = {};
CUT.town = START;
CUT.yard = w(0, 'and') - 0.1;
CUT.fine = w(0, 'But') - 0.1;
CUT.ever = w(0, 'Ever.') - 0.16;
CUT.poster = w(1, 'TONIGHT!') - 0.06;
CUT.house = w(1, 'What') - 0.1;
CUT.ivy = A[2].a - 0.1;
CUT.look = A[2].b + 0.15;
CUT.fails = A[3].a - 0.1;
CUT.c56 = w(3, 'Fifty-six') - 0.15;
CUT.c31 = w(3, 'Thirty-one') - 0.15;
CUT.c1 = w(3, 'One') - 0.15;
CUT.face = A[4].a - 0.1;
CUT.trying = w(4, 'They', 1) - 0.12;
CUT.okay = A[5].a - 0.1;
CUT.press = w(5, 'Delete.') - 0.12;
CUT.boom = tPress + 0.32;
CUT.townG = A[6].a - 0.1;
CUT.pancake = w(6, 'Respawn...') - 0.1;
CUT.dad = A[7].a - 0.1;
CUT.tip = A[8].a - 0.1;
CUT.tipCU = w(8, 'checkpoints.') + 0.2;
CUT.thanks = A[9].a - 0.1;
CUT.flag = Math.max(A[9].b - 0.45, A[9].a + 0.6);
CUT.lives = A[10].a - 0.05;
CUT.walk = w(10, 'Just') - 0.12;
{
  const ks = Object.keys(CUT);
  for (let i = 1; i < ks.length; i++) if (CUT[ks[i]] < CUT[ks[i - 1]] + 0.25) CUT[ks[i]] = CUT[ks[i - 1]] + 0.25;
}

// ================================================================= shared
const HERO = { x: 1040, y: 960, s: 0.5 };
const IVY = { x: 1330, y: 950, s: 0.49 };
const FLAG = { x: YD.flagSpot.x, y: YD.flagSpot.y, s: YD.flagSpot.s };
const TIPW = [1190, 470];                         // Tip's home in the yard (world)
const WIN = { x: 960, y: 250, w: 1000, h: 470 };  // screen-space DELETE SAVE? window
const YES = [WIN.x - 163, WIN.y + 168];
const delWin = (t, k, o = {}) => R.sysWindow({ x: WIN.x, y: WIN.y, w: WIN.w, h: WIN.h, k, t, theme: 'grey', title: 'DELETE SAVE?', icon: 'trash',
  lines: ['Delete the save file?', 'Everything goes back to normal.'], small: 'Respawn will be disabled forever.', buttons: ['YES', 'NO'], hl: 'YES', ...o });
// the frozen ghosts around the yard (full ghosts, frozen mid-fail): [kind, x, y, u, flip]
const YG = [
  ['stairs', 1110, 740, 0.28, false], ['slip', 520, 905, 0.42, false], ['ball', 300, 870, 0.45, false], ['skate', 1600, 935, 0.42, true],
  ['trip', 1820, 885, 0.5, true], ['flail', 800, 820, 0.3, false], ['bike', 1420, 815, 0.35, true], ['slip', 2080, 900, 0.38, true],
  ['ball', -60, 905, 0.4, true], ['trip', 640, 760, 0.52, false],
];
// far ghost lites along the building
const YL = Array.from({ length: 26 }, (_, i) => ({ x: -500 + i * 118 + hash(i * 3.1) * 60, y: 700 + hash(i * 1.7) * 50, kind: ['slip', 'ball', 'skate', 'trip', 'flail', 'stairs', 'facepalm'][i % 7], u: hash(i * 5.3) }));
// stand-up blend: fail pose -> standing (k 0..1), cheer = raise an arm
function standUp(P, k, cheer = 0) {
  const o = { ...P };
  for (const key of ['rot', 'lift', 'legL', 'legR', 'kneeL', 'kneeR', 'lean', 'headRot']) if (o[key] !== undefined) o[key] = lerp(o[key], 0, k);
  o.armL = lerp(P.armL ?? 9, 12, k); o.armR = lerp(P.armR ?? 9, lerp(12, 165, cheer), k);
  if (k > 0.5) { o.view = 'front'; o.flip = false; o.turn = 0.3; }
  return o;
}
function yardGhosts(t, o = {}) {
  const { freeze = true, up = 0, popT = null, colorK = 0, skipNear = false } = o;
  let back = '', front = '';
  // far lites (frozen), pop with the rest
  const poses = [];
  YL.forEach((g, i) => {
    const dly = popT !== null ? popT + 0.1 + hash(i) * 0.5 : Infinity;
    if (t >= dly) return;
    const P = failPose(g.kind, freeze ? g.u : mod(t / 1.6 + g.u, 1));
    poses.push({ x: g.x, y: g.y, s: sAt(g.y), ...standUp(P, up * seg(up, 0, 1), i % 3 === 0 ? 1 : 0) });
  });
  back += draw.ghostCrowd(poses, { alpha: 0.6 });
  YL.forEach((g, i) => { if (popT !== null) back += R.ghostPop({ x: g.x, y: g.y, s: sAt(g.y), age: t - (popT + 0.1 + hash(i) * 0.5), seed: i + 50 }); });
  YG.forEach(([kind, x, y, u, fl], i) => {
    if (skipNear && Math.abs(x - HERO.x) < 420) return;
    const s = sAt(y);
    const dist = Math.abs(x - HERO.x) + Math.abs(y - HERO.y);
    const dly = popT !== null ? popT + dist / 2600 : Infinity;
    const age = t - dly;
    let svg = '';
    if (age < 0) {
      const ku = clamp(up * 1.4 - i * 0.05, 0, 1);
      if (ku > 0) {
        // golden rim: "they looked like... trying"
        svg += S.ellipse(x, y - 470 * s, 340 * s, 560 * s, { fill: 'url(#rspGlowY)', opacity: f(0.9 * ku) }) + S.ellipse(x, y - 470 * s, 220 * s, 420 * s, { fill: 'url(#rspGlowW)', opacity: f(0.35 * ku) });
        let P = failPose(kind, u);
        if (fl && P.view === 'side') P.flip = !P.flip;
        P = standUp(P, ease.inOut(ku), i % 2);
        svg += draw.ghost({ x, y, s, alpha: 0.62, ...P, face: { name: ku > 0.7 ? 'happy' : 'determined' } });
      } else svg += ghostFail(kind === 'bike' ? 'trip' : kind, t, u, { x, y, s, flip: fl, alpha: 0.6 });
    } else svg += R.ghostPop({ x, y, s, age, seed: i + 7 });
    if (y > HERO.y - 20) front += svg; else back += svg;
  });
  return { back, front };
}
function yard(t, cam, behind, chars, o = {}) {
  const Ly = SS.schoolyard.layers(o.tm ?? t, cam, { time: o.time || 'day', red: o.red ?? 1, frozen: o.frozen ?? 0.8, colorBack: o.colorBack, colorFrom: o.colorFrom, crowdBench: false });
  const hz = o.haze ? S.rect(0, 0, 1920, 1080, 0, { fill: o.hazeCol || '#3A1828', opacity: f(o.haze) }) : '';
  return Ly.bg + Ly.mid + view(cam, behind || '', 1) + hz + Ly.pole + Ly.front + view(cam, chars, 1) + Ly.fg + Ly.light;
}
// frost edges + pause bars (SC 08's frozen look, continued)
function frost(k, t) {
  if (k <= 0) return '';
  let o = S.rect(0, 0, 1920, 50, 0, { fill: '#CFEFFF', opacity: f(0.28 * k) }) + S.rect(0, 1030, 1920, 50, 0, { fill: '#CFEFFF', opacity: f(0.28 * k) });
  o += S.rect(0, 0, 60, 1080, 0, { fill: '#CFEFFF', opacity: f(0.22 * k) }) + S.rect(1860, 0, 60, 1080, 0, { fill: '#CFEFFF', opacity: f(0.22 * k) });
  let cr = '';
  for (let i = 0; i < 12; i++) {
    const side = i % 4, u = hash(i * 3.3 + 2);
    const [x, y] = side === 0 ? [u * 1920, 0] : side === 1 ? [u * 1920, 1080] : side === 2 ? [0, u * 1080] : [1920, u * 1080];
    const a = Math.atan2(540 - y, 960 - x) + (hash(i) - 0.5) * 0.8, L_ = (100 + 160 * hash(i * 7)) * k;
    cr += `M${f(x)} ${f(y)} L${f(x + Math.cos(a) * L_)} ${f(y + Math.sin(a) * L_)} `;
  }
  return o + S.path(cr, ln(5, '#FFFFFF', 0.7 * k)) + (Math.floor(t * 2) % 2 ? '' : TFS('II', 1830, 120, 70, '#FFFFFF', { opacity: f(k) }));
}
const redPulse = (t, k = 1) => S.rect(0, 0, 1920, 1080, 0, { fill: '#FF2A3A', opacity: f(k * (0.05 + 0.04 * Math.sin(t * 5))) });
const hero = (t, pose = {}, act = {}) => actor('you', t, { ...HERO, backpack: true, ...pose }, act);
const ivy = (t, pose = {}, act = {}) => actor('ivy', t, { ...IVY, turn: -0.4, ...pose }, act);
const tipAt = (t, x, y, o = {}) => R.tip({ x, y, s: 1.3, t, look: [-0.5, 0.3], glitch: 0.35, mood: 'sad', ...o });
function flagSvg(t, state = 'red', o = {}) {
  return R.checkpoint({ ...FLAG, t, state, part: 'back', pole: false, flag: false, glow: state === 'dead' ? 0 : 0.8 }) + R.flag({ x: FLAG.x + 40, y: FLAG.y, s: FLAG.s * 1.2, t, state, ...o });
}

// ================================================================= SHOTS
// ---- 1. the frozen red town (SC 08's last frame) -> DELETE SAVE? pops into the sky on "Delete"
function shTown(t) {
  const fz = START - 0.4;
  const u = seg(t, CUT.town, CUT.yard);
  const cam = { zoom: lerp(0.7, 0.82, ease.inOut(u)), x: lerp(40, 80, u), y: lerp(15, -10, u) };
  const Lt = SH.town.layers(fz, cam, { time: 'day', red: 1, frozen: 1, freezeAt: fz });
  let o = Lt.bg + Lt.mid;
  // frozen ghosts on the street + roofs (lites)
  const P = [];
  for (let i = 0; i < 22; i++) P.push({ x: -500 + i * 170, y: 990, s: 0.26, ...failPose(['slip', 'ball', 'skate', 'trip', 'flail'][i % 5], hash(i * 2.1)) });
  const P2 = SH.SPOTS.town.roofs.filter((a) => a.k > 0.6).map((a, i) => ({ x: a.x, y: a.y, s: a.s, ...failPose(['flail', 'stairs', 'facepalm'][i % 3], hash(i)) }));
  o += view(cam, draw.ghostCrowd(P2, { alpha: 0.6 }), 0.68) + view(cam, draw.ghostCrowd(P, { alpha: 0.6 }), 1);
  o += Lt.fg + Lt.light + redPulse(t, 0.8) + frost(1, t);
  o += delWin(t, seg(t, tDel - 0.05, tDel + 0.35), { y: WIN.y + 60 });
  o += R.tip({ x: 1640, y: 640, s: 1.1, t, look: [-0.8, -0.4], glitch: 0.4, mood: 'sad' });
  return o + smash(t, tDel - 0.05, 0.1, 0.5);
}
// ---- 2. the yard: the window hangs over the hero, Ivy beside him, Tip: "and everything goes back to normal"
function shYard(t) {
  const u = seg(t, CUT.yard, CUT.fine);
  const cam = at(1110, lerp(580, 560, u), lerp(1.12, 1.22, ease.inOut(u)));
  const G = yardGhosts(START);
  let ch = flagSvg(START);
  ch += hero(t, { turn: -0.1, armL: 14, armR: 14, headRot: -8, face: { name: 'nervous', eyes: { look: [0, -1] } } });
  ch += ivy(t, { face: { name: 'shocked', eyes: { look: [-0.2, -1] } }, armL: 20, armR: 20 });
  let o = yard(START, cam, G.back + G.front, ch, { haze: 0.18 });
  const [tx, ty] = toScr(cam, 1560, 600);
  o += tipAt(t, tx, ty);
  o += delWin(t, 1, { y: WIN.y - 30, s: 0.92 });
  return o + redPulse(t, 0.6) + frost(0.6, t);
}
// ---- 3. "But no more respawns." insert on the fine print; the respawn icon gets a red X
function shFine(t) {
  const u = seg(t, CUT.fine, CUT.ever);
  const z = lerp(2.1, 2.4, u);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#5A1420' });
  o += S.g(delWin(t, 1, { x: 960, y: 540 }), frameTf(z * 0.68, -2, -260, 40));
  // the respawn icon + red X slam
  const tX = w(0, 'respawns.');
  const k = pop(t, tX - 0.05, 0.22);
  const ic = S.circle(0, 0, 90, ol('#2A2F3D', 10)) + R.icon('retry', 0, 0, 56, '#FFFFFF', t);
  o += S.g(ic, tf(1660, 380, pop(t, CUT.fine + 0.1, 0.25) * 1.2, -6));
  if (k > 0) o += S.g(S.path('M-80 -80 L80 80 M80 -80 L-80 80', ln(34, '#151515')) + S.path('M-80 -80 L80 80 M80 -80 L-80 80', ln(22, '#FF3B4E')), tf(1660, 380, k * 1.2));
  o += TFS('NO MORE', 1660, 580, 50, '#FFFFFF', { opacity: f(k) }) + TFS('RESPAWNS', 1660, 640, 50, '#FFFFFF', { opacity: f(k) });
  return o + smash(t, tX, 0.1, 0.4, '#FF3B4E');
}
// ---- 4. "Ever." / "But the talent show is TONIGHT!" — panic close-up
function shEver(t) {
  const tT = w(1, 'TONIGHT!');
  const cam = shakeAll(at(1080, 560, lerp(2.2, 2.35, seg(t, CUT.ever, CUT.poster))), t, [[w(1, 'But'), 0.25, 6]]);
  const G = yardGhosts(START, { skipNear: true });
  let ch = flagSvg(START);
  const talking = t >= A[1].a;
  const wave = Math.sin(t * 15);
  ch += hero(t, { volume: false, turn: 0.15, armL: talking ? 120 + 30 * wave : 14, armR: talking ? 120 - 30 * wave : 14, face: talking ? { name: 'scared', fx: ['sweat2'] } : { name: 'shocked', eyes: { look: [0.2, -0.6] } } }, { arms: false, energy: 1.6 });
  ch += ivy(t, { volume: false, face: { name: 'worried' } });
  let o = yard(START, cam, G.back + G.front, ch, { haze: 0.3 });
  return o + redPulse(t, 0.5) + zoomLines(960, 420, bump(t, tT - 0.05, tT + 0.4), t, '#FFFFFF');
}
// ---- 5. TONIGHT! poster insert
function shPoster(t) {
  const u = seg(t, CUT.poster, CUT.house);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#7A2A3A' }) + S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#rspScan)', opacity: 0.25 });
  const p = SS.schoolPoster(['SCHOOL', 'TALENT SHOW', 'FRIDAY 7 PM'], 960, 470, { w: 760, h: 820, col: '#FFE9A8', ink: '#2A1640', rot: 0, s: 1, size: 96, icon: 'star' });
  o += S.g(p, frameTf(lerp(0.95, 1.08, ease.out(u)), -3, 0, 40));
  const k = pop(t, CUT.poster + 0.08, 0.2);
  o += S.g(S.rect(-330, -80, 660, 160, 22, { fill: 'none', stroke: '#E8243A', 'stroke-width': 18 }) + T('TONIGHT!', 0, 52, 140, '#E8243A'), tf(1000, 760, k * 1.05, -12), { opacity: f(0.95) });
  return o + smash(t, CUT.poster, 0.1, 0.6);
}
// ---- 6. the nightmare: the full house seen from the stage; "In front of EVERYONE?!"
function shHouse(t) {
  const tE = w(1, 'EVERYONE?!');
  const z = lerp(1.25, 1.05, ease.inOut(seg(t, CUT.house, tE))) - 0.12 * ease.out(seg(t, tE, tE + 0.5));
  const cam = { zoom: z, x: 0, y: -30 };
  const Lh = SS.auditorium.layers(t, { view: 'house', lights: 0.25, gasp: t > tE - 0.05, cam });
  let o = view(cam, Lh.bg || '', 1) + view(cam, Lh.mid, 1) + view(cam, Lh.fg || '', 1) + view(cam, Lh.light || '', 1);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#5A0010', opacity: 0.32 });
  // his trembling back on the stage
  const sh = Math.sin(t * 40) * 4;
  o += actor('you', t, { x: 520 + sh, y: 1640, s: 1.2, view: 'back', volume: false, backpack: true, armL: 6, armR: 6 });
  o += zoomLines(960, 500, 0.7 * bump(t, tE, tE + 0.6), t, '#FFD6DC');
  return o + smash(t, CUT.house, 0.1, 0.5, '#000000');
}
// ---- 7. Ivy: "Then you mess up. With me."
function shIvy(t) {
  const u = seg(t, CUT.ivy, CUT.look);
  const tWith = w(2, 'With');
  const cam = at(lerp(1190, 1210, u), 560, lerp(1.75, 1.95, ease.inOut(u)));
  const G = yardGhosts(START, { skipNear: true });
  let ch = flagSvg(START);
  const hand = ease.inOut(seg(t, tWith - 0.3, tWith + 0.2));
  ch += hero(t, { volume: false, turn: 0.45, face: t > tWith ? { name: 'sad', eyes: { look: [0.8, 0] } } : { name: 'nervous', eyes: { look: [0.8, 0] } } });
  ch += ivy(t, { volume: false, x: IVY.x - 60, turn: -0.5, armL: lerp(14, 72, hand), armR: 14, face: t > tWith ? { name: 'happy', eyes: { look: [-0.7, 0] } } : undefined }, { arms: false });
  let o = yard(START, cam, G.back + G.front, ch, { frozen: 0.9, haze: 0.3 });
  return o + redPulse(t, 0.35) + S.rect(0, 0, 1920, 1080, 0, { fill: '#FFB860', opacity: f(0.06 * hand) });
}
// ---- 8. silence: over the shoulder, he looks up at YES
function shLook(t) {
  const u = seg(t, CUT.look, CUT.fails);
  const cam = at(1040, 520, 1.2 + 0.1 * ease.inOut(u));
  let o = yard(START, cam, '', yardGhosts(START).back);
  o += delWin(t, 1, { y: WIN.y + 30, s: 1.05 + 0.06 * u });
  o += actor('you', t, { x: 700, y: 1700 - 30 * u, s: 1.25, view: 'back', volume: false, backpack: true, headRot: -4, armL: 6, armR: 6 });
  return o + redPulse(t, 0.4) + frost(0.4, t);
}
// ---- 9. "You looked at all your fails." — pan across the frozen ghosts
function shFails(t) {
  const u = ease.inOut(seg(t, CUT.fails, CUT.c56));
  const cam = at(lerp(260, 1900, u), 700, 1.45);
  const G = yardGhosts(START);
  let ch = flagSvg(START) + G.back + hero(t, { turn: -0.3, face: { name: 'sad', eyes: { look: [lerp(-1, 1, u), 0.1] } } }) + ivy(t, { face: 'neutral' }) + G.front;
  return yard(START, cam, '', ch) + redPulse(t, 0.4);
}

// ---- 10-12. the montage of fails: photo cards
const CARD = { w: 1240, h: 760 };
function card(inner, x, y, rot, s, label, stamp, kStamp, t) {
  const id = S.uid('s09k');
  const iw = CARD.w - 48, ih = CARD.h - 150;
  let g = S.rect(-CARD.w / 2 + 14, -CARD.h / 2 + 18, CARD.w, CARD.h, 18, { fill: '#000000', opacity: 0.3 });
  g += S.rect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, 18, ol('#FFFDF6', 8));
  g += S.clipDef(id, S.rect(-iw / 2, -CARD.h / 2 + 24, iw, ih, 6));
  g += S.g(S.g(inner, `translate(${f(-iw / 2)} ${f(-CARD.h / 2 + 24)}) scale(${f(iw / 1920)} ${f(ih / 1080)})`), null, { 'clip-path': `url(#${id})` });
  g += S.rect(-iw / 2, -CARD.h / 2 + 24, iw, ih, 6, { fill: 'none', stroke: '#151515', 'stroke-width': 5 });
  g += TF(label, 0, CARD.h / 2 - 44, 56, '#2A1640');
  if (kStamp > 0) g += S.g(S.rect(-250, -66, 500, 132, 22, { fill: 'none', stroke: '#E8243A', 'stroke-width': 12 }) + T(stamp, 0, 30, 92, '#E8243A'), tf(CARD.w / 2 - 300, CARD.h / 2 - 210, ease.outBack(clamp(kStamp, 0, 1)) * 1.0, -10), { opacity: 0.92 });
  return S.g(g, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
const blankCard = (x, y, rot, s, col) => S.g(S.rect(-CARD.w / 2 + 14, -CARD.h / 2 + 18, CARD.w, CARD.h, 18, { fill: '#000', opacity: 0.3 }) + S.rect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, 18, ol('#FFFDF6', 8)) + S.rect(-CARD.w / 2 + 24, -CARD.h / 2 + 24, CARD.w - 48, CARD.h - 150, 6, ol(col, 5)), `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
// card contents (full-frame svgs)
function in56(t) {
  const cam = SS.camAt(3820, 700, 1.25);
  const Ly = SS.schoolyard.layers(t, cam, { time: 'day' });
  let ch = '';
  const P = [];
  for (let i = 0; i < 7; i++) P.push({ x: 3420 + i * 150, y: 850 + (i % 2) * 40, s: 0.4, ...failPose('skate', mod(t / 1.1 + i * 0.14, 1)) });
  ch += draw.ghostCrowd(P, { alpha: 0.5 });
  ch += ghostFail('skate', t, mod(t / 1.1, 1), { x: 3560, y: 968, s: 0.55, alpha: 0.75 }) + ghostFail('skate', t, mod(t / 1.1 + 0.45, 1), { x: 4020, y: 968, s: 0.55, flip: true, alpha: 0.75 });
  return Ly.bg + Ly.mid + Ly.pole + Ly.front + view(cam, ch, 1) + Ly.fg + Ly.light;
}
function in31(t) {
  const cam = SS.camAt(1720, 640, 1.35);
  const CF = SS.SPOTS.cafeteria;
  const kids = CF.seats.back.slice(0, 4).map((p, i) => K.draw.kid(4 + i * 5, { ...p, volume: false, turn: -0.2, face: { name: 'deadpan', eyes: { upper: 0.5 } } })).join('');
  let st = '';
  // onion-skin: four attempts at the same joke on the bench
  for (let i = 0; i < 4; i++) {
    const ph = t * 3 + i * 1.7;
    st += draw.ghost({ x: CF.stage.x - 330 + i * 220, y: CF.stage.y + 60, s: 0.5, alpha: 0.4 + 0.15 * i, armL: 80 + 40 * Math.sin(ph), armR: 120 + 30 * Math.cos(ph), headRot: 8 * Math.sin(ph), face: { name: i === 3 ? 'excited' : 'talkHappy' } });
  }
  let o = SS.cafeteria.compose(t, {}, ['', kids, ''], st, cam);
  o += S.g(S.rect(-560, -60, 1120, 100, 30, ol('#FFFFFF', 6)) + TF('...and that\'s why the pizza has a fan club!', 0, 8, 42, '#2A1640'), tf(960, 130));
  const cr = Math.floor(t * 6) % 2;
  o += S.g(S.path('M0 0 q30 -30 60 0 q-30 20 -60 0 Z M10 -6 l-30 -40 M40 -6 l40 -36', { fill: '#3C6E2A', stroke: '#151515', 'stroke-width': 5 }) + TFS('*cricket*', 30, 70, 44, '#FFFFFF'), tf(1640, 760 + cr * 4, 1.5));
  return o;
}
function in1(t) {
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#BFE6F2' }) + S.rect(0, 760, 1920, 320, 0, { fill: '#C98E5A' });
  const B = X.fishbowl.layers({ x: 960, y: 1080, s: 1.75, t, gary: { yaw: 25, s: 1.25, lids: 0, mouth: 'open', look: [-0.3, 0.4] }, garyFront: true });
  const gx = 960 + (-120) * 1.75, gy = 1080 - 44 * 1.75;
  const bob = Math.sin(t * 3) * 6;
  o += B.back + actor('you', t, { x: gx + 150, y: gy - 6 + bob, s: 0.12, volume: false, shadow: false, armL: 150, armR: 150, face: { name: 'happy' } }) + B.front;
  o += S.path(R.star4(1180, 300, 34, t * 90), { fill: '#FFFFFF' }) + TFS('!!', 1260, 330, 90, '#FFE14D');
  return o;
}
const MONT = [
  { t0: CUT.c56, fn: in56, label: 'FAIL: skateboard trick', stamp: '× 56', word: () => w(3, 'crashes.'), x: 960, y: 500, rot: -4, col: '#9FC9E8' },
  { t0: CUT.c31, fn: in31, label: 'FAIL: cafeteria joke', stamp: '× 31', word: () => w(3, 'jokes.'), x: 990, y: 490, rot: 3, col: '#F2D27A' },
  { t0: CUT.c1, fn: in1, label: 'FAIL: respawned in Gary\'s bowl', stamp: '× 1', word: () => w(3, 'goldfish.'), x: 950, y: 500, rot: -2, col: '#BFE6F2' },
];
function shMontage(t) {
  // backdrop: the frozen yard, dimmed
  const cam = at(1040, 600, 1.1);
  let o = yard(START, cam, '', yardGhosts(START).back + hero(START, { turn: -0.3 }), { frozen: 1 });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#1A0610', opacity: 0.62 });
  let top = 0;
  for (let i = 0; i < MONT.length; i++) if (t >= MONT[i].t0) top = i;
  for (let i = 0; i <= top; i++) {
    const m = MONT[i];
    const k = ease.out(seg(t, m.t0, m.t0 + 0.32));
    const x = lerp(2600, m.x, k), rot = lerp(16, m.rot, k);
    if (i < top) { o += blankCard(m.x, m.y, m.rot, 1, m.col); continue; }
    const kS = seg(t, m.word() - 0.05, m.word() + 0.25);
    o += card(m.fn(t), x, m.y, rot, 1, m.label, m.stamp, kS, t);
  }
  return o + whip(t, MONT[top].t0, -1, 0.08);
}
// ---- 13. "And for the first time... they didn't look embarrassing." — the cards scatter off his softening face
function shFace(t) {
  const u = seg(t, CUT.face, CUT.trying);
  const cam = at(1050, 520, 2.6 + 0.2 * u);
  const warm = seg(t, CUT.face + 0.3, CUT.trying);
  let ch = hero(t, { volume: false, turn: 0.05, face: u < 0.45 ? { name: 'sad', eyes: { look: [0, 0.4] } } : { name: 'happy', eyes: { look: [0.1, -0.2] }, mouth: 'smallSmile' } });
  let o = yard(START, cam, yardGhosts(START, { skipNear: true }).back, ch, { frozen: 1, haze: 0.35 });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FFB050', opacity: f(0.12 * warm) });
  // the three cards fly apart
  const k = ease.in(seg(t, CUT.face, CUT.face + 0.42));
  MONT.forEach((m, i) => {
    const dx = [-1, 1, 0.3][i], dy = [-0.4, -0.2, 1][i];
    if (k < 1) o += blankCard(m.x + dx * 1500 * k, m.y + dy * 900 * k, m.rot + dx * 40 * k, 1 - 0.2 * k, m.col);
  });
  return o;
}
// ---- 14. "They looked like... trying." — every frozen ghost gets back up, golden rims
function shTrying(t) {
  const up = ease.inOut(seg(t, CUT.trying + 0.1, w(4, 'trying.') + 0.3));
  const cam = camKeys(t, [[CUT.trying, { x: 80, y: -10, zoom: 1.0 }], [CUT.okay, { x: 80, y: -30, zoom: 0.94 }]]);
  const G = yardGhosts(t, { up });
  let ch = flagSvg(START) + G.back + hero(t, { turn: -0.2, face: { name: 'happy', eyes: { look: [-0.4, 0] } } }) + ivy(t, { face: 'happy' }) + G.front;
  let o = yard(START, cam, '', ch, { frozen: 1 - 0.4 * up });
  return o + S.rect(0, 0, 1920, 1080, 0, { fill: '#FFC060', opacity: f(0.1 * up) });
}
// ---- 15. "Okay." determined close-up
function shOkay(t) {
  const cam = at(1100, 540, 2.15);
  let ch = hero(t, { volume: false, turn: 0.1, face: { name: 'determined', eyes: { look: [0.1, -0.4] } }, headY: 8 * bump(t, w(5, 'Okay.'), w(5, 'Okay.') + 0.3) }, { arms: false });
  ch += ivy(t, { volume: false, x: IVY.x - 80, turn: -0.5, armL: 70, face: { name: 'happy', eyes: { look: [-0.7, 0] } } }, { arms: false });
  return yard(START, cam, yardGhosts(START, { skipNear: true }).back, ch, { frozen: 0.7, haze: 0.3 }) + redPulse(t, 0.25);
}
// ---- 16. "Delete." — over the shoulder, the hand on YES
function shPress(t) {
  const reach = ease.outBack(seg(t, CUT.press, tPress));
  const press = seg(t, tPress, tPress + 0.4);
  const cam = at(1040, 520, 1.3);
  let o = yard(START, cam, '', yardGhosts(START).back);
  o += delWin(t, 1, { x: 823, y: 578, s: 1.12, press });
  o += actor('you', t, { x: 360, y: 1700, s: 1.25, view: 'back', volume: false, backpack: true, armR: lerp(10, 158, reach), armL: 8, lean: -3 * reach });
  o += zoomLines(640, 766, 0.8 * bump(t, tPress, tPress + 0.3), t, '#FFFFFF', 18, 160);
  return o + redPulse(t, 0.4) + smash(t, tPress, 0.12, 0.5);
}
// ---- 17. BOOM: every ghost pops into block confetti, colour floods back from the hero (golden hour)
function shBoom(t) {
  const u = seg(t, CUT.boom, CUT.townG);
  const cam = shakeAll({ x: 120, y: -60 + 30 * u, zoom: 0.88 + 0.05 * u }, t, [[tPress + 0.3, 0.6, 18]]);
  const cb = ease.inOut(seg(t, tPress + 0.4, tPress + 1.9));
  const [hx, hy] = toScr(cam, HERO.x, HERO.y - 200);
  const G = yardGhosts(t, { popT: tPress + 0.32 });
  let ch = flagSvg(t, 'saved') + G.back;
  ch += hero(t, { turn: -0.1, armL: 30 + 20 * cb, armR: 30 + 20 * cb, face: { name: 'amazed', eyes: { look: [0, -0.7] } } });
  ch += ivy(t, { face: { name: 'excited', eyes: { look: [-0.2, -0.8] } }, armL: 40 + 100 * cb, armR: 40 + 100 * cb }, { arms: false });
  ch += G.front;
  let o = yard(t, cam, '', ch, { time: 'sunset', red: 0, frozen: 0, colorBack: cb, colorFrom: [hx, hy] });
  o += R.blockConfettiRain(t, { t0: tPress + 0.3, n: 60, seed: 4 });
  // the window bursts into blocks
  o += R.blockConfetti({ x: WIN.x, y: WIN.y, age: t - (tPress + 0.3), n: 40, spread: 1.6, power: 1.2, seed: 8 });
  if (t < tPress + 0.42) o += delWin(t, 1 - seg(t, tPress + 0.3, tPress + 0.42), { y: WIN.y + 20 });
  return o + R.flash(0.85 * (1 - seg(t, CUT.boom, CUT.boom + 0.3)));
}
// ---- 18. "Save deleted." — the town turns golden: birds take off, the bus drives, confetti settles
function shTownG(t) {
  const u = seg(t, CUT.townG, CUT.pancake);
  const cam = { zoom: lerp(0.78, 0.86, u), x: 120, y: lerp(30, 10, u) };
  const busX = lerp(1560, 2700, ease.in(seg(t, CUT.townG + 0.2, CUT.pancake + 0.4)));
  const Lt = SH.town.layers(t, cam, { time: 'golden', bus: busX });
  let o = Lt.bg + Lt.mid;
  // birds take off from the frozen sky (flapping now)
  let b = '';
  for (let i = 0; i < 9; i++) {
    const a = seg(t, CUT.townG + i * 0.06, CUT.townG + 2.5);
    const bx = 200 + i * 190 + 400 * a * (i % 2 ? 1 : -0.6), by = 220 + 60 * hash(i) - 200 * a;
    b += SH.bird(bx, by, 1.1, undefined, { flying: true, flap: mod(t * 5 + i * 0.3, 1), flip: i % 2 === 0 });
  }
  o += b + Lt.fg + Lt.light;
  o += R.blockConfettiRain(t, { t0: tPress + 0.3, n: 55, seed: 9, speed: 0.8 });
  o += R.savedToast(70, 860, seg(t, A[6].a - 0.05, A[6].a + 0.35), { t, text: 'Save deleted', out: seg(t, CUT.pancake + 0.6, CUT.pancake + 1.0) });
  return o + whip(t, CUT.townG, 1);
}
// ---- 19. "Respawn... disabled." — the kitchen: the hanging pancake finally drops on the plate
function shPancake(t) {
  const KS = SH.SPOTS.kitchen;
  const cam = at(KS.pan.x, lerp(470, 520, seg(t, CUT.pancake, CUT.dad)), 2.0);
  const fall = ease.in(seg(t, tPancake - 0.38, tPancake));
  const py = lerp(KS.panHang.y, KS.pan.y - 6, fall);
  const L_ = SH.kitchen.layers(t, { time: 'evening', panCake: false, stack: false, coat: false });
  let o = view(cam, L_.bg, 0.8) + view(cam, L_.mid, 1);
  let ch = SH.pancake(KS.pan.x, py, 1.1 * (1 + 0.25 * bump(t, tPancake, tPancake + 0.25)), 0);
  if (t < tPancake - 0.38) ch += S.g(R.spinner(0, 0, 26, t, '#FFFFFF'), tf(KS.pan.x, KS.panHang.y - 90));
  o += view(cam, L_.front + ch + K.C.dust(KS.pan.x - 60, KS.pan.y, tPancake, t) + L_.fg + L_.light, 1);
  const [sx, sy] = toScr(cam, KS.pan.x, KS.pan.y - 80);
  o += K.bang('PLOP!', sx + 220, sy - 120, pop(t, tPancake, 0.18), 110, 8, '#FFD21F');
  o += R.counterHUD({ x: 960, y: 830, s: 1, anchor: 'center', t, label: 'RESPAWN:', value: 'DISABLED', theme: 'grey', icon: 'retry', k: seg(t, w(6, 'Respawn...') - 0.1, w(6, 'Respawn...') + 0.2), bump: seg(t, w(6, 'disabled.'), w(6, 'disabled.') + 0.45) });
  return o;
}
// ---- 20. Dad unfreezes mid-joke in the front yard: "—go to the doctor? Wait. Why am I outside?"
function shDad(t) {
  const SR = SH.SPOTS.street;
  const tWait = w(7, 'Wait.'), tWhy = w(7, 'Why');
  const cam = camKeys(t, [[CUT.dad, at(1180, 640, 1.85)], [tWait - 0.1, at(1200, 640, 1.9)], [tWait + 0.2, at(1330, 620, 1.45)], [CUT.tip, at(1350, 620, 1.5)]]);
  const Ls = SH.street.layers(t, cam, { time: 'sunset' });
  let ch = '';
  // Bea on the trampoline: bounces again
  const tr = SR.trampoline;
  const bb = Math.abs(Math.sin((t - CUT.dad) * 4.2));
  ch += actor('bea', t, { x: tr.x, y: tr.y, s: 0.24, lift: 130 * bb, armL: 120 + 40 * bb, armR: 120 + 40 * bb, face: { name: 'excited' } });
  const look = t > tWait;
  const sc = t > tWhy ? Math.sin(t * 9) * 8 : 0;
  ch += actor('dad', t, { x: 1180, y: 840, s: 0.3, spatula: true, turn: look ? 0.6 * Math.sin((t - tWait) * 3) : 0.1, armR: look ? 150 + sc : 130, armL: look ? 30 : 20, face: look ? { name: 'confused', fx: ['question'] } : { name: 'happy' } }, { arms: false });
  let o = Ls.bg + Ls.mid + view(cam, ch, 1) + Ls.fg + Ls.light;
  o += R.blockConfettiRain(t, { t0: tPress + 0.3, n: 30, seed: 12, speed: 0.6 });
  return o + whip(t, CUT.dad, -1);
}
// ---- 21. Tip's goodbye (golden yard): "Last tip. Real life doesn't have checkpoints."
const GOLD = (cam) => ({ time: 'sunset', red: 0, frozen: 0, colorBack: 1 });
function tipFadeK(t) { return 0.12 * seg(t, A[8].a + 0.4, tTipFade0) + 0.88 * ease.inOut(seg(t, tTipFade0, tTipGone)); }
function shTip(t) {
  const u = seg(t, CUT.tip, CUT.tipCU);
  const cam = at(1180, lerp(560, 540, u), lerp(1.5, 1.65, ease.inOut(u)));
  let ch = flagSvg(t, 'saved', { wave: 0.4 });
  ch += hero(t, { turn: 0.35, face: { name: 'sad', eyes: { look: [0.6, -0.5] } } });
  ch += ivy(t, { face: { name: 'sad', eyes: { look: [-0.4, -0.6] } }, armL: 20, armR: 20 });
  let o = yard(t, cam, '', ch, GOLD(cam));
  const [tx, ty] = toScr(cam, 1190, lerp(520, 560, u));
  o += R.tip({ x: tx, y: ty, s: 1.55, t, look: [-0.3, 0.3], mood: 'happy', glitch: 0.08, fade: tipFadeK(t) });
  o += R.blockConfettiRain(t, { t0: tPress + 0.3, n: 20, seed: 15, speed: 0.5 });
  return o + S.rect(0, 0, 1920, 1080, 0, { fill: '#FFB050', opacity: 0.06 });
}
// ---- 22. close-up: "That's what makes it... count." — Tip dissolves into pixels, the hero's face lit yellow
function shTipCU(t) {
  const u = seg(t, CUT.tipCU, CUT.thanks);
  const fade = tipFadeK(t);
  const cam = at(1120 + 40 * u, 520, 2.4 + 0.35 * ease.inOut(u));
  let ch = hero(t, { volume: false, turn: 0.35, face: { name: fade > 0.75 ? 'happy' : 'sad', eyes: { look: [0.7, -0.4] }, mouth: fade > 0.75 ? 'smallSmile' : undefined, fx: fade > 0.6 ? ['tears'] : [] } });
  let o = yard(t, cam, '', ch, GOLD(cam));
  const glow = 1 - seg(fade, 0.7, 1);
  o += S.ellipse(1250, 470, 700, 560, { fill: 'url(#rspGlowY)', opacity: f(0.35 * glow) });
  o += R.tip({ x: 1330, y: 420 - 60 * u, s: 2.4, t, look: [-0.6, 0.2], mood: 'happy', fade, glow: 1.2 });
  return o;
}
// ---- 23. "Thanks, Tip." — the spark drifts up into the sunset; the flag falls into the grass and goes dark
function shThanks(t) {
  const u = seg(t, CUT.thanks, CUT.flag);
  const cam = at(1100, lerp(470, 430, u), 1.7);
  let ch = flagSvg(t, 'saved', { wave: 0.3 });
  ch += hero(t, { turn: 0.25, armR: lerp(14, 60, ease.out(seg(t, A[9].a, A[9].a + 0.5))), headRot: -6, face: { name: 'happy', eyes: { look: [0.4, -1] }, fx: ['tears'] } }, { arms: false });
  ch += ivy(t, { face: { name: 'happy', eyes: { look: [-0.2, -1] } } });
  let o = yard(t, cam, '', ch, GOLD(cam));
  const sy = lerp(330, -40, ease.in(u)), sx = 1240 + 30 * Math.sin(t * 3);
  const r = 26 * (1 - 0.6 * u);
  o += S.ellipse(sx, sy, r * 4, r * 4, { fill: 'url(#rspGlowY)', opacity: 0.9 }) + S.path(R.star4(sx, sy, r, t * 120), { fill: '#FFFFFF', stroke: '#FFD43B', 'stroke-width': 3 });
  return o;
}
function shFlag(t) {
  // the flag tips over into the grass and its glow dies
  const fall = ease.in(seg(t, CUT.flag + 0.05, CUT.flag + 0.4));
  const dead = seg(t, CUT.flag + 0.4, CUT.lives + 0.2);
  const cam = at(FLAG.x + 80, FLAG.y - 160, 2.3);
  let ch = R.checkpoint({ ...FLAG, t, state: dead > 0.5 ? 'dead' : 'saved', part: 'back', pole: false, flag: false, glow: 1 - dead });
  const fl = R.flag({ x: 0, y: 0, s: FLAG.s * 1.2, t, state: dead > 0.6 ? 'dead' : 'saved', wave: 1 - dead });
  ch += S.g(fl, `translate(${f(FLAG.x + 40)} ${f(FLAG.y)}) rotate(${f(84 * fall + 4 * Math.sin(fall * Math.PI) * (1 - fall))})`);
  if (fall >= 1) ch += K.C.dust(FLAG.x + 200, FLAG.y, CUT.flag + 0.4, t);
  let o = yard(t, cam, '', ch, GOLD(cam));
  return o + S.rect(0, 0, 1920, 1080, 0, { fill: '#1A0A2A', opacity: f(0.18 * dead) });
}
// ---- 24. "Lives remaining: one." LIVES ∞ -> 1, then "Just like everybody else." — walking off into the sunset
function shLives(t) {
  const u = seg(t, CUT.lives, CUT.walk);
  const cam = at(1080, 560, lerp(1.6, 1.5, u));
  let ch = R.flag({ x: FLAG.x + 40, y: FLAG.y, s: FLAG.s * 1.2, rot: 84, t, state: 'dead', wave: 0 });
  ch += hero(t, { turn: 0.1, armL: 14, armR: 14, face: { name: 'happy', eyes: { look: [0, 0] } }, bodyY: 6 * bump(t, tOne, tOne + 0.5) });
  ch += ivy(t, { face: 'happy' });
  let o = yard(t, cam, '', ch, GOLD(cam));
  return o + livesHUD(t);
}
function livesHUD(t) {
  const one = t >= tOne - 0.05;
  const k = seg(t, CUT.lives - 0.05, CUT.lives + 0.25);
  return R.counterHUD({ x: 960, y: 150, s: 1.25, anchor: 'center', t, label: 'LIVES:', value: one ? 1 : '∞', theme: one ? 'white' : 'green', icon: 'heart', k, bump: seg(t, tOne, tOne + 0.45) }) +
    (one && t < tOne + 0.4 ? R.flash(0.35 * (1 - seg(t, tOne, tOne + 0.4))) : '');
}
const WALK_KIDS = [[3, 300, 0.42], [8, 2000, 0.4], [12, 2400, 0.44]];
function shWalk(t) {
  const u = seg(t, CUT.walk, END);
  const cam = { x: lerp(60, 140, u), y: lerp(-40, -90, u), zoom: lerp(1.0, 0.86, ease.inOut(u)) };
  const ph = (t - CUT.walk) * 7;
  const hx = HERO.x + 120 * (t - CUT.walk), hy = HERO.y - 70 * (t - CUT.walk);
  const s0 = sAt(hy);
  let ch = R.flag({ x: FLAG.x + 40, y: FLAG.y, s: FLAG.s * 1.2, rot: 84, t, state: 'dead', wave: 0 });
  // ordinary kids walking past (no ghosts, no HUDs — just life)
  for (const [i, x0, s] of WALK_KIDS) {
    const dir = x0 > 1000 ? -1 : 1;
    ch += K.draw.kid(i, { x: x0 + dir * 110 * (t - CUT.walk), y: 760 + 400 * (s - 0.4), s, volume: false, view: 'side', flip: dir > 0, ...AC.walk(t * 7 + i), face: 'happy' });
  }
  ch += actor('ivy', t, { x: hx + 230 * s0 / 0.5, y: hy + 6, s: s0 * 0.98, view: 'back', ...AC.walkFront(ph + 1), turn: 0 });
  ch += actor('you', t, { x: hx, y: hy, s: s0, view: 'back', backpack: true, ...AC.walkFront(ph) });
  let o = yard(t, cam, '', ch, GOLD(cam));
  o += livesHUD(t);
  // hand-over to the evening show: dusk dip in the last moments
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#2A1640', opacity: f(0.85 * ease.in(seg(t, END - 0.35, END))) });
  return o;
}

// ================================================================= dispatch
const SHOTS = [
  [CUT.town, shTown], [CUT.yard, shYard], [CUT.fine, shFine], [CUT.ever, shEver], [CUT.poster, shPoster], [CUT.house, shHouse],
  [CUT.ivy, shIvy], [CUT.look, shLook], [CUT.fails, shFails], [CUT.c56, shMontage], [CUT.face, shFace], [CUT.trying, shTrying],
  [CUT.okay, shOkay], [CUT.press, shPress], [CUT.boom, shBoom], [CUT.townG, shTownG], [CUT.pancake, shPancake], [CUT.dad, shDad],
  [CUT.tip, shTip], [CUT.tipCU, shTipCU], [CUT.thanks, shThanks], [CUT.flag, shFlag], [CUT.lives, shLives], [CUT.walk, shWalk],
].sort((a, b) => a[0] - b[0]);
function shotAt(t) {
  let i = SHOTS.length - 1;
  while (i > 0 && t < SHOTS[i][0]) i--;
  return i;
}
function scene(t) { return SHOTS[shotAt(t)][1](t); }
function look(t) {
  if (t < CUT.boom) return { grade: 'cool', vignette: 0.7 };
  if (t >= CUT.pancake && t < CUT.dad) return { grade: 'warm', vignette: 0.5 };
  return { grade: 'warm', vignette: 0.6 };
}

module.exports = { scene, look, CUT, beats: { tDel, tPress, tPancake, tDoc, tTipFade0, tTipGone, tFlag, tOne, START, END } };
