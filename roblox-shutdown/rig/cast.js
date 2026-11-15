// The cast of "What If Robux Became Real Money?" — all built on the R6 rig with the new looks (looks2.js).
'use strict';

const S = require('./svg');
const C = require('./palette');
const F = require('./face');
const { makeDesign, makeDraw } = require('./r6');
const { drawCharacter } = require('./body');
const { f } = S;
const LINE = C.line;
const outline = (fill, w = C.lineW) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });

const D = {};

// Ty — 12, the cheapest kid alive: teal beanie, black curls, mustard hoodie with a coin badge
D.ty = makeDesign({
  hair: 'beanie', eyeStyle: 'mid', top: 'hoodie', sleeve: 'long', pantsShape: 'straight', badge: 'coin',
  eye: { iris: '#8A5A2B', pupil: 0.9 }, brows: { L: [0, 0], R: [0, 0] }, neutralMouth: 'smallSmile',
  col: {
    skin: '#E9B38B', skinShade: '#D29A72', hair: '#1E1A1C', hairShade: '#141113', hairHi: '#4A4045', brow: '#1E1A1C',
    hat: '#1FB5A8', hatShade: '#168F85', hatHi: '#8FE8DF',
    top: '#F2B53A', topShade: '#D9962A', sleeve: '#F2B53A', cuff: '#D9962A', trim: '#FFFFFF',
    pants: '#7A8294', pantsShade: '#646B7B', sole: '#F4F6FA', soleShade: '#D7DCE6', toe: '#1FB5A8', soleBand: '#1FB5A8',
  },
});

// Mia — 16, sister: lilac top bun, half-lidded bored eyes, pastel cardigan, phone always out
D.mia = makeDesign({
  hair: 'topBun', eyeStyle: 'mid', lashes: true, top: 'cardigan', sleeve: 'long', pantsShape: 'straight',
  eye: { iris: '#7D5BD6', upper: 0.26, pupil: 0.9 }, brows: { L: [-6, 2], R: [-6, 2] }, neutralMouth: 'line', size: 1.04,
  col: {
    skin: '#F4D3BC', skinShade: '#E2B9A0', hair: '#B79BE8', hairShade: '#9B7FD1', hairHi: '#E4D8FF', brow: '#7A5FB8', accent: '#FF8FB8',
    top: '#F7B9CF', topShade: '#E79AB5', sleeve: '#F7B9CF', cuff: '#E79AB5', inner: '#FFFFFF', innerPrint: '#FF5A8A', trim: '#FFFFFF',
    pants: '#9EC3F0', pantsShade: '#83A8D8', sole: '#FFFFFF', soleShade: '#E3E3EE', toe: '#FF8FB8',
  },
});

// Pickle — 12, best friend: orange bowl cut, freckles, pickle hoodie, one shoe + one sock
D.pickle = makeDesign({
  hair: 'bowl', eyeStyle: 'dot', top: 'hoodie', sleeve: 'short', pantsShape: 'straight', badge: 'pickle', size: 0.95,
  eye: { pupil: 1.15, sparkle: true }, brows: { L: [-8, 4], R: [-8, 4] }, neutralMouth: 'smile',
  acc: { freckles: '#D9824B' }, sock: { side: -1, col: '#FFFFFF' },
  col: {
    skin: '#F8D9C0', skinShade: '#EBC0A2', hair: '#FF8A2B', hairShade: '#E06F12', hairHi: '#FFC08A', brow: '#C85E10',
    top: '#58B947', topShade: '#449A36', sleeve: '#58B947', trim: '#FFFFFF',
    pants: '#C7A97A', pantsShade: '#AE9063', sole: '#FF4D4D', soleShade: '#C93A3A', toe: '#FFFFFF',
  },
});

// Dad — moustache, shirt & loosened tie, coffee mug
D.dad = makeDesign({
  hair: 'shortPart', eyeStyle: 'dot', top: 'shirtTie', sleeve: 'short', pantsShape: 'straight', size: 1.1,
  brows: { L: [-2, 4], R: [-2, 4] }, neutralMouth: 'line', acc: { mustache: '#4A3426' },
  col: {
    skin: '#E0A985', skinShade: '#C98E6A', hair: '#4A3426', hairShade: '#36251A', hairHi: '#7A5A44', brow: '#4A3426',
    top: '#E6F0FF', topShade: '#C7D6EE', sleeve: '#E6F0FF', tie: '#D2364B', pocket: true,
    pants: '#2E3A55', pantsShade: '#232C42', sole: '#5A3B26', soleShade: '#432B1B', toe: '#5A3B26',
  },
});

// Mom — auburn waves, sunglasses parked on her head, teal cardigan, coupons
D.mom = makeDesign({
  hair: 'wavy', eyeStyle: 'mid', lashes: true, top: 'cardigan', sleeve: 'long', pantsShape: 'straight', size: 1.06,
  eye: { iris: '#5C3A1E', pupil: 0.9 }, brows: { L: [0, 0], R: [0, 0] }, neutralMouth: 'smallSmile', acc: { headGlasses: '#2A2A33' },
  col: {
    skin: '#B9805D', skinShade: '#A16B4B', hair: '#8B3A2E', hairShade: '#6E2C22', hairHi: '#C2665A', brow: '#5A231B',
    top: '#3FB3A6', topShade: '#2E968A', sleeve: '#3FB3A6', cuff: '#2E968A', inner: '#FFF4E0', trim: '#FFFFFF',
    pants: '#3B3F58', pantsShade: '#2C2F44', sole: '#E9E2D6', soleShade: '#CFC6B6', toe: '#3FB3A6',
  },
});

// Grandma (NanaBea) — grey bun, round purple glasses, pink gamer headset, heart sweater
D.grandma = makeDesign({
  hair: 'grayBun', eyeStyle: 'dot', top: 'sweater', sleeve: 'long', pantsShape: 'straight', size: 0.98,
  eye: { pupil: 0.9 }, brows: { L: [-4, 6], R: [-4, 6] }, neutralMouth: 'smallSmile', acc: { roundGlasses: '#7A4BD1', headset: '#FF4D8D' },
  col: {
    skin: '#F2D7C6', skinShade: '#DDBBA6', hair: '#C9CBD4', hairShade: '#A9ABB6', hairHi: '#F1F2F6', brow: '#9A9CA8',
    top: '#8E6BD8', topShade: '#7454BE', sleeve: '#8E6BD8', cuff: '#7454BE', trim: '#FFFFFF',
    pants: '#B9A6E8', pantsShade: '#A08BD6', sole: '#FFFFFF', soleShade: '#E3E3EE', toe: '#8E6BD8',
  },
});

// the Thirty Percent Guy — tiny goblin accountant: visor, ears, big nose, suit, green tie, calculator
D.thirty = makeDesign({
  hair: 'visor', eyeStyle: 'dot', top: 'suit', sleeve: 'long', pantsShape: 'straight', size: 0.7,
  eye: { upper: 0.12, pupil: 1.05, sparkle: true }, brows: { L: [12, -10], R: [12, -10] }, neutralMouth: 'smirk', acc: { goblinEars: true, goblinNose: true },
  col: {
    skin: '#8DCB54', skinShade: '#6FAE3C', hair: '#9AA0A8', hairShade: '#7E848C', hairHi: '#C9CED6', brow: '#3E5A1E',
    top: '#2B2F3A', topShade: '#1F222B', sleeve: '#2B2F3A', cuff: '#FFFFFF', shirt: '#FFFFFF', tie: '#3FD06B',
    pants: '#2B2F3A', pantsShade: '#1F222B', sole: '#1A1A1E', soleShade: '#101013', toe: '#1A1A1E',
  },
});

// news anchor Chip — glossy hair, navy suit
D.anchor = makeDesign({
  hair: 'slick', eyeStyle: 'dot', top: 'suit', sleeve: 'long', pantsShape: 'straight', size: 1.08,
  brows: { L: [-4, 2], R: [-4, 2] }, neutralMouth: 'bigGrin',
  col: {
    skin: '#D9A07A', skinShade: '#C08660', hair: '#2E2A28', hairShade: '#1F1C1A', hairHi: '#8C807A', brow: '#2E2A28',
    top: '#1F3B73', topShade: '#172C57', sleeve: '#1F3B73', cuff: '#FFFFFF', shirt: '#FFFFFF', tie: '#E23B4E', pocket: '#FFFFFF',
    pants: '#1F3B73', pantsShade: '#172C57', sole: '#1A1A1E', soleShade: '#101013', toe: '#1A1A1E',
  },
});

// the FREE ROBUX scammer — trench coat; his head is a blinking sign
D.scammer = makeDesign({
  hair: 'none', eyeStyle: 'dot', top: 'suit', sleeve: 'long', pantsShape: 'straight', size: 1.08,
  col: {
    skin: '#C9B39A', skinShade: '#B39C82', top: '#B08A5A', topShade: '#94724A', sleeve: '#B08A5A', cuff: '#94724A', shirt: '#3A2E2A', tie: '#FFD21F',
    pants: '#3A3440', pantsShade: '#2B2630', sole: '#1A1A1E', soleShade: '#101013', toe: '#1A1A1E',
  },
});
function signHead(face = {}) {
  const on = face.signOn ?? 1;
  const glow = on > 0.5 ? '#FFE14D' : '#8A7A2A';
  let o = S.rect(-18, -640, 36, 90, 6, outline('#555A66', 6));
  o += S.rect(-205, -990, 410, 360, 26, outline('#1A1530', 9));
  o += S.rect(-188, -972, 376, 324, 18, { fill: 'none', stroke: on > 0.5 ? '#FF4DA6' : '#5A2A44', 'stroke-width': 8, 'stroke-dasharray': '2 14', 'stroke-linecap': 'round' });
  const txt = (s, y, size, fill) => S.el('text', { x: 0, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', stroke: '#1A1530', 'stroke-width': size * 0.08, 'paint-order': 'stroke' }, s);
  o += txt('FREE', -846, 132, glow) + txt('ROBUX', -716, 112, on > 0.5 ? '#3BD16F' : '#2A5A36');
  if (on > 0.5) o += S.rect(-205, -990, 410, 360, 26, { fill: '#FFE14D', opacity: 0.08 });
  const m = face.mouth;
  if (m && m !== 'X' && m !== 'line') o += S.rect(-60, -668, 120, 14, 7, { fill: glow, opacity: 0.9 });
  return o;
}
D.scammer.head = (face) => signHead(face);
D.scammer.headSide = (face) => S.g(signHead(face), 'scale(0.35 1)');
D.scammer.headBack = () => S.rect(-18, -640, 36, 90, 6, outline('#555A66', 6)) + S.rect(-205, -990, 410, 360, 26, outline('#2B2640', 9));

// Jeeves 3000 — chrome robot butler with a screen face and a bow tie
D.butler = makeDesign({
  hair: 'none', eyeStyle: 'dot', top: 'robot', sleeve: 'none', pantsShape: 'straight', size: 1.02,
  col: {
    skin: '#C9D1DC', skinShade: '#A7B1BF', top: '#C9D1DC', topShade: '#A7B1BF',
    pants: '#B5BECB', pantsShade: '#98A2B1', sole: '#5B6577', soleShade: '#465062', toe: '#5B6577',
  },
});
function robotHead(face = {}) {
  const fr = F.resolveFace(face);
  let o = S.path('M0 -892 L0 -960', { stroke: LINE, 'stroke-width': 10 }) + S.circle(0, -972, 18, outline('#FF4D6D', 6));
  o += S.rect(-150, -892, 300, 336, 54, outline('#C9D1DC'));
  o += S.rect(-118, -850, 236, 228, 36, outline('#1C2333', 7));
  const ec = (fr.name === 'angry' || fr.name === 'cold') ? '#FF4D6D' : '#5CF2FF';
  const happy = ['happy', 'joy', 'excited', 'proud'].includes(fr.name);
  for (const sx of [-1, 1]) {
    if (happy) o += S.path(`M${sx * 50 - 26} -742 Q${sx * 50} -786 ${sx * 50 + 26} -742`, { fill: 'none', stroke: ec, 'stroke-width': 10, 'stroke-linecap': 'round' });
    else o += S.rect(sx * 50 - 20, -780, 40, 46, 10, { fill: ec });
  }
  const m = fr.mouth;
  const open = m && !['line', 'smile', 'smallSmile', 'X', 'neutral'].includes(m);
  o += open ? S.rect(-44, -694, 88, 30, 10, { fill: ec }) : S.path('M-44 -680 L44 -680', { stroke: ec, 'stroke-width': 9, 'stroke-linecap': 'round' });
  for (const sx of [-1, 1]) o += S.circle(sx * 152, -724, 24, outline('#A7B1BF', 6));
  // bow tie under the head
  o += S.path('M0 -540 L-58 -568 L-58 -512 Z M0 -540 L58 -568 L58 -512 Z', outline('#1A1A22', 5)) + S.circle(0, -540, 13, outline('#1A1A22', 5));
  return o;
}
D.butler.head = (face) => robotHead(face);
D.butler.headSide = (face) => S.g(robotHead(face), 'scale(0.55 1) translate(-30 0)');
D.butler.headBack = () => S.rect(-150, -892, 300, 336, 54, outline('#B5BECB')) + S.path('M0 -892 L0 -960', { stroke: LINE, 'stroke-width': 10 }) + S.circle(0, -972, 18, outline('#FF4D6D', 6));

// random background kids for crowds
const KID_HAIR = ['spiky', 'quiff', 'cap', 'buns', 'bowl', 'topBun', 'shortPart', 'beanie'];
const KID_TOP = ['hoodie', 'tee', 'jersey', 'cardigan', 'sweater'];
const PALETTE = ['#FF6B6B', '#4ECDC4', '#FFD166', '#6A4C93', '#1982C4', '#8AC926', '#FF924C', '#F15BB5', '#00BBF9', '#9B5DE5'];
const SKINS = [['#F8D9C0', '#EBC0A2'], ['#E9B38B', '#D29A72'], ['#C98D6A', '#B0754F'], ['#8D5A3B', '#764830'], ['#F2C9A0', '#DDB083']];
const HAIRC = ['#1E1A1C', '#5A3A22', '#E0A23A', '#C2452D', '#3A2A1A', '#2F4AA8', '#E870A8'];
function kidDesign(i) {
  const h = (k) => { const v = Math.sin((i + 1) * 91.7 + k * 13.3) * 43758.5453; return v - Math.floor(v); };
  const pick = (arr, k) => arr[Math.floor(h(k) * arr.length) % arr.length];
  const top = pick(PALETTE, 1), pants = pick(['#2E3A55', '#5A6070', '#7A5A3A', '#3A6A9A', '#2B2B33'], 2);
  const [skin, skinShade] = pick(SKINS, 3);
  const hairC = pick(HAIRC, 4);
  return makeDesign({
    hair: pick(KID_HAIR, 5), eyeStyle: h(6) > 0.5 ? 'dot' : 'mid', top: pick(KID_TOP, 7), sleeve: h(8) > 0.5 ? 'short' : 'long', pantsShape: 'straight',
    eye: { iris: pick(['#5C3A1E', '#2E7DD1', '#3E8E41', '#7A4B2A'], 9) }, size: 0.86 + h(10) * 0.18,
    col: {
      skin, skinShade, hair: hairC, hairShade: hairC, hairHi: '#FFFFFF55', brow: hairC, hat: pick(PALETTE, 11), hatShade: '#0003', hatHi: '#FFFFFF66',
      cap: pick(PALETTE, 12), top, topShade: top, sleeve: top, trim: '#FFFFFF', inner: '#FFFFFF',
      pants, pantsShade: pants, sole: '#FFFFFF', soleShade: '#E0E0E8', toe: pick(PALETTE, 13),
    },
  });
}
const kidCache = {};
function kid(i, pose) {
  if (!kidCache[i]) kidCache[i] = kidDesign(i);
  return drawCharacter(kidCache[i], pose);
}

const draw = Object.fromEntries(Object.entries(D).map(([k, d]) => [k, makeDraw(d)]));
draw.kid = kid;
const NAMES = { ty: 'Ty', mia: 'Mia', pickle: 'Pickle', dad: 'Dad', mom: 'Mom', grandma: 'NanaBea', thirty: '30%', anchor: 'Chip', scammer: 'FreeRobux4U', butler: 'Jeeves3000' };

module.exports = { D, draw, NAMES, kidDesign };
