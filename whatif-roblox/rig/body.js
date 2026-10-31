// Generic R6 cut-out character assembler. A "design" supplies the drawing of
// each part; this module owns the hierarchy, pivots, views, turn, squash and
// stretch, props, shadow and nametag.
//
// Coordinate space: origin at the feet (ground contact, body centre), y up is negative.
// Pose fields: see rig/hero.js header (shared by every character).
//
// design = {
//   leg({shade, dim, toeShift, back})      front-view leg, authored as the screen-right leg at the hip pivot
//   legSide({shade, dim})                  side-view leg at the hip pivot (facing screen-left)
//   arm({shade, dim, view})                arm hanging down from the shoulder pivot (screen-right / side)
//   torso(turn, shade, back)               front/back torso
//   torsoSide(shade)                       side torso (facing screen-left)
//   head(face, turn, shade)                front / three-quarter head (pivot at neck 0,-560)
//   headSide(face, shade)                  profile head
//   headBack(face, shade)                  back of the head
//   under?(face, turn, shade, view)        drawn with the head transform BEFORE the torso (e.g. a ponytail)
//   over?(face, turn, shade, view)         drawn with the head transform AFTER the head (e.g. ponytail in back view)
//   dims: { hipX, shoulderX, shoulderY, sideShoulder:[x,y], nametagY, shadowR }
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

const BASE_DIMS = { hipX: 48, shoulderX: 100, shoulderY: -515, sideShoulder: [4, -505], nametagY: -1035, shadowR: 175 };

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
  const legK = Math.max(0.4, (306 - p.bodyY) / 306);
  const headTf = `translate(0 ${f(p.headY)}) rotate(${f(p.headRot)} 0 -560)`;
  const hook = (name, ...a) => (design[name] ? S.g(design[name](...a), headTf) : '');
  let body = '';

  if (p.view === 'side') {
    const [sx, sy] = D.sideShoulder;
    const leg = (a, dim) => S.g(design.legSide({ shade, dim }), `translate(4 ${f(hipY)}) rotate(${f(a)}) scale(1 ${f(legK)})`);
    body += leg(p.legR, true);
    let torso = '';
    torso += S.g(design.arm({ shade, dim: true, view: 'side' }), `translate(${sx} ${sy}) rotate(${f(p.armR)})`);
    torso += design.torsoSide(shade);
    torso += layer('back') + layer('mid');
    torso += hook('under', p.face, 0, shade, 'side');
    torso += S.g(design.headSide(p.face, shade), headTf);
    torso += hook('over', p.face, 0, shade, 'side');
    torso += S.g(design.arm({ shade, view: 'side' }), `translate(${sx} ${sy}) rotate(${f(p.armL)})`);
    torso += layer('front');
    body += leg(p.legL, false);
    body += S.g(torso, `translate(0 ${f(p.bodyY)}) rotate(${f(p.lean)} 0 -306)`);
  } else {
    const back = p.view === 'back';
    const t = back ? 0 : S.clamp(p.turn, -1, 1);
    const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
    const farSide = at > 0.35 ? dir : 0; // +1: screen-right limb is behind
    const toe = dir * 18 * at;
    const legSvg = (side) => {
      const ang = side < 0 ? p.legL : p.legR;
      const far = farSide === side && p.dimFar;
      const hx = side * D.hipX + (far ? -side * 22 * at : 8 * at * dir);
      return S.g(design.leg({ shade, dim: far, toeShift: toe * side, back }),
        `translate(${f(hx)} ${f(hipY)}) scale(${side} 1) rotate(${f(-ang)}) scale(1 ${f(legK)})`);
    };
    const armSvg = (side) => {
      const ang = side < 0 ? p.armL : p.armR;
      const far = farSide === side;
      const ax = side * D.shoulderX + (far ? -side * 30 * at : 8 * at * dir);
      const dimArm = far && p.dimFar;
      return S.g(design.arm({ shade, dim: dimArm, view: 'front' }), `translate(${f(ax)} ${D.shoulderY}) scale(${side} 1) rotate(${f(-ang)})`);
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

module.exports = { drawCharacter, nametag, BASE_DEFAULTS };
