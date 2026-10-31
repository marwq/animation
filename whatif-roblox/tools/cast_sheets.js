// Cast lineup + secondary characters' expressions.
// Usage: node tools/cast_sheets.js [all|lineup|expressions]
'use strict';

const path = require('path');
const fs = require('fs');
const S = require('../rig/svg');
const { drawHero } = require('../rig/hero');
const { drawNova } = require('../rig/nova');
const { draw, NAMES, DESIGNS } = require('../rig/cast');
const { chicken, chatBubble } = require('../rig/creatures');
const { gridBg, label, title } = require('./sheets');
const { openRenderer } = require('./render');

const OUT = path.join(__dirname, '..', 'concept');

const SHEETS = {
  lineup: {
    file: 'cast.png', w: 2560, h: 1440,
    draw() {
      let o = `<defs><linearGradient id="cbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FD3FF"/><stop offset="0.7" stop-color="#E3F6FF"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient></defs>`;
      o += S.rect(0, 0, 2560, 1440, 0, { fill: 'url(#cbg)' });
      for (let i = 0; i < 14; i++) o += S.path(`M1280 -200 L${f2(1280 + Math.cos((i / 14) * Math.PI) * 3000)} ${f2(-200 + Math.sin((i / 14) * Math.PI) * 3000)} L${f2(1280 + Math.cos(((i + 0.5) / 14) * Math.PI) * 3000)} ${f2(-200 + Math.sin(((i + 0.5) / 14) * Math.PI) * 3000)} Z`, { fill: '#FFFFFF', opacity: 0.18 });
      o += S.rect(0, 1240, 2560, 200, 0, { fill: '#62C95A' }) + S.path('M0 1240 L2560 1240', { stroke: '#3E9E3E', 'stroke-width': 6 });
      o += S.el('text', { x: 60, y: 100, 'font-family': 'Lilita One, sans-serif', 'font-size': 76, fill: '#1d2433' }, 'THE CAST');
      const G = 1250, s = 0.74;
      const row = [
        ['YOU', (p) => drawHero(p), { face: 'happy' }],
        ['Nova', (p) => drawNova(p), { face: 'smug', turn: -0.15 }],
        [NAMES.speedy, draw.speedy, { face: 'smug', armR: 150 }],
        [NAMES.egglord, draw.egglord, { turn: -0.2 }],
        [NAMES.pinky, draw.pinky, { face: 'happy', armL: 40, armR: 40 }],
        [NAMES.max, draw.max, { face: 'talkHappy', armR: 120 }],
        [NAMES.mom, draw.mom, { face: 'happy', turn: -0.1 }],
        [NAMES.dad, draw.dad, {}],
      ];
      row.forEach(([n, fn, pz], i) => { o += fn({ x: 170 + i * 300, y: G, s: 0.68, nametag: n, ...pz }); });
      o += chicken({ x: 2440, y: G, s: 0.56, look: -0.6 }) + chatBubble('bawk.', 2440, G - 290, { s: 0.7 });
      return o;
    },
  },

  expressions: {
    file: 'cast_expressions.png', w: 2560, h: 1860,
    draw() {
      let o = gridBg(2560, 1860) + title('SECONDARY CAST — EXPRESSIONS', 'dot eyes + stroke brows · same expression names as YOU and Nova', 2560);
      const keys = ['speedy', 'egglord', 'pinky', 'max', 'mom', 'dad'];
      const exprs = ['neutral', 'joy', 'shocked', 'angry', 'smug', 'scared'];
      keys.forEach((k, r) => {
        o += label(NAMES[k], 150, 330 + r * 265, 30, 'middle', '#1d2433');
        exprs.forEach((e, c) => {
          const cx = 470 + c * 340, cy = 205 + r * 265;
          o += S.g(DESIGNS[k].head(e, 0, true), `translate(${cx} ${cy + 120}) scale(0.4) translate(0 ${757 + 40})`);
          if (r === 0) o += label(e, cx, 190, 28, 'middle', '#5b6780', 600);
        });
      });
      return o;
    },
  },
};
const f2 = (n) => Math.round(n);

async function main() {
  const which = process.argv[2] || 'all';
  const list = which === 'all' ? Object.keys(SHEETS) : which.split(',');
  for (const name of list) {
    const sh = SHEETS[name];
    const r = await openRenderer(sh.w, sh.h);
    S.resetIds();
    const out = path.join(OUT, sh.file);
    fs.writeFileSync(out, await r.render(sh.draw()));
    await r.close();
    console.log('wrote', out);
  }
}
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
