// Concept sheets for the "What If Your PARENTS Joined Your Roblox Server?" cast (docs/CAST.md).
// Usage: node tools/concept.js [lineup|avatars|expr|turn|boss|props|all]   -> concept/cast_*.png
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
// warm "house" paper or blue "Cube City" sky backgrounds
function bg(w, h, title, sub, mode = 'house') {
  const id = `cbg${w}x${h}${mode}`;
  const stops = mode === 'game' ? '<stop offset="0" stop-color="#8FD6FF"/><stop offset="1" stop-color="#D8F2FF"/>'
    : mode === 'night' ? '<stop offset="0" stop-color="#1E1440"/><stop offset="1" stop-color="#3A1F5A"/>'
      : '<stop offset="0" stop-color="#FFF6E8"/><stop offset="1" stop-color="#FCE6CF"/>';
  let o = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient></defs>`;
  o += S.rect(0, 0, w, h, 0, { fill: `url(#${id})` });
  let grid = '';
  for (let x = 0; x < w; x += 80) grid += `M${x} 0 L${x} ${h} `;
  for (let y = 0; y < h; y += 80) grid += `M0 ${y} L${w} ${y} `;
  o += S.path(grid, { stroke: mode === 'game' ? '#B8E4FA' : mode === 'night' ? '#2E2460' : '#F4DCC0', 'stroke-width': 2 });
  const dark = mode === 'night';
  o += T(esc(title), w / 2, 96, 76, dark ? '#FFFFFF' : INK) + TF(esc(sub), w / 2, 150, 32, dark ? '#C8B8F0' : '#8A5A6A');
  return o;
}
let clipN = 0;
const crop = (inner, x, y, w, h) => { const id = `ccrop${++clipN}`; return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/></clipPath>` + S.g(inner, null, { 'clip-path': `url(#${id})` }); };
const card = (x, y, w, h, fill = '#FFFFFF', op = 0.6, stroke = '#EBC9A8') => S.rect(x, y, w, h, 18, { fill, opacity: op, stroke, 'stroke-width': 3 });
const sizeOf = (k, i = 0) => {
  const d = k === 'kid' || k === 'noob' ? CAST.noobDesign(i) : k === 'player' ? CAST.playerDesign(i) : k === 'clan' ? CAST.clanDesign(i) : D[k] || D[k + '0'];
  return (d && d.dims && d.dims.size) || 1;
};
// head-and-shoulders of a rig character, head normalised to the same size whatever the character's height
function bust(k, pose, cx, cy, sc = 0.5) {
  const size = sizeOf(k, pose.i || 0);
  const fn = typeof draw[k] === 'function' && ['clan', 'player', 'noob', 'kid'].includes(k) ? (p) => draw[k](p.i || 0, p) : draw[k];
  return S.g(fn({ x: 0, y: 0, s: 1 / size, shadow: false, t: 1.3, nametag: false, ...pose }), `translate(${cx} ${cy}) scale(${sc}) translate(0 1112)`);
}
const pill = (s, x, y, w = 184) => S.rect(x - w / 2, y - 28, w, 40, 20, { fill: INK, opacity: 0.85 }) + TF(esc(s), x, y + 2, 26, '#FFFFFF');
const label = (s, x, y, size = 40, col = INK) => T(esc(s), x, y, size, col, { 'text-anchor': 'start' });
const cap = (t, x, y, col = INK) => TF(esc(t), x, y, 24, col);
const ground = (w, y, h, col = '#F2D2AE', line = '#E0B88C') => S.rect(0, y, w, h, 0, { fill: col }) + S.path(`M0 ${y} L${w} ${y}`, { stroke: line, 'stroke-width': 4 });
const KIND = (k, i, p) => (['clan', 'player', 'noob', 'kid'].includes(k) ? draw[k](i, p) : draw[k](p));

const SHEETS = {
  // ------------------------------------------------------------------ everyone at the same scale
  lineup: {
    file: 'cast_lineup.png', w: 6400, h: 2000,
    draw() {
      let o = bg(6400, 2000, 'WHAT IF YOUR PARENTS JOINED YOUR ROBLOX SERVER? — CAST', 'R6 cut-out rig · vinyl volume · everyone at the same scale (s 0.7) · left: the real house · right: Cube City (game avatars with nametags)');
      const G = 1720, s = 0.7;
      // two worlds: warm floor | game grass
      o += S.rect(0, G, 2420, 280, 0, { fill: '#F2D2AE' }) + S.rect(2420, 200, 3980, G - 200, 0, { fill: '#BFE8FF', opacity: 0.55 }) + S.rect(2420, G, 3980, 280, 0, { fill: '#8FD36A' }) + S.path(`M2420 ${G} L6400 ${G}`, { stroke: '#5DAA3F', 'stroke-width': 5 });
      o += S.path(`M2420 200 L2420 ${G + 280}`, { stroke: '#FFFFFF', 'stroke-width': 8, 'stroke-dasharray': '24 16' });
      o += T('REAL LIFE', 1210, 270, 54, '#B0603A') + T('CUBE CITY', 4410, 270, 54, '#2A6EB8');
      const real = [
        ['you', 260, { face: 'happy', armR: 150, armL: 14, headset: true }, 'YOU', 'the hero · on model'],
        ['dad', 730, { face: 'talkHappy', turn: 0.12, armL: 20, mouse: true }, 'Dad', 'size 1.1'],
        ['mom', 1200, { face: 'happy', turn: 0.08, mug: true }, 'Mom', 'size 1.04'],
        ['grandma', 1640, { face: 'happy', turn: -0.08, knitting: true }, 'Grandma', 'size 0.9'],
        ['momTeen', 2100, { face: 'joy', trophy: true }, 'Mom (1998)', 'size 0.95'],
      ];
      const game = [
        ['you', 2720, { face: 'smug', nametag: 'YOU', crown: true, sword: 'gold', armR: 150 }, 'YOU (avatar)', 'nametag + crown + sword'],
        ['dadAvatar', 3150, { face: 'happy', armL: 30, armR: 40 }, 'DadBod1978', 'the hot dog · size 1.06'],
        ['momAvatar', 3560, { face: 'happy' }, 'MOM_OFFICIAL', 'armor 0 · grey default'],
        ['momAvatar', 3920, { face: 'determined', armor: 1, armR: 60, t: 0.6 }, 'MOM_OFFICIAL', 'armor 1 · golden'],
        ['grandmaAvatar', 4330, { face: 'happy', coins: 1 }, 'GrannyGoodies', 'size 0.94'],
        ['noodle', 4720, { face: 'joy', armL: 140, armR: 150 }, 'NoodleBoi', 'size 0.98'],
        ['darkblade', 5130, { face: 'angry', armR: 70, t: 0.4 }, 'xX_DarkBlade_Xx', 'size 1.0'],
        ['clan', 5480, { i: 0, face: 'angry', turn: -0.2 }, 'clan', 'clan(i)'],
        ['darkbladeMom', 5800, { face: 'angry', nametag: false }, "DarkBlade's mom", 'final gag'],
      ];
      for (const [k, x, pose, name, sub] of [...real, ...game]) {
        o += KIND(k, pose.i || 0, { x, y: G, s, t: 0.8, ...pose });
        if (name) o += T(esc(name), x, G + 84, name.length > 13 ? 34 : 42, INK) + TF(esc(sub), x, G + 124, 24, '#7A5A6A');
      }
      o += draw.noob(0, { x: 6050, y: G, s, face: 'cute', t: 0.6, nametag: true }) + T('THE KID', 6050, G + 84, 36, INK) + TF('noob 0 · size 0.66', 6050, G + 124, 22, '#7A5A6A');
      o += draw.player(4, { x: 6260, y: G, s, face: 'happy', turn: -0.2 }) + T('player 4', 6260, G + 84, 36, INK) + TF('crowds', 6260, G + 124, 22, '#7A5A6A');
      return o;
    },
  },

  // ------------------------------------------------------------------ real person <-> avatar
  avatars: {
    file: 'cast_avatars.png', w: 5600, h: 4400,
    draw() {
      let o = bg(5600, 4400, 'REAL LIFE  ->  CUBE CITY AVATARS', 'each real person next to their avatar (same s 0.62) · avatar options · DarkBlade + clan · players and noobs for crowds');
      const s = 0.62;
      const pair = (x, y, w, title, left, right) => {
        let g = card(x, y, w, 1040, '#FFFFFF', 0.55) + label(title, x + 30, y + 62, 44);
        g += S.rect(x + w / 2 - 4, y + 90, 8, 900, 4, { fill: '#EBC9A8' }) + T('->', x + w / 2, y + 560, 80, '#E8A070');
        const G = y + 960;
        g += S.rect(x + 10, G, w / 2 - 20, 70, 10, { fill: '#F2D2AE' }) + S.rect(x + w / 2 + 10, G, w / 2 - 20, 70, 10, { fill: '#8FD36A' });
        left.forEach(([k, dx, p, c], i) => { g += KIND(k, p.i || 0, { x: x + dx, y: G, s, t: 0.7, ...p }) + cap(c, x + dx, G + 50); });
        right.forEach(([k, dx, p, c]) => { g += KIND(k, p.i || 0, { x: x + w / 2 + dx, y: G, s, t: 0.7, ...p }) + cap(c, x + w / 2 + dx, G + 50); });
        return g;
      };
      o += pair(30, 190, 1820, 'DAD  ->  DadBod1978', [['dad', 210, { face: 'shocked', mouse: true }, "mouse: true · glasses 'up'"], ['dad', 640, { face: 'talkHappy', glasses: 'on', turn: 0.3 }, "glasses: 'on'"]],
        [['dadAvatar', 230, { face: 'happy', armL: 20, armR: 150 }, 'default'], ['dadAvatar', 650, { face: 'joy', mvp: true, armL: 150, armR: 150 }, 'mvp: true']]);
      o += pair(1890, 190, 1820, 'MOM  ->  MOM_OFFICIAL', [['mom', 200, { face: 'happy', tablet: true }, 'tablet: true'], ['mom', 620, { face: 'determined', pajamas: true, headset: true, t: 0.4 }, 'pajamas + headset']],
        [['momAvatar', 220, { face: 'smallSmile' }, 'armor: 0 · "grey is classy"'], ['momAvatar', 650, { face: 'determined', armor: 1, shieldUp: true, armR: 130, t: 0.4 }, 'armor: 1 · shieldUp']]);
      o += pair(3750, 190, 1820, 'GRANDMA  ->  GrannyGoodies', [['grandma', 210, { face: 'confused', phone: 'arm' }, "phone: 'arm'"], ['grandma', 620, { face: 'sleepy', curlers: true }, 'curlers: true']],
        [['grandmaAvatar', 220, { face: 'smug', coins: 1 }, 'cane + money bag'], ['grandmaAvatar', 640, { face: 'happy', apron: true, bag: false, armR: 40 }, 'apron: true']]);
      // YOU + Noodle + DarkBlade row
      let y = 1290;
      o += pair(30, y, 1820, 'YOU  ->  YOU (same avatar)', [['you', 200, { face: 'excited', headset: true }, 'headset: true'], ['you', 620, { face: 'nervous', hood: true, turn: -0.3 }, 'hood: true (tree gag)']],
        [['you', 220, { face: 'smug', nametag: 'YOU', crown: true }, 'nametag + crown'], ['you', 640, { face: 'determined', nametag: 'YOU', sword: 'gold', armR: 120 }, "sword: 'gold'"]]);
      o += card(1890, y, 1820, 1040, '#FFFFFF', 0.55) + label('NoodleBoi', 1920, y + 62, 44);
      const GN = y + 960;
      o += S.rect(1900, GN, 1800, 70, 10, { fill: '#8FD36A' });
      [[{ face: 'joy' }, 'default'], [{ face: 'happy', view: 'side' }, 'side'], [{ face: 'talkHappy', hairnet: true, apron: true }, 'hairnet + apron'], [{ face: 'smug', apron: true, hairnet: true, badge: 'EMPLOYEE OF THE MONTH', armR: 30 }, 'badge: text']].forEach(([p, c], i) => { o += draw.noodle({ x: 2120 + i * 430, y: GN, s, t: 0.5, ...p }) + cap(c, 2120 + i * 430, GN + 50); });
      o += card(3750, y, 1820, 1040, '#FFFFFF', 0.55) + label('xX_DarkBlade_Xx', 3780, y + 62, 44);
      o += S.rect(3760, GN, 1800, 70, 10, { fill: '#8FD36A' });
      [[{ face: 'angry', armR: 120 }, 'default'], [{ face: 'determined', view: 'side', sword: 'back' }, "side · sword: 'back'"], [{ face: 'shocked', shy: true }, 'shy: true'], [{ face: 'dizzy', stars: true, t: 0.3, rot: -8 }, 'stars: true']].forEach(([p, c], i) => { o += draw.darkblade({ x: 3980 + i * 430, y: GN, s, t: 0.5, ...p }) + cap(c, 3980 + i * 430, GN + 50); });
      // clan + darkbladeMom
      y = 2390;
      o += card(30, y, 5540, 900, '#FFFFFF', 0.55) + label('DarkBlade clan · clan(i)  ·  DarkBlade\'s mom (final gag)', 60, y + 62, 44);
      const GC = y + 820;
      o += S.rect(40, GC, 5520, 60, 10, { fill: '#8FD36A' });
      for (let i = 0; i < 5; i++) o += draw.clan(i, { x: 260 + i * 470, y: GC, s, face: ['angry', 'determined', 'smug', 'angry', 'shocked'][i], turn: ((i % 3) - 1) * 0.25, t: 0.4 }) + cap(`clan ${i}`, 260 + i * 470, GC + 44);
      o += draw.clan(1, { x: 2600, y: GC, s, view: 'side', face: 'angry', armL: 120 }) + cap('side', 2600, GC + 44);
      o += draw.darkbladeMom({ x: 3300, y: GC, s, face: 'angry' }) + cap('darkbladeMom', 3300, GC + 44);
      o += draw.darkbladeMom({ x: 3800, y: GC, s, face: 'smug', rollingPin: false, view: 'side' }) + cap('side · rollingPin: false', 3800, GC + 44);
      o += draw.darkblade({ x: 4420, y: GC, s, face: 'scared', shy: true, turn: -0.4 }) + cap('...MOM?!', 4420, GC + 44);
      o += draw.momAvatar({ x: 5050, y: GC, s, face: 'happy', armor: 1, shield: false, sword: false, armL: 150 }) + cap('Mrs. Mom', 5050, GC + 44);
      // players + noobs
      y = 3320;
      o += card(30, y, 5540, 1050, '#FFFFFF', 0.55) + label('players  ·  draw.player(i, pose)          noobs  ·  draw.noob(i, pose) / kid(i) — noob 0 = THE KID', 60, y + 62, 44);
      const GP = y + 560, GK = y + 980;
      o += S.rect(40, GP, 5520, 40, 10, { fill: '#8FD36A' }) + S.rect(40, GK, 5520, 40, 10, { fill: '#8FD36A' });
      for (let i = 0; i < 16; i++) o += draw.player(i, { x: 200 + i * 340, y: GP, s: 0.42, face: ['happy', 'neutral', 'excited', 'shocked'][i % 4], turn: ((i % 5) - 2) * 0.15, view: i === 7 ? 'side' : i === 12 ? 'back' : 'front', sword: i % 5 === 1, armR: i % 5 === 1 ? 120 : 9 }) + cap(`player ${i}`, 200 + i * 340, GP + 32);
      for (let i = 0; i < 16; i++) o += draw.noob(i, { x: 200 + i * 340, y: GK, s: 0.42, face: ['happy', 'neutral', 'cute', 'shocked'][i % 4], t: 0.3 + i * 0.1, nametag: i === 0, view: i === 9 ? 'side' : 'front' }) + cap(i === 0 ? 'noob 0 = THE KID' : `noob ${i}`, 200 + i * 340, GK + 32);
      return o;
    },
  },

  // ------------------------------------------------------------------ expressions + side/back
  expr: {
    file: 'cast_expressions.png', w: 3520, h: 4610,
    draw() {
      let o = bg(3520, 4610, 'THE CAST — EXPRESSIONS', 'eight faces each + side and back · avatars lip-sync too (NoodleBoi on the bowl, the hot dog in its face hole; DarkBlade has NO mouth: his eyes pulse with his voice)');
      const CW = 316, X0 = 250, Y0 = 186, RH = 370;
      const rows = {
        you: ['neutral', 'happy', 'joy', 'smug', 'shocked', 'scared', 'sad', { name: 'angry', label: 'angry · rage-quit' }],
        dad: [{ name: 'talkHappy', label: 'proud' }, 'joy', 'confused', { name: 'determined', label: 'SPACE! BAR!', mouth: 'scream' }, 'sad', { name: 'nervous', label: 'nervous' }, 'love', { name: 'sleepy', label: 'sleepy', sleepy: true }],
        mom: ['neutral', 'happy', 'talkHappy', { name: 'smug', label: 'game face', headset: true }, 'shocked', 'sad', { name: 'determined', label: 'stern' }, { name: 'sleepy', label: 'five more min', pajamas: true }],
        grandma: ['neutral', 'happy', 'smug', 'confused', { name: 'angry', label: 'MY COOKIES!', mouth: 'scream' }, 'sneaky', 'shocked', { name: 'happy', label: 'curlers', curlers: true }],
        momTeen: ['neutral', 'happy', 'joy', 'smug', 'excited', 'shocked', 'determined', 'love'],
        dadAvatar: ['neutral', 'happy', 'joy', 'shocked', { name: 'determined', label: 'JUMP!', mouth: 'scream' }, 'sad', 'dizzy', { name: 'joy', label: 'mvp', mvp: true }],
        noodle: ['neutral', 'happy', 'joy', 'excited', 'shocked', 'sad', 'nervous', { name: 'scream', label: 'LEGEND!' }],
        darkblade: [{ name: 'neutral', label: 'neutral' }, 'angry', { name: 'angry', label: 'talking (glow)', mouth: 'D' }, 'shocked', 'happy', 'oof', { name: 'nervous', label: 'shy', shy: true }, { name: 'scared', label: 'MOM?!', shy: true }],
        momAvatar: ['neutral', 'happy', { name: 'determined', label: 'armour', armor: 1 }, { name: 'talkHappy', label: 'good game!', armor: 1 }, 'shocked', 'smug', 'angry', 'love'],
        grandmaAvatar: ['neutral', 'happy', 'smug', 'rich', 'shocked', 'angry', 'sneaky', 'love'],
        kid: [{ name: 'neutral', label: 'noob 0' }, 'happy', 'cute', 'shocked', 'sad', 'joy', { name: 'neutral', label: 'player 3', i: 3, kind: 'player' }, { name: 'happy', label: 'player 8', i: 8, kind: 'player' }],
      };
      Object.entries(rows).forEach(([k, faces], r) => {
        const y = Y0 + r * RH;
        o += T(esc(NAMES[k] || k), 125, y + RH / 2 - 10, (NAMES[k] || k).length > 9 ? 26 : 40, INK);
        const cols = [...faces, 'side', 'back'];
        cols.forEach((n, i) => {
          const x = X0 + i * CW;
          const lbl = typeof n === 'string' ? n : n.label;
          const { label: _l, name, mouth, eyes, fx, kind, ...opts } = typeof n === 'string' ? {} : n;
          const face = typeof n === 'string' ? n : { name, mouth, eyes, fx };
          const pose = n === 'side' ? { view: 'side', face: 'talkHappy' } : n === 'back' ? { view: 'back' } : { face, turn: i % 2 ? 0.16 : 0, ...opts };
          const kk = kind || k;
          o += card(x + 8, y + 8, CW - 16, RH - 16) + crop(bust(kk, { t: 0.4, ...pose }, x + CW / 2, y + 12, kk === 'dadAvatar' ? 0.42 : 0.5), x + 8, y + 8, CW - 16, RH - 16);
          o += pill(lbl, x + CW / 2, y + RH - 24, 190);
        });
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
      const RIGS = [['you', {}], ['dad', {}], ['mom', {}], ['grandma', {}], ['momTeen', {}], ['dadAvatar', {}], ['momAvatar', {}], ['momAvatar', { armor: 1 }], ['grandmaAvatar', {}], ['noodle', {}], ['darkblade', {}], ['darkbladeMom', {}]];
      RIGS.forEach(([k, extra], i) => {
        const bx = 20 + (i % 2) * BW, by = 190 + Math.floor(i / 2) * BH;
        o += card(bx, by, BW - 20, BH - 20);
        o += T(esc((NAMES[k] || k) + (extra.armor ? ' · armor 1' : '')), bx + BW / 2 - 10, by + BH - 44, 38, INK);
        const s = 0.38;
        views.forEach((v, j) => { o += KIND(k, 0, { x: bx + 170 + j * VW, y: by + BH - 110, s, t: 0.6, face: v.view === 'back' ? 'neutral' : 'happy', nametag: false, ...extra, ...v }); });
      });
      return o;
    },
  },

  // ------------------------------------------------------------------ the Block King
  boss: {
    file: 'cast_boss.png', w: 4800, h: 3400,
    draw() {
      let o = bg(4800, 3400, 'THE BLOCK KING — draw.blockKing(pose) / actor(\'boss\', …)', 'non-rig boss · ≈ 1220 tall at s 1 (use s 1.5–4 to fill the sky) · pose idle | rise | smash (k) | roar | hit · crack · shield · rise · jaw follows the BOSS voice', 'night');
      const G1 = 1560, G2 = 3140;
      o += S.rect(0, G1, 4800, 40, 0, { fill: '#2A1F45' }) + S.rect(0, G2, 4800, 260, 0, { fill: '#2A1F45' });
      const row1 = [
        [{ pose: 'idle' }, 'idle'], [{ pose: 'rise', rise: 0.55 }, "rise 0.55 · pose 'rise'"], [{ pose: 'roar' }, "roar · jaw 1"], [{ pose: 'smash', k: 0 }, "smash k 0"], [{ pose: 'smash', k: 1 }, 'smash k 1'],
      ];
      row1.forEach(([p, c], i) => { const x = 470 + i * 940; o += draw.blockKing({ x, y: G1, s: 0.72, t: 0.7, ...p }) + cap(c, x, G1 + 34, '#FFFFFF'); });
      const row2 = [
        [{ pose: 'hit' }, 'hit'], [{ crack: 0.45, face: 'angry' }, 'crack 0.45'], [{ crack: 0.8, pose: 'hit', t: 1.2 }, 'crack 0.8 (bursting)'], [{ shield: 1, face: { name: 'angry', mouth: 'D' } }, 'shield 1 · talking'],
      ];
      row2.forEach(([p, c], i) => { const x = 470 + i * 900; o += draw.blockKing({ x, y: G2, s: 0.72, t: 0.7, ...p }) + cap(c, x, G2 + 34, '#FFFFFF'); });
      // scale check: hero + hot dog at s 0.5 next to the boss at s 2 (cropped)
      const bx = 4320;
      o += crop(S.rect(3880, 1680, 880, 1440, 0, { fill: '#3A2A6A' }) + draw.blockKing({ x: bx + 120, y: G2 - 20, s: 1.15, t: 0.4, pose: 'roar' }) + draw.you({ x: 4000, y: G2 - 20, s: 0.32, face: 'scared', nametag: 'YOU', crown: true }) + draw.dadAvatar({ x: 4140, y: G2 - 20, s: 0.32, face: 'shocked', nametag: false }), 3880, 1680, 880, 1440);
      o += cap('scale: boss s 1.15 vs YOU/hot dog s 0.32', 4320, G2 + 34, '#FFFFFF');
      return o;
    },
  },

  // ------------------------------------------------------------------ props + character options
  props: {
    file: 'cast_props.png', w: 4800, h: 4300,
    draw() {
      let o = bg(4800, 4300, 'PROPS AND CHARACTER OPTIONS', 'rig/extras.js (positional (x, y, s, rot, opts) or one object) · props authored at the hero\'s body scale · devices take screen: svg | fn(w, h)');
      const sec = (t, x, y, w, h) => card(x, y, w, h) + label(t, x + 24, y + 54, 36);
      const scr = (w, h) => S.rect(0, 0, w, h, 0, { fill: '#7FD3FF' }) + S.rect(0, h * 0.72, w, h * 0.28, 0, { fill: '#5DBB4A' }) + draw.dadAvatar({ x: w * 0.5, y: h * 0.86, s: h / 2200, face: 'happy', nametag: false }) + T('JUMP!', w * 0.25, h * 0.3, h * 0.16, '#FFE14D', { stroke: '#151515', 'stroke-width': h * 0.02, 'paint-order': 'stroke' });
      // DEVICES
      let y = 190;
      o += sec('DEVICES (each shows game footage via screen)', 20, y, 4760, 760);
      o += X.laptopOld({ x: 420, y: y + 640, s: 0.8, screen: scr }) + cap('laptopOld · screen 520×330', 420, y + 700);
      o += X.laptopOld({ x: 1010, y: y + 640, s: 0.7, face: 'lid', glow: 1 }) + cap("face: 'lid' (sticker)", 1010, y + 700);
      o += X.laptopOld({ x: 1440, y: y + 640, s: 0.7, face: 'side', open: 0.8 }) + cap("face: 'side'", 1440, y + 700);
      o += X.tablet({ x: 1840, y: y + 400, s: 0.8, screen: scr }) + cap('tablet · 300×420', 1840, y + 700);
      o += X.tablet({ x: 2160, y: y + 400, s: 0.8, face: 'back' }) + cap("face: 'back'", 2160, y + 700);
      o += X.phone({ x: 2430, y: y + 400, s: 0.9, screen: scr }) + X.phone({ x: 2640, y: y + 400, s: 0.9, face: 'back' }) + cap('phone 176×340 · back', 2535, y + 700);
      o += X.gamingPC({ x: 3420, y: y + 600, s: 0.8, screen: scr, t: 1.3, glow: 1 }) + cap('gamingPC · 660×372 · RGB (t)', 3600, y + 700);
      // KITCHEN / HOUSE
      y = 970;
      o += sec('HOUSE', 20, y, 4760, 640);
      o += X.teaMug({ x: 140, y: y + 330, t: 0.4 }) + cap("teaMug ('#1 MOM')", 150, y + 560);
      o += X.teaCup({ x: 380, y: y + 380, t: 0.4 }) + cap('teaCup', 380, y + 560);
      o += X.cookie({ x: 560, y: y + 300 }) + X.cookie({ x: 680, y: y + 300, bite: 0.7 }) + cap('cookie · bite', 620, y + 560);
      o += X.cookieTray({ x: 940, y: y + 360, steam: 1, t: 0.4 }) + cap('cookieTray', 940, y + 560);
      o += X.cereal({ x: 1350, y: y + 480, s: 0.9 }) + cap('cereal (spoon)', 1300, y + 560);
      o += X.cereal({ x: 1720, y: y + 480, s: 0.9, fall: 0.6 }) + cap('fall 0.6', 1720, y + 560);
      o += X.familyPhoto({ x: 2100, y: y + 330, title: 'FAMILY' }) + cap('familyPhoto', 2100, y + 560);
      o += X.blanket({ x: 2560, y: y + 110, s: 0.8 }) + cap('blanket', 2560, y + 560);
      o += X.knittingYarn({ x: 2960, y: y + 260, s: 0.9 }) + cap('knittingYarn', 3000, y + 560);
      o += X.computerMouse({ x: 3360, y: y + 300, rot: 15 }) + cap('computerMouse', 3360, y + 560);
      o += X.arcadeTrophy({ x: 3750, y: y + 600, s: 0.85, t: 0.4 }) + cap('arcadeTrophy', 3750, y + 620);
      o += X.rollingPin({ x: 4320, y: y + 300, rot: -20, flour: 1 }) + cap('rollingPin', 4320, y + 560);
      // GAME
      y = 1630;
      o += sec('CUBE CITY', 20, y, 4760, 640);
      ['gold', 'steel', 'dark'].forEach((k, i) => { o += X.goldSword({ x: 160 + i * 150, y: y + 500, kind: k, rot: -8 + i * 8 }) + cap(k, 160 + i * 150, y + 600); });
      o += cap('goldSword', 310, y + 140);
      o += X.potion({ x: 720, y: y + 380 }) + X.potion({ x: 900, y: y + 380, col: '#3BD16F', glow: 1, label: '' }) + cap('potion', 810, y + 600);
      o += X.coinBag({ x: 1160, y: y + 220, coins: 1 }) + cap('coinBag', 1160, y + 600);
      o += X.potLid({ x: 1500, y: y + 360, flash: 1 }) + cap('potLid (shield)', 1500, y + 600);
      o += X.cane({ x: 1800, y: y + 160, s: 0.7 }) + cap('cane', 1800, y + 600);
      o += X.axe({ x: 2040, y: y + 520 }) + cap('axe (clan)', 2040, y + 600);
      o += X.mvpMedal({ x: 2320, y: y + 380 }) + cap('mvpMedal', 2320, y + 600);
      o += X.employeeFrame({ x: 2700, y: y + 360, s: 0.75, inner: draw.noodle({ x: 0, y: 0, s: 0.2, face: 'joy', nametag: false, hairnet: true }) }) + cap('employeeFrame', 2700, y + 600);
      o += X.cookie({ x: 3080, y: y + 360, r: 90, glow: 1 }) + cap('cookie r 90 glow', 3080, y + 600);
      o += X.tablet({ x: 3500, y: y + 360, s: 0.6, landscape: true, screen: scr }) + cap('tablet landscape', 3500, y + 600);
      o += X.phone({ x: 4000, y: y + 360, s: 0.8, style: 'plain', screen: scr }) + cap("phone style 'plain'", 4000, y + 600);
      o += X.laptopOld({ x: 4480, y: y + 560, s: 0.5, screen: scr, off: 0.7 }) + cap('off 0.7', 4480, y + 600);
      // CHARACTER OPTIONS
      y = 2290;
      o += sec('CHARACTER OPTIONS (pose fields)', 20, y, 4760, 1990);
      const opts = [
        ['you', { headset: true, face: 'excited' }, 'headset'], ['you', { headset: 0.4, face: 'determined' }, 'headset: 0.4'], ['you', { hood: true, face: 'nervous' }, 'hood'], ['you', { hood: true, view: 'side', face: 'scared' }, 'hood side'], ['you', { crown: true, nametag: 'YOU', face: 'smug' }, 'crown + nametag'], ['you', { sword: true, armR: 60, face: 'determined' }, 'sword: true'], ['you', { sword: 'gold', armR: 150, face: 'joy' }, "sword 'gold' up"],
        ['dad', { glasses: 'on', face: 'confused' }, "glasses: 'on'"], ['dad', { glasses: 'off', face: 'sad' }, "glasses: 'off'"], ['dad', { mouse: true, face: 'talkHappy' }, 'mouse'], ['dad', { blanket: true, sleepy: true }, 'blanket + sleepy'], ['dad', { view: 'side', mouse: true, face: 'happy' }, 'mouse side'],
        ['mom', { mug: true, face: 'happy' }, 'mug'], ['mom', { mug: true, mugUp: true, face: 'smallSmile' }, 'mugUp'], ['mom', { tablet: true, face: 'neutral' }, 'tablet'], ['mom', { pajamas: true, face: 'sleepy' }, 'pajamas'], ['mom', { pajamas: true, headset: 0.5, cup: false, face: 'determined' }, 'headset 0.5'],
        ['grandma', { knitting: true, face: 'happy' }, 'knitting'], ['grandma', { phone: 'arm', face: 'confused' }, "phone: 'arm'"], ['grandma', { cracking: 1, face: 'determined' }, 'cracking'], ['grandma', { curlers: true, face: 'sleepy' }, 'curlers'],
        ['momTeen', { trophy: 'up', face: 'joy' }, "trophy: 'up'"],
        ['dadAvatar', { mvp: true, face: 'joy', armL: 150, armR: 150 }, 'mvp'], ['dadAvatar', { view: 'side', face: 'happy' }, 'side'], ['dadAvatar', { view: 'back' }, 'back'],
        ['momAvatar', { armor: 1, glasses: false, face: 'angry' }, 'glasses: false'], ['momAvatar', { armor: 1, shieldUp: true, face: 'determined' }, 'shieldUp'], ['momAvatar', { armor: 1, view: 'back', t: 0.5 }, 'cape (back)'],
        ['grandmaAvatar', { apron: true, face: 'happy' }, 'apron'],
      ];
      opts.forEach(([k, p, l], i) => {
        const c = i % 15, r = Math.floor(i / 15);
        const x = 180 + c * 310, yy = y + 820 + r * 950;
        o += KIND(k, 0, { x, y: yy, s: 0.42, t: 0.7, ...p }) + cap(`${k} · ${l}`, x, yy + 46);
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
    const r = await openRenderer(sh.w, sh.h, { staticDefs: X.DEFS });
    S.resetIds();
    const t0 = Date.now();
    fs.writeFileSync(path.join(OUT, sh.file), await r.render(ST.DEFS + sh.draw()));
    await r.close();
    console.log('wrote', path.join(OUT, sh.file), `${Date.now() - t0} ms`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
