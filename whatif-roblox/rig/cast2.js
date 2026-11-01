// More townsfolk: costume characters (banana dentist, hot dog), jetpack kid, hat lady, grandma.
'use strict';

const S = require('./svg');
const C = require('./palette');
const F = require('./face');
const L = require('./looks');
const { makeDesign, makeDraw } = require('./r6');
const { f } = S;

const LINE = C.line;
const ol = (fill, w = 7) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const ln = (w, c = LINE) => ({ fill: 'none', stroke: c, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });

// face window used by costume characters (dot eyes + mouth), centred at (0, cy)
function costumeFace(face, cy, opts = {}) {
  const fr = F.resolveFace(face);
  const w = opts.w || 190, h = opts.h || 230;
  let o = S.rect(-w / 2, cy - h / 2, w, h, 40, ol(opts.skin || '#F6CFA6', 7));
  const blink = fr.blink || 0;
  const wb = (e) => (blink > 0 && (!e.type || e.type === 'open') ? { ...e, upper: (e.upper || 0) + (1 - (e.upper || 0)) * blink } : e);
  o += L.dotEye(-44, cy - 30, wb(fr.eyeL), -1) + L.dotEye(44, cy - 30, wb(fr.eyeR), 1);
  o += L.strokeBrows((p) => p, cy - 78, fr.brows, {}, '#5A3A10', 10);
  o += F.mouth(fr.mouth, 0, cy + 50, 0.8, 0.8);
  o += F.faceFx(fr.fx.filter((x) => (typeof x === 'string' ? x : x.type) !== 'blush'), { fx: 0 });
  return o;
}

function costumeDesign(base, torsoFn, headFn) {
  const d = makeDesign(base);
  d.torso = (t, shade, back) => torsoFn(shade, back);
  d.head = (face) => headFn(face);
  d.headBack = () => '';
  d.headSide = (face) => headFn(face);
  d.torsoSide = (shade) => torsoFn(shade, false);
  d.dims = { ...(d.dims || {}), nametagY: -1290 };
  return d;
}

// ---------------------------------------------------------------- banana dentist
const BANANA_BODY = 'M-110 -290 Q-180 -640 -120 -980 Q-90 -1120 -30 -1170 L40 -1176 Q120 -1030 150 -760 Q170 -480 120 -290 Q0 -250 -110 -290 Z';
const banana = costumeDesign(
  { hair: 'none', eyeStyle: 'dot', top: 'tee', sleeve: 'none', pantsShape: 'straight', size: 1.15,
    col: { skin: '#FFE14D', skinShade: '#F0C52A', top: '#FFE14D', pants: '#FFE14D', pantsShade: '#F0C52A', sole: '#6B4A2A', soleShade: '#523820', toe: '#6B4A2A' } },
  (shade) => {
    let o = S.path(BANANA_BODY, ol('#FFE14D', 8));
    if (shade) o += S.path('M60 -1120 Q150 -800 100 -320', ln(16, '#F0C52A')) + S.path('M-70 -1080 Q-140 -700 -80 -320', ln(10, '#FFF3A0'));
    o += S.path('M-60 -1000 Q-110 -700 -70 -400 M40 -1100 Q110 -760 60 -360', ln(5, '#D9A400'));
    o += S.rect(-6, -1222, 40, 60, 10, { ...ol('#6B4A2A', 6), transform: 'rotate(12 14 -1190)' });
    return o;
  },
  (face) => {
    let o = costumeFace(face, -730, { w: 170, h: 220, skin: '#F6CFA6' });
    // dentist head mirror
    o += S.path('M-90 -870 L90 -870', ln(12, '#FFFFFF')) + S.circle(0, -880, 34, ol('#E3E8F0', 6)) + S.circle(0, -880, 16, { fill: '#FFFFFF' });
    return o;
  },
);

// ---------------------------------------------------------------- hot dog
const hotdog = costumeDesign(
  { hair: 'none', eyeStyle: 'dot', top: 'tee', sleeve: 'none', pantsShape: 'straight', size: 1.05,
    col: { skin: '#E8B26A', skinShade: '#C9904A', top: '#E8B26A', pants: '#3B4A8C', pantsShade: '#2E3A70', sole: '#FFFFFF', toe: '#E53950' } },
  (shade) => {
    let o = S.rect(-170, -1130, 340, 860, 150, ol('#E8B26A', 8));
    if (shade) o += S.rect(-150, -1110, 60, 800, 30, { fill: '#F5CC8C' });
    o += S.rect(-110, -1210, 220, 960, 110, ol('#D9483B', 8));
    if (shade) o += S.rect(-90, -1180, 40, 880, 20, { fill: '#F06A5A' });
    o += S.path('M-80 -1080 L60 -1040 L-70 -990 L70 -950 L-60 -900 M-70 -430 L70 -400 L-60 -360 L60 -330', ln(16, '#FFD21F'));
    return o;
  },
  (face) => costumeFace(face, -680, { w: 170, h: 210, skin: '#F6CFA6' }),
);

// ---------------------------------------------------------------- regular townsfolk
const jetkid = makeDesign({
  size: 0.85, hair: 'cap', eyeStyle: 'dot', top: 'hoodie', sleeve: 'long', pantsShape: 'straight', neutralMouth: 'bigGrin',
  brows: { L: [0, 0], R: [0, 0] },
  col: {
    skin: '#F3C9A2', skinShade: '#DDAA80', hair: '#3A2A1A', hairShade: '#241A10', hairHi: '#6A5040', brow: '#3A2A1A',
    cap: '#3BD16F', capShade: '#2BA857', capBrim: '#2BA857', capLogo: '#FFE14D', capHi: '#B6F5CC',
    top: '#FF8A1F', topShade: '#E06A0A', trim: '#FFFFFF', sleeve: '#FF8A1F', cuff: '#E06A0A',
    pants: '#3B8BFF', pantsShade: '#2A6CD6', sole: '#FFFFFF', toe: '#3BD16F', soleBand: '#3BD16F',
  },
});

const hatlady = makeDesign({
  hair: 'bob', longHair: true, notch: 44, lashes: true, blush: true, neutralMouth: 'smile', eye: { pupil: 1.1, cross: 0.4 },
  col: {
    hair: '#2B1D16', hairShade: '#1A110C', hairHi: '#5A3F31', skin: '#C98B5F', skinShade: '#A9714A',
    jacket: '#9D5CFF', jacketLine: '#6D3FD8', shirt: '#FFE14D', shirtShade: '#F0C52A', collar: '#FFE14D',
    pants: '#2B2F3A', pantsShade: '#1E2129', sole: '#FFFFFF', toe: '#9D5CFF', soleBand: '#9D5CFF',
  },
});

const grandma = makeDesign({
  size: 0.92, hair: 'buns', eyeStyle: 'dot', top: 'hoodie', sleeve: 'long', pantsShape: 'straight', brows: false, neutralMouth: 'smile',
  col: {
    skin: '#F6D7BE', skinShade: '#E2B998', hair: '#D9DCE3', hairShade: '#B9BEC9', hairHi: '#FFFFFF', accent: '#B06BFF',
    top: '#7FC8A9', topShade: '#5FA88A', trim: '#FFFFFF', sleeve: '#7FC8A9', cuff: '#5FA88A',
    pants: '#8A6A9E', pantsShade: '#6E5482', sole: '#FFFFFF', toe: '#8A6A9E',
  },
});

// ---------------------------------------------------------------- props for them
function jetpack(on = true, t = 0) {
  let o = S.rect(-190, -540, 90, 220, 30, ol('#C9CED8', 6)) + S.rect(100, -540, 90, 220, 30, ol('#C9CED8', 6)) + S.rect(-110, -520, 220, 40, 10, ol('#8A92A6', 5));
  if (on) for (const x of [-145, 145]) o += S.path(`M${x - 30} -320 Q${x} ${f(-170 - 40 * Math.sin(t * 40 + x))} ${x + 30} -320 Z`, ol('#FFB000', 5)) + S.path(`M${x - 14} -320 Q${x} ${f(-230 - 20 * Math.sin(t * 50 + x))} ${x + 14} -320 Z`, { fill: '#FFF3A0' });
  return o;
}

const HAT_COLS = ['#FF5A5A', '#FFB000', '#3BD16F', '#34C3FF', '#B06BFF', '#FF6FB5', '#2B2F3A', '#FFE14D'];
// tower of hats sitting on the head top (y ~ -900), n hats, swaying
function hatTower(n, t, sway = 1) {
  let o = '';
  let y = -900;
  for (let i = 0; i < n; i++) {
    const kind = i % 5, col = HAT_COLS[(i * 3) % HAT_COLS.length];
    const dx = Math.sin(t * 2.2 + i * 0.35) * i * 4 * sway;
    let hat = '';
    if (kind === 0) hat = S.rect(-150, -14, 300, 28, 12, ol(col, 6)) + S.rect(-90, -140, 180, 130, 10, ol(col, 6)) + S.rect(-90, -46, 180, 24, 0, { fill: '#151515', opacity: 0.4 });
    else if (kind === 1) hat = S.path('M-110 0 L0 -170 L110 0 Z', ol(col, 6)) + S.circle(0, -176, 18, ol('#FFFFFF', 4));
    else if (kind === 2) hat = S.path('M-140 0 Q0 -40 140 0 Q100 -30 80 -90 Q0 -120 -80 -90 Q-100 -30 -140 0 Z', ol(col, 6));
    else if (kind === 3) hat = S.path('M-100 0 L-100 -80 L-50 -40 L0 -110 L50 -40 L100 -80 L100 0 Z', ol('#FFC52E', 6));
    else hat = S.path('M-110 0 Q-110 -130 0 -130 Q110 -130 110 0 Z', ol(col, 6)) + S.circle(0, -140, 20, ol('#FFFFFF', 4));
    const h = [140, 170, 100, 110, 140][kind];
    o += S.g(hat, `translate(${f(dx)} ${f(y)})`);
    y -= h * 0.82;
  }
  return o;
}

function walker() {
  return S.path('M-150 -300 L-150 0 M150 -300 L150 0 M-150 -300 L150 -300 M-150 -160 L150 -160', ln(18, '#8A92A6')) +
    S.circle(-150, 0, 16, ol('#2B2F3A', 5)) + S.circle(150, 0, 16, ol('#2B2F3A', 5));
}

function sunglasses() { // dark shades over dot eyes (head space, front)
  return S.path('M-110 -735 L110 -735', ln(8)) + S.rect(-108, -742, 92, 50, 16, ol('#151515', 5)) + S.rect(16, -742, 92, 50, 16, ol('#151515', 5)) + S.rect(-96, -735, 30, 10, 4, { fill: '#FFFFFF', opacity: 0.6 });
}

const draw = {
  banana: makeDraw(banana), hotdog: makeDraw(hotdog), jetkid: makeDraw(jetkid), hatlady: makeDraw(hatlady), grandma: makeDraw(grandma),
};
const NAMES2 = { banana: 'Banana_Dentist', hotdog: 'HotDogDancer', jetkid: 'JetKid_99', hatlady: 'HatQueen37', grandma: 'Grandma' };

module.exports = { draw, NAMES2, jetpack, hatTower, walker, sunglasses, DESIGNS2: { banana, hotdog, jetkid, hatlady, grandma } };
