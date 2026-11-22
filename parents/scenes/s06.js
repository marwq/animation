// SC 06 · GRANNY'S EMPIRE (366.11 … 419.55). MEANWHILE… in Tycoon Valley: Granny's tiny cookie stand pops up brick by
// brick (real Granny knits in her armchair, her phone propped on the arm shows the shop); "Fresh cookies! Two coins!
// Three for the cute ones!" (the KID gets three, a grumpy noob does not); the time-lapse stand → bakery → factory →
// skyscraper with the coin counter rocketing; the neon cookie lights up on top; the billboard rises with Granny's face
// lip-syncing her prices (5 / 10 on weekends) and the RUDE TAX at the door (15); she hires your friends (aprons, NOW
// HIRING → HIRED) and then their friends (a conga line of new staff); Noodle in a hairnet: "She pays double! And
// there's dental!" + the EMPLOYEE OF THE MONTH photo; the SOLD sign slaps on YOUR castle, rent 50 coins a week (lease
// card); "Granny! I'm your grandson!" (real life) / "That's why it's only fifty, dear."; the wallet: 12 coins and a moth.
'use strict';

const K = require('./kit');
const G = require('./gameui');
const R = require('./respawn');
const GS = require('./sets_game');
const X = require('../rig/extras');
const AC = require('./acting');
const E = require('./s05_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const { tf, TS, TFS, pop, sc, shakeAll, boing, clipTo, whip, smash, zoomLines, streaks, room } = E;
const camAt = GS.camAt, toScr = GS.toScreen;
const TY = GS.SPOTS.tycoon, tyS = TY.sAt, FI = GS.SPOTS.factoryInterior;

const A = Array.from({ length: 12 }, (_, i) => L('06.' + i));
const T0 = K.V.scene('SC 06').start, END = K.V.scene('SC 07').start;     // == main.js RANGES for SC 06
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;

// ================================================================= the cut list (all from the voice)
const CUT = {};
CUT.valley = T0;
CUT.little = w(0, 'Just') - 0.45;
CUT.stand = A[1].a - 0.75;
CUT.cute = w(1, 'Three') - 0.3;
CUT.grow = A[2].a - 0.05;
CUT.top = A[2].b + 0.15;
CUT.board = A[3].a - 1.45;
CUT.rude = w(3, 'Fifteen') - 0.12;
CUT.rudeReal = w(3, 'if') - 0.08;
CUT.hired = A[4].a - 0.05;
CUT.more = w(4, 'Then') - 0.1;
CUT.noodle = A[5].a - 0.15;
CUT.employee = A[5].b + 0.05;
CUT.bought = A[6].a - 0.25;
CUT.base = A[7].a - 0.08;
CUT.rent = A[8].a - 0.05;
CUT.grandson = A[9].a - 0.1;
CUT.dear = A[10].a - 0.08;
CUT.alone = A[10].b + 0.15;
CUT.wallet = A[11].a - 0.25;
CUT.face = A[11].b + 0.3;
{
  const ks = Object.keys(CUT);
  for (let i = 1; i < ks.length; i++) if (CUT[ks[i]] < CUT[ks[i - 1]] + 0.2) CUT[ks[i]] = CUT[ks[i - 1]] + 0.2;
}
// beats inside shots
const tOpen = w(0, 'opened');                                   // the stand pops up brick by brick
const tPay = w1(1, 'coins') - 0.2;                              // the first noob pays 2 coins
const tCute3 = w(1, 'cute');                                    // three cookies for the KID
const tBak = w(2, 'bakery') - 0.08, tFac = w(2, 'factory') - 0.08, tSky = w(2, 'skyscraper') - 0.08;
const tNeon = CUT.top + 0.45;
const tFive = w(3, 'five'), tTen = w(3, 'Ten'), tRudeTag = w(3, 'Fifteen') + 0.1;
const tHire = w(4, 'hired'), tHire2 = w(4, 'hired', 1);
const tDouble = w(5, 'double'), tDental = w(5, 'dental');
const tFlash = CUT.employee + 0.25;
const tSold = w(6, 'bought');
const tDeal = w(6, 'deal');
const tBought = w(7, 'BOUGHT');
const tLease = w(8, 'Rent') - 0.05;
const tWallet = w(11, 'had'), tTwelve = w(11, 'twelve'), tMoth = A[11].b - 0.3;

// ================================================================= helpers
const you = (t, p, a = {}) => actor('you', t, { nametag: 'YOU', crown: true, ...p }, a);
const gran = (t, p, a = {}) => actor('grandmaAvatar', t, p, a);
const noob = (i, t, p) => actor('kid', t, { i, t, ...p });
const ply = (i, t, p) => actor('player', t, { i, t, ...p });
const GRAN_H = 988, YOU_H = 946;
function tycoonShot(t, cam, o = {}, behind = '', chars = '', over = '') {
  const Ly = GS.tycoon.layers(t, cam, { time: 'day', granny: 1, billboard: 0, ...o });
  return Ly.bg + Ly.mid + (behind ? view(cam, behind) : '') + Ly.front + view(cam, chars + over) + Ly.fg + Ly.light;
}
function factoryShot(t, cam, o = {}, behind = '', chars = '', over = '') {
  const Ly = GS.factoryInterior.layers(t, { belt: 1, ...o });
  return view(cam, Ly.bg, 0.7) + view(cam, Ly.mid + behind + Ly.front + chars + over + Ly.fg + Ly.light);
}
function bubbleAt(t, cam, wx, wy, lineId, o = {}) {
  const p = toScr(cam, wx, wy);
  return G.chatBubble({ x: p.x + (o.dx || 0), y: p.y - (o.gap ?? 28), t, s: o.s ?? 1.2, tail: o.tail ?? 0, user: o.user, caps: o.caps, col: o.col, size: o.size, maxW: o.maxW, ...G.chatLine(t, lineId, o), ...(o.k !== undefined ? { k: o.k } : {}) });
}
// a Granny's Goodies apron for a lite player (body-space prop between torso and arms)
const APRON = { svg: S.path('M-62 -470 H62 L70 -230 Q0 -210 -70 -230 Z', { fill: '#FF9AC8', stroke: '#151515', 'stroke-width': 7 }) + S.path('M-62 -470 Q-40 -520 -30 -560 M62 -470 Q40 -520 30 -560', { fill: 'none', stroke: '#151515', 'stroke-width': 6 }) + S.circle(0, -372, 26, { fill: '#E0A35A', stroke: '#151515', 'stroke-width': 5 }) + S.circle(-8, -378, 5, { fill: '#6B3A1E' }) + S.circle(9, -366, 5, { fill: '#6B3A1E' }), layer: 'mid' };
const worker = (i, t, p) => ply(i, t, { props: [APRON], nametag: false, ...p });
// coin flying from a to b over [t0, t0 + d]
function coinArc(t, t0, a, b, d = 0.45, r = 22, h = 160) {
  const u = seg(t, t0, t0 + d);
  if (u <= 0 || u >= 1) return '';
  return G.coinIcon(lerp(a[0], b[0], u), lerp(a[1], b[1], u) - h * Math.sin(u * Math.PI), r, t * 14);
}
// the hero's coin pill (top-left) + Granny's coins (top-right)
const myCoins = (t, o = {}) => G.coinCounter({ x: 50, y: 80, value: 12, t, s: 0.9, label: 'COINS', ...o });
// real Granny in her armchair (living room), knitting; phone screen shows her shop
function realGranny(t, cam, o = {}) {
  return room(t, cam, { you: o.you ?? { turn: 0.75, face: 'neutral' }, gran: { face: { name: 'happy' }, ...(o.gran || {}) }, granAct: o.granAct || { face: 'happy' }, mom: o.mom, phoneScreen: (pw, ph) => E.phoneShop(pw, ph, t, { coins: o.coins, label: o.label }), glow: 0.5, over: o.over });
}
const GCAM = camAt(1745, 610, 2.15, 960, 520);                  // real Granny close-up

// ================================================================= SHOTS
// ---- 1. "Meanwhile, Granny opened a cookie stand." — MEANWHILE banner, the valley; the stand pops up brick by brick
function shValley(t) {
  const cam = camKeys(t, [[CUT.valley, TY.cams.valley], [tOpen - 0.2, camAt(1300, 520, 0.62)], [CUT.little, camAt(1520, 650, 1.05)]], ease.inOut);
  const g = lerp(0, 1, seg(t, tOpen, tOpen + 0.75));
  const st = TY.granny.stand;
  const inK = seg(t, tOpen + 0.55, tOpen + 0.85);
  const behind = inK > 0 ? gran(t, { x: st.x, y: st.y, s: st.s, armR: 150 + 20 * Math.sin(t * 10), face: 'joy', bag: false, ...boing(t, tOpen + 0.6, 0.3) }, { arms: false }) : '';
  let over = '';
  if (inK > 0 && inK < 1) over += K.C.burst(st.x, st.y - 300 * st.s, inK, '#FF9AC8');
  // a couple of tiny players crossing the bridges
  for (const [x0, i, sp] of [[700, 3, 90], [2300, 5, -70]]) over += noob(i, t, { x: x0 + (t - T0) * sp, y: 930, s: tyS(930) * 0.8, view: 'side', flip: sp > 0, ...AC.walk(t * 8 + i), nametag: false });
  let o = tycoonShot(t, cam, { granny: g }, behind, '', over);
  o += G.systemBanner({ text: 'MEANWHILE... IN TYCOON VALLEY', theme: 'info', k: seg(t, T0 + 0.05, T0 + 0.6), out: seg(t, tOpen - 0.3, tOpen), t, y: 150, size: 64 });
  return o + whip(t, T0, 1, 0.12);
}

// ---- 2. "Just a little one." — real life: Granny knitting in her armchair; the phone shows "COOKIE STAND · LVL 1"
function shLittle(t) {
  const cam = camKeys(t, [[CUT.little, camAt(1700, 610, 1.7, 960, 520)], [CUT.stand, GCAM]]);
  let o = realGranny(t, cam, { coins: 0, label: 'STAND LVL 1' });
  const p = toScr(cam, 1612, 640);
  o += K.bang('tiny!', p.x - 40, p.y - 120, pop(t, w(0, 'little'), 0.25), 60, -10, '#FF9AC8');
  return o;
}

// ---- 3. GRANDMA: "Fresh cookies! Two coins!" — behind the counter; a queue of noobs; the first one pays
const QUEUE = [[1230, 6], [1080, 9], [930, 12]];
function shStand(t) {
  const cam = camKeys(t, [[CUT.stand, camAt(1420, 680, 1.25)], [CUT.cute, camAt(1450, 680, 1.32)]]);
  const st = TY.granny.stand;
  const behind = gran(t, { x: st.x, y: st.y, s: st.s, armR: 60 + 50 * bump(t, w(1, 'Fresh'), w1(1, 'cookies')), armL: 20 + 100 * bump(t, tPay, tPay + 0.5), face: { name: 'happy' }, bag: false }, { energy: 1.2, arms: false });
  let chars = '';
  QUEUE.forEach(([x, i], j) => { chars += noob(i, t, { x: x - 30 * seg(t, tPay + 0.4, tPay + 0.8), y: 930, s: tyS(930) * 0.95, turn: 0.6, face: j === 0 && t > tPay ? { name: 'happy', eyes: { type: 'happy' } } : 'happy', armR: j === 0 ? 20 + 90 * bump(t, tPay - 0.3, tPay + 0.1) : 10, nametag: false }); });
  let over = coinArc(t, tPay, [1270, 780], [1610, 700]) + coinArc(t, tPay + 0.1, [1270, 780], [1610, 700]);
  const ck = seg(t, tPay + 0.3, tPay + 0.75);
  if (ck > 0 && ck < 1) over += X.cookie({ x: lerp(1460, 1270, ck), y: lerp(720, 790, ck) - 120 * Math.sin(ck * Math.PI), s: 0.6, rot: 400 * ck });
  let o = tycoonShot(t, cam, {}, behind, chars, over);
  o += bubbleAt(t, cam, st.x, st.y - GRAN_H * st.s, '06.1', { text: 'Fresh cookies! Two coins!', to: 'coins', gap: 28, tail: 0.2, s: 1.2 });
  o += G.coinCounter({ x: 1870, y: 80, anchor: 'right', value: t > tPay + 0.45 ? 2 : 0, t, label: 'GRANNY', bump: seg(t, tPay + 0.45, tPay + 0.9), k: seg(t, CUT.stand, CUT.stand + 0.3) });
  return o;
}
// ---- 4. "Three for the cute ones!" — the KID with the propeller cap gets three cookies; the grumpy noob gets none
function shCute(t) {
  const cam = camKeys(t, [[CUT.cute, camAt(1420, 700, 1.55)], [CUT.grow, camAt(1430, 700, 1.65)]]);
  const st = TY.granny.stand;
  const lean = bump(t, tCute3 - 0.3, CUT.grow);
  const behind = gran(t, { x: st.x, y: st.y, s: st.s, lean: -8 * lean, armL: 30 + 70 * lean, armR: 30 + 70 * lean, face: { name: 'happy', fx: ['hearts'] }, bag: false }, { energy: 1.1, arms: false });
  let chars = '';
  chars += noob(9, t, { x: 1080, y: 935, s: tyS(935) * 0.95, turn: 0.5, armL: 8, armR: 8, face: t > tCute3 + 0.3 ? { name: 'angry', fx: ['anger'] } : 'neutral', nametag: false });
  chars += noob(0, t, { x: 1290, y: 935, s: tyS(935), turn: 0.6, armL: 40 + 20 * seg(t, tCute3, tCute3 + 0.4), armR: 40 + 20 * seg(t, tCute3, tCute3 + 0.4), face: { name: 'cute', fx: ['blush'] }, nametag: false, ...boing(t, tCute3 + 0.5, 0.15) });
  let over = '';
  for (let k = 0; k < 3; k++) {
    const t0 = tCute3 - 0.1 + k * 0.18, u = seg(t, t0, t0 + 0.45);
    if (u > 0) over += X.cookie({ x: lerp(1470, 1270 + (k - 1) * 30, u), y: lerp(720, 860 - k * 34, u) - 140 * Math.sin(u * Math.PI) * (u < 1 ? 1 : 0), s: 0.55, rot: u < 1 ? 360 * u : 10 * k });
  }
  over += G.emoteHearts({ x: 1290, y: 935 - 704 * tyS(935), age: t - tCute3 - 0.4, n: 6, s: 0.6, life: 1.3 });
  let o = tycoonShot(t, cam, {}, behind, chars, over);
  o += bubbleAt(t, cam, st.x, st.y - GRAN_H * st.s, '06.1', { text: 'Three for the cute ones!', from: 'Three', gap: 28, tail: 0.2, s: 1.2, k: seg(t, CUT.cute, CUT.cute + 0.25) });
  o += G.coinCounter({ x: 1870, y: 80, anchor: 'right', value: t > tCute3 + 0.4 ? 5 : 2, t, label: 'GRANNY', bump: seg(t, tCute3 + 0.4, tCute3 + 0.85) });
  return o;
}

// ---- 5. "Then a bakery. Then a factory. Then a skyscraper." — the time-lapse; coins rocket; tilt up the tower
function shGrow(t) {
  const cam = camKeys(t, [[CUT.grow, camAt(1420, 600, 0.8)], [tSky - 0.1, camAt(1460, 520, 0.72)], [CUT.top, camAt(1600, -700, 0.36)]], ease.inOut);
  const g = t < tFac ? 1 + seg(t, tBak, tBak + 0.75) : t < tSky ? 2 + seg(t, tFac, tFac + 0.75) : 3 + seg(t, tSky, tSky + 0.95);
  const tl = T0 + (t - T0) * 14;                                // time-lapse clock for the idle motion (clouds race)
  let over = '';
  // fast-forward customers zipping in and out of the shop
  for (let i = 0; i < 8; i++) {
    const ph = ((t * 1.7 + i * 0.137) % 1), dir = i % 2 ? 1 : -1;
    over += noob(i + 2, t, { x: 1520 + dir * (900 - 1500 * ph), y: 940 + (i % 3) * 12, s: tyS(940) * 0.85, view: 'side', flip: dir < 0, ...AC.run(t * 30 + i), nametag: false });
  }
  let o = tycoonShot(tl, cam, { granny: g }, '', '', over);
  // day/night flicker of the time-lapse
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#1A1050', opacity: f(0.18 * Math.max(0, Math.sin(t * 9))) });
  o += E.ffOSD(t, seg(t, CUT.grow, CUT.grow + 0.2), '▶▶ x1000');
  o += G.coinCounter({ x: 50, y: 80, value: 9999999, from: 5, roll: ease.in(seg(t, CUT.grow + 0.2, CUT.top)), rocket: seg(t, CUT.grow, CUT.grow + 0.4), t, label: 'GRANNY' });
  for (const tt of [tBak, tFac, tSky]) o += smash(t, tt, 0.08, 0.35);
  return o;
}
// ---- 6. (beat) the neon cookie on top flickers on — ka-ching
function shTop(t) {
  const cam = camKeys(t, [[CUT.top, camAt(1520, -2420, 0.95)], [CUT.board, camAt(1520, -2480, 1.08)]]);
  const fl = t < tNeon ? 0 : t < tNeon + 0.5 ? (Math.floor((t - tNeon) * 16) % 3 === 1 ? 0 : 1) : 1;
  let o = tycoonShot(t, cam, { granny: 4, neon: fl });
  const p = toScr(cam, 1520, -2630);
  if (t > tNeon + 0.5) o += K.F.sparkle(p.x - 170, p.y - 90, 40 * Math.abs(Math.sin(t * 7))) + K.F.sparkle(p.x + 180, p.y + 40, 30 * Math.abs(Math.sin(t * 6 + 1)));
  o += K.C.burst(p.x, p.y, seg(t, tNeon + 0.5, tNeon + 1.0), '#FFB04A');
  return o + whip(t, CUT.top, -1, 0.1);
}
// ---- 7. (billboard rises) GRANDMA: "Cookies are now five coins. Ten coins on weekends." — her face lip-syncs on it
function billboardFace(t) {
  const face = actor('grandmaAvatar', t, { x: 0, y: 650, s: 0.85, nametag: false, volume: false, bag: false, cane: false, face: { name: 'happy' } }, { energy: 0.8 });
  return clipTo(-190, -205, 380, 410, S.rect(-190, -205, 380, 410, 0, { fill: '#FFD1E6' }) + face, 30);
}
function shBoard(t) {
  const up = ease.out(seg(t, CUT.board + 0.1, CUT.board + 1.1));
  const cam = shakeAll(camKeys(t, [[CUT.board, camAt(2130, 330, 0.9)], [A[3].a, camAt(2130, 200, 1.0)], [CUT.rude, camAt(2100, 230, 1.12)]], ease.inOut), t, [[CUT.board + 1.05, 0.3, 10], [tFive, 0.25, 8], [tTen, 0.25, 8]]);
  let o = tycoonShot(t, cam, { granny: 4, neon: 1, billboard: up, billboardFace: billboardFace(t) });
  o += G.stamp({ text: '5 COINS', x: 700, y: 820, k: seg(t, tFive, tFive + 0.45), col: '#FF4B5C', size: 96, rot: -10 });
  o += G.stamp({ text: '10 ON WEEKENDS', x: 1360, y: 880, k: seg(t, tTen, tTen + 0.45), col: '#7A3CC8', size: 74, rot: 6 });
  return o + whip(t, CUT.board, 1, 0.1);
}
// ---- 8. "Fifteen..." — a rude player at the tower door: the price board flips to 15, RUDE TAX
function priceBoard(x, y, k15, t) {
  let g = S.rect(-150, -150, 300, 240, 18, ol('#FFF8EC', 7)) + S.rect(-150, -150, 300, 56, 18, { fill: '#FF6FB0', stroke: '#151515', 'stroke-width': 7 });
  g += TS('PRICES', 0, -108, 40, '#FFFFFF');
  g += TF('COOKIE ....... 5', 0, -48, 30, '#3A2A6A') + TF('WEEKENDS .. 10', 0, -8, 30, '#3A2A6A');
  g += S.g(TF('IF RUDE ..... 15', 0, 36, 30, '#FF4B5C'), null, { opacity: f(k15) });
  g += S.rect(-8, 90, 16, 170, 4, ol('#8A6A4A', 5));
  return S.g(g, tf(x, y, 1, -3 + 2 * Math.sin(t * 2)));
}
function shRude(t) {
  const cam = shakeAll(camAt(1420, 700, 1.45), t, [[tRudeTag, 0.25, 10]]);
  let chars = priceBoard(1150, 700, seg(t, tRudeTag, tRudeTag + 0.2), t);
  chars += ply(1, t, { x: 1380, y: 935, s: tyS(935), turn: 0.55, armL: 64, armR: 64, face: { name: 'angry', fx: ['anger'] }, nametag: false });
  let o = tycoonShot(t, cam, { granny: 4, neon: 1, billboard: 0 }, '', chars);
  const p = toScr(cam, 1380, 935 - 1000 * tyS(935));
  o += G.chatBubble({ x: p.x, y: p.y - 20, t, user: 'BloxyBob', col: '#FFE3E6', s: 1.15, text: 'gimme a cookie >:(', typed: 1, k: seg(t, CUT.rude - 0.1, CUT.rude + 0.15) });
  o += G.stamp({ text: 'RUDE TAX +5', x: 640, y: 380, k: seg(t, tRudeTag, tRudeTag + 0.4), col: '#FF4B5C', size: 82, rot: -12 });
  return o;
}
// ---- 9. "...if you're rude." — real Granny, sweetly, needles clicking; a glint on her glasses
function shRudeReal(t) {
  const cam = camKeys(t, [[CUT.rudeReal, GCAM], [CUT.hired, camAt(1745, 600, 2.3, 960, 520)]]);
  let o = realGranny(t, cam, { coins: 9999999, label: 'RUDE TAX: ON' });
  const g = seg(t, A[3].b - 0.5, A[3].b - 0.1);
  if (g > 0 && g < 1) { const p = toScr(cam, 1745, 590); o += K.F.sparkle(p.x - 60 + 120 * g, p.y - 20, 60 * Math.sin(g * Math.PI)); }
  return o;
}

// ---- 10. "She hired your friends." — the belt: friends in aprons, Noodle in a hairnet; NOW HIRING → HIRED!
const BELT_I = [4, 13, 'noodle', 7, 15, 10];
function beltWorkers(t, o = {}) {
  let s = '';
  FI.workers.forEach((wk, j) => {
    const i = BELT_I[j], bob = Math.abs(Math.sin(t * 6 + j)), arm = 30 + 30 * Math.sin(t * 7 + j * 1.3);
    if (i === 'noodle') s += actor('noodle', t, { x: wk.x, y: wk.y, s: wk.s, hairnet: true, apron: true, armL: o.noodleArms ? o.noodleArms[0] : arm, armR: o.noodleArms ? o.noodleArms[1] : 60 - arm * 0.5, face: o.noodleFace || 'happy', nametag: false, bodyY: 3 * bob }, { arms: false, ...(o.noodleAct || {}) });
    else s += worker(i, t, { x: wk.x, y: wk.y, s: wk.s, armL: arm, armR: 60 - arm * 0.5, face: 'happy', bodyY: 3 * bob });
  });
  return s;
}
function hiringSign(x, y, t, kStamp) {
  let g = S.rect(-170, -70, 340, 140, 16, ol('#FFF8EC', 7)) + TS('NOW', 0, -14, 52, '#17C3B2') + TS('HIRING!', 0, 44, 52, '#17C3B2');
  return S.g(g, tf(x, y, 1, 3 * Math.sin(t * 2))) + G.stamp({ text: 'HIRED!', x, y, k: kStamp, col: '#FF4B5C', size: 70, rot: -14 });
}
function shHired(t) {
  const cam = camKeys(t, [[CUT.hired, camAt(800, 600, 1.15)], [CUT.more, camAt(900, 610, 1.22)]]);
  let o = factoryShot(t, cam, {}, beltWorkers(t), '', hiringSign(380, 330, t, seg(t, tHire, tHire + 0.45)));
  return o + whip(t, CUT.hired, 1, 0.1);
}
// ---- 11. "Then she hired your friends' friends." — pull out wide: a conga line of new hires marches in; STAFF 6 → 48
function shMore(t) {
  const cam = camKeys(t, [[CUT.more, camAt(900, 600, 1.0)], [CUT.more + 0.6, FI.cams.wide], [CUT.noodle, { ...FI.cams.wide, zoom: 0.6 }]], ease.inOut);
  let chars = '';
  for (let k = 0; k < 9; k++) {
    const x = lerp(-1300, 2500, seg(t, CUT.more + 0.1, CUT.noodle + 0.8)) - k * 190;
    if (x < -1500 || x > 3200) continue;
    chars += worker((k * 5 + 3) % 16, t, { x, y: 1000, s: 0.5, view: 'side', flip: true, ...AC.walk(t * 10 + k * 0.7), armR: 150, face: 'happy' });
  }
  let o = factoryShot(t, cam, {}, beltWorkers(t), chars, hiringSign(380, 330, t, 1));
  const n = Math.round(lerp(6, 48, ease.inOut(seg(t, tHire2, CUT.noodle))));
  o += E.pill({ x: 50, y: 90, label: 'STAFF', value: n, rim: '#FF6FB0', col: '#FFFFFF', t, k: seg(t, CUT.more, CUT.more + 0.3), bump: seg(t, CUT.noodle - 0.4, CUT.noodle), icon: S.circle(0, 0, 33, { fill: '#5A2040', stroke: '#151515', 'stroke-width': 4 }) + G.heart(0, 2, 16, '#FF9AC8') });
  return o;
}
// ---- 12. NOODLE: "Sorry, bro! She pays double! And there's dental!" — the hero confronts him across the belt
function benefitCard(x, y, k, t) {
  if (k <= 0) return '';
  let g = S.rect(-200, -90, 400, 180, 26, ol('#FFF8EC', 7)) + S.rect(-200, -90, 400, 52, 26, { fill: '#17C3B2', stroke: '#151515', 'stroke-width': 7 });
  g += TS('BENEFITS', 0, -50, 34, '#FFFFFF');
  g += S.path('M-150 -10 Q-150 -30 -128 -30 Q-116 -30 -110 -22 Q-104 -30 -92 -30 Q-70 -30 -70 -10 Q-70 20 -84 50 Q-92 58 -98 40 L-104 22 Q-110 16 -116 22 L-122 40 Q-128 58 -136 50 Q-150 20 -150 -10 Z', ol('#FFFFFF', 5));
  g += TF('DENTAL', 50, 20, 44, '#1E2A44') + S.path('M110 46 L128 64 L162 26', ln(10, '#3BD16F'));
  g += K.F.sparkle(-160, -40, 18 + 6 * Math.sin(t * 9));
  return S.g(g, tf(x, y, ease.outBack(clamp(k, 0, 1)), -4));
}
function shNoodle(t) {
  const cam = camKeys(t, [[CUT.noodle, camAt(880, 600, 1.38)], [tDouble - 0.1, camAt(900, 590, 1.45)], [tDental, camAt(960, 560, 1.62)], [CUT.employee, camAt(970, 555, 1.66)]], ease.inOut);
  const wk = FI.workers[2];
  const shrug = bump(t, A[5].a, w1(5, 'bro'));
  const nArms = [20 + 60 * shrug + 120 * bump(t, tDouble - 0.1, tDouble + 0.6), 20 + 60 * shrug + 110 * bump(t, tDental - 0.1, A[5].b)];
  const behind = beltWorkers(t, { noodleFace: t > tDental ? { name: 'happy', mouth: 'teeth', fx: ['sparkles'] } : 'happy', noodleAct: { energy: 1.4 }, noodleArms: nArms });
  const hero = you(t, { x: 620, y: 1000, s: 0.5, turn: 0.7, armL: 14, armR: 14, face: t > tDouble ? { name: 'shocked', fx: ['sweat'] } : 'confused', nametag: false }, { arms: false });
  let over = '';
  const dk = seg(t, tDouble, tDouble + 0.3);
  if (dk > 0) { const u = seg(t, tDouble, tDouble + 1.0); over += G.coinIcon(wk.x - 60, wk.y - 600 * wk.s - 80 * u, 30, t * 8) + G.coinIcon(wk.x + 60, wk.y - 600 * wk.s - 80 * u, 30, t * 8 + 1); over += K.bang('x2!', wk.x + 170, wk.y - 640 * wk.s, pop(t, tDouble, 0.2) * (1 - seg(t, tDental - 0.2, tDental)), 80, -8, '#FFC83D'); }
  let o = factoryShot(t, cam, { belt: 1 }, behind, hero, over);
  o += bubbleAt(t, cam, wk.x, wk.y - 1158 * wk.s, '06.5', { user: 'NoodleBoi', gap: 20, s: 1.15, tail: 0.2 });
  o += benefitCard(1460, 640, seg(t, tDental, tDental + 0.35), t);
  return o;
}
// ---- 13. (beat) EMPLOYEE OF THE MONTH: Noodle poses by the frame; camera flash
function noodlePhoto(t) {
  return (pw, ph) => S.rect(0, 0, pw, ph, 0, { fill: '#BFE6FF' }) + clipTo(0, 0, pw, ph, actor('noodle', t, { x: pw / 2, y: ph + 230, s: 0.38, hairnet: true, apron: true, badge: true, face: { name: 'happy', mouth: 'teeth' }, nametag: false, volume: false }));
}
function shEmployee(t) {
  const cam = camKeys(t, [[CUT.employee, camAt(1440, 520, 1.2)], [CUT.bought, camAt(1470, 480, 1.32)]]);
  const ps = FI.pose;
  const flashed = t >= tFlash;
  const noodle = actor('noodle', t, { x: ps.x, y: ps.y, s: ps.s, turn: 0.4, hairnet: true, apron: true, badge: 'EMPLOYEE OF THE MONTH', armR: 150, armL: 20, face: { name: 'happy', mouth: 'teeth', fx: ['sparkles'] }, nametag: false, ...boing(t, tFlash, 0.15) }, { arms: false });
  let o = factoryShot(t, cam, { employee: flashed ? noodlePhoto(t) : undefined }, '', noodle);
  const p = toScr(cam, FI.employee.x, FI.employee.y);
  if (flashed) o += K.F.sparkle(p.x + 140, p.y - 130, 40 * Math.abs(Math.sin(t * 8))) + K.F.sparkle(p.x - 150, p.y + 90, 28 * Math.abs(Math.sin(t * 7 + 1)));
  return o + K.C.whiteFlash(0.9 * (1 - seg(t, tFlash, tFlash + 0.3)) * (t >= tFlash ? 1 : 0));
}

// ---- 14. GRANDMA: "I bought your castle, dear. It was a very good deal." — the hero comes home; SOLD slaps on the gate
const GATE = TY.castle.front;                                   // (-330, 930) s .4
function shBought(t) {
  const cam = shakeAll(camKeys(t, [[CUT.bought, camAt(-260, 620, 0.98)], [tSold, camAt(-260, 640, 1.05)], [CUT.base, camAt(-280, 660, 1.15)]], ease.inOut), t, [[tSold + 0.12, 0.35, 14]]);
  const arrive = ease.out(seg(t, CUT.bought, tSold + 0.1));
  const hx = lerp(-1150, -600, arrive), hs = tyS(940);
  const stopped = arrive >= 0.98;
  let chars = '';
  chars += gran(t, { x: -100, y: 935, s: tyS(935), turn: -0.45, coins: bump(t, tDeal - 0.1, tDeal + 0.7), armR: 20 + 40 * bump(t, tDeal - 0.1, tDeal + 0.6), face: { name: 'happy' } }, { energy: 1.0 });
  chars += stopped ? you(t, { x: hx, y: 940, s: hs, turn: 0.5, armL: 30, armR: 30, face: t > tSold + 0.15 ? { name: 'shocked', mouth: 'O', fx: ['sweat'] } : 'happy', ...boing(t, tSold + 0.15, 0.25) }, { arms: false })
    : you(t, { x: hx, y: 940, s: hs, view: 'side', flip: true, ...AC.walk((t - CUT.bought) * 10), face: 'happy' }, { arms: false });
  let o = tycoonShot(t, cam, { granny: 4, neon: 1, billboard: 1, sold: seg(t, tSold, tSold + 0.35) }, '', chars, K.C.dust(GATE.x - 60, 790, tSold + 0.12, t));
  o += bubbleAt(t, cam, -100, 935 - GRAN_H * tyS(935), '06.6', { gap: 24, s: 1.15, tail: 0.3, hold: 0.6 });
  return o + whip(t, CUT.bought, 1, 0.1);
}
// ---- 15. YOU: "You BOUGHT my base?!" — close-up; smash-zoom on BOUGHT; SOLD behind him
function shBase(t) {
  const hx = -560, hy = 940, hs = tyS(hy);
  const cam = shakeAll(camKeys(t, [[CUT.base, camAt(-500, 560, 2.0, 960, 470)], [tBought - 0.02, camAt(-500, 560, 2.15, 960, 470)], [tBought + 0.08, camAt(-520, 590, 2.7, 960, 450)], [CUT.rent, camAt(-520, 590, 2.75, 960, 450)]], ease.out), t, [[tBought, 0.35, 14]]);
  const hero = you(t, { x: hx, y: hy, s: hs, turn: 0.35, volume: false, nametag: false, armL: 30 + 120 * seg(t, tBought - 0.1, tBought + 0.1), armR: 30 + 120 * seg(t, tBought - 0.1, tBought + 0.1), face: { name: 'shocked', fx: ['sweat'] } }, { energy: 1.4, arms: false });
  let o = tycoonShot(t, cam, { granny: 4, neon: 1, billboard: 1, sold: 1 }, '', hero);
  o += zoomLines(960, 520, bump(t, tBought, tBought + 0.6), t, '#FFFFFF', 24, 480);
  return o + smash(t, tBought, 0.1, 0.5);
}
// ---- 16. GRANDMA: "You can still live there. Rent is fifty coins a week." — the lease card
function leaseCard(t, k, hi) {
  if (k <= 0) return '';
  let g = S.rect(-330, -230, 660, 460, 30, ol('#FFF8EC', 9)) + S.rect(-330, -230, 660, 84, 30, { fill: '#17C3B2', stroke: '#151515', 'stroke-width': 9 });
  g += TS('RENT AGREEMENT', 0, -170, 50, '#FFFFFF');
  g += TF('TENANT: YOU', -280, -90, 40, '#1E2A44', { 'text-anchor': 'start' }) + TF('PROPERTY: YOUR CASTLE', -280, -36, 40, '#1E2A44', { 'text-anchor': 'start' });
  g += S.g(S.rect(-290, 0, 580, 84, 20, { fill: '#FFE14D', opacity: f(0.6 * hi) }) + G.coinIcon(-240, 42, 28, t * 3) + TS('50 COINS / WEEK', 30, 66, 56, '#FF4B5C'), tf(0, 0, 1 + 0.08 * bump(hi, 0, 1)));
  g += TF('LANDLORD:', -280, 150, 32, '#5B6684', { 'text-anchor': 'start' }) + S.path('M-90 150 q20 -40 40 0 t40 0 t40 -10 q10 30 40 0', ln(6, '#7A3CC8')) + G.heart(160, 138, 18, '#FF6FB0');
  return S.g(g, tf(1340, 470, ease.outBack(clamp(k, 0, 1)), 4));
}
function shRent(t) {
  const cam = camKeys(t, [[CUT.rent, camAt(-330, 640, 1.18)], [tLease, camAt(-380, 640, 1.22)], [CUT.grandson, camAt(-400, 640, 1.26)]]);
  const gx = -150, gy = 935, gs = tyS(gy);
  const point = bump(t, A[8].a, w1(8, 'there') + 0.2);
  let chars = '';
  chars += you(t, { x: -600, y: 940, s: tyS(940), turn: 0.5, armL: 14, armR: 14, face: t > w(8, 'fifty') ? { name: 'sad', fx: ['sweat'] } : { name: 'shocked', mouth: 'O' } }, { arms: false });
  chars += gran(t, { x: gx, y: gy, s: gs, turn: -0.4, armL: 20 + 110 * point, face: { name: 'happy' } }, { energy: 0.9 });
  let o = tycoonShot(t, cam, { granny: 4, neon: 1, billboard: 1, sold: 1 }, '', chars);
  o += bubbleAt(t, cam, gx, gy - GRAN_H * gs, '06.8', { gap: 24, s: 1.1, tail: 0.3, maxW: 460 });
  o += leaseCard(t, seg(t, tLease, tLease + 0.45), seg(t, w(8, 'fifty'), w(8, 'fifty') + 0.4));
  o += myCoins(t, { k: seg(t, CUT.rent + 0.2, CUT.rent + 0.5) });
  return o;
}
// ---- 17. YOU: "Granny! I'm your grandson!" — real life: he turns in his gaming chair, pleading; she knits on
function shGrandson(t) {
  const cam = camKeys(t, [[CUT.grandson, camAt(1180, 600, 1.2)], [CUT.dear, camAt(1180, 600, 1.28)]]);
  const plead = seg(t, A[9].a, A[9].a + 0.3);
  return room(t, cam, { you: { turn: 0.85, armL: 20 + 40 * plead, armR: 20 + 40 * plead, lean: 6 * plead, face: { name: 'sad', fx: ['sweat'] } }, youAct: { energy: 1.3, arms: false }, gran: { face: { name: 'happy', eyes: { type: 'happy' } } }, mom: { mugUp: true }, phoneScreen: (pw, ph) => E.phoneShop(pw, ph, t, { coins: 9999999, label: 'RENT DUE: 50' }) });
}
// ---- 18. GRANDMA: "That's why it's only fifty, dear." — sweetly, over her glasses; a heart on "dear"
function shDear(t) {
  const cam = camKeys(t, [[CUT.dear, GCAM], [CUT.alone, camAt(1745, 600, 2.35, 960, 520)]]);
  const tD = w(10, 'dear');
  let o = realGranny(t, cam, { coins: 9999999, label: 'RENT DUE: 50', gran: { face: { name: 'happy', eyes: { look: [-0.6, 0.1] } } } });
  const p = toScr(cam, 1700, 470);
  o += G.emoteHearts({ x: p.x, y: p.y, age: t - tD, n: 5, s: 0.9, life: 1.3 });
  return o;
}
// ---- 19. (beat) the avatar Granny strolls off with her money bag; the hero alone at the SOLD gate
function shAlone(t) {
  const cam = camAt(-300, 640, 1.05);
  const u = seg(t, CUT.alone, CUT.wallet + 0.2);
  let chars = '';
  chars += gran(t, { x: lerp(-100, 300, u), y: 935, s: tyS(935), view: 'side', flip: true, ...AC.walk(t * 8), coins: 0.6, face: 'happy' });
  chars += you(t, { x: -600, y: 940, s: tyS(940), turn: 0.4, armL: 8, armR: 8, headRot: 8, face: { name: 'sad' } }, { arms: false });
  let o = tycoonShot(t, cam, { granny: 4, neon: 1, billboard: 1, sold: 1 }, '', chars);
  return o;
}
// ---- 20. "You had twelve coins." — the wallet opens: 12 COINS; a moth flutters out
function shWallet(t) {
  const cam = camAt(-560, 520, 2.1);
  let o = tycoonShot(t, cam, { granny: 4, neon: 1, billboard: 1, sold: 1 }, '', you(t, { x: -560, y: 940, s: tyS(940), armL: 40, armR: 40, nametag: false, volume: false, face: { name: 'deadpan' } }, { arms: false }));
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#10162A', opacity: 0.35 });
  const k = seg(t, tWallet - 0.15, tWallet + 0.45);
  o += G.wallet({ x: 960, y: 560, s: 1.35, k, t, coins: 12, moth: seg(t, tMoth, tMoth + 1.6) });
  return o + whip(t, CUT.wallet, 1, 0.08);
}
// ---- 21. (beat) his deadpan face; the moth circles his crown; cricket… → whip to SC 07
function shFace(t) {
  const hx = -560, hy = 940, hs = tyS(hy);
  const cam = camKeys(t, [[CUT.face, camAt(-560, 610, 2.4, 960, 470)], [END, camAt(-560, 610, 2.55, 960, 470)]], ease.linear);
  const hero = you(t, { x: hx, y: hy, s: hs, volume: false, nametag: false, armL: 8, armR: 8, face: { name: 'deadpan' } }, { arms: false });
  let o = tycoonShot(t, cam, { granny: 4, neon: 1, billboard: 1, sold: 1 }, '', hero);
  // the moth: little loops around his head
  const a = (t - CUT.face) * 5, p = toScr(cam, hx, hy - 960 * hs);
  const mx = p.x + 220 * Math.cos(a), my = p.y + 40 + 60 * Math.sin(a * 2), fla = Math.abs(Math.sin(t * 30));
  const wing = (sd) => S.path(`M0 0 Q${sd * 40} ${f(-50 * fla - 10)} ${sd * 62} -8 Q${sd * 48} 24 0 8 Z`, ol('#C9C2B4', 4));
  o += S.g(wing(-1) + wing(1) + S.ellipse(0, 4, 9, 22, ol('#8A8070', 4)), tf(mx, my, 1.1, 20 * Math.sin(a)));
  o += myCoins(t, { col: '#FF4B5C' });
  return o + whip(t, END, 1, 0.14);
}

// ================================================================= dispatch
const SHOTS = [
  [CUT.valley, shValley], [CUT.little, shLittle], [CUT.stand, shStand], [CUT.cute, shCute], [CUT.grow, shGrow], [CUT.top, shTop], [CUT.board, shBoard],
  [CUT.rude, shRude], [CUT.rudeReal, shRudeReal], [CUT.hired, shHired], [CUT.more, shMore], [CUT.noodle, shNoodle], [CUT.employee, shEmployee],
  [CUT.bought, shBought], [CUT.base, shBase], [CUT.rent, shRent], [CUT.grandson, shGrandson], [CUT.dear, shDear], [CUT.alone, shAlone], [CUT.wallet, shWallet], [CUT.face, shFace],
].sort((a, b) => a[0] - b[0]);
function shotAt(t) {
  let i = SHOTS.length - 1;
  while (i > 0 && t < SHOTS[i][0]) i--;
  return i;
}
function scene(t) {
  return SHOTS[shotAt(t)][1](t);
}
function look(t) {
  if (t >= CUT.wallet) return { grade: 'warm', vignette: 0.7 };
  return { grade: 'warm', vignette: 0.45 };
}
const BEATS = { T0, END, tOpen, tPay, tCute3, tBak, tFac, tSky, tNeon, tFive, tTen, tRudeTag, tHire, tHire2, tDouble, tDental, tFlash, tSold, tDeal, tBought, tLease, tWallet, tTwelve, tMoth };
module.exports = { scene, look, SHOTS, CUT, BEATS };
