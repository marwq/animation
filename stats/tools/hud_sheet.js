// Contact sheets of the Reality HUD kit (scenes/hud.js).
// Usage:
//   node tools/hud_sheet.js                      every sheet -> concept/hud.png (overview) + concept/hud_<sheet>.png
//   node tools/hud_sheet.js --sheet plates,xp    only those sheets
//   node tools/hud_sheet.js --out FILE --sheet x write a single sheet to FILE (e.g. a scratch dir) instead of concept/
//   node tools/hud_sheet.js --perf               also time every helper (JS build ms) and a few full frames (browser ms)
'use strict';
const fs = require('fs');
const path = require('path');
const S = require('../rig/svg');
const { openRenderer } = require('./render');
const H = require('../scenes/hud');
const K = require('../scenes/kit');
const R = require('../scenes/respawn');
const { f, lerp, clamp } = S;

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const ONLY = arg('--sheet') ? arg('--sheet').split(',') : null;
const OUT = arg('--out');
const PERF = args.includes('--perf');
const CONCEPT = path.join(__dirname, '..', 'concept');
const optDefs = (m) => { try { return require(m).DEFS || ''; } catch (e) { return ''; } };
const STATIC_DEFS = (() => { const ST = require('../rig/style'); return ST.DEFS + ST.FRAME_DEFS + optDefs('../scenes/env') + optDefs('../scenes/respawn') + optDefs('../scenes/gameui') + optDefs('../rig/extras') + H.DEFS; })();

// ---------------------------------------------------------------- backdrops + stand-in cast
const LBL = (txt, x, y, size = 30, col = '#FFE14D') => `<text x="${x}" y="${y}" font-family="Fredoka" font-weight="700" font-size="${size}" fill="${col}" text-anchor="middle" stroke="#151515" stroke-width="7" paint-order="stroke">${txt}</text>`;
const grad = (id, a, b) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
function bgHall(floor = 900) {
  const id = S.uid('hsbg');
  let o = grad(id, '#E9EEF5', '#C9D6E6') + `<rect width="1920" height="1080" fill="url(#${id})"/>`;
  for (let i = 0; i < 12; i++) o += `<rect x="${40 + i * 160}" y="${floor - 470}" width="140" height="440" rx="8" fill="${i % 3 ? '#5AA0D8' : '#F26D6D'}" stroke="#151515" stroke-width="7"/><path d="M${60 + i * 160} ${floor - 430} h100 M${60 + i * 160} ${floor - 410} h100 M${60 + i * 160} ${floor - 390} h100" stroke="#151515" stroke-width="5" opacity="0.5"/><rect x="${150 + i * 160}" y="${floor - 270}" width="12" height="40" rx="5" fill="#151515" opacity="0.6"/>`;
  o += `<rect y="${floor - 30}" width="1920" height="${1110 - floor}" fill="#D9C7A0"/><rect y="${floor - 30}" width="1920" height="10" fill="#151515" opacity="0.25"/>`;
  return o;
}
function bgKitchen(floor = 900) {
  const id = S.uid('hsbg');
  let o = grad(id, '#FFE9CC', '#F6CFA0') + `<rect width="1920" height="1080" fill="url(#${id})"/>`;
  o += `<rect x="0" y="${floor - 330}" width="1920" height="300" fill="#FFF6E6" stroke="#151515" stroke-width="7"/><rect x="0" y="${floor - 360}" width="1920" height="40" fill="#C9874E" stroke="#151515" stroke-width="7"/>`;
  o += `<rect x="1300" y="120" width="380" height="300" rx="16" fill="#BFE6FF" stroke="#151515" stroke-width="8"/><path d="M1490 120 V420 M1300 270 H1680" stroke="#151515" stroke-width="7"/>`;
  o += `<rect y="${floor - 30}" width="1920" height="${1110 - floor}" fill="#B9875E"/>`;
  return o;
}
function bgNight() { const id = S.uid('hsbg'); return grad(id, '#0E1433', '#232A5E') + `<rect width="1920" height="1080" fill="url(#${id})"/><rect x="0" y="860" width="1920" height="220" fill="#1A1E3E"/>`; }
function bgFair(floor = 900) {
  const id = S.uid('hsbg');
  let o = grad(id, '#3A2A6A', '#FF9A6A') + `<rect width="1920" height="1080" fill="url(#${id})"/>`;
  o += `<circle cx="1450" cy="430" r="330" fill="none" stroke="#2A1E4A" stroke-width="16"/>`;
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; o += `<path d="M1450 430 L${f(1450 + Math.cos(a) * 330)} ${f(430 + Math.sin(a) * 330)}" stroke="#2A1E4A" stroke-width="7"/><rect x="${f(1450 + Math.cos(a) * 330 - 26)}" y="${f(430 + Math.sin(a) * 330 - 10)}" width="52" height="44" rx="8" fill="${['#FF5A6A', '#FFD23F', '#3BE8FF'][i % 3]}" stroke="#151515" stroke-width="5"/>`; }
  o += `<path d="M0 ${floor - 120} Q300 ${floor - 200} 600 ${floor - 120} T1200 ${floor - 120} T1920 ${floor - 140} V1080 H0Z" fill="#2E2450"/>`;
  o += `<rect y="${floor - 20}" width="1920" height="${1100 - floor}" fill="#7A5A6A"/>`;
  return o;
}
function bgSun(floor = 900) {
  const id = S.uid('hsbg');
  let o = grad(id, '#7CCBFF', '#D8F1FF') + `<rect width="1920" height="1080" fill="url(#${id})"/>`;
  o += `<path d="M0 ${floor - 260} Q200 ${floor - 380} 420 ${floor - 280} T900 ${floor - 300} T1400 ${floor - 280} T1920 ${floor - 320} V${floor} H0Z" fill="#8FD89A"/>`;
  for (let i = 0; i < 5; i++) o += `<rect x="${120 + i * 380}" y="${floor - 330 - (i % 2) * 60}" width="220" height="${330 + (i % 2) * 60}" rx="10" fill="${['#F2B8A0', '#BFD8F2', '#F2E0A0', '#C9F2C0', '#E0C8F2'][i]}" stroke="#151515" stroke-width="7"/>`;
  o += `<rect y="${floor - 20}" width="1920" height="${1100 - floor}" fill="#9BA3AF"/>`;
  return o;
}
const hero = (t, pose = {}, act = {}) => K.actor('you', t, { s: 0.5, ...pose }, act);
// any cast key if it exists, else a generic human stand-in (the stats cast is being drawn in parallel)
function person(key, i, pose) {
  try { if (K.draw[key] && !['mom', 'dad', 'grandma'].includes(key) || ['mom'].includes(key) && K.draw.grandpa) return K.actor(key, pose.t || 0, pose); } catch (e) { /* fall through */ }
  const kid = ['benji', 'max', 'kid', 'tank'].includes(key);
  return (kid ? K.draw.humanKid : K.draw.adult)(i, { ...pose, s: (pose.s || 0.5) * (key === 'max' ? 0.72 : key === 'tank' ? 1.22 : 1) });
}
const grid = (svgs, cols, labels = []) => {
  const rows = Math.ceil(svgs.length / cols), w = 1920 / cols, h = 1080 / rows;
  return '<rect width="1920" height="1080" fill="#000"/>' + svgs.map((v, i) => `<svg x="${(i % cols) * w}" y="${Math.floor(i / cols) * h}" width="${w}" height="${h}" viewBox="0 0 1920 1080">${v}</svg>` + (labels[i] ? LBL(labels[i], (i % cols) * w + w / 2, Math.floor(i / cols) * h + 34, 26) : '')).join('') +
    Array.from({ length: cols - 1 }, (_, i) => `<path d="M${(i + 1) * w} 0 V1080" stroke="#000" stroke-width="6"/>`).join('') + Array.from({ length: rows - 1 }, (_, i) => `<path d="M0 ${(i + 1) * h} H1920" stroke="#000" stroke-width="6"/>`).join('');
};
// n frames cropped to the same viewBox, in a cols x rows grid (time strips)
const cropGrid = (svgs, cols, vb, labels = []) => {
  const rows = Math.ceil(svgs.length / cols), w = 1920 / cols, h = 1080 / rows;
  return '<rect width="1920" height="1080" fill="#000"/>' + svgs.map((v, i) => `<svg x="${(i % cols) * w}" y="${Math.floor(i / cols) * h}" width="${w}" height="${h}" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid slice">${v}</svg>` + (labels[i] ? LBL(labels[i], (i % cols) * w + w / 2, Math.floor(i / cols) * h + h - 14, 26) : '')).join('') +
    Array.from({ length: cols - 1 }, (_, i) => `<path d="M${(i + 1) * w} 0 V1080" stroke="#000" stroke-width="6"/>`).join('') + Array.from({ length: rows - 1 }, (_, i) => `<path d="M0 ${(i + 1) * h} H1920" stroke="#000" stroke-width="6"/>`).join('');
};

const T0 = 2.3;
// ---------------------------------------------------------------- sheets
const SHEETS = {};

// plates: the cast presets in context
SHEETS.plates = () => {
  const t = T0;
  const tile1 = () => {   // kitchen: mom 2% smiling, grandpa legend, max chaos
    let o = bgKitchen();
    o += person('mom', 1, { x: 420, y: 960, s: 0.55, face: 'joy', t }) + person('grandpa', 2, { x: 980, y: 960, s: 0.55, t }) + person('max', 3, { x: 1500, y: 960, s: 0.55, t });
    o += H.plateFor('mom', { x: 420, y: 330, s: 1.05, t });
    o += H.plateFor('grandpa', { x: 980, y: 330, s: 1.05, t });
    o += H.plateFor('max', { x: 1500, y: 360, s: 1.05, t });
    return o;
  };
  const tile2 = () => {   // school: krump boss, tank low + tags, benji clumsy
    let o = bgHall();
    o += person('teacher', 4, { x: 380, y: 960, s: 0.6, t }) + person('tank', 5, { x: 1000, y: 960, s: 0.55, t }) + person('benji', 6, { x: 1560, y: 960, s: 0.5, t });
    o += H.plateFor('teacher', { x: 380, y: 300, s: 1.05, t });
    o += H.plateFor('tank', { x: 1000, y: 280, s: 1.05, t });
    o += H.plateFor('benji', { x: 1560, y: 420, s: 1.05, t });
    return o;
  };
  const tile3 = () => {   // biscuit error -> LV 1000, lunch lady, benji best friend
    let o = bgKitchen();
    o += H.plateFor('biscuitError', { x: 400, y: 420, s: 1.1, t });
    o += H.plateFor('biscuit', { x: 400, y: 820, s: 1.1, t });
    o += H.plateFor('lunchLady', { x: 1250, y: 330, s: 1.05, t });
    o += H.plateFor('benjiBest', { x: 1250, y: 700, s: 1.05, t });
    o += H.plateFor('smartKid', { x: 1250, y: 960, s: 0.9, t, theme: 'cold' });
    return o;
  };
  const tile4 = () => {   // the hero: ??? and BIG BROTHER
    let o = bgHall();
    o += hero(t, { x: 560, y: 980, s: 0.55, face: 'confused' }) + hero(t, { x: 1360, y: 980, s: 0.55, face: 'happy' });
    o += H.heroPlate({ x: 560, y: 980 - 960 * 0.55 - 6, s: 1.15, t, reveal: 0 });
    o += H.heroPlate({ x: 1360, y: 980 - 960 * 0.55 - 6, s: 1.15, t, reveal: 1 });
    return o;
  };
  return grid([tile1(), tile2(), tile3(), tile4()], 2, ['Mom ENERGY 2% · Grandpa LEGEND · Max CHAOS 9999 HP ∞', 'Krump FINAL BOSS · Tank HP 3/100 + tags · Benji CLUMSY', 'Biscuit ERROR -> LV 1000 · lunch lady · BEST FRIEND: MAX · cold', 'the hero: ??? -> BIG BROTHER']);
};

// ---------------------------------------------------------------- runner
async function main() {
  const names = Object.keys(SHEETS).filter((n) => !ONLY || ONLY.includes(n));
  const r = await openRenderer(1920, 1080, { staticDefs: STATIC_DEFS });
  fs.mkdirSync(CONCEPT, { recursive: true });
  for (const n of names) {
    S.resetIds();
    const t0 = Date.now();
    const svg = SHEETS[n]();
    const js = Date.now() - t0;
    const out = OUT && names.length === 1 ? OUT : path.join(CONCEPT, n === 'overview' ? 'hud.png' : `hud_${n}.png`);
    const t1 = Date.now();
    fs.writeFileSync(out, await r.render(svg));
    console.log(`${n}: ${out}  (js ${js} ms, render ${Date.now() - t1} ms, ${(svg.length / 1024).toFixed(0)} KB)`);
  }
  await r.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
