// SC 10 · THE MESSAGE — the cold-open moment again, shot for shot ("One... min... min... minute... left.",
// "Pip! Press the button!", "Ding!"), but this time Pip lands on the button: every screen in the world flips from the
// grey pop-up to Juno with soot on her cheek. A quiet close-up for her speech, then the world logs off one by one
// (Dad lets the Golden Fish go, Mom closes three tablets, the streamer, a classroom, a bus, a grandma, an astronaut),
// synced to SYSTEM counting the players down while the Lag panics and shrinks; the last screen goes dark; three
// seconds of silence (sunset, birds, a family at the window, Dex steps onto real grass) → the TOUCH GRASS badge.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const { L } = K.V;
const C = K.C;
const F = require('./farm');
const SETS = require('./sets');
const LG = require('../rig/lag');
const E = require('./s09_env');
const { CORE, FL, camAt, pop, who, SOOT, runSide, lagSprite, lagAura, coreShot, R, P, CI, EL, G, tr, OUT, TS, TFS } = E;

const START = K.V.scene('SC 10').start, END = K.V.scene('SC 11').start;
const m = (i) => L('10.' + i);
const M = Array.from({ length: 15 }, (_, i) => m(i));

// ---------------------------------------------------------------- beats (all from the voice)
const tMinute = M[0].word('minute').t0;
const tP = M[1].a - 0.05;                        // "Pip! Press the button!" (shared)
const tG = M[2].a - 0.25;                        // "Ding!" (shared) — he lands this time
const tLand = M[2].b + 0.1;
const tWall = tLand + 0.42;                      // the screens of the world flip to Juno
const tHi = M[3].word('Hi').t0;
const tCU = M[3].word('Juno').t0 - 0.25;         // intimate close-up
const tBuilder = M[3].word('builder').t0;
const tCity = M[4].word('I', 1).t0 - 0.1;        // cutaway: the city watching
const tMe = M[4].word('Me').t0 - 0.15;           // back to Juno: "Me too."
const tMon = M[5].a - 0.1;                       // medium with the Lag behind her
const tMonster = M[5].word('monster').t0;
const tDad1 = M[6].a - 0.1;                      // Dad: the Golden Fish on the hook
const tCU2 = M[6].word('But').t0 - 0.15;         // close-up: "only if we stop... right now"
const tRight = M[6].word('right').t0;
const tECU = M[7].a - 0.1;                       // extreme close-up: "So please..."
const tDad2 = M[7].word('Log').t0 - 0.08;        // Dad lets it go, closes the laptop
const tMom = M[7].word('And').t0 - 0.1;          // Mom closes three tablets, looks up
const tLook = M[7].word('look').t0;
const tStr = M[8].a - 0.1;                       // the streamer
const tBack = M[8].word('back').t0;
const tCls = M[9].a - 0.05;                      // classroom
const tBus = M[9].word('one').t0 + 0.3;          // bus
const tGran = M[9].word('the').t0 - 0.06;        // grandma
const tMap = M[10].a - 0.05;                     // the Core: the players counter falls
const tAst = M[11].a - 0.05;                     // astronaut
const tEarth = M[11].word('ten', 1).t0 - 0.05;   // the Earth goes dark
const tPhone = M[11].word('ten', 2).t0 - 0.05;   // one last phone
const tNight = tPhone + 1.35;                    // city windows go out (beat)
const tPanic = M[12].a - 0.1;                    // the Lag panics
const tWatch = M[12].word('come').t0 - 0.05;
const tBeg = M[12].word('play').t0 - 0.05;
const tLast = M[13].a - 0.1;                     // the last screen
const tZero = M[13].word('zero').t0;
const tSil = M[13].b + 0.02;                     // 3 s of silence
const tSil2 = tSil + 1.05, tSil3 = tSil + 2.0;
const tStep = M[14].a - 0.08;                    // Dex's sneaker on real grass
const tBadge = M[14].word('Grass').t0 - 0.05;    // the badge
const tDefl = M[14].b + 0.04;                    // back to the Core: the Lag deflates (continues in SC 11)

// ---------------------------------------------------------------- the countdown + the players counter
function secAt(t) {
  if (t < tMinute) return 60 - (Math.floor(t * 2.2) % 3 === 2 ? 1 : 0);
  if (t < 696.6) return 60 - (t - tMinute);
  const s1 = 60 - (696.6 - tMinute);
  if (t < tZero) return lerp(s1, 10, (t - 696.6) / (tZero - 696.6));
  return 10 - (t - tZero);
}
const W10 = [[M[10].a, 812e6], [M[10].word('eight').t0, 800e6], [M[11].a, 10e6], [M[11].word('ten', 1).t0, 1e4], [M[11].word('ten', 2).t0, 10], [tZero, 10], [tZero + 0.05, 0]];
function online(t) {
  if (t < W10[0][0]) return 812e6;
  for (let i = 0; i < W10.length - 1; i++) {
    const [a, va] = W10[i], [b, vb] = W10[i + 1];
    if (t < b) { if (vb === 0) return va; const u = (t - a) / (b - a); return Math.round(Math.exp(lerp(Math.log(va + 1), Math.log(vb + 1), Math.min(1, u * 1.6))) - 1); }
  }
  return 0;
}
const fmt = (n) => Math.max(0, Math.round(n)).toLocaleString('en-US');
// SYSTEM counter tag (top left) during the montage
function counterTag(t, k = 1) {
  if (k <= 0) return '';
  const n = online(t);
  let o = R(0, 0, 470, 92, 18, ol('#E9EDF3', 6)) + R(0, 0, 470, 36, 18, { fill: '#5A6478' }) + R(0, 18, 470, 18, 0, { fill: '#5A6478' }) + TF('SYSTEM · PLAYERS ONLINE', 235, 27, 22, '#FFFFFF');
  o += T(fmt(n), 235, 78, 40, n < 1000 ? '#2EB85C' : '#E8243C');
  return G(o, `translate(40 36) scale(${f(pop(k))})`);
}
// the Lag's size: he shrinks as the players leave
function lagSize(t) {
  if (t < tMap) return 2.3;
  if (t < tPanic) return lerp(2.3, 1.7, seg(t, tMap, tPanic));
  return lerp(1.7, 1.0, seg(t, tPanic, tLast));
}

// ---------------------------------------------------------------- the flip: every screen in the world
function shotWall(t) {
  const u = seg(t, tLand + 0.3, tCU);
  const zo = ease.inOut(seg(t, tHi - 0.25, tCU - 0.2));
  let o = R(0, 0, 1920, 1080, 0, { fill: '#14101E' });
  // 2 x 2 → 4 x 4 wall of screens, each flipping from the pop-up to Juno with a stagger
  const n = zo < 0.5 ? 2 : 4;
  const kinds = ['phone', 'tv', 'laptop', 'billboard', 'tablet', 'watch', 'tv', 'phone', 'laptop', 'tv', 'phone', 'billboard', 'tv', 'laptop', 'phone', 'tablet'];
  const z = lerp(1, 0.5, zo);
  const cw = 960 * z, chh = 540 * z;
  const cols = n === 2 ? 2 : 4;
  for (let r = 0; r < cols; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    const cx = 960 + (c - (cols - 1) / 2) * cw, cy = 540 + (r - (cols - 1) / 2) * chh;
    const stagger = n === 2 ? i * 0.16 : hash(i * 3.1) * 0.5;
    const k = clamp((t - tLand - 0.05 - stagger) / 0.45, 0, 1);
    const w = cw - 30, h = chh - 30;
    const kind = kinds[i % kinds.length];
    const bg = (ww, hh) => R(-ww / 2, -hh / 2, ww, hh, 0, { fill: ['#5BC0EB', '#7ED36A', '#FFB4C8', '#B07CFF'][i % 4] }) + R(-ww / 2, hh * 0.15, ww, hh * 0.35, 0, { fill: ['#3FBF5A', '#4A9A3A', '#FF7A8A', '#6A4AC0'][i % 4] });
    let cell = R(-w / 2 - 8, -h / 2 - 8, w + 16, h + 16, 18, ol(kind === 'billboard' ? '#2A2F48' : kind === 'phone' ? '#7C5CFF' : '#1C1F28', 8));
    const id = S.uid('s10cell');
    cell += S.clipDef(id, R(-w / 2, -h / 2, w, h, 10)) + G(E.popToJuno(t, w, h, k, { bg: bg }), null, { 'clip-path': `url(#${id})` });
    o += G(cell, `translate(${f(cx)} ${f(cy)})`);
  }
  o += E.flashAt(t, tLand + 0.3, 0.7, 0.15);
  // the broadcast ripple from the centre
  const rk = seg(t, tLand + 0.3, tLand + 1.2);
  if (rk > 0 && rk < 1) o += CI(960, 540, 100 + rk * 1400, { fill: 'none', stroke: '#FFE14D', 'stroke-width': 30 * (1 - rk), opacity: f(1 - rk) });
  if (n === 4) o += G(T('EVERY SCREEN IN THE WORLD', 0, 0, 64, '#FFE14D', OUT(10)), 'translate(960 120) rotate(-3)', { opacity: f(seg(t, tHi + 0.1, tHi + 0.3)) });
  void u;
  return o;
}

// ---------------------------------------------------------------- Juno at the mic: the intimate close-up
function micBg(t, warm = 0) {
  let o = R(0, 0, 1920, 1080, 0, { fill: '#1A0A18' });
  o += CI(960, 1300, 1100, { fill: 'url(#farmGlowRed)', opacity: 0.35 + 0.1 * Math.sin(t * 2) });
  // out-of-focus tower rings + alarm bokeh
  for (let i = 0; i < 5; i++) o += R(-100, 120 + i * 210, 2120, 26, 13, { fill: '#FF2E4D', opacity: f(0.08 + 0.05 * Math.sin(t * 3 + i)) });
  for (let i = 0; i < 12; i++) {
    const x = hash(i * 3.7) * 1920, y = hash(i * 5.1) * 900, r = 40 + hash(i * 1.3) * 90;
    o += CI(x, y, r, { fill: i % 4 === 0 ? '#FFB13B' : i % 3 ? '#FF4D63' : '#5CE1FF', opacity: f(0.1 + 0.08 * Math.sin(t * 1.5 + i)) });
  }
  if (warm > 0) o += CI(1300, 500, 900, { fill: 'url(#farmGlowWarm)', opacity: f(0.35 * warm) });
  return o;
}
function mic(x, y, s, onAir = 1) {
  let o = P('M0 60 L0 900', ln(26)) + P('M0 60 L0 900', ln(14, '#9AA6C0'));
  o += G(R(-62, -120, 124, 200, 62, ol('#3A3F55', 8)) + P('M-40 -70 L40 -70 M-44 -30 L44 -30 M-44 10 L44 10 M-40 50 L40 50', ln(6, '#7A8296')) + P('M-34 -100 Q-20 -112 0 -112', ln(8, '#9AA6C0')), 'rotate(-14)');
  o += R(-40, 120, 80, 30, 10, ol('#2A2E3E', 5));
  if (onAir) o += CI(70, -150, 22, { fill: '#FF2E4D', stroke: LINE, 'stroke-width': 5 }) + CI(70, -150, 50, { fill: 'url(#farmGlowRed)', opacity: 0.7 });
  return G(o, tr(x, y, s));
}
const LINE = '#151515';
function junoCU(t, o = {}) {
  const { s = 1.3, x = 860, headY = 580, face, look, push = [1, 1], warm = 0 } = o;
  let out = micBg(t, warm);
  const fy = headY + 0.95 * 700 * s;
  const z = push[0];
  const pose = { x, y: fy, s, turn: o.turn ?? 0.12, armL: 10, armR: 10, shadow: false, ...(o.pose || {}) };
  if (face) pose.face = face;
  let j = who('juno', t, pose, { energy: o.energy ?? 0.55, arms: o.arms ?? true }, SOOT);
  // key light: warm from the ON AIR lamp (right), red rim (left)
  out += G(j, `translate(960 540) scale(${f(z)}) translate(-960 -540)`);
  out += mic(x + 470 * s / 1.3, 700 + 120 * (s - 1.3), 0.9 * s / 1.3);
  out += R(0, 0, 1920, 1080, 0, { fill: '#FFB13B', opacity: 0.05 }) + R(0, 0, 1920, 1080, 0, { fill: 'url(#vignette)' });
  return out;
}
function shotCU(t) {
  // nervous at first (looks away, fidgets), then she finds her words
  const nerv = t < tBuilder - 0.1;
  const glance = Math.sin(t * 1.7) > 0.4 ? [-0.8, 0.3] : [0.2, 0];
  const face = nerv ? { name: 'nervous', eyes: { look: glance }, fx: ['sweat'] } : { name: 'happy' };
  const z = lerp(1, 1.06, seg(t, tCU, tCity));
  return junoCU(t, { face, push: [z, 1], pose: nerv ? { armL: 40 + 8 * Math.sin(t * 7), armR: 34, headRot: -3 } : {}, arms: !nerv });
}
function shotMeToo(t) {
  const z = lerp(1.04, 1.08, seg(t, tMe, tMon));
  return junoCU(t, { face: { name: 'smallSmile' === 'x' ? 'happy' : 'happy', fx: ['blush'] }, push: [z, 1], x: 900 });
}
function shotCU2(t) {
  const z = lerp(1.0, 1.08, seg(t, tCU2, tECU));
  const firm = t > tRight - 0.15;
  return junoCU(t, { s: 1.5, headY: 520, x: 900, face: firm ? { name: 'determined' } : { name: 'happy', eyes: { look: [0, 0] } }, push: [z, 1], energy: 0.4, warm: seg(t, tCU2, tECU) * 0.5 });
}
function shotECU(t) {
  const z = lerp(1.0, 1.1, seg(t, tECU, tDad2));
  const please = M[7].word('please').t0;
  const face = t > M[7].word('phone').t0 ? { name: 'happy', eyes: { type: 'happy' }, fx: ['blush'] } : { name: 'happy', fx: t > please ? ['blush'] : [] };
  return junoCU(t, { s: 1.95, headY: 560, x: 930, face, push: [z, 1], energy: 0.3, warm: 0.6, turn: 0.05 });
}
// medium: Juno at the mic, the Lag looming behind the control wall, Grandpa and Pip at the side
function shotMonster(t) {
  const u = seg(t, tMon, tDad1);
  const cam = E.shakes(K.camKeys(t, [[tMon, camAt(3040, 520, 1.15)], [tDad1, camAt(3060, 540, 1.25)]]), t, [[tMonster, 0.5, 8]]);
  const ls = lagSize(t) * 1.15;
  const growl = bump(t, tMonster - 0.1, tMonster + 0.8);
  const lagX = 2330 + 60 * growl + 30 * Math.sin(t * 1.3);
  let chars = lagAura(t, lagX, 380, ls * 0.9, 1, 5, 8) + lagSprite(t, { x: lagX, y: 380, size: ls * 0.9, mood: growl > 0.2 ? 'angry' : 'hungry', glitch: 0.3 + 0.4 * growl, speak: false, look: [1, 0.3] });
  chars += who('grandpa', t, { x: 3360, y: FL, s: 0.46, turn: -0.3, armL: 12, armR: 20, face: 'sad', keys: true }, { arms: false });
  chars += who('pip', t, { x: CORE.button.x + 40, y: CORE.button.top - 4, s: 0.42, turn: -0.4, armL: 20, armR: 20, face: { name: 'happy', eyes: { look: [-0.8, 0] } } }, { arms: false });
  chars += who('juno', t, { x: CORE.mic.x - 130, y: FL + 10, s: 0.55, turn: 0.6, armL: 14, armR: 40 + 10 * Math.sin(t * 2) }, { energy: 0.7 }, SOOT);
  return coreShot(t, cam, { alarm: 1, timer: K.clock(secAt(t)), broadcast: 1 }, chars);
}
// cutaway: the city watching the billboard
function shotCity(t) {
  const u = seg(t, tCity, tMe);
  const cam = { zoom: lerp(1.15, 1.25, u), x: 100, y: -40 };
  const B = SETS.SCREEN_BOX.billboard;
  let o = K.view(cam, SETS.screens('billboard', 0, 0, 1, (w, h) => E.junoFeed(t, w, h), t, {}), 1);
  // kids on the pavement looking up, phones lowered
  let crowd = '';
  for (let i = 0; i < 6; i++) {
    const x = 380 + i * 230, up = seg(t, tCity + 0.3 + i * 0.25, tCity + 0.6 + i * 0.25);
    const d = (i % 2 ? K.draw.kid : K.draw.adult)(i + 30, { x, y: 1010 + (i % 2) * 20, s: 0.3, view: 'back', shade: false, armL: lerp(60, 10, up), armR: lerp(50, 10, up), headRot: lerp(8, -4, up) });
    crowd += d + (up < 0.5 ? CI(x, 1010 - 0.3 * 600, 24, { fill: '#7CF7FF', opacity: 0.35 }) : '');
  }
  o += K.view(cam, crowd, 1.2);
  void B;
  return o;
}

// ---------------------------------------------------------------- the world: Dad, Mom, the streamer
const BACKLID = (lid, glow) => {
  let o = '';
  const h = 300 * lid;
  o += P('M-300 0 L300 0 L270 -36 L-270 -36 Z', ol('#B4BECC', 7)) + R(-320, -2, 640, 20, 10, ol('#9AA5B5', 5));
  if (lid > 0.02) o = G(R(-280, -h - 30, 560, h, 22, ol('#C9D1DD', 7)) + G(CI(0, 0, 30, ol('#E9EDF3', 4)) + P('M-10 -4 L0 -16 L10 -4 L0 12 Z', { fill: '#9AA5B5' }), `translate(0 ${f(-30 - h / 2)}) scale(1 ${f(Math.max(0.1, lid))})`), null) + o;
  if (glow > 0) o = EL(0, -200, 420, 260, { fill: 'url(#farmGlowBlue)', opacity: f(glow) }) + o;
  return o;
};
function dadShot(t, phase) {
  // phase 0: the Golden Fish is on the hook (torn); phase 1: he sighs, releases it, closes the laptop
  const LR = SETS.livingRoom.layers(t, { time: 'evening', lamp: true, tvOff: true });
  const cam = phase ? K.camKeys(t, [[tDad2, camAt(900, 520, 1.75)], [tMom, camAt(920, 540, 1.85)]]) : K.camKeys(t, [[tDad1, camAt(900, 500, 1.6)], [tCU2, camAt(900, 520, 1.72)]]);
  const rel = phase ? seg(t, tDad2 + 0.25, tDad2 + 0.7) : 0;
  const close = phase ? ease.inOut(seg(t, tDad2 + 0.75, tMom - 0.05)) : 0;
  const sigh = phase ? bump(t, tDad2 - 0.05, tDad2 + 0.6) : 0;
  const face = phase ? (sigh > 0.3 ? { name: 'sad', eyes: { type: 'closed' } } : { name: 'happy' }) : { name: 'nervous', fx: ['sweat2'], eyes: { look: [0, 0.6] } };
  let w = LR.bg ? '' : '';
  const dad = K.actor('dad', t, { x: 900, y: SETS.SPOTS.livingRoom.seat.feet, s: 0.55, turn: 0.1, armL: 50, armR: 50, bodyY: 8 * sigh, headRot: phase ? -4 * sigh : 3 * Math.sin(t * 9), face, shadow: false });
  const lap = G(BACKLID(1 - close, 0.6 * (1 - close)), tr(900, 760, 0.42));
  let o = K.view(cam, LR.bg, 0.5) + K.view(cam, LR.mid + dad + LR.seat + lap, 1) + K.view(cam, LR.light, 1);
  // comic insert: what's on his screen
  const ins = phase ? 1 - seg(t, tDad2 + 0.8, tDad2 + 1.0) : pop(seg(t, tDad1 + 0.15, tDad1 + 0.45));
  if (ins > 0) {
    const w2 = 640, h2 = 360;
    let scr = R(-w2 / 2 - 14, -h2 / 2 - 14, w2 + 28, h2 + 28, 20, ol('#C9D1DD', 8));
    const id = S.uid('s10dad');
    scr += S.clipDef(id, R(-w2 / 2, -h2 / 2, w2, h2, 8)) + G(E.fishGame(w2, h2, t, { fish: 1, hooked: 1, release: rel }) + E.pip(t, w2, h2, 1), null, { 'clip-path': `url(#${id})` });
    o += G(scr, `translate(1430 330) rotate(3) scale(${f(ins * 0.95)})`);
  }
  if (phase && close > 0.95) o += K.bang('click.', 1100, 760, seg(t, tMom - 0.15, tMom - 0.05), 50, -6, '#FFFFFF');
  return o;
}
function shotMom(t) {
  const BL = SETS.bathroom.layers(t, { tablets: 3, tabletsClosed: seg(t, tMom + 0.05, tMom + 0.7), tabletScreens: [(w, h) => E.junoFeed(t, w, h, { tag: false }), (w, h) => E.junoFeed(t, w, h, { tag: false }), (w, h) => E.junoFeed(t, w, h, { tag: false })] });
  const cam = camAt(960, 640, 1.45);
  const up = seg(t, tLook - 0.1, tLook + 0.2);
  const mom = K.actor('mom', t, { ...SETS.SPOTS.bathroom.mom, armL: 60, armR: 60, headRot: -6 * up, face: up > 0.5 ? { name: 'happy', eyes: { look: [0.3, -1] } } : { name: 'neutral', eyes: { look: [0, 0.8] } }, shadow: false });
  return K.view(cam, BL.mid + mom + BL.fg + BL.light, 1);
}
function shotStreamer(t) {
  const back = seg(t, tBack - 0.1, tBack + 0.3);
  const SL = SETS.streamerRoom.layers(t, { overlay: true, viewers: Math.round(lerp(1204551, 3, ease.in(seg(t, tStr, tCls)))), lightOn: back < 0.5 });
  const cam = K.camKeys(t, [[tStr, camAt(960, 560, 1.2)], [tCls, camAt(960, 600, 1.35)]]);
  const st = K.actor('streamer', t, { ...SETS.SPOTS.streamerRoom.streamer, turn: 0, armL: lerp(20, 150, back), armR: 20, shadow: false }, { energy: 0.4, arms: false });
  let o = K.view(cam, SL.bg + SL.mid + st + SL.fg + (SL.light || ''), 1);
  // "BE RIGHT BACK" card slides over the stream
  const card = seg(t, tBack + 0.2, tBack + 0.45);
  if (card > 0) o += G(R(-420, -110, 840, 220, 30, ol('#2A2246', 8)) + T('BE RIGHT BACK', 0, 20, 84, '#FFE14D') + TF('(looking up for 10 seconds)', 0, 76, 30, '#FFFFFF'), `translate(960 ${f(lerp(-200, 470, ease.outBack(card)))}) rotate(-2)`);
  return o;
}
// ---------------------------------------------------------------- one by one: classroom, bus, grandma
function shotClass(t) {
  const off = t > tCls + 0.55;
  const CL = SETS.classroom.layers(t, { laptopOff: true });
  const cam = camAt(1150, 600, 1.4);
  const look = seg(t, tCls + 0.7, tCls + 1.0);
  const fig = K.actor('teacher', t, { ...SETS.SPOTS.classroom.teacher, turn: lerp(0.3, -0.6, look), armL: off ? 20 : 40, armR: off ? 20 : 30, face: look > 0.5 ? { name: 'happy', eyes: { look: [-1, -0.5] } } : { name: 'sad', eyes: { look: [0.3, 0.8] } }, shadow: false });
  const lid = 1 - ease.inOut(seg(t, tCls + 0.25, tCls + 0.6));
  const lap = E.laptop2(1060, 745, 0.36, (w, h) => E.junoFeed(t, w, h, { tag: false }), lid, t);
  return K.view(cam, (CL.bg || '') + CL.mid + fig + CL.fg + lap + (CL.light || ''), 1);
}
function shotBus(t) {
  const u = seg(t, tBus, tGran);
  let o = SETS.screens('billboard', 0, 0, 1, (w, h) => E.junoFeed(t, w, h), t, {});
  o += E.bus(t, lerp(1100, 980, u), 980, 1.0, seg(t, tBus + 0.05, tGran - 0.1));
  return K.view({ zoom: 1.12, x: 60, y: 60 }, o, 1);
}
function shotGran(t) {
  const u = seg(t, tGran, tMap);
  let o = R(0, 0, 1920, 1080, 0, { fill: '#F4D9B8' }) + R(0, 0, 1920, 1080, 0, { fill: 'url(#wallStripes)', opacity: 0.5 });
  // window with the sunset
  o += R(1160, 140, 560, 480, 14, ol('#FFFDF4', 10)) + R(1180, 160, 520, 440, 6, { fill: '#FFB86B' }) + CI(1440, 520, 90, { fill: '#FFF1C4' }) + R(1180, 470, 520, 130, 0, { fill: '#E8805A', opacity: 0.6 }) + P('M1440 160 L1440 600 M1180 380 L1700 380', ln(10, '#FFFDF4'));
  o += R(0, 820, 1920, 260, 0, { fill: '#B87A44' }) + R(0, 820, 1920, 16, 0, { fill: '#8A5530' });
  // armchair back
  o += R(470, 380, 800, 760, 110, ol('#C04A6A', 8)) + R(520, 430, 700, 600, 90, { fill: '#D85A7A' });
  const close = seg(t, tGran + 0.45, tGran + 0.9);
  const look = seg(t, tGran + 0.95, tGran + 1.3);
  const tab = G(R(-110, -150, 220, 150, 14, ol('#2A2F3C', 6)) + (close < 0.5 ? G(E.junoFeed(t, 196, 128, { tag: false }), 'translate(0 -75)') : R(-98, -139, 196, 128, 6, { fill: '#C04A6A' })), `translate(${f(870)} ${f(1010)}) scale(1.5 ${f(1.5 * (1 - close * 0.5))})`);
  o += K.draw.adult(76, { x: 870, y: 1500, s: 0.85, turn: lerp(0, 0.5, look), armL: 60, armR: 60, headRot: -6 * look, face: look > 0.5 ? { name: 'happy', eyes: { look: [1, -0.6] } } : { name: 'happy', eyes: { look: [0, 0.8] } }, shadow: false });
  o += tab;
  o += K.draw.cat ? '' : '';
  o += SETS.cat ? SETS.cat(1500, 860, 0.8, t, { pose: 'sit' }) : '';
  return K.view({ zoom: lerp(1, 1.06, u), x: 0, y: 0 }, o, 1);
}
// ---------------------------------------------------------------- the count: the Core map, astronaut, Earth, phone, city
function shotMap(t) {
  const u = seg(t, tMap, tAst);
  let o = R(0, 0, 1920, 1080, 0, { fill: '#05070F' });
  const n = online(t);
  o += F.worldMap(160, 120, 1600, 900, t, { dots: clamp(n / 812e6, 0.05, 1), spam: n > 5e8 ? true : ['come back...', 'brb', 'looking up'], online: fmt(n) });
  // the Lag reflected/peeking at the side, worried
  o += lagSprite(t, { x: 1880, y: 760, size: 1.3, mood: 'scared', glitch: 0.4, speak: false, look: [-1, -0.3] });
  return K.view({ zoom: lerp(1, 1.08, u), x: 0, y: 0 }, o, 1);
}
function shotAstro(t) {
  const u = seg(t, tAst, tEarth);
  let o = SETS.earth(t, { night: 0.6 });
  o = G(o, 'translate(960 1500) scale(1.9) translate(-960 -560)');
  // station module with a porthole
  let st = R(-520, -170, 1040, 340, 60, ol('#E9EDF3', 8)) + R(-520, -40, 1040, 30, 0, { fill: '#C9D1DD' });
  for (const sx of [-1, 1]) st += G(R(-150, -60, 300, 120, 6, ol('#2E5BD8', 6)) + P('M-150 0 L150 0 M-50 -60 L-50 60 M50 -60 L50 60', ln(4, '#7AA2FF')), `translate(${sx * 760} 0)`) + R(sx > 0 ? 520 : -610, -14, 90, 28, 6, ol('#C9D1DD', 5));
  const id = S.uid('s10port');
  const close = seg(t, tAst + 0.35, tAst + 0.8);
  let inside = R(-170, -170, 340, 340, 0, { fill: '#2A3050' }) + E.laptop2(-20, 120, 0.42, (w, h) => E.junoFeed(t, w, h, { tag: false }), 1 - close, t);
  inside += K.draw.adult(5, { x: 40, y: 280, s: 0.36, rot: 14 + 6 * Math.sin(t * 1.5), turn: -0.4, armL: 70, armR: 80, face: close > 0.6 ? { name: 'happy', eyes: { look: [1, -0.5] } } : { name: 'neutral', eyes: { look: [-0.5, 0.5] } }, shadow: false });
  if (close < 0.9) inside += CI(-20, 60, 120, { fill: '#7CF7FF', opacity: f(0.15 * (1 - close)) });
  st += CI(0, 0, 160, ol('#C9D1DD', 12)) + S.clipDef(id, CI(0, 0, 140)) + G(inside, null, { 'clip-path': `url(#${id})` }) + CI(0, 0, 140, { fill: 'none', stroke: LINE, 'stroke-width': 8 }) + P('M-90 -80 Q-60 -110 -20 -116', ln(10, '#FFFFFF', 0.5));
  o += G(st, `translate(${f(960 + 30 * Math.sin(t * 0.6))} ${f(470 + 12 * Math.sin(t * 0.8))}) rotate(${f(-4 + 2 * u)}) scale(1.45)`);
  return o;
}
function shotEarth(t) {
  const u = seg(t, tEarth, tPhone);
  const o = SETS.earth(t, { lightsOut: ease.inOut(u) * 0.95, spin: 0.08 });
  return G(o, `translate(960 560) scale(${f(lerp(1.15, 1.3, u))}) translate(-960 -560)`);
}
function shotPhone(t) {
  const off = t > tPhone + 0.45;
  const lower = ease.inOut(seg(t, tPhone + 0.7, tNight));
  let o = R(0, 0, 1920, 1080, 0, { fill: off ? '#2A1A3A' : '#0E1020' });
  // window behind with the sunset showing through as the phone lowers
  o += R(560, 120, 800, 620, 12, ol('#3A2A4A', 10)) + R(580, 140, 760, 580, 4, { fill: off ? '#FF9A5A' : '#1A1830' });
  if (off) o += CI(960, 600, 120, { fill: '#FFE3A3', opacity: 0.9 }) + CI(960, 600, 300, { fill: 'url(#farmGlowWarm)', opacity: 0.6 });
  o += SETS.screens('phone', 960, lerp(560, 1280, lower), 1.05, (w, h) => E.junoFeed(t, w, h), t, { off });
  if (!off) o += CI(960, 540, 700, { fill: '#7CF7FF', opacity: 0.08 });
  return o;
}
// city at dusk: windows go dark one by one, then the billboard
function shotNight(t) {
  const u = seg(t, tNight, tPanic - 0.1);
  let o = R(0, 0, 1920, 1080, 0, { fill: '#2A1E4A' }) + R(0, 600, 1920, 480, 0, { fill: '#3A2A5A' });
  for (let i = 0; i < 18; i++) o += CI(hash(i * 3.1) * 1920, 40 + hash(i * 7.3) * 300, 2.5, { fill: '#FFFFFF', opacity: 0.5 + 0.4 * Math.sin(t * 2 + i) });
  let lit = '', dark = '';
  const B = [[60, 420, 260], [340, 300, 220], [580, 460, 200], [800, 260, 260], [1080, 380, 220], [1320, 320, 240], [1580, 440, 300]];
  B.forEach(([x, top, w], bi) => {
    o += R(x, top, w, 1080 - top, 6, ol('#1E1638', 6));
    for (let r = 0; r * 70 + top + 30 < 1000; r++) for (let c = 0; c * 60 + 20 < w - 30; c++) {
      const wx = x + 20 + c * 60, wy = top + 30 + r * 70;
      const off = hash(bi * 31 + r * 7 + c * 3) < u * 1.15;
      const d = `M${wx} ${wy}h36v44h-36Z`;
      if (off) dark += d; else lit += d;
    }
  });
  o += P(lit, { fill: '#FFD86A' }) + P(dark, { fill: '#2A2046' });
  o += R(0, 1000, 1920, 80, 0, { fill: '#140E26' });
  return K.view({ zoom: lerp(1.0, 1.06, u), x: 0, y: 0 }, o, 1);
}
// ---------------------------------------------------------------- the Lag panics
function shotPanic(t) {
  const u = seg(t, tPanic, tWatch);
  const la = E.lowAngle(t, { alarm: 1, lamps: 0, lowRes: 0.2 });
  const sz = lagSize(t) * 1.15;
  let mid = E.slurp(t, [[560, 1060], [1360, 1080], [1700, 860], [240, 880]], 960, 520, { w: 42, drop: ease.in(u) });
  mid += lagAura(t, 960, 420, sz, 1, 3, 8) + lagSprite(t, { x: 960 + K.rubber(t, M[12].word('no', 1).t0, 0.5, 50, 3), y: 420, size: sz, mood: 'scared', glitch: 0.5, look: [0, 0.3], fps: 6 });
  return la.bg + K.view({ zoom: lerp(1.05, 1.15, u), x: 0, y: 0 }, mid, 1) + la.fg;
}
function shotWatch(t) {
  const u = seg(t, tWatch, tBeg);
  const cam = K.camKeys(t, [[tWatch, camAt(1300, 480, 1.0)], [tBeg, camAt(1340, 470, 1.05)]]);
  const n = online(t);
  const back = lagSprite(t, { x: 300, y: 380, size: lagSize(t), mood: 'scared', glitch: 0.5, look: [1, 0.2], fps: 6 }) + lagAura(t, 300, 380, lagSize(t), 0.7, 2, 6);
  let chars = who('juno', t, { x: 1150, y: FL, s: 0.5, view: 'back', turn: 0, armL: 10, armR: 10 }, { arms: false }) + who('grandpa', t, { x: 1430, y: FL, s: 0.5, view: 'back', armL: 10, armR: 12 }, { arms: false }) + who('pip', t, { x: 1290, y: FL, s: 0.5, view: 'back', armL: 15, armR: 15 }, { arms: false });
  return coreShot(t, cam, { alarm: 1, timer: K.clock(secAt(t)), dots: 0.02, spam: false, broadcast: 1 }, chars, { back, backK: 0.7, count: fmt(n) });
}
function shotBeg(t) {
  const u = seg(t, tBeg, tLast);
  const cam = K.camKeys(t, [[tBeg, camAt(560, 520, 1.25)], [tLast, camAt(520, 520, 1.35)]]);
  const sz = lagSize(t);
  const lx = lerp(980, 820, u), ly = 520;
  const reach = Math.sin(t * 3) * 10;
  let back = '';
  let chars = lagAura(t, lx, ly, sz, 0.8, 7, 6) + lagSprite(t, { x: lx, y: ly + reach, size: sz, mood: 'scared', glitch: 0.6, look: [-1, -0.5], fps: 5 });
  return coreShot(t, cam, { alarm: 1, timer: K.clock(secAt(t)), dots: 0.02, spam: ['play...', 'one...', 'more...'], broadcast: 1 }, chars, { back, count: fmt(online(t)) });
}
function shotLast(t) {
  const n = online(t);
  const offK = seg(t, tZero + 0.25, tZero + 0.75);
  let o = R(0, 0, 1920, 1080, 0, { fill: '#05070F' });
  o += F.worldMap(160, 120, 1600, 900, t, { dots: n > 0 ? 0.02 : 0, spam: false, online: fmt(n), off: offK });
  // CRT switch-off line
  if (offK > 0.5) { const k = (offK - 0.5) * 2; o += R(0, 0, 1920, 1080, 0, { fill: '#000', opacity: f(k) }) + R(960 - 900 * (1 - k), 536, 1800 * (1 - k), 8, 4, { fill: '#FFFFFF', opacity: f(1 - k) }); }
  return K.view({ zoom: lerp(1.0, 1.12, seg(t, tLast, tZero)), x: 0, y: 0 }, o, 1);
}
// ---------------------------------------------------------------- silence: the world looks up
function birds(t, x0, y0, n, s = 1) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + i * 90 * s + t * 60 * s, y = y0 + Math.sin(i * 1.7) * 40 * s + Math.sin(t * 2 + i) * 8;
    const fl = Math.sin(t * 9 + i) * 14;
    o += P(`M${f(x - 22 * s)} ${f(y - fl * s * 0.5)} Q${f(x - 10 * s)} ${f(y - 12 * s)} ${f(x)} ${f(y)} Q${f(x + 10 * s)} ${f(y - 12 * s)} ${f(x + 22 * s)} ${f(y - fl * s * 0.5)}`, ln(5 * s, '#3A2440'));
  }
  return o;
}
function shotSunset(t) {
  const u = seg(t, tSil, tSil2);
  const PL = SETS.porch.layers(t, { sunset: 0.55, phones: 3 });
  const cam = { zoom: 1.0, x: lerp(120, 160, u), y: lerp(-80, -60, u) };
  let ch = K.actor('dad', t, { x: 520, y: 870, s: 0.44, turn: 0.5, armL: 10, armR: 40, headRot: -8, face: { name: 'happy', eyes: { look: [1, -1] } }, shadow: true });
  ch += K.actor('mom', t, { x: 730, y: 870, s: 0.42, turn: 0.4, armL: 40, armR: 10, headRot: -8, face: { name: 'happy', eyes: { look: [1, -1] } }, shadow: true });
  return K.view(cam, PL.bg, 0.4) + K.view(cam, PL.mid + ch + birds(t - tSil, 1100, 260, 5), 1) + K.view(cam, PL.light || '', 1);
}
function shotWindows(t) {
  const u = seg(t, tSil2, tSil3);
  let o = R(0, 0, 1920, 1080, 0, { fill: '#FF9A5A' }) + R(0, 0, 1920, 1080, 0, { fill: 'url(#setsPorchSky1)', opacity: 0.6 });
  // apartment facade with three windows: families looking up at the sky; a kid hugging a dog
  o += R(160, 160, 1600, 1000, 10, ol('#E8A07A', 10)) + R(160, 160, 1600, 1000, 10, { fill: 'url(#setsSiding2)', opacity: 0.4 });
  const W = [[300, 300], [800, 300], [1300, 300]];
  W.forEach(([x, y], i) => {
    const id = S.uid('s10win');
    let inside = R(x, y, 380, 420, 0, { fill: '#FFD9A0' }) + R(x, y, 380, 420, 0, { fill: '#5A3A6A', opacity: 0.35 });
    inside += K.draw.adult(i * 3 + 40, { x: x + 120, y: y + 560, s: 0.4, shade: false, headRot: -10, face: { name: 'happy', eyes: { look: [0.3, -1] } }, shadow: false });
    inside += K.draw.kid(i * 5 + 41, { x: x + 270, y: y + 560, s: 0.36, shade: false, headRot: -10, armL: i === 1 ? 60 : 10, armR: 10, face: { name: 'happy', eyes: { look: [-0.3, -1] } }, shadow: false });
    if (i === 1) inside += G(EL(0, 0, 70, 46, ol('#C98A52', 6)) + CI(-60, -30, 40, ol('#C98A52', 6)) + EL(-86, -50, 14, 24, ol('#8A5530', 5)) + CI(-74, -36, 6, { fill: LINE }) + P('M-96 -18 Q-86 -10 -78 -16', ln(4)), tr(x + 230, y + 330, 0.9));
    o += S.clipDef(id, R(x, y, 380, 420)) + G(inside, null, { 'clip-path': `url(#${id})` }) + R(x - 14, y - 14, 408, 448, 10, { fill: 'none', stroke: '#FFFDF4', 'stroke-width': 24 }) + R(x - 14, y - 14, 408, 448, 10, { fill: 'none', stroke: LINE, 'stroke-width': 5 }) + R(x - 30, y + 430, 440, 30, 6, ol('#FFFDF4', 5));
  });
  o += birds(t - tSil2, 200, 140, 6, 1.1);
  o += R(0, 0, 1920, 1080, 0, { fill: '#FF8A4C', opacity: 0.12 });
  return K.view({ zoom: lerp(1.0, 1.04, u), x: 0, y: 40 }, o, 1);
}
function shotFarmOut(t) {
  const u = seg(t, tSil3, tStep);
  const cam = { zoom: lerp(1.12, 1.25, u), x: 160, y: 120 };
  const Ly = F.farmExterior(t, { cam, sunset: 1, storm: 0, grass: 0.6, doorOpen: 1 });
  const dx = lerp(980, 1180, ease.out(u));
  const dex = runSide('dex', t, dx, F.FARM.floor, 0.22, { rate: 8, amp: 0.4, lean: 0, act: { face: { name: 'amazed' } } });
  return Ly.bg + Ly.mid + K.view(cam, dex, 1) + Ly.fg + Ly.light;
}
// ---------------------------------------------------------------- Dex: real grass → the badge
function grassBlades(t, y0, n, h, seed = 0, col = '#4CC35E') {
  let o = '';
  for (let i = 0; i < n; i++) {
    const x = (i / n) * 2000 - 40 + hash(i * 3.3 + seed) * 40, hh = h * (0.6 + 0.6 * hash(i * 1.7 + seed)), sw = Math.sin(t * 1.6 + i * 0.7) * 12;
    o += P(`M${f(x - 16)} ${y0} Q${f(x + sw * 0.5)} ${f(y0 - hh * 0.6)} ${f(x + sw)} ${f(y0 - hh)} Q${f(x + 6)} ${f(y0 - hh * 0.5)} ${f(x + 18)} ${y0} Z`, ol(i % 3 ? col : '#7BDB5A', 4));
  }
  return o;
}
function shotStep(t) {
  const u = seg(t, tStep, tBadge);
  let o = R(0, 0, 1920, 1080, 0, { fill: 'url(#farmSkySunset)' });
  o += CI(1500, 520, 320, { fill: 'url(#farmSunGlow)', opacity: 0.9 }) + CI(1500, 560, 110, { fill: '#FFE3A3' });
  o += P('M0 760 Q500 700 960 740 Q1400 700 1920 760 L1920 1080 L0 1080 Z', { fill: '#C98A50' });
  o += grassBlades(t, 1080, 30, 260, 2, '#3FAE55') + R(0, 1000, 1920, 80, 0, { fill: '#2E8A45' });
  // the sneaker comes down onto the grass
  const down = ease.out(seg(t, tStep, tStep + 0.45));
  const dex = K.actor('dex', t, { x: 1000, y: lerp(820, 1010, down), s: 2.6, view: 'side', flip: true, legL: lerp(30, 0, down), kneeL: lerp(40, 4, down), legR: -10, kneeR: 10, shade: false, shadow: false, face: 'amazed' }, { arms: false });
  o += G(dex, null);
  o += grassBlades(t, 1090, 24, 200, 7, '#58CC62');
  if (down > 0.95) o += K.sparkles([[880, 960, 30], [1180, 940, 24], [1040, 880, 18]], t);
  return K.view({ zoom: lerp(1.0, 1.05, u), x: 0, y: 0 }, o, 1);
}
function shotBadge(t) {
  const u = seg(t, tBadge, tDefl);
  let o = R(0, 0, 1920, 1080, 0, { fill: 'url(#farmSkySunset)' }) + CI(1520, 620, 360, { fill: 'url(#farmSunGlow)', opacity: 0.9 });
  o += P('M0 900 Q500 860 960 880 Q1400 860 1920 900 L1920 1080 L0 1080 Z', { fill: '#C98A50' });
  o += who('dex', t, { x: 960, y: 1420, s: 1.0, turn: 0.1, armL: 20 + 30 * u, armR: 20 + 30 * u, face: { name: 'amazed', eyes: { type: 'star' }, fx: ['sparkles'] }, shadow: false }, { arms: false, energy: 0.3 });
  o += R(0, 0, 1920, 1080, 0, { fill: '#FF9A4D', opacity: 0.12 });
  const bk = seg(t, M[14].word('badge').t0 - 0.35, M[14].word('badge').t0 + 0.05);
  o += K.badge(960, 170, 'TOUCH GRASS', 'BADGE EARNED!', bk, t);
  if (bk > 0) o += K.confetti(t, M[14].word('badge').t0 - 0.2, 40, 4);
  return o;
}

// ---------------------------------------------------------------- router
function scene(t) {
  E.STATE.wall = false;
  if (t < tP) return E.shotMinute(t, '10.0');
  if (t < tG) return E.shotPress(t, '10.1', { timer: K.clock(secAt(t)) });
  if (t < tWall) return E.shotDing(t, '10.2', { timer: K.clock(secAt(t)) });
  if (t < tCU) return shotWall(t);
  if (t < tCity) return shotCU(t) + E.flashAt(t, tCU, 0.3);
  if (t < tMe) return shotCity(t);
  if (t < tMon) return shotMeToo(t);
  if (t < tDad1) return shotMonster(t);
  if (t < tCU2) return dadShot(t, 0);
  if (t < tECU) return shotCU2(t);
  if (t < tDad2) return shotECU(t);
  if (t < tMom) return dadShot(t, 1);
  if (t < tStr) return shotMom(t);
  if (t < tCls) return shotStreamer(t);
  let o;
  if (t < tBus) o = shotClass(t);
  else if (t < tGran) o = shotBus(t);
  else if (t < tMap) o = shotGran(t);
  else if (t < tAst) o = shotMap(t);
  else if (t < tEarth) o = shotAstro(t);
  else if (t < tPhone) o = shotEarth(t);
  else if (t < tNight) o = shotPhone(t);
  else if (t < tPanic) o = shotNight(t);
  else if (t < tWatch) return shotPanic(t);
  else if (t < tBeg) return shotWatch(t);
  else if (t < tLast) return shotBeg(t);
  else if (t < tSil) return shotLast(t);
  else if (t < tSil2) return shotSunset(t);
  else if (t < tSil3) return shotWindows(t);
  else if (t < tStep) return shotFarmOut(t);
  else if (t < tBadge) return shotStep(t);
  else if (t < tDefl) return shotBadge(t);
  else return E.shotDeflate(t, tDefl, { timer: K.clock(secAt(t)) });
  // montage: the SYSTEM counter in the corner
  return o + counterTag(t, t >= tAst ? seg(t, tAst, tAst + 0.25) : 0);
}

function timer(t) {
  if (E.STATE.wall) return null;
  if (t < tP) return { sec: secAt(t), glitch: t < tMinute ? 0.6 : 0.3 };
  if (t < tWall) return { sec: secAt(t), glitch: 0.25 };
  if (t >= tSil && t < tDefl) return null;                  // the silence + Dex's badge: nothing on screen but the world
  if (t >= tDefl) return null;                              // the wall timer is in shot
  if (t >= tCU2 && t < tDad2) return null;                   // the most intimate close-ups: just her
  if (t >= tWatch && t < tLast) return null;                 // the wall timer is in shot
  return { sec: secAt(t), glitch: t >= tPanic ? 0.5 : 0 };
}
const look = (t) => {
  if (t >= tSil && t < tDefl) return { grade: 'warm', vignette: 0.7 };
  if (t >= tDad1 && t < tCU2) return { grade: 'warm', vignette: 0.8 };
  if (t >= tDad2 && t < tPanic && !(t >= tMap && t < tAst)) return { grade: 'warm', vignette: 0.8 };
  return { grade: 'cool', vignette: 1 };
};
const captionY = (t) => 1010;

module.exports = { scene, timer, look, captionY, secAt, online };
