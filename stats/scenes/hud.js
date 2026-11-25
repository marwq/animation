// REALITY HUD v1.0 — the stats overlay of "What If You Could See Everyone's STATS in Real Life?".
// Pure, deterministic functions returning SVG strings (every random value comes from hash(seed)).
// Scenes: const H = require('./hud');   API + recipes: docs/HUD.md   contact sheets: concept/hud*.png (tools/hud_sheet.js)
//
//   Plates ......... statPlate({x,y,s,k,t,name,level,title,bars,tags,boss,crown,theme,glitch,fade,error}), plateFor(who, over),
//                    miniPlate({...}) (crowds), heroPlate({x,y,s,t,k,reveal}) ("???" -> BIG BROTHER), overHead(who,x,y,s)
//   Objects ........ tooltip({x,y,k,t,title,lines,rarity,pointer,side}), tipFor(key, over), lieMeter({x,y,k,t,value})
//   Quests ......... questMarker({x,y,s,t,kind,k,col,reward}), questToast({k,t,title,reward}), questComplete({k,t,reward}),
//                    questArrow({x,y,angle,t,glitch}), epicQuest({k,t,title,reward}) (= pillowFort)
//   XP ............. xpBar({x,y,w,value,level,k,t,gain}), xpPop({x,y,age,amount,to}), levelUp({k,t,level,from})
//   Friendship ..... friendshipPop({x,y,age,value,hold})
//   System ......... updateWindow({k,t,scroll,accept,install}), bootSequence(t,t0,{dur}), hudFrame({t,k,clock,minimap,closeX}),
//                    systemMsg({k,t,text,sub,theme,icon}), bossBar({k,t,name,sub,value}), pixelBurst({x,y,age})
//   Overload / off . numbersFlood({t,k,seed,faces}), hudGlitch(svg,t,k), closeX({x,y,k,t,highlight,press}), hudShatter({age,svg})
//   Montage ........ sortByStrength({k,t,players,sort,pick,press}), statCompare({k,t,left,right,choose})
//
// THE LOOK ("Reality HUD v1.0"): translucent ink-blue glass with faint scanlines, a thin bright cyan inner rim, a dark outer
// edge (keeps it readable on any background), corners CUT at top-left + bottom-right and AR target brackets on the other two
// corners. Bars are slanted and segmented into cells. A thin tether + diamond pin ties every plate to what it describes.
// Themes: cyan (default) · boss (red) · gold (quests / XP / rewards) · warm (BIG BROTHER) · cold (SC07) · error (glitch) · pet · green.
// Titles / numbers in Lilita One, labels in Fredoka 700 letter-spaced caps. No filters, masks or blend modes.
'use strict';

const S = require('../rig/svg');
const R = require('./respawn');
const { f, clamp, lerp, ease } = S;
const { hash, seg, textW, scramble, mix, star4, star5 } = R;

const W = 1920, H = 1080;
const INK = '#151515';
const bumpK = (k) => Math.sin(clamp(k, 0, 1) * Math.PI);
const mod = (a, n) => ((a % n) + n) % n;
const tr = (x, y, s = 1, rot = 0) => `translate(${f(x)} ${f(y)})${rot ? ` rotate(${f(rot)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clean = (s) => String(s).replace(/−/g, '–');
const ln = (w, c, op) => ({ fill: 'none', stroke: c, 'stroke-width': f(w), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(op !== undefined ? { opacity: f(op) } : {}) });
const ol = (fill, w = 5, c = INK) => ({ fill, stroke: c, 'stroke-width': f(w), 'stroke-linejoin': 'round' });
const outl = (sw, col = '#03101B') => ({ stroke: col, 'stroke-width': f(sw), 'stroke-linejoin': 'round', 'paint-order': 'stroke' });
// text: Lilita One (titles, numbers) / Fredoka 700 (UI) / Fredoka 600
const TL = (s, x, y, size, fill, ex = {}) => S.el('text', { x: f(x), y: f(y), 'font-family': 'Lilita One, sans-serif', 'font-size': f(size), fill, 'text-anchor': 'middle', ...ex }, esc(clean(s)));
const TF = (s, x, y, size, fill, ex = {}) => S.el('text', { x: f(x), y: f(y), 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': f(size), fill, 'text-anchor': 'middle', ...ex }, esc(clean(s)));
const TW = (str, size, font = 'F', sp = 0) => textW(clean(str), size, font, sp);

// ---------------------------------------------------------------- themes
const TH = {
  cyan: { glass: '#061624', op: 0.8, rim: '#3BE8FF', hi: '#C6FBFF', edge: '#020C16', text: '#F2FDFF', label: '#8BDCEB', badge: '#3BE8FF', badgeTx: '#04121E', dim: '#2A5566' },
  boss: { glass: '#26050D', op: 0.86, rim: '#FF3355', hi: '#FFC2CC', edge: '#14020A', text: '#FFF2F4', label: '#FF9DAD', badge: '#FF3355', badgeTx: '#FFF6D8', dim: '#6A1424' },
  gold: { glass: '#1E1404', op: 0.86, rim: '#FFC83A', hi: '#FFF1B8', edge: '#120A00', text: '#FFF8E6', label: '#FFD98A', badge: '#FFC83A', badgeTx: '#2A1A00', dim: '#6A5214' },
  warm: { glass: '#FF9A3D', op: 0.55, rim: '#FFF1D2', hi: '#FFFFFF', edge: '#7A2E08', text: '#FFFFFF', label: '#FFE3B8', badge: '#FF6B6B', badgeTx: '#FFFFFF', dim: '#B8703A' },
  cold: { glass: '#0B141E', op: 0.86, rim: '#7FA3BF', hi: '#D3E4F0', edge: '#050A10', text: '#DCE8F2', label: '#7F96AA', badge: '#7FA3BF', badgeTx: '#0B141E', dim: '#2E3E4C' },
  error: { glass: '#1C0519', op: 0.88, rim: '#FF2EA6', hi: '#FFC4E8', edge: '#0E020C', text: '#FFF0FA', label: '#FF8FD0', badge: '#FF2EA6', badgeTx: '#FFF0FA', dim: '#6A1450' },
  pet: { glass: '#220A1C', op: 0.82, rim: '#FF8AD8', hi: '#FFE0F4', edge: '#12040E', text: '#FFF4FB', label: '#FFB8E6', badge: '#FFC83A', badgeTx: '#2A1A00', dim: '#6A2A5A' },
  green: { glass: '#04180E', op: 0.86, rim: '#3DFF8F', hi: '#CFFFE2', edge: '#010C06', text: '#F0FFF6', label: '#8FE8B4', badge: '#3DFF8F', badgeTx: '#04180E', dim: '#1E5A36' },
  warn: { glass: '#1E1404', op: 0.88, rim: '#FFB020', hi: '#FFE7B0', edge: '#120A00', text: '#FFF8E6', label: '#FFD07A', badge: '#FFB020', badgeTx: '#2A1A00', dim: '#6A4A14' },
};
const theme = (th) => (th && typeof th === 'object' ? { ...TH.cyan, ...th } : TH[th] || TH.cyan);
function mixTheme(a, b, k) {
  a = theme(a); b = theme(b);
  if (k <= 0) return a;
  if (k >= 1) return b;
  const o = {};
  for (const key of Object.keys(a)) o[key] = typeof a[key] === 'number' ? lerp(a[key], b[key], k) : mix(a[key], b[key], k);
  return o;
}

// bar colours by label, tag colours by text, rarity colours
const BAR_COL = {
  HP: '#3DFF8F', HEALTH: '#3DFF8F', ENERGY: '#FFD23F', CHAOS: '#FF4FD8', PATIENCE: '#FF7A3D', STR: '#FF9A2E', STRENGTH: '#FF9A2E', INT: '#5AA8FF',
  XP: '#FFC83A', 'GOOD BOY': '#FF8AD8', 'BEST FRIEND': '#FFC83A', FRIENDSHIP: '#FF6FB0', HAPPINESS: '#FFD23F', FUN: '#FFD23F', LUCK: '#3DFF8F', SPEED: '#3BE8FF', COOL: '#3BE8FF', SLEEP: '#A58BFF',
};
const PCT = ['ENERGY', 'PATIENCE', 'LIE', 'BURN', 'BATTERY', 'FUN', 'HAPPINESS', 'SLEEP'];
const TAG_COL = {
  HUNGRY: '#FF9A2E', TIRED: '#A58BFF', LONELY: '#58A6FF', CLUMSY: '#FFD447', SLEEPY: '#A58BFF', BORED: '#9AA8B6', HAPPY: '#FFD447', SAD: '#58A6FF',
  ANGRY: '#FF4D5E', SCARED: '#B7C4D0', 'GOOD BOY': '#FF8AD8', LEGEND: '#FFC83A', RETIRED: '#D8C79A', BOSS: '#FF3355', KIND: '#3DFF8F', BRAVE: '#FF7A3D',
  SHY: '#FF9AC8', FULL: '#3DFF8F', 'NEW FRIEND': '#3DFF8F', LOST: '#FF4D5E', 'TOO SLOW': '#9AA8B6', NERVOUS: '#FFD447', 'I\'M OKAY!': '#3DFF8F', HAIRLESS: '#E8D7C0',
};
const TAG_PAL = ['#FF9A2E', '#A58BFF', '#58A6FF', '#FFD447', '#3DFF8F', '#FF8AD8', '#3BE8FF'];
const RARITY = {
  common: { col: '#DCE6EE', label: 'COMMON' }, uncommon: { col: '#3DFF8F', label: 'UNCOMMON' }, rare: { col: '#4FB2FF', label: 'RARE' },
  epic: { col: '#B97BFF', label: 'EPIC' }, legendary: { col: '#FFB020', label: 'LEGENDARY' }, mystery: { col: '#FF4FD8', label: '???' },
  cursed: { col: '#A6E22E', label: 'CURSED' }, enemy: { col: '#FF3355', label: 'ENEMY' }, boss: { col: '#FF3355', label: 'BOSS' },
};

// ---------------------------------------------------------------- static defs (loaded by scenes/main.js; ids prefixed hd)
const DEFS = `<defs>
<pattern id="hdScan" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="2" fill="#FFFFFF" opacity="0.07"/></pattern>
<pattern id="hdScanD" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="2" fill="#000000" opacity="0.35"/></pattern>
<pattern id="hdHaz" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="20" fill="#000000" opacity="0.35"/></pattern>
<pattern id="hdText" width="400" height="44" patternUnits="userSpaceOnUse"><rect x="0" y="10" width="230" height="9" rx="4" fill="#8BDCEB" opacity="0.32"/><rect x="242" y="10" width="120" height="9" rx="4" fill="#8BDCEB" opacity="0.32"/><rect x="0" y="30" width="96" height="9" rx="4" fill="#8BDCEB" opacity="0.32"/><rect x="108" y="30" width="270" height="9" rx="4" fill="#8BDCEB" opacity="0.32"/></pattern>
<style>
.hdTR *{fill:#FF2E63!important;stroke:#FF2E63!important;fill-opacity:.5!important;stroke-opacity:.5!important}.hdTR [fill=none]{fill:none!important}
.hdTC *{fill:#2EE6FF!important;stroke:#2EE6FF!important;fill-opacity:.5!important;stroke-opacity:.5!important}.hdTC [fill=none]{fill:none!important}
</style>
<linearGradient id="hdSheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.32"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
</defs>`;

// ---------------------------------------------------------------- primitive shapes
// chamfered rectangle (corners cut at top-left c and bottom-right c2) as path data
const cham = (x, y, w, h, c, c2 = c) => `M${f(x + c)} ${f(y)}H${f(x + w)}V${f(y + h - c2)}L${f(x + w - c2)} ${f(y + h)}H${f(x)}V${f(y + c)}Z`;
const diamondD = (x, y, r, ry = r) => `M${f(x)} ${f(y - ry)}L${f(x + r)} ${f(y)}L${f(x)} ${f(y + ry)}L${f(x - r)} ${f(y)}Z`;
const heartD = (x, y, r) => `M${f(x)} ${f(y + r * 0.85)}C${f(x - r * 1.5)} ${f(y - r * 0.05)} ${f(x - r * 0.85)} ${f(y - r * 1.2)} ${f(x)} ${f(y - r * 0.45)}C${f(x + r * 0.85)} ${f(y - r * 1.2)} ${f(x + r * 1.5)} ${f(y - r * 0.05)} ${f(x)} ${f(y + r * 0.85)}Z`;
const checkD = (x, y, r) => `M${f(x - r * 0.55)} ${f(y + r * 0.02)}L${f(x - r * 0.15)} ${f(y + r * 0.42)}L${f(x + r * 0.6)} ${f(y - r * 0.45)}`;
const hexD = (x, y, r) => { let d = ''; for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 - Math.PI / 2; d += (i ? 'L' : 'M') + `${f(x + Math.cos(a) * r)} ${f(y + Math.sin(a) * r)}`; } return d + 'Z'; };
const para = (x, y, w, h, sk) => `M${f(x + sk)} ${f(y)}H${f(x + w)}L${f(x + w - sk)} ${f(y + h)}H${f(x)}Z`;   // parallelogram leaning right

// the glass panel — the signature surface of the HUD
// o: { c (cut), c2, shadow, scan, rimW, br (bracket length), brackets, edge, op (overall opacity of glass), glow }
function panel(x, y, w, h, th, o = {}) {
  th = theme(th);
  const c = o.c ?? Math.min(18, h * 0.32), c2 = o.c2 ?? c;
  let s = '';
  if (o.shadow !== false) s += S.path(cham(x + 5, y + 7, w, h, c, c2), { fill: '#000', opacity: 0.2 });
  s += S.path(cham(x, y, w, h, c, c2), { fill: th.glass, 'fill-opacity': f(th.op * (o.op ?? 1)), stroke: th.edge, 'stroke-width': f(o.edge ?? 5), 'stroke-linejoin': 'round' });
  if (o.scan !== false) s += S.path(cham(x, y, w, h, c, c2), { fill: 'url(#hdScan)' });
  const i = 4;
  s += S.path(cham(x + i, y + i, w - 2 * i, h - 2 * i, Math.max(2, c - 1.6), Math.max(2, c2 - 1.6)), { fill: 'none', stroke: th.rim, 'stroke-width': f(o.rimW ?? 2.4), 'stroke-linejoin': 'round', opacity: f(o.rimOp ?? 0.95) });
  s += S.path(`M${f(x + c + 8)} ${f(y + 9.5)}H${f(x + w - 10)}`, ln(1.8, th.hi, 0.4));
  if (o.brackets !== false) {
    const b = o.br ?? Math.min(24, h * 0.42, w * 0.2), e = 5;
    s += S.path(`M${f(x + w - b)} ${f(y - e)}H${f(x + w + e)}V${f(y + b)}M${f(x - e)} ${f(y + h - b)}V${f(y + h + e)}H${f(x + b)}`, { fill: 'none', stroke: th.edge, 'stroke-width': 8.5, 'stroke-linecap': 'square', opacity: f(o.brOp ?? 1) }) +
      S.path(`M${f(x + w - b)} ${f(y - e)}H${f(x + w + e)}V${f(y + b)}M${f(x - e)} ${f(y + h - b)}V${f(y + h + e)}H${f(x + b)}`, { fill: 'none', stroke: th.rim, 'stroke-width': 4, 'stroke-linecap': 'square', opacity: f(o.brOp ?? 1) });
    // accent ticks parallel to the cut corners
    const q = 4.5;
    s += S.path(`M${f(x - q + c * 0.2)} ${f(y + c * 0.8 - q)}L${f(x - q + c * 0.8)} ${f(y + c * 0.2 - q)}M${f(x + w + q - c2 * 0.2)} ${f(y + h - c2 * 0.8 + q)}L${f(x + w + q - c2 * 0.8)} ${f(y + h - c2 * 0.2 + q)}`, ln(3, th.rim, 0.9 * (o.brOp ?? 1)));
  }
  return s;
}
// soft glow without gradients: 4 stacked translucent ellipses (gradient fills cost ~0.08 ms per 1000 px here)
function glow(x, y, rx, ry, col, op = 1, steps = 4) {
  if (op <= 0) return '';
  let o = '';
  for (let i = 0; i < steps; i++) { const k = 1 - (i / steps) * 0.7; o += S.ellipse(x, y, rx * k, ry * k, { fill: col, opacity: f((0.08 + 0.1 * i / steps) * op) }); }
  return o;
}
// rounded soft glass (the BIG BROTHER plate once revealed: no brackets, no cut corners)
function softPanel(x, y, w, h, th, r = 22) {
  th = theme(th);
  return S.rect(x + 4, y + 7, w, h, r, { fill: '#000', opacity: 0.16 }) +
    S.rect(x, y, w, h, r, { fill: th.glass, 'fill-opacity': f(th.op), stroke: th.edge, 'stroke-width': 5 }) +
    S.rect(x + 6, y + 6, w - 12, h * 0.42, r * 0.7, { fill: '#FFFFFF', opacity: 0.16 }) +
    S.rect(x + 4.5, y + 4.5, w - 9, h - 9, r - 4, { fill: 'none', stroke: th.rim, 'stroke-width': 2.6 });
}
// a moving sheen band across a panel (no clip: the band stays inside [x, x+w])
function sheen(x, y, w, h, t, period = 4.2, seed = 0) {
  const u = mod(t / period + hash(seed) , 1);
  if (u > 0.3) return '';
  const p = u / 0.3, bw = Math.min(90, w * 0.3);
  const bx = x + lerp(0, w - bw, p);
  return S.path(para(bx, y + 3, bw, h - 6, Math.min(30, h * 0.5)), { fill: 'url(#hdSheen)', opacity: f(bumpK(p)) });
}
// infinity sign (the fonts have no ∞ glyph): centre (x, y), width w
function infinity(x, y, w, col = '#FFFFFF', sw = null, edge = '#03101B') {
  const a = w / 2, b = w * 0.27, lw = sw ?? Math.max(2.5, w * 0.13);
  const d = `M${f(x)} ${f(y)}C${f(x + a * 0.35)} ${f(y - b * 1.3)} ${f(x + a)} ${f(y - b * 1.3)} ${f(x + a)} ${f(y)}C${f(x + a)} ${f(y + b * 1.3)} ${f(x + a * 0.35)} ${f(y + b * 1.3)} ${f(x)} ${f(y)}C${f(x - a * 0.35)} ${f(y - b * 1.3)} ${f(x - a)} ${f(y - b * 1.3)} ${f(x - a)} ${f(y)}C${f(x - a)} ${f(y + b * 1.3)} ${f(x - a * 0.35)} ${f(y + b * 1.3)} ${f(x)} ${f(y)}Z`;
  return (edge ? S.path(d, { fill: 'none', stroke: edge, 'stroke-width': f(lw * 2.1), 'stroke-linejoin': 'round' }) : '') + S.path(d, { fill: 'none', stroke: col, 'stroke-width': f(lw), 'stroke-linejoin': 'round' });
}
// text that may contain "∞" (drawn as a sign); font 'L' Lilita | 'F' Fredoka; anchor start|middle|end
function richText(str, x, y, size, fill, font = 'L', anchor = 'middle', ex = {}) {
  str = clean(str);
  if (!str.includes('∞')) return (font === 'L' ? TL : TF)(str, x, y, size, fill, { 'text-anchor': anchor, ...ex });
  const parts = str.split('∞'), iw = size * 0.95, sp = ex['letter-spacing'] || 0;
  const total = parts.reduce((a, p) => a + TW(p, size, font, sp), 0) + iw * (parts.length - 1);
  let cx = anchor === 'middle' ? x - total / 2 : anchor === 'end' ? x - total : x;
  let o = '';
  parts.forEach((p, i) => {
    if (p) { o += (font === 'L' ? TL : TF)(p, cx, y, size, fill, { ...ex, 'text-anchor': 'start' }); cx += TW(p, size, font, sp); }
    if (i < parts.length - 1) { o += infinity(cx + iw / 2, y - size * 0.34, iw * 0.86, fill, size * 0.11, ex.stroke ? ex.stroke : null); cx += iw; }
  });
  return o;
}
const richW = (str, size, font = 'L', sp = 0) => { str = clean(str); const parts = str.split('∞'); return parts.reduce((a, p) => a + TW(p, size, font, sp), 0) + size * 0.95 * (parts.length - 1); };
const fitSize = (str, size, maxW, font = 'L', sp = 0) => { const w = richW(str, size, font, sp); return w > maxW ? size * maxW / w : size; };

// the "!" quest glyph (drawn, not a font): centre x, top y0, height h
function bangGlyph(x, y, h, col = '#FFD21F', lw = null) {
  const w = h * 0.42, lwv = lw ?? Math.max(3, h * 0.075);
  const bar = `M${f(x - w / 2)} ${f(y)}L${f(x + w / 2)} ${f(y)}L${f(x + w * 0.24)} ${f(y + h * 0.64)}L${f(x - w * 0.24)} ${f(y + h * 0.64)}Z`;
  const dot = S.circle(x, y + h * 0.86, w * 0.33, ol(col, lwv));
  return S.path(bar, { ...ol(col, lwv), 'stroke-linejoin': 'round' }) + dot +
    S.path(`M${f(x - w * 0.22)} ${f(y + h * 0.08)}L${f(x - w * 0.1)} ${f(y + h * 0.5)}`, ln(h * 0.045, '#FFFFFF', 0.7));
}
function skullIcon(x, y, r, col = '#FFFFFF', bg = '#26050D') {
  return S.path(`M${f(x - r * 0.72)} ${f(y + r * 0.1)}C${f(x - r * 0.8)} ${f(y - r * 0.95)} ${f(x + r * 0.8)} ${f(y - r * 0.95)} ${f(x + r * 0.72)} ${f(y + r * 0.1)}L${f(x + r * 0.45)} ${f(y + r * 0.42)}V${f(y + r * 0.72)}H${f(x - r * 0.45)}V${f(y + r * 0.42)}Z`, { fill: col }) +
    S.circle(x - r * 0.3, y - r * 0.08, r * 0.2, { fill: bg }) + S.circle(x + r * 0.3, y - r * 0.08, r * 0.2, { fill: bg }) +
    S.path(`M${f(x - r * 0.14)} ${f(y + r * 0.72)}V${f(y + r * 0.5)}M${f(x + r * 0.14)} ${f(y + r * 0.72)}V${f(y + r * 0.5)}`, ln(r * 0.1, bg));
}
function crownIcon(x, y, r, col = '#FFC83A', lw = null) {   // (x, y) = bottom centre, r = half width
  const w = lw ?? Math.max(2.5, r * 0.16);
  const d = `M${f(x - r)} ${f(y)}L${f(x - r * 1.08)} ${f(y - r * 1.0)}L${f(x - r * 0.48)} ${f(y - r * 0.52)}L${f(x)} ${f(y - r * 1.2)}L${f(x + r * 0.48)} ${f(y - r * 0.52)}L${f(x + r * 1.08)} ${f(y - r * 1.0)}L${f(x + r)} ${f(y)}Z`;
  return S.path(d, ol(col, w)) + S.circle(x, y - r * 1.2, r * 0.14, ol('#FFF1B8', w * 0.6)) + S.path(`M${f(x - r * 0.78)} ${f(y - r * 0.22)}H${f(x + r * 0.78)}`, ln(w * 0.7, '#FFF1B8', 0.8));
}
// the HUD logo: an eye inside AR brackets
function eyeLogo(x, y, r, col = '#3BE8FF', t = 0) {
  const lid = `M${f(x - r)} ${f(y)}Q${f(x)} ${f(y - r * 0.85)} ${f(x + r)} ${f(y)}Q${f(x)} ${f(y + r * 0.85)} ${f(x - r)} ${f(y)}Z`;
  const b = r * 1.25, e = r * 0.45;
  return S.path(lid, { fill: '#03101B', stroke: col, 'stroke-width': f(r * 0.12), 'stroke-linejoin': 'round' }) +
    S.circle(x + Math.sin(t * 1.3) * r * 0.12, y, r * 0.34, { fill: col }) + S.circle(x + Math.sin(t * 1.3) * r * 0.12, y, r * 0.14, { fill: '#03101B' }) +
    S.circle(x + r * 0.12 + Math.sin(t * 1.3) * r * 0.12, y - r * 0.12, r * 0.07, { fill: '#FFFFFF' }) +
    S.path(`M${f(x - b)} ${f(y - b + e)}V${f(y - b)}H${f(x - b + e)}M${f(x + b - e)} ${f(y - b)}H${f(x + b)}V${f(y - b + e)}M${f(x + b)} ${f(y + b - e)}V${f(y + b)}H${f(x + b - e)}M${f(x - b + e)} ${f(y + b)}H${f(x - b)}V${f(y + b - e)}`, { fill: 'none', stroke: col, 'stroke-width': f(r * 0.13), 'stroke-linecap': 'square' });
}
function pawIcon(x, y, r, col = '#FFFFFF') {
  let o = S.ellipse(x, y + r * 0.28, r * 0.46, r * 0.38, { fill: col });
  [[-0.5, -0.18], [-0.18, -0.48], [0.18, -0.48], [0.5, -0.18]].forEach(([a, b]) => { o += S.ellipse(x + a * r, y + b * r, r * 0.17, r * 0.21, { fill: col }); });
  return o;
}
function powerIcon(x, y, r, col = '#FFFFFF') {
  const rr = r * 0.55, a0 = -Math.PI / 2 + 0.6, a1 = -Math.PI / 2 - 0.6 + Math.PI * 2;
  return S.path(`M${f(x + Math.cos(a0) * rr)} ${f(y + Math.sin(a0) * rr)}A${f(rr)} ${f(rr)} 0 1 1 ${f(x + Math.cos(a1) * rr)} ${f(y + Math.sin(a1) * rr)}`, ln(r * 0.18, col)) + S.path(`M${f(x)} ${f(y - r * 0.7)}V${f(y - r * 0.12)}`, ln(r * 0.18, col));
}
// icon by name inside radius r: 'info' 'warn' 'check' 'star' 'heart' (from respawn.js) + 'bang' 'eye' 'paw' 'power' 'skull' 'down' 'x' 'quest'
function icon(kind, x, y, r, col = '#FFFFFF', t = 0) {
  switch (kind) {
    case 'bang': case 'quest': return bangGlyph(x, y - r * 0.62, r * 1.24, '#FFD21F', r * 0.1);
    case 'eye': return eyeLogo(x, y, r * 0.62, col, t);
    case 'paw': return pawIcon(x, y, r * 0.9, col);
    case 'power': return powerIcon(x, y, r, col);
    case 'skull': return skullIcon(x, y, r * 0.75, col, '#14020A');
    case 'down': return S.path(`M${f(x)} ${f(y - r * 0.55)}V${f(y + r * 0.35)}M${f(x - r * 0.38)} ${f(y)}L${f(x)} ${f(y + r * 0.4)}L${f(x + r * 0.38)} ${f(y)}`, ln(r * 0.18, col)) + S.path(`M${f(x - r * 0.5)} ${f(y + r * 0.62)}H${f(x + r * 0.5)}`, ln(r * 0.16, col));
    case 'x': return S.path(`M${f(x - r * 0.4)} ${f(y - r * 0.4)}L${f(x + r * 0.4)} ${f(y + r * 0.4)}M${f(x + r * 0.4)} ${f(y - r * 0.4)}L${f(x - r * 0.4)} ${f(y + r * 0.4)}`, ln(r * 0.2, col));
    case 'check': return S.path(checkD(x, y, r * 0.8), ln(r * 0.22, col));
    case 'heart': return S.path(heartD(x, y, r * 0.62), { fill: col });
    default: return R.icon(kind, x, y, r, col, t);
  }
}

// ---------------------------------------------------------------- segmented, slanted bar
// p = fill 0..1 (>1 = overflow), col = fill colour. o: { trail (old value 0..1, white damage chunk), ghost (leading heal 0..1),
// blink (low-value red blink), inf (endless shimmer), t, cell (px per cell), th, skew }
function segBar(x, y, w, h, p, col, o = {}) {
  const th = theme(o.th), t = o.t || 0, sk = o.skew ?? h * 0.32, cell = o.cell ?? Math.max(10, h * 0.85);
  const over = p > 1.02, pp = clamp(p, 0, 1);
  let jx = 0;
  if (over) jx = (hash(Math.floor(t * 24) * 1.3) - 0.5) * 3;
  let s = S.path(para(x + jx, y, w, h, sk), { fill: '#000', 'fill-opacity': 0.5, stroke: th.edge, 'stroke-width': 4, 'stroke-linejoin': 'round' });
  const on = o.blink ? Math.floor(t * 4.5) % 2 === 0 : true;
  const fillW = (v) => (v > 0.001 ? Math.max(sk + 7, w * clamp(v, 0, 1)) : 0);   // any non-zero value keeps a visible sliver
  const bar = (v, fill, op = 1) => { const fw = fillW(v); return fw > 0.5 ? S.path(para(x + jx, y, Math.max(fw, sk + 1), h, sk), { fill, opacity: f(op) }) : ''; };
  if (o.ghost !== undefined && o.ghost > pp) s += bar(o.ghost, '#FFFFFF', 0.75);
  if (o.trail !== undefined && o.trail > pp) s += bar(o.trail, '#FFFFFF', 0.85) + bar(o.trail, '#FF3355', 0.35);
  const fc = o.blink ? (on ? '#FF3355' : '#FFFFFF') : col;
  s += bar(pp, fc);
  if (pp > 0.01) s += S.path(para(x + jx + 2, y + 2, Math.max(fillW(pp) - 4, sk), h * 0.3, sk * 0.3), { fill: '#FFFFFF', opacity: 0.35 });
  if (o.inf) {   // shimmering endless bar: bright bands sliding
    for (let i = 0; i < 2; i++) {
      const u = mod(t * 0.7 + i * 0.5, 1), bw = w * 0.16;
      s += S.path(para(x + lerp(-bw * 0.2, w - bw, u), y, bw, h, sk), { fill: '#FFFFFF', opacity: f(0.5 * bumpK(u)) });
    }
  }
  if (over) {   // overflow: cells flicker white, the bar sparks off its end
    const st = Math.floor(t * 16);
    const n = Math.floor(w / cell);
    let d = '';
    for (let i = 0; i < n; i++) if (hash(st * 0.7 + i * 3.1) > 0.72) d += para(x + jx + i * cell + 1, y + 1, cell - 2, h - 2, sk * 0.9);
    if (d) s += S.path(d, { fill: '#FFFFFF', opacity: 0.6 });
    for (let i = 0; i < 6; i++) {
      const u = mod(t * 2.2 + hash(i * 3.3), 1);
      const sx_ = x + w * (0.55 + 0.45 * hash(i * 1.9)) + (hash(i * 5.3) - 0.5) * 40 * u, sy_ = y - 4 - u * 46 * (0.6 + hash(i));
      s += S.path(R.sq(sx_, sy_, 4 * (1 - u) + 1.5, u * 200), { fill: i % 2 ? '#FFFFFF' : col, opacity: f(1 - u) });
    }
  }
  // cell separators (cut the fill into slanted cells)
  let d = '';
  for (let cx = x + cell; cx < x + w - 2; cx += cell) d += `M${f(cx + jx + sk)} ${f(y + 1)}L${f(cx + jx)} ${f(y + h - 1)}`;
  if (d) s += S.path(d, { fill: 'none', stroke: th.glass, 'stroke-width': 2.6, opacity: 0.9 });
  s += S.path(para(x + jx, y, w, h, sk), { fill: 'none', stroke: o.blink ? '#FF3355' : th.rim, 'stroke-width': o.blink ? 3 : 1.4, opacity: o.blink ? (on ? 1 : 0.35) : 0.45 });
  if (o.blink && on && pp < 0.15) s += S.path(para(x + jx - 3, y - 3, w + 6, h + 6, sk), { fill: 'none', stroke: '#FF3355', 'stroke-width': 2, opacity: 0.45 });
  return s;
}

// ---------------------------------------------------------------- shared animation helpers
// holographic "unfold" of a panel: phase A (0..0.5) a bright line grows wide, phase B (0.5..1) it opens tall.
// returns { sx, sy, line } — line = opacity of the bright opening line
function unfold(k) {
  const a = seg(k, 0, 0.5), b = seg(k, 0.45, 1);
  return { sx: Math.max(0.02, ease.outBack(a)), sy: b <= 0 ? 0.05 : lerp(0.05, 1, ease.outBack(b)), line: k < 0.75 ? 1 - seg(k, 0.5, 0.75) : 0 };
}
// tag "slap": scale from big + rotation to rest, impact flash. returns { sc, rot, op, flash }
function slap(ki, rot0, rot1) {
  const a = seg(ki, 0, 0.5), b = seg(ki, 0.5, 1);
  const sc = ki < 0.5 ? lerp(2.3, 1, ease.in(a)) : 1 + 0.18 * Math.sin(b * Math.PI * 2.2) * (1 - b);
  return { sc, rot: lerp(rot0, rot1, ease.out(clamp(ki * 1.6, 0, 1))), op: clamp(ki * 5, 0, 1), flash: ki >= 0.5 ? 1 - b : 0 };
}
// a value rolling from `from` to `to` with a fast leader and a slow trailer (damage / heal trails)
function rollPair(from, to, u) {
  const fast = lerp(from, to, ease.out(clamp(u * 1.6, 0, 1)));
  const slow = lerp(from, to, ease.inOut(seg(u, 0.35, 1)));
  return { fast, slow };
}
const fmtNum = (v) => { const n = Math.round(v); return Math.abs(n) >= 10000 ? n.toLocaleString('en-US') : String(n); };
const seedOf = (str) => { let h = 0; for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) % 9973; return h / 97.3; };

// impact ticks around a point (little dash lines flying out) — u 0..1
function impactTicks(x, y, rw, rh, u, col = '#FFFFFF', n = 6) {
  if (u <= 0 || u >= 1) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.4, r0 = 1 + u * 0.5, r1 = r0 + 0.35 * (1 - u);
    d += `M${f(x + Math.cos(a) * rw * r0)} ${f(y + Math.sin(a) * rh * r0)}L${f(x + Math.cos(a) * rw * r1)} ${f(y + Math.sin(a) * rh * r1)}`;
  }
  return S.path(d, ln(4 * (1 - u) + 1, col, 1 - u));
}
function sparkleBurst(x, y, u, r = 120, n = 8, col = '#FFE9A0', seed = 1) {
  if (u <= 0 || u >= 1) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i + seed) * 0.6, dd = r * (0.4 + 0.6 * hash(i * 3 + seed)) * ease.out(u);
    d += star4(x + Math.cos(a) * dd, y + Math.sin(a) * dd, (8 + 10 * hash(i * 5 + seed)) * (1 - u) * (u < 0.15 ? u / 0.15 : 1), u * 90);
  }
  return S.path(d, { fill: col });
}
function rays(x, y, n, r, col, op, rot = 0, r0 = 0) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a0 = ((i / n) * 360 + rot) * Math.PI / 180, a1 = (((i + 0.45) / n) * 360 + rot) * Math.PI / 180;
    d += `M${f(x + Math.cos(a0) * r0)} ${f(y + Math.sin(a0) * r0)}L${f(x + r * Math.cos(a0))} ${f(y + r * Math.sin(a0))}L${f(x + r * Math.cos(a1))} ${f(y + r * Math.sin(a1))}L${f(x + Math.cos(a1) * r0)} ${f(y + Math.sin(a1) * r0)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(op) });
}
// RGB split: red / cyan tinted copies behind the group. CSS classes hdTR / hdTC set fill-/stroke-opacity instead of a group
// opacity, so no offscreen layer is made (respawn.js rgbSplit costs ~40 ms for a full-frame HUD; this ~2 ms).
function rgb(svg, dx = 10, dy = 0) {
  if (!dx && !dy) return svg;
  return S.g(svg, `translate(${f(-dx)} ${f(-dy)})`, { class: 'hdTR' }) + S.g(svg, `translate(${f(dx)} ${f(dy)})`, { class: 'hdTC' }) + svg;
}
// glitch wrapper used by several helpers: jitter + RGB split on most frames
function glitchWrap(svg, t, g, seed = 1, dx = 10) {
  if (!(g > 0)) return svg;
  const st = Math.floor(t * 18);
  const on = hash(st * 0.91 + seed) < 0.35 + 0.6 * g;
  const jx = on ? (hash(st * 1.7 + seed) - 0.5) * 22 * g : 0, jy = on ? (hash(st * 2.3 + seed) - 0.5) * 8 * g : 0;
  const body = jx || jy ? S.g(svg, `translate(${f(jx)} ${f(jy)})`) : svg;
  return on ? rgb(body, dx * Math.min(1, g * 1.2) * (0.55 + 0.9 * hash(st * 1.3 + seed))) : body;
}

// ================================================================= 1. STAT PLATE
// statPlate(o) — the plate floating over a head. (x, y) = the HEAD TOP point (the tether pin); the plate floats `lift` px above.
// o: { x, y, s, k, t, name, level, title, bars:[{label, value, max, col, roll, from, trail, fmt, text, blink, bump}], tags:[str | {text, col, k}],
//      tagsK, boss, crown, theme, glitch, fade, error, lift, w, bob, tether, sheen }
function normBar(b) {
  const label = String(b.label ?? 'HP').toUpperCase();
  const max = b.max ?? 100;
  const inf = b.value === Infinity || b.value === '∞';
  const value = inf ? max : Number(b.value ?? max);
  const col = b.col || BAR_COL[label] || '#3DFF8F';
  const fmt = b.fmt || (inf ? 'inf' : label === 'HP' || label === 'HEALTH' ? 'frac' : PCT.includes(label) ? 'pct' : 'num');
  return { ...b, label, max, value, inf, col, fmt };
}
function barText(b, v) {
  if (b.text !== undefined) return String(b.text);
  if (b.fmt === 'inf') return '∞';
  if (b.fmt === 'frac') return `${fmtNum(v)}/${b.max}`;
  if (b.fmt === 'pct') return `${fmtNum(v)}%`;
  return fmtNum(v);
}
function normTag(tg, i) {
  const o = typeof tg === 'string' ? { text: tg } : { ...tg };
  o.text = String(o.text).toUpperCase();
  o.col = o.col || TAG_COL[o.text] || TAG_PAL[Math.floor(hash(seedOf(o.text)) * TAG_PAL.length)];
  o.rot = o.rot ?? [-4, 3, -2, 4, -3][i % 5];
  return o;
}
function statPlate(o = {}) {
  const { x = 960, y = 500, s = 1, k = 1, t = 0, fade = 0 } = o;
  if (k <= 0 || fade >= 1) return '';
  const th = theme(o.error ? 'error' : o.boss ? 'boss' : o.theme || 'cyan');
  const glitch = Math.max(o.glitch || 0, o.error ? 0.25 + 0.75 * (hash(Math.floor(t * 3) * 1.9) > 0.8 ? 1 : 0) : 0);
  const seed = seedOf(o.name || 'x');
  let name = String(o.name ?? 'PLAYER').toUpperCase();
  const lv = o.level === undefined || o.level === null ? null : String(o.level);
  const bars = o.error ? [] : (o.bars || []).map(normBar);
  const tags = (o.tags || []).map(normTag);
  const title = o.title !== undefined ? String(o.title).toUpperCase() : (o.boss ? 'FINAL BOSS' : null);
  const bossBanner = !!o.boss && title;
  // ---- metrics (plate space, s = 1)
  const padX = 18, NAME = o.nameSize || 38, LVS = 32, ROW = 38;
  const badgeW = lv ? 24 + TW('LV', 15, 'F', 1) + 6 + TW(lv, LVS, 'L') : 0;
  const nameW = richW(name, NAME, 'L');
  const titleW = title && !bossBanner ? richW(title, 17, 'F', 1.5) : 0;
  const labelCol = bars.length ? Math.max(...bars.map((b) => TW(b.label, 18, 'F', 1.5))) + 14 : 0;
  const valCol = bars.length ? Math.max(58, ...bars.map((b) => richW(barText(b, b.value), 28, 'L') + 8)) : 0;
  let Wd = Math.max(o.w || 0, 300, padX * 2 + badgeW + (lv ? 14 : 0) + Math.max(nameW, titleW) + 10, bars.length ? padX * 2 + labelCol + 150 + valCol + 12 : 0);
  if (o.error) Wd = Math.max(Wd, padX * 2 + 56 + TW(o.error, 30, 'L') + 10);
  if (tags.length && o.tagWrap !== true) Wd = Math.max(Wd, padX * 2 + tags.reduce((a, tg) => a + TW(tg.text, 18, 'F', 1) + 34, 0));
  if (bossBanner) Wd = Math.max(Wd, TW(title, 24, 'L') + 140);
  const headH = titleW ? 66 : 54;
  const bodyH = o.error ? 62 : bars.length * ROW;
  const Hd = 10 + headH + bodyH + (bars.length || o.error ? 12 : 2);
  // tags layout (rows inside the plate width, overlapping its bottom edge)
  const TAGH = 30;
  const tagRows = [];
  { let row = [], rw = 0; const maxW = Wd - 2 * padX;
    tags.forEach((tg) => { tg.w = TW(tg.text, 18, 'F', 1) + 26; if (row.length && rw + tg.w > maxW) { tagRows.push({ row, rw }); row = []; rw = 0; } row.push(tg); rw += tg.w + 8; });
    if (row.length) tagRows.push({ row, rw }); }
  const tagExtra = tagRows.length ? tagRows.length * (TAGH + 6) - 8 : 0;
  const lift = o.lift ?? 34 + tagExtra;
  const top = -lift - Hd, left = -Wd / 2;
  // ---- timeline
  const kT = seg(k, 0, 0.3), kO = seg(k, 0.12, 0.62), kC = seg(k, 0.5, 1);
  const uf = unfold(kO);
  const bob = o.bob === false ? 0 : Math.sin(t * 2.1 + seed) * 3.5;
  let out = '';
  // tether + pin
  if (o.tether !== false) {
    const ty1 = -lift * ease.out(kT) + 2;
    out += S.path(`M0 -6V${f(Math.min(-6, ty1))}`, ln(5.5, th.edge, 0.9)) + S.path(`M0 -6V${f(Math.min(-6, ty1))}`, ln(2.2, th.rim));
    out += S.path(diamondD(0, -2, 7 * ease.outBack(kT), 9 * ease.outBack(kT)), { fill: th.rim, stroke: th.edge, 'stroke-width': 3 });
  }
  // ---- panel
  let pn = '';
  if (kO > 0) {
    const cy = top + Hd / 2;
    let body = panel(left, top, Wd, Hd, th, { scan: true });
    if (o.boss) {   // pulsing red aura + horns + hazard notch
      const pulse = 0.5 + 0.5 * Math.sin(t * 6);
      body = S.path(cham(left - 7, top - 7, Wd + 14, Hd + 14, 22), { fill: 'none', stroke: th.rim, 'stroke-width': 3, opacity: f(0.25 + 0.4 * pulse) }) + body;
      const horn = (sx) => S.path(`M${f(sx * (Wd / 2 - 46))} ${f(top + 2)}Q${f(sx * (Wd / 2 - 30))} ${f(top - 26)} ${f(sx * (Wd / 2 - 8))} ${f(top - 38)}Q${f(sx * (Wd / 2 - 18))} ${f(top - 14)} ${f(sx * (Wd / 2 - 16))} ${f(top + 2)}Z`, ol('#C8102E', 4, th.edge));
      body = horn(-1) + horn(1) + body;
    }
    if (o.sheen !== false) body += sheen(left + 6, top + 4, Wd - 12, Hd - 8, t, 4.6, seed);
    // header: LV badge + name (+ title)
    const hy = top + 10 + (titleW ? 40 : 40);
    let hx = left + padX;
    if (lv) {
      const bp = ease.outBack(seg(kC, 0, 0.35));
      const bx = hx, by = top + 12 + (titleW ? 6 : 0), bh = 40;
      let bd = S.path(para(bx, by, badgeW, bh, 10), { fill: th.badge, stroke: th.edge, 'stroke-width': 4, 'stroke-linejoin': 'round' });
      bd += S.path(para(bx + 4, by + 4, badgeW - 10, 9, 3), { fill: '#FFFFFF', opacity: 0.35 });
      const lvTxt = glitch > 0 ? scramble(lv, t, glitch, seed + 3) : lv;
      bd += TF('LV', bx + 14, by + 26, 15, th.badgeTx, { 'text-anchor': 'start', 'letter-spacing': 1 }) + TL(lvTxt, bx + 14 + TW('LV', 15, 'F', 1) + 6, by + 32, LVS, th.badgeTx, { 'text-anchor': 'start' });
      if (o.crown) bd += crownIcon(bx + 22, by - 2, 15, '#FFC83A', 3.5);
      body += bp > 0.01 ? S.g(bd, `translate(${f(bx + badgeW / 2)} ${f(by + bh / 2)}) scale(${f(bp)}) translate(${f(-bx - badgeW / 2)} ${f(-by - bh / 2)})`) : '';
      hx += badgeW + 14;
    }
    // name: typewriter + cursor
    const nk = seg(kC, 0.05, 0.5);
    let shown = name.slice(0, Math.ceil(name.length * nk));
    if (glitch > 0) shown = scramble(shown, t, glitch, seed);
    if (o.error && hash(Math.floor(t * 9) + 2) > 0.6) shown = scramble(shown, t, 0.9, seed + 1);
    const nameY = titleW ? top + 44 : top + 48;
    if (shown) body += richText(shown, hx, nameY, NAME, th.text, 'L', 'start', outl(5, th.edge));
    if (nk > 0 && nk < 1) body += S.rect(hx + richW(shown, NAME, 'L') + 4, nameY - 28, 12, 30, 2, { fill: th.rim, opacity: f(Math.floor(t * 8) % 2 ? 1 : 0.3) });
    if (titleW) {
      const tk = seg(kC, 0.3, 0.6);
      const ts = title.slice(0, Math.ceil(title.length * tk));
      if (ts) body += richText(ts, hx, top + 66, 17, th.label, 'F', 'start', { 'letter-spacing': 1.5 });
    }
    // bars
    const rowTop = top + 10 + headH;
    bars.forEach((b, i) => {
      const cy = rowTop + i * ROW + ROW / 2;
      const bk = seg(kC, 0.15 + i * 0.1, 0.75 + i * 0.1);
      let disp, fillP, trailP, ghostP;
      if (b.roll !== undefined) {
        const rp = rollPair(b.from ?? 0, b.value, clamp(b.roll, 0, 1));
        disp = rp.fast;
        if (b.value < (b.from ?? 0)) { fillP = rp.fast / b.max; trailP = rp.slow / b.max; } else { ghostP = rp.fast / b.max; fillP = rp.slow / b.max; }
      } else {
        disp = b.inf ? b.max : lerp(b.from ?? 0, b.value, ease.out(bk));
        fillP = disp / b.max;
        if (b.trail !== undefined) trailP = b.trail / b.max * clamp(bk * 2, 0, 1);
      }
      const low = !b.inf && b.blink !== false && (b.blink || (b.roll !== undefined ? disp : b.value) / b.max <= 0.12);   // follows the rolling value
      const lx = left + padX;
      body += TF(b.label, lx, cy + 6.5, 18, low ? '#FF8A9A' : th.label, { 'text-anchor': 'start', 'letter-spacing': 1.5 });
      const bx0 = lx + labelCol, bx1 = -left - padX - valCol - 4;
      body += segBar(bx0, cy - 9, bx1 - bx0, 18, b.inf ? bk : fillP, b.col, { th, t, trail: trailP, ghost: ghostP, blink: low && bk > 0.5, inf: b.inf && bk > 0.9, cell: 15 });
      // value
      let vt = barText(b, disp);
      if (glitch > 0 && !b.inf) vt = scramble(vt, t, glitch, seed + i);
      const vcol = low ? (Math.floor(t * 4.5) % 2 === 0 ? '#FF4D66' : '#FFFFFF') : b.value > b.max * 1.02 ? b.col : th.text;
      const pop = 1 + 0.25 * bumpK(b.bump || 0) + (b.roll !== undefined ? 0.18 * bumpK(clamp(b.roll * 1.6, 0, 1)) : 0);
      const vx = -left - padX, vy = cy + 10;
      let vs = richText(vt, vx, vy, 28, vcol, 'L', 'end', outl(5, th.edge));
      if (b.value > b.max * 1.02) { const jj = (hash(Math.floor(t * 20) + i) - 0.5) * 3; vs = S.g(vs, `translate(${f(jj)} ${f(-jj)})`); }
      if (low && bk > 0.5) vs += icon('warn', vx - richW(vt, 28, 'L') - 16, cy, 13, '#FF4D66');
      body += pop !== 1 ? S.g(vs, `translate(${f(vx)} ${f(cy)}) scale(${f(pop)}) translate(${f(-vx)} ${f(-cy)})`) : vs;
    });
    // error body (Biscuit: ERROR: TOO GOOD)
    if (o.error) {
      const ey = rowTop + 30, blink = Math.floor(t * 3) % 2 === 0;
      body += icon('warn', left + padX + 20, ey - 4, 22, blink ? '#FF2EA6' : '#FFF0FA');
      let et = String(o.error).toUpperCase();
      et = et.slice(0, Math.ceil(et.length * seg(kC, 0.1, 0.6)));
      if (hash(Math.floor(t * 12) * 1.3) > 0.85) et = scramble(et, t, 0.8, 9);
      body += TL(et, left + padX + 52, ey + 8, 30, blink ? '#FF5CC0' : '#FFFFFF', { 'text-anchor': 'start', ...outl(5, th.edge) });
      body += TF('STATS FAILED TO LOAD', left + padX + 52, ey + 30, 14, th.label, { 'text-anchor': 'start', 'letter-spacing': 2 });
      body += R.spinner(-left - padX - 16, ey + 8, 10, t, th.rim, 8, 1.4);
    }
    // boss banner on the top edge
    if (bossBanner) {
      const bw = TW(title, 24, 'L') + 92, by = top - 20;
      let bn = S.path(para(-bw / 2, by, bw, 34, 12), { fill: '#FF3355', stroke: th.edge, 'stroke-width': 4, 'stroke-linejoin': 'round' });
      bn += S.path(para(-bw / 2, by, bw, 34, 12), { fill: 'url(#hdHaz)', opacity: 0.6 });
      bn += S.path(para(-bw / 2 + 34, by + 3, bw - 68, 28, 9), { fill: '#C8102E' });
      bn += TL(title, 0, by + 27, 24, '#FFF6D8', outl(4, th.edge)) + skullIcon(-bw / 2 + 22, by + 16, 12, '#FFF6D8', '#C8102E') + skullIcon(bw / 2 - 20, by + 16, 12, '#FFF6D8', '#C8102E');
      body += S.g(bn, `translate(0 ${f(by + 17)}) scale(${f(ease.outBack(seg(kC, 0, 0.4)))}) translate(0 ${f(-by - 17)})`);
    }
    // open flash + bright opening line
    if (k < 0.85) body += S.path(cham(left, top, Wd, Hd, 16), { fill: '#FFFFFF', opacity: f(0.75 * (1 - seg(k, 0.5, 0.82)) * (kO > 0.45 ? 1 : 0.4)) });
    pn = S.g(body, `translate(0 ${f(cy)}) scale(${f(uf.sx)} ${f(uf.sy)}) translate(0 ${f(-cy)})`);
    if (uf.line > 0) pn += S.path(`M${f(-Wd / 2 * uf.sx)} ${f(cy)}H${f(Wd / 2 * uf.sx)}`, ln(5, '#FFFFFF', uf.line));
  }
  out += pn;
  // tags (stickers slapped onto the bottom edge, one by one)
  tagRows.forEach(({ row, rw }, ri) => {
    let tx = left + padX;
    const ty = -lift - 12 + ri * (TAGH + 6);
    row.forEach((tg, j) => {
      const idx = tags.indexOf(tg);
      const ki = tg.k !== undefined ? clamp(tg.k, 0, 1) : o.tagsK !== undefined ? clamp(o.tagsK - idx, 0, 1) : seg(kC, 0.55 + idx * 0.12, 0.8 + idx * 0.12);
      if (ki > 0) {
        const sl = slap(ki, (hash(idx + seed) - 0.5) * 36, tg.rot);
        const cx = tx + tg.w / 2, cy = ty + TAGH / 2;
        let tgS = S.path(para(-tg.w / 2, -TAGH / 2, tg.w, TAGH, 8), { fill: tg.col, stroke: th.edge, 'stroke-width': 4, 'stroke-linejoin': 'round' });
        tgS += S.path(para(-tg.w / 2 + 5, -TAGH / 2 + 4, tg.w - 14, 6, 2), { fill: '#FFFFFF', opacity: 0.4 });
        tgS += TF(glitch > 0 ? scramble(tg.text, t, glitch, idx) : tg.text, 0, 7, 18, '#10141C', { 'letter-spacing': 1 });
        if (sl.flash > 0) tgS += S.path(para(-tg.w / 2, -TAGH / 2, tg.w, TAGH, 8), { fill: '#FFFFFF', opacity: f(0.8 * sl.flash) });
        out += S.g(tgS, `translate(${f(cx)} ${f(cy)}) rotate(${f(sl.rot)}) scale(${f(sl.sc)})`, { opacity: f(sl.op) });
        out += impactTicks(cx, cy, tg.w * 0.62, TAGH * 1.1, seg(ki, 0.5, 0.95), '#FFFFFF', 6);
      }
      tx += tg.w + 8;
    });
  });
  if (glitch > 0) out = glitchWrap(out, t, glitch, seed);
  const op = 1 - clamp(fade, 0, 1);
  return S.g(out, `translate(${f(x)} ${f(y + bob - 24 * ease.in(clamp(fade, 0, 1)))}) scale(${f(s * (1 - 0.06 * fade))})`, op < 1 ? { opacity: f(op) } : {});
}

// ---------------------------------------------------------------- cast presets
const PRESETS = {
  mom: { name: 'MOM', level: 38, bars: [{ label: 'ENERGY', value: 2 }] },
  grandpa: { name: 'GRANDPA LOU', level: 87, title: 'LEGEND (RETIRED)', crown: true, bars: [{ label: 'STR', value: 79 }] },
  max: { name: 'MAX', level: 5, bars: [{ label: 'CHAOS', value: 9999, max: 100 }, { label: 'HP', value: Infinity }] },
  benji: { name: 'BENJI', level: 4, tags: ['CLUMSY'], bars: [{ label: 'HP', value: 100 }] },
  benjiBest: { name: 'BENJI', level: 4, theme: 'gold', bars: [{ label: 'BEST FRIEND', value: 100, text: 'MAX' }] },
  tank: { name: 'TANK', level: 80, bars: [{ label: 'HP', value: 3 }], tags: ['HUNGRY', 'TIRED', 'LONELY'] },
  teacher: { name: 'MRS. KRUMP', level: 99, boss: true, title: 'FINAL BOSS', bars: [{ label: 'PATIENCE', value: 0 }] },
  krump: null,
  biscuit: { name: 'BISCUIT', level: 1000, theme: 'pet', crown: true, bars: [{ label: 'GOOD BOY', value: Infinity }] },
  biscuitError: { name: 'BISCUIT', level: '???', error: 'ERROR: TOO GOOD' },
  lunchLady: { name: 'LUNCH LADY', level: 50, title: 'SECRET SKILL: MYSTERY MEAT', bars: [{ label: 'HP', value: 88 }] },
  smartKid: { name: 'SMART KID', level: 31, bars: [{ label: 'INT', value: 95 }] },
  quietKid: { name: 'QUIET KID', level: 12, bars: [{ label: 'STR', value: 85 }] },
  liar: { name: 'KEVIN', level: 9, bars: [{ label: 'HP', value: 64 }] },
  mrsWells: { name: 'MRS. WELLS', level: 71, bars: [{ label: 'ENERGY', value: 30 }] },
  you: null,
};
PRESETS.krump = PRESETS.teacher;
// plateFor('mom' | 'grandpa' | 'max' | 'benji' | 'benjiBest' | 'tank' | 'teacher' | 'biscuit' | 'biscuitError' | 'lunchLady' | 'smartKid' | 'quietKid' | 'mrsWells', overrides)
// overrides are merged (bars / tags replaced when given). Example: plateFor('mom', { x, y, s: .8, k, t, bars: [{ label: 'ENERGY', value: 6, from: 2, roll }] })
function plateFor(who, over = {}) {
  if (who === 'you' || who === 'hero') return heroPlate(over);
  const p = PRESETS[who];
  if (!p) throw new Error('hud.plateFor: unknown preset ' + who);
  return statPlate({ ...p, ...over });
}

// head-top anchors. overHead() asks the cast first: rig/cast.js headTop(key, pose) -> the exact screen point at the top of the head
// (it knows sizes, hoods, sit/beg poses, kid/adult variants i). HEAD_TOP below is only the fallback (body units at s 1, from the cast v1 table).
const HEAD_TOP = { you: 951, hero: 951, mom: 1110, grandpa: 1112, max: 640, benji: 1100, tank: 1300, teacher: 1328, krump: 1328, biscuit: 432, lunchLady: 1108, coach: 1090, neighbor: 1000, fairWorker: 1080, kid: 830, adult: 1080, humanKid: 880 };
let _castHeadTop;
function castHeadTop() {
  if (_castHeadTop === undefined) { try { const c = require('../rig/cast'); _castHeadTop = typeof c.headTop === 'function' ? c.headTop : null; } catch (e) { _castHeadTop = null; } }
  return _castHeadTop;
}
// overHead(who, x, y, s = 0.5, dy = 0, pose = {}) -> { x, y }: the head-top point (+6 px air) of an actor drawn with feet (x, y) and scale s.
// pose = the extra pose fields you pass to actor() that move the head (lift, bodyY, headY, hood, dayoff, pose: 'sit'|'beg'..., i for kid/adult).
// who may also be a number = head height in body units.
function overHead(who, x, y, s = 0.5, dy = 0, pose = {}) {
  if (typeof who !== 'number') {
    const ht = castHeadTop();
    if (ht && who !== 'humanKid') {
      try { const p = ht(who === 'krump' ? 'teacher' : who === 'hero' ? 'you' : who, { ...pose, x, y, s }); if (p && Number.isFinite(p.y)) return { x: Number.isFinite(p.x) ? p.x : x, y: p.y - 6 + dy }; } catch (e) { /* fall back to the table */ }
    }
  }
  const key = who === 'krump' ? 'teacher' : who === 'hero' ? 'you' : who;
  const h = typeof who === 'number' ? who : HEAD_TOP[key] ?? 980;
  return { x, y: y - h * s - 6 + dy };
}

// ---------------------------------------------------------------- mini plate (crowds, SC01 / SC08): [LV 12] NAME + a thin bar
// miniPlate({ x, y, s, k, t, name, level, hp (0..1), col (bar colour), theme, glitch, fade, tether })  — (x, y) = head top
function miniPlate(o = {}) {
  const { x = 0, y = 0, s = 1, k = 1, t = 0, fade = 0 } = o;
  if (k <= 0 || fade >= 1) return '';
  const th = theme(o.theme);
  const name = String(o.name ?? 'KID').toUpperCase(), lv = String(o.level ?? 1);
  const bw = TW(lv, 22, 'L') + 34, nw = TW(name, 22, 'L');
  const w = Math.max(150, 14 + bw + 8 + nw + 14), h = 52, top = -18 - h;
  const kk = ease.outBack(seg(k, 0, 1));
  const seed = seedOf(name + lv);
  let b = panel(-w / 2, top, w, h, th, { c: 10, br: 12, scan: false, shadow: false, edge: 4 });
  b += S.path(para(-w / 2 + 10, top + 8, bw, 24, 6), { fill: th.badge, stroke: th.edge, 'stroke-width': 3 }) + TF('LV', -w / 2 + 18, top + 26, 11, th.badgeTx, { 'text-anchor': 'start' }) + TL(glitchT(lv, t, o.glitch, seed), -w / 2 + 36, top + 29, 22, th.badgeTx, { 'text-anchor': 'start' });
  b += TL(glitchT(name, t, o.glitch, seed + 1), -w / 2 + 18 + bw, top + 29, 22, th.text, { 'text-anchor': 'start', ...outl(4, th.edge) });
  const hp = clamp(o.hp ?? 0.8, 0, 1);
  b += segBar(-w / 2 + 12, top + 37, w - 26, 8, hp, o.col || (hp < 0.15 ? '#FF3355' : '#3DFF8F'), { th, t, cell: 12, blink: hp < 0.12 });
  if (o.tether !== false) b += S.path(`M0 -4V-18`, ln(4.5, th.edge)) + S.path(`M0 -4V-18`, ln(2, th.rim)) + S.path(diamondD(0, -2, 5, 6), { fill: th.rim });
  b = glitchWrap(b, t, o.glitch || 0, seed, 6);
  const op = (1 - fade) * clamp(k * 3, 0, 1);
  return S.g(b, `translate(${f(x)} ${f(y + Math.sin(t * 2 + seed) * 2)}) scale(${f(s * kk)})`, op < 1 ? { opacity: f(op) } : {});
}
const glitchT = (str, t, g, seed) => (g > 0 ? scramble(str, t, g, seed) : str);

// ---------------------------------------------------------------- the hero's plate: "???" -> BIG BROTHER
// heroPlate({ x, y, s, t, k, reveal 0..1, fade, lift }) — (x, y) = head top. reveal 0 = "???" (corrupted, scrambling, a loader that never
// finishes); 0.1-0.45 the ??? dissolve and the glass warms; 0.45-0.9 "BIG BROTHER" fades in letter by letter with a heart badge and a soft
// golden glow. No level, no numbers. Give the reveal ~3-4 s (it's the payoff).
function heroPlate(o = {}) {
  const { x = 960, y = 500, s = 1, t = 0, k = 1, reveal = 0, fade = 0 } = o;
  if (k <= 0 || fade >= 1) return '';
  const rv = clamp(reveal, 0, 1);
  const warm = ease.inOut(seg(rv, 0.12, 0.55));
  const th = mixTheme('cyan', 'warm', warm);
  const word = o.text || 'BIG BROTHER';
  const W0 = 290, W1 = 96 + TW(word, 50, 'L') + 34;
  const Wd = lerp(W0, W1, ease.inOut(seg(rv, 0.25, 0.6)));
  const Hd = lerp(92, 84, warm), lift = o.lift ?? 38, top = -lift - Hd, left = -Wd / 2;
  const kT = seg(k, 0, 0.3), kO = seg(k, 0.12, 0.62), kC = seg(k, 0.5, 1);
  const uf = unfold(kO);
  let out = '';
  // warm glow behind (small radial gradient, only when revealed)
  if (warm > 0) out += glow(0, top + Hd / 2, Wd * 0.68, Hd * 1.35, '#FFC46B', warm * (0.6 + 0.1 * Math.sin(t * 2)), 9);
  out += S.path(`M0 -6V${f(Math.min(-6, -lift * ease.out(kT) + 2))}`, ln(5.5, th.edge, 0.9)) + S.path(`M0 -6V${f(Math.min(-6, -lift * ease.out(kT) + 2))}`, ln(2.2, th.rim));
  out += S.path(diamondD(0, -2, 7 * ease.outBack(kT), 9 * ease.outBack(kT)), { fill: th.rim, stroke: th.edge, 'stroke-width': 3 });
  if (kO > 0) {
    const cy = top + Hd / 2;
    let b = rv < 0.47 ? panel(left, top, Wd, Hd, th, { c: lerp(16, 8, warm), c2: lerp(16, 8, warm), brOp: 1 - warm * 0.85, scan: warm < 0.9 }) : softPanel(left, top, Wd, Hd, th);
    b += sheen(left + 6, top + 4, Wd - 12, Hd - 8, t, 3.6, 5);
    // --- the "???" state
    const qa = (1 - seg(rv, 0.3, 0.48)) * kC;
    if (qa > 0) {
      const g = seg(rv, 0.05, 0.4);
      let q = '';
      // LV ?? badge
      const bx = left + 18, by = top + 14;
      q += S.path(para(bx, by, 92, 40, 10), { fill: th.badge, stroke: th.edge, 'stroke-width': 4 }) + TF('LV', bx + 14, by + 26, 15, th.badgeTx, { 'text-anchor': 'start' }) + TL(scramble('??', t, 0.5 + g, 2, 8), bx + 40, by + 32, 32, th.badgeTx, { 'text-anchor': 'start' });
      // three bobbing question marks
      for (let i = 0; i < 3; i++) {
        const ch = hash(Math.floor(t * 6) + i * 7) < 0.12 + g * 0.8 ? scramble('?', t, 1, i + 4, 10) : '?';
        const qy = top + 52 + Math.sin(t * 5 + i * 1.3) * 4 - (g > 0 ? (hash(Math.floor(t * 20) + i) - 0.5) * 10 * g : 0);
        q += TL(ch, bx + 122 + i * 34, qy, 46, th.text, outl(5, th.edge));
      }
      // sub row: SELF-SCAN: NO DATA + a loader that never finishes
      q += TF('SELF-SCAN: NO DATA', left + 20, top + Hd - 14, 14, th.label, { 'text-anchor': 'start', 'letter-spacing': 2 });
      const n = 10, cw = 9;
      let d = '';
      for (let i = 0; i < n; i++) if (hash(Math.floor(t * 8) * 1.3 + i * 2.7) > 0.5) d += para(-left - 130 + i * cw, top + Hd - 26, cw - 2, 12, 3);
      if (d) q += S.path(d, { fill: th.rim, opacity: 0.6 });
      q += R.spinner(-left - 22, top + 32, 9, t, th.rim, 8, 1.2);
      b += S.g(q, null, { opacity: f(qa) });
    }
    // --- BIG BROTHER
    if (rv > 0.42) {
      const hk = ease.outBack(seg(rv, 0.48, 0.66));
      const hx = left + 46, hy = top + Hd / 2;
      if (hk > 0) {
        const beat = 1 + 0.08 * Math.max(0, Math.sin(t * 5.5)) ** 8;
        b += S.g(S.path(heartD(0, 0, 21), ol('#FF6B6B', 4.5, '#5A1E10')) + S.path('M-14 -10Q-14 -20 -5 -20', ln(4, '#FFFFFF', 0.85)), `translate(${f(hx)} ${f(hy + 2)}) scale(${f(hk * beat)})`);
      }
      const letters = [...word];
      let lx = hx + 34;
      letters.forEach((ch, i) => {
        const li = seg(rv, 0.5 + i * 0.03, 0.62 + i * 0.03);
        const cw = TW(ch, 50, 'L');
        if (li > 0 && ch !== ' ') {
          const sc = lerp(1.35, 1, ease.out(li));
          b += S.g(TL(ch, 0, 0, 50, '#FFFFFF', { 'text-anchor': 'start', ...outl(7, '#8A3208') }), `translate(${f(lx)} ${f(top + Hd / 2 + 18 + 12 * (1 - ease.out(li)))}) scale(${f(sc)})`, { opacity: f(ease.out(li)) });
        }
        lx += cw;
      });
    }
    if (k < 0.85) b += S.path(cham(left, top, Wd, Hd, 16), { fill: '#FFFFFF', opacity: f(0.75 * (1 - seg(k, 0.5, 0.82)) * (kO > 0.45 ? 1 : 0.4)) });
    // a soft flash when the words land
    const fl = seg(rv, 0.45, 0.6);
    if (fl > 0 && fl < 1) b += S.path(cham(left, top, Wd, Hd, 8), { fill: '#FFF4E0', opacity: f(0.6 * (1 - fl)) });
    out += S.g(b, `translate(0 ${f(cy)}) scale(${f(uf.sx)} ${f(uf.sy)}) translate(0 ${f(-cy)})`);
    if (uf.line > 0) out += S.path(`M${f(-Wd / 2 * uf.sx)} ${f(cy)}H${f(Wd / 2 * uf.sx)}`, ln(5, '#FFFFFF', uf.line));
    // warm motes drifting up
    if (warm > 0.3) {
      let d = '';
      for (let i = 0; i < 10; i++) {
        const u = mod(t * 0.35 + hash(i * 3.7), 1);
        d += star4(left + hash(i * 5.1) * Wd, top + Hd - u * (Hd + 90), (3 + 5 * hash(i)) * bumpK(u), t * 40 + i * 20);
      }
      out += S.path(d, { fill: '#FFF1C8', opacity: f(warm) });
    }
  }
  const bob = Math.sin(t * 2.1) * 3.5;
  const op = 1 - clamp(fade, 0, 1);
  return S.g(out, `translate(${f(x)} ${f(y + bob)}) scale(${f(s)})`, op < 1 ? { opacity: f(op) } : {});
}


// ================================================================= 2. TOOLTIPS over objects
// tooltip({ x, y, k, t, s, title, lines, rarity, pointer, side, dist, dx, theme, level, hp, w, out })
// (x, y) = the point ON the object (the pin). The card floats `dist` px away on `side` ('up' | 'down' | 'left' | 'right'), shifted by dx.
// lines: strings like 'COMFORT +50' / '+1% ENERGY' / '−50 FUN' (signed numbers are coloured: + green, − red, % amber) or
// objects { label, value, col } (value in Lilita, coloured). rarity: common uncommon rare epic legendary mystery cursed enemy boss.
// Enemy/boss rarity -> red card with a skull chip, optional `level` badge and `hp` (0..1) mini bar.
function parseLine(l) {
  let ps;
  if (l && typeof l === 'object') ps = [[String(l.label || ''), null], [String(l.value ?? ''), l.col || '#FFD23F'], [String(l.rest || ''), null]];
  else {
    const str = clean(String(l)).toUpperCase();
    const m = str.match(/^(.*?)([+–-]\s?\d[\d,.]*%?)(.*)$/) || str.match(/^(.*?)(\d[\d,.]*%)(.*)$/);
    if (m) { const v = m[2]; const col = v[0] === '+' ? '#3DFF8F' : v[0] === '–' || v[0] === '-' ? '#FF4D66' : '#FFB020'; ps = [[m[1], null], [v, col], [m[3], null]]; } else ps = [[str, null]];
  }
  return ps.map(([a, c]) => [clean(a).trim(), c]).filter(([a]) => a);   // SVG drops edge spaces: parts are trimmed, gaps added when drawn
}
const LBS = 23, LVS2 = 30, PGAP = 9;
const partW = (p) => (p[1] ? TW(p[0], LVS2, 'L') : TW(p[0], LBS, 'F', 0.5));
const partsW = (ps) => ps.reduce((a, p) => a + partW(p), 0) + PGAP * Math.max(0, ps.length - 1);
function tooltip(o = {}) {
  const { x = 960, y = 540, k = 1, t = 0, s = 1, side = 'up', out = 0 } = o;
  if (k <= 0 || out >= 1) return '';
  const rk = o.rarity || 'common';
  const rar = RARITY[rk] || RARITY.common;
  const enemy = rk === 'enemy' || rk === 'boss';
  const th = theme(o.theme || (enemy ? 'boss' : 'cyan'));
  const title = String(o.title || 'ITEM').toUpperCase();
  const lines = (o.lines || []).map(parseLine);
  const TS = 32;
  const chipW = TW(rar.label, 13, 'F', 2) + 26;
  const lvW = o.level !== undefined ? TW(String(o.level), 22, 'L') + 54 : 0;
  const lineW = lines.length ? Math.max(...lines.map(partsW)) : 0;
  const Wd = Math.max(o.w || 0, 230, 30 + lvW + TW(title, TS, 'L') + 14 + (enemy ? 30 : 0) + chipW + 16, 50 + lineW);
  const LH = 38;
  const Hd = 16 + 38 + (o.hp !== undefined ? 18 : 0) + 10 + lines.length * LH + 8;
  const dist = o.dist ?? 64, dx = o.dx ?? 0;
  // card placement relative to the pin
  let bx, by, ax, ay;   // card top-left, leader attach point on the card
  if (side === 'down') { bx = dx - Wd / 2; by = dist; ax = dx; ay = by; }
  else if (side === 'left') { bx = -dist - Wd; by = (o.dy ?? 0) - Hd / 2; ax = -dist; ay = by + Hd / 2; }
  else if (side === 'right') { bx = dist; by = (o.dy ?? 0) - Hd / 2; ax = dist; ay = by + Hd / 2; }
  else { bx = dx - Wd / 2; by = -dist - Hd; ax = dx; ay = -dist; }
  const kP = seg(k, 0, 0.3), kB = seg(k, 0.18, 0.62), kL = seg(k, 0.5, 1);
  let g = '';
  // pin on the object: ring + dot + a pulse
  const pr = 9 * ease.outBack(kP);
  const pu = mod(t * 0.9, 1);
  g += S.circle(0, 0, 9 + 22 * pu, { fill: 'none', stroke: rar.col, 'stroke-width': f(3 * (1 - pu)), opacity: f((1 - pu) * kP) });
  g += S.circle(0, 0, pr + 2, { fill: 'none', stroke: th.edge, 'stroke-width': 7 }) + S.circle(0, 0, pr, { fill: 'none', stroke: rar.col, 'stroke-width': 3.5 }) + S.circle(0, 0, pr * 0.38, { fill: rar.col });
  // leader: from the pin to the card (elbow when shifted)
  if (o.pointer !== false && kP > 0) {
    const ex = lerp(0, ax, ease.out(kP)), ey = lerp(0, ay, ease.out(kP));
    const mid = side === 'up' || side === 'down' ? `L${f(ex * 0.0)} ${f(ey * 0.55)}` : `L${f(ex * 0.55)} 0`;
    const d = `M0 0${Math.abs(dx) > 4 || o.dy ? mid : ''}L${f(ex)} ${f(ey)}`;
    g += S.path(d, ln(6, th.edge, 0.9)) + S.path(d, ln(2.4, rar.col));
  }
  if (kB > 0) {
    const uf = unfold(kB);
    const cx = bx + Wd / 2, cy = by + Hd / 2;
    let c = panel(bx, by, Wd, Hd, th, { c: 14, br: 18 });
    c += S.path(para(bx + 6, by + 6, 8, Hd - 12, 0), { fill: rar.col, opacity: 0.9 });   // rarity stripe on the left edge
    c += sheen(bx + 6, by + 4, Wd - 12, Hd - 8, t, 5, seedOf(title));
    let hx = bx + 26;
    if (o.level !== undefined) {
      c += S.path(para(hx, by + 17, lvW - 12, 30, 8), { fill: th.badge, stroke: th.edge, 'stroke-width': 3 }) + TF('LV', hx + 13, by + 37, 13, th.badgeTx, { 'text-anchor': 'start' }) + TL(String(o.level), hx + 33, by + 41, 23, th.badgeTx, { 'text-anchor': 'start' });
      hx += lvW;
    }
    c += TL(title, hx, by + 46, TS, rar.col === '#DCE6EE' ? th.text : rar.col, { 'text-anchor': 'start', ...outl(5, th.edge) });
    // rarity chip (top right)
    const chx = bx + Wd - 16 - chipW;
    c += S.path(para(chx, by + 18, chipW, 24, 7), { fill: th.edge, stroke: rar.col, 'stroke-width': 2 }) + TF(rar.label, chx + chipW / 2, by + 35, 13, rar.col, { 'letter-spacing': 2 });
    if (enemy) c += skullIcon(chx - 18, by + 29, 12, rar.col, th.edge);
    let ly = by + 62;
    if (o.hp !== undefined) { c += segBar(bx + 26, ly - 4, Wd - 52, 10, o.hp, '#FF3355', { th, t, cell: 14 }); ly += 18; }
    c += S.path(`M${f(bx + 24)} ${f(ly)}H${f(bx + Wd - 22)}`, ln(1.5, th.rim, 0.45));
    lines.forEach((ps, i) => {
      const li = seg(kL, i * 0.2, 0.45 + i * 0.2);
      if (li <= 0) return;
      let lx = bx + 26 + (1 - ease.out(li)) * -20;
      const yy = ly + 10 + i * LH + 26;
      let lt = '';
      for (const p of ps) {
        lt += p[1] ? TL(p[0], lx, yy + 2, LVS2, p[1], { 'text-anchor': 'start', ...outl(5, th.edge) }) : TF(p[0], lx, yy, LBS, th.text, { 'text-anchor': 'start', 'letter-spacing': 0.5 });
        lx += partW(p) + PGAP;
      }
      c += S.g(lt, null, { opacity: f(ease.out(li)) });
    });
    if (kB < 1) c += S.path(cham(bx, by, Wd, Hd, 14), { fill: '#FFFFFF', opacity: f(0.6 * (1 - seg(kB, 0.6, 1))) });
    // unfold from the leader attach point
    g += S.g(c, `translate(${f(ax)} ${f(cy)}) scale(${f(uf.sx)} ${f(uf.sy)}) translate(${f(-ax)} ${f(-cy)})`);
    if (uf.line > 0) g += S.path(`M${f(ax + (bx - ax) * uf.sx)} ${f(cy)}H${f(ax + (bx + Wd - ax) * uf.sx)}`, ln(4, '#FFFFFF', uf.line));
  }
  const bob = o.bob === false ? 0 : Math.sin(t * 2.3 + seedOf(title)) * 2;
  const op = 1 - clamp(out, 0, 1);
  return S.g(g, `translate(${f(x)} ${f(y + bob - 20 * out)}) scale(${f(s)})`, op < 1 ? { opacity: f(op) } : {});
}
const TIPS = {
  bed: { title: 'BED', rarity: 'rare', lines: ['COMFORT +50'] },
  sock: { title: 'SOCK', rarity: 'cursed', lines: ['SMELL +99'] },
  alarm: { title: 'ALARM CLOCK', rarity: 'enemy', level: 1, hp: 1, lines: [{ value: 'ENEMY', col: '#FF3355' }] },
  toaster: { title: 'TOASTER', rarity: 'uncommon', lines: [{ label: 'BURN CHANCE ', value: '80%', col: '#FF7A3D' }] },
  toast: { title: 'TOAST', rarity: 'common', lines: [{ label: 'BURNT ', value: '100%', col: '#FF4D66' }] },
  coffee: { title: 'COFFEE', rarity: 'rare', lines: ['+1% ENERGY'] },
  pizza: { title: 'PIZZA', rarity: 'epic', lines: ['+20 HAPPINESS'] },
  broccoli: { title: 'BROCCOLI', rarity: 'uncommon', lines: ['+50 HEALTH', '−50 FUN'] },
  mysteryMeat: { title: 'MYSTERY MEAT', rarity: 'mystery', lines: [{ value: '???', col: '#FF4FD8' }] },
  quiz: { title: 'POP QUIZ', rarity: 'boss', lines: [{ label: 'DIFFICULTY: ', value: 'IMPOSSIBLE', col: '#FF3355' }] },
  homework: { title: 'HOMEWORK', rarity: 'common', lines: [{ label: 'EATEN BY DOG: ', value: '0%', col: '#FF4D66' }] },
  pillow: { title: 'PILLOW', rarity: 'common', lines: ['SOFTNESS +10'] },
  cereal: { title: 'CEREAL', rarity: 'common', lines: ['SPLASH +80'] },
  glasses: { title: "GRANDPA'S GLASSES", rarity: 'legendary', lines: [{ label: 'LOCATION: ', value: 'HIS HEAD', col: '#FFB020' }] },
  ball: { title: 'BALL', rarity: 'common', lines: [{ label: 'STUCK IN TREE ', value: 'YES', col: '#FF7A3D' }] },
  sandwich: { title: 'TURKEY SANDWICH', rarity: 'rare', lines: ['+37 HP'] },
};
// tipFor('bed' | 'sock' | 'alarm' | 'toaster' | 'toast' | 'coffee' | 'pizza' | 'broccoli' | 'mysteryMeat' | 'quiz' | 'homework' | 'pillow' | 'cereal' | 'glasses' | 'ball' | 'sandwich', over)
function tipFor(key, over = {}) {
  const p = TIPS[key];
  if (!p) throw new Error('hud.tipFor: unknown tooltip ' + key);
  return tooltip({ ...p, ...over });
}

// ---------------------------------------------------------------- LIE meter over a head
// lieMeter({ x, y, s, k, t, value = 99, label = 'LIE', lift, fade }) — (x, y) = head top. k 0..1 (~1.2 s): the gauge unfolds, the
// needle whips around and the digits spin, then LOCK at `value` with a stamp (red alarm when value >= 70).
function lieMeter(o = {}) {
  const { x = 960, y = 500, s = 1, k = 1, t = 0, value = 99, fade = 0 } = o;
  if (k <= 0 || fade >= 1) return '';
  const label = String(o.label || 'LIE').toUpperCase();
  const th = theme(o.theme || 'cyan');
  const Wd = 330, Hd = 150, lift = o.lift ?? 36, top = -lift - Hd, left = -Wd / 2;
  const kT = seg(k, 0, 0.25), kO = seg(k, 0.1, 0.5), kk = seg(k, 0.3, 0.85), lock = seg(k, 0.85, 1);
  const bad = value >= 70;
  let g = S.path(`M0 -6V${f(Math.min(-6, -lift * ease.out(kT) + 2))}`, ln(5.5, th.edge, 0.9)) + S.path(`M0 -6V${f(Math.min(-6, -lift * ease.out(kT) + 2))}`, ln(2.2, th.rim)) +
    S.path(diamondD(0, -2, 7 * ease.outBack(kT), 9 * ease.outBack(kT)), { fill: th.rim, stroke: th.edge, 'stroke-width': 3 });
  if (kO > 0) {
    const uf = unfold(kO), cy = top + Hd / 2;
    const alarm = bad && lock > 0 ? (Math.floor(t * 6) % 2 === 0) : false;
    let c = panel(left, top, Wd, Hd, alarm ? 'boss' : th, { c: 16 });
    c += TF(`${label} DETECTOR`, left + 22, top + 30, 15, th.label, { 'text-anchor': 'start', 'letter-spacing': 2.5 });
    // gauge: 10 annular segments green -> red
    const gx = left + 100, gy = top + Hd - 22, r0 = 50, r1 = 72;
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a0 = Math.PI + (i / 10) * Math.PI + 0.025, a1 = Math.PI + ((i + 1) / 10) * Math.PI - 0.025;
      const col = i < 4 ? mix('#3DFF8F', '#FFD23F', i / 4) : mix('#FFD23F', '#FF3355', (i - 4) / 5);
      const p = (a, r) => `${f(gx + Math.cos(a) * r)} ${f(gy + Math.sin(a) * r)}`;
      c += S.path(`M${p(a0, r0)}L${p(a0, r1)}A${r1} ${r1} 0 0 1 ${p(a1, r1)}L${p(a1, r0)}A${r0} ${r0} 0 0 0 ${p(a0, r0)}Z`, { fill: col, stroke: th.edge, 'stroke-width': 2.5 });
      d += '';
    }
    // needle: whips past, wobbles, locks
    let disp = value * ease.outElastic(kk) + (1 - kk) * Math.sin(t * 31) * 40 * (kk > 0 ? 1 : 0);
    disp = clamp(disp + (lock > 0 ? Math.sin(t * 40) * 0.8 : 0), 0, 100);
    const na = Math.PI + (disp / 100) * Math.PI;
    const nx = Math.cos(na), ny = Math.sin(na);
    c += S.path(`M${f(gx - ny * 6)} ${f(gy + nx * 6)}L${f(gx + nx * 78)} ${f(gy + ny * 78)}L${f(gx + ny * 6)} ${f(gy - nx * 6)}Z`, ol('#FFFFFF', 3.5, th.edge));
    c += S.circle(gx, gy, 10, ol(th.rim, 4, th.edge));
    // readout: digits spin while measuring, then lock
    const shown = kk < 1 ? Math.round(clamp(disp + (hash(Math.floor(t * 24)) - 0.5) * 30 * (1 - kk), 0, 100)) : Math.round(value);
    const vcol = lock > 0 ? (bad ? '#FF3355' : '#3DFF8F') : th.text;
    const pop = 1 + 0.45 * bumpK(lock * 1.4);
    c += TF(`${label}:`, left + 196, top + 66, 22, th.label, { 'text-anchor': 'start', 'letter-spacing': 2 });
    c += S.g(TL(`${shown}%`, 0, 0, 58, vcol, outl(7, th.edge)), `translate(${f(left + 250)} ${f(top + 122)}) scale(${f(pop)})`);
    if (alarm) {   // siren lights in the top corners
      c += S.circle(left + 18, top + 16, 9, ol('#FF3355', 3, th.edge)) + S.circle(left + Wd - 18, top + Hd - 16, 9, ol('#FF3355', 3, th.edge));
      c += S.circle(left + 18, top + 16, 20, { fill: '#FF3355', opacity: 0.3 });
    }
    if (kO < 1) c += S.path(cham(left, top, Wd, Hd, 16), { fill: '#FFFFFF', opacity: f(0.6 * (1 - seg(kO, 0.6, 1))) });
    g += S.g(c, `translate(0 ${f(cy)}) scale(${f(uf.sx)} ${f(uf.sy)}) translate(0 ${f(-cy)})`);
    if (uf.line > 0) g += S.path(`M${f(-Wd / 2 * uf.sx)} ${f(cy)}H${f(Wd / 2 * uf.sx)}`, ln(5, '#FFFFFF', uf.line));
    // LOCK stamp
    if (bad && lock > 0) {
      const st = seg(k, 0.85, 1);
      const sc = lerp(2.2, 1, ease.out(clamp(st * 2, 0, 1)));
      g += S.g(S.path(para(-70, -22, 140, 44, 10), ol('#FF3355', 4, th.edge)) + TL('LIAR!', 0, 15, 34, '#FFF6D8', outl(4, th.edge)), `translate(${f(left + Wd - 30)} ${f(top - 4)}) rotate(8) scale(${f(sc)})`, { opacity: f(clamp(st * 4, 0, 1)) });
      g += impactTicks(left + Wd - 30, top - 4, 100, 40, seg(k, 0.9, 1), '#FF3355');
    }
  }
  const op = 1 - clamp(fade, 0, 1);
  return S.g(g, `translate(${f(x)} ${f(y + Math.sin(t * 2.1) * 3)}) scale(${f(s)})`, op < 1 ? { opacity: f(op) } : {});
}

// ================================================================= 3. QUESTS
const QGOLD = '#FFD21F';
// questMarker({ x, y, s, t, kind '!' | '?', k, col, reward, glow, seed }) — (x, y) = the point it hovers over (a head top); the glyph
// floats ~30 px above it, bobs and turns. k drops it in with a bounce. reward: a small chip ('+2 XP') beside it.
function questMarker(o = {}) {
  const { x = 960, y = 400, s = 1, t = 0, k = 1, kind = '!', col = QGOLD } = o;
  if (k <= 0) return '';
  const seed = o.seed ?? x * 0.013;
  const drop = 1 - ease.outBack(seg(k, 0, 1));
  const bob = Math.sin(t * 3.2 + seed) * 8 - drop * 170;
  const spin = 0.78 + 0.22 * Math.cos(t * 2.4 + seed);
  const h = 104, base = -30;
  let g = '';
  // ground ring pulse + glow
  const pu = mod(t * 0.85 + seed, 1);
  g += S.ellipse(0, -6, 26 + 30 * pu, 8 + 9 * pu, { fill: 'none', stroke: col, 'stroke-width': f(3.5 * (1 - pu)), opacity: f(0.8 * (1 - pu) * clamp(k * 2, 0, 1)) });
  if (o.glow !== false) g += glow(0, base - h * 0.5 + bob, 80, 80, col, 0.8 + 0.2 * Math.sin(t * 4 + seed));
  let glyph;
  if (kind === '?') glyph = TL('?', 0, 0, 132, col, { ...outl(13, INK) }) + TL('?', -3, -4, 132, 'none', { stroke: '#FFFFFF', 'stroke-width': 3, opacity: 0.35 });
  else glyph = bangGlyph(0, -h * 0.92, h, col, 7);
  g += S.g(glyph, `translate(0 ${f(base + bob)}) scale(${f(spin)} 1)`);
  // twinkle
  g += S.path(star4(24 * spin, base - h * 0.95 + bob, 9 * (0.5 + 0.5 * Math.sin(t * 5 + seed)), t * 60), { fill: '#FFFFFF' });
  if (o.reward) {
    const rw = TW(o.reward, 22, 'L') + 26;
    g += S.g(S.path(para(0, -15, rw, 30, 8), ol('#1E1404', 3.5, '#120A00')) + S.path(para(2, -13, rw - 4, 26, 7), { fill: 'none', stroke: col, 'stroke-width': 2 }) + TL(o.reward, rw / 2, 8, 22, col), `translate(${f(44)} ${f(base - 58 + bob)})`);
  }
  return S.g(g, `translate(${f(x)} ${f(y)}) scale(${f(s * (0.6 + 0.4 * clamp(k * 1.5, 0, 1)))})`, k < 0.3 ? { opacity: f(k / 0.3) } : {});
}

// questToast({ k, t, title = 'Find Max', sub, reward, kind = 'new' | 'update' | 'failed' | 'complete', x = 960, y = 150, s, out, glitch, type })
// The "New quest" banner. k 0..1 (~0.6 s): drops in from the top, unfolds, the title types in, the reward chip pops. out 0..1 leaves up.
function questToast(o = {}) {
  const { k = 1, t = 0, x = 960, y = 150, s = 1, out = 0, glitch = 0, kind = 'new' } = o;
  if (k <= 0 || out >= 1) return '';
  const head = o.head || { new: 'NEW QUEST', update: 'QUEST UPDATED', failed: 'QUEST FAILED', complete: 'QUEST COMPLETE' }[kind] || 'NEW QUEST';
  const th = theme(o.theme || (kind === 'failed' ? 'boss' : 'gold'));
  const title = String(o.title || 'Find Max');
  const TS = 54;
  const rw = o.reward ? TW(o.reward, 30, 'L') + 62 : 0;
  const Wd = Math.max(560, 150 + TW(title, TS, 'L') + (rw ? rw + 30 : 0) + 30), Hd = o.sub ? 138 : 118;
  const left = -Wd / 2, top = -Hd / 2;
  const kD = ease.outBack(seg(k, 0, 0.45)), kO = seg(k, 0.1, 0.6), kC = seg(k, 0.45, 1);
  const uf = unfold(kO);
  let c = panel(left, top, Wd, Hd, th, { c: 20, br: 26 });
  c += sheen(left + 8, top + 6, Wd - 16, Hd - 12, t, 3.2, 7);
  // icon block: diamond with "!"
  const ix = left + 70;
  c += S.path(diamondD(ix, 0, 46, 50), ol(kind === 'failed' ? '#FF3355' : QGOLD, 5, th.edge)) + S.path(diamondD(ix, 0, 36, 40), { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2, opacity: 0.6 });
  c += kind === 'complete' ? S.path(checkD(ix, 2, 24), ln(9, th.edge)) : kind === 'failed' ? icon('x', ix, 0, 34, th.edge) : bangGlyph(ix, -30, 60, '#FFFFFF', 5);
  const tx = left + 132;
  c += TF(glitch > 0 ? scramble(head, t, glitch, 2) : head, tx, top + 38, 19, th.label, { 'text-anchor': 'start', 'letter-spacing': 4 });
  let tt = title.slice(0, Math.ceil(title.length * seg(kC, 0, 0.55)));
  if (glitch > 0) tt = scramble(tt, t, glitch, 3);
  if (tt) c += TL(tt, tx, top + 92, TS, th.text, { 'text-anchor': 'start', ...outl(6, th.edge) });
  if (o.sub) c += TF(glitch > 0 ? scramble(o.sub, t, glitch, 4) : o.sub, tx, top + 124, 21, th.label, { 'text-anchor': 'start' });
  if (o.reward) {
    const rk = ease.outBack(seg(kC, 0.5, 0.9));
    const rx = -left - 24 - rw / 2;
    if (rk > 0) c += S.g(S.path(para(-rw / 2, -24, rw, 48, 12), ol('#2A1A00', 4, th.edge)) + S.path(para(-rw / 2 + 3, -21, rw - 6, 42, 10), { fill: 'none', stroke: QGOLD, 'stroke-width': 2.5 }) + S.path(star5(-rw / 2 + 26, 0, 12), { fill: QGOLD }) + TL(o.reward, -rw / 2 + 44, 11, 30, QGOLD, { 'text-anchor': 'start' }), `translate(${f(rx)} 0) scale(${f(rk)})`);
  }
  if (kO < 1) c += S.path(cham(left, top, Wd, Hd, 20), { fill: '#FFFFFF', opacity: f(0.7 * (1 - seg(kO, 0.55, 1))) });
  let g = S.g(c, `scale(${f(uf.sx)} ${f(uf.sy)})`);
  if (uf.line > 0) g += S.path(`M${f(left * uf.sx)} 0H${f(-left * uf.sx)}`, ln(6, '#FFFFFF', uf.line));
  g = glitchWrap(g, t, glitch, 5, 12);
  const op = 1 - clamp(out, 0, 1);
  return S.g(g, `translate(${f(x)} ${f(y - 170 * (1 - kD) - 60 * ease.in(out))}) scale(${f(s)})`, op < 1 ? { opacity: f(op) } : {});
}

// questComplete({ k, t, reward = '+50 XP', title = 'QUEST COMPLETE!', x = 960, y = 330, s, out, epic, sub })
// k 0..1 (~1.2 s): rays, the banner unfolds, a medal with a check draws on, the letters drop in one by one, then the reward chip
// SLAMS under it and counts up ('+37 HP' green, '+50 XP' gold). epic: purple + more rays ("EPIC QUEST COMPLETE!").
function questComplete(o = {}) {
  const { k = 1, t = 0, x = 960, y = 330, s = 1, out = 0, epic = false } = o;
  if (k <= 0 || out >= 1) return '';
  const title = String(o.title || (epic ? 'EPIC QUEST COMPLETE!' : 'QUEST COMPLETE!')).toUpperCase();
  const reward = o.reward ?? '+50 XP';
  const gold = epic ? '#FFD84A' : '#FFD84A';
  const th = theme(epic ? { glass: '#1E0A30', op: 0.88, rim: '#C58BFF', hi: '#EBD8FF', edge: '#0E0418', text: '#FFFFFF', label: '#D8B8FF', badge: '#FFC83A', badgeTx: '#2A1A00' } : 'gold');
  const TS = 76;
  const tw = TW(title, TS, 'L');
  const Wd = tw + 230, Hd = 124, left = -Wd / 2, top = -Hd / 2;
  let g = '';
  const appear = seg(k, 0, 0.25);
  g += rays(0, 0, epic ? 22 : 16, epic ? 640 : 520, epic ? '#E4C2FF' : '#FFE88A', 0.22 * appear * (1 - 0.3 * out), t * 18, 60);
  g += S.circle(0, 0, 340 * ease.out(seg(k, 0, 0.35)), { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(18 * (1 - seg(k, 0, 0.35))), opacity: f(1 - seg(k, 0, 0.35)) });
  const kO = seg(k, 0.05, 0.4), uf = unfold(kO);
  let c = panel(left, top, Wd, Hd, th, { c: 24, br: 30 });
  c += sheen(left + 8, top + 6, Wd - 16, Hd - 12, t, 2.6, 3);
  // medal with a check drawn on
  const mx = left + 82, mk = ease.outBack(seg(k, 0.2, 0.45));
  if (mk > 0) {
    let m = S.path(hexD(0, 0, 50), ol(epic ? '#B46BFF' : '#3DFF8F', 5, th.edge)) + S.path(hexD(0, 0, 40), { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 2.5, opacity: 0.6 });
    const ck = seg(k, 0.35, 0.55);
    if (ck > 0) m += S.path(checkD(0, 2, 30), { ...ln(11, th.edge), 'stroke-dasharray': '90', 'stroke-dashoffset': f(90 * (1 - ck)) });
    c += S.g(m, `translate(${f(mx)} 0) scale(${f(mk)}) rotate(${f(-20 * (1 - mk))})`);
  }
  // letters drop in
  let lx = left + 150;
  [...title].forEach((ch, i) => {
    const li = seg(k, 0.22 + i * 0.018, 0.4 + i * 0.018);
    const cw = TW(ch, TS, 'L');
    if (li > 0 && ch !== ' ') c += S.g(TL(ch, 0, 0, TS, gold, { 'text-anchor': 'start', ...outl(9, th.edge) }), `translate(${f(lx)} ${f(28 - 60 * (1 - ease.outBack(li)))})`, { opacity: f(clamp(li * 3, 0, 1)) });
    lx += cw;
  });
  if (kO < 1) c += S.path(cham(left, top, Wd, Hd, 24), { fill: '#FFFFFF', opacity: f(0.7 * (1 - seg(kO, 0.55, 1))) });
  g += S.g(c, `scale(${f(uf.sx)} ${f(uf.sy)})`);
  if (uf.line > 0) g += S.path(`M${f(left * uf.sx)} 0H${f(-left * uf.sx)}`, ln(6, '#FFFFFF', uf.line));
  // reward chip: slams under the banner and counts up
  if (reward) {
    const rk = seg(k, 0.55, 0.8);
    if (rk > 0) {
      const m = String(reward).match(/^([+–\-−]?)\s*([\d,]+)\s*(.*)$/);
      let txt = String(reward);
      if (m) { const n = Number(m[2].replace(/,/g, '')); txt = `${m[1]}${Math.round(n * ease.out(seg(k, 0.6, 0.95)))} ${m[3]}`.trim(); }
      const isHP = /HP|HEALTH/i.test(reward);
      const rc = isHP ? '#3DFF8F' : QGOLD;
      const tw_ = TW(String(reward), 60, 'L'), rw = tw_ + 110;
      const sc = rk < 0.5 ? lerp(2.4, 1, ease.in(rk * 2)) : 1 + 0.12 * Math.sin((rk - 0.5) * 2 * Math.PI * 2) * (1 - rk);
      let rc_ = S.path(para(-rw / 2, -40, rw, 80, 18), ol(isHP ? '#04180E' : '#1E1404', 5, th.edge)) + S.path(para(-rw / 2 + 4, -36, rw - 8, 72, 16), { fill: 'none', stroke: rc, 'stroke-width': 3 });
      rc_ += isHP ? S.path(heartD(-rw / 2 + 50, -2, 19), ol('#FF5F7A', 4, th.edge)) : S.path(star5(-rw / 2 + 50, 0, 21), ol(rc, 4, th.edge));
      rc_ += TL(txt, -rw / 2 + 82, 21, 60, rc, { 'text-anchor': 'start', ...outl(7, th.edge) });
      g += S.g(rc_, `translate(0 ${f(Hd / 2 + 62)}) scale(${f(sc)})`, { opacity: f(clamp(rk * 4, 0, 1)) });
      g += impactTicks(0, Hd / 2 + 62, rw * 0.6, 70, seg(k, 0.66, 0.95), rc, 8);
    }
  }
  if (o.sub) g += TF(o.sub, 0, Hd / 2 + 140, 28, '#FFFFFF', outl(6, INK));
  g += sparkleBurst(0, 0, seg(k, 0.3, 0.95), Wd * 0.55, 12, epic ? '#F0D8FF' : '#FFF0A0', 4);
  const op = 1 - clamp(out, 0, 1);
  return S.g(g, `translate(${f(x)} ${f(y - 40 * ease.in(out))}) scale(${f(s * (1 - 0.15 * out))})`, op < 1 ? { opacity: f(op) } : {});
}

// questArrow({ x, y, angle = -90, t, glitch, k, s, label = 'FIND MAX', dist = '120 m', col }) — a navigation chevron lying on a ground ring
// around (x, y) (e.g. the hero's feet), pointing at screen angle `angle` (deg; 0 = right, -90 = away/up). glitch 0..1: it SPINS wildly
// with jerks, flickers red and the label scrambles to "LOCATION: UNKNOWN · ??? m".
function questArrow(o = {}) {
  const { x = 960, y = 800, t = 0, glitch = 0, k = 1, s = 1 } = o;
  if (k <= 0) return '';
  const col = o.col || QGOLD;
  let ang = o.angle ?? -90;
  if (glitch > 0) ang += glitch * (t * 720 + hash(Math.floor(t * 6)) * 540 + Math.sin(t * 13) * 90);
  const red = glitch > 0 && hash(Math.floor(t * 10) * 1.7) < glitch * 0.6;
  const ac = red ? '#FF3355' : col;
  const kk = ease.outBack(seg(k, 0, 1));
  let g = '';
  // ground ring with rotating ticks
  g += S.ellipse(0, 0, 150, 52, { fill: '#061624', 'fill-opacity': 0.35, stroke: '#020C16', 'stroke-width': 8 }) + S.ellipse(0, 0, 150, 52, { fill: 'none', stroke: '#3BE8FF', 'stroke-width': 3 });
  let d = '';
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2 + t * 0.4; d += `M${f(Math.cos(a) * 132)} ${f(Math.sin(a) * 45)}L${f(Math.cos(a) * 146)} ${f(Math.sin(a) * 50.5)}`; }
  g += S.path(d, ln(3, '#3BE8FF', 0.7));
  // the chevron arrow on the ground plane (3-D slab: dark copy below)
  const pts = 'M-70 -22H30V-52L108 0L30 52V22H-70L-50 0Z';
  const flat = (yy) => `translate(0 ${f(yy)}) scale(1 0.42) rotate(${f(ang)})`;
  g += S.g(S.path(pts, { fill: mix(ac, '#000000', 0.45), stroke: INK, 'stroke-width': 8, 'stroke-linejoin': 'round' }), flat(10));
  g += S.g(S.path(pts, { fill: ac, stroke: INK, 'stroke-width': 8, 'stroke-linejoin': 'round' }) + S.path('M-56 -12H36', ln(6, '#FFFFFF', 0.55)), flat(-2));
  if (glitch > 0) g += S.g(S.path(pts, { fill: 'none', stroke: '#2EE6FF', 'stroke-width': 4, opacity: 0.6 }), flat(-2) + ` rotate(${f(-30 * glitch)})`);
  // label pill
  const label = glitch > 0.2 ? scramble(o.unknown || 'LOCATION: UNKNOWN', t, glitch * 0.7, 6) : String(o.label || 'FIND MAX').toUpperCase();
  const dist = glitch > 0.2 ? scramble('??? m', t, glitch, 3) : o.dist ?? '120 m';
  const txt = dist ? `${label} · ${dist}` : label;
  const lw = TW(txt, 24, 'F', 1) + 64;
  const th = theme(glitch > 0.2 ? 'error' : 'gold');
  g += S.g(panel(-lw / 2, -22, lw, 44, th, { c: 10, br: 12, shadow: false }) + S.path(diamondD(-lw / 2 + 24, 0, 8, 10), { fill: ac }) + TF(txt, 12, 9, 24, th.text, { 'letter-spacing': 1 }), 'translate(0 86)');
  g = glitchWrap(g, t, glitch * 0.7, 8, 10);
  return S.g(g, `translate(${f(x)} ${f(y)}) scale(${f(s * kk)})`, k < 0.25 ? { opacity: f(k / 0.25) } : {});
}

// epicQuest({ k, t, title, reward = '+100 XP', x = 960, y = 300, s, out, stars = 5 }) — the purple-gold "EPIC QUEST" offer card
// (Max: "Build me a pillow fort! The biggest one EVER!"). pillowFort(o) = the same with the pillow-fort defaults.
function epicQuest(o = {}) {
  const { k = 1, t = 0, x = 960, y = 300, s = 1, out = 0, stars = 5 } = o;
  if (k <= 0 || out >= 1) return '';
  const th = theme({ glass: '#1E0A30', op: 0.9, rim: '#C58BFF', hi: '#EBD8FF', edge: '#0E0418', text: '#FFFFFF', label: '#FFD84A', badge: '#FFC83A', badgeTx: '#2A1A00' });
  const title = String(o.title || 'BUILD THE BIGGEST PILLOW FORT EVER').toUpperCase();
  const lines = wrapBal(title, 760, 50);
  const Wd = Math.max(...lines.map((l) => TW(l, 50, 'L'))) + 120, Hd = 96 + lines.length * 56 + 70;
  const left = -Wd / 2, top = -Hd / 2;
  const kD = ease.outBack(seg(k, 0, 0.5)), kO = seg(k, 0.08, 0.55), kC = seg(k, 0.45, 1);
  const uf = unfold(kO);
  let g = rays(0, 0, 18, Wd * 0.85, '#C58BFF', 0.2 * seg(k, 0, 0.3), t * 15, 40);
  let c = panel(left, top, Wd, Hd, th, { c: 26, br: 32 });
  c += sheen(left + 8, top + 6, Wd - 16, Hd - 12, t, 2.8, 9);
  // header tab
  const hw = 330;
  c += S.path(para(-hw / 2, top - 26, hw, 52, 14), ol('#B46BFF', 5, th.edge)) + S.path(para(-hw / 2, top - 26, hw, 52, 14), { fill: 'url(#hdHaz)', opacity: 0.35 });
  c += TL('EPIC QUEST', 0, top + 13, 38, '#FFFFFF', outl(6, th.edge)) + S.path(star5(-hw / 2 + 34, top, 13), ol('#FFD84A', 3, th.edge)) + S.path(star5(hw / 2 - 30, top, 13), ol('#FFD84A', 3, th.edge));
  lines.forEach((l, i) => { const li = seg(kC, i * 0.15, 0.4 + i * 0.15); if (li > 0) c += TL(l, 0, top + 92 + i * 56, 50, '#FFFFFF', { ...outl(7, th.edge), opacity: f(li) }); });
  // difficulty stars + reward
  const sy = top + 92 + lines.length * 56 + 6;
  c += TF('DIFFICULTY', left + 40, sy + 8, 18, th.label, { 'text-anchor': 'start', 'letter-spacing': 2 });
  for (let i = 0; i < stars; i++) { const si = ease.outBack(seg(kC, 0.4 + i * 0.07, 0.6 + i * 0.07)); if (si > 0) c += S.path(star5(left + 192 + i * 34, sy, 14 * si), ol('#FFD84A', 3, th.edge)); }
  if (o.reward !== false) {
    const rw_ = String(o.reward || '+100 XP'), rw = TW(rw_, 34, 'L') + 30, rk = ease.outBack(seg(kC, 0.65, 1));
    if (rk > 0) c += S.g(S.path(para(-rw / 2, -24, rw, 48, 12), ol('#2A1A00', 4, th.edge)) + TL(rw_, 0, 12, 34, '#FFD84A'), `translate(${f(-left - 30 - rw / 2)} ${f(sy)}) scale(${f(rk)})`);
  }
  if (kO < 1) c += S.path(cham(left, top, Wd, Hd, 26), { fill: '#FFFFFF', opacity: f(0.7 * (1 - seg(kO, 0.55, 1))) });
  g += S.g(c, `scale(${f(uf.sx)} ${f(uf.sy)})`);
  if (uf.line > 0) g += S.path(`M${f(left * uf.sx)} 0H${f(-left * uf.sx)}`, ln(6, '#FFFFFF', uf.line));
  g += sparkleBurst(0, 0, seg(k, 0.3, 0.9), Wd * 0.6, 10, '#F0D8FF', 2);
  const op = 1 - clamp(out, 0, 1);
  return S.g(g, `translate(${f(x)} ${f(y - 120 * (1 - kD) - 50 * ease.in(out))}) scale(${f(s)})`, op < 1 ? { opacity: f(op) } : {});
}
// balanced word wrap (Lilita): the fewest lines that fit maxW, with the line widths as even as possible
function wrapBal(text, maxW, size) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const n = R.wrap(text, maxW, size, 'L').length;
  if (n <= 1 || words.length < 2) return [String(text)];
  if (n === 2) {
    let best = null;
    for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '); const m = Math.max(TW(a, size, 'L'), TW(b, size, 'L')); if (!best || m < best[0]) best = [m, [a, b]]; }
    return best[1];
  }
  return R.wrap(text, maxW, size, 'L');
}
const pillowFort = (o = {}) => epicQuest({ title: 'BUILD THE BIGGEST PILLOW FORT EVER', reward: '+100 XP', ...o });

// ================================================================= 4. THE HERO'S XP
const XP_FLY = 1.0;   // xpPop arrives at its target this many seconds after age 0
// xpBar({ x = 960, y = 1050, w = 1800, value 0..1, level, k, t, gain 0..1, from, roll, text, levelBump 0..1, s }) — the hero's XP strip at
// the very bottom of the frame (under the captions' baseline). value = progress inside the current level. roll + from: the fill
// slides from `from` (with a white leading ghost). gain: a gold pulse when XP arrives. levelBump: the level hexagon pops.
function xpBar(o = {}) {
  const { x = 960, y = 1050, w = 1640, k = 1, t = 0, gain = 0, s = 1 } = o;
  if (k <= 0) return '';
  const th = theme('gold');
  let v = clamp(o.value ?? 0.35, 0, 1), ghost;
  if (o.roll !== undefined) { const rp = rollPair(o.from ?? 0, v, clamp(o.roll, 0, 1)); ghost = rp.fast; v = rp.slow; }
  const bx = -w / 2 + 70, bw = w - 70 - 40 - (TW(o.text ?? '100%', 28, 'L') + 50);
  let g = '';
  const gl = bumpK(gain);
  // bar
  g += segBar(bx, -9, bw, 18, v, '#FFC83A', { th, t, cell: 22, ghost });
  if (gl > 0) {
    g += S.path(para(bx - 4, -13, bw * v + 8, 26, 9), { fill: 'none', stroke: '#FFF1B8', 'stroke-width': f(4 * gl), opacity: f(gl) });
    g += S.path(star4(bx + bw * v, 0, 22 * gl, t * 200), { fill: '#FFFFFF' });
  }
  // level hexagon
  const lb = 1 + 0.35 * bumpK(o.levelBump || 0) + 0.06 * gl;
  const lv = String(o.level ?? 1);
  let hx = S.path(hexD(0, 0, 42), ol('#1E1404', 5, th.edge)) + S.path(hexD(0, 0, 35), { fill: 'none', stroke: '#FFC83A', 'stroke-width': 3 });
  hx += TF('LV', 0, -12, 13, '#FFD98A', { 'letter-spacing': 1 }) + TL(lv, 0, 20, lv.length > 2 ? 26 : 32, '#FFFFFF', outl(4, th.edge));
  if (o.levelBump > 0 && o.levelBump < 1) hx += S.circle(0, 0, 42 + 50 * o.levelBump, { fill: 'none', stroke: '#FFE88A', 'stroke-width': f(8 * (1 - o.levelBump)), opacity: f(1 - o.levelBump) });
  g += S.g(hx, `translate(${f(-w / 2 + 30)} -14) scale(${f(lb)})`);
  // XP label at the right end
  const txt = o.text ?? `${Math.round(v * 100)}%`;
  const txW = TW(txt, 28, 'L');
  g += TF('XP', w / 2 - 4 - txW - 10, 9, 20, '#FFD98A', { 'text-anchor': 'end', 'letter-spacing': 2, ...outl(4, th.edge) }) + TL(txt, w / 2 - 4, 11, 28, gl > 0.3 ? '#FFFFFF' : '#FFE9A0', { 'text-anchor': 'end', ...outl(5, th.edge) });
  return S.g(g, `translate(${f(x)} ${f(y + 90 * (1 - ease.out(k)))}) scale(${f(s)})`);
}
// xpBarAt({ x, y, w, value, text }) -> [x, y]: the end of the XP fill for a bar drawn with the same options (the target for xpPop)
function xpBarAt(o = {}) {
  const { x = 960, y = 1050, w = 1640, s = 1 } = o;
  const bw = w - 70 - 40 - (TW(o.text ?? '100%', 28, 'L') + 50);
  return [x + (-w / 2 + 70 + bw * clamp(o.value ?? 0.35, 0, 1)) * s, y];
}
// xpPop({ x, y, age, amount = 10, to = [x, y] of the XP bar, text, col, s }) — "+10 XP" pops over a person (0-0.2 s), hangs, then flies in an
// arc to `to` (default: the XP bar's middle) shrinking with a sparkle trail, arriving at XP_FLY (1.0 s) with a small burst (gone at 1.3 s).
function xpPop(o = {}) {
  const { x = 960, y = 400, age = 0, amount = 10, s = 1 } = o;
  if (age < 0 || age > XP_FLY + 0.3) return '';
  const to = o.to || [960, 1050];
  const col = o.col || '#FFD23F';
  const text = o.text ?? `+${amount} XP`;
  const P = (a) => {   // position + scale at age a
    if (a < 0.4) return [x, y - 40 * ease.out(seg(a, 0, 0.4)), a < 0.2 ? ease.outBack(a / 0.2) * 1.15 - 0.15 * seg(a, 0.12, 0.2) : 1];
    const u = ease.inOut(seg(a, 0.4, XP_FLY)), x0 = x, y0 = y - 40, cx = lerp(x0, to[0], 0.25), cy = Math.min(y0, to[1]) - 240;
    return [(1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * cx + u * u * to[0], (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * cy + u * u * to[1], lerp(1, 0.4, u)];
  };
  let g = '';
  if (age < XP_FLY) {
    if (age > 0.4) for (let i = 4; i >= 1; i--) { const [px, py] = P(Math.max(0.4, age - i * 0.035)); g += S.path(star4(px, py, (14 - i * 2) * s, i * 30), { fill: col, opacity: f(0.6 - i * 0.12) }); }
    const [px, py, sc] = P(age);
    g += S.g(TL(text, 0, 0, 56, col, outl(9, INK)) + TL(text, 0, 0, 56, 'none', { stroke: '#FFFFFF', 'stroke-width': 1.5, opacity: 0.4 }), `translate(${f(px)} ${f(py)}) scale(${f(sc * s)})`);
    if (age < 0.35) g += sparkleBurst(x, y, age / 0.35, 90 * s, 7, '#FFF0A0', amount);
  } else {
    const u = (age - XP_FLY) / 0.3;
    g += S.circle(to[0], to[1], 14 + 50 * ease.out(u), { fill: 'none', stroke: col, 'stroke-width': f(7 * (1 - u)), opacity: f(1 - u) }) + sparkleBurst(to[0], to[1], u, 70, 6, '#FFFFFF', 3);
  }
  return g;
}
// levelUp({ k, t, level, from, x = 960, y = 380, s, out }) — the LEVEL UP burst: shockwave, gold rays, "LEVEL UP!" letters drop in,
// the hexagon counts from `from` (level - 1) to `level` and pops, rising chevrons + sparkles. k 0..1 ≈ 1.3 s.
function levelUp(o = {}) {
  const { k = 1, t = 0, x = 960, y = 380, s = 1, out = 0 } = o;
  if (k <= 0 || out >= 1) return '';
  const level = o.level ?? 2, from = o.from ?? level - 1;
  let g = '';
  const a = seg(k, 0, 0.2);
  g += rays(0, 0, 18, 600, '#FFE88A', 0.26 * a, t * 25, 80);
  g += S.circle(0, 0, 60 + 520 * ease.out(seg(k, 0, 0.4)), { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(22 * (1 - seg(k, 0, 0.4))), opacity: f(1 - seg(k, 0, 0.4)) });
  g += glow(0, 0, 240, 240, '#FFD84A', a);
  // rising chevrons
  for (let i = 0; i < 6; i++) {
    const u = mod(t * 0.8 + i / 6, 1), cx = (i % 2 ? 1 : -1) * (300 + 60 * hash(i)), cy = 120 - u * 320;
    g += S.path(`M${f(cx - 26)} ${f(cy + 14)}L${f(cx)} ${f(cy - 12)}L${f(cx + 26)} ${f(cy + 14)}`, { ...ln(12, '#FFD84A', bumpK(u) * a), 'stroke-linecap': 'round' });
  }
  const txt = 'LEVEL UP!', TS = 128;
  let lx = -TW(txt, TS, 'L') / 2;
  [...txt].forEach((ch, i) => {
    const li = seg(k, 0.06 + i * 0.035, 0.3 + i * 0.035), cw = TW(ch, TS, 'L');
    if (li > 0 && ch !== ' ') g += S.g(TL(ch, 0, 0, TS, '#FFD84A', { 'text-anchor': 'start', ...outl(13, INK) }) + TL(ch, 0, -4, TS, 'none', { 'text-anchor': 'start', stroke: '#FFF6C8', 'stroke-width': 3, opacity: 0.6 }), `translate(${f(lx)} ${f(-10 - 90 * (1 - ease.outBack(li)))}) scale(1 ${f(lerp(1.4, 1, ease.out(li)))})`, { opacity: f(clamp(li * 3, 0, 1)) });
    lx += cw;
  });
  // level hexagon counting up
  const hk = ease.outBack(seg(k, 0.3, 0.55));
  if (hk > 0) {
    const n = Math.round(lerp(from, level, ease.out(seg(k, 0.45, 0.8))));
    const pop = 1 + 0.3 * bumpK(seg(k, 0.78, 0.95));
    let h = S.path(hexD(0, 0, 66), ol('#1E1404', 7, INK)) + S.path(hexD(0, 0, 56), { fill: 'none', stroke: '#FFC83A', 'stroke-width': 4 });
    h += TF('LV', 0, -20, 20, '#FFD98A', { 'letter-spacing': 2 }) + TL(String(n), 0, 32, String(n).length > 2 ? 44 : 56, '#FFFFFF', outl(6, INK));
    g += S.g(h, `translate(0 120) scale(${f(hk * pop)})`);
  }
  g += sparkleBurst(0, 0, seg(k, 0.15, 0.85), 480, 14, '#FFF0A0', level);
  g += sparkleBurst(0, 120, seg(k, 0.78, 1), 160, 8, '#FFFFFF', level + 3);
  const op = 1 - clamp(out, 0, 1);
  return S.g(g, `translate(${f(x)} ${f(y - 50 * ease.in(out))}) scale(${f(s)})`, op < 1 ? { opacity: f(op) } : {});
}

// ================================================================= 5. FRIENDSHIP
// friendshipPop({ x, y, age, value = +1 | -50, s, hold, label }) — (x, y) = where the heart appears (over a head).
// +: a pink heart pops, beats twice, little hearts float off, chip "FRIENDSHIP +1"; rises and fades by ~2 s.
// −: a red heart pops, CRACKS down the middle, the halves split and fall with shards; red chip "FRIENDSHIP −50" shakes on; fades by ~2.6 s.
// hold: true keeps the final state on screen (no fade) — for "That number hurt more than any other".
function friendshipPop(o = {}) {
  const { x = 960, y = 400, age = 0, s = 1, hold = false } = o;
  const value = o.value ?? 1;
  const neg = value < 0;
  const life = neg ? 2.6 : 2.0;
  if (age < 0 || (!hold && age > life)) return '';
  const a = hold ? Math.min(age, neg ? 1.5 : 1.0) : age;
  const label = o.label || `FRIENDSHIP ${neg ? '–' : '+'}${Math.abs(value)}`;
  const col = neg ? '#FF3355' : '#FF5FA2';
  const fadeK = hold ? 0 : seg(age, life - 0.5, life);
  const rise = neg ? 0 : -50 * ease.out(seg(a, 0.6, 2));
  let g = '';
  const pk = ease.outBack(seg(a, 0, 0.25));
  const beat = neg ? 1 : 1 + 0.16 * bumpK(seg(a, 0.32, 0.46)) + 0.16 * bumpK(seg(a, 0.52, 0.66));
  const r = 46;
  if (!neg) {
    g += S.circle(0, 0, 40 + 90 * ease.out(seg(a, 0, 0.4)), { fill: 'none', stroke: col, 'stroke-width': f(10 * (1 - seg(a, 0, 0.4))), opacity: f(1 - seg(a, 0, 0.4)) });
    g += S.g(S.path(heartD(0, 0, r), ol(col, 6, INK)) + S.path(`M${-r * 0.75} ${-r * 0.35}Q${-r * 0.75} ${-r * 0.8} ${-r * 0.3} ${-r * 0.78}`, ln(7, '#FFFFFF', 0.85)), `scale(${f(pk * beat)})`);
    // little hearts floating off
    for (let i = 0; i < 6; i++) {
      const u = seg(a, 0.2 + i * 0.08, 1.2 + i * 0.08);
      if (u <= 0 || u >= 1) continue;
      const hx = (hash(i * 3.1) - 0.5) * 160 + Math.sin(u * 6 + i) * 14, hy = -40 - u * 150;
      g += S.path(heartD(hx, hy, 12 + 6 * hash(i)), { fill: col, stroke: INK, 'stroke-width': 3, opacity: f(1 - u) });
    }
  } else {
    // pop, crack (0.45-0.6), split + fall (0.75+)
    const ck = seg(a, 0.42, 0.6), sp = seg(a, 0.72, 1.5);
    const crackD = `M0 ${-r * 0.42}L${-r * 0.16} ${-r * 0.1}L${r * 0.14} ${r * 0.18}L${-r * 0.1} ${r * 0.48}L0 ${r * 0.85}`;
    const shake = ck > 0 && ck < 1 ? (hash(Math.floor(a * 40)) - 0.5) * 8 : 0;
    const halfClip = (side) => {   // a half heart: the heart path cut along the crack (built as its own path)
      const d = side < 0
        ? `M0 ${-r * 0.42}C${-r * 0.85} ${-r * 1.2} ${-r * 1.5} ${-r * 0.05} 0 ${r * 0.85}L${-r * 0.1} ${r * 0.48}L${r * 0.14} ${r * 0.18}L${-r * 0.16} ${-r * 0.1}Z`
        : `M0 ${-r * 0.42}C${r * 0.85} ${-r * 1.2} ${r * 1.5} ${-r * 0.05} 0 ${r * 0.85}L${-r * 0.1} ${r * 0.48}L${r * 0.14} ${r * 0.18}L${-r * 0.16} ${-r * 0.1}Z`;
      return S.path(d, ol(col, 6, INK));
    };
    if (sp <= 0) {
      g += S.g(S.path(heartD(0, 0, r), ol(col, 6, INK)) + S.path(`M${-r * 0.75} ${-r * 0.35}Q${-r * 0.75} ${-r * 0.8} ${-r * 0.3} ${-r * 0.78}`, ln(7, '#FFFFFF', 0.7)), `translate(${f(shake)} 0) scale(${f(pk)})`);
      if (ck > 0) g += S.path(crackD, { ...ln(6, INK), 'stroke-dasharray': '140', 'stroke-dashoffset': f(140 * (1 - ck)) });
    } else {
      const fall = hold ? Math.min(sp, 0.25) : sp;
      for (const side of [-1, 1]) {
        const dx = side * (8 + 40 * ease.out(fall)), dy = 160 * fall * fall, rot = side * 28 * ease.out(fall);
        g += S.g(halfClip(side), `translate(${f(dx)} ${f(dy)}) rotate(${f(rot)})`, { opacity: f(1 - 0.6 * seg(fall, 0.5, 1)) });
      }
      for (let i = 0; i < 7; i++) {   // shards
        const u = seg(a, 0.72, 1.6);
        if (u >= 1 || hold) continue;
        const an = -Math.PI / 2 + (hash(i * 2.3) - 0.5) * 2.6, v = 120 + 120 * hash(i * 4.1);
        g += S.path(R.sq(Math.cos(an) * v * u, Math.sin(an) * v * u + 300 * u * u, 6 * (1 - u) + 2, u * 300 + i * 40), { fill: i % 2 ? col : '#FFFFFF', opacity: f(1 - u) });
      }
    }
  }
  // chip
  const ck2 = seg(a, neg ? 0.5 : 0.2, neg ? 0.7 : 0.42);
  if (ck2 > 0) {
    const cw = TW(label, 24, 'L') + 40, th = theme(neg ? 'boss' : { glass: '#2A0A1C', op: 0.86, rim: '#FF8AC4', hi: '#FFE0F0', edge: '#14040C', text: '#FFFFFF', label: '#FFB8DA' });
    const sh = neg && ck2 < 1 ? (hash(Math.floor(a * 30) * 1.1) - 0.5) * 10 : 0;
    g += S.g(panel(-cw / 2, -21, cw, 42, th, { c: 9, br: 12, shadow: false }) + TL(label, 0, 10, 24, neg ? '#FF4D66' : '#FFFFFF', outl(4, th.edge)), `translate(${f(sh)} ${f(r + 44)}) scale(${f(ease.outBack(ck2))})`);
  }
  const op = 1 - fadeK;
  return S.g(g, `translate(${f(x)} ${f(y + rise)}) scale(${f(s)})`, op < 1 ? { opacity: f(op) } : {});
}


// ================================================================= 6. UPDATE / BOOT / FRAME / SYSTEM
// updateWindow({ k, t, scroll 0..1, accept 0..1, install 0..1, x = 960, y = 530, s, glitch, pointer: { x, y, press } (absolute px) })
// "Update available: Reality HUD v1.0" — the terms box ("PAGE 1 / 4,812") scrolls as `scroll` goes 0 -> 1 (the page counter rolls,
// lines streak, the tiny scrollbar thumb flies down), ACCEPT pulses; `accept` presses it (squash, flash, ripple, "ACCEPTED");
// `install` swaps the buttons for "INSTALLING... REALITY" + progress. Page one (readable only at scroll ≈ 0) mentions the X. ~1160 x 740 at s 1.
function updateWindow(o = {}) {
  const { k = 1, t = 0, scroll = 0, accept = 0, install = 0, x = 960, y = 530, s = 1, glitch = 0 } = o;
  if (k <= 0) return '';
  const th = theme('cyan');
  const Wd = 1160, Hd = 740, left = -Wd / 2, top = -Hd / 2;
  const kO = seg(k, 0, 0.6), kC = seg(k, 0.45, 1), uf = unfold(kO);
  let c = panel(left, top, Wd, Hd, th, { c: 30, br: 40, scan: true });
  // title bar
  c += S.path(`M${f(left + 30)} ${f(top)}H${f(-left)}V${f(top + 62)}H${f(left)}V${f(top + 30)}Z`, { fill: th.edge, opacity: 0.6 });
  c += eyeLogo(left + 52, top + 32, 13, th.rim, t) + TF('SYSTEM UPDATE', left + 84, top + 41, 22, th.label, { 'text-anchor': 'start', 'letter-spacing': 5 });
  c += closeX({ x: -left - 38, y: top + 31, t, s: 0.8, hint: false });   // it was there all along
  const cc = (svg, a, b) => { const u = seg(kC, a, b); return u > 0 ? S.g(svg, `translate(${f(-24 * (1 - ease.out(u)))} 0)`, { opacity: f(u) }) : ''; };
  // header
  const ringR = 78;
  let hd = glow(left + 140, top + 178, ringR, ringR, th.rim, 0.9) + S.circle(left + 140, top + 178, ringR, { fill: 'none', stroke: th.rim, 'stroke-width': 3, 'stroke-dasharray': '22 12', transform: `rotate(${f(t * 40)} ${f(left + 140)} ${f(top + 178)})` });
  hd += eyeLogo(left + 140, top + 178, 46, th.rim, t);
  c += cc(hd, 0, 0.4);
  c += cc(TF('UPDATE AVAILABLE', left + 250, top + 132, 24, '#FFD21F', { 'text-anchor': 'start', 'letter-spacing': 5 }), 0.05, 0.4);
  c += cc(TL('Reality HUD v1.0', left + 246, top + 212, 82, th.text, { 'text-anchor': 'start', ...outl(9, th.edge) }), 0.1, 0.45);
  c += cc(TF("See everyone's stats. In real life.", left + 252, top + 256, 27, th.label, { 'text-anchor': 'start' }), 0.15, 0.5);
  // terms box
  const tx = left + 50, ty = top + 290, tw = Wd - 100, thh = 292;
  let tb = S.path(cham(tx, ty, tw, thh, 14), { fill: '#000', 'fill-opacity': 0.45, stroke: th.rim, 'stroke-width': 1.5, 'stroke-opacity': 0.5 });
  const pages = 4812, sc = ease.inOut(clamp(scroll, 0, 1)), page = Math.max(1, Math.round(1 + (pages - 1) * sc));
  tb += TF('TERMS & CONDITIONS', tx + 26, ty + 36, 20, th.label, { 'text-anchor': 'start', 'letter-spacing': 3 });
  tb += TL(`PAGE ${page.toLocaleString('en-US')} / ${pages.toLocaleString('en-US')}`, tx + tw - 64, ty + 38, 26, page > 1 ? '#FFD21F' : th.text, { 'text-anchor': 'end' });
  // scrolling text (pattern) inside a clip
  const rx = tx + 24, ry = ty + 54, rw = tw - 100, rh = thh - 72;
  const cid = S.uid('hdTc');
  const speed = scroll > 0.005 && scroll < 0.995 ? bumpK(clamp(scroll, 0, 1)) : 0;
  const off = mod(sc * 44 * 900, 44);
  let inner = '';
  if (scroll < 0.02) {   // page one, readable
    const l1 = ['1.1  Reality HUD shows the stats of everyone around you.', '1.2  To switch the HUD off, press the little X in the corner.', '1.3  Stats are not the whole truth. Results may vary.'];
    l1.forEach((l, i) => { inner += TF(l, rx, ry + 30 + i * 36 - sc * 2000, 20, i === 1 ? '#FFFFFF' : th.label, { 'text-anchor': 'start', opacity: i === 1 ? 0.9 : 0.75 }); });
    inner += S.g(S.rect(0, 0, rw, 120, 0, { fill: 'url(#hdText)' }), `translate(${f(rx)} ${f(ry + 118 - sc * 2000)})`);
  } else {
    inner += S.g(S.rect(0, -44, rw, rh + 120, 0, { fill: 'url(#hdText)' }), `translate(${f(rx)} ${f(ry - off)}) scale(1 ${f(1 + 2.5 * speed)})`);
    if (speed > 0.05) inner += S.rect(rx, ry, rw, rh, 0, { fill: th.rim, opacity: f(0.08 * speed) });
  }
  tb += S.clipDef(cid, S.rect(rx, ry, rw, rh)) + S.g(inner, null, { 'clip-path': `url(#${cid})` });
  // scrollbar: tiny thumb (4,812 pages) flying down, with a streak
  const sbx = tx + tw - 40, sby = ry, sbh = rh;
  tb += S.rect(sbx, sby, 14, sbh, 7, { fill: '#000', opacity: 0.5, stroke: th.rim, 'stroke-width': 1.2, 'stroke-opacity': 0.5 });
  const thY = sby + 2 + (sbh - 16) * sc;
  if (speed > 0.05) tb += S.rect(sbx + 3, Math.max(sby, thY - 120 * speed), 8, 120 * speed, 4, { fill: th.rim, opacity: f(0.4 * speed) });
  tb += S.rect(sbx + 1, thY, 12, 12, 4, { fill: '#FFFFFF', stroke: th.rim, 'stroke-width': 2 });
  c += cc(tb, 0.2, 0.6);
  // buttons / install
  const by = top + 660;
  if (install > 0) {
    const ik = ease.out(seg(install, 0, 0.12));
    const pct = Math.round(100 * ease.inOut(seg(install, 0.05, 0.95)));
    let ib = TL(pct >= 100 ? 'INSTALL COMPLETE' : 'INSTALLING... REALITY', left + 60, by - 22, 40, th.text, { 'text-anchor': 'start', ...outl(6, th.edge) });
    ib += TL(`${pct}%`, -left - 60, by - 22, 40, '#FFD21F', { 'text-anchor': 'end', ...outl(6, th.edge) });
    ib += segBar(left + 60, by - 2, Wd - 120, 30, pct / 100, th.rim, { th, t, cell: 26 });
    ib += R.spinner(left + 30, by - 34, 12, t, th.rim);
    c += S.g(ib, null, { opacity: f(ik) });
  } else {
    const btn = (bx, label, col, txtCol, pressK, glow) => {
      const bw = 330, bh = 82;
      const sq = 1 - 0.12 * bumpK(seg(pressK, 0, 0.35));
      let b = '';
      if (glow) b += S.path(cham(-bw / 2 - 10, -bh / 2 - 10, bw + 20, bh + 20, 22), { fill: 'none', stroke: col, 'stroke-width': 4, opacity: f(0.25 + 0.25 * Math.sin(t * 5)) });
      b += S.path(cham(-bw / 2 + 4, -bh / 2 + 7, bw, bh, 18), { fill: '#000', opacity: 0.3 }) + S.path(cham(-bw / 2, -bh / 2, bw, bh, 18), { fill: col, stroke: th.edge, 'stroke-width': 5 });
      b += S.path(`M${f(-bw / 2 + 24)} ${f(-bh / 2 + 10)}H${f(bw / 2 - 12)}`, ln(5, '#FFFFFF', 0.35));
      b += TL(label, 0, 15, 42, txtCol, label === 'ACCEPTED' ? {} : {});
      if (label === 'ACCEPTED') b += S.path(checkD(-bw / 2 + 44, 0, 18), ln(7, txtCol));
      const fl = seg(pressK, 0.15, 0.5);
      if (fl > 0 && fl < 1) b += S.path(cham(-bw / 2, -bh / 2, bw, bh, 18), { fill: '#FFFFFF', opacity: f(0.8 * (1 - fl)) });
      const rp = seg(pressK, 0.1, 0.75);
      if (rp > 0 && rp < 1) b += S.path(cham(-bw / 2 - 60 * rp, -bh / 2 - 40 * rp, bw + 120 * rp, bh + 80 * rp, 18 + 20 * rp), { fill: 'none', stroke: col, 'stroke-width': f(8 * (1 - rp)), opacity: f(1 - rp) });
      return S.g(b, `translate(${f(bx)} ${f(by)}) scale(${f(sq)})`);
    };
    const done = accept > 0.35;
    c += cc(btn(-200, 'DECLINE', '#2A3E4E', '#9FB6C6', 0, false) + btn(200, done ? 'ACCEPTED' : 'ACCEPT', done ? '#3DFF8F' : th.rim, th.edge, accept, !done), 0.35, 0.8);
  }
  if (kO < 1) c += S.path(cham(left, top, Wd, Hd, 30), { fill: '#FFFFFF', opacity: f(0.6 * (1 - seg(kO, 0.55, 1))) });
  let g = S.g(c, `scale(${f(uf.sx)} ${f(uf.sy)})`);
  if (uf.line > 0) g += S.path(`M${f(left * uf.sx)} 0H${f(-left * uf.sx)}`, ln(8, '#FFFFFF', uf.line));
  g = glitchWrap(g, t, glitch, 11, 14);
  let outS = S.g(g, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
  if (o.pointer) outS += require('./gameui').pointer(o.pointer.x, o.pointer.y, o.pointer.s ?? 1, o.pointer.press || 0);
  return outS;
}
// absolute centre of the ACCEPT button for a window drawn with the same x, y, s (aim a pointer at it)
const updateAcceptAt = ({ x = 960, y = 530, s = 1 } = {}) => [x + 200 * s, y + (-370 + 660) * s];

// bootSequence(t, t0, { dur = 3.4, k = 1, lines }) — full-frame "LOADING REALITY..." overlay over the (visible) room, starting at t0:
// scan beam + scanlines, the percent stalls at 37 and 99 then hits 100 at ~0.62·dur, boot log types in the bottom-left
// ("> self-scan ... ???"), white flash + "REALITY HUD v1.0 · ONLINE", the HUD frame assembles in the corners, overlay fades.
// It draws hudFrame() itself until t0 + dur; from then on draw H.hudFrame({ t }) yourself. Returns '' outside [t0, t0 + dur + 0.6].
const BOOT_LINES = ['> REALITY HUD v1.0', '> calibrating eyeballs ........ OK', '> scanning household .......... 4 FOUND', '> loading stats.dll ........... OK', '> spawning quests ............. OK', '> self-scan ................... ???'];
function bootSequence(t, t0, o = {}) {
  const dur = o.dur ?? 3.4, u = t - t0;
  if (u < 0 || u > dur + 0.6) return '';
  const th = theme('cyan');
  const p100 = dur * 0.62;
  const fade = seg(u, dur - 0.4, dur + 0.6);
  const vis = (1 - fade) * (o.k ?? 1);
  let g = '';
  g += S.rect(0, 0, W, H, 0, { fill: '#03121E', opacity: f(0.42 * vis) }) + S.rect(0, 0, W, H, 0, { fill: 'url(#hdScanD)', opacity: f(0.6 * vis) });
  // scan beams: boot sweep, then the reveal sweep at 100 %
  const beam = (v, op) => {
    if (v <= 0 || v >= 1) return '';
    const by = lerp(-40, H + 40, ease.inOut(v));
    let b = '';
    [[170, 0.05], [110, 0.06], [60, 0.08], [24, 0.12]].forEach(([hh, a]) => { b += S.rect(0, by - hh, W, hh, 0, { fill: '#3BE8FF', opacity: f(a * op) }); });
    return b + S.rect(0, by - 3, W, 6, 0, { fill: '#E8FFFF', opacity: f(op) });
  };
  g += beam(seg(u, 0, 0.7), 0.8 * vis) + beam(seg(u, p100, p100 + 0.6), 1);
  // centre: LOADING REALITY... + percent + bar
  const pct = Math.round(u < p100 ? (() => { const v = u / p100; return v < 0.3 ? lerp(0, 37, ease.out(v / 0.3)) : v < 0.42 ? 37 : v < 0.7 ? lerp(37, 84, ease.inOut((v - 0.42) / 0.28)) : v < 0.84 ? lerp(84, 99, ease.out((v - 0.7) / 0.14)) : 99; })() : 100);
  const online = u >= p100;
  const ck = seg(u, 0.1, 0.4);
  if (ck > 0 && vis > 0) {
    let c = '';
    if (!online) {
      const dots = '.'.repeat(1 + (Math.floor(u * 4) % 3));
      c += TL('LOADING REALITY' + dots, -330, -40, 76, th.text, { 'text-anchor': 'start', ...outl(9, th.edge) });
      c += TL(`${pct}%`, 0, 110, 120, pct >= 99 ? '#FFD21F' : th.rim, outl(11, th.edge));
      c += segBar(-380, 0, 760, 30, pct / 100, th.rim, { th, t, cell: 26 });
    } else {
      const ok = ease.outBack(seg(u, p100, p100 + 0.3));
      c += S.g(eyeLogo(-330, -60, 40, '#3DFF8F', t) + TL('REALITY HUD v1.0', -260, -40, 76, th.text, { 'text-anchor': 'start', ...outl(9, th.edge) }) + TL('ONLINE', 0, 70, 96, '#3DFF8F', outl(10, th.edge)) + S.path(checkD(-210, 38, 32), ln(12, '#3DFF8F')), `scale(${f(ok)})`);
    }
    g += S.g(c, `translate(960 ${f(470 + 30 * (1 - ease.out(ck)))})`, { opacity: f(ck * vis) });
  }
  // boot log (bottom-left)
  const lines = o.lines || BOOT_LINES;
  let lg = '';
  lines.forEach((l, i) => {
    const la = 0.15 + i * (p100 * 0.8 / lines.length);
    const lu = seg(u, la, la + 0.25);
    if (lu <= 0) return;
    const shown = l.slice(0, Math.ceil(l.length * lu));
    const last = i === lines.length - 1;
    lg += TF(shown, 70, 700 + i * 34, 24, last ? '#FFD21F' : i === 0 ? th.text : th.label, { 'text-anchor': 'start', 'font-family': 'Fredoka, monospace', ...outl(4, th.edge) });
  });
  g += S.g(lg, null, { opacity: f(vis) });
  // flash at 100 %
  const fl = seg(u, p100, p100 + 0.35);
  if (fl > 0 && fl < 1) g += S.rect(0, 0, W, H, 0, { fill: '#E8FFFF', opacity: f(0.55 * (1 - fl)) });
  if (u < dur) g += hudFrame({ t, k: seg(u, p100 + 0.05, p100 + 0.75), clock: o.clock });
  return g;
}

// hudFrame({ t, k, glitch, clock = '7:02 AM', day = 'MON', minimap = true, dots, quest, questSub, closeX = {} | false, theme, label })
// The persistent chrome while the HUD is ON: corner brackets, "REALITY HUD v1.0 · LIVE" (top-left), clock (top-right), the minimap
// radar with a sweep (people = dots, quests = yellow), an optional quest tracker and — subtle, top-right corner — the tiny X
// (closeX options: { highlight, press, hint }). k assembles it (~0.7 s). Screen space; draw it last (after the world, before captions).
function hudFrame(o = {}) {
  const { t = 0, k = 1, glitch = 0, clock = '7:02 AM', day = 'MON', minimap = true } = o;
  if (k <= 0) return '';
  const th = theme(o.theme || 'cyan');
  let g = '';
  // corner brackets fly in
  const corners = [[26, 26, 1, 1], [W - 26, 26, -1, 1], [26, H - 26, 1, -1], [W - 26, H - 26, -1, -1]];
  corners.forEach(([cx, cy, sx, sy], i) => {
    const ck = ease.outBack(seg(k, i * 0.07, 0.45 + i * 0.07));
    if (ck <= 0) return;
    const ox = -sx * 180 * (1 - ck), oy = -sy * 180 * (1 - ck), L = 92;
    const d = `M${f(cx + ox)} ${f(cy + oy + sy * L)}V${f(cy + oy)}H${f(cx + ox + sx * L)}`;
    let ticks = '';
    for (let j = 1; j <= 3; j++) ticks += `M${f(cx + ox + sx * (L + 10 + j * 12))} ${f(cy + oy)}h${f(sx * 6)}M${f(cx + ox)} ${f(cy + oy + sy * (L + 10 + j * 12))}v${f(sy * 6)}`;
    g += S.path(d, { fill: 'none', stroke: th.edge, 'stroke-width': 10, 'stroke-linecap': 'square', opacity: 0.6 }) + S.path(d, { fill: 'none', stroke: th.rim, 'stroke-width': 5, 'stroke-linecap': 'square' }) + S.path(ticks, ln(3, th.rim, 0.7));
  });
  const lk = seg(k, 0.25, 0.75);
  if (lk > 0) {
    // top-left: logo + label + LIVE
    const lbl = String(o.label || 'REALITY HUD');
    let tl = eyeLogo(66, 66, 15, th.rim, t) + TL(glitch > 0 ? scramble(lbl, t, glitch, 3) : lbl, 98, 76, 30, th.text, { 'text-anchor': 'start', ...outl(5, th.edge) });
    const lx = 98 + TW(lbl, 30, 'L') + 10;
    tl += TF('v1.0', lx, 76, 17, th.label, { 'text-anchor': 'start', ...outl(4, th.edge) });
    const rec = Math.floor(t * 1.6) % 2 === 0;
    tl += S.circle(108, 100, 6, { fill: rec ? '#FF3355' : '#5A1424', stroke: th.edge, 'stroke-width': 2 }) + TF('LIVE', 120, 106, 15, th.label, { 'text-anchor': 'start', 'letter-spacing': 2, ...outl(3.5, th.edge) });
    for (let i = 0; i < 4; i++) tl += S.rect(170 + i * 9, 106 - 6 - i * 4, 6, 6 + i * 4, 1, { fill: th.rim, stroke: th.edge, 'stroke-width': 1.5, opacity: i < 3 ? 1 : 0.35 });
    // top-right: clock pill
    const cw = TW(clock, 30, 'L') + TW(day, 15, 'F', 2) + 46;
    let tr_ = panel(1832 - cw, 28, cw, 46, th, { c: 10, br: 12, shadow: false, scan: false });
    tr_ += TF(day, 1832 - cw + 18, 57, 15, th.label, { 'text-anchor': 'start', 'letter-spacing': 2 }) + TL(clock, 1818, 62, 30, th.text, { 'text-anchor': 'end' });
    g += S.g(tl + tr_, null, { opacity: f(lk) });
  }
  // minimap radar
  if (minimap) {
    const mk = ease.outBack(seg(k, 0.35, 0.85));
    if (mk > 0) {
      const mx = 1752, my = 176, r = 74;
      let m = S.circle(0, 0, r, { fill: th.glass, 'fill-opacity': th.op, stroke: th.edge, 'stroke-width': 7 }) + S.circle(0, 0, r - 5, { fill: 'none', stroke: th.rim, 'stroke-width': 2.5 });
      m += S.circle(0, 0, r * 0.62, { fill: 'none', stroke: th.rim, 'stroke-width': 1.2, opacity: 0.4 }) + S.circle(0, 0, r * 0.3, { fill: 'none', stroke: th.rim, 'stroke-width': 1.2, opacity: 0.4 });
      m += S.path(`M${-r + 8} 0H${r - 8}M0 ${-r + 8}V${r - 8}`, ln(1.2, th.rim, 0.35));
      const sa = t * 2.2, sw = 0.9;
      m += S.path(`M0 0L${f(Math.cos(sa - sw) * (r - 6))} ${f(Math.sin(sa - sw) * (r - 6))}A${r - 6} ${r - 6} 0 0 1 ${f(Math.cos(sa) * (r - 6))} ${f(Math.sin(sa) * (r - 6))}Z`, { fill: th.rim, opacity: 0.2 }) + S.path(`M0 0L${f(Math.cos(sa) * (r - 6))} ${f(Math.sin(sa) * (r - 6))}`, ln(2.5, th.rim, 0.8));
      const dots = o.dots || [[-0.4, -0.3, '#FFD21F'], [0.35, -0.5, '#FFFFFF'], [0.55, 0.2, '#FFFFFF'], [-0.2, 0.5, '#FF4D66'], [0.1, -0.15, '#FFFFFF']];
      dots.forEach(([dx, dy, col], i) => {
        const a = Math.atan2(dy, dx), d = Math.hypot(dx, dy);
        const lit = 0.45 + 0.55 * Math.max(0, Math.cos(mod(sa - a, Math.PI * 2)) ** 6);
        m += S.circle(dx * (r - 14) + Math.sin(t * 0.7 + i) * 3, dy * (r - 14), col === '#FFD21F' ? 6 : 4.5, { fill: col, stroke: th.edge, 'stroke-width': 2, opacity: f(lit) });
        if (d < 0) m += '';
      });
      m += S.path('M0 -11L8 8L0 3L-8 8Z', { fill: th.rim, stroke: th.edge, 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
      m += TF('N', 0, -r + 20, 13, th.label);
      g += S.g(m, `translate(${mx} ${my}) scale(${f(mk)})`);
    }
  }
  // quest tracker under the minimap
  if (o.quest) {
    const qk = seg(k, 0.5, 1);
    const qw = Math.max(250, TW(o.quest, 26, 'L') + 70);
    let q = panel(1832 - qw, 268, qw, o.questSub ? 82 : 58, theme('gold'), { c: 10, br: 12, shadow: false });
    q += S.path(diamondD(1832 - qw + 24, 297, 9, 11), { fill: '#FFD21F', stroke: '#120A00', 'stroke-width': 2 });
    q += TL(glitch > 0 ? scramble(o.quest, t, glitch, 5) : o.quest, 1832 - qw + 42, 306, 26, '#FFF8E6', { 'text-anchor': 'start' });
    if (o.questSub) q += TF(glitch > 0 ? scramble(o.questSub, t, glitch, 6) : o.questSub, 1832 - qw + 42, 334, 17, '#FFD07A', { 'text-anchor': 'start', 'letter-spacing': 1 });
    g += S.g(q, `translate(${f(60 * (1 - ease.out(qk)))} 0)`, { opacity: f(qk) });
  }
  if (o.closeX !== false) g += closeX({ t, k: seg(k, 0.6, 1), ...(o.closeX || {}) });
  return glitch > 0 ? hudGlitch(g, t, glitch, { seed: 21 }) : g;
}

// systemMsg({ k, t, text, sub, theme 'info' | 'warn' | 'error' | 'ok' | 'off', icon, x = 960, y = 130, s, out, glitch, type, w })
// The SYSTEM voice as a HUD pop-up ("Installing... reality.", "Warning. Too many players. HUD overload.", "Pet stats enabled.",
// "Reality HUD... off."). k 0..1 (~0.5 s) unfolds it; `type` 0..1 types the text (default follows k); out folds it away.
const SYS = { info: ['cyan', 'info'], warn: ['warn', 'warn'], error: ['error', 'warn'], ok: ['green', 'check'], off: ['cold', 'power'] };
function systemMsg(o = {}) {
  const { k = 1, t = 0, x = 960, y = 130, s = 1, out = 0, glitch = 0 } = o;
  if (k <= 0 || out >= 1) return '';
  const [thn, ic] = SYS[o.theme || 'info'] || SYS.info;
  const th = theme(thn);
  const text = String(o.text || 'SYSTEM MESSAGE');
  const TS = 46;
  const Wd = Math.max(o.w || 0, 480, 130 + TW(text, TS, 'L') + 44, o.sub ? 130 + TW(o.sub, 24, 'F') + 44 : 0), Hd = o.sub ? 122 : 92;
  const left = -Wd / 2, top = -Hd / 2;
  const kO = seg(k, 0, 0.6), kC = seg(k, 0.4, 1), uf = unfold(kO);
  let c = panel(left, top, Wd, Hd, th, { c: 18, br: 24 });
  if (thn === 'warn' || thn === 'error') c += S.path(para(left + 8, top + 8, 26, Hd - 16, 0), { fill: th.rim, opacity: 0.9 }) + S.path(para(left + 8, top + 8, 26, Hd - 16, 0), { fill: 'url(#hdHaz)' });
  c += sheen(left + 6, top + 4, Wd - 12, Hd - 8, t, 3.4, 13);
  // SYSTEM tab
  c += S.path(para(left + 30, top - 18, 150, 30, 8), ol(th.rim, 3.5, th.edge)) + S.path(diamondD(left + 52, top - 3, 6, 8), { fill: th.edge }) + TF('SYSTEM', left + 112, top + 4, 17, th.edge, { 'letter-spacing': 4 });
  // icon
  const ix = left + 76, alarm = (thn === 'warn' || thn === 'error') && Math.floor(t * 4) % 2 === 0;
  c += S.circle(ix, 0, 32, ol(th.edge, 4, th.rim)) + icon(o.icon || ic, ix, 0, 26, alarm ? '#FFFFFF' : th.rim, t);
  const ty = seg(o.type ?? kC, 0, 1);
  let tt = text.slice(0, Math.ceil(text.length * ty));
  if (glitch > 0) tt = scramble(tt, t, glitch, 7);
  if (tt) c += TL(tt, left + 128, (o.sub ? -4 : 16), TS, th.text, { 'text-anchor': 'start', ...outl(6, th.edge) });
  if (ty > 0 && ty < 1) c += S.rect(left + 132 + TW(tt, TS, 'L'), (o.sub ? -40 : -20), 14, 40, 2, { fill: th.rim, opacity: f(Math.floor(t * 8) % 2 ? 1 : 0.3) });
  if (o.sub) c += TF(glitch > 0 ? scramble(o.sub, t, glitch, 8) : o.sub, left + 130, 38, 24, th.label, { 'text-anchor': 'start', opacity: f(seg(kC, 0.5, 1)) });
  if (kO < 1) c += S.path(cham(left, top, Wd, Hd, 18), { fill: '#FFFFFF', opacity: f(0.7 * (1 - seg(kO, 0.55, 1))) });
  let g = S.g(c, `scale(${f(uf.sx)} ${f(uf.sy * (1 - out))})`);
  if (uf.line > 0 || out > 0) g += S.path(`M${f(left * uf.sx)} 0H${f(-left * uf.sx)}`, ln(6, '#FFFFFF', Math.max(uf.line, out < 1 ? bumpK(out) : 0)));
  g = glitchWrap(g, t, glitch, 15, 12);
  return S.g(g, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

// bossBar({ k, t, name = 'MRS. KRUMP', sub = 'LV 99 · FINAL BOSS', value = 1, from, roll, trail, hit, x = 960, y = 96, w = 1000, s })
// Top-of-frame boss health bar in the HUD style (red, skull hexagon, hazard notch). hit 0..1 = flash + shake.
function bossBar(o = {}) {
  const { k = 1, t = 0, x = 960, y = 96, w = 1000, s = 1 } = o;
  if (k <= 0) return '';
  const th = theme('boss');
  const name = String(o.name || 'MRS. KRUMP').toUpperCase(), sub = o.sub ?? 'LV 99 · FINAL BOSS';
  let v = clamp(o.value ?? 1, 0, 1), trail = o.trail, ghost;
  if (o.roll !== undefined) { const rp = rollPair(o.from ?? 1, v, clamp(o.roll, 0, 1)); if (v < (o.from ?? 1)) { v = rp.fast; trail = rp.slow; } else { ghost = rp.fast; v = rp.slow; } }
  const Hd = 100, left = -w / 2, top = -Hd / 2;
  const hit = o.hit || 0, sh = hit > 0 && hit < 1 ? (hash(Math.floor(t * 40)) - 0.5) * 16 * (1 - hit) : 0;
  let c = panel(left, top, w, Hd, th, { c: 18, br: 24 });
  c += S.path(`M${f(left + 40)} ${f(top + 5)}H${f(-left - 40)}`, { stroke: 'url(#hdHaz)', 'stroke-width': 0 });
  c += S.path(hexD(left + 56, 0, 40), ol('#C8102E', 5, th.edge)) + skullIcon(left + 56, 2, 24, '#FFF6D8', '#C8102E');
  c += TL(name, left + 110, top + 44, 36, th.text, { 'text-anchor': 'start', ...outl(5, th.edge) });
  if (sub) c += richText(sub, -left - 26, top + 40, 20, '#FF9DAD', 'F', 'end', { 'letter-spacing': 2 });
  c += segBar(left + 110, top + 58, w - 140, 24, v, '#FF3355', { th, t, cell: 24, trail, ghost });
  if (hit > 0 && hit < 1) c += S.path(cham(left, top, w, Hd, 18), { fill: '#FFFFFF', opacity: f(0.7 * (1 - hit)) });
  const kk = ease.outBack(seg(k, 0, 1));
  return S.g(c, `translate(${f(x + sh)} ${f(y - 160 * (1 - kk))}) scale(${f(s)})`, k < 0.3 ? { opacity: f(k / 0.3) } : {});
}

// pixelBurst({ x, y, age, n = 60 (<= 80), seed, spread, cols, dur = 1.2 }) — the update's pixels fly OUT of the screen into the room
// (they grow as they come at the camera) — SC03 "the screen flashes, pixels fly into the room".
function pixelBurst(o = {}) {
  const { x = 960, y = 540, age = 0, seed = 1, spread = 1, dur = 1.2 } = o;
  if (age < 0 || age > dur) return '';
  const n = Math.min(80, o.n ?? 60);
  const cols = o.cols || ['#3BE8FF', '#FFFFFF', '#7FF4FF', '#FFD21F', '#3BE8FF'];
  const byCol = {};
  for (let i = 0; i < n; i++) {
    const d0 = hash(i * 0.37 + seed) * 0.25;
    const u = (age - d0) / (dur - d0);
    if (u <= 0 || u >= 1) continue;
    const a = hash(i * 1.7 + seed) * Math.PI * 2, v = (500 + 1300 * hash(i * 2.9 + seed)) * spread;
    const e = ease.out(u);
    const px = x + Math.cos(a) * v * e, py = y + Math.sin(a) * v * e * 0.75 + 200 * u * u;
    const sz = 6 + 34 * u * u * (0.5 + hash(i * 4.4 + seed));
    const c = cols[i % cols.length];
    byCol[c] = (byCol[c] || '') + `M${f(px - sz / 2)} ${f(py - sz / 2)}h${f(sz)}v${f(sz)}h${f(-sz)}Z`;
  }
  let g = '';
  const op = 1 - seg(age, dur * 0.6, dur);
  for (const c in byCol) g += S.path(byCol[c], { fill: c, stroke: '#020C16', 'stroke-width': 2, opacity: f(op) });
  if (age < 0.2) g += S.circle(x, y, 40 + 300 * (age / 0.2), { fill: '#E8FFFF', opacity: f(0.8 * (1 - age / 0.2)) });
  return g;
}


// ================================================================= 7. OVERLOAD + OFF
const FLOOD_TXT = ['LV 12', 'LV 40', 'LV 8', '47', 'HP 80/100', '+5 XP', 'INT 95', 'LV 61', '999', 'LV 27', 'STR 44', '88%', 'LV 73', '–12', 'LV 5',
  'LUCK 7', 'LV 34', '100', 'LV 2', 'HP 3/9', 'LV 56', '???', 'LV 90', 'LV 19', '+20', 'SPD 31', 'LV 3', '64%', 'LV 77', 'LV 14', '9999', 'LV 1',
  'HP 51/100', 'LV 48', '–50', 'LV 66', 'XP', 'LV 21', '33', 'LV 99', 'LV 7', '12%', 'HP 9/10', 'LV 45', '+1'];
const FLOOD_COL = ['#3BE8FF', '#FFFFFF', '#FFD21F', '#FF4D66', '#7FF4FF', '#3DFF8F', '#FFFFFF', '#3BE8FF'];
// numbersFlood({ t, k, seed, faces: [{ x, y, r }], n = 90, tint = true, rect: [x, y, w, h] }) — SC08: numbers and mini plates swarm the frame;
// k 0..1 = how many (they pop in in a stable order, drift, jitter harder as k rises). Every face gets up to 3 opaque plates
// SLAMMED onto it (at k ≈ .22 / .42 / .62 + .04·i) so the faces disappear. k > .5: red edge pulse + static bars. ≤ 120 text items.
function numbersFlood(o = {}) {
  const { t = 0, k = 0, seed = 1, faces = [], tint = true } = o;
  if (k <= 0) return '';
  const [rx, ry, rw, rh] = o.rect || [0, 0, W, H];
  const n = Math.min(90, o.n ?? 80);
  let g = '';
  if (tint) g += S.rect(rx, ry, rw, rh, 0, { fill: '#040A12', opacity: f(0.3 * k) }) + S.rect(rx, ry, rw, rh, 0, { fill: 'url(#hdScanD)', opacity: f(0.5 * k) });
  const jit = k > 0.6 ? (k - 0.6) / 0.4 : 0, st = Math.floor(t * 20);
  for (let i = 0; i < n; i++) {
    const th_ = (i / n) * 0.9 + hash(i * 1.31 + seed) * 0.08;
    const a = seg(k, th_, th_ + 0.06);
    if (a <= 0) continue;
    const px = rx + hash(i * 3.7 + seed) * rw + Math.sin(t * 0.6 + i) * 20 * (1 + k) + (hash(st + i * 1.9) - 0.5) * 10 * jit;
    const py = ry + 30 + hash(i * 5.9 + seed) * (rh - 60) + Math.cos(t * 0.5 + i * 1.7) * 14 * (1 + k) + (hash(st * 1.3 + i) - 0.5) * 8 * jit;
    const sz = (24 + hash(i * 2.2 + seed) * 58) * (0.7 + 0.5 * k);
    const sc = ease.outBack(a);
    const txt = FLOOD_TXT[Math.floor(hash(i * 4.4 + seed) * FLOOD_TXT.length)];
    const col = FLOOD_COL[Math.floor(hash(i * 6.1 + seed) * FLOOD_COL.length)];
    if (hash(i * 7.3 + seed) < 0.26) {   // a little plate
      const pw = TW(txt, sz * 0.6, 'L') + 34, ph = sz * 0.6 + 22;
      g += S.g(S.path(cham(-pw / 2, -ph / 2, pw, ph, 8), { fill: '#061624', 'fill-opacity': 0.85, stroke: '#020C16', 'stroke-width': 4 }) + S.path(cham(-pw / 2 + 3, -ph / 2 + 3, pw - 6, ph - 6, 6), { fill: 'none', stroke: col, 'stroke-width': 2 }) +
        TL(txt, 0, sz * 0.21, sz * 0.6, col), `translate(${f(px)} ${f(py)}) scale(${f(sc)})`);
    } else {
      const rot = i % 3 === 0 ? (hash(i * 8.8 + seed) - 0.5) * 18 : 0;   // rotated text rasterizes slower: only every 3rd
      g += S.g(TL(txt, 0, sz * 0.35, sz, col, outl(Math.max(4, sz * 0.11), '#020C16')), `translate(${f(px)} ${f(py)})${sc !== 1 ? ` scale(${f(sc)})` : ''}${rot ? ` rotate(${f(rot)})` : ''}`);
    }
  }
  // plates slammed onto faces
  faces.slice(0, 10).forEach((fc, fi) => {
    for (let j = 0; j < 3; j++) {
      const thr = 0.22 + j * 0.2 + fi * 0.04, a = seg(k, thr, thr + 0.05);
      if (a <= 0) continue;
      const r = fc.r || 60, pw = r * 2.5, ph = r * 1.45;
      const lvl = 2 + Math.floor(hash(fi * 3.3 + j + seed) * 88);
      const sc = lerp(1.7, 1, ease.out(a)), rot = (hash(fi * 5.1 + j * 2.3 + seed) - 0.5) * 18;
      const dx = (hash(fi * 2.7 + j) - 0.5) * r * 0.5, dy = (j - 1) * r * 0.22;
      let p = S.path(cham(-pw / 2, -ph / 2, pw, ph, r * 0.2), { fill: '#061624', 'fill-opacity': 0.96, stroke: '#020C16', 'stroke-width': 5 });
      p += S.path(cham(-pw / 2 + 4, -ph / 2 + 4, pw - 8, ph - 8, r * 0.18), { fill: 'none', stroke: j === 2 ? '#FF4D66' : '#3BE8FF', 'stroke-width': 3 });
      p += TL(`LV ${lvl}`, 0, r * 0.12, r * 0.62, '#FFFFFF', outl(r * 0.08, '#020C16'));
      p += segBar(-pw / 2 + r * 0.25, r * 0.3, pw - r * 0.5, r * 0.18, hash(fi + j * 7), j === 2 ? '#FF3355' : '#3DFF8F', { t, cell: r * 0.22 });
      if (a < 1) p += S.path(cham(-pw / 2, -ph / 2, pw, ph, r * 0.2), { fill: '#FFFFFF', opacity: f(0.8 * (1 - a)) });
      g += S.g(p, `translate(${f(fc.x + dx)} ${f(fc.y + dy)}) rotate(${f(rot)}) scale(${f(sc)})`);
    }
  });
  if (k > 0.5) {
    const e = (k - 0.5) * 2 * (0.6 + 0.4 * Math.sin(t * 10));
    g += edgePulse(rx, ry, rw, rh, e);
    let d = '';
    const nb = Math.floor(8 * (k - 0.5) * 2);
    for (let i = 0; i < nb; i++) d += `M${f(rx + hash(st * 0.7 + i * 3) * rw - 200)} ${f(ry + hash(st * 1.1 + i * 5) * rh)}h${f(150 + hash(i + st) * 500)}v${f(3 + hash(i * 2 + st) * 6)}h${f(-650)}Z`;
    if (d) g += S.path(d, { fill: '#FFFFFF', opacity: 0.55 });
  }
  return g;
}

// red alarm light on the 4 frame edges: nested frame-shaped paths (solid fills, no gradients)
function edgePulse(x, y, w, h, e, col = '#FF2E4E') {
  if (e <= 0) return '';
  let o = '';
  [[150, 0.12], [90, 0.14], [45, 0.18], [16, 0.25]].forEach(([d, a]) => {
    o += S.path(`M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z M${f(x + d)} ${f(y + d)}v${f(h - 2 * d)}h${f(w - 2 * d)}v${f(-(h - 2 * d))}Z`, { fill: col, opacity: f(a * e), 'fill-rule': 'evenodd' });
  });
  return o;
}
// hudGlitch(svg, t, k = 0.5, { seed, drop = true, x, y, w, h }) — glitch any HUD layer: horizontal slice offsets, RGB split, jitter,
// coloured scan bars and (drop) whole-frame dropouts at high k. ~2-3x the cost of the wrapped svg while glitching.
function hudGlitch(svg, t, k = 0.5, o = {}) {
  if (!(k > 0) || !svg) return svg;
  const seed = o.seed ?? 4, st = Math.floor(t * 15);
  if (o.drop !== false && hash(st * 1.37 + seed) < k * 0.16) return '';
  let out = R.glitchSlices(svg, t, Math.min(1, k * 1.2), seed, { x: o.x ?? 0, y: o.y ?? 0, w: o.w ?? W, h: o.h ?? H, maxDx: 30 + 80 * k, bars: false });
  out = glitchWrap(out, t, k, seed, 14);
  let d = '';
  for (let i = 0; i < Math.round(4 * k); i++) if (hash(st * 2.1 + i * 7 + seed) < 0.5) d += `M0 ${f(hash(st + i * 3.3 + seed) * H)}h${W}v${f(2 + hash(i + st) * 5)}h-${W}Z`;
  if (d) out += S.path(d, { fill: hash(st + seed) > 0.5 ? '#2EE6FF' : '#FF2E9A', opacity: f(0.45 * k) });
  return out;
}

// closeX({ x = 1868, y = 50, k, t, highlight 0..1, press 0..1, s, hint = true }) — the tiny X in the top-right corner that nobody ever
// noticed. Subtle by default (small, half transparent). highlight: it grows, a yellow ring pulses, chevrons point at it and (hint) a
// "CLOSE HUD" chip appears (Grandpa: "What's that little X up in the corner?"). press: pushed in, turns red, flash + ripple.
function closeX(o = {}) {
  const { x = 1868, y = 50, k = 1, t = 0, highlight = 0, press = 0, s = 1 } = o;
  if (k <= 0) return '';
  const hl = clamp(highlight, 0, 1), pr = clamp(press, 0, 1);
  const th = theme('cyan');
  const sc = (1 + 1.2 * ease.out(hl) + 0.07 * Math.sin(t * 7) * hl) * (1 - 0.18 * bumpK(seg(pr, 0, 0.35)));
  const red = pr > 0.2;
  let g = '';
  if (hl > 0) {
    const pu = mod(t * 1.4, 1);
    g += S.circle(0, 0, 26 + 40 * pu, { fill: 'none', stroke: '#FFD21F', 'stroke-width': f(5 * (1 - pu)), opacity: f(hl * (1 - pu)) });
    g += S.circle(0, 0, 30, { fill: 'none', stroke: '#FFD21F', 'stroke-width': 4, opacity: f(hl) });
    for (let i = 0; i < 3; i++) {   // chevrons pointing at it from the lower left
      const u = mod(t * 1.6 + i / 3, 1), d = 92 - 34 * u;
      g += S.path(`M${f(-d * 0.7 - 10)} ${f(d * 0.7 - 14)}L${f(-d * 0.7 + 4)} ${f(d * 0.7 + 4)}L${f(-d * 0.7 - 16)} ${f(d * 0.7 + 12)}`, { ...ln(6, '#FFD21F', hl * bumpK(u)) });
    }
  }
  let b = S.path(cham(-15, -15, 30, 30, 7), { fill: red ? '#C8102E' : th.glass, 'fill-opacity': red ? 1 : 0.85, stroke: th.edge, 'stroke-width': 4 });
  b += S.path(cham(-12, -12, 24, 24, 5), { fill: 'none', stroke: red ? '#FFB3C0' : th.rim, 'stroke-width': 1.8 });
  b += S.path('M-6 -6L6 6M6 -6L-6 6', ln(3.6, red ? '#FFFFFF' : th.text));
  const fl = seg(pr, 0.1, 0.45);
  if (fl > 0 && fl < 1) b += S.path(cham(-15, -15, 30, 30, 7), { fill: '#FFFFFF', opacity: f(1 - fl) });
  g += S.g(b, `scale(${f(sc)})`, { opacity: f(lerp(0.55, 1, Math.max(hl, pr > 0 ? 1 : 0))) });
  const rp = seg(pr, 0.1, 0.8);
  if (rp > 0 && rp < 1) g += S.circle(0, 0, 20 + 120 * ease.out(rp), { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(10 * (1 - rp)), opacity: f(1 - rp) });
  if (o.hint !== false && hl > 0.4) {
    const hk = ease.outBack(seg(hl, 0.4, 1));
    const cw = 170;
    g += S.g(panel(-cw, -22, cw, 44, theme('gold'), { c: 9, br: 12, shadow: false }) + TL('CLOSE HUD?', -cw / 2, 10, 24, '#FFF8E6') + S.path('M4 -10L18 0L4 10Z', ol('#FFD21F', 3, '#120A00')), `translate(${f(-34 - 26 * hl)} 0) scale(${f(hk)})`);
  }
  return S.g(g, `translate(${f(x)} ${f(y)}) scale(${f(s * ease.outBack(clamp(k, 0, 1)))})`);
}

// hudShatter({ age, svg, cx = 1868, cy = 50, seed = 1, cols, rows }) — the whole HUD breaks like glass from the X and falls away.
// 0-0.25 s: impact flash + a crack web spreading from (cx, cy) over the frame; from 0.25 s shards (nearest first) fall, spin and
// fade by ~1.7 s; glints; '' after 2.2 s -> clean silence. Pass the HUD layer as `svg` to shatter the HUD ITSELF (each shard clips
// it; 5x3 grid = 30 shards) and stop drawing the HUD yourself from age 0; without `svg` it's a glass-only layer (8x5 = 80 shards)
// to put over the HUD while you fade it out at ~0.25 s.
const _shardCache = {};
function shards(seed, cols, rows) {
  const key = `${seed}|${cols}|${rows}`;
  if (_shardCache[key]) return _shardCache[key];
  const P = [];
  for (let r = 0; r <= rows; r++) {
    P.push([]);
    for (let c = 0; c <= cols; c++) {
      const jx = c > 0 && c < cols ? (hash(r * 13.1 + c * 7.7 + seed) - 0.5) * 0.7 : 0, jy = r > 0 && r < rows ? (hash(r * 5.3 + c * 11.9 + seed) - 0.5) * 0.7 : 0;
      P[r].push([(c + jx) / cols * W, (r + jy) / rows * H]);
    }
  }
  const out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const a = P[r][c], b = P[r][c + 1], d = P[r + 1][c], e = P[r + 1][c + 1];
    const tris = hash(r * 3.1 + c * 1.7 + seed) > 0.5 ? [[a, b, e], [a, e, d]] : [[a, b, d], [b, e, d]];
    for (const tri of tris) out.push({ pts: tri, c: [(tri[0][0] + tri[1][0] + tri[2][0]) / 3, (tri[0][1] + tri[1][1] + tri[2][1]) / 3], i: out.length });
  }
  // unique edges (for the crack web): grid edges + each cell's diagonal
  const edges = [];
  for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) {
    if (c < cols) edges.push([P[r][c], P[r][c + 1]]);
    if (r < rows) edges.push([P[r][c], P[r + 1][c]]);
    if (r < rows && c < cols) edges.push(hash(r * 3.1 + c * 1.7 + seed) > 0.5 ? [P[r][c], P[r + 1][c + 1]] : [P[r][c + 1], P[r + 1][c]]);
  }
  out.edges = edges.map(([a, b]) => ({ a, b, m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }));
  _shardCache[key] = out;
  return out;
}
function hudShatter(o = {}) {
  const { age = 0, svg = null, cx = 1868, cy = 50, seed = 1 } = o;
  if (age < 0 || age > 2.2) return '';
  const cols = o.cols ?? (svg ? 5 : 6), rows = o.rows ?? (svg ? 3 : 4);
  const SH = shards(seed, cols, rows);
  const maxD = Math.hypot(W, H);
  let g = '', srcId = null;
  if (svg) { srcId = S.uid('hdShs'); g += `<defs><g id="${srcId}">${svg}</g></defs>`; }
  const crackR = ease.out(seg(age, 0, 0.28)) * maxD * 1.05;
  // crack web: shard edges near the impact + jagged radial lines
  if (age < 0.6) {
    // (long strokes are the expensive thing in this rasterizer: unique edges only, one pass, short radial cracks)
    let d = '';
    for (const e of SH.edges) {
      if (Math.hypot(e.m[0] - cx, e.m[1] - cy) > crackR) continue;
      d += `M${f(e.a[0])} ${f(e.a[1])}L${f(e.b[0])} ${f(e.b[1])}`;
    }
    let dr = '';
    for (let i = 0; i < 8; i++) {
      const a = Math.PI * 0.5 + (i / 7) * Math.PI * 0.6 + (hash(i + seed) - 0.5) * 0.15;
      dr += `M${f(cx)} ${f(cy)}`;
      for (let j = 1; j <= 4; j++) {
        const L = Math.min(crackR, 700) * (j / 4);
        const aj = a + (hash(i * 7 + j + seed) - 0.5) * 0.35;
        dr += `L${f(cx + Math.cos(aj) * L)} ${f(cy + Math.sin(aj) * L)}`;
      }
    }
    const op = 1 - seg(age, 0.3, 0.6);
    if (svg && age < 0.25) g += `<use href="#${srcId}"/>`;
    g += S.path(d + dr, { fill: 'none', stroke: '#E8FFFF', 'stroke-width': 2.6, 'stroke-opacity': f(0.95 * op) }) + S.path(dr, { fill: 'none', stroke: '#020C16', 'stroke-width': 5, 'stroke-opacity': f(0.4 * op) });
    g += S.circle(cx, cy, 40 + 260 * seg(age, 0, 0.2), { fill: '#FFFFFF', opacity: f(0.85 * (1 - seg(age, 0, 0.2))) });
  }
  // falling shards
  if (age >= 0.22) {
    for (const sh of SH) {
      const dist = Math.hypot(sh.c[0] - cx, sh.c[1] - cy);
      const u = age - (0.22 + (dist / maxD) * 0.5);
      if (u > 1.6) continue;
      let tf = '';
      let fade = 1;
      if (u > 0) {
        const dx = (sh.c[0] - cx) / (dist || 1), dy = (sh.c[1] - cy) / (dist || 1);
        const v = 120 + 260 * hash(sh.i * 3.7 + seed);
        const mx = dx * v * u + (hash(sh.i * 1.3 + seed) - 0.5) * 120 * u, my = dy * v * u * 0.5 - 140 * u + 0.5 * 2600 * u * u;
        const rot = (hash(sh.i * 5.9 + seed) - 0.5) * 420 * u, scl = 1 + 0.12 * Math.min(u, 0.35);
        tf = `translate(${f(sh.c[0] + mx)} ${f(sh.c[1] + my)}) rotate(${f(rot)}) scale(${f(scl)}) translate(${f(-sh.c[0])} ${f(-sh.c[1])})`;
        fade = 1 - seg(u, 0.45, 1.05);
        if (sh.c[1] + my > H + 600 || fade <= 0) continue;
      } else if (!svg) continue;   // glass-only: intact shards are invisible (the HUD itself is still drawn under the cracks)
      const pts = sh.pts.map((p) => `${f(p[0])},${f(p[1])}`).join(' ');
      let s_ = '';
      if (svg) {
        const cid = S.uid('hdShc');
        s_ += S.clipDef(cid, S.el('polygon', { points: pts })) + S.g(`<use href="#${srcId}"/>`, null, { 'clip-path': `url(#${cid})` });
      }
      // fade on the elements themselves (group opacity = an offscreen layer per shard: twice the cost)
      // glass tint + a bright highlight on two of the three edges (full outlines on every shard cost too much stroke)
      const [p0, p1, p2] = sh.pts;
      s_ += S.el('polygon', { points: pts, fill: '#BFF8FF', 'fill-opacity': f((svg ? 0.1 : 0.16) * fade) }) +
        S.path(`M${f(p2[0])} ${f(p2[1])}L${f(p0[0])} ${f(p0[1])}L${f(p1[0])} ${f(p1[1])}`, { fill: 'none', stroke: '#E8FFFF', 'stroke-width': 2.5, 'stroke-opacity': f(0.85 * fade), 'stroke-linejoin': 'round' });
      g += S.g(s_, tf || null);
    }
    // glints
    let d = '';
    for (let i = 0; i < 10; i++) {
      const u = seg(age, 0.3 + hash(i * 2.2 + seed) * 0.6, 0.6 + hash(i * 2.2 + seed) * 0.6);
      if (u <= 0 || u >= 1) continue;
      d += star4(hash(i * 3.3 + seed) * W, hash(i * 4.7 + seed) * H * 0.8 + u * 200, 18 * bumpK(u), u * 90);
    }
    if (d) g += S.path(d, { fill: '#FFFFFF' });
  }
  return g;
}

// ================================================================= 8. MONTAGE HELPERS
// sortByStrength({ k, t, players: [{ name, str }], sort 0..1, pick (number of rows picked, fractional = the next one slamming), press 0..1,
// highlight (a name), x = 960, y = 520, s, title = 'DODGEBALL · PICK TEAM' }) — the team list: SORT BY STRENGTH button, rows slide into
// strength order (sort), picked rows get a green PICKED check one by one.
const DEFAULT_PLAYERS = [{ name: 'KYLE', str: 41 }, { name: 'PRIYA', str: 72 }, { name: 'BENJI', str: 4 }, { name: 'QUIET KID', str: 85 }, { name: 'MARCUS', str: 63 }, { name: 'ZOE', str: 58 }];
function sortByStrength(o = {}) {
  const { k = 1, t = 0, sort = 0, pick = 0, press = 0, x = 960, y = 520, s = 1 } = o;
  if (k <= 0) return '';
  const th = theme('cyan');
  const players = o.players || DEFAULT_PLAYERS;
  const n = players.length;
  const order = players.map((p, i) => i).sort((a, b) => players[b].str - players[a].str);
  const rank = []; order.forEach((pi, r) => { rank[pi] = r; });
  const RH = 64, Wd = 660, Hd = 132 + n * RH + 18, left = -Wd / 2, top = -Hd / 2;
  const kO = seg(k, 0, 0.6), kC = seg(k, 0.4, 1), uf = unfold(kO);
  let c = panel(left, top, Wd, Hd, th, { c: 22, br: 30 });
  c += TL(o.title || 'DODGEBALL · PICK TEAM', left + 28, top + 52, 34, th.text, { 'text-anchor': 'start', ...outl(5, th.edge) });
  // the SORT BY STRENGTH button
  const bw = 330, bh = 50, bx = left + 28, by = top + 70;
  const pq = 1 - 0.1 * bumpK(seg(press, 0, 0.4));
  let b = S.path(cham(-bw / 2, -bh / 2, bw, bh, 12), { fill: sort > 0 || press > 0 ? th.rim : '#123447', stroke: th.edge, 'stroke-width': 4 });
  b += TF('SORT BY STRENGTH', 18, 9, 22, sort > 0 || press > 0 ? th.edge : th.text, { 'letter-spacing': 1.5 });
  b += S.path(`M${-bw / 2 + 22} -8L${-bw / 2 + 32} 6L${-bw / 2 + 42} -8`, ln(5, sort > 0 || press > 0 ? th.edge : th.rim));
  const fl = seg(press, 0.15, 0.5);
  if (fl > 0 && fl < 1) b += S.path(cham(-bw / 2, -bh / 2, bw, bh, 12), { fill: '#FFFFFF', opacity: f(0.8 * (1 - fl)) });
  c += S.g(b, `translate(${f(bx + bw / 2)} ${f(by + bh / 2)}) scale(${f(pq)})`);
  c += TF('STR', -left - 120, top + 104, 18, th.label, { 'letter-spacing': 3 });
  // rows
  const rowY = (r) => top + 140 + r * RH;
  players.forEach((p, i) => {
    const r = rank[i];
    const u = ease.inOut(seg(sort, 0.04 * r, 0.6 + 0.04 * r));
    const yy = lerp(rowY(i), rowY(r), u);
    const moving = bumpK(seg(sort, 0.04 * r, 0.6 + 0.04 * r)) * (i !== r ? 1 : 0);
    const ri = seg(kC, i * 0.08, 0.35 + i * 0.08);
    if (ri <= 0) return;
    const pk = clamp(pick - r, 0, 1) * (sort >= 0.6 ? 1 : 0);
    const hl = o.highlight && o.highlight.toUpperCase() === p.name.toUpperCase();
    const rth = pk > 0 ? theme('green') : hl ? theme('gold') : th;
    let rw = S.path(cham(left + 22, 0, Wd - 44, RH - 10, 10), { fill: pk > 0 ? '#0A3A20' : '#0A2232', 'fill-opacity': 0.9, stroke: rth.rim, 'stroke-width': pk > 0 || hl ? 3 : 1.5, 'stroke-opacity': pk > 0 || hl ? 1 : 0.5 });
    const pos = Math.round(lerp(i, r, u)) + 1;
    rw += TL(`#${pos}`, left + 58, 39, 26, pos === 1 && sort > 0.6 ? '#FFD21F' : th.label);
    rw += TL(p.name.toUpperCase(), left + 96, 41, 30, '#FFFFFF', { 'text-anchor': 'start', ...outl(4, th.edge) });
    rw += segBar(-left - 290, 18, 160, 18, p.str / 100, p.str >= 80 ? '#FF7A3D' : '#FF9A2E', { th, t, cell: 14, blink: p.str < 10 });
    rw += TL(String(p.str), -left - 104, 41, 30, p.str >= 80 ? '#FFD21F' : '#FFFFFF', { 'text-anchor': 'end', ...outl(4, th.edge) });
    if (pk > 0) {
      const sl = slap(pk, 18, -6);
      rw += S.g(S.circle(0, 0, 20, ol('#3DFF8F', 4, th.edge)) + S.path(checkD(0, 1, 13), ln(5, th.edge)), `translate(${f(-left - 58)} ${f((RH - 10) / 2)}) rotate(${f(sl.rot)}) scale(${f(sl.sc)})`, { opacity: f(sl.op) });
    }
    if (hl && pk <= 0) rw += S.path(cham(left + 22, 0, Wd - 44, RH - 10, 10), { fill: 'none', stroke: '#FFD21F', 'stroke-width': 3, opacity: f(0.4 + 0.4 * Math.sin(t * 6)) });
    c += S.g(rw, `translate(${f(16 * moving + 30 * (1 - ease.out(ri)))} ${f(yy)})`, { opacity: f(ri) });
  });
  if (kO < 1) c += S.path(cham(left, top, Wd, Hd, 22), { fill: '#FFFFFF', opacity: f(0.7 * (1 - seg(kO, 0.55, 1))) });
  let g = S.g(c, `scale(${f(uf.sx)} ${f(uf.sy)})`);
  if (uf.line > 0) g += S.path(`M${f(left * uf.sx)} 0H${f(-left * uf.sx)}`, ln(6, '#FFFFFF', uf.line));
  return S.g(g, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

// statCompare({ k, t, left: { name, stat, value, level, sub }, right: {...}, choose -1..1, x = 960, y = 470, s, title }) — the VS card of
// SC07: "INT 95" (the smart kids) vs "LV 4" (Benji). choose -1 → the left side wins (gold rim, PICKED, scale up), the other side dims
// cold and shrinks; fractional values animate.
function statCompare(o = {}) {
  const { k = 1, t = 0, x = 960, y = 470, s = 1, choose = 0 } = o;
  if (k <= 0) return '';
  const L_ = { name: 'SMART KIDS', stat: 'INT', value: 95, col: '#5AA8FF', sub: 'GENIUS', ...(o.left || {}) };
  const R_ = { name: 'BENJI', stat: 'LV', value: 4, col: '#9FB6C6', sub: 'CLUMSY', ...(o.right || {}) };
  let g = '';
  const card = (d, side) => {
    const ch = clamp(choose * side, 0, 1), dim = clamp(-choose * side, 0, 1);
    const th = mixTheme(ch > 0 ? mixTheme('cyan', 'gold', ch) : 'cyan', 'cold', dim);
    const cw = 430, chh = 330;
    let c = '';
    if (ch > 0) c += rays(0, 0, 14, 340, '#FFE88A', 0.18 * ch, t * 20, 60);
    c += panel(-cw / 2, -chh / 2, cw, chh, th, { c: 22, br: 30 });
    c += TL(String(d.name).toUpperCase(), 0, -chh / 2 + 58, 38, th.text, outl(5, th.edge));
    c += TF(String(d.stat).toUpperCase(), -cw / 2 + 50, 34, 34, th.label, { 'text-anchor': 'start', 'letter-spacing': 3 });
    c += TL(String(d.value), cw / 2 - 40, 70, 140, dim > 0.5 ? mix(d.col, '#7F96AA', dim) : d.col, { 'text-anchor': 'end', ...outl(12, th.edge) });
    c += segBar(-cw / 2 + 40, 104, cw - 80, 20, clamp(Number(d.value) / 100, 0.02, 1), mix(d.col, '#7F96AA', dim), { th, t, cell: 18 });
    if (d.sub) c += TF(String(d.sub).toUpperCase(), 0, chh / 2 - 22, 20, th.label, { 'letter-spacing': 3 });
    if (ch > 0.3) { const sl = slap(seg(ch, 0.3, 1), 20, -8); c += S.g(S.path(para(-80, -24, 160, 48, 12), ol('#FFD21F', 4, th.edge)) + TL('PICKED', 0, 15, 32, th.edge), `translate(${f(cw / 2 - 60)} ${f(-chh / 2 - 6)}) rotate(${f(sl.rot)}) scale(${f(sl.sc)})`, { opacity: f(sl.op) }); }
    const kk = ease.outBack(seg(k, side < 0 ? 0 : 0.12, side < 0 ? 0.6 : 0.72));
    const sc = (1 + 0.08 * ch - 0.1 * dim) * kk;
    return S.g(c, `translate(${f(side * (290 + 600 * (1 - kk)))} ${f(20 * dim)}) scale(${f(sc)})`, { opacity: f(clamp(kk * 2, 0, 1) * (1 - 0.45 * dim)) });
  };
  g += card(L_, -1) + card(R_, 1);
  const vk = seg(k, 0.5, 0.8);
  if (vk > 0) g += S.g(S.path(diamondD(0, 0, 66, 66), ol('#FF3355', 6, INK)) + TL('VS', 0, 20, 58, '#FFFFFF', outl(7, INK)), `scale(${f(vk < 1 ? lerp(2.4, 1, ease.in(vk)) : 1)}) rotate(${f(-8)})`, { opacity: f(clamp(vk * 3, 0, 1)) });
  if (o.title) g += TL(o.title, 0, -230, 46, '#FFFFFF', outl(8, INK));
  return S.g(g, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

module.exports = {
  DEFS, W, H, TH, theme, mixTheme, BAR_COL, TAG_COL, RARITY,
  // 1 plates
  statPlate, plate: statPlate, plateFor, PRESETS, miniPlate, heroPlate, overHead, HEAD_TOP,
  // 2 objects
  tooltip, tipFor, TIPS, lieMeter,
  // 3 quests
  questMarker, questToast, questComplete, questArrow, epicQuest, pillowFort,
  // 4 xp
  xpBar, xpBarAt, xpPop, levelUp, XP_FLY,
  // 5 friendship
  friendshipPop,
  // 6 system
  updateWindow, updateAcceptAt, bootSequence, BOOT_LINES, hudFrame, systemMsg, bossBar, pixelBurst,
  // 7 overload + off
  numbersFlood, hudGlitch, closeX, hudShatter,
  // 8 montage
  sortByStrength, statCompare, DEFAULT_PLAYERS,
  // primitives (build your own HUD bits in the same look)
  panel, softPanel, segBar, sheen, infinity, richText, richW, fitSize, bangGlyph, skullIcon, crownIcon, eyeLogo, icon, cham, para, diamondD, heartD, hexD,
  rays, sparkleBurst, impactTicks, unfold, slap, rollPair, glitchWrap, rgb, glow, edgePulse, TL, TF, hash, seg, bumpK,
};
