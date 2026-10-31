// Builds the concept sheets for the hero: turnaround, expressions, mouth chart,
// poses and rig breakdown.  Usage: node tools/sheets.js [all|turnaround|expressions|mouths|poses|rig]
'use strict';

const path = require('path');
const S = require('../rig/svg');
const C = require('../rig/palette');
const { drawHero, drawHeadFront } = require('../rig/hero');
const F = require('../rig/face');
const { egg } = require('../rig/props');
const { openRenderer } = require('./render');
const fs = require('fs');

const OUT = path.join(__dirname, '..', 'concept');
const HERO_NAME = 'YOU';

function gridBg(w, h, step = 40) {
  let o = S.rect(0, 0, w, h, 0, { fill: '#F2F6FC' });
  let d = '', D = '';
  for (let x = 0; x <= w; x += step) (x % (step * 5) ? (d += `M${x} 0 L${x} ${h}`) : (D += `M${x} 0 L${x} ${h}`));
  for (let y = 0; y <= h; y += step) (y % (step * 5) ? (d += `M0 ${y} L${w} ${y}`) : (D += `M0 ${y} L${w} ${y}`));
  o += S.path(d, { stroke: '#DCE6F3', 'stroke-width': 1.5, fill: 'none' });
  o += S.path(D, { stroke: '#C3D3E8', 'stroke-width': 2.5, fill: 'none' });
  return o;
}

const label = (txt, x, y, size = 44, anchor = 'middle', fill = '#1d2433', weight = 700) =>
  S.el('text', { x, y, 'font-family': 'Fredoka, sans-serif', 'font-weight': weight, 'font-size': size, fill, 'text-anchor': anchor }, txt);

const title = (txt, sub, w) =>
  S.el('text', { x: 60, y: 92, 'font-family': 'Lilita One, sans-serif', 'font-size': 72, fill: '#1d2433' }, txt) +
  (sub ? label(sub, 60, 140, 32, 'start', '#5b6780', 600) : '');

// ---------------------------------------------------------------- sheets
const SHEETS = {
  turnaround: {
    w: 2560, h: 1440,
    draw() {
      const W = 2560, G = 1330, s = 1.08;
      let o = gridBg(W, 1440) + title('HERO — TURNAROUND', 'front · three-quarter · side · back', W);
      o += S.path(`M0 ${G} L${W} ${G}`, { stroke: '#9fb4d0', 'stroke-width': 4 });
      const views = [
        ['FRONT', { view: 'front' }],
        ['3/4', { view: 'front', turn: 1 }],
        ['SIDE', { view: 'side' }],
        ['BACK', { view: 'back' }],
      ];
      views.forEach(([name, v], i) => {
        const x = 360 + i * 620;
        o += drawHero({ x, y: G, s, ...v });
        o += label(name, x, 230, 46);
      });
      return o;
    },
  },

  expressions: {
    w: 2560, h: 1460,
    draw() {
      const names = ['neutral', 'happy', 'talkHappy', 'joy', 'excited', 'amazed', 'shocked', 'scared', 'scream', 'angry',
        'determined', 'sad', 'crying', 'smug', 'deadpan', 'nervous', 'confused', 'sneaky', 'yuck', 'dizzy',
        'rich', 'love', 'oof', 'sleepy', 'cute'];
      let o = gridBg(2560, 1460) + title('HERO — EXPRESSIONS', 'eyes, brows (hair V-notch) and mouth are swappable layers', 2560);
      const cols = 7, cw = 350, ch = 300, x0 = 205, y0 = 190;
      names.forEach((n, i) => {
        const cx = x0 + (i % cols) * cw, cy = y0 + Math.floor(i / cols) * ch;
        const s = 0.5;
        o += S.g(drawHeadFront(n, 0, true), `translate(${cx} ${cy + 120}) scale(${s}) translate(0 757)`);
        o += label(n, cx, cy + 250, 30);
      });
      return o;
    },
  },

  mouths: {
    w: 2560, h: 1100,
    draw() {
      let o = gridBg(2560, 1100) + title('HERO — LIP-SYNC MOUTHS', 'Rhubarb-style viseme set: driven automatically from the voice-over', 2560);
      const info = { X: 'rest / pause', A: 'M · B · P', B: 'K · S · T · EE', C: 'EH · AE', D: 'AA (wide)', E: 'AO · ER', F: 'UW · OO · W', G: 'F · V', H: 'L' };
      F.VISEMES.forEach((v, i) => {
        const cx = 160 + i * 280, cy = 470;
        const face = { name: 'talkHappy', mouth: v };
        o += S.g(drawHeadFront(face, 0, true), `translate(${cx} ${cy}) scale(0.56) translate(0 757)`);
        o += label(v, cx, cy + 190, 64);
        o += label(info[v], cx, cy + 236, 28, 'middle', '#5b6780', 600);
      });
      // extra acting mouths
      const extra = ['line', 'smile', 'grin', 'bigGrin', 'o', 'O', 'scream', 'wavy', 'teeth', 'tongue', 'smirk', 'frown', 'cat', 'wail', 'yawn', 'uh'];
      extra.forEach((m, i) => {
        const cx = 120 + i * 155, cy = 900;
        o += S.rect(cx - 66, cy - 66, 132, 132, 22, { fill: '#fff', stroke: '#C3D3E8', 'stroke-width': 3 });
        o += S.g(F.mouth(m, 0, 0), `translate(${cx} ${cy}) scale(0.9)`);
        o += label(m, cx, cy + 106, 24, 'middle', '#5b6780', 600);
      });
      return o;
    },
  },

  poses: {
    w: 2560, h: 1640,
    draw() {
      let o = gridBg(2560, 1640) + title('HERO — POSES', 'every pose is just rig parameters — nothing is redrawn', 2560);
      const s = 0.62;
      const items = [
        ['idle + nametag', { face: 'neutral', nametag: { name: HERO_NAME, health: 1 } }],
        ['wave + talk', { armR: 150, armL: 6, face: 'talkHappy', headRot: -4, turn: -0.25 }],
        ['cheer!', { armL: 162, armR: 162, face: 'joy', lift: 70, sy: 1.04, sx: 0.97 }],
        ['shock', { armL: 72, armR: 72, face: 'shocked', lift: 30, sy: 1.06, sx: 0.95, headY: -14 }],
        ['T-pose', { armL: 90, armR: 90, face: 'deadpan' }],
        ['steal the egg', { turn: 0.85, bodyY: 34, lean: 6, armL: -30, armR: -18, face: 'sneaky', props: [{ svg: egg({ x: 18, y: -385, size: 250, rarity: 'legendary', glow: false }), layer: 'mid' }] }],
        ['RUN!', { view: 'side', legL: 34, legR: -30, armL: -40, armR: 44, lean: -8, face: 'scream', lift: 20 }],
        ['oof (fall)', { rot: -24, armL: 140, armR: 120, legL: 22, legR: -10, face: 'oof', lift: 90 }],
      ];
      items.forEach(([name, pz], i) => {
        const col = i % 4, row = Math.floor(i / 4);
        const x = 330 + col * 640, G = row ? 1530 : 850;
        o += drawHero({ x, y: G, s, ...pz });
        o += label(name, x, G + 62, 36);
      });
      return o;
    },
  },

  rig: {
    w: 2560, h: 1440,
    draw() {
      const H = require('../rig/hero');
      let o = gridBg(2560, 1440) + title('HERO — RIG', 'cut-out parts on pivots (red) · smooth turn parameter · brows = hair V-notch', 2560);
      const s = 0.78, ox = 560, oy = 1330;
      const dot = (x, y) => S.circle(x, y, 14, { fill: '#E8243C', stroke: '#fff', 'stroke-width': 6 });
      let parts = '';
      // legs (pulled down/out)
      for (const sd of [-1, 1]) parts += S.g(H.drawLeg({ shade: true }), `translate(${sd * 98} ${-306 + 70}) scale(${sd} 1)`);
      parts += H.drawTorsoFront(0, true);
      for (const sd of [-1, 1]) parts += S.g(H.drawArm({ shade: true }), `translate(${sd * 205} -515) scale(${sd} 1) rotate(-9)`);
      parts += S.g(H.drawHeadFront('neutral', 0, true), 'translate(0 -110)');
      for (const [x, y] of [[0, -560 - 110], [-205, -515], [205, -515], [-98, -306 + 70], [98, -306 + 70]]) parts += dot(x, y);
      o += S.g(parts, `translate(${ox} ${oy}) scale(${s})`);
      const L = (t, x, y, sz = 28, c = '#5b6780') => label(t, x, y, sz, 'middle', c, 600);
      o += L('head · hair · face layers', ox, oy - 1110 * s, 30, '#1d2433');
      o += L('neck', ox + 60, oy - 680 * s + 10, 26, '#E8243C');
      o += L('arm (R6, no elbow)', ox - 330, oy - 330 * s, 26, '#1d2433');
      o += L('shoulder', ox - 205 * s, oy - 515 * s - 30, 26, '#E8243C');
      o += L('torso', ox, oy - 420 * s, 30, '#fff');
      o += L('hip', ox + 150, oy - 236 * s + 8, 26, '#E8243C');
      o += L('leg + sneaker', ox + 300, oy - 120 * s, 26, '#1d2433');

      // turn strip
      o += label('turn  −1 → +1  (any value in between)', 1800, 250, 36, 'middle', '#1d2433', 700);
      [-1, -0.5, 0, 0.5, 1].forEach((t, i) => {
        const x = 1290 + i * 255;
        o += drawHero({ x, y: 760, s: 0.44, turn: t, armL: 9, armR: 9, face: 'neutral' });
        o += L(String(t), x, 815, 30, '#1d2433');
      });
      // brow notch strip
      o += label('brows = the V-notch in the fringe', 1800, 920, 36, 'middle', '#1d2433', 700);
      const brows = [['neutral', 'neutral'], ['raised', 'amazed'], ['angry', 'angry'], ['worried', 'sad'], ['one up', 'confused']];
      brows.forEach(([n, e], i) => {
        const x = 1290 + i * 255;
        const face = { name: e, fx: [] };
        o += S.g(H.drawHeadFront(face, 0, true), `translate(${x} 1120) scale(0.5) translate(0 757)`);
        o += L(n, x, 1290, 28, '#1d2433');
      });
      return o;
    },
  },
};

async function main() {
  const which = process.argv[2] || 'all';
  const list = which === 'all' ? ['turnaround', 'expressions', 'mouths', 'poses', 'rig'] : which.split(',');
  fs.mkdirSync(OUT, { recursive: true });
  for (const name of list) {
    const sh = SHEETS[name];
    const r = await openRenderer(sh.w, sh.h);
    S.resetIds();
    const out = path.join(OUT, `${name}.png`);
    fs.writeFileSync(out, await r.render(sh.draw()));
    await r.close();
    console.log('wrote', out);
  }
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { SHEETS, gridBg, label, title, HERO_NAME };
