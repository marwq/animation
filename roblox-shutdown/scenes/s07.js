// SC 07 · СЕРВЕРНАЯ ФЕРМА — the Server Farm in the canyon under a storm of loading wheels; Grandpa's golden key has
// EXPIRED (1998); Modbots get chat-filtered by their own threats; Grandpa's bucket-head robot disguise ("Welcome,
// colleague"); Dex's sneeze → alarm → chase → the 400-button service elevator; Pip's calm combo (B9, up two, hold
// CLOSE 3 s) in slow-mo; doors shut in the Modbots' faces; muzak; "That's my grandson." … "Ding."
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const C = K.C;
const A = require('./acting');
const FM = require('./farm');
const SETS = require('./sets');
const E = require('./s06_env');
const { G, tr, outT, outTF, R, P, Ci, flash } = E;
const { L } = K.V;
const CAST = require('../rig/cast');

const START = K.V.scene('SC 07').start, END = K.V.scene('SC 08').start;
const m = Array.from({ length: 16 }, (_, i) => L('07.' + i));
const W = (i, w, n = 0) => m[i].word(w, n).t0;

// ---------------------------------------------------------------- cut times (from the voice)
const tB = W(0, 'Every') - 0.3, tC = W(0, 'All') - 0.2, tD = m[1].a - 0.2, tE = W(1, 'a') - 0.25, tF = m[2].a - 0.1;
const tG1 = m[3].a - 0.4, tG2 = W(3, 'or') - 0.2, tH = m[4].a - 0.12, tI = m[5].a - 0.15, tI2 = W(5, 'also') - 0.2, tI3 = W(5, 'Nothing') - 0.2;
const tJ = m[6].a - 0.3, tK = m[7].a - 0.15, tL = m[8].a - 0.25, tM1 = m[9].a - 0.15, tM2 = W(9, 'Beep') - 0.3;
const tN1 = m[10].a - 0.2, tN2 = W(10, 'Nobody') - 0.3, tO1 = m[11].a - 0.15, tO2 = W(11, 'Then') - 0.2, tO3 = W(11, 'Then', 1) - 0.2;
const tO4 = W(11, 'close') - 0.1, tO5 = W(11, 'three') - 0.25, tP = m[12].a - 0.06, tQ = m[13].a - 0.25, tR = m[14].a - 0.25, tS = m[15].a - 0.35;
const tExp = W(2, 'Expired'), tAchoo = W(8, 'ACHOO'), tNine = W(11, 'nine'), tTwo = W(11, 'two'), tClose = W(11, 'close'), tSlam = m[12].a;
const tBeeps = [0, 1, 2, 3].map((i) => W(3, 'beep', i));
const tKeyIn = tE + 0.12, tKeyTurn = tE + 0.42, tKeyNo = tE + 0.72;
const tOpen = tG1 + 0.05;

// ---------------------------------------------------------------- helpers
const at = (x, y, zoom, extra = {}) => ({ zoom, x: x - 960, y: y - 540, ...extra });
const Z = { juno: 0.95, dex: 1, pip: 0.72, grandpa: 1.06 };
const handAt = (x, y, s, name, a, side) => { const [hx, hy] = A.hand(a, side); const k = s * (Z[name] || 1); return [x + hx * k, y + hy * k]; };
const mb = (t, x, y, s, o = {}) => K.draw.modbot({ x, y, s, t, face: '!', ...o });
const talkMB = (t) => (K.V.talking('MODBOT', t) ? 1 : 0);
// slow-motion clock for Pip's combo
const SLOW0 = tNine - 0.05;
const slowT = (t) => (t < SLOW0 ? t : t < tSlam ? SLOW0 + (t - SLOW0) * 0.25 : SLOW0 + (tSlam - SLOW0) * 0.25 + (t - tSlam));
// Grandpa with his bucket disguise (explicit headRot so the bucket follows the head)
function grandpa(t, pose = {}, act = {}) {
  const props = [...(pose.props || [])];
  if (pose.bucket) { const p = { headRot: pose.headRot || 0, headY: pose.headY || 0 }; props.push(E.onHead(p, E.bucketHead(t, pose.bucket))); }
  return actor('grandpa', t, { headRot: 0, ...pose, props }, act);
}
// big golden key (insert)
function goldKey(x, y, s, rot) {
  let o = Ci(-150, 0, 70, ol('#FFC93C', 10)) + Ci(-150, 0, 32, ol('#E0A21A', 7)) + R(-90, -22, 260, 44, 10, ol('#FFC93C', 9));
  o += P('M120 22 L120 60 L150 60 L150 40 L170 40 L170 22 Z', ol('#FFC93C', 8)) + P('M-190 -40 Q-160 -66 -120 -58', ln(10, '#FFF4B0'));
  return G(o, tr(x, y, s, rot));
}
// Grandpa's sleeve + hand holding something at (x, y), arm coming from the lower-left
const sleeveHand = (x, y, s = 1) => G(P('M-700 600 L-120 40 L-40 120 L-560 760 Z', ol('#E0A53A', 9)) + R(-150, -40, 170, 130, 56, ol('#EDC1A0', 8)) + P('M-110 0 L-20 0 M-118 40 L-24 40', ln(6, '#D9A683')), tr(x, y, s));
// the spare racks the kids hide behind (outside the door)
const spareRacks = (t, x, base, s) => FM.rack(x, base, s, 560, t, { seed: 3, dim: 0.3 }) + FM.rack(x + 190 * s, base, s, 480, t, { seed: 7, dim: 0.3 }) + R(x - 20 * s, base - 4, 400 * s, 30 * s, 6, ol('#8A6A48', 5));

// ================================================================ SHOTS
// A — reveal: tilt down from the storm of loading wheels to the building. Betsy parked, tiny team.
function team(t, x, s, o = {}) {
  const v = { volume: false, shadow: true };
  return actor('grandpa', t, { x: x + 120 * s / 0.17, y: FM.FARM.floor + 2, s, turn: -0.3, ...v, ...(o.g || {}) }) + actor('pip', t, { x: x + 70 * s / 0.17, y: FM.FARM.floor + 4, s, ...v }) + actor('juno', t, { x, y: FM.FARM.floor + 6, s, ...v }) + actor('dex', t, { x: x - 60 * s / 0.17, y: FM.FARM.floor + 4, s, ...v });
}
function shotA(t) {
  const u = seg(t, START, tB);
  const cam = camKeys(t, [[START, at(960, 280, 1.0)], [START + 0.3, at(960, 285, 1.0)], [tB - 0.2, at(960, 540, 1.0)]]);
  const Lf = FM.farmExterior(t, { cam, storm: 1, lag: 0.35 });
  const world = FM.van(560, FM.FARM.floor + 8, 0.2, t, { mop: true }) + team(t, 690, 0.16);
  return Lf.bg + Lf.mid + view(cam, world, 1) + Lf.fg + Lf.light + flash(t, START, 0.15, 0.6);
}
// B — push into the glowing windows: "Every game. Every avatar. Every obby ever made." (bubbles pop out on the words)
const POPS = [
  [W(0, 'game'), 520, 470, 92, 'island', 'GAMES'], [W(0, 'avatar'), 1400, 430, 92, 'avatar', 'AVATARS'], [W(0, 'obby'), 960, 600, 104, 'obby', 'OBBIES'],
  [W(0, 'ever') + 0.05, 330, 640, 60, 'race'], [W(0, 'ever') + 0.15, 1600, 640, 60, 'space'], [W(0, 'made') + 0.0, 740, 380, 56, 'city'], [W(0, 'made') + 0.12, 1200, 360, 56, 'pet'], [W(0, 'made') + 0.24, 1180, 720, 52, 'castle'],
];
function bubbleArt(t, kind, x, y, r) {
  if (kind !== 'avatar') return FM.gameBubble(x, y, r, t, { kind, glow: 0.7, seed: x });
  let o = Ci(x, y, r * 1.7, { fill: 'url(#farmGlowBlue)', opacity: 0.6 }) + Ci(x, y, r, { fill: '#BFEFFF', opacity: 0.55 });
  o += SETS.avatar(x - r * 0.3, y + r * 0.62, r / 170, t, { who: 'juno', pose: 'wave' }) + SETS.avatar(x + r * 0.35, y + r * 0.62, r / 190, t, { who: 'dex' });
  return o + Ci(x, y, r, { fill: 'url(#farmBubble)', stroke: '#151515', 'stroke-width': 5 }) + P(`M${f(x - r * 0.62)} ${f(y - r * 0.3)} Q${f(x - r * 0.5)} ${f(y - r * 0.7)} ${f(x - r * 0.08)} ${f(y - r * 0.78)}`, ln(8, '#FFFFFF', 0.85));
}
function shotB(t) {
  const u = seg(t, tB, tC);
  const cam = at(960, lerp(560, 520, u), lerp(1.15, 1.55, ease.inOut(u)));
  const Lf = FM.farmExterior(t, { cam, storm: 1, lag: 0.35 });
  let pops = '';
  for (const [t0, x, y, r, kind, label] of POPS) {
    const k = seg(t, t0 - 0.05, t0 + 0.25);
    if (k <= 0) continue;
    const yy = y - 30 * (t - t0) - 20 * ease.outBack(k);
    pops += G(bubbleArt(t, kind, 0, 0, r), tr(x, yy, ease.outBack(k)));
    if (label) pops += G(outT(label, 0, 0, 40, '#FFFFFF', 8), tr(x, yy + r + 50, ease.outBack(seg(t, t0 + 0.05, t0 + 0.3))));
  }
  return Lf.bg + Lf.mid + Lf.fg + view(cam, pops, 1) + Lf.light;
}
// C — low angle: the team from behind, the building towering, the storm above. "All in one building."
function shotC(t) {
  const u = seg(t, tC, tD);
  const cam = at(960, lerp(470, 430, u), lerp(1.3, 1.38, u));
  const Lf = FM.farmExterior(t, { cam, storm: 1, lag: 0.35 });
  const by = 1230 + 10 * (1 - ease.out(u));
  let o = Lf.bg + Lf.mid + Lf.fg + Lf.light;
  o += actor('dex', t, { x: 610, y: by + 30, s: 0.6, view: 'back', headRot: -4 }) + actor('pip', t, { x: 860, y: by + 40, s: 0.62, view: 'back' }) + actor('juno', t, { x: 1110, y: by + 20, s: 0.6, view: 'back' }, { arms: false }) + actor('grandpa', t, { x: 1400, y: by + 40, s: 0.6, view: 'back', props: [{ svg: CAST.mop({ x: 230, y: 0, len: 760 }), layer: 'front' }] });
  return o + E.wash('#1A1050', 0.06);
}
// D — at the door: Grandpa pats the wall, nostalgic: "Thirty years… and she hasn't changed a bit."
const TEAMD = { dex: 520, juno: 760, pip: 960, gp: 1330 };
function doorKids(t, o = {}) {
  return actor('dex', t, { x: TEAMD.dex, y: 1010, s: 0.55, turn: 0.4, ...(o.dex || {}) }, o.dexAct || {}) + actor('juno', t, { x: TEAMD.juno, y: 1005, s: 0.55, turn: 0.4, ...(o.juno || {}) }, o.junoAct || {}) + actor('pip', t, { x: TEAMD.pip, y: 1015, s: 0.6, turn: 0.3, ...(o.pip || {}) }, o.pipAct || {});
}
function shotD(t) {
  const u = seg(t, tD, tE);
  const cam = at(lerp(1180, 1260, u), 580, lerp(1.25, 1.42, ease.inOut(u)));
  const Ld = FM.farmDoor(t, { cam, doorScreen: 'INSERT KEY', screenCol: '#7CFF8A' });
  const pat = Math.max(0, Math.sin(t * 7)) * bump(t, tD + 0.3, tE - 0.4);
  const reach = seg(t, tE - 0.5, tE);
  const gp = grandpa(t, { x: TEAMD.gp, y: 1010, s: 0.58, turn: lerp(-0.2, 0.5, reach), armR: lerp(70 + 20 * pat, 90, reach), armL: 14, keysSwing: 10 * Math.sin(t * 5), face: { name: 'happy', eyes: { type: 'happy' }, fx: ['blush'] } }, { arms: false, energy: 0.7 });
  const kids = doorKids(t, { juno: { face: { name: 'happy' } }, pip: { face: { name: 'amazed', eyes: { type: 'star' } } } });
  return Ld.bg + view(cam, kids + gp + K.sparkles([[1180, 330, 22], [1450, 420, 16], [1240, 560, 14]], t), 1) + Ld.light + flash(t, tD, 0.12, 0.4);
}
// E — insert: the golden key goes in, turns … KEY EXPIRED: 1998 (BZZT)
function shotE(t) {
  const cam = at(1585, 560, 2.5);
  cam.sx = K.shake(t, tKeyNo, 0.4, 12).sx;
  const scr = t < tKeyTurn ? 'INSERT KEY' : t < tKeyNo ? 'CHECKING...' : 'KEY EXPIRED: 1998';
  const col = t < tKeyNo ? '#7CFF8A' : (Math.floor(t * 8) % 2 ? '#FF5A5A' : '#FF2E4D');
  const Ld = FM.farmDoor(t, { cam, doorScreen: scr, screenCol: col });
  const kin = ease.out(seg(t, tE, tKeyIn + 0.12)), turn = ease.inOut(seg(t, tKeyTurn - 0.15, tKeyTurn + 0.05));
  const ks = 0.55, kx = lerp(1250, FM.DOOR.key.x + 40 * ks, kin), ky = FM.DOOR.key.y;
  const cid = S.uid('s07key');
  const key = S.clipDef(cid, R(0, 0, FM.DOOR.key.x, 2000)) + G(goldKey(kx, ky, ks, 0), null, { 'clip-path': `url(#${cid})` });
  let o = Ld.bg + view(cam, G(key + sleeveHand(kx - 150 * ks - 40, ky + 40, 0.5), `rotate(${f(-90 * turn)} ${FM.DOOR.key.x} ${ky})`), 1);
  if (t > tKeyTurn - 0.05 && t < tKeyNo) o += view(cam, K.loadingWheel(1700, 470, 18, t, '#7CFF8A', 8, 5), 1);
  const no = seg(t, tKeyNo, tKeyNo + 0.12);
  if (no > 0) o += E.wash('#FF2E4D', 0.18 * (1 - seg(t, tKeyNo + 0.1, tKeyNo + 0.5))) + K.bang('BZZT!', 520, 780, no, 150, -8, '#FF5A6E');
  return o;
}
// F — Grandpa, offended: smash zoom "Expired?!", then the mop comes out: "I mopped these floors for thirty years!"
function shotF(t) {
  const wide = t > W(2, 'I') - 0.1;
  const cam = wide ? camKeys(t, [[W(2, 'I') - 0.1, at(1060, 600, 1.2)], [tG1, at(1040, 600, 1.16)]]) : at(1300, 560, 2.0);
  const shake = K.shake(t, tExp, 0.45, 14); cam.sx = shake.sx; cam.sy = shake.sy;
  const Ld = FM.farmDoor(t, { cam, doorScreen: 'KEY EXPIRED: 1998', screenCol: Math.floor(t * 4) % 2 ? '#FF5A5A' : '#FF2E4D' });
  const shakeFist = Math.sin(t * 18) * bump(t, tExp, tExp + 0.8);
  const mop = seg(t, W(2, 'mopped') - 0.2, W(2, 'mopped') + 0.1);
  const wave = Math.sin(t * 6) * 10 * mop;
  const gp = grandpa(t, { x: TEAMD.gp, y: 1010, s: 0.58, turn: lerp(-0.1, -0.25, mop), armR: lerp(110 + 20 * shakeFist, 165 + wave, mop), armL: 30 + 10 * shakeFist, keysSwing: 30 * shakeFist, headRot: 4 * shakeFist, face: { name: 'angry', fx: ['steam', 'anger'] }, props: mop > 0 ? [{ svg: CAST.mop({ x: A.hand(165 + wave, 1)[0], y: A.hand(165 + wave, 1)[1] + 200, rot: 160 + wave * 0.5, len: 700 }), layer: 'front' }] : [] }, { arms: false, energy: 1.6 });
  const look = seg(t, W(2, 'floors'), W(2, 'floors') + 0.3);
  const kids = doorKids(t, { dex: { turn: lerp(0.4, 0.8, look), face: { name: 'nervous' } }, juno: { turn: lerp(0.4, -0.4, look), face: { name: 'nervous', eyes: { look: [-0.8, 0] } } }, pip: { face: { name: 'happy' } } });
  return Ld.bg + view(cam, (wide ? kids : '') + gp, 1) + Ld.light + flash(t, tExp, 0.08, 0.5);
}
// G1 — the door slides up, red light: two Modbots roll out. "Intruders detected! Leave now,"
function modbotsOut(t) {
  const k = ease.out(seg(t, tOpen + 0.25, tOpen + 1.2));
  return { a: { x: lerp(860, 700, k), y: lerp(945, 1020, k), s: lerp(0.4, 0.5, k) }, b: { x: lerp(1060, 1180, k), y: lerp(945, 1030, k), s: lerp(0.4, 0.52, k) }, k };
}
function shotG1(t) {
  const cam = camKeys(t, [[tG1, at(960, 560, 1.0)], [tG2, at(980, 600, 1.12)]]);
  const sh = K.shake(t, tOpen, 0.6, 10); cam.sx = sh.sx; cam.sy = sh.sy;
  const open = ease.inOut(seg(t, tOpen, tOpen + 0.6));
  const Ld = FM.farmDoor(t, { cam, doorScreen: 'KEY EXPIRED: 1998', open, alarm: open, screenCol: '#FF5A5A' });
  const M = modbotsOut(t);
  const back = ease.out(seg(t, tOpen, tOpen + 0.5));
  let w = mb(t, M.a.x, M.a.y, M.a.s, { alarm: open, roll: M.a.x * 2, talk: 0 }) + mb(t, M.b.x, M.b.y, M.b.s, { alarm: open, roll: -M.b.x * 2, talk: talkMB(t) });
  const kids = actor('dex', t, { x: 330 - 40 * back, y: 1060, s: 0.58, turn: 0.5, lean: -8 * back, armL: 60, armR: 60, face: { name: 'scared' } }, { arms: false }) +
    actor('juno', t, { x: 520 - 30 * back, y: 1065, s: 0.58, turn: 0.4, armL: 70 * back, face: { name: 'shocked' } }, { arms: false }) +
    actor('pip', t, { x: 1450, y: 1070, s: 0.6, turn: -0.5, face: { name: 'amazed' } }) +
    grandpa(t, { x: 1660 + 30 * back, y: 1060, s: 0.58, turn: -0.5, armL: 30, face: { name: 'shocked' } });
  return Ld.bg + view(cam, w + kids, 1) + E.wash('#FF2E4D', open * (0.08 + 0.05 * Math.sin(t * 11)));
}
// G2 — Modbot close-up: "…or you will be… beep beep beep beep!" — its own face gets filtered (#), chat bubble ####
function shotG2(t) {
  const cam = camKeys(t, [[tG2, at(1180, 720, 2.0)], [W(3, 'beep'), at(1180, 720, 2.05)], [W(3, 'beep') + 0.06, at(1185, 700, 2.4)], [tH, at(1185, 700, 2.5)]]);
  const nb = tBeeps.filter((x) => t >= x).length;
  cam.sx = (nb ? (hash(Math.floor(t * 20)) - 0.5) * 8 : 0);
  const Ld = FM.farmDoor(t, { cam, open: 1, alarm: 1, doorScreen: 'KEY EXPIRED: 1998', screenCol: '#FF5A5A' });
  const M = modbotsOut(t);
  const face = nb > 0 ? '#' : '!';
  let w = mb(t, M.b.x, M.b.y, M.b.s, { alarm: 1, talk: talkMB(t), face, lean: nb > 0 ? Math.sin(t * 30) * 3 : 0 });
  if (nb > 0) w += E.chatBubble(Array(nb).fill('####').join(' '), M.b.x + 60, M.b.y - 900 * M.b.s, 1, 0.42);
  return Ld.bg + view(cam, w, 1) + E.wash('#FF2E4D', 0.1 + 0.05 * Math.sin(t * 11));
}
// H — Dex, freaked out: "Did that robot just get chat-filtered?!"
function shotH(t) {
  const cam = camKeys(t, [[tH, at(380, 600, 1.7)], [tI, at(390, 600, 1.78)]]);
  const Ld = FM.farmDoor(t, { cam, open: 1, alarm: 1, doorScreen: 'KEY EXPIRED: 1998', screenCol: '#FF5A5A' });
  const pt = seg(t, W(4, 'robot') - 0.2, W(4, 'robot'));
  const w = actor('juno', t, { x: 560, y: 1065, s: 0.58, turn: 0.5, face: { name: 'shocked', eyes: { look: [0.8, 0] } } }) + actor('dex', t, { x: 330, y: 1060, s: 0.58, turn: 0.35, armR: lerp(30, 95, pt), armL: 40, headRot: 6 * Math.sin(t * 14) * pt, face: { name: 'scared', fx: ['sweat'] } }, { arms: false });
  return Ld.bg + view(cam, w, 1) + E.wash('#FF2E4D', 0.08 + 0.04 * Math.sin(t * 11));
}
// I1 — enter Grandpa: bucket on his head ("!" sticker), riding the mop cart. "Beep. Boop. I am…"
function cartRider(t, x, y, s, o = {}) {
  const rob = Math.floor(t * 2.5) % 2;
  return E.mopCart(x, y, s, t, { roll: x * 1.2, bucket: true, mop: false }) + grandpa(t, { x: x - 150 * s, y: y - 70 * s, s: s * 0.86, view: 'side', flip: true, armL: rob ? 80 : 20, armR: rob ? 20 : 80, bucket: o.bucket ?? 1, headRot: o.headRot || 0, face: { name: 'happy' }, ...(o.pose || {}) }, { arms: false });
}
function shotI1(t) {
  const cam = at(1040, 620, 1.12);
  const Ld = FM.farmDoor(t, { cam, open: 1, alarm: 0.5, doorScreen: 'KEY EXPIRED: 1998', screenCol: '#FF5A5A' });
  const cx = lerp(-200, 700, ease.out(seg(t, tI - 0.05, tI + 1.1)));
  let w = actor('pip', t, { x: 330, y: 880, s: 0.5, turn: 0.5, face: { name: 'excited' } }) + spareRacks(t, 200, 1060, 0.55);
  w += mb(t, 1180, 1030, 0.52, { face: '?', alarm: 0.3 }) + mb(t, 1480, 1040, 0.52, { face: '?', alarm: 0.3 });
  w += cartRider(t, cx, 1060, 0.62);
  return Ld.bg + view(cam, w, 1) + E.wash('#FF2E4D', 0.05);
}
// I2 — the kids behind the spare racks: Juno facepalms, Dex can't watch, Pip is thrilled. "…also a robot."
function shotI2(t) {
  const cam = at(400, 600, 1.7);
  const Ld = FM.farmDoor(t, { cam, open: 1, alarm: 0.4, doorScreen: 'KEY EXPIRED: 1998', screenCol: '#FF5A5A' });
  const pk = ease.outBack(seg(t, tI2 - 0.05, tI2 + 0.25));
  let w = actor('juno', t, { x: 230, y: 980 - 50 * pk, s: 0.55, turn: 0.45, armR: 12, armL: 12, headRot: -6, face: { name: 'deadpan', eyes: { upper: 0.62 } } }, { arms: false });
  w += actor('dex', t, { x: 560, y: 990 - 40 * pk, s: 0.55, turn: 0.3, armL: 20, armR: 20, headRot: 6 * Math.sin(t * 20), face: { name: 'scared', fx: ['sweat', 'sweat2'] } }, { arms: false });
  w += actor('pip', t, { x: 400, y: 900 - 60 * pk, s: 0.5, turn: 0.5, armR: 150 + 10 * Math.sin(t * 12), armL: 14, face: { name: 'excited' } }, { arms: false });
  for (let i = 0; i < 4; i++) w += FM.rack(40 + i * 170, 1120, 0.9, 520 - (i % 2) * 40, t, { seed: i * 5 + 2, dim: 0.35 });
  return Ld.bg + view(cam, w, 1) + E.wash('#FF2E4D', 0.05);
}
// I3 — close: Grandpa does the robot; a Modbot leans in and scans him. "Nothing to see here."
function shotI3(t) {
  const u = seg(t, tI3, tJ);
  const cam = at(lerp(990, 1010, u), 640, lerp(1.6, 1.7, u));
  const Ld = FM.farmDoor(t, { cam, open: 1, alarm: 0.3, doorScreen: 'KEY EXPIRED: 1998', screenCol: '#FF5A5A' });
  const step = Math.floor(t * 3) % 2;
  let w = E.mopCart(760, 1060, 0.62, t, { mop: false });
  w += grandpa(t, { x: 820, y: 1030, s: 0.54, turn: 0.5, armL: step ? 90 : 10, armR: step ? 10 : 90, bucket: 1, headRot: step ? 5 : -5, face: { name: 'happy' } }, { arms: false });
  const scan = (t * 1.4) % 1;
  w += P(`M1060 650 L${f(760)} ${f(560 + scan * 420)} L${f(980)} ${f(560 + scan * 420)} Z`, { fill: '#7CF7FF', opacity: 0.25 }) + P(`M760 ${f(560 + scan * 420)} L980 ${f(560 + scan * 420)}`, ln(5, '#7CF7FF', 0.8));
  w += mb(t, 1180, 1030, 0.55, { face: '?', lean: -14, alarm: 0.2, talk: 0 });
  return Ld.bg + view(cam, w, 1);
}
// J — "…Welcome, colleague." The Modbot's '?' turns into a check mark; Grandpa salutes
function shotJ(t) {
  const u = seg(t, tJ, tK);
  const cam = at(1040, 620, lerp(1.3, 1.24, u));
  const Ld = FM.farmDoor(t, { cam, open: 1, alarm: 0, green: 0, doorScreen: 'WELCOME', screenCol: '#7CFF8A' });
  const ok = t > W(6, 'Welcome') + 0.15;
  const bow = bump(t, W(6, 'colleague') - 0.1, W(6, 'colleague') + 0.6);
  let w = E.mopCart(760, 1060, 0.62, t, { mop: false });
  const sal = seg(t, W(6, 'colleague'), W(6, 'colleague') + 0.2);
  w += grandpa(t, { x: 820, y: 1030, s: 0.54, turn: 0.4, armL: lerp(14, 160, sal) + 8 * Math.sin(t * 14) * sal, armR: 10, bucket: 1, face: { name: 'happy' } }, { arms: false });
  w += mb(t, 1180, 1030, 0.55, { face: ok ? 'ok' : '?', lean: 18 * bow, talk: talkMB(t) }) + mb(t, 1480, 1040, 0.52, { face: ok ? 'ok' : '?', lean: 14 * bow });
  if (ok) w += K.F.sparkle(1180, 600, 26 * bump(t, W(6, 'Welcome') + 0.15, W(6, 'Welcome') + 0.7));
  return Ld.bg + view(cam, w, 1);
}
// K — inside the rack hall: the Modbot escort rolls ahead, Grandpa pushes his cart, the kids tiptoe in its shadow
const KX0 = 700, KV = 120;
function sneakX(t) { return KX0 + (t - tK) * KV; }
function sneakWorld(t, o = {}) {
  const gx = o.gx ?? sneakX(t);
  const ph = t * 7;
  let w = '';
  const tip = (ph2) => ({ ...A.walk(ph2, 0.7), bodyY: 40 + 6 * Math.abs(Math.sin(ph2)), lean: 12 });
  w += actor('pip', t, { x: gx - 380, y: 905, s: 0.42, view: 'side', flip: true, ...tip(ph + 1.4), face: { name: 'happy' } }, { arms: false });
  const dx = actor('dex', t, { x: gx - 260, y: 905, s: 0.48, view: 'side', flip: true, ...tip(ph + 0.7), ...(o.dex || {}) }, { arms: false, ...(o.dexAct || {}) });
  const jn = actor('juno', t, { x: gx - 120, y: 905, s: 0.48, view: 'side', flip: true, ...tip(ph), ...(o.juno || {}) }, { arms: false });
  w += o.dexFront ? jn + dx : dx + jn;
  w += cartRider(t, gx + 160, 905, 0.6, { bucket: o.bucket ?? 1, pose: o.gp || {} });
  if (o.mb !== false) w += mb(t, gx + 560, 900, 0.5, { face: o.mbFace || 'ok', roll: gx * 2, alarm: o.alarm || 0, flip: o.mbFlip ?? false, talk: talkMB(t) });
  return w;
}
function shotK(t) {
  const gx = sneakX(t);
  const cam = at(gx + 40, 560, 1.12);
  const Lh = FM.rackHall(t, cam, {});
  const whisper = K.V.talking('DEX', t);
  return Lh.bg + Lh.mid + view(cam, sneakWorld(t, { dex: { headRot: whisper ? -6 : 0, face: { name: 'shocked' } }, juno: { face: { name: 'nervous' } } }), 1) + Lh.fg + Lh.light;
}
// L — Dex's sneeze: server dust drifts onto his nose. "Ah… ah… ACHOO!"
function shotL(t) {
  const gx = sneakX(t);
  const dexX = gx - 260;
  const ach = t >= tAchoo;
  const cam = ach ? at(dexX + 60, 640, 1.65) : at(dexX + 30, 600, lerp(2.2, 2.45, seg(t, tL, tAchoo)));
  const sh = K.shake(t, tAchoo, 0.6, 22); cam.sx = sh.sx; cam.sy = sh.sy;
  const Lh = FM.rackHall(t, cam, {});
  const wind = clamp(seg(t, W(8, 'Ah'), W(8, 'ACHOO')), 0, 1);
  const snap = bump(t, tAchoo - 0.02, tAchoo + 0.4);
  const dexPose = { headRot: -22 * wind * (ach ? 0 : 1) + 18 * snap, lean: -8 * wind * (ach ? 0 : 1) + 16 * snap, face: ach ? { name: 'scream', eyes: { type: 'closed' } } : { name: 'scared', mouth: 'O', eyes: { type: wind > 0.5 ? 'closed' : undefined, upper: 0.4 } } };
  let w = sneakWorld(t, { dex: dexPose, dexAct: { energy: 0 }, mb: false, dexFront: true });
  // a dust bunny drifts down from the rack onto his nose
  const du = ease.inOut(seg(t, tL, W(8, 'Ah') + 0.25));
  if (!ach) w += G(Ci(0, 0, 26, { fill: '#C9CED8', opacity: 0.85, stroke: '#8A93A6', 'stroke-width': 3 }) + Ci(-16, 8, 14, { fill: '#C9CED8', opacity: 0.8 }) + Ci(16, 10, 12, { fill: '#C9CED8', opacity: 0.8 }), tr(lerp(dexX + 160, dexX + 70, du) + 16 * Math.sin(t * 4) * (1 - du), lerp(300, 560, du), 0.7));
  let o = Lh.bg + Lh.mid + view(cam, w, 1) + Lh.fg + Lh.light;
  if (ach) {
    const k = seg(t, tAchoo, tAchoo + 0.8);
    let cloud = '';
    for (let i = 0; i < 14; i++) { const a = -0.9 + hash(i) * 1.8; cloud += Ci(dexX + 80 + Math.cos(a) * 620 * k, 560 + Math.sin(a) * 260 * k, 40 + 60 * k * hash(i * 3), { fill: '#E9EDF3', opacity: f(0.8 * (1 - k)), stroke: '#8A93A6', 'stroke-width': 4 }); }
    o += view(cam, cloud, 1) + K.bang('ACHOO!', 820, 300, seg(t, tAchoo, tAchoo + 0.12), 170, -8, '#FFFFFF') + C.whiteFlash(0.6 * (1 - seg(t, tAchoo, tAchoo + 0.15)));
  }
  return o;
}
// M1 — alarm: the Modbot whirls round ('!'), red light, Grandpa's bucket flies off. "Intruders! Intruders!"
function shotM1(t) {
  const gx = sneakX(tM1);
  const cam = at(gx + 160, 560, 1.0);
  cam.sx = K.shake(t, tM1, 0.4, 10).sx;
  const al = seg(t, tM1, tM1 + 0.25);
  const Lh = FM.rackHall(t, cam, { alarm: al });
  const spin = seg(t, tM1, tM1 + 0.3);
  const scared = { face: { name: 'scream' }, armL: 150, armR: 150 };
  const bk = seg(t, tM1 + 0.1, tM1 + 0.9);
  let w = sneakWorld(t, { gx, juno: { ...scared, lift: 30 * bump(t, tM1, tM1 + 0.4) }, dex: { ...scared, lift: 40 * bump(t, tM1 + 0.05, tM1 + 0.45) }, bucket: 0, mbFace: '!', mbFlip: spin > 0.5, alarm: al, gp: { face: { name: 'oof' } } });
  w += mb(t, gx + 1000 - 300 * seg(t, tM1 + 0.3, tM2), 900, 0.5, { alarm: 1, roll: -t * 300 });
  // the bucket pops off Grandpa's head
  if (bk < 1) w += G(E.bucketHead(t, 1), `translate(${f(gx + 160 - 150 * 0.6 + 200 * bk)} ${f(905 - 70 * 0.6 - 600 * bk + 900 * bk * bk)}) scale(${f(0.6 * 0.86)}) rotate(${f(540 * bk)} 0 -850)`);
  return Lh.bg + Lh.mid + view(cam, w, 1) + Lh.fg + E.wash('#FF2E4D', al * (0.16 + 0.06 * Math.sin(t * 11))) + flash(t, tM1, 0.1, 0.5);
}
// M2 — the chase: side tracking, everyone running right; Grandpa rides the cart with Pip in the bucket; Modbots behind
function shotM2(t) {
  const v = 980;
  const gx = 3000 + (t - tM2) * v;
  const cam = at(gx - 120, 560, 1.0);
  cam.sy = Math.sin(t * 22) * 4;
  const Lh = FM.rackHall(t, cam, { alarm: 1 });
  const ph = t * 16;
  let w = '';
  for (let i = 0; i < 3; i++) w += mb(t, gx - 900 - i * 260 + Math.sin(t * 3 + i) * 30, 900 + i * 6, 0.48 - i * 0.03, { alarm: 1, flip: false, roll: gx * 3, face: '!', lean: 8 });
  w += C.speedLines(gx - 1100, gx - 500, 640, 8, Math.floor(t * 10), '#FFFFFF', 400);
  w += E.mopCart(gx + 420, 905, 0.6, t, { roll: gx * 1.4, bucket: true, mop: false });
  w += actor('pip', t, { x: gx + 420 + 20, y: 905 - 150, s: 0.32, armL: 150, armR: 150, face: { name: 'excited' } }, { arms: false });
  w += grandpa(t, { x: gx + 420 - 150 * 0.6, y: 905 - 70 * 0.6, s: 0.52, view: 'side', flip: true, armL: 60, armR: 50, lean: 10, face: { name: 'determined' } }, { arms: false });
  w += actor('juno', t, { x: gx + 120, y: 905, s: 0.48, view: 'side', flip: true, ...A.run(ph), lean: 14, face: { name: 'scared' } }, { arms: false });
  w += actor('dex', t, { x: gx - 120, y: 905, s: 0.5, view: 'side', flip: true, ...A.run(ph + 1.3, 1.2), lean: 16, face: { name: 'scream' } }, { arms: false });
  return Lh.bg + Lh.mid + view(cam, w, 1) + Lh.fg + E.wash('#FF2E4D', 0.16 + 0.06 * Math.sin(t * 11));
}
// N1 — the service corridor dead end: they skid in. "A service elevator with four hundred buttons!" (smash zoom on the panel)
const LIFTX = { juno: 830, dex: 1030, gp: 560, pip: 1180 };
function liftKids(t, o = {}) {
  const sk = ease.out(seg(t, tN1, tN1 + 0.6));
  const s = 0.5;
  let w = E.mopCart(LIFTX.gp - 260 * (1 - sk), 1040, 0.58, t, { mop: false });
  w += grandpa(t, { x: LIFTX.gp - 260 * (1 - sk) - 87, y: 1000, s: 0.5, turn: 0.2, face: { name: 'shocked' }, ...(o.gp || {}) });
  w += actor('dex', t, { x: LIFTX.dex - 300 * (1 - sk), y: 1030, s, turn: 0.2, face: { name: 'scared', fx: ['sweat'] }, armL: 40, armR: 40, ...(o.dex || {}) }, { arms: false });
  w += actor('juno', t, { x: LIFTX.juno - 380 * (1 - sk), y: 1020, s, turn: 0.4, ...(o.juno || {}) }, o.junoAct || {});
  if (o.pip !== false) w += actor('pip', t, { x: LIFTX.pip - 420 * (1 - sk), y: 1040, s: 0.52, turn: 0, face: { name: 'neutral' }, ...(o.pip || {}) }, o.pipAct || {});
  return w;
}
function shotN1(t) {
  const zoomIn = t > W(10, 'four') - 0.05;
  const cam = zoomIn ? camKeys(t, [[W(10, 'four') - 0.05, at(1520, 560, 1.4)], [W(10, 'four') + 0.05, at(1520, 560, 1.95)], [tN2, at(1520, 560, 2.05)]]) : camKeys(t, [[tN1, at(820, 600, 1.0)], [W(10, 'four'), at(900, 600, 1.06)]]);
  const Ls = FM.serviceElevator(t, { cam, alarm: 0.6, floor: '1' });
  const pt = seg(t, W(10, 'elevator') - 0.2, W(10, 'elevator'));
  let o = Ls.bg + Ls.mid + view(cam, liftKids(t, { juno: { turn: lerp(0.4, -0.5, pt), armR: lerp(20, 90, pt), face: { name: 'scared' } }, junoAct: { arms: false } }), 1) + Ls.fg;
  o += E.wash('#FF2E4D', 0.1 + 0.05 * Math.sin(t * 11));
  if (zoomIn) o += K.bang('400?!', 1600, 300, seg(t, W(10, 'buttons'), W(10, 'buttons') + 0.15), 140, 8, '#FFE14D') + flash(t, W(10, 'four') - 0.05, 0.1, 0.5);
  return o;
}
// N2 — cornered: Modbots roll in from the foreground. "Nobody knows which one—" … Pip calmly steps out
function shotN2(t) {
  const cam = camKeys(t, [[tN2, at(960, 600, 1.0)], [tO1, at(1000, 600, 1.05)]]);
  const Ls = FM.serviceElevator(t, { cam, alarm: 0.7, floor: '1' });
  const app = ease.out(seg(t, tN2, tO1 + 0.3));
  const step = ease.inOut(seg(t, m[10].b - 0.3, tO1));
  const bots = mb(t, lerp(-200, 220, app), lerp(1500, 1380, app), 1.05, { alarm: 1, roll: app * 600 }) + mb(t, lerp(2150, 1720, app), lerp(1520, 1400, app), 1.0, { alarm: 1, roll: -app * 600 });
  const kids = liftKids(t, { juno: { turn: 0, armL: 60 + 30 * Math.sin(t * 9), armR: 60 - 30 * Math.sin(t * 9), face: { name: 'scared', fx: ['sweat2'] } }, junoAct: { arms: false }, dex: { x: LIFTX.dex - 40, armL: 160, armR: 160, face: { name: 'scream' } }, pip: { x: lerp(LIFTX.pip, 1330, step), turn: lerp(0, 0.6, step), face: { name: 'smug' } } });
  return Ls.bg + Ls.mid + view(cam, kids + bots, 1) + Ls.fg + E.wash('#FF2E4D', 0.1 + 0.05 * Math.sin(t * 11));
}
// O1 — slow-mo begins. Pip at the panel, cool as a cucumber: "Basement nine." (B9 lights up)
const PIPX = 1415;
function pressed(t) {
  const p = [];
  if (t >= tNine) p.push(FM.LIFT.B9);
  if (t >= tTwo) p.push(FM.LIFT.B9 - 40);
  if (t >= tClose && t < tSlam + 0.3) p.push(400);
  return p;
}
function callout(t, i, t0, label) {
  const k = seg(t, t0, t0 + 0.2);
  if (k <= 0) return '';
  const b = FM.liftButton(i);
  const pulse = 1 + 0.25 * Math.abs(Math.sin((t - t0) * 6));
  return Ci(b.x, b.y, 24 * pulse * ease.outBack(k), { fill: 'none', stroke: '#FFE14D', 'stroke-width': 6 }) + G(R(-46, -26, 92, 46, 12, ol('#FFE14D', 4)) + TF(label, 0, 10, 26, '#151515'), tr(b.x + 70, b.y - 46, ease.outBack(k)));
}
function slowFx(t) {
  const k = clamp(seg(t, SLOW0, SLOW0 + 0.3), 0, 1) * (1 - seg(t, tSlam, tSlam + 0.1));
  if (k <= 0) return '';
  return E.wash('#1A3A8A', 0.12 * k) + G(R(-8, -8, 1936, 1096, 0, { fill: 'none', stroke: '#7CF7FF', 'stroke-width': 10 }), '', { opacity: f(0.35 * k) });
}
function shotO1(t) {
  const st = slowT(t);
  const cam = camKeys(t, [[tO1, at(1420, 680, 1.55)], [tO2, at(1460, 690, 1.75)]]);
  const Ls = FM.serviceElevator(st, { cam, alarm: 0.5, floor: t >= tNine ? 'B9' : '1', pressed: pressed(t) });
  const reach = ease.inOut(seg(t, tNine - 0.4, tNine));
  const pip = actor('pip', t, { x: PIPX, y: 1000, s: 0.55, turn: 0.55, armR: lerp(20, 136, reach), armL: 12, face: { name: 'smug', eyes: { upper: 0.35 } } }, { arms: false, energy: 0.4 });
  return Ls.bg + Ls.mid + view(cam, pip + callout(t, FM.LIFT.B9, tNine, 'B9'), 1) + Ls.fg + slowFx(t) + flash(t, tNine, 0.08, 0.35);
}
// O2 — panel macro: the finger slides up two rows: "Then up two." (second button lights)
function finger(x, y, s = 1, rot = 0) {
  return G(P('M60 120 L260 330 L330 260 L130 50 Z', ol('#5CC24A', 8)) + R(-30, -10, 120, 90, 40, ol('#F8D4B4', 7)) + R(-26, -64, 40, 90, 20, ol('#F8D4B4', 6)) + P('M-16 -56 Q-6 -62 4 -56', ln(4, '#EBBC98')), tr(x, y, s, rot));
}
function shotO2(t) {
  const cam = at(1555, 700, 3.0);
  const Ls = FM.serviceElevator(slowT(t), { cam, floor: 'B9', pressed: pressed(t) });
  const b1 = FM.liftButton(FM.LIFT.B9), b2 = FM.liftButton(FM.LIFT.B9 - 40);
  const mv = ease.inOut(seg(t, W(11, 'up') - 0.2, tTwo - 0.05));
  const push = bump(t, tTwo - 0.06, tTwo + 0.2);
  let w = finger(lerp(b1.x, b2.x, mv) + 4, lerp(b1.y, b2.y, mv) + 12 + 6 * push, 0.32);
  w += callout(t, FM.LIFT.B9, tO2 - 0.3, 'B9') + callout(t, FM.LIFT.B9 - 40, tTwo, 'B7');
  const ar = seg(t, W(11, 'up') - 0.2, W(11, 'up') + 0.2);
  if (ar > 0 && t < tTwo + 0.3) w += G(P('M0 0 L0 -40 M-12 -28 L0 -42 L12 -28', ln(5, '#FFE14D')) + P('M18 0 L18 -40 M6 -28 L18 -42 L30 -28', ln(5, '#FFE14D')), tr(b1.x - 46, b1.y - 6, ar), { opacity: f(ar) });
  return Ls.bg + Ls.mid + view(cam, w, 1) + Ls.fg + slowFx(t);
}
// O3 — wide, slow-mo: the doors open, everyone piles in; the Modbots crawl closer. Pip walks in last, calmly.
function insideCar(t, o = {}) {
  const s = 0.42;
  let w = E.mopCart(800, 930, 0.48, t, { mop: false });
  w += grandpa(t, { x: 770, y: 905, s, turn: 0.3, face: { name: o.gpFace || 'shocked' } });
  w += actor('dex', t, { x: 1150, y: 915, s, turn: -0.3, armL: 150, armR: 150, lift: o.dexLift || 0, face: { name: 'scream' } }, { arms: false });
  w += actor('juno', t, { x: 980, y: 920, s, turn: 0, face: { name: o.junoFace || 'scared' } });
  return w;
}
function shotO3(t) {
  const st = slowT(t);
  const cam = camKeys(t, [[tO3, at(960, 620, 1.0)], [tO4, at(960, 640, 1.06)]]);
  const doors = ease.inOut(seg(t, tO3 - 0.1, tO3 + 0.35));
  const Ls = FM.serviceElevator(st, { cam, doors, alarm: 0.6, floor: 'B7', pressed: pressed(t) });
  const app = 0.3 + 0.12 * seg(t, tO3, tO4);
  const bots = mb(st, lerp(-200, 220, app), lerp(1500, 1380, app), 1.05, { alarm: 1, roll: app * 600 }) + mb(st, lerp(2150, 1720, app), lerp(1520, 1400, app), 1.0, { alarm: 1, roll: -app * 600 });
  const leap = seg(t, tO3, tO4);
  const pip = actor('pip', t, { x: lerp(PIPX, 1270, seg(t, tO3 + 0.2, tO4)), y: 1000, s: 0.52, view: 'side', ...A.walk(t * 4, 0.6), face: { name: 'smug' } }, { arms: false });
  return Ls.bg + view(cam, insideCar(t, { dexLift: 60 * bump(leap, 0, 0.6) }), 1) + Ls.mid + view(cam, pip + bots, 1) + Ls.fg + slowFx(t);
}
// O4 — insert: Pip's finger holds CLOSE DOOR; a ring counts the three seconds (slow-mo)
function shotO4(t) {
  const u = seg(t, tO4, tO5);
  let o = R(0, 0, 1920, 1080, 0, { fill: '#8E9AB0' }) + R(0, 0, 1920, 1080, 0, { fill: 'url(#farmSteel)' });
  o += G(R(0, 0, 1400, 300, 0, { fill: 'url(#farmBtn)' }), 'translate(260 -60) scale(2.2)');
  const bx = 960, by = 540, pr = bump(t, tClose - 0.05, tClose + 0.1) * 0.06;
  o += Ci(bx, by, 330, { fill: 'url(#farmGlowWarm)', opacity: f(t >= tClose ? 0.9 : 0) }) + Ci(bx, by, 190, ol(t >= tClose ? '#FFE14D' : '#E9EDF3', 14)) + G(P('M-70 -50 L-10 0 L-70 50 Z M70 -50 L10 0 L70 50 Z', { fill: '#3A3F55' }), tr(bx, by, 1.6 * (1 - pr)));
  o += outTF('CLOSE DOOR', bx - 330, by + 290, 56, '#FFFFFF', 10);
  const k = clamp((t - tClose) / (tSlam - tClose), 0, 1);
  if (t >= tClose) {
    o += E.holdRing(bx, by, 250, k, '#FFE14D');
    const n = k < 0.34 ? '1…' : k < 0.67 ? '2…' : '3…';
    o += outT(n, 1460, 420, 160, '#FFE14D', 14);
  }
  o += finger(bx + 60, by + 30 + (t >= tClose ? 14 : 0) - 40 * (1 - seg(t, tO4, tClose)), 1.4, -35);
  return G(o, `translate(960 540) scale(${f(lerp(1, 1.06, u))}) translate(-960 -540)`) + slowFx(t);
}
// O5 — the doors slide shut in slow-mo; the Modbots are inches away
function shotO5(t) {
  const st = slowT(t);
  const cam = camKeys(t, [[tO5, at(960, 640, 1.1)], [tP, at(960, 620, 1.2)]]);
  const doors = 1 - seg(t, tO5 - 0.1, tSlam) * 0.92;
  const Ls = FM.serviceElevator(st, { cam, doors, alarm: 0.6, floor: 'B7', pressed: pressed(t) });
  const app = lerp(0.55, 0.95, seg(t, tO5, tP));
  const bots = mb(st, lerp(-200, 760, app), lerp(1500, 1130, app), lerp(1.05, 0.7, app), { alarm: 1, roll: app * 600, lean: 10 }) + mb(st, lerp(2150, 1180, app), lerp(1520, 1140, app), lerp(1.0, 0.68, app), { alarm: 1, roll: -app * 600, lean: 10 });
  const pip = actor('pip', t, { x: 1120, y: 925, s: 0.44, turn: 0.6, armR: 90, armL: 10, face: { name: 'smug' } }, { arms: false });
  let o = Ls.bg + view(cam, insideCar(t) + pip, 1) + Ls.mid + view(cam, bots, 1) + Ls.fg + slowFx(t);
  o += E.holdRing(1780, 160, 70, clamp((t - tClose) / (tSlam - tClose), 0, 1), '#FFE14D') + outT('3…', 1780, 190, 70, '#FFE14D', 8);
  return o;
}
// P — SLAM. The doors shut in the Modbots' faces (bonk!). "Ding!"
function shotP(t) {
  const cam = at(960, 600, 1.15);
  const sh = K.shake(t, tSlam, 0.5, 20); cam.sx = sh.sx; cam.sy = sh.sy;
  const Ls = FM.serviceElevator(t, { cam, doors: 0, alarm: 0.6, floor: 'B7' });
  const bonk = ease.out(seg(t, tSlam, tSlam + 0.3));
  const bots = mb(t, 760 - 120 * bonk, 1130 + 40 * bonk, 0.7, { alarm: 1, face: bonk > 0.2 ? '?' : '!', lean: -25 * bump(t, tSlam, tSlam + 0.5) }) + mb(t, 1180 + 120 * bonk, 1140 + 40 * bonk, 0.68, { alarm: 1, face: bonk > 0.2 ? '#' : '!', lean: -25 * bump(t, tSlam, tSlam + 0.5) });
  let o = Ls.bg + Ls.mid + view(cam, bots + K.F.sparkle(820, 760, 30 * bump(t, tSlam, tSlam + 0.6)) + K.F.sparkle(1120, 760, 26 * bump(t, tSlam + 0.05, tSlam + 0.6)), 1) + Ls.fg;
  o += view(cam, E.dingFx(1200, 250, bump(t, tSlam - 0.02, tQ + 0.2), t, 1.0), 1);
  o += K.bang('CLANG!', 960, 520, seg(t, tSlam, tSlam + 0.1) * (1 - seg(t, tSlam + 0.45, tSlam + 0.6)), 150, -6, '#FFFFFF') + flash(t, tSlam, 0.12, 0.7);
  return o;
}
// Q — inside the lift: muzak. Juno, amazed: "Forty-one thousand elevator rides… and they finally paid off." (badge!)
function liftIn(t, cam, o = {}) {
  const Li = FM.elevatorInside(t, { cam, muzak: 1, floor: o.floor || 'B7', pressed: [FM.LIFT.B9, FM.LIFT.B9 - 40] });
  let w = E.mopCart(520, 930, 0.6, t, { mop: false });
  w += grandpa(t, { x: 620, y: 905, s: 0.55, turn: 0.35, ...(o.gp || {}) }, o.gpAct || {});
  w += actor('juno', t, { x: 860, y: 905, s: 0.55, turn: 0.2, ...(o.juno || {}) }, o.junoAct || {});
  w += actor('dex', t, { x: 1370, y: 905, s: 0.55, turn: -0.3, ...(o.dex || {}) }, o.dexAct || {});
  w += actor('pip', t, { x: 1110, y: 935, s: 0.6, turn: 0, ...(o.pip || {}) }, o.pipAct || {});
  return Li.bg + view(cam, w + (o.extra || ''), 1) + Li.fg;
}
function shotQ(t) {
  const u = seg(t, tQ, tR);
  const cam = at(lerp(960, 990, u), 600, lerp(1.0, 1.12, ease.inOut(u)));
  const pant = Math.sin(t * 9) * (1 - u);
  let o = liftIn(t, cam, { gp: { face: { name: 'happy' }, bodyY: 4 * pant }, juno: { face: { name: 'amazed' } }, dex: { armL: 20, armR: 20, bodyY: 8 * pant, face: { name: 'dizzy' } }, dexAct: { arms: false }, pip: { face: { name: 'smug' }, armL: 14, armR: 14 }, pipAct: { arms: false } });
  o += K.badge(960, 215, 'ELEVATOR MASTER', '41,000 RIDES!', seg(t, W(13, 'paid') - 0.1, W(13, 'paid') + 0.25), t);
  return o + flash(t, tQ, 0.1, 0.3);
}
// R — Grandpa, warm, hand on Pip's hood: "That's my grandson."
function shotR(t) {
  const cam = camKeys(t, [[tR, at(880, 600, 1.55)], [tS, at(900, 610, 1.62)]]);
  const pat = seg(t, tR + 0.1, tR + 0.4);
  return liftIn(t, cam, { gp: { x: 900, turn: 0.45, armR: lerp(10, 58, pat), face: { name: 'happy', eyes: { type: 'happy' }, fx: ['blush'] } }, gpAct: { arms: false, energy: 0.6 }, pip: { x: 1110, face: { name: 'joy', fx: ['blush'] }, bodyY: -6 * Math.abs(Math.sin(t * 5)) }, juno: { x: 600 }, dex: { face: { name: 'happy' } } });
}
// S — Pip, close, whispering: "Ding." (one tiny sparkle; the muzak plays on)
function shotS(t) {
  const u = seg(t, tS, END);
  const cam = at(1110, lerp(620, 610, u), lerp(2.2, 2.35, u));
  const dg = bump(t, W(15, 'Ding') - 0.05, W(15, 'Ding') + 1.0);
  return liftIn(t, cam, { gp: { x: 900, armR: 58, face: { name: 'happy' } }, gpAct: { arms: false }, pip: { x: 1110, face: { name: 'cute', fx: ['blush'] } }, juno: { x: 600 }, extra: E.dingFx(1180, 440, dg, t, 0.36, '') });
}

// ================================================================ dispatch
const SHOTS = [
  [tB, shotA], [tC, shotB], [tD, shotC], [tE, shotD], [tF, shotE], [tG1, shotF], [tG2, shotG1], [tH, shotG2], [tI, shotH],
  [tI2, shotI1], [tI3, shotI2], [tJ, shotI3], [tK, shotJ], [tL, shotK], [tM1, shotL], [tM2, shotM1], [tN1, shotM2],
  [tN2, shotN1], [tO1, shotN2], [tO2, shotO1], [tO3, shotO2], [tO4, shotO3], [tO5, shotO4], [tP, shotO5], [tQ, shotP],
  [tR, shotQ], [tS, shotR], [Infinity, shotS],
];
function scene(t) {
  for (const [tEnd, fn] of SHOTS) if (t < tEnd) return fn(t);
  return shotS(t);
}
function timer(t) {
  if ((t >= tE && t < tF) || (t >= tG2 && t < tH) || (t >= tO2 && t < tO3) || (t >= tO4 && t < tQ)) return null;
  const sec = 6 * 3600 - (slowT(t) - START);
  const alarm = (t >= tG1 && t < tI) || (t >= tM1 && t < tQ);
  return { sec, glitch: alarm ? 0.35 : 0.1 };
}
function look(t) {
  if (t < tD) return { grade: 'warm', vignette: 0.75 };
  if (t >= tO4 && t < tO5) return { grade: null, vignette: 0.6 };
  if (t >= tQ) return { grade: 'warm', vignette: 0.7 };
  return { grade: 'cool', vignette: 0.8 };
}

module.exports = { scene, timer, look };
