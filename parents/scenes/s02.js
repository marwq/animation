// SC 02 · ЛЕГЕНДА CUBE CITY (36.93–148.63 s) — Cube City by day: "This is you… a legend" (rooftop freeze + YOU card), the
// school photo (JUST A KID), the castle crane + LEGEND, the stats montage (LVL 1 -> 99, #1 BASE, the arena KO, 2,000 -> 2,001),
// the castle tour (red carpet, a noob dives into the lava pool, the trophy wall, the throne = FIG. 1: A CHAIR, 99,999 -> 1 coin),
// Noodle (run-in freeze, BFF fist bump, the real-life split with ??? and a ramen cup, 400 bosses montage, bro bro bro, NEW UPDATE,
// the Block King teaser over the city), DarkBlade (superhero landing + clan, freeze, profile ???, the noob who said hi, the
// standoff in chat bubbles, the shrinking "little castle", LOSING STREAK x47, BURN) — then the pull-out from the tablet into the
// Saturday kitchen: freeze-frame intros (Dad + the NINTENDO cards, Mom + VOLUME 1 + her SHH chart, Granny + scarf + cookies +
// ARGUMENTS WON 9,999 · LOST 0), Dad's FAMILY MEETING flip chart (11 HRS/DAY, NINTENDO 90%), "It's Cube City" (tablet up),
// Mom's decision, TONIGHT + FAMILY GAME NIGHT, board games, Granny's "No, dear", the device triptych, the cereal flake beat,
// "my SERVER?!" smash, the dolly-zoom horror and the smiling family — whip out to SC 03.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const G = require('./gameui');
const H = require('./sets_house');
const X = require('../rig/extras');
const CAST = require('../rig/cast');
const E = require('./s02_env');
const GA = require('./s02_game');
const { tf, TS, pop, at, toScr, shakeAll, clipTo, faceAt, boing, hop, whip, smash, zoomLines, freeze, nameCard, speech, thought, gameCard, volumeOSD, wordChart, argueBoard, boardGame, dayChip } = E;

const { C, b, T0, END } = E.timing();
const W = 1920, H_ = 1080;
const KS = H.SPOTS.kitchen.seats;
const SIZE = { you: 1, dad: 1.1, mom: 1.04, grandma: 0.9 };
const TN = H.tone({ morn: 0.55 });

// ================================================================= kitchen helpers
const PRES = H.SPOTS.kitchen.presenter;            // Dad at the flip chart (392, 884, .45)
const CHART = { x: 220, y: 884, s: 0.86 };
const chartPt = (lx, ly) => [CHART.x + lx * CHART.s, CHART.y + ly * CHART.s];
const TAB = { x: 657.9, y: 674.1 };                // YOUR tablet's screen centre on the table (world)
// NOVOL: no body-volume filter (huge zooms, where the filter regions cost hundreds of ms)
let NOVOL = false;
const seat = (who, t, pose = {}, act) => actor(who, t, H.seatPose(KS[who], SIZE[who], NOVOL ? { ...pose, volume: false } : pose), act);
const seatXY = (who) => H.seatPose(KS[who], SIZE[who], {});
// the cereal-eating arm + look at the tablet
const eating = (t) => ({ armR: 34 + 26 * Math.max(0, Math.sin(t * 3.2)), armL: 20 });
// cube-city screen for a device (fn(w, h), origin top-left)
const cubeScreen = (glow = 0) => (w, h) => {
  let s = S.rect(0, 0, w, h, 0, { fill: '#6FC3FF' }) + S.rect(0, h * 0.68, w, h * 0.32, 0, { fill: '#7ED86A' });
  s += S.circle(w * 0.82, h * 0.18, Math.min(w, h) * 0.09, { fill: '#FFE14D' });
  s += G.cubeLogo(w / 2 - Math.min(w, h) * 0.02, h * 0.45, Math.min(w, h) / 380);
  if (glow > 0) s += S.rect(0, 0, w, h, 0, { fill: '#FFFFFF', opacity: f(0.6 * glow) });
  return s;
};
// knitting drawn in FRONT of the tablecloth (the seated hands are hidden by the table): needles click with t, k = speed
function knitFront(t, x, y, s, speed = 1, lowered = 0) {
  const jig = Math.sin(t * 9 * speed) * 4 * speed;
  return S.g(X.knittingYarn({ x: 0, y: 0, s: 1, ball: [210, 60], swatch: 0.8 }), tf(x + jig, y + lowered * 40, s, -4 + jig * 0.6));
}
// Dad's newspaper held up (prop, body space)
const paperProp = (o = {}) => [{ svg: X.newspaper({ x: 0, y: -470, s: 0.95, rot: -2, title: 'THE DAILY LEDGER', headline: 'TAX SEASON IS HERE!', ...o }), layer: 'front' }];
// Mom's mug raised beside her face (prop)
const mugProp = (t, up = 1) => [{ svg: X.teaMug({ x: 150, y: lerp(-470, -640, up), s: 0.62, rot: -20 * up, text: '#1 MOM', t, steam: 0.6 }), layer: 'front' }];
// a device held up in front of the chest (prop): kind 'laptop' | 'tablet' | 'phone'
function deviceProp(kind, glow = 0, y = -560) {
  if (kind === 'laptop') return [{ svg: X.laptopOld({ x: 0, y: y + 200, s: 0.62, face: 'screen', screen: cubeScreen(glow), glow }), layer: 'front' }];
  if (kind === 'tablet') return [{ svg: X.tablet({ x: 0, y, s: 0.62, face: 'screen', screen: cubeScreen(glow), glow }), layer: 'front' }];
  return [{ svg: X.phone({ x: 0, y, s: 0.9, face: 'screen', screen: cubeScreen(glow), glow }), layer: 'front' }];
}
// the flip chart: cover page "FAMILY MEETING!" flips up (flip 0..1) to reveal the pie chart page
function flipChartMine(t, flip = 0, o = {}) {
  let g = H.flipChart(CHART.x, CHART.y, CHART.s, TN, flip >= 0.5 ? 'meeting' : 'blank');
  if (flip >= 0.5 && o.circle > 0) {
    const [cx, cy] = chartPt(56, -406), p = clamp(o.circle, 0, 1);
    g += S.ellipse(cx, cy, 66, 22, { fill: 'none', stroke: '#E04848', 'stroke-width': 5, 'stroke-dasharray': `${f(p * 300)} 400`, transform: `rotate(-6 ${f(cx)} ${f(cy)})` });
  }
  if (flip < 1) {
    const sc = Math.cos(clamp(flip, 0, 1) * Math.PI / 2 * 1.0);
    let cv = S.rect(-150, -660, 300, 380, 6, TN.ol('#FFFFFF', 5));
    cv += T('FAMILY', 0, -580, 56, TN.c('#E04848')) + T('MEETING!', 0, -522, 50, TN.c('#2E5FB8'));
    cv += S.path('M-110 -500 Q0 -488 110 -502', TN.ln(5, '#F2B84B'));
    cv += S.circle(-60, -420, 34, TN.ol('#FFD23F', 4)) + S.path('M-72 -426 h4 M-52 -426 h4 M-74 -410 Q-60 -398 -46 -410', TN.ln(4)) + TF('by DAD', 50, -404, 30, TN.c('#5A5A60'), { 'font-weight': 600 });
    if (sc > 0.02) g += S.g(cv, `translate(${CHART.x} ${CHART.y}) scale(${CHART.s}) translate(0 -660) scale(1 ${f(sc)}) translate(0 660)`);
  }
  return g;
}
// the paper bunting drops in (k 0..1)
function buntingDrop(k) {
  if (k <= 0.001) return '';
  const y = lerp(-160, 0, ease.outBack(clamp(k, 0, 1)));
  return S.g(H.bunting(630, 74, 'FAMILY MEETING', TN, 46, 14), `translate(0 ${f(y)})`);
}
// the kitchen through a camera: seated (behind the tablecloth) + standing/front (after it)
function kitchen(t, cam, o, seated = '', front = '', mid = '') {
  const Lk = H.kitchen.layers(t, { time: 'morning', meeting: false, chart: false, ...o });
  return view(cam, Lk.bg, 0.8) + view(cam, Lk.mid + mid + seated + Lk.front + front + (Lk.fg || '') + Lk.light, 1);
}
// default poses of the family at the table (overridable per shot)
// o.vol: who keeps the body-volume filter in a close shot (the cut-off neighbours drop it: ~40 ms each at zoom 2)
function famSeated(t, o = {}) {
  let s = '';
  const v = (who) => (o.vol && !o.vol.includes(who) ? { volume: false } : {});
  if (o.dad !== false) s += seat('dad', t, { turn: 0.05, ...v('dad'), ...(o.dad || {}) }, { arms: false });
  if (o.mom !== false) s += seat('mom', t, { armL: 18, armR: 22, ...v('mom'), ...(o.mom || {}) }, { arms: false });
  if (o.grandma !== false) s += seat('grandma', t, { armL: 26, armR: 26, ...v('grandma'), ...(o.grandma || {}) }, { arms: false });
  if (o.you !== false) s += seat('you', t, { ...eating(t), face: { name: 'neutral', eyes: { look: [0.6, 0.4] } }, ...v('you'), ...(o.you || {}) }, { arms: false });
  return s;
}
const dadStand = (t, pose = {}, act = { arms: false, energy: 1.3 }) => actor('dad', t, { x: PRES.x, y: PRES.y, s: PRES.s, turn: -0.2, ...pose }, act);
const knitAt = (t, speed = 1, lowered = 0) => { const p = seatXY('grandma'); return knitFront(t, p.x - 40, 676, 0.36, speed, lowered); };

// ================================================================= 27. "But on Saturday morning..." — pull out of the tablet
function shSat(t) {
  const u = seg(t, C.sat, b.morning + 0.4);
  NOVOL = u < 0.75;
  try { return satFrame(t, u); } finally { NOVOL = false; }
}
function satFrame(t, u) {
  const e = ease.inOut(u);
  const z = Math.exp(lerp(Math.log(25.3), Math.log(1.06), e));
  const px = lerp(TAB.x, 950, ease.in(u)), py = lerp(TAB.y, 548, ease.in(u));
  const cam = at(px, py, z);
  // the game keeps playing inside the tablet
  let inner = '';
  if (z > 1.6) {
    const sc = 48 / 1080;
    inner = S.g(clipTo(105, 0, 1710, 1080, GA.shFume(t, true)), `translate(${f(TAB.x)} ${f(TAB.y)}) rotate(-4) scale(${f(sc)}) translate(-960 -540)`);
  } else inner = S.g(S.rect(-38, -54, 76, 48, 4, { fill: '#6FC3FF' }) + G.cubeLogo(0, -30, 0.12), `translate(660 704) rotate(-4)`);
  const look = seg(t, b.happened - 0.05, b.happened + 0.15);
  const lk = (x) => ({ look: [lerp(x, -1, look), lerp(0.2, 0, look)] });
  const seated = famSeated(t, {
    dad: { props: paperProp(), armL: 52, armR: 52, face: { name: 'neutral', eyes: lk(0.1) } },
    mom: { props: mugProp(t, 0.5 + 0.5 * Math.sin(t * 1.3)), armR: 150, armL: 18, face: { name: 'neutral', eyes: lk(0.2) } },
    grandma: { face: { name: 'happy', eyes: lk(-0.2) } },
    you: { ...eating(t), face: look > 0.5 ? { name: 'nervous', fx: ['sweat'], eyes: { look: [0.8, 0] } } : { name: 'smug', eyes: { look: [0.7, 0.5] } } },
  });
  let o = kitchen(t, cam, { paper: false }, seated, knitAt(t, 1 - look) + inner);
  o += dayChip(960, 110, pop(t, b.saturday, 0.3) * (1 - seg(t, C.dad - 0.25, C.dad)), 'SATURDAY · 8:00 AM');
  if (look > 0) o += K.bang('!', 520, 270, pop(t, b.happened + 0.15, 0.2), 110, 8, '#FFE14D');
  return o;
}

// ================================================================= 28. "There's Dad. An accountant." — freeze + DAD card, star eyes
function shDad(t) {
  const fz0 = b.dad + 0.08, fz1 = b.accountant - 0.06;
  const tt = t < fz0 ? t : t < fz1 ? fz0 : t - (fz1 - fz0);
  const cam = camKeys(tt, [[C.dad, at(800, 505, 2.2)], [C.dadNin, at(800, 500, 2.35)]]);
  const stars = t > b.accountant + 0.05;
  const seated = famSeated(tt, { vol: ['dad'], dad: { props: paperProp(), armL: 52, armR: 52, face: stars ? { name: 'excited', eyes: { type: 'star' } } : { name: 'happy', eyes: { look: [0, 0.6] } }, headRot: stars ? 4 * Math.sin(t * 10) : 0 } });
  let o = kitchen(tt, cam, { paper: false }, seated, knitAt(tt));
  o = freeze(o, t < fz1 ? seg(t, fz0, fz0 + 0.12) : 1 - seg(t, fz1, fz1 + 0.1), -2.5);
  o += nameCard(t, fz0 + 0.02, 600, 180, 'DAD', 'ACCOUNTANT', '#D9A13A', { subAt: b.accountant - 0.05, rot: -4, ax: 850, ay: 360 });
  if (stars) for (let i = 0; i < 4; i++) o += K.F.sparkle(700 + i * 160, 250 + (i % 2) * 90, 30 * bump(t, b.accountant + 0.05 + i * 0.08, b.accountant + 0.7 + i * 0.08), '#FFE14D');
  return o + smash(t, fz0, 0.1, 0.55);
}

// ================================================================= 29. "He thinks every video game is called 'the Nintendo.'"
const GAME_CARDS = [['CUBE CITY', -190, -150], ['TURBO RACER', 190, -150], ['SOCCER 26', -190, 150], ['CALCULATOR', 190, 150]];
function shDadNin(t) {
  const cam = camKeys(t, [[C.dadNin, at(800, 505, 1.95, 520, 560)], [C.mom, at(800, 505, 2.05, 520, 560)]]);
  const nod = t > b.nintendo ? 5 * Math.sin((t - b.nintendo) * 12) * Math.exp(-(t - b.nintendo) * 2) : 0;
  const seated = famSeated(t, { vol: ['dad'], dad: { props: paperProp({ fold: 1 }), armL: 40, armR: 40, headRot: nod, face: { name: 'smug', eyes: { look: [0.7, -0.6] } } } });
  let o = kitchen(t, cam, { paper: false }, seated, knitAt(t));
  const tk = pop(t, C.dadNin + 0.05, 0.3);
  const times = [b.every, b.video, b.game, b.called];
  let cards = '';
  GAME_CARDS.forEach(([label, dx, dy], i) => { cards += S.g(gameCard(i, pop(t, times[i] - 0.05, 0.25), label, seg(t, b.nintendo + i * 0.1, b.nintendo + i * 0.1 + 0.5)), tf(dx * 1.12, dy * 1.05, 1.08, (i % 2 ? 4 : -4))); });
  o += thought(1340, 430, 1060, 800, tk, cards, { tail: [-360, 540] });
  return o;
}

// ================================================================= 30. "There's Mom. A very quiet librarian." — freeze + MOM, VOLUME 1
function shMom(t) {
  const fz0 = b.mom + 0.08, fz1 = b.very12 - 0.1;
  const tt = t < fz0 ? t : t < fz1 ? fz0 : t - (fz1 - fz0);
  const cam = camKeys(tt, [[C.mom, at(1120, 505, 2.2)], [C.shh, at(1120, 500, 2.35)]]);
  const sip = 0.5 + 0.5 * Math.sin(tt * 2.2);
  const seated = famSeated(tt, { vol: ['mom'], mom: { props: mugProp(tt, sip), armR: 150, armL: 18, face: { name: 'neutral', eyes: { look: [0, 0.2] }, mouth: sip > 0.7 ? 'o' : 'smallSmile' } } });
  let o = kitchen(tt, cam, {}, seated, knitAt(tt));
  o = freeze(o, t < fz1 ? seg(t, fz0, fz0 + 0.12) : 1 - seg(t, fz1, fz1 + 0.1), 2.5);
  o += nameCard(t, fz0 + 0.02, 560, 160, 'MOM', 'LIBRARIAN', '#6FAE9C', { subAt: b.librarian - 0.05, rot: -4, ax: 840, ay: 330 });
  o += volumeOSD(1480, 180, pop(t, b.quiet - 0.1, 0.25), lerp(0.6, 0.1, seg(t, b.quiet, b.librarian + 0.2)), t);
  return o + smash(t, fz0, 0.1, 0.55);
}

// ================================================================= 31. "She says 'shh' more than any other word." — SHH! + the chart
// the raised index finger (body space, hand centre hx, hy) — the R6 fist can't reach the lips, so it's the librarian's "one finger up"
const shhFinger = ([hx, hy], wag = 0) => S.g(S.rect(-14, -96, 28, 84, 14, ol('#F6D5BC', 5)) + S.path('M-6 -84 h12', ln(3, '#E6BC9E')), `translate(${f(hx - 6)} ${f(hy - 18)}) rotate(${f(-8 + wag)})`);
function shShh(t) {
  const cam = camKeys(t, [[C.shh, at(1120, 505, 1.95, 560, 560)], [C.granny, at(1120, 505, 2.05, 560, 560)]]);
  const sh = seg(t, b.shh - 0.15, b.shh + 0.1);
  const mp = { armR: lerp(22, 146, ease.outBack(sh)), armL: 18, lean: 3 * sh, turn: 0.1, face: sh > 0.5 ? { name: 'determined', mouth: 'o', eyes: { look: [0, 0] } } : { name: 'neutral' } };
  if (sh > 0.35) mp.props = [{ svg: shhFinger(CAST.handAt(CAST.D.mom, mp, 1), 4 * Math.sin(Math.max(0, t - b.shh) * 14) * Math.exp(-Math.max(0, t - b.shh) * 2)), layer: 'front' }];
  const seated = famSeated(t, { vol: ['mom'], mom: mp });
  let o = kitchen(t, cam, {}, seated, knitAt(t));
  o += speech(860, 230, 'SHH!', pop(t, b.shh, 0.22), { size: 96, tail: -1 });
  const wa = t - b.shh;
  if (wa > 0 && wa < 1.2) for (let i = 0; i < 3; i++) { const r = 60 + (wa * 400 + i * 60); o += S.path(`M${f(560 + r * 0.7)} ${f(420 - r * 0.5)} A${f(r)} ${f(r)} 0 0 1 ${f(560 + r * 0.7)} ${f(420 + r * 0.5)}`, ln(6, '#FFFFFF', f(0.7 * (1 - wa / 1.2)))); }
  o += E.zoomAbout(wordChart(t, 1290, 470, pop(t, b.more - 0.2, 0.3), seg(t, b.more, b.word + 0.4)), 1290, 470, 0.84);
  return o;
}

// ================================================================= 32. "And there's Granny. She knits. She bakes." — freeze, scarf, cookies
function scarf(x, y, k, t) {
  if (k <= 0.01) return '';
  const N = 20, n = Math.floor(N * ease.out(clamp(k, 0, 1)));
  const pt = (u) => [x + 20 + 420 * u + 10 * Math.sin(u * 8 + t * 9) * u, y + 12 + 40 * u - 340 * u * u];
  let d = '', d2 = '';
  for (let i = 0; i < n; i++) {
    const [ax, ay] = pt(i / N), [bx, by] = pt((i + 1) / N);
    const len = Math.hypot(bx - ax, by - ay) || 1, nx = (-(by - ay) / len) * 28, ny = ((bx - ax) / len) * 28;
    const q = `M${f(ax - nx)} ${f(ay - ny)} L${f(ax + nx)} ${f(ay + ny)} L${f(bx + nx)} ${f(by + ny)} L${f(bx - nx)} ${f(by - ny)} Z`;
    if (i % 2) d2 += q; else d += q;
  }
  return S.path(d, ol('#E8456A', 3)) + S.path(d2, ol('#7FC8B8', 3));
}
function shGranny(t) {
  const fz0 = b.granny + 0.08, fz1 = b.knits - 0.12;
  const tt = t < fz0 ? t : t < fz1 ? fz0 : t - (fz1 - fz0);
  const cam = camKeys(tt, [[C.granny, at(1360, 545, 2.2)], [C.argue, at(1360, 540, 2.3)]]);
  const frenzy = t > b.knits - 0.05 ? 1 : 0;
  const seated = famSeated(tt, { vol: ['grandma'], grandma: { armL: 30 + 8 * frenzy * Math.sin(t * 40), armR: 30 + 8 * frenzy * Math.sin(t * 43 + 1), face: frenzy ? { name: 'determined', eyes: { look: [0, 0.6] } } : { name: 'happy', eyes: { look: [-0.3, 0.4] } } } });
  const p = seatXY('grandma');
  let front = knitFront(tt, p.x - 40, 676, 0.36, frenzy ? 6 : 1);
  front += scarf(p.x - 40, 680, seg(t, b.knits, b.knits + 0.6), t);
  const ck = ease.outBack(seg(t, b.bakes - 0.1, b.bakes + 0.25));
  if (ck > 0.01) front += X.cookieTray({ x: lerp(1900, p.x + 110, ck), y: 700, s: 0.42, steam: 1, t });
  let o = kitchen(tt, cam, {}, seated, front);
  o = freeze(o, t < fz1 ? seg(t, fz0, fz0 + 0.12) : 1 - seg(t, fz1, fz1 + 0.1), -2.5);
  o += nameCard(t, fz0 + 0.02, 1490, 170, 'GRANNY', 'KNITS · BAKES · WINS', '#B57BFF', { rot: 4, ax: 1150, ay: 360 });
  if (t > b.knits) o += K.bang('KNIT!', 690, 330, pop(t, b.knits, 0.18), 88, -8, '#FF6FB5');
  if (t > b.bakes) o += K.bang('DING!', 1560, 560, pop(t, b.bakes + 0.15, 0.18), 90, -6, '#FFD21F');
  return o + smash(t, fz0, 0.1, 0.55);
}

// ================================================================= 33. "...never lost an argument in her life." — WON 9,999 · LOST 0
function shArgue(t) {
  const cam = camKeys(t, [[C.argue, at(1360, 545, 2.0, 1320, 560)], [C.meeting, at(1355, 520, 2.9, 1260, 560)]]);
  const seated = famSeated(t, { vol: ['grandma'], grandma: { armL: 26, armR: 26, headRot: -3, face: { name: t > b.life ? 'sneaky' : 'smug', eyes: { look: [0, 0] } } } });
  let o = kitchen(t, cam, {}, seated, knitAt(t, 0.3));
  const won = lerp(0, 9999, ease.out(seg(t, b.and13, b.argument + 0.2)));
  o += argueBoard(t, 560, 470, pop(t, b.and13 - 0.05, 0.3), won, seg(t, b.lost, b.lost + 0.6));
  o += G.stamp({ text: 'UNDEFEATED', x: 560, y: 700, rot: -8, size: 78, col: '#E0A21A', k: seg(t, b.life - 0.05, b.life + 0.45), t });
  // the glint on her glasses
  const p = seatXY('grandma');
  const [gx, gy] = toScr(cam, p.x - 20, p.y - 0.405 * 760);
  o += K.F.sparkle(gx + 30, gy - 10, 46 * bump(t, b.life + 0.35, b.life + 0.95), '#FFFFFF');
  return o;
}

// ================================================================= 34. DAD: "Family meeting!" — he pops up at the flip chart
function shMeeting(t) {
  let cam = camKeys(t, [[C.meeting, at(560, 520, 1.12)], [C.notice, at(540, 520, 1.18)]]);
  cam = shakeAll(cam, t, [[b.meeting, 0.3, 10]]);
  const up = ease.outBack(seg(t, C.meeting, C.meeting + 0.3));
  const cheer = ease.outBack(seg(t, b.meeting - 0.1, b.meeting + 0.15));
  const dp = { y: PRES.y + 260 * (1 - up), armL: lerp(30, 160, cheer), armR: lerp(30, 160, cheer), face: { name: 'excited' }, ...boing(t, b.meeting, 0.12) };
  const seated = famSeated(t, { dad: false, you: { armL: 14, armR: 24, turn: -0.2, face: { name: t > b.meeting ? 'deadpan' : 'neutral', eyes: { look: [-0.7, 0] } } } });
  let o = kitchen(t, cam, {}, seated, knitAt(t) + dadStand(t, dp), flipChartMine(t, 0) + buntingDrop(seg(t, b.meeting - 0.05, b.meeting + 0.4)));
  o += K.confetti(t, b.meeting, 60, 3);
  return o;
}

// ================================================================= 35. "...you spend eleven hours a day in..." — the chart flips, 11 HRS/DAY
function stickTo(hand, tip) {
  const [hx, hy] = hand, [tx, ty] = tip;
  return S.path(`M${f(hx)} ${f(hy)} L${f(tx)} ${f(ty)}`, ln(14)) + S.path(`M${f(hx)} ${f(hy)} L${f(tx)} ${f(ty)}`, ln(8, '#C98A52')) + S.circle(tx, ty, 8, ol('#E04848', 4));
}
const dadHand = (pose) => { const s = PRES.s, h = CAST.handAt(CAST.D.dad, { ...pose }, -1); return [PRES.x + s * h[0], PRES.y + s * h[1]]; };
function shNotice(t) {
  const cam = camKeys(t, [[C.notice, at(330, 560, 1.55)], [b.noticed, at(300, 545, 1.75)], [b.eleven, at(260, 500, 2.05)], [C.nin, at(250, 490, 2.15)]]);
  const flip = seg(t, b.noticed, b.noticed + 0.35);
  const target = t < b.eleven - 0.1 ? chartPt(-20, -560) : chartPt(118 + 8 * Math.max(0, Math.sin((t - b.eleven) * 20)) * (t < b.hours + 0.3 ? 1 : 0), -392);
  const dp = { armL: 118, armR: 24, turn: -0.35, face: { name: 'happy', eyes: { look: [-0.8, -0.2] } } };
  const hand = dadHand(dp);
  const seated = famSeated(t, { dad: false, you: { turn: -0.2, face: { name: 'deadpan', eyes: { look: [-0.7, -0.2] } } } });
  let o = kitchen(t, cam, {}, seated, dadStand(t, dp) + stickTo(hand, target), flipChartMine(t, flip, { circle: seg(t, b.eleven + 0.05, b.day) }) + buntingDrop(1));
  if (t > b.eleven) { const [sx, sy] = toScr(cam, ...chartPt(-150, -640)); o += K.bang('!!', sx - 10, sy, pop(t, b.hours, 0.2), 90, -10, '#E04848'); }
  return o;
}

// ================================================================= 36. "...the Nintendo." — smash on NINTENDO 90%
function shNin(t) {
  let cam = camKeys(t, [[C.nin, at(...chartPt(-50, -440), 3.9)], [b.nintendo14 - 0.03, at(...chartPt(-50, -440), 4.1)], [b.nintendo14 + 0.08, at(...chartPt(-50, -440), 5.0)], [C.notNin, at(...chartPt(-50, -440), 5.1)]], ease.out);
  cam = shakeAll(cam, t, [[b.nintendo14, 0.35, 12]]);
  const tap = Math.max(0, Math.sin((t - b.nintendo14) * 18)) * (t > b.nintendo14 && t < b.nintendo14 + 0.6 ? 1 : 0);
  const dp = { armL: 118, armR: 24, turn: -0.35, face: { name: 'excited' } };
  const target = chartPt(8 + 5 * tap, -394 + 5 * tap);
  let o = kitchen(t, cam, {}, famSeated(t, { vol: [], dad: false }), dadStand(t, dp) + stickTo(dadHand(dp), target), flipChartMine(t, 1) + buntingDrop(1));
  o += zoomLines(960, 540, seg(t, b.nintendo14, b.nintendo14 + 0.2), t, '#FFFFFF', 22, 520);
  return o + smash(t, b.nintendo14, 0.1, 0.5);
}

// ================================================================= 37. YOU: "It's not a Nintendo, Dad. It's Cube City." — tablet up
function shNotNin(t) {
  const cam = camKeys(t, [[C.notNin, at(610, 480, 1.95, 1090, 540)], [C.decision, at(615, 475, 2.08, 1090, 540)]]);
  const up = ease.outBack(seg(t, A15a() - 0.1, A15a() + 0.25));
  const glow = bump(t, b.cube15 - 0.05, b.cube15 + 0.6);
  const yp = { turn: -0.2, armR: lerp(20, 122, up), armL: 22, face: { name: 'angry', eyes: { look: [-0.9, -0.1] } },
    props: up > 0.05 ? [{ svg: X.tablet({ x: 300, y: lerp(-380, -640, up), s: 0.55, rot: 8, face: 'screen', screen: cubeScreen(glow), glow }), layer: 'front' }] : [] };
  const seated = famSeated(t, { vol: ['you'], dad: false, you: yp });
  const dp = { armL: 20, armR: 20, turn: 0.2, face: { name: 'confused', fx: t > b.cube15 ? ['question'] : [], eyes: { look: [0.8, 0] } } };
  let o = kitchen(t, cam, { tablet: false }, seated, dadStand(t, dp, { arms: false }), flipChartMine(t, 1) + buntingDrop(1));
  if (glow > 0) { const [sx, sy] = toScr(cam, KS.you.x + 0.45 * 300, seatXY('you').y - 0.45 * 640); o += K.F.sparkle(sx - 90, sy - 130, 40 * glow, '#FFE14D') + K.F.sparkle(sx + 100, sy - 40, 28 * glow, '#FFFFFF'); }
  return o;
}
const A15a = () => K.V.L('02.15').a;

// ================================================================= 38. MOM: "So we made a decision." — the lights dim
function shDecision(t) {
  const cam = camKeys(t, [[C.decision, at(1240, 520, 1.9)], [C.tonight, at(1230, 505, 2.2)]]);
  const dim = seg(t, b.decision - 0.1, b.decision + 0.4);
  const seated = famSeated(t, { vol: ['mom', 'grandma'],
    mom: { armL: 24, armR: 24, face: { name: 'determined', eyes: { look: [-0.4, 0] } } },
    grandma: { armL: 22, armR: 22, headRot: 6 * Math.sin(Math.max(0, t - b.decision) * 8) * Math.exp(-Math.max(0, t - b.decision) * 3), face: { name: 'smug', eyes: { look: [-0.9, 0] } } },
    dad: false,
  });
  let o = kitchen(t, cam, { tablet: false }, seated, knitAt(t, 0, dim), buntingDrop(1));
  o += S.rect(0, 0, W, H_, 0, { fill: '#1A1030', opacity: f(0.28 * dim) }) + H.darkRing(960, 520, 820, 560, '#0A0612', 0.5 * dim, 8, [0, 0, 1920, 1080]);
  return o;
}

// ================================================================= 39. "Tonight is Family Game Night." — TONIGHT + the title
function shTonight(t) {
  let cam = camKeys(t, [[C.tonight, at(900, 560, 1.06)], [C.boardG, at(900, 555, 1.12)]]);
  cam = shakeAll(cam, t, [[b.tonight + 0.15, 0.3, 12]]);
  const jazz = t > b.family16 - 0.1;
  const jz = Math.sin(t * 26);
  const dp = jazz ? { armL: 150 + 12 * jz, armR: 150 - 12 * jz, face: { name: 'excited' }, lift: hop(t, b.family16 - 0.1, 0.35, 30) } : { armL: 24, armR: 24, face: { name: 'happy' } };
  const seated = famSeated(t, {
    dad: false,
    mom: { armL: 24, armR: 24, face: { name: 'happy' } },
    grandma: { armL: jazz ? 120 : 26, armR: jazz ? 120 : 26, face: { name: jazz ? 'joy' : 'happy' } },
    you: { turn: 0.1, armL: 16, armR: 16, face: { name: jazz ? 'confused' : 'neutral', eyes: { look: [0.3, 0] } } },
  });
  let o = kitchen(t, cam, { tablet: false }, seated, dadStand(t, dp, { arms: false }), flipChartMine(t, 1) + buntingDrop(1));
  o += G.stamp({ text: 'TONIGHT', x: 1420, y: 760, rot: -10, size: 92, k: seg(t, b.tonight - 0.05, b.tonight + 0.45), t });
  o += G.bigTitle({ text: 'FAMILY GAME NIGHT', theme: 'gold', x: 900, y: 150, size: 104, k: seg(t, b.family16 - 0.12, b.night + 0.6), rays: false, t });
  o += K.confetti(t, b.night, 50, 11);
  return o;
}

// ================================================================= 40. YOU: "Oh. Board games. Okay, that's fine—" — relieved
function shBoardG(t) {
  const cam = camKeys(t, [[C.boardG, at(560, 470, 2.0, 760, 560)], [C.no, at(560, 465, 2.1, 760, 560)]]);
  const relax = seg(t, b.okay - 0.1, b.okay + 0.4);
  const yp = { turn: 0.15, armL: lerp(16, 34, relax), armR: lerp(16, 34, relax), lean: -6 * relax, headRot: -8 * relax, bodyY: 10 * seg(t, b.oh, b.oh + 0.3) + 14 * relax, face: { name: 'happy', eyes: relax > 0.6 ? { type: 'happy' } : { look: [0.3, 0] } } };
  const seated = famSeated(t, { vol: ['you'], dad: false, you: yp });
  let o = kitchen(t, cam, { tablet: false }, seated, knitAt(t), buntingDrop(1));
  o += thought(1380, 400, 760, 560, pop(t, b.board - 0.1, 0.3), boardGame(1.35), { tail: [-300, 360] });
  o += K.bang('phew~', 470, 300, pop(t, b.okay + 0.1, 0.25), 70, -8, '#FFFFFF');
  return o;
}

// ================================================================= 41. GRANNY: "No, dear." — the needles stop
function shNo(t) {
  const cam = camKeys(t, [[C.no, at(1360, 540, 2.45, 1100, 560)], [C.joining, at(1360, 530, 2.65, 1100, 560)]]);
  const stop = seg(t, b.no - 0.1, b.no + 0.2);
  const seated = famSeated(t, { vol: ['grandma'], grandma: { armL: 26, armR: 26, headRot: -4, face: { name: 'sneaky', eyes: { look: [-0.6, -0.3] } } } });
  let o = kitchen(t, cam, { tablet: false }, seated, knitAt(t, 1 - stop, stop));
  o += K.bang('clink', 1500, 760, pop(t, b.no - 0.05, 0.2) * (1 - seg(t, b.dear, b.dear + 0.3)), 60, 6, '#FFFFFF');
  return o;
}

// ================================================================= 42. "We're joining YOUR game." — the device triptych
function panel(i, k, inner, bg) {
  if (k <= 0.001) return '';
  const x0 = i * 640;
  let p = S.rect(x0, 0, 640, H_, 0, { fill: bg }) + K.rays(x0 + 320, 520, 14, 900, '#FFFFFF', 0.18, i * 20) + S.rect(x0, 860, 640, 220, 0, { fill: '#FFF3DE' }) + S.path(`M${x0} 860 H${x0 + 640}`, ln(6));
  p += inner + S.rect(x0, 0, 640, H_, 0, { fill: 'none', stroke: '#151515', 'stroke-width': 12 });
  const y = lerp(-1100, 0, ease.outBack(clamp(k, 0, 1)));
  return S.g(clipTo(x0, 0, 640, H_, p), `translate(0 ${f(y)})`);
}
function shJoining(t) {
  const tg = b.were - 0.06, td = b.YOUR - 0.1, tm = b.game18 - 0.1;
  // under the panels: the kitchen wide, dimmed
  let o = kitchen(t, at(960, 560, 1.0), { tablet: false }, famSeated(t, { vol: [], dad: false, you: { face: { name: 'shocked' }, armL: 14, armR: 14 } }), dadStand(t, { armL: 24, armR: 24, volume: false }), flipChartMine(t, 1) + buntingDrop(1));
  o += S.rect(0, 0, W, H_, 0, { fill: '#1A1030', opacity: 0.35 });
  const gk = seg(t, tg, tg + 0.3), dk = seg(t, td, td + 0.3), mk = seg(t, tm, tm + 0.3);
  const gl = (t0) => bump(t, t0, t0 + 0.8);
  // medium shots (waist up): each one slams in on its word with a little squash, the device lights up
  const gran = actor('grandma', t, { x: 250, y: faceAt(400, 1.0, 0.9), s: 1.0, phone: 'arm', phoneFace: 'screen', screen: cubeScreen(gl(tg)), glow: gl(tg), face: { name: 'smug' }, volume: false, ...boing(t, tg + 0.28, 0.08) }, { arms: false });
  const dad = actor('dad', t, { x: 960, y: faceAt(370, 0.84, 1.1), s: 0.84, armL: 46, armR: 46, props: deviceProp('laptop', gl(td), -430), face: { name: 'excited' }, volume: false, ...boing(t, td + 0.28, 0.08) }, { arms: false });
  const mom = actor('mom', t, { x: 1600, y: faceAt(370, 0.84, 1.04), s: 0.84, armL: 36, armR: 36, props: deviceProp('tablet', gl(tm), -400), face: { name: 'smug' }, volume: false, ...boing(t, tm + 0.28, 0.08) }, { arms: false });
  o += panel(0, gk, gran, '#C9A6FF') + panel(1, dk, dad, '#FFD27A') + panel(2, mk, mom, '#8FE0C8');
  for (const [t0, x] of [[tg, 320], [td, 960], [tm, 1600]]) { const fk = seg(t, t0 + 0.24, t0 + 0.36); if (fk > 0 && fk < 1) o += S.rect(x - 320, 0, 640, H_, 0, { fill: '#FFFFFF', opacity: f(0.6 * (1 - fk)) }); }
  return o;
}

// ================================================================= 43. ⏱ the cereal flake falls back into the bowl
function shFlake(t) {
  const camB = at(600, 690, 3.4);
  let o = kitchen(t, camB, { tablet: false, bowls: false }, '', '') + S.rect(0, 0, W, H_, 0, { fill: '#FFF0D8', opacity: 0.45 });
  const z = lerp(1, 1.08, seg(t, C.flake, C.server));
  const tLand = C.server - 0.3;
  const fall = ease.in(seg(t, C.flake + 0.06, tLand));
  o += E.zoomAbout(X.cereal({ x: 980, y: 930, s: 1.75, fall, spoonY: 30 }), 960, 600, z);
  o += K.bang('plip.', 1250, 560, pop(t, tLand, 0.16), 58, -6, '#FFFFFF');
  return o;
}

// ================================================================= 44. YOU: "You're joining... my SERVER?!" — smash
function shServer(t) {
  let cam = camKeys(t, [[C.server, at(560, 530, 2.15, 960, 500)], [b.server - 0.03, at(560, 530, 2.35, 960, 500)], [b.server + 0.08, at(560, 525, 3.2, 960, 470)], [C.scary, at(560, 525, 3.3, 960, 470)]], ease.out);
  cam = shakeAll(cam, t, [[b.server, 0.5, 20]]);
  const scream = t > b.server - 0.04;
  const yp = { turn: 0, armL: scream ? 150 : 14, armR: scream ? 150 : 14, ...boing(t, b.server, 0.2), face: scream ? { name: 'scream', mouth: 'scream', eyes: { pupil: 0.3 }, fx: ['sweat2'] } : { name: 'shocked', eyes: { pupil: 0.35 }, fx: ['sweat'] } };
  let o = kitchen(t, cam, { tablet: false }, famSeated(t, { vol: ['you'], dad: false, you: yp, grandma: { face: { name: 'happy' } } }), knitAt(t, 0, 1));
  o += zoomLines(960, 470, scream ? 1 : 0, t, '#FFFFFF', 24, 480);
  return o + smash(t, b.server, 0.12, 0.6);
}

// ================================================================= 45. "It was the scariest sentence you had ever heard." — dolly zoom
function shScary(t) {
  const u = ease.inOut(seg(t, C.scary, C.family));
  const zb = lerp(2.3, 4.4, u), zh = 2.3;
  const ctr = [560, 528];
  const camB = at(ctr[0], ctr[1], zb, 960, 470), camH = at(ctr[0], ctr[1], zh, 960, 470);
  const Lk = H.kitchen.layers(t, { time: 'morning', meeting: false, chart: false, tablet: false });
  const tremble = 3 * Math.sin(t * 60);
  const others = famSeated(t, { vol: [], you: false, dad: false, mom: { face: { name: 'happy', eyes: { look: [-1, 0] } } }, grandma: { face: { name: 'happy', eyes: { look: [-1, 0] } } } });
  const yp = { x: KS.you.x + tremble, turn: 0, armL: 12, armR: 12, face: { name: 'scared', eyes: { pupil: 0.25, look: [0, 0] }, fx: ['sweat2'] } };
  let o = view(camB, Lk.bg, 0.8) + view(camB, Lk.mid + buntingDrop(1) + others) + view(camH, seat('you', t, yp, { arms: false }) + Lk.front) + view(camB, Lk.light);
  // the lightning outside on "scariest"
  const lt = seg(t, b.scariest - 0.05, b.scariest + 0.35);
  o += S.rect(0, 0, W, H_, 0, { fill: '#1A1A50', opacity: f(0.18 + 0.3 * u) });
  if (lt > 0 && lt < 1) o += S.rect(0, 0, W, H_, 0, { fill: '#DDE8FF', opacity: f(0.75 * (1 - lt) * (Math.floor(t * 30) % 2 ? 1 : 0.5)) });
  o += H.darkRing(960, 460, 700, 470, '#05040C', 0.55 * u, 8, [0, 0, 1920, 1080]);
  return o;
}

// ================================================================= 46. the family beams with their devices — whip out to SC 03
function shFamily(t) {
  const cam = camKeys(t, [[C.family, at(890, 470, 1.42)], [END, at(890, 455, 1.56)]]);
  const g = 0.6 + 0.4 * Math.sin(t * 5);
  const up = ease.outBack(seg(t, C.family, C.family + 0.35));
  const momP = { armL: 20, armR: lerp(30, 125, up), face: { name: 'joy' } };
  const mh = CAST.handAt(CAST.D.mom, momP, 1);
  momP.props = [{ svg: X.tablet({ x: mh[0] + 30, y: mh[1] - 70, s: 0.5, rot: 10, face: 'screen', screen: cubeScreen(g), glow: g }), layer: 'front' }];
  const seated = famSeated(t, {
    dad: false,
    mom: momP,
    grandma: { phone: 'arm', phoneFace: 'screen', screen: cubeScreen(g), glow: g, face: { name: 'joy' }, ...boing(t, C.family + 0.1, 0.1) },
    you: { x: KS.you.x + 3 * Math.sin(t * 60), turn: 0.1, armL: 10, armR: 10, face: { name: 'scared', eyes: { pupil: 0.3 }, fx: ['sweat2'] } },
  });
  const dp = { armL: lerp(30, 60, up), armR: lerp(30, 60, up), props: deviceProp('laptop', g, -500), face: { name: 'joy' }, lift: hop(t, C.family + 0.05, 0.35, 26) };
  let o = kitchen(t, cam, { tablet: false }, seated, dadStand(t, dp, { arms: false }), flipChartMine(t, 1) + buntingDrop(1));
  o += K.F.sparkle(1500, 240, 30 * Math.abs(Math.sin(t * 4)), '#FFFFFF') + K.F.sparkle(330, 260, 24 * Math.abs(Math.sin(t * 5 + 1)), '#FFE14D') + K.F.sparkle(1180, 300, 20 * Math.abs(Math.sin(t * 6 + 2)), '#FFFFFF');
  const [hx, hy] = toScr(cam, KS.you.x, 430);
  o += K.bang('gulp', hx + 40, hy - 150, pop(t, C.family + 0.8, 0.2), 70, 8, '#FFFFFF');
  return o;
}

// ================================================================= dispatch
const SHOTS = [
  [C.open, GA.shOpen], [C.photo, GA.shPhoto], [C.legend, GA.shLegend], [C.level, GA.shLevel], [C.base, GA.shBase], [C.arena, GA.shArena], [C.one, GA.shOne],
  [C.welcome, GA.shWelcome], [C.lava, GA.shLava], [C.trophy, GA.shTrophy], [C.throne, GA.shThrone], [C.chair, GA.shChair], [C.tag, GA.shTag],
  [C.noodle, GA.shNoodle], [C.met, GA.shMet], [C.bosses, GA.shBosses], [C.bro, GA.shBro], [C.update, GA.shUpdate], [C.king, GA.shKing], [C.gulp, GA.shGulp],
  [C.dark, GA.shDark], [C.who, GA.shWho], [C.angry, GA.shAngry], [C.taunt, GA.shTaunt], [C.little, GA.shLittle], [C.streak, GA.shStreak], [C.fume, GA.shFume],
  [C.sat, shSat], [C.dad, shDad], [C.dadNin, shDadNin], [C.mom, shMom], [C.shh, shShh], [C.granny, shGranny], [C.argue, shArgue],
  [C.meeting, shMeeting], [C.notice, shNotice], [C.nin, shNin], [C.notNin, shNotNin], [C.decision, shDecision], [C.tonight, shTonight],
  [C.boardG, shBoardG], [C.no, shNo], [C.joining, shJoining], [C.flake, shFlake], [C.server, shServer], [C.scary, shScary], [C.family, shFamily],
].sort((a, b_) => a[0] - b_[0]);
// whip-pans (white streak flash) on these cuts
const WHIPS = [[C.legend, -1], [C.level, 1], [C.base, -1], [C.welcome, 1], [C.lava, 1], [C.noodle, -1], [C.bro, 1], [C.king, 1], [C.dark, -1], [C.taunt, 1], [C.meeting, 1], [C.no, -1], [END, 1]];
function shotAt(t) {
  let i = SHOTS.length - 1;
  while (i > 0 && t < SHOTS[i][0]) i--;
  return i;
}
function scene(t) {
  let o = SHOTS[shotAt(t)][1](t);
  for (const [tc, dir] of WHIPS) if (Math.abs(t - tc) < 0.1) o += whip(t, tc, dir);
  return o;
}
function look(t) {
  if (t >= C.scary && t < C.family) return { grade: 'cool', vignette: 1 };
  if (t >= C.decision && t < C.tonight) return { grade: 'warm', vignette: 0.9 };
  if (t >= C.sat) return { grade: 'warm', vignette: 0.45 };
  if (t >= C.who && t < C.taunt) return { grade: null, vignette: 0.8 };
  if (t >= C.king && t < C.dark) return { grade: null, vignette: 0.7 };
  if (t >= C.met && t < C.bosses) return { grade: null, vignette: 0.6 };
  return { grade: null, vignette: 0.35 };
}
function noCaptions(t) { return t >= C.flake && t < C.server; }

const DEFS = '<defs>' +
  '<pattern id="s02Stripes" width="170" height="170" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><rect x="0" y="0" width="85" height="170" fill="#FFC24A" opacity="0.45"/></pattern>' +
  '<pattern id="s02StripesP" width="170" height="170" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><rect x="0" y="0" width="85" height="170" fill="#FFFFFF" opacity="0.06"/></pattern>' +
  '<pattern id="s02StripesR" width="170" height="170" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><rect x="0" y="0" width="85" height="170" fill="#000000" opacity="0.22"/></pattern>' +
  '<pattern id="s02Paper" width="80" height="80" patternUnits="userSpaceOnUse"><circle cx="14" cy="18" r="2.5" fill="#B89A6A" opacity="0.35"/><circle cx="50" cy="44" r="2" fill="#FFFFFF" opacity="0.4"/><circle cx="30" cy="66" r="1.8" fill="#B89A6A" opacity="0.3"/><circle cx="70" cy="10" r="1.6" fill="#FFFFFF" opacity="0.35"/></pattern>' +
  '</defs>';

module.exports = { scene, look, noCaptions, DEFS, SHOTS, CUT: C, BEAT: b };
