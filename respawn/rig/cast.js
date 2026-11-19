// The cast of "What If You Had ADMIN COMMANDS in Real Life?" — all built on the R6 rig.
// YOU is the channel hero: the default r6.js construction (BASE_STYLE) with his jacket/T-shirt/pants colours only.
// Everyone else uses the looks4.js hair, accessories, torsos (incl. skirts/aprons/robes), arms, legs and props.
// Pancake and the city cats live in rig/cats.js (non-rig).
'use strict';

const S = require('./svg');
const { makeDesign, makeDraw } = require('./r6');
const { drawCharacter, BASE_DEFAULTS } = require('./body');
const L3 = require('./looks3');
const L4 = require('./looks4');
const { f } = S;

const D = {};
const design = (style) => L4.dress4(L3.dress(makeDesign(style)));

// ---------------------------------------------------------------- YOU (the hero) — DO NOT REDESIGN: only these colours
D.you = makeDesign({
  col: { jacket: '#D8262E', jacketLine: '#B01D24', shirt: '#F2D04A', shirtShade: '#D9B73A', pants: '#1F3B2A', pantsShade: '#162C1F' },
});

// ---------------------------------------------------------------- Zoe — best friend, 12
// purple bob + lightning clip, giant black-rimmed glasses, orange hoodie with a mouse-cursor print, purple high-tops
D.zoe = design({
  hair: 'zoeBob', eyeStyle: 'mid', top: 'cursorHoodie', sleeve: 'long', pantsShape: 'straight', size: 0.95,
  eye: { iris: '#7A4FD0', pupil: 0.95 }, brows: { L: [-2, 0], R: [-2, 0] }, neutralMouth: 'smirk', shoe: 'hightop',
  acc: { specs: { type: 'rect', col: '#141418', sw: 12, w: 118, h: 126, r: 30, x: 64, y: -704 } },
  col: {
    skin: '#D9A27A', skinShade: '#C48A62', hair: '#7B52D6', hairShade: '#5E38B4', hairHi: '#A98BFF', brow: '#3E2380', clip: '#FFD23F',
    top: '#FF8A2A', topShade: '#E26F14', sleeve: '#FF8A2A', cuff: '#E26F14', trim: '#FFFFFF',
    pants: '#2E3A66', pantsShade: '#232C50', sole: '#FFFFFF', soleShade: '#E0E0EA', toe: '#FFFFFF', collar: '#7B52D6', collarDim: '#5E38B4',
  },
});

// ---------------------------------------------------------------- Brick — the bully: huge, boxy, backwards trucker cap, tank top, brick fists
D.brick = design({
  hair: 'truckerBack', eyeStyle: 'dot', top: 'tank', sleeve: 'none', pantsShape: 'straight', size: 1.3,
  torsoW: 128, taper: 12, armW: 1.32, legW: 1.28, fist: true, hipK: 1.22, shoe: 'chunky',
  eye: { pupil: 0.72 }, brows: false, browBase: { L: [8, -4], R: [8, -4] },
  acc: { blockBrows: '#3A2618' },
  col: {
    skin: '#F0BE96', skinShade: '#DDA67C', skinShade2: '#B07A54', hair: '#5A3A22', hairShade: '#43291A', hairHi: '#86603E',
    cap: '#B8BCC6', capShade: '#8E93A0', capHi: '#FFFFFF66', capFront: '#8E2236', capBrim: '#6A1828', capBand: '#6A1828', strap: '#2A2A33',
    top: '#ECE8DE', topShade: '#CFCBC0',
    pants: '#3B4A6B', pantsShade: '#2E3A55', sole: '#FFFFFF', soleShade: '#DDDDE6', toe: '#22222A', swoosh: '#E0453A',
  },
});

// ---------------------------------------------------------------- Dad — works from home: shirt + tie on top, duck pyjamas below, office headset
const DAD = {
  hair: 'dadDome', eyeStyle: 'dot', top: 'wfhShirt', sleeve: 'long', pantsShape: 'straight', size: 1.12, torsoW: 104,
  eye: { pupil: 1.0 }, brows: { L: [-4, 4], R: [-4, 4] }, neutralMouth: 'line', pattern: 'ducks', shoe: 'slipper',
  acc: { specs: { type: 'rect', col: '#2A2A33', sw: 8, w: 100, h: 72, r: 14, x: 58, y: -708 }, officeHeadset: { col: '#2B2E3A', acc: '#36C2F2' } },
  col: {
    skin: '#F6D2B4', skinShade: '#E6B994', hair: '#4A3324', hairShade: '#3A271B', hairHi: '#7A5A44', brow: '#3A271B',
    top: '#A8D0F2', topShade: '#86B3DD', sleeve: '#A8D0F2', cuff: '#86B3DD', collar: '#FFFFFF', tie: '#D64545', tieStripe: '#F2C14E',
    pants: '#8FD3C1', pantsShade: '#74BBA8', sole: '#7A5236', soleShade: '#5E3E28', toe: '#5E3E28',
  },
};
D.dad = design(DAD);
D.dadNoHeadset = design({ ...DAD, acc: { specs: DAD.acc.specs } });

// ---------------------------------------------------------------- Mom — neat ponytail, coral blouse, sky-blue apron covered in sticky notes
D.mom = design({
  hair: 'ponyNeat', eyeStyle: 'mid', lashes: true, top: 'apronTop', sleeve: 'long', pantsShape: 'straight', size: 1.06,
  eye: { iris: '#3E8E7E', pupil: 0.92 }, brows: { L: [0, 0], R: [0, 0] }, neutralMouth: 'smallSmile', shoe: 'sneaker',
  ext: { kind: 'apron', top: -330, len: 168, flare: 10, col: '#6EC3E8', trim: '#FFFFFF' },
  col: {
    skin: '#F8D6BC', skinShade: '#E8BC9C', hair: '#C2552A', hairShade: '#9E3E1C', hairHi: '#E8865A', brow: '#8E3418', accent: '#2FB5A8',
    top: '#F27A6B', topShade: '#D9604F', sleeve: '#F27A6B', cuff: '#D9604F', collar: '#FFFFFF', apron: '#6EC3E8', apronTrim: '#FFFFFF',
    pants: '#2E3A55', pantsShade: '#232C44', sole: '#FFFFFF', soleShade: '#E3E3EE', toe: '#F27A6B',
  },
});

// ---------------------------------------------------------------- Granny — 91: fluffy white curls, lilac cardigan, glasses on a chain, teal skirt, fluffy slippers
const GRANNY = {
  hair: 'granCurls', eyeStyle: 'dot', top: 'grannyCard', sleeve: 'long', pantsShape: 'straight', size: 0.86,
  eye: { pupil: 0.95 }, brows: { L: [-6, 4], R: [-6, 4] }, neutralMouth: 'smallSmile', shoe: 'fluffy',
  acc: { specs: { type: 'round', col: '#B9852F', sw: 7, r: 46, x: 56, y: -710 }, specChain: '#E7B54A', cheekBlush: '#FF8FA3' },
  ext: { kind: 'skirt', top: -326, len: 156, flare: 26, col: '#3E7F86', shade: '#2F666C', trim: '#5FA3A8', under: true },
  col: {
    skin: '#F6D8C4', skinShade: '#E6BEA6', hair: '#F7F5FB', hairShade: '#CFC8E0', hairHi: '#FFFFFF', brow: '#BDB4D0',
    top: '#B98ED8', topShade: '#9C70BE', sleeve: '#B98ED8', cuff: '#9C70BE', inner: '#FFFFFF', button: '#FFFFFF', brooch: '#2FB5A8',
    pants: '#EAC9B2', pantsShade: '#D8B098', sole: '#FF9CC2', soleShade: '#E67AA6', toe: '#FFC6DC', pom: '#FFFFFF',
  },
};
D.granny = design(GRANNY);
D.grannyFast = design({ ...GRANNY, hair: 'granCurlsFast' });

// ---------------------------------------------------------------- the Old Man from the garage sale (secretly the Admin) — tiny, long white beard, droopy brows, grey cardigan
D.oldman = design({
  hair: 'wispy', eyeStyle: 'mid', top: 'oldCard', sleeve: 'long', pantsShape: 'straight', size: 0.75,
  eye: { iris: '#5FA8E8', pupil: 0.9, sparkle: true, upper: 0.16 }, brows: false, neutralMouth: 'smirk', shoe: 'slipper', elbowPatch: '#6E737E',
  acc: { droopBrows: '#F4F3F8' },
  ext: { kind: 'coat', top: -330, len: 76, flare: 8, col: '#9AA0AC', shade: '#7E8592', pin: true },
  col: {
    skin: '#F2D2BC', skinShade: '#E0B89E', hair: '#F4F3F8', hairShade: '#CFCBDA', hairHi: '#FFFFFF',
    beard: '#F4F3F8', beardShade: '#D6D2E2', longBeard: true,
    top: '#9AA0AC', topShade: '#7E8592', sleeve: '#9AA0AC', cuff: '#7E8592', inner: '#F1E6CC', innerShade: '#D8CBA8', button: '#9A6A3E',
    pants: '#7A5A3E', pantsShade: '#5E4430', sole: '#4A3226', soleShade: '#36241A', toe: '#6E4C34',
  },
});

// ---------------------------------------------------------------- the ADMIN — tall, robe and cape of glowing code, crown with an ADMIN plaque, a head of pure light
D.admin = design({
  hair: 'none', eyeStyle: 'mid', top: 'codeRobe', sleeve: 'bell', pantsShape: 'straight', size: 1.4, shoe: 'boot',
  ext: { kind: 'robe', top: -330, len: 284, flare: 74, col: '#FBFAF4', inner: '#FFF6DA', under: true },
  col: {
    skin: '#FFFDF2', skinShade: '#F3EAC8', top: '#FBFAF4', topShade: '#E9E6F2', sleeve: '#FBFAF4', inner: '#FFF6DA', cape: '#F4F2FA',
    gold: '#FFC93C', goldShade: '#E7A21A', gem: '#4FD1FF',
    pants: '#FBFAF4', pantsShade: '#E9E6F2', sole: '#FFFFFF', soleShade: '#E3E0EC', toe: '#FFC93C',
  },
});
D.admin.head = () => '';
D.admin.headSide = () => '';
D.admin.headBack = () => '';
D.admin.over = (face, t, shade, view) => L4.adminHead(face, t, shade, view);
D.admin.dims.nametagY = -1140;
// a being of light: no vinyl volume filter (also keeps him cheap when he fills the frame); pass volume: true to force it
D.admin.defaults = { volume: false };

// ---------------------------------------------------------------- Rex Ratings — TV news anchor: perfect pompadour, burgundy double-breasted suit
D.anchor = design({
  hair: 'pompadour', eyeStyle: 'mid', top: 'suit4', suitKind: 'double', sleeve: 'long', pantsShape: 'straight', size: 1.1, shoe: 'dress',
  eye: { iris: '#3A7BD5', pupil: 0.9, sparkle: true }, brows: { L: [-10, -2], R: [-10, -2] }, neutralMouth: 'grin',
  col: {
    skin: '#E2A57C', skinShade: '#CC8D64', hair: '#1F2433', hairShade: '#141824', hairHi: '#6E7FA8', hairStreak: '#DDE3EE', brow: '#1F2433',
    top: '#8E1F3F', topShade: '#6E1530', sleeve: '#8E1F3F', cuff: '#FFFFFF', shirt: '#FFFFFF', tie: '#F2C14E', tieStripe: '#C99A2E', pocket: '#F2C14E', button: '#F2C14E',
    pants: '#2A2230', pantsShade: '#1E1824', sole: '#1A1A1E', soleShade: '#101013', toe: '#1A1A1E',
  },
});

// ---------------------------------------------------------------- Mr. Gray — Dad's boss (video call): grey everything, bored lids, eye bags, moustache
D.boss = design({
  hair: 'grayPart', eyeStyle: 'dot', top: 'suit4', suitKind: 'single', sleeve: 'long', pantsShape: 'straight', size: 1.08, shoe: 'dress',
  eye: { pupil: 0.85, upper: 0.44 }, brows: { L: [6, 2], R: [6, 2] }, neutralMouth: 'line',
  acc: { eyebags: '#A8A0B8', mustache: '#8E9099' },
  col: {
    skin: '#E8D2C2', skinShade: '#D2B8A6', hair: '#A9ADB8', hairShade: '#8A8E9A', hairHi: '#D2D6DE', brow: '#6E727E',
    top: '#7D828E', topShade: '#666B76', sleeve: '#7D828E', cuff: '#E6E8EE', shirt: '#E6E8EE', tie: '#565B67', tieStripe: '#6E7380',
    pants: '#666B76', pantsShade: '#555A64', sole: '#2A2A30', soleShade: '#1E1E24', toe: '#2A2A30',
  },
});

// ---------------------------------------------------------------- Principal Pratt — strict: flat-top, navy blazer with the school crest, tie, coffee mug
D.principal = design({
  hair: 'flatTop', eyeStyle: 'dot', top: 'suit4', suitKind: 'single', crest: true, sleeve: 'long', pantsShape: 'straight', size: 1.14, torsoW: 96, shoe: 'dress',
  eye: { pupil: 0.9, upper: 0.14 }, brows: { L: [10, -6], R: [10, -6] }, neutralMouth: 'line',
  col: {
    skin: '#B97E5C', skinShade: '#A2694A', hair: '#34343E', hairShade: '#24242C', hairHi: '#6A6A78', brow: '#24242C',
    top: '#2B3A67', topShade: '#1F2B4E', sleeve: '#2B3A67', cuff: '#FFFFFF', shirt: '#FFFFFF', tie: '#8E1F2E', tieStripe: '#C9A04A', crest: '#E9C25A',
    pants: '#2B3A67', pantsShade: '#1F2B4E', sole: '#1A1A1E', soleShade: '#101013', toe: '#1A1A1E',
  },
});

// ---------------------------------------------------------------- Coach Hale — teal tracksuit with stripes, navy "H" cap, whistle on a lanyard, moustache
D.coach = design({
  hair: 'coachCap', eyeStyle: 'dot', top: 'tracksuit', sleeve: 'long', pantsShape: 'straight', size: 1.12, torsoW: 108,
  eye: { pupil: 0.9 }, brows: { L: [6, -4], R: [6, -4] }, neutralMouth: 'line', trackStripe: '#FFFFFF', pattern: 'stripe', stripeCol: '#FFFFFF', shoe: 'sneaker',
  acc: { mustache: '#7A5236' },
  col: {
    skin: '#F0C2A0', skinShade: '#DCA882', hair: '#A3A3AD', hairShade: '#84848E', hairHi: '#D0D0D8', brow: '#6A4A34',
    cap: '#1E3A8A', capShade: '#16306E', capHi: '#FFFFFF44', capBrim: '#16306E', capLogo: '#FFD23F',
    top: '#1C9C8C', topShade: '#157A6E', sleeve: '#1C9C8C', cuff: '#157A6E', panel: '#0F6E62', lanyard: '#E8453C',
    pants: '#1C9C8C', pantsShade: '#157A6E', sole: '#FFFFFF', soleShade: '#E0E0EA', toe: '#1E3A8A',
  },
});

// ---------------------------------------------------------------- crowds (new random designs from looks4 pieces only)
const hashK = (i, k) => { const v = Math.sin((i + 1) * 91.7 + k * 13.3) * 43758.5453; return v - Math.floor(v); };
const pickK = (i, arr, k) => arr[Math.floor(hashK(i, k) * arr.length) % arr.length];
const PALETTE = ['#FF6B6B', '#4ECDC4', '#FFD166', '#6A4C93', '#1982C4', '#8AC926', '#FF924C', '#F15BB5', '#00BBF9', '#9B5DE5', '#F94144', '#43AA8B', '#2EC4B6', '#E76F51'];
const SKINS = [['#F8D9C0', '#EBC0A2'], ['#E9B38B', '#D29A72'], ['#C98D6A', '#B0754F'], ['#8D5A3B', '#764830'], ['#F2C9A0', '#DDB083'], ['#6B4430', '#573522'], ['#FFE3CF', '#F0C9AE']];
const HAIRC = ['#1E1A1C', '#5A3A22', '#E0A23A', '#C2452D', '#3A2A1A', '#2F4AA8', '#E870A8', '#7A4A2A', '#2E8B57'];
const shade = (hex, k = 0.82) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
const KID_HAIR = ['crop', 'curlTop', 'twists', 'twinTails', 'lowBun', 'mohawk', 'crop', 'twinTails'];
const KID_TOP = ['raglan', 'stripeTee', 'zipHoodie', 'plaid', 'puffer', 'raglan', 'stripeTee'];
const KID_SHOE = ['sneaker', 'hightop', 'sneaker', 'chunky'];
function crowdCol(i, base) {
  const top = pickK(i, PALETTE, 1), pants = pickK(i, ['#2E3A55', '#5A6070', '#7A5A3A', '#3A6A9A', '#2B2B33', '#6E7891', '#4A5A3A'], 2);
  const [skin, skinShade] = pickK(i, SKINS, 3);
  const hairC = pickK(i, HAIRC, 4), acc = pickK(i, PALETTE, 14), sl = pickK(i, PALETTE, 15);
  return {
    skin, skinShade, hair: hairC, hairShade: shade(hairC), hairHi: '#FFFFFF55', brow: shade(hairC, 0.7), accent: acc,
    top, topShade: shade(top), sleeve: sl === top ? '#FFFFFF' : sl, cuff: shade(top), trim: '#FFFFFF', stripe: pickK(i, ['#FFFFFF', '#1E1A1C', '#FFD166', '#2E3A55'], 16),
    plaid1: shade(top, 0.62), plaid2: '#FFFFFF', shirt: '#FFFFFF', tie: pickK(i, PALETTE, 17), collar: '#FFFFFF', button: '#E9C25A',
    pants, pantsShade: shade(pants), sole: '#FFFFFF', soleShade: '#E0E0E8', toe: pickK(i, PALETTE, 13), collarDim: shade(acc), ...base,
  };
}
function kidDesign(i) {
  const top = pickK(i, KID_TOP, 7);
  const c = crowdCol(i, {});
  if (top !== 'raglan') c.sleeve = c.top;
  return design({
    hair: pickK(i, KID_HAIR, 5), eyeStyle: hashK(i, 6) > 0.45 ? 'dot' : 'mid', top, sleeve: top === 'puffer' || top === 'zipHoodie' || top === 'plaid' ? 'long' : 'short', pantsShape: 'straight',
    eye: { iris: pickK(i, ['#5C3A1E', '#2E7DD1', '#3E8E41', '#7A4B2A'], 9) }, size: 0.8 + hashK(i, 10) * 0.16, number: String(1 + Math.floor(hashK(i, 16) * 98)),
    shoe: pickK(i, KID_SHOE, 18), neutralMouth: pickK(i, ['smallSmile', 'line', 'smile'], 19),
    acc: hashK(i, 17) > 0.8 ? { specs: { type: hashK(i, 18) > 0.5 ? 'round' : 'rect', col: '#2A2A33', r: 48, x: 58, w: 96, h: 64 } } : {},
    col: { ...c, collar: c.accent },
  });
}
const ADULT_HAIR = ['sidePart', 'crop', 'lowBun', 'longWave', 'shaved', 'curlTop', 'twists', 'sidePart', 'longWave'];
const ADULT_TOP = ['plaid', 'puffer', 'suit4', 'zipHoodie', 'stripeTee', 'raglan', 'suit4', 'plaid'];
function adultDesign(i) {
  const hair = pickK(i, ADULT_HAIR, 21), top = pickK(i, ADULT_TOP, 22);
  const grey = hair === 'shaved' ? hashK(i, 24) > 0.4 : hashK(i, 24) > 0.85;
  const hairC = grey ? pickK(i, ['#B9BAC2', '#8A8A92', '#D8D8DE'], 25) : pickK(i, HAIRC, 4);
  const skirt = ['lowBun', 'longWave'].includes(hair) && hashK(i, 26) > 0.45;
  const skirtCol = pickK(i, PALETTE, 27);
  return design({
    hair, eyeStyle: hashK(i, 28) > 0.5 ? 'dot' : 'mid', lashes: ['longWave', 'lowBun'].includes(hair) && hashK(i, 29) > 0.3, top, sleeve: top === 'stripeTee' || top === 'raglan' ? 'short' : 'long', pantsShape: 'straight',
    eye: { iris: pickK(i, ['#5C3A1E', '#2E7DD1', '#3E8E41', '#7A4B2A'], 9), pupil: 0.9 }, size: 1.02 + hashK(i, 30) * 0.12, neutralMouth: pickK(i, ['line', 'smallSmile', 'smile'], 31),
    suitKind: hashK(i, 32) > 0.7 ? 'double' : 'single', shoe: top === 'suit4' ? 'dress' : pickK(i, ['sneaker', 'dress', 'sneaker'], 33),
    ext: skirt ? { kind: 'skirt', top: -326, len: 120 + hashK(i, 34) * 40, flare: 18, col: skirtCol, shade: shade(skirtCol), under: true } : null,
    acc: {
      ...(hashK(i, 35) > 0.6 ? { specs: { type: hashK(i, 36) > 0.5 ? 'round' : 'rect', col: pickK(i, ['#2A2A33', '#7A4B2A', '#B08A3A'], 37), r: 50, x: 60, w: 100, h: 68 } } : {}),
      ...(['sidePart', 'shaved', 'crop'].includes(hair) && hashK(i, 38) > 0.6 ? { mustache: shade(hairC, 0.9) } : {}),
    },
    col: adultCol(i, top, { hair: hairC, hairShade: shade(hairC), brow: shade(hairC, 0.7), ...(skirt ? { pants: pickK(i, SKINS, 3)[0], pantsShade: pickK(i, SKINS, 3)[1] } : {}) }),
  });
}
function adultCol(i, top, base) {
  const c = crowdCol(i + 40, base);
  if (top !== 'raglan') c.sleeve = c.top;
  return c;
}
const kidCache = {}, adultCache = {};
// kid(i, pose) or kid({ i, ...pose }) (actor('kid', t, { i: 3, ... }) works too)
function kid(i, pose) {
  if (typeof i === 'object' && i) { pose = i; i = i.i ?? i.seed ?? 0; }
  if (!kidCache[i]) kidCache[i] = kidDesign(i);
  return drawCharacter(kidCache[i], pose);
}
function adult(i, pose) {
  if (typeof i === 'object' && i) { pose = i; i = i.i ?? i.seed ?? 0; }
  if (!adultCache[i]) adultCache[i] = adultDesign(i);
  return drawCharacter(adultCache[i], pose);
}

// ---------------------------------------------------------------- draw functions + options
const draw = Object.fromEntries(Object.entries(D).map(([k, d]) => [k, makeDraw(d)]));
const rad = (d) => (d * Math.PI) / 180;
// hand position (body space) for an arm angle; side +1 = screen-right arm (armR), -1 = screen-left (armL)
function handAt(design, pose, side) {
  const view = pose.view || 'front';
  const a = side < 0 ? (pose.armL ?? 9) : (pose.armR ?? 9);
  if (view === 'side') return [4 - 250 * Math.sin(rad(a)), -505 + 250 * Math.cos(rad(a))];
  const sx = (design.dims && design.dims.shoulderX) || 100;
  return [side * (sx + 252 * Math.sin(rad(a))), -515 + 252 * Math.cos(rad(a))];
}
const withProps = (pose, extra) => ({ ...pose, props: [...(pose.props || []), ...extra] });

// Dad: pose.headset === false hides the office headset
draw.dad = (pose = {}) => drawCharacter(pose.headset === false ? D.dadNoHeadset : D.dad, pose);
// Granny: pose.fast = true blows her curls back (use with fireTrail for the speed look)
draw.granny = (pose = {}) => drawCharacter(pose.fast ? D.grannyFast : D.granny, pose);
// Zoe: pose.laptop = true | 'open' | 'closed' | 'screen' holds the sticker laptop at her chest (front layer; behind her in back view)
draw.zoe = (pose = {}) => {
  if (!pose.laptop) return drawCharacter(D.zoe, pose);
  const view = pose.view || 'front';
  const open = pose.laptop === 'closed' ? 0 : 1;
  const p = { armL: 24, armR: 24, ...pose };
  let prop;
  if (view === 'side') prop = { svg: S.g(laptopSide(open), 'translate(-150 -400)'), layer: 'front' };
  else if (view === 'back') prop = { svg: L4.zoeLaptop({ x: 0, y: -330, s: 0.92, open, face: 'screen', screen: pose.laptopScreen || '' }), layer: 'back' };
  else prop = { svg: L4.zoeLaptop({ x: (pose.turn || 0) * 26, y: -330, s: 0.92, open, face: pose.laptop === 'screen' ? 'screen' : 'lid', screen: pose.laptopScreen || '' }), layer: 'front' };
  return drawCharacter(D.zoe, withProps(p, [prop]));
};
function laptopSide(open) {
  const o = S.path(S.roundedPath([[-130, -14], [130, -14], [130, 6], [-130, 6]], 6), { fill: '#B9BFCC', stroke: '#151515', 'stroke-width': 6 });
  if (!open) return o + S.path(S.roundedPath([[-128, -30], [128, -30], [128, -14], [-128, -14]], 6), { fill: '#5A5F78', stroke: '#151515', 'stroke-width': 6 });
  return o + S.g(S.path(S.roundedPath([[0, -12], [14, -12], [14, 170], [0, 170]], 6), { fill: '#5A5F78', stroke: '#151515', 'stroke-width': 6 }), 'translate(124 -10) rotate(195)');
}
// Mom: pose.notes = true (or a word) puts a pad of sticky notes in her right hand (screen-right arm)
draw.mom = (pose = {}) => {
  if (!pose.notes) return drawCharacter(D.mom, pose);
  const view = pose.view || 'front';
  const h = handAt(D.mom, pose, view === 'side' ? 1 : (view === 'back' ? -1 : 1));
  const svg = L4.stickyStack({ x: h[0], y: h[1] + 10, s: 0.62, rot: -8, text: typeof pose.notes === 'string' ? pose.notes : null });
  return drawCharacter(D.mom, withProps(pose, [{ svg, layer: view === 'back' ? 'back' : 'front' }]));
};
// Principal Pratt: his mug is in his left hand (screen-left arm) unless pose.mug === false; pose.steam 0..1, pose.t animates it
draw.principal = (pose = {}) => {
  if (pose.mug === false) return drawCharacter(D.principal, pose);
  const view = pose.view || 'front';
  const h = handAt(D.principal, pose, view === 'side' ? 1 : -1);
  const svg = L4.coffeeMug({ x: h[0] + (view === 'side' ? -20 : 0), y: h[1] + 54, s: 0.62, steam: pose.steam ?? 1, t: pose.t || 0 });
  return drawCharacter(D.principal, withProps(pose, [{ svg, layer: view === 'back' ? 'back' : 'front' }]));
};
// Coach Hale: pose.whistle === 'mouth' blows the whistle
draw.coach = (pose = {}) => {
  if (pose.whistle !== 'mouth') return drawCharacter(D.coach, pose);
  const view = pose.view || 'front';
  const w = view === 'side' ? L4.whistleShape(-170, -604, 1.1, 180) : view === 'back' ? '' : L4.whistleShape((pose.turn || 0) * 40 - 30, -604, 1.2, 160);
  const p = { ...pose, face: typeof pose.face === 'object' ? { ...pose.face, mouth: 'o' } : { name: pose.face || 'determined', mouth: 'o' } };
  return drawCharacter(D.coach, withProps(p, [{ svg: w, layer: 'front' }]));
};
// the ADMIN: pose.glow 0..1 = golden aura behind him, pose.t = time (code scrolls on the robe, cape sways)
draw.admin = (pose = {}) => {
  const p = { ...BASE_DEFAULTS, volume: false, ...pose };
  L4.ADMIN.phase = (pose.t || 0) * 1.6;
  const Z = D.admin.dims.size || 1;
  const fs = p.flip ? -1 : 1;
  const tf = `translate(${f(p.x)} ${f(p.y - p.lift)}) scale(${f(fs * p.s * Z)} ${f(p.s * Z)}) rotate(${f(p.rot)} 0 ${f(p.rotY)}) scale(${f(p.sx)} ${f(p.sy)})`;
  const view = p.view || 'front';
  let behind = L4.adminAura(pose.glow || 0, pose.t || 0);
  const cape = L4.adminCape(view, view === 'back' ? 0 : S.clamp(p.turn || 0, -1, 1), D.admin.style.col);
  behind += p.volume === false || !cape ? cape : S.g(cape, null, { filter: `url(#${p.flip ? 'volF' : 'vol'})` });
  const out = S.g(S.g(behind, `translate(0 ${f(p.bodyY)}) rotate(${f(p.lean)} 0 -306)`), tf);
  return (p.shadow ? S.ellipse(p.x, p.y, 175 * p.s * Z * 1.3, 24 * p.s * Z, { fill: 'rgba(0,0,0,0.16)' }) : '') + out + drawCharacter(D.admin, { ...pose, shadow: false });
};
draw.kid = kid;
draw.adult = adult;
// (aliases kept for direct use: draw.dadNoHeadset, draw.grannyFast)

const NAMES = {
  you: 'You', zoe: 'Zoe', brick: 'Brick', dad: 'Dad', mom: 'Mom', granny: 'Granny', oldman: 'Old Man', admin: 'ADMIN',
  anchor: 'Rex Ratings', boss: 'Mr. Gray', principal: 'Principal Pratt', coach: 'Coach Hale',
};

module.exports = {
  D, draw, NAMES, kidDesign, adultDesign,
  zoeLaptop: L4.zoeLaptop, stickyNote: L4.stickyNote, stickyStack: L4.stickyStack, coffeeMug: L4.coffeeMug, fireTrail: L4.fireTrail, whistle: L4.whistleShape,
};
