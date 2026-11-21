// Reusable acting: run/walk cycles, hand positions, idle breathing, look-at helpers.
'use strict';

const S = require('../rig/svg');
const { lerp, clamp } = S;

// side-view run cycle at phase ph (radians); amp scales the swing
const run = (ph, amp = 1) => ({
  legL: 44 * amp * Math.sin(ph), kneeL: 26 + 34 * Math.max(0, -Math.sin(ph)) * amp, legR: -44 * amp * Math.sin(ph), kneeR: 26 + 34 * Math.max(0, Math.sin(ph)) * amp,
  armL: -50 * amp * Math.sin(ph), armR: 50 * amp * Math.sin(ph), lift: 14 * amp * Math.abs(Math.sin(ph)),
});
// side-view walk
const walk = (ph, amp = 1) => ({
  legL: 24 * amp * Math.sin(ph), kneeL: 10 + 22 * Math.max(0, -Math.sin(ph)) * amp, legR: -24 * amp * Math.sin(ph), kneeR: 10 + 22 * Math.max(0, Math.sin(ph)) * amp,
  armL: -26 * amp * Math.sin(ph), armR: 26 * amp * Math.sin(ph), bodyY: -4 * Math.abs(Math.cos(ph)),
});
// front-view bounce walk (in place)
const walkFront = (ph, amp = 1) => ({ legL: 4 * Math.sin(ph) * amp, legR: -4 * Math.sin(ph) * amp, bodyY: 6 * Math.abs(Math.sin(ph)) * amp, armL: 9 + 10 * Math.sin(ph) * amp, armR: 9 - 10 * Math.sin(ph) * amp });
// idle breathing
const breathe = (t, ph = 0) => ({ bodyY: 3 + 3 * Math.sin(t * 4.2 + ph), headY: 2 * Math.sin(t * 4.2 + ph) });
// hand tip (body space) for an outward front-view arm angle; side +1 = screen-right arm
const hand = (a, side = 1) => [side * (100 + 250 * Math.sin((a * Math.PI) / 180)), -515 + 250 * Math.cos((a * Math.PI) / 180)];
// look vector from a character at x toward target x (front view eyes)
const lookAt = (x, tx, y = 0) => [clamp((tx - x) / 600, -1, 1), y];
// floss dance arms
const floss = (t) => { const k = Math.sin(t * 9); return { armL: -40 + 70 * k, armR: 40 + 70 * k, lean: 4 * k, bodyY: 4 * Math.abs(k) }; };

module.exports = { run, walk, walkFront, breathe, hand, lookAt, floss };
