// The cast of "What If You Could RESPAWN in Real Life?" — all built on the R6 rig.
// YOU is the channel hero: the default r6.js construction (BASE_STYLE) with his jacket/T-shirt/pants colours only.
// Everyone else uses the looks5.js hair, accessories and body parts (on top of looks3/looks4).
// Gary the goldfish, his fishbowl and all the props live in rig/extras.js (non-rig). Reference: docs/CAST.md.
'use strict';

const S = require('./svg');
const { makeDesign } = require('./r6');
const { drawCharacter, bentLimb } = require('./body');
const L3 = require('./looks3');
const L4 = require('./looks4');
const L5 = require('./looks5');
const X = require('./extras');
const { f } = S;

const D = {};
const design = (style) => L5.dress5(L4.dress4(L3.dress(makeDesign(style))));

// ---------------------------------------------------------------- YOU (the hero) — DO NOT REDESIGN: only these colours
D.you = makeDesign({
  col: { jacket: '#D8262E', jacketLine: '#B01D24', shirt: '#F2D04A', shirtShade: '#D9B73A', pants: '#1F3B2A', pantsShade: '#162C1F' },
});

// ---------------------------------------------------------------- ghost-YOU: the same rig in cool greys (every undone fail)
D.ghost = makeDesign({
  col: {
    hair: '#8E98AA', hairShade: '#788396', hairHi: '#B3BCCB', skin: '#E6ECF3', skinShade: '#CDD5E0',
    jacket: '#9BA6B8', jacketLine: '#7F8A9C', shirt: '#C9D0DB', shirtShade: '#B2BAC7', pants: '#6F7A8E', pantsShade: '#5F697C',
    sole: '#E2E7EE', soleShade: '#C9D0DA', toe: '#E2E7EE',
  },
});

// ---------------------------------------------------------------- Ivy — best friend, 12, inventor
// big dark curls in a puff (+ a wrench), goggles on the forehead, green patched overalls over an orange striped tee,
// band-aids (cheek + a torn knee), purple high-tops
const IVY = {
  hair: 'ivyPuff', eyeStyle: 'mid', lashes: true, top: 'ivyOveralls', sleeve: 'long', sleeveStripes: '#FFE2BC', pantsShape: 'straight', size: 0.96, shoe: 'hightop', rockets: true,
  eye: { iris: '#B87A2A', pupil: 0.95 }, brows: { L: [-2, 0], R: [-2, 0] }, neutralMouth: 'smallSmile',
  acc: { bandaid: { x: 92, y: -636, rot: -24 }, freckles: '#6E3E22' },
  kneePatch: { side: -1, col: '#FFD23F' }, kneeHole: { side: 1 }, cuffCol: '#5DBB6E',
  col: {
    skin: '#A86B45', skinShade: '#8E5634', hair: '#2A1A16', hairShade: '#1A100D', hairHi: '#6A4A3E', brow: '#1A100D', accent: '#FFB020',
    top: '#FF8A3D', topShade: '#E06E22', sleeve: '#FF8A3D', cuff: '#E06E22', stripe: '#FFE2BC', denim: '#3E9B4F', denimShade: '#2F7D3E', stitch: '#B8F0A0',
    patch1: '#FFD23F', patch2: '#FF6FA8', button: '#FFC93C',
    pants: '#3E9B4F', pantsShade: '#2F7D3E', sole: '#FFFFFF', soleShade: '#E0E0EA', toe: '#FFFFFF', collar: '#7A4FD6', collarDim: '#5E38B4', lace: '#FFE14D',
  },
};
D.ivy = design(IVY);
D.ivyFrizz = design({ ...IVY, hair: 'ivyFrizz' });

// ---------------------------------------------------------------- Dad — huge ginger beard, chunky, plaid shirt with rolled sleeves, FLIP MASTER apron, slippers
const DAD = {
  hair: 'dadSwoop', eyeStyle: 'dot', top: 'dadApron', sleeve: 'rolled', sleevePlaid: true, pantsShape: 'straight', size: 1.14, torsoW: 122, taper: -4, armW: 1.16, legW: 1.12, hipK: 1.15, shoe: 'slipper',
  eye: { pupil: 1.0 }, brows: false, browBase: { L: [-6, 0], R: [-6, 0] }, neutralMouth: 'smile',
  acc: { bushyBeard: true, thickBrows: '#C4561D', cheekBlush: '#FF8F8F' },
  ext5: { kind: 'apron', top: -330, len: 172, flare: 12, col: '#F2B33D', trim: '#FFF2C0', text: ['FLIP', 'MASTER'], ink: '#6A3A14' },
  col: {
    skin: '#F6D2B4', skinShade: '#E6B994', hair: '#C4561D', hairShade: '#9E4012', hairHi: '#E87A3A', brow: '#9E4012', beard: '#C4561D', beardShade: '#A2440F', beardHi: '#F29A58',
    top: '#4F86C6', topShade: '#3C6AA4', sleeve: '#4F86C6', cuff: '#6E9ED6', plaid1: '#2E4E86', plaid2: '#FFFFFF', collar: '#3C6AA4',
    apron: '#F2B33D', apronTrim: '#FFF2C0', apronInk: '#6A3A14',
    pants: '#6B5B4E', pantsShade: '#574A3F', sole: '#5A2A32', soleShade: '#3E1C22', toe: '#8E3B46',
  },
};
D.dad = design(DAD);
D.dadNoApron = design({ ...DAD, top: 'dadPlaid', ext5: null });

// ---------------------------------------------------------------- Mom — ER nurse: teal scrubs, messy bun, ID badge on a lanyard, comfy clogs
D.mom = design({
  hair: 'nurseBun', eyeStyle: 'mid', lashes: true, top: 'scrubs', sleeve: 'short', pantsShape: 'straight', size: 1.06, torsoW: 98, shoe: 'clog',
  eye: { iris: '#3E8E5E', pupil: 0.92 }, brows: { L: [0, 0], R: [0, 0] }, neutralMouth: 'smallSmile',
  ext5: { kind: 'tunic', top: -330, len: 46, flare: 6, col: '#2FA8A0', shade: '#23877F' },
  col: {
    skin: '#F2CDB0', skinShade: '#E0B494', hair: '#5A3426', hairShade: '#40241A', hairHi: '#8A5A44', brow: '#40241A', accent: '#FF8FB0',
    top: '#2FA8A0', topShade: '#23877F', sleeve: '#2FA8A0', trim: '#1E7A72', lanyard: '#3B5BDB', badge: '#E8453C',
    pants: '#3BB3AA', pantsShade: '#2E968E', sole: '#F4F6FA', soleShade: '#D8DCE6', toe: '#2FA8A0',
  },
});

// ---------------------------------------------------------------- Bea — little sister, 6: orange pigtails, pink star dress, missing front tooth, light-up sneakers
D.bea = design({
  hair: 'beaPigtails', eyeStyle: 'big', top: 'beaDress', sleeve: 'puff', sleeveTrim: '#FFFFFF', pantsShape: 'straight', size: 0.68, torsoW: 98, shoe: 'lightup',
  eye: { pupil: 1.12, sparkle: true, iris: '#5B8FD8' }, brows: { L: [0, 0], R: [0, 0] }, neutralMouth: 'smallSmile',
  acc: { toothGap: true, freckles: '#E0946A', cheekBlush: '#FF9FB0' },
  socks: '#FFFFFF', sockFrill: true,
  ext5: { kind: 'skirt', top: -330, len: 122, flare: 42, col: '#FF8FC0', shade: '#E86FA4', trim: '#FFFFFF', dots: '#FFFFFF' },
  col: {
    skin: '#FFE6D6', skinShade: '#F2CDB8', hair: '#D2601A', hairShade: '#A8460C', hairHi: '#F08A3E', brow: '#8A3A0A', accent: '#FF5FA2',
    top: '#FF8FC0', topShade: '#E86FA4', sleeve: '#FF8FC0', collar: '#FFFFFF', star: '#FFD23F',
    pants: '#FFE6D6', pantsShade: '#F2CDB8', sole: '#FFFFFF', soleShade: '#E8E0EC', toe: '#FF6FA8',
  },
});

// ---------------------------------------------------------------- Mr. Fig — maths teacher: tall and thin, neat side part, glasses, pencil moustache, olive vest, plum bow tie
D.teacher = design({
  hair: 'figPart', eyeStyle: 'dot', top: 'figVest', sleeve: 'long', pantsShape: 'straight', size: 1.24, headK: 0.86, torsoW: 84, armW: 0.84, legW: 0.82, hipK: 0.86, shoe: 'loafer',
  eye: { pupil: 0.86, upper: 0.36 }, brows: { L: [4, -2], R: [4, -2] }, neutralMouth: 'line',
  acc: { specs: { type: 'rect', col: '#3A3440', sw: 6, w: 100, h: 62, r: 12, x: 58, y: -712 }, pencilStache: '#2E2420' },
  col: {
    skin: '#F0D2BC', skinShade: '#DDB89E', hair: '#2E2420', hairShade: '#1E1714', hairHi: '#6A5A50', brow: '#1E1714',
    top: '#CFE3F5', topShade: '#A9C6E2', sleeve: '#CFE3F5', cuff: '#B4CCE4', vest: '#8E9A3A', vestTrim: '#6E7A26', bow: '#7A2E5A', bowDot: '#F4D9E8',
    pants: '#5A5048', pantsShade: '#4A413A', sole: '#4A3226', soleShade: '#36241A', toe: '#4A3226',
  },
});

// ---------------------------------------------------------------- Coach Dee — athletic: lime sun visor, high ponytail, purple track jacket, whistle on a cord
const COACH = {
  hair: 'visorPony', eyeStyle: 'mid', lashes: true, top: 'trackJacket', sleeve: 'long', trackStripe: '#FFFFFF', pantsShape: 'straight', size: 1.08, torsoW: 104, armW: 1.06, legW: 1.04, legStripe: '#FFFFFF', shoe: 'sneaker',
  eye: { iris: '#5A3A1E', pupil: 0.9 }, brows: { L: [6, -4], R: [6, -4] }, neutralMouth: 'smirk',
  col: {
    skin: '#8A5536', skinShade: '#744628', hair: '#1E1715', hairShade: '#120D0C', hairHi: '#5A4A44', brow: '#120D0C', accent: '#C6EB3A', visor: '#C6EB3A', visorBrim: '#A8CC22',
    top: '#6A3FD0', topShade: '#5530AE', sleeve: '#6A3FD0', cuff: '#5530AE', panel: '#FFFFFF', zip: '#C6EB3A', lanyard: '#E8453C',
    pants: '#2A2836', pantsShade: '#1E1C28', sole: '#FFFFFF', soleShade: '#E0E0EA', toe: '#6A3FD0',
  },
};
D.coach = design(COACH);
D.coachW = design({ ...COACH, whistleUp: true });

// ---------------------------------------------------------------- Principal Pemberton — stern: silver bun, crimson cat-eye glasses, navy cardigan + pearls, pencil skirt
D.principal = design({
  hair: 'greyBun', eyeStyle: 'mid', lashes: true, top: 'pembCardigan', sleeve: 'long', pantsShape: 'straight', size: 1.08, torsoW: 100, shoe: 'loafer',
  eye: { iris: '#5A7A9A', pupil: 0.85, upper: 0.16 }, brows: { L: [8, -6], R: [8, -6] }, neutralMouth: 'line',
  acc: { catEye: { col: '#B02E4A' }, pearls: true },
  ext5: { kind: 'pencil', top: -330, len: 150, flare: -6, col: '#5C5F6E', shade: '#4A4D5A' },
  col: {
    skin: '#F2D6C6', skinShade: '#E0BCA8', hair: '#B9BCC8', hairShade: '#9A9EAC', hairHi: '#E6E8F0', brow: '#7A7E8C',
    top: '#2E3A6E', topShade: '#232D58', sleeve: '#2E3A6E', cuff: '#232D58', shirt: '#FFF6E6', shirtShade: '#E8D8C0', button: '#FFC93C',
    pants: '#4A4048', pantsShade: '#3A3238', sole: '#1A1A1E', soleShade: '#101013', toe: '#1A1A1E',
  },
});

// ---------------------------------------------------------------- the juggler — talent-show winner: sparkly leotard, ballet bun with a gold headband
D.juggler = design({
  hair: 'jugglerBun', eyeStyle: 'mid', lashes: true, top: 'leotard', sleeve: 'long', sleeveSparkle: true, pantsShape: 'straight', size: 0.86, torsoW: 92, shoe: 'flats',
  eye: { iris: '#6A3A1E', sparkle: true }, brows: { L: [-6, -2], R: [-6, -2] }, neutralMouth: 'smile',
  acc: { cheekBlush: '#FF8FB0' },
  ext5: { kind: 'brief', top: -330, len: 46, col: '#D6339A' },
  col: {
    skin: '#C98D6A', skinShade: '#B0754F', hair: '#2A1A12', hairShade: '#1A100A', hairHi: '#5A3A28', brow: '#1A100A', accent: '#FF6FD0',
    top: '#D6339A', topShade: '#B2257E', sleeve: '#D6339A', cuff: '#B2257E', pants: '#F7C6D9', pantsShade: '#E8AEC6', sole: '#F2C14E', soleShade: '#D9A73A', toe: '#FFC93C',
  },
});

// ---------------------------------------------------------------- crowds: classmates, cafeteria, audience (cheap looks4 designs)
const hashK = (i, k) => { const v = Math.sin((i + 1) * 91.7 + k * 13.3) * 43758.5453; return v - Math.floor(v); };
const pickK = (i, arr, k) => arr[Math.floor(hashK(i, k) * arr.length) % arr.length];
const PALETTE = ['#FF6B6B', '#4ECDC4', '#FFD166', '#6A4C93', '#1982C4', '#8AC926', '#FF924C', '#F15BB5', '#00BBF9', '#9B5DE5', '#F94144', '#43AA8B', '#2EC4B6', '#E76F51', '#3A86FF', '#FFB703'];
const SKINS = [['#F8D9C0', '#EBC0A2'], ['#E9B38B', '#D29A72'], ['#C98D6A', '#B0754F'], ['#8D5A3B', '#764830'], ['#F2C9A0', '#DDB083'], ['#6B4430', '#573522'], ['#FFE3CF', '#F0C9AE'], ['#A86B45', '#8E5634']];
const HAIRC = ['#1E1A1C', '#5A3A22', '#E0A23A', '#C2452D', '#3A2A1A', '#2F4AA8', '#E870A8', '#7A4A2A', '#2A1A16', '#F2D06A'];
const shade = (hex, k = 0.82) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
const KID_HAIR = ['crop', 'curlTop', 'twists', 'twinTails', 'lowBun', 'afroPuffs', 'puff', 'swoop', 'ponytail', 'buzz', 'longStraight', 'spiky', 'crop', 'mohawk'];
const KID_TOP = ['raglan', 'stripeTee', 'zipHoodie', 'plaid', 'puffer', 'raglan', 'stripeTee', 'zipHoodie'];
const KID_SHOE = ['sneaker', 'hightop', 'sneaker', 'chunky'];
function crowdCol(i, base) {
  const top = pickK(i, PALETTE, 1), pants = pickK(i, ['#2E3A55', '#5A6070', '#7A5A3A', '#3A6A9A', '#2B2B33', '#6E7891', '#4A5A3A', '#8A4A5A'], 2);
  const [skin, skinShade] = pickK(i, SKINS, 3);
  const hairC = pickK(i, HAIRC, 4), acc = pickK(i, PALETTE, 14), sl = pickK(i, PALETTE, 15);
  return {
    skin, skinShade, hair: hairC, hairShade: shade(hairC), hairHi: '#FFFFFF55', brow: shade(hairC, 0.7), accent: acc,
    top, topShade: shade(top), sleeve: sl === top ? '#FFFFFF' : sl, cuff: shade(top), trim: '#FFFFFF', stripe: pickK(i, ['#FFFFFF', '#1E1A1C', '#FFD166', '#2E3A55'], 16),
    plaid1: shade(top, 0.62), plaid2: '#FFFFFF', shirt: '#FFFFFF', tie: pickK(i, PALETTE, 17), collar: '#FFFFFF', button: '#E9C25A',
    pants, pantsShade: shade(pants), sole: '#FFFFFF', soleShade: '#E0E0E8', toe: pickK(i, PALETTE, 13), collarDim: shade(acc), ...base,
  };
}
const crowdDesign = (style) => L4.dress4(L3.dress(makeDesign(style)));
function kidDesign(i) {
  const top = pickK(i, KID_TOP, 7);
  const c = crowdCol(i, {});
  if (top !== 'raglan') c.sleeve = c.top;
  return crowdDesign({
    hair: pickK(i, KID_HAIR, 5), eyeStyle: hashK(i, 6) > 0.45 ? 'dot' : 'mid', top, sleeve: top === 'puffer' || top === 'zipHoodie' || top === 'plaid' ? 'long' : 'short', pantsShape: 'straight',
    eye: { iris: pickK(i, ['#5C3A1E', '#2E7DD1', '#3E8E41', '#7A4B2A'], 9) }, size: 0.8 + hashK(i, 10) * 0.16, number: String(1 + Math.floor(hashK(i, 16) * 98)),
    shoe: pickK(i, KID_SHOE, 18), neutralMouth: pickK(i, ['smallSmile', 'line', 'smile'], 19),
    acc: hashK(i, 17) > 0.8 ? { specs: { type: hashK(i, 18) > 0.5 ? 'round' : 'rect', col: '#2A2A33', r: 48, x: 58, w: 96, h: 64 } } : {},
    col: { ...c, collar: c.accent },
  });
}
const ADULT_HAIR = ['sidePart', 'crop', 'lowBun', 'longWave', 'shaved', 'curlTop', 'twists', 'sidePart', 'longWave', 'buzz', 'ponytail'];
const ADULT_TOP = ['plaid', 'puffer', 'suit4', 'zipHoodie', 'stripeTee', 'raglan', 'suit4', 'plaid'];
function adultDesign(i) {
  const hair = pickK(i, ADULT_HAIR, 21), top = pickK(i, ADULT_TOP, 22);
  const grey = hair === 'shaved' ? hashK(i, 24) > 0.4 : hashK(i, 24) > 0.85;
  const hairC = grey ? pickK(i, ['#B9BAC2', '#8A8A92', '#D8D8DE'], 25) : pickK(i, HAIRC, 4);
  const skirt = ['lowBun', 'longWave', 'ponytail'].includes(hair) && hashK(i, 26) > 0.45;
  const skirtCol = pickK(i, PALETTE, 27);
  const c = crowdCol(i + 40, { hair: hairC, hairShade: shade(hairC), brow: shade(hairC, 0.7), ...(skirt ? { pants: pickK(i, SKINS, 3)[0], pantsShade: pickK(i, SKINS, 3)[1] } : {}) });
  if (top !== 'raglan') c.sleeve = c.top;
  return crowdDesign({
    hair, eyeStyle: hashK(i, 28) > 0.5 ? 'dot' : 'mid', lashes: ['longWave', 'lowBun'].includes(hair) && hashK(i, 29) > 0.3, top, sleeve: top === 'stripeTee' || top === 'raglan' ? 'short' : 'long', pantsShape: 'straight',
    eye: { iris: pickK(i, ['#5C3A1E', '#2E7DD1', '#3E8E41', '#7A4B2A'], 9), pupil: 0.9 }, size: 1.02 + hashK(i, 30) * 0.12, neutralMouth: pickK(i, ['line', 'smallSmile', 'smile'], 31),
    suitKind: hashK(i, 32) > 0.7 ? 'double' : 'single', shoe: top === 'suit4' ? 'dress' : pickK(i, ['sneaker', 'dress', 'sneaker'], 33),
    ext: skirt ? { kind: 'skirt', top: -326, len: 120 + hashK(i, 34) * 40, flare: 18, col: skirtCol, shade: shade(skirtCol), under: true } : null,
    acc: {
      ...(hashK(i, 35) > 0.6 ? { specs: { type: hashK(i, 36) > 0.5 ? 'round' : 'rect', col: pickK(i, ['#2A2A33', '#7A4B2A', '#B08A3A'], 37), r: 50, x: 60, w: 100, h: 68 } } : {}),
      ...(['sidePart', 'shaved', 'crop'].includes(hair) && hashK(i, 38) > 0.6 ? { mustache: shade(hairC, 0.9) } : {}),
    },
    col: c,
  });
}
const kidCache = {}, adultCache = {};
// kid(i, pose) or kid({ i, ...pose }) (actor('kid', t, { i: 3, ... }) works too)
function kid(i, pose) {
  if (typeof i === 'object' && i) { pose = i; i = i.i ?? i.seed ?? 0; }
  if (!kidCache[i]) kidCache[i] = kidDesign(i);
  return drawCharacter(kidCache[i], pose || {});
}
function adult(i, pose) {
  if (typeof i === 'object' && i) { pose = i; i = i.i ?? i.seed ?? 0; }
  if (!adultCache[i]) adultCache[i] = adultDesign(i);
  return drawCharacter(adultCache[i], pose || {});
}

// ---------------------------------------------------------------- helpers: hands, props, overlays
const rad = (d) => (d * Math.PI) / 180;
// grip point of a hand in BODY space for the pose's arm angle; side +1 = screen-right arm (armR), -1 = screen-left (armL)
function handAt(dsg, pose, side, grip = 236) {
  const view = pose.view || 'front';
  const a = side < 0 ? (pose.armL ?? 9) : (pose.armR ?? 9);
  if (view === 'side') { const [sx, sy] = (dsg.dims && dsg.dims.sideShoulder) || [4, -505]; return [sx - grip * Math.sin(rad(a)), sy + grip * Math.cos(rad(a))]; }
  const W = (dsg.dims && dsg.dims.shoulderX) || 100;
  const t = view === 'back' ? 0 : S.clamp(pose.turn || 0, -1, 1), at = Math.abs(t), dir = t >= 0 ? 1 : -1;
  const far = at > 0.35 && dir === side;
  const ax = side * W + (far ? -side * 30 * at : 8 * at * dir);
  return [ax + side * grip * Math.sin(rad(a)), -515 + grip * Math.cos(rad(a))];
}
const withProps = (pose, extra) => ({ ...pose, props: [...(pose.props || []), ...extra.filter((q) => q && q.svg)] });
// add an extra `over` layer (head space, follows headRot/headY) to a design for one draw
function withOver(dsg, fn) {
  const k = dsg.style && dsg.style.headK;
  const o0 = dsg.over;
  return { ...dsg, over: (face, t, shade, view) => (o0 ? o0(face, t, shade, view) : '') + L5.headScale(fn(face, t, shade, view) || '', k) };
}
const viewOf = (p) => p.view || 'front';
const turnOf = (p) => (viewOf(p) === 'front' ? S.clamp(p.turn || 0, -1, 1) : 0);
const faceWith = (face, extra) => (typeof face === 'object' && face ? { ...face, ...extra } : { name: face || 'neutral', ...extra });

// YOU and the ghost share these options: foam 0..1, backpack true|'flag', headphones true|colour
function heroOptions(dsg, pose) {
  const view = viewOf(pose);
  const props = [];
  let d = dsg;
  if (pose.backpack) {
    const bp = X.backpackWorn(view, { flag: pose.backpack === 'flag' ? (pose.flagGlow ?? 1) : false, t: pose.t || 0, flagSvg: pose.flagSvg ?? null });
    if (bp.back) props.push({ svg: bp.back, layer: 'back' });
    if (bp.mid) props.push({ svg: bp.mid, layer: 'mid' });
    if (bp.top) props.push({ svg: bp.top, layer: 'top' });
  }
  const foam = pose.foam || 0;
  if (foam > 0) props.push({ svg: L5.foamBody(view, foam, 3), layer: 'front' });
  if (foam > 0 || pose.headphones) {
    d = withOver(d, (face, t, shade, v) => (pose.headphones ? L5.heroHeadphones(v, t, pose.headphones === true ? '#2E7BD1' : pose.headphones) : '') + (foam > 0 ? L5.foamHead(v, foam, pose.t || 0, { seed: 2, turn: t, topY: -930 }) : ''));
  }
  return { d, pose: props.length ? withProps(pose, props) : pose };
}

// ---------------------------------------------------------------- draw functions + options
const draw = {};
draw.you = (pose = {}) => { const r = heroOptions(D.you, pose); return drawCharacter(r.d, r.pose); };

// Ivy: goggles 'up'|'down' (default 'up', false hides them), soot 0..1 (smudges + frizzed hair from 0.4, smoke from 0.6),
// foam 0..1, book true|'open'|2 (the BOOK OF FAILS; 2 = VOL. 2 for the ending), rockets 0..1 (rocket boosters + flame on the sneakers), t (time)
draw.ivy = (pose = {}) => {
  const view = viewOf(pose);
  const soot = pose.soot || 0, foam = pose.foam || 0;
  let d = soot >= 0.4 || pose.frizz ? D.ivyFrizz : D.ivy;
  const gog = pose.goggles === undefined ? 'up' : pose.goggles;
  d = withOver(d, (face, t, shade, v) => (gog ? L5.goggles(v, gog, t) : '') + L5.sootFace(v, soot, t) + (soot > 0.6 ? L5.smokeWisps(soot, pose.t || 0) : '') + (foam > 0 ? L5.foamHead(v, foam, pose.t || 0, { seed: 5, turn: t, topY: -990 }) : ''));
  const props = [];
  if (soot > 0) props.push({ svg: L5.sootBody(view, soot), layer: 'front' });
  if (foam > 0) props.push({ svg: L5.foamBody(view, foam, 6), layer: 'front' });
  let p = pose;
  if (pose.book) {
    const vol = pose.book === 2 || pose.vol === 2 ? 2 : 1;
    if (pose.book === 'open' && view !== 'side') {
      p = { armL: 34, armR: 34, ...p };
      props.push({ svg: X.bookOfFails({ x: turnOf(p) * 30, y: -400, s: 0.62, open: true, vol }), layer: view === 'back' ? 'back' : 'front' });
    } else {
      p = { armL: view === 'side' ? 30 : 22, ...p };
      const h = handAt(d, p, -1);
      props.push({ svg: X.bookOfFails({ x: h[0] + (view === 'side' ? -10 : 0), y: h[1] - 20, s: 0.55, rot: view === 'side' ? -8 : -6, vol }), layer: view === 'back' ? 'back' : 'front' });
    }
  }
  L5.STATE.rocket = pose.rockets ? { flame: pose.rockets === true ? 1 : pose.rockets, t: pose.t || 0 } : null;
  const out = drawCharacter(d, props.length ? withProps(p, props) : p);
  L5.STATE.rocket = null;
  return out;
};

// Dad: spatula true (right hand; pose.pancake true|'burnt' puts a pancake on it), apron false, pancakeOnHead true
draw.dad = (pose = {}) => {
  const view = viewOf(pose);
  let d = pose.apron === false ? D.dadNoApron : D.dad;
  if (pose.pancakeOnHead) d = withOver(d, (face, t, shade, v) => L5.pancakeHead(v, t, 1));
  let p = pose;
  if (pose.spatula) {
    p = { armR: view === 'side' ? 50 : 56, ...p };
    const side = view === 'back' ? -1 : 1;
    const h = handAt(d, p, view === 'side' ? 1 : side);
    const hasP = pose.pancake;
    const rot = view === 'side' ? (hasP ? -78 : -14) : side * (hasP ? 80 : 14);
    p = withProps(p, [{ svg: X.spatula({ x: h[0], y: h[1], s: 0.8, rot, pancake: hasP || false }), layer: view === 'back' ? 'back' : 'front' }]);
  }
  return drawCharacter(d, p);
};

// Mom: thermos true (left hand), phone true (right hand raised, filming — we see the back of the phone; phoneFace: 'screen' to see the screen)
draw.mom = (pose = {}) => {
  const view = viewOf(pose);
  let p = pose;
  const props = [];
  if (pose.thermos) {
    p = { armL: view === 'side' ? 24 : 18, ...p };
    const h = handAt(D.mom, p, view === 'side' ? 1 : -1);
    props.push({ svg: X.thermos({ x: h[0], y: h[1] - 10, s: 0.62, rot: view === 'side' ? 0 : -4 }), layer: view === 'back' ? 'back' : 'front' });
  }
  if (pose.phone) {
    p = { armR: view === 'side' ? 120 : 150, ...p };
    const side = view === 'side' ? 1 : 1;
    const h = handAt(D.mom, p, side);
    props.push({ svg: X.phone({ x: h[0] + (view === 'side' ? -20 : -14), y: h[1] - 40, s: 0.72, rot: view === 'side' ? -10 : -8, face: pose.phoneFace || 'back', t: pose.t || 0 }), layer: view === 'back' ? 'back' : 'top' });
  }
  return drawCharacter(D.mom, props.length ? withProps(p, props) : p);
};

// Bea: spoon true (right hand), sign true (held in front of her with both hands) | 'up' (on a stick, above her head), gapSmile true (gap-tooth grin)
draw.bea = (pose = {}) => {
  const view = viewOf(pose);
  let p = pose;
  if (pose.gapSmile) p = { ...p, face: faceWith(p.face || 'happy', { mouth: 'grin' }) };
  L5.STATE.t = pose.t || 0;
  const props = [];
  if (pose.spoon) {
    p = { armR: view === 'side' ? 40 : 40, ...p };
    const h = handAt(D.bea, p, 1);
    props.push({ svg: X.spoon({ x: h[0], y: h[1], s: 0.7, rot: view === 'side' ? -20 : 18, full: pose.spoon === 'full' }), layer: view === 'back' ? 'back' : 'front' });
  }
  if (pose.sign) {
    if (pose.sign === 'up') {
      p = { armL: 150, armR: 150, ...p };
      const h = handAt(D.bea, p, 1);
      props.push({ svg: X.goSign({ x: view === 'side' ? -40 : 0, y: h[1] - 280, s: 0.95, stick: true, t: pose.t || 0 }), layer: view === 'back' ? 'back' : 'front' });
    } else {
      p = { armL: 26, armR: 26, ...p };
      props.push({ svg: X.goSign({ x: view === 'side' ? -120 : turnOf(p) * 40, y: -360, s: 0.9, rot: view === 'side' ? 0 : -3, t: pose.t || 0 }), layer: view === 'back' ? 'back' : 'front' });
    }
  }
  return drawCharacter(D.bea, props.length ? withProps(p, props) : p);
};

// Mr. Fig: papers true (stack of quiz papers in the left hand), marker true (right hand)
draw.teacher = (pose = {}) => {
  const view = viewOf(pose);
  let p = pose;
  const props = [];
  if (pose.papers) {
    p = { armL: view === 'side' ? 60 : 30, ...p };
    const h = handAt(D.teacher, p, view === 'side' ? 1 : -1);
    props.push({ svg: X.paperStack({ x: h[0] + (view === 'side' ? -30 : 10), y: h[1] - 10, s: 0.7, rot: view === 'side' ? 0 : -8 }), layer: view === 'back' ? 'back' : 'front' });
  }
  if (pose.marker) {
    p = { armR: view === 'side' ? 70 : 50, ...p };
    const h = handAt(D.teacher, p, 1);
    props.push({ svg: X.marker({ x: h[0], y: h[1], s: 0.7, rot: view === 'side' ? -30 : 24, cap: pose.marker !== 'open' }), layer: view === 'back' ? 'back' : 'front' });
  }
  return drawCharacter(D.teacher, props.length ? withProps(p, props) : p);
};

// Coach Dee: whistle 'chest' (default) | 'mouth' (blowing it: mouth 'o', no chest whistle) ; ball true (dodgeball under the right arm)
draw.coach = (pose = {}) => {
  const view = viewOf(pose);
  let d = D.coach, p = pose;
  if (pose.whistle === 'mouth') {
    d = withOver(D.coachW, (face, t, shade, v) => L5.whistleMouth(v, t));
    p = { ...p, face: faceWith(p.face || 'determined', { mouth: 'o' }) };
  }
  if (pose.ball) {
    const side = view === 'side' ? 0 : 1;
    p = { armR: view === 'side' ? -8 : 16, ...p };
    const x = view === 'side' ? 20 : side * ((d.dims.shoulderX || 100) + 46), y = view === 'side' ? -380 : -396;
    p = withProps(p, [{ svg: X.dodgeball({ x, y, s: 0.95, col: pose.ballCol || '#E8453C' }), layer: view === 'side' ? 'mid' : view === 'back' ? 'mid' : 'mid' }]);
  }
  return drawCharacter(d, p);
};

// Principal Pemberton: foam 0..1 (covered in foam, + foam moustache), spaghetti 0..1 (on her head and shoulders), mic true (right hand)
draw.principal = (pose = {}) => {
  const view = viewOf(pose);
  const foam = pose.foam || 0, sp = pose.spaghetti || 0;
  let d = D.principal, p = pose;
  if (foam > 0 || sp > 0) d = withOver(d, (face, t, shade, v) => L5.spaghettiHead(v, sp, t) + L5.foamHead(v, foam, pose.t || 0, { seed: 8, stache: foam > 0.3, turn: t, topY: -1000 }));
  const props = [];
  if (sp > 0) props.push({ svg: L5.spaghettiBody(view, sp), layer: 'front' });
  if (foam > 0) props.push({ svg: L5.foamBody(view, foam, 9), layer: 'front' });
  if (pose.mic) {
    p = { armR: view === 'side' ? 64 : 48, ...p };
    const h = handAt(d, p, 1);
    props.push({ svg: X.handMic({ x: h[0], y: h[1], s: 0.75, rot: view === 'side' ? -28 : -22 }), layer: view === 'back' ? 'back' : 'front' });
  }
  return drawCharacter(d, props.length ? withProps(p, props) : p);
};

// the juggler: juggle = phase (cycles; e.g. t * 1.6) juggles `pins` (7) bowling pins in a cascade above her hands and drives her arms
draw.juggler = (pose = {}) => {
  if (pose.juggle === undefined || pose.juggle === false) return drawCharacter(D.juggler, pose);
  const ph = +pose.juggle || 0, n = pose.pins || 7;
  const p = { armL: 52 + 16 * Math.sin(ph * Math.PI * 2), armR: 52 - 16 * Math.sin(ph * Math.PI * 2), face: 'happy', ...pose };
  let pins = '';
  for (let i = 0; i < n; i++) {
    // a cascade: every pin runs round a loop of two throws (left->right, then right->left), evenly spaced in phase
    const q = (((ph * 2 + (2 * i) / n) % 2) + 2) % 2;
    const ltr = q < 1, u = ltr ? q : q - 1;
    const x0 = ltr ? -240 : 240, x1 = ltr ? 290 : -290;
    const ux = u * u * (3 - 2 * u); // pins rise beside her head and cross over the top
    const x = x0 + (x1 - x0) * ux, y = -380 - (ltr ? 4900 : 4500) * u * (1 - u);
    pins += X.bowlingPin({ x, y, s: 0.85, rot: u * 540 + i * 30, col: '#FFFFFF', stripe: ['#FF3B6B', '#FFD23F', '#3BD16F', '#2E7BD1'][i % 4], sparkle: true });
  }
  return drawCharacter(D.juggler, withProps(p, [{ svg: pins, layer: 'top' }]));
};

draw.kid = kid;
draw.adult = adult;

// ---------------------------------------------------------------- the ghost (grey, translucent copy of YOU) + ghostLite for crowds
const GHOST_SWAP = [[/#151515/g, '#27364C'], [/#4B1020/g, '#3A4656'], [/#EE6A7C/g, '#9AA6B8'], [/#FF8FA3/g, '#B8C4D4'], [/#8AD8FF/g, '#C8E8F8']];
// Full ghost: the hero rig (same options as YOU: foam, backpack...) in greys, a faint cyan rim, alpha (default 0.55). volume off by default.
draw.ghost = (pose = {}) => {
  const a = pose.alpha ?? 0.55;
  const r = heroOptions(D.ghost, { volume: false, ...pose });
  let svg = drawCharacter(r.d, { shadow: false, ...r.pose });
  for (const [re, to] of GHOST_SWAP) svg = svg.replace(re, to);
  const rim = pose.rim === false ? '' : ghostLiteBody({ ...pose, shadow: false }, RIM);
  return S.g(rim + svg, null, { opacity: f(a) });
};
// ghostLite: a flat simplified silhouette (no clips, no filters, ~16 elements) for crowds of hundreds.
// Same pose fields as any rig character; options: alpha (default 0.55; 1 = opaque, cheapest), col (fill), rim (true adds the cyan rim).
const GL = { fill: '#B7C1CF', hair: '#8F9AAC', face: '#E4EAF2', line: '#4FA9C2', lw: 8, eye: '#FFFFFF', pupil: '#2A3442', face2: true };
const RIM = { fill: '#8FF3FF', hair: '#8FF3FF', face: '#8FF3FF', line: '#8FF3FF', lw: 30, face2: false, shoe: '#8FF3FF' };
const BOB = 'M-141 -672 L-243 -709 L-201 -894 Q0 -1006 199 -894 L242 -712 L142 -672 L142 -708 L126 -716 L104 -770 L92 -796 L84 -849 L5 -792 L-5 -792 L-84 -849 L-92 -796 L-104 -770 L-126 -716 L-142 -708 Z';
const BOB_SIDE = 'M-190 -810 L-145 -795 L-95 -842 L-55 -715 L-15 -722 L-15 -625 L40 -625 L40 -575 L180 -585 L180 -675 L235 -685 L175 -900 Q10 -990 -160 -920 Z';
const BOB_BACK = 'M-243 -709 L-201 -894 Q0 -1006 199 -894 L242 -712 L211 -700 L211 -627 L150 -612 L146 -578 L0 -572 L-146 -578 L-150 -612 L-211 -627 L-211 -700 Z';
const HEAD_F = S.roundedPath([[-140, -890], [140, -890], [140, -559], [-140, -559]], 46);
const HEAD_S = S.roundedPath([[-165, -885], [150, -885], [150, -553], [-165, -553]], 44);
const ARM_F = S.roundedPath([[-30, -18], [30, -18], [40, 268], [-40, 268]], 17);
const ARM_S = S.roundedPath([[-40, -20], [40, -20], [40, 248], [-40, 248]], 18);
const TORSO_F = S.roundedPath([[-100, -533], [100, -533], [100, -306], [-100, -306]], 16);
const TORSO_S = S.roundedPath([[-62, -535], [70, -535], [70, -305], [-62, -305]], 16);
const glCache = new Map();
function glDesign(pal) {
  if (glCache.has(pal)) return glCache.get(pal);
  const st = (fill) => ({ fill, stroke: pal.line, 'stroke-width': pal.lw, 'stroke-linejoin': 'round' });
  const B = st(pal.fill), H = st(pal.hair), Fc = st(pal.face);
  const shoeF = st(pal.shoe || '#DDE3EB');
  const eyes = (cx, side) => {
    if (!pal.face2) return '';
    if (side) return S.ellipse(-118, -716, 40, 62, { fill: pal.eye, stroke: pal.line, 'stroke-width': pal.lw }) + S.circle(-142, -708, 13, { fill: pal.pupil });
    return S.ellipse(cx - 64, -719, 56, 72, { fill: pal.eye, stroke: pal.line, 'stroke-width': pal.lw }) + S.ellipse(cx + 64, -719, 56, 72, { fill: pal.eye, stroke: pal.line, 'stroke-width': pal.lw }) +
      S.circle(cx - 50, -712, 13, { fill: pal.pupil }) + S.circle(cx + 50, -712, 13, { fill: pal.pupil });
  };
  const dsg = {
    dims: {},
    defaults: { volume: false, shade: false, shadow: false, dimFar: false },
    leg: ({ J, back }) => S.path(bentLimb(J, [42, 70, 96], [40, 40, 40], 24).d, B) + S.g(S.path('M-44 -4 L107 -4 L107 40 L-44 40 Z', shoeF), `translate(${f(J.ankle[0])} ${f(J.ankle[1])}) rotate(${f(J.foot)})`),
    legSide: ({ J }) => S.path(bentLimb(J, [64, 74, 85], [58, 69, 80], 24).d, B) + S.g(S.path('M-138 -4 L88 -4 L88 42 L-138 42 Z', shoeF), `translate(${f(J.ankle[0])} ${f(J.ankle[1])}) rotate(${f(J.foot)})`),
    arm: ({ view }) => S.path(view === 'side' ? ARM_S : ARM_F, B),
    torso: () => S.path(TORSO_F, B),
    torsoSide: () => S.path(TORSO_S, B),
    head: (face, t) => { const cx = (t || 0) * 30; return S.g(S.path(HEAD_F, Fc) + S.path(BOB, H), cx ? `translate(${f(cx * 0.5)} 0)` : null) + eyes(cx, false); },
    headSide: () => S.path(HEAD_S, Fc) + S.path(BOB_SIDE, H) + eyes(0, true),
    headBack: () => S.path(HEAD_F, Fc) + S.path(BOB_BACK, H),
  };
  glCache.set(pal, dsg);
  return dsg;
}
function ghostLiteBody(pose, pal) {
  const dsg = glDesign(pal);
  return drawCharacter(dsg, { ...dsg.defaults, ...pose, face: 'neutral', props: [] });
}
draw.ghostLite = (pose = {}) => {
  const pal = pose.col ? { ...GL, fill: pose.col } : GL;
  let svg = ghostLiteBody({ shadow: false, ...pose }, pal);
  if (pose.rim) svg = ghostLiteBody({ shadow: false, ...pose }, RIM) + svg;
  const a = pose.alpha ?? 0.55;
  return a >= 1 ? svg : S.g(svg, null, { opacity: f(a) });
};

// many ghostLites at once: one shared opacity (≈0.6 ms per ghost at s 0.15 instead of ≈1.2 ms with per-ghost alpha).
// poses: array of pose objects (each may set col / rim); opts.alpha (default 0.55)
draw.ghostCrowd = (poses = [], opts = {}) => {
  if (!Array.isArray(poses)) poses = [poses];
  let o = '';
  for (const p of poses) o += draw.ghostLite({ ...p, alpha: 1 });
  const a = opts.alpha ?? 0.55;
  return a >= 1 ? o : S.g(o, null, { opacity: f(a) });
};

const NAMES = {
  you: 'You', ivy: 'Ivy', dad: 'Dad', mom: 'Mom', bea: 'Bea', teacher: 'Mr. Fig', coach: 'Coach Dee', principal: 'Principal Pemberton',
  juggler: 'Juggler', ghost: 'Ghost', ghostLite: 'Ghost (lite)', kid: 'Kid', adult: 'Adult', gary: 'Gary',
};

module.exports = {
  D, draw, NAMES, kidDesign, adultDesign, handAt,
  // re-exports for convenience (scenes can also require('../rig/extras') directly)
  gary: X.gary, fishbowl: X.fishbowl, extras: X,
};
