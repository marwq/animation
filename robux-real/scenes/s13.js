// SC 13 · OUTRO — smash cut from "...Oh no." to a bright end card: Ty asks what YOU would buy (the things orbit him),
// a comment box, then the cast gathers on the left while the right side stays clear for the end-screen elements;
// "never share your password" — and Grandma pops up with her sticky note. NOPE.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor, coin, rays, bang } = K;
const { L } = K.V;
const C = K.C;
const A = require('./acting');
const S12 = require('./s12');

const S13 = K.V.scene('SC 13').start, END = K.V.DURATION;
const l0 = L('13.0'), l1 = L('13.1');
const tSo = l0.a, tYou = l0.word('YOU').t0, tBuy = l0.word('buy').t0, tMoney = l0.word('money').t0;
const tTell = l0.word('Tell').t0 - 0.25, tComments = l0.word('comments').t0;
const tCard = l1.a - 0.1;                                  // the end-card layout settles
const tPwd = l1.word('password').t0, tNot = l1.word('Not').t0;
const tPw3 = l1.word('password', 1).t0, tThree = l1.word('three').t0;
const tWave = l1.b + 0.1;

const ob = (u) => (u <= 0 ? 0 : ease.outBack(u));
const at = (px, py, zoom) => ({ zoom, x: px - 960, y: py - 540 });

const DEFS = `<defs>
<radialGradient id="s13bg" cx="0.42" cy="0.45" r="0.8"><stop offset="0" stop-color="#FFF3A6"/><stop offset="0.45" stop-color="#FFD84A"/><stop offset="1" stop-color="#FF9F43"/></radialGradient>
<linearGradient id="s13plat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2FC7B9"/><stop offset="1" stop-color="#1A9488"/></linearGradient>
</defs>`;

// ---------------------------------------------------------------- the card
const FLOOR = 930;
function background(t) {
  let o = S.rect(-600, -600, 3120, 2280, 0, { fill: 'url(#s13bg)' });
  o += rays(820, 470, 20, 2200, '#FFFFFF', 0.16, t * 6);
  for (let i = 0; i < 12; i++) {
    const x = hash(i * 3.7) * 2000 - 40, y = 80 + hash(i * 5.1) * 640 + Math.sin(t * 1.4 + i) * 16;
    o += coin(x, y, 20 + hash(i) * 22, Math.sin(t + i) * 12, t * (1 + hash(i * 2)) + i);
  }
  return o;
}
function platform() {
  let o = S.rect(-600, FLOOR, 3120, 600, 0, { fill: 'url(#s13plat)' }) + S.rect(-600, FLOOR, 3120, 600, 0, { fill: 'url(#studs)' });
  o += S.rect(-600, FLOOR - 6, 3120, 22, 0, ol('#5FE3D6', 6));
  return o;
}
// end-screen slots: kept plain so YouTube's own elements sit on top of them cleanly
const SLOTS = [[1250, 120, 600, 338], [1250, 512, 600, 338]];
const SUB = [210, 190, 100];
function endSlots(t, k) {
  if (k <= 0) return '';
  let o = '';
  SLOTS.forEach(([x, y, w, h], i) => {
    const kk = ob(seg(k, i * 0.15, i * 0.15 + 0.7));
    if (kk <= 0) return;
    let g = S.rect(-w / 2 + 10, -h / 2 + 14, w, h, 30, { fill: '#000', opacity: 0.18 }) + S.rect(-w / 2, -h / 2, w, h, 30, { fill: '#2A1640', opacity: 0.88, stroke: '#FFFFFF', 'stroke-width': 10 });
    g += S.circle(0, 0, 54, { fill: '#FFFFFF', opacity: 0.22 }) + S.path('M-18 -28 L30 0 L-18 28 Z', { fill: '#FFFFFF', opacity: 0.6 });
    g += S.g(S.rect(-118, -28, 236, 56, 18, ol('#FF4D8D', 6)) + T(i ? 'MORE VIDEOS' : 'WATCH NEXT', 0, 18, 36, '#FFFFFF'), `translate(${-w / 2 + 110} ${-h / 2})`);
    o += S.g(g, `translate(${x + w / 2} ${y + h / 2}) scale(${f(kk)})`);
  });
  const ks = ob(seg(k, 0.3, 1));
  if (ks > 0) {
    const [cx, cy, r] = SUB;
    let g = S.circle(6, 10, r, { fill: '#000', opacity: 0.18 }) + S.circle(0, 0, r, { fill: '#2A1640', opacity: 0.88, stroke: '#FFFFFF', 'stroke-width': 10 });
    g += S.g(S.rect(-130, -30, 260, 60, 20, ol('#E2233B', 6)) + T('SUBSCRIBE', 0, 18, 38, '#FFFFFF'), `translate(0 ${r + 30})`);
    o += S.g(g, `translate(${cx} ${cy}) scale(${f(ks)}) rotate(${f(Math.sin(t * 2) * 2)})`);
  }
  return o;
}

// ---------------------------------------------------------------- props
function itemIcon(i, t) {
  switch (i) {
    case 0: return S.ellipse(0, 10, 110, 26, ol('#FFC93C', 7)) + S.ellipse(0, 4, 80, 10, { fill: '#FFF1B0' }) + S.ellipse(0, 46, 90, 12, { fill: '#5CF2FF', opacity: 0.6 }); // gold hoverboard
    case 1: return S.g(S.rect(-110, -12, 170, 24, 10, ol('#FFC93C', 6)) + S.rect(60, -30, 56, 26, 6, ol('#FFFFFF', 5)) + K.F.sparkle(-60, -40, 18), 'rotate(-20)'); // gold toothbrush
    case 2: return S.rect(-90, -30, 180, 90, 8, ol('#F8F2EA', 6)) + S.path('M-104 -28 L0 -86 L104 -28 Z', ol('#E2B33C', 6)) + S.rect(-60, -6, 40, 36, 4, ol('#F59A8C', 4)) + S.rect(20, -6, 40, 36, 4, ol('#F59A8C', 4)) + S.rect(-100, 56, 200, 18, 6, ol('#FFC93C', 5)); // mansion
    case 3: return S12.hat(0, 0, 50, 0.75, 0, '#FF6FB5') + S12.hat(1, 0, 0, 0.6, 0, '#FFD21F') + S12.hat(4, 0, -70, 0.55, 0, '#FFD21F'); // hat stack
    case 4: return S12.shoeIcon(0, 10, 0.8, -6); // a shoe
    default: return S12.bread(0, 10, 0.6); // bread
  }
}
function orbitItems(t, k) {
  if (k <= 0) return '';
  let o = '';
  const n = 6;
  for (let i = 0; i < n; i++) {
    const pop = ob(seg(t, tBuy + i * 0.09, tBuy + i * 0.09 + 0.3)) * (1 - ease.in(seg(t, tTell, tTell + 0.35)));
    if (pop <= 0) continue;
    const a = (i / n) * Math.PI * 2 + t * 0.35 - 0.4;
    const x = 960 + Math.cos(a) * 520, y = 470 + Math.sin(a) * 280;
    o += S.g(S.circle(0, 0, 112, ol('#FFFFFF', 8)) + S.circle(0, 0, 100, { fill: '#FFF8E1' }) + S.g(itemIcon(i, t), 'scale(0.8)'), `translate(${f(x)} ${f(y + Math.sin(t * 3 + i) * 10)}) scale(${f(pop)})`);
  }
  return o;
}
function commentCard(t, k) {
  if (k <= 0) return '';
  let o = S.rect(-470, -110, 940, 220, 34, ol('#FFFFFF', 8));
  o += S.circle(-370, -20, 54, ol('#1FB5A8', 6)) + S.path('M-404 -30 Q-370 -96 -336 -30 Z', ol('#1FB5A8', 5)) + S.rect(-396, -30, 52, 46, 10, ol('#E9B38B', 4));
  o += TF('@you', -296, -48, 34, '#7A8294', { 'text-anchor': 'start' });
  const txt = 'I would buy...';
  const n = Math.floor(clamp((t - tComments) * 14, 0, txt.length));
  o += S.rect(-300, -26, 700, 64, 16, ol('#F4F6FF', 5)) + TF(txt.slice(0, n) + (Math.floor(t * 4) % 2 ? '|' : ''), -280, 18, 38, '#2A1640', { 'text-anchor': 'start' });
  o += S.g(S.rect(-110, -28, 220, 56, 20, ol('#2E7BFF', 5)) + T('COMMENT', 0, 16, 34, '#FFFFFF'), 'translate(290 76)');
  return S.g(o, `translate(960 ${f(lerp(1300, 770, ob(k)))})`);
}
function padlock(t, k) {
  if (k <= 0) return '';
  const shut = ease.in(seg(t, tPwd + 0.1, tPwd + 0.3));
  let o = S.path(`M-50 ${f(-30 - 40 * (1 - shut))} L-50 -80 Q-50 -130 0 -130 Q50 -130 50 -80 L50 ${f(-30 - 40 * (1 - shut))}`, ln(30, '#151515')) + S.path(`M-50 ${f(-30 - 40 * (1 - shut))} L-50 -80 Q-50 -130 0 -130 Q50 -130 50 -80 L50 ${f(-30 - 40 * (1 - shut))}`, ln(18, '#C9D1DC'));
  o += S.rect(-86, -40, 172, 140, 26, ol('#FFC93C', 8)) + S.circle(0, 20, 18, { fill: '#2A1640' }) + S.rect(-7, 26, 14, 40, 6, { fill: '#2A1640' });
  o += S.g(S.rect(-150, -36, 300, 72, 24, ol('#2A1640', 6)) + T('* * * * * *', 0, 22, 44, '#FFFFFF'), 'translate(0 150)');
  if (shut >= 1) o += bang('click!', 140, -120, seg(t, tPwd + 0.3, tPwd + 0.4) * (1 - seg(t, tPwd + 1.0, tPwd + 1.2)), 50, 8, '#FFFFFF');
  return S.g(o, `translate(920 250) rotate(6) scale(${f(ob(k))})`);
}
function stickyNo(t) {
  const k = ob(seg(t, tPw3 - 0.25, tPw3 + 0.05));
  if (k <= 0) return '';
  let o = S.rect(-10, 60, 20, 260, 6, ol('#B07A42', 5)) + S.rect(-120, -90, 240, 170, 8, ol('#FFF27A', 7)) + TF('password3', 0, 10, 44, '#C8243F') + TF('(new!)', 0, 56, 30, '#7A4A1E');
  const x = ob(seg(t, tThree, tThree + 0.12));
  if (x > 0) o += S.g(S.path('M-120 -100 L120 100 M120 -100 L-120 100', ln(34, '#151515')) + S.path('M-120 -100 L120 100 M120 -100 L-120 100', ln(22, '#E2233B')) + T('NOPE!', 0, -130, 72, '#E2233B', { stroke: '#151515', 'stroke-width': 10, 'paint-order': 'stroke' }), `scale(${f(lerp(1.8, 1, x))})`, { opacity: f(x) });
  return S.g(o, `translate(1080 ${f(lerp(900, 330, k))}) rotate(${f(-6 + Math.sin(t * 5) * 2)}) scale(${f(0.85 * Math.min(1, k + 0.3))})`);
}

// ---------------------------------------------------------------- cast
function popIn(t, t0) { return ob(seg(t, t0, t0 + 0.35)); }
function cast(t) {
  const wave = t > tWave ? Math.sin((t - tWave) * 10) : 0;
  const waveK = seg(t, tWave, tWave + 0.2);
  const lookTy = [0.3, 0];
  let o = '';
  const who = [
    ['mom', 140, 0.48, tCard + 0.1, 0.3, 'happy'],
    ['dad', 330, 0.48, tCard + 0.25, 0.2, 'joy'],
    ['mia', 510, 0.5, tCard + 0.4, 0.25, 'smug'],
    ['pickle', 910, 0.54, tCard + 0.55, -0.25, 'joy'],
  ];
  for (const [name, x, s, t0, turn, face] of who) {
    const k = popIn(t, t0);
    if (k <= 0) continue;
    const lift = (1 - k) * -300 + Math.abs(Math.sin(t * 5 + x)) * 10 * waveK;
    const armUp = waveK * (150 + 18 * wave);
    o += actor(name, t, { x, y: FLOOR + 10, s, turn, sy: lerp(0.6, 1, k), lift: Math.max(0, lift), armR: name === 'mia' ? 12 + armUp : 12 + armUp, armL: 12 + (name === 'pickle' ? armUp : 0), face: { name: face, eyes: { look: lookTy } } }, { arms: false });
  }
  return o;
}
function grandma(t) {
  const k = ob(seg(t, tPw3 - 0.35, tPw3 + 0.05));
  if (k <= 0) return '';
  const sheep = t > tThree + 0.15;
  return actor('grandma', t, { x: 1080, y: lerp(1500, FLOOR + 10, k), s: 0.5, turn: -0.2, armL: sheep ? 40 : 160, armR: 160, face: sheep ? { name: 'nervous', mouth: 'teeth', fx: ['sweat'] } : { name: 'joy', fx: ['sparkles'] } }, { arms: false });
}
function thirty(t) {
  const k = ob(seg(t, tWave + 0.3, tWave + 0.6));
  if (k <= 0) return '';
  const calc = S.g(S.rect(-40, -60, 80, 120, 10, ol('#3A3F55', 5)) + S.rect(-30, -50, 60, 28, 4, { fill: '#BFF5B0' }) + TF('30%', 0, -28, 22, '#1A5A1A'), 'translate(-230 -520) rotate(-10)');
  return actor('thirty', t, { x: 1200, y: lerp(1300, FLOOR + 30, k), s: 0.42, turn: -0.4, armL: 110, armR: 30, face: { name: 'sneaky' }, props: [{ svg: calc, layer: 'front' }] });
}

// ---------------------------------------------------------------- the one continuous card, camera-driven
function scene(t) {
  // Ty: centre while he asks; slides left into the end-card lineup on "And remember"
  const slide = ease.inOut(seg(t, tCard - 0.1, tCard + 0.6));
  const tyX = lerp(960, 710, slide), tyS = lerp(0.62, 0.58, slide);
  const intro = ob(seg(t, S13, S13 + 0.3));
  const cam = camKeys(t, [
    [S13, at(960, 520, 1.5)], [tSo + 0.6, at(960, 500, 1.38)], [tYou - 0.02, at(960, 500, 1.4)], [tYou + 0.1, at(960, 470, 1.85)],
    [tBuy + 0.25, at(960, 520, 1.12)], [tTell, at(960, 540, 1.0)], [tCard, at(960, 540, 1.0)],
  ]);
  if (t > tYou && t < tYou + 0.35) { const sh = K.shake(t, tYou, 0.3, 12); cam.sx = sh.sx; cam.sy = sh.sy; }
  // Ty's acting
  let pose = { face: { name: 'sneaky' }, armL: 14, armR: 14 };
  if (t > tSo + 0.85) pose = { face: { name: 'excited' }, armR: 100, armL: 20, lean: -3 };                    // "what would YOU" — points at you
  if (t > tBuy + 0.2) pose = { face: { name: 'happy' }, armL: 60 + 10 * Math.sin(t * 6), armR: 60 - 10 * Math.sin(t * 6) };
  if (t > tTell) pose = { face: { name: 'talkHappy' }, armL: 20, armR: 40, headRot: 6 };                     // points down at the comments
  if (t > tCard) pose = { face: { name: 'determined' }, armL: 14, armR: 150 + 14 * Math.sin(t * 9), headRot: -4 }; // wagging finger
  if (t > tNot) pose = { face: { name: 'smug' }, armL: 14, armR: 30, turn: 0.4 };
  if (t > tThree) pose = { face: { name: 'deadpan', eyes: { look: [0.9, 0] } }, armL: 14, armR: 158, turn: 0.45, headRot: 8, props: [{ svg: S.g(S.rect(-120, -60, 260, 112, 34, ol('#E9B38B', 8)) + S.path('M-96 -24 L110 -24 M-96 8 L110 8', ln(6, '#C98E6A')), 'translate(20 -690) rotate(-8)'), layer: 'top' }] };   // facepalm
  if (t > tWave) pose = { face: { name: 'joy' }, armL: 150 + 16 * Math.sin((t - tWave) * 10), armR: 150 - 16 * Math.sin((t - tWave) * 10) };
  const squash = 1 + 0.12 * (1 - intro);
  let w = background(t) + platform();
  w += cast(t);
  w += actor('ty', t, { x: tyX, y: FLOOR + 10, s: tyS * lerp(0.7, 1, intro), sx: squash, sy: 2 - squash, ...pose }, { arms: false });
  w += grandma(t) + thirty(t);
  let o = view(cam, w, 1);
  // overlays (screen space)
  o += view(cam, orbitItems(t, 1), 1);
  if (t > tYou && t < tYou + 0.9) o += bang('YOU!', 1400, 260, seg(t, tYou, tYou + 0.08) * (1 - seg(t, tYou + 0.7, tYou + 0.9)), 150, 8, '#FF4D8D');
  const rainK = 1 - seg(t, tCard - 0.2, tCard + 0.4);
  if (t > tMoney && rainK > 0) o += S.g(K.coinRain(t, 22, { seed: 7, r: 28, speed: 640, y0: -200, y1: 1300 }), null, { opacity: f(rainK) });
  const kc = seg(t, tTell, tTell + 0.35) * (1 - seg(t, tCard - 0.15, tCard + 0.1));
  o += commentCard(t, kc);
  if (kc > 0.5) o += S.g(S.path('M-40 -60 L40 -60 L40 0 L80 0 L0 80 L-80 0 L-40 0 Z', ol('#FF4D8D', 8)), `translate(1560 ${f(780 + Math.abs(Math.sin(t * 7)) * 30)}) scale(0.8)`);
  o += endSlots(t, seg(t, tCard + 0.1, tCard + 1.0));
  o += padlock(t, seg(t, tPwd - 0.25, tPwd + 0.05) * (1 - seg(t, tNot + 0.2, tNot + 0.45)));
  o += stickyNo(t);
  if (t > tWave) {
    // confetti raining from the top (kept off the faces' burst point)
    const cols = ['#FF5A5A', '#FFFFFF', '#3BD16F', '#34C3FF', '#B06BFF', '#FF6FB5'];
    for (let i = 0; i < 44; i++) {
      const age = t - tWave - hash(i * 2.3) * 0.8;
      if (age < 0) continue;
      const x = hash(i * 7.7) * 1920 + Math.sin(t * 3 + i) * 30, y = -40 + age * (380 + hash(i) * 260);
      if (y > 1100) continue;
      o += S.rect(x, y, 16, 26, 4, { fill: cols[i % 6], transform: `rotate(${f(age * 400 + i * 40)} ${f(x + 8)} ${f(y + 13)})` });
    }
  }
  // the smash-cut entry
  o += C.whiteFlash(0.75 * (1 - seg(t, S13, S13 + 0.08)));
  return o;
}
const look = () => ({ grade: 'warm', vignette: 0.35 });

module.exports = { scene, look, DEFS };
