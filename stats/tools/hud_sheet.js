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
const STATS_CAST = !!(K.draw.grandpa && K.draw.benji && K.draw.tank);   // the new cast is in place
function person(key, i, pose) {
  if (STATS_CAST && K.draw[key]) { try { return K.actor(key, pose.t || 0, ['kid', 'adult'].includes(key) ? { i, ...pose } : pose); } catch (e) { /* fall through */ } }
  const kid = ['benji', 'max', 'kid', 'tank'].includes(key);
  return (kid ? K.draw.humanKid : K.draw.adult)(i, { ...pose, s: (pose.s || 0.5) * (key === 'max' ? 0.72 : key === 'tank' ? 1.22 : 1) });
}
// tiles: svg strings or { svg, vb: [x, y, w, h] } (a crop of the 1920x1080 frame); labels at the top (or bottom with lblBottom)
// a cast member + the head-top point for its plate (H.overHead asks rig/cast.js headTop when it exists)
function cast(key, i, pose) {
  const svg = person(key, i, pose);
  const head = STATS_CAST ? H.overHead(key, pose.x, pose.y, pose.s, 0, ['kid', 'adult'].includes(key) ? { i, ...pose } : pose) : { x: pose.x, y: pose.y - 1000 * pose.s };
  return { svg, head };
}
const grid = (svgs, cols, labels = [], lblBottom = false) => {
  const rows = Math.ceil(svgs.length / cols), w = 1920 / cols, h = 1080 / rows;
  return '<rect width="1920" height="1080" fill="#000"/>' + svgs.map((v, i) => `<svg x="${(i % cols) * w}" y="${Math.floor(i / cols) * h}" width="${w}" height="${h}" viewBox="${(v.vb || [0, 0, 1920, 1080]).join(' ')}" preserveAspectRatio="xMidYMid slice">${v.svg || v}</svg>` + (labels[i] ? LBL(labels[i], (i % cols) * w + w / 2, Math.floor(i / cols) * h + (lblBottom ? h - 62 : 34), 26) : '')).join('') +
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
    const m = cast('mom', 1, { x: 420, y: 980, s: 0.55, face: 'joy', t }), g = cast('grandpa', 2, { x: 980, y: 980, s: 0.55, t }), x = cast('max', 3, { x: 1500, y: 980, s: 0.55, t });
    o += m.svg + g.svg + x.svg;
    o += H.plateFor('mom', { ...m.head, s: 1.0, t }) + H.plateFor('grandpa', { ...g.head, s: 1.0, t }) + H.plateFor('max', { ...x.head, s: 1.0, t });
    return o;
  };
  const tile2 = () => {   // school: krump boss, tank low + tags, benji clumsy
    let o = bgHall();
    const k = cast('teacher', 4, { x: 360, y: 1000, s: 0.5, t }), tk = cast('tank', 5, { x: 1000, y: 1000, s: 0.5, t }), b = cast('benji', 6, { x: 1580, y: 1000, s: 0.5, t });
    o += k.svg + tk.svg + b.svg;
    o += H.plateFor('teacher', { ...k.head, s: 1.0, t }) + H.plateFor('tank', { ...tk.head, s: 1.0, t }) + H.plateFor('benji', { ...b.head, s: 1.0, t });
    return o;
  };
  const tile3 = () => {   // biscuit error -> LV 1000, lunch lady, benji best friend
    let o = bgKitchen();
    const d1 = cast('biscuit', 0, { x: 330, y: 520, s: 0.6, t }), d2 = cast('biscuit', 0, { x: 330, y: 1000, s: 0.6, t, pose: 'beg' });
    const ll = cast('lunchLady', 0, { x: 1000, y: 1000, s: 0.5, t }), b = cast('benji', 6, { x: 1580, y: 1000, s: 0.5, face: 'happy', t });
    o += d1.svg + d2.svg + ll.svg + b.svg;
    o += H.plateFor('biscuitError', { ...d1.head, s: 0.95, t }) + H.plateFor('biscuit', { ...d2.head, s: 0.95, t });
    o += H.plateFor('lunchLady', { ...ll.head, s: 0.95, t }) + H.plateFor('benjiBest', { ...b.head, s: 0.95, t });
    return o;
  };
  const tile4 = () => {   // the hero: ??? and BIG BROTHER
    let o = bgHall();
    const a = cast('you', 0, { x: 560, y: 980, s: 0.55, face: 'confused', t }), b = cast('you', 0, { x: 1360, y: 980, s: 0.55, face: 'happy', t });
    o += a.svg + b.svg;
    o += H.heroPlate({ ...a.head, s: 1.15, t, reveal: 0 }) + H.heroPlate({ ...b.head, s: 1.15, t, reveal: 1 });
    return o;
  };
  return grid([tile1(), tile2(), tile3(), tile4()], 2, ['Mom ENERGY 2% · Grandpa LEGEND · Max CHAOS 9999 HP ∞', 'Krump FINAL BOSS · Tank HP 3/100 + tags · Benji CLUMSY', 'Biscuit ERROR -> LV 1000 · lunch lady · BEST FRIEND: MAX', 'the hero: ??? -> BIG BROTHER']);
};

// in-context overview: four shots across the story
SHEETS.overview = () => {
  const t = T0;
  const a = () => {   // SC03 kitchen: the HUD morning
    let o = bgKitchen();
    const m = cast('mom', 1, { x: 640, y: 980, s: 0.55, face: 'joy', t }), y = cast('you', 0, { x: 1320, y: 990, s: 0.55, face: 'amazed', t });
    o += m.svg + y.svg;
    o += H.plateFor('mom', { ...m.head, s: 1.0, t });
    o += H.tipFor('coffee', { x: 860, y: 640, t, dist: 70 });
    o += H.tipFor('toaster', { x: 220, y: 560, t, dist: 70 });
    o += H.heroPlate({ ...y.head, s: 0.9, t });
    o += H.xpPop({ x: 860, y: 600, age: 0.25, amount: 1, text: '+1% ENERGY', col: '#FFD23F' });
    o += H.hudFrame({ t, clock: '7:02 AM' }) + H.xpBar({ t, value: 0.12, level: 1, text: '12 / 100' });
    return o;
  };
  const b = () => {   // SC04/05 school: boss, Tank, lie meter, quests
    let o = bgHall();
    const k = cast('teacher', 4, { x: 300, y: 1000, s: 0.5, t }), kd = cast('kid', 3, { x: 860, y: 1000, s: 0.5, face: 'nervous', t }), tk = cast('tank', 5, { x: 1480, y: 1000, s: 0.5, t });
    o += k.svg + kd.svg + tk.svg;
    o += H.plateFor('teacher', { ...k.head, s: 0.95, t });
    o += H.lieMeter({ ...kd.head, s: 0.95, t });
    o += H.plateFor('tank', { ...tk.head, s: 0.95, t });
    o += H.questMarker({ x: tk.head.x + 200, y: tk.head.y + 60, t, kind: '?', s: 0.55 });
    o += H.hudFrame({ t, clock: '10:15 AM', day: 'TUE' }) + H.xpBar({ t, value: 0.4, level: 3, text: '40 / 100' });
    return o;
  };
  const c = () => {   // SC08 fair: overload
    let o = bgFair();
    const faces = [];
    for (let i = 0; i < 5; i++) { const p = cast('adult', i + 2, { x: 250 + i * 360, y: 1000, s: 0.5, t }); o += p.svg; faces.push({ x: p.head.x, y: p.head.y + 75, r: 66 }); }
    o += hero(t, { x: 960, y: 1090, s: 0.6, face: 'scared' });
    o += H.numbersFlood({ t, k: 0.68, faces });
    o += H.questArrow({ x: 960, y: 1020, t, glitch: 1, s: 0.9 });
    o += H.hudFrame({ t, glitch: 0.5, clock: '4:47 PM', day: 'SAT', quest: 'FIND MAX', questSub: 'LOCATION: UNKNOWN' });
    o += H.systemMsg({ x: 960, y: 140, t, text: 'HUD OVERLOAD', sub: 'Warning. Too many players.', theme: 'warn', glitch: 0.3 });
    return o;
  };
  const d = () => {   // SC12 living room: Biscuit + BIG BROTHER
    let o = bgKitchen();
    const y = cast('you', 0, { x: 1300, y: 990, s: 0.55, face: 'happy', t }), mx = cast('max', 3, { x: 900, y: 990, s: 0.55, t }), dg = cast('biscuit', 0, { x: 400, y: 990, s: 0.6, t });
    o += y.svg + mx.svg + dg.svg;
    o += H.plateFor('biscuit', { ...dg.head, s: 1.0, t });
    o += H.heroPlate({ ...y.head, s: 1.1, t, reveal: 1 });
    return o;
  };
  return grid([a(), b(), c(), d()], 2, ['SC03 the HUD morning: Mom ENERGY 2% · tooltips · ??? · XP bar · frame', 'SC04-05 school: FINAL BOSS · LIE 99% · Tank HP 3/100 + tags · ? marker', 'SC08 overload: numbers flood over faces · arrow spins · glitch', 'SC12 finale: Biscuit LV 1000 · GOOD BOY ∞ · BIG BROTHER'], true);
};

// objects: tooltips + lie meter + quest markers
SHEETS.objects = () => {
  const t = T0;
  let o = bgKitchen();
  const keys = ['bed', 'sock', 'alarm', 'toaster', 'coffee', 'broccoli', 'mysteryMeat', 'quiz', 'pizza', 'toast', 'glasses', 'sandwich'];
  keys.forEach((key, i) => { o += H.tipFor(key, { x: 180 + (i % 4) * 470, y: 250 + Math.floor(i / 4) * 290, t, s: 0.95 }); });
  o += H.lieMeter({ x: 240, y: 1070, t, s: 0.9 });
  o += H.questMarker({ x: 700, y: 1040, t }) + H.questMarker({ x: 900, y: 1040, t, kind: '?' }) + H.questMarker({ x: 1100, y: 1040, t, reward: '+2 XP' }) + H.questMarker({ x: 1450, y: 1040, t, reward: '+5 XP', s: 0.7 }) + H.questMarker({ x: 1700, y: 1040, t, kind: '?', s: 0.45 });
  o += LBL('tipFor(key) presets · lieMeter · questMarker ! / ? / reward / tiny', 960, 40, 30);
  return o;
};

// quests: toast, complete, epic, arrow
SHEETS.quests = () => {
  const t = T0;
  let o = bgSun();
  o += H.questToast({ x: 520, y: 110, t, title: 'Find Max', reward: '+50 XP' });
  o += H.questToast({ x: 1400, y: 110, t, title: 'Find Max', sub: 'Location... unknown', kind: 'update', glitch: 0.4 });
  o += H.questComplete({ x: 520, y: 330, t, reward: '+37 HP', s: 0.72 });
  o += H.questComplete({ x: 1400, y: 330, t, reward: '+100 XP', epic: true, s: 0.58 });
  o += H.questArrow({ x: 280, y: 740, t, angle: -60 }) + H.questArrow({ x: 760, y: 740, t, glitch: 1 });
  o += H.pillowFort({ x: 1420, y: 700, t, s: 0.75 });
  o += H.questToast({ x: 520, y: 960, t, title: 'Help Mom', reward: '+5 XP', s: 0.8 });
  o += H.questToast({ x: 1400, y: 960, t, title: "Find Grandpa's glasses", kind: 'complete', reward: '+1 XP', s: 0.8 });
  o += LBL('questToast · questComplete (+37 HP / epic) · questArrow (glitch = spinning) · pillowFort / epicQuest', 960, 1060, 28);
  return o;
};

// xp + level + friendship
SHEETS.xp = () => {
  const t = T0;
  let o = bgSun();
  o += hero(t, { x: 380, y: 900, s: 0.5, face: 'excited' }) + person('adult', 3, { x: 1500, y: 900, s: 0.5, t });
  o += H.levelUp({ x: 960, y: 300, t, k: 0.9, level: 20, from: 12, s: 0.8 });
  o += H.xpPop({ x: 1500, y: 420, age: 0.3, amount: 10 }) + H.xpPop({ x: 1300, y: 520, age: 0.62, amount: 20, to: [760, 1050] }) + H.xpPop({ x: 1100, y: 640, age: 0.85, amount: 5, to: [760, 1050] });
  o += H.friendshipPop({ x: 160, y: 300, age: 0.7 }) + H.friendshipPop({ x: 1760, y: 300, age: 0.62, value: -50 }) + H.friendshipPop({ x: 1760, y: 640, age: 1.2, value: -50, hold: true });
  o += H.xpBar({ t, value: 0.62, level: 12, gain: 0.5, text: '340 / 500' });
  o += LBL('levelUp · xpPop (+10 XP flies to the bar) · friendshipPop +1 / −50 (crack, hold) · xpBar (gain pulse)', 960, 1010, 28);
  return o;
};

// system: update window, boot frames, frame, messages, boss bar
SHEETS.system = () => {
  const t = T0;
  const room = () => { let o = bgNight(); o += `<rect x="560" y="520" width="800" height="340" rx="10" fill="#3A2A20" stroke="#151515" stroke-width="7"/>`; return o; };
  const tiles = [
    room() + H.updateWindow({ x: 960, y: 540, t, scroll: 0 }),
    room() + H.updateWindow({ x: 960, y: 540, t, scroll: 0.45 }),
    room() + H.updateWindow({ x: 960, y: 540, t, scroll: 1, accept: 0.45, pointer: { x: 1180, y: 840, press: 0.4 } }),
    room() + H.updateWindow({ x: 960, y: 540, t, scroll: 1, install: 0.7 }) + H.pixelBurst({ x: 960, y: 540, age: 0.35 }),
    bgKitchen() + H.bootSequence(1.0, 0),
    bgKitchen() + H.bootSequence(1.9, 0),
    bgKitchen() + H.bootSequence(2.35, 0),
    bgKitchen() + H.bootSequence(3.1, 0),
    bgHall() + H.hudFrame({ t, quest: 'HELP MOM', questSub: '+5 XP' }) + H.systemMsg({ x: 960, y: 420, t, text: 'Installing... reality.' }) + H.systemMsg({ x: 960, y: 620, t, text: 'Pet stats enabled', theme: 'ok', icon: 'paw' }) + H.bossBar({ x: 960, y: 880, t, value: 0.9, w: 1100 }),
  ];
  return grid(tiles, 3, ['updateWindow scroll 0 (page 1 mentions the X)', 'scroll .45 (pages fly)', 'accept .45 + pointer', 'install .7 + pixelBurst', 'bootSequence 1.0 s', '1.9 s (99 %)', '2.35 s ONLINE + frame', '3.1 s (fading)', 'hudFrame · systemMsg · bossBar']);
};

// overload + off
SHEETS.overload = () => {
  const t = T0;
  const fair = (k) => {
    let o = bgFair();
    const faces = [];
    for (let i = 0; i < 5; i++) { const x = 250 + i * 360, y = 1000; o += K.draw.adult(i + 2, { x, y, s: 0.5 }); faces.push({ x, y: y - 0.5 * 1043 + 105, r: 66 }); }
    return o + H.numbersFlood({ t, k, faces });
  };
  const hudLayer = (tt = t) => H.hudFrame({ t: tt }) + H.plateFor('tank', { x: 520, y: 520, t: tt }) + H.plateFor('mom', { x: 1350, y: 560, t: tt }) + H.xpBar({ t: tt, value: 0.7, level: 20 });
  const bench = () => { let o = bgFair(); o += hero(t, { x: 760, y: 1000, s: 0.55, face: 'sad' }) + person('grandpa', 2, { x: 1160, y: 1000, s: 0.55, t }); return o; };
  const tiles = [
    fair(0.3), fair(0.65), fair(1),
    bench() + H.hudGlitch(hudLayer(), t, 0.6),
    bench() + H.hudFrame({ t, closeX: { highlight: 1 } }),
    bench() + H.hudFrame({ t, closeX: { highlight: 1, press: 0.35 } }),
    bench() + H.hudShatter({ age: 0.18, svg: hudLayer() }),
    bench() + H.hudShatter({ age: 0.55, svg: hudLayer() }),
    bench() + H.hudShatter({ age: 1.1, svg: hudLayer() }),
  ];
  return grid(tiles, 3, ['numbersFlood k .3', 'k .65 (faces covered)', 'k 1', 'hudGlitch .6', 'closeX highlight 1', 'highlight + press .35', 'hudShatter .18 (cracks)', '.55 (shards fall)', '1.1 → clean']);
};

// montage helpers + crowd mini plates
SHEETS.montage = () => {
  const t = T0;
  const gym = () => bgHall();
  const crowd = () => {
    let o = bgHall();
    for (let i = 0; i < 6; i++) { const x = 180 + i * 310, y = 980 - (i % 2) * 40, s = 0.42 + (i % 3) * 0.04; o += K.draw.humanKid(i, { x, y, s }); o += H.miniPlate({ x, y: y - 880 * s - 6, s: 0.9, t, name: ['JAKE', 'PRIYA', 'MO', 'LILY', 'DEV', 'SAM'][i], level: [12, 40, 8, 23, 3, 61][i], hp: [0.8, 0.95, 0.3, 0.6, 0.08, 1][i] }); }
    return o;
  };
  const tiles = [
    gym() + H.sortByStrength({ t, sort: 0, press: 0.2, s: 1 }),
    gym() + H.sortByStrength({ t, sort: 1, pick: 2.5, highlight: 'QUIET KID' }),
    bgHall() + H.statCompare({ t, choose: 0 }),
    bgHall() + H.statCompare({ t, choose: -1 }),
    crowd(),
    bgHall() + H.miniPlate({ x: 500, y: 600, s: 1.6, t, name: 'KEVIN', level: 9, hp: 0.64 }) + H.miniPlate({ x: 1300, y: 600, s: 1.6, t, name: 'NOAH', level: 2, hp: 0.05, glitch: 0.5 }),
  ];
  return grid(tiles, 3, ['sortByStrength (press)', 'sort 1 · pick 2.5 · highlight', 'statCompare INT 95 vs LV 4', 'choose −1 (picked the smart kids)', 'miniPlate crowd (SC01)', 'miniPlate big · glitch']);
};

// motion: time strips (k / age / reveal sweeps), each cell cropped around its subject
SHEETS.motion = () => {
  const t = T0;
  const bg = (c = '#2A3550') => `<rect x="-2000" y="-2000" width="6000" height="6000" fill="${c}"/>`;
  const vb = (cx, cy, w = 620) => [cx - w / 2, cy - w * 0.5625 / 2 - 24, w, w * 0.5625];
  const tiles = [];
  [0.08, 0.2, 0.35, 0.5, 0.65, 1].forEach((k) => tiles.push({ svg: bg() + H.plateFor('mom', { x: 960, y: 640, s: 1.2, k, t }), vb: vb(960, 560) }));
  [0, 0.6, 1.2, 1.8, 2.4, 3].forEach((tk) => tiles.push({ svg: bg() + H.plateFor('tank', { x: 960, y: 660, s: 1.2, t, tagsK: tk }), vb: vb(960, 560) }));
  [0, 0.2, 0.4, 0.55, 0.75, 1].forEach((r) => tiles.push({ svg: bg('#5A3A30') + H.heroPlate({ x: 960, y: 640, s: 1.3, t, reveal: r }), vb: vb(960, 540) }));
  [0.15, 0.35, 0.55, 0.7, 0.85, 1].forEach((k) => tiles.push({ svg: bg() + H.questComplete({ x: 960, y: 500, s: 0.62, t, k, reward: '+37 HP' }), vb: vb(960, 540) }));
  [0.1, 0.45, 0.6, 0.85, 1.2, 1.6].forEach((a) => tiles.push({ svg: bg() + H.friendshipPop({ x: 960, y: 500, s: 1.6, age: a, value: -50 }), vb: vb(960, 560) }));
  [0.05, 0.3, 0.5, 0.75, 0.9, 1].forEach((k) => tiles.push({ svg: bg() + H.lieMeter({ x: 960, y: 700, s: 1.25, k, t: t + k }), vb: vb(960, 560) }));
  return grid(tiles, 6, ['plate k .08', '.2', '.35', '.5', '.65', '1', 'tagsK 0', '.6', '1.2', '1.8', '2.4', '3', 'hero reveal 0', '.2', '.4', '.55', '.75', '1', 'questComplete .15', '.35', '.55', '.7', '.85', '1', 'friendship −50 .1s', '.45', '.6', '.85', '1.2', '1.6', 'lieMeter k .05', '.3', '.5', '.75', '.9', '1']);
};

// ---------------------------------------------------------------- perf
function jsTime(fn, n = 200) { fn(); const t0 = process.hrtime.bigint(); for (let i = 0; i < n; i++) { S.resetIds(); fn(i); } return Number(process.hrtime.bigint() - t0) / 1e6 / n; }
const PERF_JS = {
  statPlate: (i) => H.plateFor('tank', { x: 900, y: 500, t: i * 0.03, k: 0.8 }),
  heroPlate: (i) => H.heroPlate({ x: 900, y: 500, t: i * 0.03, reveal: 0.7 }),
  miniPlate: (i) => H.miniPlate({ x: 900, y: 500, t: i * 0.03, name: 'JAKE', level: 12 }),
  tooltip: (i) => H.tipFor('broccoli', { x: 900, y: 500, t: i * 0.03 }),
  lieMeter: (i) => H.lieMeter({ x: 900, y: 500, t: i * 0.03, k: 0.9 }),
  questMarker: (i) => H.questMarker({ x: 900, y: 500, t: i * 0.03, reward: '+2 XP' }),
  questToast: (i) => H.questToast({ t: i * 0.03, reward: '+50 XP', k: 0.8 }),
  questComplete: (i) => H.questComplete({ t: i * 0.03, k: 0.8, reward: '+37 HP' }),
  questArrow: (i) => H.questArrow({ t: i * 0.03, glitch: 1 }),
  xpBar: (i) => H.xpBar({ t: i * 0.03, value: 0.5, level: 12, gain: 0.5 }),
  xpPop: (i) => H.xpPop({ x: 900, y: 400, age: 0.6 }),
  levelUp: (i) => H.levelUp({ t: i * 0.03, k: 0.8, level: 20 }),
  friendshipPop: (i) => H.friendshipPop({ x: 900, y: 400, age: 0.9, value: -50 }),
  updateWindow: (i) => H.updateWindow({ t: i * 0.03, scroll: 0.5 }),
  bootSequence: (i) => H.bootSequence(2 + i * 0.001, 0),
  hudFrame: (i) => H.hudFrame({ t: i * 0.03, quest: 'FIND MAX' }),
  systemMsg: (i) => H.systemMsg({ t: i * 0.03, text: 'HUD OVERLOAD', sub: 'Too many players', theme: 'warn' }),
  numbersFlood: (i) => H.numbersFlood({ t: i * 0.03, k: 1, faces: [{ x: 300, y: 500, r: 60 }, { x: 900, y: 500, r: 60 }, { x: 1500, y: 500, r: 60 }] }),
  hudShatter: (i) => H.hudShatter({ age: 0.6, svg: '<rect width="10" height="10"/>' }),
  sortByStrength: (i) => H.sortByStrength({ t: i * 0.03, sort: 0.5, pick: 2 }),
  statCompare: (i) => H.statCompare({ t: i * 0.03, choose: -0.7 }),
};
const PERF_FRAMES = {
  baseline: () => bgKitchen(),
  'kitchen + frame + 2 plates + 2 tips + xp': () => { const t = 2.3; return bgKitchen() + H.hudFrame({ t }) + H.plateFor('mom', { x: 500, y: 420, t }) + H.plateFor('max', { x: 1300, y: 420, t }) + H.tipFor('coffee', { x: 700, y: 700, t }) + H.tipFor('toaster', { x: 200, y: 700, t }) + H.xpBar({ t, value: 0.3 }) + H.xpPop({ x: 900, y: 500, age: 0.6 }); },
  'numbersFlood k 1 + 5 faces + glitched frame': () => { const t = 2.3; const faces = [0, 1, 2, 3, 4].map((i) => ({ x: 250 + i * 360, y: 500, r: 66 })); return bgKitchen() + H.numbersFlood({ t, k: 1, faces }) + H.hudFrame({ t, glitch: 0.6 }); },
  'hudShatter(svg = frame + 2 plates + xp) age .5': () => { const t = 2.3; return bgKitchen() + H.hudShatter({ age: 0.5, svg: H.hudFrame({ t }) + H.plateFor('tank', { x: 520, y: 520, t }) + H.plateFor('mom', { x: 1350, y: 560, t }) + H.xpBar({ t, value: 0.7 }) }); },
  'hudShatter glass-only age .5': () => bgKitchen() + H.hudShatter({ age: 0.5 }),
  'updateWindow scroll .5 + boot': () => bgKitchen() + H.updateWindow({ t: 2.3, scroll: 0.5 }) + H.bootSequence(2, 0),
  'questComplete + levelUp + 3 xpPops': () => { const t = 2.3; return bgKitchen() + H.questComplete({ t, k: 0.8 }) + H.levelUp({ t, k: 0.6, y: 700 }) + [0.3, 0.6, 0.9].map((a, i) => H.xpPop({ x: 400 + i * 400, y: 500, age: a })).join(''); },
};
async function perf(r) {
  console.log('JS build time per call (ms):');
  for (const [k, fn] of Object.entries(PERF_JS)) console.log(`  ${k.padEnd(16)} ${jsTime(fn).toFixed(3)}`);
  console.log('Browser render (ms, mean of 6, incl. screenshot):');
  for (const [k, fn] of Object.entries(PERF_FRAMES)) {
    S.resetIds(); const svg = fn();
    await r.render(svg);
    const t0 = Date.now(); for (let i = 0; i < 6; i++) await r.render(svg);
    console.log(`  ${k.padEnd(46)} ${((Date.now() - t0) / 6).toFixed(0)}  (${(svg.length / 1024).toFixed(0)} KB)`);
  }
}

// ---------------------------------------------------------------- runner
async function main() {
  const names = Object.keys(SHEETS).filter((n) => !ONLY || ONLY.includes(n));
  const r = await openRenderer(1920, 1080, { staticDefs: STATIC_DEFS });
  if (PERF) { await perf(r); if (!ONLY) { await r.close(); return; } }
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
