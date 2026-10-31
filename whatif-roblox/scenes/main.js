// The whole video so far: master timeline that stitches the scenes + captions.
// Usage: node scenes/main.js [out.mp4] [fps] [from] [to]
'use strict';

const path = require('path');
const E = require('./env');
const C = require('./common');
const intro = require('./intro');
const sc01b = require('./sc01b');
let sc02 = null;
try { sc02 = require('./sc02'); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; }
const { renderVideo } = require('../tools/render');

const DURATION = 61.0;

const CAPS = [...intro.CAPS, ...sc01b.TRACK.caps, ...(sc02 ? sc02.TRACK.caps : [])];

function sceneAt(t) {
  if (t < 10.0) return intro.scene(t);
  if (t < 19.2 || !sc02) return sc01b.scene(t, sceneAt);
  return sc02.scene(t);
}

function frame(t) {
  let o = E.DEFS + sceneAt(t);
  o += C.captionAt(CAPS, t);
  if (sc02 && sc02.overlay) o += sc02.overlay(t);
  return o;
}

if (require.main === module) {
  const out = process.argv[2] || path.join(__dirname, '..', 'out', 'whatif_1min.mp4');
  const fps = Number(process.argv[3] || 60);
  const from = Number(process.argv[4] || 0), to = Number(process.argv[5] || DURATION);
  renderVideo(frame, { w: 1920, h: 1080, fps, duration: to - from, start: from, out, crf: 16 }).catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { frame, sceneAt, DURATION };
