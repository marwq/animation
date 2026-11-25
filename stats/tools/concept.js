// Concept sheets for the "What If You Could See Everyone's STATS in Real Life?" cast (docs/CAST.md).
// Usage: node tools/concept.js [lineup|expr|turn|props|crowd|all]   -> concept/cast_*.png
// RIG_DIR=/path/to/rig node tools/concept.js ...  renders a development copy of the rig instead of ../rig
// OUT_DIR=/tmp/x node tools/concept.js ...        writes the sheets somewhere else
'use strict';
const path = require('path');
const fs = require('fs');
const RIG = process.env.RIG_DIR || path.join(__dirname, '..', 'rig');
const S = require(path.join(RIG, 'svg'));
const ST = require(path.join(RIG, 'style'));
const CAST = require(path.join(RIG, 'cast'));
const { D, draw, NAMES } = CAST;
const X = require(path.join(RIG, 'extras'));
const { openRenderer } = require('./render');
const OUT = process.env.OUT_DIR || path.join(__dirname, '..', 'concept');

const T = (s, x, y, size, fill = '#1d2433', extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
const TF = (s, x, y, size, fill = '#7A5A8A', extra = {}) => T(s, x, y, size, fill, { 'font-family': 'Fredoka, sans-serif', 'font-weight': 600, ...extra });
const INK = '#2A1640';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
// warm "home" paper, cool "school" or dusk "fair" backgrounds with a faint grid
function bg(w, h, title, sub, mode = 'home') {
  const id = `cbg${w}x${h}${mode}`;
  const stops = mode === 'school' ? '<stop offset="0" stop-color="#E6F4FF"/><stop offset="1" stop-color="#D2E8F8"/>'
    : mode === 'fair' ? '<stop offset="0" stop-color="#3A2A6A"/><stop offset="0.6" stop-color="#C8607A"/><stop offset="1" stop-color="#F2A86A"/>'
      : '<stop offset="0" stop-color="#FFF6E8"/><stop offset="1" stop-color="#FCE6CF"/>';
  let o = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient></defs>`;
  o += S.rect(0, 0, w, h, 0, { fill: `url(#${id})` });
  let grid = '';
  for (let x = 0; x < w; x += 80) grid += `M${x} 0 L${x} ${h} `;
  for (let y = 0; y < h; y += 80) grid += `M0 ${y} L${w} ${y} `;
  o += S.path(grid, { stroke: mode === 'school' ? '#C8E0F2' : mode === 'fair' ? '#FFFFFF' : '#F4DCC0', 'stroke-width': 2, opacity: mode === 'fair' ? 0.06 : 1 });
  const dark = mode === 'fair';
  o += T(esc(title), w / 2, 96, 76, dark ? '#FFFFFF' : INK) + TF(esc(sub), w / 2, 150, 32, dark ? '#FFE0C8' : '#8A5A6A');
  return o;
}
let clipN = 0;
const crop = (inner, x, y, w, h) => { const id = `ccrop${++clipN}`; return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/></clipPath>` + S.g(inner, null, { 'clip-path': `url(#${id})` }); };
const card = (x, y, w, h, fill = '#FFFFFF', op = 0.6, stroke = '#EBC9A8') => S.rect(x, y, w, h, 18, { fill, opacity: op, stroke, 'stroke-width': 3 });
const sizeOf = (k, i = 0) => (k === 'kid' ? CAST.kidDesign(i).dims.size : k === 'adult' ? CAST.adultDesign(i).dims.size : ((D[k] && D[k].dims && D[k].dims.size) || 1));
const KIND = (k, i, p) => (['kid', 'adult'].includes(k) ? draw[k](i, p) : draw[k](p));
// head-and-shoulders of a rig character, head normalised to the same size whatever the character's height (and head scale)
function bust(k, pose, cx, cy, sc = 0.5) {
  const d = k === 'kid' ? CAST.kidDesign(pose.i || 0) : k === 'adult' ? CAST.adultDesign(pose.i || 0) : D[k];
  const size = sizeOf(k, pose.i || 0), hk = (d && d.style && d.style.headK) || 1;
  const z = 1 / (size * hk);
  // at s = z the head is drawn at its own size; its neck sits 560 / headK above the feet -> shift so every head lands in the same place
  return S.g(KIND(k, pose.i || 0, { x: 0, y: 0, s: z, shadow: false, t: 1.3, ...pose }), `translate(${cx} ${cy}) scale(${sc}) translate(0 ${560 / hk + 552})`);
}
const pill = (s, x, y, w = 184) => S.rect(x - w / 2, y - 28, w, 40, 20, { fill: INK, opacity: 0.85 }) + TF(esc(s), x, y + 2, 26, '#FFFFFF');
const label = (s, x, y, size = 40, col = INK) => T(esc(s), x, y, size, col, { 'text-anchor': 'start' });
const cap = (t, x, y, col = INK, size = 24) => TF(esc(t), x, y, size, col);
// a mini stat plate at the head-top anchor (what scenes/hud.js hangs over a character)
function plateMark(key, pose, txt) {
  const h = CAST.headTop(key, pose);
  const w = Math.max(90, txt.length * 13 + 30);
  return S.path(`M${h.x} ${h.y} L${h.x} ${h.y - 26}`, { stroke: '#1FB6FF', 'stroke-width': 3, 'stroke-dasharray': '5 4' }) + S.circle(h.x, h.y, 6, { fill: '#1FB6FF' }) +
    S.rect(h.x - w / 2, h.y - 66, w, 40, 10, { fill: '#10203A', opacity: 0.88, stroke: '#1FB6FF', 'stroke-width': 3 }) + TF(esc(txt), h.x, h.y - 38, 22, '#BFF0FF');
}

const SHEETS = {
  // ------------------------------------------------------------------ everyone at the same scale
  lineup: {
    file: 'cast_lineup.png', w: 6400, h: 2000,
    draw() {
      let o = bg(6400, 2000, "WHAT IF YOU COULD SEE EVERYONE'S STATS IN REAL LIFE? — CAST", 'R6 cut-out rig · vinyl volume · everyone at the same scale (s 0.7) · cyan dots = headTop() anchors for the HUD stat plates');
      const G = 1720, s = 0.7;
      o += S.rect(0, G, 6400, 280, 0, { fill: '#F2D2AE' }) + S.path(`M0 ${G} L6400 ${G}`, { stroke: '#E0B88C', 'stroke-width': 5 });
      o += S.rect(3010, 200, 3390, G - 200, 0, { fill: '#D8ECFA', opacity: 0.5 }) + S.path(`M3010 200 L3010 ${G + 280}`, { stroke: '#FFFFFF', 'stroke-width': 8, 'stroke-dasharray': '24 16' });
      o += T('HOME', 1500, 270, 54, '#B0603A') + T('SCHOOL · TOWN', 4700, 270, 54, '#2A6EB8');
      const home = [
        ['you', 260, { face: 'happy', armR: 30, bendR: -110 }, 'YOU', 'the hero · on model · 951', '???'],
        ['mom', 740, { face: 'happy', coffee: true }, 'Mom', 'size 1.04 · coffee', 'ENERGY 2%'],
        ['grandpa', 1260, { face: 'talkHappy', cane: true }, 'Grandpa Lou', 'size 1.1 · cane', 'LV 87'],
        ['max', 1720, { face: 'happy', balloon: true }, 'Max', 'size 0.56 · balloon', 'CHAOS 9999'],
        ['biscuit', 2060, { pose: 'sit', face: 'happy' }, 'Biscuit', 'corgi · non-rig', 'ERROR'],
        ['max', 2420, { face: 'joy', hood: 'down', roar: true }, 'Max', "hood: 'down' · roar", 'RAWR'],
        ['mom', 2800, { face: 'joy', dayoff: true }, 'Mom', 'dayoff: true', 'LV 38'],
      ];
      const school = [
        ['benji', 3260, { face: 'talkHappy', books: true }, 'Benji', 'size 0.98 · books', 'LV 4'],
        ['tank', 3760, { face: 'neutral', lunch: true }, 'Tank', 'size 1.35 · lunch', 'HP 3/100'],
        ['teacher', 4300, { face: 'neutral', pointer: true }, 'Mrs. Krump', 'size 1.12 · pointer', 'LV 99'],
        ['lunchLady', 4760, { face: 'smug' }, 'Lunch lady', 'size 1.06', 'LV 50'],
        ['coach', 5170, { face: 'shocked' }, 'Coach', 'size 1.08', 'LV 41'],
        ['neighbor', 5580, { face: 'happy' }, 'Mrs. Wells', 'size 0.92 · bags', '+2 XP'],
        ['fairWorker', 5990, { face: 'happy', turn: -0.2 }, 'Fair worker', 'size 1.04', 'LV 22'],
      ];
      for (const [k, x, pose, name, sub, plate] of [...home, ...school]) {
        const p = { x, y: G, s, t: 0.8, ...pose };
        o += KIND(k, 0, p) + plateMark(k, p, plate);
        o += T(esc(name), x, G + 84, name.length > 11 ? 36 : 42, INK) + TF(esc(sub), x, G + 124, 24, '#7A5A6A');
      }
      return o;
    },
  },

  // ------------------------------------------------------------------ expressions + side/back
  expr: {
    file: 'cast_expressions.png', w: 3520, h: 3880,
    draw() {
      let o = bg(3520, 3880, 'THE CAST — EXPRESSIONS', 'eight faces each + side and back · every face lip-syncs through actor() · Biscuit has his own face set (face: happy | good | love | shocked | sad | sleepy | neutral)');
      const CW = 316, X0 = 250, Y0 = 186, RH = 370;
      const rows = {
        you: ['neutral', 'happy', 'joy', { name: 'amazed', label: 'amazed (HUD!)' }, 'shocked', 'smug', 'sad', { name: 'confused', label: '??? confused' }],
        mom: [{ name: 'happy', label: 'always smiling' }, 'talkHappy', 'joy', { name: 'sleepy', label: 'asleep', asleep: true }, { name: 'happy', label: 'tired 1', tired: 1 }, 'shocked', { name: 'crying', label: 'crying (fair)' }, { name: 'scared', label: 'MAX?!' }],
        grandpa: [{ name: 'happy', label: 'neutral (smile)' }, 'talkHappy', { name: 'determined', label: 'LEGEND! (flex)' }, 'confused', { name: 'sneaky', label: 'suspicious' }, { name: 'deadpan', label: "I don't have hair" }, { name: 'happy', label: "glasses: 'on'", glasses: 'on' }, 'joy'],
        max: ['neutral', 'happy', 'cute', { name: 'angry', label: 'RAWR!', mouth: 'scream', fx: [] }, 'excited', 'shocked', 'sad', { name: 'joy', label: "hood: 'down'", hood: 'down' }],
        benji: ['neutral', 'talkHappy', { name: 'joy', label: 'joy (braces)' }, 'nervous', { name: 'dizzy', label: "I'm okay!", mouth: 'grin' }, 'sad', 'excited', { name: 'shocked', label: 'shocked' }],
        tank: ['neutral', { name: 'angry', label: 'LUNCH.' }, 'determined', 'confused', { name: 'sad', label: 'lonely' }, { name: 'nervous', label: 'shy: true', shy: true }, { name: 'happy', label: 'almost smiling', shy: true }, 'shocked'],
        teacher: ['neutral', { name: 'angry', label: 'NOW.' }, { name: 'determined', label: 'glare', glare: 1 }, 'sneaky', 'smug', 'shocked', { name: 'confused', label: 'my head?' }, { name: 'happy', label: 'rare smile' }],
        kid: [{ name: 'nervous', label: 'kid 0: dog ate it', i: 0 }, { name: 'neutral', label: 'kid 1: quiet one', i: 1 }, { name: 'smug', label: 'kid 2: INT 95', i: 2 }, { name: 'neutral', label: 'kid 3: INT 95', i: 3 }, { name: 'happy', label: 'kid 7', i: 7 }, { name: 'shocked', label: 'kid 12', i: 12 }, { name: 'happy', label: 'adult 3', i: 3, kind: 'adult' }, { name: 'joy', label: 'adult 9', i: 9, kind: 'adult' }],
      };
      Object.entries(rows).forEach(([k, faces], r) => {
        const y = Y0 + r * RH;
        o += T(esc(NAMES[k] || k), 125, y + RH / 2 - 10, (NAMES[k] || k).length > 9 ? 30 : 40, INK);
        const cols = [...faces, 'side', 'back'];
        cols.forEach((n, i) => {
          const x = X0 + i * CW;
          const lbl = typeof n === 'string' ? n : n.label;
          const { label: _l, name, mouth, eyes, fx, kind, ...opts } = typeof n === 'string' ? {} : n;
          const face = typeof n === 'string' ? n : { name, mouth, eyes, fx };
          const pose = n === 'side' ? { view: 'side', face: 'talkHappy' } : n === 'back' ? { view: 'back' } : { face, turn: i % 2 ? 0.16 : 0, ...opts };
          const kk = kind || k;
          o += card(x + 8, y + 8, CW - 16, RH - 16) + crop(bust(kk, { t: 0.4, ...pose }, x + CW / 2, y + 30, kk === 'teacher' ? 0.4 : 0.48), x + 8, y + 8, CW - 16, RH - 16);
          o += pill(lbl, x + CW / 2, y + RH - 24, 220);
        });
      });
      // Biscuit row
      const y = Y0 + 8 * RH;
      o += T('Biscuit', 125, y + RH / 2 - 10, 40, INK);
      ['happy', 'good', 'love', 'neutral', 'shocked', 'sad', 'sleepy', ['walk', 'happy'], ['beg', 'good'], ['sleep', 'happy']].forEach((fc, i) => {
        const x = X0 + i * CW;
        const [pz, face] = Array.isArray(fc) ? fc : ['sit', fc];
        o += card(x + 8, y + 8, CW - 16, RH - 16) + crop(draw.biscuit({ x: x + CW / 2 + (pz === 'walk' || pz === 'sleep' ? 20 : 0), y: y + RH - 50, s: pz === 'sit' ? 0.7 : 0.55, pose: pz, face, t: 0.6 + i * 0.3 }), x + 8, y + 8, CW - 16, RH - 16);
        o += pill(Array.isArray(fc) ? `${pz}` : (face === 'good' ? 'GOOD BOY: ∞' : face), x + CW / 2, y + RH - 24, 220);
      });
      return o;
    },
  },

  // ------------------------------------------------------------------ turnaround
  turn: {
    file: 'cast_turnaround.png', w: 3600, h: 4700,
    draw() {
      let o = bg(3600, 4700, 'TURNAROUND — EVERY RIG CHARACTER', 'front · turn +0.6 · turn −0.6 · side · side flipped · back  (s 0.36; Tank s 0.3)');
      const views = [{}, { turn: 0.6 }, { turn: -0.6 }, { view: 'side' }, { view: 'side', flip: true }, { view: 'back' }];
      const BW = 1780, VW = 280, BH = 640;
      const RIGS = [['you', {}], ['you', { pajamas: true, label: 'YOU · pajamas' }], ['mom', {}], ['mom', { dayoff: true, label: 'Mom · dayoff' }], ['grandpa', { sash: true, label: 'Grandpa Lou · sash' }], ['max', {}], ['max', { hood: 'down', label: "Max · hood 'down'" }],
        ['benji', {}], ['tank', {}], ['teacher', {}], ['lunchLady', {}], ['coach', {}], ['neighbor', {}], ['fairWorker', {}]];
      RIGS.forEach(([k, extra], i) => {
        const bx = 20 + (i % 2) * BW, by = 190 + Math.floor(i / 2) * BH;
        const { label: lb, ...ex } = extra;
        o += card(bx, by, BW - 20, BH - 20);
        o += T(esc(lb || NAMES[k] || k), bx + BW / 2 - 10, by + BH - 44, 38, INK);
        const s = k === 'tank' ? 0.3 : 0.36;
        views.forEach((v, j) => { o += KIND(k, 0, { x: bx + 170 + j * VW, y: by + BH - 110, s, t: 0.6, face: v.view === 'back' ? 'neutral' : 'happy', ...ex, ...v }); });
      });
      return o;
    },
  },

  // ------------------------------------------------------------------ props + character options
  props: {
    file: 'cast_props.png', w: 4800, h: 4500,
    draw() {
      let o = bg(4800, 4500, 'PROPS AND CHARACTER OPTIONS', "rig/extras.js (positional (x, y, s, rot, opts) or one object) · props authored at the hero's body scale · bendL / bendR bend any new character's elbows");
      const sec = (t, x, y, w, h) => card(x, y, w, h) + label(t, x + 24, y + 54, 36);
      const scr = (w, h) => S.rect(0, 0, w, h, 0, { fill: '#10203A' }) + S.rect(w * 0.1, h * 0.3, w * 0.8, h * 0.22, h * 0.04, { fill: '#1FB6FF', opacity: 0.25, stroke: '#1FB6FF', 'stroke-width': 4 }) + TF('REALITY HUD v1.0', w / 2, h * 0.44, h * 0.07, '#BFF0FF') + S.rect(w * 0.3, h * 0.62, w * 0.4, h * 0.1, h * 0.03, { fill: '#3BD16F' }) + TF('ACCEPT', w / 2, h * 0.69, h * 0.05, '#0A2A1A');
      // BREAKFAST + BEDROOM
      let y = 190;
      o += sec('HOME: breakfast chaos, bedroom, living room', 20, y, 4760, 700);
      o += X.toaster({ x: 200, y: y + 560, s: 0.9, pop: 0, burn: 0 }) + cap('toaster', 200, y + 640);
      o += X.toaster({ x: 520, y: y + 560, s: 0.9, pop: 1, burn: 0.9, t: 0.7 }) + cap('pop 1 · burn 0.9', 520, y + 640);
      o += X.toast({ x: 760, y: y + 440, burnt: 0 }) + X.toast({ x: 920, y: y + 440, burnt: 1, t: 0.5 }) + cap('toast · burnt', 840, y + 640);
      o += X.cerealBowl({ x: 1170, y: y + 560, s: 0.8 }) + cap('cerealBowl', 1170, y + 640);
      o += X.cerealBowl({ x: 1500, y: y + 560, s: 0.8, splash: 0.7, t: 0.4 }) + cap('splash 0.7', 1500, y + 640);
      o += X.pancakes({ x: 1820, y: y + 560, s: 0.9 }) + cap('pancakes', 1820, y + 640) + X.pancakes({ x: 2120, y: y + 560, s: 0.9, messy: 1 }) + cap('messy 1', 2120, y + 640);
      o += X.coffeeMug({ x: 2370, y: y + 460, t: 0.6 }) + cap('coffeeMug', 2370, y + 640);
      o += X.fryingPan({ x: 2720, y: y + 470, s: 0.9, rot: -8 }) + cap('fryingPan (grip)', 2620, y + 640);
      o += X.alarmClock({ x: 2920, y: y + 560, s: 0.9 }) + cap('alarmClock', 2920, y + 640) + X.alarmClock({ x: 3180, y: y + 560, s: 0.9, ring: 1, t: 0.3 }) + cap('ring 1', 3180, y + 640);
      o += X.sock({ x: 3420, y: y + 450, s: 0.9, t: 0.4 }) + cap('sock (smell)', 3420, y + 640);
      o += X.pillowFort({ x: 3900, y: y + 600, s: 0.28, k: 0.45 }) + cap('pillowFort k 0.45', 3900, y + 640);
      o += X.pillowFort({ x: 4480, y: y + 600, s: 0.26, k: 1, t: 0.3 }) + cap('pillowFort k 1 (s 0.26)', 4480, y + 640);
      // SCHOOL
      y = 910;
      o += sec('SCHOOL', 20, y, 4760, 640);
      o += X.sandwich({ x: 180, y: y + 340 }) + cap('sandwich', 180, y + 580) + X.sandwich({ x: 440, y: y + 340, ketchup: true, bite: 0.6 }) + cap('ketchup · bite', 440, y + 580);
      o += X.lunchBag({ x: 690, y: y + 220, name: 'YOU' }) + cap('lunchBag (grip on top)', 690, y + 580);
      o += X.lunchTray({ x: 1100, y: y + 360, s: 0.85, t: 0.4 }) + cap('lunchTray (pizza/broccoli/mystery/milk)', 1100, y + 580);
      o += X.lunchTray({ x: 1560, y: y + 360, s: 0.7, food: ['soup', 'mystery'] }) + cap("food: ['soup','mystery']", 1560, y + 580);
      o += X.ketchupBottle({ x: 1880, y: y + 520, s: 0.8, squeeze: 0.6 }) + cap('ketchupBottle', 1880, y + 580);
      o += X.quizPaper({ x: 2140, y: y + 330, s: 0.9 }) + cap('quizPaper', 2140, y + 580) + X.quizPaper({ x: 2440, y: y + 330, s: 0.9, grade: 'A+' }) + cap("grade 'A+'", 2440, y + 580);
      o += X.bookStack({ x: 2760, y: y + 520 }) + cap('bookStack', 2760, y + 580) + X.bookStack({ x: 3120, y: y + 520, fall: 0.6 }) + cap('fall 0.6', 3120, y + 580);
      o += X.pointer({ x: 3400, y: y + 520, rot: 20, s: 0.8 }) + cap('pointer', 3400, y + 580);
      o += X.paperStack({ x: 3700, y: y + 330, s: 0.9 }) + cap('paperStack', 3700, y + 580) + X.redPen({ x: 3960, y: y + 330, rot: -30 }) + cap('redPen', 3960, y + 580);
      o += X.tablet({ x: 4220, y: y + 320, s: 0.7, screen: scr }) + X.tablet({ x: 4560, y: y + 320, s: 0.7, face: 'back' }) + cap('tablet · back', 4390, y + 580);
      // TOWN / FAIR
      y = 1570;
      o += sec('TOWN · SCIENCE FAIR · TOWN FAIR', 20, y, 4760, 700);
      o += X.groceryBags({ x: 220, y: y + 160, s: 0.8 }) + cap('groceryBags (grip)', 220, y + 640) + X.groceryBags({ x: 560, y: y + 160, s: 0.7, n: 2, spill: 0.6 }) + cap('n 2 · spill', 560, y + 640);
      o += X.ball({ x: 860, y: y + 400 }) + X.ball({ x: 1000, y: y + 400, kind: 'soccer' }) + X.ball({ x: 1140, y: y + 400, kind: 'beach' }) + cap('ball dodge / soccer / beach', 1000, y + 640);
      o += X.paperBoat({ x: 1380, y: y + 480 }) + cap('paperBoat', 1380, y + 640);
      o += X.potatoBattery({ x: 1780, y: y + 520, s: 0.8, glow: 0.3, t: 0.4 }) + cap('potatoBattery glow 0.3', 1780, y + 640);
      o += X.fairMap({ x: 2260, y: y + 380, s: 0.9 }) + cap('fairMap', 2260, y + 640) + X.fairMap({ x: 2580, y: y + 380, s: 0.9, fold: 1 }) + cap('fold 1', 2580, y + 640);
      o += X.dinoBalloon({ x: 2850, y: y + 600, s: 0.75, t: 0.3 }) + cap('dinoBalloon (grip)', 2850, y + 640);
      o += X.cottonCandy({ x: 3120, y: y + 600, s: 1 }) + cap('cottonCandy', 3120, y + 640);
      o += X.championSash({ x: 3480, y: y + 360, s: 0.9 }) + cap('championSash', 3480, y + 640);
      o += X.woodCane({ x: 3760, y: y + 200, s: 0.7 }) + cap('woodCane', 3770, y + 640) + X.ladle({ x: 3960, y: y + 200, s: 0.8 }) + cap('ladle', 3960, y + 640);
      o += X.phone({ x: 4180, y: y + 380, s: 0.8 }) + X.phone({ x: 4400, y: y + 380, s: 0.8, face: 'back' }) + cap('phone · back', 4290, y + 640);
      o += X.gamingPC({ x: 4640, y: y + 560, s: 0.2, t: 0.3, screen: scr }) + cap('gamingPC', 4660, y + 640);
      // CHARACTER OPTIONS
      y = 2290;
      o += sec('CHARACTER OPTIONS (pose fields) — s 0.4', 20, y, 4760, 2190);
      const opts = [
        ['you', { headset: true, face: 'excited' }, 'headset'], ['you', { pajamas: true, face: 'sleepy' }, 'pajamas'], ['you', { backpack: true, face: 'happy' }, 'backpack'], ['you', { backpack: true, view: 'side', face: 'happy' }, 'backpack side'], ['you', { apron: true, face: 'determined', armR: 40, bendR: -100 }, 'apron + bendR'], ['you', { hood: true, face: 'nervous' }, 'hood'], ['you', { armL: 10, armR: 10, bendL: -105, bendR: -105, face: 'smug' }, 'arms crossed (bend)'],
        ['mom', { coffee: true, face: 'happy', t: 0.5 }, 'coffee'], ['mom', { coffee: 'sip', face: 'happy', t: 0.5 }, "coffee 'sip'"], ['mom', { phone: 'ear', face: 'talkHappy' }, "phone 'ear'"], ['mom', { phone: true, face: 'neutral' }, 'phone'], ['mom', { asleep: true, coffee: true, t: 0.3 }, 'asleep'], ['mom', { tired: 1, face: 'happy', flour: 1 }, 'tired 1 · flour 1'], ['mom', { pan: true, face: 'shocked' }, 'pan'], ['mom', { dayoff: true, face: 'happy', view: 'side' }, 'dayoff side'],
        ['grandpa', { armwrestle: true }, 'armwrestle (flex)'], ['grandpa', { armwrestle: 'one', face: 'joy' }, "armwrestle 'one'"], ['grandpa', { sash: true, face: 'talkHappy' }, 'sash'], ['grandpa', { glasses: 'on', face: 'neutral' }, "glasses 'on'"], ['grandpa', { cane: true, face: 'happy' }, 'cane'], ['grandpa', { armL: 12, armR: 12, bendL: -104, bendR: -104, face: 'smug' }, 'arms crossed'],
        ['max', { roar: true }, 'roar'], ['max', { balloon: true, face: 'joy', t: 0.4 }, 'balloon'], ['max', { hood: 'down', face: 'happy' }, "hood 'down'"], ['max', { tablet: true, face: 'excited', screen: scr }, 'tablet'], ['max', { roar: true, view: 'side' }, 'roar side'],
        ['benji', { books: true, face: 'happy' }, 'books'], ['benji', { books: 'drop', bookFall: 0.5, face: 'scared' }, "books 'drop'"], ['benji', { fallen: true }, 'fallen'], ['benji', { potato: true, face: 'excited', glow: 0.3, t: 0.3 }, 'potato'], ['benji', { map: true, face: 'determined' }, 'map'],
        ['tank', { lunch: true, face: 'angry' }, 'lunch'], ['tank', { sandwich: true, face: 'confused' }, 'sandwich'], ['tank', { shy: true }, 'shy'], ['tank', { ketchupLunch: true, shy: true, face: 'happy' }, 'ketchupLunch'], ['tank', { carry: true, face: 'determined' }, 'carry (hero on shoulders)'],
        ['teacher', { pointer: true, face: 'angry' }, 'pointer'], ['teacher', { papers: true, face: 'neutral' }, 'papers'], ['teacher', { glare: 1, pointer: true }, 'glare'], ['teacher', { redPen: true, face: 'smug' }, 'redPen'],
        ['lunchLady', { face: 'smug' }, 'ladle'], ['neighbor', { face: 'happy', bags: 1 }, 'bags 1'], ['benji', { fallen: 'flat', x: 60 }, "fallen 'flat'"],
      ];
      const PER = 15;
      opts.forEach(([k, p, l], i) => {
        const c = i % PER, r = Math.floor(i / PER);
        const x = 180 + c * 310, yy = y + 650 + r * 720;
        const s = k === 'tank' ? 0.3 : 0.4;
        o += KIND(k, 0, { t: 0.7, ...p, x: x + (p.x || 0), y: yy, s }) + cap(`${k} · ${l}`, x + (p.x || 0), yy + 46, INK, l.length > 18 ? 18 : 22);
      });
      return o;
    },
  },

  // ------------------------------------------------------------------ crowds
  crowd: {
    file: 'cast_crowd.png', w: 4000, h: 3200,
    draw() {
      let o = bg(4000, 3200, 'CROWDS — kid(i) / adult(i) flat lite humans', 'no clips, no filters · ≈ 0.6–1 ms each · fixed i = fixed look · kid 0–3 are story kids · the fair crowd below: 96 figures + the family (s 0.16–0.34)', 'home');
      // index grid
      o += card(20, 190, 3960, 1250) + label('kid(i) — i 0..23 (s 0.36)', 50, 250, 36);
      for (let i = 0; i < 24; i++) { const x = 120 + (i % 24) * 160, yy = 760; o += draw.kid(i, { x, y: yy, s: 0.36, face: ['happy', 'neutral', 'joy', 'smug'][i % 4], turn: ((i % 5) - 2) * 0.12, view: i === 13 ? 'side' : i === 19 ? 'back' : 'front' }) + cap(`kid ${i}`, x, yy + 40, INK, 20); }
      o += label('adult(i) — i 0..23 (s 0.36)', 50, 870, 36);
      for (let i = 0; i < 24; i++) { const x = 120 + (i % 24) * 160, yy = 1370; o += draw.adult(i, { x, y: yy, s: 0.36, face: ['happy', 'neutral', 'joy', 'talkHappy'][i % 4], turn: ((i % 5) - 2) * 0.12, view: i === 6 ? 'side' : i === 17 ? 'back' : 'front' }) + cap(`adult ${i}`, x, yy + 40, INK, 20); }
      // fair crowd test (dusk)
      const y0 = 1470;
      o += crop(S.rect(20, y0, 3960, 1710, 0, { fill: '#6A4A8A' }) + S.rect(20, y0 + 900, 3960, 810, 0, { fill: '#C88A5A' }) + S.rect(20, y0, 3960, 900, 0, { fill: '#F2A86A', opacity: 0.35 }), 20, y0, 3960, 1710);
      const figs = [];
      for (let i = 0; i < 96; i++) {
        const row = Math.floor(i / 16), u = (i % 16) / 15;
        const yy = y0 + 1000 + row * 120, s = 0.16 + row * 0.035;
        const x = 140 + u * 3720 + (row % 2) * 110 + Math.sin(i * 3.1) * 40;
        figs.push({ i, x, y: yy, s, kid: i % 3 === 0 });
      }
      figs.sort((a, b) => a.y - b.y);
      for (const fg of figs) o += (fg.kid ? draw.kid : draw.adult)(fg.i + 30, { x: fg.x, y: fg.y, s: fg.s * (fg.kid ? 1 : 1), face: ['happy', 'neutral', 'joy', 'talkHappy'][fg.i % 4], turn: Math.sin(fg.i) * 0.5, view: fg.i % 11 === 0 ? 'back' : fg.i % 7 === 0 ? 'side' : 'front', flip: fg.i % 2 === 0, shadow: true });
      o += draw.max({ x: 2000, y: y0 + 1640, s: 0.34, face: 'joy', balloon: true, t: 0.4 }) + draw.you({ x: 1700, y: y0 + 1660, s: 0.34, face: 'scared' }) + draw.mom({ x: 2300, y: y0 + 1660, s: 0.34, face: 'scared', dayoff: true });
      o += cap('wide fair shot: 96 lite humans (rows s 0.16 → 0.34) + YOU / Max / Mom', 2000, y0 + 60, '#FFFFFF', 34);
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
    const t0 = Date.now();
    fs.writeFileSync(path.join(OUT, sh.file), await r.render(ST.DEFS + sh.draw()));
    await r.close();
    console.log('wrote', path.join(OUT, sh.file), `${Date.now() - t0} ms`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
