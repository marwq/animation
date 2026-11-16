// SC 08 · БИТВА КОМАНД — ";freeze" → an ice block; Granny melts it with a hair dryer at 1500 km/h; the teleport chase
// (desert → ocean → mountain: he is always already there — with a parasol, a coconut, a sandwich); "Teleport is my
// command. I invented it."; the jail ping-pong (cages up, cages down, eleven minutes of it); ";size me 100" → a giant
// you over the city → ";size me 1000" → a boot. "He always had a bigger number." Dad flies in ("Can you hear me
// now?!" — "EVERYBODY can hear you!"), giant Pancake pounces on the cape, Zoe on Dad's back hacks the logs: "He's a
// PERSON!" Battery 3%. "TELEPORT ME TO THE ADMIN!" → flash.
'use strict';

const K = require('./kit');
const E = require('./s07_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, actor, R, P, Ci, El, G, tr, outT, outTF, pop, at, shook, flash, whip } = E;
const CS = require('./city');
const SETS = require('./sets');
const CATS = require('../rig/cats');
const CAST = require('../rig/cast');
const { L } = K.V;

const START = K.V.scene('SC 08').start, END = K.V.scene('SC 09').start;
const n = Array.from({ length: 19 }, (_, i) => L('08.' + i));
const Wd = (i, w, k = 0) => n[i].word(w, k).t0;
const We = (i, w, k = 0) => n[i].word(w, k).t1;

// ---------------------------------------------------------------- cuts (from the voice)
const d1 = n[1].a - 0.1;                    // B  frozen solid
const d2 = n[2].a - 0.25;                   // C1 Granny streaks in
const d3 = Wd(2, "Granny's") - 0.1;         // C2 the hair dryer melts the ice
const d4 = n[3].a - 0.1;                    // D  "Th-thanks, Granny!"
const d5 = Wd(3, 'Teleport') - 0.1;         // E  ;tp me away
const d6 = n[4].a - 0.05;                   // F1 desert
const d7 = Wd(4, 'He') - 0.1;               // F1b he was there (parasol)
const d8 = Wd(4, 'To', 1) - 0.12;           // F2 ocean
const d9 = Wd(4, 'He', 1) - 0.1;            // F2b he was there (coconut)
const d10 = Wd(4, 'To', 2) - 0.12;          // F3 mountain
const d11 = Wd(4, 'He', 2) - 0.1;           // F3b he was there... with a snack
const d12 = n[5].a - 0.1;                   // G  "Teleport is my command. I invented it."
const d13 = n[6].a - 0.1;                   // H  ;jail Admin
const d14 = n[7].a - 0.1;                   // I  ;unjail me
const d14b = Wd(7, 'Jail') - 0.12;          // I2 ;jail you
const d15 = n[8].a - 0.1;                   // J  ping-pong
const d16 = n[9].a - 0.1;                   // K  eleven minutes
const d17 = n[10].a - 0.1;                  // L1 ;size me 100
const d17b = n[10].b - 0.05;                // L2 you grow; ;size me 1000
const d18 = n[11].b + 0.05;                 // N1 the boot
const d18b = Wd(12, 'had') + 0.1;           // N2 tilt up the giant
const d18c = n[12].b + 0.55;                // N3 the shadow (the beat)
const d19 = n[13].a - 0.15;                 // O1 Dad flies in
const d20 = Wd(13, 'Can') - 0.1;            // O2 "Can you hear me now?!"
const d21 = n[14].a - 0.1;                  // P1 "Yes! I can hear you!"
const d22 = Wd(14, 'Everybody') - 0.1;      // P2 everybody (+ Pancake pounces on the cape)
const d23 = n[15].a - 0.1;                  // Q1 Zoe hacks on Dad's back
const d24 = Wd(15, "he's", 1) - 0.1;        // Q2 her screen: PERSON
const d25 = n[16].a - 0.1;                  // R1 "Then I'm going there."
const d26 = Wd(16, 'Teleport') - 0.1;       // R2 ;tp me to Admin
const d27 = n[17].a - 0.1;                  // S  battery 3%
const d28 = n[18].a - 0.1;                  // T  TELEPORT ME TO THE ADMIN!

const tFreeze = n[0].b;
const tMelt0 = d3 + 0.25, tMelt1 = d4 - 0.15;
const tTp = n[3].b;
const tChomp = Wd(4, 'snack');
const tInvent = Wd(5, 'invented');
const tGrow = n[10].b;
const tBoot = d18 + 0.18;
const tPounce = Wd(14, 'Everybody') + 0.35;
const tPerson = Wd(15, 'PERSON');
const tReal = Wd(15, 'REAL');
const tThree = Wd(17, 'three');
const tGo = Wd(18, 'ADMIN');

// ---------------------------------------------------------------- shared
const CITY_O = (o = {}) => ({ time: 1, crack: 0, admin: 0.35, flying: 0, flyNear: false, ...o });
function crackArt(t, k = 1) {
  const C_ = CS.CITY.crack;
  return CS.crack(C_.x, C_.y, 560, k, { glow: 1 });
}
function roofFrame(t, cam, o, { skyArt = '', chars = '', over = '' } = {}) {
  const Ly = CS.rooftop(t, cam, CITY_O({ ...o, onSky: crackArt(t) + (o.onSky || '') }));
  return Ly.bg + skyArt + Ly.mid + chars + Ly.fg + Ly.light + over;
}
const adm = (t, pose, act) => actor('admin', t, { t, glow: 0.7, face: 'determined', ...pose }, act);
const sky = (x, y, w, h, t, o) => CS.skyChat(x, y, w, h, t, o);
const FLOOR = CS.FLOOR;
// Dad flying head-first to the LEFT (superhero), Zoe sitting on his back. (x, y) = Dad's feet point before rotation.
function dadFly(t, x, y, s, o = {}) {
  const sway = Math.sin(t * 3) * 3;
  let out = '';
  if (o.trail !== false) for (let i = 0; i < 4; i++) out += R(x + 80 * s / 0.4 + i * 30, y - (250 + i * 50) * s / 0.4, 160 + i * 60, 10, 5, { fill: '#FFFFFF', opacity: 0.6 });
  out += actor('dad', t, { x, y, s, view: 'side', flip: true, rot: 90 + sway, rotY: -306, armL: o.armL ?? -170, armR: o.armR ?? -150, legL: -8 + sway, legR: 12 - sway, headRot: o.headRot ?? -45, face: o.dadFace || 'determined', shadow: false }, { arms: false, energy: 0.6 });
  if (o.zoe !== false) {
    const zs = s * 0.86, typing = Math.sin(t * 28) * 6;
    out += actor('zoe', t, { x: x - 10 * s / 0.42, y: y - 150 * s / 0.42, s: zs, view: 'side', legL: 90, kneeL: 90, legR: 80, kneeR: 85, armL: 60 + typing, armR: 50 - typing, laptop: true, face: o.zoeFace || { name: 'determined', eyes: { look: [-0.6, 0.6] } }, shadow: false }, { arms: false, energy: 0.5 });
  }
  return out;
}
// night sky with drifting clouds (for the high-up shots), speed = cloud drift px/s
function nightSky(t, cam, speed = 0, o = {}) {
  const Ly = CS.giantScale(t, cam, { time: 1, admin: o.admin ?? 0.3, shadow: o.shadow || 0 });
  let cl = '';
  for (let i = 0; i < 6; i++) {
    const x = ((hash(i * 3.1) * 2600 - t * speed * (0.6 + hash(i) * 0.8)) % 2600 + 2600) % 2600 - 340, y = 120 + hash(i * 7.3) * 820, sc = 0.7 + hash(i * 1.7) * 0.9;
    cl += P(`M${f(x)} ${f(y)}h${f(260 * sc)}a${f(40 * sc)} ${f(40 * sc)} 0 0 0 0 ${f(-80 * sc)}a${f(70 * sc)} ${f(70 * sc)} 0 0 0 ${f(-120 * sc)} -${f(30 * sc)}a${f(60 * sc)} ${f(60 * sc)} 0 0 0 ${f(-140 * sc)} ${f(40 * sc)}a${f(36 * sc)} ${f(36 * sc)} 0 0 0 0 ${f(70 * sc)}Z`, { fill: '#5A4E9A', opacity: 0.55 });
  }
  return { Ly, clouds: cl };
}
// the hero: dripping wet (after the ice)
function drips(x, y, s, t, k = 1) {
  if (!(k > 0.01)) return '';
  let d = '';
  for (let i = 0; i < 5; i++) { const ph = (t * 1.5 + i / 5) % 1, dx = x + (i - 2) * 70 * s; d += `M${f(dx)} ${f(y - 900 * s + ph * 600 * s)}q-8 14 0 20q8 -6 0 -20Z`; }
  return P(d, { fill: '#8ED8FF', stroke: '#2E6E96', 'stroke-width': 3, opacity: f(k) });
}
// icicles hanging from the hero's hair line (body space → screen with x, y, s)
function icicles(x, y, s, k = 1) {
  if (!(k > 0.01)) return '';
  let d = '';
  // along the sides of the bowl cut and the laptop's bottom edge
  const spots = [[-196, -640], [-176, -632], [-156, -626], [156, -626], [176, -632], [196, -640], [-110, -100], [-40, -100], [40, -100], [110, -100]];
  spots.forEach(([bx, by], i) => { const ix = x + bx * s, iy = y + by * s, len = (34 + hash(i * 3) * 46) * s * k; d += `M${f(ix - 10 * s)} ${f(iy)}L${f(ix + 10 * s)} ${f(iy)}L${f(ix)} ${f(iy + len)}Z`; });
  return P(d, { fill: '#DDF6FF', stroke: '#2E6E96', 'stroke-width': 3 });
}

// ================================================================ SHOTS
// A — "Freeze." — he points, the sky types it, ENTER: an icy blast
function shotA(t) {
  const cam = shook(at(960, 470, 1.0), t, [[tFreeze, 0.4, 18]]);
  const pt = ease.out(seg(t, START, START + 0.25));
  let art = K.view(cam, adm(t, { x: 1250, y: 1080, s: 0.8, glow: 1, armR: lerp(30, 120, pt), armL: 20, face: { name: 'angry', eyes: { upper: 0.4 }, fx: [] } }, { arms: false }), 0.22);
  art += K.view(cam, sky(640, 300, 860, 250, t, { text: ';freeze you', progress: clamp((t - START) / Math.max(0.2, tFreeze - START), 0, 1), glow: 1, size: 88 }), 0.12);
  const over = K.commandBurst(960, 600, t - tFreeze, '#BFF6FF', 650) + flash(t, tFreeze, 0.25, '#DDF6FF', 0.85) + whip(t, START, -1, 0.14);
  return roofFrame(t, cam, { admin: 0.85 }, { skyArt: art, over });
}
// the frozen hero on the roof (shared by B / C1 / C2)
function frozenHero(t, x, melt, opts = {}) {
  const fy = CS.ROOF.floor, s = 0.42;
  const grow = seg(t, d1 - 0.05, d1 + 0.22);
  const thaw = clamp(melt, 0, 1);
  let o = E.hero(t, { x, y: fy, s, laptop: 'back', armL: 105, armR: 128, face: thaw > 0.85 ? { name: 'scared', eyes: { look: [-0.6, 0] }, fx: ['sweat'] } : { name: 'scared', mouth: 'O', eyes: { pupil: 0.45 } }, ...opts.pose }, { arms: false, energy: 0 });
  o += E.puddle(x, fy, 260, thaw);
  o += E.iceBlock(x, fy, 430, 480, grow, thaw, t);
  if (thaw < 0.6) o += E.frost(x, fy - 250, 250, t, 1 - thaw);
  return o;
}
// B — "He froze you solid."
function shotB(t) {
  const u = seg(t, d1, d2);
  const cam = shook(at(980, 640, lerp(1.55, 1.68, u)), t, [[d1 + 0.05, 0.3, 12]]);
  let chars = frozenHero(t, 980, 0);
  const crk = seg(t, d1 + 0.05, d1 + 0.3);
  return roofFrame(t, cam, { admin: 0.6 }, { chars: K.view(cam, chars, 1), over: (crk > 0 ? K.bang('CRACKLE!', 1500, 260, crk, 80, 8, '#DDF6FF') : '') + flash(t, d1, 0.2, '#DDF6FF', 0.6) });
}
// Granny with the hair dryer (front, turned to screen-right); dryer on 0..1
function grannyDryer(t, x, y, s, on, o = {}) {
  const [hx, hy] = E.A.hand(100, 1);
  const dry = E.hairDryer(hx, hy, 1.3, -4 + Math.sin(t * 30) * 2 * on, t, on);
  let out = actor('granny', t, { x, y, s, fast: true, turn: 0.5, armR: 100, armL: 30 + 20 * Math.sin(t * 9), face: 'excited', props: [{ svg: dry, layer: 'front' }], ...o }, { arms: false, energy: 1.6 });
  if (on > 0.3) out += CAST.fireTrail({ x: x + (hx + 330 * 1.3) * s * 0.86, y: y + (hy - 112 * 1.3) * s * 0.86, len: 240, angle: 0, w: 70, t, alpha: on });
  return out;
}
// C1 — "Hold still, sweetie!" Granny streaks across the roof on a fire trail and skids to a stop
function shotC1(t) {
  const u = seg(t, d2, d3);
  const cam = at(960, 600, 1.12);
  const run = ease.out(seg(t, d2, d2 + 0.55));
  const gx = lerp(-500, 560, run), gy = CS.ROOF.floor;
  let chars = frozenHero(t, 1150, 0);
  if (run < 1) {
    chars += CAST.fireTrail({ x: gx - 60, y: gy - 200, len: 900 * (1 - run * 0.7), angle: 180, w: 120, t });
    const [hx, hy] = [4 - 250, -505];
    chars += actor('granny', t, { x: gx, y: gy, s: 0.42, fast: true, view: 'side', flip: true, armL: 90, armR: -30, legL: 50, kneeL: 30, legR: -40, kneeR: 70, lean: lerp(14, -10, run), face: 'excited', props: [{ svg: G(E.hairDryer(0, 0, 1.3, 0, t, 0), `translate(${hx} ${hy}) scale(-1 1)`), layer: 'front' }] }, { arms: false });
    if (run > 0.6) chars += K.C.dust(gx - 120, gy - 20, d2 + 0.35, t);
  } else {
    chars += grannyDryer(t, gx, gy, 0.42, seg(t, d3 - 0.4, d3));
  }
  // skid marks
  chars += P(`M${f(Math.max(-400, gx - 700))} ${gy - 6}H${f(gx - 40)}`, ln(10, '#1A1630', 0.5 * seg(t, d2 + 0.2, d2 + 0.4)));
  void u;
  return roofFrame(t, cam, { admin: 0.5 }, { chars: K.view(cam, chars, 1) }) + whip(t, d2, 1, 0.16);
}
// C2 — "Granny's got a hair dryer!" — the ice melts in a second
function shotC2(t) {
  const u = seg(t, d3, d4);
  const cam = at(900, 610, lerp(1.45, 1.55, u));
  const melt = ease.inOut(seg(t, tMelt0, tMelt1));
  let chars = grannyDryer(t, 560, CS.ROOF.floor, 0.42, 1);
  chars += frozenHero(t, 1150, melt);
  // steam
  let st = '';
  for (let i = 0; i < 6; i++) { const ph = (t * 1.2 + i / 6) % 1; st += Ci(1050 + i * 40 + Math.sin(t * 3 + i) * 20, 700 - ph * 400, 30 + ph * 40, { fill: '#FFFFFF', opacity: f(0.5 * (1 - ph) * Math.min(1, melt * 4) * (1 - seg(t, tMelt1, d4))) }); }
  return roofFrame(t, cam, { admin: 0.45 }, { chars: K.view(cam, chars + st, 1), over: K.bang('FWOOOSH', 860, 250, seg(t, d3 + 0.1, d3 + 0.3), 80, -6, '#FF8A3D') });
}
// D — "Th-thanks, Granny!" — soaked, icicles, teeth chattering
function shotD(t) {
  const u = seg(t, d4, d5);
  const cam = at(1100, 600, lerp(1.95, 2.05, u));
  const jit = Math.sin(t * 60) * 5;
  const x = 1150 + jit, fy = CS.ROOF.floor, s = 0.42;
  let chars = E.puddle(1150, fy, 260, 1);
  chars += grannyDryer(t, 640, fy, 0.42, 0.6);
  chars += E.hero(t, { x, y: fy, s, laptop: 'back', armL: 20, armR: 20, headRot: Math.sin(t * 50) * 2, face: { name: 'nervous', eyes: { look: [-0.6, 0] }, fx: ['sweat', 'blush'] } }, { arms: false, energy: 0.3 });
  chars += icicles(x, fy, s) + drips(x, fy, s, t);
  return roofFrame(t, cam, { admin: 0.45 }, { chars: K.view(cam, chars, 1) + T('brrr', 1300, 330, 60, '#DDF6FF', { ...E.OUT(8), transform: `rotate(${f(Math.sin(t * 40) * 4)} 1300 330)` }) });
}
// E — "Teleport... me... away!" — ;tp me away → beam → gone
function shotE(t) {
  const cam = shook(at(1060, 600, 1.55), t, [[tTp, 0.3, 10]]);
  const out = seg(t, tTp, tTp + 0.18);
  const x = 1150, fy = CS.ROOF.floor, s = 0.42;
  let chars = E.puddle(1150, fy, 260, 1) + grannyDryer(t, 640, fy, 0.42, 0, { face: t > tTp ? { name: 'happy', eyes: { type: 'happy' } } : 'excited', armL: t > tTp ? 150 + 20 * Math.sin(t * 14) : 30 });
  const typing = Math.sin(t * 30) * 7 * (t < tTp ? 1 : 0);
  if (out < 1) chars += E.hero(t, { x, y: fy, s, laptop: 'back', armL: 26 + typing, armR: 26 - typing, ...E.tpSquash(out), face: { name: 'determined', eyes: { look: [0, 0.6] } } }, { arms: false }) + icicles(x, fy, s, 1 - out);
  chars += E.tpBeam(x, fy, s, bump(t, tTp - 0.05, tTp + 0.4), t);
  const prog = K.typeProgress(t, n[3], 'Teleport', 'away');
  const over = K.chatCommand(1000, 150, ';tp me away', prog, { t, enter: t >= tTp ? clamp((t - tTp) / 0.35, 0, 1) : 0, s: 1.25 }) + flash(t, tTp + 0.05, 0.2, '#DDFBFF', 0.6);
  return roofFrame(t, cam, { admin: 0.45 }, { chars: K.view(cam, chars, 1), over });
}
// arrival + departure for the chase legs: returns squash/beam values
function tpState(t, tin, tout) {
  const i = 1 - seg(t, tin, tin + 0.22), o = tout ? seg(t, tout, tout + 0.16) : 0;
  return { squash: E.tpSquash(Math.max(i, o)), beam: Math.max(bump(t, tin - 0.05, tin + 0.4), tout ? bump(t, tout - 0.05, tout + 0.35) : 0), gone: o >= 1 };
}
// the chase: location label card
function locCard(txt, t, t0, col) {
  const k = seg(t, t0 + 0.05, t0 + 0.3) * (1 - seg(t, t0 + 1.6, t0 + 1.9));
  if (k <= 0) return '';
  return G(R(-200, -46, 400, 92, 24, ol(col, 7)) + T(txt, 0, 22, 62, '#FFFFFF', E.OUT(8)), tr(250, 120, pop(k), -4));
}
// F1 — the desert. Phew... → he was there (with a parasol)
function shotF1(t) {
  const reveal = t >= d7;
  const tp = tpState(t, d6, reveal ? d8 - 0.22 : 0);
  const cam = reveal ? shook(at(1060, 560, lerp(1.18, 1.24, seg(t, d7, d8))), t, [[d7, 0.25, 10]]) : at(960, 600, lerp(1.0, 1.08, seg(t, d6, d7)));
  const Ly = CS.desert(t, cam, { flash: 1 - seg(t, d6, d6 + 0.3) });
  const fy = FLOOR.desert, hx = 900, s = 0.42;
  const phew = seg(t, d6 + 0.6, d6 + 0.9) * (1 - seg(t, d7 - 0.2, d7));
  let chars = '';
  if (reveal) {
    const [hx2, hy2] = E.A.hand(40, -1);
    chars += adm(t, { x: 1320, y: fy, s: 0.44, glow: 0.4, armL: 40, armR: 12, turn: -0.4, face: { name: 'deadpan', eyes: { look: [-0.8, 0.3] } }, props: [{ svg: E.parasol(hx2, hy2, 1.1, -6, t), layer: 'front' }] }, { arms: false });
    chars += E.El(1320, fy - 4, 280, 26, { fill: '#000', opacity: 0.12 });
  }
  if (!tp.gone) chars += E.hero(t, { x: hx, y: fy, s, laptop: 'back', ...tp.squash, armR: reveal ? 26 : lerp(26, 165, phew), turn: reveal ? 0.6 : 0, face: reveal ? { name: 'shocked', eyes: { look: [1, 0], pupil: 0.45 }, fx: ['exclaim'] } : phew > 0.3 ? { name: 'happy', eyes: { type: 'closed' }, fx: ['sweat'] } : { name: 'neutral', eyes: { look: [-0.6, 0] } } }, { arms: false });
  chars += E.tpBeam(hx, fy, s, tp.beam, t);
  const over = locCard('DESERT', t, d6, '#F29A3D') + (t < d7 + 0.1 ? flash(t, d6, 0.2, '#FFFFFF', 0.9) : '') + (reveal ? whip(t, d7, 1, 0.12) : '');
  return Ly.bg + Ly.mid + K.view(cam, chars, 1) + Ly.fg + Ly.light + over;
}
// F2 — the ocean. Phew... → he was there (knee-deep, with a coconut)
function shotF2(t) {
  const reveal = t >= d9;
  const tp = tpState(t, d8, reveal ? d10 - 0.22 : 0);
  const cam = reveal ? shook(at(1180, 560, lerp(1.1, 1.16, seg(t, d9, d10))), t, [[d9, 0.25, 10]]) : at(1000, 580, lerp(1.08, 1.14, seg(t, d8, d9)));
  const Ly = CS.island(t, cam, { shark: true, flash: 1 - seg(t, d8, d8 + 0.3) });
  const fy = FLOOR.island, hx = 1060, s = 0.4;
  let chars = '';
  if (!tp.gone) chars += E.hero(t, { x: hx, y: fy, s, laptop: 'back', ...tp.squash, turn: reveal ? 0.6 : -0.2, face: reveal ? { name: 'shocked', eyes: { look: [1, 0.3], pupil: 0.45 }, fx: ['exclaim'] } : { name: 'happy', eyes: { look: [-0.4, 0] } } }, { arms: false });
  chars += E.tpBeam(hx, fy, s, tp.beam, t);
  let water = '';
  if (reveal) {
    const [hx2, hy2] = E.A.hand(70, 1);
    water += adm(t, { x: 1560, y: 1090 + Math.sin(t * 2) * 6, s: 0.44, glow: 0.4, armR: 70, armL: 12, turn: -0.4, face: { name: 'deadpan', eyes: { look: [-0.8, 0] } }, props: [{ svg: E.coconut(hx2 + 10, hy2 - 40, 1.6, 8), layer: 'front' }], shadow: false }, { arms: false });
  }
  if (reveal) {
    const w = Math.sin(t * 2.2) * 8;
    water += P(`M-600 1500V${f(930 + w)}Q-300 ${f(908 + w)} 0 ${f(930 + w)}T600 ${f(930 + w)}T1200 ${f(930 + w)}T1800 ${f(930 + w)}T2400 ${f(930 + w)}V1500Z`, { fill: '#2C8FE0' }) + P(`M-600 ${f(930 + w)}Q-300 ${f(908 + w)} 0 ${f(930 + w)}T600 ${f(930 + w)}T1200 ${f(930 + w)}T1800 ${f(930 + w)}T2400 ${f(930 + w)}`, ln(8, '#FFFFFF', 0.85));
    water += El(1560, 934, 200 + 20 * Math.sin(t * 3), 24, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 7, opacity: 0.8 });
  }
  const over = locCard('OCEAN', t, d8, '#2E9BF0') + (t < d9 ? flash(t, d8, 0.2, '#FFFFFF', 0.9) : '') + (reveal ? whip(t, d9, 1, 0.12) : '');
  return Ly.bg + K.view(cam, water, 1) + Ly.mid + K.view(cam, chars, 1) + Ly.fg + Ly.light + over;
}
// F3 — the top of a mountain. → he was there... with a snack (CHOMP)
function shotF3(t) {
  const reveal = t >= d11;
  const tp = tpState(t, d10, 0);
  const cam = reveal ? at(1000, 400, lerp(1.3, 1.4, seg(t, d11, d12))) : K.camKeys(t, [[d10, at(960, 560, 0.86)], [d11, at(940, 470, 1.1)]]);
  const Ly = CS.mountain(t, cam, { flash: 1 - seg(t, d10, d10 + 0.3), snow: 0.8 });
  const fy = FLOOR.mountain, hx = 820, s = 0.4;
  const pant = Math.sin(t * 9) * 4;
  let chars = '';
  if (reveal) {
    const lift = ease.inOut(seg(t, tChomp - 0.45, tChomp - 0.05));
    const bite = t >= tChomp ? 1 : 0;
    const a = lerp(40, 124, lift);
    const [hx2, hy2] = E.A.hand(a, 1);
    chars += adm(t, { x: 1110, y: fy, s: 0.42, glow: 0.4, armR: a, armL: 14, turn: -0.3, face: { name: 'deadpan', eyes: { look: [-0.7, 0.2], upper: 0.3 } }, props: [{ svg: E.sandwich(hx2 - 20 - 150 * lift, hy2 - 30 + 30 * lift, 0.9, -8, bite), layer: 'front' }] }, { arms: false });
    if (bite) chars += K.bang('CHOMP', 1260, 120, seg(t, tChomp, tChomp + 0.15), 70, 8, '#FFE14D');
  }
  chars += E.hero(t, { x: hx, y: fy, s, laptop: 'back', ...tp.squash, bodyY: reveal ? 0 : 4 + pant, turn: reveal ? 0.6 : 0, face: reveal ? (t > tChomp + 0.2 ? { name: 'deadpan', eyes: { look: [1, 0], upper: 0.55 }, fx: ['anger'] } : { name: 'shocked', eyes: { look: [1, 0], pupil: 0.45 } }) : { name: 'happy', eyes: { type: 'closed' }, fx: ['sweat'] } }, { arms: false });
  chars += E.tpBeam(hx, fy, s, tp.beam, t);
  const over = locCard('MOUNTAIN', t, d10, '#6E86C8') + flash(t, d10, 0.2, '#FFFFFF', 0.9) + (reveal ? whip(t, d11, 1, 0.12) : '');
  return Ly.bg + Ly.mid + K.view(cam, chars, 1) + Ly.fg + Ly.light + over;
}
// G — "Teleport is my command. ... I invented it." (the patent)
function shotG(t) {
  const u = seg(t, d12, d13);
  const cam = at(1120, 360, lerp(1.62, 1.72, u));
  const Ly = CS.mountain(t, cam, { snow: 0.6 });
  const fy = FLOOR.mountain;
  const chew = Math.max(0, Math.sin(t * 9)) * (t < Wd(5, 'Teleport') + 0.2 ? 1 : 0);
  const [hx2, hy2] = E.A.hand(60, 1);
  let chars = adm(t, { x: 1110, y: fy, s: 0.42, glow: 0.5, armR: 60, armL: 14, turn: -0.25, headY: chew * 6, face: { name: 'deadpan', eyes: { look: [-0.4, 0.1], upper: 0.35 } }, props: [{ svg: E.sandwich(hx2 - 10, hy2 - 30, 0.9, -20, 1), layer: 'front' }] }, { arms: false, energy: 0.5 });
  chars += E.hero(t, { x: 820, y: fy, s: 0.4, laptop: 'back', turn: 0.6, face: { name: 'deadpan', eyes: { look: [1, -0.2], upper: 0.5 } } }, { arms: false });
  const over = E.patent(820, 300, seg(t, tInvent - 0.1, tInvent + 0.25), 0.62, -6);
  return Ly.bg + Ly.mid + K.view(cam, chars, 1) + Ly.fg + Ly.light + over;
}

// ---------------------------------------------------------------- the jail ping-pong (summit)
const HX = 740, AX = 1190;
const e1 = n[6].b;                                   // you: ;jail Admin
const e2 = We(7, 'me');                               // ADMIN: ;unjail me
const e3 = n[7].b;                                    // ADMIN: ;jail you
const e4 = We(8, 'me');                               // you: ;unjail me
const e5 = We(8, 'you');                              // you: ;jail you
const e6 = e5 + 0.32;                                 // ADMIN: ;unjail me (instant)
const e7 = e6 + 0.24;                                 // ADMIN: ;jail you (instant)
const e8 = n[8].b;                                    // you: ;UNJAIL ME
const FEED = [
  { who: 'you', text: ';jail Admin', a: n[6].a, b: e1 },
  { who: 'ADMIN', text: ';unjail me', a: n[7].a, b: e2 },
  { who: 'ADMIN', text: ';jail you', a: Wd(7, 'Jail'), b: e3 },
  { who: 'you', text: ';unjail me', a: n[8].a, b: e4 },
  { who: 'you', text: ';jail you', a: Wd(8, 'Jail'), b: e5 },
  { who: 'ADMIN', text: ';unjail me', a: e5 + 0.04, b: e6 },
  { who: 'ADMIN', text: ';jail you', a: e6 + 0.02, b: e7 },
  { who: 'you', text: ';UNJAIL ME', a: Wd(8, 'unjail', 1), b: e8 },
];
// cage state for each prisoner: [dropStart, vanishStart]
const ADMIN_CAGES = [[e1, e2], [e5, e6]];
const HERO_CAGES = [[e3, e4], [e7, e8]];
function cageFor(t, list, x, y, s, theme, part) {
  for (const [a, b] of list) {
    if (t < a - 0.01 || t > b + 0.4) continue;
    const drop = seg(t, a, a + 0.42), van = seg(t, b, b + 0.35);
    return SETS.cage(x, y, s, t, { theme, part, drop, vanish: van });
  }
  return '';
}
const caged = (t, list) => list.some(([a, b]) => t >= a + 0.3 && t < b);
function summit(t, cam, extra = {}) {
  const Ly = CS.mountain(t, cam, { snow: 0.5 });
  const fy = FLOOR.mountain;
  const hCaged = caged(t, HERO_CAGES), aCaged = caged(t, ADMIN_CAGES);
  const typing = Math.sin(t * 30) * 7;
  const heroTyping = FEED.some((e) => e.who === 'you' && t >= e.a && t < e.b);
  const adminTyping = FEED.some((e) => e.who === 'ADMIN' && t >= e.a && t < e.b);
  let chars = cageFor(t, HERO_CAGES, HX, fy, 0.66, 'gold', 'back') + cageFor(t, ADMIN_CAGES, AX, fy, 0.98, 'green', 'back');
  chars += adm(t, { x: AX, y: fy, s: 0.42, glow: 0.5, armR: adminTyping ? 120 + 10 * Math.sin(t * 20) : aCaged ? 150 : 20, armL: aCaged ? 150 : 14, turn: -0.35, face: aCaged ? { name: 'deadpan', eyes: { upper: 0.5, look: [-0.6, 0] } } : { name: 'determined', eyes: { look: [-0.7, 0.3], upper: 0.25 } }, ...(extra.admin || {}) }, { arms: false });
  chars += E.hero(t, { x: HX, y: fy, s: 0.4, laptop: 'back', armL: 26 + (heroTyping ? typing : 0), armR: 26 - (heroTyping ? typing : 0), turn: 0.5, bodyY: hCaged ? 6 : 0, face: hCaged ? { name: 'angry', eyes: { look: [0.8, 0] }, fx: ['anger'] } : { name: 'determined', eyes: { look: [0.8, 0] } }, ...(extra.hero || {}) }, { arms: false, energy: 1.4 });
  chars += cageFor(t, HERO_CAGES, HX, fy, 0.66, 'gold', 'front') + cageFor(t, ADMIN_CAGES, AX, fy, 0.98, 'green', 'front');
  return Ly.bg + Ly.mid + K.view(cam, chars, 1) + Ly.fg + Ly.light;
}
const landShakes = () => [...ADMIN_CAGES, ...HERO_CAGES].map(([a]) => [a + 0.3, 0.25, 14]);
// H — "Jail... Admin!"
function shotH(t) {
  const cam = shook(at(970, 420, 1.12), t, landShakes());
  return summit(t, cam) + E.chatFeed(420, 380, 640, FEED, t, { n: 3, s: 0.95 });
}
// I — "Un-jail me." (on him) → I2 "Jail YOU." (on you)
function shotI(t) {
  const on = t < d14b ? AX : HX;
  const cam = shook(at(on, 380, 1.55), t, landShakes());
  return summit(t, cam) + E.chatFeed(400, 380, 640, FEED, t, { n: 3, s: 0.95 }) + (t >= d14b ? whip(t, d14b, -1, 0.12) : '');
}
// J — the ping-pong: the camera snaps to whoever just got caged
function shotJ(t) {
  const keys = [[d15, at(970, 430, 1.1)], [e4, at(970, 430, 1.1)], [e4 + 0.1, at(800, 420, 1.3)], [e5, at(800, 420, 1.3)], [e5 + 0.1, at(1150, 400, 1.3)], [e7, at(1150, 400, 1.3)], [e7 + 0.1, at(820, 440, 1.45)], [d16, at(860, 440, 1.6)]];
  const cam = shook(K.camKeys(t, keys, ease.out), t, landShakes());
  return summit(t, cam) + E.chatFeed(400, 410, 640, FEED, t, { n: 4, s: 0.95 }) + flash(t, e5, 0.1, '#FFFFFF', 0.4) + flash(t, e7, 0.1, '#FFFFFF', 0.4);
}
// K — "This went on for eleven minutes." — time-lapse through every location, cages strobing, a spinning clock
function shotK(t) {
  const u = seg(t, d16, d17);
  const locs = ['mountain', 'desert', 'island', 'roof'];
  const li = Math.min(3, Math.floor(u * 4.4));
  const strobe = Math.floor(t * 7) % 2;
  const tired = u;
  let o = '';
  const cam = at(960, 560, 1.0);
  let Ly, fy, hx, ax;
  if (locs[li] === 'mountain') { Ly = CS.mountain(t, cam, { snow: 0.5 }); fy = FLOOR.mountain; hx = 760; ax = 1170; }
  else if (locs[li] === 'desert') { Ly = CS.desert(t, cam, {}); fy = FLOOR.desert; hx = 760; ax = 1170; }
  else if (locs[li] === 'island') { Ly = CS.island(t, cam, {}); fy = FLOOR.island; hx = 900; ax = 1220; }
  else { Ly = CS.rooftop(t, cam, CITY_O({ onSky: crackArt(t) })); fy = CS.ROOF.floor; hx = 760; ax = 1170; }
  const hs = 0.38, as = 0.4;
  let chars = '';
  if (strobe) chars += SETS.cage(hx, fy, hs * 1.6, t, { theme: 'gold', part: 'back' }); else chars += SETS.cage(ax, fy, as * 2.3, t, { theme: 'green', part: 'back' });
  chars += adm(t, { x: ax, y: fy, s: as, glow: 0.4, armR: strobe ? 120 : 150, armL: strobe ? 14 : 150, turn: -0.3, lean: 6 * tired, face: { name: 'deadpan', eyes: { upper: 0.4 + 0.3 * tired, look: [-0.6, 0.2] } } }, { arms: false, energy: 0 });
  chars += E.hero(t, { x: hx, y: fy, s: hs, laptop: 'back', turn: 0.5, armL: 26 + 6 * Math.sin(t * 30), armR: 26 - 6 * Math.sin(t * 30), bodyY: 14 * tired, lean: -4 * tired, face: { name: tired > 0.5 ? 'sleepy' : 'angry', eyes: { look: [0.8, 0] }, fx: tired > 0.5 ? ['sweat', 'eyebags'] : ['anger'] } }, { arms: false, energy: 0 });
  if (strobe) chars += SETS.cage(hx, fy, hs * 1.6, t, { theme: 'gold', part: 'front' }); else chars += SETS.cage(ax, fy, as * 2.3, t, { theme: 'green', part: 'front' });
  o += Ly.bg + (Ly.mid || '') + K.view(cam, chars, 1) + Ly.fg + Ly.light;
  // time-lapse dressing: spinning clock + "+11:00"
  const mins = 11 * ease.inOut(u);
  o += E.clockFace(1640, 250, 150, mins * 60 % 60 + Math.floor(mins) * 60, seg(t, d16, d16 + 0.25));
  o += G(outT(`+${String(Math.floor(mins)).padStart(2, '0')}:${String(Math.floor((mins % 1) * 60)).padStart(2, '0')}`, 0, 0, 80, '#FFE14D', 12), tr(1640, 480, pop(seg(t, d16 + 0.1, d16 + 0.35))));
  // the chat spam column
  let spam = '';
  for (let i = 0; i < 9; i++) { const k = Math.floor(t * 9) + i; spam += TF(k % 2 ? '[ADMIN]: ;jail you' : '[you]: ;unjail me', 40, 140 + i * 52, 30, k % 2 ? '#FFD45A' : '#FFB13B', { 'text-anchor': 'start', opacity: f(0.35 + 0.65 * (i / 8)), ...E.OUT(5) }); }
  o += spam;
  return o + flash(t, d16 + li * 0.0, 0, '#FFF', 0) + (Math.floor(u * 4.4) !== Math.floor((u - 0.02) * 4.4) ? R(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: 0.4 }) : '');
}

// ---------------------------------------------------------------- the size duel
// L1 — "Fine! Size me... one hundred!" (back on the roof, hair a mess)
function shotL1(t) {
  const u = seg(t, d17, d17b);
  const cam = shook(at(900, 600, lerp(1.45, 1.55, u)), t, [[Wd(10, 'Fine'), 0.3, 12]]);
  const art = K.view(cam, adm(t, { x: 1420, y: 1120, s: 0.6, glow: 0.8, armL: 22, armR: 22, face: { name: 'deadpan', eyes: { upper: 0.45, look: [-0.6, 0.4] } } }, { arms: false }), 0.22);
  const slam = bump(t, Wd(10, 'Fine') - 0.05, Wd(10, 'Fine') + 0.3);
  const typing = Math.sin(t * 34) * 9 * (t > Wd(10, 'Size') ? 1 : 0);
  const chars = E.hero(t, { x: 900, y: CS.ROOF.floor, s: 0.42, laptop: 'back', armL: 26 + typing, armR: 26 - typing, bodyY: 10 * slam, sy: 1 - 0.05 * slam, face: { name: 'angry', eyes: { look: [0.2, 0.6] }, fx: ['anger', 'steam'] } }, { arms: false, energy: 1.4 });
  const prog = K.typeProgress(t, n[10], 'Size', 'hundred');
  const over = K.chatCommand(900, 150, ';size me 100', prog, { t, enter: t >= tGrow ? clamp((t - tGrow) / 0.35, 0, 1) : 0, s: 1.25 });
  return roofFrame(t, cam, { admin: 0.5 }, { skyArt: art, chars: K.view(cam, chars, 1), over });
}
// the giant hero on the giantScale set (ground 1000)
function giantHero(t, x, s, pose = {}, act = {}) {
  return E.hero(t, { x, y: CS.GIANT.ground, s, laptop: 'back', volume: false, ...pose }, { arms: false, ...act });
}
// L2 — you grow over the city (grin); the Admin, now tiny, types ;size me 1000 next to you
function shotL2(t) {
  const g = ease.outBack(seg(t, d17b, d17b + 0.5));
  const cam = shook(K.camKeys(t, [[d17b, at(960, 760, 1.4)], [d17b + 0.5, at(960, 520, 1.0)], [d18, at(1000, 510, 1.04)]]), t, [[d17b + 0.4, 0.35, 16]]);
  const { Ly } = nightSky(t, cam);
  const hs = lerp(0.18, 0.92, g);
  let mid = giantHero(t, 760, hs, { face: g > 0.8 ? { name: 'smug', eyes: { look: [0.8, 0.5] } } : { name: 'amazed', eyes: { look: [0, -0.5] } }, armL: 26, armR: 26 });
  const ax = 1420, ay = 760 + Math.sin(t * 2) * 10;
  mid += adm(t, { x: ax, y: ay, s: 0.24, glow: 0.8, armR: 110 + 10 * Math.sin(t * 25), armL: 20, turn: -0.3, face: { name: 'deadpan', eyes: { upper: 0.5, look: [-0.5, -0.5] } }, shadow: false }, { arms: false });
  const prog = K.typeProgress(t, n[11]);
  mid += sky(ax, ay - 520, 560, 170, t, { text: ';size me 1000', progress: prog, glow: 0.8, size: 60 });
  return Ly.bg + K.view(cam, mid, 1) + Ly.fg + Ly.light + flash(t, d17b, 0.2, '#FFFFFF', 0.6);
}
// the Admin's giant boot + robe hem (side view, toe to the left); origin = ground under the boot. ~940 x 560 boot at s 1
function giantBoot(x, y, s, t) {
  let o = '';
  // robe skirt above the boot, with scrolling code and a gold hem
  o += R(-760, -3400, 1560, 2930, 0, ol('#FBFAF4', 10)) + R(380, -3400, 420, 2930, 0, { fill: '#E9E6F2' });
  let code = '';
  for (let r = 0; r < 26; r++) for (let i = 0; i < 6; i++) { const xx = -700 + i * 250 + ((t * 120 + r * 90) % 250), w = 60 + hash(r * 7 + i) * 120; code += `M${f(Math.min(760, xx))} ${f(-3300 + r * 110)}h${f(Math.max(0, Math.min(w, 760 - xx)))}`; }
  o += P(code, ln(16, '#9FD8C0', 0.75));
  o += R(-780, -520, 1600, 80, 16, ol('#FFC93C', 9)) + P('M-760 -500H800', ln(6, '#FFF0B0'));
  // the boot
  o += P('M-600 -30Q-640 -250 -380 -290L-90 -310L-60 -470L380 -470L400 -30Z', ol('#FFFFFF', 11));
  o += P('M-600 -30Q-640 -250 -380 -290L-250 -300L-250 -30Z', ol('#FFC93C', 9)) + P('M-560 -230Q-480 -270 -380 -270', ln(10, '#FFF0B0'));
  o += R(-90, -480, 490, 70, 18, ol('#FFC93C', 9)) + R(-640, -40, 1060, 50, 22, ol('#D9D6E4', 9));
  o += P('M-40 -400H340M-30 -340H330M-20 -280H320', ln(10, '#E3E0EC'));
  return G(o, tr(x, y, s));
}
// N1 — BOOM: a giant boot lands next to you
function shotN1(t) {
  const fall = ease.in(seg(t, d18, tBoot));
  const cam = shook(at(960, 500, 1.0), t, [[tBoot, 0.6, 30]]);
  const { Ly } = nightSky(t, cam, 0, { shadow: 0.35 });
  let mid = giantHero(t, 420, 0.92, { lift: 40 * bump(t, tBoot, tBoot + 0.35), face: t > tBoot ? { name: 'shocked', eyes: { look: [0.8, -0.3], pupil: 0.45 }, fx: ['exclaim'] } : { name: 'smug', eyes: { look: [0.8, 0.5] } }, armL: t > tBoot ? 60 : 26, armR: t > tBoot ? 60 : 26 });
  mid = El(1440, CS.GIANT.ground, 700 * (0.4 + 0.6 * fall), 60 * (0.4 + 0.6 * fall), { fill: '#0A0618', opacity: f(0.5 * fall) }) + giantBoot(1460, CS.GIANT.ground - lerp(2400, 0, fall), 1.25, t) + mid;
  // dust ring
  const dk = seg(t, tBoot, tBoot + 0.6);
  if (dk > 0 && dk < 1) for (let i = 0; i < 7; i++) mid += Ci(1300 + (i - 3) * 200 * (0.6 + dk), 990 - 30 * dk - (i % 2) * 20, 70 + 60 * dk, { fill: '#E8E4F2', opacity: f(0.85 * (1 - dk)), stroke: '#151515', 'stroke-width': 5 });
  return Ly.bg + K.view(cam, mid, 1) + Ly.fg + Ly.light + (t > tBoot ? K.bang('BOOM', 1500, 260, seg(t, tBoot, tBoot + 0.15), 130, -6, '#FFE14D') : '');
}
// N2 — "He always had a bigger number." tilt up the boot... the robe... up to his face, high above the clouds
function shotN2(t) {
  const u = ease.inOut(seg(t, d18b, d18c - 0.35));
  const cam = at(lerp(1100, 1450, u), lerp(420, -7700, u), lerp(1.0, 0.19, u));
  const { Ly } = nightSky(t, cam, 0, { shadow: 0.3 });
  let mid = adm(t, { x: 1450, y: CS.GIANT.ground, s: 8, glow: 0.5, armL: 10, armR: 10, face: { name: 'deadpan', eyes: { look: [-0.5, 1], upper: 0.35 } }, shadow: false }, { arms: false, energy: 0 });
  // cloud band around his knees/waist
  let cl = '';
  let cd = '';
  for (let i = 0; i < 16; i++) { const cx = -1400 + i * 340 + Math.sin(t * 0.6 + i) * 40, r = 230 + (i % 3) * 90; cd += `M${f(cx - r)} -3150a${f(r)} ${f(r * 0.8)} 0 0 1 ${f(2 * r)} 0Z`; }
  cl += P(cd, { fill: '#E6E0FA', opacity: 0.55 }) + R(-1600, -3150, 6200, 160, 80, { fill: '#E6E0FA', opacity: 0.55 });
  mid += giantHero(t, 420, 0.92, { face: { name: 'scared', eyes: { look: [0.6, -1], pupil: 0.45 }, fx: ['sweat'] }, armL: 22, armR: 22 });
  const nums = G(outT('100', 0, 0, 160, '#FF6A3D', 16), tr(420, -60, 1.3)) + G(outT('1000', 0, 0, 160, '#FFD45A', 16), tr(3900, -7300, 5.5));
  return Ly.bg + K.view(cam, mid + cl + nums, 1) + (cam.zoom > 0.6 ? Ly.fg : '') + Ly.light;
}
// N3 — the beat: you look up as his shadow slowly swallows you
function shotN3(t) {
  const u = seg(t, d18c, d19);
  const cam = at(440, 330, lerp(1.9, 2.05, u));
  const sh = ease.inOut(u);
  const { Ly } = nightSky(t, cam, 0, { shadow: 0.4 + 0.6 * sh });
  const gulp = bump(t, d18c + 0.5, d18c + 0.8);
  let mid = giantHero(t, 420, 0.92, { headY: 6 * gulp, face: { name: 'scared', eyes: { look: [0.5, -1], pupil: 0.4 }, fx: ['sweat'], mouth: gulp > 0.3 ? 'o' : 'wavy' }, armL: 22, armR: 22 });
  mid += R(-500, -900, 3000, 3000, 0, { fill: '#0A0618', opacity: f(0.45 * sh) });
  return Ly.bg + K.view(cam, mid, 1) + Ly.fg + Ly.light;
}

// ---------------------------------------------------------------- Dad, Zoe, Pancake
// O1 — "Nobody messes with my kid!" — Dad flies in (with Zoe on his back), screeches to a hover
function shotO1(t) {
  const u = seg(t, d19, d20);
  const cam = at(960, 540, 1.0);
  const { Ly, clouds } = nightSky(t, at(960, -2600, 1.0), 900 * (1 - ease.out(u)));
  const arrive = ease.out(seg(t, d19, d19 + 0.8));
  const x = lerp(2600, 1150, arrive), y = 820 + Math.sin(t * 2.5) * 12;
  let o = Ly.bg + clouds;
  // speed lines while flying in
  if (arrive < 1) o += K.C.speedLines(x + 300, x + 1200, y - 200, 10, 7, '#FFFFFF', 400);
  o += K.view(cam, dadFly(t, x, y, 0.64, { headRot: -40 }), 1);
  const pk = seg(t, Wd(13, 'kid') - 0.1, Wd(13, 'kid') + 0.2);
  if (pk > 0) o += K.sparkles([[x - 420, y - 420, 34 * pk], [x - 300, y - 520, 22 * pk], [x + 80, y - 480, 26 * pk]], t);
  o += Ly.light;
  return o + whip(t, d19, -1, 0.15);
}
// O2 — "Can you hear me now?!" — in front of the Admin's giant face of light
function shotO2(t) {
  const u = seg(t, d20, d21);
  const cam = at(960, 540, lerp(1.0, 1.06, u));
  const { Ly } = nightSky(t, at(960, -2600, 1.0), 0, { admin: 0.6 });
  let o = Ly.bg;
  o += K.view(cam, adm(t, { x: 560, y: 3500, s: 3.0, glow: 0.6, armL: 8, armR: 8, face: { name: 'deadpan', eyes: { upper: 0.35, look: [0.7, 0.3] } }, shadow: false }, { arms: false, energy: 0 }), 1);
  const dx = 1460, dy = 820 + Math.sin(t * 2.4) * 10;
  o += E.soundRings(dx - 340, dy - 330, t, Wd(13, 'Can'), 200, '#7FE3FF', 4, 600, 14);
  o += K.view(cam, actor('dad', t, { x: dx, y: dy, s: 0.5, view: 'side', armL: 150, armR: 120, legL: 20, kneeL: 30, legR: -10, kneeR: 40, lift: 0, face: 'scream', shadow: false }, { arms: false, energy: 1.5 }) + actor('zoe', t, { x: dx + 120, y: dy - 280, s: 0.36, view: 'side', legL: 90, kneeL: 90, legR: 80, kneeR: 85, laptop: true, face: { name: 'deadpan', eyes: { look: [-0.3, 0.6] } }, shadow: false }, { arms: false }), 1);
  return o + Ly.light;
}
// P1 — "Yes! I can hear you!" — the face of light, annoyed; Dad blown back by the boom
function shotP1(t) {
  const u = seg(t, d21, d22);
  const cam = shook(at(960, 540, lerp(1.05, 1.12, u)), t, [[Wd(14, 'Yes'), 0.4, 18], [Wd(14, 'hear'), 0.3, 12]]);
  const { Ly } = nightSky(t, at(960, -2600, 1.0), 0, { admin: 0.7 });
  let o = Ly.bg;
  o += K.view(cam, adm(t, { x: 820, y: 3420, s: 3.0, glow: 0.8, armL: 8, armR: 8, face: { name: 'angry', eyes: { upper: 0.3 }, fx: ['anger'] }, shadow: false }, { arms: false, energy: 0.6 }), 1);
  const blow = ease.out(seg(t, Wd(14, 'Yes'), Wd(14, 'Yes') + 0.6));
  const dx = lerp(1240, 1420, blow), dy = 800 - 60 * blow;
  o += E.soundRings(1000, 640, t, Wd(14, 'Yes'), 0, '#FFE38A', 4, 760, 26);
  o += K.view(cam, actor('dad', t, { x: dx, y: dy, s: 0.42, view: 'side', rot: 25 * blow, armL: 150, armR: 170, legL: 30, kneeL: 40, legR: -20, kneeR: 50, face: { name: 'oof', eyes: { type: 'swirl' } }, shadow: false }, { arms: false }) + actor('zoe', t, { x: dx + 110, y: dy - 240, s: 0.3, view: 'side', rot: 25 * blow, legL: 90, kneeL: 90, legR: 80, kneeR: 85, laptop: true, face: 'shocked', shadow: false }, { arms: false }), 1);
  return o + Ly.light;
}
// P2 — "Everybody can hear you!" — the whole city covers its ears; giant Pancake pounces on the Admin's cape
function shotP2(t) {
  const cam = shook(at(960, 560, 1.0), t, [[Wd(14, 'Everybody'), 0.6, 16], [tPounce + 0.3, 0.3, 14]]);
  const { Ly } = nightSky(t, cam, 0, { admin: 0.5 });
  let mid = giantBoot(1500, CS.GIANT.ground, 1.2, t);
  mid += giantHero(t, 400, 0.92, { armL: 150, armR: 150, bodyY: 10, face: { name: 'oof', eyes: { type: 'closed' } } });
  // Pancake: pounce → cling to the hem
  const pk = seg(t, tPounce - 0.45, tPounce);
  const cling = t >= tPounce;
  const px = cling ? 1180 : lerp(-300, 1180, ease.out(pk)), py = cling ? 700 + Math.sin(t * 8) * 6 : lerp(1100, 700, Math.sin(pk * Math.PI / 2)) - 260 * Math.sin(pk * Math.PI);
  if (pk > 0) mid += CATS.pancake({ x: px, y: py, s: 2.2, t, pose: 'pounce', mood: cling ? 'angry' : 'happy', flip: true, rot: cling ? -30 : -10, shadow: false });
  if (cling) mid += K.bang('MROW!', 1100, 360, seg(t, tPounce, tPounce + 0.15), 80, -6, '#FFB13B');
  mid += E.soundRings(1700, -200, t, Wd(14, 'Everybody'), 120, '#FFE38A', 4, 1300, 22);
  return Ly.bg + K.view(cam, mid, 1) + Ly.fg + Ly.light;
}
// Q1 — "I'm in his logs! He's not a program..." — Zoe types on Dad's back
function shotQ1(t) {
  const cam = at(1000, 430, 1.42);
  const { Ly, clouds } = nightSky(t, at(960, -2600, 1.0), 600);
  let o = Ly.bg + clouds;
  o += K.view(cam, dadFly(t, 1060, 760, 0.6, { headRot: -40, trail: false, zoeFace: { name: 'determined', eyes: { look: [-0.7, 0.7] } } }), 1);
  o += K.C.speedLines(-200, 2000, 540, 8, 3, '#FFFFFF', 900);
  return o + Ly.light;
}
// Q2 — her screen: TYPE: PROGRAM ✗ → PERSON ✓ · typing from: somewhere REAL
function shotQ2(t) {
  let o = R(0, 0, 1920, 1080, 0, { fill: '#2A2246' });
  // laptop bezel with stickers
  o += R(140, 60, 1640, 960, 48, ol('#5A5F78', 12)) + R(190, 104, 1540, 860, 20, { fill: '#07100C' });
  o += G(Ci(0, 0, 40, ol('#FFD23F', 5)) + T('⚡', 0, 18, 50, '#2A2246'), tr(1700, 120, 1)) + G(R(-60, -30, 120, 60, 14, ol('#FF6FB5', 5)) + TF('</>', 0, 14, 34, '#FFFFFF'), tr(220, 1000, 1, -10));
  // left: log scroll
  let log = R(220, 140, 760, 800, 14, { fill: '#0B1A12', stroke: '#1E5A3C', 'stroke-width': 4 }) + TF('ADMIN.log — trace', 250, 190, 34, '#3DFF9A', { 'text-anchor': 'start' });
  const LINES = ['user: ADMIN', 'session: 0000001', ';fly all  → undo', ';tp me', ';size me 1000', 'input: KEYBOARD', 'keys/min: 38 (slow)', 'typo rate: high', 'uses two fingers', 'reading glasses: yes'];
  const off = Math.floor((t - d23) * 3);
  for (let i = 0; i < 12; i++) { const l = LINES[(i + off) % LINES.length]; log += TF('> ' + l, 250, 250 + i * 56, 32, /KEYBOARD|fingers|glasses/.test(l) ? '#FFD45A' : '#9DFFC8', { 'text-anchor': 'start' }); }
  o += log;
  // right: profile card
  let card = R(1020, 140, 680, 800, 14, { fill: '#0E1420', stroke: '#3A4560', 'stroke-width': 4 }) + TF('USER PROFILE', 1360, 196, 36, '#EAF2FF');
  card += Ci(1360, 330, 90, ol('#2A3346', 5)) + Ci(1360, 300, 34, { fill: '#8A93A6' }) + P('M1300 390Q1360 330 1420 390', { fill: '#8A93A6' });
  const pk = seg(t, tPerson - 0.1, tPerson + 0.2);
  card += TF('TYPE:', 1080, 500, 40, '#8A93A6', { 'text-anchor': 'start' }) + TF('PROGRAM', 1220, 500, 46, '#EAF2FF', { 'text-anchor': 'start' });
  if (pk > 0) card += P('M1210 486H1440', ln(10, '#FF3B4E')) + G(R(-170, -48, 340, 96, 18, { fill: 'none', stroke: '#3DFF9A', 'stroke-width': 8 }) + T('PERSON ✓', 0, 22, 66, '#3DFF9A'), tr(1430, 590, pop(pk), -6));
  const rk = seg(t, tReal - 0.5, tReal);
  card += TF('TYPING FROM:', 1080, 730, 36, '#8A93A6', { 'text-anchor': 'start' });
  if (t > Wd(15, 'typing')) {
    for (let i = 0; i < 3; i++) { const ph = (t * 1.2 + i / 3) % 1; card += Ci(1360, 840, 20 + ph * 90, { fill: 'none', stroke: '#FFD45A', 'stroke-width': 6, opacity: f(1 - ph) }); }
    card += Ci(1360, 840, 16, ol('#FFD45A', 4));
  }
  if (rk > 0) card += G(T('SOMEWHERE REAL', 0, 0, 58, '#FFD45A', E.OUT(8)), tr(1360, 790 - 0, pop(rk)));
  o += card;
  o += R(190, 104, 1540, 860, 20, { fill: 'url(#setsScan)', opacity: 0.4 });
  return K.view(at(960, 540, lerp(1.0, 1.05, seg(t, d24, d25))), o, 1) + flash(t, tPerson, 0.15, '#3DFF9A', 0.35);
}

// ---------------------------------------------------------------- the decision, the battery, the jump
// R1 — "Then I'm going there." — the giant you, determined; Dad and Zoe hover by your face
function shotR1(t) {
  const u = seg(t, d25, d26);
  const cam = at(620, 330, lerp(1.75, 1.85, u));
  const { Ly } = nightSky(t, cam, 0, { admin: 0.4 });
  const nod = bump(t, Wd(16, 'there') - 0.1, Wd(16, 'there') + 0.3);
  let mid = giantHero(t, 620, 1.0, { headRot: 4 * nod, headY: 10 * nod, face: { name: 'determined', eyes: { look: [0.3, -0.2] } }, gold: 0.4 });
  mid += dadFly(t, 980, 520, 0.12, { trail: false, headRot: -30 });
  return Ly.bg + K.view(cam, mid, 1) + Ly.fg + Ly.light;
}
// R2 — "Teleport me... to the Admin!" — typing (no ENTER yet)
function shotR2(t) {
  const u = seg(t, d26, d27);
  const cam = at(620, 380, lerp(1.55, 1.65, u));
  const { Ly } = nightSky(t, cam, 0, { admin: 0.4 });
  const typing = Math.sin(t * 30) * 8;
  const mid = giantHero(t, 620, 1.0, { armL: 26 + typing, armR: 26 - typing, face: { name: 'determined', eyes: { look: [0, 0.6] } } });
  const prog = K.typeProgress(t, n[16], 'Teleport', 'Admin');
  return Ly.bg + K.view(cam, mid, 1) + Ly.fg + Ly.light + K.chatCommand(960, 140, ';tp me to Admin', prog, { t, s: 1.3 });
}
// S — "Warning. Battery... three percent." — the laptop screen
function shotS(t) {
  const u = seg(t, d27, d28);
  const bat = t < tThree ? 7 : 3;
  const scr = SETS.adminScreen(t, { lines: [';god me', 'God mode: ON', ';tp me away', ';jail Admin', 'denied: user is ADMIN', 'Warning: battery low'], typed: ';tp me to Admin', battery: bat });
  const sh = K.shake(t, tThree, 0.4, 10);
  let o = R(0, 0, 1920, 1080, 0, { fill: '#1A1440' });
  o += G(SETS.laptop(0, 0, 2.15, scr, { glow: 1, t, dust: 0.3 }), `translate(${f(960 + sh.sx)} ${f(1170 + sh.sy)}) scale(${f(lerp(1.0, 1.08, u))})`);
  const wk = seg(t, Wd(17, 'Warning') - 0.05, Wd(17, 'Warning') + 0.2);
  o += K.popup(960 + sh.sx, 330 + sh.sy, 760, 220, 'WARNING', [`Battery: ${bat}%`, 'Plug in your charger!'], wk, { size: 44, accent: '#E8243C', icon: '!' });
  if (t > tThree) o += R(0, 0, 1920, 1080, 0, { fill: '#FF3B4E', opacity: f(0.12 * (Math.floor(t * 4) % 2)) });
  return o;
}
// T — "TELEPORT ME TO THE ADMIN!" — ENTER → beam → gone → white
function shotT(t) {
  const u = seg(t, d28, END);
  const go = seg(t, tGo, tGo + 0.3);
  const cam = shook(at(620, 380, lerp(1.6, 2.0, ease.in(seg(t, d28, tGo)))), t, [[tGo, 0.6, 24]]);
  const { Ly } = nightSky(t, cam, 0, { admin: 0.5 });
  let mid = '';
  if (go < 1) mid += giantHero(t, 620, 1.0, { ...E.tpSquash(go), armL: 40, armR: 40, face: { name: 'scream', eyes: { look: [0, -0.2] } }, gold: 0.5 });
  mid += E.tpBeam(620, CS.GIANT.ground, 1.0, seg(t, tGo - 0.05, tGo + 0.15), t);
  let o = Ly.bg + K.view(cam, mid, 1) + Ly.fg + Ly.light;
  o += K.chatCommand(960, 140, ';tp me to Admin', 1, { t, enter: t >= tGo ? clamp((t - tGo) / 0.35, 0, 1) : 0, s: 1.3, cursor: false });
  o += R(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: f(ease.in(seg(t, tGo + 0.15, END - 0.05))) });
  void u;
  return o;
}

// ---------------------------------------------------------------- router
const SHOTS = [[d1, shotA], [d2, shotB], [d3, shotC1], [d4, shotC2], [d5, shotD], [d6, shotE], [d8, shotF1], [d10, shotF2], [d12, shotF3],
  [d13, shotG], [d14, shotH], [d15, shotI], [d16, shotJ], [d17, shotK], [d17b, shotL1], [d18, shotL2], [d18b, shotN1], [d18c, shotN2], [d19, shotN3],
  [d20, shotO1], [d21, shotO2], [d22, shotP1], [d23, shotP2], [d24, shotQ1], [d25, shotQ2], [d26, shotR1], [d27, shotR2], [d28, shotS], [Infinity, shotT]];
function scene(t) {
  for (const [end, fn] of SHOTS) if (t < end) return fn(t);
  return shotT(t);
}
function look(t) {
  if (t >= d6 && t < d13) return { grade: 'warm', vignette: 0.7 };   // the sunny chase
  if (t >= d24 && t < d25) return { grade: null, vignette: 0.5 };
  if (t >= d27 && t < d28) return { grade: null, vignette: 0.8 };
  return { grade: 'cool', vignette: 0.85 };
}

module.exports = { scene, look, CUTS: { d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13, d14, d14b, d15, d16, d17, d17b, d18, d18b, d18c, d19, d20, d21, d22, d23, d24, d25, d26, d27, d28 } };
