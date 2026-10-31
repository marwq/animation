// The whole video so far: master timeline that stitches the scenes + captions.
// Usage: node scenes/main.js [out.mp4] [fps] [from] [to]
'use strict';

const path = require('path');
const E = require('./env');
const C = require('./common');
const intro = require('./intro');
const sc01b = require('./sc01b');
const sc02 = require('./sc02');
const sc03 = require('./sc03');
const { renderVideo } = require('../tools/render');

const DURATION = sc03.END;

const CAPS = [...intro.CAPS, ...sc01b.TRACK.caps, ...sc02.TRACK.caps, ...sc03.TRACK.caps];

function sceneAt(t) {
  if (t < 10.0) return intro.scene(t);
  if (t < 19.2) return sc01b.scene(t, sceneAt);
  if (t < 61.0) return sc02.scene(t);
  return sc03.scene(t);
}

function frame(t) {
  let o = E.DEFS + sceneAt(t);
  o += C.captionAt(CAPS, t, t >= 61.0 ? sc03.captionY(t) : 1018);
  if (t < 61.0) o += sc02.overlay(t);
  return o;
}

if (require.main === module) {
  const out = process.argv[2] || path.join(__dirname, '..', 'out', 'whatif_1min.mp4');
  const fps = Number(process.argv[3] || 60);
  const from = Number(process.argv[4] || 0), to = Number(process.argv[5] || DURATION);
  renderVideo(frame, { w: 1920, h: 1080, fps, duration: to - from, start: from, out, crf: 16 }).catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { frame, sceneAt, DURATION };
