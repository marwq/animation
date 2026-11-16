// Concept sheets for the "What If You Had ADMIN COMMANDS in Real Life?" cast.
// Usage: node tools/concept.js [lineup|expr|turn|cats|crowd|all]   -> concept/*.png
'use strict';
const path = require('path');
const fs = require('fs');
const S = require('../rig/svg');
const ST = require('../rig/style');
const { D, draw, NAMES, zoeLaptop, stickyNote, coffeeMug, fireTrail } = require('../rig/cast');
const CATS = require('../rig/cats');
const { openRenderer } = require('./render');
const OUT = path.join(__dirname, '..', 'concept');

const T = (s, x, y, size, fill = '#1d2433', extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
const TF = (s, x, y, size, fill = '#7A5A8A', extra = {}) => T(s, x, y, size, fill, { 'font-family': 'Fredoka, sans-serif', 'font-weight': 600, ...extra });
const INK = '#2A1640';
function bg(w, h, title, sub, dark = false) {
  const id = `cbg${w}x${h}`;
  let o = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${dark ? '<stop offset="0" stop-color="#2A2350"/><stop offset="1" stop-color="#3D2A5C"/>' : '<stop offset="0" stop-color="#FFF6E0"/><stop offset="1" stop-color="#FFE3B8"/>'}</linearGradient></defs>`;
  o += S.rect(0, 0, w, h, 0, { fill: `url(#${id})` });
  let grid = '';
  for (let x = 0; x < w; x += 80) grid += `M${x} 0 L${x} ${h} `;
  for (let y = 0; y < h; y += 80) grid += `M0 ${y} L${w} ${y} `;
  o += S.path(grid, { stroke: dark ? '#3A3266' : '#F4D9A8', 'stroke-width': 2 });
  o += T(title, w / 2, 96, 76, dark ? '#FFFFFF' : INK) + TF(sub, w / 2, 150, 34, dark ? '#C9B8F0' : '#7A5A8A');
  return o;
}
let clipN = 0;
const crop = (inner, x, y, w, h) => { const id = `ccrop${++clipN}`; return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/></clipPath>` + S.g(inner, null, { 'clip-path': `url(#${id})` }); };
const card = (x, y, w, h, fill = '#FFFFFF', op = 0.55) => S.rect(x, y, w, h, 18, { fill, opacity: op, stroke: '#EBC992', 'stroke-width': 3 });
// head-and-shoulders of a rig character, head normalised to the same size whatever the character's height
function bust(k, pose, cx, cy, sc = 0.5) {
  const size = (D[k] && D[k].dims.size) || 1;
  return S.g(draw[k]({ x: 0, y: 0, s: 1 / size, shadow: false, t: 1.3, ...pose }), `translate(${cx} ${cy}) scale(${sc}) translate(0 1112)`);
}
const pill = (s, x, y, w = 184) => S.rect(x - w / 2, y - 28, w, 40, 20, { fill: INK, opacity: 0.85 }) + TF(s, x, y + 2, 26, '#FFFFFF');
const RIG = ['you', 'zoe', 'brick', 'dad', 'mom', 'granny', 'oldman', 'admin', 'anchor', 'boss', 'principal', 'coach'];
// a few city blocks for scale
function skyline(x0, x1, G, col = '#C9A97A', win = '#FFE9A8') {
  let o = '', w = '';
  let x = x0, i = 0;
  while (x < x1) {
    const bw = 150 + ((i * 53) % 90), bh = 260 + ((i * 97) % 300);
    o += S.rect(x, G - bh, bw, bh, 6, { fill: col, stroke: '#9A7A52', 'stroke-width': 4 });
    for (let yy = G - bh + 30; yy < G - 40; yy += 56) for (let xx = x + 22; xx < x + bw - 30; xx += 44) w += `M${xx} ${yy} h20 v28 h-20 Z `;
    x += bw + 18; i++;
  }
  return o + S.path(w, { fill: win, opacity: 0.8 });
}

const SHEETS = {
  // ------------------------------------------------------------------ lineup at real relative size
  lineup: {
    file: 'cast_lineup.png', w: 4800, h: 1900,
    draw() {
      let o = bg(4800, 1900, 'WHAT IF YOU HAD ADMIN COMMANDS IN REAL LIFE? — CAST', 'R6 cut-out rig · vinyl volume · everyone at the same scale (s 0.62) · Pancake and the cats are non-rig (rig/cats.js)');
      const G = 1640, s = 0.62;
      // the giant cat looms in from the right edge, behind everyone
      o += S.g(skyline(3880, 4800, G, '#E8CFA6', '#FFF4D0'), null, { opacity: 0.8 });
      o += CATS.cat({ x: 4650, y: G + 40, s: 6.2, coat: 'calico', pose: 'sit', mood: 'happy', seed: 2, t: 0.4, shadow: false });
      o += S.rect(0, G, 4800, 260, 0, { fill: '#F2C98A' }) + S.path(`M0 ${G} L4800 ${G}`, { stroke: '#E0B070', 'stroke-width': 4 });
      o += S.rect(4150, 1780, 620, 64, 22, { fill: INK, opacity: 0.85 }) + TF('a giant city cat (size ×100 — only part of it fits)', 4460, 1822, 28, '#FFFFFF');
      const items = [
        ['you', 230, { face: 'happy', armR: 150, armL: 14 }],
        ['zoe', 520, { face: 'smug', laptop: true, turn: -0.1 }],
        ['brick', 860, { face: 'angry', armL: 24, armR: 30, turn: 0.12 }],
        ['dad', 1220, { face: 'talkHappy', armR: 40, turn: 0.15 }],
        ['mom', 1540, { face: 'determined', notes: 'CLEAN!', armR: 48, turn: 0.1 }],
        ['granny', 1840, { face: 'happy', turn: 0.15 }],
        ['oldman', 2100, { face: 'sneaky', turn: -0.15 }],
        ['admin', 2720, { face: 'angry', glow: 0.75, armL: 30, armR: 30, t: 0.8 }],
        ['anchor', 3130, { face: 'happy', turn: -0.15, armR: 28 }],
        ['boss', 3410, { face: 'deadpan', turn: -0.1 }],
        ['principal', 3690, { face: 'determined', turn: -0.15, armL: 34 }],
        ['coach', 3960, { face: 'determined', turn: -0.2, whistle: 'mouth', armR: 20 }],
      ];
      for (const [k, x, pose] of items) {
        o += draw[k]({ x, y: G, s, shade: true, shadow: true, t: 0.8, ...pose });
        if (k === 'you') {
          o += S.rect(x - 130, G + 30, 260, 90, 30, { fill: '#D8262E', stroke: '#151515', 'stroke-width': 6 }) + T('YOU', x, G + 98, 72, '#FFFFFF', { stroke: '#151515', 'stroke-width': 8, 'paint-order': 'stroke' });
          o += TF('the hero · on model', x, G + 160, 30, INK);
        } else {
          o += T(NAMES[k], x, G + 84, NAMES[k].length > 11 ? 34 : 42, INK);
          o += TF(`size ${D[k].dims.size}`, x, G + 124, 26, '#9A7A8A');
        }
      }
      o += CATS.pancake({ x: 2350, y: G, s, pose: 'sit', mood: 'smug', t: 0.5 });
      o += T('Pancake', 2350, G + 84, 42, INK) + TF('the cat', 2350, G + 124, 26, '#9A7A8A');
      return o;
    },
  },

  // ------------------------------------------------------------------ expressions + side/back
  expr: {
    file: 'cast_expressions.png', w: 3520, h: 2920,
    draw() {
      let o = bg(3520, 2920, 'YOU · ZOE · BRICK · GRANNY · OLD MAN · ADMIN — EXPRESSIONS', 'eight faces each + side and back views · bottom: YOU lip-sync visemes, the ADMIN talking (light pulses, no mouth)');
      const CW = 316, X0 = 250, Y0 = 186, RH = 380;
      const rows = {
        you: ['neutral', 'happy', 'joy', 'excited', 'shocked', 'scared', 'angry', 'sad'],
        zoe: ['neutral', 'smug', 'deadpan', 'happy', 'confused', 'shocked', 'angry', 'nervous'],
        brick: ['neutral', 'smug', 'angry', 'determined', 'shocked', 'scared', 'sad', { name: 'sad', label: 'shy', eyes: { look: [0.6, 0.6] }, fx: ['blush', 'sweat'], mouth: 'wavy' }],
        granny: ['neutral', 'happy', 'joy', 'sleepy', 'determined', 'excited', 'shocked', 'love'],
        oldman: ['neutral', 'sneaky', 'happy', 'smug', 'amazed', 'confused', 'sad', 'joy'],
        admin: ['neutral', 'angry', 'determined', 'shocked', 'smug', 'happy', 'sad', 'confused'],
      };
      Object.entries(rows).forEach(([k, faces], r) => {
        const y = Y0 + r * RH;
        o += T(NAMES[k], 125, y + RH / 2 - 10, 42, INK);
        const cols = [...faces, 'side', 'back'];
        cols.forEach((n, i) => {
          const x = X0 + i * CW;
          const label = typeof n === 'string' ? n : n.label;
          const face = typeof n === 'string' ? n : { name: n.name, eyes: n.eyes, fx: n.fx, mouth: n.mouth };
          const pose = n === 'side' ? { view: 'side', face: 'talkHappy' } : n === 'back' ? { view: 'back' } : { face, turn: i % 2 ? 0.16 : 0, glow: 0.3 };
          o += card(x + 8, y + 8, CW - 16, RH - 16) + crop(bust(k, pose, x + CW / 2, y + 12, 0.5), x + 8, y + 8, CW - 16, RH - 16);
          o += pill(label, x + CW / 2, y + RH - 24, 160);
        });
      });
      // lip-sync row
      const y = Y0 + 6 * RH;
      o += T('lip-sync', 125, y + 160, 40, INK);
      const vis = ['X', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      vis.forEach((m, i) => {
        const x = X0 + i * CW;
        o += card(x + 8, y + 8, CW - 16, RH - 16) + crop(bust('you', { face: { name: 'talkHappy', mouth: m } }, x + CW / 2, y + 12, 0.5), x + 8, y + 8, CW - 16, RH - 16);
        o += pill(`You · ${m}`, x + CW / 2, y + RH - 24, 160);
      });
      const x = X0 + 9 * CW;
      o += card(x + 8, y + 8, CW - 16, RH - 16) + crop(bust('admin', { face: { name: 'angry', mouth: 'D' }, glow: 0.5 }, x + CW / 2, y + 12, 0.5), x + 8, y + 8, CW - 16, RH - 16) + pill('ADMIN · speaking', x + CW / 2, y + RH - 24, 200);
      return o;
    },
  },

  // ------------------------------------------------------------------ turnaround
  turn: {
    file: 'cast_turnaround.png', w: 3600, h: 5000,
    draw() {
      let o = bg(3600, 5000, 'TURNAROUND — EVERY RIG CHARACTER', 'front · turn +0.6 · turn −0.6 · side · side flipped · back   (bottom: options and props)');
      const views = [{}, { turn: 0.6 }, { turn: -0.6 }, { view: 'side' }, { view: 'side', flip: true }, { view: 'back' }];
      const BW = 1780, VW = 280, BH = 640;
      RIG.forEach((k, i) => {
        const bx = 20 + (i % 2) * BW, by = 190 + Math.floor(i / 2) * BH;
        o += card(bx, by, BW - 20, BH - 20);
        o += T(NAMES[k], bx + BW / 2 - 10, by + BH - 44, 38, INK);
        const s = k === 'admin' ? 0.3 : k === 'brick' ? 0.34 : 0.4;
        views.forEach((v, j) => { o += draw[k]({ x: bx + 170 + j * VW, y: by + BH - 100, s, t: 0.6, glow: 0.35, face: v.view === 'back' ? 'neutral' : 'happy', ...v }); });
      });
      // options row
      const by = 190 + 6 * BH, bx = 20;
      o += card(bx, by, 3540, 620);
      const G = by + 520, s = 0.4;
      const opts = [
        ['dad', { headset: false, face: 'happy' }, "dad · headset: false"],
        ['dad', { view: 'side', face: 'scream', lift: 60, armL: 160, armR: 140, legL: 20, kneeL: 40 }, 'dad · flying'],
        ['zoe', { laptop: true, face: 'smug' }, 'zoe · laptop: true'],
        ['zoe', { laptop: 'screen', laptopScreen: T(';fly me', 0, 10, 40, '#3BD16F'), face: 'happy' }, "laptop: 'screen'"],
        ['zoe', { laptop: true, view: 'side' }, 'laptop · side'],
        ['mom', { notes: 'TODAY', armR: 60, face: 'determined' }, "mom · notes: 'TODAY'"],
        ['granny', { fast: true, view: 'side', face: 'excited', legL: 50, kneeL: 30, legR: -40, kneeR: 70, armL: 60, armR: -50, lean: -10 }, 'granny · fast + fireTrail'],
        ['granny', { fast: true, face: 'determined' }, 'granny · fast: true'],
        ['principal', { mug: true, face: 'deadpan', steam: 1, armL: 40 }, 'principal · mug'],
        ['coach', { whistle: 'mouth', face: 'angry' }, "coach · whistle: 'mouth'"],
        ['admin', { glow: 1, face: 'neutral', armL: 120, armR: 120, t: 2 }, 'admin · glow: 1'],
      ];
      opts.forEach(([k, p, label], i) => {
        const x = 170 + i * 318;
        if (label.startsWith('granny · fast +')) o += fireTrail({ x: x + 30, y: G - 200, len: 190, angle: 0, w: 100, t: 0.7 });
        o += draw[k]({ x, y: G, s: k === 'admin' ? 0.27 : s, t: 0.6, ...p });
        o += TF(label, x, G + 64, 24, INK);
      });
      return o;
    },
  },

  // ------------------------------------------------------------------ cats
  cats: {
    file: 'cats.png', w: 3600, h: 2900,
    draw() {
      let o = bg(3600, 2900, 'PANCAKE + THE CITY CATS', "pancake({x,y,s,t,pose,mood,blink,crown,look}) · cat({x,y,s,t,pose,mood,coat,seed}) — plain SVG, < 100 elements, no filters");
      // poses
      const poses = [['sit', {}], ['loaf', {}], ['walk', {}], ['sleep', {}], ['pounce', {}], ['lie', {}], ['paw', {}]];
      o += T('POSES', 120, 260, 40, INK, { 'text-anchor': 'start' });
      poses.forEach(([p, extra], i) => {
        const x = 260 + i * 470;
        o += card(x - 215, 290, 440, 460) + CATS.pancake({ x: x + (p === 'pounce' ? 30 : p === 'lie' ? 30 : 0), y: p === 'pounce' ? 680 : 690, s: p === 'pounce' ? 0.8 : 1.05, t: 0.8, pose: p, ...extra }) + pill(`'${p}'`, x, 726, 150);
      });
      // moods
      o += T('MOODS', 120, 830, 40, INK, { 'text-anchor': 'start' });
      const moods = ['lazy', 'smug', 'happy', 'surprised', 'angry'];
      moods.forEach((m, i) => {
        const x = 300 + i * 520;
        o += card(x - 240, 860, 480, 560) + CATS.pancake({ x, y: 1340, s: 1.5, t: 0.3, pose: 'sit', mood: m }) + pill(`'${m}'`, x, 1392, 170);
      });
      // crown + blink/look
      const cx = 2940;
      o += card(cx - 300, 860, 600, 560, '#FFF2C0', 0.8) + CATS.pancake({ x: cx - 100, y: 1340, s: 1.5, t: 0.3, pose: 'sit', mood: 'smug', crown: true }) + pill('crown: true', cx - 100, 1392, 180);
      o += CATS.pancake({ x: cx + 190, y: 1150, s: 0.7, pose: 'sit', mood: 'lazy', blink: 1 }) + TF('blink: 1', cx + 190, 1190, 24, INK);
      o += CATS.pancake({ x: cx + 190, y: 1330, s: 0.7, pose: 'sit', mood: 'surprised', look: [-1, 0.4] }) + TF('look: [-1, .4]', cx + 190, 1370, 24, INK);
      // city cats
      o += T('CITY CATS — cat({ coat, seed })', 120, 1500, 40, INK, { 'text-anchor': 'start' });
      const coats = ['black', 'white', 'grey', 'calico', 'siamese', 'tabby'];
      coats.forEach((c, i) => {
        const x = 300 + i * 560;
        o += card(x - 270, 1530, 540, 540);
        o += CATS.cat({ x: x - 110, y: 1990, s: 0.95, t: 0.5 + i, pose: 'sit', coat: c, seed: i, mood: ['smug', 'happy', 'lazy', 'surprised', 'smug', 'angry'][i] });
        o += CATS.cat({ x: x + 120, y: 1810, s: 0.7, t: 0.5 + i, pose: ['walk', 'lie', 'loaf', 'pounce', 'walk', 'lie'][i], coat: c, seed: i + 7, flip: i % 2 === 1 });
        o += pill(`'${c}'`, x, 2046, 160);
      });
      // scale strip: tiny on a desk next to a kid, and building-sized over the city
      o += T('SCALE', 120, 2150, 40, INK, { 'text-anchor': 'start' });
      o += card(40, 2180, 1180, 680);
      o += S.rect(80, 2700, 1100, 40, 8, { fill: '#B07A45', stroke: '#151515', 'stroke-width': 5 });
      o += draw.you({ x: 360, y: 2820, s: 0.5, face: 'happy', armR: 60 });
      o += CATS.pancake({ x: 760, y: 2700, s: 0.3, pose: 'loaf', t: 0.3 }) + CATS.pancake({ x: 960, y: 2700, s: 0.3, pose: 'sit', crown: true });
      o += CATS.pancake({ x: 1100, y: 2820, s: 0.5, pose: 'walk', t: 0.6, flip: true });
      o += TF('s 0.3 on the desk · s 0.5 next to YOU at s 0.5', 630, 2230, 26, INK);
      // building-sized
      o += `<clipPath id="bigcat"><rect x="1260" y="2180" width="2300" height="680" rx="18"/></clipPath>`;
      let city = S.rect(1260, 2180, 2300, 680, 0, { fill: '#3A2C66' }) + S.circle(3300, 2290, 60, { fill: '#FFF2C0' });
      city += skyline(1260, 3560, 2860, '#2A2050', '#FFD45A');
      city += CATS.cat({ x: 1700, y: 2900, s: 3.2, pose: 'lie', coat: 'grey', mood: 'happy', t: 0.3, seed: 3 });
      city += CATS.pancake({ x: 2560, y: 3340, s: 6.5, pose: 'sit', mood: 'smug', t: 0.2 });
      city += CATS.cat({ x: 3330, y: 2880, s: 2.4, pose: 'walk', coat: 'black', mood: 'smug', t: 0.4, seed: 5 });
      o += S.g(city, null, { 'clip-path': 'url(#bigcat)' }) + S.rect(1260, 2180, 2300, 680, 18, { fill: 'none', stroke: '#EBC992', 'stroke-width': 3 });
      o += S.rect(1290, 2200, 560, 50, 20, { fill: INK, opacity: 0.85 }) + TF('building-sized: s 6.5 (Pancake), 3.2, 2.4', 1570, 2234, 26, '#FFFFFF');
      return o;
    },
  },

  // ------------------------------------------------------------------ crowds
  crowd: {
    file: 'cast_crowd.png', w: 3400, h: 1560,
    draw() {
      let o = bg(3400, 1560, "CROWDS — draw.kid(i, pose) · draw.adult(i, pose)", 'random designs from the new looks4 hair, tops, skirts, glasses and moustaches (nothing from the previous cast)');
      const G1 = 800, G2 = 1460;
      for (let i = 0; i < 16; i++) o += draw.kid(i, { x: 120 + i * 205, y: G1, s: 0.52, face: ['happy', 'neutral', 'excited', 'shocked'][i % 4], turn: ((i % 5) - 2) * 0.15, view: i === 7 ? 'side' : i === 12 ? 'back' : 'front' });
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
    const r = await openRenderer(sh.w, sh.h, { staticDefs: CATS.DEFS });
    S.resetIds();
    fs.writeFileSync(path.join(OUT, sh.file), await r.render(ST.DEFS + sh.draw()));
    await r.close();
    console.log('wrote', path.join('concept', sh.file));
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
