// SC 13 · АУТРО — the frozen living room "finishes loading" into a bright Bubble-Island end card. Juno asks what YOU
// would do with 24 hours left (the old countdown pops up for a second), points at the comments, then the whole family
// lands on a floating island at the left; the right side stays clean for YouTube's end-screen elements
// (two video frames + a subscribe circle). "Log off for ten seconds... look up... then come right back!" — Pip: "Ding!"
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const C = K.C;
const A = require('./acting');
const ST = require('./sets');
const LAG = require('../rig/lag');
const { mop } = require('../rig/cast');
const E = require('./s12_env');
const { ob } = E;

const S13 = K.V.scene('SC 13').start, END = K.V.DURATION;
const l0 = L('13.0'), l1 = L('13.1'), l2 = L('13.2');
const tSo = l0.a, tYou = l0.word('YOU').t0, tTwenty = l0.word('twenty-four').t0, tLeft = l0.word('left').t1;
const tTell = l0.word('Tell').t0, tComments = l0.word('comments').t0;
const tCard = l1.a;                                     // the end card opens: camera pulls back, the cast lands
const tLog = l1.word('log').t0, tOff = l1.word('off').t0, tLook = l1.word('Look').t0;
const tThen = l1.word('Then').t0, tVideo = l1.word('video').t0;
const tDing = l2.a;

const at = (px, py, zoom) => ({ zoom, x: px - 960, y: py - 540 });
const outT = (txt, x, y, size, fill, sw = 10, extra = {}) => T(txt, x, y, size, fill, { stroke: '#151515', 'stroke-width': sw, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });

// ---------------------------------------------------------------- the card background (world = screen at zoom 1)
const ISL = { x: 470, y: 905, w: 920 };
const BUBS = [[120, 160, 60], [380, 90, 34], [700, 210, 46], [960, 120, 28], [1120, 820, 40], [80, 520, 30], [1860, 960, 44], [1180, 60, 22], [860, 420, 22]];
function background(t) {
  let o = S.rect(-900, -700, 3720, 2480, 0, { fill: 'url(#s13sky)' });
  o += S.circle(260, 120, 260, { fill: 'url(#s12warm)' }) + S.circle(260, 120, 92, ol('#FFF3B0', 7));
  o += K.rays(260, 120, 14, 900, '#FFFFFF', 0.12, t * 6);
  for (const [x0, y, s, sp] of [[-200, 300, 0.9, 10], [600, 60, 0.7, 7], [1500, 980, 1.1, 9], [1100, 360, 0.6, 12]]) o += K.E.cloud(((x0 + t * sp) % 2600) - 400, y, s, '#FFFFFF', '#E8D8FF');
  // tiny far islands (left half only: the right half stays calm for the end-screen elements)
  for (const [x, y, s] of [[760, 330, 0.18], [120, 700, 0.14]]) o += S.g(E.island(0, 0, 600, t), `translate(${x} ${f(y + Math.sin(t + x) * 6)}) scale(${s})`, { opacity: 0.8 });
  for (const [x, y, r] of BUBS) o += E.bubble(x + Math.sin(t * 0.8 + x) * 12, ((y - t * 18) % 1300 + 1300) % 1300 - 110, r, 0.75);
  return o;
}

// ---------------------------------------------------------------- end-screen placeholders (kept plain on purpose)
const VID = [[1535, 288, 600, 338], [1535, 684, 600, 338]];
const SUB = [1062, 300, 104];
function endSlots(t, k, glow = 0) {
  if (k <= 0) return '';
  let o = '';
  VID.forEach(([x, y, w, h], i) => {
    const kk = ob(seg(k, i * 0.18, i * 0.18 + 0.6));
    if (kk <= 0) return;
    let g = S.rect(-w / 2 + 10, -h / 2 + 14, w, h, 28, { fill: '#000', opacity: 0.16 });
    g += S.rect(-w / 2, -h / 2, w, h, 28, { fill: '#2A2246', opacity: 0.85, stroke: '#FFFFFF', 'stroke-width': 10 });
    if (glow > 0) g += S.rect(-w / 2 - 12, -h / 2 - 12, w + 24, h + 24, 36, { fill: 'none', stroke: '#FFE14D', 'stroke-width': 10, opacity: f(glow * (0.5 + 0.5 * Math.sin(t * 9 + i))) });
    g += S.circle(0, 0, 52, { fill: '#FFFFFF', opacity: 0.2 }) + S.path('M-16 -26 L28 0 L-16 26 Z', { fill: '#FFFFFF', opacity: 0.55 });
    g += S.g(S.rect(-120, -28, 240, 56, 20, ol('#FF4D8D', 6)) + T(i ? 'MORE VIDEOS' : 'WATCH NEXT', 0, 17, 34, '#FFFFFF'), `translate(${-w / 2 + 120} ${-h / 2})`);
    o += S.g(g, `translate(${x} ${y}) scale(${f(kk)})`);
  });
  const ks = ob(seg(k, 0.35, 0.95));
  if (ks > 0) {
    const [cx, cy, r] = SUB;
    let g = S.circle(6, 10, r, { fill: '#000', opacity: 0.16 }) + S.circle(0, 0, r, { fill: '#2A2246', opacity: 0.85, stroke: '#FFFFFF', 'stroke-width': 10 });
    g += S.g(S.rect(-124, -30, 248, 60, 22, ol('#E8243C', 6)) + T('SUBSCRIBE', 0, 18, 38, '#FFFFFF'), `translate(0 ${r + 34})`);
    o += S.g(g, `translate(${cx} ${cy}) scale(${f(ks)}) rotate(${f(Math.sin(t * 2) * 2)})`);
  }
  return o;
}

// ---------------------------------------------------------------- overlays
// the old countdown pill (a callback): pops up, ticks down from 24:00:00
function countdown(t, k) {
  if (k <= 0) return '';
  const sec = 24 * 3600 - Math.max(0, t - tTwenty - 0.3);
  let o = S.rect(-230, -50, 460, 100, 50, { fill: '#10131C', opacity: 0.88, stroke: '#3A4560', 'stroke-width': 6 });
  o += TF('SHUTDOWN IN', 0, -16, 22, '#9AA6C0', { 'letter-spacing': 3 }) + T(K.clock(sec), 0, 34, 54, '#FFFFFF', { 'letter-spacing': 2 });
  for (const sx of [-1, 1]) o += K.loadingWheel(sx * 186, 0, 16, t, '#7CF7FF', 8, 5);
  return S.g(o, `scale(${f(ob(k))})`);
}
function commentCard(t, k) {
  if (k <= 0) return '';
  let o = S.rect(-400, -100, 800, 200, 32, ol('#FFFFFF', 8));
  o += S.circle(-316, -14, 50, ol('#FFC928', 6)) + S.path('M-352 -26 Q-316 -90 -280 -26 Z', ol('#FFC928', 5)) + S.rect(-342, -30, 52, 46, 10, ol('#F6CFAE', 4));
  o += TF('@you', -248, -42, 32, '#7A8294', { 'text-anchor': 'start' });
  const txt = 'With 24 hours left I would...';
  const n = Math.floor(clamp((t - tComments + 0.1) * 22, 0, txt.length));
  o += S.rect(-252, -22, 610, 58, 16, ol('#F4F6FF', 5)) + TF(txt.slice(0, n) + (Math.floor(t * 4) % 2 ? '|' : ''), -236, 17, 32, '#2A1640', { 'text-anchor': 'start' });
  o += S.g(S.rect(-104, -26, 208, 52, 20, ol('#2E7BFF', 5)) + T('COMMENT', 0, 16, 32, '#FFFFFF'), 'translate(252 72)');
  return S.g(o, `translate(1330 ${f(lerp(1300, 700, ob(k)))})`);
}
function downArrow(x, y, t) {
  return S.g(S.path('M-34 -54 L34 -54 L34 0 L70 0 L0 70 L-70 0 L-34 0 Z', ol('#FF4D8D', 8)), `translate(${x} ${f(y + Math.abs(Math.sin(t * 7)) * 24)}) scale(0.7)`);
}

// ---------------------------------------------------------------- the cast
// [name, x, feet y, s, entry delay after tCard]
const CAST = [['dad', 100, 884, 0.4, 0.12], ['dex', 238, 930, 0.44, 0.0], ['mom', 405, 884, 0.4, 0.24], ['grandpa', 735, 884, 0.4, 0.18], ['pip', 872, 932, 0.5, 0.06]];
const JUNO = { x: 570, y: 932, s: 0.46 };
function castMember(t, name, x, y, s, delay) {
  const t0 = tCard + 0.15 + delay;
  const k = seg(t, t0, t0 + 0.4);
  if (k <= 0) return '';
  const drop = (1 - ease.out(k)) * 700, land = bump(t, t0 + 0.38, t0 + 0.55);
  const look = t > tLook - 0.1 && t < tThen ? [0, -1] : t > tThen ? [0.8, 0] : [0, 0];
  const waveK = t > tDing ? seg(t, tDing, tDing + 0.2) : 0;
  const wv = Math.sin((t - tDing) * 10 + x) * 18;
  const pose = { x, y: y - drop, s, sy: 1 - 0.1 * land, sx: 1 + 0.08 * land, turn: (x < JUNO.x ? 0.25 : -0.25), armL: 12, armR: 12, face: { name: waveK > 0 ? 'joy' : 'happy', eyes: { look } } };
  pose.armR = lerp(12, 150, waveK) + wv * waveK;
  if (t > tThen + 0.2 && t < tDing && name !== 'grandpa') pose.armR = lerp(12, 80, ease.out(seg(t, tThen + 0.2, tThen + 0.5)));
  if (name === 'grandpa') { pose.props = [{ svg: mop({ x: A.hand(28, 1)[0], bow: true }), layer: 'front' }]; pose.armL = pose.armR; pose.armR = 28; pose.keysSwing = Math.sin(t * 7) * 10; }
  if (name === 'pip') {
    const jump = t > tDing ? bump(t, tDing - 0.05, tDing + 0.45) : 0;
    pose.lift = 120 * jump;
    pose.armL = lerp(12, 160, waveK) - wv * waveK;
    if (t >= tDing) pose.face = { name: 'excited' };
    const hopB = t > tDing ? Math.abs(Math.sin((t - tDing) * 8)) * 0.6 : Math.abs(Math.sin(t * 3)) * 0.15;
    pose.props = [{ svg: LAG.buffer({ x: 0, y: -1000, s: 2.0, t, mood: t > tDing ? 'love' : 'happy', hop: hopB }), layer: 'front' }];
  }
  if (name === 'dex') { const p = { ...pose, headRot: 0 }; p.props = E.dexGear(t, p); Object.assign(pose, p); }
  return actor(name, t, pose, { arms: false, energy: 0.5 });
}
function juno(t) {
  let pose = { ...JUNO, armL: 14, armR: 14, face: { name: 'happy' } };
  if (t > tSo + 0.1 && t < tYou - 0.05) pose = { ...pose, lean: 4 * seg(t, tSo, tSo + 0.4), headRot: -5, face: { name: 'happy', eyes: { look: [0, 0] } } };
  if (t >= tYou - 0.05 && t < tTwenty - 0.3) { const k = ob(seg(t, tYou - 0.05, tYou + 0.12)); pose = { ...pose, armR: lerp(14, 95, k), armL: 14, headRot: 6, face: { name: 'excited' } }; }
  if (t >= tTwenty - 0.3 && t < tTell - 0.1) { const k = ob(seg(t, tTwenty - 0.3, tTwenty)); pose = { ...pose, armL: lerp(14, 52, k), armR: lerp(14, 52, k), headRot: -8 * k, face: { name: 'confused', fx: [] } }; }
  if (t >= tTell - 0.1 && t < tCard) { const k = ob(seg(t, tTell - 0.1, tTell + 0.2)); pose = { ...pose, armR: lerp(14, 70, k) + 6 * Math.sin(t * 12), armL: 14, turn: 0.3, face: { name: 'joy' } }; }
  if (t >= tCard) {
    // holds her phone up ... flips it face-down on "off"
    const hold = ob(seg(t, tLog - 0.5, tLog - 0.2)) * (1 - seg(t, tLook - 0.3, tLook));
    pose = { ...pose, armL: lerp(14, 60, hold), armR: 14, face: { name: 'happy' } };
    if (t > tLook - 0.1 && t < tThen) pose = { ...pose, armL: 14, armR: 14, face: { name: 'amazed', fx: [], eyes: { look: [0, -1] } }, headRot: 0 };
    if (t >= tThen) { const k = ob(seg(t, tThen, tThen + 0.3)); pose = { ...pose, turn: 0.35 * k, armR: lerp(14, 92, k) + 5 * Math.sin(t * 8), armL: 14, face: { name: 'joy' } }; }
    if (t >= tDing) { const w = Math.sin((t - tDing) * 10); pose = { ...pose, turn: 0, armR: 150 + 16 * w, armL: 150 - 16 * w, face: { name: 'joy' } }; }
    if (hold > 0) {
      const [hx, hy] = A.hand(pose.armL, -1);
      const flip = ease.inOut(seg(t, tOff - 0.1, tOff + 0.15));
      const sy = Math.cos(flip * Math.PI);
      const scr = sy > 0 ? S.rect(-150, -280, 300, 560, 0, { fill: '#5BC0EB' }) + S.circle(0, -40, 70, { fill: '#FFFFFF', opacity: 0.6 }) : S.rect(-150, -280, 300, 560, 0, { fill: '#2C303C' });
      pose.props = [{ svg: S.g(K.phone(0, 0, 0.36, 0, sy > 0 ? scr : '') + (sy <= 0 ? S.rect(-60, -110, 120, 220, 30, { fill: '#7C5CFF', opacity: 0.9 }) : ''), `translate(${f(hx)} ${f(hy - 110)}) scale(${f(hold)} ${f(hold * Math.max(0.06, Math.abs(sy)))})`), layer: 'top' }];
    }
  }
  return actor('juno', t, pose, { arms: false, energy: 1.0 });
}

// ---------------------------------------------------------------- the frame
function scene(t) {
  const out = ease.inOut(seg(t, tCard - 0.05, tCard + 0.7));
  const keys = [[S13, at(JUNO.x, 600, 1.85)], [tSo + 0.5, at(JUNO.x, 590, 1.7)], [tYou - 0.03, at(JUNO.x, 585, 1.74)], [tYou + 0.07, at(JUNO.x, 560, 2.15)], [tYou + 0.5, at(JUNO.x, 560, 2.18)], [tTwenty - 0.25, at(JUNO.x + 120, 560, 1.5)], [tCard - 0.05, at(JUNO.x + 160, 580, 1.42)]];
  let cam = camKeys(t, keys);
  if (t >= tCard - 0.05) {
    const c1 = { zoom: 1.42, x: JUNO.x + 160 - 960, y: 40 };
    cam = { zoom: lerp(c1.zoom, 1, out), x: lerp(c1.x, 0, out), y: lerp(c1.y, 0, out) };
    const up = bump(t, tLook - 0.1, tThen + 0.1);
    cam.y -= 30 * up;
  }
  const sh = K.shake(t, tYou, 0.3, 12);
  cam.sx = sh.sx; cam.sy = sh.sy;
  let w = background(t) + E.island(ISL.x, ISL.y + Math.sin(t * 1.2) * 4, ISL.w, t);
  // back row first, then the front row around Juno
  const back = CAST.filter((c) => c[2] < 900), front = CAST.filter((c) => c[2] >= 900);
  for (const c of back) w += castMember(t, ...c);
  for (const c of front) w += castMember(t, ...c);
  w += juno(t);
  let o = view(cam, w, 1);
  // birds crossing on "Look up."
  if (t > tLook - 0.2 && t < tThen + 0.6) for (let i = 0; i < 5; i++) {
    const u = (t - tLook + 0.2) * 0.9 - i * 0.07, bx = lerp(-100, 1300, u), by = 120 + i * 34 + Math.sin(t * 3 + i) * 10, fl = Math.sin(t * 16 + i) * 16;
    o += S.path(`M${f(bx - 34)} ${f(by - fl)} Q${f(bx - 16)} ${by - 18} ${f(bx)} ${by} Q${f(bx + 16)} ${by - 18} ${f(bx + 34)} ${f(by - fl)}`, ln(7));
  }
  // phase 1 overlays
  if (t > tYou && t < tTwenty) o += K.bang('YOU?', 1360, 300, seg(t, tYou, tYou + 0.08) * (1 - seg(t, tTwenty - 0.4, tTwenty - 0.1)), 140, 8, '#FF4D8D');
  const kc = seg(t, tTwenty - 0.1, tTwenty + 0.2) * (1 - seg(t, tTell - 0.25, tTell));
  if (kc > 0) o += S.g(countdown(t, kc), 'translate(1320 300)');
  const kcm = seg(t, tTell, tTell + 0.35) * (1 - seg(t, tCard + 0.1, tCard + 0.4));
  o += commentCard(t, kcm);
  if (kcm > 0.6) o += downArrow(1330, 880, t);
  // phase 2: the end card
  o += endSlots(t, seg(t, tCard + 0.3, tCard + 1.3), t > tThen ? seg(t, tThen, tThen + 0.3) * (1 - seg(t, tDing, tDing + 0.3)) : 0);
  if (t > tOff) o += K.bang('click', 455, 800, seg(t, tOff + 0.1, tOff + 0.18) * (1 - seg(t, tOff + 0.7, tOff + 0.9)), 56, -8, '#FFFFFF');
  if (t > tThen + 0.2 && t < tDing) {
    const ka = seg(t, tThen + 0.2, tThen + 0.4);
    o += S.g(S.path('M0 -30 L90 -30 L90 -70 L170 0 L90 70 L90 30 L0 30 Z', ol('#FFE14D', 8)), `translate(${f(1050 + Math.sin(t * 8) * 16)} 690) scale(${f(ob(ka) * 0.9)})`);
  }
  // Pip's Ding!
  if (t > tDing) {
    const kd = ob(seg(t, tDing, tDing + 0.25));
    o += view(cam, S.g(S.path('M-34 26 Q-34 -30 0 -32 Q34 -30 34 26 Z', ol('#FFD34D', 6)) + S.rect(-42, 22, 84, 14, 7, ol('#FFD34D', 5)) + S.circle(0, 46, 9, ol('#FFD34D', 4)), `translate(820 300) rotate(${f(Math.sin(t * 30) * 14 * (1 - seg(t, tDing + 0.4, tDing + 1)))}) scale(${f(kd)})`), 1);
    o += K.bang('DING!', 640, 250, kd, 96, -8, '#FFD21F') + K.sparkles([[760, 240, 30], [890, 230, 22], [540, 340, 18]], t);
    const cols = ['#FF5A5A', '#FFFFFF', '#3BD16F', '#34C3FF', '#B06BFF', '#FF6FB5', '#FFD21F'];
    for (let i = 0; i < 46; i++) {
      const age = t - tDing - hash(i * 2.3) * 0.7;
      if (age < 0) continue;
      const x = hash(i * 7.7) * 1160 + Math.sin(t * 3 + i) * 30, y = -40 + age * (360 + hash(i) * 260);
      if (y > 1100) continue;
      o += S.rect(x, y, 16, 26, 4, { fill: cols[i % cols.length], transform: `rotate(${f(age * 400 + i * 40)} ${f(x + 8)} ${f(y + 13)})` });
    }
  }
  // the entry: the frozen frame "finishes loading" — colourful pixels pop away
  if (t < S13 + 0.5) o += C.pixelWipe(seg(t, S13, S13 + 0.5), 'reveal');
  return o;
}
const look = () => ({ grade: 'warm', vignette: 0.3 });

module.exports = { scene, look };
