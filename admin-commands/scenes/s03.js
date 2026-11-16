// SC 03 · НОУТБУК ЗА ДОЛЛАР — the walk home onto "Server Street" (a street that shouldn't exist), the garage sale and
// the tiny old man who has been waiting ("One dollar. No refunds. And no questions." — "That was a question." — "It's
// not a game."), the sale vanishes behind your back (tumbleweed, cricket), "Cool cool cool". Night: the laptop boots
// ("Admin panel loaded. Welcome... you."), Pancake flops on the keyboard (;;;;), ";help" — command chips fly out like
// holograms, ";fly me" — you float up and BONK the ceiling.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const C = K.C;
const AC = require('./acting');
const SETS = require('./sets');
const { pancake } = require('../rig/cats');
const X = require('./s02_env');
const { camAt, pop, OUT, tr, kIn, shakeCam, shakes, room, nightLight, playerCard, tag, stamp } = X;
const { SPOTS } = SETS;

const START = K.V.scene('SC 03').start, END = K.V.scene('SC 04').start;
const A = Array.from({ length: 19 }, (_, i) => L('03.' + i));
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;
const you = (t, pose, act = { arms: false }) => actor('you', t, pose, act);

// ---------------------------------------------------------------- cuts (all from the voice)
const d01 = START;
const d02 = w(0, 'garage') - 0.1;
const d03 = w(0, 'On', 1) - 0.08;
const d04 = A[1].a - 0.05;
const d05 = w(1, 'Since') - 0.08;
const d06 = A[2].a - 0.05;
const d07 = w(2, 'who') - 0.08;
const d08 = A[3].a - 0.05;
const d09 = w(3, "You'll") - 0.08;
const d10 = A[4].a - 0.05;
const d11 = A[5].a - 0.05;
const d12 = w(5, 'No') - 0.08;
const d13 = w(5, 'And') - 0.08;
const d14 = A[6].a - 0.05;
const d15 = A[7].a - 0.05;
const d16 = A[8].a - 0.05;
const d17 = w(8, "It's") - 0.08;
const d18 = A[9].a - 0.05;
const d19 = w(9, 'and') - 0.08;
const d20 = A[10].a - 0.05;
const d21 = w(10, 'Totally') - 0.08;
const d22 = A[11].a - 0.05;
const d23 = w(11, 'no') - 0.08;
const d24 = w(11, 'Just') - 0.08;
const d25 = A[12].a - 0.05;
const d26 = A[13].a - 0.05;
const d27 = A[14].a - 0.4;
const d28 = w(14, 'This') - 0.08;
const d29 = A[15].a - 0.05;
const d30 = w(15, 'You', 1) - 0.06;
const d31 = A[16].a - 0.05;
const d32 = w(16, 'Teleport') - 0.08;
const d33 = w(16, 'Kick') - 0.35;
const d34 = A[17].a - 0.05;
const d35 = w(17, 'So') - 0.08;
const d36 = A[18].a - 0.05;
const tOW = w(18, 'OW');
const d37 = tOW - 0.22;
const d38 = w(18, "There's") - 0.08;
// the sale vanishes behind your back between "turn" and "gone"
const tVan0 = w(9, 'turn'), tGone = w(9, 'gone');

// ---------------------------------------------------------------- Server Street
const SS = SPOTS.serverStreet;
function street(t, cam, chars, opts = {}) {
  const Ls = SETS.serverStreet.layers(t, cam, { flicker: 1, ...opts });
  return Ls.bg + Ls.mid + view(cam, chars, 1) + Ls.fg;
}
function shHome(t) {
  // the normal evening street: walking home with the backpack, humming
  const hx = 500 + 210 * (t - START);
  const cam = { zoom: 1.2, x: hx - 860, y: 70 };
  const ph = (t - START) * 7.2;
  const hero = you(t, { x: hx, y: 940, s: 0.5, view: 'side', flip: true, ...AC.walk(ph), face: { name: 'happy', eyes: { type: 'closed' } } });
  const Ls = SETS.street.layers(t, cam, { time: 'evening', pigeon: false });
  let o = Ls.bg + Ls.mid + view(cam, hero + C.musicNotes(t, hx + 40, 520), 1) + Ls.fg;
  o += C.whiteFlash(1 - seg(t, START, START + 0.25));
  return o;
}
function shSale(t) {
  const tN = w(0, 'never'), tB = w(0, 'before');
  const stop = seg(t, d02, tN);
  const hx = lerp(950, 1180, ease.out(stop));
  const cam = camKeys(t, [[d02, { x: 700, y: 30, zoom: 1.05 }], [d03, { x: 820, y: 20, zoom: 1.1 }]]);
  const dbl = t > tN ? 1 : 0;
  const hero = dbl ? you(t, { x: hx, y: 940, s: 0.5, turn: 0.6, armL: 10, armR: 10, headRot: 8 * Math.sin((t - tN) * 30) * (1 - seg(t, tN, tN + 0.4)), face: { name: 'shocked', fx: ['exclaim'] } })
    : you(t, { x: hx, y: 940, s: 0.5, view: 'side', flip: true, ...AC.walk((t - d02) * 7 * (1 - stop)), face: 'neutral' });
  let o = street(t, cam, hero);
  o += tag('GARAGE SALE?', 1500, 260, seg(t, tB, tB + 0.2), '#E6B8FF', -5, 60);
  return o;
}
function shSign(t) {
  const cam = camKeys(t, [[d03, camAt(SS.sign.x, 640, 1.3)], [d04, camAt(SS.sign.x, 470, 2.2)]]);
  let o = street(t, cam, '');
  // loading bar under the sign: the street is still "loading"
  const p = clamp((t - d03) / (d04 - d03), 0, 1);
  o += view(cam, S.rect(SS.sign.x - 150, 520, 300, 22, 11, ol('#1E1640', 4)) + S.rect(SS.sign.x - 146, 524, 292 * (0.3 + 0.62 * p), 14, 7, { fill: '#3DFF9A' }) + TF('LOADING STREET...', SS.sign.x, 576, 22, '#E6D2FF'), 1);
  return o;
}
function shRead(t) {
  const tS = w(1, 'Street');
  const cam = camKeys(t, [[d04, camAt(560, 600, 1.45)], [d05, camAt(560, 590, 1.55)]]);
  const hero = you(t, { x: 640, y: 940, s: 0.5, turn: -0.45, armL: 10, armR: lerp(10, 150, seg(t, d04, d04 + 0.4)), headRot: -8, face: { name: 'confused', eyes: { look: [-0.7, -0.9] } } }, { arms: false, energy: 0.8 });
  return street(t, cam, hero);
}
function shSince(t) {
  const tW = w(1, 'when'), tS = w(1, 'Server', 1);
  const cam = camKeys(t, [[d05, camAt(940, 620, 1.75)], [d06, camAt(940, 600, 1.9)]]);
  const hero = you(t, { x: 940, y: 960, s: 0.5, turn: 0.1, armL: 60 + 20 * Math.sin(t * 5), armR: 70, face: { name: 'confused', fx: ['question'] } }, { arms: false, energy: 1.2 });
  let o = street(t, cam, hero);
  // every window on the street blinks at once
  if (t > tS) { const k = Math.floor((t - tS) * 6) % 2; if (k) o += S.rect(0, 0, 1920, 1080, 0, { fill: '#3DFF9A', opacity: 0.06 }); }
  return o;
}

// ---------------------------------------------------------------- the garage sale
const GS = SPOTS.garageSale;
const OM = { ...GS.oldman, y: GS.oldman.y - 50 };   // standing on a crate behind the table: his shoulders clear the table top
// opts: gone, laptop; p: behind (old man layer), chars, over
function sale(t, cam, opts, p = {}) {
  const Ls = SETS.garageSale.layers(t, opts);
  let o = view(cam, Ls.bg, 0.7) + view(cam, Ls.mid + (p.wall || '') + (p.behind || '') + Ls.front + (p.chars || ''), 1);
  o += view(cam, Ls.light, 1);
  if (p.over) o += view(cam, p.over, 1);
  return o;
}
const oldman = (t, pose = {}, act = { arms: false }) => actor('oldman', t, { ...OM, ...pose }, act);
const heldLaptop = (k = 1) => ({ svg: SETS.laptop(0, -250, 0.62 * k, '', { back: true, dust: 1 }), layer: 'front' });
function shOld1(t) {
  const tO = w(2, 'old');
  const cam = camKeys(t, [[d06, camAt(900, 600, 1.05)], [d07, camAt(980, 620, 1.15)]]);
  const up = ease.outBack(seg(t, tO - 0.1, tO + 0.3));
  const cid = S.uid('s03om');
  const om = S.clipDef(cid, S.rect(800, 0, 700, 700, 0)) + S.g(oldman(t, { y: OM.y + 330 * (1 - up), face: 'happy', armL: 10, armR: 10 }), null, { 'clip-path': `url(#${cid})` });
  const hero = you(t, { ...GS.hero, view: 'side', flip: true, armL: 10, armR: 10, face: t > tO ? { name: 'shocked', fx: ['exclaim'] } : 'neutral', lift: t > tO ? 30 * bump(t, tO, tO + 0.3) : 0 });
  return sale(t, cam, { glow: 0.5 }, { behind: om, chars: hero });
}
function cobweb(x, y, s) {
  return S.g(S.path('M0 0 L-90 -60 M0 0 L-100 10 M0 0 L-60 70 M0 0 L20 -100 M-30 -20 Q-40 0 -34 20 M-60 -40 Q-74 0 -66 44', ln(2.4, '#FFFFFF', 0.85)), tr(x, y, s));
}
function shOld2(t) {
  const tW = w(2, 'waiting');
  const cam = camKeys(t, [[d07, camAt(OM.x, 540, 2.4)], [d08, camAt(OM.x, 530, 2.65)]]);
  const om = oldman(t, { face: { name: 'happy', eyes: { look: [-0.6, 0] } }, armL: 10, armR: 10, volume: false });
  const pct = Math.min(100, Math.round(lerp(97, 100, seg(t, d07, tW))));
  const wheel = t < tW ? K.loadingWheel(OM.x, 420, 24, t, '#E6D2FF', 8) : S.circle(OM.x, 420, 24, ol('#3DFF9A', 4)) + S.path(`M${OM.x - 12} 420 l8 9 l16 -18`, ln(5, '#0E241A'));
  const label = TF(t < tW ? `WAITING... ${pct}%` : 'DONE WAITING', OM.x, 384, 20, t < tW ? '#E6D2FF' : '#3DFF9A', OUT(5));
  let o = sale(t, cam, { glow: 0.5 }, { behind: om + cobweb(OM.x + 60, 540, 0.6) + cobweb(OM.x - 55, 610, -0.5), over: wheel + label });
  if (t > tW) o += view(cam, K.F.sparkle(OM.x - 22, 556, 16 * bump(t, tW, tW + 0.5)) + K.F.sparkle(OM.x + 22, 556, 14 * bump(t, tW + 0.1, tW + 0.6)), 1);
  return o;
}
function shAhh(t) {
  const tF = w(3, 'Finally');
  const cam = camKeys(t, [[d08, camAt(OM.x - 40, 580, 2.0)], [d09, camAt(OM.x - 40, 570, 2.1)]]);
  const open = ease.outBack(seg(t, tF - 0.2, tF + 0.2));
  const om = oldman(t, { armL: lerp(10, 70, open), armR: lerp(10, 70, open), face: 'happy' }, { arms: false });
  return sale(t, cam, { glow: 0.5 }, { behind: om });
}
function shLaptop(t) {
  const tL = w(3, 'laptop');
  const lap = GS.laptop;
  const cam = camKeys(t, [[d09, camAt(lap.x + 30, lap.y - 70, 3.0)], [d10, camAt(lap.x + 20, lap.y - 80, 3.6)]]);
  const g = 0.5 + 1.5 * seg(t, tL - 0.1, tL + 0.3);
  const om = oldman(t, { armL: 60, armR: 10, face: 'sneaky' });
  let o = sale(t, cam, { glow: Math.min(1, g) }, { behind: om });
  if (t > tL) { const k = seg(t, tL, tL + 0.6); o += view(cam, SETS.glowSpot(lap.x, lap.y - 90, 120, 'setsGlowGreen', 0.8 * (1 - k * 0.4)) + K.sparkles([[lap.x - 70, lap.y - 160, 12], [lap.x + 80, lap.y - 140, 10], [lap.x + 10, lap.y - 190, 9]], t), 1); }
  return o;
}
function shDidnt(t) {
  const tA = w(4, 'anything');
  const cam = camKeys(t, [[d10, camAt(GS.hero.x + 40, 680, 2.3)], [d11, camAt(GS.hero.x + 40, 670, 2.45)]]);
  const hero = you(t, { ...GS.hero, turn: 0.35, volume: false, armR: 40, armL: lerp(10, 50, seg(t, d10, d10 + 0.3)), headRot: 6, face: { name: 'confused', fx: t > tA ? ['question'] : [] } }, { arms: false });
  return sale(t, cam, { glow: 0.6 }, { chars: hero });
}
function shDollar(t) {
  const tO = w(5, 'One'), tD = w(5, 'dollar');
  const cam = camKeys(t, [[d11, camAt(860, 640, 1.45)], [d12, camAt(880, 640, 1.52)]]);
  // the laptop slides off the table into your arms on "dollar"
  const u = ease.inOut(seg(t, tD - 0.1, tD + 0.5));
  const lap = GS.laptop;
  const hx = GS.hero.x, hy = GS.hero.y - 250 * 0.5;
  const slide = u < 1 ? SETS.laptop(lerp(lap.x, hx, u), lerp(lap.y, hy + 40, u) - Math.sin(u * Math.PI) * 60, lerp(lap.s, 0.31, u), '', { lid: lerp(1, 0, clamp(u * 2, 0, 1)), off: true, dust: 1 }) : '';
  const om = oldman(t, { armR: t > tO - 0.1 ? 160 : 10, armL: lerp(10, 70, bump(t, tD - 0.2, tD + 0.6)), face: 'sneaky' });
  const hero = you(t, { ...GS.hero, turn: 0.4, armL: 34, armR: 34, face: u < 1 ? 'shocked' : 'confused', props: u >= 1 ? [heldLaptop()] : [] });
  let o = sale(t, cam, { glow: 0.4, laptop: false }, { behind: om, chars: hero + slide });
  o += tag('$1', 1210, 330, seg(t, tO, tO + 0.2), '#9FD69A', 8, 90);
  return o;
}
function shRefunds(t) {
  const tR = w(5, 'refunds');
  const cam = camKeys(t, [[d12, camAt(1800, 720, 3.0)], [d13, camAt(1806, 726, 3.3)]]);
  let o = sale(t, cam, { glow: 0.4, laptop: false }, {});
  const k = seg(t, tR, tR + 0.25);
  if (k > 0) o += view(cam, S.path(`M1716 ${f(758)} L${f(lerp(1716, 1812, k))} ${f(754)}`, ln(6, '#E8243C')), 1);
  o += stamp('FINAL SALE', 470, 640, seg(t, tR + 0.1, tR + 0.35), '#E8243C', -10, 70);
  return o;
}
function shQuestions(t) {
  const tQ = w(5, 'questions');
  const cam = camKeys(t, [[d13, camAt(OM.x - 20, 560, 2.4)], [d14, camAt(OM.x - 20, 550, 2.6)]]);
  const wag = Math.sin(t * 14) * 14;
  const om = oldman(t, { volume: false, armR: 160 + wag * (t > tQ - 0.3 ? 1 : 0), armL: 10, headRot: -4, face: 'sneaky' });
  return sale(t, cam, { glow: 0.4, laptop: false }, { behind: om });
}
function shWhy(t) {
  const tD = w(6, 'do');
  const cam = camKeys(t, [[d14, camAt(GS.hero.x + 10, 690, 2.2)], [tD - 0.1, camAt(GS.hero.x + 10, 700, 2.3)], [d15, camAt(GS.hero.x, 820, 3.6)]]);
  const hero = you(t, { ...GS.hero, turn: 0.25, armL: 34, armR: 34, volume: false, face: { name: 'confused', eyes: { look: [0, 0.8] } }, props: [heldLaptop()] }, { arms: false });
  let o = sale(t, cam, { glow: 0.4, laptop: false }, { chars: hero });
  const k = seg(t, tD, tD + 0.3);
  if (k > 0) o += view(cam, S.circle(GS.hero.x - 37, 803, 64, { fill: 'none', stroke: '#FF2E4E', 'stroke-width': 5, 'stroke-dasharray': `${f(410 * k)} 900` }), 1);
  return o;
}
function shQuestion(t) {
  const tQ = w(7, 'question');
  const cam = shakeCam(camKeys(t, [[d15, camAt(OM.x, 560, 2.6)], [d16, camAt(OM.x, 550, 2.7)]]), t, tQ, 0.35, 12);
  const om = oldman(t, { armR: 10, armL: 10, volume: false, face: 'smug' });
  let o = sale(t, cam, { glow: 0.4, laptop: false }, { behind: om });
  const k = seg(t, tQ, tQ + 0.15);
  if (k > 0) {
    o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FF2E4E', opacity: f(0.18 * (1 - seg(t, tQ + 0.15, tQ + 0.5))) });
    o += S.g(S.circle(0, 0, 110, ol('#FF2E4E', 10)) + S.path('M-50 -50 L50 50 M50 -50 L-50 50', ln(26, '#FFFFFF')), `translate(1500 340) scale(${f(pop(k))})`);
    o += K.bang('BZZT!', 1500, 560, k, 90, 6, '#FFE14D');
  }
  return o;
}
function shOneMore(t) {
  const cam = camKeys(t, [[d16, camAt(OM.x, 560, 2.4)], [d17, camAt(OM.x, 555, 3.6)]], ease.in);
  const dark = seg(t, d16, d17);
  const om = oldman(t, { armL: 10, armR: 120, lean: 6, volume: false, face: { name: 'sneaky', eyes: { look: [0, 0.2] } } });
  return sale(t, cam, { glow: 0.3, laptop: false }, { behind: om, over: S.rect(-2000, -2000, 6000, 5000, 0, { fill: '#0A0620', opacity: f(0.45 * dark) }) });
}
function shGame(t) {
  // ECU on the eyes... and on "game" a snap back: his shadow on the garage wall is HUGE, with a crown
  const tG = w(8, 'game');
  const wide = t >= tG - 0.04;
  const cam = wide ? shakeCam(camKeys(t, [[tG - 0.04, camAt(1020, 470, 1.55)], [d18, camAt(1020, 480, 1.45)]]), t, tG, 0.4, 10)
    : camKeys(t, [[d17, camAt(OM.x, 555, 3.8)], [tG, camAt(OM.x, 558, 4.4)]]);
  const om = oldman(t, { armL: 10, armR: 10, volume: wide ? undefined : false, face: { name: wide ? 'smug' : 'neutral', eyes: { look: [0, 0] } } });
  const fl = wide ? (hash(Math.floor(t * 14)) > 0.12 ? 1 : 0.35) : 0;
  const wall = fl > 0 ? S.rect(420, 350, 840, 380, 0, { fill: '#FFD27A', opacity: f(0.42 * fl) }) + X.adminShadow(OM.x - 90, 735, 0.6, 0.85 * fl) : '';
  const glint = K.F.sparkle(OM.x - 22, 556, 14 * bump(t, tG - 0.6, tG)) + K.F.sparkle(OM.x + 22, 556, 14 * bump(t, tG - 0.6, tG), '#FFD21F');
  return sale(t, cam, { glow: 0.3, laptop: false }, { wall, behind: om, over: S.rect(-2000, -2000, 6000, 5000, 0, { fill: '#0A0620', opacity: wide ? 0.3 : 0.45 }) + (wide ? '' : glint) });
}
// vanishing sale behind your back
function shTurn(t) {
  const tD = w(9, 'dollar');
  const gone = 0.55 * ease.in(seg(t, tVan0, d19));
  const cam = camKeys(t, [[d18, camAt(820, 640, 1.5)], [d19, camAt(840, 640, 1.6)]]);
  const dig = Math.sin(t * 16) * 10;
  const found = t > tD;
  const item = (i, txt, col) => { const k = seg(t, d18 + 0.5 + i * 0.5, d18 + 0.9 + i * 0.5); return k > 0 && k < 1 ? S.g(TF(txt, 0, 0, 34, col, OUT(6)), tr(820 + 130 + 70 * i, 760 - 180 * Math.sin(k * Math.PI), 1, 20 * k)) : ''; };
  const props = [{ svg: SETS.laptop(-150, -330, 0.5, '', { back: true }), layer: 'back' }];
  if (found) props.push({ svg: X.dollar(240, -820, 1.1 * pop(seg(t, tD, tD + 0.25)), -10, 1), layer: 'top' });
  const hero = you(t, { x: 820, y: 990, s: 0.5, turn: 0, armL: 30, armR: found ? 160 : 28 + dig, face: found ? 'joy' : { name: 'confused', eyes: { look: [0.5, 0.8] } }, props });
  const items = item(0, 'lint', '#C9CED8') + item(1, 'a button', '#FFD21F') + item(2, 'gum?', '#FF9EC4');
  return sale(t, cam, { glow: 0.4, laptop: false, gone }, { chars: hero + items });
}
function shGone(t) {
  const tG = tGone;
  const gone = lerp(0.55, 1, ease.inOut(seg(t, d19, tG)));
  const turnK = ease.out(seg(t, d19, d19 + 0.35));
  const cam = camKeys(t, [[d19, camAt(820, 620, 1.5)], [tG, camAt(900, 560, 1.0)], [d20, camAt(900, 560, 0.95)]]);
  const tumble = t > tG ? seg(t, tG + 0.2, d20 + 0.2) : undefined;
  const hero = you(t, { x: 820, y: 990, s: 0.5, view: turnK > 0.5 ? 'back' : 'front', turn: turnK > 0.5 ? 0 : turnK, armL: 30, armR: 150, props: [{ svg: X.dollar(240, -820, 1.1, -10, 1), layer: turnK > 0.5 ? 'back' : 'top' }] });
  let o = sale(t, cam, { glow: 0.4, laptop: false, gone, ...(tumble !== undefined ? { tumble } : {}) }, { chars: hero });
  if (t > tG + 0.3) { const k = Math.floor((t - tG) * 3) % 2; o += TF(k ? 'chirp.' : '', 1560, 800, 40, '#E6D2FF', { opacity: 0.85, 'font-style': 'italic' }); }
  return o;
}
function shCool(t) {
  const ws = [w(10, 'Cool'), w(10, 'Cool', 1), w(10, 'cool', 2), w(10, 'cool', 3)];
  const cam = camKeys(t, [[d20, camAt(900, 660, 2.3)], [d21, camAt(900, 650, 2.5)]]);
  const nod = Math.max(...ws.map((x, i) => bump(t, x, x + 0.25 - i * 0.03)));
  const hero = you(t, { x: 900, y: 1000, s: 0.5, turn: 0.1, armL: 12, armR: 150, volume: false, headY: 18 * nod, bodyY: 4 * nod, props: [{ svg: X.dollar(240, -820, 1.1, -10, 1), layer: 'top' }], face: { name: 'nervous', mouth: 'smile', fx: ['sweat', 'sweat2'], eyes: { look: [Math.sin(t * 7) > 0 ? 0.8 : -0.8, 0] } } });
  return sale(t, cam, { glow: 0, laptop: false, gone: 1, tumble: seg(t, d20 - 1.5, d21 + 1) }, { chars: hero });
}
function shRun(t) {
  const tN = w(10, 'neighborhood');
  const cam = camKeys(t, [[d21, camAt(900, 600, 1.15)], [d22, camAt(860, 600, 1.2)]]);
  const back = ease.inOut(seg(t, d21, tN));
  const run = seg(t, tN + 0.1, tN + 0.7);
  const x = lerp(900, 720, back) - 1600 * ease.in(run);
  const hero = run > 0 ? you(t, { x, y: 990, s: 0.5, view: 'side', ...AC.run(t * 34), lean: -12, face: 'scream', props: [{ svg: SETS.laptop(-120, -330, 0.5, '', { back: true }), layer: 'back' }] })
    : you(t, { x, y: 990, s: 0.5, turn: 0.2, ...AC.walkFront(t * 9, 0.6), armL: 12, armR: 12, face: { name: 'nervous', mouth: 'smile', fx: ['sweat'] }, props: [{ svg: SETS.laptop(-150, -330, 0.5, '', { back: true }), layer: 'back' }] });
  let o = sale(t, cam, { glow: 0, laptop: false, gone: 1, tumble: 0.92 }, { chars: hero });
  if (run > 0) o += view(cam, C.dust(x + 120, 960, tN + 0.1, t) + C.speedLines(x + 200, x + 900, 760, 8, 7, '#FFFFFF', 300), 1);
  o += K.bang('ZOOM!', 600, 360, seg(t, tN + 0.12, tN + 0.25), 120, -8, '#FFE14D');
  return o;
}

// ---------------------------------------------------------------- the bedroom at night
const HR = SPOTS.heroRoom;
const LX = 1390;                // laptop / hero x on the bed
const SIT = { x: LX, y: 846, s: 0.5 };
function bedroom(t, cam, p = {}, opts = {}) {
  const glowK = p.glow ?? 1;
  const gr = Math.min(300, 420 / (cam.zoom || 1));   // keep the gradient small on screen (cost ~ its screen area)
  const night = nightLight(LX, 560, 160, 1150, 0.62) + (glowK > 0 ? SETS.glowSpot(LX, 560, gr, 'setsGlowGreen', 0.38 * glowK * (0.9 + 0.1 * Math.sin(t * 3.1))) : '');
  return room(SETS.heroRoom, t, cam, { time: 'night', laptopAt: false, ...opts }, { behind: p.behind || '', chars: p.chars || '', light: false, night, over: p.over || '' });
}
const lapBack = (t, g = 1, y = 760) => SETS.laptop(LX, y, 0.34, '', { back: true, glow: g, t });
// the laptop seen from the front, filling the frame; screen = fn(w, h)
function lapInsert(t, cam, screen, extra = '', over = '', ly = 1180, ls = 2.6) {
  let o = S.rect(-2000, -2000, 6000, 5000, 0, { fill: '#1B2A5E' }) + S.rect(-2000, -2000, 6000, 5000, 0, { fill: 'url(#setsHRQuilt)', opacity: 0.5 });
  o += SETS.glowSpot(960, 420, 700, 'setsGlowGreen', 0.35);
  o += SETS.laptop(960, ly, ls, screen, { t, dust: 0.4 });
  o += extra;
  return view(cam, o, 1) + over;
}
function shHome2(t) {
  const cam = camKeys(t, [[d22, camAt(1180, 520, 1.15)], [d23, camAt(1250, 520, 1.3)]]);
  const hero = you(t, { ...SIT, armL: 26, armR: 26, face: { name: 'neutral', eyes: { look: [0, 0.6] } } });
  const cat = pancake({ x: 1250, y: 712, s: 0.36, t, pose: 'sleep' });
  return bedroom(t, cam, { behind: hero, chars: cat + lapBack(t) });
}
function desktop(t, kA, kG) {
  return (wd, h) => {
    const k = Math.min(wd / 400, h / 300);
    let o = S.rect(-wd / 2, -h / 2, wd, h, 0, { fill: '#0E1A14' });
    let c = S.rect(-200, 126, 400, 24, 0, { fill: '#1E2A22' }) + S.rect(-196, 129, 40, 18, 4, { fill: '#3DFF9A', opacity: 0.6 });
    const win = (x, y, title, kk) => (kk > 0 ? S.g(S.rect(-80, -55, 160, 110, 8, ol('#E9EDF3', 3)) + S.rect(-80, -55, 160, 22, 8, { fill: '#5A6478' }) + TF(title, 0, -38, 13, '#FFFFFF') + T('0', 0, 30, 46, '#FF4D5E') + TF('nothing here', 0, 48, 11, '#5A6478'), `translate(${x} ${y}) scale(${f(pop(kk))})`) : '');
    c += win(-90, -20, 'APPS', kA) + win(90, -10, 'GAMES', kG);
    return o + S.g(c, `scale(${f(k)})`);
  };
}
function shApps(t) {
  const tA = w(11, 'apps'), tG = w(11, 'games');
  const cam = camKeys(t, [[d23, camAt(960, 470, 1.0)], [d24, camAt(960, 460, 1.06)]]);
  return lapInsert(t, cam, desktop(t, seg(t, tA - 0.05, tA + 0.2), seg(t, tG - 0.05, tG + 0.2)));
}
function shBlack(t) {
  const tN = w(11, 'name');
  const cam = camKeys(t, [[d24, camAt(960, 430, 1.06)], [d25, camAt(960, 400, 1.35)]]);
  const scr = (wd, h) => S.rect(-wd / 2, -h / 2, wd, h, 0, { fill: '#020403' }) + (Math.floor(t * 2.2) % 2 ? '' : S.rect(-wd / 2 + 30, -h / 2 + 30, wd * 0.03, h * 0.07, 2, { fill: '#3DFF9A' })) + (t > tN && hash(Math.floor(t * 20)) > 0.6 ? S.rect(-wd / 2, -h * 0.1, wd, h * 0.04, 0, { fill: '#3DFF9A', opacity: 0.3 }) : '');
  return lapInsert(t, cam, scr);
}
function typed(s, k) { return s.slice(0, Math.round(clamp(k, 0, 1) * s.length)); }
function bootLines(t) {
  const l1 = typed('Admin panel loaded.', kIn(t, w(12, 'Admin'), w1(12, 'loaded')));
  const l2 = typed('Welcome...', kIn(t, w(12, 'Welcome'), w1(12, 'Welcome'))) + (t >= w(12, 'you') ? ' you.' : '');
  return [l1, ...(l2 ? [l2] : [])].filter(Boolean);
}
function shLoaded(t) {
  const cam = camKeys(t, [[d25, camAt(960, 400, 1.35)], [d26, camAt(960, 380, 1.55)]]);
  const tY = w(12, 'you');
  let o = lapInsert(t, cam, SETS.adminScreen(t, { lines: bootLines(t) }));
  if (t > tY) o += K.sparkles([[600, 260, 22], [1340, 300, 18]], t);
  return o;
}
function shUser(t) {
  const cam = camKeys(t, [[d26, camAt(LX, 520, 2.6)], [d27, camAt(LX, 510, 2.8)]]);
  const hero = you(t, { ...SIT, armL: 26, armR: 26, volume: false, face: { name: 'shocked', eyes: { look: [0, 0.5] } } }, { arms: false, energy: 0.4 });
  const chip = K.chatCommand(LX + 250, 400, '', 1, { t, user: 'you', s: 0.5 * pop(seg(t, d26 + 0.3, d26 + 0.6)), cursor: true });
  return bedroom(t, cam, { behind: hero, chars: lapBack(t), over: chip });
}
function semis(k) { const n = Math.floor(lerp(0, 60, k)); const r = []; for (let i = 0; i < Math.ceil(n / 20); i++) r.push(';'.repeat(Math.min(20, n - i * 20))); return r; }
function shFlop(t) {
  const land = A[14].a - 0.12;
  const cam = shakeCam(camKeys(t, [[d27, camAt(960, 540, 1.0)], [d28, camAt(960, 560, 1.05)]]), t, land, 0.35, 16);
  const fall = seg(t, d27, land);
  const sq = bump(t, land, land + 0.3);
  const k = seg(t, land, d28);
  const scr = SETS.adminScreen(t, { lines: ['Admin panel loaded.', 'Welcome... you.', ...semis(k)] });
  const cat = S.g(pancake({ x: 0, y: 0, s: 2.1, t, pose: 'loaf', keyboard: false, mood: t > land + 0.5 ? 'smug' : 'surprised', shadow: false }), `translate(960 ${f(lerp(-400, 1010, ease.in(fall)))}) scale(${f(1 + 0.18 * sq)} ${f(1 - 0.16 * sq)})`);
  let o = lapInsert(t, cam, scr, cat, '', 1130, 2.15);
  o += K.bang('FLOP!', 1520, 260, seg(t, land, land + 0.12) * (1 - seg(t, d28 - 0.3, d28)), 130, 8, '#FFE14D');
  return o;
}
function shSpooky(t) {
  // you lift Pancake off the keyboard at arm's length... and he pours down like liquid
  const tM = w(14, 'moment');
  const cam = camKeys(t, [[d28, camAt(LX + 80, 540, 1.9)], [d29, camAt(LX + 80, 530, 2.0)]]);
  const lift = ease.inOut(seg(t, d28, tM));
  const stretch = 1 + 0.9 * lift;
  const hero = you(t, { ...SIT, armL: 14, armR: 92, lean: -3, face: { name: 'deadpan', eyes: { look: [-0.4, 0] }, fx: lift > 0.6 ? ['sweat'] : [] } }, { arms: false, energy: 0.4 });
  const h = AC.hand(92, 1), hx = LX + h[0] * 0.5, hy = SIT.y + h[1] * 0.5;
  const cs = 0.7;
  const cat = S.g(pancake({ x: 0, y: 250 * cs, s: cs, t, pose: 'sit', mood: 'smug', shadow: false, look: [-0.6, 0.2] }), `translate(${f(hx)} ${f(hy - 30)}) scale(1 ${f(stretch)})`);
  return bedroom(t, cam, { behind: hero, chars: lapBack(t) + cat });
}
// ---------------------------------------------------------------- ;help and the command chips
function hands(t, crack = 0, typing = 0) {
  let o = '';
  for (const sx of [-1, 1]) {
    const tw = typing ? Math.max(0, Math.sin(t * 24 + sx)) * 14 : 0;
    const cr = crack ? Math.sin(t * 30) * 10 * crack : 0;
    o += S.g(S.path('M-70 300 L-50 40 L50 40 L70 300 Z', ol('#D8262E', 7)) + S.rect(-56, -40, 112, 96, 24, ol('#FFFFFF', 7)), tr(960 + sx * (260 - 120 * crack) + cr, 1000 - tw - 60 * crack, 1, sx * 8));
  }
  return o;
}
// the chat bar floating over the laptop insert (with a green halo so it reads on the dark bezel)
function cmdBar(txt, p, t, enter) {
  const w0 = Math.max(360, 70 + 6 * 15 + txt.length * 16.5 + 60) * 1.5;
  return S.rect(960 - w0 / 2 - 14, 760 - 80, w0 + 28, 150, 40, { fill: '#3DFF9A', opacity: 0.35 }) + K.chatCommand(960, 760, txt, p, { t, enter, s: 1.5 });
}
function shKnuckles(t) {
  const tA = w(15, 'anyone');
  const cam = camKeys(t, [[d29, camAt(LX, 540, 1.75)], [d30, camAt(LX, 520, 1.95)]]);
  const crack = bump(t, tA - 0.2, tA + 0.6);
  const hero = you(t, { ...SIT, armL: lerp(26, 70, crack), armR: lerp(26, 70, crack), face: crack > 0.3 ? 'determined' : 'smug' });
  const cat = pancake({ x: 1210, y: 712, s: 0.36, t, pose: 'loaf', keyboard: false, mood: 'lazy' });
  let o = bedroom(t, cam, { behind: hero, chars: lapBack(t) + cat });
  o += K.bang('CRACK', 1450, 300, seg(t, tA, tA + 0.1) * (1 - seg(t, tA + 0.5, tA + 0.7)), 90, -6, '#FFFFFF');
  return o;
}
function shTypeHelp(t) {
  const L15 = A[15];
  const p = K.typeProgress(t, L15, 'help', 'help');
  const tE = L15.b + 0.02;
  const enter = seg(t, tE, tE + 0.3);
  const cam = camKeys(t, [[d30, camAt(960, 470, 1.0)], [d31, camAt(960, 450, 1.08)]]);
  const scr = SETS.adminScreen(t, { lines: ['Admin panel loaded.', 'Welcome... you.'], typed: t < tE ? ';help'.slice(0, Math.round(p * 5)) : '' });
  let o = lapInsert(t, cam, scr, hands(t, 0, t < tE ? 1 : 0));
  o += cmdBar(';help', p, t, enter);
  o += K.commandBurst(960, 420, t - tE, '#3DFF9A', 260);
  return o;
}
const CMDS = ['fly', 'speed', 'size', 'jail', 'tp', 'god', 'noclip', 'freeze', 'kick'];
const CMD_WORD = [['Fly'], ['Speed'], ['Size'], ['Jail'], ['Teleport'], ['God'], ['Noclip'], ['Freeze'], ['Kick']];
const CHIP_POS = [[1010, 330], [1160, 230], [1330, 200], [1510, 215], [1700, 290], [940, 490], [1820, 470], [1010, 660], [1770, 650]];
const chipT = (i) => w(16, CMD_WORD[i][0]) - 0.05;
// chips fly from the laptop to their spots and then bob (world space around the bed)
function chips(t, scale = 0.85, only = null) {
  let o = '';
  CMDS.forEach((c, i) => {
    if (only && !only.includes(i)) return;
    const t0 = chipT(i);
    if (t < t0) return;
    const u = ease.outBack(seg(t, t0, t0 + 0.45));
    const [px, py] = CHIP_POS[i];
    const x = lerp(LX, px, u) + 10 * Math.sin(t * 1.7 + i), y = lerp(640, py, u) + 12 * Math.sin(t * 2.1 + i * 1.3);
    o += X.holoChip(';' + c, x, y, scale, seg(t, t0, t0 + 0.2), t, { op: c === 'kick' && t < w(16, 'Kick') + 0.6 && t > w(16, 'Kick') - 0.4 ? 0 : 1 });
  });
  return o;
}
function chipRoom(t, cam, face, extra = {}) {
  const hero = you(t, { ...SIT, armL: extra.armL ?? 20, armR: extra.armR ?? 20, lean: extra.lean ?? 0, face });
  const cat = pancake({ x: 1210, y: 712, s: 0.36, t, pose: 'loaf', keyboard: false, mood: 'lazy', look: [0.6, -0.4] });
  return bedroom(t, cam, { behind: hero, chars: lapBack(t) + cat, over: chips(t) + (extra.over || '') }, { floatDust: 0.6 });
}
function shChips(t) {
  const cam = camKeys(t, [[d31, camAt(LX, 430, 1.3)], [d32, camAt(LX, 420, 1.4)]]);
  const back = ease.outBack(seg(t, d31, d31 + 0.5));
  let o = chipRoom(t, cam, { name: 'amazed', eyes: { type: 'star' } }, { lean: 6 * back, armL: 30 + 40 * back, armR: 30 + 40 * back });
  o += tag('AVAILABLE COMMANDS', 960, 120, seg(t, d31 + 0.2, d31 + 0.45), '#3DFF9A', -2, 56, '#08221A');
  return o;
}
function shChips2(t) {
  const cam = camKeys(t, [[d32, camAt(LX, 420, 1.75)], [d33, camAt(LX + 30, 420, 1.85)]]);
  return chipRoom(t, cam, { name: 'excited' }, { armL: 60, armR: 60 });
}
function shKick(t) {
  const tK = w(16, 'Kick');
  const cam = shakeCam(camKeys(t, [[d33, camAt(LX, 430, 1.6)], [d34, camAt(LX, 440, 1.7)]]), t, tK, 0.45, 16);
  const k = seg(t, tK - 0.05, tK + 0.25);
  let o = chipRoom(t, cam, { name: 'scared', fx: ['sweat'] }, { armL: 14, armR: 14 });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FF2E4E', opacity: f(0.22 * k * (1 - seg(t, tK + 0.3, tK + 0.9))) });
  if (k > 0) o += X.holoChip(';kick', 960, 400, lerp(3, 1.6, ease.out(k)), k, t, { col: '#FF4D5E' });
  o += tag('GULP', 1500, 760, seg(t, tK + 0.5, tK + 0.65), '#FF9EC4', 6, 50);
  return o;
}
function shGameLike(t) {
  const tG = w(17, 'game');
  const cam = camKeys(t, [[d34, camAt(LX, 470, 1.55)], [d35, camAt(LX, 460, 1.65)]]);
  const shrug = bump(t, tG - 0.3, tG + 0.5);
  return chipRoom(t, cam, t > tG - 0.3 ? 'smug' : 'joy', { armL: 20 + 40 * shrug, armR: 20 + 40 * shrug });
}
function shTypeFly(t) {
  const L17 = A[17];
  const p = K.typeProgress(t, L17, 'fly', 'me');
  const tE = L17.b + 0.04;
  const enter = seg(t, tE, tE + 0.3);
  const crack = bump(t, d35, w(17, 'joke'));
  const cam = shakeCam(camKeys(t, [[d35, camAt(960, 470, 1.0)], [tE, camAt(960, 450, 1.12)]]), t, tE, 0.3, 12);
  const scr = SETS.adminScreen(t, { lines: ['Welcome... you.', ';help', 'Commands: fly speed size jail', 'tp god noclip freeze kick'], typed: t < tE ? ';fly me'.slice(0, Math.round(p * 7)) : '' });
  let o = lapInsert(t, cam, scr, hands(t, crack, p > 0 && t < tE ? 1 : 0));
  o += cmdBar(';fly me', p, t, enter);
  o += K.commandBurst(960, 420, t - tE, '#7DF0FF', 300);
  o += K.accepted(960, 230, seg(t, tE + 0.1, tE + 0.35), 1.1);
  return o;
}
// ---------------------------------------------------------------- ;fly me -> BONK
const CEIL_FEET = HR.ceiling.heroFeet; // hero s .5 with hair touching the ceiling
function flyY(t) {
  // rises slowly off the bed ("I'm— I'm FLYING!"), accelerates on "actually—", hits the ceiling at "OW"
  const tF = w(18, 'FLYING'), tA = w(18, 'actually');
  if (t < tA) return lerp(SIT.y, 700, ease.out(seg(t, d36, tF + 0.4)));
  if (t < tOW) return lerp(700, CEIL_FEET, ease.in(seg(t, tA, tOW)));
  return CEIL_FEET + 6 * Math.max(0, Math.sin((t - tOW) * 2.4)) - 12 * bump(t, tOW, tOW + 0.15);
}
function flyHero(t) {
  const tF = w(18, 'FLYING');
  const y = flyY(t);
  const hit = t >= tOW;
  const flail = t < tF ? Math.sin(t * 14) * 30 : 0;
  const face = hit ? (t < tOW + 0.5 ? { name: 'oof', eyes: { type: 'x' } } : { name: 'dizzy', fx: ['sweat'] }) : t < tF ? 'shocked' : 'excited';
  return you(t, { x: LX, y, s: 0.5, armL: hit ? 150 : t < tF ? 70 + flail : 160, armR: hit ? 172 : t < tF ? 70 - flail : 165, legL: 6 * Math.sin(t * 5), legR: -6 * Math.sin(t * 5), sy: hit ? 1 - 0.1 * bump(t, tOW, tOW + 0.3) : 1, face, shadow: false });
}
function flyRoom(t, cam, extra = {}) {
  const bonk = t > tOW ? seg(t, tOW, tOW + 1.6) : 0;
  const cat = pancake({ x: 1210, y: 712, s: 0.36, t, pose: 'loaf', keyboard: false, mood: 'lazy', look: [0.5, -0.8], blink: 0 });
  return bedroom(t, cam, { behind: flyHero(t), chars: lapBack(t) + cat + (extra.chars || ''), over: extra.over || '' }, { bonk, bonkX: LX, floatDust: 0.6 });
}
function shFly(t) {
  const tF = w(18, 'FLYING');
  const cam = camKeys(t, [[d36, camAt(LX - 80, 520, 1.25)], [d37, camAt(LX - 40, 420, 1.35)]]);
  let o = flyRoom(t, cam, { over: K.commandBurst(LX, flyY(t) - 200, t - d36, '#7DF0FF', 260) });
  o += tag("I'M FLYING!", 520, 300, seg(t, tF, tF + 0.2), '#7DF0FF', -6, 70, '#08221A');
  return o;
}
function shBonk(t) {
  const cam = shakeCam(camKeys(t, [[d37, camAt(LX, 300, 1.6)], [tOW - 0.02, camAt(LX, 280, 1.7)], [tOW + 0.05, camAt(LX, 240, 2.6)], [d38, camAt(LX, 250, 2.5)]]), t, tOW, 0.5, 22);
  let o = flyRoom(t, cam);
  o += K.bang('BONK!', 1420, 300, seg(t, tOW, tOW + 0.1), 170, 8, '#FFE14D');
  if (t > tOW) o += view(cam, C.burst(LX, 110, seg(t, tOW, tOW + 0.35), '#FFFFFF'), 1);
  return o;
}
function dizzyStars(t, x, y, k) {
  if (k <= 0) return '';
  let o = '';
  for (let i = 0; i < 4; i++) { const a = t * 4 + (i / 4) * Math.PI * 2; o += K.F.sparkle(x + Math.cos(a) * 90, y + Math.sin(a) * 26, 16 * k); }
  return o;
}
function shCeiling(t) {
  const tC = w(18, 'ceiling', 1);
  const cam = camKeys(t, [[d38, camAt(LX - 60, 420, 1.45)], [END, camAt(LX - 80, 440, 1.35)]]);
  let o = flyRoom(t, cam, { over: dizzyStars(t, LX, 140, 1) });
  o += tag('THERE IS A CEILING', 960, 860 - 40, seg(t, tC, tC + 0.25), '#FFD21F', -3, 56);
  return o;
}

// ---------------------------------------------------------------- router
const SHOTS = [
  [d01, shHome], [d02, shSale], [d03, shSign], [d04, shRead], [d05, shSince], [d06, shOld1], [d07, shOld2], [d08, shAhh], [d09, shLaptop],
  [d10, shDidnt], [d11, shDollar], [d12, shRefunds], [d13, shQuestions], [d14, shWhy], [d15, shQuestion], [d16, shOneMore], [d17, shGame],
  [d18, shTurn], [d19, shGone], [d20, shCool], [d21, shRun], [d22, shHome2], [d23, shApps], [d24, shBlack], [d25, shLoaded], [d26, shUser],
  [d27, shFlop], [d28, shSpooky], [d29, shKnuckles], [d30, shTypeHelp], [d31, shChips], [d32, shChips2], [d33, shKick], [d34, shGameLike],
  [d35, shTypeFly], [d36, shFly], [d37, shBonk], [d38, shCeiling],
];
const CUTS = SHOTS.slice(1).map((s) => s[0]).filter((c) => ![d02, d22, d24, d25].includes(c));
const WHIPS = [d02];
function scene(t) {
  let fn = SHOTS[0][1];
  for (const [t0, s] of SHOTS) if (t >= t0) fn = s;
  let o = fn(t);
  o += X.cutFlash(t, CUTS, 0.3, 0.06);
  for (const tw of WHIPS) o += X.whip(t, tw, 0.13);
  // night falls: a slow dip to black into the bedroom
  const dip = Math.max(0, 1 - Math.abs(t - d22) / 0.25);
  if (dip > 0) o += S.rect(0, 0, 1920, 1080, 0, { fill: '#05030F', opacity: f(dip) });
  return o;
}
function look(t) {
  if (t < d02) return { grade: 'warm', vignette: 0.7 };
  if (t < d22) return t >= d16 && t < d18 ? { grade: 'night', vignette: 1 } : { grade: 'cool', vignette: 0.8 };
  return { grade: null, vignette: 0.9 };
}
module.exports = { scene, look };
