// The "R6 kid" character family: YOU's construction (big block head, huge round eyes,
// chunky bob hair whose V-notch acts as brows, open jacket over a T-shirt, wide pants,
// sneakers) parameterised by a style, so new characters only change colours and details.
'use strict';

const S = require('./svg');
const C = require('./palette');
const F = require('./face');
const { drawCharacter, bentLimb } = require('./body');
const { f } = S;

const SW = C.lineW;
const outline = (fill, w = SW) => ({ fill, stroke: C.line, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const lineOnly = (w = SW, color = C.line) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const P = (p) => `${f(p[0])} ${f(p[1])}`;

const BASE_STYLE = {
  col: {
    hair: C.hair, hairShade: C.hairShade, hairHi: C.hairHi, skin: C.skin, skinShade: C.skinShade,
    jacket: C.jacket, jacketLine: '#0d0f17', shirt: C.shirt, shirtShade: C.shirtShade, collar: C.skin,
    pants: C.pants, pantsShade: C.pantsShade, sole: C.shoe, soleShade: C.shoeShade, toe: C.shoe, soleBand: null,
  },
  notch: 57,        // depth of the fringe V-notch (= brows)
  eye: {},          // eye defaults under every expression (pupil, cross, sparkle...)
  lashes: false,
  longHair: false,
  glasses: false,   // false | 'half'
  blush: false,
  clip: false,      // hair clip colour or false
  neutralMouth: null,
};

function makeStyle(over = {}) {
  return { ...BASE_STYLE, ...over, col: { ...BASE_STYLE.col, ...(over.col || {}) } };
}

// ---------------------------------------------------------------- face resolve
function resolve(style, face) {
  const fr = F.resolveFace(face);
  const name = typeof face === 'string' ? face : face && face.name;
  const explicitMouth = face && typeof face === 'object' && face.mouth;
  if ((!name || name === 'neutral') && !explicitMouth && style.neutralMouth) fr.mouth = style.neutralMouth;
  const look = style.glasses ? [0, -0.32] : [0, 0];
  fr.eyeL = { look, ...style.eye, ...fr.eyeL };
  fr.eyeR = { look, ...style.eye, ...fr.eyeR };
  const g = face && typeof face === 'object' ? face.glasses : undefined;
  fr.glasses = g === undefined ? style.glasses : g;
  fr.glassesDy = (face && typeof face === 'object' && face.glassesDy) || 0;
  return fr;
}

// ---------------------------------------------------------------- limbs
function makeArm(style) {
  const c = style.col;
  return function arm({ shade = true, dim = false, view = 'front' } = {}) {
    const id = S.uid('arm');
    const d = view === 'side' ? S.roundedPath([[-40, -20], [40, -20], [40, 248], [-40, 248]], 18) : S.roundedPath([[-30, -18], [30, -18], [40, 268], [-40, 268]], 17);
    const sleeveY = view === 'side' ? 100 : 112;
    let inner = S.rect(-60, -40, 120, sleeveY + 40, 0, { fill: c.jacket });
    if (shade) inner += S.rect(view === 'side' ? 22 : 20, -40, 40, 330, 0, { fill: '#000', opacity: 0.07 });
    inner += S.path(`M-60 ${sleeveY} L60 ${sleeveY}`, lineOnly(SW));
    if (dim) inner += S.rect(-60, -40, 120, 330, 0, { fill: '#000', opacity: 0.14 });
    return S.clipDef(id, S.path(d)) + S.path(d, { fill: c.skin }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
  };
}

function pantsWithKnee(style, J, wOut, wIn, shade, dim, ext = 24) {
  const c = style.col;
  const L = bentLimb(J, wOut, wIn, ext);
  const id = S.uid('leg');
  let inner = '';
  if (shade) {
    const a = add2(J.hip, mul2(L.u1, -60)), b = add2(J.hip, mul2(L.u1, 44));
    inner += S.path(`M${P(add2(a, mul2(L.n1, -200)))} L${P(add2(a, mul2(L.n1, 200)))} L${P(add2(b, mul2(L.n1, 200)))} L${P(add2(b, mul2(L.n1, -200)))} Z`, { fill: c.pantsShade });
  }
  if (dim) inner += S.rect(-300, -300, 600, 700, 0, { fill: '#000', opacity: 0.25 });
  let o = S.clipDef(id, S.path(L.d)) + S.path(L.d, { fill: c.pants }) + S.g(inner, null, { 'clip-path': `url(#${id})` });
  if (L.crease) o += S.path(L.crease, lineOnly(5));
  o += S.path(L.d, outline('none'));
  // the cuff rests on the shoe: cut the trouser leg at the shoe top line (ankle frame)
  const cid = S.uid('cuff');
  const cut = S.clipDef(cid, S.el('rect', { x: -700, y: -1400, width: 1400, height: 1408, transform: `translate(${P(J.ankle)}) rotate(${f(J.foot)})` }));
  return cut + S.g(o, null, { 'clip-path': `url(#${cid})` });
}
const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul2 = (a, k) => [a[0] * k, a[1] * k];

function makeLeg(style) {
  const c = style.col;
  return function leg({ shade = true, dim = false, toeShift = 0, back = false, J } = {}) {
    let o = pantsWithKnee(style, J, [42, 74, 103], [40, 40, 40], shade, dim);
    // sneaker in ankle space (flat on the ground when planted)
    let shoe = S.path(S.roundedPath([[-44, -4], [107, -4], [107, 40], [-44, 40]], 14), outline(dim ? c.soleShade : c.sole));
    if (c.soleBand) shoe += S.path(S.roundedPath([[-40, -1], [103, -1], [103, 14], [-40, 14]], 6), { fill: c.soleBand });
    if (shade) shoe += S.path('M-38 30 L101 30', lineOnly(6, c.soleShade));
    if (c.soleBand) shoe += S.path(S.roundedPath([[-44, -4], [107, -4], [107, 40], [-44, 40]], 14), outline('none'));
    if (!back) {
      const cx = 30 + toeShift;
      shoe += S.path(`M${f(cx - 42)} -2 A42 37 0 0 1 ${f(cx + 42)} -2 Z`, outline(c.toe));
      if (c.toe !== c.sole) shoe += S.path(`M${f(cx - 22)} -18 Q${f(cx)} -30 ${f(cx + 22)} -18`, lineOnly(4.5, '#fff'));
    }
    o += S.g(shoe, `translate(${P(J.ankle)}) rotate(${f(J.foot)})`);
    return o;
  };
}

function makeLegSide(style) {
  const c = style.col;
  return function legSide({ shade = true, dim = false, J } = {}) {
    let o = pantsWithKnee(style, J, [64, 74, 85], [58, 69, 80], shade, dim);
    const sole = dim ? '#D3D5DE' : c.sole;
    let shoe = S.path(S.roundedPath([[-138, -4], [88, -4], [88, 42], [-138, 42]], 16), outline(sole));
    if (c.soleBand) shoe += S.path(S.roundedPath([[-134, -1], [84, -1], [84, 15], [-134, 15]], 6), { fill: dim ? '#B81E33' : c.soleBand }) +
      S.path(S.roundedPath([[-138, -4], [88, -4], [88, 42], [-138, 42]], 16), outline('none'));
    shoe += S.path('M-130 -4 A44 38 0 0 1 -42 -4 Z', outline(c.toe === c.sole ? sole : (dim ? '#B81E33' : c.toe)));
    o += S.g(shoe, `translate(${P(J.ankle)}) rotate(${f(J.foot)})`);
    return o;
  };
}

// ---------------------------------------------------------------- torso
function makeTorso(style) {
  const c = style.col;
  return function torso(t, shade, back = false) {
    const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
    const T = -533, B = -306, W = 100;
    const id = S.uid('tor');
    const d = S.roundedPath([[-W, T], [W, T], [W, B], [-W, B]], 16);
    const cx = dir * at * 30;
    const k = 1 - 0.12 * at;
    let inner = '';
    if (!back) {
      inner += S.rect(cx - 29 * k, -512, 58 * k, B - -512 + 10, 0, { fill: c.shirt });
      if (shade) inner += S.rect(cx - 29 * k, -512, 58 * k, 22, 0, { fill: c.shirtShade });
      inner += S.path(`M${f(cx - 28 * k)} ${T - 10} L${f(cx + 28 * k)} ${T - 10} L${f(cx + 28 * k)} -503 Q${f(cx)} -483 ${f(cx - 28 * k)} -503 Z`, { fill: c.collar });
      inner += S.path(`M${f(cx - 28 * k)} -503 Q${f(cx)} -483 ${f(cx + 28 * k)} -503`, lineOnly(5.5));
      inner += S.path(`M${f(cx - 30 * k)} ${T} L${f(cx - 30 * k)} ${B} M${f(cx + 30 * k)} ${T} L${f(cx + 30 * k)} ${B}`, lineOnly(SW));
      inner += S.path(`M${f(cx - 72 * k)} ${T + 8} L${f(cx - 70 * k)} ${B - 6} M${f(cx + 72 * k)} ${T + 8} L${f(cx + 70 * k)} ${B - 6}`, lineOnly(4.5, c.jacketLine));
    } else {
      inner += S.path(`M0 ${T + 10} L0 ${B - 4}`, lineOnly(4.5, c.jacketLine));
      inner += S.path(`M-60 ${T + 26} Q0 ${T + 44} 60 ${T + 26}`, lineOnly(4.5, c.jacketLine));
    }
    if (shade) {
      inner += S.rect(-W - 10, B - 26, 2 * W + 20, 30, 0, { fill: '#000', opacity: 0.12 });
      if (at > 0.02) inner += S.rect(dir > 0 ? -W - 10 : W - 34 * at, T - 10, 34 * at + 10, B - T + 20, 0, { fill: '#000', opacity: 0.25 });
    }
    return S.clipDef(id, S.path(d)) + S.path(d, { fill: c.jacket }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
  };
}

function makeTorsoSide(style) {
  const c = style.col;
  return function torsoSide(shade) {
    let o = S.path(S.roundedPath([[-88, -512], [-56, -512], [-56, -312], [-88, -312]], 8), outline(c.shirt));
    const tid = S.uid('st');
    const td = S.roundedPath([[-62, -535], [70, -535], [70, -305], [-62, -305]], 16);
    o += S.clipDef(tid, S.path(td)) + S.path(td, { fill: c.jacket });
    if (shade) o += S.g(S.rect(-80, -330, 160, 30, 0, { fill: '#000', opacity: 0.12 }), null, { 'clip-path': `url(#${tid})` });
    return o + S.path(td, outline('none'));
  };
}

// ---------------------------------------------------------------- head helpers
function hairMap(t) {
  const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
  const hair = ([x, y]) => [x * dir > 0 ? x * (1 - 0.12 * at) + dir * 16 * at : x * (1 + 0.03 * at) + dir * 16 * at, y];
  const feat = ([x, y]) => [x * (1 - 0.15 * at) + dir * 40 * at, y];
  return { hair, feat, at, dir, fx: dir * 40 * at };
}

function frontHairPath(style, t, brows) {
  const { hair, feat } = hairMap(t);
  const bL = brows.L || [0, 0], bR = brows.R || [0, 0];
  const cy = -849 + style.notch;
  const pts = [
    hair([-141, -672]), hair([-243, -709]), hair([-201, -894]), 'ARC', hair([199, -894]),
    hair([242, -712]), hair([142, -672]), hair([142, -708]),
    feat([126, -716]), feat([104, -770]), feat([92, -796]),
    feat([84, -849 + bR[1]]), feat([5, cy + bR[0]]), feat([-5, cy + bL[0]]), feat([-84, -849 + bL[1]]),
    feat([-92, -796]), feat([-104, -770]), feat([-126, -716]), hair([-142, -708]),
  ];
  const top = hair([0, -1006]);
  let d = '';
  pts.forEach((p, i) => {
    if (p === 'ARC') return;
    if (i === 0) d += `M${P(p)}`;
    else if (pts[i - 1] === 'ARC') d += ` Q${P(top)} ${P(p)}`;
    else d += ` L${P(p)}`;
  });
  return d + ' Z';
}

function backHairPath(style, t) {
  const { at, dir } = hairMap(t);
  const sh = -dir * 12 * at;
  const half = style.longHair
    ? [[-211, -735], [-222, -600], [-196, -556], [-164, -584], [-140, -552], [-112, -566]]
    : [[-211, -735], [-211, -627], [-146, -613], [-157, -608], [-148, -566], [-110, -560]];
  const all = [...half, ...half.slice().reverse().map(([x, y]) => [-x, y])];
  return S.roundedPath(all.map(([x, y]) => [x + sh, y]), style.longHair ? 16 : 6);
}

// eyelashes for the big round eyes
function bigLashes(cx, cy, rx, ry, spec, side) {
  const outer = side; // -1: screen-left eye, outer is -x
  const type = spec.type || 'open';
  const st = lineOnly(7.5);
  const lash = (bx, by, ang, Lh) => {
    const a = (ang * Math.PI) / 180;
    return `M${f(bx)} ${f(by)} Q${f(bx + Math.cos(a) * Lh * 0.5 + outer * 4)} ${f(by + Math.sin(a) * Lh * 0.5 - 4)} ${f(bx + Math.cos(a) * Lh)} ${f(by + Math.sin(a) * Lh)}`;
  };
  const dirAng = (deg) => (outer < 0 ? 180 + deg : -deg); // deg measured upward from horizontal-outward
  if (type === 'happy' || type === 'closed' || type === 'squint') {
    const by = type === 'happy' ? cy + 14 : cy + 6;
    const bx = cx + outer * rx * 0.72;
    return S.path(lash(bx, by, dirAng(20), 24) + lash(bx - outer * 8, by - 8, dirAng(55), 20), st);
  }
  if (type !== 'open' && !['star', 'heart', 'robux', 'coin', 'swirl'].includes(type)) return '';
  const up = spec.upper || 0;
  let d = '';
  if (up < 0.18) {
    for (const [a, Lh, dir] of [[200, 30, 15], [218, 27, 38], [238, 22, 62]]) {
      const ang = outer < 0 ? a : 180 - a;
      const r = (ang * Math.PI) / 180;
      d += lash(cx + Math.cos(r) * rx, cy + Math.sin(r) * ry, dirAng(dir), Lh);
    }
  } else {
    const yU = cy - ry + 2 * ry * up;
    const k = Math.sqrt(Math.max(0, 1 - ((yU - cy) / ry) ** 2));
    for (const [kk, Lh, dir] of [[0.98, 28, 18], [0.78, 24, 42], [0.58, 20, 64]]) {
      const bx = cx + outer * rx * k * kk;
      const by = yU + (spec.tilt || 0) * (-outer) * ((bx - cx) / rx) * -1 * 0;
      d += lash(bx, by, dirAng(dir), Lh);
    }
  }
  return S.path(d, st);
}

function halfGlasses(eL, eR, rxL, rxR, top, depth = 74) {
  const gid = S.uid('lg');
  let o = S.el('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, '<stop offset="0" stop-color="#17171D"/><stop offset="1" stop-color="#4A0E1A"/>');
  const lens = (cx, rx) => {
    const x0 = cx - rx - 4, x1 = cx + rx + 4;
    const d = `M${f(x0)} ${f(top)} L${f(x1)} ${f(top)} Q${f(x1)} ${f(top + depth * 1.04)} ${f(cx)} ${f(top + depth)} Q${f(x0)} ${f(top + depth * 1.04)} ${f(x0)} ${f(top)} Z`;
    const id = S.uid('ln');
    return S.clipDef(id, S.path(d)) + S.path(d, { fill: `url(#${gid})` }) +
      S.g(S.path(`M${f(cx - rx * 0.6)} ${f(top + depth)} L${f(cx - rx * 0.2)} ${f(top)} L${f(cx + rx * 0.02)} ${f(top)} L${f(cx - rx * 0.38)} ${f(top + depth)} Z`, { fill: '#fff', opacity: 0.45 }) +
        S.path(`M${f(cx + rx * 0.18)} ${f(top + depth)} L${f(cx + rx * 0.44)} ${f(top)} L${f(cx + rx * 0.56)} ${f(top)} L${f(cx + rx * 0.3)} ${f(top + depth)} Z`, { fill: '#fff', opacity: 0.3 }), null, { 'clip-path': `url(#${id})` }) +
      S.path(d, { fill: 'none', stroke: '#0B0B0E', 'stroke-width': 4.5, 'stroke-linejoin': 'round' });
  };
  o += lens(eL[0], rxL) + lens(eR[0], rxR);
  o += S.path(`M${f(eL[0] - rxL - 4)} ${f(top)} L${f(eR[0] + rxR + 4)} ${f(top)}`, lineOnly(5, '#0B0B0E'));
  return o;
}

function makeHead(style) {
  const c = style.col;
  return function head(face, t, shade) {
    const { hair, feat, at, dir, fx } = hairMap(t);
    const fr = resolve(style, face);
    let o = '';
    const bh = backHairPath(style, t);
    o += S.path(bh, outline(c.hair));
    if (shade) o += S.path(bh, { fill: '#000', opacity: 0.12 });
    const hx = dir * 4 * at;
    const headD = S.roundedPath([[-140 + hx, -890], [140 + hx, -890], [140 + hx, -559], [-140 + hx, -559]], 46);
    const hid = S.uid('head');
    o += S.clipDef(hid, S.path(headD)) + S.path(headD, { fill: c.skin });
    const hairD = frontHairPath(style, t, fr.brows);
    if (shade) {
      let sh = '';
      if (at > 0.02) sh += S.rect(dir > 0 ? -150 : 140 - 72 * at + hx, -900, 72 * at + 10, 360, 0, { fill: c.skinShade });
      sh += S.path(hairD, { fill: c.skinShade, transform: 'translate(0 15)' });
      sh += S.rect(-160, -590, 320, 40, 0, { fill: c.skinShade, opacity: 0.55 });
      o += S.g(sh, null, { 'clip-path': `url(#${hid})` });
    }
    o += S.path(headD, outline('none'));
    const hairId = S.uid('hair');
    o += S.clipDef(hairId, S.path(hairD)) + S.path(hairD, { fill: c.hair });
    let hi = '';
    if (shade) {
      const a = hair([-150, -900]), b = hair([0, -958]), cc = hair([150, -900]);
      hi += S.path(`M${P(a)} Q${f(b[0])} ${f(b[1] - 44)} ${P(cc)}`, lineOnly(14, c.hairHi));
      const l1 = hair([-243, -709]), l2 = hair([-141, -672]);
      hi += S.path(`M${f(l1[0])} ${f(l1[1] - 30)} L${f(l2[0])} ${f(l2[1] - 30)} L${f(l2[0])} ${f(l2[1] + 40)} L${f(l1[0])} ${f(l1[1] + 40)} Z`, { fill: c.hairShade });
      const r1 = hair([242, -712]), r2 = hair([142, -672]);
      hi += S.path(`M${f(r1[0])} ${f(r1[1] - 30)} L${f(r2[0])} ${f(r2[1] - 30)} L${f(r2[0])} ${f(r2[1] + 40)} L${f(r1[0])} ${f(r1[1] + 40)} Z`, { fill: c.hairShade });
    }
    const sl = [hair([-148, -872]), hair([-196, -790]), hair([-193, -732]), feat([-131, -714])];
    const sr = [hair([148, -872]), hair([196, -790]), hair([193, -732]), feat([131, -714])];
    hi += S.path(`M${P(sl[0])} Q${P(sl[1])} ${P(sl[2])} L${P(sl[3])}`, lineOnly(SW));
    hi += S.path(`M${P(sr[0])} Q${P(sr[1])} ${P(sr[2])} L${P(sr[3])}`, lineOnly(SW));
    o += S.g(hi, null, { 'clip-path': `url(#${hairId})` }) + S.path(hairD, outline('none'));
    if (style.clip) {
      const cp = hair([150, -836]);
      o += S.g(S.rect(-34, -10, 68, 20, 9, outline(style.clip, 5)) + S.rect(-26, 16, 56, 18, 8, outline(style.clip, 5)), `translate(${P(cp)}) rotate(-38)`);
    }

    // eyes
    const blink = fr.blink || 0;
    const withBlink = (e) => (blink > 0 && (!e.type || e.type === 'open') ? { ...e, upper: (e.upper || 0) + (1 - (e.upper || 0)) * blink } : e);
    const lookBias = t * 0.45;
    const eL = feat([-64, -719]), eR = feat([64, -719]);
    const kNear = 1 - 0.04 * at, kFar = 1 - 0.3 * at;
    const rxL = 64 * (dir > 0 ? kNear : kFar), rxR = 64 * (dir > 0 ? kFar : kNear);
    const sL = withBlink(fr.eyeL), sR = withBlink(fr.eyeR);
    const eyeOpts = { lookBias, topW: style.lashes ? 9 : undefined };
    o += F.eye(eL[0], eL[1], rxL, 80, sL, -1, eyeOpts);
    o += F.eye(eR[0], eR[1], rxR, 80, sR, 1, eyeOpts);
    if (style.lashes) o += bigLashes(eL[0], eL[1], rxL, 80, sL, -1) + bigLashes(eR[0], eR[1], rxR, 80, sR, 1);
    if (fr.glasses === 'half') o += halfGlasses(eL, eR, rxL, rxR, -715 + fr.glassesDy);
    if (style.blush) o += S.ellipse(-86 + fx, -616, 28, 11, { fill: C.blush, opacity: 0.5 }) + S.ellipse(86 + fx, -616, 28, 11, { fill: C.blush, opacity: 0.5 });
    const m = feat([0, -595]);
    o += F.mouth(fr.mouth, m[0], m[1], 1 - 0.15 * at, 1);
    o += F.faceFx(fr.fx, { fx });
    return o;
  };
}

function makeHeadBack(style) {
  const c = style.col;
  return function headBack(face, shade) {
    const headD = S.roundedPath([[-140, -890], [140, -890], [140, -559], [-140, -559]], 46);
    let o = S.path(headD, outline(c.skin));
    const pts = style.longHair
      ? [[-243, -709], [-201, -894], 'ARC', [199, -894], [242, -712], [215, -700], [220, -596], [190, -552], [150, -580], [100, -552], [50, -574], [0, -556], [-50, -574], [-100, -552], [-150, -580], [-190, -552], [-220, -596], [-215, -700]]
      : [[-243, -709], [-201, -894], 'ARC', [199, -894], [242, -712], [211, -700], [211, -627], [150, -612], [146, -578], [60, -584], [0, -572], [-60, -584], [-146, -578], [-150, -612], [-211, -627], [-211, -700]];
    let d = '';
    pts.forEach((p, i) => {
      if (p === 'ARC') return;
      if (i === 0) d += `M${p[0]} ${p[1]}`;
      else if (pts[i - 1] === 'ARC') d += ` Q0 -1006 ${p[0]} ${p[1]}`;
      else d += ` L${p[0]} ${p[1]}`;
    });
    d += ' Z';
    if (style.longHair) {
      // soften only the lower tips: quadratic fillet on every interior point after the top arc
      const flat = pts.filter((q) => q !== 'ARC');
      d = `M${flat[0][0]} ${flat[0][1]} L${flat[1][0]} ${flat[1][1]} Q0 -1006 ${flat[2][0]} ${flat[2][1]} L${flat[3][0]} ${flat[3][1]}`;
      const low = flat.slice(4);
      low.forEach((q, i) => {
        if (i === 0 || i === low.length - 1) { d += ` L${q[0]} ${q[1]}`; return; }
        const pr = low[i - 1], nx = low[i + 1];
        const k1 = Math.min(16, Math.hypot(pr[0] - q[0], pr[1] - q[1]) / 2) / Math.hypot(pr[0] - q[0], pr[1] - q[1]);
        const k2 = Math.min(16, Math.hypot(nx[0] - q[0], nx[1] - q[1]) / 2) / Math.hypot(nx[0] - q[0], nx[1] - q[1]);
        d += ` L${f(q[0] + (pr[0] - q[0]) * k1)} ${f(q[1] + (pr[1] - q[1]) * k1)} Q${q[0]} ${q[1]} ${f(q[0] + (nx[0] - q[0]) * k2)} ${f(q[1] + (nx[1] - q[1]) * k2)}`;
      });
      d += ' Z';
    }
    const id = S.uid('bh');
    o += S.clipDef(id, S.path(d)) + S.path(d, { fill: c.hair });
    let inner = '';
    if (shade) {
      inner += S.path('M-150 -900 Q0 -1000 150 -900', lineOnly(14, c.hairHi));
      inner += S.rect(-260, style.longHair ? -592 : -606, 520, 50, 0, { fill: c.hairShade, opacity: 0.6 });
    }
    inner += S.path('M-150 -880 Q-190 -790 -192 -716 M150 -880 Q190 -790 192 -716 M-60 -930 Q-70 -760 -60 -640 M60 -930 Q70 -760 60 -640', lineOnly(SW));
    inner += S.path('M-211 -700 L-150 -688 L-150 -612 M211 -700 L150 -688 L150 -612', lineOnly(SW));
    o += S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
    if (style.clip) o += S.g(S.rect(-34, -10, 68, 20, 9, outline(style.clip, 5)) + S.rect(-26, 16, 56, 18, 8, outline(style.clip, 5)), 'translate(-150 -836) rotate(38)');
    return o;
  };
}

function makeHeadSide(style) {
  const c = style.col;
  return function headSide(face, shade) {
    const fr = resolve(style, face);
    const bL = fr.brows.L || [0, 0], bR = fr.brows.R || [0, 0];
    const browDy = ((bL[0] + bL[1] + bR[0] + bR[1]) / 4) * 1.1;
    const browIn = (bL[0] + bR[0]) / 2;
    let o = '';
    const headD = S.roundedPath([[-165, -885], [150, -885], [150, -553], [-165, -553, 54]], 44);
    const hid = S.uid('hs');
    o += S.clipDef(hid, S.path(headD)) + S.path(headD, { fill: c.skin });
    const tail = style.longHair
      ? [[40, -625], [40, -560], [90, -578], [128, -548], [182, -566], [182, -675]]
      : [[40, -625], [40, -575], [180, -585], [180, -675]];
    const hairPts = [[-190, -810], [-145, -795], [-95, -842 + browDy + browIn * 0.4], [-55, -715], [-15, -722], [-15, -625], ...tail, [235, -685], [175, -900], 'ARC', [-160, -920]];
    let d = '';
    hairPts.forEach((p, i) => {
      if (p === 'ARC') return;
      if (i === 0) d += `M${p[0]} ${f(p[1])}`;
      else if (hairPts[i - 1] === 'ARC') d += ` Q10 -990 ${p[0]} ${p[1]}`;
      else d += ` L${p[0]} ${f(p[1])}`;
    });
    d += ' Z';
    if (shade) o += S.g(S.path(d, { fill: c.skinShade, transform: 'translate(10 14)' }) + S.rect(-180, -590, 360, 40, 0, { fill: c.skinShade, opacity: 0.55 }), null, { 'clip-path': `url(#${hid})` });
    o += S.path(headD, outline('none'));
    const id = S.uid('hsh');
    o += S.clipDef(id, S.path(d)) + S.path(d, { fill: c.hair });
    let inner = '';
    if (shade) {
      inner += S.path('M-140 -905 Q10 -975 160 -890', lineOnly(14, c.hairHi));
      inner += S.rect(-20, style.longHair ? -592 : -604, 300, 40, 0, { fill: c.hairShade, opacity: 0.6 });
    }
    inner += S.path('M10 -875 L50 -745 M110 -705 L115 -640 M-15 -722 L40 -735', lineOnly(SW));
    o += S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
    const blink = fr.blink || 0;
    const e = fr.eyeL;
    const ee = blink > 0 && (!e.type || e.type === 'open') ? { ...e, upper: (e.upper || 0) + (1 - (e.upper || 0)) * blink } : e;
    o += F.eye(-118, -716, 56, 80, { ...ee, cross: 0 }, 1, { sidePupil: -0.66, topW: style.lashes ? 9 : undefined });
    if (style.lashes && (!ee.type || ee.type === 'open') && (ee.upper || 0) < 0.3) {
      o += S.path('M-74 -772 Q-62 -790 -50 -796 M-68 -754 Q-54 -766 -40 -770 M-82 -786 Q-76 -806 -68 -816', lineOnly(7.5));
    }
    if (fr.glasses === 'half') {
      const top = -712 + fr.glassesDy;
      o += S.path(`M-70 ${f(top)} L30 ${f(top - 12)}`, lineOnly(5, '#0B0B0E'));
      o += S.path(`M-180 ${f(top)} L-66 ${f(top)} Q-66 ${f(top + 74)} -118 ${f(top + 72)} Q-180 ${f(top + 74)} -180 ${f(top)} Z`, { fill: '#2A0C14', stroke: '#0B0B0E', 'stroke-width': 4.5 });
      o += S.path(`M-160 ${f(top + 66)} L-140 ${f(top + 4)} L-126 ${f(top + 4)} L-146 ${f(top + 66)} Z`, { fill: '#fff', opacity: 0.4 });
    }
    if (style.blush) o += S.ellipse(-110, -614, 24, 10, { fill: C.blush, opacity: 0.5 });
    o += F.mouth(fr.mouth, -132, -598, 0.55, 1);
    o += F.faceFx(fr.fx.filter((x) => (typeof x === 'string' ? x : x.type) !== 'blush'), { fx: 0 });
    return o;
  };
}

// ---------------------------------------------------------------- design factory
function makeDesign(style, extra = {}) {
  const st = makeStyle(style);
  return {
    style: st,
    leg: makeLeg(st), legSide: makeLegSide(st), arm: makeArm(st),
    torso: makeTorso(st), torsoSide: makeTorsoSide(st),
    head: makeHead(st), headSide: makeHeadSide(st), headBack: makeHeadBack(st),
    ...extra,
  };
}

const makeDraw = (design) => (pose = {}) => drawCharacter(design, pose);

module.exports = { makeStyle, makeDesign, makeDraw, BASE_STYLE };
