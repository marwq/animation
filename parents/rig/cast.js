// The cast of "What If Your PARENTS Joined Your Roblox Server?" — all built on the R6 rig.
// YOU is the channel hero: the default r6.js construction (BASE_STYLE) with his jacket/T-shirt/pants colours only.
// Real-life family (dad, mom, grandma, momTeen) and their Cube City avatars (dadAvatar = the hot dog, momAvatar, grandmaAvatar),
// NoodleBoi, xX_DarkBlade_Xx (+ clan), DarkBlade's mom, cheap players / noobs, and the BLOCK KING boss (non-rig).
// Looks live in rig/looks6.js (on top of looks3..5), props in rig/extras.js. Reference: docs/CAST.md.
'use strict';

const S = require('./svg');
const { makeDesign, makeStyle } = require('./r6');
const { drawCharacter, BASE_DEFAULTS, BASE_DIMS } = require('./body');
const L3 = require('./looks3');
const L4 = require('./looks4');
const L5 = require('./looks5');
const L6 = require('./looks6');
const X = require('./extras');
const { f, clamp, lerp } = S;

const D = {};
const design = (style) => L6.dress6(L5.dress5(L4.dress4(L3.dress(makeDesign(style)))));

// ---------------------------------------------------------------- YOU (the hero) — DO NOT REDESIGN: only these colours
D.you = makeDesign({
  col: { jacket: '#D8262E', jacketLine: '#B01D24', shirt: '#F2D04A', shirtShade: '#D9B73A', pants: '#1F3B2A', pantsShade: '#162C1F' },
});

// ================================================================= THE REAL FAMILY
// Dad — accountant: chubby, receding grey-brown hair, big walrus moustache, thick brows, reading glasses pushed up on the forehead,
// light-blue shirt under a mustard argyle sweater vest (two pens), khakis, white socks in brown sandals
const DAD = {
  hair: 'dadRecede', eyeStyle: 'dot', top: 'vestDad', sleeve: 'long', pantsShape: 'straight', size: 1.1, torsoW: 118, taper: -12, armW: 1.12, legW: 1.1, hipK: 1.12,
  shoe: 'sandal', socks: '#FFFFFF', sockH: 58, sockRib: '#D8DCE6',
  eye: { pupil: 1.0 }, brows: false, browBase: { L: [-2, 0], R: [-2, 0] }, neutralMouth: 'smile',
  acc: { walrus: true, thickBrows: '#5E4432', cheekBlush: '#FF9F8F' },
  col: {
    skin: '#F4CDAE', skinShade: '#E3B48F', hair: '#6E5444', hairShade: '#4E3A2E', hairHi: '#A08A7A', brow: '#4E3626', stache: '#6B4E3A', stacheHi: '#A0826A',
    top: '#BFD9F2', topShade: '#9FC0E0', sleeve: '#BFD9F2', cuff: '#A8C8E8', collar: '#E6F2FF',
    vest: '#D9A13A', vestShade: '#B8821F', vestTrim: '#9E6A14', argyle1: '#8A4F2A', argyle2: '#FFF0C8',
    pants: '#C2A57A', pantsShade: '#A88C62', sole: '#7A4A26', soleShade: '#5A3418', toe: '#7A4A26', strap: '#8A5A30',
  },
};
D.dad = design(DAD);

// Mom — the quiet librarian: auburn hair in a neat bun with a pencil through it, round glasses, sage cardigan over a cream blouse
// with a peter-pan collar (book brooch, bookmark in the pocket), plum A-line skirt, dark tights, burgundy flats
const MOM_COL = {
  skin: '#F6D5BC', skinShade: '#E6BC9E', hair: '#8A3B22', hairShade: '#6A2A16', hairHi: '#B8603E', brow: '#6A2A16', accent: '#3E6E9E',
  top: '#6FAE9C', topShade: '#558E7E', sleeve: '#6FAE9C', cuff: '#558E7E', shirt: '#FFF6E6', shirtShade: '#E8D8C0', collar: '#FFFFFF', button: '#F2C14E',
  pants: '#4E4258', pantsShade: '#3E3448', sole: '#8A2A3A', soleShade: '#6A1E2A', toe: '#B04A5A',
};
const MOM = {
  hair: 'momBun', eyeStyle: 'mid', lashes: true, top: 'cardiganMom', sleeve: 'long', pantsShape: 'straight', size: 1.04, torsoW: 98, shoe: 'flats',
  eye: { iris: '#5E8A3A', pupil: 0.92 }, brows: { L: [0, 0], R: [0, 0] }, neutralMouth: 'smallSmile',
  acc: { specs: { type: 'round', col: '#7A3A4A', r: 52, x: 62, y: -704, sw: 7 }, lipTint: '#E86A7A' },
  ext6: { kind: 'skirt', top: -330, len: 190, flare: 22, col: '#7A5A8A', shade: '#624870' },
  col: MOM_COL,
};
D.mom = design(MOM);
// Mom at night: lavender moon-print pajamas, fuzzy slippers (same bun and glasses)
D.momPJ = design({
  ...MOM, top: 'pjTop', sleevePattern: 'moons', pantsPattern: 'moons', ext6: null, shoe: 'slipper',
  col: { ...MOM_COL, top: '#B9A6E8', topShade: '#9A86CC', sleeve: '#B9A6E8', cuff: '#9A86CC', piping: '#FFFFFF', pattern: '#FFF3B0', pants: '#B9A6E8', pantsShade: '#9A86CC', sole: '#E8D8F8', soleShade: '#C9B8E0', toe: '#F2DFFF', pompom: '#FFFFFF' },
});

// Grandma — white curls, glasses on a beaded chain, rosy cardigan over a dusty-blue flowered dress, fuzzy pink slippers
const GRAN_COL = {
  skin: '#F8DCCB', skinShade: '#E8C2AE', hair: '#F4F2F8', hairShade: '#C9C4D8', hairHi: '#FFFFFF', brow: '#B8B4C4',
  top: '#E992B4', topShade: '#CC7598', sleeve: '#E992B4', cuff: '#CC7598', dress: '#86AEDE', flower1: '#FFFFFF', flower2: '#FF8FB0', leaf: '#5DBB6E', flowerMid: '#FFD23F', button: '#FFFFFF',
  pants: '#F2D2C0', pantsShade: '#E0BCA8', sole: '#E06F9A', soleShade: '#C05A80', toe: '#FF9FC4', pompom: '#FFFFFF',
};
D.grandma = design({
  hair: 'granCurls', eyeStyle: 'mid', lashes: true, top: 'grannyDress', sleeve: 'long', pantsShape: 'straight', size: 0.9, torsoW: 100, taper: -4, shoe: 'slipper',
  eye: { iris: '#4A7AB8', pupil: 0.9, upper: 0.08 }, brows: { L: [0, 0], R: [0, 0] }, neutralMouth: 'smile',
  acc: { specs: { type: 'round', col: '#B08A3A', r: 48, x: 60, y: -704, sw: 6 }, specChain: '#E0B84A', cheekBlush: '#FF9FB0', lipTint: '#E8607A' },
  ext6: { kind: 'flowers', top: -330, len: 186, flare: 28, col: '#86AEDE', shade: '#6E96C6' },
  col: GRAN_COL,
});

// Mom at 16 in 1998: big teased bangs + side ponytail with a neon scrunchie, oversized colour-block windbreaker, baggy light jeans,
// chunky white sneakers, freckles
D.momTeen = design({
  hair: 'teenBangs', eyeStyle: 'mid', lashes: true, top: 'jacket90s', sleeve: 'long', sleeveBlock: '#7A4FD6', pantsShape: 'wide', size: 0.95, torsoW: 112, armW: 1.08, shoe: 'chunky',
  eye: { iris: '#5E8A3A', pupil: 1.05, sparkle: true }, brows: { L: [-4, 0], R: [-4, 0] }, neutralMouth: 'smile',
  acc: { cheekBlush: '#FF9FB0', freckles6: '#D08A6A' },
  col: {
    skin: '#F6D5BC', skinShade: '#E6BC9E', hair: '#8A3B22', hairShade: '#6A2A16', hairHi: '#C0663E', brow: '#6A2A16', accent: '#FF4FD8',
    top: '#2BB5B0', topShade: '#1E8E8A', sleeve: '#2BB5B0', cuff: '#FFD23F', block2: '#7A4FD6', block3: '#FF4FA0', zip: '#FFD23F', shirt: '#FFFFFF', shirtShade: '#D8DCE6',
    pants: '#8FB4E2', pantsShade: '#759ACB', sole: '#FFFFFF', soleShade: '#E0E0EA', toe: '#FFFFFF', soleBand: '#FF4FA0', lace: '#2BB5B0',
  },
});

// ================================================================= CUBE CITY AVATARS
// DadBod1978 — the HOT DOG costume: tall sausage (mustard zigzags) between two bun halves, a blocky avatar face with Dad's moustache
// in the face hole, bun-coloured sleeves, khakis + white socks in sandals (just like the real Dad)
const HOTDOG = makeStyle({
  top: 'tee6', sleeve: 'short', pantsShape: 'straight', shoe: 'sandal', socks: '#FFFFFF', sockH: 70, sockRib: '#D8DCE6', armW: 1.06, legW: 1.06, size: 1.06,
  col: {
    skin: '#FFD7A8', skinShade: '#F0C090', sleeve: '#F2B45C', top: '#F2B45C', bun: '#F2B45C', bunHi: '#FCD592', bunDark: '#D48A38',
    sausage: '#D9573E', sausageHi: '#F28A6E', sausageShade: '#B4412C', mustard: '#FFD21F', stache: '#6B4E3A', hair: '#6B4E3A',
    pants: '#C2A57A', pantsShade: '#A88C62', sole: '#7A4A26', soleShade: '#5A3418', toe: '#7A4A26', strap: '#8A5A30',
  },
});
D.dadAvatar = {
  style: HOTDOG,
  dims: { ...BASE_DIMS, size: 1.06, shoulderX: 214, shoulderY: -566, sideShoulder: [24, -560], hipX: 56, nametagY: -1235, shadowR: 250 },
  leg: L6.makeLeg6(HOTDOG), legSide: L6.makeLegSide6(HOTDOG), arm: L6.makeArm6(HOTDOG),
  torso: L6.hotdogTorso(HOTDOG), torsoSide: L6.hotdogTorsoSide(HOTDOG),
  head: () => '', headSide: () => '', headBack: () => '',
};

// MOM_OFFICIAL — armor 0: the plain default grey avatar (grey skin, grey shirt, grey legs) + her round glasses;
// armor 1: golden warrior armour (plumed helmet, heart breastplate, pauldrons, tassets, greaves), pot-lid shield, sword, red cape
const MA_COL = {
  skin: '#B9BDC8', skinShade: '#A3A8B4', hair: '#8A8F9B', top: '#A2A7B3', topShade: '#8E939F', pants: '#8E939F', pantsShade: '#7E838E', sole: '#6E727C', soleShade: '#5E626C', toe: '#6E727C',
};
const MA = {
  hair: 'none', eyeStyle: 'dot', top: 'plainAvatar', sleeve: 'none', pantsShape: 'straight', size: 1.02, shoe: 'avatar', brows: false, neutralMouth: 'smile',
  acc: { specs: { type: 'round', col: '#3E3F4A', r: 46, x: 56, y: -716, sw: 8 }, avatarShine: true },
  col: MA_COL,
};
D.momAvatar0 = design(MA);
D.momAvatar0nog = design({ ...MA, acc: { avatarShine: true } });
const GOLD = { gold: '#F2C230', goldHi: '#FFE58A', goldShade: '#C98E12', gem: '#FF4F7A', plume: '#E8456A' };
const MA1 = {
  ...MA, top: 'goldArmor', armor: { kind: 'gold', col: GOLD.gold, hi: GOLD.goldHi, shade: GOLD.goldShade, trim: GOLD.goldShade, gem: GOLD.gem },
  greaves: { col: GOLD.gold, hi: GOLD.goldHi, knee: true }, shoe: 'boot', torsoW: 104,
  ext6: { kind: 'tassets', top: -318, len: 96, flare: 18, col: GOLD.gold, shade: GOLD.goldShade },
  col: { ...MA_COL, ...GOLD, top: GOLD.gold, under: '#7E8696', belt: '#8A4A22', sole: GOLD.gold, soleShade: GOLD.goldShade, bootTrim: GOLD.goldShade },
};
D.momAvatar1 = design(MA1);
D.momAvatar1nog = design({ ...MA1, acc: { avatarShine: true } });

// GrannyGoodies — the billionaire: cream fur coat (fluffy collar + cuffs, knee-length, open over a purple dress), big pearls,
// gold monocle on a chain, pink lipstick, white curls, gold flats; golden cane + money bag
const GA_COL = {
  skin: '#FFE0C8', skinShade: '#F0C8AE', hair: '#FFFFFF', hairShade: '#C9C4D8', hairHi: '#FFFFFF', top: '#F6EDE0', topShade: '#E0D0BC', furShade: '#D2BFA6', sleeve: '#F6EDE0', cuff: '#E0D0BC', dress: '#8E3FB8',
  pants: '#FFE0C8', pantsShade: '#F0C8AE', sole: '#FFC93C', soleShade: '#E09A00', toe: '#FFE58A',
};
D.grandmaAvatar = design({
  hair: 'granCurls', eyeStyle: 'dot', top: 'furCoat', sleeve: 'long', sleevePattern: 'fur', furCuff: '#F6EDE0', pantsShape: 'straight', size: 0.94, torsoW: 108, taper: -6, shoe: 'flats',
  brows: false, neutralMouth: 'smile', eye: { pupil: 1.05 },
  acc: { monocle: true, lashFlicks: true, lipTint: '#FF4F7A', cheekBlush: '#FF9FB0', avatarShine: true },
  ext6: { kind: 'coat', top: -330, len: 220, flare: 34 },
  col: GA_COL,
});

// NoodleBoi — a ramen bowl for a head (noodles, half egg, naruto, nori, chopsticks; a happy face on the bowl), navy sushi hoodie
const NOODLE = makeStyle({
  hair: 'none', top: 'sushiHoodie', sleeve: 'long', sleevePattern: 'maki', pantsShape: 'straight', size: 0.98, shoe: 'sneaker', eyeStyle: 'dot',
  col: {
    skin: '#FFDDBB', skinShade: '#F0C8A0', top: '#2A4F7A', topShade: '#1F3D60', sleeve: '#2A4F7A', cuff: '#1F3D60', pants: '#3A3F4E', pantsShade: '#2E3240', sole: '#FFFFFF', soleShade: '#E0E0EA', toe: '#FF8A5C',
    bowl: '#FFF8EC', bowlShade: '#E8DCC8', band: '#E8453C', wave: '#3B82F6', noodle: '#FFD86B', noodleShade: '#E0B040', chop: '#E8C48A', chopTip: '#C0392B', yolk: '#FFA51F',
  },
});
D.noodle = design(NOODLE);
Object.assign(D.noodle, { head: L6.noodleHead(D.noodle.style), headSide: L6.noodleHeadSide(D.noodle.style), headBack: L6.noodleHeadBack(D.noodle.style) });
D.noodle.dims.nametagY = -1250;

// xX_DarkBlade_Xx — black spiky armour with red trim, a helmet with five spikes and a T-visor (glowing red eyes, no mouth),
// spiky pauldrons, gauntlets, jagged tassets, spiked boots, tattered maroon cape, big black sword
const DB_COL = {
  skin: '#34343F', skinShade: '#2A2A33', top: '#2A2A33', topShade: '#16161C', armorHi: '#5A5A6A', trim: '#B0182E', glow: '#FF2E4A', belt: '#141418', helm: '#22222A', visor: '#0B0B10', spike: '#3A3A46',
  eye: '#FF2E4A', eyeCore: '#FFD0D6', pants: '#26262E', pantsShade: '#1A1A20', sole: '#22222A', soleShade: '#141418', toe: '#22222A', bootTrim: '#B0182E',
  kidSkin: '#F6D5BC', kidHair: '#2A2230', kidIris: '#7A5AE0',
};
const DBS = {
  hair: 'none', eyeStyle: 'dot', top: 'darkArmor', sleeve: 'none', pantsShape: 'straight', size: 1.0, torsoW: 104, shoe: 'boot', bootSpike: '#C9CED8',
  armor: { kind: 'dark', col: '#2A2A33', hi: '#5A5A6A', shade: '#16161C', trim: '#B0182E', spike: '#C9CED8' }, gloveCol: '#1A1A20', greaves: { col: '#2A2A33', hi: '#5A5A6A' },
  ext6: { kind: 'jagged', top: -318, len: 110, flare: 14, col: '#2A2A33', shade: '#16161C' },
  helm: { spikes: 5 },
  col: DB_COL,
};
function darkDesign(style) {
  const d = design(style);
  Object.assign(d, { head: L6.darkHead(d.style), headSide: L6.darkHeadSide(d.style), headBack: L6.darkHeadBack(d.style) });
  d.dims.nametagY = -1110;
  return d;
}
D.darkblade = darkDesign(DBS);

// the clan: darker armour variants (i): gunmetal / maroon / navy / charcoal, coloured eye slits, horns or spikes, axes and swords
const CLAN = [
  { top: '#4A5060', hi: '#7A8090', trim: '#7A3FD0', eye: '#B65CFF', spikes: 3, horns: false, weapon: 'axe' },
  { top: '#4A2A30', hi: '#7A4A50', trim: '#FF8A1F', eye: '#FF8A1F', spikes: 0, horns: true, weapon: 'sword' },
  { top: '#2A3450', hi: '#4A5A80', trim: '#3DF2FF', eye: '#3DF2FF', spikes: 1, horns: false, weapon: 'axe' },
  { top: '#33363E', hi: '#5A5E68', trim: '#3BD16F', eye: '#3BD16F', spikes: 3, horns: true, weapon: 'sword' },
  { top: '#3A2A48', hi: '#5E4A70', trim: '#FF3B6B', eye: '#FF3B6B', spikes: 5, horns: false, weapon: 'axe' },
];
const clanCache = {};
function clanDesign(i) {
  const k = ((i % CLAN.length) + CLAN.length) % CLAN.length;
  if (clanCache[k]) return clanCache[k];
  const c = CLAN[k];
  const col = { ...DB_COL, skin: L6.shadeHex(c.top, 0.8), top: c.top, topShade: L6.shadeHex(c.top, 0.65), armorHi: c.hi, trim: c.trim, glow: c.eye, helm: L6.shadeHex(c.top, 0.85), spike: L6.shadeHex(c.top, 1.2), eye: c.eye, eyeCore: '#FFFFFF', pants: L6.shadeHex(c.top, 0.7), pantsShade: L6.shadeHex(c.top, 0.55), sole: L6.shadeHex(c.top, 0.6), soleShade: L6.shadeHex(c.top, 0.45), toe: L6.shadeHex(c.top, 0.6), bootTrim: c.trim };
  clanCache[k] = darkDesign({
    ...DBS, size: 0.94 + (k % 3) * 0.03, torsoW: 100 + (k % 2) * 6, bootSpike: null,
    armor: { kind: k % 2 ? 'gold' : 'dark', col: c.top, hi: c.hi, shade: L6.shadeHex(c.top, 0.65), trim: c.trim, spike: c.hi }, gloveCol: L6.shadeHex(c.top, 0.6), greaves: { col: c.top, hi: c.hi },
    ext6: { kind: 'jagged', top: -318, len: 96, flare: 10, col: c.top, shade: L6.shadeHex(c.top, 0.65) },
    helm: { spikes: c.spikes, horns: c.horns, crest: k === 2 ? c.trim : null },
    col,
  });
  clanCache[k].clan = c;
  return clanCache[k];
}

// DarkBlade's mom (avatar, final gag): plum beehive, magenta top, white apron with MOM on it, pink slippers, rolling pin
D.darkbladeMom = design({
  hair: 'hiveBun', eyeStyle: 'dot', top: 'tee6', sleeve: 'long', pantsShape: 'straight', size: 1.04, shoe: 'slipper', brows: { L: [10, -6], R: [10, -6] }, neutralMouth: 'line',
  apronAlways: { col: '#FFFFFF', trim: '#E8456A', text: 'MOM' },
  acc: { lashFlicks: true, lipTint: '#C0397A', avatarShine: true },
  col: {
    skin: '#F2C9A8', skinShade: '#E0B090', hair: '#4A2A5A', hairShade: '#2E1A3A', hairHi: '#7A5A8A', brow: '#2E1A3A', top: '#C0397A', topShade: '#9A2A60', sleeve: '#C0397A', cuff: '#9A2A60',
    pants: '#3A3F4E', pantsShade: '#2E3240', sole: '#FF9FC4', soleShade: '#E07FA4', toe: '#FF9FC4', pompom: '#FFFFFF',
  },
});

// ================================================================= PLAYERS / NOOBS (cheap lite avatars)
const hashK = (i, k) => { const v = Math.sin((i + 1) * 91.7 + k * 13.3) * 43758.5453; return v - Math.floor(v); };
const pickK = (i, arr, k) => arr[Math.floor(hashK(i, k) * arr.length) % arr.length];
const PAL = ['#FF6B6B', '#4ECDC4', '#FFD166', '#9B5DE5', '#1982C4', '#8AC926', '#FF924C', '#F15BB5', '#00BBF9', '#F94144', '#43AA8B', '#3A86FF', '#FFB703', '#06D6A0', '#EF476F', '#7B2CBF'];
const ASK = ['#FFD9B0', '#F2C9A0', '#E0A878', '#C98D6A', '#8D5A3B', '#FFE3CF', '#F7D26B', '#B9E4FF', '#C8F2B0'];
const HAIRS = ['#1E1A1C', '#5A3A22', '#E0A23A', '#C2452D', '#2F4AA8', '#E870A8', '#F2D06A', '#7A4A2A', '#3BD16F', '#FFFFFF'];
const HATS = ['cap', 'spiky', 'beanie', 'bob', 'headphones', 'catEars', 'crown', 'tophat', 'viking', 'bunny', 'ninja', 'afro', 'pony', 'cap', 'spiky', ''];
const LOGOS = ['star', 'heart', 'bolt', 'stripe', 'num', '', 'star', 'stripe'];
const playerCache = {}, noobCache = {};
function playerSpec(i) {
  const shirt = pickK(i, PAL, 1);
  return {
    skin: pickK(i, ASK, 2), shirt, sleeve: hashK(i, 3) > 0.5 ? shirt : pickK(i, PAL, 4), pants: pickK(i, ['#2E3A55', '#5A6070', '#3A6A9A', '#2B2B33', '#6E7891', '#4A5A3A', '#8A4A5A', '#1E1E28'], 5),
    hat: pickK(i, HATS, 6), hatCol: pickK(i, PAL, 7), hatCol2: pickK(i, PAL, 8), hair: pickK(i, HAIRS, 9), logo: pickK(i, LOGOS, 10), logoCol: hashK(i, 11) > 0.5 ? '#FFFFFF' : pickK(i, PAL, 12),
    num: String(1 + Math.floor(hashK(i, 13) * 98)), face: hashK(i, 14) > 0.85 ? 'cool' : null, mouth: pickK(i, ['smile', 'smile', 'grin', 'smallSmile'], 15), size: 0.86 + hashK(i, 16) * 0.16,
    brows: hashK(i, 17) > 0.6, blush: hashK(i, 18) > 0.75,
  };
}
// noobs: plain starter avatars (bald, flat starter colours, simple smile). noob 0 = THE KID: tiny, propeller cap
const NOOB_SETS = [['#F7D26B', '#3B82F6', '#3BD16F'], ['#FFD9B0', '#9AA0AE', '#4A5060'], ['#F7D26B', '#E8453C', '#2E3A55'], ['#E0A878', '#FFFFFF', '#3A6A9A'], ['#F7D26B', '#43AA8B', '#5A6070'], ['#FFE3CF', '#FFB703', '#2B2B33'], ['#C98D6A', '#9B5DE5', '#2E3A55'], ['#F7D26B', '#FF924C', '#1E1E28']];
function noobSpec(i) {
  const [skin, shirt, pants] = NOOB_SETS[((i % NOOB_SETS.length) + NOOB_SETS.length) % NOOB_SETS.length];
  if (i === 0) return { skin: '#F7D26B', shirt: '#3B82F6', pants: '#3BD16F', hat: 'propeller', size: 0.66, mouth: 'smallSmile', blush: true, brows: false };
  return { skin, shirt, pants, size: 0.66 + hashK(i, 21) * 0.1, mouth: pickK(i, ['smile', 'smallSmile', 'smile', 'line'], 22), hat: hashK(i, 23) > 0.8 ? 'cap' : '', hatCol: pickK(i, PAL, 24), blush: hashK(i, 25) > 0.6 };
}
const playerDesign = (i) => (playerCache[i] = playerCache[i] || L6.liteDesign(playerSpec(i)));
const noobDesign = (i) => (noobCache[i] = noobCache[i] || L6.liteDesign(noobSpec(i)));

// real-world crowd humans (kept for the API; not needed much in this story): kidDesign(i) / adultDesign(i)
const HSKINS = [['#F8D9C0', '#EBC0A2'], ['#E9B38B', '#D29A72'], ['#C98D6A', '#B0754F'], ['#8D5A3B', '#764830'], ['#F2C9A0', '#DDB083'], ['#6B4430', '#573522']];
const crowdDesign = (style) => L4.dress4(L3.dress(makeDesign(style)));
function humanCol(i) {
  const top = pickK(i, PAL, 31), pants = pickK(i, ['#2E3A55', '#5A6070', '#7A5A3A', '#3A6A9A', '#2B2B33'], 32);
  const [skin, skinShade] = pickK(i, HSKINS, 33), hair = pickK(i, HAIRS.slice(0, 7), 34);
  return { skin, skinShade, hair, hairShade: L6.shadeHex(hair), hairHi: '#FFFFFF55', brow: L6.shadeHex(hair, 0.7), accent: pickK(i, PAL, 35), top, topShade: L6.shadeHex(top), sleeve: top, cuff: L6.shadeHex(top), trim: '#FFFFFF', stripe: '#FFFFFF', plaid1: L6.shadeHex(top, 0.62), plaid2: '#FFFFFF', shirt: '#FFFFFF', tie: pickK(i, PAL, 36), collar: '#FFFFFF', button: '#E9C25A', pants, pantsShade: L6.shadeHex(pants), sole: '#FFFFFF', soleShade: '#E0E0E8', toe: pickK(i, PAL, 37) };
}
function kidDesign(i) {
  return crowdDesign({ hair: pickK(i, ['crop', 'curlTop', 'twists', 'twinTails', 'lowBun', 'puff', 'swoop', 'ponytail', 'buzz'], 38), eyeStyle: hashK(i, 39) > 0.45 ? 'dot' : 'mid', top: pickK(i, ['raglan', 'stripeTee', 'zipHoodie', 'puffer'], 40), sleeve: 'short', pantsShape: 'straight', size: 0.8 + hashK(i, 41) * 0.14, shoe: 'sneaker', col: humanCol(i) });
}
function adultDesign(i) {
  return crowdDesign({ hair: pickK(i, ['sidePart', 'crop', 'lowBun', 'longWave', 'shaved', 'curlTop', 'ponytail'], 42), eyeStyle: hashK(i, 43) > 0.5 ? 'dot' : 'mid', top: pickK(i, ['plaid', 'puffer', 'suit4', 'zipHoodie', 'stripeTee'], 44), sleeve: 'long', pantsShape: 'straight', size: 1.02 + hashK(i, 45) * 0.12, shoe: 'sneaker', col: humanCol(i + 50) });
}
const humanKidCache = {}, adultCache = {};

// ================================================================= helpers: hands, props, overlays, nametags
const rad = (d) => (d * Math.PI) / 180;
// grip point of a hand in BODY space for the pose's arm angle; side +1 = screen-right arm (armR), -1 = screen-left (armL)
function handAt(dsg, pose, side, grip = 236) {
  const view = pose.view || 'front';
  const a = side < 0 ? (pose.armL ?? 9) : (pose.armR ?? 9);
  const dims = dsg.dims || {};
  if (view === 'side') { const [sx, sy] = dims.sideShoulder || [4, -505]; return [sx - grip * Math.sin(rad(a)), sy + grip * Math.cos(rad(a))]; }
  const W = dims.shoulderX || 100, Y = dims.shoulderY || -515;
  const t = view === 'back' ? 0 : clamp(pose.turn || 0, -1, 1), at = Math.abs(t), dir = t >= 0 ? 1 : -1;
  const far = at > 0.35 && dir === side;
  const ax = side * W + (far ? -side * 30 * at : 8 * at * dir);
  return [ax + side * grip * Math.sin(rad(a)), Y + grip * Math.cos(rad(a))];
}
const withProps = (pose, extra) => ({ ...pose, props: [...(pose.props || []), ...extra.filter((q) => q && q.svg)] });
// add an extra `over` layer (head space, follows headRot/headY) to a design for one draw
function withOver(dsg, fn) {
  const k = dsg.style && dsg.style.headK;
  const o0 = dsg.over;
  return { ...dsg, over: (face, t, shade, view) => (o0 ? o0(face, t, shade, view) : '') + L5.headScale(fn(face, t, shade, view) || '', k) };
}
const viewOf = (p) => p.view || 'front';
const turnOf = (p) => (viewOf(p) === 'front' ? clamp(p.turn || 0, -1, 1) : 0);
const faceWith = (face, extra) => (typeof face === 'object' && face ? { ...face, ...extra } : { name: face || 'neutral', ...extra });
// sword angle for a hand: blade up from the fist when the arm hangs, continuing the arm when it is raised
const swordRot = (a, side) => side * lerp(18, 180 - a, clamp((a - 60) / 70, 0, 1));
// something drawn BEHIND the whole body (capes in the front / side view), with the character's transform + torso bob/lean
function underlay(dsg, pose, svg) {
  if (!svg) return '';
  const p = { ...BASE_DEFAULTS, ...(dsg.defaults || {}), ...pose };
  const Z = (dsg.dims && dsg.dims.size) || 1, fs = p.flip ? -1 : 1;
  const tf = `translate(${f(p.x)} ${f(p.y - p.lift)}) scale(${f(fs * p.s * Z)} ${f(p.s * Z)}) rotate(${f(p.rot)} 0 ${f(p.rotY)}) scale(${f(p.sx)} ${f(p.sy)})`;
  return S.g(S.g(svg, `translate(0 ${f(p.bodyY)}) rotate(${f(p.lean)} 0 -306)`), tf);
}
// the game nametag above a head (screen space), placed like body.js's nametag
function tagFor(dsg, pose, opts) {
  if (!opts || !opts.name) return '';
  const p = { ...BASE_DEFAULTS, ...(dsg.defaults || {}), ...pose };
  const Z = (dsg.dims && dsg.dims.size) || 1;
  const ny = ((dsg.dims && dsg.dims.nametagY) || -1035) + p.bodyY + p.headY - 70;
  return L6.gameTag(p.x, p.y - p.lift + ny * p.sy * Z * p.s, p.s * (opts.scale || 1), opts);
}
// resolve a nametag option: undefined -> default, false -> none, string -> that name
const tagName = (v, def) => (v === false || v === null ? null : typeof v === 'string' ? v : v === true || v === undefined ? def : null);
function drawWith(dsg, pose, props) {
  const p = { ...pose, nametag: null };
  return drawCharacter(dsg, props && props.length ? withProps(p, props) : p);
}

// ================================================================= draw functions + options
const draw = {};

// YOU: nametag 'YOU'|true|string (floating game nametag + LVL tag; lvl: 99), crown: true (LVL-99 crown), sword: true|'gold'|'dark',
// hood: true (red hood over the bob), headset: true|0..1 (gaming headset; a number animates putting it on), headphones (old option)
draw.you = (pose = {}) => {
  const view = viewOf(pose);
  let d = D.you, p = pose;
  const overs = [];
  if (pose.hood) overs.push((face, t, shade, v) => L6.heroHood(v, t));
  if (pose.headset) overs.push((face, t, shade, v) => L6.gamingHeadset(v, t, { earX: 222, top: -1120, k: pose.headset === true ? 1 : +pose.headset }));
  if (pose.headphones) overs.push((face, t, shade, v) => L5.heroHeadphones(v, t, pose.headphones === true ? '#2E7BD1' : pose.headphones));
  if (pose.crown) overs.push((face, t, shade, v) => L6.crown99(v, t, { text: pose.crown === true ? '99' : String(pose.crown) }));
  if (overs.length) d = withOver(d, (face, t, shade, v) => overs.map((fn) => fn(face, t, shade, v)).join(''));
  const props = [];
  if (pose.sword) {
    p = { armR: view === 'side' ? 60 : 50, ...p };
    const side = view === 'side' ? 1 : view === 'back' ? -1 : 1;
    const h = handAt(d, p, side);
    const a = view === 'side' ? p.armR : (side < 0 ? p.armL : p.armR) ?? 9;
    const rot = pose.swordRot ?? (view === 'side' ? -lerp(30, a - 90, clamp((a - 60) / 70, 0, 1)) : swordRot(a, side));
    props.push({ svg: X.goldSword({ x: h[0], y: h[1], s: 0.95, rot, kind: pose.sword === true ? 'steel' : pose.sword, glow: pose.swordGlow || 0 }), layer: view === 'back' ? 'back' : 'front' });
  }
  const name = tagName(pose.nametag, 'YOU');
  return drawWith(d, p, props) + (pose.nametag ? tagFor(d, p, { name, lvl: pose.lvl ?? 99, col: '#FFE14D', mvp: pose.mvp }) : '');
};

// Dad: glasses 'up' (default, pushed up on the forehead) | 'on' | 'off'; mouse: true (holds a computer mouse to his ear like a phone);
// blanket: true (asleep under a quilt; pair with face 'sleepy' or sleepy: true); sleepy: true (sleepy face + zzz)
draw.dad = (pose = {}) => {
  const view = viewOf(pose);
  const gl = pose.glasses === undefined ? 'up' : pose.glasses;
  let d = D.dad, p = pose;
  if (gl && gl !== 'off') d = withOver(d, (face, t, shade, v) => L6.readers(v, t, gl));
  if (pose.sleepy && !p.face) p = { ...p, face: 'sleepy' };
  else if (pose.sleepy && p.face) p = { ...p, face: faceWith(p.face, { eyes: { upper: 0.7, tilt: -8 }, fx: ['zzz'] }) };
  const props = [];
  if (pose.mouse) {
    p = view === 'side' ? { armL: 150, ...p } : { armR: 162, ...p };
    const side = view === 'side' ? -1 : 1;
    const h = handAt(d, p, view === 'side' ? -1 : 1, 224);
    props.push({ svg: X.computerMouse({ x: h[0] + (view === 'side' ? 10 : -14), y: h[1] + 30, s: 0.85, rot: view === 'side' ? -20 : 12, t: pose.t || 0 }), layer: view === 'back' ? 'back' : 'front' });
    void side;
  }
  if (pose.blanket) {
    p = { armL: 6, armR: 6, ...p };
    props.push({ svg: X.blanket({ x: view === 'side' ? -20 : turnOf(p) * 30, y: -548, s: 1, w: view === 'side' ? 300 : 360, h: 420, t: pose.t || 0, wave: 1 }), layer: 'front' });
  }
  return drawWith(d, p, props);
};

// Mom: mug: true|text ('#1 MOM' mug in the right hand; mugUp: true raises it to sip), headset: true|0..1 (big pink gaming headset;
// a number animates putting it on), pajamas: true (night look; a tea cup in her left hand unless cup: false), tablet: true (both hands;
// screen / tabletFace / glow pass through to X.tablet)
draw.mom = (pose = {}) => {
  const view = viewOf(pose);
  let d = pose.pajamas ? D.momPJ : D.mom, p = pose;
  if (pose.headset !== undefined && pose.headset !== false) d = withOver(d, (face, t, shade, v) => L6.gamingHeadset(v, t, { earX: 172, top: -1080, col: '#3A2A48', glow: '#FF4FD8', glow2: '#3DF2FF', k: pose.headset === true ? 1 : +pose.headset }));
  const props = [];
  const lay = view === 'back' ? 'back' : 'front';
  if (pose.tablet) {
    p = { armL: view === 'side' ? 40 : 26, armR: view === 'side' ? 50 : 26, ...p };
    props.push({ svg: X.tablet({ x: view === 'side' ? -150 : turnOf(p) * 40, y: -380, s: 0.62, rot: view === 'side' ? 0 : -4, face: pose.tabletFace || (view === 'side' ? 'back' : 'back'), screen: pose.screen || null, glow: pose.glow || 0 }), layer: lay });
  }
  if (pose.mug) {
    if (pose.mugUp && view !== 'side') {
      p = { armR: 150, ...p };
      const h = handAt(d, p, 1, 200);
      props.push({ svg: X.teaMug({ x: h[0] - 20, y: h[1] - 30, s: 0.62, rot: -20, text: pose.mug === true ? '#1 MOM' : pose.mug, t: pose.t || 0, steam: 0 }), layer: lay });
    } else {
      p = { armR: view === 'side' ? 50 : 30, ...p };
      const h = handAt(d, p, view === 'side' ? -1 : 1, 226);
      props.push({ svg: X.teaMug({ x: h[0] + (view === 'side' ? -20 : 20), y: h[1] - 10, s: 0.6, text: pose.mug === true ? '#1 MOM' : pose.mug, t: pose.t || 0 }), layer: lay });
    }
  }
  if (pose.pajamas && pose.cup !== false) {
    p = { armL: view === 'side' ? 40 : 24, ...p };
    const h = handAt(d, p, view === 'side' ? 1 : -1, 230);
    props.push({ svg: X.teaCup({ x: h[0] + (view === 'side' ? -30 : -10), y: h[1] + 18, s: 0.55, t: pose.t || 0, steam: pose.steam ?? 1 }), layer: lay });
  }
  return drawWith(d, p, props);
};

// Grandma: knitting: true (needles + swatch at her hands, yarn ball by her side), phone: 'arm' (phone held out at arm's length, we see
// its back; phoneFace: 'screen' + screen), curlers: true (night), cracking: true|0..1 (knuckle-crack pose: hands together in front,
// little crack bursts; animate the number)
draw.grandma = (pose = {}) => {
  const view = viewOf(pose);
  let d = D.grandma, p = pose;
  if (pose.curlers) d = withOver(d, (face, t, shade, v) => L6.curlers(v, t));
  const props = [];
  const lay = view === 'back' ? 'back' : 'front';
  if (pose.knitting) {
    p = { armL: view === 'side' ? 40 : 24, armR: view === 'side' ? 50 : 24, ...p };
    props.push({ svg: X.knittingYarn({ x: view === 'side' ? -140 : turnOf(p) * 30, y: -300, s: 0.7, ball: [180, 200], t: pose.t || 0 }), layer: lay });
  }
  if (pose.phone) {
    p = view === 'side' ? { armL: 95, ...p } : { armR: 100, ...p };
    const h = handAt(d, p, view === 'side' ? -1 : 1, 250);
    props.push({ svg: X.phone({ x: h[0] + (view === 'side' ? -20 : 30), y: h[1] - 40, s: 0.62, rot: view === 'side' ? -6 : 8, face: pose.phoneFace || 'back', screen: pose.screen || null, glow: pose.glow || 0 }), layer: view === 'side' ? 'front' : lay });
  }
  if (pose.cracking) {
    const k = pose.cracking === true ? 1 : clamp(+pose.cracking, 0, 1);
    p = { armL: -26, armR: -26, ...p };
    const h = handAt(d, p, 1);
    let fx = '';
    if (k > 0.05) for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + 0.4, r0 = 50 + 40 * k, r1 = r0 + 40 * k; fx += S.path(`M${f(h[0] - 10 + Math.cos(a) * r0)} ${f(h[1] + Math.sin(a) * r0)} L${f(h[0] - 10 + Math.cos(a) * r1)} ${f(h[1] + Math.sin(a) * r1)}`, { fill: 'none', stroke: '#FFD21F', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: f(k) }); }
    props.push({ svg: fx, layer: 'front' });
  }
  return drawWith(d, p, props);
};

// teen Mom (1998): trophy: true (the huge ARCADE QUEEN 1998 trophy held in front) | 'up' (lifted over her head)
draw.momTeen = (pose = {}) => {
  const view = viewOf(pose);
  let p = pose;
  const props = [];
  if (pose.trophy) {
    if (pose.trophy === 'up') {
      p = { armL: 165, armR: 165, ...p };
      props.push({ svg: X.arcadeTrophy({ x: view === 'side' ? -40 : 0, y: -820, s: 0.7, t: pose.t || 0 }), layer: view === 'back' ? 'top' : 'front' });
    } else {
      p = { armL: view === 'side' ? 40 : 30, armR: view === 'side' ? 50 : 30, ...p };
      props.push({ svg: X.arcadeTrophy({ x: view === 'side' ? -150 : turnOf(p) * 40, y: -170, s: 0.62, t: pose.t || 0 }), layer: view === 'back' ? 'back' : 'front' });
    }
  }
  return drawWith(D.momTeen, p, props);
};

// DadBod1978 (the hot dog): nametag (default 'DadBod1978'), mvp: true (gold MVP medal on the costume + MVP star on the nametag)
draw.dadAvatar = (pose = {}) => {
  const p = pose;
  L6.STATE.face = p.face || 'neutral';
  L6.STATE.headRot = p.headRot || 0;
  L6.STATE.mvp = !!pose.mvp;
  const out = drawWith(D.dadAvatar, { ...p, headRot: 0 }) + tagFor(D.dadAvatar, p, { name: tagName(pose.nametag, 'DadBod1978'), mvp: pose.mvp });
  L6.STATE.face = null; L6.STATE.mvp = false; L6.STATE.headRot = 0;
  return out;
};

// MOM_OFFICIAL: armor 0 (grey default, default) | 1 (golden armour); glasses (default true); in armour: shield (pot lid on the left
// arm, default true), sword (right hand, default true; 'gold' | 'steel'), cape (default true), shieldUp: true (raised to block)
draw.momAvatar = (pose = {}) => {
  const view = viewOf(pose);
  const armor = pose.armor ? 1 : 0;
  const gl = pose.glasses !== false;
  let d = armor ? (gl ? D.momAvatar1 : D.momAvatar1nog) : (gl ? D.momAvatar0 : D.momAvatar0nog);
  let p = pose;
  const props = [];
  let under = '';
  if (armor) {
    d = withOver(d, (face, t, shade, v) => L6.goldHelmet(v, t, GOLD));
    if (pose.cape !== false) {
      const cape = L6.heroCape(view === 'back' ? 'back' : view === 'side' ? 'side' : 'front', '#D8263E', '#9E1A2C', pose.t || 0, 430);
      if (view === 'back') props.push({ svg: cape, layer: 'front' }); else under = cape;
    }
    if (pose.shield !== false) {
      if (pose.shieldUp && view !== 'back') p = { armL: view === 'side' ? 80 : 60, ...p };
      else p = { armL: view === 'side' ? 30 : 24, ...p };
      const h = handAt(d, p, view === 'side' ? 1 : -1, 170);
      props.push({ svg: X.potLid({ x: h[0] + (view === 'side' ? -40 : -20), y: h[1] - (pose.shieldUp ? 40 : 0), s: view === 'side' ? 0.95 : 1.05, rot: -10, flash: pose.shieldFlash || 0 }), layer: view === 'back' ? 'back' : view === 'side' ? 'front' : 'front' });
    }
    if (pose.sword !== false) {
      p = { armR: view === 'side' ? 60 : 40, ...p };
      const side = view === 'side' ? -1 : view === 'back' ? -1 : 1;
      const h = handAt(d, p, view === 'side' ? -1 : 1);
      const a = view === 'side' ? p.armL : p.armR;
      props.push({ svg: X.goldSword({ x: h[0], y: h[1], s: 0.95, rot: pose.swordRot ?? (view === 'side' ? -lerp(30, a - 90, clamp((a - 60) / 70, 0, 1)) : swordRot(a, 1)), kind: pose.sword === true || pose.sword === undefined ? 'gold' : pose.sword, glow: pose.swordGlow || 0 }), layer: view === 'back' ? 'back' : view === 'side' ? 'mid' : 'front' });
      void side;
    }
  }
  return underlay(d, p, under) + drawWith(d, p, props) + tagFor(d, p, { name: tagName(pose.nametag, 'MOM_OFFICIAL'), col: '#FFB3DA', mvp: pose.mvp, lvl: pose.lvl });
};

// GrannyGoodies: cane (golden cane in the left hand, default true), bag (money bag in the right hand, default true; coins 0..1),
// apron: true (Granny's Goodies bakery apron over the fur coat)
draw.grandmaAvatar = (pose = {}) => {
  const view = viewOf(pose);
  let p = pose;
  const props = [];
  const lay = view === 'back' ? 'back' : 'front';
  if (pose.cane !== false) {
    p = { armL: view === 'side' ? 20 : 14, ...p };
    const h = handAt(D.grandmaAvatar, p, view === 'side' ? 1 : -1, 240);
    props.push({ svg: X.cane({ x: h[0] - (view === 'side' ? 30 : 6), y: h[1] - 10, s: 0.62, rot: view === 'side' ? 0 : 4 }), layer: view === 'side' ? 'back' : lay });
  }
  if (pose.bag !== false) {
    p = { armR: view === 'side' ? 30 : 20, ...p };
    const h = handAt(D.grandmaAvatar, p, view === 'side' ? -1 : 1, 240);
    props.push({ svg: X.coinBag({ x: h[0] + (view === 'side' ? 0 : 6), y: h[1] - 6, s: 0.5, coins: pose.coins || 0 }), layer: lay });
  }
  L6.STATE.apron = pose.apron ? L6.APRON_GG : false;
  const out = drawWith(D.grandmaAvatar, p, props) + tagFor(D.grandmaAvatar, p, { name: tagName(pose.nametag, 'GrannyGoodies'), col: '#FFE14D', mvp: pose.mvp });
  L6.STATE.apron = false;
  return out;
};

// NoodleBoi: hairnet: true (net over the noodles), apron: true (Granny's Goodies factory apron), badge: true|'EMPLOYEE OF THE MONTH'
draw.noodle = (pose = {}) => {
  L6.STATE.hairnet = !!pose.hairnet;
  L6.STATE.apron = pose.apron ? L6.APRON_GG : false;
  L6.STATE.badge = pose.badge || null;
  L6.STATE.t = pose.t || 0;
  const out = drawWith(D.noodle, pose) + tagFor(D.noodle, pose, { name: tagName(pose.nametag, 'NoodleBoi'), col: '#7FE8FF' });
  L6.STATE.hairnet = false; L6.STATE.apron = false; L6.STATE.badge = null;
  return out;
};

// xX_DarkBlade_Xx: sword (default true; 'back' = slung on his back, false = none), cape (default true), shy: true (visor pushed up —
// a shy kid's face shows; softer default stance), stars: true (dizzy KO stars; pass t). No mouth while the visor is down: his eyes
// pulse with his voice (lip-sync drives the glow) — his lines are carried by chat bubbles.
draw.darkblade = (pose = {}) => {
  const view = viewOf(pose);
  let d = D.darkblade, p = pose;
  if (pose.shy) p = { armL: -6, armR: -6, headRot: 6, lean: 3, ...p };
  if (pose.stars) d = withOver(d, () => L6.dizzyStars(pose.t || 0));
  const props = [];
  let under = '';
  if (pose.cape !== false) {
    const cape = L6.tatteredCape(view === 'back' ? 'back' : view === 'side' ? 'side' : 'front', '#5A0E1E', '#2A0710', pose.t || 0, 480);
    if (view === 'back') props.push({ svg: cape, layer: 'front' }); else under = cape;
  }
  if (pose.sword !== false && !pose.shy) {
    if (pose.sword === 'back') {
      const sv = X.goldSword({ x: view === 'side' ? 90 : -70, y: -330, s: 1.15, rot: view === 'side' ? 200 : 155, kind: 'dark' });
      if (view === 'back') props.push({ svg: sv, layer: 'front' }); else props.push({ svg: sv, layer: 'back' });
    } else {
      p = { armR: view === 'side' ? 60 : 50, ...p };
      const h = handAt(d, p, view === 'side' ? -1 : 1);
      const a = view === 'side' ? p.armL : p.armR;
      props.push({ svg: X.goldSword({ x: h[0], y: h[1], s: 1.15, rot: pose.swordRot ?? (view === 'side' ? -lerp(30, a - 90, clamp((a - 60) / 70, 0, 1)) : swordRot(a, 1)), kind: 'dark', glow: pose.swordGlow || 0 }), layer: view === 'back' ? 'back' : 'front' });
    }
  }
  L6.STATE.shy = !!pose.shy;
  const out = underlay(d, p, under) + drawWith(d, p, props) + tagFor(d, p, { name: tagName(pose.nametag, 'xX_DarkBlade_Xx'), col: '#FF5A6E' });
  L6.STATE.shy = false;
  return out;
};

// the clan: draw.clan(i, pose) or actor('clan', t, { i, ... }); weapon (default per member: axe or sword; false = none), stars: true
draw.clan = (i, pose) => {
  if (typeof i === 'object' && i) { pose = i; i = i.i ?? 0; }
  pose = pose || {};
  const view = viewOf(pose);
  let d = clanDesign(i), p = pose;
  if (pose.stars) d = withOver(d, () => L6.dizzyStars(pose.t || 0));
  const props = [];
  const w = pose.weapon === undefined ? d.clan.weapon : pose.weapon;
  if (w) {
    p = { armR: view === 'side' ? 60 : 40, ...p };
    const h = handAt(d, p, view === 'side' ? -1 : 1);
    const a = view === 'side' ? p.armL : p.armR;
    const rot = view === 'side' ? -lerp(30, a - 90, clamp((a - 60) / 70, 0, 1)) : swordRot(a, 1);
    props.push({ svg: w === 'axe' ? X.axe({ x: h[0], y: h[1], s: 0.9, rot, col: d.clan.hi, glow: d.clan.eye }) : X.goldSword({ x: h[0], y: h[1], s: 0.95, rot, kind: 'dark' }), layer: view === 'back' ? 'back' : 'front' });
  }
  return drawWith(d, p, props) + (pose.nametag ? tagFor(d, p, { name: typeof pose.nametag === 'string' ? pose.nametag : `DarkClan_${(i % 90) + 7}`, col: '#C9B8FF' }) : '');
};

// DarkBlade's mom: rollingPin (default true; raised in the right hand), nametag (default 'MOM')
draw.darkbladeMom = (pose = {}) => {
  const view = viewOf(pose);
  let p = pose;
  const props = [];
  if (pose.rollingPin !== false) {
    p = view === 'side' ? { armL: 140, ...p } : { armR: 150, ...p };
    const h = handAt(D.darkbladeMom, p, view === 'side' ? -1 : 1, 240);
    props.push({ svg: X.rollingPin({ x: h[0], y: h[1], s: 0.7, rot: view === 'side' ? 70 : -60 }), layer: view === 'back' ? 'back' : 'front' });
  }
  return drawWith(D.darkbladeMom, p, props) + tagFor(D.darkbladeMom, p, { name: tagName(pose.nametag, 'MOM'), col: '#FF9FD0' });
};

// generic players and noobs (lite avatars: no clips, no filters). player(i, pose) / noob(i, pose), or actor(.., { i }).
// options: sword true|'gold'|'steel'|'dark', nametag (string), stars: true, t (propeller spin). noob 0 = THE KID (propeller cap).
function lite(dsgFn, defTag) {
  return (i, pose) => {
    if (typeof i === 'object' && i) { pose = i; i = i.i ?? i.seed ?? 0; }
    pose = pose || {};
    const view = viewOf(pose);
    const d = dsgFn(i);
    let p = pose;
    const props = [];
    if (pose.sword) {
      p = { armR: view === 'side' ? 60 : 50, ...p };
      const h = handAt(d, p, view === 'side' ? -1 : 1);
      const a = view === 'side' ? p.armL : p.armR;
      props.push({ svg: X.goldSword({ x: h[0], y: h[1], s: 0.9, rot: view === 'side' ? -lerp(30, a - 90, clamp((a - 60) / 70, 0, 1)) : swordRot(a, 1), kind: pose.sword === true ? 'steel' : pose.sword }), layer: view === 'back' ? 'back' : 'front' });
    }
    if (pose.stars) props.push({ svg: L6.dizzyStars(pose.t || 0, 3, -1000, 170), layer: 'front' });
    L6.STATE.t = pose.t || 0;
    return drawWith(d, p, props) + (pose.nametag ? tagFor(d, p, { name: typeof pose.nametag === 'string' ? pose.nametag : defTag(i), col: '#FFFFFF', scale: 0.8 }) : '');
  };
}
const PLAYER_NAMES = ['xXPro_GamerXx', 'BlockyBoi', 'CoolKid2015', 'PizzaLord', 'Speedrun_Sam', 'ObbyQueen', 'NotAFish', 'TacoTuesday', 'MegaMilo', 'Pixel_Pat', 'SirLagsAlot', 'Bob'];
draw.player = lite(playerDesign, (i) => PLAYER_NAMES[((i % PLAYER_NAMES.length) + PLAYER_NAMES.length) % PLAYER_NAMES.length]);
draw.noob = lite(noobDesign, (i) => (i === 0 ? 'lil_noob_7' : `Guest_${1000 + ((i * 739) % 9000)}`));
// `kid` = the noob kids of Cube City (actor('kid', …) lip-syncs the KID voice; i 0 = THE KID with the propeller cap)
draw.kid = draw.noob;
// real-world humans for crowds (not in the script, kept for the API)
draw.humanKid = (i, pose) => { if (typeof i === 'object' && i) { pose = i; i = i.i ?? 0; } if (!humanKidCache[i]) humanKidCache[i] = kidDesign(i); return drawCharacter(humanKidCache[i], pose || {}); };
draw.adult = (i, pose) => { if (typeof i === 'object' && i) { pose = i; i = i.i ?? 0; } if (!adultCache[i]) adultCache[i] = adultDesign(i); return drawCharacter(adultCache[i], pose || {}); };

// THE BLOCK KING (non-rig): x, y (feet), s (≈ 1220 tall at s 1 — use s 1.5–4 to fill the sky), flip, pose 'idle'|'rise'|'smash'|'roar'|'hit',
// k (smash progress 0 raised -> 1 slammed), rise 0..1 (emerging from the ground, cut at y), crack 0..1 (glowing cracks; > 0.55 the
// cubes burst apart), shield 0..1 (core glow + ring; the dome itself is in the UI kit), t (idle breathing, glow flicker), face
// (actor('boss', …) drives the jaw with the voice), jaw 0..1, glow, armL/armR/bendL/bendR/lean/headRot/headY/bodyY/fist overrides,
// shadow (default true), lw (outline width in local units; default keeps ≈ 14 px on screen)
draw.blockKing = (pose = {}) => {
  const s = pose.s ?? 1, x = pose.x || 0, y = pose.y || 0;
  let o = '';
  if (pose.shadow !== false && (pose.rise ?? 1) > 0.3) o += S.ellipse(x, y, 520 * s, 60 * s, { fill: 'rgba(0,0,0,0.22)' });
  o += S.g(L6.blockKing({ ...pose, s }), `translate(${f(x)} ${f(y - (pose.lift || 0))}) scale(${f((pose.flip ? -1 : 1) * s)} ${f(s)})${pose.rot ? ` rotate(${f(pose.rot)} 0 -500)` : ''}`);
  return o;
};
draw.boss = draw.blockKing;

const NAMES = {
  you: 'YOU', dad: 'Dad', mom: 'Mom', grandma: 'Grandma', momTeen: 'Mom (1998)',
  dadAvatar: 'DadBod1978', momAvatar: 'MOM_OFFICIAL', grandmaAvatar: 'GrannyGoodies', noodle: 'NoodleBoi', darkblade: 'xX_DarkBlade_Xx', clan: 'DarkBlade clan',
  darkbladeMom: "DarkBlade's mom", player: 'Player', noob: 'Noob', kid: 'The KID', blockKing: 'The Block King', boss: 'The Block King', adult: 'Adult', humanKid: 'Kid (human)',
};

module.exports = {
  D, draw, NAMES, kidDesign, adultDesign, handAt, clanDesign, playerDesign, noobDesign, playerSpec, noobSpec, underlay, tagFor,
  extras: X, looks: L6,
};
