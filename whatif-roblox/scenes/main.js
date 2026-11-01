// The whole video: master timeline that stitches the scene modules + captions.
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

// later parts register themselves here: { START, END, scene(t), TRACK, overlay?(t), captionY?(t) }
const LATER = ['sc04', 'sc05', 'sc06', 'sc07', 'sc08', 'sc10', 'sc10b', 'sc11', 'sc11b', 'sc12'];
const parts = [];
for (const name of LATER) {
  try { parts.push(require('./' + name)); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND' || !String(e.message).includes(name)) throw e; }
}

const DURATION = parts.length ? parts[parts.length - 1].END : sc03.END;
const CAPS = [...intro.CAPS, ...sc01b.TRACK.caps, ...sc02.TRACK.caps, ...sc03.TRACK.caps, ...parts.flatMap((p) => p.TRACK.caps)];

function partAt(t) { return parts.find((p) => t >= p.START && t < p.END) || null; }

function sceneAt(t) {
  if (t < 10.0) return intro.scene(t);
  if (t < 19.2) return sc01b.scene(t, sceneAt);
  if (t < 61.0) return sc02.scene(t);
  if (t < sc03.END || !parts.length) return sc03.scene(Math.min(t, sc03.END - 1e-3));
  const p = partAt(t) || parts[parts.length - 1];
  return p.scene(Math.min(t, p.END - 1e-3));
}

function frame(t) {
  let o = E.DEFS + sceneAt(t);
  const p = t >= sc03.END ? partAt(t) : null;
  const cy = p && p.captionY ? p.captionY(t) : 1018;
  o += C.captionAt(CAPS, t, cy);
  if (t < 61.0) o += sc02.overlay(t);
  if (p && p.overlay) o += p.overlay(t);
  return o;
}

if (require.main === module) {
  const out = process.argv[2] || path.join(__dirname, '..', 'out', 'whatif_full.mp4');
  const fps = Number(process.argv[3] || 60);
  const from = Number(process.argv[4] || 0), to = Number(process.argv[5] || DURATION);
  renderVideo(frame, { w: 1920, h: 1080, fps, duration: to - from, start: from, out, crf: 16 }).catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { frame, sceneAt, DURATION };
