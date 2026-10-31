// YOU — the hero. Built from the shared R6 kid family (rig/r6.js) with the base style.
// Pose fields: see rig/body.js.
'use strict';

const { makeDesign, makeDraw } = require('./r6');
const { nametag, legJoints, BASE_DIMS } = require('./body');

const YOU_DESIGN = makeDesign({});
const drawHero = makeDraw(YOU_DESIGN);

// straight standing leg joints, handy for sheets
const standJ = () => legJoints({ angle: 0, L1: BASE_DIMS.thigh, L2: BASE_DIMS.shin });

module.exports = {
  drawHero,
  drawHeadFront: YOU_DESIGN.head,
  drawHeadSide: YOU_DESIGN.headSide,
  drawHeadBack: YOU_DESIGN.headBack,
  drawArm: YOU_DESIGN.arm,
  drawLeg: (o = {}) => YOU_DESIGN.leg({ J: standJ(), ...o }),
  drawTorsoFront: YOU_DESIGN.torso,
  nametag,
  YOU_DESIGN,
  standJ,
};
