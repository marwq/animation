// Concept sheets for NOVA + key art of the flowers scene.
// Usage: node tools/nova_sheets.js [all|turnaround|expressions|poses|keyart]
'use strict';

const path = require('path');
const fs = require('fs');
const S = require('../rig/svg');
const { drawNova, headFront, under } = require('../rig/nova');
const { drawHero } = require('../rig/hero');
const { egg, bouquet } = require('../rig/props');
const { gridBg, label, title } = require('./sheets');
const { openRenderer } = require('./render');

const OUT = path.join(__dirname, '..', 'concept');

const SHEETS = {
  turnaround: {
    w: 2560, h: 1440,
    draw() {
      const G = 1340, s = 0.95;
      let o = gridBg(2560, 1440) + title('NOVA — TURNAROUND', 'red & black · half-moon shades · high ponytail · red high-tops', 2560);
      o += S.path(`M0 ${G} L2560 ${G}`, { stroke: '#9fb4d0', 'stroke-width': 4 });
      [['FRONT', {}], ['3/4', { turn: 1 }], ['SIDE', { view: 'side' }], ['BACK', { view: 'back' }]].forEach(([n, v], i) => {
        const x = 330 + i * 620;
        o += drawNova({ x, y: G, s, nametag: 'Nova', ...v });
        o += label(n, x, 200, 46);
      });
      return o;
    },
  },

  expressions: {
    w: 2560, h: 1560,
    draw() {
      let o = gridBg(2560, 1560) + title('NOVA — EXPRESSIONS', 'eyes look over the shades · brows sit above · ponytail swings separately', 2560);
      const items = [
        ['cool (default)', 'cool'], ['smirk', 'smirk'], ['teasing', 'teasing'], ['wink', 'wink'], ['grin', 'grin'], ['laugh', 'laugh'],
        ['focused', 'focused'], ['unimpressed', 'unimpressed'], ['shocked', 'shocked'], ['scared', 'scared'], ['angry', 'angry'], ['shout', 'shout'],
        ['blushing', 'blushing'], ['soft smile', 'softSmile'],
        ['shades: half (default)', { name: 'cool' }], ['shades: slipping', { name: 'smirk', glassesDy: 18 }], ['shades: pushed up', { name: 'cool', glasses: 'up' }], ['shades: off', { name: 'grin', glasses: 'off' }],
      ];
      const cols = 6, cw = 410, ch = 430, x0 = 250, y0 = 210;
      items.forEach(([n, face], i) => {
        const cx = x0 + (i % cols) * cw, cy = y0 + Math.floor(i / cols) * ch;
        const f2 = typeof face === 'string' ? { name: face } : face;
        o += S.g(under(f2, 0, true, 'front') + headFront(f2, 0, true), `translate(${cx - 25} ${cy + 150}) scale(0.62) translate(0 757)`);
        o += label(n, cx, cy + 330, 30, 'middle', i >= 14 ? '#C2304F' : '#1d2433');
      });
      return o;
    },
  },

  poses: {
    w: 2560, h: 1880,
    draw() {
      let o = gridBg(2560, 1880) + title('NOVA — POSES', 'same R6 rig as YOU · ponytail has its own swing', 2560);
      const s = 0.62;
      const eggs = [0, 1, 2].map((k) => ({ svg: egg({ x: (k - 1) * 6, y: -1022 - k * 142, size: 152, rarity: ['legendary', 'epic', 'rare'][k], rot: (k - 1) * 6, glow: false }), layer: 'front' }));
      const items = [
        ['cool idle', { nametag: 'Nova' }],
        ['peace & wink', { armR: 158, armL: 6, face: 'wink', tail: 8, headRot: 4 }],
        ['3 eggs. full speed.', { view: 'side', legL: 34, legR: -30, armL: -44, armR: 46, lean: -9, lift: 22, face: 'focused', tail: 22, props: eggs }],
        ['backflip', { rot: -160, lift: 120, armL: 165, armR: 165, legL: 14, legR: -6, face: 'cool', tail: -35 }],
        ['"Talk less. Run more."', { turn: -0.55, face: 'unimpressed', armR: 14, armL: 4, headRot: 3 }],
        ['shades slipping', { armL: 66, armR: 66, lift: 24, sy: 1.05, face: { name: 'shocked', glassesDy: 20 }, tail: -12 }],
        ['laugh', { face: 'laugh', armL: 26, armR: 26, headRot: -7, tail: 14, bodyY: 8 }],
        ['takes the flowers', { turn: -0.6, face: 'smirk', armR: -38, props: [{ svg: bouquet({ x: -66, y: -300, size: 250, rot: -14 }), layer: 'front' }] }],
      ];
      items.forEach(([n, pz], i) => {
        const col = i % 4, row = Math.floor(i / 4);
        const x = 330 + col * 640, G = row ? 1760 : 1000;
        o += drawNova({ x, y: G, s, ...pz });
        o += label(n, x, G + 62, 34);
      });
      return o;
    },
  },

  keyart: {
    w: 1920, h: 1080,
    draw() {
      let o = `<defs><linearGradient id="sunset" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#5B3C88"/><stop offset="0.45" stop-color="#E9677A"/><stop offset="0.8" stop-color="#FFB36B"/><stop offset="1" stop-color="#FFD98A"/></linearGradient>
        <radialGradient id="sunglow"><stop offset="0" stop-color="#FFF1B0" stop-opacity="0.9"/><stop offset="1" stop-color="#FFF1B0" stop-opacity="0"/></radialGradient>
        <radialGradient id="vig2" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#2a0f2a" stop-opacity="0.35"/></radialGradient></defs>`;
      o += S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#sunset)' });
      o += S.circle(960, 640, 420, { fill: 'url(#sunglow)' });
      o += S.rect(870, 560, 180, 180, 18, { fill: '#FFE06B', stroke: '#F0A93A', 'stroke-width': 8 });
      // distant blocky skyline
      let sky = '';
      const xs = [[0, 700, 160], [150, 660, 120], [300, 720, 180], [520, 640, 140], [1250, 650, 150], [1420, 690, 200], [1640, 630, 120], [1780, 700, 160]];
      for (const [x, y, w] of xs) sky += S.rect(x, y, w, 500, 6, { fill: '#7B4A86', opacity: 0.75 });
      o += sky;
      // roof of Nova's base
      o += S.rect(-20, 900, 1960, 200, 0, { fill: '#3B2A4A' });
      o += S.rect(-20, 900, 1960, 26, 0, { fill: '#58406B' });
      o += S.path('M-20 900 L1940 900', { stroke: '#151515', 'stroke-width': 7 });
      // floating hearts
      const heart = (x, y, sz, a) => S.path(require('../rig/face').heartPath(x, y, sz), { fill: '#FF5A7A', stroke: '#151515', 'stroke-width': 5, opacity: a });
      o += heart(960, 300, 30, 0.9) + heart(1040, 230, 20, 0.75) + heart(880, 200, 16, 0.6);
      // YOU offering the flowers (blushing)
      o += drawHero({
        x: 720, y: 960, s: 0.74, turn: 0.6, armR: 64, armL: 6, bodyY: 10, lean: 4, headRot: 4, dimFar: false,
        face: { name: 'nervous', mouth: 'wavy', eyes: { look: [0.9, 0.1], pupil: 0.8, cross: 0 }, fx: ['redface', 'steam', 'sweat'] },
        nametag: 'YOU', props: [{ svg: bouquet({ x: 330, y: -360, size: 260, rot: 24 }), layer: 'top' }],
      });
      // NOVA, cool smirk, reaching for them
      o += drawNova({ x: 1230, y: 960, s: 0.74, turn: -0.6, armL: 52, armR: 4, dimFar: false, face: { name: 'smirk', fx: [] }, tail: 6, nametag: 'Nova' });
      o += S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#vig2)' });
      o += S.g(S.el('text', { x: 0, y: 0, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': 92, fill: '#FF8FB0', stroke: '#151515', 'stroke-width': 16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', 'text-anchor': 'middle' }, 'Smooth... YOU.'), 'translate(960 1050)');
      return o;
    },
  },
};

async function main() {
  const which = process.argv[2] || 'all';
  const list = which === 'all' ? Object.keys(SHEETS) : which.split(',');
  for (const name of list) {
    const sh = SHEETS[name];
    const r = await openRenderer(sh.w, sh.h);
    S.resetIds();
    const out = path.join(OUT, name === 'keyart' ? 'keyart_flowers.png' : `nova_${name}.png`);
    fs.writeFileSync(out, await r.render(sh.draw()));
    await r.close();
    console.log('wrote', out);
  }
}
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
