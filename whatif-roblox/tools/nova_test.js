// ~6 s rig test for NOVA: idle + ponytail sway -> shades slip, "Nice name tag... YOU."
// -> wink -> backflip -> "Keep up, noob."   Usage: node tools/nova_test.js [out.mp4] [fps]
'use strict';

const path = require('path');
const S = require('../rig/svg');
const { drawNova } = require('../rig/nova');
const { background } = require('./anim_test');
const { renderVideo } = require('./render');
const { f, ease, inv, lerp } = S;

const W = 1920, H = 1080, GROUND = 975, NS = 0.72;
const BG = background();

const CAPS = [
  [1.6, 1.85, 'NICE', '#fff'], [1.85, 2.1, 'NAME', '#fff'], [2.1, 2.55, 'TAG...', '#fff'], [2.6, 3.05, 'YOU.', '#FF8FB0'],
  [5.05, 5.4, 'KEEP', '#fff'], [5.4, 5.65, 'UP,', '#fff'], [5.65, 6.2, 'NOOB.', '#FF5A5A'],
];
const VIS = { NICE: 'BCB', NAME: 'BCA', 'TAG...': 'BDB', 'YOU.': 'BFF', KEEP: 'BCB', 'UP,': 'DA', 'NOOB.': 'BFFA' };
const cap = (t) => CAPS.find(([a, b]) => t >= a && t < b);
function viseme(t) {
  const c = cap(t); if (!c) return null;
  const seq = VIS[c[2]]; const end = Math.min(c[1], c[0] + seq.length * 0.08 + 0.04);
  if (t > end) return null;
  return seq[Math.min(seq.length - 1, Math.floor(((t - c[0]) / (end - c[0])) * seq.length))];
}
function caption(t) {
  const c = cap(t); if (!c) return '';
  const sc = lerp(0.55, 1, ease.outBack(inv(c[0], c[0] + 0.14, t)));
  return S.g(S.el('text', { x: 0, y: 0, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': 96, fill: c[3], stroke: '#151515', 'stroke-width': 16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', 'text-anchor': 'middle' }, c[2]), `translate(960 1052) scale(${f(sc)})`);
}

function novaAt(t) {
  const breathe = Math.sin((t * Math.PI * 2) / 1.5);
  const p = { x: 960, y: GROUND, s: NS, nametag: 'Nova', bodyY: 3 + 3 * breathe, headY: 2 * breathe };
  let tail = 6 * Math.sin((t * Math.PI * 2) / 1.3);
  const blink = (c) => Math.max(0, 1 - Math.abs(t - c) / 0.07);
  if (t < 1.3) {
    const lx = lerp(0, -0.7, ease.inOut(inv(0.3, 0.5, t))) + lerp(0, 0.85, ease.inOut(inv(0.9, 1.1, t)));
    p.face = { name: 'cool', eyes: { look: [lx, -0.35] }, blink: blink(0.7) };
  } else if (t < 3.05) {
    p.turn = -0.35 * ease.out(inv(1.3, 1.55, t));
    p.headRot = -5 * ease.out(inv(1.3, 1.55, t));
    const slip = 18 * ease.out(inv(1.4, 1.7, t));
    p.face = { name: 'teasing', glassesDy: slip, mouth: viseme(t) || 'smirk', blink: blink(2.58) };
    tail += 10 * Math.sin(inv(1.3, 1.6, t) * Math.PI);
  } else if (t < 3.5) {
    p.turn = -0.35 * (1 - ease.inOut(inv(3.05, 3.3, t)));
    p.face = { name: 'wink', glassesDy: 18 * (1 - ease.out(inv(3.05, 3.2, t))) };
    p.headRot = 6 * Math.sin(inv(3.05, 3.5, t) * Math.PI);
  } else if (t < 4.95) {
    const anticip = inv(3.5, 3.72, t), fl = inv(3.72, 4.62, t), land = inv(4.62, 4.95, t);
    if (t < 3.72) {
      p.bodyY += 34 * Math.sin(anticip * Math.PI * 0.5); p.sy = 1 - 0.08 * anticip; p.armL = p.armR = lerp(8, -20, anticip);
      p.face = { name: 'focused' };
    } else if (t < 4.62) {
      p.lift = Math.sin(fl * Math.PI) * 210;
      p.rot = -360 * ease.inOut(fl);
      p.armL = p.armR = 160; p.legL = 18 * Math.sin(fl * Math.PI); p.legR = -12 * Math.sin(fl * Math.PI);
      p.sy = 1 + 0.06 * Math.sin(fl * Math.PI);
      tail = -45 * Math.sin(fl * Math.PI * 1.2);
      p.face = { name: 'cool' };
    } else {
      const k = Math.sin(land * Math.PI);
      p.sy = 1 - 0.12 * k; p.sx = 1 + 0.06 * k; p.bodyY += 24 * k;
      p.armL = p.armR = lerp(160, 8, ease.out(land));
      tail = 28 * Math.sin(land * Math.PI * 2) * (1 - land);
      p.face = { name: 'cool' };
    }
  } else {
    const k = ease.outBack(inv(4.95, 5.2, t));
    p.armR = lerp(8, 152, k); p.turn = -0.2 * k;
    p.face = { name: 'smirk', mouth: viseme(t) || 'smirk', fx: t > 5.0 && t < 5.5 ? ['sparkles'] : [] };
    tail += 8 * Math.sin(inv(4.95, 5.3, t) * Math.PI);
  }
  p.tail = tail;
  return p;
}

function frame(t) {
  const p = novaAt(t);
  const zoom = 1 + 0.12 * ease.inOut(inv(1.3, 1.7, t)) * (1 - ease.inOut(inv(3.3, 3.6, t)));
  const fx = 960, fy = 560;
  let o = S.g(BG + drawNova(p), `translate(${fx} ${fy}) scale(${f(zoom)}) translate(${-fx} ${-fy})`);
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vig)' });
  return o + caption(t);
}

if (require.main === module) {
  const out = process.argv[2] || path.join(__dirname, '..', 'concept', 'nova_test.mp4');
  renderVideo(frame, { w: W, h: H, fps: Number(process.argv[3] || 60), duration: 6.4, out }).catch((e) => { console.error(e); process.exit(1); });
}
module.exports = { frame };
