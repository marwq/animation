// Concept sheets for NOVA, the knees sheet (both characters) and the flowers key art.
// Usage: node tools/nova_sheets.js [all|turnaround|expressions|poses|knees|keyart]
'use strict';

const path = require('path');
const fs = require('fs');
const S = require('../rig/svg');
const { drawNova, headFront } = require('../rig/nova');
const { drawHero } = require('../rig/hero');
const { egg, bouquet } = require('../rig/props');
const { heartPath } = require('../rig/face');
const { gridBg, label, title } = require('./sheets');
const { openRenderer } = require('./render');

const OUT = path.join(__dirname, '..', 'concept');
const block = (x, y, w, h, s) => S.rect(x, y - h * s, w * s, h * s, 10 * s, { fill: '#B9C4D6', stroke: '#151515', 'stroke-width': 6 * s });

const SHEETS = {
  turnaround: {
    file: 'nova_turnaround.png', w: 2560, h: 1440,
    draw() {
      const G = 1340, s = 0.95;
      let o = gridBg(2560, 1440) + title('NOVA — TURNAROUND', 'same build as YOU · lashes · black bob · half-moon shades · red & black', 2560);
      o += S.path(`M0 ${G} L2560 ${G}`, { stroke: '#9fb4d0', 'stroke-width': 4 });
      [['FRONT', {}], ['3/4', { turn: 1 }], ['SIDE', { view: 'side' }], ['BACK', { view: 'back' }]].forEach(([n, v], i) => {
        const x = 360 + i * 620;
        o += drawNova({ x, y: G, s, nametag: 'Nova', ...v });
        o += label(n, x, 200, 46);
      });
      return o;
    },
  },

  expressions: {
    file: 'nova_expressions.png', w: 2560, h: 1700,
    draw() {
      let o = gridBg(2560, 1700) + title('NOVA — EXPRESSIONS', 'same face system as YOU (fringe notch = brows) + lashes · shades are a separate layer', 2560);
      const names = ['neutral', 'happy', 'talkHappy', 'joy', 'excited', 'amazed', 'shocked', 'scared', 'scream', 'angry',
        'determined', 'sad', 'crying', 'smug', 'deadpan', 'nervous', 'confused', 'sneaky', 'love', 'cute'];
      const items = names.map((n) => [n, { name: n }]);
      items.push(['no shades: neutral', { name: 'neutral', glasses: false }], ['no shades: smug', { name: 'smug', glasses: false }],
        ['no shades: happy', { name: 'happy', glasses: false }], ['shades slipping', { name: 'shocked', glassesDy: 18 }]);
      const cols = 6, cw = 410, ch = 370, x0 = 250, y0 = 200;
      items.forEach(([n, face], i) => {
        const cx = x0 + (i % cols) * cw, cy = y0 + Math.floor(i / cols) * ch;
        o += S.g(headFront(face, 0, true), `translate(${cx} ${cy + 130}) scale(0.56) translate(0 757)`);
        o += label(n, cx, cy + 290, 30, 'middle', i >= 20 ? '#C2304F' : '#1d2433');
      });
      return o;
    },
  },

  poses: {
    file: 'nova_poses.png', w: 2560, h: 1800,
    draw() {
      let o = gridBg(2560, 1800) + title('NOVA — POSES', 'same rig as YOU, now with knees', 2560);
      const s = 0.62;
      const eggs = [0, 1, 2].map((k) => ({ svg: egg({ x: (k - 1) * 6, y: -1022 - k * 142, size: 152, rarity: ['legendary', 'epic', 'rare'][k], rot: (k - 1) * 6, glow: false }), layer: 'front' }));
      const items = [
        ['idle', { nametag: 'Nova' }],
        ['hi!', { armR: 152, armL: 6, face: 'happy', turn: -0.25, headRot: -4 }],
        ['3 eggs. full speed.', { view: 'side', legL: 44, kneeL: 30, legR: -24, kneeR: 92, armL: -44, armR: 46, lean: -9, lift: 30, face: 'determined', props: eggs }],
        ['jump!', { armL: 160, armR: 160, face: 'joy', lift: 110, legL: 26, legR: 26, kneeL: 52, kneeR: 52 }],
        ['"Talk less. Run more."', { turn: -0.55, face: 'smug', armR: 14, armL: 4, headRot: 3 }],
        ['shades slipping', { armL: 66, armR: 66, lift: 24, sy: 1.05, face: { name: 'shocked', glassesDy: 18 } }],
        ['ready... set...', { view: 'side', bodyY: 64, lean: 18, legL: 26, legR: -30, armL: -34, armR: 36, face: 'determined' }],
        ['takes the flowers', { turn: -0.6, face: 'smug', armR: -38, props: [{ svg: bouquet({ x: -66, y: -300, size: 250, rot: -14 }), layer: 'front' }] }],
      ];
      items.forEach(([n, pz], i) => {
        const col = i % 4, row = Math.floor(i / 4);
        const x = 330 + col * 640, G = row ? 1680 : 940;
        o += drawNova({ x, y: G, s, ...pz });
        o += label(n, x, G + 62, 34);
      });
      return o;
    },
  },

  knees: {
    file: 'knees.png', w: 2560, h: 1840,
    draw() {
      let o = gridBg(2560, 1840) + title('KNEES', 'thigh + shin with a real knee joint · feet stay planted automatically when the body goes down', 2560);
      const s = 0.62;
      const rows = [
        [
          ['crouch (auto)', drawHero, { bodyY: 80, lean: 4, armL: 30, armR: 30, face: 'sneaky' }],
          ['sit', drawHero, { view: 'side', bodyY: 186, legL: 90, kneeL: 90, legR: 88, kneeR: 88, armL: 30, armR: 24, face: 'happy' }, (x, G) => block(x - 40 * s, G, 190, 125, s)],
          ['walk', drawHero, { view: 'side', legL: 22, kneeL: 12, legR: -18, kneeR: 38, armL: -24, armR: 24, lean: -3, face: 'happy' }],
          ['run', drawHero, { view: 'side', legL: 44, kneeL: 30, legR: -24, kneeR: 92, armL: -44, armR: 46, lean: -9, lift: 30, face: 'scream' }],
        ],
        [
          ['crouch (auto)', drawNova, { bodyY: 80, lean: 4, armL: 30, armR: 30, face: 'sneaky' }],
          ['sit', drawNova, { view: 'side', bodyY: 186, legL: 90, kneeL: 90, legR: 88, kneeR: 88, armL: 30, armR: 24, face: 'smug' }, (x, G) => block(x - 40 * s, G, 190, 125, s)],
          ['jump tuck', drawNova, { armL: 160, armR: 160, face: 'joy', lift: 100, legL: 26, legR: 26, kneeL: 52, kneeR: 52 }],
          ['run', drawNova, { view: 'side', legL: 44, kneeL: 30, legR: -24, kneeR: 92, armL: -44, armR: 46, lean: -9, lift: 30, face: 'determined' }],
        ],
      ];
      rows.forEach((row, r) => row.forEach(([n, fn, pz, under], i) => {
        const x = 330 + i * 640, G = r ? 1730 : 900;
        if (under) o += under(x, G);
        o += fn({ x, y: G, s, ...pz });
        o += label(n, x, G + 62, 34);
      }));
      return o;
    },
  },

  keyart: {
    file: 'keyart_flowers.png', w: 1920, h: 1080,
    draw() {
      let o = `<defs><linearGradient id="sunset" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#5B3C88"/><stop offset="0.45" stop-color="#E9677A"/><stop offset="0.8" stop-color="#FFB36B"/><stop offset="1" stop-color="#FFD98A"/></linearGradient>
        <radialGradient id="sunglow"><stop offset="0" stop-color="#FFF1B0" stop-opacity="0.9"/><stop offset="1" stop-color="#FFF1B0" stop-opacity="0"/></radialGradient>
        <radialGradient id="vig2" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#2a0f2a" stop-opacity="0.35"/></radialGradient></defs>`;
      o += S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#sunset)' });
      o += S.circle(960, 640, 420, { fill: 'url(#sunglow)' });
      o += S.rect(870, 560, 180, 180, 18, { fill: '#FFE06B', stroke: '#F0A93A', 'stroke-width': 8 });
      for (const [x, y, w] of [[0, 700, 160], [150, 660, 120], [300, 720, 180], [520, 640, 140], [1250, 650, 150], [1420, 690, 200], [1640, 630, 120], [1780, 700, 160]]) o += S.rect(x, y, w, 500, 6, { fill: '#7B4A86', opacity: 0.75 });
      o += S.rect(-20, 900, 1960, 200, 0, { fill: '#3B2A4A' }) + S.rect(-20, 900, 1960, 26, 0, { fill: '#58406B' }) + S.path('M-20 900 L1940 900', { stroke: '#151515', 'stroke-width': 7 });
      const heart = (x, y, sz, a) => S.path(heartPath(x, y, sz), { fill: '#FF5A7A', stroke: '#151515', 'stroke-width': 5, opacity: a });
      o += heart(960, 300, 30, 0.9) + heart(1040, 230, 20, 0.75) + heart(880, 200, 16, 0.6);
      o += drawHero({
        x: 720, y: 960, s: 0.74, turn: 0.6, armR: 64, armL: 6, bodyY: 10, lean: 4, headRot: 4, dimFar: false,
        face: { name: 'nervous', mouth: 'wavy', eyes: { look: [0.9, 0.1], pupil: 0.8, cross: 0 }, fx: ['redface', 'steam', 'sweat'] },
        nametag: 'YOU', props: [{ svg: bouquet({ x: 330, y: -360, size: 260, rot: 24 }), layer: 'top' }],
      });
      o += drawNova({ x: 1230, y: 960, s: 0.74, turn: -0.6, armL: 52, armR: 4, dimFar: false, headRot: -3, face: { name: 'smug', mouth: 'smirk', eyes: { upper: 0.2, tilt: -4, look: [-0.75, -0.4] } }, nametag: 'Nova' });
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
    const out = path.join(OUT, sh.file);
    fs.writeFileSync(out, await r.render(sh.draw()));
    await r.close();
    console.log('wrote', out);
  }
}
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
