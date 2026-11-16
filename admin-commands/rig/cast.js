// The cast of "What If Roblox Shut Down FOREVER?" — all built on the R6 rig with the looks3.js hats,
// hair, accessories and outfits. Non-rig characters (the Lag, Buffer, Modbot) live in rig/lag.js.
'use strict';

const { makeDesign, makeDraw } = require('./r6');
const { drawCharacter } = require('./body');
const L3 = require('./looks3');
const LAG = require('./lag');
const { dress, keyRing, mop } = L3;

const D = {};
const design = (style) => dress(makeDesign(style));

// Juno — 11, narrator and builder: yellow hard hat with stickers, auburn pigtails, big round glasses,
// denim overalls (wrench in the bib pocket) over a red/white striped tee, pencil behind her ear
D.juno = design({
  hair: 'hardhat', eyeStyle: 'mid', top: 'overalls', sleeve: 'short', pantsShape: 'straight', size: 0.95,
  eye: { iris: '#9A5B22', pupil: 0.95 }, brows: { L: [-2, 2], R: [-2, 2] }, neutralMouth: 'smallSmile',
  acc: { specs: { type: 'round', col: '#3B2A55' } }, sleevePattern: '#E8453C', cuffs: '#8DB3E8',
  col: {
    skin: '#F6CFAE', skinShade: '#E5B48F', hair: '#8E3424', hairShade: '#6A2318', hairHi: '#C46A4E', brow: '#5A1E14',
    hat: '#FFC928', hatShade: '#E9A50E', hatHi: '#FFF1A6', tie: '#E8453C', pencil: '#FFB52E',
    top: '#FFFBF2', topShade: '#E9E2D2', sleeve: '#FFFBF2', stripe: '#E8453C',
    denim: '#3F72C0', denimShade: '#335FA5', stitch: '#FFC24A', button: '#FFC93C',
    pants: '#3F72C0', pantsShade: '#2F5A9E', sole: '#FFFFFF', soleShade: '#E3E3EE', toe: '#E8453C', soleBand: null,
  },
});

// Dex — 12, best friend, pro gamer, scared of stairs: electric-blue spikes, gamer headset,
// black "PRO 1" jersey, fingerless gloves, joggers, high-tops
D.dex = design({
  hair: 'proSpikes', eyeStyle: 'mid', top: 'proJersey', sleeve: 'short', pantsShape: 'straight', size: 1.0,
  eye: { iris: '#2E7DD1', pupil: 0.95 }, brows: { L: [-6, 0], R: [-6, 0] }, neutralMouth: 'smirk',
  acc: { headset3: { col: '#27C4FF', base: '#1B1D26', top: -1050 } },
  gloves: { col: '#1B1D26', trim: '#27C4FF' }, shoe: 'hightop',
  col: {
    skin: '#C98D6A', skinShade: '#B0754F', hair: '#1E8BFF', hairShade: '#1262C2', hairHi: '#8BE0FF', hairTip: '#6FE6FF', brow: '#0E3F8A',
    top: '#1C1E26', topShade: '#111318', sleeve: '#1C1E26', panel: '#27C4FF',
    pants: '#3E4352', pantsShade: '#2E323E', sole: '#FFFFFF', soleShade: '#DDE3EE', toe: '#1E8BFF', collar: '#1E8BFF', collarDim: '#1A6FCC',
  },
});

// Pip — 6, little brother: green dino hood up, missing front tooth, shorts, light-up sneakers, tail
D.pip = design({
  hair: 'dinoHood', eyeStyle: 'mid', top: 'dinoHoodie', sleeve: 'long', pantsShape: 'straight', size: 0.72,
  eye: { iris: '#6B4226', pupil: 1.12, sparkle: true }, brows: { L: [-8, 2], R: [-8, 2] }, neutralMouth: 'grin', blush: true,
  acc: { toothGap: true }, shorts: 82, socks: '#FFFFFF', shoe: 'lightup', tail: true,
  col: {
    skin: '#F8D4B4', skinShade: '#EBBC98', hair: '#B8692C', brow: '#7A3E14',
    top: '#5CC24A', topShade: '#45A037', sleeve: '#5CC24A', cuff: '#45A037', spike: '#C3F06A', belly: '#FFF1C4', bellyLine: '#E8CF8A',
    pants: '#34508A', pantsShade: '#28406F', sole: '#FFFFFF', soleShade: '#E0E4EE', toe: '#5CC24A', soleBand: '#3A3F52',
  },
});

// Grandpa Otto — bald under a grey-brown flat cap, big white beard, bushy brows, mustard cardigan, 100 keys
D.grandpa = design({
  hair: 'flatCap', eyeStyle: 'mid', top: 'shawlCardigan', sleeve: 'long', pantsShape: 'straight', size: 1.06,
  eye: { iris: '#4E7FB0', pupil: 0.85, upper: 0.1 }, brows: false, neutralMouth: 'smallSmile',
  acc: { bushyBrows: '#F4F3EF' }, shoe: 'loafer',
  col: {
    skin: '#EDC1A0', skinShade: '#D9A683', hair: '#E9E9EE', hairShade: '#C9C9D0', hairHi: '#FFFFFF',
    hat: '#8F7D64', hatShade: '#6F5F49', hatHi: '#B8A88A',
    beard: '#F6F5F1', beardShade: '#DCD8CE', beardType: 'big',
    top: '#E0A53A', topShade: '#C48A26', sleeve: '#E0A53A', cuff: '#C48A26', collar: '#EDBB5E', shirt: '#BFD8F2', shirtShade: '#9FBCE0', button: '#7A4E2C',
    pants: '#7A553A', pantsShade: '#5F422C', sole: '#5A3B26', soleShade: '#432B1B', toe: '#6E4A30',
  },
});

// Dad — brown beard, rectangular glasses, beige fishing bucket hat (with a lure), navy polo, khakis
const DAD = {
  hair: 'bucketHat', eyeStyle: 'dot', top: 'polo', sleeve: 'short', pantsShape: 'straight', size: 1.12,
  eye: { pupil: 1.05 }, brows: { L: [-2, 4], R: [-2, 4] }, neutralMouth: 'line',
  acc: { specs: { type: 'rect', col: '#26262E' } },
  col: {
    skin: '#E8B48E', skinShade: '#D29A72', hair: '#74492F', hairShade: '#573421', hairHi: '#9C6A4E', brow: '#4A2C1A',
    beard: '#7A4E34', beardShade: '#613C26', beardType: 'short',
    hat: '#E6D3A8', hatShade: '#C6B183', hatHi: '#FFF4D8', hatBand: '#7E7048',
    top: '#24365F', topShade: '#1A2848', sleeve: '#24365F', collar: '#30477A', logo: '#E6D3A8',
    pants: '#CDB98C', pantsShade: '#B09C70', sole: '#F2EEE6', soleShade: '#D6D0C4', toe: '#8A6A48',
  },
};
D.dad = design(DAD);
D.dadNoHat = design({ ...DAD, hair: 'dadHair', col: { ...DAD.col } });

// Mom — dark hair up in a messy bun with a pencil through it, teal cable-knit sweater
D.mom = design({
  hair: 'messyBun', eyeStyle: 'mid', lashes: true, top: 'cableKnit', sleeve: 'long', pantsShape: 'straight', size: 1.06,
  eye: { iris: '#4A7A3A', pupil: 0.9 }, brows: { L: [0, 0], R: [0, 0] }, neutralMouth: 'smallSmile',
  col: {
    skin: '#D9A07C', skinShade: '#C48A66', hair: '#2E2226', hairShade: '#1E1618', hairHi: '#64505A', brow: '#2E2226', accent: '#FF8FA8', pencil: '#FFC93C',
    top: '#1FA39A', topShade: '#17857D', sleeve: '#1FA39A', cuff: '#17857D',
    pants: '#6E7891', pantsShade: '#5A637A', sole: '#FFFFFF', soleShade: '#E3E3EE', toe: '#FF8A6B',
  },
});

// Brenda — news anchor: huge glossy bouffant, magenta blazer, pearls
D.anchor = design({
  hair: 'bouffant', eyeStyle: 'mid', lashes: true, top: 'blazer', sleeve: 'long', pantsShape: 'straight', size: 1.08,
  eye: { iris: '#3E7DC9', pupil: 0.9 }, brows: { L: [-8, 0], R: [-8, 0] }, neutralMouth: 'smile', acc: { pearls: true },
  col: {
    skin: '#F2C9A8', skinShade: '#DDB08C', hair: '#F2C14E', hairShade: '#D49A2A', hairHi: '#FFF0B8', brow: '#A8741E',
    top: '#D81B77', topShade: '#B3125F', sleeve: '#D81B77', cuff: '#B3125F', shirt: '#FFF4E6', button: '#FFC93C',
    pants: '#2A2433', pantsShade: '#1E1A26', sole: '#D81B77', soleShade: '#A8125A', toe: '#D81B77',
  },
});

// xX_StreamKing_Xx — backwards cap, white headset with a purple glow, neon green tee
D.streamer = design({
  hair: 'backCap', eyeStyle: 'mid', top: 'streamTee', sleeve: 'short', pantsShape: 'straight', size: 1.03,
  eye: { iris: '#6B4226', pupil: 1.05, sparkle: true }, brows: { L: [-12, -4], R: [-12, -4] }, neutralMouth: 'grin',
  acc: { headset3: { col: '#B45CFF', base: '#F2F2F7', top: -1050 } },
  col: {
    skin: '#F1C7A2', skinShade: '#DDAE88', hair: '#E2A63A', hairShade: '#C2862A', hairHi: '#FFD884', brow: '#A8701E',
    cap: '#6C3CE0', capShade: '#5128B8', capHi: '#A98BFF', capBrim: '#4A22A8', capLogo: '#FFD21F',
    top: '#6BFF3A', topShade: '#4ACB22', sleeve: '#6BFF3A',
    pants: '#2B2E3A', pantsShade: '#20222C', sole: '#FFFFFF', soleShade: '#E0E0E8', toe: '#6C3CE0',
  },
});

// sleepy gas-station cashier: red cap with a fuel-drop logo, red vest over a grey tee, name tag
D.cashier = design({
  hair: 'logoCap', eyeStyle: 'mid', top: 'vest', sleeve: 'short', pantsShape: 'straight', size: 1.06,
  eye: { iris: '#7A5A3A', upper: 0.46, pupil: 0.8 }, brows: { L: [-2, 8], R: [-2, 8] }, neutralMouth: 'line', acc: { eyebags: '#9A7AB8' },
  col: {
    skin: '#B98463', skinShade: '#A06B4B', hair: '#5A3A22', hairShade: '#432A18', hairHi: '#86603E', brow: '#3A2414',
    cap: '#E2343B', capShade: '#B8242A', capHi: '#FF8A8E', capBrim: '#C52A30', capLogo: '#E2343B',
    top: '#A9AFBC', topShade: '#8E95A3', sleeve: '#A9AFBC', vest: '#E2343B',
    pants: '#2F3E5C', pantsShade: '#24304A', sole: '#3A3A44', soleShade: '#2A2A32', toe: '#3A3A44',
  },
});

// Mr. Fig — math teacher: bald on top with fluffy sides, wire specs, green bow tie, purple argyle vest
D.teacher = design({
  hair: 'horseshoe', eyeStyle: 'dot', top: 'sweaterVest', sleeve: 'long', pantsShape: 'straight', size: 1.1,
  eye: { pupil: 0.95 }, brows: { L: [-4, 4], R: [-4, 4] }, neutralMouth: 'smallSmile',
  acc: { specs: { type: 'round', col: '#B08A3A', r: 40, x: 54, y: -712, sw: 6 } },
  col: {
    skin: '#F0C6A4', skinShade: '#DBAA86', hair: '#9A8A7A', hairShade: '#7A6A5A', hairHi: '#C8BAAA', brow: '#6A5A4A',
    top: '#FFFFFF', topShade: '#E3E6EE', sleeve: '#FFFFFF', cuff: '#E3E6EE',
    vest: '#7A4BB0', vestTrim: '#5E3590', argyle1: '#A97FDA', argyle2: '#5E3590', argyleLine: '#F2E6FF', bow: '#3FA34D',
    pants: '#5A5F6E', pantsShade: '#474B58', sole: '#3A2A22', soleShade: '#2A1E18', toe: '#3A2A22',
  },
});

// ---------------------------------------------------------------- crowds
const hashK = (i, k) => { const v = Math.sin((i + 1) * 91.7 + k * 13.3) * 43758.5453; return v - Math.floor(v); };
const pickK = (i, arr, k) => arr[Math.floor(hashK(i, k) * arr.length) % arr.length];
const PALETTE = ['#FF6B6B', '#4ECDC4', '#FFD166', '#6A4C93', '#1982C4', '#8AC926', '#FF924C', '#F15BB5', '#00BBF9', '#9B5DE5', '#F94144', '#43AA8B'];
const SKINS = [['#F8D9C0', '#EBC0A2'], ['#E9B38B', '#D29A72'], ['#C98D6A', '#B0754F'], ['#8D5A3B', '#764830'], ['#F2C9A0', '#DDB083'], ['#6B4430', '#573522']];
const HAIRC = ['#1E1A1C', '#5A3A22', '#E0A23A', '#C2452D', '#3A2A1A', '#2F4AA8', '#E870A8', '#7A4A2A'];
const shade = (hex, k = 0.82) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
const KID_HAIR = ['ponytail', 'puff', 'buzz', 'swoop', 'spiky', 'quiff', 'cap', 'buns', 'backCap', 'longStraight'];
const KID_TOP = ['tee', 'hoodie', 'jersey', 'polo', 'cableKnit', 'tee'];
function crowdCol(i, base) {
  const top = pickK(i, PALETTE, 1), pants = pickK(i, ['#2E3A55', '#5A6070', '#7A5A3A', '#3A6A9A', '#2B2B33', '#6E7891'], 2);
  const [skin, skinShade] = pickK(i, SKINS, 3);
  const hairC = pickK(i, HAIRC, 4), cap = pickK(i, PALETTE, 12);
  return {
    skin, skinShade, hair: hairC, hairShade: shade(hairC), hairHi: '#FFFFFF55', brow: shade(hairC, 0.7), accent: pickK(i, PALETTE, 14),
    cap, capShade: shade(cap), capBrim: shade(cap, 0.72), capLogo: '#FFD21F', hat: cap, hatShade: shade(cap), hatHi: '#FFFFFF66',
    top, topShade: shade(top), sleeve: top, cuff: shade(top), trim: '#FFFFFF', inner: '#FFFFFF', collar: shade(top, 0.9), shirt: '#FFFFFF', tie: pickK(i, PALETTE, 15),
    pants, pantsShade: shade(pants), sole: '#FFFFFF', soleShade: '#E0E0E8', toe: pickK(i, PALETTE, 13), logo: '#FFFFFF', ...base,
  };
}
function kidDesign(i) {
  return design({
    hair: pickK(i, KID_HAIR, 5), eyeStyle: hashK(i, 6) > 0.5 ? 'dot' : 'mid', top: pickK(i, KID_TOP, 7), sleeve: hashK(i, 8) > 0.5 ? 'short' : 'long', pantsShape: 'straight',
    eye: { iris: pickK(i, ['#5C3A1E', '#2E7DD1', '#3E8E41', '#7A4B2A'], 9) }, size: 0.82 + hashK(i, 10) * 0.18, number: String(1 + Math.floor(hashK(i, 16) * 98)),
    acc: hashK(i, 17) > 0.8 ? { specs: { type: hashK(i, 18) > 0.5 ? 'round' : 'rect', col: '#2A2A33', r: 48, x: 58, w: 96, h: 64 } } : {},
    col: crowdCol(i, {}),
  });
}
const ADULT_HAIR = ['buzz', 'swoop', 'longStraight', 'ponytail', 'horseshoe', 'puff', 'buzz', 'longStraight'];
const ADULT_TOP = ['polo', 'cableKnit', 'blazer', 'tee', 'sweaterVest', 'suit', 'polo'];
function adultDesign(i) {
  const hair = pickK(i, ADULT_HAIR, 21), top = pickK(i, ADULT_TOP, 22);
  const bearded = ['buzz', 'swoop', 'horseshoe'].includes(hair) && hashK(i, 23) > 0.55;
  const hairC = hair === 'horseshoe' || hashK(i, 24) > 0.85 ? pickK(i, ['#B9BAC2', '#8A8A92', '#D8D8DE'], 25) : pickK(i, HAIRC, 4);
  const vest = pickK(i, PALETTE, 26);
  return design({
    hair, eyeStyle: hashK(i, 27) > 0.5 ? 'dot' : 'mid', lashes: ['longStraight', 'ponytail'].includes(hair) && hashK(i, 28) > 0.4, top, sleeve: hashK(i, 29) > 0.5 ? 'short' : 'long', pantsShape: 'straight',
    eye: { iris: pickK(i, ['#5C3A1E', '#2E7DD1', '#3E8E41', '#7A4B2A'], 9), pupil: 0.9 }, size: 1.04 + hashK(i, 30) * 0.1, neutralMouth: pickK(i, ['line', 'smallSmile', 'smile'], 31),
    acc: hashK(i, 32) > 0.6 ? { specs: { type: hashK(i, 33) > 0.5 ? 'round' : 'rect', col: pickK(i, ['#2A2A33', '#7A4B2A', '#B08A3A'], 34), r: 50, x: 60, w: 100, h: 68 } } : {},
    col: crowdCol(i + 40, { hair: hairC, hairShade: shade(hairC), brow: shade(hairC, 0.7), vest, vestTrim: shade(vest), argyle1: shade(vest, 0.9), argyle2: shade(vest, 0.7), bow: pickK(i, PALETTE, 35), ...(bearded ? { beard: shade(hairC, 0.95), beardShade: shade(hairC, 0.8), beardType: 'short' } : {}) }),
  });
}
const kidCache = {}, adultCache = {};
function kid(i, pose) {
  if (!kidCache[i]) kidCache[i] = kidDesign(i);
  return drawCharacter(kidCache[i], pose);
}
function adult(i, pose) {
  if (!adultCache[i]) adultCache[i] = adultDesign(i);
  return drawCharacter(adultCache[i], pose);
}

// ---------------------------------------------------------------- draw functions
const draw = Object.fromEntries(Object.entries(D).map(([k, d]) => [k, makeDraw(d)]));
// Dad: pose.hat === false draws him without the bucket hat (same as draw.dadNoHat)
draw.dad = (pose = {}) => drawCharacter(pose.hat === false ? D.dadNoHat : D.dad, pose);
// Grandpa: his key ring hangs on the belt by default. pose.keys = false hides it;
// pose.keysSwing (deg) jingles it; pose.goldKey = false hides the golden key (after he hands it over).
draw.grandpa = (pose = {}) => {
  if (pose.keys === false) return drawCharacter(D.grandpa, pose);
  const view = pose.view || 'front';
  const ring = view === 'side'
    ? keyRing({ x: 26, y: -318, swing: pose.keysSwing || 0, gold: pose.goldKey !== false, s: 0.95 })
    : keyRing({ x: (view === 'back' ? -1 : 1) * 78 + (pose.turn || 0) * 18, y: -318, swing: pose.keysSwing || 0, gold: pose.goldKey !== false });
  return drawCharacter(D.grandpa, { ...pose, props: [...(pose.props || []), { svg: ring, layer: 'front' }] });
};
draw.kid = kid;
draw.adult = adult;
// non-rig characters (see rig/lag.js for their parameters)
draw.lag = LAG.lag;
draw.buffer = LAG.buffer;
draw.modbot = LAG.modbot;

const NAMES = {
  juno: 'Juno', dex: 'Dex', pip: 'Pip', grandpa: 'Grandpa Otto', dad: 'Dad', dadNoHat: 'Dad', mom: 'Mom',
  anchor: 'Brenda', streamer: 'xX_StreamKing_Xx', cashier: 'Cashier', teacher: 'Mr. Fig',
  lag: 'The LAG', buffer: 'Buffer', modbot: 'Modbot',
};

module.exports = { D, draw, NAMES, kidDesign, adultDesign, keyRing, mop, lag: LAG.lag, buffer: LAG.buffer, modbot: LAG.modbot };
