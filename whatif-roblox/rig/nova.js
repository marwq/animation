// NOVA — cool speedrunner girl. Black high ponytail with a red scrunchie,
// side-swept fringe, thin dark half-moon sunglasses low on the nose (eyes look
// over them), red jacket with black details, black pants with a red stripe,
// red high-top sneakers.
//
// Extra face fields (on top of the shared face spec):
//   glasses: 'half' (default) | 'up' (pushed onto the hair) | 'off'
//   glassesDy: extra vertical slide of the glasses (for animating the push-up)
// Extra pose field: tail (deg) ponytail swing around the hair tie.
'use strict';

const S = require('./svg');
const F = require('./face');
const { drawCharacter } = require('./body');
const { f } = S;

const N = {
  line: '#151515',
  hair: '#202129', hairHi: '#4B5169', hairShade: '#121318',
  red: '#D9263C', redShade: '#A8192C', redHi: '#F2566A',
  black: '#1A1A20', blackHi: '#2C2C35',
  pants: '#18181E', pantsShade: '#0E0E12',
  skin: '#FFFFFF', skinShade: '#E7E8F0',
  lens: '#15151B', lensTint: '#4A0E1A',
  sole: '#FFFFFF', soleShade: '#E2E3EA',
};
const SW = 7;
const outline = (fill, w = SW) => ({ fill, stroke: N.line, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const lineOnly = (w = SW, color = N.line) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const P = (pts) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L') + ' Z';

// ---------------------------------------------------------------- expressions
// Nova-specific presets; anything else falls back to the shared library (with Nova defaults).
const NOVA_EXPR = {
  cool:     { eyes: { upper: 0.3, tilt: -4, look: [0.15, -0.35] }, brows: { L: [4, -2], R: [-16, -12] }, mouth: 'smirk' },
  smirk:    { eyes: { upper: 0.4, tilt: -8, look: [0.55, -0.3] }, brows: { L: [10, 0], R: [-34, -26] }, mouth: 'smirk' },
  teasing:  { eyes: { upper: 0.45, lower: 0.08, look: [-0.5, -0.3] }, brows: { L: [-26, -20], R: [6, 0] }, mouth: 'smirk', glasses: 'half', glassesDy: 10 },
  laugh:    { eyes: { type: 'happy' }, brows: { L: [-24, -10], R: [-24, -10] }, mouth: 'grin' },
  grin:     { eyes: { upper: 0.22, lower: 0.12, look: [0, -0.35] }, brows: { L: [-10, -6], R: [-10, -6] }, mouth: 'grin' },
  focused:  { eyes: { upper: 0.36, tilt: 16, look: [0.6, -0.3] }, brows: { L: [16, -8], R: [16, -8] }, mouth: 'line' },
  unimpressed: { eyes: { upper: 0.55, look: [0, -0.3] }, brows: { L: [0, 0], R: [0, 0] }, mouth: 'short' },
  softSmile:{ eyes: { upper: 0.18, lower: 0.14, look: [-0.4, -0.2], sparkle: true, pupil: 1.15 }, brows: { L: [-22, -6], R: [-22, -6] }, mouth: 'smallSmile', fx: ['blush'], glasses: 'up' },
  shocked:  { eyes: { pupil: 0.55, look: [0, -0.2] }, brows: { L: [-44, -26], R: [-44, -26] }, mouth: 'O', glassesDy: 14 },
  angry:    { eyes: { upper: 0.32, tilt: 22, look: [0, -0.3] }, brows: { L: [18, -12], R: [18, -12] }, mouth: 'teeth' },
  shout:    { eyes: { upper: 0.1, tilt: 10, look: [0.3, -0.3] }, brows: { L: [10, -14], R: [10, -14] }, mouth: 'D' },
  scared:   { eyes: { pupil: 0.55, look: [0, -0.3] }, brows: { L: [-52, 12], R: [-52, 12] }, mouth: 'wavy', fx: ['sweat'] },
  wink:     { eyeL: { upper: 0.3, look: [0.3, -0.35] }, eyeR: { type: 'happy' }, brows: { L: [-6, -4], R: [-24, -14] }, mouth: 'smirk', fx: ['sparkles'] },
  blushing: { eyes: { upper: 0.3, lower: 0.12, look: [-0.8, 0.2] }, brows: { L: [-36, -6], R: [-36, -6] }, mouth: 'smallSmile', fx: ['blush'] },
};

function resolveNovaFace(face) {
  if (!face) face = 'cool';
  if (typeof face === 'string') face = { name: face };
  const name = face.name || 'cool';
  const preset = NOVA_EXPR[name] || F.EXPR[name] || NOVA_EXPR.cool;
  const baseEyes = { cross: 0, look: [0, -0.3], lidCurve: 18, ...(preset.eyes || {}) };
  const r = F.resolveFace({ name: '__none__', ...face, eyes: { ...baseEyes, ...(face.eyes || {}) },
    eyeL: { ...(preset.eyeL || {}), ...(face.eyeL || {}) }, eyeR: { ...(preset.eyeR || {}), ...(face.eyeR || {}) },
    brows: { ...(preset.brows || {}), ...(face.brows || {}) }, mouth: face.mouth || preset.mouth, fx: face.fx !== undefined ? face.fx : (preset.fx || []) });
  r.glasses = face.glasses || preset.glasses || 'half';
  r.glassesDy = (face.glassesDy ?? preset.glassesDy ?? 0);
  return r;
}

// ---------------------------------------------------------------- shared head mapping (front / 3-4)
function mapping(t) {
  const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
  const hair = ([x, y]) => [x * dir > 0 ? x * (1 - 0.12 * at) + dir * 16 * at : x * (1 + 0.03 * at) + dir * 16 * at, y];
  const feat = ([x, y]) => [x * (1 - 0.15 * at) + dir * 40 * at, y];
  return { at, dir, hair, feat, fx: dir * 40 * at };
}

const EYE = { x: 62, y: -725, rx: 52, ry: 64 };

function lashes(cx, cy, rx, ry, spec, side) {
  const outer = side; // screen-left eye: outer is -x
  const type = spec.type || 'open';
  if (type !== 'open') return '';
  const up = spec.upper || 0;
  let bx, by;
  if (up < 0.3) { bx = cx + outer * rx * 0.93; by = cy - ry * 0.36; }
  else {
    const yU = cy - ry + 2 * ry * up;
    const k = Math.sqrt(Math.max(0, 1 - ((yU - cy) / ry) ** 2));
    bx = cx + outer * rx * k; by = yU + (spec.tilt || 0) * -1 * 0.9;
  }
  const a1 = outer < 0 ? -158 : -22, a2 = outer < 0 ? -128 : -52;
  const seg = (a, L) => { const r = (a * Math.PI) / 180; return `M${f(bx)} ${f(by)} L${f(bx + Math.cos(r) * L)} ${f(by + Math.sin(r) * L)}`; };
  return S.path(seg(a1, 24) + seg(a2, 18), lineOnly(7));
}

function brow(cx, cy, side, b = [0, 0]) {
  // side -1 = screen-left brow; b = [innerDy, outerDy]
  const inner = [cx - side * 34, cy + 4 + b[0]];
  const outerP = [cx + side * 40, cy + 8 + b[1]];
  const mid = [(inner[0] + outerP[0]) / 2, (inner[1] + outerP[1]) / 2 - 10];
  const dd = `M${f(outerP[0])} ${f(outerP[1])} Q${f(mid[0])} ${f(mid[1])} ${f(inner[0])} ${f(inner[1])}`;
  return S.path(dd, lineOnly(17, '#F3F4F8')) + S.path(dd, lineOnly(10));
}

// half-moon sunglasses for one eye: top edge through the eye middle
function lensPath(cx, top, rx, depth) {
  return `M${f(cx - rx)} ${f(top)} L${f(cx + rx)} ${f(top)} Q${f(cx + rx)} ${f(top + depth * 1.05)} ${f(cx)} ${f(top + depth)} Q${f(cx - rx)} ${f(top + depth * 1.05)} ${f(cx - rx)} ${f(top)} Z`;
}

function glassesFront(eL, eR, rxL, rxR, top, scale = 1) {
  const gid = S.uid('lg');
  let o = S.el('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, `<stop offset="0" stop-color="${N.lens}"/><stop offset="1" stop-color="${N.lensTint}"/>`);
  const depth = 60 * scale;
  const lens = (cx, rx) => {
    const d = lensPath(cx, top, (rx + 10) * scale, depth);
    const id = S.uid('ln');
    return S.clipDef(id, S.path(d)) + S.path(d, { fill: `url(#${gid})`, stroke: '#0B0B0E', 'stroke-width': 5, 'stroke-linejoin': 'round' }) +
      S.g(S.path(`M${f(cx - rx * 0.55)} ${f(top + depth * 0.95)} L${f(cx - rx * 0.15)} ${f(top + 6)} L${f(cx + rx * 0.05)} ${f(top + 6)} L${f(cx - rx * 0.35)} ${f(top + depth * 0.95)} Z`, { fill: '#fff', opacity: 0.55 }) +
        S.path(`M${f(cx + rx * 0.2)} ${f(top + depth * 0.9)} L${f(cx + rx * 0.45)} ${f(top + 8)} L${f(cx + rx * 0.55)} ${f(top + 8)} L${f(cx + rx * 0.3)} ${f(top + depth * 0.9)} Z`, { fill: '#fff', opacity: 0.35 }), null, { 'clip-path': `url(#${id})` });
  };
  o += lens(eL[0], rxL) + lens(eR[0], rxR);
  // top bar + bridge
  const l0 = eL[0] - (rxL + 10) * scale, l1 = eL[0] + (rxL + 10) * scale, r0 = eR[0] - (rxR + 10) * scale, r1 = eR[0] + (rxR + 10) * scale;
  o += S.path(`M${f(l0)} ${f(top)} L${f(l1)} ${f(top)} Q${f((l1 + r0) / 2)} ${f(top + 12)} ${f(r0)} ${f(top)} L${f(r1)} ${f(top)}`, lineOnly(6, '#0B0B0E'));
  return { svg: o, l0, r1 };
}

function headFront(face, t, shade) {
  const fr = resolveNovaFace(face);
  const { at, dir, hair, feat, fx } = mapping(t);
  let o = '';
  // back hair rim
  const bh = -dir * 12 * at;
  o += S.path(S.roundedPath([[-160 + bh, -935], [160 + bh, -935], [160 + bh, -660], [-160 + bh, -660]], 80), outline(N.hair));
  // head
  const hx = dir * 4 * at;
  const headD = S.roundedPath([[-138 + hx, -890], [138 + hx, -890], [138 + hx, -559], [-138 + hx, -559]], 54);
  const hid = S.uid('nh');
  o += S.clipDef(hid, S.path(headD)) + S.path(headD, { fill: N.skin });
  // hair cap with a smooth side-swept fringe (two locks)
  const M = (pt, m) => { const q = m(pt); return `${f(q[0])} ${f(q[1])}`; };
  const d = `M${M([-152, -640], hair)} L${M([-160, -760], hair)} L${M([-162, -850], hair)} Q${M([0, -1040], hair)} ${M([162, -850], hair)}` +
    ` L${M([160, -760], hair)} L${M([152, -640], hair)} L${M([126, -655], hair)} L${M([134, -796], hair)}` +
    ` Q${M([126, -808], feat)} ${M([120, -800], feat)} Q${M([110, -832], feat)} ${M([88, -838], feat)}` +
    ` Q${M([80, -826], feat)} ${M([66, -812], feat)} Q${M([52, -846], feat)} ${M([18, -856], feat)}` +
    ` Q${M([-20, -868], feat)} ${M([-52, -874], feat)} Q${M([-96, -876], hair)} ${M([-128, -850], hair)}` +
    ` L${M([-134, -790], hair)} L${M([-126, -655], hair)} Z`;
  if (shade) {
    let sh = '';
    if (at > 0.02) sh += S.rect(dir > 0 ? -150 : 138 - 72 * at + hx, -900, 72 * at + 10, 360, 0, { fill: N.skinShade });
    sh += S.path(d, { fill: N.skinShade, transform: 'translate(0 14)' });
    sh += S.rect(-160, -590, 320, 40, 0, { fill: N.skinShade, opacity: 0.55 });
    o += S.g(sh, null, { 'clip-path': `url(#${hid})` });
  }
  o += S.path(headD, outline('none'));
  const hairId = S.uid('nhc');
  o += S.clipDef(hairId, S.path(d)) + S.path(d, { fill: N.hair });
  let hi = '';
  const a = hair([-120, -905]), b = hair([0, -975]), c = hair([120, -905]);
  if (shade) hi += S.path(`M${f(a[0])} ${f(a[1])} Q${f(b[0])} ${f(b[1] - 40)} ${f(c[0])} ${f(c[1])}`, lineOnly(16, N.hairHi));
  const s1 = feat([-52, -874]), s2 = hair([40, -895]), s3 = hair([150, -830]);
  const s4 = feat([-30, -900]), s5 = hair([60, -925]), s6 = hair([158, -880]);
  hi += S.path(`M${f(s1[0])} ${f(s1[1])} Q${f(s2[0])} ${f(s2[1])} ${f(s3[0])} ${f(s3[1])} M${f(s4[0])} ${f(s4[1])} Q${f(s5[0])} ${f(s5[1])} ${f(s6[0])} ${f(s6[1])}`, lineOnly(5, '#0c0c10'));
  const l1 = hair([-140, -780]), l2 = hair([-142, -660]), r1 = hair([140, -780]), r2 = hair([142, -660]);
  hi += S.path(`M${f(l1[0])} ${f(l1[1])} L${f(l2[0])} ${f(l2[1])} M${f(r1[0])} ${f(r1[1])} L${f(r2[0])} ${f(r2[1])}`, lineOnly(4.5, '#0c0c10'));
  o += S.g(hi, null, { 'clip-path': `url(#${hairId})` }) + S.path(d, outline('none'));

  // eyes
  const blink = fr.blink || 0;
  const withBlink = (e) => (blink > 0 && (!e.type || e.type === 'open') ? { ...e, upper: (e.upper || 0) + (1 - (e.upper || 0)) * blink } : e);
  const eL = feat([-EYE.x, EYE.y]), eR = feat([EYE.x, EYE.y]);
  const rxL = EYE.rx * (dir > 0 ? 1 - 0.04 * at : 1 - 0.3 * at), rxR = EYE.rx * (dir > 0 ? 1 - 0.3 * at : 1 - 0.04 * at);
  const lookBias = t * 0.45;
  const sL = withBlink(fr.eyeL), sR = withBlink(fr.eyeR);
  o += F.eye(eL[0], eL[1], rxL, EYE.ry, sL, -1, { lookBias, pupilScale: 1.1, topW: 10 });
  o += F.eye(eR[0], eR[1], rxR, EYE.ry, sR, 1, { lookBias, pupilScale: 1.1, topW: 10 });
  o += lashes(eL[0], eL[1], rxL, EYE.ry, sL, -1) + lashes(eR[0], eR[1], rxR, EYE.ry, sR, 1);
  // brows (drawn over the hair)
  const bL = fr.brows.L || [0, 0], bR = fr.brows.R || [0, 0];
  const pbL = feat([-62, -808]), pbR = feat([62, -808]);
  o += brow(pbL[0], pbL[1], -1, bL) + brow(pbR[0], pbR[1], 1, bR);
  // glasses
  if (fr.glasses === 'half') {
    const top = EYE.y + 4 + fr.glassesDy;
    const g = glassesFront(eL, eR, rxL, rxR, top);
    const hl = -138 + hx, hr = 138 + hx;
    o += S.path(`M${f(g.l0)} ${f(top + 2)} L${f(Math.min(g.l0, hl + 4))} ${f(top - 6)} M${f(g.r1)} ${f(top + 2)} L${f(Math.max(g.r1, hr - 4))} ${f(top - 6)}`, lineOnly(5, '#0B0B0E'));
    o += g.svg;
  }
  // mouth + fx
  const m = feat([0, -606]);
  o += F.mouth(fr.mouth, m[0], m[1], 0.86 * (1 - 0.15 * at), 0.92);
  o += F.faceFx(fr.fx, { fx });
  // glasses pushed up onto the hair
  if (fr.glasses === 'up') {
    const top = -905 + fr.glassesDy;
    o += glassesFront(hair([-60, top]), hair([60, top]), 46, 46, top, 0.85).svg;
  }
  return o;
}

// ---------------------------------------------------------------- ponytail
function tailPathFront() {
  return 'M72 -948 C150 -1012 272 -962 268 -842 C266 -742 242 -652 222 -572 C212 -642 198 -722 178 -792 C160 -852 140 -892 118 -915 Z';
}
function ponytail(d, tie, angle, shade, strands) {
  const id = S.uid('pt');
  let inner = '';
  if (shade) inner += S.path(strands.hi, lineOnly(14, N.hairHi));
  inner += S.path(strands.lines, lineOnly(5, '#0c0c10'));
  let o = S.clipDef(id, S.path(d)) + S.path(d, { fill: N.hair }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
  // scrunchie
  o += S.g(S.ellipse(0, 0, 34, 24, outline(N.red)) + S.path('M-18 -14 Q-10 0 -18 14 M0 -22 Q8 0 0 22 M18 -14 Q26 0 18 14', lineOnly(4, N.redShade)),
    `translate(${f(tie[0])} ${f(tie[1])}) rotate(-28)`);
  return S.g(o, `rotate(${f(angle)} ${f(tie[0])} ${f(tie[1])})`);
}

function under(face, t, shade, view) {
  const swing = (typeof face === 'object' && face && face.tail) || 0;
  if (view === 'front') {
    const dx = -t * 48;
    return S.g(ponytail(tailPathFront(), [96, -935], swing, shade, {
      hi: 'M120 -950 C200 -985 262 -930 252 -830',
      lines: 'M110 -935 C190 -962 245 -902 238 -760 M150 -935 C215 -930 252 -862 250 -800',
    }), `translate(${f(dx)} 0)`);
  }
  if (view === 'side') {
    return ponytail('M100 -948 C190 -1004 304 -952 300 -832 C298 -732 270 -652 250 -582 C240 -652 216 -732 192 -800 C172 -860 150 -900 128 -920 Z',
      [116, -932], swing, shade, { hi: 'M140 -960 C220 -990 292 -930 284 -830', lines: 'M130 -940 C210 -965 270 -905 266 -770 M170 -940 C235 -935 280 -860 278 -800' });
  }
  return '';
}

function over(face, t, shade, view) {
  if (view !== 'back') return '';
  const swing = (typeof face === 'object' && face && face.tail) || 0;
  return ponytail('M-130 -955 C-60 -1000 -14 -930 -26 -830 C-36 -730 -58 -650 -80 -574 C-102 -650 -132 -740 -146 -820 C-156 -880 -156 -930 -130 -955 Z',
    [-96, -940], swing, shade, { hi: 'M-110 -960 C-60 -975 -40 -900 -46 -820', lines: 'M-100 -945 C-70 -900 -60 -800 -76 -660 M-124 -940 C-110 -880 -112 -800 -118 -720' });
}

// ---------------------------------------------------------------- head side / back
function headSide(face, shade) {
  const fr = resolveNovaFace(face);
  let o = '';
  const headD = S.roundedPath([[-160, -885], [140, -885], [140, -553], [-160, -553, 54]], 44);
  const hid = S.uid('nhs');
  o += S.clipDef(hid, S.path(headD)) + S.path(headD, { fill: N.skin });
  const d = 'M-172 -800 L-152 -900 Q-20 -1000 130 -925 L152 -800 L150 -660 L112 -636 L52 -640 L40 -700 L18 -646 L8 -760 L-40 -812 L-100 -838 L-140 -822 Z';
  if (shade) o += S.g(S.path(d, { fill: N.skinShade, transform: 'translate(8 12)' }) + S.rect(-180, -590, 360, 40, 0, { fill: N.skinShade, opacity: 0.55 }), null, { 'clip-path': `url(#${hid})` });
  o += S.path(headD, outline('none'));
  const id = S.uid('nhsh');
  let inner = shade ? S.path('M-130 -905 Q0 -975 130 -905', lineOnly(16, N.hairHi)) : '';
  inner += S.path('M-60 -900 Q40 -930 120 -900 M-100 -850 Q20 -880 140 -840 M30 -760 L44 -680', lineOnly(5, '#0c0c10'));
  o += S.clipDef(id, S.path(d)) + S.path(d, { fill: N.hair }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
  // eye, lashes, brow
  const blink = fr.blink || 0;
  const e = fr.eyeL;
  const ee = blink > 0 && (!e.type || e.type === 'open') ? { ...e, upper: (e.upper || 0) + (1 - (e.upper || 0)) * blink } : e;
  o += F.eye(-112, -728, 40, 64, { ...ee, cross: 0 }, 1, { sidePupil: -0.55, pupilScale: 1.05, topW: 10 });
  if (!ee.type || ee.type === 'open') o += S.path('M-80 -770 L-62 -788 M-82 -756 L-62 -766', lineOnly(6));
  const bL = fr.brows.L || [0, 0];
  o += S.path(`M-150 ${f(-812 + bL[0])} Q-120 ${f(-826 + (bL[0] + bL[1]) / 2)} -84 ${f(-812 + bL[1])}`, lineOnly(10));
  if (fr.glasses === 'half') {
    const top = -721 + fr.glassesDy;
    const gid = S.uid('lgs');
    o += S.el('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, `<stop offset="0" stop-color="${N.lens}"/><stop offset="1" stop-color="${N.lensTint}"/>`);
    o += S.path(`M-60 ${f(top)} L40 ${f(top - 14)}`, lineOnly(5, '#0B0B0E'));
    o += S.path(lensPath(-118, top, 50, 56), { fill: `url(#${gid})`, stroke: '#0B0B0E', 'stroke-width': 5 });
    o += S.path(`M-150 ${f(top + 50)} L-128 ${f(top + 6)} L-114 ${f(top + 6)} L-136 ${f(top + 50)} Z`, { fill: '#fff', opacity: 0.5 });
  } else if (fr.glasses === 'up') {
    o += S.path(lensPath(-60, -902, 44, 44), { fill: N.lens, stroke: '#0B0B0E', 'stroke-width': 5 }) + S.path('M-16 -902 L80 -912', lineOnly(5, '#0B0B0E'));
  }
  o += F.mouth(fr.mouth, -128, -606, 0.5, 0.92);
  o += F.faceFx(fr.fx.filter((x) => (typeof x === 'string' ? x : x.type) !== 'blush'), { fx: 0 });
  return o;
}

function headBack(face, shade) {
  let o = S.path(S.roundedPath([[-138, -890], [138, -890], [138, -559], [-138, -559]], 54), outline(N.skin));
  const d = 'M-162 -850 Q0 -1040 162 -850 L156 -640 L120 -628 L60 -642 L0 -624 L-60 -642 L-120 -628 L-156 -640 Z';
  const id = S.uid('nb');
  let inner = shade ? S.path('M-120 -905 Q0 -975 120 -905', lineOnly(16, N.hairHi)) : '';
  inner += S.path('M-150 -700 Q-150 -880 -100 -930 M-60 -650 Q-80 -830 -100 -925 M40 -650 Q0 -850 -90 -925 M140 -690 Q120 -880 -80 -935', lineOnly(5, '#0c0c10'));
  o += S.clipDef(id, S.path(d)) + S.path(d, { fill: N.hair }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
  return o;
}

// ---------------------------------------------------------------- body parts
function arm({ shade = true, dim = false, view = 'front' } = {}) {
  const id = S.uid('na');
  const side = view === 'side';
  const d = side ? S.roundedPath([[-40, -20], [40, -20], [40, 248], [-40, 248]], 18) : S.roundedPath([[-30, -18], [30, -18], [40, 268], [-40, 268]], 17);
  const cuff0 = side ? 186 : 204, cuff1 = side ? 210 : 230;
  let inner = S.rect(-60, -40, 120, cuff0 + 40, 0, { fill: N.red });
  inner += S.rect(-60, cuff0, 120, cuff1 - cuff0, 0, { fill: N.black });
  inner += S.path(`M-60 ${cuff0} L60 ${cuff0} M-60 ${cuff1} L60 ${cuff1}`, lineOnly(5));
  inner += side ? S.rect(-6, -30, 12, cuff0 + 30, 0, { fill: N.black }) : S.path(`M20 -10 L28 ${cuff0} M30 -10 L38 ${cuff0}`, lineOnly(6, N.black));
  if (shade) inner += S.rect(side ? 22 : 18, -40, 40, cuff0 + 40, 0, { fill: '#000', opacity: 0.12 }) + S.rect(-60, -40, 120, 26, 0, { fill: N.redShade, opacity: 0.6 });
  if (dim) inner += S.rect(-60, -40, 120, 330, 0, { fill: '#000', opacity: 0.18 });
  return S.clipDef(id, S.path(d)) + S.path(d, { fill: N.skin }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
}

function shoeFront(toeShift, back, dim) {
  const red = dim ? N.redShade : N.red;
  let o = S.path(S.roundedPath([[-46, 212], [64, 212], [72, 290], [-52, 290]], 14), outline(red));
  if (!back) {
    o += S.path('M-4 230 L28 230 M-6 246 L30 246 M-8 262 L32 262', lineOnly(5));
    o += S.path(P([[38, 230], [62, 224], [68, 272], [46, 276]]), { fill: N.black });
  } else {
    o += S.rect(-2, 206, 26, 40, 6, outline(N.black, 5));
  }
  o += S.path(S.roundedPath([[-56, 282], [76, 282], [76, 306], [-56, 306]], 10), outline(dim ? N.soleShade : N.sole));
  if (!back) o += S.path(`M${f(10 + toeShift - 40)} 284 A40 26 0 0 1 ${f(10 + toeShift + 40)} 284 Z`, outline(dim ? N.soleShade : N.sole, 6));
  return o;
}

function leg({ shade = true, dim = false, toeShift = 0, back = false } = {}) {
  const id = S.uid('nl');
  const d = P([[-38, -24], [40, -24], [58, 244], [-38, 244]]);
  let inner = S.path(P([[30, -24], [40, -24], [58, 244], [48, 244]]), { fill: N.red });
  if (shade) inner += S.rect(-80, -40, 200, 62, 0, { fill: N.pantsShade });
  if (dim) inner += S.rect(-80, -40, 200, 300, 0, { fill: '#000', opacity: 0.25 });
  let o = S.clipDef(id, S.path(d)) + S.path(d, { fill: N.pants }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
  return o + shoeFront(toeShift, back, dim);
}

function legSide({ shade = true, dim = false } = {}) {
  const id = S.uid('nls');
  const d = P([[-56, -24], [60, -24], [64, 240], [-60, 240]]);
  let inner = S.rect(-5, -30, 12, 280, 0, { fill: N.red });
  if (shade) inner += S.rect(-100, -40, 220, 62, 0, { fill: N.pantsShade });
  if (dim) inner += S.rect(-100, -40, 220, 300, 0, { fill: '#000', opacity: 0.28 });
  let o = S.clipDef(id, S.path(d)) + S.path(d, { fill: N.pants }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
  const red = dim ? N.redShade : N.red;
  o += S.path(S.roundedPath([[-128, 252], [-64, 212], [62, 210], [76, 290], [-136, 290]], 14), outline(red));
  o += S.path('M-82 226 L-58 248 M-96 236 L-72 258 M-110 246 L-86 266', lineOnly(5));
  o += S.path(P([[-24, 244], [40, 232], [50, 262], [-14, 270]]), { fill: N.black });
  o += S.path(S.roundedPath([[-142, 282], [82, 282], [82, 306], [-142, 306]], 10), outline(dim ? N.soleShade : N.sole));
  o += S.path('M-142 284 A42 28 0 0 1 -58 284 Z', outline(dim ? N.soleShade : N.sole, 6));
  return o;
}

function torso(t, shade, back) {
  const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
  const T = -533, B = -306, W = 98;
  const id = S.uid('nt');
  const d = S.roundedPath([[-W, T], [W, T], [W, B], [-W, B]], 18);
  const cx = dir * at * 30, k = 1 - 0.12 * at;
  let inner = '';
  if (!back) {
    inner += S.path(P([[cx - 34 * k, T - 10], [cx + 34 * k, T - 10], [cx, -452]]), { fill: N.black });
    inner += S.path(`M${f(cx - 34 * k)} ${T - 4} L${f(cx)} -452 L${f(cx + 34 * k)} ${T - 4}`, lineOnly(5));
    inner += S.path(`M${f(cx)} -452 L${f(cx)} ${B}`, lineOnly(5));
    inner += S.rect(cx + 2, -452, 12, 22, 3, outline('#C9CAD3', 3.5));
    // egg emblem
    const ex = cx - 56 * k, ey = -465;
    inner += S.path(`M${f(ex)} ${f(ey - 20)} C${f(ex + 16)} ${f(ey - 20)} ${f(ex + 18)} ${f(ey + 6)} ${f(ex + 14)} ${f(ey + 12)} C${f(ex + 8)} ${f(ey + 22)} ${f(ex - 8)} ${f(ey + 22)} ${f(ex - 14)} ${f(ey + 12)} C${f(ex - 18)} ${f(ey + 6)} ${f(ex - 16)} ${f(ey - 20)} ${f(ex)} ${f(ey - 20)} Z`, outline('#fff', 4.5));
    inner += S.path(`M${f(ex - 12)} ${f(ey)} L${f(ex - 4)} ${f(ey - 6)} L${f(ex + 2)} ${f(ey + 2)} L${f(ex + 12)} ${f(ey - 4)}`, lineOnly(4, N.red));
  } else {
    inner += S.circle(0, -430, 52, outline(N.black, 5));
    inner += S.path('M0 -470 C22 -470 26 -436 22 -424 C14 -404 -14 -404 -22 -424 C-26 -436 -22 -470 0 -470 Z', outline('#fff', 4.5));
    inner += S.path('M-18 -436 L-6 -444 L2 -432 L18 -442', lineOnly(4, N.red));
  }
  inner += S.rect(-W - 10, B - 26, 2 * W + 20, 30, 0, { fill: N.black });
  inner += S.path(`M${-W - 10} ${B - 26} L${W + 10} ${B - 26}`, lineOnly(5));
  if (shade) {
    inner += S.rect(-W - 10, T - 10, 2 * W + 20, 24, 0, { fill: N.redShade, opacity: 0.55 });
    if (at > 0.02) inner += S.rect(dir > 0 ? -W - 10 : W - 34 * at, T - 10, 34 * at + 10, B - T + 20, 0, { fill: '#000', opacity: 0.22 });
    inner += S.rect(-W - 10, B - 60, 2 * W + 20, 34, 0, { fill: '#000', opacity: 0.1 });
  }
  return S.clipDef(id, S.path(d)) + S.path(d, { fill: N.red }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
}

function torsoSide(shade) {
  const id = S.uid('nts');
  const d = S.roundedPath([[-60, -535], [66, -535], [66, -305], [-60, -305]], 16);
  let inner = S.path(P([[-70, -545], [-28, -545], [-70, -470]]), { fill: N.black });
  inner += S.path('M-58 -470 L-58 -306', lineOnly(5));
  inner += S.rect(-80, -331, 160, 30, 0, { fill: N.black }) + S.path('M-80 -331 L80 -331', lineOnly(5));
  if (shade) inner += S.rect(-80, -545, 160, 24, 0, { fill: N.redShade, opacity: 0.55 });
  return S.clipDef(id, S.path(d)) + S.path(d, { fill: N.red }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
}

// ---------------------------------------------------------------- design
const NOVA_DESIGN = {
  leg, legSide, arm, torso, torsoSide,
  head: headFront, headSide, headBack, under, over,
  dims: { hipX: 46, shoulderX: 98, nametagY: -1050 },
  defaults: { face: 'cool', armL: 8, armR: 8 },
};

// pose.tail is forwarded to the face so the ponytail hooks can read it
function drawNova(pose = {}) {
  const face = typeof pose.face === 'string' ? { name: pose.face } : { ...(pose.face || { name: 'cool' }) };
  if (pose.tail !== undefined) face.tail = pose.tail;
  return drawCharacter(NOVA_DESIGN, { ...pose, face });
}

module.exports = { drawNova, NOVA_DESIGN, NOVA_EXPR, resolveNovaFace, NOVA_COLORS: N, headFront, headSide, under };
