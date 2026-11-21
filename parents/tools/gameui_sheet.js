// Contact sheets of the Cube City game-UI kit (scenes/gameui.js).
// Usage:
//   node tools/gameui_sheet.js                      every sheet -> concept/gameui.png (overview) + concept/gameui_<sheet>.png
//   node tools/gameui_sheet.js --sheet chat,hud     only those sheets (overview chat hud board fx motion boss results editor devices misc)
//   node tools/gameui_sheet.js --only chat_,dome    only tiles whose key starts with one of these -> --out FILE (default /tmp/gameui_only.png)
//   node tools/gameui_sheet.js --full DIR           also write every tile as a full 1920x1080 PNG into DIR
//   node tools/gameui_sheet.js --perf               per-helper JS + browser render cost table (+ full composed frames)
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const S = require('../rig/svg');
const { openRenderer } = require('./render');
const G = require('../scenes/gameui');
const R = require('../scenes/respawn');
const K = require('../scenes/kit');
const { f, lerp, ease, clamp } = S;

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const SHEETS = arg('--sheet') ? arg('--sheet').split(',') : null;
const ONLY = arg('--only') ? arg('--only').split(',') : null;
const FULL = arg('--full');
const OUT = arg('--out');
const T0 = Number(arg('--t') || 1.3);
const PERF = args.includes('--perf');
const CONCEPT = path.join(__dirname, '..', 'concept');
const hash = G.hash;

// ---------------------------------------------------------------- backdrops (stand-ins for the real sets)
const LBL = (txt, x, y, size = 30, col = '#FFE14D') => `<text x="${x}" y="${y}" font-family="Fredoka" font-weight="700" font-size="${size}" fill="${col}" text-anchor="middle" stroke="#151515" stroke-width="7" paint-order="stroke">${txt}</text>`;
const grad = (id, a, b) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
function cubeBuilding(x, y, w, h, col, roof) {
  let o = `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" rx="8" fill="${col}" stroke="#151515" stroke-width="7"/>`;
  for (let yy = y - h + 40; yy < y - 60; yy += 80) for (let xx = x + 30; xx < x + w - 50; xx += 70) o += `<rect x="${xx}" y="${yy}" width="36" height="40" rx="6" fill="#BFE9FF" stroke="#151515" stroke-width="4"/>`;
  if (roof) o += `<rect x="${x - 10}" y="${y - h - 24}" width="${w + 20}" height="30" rx="8" fill="${roof}" stroke="#151515" stroke-width="7"/>`;
  return o;
}
function bgPlaza(floor = 900) {
  const id = S.uid('gsb');
  let o = grad(id, '#5FC4FF', '#CDEFFF') + `<rect width="1920" height="1080" fill="url(#${id})"/>`;
  o += `<g opacity="0.9"><ellipse cx="320" cy="170" rx="150" ry="46" fill="#FFFFFF"/><ellipse cx="400" cy="150" rx="90" ry="50" fill="#FFFFFF"/><ellipse cx="1500" cy="120" rx="170" ry="44" fill="#FFFFFF"/><ellipse cx="1580" cy="100" rx="90" ry="46" fill="#FFFFFF"/></g>`;
  o += `<path d="M0 ${floor - 250} Q300 ${floor - 360} 640 ${floor - 260} T1300 ${floor - 280} T1920 ${floor - 300} V${floor} H0Z" fill="#7ED68A"/>`;
  o += cubeBuilding(80, floor - 40, 260, 360, '#FFB27A', '#E0533F') + cubeBuilding(1560, floor - 40, 300, 420, '#B8A2FF', '#5B26C2') + cubeBuilding(1280, floor - 40, 200, 260, '#FFE08A', '#E0960E');
  o += `<rect y="${floor - 40}" width="1920" height="${1120 - floor}" fill="#D9D2C2"/>`;
  for (let i = 0; i < 12; i++) o += `<rect x="${i * 170 - 20}" y="${floor - 40}" width="168" height="${1120 - floor}" fill="${i % 2 ? '#CFC6B4' : '#E3DCCB'}"/>`;
  o += `<rect y="${floor - 44}" width="1920" height="10" fill="#151515" opacity="0.3"/>`;
  return o;
}
function bgNight(floor = 980) {
  const id = S.uid('gsb');
  let o = grad(id, '#120A2E', '#3A1E5C') + `<rect width="1920" height="1080" fill="url(#${id})"/>`;
  let st = '';
  for (let i = 0; i < 60; i++) st += `M${f(hash(i * 3.1) * 1920)} ${f(hash(i * 7.3) * 600)} h4 v4 h-4 Z`;
  o += `<path d="${st}" fill="#FFFFFF" opacity="0.7"/><circle cx="1650" cy="160" r="70" fill="#FFF4D6" stroke="#151515" stroke-width="6"/>`;
  let d = `M0 ${floor}`;
  for (let i = 0; i < 16; i++) { const x = i * 125, h = 140 + hash(i * 3.3) * 280; d += ` V${f(floor - h)} H${x + 110} V${floor}`; }
  o += `<path d="${d} H1920 V1080 H0Z" fill="#1C0F33"/>`;
  for (let i = 0; i < 30; i++) o += `<rect x="${f(hash(i * 5.1) * 1900)}" y="${f(floor - 60 - hash(i * 2.7) * 200)}" width="14" height="18" fill="#FFD27A" opacity="0.6"/>`;
  return o;
}
function bgArena(floor = 900) {
  const id = S.uid('gsb');
  let o = grad(id, '#F6C46A', '#FBE3B0') + `<rect width="1920" height="1080" fill="url(#${id})"/>`;
  for (let i = 0; i < 7; i++) o += `<path d="M${120 + i * 280} 60 h120 v260 l-60 -40 l-60 40 Z" fill="${['#D8262E', '#3A8DFF', '#17C3B2', '#9B5CFF'][i % 4]}" stroke="#151515" stroke-width="6"/>`;
  o += `<rect y="${floor - 300}" width="1920" height="300" fill="#A89A86"/><path d="M0 ${floor - 300} H1920" stroke="#151515" stroke-width="7"/>`;
  for (let i = 0; i < 16; i++) o += `<rect x="${i * 125}" y="${floor - 300}" width="120" height="70" fill="#958771" stroke="#151515" stroke-width="3" opacity="0.6"/>`;
  o += `<rect y="${floor - 30}" width="1920" height="${1120 - floor}" fill="#C9B89A"/><path d="M0 ${floor - 30} H1920" stroke="#151515" stroke-width="6" opacity="0.4"/>`;
  return o;
}
function bgRoom() {
  const id = S.uid('gsb');
  return grad(id, '#3B2F4A', '#5A4560') + `<rect width="1920" height="1080" fill="url(#${id})"/><rect y="860" width="1920" height="220" fill="#4A3628"/><rect x="1500" y="200" width="260" height="300" rx="12" fill="#2A3350" stroke="#151515" stroke-width="7"/><circle cx="1630" cy="280" r="40" fill="#FFF4D6" opacity="0.8"/>`;
}
function bgLava() {
  const id = S.uid('gsb');
  let o = grad(id, '#0E0A2A', '#4A1A4A') + `<rect width="1920" height="1080" fill="url(#${id})"/>`;
  o += `<rect x="760" y="420" width="400" height="700" fill="#4E4A66" stroke="#151515" stroke-width="8"/>`;
  for (let i = 0; i < 6; i++) o += `<rect x="${740 + (i % 2) * 60}" y="${470 + i * 110}" width="180" height="40" rx="6" fill="#7A7690" stroke="#151515" stroke-width="5"/>`;
  o += `<path d="M0 1000 Q200 970 400 1000 T800 1000 T1200 1000 T1600 1000 T1920 1000 V1080 H0Z" fill="#FF6A1F"/><path d="M0 1020 Q240 1000 480 1025 T960 1020 T1440 1025 T1920 1015 V1080 H0Z" fill="#FFC43D"/>`;
  return o;
}
const hero = (t, pose = {}, act = {}) => K.actor('you', t, { s: 0.5, ...pose }, act);
// stand-in for the cast's hot-dog avatar (the real one is actor('dadAvatar'))
const hotdog = (x, y, s = 0.5, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s * 3.4})"><g transform="translate(0 -95)">${G.itemIcon('hotdog')}</g><circle cx="-12" cy="-150" r="5" fill="#151515"/><circle cx="12" cy="-150" r="5" fill="#151515"/><path d="M-14 -136 Q0 -144 14 -136" stroke="#4A2A16" stroke-width="5" fill="none" stroke-linecap="round"/></g>`;
const noob = (x, y, s = 0.5, col = '#3A8DFF') => G.knockoutFly({ x0: x, y0: y, age: 0, s, x1: x, y1: y }).replace('#3A8DFF', col);

const quad4 = (svgs, labels = []) => svgs.map((v, i) => `<svg x="${(i % 2) * 960}" y="${Math.floor(i / 2) * 540}" width="960" height="540" viewBox="0 0 1920 1080">${v}</svg>` + (labels[i] ? LBL(labels[i], (i % 2) * 960 + 480, Math.floor(i / 2) * 540 + 530, 24) : '')).join('') + '<path d="M960 0 V1080 M0 540 H1920" stroke="#000" stroke-width="6"/>';
const cropGrid = (svgs, cols, focus, labels = []) => {
  const rows = Math.ceil(svgs.length / cols), w = 1920 / cols, h = 1080 / rows;
  const vh = focus[2] * h / w, vb = [focus[0] - focus[2] / 2, focus[1] - vh / 2, focus[2], vh];
  return '<rect width="1920" height="1080" fill="#000"/>' + svgs.map((v, i) => `<svg x="${(i % cols) * w}" y="${Math.floor(i / cols) * h}" width="${w}" height="${h}" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid slice">${v}</svg>` + (labels[i] ? LBL(labels[i], (i % cols) * w + w / 2, Math.floor(i / cols) * h + h - 14, 26) : '')).join('') +
    Array.from({ length: cols - 1 }, (_, i) => `<path d="M${(i + 1) * w} 0 V1080" stroke="#000" stroke-width="6"/>`).join('') + Array.from({ length: rows - 1 }, (_, i) => `<path d="M0 ${(i + 1) * h} H1920" stroke="#000" stroke-width="6"/>`).join('');
};
const MOM_ROWS = [{ rank: 1, name: 'MOM_OFFICIAL', score: 2104 }, { rank: 2, name: 'YOU', score: 2001 }, { rank: 3, name: 'xX_DarkBlade_Xx', score: 1530 }, { rank: 4, name: 'NoodleBoi', score: 1288 }, { rank: 5, name: 'LavaLord', score: 990 }];
const CLIMB = (r) => [{ rank: 1, from: 500, name: 'MOM_OFFICIAL', score: 2104, scoreFrom: 3 }, { rank: 2, from: 1, name: 'YOU', score: 2001 }, { rank: 3, from: 2, name: 'xX_DarkBlade_Xx', score: 1530 }, { rank: 4, from: 3, name: 'NoodleBoi', score: 1288 }, { rank: 5, from: 4, name: 'LavaLord', score: 990 }];

// ---------------------------------------------------------------- tiles: [key, sheet, label, fn(t)]
const TILES = [
  // ---------------- OVERVIEW (composed in-context shots)
  ['ov_lobby', 'overview', 'SC04 lobby: joinStack · nametags · caps chatBubble synced · chatLog · kissEmote', (t) => {
    let o = bgPlaza();
    o += hero(t, { x: 620, y: 930, face: 'scared', armL: 20, armR: 20 }) + G.nametag({ who: 'you', x: 620, y: 930 - 475 - 40, s: 0.9, t });
    o += hotdog(1200, 930, 0.5) + G.nametag({ who: 'dad', x: 1200, y: 600, s: 0.9, t });
    o += G.chatBubble({ x: 1200, y: 550, text: 'HELLO SON. IT IS DAD. LOVE, DAD.', caps: true, typed: 0.72, t });
    o += G.emoteHearts({ x: 1500, y: 560, age: 0.7, to: [640, 470] }) + noob(1560, 930, 0.42, '#FF6FB5') + G.nametag({ who: 'mom', x: 1560, y: 500, s: 0.8, t });
    o += G.joinStack(3.2, [{ user: 'DadBod1978', at: 0 }, { user: 'MOM_OFFICIAL', at: 1.2 }, { user: 'GrannyGoodies', at: 2.6 }], { x: 1890, y: 80, s: 0.8, gap: 110 });
    o += G.chatLog({ x: 30, y: 620, w: 600, h: 330, t: 5, lines: [{ sys: true, text: 'DadBod1978 joined the server' }, { user: 'NoodleBoi', text: 'Bro... is that your DAD?!' }, { user: 'xX_DarkBlade_Xx', text: 'lol' }, { user: 'DadBod1978', text: 'HELLO SON. IT IS DAD.', at: 4.85 }], s: 0.95 });
    return o;
  }],
  ['ov_arena', 'overview', 'SC05 arena: leaderboard HUD · comboText · slash · hitSpark · damageNumber · knockoutFly · koStars', (t) => {
    let o = bgArena();
    o += noob(1150, 900, 0.45, '#5B6684') + G.koStars({ x: 1150, y: 640, t, s: 0.8 });
    o += hero(t, { x: 500, y: 900, face: 'shocked' });
    o += G.slash({ x: 1050, y: 600, age: 0.07, angle: -20, s: 1.1 }) + G.hitSpark({ x: 1180, y: 620, age: 0.09 }) + G.damageNumber({ x: 1220, y: 500, age: 0.35, value: 999, crit: true });
    o += G.knockoutFly({ x0: 1300, y0: 900, age: 0.42, dir: 1, x1: 1500, y1: 420 }) + G.knockoutFly({ x0: 1300, y0: 900, age: 1.35, dir: 1, x1: 1500, y1: 420 });
    o += G.comboText({ x: 820, y: 260, k: 1, text: 'TRIPLE COMBO!', count: 3, t });
    o += G.leaderboard({ style: 'hud', rows: [{ rank: 1, from: 50, name: 'MOM_OFFICIAL', score: 2104 }, { rank: 2, from: 1, name: 'YOU', score: 2001 }, { rank: 3, from: 2, name: 'xX_DarkBlade_Xx', score: 1530 }, { rank: 4, from: 3, name: 'NoodleBoi', score: 1288 }], highlight: 'MOM_OFFICIAL', roll: 0.7, t, x: 1890, y: 30 });
    return o;
  }],
  ['ov_boss', 'overview', 'SC09–10 boss fight HUD: bossBar + shield · shieldDome hits · serverHealth · partyPanel · swordRain', (t) => {
    let o = bgNight();
    o += `<g transform="translate(1180 980)"><rect x="-200" y="-640" width="400" height="640" rx="30" fill="#7D8494" stroke="#151515" stroke-width="9"/><path d="M-200 -320 H200 M0 -640 V-320 M-100 -320 V0 M100 -320 V0" stroke="#5A6070" stroke-width="6"/><path d="M-130 -520 L-40 -480 L-130 -450 Z M130 -520 L40 -480 L130 -450 Z" fill="#D47CFF"/></g>` + G.crown(1180, 350, 90);
    o += G.shieldDome({ x: 1180, y: 980, r: 520, t, hits: [{ x: 900, y: 640, age: 0.15 }] });
    o += hero(t, { x: 560, y: 980, s: 0.42, face: 'determined', armR: 120 }) + G.swordRain({ age: 0.5, t, targets: [[700, 760]], s: 0.9 });
    o += G.bossBar({ value: 0.94, shield: 1, t, sub: 'SHIELD UP · BREAK THE CRYSTAL' }) + G.serverHealth({ x: 1340, y: 1000, w: 560, value: 0.2, trail: 0.5, t, s: 0.8 });
    o += G.partyPanel({ x: 30, y: 280, t, s: 0.8, members: [{ name: 'YOU', role: 'leader', hp: 0.8 }, { name: 'MOM_OFFICIAL', role: 'tank', hp: 0.62, gold: true, hit: 0.2 }, { name: 'GrannyGoodies', role: 'gear', hp: 1, heal: 0.4 }, { name: 'xX_DarkBlade_Xx', role: 'dps', hp: 0.35 }] });
    return o;
  }],
  ['ov_mvp', 'overview', 'SC11 finale: crystalShatter light · victoryCard · mvpCard (portrait slot) · confetti', (t) => quad4([
    bgLava() + G.crystal({ x: 960, y: 300, s: 0.8, t, crack: 0.75, beam: true }) + hotdog(1060, 420, 0.3, 25),
    bgLava() + G.crystalShatter({ x: 960, y: 300, age: 0.18 }),
    bgNight() + R.blockConfettiRain(t, { n: 40 }) + G.victoryCard({ k: 1, t, y: 440 }),
    bgNight() + G.mvpCard({ k: 1, t, s: 0.95, portrait: hotdog(0, 260, 0.62) }),
  ])],
  // ---------------- CHAT
  ['chat_bubbles', 'chat', 'chatBubble over heads: hero (normal) · DadBod1978 CAPS typing · user tab · typing dots · tail -1/1', (t) => {
    let o = bgPlaza();
    const h1 = G.overHead(400, 930, 0.5), h2 = G.overHead(1000, 930, 0.5);
    o += hero(t, { x: 400, y: 930, face: 'angry', armL: 60, armR: 60 }) + G.nametag({ who: 'you', x: 400, y: h1.tag, s: 0.85, t });
    o += G.chatBubble({ x: 400, y: h1.chat, text: 'This is MY server! How did this even HAPPEN?!', t, s: 0.9 });
    o += hotdog(1000, 930, 0.5) + G.nametag({ who: 'dad', x: 1000, y: 600, s: 0.85, t }) + G.chatBubble({ x: 1000, y: 550, text: 'JUMP! COMPUTER, I SAID JUMP!', caps: true, typed: 0.55, t: 0.2 });
    o += noob(1560, 930, 0.42, '#17C3B2') + G.nametag({ who: 'noodle', x: 1560, y: 500, s: 0.8, t }) + G.chatBubble({ x: 1560, y: 460, text: '', typed: 0, t: 0.3 });
    o += G.chatBubble({ x: 1560, y: 250, text: 'Bro... is that your DAD?!', user: 'NoodleBoi', t, tail: 1, s: 0.85 });
    o += G.chatBubble({ x: 300, y: 180, text: 'lol is that ur dad', user: 'PizzaKid', t, tail: -1, s: 0.8 });
    return o;
  }],
  ['chat_caps', 'chat', 'CAPS typing synced to DAD 04.2 (chatLine): t = a-0.2 · first word · "IT IS" · "LOVE" · done · out', (t) => {
    const l = K.V.L('04.2');
    const ts = [l.a - 0.2, l.word('HELLO').t1 - 0.05, l.word('IS').t1, l.word('LOVE').t1, l.b + 0.3, l.b + 1.75];
    return cropGrid(ts.map((tt) => bgPlaza() + hotdog(960, 930, 0.5) + G.nametag({ who: 'dad', x: 960, y: 600, s: 0.85, t: tt }) + G.chatBubble({ x: 960, y: 550, caps: true, t: tt, ...G.chatLine(tt, '04.2') }) + LBL(`typed ${G.chatSync(tt, '04.2').toFixed(2)}`, 960, 150, 50)), 3, [960, 520, 1100], ts.map((x) => `t ${x.toFixed(2)}`));
  }],
  ['chat_log', 'chat', 'chatLog: lines + system joins + arriving line (at) + input typing (CAPS) · send flash', (t) => {
    let o = bgPlaza();
    o += G.chatLog({ x: 60, y: 100, w: 760, h: 440, t: 10, lines: [{ sys: true, text: 'DadBod1978 joined the server' }, { sys: true, text: 'MOM_OFFICIAL joined the server' }, { user: 'NoodleBoi', text: 'Bro... is that your DAD?!' }, { user: 'YOU', text: 'Rule number one, Dad! RULE NUMBER ONE!' }, { user: 'xX_DarkBlade_Xx', text: 'Ha! The legend brought his MOMMY.', at: 9.9 }], input: { text: 'DEAR EVERYONE. WHERE IS THE JUMP BUTTON.', typed: 0.6 } });
    o += G.chatLog({ x: 1060, y: 100, w: 760, h: 440, t: 10, lines: [{ user: 'DadBod1978', text: 'DEAR EVERYONE. WHERE IS THE JUMP BUTTON.' }], send: 0.3, input: { text: '' } });
    o += G.chatLog({ x: 1060, y: 600, w: 760, h: 380, t: 10, lines: [{ sys: true, text: "DarkBlade's mom joined the server", col: '#FF9AE0' }, { user: 'xX_DarkBlade_Xx', text: '...MOM?!' }], title: 'Chat' });
    o += G.chatLog({ x: 60, y: 600, w: 760, h: 380, t: 10, scroll: 1.5, lines: [{ user: 'GrannyGoodies', text: 'Cookies are now five coins.' }, { user: 'GrannyGoodies', text: 'Ten coins on weekends.' }, { user: 'GrannyGoodies', text: "Fifteen if you're rude." }] });
    return o;
  }],
  ['chat_flood', 'chat', 'chatLog FLOOD: spacebar .15 / .6 / 1 · dad 1 (SC07) · jump .5 (SC11)', (t) => quad4([
    bgPlaza() + G.chatLog({ x: 40, y: 340, w: 640, h: 420, t, flood: 0.15, floodSet: 'spacebar', lines: [{ user: 'DadBod1978', text: 'DEAR EVERYONE. WHERE IS THE JUMP BUTTON.' }], s: 1.3 }),
    bgPlaza() + G.chatLog({ x: 40, y: 340, w: 640, h: 420, t, flood: 0.6, floodSet: 'spacebar', s: 1.3 }),
    bgPlaza() + G.chatLog({ x: 40, y: 340, w: 640, h: 420, t: t + 0.03, flood: 1, floodSet: 'dad', s: 1.3 }),
    bgLava() + G.chatLog({ x: 40, y: 340, w: 640, h: 420, t, flood: 0.5, floodSet: 'jump', s: 1.3 }),
  ], ['flood .15', 'flood .6', 'dad 1', 'jump .5'])],
  // ---------------- HUD
  ['nametags', 'hud', 'nametag presets (who) · hp bar · portrait · bob', (t) => {
    let o = bgPlaza();
    o += hero(t, { x: 300, y: 930, face: 'smug' }) + G.nametag({ who: 'you', x: 300, y: G.overHead(300, 930, 0.5).tag, t });
    o += hotdog(760, 930, 0.5) + G.nametag({ who: 'dad', x: 760, y: 600, t });
    o += G.nametag({ who: 'mom', x: 1280, y: 220, t }) + G.nametag({ who: 'granny', x: 1280, y: 330, t }) + G.nametag({ who: 'noodle', x: 1280, y: 440, t }) + G.nametag({ who: 'darkblade', x: 1280, y: 550, t, hp: 0.35 });
    o += G.nametag({ who: 'mom', x: 1280, y: 680, t, portrait: true, hp: 1, level: 99, crown: true }) + G.nametag({ name: 'noob_2011', level: 1, x: 1280, y: 800, t, s: 0.8 });
    return o;
  }],
  ['toasts', 'hud', 'joinToast stack (joinStack) · k .3 · out .5 · center · systemBanner party / info', (t) => {
    let o = bgPlaza();
    o += G.joinStack(3.4, [{ user: 'DadBod1978', at: 0 }, { user: 'MOM_OFFICIAL', at: 1.2 }, { user: 'GrannyGoodies', at: 3.0 }], { x: 1880, y: 80 });
    o += G.joinToast({ x: 1880, y: 470, k: 1, out: 0.5, user: 'NoodleBoi' }) + G.joinToast({ x: 960, y: 980, anchor: 'center', user: "DarkBlade's mom", col: '#FF9AE0', who: 'mom', k: 1, s: 1.1 });
    o += G.systemBanner({ theme: 'party', text: 'Party formed: "The Family"', t, y: 640, s: 0.9 });
    o += G.systemBanner({ theme: 'info', text: 'NEW UPDATE!', sub: 'The Block King is coming...', t, y: 220, x: 560, s: 0.72 });
    return o;
  }],
  ['hud_pills', 'hud', 'coinCounter 12 · rolling + rocket · winsCounter bump · timerHUD 3:12:45 · levelBadge · serverHealth', (t) => {
    let o = bgPlaza();
    o += G.coinCounter({ x: 50, y: 80, value: 12, t }) + G.coinCounter({ x: 50, y: 210, value: 9999999, roll: 0.55, from: 2, rocket: 1, t });
    o += G.winsCounter({ x: 50, y: 340, value: 2001, bump: 0.15, t }) + G.timerHUD({ x: 1450, y: 80, sec: 3 * 3600 + 12 * 60 + 45, label: 'TIME ON THIS WALL', t });
    o += G.levelBadge({ x: 1750, y: 330, level: 99, xp: 0.8, t }) + G.levelBadge({ x: 1500, y: 330, level: 1, xp: 0.1, t, bump: 0.2, s: 0.8 });
    o += G.serverHealth({ x: 960, y: 640, value: 0.9, t }) + G.serverHealth({ x: 960, y: 880, value: 0.2, trail: 0.5, t, hit: 0.25 });
    return o;
  }],
  ['banners', 'hud', 'systemBanner alarm (+ alarmEdges) · victory', (t) => quad4([
    bgNight() + G.alarmEdges(t, 1) + G.systemBanner({ theme: 'alarm', text: 'WARNING!\nThe Block King has awakened!', sub: 'If the server falls... everything resets!', t, y: 400 }),
    bgNight() + G.alarmEdges(t + 0.15, 1) + G.systemBanner({ theme: 'alarm', text: 'WARNING!\nThe Block King has awakened!', t: t + 0.1, k: 0.4, y: 400 }),
    bgNight() + G.systemBanner({ theme: 'victory', text: 'VICTORY! Server saved!', t, y: 400 }),
    bgPlaza() + G.systemBanner({ theme: 'info', text: "DarkBlade's mom joined the server", t, y: 300, s: 0.9 }) + G.systemBanner({ theme: 'party', text: 'Party formed: "The Family"', t, y: 700, k: 0.5 }),
  ], ['alarm', 'alarm k .4', 'victory', 'info · party k .5'])],
  // ---------------- LEADERBOARD
  ['board_night', 'board', 'leaderboard style board on a stand in the night sky (SC01) · marquee bulbs · #1 crown', (t) => bgNight() + G.leaderboard({ rows: MOM_ROWS, highlight: 'MOM_OFFICIAL', t, y: 430, s: 0.85, stand: 260 })],
  ['board_roll', 'board', 'leaderboard climb: MOM_OFFICIAL from #500 -> #1, roll 0 / .35 / .65 / 1', (t) => quad4([0, 0.35, 0.65, 1].map((r) => bgNight() + G.leaderboard({ rows: CLIMB(r), highlight: 'MOM_OFFICIAL', t, roll: r, y: 540, s: 1.15 })), ['roll 0', 'roll .35', 'roll .65', 'roll 1'])],
  ['board_tycoon', 'board', 'leaderboard board "TOP TYCOONS" (SC06) + coinCounter rocket', (t) => bgPlaza() + G.leaderboard({ title: 'TOP TYCOONS', unit: 'COINS', rows: [{ rank: 1, from: 9, name: 'GrannyGoodies', score: 9999999, scoreFrom: 2 }, { rank: 2, from: 1, name: 'LavaLord', score: 41000 }, { rank: 3, from: 2, name: 'BuilderBen', score: 23000 }, { rank: 4, from: 3, name: 'YOU', score: 12 }], nShow: 4, highlight: 'GrannyGoodies', roll: 0.8, t, x: 1100, y: 470, s: 0.8, w: 1150, h: 760 }) + G.coinCounter({ x: 40, y: 90, value: 9999999, roll: 0.8, from: 2, rocket: 1, t })],
  ['board_hud', 'board', 'leaderboard style hud (SC08: #47 YOU) · rankClimb #500 -> #1', (t) => {
    let o = bgArena();
    o += G.leaderboard({ style: 'hud', rows: [{ rank: 1, name: 'MOM_OFFICIAL', score: 2104 }, { rank: 2, name: 'GrannyGoodies', score: 1990 }, { rank: 3, name: 'DadBod1978', score: 1720 }, { rank: 4, name: 'NoodleBoi', score: 1288 }, { rank: 47, name: 'YOU', score: 12 }], highlight: 'YOU', t, x: 1890, y: 40 });
    o += G.leaderboard({ style: 'hud', title: 'TYCOON', unit: 'COINS', rows: [{ rank: 1, name: 'GrannyGoodies', score: 9999999 }, { rank: 2, name: 'LavaLord', score: 41000 }, { rank: 3, name: 'BuilderBen', score: 23000 }], highlight: 'GrannyGoodies', t, x: 1890, y: 420, nShow: 3, h: 230 });
    o += G.rankClimb({ x: 560, y: 360, from: 500, to: 1, roll: 0.55, t, name: 'MOM_OFFICIAL', s: 0.85 }) + G.rankClimb({ x: 560, y: 800, from: 500, to: 1, roll: 1, t, s: 0.75 });
    return o;
  }],
  // ---------------- FX
  ['emotes', 'fx', 'emoteHearts to a target · kissEmote · emoteWheel (kiss selected) · danceNotes', (t) => {
    let o = bgPlaza();
    o += hero(t, { x: 1500, y: 930, face: { name: 'shocked', fx: ['blush'] } });
    o += noob(300, 930, 0.45, '#FF6FB5') + G.kissEmote({ x: 380, y: 400, age: 0.45, to: [1500, 520] }) + G.emoteHearts({ x: 420, y: 420, age: 0.9, to: [1500, 520], n: 10 });
    o += G.emoteWheel({ x: 1700, y: 260, selected: 'kiss', t, s: 0.75 });
    o += hotdog(1000, 930, 0.4, -8) + G.danceNotes({ x: 1000, y: 700, t, s: 1.1 });
    return o;
  }],
  ['combat', 'fx', 'slash (angles) · hitSpark POW · damageNumber normal/crit/heal · comboText · koStars', (t) => {
    let o = bgArena();
    o += noob(900, 900, 0.45, '#5B6684') + G.koStars({ x: 900, y: 640, t, text: 'K.O.', s: 0.9 });
    o += G.slash({ x: 400, y: 450, age: 0.06, angle: -30 }) + G.slash({ x: 400, y: 750, age: 0.16, angle: 200, col: '#FFD23F', dir: -1 });
    o += G.hitSpark({ x: 1300, y: 300, age: 0.06, text: 'POW!' }) + G.hitSpark({ x: 1600, y: 300, age: 0.2, col: '#7CF3FF', seed: 3 });
    o += G.damageNumber({ x: 1250, y: 650, age: 0.25, value: 25 }) + G.damageNumber({ x: 1500, y: 650, age: 0.18, value: 999, crit: true }) + G.damageNumber({ x: 1750, y: 650, age: 0.3, value: 50, heal: true });
    o += G.comboText({ x: 1300, y: 900, k: 1, text: 'TRIPLE COMBO!', count: 3, t, s: 0.8 });
    return o;
  }],
  ['knockout', 'fx', 'knockoutFly: one flight sampled at ages .0 .15 .3 .5 .75 1.0 + twinkle 1.25', (t) => {
    let o = bgArena();
    for (const a of [0, 0.15, 0.3, 0.5, 0.75, 1.0, 1.25]) o += G.knockoutFly({ x0: 400, y0: 900, age: a, dir: 1, x1: 1700, y1: 140 });
    return o + G.hitSpark({ x: 420, y: 650, age: 0.08, text: 'BONK!' });
  }],
  ['swords', 'fx', 'swordRain into hands (targets) · into the ground · potionPop .3/.8 · potion prop', (t) => {
    let o = bgArena();
    const hands = [[337, 823], [557, 823], [777, 823], [997, 823]];
    o += hands.map(([x, y], i) => noob(x, 900, 0.36, ['#3A8DFF', '#FF6FB5', '#17C3B2', '#FF8A2B'][i])).join('');
    o += G.swordRain({ age: 1.25, t, targets: hands, s: 0.8, stagger: 0.6 });
    o += G.swordRain({ age: 0.9, t, x0: 1150, x1: 1850, n: 8, floorY: 880, seed: 3 });
    o += G.potionPop({ x: 1300, y: 420, age: 0.3 }) + G.potionPop({ x: 1650, y: 420, age: 0.85 }) + G.potion(1100, 300, 0.8, -12);
    return o;
  }],
  // ---------------- MOTION strips
  ['motion_hits', 'motion', 'time strips: slash · hitSpark · damageNumber crit (ages)', (t) => {
    const ages = [0.03, 0.08, 0.14, 0.22, 0.3];
    const fr = [];
    for (const a of ages) fr.push(bgArena() + G.slash({ x: 960, y: 540, age: a, angle: -25, s: 1.5 }));
    for (const a of ages) fr.push(bgArena() + G.hitSpark({ x: 960, y: 540, age: a, s: 1.5, text: 'POW!' }));
    for (const a of [0.05, 0.15, 0.35, 0.7, 0.95]) fr.push(bgArena() + G.damageNumber({ x: 960, y: 640, age: a, value: 999, crit: true, s: 1.5 }));
    return cropGrid(fr, 5, [960, 540, 860], [...ages.map((a) => `slash ${a}`), ...ages.map((a) => `spark ${a}`), '.05', '.15', '.35', '.7', '.95']);
  }],
  ['motion_pops', 'motion', 'time strips: kissEmote · comboText k · stamp k (SOLD)', (t) => {
    const fr = [];
    for (const a of [0.08, 0.2, 0.5, 1.0, 1.6]) fr.push(bgPlaza() + G.kissEmote({ x: 960, y: 520, age: a, s: 1.4 }));
    for (const k of [0.15, 0.3, 0.45, 0.7, 1]) fr.push(bgArena() + G.comboText({ x: 960, y: 520, k, count: 3, t, s: 1.2 }));
    for (const k of [0.12, 0.25, 0.35, 0.5, 1]) fr.push(bgPlaza() + G.stamp({ x: 960, y: 540, k, s: 1.6 }));
    return cropGrid(fr, 5, [960, 520, 1300], ['kiss .08', '.2', '.5', '1.0', '1.6', 'combo .15', '.3', '.45', '.7', '1', 'stamp .12', '.25', '.35', '.5', '1']);
  }],
  ['motion_chat', 'motion', 'time strips: chatBubble pop k · out · joinToast k · systemBanner k', (t) => {
    const fr = [];
    for (const k of [0.15, 0.35, 0.6, 1]) fr.push(bgPlaza() + G.chatBubble({ x: 960, y: 700, text: 'Good game, sweetie! Drink some water!', k, t, s: 1.4 }));
    fr.push(bgPlaza() + G.chatBubble({ x: 960, y: 700, text: 'Good game, sweetie! Drink some water!', out: 0.5, t, s: 1.4 }));
    for (const k of [0.15, 0.35, 0.6, 0.85, 1]) fr.push(bgPlaza() + G.joinToast({ x: 1500, y: 540, k, s: 1.4 }));
    for (const k of [0.1, 0.25, 0.45, 0.7, 1]) fr.push(bgNight() + G.systemBanner({ theme: 'alarm', text: 'WARNING!', k, t, y: 540 }));
    return cropGrid(fr, 5, [1050, 600, 1300], ['pop .15', '.35', '.6', '1', 'out .5', 'toast .15', '.35', '.6', '.85', '1', 'banner .1', '.25', '.45', '.7', '1']);
  }],
  ['motion_boss', 'motion', 'time strips: crystalShatter · bossCrumble · shieldDome k/shatter', (t) => {
    const fr = [];
    for (const a of [0.03, 0.15, 0.4, 0.9, 1.6]) fr.push(bgLava() + G.crystal({ x: 960, y: 440, t, k: 0 }) + G.crystalShatter({ x: 960, y: 440, age: a }));
    for (const a of [0.05, 0.25, 0.5, 1.0, 1.8]) fr.push(bgNight() + G.bossCrumble({ x: 960, y: 950, w: 520, h: 700, age: a }));
    for (const v of [[0.3, 0], [0.7, 0], [1, 0], [1, 0.25], [1, 0.6]]) fr.push(bgNight() + G.shieldDome({ x: 960, y: 950, r: 600, t, k: v[0], shatter: v[1] }));
    return cropGrid(fr, 5, [960, 600, 1500], ['shatter .03', '.15', '.4', '.9', '1.6', 'crumble .05', '.25', '.5', '1.0', '1.8', 'dome k .3', 'k .7', 'k 1', 'shatter .25', '.6']);
  }],
  // ---------------- BOSS
  ['boss_hud', 'boss', 'bossBar: shield 1 · shield .4 + hit · no shield, value .2 + trail', (t) => {
    let o = bgNight();
    o += G.bossBar({ value: 1, shield: 1, t, y: 120 }) + G.bossBar({ value: 0.85, shield: 0.4, t, y: 420, hit: 0.3, trail: 0.95 }) + G.bossBar({ value: 0.2, trail: 0.45, t, y: 720, sub: 'DEFEATED... BY A HOT DOG?!' });
    return o;
  }],
  ['dome', 'boss', 'shieldDome around the boss: shimmer · hits ripple · crack .6', (t) => quad4([
    bgNight() + G.shieldDome({ x: 960, y: 980, r: 640, t, hits: [{ x: 700, y: 700, age: 0.12 }, { x: 1300, y: 600, age: 0.35 }] }),
    bgNight() + G.shieldDome({ x: 960, y: 980, r: 640, t: t + 0.8, crack: 0.6 }),
  ].concat([bgNight() + G.shieldDome({ x: 960, y: 980, r: 640, t, shatter: 0.3 }), bgNight() + G.shieldDome({ x: 960, y: 980, r: 640, t, k: 0.5 })]), ['hits', 'crack .6', 'shatter .3', 'k .5 (raising)'])],
  ['crystal', 'boss', 'crystal close-up (beam) · crack .45 · crack .9 + the hot dog · crystalShatter .1 (full-frame light)', (t) => quad4([
    bgLava() + G.crystal({ x: 960, y: 470, s: 1.7, t, beam: true }),
    bgLava() + G.crystal({ x: 960, y: 470, s: 1.7, t: t + 0.5, crack: 0.45 }),
    bgLava() + G.crystal({ x: 960, y: 470, s: 1.7, t: t + 0.07, crack: 0.9 }) + hotdog(1240, 760, 0.62, 30),
    bgLava() + G.crystalShatter({ x: 960, y: 470, age: 0.1, s: 1.5 }),
  ], ['beam', 'crack .45', 'crack .9', 'shatter .1'])],
  ['boss_fight', 'boss', 'hits bounce off the dome: slash + hitSpark + IMMUNE · bossBar 0 + bossCrumble .3 · serverHealth climbing back', (t) => quad4([
    bgNight() + G.shieldDome({ x: 1180, y: 1000, r: 560, t, hits: [{ x: 760, y: 700, age: 0.1 }] }) + G.slash({ x: 700, y: 700, age: 0.07, angle: 10, s: 1.2, col: '#FFD23F' }) + G.hitSpark({ x: 760, y: 700, age: 0.08, col: '#C77DFF' }) + G.damageNumber({ x: 780, y: 560, age: 0.25, text: 'IMMUNE', col: '#C9B6FF' }) + hero(t, { x: 420, y: 1000, s: 0.5, view: 'side', flip: true, armR: 120, face: 'determined' }),
    bgNight() + G.bossBar({ value: 0, trail: 0.15, t }) + G.bossCrumble({ x: 960, y: 1000, w: 600, h: 760, age: 0.3 }),
    bgNight() + G.alarmEdges(t, 0.6) + G.serverHealth({ x: 960, y: 540, value: 0.2, trail: 0.9, t, s: 1.2 }),
    bgNight() + G.bossBar({ value: 0.55, trail: 0.8, t, hit: 0.15 }) + G.partyPanel({ x: 40, y: 300, t, k: 0.55 }),
  ], ['dome hit', 'crumble .3', 'health trail', 'party k .55'])],
  // ---------------- RESULTS
  ['victory', 'results', 'victoryCard k .3 / .6 / 1 · + confetti', (t) => quad4([
    bgNight() + G.victoryCard({ k: 0.3, t }), bgNight() + G.victoryCard({ k: 0.6, t }),
    bgNight() + R.blockConfettiRain(t, { n: 50 }) + G.victoryCard({ k: 1, t }), bgNight() + G.victoryCard({ k: 1, t, title: 'GG!', sub: 'BOSS DEFEATED' }),
  ])],
  ['mvp', 'results', 'mvpCard k .25 / .55 / 1 (portrait slot = hot dog) · partyPanel', (t) => quad4([
    bgNight() + G.mvpCard({ k: 0.25, t, portrait: hotdog(0, 260, 0.62) }), bgNight() + G.mvpCard({ k: 0.55, t, portrait: hotdog(0, 260, 0.62) }),
    bgNight() + G.mvpCard({ k: 1, t, portrait: hotdog(0, 260, 0.62), s: 0.95 }),
    bgNight() + G.partyPanel({ x: 60, y: 120, t, s: 1.25, members: [{ name: 'YOU', role: 'leader', hp: 0.9 }, { name: 'MOM_OFFICIAL', role: 'tank', hp: 0.5, gold: true }, { name: 'GrannyGoodies', role: 'gear', hp: 1 }, { name: 'DadBod1978', role: 'noob', hp: 1 }, { name: 'NoodleBoi', role: 'dps', hp: 0.2 }] }),
  ])],
  ['titles', 'results', 'bigTitle gold FAMILY GAME NIGHT · retro ARCADE QUEEN 1998 · teal · night', (t) => quad4([
    bgRoom() + G.bigTitle({ text: 'FAMILY\nGAME NIGHT', sub: 'TONIGHT 7 PM', t }),
    `<rect width="1920" height="1080" fill="#1A0A3A"/>` + G.bigTitle({ text: 'ARCADE QUEEN', sub: 'STATE CHAMPION 1998', theme: 'retro', t, size: 190 }),
    bgPlaza() + G.bigTitle({ text: 'CUBE CITY', sub: 'LEVEL 99', theme: 'teal', t }),
    bgNight() + G.bigTitle({ text: 'THE BLOCK KING', theme: 'night', t, size: 160, k: 0.7 }),
  ])],
  // ---------------- EDITOR
  ['editor', 'editor', 'avatarEditor: COSTUMES tab · hot dog selected + PURCHASED! · username typed .7 · password WEAK! · pointer', (t) => {
    const o0 = { t, tab: 'COSTUMES', selected: 'hotdog', hover: 'pizza', purchased: 0.7, username: 'DadBod1978', typed: 0.7, password: { text: 'password', typed: 1, warn: 1 }, bought: 37, coins: 1000 };
    const cpos = G.editorCard(o0, 'pizza');
    return bgRoom() + G.avatarEditor({ ...o0, preview: hotdog(0, 0, 0.5), pointer: { x: cpos.bx, y: cpos.by, press: 0.3 } });
  }],
  ['editor2', 'editor', 'avatarEditor k .5 · HATS tab, hero preview, username typed 0 · EXTRAS owned', (t) => quad4([
    bgRoom() + G.avatarEditor({ t, k: 0.5, username: '', typed: 0 }),
    bgRoom() + G.avatarEditor({ t, tab: 'HATS', selected: 'crown', press: 0.3, username: 'D', typed: 1, nameOk: 0, preview: hero(t, { x: 0, y: 0, s: 0.5, face: 'happy' }) }),
    bgRoom() + G.avatarEditor({ t, tab: 'EXTRAS', owned: ['pearls', 'furcoat', 'cane'], selected: 'potlid', coins: 9999999, username: 'GrannyGoodies' }),
    bgRoom() + G.avatarEditor({ t, tab: 'FACES', selected: 0, username: 'MOM_OFFICIAL', preview: noob(0, 0, 0.5, '#9AA0AE') }),
  ])],
  // ---------------- DEVICES
  ['devices', 'devices', 'deviceFrame laptopOld · tablet · phone · pc — showing game footage (svg) · screenGlow · power-on', (t) => {
    const game = bgPlaza() + hero(t, { x: 960, y: 930 }) + G.chatBubble({ x: 960, y: 380, text: 'lol is that ur dad', t, s: 1.4 });
    return quad4([
      bgRoom() + G.deviceFrame({ type: 'laptopOld', x: 960, y: 420, s: 1, screen: game, glow: 1, t }),
      bgRoom() + G.deviceFrame({ type: 'tablet', x: 960, y: 520, s: 1.1, screen: game, glow: 0.6, t, rot: -4 }),
      bgRoom() + G.deviceFrame({ type: 'phone', x: 700, y: 540, s: 1, screen: (w, h) => `<svg width="${w}" height="${h}" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">${game}</svg>` + `<rect x="20" y="${h - 160}" width="${w - 40}" height="120" rx="20" fill="#FFFFFF" stroke="#151515" stroke-width="5"/><text x="${w / 2}" y="${h - 88}" font-family="Fredoka" font-weight="700" font-size="22" fill="#1E2A44" text-anchor="middle">HELLO PHONE MAKE ME</text><text x="${w / 2}" y="${h - 58}" font-family="Fredoka" font-weight="700" font-size="22" fill="#1E2A44" text-anchor="middle">A GAME PERSON</text>`, t }) +
        G.deviceFrame({ type: 'phone', x: 1400, y: 540, s: 0.8, landscape: true, screen: game, t, rot: 8 }),
      bgRoom() + G.deviceFrame({ type: 'pc', x: 960, y: 440, s: 1, screen: game, glow: 0.8, t, k: 0.5 }) + G.screenGlow(1600, 500, 360, 420, '#9FE8FF', 1),
    ], ['laptopOld (Dad)', 'tablet (Mom)', 'phone (Granny) + landscape', 'pc k .5 power-on + screenGlow']);
  }],
  // ---------------- MISC
  ['misc', 'misc', 'stamp SOLD / MVP / TONIGHT · tumbleweed · wallet + moth · keycaps SPACE / CAPS LOCK · cubeLogo', (t) => {
    let o = bgPlaza();
    o += G.stamp({ text: 'SOLD', x: 320, y: 200, k: 1 }) + G.stamp({ text: 'MVP', x: 320, y: 420, k: 1, col: G.P.goldD, rot: 8 }) + G.stamp({ text: 'TONIGHT', x: 320, y: 640, k: 1, col: G.P.tealD, rot: -6, s: 0.8 });
    o += G.tumbleweed({ x: 900, y: 880, t, s: 1 }) + G.tumbleweed({ x: 1180, y: 880, t: t + 0.4, s: 0.6 });
    o += G.wallet({ x: 1560, y: 420, k: 1, moth: 0.35, t, s: 0.8 });
    o += G.keycap({ x: 900, y: 300, w: 520, h: 120, label: 'SPACE', press: 0.6 }) + G.keycap({ x: 900, y: 520, w: 260, label: 'CAPS LOCK', led: true, t, size: 30 });
    o += G.cubeLogo(1560, 900, 1);
    return o;
  }],
  ['misc_rewind', 'misc', 'rewind (respawn.js) over the night city · cube portraits · icons', (t) => quad4([
    G.rewind(t, 1, { svg: bgNight() + G.leaderboard({ rows: MOM_ROWS, t, s: 0.6, y: 420 }), clock: 'SAT 8:00 AM' }),
    `<rect width="1920" height="1080" fill="#2A3350"/>` + ['you', 'dad', 'mom', 'granny', 'noodle', 'darkblade', 'kid', 'boss', 'cube', null].map((w, i) => G.portrait(w, 220 + (i % 5) * 370, 300 + Math.floor(i / 5) * 420, 130, { col: '#FF8A2B', gold: w === 'mom' && i > 2 }) + LBL(w || 'generic', 220 + (i % 5) * 370, 490 + Math.floor(i / 5) * 420, 40)).join(''),
    `<rect width="1920" height="1080" fill="#FFF8EC"/>` + G.coinIcon(200, 300, 100, 0.3) + G.crown(500, 380, 100) + G.trophy(800, 300, 110) + G.sword(1100, 420, 1) + G.shieldIcon(1400, 300, 110) + G.potion(1700, 300, 1.6) + G.heart(200, 700, 90) + G.lockIcon(500, 700, 90) + G.clockIcon(800, 720, 90, t) + G.serverIcon(1100, 720, 90, t) + G.isoCube(1400, 700, 100) + G.pointer(1650, 600, 1.5, 0.3),
    bgPlaza() + ['tophat', 'cowboy', 'crown', 'propeller', 'chef', 'viking', 'sunglasses', 'mustache', 'monocle', 'face', 'hotdog', 'pizza', 'banana', 'dino', 'tutu', 'armor', 'wings', 'dragonwings', 'cape', 'potlid', 'pearls', 'furcoat', 'cane', 'shirt'].map((id, i) => `<g transform="translate(${160 + (i % 8) * 230} ${200 + Math.floor(i / 8) * 330}) scale(1.2)">${G.itemIcon(id)}</g>` + LBL(id, 160 + (i % 8) * 230, 330 + Math.floor(i / 8) * 330, 30)).join(''),
  ])],
];
const OVERVIEW = ['ov_lobby', 'ov_arena', 'ov_boss', 'ov_mvp'];
const SHEET_TILES = {};
for (const [key, sheet] of TILES) (SHEET_TILES[sheet] = SHEET_TILES[sheet] || []).push(key);

// --perf list: each helper alone on a flat frame
const PERF_LIST = [
  ['chatBubble caps typing', () => G.chatBubble({ x: 960, y: 500, text: 'HELLO SON. IT IS DAD. LOVE, DAD.', caps: true, typed: 0.6, t: 0.2 })],
  ['chatLog 5 lines + input', () => G.chatLog({ t: 10, lines: [{ sys: true, text: 'DadBod1978 joined the server' }, { user: 'NoodleBoi', text: 'Bro... is that your DAD?!' }, { user: 'YOU', text: 'Rule number one, Dad!' }, { user: 'xX_DarkBlade_Xx', text: 'Ha! The legend brought his MOMMY.' }], input: { text: 'DEAR EVERYONE', typed: 1 } })],
  ['chatLog flood .6', () => G.chatLog({ t: 1, flood: 0.6 })],
  ['joinStack x3', () => G.joinStack(3.2, [{ user: 'DadBod1978', at: 0 }, { user: 'MOM_OFFICIAL', at: 1.2 }, { user: 'GrannyGoodies', at: 2.6 }])],
  ['systemBanner alarm + edges', () => G.alarmEdges(1, 1) + G.systemBanner({ theme: 'alarm', text: 'WARNING!\nThe Block King has awakened!', t: 1 })],
  ['nametag x6', () => ['you', 'dad', 'mom', 'granny', 'noodle', 'darkblade'].map((w, i) => G.nametag({ who: w, x: 300 + i * 260, y: 300, t: 1 })).join('')],
  ['leaderboard board rolling', () => G.leaderboard({ rows: CLIMB(0.5), highlight: 'MOM_OFFICIAL', roll: 0.5, t: 1, stand: true })],
  ['leaderboard hud', () => G.leaderboard({ style: 'hud', rows: MOM_ROWS, highlight: 'YOU', t: 1 })],
  ['coinCounter rolling + rocket', () => G.coinCounter({ value: 9999999, roll: 0.5, from: 2, rocket: 1, t: 1 })],
  ['serverHealth low', () => G.serverHealth({ value: 0.2, trail: 0.5, t: 1 })],
  ['emoteHearts 12 + kissEmote', () => G.emoteHearts({ age: 0.6, to: [1300, 400] }) + G.kissEmote({ age: 0.4, x: 600 })],
  ['slash + hitSpark + damage crit', () => G.slash({ age: 0.08 }) + G.hitSpark({ age: 0.1, x: 1100 }) + G.damageNumber({ age: 0.2, crit: true, value: 999 })],
  ['knockoutFly (noob)', () => G.knockoutFly({ x0: 500, y0: 900, age: 0.4 })],
  ['comboText', () => G.comboText({ k: 1, count: 3, t: 1 })],
  ['swordRain 24', () => G.swordRain({ age: 1, t: 1 })],
  ['potionPop', () => G.potionPop({ age: 0.8 })],
  ['bossBar shield', () => G.bossBar({ value: 0.9, shield: 1, t: 1 })],
  ['shieldDome r 640 + hits', () => G.shieldDome({ r: 640, t: 1, hits: [{ x: 800, y: 600, age: 0.2 }] })],
  ['shieldDome shatter .3', () => G.shieldDome({ r: 640, t: 1, shatter: 0.3 })],
  ['crystal + beam + crack', () => G.crystal({ t: 1, beam: true, crack: 0.8 })],
  ['crystalShatter .1 (full-frame)', () => G.crystalShatter({ age: 0.1 })],
  ['bossCrumble .5', () => G.bossCrumble({ age: 0.5 })],
  ['partyPanel x4', () => G.partyPanel({ t: 1 })],
  ['victoryCard', () => G.victoryCard({ k: 1, t: 1 })],
  ['mvpCard (default portrait)', () => G.mvpCard({ k: 1, t: 1 })],
  ['avatarEditor full', () => G.avatarEditor({ t: 1, selected: 'hotdog', purchased: 1, username: 'DadBod1978', typed: 1, bought: 37 })],
  ['deviceFrame laptopOld (empty screen)', () => G.deviceFrame({ type: 'laptopOld', glow: 1 })],
  ['bigTitle retro', () => G.bigTitle({ text: 'ARCADE QUEEN', theme: 'retro', sub: '1998', t: 1 })],
  ['stamp + tumbleweed + wallet', () => G.stamp({ x: 400 }) + G.tumbleweed({ t: 1 }) + G.wallet({ x: 1500, moth: 0.4, t: 1 })],
];

(async () => {
  const r = await openRenderer(1920, 1080, { staticDefs: require('../scenes/main').STATIC_DEFS });
  if (PERF) {
    const tm = async (svg) => { const ts = []; for (let i = 0; i < 7; i++) { const b = Date.now(); await r.render(svg, 'jpeg'); ts.push(Date.now() - b); } return ts.sort((x, y) => x - y)[3]; };
    const base = '<rect width="1920" height="1080" fill="#556070"/>';
    const b0 = await tm(base);
    console.log(`empty frame: ${b0} ms (subtracted)\n`);
    console.log('| helper | elems | JS ms | svg ms |\n|---|---:|---:|---:|');
    for (const [name, fn] of PERF_LIST) {
      fn();
      const j0 = process.hrtime.bigint();
      let svg = '';
      for (let i = 0; i < 20; i++) { S.resetIds(); svg = fn(); }
      const js = Number(process.hrtime.bigint() - j0) / 1e6 / 20;
      const el = (svg.match(/<(path|rect|circle|ellipse|text|polygon|g|svg|use)\b/g) || []).length;
      const ms = await tm(base + svg);
      console.log(`| ${name} | ${el} | ${js.toFixed(2)} | ${Math.max(0, ms - b0)} |`);
    }
    console.log('\nfull composed frames (backdrop + hero + UI):');
    for (const key of OVERVIEW.slice(0, 3)) {
      const fn = TILES.find((x) => x[0] === key)[3];
      S.resetIds();
      const j0 = process.hrtime.bigint(); const svg = fn(T0); const js = Number(process.hrtime.bigint() - j0) / 1e6;
      const ms = await tm(svg);
      console.log(`| ${key} | ${(svg.match(/<(path|rect|circle|ellipse|text|g)\b/g) || []).length} | ${js.toFixed(1)} | ${ms} total |`);
    }
    await r.close();
    return;
  }
  fs.mkdirSync(CONCEPT, { recursive: true });
  if (FULL) fs.mkdirSync(FULL, { recursive: true });
  const tmp = fs.mkdtempSync('/tmp/gameui-');
  const renderTile = async (key) => {
    const [, , label, fn] = TILES.find((x) => x[0] === key);
    S.resetIds();
    const j0 = Date.now();
    const svg = fn(T0);
    const js = Date.now() - j0;
    const b = Date.now();
    const png = await r.render(svg + `<rect x="0" y="0" width="1920" height="46" fill="#000" opacity="0.7"/>` + `<text x="14" y="33" font-family="Fredoka" font-weight="700" font-size="28" fill="#FFE14D">${label.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`);
    const p = path.join(tmp, key + '.png');
    fs.writeFileSync(p, png);
    if (FULL) fs.writeFileSync(path.join(FULL, key + '.png'), png);
    console.log(`${key.padEnd(14)} js ${String(js).padStart(3)} ms  render ${Date.now() - b} ms`);
    return p;
  };
  // a sheet = its tiles in a 2-column grid at half size (960x540 each); a single tile stays full size
  const writeSheet = (files, out) => {
    if (files.length === 1) { fs.copyFileSync(files[0], out); return; }
    const n = files.length + (files.length % 2), rows = n / 2;
    const ins = files.flatMap((p) => ['-i', p]);
    if (files.length % 2) ins.push('-f', 'lavfi', '-i', 'color=c=black:s=1920x1080');
    let fc = Array.from({ length: n }, (_, i) => `[${i}:v]scale=960:540[s${i}];`).join('');
    fc += Array.from({ length: n }, (_, i) => `[s${i}]`).join('') + `xstack=inputs=${n}:layout=${Array.from({ length: n }, (_, i) => `${(i % 2) * 960}_${Math.floor(i / 2) * 540}`).join('|')}`;
    execFileSync('ffmpeg', ['-v', 'error', '-y', ...ins, '-filter_complex', fc, '-frames:v', '1', out]);
  };
  if (ONLY) {
    const keys = TILES.map((x) => x[0]).filter((k) => ONLY.some((o) => k.startsWith(o)));
    const files = [];
    for (const k of keys) files.push(await renderTile(k));
    const out = OUT || '/tmp/gameui_only.png';
    writeSheet(files, out);
    console.log('wrote', out);
  } else {
    const sheets = SHEETS || ['overview', ...Object.keys(SHEET_TILES).filter((s) => s !== 'overview')];
    for (const sh of sheets) {
      const keys = sh === 'overview' ? OVERVIEW : SHEET_TILES[sh] || [];
      const files = [];
      for (const k of keys) files.push(await renderTile(k));
      const out = path.join(CONCEPT, sh === 'overview' ? 'gameui.png' : `gameui_${sh}.png`);
      writeSheet(files, out);
      console.log('wrote', out);
    }
  }
  await r.close();
})().catch((e) => { console.error(e); process.exit(1); });
