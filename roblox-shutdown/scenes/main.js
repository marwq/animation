// Master timeline of "What If Roblox Shut Down FOREVER?": routes time to the scene modules, adds captions + frame finish.
// Usage: node scenes/main.js out.mp4 [fps=60] [from=0] [to=end]
'use strict';

const path = require('path');
const C = require('./common');
const V = require('./vo');
const ST = require('../rig/style');
const { renderVideo } = require('../tools/render');

// scene modules register by id; missing ones show a placeholder card so the whole timeline always renders
const MODS = {
  'SC 01': 's01', 'SC 02': 's02', 'SC 03': 's03', 'SC 04': 's04', 'SC 05': 's05', 'SC 06': 's06', 'SC 07': 's07',
  'SC 08': 's08', 'SC 09': 's09', 'SC 10': 's10', 'SC 11': 's11', 'SC 12': 's12', 'SC 13': 's13',
};
const ORDER = Object.keys(MODS);
const RANGES = ORDER.map((id, i) => ({ id, a: i === 0 ? 0 : V.TL.scenes[id].start, b: i + 1 < ORDER.length ? V.TL.scenes[ORDER[i + 1]].start : V.DURATION }));
const loaded = {};
function mod(id) {
  if (!(id in loaded)) {
    try { loaded[id] = require('./' + MODS[id]); } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND' || !String(e.message).includes(MODS[id])) throw e;
      loaded[id] = null;
    }
  }
  return loaded[id];
}

function placeholder(id, t) {
  return `<rect x="0" y="0" width="1920" height="1080" fill="#2A1640"/>` +
    `<text x="960" y="520" font-family="Lilita One" font-size="90" fill="#FFD21F" text-anchor="middle">${id}</text>` +
    `<text x="960" y="600" font-family="Fredoka" font-weight="600" font-size="40" fill="#FFFFFF" text-anchor="middle">${t.toFixed(2)}s</text>`;
}

const STATIC_DEFS = ST.DEFS + ST.FRAME_DEFS + (require('./env').DEFS || '') + ORDER.map((id) => (mod(id) && mod(id).DEFS) || '').join('');

function frame(t) {
  const r = RANGES.find((x) => t >= x.a && t < x.b) || RANGES[RANGES.length - 1];
  const m = mod(r.id);
  let o = m ? m.scene(t) : placeholder(r.id, t);
  const look = m && m.look ? m.look(t) : {};
  o += ST.finish(t, look);
  if (m && m.timer) { const v = m.timer(t); if (v !== null && v !== undefined) o += require('./kit').timerHUD(typeof v === 'number' ? v : v.sec, { t, ...(typeof v === 'number' ? {} : v) }); }
  if (!(m && m.noCaptions && m.noCaptions(t))) o += C.captionAt(V.TRACK.caps, t, m && m.captionY ? m.captionY(t) : 1010);
  if (m && m.overlay) o += m.overlay(t);
  return o;
}

if (require.main === module) {
  const out = process.argv[2] || path.join(__dirname, '..', 'out', 'shutdown_full.mp4');
  const fps = Number(process.argv[3] || 60);
  const from = Number(process.argv[4] || 0), to = Number(process.argv[5] || V.DURATION);
  renderVideo(frame, { w: 1920, h: 1080, fps, duration: to - from, start: from, out, crf: 16, staticDefs: STATIC_DEFS })
    .catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { frame, RANGES, STATIC_DEFS };
