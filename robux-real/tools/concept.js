// Concept sheets for the Robux video cast. Usage: node tools/concept.js [lineup|expr|all]
'use strict';
const path = require('path');
const fs = require('fs');
const S = require('../rig/svg');
const ST = require('../rig/style');
const { draw, NAMES } = require('../rig/cast');
const { openRenderer } = require('./render');
const OUT = path.join(__dirname, '..', 'concept');

const T = (s, x, y, size, fill = '#1d2433', extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
function bg(w, h, title, sub) {
  let o = `<defs><linearGradient id="cbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6E0"/><stop offset="1" stop-color="#FFE3B8"/></linearGradient></defs>`;
  o += S.rect(0, 0, w, h, 0, { fill: 'url(#cbg)' });
  for (let x = 0; x < w; x += 80) o += S.path(`M${x} 0 L${x} ${h}`, { stroke: '#F4D9A8', 'stroke-width': 2 });
  for (let y = 0; y < h; y += 80) o += S.path(`M0 ${y} L${w} ${y}`, { stroke: '#F4D9A8', 'stroke-width': 2 });
  o += T(title, w / 2, 96, 76, '#2A1640') + T(sub, w / 2, 150, 34, '#7A5A8A', { 'font-family': 'Fredoka, sans-serif', 'font-weight': 600 });
  return o;
}
const SHEETS = {
  lineup: {
    file: 'cast_lineup.png', w: 3000, h: 1500,
    draw() {
      let o = bg(3000, 1500, 'WHAT IF ROBUX BECAME REAL MONEY? — CAST', 'new characters · soft "vinyl toy" volume · light from top-left');
      const G = 1380;
      o += S.rect(0, G, 3000, 120, 0, { fill: '#F2C98A' });
      const items = [
        ['grandma', { face: { name: 'happy' }, armR: 130, turn: 0.2 }, 'NanaBea'],
        ['dad', { face: { name: 'neutral' }, armL: 20, turn: 0.2 }, 'Dad'],
        ['mom', { face: { name: 'happy' }, turn: 0.15 }, 'Mom'],
        ['mia', { face: { name: 'neutral' }, turn: 0.3, armR: 26 }, 'Mia'],
        ['ty', { face: { name: 'excited' }, armR: 150, armL: 20 }, 'TY'],
        ['pickle', { face: { name: 'happy' }, turn: -0.2, armL: 60 }, 'Pickle'],
        ['thirty', { face: { name: 'smug' }, turn: -0.2, armR: 40 }, '30% Guy'],
        ['anchor', { face: { name: 'happy' }, turn: -0.2 }, 'Chip (news)'],
        ['scammer', { face: { mouth: 'D' }, turn: -0.1 }, 'FreeRobux4U'],
        ['butler', { face: { name: 'happy' }, turn: -0.15 }, 'Jeeves 3000'],
      ];
      items.forEach(([k, pose, label], i) => {
        const x = 170 + i * 295;
        o += draw[k]({ x, y: G, s: 0.62, shade: true, shadow: true, ...pose });
        o += T(label, x, G + 80, 40, '#2A1640');
      });
      return o;
    },
  },
  expr: {
    file: 'cast_expressions.png', w: 3000, h: 1600,
    draw() {
      let o = bg(3000, 1600, 'TY · MIA · PICKLE — EXPRESSIONS', 'faces swap on every beat');
      const names = ['neutral', 'happy', 'excited', 'shocked', 'scared', 'angry', 'sad', 'smug', 'love', 'deadpan'];
      ['ty', 'mia', 'pickle'].forEach((k, r) => {
        names.forEach((n, i) => {
          const x = 170 + i * 290, y = 640 + r * 460;
          o += S.g(draw[k]({ x: 0, y: 0, s: 1, shade: true, face: { name: n } }), `translate(${x} ${y}) scale(0.55) translate(0 600)`, { 'clip-path': 'none' });
          if (r === 0) o += T(n, x, 250, 30, '#7A5A8A');
        });
      });
      return o;
    },
  },
};
async function main() {
  const which = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2].split(',') : Object.keys(SHEETS);
  fs.mkdirSync(OUT, { recursive: true });
  for (const name of which) {
    const sh = SHEETS[name];
    const r = await openRenderer(sh.w, sh.h);
    S.resetIds();
    fs.writeFileSync(path.join(OUT, sh.file), await r.render(ST.DEFS + sh.draw()));
    await r.close();
    console.log('wrote', sh.file);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
