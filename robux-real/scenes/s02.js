// SC 02 · THE CHEAPEST KID — Ty's bedroom: intro, the "never bought" list, free samples, the AFK farm (2nd-grade
// flashback with the taped spacebar), the red-hot PC, 3,000,000 Robux, Mia and her 412 hats, Pickle through the window.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor, coin, bang } = K;
const { L } = K.V;
const C = K.C;
const A = require('./acting');
const { D } = require('../rig/cast');
const { makeDesign, makeDraw } = require('../rig/r6');

const l0 = L('02.0'), l1 = L('02.1'), l2 = L('02.2'), l3 = L('02.3'), l4 = L('02.4'), l5 = L('02.5'), l6 = L('02.6');
const l7 = L('02.7'), l8 = L('02.8'), l9 = L('02.9'), l10 = L('02.10'), l11 = L('02.11'), l12 = L('02.12');
const START = K.V.scene('SC 02').start;
const END = K.V.scene('SC 03').start;

// shot starts (all from the voice)
const tHi = START, tCheap = l0.word('And').t0 - 0.05;
const tWal = l1.a - 0.05, tList = l1.word('Not').t0 - 0.12;
const tAv = l2.a - 0.1, tLife = l2.word("It's").t0 - 0.15;
const tSamp = l3.a - 0.1, tWrap = l3.word('I', 1).t0 - 0.12, tRet = l3.word('I', 2).t0 - 0.1;
const tPlan = l4.a - 0.25, tFarm = l4.word('The').t0 - 0.12;
const tFb1 = l5.a - 0.1, tFb2 = l5.word('taped').t0 - 0.2, tFb3 = l5.word('and').t0 - 0.15;
const tLater = l6.a - 0.05, tHeat = l6.word('my').t0 - 0.15, tBal = l6.word('And').t0 - 0.12;
const tMia = l7.a - 0.08, tMia2 = l7.word('Can').t0 - 0.1, tMiaCard = l8.a - 0.04, tHats = l8.word('She').t0 - 0.12;
const tFash = l9.a - 0.08, tPick = l10.a - 0.1, tExt = l11.a - 0.08, tDoor = l11.word('He', 1).t0 - 0.12;
const tP12 = l12.a - 0.08, tShoe = l12.word("I'm").t0 - 0.12;
// whip-style cuts get a quick white flash; the rest are hard cuts
const CUTS = [tWal, tList, tAv, tSamp, tWrap, tRet, tFb1, tHeat, tMia, tHats, tFash, tPick, tExt, tP12];

// ---------------------------------------------------------------- small helpers
const camAt = (wx, wy, zoom = 1) => ({ zoom, x: wx - 960, y: wy - 540 });
const W = (s) => S.rect(-800, -600, 3520, 2280, 0, { fill: s });
function mix(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (sh) => Math.round(lerp((pa >> sh) & 255, (pb >> sh) & 255, clamp(k, 0, 1)));
  return '#' + ((1 << 24) + (ch(16) << 16) + (ch(8) << 8) + ch(0)).toString(16).slice(1);
}
const OUT = { stroke: '#151515', 'stroke-width': 10, 'paint-order': 'stroke', 'stroke-linejoin': 'round' };
const pop = (k) => ease.outBack(clamp(k, 0, 1));
// draw a red marker X over (x, y); k 0..1 draws the two strokes
function redX(x, y, r, k, col = '#E8243C') {
  if (k <= 0) return '';
  const a = clamp(k * 2, 0, 1), b = clamp(k * 2 - 1, 0, 1);
  const L1 = Math.hypot(2 * r, 2 * r);
  const st = (u) => ({ fill: 'none', stroke: col, 'stroke-width': r * 0.2, 'stroke-linecap': 'round', 'stroke-dasharray': `${f(L1)} ${f(L1)}`, 'stroke-dashoffset': f(L1 * (1 - u)) });
  return S.path(`M${f(x - r)} ${f(y - r)} L${f(x + r)} ${f(y + r)}`, st(a)) + (b > 0 ? S.path(`M${f(x + r)} ${f(y - r)} L${f(x - r)} ${f(y + r)}`, st(b)) : '');
}
// rubber stamp that slams in (k 0..1)
function stamp(txt, x, y, k, rot = -12, col = '#E8243C', size = 90, sub = '') {
  if (k <= 0) return '';
  const sc = lerp(2.4, 1, ease.out(clamp(k, 0, 1)));
  const w = txt.length * size * 0.62 + 80;
  let o = S.rect(-w / 2, -size * 0.95, w, size * 1.35 + (sub ? size * 0.5 : 0), 18, { fill: '#FFF8EC', stroke: col, 'stroke-width': 14 }) + S.rect(-w / 2 + 14, -size * 0.95 + 14, w - 28, size * 1.35 + (sub ? size * 0.5 : 0) - 28, 10, { fill: 'none', stroke: col, 'stroke-width': 4 });
  if (sub) o += TF(sub, 0, -size * 0.35, size * 0.38, col);
  o += T(txt, 0, sub ? size * 0.55 : size * 0.25, size, col);
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${f(sc)})`, { opacity: f(clamp(k * 3, 0, 1)) });
}
// freeze-frame character intro card
function introCard(name, sub, k, col, t, side = 1) {
  if (k <= 0) return '';
  const u = ease.out(clamp(k, 0, 1));
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: f(0.18 * u) });
  const band = S.path('M-200 0 L1200 0 L1050 260 L-200 260 Z', { fill: col, stroke: '#151515', 'stroke-width': 10 }) + S.path('M-200 250 L1056 250 L1030 290 L-200 290 Z', { fill: '#151515' });
  o += S.g(band, side > 0 ? `translate(${f(lerp(-1500, 0, u))} 620)` : `translate(${f(1920 + lerp(1500, 0, u))} 620) scale(-1 1)`);
  const tx = side > 0 ? 120 : 1800, anchor = side > 0 ? 'start' : 'end';
  o += S.g(T(name, 0, 0, 150, '#FFFFFF', { 'text-anchor': anchor, ...OUT, 'stroke-width': 16 }) + TF(sub, side > 0 ? 8 : -8, 70, 50, '#151515', { 'text-anchor': anchor }), `translate(${f(tx + side * lerp(-900, 0, u))} 790) rotate(${side > 0 ? -4 : 3})`);
  o += K.F.sparkle(side > 0 ? 920 : 1000, 680, 30 * bump(t * 3, 0, 1) + 10);
  return o;
}
function speech(x, y, w, h, inner, k, tailX = 0) {
  if (k <= 0) return '';
  const o = S.rect(-w / 2, -h, w, h, 40, ol('#FFFFFF', 7)) + S.path(`M${tailX - 30} -8 L${tailX} 50 L${tailX + 30} -8 Z`, ol('#FFFFFF', 7)) + S.rect(tailX - 34, -16, 68, 14, 0, { fill: '#FFFFFF' }) + inner;
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(pop(k))})`);
}
function thought(x, y, w, h, inner, k, tx, ty) {
  if (k <= 0) return '';
  let o = S.circle(tx, ty, 14, ol('#FFFFFF', 5)) + S.circle(lerp(tx, 0, 0.45), lerp(ty, h * 0.5, 0.45), 24, ol('#FFFFFF', 6));
  o += S.ellipse(0, 0, w / 2, h / 2, ol('#FFFFFF', 7)) + inner;
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(pop(k))})`);
}

// ---------------------------------------------------------------- cast variants (lip-synced like actor())
function actorD(drawFn, sp, t, pose = {}, act = {}) {
  const auto = K.V.perform(sp, t, { seed: 13 + (act.seed || 0), ...act });
  const p = { shade: true, shadow: true, ...auto, ...pose };
  if (pose.face && auto.face) {
    const fo = typeof pose.face === 'string' ? { name: pose.face } : { ...pose.face };
    if (auto.face.mouth && K.V.talking(sp, t) && fo.mouth === undefined) fo.mouth = auto.face.mouth;
    if (auto.face.blink && fo.blink === undefined) fo.blink = auto.face.blink;
    p.face = fo;
  }
  return drawFn(p);
}
const TY_STARTER = makeDraw(makeDesign({ ...D.ty.style, top: 'tee', sleeve: 'short', badge: null, col: { ...D.ty.style.col, top: '#A9B7C9', topShade: '#8E9DB2', sleeve: '#A9B7C9', cuff: '#8E9DB2' } }));
const TY_LITTLE = makeDraw(makeDesign({ ...D.ty.style, size: 0.72, top: 'tee', sleeve: 'short', badge: null, col: { ...D.ty.style.col, top: '#FF8A5B', topShade: '#E0663A', sleeve: '#FF8A5B', pants: '#4C7DFF', pantsShade: '#355FD6' } }));
// a cast member with an extra svg glued to the head (follows head bob/tilt)
function castIn(name, t, pose = {}, act = {}, head = '', headLayer = 'front') {
  const sp = name.toUpperCase();
  const auto = K.V.perform(sp, t, { seed: name.length * 3.7 + (act.seed || 0), ...act });
  const p = { ...auto, ...pose };
  const props = [...(pose.props || [])];
  if (head) props.push({ svg: S.g(head, `translate(0 ${f(p.headY || 0)}) rotate(${f(p.headRot || 0)} 0 -560)`), layer: headLayer });
  return actor(name, t, { ...pose, props }, act);
}

// ---------------------------------------------------------------- hats (origin = brim bottom centre)
const HAT = {
  top: [150, () => S.rect(-66, -150, 132, 136, 10, ol('#24242C')) + S.rect(-66, -52, 132, 26, 0, ol('#E8243C', 4)) + S.ellipse(0, -8, 104, 18, ol('#24242C')) + S.path('M-48 -136 L-48 -70', ln(8, '#FFFFFF', 0.25))],
  cowboy: [96, () => S.path('M-62 -22 Q-60 -96 -18 -92 Q0 -70 18 -92 Q60 -96 62 -22 Z', ol('#C08A52')) + S.rect(-62, -40, 124, 18, 4, ol('#6A3E1E', 4)) + S.path('M-128 -40 Q-120 2 0 -6 Q120 2 128 -40 Q70 -12 0 -16 Q-70 -12 -128 -40 Z', ol('#A8723E'))],
  crown: [90, () => S.path('M-74 0 L-78 -70 L-42 -36 L-20 -90 L0 -44 L20 -90 L42 -36 L78 -70 L74 0 Z', ol('#FFD21F')) + S.circle(0, -20, 12, ol('#E8243C', 4)) + S.circle(-44, -18, 9, ol('#34C3FF', 4)) + S.circle(44, -18, 9, ol('#3BD16F', 4))],
  party: [160, () => S.path('M-62 0 L0 -150 L62 0 Z', ol('#FF6FB5')) + S.path('M-40 -50 L30 -74 M-24 -96 L18 -112 M-52 -22 L46 -46', ln(10, '#FFE14D')) + S.circle(0, -156, 18, ol('#34C3FF', 5))],
  propeller: [110, () => S.path('M-74 0 Q-74 -80 0 -80 Q74 -80 74 0 Z', ol('#34C3FF')) + S.path('M-74 0 Q-40 -76 0 -80 L0 0 Z', { fill: '#FF5A5A' }) + S.path('M-74 0 Q-74 -80 0 -80 Q74 -80 74 0 Z', ln(6)) + S.rect(-5, -104, 10, 26, 3, ol('#FFD21F', 4)) + S.ellipse(0, -106, 66, 12, ol('#FFD21F', 5))],
  chef: [150, () => S.circle(-40, -110, 42, ol('#FFFFFF')) + S.circle(40, -110, 42, ol('#FFFFFF')) + S.circle(0, -130, 48, ol('#FFFFFF')) + S.rect(-56, -84, 112, 84, 10, ol('#FFFFFF'))],
  witch: [190, () => S.path('M-50 -14 Q-10 -110 30 -186 Q20 -100 56 -14 Z', ol('#7C4DD8')) + S.rect(-50, -40, 104, 22, 4, ol('#3BD16F', 4)) + S.ellipse(0, -10, 118, 20, ol('#5E35B1'))],
  cone: [150, () => S.path('M-50 -10 L-12 -150 L12 -150 L50 -10 Z', ol('#FF7A1A')) + S.path('M-36 -60 L36 -60 L30 -84 L-30 -84 Z', { fill: '#FFFFFF' }) + S.rect(-80, -14, 160, 22, 6, ol('#FF7A1A'))],
  viking: [100, () => S.path('M-76 0 Q-76 -96 0 -96 Q76 -96 76 0 Z', ol('#B9C2D0')) + S.rect(-80, -22, 160, 22, 6, ol('#8A93A6', 5)) + S.path('M-72 -40 Q-130 -60 -116 -130 Q-100 -80 -62 -70 Z M72 -40 Q130 -60 116 -130 Q100 -80 62 -70 Z', ol('#FFF4D6', 5))],
  pirate: [90, () => S.path('M-110 -10 Q-80 -96 0 -90 Q80 -96 110 -10 Q0 -36 -110 -10 Z', ol('#2A2A33')) + S.circle(0, -52, 14, ol('#FFFFFF', 4)) + S.path('M-16 -30 L16 -40 M-16 -40 L16 -30', ln(5, '#FFFFFF'))],
  sombrero: [100, () => S.ellipse(0, -10, 150, 26, ol('#F2C14E')) + S.path('M-52 -20 Q-46 -100 0 -100 Q46 -100 52 -20 Z', ol('#F2C14E')) + S.path('M-50 -36 L50 -36', ln(10, '#E8243C'))],
};
const HAT_KEYS = Object.keys(HAT);
const hat = (kind, x, y, s = 1, rot = 0) => S.g(HAT[kind][1](), `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
// stacked hats on a head (body space); grow 0..1 extra growth, wob = wobble amount
function hatStack(kinds, t, wob = 1, base = -930, s = 1.25) {
  let o = '', y = base;
  kinds.forEach((k, i) => {
    const sway = Math.sin(t * 3 + i * 0.7) * wob * i * 1.6;
    o += S.g(hat(k, 0, 0, s), `translate(${f(sway * 4)} ${f(y)}) rotate(${f(sway)})`);
    y -= HAT[k][0] * s * 0.82;
  });
  return o;
}

// ---------------------------------------------------------------- DEFS
const DEFS = `<defs>
<linearGradient id="s02wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A5AC8"/><stop offset="1" stop-color="#7E7BE2"/></linearGradient>
<linearGradient id="s02sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FC4FF"/><stop offset="0.55" stop-color="#FFC4DA"/><stop offset="1" stop-color="#FFE6A0"/></linearGradient>
<linearGradient id="s02beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF2C0" stop-opacity="0.5"/><stop offset="1" stop-color="#FFF2C0" stop-opacity="0"/></linearGradient>
<radialGradient id="s02heat"><stop offset="0" stop-color="#FF7A2A" stop-opacity="0.85"/><stop offset="0.45" stop-color="#FF4A1A" stop-opacity="0.35"/><stop offset="1" stop-color="#FF3A1A" stop-opacity="0"/></radialGradient>
<radialGradient id="s02glow"><stop offset="0" stop-color="#9FF0FF" stop-opacity="0.75"/><stop offset="1" stop-color="#9FF0FF" stop-opacity="0"/></radialGradient>
<radialGradient id="s02spot" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF6D0" stop-opacity="0.7"/><stop offset="1" stop-color="#FFF6D0" stop-opacity="0"/></radialGradient>
<radialGradient id="s02torch" cx="0.5" cy="1" r="1"><stop offset="0" stop-color="#FFE9A0" stop-opacity="0.75"/><stop offset="1" stop-color="#FFE9A0" stop-opacity="0"/></radialGradient>
<radialGradient id="s02sepiaV" cx="0.5" cy="0.5" r="0.72"><stop offset="0.55" stop-color="#3A2410" stop-opacity="0"/><stop offset="1" stop-color="#3A2410" stop-opacity="0.75"/></radialGradient>
<pattern id="s02floor" width="300" height="60" patternUnits="userSpaceOnUse"><rect width="300" height="60" fill="#C99262"/><rect y="0" width="300" height="5" fill="#A8703F"/><rect x="0" y="30" width="300" height="30" fill="#C18A5A"/><rect x="0" y="28" width="300" height="4" fill="#A8703F"/><rect x="120" y="0" width="5" height="30" fill="#A8703F"/><rect x="240" y="30" width="5" height="30" fill="#A8703F"/></pattern>
<pattern id="s02pink" width="80" height="80" patternUnits="userSpaceOnUse"><rect width="80" height="80" fill="#F7A8CF"/><circle cx="20" cy="20" r="7" fill="#FFFFFF" opacity="0.45"/><circle cx="60" cy="60" r="7" fill="#FFFFFF" opacity="0.45"/></pattern>
<pattern id="s02grid" width="90" height="90" patternUnits="userSpaceOnUse"><rect width="90" height="90" fill="none" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="4"/></pattern>
<pattern id="s02tiles" width="160" height="80" patternUnits="userSpaceOnUse"><rect width="160" height="80" fill="#EAF4F4"/><rect width="80" height="40" fill="#D3E9EA"/><rect x="80" y="40" width="80" height="40" fill="#D3E9EA"/></pattern>
<pattern id="s02brick" width="120" height="60" patternUnits="userSpaceOnUse"><rect width="120" height="60" fill="#9BD86A"/><rect x="2" y="2" width="56" height="26" rx="4" fill="#AEE27E"/><rect x="62" y="2" width="56" height="26" rx="4" fill="#AEE27E"/><rect x="-28" y="32" width="56" height="26" rx="4" fill="#AEE27E"/><rect x="32" y="32" width="56" height="26" rx="4" fill="#AEE27E"/><rect x="92" y="32" width="56" height="26" rx="4" fill="#AEE27E"/></pattern>
<pattern id="s02siding" width="100" height="44" patternUnits="userSpaceOnUse"><rect width="100" height="44" fill="#FFD27A"/><rect y="38" width="100" height="6" fill="#E8B456"/></pattern>
</defs>`;

// ---------------------------------------------------------------- Ty's bedroom (world space; wide shot = cam x 0)
const STARS = (() => {
  let o = '';
  for (let i = 0; i < 46; i++) {
    const x = -600 + hash(i * 3.7) * 3100, y = -360 + hash(i * 9.1) * 700;
    if ((x > 860 && x < 1280 && y > 100) || (x > 560 && x < 860 && y > 70 && y < 410) || (x > 1310 && x < 1560 && y > 90 && y < 390) || (x > 1990 && x < 2370 && y > 200) || (x > 40 && x < 700 && y > 260)) continue;
    o += S.path(K.F.starPath(x, y, 12 + hash(i) * 10, undefined, 5, -90 + hash(i * 2) * 40), { fill: '#FFF3A6', opacity: 0.75, stroke: '#4646A8', 'stroke-width': 3 });
  }
  return o;
})();
function bedWindow(t, o = {}) {
  let w = S.rect(878, 128, 384, 454, 18, ol('#F4F1FF', 8));
  const id = S.uid('bw');
  let sky = S.rect(900, 150, 340, 410, 0, { fill: o.night ? '#1A1650' : 'url(#s02sky)' });
  if (!o.night) {
    sky += S.circle(1150, 470, 70, { fill: '#FFF6C8' }) + S.circle(1150, 470, 110, { fill: '#FFF6C8', opacity: 0.35 });
    for (const [cx, cy, s] of [[960, 220, 0.8], [1180, 290, 0.6]]) {
      const x = 880 + ((cx - 880 + t * 12) % 420);
      sky += S.g(S.ellipse(0, 0, 70, 20, { fill: '#FFFFFF', opacity: 0.9 }) + S.ellipse(-24, -14, 34, 20, { fill: '#FFFFFF', opacity: 0.9 }) + S.ellipse(20, -16, 40, 24, { fill: '#FFFFFF', opacity: 0.9 }), `translate(${f(x)} ${cy}) scale(${s})`);
    }
  } else {
    for (let i = 0; i < 14; i++) sky += S.circle(910 + hash(i * 5) * 320, 160 + hash(i * 7) * 260, 3, { fill: '#FFFFFF', opacity: 0.8 });
  }
  // the neighbour's (Pickle's) lime house across the yard
  sky += S.rect(1110, 360, 200, 260, 0, ol('#9BD86A', 5)) + S.path('M1090 370 L1210 290 L1330 370 Z', ol('#E8604A', 5)) + S.rect(1150, 410, 70, 70, 6, ol('#BFF0FF', 5));
  sky += S.ellipse(960, 560, 120, 70, { fill: '#5FBF6A' }) + S.ellipse(1020, 530, 70, 60, { fill: '#6FD07A' });
  w += S.clipDef(id, S.rect(900, 150, 340, 410, 6)) + S.g(sky, null, { 'clip-path': `url(#${id})` });
  if (!o.open) w += S.path('M1070 150 L1070 560 M900 355 L1240 355', ln(12, '#F4F1FF')) + S.path('M930 180 L990 180 L930 260 Z', { fill: '#FFFFFF', opacity: 0.3 });
  w += S.rect(900, 150, 340, 410, 6, ln(6));
  w += S.rect(860, 572, 420, 30, 8, ol('#F4F1FF', 6));
  // curtains
  const sway = Math.sin(t * 1.2) * 5;
  w += S.rect(840, 104, 460, 14, 7, ol('#8A5A33', 5));
  for (const [cx, dir] of [[858, 1], [1282, -1]]) w += S.path(`M${cx - 36} 112 L${cx + 36} 112 L${cx + 36 + dir * sway} 640 Q${cx} 656 ${cx - 36 + dir * sway} 640 Z`, ol('#FFC83D', 6)) + S.path(`M${cx - 10} 120 L${cx - 10 + dir * sway} 636`, ln(4, '#E8A21A'));
  return w;
}
function poster(x, y, rot, kind) {
  let p = '';
  if (kind === 'save') {
    p = S.rect(0, 0, 220, 290, 10, ol('#FFE14D', 6)) + S.rect(12, 12, 196, 266, 6, { fill: '#FFF3A8' });
    p += S.ellipse(110, 140, 70, 54, ol('#FF9EC4', 6)) + S.circle(172, 132, 22, ol('#FF9EC4', 5)) + S.circle(178, 128, 4, { fill: '#151515' }) + S.rect(96, 88, 30, 8, 3, { fill: '#151515' });
    p += S.path('M70 186 L70 204 M150 186 L150 204', ln(14, '#151515')) + S.path('M60 110 L48 92 L74 100', ol('#FF9EC4', 5));
    p += coin(110, 64, 22, 0, 0) + T('SAVE IT!', 110, 250, 46, '#E8243C', { stroke: '#151515', 'stroke-width': 6, 'paint-order': 'stroke' });
  } else if (kind === 'obby') {
    p = S.rect(0, 0, 200, 260, 10, ol('#2E7BFF', 6)) + S.rect(12, 12, 176, 236, 6, { fill: '#7FD0FF' });
    for (const [bx, by, c] of [[24, 180, '#FF5A5A'], [80, 140, '#FFD21F'], [130, 100, '#3BD16F'], [70, 66, '#B06BFF']]) p += S.rect(bx, by, 50, 20, 6, ol(c, 4));
    p += T('OBBY', 100, 236, 46, '#FFFFFF', { stroke: '#151515', 'stroke-width': 6, 'paint-order': 'stroke' });
  } else if (kind === 'dino') {
    p = S.rect(0, 0, 220, 290, 10, ol('#3BD16F', 6)) + S.rect(12, 12, 196, 266, 6, { fill: '#BFF5B0' });
    p += S.path('M40 200 Q50 120 110 120 L130 70 Q170 60 180 90 Q182 110 150 112 L146 160 Q170 190 160 210 Z', ol('#3FAE5A', 6)) + S.circle(160, 86, 5, { fill: '#151515' });
    p += T('RAWR!', 110, 256, 50, '#FF7A1A', { stroke: '#151515', 'stroke-width': 6, 'paint-order': 'stroke' });
  }
  p += S.rect(90, -10, 40, 20, 3, { fill: '#FFFFFF', opacity: 0.75 });
  return S.g(p, `translate(${x} ${y}) rotate(${rot})`);
}
// beige CRT monitor; origin bottom centre on the desk; screen = svg in a 300x220 box centred on (0,0)
function crt(x, y, s, t, heat, screen, opts = {}) {
  const hot = heat * (0.8 + 0.2 * Math.sin(t * 9));
  const body = mix('#E9DFC3', '#FF6A3A', hot), shade = mix('#CFC2A0', '#D8401E', hot);
  let o = '';
  o += S.path('M-60 0 L-80 -26 L80 -26 L60 0 Z', ol(shade, 6));
  o += S.rect(-150, -330, 300, 250, 40, ol(shade, 6)); // back hump
  o += S.rect(-195, -320, 390, 300, 34, ol(body, 7));
  o += S.rect(-195, -60, 390, 40, 0, { fill: shade, opacity: 0.6 }) + S.rect(-195, -320, 390, 300, 34, ln(7));
  const id = S.uid('crt');
  o += S.rect(-166, -300, 332, 236, 30, ol('#1A1D2A', 6));
  o += S.clipDef(id, S.rect(-156, -290, 312, 216, 26)) + S.g(S.rect(-160, -300, 320, 240, 0, { fill: opts.off ? '#141820' : '#0F2140' }) + (opts.off ? '' : S.g(screen || '', 'translate(0 -182)')), null, { 'clip-path': `url(#${id})` });
  o += S.path('M-140 -276 Q-100 -290 -40 -286', ln(8, '#FFFFFF', 0.25));
  o += S.circle(160, -42, 7, { fill: opts.off ? '#555' : '#3BFF6A', stroke: '#151515', 'stroke-width': 3 }) + TF(opts.brand || 'BEIGEMAX 98', -100, -32, 20, '#8A7A5A');
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function tower(x, y, s, t, heat, sticker = true) {
  const hot = heat * (0.8 + 0.2 * Math.sin(t * 8 + 1));
  const body = mix('#E9DFC3', '#FF6A3A', hot), shade = mix('#CFC2A0', '#D8401E', hot);
  let o = S.rect(-80, -300, 160, 300, 16, ol(body, 7)) + S.rect(40, -300, 40, 300, 0, { fill: shade, opacity: 0.5 }) + S.rect(-80, -300, 160, 300, 16, ln(7));
  o += S.rect(-60, -270, 120, 30, 6, ol(shade, 4)) + S.rect(-60, -226, 120, 14, 4, ol('#1A1D2A', 4)) + S.circle(0, -150, 18, ol(shade, 5)) + S.circle(0, -150, 6, { fill: heat > 0.2 ? '#FF3B3B' : '#3BFF6A' });
  for (let i = 0; i < 4; i++) o += S.path(`M-50 ${-90 + i * 16} L50 ${-90 + i * 16}`, ln(5, shade));
  if (sticker) o += S.g(S.rect(-56, -16, 112, 32, 4, { fill: '#FFF6A0', stroke: '#151515', 'stroke-width': 3 }) + TF("DON'T TURN OFF", 0, 6, 15, '#E8243C'), 'translate(0 -190) rotate(-6)');
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function keyboard(x, y, s, tape = 1) {
  let o = S.path('M-130 0 L130 0 L118 -26 L-118 -26 Z', ol('#E2D7B8', 5));
  for (let i = 0; i < 9; i++) o += S.rect(-108 + i * 24, -21, 16, 7, 2, { fill: '#CFC2A0' });
  o += S.rect(-50, -11, 100, 8, 3, { fill: '#CFC2A0' });
  if (tape > 0) o += S.rect(-60, -14, 120 * tape, 12, 2, { fill: '#B9C2D0', stroke: '#151515', 'stroke-width': 2 });
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function friedEgg(x, y, s, t, heat) {
  let o = S.path('M-60 0 Q-70 -16 -40 -18 Q-30 -34 0 -26 Q30 -36 46 -18 Q72 -14 62 0 Z', ol('#FFFFFF', 5)) + S.ellipse(0, -14, 20, 12, ol('#FFC21F', 4)) + S.ellipse(-6, -18, 6, 3, { fill: '#FFFFFF', opacity: 0.8 });
  if (heat > 0.3) for (let i = 0; i < 4; i++) {
    const ph = (t * 2.5 + i * 0.25) % 1;
    o += S.circle(-44 + i * 28 + Math.sin(t * 9 + i) * 4, -20 - ph * 40, 4 + ph * 3, { fill: '#FFFFFF', opacity: f(0.8 * (1 - ph)) });
  }
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
// orange tabby, sitting, facing left, paws stretched toward the heat
function cat(x, y, s, t, warm = 1) {
  const st = Math.sin(t * 2) * 6;
  let o = S.path(`M40 -10 Q${90 + st} -20 ${84 + st} -90 Q${80 + st} -110 ${70 + st} -96`, ln(16, '#151515')) + S.path(`M40 -10 Q${90 + st} -20 ${84 + st} -90 Q${80 + st} -110 ${70 + st} -96`, ln(8, '#F29A3A'));
  o += S.ellipse(20, -40, 56, 44, ol('#F29A3A', 6)) + S.path('M0 -70 Q10 -50 4 -30 M26 -78 Q34 -56 28 -36', ln(5, '#C8701E'));
  o += S.rect(-70 - 10 * warm, -24, 70 + 10 * warm, 18, 9, ol('#F29A3A', 5)) + S.rect(-60 - 10 * warm, -10, 60 + 10 * warm, 16, 8, ol('#F29A3A', 5));
  o += S.g(S.circle(0, 0, 36, ol('#F29A3A', 6)) + S.path('M-30 -18 L-30 -50 L-8 -30 Z M10 -32 L26 -52 L30 -18 Z', ol('#F29A3A', 5)) + S.path('M-22 -4 Q-16 -10 -10 -4 M2 -4 Q8 -10 14 -4', ln(4)) + S.path('M-8 8 Q-4 13 0 8', ln(3)) + S.ellipse(-24, 10, 7, 4, { fill: '#FF8FA3', opacity: 0.7 }), 'translate(-26 -86)');
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function heatWaves(x, y, w, t, k = 1, n = 5) {
  if (k <= 0) return '';
  let o = '';
  for (let i = 0; i < n; i++) {
    const ph = (t * 0.9 + i / n) % 1;
    const x0 = x - w / 2 + (i + 0.5) * (w / n), y0 = y - ph * 200;
    let d = `M${f(x0)} ${f(y0)}`;
    for (let j = 1; j <= 6; j++) d += ` L${f(x0 + Math.sin(t * 6 + j + i) * 10)} ${f(y0 - j * 18)}`;
    o += S.path(d, ln(6, '#FFFFFF', 0.45 * k * Math.sin(ph * Math.PI)));
  }
  return o;
}
// the clicker / AFK-farm game on the CRT (screen coords: 300x220 centred on 0,0)
function farmScreen(t, bal, opts = {}) {
  let o = S.rect(-160, -120, 320, 240, 0, { fill: opts.bg || '#173A7A' });
  o += S.rect(-160, -120, 320, 34, 0, { fill: '#0D2350' }) + TF(opts.title || 'COIN CLICKER', 0, -95, 20, '#FFE14D');
  const pulse = 1 + 0.08 * Math.abs(Math.sin(t * 14));
  o += S.g(coin(0, 0, 50, 0, 0), `scale(${f(pulse)})`);
  for (let i = 0; i < 4; i++) {
    const ph = (t * 1.6 + i / 4) % 1;
    o += T('+1', -90 + i * 60, 40 - ph * 90, 26, '#3BFF6A', { opacity: f(1 - ph), stroke: '#151515', 'stroke-width': 4, 'paint-order': 'stroke' });
  }
  if (bal !== undefined) o += K.robuxText(0, 98, Math.round(bal).toLocaleString('en-US'), 26, '#FFFFFF');
  return o;
}
function desk(t, o = {}) {
  let d = '';
  d += S.rect(70, 634, 200, 206, 8, ol('#B57A4E', 6)) + S.rect(90, 660, 160, 70, 6, ol('#C98A5B', 5)) + S.rect(90, 748, 160, 70, 6, ol('#C98A5B', 5)) + S.rect(150, 688, 40, 12, 6, ol('#FFD34D', 3)) + S.rect(150, 776, 40, 12, 6, ol('#FFD34D', 3));
  d += S.rect(700, 634, 40, 206, 6, ol('#B57A4E', 6));
  d += S.rect(40, 598, 740, 40, 10, ol('#D9945A', 7));
  return d;
}
function chair(x, y, s) {
  let o = S.path('M0 0 L0 -90', ln(16)) + S.path('M-70 20 L70 20 M0 0 L0 20', ln(12));
  o += S.circle(-70, 26, 12, ol('#333', 4)) + S.circle(70, 26, 12, ol('#333', 4)) + S.circle(0, 26, 12, ol('#333', 4));
  o += S.rect(-90, -120, 180, 36, 16, ol('#E8604A', 6)) + S.rect(-80, -330, 160, 200, 40, ol('#E8604A', 6)) + S.path('M0 -130 L0 -110', ln(12));
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function bed(t) {
  let b = S.rect(1830, 500, 70, 360, 26, ol('#8A5A3A', 7)) + S.rect(1290, 640, 56, 220, 20, ol('#8A5A3A', 7));
  b += S.rect(1320, 730, 540, 110, 12, ol('#8A5A3A', 6));
  b += S.rect(1320, 680, 530, 70, 20, ol('#FFFFFF', 6));
  b += S.rect(1690, 626, 150, 70, 30, ol('#FFFFFF', 6)) + S.path('M1710 640 Q1760 660 1820 640', ln(4, '#D7DCE6'));
  b += S.path('M1310 674 L1700 674 Q1720 700 1700 720 L1700 840 Q1500 858 1310 840 Z', ol('#22B5A8', 7));
  b += S.path('M1640 676 Q1700 680 1708 720', ln(5, '#168F85')) + S.path('M1360 760 Q1500 790 1660 760 M1380 810 Q1500 830 1640 810', ln(4, '#168F85'));
  for (let i = 0; i < 4; i++) b += S.rect(1360 + i * 90, 700, 40, 40, 8, { fill: '#8FE8DF', opacity: 0.35 });
  return b;
}
function shelf() {
  let o = S.rect(1580, 410, 300, 20, 6, ol('#B57A4E', 5));
  o += S.ellipse(1650, 372, 50, 38, ol('#FF9EC4', 5)) + S.circle(1696, 364, 16, ol('#FF9EC4', 4)) + S.rect(1636, 334, 26, 6, 3, { fill: '#151515' }) + S.circle(1700, 360, 3, { fill: '#151515' });
  o += S.rect(1740, 330, 70, 80, 14, ol('#BFF0FF', 5)) + coin(1760, 380, 14, 0, 0) + coin(1786, 370, 14, 20, 0) + coin(1772, 352, 14, 10, 0) + S.rect(1736, 318, 78, 18, 6, ol('#E8604A', 4));
  o += S.rect(1838, 380, 30, 30, 4, ol('#FFD21F', 4)) + S.path('M1832 350 Q1853 400 1874 350 Z', ol('#FFD21F', 4));
  return o;
}
function door(open = 0, opts = {}) {
  let o = S.rect(2010, 220, 340, 630, 10, ol('#F4F1FF', 8));
  o += S.rect(2032, 242, 296, 600, 6, { fill: '#2E2660' }) + S.rect(2032, 242, 296, 600, 6, { fill: '#FFE9A8', opacity: 0.18 });
  if (open < 1) {
    const w = 296 * (1 - open * 0.82);
    o += S.rect(2032, 242, w, 600, 6, ol('#C98A5B', 6)) + S.rect(2032 + w * 0.12, 280, w * 0.76, 220, 10, ol('#D9A06A', 4)) + S.rect(2032 + w * 0.12, 540, w * 0.76, 260, 10, ol('#D9A06A', 4));
    o += S.circle(2032 + w - 30, 560, 14, ol('#FFD34D', 4));
    if (open < 0.3 && !opts.noSign) o += S.g(S.rect(-100, -40, 200, 80, 10, ol('#FFFFFF', 5)) + TF('NO SPENDING', 0, -6, 24, '#E8243C') + TF('ZONE', 0, 24, 26, '#151515'), `translate(${2032 + w / 2} 400) rotate(-3)`);
  }
  o += S.rect(2380, 560, 34, 56, 6, ol('#F4F1FF', 4)) + S.rect(2390, 574, 14, 20, 3, { fill: '#C9C4E8' });
  return o;
}
// everything on the back wall + floor + furniture
function bedroom(t, o = {}) {
  const heat = o.heat ?? 1, fb = !!o.fb;
  let b = S.rect(-800, -600, 3600, 1440, 0, { fill: 'url(#s02wall)' });
  for (let x = -760; x < 2800; x += 160) b += S.rect(x, -600, 8, 1420, 0, { fill: '#FFFFFF', opacity: 0.05 });
  b += STARS;
  b += bedWindow(t, o);
  b += poster(fb ? 590 : 590, 90, -3, fb ? 'dino' : 'save') + poster(1340, 110, 4, 'obby');
  b += shelf();
  b += door(o.door || 0, o);
  b += S.rect(-800, 812, 3600, 30, 0, ol('#4846A8', 5));
  b += S.rect(-800, 840, 3600, 900, 0, { fill: 'url(#s02floor)' });
  if (!o.dark) b += S.path('M900 600 L1240 600 L1500 1120 L760 1120 Z', { fill: 'url(#s02beam)', opacity: 0.55 });
  b += S.ellipse(1060, 1000, 540, 96, ol('#FF9EC4', 6)) + S.ellipse(1060, 1000, 440, 70, { fill: 'none', stroke: '#FFD1E3', 'stroke-width': 10 });
  // desk + PC
  b += desk(t, o);
  if (heat > 0) b += S.ellipse(400, 430, 520 * heat, 380 * heat, { fill: 'url(#s02heat)', opacity: f(0.9 * heat) });
  b += tower(170, 600, 1, t, heat, !fb);
  b += crt(470, 600, 1, t, heat, o.screen !== undefined ? o.screen : farmScreen(t, o.bal), o);
  b += keyboard(470, 622, 1, fb ? 0 : 1);
  if (!fb) {
    b += friedEgg(480, 282, 1, t, heat);
    b += cat(720, 598, 0.9, t, 1);
    b += heatWaves(470, 260, 360, t, heat) + heatWaves(170, 290, 140, t + 0.4, heat, 3);
  }
  b += bed(t);
  if (o.chair !== false) b += chair(o.chairX ?? 860, 880, 0.9);
  return b;
}
function darkRoom(k, glows = []) {
  if (k <= 0) return '';
  let o = S.rect(-800, -600, 3600, 2400, 0, { fill: '#0B0824', opacity: f(0.78 * k) });
  for (const [x, y, r, col] of glows) o += S.ellipse(x, y, r, r * 0.8, { fill: col || 'url(#s02glow)', opacity: f(k) });
  return o;
}

// ---------------------------------------------------------------- shots
const TY_X = 1000, TY_Y = 1010;

function shotHi(t) {
  // wide morning bedroom; Ty bounces into frame and waves
  const cam = camKeys(t, [[tHi, camAt(980, 560, 1.12)], [l0.word('twelve').t0, camAt(980, 600, 1.0)], [tCheap, camAt(990, 620, 1.04)]]);
  let w = bedroom(t, {});
  const jin = seg(t, tHi, tHi + 0.35);
  const y = lerp(1500, TY_Y, ease.outBack(jin));
  const land = bump(t, tHi + 0.3, tHi + 0.5);
  const wave = t < l0.word('twelve').t0 ? 1 : 0;
  const pose = { s: 0.55, sy: 1 - 0.12 * land, sx: 1 + 0.12 * land, face: { name: 'happy' } };
  if (wave) Object.assign(pose, { armR: 150 + 20 * Math.sin(t * 16), armL: 12 });
  w += actor('ty', t, { x: TY_X, y, ...pose });
  // name tag + age badge
  const kn = seg(t, l0.word('Ty').t0, l0.word('Ty').t0 + 0.25);
  if (kn > 0) w += S.g(S.rect(-120, -46, 240, 92, 26, ol('#1FB5A8', 7)) + T('TY', 0, 26, 76, '#FFFFFF', OUT), `translate(${TY_X - 330} 420) rotate(-6) scale(${f(pop(kn))})`);
  const ka = seg(t, l0.word('twelve').t0, l0.word('twelve').t0 + 0.25);
  if (ka > 0) w += S.g(S.circle(0, 0, 80, ol('#FFD21F', 7)) + T('12', 0, 24, 80, '#151515') + TF('YRS', 0, 58, 22, '#151515'), `translate(${TY_X + 330} 430) rotate(${f(8 + 6 * Math.sin(t * 5))}) scale(${f(pop(ka))})`);
  let o = view(cam, w);
  o += C.whiteFlash(1 - seg(t, START, START + 0.4));
  return o;
}

function shotCheap(t) {
  // push-in; smash-zoom + CHEAPSKATE stamp on "cheapest"
  const tw = l0.word('cheapest').t0;
  const cam = t < tw ? camKeys(t, [[tCheap, camAt(1000, 640, 1.5)], [tw, camAt(1000, 650, 1.7)]]) : camKeys(t, [[tw, camAt(1000, 640, 2.3)], [tw + 0.25, camAt(1000, 660, 2.0)], [tWal, camAt(1010, 660, 2.1)]]);
  const sh = K.shake(t, tw, 0.35, 16);
  cam.sx = sh.sx; cam.sy = sh.sy;
  let w = bedroom(t, {});
  const lean = bump(t, l0.word('meet').t0 - 0.3, tWal + 0.4);
  w += actor('ty', t, { x: TY_X, y: TY_Y, s: 0.55, armL: -35, armR: -35, face: { name: 'smug' }, lean: -4 * lean, headRot: 6 * lean });
  let o = view(cam, w);
  o += stamp('CHEAPSKATE', 1420, 330, seg(t, tw + 0.05, tw + 0.25), -12, '#E8243C', 110, 'CERTIFIED 100%');
  o += K.sparkles([[520, 260, 30], [1640, 620, 22]], t).repeat(t > tw ? 1 : 0);
  return o;
}

function wallet(open, t) {
  // chained, padlocked wallet (body space, held at the right hand)
  let o = S.rect(-60, -46, 120, 92, 16, ol('#7A4A2A', 6)) + S.path('M-60 -10 L60 -10', ln(4, '#5A341A'));
  if (open > 0) o += S.g(S.rect(-60, -46, 120, 92, 16, ol('#94603A', 6)), `translate(0 -46) scale(1 ${f(-open)}) translate(0 46)`);
  const lk = open > 0 ? -30 * open : 0;
  o += S.g(S.path('M-18 0 L-18 -26 Q0 -48 18 -26 L18 0', ln(8, '#B9C2D0')), `translate(0 ${f(-30 + lk)})`) + S.rect(-26, -30, 52, 44, 8, ol('#FFD21F', 5)) + S.circle(0, -12, 6, { fill: '#151515' });
  return o;
}
function shotWallet(t) {
  // Ty near the bed pulls out his chained, padlocked wallet; a moth flies out
  const tOpen = l1.word('single').t0;
  const cam = camKeys(t, [[tWal, camAt(1440, 660, 1.75)], [tList, camAt(1460, 640, 1.9)]]);
  let w = bedroom(t, {});
  const hx = 1450;
  const open = ease.outBack(seg(t, tOpen, tOpen + 0.3));
  const [hxB, hyB] = A.hand(62, 1);
  const chain = S.path(`M60 -330 Q${f(hxB * 0.6)} -200 ${f(hxB - 20)} ${f(hyB + 30)}`, { fill: 'none', stroke: '#B9C2D0', 'stroke-width': 10, 'stroke-dasharray': '14 8' });
  const props = [{ svg: chain + S.g(wallet(open, t), `translate(${f(hxB + 10)} ${f(hyB - 70)}) rotate(-8) scale(1.9)`), layer: 'front' }];
  w += actor('ty', t, { x: hx, y: TY_Y, s: 0.55, armR: 62, armL: 10, face: open > 0.5 ? { name: 'smug' } : { name: 'determined' }, props });
  // moth + dust
  const mk = t - tOpen - 0.1;
  if (mk > 0) {
    const mx = hx + (hxB + 10) * 0.55 + mk * 200, my = TY_Y + (hyB - 160) * 0.55 - mk * 160 + Math.sin(mk * 10) * 30;
    const fl = Math.abs(Math.sin(mk * 30));
    w += S.g(S.ellipse(-26, 0, 34, 22 * fl + 4, ol('#D9CFB8', 4)) + S.ellipse(26, 0, 34, 22 * fl + 4, ol('#D9CFB8', 4)) + S.ellipse(0, 0, 9, 20, ol('#8A7A5A', 3)) + S.circle(-4, -16, 3, { fill: '#151515' }) + S.circle(4, -16, 3, { fill: '#151515' }), `translate(${f(mx)} ${f(my)}) rotate(${f(Math.sin(mk * 7) * 20)})`);
    for (let i = 0; i < 5; i++) {
      const a = mk * (1 + i * 0.2);
      if (a < 0.7) w += S.circle(hx + (hxB + 10) * 0.55 + (i - 2) * 22 + a * (i - 2) * 40, TY_Y + (hyB - 150) * 0.55 - a * 90, 10 + a * 30, { fill: '#D9CFB8', opacity: f(0.7 * (1 - a / 0.7)) });
    }
  }
  let o = view(cam, w);
  const kc = seg(t, l1.word('Robux').t0, l1.word('Robux').t0 + 0.25);
  if (kc > 0) o += S.g(S.rect(-250, -70, 500, 140, 34, ol('#14182A', 7)) + TF('ROBUX SPENT', 0, -18, 38, '#9AA0AE') + T('0', 0, 52, 70, '#3BFF6A', OUT), `translate(560 260) rotate(-4) scale(${f(pop(kc))})`);
  return o;
}

// avatar-shop item card (screen space)
function itemCard(kind, x, y, k, cross, t, rot = 0) {
  if (k <= 0) return '';
  const gray = clamp(cross * 1.5, 0, 1);
  let o = S.rect(-210, -270, 420, 540, 36, ol(mix('#FFFFFF', '#D8DCE6', gray), 8)) + S.rect(-180, -240, 360, 320, 26, { fill: mix(kind === 'hat' ? '#FFE3A3' : kind === 'pet' ? '#C9F7D4' : '#CFE0FF', '#C8CCD6', gray) });
  if (kind === 'hat') o += hat('top', 0, -20, 1.5, -8) + K.F.sparkle(110, -190, 22) + T('Fancy Top Hat', 0, 140, 44, '#151515');
  else if (kind === 'pet') {
    const b = Math.abs(Math.sin(t * 6)) * 10;
    o += S.g(S.ellipse(0, 0, 90, 70, ol('#7FD86A', 7)) + S.path('M-70 -40 L-110 -110 L-40 -70 Z M70 -40 L110 -110 L40 -70 Z', ol('#5FBF4A', 6)) + S.circle(-30, -10, 14, { fill: '#151515' }) + S.circle(30, -10, 14, { fill: '#151515' }) + S.circle(-26, -14, 5, { fill: '#FFF' }) + S.circle(34, -14, 5, { fill: '#FFF' }) + S.path('M-14 22 Q0 34 14 22', ln(6)) + S.path('M80 30 Q140 40 130 -10', ln(10, '#5FBF4A')), `translate(0 ${f(-80 - b)})`);
    o += T('Mini Dragon', 0, 140, 44, '#151515');
  } else {
    o += S.rect(-110, -200, 220, 170, 26, ol('#2E7BFF', 7)) + T('VIP', 0, -98, 80, '#FFE14D', OUT) + K.F.sparkle(90, -190, 20) + T('VIP Game Pass', 0, 140, 44, '#151515');
  }
  const price = kind === 'hat' ? '250' : kind === 'pet' ? '800' : '399';
  o += S.rect(-130, 170, 260, 70, 24, ol('#3BD16F', 6)) + K.robuxText(0, 220, price, 42, '#FFFFFF');
  if (gray > 0) o += S.rect(-210, -270, 420, 540, 36, { fill: '#555A66', opacity: f(0.25 * gray) });
  o += redX(0, -40, 170, cross);
  if (cross >= 1) o += S.g(S.rect(-110, -32, 220, 64, 14, ol('#E8243C', 6)) + T('NOPE', 0, 22, 54, '#FFFFFF'), 'translate(0 200) rotate(-8)');
  const sh = cross > 0 && cross < 1 ? Math.sin(t * 80) * 6 : 0;
  return S.g(o, `translate(${f(x + sh)} ${f(y)}) rotate(${f(rot + (cross > 0 ? -4 * clamp(cross, 0, 1) : 0))}) scale(${f(pop(k))})`);
}
function shotList(t) {
  // AVATAR SHOP: hat → pet → game pass, each crossed out on its word; whip-pans between cards
  const w1 = l1.word('hat').t0, w2 = l1.word('pet').t0, w3 = l1.word('pass').t0;
  const n1 = l1.word('Not').t0, n2 = l1.word('Not', 1).t0, n3 = l1.word('Not', 2).t0;
  const xs = [420, 960, 1500];
  const cam = camKeys(t, [[tList, camAt(xs[0], 600, 1.3)], [n2 - 0.12, camAt(xs[0], 600, 1.36)], [n2 + 0.06, camAt(xs[1], 600, 1.3)], [n3 - 0.12, camAt(xs[1], 600, 1.36)], [n3 + 0.06, camAt(xs[2], 600, 1.3)], [w3 + 0.12, camAt(xs[2], 600, 1.36)], [w3 + 0.3, camAt(960, 560, 1.0)]]);
  let w = S.rect(-800, -600, 3520, 2280, 0, { fill: '#6A7CF0' }) + S.rect(-800, -600, 3520, 2280, 0, { fill: 'url(#s02grid)' });
  w += S.rect(0, 0, 1920, 130, 0, { fill: '#232A3D' }) + T('AVATAR SHOP', 300, 88, 64, '#FFFFFF') + S.rect(760, 34, 760, 62, 31, ol('#FFFFFF', 5)) + TF('search: free stuff', 830, 76, 34, '#9AA0AE', { 'text-anchor': 'start' });
  const cards = [['hat', n1, w1], ['pet', n2, w2], ['pass', n3, w3]];
  cards.forEach(([kind, tn, tw], i) => {
    w += itemCard(kind, xs[i], 560, seg(t, tn - 0.1, tn + 0.2), seg(t, tw + 0.05, tw + 0.35), t, (i - 1) * 3);
  });
  // the marker that draws the X
  for (const [, , tw] of cards) {
    const k = seg(t, tw + 0.05, tw + 0.35);
    if (k > 0 && k < 1) {
      const i = cards.findIndex((c) => c[2] === tw);
      const a = clamp(k * 2, 0, 1), b = clamp(k * 2 - 1, 0, 1);
      const mx = k < 0.5 ? lerp(-170, 170, a) : lerp(170, -170, b), my = k < 0.5 ? lerp(-210, 130, a) : lerp(-210, 130, b);
      w += S.g(S.rect(-20, -150, 40, 150, 10, ol('#E8243C', 6)) + S.path('M-20 0 L0 30 L20 0 Z', ol('#F4F1FF', 5)) + S.rect(-20, -150, 40, 40, 8, ol('#FFFFFF', 5)), `translate(${f(xs[i] + mx)} ${f(520 + my)}) rotate(25)`);
    }
  }
  let o = view(cam, w);
  for (const tc of [n2, n3]) o += C.speedLines(0, 1920, 540, 18, Math.floor(tc), '#FFFFFF', 900).repeat(bump(t, tc - 0.12, tc + 0.08) > 0.2 ? 1 : 0);
  if (t > w3 + 0.3) o += stamp('0 SPENT', 960, 560, seg(t, w3 + 0.32, w3 + 0.5), -8, '#1E9E4A', 120);
  return o;
}

function shotAvatar(t) {
  // avatar editor: Ty in the free starter shirt on a turntable; FREE tag pops on "free"
  const tf = l2.word('free').t0, ts = l2.word('starter').t0;
  const cam = camKeys(t, [[tAv, { zoom: 1.0, x: 0, y: 0 }], [tLife, { zoom: 1.12, x: -140, y: 20 }]]);
  let w = S.rect(-800, -600, 3520, 2280, 0, { fill: '#1B2034' });
  w += S.rect(60, 60, 1000, 960, 40, ol('#2A3150', 6)) + T('AVATAR', 200, 140, 56, '#FFFFFF', { 'text-anchor': 'start' });
  w += S.ellipse(600, 900, 320, 64, ol('#3A4470', 6)) + S.ellipse(600, 890, 280, 48, { fill: '#4A5690' });
  w += K.rays(560, 520, 12, 700, '#FFFFFF', 0.04, t * 10);
  // item grid (all locked)
  w += S.rect(1110, 60, 750, 960, 40, ol('#2A3150', 6)) + T('SHIRTS', 1180, 140, 48, '#FFFFFF', { 'text-anchor': 'start' });
  const prices = ['75', '120', '350', '90', '500', '45', '200', '999'];
  for (let i = 0; i < 9; i++) {
    const cx = 1240 + (i % 3) * 230, cy = 270 + Math.floor(i / 3) * 250;
    const eq = i === 0;
    w += S.rect(cx - 100, cy - 100, 200, 210, 24, ol(eq ? '#3BD16F' : '#39426A', eq ? 8 : 5));
    const col = eq ? '#A9B7C9' : ['#FF5A5A', '#FFD21F', '#B06BFF', '#34C3FF', '#FF6FB5', '#3BD16F', '#FF7A1A', '#FFFFFF'][i - 1];
    w += S.path('M-50 -60 L-20 -70 Q0 -56 20 -70 L50 -60 L70 -20 L46 -10 L46 50 L-46 50 L-46 -10 L-70 -20 Z', { ...ol(col, 5), transform: `translate(${cx} ${cy - 10})` });
    if (eq) w += TF('FREE', cx, cy + 82, 30, '#3BFF6A');
    else w += K.robuxText(cx, cy + 86, prices[i - 1], 28, '#FFFFFF') + S.g(S.rect(-18, -10, 36, 30, 6, ol('#FFD21F', 4)) + S.path('M-10 -10 L-10 -22 Q0 -34 10 -22 L10 -10', ln(5)), `translate(${cx + 70} ${cy - 70})`);
  }
  const turn = Math.sin((t - tAv) * 2.4) * 0.7;
  const tagK = seg(t, tf, tf + 0.25);
  const tag = tagK > 0 ? S.g(S.path('M0 0 L0 50', ln(6)) + S.g(S.path('M-110 50 L110 50 L110 190 L-110 190 Z', ol('#FFE14D', 8)) + S.circle(0, 72, 10, ol('#FFFFFF', 4)) + T('FREE', 0, 168, 84, '#E8243C'), `rotate(${f(Math.sin(t * 6) * 10)} 0 50)`), `translate(-180 -420) scale(${f(pop(tagK))})`) : '';
  w += actorD(TY_STARTER, 'TY', t, { x: 600, y: 900, s: 0.74, turn, face: { name: 'smug' }, props: [{ svg: tag, layer: 'front' }] }, { seed: 2 });
  const kl = seg(t, ts, ts + 0.25);
  if (kl > 0) w += S.g(S.rect(-200, -66, 400, 132, 26, ol('#232A3D', 6)) + TF('EQUIPPED SINCE', 0, -14, 32, '#FFE14D') + TF('2nd GRADE', 0, 36, 40, '#FFFFFF'), `translate(860 330) rotate(5) scale(${f(pop(kl))})`);
  let o = view(cam, w);
  return o;
}

function shotLife(t) {
  // runway: paparazzi flashes, deadpan pose; LIFESTYLE pops
  const tl = l2.word('lifestyle').t0;
  const cam = camKeys(t, [[tLife, camAt(960, 560, 1.05)], [tl, camAt(960, 520, 1.25)], [tSamp, camAt(960, 500, 1.35)]]);
  let w = S.rect(-800, -600, 3520, 2280, 0, { fill: '#3A1550' });
  w += K.rays(960, -100, 16, 1600, '#FF6FB5', 0.12, t * 6);
  for (const [x, a] of [[400, 12], [1520, -12]]) w += S.path(`M${x} -60 L${x - 160 + a * 10} 1000 L${x + 160 + a * 10} 1000 Z`, { fill: '#FFF6D0', opacity: 0.12 });
  w += S.path('M760 1100 L860 700 L1060 700 L1160 1100 Z', ol('#F4F1FF', 6)) + S.path('M960 700 L960 1100', ln(4, '#E2DCF0'));
  const pose = t >= tl - 0.05;
  w += actorD(TY_STARTER, 'TY', t, { x: 960, y: 940, s: 0.62, armR: pose ? 165 : 10, armL: pose ? -30 : 10, lean: pose ? 6 : 0, headRot: pose ? -8 : 0, face: { name: 'deadpan' } }, { seed: 4 });
  // paparazzi camera silhouettes along the bottom
  for (let i = 0; i < 7; i++) {
    const x = 120 + i * 280, fl = (Math.floor(t * 7 + i * 3.3) % 5 === 0);
    w += S.g(S.rect(-60, -40, 120, 80, 12, { fill: '#120818' }) + S.circle(0, 0, 24, { fill: fl ? '#FFFFFF' : '#2A1838' }) + S.rect(-30, -56, 40, 20, 4, { fill: '#120818' }), `translate(${x} ${980 + (i % 2) * 40}) rotate(${(i - 3) * 4})`);
    if (fl) w += S.circle(x, 980 + (i % 2) * 40, 90, { fill: '#FFFFFF', opacity: 0.35 }) + K.F.sparkle(x, 980 + (i % 2) * 40, 50, '#FFFFFF');
  }
  let o = view(cam, w);
  o += C.whiteFlash(0.25 * (Math.floor(t * 7) % 4 === 0 ? 1 : 0) + 0.5 * bump(t, tl - 0.05, tl + 0.12));
  const kl = seg(t, tl, tl + 0.3);
  if (kl > 0) o += S.g(T('LIFESTYLE', 0, 0, 170, '#FFD21F', { ...OUT, 'stroke-width': 18 }) + TF('™', 420, -80, 60, '#FFFFFF', OUT), `translate(960 230) rotate(-5) scale(${f(pop(kl))})`) + K.sparkles([[360, 160, 40], [1560, 280, 34], [1450, 120, 24]], t);
  return o;
}

function shotSamples(t) {
  // supermarket sample table; the toothpick pile keeps growing
  const tl = l3.word('lunch').t0;
  const cam = camKeys(t, [[tSamp, camAt(900, 560, 1.15)], [tl, camAt(980, 600, 1.3)], [tWrap, camAt(1000, 610, 1.36)]]);
  let w = S.rect(-800, -600, 3520, 2280, 0, { fill: '#E6F7F2' });
  for (let r = 0; r < 4; r++) {
    w += S.rect(-200, 120 + r * 170, 2320, 24, 0, ol('#B9C2D0', 5));
    for (let i = 0; i < 24; i++) {
      const c = ['#FF5A5A', '#FFD21F', '#34C3FF', '#3BD16F', '#FF8A3A', '#B06BFF'][Math.floor(hash(i + r * 31) * 6)];
      const h = 70 + hash(i * 3 + r) * 60;
      w += S.rect(-180 + i * 98, 120 + r * 170 - h, 80, h, 8, ol(c, 4));
    }
  }
  w += S.rect(-800, 820, 3520, 1000, 0, { fill: 'url(#s02tiles)' }) + S.rect(-800, 812, 3520, 14, 0, { fill: '#9AA6B8' });
  w += S.g(S.rect(-170, -50, 340, 100, 20, ol('#FF5A5A', 7)) + T('FREE SAMPLES', 0, 22, 50, '#FFFFFF', OUT), 'translate(560 300) rotate(-3)');
  w += S.path('M560 350 L560 470', ln(10));
  // table
  w += S.rect(300, 640, 520, 40, 10, ol('#FFFFFF', 7)) + S.path('M300 680 L820 680 L800 860 L320 860 Z', ol('#FF8FA3', 7));
  for (let i = 0; i < 6; i++) w += S.rect(320 + i * 80, 690, 40, 160, 0, { fill: '#FFFFFF', opacity: 0.4 });
  w += S.ellipse(430, 628, 130, 28, ol('#D9DEE8', 6));
  const eaten = Math.floor((t - tSamp) * 3.2);
  for (let i = 0; i < Math.max(0, 10 - eaten); i++) w += S.path(`M${352 + (i % 5) * 38} ${606 - Math.floor(i / 5) * 22} l0 -34`, ln(4, '#C9A06A')) + S.rect(338 + (i % 5) * 38, 590 - Math.floor(i / 5) * 22, 28, 24, 5, ol('#FFD86A', 4));
  // used toothpick mountain
  const n = clamp(eaten * 3 + 8, 0, 44);
  for (let i = 0; i < n; i++) {
    const hgt = (1 - Math.abs(hash(i) - 0.5) * 2) * (10 + n * 2.6);
    w += S.path(`M${f(600 + hash(i) * 190)} ${f(632 - hash(i * 3) * hgt)} l${f(46 * Math.cos(hash(i * 7) * 6))} ${f(14 * Math.sin(hash(i * 7) * 6))}`, ln(6, '#B98A4A'));
  }
  w += S.g(S.rect(-90, -34, 180, 68, 8, ol('#FFFFFF', 4)) + TF('LIMIT: 1', 0, -4, 28, '#E8243C') + TF('per customer', 0, 22, 18, '#151515'), 'translate(400 520) rotate(-5)');
  // Ty (side view, facing the table) with a napkin bib, chomping sample after sample
  const ch = (t - tSamp) * 3.2 % 1;
  const arm = t < tl ? lerp(30, 150, Math.sin(ch * Math.PI)) : 20;
  const bib = S.path('M-74 -500 L-16 -500 L-54 -390 Z', ol('#FFFFFF', 5));
  const ha = (arm * Math.PI) / 180;
  const pick = t < tl ? S.g(S.path('M0 0 L-40 -20', ln(6, '#B98A4A')) + S.rect(-66, -40, 30, 26, 6, ol('#FFD86A', 4)), `translate(${f(4 - 248 * Math.sin(ha))} ${f(-505 + 248 * Math.cos(ha))})`) : '';
  const full = seg(t, tl, tl + 0.3);
  w += actor('ty', t, { x: 1040, y: 1000, s: 0.6, view: 'side', armL: arm, armR: t >= tl ? 40 : -10, lean: t >= tl ? -6 : 4, face: t >= tl ? { name: 'happy', fx: ['blush'] } : { name: 'happy', mouth: ch > 0.35 && ch < 0.65 ? 'O' : 'smallSmile' }, sx: 1 + 0.08 * full, props: [{ svg: bib, layer: 'mid' }, { svg: pick, layer: 'front' }] }, { arms: false });
  let o = view(cam, w);
  for (let i = 0; i < 3; i++) {
    const tm = tSamp + 0.5 + i * 0.85;
    o += bang('MUNCH', 1360 + (i % 2) * 120, 330 + i * 60, bump(t, tm, tm + 0.45), 54, -8 + i * 6, '#FFE14D');
  }
  if (t > tl) o += S.g(S.rect(-200, -46, 400, 92, 24, ol('#14182A', 6)) + TF('LUNCH: $0.00', 0, 16, 46, '#3BFF6A'), `translate(1500 250) rotate(4) scale(${f(pop(seg(t, tl, tl + 0.25)))})`);
  return o;
}

function wrapPaper(x, y, flat, t) {
  // birthday wrapping paper sheet, crinkles ironed flat by "flat" (0..1 left→right)
  let o = S.rect(-300, -40, 600, 80, 6, ol('#FF8FB8', 6));
  for (let i = 0; i < 6; i++) o += K.F.sparkle(-260 + i * 104, -6, 14, '#FFE14D') + S.circle(-210 + i * 104, 18, 8, { fill: '#34C3FF' });
  o += TF('HAPPY 8th 9th 10th 11th BDAY', 0, 30, 20, '#FFFFFF', { opacity: 0.85 });
  for (let i = 0; i < 9; i++) {
    const cx = -280 + i * 70;
    if ((cx + 300) / 600 > flat) o += S.path(`M${cx} -38 L${cx + 20} 0 L${cx - 10} 38`, ln(4, '#C9467A', 0.6));
  }
  for (let i = 0; i < 5; i++) o += S.rect(-250 + i * 120, -44 + (i % 2) * 70, 50, 16, 2, { fill: '#DDE6F2', opacity: 0.85, stroke: '#9AA0AE', 'stroke-width': 2, transform: `rotate(${(i - 2) * 9} ${-225 + i * 120} ${-36 + (i % 2) * 70})` });
  return S.g(o, `translate(${f(x)} ${f(y)})`);
}
function shotWrap(t) {
  // ironing last year's wrapping paper flat; USED 14x stamp on "paper"
  const tp = l3.word('paper').t0;
  const cam = camKeys(t, [[tWrap, camAt(1040, 660, 1.2)], [tRet, camAt(1040, 680, 1.32)]]);
  let w = S.rect(-800, -600, 3520, 2280, 0, { fill: 'url(#s02wall)' }) + STARS;
  w += S.rect(-800, 840, 3520, 900, 0, { fill: 'url(#s02floor)' }) + S.rect(-800, 812, 3520, 30, 0, ol('#4846A8', 5));
  // stack of folded used paper with years
  for (let i = 0; i < 6; i++) w += S.rect(1400, 800 - i * 34, 280, 30, 6, ol(['#FF8FB8', '#7FD0FF', '#FFE14D', '#B06BFF', '#3BD16F', '#FF8A3A'][i], 5)) + TF(String(2020 + i), 1540, 824 - i * 34, 22, '#151515');
  const flat = ease.inOut(seg(t, tWrap + 0.2, tp));
  const ix = lerp(720, 1240, flat) + Math.sin(t * 14) * 14;
  // Ty behind the board; his arm follows the iron
  const reach = clamp((ix - 980) / 260, -1, 1);
  w += actor('ty', t, { x: 980, y: 1070, s: 0.6, armR: reach > 0 ? 40 + 50 * reach : 25, armL: reach < 0 ? 40 - 50 * reach : 25, lean: 6 * reach, face: { name: 'determined' } }, { arms: false });
  // ironing board in front of him
  w += S.path('M640 880 L1320 880 L1360 920 L600 920 Z', ol('#B9C2D0', 6)) + S.path('M600 920 L1360 920 L1340 950 L620 950 Z', ol('#8A93A6', 6)) + S.path('M760 950 L1180 1180 M1200 950 L780 1180', ln(12, '#8A93A6'));
  w += wrapPaper(980, 864, flat, t);
  const iron = S.path('M-90 0 Q-80 -50 40 -50 L90 0 Z', ol('#5CC8FF', 6)) + S.path('M-50 -50 Q-40 -96 20 -96 L40 -50', ln(14)) + S.path('M-50 -50 Q-40 -96 20 -96 L40 -50', ln(7, '#2E7BFF'));
  w += S.g(iron, `translate(${f(ix)} 840)`);
  for (let i = 0; i < 4; i++) {
    const ph = (t * 1.5 + i / 4) % 1;
    w += S.circle(ix + (i - 1.5) * 30 + Math.sin(ph * 8) * 10, 800 - ph * 160, 16 + ph * 20, { fill: '#FFFFFF', opacity: f(0.6 * (1 - ph)) });
  }
  let o = view(cam, w);
  o += stamp('USED 14x', 1420, 330, seg(t, tp, tp + 0.2), 10, '#2E7BFF', 90);
  return o;
}

function shotReturn(t) {
  // Grandma's RETURN DESK: Ty hands the gift back; smash-zoom on her face on "grandma"
  const tg = l3.word('grandma').t0, tgift = l3.word('gift').t0;
  const close = t >= tg - 0.04;
  const cam = close ? camKeys(t, [[tg, camAt(1340, 600, 2.3)], [tPlan, camAt(1340, 610, 2.5)]]) : camKeys(t, [[tRet, camAt(960, 560, 1.15)], [tg, camAt(1000, 540, 1.25)]]);
  if (close) { const sh = K.shake(t, tg, 0.3, 14); cam.sx = sh.sx; cam.sy = sh.sy; }
  let w = S.rect(-800, -600, 3520, 2280, 0, { fill: '#F7C9D9' }) + S.rect(-800, -600, 3520, 2280, 0, { fill: 'url(#wallStripes)', opacity: 0.4 });
  w += S.g(S.rect(-150, -100, 300, 200, 12, ol('#FFF6E8', 8)) + TF('HOME SWEET', 0, -20, 36, '#E8604A') + TF('OBBY', 0, 40, 60, '#7C4DD8'), 'translate(1500 230) rotate(2)');
  w += S.rect(-800, 840, 3520, 900, 0, { fill: '#B98A6A' });
  w += S.g(S.rect(-190, -50, 380, 100, 16, ol('#FFE14D', 7)) + T('RETURN DESK', 0, 20, 52, '#151515'), 'translate(960 210) rotate(-4)') + S.path('M860 260 L860 160 M1060 250 L1060 160', ln(6));
  w += actor('grandma', t, { x: 1340, y: 1010, s: 0.6, turn: -0.4, armL: 40, armR: 20, face: close ? { name: 'shocked', fx: ['exclaim'] } : { name: 'confused' } });
  const slide = ease.out(seg(t, tgift - 0.4, tgift + 0.1));
  const gift = S.rect(-70, -80, 140, 100, 8, ol('#34C3FF', 6)) + S.rect(-12, -80, 24, 100, 0, { fill: '#FF5A5A' }) + S.path('M0 -80 Q-40 -120 -20 -130 Q0 -110 0 -80 Q40 -120 20 -130 Q0 -110 0 -80', ol('#FF5A5A', 5));
  w += actor('ty', t, { x: 640, y: 1010, s: 0.6, turn: 0.45, armR: 70 + 20 * slide, armL: 10, face: { name: 'happy' } });
  // counter
  w += S.rect(380, 760, 1200, 60, 10, ol('#D9945A', 7)) + S.rect(400, 820, 1160, 260, 0, ol('#B57A4E', 7));
  w += S.g(gift, `translate(${f(lerp(820, 1130, slide))} 760)`);
  w += S.g(S.rect(-60, -30, 120, 60, 4, ol('#FFFFFF', 4)) + S.path('M-40 -12 L40 -12 M-40 4 L30 4 M-40 18 L20 18', ln(3, '#9AA0AE')), `translate(${f(lerp(860, 1010, slide))} 750) rotate(-8)`);
  let o = view(cam, w);
  if (close) o += bang('?!', 1560, 300, seg(t, tg, tg + 0.15), 150, 10, '#FF6FB5');
  return o;
}

function shotPlan(t) {
  // whispered: flashlight under the chin, THE PLAN blueprint slams behind him
  const tp = l4.word('plan').t0;
  const cam = camKeys(t, [[tPlan, camAt(960, 470, 1.0)], [tFarm, camAt(960, 430, 1.15)]]);
  let w = S.rect(-800, -600, 3520, 2280, 0, { fill: '#0F0A26' });
  const kb = seg(t, tp - 0.1, tp + 0.15);
  if (kb > 0) {
    let bp = S.rect(-420, -280, 840, 560, 16, ol('#2457B8', 8)) + S.rect(-420, -280, 840, 560, 16, { fill: 'url(#s02grid)' }) + T('THE PLAN', 0, -190, 80, '#FFFFFF');
    bp += S.rect(-320, -120, 200, 150, 14, ln(6, '#FFFFFF')) + S.rect(-300, -100, 160, 100, 8, ln(4, '#FFFFFF')) + S.path('M-100 -40 Q60 -120 160 -40', ln(6, '#FFFFFF')) + S.path('M150 -60 L170 -36 L140 -30', ln(6, '#FFFFFF'));
    bp += TF('R$', 250, -20, 90, '#FFFFFF') + TF('$$$', 250, 100, 70, '#FFFFFF') + S.path('M-300 160 L300 160 M-300 200 L180 200', ln(5, '#FFFFFF', 0.6));
    w += S.g(bp, `translate(960 ${f(lerp(-400, 420, ease.outBack(kb)))}) rotate(-3)`);
  }
  const torch = S.g(S.rect(-22, -10, 44, 120, 10, ol('#3A3F55', 5)) + S.rect(-30, -26, 60, 24, 6, ol('#FFD21F', 5)), 'translate(-10 -470)');
  w += actor('ty', t, { x: 960, y: 1330, s: 1.05, armR: -25, armL: 10, face: { name: 'sneaky' }, headRot: -6, props: [{ svg: torch, layer: 'front' }] }, { arms: false });
  // darkness everywhere except a warm pool of torch light on his face
  w += S.path('M-800 -600 L2720 -600 L2720 1680 L-800 1680 Z M960 530 m-330 0 a330 380 0 1 0 660 0 a330 380 0 1 0 -660 0 Z', { fill: '#0B0824', opacity: 0.55, 'fill-rule': 'evenodd' });
  w += S.ellipse(960, 560, 360, 420, { fill: 'url(#s02torch)', opacity: 0.55 });
  let o = view(cam, w);
  return o;
}

function shotFarm(t) {
  // dark room, spotlight on the PC, angelic rays; THE AFK FARM slams in
  const ta = l4.word('AFK').t0;
  const cam = camKeys(t, [[tFarm, camAt(470, 450, 1.25)], [tFb1, camAt(470, 430, 1.6)]]);
  let w = bedroom(t, { heat: 0.25, dark: true });
  w += darkRoom(0.85, []);
  w += S.path('M470 -300 L90 700 L850 700 Z', { fill: '#FFF6D0', opacity: 0.16 });
  w += K.rays(470, 440, 14, 900, '#FFF6C8', 0.16 * seg(t, ta - 0.1, ta + 0.2), t * 25);
  w += S.ellipse(470, 470, 460, 360, { fill: 'url(#s02spot)' });
  w += desk(t) + tower(170, 600, 1, t, 0.25) + crt(470, 600, 1, t, 0.25, farmScreen(t, 2999900 + (t - tFarm) * 30)) + keyboard(470, 622, 1, 1) + friedEgg(480, 282, 1, t, 0.2) + cat(720, 598, 0.9, t, 1);
  w += K.sparkles([[180, 300, 22], [700, 330, 26], [620, 220, 18]], t);
  let o = view(cam, w);
  const k = seg(t, ta - 0.05, ta + 0.25);
  if (k > 0) o += S.g(TF('THE', 0, -120, 60, '#FFFFFF', OUT) + T('AFK FARM', 0, 40, 190, '#3BFF6A', { ...OUT, 'stroke-width': 20 }), `translate(960 230) rotate(-4) scale(${f(lerp(2.5, 1, ease.out(k)))})`, { opacity: f(clamp(k * 3, 0, 1)) });
  o += bang('AAAH~', 1560, 560, seg(t, ta + 0.3, ta + 0.5), 60, 8, '#FFF6C8');
  return o;
}

// ---- flashback (2nd grade)
function sepia(t, label = '2ND GRADE') {
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#E8C890', opacity: 0.32 }) + S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s02sepiaV)' });
  // wobbly dream border
  let d = '';
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const r = 1 + 0.025 * Math.sin(a * 9 + t * 4);
    d += (i ? ' L' : 'M') + `${f(960 + Math.cos(a) * 1080 * r)} ${f(540 + Math.sin(a) * 640 * r)}`;
  }
  o += S.path(`M-50 -50 L1970 -50 L1970 1130 L-50 1130 Z ${d} Z`, { fill: '#F6E7C8', 'fill-rule': 'evenodd', opacity: 0.9 });
  o += S.g(S.rect(-170, -46, 340, 92, 20, ol('#FFF6E0', 6)) + T(label, 0, 22, 60, '#B0602A'), 'translate(250 110) rotate(-5)');
  return o;
}
function shotFb1(t) {
  // little Ty climbs onto the chair at the brand-new PC
  const cam = camKeys(t, [[tFb1, camAt(560, 560, 1.15)], [tFb2, camAt(520, 520, 1.3)]]);
  let w = bedroom(t, { heat: 0, fb: true, chair: false, screen: farmScreen(t, (t - tFb1) * 3, { bg: '#2A5AA8' }) });
  const climb = ease.outBack(seg(t, tFb1 + 0.1, tFb1 + 0.55));
  w += chair(470, 900, 0.95);
  w += actorD(TY_LITTLE, 'TY', t, { x: 470, y: lerp(980, 790, climb), s: 0.55, view: 'back', armL: 30 + 20 * Math.sin(t * 10), armR: 30 + 20 * Math.sin(t * 10 + 1), shadow: false }, { arms: false });
  return view(cam, w) + sepia(t);
}
function keyboardClose(t, tape) {
  // big keyboard insert: rip the tape, slap it on the spacebar (screen space)
  let o = S.rect(-800, -600, 3520, 2280, 0, { fill: '#C99262' }) + S.rect(-800, -600, 3520, 2280, 0, { fill: 'url(#s02floor)', opacity: 0.6 });
  o += S.path('M140 980 L1780 980 L1680 420 L240 420 Z', ol('#E9DFC3', 9));
  const rows = 4;
  for (let r = 0; r < rows; r++) for (let c = 0; c < 12; c++) {
    const v = r / rows;
    const x0 = lerp(300, 200, v) + c * lerp(110, 126, v), y0 = 450 + r * 100;
    o += S.rect(x0, y0, lerp(92, 104, v), 80, 12, ol('#F6EFD9', 5));
  }
  const press = tape > 0.95 ? 6 : 0;
  o += S.rect(560, 860 + press, 800, 90, 18, ol('#F6EFD9', 6));
  return o;
}
function shotFb2(t) {
  // insert: tape RRRIP → SLAP on the spacebar; clicker game ticks up
  const tr = l5.word('taped').t0, ts = l5.word('spacebar').t0;
  const cam = camKeys(t, [[tFb2, { zoom: 1.0, x: 0, y: 0 }], [ts, { zoom: 1.08, x: 0, y: 60 }], [tFb3, { zoom: 1.15, x: 0, y: 80 }]]);
  const sh = K.shake(t, ts, 0.3, 14);
  cam.sx = sh.sx; cam.sy = sh.sy;
  const stick = seg(t, ts - 0.12, ts);
  let w = keyboardClose(t, stick);
  // tape roll + strip
  const pull = ease.out(seg(t, tr, tr + 0.5));
  const rx = lerp(1700, 1500, pull), ry = lerp(300, 260, pull);
  if (stick < 1) {
    const sx = lerp(rx - 40, 520, pull), sy = lerp(ry, 820, stick);
    w += S.path(`M${f(rx - 40)} ${f(ry)} L${f(sx)} ${f(sy)}`, ln(70, '#B9C2D0')) + S.path(`M${f(rx - 40)} ${f(ry)} L${f(sx)} ${f(sy)}`, { fill: 'none', stroke: '#151515', 'stroke-width': 4, opacity: 0.4 });
    w += S.g(S.circle(0, 0, 80, ol('#B9C2D0', 8)) + S.circle(0, 0, 40, ol('#E9DFC3', 6)), `translate(${f(rx)} ${f(ry)})`);
  } else {
    w += S.path('M540 870 L1380 870 L1384 950 L536 950 Z', ol('#B9C2D0', 6)) + S.path('M540 870 l-12 20 l14 20 l-12 20 l14 20 M1380 870 l12 20 l-14 20 l12 20 l-14 20', ln(4)) + S.path('M600 890 L1300 890', ln(6, '#FFFFFF', 0.5));
  }
  // little hands
  const hand = (x, y) => S.rect(x - 50, y - 40, 100, 90, 24, ol('#E9B38B', 6));
  if (stick < 1) w += hand(lerp(rx - 40, 520, pull), lerp(ry + 30, 840, stick));
  else w += hand(700, 920 + Math.max(0, 1 - (t - ts) * 4) * 20) + hand(1220, 920 + Math.max(0, 1 - (t - ts) * 4) * 20);
  // CRT corner with the clicker
  w += S.g(S.rect(-300, -180, 600, 360, 40, ol('#E9DFC3', 8)) + S.rect(-260, -150, 520, 300, 30, ol('#1A1D2A', 6)) + S.g(farmScreen(t, Math.max(0, (t - ts) * 40), { bg: '#2A5AA8' }), 'scale(1.55)'), 'translate(400 200) rotate(-4)');
  let o = view(cam, w);
  o += bang('RRRIP!', 1450, 520, bump(t, tr, tr + 0.6), 100, 8, '#FFE14D');
  o += bang('SLAP!', 960, 700, bump(t, ts, ts + 0.6), 130, -6, '#FF8A3A');
  if (t > ts + 0.3) o += bang('CLICK CLICK CLICK', 1300, 260, seg(t, ts + 0.3, ts + 0.45), 54, 6, '#FFFFFF');
  return o + sepia(t);
}
function shotFb3(t) {
  // little Ty skips out, flicks the light off; the PC keeps clicking in the dark
  const to = l5.word('off').t0;
  const cam = camKeys(t, [[tFb3, camAt(900, 560, 1.0)], [tLater, camAt(800, 540, 1.08)]]);
  const dark = seg(t, to, to + 0.08);
  let w = bedroom(t, { heat: 0, fb: true, screen: farmScreen(t, (t - tFb1) * 3, { bg: '#2A5AA8' }), chairX: 470, door: 0.9, noSign: true });
  const u = seg(t, tFb3, tLater);
  const x = lerp(820, 2140, u);
  const flick = bump(t, to - 0.25, to + 0.25);
  w += S.rect(1960, 520, 40, 60, 6, ol('#F4F1FF', 4)) + S.rect(1972, 532 + (dark > 0.5 ? 18 : 0), 16, 18, 3, { fill: '#C9C4E8' });
  w += actorD(TY_LITTLE, 'TY', t, { x, y: 1000, s: 0.55, view: 'side', flip: true, ...A.walk(t * 12, 1.2), armL: flick > 0 ? 160 * flick : -40 * Math.sin(t * 12), face: { name: 'happy' } }, { arms: false });
  w += darkRoom(dark, [[470, 420, 300]]);
  let o = view(cam, w);
  if (dark > 0) o += bang('click.', 1500, 380, seg(t, to, to + 0.15), 60, -6, '#FFFFFF');
  return o + sepia(t);
}

function shotLater(t) {
  // "4 YEARS LATER" card over a calendar tearing itself apart
  const u = t - tLater;
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: Math.floor(u * 5) % 2 ? '#2A1E6A' : '#FFB86B' });
  o += K.rays(960, 540, 18, 1500, '#FFFFFF', 0.12, u * 120);
  o += S.rect(760, 320, 400, 440, 30, ol('#FFFFFF', 8)) + S.rect(760, 320, 400, 110, 30, { fill: '#E8243C' }) + S.rect(760, 400, 400, 30, 0, { fill: '#E8243C' }) + S.rect(760, 320, 400, 440, 30, ln(8));
  const yr = 2020 + Math.min(4, Math.floor(u * 4.2));
  o += T(String(yr), 960, 400, 70, '#FFFFFF') + T(String((Math.floor(u * 40) % 28) + 1), 960, 640, 200, '#151515');
  for (let i = 0; i < 8; i++) {
    const a = (u * 3 + i / 8) % 1;
    o += S.g(S.rect(-100, -110, 200, 220, 16, ol('#FFFFFF', 5)), `translate(${f(960 + a * (hash(i) - 0.3) * 1600)} ${f(540 - a * 500 + a * a * 900)}) rotate(${f(a * 500 * (hash(i * 3) - 0.5))})`);
  }
  o += S.g(T('4 YEARS LATER...', 0, 0, 130, '#FFE14D', { ...OUT, 'stroke-width': 16 }), `translate(960 210) rotate(-3) scale(${f(pop(seg(t, tLater, tLater + 0.25)))})`);
  o += C.whiteFlash(1 - seg(t, tLater, tLater + 0.2));
  return o;
}

function shotHeat(t) {
  // red-hot PC: heat shimmer, sizzling egg, blissful cat; Ty sweats with a paper fan; the thermometer pops
  const th = l6.word('heater').t0;
  const cam = camKeys(t, [[tHeat, camAt(560, 520, 1.45)], [th, camAt(560, 500, 1.6)], [tBal, camAt(560, 500, 1.65)]]);
  let w = bedroom(t, { heat: 1, bal: 2999000 + (t - tHeat) * 50 });
  w += S.rect(-800, -600, 3600, 2400, 0, { fill: '#FF7A2A', opacity: 0.12 });
  // thermometer on the wall
  const th1 = seg(t, tHeat, th);
  const burst = t > th;
  w += S.g(S.rect(-22, -150, 44, 220, 22, ol('#FFFFFF', 6)) + S.circle(0, 80, 36, ol('#E8243C', 6)) + S.rect(-10, f(70 - 210 * (burst ? 1 : 0.5 + 0.5 * th1)), 20, f(210 * (burst ? 1 : 0.5 + 0.5 * th1)), 8, { fill: '#E8243C' }), 'translate(830 300)');
  if (burst) w += C.burst(830, 150, seg(t, th, th + 0.5), '#FF5A3A');
  const fan = Math.sin(t * 22) * 20;
  const fanSvg = S.g(S.path('M0 0 L-70 -110 Q0 -150 70 -110 Z', ol('#FFE14D', 5)) + S.path('M0 0 L-35 -125 M0 0 L0 -132 M0 0 L35 -125', ln(3, '#E8A21A')), `translate(${f(A.hand(120, 1)[0])} ${f(A.hand(120, 1)[1])}) rotate(${f(fan)})`);
  w += actor('ty', t, { x: 880, y: 1080, s: 0.6, turn: -0.5, armR: 120, armL: 15, face: { name: 'happy', fx: ['sweat', 'sweat2', 'redface'] }, props: [{ svg: fanSvg, layer: 'front' }] }, { arms: false });
  let o = view(cam, w);
  o += bang('SIZZLE', 380, 230, bump(t, tHeat + 0.2, tHeat + 1.2), 64, -8, '#FFE14D');
  o += bang('POP!', 1250, 260, bump(t, th, th + 0.6), 100, 10, '#FF5A3A');
  return o;
}

function balScreen(t, bal, k1) {
  // the CRT screen filling the frame: Robux balance roll-up
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#0F2140' }) + S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s02grid)' });
  o += S.rect(0, 0, 1920, 130, 0, { fill: '#0D2350' }) + TF('MY PROFILE', 120, 86, 48, '#FFFFFF', { 'text-anchor': 'start' }) + TF('AFK: 4 yrs 0 days', 1800, 86, 40, '#3BFF6A', { 'text-anchor': 'end' });
  o += TF('BALANCE', 960, 330, 64, '#9FC4FF');
  o += K.rays(960, 540, 16, 1200, '#FFE14D', 0.22 * k1, t * 40);
  o += K.counter(960, 540, bal, 2.6, k1 > 0 ? '#FFE14D' : '#3BD16F');
  return o;
}
function shotBal(t) {
  const tb = l6.word('balance').t0, tm = l6.word('MILLION').t0, tr = l6.word('Robux').t0;
  const roll = ease.in(seg(t, tb + 0.3, tm));
  const bal = Math.min(3000000, roll * 3000000);
  const k1 = seg(t, tm, tm + 0.2);
  if (t < tr) {
    const cam = camKeys(t, [[tBal, { zoom: 1.0, x: 0, y: 0 }], [tm, { zoom: 1.12, x: 0, y: 0 }], [tm + 0.05, { zoom: 1.3, x: 0, y: 0 }], [tr, { zoom: 1.34, x: 0, y: 0 }]]);
    const sh = K.shake(t, tm, 0.5, 18);
    cam.sx = sh.sx; cam.sy = sh.sy;
    let o = view(cam, balScreen(t, bal, k1));
    // CRT curvature + scanlines
    o += S.path('M0 0 L1920 0 L1920 1080 L0 1080 Z M60 40 Q960 0 1860 40 Q1920 540 1860 1040 Q960 1080 60 1040 Q0 540 60 40 Z', { fill: '#1A1D2A', 'fill-rule': 'evenodd' });
    o += C.whiteFlash(0.6 * bump(t, tm - 0.02, tm + 0.15));
    if (k1 > 0) o += K.sparkles([[400, 300, 40], [1500, 280, 50], [1600, 760, 36], [300, 800, 30]], t) + bang('AAAAAH!', 960, 860, seg(t, tm + 0.1, tm + 0.3), 110, -4, '#FFF6C8');
    return o;
  }
  // Ty's face pops into the glow: Robux eyes
  const cam = camKeys(t, [[tr, camAt(960, 420, 1.0)], [tMia, camAt(960, 440, 1.08)]]);
  let w = S.rect(-800, -600, 3520, 2280, 0, { fill: '#2A4AB8' }) + K.rays(960, 400, 16, 1400, '#FFE14D', 0.35, t * 40);
  w += K.coinRain(t, 26, { r: 34, speed: 420, seed: 4 });
  w += actor('ty', t, { x: 960, y: 1250, s: 1.0, face: { name: 'rich', mouth: 'bigGrin' }, armL: 150, armR: 150, sx: 1 + 0.1 * bump(t, tr, tr + 0.3), sy: 1 - 0.08 * bump(t, tr, tr + 0.3) }, { arms: false });
  return view(cam, w) + C.whiteFlash(1 - seg(t, tr, tr + 0.15));
}

// ---- Mia
const MIA_HATS = ['top', 'cowboy', 'crown', 'party', 'propeller'];
function miaIn(t, x, y, s, pose = {}, act = {}, nHats = 5, wob = 1) {
  const kinds = [];
  for (let i = 0; i < nHats; i++) kinds.push(i < MIA_HATS.length ? MIA_HATS[i] : HAT_KEYS[(i * 5) % HAT_KEYS.length]);
  const [hx, hy] = A.hand(pose.armR ?? 40, 1);
  const ph = pose.phone === false ? '' : S.g(K.phone(0, 0, 0.35, -10, S.rect(-150, -280, 300, 560, 0, { fill: '#FF8FB8' }) + S.circle(0, -60, 70, ol('#FFE14D', 6)) + TF('HATS', 0, 120, 60, '#FFFFFF')), `translate(${f(hx)} ${f(hy - 60)})`);
  return castIn('mia', t, { x, y, s, armR: 40, armL: 10, ...pose, props: [...(pose.props || []), { svg: ph, layer: 'front' }] }, act, hatStack(kinds, t, wob));
}
function shotMia(t) {
  // pan to the doorway: Mia, phone, five stacked hats
  const cam = camKeys(t, [[tMia, camAt(1500, 560, 1.0)], [tMia + 0.35, camAt(1900, 520, 1.05)], [tMia2, camAt(1880, 520, 1.12)]]);
  let w = bedroom(t, { door: 1, bal: 3000000 });
  w += miaIn(t, 2180, 880, 0.5, { face: { name: 'deadpan' }, armR: 40 }, {});
  w += actor('ty', t, { x: 1520, y: 1060, s: 0.62, turn: 0.7, face: { name: 'smug', eyes: { look: [0.9, -0.1] } }, armL: 10, armR: 10 });
  let o = view(cam, w);
  o += C.speedLines(0, 1920, 540, 16, 5, '#FFFFFF', 900).repeat(t < tMia + 0.3 ? 1 : 0);
  return o;
}
function shotMia2(t, frozen = false) {
  // close on Mia: "groceries with pixels?" — pixel grocery bag thought bubble
  const tc = l7.word('groceries').t0;
  const cam = camKeys(t, [[tMia2, camAt(2180, 470, 1.9)], [tMiaCard, camAt(2180, 480, 2.05)]]);
  let w = bedroom(t, { door: 1, bal: 3000000 });
  w += miaIn(t, 2180, 880, 0.5, { face: { name: 'deadpan', brows: { L: [-6, 2], R: [-30, -20] } }, armR: 40, headRot: -6 }, {});
  let o = view(cam, w);
  const kb = seg(t, tc, tc + 0.25);
  if (kb > 0) {
    let bag = '';
    const px = 22;
    const shape = ['..XXXX..', '.X....X.', 'XXXXXXXX', 'XGGRGYGX', 'XGRGGYGX', 'XGGGRGGX', 'XXXXXXXX'];
    shape.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch !== '.') bag += S.rect(-88 + c * px, -80 + r * px, px, px, 0, { fill: { X: '#C98A5B', G: '#3BD16F', R: '#E8243C', Y: '#FFD21F' }[ch], stroke: '#151515', 'stroke-width': 2 });
    }));
    o += thought(1500, 300, 360, 300, bag, kb, -230, 200);
  }
  return o;
}
function hatAvalanche(t, t0, x0, y0, n = 46) {
  let o = '';
  const u = t - t0;
  if (u < 0) return '';
  for (let i = 0; i < n; i++) {
    const d = u - hash(i * 2.3) * 0.9;
    if (d < 0) continue;
    const vx = 500 + 900 * hash(i), vy = -500 + 600 * hash(i * 5);
    let x = x0 + vx * d, y = y0 + vy * d + 1400 * d * d;
    const floor = 980 - hash(i * 7) * 380 * clamp(u / 2, 0, 1);
    if (y > floor) y = floor;
    o += hat(HAT_KEYS[i % HAT_KEYS.length], x, y, 0.8 + 0.4 * hash(i * 3), (hash(i * 9) - 0.5) * 80 + (y < floor ? d * 300 : 0));
  }
  return o;
}
function shotHats(t) {
  // Mia's closet bursts: a hat avalanche buries Ty up to the beanie
  const th = l8.word('hats').t0;
  const cam = camKeys(t, [[tHats, camAt(960, 560, 1.0)], [th, camAt(1100, 620, 1.12)], [tFash, camAt(1140, 640, 1.2)]]);
  const sh = K.shake(t, tHats + 0.3, 1.2, 10);
  cam.sx = sh.sx; cam.sy = sh.sy;
  let w = S.rect(-800, -600, 3520, 2280, 0, { fill: 'url(#s02pink)' }) + S.rect(-800, 840, 3520, 900, 0, { fill: '#E9B8D2' }) + S.rect(-800, 812, 3520, 30, 0, ol('#D88AB2', 5));
  // closet
  const open = ease.outBack(seg(t, tHats + 0.15, tHats + 0.4));
  w += S.rect(160, 120, 620, 720, 20, ol('#FFFFFF', 8)) + S.rect(190, 150, 560, 690, 10, { fill: '#5A2A5A' });
  for (let i = 0; i < 12; i++) w += hat(HAT_KEYS[i % HAT_KEYS.length], 230 + (i % 4) * 140, 300 + Math.floor(i / 4) * 200, 0.7);
  w += S.g(S.rect(0, 0, 280, 690, 10, ol('#FFD1E6', 7)) + S.circle(250, 340, 14, ol('#FFD21F', 4)), `translate(190 150) scale(${f(1 - open * 1.4)} 1)`) + S.g(S.rect(-280, 0, 280, 690, 10, ol('#FFD1E6', 7)) + S.circle(-250, 340, 14, ol('#FFD21F', 4)), `translate(750 150) scale(${f(1 - open * 1.4)} 1)`);
  w += S.g(S.rect(-140, -36, 280, 72, 16, ol('#FF6FB5', 6)) + T("MIA'S HATS", 0, 22, 46, '#FFFFFF'), 'translate(470 90) rotate(-3)');
  // Ty, being buried
  const bury = ease.inOut(seg(t, th - 0.6, th + 0.3));
  w += actor('ty', t, { x: 1250, y: 1010, s: 0.58, turn: -0.4, armL: 150 * (1 - bury) + 40, armR: 150 * (1 - bury) + 40, face: { name: bury > 0.5 ? 'deadpan' : 'shocked' } });
  w += hatAvalanche(t, tHats + 0.3, 470, 600);
  // the pile in front of Ty
  if (bury > 0) {
    let pile = '';
    for (let i = 0; i < 22; i++) pile += hat(HAT_KEYS[(i * 3) % HAT_KEYS.length], 900 + hash(i * 1.7) * 760, 1100 - (hash(i * 4.4) * 0.6 + 0.4) * 560 * bury + (i % 3) * 40, 0.95, (hash(i) - 0.5) * 70);
    w += pile;
  }
  return view(cam, w);
}
function shotFash(t) {
  // offended close-up: 412 HATS badge; on "FASHION" the hat tower shoots up, magazine-cover style
  const t412 = l9.word('twelve').t0, tf = l9.word('FASHION').t0;
  const after = t >= tf;
  const cam = !after ? camKeys(t, [[tFash, camAt(960, 560, 1.2)], [tf, camAt(960, 540, 1.3)]]) : camKeys(t, [[tf, camAt(960, 460, 0.9)], [tf + 0.35, camAt(960, 350, 0.76)], [tPick, camAt(960, 340, 0.74)]]);
  let o = '';
  if (!after) o += S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s02pink)' });
  else o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FF6FB5' }) + K.rays(960, 600, 20, 1800, '#FFFFFF', 0.2, t * 30) + T('HAT VOGUE', 960, 190, 210, '#FFFFFF', { opacity: 0.85, ...OUT, 'stroke-width': 14 });
  const grow = ease.outBack(seg(t, tf, tf + 0.45));
  const n = 5 + Math.round(grow * 7);
  o += view(cam, miaIn(t, 960, 1060, 0.62, { face: !after ? { name: 'angry' } : { name: 'smug', fx: ['sparkles'] }, armR: !after ? 40 : 150, armL: !after ? 30 : -30, lean: !after ? 0 : -5, phone: !after }, { arms: false }, n, 1 + grow));
  const k = seg(t, t412, t412 + 0.25);
  if (k > 0) o += S.g(S.circle(0, 0, 150, ol('#FFE14D', 9)) + T('412', 0, 20, 110, '#151515') + TF('HATS', 0, 80, 44, '#151515'), `translate(${after ? 1560 : 1500} ${after ? 520 : 320}) rotate(${f(10 + Math.sin(t * 4) * 4)}) scale(${f(pop(k) * (after ? 0.8 : 1))})`);
  if (after) {
    o += C.whiteFlash(0.7 * (1 - seg(t, tf, tf + 0.2)));
    o += S.g(T('FASHION', 0, 0, 170, '#FFFFFF', { ...OUT, 'stroke-width': 20 }), `translate(470 720) rotate(-10) scale(${f(pop(seg(t, tf, tf + 0.3)))})`);
    for (let i = 0; i < 6; i++) if ((Math.floor(t * 8) + i) % 4 === 0) o += K.F.sparkle(200 + i * 300, 360 + (i % 3) * 200, 50, '#FFFFFF');
  }
  return o;
}

// ---- Pickle
function shotPick(t) {
  // Pickle dives in through the window and bounces on the bed; freeze-frame card on "Pickle"
  const tp = l10.word('Pickle').t0;
  const tt = Math.min(t, tp + 0.02);
  const cam = camKeys(tt, [[tPick, camAt(1300, 520, 1.25)], [tp, camAt(1400, 560, 1.3)]]);
  let w = bedroom(tt, { open: true });
  const u = seg(tt, tPick + 0.15, tPick + 1.0);
  let px, py, rot, pose;
  if (u < 1) {
    px = lerp(1070, 1560, u); py = lerp(640, 740, u) - Math.sin(u * Math.PI) * 90; rot = lerp(-80, 0, ease.inOut(u));
    pose = { armL: 160, armR: 160, legL: 10, legR: -10, face: { name: 'excited' } };
  } else {
    const b = Math.abs(Math.sin((tt - tPick - 1.0) * 9)) * Math.max(0, 1 - (tt - tPick - 1.0) * 1.5);
    px = 1560; py = 740 - b * 80; rot = 0;
    pose = { armL: 120, armR: 120, face: { name: 'joy' } };
  }
  if (tt < tPick + 0.15) { px = 1060; py = 620; rot = -80; pose = { armL: 170, armR: 170, face: { name: 'excited' } }; }
  w += actor('pickle', tt, { x: px, y: py, s: 0.5, rot, rotY: -400, shadow: false, ...pose }, { arms: false });
  // window sill in front of his legs while he climbs
  if (tt < tPick + 0.4) w += S.rect(860, 572, 420, 30, 8, ol('#F4F1FF', 6));
  w += actor('ty', tt, { x: 760, y: 1080, s: 0.62, turn: 0.6, armR: 70, armL: 10, face: { name: 'happy' } });
  let o = view(cam, w);
  if (t > tp) o += introCard('PICKLE', 'best friend · neighbour', seg(t, tp, tp + 0.3), '#58B947', t, -1);
  return o;
}
function house(x, y, s, body, roof, winCol) {
  let o = S.rect(-300, -420, 600, 420, 8, ol(body, 8)) + S.path('M-340 -410 L0 -640 L340 -410 Z', ol(roof, 8));
  o += S.rect(-220, -330, 150, 130, 10, ol(winCol, 6)) + S.rect(70, -330, 150, 130, 10, ol(winCol, 6));
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function shotExt(t) {
  // two houses, a plank between the upstairs windows: Pickle's "door"
  const cam = camKeys(t, [[tExt, camAt(960, 540, 1.0)], [tDoor, camAt(990, 560, 1.3)]]);
  let w = S.rect(-800, -600, 3520, 2280, 0, { fill: 'url(#s02sky)' });
  w += S.circle(1650, 200, 90, { fill: '#FFF6C8' });
  w += S.rect(-800, 860, 3520, 600, 0, { fill: '#6FCB5A' }) + S.rect(-800, 860, 3520, 14, 0, { fill: '#8FE07A' });
  w += S.rect(-200, 700, 2320, 30, 0, { fill: '#FFFFFF' }) + S.rect(-200, 640, 2320, 14, 0, { fill: '#FFFFFF' });
  for (let x = -180; x < 2100; x += 60) w += S.rect(x, 620, 26, 110, 6, ol('#FFFFFF', 4));
  w += house(500, 880, 1.0, '#8C88E8', '#4846A8', '#FFE9A8') + house(1440, 880, 1.0, 'url(#s02brick)', '#E8604A', '#BFF0FF');
  w += S.g(S.rect(-120, -60, 240, 60, 8, ol('#FFD21F', 5)) + TF('TY', 0, -18, 34, '#151515'), 'translate(500 420)') + S.g(S.rect(-120, -60, 240, 60, 8, ol('#58B947', 5)) + TF('PICKLE', 0, -18, 34, '#FFFFFF'), 'translate(1440 420)');
  // plank from Pickle's window to Ty's window
  w += S.path('M710 600 L1230 600', ln(30, '#8A5A34')) + S.path('M710 600 L1230 600', ln(18, '#C98A5B'));
  const u = seg(t, tExt + 0.1, tDoor + 0.3);
  w += actor('pickle', t, { x: lerp(1220, 760, u), y: 590, s: 0.3, view: 'side', ...A.walk(t * 10, 1), face: { name: 'happy' }, shadow: false });
  for (let i = 0; i < 3; i++) w += S.path(`M${f(300 + i * 500 + ((t * 60 + i * 300) % 1600))} ${150 + i * 40} q20 -20 40 0 q20 -20 40 0`, ln(6));
  return view(cam, w);
}
function shotDoor(t) {
  // Pickle's front door: cobwebs, vines, a spider, a never-used doormat; smash-zoom on "door"
  const td = l11.word('door', 1).t0;
  const cam = t < td ? camKeys(t, [[tDoor, camAt(960, 560, 1.0)], [td, camAt(960, 560, 1.15)]]) : camKeys(t, [[td, camAt(960, 500, 1.7)], [tP12, camAt(960, 500, 1.8)]]);
  if (t >= td) { const sh = K.shake(t, td, 0.3, 14); cam.sx = sh.sx; cam.sy = sh.sy; }
  let w = S.rect(-800, -600, 3520, 2280, 0, { fill: 'url(#s02brick)' });
  w += S.rect(-800, 900, 3520, 600, 0, { fill: '#B9C2D0' }) + S.rect(-800, 880, 3520, 24, 0, ol('#9AA0AE', 5));
  w += S.rect(700, 160, 520, 740, 14, ol('#FFFFFF', 9)) + S.rect(730, 190, 460, 710, 8, ol('#3FAE5A', 7));
  w += S.rect(770, 230, 380, 260, 10, ol('#58C06A', 5)) + S.rect(770, 530, 380, 330, 10, ol('#58C06A', 5)) + S.circle(1130, 560, 18, ol('#FFD21F', 5));
  // cobwebs
  for (const [cx, cy, sx] of [[730, 190, 1], [1190, 190, -1]]) {
    let wb = '';
    for (let i = 1; i <= 4; i++) wb += S.path(`M0 ${i * 40} Q${i * 20} ${i * 20} ${i * 40} 0`, ln(3, '#FFFFFF', 0.8));
    for (const a of [0, 30, 60, 90]) wb += S.path(`M0 0 L${f(180 * Math.cos((a * Math.PI) / 180))} ${f(180 * Math.sin((a * Math.PI) / 180))}`, ln(3, '#FFFFFF', 0.8));
    w += S.g(wb, `translate(${cx} ${cy}) scale(${sx} 1)`);
  }
  const sy = 420 + Math.sin(t * 3) * 40;
  w += S.path(`M960 190 L960 ${f(sy)}`, ln(3, '#FFFFFF')) + S.circle(960, sy + 18, 22, { fill: '#151515' }) + S.circle(952, sy + 14, 5, { fill: '#FFF' }) + S.circle(968, sy + 14, 5, { fill: '#FFF' });
  for (let i = 0; i < 4; i++) w += S.path(`M${f(938 - i * 4)} ${f(sy + 12 + i * 8)} l-24 ${f(-6 + i * 6)} M${f(982 + i * 4)} ${f(sy + 12 + i * 8)} l24 ${f(-6 + i * 6)}`, ln(4));
  // vines
  for (let i = 0; i < 5; i++) w += S.path(`M${700 + i * 130} 160 Q${720 + i * 130} ${260 + i * 30} ${690 + i * 130} ${340 + i * 50}`, ln(10, '#2F8A3A')) + S.ellipse(700 + i * 130, 260 + i * 30, 20, 12, ol('#58C06A', 3));
  w += S.rect(780, 900, 360, 70, 10, ol('#C98A5B', 6)) + TF('WELCOME', 960, 948, 40, '#7A4A2A') + S.rect(780, 900, 360, 70, 10, { fill: '#9AA0AE', opacity: 0.45 });
  w += S.g(S.rect(-90, -60, 180, 120, 6, ol('#FFF6A0', 4)) + TF('opened:', 0, -12, 28, '#151515') + TF('NEVER', 0, 32, 40, '#E8243C'), 'translate(1350 520) rotate(6)');
  let o = view(cam, w);
  if (t >= td) o += bang('*CREAK*', 960, 300, seg(t, td + 0.05, td + 0.2), 90, -4, '#FFFFFF');
  return o;
}
function shotP12(t) {
  // Pickle on the bed: 12 ROBUX! (tiny counter, huge pride)
  const tr = l12.word('Robux').t0;
  const cam = camKeys(t, [[tP12, camAt(1520, 520, 1.45)], [tr, camAt(1560, 500, 1.55)], [tShoe, camAt(1560, 500, 1.6)]]);
  let w = bedroom(t, { open: true });
  const jump = Math.abs(Math.sin((t - tP12) * 7)) * 50;
  const purse = S.g(S.ellipse(0, 0, 40, 30, ol('#58B947', 5)) + S.path('M-20 -26 Q0 -50 20 -26', ln(5)) + coin(0, -40, 16, 0, t * 6), `translate(${f(A.hand(160, 1)[0])} ${f(A.hand(160, 1)[1] - 20)})`);
  w += actor('pickle', t, { x: 1560, y: 760, s: 0.5, lift: jump, armR: 160, armL: 60, face: { name: 'excited' }, shadow: false, props: [{ svg: purse, layer: 'front' }] }, { arms: false });
  let o = view(cam, w);
  const k = seg(t, tr, tr + 0.25);
  if (k > 0) o += S.g(K.counter(0, 0, 12, 1.8, '#3BFF6A') + K.F.sparkle(190, -80, 30) + K.F.sparkle(-200, 60, 20), `translate(520 300) rotate(-6) scale(${f(pop(k))})`) + bang('(that\'s it)', 520, 470, seg(t, tr + 0.4, tr + 0.55), 44, 6, '#FFFFFF');
  return o;
}
function shotShoe(t) {
  // the sock foot + the shoe fund; Ty and Mia trade a look
  const ts = l12.word('shoe').t0;
  const cam = camKeys(t, [[tShoe, camAt(1450, 560, 1.15)], [END, camAt(1450, 560, 1.22)]]);
  let w = bedroom(t, { open: true, door: 1 });
  const wig = Math.sin(t * 14) * 8;
  w += actor('pickle', t, { x: 1560, y: 760, s: 0.5, legL: 60 + wig, kneeL: 10, armL: 40, armR: 20, face: { name: 'happy' }, shadow: false });
  w += miaIn(t, 2180, 880, 0.5, { face: { name: 'deadpan' }, headRot: -8 }, {}, 5, 0.5);
  w += actor('ty', t, { x: 980, y: 1080, s: 0.62, turn: 0.5, armL: -30, armR: -30, face: { name: 'deadpan', eyes: { look: [0.6, 0] } } });
  let o = view(cam, w);
  const k = seg(t, ts - 0.3, ts);
  if (k > 0) {
    let inner = S.g(S.path('M-60 20 L-60 -30 Q-60 -50 -30 -50 L0 -50 L10 -20 L60 -10 Q80 0 70 20 Z', ol('#FF4D4D', 6)) + S.rect(-66, 14, 140, 18, 6, ol('#FFFFFF', 4)), 'translate(-90 -10)');
    inner += TF('SHOE FUND', 90, -40, 30, '#151515') + S.rect(20, -14, 150, 30, 15, ol('#E3E6F0', 4)) + S.rect(20, -14, 150 * 0.15, 30, 15, { fill: '#3BD16F' }) + TF('12 / 80', 95, 50, 28, '#151515');
    o += thought(1400, 230, 460, 260, inner, k, -200, 200);
  }
  // whip into SC 03
  o += C.speedLines(0, 1920, 540, 20, 9, '#FFFFFF', 1000).repeat(t > END - 0.18 ? 1 : 0);
  o += C.whiteFlash(seg(t, END - 0.12, END));
  return o;
}

// ---------------------------------------------------------------- router
function scene(t) {
  let o;
  if (t < tCheap) o = shotHi(t);
  else if (t < tWal) o = shotCheap(t);
  else if (t < tList) o = shotWallet(t);
  else if (t < tAv) o = shotList(t);
  else if (t < tLife) o = shotAvatar(t);
  else if (t < tSamp) o = shotLife(t);
  else if (t < tWrap) o = shotSamples(t);
  else if (t < tRet) o = shotWrap(t);
  else if (t < tPlan) o = shotReturn(t);
  else if (t < tFarm) o = shotPlan(t);
  else if (t < tFb1) o = shotFarm(t);
  else if (t < tFb2) o = shotFb1(t);
  else if (t < tFb3) o = shotFb2(t);
  else if (t < tLater) o = shotFb3(t);
  else if (t < tHeat) o = shotLater(t);
  else if (t < tBal) o = shotHeat(t);
  else if (t < tMia) o = shotBal(t);
  else if (t < tMia2) o = shotMia(t);
  else if (t < tMiaCard) o = shotMia2(t);
  else if (t < tHats) o = shotMia2(tMiaCard - 0.02) + introCard('MIA', 'sister · 16 · owns 412 hats', seg(t, tMiaCard, tMiaCard + 0.3), '#B79BE8', t, 1);
  else if (t < tFash) o = shotHats(t);
  else if (t < tPick) o = shotFash(t);
  else if (t < tExt) o = shotPick(t);
  else if (t < tDoor) o = shotExt(t);
  else if (t < tP12) o = shotDoor(t);
  else if (t < tShoe) o = shotP12(t);
  else o = shotShoe(t);
  // quick white whip flash at most cuts
  for (const tc of CUTS) if (Math.abs(t - tc) < 0.08) o += C.whiteFlash(0.35 * (1 - Math.abs(t - tc) / 0.08));
  return o;
}
function look(t) {
  if (t >= tPlan && t < tFb1) return { grade: 'night', vignette: 1 };
  if (t >= tFb1 && t < tLater) return { grade: null, vignette: 0.6 };
  if (t >= tBal && t < tMia) return { grade: null, vignette: 0.8 };
  return { grade: 'warm' };
}

module.exports = {
  scene, look, DEFS,
  // shared with SC 03 (and later scenes that come back to Ty's room)
  bedroom, crt, tower, keyboard, farmScreen, heatWaves, darkRoom, house, hat, HAT, HAT_KEYS, hatStack, miaIn, castIn, actorD, TY_STARTER, redX, stamp, introCard, thought, speech, mix, camAt, pop, OUT,
};
