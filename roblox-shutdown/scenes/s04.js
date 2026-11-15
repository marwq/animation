// SC 04 · ПОСЛЕДНИЙ ДЕНЬ — the "last day list" montage: the list wall, the piggy bank + pet, every server full, the
// line for the line, the Terms of Service guy (11 hours, disappointing ending), Mr. Fig's tycoon, the streamer who
// will not blink (nap), Dad's level-900 fishing confession, Mom's six-hour bath with three tablets, Dex's missing
// Touch Grass badge, Pip's goodbye to the elevator man (Ding... Ding... Ding), Juno's one item (Bubble Island), and Dex
// falling through the whole world into the grey "secret underwater level".
// Countdown: 22:00:00 → 20:00:00 with rolling jumps between montage beats.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const C = K.C;
const AC = require('./acting');
const SETS = require('./sets');
const X = require('./s04_env');
const { tf, TS, TFS, pop, at, shakeAll, clipTo, whip, smash, check, cross, stamp, listCard, slideIn, bloxy } = X;
const { FLOOR, SPOTS } = SETS;

const A = Array.from({ length: 21 }, (_, i) => L('04.' + i));
const T0 = K.V.scene('SC 04').start, END = K.V.scene('SC 05').start;
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;

// ---------------------------------------------------------------- cuts (all from the voice)
const c01 = T0;
const c02 = w(0, 'The') - 0.08;
const c03 = A[1].a - 0.1, tSpent = w(1, 'spent'), tRobux = w(1, 'Robux');
const c04 = w(1, "they'd") - 0.06, tTap = w(1, 'saving') - 0.1, tYears = w(1, 'years');
const c05 = A[2].a - 0.08, tFull = w(2, 'full');
const c06 = w(2, 'Every', 1) - 0.08;
const c07 = w(2, 'One') - 0.1, tFor = w(2, 'for'), tLine3 = w(2, 'line', 2);
const c08 = A[3].a - 0.08, tTerms = w(3, 'Terms'), tAll = w(3, 'All');
const c09 = w(3, 'It') - 0.1, tEleven = w(3, 'eleven'), tHours = w(3, 'hours');
const c10 = w(3, 'He') - 0.1, tEnding = w(3, 'ending'), tDisap = w(3, 'disappointing');
const c11 = A[4].a - 0.1, tCancel = w(4, 'canceled'), tTest = w(4, 'test');
const c12 = w(4, 'so') - 0.06, tTycoon = w(4, 'tycoon');
const c13 = A[5].a - 0.3, tChat = w(5, 'Chat'), tEver = w(5, 'EVER');
const c14 = w(5, 'I') - 0.1, tBlink = w(5, 'blink'), tSleep = w(5, 'sleep');
const c15 = w(5, 'I', 2) - 0.7, tNot3 = w(5, 'not', 2);
const c16 = w(5, 'okay') - 0.1, tNap = w(5, 'nap');
const c17 = A[6].a - 0.3, tKids = w(6, 'Kids'), tSit = w(6, 'Sit'), tSomething = w(6, 'something');
const c18 = A[7].a - 0.2, tNine = w(7, 'nine'), tFishing = w(7, 'fishing');
const c19 = A[8].a - 0.08, tDadW = w(8, 'Dad');
const c20 = w(8, 'rot') - 0.12, tBrain = w(8, 'brain');
const c21 = A[9].a - 0.1, tRelax = w(9, 'RELAXING');
const c22 = w(9, 'And') - 0.1, tFinally = w(9, 'finally');
const c23 = w(9, 'Golden') - 0.45, tGolden = w(9, 'Golden'), tFishW = w(9, 'Fish');
const c24 = A[10].a - 0.1;
const c25 = A[11].a - 0.15;
const c26 = w(11, 'For') - 0.1, tSix = w(11, 'six'), tSixH = w(11, 'hours');
const c27 = A[12].a - 0.1, tExcept = w(12, 'except');
const c28 = tExcept - 0.08, tSecret = w(12, 'secret');
const c29 = w(12, 'The', 1) - 0.08, tTouch = w(12, 'Touch');
const c30 = A[13].a - 0.1;
const c31 = w(13, 'I') - 0.08, tMap = w(13, 'map');
const c32 = w(13, 'Every', 1) - 0.06;
const c33 = w(13, 'Every', 2) - 0.06, tGrass = w(13, 'grass');
const c34 = A[14].a - 0.1;
const c35 = w(14, 'You') - 0.12;
const tD1 = w(15, 'Ding'), tD2 = w(15, 'Ding', 1), tD3 = w(15, 'Ding', 2);
const c36 = tD1 - 0.12, c37 = tD2 - 0.1, c38 = tD3 - 0.12;
const c39 = A[16].a - 0.1, tMe = w(16, 'me'), tOne = w(16, 'one'), tList16 = w(16, 'list');
const c40 = w(16, 'Finish') - 0.1;
const c41 = w(16, 'Before') - 0.1, tExisted = w(16, 'existed');
const c42 = A[17].a - 0.35, tFell = w(17, 'fell'), tWhole = w(17, 'whole');
const c43 = A[18].a - 0.08, tThats2 = w(18, "That's", 1), tSecretLvl = w(18, 'secret');
const c44 = A[19].a - 0.08, tNoWater = w(19, 'no'), tGrey = w(19, 'grey'), tForever = w(19, 'Forever');
const c45 = A[20].a - 0.1;

// ---------------------------------------------------------------- small helpers
const blinkK = (t, seed = 0) => { const b = (t + seed * 0.37) % 3.4; return b < 0.12 ? Math.sin((b / 0.12) * Math.PI) : 0; };
const fc = (name, t, seed = 0, extra = {}) => ({ name, blink: blinkK(t, seed), ...extra });
const kid = (i, pose) => K.draw.kid(i, { shade: true, shadow: true, ...pose });
const adult = (i, pose) => K.draw.adult(i, { shade: true, shadow: true, ...pose });
const juno = (t, pose, act) => actor('juno', t, pose, act);
const dex = (t, pose, act) => actor('dex', t, pose, act);
const pip = (t, pose, act) => actor('pip', t, pose, act);
const dad = (t, pose, act) => actor('dad', t, pose, act);
const mom = (t, pose) => actor('mom', t, pose);
const LINE_ = '#151515';
const rays = (t, c1, c2, cx = 960, cy = 540, sp = 14) => S.rect(-800, -600, 3520, 2280, 0, { fill: c1 }) + K.rays(cx, cy, 20, 2600, c2, 0.5, t * sp);
// a pencil (screen/world), tip at (x, y)
function pencil(x, y, rot = -35, s = 1) {
  const o = S.path('M0 0 L26 -14 L26 14 Z', ol('#F6CFAE', 4)) + S.path('M0 0 L9 -5 L9 5 Z', { fill: '#2A2246' }) +
    S.rect(26, -14, 260, 28, 3, ol('#FFC928', 4)) + S.path('M30 -5 L282 -5', ln(3, '#E9A50E')) + S.rect(286, -15, 30, 30, 3, ol('#C9CFD8', 4)) + S.rect(316, -15, 40, 30, 8, ol('#FF8FA8', 4));
  return S.g(o, tf(x, y, s, rot));
}
// little level-up / sticker badge
function lvlBadge(x, y, k, txt, col = '#7CFF6B', t = 0) {
  if (k <= 0) return '';
  let o = K.rays(0, 0, 12, 220, '#FFF4A8', 0.3, t * 40) + S.rect(-170, -70, 340, 140, 40, ol('#2A2246', 8)) + T(txt, 0, 26, 84, col);
  o += S.rect(-110, -112, 220, 50, 16, ol('#FFD21F', 5)) + TF('LEVEL UP!', 0, -78, 30, '#2A2246');
  return S.g(o, tf(x, y, ease.outBack(clamp(k, 0, 1))));
}
// "BLINKS: n" counter on the stream
function blinkCounter(n, k = 1, red = 0) {
  const o = S.rect(60, 150, 330, 74, 22, { fill: red > 0 ? SETS.mix('#1B1430', '#E8243C', red) : '#1B1430', opacity: 0.85, stroke: '#FFFFFF', 'stroke-width': 3 }) + T(`BLINKS: ${n}`, 225, 205, 52, '#FFFFFF');
  return S.g(o, `translate(225 187) scale(${f(k)}) translate(-225 -187)`);
}
// a speech-less "chat" pop bubble
function chatPop(x, y, txt, k, col = '#7CF7FF') {
  if (k <= 0) return '';
  const wd = txt.length * 26 + 70;
  return S.g(S.rect(-wd / 2, -40, wd, 80, 26, ol('#1B1430', 6)) + TF(txt, 0, 16, 44, col), tf(x, y, ease.outBack(clamp(k, 0, 1))));
}
// a magnifying glass (handle down-right), lens centre (x, y)
function magnifier(x, y, r, rot = 0) {
  return S.g(S.path(`M${f(r * 0.7)} ${f(r * 0.7)} L${f(r * 1.9)} ${f(r * 1.9)}`, ln(r * 0.42)) + S.path(`M${f(r * 0.75)} ${f(r * 0.75)} L${f(r * 1.85)} ${f(r * 1.85)}`, ln(r * 0.26, '#A86B3C')) +
    S.circle(0, 0, r, { fill: '#DFF6FF', opacity: 0.35, stroke: LINE_, 'stroke-width': r * 0.2 }) + S.circle(0, 0, r, { fill: 'none', stroke: '#C9CFD8', 'stroke-width': r * 0.1 }) + S.path(`M${f(-r * 0.5)} ${f(-r * 0.2)} Q${f(-r * 0.45)} ${f(-r * 0.5)} ${f(-r * 0.15)} ${f(-r * 0.55)}`, ln(r * 0.1, '#FFFFFF')), tf(x, y, 1, rot));
}

// ================================================================= SHOTS
// ---- 1. the list being written
function shList(t) {
  const cam = camKeys(t, [[c01, { zoom: 1.08, x: 0, y: 30 }], [c02, { zoom: 1.24, x: 30, y: 0 }]]);
  let wd = S.rect(-800, -600, 3520, 2280, 0, { fill: '#A86B3C' });
  let gr = '';
  for (let i = 0; i < 16; i++) gr += `M-800 ${-500 + i * 130 + Math.sin(i) * 20} Q960 ${-460 + i * 130} 2720 ${-520 + i * 130} `;
  wd += S.path(gr, ln(5, '#8A5530', 0.5));
  let p = S.rect(330, 50, 1260, 1060, 10, ol('#FFFDF4', 8));
  let d = '';
  for (let y = 340; y < 1100; y += 92) d += `M350 ${y} L1570 ${y} `;
  p += S.path(d, ln(4, '#A9CDF2')) + S.path('M470 60 L470 1100', ln(4, '#FF9A9A'));
  for (let i = 0; i < 6; i++) p += S.circle(395, 150 + i * 170, 20, { fill: '#A86B3C', stroke: '#8A5530', 'stroke-width': 3 });
  // title, written by the pencil
  const u = ease.inOut(seg(t, c01 + 0.05, w(0, 'list') + 0.12));
  const tx = 500 + u * 1050;
  p += clipTo(480, 120, Math.max(1, tx - 480), 220, T('THE LAST DAY LIST', 1015, 280, 118, '#2A2246'));
  // underline swoosh on "list"
  const us = seg(t, w(0, 'list') + 0.05, w(0, 'list') + 0.3);
  if (us > 0) p += S.path('M520 312 Q1000 336 1520 300', { fill: 'none', stroke: '#E8243C', 'stroke-width': 14, 'stroke-linecap': 'round', 'stroke-dasharray': '1100 1100', 'stroke-dashoffset': f(1100 * (1 - us)) });
  // numbered items + empty boxes
  for (let i = 0; i < 4; i++) {
    const k = pop(t, w(0, 'list') + 0.25 + i * 0.12, 0.25);
    if (k <= 0) continue;
    const y = 432 + i * 184;
    p += S.g(TF(`${i + 1}.`, 0, 22, 64, '#2A2246') + S.rect(70, -34, 70, 70, 10, ol('#FFFFFF', 6)) + S.path(`M180 10 q40 -30 80 0 t80 0 t80 0 t80 0 t80 0`, ln(7, '#B9B3A3')), tf(540, y, k));
  }
  // doodles: hard hat + clock
  p += S.g(S.path('M-60 10 Q-60 -60 0 -60 Q60 -60 60 10 Z', ol('#FFC928', 5)) + S.rect(-76, 4, 152, 20, 8, ol('#FFC928', 4)), tf(1440, 980, 0.8, 8));
  p += S.g(S.circle(0, 0, 50, ol('#FFFFFF', 5)) + S.path('M0 0 L0 -32 M0 0 L22 10', ln(6)) + TF('24h', 0, 84, 30, '#E8243C'), tf(1440, 560, 1, -6));
  let o = view(cam, S.g(wd + S.g(p, 'rotate(-2 960 560)'), null), 1);
  // pencil follows the writing
  if (u < 1) o += view(cam, pencil(tx, 250 + Math.sin(t * 38) * 22, -40, 1.1), 1);
  else o += view(cam, pencil(1500 + (t - w(0, 'list')) * 120, 330, -30, 1.1), 1);
  return o;
}
// ---- 2. a wall of everybody's lists
const WALL = [
  ['MOM', ['take a bath :)']], ['DAD', ['GOLDEN FISH!!!']], ['DEX', ['get EVERY badge']], ['PIP', ['ding', 'ding']], ['MR. FIG', ['cancel test', 'finish tycoon']],
  ['STREAMKING', ['NO BLINKING']], ['GRANDMA ROSE', ['beat grandson']], ['KID #4,201,337', ['buy the pet!!']], ['A DOG', ['learn "oof"']], ['BRENDA', ['go play now']],
  ['TOS GUY', ['read the Terms']], ['THE CAT', ['sleep']], ['GRANDPA OTTO', ['???']], ['JUNO', ['BUBBLE ISLAND']], ['EVERYONE', ['PLAY. MORE.']],
];
const WALL_ORDER = [7, 6, 8, 2, 12, 1, 3, 11, 13, 0, 4, 10, 14, 5, 9];
function shWall(t) {
  const tL = w(0, 'list', 1);
  const cam = camKeys(t, [[c02, { zoom: 2.3, x: 0, y: 0 }], [tL - 0.1, { zoom: 1.02, x: 0, y: 10 }], [c03, { zoom: 0.98, x: 0, y: 10 }]], ease.out);
  shakeAll(cam, t, [[tL, 0.35, 12]]);
  let o = S.rect(-800, -600, 3520, 2280, 0, { fill: '#C98A52' });
  let dots = '';
  for (let i = 0; i < 160; i++) dots += `M${f(hash(i * 3.3) * 2400 - 240)} ${f(hash(i * 7.1) * 1400 - 160)}h6v6h-6Z`;
  o += S.path(dots, { fill: '#8A5530', opacity: 0.5 });
  WALL_ORDER.forEach((idx, n) => {
    const col = idx % 5, row = Math.floor(idx / 5);
    const x = 960 + (col - 2) * 384, y = 540 + (row - 1) * 340;
    const k = idx === 7 ? 1 : pop(t, c02 + 0.1 + n * 0.06, 0.25);
    if (k <= 0) return;
    const [who, items] = WALL[idx];
    const card = listCard(0, 0, 0.5, items.map((s) => ({ txt: s })), { who, rot: (hash(idx * 3.1) - 0.5) * 12, size: 44, w: 600 });
    o += S.g(card + S.circle(0, -86, 12, ol('#E8243C', 4)), tf(x, y, k));
  });
  return view(cam, o, 1);
}
// ---- 3. piggy bank
function shPiggy(t) {
  const cam = camKeys(t, [[c03, { zoom: 1.25, x: -20, y: 40 }], [tSpent, { zoom: 1.12, x: -20, y: 60 }], [c04, { zoom: 1.05, x: -20, y: 50 }]]);
  shakeAll(cam, t, [[tSpent + 0.02, 0.5, 26]]);
  let wd = X.room(t, { wall: '#FFE1B0', stripe: '#FFD08A', floor: '#C98A52', floorY: 800, win: [1250, 170, 380, 300], sky: 0.15 });
  wd += S.rect(220, 200, 220, 160, 8, ol('#3FA9FF', 6)) + T('PETS', 330, 300, 60, '#FFFFFF', { stroke: LINE_, 'stroke-width': 8, 'paint-order': 'stroke' });
  wd += S.rect(160, 600, 300, 220, 10, ol('#FF8A6B', 6)) + S.rect(180, 640, 260, 20, 4, { fill: '#E8604A' }); // dresser
  const lift = ease.inOut(seg(t, c03, tSpent - 0.24)), slam = ease.in(seg(t, tSpent - 0.24, tSpent));
  const broke = seg(t, tSpent, tSpent + 0.6);
  const arms = broke > 0 ? 160 : slam > 0 ? lerp(172, 35, slam) : lerp(32, 172, lift);
  const py = broke > 0 ? 40 : slam > 0 ? lerp(-900, 40, slam) : lerp(-150, -900, lift);
  const jump = bump(t, tSpent + 0.05, tSpent + 0.5);
  const face = broke > 0 ? fc('rich', t, 3) : slam > 0 ? { name: 'scream' } : fc('determined', t, 3);
  const pig = { svg: X.piggy(0, py, 1.35, broke > 0 ? 0 : -6 + 20 * slam, broke), layer: 'front' };
  wd += kid(5, { x: 960, y: 1000, s: 0.64, armL: arms, armR: arms, face, lift: 40 * jump, sy: 1 + 0.06 * jump, props: broke > 0 ? [] : [pig] });
  if (broke > 0) wd += X.piggy(960, 1000 - 30 * 0.64, 1.35 * 0.64, 0, broke);
  wd += K.coinBurst(960, 990, t - tSpent, 30, 1300, 24, 5);
  if (t > tRobux) wd += K.coinRain(t - tRobux, 16, { y0: -200, y1: 1100, speed: 700, r: 22, seed: 4 });
  let o = view(cam, wd, 1);
  o += K.bang('SMASH!', 1380, 300, seg(t, tSpent, tSpent + 0.12) * (1 - seg(t, tSpent + 0.6, tSpent + 0.75)), 130, -10, '#FFD21F');
  o += smash(t, tSpent, 0.14, 0.7);
  return o;
}
// ---- 4. the pet, finally
function shPhone(t) {
  const cam = camKeys(t, [[c04, { zoom: 1.08, x: 0, y: 0 }], [c05, { zoom: 1.16, x: 20, y: -10 }]]);
  const bought = seg(t, tTap, tTap + 0.6);
  let wd = rays(t, '#5B2E9E', '#7A4BD1', 960, 520);
  // the kid peeking in from the left, heart eyes after the purchase
  wd += kid(5, { x: 420, y: 1390, s: 1.05, turn: 0.45, armL: 20, armR: 60, face: bought > 0.5 ? { name: 'love' } : fc('amazed', t, 5) });
  wd += SETS.screens('phone', 1000, 500, 0.8, (pw, ph) => X.petShop(pw, ph, t, bought), t);
  wd += X.cursor(1005, 690, 1.2, bump(t, tTap - 0.08, tTap + 0.15));
  if (bought > 0.5) for (let i = 0; i < 6; i++) { const a = (t - tTap - 0.3) * 1.2; if (a > 0 && a < 1) wd += S.path(K.F.heartPath(1000 + Math.cos(i * 1.1) * 300 * a, 400 - 200 * a + Math.sin(i * 2.3) * 120 * a, 22), ol('#FF4D7A', 4), { opacity: f(1 - a) }); }
  let o = view(cam, wd, 1);
  o += slideIn(t, c04 + 0.15, listCard(1560, 400, 0.6, [{ txt: 'buy the pet!!', k: seg(t, tYears, tYears + 0.3) }], { who: 'KID #4,201,337', rot: 6 }), 700);
  return o;
}
// ---- 5. every server full
function shServers(t) {
  const cam = camKeys(t, [[c05, { zoom: 1.0, x: 0, y: 0 }], [tFull, { zoom: 1.06, x: 0, y: 0 }], [c06, { zoom: 1.1, x: 0, y: 0 }]]);
  shakeAll(cam, t, [[tFull, 0.4, 16]]);
  const scroll = 2600 * ease.out(seg(t, c05, tFull));
  let click = 0;
  for (let i = 0; i < 6; i++) click = Math.max(click, bump(t, c05 + 0.25 + i * 0.22, c05 + 0.4 + i * 0.22));
  let o = view(cam, X.serverBrowser(t, scroll, click) + X.cursor(1600 + Math.sin(t * 9) * 6, 650, 1.1, click), 1);
  o += K.popup(960, 560, 960, 380, 'SERVER FULL', ['Every server is full.', 'Try again... later?'], seg(t, tFull - 0.05, tFull + 0.25), { size: 50, accent: '#E8243C' });
  return o;
}
// ---- 6. every obby had a line
function lineRow(t, x0, x1, y, s, seed, cam, opts = {}) {
  let o = '';
  const sp = 70 * s / 1.4;
  for (let i = 0, x = x0; x >= x1; i++, x -= sp) {
    const id = i + seed * 37;
    let pose = 'wait';
    if (hash(id * 1.3) < 0.08) pose = 'sleep';
    if (opts.cheerFront && i === 0) pose = 'cheer';
    o += bloxy(x + (hash(id) - 0.5) * 10, y + (i % 2) * 6, s, id, t, { pose, flip: hash(id * 2.1) < 0.3 });
  }
  return o;
}
function shLine(t) {
  const cam = camKeys(t, [[c06, { zoom: 1.0, x: 1200, y: 30 }], [c07, { zoom: 1.0, x: -350, y: 50 }]], ease.inOut);
  let wd = X.obbyWorld(t, { archX: 2300 });
  wd += lineRow(t, 2080, -1000, 840, 1.5, 1, cam, { cheerFront: true });
  wd += X.queueRope(-1100, 2140, 930, 250);
  wd += X.signPost(980, 980, 'WAIT TIME: 4 DAYS', 0.8, 3, '#FFD21F', '#2A2246', 48);
  return view(cam, wd, 1) + whip(t, c06, -1);
}
// ---- 7. the line for the line
function shLine2(t) {
  const cam = camKeys(t, [[c07, at(520, 600, 1.45)], [tFor - 0.05, at(520, 600, 1.5)], [tFor + 0.35, at(260, 1000, 0.66)], [c08, at(250, 1000, 0.64)]], ease.inOut);
  shakeAll(cam, t, [[tLine3, 0.4, 14]]);
  let wd = X.obbyWorld(t, { archX: 1900 });
  wd += lineRow(t, 1650, 560, 820, 1.3, 2, cam);
  wd += X.signPost(430, 840, 'LINE STARTS HERE', 0.9, -2, '#FFFDF4', '#2A2246', 50);
  wd += S.path('M520 430 L620 520 M620 520 L600 470 M620 520 L570 515', ln(14, '#E8243C'));
  // the second line, snaking away
  wd += lineRow(t, 420, -1150, 1080, 1.3, 5, cam);
  wd += X.queueRope(-1200, 480, 1150, 240);
  wd += lineRow(t, 800, -1150, 1340, 1.3, 9, cam);
  wd += X.signPost(-420, 1110, 'LINE FOR THE LINE', 1.25, 3, '#FFD21F', '#2A2246', 54);
  wd += X.signPost(1000, 1370, 'LINE FOR THE LINE FOR THE LINE', 0.85, -3, '#FF8FB8', '#2A2246', 46);
  return view(cam, wd, 1);
}
// ---- 8-10. the Terms of Service guy
const TOS = { x: 1000, y: 1000, s: 0.62, deskY: 760, stripX: 1430, ceil: -720 };
function tosRoom(t, sky, mugs = 0, pile = 0) {
  let wd = X.room(t, { wall: '#CAD6EE', stripe: '#BCCAE6', floor: '#7A6A8A', floorY: 860, win: [170, 180, 340, 300], sky });
  // ceiling + the hole the paper goes through
  wd += S.rect(-800, TOS.ceil - 400, 3520, 400, 0, { fill: '#E9E2D2' }) + S.rect(-800, TOS.ceil - 20, 3520, 30, 0, ol('#D9CFBA', 6));
  wd += S.path(`M${TOS.stripX - 170} ${TOS.ceil + 6} L${TOS.stripX - 120} ${TOS.ceil - 40} L${TOS.stripX - 60} ${TOS.ceil + 12} L${TOS.stripX} ${TOS.ceil - 30} L${TOS.stripX + 70} ${TOS.ceil + 8} L${TOS.stripX + 150} ${TOS.ceil - 36} L${TOS.stripX + 180} ${TOS.ceil + 6} Z`, { fill: '#2A2230' });
  wd += X.wallClock(700, 250, 66, sky * 11 + 9);
  wd += S.rect(1680, 300, 200, 150, 8, ol('#FFFFFF', 6)) + TF('RULE #1:', 1780, 362, 30, '#2A2246') + TF('READ IT', 1780, 404, 30, '#E8243C');
  // paper pile on the floor (grows)
  if (pile > 0) for (let i = 0; i < Math.ceil(pile * 9); i++) wd += S.path(`M${120 + (i % 2) * 20} ${980 - i * 30} l300 -10 l20 30 l-300 10 Z`, ol('#FFFDF4', 4));
  return wd;
}
function tosDesk(t, mugs = 0) {
  let o = S.rect(380, TOS.deskY, 1200, 40, 8, ol('#B87A44', 7)) + S.rect(400, TOS.deskY + 40, 1160, 300, 0, ol('#9A6238', 6));
  o += S.rect(TOS.stripX - 110, TOS.deskY - 90, 220, 90, 14, ol('#E3E6EE', 6)) + S.rect(TOS.stripX - 80, TOS.deskY - 70, 160, 16, 6, { fill: '#3A3F4E' }); // printer
  for (let i = 0; i < mugs; i++) o += S.g(S.rect(-28, -60, 56, 60, 8, ol(['#FF7A59', '#3FA9FF', '#FFD21F', '#3BD16F'][i % 4], 4)) + S.path('M28 -46 Q48 -40 28 -16', ln(6)), tf(450 + (i % 4) * 66, TOS.deskY - Math.floor(i / 4) * 62, 0.85));
  return o;
}
function tosStrip(t, scroll) {
  // fan-fold paper from the printer up through the ceiling + the drape to his hands
  let o = X.tosScroll(TOS.stripX, TOS.deskY - 80, TOS.ceil - 200, 260, t, { scroll });
  // the band that runs from the strip to the sheet in his hands
  o += S.path(`M${TOS.stripX - 130} ${TOS.deskY - 230} L1150 ${TOS.deskY - 150} L1150 ${TOS.deskY - 40} L${TOS.stripX - 130} ${TOS.deskY - 100} Z`, ol('#F4F0E2', 6));
  return o;
}
function heldSheet(x, y, s, t, lines, scroll = 0) {
  let o = S.rect(-210, -150, 420, 300, 8, ol('#FFFDF4', 6));
  let d = '';
  for (let i = 0; i < 9; i++) d += `M-180 ${-110 + i * 28 - (scroll % 28)} L${170 - hash(i + Math.floor(scroll / 28)) * 90} ${-110 + i * 28 - (scroll % 28)} `;
  o += clipTo(-200, -140, 400, 280, S.path(d, ln(6, '#B9B3A3')));
  if (lines) o += lines;
  return S.g(o, tf(x, y, s));
}
function tosGuy(t, x, y, s, face, extra = {}) {
  return adult(11, { x, y, s, armL: 62, armR: 62, face, headRot: extra.headRot || 0, bodyY: extra.bodyY || 0, ...extra });
}
function shTOS(t) {
  const cam = camKeys(t, [[c08, at(1010, 560, 1.85)], [tAll - 0.05, at(1040, 560, 1.7)], [tAll + 0.9, at(1250, -330, 1.0)], [c09, at(1250, -360, 0.98)]], ease.inOut);
  const scroll = (t - c08) * 140;
  let wd = tosRoom(t, 0.12) + tosStrip(t, scroll);
  const look = Math.sin(t * 7) * 0.7;
  wd += tosGuy(t, TOS.x, TOS.y, TOS.s, fc('neutral', t, 2, { eyes: { look: [look, 0.5] } }), { headRot: look * 4 });
  const ti = pop(t, tTerms - 0.05, 0.3);
  const title = ti > 0 ? S.g(T('TERMS OF', 0, -60, 60, '#2A2246') + T('SERVICE', 0, 10, 72, '#E8243C') + TF('page 1 of 94,021', 0, 70, 34, '#5A6070'), `scale(${f(ti)})`) : '';
  wd += tosDesk(t, 1) + heldSheet(TOS.x, TOS.deskY - 40, 0.8, t, title ? S.rect(-200, -140, 400, 230, 6, { fill: '#FFFDF4' }) + title : '', scroll);
  return view(cam, wd, 1);
}
function shHours(t) {
  const u = seg(t, c09, c10);
  const cam = camKeys(t, [[c09, at(960, 420, 0.92)], [c10, at(980, 440, 1.0)]]);
  const sky = 0.5 - 0.5 * Math.cos(u * Math.PI * 2.4);
  let wd = tosRoom(t, sky, 0, u) + tosStrip(t, (t - c09) * 900);
  const tired = clamp(u * 1.4, 0, 1);
  wd += tosGuy(t, TOS.x, TOS.y, TOS.s, { name: tired > 0.5 ? 'sleepy' : 'neutral', mouth: 'line', eyes: { upper: 0.2 + 0.4 * tired, look: [Math.sin(t * 22) * 0.8, 0.5] }, fx: tired > 0.3 ? ['eyebags'] : [] }, { headRot: Math.sin(t * 22) * 5 });
  wd += tosDesk(t, Math.floor(u * 9)) + heldSheet(TOS.x, TOS.deskY - 40, 0.8, t, '', (t - c09) * 900);
  let o = view(cam, wd, 1);
  // night darkening of the room
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#10183A', opacity: f(0.42 * sky) });
  o += K.bang('+11 HOURS', 560, 210, seg(t, tHours, tHours + 0.15), 100, -8, '#FFD21F');
  return o;
}
function shEnding(t) {
  const cam = camKeys(t, [[c10, at(1020, 590, 1.85)], [c11, at(1020, 580, 2.0)]]);
  let wd = tosRoom(t, 0.2, 9, 1) + tosStrip(t, 0);
  const meh = t > tDisap - 0.1;
  wd += tosGuy(t, TOS.x, TOS.y, TOS.s, { name: meh ? 'sad' : 'deadpan', mouth: meh ? 'wavy' : 'line', fx: ['eyebags'], blink: blinkK(t, 4) }, { armL: 70, armR: 70, headRot: meh ? -6 : 0 });
  const last = T('THE END.', 0, -20, 74, '#2A2246') + TF('Thanks for reading :)', 0, 50, 34, '#5A6070');
  wd += tosDesk(t, 9) + heldSheet(TOS.x, TOS.deskY - 40, 0.8, t, S.rect(-200, -140, 400, 280, 6, { fill: '#FFFDF4' }) + TF('...and that\'s it.', 0, -90, 34, '#8A8A99') + last);
  let o = view(cam, wd, 1);
  const k = pop(t, tDisap, 0.3);
  if (k > 0) o += S.g(S.rect(-250, -80, 500, 160, 30, ol('#2A2246', 7)) + T('★☆☆☆☆', 0, 30, 90, '#FFD21F') + TF('"weak ending"', 0, 110, 36, '#FFFFFF', { stroke: LINE_, 'stroke-width': 6, 'paint-order': 'stroke' }), tf(1520, 330, k, 6));
  o += slideIn(t, tEnding - 0.2, listCard(330, 330, 0.5, [{ txt: 'read the Terms', k: seg(t, tEnding, tEnding + 0.3) }], { who: 'TOS GUY', rot: -5 }), -700);
  return o;
}
// ---- 11-12. Mr. Fig
function shClass(t) {
  const cam = camKeys(t, [[c11, at(960, 560, 1.0)], [tCancel, at(980, 520, 1.08)], [c12, at(1000, 500, 1.14)]]);
  const cancel = seg(t, tCancel, tCancel + 0.75);
  const Lc = SETS.classroom.layers(t, { cancel });
  const T_ = SPOTS.classroom.teacher;
  const swipe = bump(t, tCancel - 0.1, tCancel + 0.8), push = bump(t, tTest + 0.1, c12 + 0.1);
  const tface = push > 0.2 ? fc('smug', t, 6, { eyes: { type: 'closed' } }) : swipe > 0 ? fc('determined', t, 6) : fc('neutral', t, 6);
  let wd = Lc.mid;
  wd += K.draw.teacher({ x: T_.x, y: T_.y, s: T_.s, turn: swipe > 0.2 ? -0.6 : -0.1, armL: 20 + 110 * swipe, armR: 15 + 140 * push, face: tface, shade: true });
  if (push > 0.4) wd += K.F.sparkle(T_.x - 30, T_.y - T_.s * 740, 26);
  // two students cheering (backs to camera)
  const cheer = seg(t, tTest - 0.05, tTest + 0.1);
  for (const [i, x] of [[2, 210], [8, 1710]]) wd += kid(i, { x, y: 1210, s: 0.62, view: 'back', armL: lerp(15, 160, cheer), armR: lerp(15, 160, cheer), lift: 26 * Math.abs(Math.sin((t - tTest) * 10)) * cheer });
  wd += Lc.fg;
  return view(cam, Lc.bg, 0.5) + view(cam, wd, 1);
}
function shTycoon(t) {
  const sl = ease.out(seg(t, c12, c12 + 0.2));
  const done = seg(t, tTycoon, tTycoon + 0.35);
  const money = lerp(8200000, 9999999, ease.in(seg(t, c12, tTycoon))) + (done > 0 ? 1 : 0);
  // left: Mr. Fig's face lit green by the screen
  let left = S.rect(0, 0, 1100, 1080, 0, { fill: '#2F4A3A' }) + S.circle(560, 520, 520, { fill: 'url(#s04glowGreen)' });
  left += K.draw.teacher({ x: 520, y: 1610, s: 1.42, turn: 0.15, armL: 10, armR: 10, face: done > 0 ? { name: 'rich' } : fc('sneaky', t, 7, { mouth: 'grin', eyes: { look: [0.9, 0.2] } }), headRot: 3 * Math.sin(t * 3), shade: true });
  left += S.circle(560, 560, 420, { fill: 'url(#s04glowGreen)', opacity: 0.5 });
  let right = S.rect(820, 0, 1100, 1080, 0, { fill: '#10203A' }) + S.g(X.tycoon(1000, 1080, t, money, done), 'translate(1480 570) scale(0.9)');
  if (done > 0) right += K.coinBurst(1480, 1080, t - tTycoon, 26, 1500, 26, 8);
  let o = clipTo(0, 0, 1920, 1080, S.g(right, `translate(${f(600 * (1 - sl))} 0)`));
  const lp = 'M0 0 L1040 0 L900 1080 L0 1080 Z';
  const id = S.uid('s04lp');
  o += S.clipDef(id, S.path(lp)) + S.g(S.g(left, `translate(${f(-600 * (1 - sl))} 0)`), null, { 'clip-path': `url(#${id})` });
  o += S.path('M1040 -10 L900 1090', ln(26, LINE_)) + S.path('M1040 -10 L900 1090', ln(14, '#FFFFFF'));
  o += slideIn(t, c12 + 0.1, listCard(250, 250, 0.42, [{ txt: 'cancel test', k: 1 }, { txt: 'finish tycoon', k: seg(t, tTycoon + 0.1, tTycoon + 0.4) }], { who: 'MR. FIG', rot: -5 }), -600);
  return o + smash(t, tTycoon, 0.12, 0.5);
}
// ---- 13-16. the streamer
function streamFrame(t, cam, pose, act, o = {}) {
  const Ls = SETS.streamerRoom.layers(t, { overlay: true, viewers: o.viewers, juice: o.juice ?? 14, lightOn: o.lightOn });
  const P = SPOTS.streamerRoom.streamer;
  let wd = Ls.mid + actor('streamer', t, { x: P.x, y: P.y, s: P.s, ...pose }, act) + Ls.fg;
  return view(cam, wd, 1);
}
function shStream1(t) {
  const cam = camKeys(t, [[c13, at(960, 560, 1.0)], [tEver, at(960, 540, 1.1)], [c14, at(960, 530, 1.14)]]);
  shakeAll(cam, t, [[tEver, 0.5, 22]]);
  const lean = ease.out(seg(t, tChat - 0.05, tChat + 0.2)) * (1 - ease.inOut(seg(t, tChat + 0.5, tChat + 1.0)));
  const viewers = 1204551 + Math.floor((t - c13) * 9000) + (t > tEver ? 600000 : 0);
  let o = streamFrame(t, cam, { s: 0.62 + 0.1 * lean, y: 1040 + 40 * lean, lift: 30 * bump(t, tEver, tEver + 0.4) }, { energy: 1.7 }, { viewers });
  o += K.bang('EVER!', 1240, 300, seg(t, tEver, tEver + 0.12), 160, -10, '#FFD21F');
  o += smash(t, tEver, 0.12, 0.5);
  return o;
}
function shStream2(t) {
  const cam = camKeys(t, [[c14, at(960, 560, 2.5)], [tSleep, at(960, 555, 2.7)], [c15, at(960, 545, 3.0)]]);
  shakeAll(cam, t, [[tSleep + 0.05, 0.4, 26]]);
  const slap = bump(t, tSleep - 0.05, tSleep + 0.3);
  const twitch = (Math.floor(t * 9) % 5 === 0 ? 1 : 0) * Math.sin(t * 90) * 3;
  const face = { name: 'shocked', eyes: { pupil: 0.38 }, fx: slap > 0 || t > tSleep ? ['blush', 'sweat'] : ['sweat'] };
  let o = streamFrame(t, cam, { face, armL: 10 + 150 * slap, armR: 10 + 150 * slap, headRot: twitch }, { arms: false, energy: 1.2 }, { viewers: 1804551 + Math.floor((t - c14) * 7000) });
  o += blinkCounter(0);
  o += K.bang('SLAP!', 1300, 380, seg(t, tSleep, tSleep + 0.1) * (1 - seg(t, tSleep + 0.5, tSleep + 0.6)), 150, 8, '#FF8FB8');
  o += smash(t, tSleep, 0.1, 0.45);
  return o;
}
function shStream3(t) {
  const cam = camKeys(t, [[c15, at(960, 600, 1.25)], [c16, at(960, 590, 1.4)]]);
  const yawn = seg(t, tNot3 + 0.35, tNot3 + 0.6) * (1 - seg(t, c16 - 0.15, c16));
  const droop = 0.5 + 0.5 * Math.sin((t - c15) * 1.6);
  const face = { name: 'sleepy', eyes: { upper: yawn > 0.3 ? 1 : 0.55 + 0.25 * droop }, fx: ['eyebags'], ...(yawn > 0.3 ? { mouth: 'yawn' } : {}) };
  let o = streamFrame(t, cam, { face, armL: 10 + 150 * yawn, armR: 10 + 150 * yawn, headRot: -6 * droop, bodyY: 10 * droop }, { arms: false, energy: 0.4 }, { viewers: 980000 - Math.floor((t - c15) * 40000), juice: 21, lightOn: false });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#0E0A2A', opacity: 0.4 });
  o += blinkCounter(0);
  return o;
}
function shStream4(t) {
  const cam = camKeys(t, [[c16, at(960, 600, 1.3)], [tNap, at(960, 620, 1.22)], [c17, at(960, 640, 1.16)]]);
  shakeAll(cam, t, [[tNap + 0.2, 0.35, 18]]);
  const fall = ease.in(seg(t, tNap - 0.05, tNap + 0.25));
  const face = { name: 'sleepy', eyes: { upper: lerp(0.75, 1, fall) }, fx: ['eyebags'] };
  let o = streamFrame(t, cam, { face, rot: -70 * fall, rotY: -300, bodyY: 120 * fall, armL: 20, armR: 20 + 40 * fall }, { arms: false, energy: 0.3 }, { viewers: 760000, juice: 21, lightOn: false });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#0E0A2A', opacity: 0.4 });
  if (t > tNap + 0.25) o += view(cam, C.zzz(t, 640, 760), 1);
  o += K.bang('THUNK', 760, 760, seg(t, tNap + 0.2, tNap + 0.3) * (1 - seg(t, tNap + 0.8, tNap + 0.9)), 110, -6, '#FFFFFF');
  const b1 = t > tNap + 0.25;
  o += blinkCounter(b1 ? 1 : 0, 1 + 0.25 * bump(t, tNap + 0.25, tNap + 0.6), b1 ? 1 : 0);
  o += slideIn(t, tNap - 0.6, listCard(1500, 420, 0.5, [{ txt: 'NO BLINKING', x: seg(t, tNap + 0.3, tNap + 0.6) }, { txt: 'NO SLEEP', x: seg(t, tNap + 0.45, tNap + 0.75) }], { who: 'xX_StreamKing_Xx', rot: 5 }), 700);
  return o;
}
// ---- 17-23. Dad's confession (living room, evening)
const LR = { juno: 800, pip: 1085, dad: 1560, seatY: 908, seatS: 0.55, dadY: 1010, dadS: 0.64 };
function living(t, cam, seated, standing, opts = {}) {
  const Ll = SETS.livingRoom.layers(t, { time: 'evening', ...opts });
  return view(cam, Ll.bg, 0.5) + view(cam, Ll.mid + seated + Ll.seat + standing, 1) + view(cam, Ll.light, 1);
}
function sitJuno(t, pose = {}, act = {}) { return juno(t, { x: LR.juno, y: LR.seatY, s: LR.seatS, ...pose }, act); }
function sitPip(t, pose = {}, act = {}) { return pip(t, { x: LR.pip, y: LR.seatY, s: LR.seatS, ...pose }, act); }
function paperProp(t, open, s = 1, shake = 0) {
  // newspaper in body space; open 1 = up in front of the face, 0 = folded down at the waist
  const y = lerp(-400, -760, open), sc = lerp(0.42, 0.95, open) * s;
  return { svg: S.g(SETS.newspaper(0, 0, 1, t, { shake }), `translate(0 ${f(y)}) scale(${f(sc * lerp(0.6, 1, open))} ${f(sc)})`), layer: 'front' };
}
function laptopProp(t, k, screenFn, y = -300, s = 0.6, rot = 0) {
  if (k <= 0) return null;
  return { svg: S.g(SETS.laptop(0, 0, 1, screenFn), `translate(0 ${f(y)}) rotate(${f(rot)}) scale(${f(s * ease.outBack(clamp(k, 0, 1)))})`), layer: 'front' };
}
const dadGame = (t, o = {}) => (w_, h_) => X.fishGame(w_, h_, t, { fish: 1, ...o });
function shDad1(t) {
  const cam = camKeys(t, [[c17, at(1120, 600, 1.06)], [tSomething - 0.2, at(1260, 560, 1.18)], [c18, at(1420, 520, 1.42)]]);
  const open = 1 - ease.inOut(seg(t, tKids - 0.1, tKids + 0.35));
  const glance = bump(t, tSit, tSit + 1.1);
  let seated = sitJuno(t, { face: fc('neutral', t, 1, { eyes: { look: glance > 0.3 ? [0.9, 0] : [0.9, -0.1] } }), turn: 0.25 }, {});
  seated += sitPip(t, { face: glance > 0.3 ? fc('confused', t, 2, { eyes: { look: [-0.9, 0] } }) : fc('neutral', t, 2, { eyes: { look: [0.9, 0] } }), turn: 0.2, armL: 10 + 30 * glance, armR: 10 + 30 * glance, lean: -4 * glance });
  const standing = dad(t, { x: LR.dad, y: LR.dadY, s: LR.dadS, turn: -0.3, armL: 40, armR: 40, props: [paperProp(t, open)] }, { arms: false, energy: 0.6 });
  return living(t, cam, seated, standing);
}
function shDad2(t) {
  const cam = camKeys(t, [[c18, at(1560, 470, 2.05)], [tFishing - 0.1, at(1560, 500, 1.95)], [tFishing + 0.3, at(1560, 560, 1.6)], [c19, at(1560, 570, 1.55)]]);
  const lap = seg(t, tFishing - 0.1, tFishing + 0.3);
  const props = [paperProp(t, 0, 0.9)];
  const lp = laptopProp(t, lap, dadGame(t), -330, 0.62);
  if (lp) props.push(lp);
  const standing = dad(t, { x: LR.dad, y: LR.dadY, s: LR.dadS, turn: -0.15, armL: 30 + 30 * lap, armR: 30 + 30 * lap, face: { name: 'sad', fx: ['sweat', 'blush'] }, headRot: -6, props }, { arms: false, energy: 0.6 });
  let o = living(t, cam, sitJuno(t) + sitPip(t), standing);
  o += lvlBadge(560, 330, seg(t, tNine, tNine + 0.3), 'LVL 900', '#7CFF6B', t);
  return o;
}
function shJuno1(t) {
  const cam = camKeys(t, [[c19, at(930, 600, 1.9)], [c20, at(900, 590, 2.05)]]);
  shakeAll(cam, t, [[tDadW, 0.3, 10]]);
  const up = bump(t, tDadW - 0.05, tDadW + 0.4);
  let seated = sitJuno(t, { turn: 0.35, armR: 95, armL: 30, lift: 30 * up }, { arms: false, energy: 1.4 });
  seated += sitPip(t, { turn: 0.3, face: fc('shocked', t, 2, { fx: [], eyes: { look: [0.9, 0] } }), armL: 25, armR: 25 });
  return living(t, cam, seated, '');
}
function shPaper(t) {
  const cam = camKeys(t, [[c20, at(960, 560, 1.0)], [c21, at(960, 600, 1.16)]]);
  shakeAll(cam, t, [[tBrain, 0.35, 12]]);
  let wd = rays(t, '#F5CB86', '#FFE0A8', 960, 600, 10);
  wd += dad(t, { x: 980, y: 1440, s: 1.55, turn: -0.1, face: fc('nervous', t, 3, { eyes: { look: [0.6, -0.4] } }), armL: 20, armR: 20 }, { arms: false });
  wd += S.g(SETS.laptop(0, 0, 1, dadGame(t)), tf(1500, 900, 1.0, 12));
  wd += SETS.newspaper(940, 720, 2.15, t, { shake: bump(t, tBrain - 0.05, tBrain + 0.4) });
  return view(cam, wd, 1);
}
function shDad3(t) {
  const cam = camKeys(t, [[c21, at(1540, 520, 1.6)], [tRelax, at(1540, 500, 1.75)], [c22, at(1540, 500, 1.8)]]);
  shakeAll(cam, t, [[tRelax, 0.6, 22]]);
  const zen = seg(t, tRelax - 0.05, tRelax + 0.05) * (1 - seg(t, c22 - 0.25, c22 - 0.1));
  const yell = bump(t, tRelax - 0.05, tRelax + 0.9);
  const lp = laptopProp(t, 1, dadGame(t), -360, 0.66, -4);
  const standing = dad(t, { x: LR.dad, y: LR.dadY, s: LR.dadS, turn: -0.1, armL: 40 + 80 * yell, armR: 38, lean: -3 * yell, props: [lp] }, { arms: false, energy: 1.6 });
  let o = living(t, cam, sitJuno(t) + sitPip(t), standing);
  if (zen > 0) {
    // the irony: a calm spa backdrop behind the screaming dad
    let z = S.rect(0, 0, 1920, 1080, 0, { fill: '#BFE8E0' }) + S.circle(960, 360, 300, { fill: '#FFE9F2' });
    for (let i = 0; i < 5; i++) z += S.ellipse(960, 820, 200 + i * 160 + ((t * 120) % 160), 40 + i * 30, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 6, opacity: 0.6 });
    for (let i = 0; i < 6; i++) z += S.g(S.path('M0 0 Q-40 -60 0 -110 Q40 -60 0 0 Z', ol('#FF9EC4', 5)), tf(960, 820, 1, -75 + i * 30));
    z += S.circle(960, 800, 30, ol('#FFD21F', 5)) + TF('~ relaxing ~', 960, 200, 60, '#5AA89A');
    const dadOnly = view(cam, dad(t, { x: LR.dad, y: LR.dadY, s: LR.dadS, turn: -0.1, armL: 40 + 80 * yell, armR: 38, lean: -3 * yell, face: { name: 'angry', fx: ['anger'] }, props: [lp] }, { arms: false, energy: 1.6 }), 1);
    o = S.g(z, null, { opacity: f(zen) }) + (zen >= 1 ? dadOnly : o + S.g(z + dadOnly, null, { opacity: f(zen) }));
  }
  o += K.bang('RELAXING!', 620, 300, seg(t, tRelax, tRelax + 0.12), 150, -8, '#FF5A5A');
  return o;
}
function shDad4(t) {
  const cam = camKeys(t, [[c22, at(1560, 470, 2.1)], [c23, at(1560, 450, 2.45)]], ease.linear);
  const lp = laptopProp(t, 1, dadGame(t), -330, 0.55, -14);
  const sob = Math.sin(t * 14) * 3 * seg(t, tFinally - 0.3, tFinally);
  const standing = dad(t, { x: LR.dad, y: LR.dadY, s: LR.dadS, turn: -0.1, face: { name: 'crying' }, armL: 70, armR: 60, headRot: 10 + sob, props: [lp] }, { arms: false, energy: 0.8 });
  return living(t, cam, sitJuno(t) + sitPip(t), standing);
}
function shFish(t) {
  const cam = camKeys(t, [[c23, at(960, 540, 1.0)], [tFishW, at(1040, 560, 1.1)], [c24, at(1050, 560, 1.13)]]);
  const jump = seg(t, tGolden - 0.15, tFishW + 0.55);
  let o = view(cam, S.g(X.fishGame(1920, 1080, t, { fish: 1, jump, wink: t > tFishW && t < tFishW + 0.35 ? 1 : 0 }), 'translate(960 540)'), 1);
  o += slideIn(t, c23 + 0.25, listCard(330, 600, 0.55, [{ txt: 'catch the' }, { txt: 'GOLDEN FISH' }], { who: 'DAD', rot: -5 }), -700);
  return o;
}
// ---- 24-26. Mom's bath
function towelProp() {
  // draped over the forward (side view) arm, with three tablets peeking out
  let o = S.rect(-120, -470, 30, 150, 6, ol('#FF8FA8', 4)) + S.rect(-150, -470, 80, 34, 8, ol('#FF8FA8', 5));
  o += S.rect(-200, -440, 170, 22, 5, ol('#2C303C', 4)) + S.rect(-196, -418, 170, 22, 5, ol('#5BC0EB', 4)) + S.rect(-204, -396, 170, 22, 5, ol('#2C303C', 4));
  o += S.path('M-210 -400 Q-150 -480 -60 -430 L-60 -330 Q-150 -300 -210 -330 Z', ol('#FFB4C8', 6)) + S.path('M-190 -380 L-80 -380 M-190 -350 L-80 -350', ln(5, '#FFFFFF', 0.7));
  return { svg: o, layer: 'front' };
}
function shMom1(t) {
  const u = seg(t, c24, c25);
  const mx = lerp(1060, 470, u);
  const cam = camKeys(t, [[c24, at(1040, 560, 1.12)], [c25, at(560, 560, 1.12)]], ease.linear);
  const Ls = SETS.atticStairs.layers(t, {});
  const m = actor('mom', t, { x: mx, y: 1000, s: 0.62, view: 'side', ...AC.walk(t * 9, 0.8), face: { name: 'happy', eyes: { type: 'closed' } }, props: [towelProp()] });
  let o = view(cam, Ls.mid + m, 1) + view(cam, Ls.fg, 1.15) + view(cam, Ls.light, 1);
  o += slideIn(t, c24 + 0.5, listCard(1540, 360, 0.55, [{ txt: 'take a bath :)' }], { who: 'MOM', rot: 4 }), 700);
  return o;
}
function bathInside(t, opts, momFace) {
  const Lb = SETS.bathroom.layers(t, opts);
  const M = SPOTS.bathroom.mom;
  return Lb.mid + actor('mom', t, { x: M.x, y: M.y, s: M.s, face: momFace, headRot: 3 * Math.sin(t * 2) }) + Lb.fg + Lb.light;
}
function shMom2(t) {
  const cam = camKeys(t, [[c25, at(960, 480, 1.0)], [c26, at(960, 470, 1.2)]], ease.linear);
  const look = [-0.85, 0, 0.85][Math.floor(t * 3) % 3];
  const inside = bathInside(t, { tablets: 3 }, fc('happy', t, 5, { eyes: { look: [look, 0.7] } }));
  return view(cam, SETS.bathroom.window(t, {}, inside), 1);
}
function shMom3(t) {
  const cam = camKeys(t, [[c26, at(760, 240, 2.6)], [tSixH - 0.05, at(760, 250, 2.4)], [tSixH + 0.3, at(960, 520, 1.12)], [c27, at(960, 520, 1.08)]], ease.inOut);
  const hrs = 6 * ease.inOut(seg(t, tSix - 0.15, tSixH + 0.2));
  const inside = bathInside(t, { tablets: 3, clock: hrs + 0.0001 }, fc('joy', t, 5, { fx: ['blush'] }));
  let o = view(cam, inside, 1);
  o += slideIn(t, tSixH + 0.2, listCard(1560, 330, 0.5, [{ txt: 'take a bath :)', k: seg(t, tSixH + 0.4, tSixH + 0.7) }], { who: 'MOM', rot: 4 }), 700);
  return o;
}
// ---- 27-33. Dex's missing badge
function dexFrame(t, cam, dexSvg, opts = {}) {
  const Ld = SETS.dexRoom.layers(t, opts);
  return view(cam, Ld.mid + dexSvg, 1);
}
const DEXP = { x: 560, y: 1000, s: 0.62 };
function shDex1(t) {
  const cam = camKeys(t, [[c27, at(1250, 420, 1.35)], [c28, at(800, 520, 1.1)]], ease.inOut);
  const pres = ease.out(seg(t, c27 + 0.6, c27 + 1.1));
  const d = dex(t, { ...DEXP, turn: 0.3, armL: 14, armR: 14 + 66 * pres, face: fc('smug', t, 4) }, { arms: false, energy: 0.6, face: 'smug' });
  return dexFrame(t, cam, d);
}
function shDex2(t) {
  const E_ = SPOTS.dexRoom.emptyFrame;
  const cam = camKeys(t, [[c28, at(E_.x, E_.y + 10, 2.4)], [tSecret - 0.05, at(E_.x, E_.y + 10, 2.7)], [tSecret + 0.2, at(E_.x, E_.y + 5, 3.5)], [c29, at(E_.x, E_.y + 5, 3.6)]]);
  shakeAll(cam, t, [[tSecret, 0.3, 8]]);
  let o = dexFrame(t, cam, '');
  const fl = 0.5 + 0.5 * Math.sin(t * 17);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#000', opacity: f(0.1 * fl * seg(t, tSecret, tSecret + 0.2)) });
  return o + whip(t, c28, 1);
}
function shDex3(t) {
  const cam = camKeys(t, [[c29, at(600, 470, 2.25)], [c30, at(620, 470, 2.4)]]);
  const d = dex(t, { ...DEXP, turn: 0.3, armL: 20, armR: 20 }, { energy: 1.2 });
  let o = dexFrame(t, cam, d, { spot: true });
  const k = pop(t, tTouch, 0.35);
  if (k > 0) {
    let b = K.rays(0, 0, 14, 300, '#BFFFC8', 0.25, t * 30) + S.circle(0, 0, 150, { fill: '#1A2560', stroke: '#7CFF6B', 'stroke-width': 10, 'stroke-dasharray': '22 14' });
    b += S.g(S.path('M-60 30 L-46 -40 L-28 22 L-8 -64 L10 22 L30 -44 L44 26 L60 30 Z', { fill: '#2E9E4E', opacity: 0.45 }), 'translate(0 10)');
    b += S.rect(-40, -10, 80, 66, 12, ol('#C9CFD8', 6)) + S.path('M-24 -10 Q-24 -50 0 -50 Q24 -50 24 -10', ln(12, '#C9CFD8')) + S.circle(0, 22, 9, { fill: LINE_ });
    b += T('???', 0, -90, 60, '#FFE14D', { stroke: LINE_, 'stroke-width': 8, 'paint-order': 'stroke' }) + TS('TOUCH GRASS', 0, 230, 64, '#7CFF6B');
    o += S.g(b, tf(1400, 470, k));
  }
  return o;
}
function shDex4(t) {
  const cam = camKeys(t, [[c30, at(700, 560, 1.45)], [c31, at(700, 560, 1.55)]]);
  shakeAll(cam, t, [[c30 + 0.1, 0.8, 7]]);
  const d = dex(t, { ...DEXP, turn: 0, armL: 168, armR: 168, headRot: 8 * Math.sin(t * 16), lift: 10 * Math.abs(Math.sin(t * 8)) }, { arms: false, energy: 1.6 });
  let o = dexFrame(t, cam, d);
  o += K.bang('?!', 860, 280, pop(t, c30 + 0.2, 0.3), 160, 10, '#FFE14D');
  return o;
}
function dexAvatar(x, y, s, t, opts = {}) {
  let o = SETS.avatar(x, y, s, t, { who: 'dex', ...opts });
  if (opts.glass !== false) o += magnifier(x + 34 * s, y - 70 * s, 16 * s, 0);
  return o;
}
function shMaps(t) {
  const P = [['desert', 0, 0], ['snow', 960, 0], ['city', 0, 540], ['lava', 960, 540]];
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#FFFFFF' });
  P.forEach(([kind, px, py], i) => {
    const t0 = c31 + i * 0.22;
    const k = ease.out(seg(t, t0, t0 + 0.18));
    if (k <= 0) return;
    let pan = S.g(X.gameMap(kind, t), 'scale(0.5)');
    const ax = 200 + ((t - t0) * 320) % 600;
    pan += dexAvatar(ax, 420, 1.6, t, { pose: Math.floor(t * 4 + i) % 2 ? 'stand' : 'jump', flip: false });
    pan += stampX(760, 120, seg(t, t0 + 0.35, t0 + 0.5));
    o += clipTo(px + 8, py + 8, 944, 524, S.g(pan, `translate(${f(px)} ${f(py + (1 - k) * 540)})`));
  });
  return o;
}
function stampX(x, y, k) { return cross(x, y, 120, k); }
function shCave(t) {
  const cam = camKeys(t, [[c32, at(960, 560, 1.15)], [c33, at(980, 560, 1.25)]]);
  let wd = X.gameMap('cave', t);
  const ax = 760 + (t - c32) * 160;
  wd += dexAvatar(ax, 830, 3.2, t, { pose: 'stand' });
  // flashlight cone
  wd += S.path(`M${ax + 110} ${830 - 220} L1900 380 L1900 900 Z`, { fill: '#FFF4C8', opacity: 0.22 });
  for (let i = 0; i < 5; i++) { const bx = 300 + i * 340 + Math.sin(t * 3 + i) * 60, by = 260 + Math.sin(t * 5 + i * 2) * 50, fl = Math.sin(t * 25 + i) * 12; wd += S.path(`M${bx - 40} ${by + fl} Q${bx - 20} ${by - 10} ${bx} ${by + 6} Q${bx + 20} ${by - 10} ${bx + 40} ${by + fl}`, ol('#2A2238', 4)); }
  let o = view(cam, wd, 1);
  o += K.bang('?', ax * 1.0 + 140, 360, pop(t, c32 + 0.25, 0.3), 140, 10, '#FFE14D');
  return o;
}
function shGrass(t) {
  const cam = camKeys(t, [[c33, at(960, 560, 1.0)], [tGrass - 0.05, at(960, 560, 1.05)], [tGrass + 0.2, at(1060, 470, 1.7)], [c34, at(1060, 470, 1.75)]]);
  let wd = S.rect(-800, -600, 3520, 2280, 0, { fill: '#2A2D3A' }) + X.pixelGrass(-120, 60, 18, 10, 120, t);
  wd += dexAvatar(820, 840, 3.4, t, { pose: 'stand', glass: false }) + magnifier(1060, 470, 120, -10);
  let o = view(cam, wd, 1);
  o += S.rect(0, 0, 1920, 64, 0, { fill: '#3A3F55' }) + TF('grass_texture_04.png', 960, 46, 36, '#FFFFFF') + S.circle(40, 32, 12, { fill: '#FF5A5A' }) + S.circle(76, 32, 12, { fill: '#FFD21F' }) + S.circle(112, 32, 12, { fill: '#3BD16F' });
  o += K.bang('NO BADGE.', 1380, 860, pop(t, tGrass + 0.35, 0.3), 100, -6, '#FF5A5A');
  return o + smash(t, tGrass, 0.1, 0.35);
}
// ---- 34-38. Pip says goodbye
const PIPBOX = { x: 960, y: 1000, s: 1.15 };
function pipInBox(t, face, opts = {}) {
  const B = PIPBOX;
  let o = SETS.pipBox(B.x, B.y, B.s, t, { part: 'back', ding: opts.ding || 0 });
  o += pip(t, { x: B.x, y: B.y - 60 * B.s + (opts.dy || 10), s: 0.5 * B.s, face, armL: 30, armR: 30, headRot: opts.headRot || 0 }, { arms: false, energy: 0.3 });
  // the tablet (back side) he holds at the rim, its light on his face
  o += S.g(S.rect(-110, -70, 220, 140, 18, ol('#3A3F4E', 6)) + S.circle(0, -40, 7, { fill: '#5A6070' }) + S.rect(-80, -88, 160, 20, 8, { fill: '#9FE2FF', opacity: 0.5 }), tf(B.x, B.y - 230 * B.s + 30, 0.9, 0));
  o += SETS.pipBox(B.x, B.y, B.s, t, { part: 'front', ding: opts.ding || 0 });
  return o;
}
function livingNight(t, cam, inner, glow = 1) {
  const Ll = SETS.livingRoom.layers(t, { time: 'night', lamp: false, tvOff: true });
  let o = view(cam, Ll.bg, 0.5) + view(cam, Ll.mid + inner, 1) + view(cam, Ll.light, 1);
  o += view(cam, S.circle(PIPBOX.x, PIPBOX.y - 400, 300, { fill: 'url(#s04glowBlue)', opacity: f(0.75 * glow) }), 1);
  return o;
}
function shPip1(t) {
  const cam = camKeys(t, [[c34, at(960, 640, 1.45)], [c35, at(960, 620, 1.75)]], ease.linear);
  const tear = seg(t, c35 - 0.8, c35);
  return livingNight(t, cam, pipInBox(t, { name: 'sad', fx: tear > 0 ? ['tears'] : [] }));
}
function shPip2(t) {
  const cam = camKeys(t, [[c35, at(620, 560, 1.15)], [c36, at(560, 600, 1.35)]], ease.linear);
  const doors = 1 - ease.inOut(seg(t, c35 + 0.5, c36));
  let o = view(cam, SETS.elevatorGame(t, { wave: 1, doors, floor: 1, rides: 41000 }), 1);
  o += view(cam, S.path(K.F.heartPath(330, 520 + Math.sin(t * 3) * 10, 30), ol('#FF4D7A', 5)), 1);
  return o;
}
function shDing1(t) {
  const cam = camKeys(t, [[c36, at(960, 640, 2.3)], [c37, at(960, 630, 2.45)]], ease.linear);
  return livingNight(t, cam, pipInBox(t, { name: 'sad', fx: ['tears'] }, { ding: bump(t, tD1 - 0.05, tD1 + 0.7), dy: 50 }));
}
function shDing2(t) {
  const cam = camKeys(t, [[c37, at(960, 400, 1.15)], [c38, at(960, 380, 1.25)]], ease.linear);
  return view(cam, SETS.elevatorGame(t, { npc: false, doors: 0, floor: 1, dir: '', ding: bump(t, tD2 - 0.05, tD2 + 0.7), grey: 0.45, rides: 41001 }), 1);
}
function shDing3(t) {
  const cam = camKeys(t, [[c38, at(960, 640, 1.1)], [c39, at(960, 620, 0.98)]], ease.linear);
  let o = livingNight(t, cam, pipInBox(t, { name: 'sad', eyes: { type: 'closed' }, fx: ['tears'] }, { ding: bump(t, tD3 - 0.05, tD3 + 0.6) }), 0.8);
  o += slideIn(t, tD3 + 0.15, listCard(1560, 330, 0.5, [{ txt: 'SAY BYE 2', k: seg(t, tD3 + 0.35, tD3 + 0.6) }, { txt: 'ELEVATR MAN' }], { who: 'PIP', rot: 5, inkCol: '#2E6E2A' }), 700);
  return o;
}
// ---- 39-41. Juno's one thing
function atticFrame(t, cam, opts, chars, over = '') {
  const La = SETS.attic.layers(t, opts);
  return view(cam, La.bg, 0.5) + view(cam, La.mid + chars, 1) + view(cam, La.fg, 1.2) + view(cam, La.light, 1) + over;
}
const ATTIC_EVE = { time: 'evening', lights: 1, juice: 3 };
const junoList = (t, k) => listCard(0, 0, 1, [{ txt: 'Finish Bubble' }, { txt: '   Island.' }], { title: "JUNO'S LIST", who: '(only one thing)', rot: 0, size: 50 });
function shJuno(t) {
  const cam = camKeys(t, [[c39, at(1120, 560, 1.2)], [tList16, at(1180, 520, 1.25)], [c40, at(1200, 500, 1.32)]]);
  shakeAll(cam, t, [[tList16 + 0.05, 0.3, 12]]);
  const tap = bump(t, c39 + 0.05, c39 + 0.5), crack = bump(t, tMe + 0.4, tMe + 0.9), one = bump(t, tOne - 0.1, tList16 - 0.1), slap = seg(t, tList16 - 0.15, tList16 + 0.05);
  const pose = { x: 1120, y: 1000, s: 0.62, turn: lerp(0.5, 0, ease.out(seg(t, c39, c39 + 0.4))), armR: 15 + 160 * tap + 130 * one + 60 * slap * (1 - one), armL: 15 + 60 * crack - 50 * crack, lift: 18 * bump(t, c39, c39 + 0.35) };
  let chars = juno(t, pose, { arms: false, energy: 1.2 });
  const listK = ease.outBack(slap);
  if (listK > 0) chars = S.g(junoList(t), tf(1370, 330, 0.42 * listK, lerp(20, -3, slap))) + chars;
  let o = atticFrame(t, cam, ATTIC_EVE, chars);
  o += K.bang('CRACK!', 760, 360, seg(t, tMe + 0.55, tMe + 0.65) * (1 - seg(t, tMe + 1.0, tMe + 1.1)), 90, -8, '#FFFFFF');
  if (tap > 0.4) o += K.sparkles([[1080, 260, 30]], t);
  return o;
}
function shTitle(t) {
  const cam = camKeys(t, [[c40, at(960, 540, 1.0)], [c41, at(960, 560, 1.08)]]);
  let o = view(cam, SETS.bubbleIsland(t, { visits: 3 }), 1);
  const word = 'BUBBLE ISLAND';
  let lg = '';
  [...word].forEach((ch, i) => {
    const k = ease.outBack(seg(t, c40 + 0.05 + i * 0.04, c40 + 0.3 + i * 0.04));
    if (k <= 0 || ch === ' ') return;
    const x = 960 + (i - 6) * 104;
    lg += S.g(T(ch, 0, 0, 170, i < 6 ? '#FFD21F' : '#7CF7FF', { stroke: '#FF5A8A', 'stroke-width': 26, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }), tf(x, 560 - 300 * (1 - k) + Math.sin(t * 5 + i) * 8, 1, Math.sin(i * 1.7) * 6));
  });
  o += lg;
  return o;
}
function shForgot(t) {
  const cam = camKeys(t, [[c41, at(820, 560, 1.15)], [tExisted - 0.3, at(560, 420, 2.8)], [c42, at(515, 392, 4.3)]], ease.inOut);
  const scr = (w_, h_) => SETS.frameIn(SETS.bubbleIsland(t, { visits: 3 }), w_, h_);
  const chars = juno(t, { x: 930, y: 1000, s: 0.62, view: 'back', armL: 20, armR: 30, headRot: -4 }, { arms: false });
  return atticFrame(t, cam, { ...ATTIC_EVE, screen: scr }, chars);
}
// ---- 42-45. Dex falls through the whole world
function shFall(t) {
  const isl = SETS.bubbleIsland.ISLANDS;
  const fallU = ease.in(seg(t, tFell - 0.05, c43 - 0.1));
  const scroll = 2600 * fallU;
  let wd = SETS.bubbleIsland(t, { visits: 3, hud: false });
  // below the world: sky fades to grey, the world's underside seam, then the void
  wd += S.rect(-800, 1080, 3520, 900, 0, { fill: 'url(#s04under)' }) + X.pixelGrass(-200, 1960, 20, 1, 120, t);
  wd += S.g(SETS.bubbleIsland(t, { void: true, hud: false }), 'translate(0 2680)');
  let o = S.g(wd, `translate(0 ${f(-scroll)})`);
  // the avatar: hops onto the big island, then drops straight through it
  const b = isl[0], top = b.top + SETS.bubbleIsland.bob(0, t) - 40;
  const hop = seg(t, c42 + 0.05, c42 + 0.55);
  let ax = lerp(250, 760, hop), ay = top - Math.sin(hop * Math.PI) * 260 + (1 - hop) * 160;
  let pose = hop < 1 ? 'jump' : 'stand';
  if (t > tFell - 0.05) { pose = 'fall'; ay = top + lerp(0, 2600, fallU) - scroll + 480 * fallU; }
  o += dexAvatar(ax, ay, 1.6, t, { pose, glass: false });
  if (t > tWhole - 0.1 && t < tWhole + 0.6) o += K.bang('OUT OF BOUNDS', 960, 300, seg(t, tWhole - 0.1, tWhole), 90, -4, '#FF5A5A');
  return o;
}
const TWO = { dex: { x: 380, y: 1000, s: 0.6 }, juno: { x: 1180, y: 1000, s: 0.6 } };
function voidScreen(t) { return (w_, h_) => SETS.frameIn(SETS.bubbleIsland(t, { void: true, visits: 3 }) + SETS.avatar(960, 700, 1.8, t, { who: 'dex', pose: 'stand' }), w_, h_); }
function shTwo(t) {
  const cam = camKeys(t, [[c43, at(800, 560, 1.15)], [c44, at(840, 540, 1.24)]]);
  const think = bump(t, tThats2 - 0.05, tSecretLvl - 0.1), jazz = seg(t, tSecretLvl - 0.1, tSecretLvl + 0.1);
  const jw = jazz > 0 ? 12 * Math.sin(t * 30) : 0;
  const jFace = jazz > 0 ? { name: 'excited', fx: ['sweat'] } : think > 0.3 ? { name: 'nervous', eyes: { look: [-0.4, -0.9] }, fx: ['sweat'] } : { name: 'nervous' };
  let chars = dex(t, { ...TWO.dex, turn: 0.45, face: fc('deadpan', t, 4, { eyes: { look: [0.9, 0], upper: 0.5 } }), armL: 10, armR: 10 }, { arms: false, energy: 0.6 });
  chars += juno(t, { ...TWO.juno, turn: -0.35, face: jFace, armL: 15 + 30 * think + 120 * jazz + jw, armR: 15 + 120 * jazz - jw, lift: 12 * bump(t, tSecretLvl - 0.1, tSecretLvl + 0.3) }, { arms: false, energy: 1.3 });
  let o = atticFrame(t, cam, { ...ATTIC_EVE, screen: voidScreen(t) }, chars);
  if (jazz > 0) o += K.sparkles([[1330, 330, 34], [1600, 420, 26], [1200, 250, 20]], t);
  return o;
}
function shVoid(t) {
  const shrink = ease.out(seg(t, tForever - 0.05, tForever + 0.7));
  let o = SETS.bubbleIsland(t, { void: true, visits: 3 });
  const s = lerp(3.2, 0.12, shrink);
  o += dexAvatar(960, lerp(780, 560, shrink), s, t, { pose: 'stand', glass: false, flip: Math.floor((t - c44) * 1.5) % 2 === 1 });
  o += K.bang('?', 1120, 360, pop(t, tNoWater, 0.3) * (1 - shrink), 160, 10, '#FFFFFF');
  if (shrink > 0) o += S.circle(960, 560, 26 + 40 * (1 - shrink), { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 4, opacity: f(0.6 * (1 - shrink)) });
  return o;
}
function shSecret(t) {
  const cam = camKeys(t, [[c45, at(1000, 540, 1.2)], [END, at(1110, 510, 1.38)]], ease.linear);
  let chars = dex(t, { ...TWO.dex, turn: 0.45, face: fc('deadpan', t, 4, { eyes: { look: [0.9, 0], upper: 0.55 } }), armL: 10, armR: 10 }, { arms: false, energy: 0.4 });
  chars += juno(t, { ...TWO.juno, turn: -0.2, bodyY: 26, headRot: -7, armL: 4, armR: 4 }, { arms: false, energy: 0.5 });
  let o = atticFrame(t, cam, { ...ATTIC_EVE, screen: voidScreen(t) }, chars);
  o += C.pixelWipe(seg(t, END - 0.6, END), 'cover', true);
  return o;
}

// ================================================================= router
const SHOTS = [
  [c01, shList], [c02, shWall], [c03, shPiggy], [c04, shPhone], [c05, shServers], [c06, shLine], [c07, shLine2], [c08, shTOS], [c09, shHours], [c10, shEnding],
  [c11, shClass], [c12, shTycoon], [c13, shStream1], [c14, shStream2], [c15, shStream3], [c16, shStream4], [c17, shDad1], [c18, shDad2], [c19, shJuno1], [c20, shPaper],
  [c21, shDad3], [c22, shDad4], [c23, shFish], [c24, shMom1], [c25, shMom2], [c26, shMom3], [c27, shDex1], [c28, shDex2], [c29, shDex3], [c30, shDex4],
  [c31, shMaps], [c32, shCave], [c33, shGrass], [c34, shPip1], [c35, shPip2], [c36, shDing1], [c37, shDing2], [c38, shDing3], [c39, shJuno], [c40, shTitle],
  [c41, shForgot], [c42, shFall], [c43, shTwo], [c44, shVoid], [c45, shSecret],
];
// whip-pans on the montage cuts (the rest are hard cuts)
const WHIPS = [c03, c05, c08, c11, c13, c17, c24, c27, c34, c39];
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

// ---------------------------------------------------------------- countdown: 22:00:00 → 20:00:00, rolling jumps
const H_ = 3600, M_ = 60;
const JUMPS = [
  [c01, 22 * H_], [c05, 21 * H_ + 47 * M_ + 12], [c08, 21 * H_ + 31 * M_ + 5], [c11, 21 * H_ + 16 * M_ + 40], [c13, 21 * H_ + 2 * M_ + 18],
  [c15, 20 * H_ + 44 * M_ + 9], [c17, 20 * H_ + 36 * M_ + 30], [c24, 20 * H_ + 24 * M_ + 45], [c27, 20 * H_ + 15 * M_ + 2], [c34, 20 * H_ + 7 * M_ + 50],
  [c39, 20 * H_ + 2.6], [c42, 19 * H_ + 57 * M_ + 31],
];
function timer(t) {
  let i = JUMPS.length - 1;
  while (i > 0 && t < JUMPS[i][0]) i--;
  const [tj, sj] = JUMPS[i];
  const base = sj - (t - tj);
  if (i > 0) {
    const u = seg(t, tj, tj + 0.35);
    if (u < 1) {
      const prev = JUMPS[i - 1][1] - (tj - JUMPS[i - 1][0]);
      return { sec: lerp(prev, base, ease.out(u)), glitch: 0.5 * (1 - u) };
    }
  }
  return base;
}
function look(t) {
  if (t >= c34 && t < c39) return { grade: 'cool', vignette: 1 };
  if (t >= c15 && t < c17) return { grade: 'cool', vignette: 0.9 };
  if (t >= c31 && t < c34) return { grade: null, vignette: 0.5 };
  return { grade: 'warm', vignette: 0.7 };
}
const DEFS = X.DEFS + `<defs>
<radialGradient id="s04glowGreen"><stop offset="0" stop-color="#9BFFB0" stop-opacity="0.55"/><stop offset="1" stop-color="#9BFFB0" stop-opacity="0"/></radialGradient>
<radialGradient id="s04glowBlue"><stop offset="0" stop-color="#9FE2FF" stop-opacity="0.5"/><stop offset="0.6" stop-color="#7FB8FF" stop-opacity="0.16"/><stop offset="1" stop-color="#7FB8FF" stop-opacity="0"/></radialGradient>
<linearGradient id="s04under" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3D9FF"/><stop offset="0.5" stop-color="#C9C2D8"/><stop offset="1" stop-color="#A9ADB6"/></linearGradient>
</defs>`;

module.exports = { scene, look, timer, DEFS, SHOTS };
