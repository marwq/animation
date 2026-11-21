// Concept sheets for the "What If You Could RESPAWN in Real Life?" cast (docs/CAST.md).
// Usage: node tools/concept.js [lineup|expr|turn|props|crowd|all]   -> concept/cast_*.png
// RIG_DIR=/path/to/rig node tools/concept.js ...  renders a development copy of the rig instead of ../rig
'use strict';
const path = require('path');
const fs = require('fs');
const RIG = process.env.RIG_DIR || path.join(__dirname, '..', 'rig');
const S = require(path.join(RIG, 'svg'));
const ST = require(path.join(RIG, 'style'));
const { D, draw, NAMES } = require(path.join(RIG, 'cast'));
const X = require(path.join(RIG, 'extras'));
const { openRenderer } = require('./render');
const OUT = path.join(__dirname, '..', 'concept');

const T = (s, x, y, size, fill = '#1d2433', extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
const TF = (s, x, y, size, fill = '#7A5A8A', extra = {}) => T(s, x, y, size, fill, { 'font-family': 'Fredoka, sans-serif', 'font-weight': 600, ...extra });
const INK = '#2A1640';
function bg(w, h, title, sub, dark = false) {
  const id = `cbg${w}x${h}`;
  let o = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${dark ? '<stop offset="0" stop-color="#1E2A4A"/><stop offset="1" stop-color="#2A1F45"/>' : '<stop offset="0" stop-color="#F2FBF4"/><stop offset="1" stop-color="#DDF2E6"/>'}</linearGradient></defs>`;
  o += S.rect(0, 0, w, h, 0, { fill: `url(#${id})` });
  let grid = '';
  for (let x = 0; x < w; x += 80) grid += `M${x} 0 L${x} ${h} `;
  for (let y = 0; y < h; y += 80) grid += `M0 ${y} L${w} ${y} `;
  o += S.path(grid, { stroke: dark ? '#2E3A60' : '#CDEBD8', 'stroke-width': 2 });
  o += T(title, w / 2, 96, 76, dark ? '#FFFFFF' : INK) + TF(sub, w / 2, 150, 32, dark ? '#B8C8F0' : '#4A7A62');
  return o;
}
let clipN = 0;
const crop = (inner, x, y, w, h) => { const id = `ccrop${++clipN}`; return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/></clipPath>` + S.g(inner, null, { 'clip-path': `url(#${id})` }); };
const card = (x, y, w, h, fill = '#FFFFFF', op = 0.6) => S.rect(x, y, w, h, 18, { fill, opacity: op, stroke: '#A8D8BC', 'stroke-width': 3 });
// head-and-shoulders of a rig character, head normalised to the same size whatever the character's height
function bust(k, pose, cx, cy, sc = 0.5) {
  const size = (D[k] && D[k].dims.size) || 1;
  const hk = (D[k] && D[k].style && D[k].style.headK) || 1;
  return S.g(draw[k]({ x: 0, y: 0, s: 1 / (size * hk), shadow: false, t: 1.3, ...pose }), `translate(${cx} ${cy}) scale(${sc}) translate(0 ${1112 - (1 - hk) * 560 / hk})`);
}
const pill = (s, x, y, w = 184) => S.rect(x - w / 2, y - 28, w, 40, 20, { fill: INK, opacity: 0.85 }) + TF(s, x, y + 2, 26, '#FFFFFF');
const label = (s, x, y, size = 40) => T(s, x, y, size, INK, { 'text-anchor': 'start' });
const RIGS = ['you', 'ivy', 'dad', 'mom', 'bea', 'teacher', 'coach', 'principal', 'juggler', 'ghost'];
// a simple side table for the fishbowl (screen space; top centre at x, y)
const table = (x, y, w, h) => S.rect(x - w / 2, y, w, 26, 8, { fill: '#B07A45', stroke: '#151515', 'stroke-width': 6 }) + S.rect(x - w / 2 + 20, y + 26, 22, h - 26, 6, { fill: '#8A5A30', stroke: '#151515', 'stroke-width': 5 }) + S.rect(x + w / 2 - 42, y + 26, 22, h - 26, 6, { fill: '#8A5A30', stroke: '#151515', 'stroke-width': 5 });

const SHEETS = {
  // ------------------------------------------------------------------ lineup at real relative size
  lineup: {
    file: 'cast_lineup.png', w: 5600, h: 1900,
    draw() {
      let o = bg(5600, 1900, 'WHAT IF YOU COULD RESPAWN IN REAL LIFE? — CAST', 'R6 cut-out rig · vinyl volume · everyone at the same scale (s 0.75) · Gary + bowl and all props are non-rig (rig/extras.js)');
      const G = 1640, s = 0.75;
      o += S.rect(0, G, 5600, 260, 0, { fill: '#BFE3CC' }) + S.path(`M0 ${G} L5600 ${G}`, { stroke: '#8CC8A4', 'stroke-width': 4 });
      // background ghosts (the corrupted save): lite crowd far away
      const crowd = [];
      for (let i = 0; i < 16; i++) crowd.push({ x: 4560 + (i % 8) * 120 + (i > 7 ? 60 : 0), y: G - 560 + (i > 7 ? 70 : 0), s: 0.24, view: ['front', 'side', 'back'][i % 3], flip: i % 2 === 1, armR: (i * 47) % 170, armL: (i * 31) % 120, rot: i % 5 === 0 ? 30 : 0 });
      o += draw.ghostCrowd(crowd, { alpha: 0.5 });
      const items = [
        ['you', 260, { face: 'happy', armR: 150, armL: 14, backpack: 'flag' }],
        ['ivy', 620, { face: 'joy', book: true, turn: -0.1 }],
        ['dad', 1040, { face: 'talkHappy', spatula: true, armR: 40, turn: 0.15 }],
        ['mom', 1500, { face: 'happy', thermos: true, turn: 0.1 }],
        ['bea', 1820, { face: 'deadpan', turn: 0.05 }],
        ['teacher', 2160, { face: 'deadpan', papers: true, turn: -0.1 }],
        ['coach', 2560, { face: 'determined', ball: true, turn: -0.15 }],
        ['principal', 2940, { face: 'deadpan', turn: -0.15, armL: 20 }],
        ['juggler', 3300, { face: 'happy', juggle: 0.35 }],
        ['kid', 3600, { i: 4, face: 'happy', turn: 0.2 }],
        ['kid', 3840, { i: 11, face: 'excited', turn: -0.2 }],
      ];
      // Gary's bowl on a side table, at the hero's scale
      const bs = 0.34;
      o += table(4170, G - 360, 360, 360);
      o += X.fishbowl({ x: 4170, y: G - 360, s: bs, t: 0.4, line: 14, flag: 0, gary: { yaw: -70, look: [-0.6, 0] } });
      o += T('Gary', 4170, G + 84, 42, INK) + TF('fishbowl s 0.34 (= hero s 0.75) · gary inside', 4170, G + 124, 26, '#5A8A72');
      for (const [k, x, pose] of items) {
        o += k === 'kid' ? draw.kid(pose.i, { x, y: G, s, t: 0.8, ...pose }) : draw[k]({ x, y: G, s, shade: true, shadow: true, t: 0.8, ...pose });
        if (k === 'you') {
          o += S.rect(x - 130, G + 30, 260, 90, 30, { fill: '#D8262E', stroke: '#151515', 'stroke-width': 6 }) + T('YOU', x, G + 98, 72, '#FFFFFF', { stroke: '#151515', 'stroke-width': 8, 'paint-order': 'stroke' });
          o += TF('the hero · on model', x, G + 160, 30, INK);
        } else if (k === 'kid') {
          o += T(`kid ${pose.i}`, x, G + 84, 38, INK) + TF('crowd', x, G + 124, 26, '#5A8A72');
        } else {
          o += T(NAMES[k], x, G + 84, NAMES[k].length > 11 ? 30 : 42, INK);
          o += TF(`size ${D[k].dims.size}`, x, G + 124, 26, '#5A8A72');
        }
      }
      // full ghosts repeating their fails
      o += draw.ghost({ x: 4640, y: G, s, face: 'oof', view: 'side', rot: -24, rotY: -200, armL: 150, armR: 120, legL: 30, kneeL: 40 });
      o += X.skateboard({ x: 4780, y: G - 50, s: s, rot: 18, flipK: 0.1 });
      o += draw.ghost({ x: 4920, y: G, s, face: 'shocked', foam: 0.9 });
      o += draw.ghost({ x: 5280, y: G, s, face: 'scared', view: 'side', flip: true, armL: 120, armR: 150, lean: -12 });
      o += X.spaghetti({ x: 5460, y: G - 700, s: 0.7, mode: 'fly', k: 0.5 }) + X.lunchTray({ x: 5440, y: G - 520, s: 0.6, rot: 30, spaghetti: 0 });
      o += T('ghost-YOU', 4920, G + 84, 42, INK) + TF('draw.ghost (alpha 0.55) · behind: draw.ghostCrowd of ghostLite', 4920, G + 124, 26, '#5A8A72');
      return o;
    },
  },

  // ------------------------------------------------------------------ expressions + side/back
  expr: {
    file: 'cast_expressions.png', w: 3520, h: 4040,
    draw() {
      let o = bg(3520, 4040, 'THE CAST — EXPRESSIONS', 'eight faces each + side and back views · bottom: Gary the goldfish (yaw, blink, look, glowing eyes)');
      const CW = 316, X0 = 250, Y0 = 186, RH = 380;
      const rows = {
        you: ['neutral', 'happy', 'joy', 'smug', 'shocked', 'scared', 'sad', 'determined'],
        ivy: ['neutral', 'joy', 'excited', 'sneaky', 'confused', { name: 'sad', label: 'hurt' }, 'shocked', { name: 'joy', label: 'soot!', soot: 1 }],
        dad: [{ name: 'talkHappy', label: 'proud' }, 'joy', 'smug', 'shocked', { name: 'sad', label: 'deflating' }, 'confused', 'love', { name: 'shocked', label: 'pancake', pancakeOnHead: true }],
        mom: ['neutral', 'happy', 'talkHappy', 'joy', 'shocked', { name: 'nervous', label: 'glitchy' }, 'excited', 'sad'],
        bea: [{ name: 'neutral', label: 'honest' }, 'deadpan', 'cute', { name: 'happy', label: 'gap smile', gapSmile: true }, { name: 'scared', label: 'horrified' }, 'sad', 'excited', { name: 'sneaky', label: 'suspicious' }],
        teacher: [{ name: 'neutral', label: 'bored' }, 'deadpan', 'talkHappy', 'shocked', 'angry', 'sad', 'confused', 'sleepy'],
        coach: ['neutral', 'determined', { name: 'angry', label: 'LET\'S GO', mouth: 'scream' }, 'shocked', 'confused', 'happy', 'excited', { name: 'determined', label: 'whistle', whistle: 'mouth' }],
        principal: [{ name: 'neutral', label: 'stern' }, 'angry', 'shocked', 'deadpan', 'happy', 'confused', { name: 'angry', label: 'spaghetti', spaghetti: 0.8 }, { name: 'deadpan', label: 'foam', foam: 0.8 }],
      };
      Object.entries(rows).forEach(([k, faces], r) => {
        const y = Y0 + r * RH;
        o += T(NAMES[k], 125, y + RH / 2 - 10, NAMES[k].length > 9 ? 30 : 42, INK);
        const cols = [...faces, 'side', 'back'];
        cols.forEach((n, i) => {
          const x = X0 + i * CW;
          const lbl = typeof n === 'string' ? n : n.label;
          const { label: _l, name, mouth, eyes, fx, ...opts } = typeof n === 'string' ? {} : n;
          const face = typeof n === 'string' ? n : { name, mouth, eyes, fx };
          const pose = n === 'side' ? { view: 'side', face: 'talkHappy' } : n === 'back' ? { view: 'back' } : { face, turn: i % 2 ? 0.16 : 0, ...opts };
          o += card(x + 8, y + 8, CW - 16, RH - 16) + crop(bust(k, pose, x + CW / 2, y + 12, 0.5), x + 8, y + 8, CW - 16, RH - 16);
          o += pill(lbl, x + CW / 2, y + RH - 24, 170);
        });
      });
      // Gary row
      const y = Y0 + 8 * RH;
      o += T('Gary', 125, y + 160, 42, INK);
      const gs = [
        ['side', { turn: 'side' }], ['front', { turn: 'front' }], ['tail', { turn: 'tail' }], ['yaw 45', { yaw: 45 }], ['blink', { turn: 'front', blink: 1 }],
        ['look', { turn: 'front', look: [0.9, 0.4] }], ['mouth line', { turn: 'front', mouth: 'line' }], ['bubble', { turn: 'side', flip: true, mouth: 'open', bubble: 0.7 }], ['glowEyes', { turn: 'front', glowEyes: 1 }], ['glow side', { turn: 'side', glowEyes: 1 }],
      ];
      gs.forEach(([lbl, g], i) => {
        const x = X0 + i * CW;
        o += card(x + 8, y + 8, CW - 16, RH - 16, i >= 8 ? '#1E2A4A' : '#DFF4FA', 0.9) + crop(X.gary({ x: x + CW / 2, y: y + 170, s: 0.82, t: 0.5, ...g }), x + 8, y + 8, CW - 16, RH - 16);
        o += pill(lbl, x + CW / 2, y + RH - 24, 170);
      });
      return o;
    },
  },

  // ------------------------------------------------------------------ turnaround
  turn: {
    file: 'cast_turnaround.png', w: 3600, h: 4060,
    draw() {
      let o = bg(3600, 4060, 'TURNAROUND — EVERY RIG CHARACTER', 'front · turn +0.6 · turn −0.6 · side · side flipped · back');
      const views = [{}, { turn: 0.6 }, { turn: -0.6 }, { view: 'side' }, { view: 'side', flip: true }, { view: 'back' }];
      const BW = 1780, VW = 280, BH = 640;
      RIGS.forEach((k, i) => {
        const bx = 20 + (i % 2) * BW, by = 190 + Math.floor(i / 2) * BH;
        o += card(bx, by, BW - 20, BH - 20);
        o += T(NAMES[k], bx + BW / 2 - 10, by + BH - 44, 38, INK);
        const s = k === 'teacher' ? 0.36 : 0.4;
        views.forEach((v, j) => { o += draw[k]({ x: bx + 170 + j * VW, y: by + BH - 100, s, t: 0.6, face: v.view === 'back' ? 'neutral' : 'happy', ...v }); });
      });
      // ghostLite row
      const by = 190 + 5 * BH;
      o += card(20, by, 3560, BH - 20);
      const lite = [[{}, 'front'], [{ turn: 0.6 }, 'turn 0.6'], [{ view: 'side' }, 'side'], [{ view: 'side', flip: true }, 'side flip'], [{ view: 'back' }, 'back'], [{ armR: 150, armL: 20 }, 'arm up'],
        [{ view: 'side', legL: 40, kneeL: 30, legR: -30, kneeR: 50, armL: 50, armR: -40 }, 'running'], [{ rot: 90, rotY: -300 }, 'fallen (rot 90)'], [{ rim: true }, 'rim: true'], [{ alpha: 1 }, 'alpha: 1'], [{ col: '#C9A0A8' }, "col: '#C9A0A8'"]];
      lite.forEach(([v, l], j) => { o += draw.ghostLite({ x: 140 + j * 320, y: by + 480, s: 0.4, ...v }); o += TF(l, 140 + j * 320, by + 540, 24, INK); });
      o += T('ghostLite — flat silhouette for crowds (≈0.5–1.2 ms each)', 1800, by + 70, 38, INK);
      return o;
    },
  },

  // ------------------------------------------------------------------ props + character options
  props: {
    file: 'cast_props.png', w: 4800, h: 4600,
    draw() {
      let o = bg(4800, 4600, 'PROPS, GARY\'S BOWL AND CHARACTER OPTIONS', 'rig/extras.js (positional (x, y, s, rot, opts) or one object) · props authored at the hero\'s body scale · bottom: pose options of every rig character');
      const sec = (t, x, y, w, h) => card(x, y, w, h) + label(t, x + 24, y + 54, 36);
      const cap = (t, x, y) => TF(t, x, y, 22, INK);
      // KITCHEN
      let y = 190;
      o += sec('KITCHEN', 20, y, 2370, 560);
      o += X.spatula({ x: 120, y: y + 480, s: 0.9 }) + cap('spatula', 120, y + 540);
      o += X.spatula({ x: 250, y: y + 480, s: 0.9, rot: 60, pancake: true }) + cap('{pancake:true}', 320, y + 540);
      [0, 0.12, 0.25, 0.4, 0.5].forEach((fl, i) => { o += X.pancake(560 + i * 170, y + 330, 0.9, 0, fl) + cap(`flip ${fl}`, 560 + i * 170, y + 440); });
      o += X.pancake(560 + 5 * 170, y + 330, 0.9, 0, 0, { burnt: true }) + cap('burnt', 560 + 5 * 170, y + 440);
      o += X.pancakeStack({ x: 1640, y: y + 470, s: 0.9 }) + cap('pancakeStack', 1640, y + 540);
      o += X.plate({ x: 1860, y: y + 470 }) + cap('plate', 1860, y + 540);
      o += X.spoon({ x: 1990, y: y + 450, full: true }) + cap('spoon', 1990, y + 540);
      o += X.thermos({ x: 2110, y: y + 360, s: 0.9 }) + cap('thermos', 2110, y + 540);
      o += X.phone({ x: 2220, y: y + 360 }) + X.phone({ x: 2330, y: y + 360, face: 'screen' }) + cap('phone back/screen', 2275, y + 540);
      // SCIENCE MAGIC
      o += sec('SCIENCE MAGIC', 2410, y, 2370, 560);
      o += X.bookOfFails({ x: 2560, y: y + 330, s: 0.8 }) + cap('bookOfFails', 2560, y + 500);
      o += X.bookOfFails({ x: 2760, y: y + 330, s: 0.8, vol: 2 }) + cap('{vol:2}', 2760, y + 500);
      o += X.bookOfFails({ x: 3070, y: y + 270, s: 0.7, open: true }) + X.bookOfFails({ x: 3070, y: y + 450, s: 0.55, open: true, vol: 2 }) + cap('{open:true}', 3270, y + 540);
      o += X.topHat({ x: 3420, y: y + 280, s: 0.8, mouth: 'up' }) + cap("topHat 'up'", 3420, y + 540);
      o += X.topHat({ x: 3620, y: y + 440, s: 0.6, mouth: 'down' }) + cap("'down'", 3620, y + 540);
      o += X.topHat({ x: 3780, y: y + 380, s: 0.6, mouth: 'side', foam: 1 }) + cap("'side' + foam", 3820, y + 540);
      o += X.flask({ x: 4020, y: y + 300 }) + X.flask({ x: 4140, y: y + 300, kind: 'round', col: '#FF6FA8' }) + X.flask({ x: 4260, y: y + 300, kind: 'beaker', col: '#6FD3FF', fill: 0.4 }) + X.flask({ x: 4360, y: y + 300, kind: 'tube', col: '#FFD23F', glow: true }) + cap('flask kinds', 4190, y + 340);
      o += X.flaskTray({ x: 4180, y: y + 470, s: 0.8, tilt: 0 }) + cap('flaskTray', 4180, y + 540);
      o += X.rocketSneakers({ x: 4620, y: y + 470, s: 0.8, flame: 1, t: 0.4, pair: true }) + cap('rocketSneakers', 4620, y + 540);
      // SCHOOL
      y = 770;
      o += sec('SCHOOL', 20, y, 4760, 600);
      [0, 0.12, 0.25, 0.5, 0.75].forEach((k, i) => { o += X.skateboard({ x: 260 + i * 330, y: y + 300, s: 0.6, flipK: k }) + cap(`skateboard flipK ${k}`, 260 + i * 330, y + 400); });
      o += X.dodgeball({ x: 1900, y: y + 300 }) + X.dodgeball({ x: 2050, y: y + 300, col: '#3B82F6', squash: 0.35 }) + cap('dodgeball / squash', 1975, y + 400);
      const bb = X.ballBin.layers({ x: 2360, y: y + 560, s: 0.7 });
      o += bb.back + draw.you({ x: 2360, y: y + 520, s: 0.36, face: 'dizzy', armL: 150, armR: 140 }) + bb.front + cap('ballBin.layers + YOU', 2360, y + 590);
      o += X.lunchTray({ x: 2780, y: y + 300, s: 0.8 }) + cap('lunchTray', 2780, y + 400);
      o += X.spaghetti({ x: 3150, y: y + 220, mode: 'fly', k: 0.6, s: 0.8 }) + X.spaghetti({ x: 3150, y: y + 420, mode: 'splat', s: 0.7 }) + cap("spaghetti 'fly' / 'splat'", 3150, y + 470);
      o += X.spaghetti({ x: 3450, y: y + 230, mode: 'drape', k: 0.8, s: 0.8 }) + cap("'drape'", 3450, y + 470);
      o += X.quizPaper({ x: 3720, y: y + 300, rot: -5, grade: '100%' }) + cap('quizPaper', 3720, y + 470);
      o += X.paperStack({ x: 4000, y: y + 330, s: 0.9 }) + cap('paperStack', 4000, y + 470);
      o += X.marker({ x: 4200, y: y + 320, rot: 15 }) + cap('marker', 4200, y + 470);
      o += X.handMic({ x: 4340, y: y + 360, rot: 10 }) + cap('handMic', 4340, y + 470);
      o += X.bowlingPin({ x: 4500, y: y + 300, rot: -20 }) + X.bowlingPin({ x: 4620, y: y + 300, rot: 30, stripe: '#3BD16F', sparkle: true }) + cap('bowlingPin', 4560, y + 470);
      // EVENTS
      y = 1390;
      o += sec('BIRTHDAY · TALENT SHOW · STREET', 20, y, 4760, 720);
      o += X.birthdayCake({ x: 260, y: y + 640, s: 0.75, t: 0.2 }) + cap('birthdayCake', 260, y + 690);
      const ck = X.birthdayCake.layers({ x: 760, y: y + 640, s: 0.75, smash: 1 });
      o += ck.back + draw.you({ x: 760, y: y + 640, s: 0.42, face: 'oof', armL: 160, armR: 150 }) + ck.front + cap('layers({smash:1}) + YOU', 760, y + 690);
      o += X.trophy({ x: 1140, y: y + 640, s: 1 }) + cap('trophy', 1140, y + 690);
      o += X.goSign({ x: 1500, y: y + 330, s: 0.8, t: 0.3 }) + cap('goSign', 1500, y + 480);
      o += X.goSign({ x: 1880, y: y + 260, s: 0.55, stick: true }) + cap('{stick:true}', 1880, y + 690);
      o += X.micStand({ x: 2140, y: y + 640, s: 0.8 }) + cap('micStand', 2140, y + 690);
      o += X.micStand({ x: 2480, y: y + 640, s: 0.8, tripped: 0.8, cable: [[0, -10], [120, -40], [200, -120], [300, 0], [460, 10]] }) + cap('{tripped:0.8, cable}', 2560, y + 690);
      o += X.bicycle({ x: 3200, y: y + 640, s: 0.9, wheelSpin: 0.4 }) + cap('bicycle', 3200, y + 690);
      o += X.backpack({ x: 3700, y: y + 640, s: 0.9 }) + X.backpack({ x: 3950, y: y + 640, s: 0.9, flag: true, t: 0.3 }) + cap('backpack / {flag:true}', 3830, y + 690);
      o += X.checkpointFlag({ x: 4200, y: y + 640, s: 0.9, t: 0.6 }) + cap('checkpointFlag', 4220, y + 690);
      o += X.foam({ x: 4500, y: y + 520, r: 90, k: 1, drip: 1, seed: 3 }) + X.foam({ x: 4660, y: y + 560, r: 50, k: 0.6, seed: 9 }) + cap('foam {k, drip, seed}', 4580, y + 690);
      // GARY + BOWL
      y = 2130;
      o += sec('GARY + FISHBOWL', 20, y, 4760, 760);
      o += X.fishbowl({ x: 380, y: y + 700, s: 0.95, t: 0.6 }) + cap('fishbowl (gary inside)', 380, y + 740);
      const fb = X.fishbowl.layers({ x: 1080, y: y + 700, s: 0.95, t: 1.2, flag: 0, gary: { x: 40, y: -250, s: 1.05, yaw: -30, look: [-0.6, 0.6] }, garyFront: true });
      o += fb.back + draw.you({ x: 1010, y: y + 650, s: 0.07, face: 'happy', armR: 150 }) + fb.front + cap('layers + tiny YOU (s 0.07), garyFront', 1080, y + 740);
      o += S.rect(1440, y + 70, 680, 650, 18, { fill: '#141A33' }) + X.fishbowl({ x: 1780, y: y + 690, s: 0.95, t: 2, flag: 1, gary: { turn: 'front', glowEyes: 1 } }) + cap('{flag:1, gary:{glowEyes:1}}', 1780, y + 744);
      [['side', { turn: 'side' }], ['front', { turn: 'front' }], ['tail (turned on the hero)', { turn: 'tail' }], ['blink', { turn: 'side', flip: true, blink: 1 }], ['yaw 30, look', { yaw: 30, look: [0.8, 0] }], ["mouth 'open' + bubble", { turn: 'side', mouth: 'open', bubble: 0.7 }]].forEach(([l, g], i) => {
        const x = 2450 + (i % 3) * 760, yy = y + (i < 3 ? 260 : 570);
        o += X.gary({ x, y: yy, s: 0.85, t: 0.3, ...g }) + cap(l, x, yy + 150);
      });
      // CHARACTER OPTIONS
      y = 2910;
      o += sec('CHARACTER OPTIONS (pose fields)', 20, y, 4760, 1660);
      const opts = [
        ['you', { foam: 0.5, face: 'shocked' }, 'foam: 0.5'], ['you', { foam: 1, face: 'oof' }, 'foam: 1'], ['you', { backpack: true, face: 'happy' }, 'backpack: true'], ['you', { backpack: 'flag', view: 'back', t: 0.5 }, "backpack: 'flag'"], ['you', { backpack: 'flag', view: 'side', t: 0.5, face: 'smug' }, "'flag' side"], ['you', { headphones: true, face: 'excited' }, 'headphones'],
        ['ivy', { soot: 1, face: 'joy', t: 0.6 }, 'soot: 1'], ['ivy', { goggles: 'down', face: 'determined' }, "goggles: 'down'"], ['ivy', { book: true, face: 'happy' }, 'book: true'], ['ivy', { book: 'open', face: 'excited' }, "book: 'open'"], ['ivy', { foam: 0.8, face: 'joy' }, 'foam: 0.8'], ['ivy', { rockets: 1, t: 0.3, lift: 60, face: 'scream', armL: 150, armR: 150 }, 'rockets: 1'],
        ['dad', { spatula: true, face: 'happy' }, 'spatula'], ['dad', { spatula: true, pancake: true, face: 'smug' }, '+ pancake'], ['dad', { pancakeOnHead: true, face: 'shocked' }, 'pancakeOnHead'], ['dad', { apron: false, face: 'sad' }, 'apron: false'],
        ['mom', { thermos: true, face: 'happy' }, 'thermos'], ['mom', { phone: true, face: 'joy' }, 'phone'],
        ['bea', { spoon: true, face: 'deadpan' }, 'spoon'], ['bea', { sign: true, gapSmile: true }, 'sign + gapSmile'], ['bea', { sign: 'up', face: 'excited' }, "sign: 'up'"],
        ['teacher', { papers: true, marker: true }, 'papers + marker'],
        ['coach', { whistle: 'mouth' }, "whistle: 'mouth'"], ['coach', { ball: true, face: 'determined' }, 'ball'],
        ['principal', { foam: 1, face: 'deadpan' }, 'foam: 1'], ['principal', { spaghetti: 1, face: 'angry' }, 'spaghetti: 1'], ['principal', { mic: true, face: 'happy' }, 'mic'],
        ['juggler', { juggle: 0.35 }, 'juggle: phase'], ['ghost', { face: 'shocked', foam: 0.6 }, 'ghost + foam'], ['ghost', { view: 'side', backpack: 'flag', t: 0.4 }, "ghost backpack"],
      ];
      opts.forEach(([k, p, l], i) => {
        const c = i % 15, r = Math.floor(i / 15);
        const x = 180 + c * 310, yy = y + 720 + r * 800;
        o += draw[k]({ x, y: yy, s: 0.42, t: 0.7, ...p }) + cap(`${k} · ${l}`, x, yy + 50);
      });
      return o;
    },
  },

  // ------------------------------------------------------------------ crowds
  crowd: {
    file: 'cast_crowd.png', w: 3400, h: 2200,
    draw() {
      let o = bg(3400, 2200, 'CROWDS — draw.kid(i, pose) · draw.adult(i, pose) · draw.ghostCrowd([...poses])', 'classmates / cafeteria / audience from looks3–5 pieces · bottom: 300 ghostLite silhouettes in one group (the corrupted Friday)');
      const G1 = 760, G2 = 1380;
      for (let i = 0; i < 16; i++) o += draw.kid(i, { x: 120 + i * 205, y: G1, s: 0.5, face: ['happy', 'neutral', 'excited', 'shocked'][i % 4], turn: ((i % 5) - 2) * 0.15, view: i === 7 ? 'side' : i === 12 ? 'back' : 'front' });
      for (let i = 0; i < 13; i++) o += draw.adult(i, { x: 130 + i * 255, y: G2, s: 0.5, face: ['neutral', 'happy', 'shocked', 'sad'][i % 4], turn: ((i % 5) - 2) * 0.15, view: i === 4 ? 'side' : i === 9 ? 'back' : 'front' });
      o += S.rect(0, 1440, 3400, 760, 0, { fill: '#5A1A26' });
      const poses = [];
      for (let i = 0; i < 300; i++) {
        const row = Math.floor(i / 30), x = 40 + (i % 30) * 112 + (row % 2) * 56, y = 1560 + row * 64;
        poses.push({ x, y, s: 0.12 + row * 0.006, view: ['front', 'side', 'back'][i % 3], flip: i % 2 === 1, armR: (i * 47) % 170, armL: (i * 31) % 120, legL: (i % 4) * 12, kneeL: (i % 4) * 10, rot: i % 13 === 0 ? 80 : 0, rotY: -300 });
      }
      o += draw.ghostCrowd(poses, { alpha: 0.6 });
      return o;
    },
  },
};

async function main() {
  const which = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2].split(',') : Object.keys(SHEETS);
  fs.mkdirSync(OUT, { recursive: true });
  for (const name of which) {
    const sh = SHEETS[name];
    const r = await openRenderer(sh.w, sh.h, { staticDefs: X.DEFS });
    S.resetIds();
    fs.writeFileSync(path.join(OUT, sh.file), await r.render(ST.DEFS + sh.draw()));
    await r.close();
    console.log('wrote', path.join('concept', sh.file));
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
