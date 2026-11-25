// Contact sheet of the HOME + NEIGHBOURHOOD sets (scenes/sets_home.js) -> concept/sets_home.png
// Usage:
//   node tools/sheet_home.js                         all tiles -> concept/sets_home.png (3 columns, 640x360 tiles)
//   node tools/sheet_home.js --only kitchen,street   just those tiles (by key prefix)
//   node tools/sheet_home.js --full DIR              also write every tile as a full 1920x1080 PNG into DIR
//   node tools/sheet_home.js --noref                 no stand-ins / anchor marks
//   node tools/sheet_home.js --out FILE --t 2.3      output file / time
//   node tools/sheet_home.js --mod PATH              load the sets module from PATH instead of scenes/sets_home.js
// Prints per tile: elements, JS build ms and browser render ms of the SET ALONE (all layers, no characters, minus an
// empty-frame baseline; median of 5) — the budget is < 90 ms build + render.
// Stand-ins: YOU is the real hero rig (rig/r6, s .5 on each FLOOR line). Mom / Grandpa / Max / Biscuit / Mrs. Wells come
// from rig/cast.js when it already has them (draw.mom / draw.grandpa / draw.max / draw.biscuit), otherwise from simple r6
// look-alikes (sizes 1.04 / 1.12 / .62) and a box dog.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const S = require('../rig/svg');
const { openRenderer } = require('./render');

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const ONLY = arg('--only') ? arg('--only').split(',') : null;
const FULL = arg('--full');
const REF = !args.includes('--noref');
const OUT = arg('--out') || path.join(__dirname, '..', 'concept', 'sets_home.png');
const T0 = Number(arg('--t') || 2.3);
const X = require(arg('--mod') ? path.resolve(arg('--mod')) : '../scenes/sets_home');

// ---------------------------------------------------------------- stand-ins
const R6 = require('../rig/r6');
const hero = R6.makeDraw(R6.makeDesign({ col: { jacket: '#D8262E', jacketLine: '#B01D24', shirt: '#F2D04A', shirtShade: '#D9B73A', pants: '#1F3B2A', pantsShade: '#162C1F' } }));
const look = (size, hair, col) => R6.makeDraw(R6.makeDesign({ size, hair, eyeStyle: 'dot', col }));
const FAM = {
  mom: { size: 1.04, draw: look(1.04, 'buns', { hair: '#8A3B22', hairShade: '#6A2A16', hairHi: '#B8603E', jacket: '#FF9EBB', jacketLine: '#D87A98', shirt: '#FFF6E6', shirtShade: '#EEE0C8', pants: '#4E4258', pantsShade: '#3E3448' }) },
  grandpa: { size: 1.12, draw: look(1.12, 'none', { jacket: '#C9A06A', jacketLine: '#A8804A', shirt: '#7A2E3A', shirtShade: '#5E222C', pants: '#5A6070', pantsShade: '#464C5A' }) },
  max: { size: 0.62, draw: look(0.62, 'spiky', { hair: '#6A3E22', hairShade: '#55311A', hairHi: '#8A5A36', jacket: '#5DB55A', jacketLine: '#3E8A4A', shirt: '#8FD67A', shirtShade: '#6FB85A', pants: '#5DB55A', pantsShade: '#3E8A4A' }) },
  wells: { size: 0.98, draw: look(0.98, 'buns', { hair: '#E8E8F0', hairShade: '#C9C9D8', hairHi: '#FFFFFF', jacket: '#B98AD8', jacketLine: '#9A6AB8', shirt: '#FFFFFF', shirtShade: '#E8E8F0', pants: '#7A6A9A', pantsShade: '#5E5080' }) },
};
let castDog = null;
try {
  const CAST = require('../rig/cast');
  for (const k of ['mom', 'grandpa', 'max']) if (CAST.draw[k] && CAST.NAMES && CAST.NAMES[k]) FAM[k] = { size: (CAST.D && CAST.D[k] && CAST.D[k].dims && CAST.D[k].dims.size) || FAM[k].size, draw: CAST.draw[k] };
  if (CAST.draw.biscuit) castDog = CAST.draw.biscuit;
} catch (e) { /* cast not ready: keep the look-alikes */ }
const boxDog = (p) => `<g transform="translate(${p.x} ${p.y}) scale(${(p.s || 0.5) * 2})"><rect x="-70" y="-62" width="140" height="56" rx="26" fill="#E8A35A" stroke="#151515" stroke-width="5"/><rect x="40" y="-100" width="62" height="54" rx="18" fill="#E8A35A" stroke="#151515" stroke-width="5"/><circle cx="84" cy="-80" r="5" fill="#151515"/><path d="M-50 -6 v10 M50 -6 v10" stroke="#151515" stroke-width="10" stroke-linecap="round"/></g>`;
const dog = (p) => (castDog ? castDog(p) : boxDog(p));
let refOn = true;
const line = (y, col = '#FF2E63') => `<path d="M-400 ${y} L2400 ${y}" stroke="${col}" stroke-width="3" stroke-dasharray="14 10" opacity="0.8"/>`;
const ref = (x, y, s = 0.5, pose = {}) => (REF && refOn ? hero({ x, y, s, shade: true, shadow: true, ...pose }) + line(y) : '');
const refOnly = (x, y, s = 0.5, pose = {}) => (REF && refOn ? hero({ x, y, s, shade: true, shadow: true, ...pose }) : '');
const mark = (x, y, col = '#FF2E63') => (REF && refOn ? `<circle cx="${x}" cy="${y}" r="9" fill="none" stroke="${col}" stroke-width="4"/><path d="M${x - 16} ${y} h32 M${x} ${y - 16} v32" stroke="${col}" stroke-width="3"/>` : '');
const tip = (a, txt, col = '#3DE8FF') => (REF && refOn ? mark(a.x, a.y, col) + `<g transform="translate(${a.x} ${a.y - 40})"><rect x="-120" y="-30" width="240" height="44" rx="12" fill="#0E1A2E" opacity="0.85" stroke="${col}" stroke-width="3"/><text x="0" y="0" font-family="Fredoka" font-weight="700" font-size="26" fill="#FFFFFF" text-anchor="middle">${txt}</text></g>` : '');
const box = (b, col = '#3DFF9A') => (REF && refOn ? `<rect x="${b.cx - b.w / 2}" y="${b.cy - b.h / 2}" width="${b.w}" height="${b.h}" fill="none" stroke="${col}" stroke-width="5" stroke-dasharray="16 10"/>` : '');
// someone seated on a seat anchor (hips on spot.hip), legs hidden by the furniture front
const sit = (who, spot, pose = {}) => {
  if (!(REF && refOn)) return '';
  const p = X.seatPose(spot, who === 'you' ? 1 : FAM[who].size, { shade: true, shadow: false, ...pose });
  return who === 'you' ? hero(p) : FAM[who].draw(p);
};
const stand = (who, x, y, s, pose = {}) => (REF && refOn ? (who === 'you' ? hero : FAM[who].draw)({ x, y, s, shade: true, shadow: true, ...pose }) : '');
const bgCard = (c1 = '#2A2246', c2 = '#3E3366') => `<defs><linearGradient id="sheetBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect x="0" y="0" width="1920" height="1080" fill="url(#sheetBg)"/>`;
// room set with things drawn between the layers: seated = behind the front furniture, after = on the floor
const L = (fn, t, o, seated = '', after = '') => { const l = fn.layers(t, o); return (l.bg || '') + (l.mid || '') + seated + (l.front || '') + after + (l.fg || '') + (l.light || ''); };
const LC = (fn, t, cam, o, between = '') => { const l = fn.layers(t, cam, o); return l.bg + l.mid + between + l.fg + l.light; };
const quad4 = (svgs) => svgs.map((v, i) => `<svg x="${(i % 2) * 960}" y="${Math.floor(i / 2) * 540}" width="960" height="540" viewBox="0 0 1920 1080">${v}</svg>`).join('') + '<path d="M960 0 V1080 M0 540 H1920" stroke="#000" stroke-width="6"/>';
const camG = (cam, svg) => `<g transform="${X.camTf(cam, 1)}">${svg}</g>`;
const SP = X.SPOTS, FL = X.FLOOR;
let EXR = null;
try { EXR = require('../rig/extras'); } catch (e) { EXR = null; }
const fortStandIn = (spot, k) => {
  if (!(REF && refOn)) return '';
  if (EXR && EXR.pillowFort) return EXR.pillowFort({ ...spot, k, t: T0 });
  const w = 750 * k + 120, h = 850 * k + 60;
  return `<rect x="${spot.x - w / 2}" y="${spot.y - h}" width="${w}" height="${h}" rx="30" fill="#FFE6A8" opacity="0.55" stroke="#FF2E63" stroke-width="5" stroke-dasharray="18 10"/><text x="${spot.x}" y="${spot.y - h / 2}" font-family="Lilita One" font-size="60" fill="#FF2E63" text-anchor="middle">pillowFort k ${k}</text>`;
};
const demoScreen = (label, bgc = '#2E6FD8') => (w, h) => `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="${bgc}"/><rect x="${-w * 0.36}" y="${-h * 0.3}" width="${w * 0.72}" height="${h * 0.6}" rx="14" fill="#E9EDF3" stroke="#151515" stroke-width="5"/><rect x="${-w * 0.36}" y="${-h * 0.3}" width="${w * 0.72}" height="${h * 0.16}" rx="10" fill="#5A6478"/><text x="0" y="${h * 0.06}" font-family="Lilita One" font-size="${w * 0.07}" fill="#2A3140" text-anchor="middle">${label}</text><rect x="${-w * 0.14}" y="${h * 0.12}" width="${w * 0.28}" height="${h * 0.12}" rx="8" fill="#3BD16F" stroke="#151515" stroke-width="4"/>`;

// ---------------------------------------------------------------- tiles
const BS = SP.bedroom || {};
const bedLie = (p = {}) => (BS.bed ? refOnly(BS.bed.lie.x, BS.bed.lie.y, BS.bed.lie.s, { rot: BS.bed.lie.rot, shadow: false, face: 'sleepy', ...p }) : '');
const bedSitUp = (p = {}) => (BS.bed ? sit('you', BS.bed.sitUp, { face: 'amazed', armL: 40, armR: 40, ...p }) : '');
const inChair = (p = {}) => (BS.chair ? sit('you', BS.chair, { view: 'back', ...p }) : '');
const TILES = [
  ['bedroom', 'bedroom · night (default): YOU in the chair (back view), title screen, glow', (t) => L(X.bedroom, t, {}, inChair())],
  ['bedroom_update', 'bedroom · night, pcScreen = UPDATE, pixels .45 (the install burst)', (t) => L(X.bedroom, t, { pcScreen: demoScreen('ACCEPT?'), pixels: 0.45 }, inChair())],
  ['bedroom_morning', 'bedroom · morning: sitUp in bed, ring .8, tooltips on bed / sock / alarm', (t) => L(X.bedroom, t, { time: 'morning', ring: 0.8, tuck: 0.6 }, bedSitUp(), tip(BS.tips.bed, 'COMFORT +50') + tip(BS.tips.sock, 'SMELL +99', '#7CFF6A') + tip(BS.tips.alarm, 'ENEMY', '#FF4D6D'))],
  ['bedroom_quad', 'bedroom · lie + tuck (night) / blackout .9 / day: YOU at the mirror / evening, chair front', (t) => quad4([
    L(X.bedroom, t, { tuck: 0.9 }, bedLie()),
    L(X.bedroom, t, { blackout: 0.9 }, inChair()),
    L(X.bedroom, t, { time: 'day', mirrorView: (w, h) => `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#9FD0E0"/>` + hero({ x: 0, y: h / 2 + 40, s: 0.42, face: 'confused' }) }, '', refOnly(BS.mirror.stand.x, BS.mirror.stand.y, BS.mirror.stand.s, { view: 'back' }) + line(FL.bedroom)),
    L(X.bedroom, t, { time: 'evening', chair: 'front', lamp: 1 }, sit('you', BS.chair, { legL: 90, legR: 90, kneeL: 90, kneeR: 90, face: 'happy' }), ref(600, FL.bedroom))])],
];

(async () => {
  const tiles = TILES.filter(([k]) => !ONLY || ONLY.some((o) => k.startsWith(o)));
  let EXD = '';
  try { EXD = require('../rig/extras').DEFS || ''; } catch (e) { EXD = ''; }
  const r = await openRenderer(1920, 1080, { staticDefs: X.DEFS + require('../rig/style').DEFS + EXD });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'shsheet-'));
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
    const lab = `<rect x="0" y="0" width="1920" height="86" fill="#000" opacity="0.62"/><text x="24" y="62" font-family="Fredoka" font-weight="700" font-size="50" fill="#FFE14D">${label.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`;
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
