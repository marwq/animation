// SC 12 · ПОСЛЕ — the morning after: Brenda's sunny "Great AFK" news, Dad's Golden Fish, Dex outside in a helmet,
// Bubble Island 3 → 3,000,000 and the bubbles finally pop, Pip's two-star real elevator, Mom the raisin,
// Grandpa back on night shift with a bow on his mop, the porch at sunset (phones face-down), and the final gag:
// Buffer hops onto the router, every screen freezes, Dad buffers mid-sentence. "...Here we go again."
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const C = K.C;
const A = require('./acting');
const ST = require('./sets');
const FM = require('./farm');
const LAG = require('../rig/lag');
const { mop } = require('../rig/cast');
const E = require('./s12_env');
const { ob } = E;

const S12 = K.V.scene('SC 12').start, S13 = K.V.scene('SC 13').start;
const l = (i) => L('12.' + i);
const l0 = l(0), l1 = l(1), l2 = l(2), l3 = l(3), l4 = l(4), l5 = l(5), l6 = l(6), l7 = l(7), l8 = l(8);
const l9 = l(9), l10 = l(10), l11 = l(11), l12 = l(12), l13 = l(13);

// ---------------------------------------------------------------- beats (all from the voice)
const tMorning = l0.word('morning').t0, tStaying = l0.word('staying').t0;
const tEarth = l0.word('Scientists').t0 - 0.1;        // B: the globe + THE GREAT AFK stamp
const tAFK = l0.word('AFK').t0;
const tLive = l0.word('first').t0 - 0.2;              // C: LIVE panels from around the world
const tBrenda = l0.word('same').t0 - 0.35;            // D: Brenda — "at the same time" / weird / kind of nice
const tWeird = l1.word('weird').t0, tNice = l1.word('And').t0;
const tFish = l2.a - 0.33;                            // F: the Golden Fish leaps out of the (game) water
const tDadCry = l2.word('worth').t0 - 0.05;           // G: Dad sobs happily, hugging the laptop
const tDex = l3.a - 0.1;                              // H: Dex steps out in a helmet + knee pads
const tSteps = l3.word('Still').t0 - 0.12;            // I: down the stoop ... looks up ... "amazing"
const tBut = l3.word('But').t0, tAmazing = l3.word('amazing').t0;
const tAttic = l4.a - 0.15;                           // K: attic, push into the laptop
const tCount = l4.word('Three').t0 - 0.1;             // L: the visits counter 3 -> 3,000,000
const tBecame = l4.word('became').t0, tMillion = l4.word('MILLION').t0;
const tPublish = l5.a - 0.1;                          // M: Juno hits publish
const tFinished = l5.word('finished').t0;
const tPop = l5.word('Now').t0 - 0.1;                 // N: the bubbles pop one by one (+1.5 s beat)
const tPopW = l5.word('pop').t0;
const tLift = l6.a - 0.15;                            // O: Pip in a real elevator
const tReview = l6.word('He').t0 - 0.1;               // P: two stars / too slow / ...Ding
const tTwo = l6.word('two').t0, tStars = l6.word('stars').t0, tToo = l6.word('Too').t0, tDing = l7.a;
const tBath = l8.a - 0.1;                             // R: Mom out of her 6-hour bath
const tWrinkly = l8.word('She').t0 - 0.1;             // S: wrinkly as a raisin
const tWrW = l8.word('wrinkly').t0;
const tFarm = l9.a - 0.15;                            // T: Grandpa back at the Server Farm
const tBack = l9.word('back').t0, tNight = l9.word('Night').t0, tBest = l9.word('Best').t0;
const tPorch = l10.a - 0.15;                          // V: porch at sunset, slow push-in
const tPhones = l10.word('log').t0 - 0.12;            // W: phones face-down, one per word
const tHiShot = l10.word('Just').t0 - 0.1;            // X: everyone says hi to the sun
const tHi = l10.word('hi').t0;
const tCouch = l11.a - 0.2;                           // Y: "His name is Buffer."
const tHop = l11.word('Buffer').t0 + 0.12, tLand = tHop + 0.42, tDown = tLand + 0.3;
const tFreeze = l12.a + 0.4;                          // AA: screens freeze one by one, Dad stutters
const tWi = [l12.word('Wi').t0, l12.word('Wi', 1).t0, l12.word('Wi-Fi').t0];
const tZoom = tWi[0] - 0.1;                           // AB: Wi... Wi... Wi-Fi... smash zooms
const tJuno = l13.a - 0.1;                            // AC: Juno to camera: "...Here we go again."

// ---------------------------------------------------------------- helpers
const at = (px, py, zoom) => ({ zoom, x: px - 960, y: py - 540 });
const W = (cam, svg) => view(cam, svg, 1);
const flashCut = (t, tc, k = 0.45) => C.whiteFlash(k * bump(t, tc - 0.04, tc + 0.1));
const shakeCam = (cam, t, t0, dur = 0.35, amp = 14) => { const s = K.shake(t, t0, dur, amp); return { ...cam, sx: (cam.sx || 0) + s.sx, sy: (cam.sy || 0) + s.sy }; };
const outT = (txt, x, y, size, fill, sw = 10, extra = {}) => T(txt, x, y, size, fill, { stroke: '#151515', 'stroke-width': sw, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
// whip-pan streaks (screen space), k 0..1..0
function whip(k, dir = 1, col = '#FFFFFF') {
  if (k <= 0.02) return '';
  let o = '';
  for (let i = 0; i < 16; i++) {
    const y = hash(i * 3.1) * 1080, len = 300 + hash(i * 7.7) * 700, x = hash(i * 5.3) * 1920 - len / 2;
    o += S.rect(x, y, len, 6 + hash(i) * 14, 6, { fill: col, opacity: f(0.55 * k) });
  }
  return o + S.rect(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: f(0.18 * k) });
}
function dingSparkle(x, y, k, s = 1) {
  if (k <= 0) return '';
  return K.F.sparkle(x, y, 40 * s * k) + K.F.sparkle(x + 60 * s, y - 40 * s, 22 * s * k) + K.F.sparkle(x - 54 * s, y - 24 * s, 16 * s * k);
}

// ================================================================= A. sunny news studio
function stayScreen(t) {
  return (w, h) => {
    const k = ob(seg(t, tStaying - 0.05, tStaying + 0.3));
    let o = S.rect(-w / 2, -h / 2, w, h, 0, { fill: '#7FD0FF' }) + S.rect(-w / 2, 90, w, 90, 0, { fill: '#5DBB63' }) + S.circle(-210, -90, 60, ol('#FFE14D', 6));
    if (k <= 0) return o + outT('GOOD MORNING!', 0, 30, 70, '#FFFFFF', 10);
    o += K.rays(0, -10, 14, 500, '#FFFFFF', 0.25, t * 30);
    o += S.g(outT('ROBLOX', 0, -40, 66, '#FFFFFF', 10) + outT('IS STAYING!', 0, 40, 74, '#FFE14D', 10), `scale(${f(k)})`);
    o += S.g(S.circle(0, 0, 44, ol('#3BD16F', 7)) + S.path('M-20 2 L-6 18 L22 -16', ln(10, '#FFFFFF')), `translate(230 100) scale(${f(k)})`);
    return o;
  };
}
function shotNews(t) {
  const cam = shakeCam(camKeys(t, [[S12, at(960, -60, 1.3)], [tMorning + 0.35, at(900, 560, 1.0)], [tStaying - 0.1, at(880, 560, 1.05)], [tStaying + 0.08, at(840, 510, 1.42)], [tEarth, at(830, 505, 1.5)]]), t, tStaying, 0.3, 12);
  const Ls = ST.newsStudio.layers(t, { sunny: true, screen: stayScreen(t) });
  const hi = t < l0.word('Roblox').t0;
  const yay = ob(seg(t, tStaying - 0.1, tStaying + 0.2));
  let pose = { x: 760, y: 985, s: 0.62 };
  if (hi) Object.assign(pose, { armR: 135 + 22 * Math.sin(t * 13), armL: 14, headRot: 6 * Math.sin(t * 6.5) });
  else if (t < tStaying + 0.8) Object.assign(pose, { armL: lerp(20, 160, yay), armR: lerp(20, 160, yay), lift: 34 * bump(t, tStaying - 0.1, tStaying + 0.35), face: { name: 'excited' } });
  const act = hi || t < tStaying + 0.8 ? { arms: false, energy: 1.2 } : { energy: 1.4 };
  let o = W(cam, Ls.mid + actor('anchor', t, pose, act) + Ls.fg);
  if (t > tStaying - 0.05) o += K.confetti(t, tStaying - 0.05, 56, 12);
  o += K.bang('STAYING!', 400, 230, seg(t, tStaying, tStaying + 0.1) * (1 - seg(t, tEarth - 0.4, tEarth - 0.1)), 96, 7, '#3BD16F');
  const tk = ease.out(seg(t, tMorning, tMorning + 0.45));
  if (tk > 0) o += S.g(ST.newsStudio.ticker(t, 'ROBLOX IS STAYING  •  THE GREAT AFK  •  EVERYONE WENT OUTSIDE  •  WEIRD BUT NICE', 846, true), `translate(${f(-1960 * (1 - tk))} 0)`);
  return o;
}

// ================================================================= B. the globe: THE GREAT AFK
function shotEarth(t) {
  const cam = shakeCam(camKeys(t, [[tEarth, at(960, 560, 0.86)], [tAFK - 0.1, at(960, 560, 1.02)], [tAFK + 0.06, at(960, 600, 1.22)], [tLive, at(960, 610, 1.28)]]), t, tAFK, 0.4, 18);
  let o = W(cam, ST.earth(t, { spin: 0.3 }));
  // little "zZz" bubbles rising off the continents: the whole planet went AFK
  if (t > tAFK) for (let i = 0; i < 6; i++) { const ph = ((t - tAFK) * 0.7 + i / 6) % 1; o += K.F.markText(i % 2 ? 'z' : 'Z', 620 + i * 130 + Math.sin(ph * 6 + i) * 20, 520 - ph * 260, 40 + ph * 30, -10, '#FFFFFF'); }
  const txt = 'SCIENTISTS CALL IT...';
  const n = Math.floor(clamp((t - tEarth - 0.1) * 26, 0, txt.length));
  if (n > 0) o += TF(txt.slice(0, n), 960, 140, 64, '#FFFFFF', { stroke: '#151515', 'stroke-width': 10, 'paint-order': 'stroke' });
  o += E.stamp(960, 600, 'THE GREAT AFK', seg(t, tAFK - 0.08, tAFK + 0.12), 128, '#E8243C', -8, '(away from keyboard)');
  if (t > tAFK) o += C.burst(1420, 420, seg(t, tAFK, tAFK + 0.5), '#FFE14D');
  return o + flashCut(t, tEarth, 0.35);
}

// ================================================================= C. LIVE from around the world
function panDowntown(t) {
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s12morn)' }) + S.circle(1500, 220, 110, ol('#FFE14D', 8));
  const b = [[0, 380, 260], [260, 300, 200], [460, 420, 240], [700, 250, 220], [920, 360, 200], [1120, 280, 260], [1380, 400, 200], [1580, 320, 340]];
  for (const [x, top, w] of b) o += S.rect(x, top, w, 900 - top, 6, ol('#9FB8F0', 6)) + S.rect(x + 16, top + 20, w - 32, 860 - top, 0, { fill: 'url(#setsWinDay)' });
  o += S.rect(0, 860, 1920, 220, 0, { fill: '#C9CED8' });
  for (let i = 0; i < 4; i++) { const bx = ((t * 160 + i * 500) % 2300) - 200, by = 200 + i * 40, fl = Math.sin(t * 12 + i) * 18; o += S.path(`M${f(bx - 40)} ${f(by - fl)} Q${f(bx - 20)} ${by - 20} ${f(bx)} ${by} Q${f(bx + 20)} ${by - 20} ${f(bx + 40)} ${f(by - fl)}`, ln(8)); }
  return o + E.crowdUp(80, 1840, 1060, 13, t, 3);
}
function dog(x, y, s, t) {
  const wag = Math.sin(t * 18) * 20;
  let o = S.path(`M70 -70 Q${f(120 + wag)} -140 ${f(110 + wag)} -170`, ln(16)) + S.path(`M70 -70 Q${f(120 + wag)} -140 ${f(110 + wag)} -170`, ln(8, '#E0A060'));
  o += S.rect(-80, -110, 170, 80, 40, ol('#E0A060', 7)) + S.rect(-60, -40, 26, 44, 8, ol('#E0A060', 6)) + S.rect(50, -40, 26, 44, 8, ol('#E0A060', 6));
  o += S.circle(-90, -140, 56, ol('#E0A060', 7)) + S.path('M-130 -180 Q-160 -130 -140 -100 Q-120 -130 -116 -170 Z', ol('#A8683A', 5)) + S.circle(-110, -146, 7, { fill: '#151515' }) + S.ellipse(-140, -124, 12, 9, { fill: '#151515' }) + S.path('M-128 -104 Q-122 -86 -110 -96', ol('#FF7A8A', 4));
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function panPark(t) {
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s12morn)' }) + S.rect(0, 700, 1920, 380, 0, { fill: '#7ED36A' });
  o += K.E.cloud(200 + Math.sin(t * 0.3) * 30, 140, 1.2) + K.E.cloud(1300, 220, 0.9);
  o += S.rect(1480, 330, 50, 400, 8, ol('#8A5A33', 6)) + S.circle(1505, 280, 210, ol('#3FBF5A', 8)) + S.circle(1380, 380, 120, ol('#3FBF5A', 8));
  o += dog(1020, 990, 2.1, t);
  o += K.draw.kid(7, { x: 760, y: 1010, s: 0.78, armL: 70, armR: 120 + Math.sin(t * 8) * 10, turn: 0.4, face: { name: 'joy' }, volume: false });
  o += K.F.sparkle(1180, 520, 40 * (0.6 + 0.4 * Math.sin(t * 6))) + S.path(K.F.heartPath(900, 420, 40), ol('#FF5A7A', 6));
  return o;
}
function panSchool(t) {
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s12morn)' }) + S.rect(0, 760, 1920, 320, 0, { fill: '#8FD86A' });
  o += S.rect(1200, 260, 720, 520, 0, ol('#E8A07A', 8)) + S.rect(1260, 320, 200, 150, 6, ol('#BFF0FF', 6)) + S.rect(1560, 320, 200, 150, 6, ol('#BFF0FF', 6)) + outT('SCHOOL', 1560, 250, 70, '#FFFFFF', 8);
  // a heart-shaped cloud they all point at
  o += S.g(S.path(K.F.heartPath(0, 0, 150), { fill: '#FFFFFF', stroke: '#D2ECFF', 'stroke-width': 14 }), `translate(560 ${f(250 + Math.sin(t * 2) * 10)})`);
  o += K.draw.teacher({ x: 1000, y: 1040, s: 0.82, armR: 165, armL: 20, turn: -0.3, face: { name: 'joy' }, volume: false });
  return o + E.crowdUp(80, 760, 1060, 6, t, 9, ['#FF6B6B', '#FFD166', '#1982C4', '#8AC926']);
}
function panSpace(t) {
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s12space)' });
  for (let i = 0; i < 30; i++) o += S.circle(hash(i * 3.3) * 1920, hash(i * 5.7) * 1080, 3 + hash(i) * 3, { fill: '#FFFFFF', opacity: 0.8 });
  o += S.circle(960, 1700, 900, ol('#3F8FE8', 10)) + S.path('M300 1000 Q500 860 760 940 Q900 880 1100 960 L1100 1080 L300 1080 Z', { fill: '#5DCB6A' });
  o += S.rect(160, 260, 700, 180, 30, ol('#D6DBE4', 8)) + S.rect(-200, 300, 360, 100, 10, ol('#3A5FD8', 6)) + S.rect(860, 300, 360, 100, 10, ol('#3A5FD8', 6)) + S.circle(510, 350, 50, ol('#BFF0FF', 6));
  // the astronaut, floating and waving
  const bob = Math.sin(t * 1.5) * 20, wv = Math.sin(t * 9) * 20;
  let a = S.rect(-70, -40, 140, 170, 50, ol('#FFFFFF', 8)) + S.circle(0, -110, 90, ol('#FFFFFF', 8)) + S.rect(-60, -150, 120, 80, 36, ol('#2A3F82', 6)) + S.path('M-30 -130 Q0 -146 30 -130', ln(8, '#FFFFFF', 0.6));
  a += S.g(S.rect(-24, 0, 48, 130, 22, ol('#FFFFFF', 7)), `translate(60 -10) rotate(${f(-150 + wv)})`) + S.g(S.rect(-24, 0, 48, 120, 22, ol('#FFFFFF', 7)), 'translate(-60 -10) rotate(30)');
  a += S.rect(-60, 120, 50, 110, 22, ol('#FFFFFF', 7)) + S.rect(10, 120, 50, 110, 22, ol('#FFFFFF', 7)) + S.rect(-30, -10, 60, 40, 8, ol('#E8243C', 5));
  o += S.g(a, `translate(1360 ${f(560 + bob)}) rotate(-12)`) + S.path(`M860 380 Q1100 ${f(620 + bob)} 1330 ${f(600 + bob)}`, ln(6, '#FFFFFF', 0.7));
  return o;
}
function shotLive(t) {
  const cam = camKeys(t, [[tLive, at(960, 540, 1.0)], [tBrenda, at(960, 530, 1.06)]]);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#FF8A5A' }) + K.rays(960, 500, 22, 1600, '#FFD38A', 0.35, t * 10);
  const P4 = [
    [500, 288, 'DOWNTOWN', panDowntown, l0.word('first').t0, -3],
    [1420, 288, 'THE PARK', panPark, l0.word('history').t0, 2],
    [500, 708, 'SCHOOL', panSchool, l0.word('whole').t0, 2],
    [1420, 708, 'SPACE STATION', panSpace, l0.word('outside').t0, -2],
  ];
  let w = '';
  for (const [x, y, lab, fn, t0, r] of P4) { const k = seg(t, t0 - 0.12, t0 + 0.2); if (k > 0) w += E.livePanel(x, y, 720, 405, fn(t), lab, k, t, r); }
  o += W(cam, w);
  // centre badge
  const kb = ob(seg(t, tLive, tLive + 0.3));
  if (kb > 0) o += S.g(S.circle(0, 0, 118, ol('#FFE14D', 9)) + outT('THE', 0, -34, 40, '#FFFFFF', 7) + outT('GREAT', 0, 14, 56, '#E8243C', 8) + outT('AFK', 0, 70, 66, '#2A2246', 0), `translate(960 498) rotate(${f(Math.sin(t * 3) * 5)}) scale(${f(kb)})`);
  return o + flashCut(t, tLive, 0.3);
}

// ================================================================= D. Brenda: "weird ... and kind of nice"
function shotBrenda(t) {
  const keys = [[tBrenda, at(800, 600, 1.12)], [l1.a - 0.2, at(790, 560, 1.3)], [tWeird - 0.04, at(780, 540, 1.42)], [tWeird + 0.06, at(765, 500, 2.3)], [tNice - 0.05, at(765, 500, 2.34)], [tNice + 0.5, at(775, 540, 1.75)], [tFish, at(775, 545, 1.68)]];
  const cam = shakeCam(camKeys(t, keys), t, tWeird, 0.25, 10);
  const Ls = ST.newsStudio.layers(t, { sunny: true });
  let pose = { x: 760, y: 985, s: 0.62 }, act = { energy: 1.2 };
  if (t < l1.a - 0.3) { const k = ob(seg(t, l0.word('same').t0 - 0.2, l0.word('same').t0 + 0.2)); Object.assign(pose, { armL: lerp(15, 100, k), armR: lerp(15, 100, k), face: { name: 'happy' } }); act = { arms: false }; }
  else if (t > tWeird - 0.1 && t < tNice) Object.assign(pose, { face: { name: 'confused', fx: [] }, headRot: -8, armR: 30, armL: 12 }), (act = { arms: false, energy: 0.5 });
  else if (t >= tNice) { const k = ease.inOut(seg(t, tNice, tNice + 0.4)); Object.assign(pose, { face: { name: 'happy', fx: ['blush'] }, armL: lerp(12, -18, k), armR: lerp(12, -18, k), headRot: 7 * k + 2 * Math.sin(t * 2) }); act = { arms: false, energy: 0.6 }; }
  let o = W(cam, Ls.mid + actor('anchor', t, pose, act) + Ls.fg);
  if (t > tNice + 0.2) {
    o += S.circle(960, 540, 900, { fill: 'url(#s12warm)', opacity: f(0.5 * seg(t, tNice, tNice + 0.6)) });
    for (let i = 0; i < 6; i++) { const ph = ((t - tNice) * 0.55 + i / 6) % 1; o += S.g(S.path(K.F.heartPath(0, 0, 26), ol('#FF6FB0', 4)), `translate(${f(560 + i * 160 + Math.sin(ph * 6 + i) * 40)} ${f(900 - ph * 700)})`, { opacity: f(Math.sin(ph * Math.PI)) }); }
  }
  if (t > tWeird) o += K.bang('weird...', 1430, 330, seg(t, tWeird, tWeird + 0.1) * (1 - seg(t, tNice - 0.2, tNice)), 90, 8, '#B06BFF');
  o += ST.newsStudio.ticker(t, 'THE GREAT AFK  •  WEIRD  •  BUT KIND OF NICE  •  ROBLOX IS STAYING', 846, true);
  return o + flashCut(t, tBrenda, 0.3);
}

// ================================================================= F/G. Dad and the Golden Fish
function shotFish(t) {
  const k = ease.out(seg(t, tFish + 0.05, tFish + 0.5));
  const cam = shakeCam(camKeys(t, [[tFish, at(960, 540, 1.0)], [tDadCry, at(980, 520, 1.1)]]), t, tFish + 0.3, 0.35, 16);
  let o = W(cam, S.g(E.fishGame(1920, 1080, t, k, { hud: t > tFish + 0.5 ? 'LEVEL 901!' : 'LEVEL 900' }), 'translate(960 540)'));
  o += K.badge(960, 830, 'GOLDEN FISH!', 'CAUGHT AT LAST!', seg(t, tFish + 0.4, tFish + 0.62), t);
  return o + flashCut(t, tFish, 0.4);
}
// the living room composited around the cast: seated (behind the couch front), front (in front of it)
function living(t, cam, o = {}) {
  const Ls = ST.livingRoom.layers(t, { time: o.time || 'evening', routerBlink: o.blink ?? 0.25, wifiDown: o.down, tv: o.tv, tvOff: o.tvOff, lamp: o.lamp });
  return view(cam, Ls.bg, 0.55) + W(cam, Ls.mid + (o.seated || '') + Ls.seat + (o.front || '') + Ls.fg + Ls.light);
}
function shotDadCry(t) {
  const cam = camKeys(t, [[tDadCry, at(960, 610, 1.8)], [tDex, at(960, 600, 2.0)]]);
  const sob = Math.sin(t * 22) * 3;
  const pose = { x: 960, y: 908, s: 0.55, armL: 32, armR: 32, bodyY: 4 + sob, face: { name: 'joy', fx: ['tears', 'blush'] }, headRot: sob };
  const lap = E.dadLaptop(960, 742, 0.55, (w, h) => S.g(E.fishGame(w, h, t, 1, { hud: 'LEVEL 901!' }), `translate(0 0)`) + outT('CAUGHT!', 0, 10, 46, '#FFE14D', 6), { rot: -6 });
  let o = living(t, cam, { time: 'day', seated: actor('dad', t, pose, { arms: false }), front: lap });
  // extra tears flying off
  for (let i = 0; i < 6; i++) { const ph = ((t - tDadCry) * 1.6 + i / 6) % 1, sd = i % 2 ? 1 : -1; o += S.ellipse(960 + sd * (140 + ph * 260), 360 + ph * 120 + ph * ph * 260, 12, 18, { fill: '#7FD8FF', stroke: '#151515', 'stroke-width': 3, opacity: f(1 - ph) }); }
  o += K.bang('SOB!', 1380, 260, seg(t, tDadCry + 0.2, tDadCry + 0.3) * (1 - seg(t, tDex - 0.3, tDex)), 80, 8, '#7FD8FF');
  return o;
}

// ================================================================= H. Dex goes outside (helmet + knee pads)
function realLifeTimer(t, t0, k) {
  if (k <= 0) return '';
  const left = 600 - Math.max(0, t - t0);
  const mm = Math.floor(left / 60), ss = Math.floor(left % 60);
  let o = S.rect(-250, -48, 500, 96, 48, { fill: '#10131C', opacity: 0.85, stroke: '#3BD16F', 'stroke-width': 6 });
  o += TF('REAL LIFE', -60, -12, 22, '#9AF0B4', { 'letter-spacing': 3 }) + T(`${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`, -60, 34, 52, '#FFFFFF');
  o += S.circle(160, 0, 32, ol('#FFD21F', 5)) + S.path(`M160 0 L${f(160 + Math.sin(t * 6) * 20)} ${f(-Math.cos(t * 6) * 20)}`, ln(5)) + S.rect(150, -44, 20, 12, 3, ol('#FFD21F', 3));
  return S.g(o, `translate(960 92) scale(${f(ob(k))})`);
}
function dexPose(t, extra = {}, act = {}) {
  const pose = { ...extra };
  pose.props = [...(extra.props || []), ...E.dexGear(t, pose, act)];
  return pose;
}
function shotDexOut(t) {
  const cam = camKeys(t, [[tDex, at(960, 540, 1.0)], [tSteps, at(960, 520, 1.16)]]);
  const walk = seg(t, tDex + 0.2, tDex + 1.0);
  const y = lerp(640, E.STOOP.y[0], walk), s = lerp(0.42, E.STOOP.s[0], walk);
  const tMin = l3.word('minutes').t0, tDay = l3.word('day').t0;
  const raise = ob(seg(t, tMin - 0.2, tMin + 0.1)) * (1 - seg(t, tDay - 0.3, tDay - 0.1));
  const thumbs = ob(seg(t, tDay - 0.1, tDay + 0.15));
  const wf = walk < 1 ? A.walkFront(t * 12, 1) : {};
  const pose = dexPose(t, { x: 960, y, s, ...wf, armR: thumbs > 0 ? lerp(20, 140, thumbs) : lerp(14, 110, raise), armL: 14, face: thumbs > 0.5 ? { name: 'smug' } : undefined, headRot: 0 }, { arms: false });
  let o = W(cam, E.stoop(t, { doorOpen: seg(t, tDex, tDex + 0.3) }) + actor('dex', t, pose, { arms: false }) + E.stoopFront());
  o += realLifeTimer(t, tMin, seg(t, tMin - 0.1, tMin + 0.2));
  if (thumbs > 0) o += K.bang('PRO TIP: GO OUTSIDE', 1450, 300, thumbs * (1 - seg(t, tSteps - 0.2, tSteps)), 54, 6, '#FFE14D');
  return o + flashCut(t, tDex, 0.35);
}
// I/J: down the stoop, one terrified step at a time ... then he looks up
function shotSteps(t) {
  const T4 = [tSteps + 0.1, tSteps + 0.45, tSteps + 0.8, tSteps + 1.15];   // landing times on levels 1..4
  let lev = 0; for (let i = 0; i < 4; i++) if (t >= T4[i]) lev = i + 1;
  const prev = lev - 1, tl = lev > 0 ? T4[lev - 1] : tSteps;
  const nxt = lev < 4 ? T4[lev] : 1e9;
  const u = lev < 4 ? seg(t, nxt - 0.28, nxt) : 1;                       // the next step: lift a foot, drop
  const yA = E.STOOP.y[lev], yB = lev < 4 ? E.STOOP.y[lev + 1] : yA;
  const sA = E.STOOP.s[lev], sB = lev < 4 ? E.STOOP.s[lev + 1] : sA;
  const y = lerp(yA, yB, ease.in(u)), s = lerp(sA, sB, u);
  const land = bump(t, tl, tl + 0.12) * (lev > 0 ? 1 : 0);
  void prev;
  const shake = Math.sin(t * 46) * 3;
  const down = lev >= 4;
  const look = ease.inOut(seg(t, tBut, tBut + 0.35));
  const smash = t >= tAmazing - 0.04;
  let pose;
  const grip = 70 + lev * 2;
  if (!down) pose = { x: 960, y, s, armL: grip, armR: grip, legR: 16 * Math.sin(u * Math.PI) + shake, kneeR: 40 * Math.sin(u * Math.PI), legL: -shake, bodyY: 10 * land, sy: 1 - 0.05 * land, face: { name: 'scared', eyes: { look: [0, 0.8] } } };
  else pose = { x: 960, y, s, armL: lerp(78, 20, look), armR: lerp(78, 20, look), face: smash ? { name: 'excited' } : { name: 'amazed', eyes: { look: [0, -lerp(0, 0.9, look)] } }, headRot: 0 };
  pose = dexPose(t, pose, { arms: false });
  const dex = actor('dex', t, pose, { arms: false, energy: smash ? 1.2 : 0.4 });
  const headY = y - 560 * s;
  let cam;
  if (smash) cam = shakeCam(camKeys(t, [[tAmazing - 0.04, at(960, headY - 30, 3.0)], [tAttic, at(960, headY - 30, 3.25)]]), t, tAmazing, 0.3, 12);
  else if (!down || t < tBut) cam = at(960, y - 520 * s, 1.6);
  else cam = camKeys(t, [[tBut, at(960, y - 520 * s, 1.6)], [tBut + 0.55, at(960, -330, 1.0)], [tAmazing, at(960, -360, 1.02)]]);
  let w = E.stoop(t, { doorOpen: 1 }) + dex + E.stoopFront();
  let o = W(cam, w);
  if (!down) o += K.bang('NO RESPAWN!', 1440, 220, seg(t, l3.word('respawn').t0, l3.word('respawn').t0 + 0.1) * (1 - seg(t, tBut - 0.15, tBut)), 70, 8, '#FF5A5A');
  if (smash) {
    o = S.rect(0, 0, 1920, 1080, 0, { fill: '#FFE14D' }) + K.rays(960, 520, 24, 1500, '#FFFFFF', 0.45, t * 40) + W(cam, dex);
    o += K.sparkles([[260, 240, 54], [1660, 300, 64], [1560, 860, 44], [340, 800, 48]], t);
    const kp = seg(t, tAmazing + 0.1, tAmazing + 0.35);
    if (kp > 0) {
      let p = S.rect(-300, -90, 600, 180, 26, ol('#1B2340', 7)) + TF('GRAPHICS SETTINGS', 0, -40, 30, '#9AA6C0', { 'letter-spacing': 3 });
      p += T('ULTRA', -60, 44, 72, '#3BD16F') + S.circle(200, 20, 40, ol('#3BD16F', 6)) + S.path('M182 22 L196 38 L222 4', ln(9, '#FFFFFF'));
      o += S.g(p, `translate(1480 190) rotate(4) scale(${f(ob(kp))})`);
    }
  }
  if (down && !smash) o += whip(bump(t, tBut + 0.05, tBut + 0.5) * 0.6, 1);
  return o;
}

// ================================================================= K/L/M/N. Bubble Island: 3 -> 3,000,000, published, POP
const LAPSCR = ST.SPOTS.attic.laptop.screen;
function atticShot(t, cam, juno, screen) {
  const Ls = ST.attic.layers(t, { time: 'day', cat: 'sit', screen });
  return view(cam, Ls.bg, 0.6) + W(cam, Ls.mid + juno + Ls.fg + Ls.light);
}
function shotAttic(t) {
  const push = ease.in(seg(t, tCount - 0.55, tCount));
  const base = camKeys(t, [[tAttic, at(820, 560, 1.12)], [tCount - 0.55, at(760, 520, 1.45)]]);
  const cam = push > 0 ? { zoom: lerp(base.zoom, 1920 / LAPSCR.w, push), x: lerp(base.x, LAPSCR.cx - 960, ease.out(push)), y: lerp(base.y, LAPSCR.cy - 540, ease.out(push)) } : base;
  const point = ob(seg(t, l4.word('Bubble').t0 - 0.1, l4.word('Bubble').t0 + 0.2));
  const juno = actor('juno', t, { x: 1000, y: 985, s: 0.58, turn: -0.5, armL: lerp(14, 70, point), armR: 14, face: { name: 'happy', eyes: { look: [-0.8, 0.1] } } }, { arms: false, energy: 0.8 });
  const scr = (w, h) => ST.frameIn(ST.bubbleIsland(t, { visits: 3 }), w, h);
  return atticShot(t, cam, juno, scr) + flashCut(t, tAttic, 0.3);
}
function visitsText(t) {
  if (t < tBecame) return '3';
  if (t >= tMillion) return '3,000,000';
  const u = seg(t, tBecame, tMillion);
  const v = 3 * Math.pow(10, 6 * u);
  const digits = String(Math.floor(v)).split('').map((d, i) => (i === 0 ? d : String(Math.floor(hash(i * 7.3 + Math.floor(t * 30)) * 10)))).join('');
  return Number(digits).toLocaleString('en-US');
}
function bigCounter(t) {
  const txt = visitsText(t);
  const done = t >= tMillion;
  const pulse = 1 + 0.12 * (bump(t, l4.word('Three').t0, l4.word('Three').t0 + 0.25) + bump(t, l4.word('visits').t0, l4.word('visits').t0 + 0.25)) + (done ? 0.25 * (1 - ease.out(seg(t, tMillion, tMillion + 0.35))) : 0);
  const w = 260 + txt.length * 58;
  let o = S.rect(-w / 2, -84, w, 168, 50, { fill: '#1B2340', opacity: 0.86, stroke: done ? '#FFD21F' : '#FFFFFF', 'stroke-width': 8 });
  o += S.ellipse(-w / 2 + 84, 0, 40, 26, { fill: '#FFFFFF' }) + S.circle(-w / 2 + 84, 0, 15, { fill: '#1B2340' }) + S.circle(-w / 2 + 89, -5, 5, { fill: '#FFFFFF' });
  o += TF('VISITS', -w / 2 + 84, 60, 22, '#9AA6C0', { 'letter-spacing': 3 });
  o += T(txt, 60, 42, 112, done ? '#FFD21F' : '#FFFFFF', { stroke: '#151515', 'stroke-width': 10, 'paint-order': 'stroke' });
  return S.g(o, `translate(960 170) scale(${f(pulse)})`);
}
function shotCounter(t) {
  const cam = shakeCam(camKeys(t, [[tCount, at(960, 540, 1.0)], [tMillion - 0.02, at(960, 520, 1.06)], [tMillion + 0.08, at(960, 480, 1.18)], [tPublish, at(960, 480, 1.2)]]), t, tMillion, 0.4, 16);
  let w = ST.bubbleIsland(t, { visits: null });
  // visitors raining in, each hanging under a little bubble
  if (t > tBecame) for (let i = 0; i < 18; i++) {
    const t0 = tBecame + hash(i * 3.7) * 1.4, age = t - t0;
    if (age < 0) continue;
    const x = 120 + hash(i * 5.1) * 1680 + Math.sin(age * 3 + i) * 30, y = -120 + age * (260 + hash(i) * 160);
    if (y > 1200) continue;
    w += S.g(E.bubble(0, -150, 46) + S.path('M0 -104 L0 -84', ln(3, '#FFFFFF')) + ST.avatar(0, 0, 1, t + i, { who: i % 3 ? 'guest' : 'npc', pose: 'jump' }), `translate(${f(x)} ${f(y)}) scale(0.9)`);
  }
  let o = W(cam, w) + bigCounter(t);
  if (t >= tMillion) o += K.confetti(t, tMillion, 60, 4) + K.bang('+2,999,997!', 1420, 380, seg(t, tMillion + 0.1, tMillion + 0.2), 70, 8, '#3BD16F');
  return o;
}
function publishedScreen(t, k) {
  return (w, h) => {
    let o = ST.frameIn(ST.bubbleIsland(t, { visits: '3,000,000' }), w, h);
    if (k <= 0) return o;
    let p = S.rect(-130, -44, 260, 88, 16, ol('#2E9E4E', 5)) + S.circle(-92, 0, 22, ol('#FFFFFF', 4)) + S.path('M-102 0 L-94 9 L-80 -8', ln(5, '#2E9E4E')) + TF('PUBLISHED!', 24, -6, 26, '#FFFFFF') + TF('v1.0 · bubbles POP', 24, 24, 17, '#C9FFD8');
    return o + S.g(p, `scale(${f(ob(k) * w / 420)})`);
  };
}
function shotPublish(t) {
  const cam = camKeys(t, [[tPublish, at(840, 520, 1.42)], [tFinished - 0.05, at(820, 505, 1.52)], [tFinished + 0.05, at(740, 470, 1.85)], [tPop, at(735, 468, 1.9)]]);
  const crack = seg(t, l5.word('Oh').t0, l5.word('finally').t0);
  const slam = ob(seg(t, tFinished - 0.12, tFinished + 0.05));
  const armL = slam > 0 ? lerp(110, 62, slam) : 40 + 30 * crack + 8 * Math.sin(t * 30) * crack;
  const armR = slam > 0 ? 20 : 40 + 30 * crack - 8 * Math.sin(t * 30) * crack;
  const juno = actor('juno', t, { x: 1000, y: 985, s: 0.58, turn: -0.45, armL, armR, face: slam > 0 ? { name: 'joy', fx: ['sparkles'] } : { name: 'happy', eyes: { look: [-0.7, 0.2] } } }, { arms: false, energy: 0.8 });
  let o = atticShot(t, shakeCam(cam, t, tFinished, 0.25, 8), juno, publishedScreen(t, seg(t, tFinished, tFinished + 0.3)));
  o += K.bang('CLICK!', 560, 300, seg(t, tFinished, tFinished + 0.08) * (1 - seg(t, tPop - 0.3, tPop)), 80, -8, '#FFFFFF');
  return o + flashCut(t, tPublish, 0.3);
}
function shotPop(t) {
  const p0 = tPopW - 0.04, p1 = tLift - 0.25;
  const pop = t < p0 ? 0 : lerp(0.06, 1.0, seg(t, p0, p1));
  // the order bubbles pop in (sets.js POP_ORDER) -> shake on each pop
  let cam = camKeys(t, [[tPop, at(960, 540, 1.0)], [tLift, at(940, 560, 1.12)]]);
  for (let r = 0; r < 7; r++) { const tp = p0 + ((0.06 + (0.82 * r) / 6) - 0.06) / 0.94 * (p1 - p0); cam = shakeCam(cam, t, tp, 0.18, 8); }
  let w = ST.bubbleIsland(t, { visits: '3,000,000', pop });
  // Juno's avatar hops island to island
  const ISL = ST.bubbleIsland.ISLANDS, hopOrder = [0, 1, 3];
  const hu = (t - tPop) / 1.0, hi = Math.min(hopOrder.length - 1, Math.floor(hu)), hf = hu - Math.floor(hu);
  const a = ISL[hopOrder[hi]], b = ISL[hopOrder[Math.min(hopOrder.length - 1, hi + 1)]];
  const ax = lerp(a.x, b.x, hi < hopOrder.length - 1 ? ease.inOut(hf) : 0), ay = lerp(a.top, b.top, hi < hopOrder.length - 1 ? hf : 0) - (hi < hopOrder.length - 1 ? Math.sin(hf * Math.PI) * 180 : 0);
  w += ST.avatar(ax, ay, 1.6, t, { who: 'juno', pose: hi < hopOrder.length - 1 && hf > 0.1 && hf < 0.9 ? 'jump' : 'wave' });
  let o = W(cam, w);
  if (t > p1 - 0.5) o += K.confetti(t, p1 - 0.5, 50, 7);
  return o + flashCut(t, tPop, 0.3);
}

// ================================================================= O/P. Pip rates a real elevator
function mallPlate() {
  return S.rect(1540, 30, 360, 84, 18, ol('#C9CED8', 6)) + S.rect(1556, 44, 328, 56, 10, { fill: '#E3E7EE' }) + T('MEGA MALL · LIFT 3', 1720, 86, 34, '#3A3F4E');
}
function liftWorld(t, o = {}) {
  return ST.elevatorGame(t, { npc: false, rides: null, doors: o.doors ?? 0, floor: o.floor ?? 1, dir: 'up', ding: o.ding || 0, lit: o.lit }) + mallPlate() + (o.extra || '');
}
function pipCritic(t, extra = {}, act = {}) {
  const [cx, cy] = A.hand(extra.armL ?? 40, -1);
  const board = { svg: S.g(E.clipboard(extra.stars || 0), `translate(${f(cx + 30)} ${f(cy - 70)}) rotate(-8) scale(0.85)`), layer: 'front' };
  const pose = { x: 1150, y: 1010, s: 0.86, turn: 0.45, armL: 40, armR: 14, ...extra, props: [board] };
  delete pose.stars;
  return actor('pip', t, pose, { arms: false, ...act });
}
function shotLift(t) {
  const doors = 1 - ease.inOut(seg(t, tLift + 0.2, tLift + 1.1));
  const tPress = l6.word('real').t0;
  const press = bump(t, tPress - 0.1, tPress + 0.45);
  const cam = camKeys(t, [[tLift, at(980, 560, 1.05)], [tReview, at(1120, 600, 1.38)]]);
  const lookUp = seg(t, l6.word('first').t0 - 0.3, l6.word('first').t0);
  const pip = pipCritic(t, { armR: lerp(14, 108, press), face: t < tPress + 0.4 ? { name: 'amazed', eyes: { look: [0.6, -0.3] } } : { name: 'smug', eyes: { look: [0.3, -lookUp * 0.9] } } });
  const lit = t > tPress ? 12 : 1;
  let o = W(cam, liftWorld(t, { doors, lit }) + pip);
  return o + flashCut(t, tLift, 0.35);
}
function reviewCard(t) {
  const k = ob(seg(t, tReview + 0.05, tReview + 0.3)) * (1 - seg(t, tToo - 0.12, tToo + 0.05));
  if (k <= 0) return '';
  let o = S.rect(-330, -170, 660, 340, 30, ol('#FFFFFF', 9)) + S.rect(-330, -170, 660, 76, 30, { fill: '#2A2246' }) + S.rect(-330, -124, 660, 30, 0, { fill: '#2A2246' });
  o += TF("PIP'S REVIEW", 0, -116, 40, '#FFE14D', { 'letter-spacing': 3 }) + TF('Real elevator (mall)', 0, -44, 36, '#2A2246');
  for (let i = 0; i < 5; i++) {
    const tOn = i === 0 ? tTwo : i === 1 ? tStars : null;
    const on = tOn !== null && t >= tOn;
    const sc = on ? lerp(1.8, 1, ease.out(seg(t, tOn, tOn + 0.15))) : 1;
    o += S.g(S.path(K.F.starPath(0, 0, 50), ol(on ? '#FFD21F' : '#E3E6EE', 7)), `translate(${-220 + i * 110} 60) scale(${f(sc)})`);
  }
  return S.g(o, `translate(1420 360) rotate(4) scale(${f(k * 0.9)})`);
}
function snail(x, y, s = 1, t = 0) {
  const sq = 1 + 0.06 * Math.sin(t * 4);
  let o = S.path('M-60 0 Q-70 -14 -40 -16 L40 -16 Q60 -16 64 0 Z', ol('#C9E07A', 5)) + S.path('M44 -14 L52 -44 M56 -12 L68 -40', ln(4)) + S.circle(52, -46, 5, { fill: '#151515' }) + S.circle(68, -42, 5, { fill: '#151515' });
  o += S.circle(-6, -46, 36, ol('#E8A060', 6)) + S.path('M-6 -46 m-20 0 a20 20 0 1 1 40 0 a14 14 0 1 1 -28 0 a8 8 0 1 1 16 0', ln(5, '#A8683A'));
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s * sq)} ${f(s)})`);
}
function shotReview(t) {
  const tSlow = l6.word('slow').t0;
  const keys = [[tReview, at(1160, 640, 1.85)], [tToo - 0.1, at(1170, 640, 1.95)], [tToo + 0.12, at(960, 230, 2.2)], [tDing - 0.12, at(965, 232, 2.3)], [tDing + 0.02, at(1170, 560, 2.7)], [tBath, at(1170, 560, 2.85)]];
  const cam = shakeCam(camKeys(t, keys, (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2)), t, tTwo, 0.15, 6);
  const stars = t >= tStars ? 2 : t >= tTwo ? 1 : 0;
  const ding = t >= tDing;
  // the floor indicator crawls: 1 ... 2 (a snail would be faster)
  const floor = t > tSlow + 0.5 ? 2 : 1;
  const dingK = ding ? bump(t, tDing + 0.15, tDing + 1.0) : 0;
  const doors = ding ? 0.12 * seg(t, tDing + 0.3, tBath) : 0;
  const pip = pipCritic(t, { stars, armL: ding ? 20 : 40, armR: ding ? 10 : 14, headRot: ding ? -5 : 0, face: ding ? { name: 'deadpan', eyes: { upper: 0.62, look: [0, 0.2] } } : { name: 'smug', eyes: { look: [-0.2, 0] } } }, { energy: 0.3 });
  const sn = snail(lerp(860, 1040, seg(t, tToo, tBath)), 160, 0.9, t);
  let o = W(cam, liftWorld(t, { floor, lit: 2, doors, ding: 0, extra: sn }) + pip);
  // the saddest little ding: one small sparkle that droops and falls
  if (dingK > 0) { const yy = 300 + 260 * seg(t, tDing + 0.4, tDing + 1.1); o += W(cam, K.F.sparkle(1250, yy, 26 * dingK, '#D9D2A0') + TF('ding.', 1300, yy - 30, 30, '#9A9A80', { opacity: f(dingK) })); }
  o += reviewCard(t);
  return o;
}

// ================================================================= R/S. Mom finally finished her bath
function momGear(arms, extra = '') {
  return [{ svg: E.robeBody(), layer: 'mid' }, { svg: E.robeSleeve(-1, arms[0]) + E.robeSleeve(1, arms[1]) + E.turban() + extra, layer: 'front' }];
}
function steamPuffs(t, t0, n = 10, cx = 960, cy = 620) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const age = (t - t0) * (0.7 + hash(i) * 0.4) + hash(i * 2.2) * 0.4;
    if (age < 0) continue;
    const a = hash(i * 3.3) * Math.PI * 2, r = 120 + age * 520;
    const x = cx + Math.cos(a) * r * 1.4, y = cy + Math.sin(a) * r * 0.6 - age * 140;
    const op = clamp(0.85 - age * 0.35, 0, 0.85);
    if (op <= 0) continue;
    o += S.circle(x, y, 90 + age * 120, { fill: '#FFFFFF', opacity: f(op) });
  }
  return o;
}
function shotBath(t) {
  const cam = camKeys(t, [[tBath, at(980, 600, 1.05)], [tWrinkly, at(1000, 560, 1.22)]]);
  const Ls = ST.bathroom.layers(t, { tablets: 3, tabletsClosed: 1, clock: 12 });
  const st = ease.inOut(seg(t, l8.word('finished').t0 - 0.3, l8.word('bath').t0 + 0.3));
  const arms = [lerp(20, 160, st) - 6 * Math.sin(t * 3) * st, lerp(20, 160, st) + 6 * Math.sin(t * 3) * st];
  const mom = K.draw.mom({ x: 1000, y: 1000, s: 0.6, armL: arms[0], armR: arms[1], bodyY: 3 + 3 * Math.sin(t * 3), lean: 3 * Math.sin(t * 1.5) * st, face: { name: 'joy', blink: 0 }, props: momGear(arms) });
  let o = W(cam, Ls.mid + Ls.fg + mom + steamPuffs(t, tBath - 0.3, 10, 1000, 560));
  o += K.bang('AHHH~', 1500, 300, seg(t, l8.word('bath').t0, l8.word('bath').t0 + 0.12) * (1 - seg(t, tWrinkly - 0.2, tWrinkly)), 80, 6, '#FF8FB8');
  return o + flashCut(t, tBath, 0.35);
}
function raisin(x, y, s, t) {
  let o = S.ellipse(0, 0, 120, 100, ol('#6A3A5A', 8));
  o += S.path('M-90 -30 q20 14 40 0 q20 -14 40 0 q20 14 40 0 M-80 30 q20 14 40 0 q20 -14 40 0 q20 14 40 0 M-40 -66 q20 10 40 0', ln(6, '#4A2440'));
  o += S.circle(-36, -6, 12, { fill: '#FFFFFF' }) + S.circle(36, -6, 12, { fill: '#FFFFFF' }) + S.circle(-34, -4, 6, { fill: '#151515' }) + S.circle(38, -4, 6, { fill: '#151515' }) + S.path('M-20 30 Q0 46 20 30', ln(6, '#FFFFFF'));
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(Math.sin(t * 3) * 6)}) scale(${f(s)})`);
}
function shotWrinkly(t) {
  const smash = t >= tWrW - 0.04;
  const cam = smash ? shakeCam(camKeys(t, [[tWrW - 0.04, at(980, 560, 2.75)], [tFarm, at(980, 560, 2.9)]]), t, tWrW, 0.25, 10) : camKeys(t, [[tWrinkly, at(990, 600, 2.05)], [tWrW, at(985, 580, 2.25)]]);
  const Ls = ST.bathroom.layers(t, { tablets: 3, tabletsClosed: 1, clock: 12 });
  const arms = [132, 132];
  const [hx, hy] = A.hand(132, 1), [gx, gy] = A.hand(132, -1);
  const extra = E.wrinkles(1) + E.pruneHand(hx, hy, 1.1) + E.pruneHand(gx, gy, 1.1);
  const mom = K.draw.mom({ x: 1000, y: 1000, s: 0.6, armL: arms[0], armR: arms[1], bodyY: 2 * Math.sin(t * 3), face: smash ? { name: 'happy', fx: ['blush'], eyes: { look: [0, -0.5] } } : { name: 'amazed', fx: [], eyes: { look: [0.6, -0.6] } }, props: momGear(arms, extra) });
  let o = W(cam, Ls.mid + Ls.fg + mom + steamPuffs(t, tWrinkly - 1.2, 6, 1000, 420));
  if (smash) {
    const k = ob(seg(t, tWrW + 0.05, tWrW + 0.3));
    o += S.g(outT('=', 0, 30, 140, '#FFFFFF', 12), `translate(1290 500) scale(${f(k)})`) + raisin(1530, 470, 1.25 * k, t);
    o += TF('RAISIN MODE', 1530, 660, 44, '#6A3A5A', { stroke: '#FFFFFF', 'stroke-width': 10, 'paint-order': 'stroke', opacity: f(k) });
  }
  return o;
}

// ================================================================= T/U. Grandpa: night janitor again
function grandpaMop(armR, rot = 0, extra = []) {
  const [hx] = A.hand(armR, 1);
  return [...extra, { svg: mop({ x: hx, y: 0, bow: true, rot }), layer: 'front' }];
}
function badgePin() {
  return { svg: S.g(S.rect(-70, -34, 140, 68, 12, ol('#FFFFFF', 5)) + S.rect(-70, -34, 140, 22, 10, { fill: '#2E6BE6' }) + TF('OTTO', 0, 6, 22, '#2A2246') + TF('NIGHT JANITOR', 0, 26, 13, '#5A6070'), 'translate(-56 -400) rotate(-6)'), layer: 'front' };
}
function shotFarm(t) {
  const glide = seg(t, tFarm, tNight - 0.2);
  const spin = seg(t, tBack - 0.05, tBack + 0.55);
  const stop = t >= tNight - 0.2;
  const dist = 900 * ease.out(seg(t, tFarm, tNight)) + 60 * seg(t, tNight, tPorch);
  const keys = [[tFarm, at(960, 560, 1.15)], [tNight - 0.25, at(980, 560, 1.2)], [tNight - 0.05, at(1000, 560, 1.55)], [tBest - 0.1, at(1010, 560, 1.6)], [tBest + 0.4, at(1150, 600, 1.12)], [tPorch, at(1160, 600, 1.1)]];
  const cam = camKeys(t, keys);
  let Lh;
  try { Lh = FM.rackHall(t, cam, { dist, green: 0.35, greenWave: 1, fgRacks: false }); } catch (e) { Lh = E.simpleHall(t, cam, dist); } // farm.js is shared + still evolving
  // Grandpa
  const gx = stop ? 1000 : lerp(260, 1000, ease.out(glide));
  const turn = spin > 0 && spin < 1 ? Math.sin(spin * Math.PI * 4) : stop ? 0 : 0.6;
  let armR = stop ? 30 : 34, armL = stop ? 20 : 60;
  if (t > tBest + 0.15) armL = 150 + 20 * Math.sin(t * 10);
  const keysSwing = Math.sin(t * 9) * 16 * (stop ? 0.3 : 1);
  const pose = { x: gx, y: FM.FLOOR.hall, s: 0.6, turn, lean: stop ? 0 : 6, legL: stop ? 0 : -8, legR: stop ? 0 : 14, armL, armR, keysSwing, rot: spin > 0 && spin < 1 ? 0 : 0, face: t > tNight ? { name: t > tBest ? 'joy' : 'happy', fx: t > tNight && t < tBest ? ['sparkles'] : [] } : { name: 'joy' }, props: grandpaMop(armR, stop ? 0 : 22, t > tNight - 0.2 ? [badgePin()] : []) };
  let chars = actor('grandpa', t, pose, { arms: false, energy: 0.9 });
  // shiny wet trail
  if (!stop || t < tNight + 0.6) chars = S.rect(gx - 900, FM.FLOOR.hall - 6, 900, 14, 7, { fill: '#BFF6FF', opacity: 0.55 }) + chars;
  // two Modbots roll in, friendly
  const mk = ease.out(seg(t, tBest - 0.5, tBest + 0.4));
  if (mk > 0) for (const [i, x0, x1] of [[0, 2200, 1450], [1, 2500, 1730]]) {
    const x = lerp(x0, x1, mk);
    chars += LAG.modbot({ x, y: FM.FLOOR.hall, s: 0.42, t, face: 'ok', roll: x, lean: Math.sin(t * 7 + i) * 8 * seg(t, tBest + 0.2, tBest + 0.5), talk: 0, flip: true });
    if (t > tBest + 0.3) chars += S.path(K.F.heartPath(x, FM.FLOOR.hall - 420 - ((t * 60 + i * 30) % 60), 22), ol('#FF6FB0', 4));
  }
  let o = Lh.bg + Lh.mid + W(cam, chars) + Lh.fg;
  if (t > tNight) {
    const kb = seg(t, tNight, tNight + 0.1) * (1 - seg(t, tBest - 0.2, tBest));
    o += K.bang('NIGHT JANITOR!', 1460, 220, kb, 76, -6, '#7CF7FF');
    if (kb > 0) o += K.sparkles([[960, 300, 34], [1180, 420, 26]], t);
  }
  return o + flashCut(t, tFarm, 0.4);
}

// ================================================================= V/W/X. Porch at sunset: everyone logs off
const PORCH_CAST = [
  ['grandpa', 300, 0.46], ['mom', 480, 0.45], ['dad', 660, 0.45], ['juno', 880, 0.5], ['pip', 1040, 0.52], ['dex', 1210, 0.48],
];
function porchCast(t, wave = 0) {
  let o = '';
  for (const [name, x, s] of PORCH_CAST) {
    const wv = wave > 0 ? Math.sin(t * 9 + x) * 18 : 0;
    const pose = { x, y: ST.FLOOR.porch, s, turn: 0.45, face: { name: wave > 0.5 ? 'joy' : 'happy', eyes: { look: [0.8, -0.25] } }, armL: 12, armR: lerp(12, 150, wave) + wv * wave };
    if (name === 'grandpa') { pose.props = grandpaMop(pose.armR > 40 ? 30 : pose.armR, 0); pose.armR = Math.min(pose.armR, 30); pose.armL = lerp(12, 150, wave) + wv * wave; }
    if (name === 'pip') { pose.armL = lerp(12, 150, wave) - wv * wave; pose.props = [{ svg: LAG.buffer({ x: 0, y: -1000, s: 2.0, t, mood: wave > 0.5 ? 'love' : 'happy', hop: wave > 0 ? Math.abs(Math.sin(t * 6)) * 0.3 : 0 }), layer: 'front' }]; }
    if (name === 'dex') { pose.face = { name: 'amazed', eyes: { look: [0.8, -0.3] }, fx: [] }; Object.assign(pose, dexPose(t, pose)); }
    if (name === 'juno') { pose.face = undefined; }
    o += actor(name, t, pose, { arms: false, energy: 0.5 });
  }
  return o;
}
function porchShot(t, cam, sunset, phones, wave) {
  const Lp = ST.porch.layers(t, { sunset, phones });
  return view(cam, Lp.bg, 0.45) + W(cam, Lp.mid + porchCast(t, wave) + Lp.light);
}
function shotPorch(t) {
  const cam = camKeys(t, [[tPorch, at(840, 520, 1.0)], [tPhones, at(860, 560, 1.13)]], (u) => u);
  const sunset = lerp(0.35, 0.55, seg(t, tPorch, tPhones));
  return porchShot(t, cam, sunset, 0, 0) + flashCut(t, tPorch, 0.3);
}
const PHONE_WORDS = ['log', 'off', 'for', 'ten', 'seconds'];
const PHONE_COLS = [['#24365F', '#E8B48E', '#7C5CFF'], ['#1FA39A', '#D9A07C', '#FF6FA8'], ['#E8453C', '#F6CFAE', '#3A3F4E'], ['#1C1E26', '#C98D6A', '#3FBF5A'], ['#5CC24A', '#F8D4B4', '#FFB13B'], ['#E0A53A', '#EDC1A0', '#8A93A6']];
function shotPhones(t) {
  const times = PHONE_WORDS.map((w) => l10.word(w).t0).concat([l10.word('seconds').t0 + 0.45]);
  const cam = camKeys(t, [[tPhones, at(960, 560, 1.0)], [tHiShot, at(960, 560, 1.08)]]);
  let w = E.stepTop(t);
  const spots = [[330, 620, -12], [640, 520, 8], [960, 640, -4], [1270, 520, 10], [1580, 620, -8], [960, 330, 16]];
  const from = [[200, -300], [700, -400], [960, 1500], [1250, -400], [1750, -300], [1300, -500]];
  times.forEach((t0, i) => {
    const u = seg(t, t0 - 0.28, t0), back = seg(t, t0 + 0.05, t0 + 0.35);
    if (u <= 0) return;
    const [x, y, r] = spots[i], [sleeve, skin, pc] = PHONE_COLS[i];
    const flip = ease.inOut(seg(t, t0 - 0.12, t0));
    const drop = 1 - ease.out(u);
    w += E.bigPhone(x, y - 30 * drop, 0.62, r, flip, pc, t);
    if (back < 1) { const k = ease.out(u) * (1 - ease.in(back)); const [fx, fy] = from[i]; w += E.reachHand(fx, fy, lerp(fx, x, k), lerp(fy, y - 60, k), sleeve, skin); }
    if (t > t0) w += K.bang('clack', x + 90, y - 140, seg(t, t0, t0 + 0.06) * (1 - seg(t, t0 + 0.25, t0 + 0.35)), 40, 8, '#FFFFFF');
  });
  return W(cam, w) + flashCut(t, tPhones, 0.25);
}
function shotHi(t) {
  const cam = camKeys(t, [[tHiShot, at(900, 540, 1.04)], [tCouch, at(930, 570, 1.16)]], (u) => u);
  const wave = ease.out(seg(t, tHi - 0.35, tHi));
  const sunset = lerp(0.7, 0.92, seg(t, tHiShot, tCouch));
  let o = porchShot(t, cam, sunset, 6, wave);
  if (t > tHi) o += K.bang('hi!', 1560, 420, seg(t, tHi, tHi + 0.1), 90, 6, '#FFE7A0');
  return o;
}

// ================================================================= Y-AC. The Wi-Fi gag
const COUCH = { dad: 680, mom: 865, pip: 1045, juno: 1228 };
const ROUTER = ST.SPOTS.livingRoom.router;
function tvScreen(t, frozen) {
  return frozen ? (w, h) => E.frozenScreen(w, h, t) : undefined;
}
// the whole family on the couch; fz = frozen time (everyone but Juno holds still), frozen flags per screen
function family(t, o = {}) {
  const fz = o.freeze;                                        // time to hold the frozen characters at
  const tt = (name) => (fz !== undefined && name !== 'juno' ? Math.min(t, fz) : t);
  const flat = (name) => (o.flat && o.flat.includes(name) ? { volume: false } : {});
  const scr = o.screens || {};
  // Dad + laptop
  const dadT = o.dadT ?? tt('dad');
  const dadPose = { x: COUCH.dad, y: 908, s: 0.5, armL: 30, armR: 34, turn: 0.35, ...(o.dad || {}) };
  let seated = actor('dad', dadT, dadPose, { arms: false, energy: 0.8, ...(o.dadAct || {}) });
  seated += actor('mom', tt('mom'), { x: COUCH.mom, y: 908, s: 0.5, armL: 34, armR: 34, face: { name: 'happy', eyes: { look: [0.3, 0.5] } }, ...flat('mom'), ...(o.mom || {}) });
  seated += actor('pip', tt('pip'), { x: COUCH.pip, y: 885, s: 0.58, armL: 20, armR: 20, ...flat('pip'), ...(o.pip || {}) }, { arms: false, ...(o.pipAct || {}) });
  if (!o.noJuno) seated += actor('juno', t, { x: COUCH.juno, y: 908, s: 0.52, armL: 30, armR: 20, turn: -0.2, face: { name: 'happy', eyes: { look: [-0.3, 0.4] } }, ...flat('juno'), ...(o.juno || {}) }, { arms: false, energy: 0.5, ...(o.junoAct || {}) });
  // screens in front of the couch
  let front = E.dadLaptop(COUCH.dad + 20, 790, 0.46, scr.laptop ? (w, h) => E.frozenScreen(w, h, t) : (w, h) => E.fishGame(w, h, t, 1, { hud: 'LEVEL 901' }), { rot: -4 });
  front += E.tablet(COUCH.mom, 738, 0.38, scr.tablet ? (w, h) => E.frozenScreen(w, h, t) : (w, h) => S.rect(-w / 2, -h / 2, w, h, 0, { fill: '#FFB4D8' }) + S.circle(0, 0, 36, ol('#FFF1D6', 4)), -4);
  front += K.phone(COUCH.juno + 28, 745, 0.18, 8, scr.phone ? S.g(E.frozenScreen(300, 560, t, false), '') : S.rect(-150, -280, 300, 560, 0, { fill: '#B79BE8' }) + S.circle(0, -60, 60, { fill: '#FFFFFF', opacity: 0.6 }));
  // Buffer (on the router once it has landed)
  front += o.buffer || '';
  return { seated, front };
}
function freezeBlips(t, list) {
  // little red "!" pops above each screen that just froze
  let o = '';
  for (const [x, y, t0] of list) { const k = seg(t, t0, t0 + 0.12) * (1 - seg(t, t0 + 0.5, t0 + 0.7)); if (k > 0) o += K.bang('!', x, y, k, 70, 0, '#FF5A5A'); }
  return o;
}
function shotBuffer(t) {
  // Y: Pip holds Buffer up ... Z: Buffer hops, whip-pan to the router; the router panics, then dies
  const lift = ob(seg(t, tCouch, tCouch + 0.35));
  const flying = t >= tHop;
  const hu = seg(t, tHop, tLand);
  const up = ob(seg(t, l11.word('Buffer').t0 - 0.25, l11.word('Buffer').t0));
  const p0 = [COUCH.pip, lerp(770, 720, up)], p1 = [ROUTER.x, ROUTER.y];
  const bx = lerp(p0[0], p1[0], hu), by = lerp(p0[1], p1[1], hu) - Math.sin(hu * Math.PI) * 260;
  const landed = t >= tLand;
  const blink = landed ? 1 : 0.25, down = t >= tDown;
  let buf;
  if (!flying) buf = LAG.buffer({ x: p0[0], y: p0[1] + 4 * Math.sin(t * 8), s: 0.95, t, mood: 'love', hop: Math.abs(Math.sin(t * 5)) * 0.2 });
  else if (!landed) buf = S.g(LAG.buffer({ x: 0, y: 0, s: 0.85, t, mood: 'happy', hop: 0.4 }), `translate(${f(bx)} ${f(by)}) rotate(${f(hu * 360)})`);
  else buf = LAG.buffer({ x: p1[0], y: p1[1] + 2, s: 0.7, t, mood: down ? 'surprised' : 'happy', hop: bump(t, tLand, tLand + 0.18) * 0.6 });
  const pipPose = flying ? { armL: 120, armR: 120, face: { name: 'shocked', eyes: { look: [0.8, -0.4] } } } : { armL: lerp(14, 26, lift) + 14 * up, armR: lerp(14, 26, lift) + 14 * up, face: { name: 'excited' } };
  const fam = family(t, { pip: pipPose, buffer: buf, dad: { face: { name: 'happy', eyes: { look: [0.6, 0.6] } } } });
  const cam = camKeys(t, [[tCouch, at(1060, 590, 1.5)], [tHop, at(1080, 580, 1.62)], [tLand - 0.05, at(1600, 470, 1.9)], [tFreeze, at(1610, 480, 2.0)]], (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2));
  let o = living(t, shakeCam(cam, t, tLand, 0.25, 10), { time: 'evening', seated: fam.seated, front: fam.front, blink, down, lamp: true });
  o += whip(bump(t, tHop, tLand) * 0.8, 1);
  if (t > l11.word('Buffer').t0) o += S.g(S.rect(-170, -46, 340, 92, 30, ol('#FFFFFF', 7)) + T('BUFFER', 0, 24, 62, '#7C5CFF'), `translate(1340 230) rotate(-6) scale(${f(ob(seg(t, l11.word('Buffer').t0, l11.word('Buffer').t0 + 0.2)) * (1 - seg(t, tHop + 0.05, tHop + 0.2)))})`);
  if (landed) o += K.bang('pip!', 1230, 260, seg(t, tLand, tLand + 0.08) * (1 - seg(t, tDown - 0.05, tDown + 0.1)), 70, 8, '#FFFFFF');
  if (down) o += K.bang('NO WI-FI', 1250, 300, seg(t, tDown, tDown + 0.1), 70, -6, '#FF5A5A');
  return o;
}
function shotFreeze(t) {
  // AA: medium on the couch. Every screen freezes, word by word. Dad stutters (choppy time + rubber-banding)
  const tWhy = l12.word('why').t0, tIs = l12.word('is').t0, tThe = l12.word('the').t0;
  const scr = { tv: t >= tFreeze, laptop: t >= tWhy, tablet: t >= tIs, phone: t >= tThe };
  const dadT = K.stutterT(t, 4);
  const rb = K.rubber(t, tWhy, 0.6, 30, 3) + K.rubber(t, tThe, 0.5, 24, 3);
  const fam = family(t, {
    screens: scr, dadT,
    dad: { turn: 0.6, armL: 60, armR: 70, lean: 4, headRot: 4, x: COUCH.dad + rb, face: { name: 'angry', fx: [], eyes: { look: [0.9, 0] } } }, dadAct: { energy: 0.3 },
    mom: { face: { name: 'deadpan', eyes: { look: [0.2, 0.6] } } },
    pip: { armL: 30, armR: 30, face: { name: 'happy', eyes: { look: [0.9, -0.4] } } },
    juno: { face: { name: 'nervous', fx: ['sweat'], eyes: { look: [-0.8, 0] } }, turn: -0.4 },
    buffer: LAG.buffer({ x: ROUTER.x, y: ROUTER.y + 2, s: 0.7, t, mood: 'happy', hop: Math.abs(Math.sin(t * 7)) * 0.3 }),
  });
  const cam = camKeys(t, [[tFreeze, at(1010, 560, 1.2)], [tZoom, at(980, 560, 1.28)]]);
  const tvFn = scr.tv ? (w, h) => E.frozenScreen(w, h, t) : undefined;
  let o = living(t, cam, { time: 'evening', seated: fam.seated, front: fam.front, down: true, tv: tvFn, lamp: true });
  // screen-space positions of the four screens for the "!" blips
  const sp = (x, y) => [(x - 960 - cam.x) * cam.zoom + 960, (y - 540 - cam.y) * cam.zoom + 540];
  o += freezeBlips(t, [[...sp(305, 380), tFreeze], [...sp(COUCH.dad + 20, 640), tWhy], [...sp(COUCH.mom, 640), tIs], [...sp(COUCH.juno + 30, 640), tThe]]);
  return o + flashCut(t, tFreeze, 0.3);
}
function frozenWorld(t, extraDad = {}, more = {}) {
  const tf = tZoom;
  const fam = family(t, {
    freeze: tf, flat: ['mom', 'pip', 'juno', ...(more.flatDad ? ['dad'] : [])], noJuno: more.noJuno, screens: { tv: 1, laptop: 1, tablet: 1, phone: 1 }, dadT: K.stutterT(t, 3),
    dad: { turn: 0.6, armL: 60, armR: 70, lean: 4, headRot: 4, face: { name: 'angry', fx: [], eyes: { look: [0.9, 0] } }, ...(more.flatDad ? { volume: false } : {}), ...extraDad }, dadAct: { energy: 0.2 },
    mom: { face: { name: 'deadpan', eyes: { look: [0.2, 0.6] } } },
    pip: { armL: 30, armR: 30, face: { name: 'happy', eyes: { look: [0.9, -0.4] } } },
    juno: { face: { name: 'deadpan', eyes: { look: [0, 0] } }, turn: 0 },
    buffer: LAG.buffer({ x: ROUTER.x, y: ROUTER.y + 2, s: 0.7, t, mood: 'happy', hop: Math.abs(Math.sin(t * 7)) * 0.3 }),
  });
  return fam;
}
function shotWiFi(t) {
  // AB: three smash zooms on Dad, frozen facing us, his glasses turned into loading spinners; the frame freezes harder
  const n = t >= tWi[2] ? 3 : t >= tWi[1] ? 2 : t >= tWi[0] ? 1 : 0;
  const fy = 908 - 700 * 0.5 * 1.12;                      // Dad's eye line on screen (world)
  const Z = [[1010, 560, 1.28], [COUCH.dad + 20, fy + 60, 1.9], [COUCH.dad + 10, fy + 30, 2.7], [COUCH.dad, fy + 10, 3.6]][n];
  const t0 = n ? tWi[n - 1] : tZoom;
  let cam = camKeys(t, [[t0, at(Z[0], Z[1], Z[2] * 0.97)], [t0 + 0.5, at(Z[0], Z[1], Z[2])]]);
  cam = shakeCam(cam, t, t0, 0.2, 12);
  const jit = n === 3 ? (hash(Math.floor(t * 12)) - 0.5) * 10 : 0;
  const front = n >= 1 ? { turn: 0, headRot: 0, headY: 0, lean: 0, armL: 70, armR: 70, face: { name: 'shocked', fx: [] }, props: [{ svg: E.spinnerSpecs(t), layer: 'front' }] } : {};
  const fam = frozenWorld(t, { x: COUCH.dad + jit, ...front });
  const tvFn = (w, h) => E.frozenScreen(w, h, t);
  const jx = n >= 2 ? (hash(Math.floor(t * 15)) - 0.5) * 8 * (n - 1) : 0;
  let o = S.g(living(K.stutterT(t, n >= 3 ? 1 : 3), cam, { time: 'evening', seated: fam.seated, front: fam.front, down: true, tv: tvFn, lamp: true }), jx ? `translate(${f(jx)} 0)` : null);
  // tearing bars (cheap stand-in for an RGB split)
  if (n >= 2) for (let i = 0; i < 4 * (n - 1); i++) { const y = hash(i * 3.7 + Math.floor(t * 12)) * 1080; o += S.rect(0, y, 1920, 6 + hash(i) * 16, 0, { fill: i % 2 ? '#FF2E63' : '#2EE6FF', opacity: 0.18 }); }
  // grey "still loading" blocks creep in from the frame edges, a little more on every "Wi"
  if (n >= 1) o += ST.lagBlocks(0, 0, 440, 1080, 0.3 * n, t, 3, 60, 'l') + ST.lagBlocks(1480, 0, 440, 1080, 0.3 * n, t, 5, 60, 'r');
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#8C93A0', opacity: f(0.1 * n) });
  if (n === 3) {
    const k = ob(seg(t, tWi[2], tWi[2] + 0.2));
    o += S.g(S.rect(-260, -50, 520, 100, 50, { fill: '#10131C', opacity: 0.85 }) + K.loadingWheel(-190, 0, 26, t, '#FFFFFF', 8, 7) + TF('BUFFERING...', 30, 16, 50, '#FFFFFF'), `translate(960 110) scale(${f(k)})`);
  }
  return o + C.whiteFlash(0.4 * bump(t, t0 - 0.03, t0 + 0.07));
}
function shotHereWeGo(t) {
  // AC: everything frozen grey; Juno alone still moves: she turns to camera, deadpan
  const fam = frozenWorld(t, {}, { flatDad: true, noJuno: true });
  const turn = ease.inOut(seg(t, tJuno, tJuno + 0.4));
  const j = actor('juno', t, { x: COUCH.juno, y: 908, s: 0.55, armL: 30, armR: 20, turn: lerp(-0.4, 0, turn), headRot: 0, face: { name: 'deadpan', eyes: { look: [lerp(-0.8, 0, turn), 0], upper: 0.55 } } }, { arms: false, energy: 0.25 });
  const cam = camKeys(t, [[tJuno, at(1330, 520, 1.95)], [S13, at(1300, 520, 2.25)]], (u) => u);
  const Ls = ST.livingRoom.layers(K.stutterT(t, 1), { time: 'evening', wifiDown: true, tv: (w, h) => E.frozenScreen(w, h, t), lamp: true });
  // the frozen world goes grey; Juno is drawn on top of the veil, in colour
  let o = view(cam, Ls.bg, 0.55) + W(cam, Ls.mid + fam.seated + Ls.seat + fam.front + Ls.light);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#8C93A0', opacity: 0.45 });
  // Juno in colour on top of the veil; the couch front is re-drawn around her only (clip) so she stays seated
  o += W(cam, j + S.g(Ls.seat, null, { 'clip-path': 'url(#s12seatJ)' }) + K.phone(COUCH.juno + 30, 742, 0.2, 8, E.frozenScreen(300, 560, t, false)));
  o += W(cam, LAG.buffer({ x: ROUTER.x, y: ROUTER.y + 2, s: 0.7, t, mood: 'happy', hop: Math.abs(Math.sin(t * 7)) * 0.4 }));
  o += K.loadingWheel(1700, 140, 34, t, '#FFFFFF', 8, 8);
  return o + flashCut(t, tJuno, 0.3);
}

// ---------------------------------------------------------------- router
function scene(t) {
  if (t < tEarth) return shotNews(t);
  if (t < tLive) return shotEarth(t);
  if (t < tBrenda) return shotLive(t);
  if (t < tFish) return shotBrenda(t);
  if (t < tDadCry) return shotFish(t);
  if (t < tDex) return shotDadCry(t);
  if (t < tSteps) return shotDexOut(t);
  if (t < tAttic) return shotSteps(t);
  if (t < tCount) return shotAttic(t);
  if (t < tPublish) return shotCounter(t);
  if (t < tPop) return shotPublish(t);
  if (t < tLift) return shotPop(t);
  if (t < tReview) return shotLift(t);
  if (t < tBath) return shotReview(t);
  if (t < tWrinkly) return shotBath(t);
  if (t < tFarm) return shotWrinkly(t);
  if (t < tPorch) return shotFarm(t);
  if (t < tPhones) return shotPorch(t);
  if (t < tHiShot) return shotPhones(t);
  if (t < tCouch) return shotHi(t);
  if (t < tFreeze) return shotBuffer(t);
  if (t < tZoom) return shotFreeze(t);
  if (t < tJuno) return shotWiFi(t);
  return shotHereWeGo(t);
}
function look(t) {
  if (t >= tFarm && t < tPorch) return { grade: 'cool', vignette: 0.7 };
  if (t >= tZoom) return { grade: 'cool', vignette: 1 };
  if (t >= tPorch && t < tCouch) return { grade: 'warm', vignette: 0.9 };
  return { grade: 'warm', vignette: 0.6 };
}

const DEFS = E.DEFS + `<defs>
<clipPath id="s12seatJ"><rect x="1120" y="600" width="400" height="420"/></clipPath>
</defs>`;

module.exports = { scene, look, DEFS, beats: { tJuno, S13 } };
