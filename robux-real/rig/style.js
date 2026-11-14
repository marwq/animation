// Look of the Robux video: soft "vinyl toy" volume on every body part, plus frame-wide grading helpers.
'use strict';

// light from the top-left: a soft inner shadow along the bottom-right edges and a soft highlight along the top-left
function volFilter(id, dir = 1, k = 1) {
  const d = 11 * dir;
  return `<filter id="${id}" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
  <feGaussianBlur in="SourceAlpha" stdDeviation="${8 * k}" result="b"/>
  <feOffset in="b" dx="${-d * k}" dy="${-11 * k}" result="o1"/>
  <feComposite in="SourceAlpha" in2="o1" operator="out" result="rs"/>
  <feColorMatrix in="rs" type="matrix" values="0 0 0 0 0.16  0 0 0 0 0.09  0 0 0 0 0.25  0 0 0 0.4 0" result="sh"/>
  <feOffset in="b" dx="${d * 0.8 * k}" dy="${9 * k}" result="o2"/>
  <feComposite in="SourceAlpha" in2="o2" operator="out" result="rl"/>
  <feColorMatrix in="rl" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.28 0" result="hl"/>
  <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="sh"/><feMergeNode in="hl"/></feMerge>
</filter>`;
}

const DEFS = `<defs>${volFilter('vol', 1)}${volFilter('volF', -1)}</defs>`;

module.exports = { DEFS, volFilter };

// ---------------------------------------------------------------- frame finish: grade, vignette, grain
const fs = require('fs');
const path = require('path');
const GRAIN = 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, '..', 'assets', 'grain.png')).toString('base64');
const FRAME_DEFS = `<defs>
<pattern id="grain" patternUnits="userSpaceOnUse" width="256" height="256"><image href="${GRAIN}" width="256" height="256"/></pattern>
<radialGradient id="vignette" cx="0.5" cy="0.48" r="0.78"><stop offset="0.62" stop-color="#1A0B2E" stop-opacity="0"/><stop offset="1" stop-color="#1A0B2E" stop-opacity="0.42"/></radialGradient>
<linearGradient id="gradeWarm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD9A0" stop-opacity="0.10"/><stop offset="0.6" stop-color="#FFD9A0" stop-opacity="0"/><stop offset="1" stop-color="#5A2A8A" stop-opacity="0.08"/></linearGradient>
<linearGradient id="gradeCool" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD8FF" stop-opacity="0.12"/><stop offset="1" stop-color="#1A1050" stop-opacity="0.18"/></linearGradient>
<linearGradient id="gradeNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A1A6A" stop-opacity="0.35"/><stop offset="1" stop-color="#0A0620" stop-opacity="0.45"/></linearGradient>
</defs>`;

// grade: 'warm' | 'cool' | 'night' | null — plain translucent overlays (blend modes are too slow to rasterise);
// film grain is added by ffmpeg while encoding (see tools/render.js POST_VF)
function finish(t, { grade = 'warm', vignette = 0.85, W = 1920, H = 1080 } = {}) {
  let o = '';
  if (grade) o += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#grade${grade[0].toUpperCase()}${grade.slice(1)})"/>`;
  if (vignette) o += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#vignette)" opacity="${vignette}"/>`;
  return o;
}

module.exports.FRAME_DEFS = FRAME_DEFS;
module.exports.finish = finish;
