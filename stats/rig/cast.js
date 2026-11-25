// The cast of "What If You Could See Everyone's STATS in Real Life?" — all built on the R6 rig.
// YOU is the channel hero: the default r6.js construction (BASE_STYLE) with his jacket/T-shirt/pants colours only — never redesign.
// The family: Mom (bakery owner), Grandpa Lou (79), Max (5, dinosaur onesie), Biscuit (the corgi, non-rig: rig/extras.js);
// school: Benji (best friend), Tank (the bully), Mrs. Krump (the teacher), the lunch lady, the coach; town: Mrs. Wells, the fair
// worker; cheap flat crowds: kid(i) / adult(i). Looks live in rig/looks7.js (on top of looks3..6), props in rig/extras.js.
// Reference: docs/CAST.md (keys, heights, options, hand anchors, head tops for the HUD plates, perf).
'use strict';

const S = require('./svg');
const { makeDesign, makeStyle } = require('./r6');
const { drawCharacter, BASE_DEFAULTS, BASE_DIMS } = require('./body');
const L3 = require('./looks3');
const L4 = require('./looks4');
const L5 = require('./looks5');
const L6 = require('./looks6');
const L7 = require('./looks7');
const X = require('./extras');
const { f, clamp, lerp } = S;

const D = {};
const design = (style) => L7.dress7(L6.dress6(L5.dress5(L4.dress4(L3.dress(makeDesign(style))))));

// ---------------------------------------------------------------- YOU (the hero) — DO NOT REDESIGN: only these colours
const HERO_COL = { jacket: '#D8262E', jacketLine: '#B01D24', shirt: '#F2D04A', shirtShade: '#D9B73A', pants: '#1F3B2A', pantsShade: '#162C1F' };
D.you = makeDesign({ col: HERO_COL });
// his arm drawn by the bendable looks7 arm (same look) — only used when a pose bends an elbow, so plain poses stay byte-identical
const heroBentArm = L7.makeArm7(makeStyle({ sleeve: 'short', col: { skin: '#FFFFFF', skinShade: '#E7E8F0', sleeve: HERO_COL.jacket } }));
// pajamas: the same head (bob), navy pyjamas with stars + little game controllers, blue slippers
D.youPJ = design({
  top: 'pjHero', sleeve: 'long', sleevePattern: 'stars', pantsShape: 'wide', pantsPattern: 'stars', shoe: 'slipper',
  col: { top: '#2F4A8A', topShade: '#24396C', sleeve: '#2F4A8A', cuff: '#24396C', pattern: '#FFD84A', piping: '#FFFFFF', pants: '#2F4A8A', pantsShade: '#24396C', sole: '#7FA8E0', soleShade: '#5E86C0', toe: '#A8C8F0' },
});

// ================================================================= THE FAMILY
// Mom — bakery owner: short practical pixie under a red polka-dot bandana, teal T-shirt + cream bakery apron (cupcake patch, coral
// stitching, a whisk in the pocket), jeans, coral sneakers; tired half-lidded eyes with dark circles, a flour smudge, a big smile
const MOM_COL = {
  skin: '#F6D2B8', skinShade: '#E6B89A', skinShade2: '#C99478', hair: '#6B3A22', hairShade: '#4E2814', hairHi: '#93583A', brow: '#4E2814', band: '#E8453C', bandDot: '#FFFFFF',
  top: '#3FA7A0', topShade: '#2E8580', sleeve: '#3FA7A0', cuff: '#2E8580', apron: '#FFF3DC', apronTrim: '#F27C6B',
  pants: '#3E5C8A', pantsShade: '#30486E', sole: '#FFFFFF', soleShade: '#E0E0EA', toe: '#F27C6B',
};
const MOM = {
  hair: 'momPixie', eyeStyle: 'mid', lashes: true, top: 'bakerApron', sleeve: 'short', pantsShape: 'straight', size: 1.04, torsoW: 100, shoe: 'sneaker',
  eye: { iris: '#8A5A3A', pupil: 0.95, upper: 0.2 }, brows: { L: [-4, 0], R: [-4, 0] }, neutralMouth: 'smile',
  acc: { eyeBags: { x: 60, y: -704, rx: 50 }, flourCheek: true, cheekBlush: '#FF9F8F' },
  ext7: { kind: 'apron', top: -330, len: 196, flare: 14, col: '#FFF3DC', trim: '#F27C6B', whisk: true },
  col: MOM_COL,
};
D.mom = design(MOM);
// Mom's day off (the fair): coral-striped boat-neck tee, light rolled jeans, white sneakers, a straw sunhat (drawn by draw.mom)
D.momDayoff = design({
  ...MOM, top: 'momStripes', ext7: null, cuffCol: '#A8C8EC', acc: { eyeBags: { x: 60, y: -704, rx: 50 }, cheekBlush: '#FF9F8F' },
  col: { ...MOM_COL, band: null, top: '#FFFFFF', topShade: '#E4E4EC', sleeve: '#FFFFFF', cuff: '#E4E4EC', stripe: '#F27C6B', accent: '#F27C6B', pants: '#8FB4E2', pantsShade: '#759ACB', toe: '#FFFFFF' },
});

// Grandpa Lou — tall, bald (shiny dome, big ears, white side tufts), droopy white brows, a HUGE white walrus moustache, a moss
// cardigan with a big felt "79" patch over a light-blue shirt, brown cords, loafers; a bicep that still bulges when he flexes
const LOU_COL = {
  skin: '#F4C9A8', skinShade: '#E2AF8C', skinShade2: '#C98A6A', hair: '#F4F4F8', hairShade: '#C9C4D8', hairHi: '#FFFFFF', brow: '#F4F4F8', stache: '#F6F6FA', stacheHi: '#FFFFFF',
  top: '#7E9A56', topShade: '#637D40', sleeve: '#7E9A56', cuff: '#637D40', shirt: '#CFE2F6', shirtShade: '#A8C4E0', collar: '#E8F2FF', button: '#F2E6C8', patch: '#F4E6C8', patchInk: '#B8331E',
  pants: '#8A6A4A', pantsShade: '#6E5238', sole: '#6A4428', soleShade: '#4E3018', toe: '#8A5A34',
};
D.grandpa = design({
  hair: 'louBald', eyeStyle: 'dot', top: 'louCardigan', sleeve: 'long', pantsShape: 'straight', size: 1.1, torsoW: 108, taper: -6, shoe: 'loafer', bicep: true,
  eye: { pupil: 1.0 }, brows: false, browBase: { L: [-6, 4], R: [-6, 4] }, neutralMouth: 'smile',
  acc: { droopBrows: '#F4F4F8', hugeWalrus: 1.24, cheekBlush: '#FF9F8F' },
  col: LOU_COL,
});

// Max — 5: SMALL (size 0.56, a big head), ginger curls like his brother, the hero's big round eyes, freckles, a green dinosaur onesie
// (cream belly, orange back spikes, a tail, claw mittens, dino feet) whose hood has teeth, googly eyes and spikes
const MAX_COL = {
  skin: '#FFF4EC', skinShade: '#F0DED2', hair: '#D2601E', hairShade: '#A84A12', hairHi: '#F08A3A', brow: '#A84A12',
  dino: '#5DBB4A', dinoShade: '#459A36', dinoHi: '#8AD872', belly: '#FFE9A8', bellyShade: '#E8CC80', spike: '#FFB43A', teeth: '#FFFFFF',
  top: '#5DBB4A', topShade: '#459A36', sleeve: '#5DBB4A', cuff: '#459A36', pants: '#5DBB4A', pantsShade: '#459A36', sole: '#5DBB4A', soleShade: '#459A36', toe: '#5DBB4A',
};
const MAX = {
  hair: 'maxHood', eyeStyle: 'big', top: 'dinoOnesie', sleeve: 'long', gloveCol: '#5DBB4A', claws: '#FFFFFF', pantsShape: 'straight', shoe: 'dinoFoot',
  size: 0.56, headK: 1.16, torsoW: 100, blush: true, eye: { pupil: 1.15, sparkle: true }, brows: false, neutralMouth: 'smile',
  acc: { freckles6: '#E8A07A' }, col: MAX_COL,
};
D.max = design({ ...MAX, col: { ...MAX_COL, hairHi: MAX_COL.dinoHi } });
D.maxHoodDown = design({ ...MAX, hair: 'maxCurls', brows: null });

// ================================================================= SCHOOL
// Benji — best friend: skinny (thin arms/legs) in an oversized purple rocket hoodie (baggy sleeves, hem over the hips), a teal +
// mustard bobble hat, HUGE round glasses, braces (visible whenever his mouth shows teeth), brown high-water cords, red-striped socks,
// sneakers with untied laces
const BENJI_COL = {
  skin: '#B07450', skinShade: '#9A6242', hair: '#2A1E1A', hairShade: '#1A1210', hairHi: '#6ED6D0', brow: '#2A1E1A',
  hat: '#2BB5B0', hat2: '#FFC93C', hatCuff: '#1E8E8A', pom: '#FFC93C',
  top: '#7E63C9', topShade: '#6450A8', sleeve: '#7E63C9', cuff: '#6450A8',
  pants: '#8A6A3E', pantsShade: '#6E522E', sole: '#FFFFFF', soleShade: '#E0E0EA', toe: '#E8453C', lace: '#FFFFFF',
};
D.benji = design({
  hair: 'benjiBobble', eyeStyle: 'mid', top: 'benjiHoodie', sleeve: 'baggy', pantsShape: 'straight', size: 0.98, torsoW: 100, armW: 0.8, legW: 0.78,
  eye: { iris: '#5A3A22', pupil: 1.12, sparkle: true }, brows: { L: [-6, 0], R: [-6, 0] }, neutralMouth: 'smile',
  acc: { bigSpecs: { col: '#3A2A22', r: 70, x: 70, y: -706 }, braces: true, cheekBlush: '#E8806A' },
  socks: '#FFFFFF', sockStripe: '#E8453C', sockH: 66, laces: true, shoe: 'sneaker',
  ext7: { kind: 'hoodieHem', top: -330, len: 62, flare: 10, col: '#7E63C9', shade: '#6450A8' },
  col: BENJI_COL,
});

// Tank — the bully: huge (size 1.35), a smallish head on a wide body, square buzz cut, heavy block brows, a band-aid on his cheek,
// a charcoal tee under a patched, frayed denim vest, olive cargo pants, boots, big brick fists
const TANK_COL = {
  skin: '#E8B48C', skinShade: '#D49C74', skinShade2: '#B8805A', hair: '#3A2A22', hairShade: '#241812', hairHi: '#5A463A', brow: '#2A1E18',
  top: '#3B3F4A', topShade: '#2C2F38', shirtShade: '#2C2F38', sleeve: '#3B3F4A', cuff: '#2C2F38',
  vest: '#6D93C4', vestShade: '#557AAB', vestStitch: '#F2D38A',
  pants: '#5E6B3E', pantsShade: '#4A5530', sole: '#5A3E2C', soleShade: '#2E2420', toe: '#6E4C36', lace: '#E8D8B0',
};
D.tank = design({
  hair: 'tankBuzz', eyeStyle: 'dot', top: 'tankVest', sleeve: 'short', pantsShape: 'straight', size: 1.35, headK: 0.9, torsoW: 128, taper: 8, armW: 1.22, legW: 1.2, hipK: 1.42, fist: true, shoe: 'boot',
  eye: { pupil: 0.85 }, brows: false, browBase: { L: [10, -4], R: [10, -4] }, neutralMouth: 'line',
  acc: { blockBrows: '#2A1E18', tankBandaid: true }, col: TANK_COL,
});

// Mrs. Krump — the teacher: tall, a tall grey beehive, plum cat-eye glasses, a red pen behind her ear, red lips, a long plum
// cardigan to the knees over a cream ruffled blouse with a cameo, a grey skirt, dark stockings, low heels
const KRUMP_COL = {
  skin: '#F3DDD0', skinShade: '#E2C4B2', hair: '#B8BCC8', hairShade: '#8E93A2', hairHi: '#E4E6EE', hairBand: '#5A3A6A', brow: '#5E6270',
  top: '#7A3E6E', topShade: '#5E2C54', sleeve: '#7A3E6E', cuff: '#5E2C54', shirt: '#FFF6E6', shirtShade: '#E8D8C0',
  pants: '#3E3848', pantsShade: '#2E2838', sole: '#2A2230', soleShade: '#1A141E', toe: '#2A2230',
};
D.teacher = design({
  hair: 'krumpHive', eyeStyle: 'mid', lashes: true, top: 'krumpCardigan', sleeve: 'long', pantsShape: 'straight', size: 1.12, torsoW: 96, taper: -4, armW: 0.95, legW: 0.9, shoe: 'heel',
  eye: { iris: '#4A6A8A', pupil: 0.82, upper: 0.24, tilt: 8 }, brows: { L: [14, -8], R: [14, -8] }, neutralMouth: 'line',
  acc: { catEye: { col: '#5A2A6A' }, lipTint: '#C8405A', glareSpecs: true },
  ext7: { kind: 'longCard', top: -330, len: 236, flare: 24, col: '#7A3E6E', shade: '#5E2C54', inner: '#6F6A80' },
  col: KRUMP_COL,
});
// her beehive: an unfiltered layer behind the head (front / side) or over the back hair (back) — keeps the volume filter cheap
D.teacher.under = (face, t, shade, v) => (v === 'back' ? '' : L7.krumpHive(v, t, KRUMP_COL));
D.teacher.over = (face, t, shade, v) => (v === 'back' ? L7.krumpHive('back', 0, KRUMP_COL) : '');

// the lunch lady ("secret skill: mystery meat"): big auburn curls in a hairnet, mint uniform + stained apron with a name tag, a ladle
D.lunchLady = design({
  hair: 'netCurls', eyeStyle: 'dot', top: 'lunchUniform', sleeve: 'short', pantsShape: 'straight', size: 1.06, torsoW: 118, armW: 1.1, legW: 1.08, shoe: 'sneaker',
  eye: { pupil: 0.95 }, brows: { L: [-4, 2], R: [-4, 2] }, neutralMouth: 'smirk', acc: { cheekBlush: '#FF8F8F', lipTint: '#E05A6A' },
  ext7: { kind: 'apron', top: -330, len: 170, flare: 16, col: '#FFFFFF', trim: '#7FCFB0' },
  col: { skin: '#F2C0A0', skinShade: '#E0A888', hair: '#C2452D', hairShade: '#962E1A', hairHi: '#E06A4A', brow: '#962E1A', top: '#7FCFB0', topShade: '#5EAF92', sleeve: '#7FCFB0', cuff: '#5EAF92', apron: '#FFFFFF', tag: 'DOT', pants: '#3A4A5E', pantsShade: '#2E3A4A', sole: '#FFFFFF', soleShade: '#E0E0EA', toe: '#7FCFB0' },
});
// the gym coach (dodgeball): cap, tracksuit with a whistle (looks4)
D.coach = design({
  hair: 'coachCap', eyeStyle: 'dot', top: 'tracksuit', sleeve: 'long', trackStripe: '#FFFFFF', pantsShape: 'straight', legStripe: '#FFFFFF', size: 1.08, torsoW: 112, shoe: 'sneaker',
  eye: { pupil: 0.9 }, brows: { L: [6, 0], R: [6, 0] }, neutralMouth: 'line', acc: { stubble: '#3A2A22' },
  col: { skin: '#C98D6A', skinShade: '#B0754F', hair: '#2A1E1A', hairShade: '#1A1210', brow: '#2A1E1A', cap: '#E8453C', capShade: '#B82626', capBrim: '#B82626', capLogo: '#FFFFFF', top: '#2E4A9A', topShade: '#24397A', sleeve: '#2E4A9A', cuff: '#24397A', panel: '#FFFFFF', lanyard: '#E8453C', pants: '#2E4A9A', pantsShade: '#24397A', sole: '#FFFFFF', soleShade: '#E0E0EA', toe: '#E8453C' },
});

// ================================================================= TOWN
// Mrs. Wells (the neighbour with the groceries — "Nice hat, Mrs. Wells!"): white curls under a lilac cloche with a big pink flower,
// a dusty-rose coat with big buttons, pearls, stockings, low shoes
D.neighbor = design({
  hair: 'wellsHat', eyeStyle: 'mid', lashes: true, top: 'wellsCoat', sleeve: 'long', pantsShape: 'straight', size: 0.92, torsoW: 104, taper: -6, shoe: 'heel', legW: 0.92,
  eye: { iris: '#5A7AB8', pupil: 0.9, upper: 0.12 }, brows: { L: [-6, 0], R: [-6, 0] }, neutralMouth: 'smile', acc: { cheekBlush: '#FF9FB0', lipTint: '#E0607A' },
  ext7: { kind: 'coat', top: -330, len: 200, flare: 26, col: '#D88A9A', shade: '#B86E7E', inner: '#8A7AA8' },
  col: { skin: '#F8DCCB', skinShade: '#E8C2AE', hair: '#F4F2F8', hairShade: '#C9C4D8', hairHi: '#FFFFFF', brow: '#B8B4C4', hat: '#B9A6E8', hatBand: '#8A74C8', flower: '#FF7FA8', top: '#D88A9A', topShade: '#B86E7E', sleeve: '#D88A9A', cuff: '#B86E7E', shirt: '#FFF6F0', button: '#F2E6C8', pants: '#C9B8B0', pantsShade: '#B0A098', sole: '#6A4A5A', soleShade: '#4E3442', toe: '#6A4A5A' },
});
// the fair worker: red-and-white striped shirt, a cap
D.fairWorker = design({
  hair: 'logoCap', eyeStyle: 'dot', top: 'stripeTee', sleeve: 'short', pantsShape: 'straight', size: 1.04, torsoW: 106, shoe: 'sneaker', eye: { pupil: 0.95 }, brows: { L: [0, 0], R: [0, 0] }, neutralMouth: 'smile',
  col: { skin: '#E0A878', skinShade: '#C98D6A', hair: '#5A3A22', hairShade: '#3A2414', brow: '#3A2414', cap: '#E8453C', capShade: '#B82626', capBrim: '#B82626', capLogo: '#FFD23F', top: '#FFFFFF', topShade: '#E4E4EC', sleeve: '#E8453C', stripe: '#E8453C', pants: '#3A4A6A', pantsShade: '#2E3A56', sole: '#FFFFFF', soleShade: '#E0E0EA', toe: '#E8453C' },
});

// ================================================================= CROWDS: flat lite humans (no clips, no filters)
const hashK = (i, k) => { const v = Math.sin((i + 1) * 91.7 + k * 13.3) * 43758.5453; return v - Math.floor(v); };
const pickK = (i, arr, k) => arr[Math.floor(hashK(i, k) * arr.length) % arr.length];
const PAL = ['#FF6B6B', '#4ECDC4', '#FFD166', '#9B5DE5', '#1982C4', '#8AC926', '#FF924C', '#F15BB5', '#00BBF9', '#F94144', '#43AA8B', '#3A86FF', '#FFB703', '#06D6A0', '#EF476F', '#7B2CBF'];
const SKINS = ['#FFE3CF', '#F8D9C0', '#F2C9A0', '#E9B38B', '#E0A878', '#C98D6A', '#B07450', '#8D5A3B', '#6B4430'];
const HAIRC = ['#1E1A1C', '#3A2A22', '#5A3A22', '#7A4A2A', '#B86A2A', '#E0A23A', '#F2D06A', '#C2452D', '#2A2230'];
const OLDHAIR = ['#F4F2F8', '#C9C4D8', '#9A9AA8', '#E8E4F0'];
const PANTS = ['#2E3A55', '#5A6070', '#3A6A9A', '#2B2B33', '#6E7891', '#4A5A3A', '#8A6A4A', '#3E5C8A'];
// kid i: special designs at fixed indices (documented): 0 = the homework kid ("My dog ate it!" — KID voice), 1 = the quiet kid
// (dodgeball, 85 STRENGTH: grey hoodie, shy), 2 / 3 = the "smart kids" (INT 95: glasses, sweater, bun / side part)
const KID_SPECIAL = {
  0: { skin: '#F2C9A0', hair: '#5A3A22', hairStyle: 'spiky', shirt: '#43AA8B', pants: '#2E3A55', logo: 'num', num: '9', logoCol: '#FFFFFF', size: 0.82, mouth: 'smile', blush: true, brows: true },
  1: { skin: '#E0A878', hair: '#1E1A1C', hairStyle: 'crop', shirt: '#8A8F9B', sleeve: '#8A8F9B', longSleeve: true, pants: '#2B2B33', jacket: '#6E7380', size: 0.86, mouth: 'line', brows: true },
  2: { skin: '#FFE3CF', hair: '#2A2230', hairStyle: 'bun', shirt: '#FFFFFF', jacket: '#3A6A9A', pants: '#2E3A55', size: 0.8, glasses: true, mouth: 'smallSmile', skirt: '#3A4A6A', skirtLen: -170 },
  3: { skin: '#C98D6A', hair: '#1E1A1C', hairStyle: 'buzz', shirt: '#FFFFFF', jacket: '#7A2A3A', pants: '#2B2B33', size: 0.84, glasses: true, mouth: 'line' },
};
function kidSpec(i) {
  if (KID_SPECIAL[i]) return KID_SPECIAL[i];
  const girl = hashK(i, 1) > 0.5;
  const shirt = pickK(i, PAL, 2);
  return {
    skin: pickK(i, SKINS, 3), hair: pickK(i, HAIRC, 4), hairStyle: girl ? pickK(i, ['pony', 'pigtails', 'bob', 'long', 'curly', 'bun'], 5) : pickK(i, ['crop', 'spiky', 'buzz', 'curly', 'afro', 'crop'], 5),
    shirt, sleeve: hashK(i, 6) > 0.6 ? pickK(i, PAL, 7) : shirt, pants: pickK(i, PANTS, 8), logo: pickK(i, ['star', 'heart', 'stripe', 'num', '', 'dot'], 9), num: String(1 + Math.floor(hashK(i, 10) * 30)), logoCol: hashK(i, 11) > 0.5 ? '#FFFFFF' : pickK(i, PAL, 12),
    jacket: hashK(i, 13) > 0.8 ? pickK(i, PAL, 14) : null, skirt: girl && hashK(i, 15) > 0.6 ? pickK(i, PAL, 16) : null, skirtLen: -180,
    hat: hashK(i, 17) > 0.86 ? pickK(i, ['cap', 'beanie', 'headband'], 18) : null, hatCol: pickK(i, PAL, 19), glasses: hashK(i, 20) > 0.85,
    size: 0.76 + hashK(i, 21) * 0.12, mouth: pickK(i, ['smile', 'smallSmile', 'smile', 'grin', 'line'], 22), blush: hashK(i, 23) > 0.6, brows: hashK(i, 24) > 0.5, longSleeve: hashK(i, 25) > 0.7,
  };
}
function adultSpec(i) {
  const woman = hashK(i, 31) > 0.5, old = hashK(i, 32) > 0.8;
  const shirt = pickK(i, PAL, 33);
  return {
    skin: pickK(i, SKINS, 34), hair: old ? pickK(i, OLDHAIR, 35) : pickK(i, HAIRC, 35),
    hairStyle: woman ? pickK(i, ['long', 'bob', 'pony', 'bun', 'curly', 'afro'], 36) : pickK(i, ['crop', 'buzz', 'bald', 'curly', 'crop', 'spiky'], 36),
    shirt, sleeve: shirt, pants: pickK(i, PANTS, 37), logo: pickK(i, ['', 'stripe', '', 'star', 'dot', ''], 38), logoCol: '#FFFFFF',
    jacket: hashK(i, 39) > 0.55 ? pickK(i, ['#3A4A6A', '#7A4A2A', '#4A5A3A', '#8A2A3A', '#2A2A33', '#C98A3A'], 40) : null,
    skirt: woman && hashK(i, 41) > 0.55 ? pickK(i, PAL, 42) : null, skirtLen: -130, longSleeve: hashK(i, 43) > 0.4,
    hat: hashK(i, 44) > 0.78 ? pickK(i, ['cap', 'sunhat', 'beanie', 'sunhat'], 45) : null, hatCol: pickK(i, PAL, 46), glasses: hashK(i, 47) > 0.7,
    beard: !woman && hashK(i, 48) > 0.75, size: 1.0 + hashK(i, 49) * 0.14, mouth: pickK(i, ['smile', 'smallSmile', 'line', 'smile'], 50), blush: woman && hashK(i, 51) > 0.5, brows: true,
  };
}
const kidCache = {}, adultCache = {};
const kidDesign = (i) => (kidCache[i] = kidCache[i] || L7.liteHuman(kidSpec(i)));
const adultDesign = (i) => (adultCache[i] = adultCache[i] || L7.liteHuman(adultSpec(i)));

// ================================================================= helpers: hands, props, overlays
const rad = (d) => (d * Math.PI) / 180;
// grip point of a hand in BODY space for the pose's arm angle AND elbow bend; side +1 = screen-right arm (armR), −1 = armL
function handAt(dsg, pose, side, grip = 236) {
  const view = pose.view || 'front';
  const a = side < 0 ? (pose.armL ?? 9) : (pose.armR ?? 9);
  const B = (side < 0 ? pose.bendL : pose.bendR) || 0;
  const dims = dsg.dims || {};
  const el = view === 'side' ? L7.EL_S : L7.EL_F;
  let lx = 0, ly = grip;
  if (Math.abs(B) >= 2 && grip > el) { const L = grip - el, r = rad(B); lx = (view === 'side' ? -1 : 1) * Math.sin(r) * L; ly = el + Math.cos(r) * L; }
  const ra = rad(a);
  if (view === 'side') {
    const [sx, sy] = dims.sideShoulder || [4, -505];
    return [sx + lx * Math.cos(ra) - ly * Math.sin(ra), sy + lx * Math.sin(ra) + ly * Math.cos(ra)];
  }
  const W = dims.shoulderX || 100, Y = dims.shoulderY || -515;
  const t = view === 'back' ? 0 : clamp(pose.turn || 0, -1, 1), at = Math.abs(t), dir = t >= 0 ? 1 : -1;
  const far = at > 0.35 && dir === side;
  const ax = side * W + (far ? -side * 30 * at : 8 * at * dir);
  return [ax + side * (lx * Math.cos(ra) + ly * Math.sin(ra)), Y + (-lx * Math.sin(ra) + ly * Math.cos(ra))];
}
// the same hand in SCREEN space for a draw call's pose: handPos('mom', { x, y, s, armR: 22, bendR: -128 }, 1) -> [x, y]
// (follows x, y, s, size, flip, lift, bodyY, lean, rot) — e.g. to start a coffee-steam effect or a thrown object at the hand
function handPos(key, pose = {}, side = 1, grip = 236) {
  const dsg = D[key] || D.you;
  const p = { ...BASE_DEFAULTS, ...pose };
  const Z = (dsg.dims && dsg.dims.size) || 1, fs = p.flip ? -1 : 1, s = p.s * Z;
  let [hx, hy] = handAt(dsg, p, side, grip);
  const rl = rad(p.lean || 0), dy = hy + 306;
  [hx, hy] = [hx * Math.cos(rl) - dy * Math.sin(rl), hx * Math.sin(rl) + dy * Math.cos(rl) - 306 + (p.bodyY || 0)];
  if (p.rot) { const rr = rad(p.rot), ry = hy - p.rotY; [hx, hy] = [hx * Math.cos(rr) - ry * Math.sin(rr), hx * Math.sin(rr) + ry * Math.cos(rr) + p.rotY]; }
  return [p.x + fs * s * hx * (p.sx ?? 1), p.y - (p.lift || 0) + s * hy * (p.sy ?? 1)];
}
// the forearm's direction (deg, 0 = pointing down the screen, + = clockwise) — to rotate held props with the hand
function forearmAngle(pose, side) {
  const view = pose.view || 'front';
  const a = side < 0 ? (pose.armL ?? 9) : (pose.armR ?? 9);
  const B = (side < 0 ? pose.bendL : pose.bendR) || 0;
  return view === 'side' ? a + B : -side * (a + B);
}
const withProps = (pose, extra) => ({ ...pose, props: [...(pose.props || []), ...extra.filter((q) => q && q.svg)] });
// add an extra `over` layer (head space, follows headRot/headY) to a design for one draw
function withOver(dsg, fn) {
  const k = dsg.style && dsg.style.headK;
  const o0 = dsg.over;
  return { ...dsg, over: (face, t, shade, view) => (o0 ? o0(face, t, shade, view) : '') + L5.headScale(fn(face, t, shade, view) || '', k) };
}
function withUnder(dsg, fn) {
  const u0 = dsg.under;
  return { ...dsg, under: (face, t, shade, view) => (u0 ? u0(face, t, shade, view) : '') + (fn(face, t, shade, view) || '') };
}
const viewOf = (p) => p.view || 'front';
const turnOf = (p) => (viewOf(p) === 'front' ? clamp(p.turn || 0, -1, 1) : 0);
const faceWith = (face, extra) => (typeof face === 'object' && face ? { ...face, ...extra, eyes: { ...(face.eyes || {}), ...(extra.eyes || {}) } } : { name: face || 'neutral', ...extra });
const layerFor = (view, front = 'front') => (view === 'back' ? 'back' : front);
function drawWith(dsg, pose, props) {
  const p = { ...pose, nametag: null };
  return drawCharacter(dsg, props && props.length ? withProps(p, props) : p);
}
// run a draw with looks7 per-draw state (reset afterwards even if the draw throws)
function withState(st, fn) {
  const prev = { ...L7.STATE };
  Object.assign(L7.STATE, st);
  try { return fn(); } finally { Object.assign(L7.STATE, prev); }
}
// a prop held at a hand: fn(x, y, rotDeg) -> svg, in body space; layer by view
function held(dsg, p, side, fn, grip = 236, layer) {
  const h = handAt(dsg, p, side, grip);
  return { svg: fn(h[0], h[1]), layer: layer || layerFor(viewOf(p)) };
}
const bentArms = (p) => !!(p.bendL || p.bendR);
// option presets: arm fields (armL/armR/bendL/bendR) of a preset WIN over the pose (so auto-acting gestures can't pull a held prop or a
// flex apart) unless the pose has freeArms: true; every other preset field is just a default (explicit pose fields win)
const ARM_FIELDS = ['armL', 'armR', 'bendL', 'bendR'];
function keep(p, preset) {
  const out = { ...preset, ...p };
  if (!p.freeArms) for (const k of ARM_FIELDS) if (k in preset) out[k] = preset[k];
  return out;
}
// default arm angle + elbow bend for a held prop: front / back view use `side` (+1 = armR); the side view uses the near arm (armL),
// where + bends forward. Explicit pose fields always win.
function armPose(p, side, front, sideView) {
  if (viewOf(p) === 'side') return sideView ? keep(p, { armL: sideView[0], bendL: sideView[1] }) : p;
  return side < 0 ? keep(p, { armL: front[0], bendL: front[1] }) : keep(p, { armR: front[0], bendR: front[1] });
}
const handSide = (p, side) => (viewOf(p) === 'side' ? -1 : side);

// ================================================================= draw functions + options
const draw = {};

// YOU — the hero. Options: headset: true|0..1 (night gaming; a number animates putting it on), pajamas: true (waking up),
// backpack: true (school; col via backpack: '#hex'), apron: true (making breakfast), hood: true (red hood over the bob),
// tablet: true (held in both hands; tabletFace 'back'|'screen', screen, glow). Elbows bend with bendL / bendR (all characters).
draw.you = (pose = {}) => {
  const view = viewOf(pose);
  let d = pose.pajamas ? D.youPJ : D.you, p = pose;
  if (!pose.pajamas && bentArms(p)) d = { ...d, arm: (o) => ((o.side < 0 ? p.bendL : p.bendR) ? heroBentArm(o) : D.you.arm(o)) };
  const overs = [];
  if (pose.hood) overs.push((face, t, shade, v) => L6.heroHood(v, t));
  if (pose.headset) overs.push((face, t, shade, v) => L6.gamingHeadset(v, t, { earX: 222, top: -1120, k: pose.headset === true ? 1 : +pose.headset }));
  if (overs.length) d = withOver(d, (face, t, shade, v) => overs.map((fn) => fn(face, t, shade, v)).join(''));
  const props = [];
  if (pose.backpack) {
    const col = typeof pose.backpack === 'string' ? pose.backpack : '#3B82C4';
    if (view === 'front') props.push({ svg: L7.backpackBehind(turnOf(p), col), layer: 'back' }, { svg: L7.backpack('front', turnOf(p), col), layer: 'mid' });
    else if (view === 'side') props.push({ svg: L7.backpack('side', 0, col), layer: 'back' });
    else props.push({ svg: L7.backpack('back', 0, col), layer: 'mid' });
  }
  if (pose.apron && view === 'front') props.push({ svg: L7.heroApron(turnOf(p)), layer: 'mid' });
  if (pose.apron && view === 'back') props.push({ svg: L6.band('M-74 -530 L62 -340 M74 -530 L-62 -340 M-108 -330 L108 -330', 9, '#FFF3DC', 6), layer: 'mid' });
  if (pose.apron && view === 'side') props.push({ svg: S.path('M-80 -490 L-50 -490 L-40 -150 L-90 -150 Z', { fill: '#FFF3DC', stroke: '#151515', 'stroke-width': 6, 'stroke-linejoin': 'round' }), layer: 'mid' });
  if (pose.tablet) {
    p = keep(p, { armL: view === 'side' ? 40 : 26, armR: view === 'side' ? 50 : 26 });
    props.push({ svg: X.tablet({ x: view === 'side' ? -150 : turnOf(p) * 40, y: -380, s: 0.6, rot: view === 'side' ? 0 : 4, face: pose.tabletFace || 'back', screen: pose.screen || null, glow: pose.glow || 0 }), layer: view === 'back' ? 'back' : 'front' });
  }
  return drawWith(d, p, props);
};

// MOM — options: coffee: true|'sip' (mug at her chest / raised to her cheek; steam with t), flour: 0..1 (default 0.5: the cheek
// smudge + dust on the apron + in her hair; 0 = clean), phone: true|'ear' (looking at it / on the phone), tired: 0..1 (droopier
// eyes, darker circles, slumped shoulders), asleep: true (dozing standing up: eyes shut, head drooping, floating zzz with t),
// dayoff: true (striped tee + jeans + straw sunhat — the fair), pan: true (frying pan with an egg, right hand)
draw.mom = (pose = {}) => {
  const view = viewOf(pose);
  let d = pose.dayoff ? D.momDayoff : D.mom, p = pose;
  const tired = clamp(pose.asleep ? 1 : +pose.tired || 0, 0, 1);
  if (tired > 0) {
    p = { bodyY: 10 * tired, lean: 2 * tired, armL: 5, armR: 5, headRot: 4 * tired, ...p };
    if (p.face !== undefined || !pose.asleep) p = { ...p, face: faceWith(p.face || 'happy', { eyes: { upper: 0.3 + 0.35 * tired, tilt: -6 * tired }, ...(p.face && p.face.brows ? {} : { brows: { L: [-30 * tired, 10 * tired], R: [-30 * tired, 10 * tired] } }) }) };
  }
  if (pose.asleep) p = { ...p, face: faceWith(pose.face && typeof pose.face === 'object' ? pose.face : { name: 'sleepy', fx: [] }, { eyes: { type: 'closed' }, mouth: (pose.face && pose.face.mouth) || 'o', fx: [] }), headRot: pose.headRot ?? 12, bodyY: pose.bodyY ?? 14, lean: pose.lean ?? 3 };
  if (pose.dayoff) d = withOver(d, (face, t, shade, v) => L7.sunhat(v, t));
  if (pose.asleep) d = withOver(d, () => L7.zzz(pose.t || 0, 190, -980));
  const props = [];
  if (pose.coffee) {
    const sip = pose.coffee === 'sip';
    p = sip ? armPose(p, 1, [140, 175], [120, 120]) : armPose(p, 1, [22, -128], [30, 80]);
    props.push(held(d, p, handSide(p, 1), (x, y) => X.coffeeMug({ x: x + (sip ? -10 : 0), y: y - 46, s: 0.62, t: pose.t || 0, steam: pose.asleep ? 0 : 1 }), 250));
  }
  if (pose.phone) {
    const ear = pose.phone === 'ear';
    p = ear ? armPose(p, -1, [140, 175], [160, 150]) : armPose(p, -1, [20, -126], [40, 70]);
    const sv = viewOf(p) === 'side';
    props.push(held(d, p, handSide(p, -1), (x, y) => X.phone({ x: x + (ear ? (sv ? 10 : 6) : 0), y: y - (ear ? (sv ? 110 : 40) : 60), s: 0.5, rot: ear ? (sv ? -10 : 10) : -6, face: ear ? 'back' : (pose.phoneFace || 'back'), screen: pose.screen || null })));
  }
  if (pose.pan) {
    p = armPose(p, 1, [70, -30], [80, 20]);
    props.push(held(d, p, handSide(p, 1), (x, y) => X.fryingPan({ x, y, s: 0.7, rot: viewOf(p) === 'side' ? 0 : 30 })));
  }
  const flour = pose.flour ?? (pose.dayoff ? 0 : 0.5);
  return withState({ flour, tired, t: pose.t || 0 }, () => drawWith(d, p, props));
};

// GRANDPA LOU — options: glasses: 'up' (default, on his forehead) | 'on' | 'off', sash: true (his old red CHAMP '79 sash),
// cane: true (wooden cane, left hand), armwrestle: true|'flex' (double-biceps flex, elbows bent up, biceps bulge) | 'one' (one arm),
// flex: same as armwrestle
draw.grandpa = (pose = {}) => {
  const view = viewOf(pose);
  let d = D.grandpa, p = pose;
  const gl = pose.glasses === undefined ? 'up' : pose.glasses;
  if (gl && gl !== 'off') d = withOver(d, (face, t, shade, v) => L6.readers(v, t, gl, '#3A3A48'));
  const fx = pose.armwrestle || pose.flex;
  if (fx) {
    p = fx === 'one' ? keep(p, { armR: 96, bendR: 104, armL: 8 }) : keep(p, { armL: 96, armR: 96, bendL: 104, bendR: 104 });
    if (view === 'side') p = keep(pose, { armL: 80, bendL: 100 });
    if (pose.face === undefined) p.face = 'determined';
  }
  const props = [];
  if (pose.sash) props.push({ svg: L7.champSash(view, turnOf(p)), layer: view === 'back' ? 'mid' : 'mid' });
  if (pose.cane) {
    p = keep(p, { armL: view === 'side' ? 18 : 12 });
    props.push(held(d, p, view === 'side' ? 1 : -1, (x, y) => X.woodCane({ x: x - (view === 'side' ? 30 : 4), y: y - 6, s: 0.62, len: Math.max(120, (-y + 6) / 0.62 - 10) }), 236, view === 'side' ? 'back' : layerFor(view)));
  }
  return drawWith(d, p, props);
};

// MAX — options: hood: 'up' (default) | 'down' (ginger curls, the hood lying behind his neck), balloon: true (the dinosaur balloon
// on a string in his right hand; sways with t), roar: true (RAWR: claws up beside his head, mouth wide), tablet: true (holding the
// hero's tablet up, screen toward us; screen, glow)
draw.max = (pose = {}) => {
  const view = viewOf(pose);
  const down = pose.hood === 'down' || pose.hood === false;
  let d = down ? D.maxHoodDown : D.max, p = pose;
  if (pose.roar) {
    p = keep(p, { armL: 108, armR: 108, bendL: 66, bendR: 66, lean: -3 });
    if (view === 'side') p = keep(pose, { armL: 120, bendL: 50, armR: 100, bendR: 60 });
    if (pose.face === undefined) p.face = { name: 'angry', mouth: 'scream', fx: [] };
  }
  if (down) d = withUnder(d, (face, t, shade, v) => (v === 'front' ? L7.hoodDownBehind(MAX_COL, 'front') : ''));
  const props = [];
  if (pose.balloon) {
    p = armPose(p, 1, [34, 0], [50, 0]);
    props.push(held(d, p, handSide(p, 1), (x, y) => X.dinoBalloon({ x, y, s: 1.3, t: pose.t || 0, string: 560 }), 236, 'front'));
  }
  if (pose.tablet) {
    p = view === 'side' ? keep(p, { armL: 40, bendL: 60 }) : keep(p, { armL: 30, armR: 30, bendL: -110, bendR: -110 });
    props.push({ svg: X.tablet({ x: view === 'side' ? -170 : turnOf(p) * 40, y: -440, s: view === 'side' ? 0.5 : 0.62, face: view === 'side' ? 'back' : (pose.tabletFace || 'screen'), screen: pose.screen || null, glow: pose.glow ?? 1, rot: view === 'side' ? 0 : 0 }), layer: layerFor(view) });
  }
  return withState({ hoodDown: down, t: pose.t || 0 }, () => drawWith(d, p, props));
};

// BISCUIT — the corgi (non-rig, rig/extras.js): { x, y, s, t, pose: 'sit'|'walk'|'beg'|'sleep', look, tongue, wag, face, flip, ears }
draw.biscuit = (pose = {}) => {
  let face = pose.face;
  if (face && typeof face === 'object') face = face.name;
  const map = { neutral: 'neutral', happy: 'happy', joy: 'good', love: 'love', shocked: 'shocked', scared: 'shocked', sad: 'sad', sleepy: 'sleepy', good: 'good', cute: 'good' };
  return X.biscuit({ ...pose, pose: pose.pose || 'sit', face: map[face] || face || 'happy' });
};

// BENJI — options: books: true (an armful of books hugged to his chest; books: 'drop' + bookFall 0..1 sends them flying),
// fallen: true|'sit'|'flat' (sat down hard / flat on his back, hat askew, "I'm okay!"), potato: true (holds the potato battery),
// map: true (the fair map held open), laces: false (tied for once)
draw.benji = (pose = {}) => {
  const view = viewOf(pose);
  let d = D.benji, p = pose;
  const props = [];
  if (pose.fallen) {
    const flat = pose.fallen === 'flat';
    p = flat ? keep(p, { rot: -90, rotY: -300, bodyY: 0, lift: 0, armL: 150, armR: 120, legL: 20, legR: 40, kneeL: 30, kneeR: 10, shadow: false }) :
      keep(p, { bodyY: 250, legL: 72, legR: 72, kneeL: 0, kneeR: 0, armL: 60, armR: 64, bendL: 30, bendR: 30, headRot: -8 });
    if (flat) p = { ...p, y: (p.y || 0) + 150 * (p.s ?? 1) * 0.98 };
    if (pose.face === undefined) p.face = { name: 'dizzy', mouth: 'grin' };
  }
  if (pose.books) {
    const fall = pose.books === 'drop' ? clamp(pose.bookFall ?? 1, 0, 1) : 0;
    p = view === 'side' ? keep(p, { armL: 34, bendL: 70 }) : keep(p, { armL: 22, armR: 22, bendL: -116, bendR: -116 });
    props.push({ svg: X.bookStack({ x: turnOf(p) * 30 + (view === 'side' ? -150 : 0), y: -330, s: 0.62, n: 5, fall, t: pose.t || 0 }), layer: layerFor(view) });
  }
  if (pose.potato) {
    p = view === 'side' ? keep(p, { armL: 40, bendL: 60 }) : keep(p, { armL: 30, armR: 30, bendL: -100, bendR: -100 });
    props.push({ svg: X.potatoBattery({ x: turnOf(p) * 30 + (view === 'side' ? -190 : 0), y: -350, s: 0.42, glow: pose.glow ?? 0.3, t: pose.t || 0, sign: false }), layer: layerFor(view) });
  }
  if (pose.map) {
    p = view === 'side' ? keep(p, { armL: 60, bendL: 40 }) : keep(p, { armL: 34, armR: 34, bendL: -80, bendR: -80 });
    props.push({ svg: X.fairMap({ x: turnOf(p) * 30 + (view === 'side' ? -220 : 0), y: -440, s: view === 'side' ? 0.5 : 0.62, fold: view === 'side' ? 0.8 : 0, back: view === 'back' }), layer: layerFor(view) });
  }
  return withState({ laces: pose.laces !== false, t: pose.t || 0 }, () => drawWith(d, p, props));
};

// TANK — options: lunch: true (a stolen lunch bag dangling from his fist; lunchName writes a name on it), sandwich: true (sandwich
// at his chest), ketchupLunch: true (his dad's ketchup-soaked sandwich), shy: true (softer face + posture: brows up, blush, eyes
// down, hands fidgeting), carry: true|{ face, armL, armR, ... } (the hero on his shoulders — Tank's arms hold the hero's shins;
// see carryAt() for your own rider)
draw.tank = (pose = {}) => {
  const view = viewOf(pose);
  let d = D.tank, p = pose;
  if (pose.shy) {
    p = view === 'side' ? keep(p, { armL: 20, bendL: 70, headRot: 6, lean: 3 }) : keep(p, { armL: 16, armR: 16, bendL: -120, bendR: -112, headRot: 6, lean: 3 });
    p.face = faceWith(p.face || 'nervous', { brows: { L: [-46, 8], R: [-46, 8] }, eyes: { look: [0.2, 0.6], pupil: 1.1 }, fx: ['blush'], mouth: (p.face && p.face.mouth) || undefined });
    if (!p.face.mouth) delete p.face.mouth;
  }
  const props = [];
  let rider = '';
  if (pose.carry) {
    p = keep(p, { armL: 168, armR: 168, bendL: 0, bendR: 0 });
    const c = carryAt(p);
    const rp = typeof pose.carry === 'object' ? pose.carry : {};
    rider = draw.you({ x: c.x, y: c.y, s: c.s, legL: 74, legR: 74, kneeL: 80, kneeR: 80, armL: 40, armR: 150, face: 'joy', shadow: false, flip: false, ...rp, view: 'front' });
  }
  if (pose.lunch) {
    p = armPose(p, 1, [14, 0], [20, 0]);
    props.push(held(d, p, handSide(p, 1), (x, y) => X.lunchBag({ x, y: y + 6, s: 0.62, name: pose.lunchName || '' }), 250));
  }
  if (pose.sandwich || pose.ketchupLunch) {
    p = armPose(p, 1, [22, -118], [30, 80]);
    props.push(held(d, p, handSide(p, 1), (x, y) => X.sandwich({ x: x - 10, y: y - 30, s: 0.62, ketchup: !!pose.ketchupLunch, bite: pose.bite || 0 }), 250, 'front'));
  }
  return drawWith(d, p, props) + rider;
};
// where a rider sits on Tank's shoulders: { x, y, s } = the feet position + scale to pass to draw.you (or any rig actor)
function carryAt(pose = {}) {
  const s = pose.s ?? 1, Z = D.tank.dims.size || 1.35;
  const x = (pose.x || 0) + (pose.flip ? -1 : 1) * 0, y = (pose.y || 0) - (pose.lift || 0) + (pose.bodyY || 0) * s * Z;
  return { x, y: y - (880 * Z - 300) * s, s };
}

// MRS. KRUMP — options: pointer: true (pointer stick in her right hand; pointerRot to aim it), papers: true (a stack of marked
// papers on her left arm), glare: 0..1|true (white glint across her cat-eye glasses + a stern face), pen in hand: redPen: true
draw.teacher = (pose = {}) => {
  const view = viewOf(pose);
  let d = D.teacher, p = pose;
  const glare = pose.glare === true ? 1 : clamp(+pose.glare || 0, 0, 1);
  if (glare && p.face === undefined) p = { ...p, face: { name: 'determined', mouth: 'line', brows: { L: [24, -10], R: [24, -10] } } };
  const props = [];
  if (pose.pointer) {
    p = view === 'side' ? keep(p, { armL: 80, bendL: 20 }) : keep(p, { armR: 64, bendR: 30 });
    const h = handAt(d, p, view === 'side' ? -1 : 1, 236);
    const rot = pose.pointerRot ?? (view === 'side' ? -64 : 26);
    props.push({ svg: X.pointer({ x: h[0], y: h[1], s: 0.9, rot }), layer: layerFor(view) });
  }
  if (pose.papers) {
    p = armPose(p, -1, [24, -110], [36, 70]);
    props.push(held(d, p, handSide(p, -1), (x, y) => X.paperStack({ x: x + (view === 'side' ? -40 : 40), y: y - 30, s: 0.6, rot: -8 }), 236, 'front'));
  }
  if (pose.redPen) {
    p = armPose(p, 1, [30, -60], [40, 60]);
    props.push(held(d, p, handSide(p, 1), (x, y) => X.redPen({ x, y: y - 10, s: 0.8, rot: -50 })));
  }
  return withState({ glare, t: pose.t || 0 }, () => drawWith(d, p, props));
};

// the lunch lady — ladle: true (default true: a ladle in her right hand)
draw.lunchLady = (pose = {}) => {
  const view = viewOf(pose);
  let p = pose;
  const props = [];
  if (pose.ladle !== false) {
    p = armPose(p, 1, [40, -40], [40, 40]);
    props.push(held(D.lunchLady, p, handSide(p, 1), (x, y) => X.ladle({ x, y: y + 10, s: 0.55, rot: -10 })));
  }
  return drawWith(D.lunchLady, p, props);
};
// the coach — whistleUp: true (whistle in the mouth)
draw.coach = (pose = {}) => drawWith(D.coach, pose);
// Mrs. Wells — bags: true (default: grocery bags in both hands; bags: 1 = one bag), spill 0..1
draw.neighbor = (pose = {}) => {
  const view = viewOf(pose);
  let p = pose;
  const props = [];
  const nb = pose.bags === undefined ? 2 : pose.bags === false ? 0 : pose.bags === true ? 2 : +pose.bags;
  if (nb) {
    p = keep(p, { armL: 10, armR: 10 });
    for (const side of nb > 1 ? [-1, 1] : [1]) props.push(held(D.neighbor, p, view === 'side' ? -side : side, (x, y) => X.groceryBags({ x, y: y - 20, s: 0.6, spill: pose.spill || 0 }), 236, 'front'));
  }
  return drawWith(D.neighbor, p, props);
};
draw.fairWorker = (pose = {}) => drawWith(D.fairWorker, pose);

// crowds: kid(i, pose) / adult(i, pose), or actor('kid', t, { i, ... }) (the KID voice lip-syncs). Flat lite humans.
// kid specials: 0 = the homework kid (KID voice), 1 = the quiet strong kid, 2/3 = the smart kids (glasses)
function lite(dsgFn) {
  return (i, pose) => {
    if (typeof i === 'object' && i) { pose = i; i = i.i ?? i.seed ?? 0; }
    return drawCharacter(dsgFn(i), { ...(pose || {}), nametag: null });
  };
}
draw.kid = lite(kidDesign);
draw.adult = lite(adultDesign);

const NAMES = {
  you: 'YOU', mom: 'Mom', grandpa: 'Grandpa Lou', max: 'Max', biscuit: 'Biscuit', benji: 'Benji', tank: 'Tank', teacher: 'Mrs. Krump',
  lunchLady: 'Lunch lady', coach: 'Coach', neighbor: 'Mrs. Wells', fairWorker: 'Fair worker', kid: 'Kid', adult: 'Adult',
};

// ================================================================= HUD anchors: head tops (stat plates sit above these)
// body units at s 1, size already applied, from the feet to the highest point of the head (hair / hood / hat), default options
const HEAD_TOP = {
  you: 951, youHood: 1064, youHeadset: 1120, mom: 1059, momDayoff: 1073, grandpa: 982, max: 664, maxHoodDown: 621,
  biscuit: X.BISCUIT_TOP.sit, benji: 1081, tank: 1237, teacher: 1340, lunchLady: 1113, coach: 1129, neighbor: 1005, fairWorker: 1071,
  kid: 840, adult: 1080,
};
// screen point just above a character's head for a stat plate: headTop('mom', { x, y, s, lift, bodyY, headY, sy, i, pose: (biscuit) })
function headTop(key, pose = {}) {
  const s = pose.s ?? 1;
  let top = HEAD_TOP[key] ?? 951;
  if (key === 'you' && pose.hood) top = HEAD_TOP.youHood;
  if (key === 'you' && pose.headset) top = HEAD_TOP.youHeadset;
  if (key === 'mom' && pose.dayoff) top = HEAD_TOP.momDayoff;
  if (key === 'max' && (pose.hood === 'down' || pose.hood === false)) top = HEAD_TOP.maxHoodDown;
  if (key === 'biscuit') top = X.BISCUIT_TOP[pose.pose || 'sit'] || X.BISCUIT_TOP.sit;
  if (key === 'kid' || key === 'adult') { const dd = (key === 'kid' ? kidDesign : adultDesign)(pose.i || 0); top = dd.dims.top * dd.dims.size; }
  const Z = key === 'kid' || key === 'adult' || key === 'biscuit' ? 1 : ((D[key] && D[key].dims && D[key].dims.size) || 1);
  const bob = ((pose.bodyY || 0) + (pose.headY || 0)) * Z;
  return { x: pose.x || 0, y: (pose.y || 0) - (pose.lift || 0) - (top - bob) * s * (pose.sy ?? 1) };
}

module.exports = {
  D, draw, NAMES, kidDesign, adultDesign, kidSpec, adultSpec, handAt, handPos, forearmAngle, carryAt, headTop, HEAD_TOP, withOver, withUnder, armPose,
  extras: X, looks: L7,
};
