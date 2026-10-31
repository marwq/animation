// Hero cut-out rig. drawHero(pose) -> SVG <g> string.
//
// Coordinate space: origin at the feet (ground contact, body centre), y up is negative.
// Character is ~950 units tall at scale 1. Pivots:
//   hips (+-48, -306)   shoulders (+-100, -515)   neck (0, -560)
//
// Pose fields (all optional):
//   x, y, s            position of the feet on screen, overall scale
//   lift               jump height (shadow stays on the ground)
//   view               'front' | 'side' | 'back'
//   turn               front view only: -1..1 (-1/1 = three-quarter left/right)
//   flip               mirror (used for side view facing right)
//   rot, rotY          whole-body rotation (deg) around (0, rotY)
//   sx, sy             squash & stretch around the feet
//   bodyY, lean        torso bob (+ = down) and lean (deg) around the hips
//   headRot, headY     head tilt (deg) and bob
//   armL, armR         outward arm angles in degrees (0 = hanging, 90 = T-pose, 180 = up,
//                      negative = across the body). Side view: + = forward.
//   legL, legR         outward leg angles (side view: + = forward)
//   face               expression name or {name, eyes, eyeL, eyeR, brows, mouth, fx, blink}
//   nametag            {name, health} or string
//   shade              cel-shading on/off (default on)
//   props              [{svg, layer: 'back'|'mid'|'front'|'top'}] drawn in body space
//                      (mid = between torso and arms, e.g. a hugged egg)
'use strict';

const S = require('./svg');
const C = require('./palette');
const F = require('./face');
const { f } = S;

const SW = C.lineW;
const outline = (fill, w = SW) => ({ fill, stroke: C.line, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const lineOnly = (w = SW, color = C.line) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });

const DEFAULTS = {
  x: 0, y: 0, s: 1, lift: 0, view: 'front', turn: 0, flip: false, rot: 0, rotY: -470,
  sx: 1, sy: 1, bodyY: 0, lean: 0, headRot: 0, headY: 0,
  armL: 9, armR: 9, legL: 0, legR: 0, face: 'neutral', nametag: null, shade: true,
  shadow: true, props: [],
};

// ---------------------------------------------------------------- limbs
// Arm authored as the screen-right arm hanging down from its pivot.
function armShape() {
  return S.roundedPath([[-30, -18], [30, -18], [40, 268], [-40, 268]], 17);
}
function drawArm(opts = {}) {
  const { shade = true, dim = false, view = 'front' } = opts;
  const id = S.uid('arm');
  const d = view === 'side' ? S.roundedPath([[-40, -20], [40, -20], [40, 248], [-40, 248]], 18) : armShape();
  const sleeveY = view === 'side' ? 100 : 112;
  let inner = S.rect(-60, -40, 120, sleeveY + 40, 0, { fill: C.jacket });
  if (shade) inner += S.rect(view === 'side' ? 22 : 20, -40, 40, 330, 0, { fill: '#000', opacity: 0.07 });
  inner += S.path(`M-60 ${sleeveY} L60 ${sleeveY}`, lineOnly(SW));
  if (dim) inner += S.rect(-60, -40, 120, 330, 0, { fill: '#000', opacity: 0.14 });
  return S.clipDef(id, S.path(d)) +
    S.path(d, { fill: C.skin }) +
    S.g(inner, null, { 'clip-path': `url(#${id})` }) +
    S.path(d, outline('none'));
}

// Leg authored as the screen-right leg hanging from the hip pivot (+48,-306).
function drawLeg(opts = {}) {
  const { shade = true, dim = false, toeShift = 0, back = false } = opts;
  const id = S.uid('leg');
  const ext = 24, slope = 61 / 266;
  const d = S.roundedPath([[-40, -ext], [42 - ext * slope, -ext], [103, 266, 4], [-40, 266, 4]], 0);
  let inner = '';
  if (shade) inner += S.rect(-80, -40, 220, 64, 0, { fill: C.pantsShade });
  if (dim) inner += S.rect(-80, -40, 220, 330, 0, { fill: '#000', opacity: 0.25 });
  let o = S.clipDef(id, S.path(d)) + S.path(d, { fill: C.pants }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
  // shoe
  o += S.path(S.roundedPath([[-44, 262], [107, 262], [107, 306], [-44, 306]], 14), outline(C.shoe));
  if (shade) o += S.path(`M-38 ${296} L101 296`, lineOnly(6, C.shoeShade));
  if (!back) {
    const cx = 30 + toeShift;
    o += S.path(`M${f(cx - 42)} 264 A42 37 0 0 1 ${f(cx + 42)} 264 Z`, outline(C.shoe));
  }
  return o;
}

// ---------------------------------------------------------------- torso
function drawTorsoFront(t, shade, back = false) {
  const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
  const T = -533, B = -306, W = 100;
  const id = S.uid('tor');
  const d = S.roundedPath([[-W, T], [W, T], [W, B], [-W, B]], 16);
  const cx = dir * at * 30;
  const k = 1 - 0.12 * at;
  let inner = '';
  if (!back) {
    // shirt + collar
    inner += S.rect(cx - 29 * k, -512, 58 * k, B - -512 + 10, 0, { fill: C.shirt });
    if (shade) inner += S.rect(cx - 29 * k, -512, 58 * k, 22, 0, { fill: C.shirtShade });
    inner += S.path(`M${f(cx - 28 * k)} ${T - 10} L${f(cx + 28 * k)} ${T - 10} L${f(cx + 28 * k)} -503 Q${f(cx)} -483 ${f(cx - 28 * k)} -503 Z`, { fill: C.skin });
    inner += S.path(`M${f(cx - 28 * k)} -503 Q${f(cx)} -483 ${f(cx + 28 * k)} -503`, lineOnly(5.5));
    inner += S.path(`M${f(cx - 30 * k)} ${T} L${f(cx - 30 * k)} ${B} M${f(cx + 30 * k)} ${T} L${f(cx + 30 * k)} ${B}`, lineOnly(SW));
    inner += S.path(`M${f(cx - 72 * k)} ${T + 8} L${f(cx - 70 * k)} ${B - 6} M${f(cx + 72 * k)} ${T + 8} L${f(cx + 70 * k)} ${B - 6}`, lineOnly(4.5, '#0d0f17'));
  } else {
    inner += S.path(`M0 ${T + 10} L0 ${B - 4}`, lineOnly(4.5, '#0d0f17'));
    inner += S.path(`M-60 ${T + 26} Q0 ${T + 44} 60 ${T + 26}`, lineOnly(4.5, '#0d0f17'));
  }
  if (shade) {
    inner += S.rect(-W - 10, B - 26, 2 * W + 20, 30, 0, { fill: '#000', opacity: 0.12 });
    if (at > 0.02) inner += S.rect(dir > 0 ? -W - 10 : W - 34 * at, T - 10, 34 * at + 10, B - T + 20, 0, { fill: '#000', opacity: 0.25 });
  }
  return S.clipDef(id, S.path(d)) + S.path(d, { fill: C.jacket }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
}

// ---------------------------------------------------------------- head (front / 3-4)
function hairMapFactory(t) {
  const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
  const hair = ([x, y]) => [x * dir > 0 ? x * (1 - 0.12 * at) + dir * 16 * at : x * (1 + 0.03 * at) + dir * 16 * at, y];
  const feat = ([x, y]) => [x * (1 - 0.15 * at) + dir * 40 * at, y];
  return { hair, feat, at, dir, fx: dir * 40 * at };
}

function frontHairPath(t, brows) {
  const { hair, feat } = hairMapFactory(t);
  const bL = brows.L || [0, 0], bR = brows.R || [0, 0];
  const P = (pt, m) => m(pt);
  const pts = [
    P([-141, -672], hair), P([-243, -709], hair), P([-201, -894], hair), 'ARC', P([199, -894], hair),
    P([242, -712], hair), P([142, -672], hair), P([142, -708], hair),
    P([126, -716], feat), P([104, -770], feat), P([92, -796], feat),
    P([84, -849 + bR[1]], feat), P([5, -792 + bR[0]], feat), P([-5, -792 + bL[0]], feat), P([-84, -849 + bL[1]], feat),
    P([-92, -796], feat), P([-104, -770], feat), P([-126, -716], feat), P([-142, -708], hair),
  ];
  const top = hair([0, -1006]);
  let d = '';
  pts.forEach((p, i) => {
    if (p === 'ARC') return;
    if (i === 0) d += `M${f(p[0])} ${f(p[1])}`;
    else if (pts[i - 1] === 'ARC') d += ` Q${f(top[0])} ${f(top[1])} ${f(p[0])} ${f(p[1])}`;
    else d += ` L${f(p[0])} ${f(p[1])}`;
  });
  return d + ' Z';
}

function backHairFront(t) {
  const { at, dir } = hairMapFactory(t);
  const sh = -dir * 12 * at;
  const half = [[-211, -735], [-211, -627], [-146, -613], [-157, -608], [-148, -566], [-110, -560]];
  const all = [...half, ...half.slice().reverse().map(([x, y]) => [-x, y])];
  return S.roundedPath(all.map(([x, y]) => [x + sh, y]), 6);
}

function drawHeadFront(face, t, shade) {
  const { hair, feat, at, dir, fx } = hairMapFactory(t);
  const fr = F.resolveFace(face);
  let o = '';
  // back hair
  o += S.path(backHairFront(t), outline(C.hair));
  if (shade) o += S.path(backHairFront(t), { fill: '#000', opacity: 0.12 });
  // head block
  const hx = dir * 4 * at;
  const headD = S.roundedPath([[-140 + hx, -890], [140 + hx, -890], [140 + hx, -559], [-140 + hx, -559]], 46);
  const hid = S.uid('head');
  o += S.clipDef(hid, S.path(headD));
  o += S.path(headD, { fill: C.skin });
  const hairD = frontHairPath(t, fr.brows);
  if (shade) {
    let sh = '';
    if (at > 0.02) sh += S.rect(dir > 0 ? -150 : 140 - 72 * at + hx, -900, 72 * at + 10, 360, 0, { fill: C.skinShade });
    sh += S.path(hairD, { fill: C.skinShade, transform: 'translate(0 15)' });
    sh += S.rect(-160, -590, 320, 40, 0, { fill: C.skinShade, opacity: 0.55 });
    o += S.g(sh, null, { 'clip-path': `url(#${hid})` });
  }
  o += S.path(headD, outline('none'));
  // front hair
  const hairId = S.uid('hair');
  o += S.clipDef(hairId, S.path(hairD));
  o += S.path(hairD, { fill: C.hair });
  let hairInner = '';
  if (shade) {
    const a = hair([-150, -900]), b = hair([0, -958]), c = hair([150, -900]);
    hairInner += S.path(`M${f(a[0])} ${f(a[1])} Q${f(b[0])} ${f(b[1] - 44)} ${f(c[0])} ${f(c[1])}`, lineOnly(14, C.hairHi));
    const l1 = hair([-243, -709]), l2 = hair([-141, -672]);
    hairInner += S.path(`M${f(l1[0])} ${f(l1[1] - 30)} L${f(l2[0])} ${f(l2[1] - 30)} L${f(l2[0])} ${f(l2[1] + 40)} L${f(l1[0])} ${f(l1[1] + 40)} Z`, { fill: C.hairShade });
    const r1 = hair([242, -712]), r2 = hair([142, -672]);
    hairInner += S.path(`M${f(r1[0])} ${f(r1[1] - 30)} L${f(r2[0])} ${f(r2[1] - 30)} L${f(r2[0])} ${f(r2[1] + 40)} L${f(r1[0])} ${f(r1[1] + 40)} Z`, { fill: C.hairShade });
  }
  // strand lines (inside hair)
  const sl = [hair([-148, -872]), hair([-196, -790]), hair([-193, -732]), feat([-131, -714])];
  const sr = [hair([148, -872]), hair([196, -790]), hair([193, -732]), feat([131, -714])];
  hairInner += S.path(`M${f(sl[0][0])} ${f(sl[0][1])} Q${f(sl[1][0])} ${f(sl[1][1])} ${f(sl[2][0])} ${f(sl[2][1])} L${f(sl[3][0])} ${f(sl[3][1])}`, lineOnly(SW));
  hairInner += S.path(`M${f(sr[0][0])} ${f(sr[0][1])} Q${f(sr[1][0])} ${f(sr[1][1])} ${f(sr[2][0])} ${f(sr[2][1])} L${f(sr[3][0])} ${f(sr[3][1])}`, lineOnly(SW));
  o += S.g(hairInner, null, { 'clip-path': `url(#${hairId})` });
  o += S.path(hairD, outline('none'));

  // eyes
  const blink = fr.blink || 0;
  const withBlink = (e) => (blink > 0 && (!e.type || e.type === 'open') ? { ...e, upper: (e.upper || 0) + (1 - (e.upper || 0)) * blink } : e);
  const lookBias = t * 0.45;
  const eL = feat([-64, -719]), eR = feat([64, -719]);
  const kNear = 1 - 0.04 * at, kFar = 1 - 0.3 * at;
  const rxL = 64 * (dir > 0 ? kNear : kFar), rxR = 64 * (dir > 0 ? kFar : kNear);
  o += F.eye(eL[0], eL[1], rxL, 80, withBlink(fr.eyeL), -1, { lookBias });
  o += F.eye(eR[0], eR[1], rxR, 80, withBlink(fr.eyeR), 1, { lookBias });
  // mouth
  const m = feat([0, -595]);
  o += F.mouth(fr.mouth, m[0], m[1], 1 - 0.15 * at, 1);
  o += F.faceFx(fr.fx, { fx });
  return o;
}

// ---------------------------------------------------------------- head (back)
function drawHeadBack(shade) {
  const headD = S.roundedPath([[-140, -890], [140, -890], [140, -559], [-140, -559]], 46);
  let o = S.path(headD, outline(C.skin));
  const pts = [[-243, -709], [-201, -894], 'ARC', [199, -894], [242, -712], [211, -700], [211, -627], [150, -612], [146, -578], [60, -584], [0, -572], [-60, -584], [-146, -578], [-150, -612], [-211, -627], [-211, -700]];
  let d = '';
  pts.forEach((p, i) => {
    if (p === 'ARC') return;
    if (i === 0) d += `M${p[0]} ${p[1]}`;
    else if (pts[i - 1] === 'ARC') d += ` Q0 -1006 ${p[0]} ${p[1]}`;
    else d += ` L${p[0]} ${p[1]}`;
  });
  d += ' Z';
  const id = S.uid('bh');
  o += S.clipDef(id, S.path(d)) + S.path(d, { fill: C.hair });
  let inner = '';
  if (shade) {
    inner += S.path('M-150 -900 Q0 -1000 150 -900', lineOnly(14, C.hairHi));
    inner += S.rect(-260, -606, 520, 50, 0, { fill: C.hairShade, opacity: 0.6 });
  }
  inner += S.path('M-150 -880 Q-190 -790 -192 -716 M150 -880 Q190 -790 192 -716 M-60 -930 Q-70 -760 -60 -640 M60 -930 Q70 -760 60 -640', lineOnly(SW));
  inner += S.path('M-211 -700 L-150 -688 L-150 -612 M211 -700 L150 -688 L150 -612', lineOnly(SW));
  o += S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
  return o;
}

// ---------------------------------------------------------------- head (side, facing left)
function drawHeadSide(face, shade) {
  const fr = F.resolveFace(face);
  const bL = fr.brows.L || [0, 0], bR = fr.brows.R || [0, 0];
  const browDy = ((bL[0] + bL[1] + bR[0] + bR[1]) / 4) * 1.1;
  const browIn = (bL[0] + bR[0]) / 2;
  let o = '';
  const headD = S.roundedPath([[-165, -885], [150, -885], [150, -553], [-165, -553, 54]], 44);
  const hid = S.uid('hs');
  o += S.clipDef(hid, S.path(headD)) + S.path(headD, { fill: C.skin });
  const hairPts = [[-190, -810], [-145, -795], [-95, -842 + browDy + browIn * 0.4], [-55, -715], [-15, -722], [-15, -625], [40, -625], [40, -575], [180, -585], [180, -675], [235, -685], [175, -900], 'ARC', [-160, -920]];
  let d = '';
  hairPts.forEach((p, i) => {
    if (p === 'ARC') return;
    if (i === 0) d += `M${p[0]} ${f(p[1])}`;
    else if (hairPts[i - 1] === 'ARC') d += ` Q10 -990 ${p[0]} ${p[1]}`;
    else d += ` L${p[0]} ${f(p[1])}`;
  });
  d += ' Z';
  if (shade) {
    o += S.g(S.path(d, { fill: C.skinShade, transform: 'translate(10 14)' }) + S.rect(-180, -590, 360, 40, 0, { fill: C.skinShade, opacity: 0.55 }), null, { 'clip-path': `url(#${hid})` });
  }
  o += S.path(headD, outline('none'));
  const id = S.uid('hsh');
  o += S.clipDef(id, S.path(d)) + S.path(d, { fill: C.hair });
  let inner = '';
  if (shade) {
    inner += S.path('M-140 -905 Q10 -975 160 -890', lineOnly(14, C.hairHi));
    inner += S.rect(-20, -604, 300, 40, 0, { fill: C.hairShade, opacity: 0.6 });
  }
  inner += S.path('M10 -875 L50 -745 M110 -705 L115 -640 M-15 -722 L40 -735', lineOnly(SW));
  o += S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
  // eye + mouth
  const blink = fr.blink || 0;
  const e = fr.eyeL;
  const ee = blink > 0 && (!e.type || e.type === 'open') ? { ...e, upper: (e.upper || 0) + (1 - (e.upper || 0)) * blink } : e;
  o += F.eye(-118, -716, 56, 80, { ...ee, cross: 0 }, 1, { sidePupil: -0.66 });
  o += F.mouth(fr.mouth, -132, -598, 0.55, 1);
  o += F.faceFx(fr.fx.filter((x) => (typeof x === 'string' ? x : x.type) !== 'blush'), { fx: 0 });
  return o;
}

// ---------------------------------------------------------------- side parts
function drawLegSide({ shade = true, dim = false } = {}) {
  const id = S.uid('sl');
  const d = S.roundedPath([[-58, -24], [64, -24], [85, 260, 4], [-80, 260, 4]], 0);
  let o = S.clipDef(id, S.path(d)) + S.path(d, { fill: C.pants });
  let inner = shade ? S.rect(-100, -40, 220, 64, 0, { fill: C.pantsShade }) : '';
  if (dim) inner += S.rect(-100, -40, 220, 320, 0, { fill: '#000', opacity: 0.28 });
  o += S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
  const shoeFill = dim ? '#D3D5DE' : C.shoe;
  o += S.path(S.roundedPath([[-138, 256], [88, 256], [88, 302], [-138, 302]], 16), outline(shoeFill));
  o += S.path('M-130 256 A44 38 0 0 1 -42 256 Z', outline(shoeFill));
  return o;
}

function drawTorsoSide(shade) {
  let o = S.path(S.roundedPath([[-88, -512], [-56, -512], [-56, -312], [-88, -312]], 8), outline(C.shirt));
  const tid = S.uid('st');
  const td = S.roundedPath([[-62, -535], [70, -535], [70, -305], [-62, -305]], 16);
  o += S.clipDef(tid, S.path(td)) + S.path(td, { fill: C.jacket });
  if (shade) o += S.g(S.rect(-80, -330, 160, 30, 0, { fill: '#000', opacity: 0.12 }), null, { 'clip-path': `url(#${tid})` });
  return o + S.path(td, outline('none'));
}

// ---------------------------------------------------------------- design
const { drawCharacter, nametag } = require('./body');

const YOU_DESIGN = {
  leg: drawLeg,
  legSide: drawLegSide,
  arm: drawArm,
  torso: drawTorsoFront,
  torsoSide: drawTorsoSide,
  head: drawHeadFront,
  headSide: drawHeadSide,
  headBack: (face, shade) => drawHeadBack(shade),
};

const drawHero = (pose = {}) => drawCharacter(YOU_DESIGN, pose);

module.exports = { drawHero, drawHeadFront, drawHeadSide, drawHeadBack, drawArm, drawLeg, drawTorsoFront, nametag, DEFAULTS, YOU_DESIGN };
