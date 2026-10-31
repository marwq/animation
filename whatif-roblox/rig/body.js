// Generic R6 cut-out character assembler. A "design" supplies the drawing of
// each part; this module owns the hierarchy, pivots, knees (IK/FK), views,
// turn, squash and stretch, props, shadow and nametag.
//
// Coordinate space: origin at the feet (ground contact, body centre), y up is negative.
//
// Pose fields (shared by every character):
//   x, y, s            position of the feet on screen, overall scale
//   lift               jump height (shadow stays on the ground)
//   view               'front' | 'side' | 'back'
//   turn               front view only: -1..1 (-1/1 = three-quarter left/right)
//   flip               mirror (side view facing right)
//   rot, rotY          whole-body rotation (deg) around (0, rotY)
//   sx, sy             squash & stretch around the feet
//   bodyY, lean        torso bob (+ = down) and lean (deg) around the hips
//   headRot, headY     head tilt (deg) and bob
//   armL, armR         outward arm angles (0 hanging, 90 T-pose, 180 up, <0 across body). Side: + = forward
//   legL, legR         hip angles: outward (front) / forward (side)
//   kneeL, kneeR       knee bend in degrees (FK). If omitted the feet stay planted and the
//                      knees bend automatically (IK) when the body goes down (bodyY > 0):
//                      front view knees go outward, side view knees go forward.
//   face, nametag, shade, props [{svg, layer: back|mid|front|top}], dimFar
//
// design = {
//   leg({shade, dim, toeShift, back, J})   front leg in hip-local space (screen-right authored)
//   legSide({shade, dim, J})               side leg in hip-local space (facing screen-left)
//      J = { hip:[0,0], knee:[x,y], ankle:[x,y], foot: deg }
//   arm({shade, dim, view}), torso(turn, shade, back), torsoSide(shade)
//   head(face, turn, shade), headSide(face, shade), headBack(face, shade)
//   under?/over?(face, turn, shade, view)  extra layers with the head transform
//   dims: { hipX, shoulderX, shoulderY, sideShoulder:[x,y], nametagY, shadowR, thigh, shin, sideThigh, sideShin }
//   defaults: pose defaults for this character
// }
'use strict';

const S = require('./svg');
const C = require('./palette');
const { f } = S;

const BASE_DEFAULTS = {
  x: 0, y: 0, s: 1, lift: 0, view: 'front', turn: 0, flip: false, rot: 0, rotY: -470,
  sx: 1, sy: 1, bodyY: 0, lean: 0, headRot: 0, headY: 0,
  armL: 9, armR: 9, legL: 0, legR: 0, face: 'neutral', nametag: null, shade: true,
  shadow: true, props: [], dimFar: true,
};

const BASE_DIMS = {
  hipX: 48, shoulderX: 100, shoulderY: -515, sideShoulder: [4, -505], nametagY: -1035, shadowR: 175,
  thigh: 140, shin: 126, sideThigh: 136, sideShin: 124,
};

const rad = (d) => (d * Math.PI) / 180;
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const len = (a) => Math.hypot(a[0], a[1]);
const rotV = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];

// Two-bone leg in hip-local space (y down). side=false: front view, + angle = outward (+x),
// knee bends outward. side=true: + angle = forward (-x), knee bends forward.
function legJoints({ angle = 0, knee, bodyY = 0, L1, L2, sideView = false }) {
  const dir = (a) => (sideView ? [-Math.sin(rad(a)), Math.cos(rad(a))] : [Math.sin(rad(a)), Math.cos(rad(a))]);
  const footFrom = (a) => (sideView ? a : -a); // SVG rotation that follows a limb at angle a
  if (knee !== undefined && knee !== null) {
    const k1 = mul(dir(angle), L1);
    const a2 = angle - knee;
    const ank = add(k1, mul(dir(a2), L2));
    return { hip: [0, 0], knee: k1, ankle: ank, foot: footFrom(a2) * (sideView ? 0.9 : 0.5), bend: knee };
  }
  const L = L1 + L2;
  // planted foot: ankle sits on the ground (hip-relative y = L - bodyY) at the spread given by the angle
  let T = [dir(angle)[0] * L, L - bodyY];
  let d = len(T);
  const maxReach = L * 1.06; // allow a little stretch so spread feet still touch the ground
  if (d > maxReach) { T = mul(T, maxReach / d); d = maxReach; }
  if (d >= L - 0.01) {
    const st = d / L;
    return { hip: [0, 0], knee: mul(T, L1 / L), ankle: T, foot: 0, bend: 0, stretch: st };
  }
  const u = mul(T, 1 / d);
  const ca = S.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1);
  const al = Math.acos(ca);
  const c1 = mul(rotV(u, al), L1), c2 = mul(rotV(u, -al), L1);
  const pick = sideView ? (c1[0] < c2[0] ? c1 : c2) : (c1[0] > c2[0] ? c1 : c2);
  const v1 = mul(pick, 1 / L1), v2 = mul(add(T, mul(pick, -1)), 1 / L2);
  const bend = (Math.acos(S.clamp(v1[0] * v2[0] + v1[1] * v2[1], -1, 1)) * 180) / Math.PI;
  return { hip: [0, 0], knee: pick, ankle: T, foot: 0, bend };
}

function nametag(tag, y = -1030) {
  if (!tag) return '';
  const t = typeof tag === 'string' ? { name: tag } : tag;
  let o = S.el('text', {
    x: 0, y, 'font-family': 'Fredoka, sans-serif', 'font-weight': 600, 'font-size': 52, fill: '#fff',
    stroke: '#1b1b1b', 'stroke-width': 9, 'paint-order': 'stroke', 'stroke-linejoin': 'round', 'text-anchor': 'middle',
  }, t.name);
  if (t.health !== undefined && t.health !== null) {
    const w = 190, h = 14, yy = y + 18;
    o += S.rect(-w / 2, yy, w, h, 7, { fill: '#2b2b2b', stroke: '#111', 'stroke-width': 4 });
    o += S.rect(-w / 2 + 2, yy + 2, Math.max(0, (w - 4) * t.health), h - 4, 5, { fill: t.health > 0.35 ? '#35D34A' : '#E8243C' });
  }
  return o;
}

function drawCharacter(design, pose = {}) {
  const D = { ...BASE_DIMS, ...(design.dims || {}) };
  const p = { ...BASE_DEFAULTS, ...(design.defaults || {}), ...pose };
  const shade = p.shade;
  const props = p.props || [];
  const layer = (name) => props.filter((q) => (q.layer || 'front') === name).map((q) => q.svg).join('');
  const hipY = -306 + p.bodyY;
  const headTf = `translate(0 ${f(p.headY)}) rotate(${f(p.headRot)} 0 -560)`;
  const hook = (name, ...a) => (design[name] ? S.g(design[name](...a), headTf) : '');
  let body = '';

  if (p.view === 'side') {
    const [sx, sy] = D.sideShoulder;
    const leg = (a, k, dim) => {
      const J = legJoints({ angle: a, knee: k, bodyY: p.bodyY, L1: D.sideThigh, L2: D.sideShin, sideView: true });
      return S.g(design.legSide({ shade, dim, J }), `translate(4 ${f(hipY)})`);
    };
    body += leg(p.legR, p.kneeR, true);
    let torso = '';
    torso += S.g(design.arm({ shade, dim: true, view: 'side' }), `translate(${sx} ${sy}) rotate(${f(p.armR)})`);
    torso += design.torsoSide(shade);
    torso += layer('back') + layer('mid');
    torso += hook('under', p.face, 0, shade, 'side');
    torso += S.g(design.headSide(p.face, shade), headTf);
    torso += hook('over', p.face, 0, shade, 'side');
    torso += S.g(design.arm({ shade, view: 'side' }), `translate(${sx} ${sy}) rotate(${f(p.armL)})`);
    torso += layer('front');
    body += leg(p.legL, p.kneeL, false);
    body += S.g(torso, `translate(0 ${f(p.bodyY)}) rotate(${f(p.lean)} 0 -306)`);
  } else {
    const back = p.view === 'back';
    const t = back ? 0 : S.clamp(p.turn, -1, 1);
    const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
    const farSide = at > 0.35 ? dir : 0; // +1: screen-right limb is behind
    const toe = dir * 18 * at;
    const legSvg = (side) => {
      const ang = side < 0 ? p.legL : p.legR;
      const kn = side < 0 ? p.kneeL : p.kneeR;
      const far = farSide === side;
      const hx = side * D.hipX + (far ? -side * 22 * at : 8 * at * dir);
      const J = legJoints({ angle: ang, knee: kn, bodyY: p.bodyY, L1: D.thigh, L2: D.shin });
      return S.g(design.leg({ shade, dim: far && p.dimFar, toeShift: toe * side, back, J }), `translate(${f(hx)} ${f(hipY)}) scale(${side} 1)`);
    };
    const armSvg = (side) => {
      const ang = side < 0 ? p.armL : p.armR;
      const far = farSide === side;
      const ax = side * D.shoulderX + (far ? -side * 30 * at : 8 * at * dir);
      return S.g(design.arm({ shade, dim: far && p.dimFar, view: 'front' }), `translate(${f(ax)} ${D.shoulderY}) scale(${side} 1) rotate(${f(-ang)})`);
    };
    const legOrder = farSide ? [farSide, -farSide] : [-1, 1];
    for (const sd of legOrder) body += legSvg(sd);

    let torso = '';
    const sides = [-1, 1];
    if (!back) torso += hook('under', p.face, t, shade, 'front');
    for (const sd of sides) if (farSide === sd) torso += armSvg(sd);
    torso += layer('back');
    torso += design.torso(t, shade, back);
    torso += layer('mid');
    const head = back ? design.headBack(p.face, shade) : design.head(p.face, t, shade);
    const headG = S.g(head, headTf) + hook('over', p.face, t, shade, back ? 'back' : 'front');
    let armsBefore = '', armsAfter = '';
    for (const sd of sides) {
      if (farSide === sd) continue;
      const a = sd < 0 ? p.armL : p.armR;
      if (a > 115) armsAfter += armSvg(sd); else armsBefore += armSvg(sd);
    }
    if (back) torso += headG + armsBefore + armsAfter;
    else torso += armsBefore + headG + armsAfter;
    torso += layer('front');
    body += S.g(torso, `translate(0 ${f(p.bodyY)}) rotate(${f(p.lean)} 0 -306)`);
  }

  const fs = p.flip ? -1 : 1;
  let out = '';
  if (p.shadow) {
    const k = Math.max(0.35, 1 - p.lift / 900);
    out += S.ellipse(p.x, p.y, D.shadowR * p.s * k * Math.max(p.sx, 0.6), 24 * p.s * k, { fill: C.shadow });
  }
  const tf = `translate(${f(p.x)} ${f(p.y - p.lift)}) scale(${f(fs * p.s)} ${f(p.s)}) rotate(${f(p.rot)} 0 ${f(p.rotY)}) scale(${f(p.sx)} ${f(p.sy)})`;
  out += S.g(body + layer('top'), tf);
  if (p.nametag) {
    const ny = (D.nametagY + p.bodyY + p.headY) * p.sy;
    out += S.g(nametag(p.nametag, ny), `translate(${f(p.x)} ${f(p.y - p.lift)}) scale(${f(p.s)})`);
  }
  return out;
}

// ---------------------------------------------------------------- bent limb outline
// Closed outline around hip -> knee -> ankle. wOut/wIn: half-widths [hip, knee, ankle] on the
// +normal side (+x when the limb hangs straight down) and the -normal side. ext: extension above the hip.
function lineX(p1, p2, p3, p4) {
  const d = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]);
  if (Math.abs(d) < 1e-6) return null;
  const tt = ((p1[0] - p3[0]) * (p3[1] - p4[1]) - (p1[1] - p3[1]) * (p3[0] - p4[0])) / d;
  return [p1[0] + tt * (p2[0] - p1[0]), p1[1] + tt * (p2[1] - p1[1])];
}

function bentLimb(J, wOut, wIn, ext = 24) {
  const P0 = J.hip, P1 = J.knee, P2 = J.ankle;
  const u1 = mul(add(P1, mul(P0, -1)), 1 / (len(add(P1, mul(P0, -1))) || 1));
  const u2 = mul(add(P2, mul(P1, -1)), 1 / (len(add(P2, mul(P1, -1))) || 1));
  const n1 = [u1[1], -u1[0]], n2 = [u2[1], -u2[0]];
  const P0e = add(P0, mul(u1, -ext));
  const turn = u2[0] * n1[0] + u2[1] * n1[1]; // > 0: bending toward +normal (that side is concave)
  const pts = (sgn, w) => ({
    a0: add(P0e, mul(n1, sgn * w[0])), a1: add(P1, mul(n1, sgn * w[1])),
    b1: add(P1, mul(n2, sgn * w[1])), a2: add(P2, mul(n2, sgn * w[2])),
  });
  const O = pts(1, wOut), I = pts(-1, wIn);
  const join = (side, concave, w) => {
    if (Math.abs(turn) < 0.01) return ` L${f(side.a1[0])} ${f(side.a1[1])}`;
    if (concave) {
      const x = lineX(side.a0, side.a1, side.b1, side.a2) || side.a1;
      return ` L${f(x[0])} ${f(x[1])}`;
    }
    const c = (side.a1[0] - P1[0]) * (side.b1[1] - P1[1]) - (side.a1[1] - P1[1]) * (side.b1[0] - P1[0]);
    return ` L${f(side.a1[0])} ${f(side.a1[1])} A${f(w)} ${f(w)} 0 0 ${c > 0 ? 1 : 0} ${f(side.b1[0])} ${f(side.b1[1])}`;
  };
  const joinRev = (side, concave, w) => {
    if (Math.abs(turn) < 0.01) return ` L${f(side.a1[0])} ${f(side.a1[1])}`;
    if (concave) {
      const x = lineX(side.a0, side.a1, side.b1, side.a2) || side.a1;
      return ` L${f(x[0])} ${f(x[1])}`;
    }
    const c = (side.b1[0] - P1[0]) * (side.a1[1] - P1[1]) - (side.b1[1] - P1[1]) * (side.a1[0] - P1[0]);
    return ` L${f(side.b1[0])} ${f(side.b1[1])} A${f(w)} ${f(w)} 0 0 ${c > 0 ? 1 : 0} ${f(side.a1[0])} ${f(side.a1[1])}`;
  };
  let d = `M${f(O.a0[0])} ${f(O.a0[1])}` + join(O, turn > 0, wOut[1]) + ` L${f(O.a2[0])} ${f(O.a2[1])}`;
  d += ` L${f(I.a2[0])} ${f(I.a2[1])}` + joinRev(I, turn < 0, wIn[1]) + ` L${f(I.a0[0])} ${f(I.a0[1])} Z`;
  // crease on the concave side
  let crease = '';
  if (Math.abs(turn) > 0.25) {
    const side = turn > 0 ? O : I;
    const x = lineX(side.a0, side.a1, side.b1, side.a2);
    if (x) {
      const toward = mul(add(P1, mul(x, -1)), 1 / (len(add(P1, mul(x, -1))) || 1));
      const e = add(x, mul(toward, 26));
      crease = `M${f(x[0])} ${f(x[1])} L${f(e[0])} ${f(e[1])}`;
    }
  }
  return { d, crease, u1, n1, u2, n2 };
}

module.exports = { drawCharacter, nametag, legJoints, bentLimb, BASE_DEFAULTS, BASE_DIMS };
