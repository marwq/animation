// SC 07 · ПАПА ВСЕХ ИГРОКОВ — everybody's Dad (the lobby at sunset, the first obby over water).
// Whip in from Tycoon Valley; the hot dog still on STAGE 1 ("And Dad?"), the jump guide over the gap, the time-lapse to
// 2:47:00 + FALLS 198; "Okay. Space... bar." (Dad's arm over his real keyboard, the press) -> a tiny hop -> SPLASH; "Space...
// BAR!" (split: real Dad yelling | respawn + run-up) -> the leap, the cartoon hang, SPLASH 2 (FALLS 200); he sits down on the
// edge; the noobs spawn and gather; "You can do it, kiddo!" / thumbs up / the honest rain cloud / the noob's jump -> Dad's
// dance + three jump panels; the stand-up joke in a spotlight (confused noobs, a cube tumbleweed, "Like me!" + rimshot ->
// the LOL flood); the crate speech (heroic low angle, the crowd's faces, FALLS 200 slammed); the time-lapse to deep sunset;
// the whole server calls him DAD (chat flood, his nametag becomes DAD); the KID tugs his sleeve: "Can you be my dad too?";
// split real Dad touched | hot dog kneeling; the group hug; Noodle on the crate ("My dad never plays with me"); the hero
// alone at the far side of the plaza: "...He's MY dad." -> match cut to the real hero at his PC, the family laughing.
'use strict';

const K = require('./kit');
const G = require('./gameui');
const R = require('./respawn');
const GS = require('./sets_game');
const H = require('./sets_house');
const X = require('../rig/extras');
const AC = require('./acting');
const CAST = require('../rig/cast');
const E = require('./s07_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const { tf, TS, TFS, pop, shakeAll, boing, whip, smash, zoomLines, panel, splash, bubbles, drumKit, mic, glassesProp, dadArm, heartPop, noob, NOOB_I } = E;
const SP = GS.SPOTS.plaza, camAt = GS.camAt;

const A = Array.from({ length: 12 }, (_, i) => L('07.' + i));
const T0 = K.V.scene('SC 07').start, END = K.V.scene('SC 08').start;    // == main.js RANGES for SC 07
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const w1 = (i, word, n = 0) => A[i].word(word, n).t1;

// ---------------------------------------------------------------- the cut list (all from the voice)
const CUT = {};
CUT.open = T0;
CUT.edge = w(0, 'Dad', 1) - 0.12;
CUT.lapse = w(0, 'For') - 0.1;
CUT.okay = A[1].a - 0.15;
CUT.key = w(1, 'Space') - 0.1;
CUT.hop1 = w(1, 'bar') + 0.12;
CUT.yell = w(1, 'Space', 1) - 0.1;
CUT.leap = w(1, 'bar', 1) - 0.14;
// in-shot beats of the two falls
const tPress1 = w(1, 'bar');
const tHop1 = CUT.hop1 + 0.04, tTopple1 = tHop1 + 0.42, tSplash1 = tTopple1 + 0.3;
const tResp1 = CUT.yell + 0.08;
const tLeap = w(1, 'bar', 1) + 0.02, tApex = tLeap + 0.34, tDrop = tApex + 0.62, tSplash2 = tDrop + 0.3;
CUT.sit = Math.max(tSplash2 + 0.72, A[2].a - 0.3);
const tResp2 = CUT.sit + 0.1;
CUT.gather = w(2, 'The') - 0.15;
CUT.kiddo = A[3].a - 0.2;
CUT.believe = w(3, 'I') - 0.1;
CUT.notme = w(3, 'I', 1) - 0.1;
CUT.jump = w(3, 'but') - 0.1;
const tJump = w1(3, 'you', 2) - 0.25, tLandJ = tJump + 0.5;
CUT.cheer = A[4].a - 0.25;
CUT.jokes = w(4, 'He', 1) - 0.12;
CUT.punch = w(5, 'He') - 0.12;
CUT.deadpan = w(5, 'lobby') + 0.05;
CUT.likeme = w(5, 'Like') - 0.1;
const tRim = w1(5, 'me') + 0.02;
CUT.lol = tRim + 0.22;
CUT.crate = A[6].a - 0.2;
CUT.notfail = w(6, 'Falling') - 0.12;
CUT.trying = w(6, 'Failing', 1) - 0.12;
CUT.fell = w(6, 'I') - 0.12;
CUT.sunset = A[7].a - 0.02;
CUT.dadname = w(7, 'the') - 0.1;
CUT.tug = A[8].a - 0.55;
CUT.kidcu = w(8, 'Can') - 0.15;
CUT.ofc = A[9].a - 0.15;
CUT.everyb = w(9, 'Everybody') - 0.12;
CUT.noodle = A[10].a - 0.2;
CUT.nodad = w(10, 'My') - 0.15;
CUT.far = A[10].b + 0.1;
CUT.mine = A[11].a - 0.15;
CUT.real = A[11].b + 0.3;
{
  const ks = Object.keys(CUT);
  for (let i = 1; i < ks.length; i++) if (CUT[ks[i]] < CUT[ks[i - 1]] + 0.2) CUT[ks[i]] = CUT[ks[i - 1]] + 0.2;
}
const tDadName = w(7, 'Dad');

// ---------------------------------------------------------------- the HUD: TIME ON STAGE 1 + FALLS
const tFF0 = w(0, 'For'), tFF1 = w(0, 'hours') + 0.05;
const SEC0 = 2 * 3600 + 47 * 60;
const tSun0 = A[7].a, tSun1 = w1(7, 'sunset');
const SEC_SUN = 4 * 3600 + 12 * 60 + 9;
function timerSec(t) {
  if (t < tFF0) return 0;
  if (t < tFF1) return SEC0 * ease.inOut(seg(t, tFF0, tFF1));
  const s1 = SEC0 + (tSun0 - tFF1);
  if (t < tSun0) return SEC0 + (t - tFF1);
  if (t < tSun1) return lerp(s1, SEC_SUN, ease.inOut(seg(t, tSun0, tSun1)));
  return SEC_SUN + (t - tSun1);
}
function falls(t) {
  if (t < tFF0) return 0;
  if (t < tFF1) return Math.floor(198 * ease.inOut(seg(t, tFF0, tFF1)));
  return 198 + (t >= tSplash1 ? 1 : 0) + (t >= tSplash2 ? 1 : 0);
}
const dropIcon = S.circle(0, 0, 33, { fill: '#1E4A7A', stroke: '#151515', 'stroke-width': 4 }) + S.path('M0 -20 Q16 2 14 10 A14 14 0 0 1 -14 10 Q-16 2 0 -20 Z', ol('#5BD0FF', 3.5)) + S.circle(-5, 6, 4, { fill: '#FFFFFF' });
function hud(t, o = {}) {
  const k = o.k ?? 1;
  if (k <= 0) return '';
  const s = o.s ?? 0.78, x = o.x ?? 34, y = o.y ?? 62;
  const fb = Math.max(seg(t, tSplash1, tSplash1 + 0.45) < 1 && t >= tSplash1 ? seg(t, tSplash1, tSplash1 + 0.45) : 0, t >= tSplash2 && t < tSplash2 + 0.45 ? seg(t, tSplash2, tSplash2 + 0.45) : 0, o.fallBump || 0);
  return G.timerHUD({ x, y, s, k, t, sec: timerSec(t), label: 'TIME ON STAGE 1', anchor: 'left' }) +
    G.statPill({ x, y: y + 84 * s / 0.78 * (o.gap ?? 1), s: s * (o.fs ?? 1), k, t, icon: dropIcon, label: 'FALLS', value: falls(t), rim: '#5BD0FF', bump: fb });
}

// chat bubble with its tail tip at world point (wx, wy) seen through cam; drawn in screen space, kept inside the frame
function sBubble(cam, wx, wy, o = {}) {
  const q = GS.toScreen(cam, wx, wy);
  return G.chatBubble({ s: 1, ...o, tail: 0, x: clamp(q.x + (o.dx || 0), o.caps ? 420 : 330, o.caps ? 1500 : 1590), y: clamp(q.y + (o.dy || 0), o.minY ?? (o.caps ? 300 : 230), 880) });
}
// ---------------------------------------------------------------- actors
const DS = 0.4;                                     // the hot dog on the plaza floor / start block
const EDGE = { x: 2832, y: SP.start.y };            // Dad's feet at the edge of the start block
const dad = (t, pose, act) => actor('dadAvatar', t, { s: DS, ...pose }, act);
const KID0 = (t, pose, act) => actor('kid', t, { i: 0, t, ...pose }, act);
const sAt = (y) => 0.4 * (y - 420) / 520;
// avatar silent face (the real Dad speaks; the avatar keeps a still mouth unless we want lip-sync)
const still = (name, extra = {}) => ({ name, mouth: name === 'joy' ? 'bigGrin' : name === 'sad' ? 'frown' : 'smile', ...extra });

// fast-forwarded Dad: walk off the edge, fall, pop back (u = phase 0..1 of one attempt)
function ffDad(t, u) {
  const out = { behind: '', over: '' };
  if (u < 0.38) {
    const k = u / 0.38;
    out.over = dad(t, { x: lerp(2700, 2930, k), y: EDGE.y, view: 'side', flip: true, ...AC.walk(u * 40), nametag: false, face: still('determined') }, { arms: false });
  } else if (u < 0.7) {
    const k = (u - 0.38) / 0.32;
    out.behind = dad(t, { x: 2930 + 80 * k, y: EDGE.y + 700 * k * k, view: 'side', flip: true, rot: 40 * k, nametag: false, face: still('shocked'), armL: 150, armR: 150 }, { arms: false });
  }
  return out;
}

// ---------------------------------------------------------------- shots
// 1. "And Dad?" — whip in from Tycoon Valley: tilt down from the sunset sky onto the tiny hot dog on the edge
function shOpen(t) {
  const cam = camKeys(t, [[T0, { x: 1700, y: -560, zoom: 0.8 }], [w1(0, 'Dad') + 0.2, camAt(2930, 480, 0.8)], [CUT.edge, camAt(2940, 490, 0.86)]], ease.inOut);
  const sway = Math.sin(t * 2.2) * 3;
  const ch = dad(t, { x: EDGE.x, y: EDGE.y, turn: 0.6, rot: sway, face: still('determined'), armL: 10 + 6 * Math.sin(t * 3), armR: 10 }, { arms: false });
  let o = E.plaza(t, cam, {}, '', ch);
  const q = GS.toScreen(cam, EDGE.x, EDGE.y - 560);
  o += K.bang('?', q.x + 30, q.y - 20, pop(t, w(0, 'Dad'), 0.3) * (1 - seg(t, CUT.edge - 0.3, CUT.edge)), 120, 8, '#FFFFFF');
  return o + (t < T0 + 0.32 ? K.C.pixelWipe(seg(t, T0, T0 + 0.32), 'reveal') : '');
}

// 2. "Dad was still trying the first jump." — at the edge, peeking down; the jump guide arc over the gap
function shEdge(t) {
  const cam = camKeys(t, [[CUT.edge, camAt(2985, 500, 1.36)], [CUT.lapse, camAt(2995, 490, 1.48)]], ease.inOut);
  const peek = bump(t, CUT.edge + 0.3, w(0, 'jump') + 0.1);
  const rock = Math.sin(t * 5) * 6 * (1 - peek);
  const ch = dad(t, { x: EDGE.x + 6 * peek, y: EDGE.y, turn: 0.6, rot: 9 * peek + rock * 0.3, headRot: 10 * peek, face: still(peek > 0.4 ? 'shocked' : 'determined', { fx: peek > 0.4 ? ['sweat'] : [], eyes: { look: [0.6, 0.6 * peek] } }), armL: 25 + 40 * peek, armR: 25 + 40 * peek, nametag: false }, { arms: false });
  // dashed jump arc + arrow
  const gk = seg(t, w(0, 'first') - 0.1, w(0, 'jump') + 0.25);
  let guide = '';
  if (gk > 0) {
    const x0 = 2925, x1 = 3205, y0 = 660, top = 470;
    const n = 14, m = Math.floor(n * gk);
    let d = '';
    for (let i = 0; i < m; i++) { const u = i / n, x = lerp(x0, x1, u), y = y0 - 4 * (y0 - top) * u * (1 - u) + (u * u) * 6; d += `M${f(x)} ${f(y)} m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0`; }
    guide += S.path(d, { fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 3 });
    if (gk >= 1) guide += S.g(S.path('M-28 -18 L0 22 L28 -18 Z', ol('#FFD23F', 5)) + TS('JUMP!', 0, -36, 40, '#FFD23F'), tf(x1, 600 + 8 * Math.sin(t * 8), pop(t, w(0, 'jump') + 0.25, 0.25)));
  }
  return E.plaza(t, cam, {}, '', ch, guide);
}

// 3. "For almost three hours." — time-lapse: ▶▶ fast-forward falls, the clock rolls to 2:47:00, FALLS 198
function shLapse(t) {
  const cam = camKeys(t, [[CUT.lapse, camAt(3120, 545, 1.1)], [CUT.okay, camAt(3060, 535, 1.16)]], ease.inOut);
  const ff = t < tFF1;
  const tSet = ff ? t + 40 * (t - CUT.lapse) : t + 40 * (tFF1 - CUT.lapse);
  let behind = '', chars = '', over = '';
  if (ff) {
    const u0 = (t - CUT.lapse) * 2.6;
    const u = u0 % 1;
    const p = ffDad(t, u);
    behind += p.behind; chars += p.over;
    // splash of the current (and previous) attempt
    const sa = (u - 0.62) / 2.6;
    over += splash(SP.water.splash.x, SP.water.y, sa >= 0 ? sa : sa + 1 / 2.6, 0.55, Math.floor(u0));
    // ghost trail
    const pg = ffDad(t, (u + 0.85) % 1);
    behind += S.g(pg.behind, null, { opacity: 0.35 }); chars += S.g(pg.over, null, { opacity: 0.35 });
  } else {
    const gasp = Math.abs(Math.sin(t * 7));
    chars += dad(t, { x: EDGE.x - 40, y: EDGE.y, turn: 0.5, face: still('determined', { fx: ['sweat'] }), bodyY: 6 * gasp, armL: 20, armR: 20, nametag: false, ...boing(t, tFF1, 0.18) }, { arms: false });
  }
  let o = E.plaza(tSet, cam, { tSet }, behind, chars, over);
  if (ff) o += K.C.vhs(t, '▶▶ x600', 0.8);
  // the big clock in the middle, rolling; it flies to its corner at the end of the shot
  const fly = ease.inOut(seg(t, CUT.okay - 0.35, CUT.okay));
  const bigK = pop(t, CUT.lapse, 0.3);
  o += G.timerHUD({ x: lerp(1420, 34 + 230, fly), y: lerp(250, 62, fly), s: lerp(1.45, 0.78, fly), k: bigK, t: ff ? t * 30 : t, sec: timerSec(t), label: 'TIME ON STAGE 1', anchor: 'center', bump: seg(t, tFF1, tFF1 + 0.45) });
  o += G.statPill({ x: lerp(1420, 34 + 150, fly), y: lerp(380, 146, fly), s: lerp(1.15, 0.78, fly), k: pop(t, CUT.lapse + 0.15, 0.3), t, icon: dropIcon, label: 'FALLS', value: falls(t), rim: '#5BD0FF', anchor: 'center', bump: seg(t, tFF1, tFF1 + 0.45) });
  return o + smash(t, tFF1, 0.12, 0.5);
}

// 4. "Okay." — close on the hot dog: determined nod, cracks his bun-arms
function shOkay(t) {
  const cam = camKeys(t, [[CUT.okay, camAt(EDGE.x - 40, EDGE.y - 330, 2.25)], [CUT.key, camAt(EDGE.x - 40, EDGE.y - 340, 2.4)]], ease.out);
  const crack = bump(t, w(1, 'Okay') + 0.2, w1(1, 'Okay') + 0.1);
  const ch = dad(t, { x: EDGE.x - 40, y: EDGE.y, turn: 0.35, volume: false, nametag: false, face: { name: 'determined' }, armL: 70 + 40 * crack, armR: 70 + 40 * crack + 10 * Math.sin(t * 40) * crack, headY: 8 * bump(t, w(1, 'Okay'), w(1, 'Okay') + 0.25) }, { arms: false, energy: 1.2 });
  let o = E.plaza(t, cam, { dof: 0.42 }, '', ch);
  o += K.bang('CRACK!', 1460, 330, pop(t, w(1, 'Okay') + 0.35, 0.2) * (1 - seg(t, CUT.key - 0.25, CUT.key)), 70, 10, '#FFFFFF');
  return o + hud(t);
}

// the game picture on Dad's real laptop (keyboard POV): plaza frame scaled into the 1400x840 screen box (visible bottom 45 %)
function laptopGame(t, extra = '') {
  return (w_, h_) => {
    const cam = camAt(2930, 84, 0.8);
    const ch = dad(t, { x: EDGE.x, y: EDGE.y, turn: 0.6, face: still('determined'), nametag: false, armL: 10, armR: 10 }, { arms: false });
    const sc = w_ / 1920;
    return S.g(E.plaza(t, cam, {}, '', ch + extra), `translate(${f(-w_ / 2)} ${f(h_ / 2 - 1080 * sc)}) scale(${f(sc)})`);
  };
}
// 5. "Space... bar." — real life, Dad's POV: his arm over the keyboard, finger slowly onto the SPACE BAR, press on "bar."
function shKey(t) {
  const sp = H.keyAt('SPACE');
  const tB = tPress1;
  const cam = shakeAll(camKeys(t, [[CUT.key, { zoom: 0.92, x: 40, y: -150 }], [CUT.key + 0.55, { zoom: 1.02, x: 30, y: -40 }], [tB - 0.05, { zoom: 1.4, x: 10, y: 150 }], [tB + 0.06, { zoom: 1.62, x: 0, y: 180 }], [CUT.hop1, { zoom: 1.64, x: 0, y: 182 }]], ease.inOut), t, [[tB, 0.3, 14]]);
  const pressK = seg(t, tB - 0.05, tB + 0.05) * (1 - seg(t, tB + 0.35, tB + 0.5));
  const Lk = H.keyboardClose.layers(t, { time: 'night', screen: laptopGame(t), highlight: t > w(1, 'Space') + 0.2 ? 'SPACE' : [], press: { key: 'SPACE', k: pressK } });
  // the fingertip: from hovering high to the space bar
  const hov = ease.inOut(seg(t, CUT.key, tB - 0.05));
  const fx = lerp(1250, sp.x + 90, hov), fy = lerp(380, sp.y - 6, hov) + 14 * pressK + Math.sin(t * 9) * 6 * (1 - hov);
  let o = view(cam, Lk.bg, 0.9) + view(cam, Lk.mid) + view(cam, Lk.front) + view(cam, dadArm(1900, 1250, fx, fy, 150)) + view(cam, Lk.light);
  o += K.bang('PRESS', 1320, 300, pop(t, tB, 0.18) * (1 - seg(t, CUT.hop1 - 0.1, CUT.hop1)), 70, -8, '#FFE45C');
  return o;
}

// 6. game: a tiny hop... lands on the very edge, windmills, topples — SPLASH
function shHop1(t) {
  const cam = shakeAll(camKeys(t, [[CUT.hop1, camAt(2930, 560, 1.32)], [tSplash1, camAt(2990, 620, 1.22)], [CUT.yell, camAt(3000, 630, 1.2)]], ease.inOut), t, [[tSplash1, 0.35, 16]]);
  let behind = '', chars = '', over = '';
  const hop = 26 * bump(t, tHop1, tHop1 + 0.24);
  if (t < tTopple1) {
    const fwd = 40 * ease.out(seg(t, tHop1, tHop1 + 0.24));
    const mill = seg(t, tHop1 + 0.26, tTopple1);
    chars += dad(t, { x: EDGE.x + fwd, y: EDGE.y, lift: hop, turn: 0.6, rot: 8 * Math.sin(t * 22) * mill, armL: mill > 0 ? 90 + 70 * Math.sin(t * 30) : 30, armR: mill > 0 ? 90 - 70 * Math.sin(t * 30) : 30, face: still(mill > 0 ? 'shocked' : 'determined', { fx: mill > 0 ? ['sweat'] : [] }), nametag: false, ...boing(t, tHop1 + 0.24, 0.2) }, { arms: false });
  } else {
    const k = (t - tTopple1) / (tSplash1 - tTopple1);
    behind += dad(t, { x: EDGE.x + 40 + 70 * k, y: EDGE.y + 300 * k * k + (t > tSplash1 ? 600 * (t - tSplash1) : 0), view: 'side', flip: true, rot: 70 * Math.min(1, k), armL: 160, armR: 160, face: still('shocked'), nametag: false }, { arms: false });
  }
  over += splash(SP.water.splash.x + 10, SP.water.y, t - tSplash1, 0.62, 3);
  over += bubbles(SP.water.splash.x, SP.water.y - 6, t, seg(t, tSplash1 + 0.3, tSplash1 + 0.5), 0.7);
  let o = E.plaza(t, cam, {}, behind, chars, over);
  o += K.bang('SPLASH!', 1250, 330, pop(t, tSplash1 + 0.05, 0.2), 110, -6, '#7FE3FF');
  return o + hud(t);
}

// 7. "Space... BAR!" — split: the real Dad yelling at his laptop | the hot dog pops back and backs up for a run-up
function realDad(t, pose = {}, o = {}) {
  const LS = H.SPOTS.livingRoom.seats, D = H.SPOTS.livingRoom.devices;
  const seated = actor('dad', t, H.seatPose(LS.dad, 1.1, { volume: false, ...pose }), o.act || {}) + (o.mom !== false ? actor('mom', t, H.seatPose(LS.mom, 1.04, { volume: false, face: { name: 'happy', eyes: { look: [0.4, 0.3] } }, ...(o.momPose || {}) })) : '');
  const devices = X.laptopOld({ ...D.laptop, face: 'lid' }) + X.tablet({ ...D.tablet, face: 'back', landscape: true });
  return E.living(t, o.cam || camAt(1000, 560, 2.2), { glow: 'all' }, { seated, devices, over: o.over || '' });
}
function shYell(t) {
  const tB = w(1, 'bar', 1);
  const shout = seg(t, w(1, 'Space', 1), tB);
  const camR = shakeAll(camAt(1000, 470, 2.3 + 0.25 * shout), t, [[tB, 0.4, 12]]);
  const left = realDad(t, { face: { name: 'determined', fx: shout > 0.5 ? ['anger'] : [] }, armL: 40 + 30 * shout, armR: 40 + 30 * shout, glasses: 'up' }, { cam: camR, mom: true, act: { energy: 1.6 } });
  // right: the game
  const camG = camAt(2760, 540, 1.3);
  const back = ease.inOut(seg(t, tResp1 + 0.35, tB - 0.1));
  const pp = R.popPose(t - tResp1, DS);
  let ch = R.respawnPop({ x: 2760, y: EDGE.y, s: DS, age: t - tResp1, part: 'back' });
  if (!pp.hidden) ch += dad(t, { x: lerp(2760, 2650, back), y: EDGE.y, view: 'side', flip: true, ...AC.walk(-t * 9, back > 0 && back < 1 ? 1 : 0), face: still('determined'), nametag: false, sx: pp.sx, sy: pp.sy, lift: pp.lift }, { arms: false });
  ch += R.respawnPop({ x: 2760, y: EDGE.y, s: DS, age: t - tResp1, part: 'front' });
  const right = E.plaza(t, camG, {}, '', ch) + hud(t, { s: 0.9, x: 505, y: 70 });
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#151515' });
  const sl = ease.out(seg(t, CUT.yell, CUT.yell + 0.25));
  o += panel(lerp(-980, 16, sl), 16, 940, 1048, left, { border: 0, shadow: false });
  o += panel(lerp(1940, 964, sl), 16, 940, 1048, right, { border: 0, shadow: false });
  o += S.path('M960 0 V1080', ln(14, '#FFFFFF')) + S.path('M960 0 V1080', ln(4, '#151515'));
  o += K.bang('SPACE...', 470, 230, pop(t, w(1, 'Space', 1), 0.2), 90, -6, '#FFFFFF');
  o += K.bang('BAR!', 520, 380, pop(t, tB, 0.16), 160, 6, '#FFD23F');
  return o;
}

// 8. the run, the leap... the cartoon hang (he looks at us) ... SPLASH 2
function shLeap(t) {
  const cam = shakeAll(camKeys(t, [[CUT.leap, camAt(2880, 560, 1.12)], [tLeap, camAt(2950, 420, 1.1)], [tApex, camAt(3000, 270, 1.2)], [tApex + 0.12, camAt(3010, 210, 1.5)], [tDrop, camAt(3010, 215, 1.54)], [tDrop + 0.25, camAt(3010, 600, 1.15)], [CUT.sit, camAt(3000, 650, 1.1)]], ease.inOut), t, [[tSplash2, 0.45, 22]]);
  let behind = '', chars = '', over = '';
  const ax = 3010, ay = EDGE.y - 250;
  if (t < tLeap) {
    const k = seg(t, CUT.leap, tLeap);
    chars += dad(t, { x: lerp(2650, 2900, ease.in(k)), y: EDGE.y, view: 'side', flip: true, ...AC.run(t * 24), lean: 10, face: still('determined', { fx: ['anger'] }), nametag: false }, { arms: false });
  } else if (t < tApex) {
    const k = seg(t, tLeap, tApex);
    chars += dad(t, { x: lerp(2900, ax, k), y: lerp(EDGE.y, ay, ease.out(k)), view: 'side', flip: true, ...AC.run(t * 24), armL: 160, armR: 150, face: still('excited'), nametag: false, sy: 1.12, sx: 0.92 }, { arms: false });
  } else if (t < tDrop) {
    // the hang: looks at the camera, legs paddling
    const k = seg(t, tApex, tDrop);
    chars += dad(t, { x: ax, y: ay + 6 * Math.sin(t * 30) * 0.3, ...AC.run(t * 30, 0.7), armL: 70, armR: 70, face: { name: 'nervous', mouth: k > 0.5 ? 'wavy' : 'line', fx: k > 0.4 ? ['sweat'] : [] }, nametag: false }, { arms: false });
    over += K.bang('...', ax + 160, ay - 520, pop(t, tApex + 0.2, 0.2), 80, 0, '#FFFFFF');
  } else {
    const k = (t - tDrop);
    const y = ay + 0.5 * 5200 * k * k;
    const drawDad = dad(t, { x: ax, y, armL: 170, armR: 170, sy: 1.1, sx: 0.94, face: { name: 'scared', mouth: 'O' }, nametag: false }, { arms: false });
    if (y < SP.water.y + 200) behind += drawDad;
  }
  over += splash(ax, SP.water.y, t - tSplash2, 0.9, 7, 1.15);
  over += bubbles(ax, SP.water.y - 6, t, seg(t, tSplash2 + 0.35, tSplash2 + 0.6), 0.9, 7);
  // a sandal floats up
  if (t > tSplash2 + 0.4) { const k = seg(t, tSplash2 + 0.4, tSplash2 + 0.9); over += S.g(S.rect(-50, -14, 100, 28, 12, ol('#7A4A26', 5)) + S.path('M-20 -14 Q0 -40 20 -14', ln(8, '#8A5A30')), tf(ax + 90, SP.water.y + 30 - 34 * ease.outBack(k) + 4 * Math.sin(t * 5), 0.9, 8 * Math.sin(t * 3))); }
  let o = E.plaza(t, cam, {}, behind, chars, over);
  o += K.bang('SPLASH!!', 1300, 300, pop(t, tSplash2 + 0.04, 0.2), 140, 6, '#7FE3FF');
  o += zoomLines(960, 420, bump(t, tApex + 0.1, tDrop) * 0.6, t, '#FFFFFF', 18, 520);
  return o + hud(t);
}

// 9. "But then something strange happened." — pops back, sits on the edge of the block, sad; a "?"... a little noob peeks in
const SIT = { x: 2720, hip: 706 };
const sitPose = (s, size = 1.06) => ({ x: SIT.x, y: SIT.hip + 306 * s * size, s, legL: 90, legR: 90, kneeL: 90, kneeR: 90 });
function shSit(t) {
  const cam = camKeys(t, [[CUT.sit, camAt(2760, 520, 1.34)], [CUT.gather, camAt(2730, 500, 1.5)]], ease.inOut);
  const pp = R.popPose(t - tResp2, DS);
  const sitK = ease.inOut(seg(t, tResp2 + 0.5, tResp2 + 1.0));
  let ch = R.respawnPop({ x: SIT.x, y: EDGE.y, s: DS, age: t - tResp2, part: 'back' });
  const sigh = bump(t, tResp2 + 1.0, tResp2 + 1.8);
  if (!pp.hidden) {
    ch += dad(t, { x: SIT.x + 60, y: EDGE.y, sx: pp.sx * (1 + 0.03 * sitK), sy: pp.sy * (1 - 0.05 * sitK), lift: pp.lift, turn: 0.3, face: still('sad', { eyes: { look: [0.3, 0.6 * sitK] } }), armL: 4, armR: 4, bodyY: 8 * sitK + 8 * sigh, headY: 10 * sitK + 6 * sigh, nametag: false }, { arms: false });
  }
  ch += R.respawnPop({ x: SIT.x, y: EDGE.y, s: DS, age: t - tResp2, part: 'front' });
  // the little noob peeks in from the left
  const tS = w(2, 'strange');
  const nk = ease.out(seg(t, tS, tS + 0.9));
  const nb = noob(3, t, { x: lerp(2470, 2640, nk), y: EDGE.y, s: DS, view: nk < 1 ? 'side' : 'front', turn: nk < 1 ? 0 : 0.5, flip: true, ...(nk < 1 ? AC.walk(t * 10) : {}), over: { face: { name: 'happy', eyes: { look: [1, -0.4] } } } }, 'idle', 1);
  let o = E.plaza(t, cam, {}, '', ch + nb);
  const q = GS.toScreen(cam, SIT.x + 200, EDGE.y - 400);
  o += K.bang('?', q.x + 40, q.y, pop(t, tS, 0.25), 130, 10, '#FFFFFF');
  return o + hud(t);
}

// the crowd gathering around the start block (shots 10, 11, 14): destinations + walk-in times
const GATHER = Array.from({ length: 14 }, (_, j) => {
  const side = j % 2 ? 1 : -1, from = -(900 + 300 * hash(j));
  const y = [960, 1010, 900, 1050, 940, 1000, 880, 1030, 970, 920, 1060, 990, 910, 1040][j];
  const x = side < 0 ? 2560 - ((j * 97) % 300) : 2620 + ((j * 113) % 260);
  return { i: NOOB_I[j], x, y, s: sAt(y), from, delay: 0.25 * j * 0.6 + hash(j * 3.3) * 0.4, ph: j * 1.7 };
});
function gathering(t, t0, mood = 'watch', o = {}) {
  const list = GATHER.map((g, j) => ({ ...g, j })).sort((a, b) => a.y - b.y);
  let out = '';
  for (const g of list) {
    if (o.skip && o.skip.includes(g.j)) continue;
    const k = seg(t, t0 + g.delay, t0 + g.delay + 1.3);
    if (k <= 0 && o.walkIn) continue;
    const kk = o.walkIn ? k : 1;
    const x = g.x + g.from * (1 - ease.out(kk));
    if (kk < 1) out += noob(g.i, t, { x, y: g.y, s: g.s, view: 'side', flip: g.from < 0, ...AC.walk(t * 10 + g.ph) }, 'idle', g.ph);
    else out += noob(g.i, t, { x, y: g.y, s: g.s, turn: g.x < 2600 ? 0.4 : -0.3, over: o.over }, typeof mood === 'function' ? mood(g) : mood, g.ph);
  }
  return out;
}
// 10. "The new players... started gathering around him." — crane wide; noobs spawn + walk in; join toasts
function shGather(t) {
  const cam = camKeys(t, [[CUT.gather, camAt(2620, 520, 0.8)], [CUT.kiddo, camAt(2720, 640, 1.02)]], ease.inOut);
  const look = seg(t, CUT.gather + 0.8, CUT.gather + 1.4);
  const ch = dad(t, { x: SIT.x + 60, y: EDGE.y, turn: 0.3 * (1 - look), bodyY: 8 * (1 - look), headY: 10 * (1 - look), face: { name: look > 0.5 ? 'amazed' : 'sad', mouth: look > 0.5 ? 'o' : 'frown', eyes: { look: [0, look > 0.5 ? 0.6 : 0.4] } }, armL: 4 + 30 * look, armR: 4 + 30 * look, nametag: false }, { arms: false });
  const nb = noob(3, t, { x: 2640, y: EDGE.y, s: DS, turn: 0.5 }, 'amazed', 1);
  const crowd = gathering(t, CUT.gather - 0.2, 'watch', { walkIn: true });
  let o = E.plaza(t, cam, {}, '', nb + ch + crowd);
  o += G.joinStack(t, [
    { user: 'Guest_3217', at: w(2, 'new') - 0.1, icon: 'cube' },
    { user: 'lil_noob_7', at: w(2, 'started') - 0.1, icon: 'kid' },
    { user: 'Guest_8846', at: w(2, 'around'), icon: 'cube' },
  ], { x: 1880, y: 230, hold: 2.6, s: 0.8 });
  return o + hud(t);
}

// 11. "You can do it, kiddo!" — noob 3 shaking at the edge, Dad behind him, cheering; CAPS chat
const JUMPER = { i: 3, x: 2860, y: EDGE.y };
function shKiddo(t) {
  const cam = camKeys(t, [[CUT.kiddo, camAt(2790, 470, 1.5)], [CUT.believe, camAt(2800, 470, 1.6)]], ease.inOut);
  const dx = 2700;
  const ch = dad(t, { x: dx, y: EDGE.y, turn: 0.45, face: still('happy'), armL: 60 + 30 * Math.abs(Math.sin(t * 6)), armR: 80 + 30 * Math.abs(Math.sin(t * 6 + 1)), nametag: false }, { arms: false });
  const jm = noob(JUMPER.i, t, { x: JUMPER.x, y: JUMPER.y, s: DS, view: 'side', flip: true }, 'shake', 0);
  const crowd = gathering(t, -99, 'watch', {});
  let o = E.plaza(t, cam, {}, '', crowd + ch + jm);
  o += sBubble(cam, dx - 40, EDGE.y - 500, { caps: true, t, tail: 0.6, s: 0.9, ...G.chatLine(t, '07.3', { to: 'kiddo', pre: 0.25, text: 'You can do it, kiddo!' }) });
  return o + hud(t);
}

// 12. "I believe in you!" — close: two thumbs up, sparkles, sun rays
function shBelieve(t) {
  const cam = camKeys(t, [[CUT.believe, camAt(2700, 360, 2.0)], [CUT.notme, camAt(2700, 350, 2.15)]], ease.out);
  const up = ease.outBack(seg(t, w(3, 'believe') - 0.05, w(3, 'believe') + 0.2));
  const rays = S.g(K.rays(2700, 330, 14, 900, '#FFF3B0', 0.22, t * 12), null, {});
  const ch = dad(t, { x: 2700, y: EDGE.y, turn: 0.2, volume: false, nametag: false, face: { name: 'joy', fx: up > 0.5 ? ['sparkles'] : [] }, armL: lerp(20, 150, up), armR: lerp(20, 150, up) }, { arms: false });
  let o = E.plaza(t, cam, { dof: 0.4 }, '', rays + ch);
  o += K.C.burst(960, 300, seg(t, w(3, 'believe'), w(3, 'believe') + 0.5), '#FFE27A');
  return o + hud(t);
}

// 13. "I don't believe in ME..." — tighter, the honest face, a tiny rain cloud
function shNotMe(t) {
  const cam = camKeys(t, [[CUT.notme, camAt(2700, 320, 2.7)], [CUT.jump, camAt(2700, 318, 2.85)]], ease.out);
  const ch = dad(t, { x: 2700, y: EDGE.y, turn: 0.1, volume: false, nametag: false, face: { name: 'sad' }, armL: 12, armR: 12, headRot: -4 }, { arms: false, energy: 0.6 });
  // rain cloud on "ME"
  const ck = pop(t, w(3, 'ME') - 0.05, 0.3);
  let cloud = '';
  if (ck > 0) {
    const qh = GS.toScreen(cam, 2700, EDGE.y - 470), cx = qh.x + 120, cy = Math.max(120, qh.y - 40) + 6 * Math.sin(t * 3);
    let rain = '';
    for (let i = 0; i < 8; i++) { const ph = (t * 2.2 + hash(i)) % 1; rain += `M${f(cx - 110 + i * 32)} ${f(cy + 66 + ph * 170)} l-7 26`; }
    cloud = S.path(rain, ln(7, '#7FC6FF', 0.9 * ck)) + S.g(S.circle(-50, 0, 44, ol('#8A93A8', 6)) + S.circle(0, -22, 56, ol('#8A93A8', 6)) + S.circle(54, 0, 42, ol('#8A93A8', 6)) + S.rect(-92, 0, 184, 40, 20, { fill: '#8A93A8' }), tf(cx, cy, 1.35 * ck));
  }
  return E.plaza(t, cam, { dof: 0.42 }, '', ch) + cloud + hud(t);
}

// 14. "...but I believe in you!" — the noob runs, JUMPS on "you!", lands on the red platform: NICE!
function shJump(t) {
  const cam = camKeys(t, [[CUT.jump, camAt(2820, 500, 1.3)], [tJump, camAt(2880, 480, 1.38)], [tLandJ, camAt(3120, 520, 1.5)], [CUT.cheer, camAt(3110, 520, 1.55)]], ease.inOut);
  const plat = SP.platforms[0];
  let jm;
  if (t < tJump - 0.3) jm = noob(JUMPER.i, t, { x: JUMPER.x - 40, y: JUMPER.y, s: DS, view: 'side', flip: true, over: { face: { name: 'determined' } } }, 'idle');
  else if (t < tJump) { const k = seg(t, tJump - 0.3, tJump); jm = noob(JUMPER.i, t, { x: lerp(JUMPER.x - 40, 2900, k), y: JUMPER.y, s: DS, view: 'side', flip: true, ...AC.run(t * 26), over: { face: { name: 'determined' } } }, 'idle'); }
  else if (t < tLandJ) { const k = seg(t, tJump, tLandJ); jm = noob(JUMPER.i, t, { x: lerp(2900, plat.x, k), y: JUMPER.y - 260 * 4 * k * (1 - k), s: DS, view: 'side', flip: true, legL: 30, legR: -30, kneeL: 40, kneeR: 20, armL: 150, armR: 150, sx: 0.92, sy: 1.1, over: { face: { name: 'excited' } } }, 'idle'); }
  else jm = noob(JUMPER.i, t, { x: plat.x, y: plat.y, s: DS, ...boing(t, tLandJ, 0.3), over: { armL: 150, armR: 150, face: { name: 'excited', fx: ['sparkles'] } } }, 'idle');
  const cheer = t > tLandJ;
  const ch = dad(t, { x: 2700, y: EDGE.y, turn: 0.45, face: still(cheer ? 'joy' : 'happy'), armL: cheer ? 160 : 60, armR: cheer ? 160 : 80, bodyY: cheer ? 10 * Math.abs(Math.sin(t * 10)) : 0, nametag: false }, { arms: false });
  const crowd = gathering(t, -99, cheer ? 'cheer' : 'amazed', {});
  let o = E.plaza(t, cam, {}, '', crowd + ch + jm);
  const q = GS.toScreen(cam, plat.x, plat.y - 330);
  o += S.g(S.circle(0, 0, 46, ol('#3DDC84', 6)) + S.path('M-20 2 L-6 16 L22 -14', ln(10, '#FFFFFF')), tf(q.x + 120, q.y, pop(t, tLandJ, 0.25)));
  o += K.bang('NICE!', q.x, q.y - 60, pop(t, tLandJ + 0.05, 0.22), 100, -6, '#3DDC84');
  return o + hud(t);
}

// mini panel scene for the "every jump" montage: a noob landing on a candy platform (cheap: flat sky + water + one block)
function jumpPanel(t, t0, i, col, seed) {
  const k = seg(t, t0, t0 + 0.45);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#FFB08A' }) + S.rect(0, 0, 1920, 500, 0, { fill: '#C978C8', opacity: 0.6 }) + S.circle(1500, 560, 120, { fill: '#FFD06A' });
  o += S.rect(0, 760, 1920, 320, 0, { fill: '#3FA7C9' }) + S.path('M0 780 Q240 760 480 780 T960 780 T1440 780 T1920 780', ln(8, '#BDF0FF'));
  o += S.rect(760, 640, 420, 440, 18, ol(col, 10)) + S.rect(760, 640, 420, 60, 18, { fill: '#FFFFFF', opacity: 0.3 });
  const x = lerp(250, 970, ease.out(k)), y = k < 1 ? 650 - 420 * 4 * k * (1 - k) : 650;
  o += noob(i, t, { x, y, s: 1.05, ...(k < 1 ? { view: 'side', flip: true, armL: 150, armR: 150, legL: 30, legR: -30 } : { ...boing(t, t0 + 0.45, 0.3), over: { armL: 150, armR: 150, face: { name: 'excited' } } }) }, 'idle', seed);
  if (k >= 1) o += K.bang('+1', 1300, 300, pop(t, t0 + 0.45, 0.2), 150, 8, '#3DDC84');
  return o;
}
// 15. "He cheered for every jump." — Dad's happy dance + three jump panels popping on the words
function shCheer(t) {
  const cam = camKeys(t, [[CUT.cheer, camAt(2700, 330, 1.25)], [CUT.jokes, camAt(2700, 320, 1.32)]], ease.inOut);
  const dance = Math.sin(t * 9);
  const ch = dad(t, { x: 2700, y: EDGE.y, rot: 9 * dance, lift: 14 * Math.abs(dance), armL: 90 + 70 * dance, armR: 90 - 70 * dance, face: { name: 'joy', mouth: 'bigGrin', eyes: { type: 'happy' } }, nametag: false }, { arms: false });
  const crowd = gathering(t, -99, 'clap', {});
  let o = E.plaza(t, cam, {}, '', crowd + ch, G.danceNotes({ x: 2700, y: EDGE.y - 540, t, k: 1, s: 1.1 }));
  const words = [w(4, 'cheered'), w(4, 'every'), w(4, 'jump')];
  const P = [[70, 60], [700, 60], [1330, 60]];
  words.forEach((tw, j) => {
    const k = seg(t, tw - 0.05, tw + 0.25);
    if (k <= 0) return;
    o += panel(P[j][0], P[j][1], 520, 292, jumpPanel(t, tw - 0.1, [5, 9, 13][j], ['#FF5A5A', '#FFC83B', '#4BE0A8'][j], j), { k, rot: [-3, 2, -2][j], border: 8 });
  });
  return o;
}

// 16. "He told terrible jokes." + "Why did the noob cross the road?" — stand-up in a spotlight; noob audience from behind
const AUD = [[2480, 1040, 2], [2610, 1060, 6], [2750, 1035, 8], [2890, 1062, 10], [3020, 1045, 12], [2550, 985, 14], [2690, 975, 4], [2830, 990, 1], [2960, 980, 16]];
function audience(t, mood = 'watch', view = 'back') {
  return AUD.slice().sort((a, b) => a[1] - b[1]).map(([x, y, i], j) => noob(i, t, { x, y, s: sAt(y), view }, mood, j * 1.3)).join('');
}
function spotlight(x, y, k = 1) {
  if (k <= 0) return '';
  return S.path(`M${f(x - 70)} -400 L${f(x + 70)} -400 L${f(x + 300)} ${f(y + 20)} L${f(x - 300)} ${f(y + 20)} Z`, { fill: 'url(#s07Spot)', opacity: f(k) }) + S.ellipse(x, y + 8, 300, 46, { fill: '#FFF6C8', opacity: f(0.35 * k) });
}
const micPose = (armR) => { const h = CAST.handAt(CAST.D.dadAvatar, { armR }, 1); return [{ svg: mic(h[0], h[1] - 10, 1.5, -28 - Math.max(0, armR - 40) * 0.3), layer: 'front' }]; };
function shJokes(t) {
  const cam = camKeys(t, [[CUT.jokes, camAt(2740, 600, 1.05)], [A[5].a, camAt(2740, 560, 1.22)], [CUT.punch, camAt(2740, 540, 1.32)]], ease.inOut);
  const spot = seg(t, CUT.jokes, CUT.jokes + 0.3);
  const conf = seg(t, w(5, 'road') - 0.1, w(5, 'road') + 0.3);
  const ch = dad(t, { x: 2740, y: EDGE.y, face: { name: 'smug' }, armR: 40, armL: 20 + 20 * Math.sin(t * 3), props: micPose(40), nametag: false }, { arms: false, energy: 1.2 });
  const aud = audience(t, conf > 0.5 ? 'confused' : 'watch');
  let o = E.plaza(t, cam, {}, '', spotlight(2740, EDGE.y, spot) + ch, aud);
  o += sBubble(cam, 2820, EDGE.y - 470, { caps: true, t, tail: -0.7, s: 0.9, ...G.chatLine(t, '07.5', { to: 'road', hold: 0.2, pre: 0.2, text: 'Why did the noob cross the road?' }) });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#1A0A2A', opacity: f(0.25 * spot) });
  o += G.nametag({ x: 250, y: 90, name: 'COMEDY NIGHT', level: null, col: '#FF5FA8', t, s: 1.1, k: pop(t, CUT.jokes + 0.1, 0.3), bob: false, crown: false });
  return o;
}
// 17. "He couldn't! He was stuck in the lobby!" — close: Dad cracking himself up
function shPunch(t) {
  const cam = camKeys(t, [[CUT.punch, camAt(2740, 380, 2.0)], [CUT.deadpan, camAt(2740, 370, 2.15)]], ease.out);
  const lp = Math.abs(Math.sin(t * 10));
  const ch = dad(t, { x: 2740, y: EDGE.y, turn: 0.15, volume: false, face: { name: 'joy', fx: lp > 0.6 ? ['tears'] : [] }, armR: 40, armL: 40 + 40 * lp, bodyY: 8 * lp, props: micPose(40), nametag: false }, { arms: false, energy: 1.4 });
  let o = E.plaza(t, cam, { dof: 0.3 }, '', spotlight(2740, EDGE.y, 1) + ch);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#1A0A2A', opacity: 0.22 });
  o += E.TS('HA', 1500, 330, 90, '#FFD23F', { opacity: f(bump(t, w(5, 'couldn\'t') - 0.1, w(5, 'couldn\'t') + 0.6)), transform: 'rotate(10 1500 330)' });
  return o;
}
// 17b. (lobby!) — reverse: three noobs, deadpan; a cube tumbleweed rolls through
function shDeadpan(t) {
  const cam = camAt(2750, 790, 1.85);
  let o = E.plaza(t, cam, {}, '', [[2600, 1000, 7], [2750, 1010, 11], [2900, 1000, 2]].map(([x, y, i], j) => noob(i, t, { x, y, s: sAt(y), over: { face: { name: 'deadpan', blink: j === 1 && t > CUT.deadpan + 0.25 && t < CUT.deadpan + 0.33 ? 1 : 0 } } }, 'deadpan', j)).join(''));
  const k = seg(t, CUT.deadpan, CUT.likeme + 0.2);
  o += G.tumbleweed({ x: lerp(-120, 1300, k), y: 900, s: 0.8, t, rot: k * 720, k: 1 });
  return o;
}
// 18. "Like me!" — ta-da pose, smash zoom, RIMSHOT: BA-DUM TSS!
function shLikeMe(t) {
  const tL = w(5, 'Like');
  const cam = shakeAll(camKeys(t, [[CUT.likeme, camAt(2740, 400, 1.7)], [tL + 0.08, camAt(2740, 360, 2.25)], [CUT.lol, camAt(2740, 360, 2.3)]], ease.out), t, [[tRim, 0.3, 10]]);
  const ta = ease.outBack(seg(t, tL - 0.05, tL + 0.18));
  const ch = dad(t, { x: 2740, y: EDGE.y, volume: false, face: { name: 'joy', fx: ['sparkles'] }, armL: lerp(30, 130, ta), armR: lerp(40, 130, ta), props: micPose(lerp(40, 130, ta)), nametag: false }, { arms: false });
  let o = E.plaza(t, cam, { dof: 0.3 }, '', spotlight(2740, EDGE.y, 1) + ch);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#1A0A2A', opacity: 0.2 });
  const dk = ease.outBack(seg(t, tRim - 0.3, tRim));
  o += drumKit(1560, 1080 + 260 * (1 - dk), 1.25, seg(t, tRim, tRim + 0.6), t);
  o += K.bang('BA-DUM TSS!', 1380, 420, pop(t, tRim, 0.18), 92, 8, '#FFD23F');
  return o + smash(t, tL, 0.1, 0.5);
}
// 19. the chat explodes: LOL / XD / DAD JOKE!! — the noobs crack up
function shLol(t) {
  const cam = shakeAll(camKeys(t, [[CUT.lol, camAt(2740, 640, 1.0)], [CUT.crate, camAt(2730, 630, 1.06)]], ease.out), t, [[CUT.lol, 0.4, 12]]);
  const bow = bump(t, CUT.lol + 0.2, CUT.lol + 1.0);
  const ch = dad(t, { x: 2740, y: EDGE.y, face: { name: 'joy', eyes: { type: 'happy' } }, armL: 20, armR: 40, headY: 30 * bow, bodyY: 20 * bow, props: micPose(40), nametag: false }, { arms: false });
  const aud = audience(t, 'laugh', 'front');
  const crowd = gathering(t, -99, 'laugh', { skip: [0, 2, 4, 6] });
  // over-head reply bubbles
  let bubs = '';
  [[2470, 1040, 'LOL', 0.1], [2900, 1062, 'XD', 0.3], [3030, 1045, 'DAD JOKE!!', 0.5], [2620, 985, 'LMAO', 0.7]].forEach(([x, y, txt, d], j) => {
    bubs += sBubble(cam, x, y - 704 * sAt(y) - 20, { text: txt, user: G.FLOOD_USERS[j * 5 + 2], t, s: 0.9, k: seg(t, CUT.lol + d, CUT.lol + d + 0.3), size: 44, minY: 200 });
  });
  let o = E.plaza(t, cam, {}, '', ch + crowd + aud);
  o += bubs;
  o += G.chatLog({ x: 30, y: 520, w: 600, h: 400, t, lines: [{ user: 'DadBod1978', text: 'WHY DID THE NOOB CROSS THE ROAD? HE COULDNT! HE WAS STUCK IN THE LOBBY! LIKE ME!' }], flood: seg(t, CUT.lol, CUT.crate + 0.2), floodSet: 'lol', floodN: 40, k: pop(t, CUT.lol - 0.05, 0.25) });
  return o + hud(t);
}

// the crate: Dad climbs up (can't jump), the speech
const CR = SP.crate;                           // {x 2330, y 854 (feet on top), base 990, s .438}
const CS = CR.s;
const SPEECH = [[2060, 1010, 3], [2160, 1062, 5], [2510, 1045, 0], [2600, 1068, 9], [2700, 1020, 11], [2110, 950, 13], [2540, 960, 2], [2660, 975, 7], [1990, 960, 15], [2780, 1050, 6], [1960, 1050, 14], [2830, 965, 10]];
function speechCrowd(t, mood = 'watch', view = 'front', skip = []) {
  return SPEECH.map((p, j) => [...p, j]).filter((p) => !skip.includes(p[2])).sort((a, b) => a[1] - b[1]).map(([x, y, i, j]) => {
    if (i === 0) return KID0(t, { x, y, s: sAt(y), view, face: view === 'back' ? undefined : (mood === 'cheer' ? 'excited' : { name: 'amazed', mouth: 'o', eyes: { look: [0, -0.6] } }), armL: mood === 'cheer' ? 150 : 8, armR: mood === 'cheer' ? 150 : 8, lift: mood === 'cheer' ? 20 * Math.abs(Math.sin(t * 9)) : 0 });
    return noob(i, t, { x, y, s: sAt(y), view, turn: view === 'front' ? (x < CR.x ? 0.3 : -0.3) : 0 }, mood, j * 1.1);
  }).join('');
}
const crateDad = (t, pose, act) => dad(t, { x: CR.x, y: CR.y, s: CS, ...pose }, act);
// 20. "Listen up, kids!" — he scrambles onto the crate, arm up
function shCrate(t) {
  const cam = camKeys(t, [[CUT.crate, camAt(2330, 640, 1.05)], [CUT.notfail, camAt(2330, 600, 1.2)]], ease.inOut);
  const climb = seg(t, CUT.crate, CUT.crate + 0.5);
  let ch;
  if (climb < 1) ch = dad(t, { x: lerp(2200, CR.x, ease.inOut(climb)), y: lerp(CR.base, CR.y, ease.outBack(climb)), s: CS, view: 'side', flip: true, legL: 70 * bump(climb, 0, 1), kneeL: 80 * bump(climb, 0, 1), rot: -12 * bump(climb, 0.2, 0.8), armL: 120, armR: 100, face: still('determined', { fx: ['sweat'] }), nametag: false }, { arms: false });
  else ch = crateDad(t, { face: { name: 'determined' }, armR: 150, armL: 20, ...boing(t, CUT.crate + 0.5, 0.2), nametag: false }, { arms: false, energy: 1.3 });
  const crowd = speechCrowd(t, 'watch', 'back');
  const bub = sBubble(cam, CR.x + 90, CR.y - 520, { caps: true, t, s: 0.9, tail: -0.7, ...G.chatLine(t, '07.6', { to: 'kids', hold: 0.2, pre: 0.1, text: 'Listen up, kids!' }) });
  return E.plaza(t, cam, {}, '', ch + crowd) + bub + hud(t);
}
// 21. "Falling is not failing!" — heroic low angle, sun rays, the crowd's heads at the bottom
function shNotFail(t) {
  const cam = camKeys(t, [[CUT.notfail, camAt(2330, 470, 1.6)], [CUT.trying, camAt(2330, 440, 1.72)]], ease.inOut);
  const rays = K.rays(CR.x, CR.y - 420, 16, 1200, '#FFF3B0', 0.2, t * 10);
  const fist = ease.outBack(seg(t, w(6, 'not') - 0.1, w(6, 'not') + 0.12));
  const ch = crateDad(t, { volume: false, face: { name: 'determined', fx: fist > 0.5 ? ['sparkles'] : [] }, armR: lerp(120, 170, fist), armL: 20, nametag: false }, { arms: false, energy: 1.2 });
  const crowd = speechCrowd(t, 'watch', 'back');
  let o = E.plaza(t, cam, {}, '', rays + ch + crowd);
  o += K.C.burst(1000, 230, seg(t, w(6, 'not'), w(6, 'not') + 0.5), '#FFF3B0');
  return o;
}
// 22. "Failing is when you stop trying!" — reverse: their faces, the KID in the front row, star eyes; slow pan
function shTrying(t) {
  const cam = camKeys(t, [[CUT.trying, camAt(2180, 760, 1.75)], [CUT.fell, camAt(2470, 760, 1.8)]], ease.inOut);
  const crowd = speechCrowd(t, 'amazed', 'front');
  return E.plaza(t, cam, {}, '', crowd);
}
// 23. "I fell two hundred times today!" — points at FALLS: 200; the crowd cheers
function shFell(t) {
  const cam = shakeAll(camKeys(t, [[CUT.fell, camAt(2330, 660, 1.0)], [CUT.sunset, camAt(2330, 640, 1.06)]], ease.inOut), t, [[w(6, 'today'), 0.4, 10]]);
  const tTwo = w(6, 'two'), tToday = w(6, 'today');
  const point = ease.outBack(seg(t, tTwo - 0.2, tTwo + 0.1));
  const cheer = t > tToday;
  const ch = crateDad(t, { face: { name: 'joy' }, armL: lerp(20, 150, point), armR: cheer ? 160 : 30, lean: -6 * point, nametag: false }, { arms: false, energy: 1.2 });
  const crowd = speechCrowd(t, cheer ? 'cheer' : 'watch', 'back');
  let o = E.plaza(t, cam, {}, '', ch + crowd);
  const big = bump(t, tTwo - 0.05, tToday + 0.4);
  o += hud(t, { fs: 1 + 0.6 * big, fallBump: seg(t, w(6, 'hundred'), w(6, 'hundred') + 0.45) });
  o += K.C.burst(250, 160, seg(t, w(6, 'hundred'), w(6, 'hundred') + 0.5), '#5BD0FF');
  return o;
}

// the evening crowd around Dad (after the time-lapse): Dad standing on the floor in front of the crate, Noodle sitting on it
const DADF = { x: 2470, y: 990 };
const DFS = sAt(DADF.y);
const NOOD = { x: CR.x, hip: CR.y + 8 };
const KIDP = { x: 2620, y: 1010 };
const EVE = [[1960, 890, 4, 'player'], [2110, 880, 5], [2560, 895, 2, 'player'], [2680, 905, 9], [2800, 880, 1], [2150, 955, 13], [2010, 965, 7], [2640, 955, 11], [2770, 965, 6, 'player'], [1880, 950, 10, 'player'], [1950, 1040, 14], [2100, 1062, 8, 'player'], [2740, 1050, 12], [2860, 1015, 15]];
function eveCrowd(t, mood = 'love', k = 1, cam = null) {
  return EVE.map((p, j) => [...p, j]).sort((a, b) => a[1] - b[1]).map(([x, y, i, kind, j]) => {
    if (k < 1 && hash(j * 7.7) > k) return '';
    const s = sAt(y), b = Math.abs(Math.sin(t * 8 + j));
    const look = [clamp((DADF.x - x) / 500, -1, 1), -0.3];
    if (kind === 'player') {
      const pose = { x, y, s: s * 0.98, turn: x < DADF.x ? 0.3 : -0.3, shadow: true, t };
      if (mood === 'cheer') Object.assign(pose, { armL: 150 + 20 * b, armR: 150, lift: 18 * b, face: 'excited' });
      else Object.assign(pose, { armL: 10, armR: 10, face: { name: 'happy', eyes: { look, type: j % 3 === 0 ? 'heart' : undefined } }, ...AC.breathe(t, j) });
      return CAST.draw.player(i, pose);
    }
    return noob(i, t, { x, y, s, turn: x < DADF.x ? 0.3 : -0.3, over: mood === 'love' ? { face: { name: 'happy', eyes: { look, type: j % 2 ? 'heart' : undefined }, fx: j % 3 ? [] : ['blush'] } } : {} }, mood === 'love' ? 'watch' : mood, j);
  }).join('');
}
const noodleSit = (t, pose = {}, act) => actor('noodle', t, { x: NOOD.x, y: NOOD.hip + 306 * CS * 0.98, s: CS, legL: 90, legR: 90, kneeL: 90, kneeR: 90, ...pose }, act);

// 24. "By sunset..." — time-lapse: crane up + out, clouds race, the light goes deep orange-pink, the clock flies forward
function shSunset(t) {
  const k = seg(t, CUT.sunset, CUT.dadname);
  const cam = camKeys(t, [[CUT.sunset, camAt(2330, 640, 1.06)], [CUT.dadname, camAt(2400, 560, 0.78)]], ease.inOut);
  const tSet = t + 90 * (t - CUT.sunset);
  // Dad fast-forwards off the crate (ghosted)
  const ch = k < 0.45 ? crateDad(t, { face: still('joy'), armL: 150, armR: 150, nametag: false }, { arms: false }) : dad(t, { x: DADF.x, y: DADF.y, s: DFS, face: still('happy'), nametag: false }, { arms: false });
  const crowd = eveCrowd(t, 'love', 0.3 + 0.7 * k);
  let o = E.plaza(tSet, cam, { tSet, deep: ease.inOut(k) }, '', crowd + ch + (k > 0.6 ? noodleSit(t, { face: 'happy' }) : ''));
  o += K.C.vhs(t, '▶▶', 0.5 * bump(k, 0, 1));
  o += hud(t, { k: 1 - seg(t, CUT.dadname - 0.3, CUT.dadname) });
  return o;
}
// 25. "...the whole server was calling him 'Dad.'" — the crowd, the DAD!! flood, his nametag becomes DAD
function shDadName(t) {
  const cam = camKeys(t, [[CUT.dadname, camAt(2400, 560, 0.78)], [tDadName - 0.1, camAt(2440, 620, 0.98)], [tDadName + 0.15, camAt(2470, 700, 1.18)], [CUT.tug, camAt(2470, 710, 1.24)]], ease.inOut);
  const hug = 0;
  const ch = dad(t, { x: DADF.x, y: DADF.y, s: DFS, face: { name: 'joy', eyes: { type: 'happy' } }, armL: 60 + 20 * Math.sin(t * 4), armR: 60 + 20 * Math.sin(t * 4 + 2), nametag: false }, { arms: false });
  const nd = noodleSit(t, { face: { name: 'joy' }, armL: 30, armR: 140 + 20 * Math.sin(t * 7) });
  const crowd = eveCrowd(t, t > tDadName ? 'cheer' : 'love');
  const kd = KID0(t, { x: KIDP.x, y: KIDP.y, s: sAt(KIDP.y), turn: -0.4, face: { name: 'happy', eyes: { look: [-0.6, -0.5] } }, armL: 8, armR: 8 });
  // nametag over Dad: DadBod1978 -> DAD (pops on the word)
  const oh = G.overHead(DADF.x, DADF.y, DFS, 'dadAvatar');
  const flip = t >= tDadName;
  let tags = flip ? G.nametag({ x: DADF.x, y: oh.tag, name: 'DAD', level: 99, col: '#FF5FA8', crown: true, t, s: 1.2, k: pop(t, tDadName, 0.35) })
    : G.nametag({ x: DADF.x, y: oh.tag, who: 'dad', t, s: 0.9 });
  if (flip) tags += G.emoteHearts({ x: DADF.x, y: oh.tag - 40, age: t - tDadName, n: 18, s: 1.2, seed: 5 });
  let bubs = '';
  [[2180, 960, 'DAD!!', 0], [2700, 1000, 'best dad', 0.35], [1980, 1010, 'DAD DAD DAD', 0.7], [2900, 960, 'hot dog dad <3', 1.0], [2260, 1050, 'DAD!!!', 1.3]].forEach(([x, y, txt, d], j) => {
    const a = CUT.dadname + 0.3 + d * 1.2;
    const oh2 = G.overHead(x, y, sAt(y), 'noob');
    bubs += G.chatBubble({ x, y: oh2.chat + 30, text: txt, user: G.FLOOD_USERS[j * 3 + 1], t, s: 0.95, k: seg(t, a, a + 0.3), out: seg(t, a + 1.6, a + 1.95), size: 46 });
  });
  let o = E.plaza(t, cam, { deep: 1 }, '', crowd + kd + ch + nd, tags + bubs);
  o += G.chatLog({ x: 30, y: 540, w: 560, h: 380, t, lines: [], flood: seg(t, CUT.dadname + 0.2, CUT.tug), floodSet: 'dad', floodN: 50 });
  return o + smash(t, tDadName, 0.12, 0.35, '#FFE0F0');
}

// 26. "Mister Hot Dog?" — low, at the kid's height: the KID tugs the hot dog's sleeve; Dad looks down
function shTug(t) {
  const cam = camKeys(t, [[CUT.tug, camAt(2610, 820, 2.0)], [CUT.kidcu, camAt(2605, 765, 2.1)]], ease.inOut);
  const tug = Math.sin(t * 12) * bump(t, CUT.tug + 0.2, w(8, 'Dog') + 0.2);
  const lookD = seg(t, w(8, 'Hot') - 0.1, w(8, 'Hot') + 0.3);
  const ch = dad(t, { x: DADF.x, y: DADF.y, s: DFS, turn: lerp(0, 0.35, lookD), headRot: 10 * lookD, armR: 24 + 5 * tug, armL: 10, face: still(lookD > 0.5 ? 'happy' : 'joy', { eyes: { look: [0.7 * lookD, 0.8 * lookD] } }), nametag: false }, { arms: false });
  const kd = KID0(t, { x: 2748 - 6 * tug, y: KIDP.y, s: sAt(KIDP.y), turn: -0.55, armR: 8, armL: 74 + 8 * tug, face: { name: 'cute', eyes: { look: [-0.6, -0.7] }, fx: ['blush'] } }, { arms: false });
  const crowd = eveCrowd(t, 'love');
  const bub = sBubble(cam, 2790, KIDP.y - 330, { t, size: 44, user: 'lil_noob_7', ...G.chatLine(t, '07.8', { to: 'Dog', hold: 0.6, pre: 0.2, text: 'Mister Hot Dog?' }) });
  return E.plaza(t, cam, { deep: 1, dof: 0.35 }, crowd, ch + kd) + bub;
}
// 27. "Can you be my dad too?" — the KID's close-up: big eyes, propeller turning slowly, warm bokeh
function shKidCU(t) {
  const cam = camKeys(t, [[CUT.kidcu, camAt(KIDP.x - 30, KIDP.y - 240, 3.3)], [CUT.ofc, camAt(KIDP.x - 30, KIDP.y - 245, 3.55)]], ease.inOut);
  // real t drives the KID voice; the slow pose t only slows the propeller
  const kd2 = actor('kid', t, { i: 0, t: t * 0.3, x: KIDP.x - 30, y: KIDP.y, s: sAt(KIDP.y), turn: -0.2, volume: false, face: { name: 'cute', eyes: { look: [-0.2, -0.6] }, fx: ['blush'] }, armL: 10, armR: 10 }, { arms: false });
  let o = E.plaza(t, cam, { deep: 1 }, '', kd2);
  // warm bokeh
  let bk = '';
  for (let i = 0; i < 8; i++) bk += S.circle(200 + 230 * i + 40 * Math.sin(t + i), 160 + 120 * hash(i * 3.1), 40 + 40 * hash(i), { fill: '#FFE2B0', opacity: 0.18 });
  o += bk + E.letterbox(1, 60);
  return o;
}
// 28. "Of course, kiddo." — split: real Dad touched at his laptop | the hot dog kneels to the kid, hearts
function shOfc(t) {
  const camR = camAt(1000, 470, 2.4);
  const left = realDad(t, { face: { name: 'happy', eyes: { type: 'happy' }, mouth: 'smallSmile', fx: ['tears', 'blush'] }, armL: 30, armR: 30, glasses: 'up', headRot: -6 }, { cam: camR, mom: true, momPose: { face: { name: 'happy', eyes: { look: [-0.6, 0] } } } });
  const kneel = ease.inOut(seg(t, CUT.ofc, CUT.ofc + 0.5));
  const camG = camAt(2560, 770, 1.6);
  const ch = dad(t, { x: DADF.x + 20, y: DADF.y, s: DFS, turn: 0.4, bodyY: 60 * kneel, legL: 0, kneeL: 0, armR: lerp(20, 120, kneel), armL: 15, face: still('love', { fx: ['blush'] }), nametag: false }, { arms: false });
  const kd = KID0(t, { x: KIDP.x - 30, y: KIDP.y, s: sAt(KIDP.y), turn: -0.5, face: { name: 'happy', eyes: { type: 'happy' }, fx: ['blush'] }, armL: 30, armR: 10, ...boing(t, CUT.ofc + 0.5, 0.15) }, { arms: false });
  const hearts = G.emoteHearts({ x: 2560, y: 640, age: t - CUT.ofc - 0.3, n: 10, s: 1, seed: 9 });
  const right = E.plaza(t, camG, { deep: 1 }, '', eveCrowd(t, 'love') + ch + kd, hearts);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#151515' });
  o += panel(16, 16, 940, 1048, left, { border: 0, shadow: false }) + panel(964, 16, 940, 1048, right, { border: 0, shadow: false });
  o += S.path('M960 0 V1080', ln(14, '#FFFFFF')) + S.path('M960 0 V1080', ln(4, '#151515'));
  return o;
}
// 29. "Everybody gets a dad today!" — arms wide, the crowd piles in for a group hug, hearts everywhere
function shEveryb(t) {
  const cam = camKeys(t, [[CUT.everyb, camAt(2450, 640, 1.15)], [CUT.noodle, camAt(2450, 660, 1.24)]], ease.inOut);
  const tE = w(9, 'Everybody');
  const wide = ease.outBack(seg(t, tE - 0.1, tE + 0.25));
  const ch = dad(t, { x: DADF.x, y: DADF.y, s: DFS, armL: lerp(20, 125, wide), armR: lerp(20, 125, wide), face: still('joy', { fx: ['sparkles'] }), nametag: false }, { arms: false });
  const rush = ease.inOut(seg(t, tE + 0.1, tE + 0.9));
  const crowd = EVE.map((p, j) => [...p, j]).sort((a, b) => a[1] - b[1]).map(([x, y, i, kind, j]) => {
    const nx = lerp(x, DADF.x + (x - DADF.x) * 0.45, rush), ny = lerp(y, DADF.y + (y - DADF.y) * 0.5, rush);
    const pose = { x: nx, y: ny, s: sAt(ny), turn: x < DADF.x ? 0.4 : -0.4, armL: 60 + 60 * rush, armR: 60 + 60 * rush, face: { name: 'joy', eyes: { type: 'happy' }, fx: ['blush'] }, shadow: true, t, lift: 14 * Math.abs(Math.sin(t * 9 + j)) * (1 - rush) };
    return kind === 'player' ? CAST.draw.player(i, pose) : CAST.draw.noob(i, pose);
  }).join('');
  const kd = KID0(t, { x: KIDP.x - 30, y: KIDP.y, s: sAt(KIDP.y), turn: -0.5, face: { name: 'joy' }, armL: 120, armR: 120 }, { arms: false });
  const nd = noodleSit(t, { face: { name: 'joy' }, armL: 130, armR: 130 });
  const oh = G.overHead(DADF.x, DADF.y, DFS, 'dadAvatar');
  let over = G.emoteHearts({ x: DADF.x, y: oh.head + 120, age: t - tE, n: 24, s: 1.4, seed: 2, spread: 1.6 });
  over += G.nametag({ x: DADF.x, y: oh.tag, name: 'DAD', level: 99, col: '#FF5FA8', crown: true, t, s: 1.1 });
  return E.plaza(t, cam, { deep: 1 }, '', crowd + kd + nd + ch, over) + sBubble(cam, DADF.x, oh.tag - 50, { caps: true, t, minY: 170, ...G.chatLine(t, '07.9', { from: 'Everybody', hold: 0.3, pre: 0.15, text: 'Everybody gets a dad today!' }), minY: 330 });
}
// 30. NOODLE: "Your dad is so cool, bro." — on the crate next to Dad, happy, legs swinging
function shNoodle(t) {
  const cam = camKeys(t, [[CUT.noodle, camAt(2400, 650, 1.55)], [CUT.nodad, camAt(2390, 640, 1.62)]], ease.inOut);
  const swing = Math.sin(t * 4);
  const nd = noodleSit(t, { face: 'joy', kneeL: 90 + 18 * swing, kneeR: 90 - 18 * swing, armL: 20, armR: 30, turn: 0.3 }, { arms: true, energy: 1 });
  const ch = dad(t, { x: DADF.x, y: DADF.y, s: DFS, turn: -0.35, face: still('happy', { eyes: { look: [-0.8, -0.2] } }), armL: 14, armR: 14, nametag: false }, { arms: false });
  const kd = KID0(t, { x: KIDP.x, y: KIDP.y, s: sAt(KIDP.y), turn: -0.5, face: { name: 'happy', eyes: { look: [-0.6, -0.6] } }, armL: 100, armR: 8 }, { arms: false });
  const crowd = eveCrowd(t, 'love');
  const bub = sBubble(cam, NOOD.x - 20, NOOD.hip - 420, { t, user: 'NoodleBoi', ...G.chatLine(t, '07.10', { to: 'bro', hold: 0.5, pre: 0.2, text: 'Your dad is so cool, bro.' }) });
  return E.plaza(t, cam, { deep: 1, dof: 0.3 }, crowd, nd + ch + kd) + bub;
}
// 31. "My dad never plays with me." — closer: Noodle's small sad smile; Dad's hand pats his bowl
function shNoDad(t) {
  const cam = camKeys(t, [[CUT.nodad, camAt(2380, 560, 2.15)], [CUT.far, camAt(2390, 560, 2.3)]], ease.inOut);
  const tP = w(10, 'plays');
  // Dad's arm goes round Noodle's shoulders on "plays" (a side hug); Noodle leans into it
  const reach = ease.inOut(seg(t, tP - 0.45, tP + 0.05));
  const lean = ease.inOut(seg(t, tP, tP + 0.5));
  const nd = noodleSit(t, { face: { name: 'sad', mouth: 'smallSmile', eyes: { look: [0.3, 0.4] } }, armL: 14, armR: 14, turn: 0.15 + 0.2 * lean, rot: 5 * lean, headRot: 6 * lean, volume: false, nametag: false }, { arms: false, energy: 0.6 });
  const ch = dad(t, { x: DADF.x, y: DADF.y, s: DFS, turn: -0.4 * (1 - reach), face: still('sad', { eyes: { look: [-0.8, 0.1] } }), armR: 14, armL: lerp(14, 96, reach), nametag: false, volume: false }, { arms: false });
  const sk = seg(t, tP + 0.2, tP + 1.0);
  const q = GS.toScreen(cam, NOOD.x + 20, NOOD.hip - 330);
  const glow = sk > 0 && sk < 1 ? K.sparkles([[q.x - 140, q.y - 40, 26 * Math.sin(Math.PI * sk)], [q.x + 170, q.y + 30, 20 * Math.sin(Math.PI * sk)]], t) : '';
  return E.plaza(t, cam, { deep: 1, dof: 0.25 }, '', nd + ch) + glow;
}
// 32. (beat) the hero, far away, alone — from behind him: the warm crowd in the distance
const HERO = { x: 1180, y: 1055 };
function shFar(t) {
  const cam = camKeys(t, [[CUT.far, camAt(1800, 690, 0.86)], [CUT.mine, camAt(1760, 680, 0.92)]], ease.inOut);
  const crowd = eveCrowd(t, 'love');
  const ch = dad(t, { x: DADF.x, y: DADF.y, s: DFS, face: still('joy'), armL: 30, armR: 30, nametag: false }, { arms: false });
  const kd = KID0(t, { x: KIDP.x, y: KIDP.y, s: sAt(KIDP.y), turn: -0.5, armL: 100 }, { arms: false });
  const nd = noodleSit(t, { face: 'happy' });
  const hero = actor('you', t, { x: HERO.x, y: HERO.y, s: sAt(HERO.y), view: 'back', headRot: 4, armL: 4, armR: 4 }, { arms: false });
  const shadow = S.path(`M${HERO.x - 60} ${HERO.y + 4} L${HERO.x + 620} ${HERO.y - 40} L${HERO.x + 660} ${HERO.y + 6} L${HERO.x + 40} ${HERO.y + 22} Z`, { fill: '#5A2A5A', opacity: 0.25 });
  const hearts = G.emoteHearts({ x: DADF.x, y: 500, age: (t - CUT.far) % 1.8, n: 8, s: 0.9, seed: 11 });
  return E.plaza(t, cam, { deep: 1 }, '', crowd + kd + nd + ch + shadow + hero, hearts);
}
// 33. "...He's MY dad." — close on the hero, jealous; the crowd blurred in the warm distance behind
// (a fake telephoto: the warm crowd plate far behind, a soft veil, the hero big in the foreground, screen space)
function shMine(t) {
  const u = seg(t, CUT.mine, CUT.real);
  const camB = camAt(lerp(2330, 2360, u), 760, 1.02, 1250, 560);
  const crowd = eveCrowd(t, 'love');
  const ch = dad(t, { x: DADF.x, y: DADF.y, s: DFS, face: still('joy', { eyes: { type: 'happy' } }), armL: 60 + 20 * Math.sin(t * 4), armR: 60 + 20 * Math.sin(t * 4 + 2), nametag: false }, { arms: false });
  const kd = KID0(t, { x: KIDP.x, y: KIDP.y, s: sAt(KIDP.y), turn: -0.5, armL: 100, armR: 20, face: 'joy' }, { arms: false });
  const nd = noodleSit(t, { face: 'happy', armL: 120, armR: 30 });
  const oh = G.overHead(DADF.x, DADF.y, DFS, 'dadAvatar');
  const over = G.nametag({ x: DADF.x, y: oh.tag, name: 'DAD', level: 99, col: '#FF5FA8', crown: true, t, s: 1.0 }) + G.emoteHearts({ x: DADF.x, y: oh.tag - 30, age: (t - CUT.mine) % 1.7, n: 10, s: 1, seed: 13 });
  let o = E.plaza(t, camB, { deep: 1 }, '', crowd + kd + nd + ch, over);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FFC4B4', opacity: 0.38 }) + S.rect(0, 0, 1920, 1080, 0, { fill: '#4A2A5A', opacity: 0.16 });
  // the hero: shoulders up, left third, turned to the crowd; the light is behind him (rim + a cool shadow side)
  const push = ease.inOut(u);
  const hs = lerp(1.18, 1.28, push);
  const hx = lerp(560, 600, push), hy = 1290 + 40 * push;
  const tMy = w(11, 'MY');
  const clench = seg(t, tMy - 0.1, tMy + 0.2);
  o += S.ellipse(hx + 60, hy - 760 * hs, 330 * hs, 360 * hs, { fill: '#FFB07A', opacity: 0.22 });
  o += actor('you', t, { x: hx, y: hy, s: hs, turn: 0.55, volume: false, face: { name: 'sad', eyes: { look: [1, -0.05], upper: 0.45 + 0.15 * clench }, fx: clench > 0.5 ? ['anger'] : [] }, armL: 8, armR: 8 + 6 * clench, headRot: -3 + 2 * clench, nametag: false }, { arms: false, energy: 0.35 });
  o += E.letterbox(seg(t, CUT.mine, CUT.mine + 0.4), 64);
  return o;
}
// 34. match cut — the REAL hero at his PC, same frown, lit gold by the sunset game; behind him the family laughing
// (the monitor POV: he stares into his screen; behind him, out of focus, Dad, Mom and Granny crack up at their devices)
function shReal(t) {
  const u = ease.inOut(seg(t, CUT.real, END));
  const camP = camAt(lerp(1360, 1320, u), 560, lerp(1.26, 1.32, u));
  let o = E.heroPOV(t, { camP, s: lerp(1.12, 1.2, u), x: lerp(610, 590, u), y: lerp(1310, 1340, u), face: { name: 'angry', mouth: 'frown', eyes: { upper: 0.4, look: [0, 0.05] } }, pose: { headRot: -2 } });
  const ha = (txt, x, y, ph, r) => E.TS(txt, x, y + 8 * Math.sin(t * 9 + ph), 64, '#FFD23F', { opacity: f(0.85 * seg(t, CUT.real + 0.25 + ph * 0.1, CUT.real + 0.5 + ph * 0.1)), transform: `rotate(${r} ${x} ${y})` });
  o += ha('HA HA!', 1230, 250, 0, -8) + ha('HEE HEE', 1560, 330, 2, 6) + ha('HO HO HO', 1500, 150, 4, -4);
  return o + smash(t, CUT.real, 0.12, 0.6);
}

// ================================================================= dispatch
const SHOTS = [
  [CUT.open, shOpen], [CUT.edge, shEdge], [CUT.lapse, shLapse], [CUT.okay, shOkay], [CUT.key, shKey], [CUT.hop1, shHop1], [CUT.yell, shYell], [CUT.leap, shLeap],
  [CUT.sit, shSit], [CUT.gather, shGather], [CUT.kiddo, shKiddo], [CUT.believe, shBelieve], [CUT.notme, shNotMe], [CUT.jump, shJump], [CUT.cheer, shCheer],
  [CUT.jokes, shJokes], [CUT.punch, shPunch], [CUT.deadpan, shDeadpan], [CUT.likeme, shLikeMe], [CUT.lol, shLol],
  [CUT.crate, shCrate], [CUT.notfail, shNotFail], [CUT.trying, shTrying], [CUT.fell, shFell], [CUT.sunset, shSunset], [CUT.dadname, shDadName],
  [CUT.tug, shTug], [CUT.kidcu, shKidCU], [CUT.ofc, shOfc], [CUT.everyb, shEveryb], [CUT.noodle, shNoodle], [CUT.nodad, shNoDad], [CUT.far, shFar], [CUT.mine, shMine], [CUT.real, shReal],
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
  if (t >= CUT.key && t < CUT.hop1) return { grade: 'night', vignette: 0.6 };
  if (t >= CUT.real) return { grade: 'night', vignette: 0.55 };
  if (t >= CUT.mine) return { grade: 'warm', vignette: 0.75 };
  return { grade: 'warm', vignette: 0.45 };
}

// the evening crowd shot for SC 08's "your dad was everyone's favorite" panel
function eveShot(t, cam) {
  const ch = dad(t, { x: DADF.x, y: DADF.y, s: DFS, volume: false, face: still('joy', { eyes: { type: 'happy' } }), armL: 120 + 20 * Math.sin(t * 6), armR: 120 + 20 * Math.sin(t * 6 + 2), nametag: false }, { arms: false });
  const kd = KID0(t, { x: KIDP.x, y: KIDP.y, s: sAt(KIDP.y), turn: -0.5, face: 'joy', armL: 120, armR: 120 }, { arms: false });
  const oh = G.overHead(DADF.x, DADF.y, DFS, 'dadAvatar');
  const over = G.nametag({ x: DADF.x, y: oh.tag, name: 'DAD', level: 99, col: '#FF5FA8', crown: true, t, s: 1.1 }) + G.emoteHearts({ x: DADF.x, y: oh.tag - 30, age: (t - T0) % 1.7, n: 14, s: 1.2, seed: 4 });
  return E.plaza(t, cam, { deep: 1 }, '', eveCrowd(t, 'cheer') + kd + noodleSit(t, { face: 'joy', armL: 140, armR: 140, volume: false }) + ch, over);
}
const BEATS = { T0, END, tPress1, tHop1, tTopple1, tSplash1, tResp1, tLeap, tApex, tDrop, tSplash2, tResp2, tJump, tLandJ, tRim, tDadName, tFF0, tFF1, tSun0, tSun1 };
module.exports = { scene, look, SHOTS, CUT, BEATS, DEFS: E.DEFS, eveShot, DADF, camAt };
