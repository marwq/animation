// NOVA — built exactly like YOU (same head, huge round eyes, chunky bob whose V-notch is
// the brows, open jacket, wide pants, sneakers) with her own style: black hair a bit
// longer at the back, eyelashes, soft blush, red hair clip, thin dark half-moon shades
// low on the nose (eyes look over them), red jacket over a black tee, black pants,
// red sneakers.
//
// Face extras: glasses: 'half' (default) | false, glassesDy: slide the shades down.
'use strict';

const { makeDesign, makeDraw } = require('./r6');

const NOVA_STYLE = {
  col: {
    hair: '#24252D', hairShade: '#15161B', hairHi: '#5C637A',
    jacket: '#D9263C', jacketLine: '#7E1020', shirt: '#1B1B21', shirtShade: '#111116',
    pants: '#1B1B21', pantsShade: '#0F0F13',
    sole: '#FFFFFF', soleShade: '#E2E3EA', toe: '#E0283F', soleBand: '#E0283F',
  },
  notch: 40,
  eye: { pupil: 1.3, sparkle: true, cross: 0.55 },
  lashes: true,
  longHair: true,
  glasses: 'half',
  blush: true,
  clip: '#E0283F',
  neutralMouth: 'smallSmile',
};

const NOVA_DESIGN = makeDesign(NOVA_STYLE);
const drawNova = makeDraw(NOVA_DESIGN);

module.exports = { drawNova, NOVA_DESIGN, NOVA_STYLE, headFront: NOVA_DESIGN.head };
