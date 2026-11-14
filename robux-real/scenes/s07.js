// SC 07 · FREE ROBUX — evening at Grandma's cottage: the FREE ROBUX scammer wants her password → Ty bursts in on his hoverboard →
// game-chat flashback → rooftop & fence chase through scam pop-up traps (Nope! Nope! NOPE!) → REPORT → the ban hammer → dragged to the bin →
// "Never. Share. Your password." → "password two".
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor, coin, rays, bang } = K;
const { L } = K.V;
const C = K.C;
const A = require('./acting');
const E6 = require('./s06_env');
const { hat, placeHat, hoverboard, whip, flashAt, bubble, stamp, bushy } = E6;
const S01 = require('./s01');
const { D } = require('../rig/cast');
const { makeDraw } = require('../rig/r6');

const l0 = L('07.0'), l1 = L('07.1'), l2 = L('07.2'), l3 = L('07.3'), l4 = L('07.4'), l5 = L('07.5'), l6 = L('07.6'), l7 = L('07.7');
const l8 = L('07.8'), l9 = L('07.9'), l10 = L('07.10'), l11 = L('07.11'), l12 = L('07.12'), l13 = L('07.13');
const START = K.V.scene('SC 07').start, END = K.V.scene('SC 08').start;
const tProb = l0.word('problems').t0;
const tB1 = l1.a - 0.1, tMaam = l1.word("ma'am").t0, tFree = l1.word('FREE').t0, tB2 = l1.word('Just').t0 - 0.12, tPw = l1.word('password').t0, tDouble = l1.word('DOUBLE').t0;
const tC1 = l2.a - 0.12, tDbl2 = l2.word('double').t0, tC2 = l2.word('Well').t0 - 0.12, tPwA = l2.word('password').t0, tPw2 = l2.word('password', 1).t0;
const tD = l3.a - 0.28, tNo = l3.word('NO').t0;
const tE1 = l4.a - 0.06, tE2 = l4.word('free').t0 - 0.1;
const tHits = ['free', 'scam', 'every', 'game', 'chat', 'EVER'].map((w) => l4.word(w).t0);
const tF = l5.a - 0.12, tClick = l5.word('Click').t0;
const tG1 = l6.a - 0.05, tReal1 = l6.word('real').t0, tG2 = l6.word('You').t0 - 0.06, tHatW = l6.word('hat').t0, tG3 = l6.word('Verify').t0 - 0.06, tAcct = l6.word('account').t0;
const tN = [l6.word('Nope').t0, l6.word('Nope', 1).t0, l6.word('Nope', 2).t0];
const tG4 = tN[0] - 0.1;
const tH = tN[2] + 0.8, tThen = l7.word('then').t0, tRealC = l7.word('REAL', 1).t0;
const tI = l8.a - 0.1, tRep = l8.word('reported').t0, tBan = l8.word('BANNED').t0, tI2 = tBan - 0.3;
const tJ = l9.a - 0.15, tBack = l9.word('back').t0, tLink = l9.word('link').t0;
const tK = l10.a - 0.2, tCool = l10.word('cool').t0;
const tL = l11.a - 0.1, tNever = l11.word('Never').t0, tShare = l11.word('Share').t0, tYour = l11.word('Your').t0;
const tM = l12.a - 0.25, tIts = l12.word("It's").t0, tPw2b = l12.word('password').t0;
const tN0 = l13.a - 0.25;

const DEFS = `<defs>
<linearGradient id="s07eve" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A1E6A"/><stop offset="0.45" stop-color="#9A4AA0"/><stop offset="0.8" stop-color="#FF8A6B"/><stop offset="1" stop-color="#FFC38A"/></linearGradient>
<linearGradient id="s07late" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1E1250"/><stop offset="0.55" stop-color="#6A3A8A"/><stop offset="1" stop-color="#E07A7A"/></linearGradient>
<radialGradient id="s07lamp" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFE7A0" stop-opacity="0.75"/><stop offset="1" stop-color="#FFE7A0" stop-opacity="0"/></radialGradient>
<radialGradient id="s07red" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FF4D4D" stop-opacity="0.55"/><stop offset="1" stop-color="#FF4D4D" stop-opacity="0"/></radialGradient>
</defs>`;

// ---------------------------------------------------------------- the scammer (sign stays readable in side view, both directions)
const scamL = makeDraw({ ...D.scammer, headSide: (face) => S.g(D.scammer.head(face), 'translate(12 0) scale(0.72 1)') });
const scamRt = makeDraw({ ...D.scammer, headSide: (face) => S.g(D.scammer.head(face), 'translate(12 0) scale(-0.72 1)') });
function scam(t, pose = {}, act = {}) {
  const auto = K.V.perform('SCAMMER', t, { seed: 9.1, ...act });
  const p = { shade: true, shadow: true, ...auto, ...pose };
  const fo = typeof p.face === 'string' ? { name: p.face } : { ...(p.face || {}) };
  if (auto.face && auto.face.mouth && K.V.talking('SCAMMER', t) && fo.mouth === undefined) fo.mouth = auto.face.mouth;
  fo.signOn = pose.signOn ?? (Math.floor(t * 5) % 3 !== 0 ? 1 : 0);
  p.face = fo;
  if (p.view !== 'side') p.flip = false;
  return (p.view === 'side' ? (p.flip ? scamRt : scamL) : scamFront)(p);
}
const scamFront = makeDraw(D.scammer);
const gma = (t, x, y, s, pose = {}, act = {}) => actor('grandma', t, { x, y, s, ...pose }, act);
const ty = (t, x, y, s, pose = {}, act = {}) => S01.tyIn(t, x, y, s, pose, act, false);
function tyBoard(t, x, y, s, pose = {}, act = {}) {
  // Ty riding the hoverboard (side view, facing right); y = board height
  const bob = Math.sin(t * 9) * 6;
  return hoverboard(x, y + bob + 12 * s / 0.45, s / 0.45 * 0.9, t) + ty(t, x + 10, y + bob, s, { view: 'side', flip: true, legL: 18, kneeL: 30, legR: -24, kneeR: 34, armL: -70, armR: 60, lean: 14, face: { name: 'determined' }, ...pose }, { arms: false, ...act });
}

// ---------------------------------------------------------------- Grandma's cottage (porch, lamp, flower boxes) — s=1: ~1000 wide, door 290 tall
function eveningSky(t, id = 's07eve') {
  let o = S.rect(-1200, -900, 4320, 2880, 0, { fill: `url(#${id})` });
  o += S.circle(1500, 640, 140, { fill: '#FFD9A0', opacity: 0.6 }) + S.circle(1500, 640, 220, { fill: '#FFB38A', opacity: 0.25 });
  for (let i = 0; i < 26; i++) o += S.circle(hash(i * 3.7) * 2400 - 240, hash(i * 1.9) * 420 - 60, 2 + hash(i) * 3, { fill: '#FFFFFF', opacity: f(0.5 + 0.4 * Math.sin(t * 3 + i)) });
  for (const [x, y, s] of [[200, 200, 0.9], [900, 120, 0.7], [1650, 230, 0.8]]) o += K.E.cloud(((x + t * 10) % 2600) - 300, y, s, '#E7A0C8', '#C77AAE');
  return o;
}
function flowerBox(x, y, w) {
  let o = S.rect(x, y, w, 34, 8, ol('#A86B3C', 5));
  for (let i = 0; i < Math.floor(w / 34); i++) {
    const fx = x + 18 + i * 34;
    o += S.path(`M${fx} ${y} L${fx} ${y - 22}`, ln(4, '#2E9C47')) + S.circle(fx, y - 28, 11, ol(['#FF5A7A', '#FFE14D', '#FFFFFF', '#B06BFF', '#FF9F1C'][i % 5], 4)) + S.circle(fx, y - 28, 4, { fill: '#FFB000' });
  }
  return o;
}
function cottage(t, x, base, s = 1, o2 = {}) {
  const { doorOpen = 0, lampOn = 1, night = 0 } = o2;
  let o = '';
  // chimney + smoke
  o += S.rect(250, -880, 90, 220, 6, ol('#B07A6A', 6));
  for (let i = 0; i < 4; i++) { const ph = (t * 0.4 + i / 4) % 1; o += S.circle(295 + Math.sin(ph * 6 + i) * 30, -900 - ph * 260, 24 + ph * 30, { fill: '#FFFFFF', opacity: f(0.45 * (1 - ph)) }); }
  // walls
  o += S.rect(-500, -540, 1000, 540, 10, ol('#FBE7C6', 7));
  for (let y = -500; y < 0; y += 60) o += S.path(`M-494 ${y} L494 ${y}`, ln(2, '#E8CFA6', 0.8));
  // roof
  o += S.path('M-570 -520 L0 -960 L570 -520 Z', ol('#7A4B6A', 8));
  for (let i = 1; i < 6; i++) { const y = -520 - i * 72, hw = 570 * (1 - (i * 72) / 440); o += S.path(`M${f(-hw)} ${y} L${f(hw)} ${y}`, ln(4, '#5E3652', 0.7)); }
  o += S.path('M-570 -520 L570 -520', ln(14, '#FFFFFF'));
  o += S.circle(0, -700, 60, ol(night ? '#FFE7A0' : '#FFE7A0', 6)) + S.path('M0 -760 L0 -640 M-60 -700 L60 -700', ln(5, '#7A4B6A'));
  // windows (warm light) + flower boxes
  for (const wx of [-420, 260]) {
    o += S.rect(wx, -400, 160, 170, 10, ol('#FFE7A0', 6)) + S.path(`M${wx + 80} -400 L${wx + 80} -230 M${wx} -315 L${wx + 160} -315`, ln(6, '#FFFFFF'));
    o += S.rect(wx - 14, -410, 20, 190, 4, ol('#8DBF8F', 4)) + S.rect(wx + 154, -410, 20, 190, 4, ol('#8DBF8F', 4));
    o += flowerBox(wx - 16, -226, 192);
  }
  // door (opens inward = gets darker and narrower)
  const dw = 180 * (1 - 0.75 * doorOpen);
  o += S.path('M-90 -40 L-90 -250 Q0 -340 90 -250 L90 -40 Z', ol('#3A2440', 6));
  if (doorOpen > 0) o += S.path('M-90 -40 L-90 -250 Q0 -340 90 -250 L90 -40 Z', { fill: '#FFD9A0', opacity: 0.65 });
  o += S.path(`M-90 -40 L-90 -250 Q${f(-90 + dw / 2)} -340 ${f(-90 + dw)} -250 L${f(-90 + dw)} -40 Z`, ol('#8DBF8F', 6));
  if (doorOpen < 0.5) o += S.circle(60, -150, 9, ol('#FFD34D', 3)) + S.path(K.F.heartPath(0, -240, 18), ol('#FF6FB5', 3));
  // lamp
  o += S.rect(140, -330, 14, 40, 4, { fill: '#2A2A36' }) + S.path('M120 -290 L174 -290 L166 -230 L128 -230 Z', ol('#2A2A36', 5)) + S.rect(132, -284, 30, 48, 6, { fill: lampOn ? '#FFE7A0' : '#7A6A50' });
  if (lampOn) o += S.circle(147, -260, 170, { fill: 'url(#s07lamp)' });
  // porch: floor, steps, roof on posts
  o += S.rect(-300, -40, 600, 44, 6, ol('#C9945A', 6)) + S.rect(-240, 4, 480, 24, 4, ol('#B07A48', 5)) + S.rect(-200, 28, 400, 22, 4, ol('#A06A3A', 5));
  o += S.rect(-280, -420, 24, 380, 6, ol('#FFFFFF', 5)) + S.rect(256, -420, 24, 380, 6, ol('#FFFFFF', 5));
  o += S.path('M-320 -400 L320 -400 L280 -450 L-280 -450 Z', ol('#7A4B6A', 6));
  // welcome mat
  o += S.rect(-110, -46, 220, 22, 6, ol('#FF9CCB', 4)) + TF('HI SWEETIE', 0, -29, 18, '#7A3A5A');
  return S.g(o, `translate(${f(x)} ${f(base)}) scale(${f(s)})`);
}
function garden(t, opts = {}) {
  let o = S.rect(-1200, 880, 4320, 900, 0, { fill: '#4FA05A' }) + S.rect(-1200, 870, 4320, 16, 0, { fill: '#6FC06A' });
  // path
  o += S.path('M860 880 L1060 880 L1180 1300 L740 1300 Z', { fill: '#D9C4A0' });
  for (let i = 0; i < 4; i++) o += S.ellipse(960 + (i % 2 ? 30 : -30), 930 + i * 90, 70 + i * 10, 22 + i * 4, ol('#C9B08A', 4));
  // picket fence + hedge
  for (let x = -1100; x < 3000; x += 70) if (x < 700 || x > 1180) o += S.path(`M${x} 1010 L${x} 920 L${x + 20} 900 L${x + 40} 920 L${x + 40} 1010 Z`, ol('#FFF4E6', 4));
  o += S.rect(-1100, 940, 1800, 14, 4, ol('#FFF4E6', 4)) + S.rect(1180, 940, 1820, 14, 4, ol('#FFF4E6', 4));
  return o;
}

// ---------------------------------------------------------------- props: clipboard, pop-up windows, shards, cursor, bin, hammer, button
function clipboard(txt = '', k = 0) {
  let o = S.rect(-110, -150, 220, 300, 18, ol('#B07A48', 7)) + S.rect(-90, -120, 180, 250, 8, ol('#FFFFFF', 5)) + S.rect(-50, -168, 100, 40, 10, ol('#9AA0AE', 5));
  o += TF('PASSWORD:', 0, -70, 30, '#2E3A55') + S.path('M-70 0 L70 0', ln(4, '#9AA0AE')) + S.path('M-70 60 L70 60', ln(4, '#9AA0AE'));
  if (txt) o += S.el('text', { x: -70, y: -6, 'font-family': 'Fredoka, sans-serif', 'font-weight': 600, 'font-size': 34, fill: '#2B6CE0', 'text-anchor': 'start' }, txt);
  o += TF('x2 ROBUX!!', 0, 110, 26, '#E2233B');
  return o;
}
const pen = () => S.rect(-8, -80, 16, 90, 6, ol('#2B6CE0', 4)) + S.path('M-8 10 L0 30 L8 10 Z', ol('#F2EADF', 3));
function popup(kind, t, w = 640, h = 380) {
  const P = {
    gen: ['robux-gen.exe', 'ROBUX GENERATOR', '100% REAL!!!', 'GENERATE', '#2E7BFF'],
    hat: ['WINNER!!!', 'YOU WON A FREE HAT!', 'click to claim', 'CLAIM', '#FF2DA0'],
    verify: ['Security Alert', 'VERIFY YOUR ACCOUNT', '', 'VERIFY', '#FF8A00'],
    free: ['FREE_ROBUX.exe', 'FREE ROBUX HERE', 'no scam 100%', 'GET', '#3BD16F'],
    click: ['!!!!!', 'CLICK ME!!!', 'you will not regret', 'CLICK', '#B06BFF'],
    dbl: ['DoubleBux', 'DOUBLE YOUR ROBUX', 'just log in :)', 'LOG IN', '#FF4D4D'],
  }[kind];
  const [title, big, sub, btn, col] = P;
  let o = S.rect(-w / 2, -h / 2, w, h, 22, ol('#FFFFFF', 8)) + S.rect(-w / 2, -h / 2, w, 70, 22, { fill: col }) + S.rect(-w / 2, -h / 2 + 40, w, 30, 0, { fill: col }) + S.path(`M${-w / 2} ${-h / 2 + 70} L${w / 2} ${-h / 2 + 70}`, ln(6));
  o += TF(title, -w / 2 + 30, -h / 2 + 48, 32, '#FFFFFF', { 'text-anchor': 'start' });
  o += S.rect(w / 2 - 62, -h / 2 + 14, 44, 44, 10, ol('#FF4D4D', 4)) + S.path(`M${w / 2 - 50} ${-h / 2 + 26} l20 20 m0 -20 l-20 20`, ln(6, '#FFFFFF'));
  o += T(big, 0, -h / 2 + 150, big.length > 16 ? 50 : 60, '#151515');
  if (kind === 'verify') {
    o += TF('username', -w / 2 + 60, 10, 28, '#6A6E80', { 'text-anchor': 'start' }) + S.rect(-60, -16, 280, 40, 8, ol('#F2F4FA', 4));
    o += TF('password', -w / 2 + 60, 64, 28, '#6A6E80', { 'text-anchor': 'start' }) + S.rect(-60, 38, 280, 40, 8, ol('#F2F4FA', 4));
  } else {
    if (sub) o += TF(sub, 0, -h / 2 + 200, 32, col);
    if (kind === 'hat') o += placeHat(hat('top', '#FF2DA0'), -w / 2 + 90, 40, 0.5, -10) + placeHat(hat('crown'), w / 2 - 90, 40, 0.5, 10);
    else o += K.coin(-w / 2 + 90, 30, 40, 0, t * 6) + K.coin(w / 2 - 90, 30, 40, 0, t * 6 + 1);
  }
  const pulse = 1 + 0.06 * Math.sin(t * 14);
  o += S.g(S.rect(-110, -32, 220, 64, 22, ol('#3BD16F', 6)) + T(btn, 0, 18, 40, '#FFFFFF'), `translate(0 ${h / 2 - 60}) scale(${f(pulse)})`);
  return o;
}
// k: 0..1 shatter progress; dir: main fly direction
function shards(k, w, h, col, seed = 1, dir = 1, power = 1) {
  if (k <= 0 || k >= 1) return '';
  let o = '';
  for (let i = 0; i < 16; i++) {
    const cx = (hash(i * 3 + seed) - 0.5) * w, cy = (hash(i * 7 + seed) - 0.5) * h;
    const a = Math.atan2(cy, cx) + (hash(i + seed) - 0.5) * 0.6;
    const v = (500 + 700 * hash(i * 5 + seed)) * power;
    const px = cx + Math.cos(a) * v * k + dir * 600 * k, py = cy + Math.sin(a) * v * k + 900 * k * k;
    const s = 50 + 50 * hash(i * 11 + seed);
    o += S.path(`M${f(px)} ${f(py - s)} L${f(px + s * 0.8)} ${f(py + s * 0.5)} L${f(px - s * 0.7)} ${f(py + s * 0.4)} Z`, { fill: i % 3 ? '#FFFFFF' : col, stroke: '#151515', 'stroke-width': 5, opacity: f(1 - k * k), transform: `rotate(${f(k * 400 * (i % 2 ? 1 : -1))} ${f(px)} ${f(py)})` });
  }
  return o;
}
const cursor = (s = 1) => S.g(S.path('M0 0 L0 120 L30 92 L52 140 L74 130 L52 84 L92 84 Z', ol('#FFFFFF', 9)), `scale(${f(s)})`);
function trashBin(lid = 0) {
  let o = S.path('M-120 -220 L120 -220 L100 0 L-100 0 Z', ol('#9AA0AE', 8));
  for (const x of [-60, 0, 60]) o += S.path(`M${x} -190 L${x * 0.85} -30`, ln(8, '#6A7080'));
  o += S.g(S.rect(-140, -250, 280, 34, 12, ol('#B8BEC9', 8)) + S.rect(-36, -276, 72, 30, 10, ol('#B8BEC9', 6)), `rotate(${f(-70 * lid)} -140 -230)`);
  return o;
}
function banHammer() {
  let o = S.rect(-34, -900, 68, 820, 14, ol('#8A5A34', 8)) + S.rect(-20, -880, 18, 780, 8, { fill: '#B07A48' });
  o += S.rect(-300, -120, 600, 240, 40, ol('#3A3F55', 10)) + S.rect(-310, -130, 80, 260, 20, ol('#2A2E40', 8)) + S.rect(230, -130, 80, 260, 20, ol('#2A2E40', 8));
  o += T('BAN', 0, 46, 150, '#FF4D4D', { stroke: '#151515', 'stroke-width': 12, 'paint-order': 'stroke' });
  return o;
}
function reportButton(press = 0, glow = 0) {
  let o = S.path('M-220 0 L-180 -200 L180 -200 L220 0 Z', ol('#4A4F66', 9)) + S.rect(-210, -20, 420, 30, 8, ol('#3A3F55', 7));
  o += S.rect(-150, -150, 300, 70, 14, ol('#FFFFFF', 6)) + T('REPORT', 0, -98, 60, '#E2233B');
  const dy = 70 * press;
  o += S.ellipse(0, -200, 190, 50, ol('#9A1020', 8));
  o += S.path(`M-180 -200 L-180 ${f(-260 + dy)} Q-180 ${f(-360 + dy * 1.4)} 0 ${f(-360 + dy * 1.4)} Q180 ${f(-360 + dy * 1.4)} 180 ${f(-260 + dy)} L180 -200 Z`, ol('#FF2D3D', 9));
  o += S.path(`M-110 ${f(-300 + dy)} Q-80 ${f(-336 + dy * 1.3)} -20 ${f(-340 + dy * 1.3)}`, ln(16, '#FFFFFF', 0.6));
  if (glow > 0) o = S.ellipse(0, -260, 360 * glow, 220 * glow, { fill: 'url(#s07red)' }) + o;
  return o;
}
function thoughtBubble(inner, k) {
  if (k <= 0) return '';
  let o = S.circle(-150, 170, 16, ol('#FFFFFF', 5)) + S.circle(-110, 120, 26, ol('#FFFFFF', 5));
  o += S.ellipse(0, 0, 220, 150, ol('#FFFFFF', 7)) + S.ellipse(-120, -60, 90, 80, ol('#FFFFFF', 7)) + S.ellipse(110, -70, 100, 80, ol('#FFFFFF', 7)) + S.ellipse(0, 0, 210, 140, { fill: '#FFFFFF' });
  o += inner;
  return S.g(o, `scale(${f(ease.outBack(clamp(k, 0, 1)))})`);
}

// ---------------------------------------------------------------- A: evening at the cottage; the scammer walks up the path
function shotArrive(t) {
  const cam = camKeys(t, [[START, { zoom: 1.0, x: 0, y: -40 }], [tB1, { zoom: 1.28, x: 60, y: 90 }]]);
  let w = eveningSky(t) + K.view(cam, S.g(bushy(0, 0, 1.4, '#3E8E50'), 'translate(150 890)') + S.g(bushy(0, 0, 1.2, '#3E8E50'), 'translate(1800 890)'), 0.7);
  let mid = cottage(t, 960, 880, 0.95, { lampOn: Math.floor(t * 9) % 7 === 0 && t < tProb ? 0 : 1 }) + garden(t);
  // scammer walks up the path (side view, facing right), stops at the door
  const u = seg(t, START + 0.3, tProb + 0.2);
  const sx = lerp(-150, 760, u);
  const walking = u > 0 && u < 1;
  const lit = t >= tProb;
  mid += scam(t, { x: sx, y: 960, s: 0.36, view: walking ? 'side' : 'front', flip: true, turn: 0.4, ...(walking ? A.walk(t * 7, 0.8) : { armL: 14, armR: 14 }), signOn: lit ? (Math.floor(t * 5) % 3 !== 0 ? 1 : 0) : 0 });
  let o = w + K.view(cam, mid, 1);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#1A0B3A', opacity: f(0.25 * (1 - seg(t, tProb, tProb + 0.3))) });
  if (lit) o += C.whiteFlash(0.5 * bump(t, tProb, tProb + 0.16));
  // ding-dong
  const kd = seg(t, tProb + 0.45, tProb + 0.6) * (1 - seg(t, tB1 - 0.1, tB1));
  if (kd > 0) o += K.view(cam, bang('DING-DONG!', 1160, 380, kd, 70, 6, '#FFE14D'), 1);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#05030C', opacity: f(1 - seg(t, START, START + 0.4)) });
  return o;
}

// ---------------------------------------------------------------- B/C: on the porch
function porchBack(t, cam, night = 0) {
  return eveningSky(t, night ? 's07late' : 's07eve') + K.view(cam, cottage(t, 960, 980, 2.2, { doorOpen: 1, night }) + S.rect(-1200, 1020, 4320, 400, 0, { fill: '#4FA05A' }), 1);
}
function shotDoor(t) {
  // B1: two-shot — the door opens, Grandma in the doorway; the scammer bows; FREE ROBUX! jazz hands, sign blazing
  const cam = camKeys(t, [[tB1, { zoom: 1.0, x: 0, y: 0 }], [tFree, { zoom: 1.08, x: -60, y: -10 }], [tB2, { zoom: 1.12, x: -80, y: -10 }]]);
  let o = porchBack(t, cam);
  const bow = bump(t, tB1 + 0.3, tMaam + 0.5);
  const free = t >= tFree;
  let mid = gma(t, 1080, 960, 0.6, { turn: -0.4, armL: 10, armR: 10, face: { name: 'happy', eyes: { look: [-0.7, 0] } } });
  mid += scam(t, { x: 640, y: 1000, s: 0.62, turn: 0.45, lean: 18 * bow, headRot: 10 * bow, armL: free ? 150 + 15 * Math.sin(t * 20) : 20 + 70 * bow, armR: free ? 150 - 15 * Math.sin(t * 20) : 10, signOn: free ? 1 : undefined }, { arms: false });
  o += K.view(cam, mid, 1);
  if (free) {
    const k = 1 - seg(t, tFree + 0.6, tB2);
    o += K.view(cam, rays(640, 300, 16, 900, '#FFE14D', 0.25 * k, t * 60) + K.sparkles([[420, 160, 40], [880, 200, 34], [560, 60, 26], [760, 420, 22]], t), 1);
  }
  o += flashAt(t, tB1, 0.5);
  return o;
}
function shotPitch(t) {
  // B2: low-angle close on the scammer: the clipboard comes out on "password"; "DOUBLE" — x2 burst of (fake) coins
  const cam = camKeys(t, [[tB2, { zoom: 1.0, x: 0, y: 0 }], [tDouble, { zoom: 1.1, x: 0, y: -20 }], [tDouble + 0.15, { zoom: 1.25, x: 60, y: -40 }], [tC1, { zoom: 1.28, x: 60, y: -40 }]]);
  let o = porchBack(t, { zoom: 1.7, x: -200, y: -140 });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#2A1040', opacity: 0.25 });
  const clip = ease.outBack(seg(t, tPw - 0.25, tPw + 0.1));
  const props = clip > 0 ? [{ svg: S.g(clipboard(), `translate(${f(lerp(380, 330, clip))} ${f(lerp(-300, -560, clip))}) rotate(-8) scale(${f(clip * 0.9)})`), layer: 'front' }] : [];
  let mid = scam(t, { x: 760, y: 1250, s: 0.9, turn: 0.2, armR: clip > 0 ? 110 : 30, armL: t > tDouble ? 150 : 25, props }, { arms: false, energy: 1.2 });
  o += K.view(cam, mid, 1);
  if (t >= tDouble) {
    const k = ease.outBack(seg(t, tDouble, tDouble + 0.25));
    o += K.view(cam, S.g(T('x2', 0, 0, 260, '#FFE14D', { stroke: '#151515', 'stroke-width': 22, 'paint-order': 'stroke' }) + K.F.sparkle(-160, -150, 40) + K.F.sparkle(170, -40, 30), `translate(1480 330) rotate(-10) scale(${f(k)})`), 1);
    o += K.coinBurst(1300, 700, t - tDouble, 24, 1100, 30, 8);
  }
  o += flashAt(t, tB2, 0.5);
  return o;
}
function shotOoh(t) {
  // C1: Grandma close, delighted — "Ooh, double!" — heart eyes, hearts popping
  const cam = camKeys(t, [[tC1, { zoom: 1.0, x: 0, y: 0 }], [tDbl2, { zoom: 1.1, x: 0, y: -20 }], [tC2, { zoom: 1.14, x: 0, y: -20 }]]);
  let o = porchBack(t, { zoom: 2.0, x: 250, y: -160 }) + S.rect(0, 0, 1920, 1080, 0, { fill: '#FFD9E8', opacity: 0.18 });
  const dbl = t >= tDbl2;
  let mid = gma(t, 960, 1520, 1.1, { turn: -0.15, armL: dbl ? -18 : 12, armR: dbl ? -18 : 12, face: dbl ? { name: 'love' } : { name: 'amazed' }, sy: 1 + 0.04 * bump(t, tDbl2, tDbl2 + 0.3) }, { arms: false, energy: 1.2 });
  o += K.view(cam, mid, 1);
  if (dbl) for (let i = 0; i < 8; i++) { const ph = ((t - tDbl2) * 0.9 + i / 8) % 1; o += S.path(K.F.heartPath(560 + hash(i) * 800 + Math.sin(t * 3 + i) * 30, 800 - ph * 700, 26 + 12 * hash(i * 3)), { fill: '#FF6FB5', stroke: '#151515', 'stroke-width': 4, opacity: f(1 - ph) }); }
  o += flashAt(t, tC1, 0.5);
  return o;
}
function shotWhisper(t) {
  // C2: two-shot, slow tense push-in — she leans in to whisper; his pen hovers… then starts writing "passw…"
  const cam = camKeys(t, [[tC2, { zoom: 1.0, x: 0, y: 20 }], [tPw2, { zoom: 1.4, x: -20, y: -60 }], [tD, { zoom: 1.55, x: -30, y: -70 }]]);
  let o = porchBack(t, { zoom: 1.2, x: 0, y: -60 });
  const lean = ease.inOut(seg(t, tC2 + 0.2, tPwA));
  const word = 'password';
  const n = t < tPw2 ? 0 : Math.min(word.length, Math.floor((t - tPw2) / 0.12) + 1);
  const cb = { svg: S.g(clipboard(word.slice(0, n)), 'translate(330 -430) rotate(-6) scale(0.95)') + S.g(pen(), `translate(${f(300 + n * 18)} ${f(-430 - 4 * Math.sin(t * 30))}) rotate(20)`), layer: 'front' };
  let mid = scam(t, { x: 640, y: 1040, s: 0.66, turn: 0.45, lean: 12 * lean, armR: 70, armL: 20, props: [cb] }, { arms: false, energy: 0.6 });
  mid += gma(t, 1180, 1000, 0.64, { turn: -0.45, lean: -16 * lean, armL: 10, armR: lean > 0.5 ? -40 : 12, face: { name: 'sneaky', mouth: undefined, eyes: { look: [-0.8, 0] } } }, { arms: false, energy: 0.6 });
  o += K.view(cam, mid, 1);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#vignette)', opacity: f(seg(t, tC2, tPw2)) });
  o += flashAt(t, tC2, 0.4);
  return o;
}

// ---------------------------------------------------------------- D/E: Ty bursts in
function shotBurst(t) {
  // D: Ty smashes through the hedge on his hoverboard — "GRANDMA, NO!" — the scammer leaps out of his coat
  const cam = camKeys(t, [[tD, { zoom: 1.0, x: -100, y: 0 }], [tNo, { zoom: 1.12, x: 0, y: 0 }], [tE1, { zoom: 1.15, x: 20, y: 0 }]]);
  const sh = K.shake(t, tD + 0.15, 0.45, 18); cam.sx = sh.sx; cam.sy = sh.sy;
  let o = porchBack(t, cam);
  const u = ease.out(seg(t, tD, tD + 0.45));
  const tx = lerp(-300, 380, u);
  let mid = '';
  const jump = bump(t, tNo - 0.1, tNo + 0.45);
  mid += gma(t, 1180, 1000, 0.64, { turn: -0.6, armL: 40, armR: 40, face: { name: 'shocked' } });
  mid += scam(t, { x: 760, y: 1040, s: 0.66, turn: -0.3, lift: 200 * jump, armL: 150, armR: 150, sy: 1 + 0.1 * jump, face: { name: 'scared' }, props: [] });
  mid += tyBoard(t, tx, 820, 0.62, { face: { name: 'angry', mouth: K.V.talking('TY', t) ? undefined : 'scream' }, armR: 100, armL: -60 });
  // leaves flying from the hedge
  for (let i = 0; i < 16; i++) {
    const k = t - tD - 0.1;
    if (k > 0 && k < 1.2) mid += S.ellipse(-100 + Math.cos(hash(i) * 6) * 600 * k + 300 * k, 760 + Math.sin(hash(i * 3) * 6) * 400 * k + 500 * k * k, 18, 10, { ...ol('#4CC46A', 3), transform: `rotate(${f(k * 500 + i * 30)} ${f(-100 + Math.cos(hash(i) * 6) * 600 * k + 300 * k)} ${f(760 + Math.sin(hash(i * 3) * 6) * 400 * k + 500 * k * k)})` });
  }
  o += K.view(cam, mid, 1);
  o += K.view(cam, C.speedLines(tx - 900, tx - 200, 640, 14, 3, '#FFFFFF', 300), 1);
  o += bang('CRASH!', 230, 760, seg(t, tD + 0.1, tD + 0.22) * (1 - seg(t, tNo + 0.3, tNo + 0.5)), 110, -10, '#FF9F1C');
  // the clipboard + pen go flying
  const k = t - tNo;
  if (k > 0) o += S.g(clipboard('pass'), `translate(${f(860 + 500 * k)} ${f(400 - 1500 * k + 1600 * k * k)}) rotate(${f(k * 600)}) scale(0.6)`);
  o += whip(1 - seg(t, tD, tD + 0.15), 1);
  return o;
}
function shotKnew(t) {
  // E1: "I KNEW that guy!" — Ty points; the scammer bolts off the porch (side view, sign still readable)
  const cam = camKeys(t, [[tE1, { zoom: 1.0, x: 0, y: 0 }], [tE2, { zoom: 1.08, x: 80, y: 0 }]]);
  let o = porchBack(t, { zoom: 1.4, x: 120, y: -40 });
  let mid = '';
  const run = seg(t, tE1 + 0.5, tE2);
  mid += gma(t, 1420, 1000, 0.62, { turn: -0.5, face: { name: 'confused' } });
  if (run <= 0) mid += scam(t, { x: 1150, y: 1030, s: 0.64, turn: -0.4, armL: 60, armR: 60, face: { name: 'scared' } });
  else mid += scam(t, { x: lerp(1150, 2300, ease.in(run)), y: 1030, s: 0.64, view: 'side', flip: true, ...A.run(t * 16), lean: 16 });
  mid += tyBoard(t, 520, 820, 0.62, { view: 'side', flip: true, armR: 95, armL: -40, face: { name: 'angry' } });
  o += K.view(cam, mid, 1);
  if (run > 0) o += C.speedLines(900, 1600, 620, 10, 6, '#FFFFFF', 300) + C.dust(1100, 1000, tE1 + 0.5, t);
  o += bang('ZOOM!', 1500, 320, seg(t, tE1 + 0.55, tE1 + 0.7) * (1 - seg(t, tE2 - 0.2, tE2)), 90, 8, '#5CF2FF');
  o += flashAt(t, tE1, 0.4);
  return o;
}
function chatWin(game, lines, t, col = '#2E7BFF') {
  let o = S.rect(-330, -170, 660, 340, 20, ol('#151A2E', 7)) + S.rect(-330, -170, 660, 56, 20, { fill: col }) + S.rect(-330, -134, 660, 20, 0, { fill: col });
  o += TF(game, -300, -130, 30, '#FFFFFF', { 'text-anchor': 'start' });
  lines.forEach(([who, msg, wc], i) => { o += TF(`[${who}]: ${msg}`, -300, -66 + i * 52, 30, wc || '#FFFFFF', { 'text-anchor': 'start' }); });
  return o;
}
function shotChats(t) {
  // E2: flashback — every game chat ever: [FreeRobux4U] FREE ROBUX!! — a window pops on each beat word, then a pile of them on "EVER"
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#1A1030' });
  for (let i = 0; i < 20; i++) o += S.rect((hash(i * 3) * 2200 - (t * 120) % 200) - 100, hash(i * 5) * 1080, 140, 140, 24, { fill: '#2A1E52' });
  const scamLine = ['FreeRobux4U', 'FREE ROBUX!! click my link', '#FFD21F'];
  const wins = [
    ['Mega Obby · chat', [['noob_123', 'how do i jump'], scamLine, ['luna', 'lol']], '#2E7BFF', 520, 280, -6],
    ['Pet Simulator · chat', [scamLine, ['petking', 'trade?'], scamLine], '#3BD16F', 1400, 300, 5],
    ['Tycoon World · chat', [['builder', 'nice base'], scamLine, ['x_x', 'blocked']], '#FF8A00', 600, 680, 4],
    ['Hide & Seek · chat', [scamLine, scamLine, ['kidd0', 'NOT AGAIN']], '#B06BFF', 1360, 700, -5],
    ['Racing 9000 · chat', [['zoom', 'gg'], scamLine, scamLine], '#FF4D4D', 960, 480, -2],
  ];
  wins.forEach(([g, ls, c, x, y, r], i) => {
    const k = seg(t, tHits[i], tHits[i] + 0.15);
    if (k > 0) o += S.g(chatWin(g, ls, t, c), `translate(${x} ${y}) rotate(${r}) scale(${f(ease.outBack(k) * 0.95)})`);
  });
  // "EVER" — dozens of tiny copies rain in
  if (t >= tHits[5]) {
    for (let i = 0; i < 24; i++) {
      const k = seg(t, tHits[5] + i * 0.02, tHits[5] + i * 0.02 + 0.15);
      if (k > 0) o += S.g(chatWin('chat', [scamLine], t, ['#2E7BFF', '#3BD16F', '#FF8A00', '#B06BFF', '#FF4D4D'][i % 5]), `translate(${f(hash(i * 3.3) * 1920)} ${f(hash(i * 7.1) * 900)}) rotate(${f((hash(i) - 0.5) * 30)}) scale(${f(0.42 * ease.outBack(k))})`);
    }
    o += K.view({ zoom: 1 }, stamp('EVERY. GAME. EVER.', 960, 520, seg(t, tHits[5] + 0.15, tHits[5] + 0.35), 100, '#FF4D4D', -8), 1);
  }
  o += whip(bump(t, tE2 - 0.08, tE2 + 0.1), 1);
  o += whip(bump(t, tF - 0.1, tF + 0.02), 1);
  return o;
}

// ---------------------------------------------------------------- the rooftop chase (one world; several camera angles)
const V = 1150;           // px/s
const T0 = tF;
const xS = (t) => 600 + V * (t - T0);                          // scammer
const gapTS = (t) => lerp(780, 560, seg(t, T0, tH));           // Ty is behind by this much
const xT = (t) => xS(t) - gapTS(t);
const ROOF_Y = 760;
const BLD = (() => {
  // buildings (rooftops) along the route: [x0, x1, colour, kind]
  const b = []; let x = -1200; let i = 0;
  while (x < 16000) { const w = 900 + hash(i * 3.1) * 700; b.push([x, x + w, ['#B0566A', '#6A5A9A', '#C27A4A', '#4A7A8A', '#8A4A7A'][i % 5], i]); x += w + 170; i++; }
  return b;
})();
const FENCES = BLD.filter((b, i) => i % 2 === 1).map((b) => b[0] + (b[1] - b[0]) * 0.55);
function liftAt(x) {
  // the scammer leaps over alley gaps and vaults the rooftop fences
  for (let i = 0; i < BLD.length - 1; i++) {
    const g0 = BLD[i][1] - 120, g1 = BLD[i + 1][0] + 120;
    if (x > g0 && x < g1) return Math.sin(((x - g0) / (g1 - g0)) * Math.PI) * 170;
  }
  for (const fx of FENCES) if (Math.abs(x - fx) < 200) return Math.cos(((x - fx) / 200) * Math.PI / 2) * 150;
  return 0;
}
function rooftops(t, x0, x1) {
  let o = '';
  for (const [b0, b1, col, i] of BLD) {
    if (b1 < x0 - 200 || b0 > x1 + 200) continue;
    o += S.rect(b0, ROOF_Y, b1 - b0, 900, 6, ol(col, 8));
    for (let r = 0; r < 3; r++) for (let c = 0; c < Math.floor((b1 - b0 - 80) / 190); c++) o += S.rect(b0 + 70 + c * 190, ROOF_Y + 90 + r * 160, 100, 110, 10, ol(hash(i * 7 + r * 3 + c) > 0.5 ? '#FFE7A0' : '#3A2E5A', 5));
    o += S.rect(b0 - 10, ROOF_Y - 30, b1 - b0 + 20, 40, 8, ol('#E8DCCF', 6));
    // rooftop clutter
    if (i % 3 === 0) o += S.rect(b0 + 120, ROOF_Y - 200, 110, 180, 8, ol('#8A4A3A', 6)) + S.rect(b0 + 110, ROOF_Y - 220, 130, 30, 6, ol('#6A3A2A', 5));
    if (i % 3 === 1) o += S.rect(b1 - 300, ROOF_Y - 150, 180, 130, 12, ol('#B8BEC9', 6)) + S.circle(b1 - 210, ROOF_Y - 85, 40, ol('#8A93A3', 5));
    if (i % 3 === 2) o += S.path(`M${b0 + 200} ${ROOF_Y - 30} L${b0 + 200} ${ROOF_Y - 260} M${b0 + 160} ${ROOF_Y - 220} L${b0 + 240} ${ROOF_Y - 220} M${b0 + 170} ${ROOF_Y - 180} L${b0 + 230} ${ROOF_Y - 180}`, ln(8, '#2A2A36'));
  }
  for (const fx of FENCES) {
    if (fx < x0 - 200 || fx > x1 + 200) continue;
    for (let k = -2; k <= 2; k++) o += S.path(`M${fx + k * 46 - 18} ${ROOF_Y - 30} L${fx + k * 46 - 18} ${ROOF_Y - 170} L${fx + k * 46} ${ROOF_Y - 196} L${fx + k * 46 + 18} ${ROOF_Y - 170} L${fx + k * 46 + 18} ${ROOF_Y - 30} Z`, ol('#C9945A', 5));
    o += S.rect(fx - 130, ROOF_Y - 140, 260, 20, 4, ol('#B07A48', 4));
  }
  return o;
}
function skyline(t, x0, x1, k) {
  let o = '';
  const base = 700;
  for (let i = Math.floor(x0 / 260) - 1; i < x1 / 260 + 1; i++) {
    const h = 200 + hash(i * 1.7) * 360, x = i * 260;
    o += S.rect(x, base - h, 220, h + 600, 6, { fill: k < 0.4 ? '#4A2E78' : '#5E3A86' });
    for (let r = 0; r < Math.floor(h / 70); r++) if (hash(i * 13 + r) > 0.55) o += S.rect(x + 40 + (r % 2) * 90, base - h + 30 + r * 70, 40, 34, 4, { fill: '#FFD98A', opacity: 0.8 });
  }
  return o;
}
function linkIcon(x, y, r) {
  return S.g(S.rect(-70, -26, 90, 52, 26, { fill: 'none', stroke: '#5CF2FF', 'stroke-width': 14 }) + S.rect(-20, -26, 90, 52, 26, { fill: 'none', stroke: '#2E7BFF', 'stroke-width': 14 }), `translate(${f(x)} ${f(y)}) rotate(${f(r)})`);
}
// pop-up traps: kind, spawn time, hit time, mode ('smash' | 'dodge' | 'kick')
const TRAPS = [
  ['gen', tG1 + 0.15, tReal1, 'smash'],
  ['verify', tG3 + 0.05, tAcct + 0.15, 'dodge'],
  ['free', tN[0] - 0.35, tN[0], 'kick'],
  ['click', tN[1] - 0.3, tN[1], 'kick'],
  ['dbl', tN[2] - 0.35, tN[2], 'kick'],
];
function trapWorld(t, tr, i) {
  const [kind, t0, t1, mode] = tr;
  if (t < t0) return '';
  const u = seg(t, t0, t1);
  const ty0 = xT(t);
  const px = ty0 + 120 + lerp(520, 0, ease.in(u));
  const py = 470 + (i % 2 ? -30 : 20);
  const s = 0.7 * ease.outBack(seg(t, t0, t0 + 0.2));
  const col = { gen: '#2E7BFF', verify: '#FF8A00', free: '#3BD16F', click: '#B06BFF', dbl: '#FF4D4D' }[kind];
  if (t < t1) return S.g(popup(kind, t), `translate(${f(px)} ${f(py)}) rotate(${f(i % 2 ? 4 : -4)}) scale(${f(s)})`);
  const k = seg(t, t1, t1 + 0.7);
  if (mode === 'dodge') {
    // he flips over it; it stays behind, then fizzles
    return k < 1 ? S.g(popup(kind, t), `translate(${f(xT(t1) + 120)} ${f(py)}) scale(${f(0.7 * (1 - k))})`) : '';
  }
  return S.g(shards(k, 640 * 0.7, 380 * 0.7, col, i * 7 + 3, 1, 1.1), `translate(${f(xT(t1) + 160 + 300 * k)} ${f(py)}) scale(${mode === 'kick' ? 0.7 : 1})`);
}
function chaseWorld(t, cam, opts = {}) {
  const cx = (cam.x || 0) + 960, span = 1100 / (cam.zoom || 1);
  let o = eveningSky(t, 's07late');
  o += K.view(cam, skyline(t, (cx - span) * 0.3 - 600, (cx + span) * 0.3 + 600, 0.3), 0.3);
  o += K.view(cam, S.g(skyline(t, (cx - span) * 0.6 - 600, (cx + span) * 0.6 + 600, 0.6), 'translate(0 140)'), 0.6);
  let mid = rooftops(t, cx - span, cx + span);
  // scammer: running, throwing links
  const sx = xS(t);
  if (!opts.noScam) {
    const lift = liftAt(sx);
    const ph = t * 15;
    mid += scam(t, { x: sx, y: ROOF_Y - 30, s: 0.42, view: 'side', flip: true, ...A.run(ph), lift, lean: 14, armL: (t * 3) % 1 < 0.3 ? -150 : A.run(ph).armL, shadow: lift < 30 }, { arms: false });
    for (let i = 0; i < 3; i++) { const age = (t * 1.1 + i / 3) % 1; if (age < 0.6) mid += S.g(linkIcon(0, 0, age * 500), `translate(${f(sx - 40 - age * 420)} ${f(ROOF_Y - 360 - Math.sin(age * Math.PI) * 120 + age * 260)}) scale(${f(0.55 * (1 - age))})`); }
  }
  // Ty on the hoverboard
  const tx = xT(t);
  if (!opts.noTy) {
    const flip = opts.flipT ? opts.flipT(t) : 0;
    mid += S.g(tyBoard(t, tx, ROOF_Y - 140 + (opts.tyDy ? opts.tyDy(t) : 0), 0.42, opts.tyPose ? opts.tyPose(t) : {}), flip ? `rotate(${f(flip)} ${f(tx)} ${f(ROOF_Y - 300)})` : '');
    mid += C.speedLines(tx - 900, tx - 250, ROOF_Y - 260, 10, Math.floor(t * 12), '#FFFFFF', 260);
  }
  TRAPS.forEach((tr, i) => { mid += trapWorld(t, tr, i); });
  o += K.view(cam, mid, 1);
  return o;
}
const followCam = (t, zoom = 1, dx = 280, dy = -60) => ({ zoom, x: (xT(t) + xS(t)) / 2 - 960 + dx - 200, y: dy + Math.sin(t * 2.4) * 10 });
function shotRooftop(t) {
  // F: tracking side shot, wide — "Free Robux! Free Robux! Click my link!"
  const cam = followCam(t, lerp(0.85, 0.95, seg(t, tF, tG1)), 200, -80);
  let o = chaseWorld(t, cam);
  // FREE ROBUX shout bubbles
  const sx = xS(t) - cam.x - 960;
  for (const [tw, txt] of [[l5.a, 'FREE ROBUX!'], [l5.word('Free', 1).t0, 'FREE ROBUX!'], [tClick, 'CLICK MY LINK!']]) {
    const k = seg(t, tw, tw + 0.12) * (1 - seg(t, tw + 0.7, tw + 0.8));
    if (k > 0) o += K.view(cam, bubble(txt, xS(t) + 60, ROOF_Y - 520, k, 48, '#151515', '#FFE14D', 4), 1);
  }
  o += flashAt(t, tF, 0.4);
  return o;
}
function shotTrapSide(t, which) {
  // G1 / G3 / G4: closer tracking on Ty as the traps pop
  const z = which === 'g4' ? 1.25 : 1.1;
  const cam = followCam(t, z, which === 'g4' ? -40 : 60, which === 'g4' ? -150 : -110);
  const opts = {};
  if (which === 'g3') {
    const tr = TRAPS[1];
    opts.flipT = (tt) => -360 * ease.inOut(seg(tt, tr[2] - 0.3, tr[2] + 0.25));
    opts.tyDy = (tt) => -200 * bump(tt, tr[2] - 0.35, tr[2] + 0.3);
    opts.tyPose = (tt) => ({ face: { name: tt > tr[2] - 0.3 && tt < tr[2] + 0.3 ? 'excited' : 'determined' } });
  }
  if (which === 'g4') {
    opts.tyPose = (tt) => {
      const kick = Math.max(...tN.map((tn) => bump(tt, tn - 0.12, tn + 0.18)));
      return { legR: -24 - 70 * kick, kneeR: 34 - 30 * kick, armR: 60 + 60 * kick, face: { name: 'angry' } };
    };
  }
  if (which === 'g1') opts.tyPose = (tt) => ({ armR: tt > tReal1 - 0.2 ? 150 : 60, face: { name: tt > tReal1 - 0.2 ? 'angry' : 'determined' } });
  let o = chaseWorld(t, cam, opts);
  if (which === 'g1') o += bang('SMASH!', 1300, 300, seg(t, tReal1, tReal1 + 0.12) * (1 - seg(t, tReal1 + 0.4, tReal1 + 0.5)), 100, 8, '#5CF2FF');
  if (which === 'g3') o += bang('NOPE.', 1250, 260, seg(t, tAcct + 0.1, tAcct + 0.22), 90, -6, '#FFFFFF');
  if (which === 'g4') {
    tN.forEach((tn, i) => { o += stamp(i === 2 ? 'NOPE!!' : 'NOPE!', [1240, 760, 1100][i], [260, 220, 280][i], seg(t, tn, tn + 0.14) * (1 - seg(t, tn + 0.38, tn + 0.45) * (i < 2 ? 1 : 0)), i === 2 ? 170 : 120, '#FF4D4D', [-10, 8, -6][i]); });
    o += C.whiteFlash(Math.max(...tN.map((tn) => 0.35 * bump(t, tn - 0.03, tn + 0.08))));
  }
  return o;
}
function shotTrapFront(t) {
  // G2: head-on — Ty rockets toward the lens; "YOU WON A FREE HAT!" pops in between — he blasts through, shards fly at us
  let o = eveningSky(t, 's07late');
  // radial streaks (we're flying)
  for (let i = 0; i < 30; i++) {
    const a = hash(i * 3) * Math.PI * 2, ph = (t * 1.6 + hash(i)) % 1;
    const r0 = 80 + ph * 900, r1 = r0 + 120 + ph * 300;
    o += S.path(`M${f(960 + Math.cos(a) * r0)} ${f(520 + Math.sin(a) * r0)} L${f(960 + Math.cos(a) * r1)} ${f(520 + Math.sin(a) * r1)}`, ln(6 + ph * 8, '#FFFFFF', 0.55 * ph));
  }
  // rooftops rushing below
  for (let i = 0; i < 6; i++) { const ph = (t * 1.4 + i / 6) % 1; const y = 760 + ph * ph * 500; o += S.rect(960 - (300 + ph * 1600), y, 2 * (300 + ph * 1600), 40 + ph * 40, 6, { fill: ['#B0566A', '#6A5A9A', '#C27A4A'][i % 3], stroke: '#151515', 'stroke-width': 4 }); }
  const app = ease.in(seg(t, tG2, tHatW));
  const ts = lerp(0.4, 0.75, app);
  const bob = Math.sin(t * 9) * 8;
  let tyS = S.g(S.ellipse(0, 40, 230, 30, { fill: '#5CF2FF', opacity: 0.4 }) + S.ellipse(0, 0, 240, 46, ol('#FFC93C', 8)) + S.ellipse(0, -8, 180, 18, { fill: '#FFF1B0', opacity: 0.8 }), `translate(960 ${f(900 + bob)}) scale(${f(ts / 0.6)})`);
  tyS += ty(t, 960, 890 + bob, ts, { armL: 120, armR: t > tHatW - 0.15 ? 165 : 120, lean: 0, face: { name: t > tHatW - 0.15 ? 'angry' : 'determined' } }, { arms: false });
  const hit = t >= tHatW;
  const kpop = ease.outBack(seg(t, tG2 + 0.05, tG2 + 0.25));
  if (!hit) {
    o += tyS;
    o += S.g(popup('hat', t), `translate(960 430) scale(${f(kpop * lerp(0.9, 1.15, app))}) rotate(-3)`);
  } else {
    const k = seg(t, tHatW, tHatW + 0.6);
    o += tyS;
    o += S.g(shards(k, 700, 420, '#FF2DA0', 21, 0, 2.2), `translate(960 430) scale(${f(1 + 1.5 * k)})`);
    o += bang('CRASH!', 960, 260, seg(t, tHatW, tHatW + 0.1), 120, -6, '#FF2DA0');
  }
  o += flashAt(t, tG2, 0.5) + C.whiteFlash(0.4 * bump(t, tHatW - 0.02, tHatW + 0.1));
  return o;
}

// ---------------------------------------------------------------- H/I/J: cornered — REPORT — BANNED — dragged to the bin
function edgeScene(t, cam, o2 = {}) {
  let o = eveningSky(t, 's07late') + K.view(cam, skyline(t, -800, 3000, 0.3), 0.3) + K.view(cam, S.g(skyline(t, -800, 3000, 0.6), 'translate(0 140)'), 0.6);
  let m = S.rect(-800, ROOF_Y, 2560, 900, 6, ol('#6A5A9A', 8)) + S.rect(-810, ROOF_Y - 30, 2580, 40, 8, ol('#E8DCCF', 6));
  for (let c = 0; c < 12; c++) m += S.rect(-700 + c * 200, ROOF_Y + 90, 100, 110, 10, ol(hash(c) > 0.5 ? '#FFE7A0' : '#3A2E5A', 5));
  m += S.rect(1300, ROOF_Y - 200, 110, 180, 8, ol('#8A4A3A', 6)) + S.rect(1290, ROOF_Y - 220, 130, 30, 6, ol('#6A3A2A', 5));
  // the drop: a much lower roof far below, a warning stripe on the edge
  let far = S.rect(1900, ROOF_Y + 300, 900, 900, 6, ol('#3A2E5A', 6)) + S.rect(1890, ROOF_Y + 280, 920, 30, 6, ol('#8A80A8', 5));
  for (let i = 0; i < 4; i++) far += S.rect(1960 + i * 200, ROOF_Y + 380, 60, 70, 8, { fill: '#FFE7A0', opacity: 0.6 });
  m = far + m;
  for (let i = 0; i < 6; i++) m += S.rect(1640 + i * 20, ROOF_Y - 30, 10, 40, 0, { fill: i % 2 ? '#151515' : '#FFD21F' });
  for (let i = 0; i < 4; i++) { const ph = (t * 1.2 + i / 4) % 1; m += S.rect(1770 + i * 14, ROOF_Y + ph * 500, 14, 14, 3, ol('#9AA0AE', 3)); }
  return o + K.view(cam, m, 1);
}
const EDGE_X = 1760;
function shotCornered(t) {
  // H: the scammer skids to the roof edge (windmilling), Ty glides down and steps off the board; the REPORT button rises on "then"
  const cam = camKeys(t, [[tH, { zoom: 1.0, x: 120, y: -40 }], [tThen - 0.1, { zoom: 1.05, x: 60, y: -40 }], [tThen + 0.2, { zoom: 0.95, x: 20, y: -80 }], [tRealC, { zoom: 0.98, x: 20, y: -80 }], [tRealC + 0.25, { zoom: 1.05, x: 40, y: -180 }], [tI, { zoom: 1.06, x: 40, y: -190 }]]);
  const sh = K.shake(t, tThen, 0.5, 10); cam.sx = sh.sx; cam.sy = sh.sy;
  let o = edgeScene(t, cam);
  let mid = '';
  const skid = ease.out(seg(t, tH, tH + 0.5));
  const sxp = lerp(1100, 1640, skid);
  const wind = t > tH + 0.4 && t < tThen ? Math.sin(t * 18) : 0;
  mid += scam(t, { x: sxp, y: ROOF_Y - 30, s: 0.42, view: t < tH + 0.5 ? 'side' : 'front', flip: true, turn: -0.5, armL: 90 + 70 * wind, armR: 90 - 70 * wind, lean: -10 * Math.abs(wind), face: { name: 'scared' } });
  if (t < tH + 0.5) mid += C.dust(sxp - 100, ROOF_Y - 40, tH + 0.1, t);
  // Ty
  const land = seg(t, tH, tH + 0.8);
  const hop = seg(t, tH + 0.8, tH + 1.1);                 // Ty hops off the parked board
  const leap = seg(t, tRealC - 0.15, tI);
  if (land < 1) mid += tyBoard(t, lerp(-200, 360, ease.out(land)), lerp(400, ROOF_Y - 21, ease.out(land)), 0.42);
  else {
    mid += hoverboard(360, ROOF_Y - 10, 0.84, t);
    const ly = -Math.sin(Math.min(1, leap * 1.2) * Math.PI * 0.6) * 340 * (leap > 0 ? 1 : 0) - Math.sin(hop * Math.PI) * 90 + 9 * (1 - hop);
    const tx = hop < 1 ? lerp(370, 520, ease.inOut(hop)) : lerp(520, 830, ease.out(leap));
    mid += ty(t, tx, ROOF_Y - 30 + ly, lerp(0.42, 0.44, hop), { turn: 0.4, armR: leap > 0 ? 170 : 40, armL: leap > 0 ? 150 : 20, legL: leap > 0 ? 30 : 0, kneeL: leap > 0 ? 60 : undefined, face: { name: 'determined' } }, { arms: leap > 0 ? false : undefined, energy: 1.2 });
  }
  // the REPORT button rises out of the roof
  const ku = seg(t, tThen - 0.05, tThen + 0.45), up = ease.outBack(ku);
  if (ku > 0) { const cid = S.uid('rb'); mid += S.clipDef(cid, S.rect(-2000, -3000, 6000, 3000 + ROOF_Y - 8)) + S.g(S.g(reportButton(0, up * (0.6 + 0.4 * Math.sin(t * 8))), `translate(1100 ${f(ROOF_Y - 20 + (1 - up) * 400)}) scale(0.85)`), null, { 'clip-path': `url(#${cid})` }); }
  o += K.view(cam, mid, 1);
  if (ku > 0) o += K.view(cam, bang('KA-CHUNK!', 1100, 220, seg(t, tThen, tThen + 0.12) * (1 - seg(t, tThen + 0.7, tThen + 0.85)), 70, 6, '#FFE14D'), 1);
  o += flashAt(t, tH, 0.5);
  return o;
}
function shotReport(t) {
  // I: SLAM — the button squashes, a shockwave, "USER REPORTED" toast — then the ban hammer drops on "BANNED"
  const ham = t >= tI2;
  const cam = ham ? camKeys(t, [[tI2, { zoom: 1.15, x: 640, y: -230 }], [tBan, { zoom: 1.15, x: 650, y: -200 }], [tBan + 0.1, { zoom: 1.35, x: 680, y: -80 }], [tJ, { zoom: 1.38, x: 680, y: -80 }]])
    : camKeys(t, [[tI, { zoom: 1.35, x: 140, y: -60 }], [tRep, { zoom: 1.2, x: 140, y: -40 }], [tI2, { zoom: 1.15, x: 160, y: -40 }]]);
  const sh = K.shake(t, ham ? tBan + 0.05 : tI + 0.1, ham ? 0.8 : 0.5, ham ? 30 : 18); cam.sx = sh.sx; cam.sy = sh.sy;
  let o = edgeScene(t, cam);
  let mid = '';
  const slam = t >= tI + 0.1;
  const press = slam ? 1 - 0.6 * seg(t, tI + 0.4, tI + 0.8) : seg(t, tI, tI + 0.1);
  mid += S.g(reportButton(press, 1), `translate(1100 ${ROOF_Y - 20}) scale(0.85)`);
  // Ty on the button
  const tyY = ROOF_Y - 20 - 0.85 * (360 - 70 * press * 1.4) + (slam ? 0 : -200 * (1 - seg(t, tI, tI + 0.1)));
  mid += ty(t, 1100, tyY, 0.4, { armR: slam ? 60 : 170, armL: slam ? 60 : 150, sy: slam ? 1 - 0.15 * bump(t, tI + 0.1, tI + 0.4) : 1.05, face: { name: slam ? 'determined' : 'angry' } }, { arms: false });
  // shockwave ring
  const sk = seg(t, tI + 0.1, tI + 0.7);
  if (sk > 0 && sk < 1) mid += S.ellipse(1100, ROOF_Y - 40, 100 + 900 * sk, 30 + 200 * sk, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 18 * (1 - sk), opacity: f(1 - sk) });
  // the scammer at the edge, then the hammer
  const bonk = t >= tBan;
  const sq = bonk ? lerp(1, 0.35, ease.out(seg(t, tBan, tBan + 0.12))) : 1;
  mid += scam(t, { x: 1640, y: ROOF_Y - 30, s: 0.42, turn: -0.5, sy: sq, sx: 1 + (1 - sq) * 0.8, armL: bonk ? 90 : 60, armR: bonk ? 90 : 60, face: { name: 'scared' }, signOn: bonk ? 0 : undefined });
  if (ham) {
    const fall = ease.in(seg(t, tI2, tBan));
    const hy = lerp(-190, ROOF_Y - 30 - 0.42 * 1.08 * 1000 * sq - 110, fall);
    if (!bonk) mid += S.ellipse(1640, ROOF_Y - 30, 120 + 120 * fall, 20 + 14 * fall, { fill: '#000', opacity: f(0.15 + 0.3 * fall) }) + K.F.markText('!', 1760, ROOF_Y - 520, 110, 10, '#FFD21F');
    mid += S.g(banHammer(), `translate(1640 ${f(hy)}) rotate(${f(lerp(-30, 0, fall))}) scale(0.7)`);
    if (bonk) {
      for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; mid += K.F.sparkle(1640 + Math.cos(a) * 160, ROOF_Y - 260 + Math.sin(a) * 40, 26, '#FFE14D'); }
      mid += C.dust(1500, ROOF_Y - 40, tBan, t) + C.dust(1700, ROOF_Y - 40, tBan, t);
    }
  }
  o += K.view(cam, mid, 1);
  // UI: reported toast + BANNED stamp
  const kT = seg(t, tRep - 0.1, tRep + 0.2);
  if (kT > 0) {
    let b = S.rect(-400, -70, 800, 140, 30, ol('#1F2233', 8)) + S.circle(-320, 0, 44, ol('#3BD16F', 6)) + S.path('M-342 0 L-326 18 L-296 -18', ln(10, '#FFFFFF')) + T('USER REPORTED', 40, 22, 66, '#7CF7FF');
    o += S.g(b, `translate(${ham ? 560 : 960} ${f(lerp(-120, 110, ease.outBack(kT)))}) scale(${ham ? 0.8 : 1})`);
  }
  if (bonk) {
    o += stamp('BANNED', 960, 560, seg(t, tBan + 0.08, tBan + 0.28), 220, '#FF2D3D', -12);
    o += C.whiteFlash(0.7 * bump(t, tBan - 0.02, tBan + 0.12));
  } else if (slam) o += C.whiteFlash(0.5 * bump(t, tI + 0.08, tI + 0.2));
  o += bang('SLAM!', 700, 300, seg(t, tI + 0.1, tI + 0.2) * (1 - seg(t, tI + 0.6, tI + 0.7)), 110, -8, '#FF4D4D');
  return o;
}
function shotDrag(t) {
  // J: a giant cursor grabs him by the sign and drags him (flailing) across the screen into the recycle bin
  let o = edgeScene(t, { zoom: 1.0, x: 300, y: -40 });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#1A1030', opacity: 0.25 });
  const grab = seg(t, tJ, tJ + 0.35);
  const drag = ease.inOut(seg(t, tJ + 0.35, tLink + 0.25));
  const drop = seg(t, tLink + 0.25, tLink + 0.6);
  const hx = lerp(480, 1560, drag), hy = lerp(470, 430, drag) - Math.sin(drag * Math.PI) * 90 + drop * 380;
  // the bin
  const lid = t < tLink - 0.2 || t > tLink + 1.0 ? 0 : (t < tLink + 0.6 ? seg(t, tLink - 0.2, tLink + 0.1) : 1 - seg(t, tLink + 0.6, tLink + 0.8));
  o += S.g(trashBin(lid), 'translate(1560 900) scale(1.1)');
  // the scammer dangling from the cursor by his sign
  const swing = Math.sin(t * 9) * 18 * (drag > 0 && drag < 1 ? 1 : 0.3);
  if (drop < 1) {
    const sc = scam(t, { x: 0, y: 0, s: 0.4, armL: 140 + 30 * Math.sin(t * 20), armR: 140 - 30 * Math.sin(t * 20), legL: 30 * Math.sin(t * 16), legR: -30 * Math.sin(t * 16), kneeL: 20, kneeR: 20, face: { name: 'scared' }, shadow: false, sy: 1 + 0.08 * Math.sin(t * 8) });
    o += S.g(sc, `translate(${f(hx)} ${f(hy + 0.4 * 1.08 * 800)}) rotate(${f(swing)} 0 ${f(-0.4 * 1.08 * 800)})`);
  }
  o += S.g(cursor(1.6), `translate(${f(hx - 30)} ${f(hy - 60 + (grab < 1 ? (1 - ease.out(grab)) * -500 : 0))})`);
  if (drop >= 1) o += bang('*clunk*', 1300, 600, seg(t, tLink + 0.6, tLink + 0.7), 60, 6, '#FFFFFF');
  if (t > tLink + 0.6) o += S.g(S.rect(-170, -40, 340, 80, 20, { fill: '#000', opacity: 0.55 }) + TF('Recycle Bin (1)', 0, 14, 36, '#FFFFFF'), 'translate(1560 500)');
  o += flashAt(t, tJ, 0.4);
  return o;
}

// ---------------------------------------------------------------- K–N: back on the porch
function shotSheepish(t) {
  // K: Grandma, sheepish, fiddles with her headset — "I just wanted a cool hat…" — a thought bubble with the dream hat
  const cam = camKeys(t, [[tK, { zoom: 1.0, x: 0, y: 0 }], [tL, { zoom: 1.12, x: 80, y: -30 }]]);
  let o = porchBack(t, cam, 1);
  let mid = '';
  mid += gma(t, 1180, 1000, 0.66, { turn: -0.35, armR: 175 + 5 * Math.sin(t * 3), armL: 10, headRot: -6, face: { name: 'nervous', eyes: { look: [-0.5, 0.4] }, fx: ['blush', 'sweat'] } }, { arms: false, energy: 0.6 });
  mid += ty(t, 640, 1020, 0.6, { turn: 0.5, armL: 10, armR: 10, face: { name: 'deadpan', eyes: { look: [0.7, 0] } }, props: [{ svg: S.g(hoverboard(0, 0, 0.5, t), 'translate(-170 -330) rotate(80)'), layer: 'back' }] }, { arms: false });
  o += K.view(cam, mid, 1);
  const kb = seg(t, tCool - 0.1, tCool + 0.2);
  o += K.view(cam, S.g(thoughtBubble(placeHat(hat('top', '#FF6FB5', '#FFE14D'), -20, 70, 0.9, -8) + K.F.sparkle(90, -60, 26) + K.F.sparkle(-120, -40, 18), kb), 'translate(1480 260)'), 1);
  o += flashAt(t, tK, 0.5);
  return o;
}
function shotNever(t) {
  // L: Ty close — "Grandma." then each word slams: NEVER. SHARE. YOUR PASSWORD. (camera punches in on each)
  const words = [[tNever, 'NEVER.', '#FF4D4D'], [tShare, 'SHARE.', '#FFD21F'], [tYour, 'YOUR PASSWORD.', '#5CF2FF']];
  let idx = -1; words.forEach(([tw], i) => { if (t >= tw - 0.04) idx = i; });
  const z = idx < 0 ? lerp(1.0, 1.06, seg(t, tL, tNever)) : 1.1 + idx * 0.14 + 0.06 * (1 - ease.out(seg(t, words[idx][0] - 0.04, words[idx][0] + 0.15)));
  const cam = { zoom: z, x: 0, y: -40 - idx * 10 };
  let o = porchBack(t, { zoom: 2.4, x: -400, y: -200 }, 1);
  if (idx >= 0) o += S.rect(0, 0, 1920, 1080, 0, { fill: words[idx][2], opacity: 0.3 }) + rays(960, 420, 18, 1500, '#FFFFFF', 0.12, t * 20);
  o += K.view(cam, ty(t, 960, 1240, 1.02, { turn: 0.1, armR: idx >= 0 ? 95 : 20, armL: 14, face: { name: 'determined', eyes: { look: [0.3, 0] } } }, { arms: false, energy: 0.8 }), 1);
  if (idx >= 0) {
    const [tw, txt, col] = words[idx];
    const k = seg(t, tw - 0.04, tw + 0.12);
    o += S.g(T(txt, 0, 0, txt.length > 8 ? 120 : 170, col, { stroke: '#151515', 'stroke-width': 20, 'paint-order': 'stroke' }), `translate(${idx === 2 ? 960 : idx === 0 ? 560 : 1380} ${idx === 2 ? 210 : 240}) rotate(${[-8, 7, -4][idx]}) scale(${f(lerp(2.2, 1, ease.out(k)))})`, { opacity: f(clamp(k * 3, 0, 1)) });
    o += C.whiteFlash(0.3 * bump(t, tw - 0.05, tw + 0.08));
  }
  o += flashAt(t, tL, 0.4);
  return o;
}
function stickyNote(txt) {
  return S.rect(-150, -130, 300, 260, 10, ol('#FFE66B', 7)) + S.rect(-150, -130, 300, 40, 0, { fill: '#FFD93B' }) +
    S.el('text', { x: 0, y: 30, 'font-family': 'Fredoka, sans-serif', 'font-weight': 600, 'font-size': 52, fill: '#2B6CE0', 'text-anchor': 'middle', transform: 'rotate(-4)' }, txt) + S.path('M-90 70 Q0 90 90 64', ln(5, '#2B6CE0'));
}
function shotPassword2(t) {
  // M: "Okay, sweetie." nod — then proudly: "It's 'password two' now." — she holds up a sticky note: password2
  const note = t >= tIts - 0.1;
  const cam = note ? camKeys(t, [[tIts - 0.1, { zoom: 1.12, x: 100, y: -50 }], [tPw2b, { zoom: 1.15, x: 120, y: -60 }], [tPw2b + 0.12, { zoom: 1.28, x: 150, y: -90 }], [tN0, { zoom: 1.3, x: 150, y: -90 }]])
    : camKeys(t, [[tM, { zoom: 1.0, x: 0, y: 0 }], [tIts, { zoom: 1.08, x: 60, y: -20 }]]);
  let o = porchBack(t, cam, 1);
  const nod = Math.max(0, Math.sin((t - l12.a) * 9)) * (t < l12.word('sweetie').t1 + 0.2 ? 1 : 0);
  const lift = ease.outBack(seg(t, tPw2b - 0.3, tPw2b));
  const [hx, hy] = A.hand(150, 1);
  const props = lift > 0 ? [{ svg: S.g(stickyNote('password2'), `translate(${f(hx + 80)} ${f(hy - 120)}) rotate(${f(6 - 4 * Math.sin(t * 3))}) scale(${f(lift * 0.9)})`), layer: 'front' }] : [];
  let mid = '';
  mid += gma(t, 1180, 1000, 0.66, { turn: -0.3, armR: lift > 0 ? lerp(10, 150, lift) : 10, armL: 10, headRot: 8 * nod, headY: 14 * nod, face: lift > 0 ? { name: 'happy', fx: ['sparkles'] } : { name: 'happy', eyes: { type: 'closed' } }, props }, { arms: false, energy: 0.8 });
  const fallen = t >= tPw2b + 0.2;
  mid += ty(t, 640, 1020, 0.6, { turn: 0.5, armL: 10, armR: 10, face: fallen ? { name: 'deadpan', eyes: { upper: 0.6, look: [0.7, -0.2] } } : { name: 'happy', eyes: { look: [0.7, 0] } }, props: [{ svg: S.g(hoverboard(0, 0, 0.5, t), 'translate(-170 -330) rotate(80)'), layer: 'back' }] }, { arms: false });
  o += K.view(cam, mid, 1);
  if (lift > 0) o += K.view(cam, K.sparkles([[1520, 200, 30], [1700, 330, 22]], t), 1);
  o += flashAt(t, tM, 0.4);
  return o;
}
function shotFacepalm(t) {
  // N: "…Grandma." — Ty facepalms, slow push-in, sweatdrop
  const cam = camKeys(t, [[tN0, { zoom: 1.0, x: 0, y: -60 }], [END, { zoom: 1.18, x: 0, y: -100 }]]);
  let o = porchBack(t, { zoom: 2.0, x: -300, y: -200 }, 1);
  const palm = ease.out(seg(t, tN0 + 0.05, tN0 + 0.35));
  const slap = bump(t, tN0 + 0.3, tN0 + 0.45);
  o += K.view(cam, ty(t, 960, 1220, 0.95, { turn: 0.1, armR: lerp(20, -156, palm), armL: 10, headRot: -6 * palm + 4 * slap, face: { name: 'deadpan', eyes: { type: 'closed' }, fx: ['sweat'] } }, { arms: false, energy: 0.2 }), 1);
  o += bang('*slap*', 1360, 300, seg(t, tN0 + 0.35, tN0 + 0.45) * (1 - seg(t, tN0 + 1.0, tN0 + 1.2)), 70, 8, '#FFFFFF');
  o += flashAt(t, tN0, 0.4);
  return o;
}

// ---------------------------------------------------------------- router
function scene(t) {
  if (t < tB1) return shotArrive(t);
  if (t < tB2) return shotDoor(t);
  if (t < tC1) return shotPitch(t);
  if (t < tC2) return shotOoh(t);
  if (t < tD) return shotWhisper(t);
  if (t < tE1) return shotBurst(t);
  if (t < tE2) return shotKnew(t);
  if (t < tF) return shotChats(t);
  if (t < tG1) return shotRooftop(t);
  if (t < tG2) return shotTrapSide(t, 'g1');
  if (t < tG3) return shotTrapFront(t);
  if (t < tG4) return shotTrapSide(t, 'g3');
  if (t < tH) return shotTrapSide(t, 'g4');
  if (t < tI) return shotCornered(t);
  if (t < tJ) return shotReport(t);
  if (t < tK) return shotDrag(t);
  if (t < tL) return shotSheepish(t);
  if (t < tM) return shotNever(t);
  if (t < tN0) return shotPassword2(t);
  return shotFacepalm(t);
}
const look = (t) => (t < tB1 ? { grade: 'night', vignette: 1 } : { grade: 'warm', vignette: 0.9 });

module.exports = { scene, look, DEFS, START, END };
