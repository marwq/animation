// Concept sheets for the Shutdown video cast. Usage: node tools/concept.js [lineup|expr|turn|lag|crowd|all]
'use strict';
const path = require('path');
const fs = require('fs');
const S = require('../rig/svg');
const ST = require('../rig/style');
const { D, draw, NAMES } = require('../rig/cast');
const { openRenderer } = require('./render');
const OUT = path.join(__dirname, '..', 'concept');

const T = (s, x, y, size, fill = '#1d2433', extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
const TF = (s, x, y, size, fill = '#7A5A8A', extra = {}) => T(s, x, y, size, fill, { 'font-family': 'Fredoka, sans-serif', 'font-weight': 600, ...extra });
function bg(w, h, title, sub) {
  let o = `<defs><linearGradient id="cbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6E0"/><stop offset="1" stop-color="#FFE3B8"/></linearGradient></defs>`;
  o += S.rect(0, 0, w, h, 0, { fill: 'url(#cbg)' });
  let grid = '';
  for (let x = 0; x < w; x += 80) grid += `M${x} 0 L${x} ${h} `;
  for (let y = 0; y < h; y += 80) grid += `M0 ${y} L${w} ${y} `;
  o += S.path(grid, { stroke: '#F4D9A8', 'stroke-width': 2 });
  o += T(title, w / 2, 96, 76, '#2A1640') + TF(sub, w / 2, 150, 34);
  return o;
}
let clipN = 0;
const crop = (inner, x, y, w, h) => { const id = `ccrop${++clipN}`; return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/></clipPath>` + S.g(inner, null, { 'clip-path': `url(#${id})` }); };
const card = (x, y, w, h) => S.rect(x, y, w, h, 18, { fill: '#FFFFFF', opacity: 0.55, stroke: '#EBC992', 'stroke-width': 3 });
// head-and-shoulders of a rig character, head normalised to the same size whatever the character's height
function bust(k, pose, cx, cy, sc = 0.44) {
  const size = (D[k] && D[k].style.size) || 1;
  return S.g(draw[k]({ x: 0, y: 0, s: 1 / size, shadow: false, ...pose }), `translate(${cx} ${cy}) scale(${sc}) translate(0 1190)`);
}
const pill = (s, x, y) => S.rect(x - 92, y - 28, 184, 40, 20, { fill: '#2A1640', opacity: 0.85 }) + TF(s, x, y + 2, 26, '#FFFFFF');
const RIG = ['juno', 'dex', 'pip', 'grandpa', 'dad', 'mom', 'anchor', 'streamer', 'cashier', 'teacher'];

const SHEETS = {
  lineup: {
    file: 'cast_lineup.png', w: 3900, h: 1600,
    draw() {
      let o = bg(3900, 1600, 'WHAT IF ROBLOX SHUT DOWN FOREVER? — CAST', 'R6 cut-out rig · soft "vinyl toy" volume · light from top-left · every character new');
      const G = 1440;
      o += S.rect(0, G, 3900, 160, 0, { fill: '#F2C98A' }) + S.path(`M0 ${G} L3900 ${G}`, { stroke: '#E0B070', 'stroke-width': 4 });
      // the villain looms over everyone
      o += draw.lag({ x: 3420, y: 520, size: 1.05, t: 1.42, mood: 'hungry', mouth: 'D' });
      o += T('THE LAG', 3420, 850, 48, '#2A1640');
      const items = [
        ['grandpa', { face: 'happy', armR: 30, turn: 0.2, keysSwing: 8 }],
        ['dad', { face: 'neutral', armL: 20, turn: 0.2 }],
        ['mom', { face: 'happy', turn: 0.15 }],
        ['dex', { face: 'smug', turn: 0.25, armR: 24 }],
        ['juno', { face: 'excited', armR: 150, armL: 18 }],
        ['pip', { face: 'joy', turn: -0.2, armL: 160, armR: 12 }],
        ['anchor', { face: 'happy', turn: -0.2, armR: 20 }],
        ['streamer', { face: 'excited', turn: -0.2, armL: 70, armR: 150 }],
        ['cashier', { face: 'sleepy', turn: -0.15 }],
        ['teacher', { face: 'neutral', turn: -0.2, armR: 30 }],
      ];
      items.forEach(([k, pose], i) => {
        const x = 180 + i * 296;
        o += draw[k]({ x, y: G, s: 0.62, shade: true, shadow: true, ...pose });
        o += T(NAMES[k], x, G + 80, k === 'streamer' ? 30 : 40, '#2A1640');
      });
      o += draw.buffer({ x: 3190, y: G, s: 1.5, t: 0.3, mood: 'happy' }) + T('Buffer', 3190, G + 80, 40, '#2A1640');
      o += draw.modbot({ x: 3620, y: G, s: 0.62, t: 0.4, face: '!' }) + T('Modbot', 3620, G + 80, 40, '#2A1640');
      return o;
    },
  },
  expr: {
    file: 'cast_expressions.png', w: 3440, h: 2480,
    draw() {
      let o = bg(3440, 2480, 'JUNO · DEX · PIP · GRANDPA OTTO · DAD — EXPRESSIONS', 'eight faces each + side and back views · bottom row: Juno lip-sync visemes, Pip\'s missing tooth');
      const ex = ['neutral', 'happy', 'joy', 'excited', 'shocked', 'scared', 'angry', 'sad'];
      const cols = [...ex, 'side', 'back'];
      const CW = 310, X0 = 260, Y0 = 200, RH = 360;
      cols.forEach((n, i) => { o += TF(n, X0 + i * CW + CW / 2, Y0 + 26, 30); });
      ['juno', 'dex', 'pip', 'grandpa', 'dad'].forEach((k, r) => {
        const y = Y0 + 44 + r * RH;
        o += T(NAMES[k], 130, y + RH / 2, 40, '#2A1640');
        cols.forEach((n, i) => {
          const x = X0 + i * CW;
          const pose = n === 'side' ? { view: 'side', face: 'talkHappy' } : n === 'back' ? { view: 'back' } : { face: n, turn: i % 2 ? 0.18 : 0 };
          o += card(x + 8, y + 8, CW - 16, RH - 16) + crop(bust(k, pose, x + CW / 2, y + 22), x + 8, y + 8, CW - 16, RH - 16);
        });
      });
      // lip-sync row
      const y = Y0 + 44 + 5 * RH;
      o += T('visemes', 130, y + 180, 36, '#2A1640');
      const vis = ['X', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      vis.forEach((m, i) => {
        const x = X0 + i * CW;
        o += card(x + 8, y + 8, CW - 16, RH - 16) + crop(bust(i < 6 ? 'juno' : 'pip', { face: { name: 'talkHappy', mouth: m } }, x + CW / 2, y + 22), x + 8, y + 8, CW - 16, RH - 16);
        o += pill(`${i < 6 ? 'Juno' : 'Pip'} · ${m}`, x + CW / 2, y + RH - 22);
      });
      const x = X0 + 9 * CW;
      o += card(x + 8, y + 8, CW - 16, RH - 16) + crop(bust('pip', { face: { name: 'happy', mouth: 'teeth' } }, x + CW / 2, y + 22), x + 8, y + 8, CW - 16, RH - 16) + pill('Pip · teeth', x + CW / 2, y + RH - 22);
      return o;
    },
  },
  turn: {
    file: 'cast_turnaround.png', w: 3600, h: 3900,
    draw() {
      let o = bg(3600, 3900, 'TURNAROUND — EVERY RIG CHARACTER', 'front · turn +0.6 · turn −0.6 · side · side flipped · back   (dad also without his hat, grandpa with his 100 keys)');
      const views = [{}, { turn: 0.6 }, { turn: -0.6 }, { view: 'side' }, { view: 'side', flip: true }, { view: 'back' }];
      const list = [...RIG, 'dadNoHat'];
      const BW = 1780, VW = 285, BH = 610;
      list.forEach((k, i) => {
        const bx = 20 + (i % 2) * BW, by = 200 + Math.floor(i / 2) * BH;
        o += card(bx, by, BW - 20, BH - 20);
        o += T(k === 'dadNoHat' ? 'Dad (no hat)' : NAMES[k], bx + BW / 2 - 10, by + BH - 44, 38, '#2A1640');
        views.forEach((v, j) => { o += draw[k]({ x: bx + 160 + j * VW, y: by + BH - 110, s: 0.38, ...v }); });
      });
      return o;
    },
  },
  lag: {
    file: 'cast_lag.png', w: 3200, h: 2000,
    draw() {
      let o = S.rect(0, 0, 3200, 2000, 0, { fill: '#2A2340' });
      let grid = '';
      for (let x = 0; x < 3200; x += 80) grid += `M${x} 0 L${x} 2000 `;
      for (let y = 0; y < 2000; y += 80) grid += `M0 ${y} L3200 ${y} `;
      o += S.path(grid, { stroke: '#352D50', 'stroke-width': 2 });
      o += T('THE LAG · BUFFER · MODBOT', 1600, 96, 76, '#FFFFFF') + TF('lag({x,y,size,t,mouth,mood,glitch}) · buffer({x,y,s,t,mood,blink,hop}) · modbot({x,y,s,t,face,roll,alarm})', 1600, 150, 32, '#B9A8E0');
      const moods = ['neutral', 'hungry', 'angry', 'laugh', 'scared'];
      moods.forEach((m, i) => {
        o += draw.lag({ x: 330 + i * 635, y: 420, size: 1.0, t: 1.1 + i * 0.41, mood: m });
        o += TF(`mood: ${m}`, 330 + i * 635, 660, 32, '#FFFFFF');
      });
      const mouths = [['X', 0], ['B', 0], ['D', 0], ['O', 0.25], ['wail', 0.85]];
      mouths.forEach(([m, g], i) => {
        o += draw.lag({ x: 330 + i * 635, y: 900, size: 0.85, t: 2.3 + i * 0.7, mouth: m, glitch: g });
        o += TF(`mouth: ${m}${g ? ` · glitch ${g}` : ''}`, 330 + i * 635, 1110, 32, '#FFFFFF');
      });
      o += TF('sizes: 0.4 (≈150 px) · 0.7 · 1 (≈380 px) — 3 fills the frame', 620, 1230, 30, '#B9A8E0');
      [[0.4, 150], [0.7, 440], [1.0, 940]].forEach(([sz, x]) => { o += draw.lag({ x, y: 1500, size: sz, t: 0.7 + x * 0.01, mood: 'neutral' }); });
      o += TF('Buffer', 1660, 1230, 34, '#FFFFFF');
      ['happy', 'surprised', 'sad', 'sleepy', 'love', 'scared'].forEach((m, i) => {
        const x = 1460 + (i % 3) * 200, y = 1460 + Math.floor(i / 3) * 280;
        o += draw.buffer({ x, y, s: 1.45, t: 0.4 + i * 0.13, mood: m, hop: m === 'happy' ? 0.5 : 0 }) + TF(m, x, y + 46, 26, '#B9A8E0');
      });
      o += TF('Modbot', 2660, 1230, 34, '#FFFFFF');
      [['!', 1], ['?', 0], ['#', 0], ['ok', 0]].forEach(([fc, al], i) => {
        const x = 2240 + i * 280;
        o += draw.modbot({ x, y: 1880, s: 0.46, t: 0.35 + i, face: fc, alarm: al, roll: i * 40, lean: i === 1 ? 6 : 0 });
        o += TF(`face '${fc}'${al ? ' · alarm' : ''}`, x, 1960, 26, '#B9A8E0');
      });
      return o;
    },
  },
  crowd: {
    file: 'cast_crowd.png', w: 3400, h: 1500,
    draw() {
      let o = bg(3400, 1500, 'CROWDS — draw.kid(i, pose) · draw.adult(i, pose)', 'random designs from new hair styles, outfits, glasses and beards');
      const G1 = 760, G2 = 1400;
      for (let i = 0; i < 16; i++) o += draw.kid(i, { x: 120 + i * 205, y: G1, s: 0.5, face: ['happy', 'neutral', 'excited', 'shocked'][i % 4], turn: ((i % 5) - 2) * 0.15, view: i === 7 ? 'side' : i === 12 ? 'back' : 'front' });
      for (let i = 0; i < 13; i++) o += draw.adult(i, { x: 130 + i * 255, y: G2, s: 0.5, face: ['neutral', 'happy', 'shocked', 'sad'][i % 4], turn: ((i % 5) - 2) * 0.15, view: i === 4 ? 'side' : i === 9 ? 'back' : 'front' });
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
