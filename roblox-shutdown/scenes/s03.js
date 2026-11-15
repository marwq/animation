// SC 03 · THE POP-UP — a normal Tuesday, 6 p.m., peak gaming hour... then the same grey window lands on every screen in
// the world (phone, TV, watch, microwave, register, billboard, plane seat). Silence. The Earth screams NOOOO. Dex's
// 900-day streak, Pip's elevator, Dad's fish, Juno's unpoppable bubbles. Brenda's breaking news (fainting kid, 10,000
// players on one obby, a dog that says "oof", experts go play) — and the countdown starts: 23:59:59.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const C = K.C;
const A = require('./acting');
const SETS = require('./sets');
const E2 = require('./s02_env');
const { camAt, pop, OUT, tr, shakeCam, panel, tag, junoSeated, tablet, shutPopup, popScreen, marks, bubble, popFx, dingFx } = E2;

const START = K.V.scene('SC 03').start;
const END = K.V.scene('SC 04').start;
const l = {};
for (let i = 0; i <= 13; i++) l[i] = L('03.' + i);
const W = (id, w, n) => l[id].word(w, n).t0;

// ---------------------------------------------------------------- shot starts (all from the voice)
const tTue = START;
const tClock = W(0, 'Six') - 0.1;
const tQuad = W(0, 'Peak') - 0.08;
const tFreeze = W(1, 'then');
const tEarth = W(1, 'every') - 0.1;
const tFirst = W(1, 'showed') - 0.12;
const tM = [W(2, 'Attention') - 0.08, W(2, 'Roblox') - 0.05, W(2, 'will') - 0.04, W(2, 'shut') - 0.04, W(2, 'down') - 0.04, W(2, 'forever') - 0.04, W(2, 'in') - 0.04];
const tGrid = W(2, 'hours') - 0.06;
const tThanks = l[3].a - 0.08;
const tFrozen = l[3].b;
const tNooo = l[4].a - 1.05;
const tDex = l[4].a - 0.02;
const tStreak = l[5].a - 0.1;
const tPip = l[6].a - 0.08;
const tDadA = l[7].a - 0.08;
const tDadB = W(7, 'Not') - 0.12;
const tJuno = l[8].a - 0.06;
const tEnd = W(8, 'Bubble') - 0.1;
const tPop = W(8, 'The') - 0.1;
const tNews = l[9].a - 0.12;
const tSchool = l[10].a - 0.06;
const tParents = W(10, 'Parents') - 0.08;
const tFaint = W(10, 'And') - 0.1;
const tObby = l[11].a - 0.1;
const tDog = W(11, 'And') - 0.1;
const tExp = l[12].a - 0.08;
const tPlay = W(12, 'Experts', 1) - 0.08;
const tBye = W(12, 'Goodbye') - 0.12;
const tCount = l[13].a - 0.02;
const tWorld = W(13, 'And') - 0.06;
const tStart = W(13, 'started');           // the countdown starts: 23:59:59
const tHUD = tWorld;                       // the timer pill lands in the HUD slot

const CUTS = [tClock, tQuad, tEarth, tFirst, tThanks, tFrozen, tNooo, tDex, tStreak, tPip, tDadA, tDadB, tJuno, tEnd, tPop, tSchool, tParents, tFaint, tObby, tDog, tExp, tPlay, tBye, tCount, tWorld];

const DEFS = `<defs>
<linearGradient id="s03water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4FC3F7"/><stop offset="1" stop-color="#0D47A1"/></linearGradient>
<linearGradient id="s03flame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FF3B1F"/><stop offset="0.55" stop-color="#FF9A1F"/><stop offset="1" stop-color="#FFE45A"/></linearGradient>
<linearGradient id="s03lava" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8A3D"/><stop offset="1" stop-color="#C8102E"/></linearGradient>
<linearGradient id="s03obbySky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5BB6FF"/><stop offset="1" stop-color="#CDEBFF"/></linearGradient>
<radialGradient id="s03bang" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF6C8" stop-opacity="0.9"/><stop offset="1" stop-color="#FFB13B" stop-opacity="0"/></radialGradient>
</defs>`;

// ---------------------------------------------------------------- small art
// a generic colourful game screen (obby blocks on a sky) for devices before the pop-up lands
function gameBg(w, h, t, seed = 1) {
  let o = S.rect(-w / 2, -h / 2, w, h, 0, { fill: 'url(#s03obbySky)' });
  const cols = ['#FF5A5A', '#FFD21F', '#3BD16F', '#34C3FF', '#B06BFF'];
  for (let i = 0; i < 5; i++) {
    const x = -w / 2 + ((i + 0.5) / 5) * w + Math.sin(t * 2 + i + seed) * w * 0.02, y = h * 0.15 - i % 2 * h * 0.2;
    o += S.rect(x - w * 0.08, y, w * 0.16, h * 0.08, h * 0.02, { fill: cols[(i + seed) % 5], stroke: '#151515', 'stroke-width': Math.max(1.5, h * 0.012) });
  }
  o += S.rect(-w / 2, h * 0.36, w, h * 0.14, 0, { fill: '#3BD16F' });
  return o;
}
const fishScreen = (t) => (w, h) => {
  let o = S.rect(-w / 2, -h / 2, w, h * 0.3, 0, { fill: '#FFD9A0' }) + S.rect(-w / 2, -h / 2 + h * 0.3, w, h * 0.7, 0, { fill: 'url(#s03water)' });
  o += S.path(`M${f(-w * 0.1)} ${f(-h / 2)} L${f(-w * 0.1)} ${f(h * 0.1)}`, ln(Math.max(1, w * 0.006), '#FFFFFF')) + S.circle(-w * 0.1, -h / 2 + h * 0.3, w * 0.025, ol('#FF5A5A', Math.max(1, w * 0.005)));
  const fx = Math.sin(t * 1.3) * w * 0.25;
  o += S.g(S.ellipse(0, 0, w * 0.12, h * 0.07, { fill: '#FFC93C', stroke: '#151515', 'stroke-width': Math.max(1, w * 0.006) }) + S.path(`M${f(w * 0.1)} 0 L${f(w * 0.18)} ${f(-h * 0.06)} L${f(w * 0.18)} ${f(h * 0.06)} Z`, { fill: '#FFC93C', stroke: '#151515', 'stroke-width': Math.max(1, w * 0.006) }) + S.circle(-w * 0.07, -h * 0.01, w * 0.012, { fill: '#151515' }), `translate(${f(fx)} ${f(h * 0.22)}) scale(${Math.cos(t * 1.3) > 0 ? -1 : 1} 1)`);
  return o;
};
const elevScreen = (t) => (w, h) => SETS.frameIn(SETS.elevatorGame(t, { doors: 0.5 + 0.5 * Math.sin(t * 2), rides: null }), w, h);
const bubScreen = (t) => (w, h) => SETS.frameIn(SETS.bubbleIsland(t, { hud: false }), w, h);
// pop-in curve for a device whose pop-up lands at t0
const landK = (t, t0) => seg(t, t0, t0 + 0.14);

// news footage frame: LIVE bug + NEWS 24 logo + lower third
function footage(inner, t, title, sub = '') {
  let o = inner;
  o += S.g(S.rect(0, 0, 170, 60, 12, { fill: '#D7263D' }) + S.circle(34, 30, 11, { fill: '#FFFFFF', opacity: f(0.5 + 0.5 * Math.sin(t * 8)) }) + T('LIVE', 100, 46, 40, '#FFFFFF'), 'translate(60 60)');
  o += S.g(S.rect(0, 0, 220, 60, 12, { fill: '#10162A', opacity: 0.85 }) + T('NEWS 24', 110, 46, 40, '#FFFFFF'), 'translate(1640 60)');
  o += S.rect(0, 800, 1920, 84, 0, { fill: '#10162A', opacity: 0.88 }) + S.rect(0, 800, 300, 84, 0, { fill: '#D7263D' }) + T('BREAKING', 150, 858, 44, '#FFFFFF');
  o += T(title, 340, 862, 54, '#FFFFFF', { 'text-anchor': 'start' }) + (sub ? TF(sub, 1880, 860, 32, '#FFD2EC', { 'text-anchor': 'end' }) : '');
  return o;
}
// the digital alarm clock (x, y = centre)
function alarmClock(x, y, s, txt, t, flash = 0) {
  let o = S.rect(-330, -170, 660, 340, 70, ol('#2A2F3C', 10)) + S.rect(-290, -130, 580, 260, 40, { fill: '#10131C' });
  o += S.rect(-250, 170, 80, 30, 10, ol('#2A2F3C', 6)) + S.rect(170, 170, 80, 30, 10, ol('#2A2F3C', 6));
  o += T(txt, -20, 70, 210, flash > 0 ? '#FFFFFF' : '#FF4D5E', { 'letter-spacing': 4 });
  o += TF('PM', 230, -60, 40, '#FF4D5E') + S.circle(230, -20, 8, { fill: '#FF4D5E' });
  if (flash > 0) o += S.rect(-290, -130, 580, 260, 40, { fill: '#FF4D5E', opacity: f(0.25 * flash) });
  o += S.path('M-260 -110 L-120 -110 L-250 20 Z', { fill: '#FFFFFF', opacity: 0.07 });
  return S.g(o, tr(x, y, s));
}
// a calendar page
function calendar(x, y, k, t) {
  if (k <= 0) return '';
  let o = S.rect(-170, -170, 340, 360, 18, ol('#FFFFFF', 7)) + S.rect(-170, -170, 340, 100, 18, { fill: '#E8453C' }) + S.rect(-170, -100, 340, 30, 0, { fill: '#E8453C' });
  for (let i = 0; i < 6; i++) o += S.circle(-125 + i * 50, -170, 10, ol('#C9CED8', 4));
  o += T('TUESDAY', 0, -100, 60, '#FFFFFF') + T('6 PM', 0, 40, 96, '#2A2A33') + TF('(totally normal)', 0, 120, 30, '#8A8A99');
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(-6 + 2 * Math.sin(t * 2))}) scale(${f(pop(k))})`);
}
function smiley(x, y, r, k, t) {
  if (k <= 0) return '';
  let o = K.rays(0, 0, 18, r * 2.4, '#FFF3A8', 0.35, t * 40);
  o += S.circle(0, 0, r, ol('#FFD21F', r * 0.06)) + S.circle(0, 0, r * 0.84, { fill: 'none', stroke: '#FFF1A6', 'stroke-width': r * 0.05, opacity: 0.6 });
  o += S.ellipse(-r * 0.33, -r * 0.22, r * 0.11, r * 0.17, { fill: '#151515' }) + S.path(`M${f(r * 0.2)} ${f(-r * 0.22)} Q${f(r * 0.33)} ${f(-r * 0.36)} ${f(r * 0.46)} ${f(-r * 0.22)}`, ln(r * 0.07));
  o += S.path(`M${f(-r * 0.55)} ${f(r * 0.1)} Q0 ${f(r * 0.8)} ${f(r * 0.55)} ${f(r * 0.1)} Z`, ol('#FFFFFF', r * 0.05)) + S.path(`M${f(-r * 0.5)} ${f(r * 0.22)} L${f(r * 0.5)} ${f(r * 0.22)}`, ln(r * 0.03, '#C9CED8'));
  o += S.ellipse(-r * 0.6, r * 0.2, r * 0.12, r * 0.07, { fill: '#FF8FA8', opacity: 0.7 }) + S.ellipse(r * 0.62, r * 0.2, r * 0.12, r * 0.07, { fill: '#FF8FA8', opacity: 0.7 });
  const b = Math.abs(Math.sin(t * 7)) * 0.06;
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(8 * Math.sin(t * 5))}) scale(${f(pop(k) * (1 + b))} ${f(pop(k) * (1 - b))})`);
}
function bird(x, y, s, flap) {
  const a = 30 * Math.sin(flap);
  return S.g(S.path(`M-30 ${f(-a * 0.6)} Q-14 -4 0 4 Q14 -4 30 ${f(-a * 0.6)}`, ln(7, '#2A2246')), tr(x, y, s));
}
function flame(x, y, s, t, grey = 0) {
  const fl = Math.sin(t * 17) * 6 + Math.sin(t * 29) * 4;
  const d = `M0 0 C-90 -10 -110 -120 -40 -190 C-50 -130 -10 -120 0 -150 C10 -220 40 -260 30 -330 C110 -250 130 -110 80 -40 C70 -20 40 0 0 0 Z`;
  let o = S.path(d, { fill: grey > 0.5 ? '#9AA0AA' : 'url(#s03flame)', stroke: '#151515', 'stroke-width': 8, transform: `skewX(${f(fl * 0.6)})` });
  o += S.path('M0 -30 C-40 -40 -40 -100 -10 -130 C0 -90 30 -100 30 -60 C30 -40 20 -30 0 -30 Z', { fill: grey > 0.5 ? '#C9CED8' : '#FFF3A8', opacity: 0.9 });
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)} ${f(s * (1 + fl * 0.01))})`);
}
function dog(x, y, s, t, o = {}) {
  // cartoon beagle sitting (origin = floor between the paws); o.mouth 0..1, o.wag
  const m = clamp(o.mouth || 0, 0, 1);
  const wag = Math.sin(t * 14) * 18;
  let b = S.path(`M60 -60 Q${f(130 + wag)} -120 ${f(110 + wag * 1.5)} -190`, ln(26)) + S.path(`M60 -60 Q${f(130 + wag)} -120 ${f(110 + wag * 1.5)} -190`, ln(16, '#D9944A'));
  b += S.ellipse(0, -110, 110, 120, ol('#D9944A', 8)) + S.ellipse(0, -80, 64, 80, { fill: '#FFF1D6' });
  b += S.rect(-80, -40, 50, 50, 20, ol('#FFF1D6', 7)) + S.rect(30, -40, 50, 50, 20, ol('#FFF1D6', 7));
  let h = S.ellipse(0, 0, 120, 100, ol('#D9944A', 8)) + S.path('M-40 -96 Q0 -60 40 -96 L30 10 L-30 10 Z', { fill: '#FFF1D6' });
  h += S.ellipse(0, 50, 72, 54, ol('#FFF1D6', 7)) + S.ellipse(0, 22, 26, 18, { fill: '#2A1A12' }) + S.ellipse(-6, 16, 8, 5, { fill: '#FFFFFF', opacity: 0.7 });
  h += S.circle(-46, -20, 14, { fill: '#151515' }) + S.circle(46, -20, 14, { fill: '#151515' }) + S.circle(-42, -25, 5, { fill: '#FFFFFF' }) + S.circle(50, -25, 5, { fill: '#FFFFFF' });
  if (m > 0.05) h += S.ellipse(0, 72, 28, 10 + 26 * m, ol('#5A1A1A', 6)) + S.ellipse(0, 80 + 10 * m, 16, 10, { fill: '#FF6F8A' });
  else h += S.path('M-30 66 Q-15 80 0 66 Q15 80 30 66', ln(6));
  // floppy ears + headset
  h += S.path('M-100 -50 Q-170 0 -130 110 Q-100 90 -90 0 Z', ol('#7A4A2A', 7)) + S.path('M100 -50 Q170 0 130 110 Q100 90 90 0 Z', ol('#7A4A2A', 7));
  h += S.path('M-110 -30 Q-110 -150 0 -150 Q110 -150 110 -30', ln(14, '#1B1D26')) + S.rect(-130, -50, 40, 70, 14, ol('#27C4FF', 5)) + S.rect(90, -50, 40, 70, 14, ol('#27C4FF', 5)) + S.path('M-110 10 Q-90 80 -40 80', ln(6, '#1B1D26')) + S.circle(-40, 80, 9, { fill: '#1B1D26' });
  b += S.g(h, `translate(0 -270) rotate(${f(o.tilt || 0)})`);
  return S.g(b, tr(x, y, s));
}
function school(t, closed) {
  let o = S.rect(-800, -600, 3520, 1300, 0, { fill: '#8FD3FF' }) + S.rect(-800, 700, 3520, 600, 0, { fill: '#B9C2D0' }) + S.rect(-800, 800, 3520, 400, 0, { fill: '#7ED36A' });
  o += S.rect(460, 230, 1000, 470, 8, ol('#C8553D', 8)) + S.path('M420 240 L960 60 L1500 240 Z', ol('#8A3A2A', 8));
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) if (!(i === 1 || i === 2) || j === 0) o += S.rect(520 + i * 240, 290 + j * 200, 140, 110, 8, ol('#BFF0FF', 6));
  o += S.rect(870, 520, 180, 180, 8, ol('#5A3A2A', 7)) + S.path('M960 520 L960 700', ln(5));
  o += S.rect(760, 180, 400, 70, 10, ol('#FFF1D6', 6)) + T('SCHOOL', 960, 232, 56, '#8A3A2A');
  o += S.path('M1580 700 L1580 200', ln(10, '#5A6070')) + S.path(`M1580 210 Q${f(1660 + 10 * Math.sin(t * 5))} 200 1740 ${f(220 + 10 * Math.sin(t * 5 + 1))} L1740 300 Q1660 290 1580 300 Z`, ol('#FF5A5A', 5));
  if (closed > 0) {
    o += S.g(S.rect(-330, -70, 660, 140, 14, { fill: '#FFF8EC', stroke: '#E8243C', 'stroke-width': 14 }) + T('CLOSED!', 0, 40, 110, '#E8243C'), `translate(960 430) rotate(-10) scale(${f(lerp(2.4, 1, ease.out(clamp(closed, 0, 1))))})`, { opacity: f(clamp(closed * 3, 0, 1)) });
  }
  return o;
}
function whiteboard() {
  let o = S.rect(-800, -600, 3520, 2280, 0, { fill: '#DDE6EE' }) + S.rect(-800, 820, 3520, 600, 0, { fill: '#9AA5B5' });
  o += S.rect(360, 150, 1200, 560, 14, ol('#FFFFFF', 10)) + S.rect(380, 700, 1160, 20, 6, ol('#C9CED8', 5));
  o += T('SHUTDOWN', 960, 270, 70, '#2F6FD6') + S.path('M500 600 L700 520 L860 560 L1040 380 L1200 420 L1400 300', ln(10, '#E8243C'));
  o += TF('STOPPABLE?', 760, 420, 46, '#2A2A33') + S.path('M600 400 L920 440 M600 440 L920 400', ln(10, '#E8243C')) + TF('NO.', 1300, 560, 64, '#E8243C');
  return o;
}

// ---------------------------------------------------------------- shared shots
function atticEve(t, cam, chars, opts = {}) {
  const Ls = SETS.attic.layers(t, { time: 'evening', juice: 4, stoolX: 900, cat: 'bed', ...opts });
  return view(cam, Ls.bg, 0.5) + view(cam, Ls.mid + chars, 1) + view(cam, Ls.fg, 1.2) + view(cam, Ls.light, 1);
}
function livingEve(t, cam, chars, opts = {}) {
  const Ls = SETS.livingRoom.layers(t, { time: 'evening', ...opts });
  return view(cam, Ls.bg, 0.5) + view(cam, Ls.mid + (opts.seated || '') + Ls.seat + chars, 1) + view(cam, Ls.light, 1);
}
// Dad on the couch (seated) — paper 0..1 raised, laptop hidden behind it
function dadCouch(t, o = {}) {
  const paper = o.paper ?? 1;
  const lap = SETS.laptop(0, -300, 0.62, o.lapScreen || fishScreen(t), { glow: 1 });
  const props = [];
  if (o.laptop !== false) props.push({ svg: lap, layer: 'front' });
  if (paper > 0) props.push({ svg: SETS.newspaper(0, lerp(-380, -600, paper), 0.95, t, { glow: true, shake: o.shake || 0 }), layer: 'front' });
  return actor('dad', t, { x: 900, y: 908, s: 0.55, armL: 14, armR: 14, face: o.face || 'sneaky', ...(o.pose || {}), props }, { arms: false, ...(o.act || {}) });
}
// Pip in his box holding a tablet (screen fn)
const BOX = { x: 1300, y: 960, s: 1.15 };
function pipBoxTab(t, screen, o = {}) {
  const b = BOX;
  const yFeet = b.y - 60 * b.s + lerp(420, -40, o.rise ?? 0.9);
  const p = actor('pip', t, { x: b.x - 10, y: yFeet, s: 0.5 * b.s, armL: 20, armR: 20, ...(o.pose || {}) }, o.act || {});
  const bo = { floor: 1, tilt: o.tilt || 0 };
  return SETS.pipBox(b.x, b.y, b.s, t, { ...bo, part: 'back' }) + p + SETS.pipBox(b.x, b.y, b.s, t, { ...bo, part: 'front' }) + tablet(b.x - 10, b.y - 205, 0.58, -4 + (o.tabRot || 0), screen);
}
// Dex in his room (standing)
function dexWorld(t, pose = {}, act = {}) {
  const Ls = SETS.dexRoom.layers(t, {});
  return Ls.mid + actor('dex', t, { x: 960, y: 1000, s: 0.62, ...pose }, act);
}

// ---------------------------------------------------------------- shots
function shotTue(t) {
  // evening attic: Juno builds; a calendar page pops — TUESDAY, 6 PM (totally normal)
  const tT = W(0, 'Tuesday');
  const cam = camKeys(t, [[tTue, camAt(820, 560, 1.12)], [tClock, camAt(780, 540, 1.3)]]);
  let o = atticEve(t, cam, junoSeated(t, { typing: 1, face: 'happy' }));
  o += calendar(1560, 400, seg(t, tT - 0.1, tT + 0.2), t);
  o += C.whiteFlash(1 - seg(t, START, START + 0.25));
  return o;
}
function shotClock(t) {
  // the desk clock flips 5:59 → 6:00
  const tS = W(0, 'Six') + 0.05;
  const cam = camKeys(t, [[tClock, { zoom: 1.0, x: 0, y: 0 }], [tQuad, { zoom: 1.1, x: 0, y: -10 }]]);
  let w = S.rect(-800, -600, 3520, 1400, 0, { fill: '#2EA89E' }) + S.rect(-800, 760, 3520, 600, 0, { fill: '#D08E52' }) + S.rect(-800, 760, 3520, 16, 0, { fill: '#B87A44' });
  w += SETS.juiceBox(330, 800, 2.4, -8, '#FF8A3D') + SETS.juiceBox(1620, 800, 2.4, 10, '#7CD45A');
  const fl = bump(t, tS, tS + 0.4);
  w += alarmClock(960, 560, 1.5, t < tS ? '5:59' : '6:00', t, fl);
  let o = view(cam, w, 1);
  if (t > tS) o += S.g(dingFx(0, 0, seg(t, tS, tS + 0.7), 1.1, false), 'translate(1500 230)') + K.bang('PEAK GAMING HOUR', 960, 170, seg(t, tS + 0.15, tS + 0.3), 70, -3, '#FFD21F');
  return o;
}
// the four players (world compositions for the quad)
function quadJuno(t, frozen) { return SETS.attic(t, { time: 'evening', juice: 4, stoolX: 900, cat: 'bed', screen: frozen ? popScreen(bubScreen(t), 1, 3) : undefined }) + junoSeated(t, frozen ? { typing: 0, face: 'shocked', pose: { armL: 120, armR: 110 } } : { typing: 1, face: 'happy' }); }
function quadDex(t, frozen) { return dexWorld(t, frozen ? { view: 'front', armL: 150, armR: 150, face: 'shocked', x: 520 } : { view: 'side', x: 600, armL: 70 + 8 * Math.sin(t * 20), armR: 64 + 8 * Math.sin(t * 20 + 2), face: 'excited' }, { arms: false }) + (frozen ? S.g(shutPopup(440, 260, 1, 3), 'translate(210 640)') : ''); }
function quadPip(t, frozen) { return SETS.attic(t, { time: 'evening', juice: 4, cat: 'bed' }) + pipBoxTab(t, frozen ? popScreen(elevScreen(t), 1, 3) : elevScreen(t), { pose: { face: frozen ? { name: 'shocked', fx: [] } : 'excited' } }); }
function quadDad(t, frozen) {
  const Ls = SETS.livingRoom.layers(t, { time: 'evening' });
  return Ls.bg + Ls.mid + dadCouch(t, frozen ? { paper: 0.15, face: 'shocked', lapScreen: popScreen(fishScreen(t), 1, 3) } : { paper: 1, face: { name: 'sneaky', eyes: { look: [0, 0.8] } } }) + Ls.seat + Ls.light;
}
const QUAD = [[quadJuno, [760, 520], 1.25], [quadDex, [560, 600], 1.9], [quadPip, [1290, 640], 1.6], [quadDad, [900, 520], 1.7]];
function quad(t, frozenT, kins, o = {}) {
  const pad = 18, w = (1920 - pad * 3) / 2, h = (1080 - pad * 3) / 2;
  let out = S.rect(0, 0, 1920, 1080, 0, { fill: '#1B2340' });
  QUAD.forEach(([fn, focus, zoom], i) => {
    const x = pad + (i % 2) * (w + pad), y = pad + Math.floor(i / 2) * (h + pad);
    const tt = frozenT !== null ? Math.min(t, frozenT) : t;
    out += panel(x, y, w, h, fn(tt, !!o.frozen), kins[i], { focus, zoom, from: ['left', 'right', 'left', 'right'][i], border: o.frozen ? '#C9CED8' : '#FFFFFF' });
  });
  return out;
}
function shotQuad(t) {
  // split-screen: everybody plays — Juno builds, Dex runs an obby, Pip rides, Dad's "newspaper" glows... "And then..." FREEZE
  const ks = [W(0, 'Peak') - 0.05, W(0, 'gaming') - 0.05, W(0, 'hour') - 0.05, W(0, 'hour') + 0.2].map((a) => seg(t, a, a + 0.22));
  let o = quad(t, t >= tFreeze ? tFreeze : null, ks);
  const fz = seg(t, tFreeze, tFreeze + 0.25);
  if (fz > 0) o += S.rect(0, 0, 1920, 1080, 0, { fill: '#2A2F3C', opacity: f(0.3 * fz) });
  o += tag('6:00 PM · PEAK GAMING HOUR', 960, 540, seg(t, W(0, 'hour'), W(0, 'hour') + 0.2) * (1 - fz), '#FFD21F', -2, 56);
  if (fz > 0) o += S.g(S.rect(-120, -60, 240, 120, 20, { fill: '#000', opacity: 0.55 }) + S.rect(-50, -36, 30, 72, 6, { fill: '#FFFFFF' }) + S.rect(20, -36, 30, 72, 6, { fill: '#FFFFFF' }), `translate(960 540) scale(${f(pop(fz))})`);
  return o;
}
function shotEarth(t) {
  // night side of the Earth: billions of screens glowing; they all blink at once on "world"
  const tSc = W(1, 'screen'), tWo = W(1, 'world');
  const cam = camKeys(t, [[tEarth, camAt(960, 560, 1.0)], [tFirst, camAt(960, 560, 1.35)]], ease.linear);
  let o = view(cam, SETS.earth(t, { night: 1, spin: 0.05 }), 1);
  const bl = bump(t, tWo, tWo + 0.35) + 0.6 * bump(t, tSc, tSc + 0.3);
  if (bl > 0) o += view(cam, S.circle(960, 560, 380, { fill: '#BFE8FF', opacity: f(0.22 * bl) }) + S.circle(960, 560, 420, { fill: 'none', stroke: '#9FF3FF', 'stroke-width': 18, opacity: f(0.5 * bl) }), 1);
  return o;
}
function shotFirst(t) {
  // Juno at the laptop; push in over her shoulder — the grey window bloops onto the screen on "same"
  const tS = W(1, 'same');
  const k = landK(t, tS);
  const cam = shakeCam(camKeys(t, [[tFirst, camAt(760, 520, 1.35)], [tS, camAt(680, 480, 2.2)], [tM[0], camAt(650, 460, 2.9)]]), t, tS, 0.25, 8);
  const j = junoSeated(t, { typing: t < tS ? 1 : 0, face: t < tS ? 'happy' : 'shocked', pose: t > tS ? { armL: 110, armR: 100, lean: -6 } : {} });
  let o = atticEve(t, cam, j, { screen: popScreen(bubScreen(t), k, 3) });
  if (k > 0 && k < 1) o += C.whiteFlash(0.25 * (1 - k));
  return o;
}
// ---- the montage: same grey window on every screen
function devShot(t, t0, kind, bgFn, x, y, s, base, opts = {}) {
  const k = landK(t, t0 + 0.03);
  const Z = opts.zoom || 1;
  const z = Z * (0.78 + 0.22 * ease.outBack(seg(t, t0, t0 + 0.22))) * (1 + 0.04 * seg(t, t0 + 0.22, t0 + 1));
  const cam = shakeCam(camAt(x + (opts.dx || 0), y + (opts.dy || 0), z), t, t0 + 0.05, 0.2, 10);
  let w = bgFn(t) + SETS.screens(kind, x, y, s, popScreen(base, k, opts.lines || 3), t, opts.so || {});
  return view(cam, w, 1) + (k > 0 && k < 1 ? C.whiteFlash(0.2 * (1 - k)) : '');
}
const bgRoom = (c1, c2) => () => S.rect(-800, -600, 3520, 2280, 0, { fill: c1 }) + S.rect(-800, -600, 3520, 2280, 0, { fill: 'url(#wallStripes)', opacity: 0.5 }) + S.rect(-800, 900, 3520, 600, 0, { fill: c2 });
function bgKitchen() { return S.rect(-800, -600, 3520, 2280, 0, { fill: 'url(#backsplash)' }) + S.rect(-800, 860, 3520, 600, 0, { fill: '#E3DED2' }) + S.rect(-800, 850, 3520, 20, 0, { fill: '#C9C2B4' }); }
function bgStore() { let o = S.rect(-800, -600, 3520, 2280, 0, { fill: '#F4E6C8' }); for (let i = 0; i < 4; i++) { o += S.rect(-100, 80 + i * 170, 2200, 18, 0, { fill: '#B87A44' }); for (let j = 0; j < 22; j++) o += S.rect(-80 + j * 100, 10 + i * 170, 70, 70, 6, { fill: ['#FF5A5A', '#FFD21F', '#3BD16F', '#34C3FF'][(i + j) % 4], opacity: 0.7 }); } return o; }
function bgPlane() { let o = S.rect(-800, -600, 3520, 2280, 0, { fill: '#E9EDF3' }); for (const x of [120, 1800]) o += S.rect(x - 70, 240, 140, 220, 70, ol('#BFE8FF', 8)); return o; }
const MONT = [
  (t, t0) => devShot(t, t0, 'phone', bgRoom('#B07CFF', '#5A3A8A'), 960, 520, 1.15, (w, h) => gameBg(w, h, t, 1), { zoom: 2.0, dy: 40 }),
  (t, t0) => { // the living-room TV
    const k = landK(t, t0 + 0.03);
    const cam = shakeCam(camKeys(t, [[t0, camAt(305, 510, 2.7)], [t0 + 0.6, camAt(305, 505, 2.9)]]), t, t0 + 0.05, 0.2, 10);
    return livingEve(t, cam, '', { tv: popScreen((w, h) => gameBg(w, h, t, 2), k, 3) }) + (k > 0 && k < 1 ? C.whiteFlash(0.2 * (1 - k)) : '');
  },
  (t, t0) => devShot(t, t0, 'watch', bgRoom('#FFB98A', '#E8603C'), 1080, 540, 2.0, (w, h) => S.rect(-w / 2, -h / 2, w, h, 0, { fill: '#10131C' }) + T('6:00', 0, 20, 60, '#7CF7FF'), { zoom: 1.9 }),
  (t, t0) => devShot(t, t0, 'microwave', bgKitchen, 1350, 420, 1.6, (w, h) => S.rect(-w / 2, -h / 2, w, h, 0, { fill: '#10131C' }) + T('0:30', 0, 16, 50, '#3BFF7A'), { zoom: 2.6, dx: -60, dy: 30 }),
  (t, t0) => devShot(t, t0, 'register', bgStore, 960, 420, 1.55, (w, h) => S.rect(-w / 2, -h / 2, w, h, 0, { fill: '#1E5FC8' }) + T('$4.99', 0, 16, 50, '#FFFFFF'), { zoom: 2.0, dy: 60 }),
  (t, t0) => { // the giant billboard over the city
    const k = landK(t, t0 + 0.03);
    const cam = shakeCam(camKeys(t, [[t0, { zoom: 1.0, x: 0, y: 40 }], [tM[6], { zoom: 1.12, x: 80, y: -20 }]]), t, t0 + 0.05, 0.3, 14);
    return view(cam, SETS.screens('billboard', 0, 0, 1, popScreen((w, h) => gameBg(w, h, t, 3), k, 3), t), 1) + (k > 0 && k < 1 ? C.whiteFlash(0.2 * (1 - k)) : '');
  },
  (t, t0) => devShot(t, t0, 'planeSeat', bgPlane, 960, 470, 1.05, (w, h) => gameBg(w, h, t, 4), { zoom: 1.9, dy: 30 }),
];
function shotMontage(t) {
  let i = 0;
  for (let j = 0; j < tM.length; j++) if (t >= tM[j]) i = j;
  return MONT[i](t, tM[i]);
}
function shotGrid(t) {
  // pull out: the same window on all of them at once
  const cells = [
    [(tt) => bgRoom('#B07CFF', '#5A3A8A')() + SETS.screens('phone', 960, 520, 1.15, popScreen(null, 1, 3), tt), [960, 520], 1.3],
    [(tt) => SETS.livingRoom(tt, { time: 'evening', tv: popScreen(null, 1, 3) }), [305, 510], 2.4],
    [(tt) => bgRoom('#FFB98A', '#E8603C')() + SETS.screens('watch', 1080, 540, 2.0, popScreen(null, 1, 3), tt), [960, 540], 1.1],
    [(tt) => bgKitchen() + SETS.screens('microwave', 1350, 420, 1.6, popScreen(null, 1, 3), tt), [1100, 520], 1.2],
    [(tt) => bgStore() + SETS.screens('register', 960, 420, 1.55, popScreen(null, 1, 3), tt), [960, 500], 1.2],
    [(tt) => SETS.screens('billboard', 0, 0, 1, popScreen(null, 1, 3), tt), [1060, 420], 1.3],
    [(tt) => bgPlane() + SETS.screens('planeSeat', 960, 470, 1.05, popScreen(null, 1, 3), tt), [960, 480], 1.2],
    [(tt) => SETS.attic(tt, { time: 'evening', juice: 4, screen: popScreen(null, 1, 3) }), [620, 450], 3.0],
  ];
  const n = 4, pad = 16, w = (1920 - pad * (n + 1)) / n, h = (1080 - pad * 3) / 2;
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#2A2F3C' });
  const u = ease.out(seg(t, tGrid, tGrid + 0.35));
  let g = '';
  cells.forEach(([fn, focus, zoom], i) => {
    const x = pad + (i % n) * (w + pad), y = pad + Math.floor(i / n) * (h + pad);
    g += panel(x, y, w, h, fn(t), seg(t, tGrid + i * 0.03, tGrid + i * 0.03 + 0.15), { focus, zoom, border: '#C9CED8', bw: 6 });
  });
  o += S.g(g, `translate(960 540) scale(${f(lerp(1.5, 1, u))}) translate(-960 -540)`);
  return o;
}
function shotThanks(t) {
  // the window, full frame: "Thanks for playing!" ... "Smiley face." — a giant cheesy smiley bounces in
  const tTh = W(3, 'Thanks'), tSm = W(3, 'Smiley');
  const cam = camKeys(t, [[tThanks, { zoom: 1.0, x: 0, y: 0 }], [tFrozen, { zoom: 1.12, x: 0, y: 30 }]]);
  let w = S.rect(-800, -600, 3520, 2280, 0, { fill: '#3A4152' });
  for (let i = 0; i < 6; i++) w += S.g(shutPopup(500, 260, 1, 3), `translate(${f(200 + (i % 3) * 760)} ${f(i < 3 ? 120 : 960)}) rotate(${(i - 2) * 4})`, { opacity: 0.25 });
  w += S.g(shutPopup(1800, 860, 1, t >= tTh ? 4 : 3), 'translate(960 470)');
  if (t >= tTh) w += K.F.sparkle(1360, 640, 30 * bump(t, tTh, tTh + 0.6));
  let o = view(cam, w, 1);
  o += smiley(1600, 810, 210, seg(t, tSm - 0.05, tSm + 0.3), t);
  return o;
}
function shotFrozen(t) {
  // silence: everybody frozen, staring at the window (one cricket)
  let o = quad(tFrozen, tFrozen, [1, 1, 1, 1], { frozen: true });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#1A1E2A', opacity: 0.15 });
  o += TF('*cricket*', 960, 560, 54, '#FFFFFF', { ...OUT(8), opacity: f(seg(t, tFrozen + 0.25, tFrozen + 0.4)) });
  return o;
}
function shotNooo(t) {
  // from space: the whole planet screams — a NOOOO shockwave rolls around the globe, birds flee
  const t0 = tNooo + 0.15;
  const wave = seg(t, t0, tDex + 0.05);
  const cam = shakeCam(camKeys(t, [[tNooo, camAt(960, 560, 1.3)], [t0, camAt(960, 560, 1.15)], [tDex, camAt(960, 560, 0.95)]]), t, t0, 0.9, 22);
  let w = SETS.earth(t, { wave, spin: 0.05 });
  for (let i = 0; i < 14; i++) {
    const a = hash(i * 3.3) * Math.PI * 2, d = 400 + seg(t, t0 + 0.2 + hash(i) * 0.2, tDex + 0.3) * 700;
    if (d > 405) w += bird(960 + Math.cos(a) * d, 560 + Math.sin(a) * d * 0.8, 1 + hash(i * 5) * 0.6, t * 20 + i);
  }
  let o = view(cam, w, 1);
  const k = seg(t, t0, t0 + 0.2);
  if (k > 0) {
    const sz = lerp(120, 220, seg(t, t0, tDex));
    const jit = Math.sin(t * 90) * 6;
    o += S.g(T('NOOOOOO!', 0, 0, sz, '#FFFFFF', { ...OUT(sz * 0.12), 'letter-spacing': 6 }), `translate(${f(960 + jit)} ${f(300 - jit)}) rotate(-4) scale(${f(pop(k))})`);
  }
  return o;
}
function shotForever(t) {
  // Dex in his room: "FOREVER?!" — hands on head; "Like..."; smash-zoom "FOREVER forever?!"
  const tF2 = W(4, 'FOREVER', 1), tLike = W(4, 'Like');
  const close = t >= tF2 - 0.05;
  const cam0 = close ? camKeys(t, [[tF2 - 0.05, camAt(960, 470, 2.7)], [tF2 + 0.15, camAt(960, 490, 2.35)], [tStreak, camAt(960, 490, 2.45)]]) : camKeys(t, [[tDex, camAt(960, 600, 1.25)], [tLike, camAt(960, 560, 1.45)], [tF2, camAt(960, 540, 1.5)]]);
  const cam = shakeCam(shakeCam(cam0, t, tDex, 0.5, 14), t, tF2 - 0.05, 0.6, 18);
  const jump = bump(t, tDex, tDex + 0.45);
  const fr = t > tLike && t < tF2 - 0.1;
  const w = dexWorld(t, { lift: 140 * jump, armL: 172, armR: 172, face: fr ? { name: 'shocked', eyes: { pupil: 0.3 } } : 'scream', headRot: fr ? 0 : 6 * Math.sin(t * 25), x: 960 + (fr ? Math.sin(t * 70) * 3 : 0) }, { arms: false });
  let o = view(cam, (close ? K.rays(960, 450, 18, 1600, '#FF5A6E', 0.25, t * 40) : '') + w, 1);
  o += K.bang('FOREVER?!', 1400, 260, seg(t, tDex + 0.05, tDex + 0.2) * (1 - seg(t, tLike - 0.2, tLike)), 120, -8, '#FF5A6E');
  if (close) o += C.speedLines(0, 1920, 540, 22, 5, '#FFFFFF', 1000).repeat(Math.floor(t * 30) % 2);
  return o;
}
function monitor(x, y, s, inner) {
  let o = S.rect(-330, -210, 660, 420, 22, ol('#1A1D26', 10)) + S.rect(-300, -180, 600, 340, 8, { fill: '#2A2246' }) + inner;
  o += S.rect(-40, 210, 80, 90, 6, ol('#1A1D26', 6)) + S.rect(-150, 290, 300, 30, 12, ol('#1A1D26', 6));
  return S.g(o, tr(x, y, s));
}
function shotStreak(t) {
  // Dex on his knees before the monitor: the 900-day streak flame shivers... and goes grey on "streak!"
  const tSt = W(5, 'streak'), t900 = W(5, 'nine-hundred-day');
  const cam = camKeys(t, [[tStreak, camAt(880, 560, 1.15)], [tSt, camAt(840, 540, 1.32)], [tPip, camAt(830, 540, 1.36)]]);
  const grey = seg(t, tSt + 0.1, tSt + 0.5);
  let inner = flame(0, 60, 0.75 * lerp(1, 0.55, grey), t, grey);
  const cnt = Math.round(lerp(120, 900, ease.out(seg(t, t900 - 0.1, t900 + 0.6))));
  inner += T(`${cnt} DAYS`, 0, 140, 64, grey > 0.5 ? '#9AA0AA' : '#FFD21F', OUT(8)) + TF('LOGIN STREAK', 0, -140, 34, '#BFE0FF');
  if (grey > 0) for (let i = 0; i < 3; i++) { const k = (t - tSt - 0.2 - i * 0.2); if (k > 0) inner += S.circle(Math.sin(k * 4 + i) * 30, 20 - k * 200, 20 + k * 40, { fill: '#C9CED8', opacity: f(clamp(0.7 - k * 0.6, 0, 1)) }); }
  let w = SETS.dexRoom.layers(t, {}).mid + monitor(560, 450, 1.05, inner);
  const sob = Math.sin(t * 14) * 4;
  w += actor('dex', t, { x: 1150, y: 1060, s: 0.62, turn: -0.5, bodyY: 120 + sob, armL: 30, armR: 30, face: 'crying', headRot: -6 }, { arms: false, energy: 1.2 });
  // tear fountains
  for (let i = 0; i < 8; i++) { const ph = (t * 2.2 + i / 8) % 1; for (const sd of [-1, 1]) w += S.ellipse(1150 + sd * (50 + ph * 260), 1060 - 0.62 * 640 + 75 + ph * ph * 500 - ph * 200, 10, 14, { fill: '#7CC8FF', stroke: '#151515', 'stroke-width': 3, opacity: f(1 - ph) }); }
  return view(cam, w, 1);
}
function shotPipSad(t) {
  // Pip in his box, tablet with the window over his elevator: "...Even the elevator?" — tiny, wobbly lip
  const cam = camKeys(t, [[tPip, camAt(1290, 600, 1.9)], [tDadA, camAt(1290, 590, 2.35)]], ease.linear);
  const p = pipBoxTab(t, popScreen(elevScreen(t), 1, 3), { pose: { face: { name: 'sad', eyes: { pupil: 1.7, sparkle: true }, fx: ['tears'] }, headRot: 4 * Math.sin(t * 3) }, tilt: -3 });
  return atticEve(t, cam, p);
}
function shotDadFine(t) {
  // Dad on the couch lowers the glowing paper: "It's fine. It's just a game." (the paper trembles)
  const cam = camKeys(t, [[tDadA, camAt(900, 560, 1.7)], [tDadB, camAt(900, 540, 2.0)]]);
  const low = ease.inOut(seg(t, tDadA + 0.05, tDadA + 0.45));
  const d = dadCouch(t, { paper: lerp(1, 0.35, low), shake: 0.6, face: { name: 'nervous', eyes: { look: [0.2, 0] } }, laptop: false });
  return livingEve(t, cam, '', { seated: d });
}
function shotDadFish(t) {
  // behind the paper: Dad hugs his laptop (the fish under the grey window) — "Not my fish. Please, not my fish."
  const tPl = W(7, 'Please');
  const cam = camKeys(t, [[tDadB, camAt(900, 520, 2.1)], [tPl, camAt(900, 500, 2.4)], [tJuno, camAt(900, 495, 2.5)]]);
  const sq = bump(t, tPl - 0.1, tPl + 0.6);
  const rock = Math.sin(t * 6) * 4;
  const lap = SETS.laptop(0, -300, 0.7, popScreen(fishScreen(t), 1, 3), {});
  const d = actor('dad', t, { x: 900, y: 908, s: 0.55, armL: -10, armR: -10, sx: 1 - 0.04 * sq, sy: 1 + 0.03 * sq, lean: rock, face: { name: 'crying' }, props: [{ svg: S.g(lap, `rotate(${f(-4 + rock)})`), layer: 'front' }] }, { arms: false });
  let o = livingEve(t, cam, '', { seated: d });
  // the newspaper's back in the foreground framing the shot
  o += S.g(S.path('M-200 -200 L560 -200 L470 1300 L-200 1300 Z', ol('#EDE8DA', 8)) + S.path('M1460 -200 L2120 -200 L2120 1300 L1380 1300 Z', ol('#EDE8DA', 8)), `translate(${f(Math.sin(t * 30) * 4)} 0)`);
  let txt = '';
  for (let i = 0; i < 14; i++) { const y = 80 + i * 66; txt += `M${f(30 + i * 3)} ${y} L${f(380 - i * 5)} ${y} M${f(1560 + i * 4)} ${y} L1880 ${y} `; }
  o += S.path(txt, ln(10, '#C9C2B4')) + S.path('M120 -200 L60 1300 M1700 -200 L1760 1300', ln(6, '#B9B3A3'));
  return o;
}
function shotJunoPanic(t) {
  // Juno grabs her hat, the laptop wears the grey window: "My game isn't finished!" — BUILD 87%
  const tFin = W(8, 'finished');
  const cam = shakeCam(camKeys(t, [[tJuno, camAt(840, 600, 1.45)], [tEnd, camAt(860, 580, 1.6)]]), t, tFin, 0.4, 12);
  const j = actor('juno', t, { x: 860, y: 1000, s: 0.62, armL: 172 + 6 * Math.sin(t * 20), armR: 172 + 6 * Math.sin(t * 20 + 1), face: t > tFin ? 'scream' : 'scared', headRot: 5 * Math.sin(t * 22) }, { arms: false, energy: 1.6 });
  let o = atticEve(t, cam, j, { screen: popScreen(bubScreen(t), 1, 3), stool: false });
  const k = seg(t, tFin, tFin + 0.25);
  if (k > 0) {
    const pct = Math.round(lerp(0, 87, ease.out(seg(t, tFin, tFin + 0.5))));
    let b = S.rect(-330, -80, 660, 160, 26, ol('#2A2246', 8)) + TF('BUBBLE ISLAND · BUILD', -300, -24, 34, '#BFE0FF', { 'text-anchor': 'start' });
    b += S.rect(-300, 10, 600, 46, 23, { fill: '#10131C' }) + S.rect(-300, 10, 600 * pct / 100, 46, 23, { fill: '#3BD16F' }) + T(`${pct}%`, 0, 50, 42, '#FFFFFF', OUT(6));
    o += S.g(b, `translate(1460 230) rotate(-3) scale(${f(pop(k))})`);
  }
  return o;
}
function unfinished(t) {
  // the right edge of Bubble Island: the world just... stops (grey grid, barrier, sign)
  let o = S.rect(1900, -600, 1400, 2280, 0, { fill: '#9CA1AA' });
  let g = '';
  for (let x = 1900; x < 3300; x += 60) g += `M${x} -600 L${x} 1680 `;
  for (let y = -600; y < 1680; y += 60) g += `M1900 ${y} L3300 ${y} `;
  o += S.path(g, ln(2, '#FFFFFF', 0.25));
  o += S.path('M1900 -600 L1900 1680', ln(10, '#6E7686'));
  for (let i = 0; i < 6; i++) o += S.rect(1960 + hash(i * 3.1) * 900, 100 + hash(i * 5.3) * 700, 60 + hash(i) * 70, 60 + hash(i) * 70, 6, { fill: '#B4B9C2', stroke: '#6E7686', 'stroke-width': 4 });
  // floating half-built island: grey block outline
  o += S.rect(2050, 540, 360, 80, 10, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 6, 'stroke-dasharray': '18 12' }) + TF('island_07 (TODO)', 2230, 520, 34, '#FFFFFF');
  // barrier + sign
  let bar = '';
  for (let i = 0; i < 6; i++) bar += S.path(`M${2520 + i * 60} 760 L${2560 + i * 60} 760 L${2520 + i * 60} 820 L${2480 + i * 60} 820 Z`, { fill: i % 2 ? '#FFFFFF' : '#FF7A1A' });
  o += S.rect(2470, 760, 400, 60, 6, { fill: 'none', stroke: '#151515', 'stroke-width': 6 }) + bar + S.rect(2490, 820, 20, 120, 4, ol('#5A6070', 4)) + S.rect(2830, 820, 20, 120, 4, ol('#5A6070', 4));
  o += S.g(S.rect(-200, -120, 400, 200, 14, ol('#FFD21F', 7)) + T('THE END', 0, -30, 64, '#151515') + TF('(coming soon)', 0, 40, 38, '#151515') + S.rect(-10, 80, 20, 180, 4, ol('#8A5530', 5)), 'translate(2700 520) rotate(4)');
  return o;
}
function shotNoEnding(t) {
  // pan right through Bubble Island... the map simply ends
  const tNo = W(8, 'ending');
  const cam = camKeys(t, [[tEnd, camAt(1300, 520, 1.1)], [tNo, camAt(2350, 560, 1.15)], [tPop, camAt(2420, 560, 1.2)]]);
  let w = SETS.bubbleIsland(t, { hud: false }) + unfinished(t);
  let o = view(cam, w, 1);
  o += K.bang('???', 1500, 260, seg(t, tNo + 0.2, tNo + 0.35), 110, 8, '#FFFFFF');
  return o;
}
function cursor(x, y, s, press = 0) {
  const o = S.path('M0 0 L0 120 L30 92 L52 140 L74 130 L52 84 L92 84 Z', ol('#FFFFFF', 7));
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s * (1 - 0.15 * press))})`);
}
function shotNoPop(t) {
  // the cursor clicks a bubble on "POP" — it squishes... and BOINGs back. pop(): not implemented
  const tP = W(8, 'POP');
  const b = SETS.bubbleIsland.ISLANDS[1];
  const cam = camKeys(t, [[tPop, camAt(b.x, b.y, 1.8)], [tP, camAt(b.x, b.y, 2.0)], [tNews, camAt(b.x, b.y + 10, 2.05)]]);
  const press = bump(t, tP - 0.08, tP + 0.15);
  const wob = t > tP ? Math.exp(-(t - tP) * 4) * Math.sin((t - tP) * 30) : 0;
  const sqx = 1 + 0.18 * press + 0.12 * wob, sqy = 1 - 0.18 * press - 0.12 * wob;
  const game = S.g(SETS.bubbleIsland(t, { hud: false }), `translate(${b.x} ${b.y}) scale(${f(sqx)} ${f(sqy)}) translate(${-b.x} ${-b.y})`);
  const cx = lerp(1900, b.x + 70, ease.inOut(seg(t, tPop, tP - 0.1))), cy = lerp(800, b.y + 40, ease.inOut(seg(t, tPop, tP - 0.1)));
  let o = view(cam, game + cursor(cx, cy, 1.0, press), 1);
  o += K.bang('BOING!', 1400, 300, seg(t, tP + 0.05, tP + 0.2), 140, -8, '#FFFFFF');
  const kc = seg(t, tP + 0.4, tP + 0.6);
  if (kc > 0) o += S.g(S.rect(-300, -50, 600, 100, 14, { fill: '#10131C', opacity: 0.9, stroke: '#FF5A6E', 'stroke-width': 5 }) + T('pop(): not implemented', 0, 16, 40, '#FF8A9A'), `translate(620 800) scale(${f(pop(kc))})`);
  return o;
}
// ---- the news
const NEWS_TICK = 'ROBLOX TO SHUT DOWN FOREVER IN 24 HOURS  •  SCHOOLS CLOSED  •  PARENTS CONFUSED  •  KID FAINTS (TWICE)  •  DOG SAYS "OOF"';
function studio(t, cam, chars, opts = {}) {
  const Ls = SETS.newsStudio.layers(t, { timer: opts.timer ?? '24:00:00', screen: opts.screen });
  return view(cam, Ls.mid + chars + Ls.fg, 1) + SETS.newsStudio.ticker(t, NEWS_TICK, 880);
}
function brenda(t, pose = {}, act = {}) {
  return actor('anchor', t, { x: 760, y: 985, s: 0.62, ...pose }, act);
}
function breakingWipe(t, t0) {
  const u = seg(t, t0, t0 + 0.55);
  if (u <= 0 || u >= 1) return '';
  const x = lerp(-2400, 2400, ease.inOut(u));
  let o = S.path(`M${f(x - 300)} -100 L${f(x + 2100)} -100 L${f(x + 1700)} 1180 L${f(x - 700)} 1180 Z`, { fill: '#D7263D' });
  o += S.path(`M${f(x + 2100)} -100 L${f(x + 2250)} -100 L${f(x + 1850)} 1180 L${f(x + 1700)} 1180 Z`, { fill: '#FFFFFF' });
  o += T('BREAKING NEWS', x + 700, 590, 170, '#FFFFFF', OUT(14));
  return o;
}
function shotBreaking(t) {
  // red BREAKING NEWS wipe → Brenda; push to the wall timer on "Final Twenty-Four Hours!"
  const tFi = W(9, 'Final'), tW = W(9, 'world');
  const cam = t < tFi - 0.05 ? camKeys(t, [[tNews + 0.3, camAt(960, 540, 1.0)], [tW, camAt(860, 520, 1.25)], [tFi, camAt(860, 500, 1.35)]]) : camKeys(t, [[tFi - 0.05, camAt(1460, 360, 1.5)], [tSchool, camAt(1460, 350, 2.0)]]);
  const c2 = shakeCam(cam, t, tFi, 0.3, 10);
  const b = brenda(t, { face: t > tFi ? 'shocked' : 'talkHappy', armL: t > tW ? 120 : 20, armR: t > tW ? 120 : 20 }, { energy: 1.6, arms: t < tW });
  let o = studio(t, c2, b);
  if (t > tFi) o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FF2E4E', opacity: f(0.12 * (0.5 + 0.5 * Math.sin(t * 10))) });
  o += breakingWipe(t, tNews - 0.15);
  return o;
}
function shotSchool(t) {
  const tCl = W(10, 'closed');
  const cam = camKeys(t, [[tSchool, camAt(960, 500, 1.0)], [tParents, camAt(960, 480, 1.08)]]);
  let w = school(t, seg(t, tCl, tCl + 0.15));
  // kids sprinting out, cheering
  for (let i = 0; i < 3; i++) {
    const k = t - tSchool - 0.2 - i * 0.25;
    if (k < 0) continue;
    const x = 960 + (i % 2 ? 1 : -1) * k * 700;
    w += K.draw.kid(i + 3, { x, y: 740 + i * 18, s: 0.36, view: 'side', flip: i % 2 === 1, ...A.run(t * 14 + i), armL: 160, armR: 150, face: 'joy', shade: false });
  }
  return footage(view(cam, w, 1), t, 'SCHOOLS CLOSED', 'all of them');
}
function shotConfused(t) {
  const cam = camKeys(t, [[tParents, camAt(900, 560, 1.15)], [tFaint, camAt(1020, 560, 1.25)]]);
  let w = S.rect(-800, -600, 3520, 2280, 0, { fill: '#F5CB86' }) + S.rect(-800, -600, 3520, 2280, 0, { fill: 'url(#wallStripes)', opacity: 0.6 }) + S.rect(-800, 860, 3520, 600, 0, { fill: '#B87A44' });
  const ctrl = S.g(S.rect(-80, -42, 160, 84, 40, ol('#5A6478', 6)) + S.circle(-42, 0, 14, { fill: '#151515' }) + S.circle(46, -10, 9, { fill: '#FF5A5A' }), 'rotate(180)');
  w += K.draw.adult(2, { x: 700, y: 1000, s: 0.6, turn: 0.4, armR: 70, armL: 12, face: { name: 'confused' }, headRot: 8 * Math.sin(t * 3), props: [{ svg: S.g(ctrl, `translate(${A.hand(70, 1)[0] + 30} ${A.hand(70, 1)[1]}) scale(1.4)`), layer: 'front' }] });
  w += K.draw.adult(5, { x: 1240, y: 1000, s: 0.6, turn: -0.4, armL: 150, armR: 20, face: { name: 'confused' }, headRot: -8 * Math.sin(t * 3 + 1), props: [{ svg: S.g(K.phone(0, 0, 0.35, 0, S.rect(-150, -280, 300, 560, 0, { fill: '#2A3550' })), `translate(${A.hand(150, -1)[0]} ${A.hand(150, -1)[1] - 40}) rotate(180)`), layer: 'front' }] });
  w += marks('?', 960, 300, t, seg(t, tParents + 0.3, tParents + 0.5), 3, '#FFFFFF');
  return footage(view(cam, w, 1), t, 'PARENTS CONFUSED', '"is it a phone thing?"');
}
function shotFaint(t) {
  // a kid reads the news on his phone... faints. Gets up, checks again... faints again.
  const tF = W(10, 'fainted'), tTw = W(10, 'Twice');
  const cam = camKeys(t, [[tFaint, camAt(900, 590, 1.12)], [tObby, camAt(880, 600, 1.2)]]);
  const f1 = ease.in(seg(t, tF - 0.05, tF + 0.25)), up = ease.out(seg(t, tF + 0.45, tTw - 0.2)), f2 = ease.in(seg(t, tTw - 0.05, tTw + 0.22));
  const ang = 90 * (t < tTw - 0.05 ? f1 * (1 - up) : f2);
  const ph = [A.hand(60, 1)[0] + 30, A.hand(60, 1)[1] - 40];
  let w = S.rect(-800, -600, 3520, 2280, 0, { fill: '#9FD8FF' }) + S.rect(-800, 560, 3520, 700, 0, { fill: '#7ED36A' }) + S.rect(-800, 680, 3520, 600, 0, { fill: '#C9CED8' }) + S.path('M-800 680 L2720 680', ln(6, '#9AA0AA'));
  for (let i = 0; i < 4; i++) w += S.rect(-100 + i * 600, 230, 380, 340, 8, ol(['#FFB4C8', '#FFE08A', '#BFF0FF', '#C9F7A8'][i], 6)) + S.rect(-20 + i * 600, 300, 100, 90, 6, ol('#BFF0FF', 5)) + S.path(`M${-140 + i * 600} 240 L${90 + i * 600} 110 L${320 + i * 600} 240 Z`, ol('#E8506E', 6));
  const kid = K.draw.kid(7, { x: 0, y: 0, s: 0.6, armR: 60, armL: 14, face: ang > 30 ? { name: 'oof' } : { name: 'shocked' }, props: [{ svg: S.g(K.phone(0, 0, 0.3, 0, S.rect(-150, -280, 300, 560, 0, { fill: '#5A6478' })), `translate(${ph[0]} ${ph[1]})`), layer: 'front' }] });
  w += S.g(kid, `translate(960 760) rotate(${f(-ang)})`);
  let o = view(cam, w, 1);
  for (const ti of [tF + 0.25, tTw + 0.22]) o += K.bang('THUD', 1250, 560, seg(t, ti, ti + 0.1) * (1 - seg(t, ti + 0.4, ti + 0.55)), 90, 6, '#FFFFFF');
  o += sticker2('x2', 1560, 320, seg(t, tTw + 0.2, tTw + 0.4), t);
  return footage(o, t, 'KID FAINTS', 'twice');
}
function sticker2(txt, x, y, k, t) {
  if (k <= 0) return '';
  return S.g(S.circle(0, 0, 110, ol('#FF5A6E', 10)) + T(txt, 0, 40, 120, '#FFFFFF', OUT(10)), `translate(${f(x)} ${f(y)}) rotate(${f(-10 + 4 * Math.sin(t * 6))}) scale(${f(pop(k))})`);
}
function shotObby(t) {
  // 10,000 players, one obby: platforms packed with avatars, people falling into the lava (oof)
  const tSa = W(11, 'same');
  const cam = camKeys(t, [[tObby, camAt(640, 440, 1.3)], [tDog, camAt(1300, 440, 1.36)]], ease.linear);
  let w = S.rect(-800, -600, 3520, 2280, 0, { fill: 'url(#s03obbySky)' }) + S.rect(-800, 640, 3520, 900, 0, { fill: 'url(#s03lava)' });
  for (let i = 0; i < 9; i++) w += S.circle(-200 + i * 300 + Math.sin(t * 2 + i) * 20, 660 + Math.sin(t * 3 + i) * 10, 30, { fill: '#FFD21F', opacity: 0.5 });
  const plats = [[60, 520, 420], [580, 460, 300], [980, 400, 300], [1380, 460, 320], [1800, 400, 360], [2220, 470, 300]];
  const cols = ['#FF5A5A', '#34C3FF', '#FFD21F', '#3BD16F', '#B06BFF', '#FF8A3D'];
  plats.forEach(([x, y, ww], i) => { w += S.rect(x, y, ww, 50, 12, ol(cols[i], 6)) + S.rect(x + 14, y + 6, ww - 28, 10, 5, { fill: '#FFFFFF', opacity: 0.4 }); });
  const who = ['guest', 'npc', 'dex', 'juno'];
  let n = 0;
  plats.forEach(([x, y, ww], i) => {
    const m = Math.floor(ww / 40);
    for (let j = 0; j < m && n < 60; j++, n++) {
      const ax = x + 22 + j * 40 + Math.sin(t * 3 + j + i) * 4;
      const hop = Math.max(0, Math.sin(t * 7 + j * 1.7 + i)) * 20;
      w += SETS.avatar(ax, y - hop, 0.7, t + j, { who: who[(i + j) % 4], pose: hop > 10 ? 'jump' : 'stand' });
    }
  });
  // fallers
  for (let i = 0; i < 6; i++) {
    const ph = (t * 0.7 + i / 6) % 1;
    const x = 330 + i * 360, y = 440 + ph * 260;
    w += SETS.avatar(x, y, 0.75, t + i, { who: who[i % 4], pose: 'fall' });
    if (ph > 0.75) w += K.F.markText('oof', x + 40, 640, 52, -8, '#FFFFFF');
  }
  let o = view(cam, w, 1);
  const cnt = Math.round(lerp(10, 10000, ease.out(seg(t, tObby + 0.05, W(11, 'players')))));
  o += S.g(S.rect(0, 0, 520, 140, 26, { fill: '#10162A', opacity: 0.85, stroke: '#3BD16F', 'stroke-width': 5 }) + TF('PLAYERS', 30, 48, 30, '#3BD16F', { 'text-anchor': 'start' }) + T(cnt.toLocaleString('en-US'), 30, 120, 70, '#FFFFFF', { 'text-anchor': 'start' }) + TF('/ 50 max', 490, 120, 30, '#FF8A9A', { 'text-anchor': 'end' }), 'translate(1340 150)');
  o += K.bang('SAME OBBY!', 600, 330, seg(t, tSa, tSa + 0.15), 90, -6, '#FFD21F');
  return footage(o, t, '10,000 PLAYERS · ONE OBBY');
}
function shotDog(t) {
  // a dog in a headset at a gaming PC: "OOF!"
  const tOof = W(11, 'oof');
  const cam = camKeys(t, [[tDog, camAt(1000, 540, 1.1)], [tOof, camAt(1060, 470, 1.35)], [tExp, camAt(1060, 470, 1.42)]]);
  let w = S.rect(-800, -600, 3520, 2280, 0, { fill: '#5B6BE0' }) + S.rect(-800, -600, 3520, 2280, 0, { fill: 'url(#wallStripes)', opacity: 0.4 }) + S.rect(-800, 860, 3520, 600, 0, { fill: '#3A3F7A' });
  w += S.rect(200, 700, 1100, 40, 10, ol('#2C303C', 6)) + S.path('M260 740 L260 1000 M1240 740 L1240 1000', ln(16, '#2C303C'));
  const mk = bump(t, tOof - 0.05, tOof + 0.45);
  const scrn = (ww, hh) => gameBg(ww, hh, t, 2) + SETS.avatar(0, hh * 0.36, 1.6, t, { who: 'guest', pose: t > tOof ? 'fall' : 'stand' });
  w += monitor(640, 420, 0.9, S.g(scrn(600, 340), 'translate(0 -10)'));
  w += S.rect(380, 660, 360, 40, 8, ol('#E9EDF3', 5));
  w += dog(1180, 860, 1.05, t, { mouth: mk, tilt: 10 * mk - 4 });
  let o = view(cam, w, 1);
  const kb = seg(t, tOof, tOof + 0.12) * (1 - seg(t, tOof + 0.8, tOof + 1.0));
  if (kb > 0) o += S.g(S.rect(-200, -100, 400, 170, 50, ol('#FFFFFF', 8)) + S.path('M-60 60 L-120 140 L0 66 Z', ol('#FFFFFF', 8)) + S.rect(-70, 50, 80, 24, 0, { fill: '#FFFFFF' }) + T('OOF!', 0, 20, 110, '#151515'), `translate(1500 260) rotate(6) scale(${f(pop(kb))})`);
  return footage(o, t, 'DOG LEARNS TO SAY "OOF"');
}
function expertsScreen(t) {
  return (w, h) => {
    let o = S.rect(-w / 2, -h / 2, w, h, 0, { fill: '#2A3A6A' });
    o += SETS.frameIn(whiteboard(), w, h);
    o += S.rect(-w / 2, h / 2 - 60, w, 60, 0, { fill: '#D7263D' }) + T('EXPERTS: "CAN\'T BE STOPPED"', 0, h / 2 - 18, 34, '#FFFFFF');
    return o;
  };
}
function shotExperts(t) {
  // Brenda, serious; the wall screen: the experts' verdict
  const tSt = W(12, 'stopped');
  const cam = camKeys(t, [[tExp, camAt(1060, 470, 1.15)], [tSt, camAt(1100, 460, 1.3)], [tPlay, camAt(1110, 460, 1.32)]]);
  const b = brenda(t, { face: 'determined', turn: 0.2 }, { energy: 0.8 });
  let o = studio(t, cam, b, { screen: expertsScreen(t) });
  o += S.g(S.rect(-170, -46, 340, 92, 16, ol('#E8243C', 7)) + T('NOPE', 0, 28, 74, '#FFFFFF'), `translate(1500 650) rotate(-8) scale(${f(pop(seg(t, tSt, tSt + 0.2)))})`).repeat(t > tSt ? 1 : 0);
  return o;
}
function shotExpertsPlay(t) {
  // the experts at their whiteboard... drop the clipboards and run off to play
  const tPl = W(12, 'play');
  const cam = camKeys(t, [[tPlay, camAt(960, 520, 1.1)], [tBye, camAt(960, 520, 1.18)]]);
  const run = seg(t, tPl - 0.15, tPl + 1.2);
  let w = whiteboard();
  const clip = S.g(S.rect(-60, -80, 120, 160, 8, ol('#C98A52', 5)) + S.rect(-48, -64, 96, 132, 4, { fill: '#FFFFFF' }) + S.path('M-34 -40 L34 -40 M-34 -14 L34 -14 M-34 12 L20 12', ln(5, '#9AA0AA')), '');
  for (let i = 0; i < 2; i++) {
    const sd = i ? 1 : -1;
    const x0 = 960 + sd * 420;
    if (run <= 0) {
      w += K.draw.adult(10 + i * 3, { x: x0, y: 1000, s: 0.6, turn: -sd * 0.4, armL: 40, armR: 40, face: 'determined', props: [{ svg: S.g(clip, `translate(${A.hand(40, -sd)[0]} ${A.hand(40, -sd)[1] - 60})`), layer: 'front' }] });
    } else {
      const x = x0 + sd * ease.in(run) * 1400;
      w += K.draw.adult(10 + i * 3, { x, y: 1000, s: 0.6, view: 'side', flip: sd > 0, ...A.run(t * 16 + i * 2), face: 'joy', lean: 10 });
      // clipboard flying
      const ck = seg(t, tPl - 0.15, tPl + 0.6);
      if (ck < 1) w += S.g(clip, `translate(${f(x0 + sd * 120 - sd * ck * 200)} ${f(560 - ck * 300 + ck * ck * 700)}) rotate(${f(ck * 400 * sd)}) scale(0.6)`);
    }
  }
  for (let i = 0; i < 7 && run > 0; i++) { const k = (t - tPl + i * 0.1); w += S.g(S.rect(-40, -50, 80, 100, 4, ol('#FFFFFF', 4)), `translate(${f(960 + Math.sin(k * 3 + i) * 500)} ${f(200 + k * 260)}) rotate(${f(k * 200 + i * 40)})`); }
  return footage(view(cam, w, 1), t, 'EXPERTS: "GOING TO GO PLAY NOW"');
}
function shotBye(t) {
  // Brenda: "Goodbye!" — papers in the air, she sprints off the set
  const tG = W(12, 'Goodbye');
  const cam = camKeys(t, [[tBye, camAt(960, 540, 1.0)], [tCount, camAt(1000, 520, 1.05)]]);
  const run = seg(t, tG + 0.05, tG + 0.9);
  let b;
  if (run <= 0) b = brenda(t, { armL: 160, armR: 20, face: 'joy' }, { arms: false });
  else b = brenda(t, { x: 760 + ease.in(run) * 1500, view: 'side', flip: true, ...A.run(t * 16), lean: 12, face: 'joy' }, { arms: false });
  let o = studio(t, cam, b);
  for (let i = 0; i < 6; i++) { const k = t - tG - 0.05; if (k > 0) o += S.g(S.rect(-50, -64, 100, 128, 4, ol('#FFFFFF', 4)) + S.path('M-30 -30 L30 -30 M-30 0 L30 0', ln(4, '#9AA0AA')), `translate(${f(630 + i * 30 + Math.sin(k * 4 + i) * 160)} ${f(740 - Math.sin(Math.min(k, 1.2) * 2.6) * (300 + i * 40) + k * 80)}) rotate(${f(k * 300 + i * 60)}) scale(0.7)`); }
  o += K.bang('BYE!', 1500, 520, seg(t, tG + 0.4, tG + 0.55), 120, 8, '#FF6FB0');
  return o;
}
// the countdown pill as a free-flying overlay (x, y, scale)
function flyingTimer(sec, x, y, s, t, glitch = 0) {
  return S.g(K.timerHUD(sec, { y: 0, s, t, glitch }), `translate(${f(x - 960)} ${f(y)})`);
}
const secAt = (t) => 86399 - Math.max(0, t - tStart);
function shotCount(t) {
  // the empty desk; the wall timer flips 24:00:00 → 23:59:59 on "started" — then the pill flies up into the HUD slot
  const cam = camKeys(t, [[tCount, camAt(960, 540, 1.0)], [tStart, camAt(1460, 360, 1.7)], [tWorld, camAt(1460, 350, 1.85)]]);
  const txt = t < tStart ? '24:00:00' : K.clock(secAt(t));
  let o = studio(t, cam, '', { timer: txt });
  // spinning abandoned chair + falling paper
  if (t > tStart) o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FF2E4E', opacity: f(0.12 * bump(t, tStart, tStart + 0.4)) });
  const fly = seg(t, tStart + 0.25, tWorld);
  if (fly > 0) {
    const u = ease.inOut(fly);
    o += flyingTimer(secAt(t), 960, lerp(560, 64, u), lerp(2.3, 1, u), t, 0.5 * (1 - u));
  }
  return o;
}
function shotCrazy(t) {
  // the whole world goes a little bit crazy: the globe spins and wobbles, cities pop with !, OOF, WOOO
  const tCr = W(13, 'crazy'), tWo = W(13, 'world');
  const cam = shakeCam(camKeys(t, [[tWorld, camAt(960, 520, 1.3)], [tWo, camAt(960, 560, 1.02)], [END, camAt(960, 570, 0.93)]]), t, tCr, 1.2, 10);
  const spin = 0.05 + 2.2 * ease.in(seg(t, W(13, 'went'), tCr + 0.5));
  const wob = Math.sin(t * 9) * 4 * seg(t, W(13, 'went'), tCr);
  // earth() takes spin as a rate: emulate the acceleration by feeding a warped time
  const tw = tWorld + (t - tWorld) * (1 + spin * 8);
  let w = S.g(SETS.earth(tw, { spin: 0.05 }), `rotate(${f(wob)} 960 560)`);
  const words = ['!', 'OOF', 'WOOO', '!!', 'GG', '?!', 'NOOO', 'YAY'];
  for (let i = 0; i < 12; i++) {
    const t0 = tWorld + 0.3 + i * 0.28;
    const k = seg(t, t0, t0 + 0.6);
    if (k <= 0 || k >= 1) continue;
    const a = hash(i * 4.7) * Math.PI * 2, r = 380 + 160 * ease.out(k);
    w += K.F.markText(words[i % words.length], 960 + Math.cos(a) * r, 560 + Math.sin(a) * r * 0.85, 60 + 30 * hash(i), (hash(i * 2) - 0.5) * 40, ['#FFD21F', '#FFFFFF', '#FF6FB0', '#7CF7FF'][i % 4]);
  }
  let o = view(cam, w, 1);
  o += K.bang('CRAZY!', 1480, 820, seg(t, tCr, tCr + 0.15), 120, -8, '#FF6FB0');
  // HUD lands with a flash
  o += C.whiteFlash(0.4 * (1 - seg(t, tHUD, tHUD + 0.2)));
  return o;
}

// ---------------------------------------------------------------- router
const SHOTS = [
  [tTue, shotTue], [tClock, shotClock], [tQuad, shotQuad], [tEarth, shotEarth], [tFirst, shotFirst], [tM[0], shotMontage], [tGrid, shotGrid],
  [tThanks, shotThanks], [tFrozen, shotFrozen], [tNooo, shotNooo], [tDex, shotForever], [tStreak, shotStreak], [tPip, shotPipSad],
  [tDadA, shotDadFine], [tDadB, shotDadFish], [tJuno, shotJunoPanic], [tEnd, shotNoEnding], [tPop, shotNoPop], [tNews, shotBreaking],
  [tSchool, shotSchool], [tParents, shotConfused], [tFaint, shotFaint], [tObby, shotObby], [tDog, shotDog], [tExp, shotExperts],
  [tPlay, shotExpertsPlay], [tBye, shotBye], [tCount, shotCount], [tWorld, shotCrazy],
];
function scene(t) {
  let fn = SHOTS[0][1];
  for (const [t0, s] of SHOTS) if (t >= t0) fn = s;
  let o = fn(t);
  o += E2.cutFlash(t, CUTS, 0.3, 0.06);
  return o;
}
function look(t) {
  if (t >= tEarth && t < tFirst) return { grade: null, vignette: 0.6 };
  if (t >= tNooo && t < tDex) return { grade: null, vignette: 0.6 };
  if (t >= tWorld) return { grade: null, vignette: 0.6 };
  if (t >= tM[0] && t < tFrozen) return { grade: 'cool', vignette: 0.7 };
  if (t >= tNews) return { grade: 'cool', vignette: 0.8 };
  if (t >= tFrozen && t < tNooo) return { grade: 'cool', vignette: 1 };
  return { grade: 'warm' };
}
function timer(t) {
  if (t < tHUD) return null;
  return { sec: secAt(t), glitch: 0.8 * (1 - seg(t, tHUD, tHUD + 0.5)) };
}

module.exports = { scene, look, timer, DEFS };
