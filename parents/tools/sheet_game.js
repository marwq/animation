// Contact sheet of the CUBE CITY game sets (scenes/sets_game.js) -> concept/sets_game.png
// Usage:
//   node tools/sheet_game.js                      all tiles -> concept/sets_game.png (3 columns, 640x360 tiles)
//   node tools/sheet_game.js --only plaza,arena   just those tiles (by key prefix)
//   node tools/sheet_game.js --full DIR           also write every tile as a full 1920x1080 PNG into DIR
//   node tools/sheet_game.js --noref              no hero / anchor marks (default: the hero YOU stands on stand lines at the set's s)
//   node tools/sheet_game.js --out FILE --t 2.3   output file / time
// Prints per tile: elements, JS build ms and browser render ms of the SET ALONE (all layers, no hero, minus an empty-frame
// baseline; median of 5) — the budget is < 90 ms build + render.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const S = require('../rig/svg');
const { openRenderer } = require('./render');
const X = require('../scenes/sets_game');

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const ONLY = arg('--only') ? arg('--only').split(',') : null;
const FULL = arg('--full');
const REF = !args.includes('--noref');
const OUT = arg('--out') || path.join(__dirname, '..', 'concept', 'sets_game.png');
const T0 = Number(arg('--t') || 2.3);

// the hero (YOU) for scale: s .5 ~ 475 px tall (r6 default construction + his colours)
const R6 = require('../rig/r6');
const hero = R6.makeDraw(R6.makeDesign({ col: { jacket: '#D8262E', jacketLine: '#B01D24', shirt: '#F2D04A', shirtShade: '#D9B73A', pants: '#1F3B2A', pantsShade: '#162C1F' } }));
let refOn = true;
const on = () => REF && refOn;
const line = (y, col = '#FF2E63', x0 = -4000, x1 = 8000) => `<path d="M${x0} ${y} L${x1} ${y}" stroke="${col}" stroke-width="3" stroke-dasharray="14 10" opacity="0.8"/>`;
const H = (x, y, s, pose = {}) => (on() ? hero({ x, y, s, shade: true, shadow: true, ...pose }) : '');
const HL = (x, y, s, pose = {}) => (on() ? hero({ x, y, s, shade: true, shadow: true, ...pose }) + line(y) : '');
const mark = (x, y, col = '#FF2E63', r = 9) => (on() ? `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${col}" stroke-width="4"/><path d="M${x - 16} ${y} h32 M${x} ${y - 16} v32" stroke="${col}" stroke-width="3"/>` : '');
const box = (x, y, w, h, col = '#FFFFFF') => (on() ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${col}" stroke-width="5" stroke-dasharray="18 10"/>` : '');
const bgCard = (c1 = '#2A2246', c2 = '#3E3366') => `<defs><linearGradient id="sheetBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect x="0" y="0" width="1920" height="1080" fill="url(#sheetBg)"/>`;
const V = (cam, svg, k = 1) => (svg ? `<g transform="${X.camTf(cam, k)}">${svg}</g>` : '');
// camera set with characters: behind = before L.front, floor = after L.front (both world space, k 1 unless anchors say)
const LC = (fn, t, cam, o, behind = '', floor = '') => { const l = fn.layers(t, cam, o); return l.bg + l.mid + V(cam, behind) + l.front + V(cam, floor) + l.fg + l.light; };
// room set through a camera
const LR = (fn, t, o, behind = '', floor = '', cam = {}) => fn.compose(t, o, behind, floor, cam);
const quad4 = (svgs) => svgs.map((v, i) => `<svg x="${(i % 2) * 960}" y="${Math.floor(i / 2) * 540}" width="960" height="540" viewBox="0 0 1920 1080">${v}</svg>`).join('') + '<path d="M960 0 V1080 M0 540 H1920" stroke="#000" stroke-width="6"/>';
const SP = X.SPOTS, FL = X.FLOOR;
const has = (k) => typeof X[k] === 'function';
// hero on a crowd stand line (a few copies) + line marks
const onLines = (lines, every = 700, pose = {}) => (on() ? lines.map((l, i) => { let s = line(l.y, i % 2 ? '#FFE14D' : '#FF2E63'); for (let x = l.x0 + 120 + (i * 230) % every; x < l.x1; x += every) s += hero({ x, y: l.y, s: l.s, shade: true, shadow: true, ...pose }); return s; }).join('') : '');

const TILES = [];
const tile = (key, label, fn) => TILES.push([key, label, fn]);

// ---------------------------------------------------------------- PLAZA
if (has('plaza')) {
  const Z = SP.plaza;
  tile('plaza', 'plaza · day · cams.wide (pads, sign, fountain, wall, obby)', (t) => LC(X.plaza, t, Z.cams.wide, {}, '', Z.pads.map((p) => H(p.x, p.y, p.s)).join('') + H(Z.wall.dad.x, Z.wall.dad.y, Z.wall.dad.s, { view: 'side', flip: true })));
}

(async () => {
  const tiles = TILES.filter(([k]) => !ONLY || ONLY.some((o) => k.startsWith(o)));
  const r = await openRenderer(1920, 1080, { staticDefs: X.DEFS + require('../rig/style').DEFS });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gssheet-'));
  if (FULL) fs.mkdirSync(FULL, { recursive: true });
  const timeIt = async (svg) => { const ts = []; for (let i = 0; i < 5; i++) { const b = Date.now(); await r.render(svg, 'jpeg'); ts.push(Date.now() - b); } return ts.sort((x, y) => x - y)[2]; };
  const base = await timeIt('<rect width="1920" height="1080" fill="#888"/>');
  const files = [];
  console.log('tile'.padEnd(24), 'elems'.padStart(6), 'js ms'.padStart(7), 'svg ms'.padStart(8), 'total'.padStart(7));
  for (const [key, label, fn] of tiles) {
    let svg;
    try {
      refOn = false;
      const js = [];
      for (let i = 0; i < 3; i++) { S.resetIds(); const a = process.hrtime.bigint(); svg = fn(T0); js.push(Number(process.hrtime.bigint() - a) / 1e6); }
      js.sort((a, b) => a - b);
      const n = (svg.match(/<[a-zA-Z]/g) || []).length;
      const rt = Math.max(0, Math.round((await timeIt(svg)) - base));
      console.log(key.padEnd(24), String(n).padStart(6), js[1].toFixed(1).padStart(7), String(rt).padStart(8), String(Math.round(js[1] + rt)).padStart(7));
      refOn = true;
      S.resetIds();
      svg = fn(T0);
    } catch (e) {
      console.log(key.padEnd(24), 'ERROR', e.stack.split('\n').slice(0, 3).join(' | '));
      svg = bgCard('#600', '#300') + `<text x="960" y="540" font-size="60" fill="#fff" text-anchor="middle">${key}: ${String(e.message).slice(0, 60).replace(/[<&]/g, '')}</text>`;
    }
    if (FULL) fs.writeFileSync(path.join(FULL, key + '.png'), await r.render(svg));
    const lab = `<rect x="0" y="0" width="1920" height="86" fill="#000" opacity="0.62"/><text x="24" y="62" font-family="Fredoka" font-weight="700" font-size="52" fill="#FFE14D">${label.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`;
    const p = path.join(tmp, `t${String(files.length).padStart(3, '0')}.png`);
    fs.writeFileSync(p, await r.render(svg + lab));
    files.push(p);
  }
  await r.close();
  const cols = Math.min(3, files.length), rows = Math.ceil(files.length / cols);
  const ff = ['-v', 'error', '-y'];
  for (const p of files) ff.push('-i', p);
  let fc = files.map((_, i) => `[${i}:v]scale=640:360[s${i}];`).join('');
  const pad = rows * cols - files.length;
  for (let i = 0; i < pad; i++) { ff.push('-f', 'lavfi', '-i', 'color=c=black:s=640x360'); fc += `[${files.length + i}:v]null[s${files.length + i}];`; }
  const n = rows * cols;
  if (n === 1) fc += '[s0]null';
  else fc += Array.from({ length: n }, (_, i) => `[s${i}]`).join('') + `xstack=inputs=${n}:layout=` + Array.from({ length: n }, (_, i) => `${(i % cols) * 640}_${Math.floor(i / cols) * 360}`).join('|');
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  execFileSync('ffmpeg', [...ff, '-filter_complex', fc, '-frames:v', '1', OUT]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('wrote', OUT);
})().catch((e) => { console.error(e); process.exit(1); });
