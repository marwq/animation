// Secondary cast built on the R6 kid family. Each export is a draw(pose) function.
'use strict';

const { makeDesign, makeDraw } = require('./r6');

const DESIGNS = {
  // yellow-green: blond spiky hair, green jersey #7 — the 7-year-old speed thief
  speedy: makeDesign({
    size: 0.84, hair: 'spiky', eyeStyle: 'dot', top: 'jersey', number: '7', backName: 'Speedy',
    sleeve: 'short', sleeveStripe: '#FFFFFF', pantsShape: 'straight', neutralMouth: 'smirk',
    brows: { L: [8, -6], R: [8, -6] },
    col: {
      skin: '#F6CFA6', skinShade: '#E2AF84', hair: '#FAD332', hairShade: '#E0A91A', hairHi: '#FFF3B0', brow: '#3A2A10',
      top: '#25A84B', topShade: '#1A8A3B', trim: '#FFFFFF', sleeve: '#25A84B',
      pants: '#1E2A3A', pantsShade: '#141C27', sole: '#FFFFFF', toe: '#25A84B', soleBand: '#25A84B',
    },
  }),
  // blue-red: blue quiff, white/red/blue varsity jacket, gold egg chain — #1 on the leaderboard
  egglord: makeDesign({
    size: 1.04, hair: 'quiff', eyeStyle: 'dot', top: 'varsity', letter: 'E', backName: 'EGGLORD',
    sleeve: 'long', pantsShape: 'straight', neutralMouth: 'smirk', acc: { chain: '#FFC52E' },
    eye: { upper: 0.26 }, brows: { L: [10, -4], R: [-14, -20] },
    col: {
      skin: '#F3C9A2', skinShade: '#DDAA80', hair: '#2E6BFF', hairShade: '#1F49C4', hairHi: '#9CC0FF', brow: '#1B2F80',
      top: '#F5F6FA', topShade: '#D9DCE6', trim: '#E0283F', trim2: '#2547B8', sleeve: '#E0283F', cuff: '#2547B8',
      pants: '#2B4A9B', pantsShade: '#203A7C', sole: '#FFFFFF', toe: '#E0283F', soleBand: '#2547B8',
    },
  }),
  // pink buns, purple hoodie
  pinky: makeDesign({
    size: 0.95, hair: 'buns', eyeStyle: 'big', lashes: true, blush: true, brows: false, top: 'hoodie', chestIcon: '#FF6FB5',
    sleeve: 'long', pantsShape: 'straight', neutralMouth: 'smallSmile', eye: { pupil: 1.35, sparkle: true, cross: 0.4 },
    col: {
      skin: '#FCE6D6', skinShade: '#EBC9B1', hair: '#FF6FB5', hairShade: '#E0479A', hairHi: '#FFC0E0', accent: '#FFE14D',
      top: '#8B5CF6', topShade: '#6D3FD8', trim: '#FFFFFF', sleeve: '#8B5CF6', cuff: '#6D3FD8',
      pants: '#9DB6E8', pantsShade: '#7F97CC', sole: '#FFFFFF', toe: '#FF6FB5', soleBand: '#FF6FB5',
    },
  }),
  // orange cap + headphones, teal hoodie
  max: makeDesign({
    hair: 'cap', eyeStyle: 'dot', top: 'hoodie', sleeve: 'long', pantsShape: 'wide', neutralMouth: 'smile',
    acc: { headphones: '#2A2E37' }, brows: { L: [0, 0], R: [0, 0] },
    col: {
      skin: '#9A6544', skinShade: '#7E4F33', hair: '#2B1D16', hairShade: '#1A110C', hairHi: '#5A3F31', brow: '#1A110C',
      cap: '#FF8A1F', capShade: '#E06A0A', capBrim: '#E06A0A', capLogo: '#1FB5A8', capHi: '#FFD2A6',
      top: '#1FB5A8', topShade: '#16928A', trim: '#FFFFFF', sleeve: '#1FB5A8', cuff: '#16928A',
      pants: '#3A3F4B', pantsShade: '#2A2E37', sole: '#FFFFFF', toe: '#FF8A1F', soleBand: '#FF8A1F',
    },
  }),
  // Mom: warm caramel bob, lashes, pink cardigan over a white tee, apron added as a prop
  mom: makeDesign({
    size: 1.0, hair: 'bob', longHair: true, notch: 46, lashes: true, blush: true, neutralMouth: 'smile',
    eye: { pupil: 1.15, sparkle: true, cross: 0.5 },
    col: {
      hair: '#A0522D', hairShade: '#7E3E1F', hairHi: '#D98A5B', skin: '#FFFFFF',
      jacket: '#FF7AA8', jacketLine: '#C24F7A', shirt: '#FFFFFF', shirtShade: '#E7E8F0', collar: '#FFFFFF',
      pants: '#4A5A9E', pantsShade: '#3A4880', sole: '#FFFFFF', toe: '#FF7AA8', soleBand: '#FF7AA8',
    },
  }),
  // classic noob: yellow head, blue tee, green legs
  dad: makeDesign({
    size: 1.05, hair: 'none', eyeStyle: 'dot', top: 'tee', sleeve: 'none', pantsShape: 'straight', neutralMouth: 'smile',
    brows: { L: [-4, 0], R: [-4, 0] },
    col: {
      skin: '#F5CD3D', skinShade: '#DDB024', brow: '#5A4A10',
      top: '#1E73E8', topShade: '#195FC0', pants: '#3BB24A', pantsShade: '#2E9139',
      sole: '#3BB24A', soleShade: '#2E9139', toe: '#3BB24A',
    },
  }),
};

const draw = Object.fromEntries(Object.entries(DESIGNS).map(([k, d]) => [k, makeDraw(d)]));
const NAMES = { speedy: 'xX_Speedy_Xx', egglord: 'xX_EggLord_Xx', pinky: 'PinkPop', max: 'MaxBeatz', dad: 'Dad', mom: 'Mom' };

module.exports = { DESIGNS, draw, NAMES };
