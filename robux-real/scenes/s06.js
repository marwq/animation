// SC 06 · MIA'S HAT EMPIRE — the Sparkle Time Fedora → the street becomes a hat exchange → hat mountain through the roof →
// "TWO-millionaire" → split-screen rivalry (hoverboard/helicopter, mansion/taller mansion) → Mia buys the moon → 30% snaps a third off.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor, coin, coinBurst, rays, bang } = K;
const { L } = K.V;
const C = K.C;
const A = require('./acting');
const E6 = require('./s06_env');
const { hat, randHat, placeHat, sparkleFedora, hatMound, hoverboard, tyHouse, bushy, tree, whip, flashAt, traders, bubble, stamp } = E6;
const S01 = require('./s01');

const l0 = L('06.0'), l1 = L('06.1'), l2 = L('06.2'), l3 = L('06.3'), l4 = L('06.4'), l5 = L('06.5'), l6 = L('06.6'), l7 = L('06.7'), l8 = L('06.8');
const START = K.V.scene('SC 06').start, END = K.V.scene('SC 06b').start;
// beats (all from the voice)
const tWait = l0.a, tFind = l0.word('Sparkle').t0 - 0.18, tTime = l0.word('Time').t0, tFedora = l0.word('Fedora').t0;
const tLim = l0.word('LIMITED').t0 - 0.06, tEd = l0.word('edition').t0;
const tEx = l1.a - 0.06, tVal = l1.word('valuable').t0, tEarth = l1.word('Earth').t0, tAnd = l1.word('And').t0 - 0.06, tLot = l1.word('LOT').t0;
const tBroke = l2.a - 0.3, tTy = l3.a - 0.08, tMil = l3.word('MILLIONAIRE').t0;
const tTwo0 = l4.a - 0.05, tTwo = l4.word('TWO-millionaire').t0;
const tSplit = l5.a - 0.05, tHover = l5.word('hoverboard').t0, tHeli = l5.word('helicopter').t0, tMan1 = l5.word('mansion').t0, tMan2 = l5.word('mansion', 1).t0;
const tOne = l5.word('One').t0 - 0.06, tTaller = l5.word('taller').t0;
const tMoon0 = l6.a - 0.08, tMoonW = l6.word('moon').t0;
const tCant = l7.a - 0.04, tBuy = l7.word('BUY').t0;
const tSys = l8.a - 0.04, tThirty = l8.word('Thirty').t0, tPct = l8.word('percent').t0, tFee = l8.word('fee').t0;

// ---------------------------------------------------------------- static art
const DEFS = `<defs>${E6.DEFS}
<pattern id="s06wall" patternUnits="userSpaceOnUse" width="120" height="120"><rect width="120" height="120" fill="#CDB8F4"/><path d="M30 22 l8 10 l-8 10 l-8 -10 Z" fill="#E3D6FF"/><path d="M90 82 l8 10 l-8 10 l-8 -10 Z" fill="#E3D6FF"/><circle cx="90" cy="30" r="5" fill="#B9A0EA"/><circle cx="30" cy="90" r="5" fill="#B9A0EA"/></pattern>
<linearGradient id="s06day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5FBFFF"/><stop offset="1" stop-color="#D6F3FF"/></linearGradient>
<linearGradient id="s06pink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B98CFF"/><stop offset="0.55" stop-color="#FF9CCB"/><stop offset="1" stop-color="#FFD9C2"/></linearGradient>
<linearGradient id="s06night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#140C3A"/><stop offset="0.6" stop-color="#3A2470"/><stop offset="1" stop-color="#7A4AA0"/></linearGradient>
<linearGradient id="s06glam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF8FD0"/><stop offset="0.5" stop-color="#B98CFF"/><stop offset="1" stop-color="#7ADFFF"/></linearGradient>
<radialGradient id="s06evil" cx="0.5" cy="0.6" r="0.7"><stop offset="0" stop-color="#7A3AB8"/><stop offset="1" stop-color="#1A0B2E"/></radialGradient>
<radialGradient id="s06moonGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF4C8" stop-opacity="0.5"/><stop offset="1" stop-color="#FFF4C8" stop-opacity="0"/></radialGradient>
</defs>`;

const STARS = Array.from({ length: 40 }, (_, i) => [hash(i * 3.1) * 2400 - 240, hash(i * 7.3) * 900 - 100, 3 + hash(i) * 5]);
function nightSky(t) {
  let o = S.rect(-800, -800, 3520, 2680, 0, { fill: 'url(#s06night)' });
  STARS.forEach(([x, y, r], i) => { o += S.circle(x, y, r * (0.7 + 0.3 * Math.sin(t * 3 + i)), { fill: '#FFFFFF', opacity: 0.8 }); });
  return o;
}
function daySky(t, id = 's06day') {
  let o = S.rect(-800, -800, 3520, 2680, 0, { fill: `url(#${id})` });
  for (const [x, y, s] of [[150, 120, 1], [800, 70, 0.8], [1400, 160, 1.1], [1950, 90, 0.9]]) o += K.E.cloud(((x + t * 18) % 2600) - 300, y, s);
  return o;
}

// Mia with the fedora on her head and/or her phone in hand
function mia(t, x, y, s, pose = {}, act = {}, o = {}) {
  const props = [...(pose.props || [])];
  const auto = K.V.perform('MIA', t, { seed: 4 * 3.7 + (act.seed || 0), ...act });
  const p = { ...auto, ...pose };
  if (o.hat) props.push(S01.headProp(placeHat(sparkleFedora(t, o.hatGlow || 0), 0, -868, 1.5, -6), p));
  if (o.phone) {
    const a = pose.armR ?? 30;
    const [hx, hy] = A.hand(a, 1);
    props.push({ svg: K.phone(hx + 10, hy - 60, 0.36, -8 + (o.phoneRot || 0), o.screen || phoneScreen(t, '2,000,000')), layer: 'front' });
  }
  return actor('mia', t, { x, y, s, ...pose, props }, act);
}
function phoneScreen(t, amount, big = false) {
  let o = S.rect(-150, -280, 300, 560, 0, { fill: '#2A1640' }) + S.rect(-150, -280, 300, 70, 0, { fill: '#B98CFF' }) + TF('BALANCE', 0, -232, 34, '#FFFFFF');
  o += K.coin(0, -80, 70, 0, t * 3) + T(amount, 0, 60, big ? 64 : 58, '#3BD16F', { stroke: '#151515', 'stroke-width': 6, 'paint-order': 'stroke' });
  o += S.g(hat('crown'), 'translate(0 -150) scale(0.55)');
  o += S.rect(-110, 150, 220, 70, 30, ol('#FF6FB5', 5)) + TF('HATS: 412', 0, 198, 32, '#FFFFFF');
  return o;
}

// ---------------------------------------------------------------- MIA'S ROOM (lavender walls, mountains of hats, vanity mirror)
function miaRoomBack(t) {
  let o = S.rect(-500, -500, 2920, 1290, 0, { fill: 'url(#s06wall)' });
  o += S.rect(-500, 730, 2920, 26, 0, ol('#F2E8FF', 5));
  // window with curtains
  o += S.rect(100, 120, 380, 330, 16, ol('#BFEBFF', 8)) + S.path('M290 120 L290 450 M100 285 L480 285', ln(8, '#FFFFFF'));
  o += S.path('M160 370 L240 160 L280 160 L200 370 Z', { fill: '#FFFFFF', opacity: 0.5 });
  o += S.path('M70 100 Q140 290 90 470 L40 470 L40 100 Z', ol('#FF9CCB', 6)) + S.path('M510 100 Q440 290 490 470 L540 470 L540 100 Z', ol('#FF9CCB', 6)) + S.rect(30, 86, 520, 26, 12, ol('#E86FA8', 5));
  // shelves full of hats
  for (const [y, n0] of [[300, 0], [480, 5]]) {
    o += S.rect(640, y, 600, 22, 6, ol('#E8C9A8', 5));
    for (let i = 0; i < 5; i++) o += placeHat(randHat(n0 + i + 11), 700 + i * 120, y, 0.42, 0);
  }
  // vanity mirror with bulbs
  o += S.rect(1400, 600, 440, 40, 10, ol('#FFFFFF', 6)) + S.rect(1420, 640, 30, 140, 6, ol('#F2E8FF', 5)) + S.rect(1790, 640, 30, 140, 6, ol('#F2E8FF', 5));
  o += S.ellipse(1620, 380, 190, 220, ol('#FFE3F1', 8)) + S.ellipse(1620, 380, 160, 190, ol('#D8F0FF', 6));
  o += S.path('M1520 300 L1580 230 L1600 250 L1540 320 Z', { fill: '#FFFFFF', opacity: 0.7 });
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2; o += S.circle(1620 + Math.cos(a) * 190, 380 + Math.sin(a) * 220, 14, ol(i % 2 ? '#FFF4B0' : '#FFE14D', 4)); }
  o += placeHat(hat('crown'), 1500, 600, 0.5, -8) + placeHat(hat('top', '#FF6FB5'), 1740, 600, 0.45, 6);
  // floor
  o += S.rect(-500, 756, 2920, 700, 0, { fill: '#D9A989' });
  for (let x = -500; x < 2400; x += 180) o += S.path(`M${x} 756 L${x - 140} 1300`, ln(3, '#B98A6A', 0.6));
  o += S.ellipse(980, 900, 520, 90, ol('#FF9CCB', 6)) + S.ellipse(980, 900, 420, 60, { fill: 'none', stroke: '#FFC2DF', 'stroke-width': 10 });
  // background hat mountains
  o += hatMound(-420, 640, 800, 430, 2, t) + hatMound(1150, 2340, 810, 330, 5, t);
  return o;
}
// hats Mia throws over her shoulders while digging
function flyingHats(t, t0, t1, x, y, n = 10, dirSeed = 1) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const tl = t0 + (i / n) * (t1 - t0);
    const age = t - tl;
    if (age < 0 || age > 1.3) continue;
    const side = i % 2 ? 1 : -1;
    const vx = side * (380 + hash(i * dirSeed) * 300), vy = -900 - hash(i * 3) * 300;
    const px = x + side * 120 + vx * age, py = y + vy * age + 0.5 * 1900 * age * age;
    o += placeHat(randHat(i + 40), px, py, 0.5 - age * 0.12, side * age * 400);
  }
  return o;
}

function shotDig(t) {
  // A: Mia digs through a mountain of hats, tossing them over her shoulders… then freezes: a rainbow glow
  const cam = camKeys(t, [[START, { zoom: 1.0, x: 0, y: -10 }], [tWait, { zoom: 1.12, x: 30, y: 30 }], [tWait + 0.2, { zoom: 1.32, x: 70, y: 90 }]]);
  const sh = K.shake(t, tWait, 0.25, 8); cam.sx = sh.sx; cam.sy = sh.sy;
  const digging = t < tWait;
  const ph = (t - START) * 9;
  let mid = miaRoomBack(t);
  const glow = seg(t, tWait - 0.1, tWait + 0.4);
  if (glow > 0) mid += S.g(rays(0, 0, 16, 700 * glow, '#FFF6C8', 0.35, t * 60) + S.ellipse(0, 0, 300 * glow, 160 * glow, { fill: 'url(#s06glow)' }), 'translate(1090 870)');
  const pose = digging
    ? { armL: 40 + 110 * Math.max(0, Math.sin(ph)), armR: 40 + 110 * Math.max(0, -Math.sin(ph)), lean: 8, headRot: 4 * Math.sin(ph), bodyY: 10 + 6 * Math.abs(Math.sin(ph)), face: { name: 'deadpan', eyes: { look: [0, 0.6] } } }
    : { armL: 30, armR: 30, lean: -2, sy: 1.03, face: { name: 'shocked', eyes: { look: [0.5, 0.7] }, fx: [] } };
  mid += mia(t, 960, 930, 0.5, pose, { arms: false });
  if (digging) mid += flyingHats(t, START - 0.5, tWait, 960, 760, 12, 3);
  // foreground heap in front of her legs
  mid += hatMound(560, 1380, 1000, 230, 9, t);
  if (glow > 0) mid += S.g(sparkleFedora(t, 0.4 * glow), 'translate(1090 930) scale(0.5) rotate(-14)') + K.sparkles([[1020, 820, 24], [1170, 860, 18], [1110, 760, 28]], t);
  let o = K.view(cam, mid, 1);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#000', opacity: f(1 - seg(t, START, START + 0.35)) });
  return o;
}

function shotReveal(t) {
  // B: close-up — the Sparkle Time Fedora rises into frame; glam background; name card word by word
  const cam = camKeys(t, [[tFind, { zoom: 1.05, x: 0, y: 0 }], [tLim, { zoom: 1.16, x: 30, y: -20 }]]);
  const glam = seg(t, tFind + 0.1, tFind + 0.4);
  let bg = K.view(cam, miaRoomBack(t), 0.4);
  bg += S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s06glam)', opacity: f(glam) });
  bg += rays(1260, 420, 18, 1600, '#FFFFFF', 0.18 * glam, t * 25);
  const lift = ease.outBack(seg(t, tFind, tFind + 0.45));
  const armR = lerp(10, 150, lift);
  const [hx, hy] = A.hand(armR, 1);
  const fed = { svg: placeHat(sparkleFedora(t, 1), hx + 60, hy - 30 + (1 - lift) * 200, 1.25, -8), layer: 'front' };
  let mid = mia(t, 760, 1560, 1.42, { armR, armL: 12, turn: 0.15, headRot: -4, face: { name: 'amazed', eyes: { look: [0.8, -0.3], type: lift > 0.8 ? 'star' : undefined }, fx: ['sparkles'] }, props: [fed] }, { arms: false, energy: 0.6 });
  let o = bg + K.view(cam, mid, 1);
  // name card: SPARKLE · TIME · FEDORA
  const words = [['SPARKLE', tFind + 0.18, 1340, 150], ['TIME', tTime, 1520, 250], ['FEDORA', tFedora, 1440, 350]];
  for (const [w, tw, x, y] of words) {
    const k = seg(t, tw, tw + 0.2);
    if (k > 0) o += S.g(T(w, 0, 0, 110, '#FFFFFF', { stroke: '#5B2A9A', 'stroke-width': 18, 'paint-order': 'stroke' }), `translate(${x} ${f(y - 120)}) rotate(-6) scale(${f(ease.outBack(k))})`);
  }
  o += K.sparkles([[260, 200, 30], [1820, 640, 36], [1180, 820, 22], [420, 760, 26]], t);
  o += flashAt(t, tFind, 0.7);
  return o;
}

function shotLimited(t) {
  // C: smash-zoom on Mia's evil grin, fedora on her head; LIMITED badge stamps, the 2,000,000 price tag swings in
  const z = camKeys(t, [[tLim, { zoom: 1.55, x: 0, y: -200 }], [tLim + 0.18, { zoom: 1.25, x: 0, y: -170 }], [tEx, { zoom: 1.32, x: -20, y: -180 }]]);
  z.rot = -5;
  const sh = K.shake(t, tLim, 0.35, 16); z.sx = sh.sx; z.sy = sh.sy;
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s06evil)' }) + rays(960, 300, 20, 1500, '#B98CFF', 0.2, -t * 15);
  const rub = Math.sin(t * 14);
  let mid = mia(t, 960, 1350, 0.95, { armL: -10 + 8 * rub, armR: -10 - 8 * rub, face: { name: 'smug', mouth: 'grin', eyes: { upper: 0.45, look: [0, 0] }, fx: [] }, headRot: -6 }, { arms: false, energy: 0.8 }, { hat: true, hatGlow: 0.5 });
  o += S.g(mid, `rotate(-4 960 540) ${''}`);
  o = S.g(o, K.E.camTf(z, 1));
  // under-light
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#1A0B2E', opacity: 0.12 });
  // LIMITED badge
  const kL = seg(t, tLim + 0.05, tLim + 0.2);
  if (kL > 0) {
    const b = S.rect(-210, -56, 420, 112, 22, ol('#3BD16F', 9)) + T('LIMITED', -20, 30, 84, '#FFFFFF', { stroke: '#1A5A2A', 'stroke-width': 10, 'paint-order': 'stroke' }) + S.rect(160, -40, 60, 80, 14, ol('#FFFFFF', 6)) + T('U', 190, 26, 64, '#3BD16F');
    o += S.g(b, `translate(1420 250) rotate(-10) scale(${f(lerp(2.6, 1, ease.out(kL)))})`, { opacity: f(clamp(kL * 3, 0, 1)) });
  }
  // price tag on a string, swings in on "edition"
  const kP = seg(t, tEd, tEd + 0.35);
  if (kP > 0) {
    const sw = Math.sin((t - tEd) * 9) * 18 * Math.exp(-(t - tEd) * 2.2);
    let tag = S.path('M0 -360 L0 -60', ln(6, '#FFFFFF')) + S.rect(-280, -70, 560, 150, 30, ol('#FFE14D', 9)) + S.circle(-240, 5, 14, ol('#FFFFFF', 5));
    tag += K.robuxText(20, 40, '2,000,000', 86, '#2A1640');
    o += S.g(tag, `translate(1430 ${f(lerp(-300, 330, ease.outBack(kP)))}) rotate(${f(sw)} 0 -360)`);
    o += coinBurst(1430, 420, t - tEd - 0.2, 18, 800, 26, 61);
  }
  o += flashAt(t, tLim, 0.8, 0.06);
  return o;
}

// ---------------------------------------------------------------- the street turns into a hat stock exchange
function exchangeBuilding(t, flashTop) {
  let o = '';
  // side buildings
  const cols = ['#FFB4C8', '#FFE38A', '#B9F0D2', '#C9D6FF', '#FFD1A6'];
  [-700, -260, 2180, 2620].forEach((x, i) => {
    o += S.rect(x, 140 + (i % 2) * 80, 400, 700, 10, ol(cols[i % 5], 7));
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) o += S.rect(x + 40 + c * 120, 200 + (i % 2) * 80 + r * 130, 80, 90, 8, ol('#CFF3FF', 5));
  });
  // the exchange: steps, columns, pediment
  o += S.path('M300 210 L960 40 L1620 210 Z', ol('#F4EEE4', 8)) + T('HAT EXCHANGE', 960, 188, 76, '#7A5A34');
  o += S.rect(280, 210, 1360, 50, 6, ol('#E8DFD2', 7));
  for (let i = 0; i < 6; i++) o += S.rect(330 + i * 240, 260, 70, 520, 8, ol('#FFFFFF', 6)) + S.rect(320 + i * 240, 250, 90, 26, 4, ol('#E8DFD2', 5));
  o += S.rect(300, 260, 1320, 520, 0, { fill: '#C9BBA8', opacity: 0.4 });
  for (let i = 0; i < 4; i++) o += S.rect(240 - i * 30, 780 + i * 22, 1440 + i * 60, 24, 4, ol('#EFE7DA', 5));
  // giant LED board
  o += S.rect(470, 300, 980, 430, 24, ol('#14182A', 10));
  o += S.rect(490, 318, 940, 54, 10, { fill: '#2A3150' });
  const tick = 'HATS ▲ +900%   FEDORA ▲   BEANIE ▲   TOP HAT ▲   HATS > GOLD   ';
  const id = S.uid('led');
  o += S.clipDef(id, S.rect(490, 318, 940, 54, 10));
  o += S.g(TF(tick + tick, 1430 - ((t * 260) % 1700), 358, 36, '#FFE14D', { 'text-anchor': 'start' }), null, { 'clip-path': `url(#${id})` });
  const rows = [['SPARKLE FEDORA', '2,000,000'], ['TOP HAT', '850,000'], ['COWBOY HAT', '420,000'], ['TRAFFIC CONE', '12,000']];
  rows.forEach(([n, p], i) => {
    const y = 430 + i * 74;
    const hot = i === 0 && flashTop > 0;
    o += S.rect(500, y - 46, 920, 64, 10, { fill: hot ? E6.rgb(t, 0, 90, 40) : '#1E2440', opacity: hot ? 0.9 : 1 });
    o += TF(n, 530, y, 40, '#FFFFFF', { 'text-anchor': 'start' }) + TF(p, 1300, y, 40, '#3BD16F', { 'text-anchor': 'end' });
    o += S.path(`M1340 ${y - 4} l20 -26 l20 26 Z`, { fill: '#3BD16F', transform: `translate(0 ${f(-Math.abs(Math.sin(t * 6 + i)) * 6)})` });
  });
  // street
  o += S.rect(-900, 860, 3800, 600, 0, { fill: '#6A6E80' }) + S.rect(-900, 840, 3800, 30, 0, ol('#C9CCD8', 5));
  for (let x = -900; x < 2900; x += 260) o += S.rect(x, 990, 140, 16, 8, { fill: '#FFFFFF', opacity: 0.6 });
  return o;
}
function tradeHats(t, n = 10) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const per = 1.6 + hash(i) * 0.8, u = ((t + hash(i * 3) * per) % per) / per;
    const dir = i % 2 ? 1 : -1;
    const x = dir > 0 ? lerp(-300, 2200, u) : lerp(2200, -300, u);
    const y = 600 - Math.sin(u * Math.PI) * (300 + hash(i * 7) * 200);
    o += placeHat(randHat(i + 50), x, y, 0.42, dir * u * 720);
  }
  // paper tickets
  for (let i = 0; i < 10; i++) {
    const u = ((t * 0.5 + hash(i * 9)) % 1);
    const x = hash(i * 5) * 2200 - 140 + Math.sin(t * 3 + i) * 40, y = -60 + u * 1100;
    o += S.rect(x, y, 46, 30, 3, { fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 3, transform: `rotate(${f(t * 200 + i * 40)} ${f(x + 23)} ${f(y + 15)})` });
  }
  return o;
}
function shotExchange(t) {
  // D: wide street → a hat stock exchange: suits yell TRADE! TRADE!, hats fly overhead, the LED board goes wild
  const cam = camKeys(t, [[tEx, { zoom: 1.0, x: -260, y: 0 }], [tVal - 0.1, { zoom: 1.0, x: 120, y: 0 }], [tVal + 0.12, { zoom: 1.5, x: 0, y: -60 }], [tAnd, { zoom: 1.6, x: 0, y: -50 }]]);
  const sh = K.shake(t, tEarth, 0.3, 10); cam.sx = sh.sx; cam.sy = sh.sy;
  let o = daySky(t);
  o += K.view(cam, exchangeBuilding(t, t > tVal ? 1 : 0), 0.85);
  // chart rockets off the top of the board on "Earth"
  if (t > tEarth - 0.1) {
    const k = seg(t, tEarth - 0.1, tEarth + 0.35);
    const pts = Array.from({ length: 24 }, (_, i) => { const u = i / 23; return [u, 0.05 + u * u * 1.6 + 0.04 * Math.sin(u * 20)]; });
    const P = pts.slice(0, Math.max(2, Math.floor(pts.length * k))).map(([u, v]) => [560 + u * 840, 700 - v * 360]);
    o += K.view(cam, S.path('M' + P.map(([a, b]) => `${f(a)} ${f(b)}`).join(' L'), ln(14, '#3BD16F')) + (k > 0.95 ? S.path('M1360 140 l40 -70 l40 70 Z', ol('#3BD16F', 6)) : ''), 0.85);
  }
  // traders
  let mid = '';
  const spots = [[60, 0, 0.5], [420, 1, 0.46], [1530, 2, 0.48], [1880, 3, 0.5], [-260, 4, 0.47], [2200, 5, 0.46]];
  spots.forEach(([x, i, s]) => {
    const ph = t * 7 + i * 1.7;
    const up = Math.max(0, Math.sin(ph));
    const held = { svg: placeHat(randHat(i + 60), 100 + 250 * Math.sin((150 * Math.PI) / 180) + 30, -515 + 250 * Math.cos((150 * Math.PI) / 180) - 40, 0.9, Math.sin(ph) * 10), layer: 'front' };
    mid += traders[i]({ x, y: 960 + (i % 2) * 30, s, turn: x < 960 ? 0.35 : -0.35, armR: 150 + 20 * up, armL: 40 + 100 * Math.max(0, -Math.sin(ph)), bodyY: 6 * up, lift: 14 * up, headRot: 6 * Math.sin(ph), face: { name: 'angry', mouth: up > 0.3 ? 'scream' : 'teeth', fx: [] }, props: [held] });
  });
  o += K.view(cam, mid, 1);
  o += K.view(cam, tradeHats(t, 10), 1.05);
  // TRADE! bubbles in rhythm
  for (let i = 0; i < 6; i++) {
    const tb = tEx + 0.15 + i * 0.55;
    const k = seg(t, tb, tb + 0.12) * (1 - seg(t, tb + 0.5, tb + 0.6));
    const [x, , s] = spots[i % spots.length];
    o += K.view(cam, bubble(i % 3 === 2 ? 'TRADE! TRADE!' : 'TRADE!', x + 40, 960 - 1000 * s - 30, k, 52, '#151515', '#FFFFFF', (i % 2 ? 6 : -6)), 1);
  }
  o += flashAt(t, tEx, 0.6) + flashAt(t, tVal + 0.05, 0.35);
  return o;
}

// ---------------------------------------------------------------- Ty's house: hat mountain bursts through the roof
function suburbBack(t) {
  let o = daySky(t);
  o += S.rect(-900, 820, 3800, 800, 0, { fill: '#6FCF6A' }) + S.rect(-900, 820, 3800, 14, 0, { fill: '#8FE07E' });
  o += S.path('M-900 1000 Q960 960 2900 1000 L2900 1200 L-900 1200 Z', { fill: '#C9C2B4' });
  o += tree(-120, 830, 1.1, '#3FBF5A', t) + tree(2080, 830, 1.2, '#2FAE6E', t);
  return o;
}
function shotMountain(t) {
  // E: tight on the upstairs window — hats spill out — then on "LOT" the camera blasts out: a hat MOUNTAIN through the roof
  const out = ease.out(seg(t, tLot - 0.05, tLot + 0.55));
  const cam = camKeys(t, [[tAnd, { zoom: 2.3, x: -200, y: 30 }], [tLot - 0.05, { zoom: 2.5, x: -200, y: 30 }]]);
  const wide = { zoom: 0.62, x: 0, y: -330 };
  const cm = out > 0 ? { zoom: lerp(cam.zoom, wide.zoom, out), x: lerp(cam.x, wide.x, out), y: lerp(cam.y, wide.y, out) } : cam;
  const sh = K.shake(t, tLot, 0.7, 20); cm.sx = sh.sx; cm.sy = sh.sy;
  let w = suburbBack(t);
  const burst = t >= tLot - 0.05;
  let mid = '';
  if (burst) {
    // the mountain rises through the roof
    const up = ease.outBack(seg(t, tLot - 0.05, tLot + 0.45));
    const peak = lerp(700, -720, up);
    mid += hatMound(560, 1360, 760, 760 - peak, 14, t);
    mid += mia(t, 960, peak + 60, 0.2, { face: { name: 'smug' }, armR: 30 }, {}, { hat: true, phone: true });
    mid += K.sparkles([[900, peak - 120, 30], [1040, peak - 60, 24]], t);
  }
  mid += tyHouse(960, 920, 0.8, t, { hole: burst ? 1 : 0, winHats: seg(t, tAnd, tAnd + 0.8) });
  mid += bushy(470, 930, 0.9) + bushy(1450, 930, 0.9, '#3FB35E');
  // white picket fence
  for (let x = 120; x < 1840; x += 70) if (x < 820 || x > 1100) mid += S.path(`M${x} 980 L${x} 900 L${x + 20} 880 L${x + 40} 900 L${x + 40} 980 Z`, ol('#FFFFFF', 4));
  mid += S.rect(100, 920, 720, 14, 4, ol('#FFFFFF', 4)) + S.rect(1100, 920, 740, 14, 4, ol('#FFFFFF', 4));
  // hats bursting out and tumbling down
  if (burst) for (let i = 0; i < 16; i++) {
    const age = t - tLot - hash(i) * 0.4;
    if (age < 0) continue;
    const a = -Math.PI / 2 + (hash(i * 5) - 0.5) * 2.6, v = 900 + hash(i * 3) * 700;
    const px = 960 + Math.cos(a) * v * age, py = 400 + Math.sin(a) * v * age + 0.5 * 1600 * age * age;
    if (py < 1300) mid += placeHat(randHat(i + 100), px, py, 0.5, age * 300 * (i % 2 ? 1 : -1));
  }
  let o = K.view(cm, w, 0.8) + K.view(cm, mid, 1);
  o += flashAt(t, tAnd, 0.6) + flashAt(t, tLot, 0.5, 0.06);
  return o;
}

// ---------------------------------------------------------------- the front lawn: Mia slides down the pile — "Who's broke now?"
function lawnBack(t, cam) {
  let w = suburbBack(t);
  let m = hatMound(760, 2000, 820, 1400, 14, t) + tyHouse(1380, 830, 1.05, t, { hole: 1 }) + bushy(500, 840, 1.1);
  return K.view(cam, w, 0.6) + K.view(cam, m, 0.8);
}
function shotBroke(t) {
  const cam = camKeys(t, [[tBroke, { zoom: 1.0, x: 0, y: 0 }], [tTy, { zoom: 1.12, x: 60, y: 20 }]]);
  let o = lawnBack(t, cam);
  let mid = hatMound(1050, 1650, 990, 150, 21, t, 1);
  const land = seg(t, tBroke - 0.05, tBroke + 0.3);
  const my = lerp(-300, 880, ease.in(land));
  const sq = bump(t, tBroke + 0.3, tBroke + 0.55);
  mid += mia(t, 1350, my, 0.56, { turn: -0.5, lean: -6, armR: 40, armL: 20, sy: 1 - 0.12 * sq, sx: 1 + 0.1 * sq, face: { name: 'smug', eyes: { look: [-0.7, 0.3] } } }, { energy: 0.7 }, { hat: true, phone: true });
  mid += S01.tyIn(t, 560, 1000, 0.56, { turn: 0.5, face: t < tBroke + 0.6 ? { name: 'shocked' } : { name: 'angry', eyes: { look: [0.8, -0.3] }, fx: ['anger'] }, armL: 10, armR: 10 }, { arms: false }, false);
  o += K.view(cam, mid, 1);
  if (land < 1) o += K.view(cam, C.speedLines(1250, 1450, my - 300, 8, 3, '#FFFFFF', 200), 1);
  o += K.view(cam, C.dust(1260, 890, tBroke + 0.28, t), 1);
  o += K.view(cam, bang('THUD!', 1640, 520, seg(t, tBroke + 0.28, tBroke + 0.4) * (1 - seg(t, tBroke + 1.1, tBroke + 1.3)), 80, 8, '#FF9CCB'), 1);
  return o;
}
function shotMillionaire(t) {
  // G: Ty, close: "I'm not broke! I'm a MILLIONAIRE!" — leaps on the word, coins + balance HUD
  const cam = camKeys(t, [[tTy, { zoom: 1.0, x: 0, y: 0 }], [tMil, { zoom: 1.08, x: 0, y: 20 }], [tMil + 0.12, { zoom: 0.92, x: 0, y: -40 }], [tTwo0, { zoom: 0.95, x: 0, y: -40 }]]);
  const sh = K.shake(t, tMil, 0.4, 14); cam.sx = sh.sx; cam.sy = sh.sy;
  let o = lawnBack(t, { zoom: 1.6, x: -500, y: 80 });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: 0.12 });
  const jump = bump(t, tMil, tMil + 0.65);
  const yell = t >= tMil;
  let mid = S01.tyIn(t, 900, 1540, 1.12, { turn: 0.3, lift: 160 * jump, armL: yell ? 160 : 30, armR: yell ? 160 : 70, face: yell ? { name: 'excited', fx: ['sparkles'] } : { name: 'angry', eyes: { look: [0.6, 0] } }, sy: 1 + 0.06 * jump, sx: 1 - 0.04 * jump }, { arms: false, energy: 1.4 }, false);
  o += K.view(cam, mid, 1);
  if (yell) {
    o += rays(900, 300, 18, 1400, '#FFE14D', 0.22 * (1 - seg(t, tMil + 0.5, tTwo0)), t * 40);
    o += coinBurst(900, 520, t - tMil, 30, 1300, 34, 17);
    o += S.g(K.counter(0, 0, lerp(0, 3000000, ease.out(seg(t, tMil, tMil + 0.5))), 1.3), `translate(960 ${f(lerp(-120, 120, ease.outBack(seg(t, tMil, tMil + 0.3))))})`);
  }
  return o;
}
function shotTwo(t) {
  // H: Mia leans into the lens with her phone: 2,000,000 — "I'm a TWO-millionaire."
  const cam = camKeys(t, [[tTwo0, { zoom: 1.0, x: 0, y: 0 }], [tTwo, { zoom: 1.0, x: 0, y: 0 }], [tTwo + 0.2, { zoom: 1.12, x: 80, y: 0 }], [tSplit, { zoom: 1.15, x: 80, y: 0 }]]);
  let o = lawnBack(t, { zoom: 1.7, x: 300, y: 60 });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FFE3F1', opacity: 0.18 });
  const push = ease.outBack(seg(t, tTwo - 0.15, tTwo + 0.2));
  let mid = mia(t, 760, 1560, 1.25, { turn: 0.25, lean: 4 * push, armR: lerp(30, 70, push), face: { name: 'smug', eyes: { look: [0.4, 0] } } }, { arms: false, energy: 0.6 }, { hat: true });
  o += K.view(cam, mid, 1);
  // the phone, pushed toward the lens
  const ps = lerp(0.8, 1.45, push);
  o += K.view(cam, K.phone(1380, 560 - 40 * push, ps, -8 + 6 * push, phoneScreen(t, '2,000,000', true)), 1);
  if (t > tTwo) o += K.view(cam, S.g(T('×2', 0, 0, 150, '#FFE14D', { stroke: '#151515', 'stroke-width': 16, 'paint-order': 'stroke' }), `translate(1640 250) rotate(12) scale(${f(ease.outBack(seg(t, tTwo + 0.1, tTwo + 0.35)))})`), 1);
  o += flashAt(t, tTwo0, 0.5);
  return o;
}

// ---------------------------------------------------------------- split-screen rivalry
const LP = [[0, 0], [1010, 0], [910, 1080], [0, 1080]], RP = [[1010, 0], [1920, 0], [1920, 1080], [910, 1080]];
const polyD = (P) => 'M' + P.map(([x, y]) => `${x} ${y}`).join(' L') + ' Z';
function panel(svg, P, dx, k = 1) {
  const id = S.uid('pn');
  const sc = lerp(1.35, 1, ease.out(clamp(k, 0, 1)));
  const cx = dx < 0 ? 480 : 1440;
  return S.clipDef(id, S.path(polyD(P))) + S.g(S.g(svg, `translate(${dx} 0)`), `translate(${cx} 540) scale(${f(sc)}) translate(${-cx} -540)`, { 'clip-path': `url(#${id})` });
}
function helicopter(t, s = 1, inner = '') {
  const rot = t * 40;
  let o = '';
  // tail
  o += S.path('M140 -40 L520 -90 L530 -50 L150 20 Z', ol('#FF8FB8', 7)) + S.path('M500 -150 L540 -60 L500 -40 Z', ol('#E86FA8', 6));
  const tr = Math.cos(rot * 1.3);
  o += S.g(S.rect(-8, -70, 16, 140, 8, ol('#FFFFFF', 4)), `translate(520 -70) scale(1 ${f(Math.max(0.15, Math.abs(tr)))})`);
  // skids
  o += S.path('M-200 200 L220 200 M-120 120 L-140 200 M120 120 L140 200', ln(12, '#4A4F66'));
  // body back
  o += S.path('M-230 20 Q-230 -170 0 -180 Q210 -180 230 0 Q230 140 0 140 Q-230 140 -230 20 Z', ol('#FF8FB8', 8));
  o += inner;
  // cockpit glass + front panel
  o += S.path('M-230 20 Q-230 -170 -10 -176 L-10 60 L-230 60 Z', { fill: '#BFEBFF', opacity: 0.35, stroke: '#151515', 'stroke-width': 6 });
  o += S.path('M-232 40 L230 40 Q230 140 0 140 Q-232 140 -232 40 Z', ol('#FF8FB8', 8)) + S.rect(-170, 70, 120, 26, 10, { fill: '#FFFFFF', opacity: 0.4 });
  o += T('MIA', 120, 110, 52, '#FFFFFF', { stroke: '#B0427A', 'stroke-width': 8, 'paint-order': 'stroke' });
  // rotor
  o += S.rect(-14, -230, 28, 54, 8, ol('#4A4F66', 5));
  const b = Math.cos(rot);
  o += S.ellipse(0, -232, 420, 26, { fill: '#FFFFFF', opacity: 0.25 }) + S.g(S.rect(-420, -242, 840, 22, 11, ol('#4A4F66', 5)), `translate(0 -231) scale(${f(b)} 1) translate(0 231)`);
  return S.g(o, `scale(${f(s)})`);
}
function pTyHover(t, k) {
  let o = S.rect(-800, -400, 3520, 1900, 0, { fill: 'url(#s06day)' });
  for (let i = 0; i < 5; i++) o += K.E.cloud(((i * 520 - t * 900) % 2600 + 2600) % 2600 - 400, 120 + (i % 3) * 200, 0.8);
  const bob = Math.sin(t * 8) * 10;
  o += C.speedLines(200, 700, 560, 12, 5, '#FFFFFF', 400);
  o += hoverboard(960, 700 + bob, 0.9, t);
  const jealous = t > tHeli + 0.2;
  o += S01.tyIn(t, 970, 690 + bob, 0.48, { view: 'side', flip: true, legL: 18, kneeL: 30, legR: -24, kneeR: 34, armL: -70, armR: 60, lean: 14, face: jealous ? { name: 'angry' } : { name: 'excited' } }, { arms: false });
  o += K.priceTag(960, 860, '50K', 1, -6);
  return o;
}
function pMiaHeli(t, k) {
  let o = S.rect(-800, -400, 3520, 1900, 0, { fill: 'url(#s06pink)' });
  for (let i = 0; i < 4; i++) o += K.E.cloud(((i * 600 + t * 120) % 2600) - 400, 160 + (i % 2) * 380, 0.9, '#FFE6F2', '#F7C2DA');
  const y = lerp(300, 560, ease.out(k)) + Math.sin(t * 3) * 14;
  const inner = mia(t, 0, 380, 0.32, { armR: 30, face: { name: 'smug', eyes: { look: [-0.6, 0] } } }, {}, { hat: true });
  o += S.g(helicopter(t, 1, S.g(inner, 'translate(-110 -160)')), `translate(960 ${f(y)}) rotate(${f(-4 + Math.sin(t * 2) * 2)}) scale(0.85)`);
  for (let i = 0; i < 6; i++) o += S.path(`M${700 + i * 100} ${f(y + 260 + ((t * 300 + i * 40) % 160))} l0 50`, ln(8, '#FFFFFF', 0.6));
  o += K.priceTag(960, 900, '500K', 1, 6, '#FF9CCB');
  return o;
}
function pTyMansion(t, k) {
  let o = S01.goldenSky(t);
  o += S.g(S01.villa(t) + S.rect(-400, 740, 2800, 400, 0, { fill: '#6FBF5A' }), 'translate(960 900) scale(0.62) translate(-960 -760)');
  const jealous = t > tMan2 + 0.2;
  o += S01.tyIn(t, 960, 1010, 0.5, { turn: 0.3, armL: jealous ? 10 : 125, armR: jealous ? 10 : 125, face: jealous ? { name: 'shocked' } : { name: 'smug' } }, { arms: false });
  o += K.priceTag(1240, 330, '1M', 1, 8);
  return o;
}
function miaMansion(t, grow = 0) {
  // the same villa next door — with Mia's pink flags, and (later) ONE FLOOR TALLER
  let o = S01.villa(t);
  o += S.rect(380, 470, 1160, 18, 0, { fill: '#FF9CCB' }) + S.rect(520, 300, 880, 14, 0, { fill: '#FF9CCB' });
  for (const x of [400, 1520]) o += S.path(`M${x} 470 L${x} 330`, ln(8)) + S.path(`M${x} 330 L${x + 70} 350 L${x} 372 Z`, ol('#FF6FB5', 5));
  if (grow > 0) {
    const h = 170 * grow;
    let fl = S.rect(560, 230 - h, 800, h, 6, ol('#FFF0F6', 6));
    for (let i = 0; i < 4; i++) fl += S.rect(600 + i * 190, 230 - h + 24 * grow, 140, Math.max(0, h - 48 * grow), 10, ol('url(#s01win)', 6));
    fl += S.rect(520, 230 - h - 30, 880, 32, 6, ol('#FF9CCB', 5)) + S.rect(640, 230 - h - 70, 640, 44, 6, ol('#2A2A36', 6));
    fl += placeHat(sparkleFedora(t, 0), 960, 230 - h - 70, 0.9, 0);
    o += fl;
  } else {
    o += placeHat(sparkleFedora(t, 0), 960, 236, 0.9, 0);
  }
  return o;
}
function pMiaMansion(t, k) {
  let o = S.rect(-800, -400, 3520, 1900, 0, { fill: 'url(#s06pink)' });
  o += S.g(miaMansion(t, 0) + S.rect(-400, 740, 2800, 400, 0, { fill: '#6FBF5A' }), 'translate(960 900) scale(0.62) translate(-960 -760)');
  o += mia(t, 960, 1010, 0.5, { turn: -0.3, armR: 40, face: { name: 'smug', eyes: { look: [-0.6, 0] } } }, {}, { hat: true, phone: true });
  o += K.priceTag(690, 330, '1M+1', 1, -8, '#FF9CCB');
  return o;
}
function pIdle(t, who) {
  let o = S.rect(-800, -400, 3520, 1900, 0, { fill: who === 'ty' ? '#FFD86B' : '#D8C2FF' });
  o += rays(960, 520, 16, 1400, '#FFFFFF', 0.25, (who === 'ty' ? 1 : -1) * t * 20);
  if (who === 'ty') o += S01.tyIn(t, 960, 1000, 0.55, { turn: 0.3, armL: 30, armR: 30, face: { name: 'determined' } });
  else o += mia(t, 960, 1000, 0.55, { turn: -0.3, armR: 40, face: { name: 'smug', eyes: { look: [-0.6, 0] } } }, {}, { hat: true, phone: true });
  return o;
}
function nameBadge(txt, x, y, col, rot) {
  return S.g(S.rect(-150, -50, 300, 100, 26, ol(col, 8)) + T(txt, 0, 30, 76, '#FFFFFF', { stroke: '#151515', 'stroke-width': 10, 'paint-order': 'stroke' }), `translate(${x} ${y}) rotate(${rot})`);
}
function shotSplit(t) {
  // I: split screen — every purchase swaps its half exactly on the word
  const open = ease.out(seg(t, tSplit, tSplit + 0.3));
  let L_ = '', R_ = '';
  if (t < tHover) L_ = panel(pIdle(t, 'ty'), LP, -460, 1);
  else if (t < tMan1) L_ = panel(pTyHover(t, seg(t, tHover, tHover + 0.3)), LP, -460, seg(t, tHover, tHover + 0.25));
  else L_ = panel(pTyMansion(t, 1), LP, -460, seg(t, tMan1, tMan1 + 0.25));
  if (t < tHeli) R_ = panel(pIdle(t, 'mia'), RP, 460, 1);
  else if (t < tMan2) R_ = panel(pMiaHeli(t, seg(t, tHeli, tHeli + 0.6)), RP, 460, seg(t, tHeli, tHeli + 0.25));
  else R_ = panel(pMiaMansion(t, 1), RP, 460, seg(t, tMan2, tMan2 + 0.25));
  let o = S.g(L_, `translate(${f(-1100 * (1 - open))} 0)`) + S.g(R_, `translate(${f(1100 * (1 - open))} 0)`);
  // per-panel flashes on each purchase
  for (const [tc, P] of [[tHover, LP], [tHeli, RP], [tMan1, LP], [tMan2, RP]]) {
    const k = bump(t, tc - 0.02, tc + 0.16);
    if (k > 0) o += S.path(polyD(P), { fill: '#FFFFFF', opacity: f(0.6 * k) });
  }
  // divider + VS
  o += S.path('M1010 -20 L910 1100', ln(30, '#151515')) + S.path('M1010 -20 L910 1100', ln(14, '#FFFFFF'));
  const vs = ease.outBack(seg(t, tSplit + 0.15, tSplit + 0.45));
  o += S.g(S.circle(0, 0, 90, ol('#FF4D6D', 10)) + T('VS', 0, 30, 90, '#FFFFFF', { stroke: '#151515', 'stroke-width': 10, 'paint-order': 'stroke' }), `translate(960 480) rotate(${f(-8 + Math.sin(t * 6) * 4)}) scale(${f(vs * (1 + 0.08 * Math.sin(t * 12)))})`);
  o += S.g(nameBadge('TY', 0, 0, '#F2B53A', -4), `translate(${f(lerp(-300, 190, open))} 90)`) + S.g(nameBadge('MIA', 0, 0, '#B79BE8', 4), `translate(${f(lerp(2220, 1730, open))} 90)`);
  return o;
}
function shotTaller(t) {
  // I2: wide — both mansions side by side; on "taller" Mia's sprouts ONE more floor
  const grow = ease.outElastic(seg(t, tTaller - 0.05, tTaller + 0.6));
  const cam = camKeys(t, [[tOne, { zoom: 1.0, x: 0, y: 0 }], [tTaller, { zoom: 1.0, x: 120, y: -20 }], [tTaller + 0.3, { zoom: 1.18, x: 300, y: -80 }], [tMoon0, { zoom: 1.2, x: 300, y: -90 }]]);
  const sh = K.shake(t, tTaller, 0.4, 12); cam.sx = sh.sx; cam.sy = sh.sy;
  let w = S.rect(-800, -800, 3520, 2680, 0, { fill: 'url(#s06pink)' });
  for (let i = 0; i < 4; i++) w += K.E.cloud(((i * 600 + t * 30) % 2600) - 400, 80 + (i % 2) * 140, 0.8, '#FFE6F2', '#F7C2DA');
  let mid = S.g(S01.villa(t), 'translate(500 860) scale(0.6) translate(-960 -760)');
  mid += S.g(miaMansion(t, grow), 'translate(1420 860) scale(0.6) translate(-960 -760)');
  mid += S.rect(-800, 856, 3520, 400, 0, { fill: '#6FBF5A' }) + S.rect(-800, 856, 3520, 12, 0, { fill: '#8FE07E' });
  mid += S.path('M960 860 L960 760', ln(10, '#FFFFFF')) + S.rect(940, 700, 40, 70, 6, { fill: 'none' });
  mid += S01.tyIn(t, 760, 1010, 0.32, { turn: 0.6, armL: 20, armR: 20, face: t > tTaller ? { name: 'shocked', eyes: { look: [0.8, -0.8] } } : { name: 'smug' } }, { arms: false });
  mid += mia(t, 1160, 1010, 0.32, { turn: -0.4, armR: 40, face: { name: 'smug' } }, {}, { hat: true, phone: true });
  let o = w + K.view(cam, mid, 1);
  if (grow > 0) {
    const k = seg(t, tTaller + 0.1, tTaller + 0.3);
    o += K.view(cam, S.g(S.rect(-130, -46, 260, 92, 24, ol('#FF6FB5', 7)) + T('+1 FLOOR', 0, 22, 56, '#FFFFFF', { stroke: '#151515', 'stroke-width': 8, 'paint-order': 'stroke' }), `translate(1760 330) rotate(10) scale(${f(ease.outBack(k))})`), 1);
    o += K.view(cam, bang('BOING!', 1140, 280, k * (1 - seg(t, tTaller + 0.8, tTaller + 0.95)), 80, -10, '#FFE14D'), 1);
  }
  o += flashAt(t, tOne, 0.6);
  return o;
}

// ---------------------------------------------------------------- the moon
const MOON_R = 300;
function moonDisc(t) {
  let o = S.circle(0, 0, MOON_R, ol('#FFF1C4', 9));
  for (const [x, y, r] of [[-120, -90, 56], [90, 60, 70], [-40, 150, 40], [150, -130, 36], [-180, 80, 30], [40, -40, 26]]) o += S.circle(x, y, r, { fill: '#E9D79A', stroke: '#D4BE7A', 'stroke-width': 6 });
  o += S.path(`M${-MOON_R * 0.7} ${-MOON_R * 0.5} Q${-MOON_R * 0.5} ${-MOON_R * 0.85} 0 ${-MOON_R * 0.9}`, ln(16, '#FFFFFF', 0.6));
  return o;
}
// a = 0..1 broken: the 30% wedge (from -40° to 68°) separates; wedge offset (dx, dy, rot)
const W0 = -40, W1 = -40 + 108;
const sector = (a0, a1, r) => {
  const p = (a) => [Math.cos((a * Math.PI) / 180) * r, Math.sin((a * Math.PI) / 180) * r];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M0 0 L${f(x0)} ${f(y0)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${f(x1)} ${f(y1)} Z`;
};
function moon(t, broken = 0, wedgeTf = '', sign = 0, signBounce = 0) {
  let o = S.circle(0, 0, MOON_R * 1.9, { fill: 'url(#s06moonGlow)' });
  const signSvg = sign > 0 ? S.g(soldSign(), `translate(-150 ${f(-MOON_R + 30 - (1 - sign) * 700)}) rotate(${f(-10 + signBounce * 8)})`) : '';
  if (!broken) return o + moonDisc(t) + signSvg;
  const id1 = S.uid('mn'), id2 = S.uid('mw');
  o += S.clipDef(id1, S.path(sector(W1, W0 + 360, MOON_R + 10))) + S.g(moonDisc(t), null, { 'clip-path': `url(#${id1})` });
  o += S.path(sector(W1, W0 + 360, MOON_R), { fill: 'none', stroke: '#151515', 'stroke-width': 9, 'stroke-linejoin': 'round' });
  o += signSvg;
  o += S.g(S.clipDef(id2, S.path(sector(W0, W1, MOON_R + 10))) + S.g(moonDisc(t), null, { 'clip-path': `url(#${id2})` }) + S.path(sector(W0, W1, MOON_R), { fill: 'none', stroke: '#151515', 'stroke-width': 9, 'stroke-linejoin': 'round' }), wedgeTf);
  return o;
}
function soldSign() {
  let o = S.rect(-10, -40, 20, 200, 4, ol('#8A5A34', 5));
  o += S.rect(-120, -160, 240, 130, 14, ol('#FFFFFF', 7)) + S.rect(-108, -148, 216, 106, 10, { fill: 'none', stroke: '#E2233B', 'stroke-width': 6 });
  o += T('SOLD', 0, -70, 80, '#E2233B') + TF('to MIA', 0, -30, 26, '#7A4FA8');
  return o;
}
function shotMoonBuy(t) {
  // J: night on Mia's taller roof — "I also bought the moon." → SOLD sign slams onto the moon
  const cam = camKeys(t, [[tMoon0, { zoom: 1.1, x: -260, y: 120 }], [tMoonW - 0.3, { zoom: 1.0, x: -120, y: 60 }], [tMoonW + 0.1, { zoom: 1.0, x: 180, y: -60 }], [tCant, { zoom: 1.08, x: 220, y: -80 }]]);
  const sh = K.shake(t, tMoonW + 0.12, 0.35, 12); cam.sx = sh.sx; cam.sy = sh.sy;
  let o = nightSky(t);
  const sign = ease.in(seg(t, tMoonW - 0.08, tMoonW + 0.12));
  const bnc = t > tMoonW + 0.12 ? Math.sin((t - tMoonW) * 18) * Math.exp(-(t - tMoonW) * 4) : 0;
  o += K.view(cam, S.g(moon(t, 0, '', sign, bnc), 'translate(1420 330) scale(0.9)'), 0.6);
  // rooftop deck with string lights
  let mid = S.rect(-400, 760, 2800, 600, 0, { fill: '#3A2A5A' }) + S.rect(-400, 740, 2800, 30, 0, ol('#FFE3F1', 5));
  for (let x = -380; x < 2400; x += 120) mid += S.rect(x, 640, 16, 110, 4, ol('#FFE3F1', 4));
  mid += S.rect(-400, 630, 2800, 18, 6, ol('#FFE3F1', 4));
  mid += S.path('M-200 420 Q300 520 800 430 Q1300 520 1800 420', ln(4, '#2A1A40'));
  for (let i = 0; i < 14; i++) { const u = i / 13, x = lerp(-200, 1800, u), y = 440 + Math.sin(u * Math.PI * 2) * -10 + 50 * Math.sin(u * Math.PI * 2) ** 2; mid += S.circle(x, y + 10, 12, ol(i % 2 ? '#FFE14D' : '#FF9CCB', 3)); }
  mid += mia(t, 640, 960, 0.55, { turn: 0.15, armR: 40, face: { name: 'deadpan', eyes: { look: [0, 0.5] } } }, { energy: 0.4 }, { hat: true, phone: true, screen: moonScreen(t) });
  o += K.view(cam, mid, 1);
  o += K.view(cam, C.dust(1240, 140, tMoonW + 0.12, t), 0.6);
  o += K.view(cam, bang('THUNK!', 1720, 120, seg(t, tMoonW + 0.12, tMoonW + 0.25) * (1 - seg(t, tCant - 0.2, tCant)), 80, 10, '#FFE14D'), 0.6);
  o += flashAt(t, tMoon0, 0.6);
  return o;
}
function moonScreen(t) {
  let o = S.rect(-150, -280, 300, 560, 0, { fill: '#1A1240' }) + S.circle(0, -90, 90, ol('#FFF1C4', 6));
  o += S.rect(-120, 60, 240, 80, 30, ol('#3BD16F', 5)) + T('BUY', 0, 116, 56, '#FFFFFF');
  return o;
}
function shotCant(t) {
  // K: Ty on his (shorter) balcony at night — stunned, then "BUY" smash-zoom
  const smash = t >= tBuy;
  const cam = smash ? camKeys(t, [[tBuy, { zoom: 1.5, x: 0, y: -170 }], [tSys, { zoom: 1.58, x: 0, y: -180 }]]) : camKeys(t, [[tCant, { zoom: 1.0, x: 0, y: -60 }], [tBuy, { zoom: 1.08, x: 0, y: -80 }]]);
  const sh = K.shake(t, tBuy, 0.4, 16); cam.sx = sh.sx; cam.sy = sh.sy;
  let o = nightSky(t);
  o += K.view(cam, S.g(moon(t, 0, '', 1), 'translate(1600 180) scale(0.45)'), 0.5);
  let mid = S.rect(-400, 840, 2800, 600, 0, { fill: '#4A3A2A' }) + S.rect(-400, 820, 2800, 30, 0, ol('#F2EADF', 5));
  for (let x = -380; x < 2400; x += 110) mid += S.rect(x, 700, 18, 130, 4, ol('#F2EADF', 4));
  mid += S.rect(-400, 690, 2800, 20, 6, ol('#E2B33C', 4));
  mid += S01.tyIn(t, 960, 1120, 0.78, { turn: 0.1, armL: smash ? 70 : 12, armR: smash ? 70 : 12, face: smash ? { name: 'angry' } : { name: 'shocked', eyes: { look: [0.6, -0.6] } } }, { arms: false, energy: 1.5 }, false);
  o += K.view(cam, mid, 1);
  if (smash) o += C.speedLines(0, 1920, 540, 20, 9, '#FFFFFF', 1000) + rays(960, 300, 18, 1400, '#FF4D6D', 0.18, t * 30);
  o += flashAt(t, tCant, 0.5) + flashAt(t, tBuy, 0.5, 0.06);
  return o;
}
function shotFee(t) {
  // L: space — MOON PURCHASED toast; the Thirty Percent Guy pops up, snaps off a third, and floats away with it
  const cam = camKeys(t, [[tSys, { zoom: 1.0, x: 0, y: 0 }], [tThirty, { zoom: 1.08, x: 60, y: 0 }], [tFee + 0.1, { zoom: 1.0, x: 120, y: 0 }], [END, { zoom: 0.95, x: 200, y: 0 }]]);
  const sh = K.shake(t, tFee, 0.4, 16); cam.sx = sh.sx; cam.sy = sh.sy;
  let o = nightSky(t);
  // Earth far below for scale
  o += K.view(cam, S.circle(300, 1500, 700, ol('#3B8BFF', 8)) + S.path('M-100 980 Q100 900 300 960 Q420 1010 560 900 L600 1100 L-100 1100 Z', { fill: '#3BD16F', opacity: 0.9 }), 0.4);
  const broken = t >= tFee;
  const u = seg(t, tFee, END);
  const wx = 200 * u + 50 * ease.out(seg(t, tFee, tFee + 0.2)), wy = -60 * u, wr = 25 * u;
  // Thirty: rises behind the moon, grabs the wedge, then floats away with it
  const up = ease.outBack(seg(t, tThirty - 0.3, tThirty + 0.15));
  const grab = seg(t, tPct, tFee);
  const mx = 960, my = 560;
  let mid = '';
  const tx = 1220 + wx * 1.6, ty = lerp(980, 700, up) + wy * 1.6;
  const thirty = up > 0 ? actor('thirty', t, { x: tx, y: ty, s: 0.42, rot: broken ? 8 + wr * 0.5 : 0, rotY: -400, turn: -0.4, armL: broken ? 150 : lerp(60, 130, grab), armR: broken ? 160 : 40, face: { name: broken ? 'joy' : 'smug' }, shadow: false }) : '';
  if (!broken) mid += thirty;
  mid += S.g(moon(t, broken ? 1 : 0, `translate(${f(wx)} ${f(wy)}) rotate(${f(wr)})`, 1), `translate(${mx} ${my})`);
  if (broken) mid += thirty;
  o += K.view(cam, mid, 1);
  if (broken) {
    o += K.view(cam, bang('SNAP!', 1260, 300, seg(t, tFee, tFee + 0.12) * (1 - seg(t, tFee + 0.9, tFee + 1.05)), 110, 10, '#FFE14D'), 1);
    o += K.view(cam, stamp('-30%', 640, 820, seg(t, tFee + 0.1, tFee + 0.3), 120, '#E2233B', -12), 1);
    for (let i = 0; i < 10; i++) {
      const age = t - tFee, a = hash(i) * Math.PI * 2;
      if (age < 0.8) o += K.view(cam, S.rect(mx + 180 + Math.cos(a) * age * 500, my - 60 + Math.sin(a) * age * 500, 18, 18, 4, ol('#FFF1C4', 4)), 1);
    }
  }
  // system toast
  const kT = seg(t, tSys, tSys + 0.3) * (1 - seg(t, tThirty - 0.1, tThirty + 0.2));
  if (kT > 0) {
    let b = S.rect(-360, -70, 720, 140, 30, ol('#1F2233', 8)) + S.circle(-280, 0, 44, ol('#3BD16F', 6)) + S.path('M-302 0 L-286 18 L-256 -18', ln(10, '#FFFFFF'));
    b += T('MOON PURCHASED!', 30, 20, 60, '#7CF7FF');
    o += S.g(b, `translate(960 ${f(lerp(-120, 140, ease.outBack(kT)))})`);
  }
  const kF = seg(t, tThirty, tThirty + 0.25);
  if (kF > 0) {
    let b = S.rect(-330, -60, 660, 120, 30, ol('#2A0610', 8)) + T('30% FEE APPLIED', 0, 20, 56, '#FF6B7A');
    o += S.g(b, `translate(960 ${f(lerp(-120, 120, ease.outBack(kF)))})`);
  }
  o += flashAt(t, tSys, 0.6);
  o += whip(seg(t, END - 0.18, END), 1);
  return o;
}

// ---------------------------------------------------------------- router
function scene(t) {
  if (t < tFind) return shotDig(t);
  if (t < tLim) return shotReveal(t);
  if (t < tEx) return shotLimited(t);
  if (t < tAnd) return shotExchange(t);
  if (t < tBroke) return shotMountain(t);
  if (t < tTy) return shotBroke(t);
  if (t < tTwo0) return shotMillionaire(t);
  if (t < tSplit) return shotTwo(t);
  if (t < tOne) return shotSplit(t);
  if (t < tMoon0) return shotTaller(t);
  if (t < tCant) return shotMoonBuy(t);
  if (t < tSys) return shotCant(t);
  return shotFee(t);
}
const look = (t) => (t >= tMoon0 ? { grade: 'cool', vignette: 0.9 } : t >= tLim && t < tEx ? { grade: 'cool', vignette: 1 } : { grade: 'warm' });

module.exports = { scene, look, DEFS, START, END };
