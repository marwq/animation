// CUBE CITY GAME-UI + FX KIT — "What If Your PARENTS Joined Your Roblox Server?".
// Pure functions returning SVG strings, deterministic in their inputs (all "randomness" = hash(seed)).
// Scenes: const G = require('./gameui');  API + recipes: docs/GAMEUI.md, sheets: concept/gameui*.png (tools/gameui_sheet.js).
//
//   Chat ........... chatBubble({x,y,s,text,k,typed,caps,user,col,t,tail,out}), chatLog({x,y,w,h,lines,t,scroll,flood,input}),
//                    chatSync(t, lineId, opts) -> typed 0..1, chatLine(t, lineId, opts) -> {text,typed,k,out}
//   Server ......... joinToast({x,y,k,user,text,t,out}), joinStack(t, items, opts), systemBanner({k,text,theme,t,sub,out}),
//                    alarmEdges(t, k)
//   Nametags ....... nametag({x,y,s,name,level,col,k,t,crown,hp,who}), overHead(x, y, s)
//   Leaderboard .... leaderboard({x,y,w,h,rows,k,t,highlight,roll,style:'board'|'hud'}), rankClimb({x,y,from,to,roll,k,t})
//   HUD ............ coinCounter, levelBadge, winsCounter, serverHealth, timerHUD, statPill, rollNum
//   Emotes/combat .. emoteHearts, kissEmote, emoteWheel, danceNotes, slash, hitSpark, damageNumber, koStars, knockoutFly
//                    (+ knockoutPath), comboText, swordRain (+ sword), potionPop (+ potion)
//   Boss ........... bossBar, shieldDome, crystal, crystalShatter, bossCrumble
//   Party/results .. partyPanel, victoryCard, mvpCard
//   Editor ......... avatarEditor (+ itemIcon, ITEMS), pointer, keycap
//   Devices ........ deviceFrame({type:'laptopOld'|'tablet'|'phone'|'pc', x,y,s,screen,glow,k,t}), screenGlow(x,y,w,h,col,k)
//   Misc ........... bigTitle, stamp, tumbleweed, wallet, rewind/rewindT (= respawn.js), portrait, isoCube, coinIcon, cubeLogo
//
// Theme (one original "Cube City" look): HUD overlays = navy glass + teal rim; menus/cards = warm cream panels with a teal
// header; rewards = gold; alarms = red + hazard stripes; boss = purple. Titles Lilita One, UI Fredoka 700.
// Units: plain px at s 1 (designed for the 1920x1080 frame). Over an actor (feet x, y, scale s): head top ≈ y - 950*s.
// No SVG filters, masks or blend modes; clipPaths only for scrolling lists, rolling digits and device screens.
'use strict';

const S = require('../rig/svg');
const R = require('./respawn');
const V = require('./vo');
const { f, clamp, lerp, ease } = S;
const { hash, seg, bumpK, mix, darker, lighter, textW, wrap, star4, star5, ring } = R;

const W = 1920, H = 1080;
const LINE = '#151515';
const mod = (a, n) => ((a % n) + n) % n;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ol = (fill, w = 6) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const ln = (w, c = LINE, op) => ({ fill: 'none', stroke: c, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(op !== undefined ? { opacity: f(op) } : {}) });
const stroked = (sw, col = LINE, extra = {}) => ({ stroke: col, 'stroke-width': sw, 'stroke-linejoin': 'round', 'paint-order': 'stroke', ...extra });
const tr = (x, y, s = 1, rot = 0) => `translate(${f(x)} ${f(y)})${rot ? ` rotate(${f(rot)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
// text: Lilita One (titles) / Fredoka 700 (UI) / Fredoka 600 (body)
const T = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, esc(s));
const TF = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, esc(s));
const T6 = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Fredoka, sans-serif', 'font-weight': 600, 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, esc(s));
const pop = (k) => ease.outBack(clamp(k, 0, 1));
const fade = (k) => clamp(k, 0, 1);
const op = (v) => (v < 0.999 ? { opacity: f(clamp(v, 0, 1)) } : {});
// fit a string into maxW px: shrink the font down to minK x size, then truncate with an ellipsis -> { text, size }
function fitText(str, maxW, size, font = 'F', minK = 0.72) {
  str = String(str);
  const w = textW(str, size, font);
  if (w <= maxW) return { text: str, size };
  const s2 = Math.max(size * minK, (size * maxW) / w);
  if (textW(str, s2, font) <= maxW) return { text: str, size: s2 };
  let t = str;
  while (t.length > 1 && textW(t + '…', s2, font) > maxW) t = t.slice(0, -1);
  return { text: t + '…', size: s2 };
}

// ---------------------------------------------------------------- palette (Cube City UI)
const P = {
  line: LINE, ink: '#1E2A44', inkSoft: '#5B6684',
  cream: '#FFF8EC', cream2: '#F4E7D1', cream3: '#E3CFAE',
  teal: '#17C3B2', tealD: '#0B8F86', tealDD: '#075E5A', tealL: '#A6F4EA',
  orange: '#FF8A2B', orangeD: '#DE5F17', orangeL: '#FFD2A6',
  gold: '#FFC83D', goldD: '#E0960E', goldL: '#FFF1B8',
  red: '#FF4B5C', redD: '#C81D35', redL: '#FFB3BB',
  green: '#3DDC84', greenD: '#1E9F59', greenL: '#B8F7D2',
  purple: '#9B5CFF', purpleD: '#5B26C2', purpleL: '#E2CCFF',
  pink: '#FF6FB5', blue: '#3A8DFF', sky: '#8FD3FF',
  navy: '#1A2340', navy2: '#26335A', navy3: '#3A4A78', navyL: '#8FA3D6',
  white: '#FFFFFF',
};
// known players: chat/nametag colour (readable on navy AND cream), portrait key, default level
const USERS = {
  YOU: { col: '#FF8A2B', who: 'you', level: 99, crown: true },
  DadBod1978: { col: '#F2B705', who: 'dad', level: 1 },
  MOM_OFFICIAL: { col: '#FF5FA8', who: 'mom', level: 12 },
  GrannyGoodies: { col: '#B57BFF', who: 'granny', level: 7 },
  NoodleBoi: { col: '#17C3B2', who: 'noodle', level: 64 },
  xX_DarkBlade_Xx: { col: '#FF4B5C', who: 'darkblade', level: 88 },
  'The Block King': { col: '#9B5CFF', who: 'boss', level: 999 },
  SYSTEM: { col: '#5CF2B0', who: 'cube' },
};
const WHO_NAME = { you: 'YOU', dad: 'DadBod1978', mom: 'MOM_OFFICIAL', granny: 'GrannyGoodies', grandma: 'GrannyGoodies', noodle: 'NoodleBoi', darkblade: 'xX_DarkBlade_Xx', boss: 'The Block King' };
const USER_COLS = ['#FF8A2B', '#17C3B2', '#FF5FA8', '#7CC4FF', '#B57BFF', '#5CDB6E', '#FFB020', '#FF6B6B', '#4FD1E8', '#E07BFF'];
function userColor(name) {
  if (!name) return P.white;
  if (USERS[name]) return USERS[name].col;
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return USER_COLS[h % USER_COLS.length];
}
const userWho = (name) => (USERS[name] ? USERS[name].who : null);

// ---------------------------------------------------------------- static defs (loaded by scenes/main.js; ids prefixed gu)
const DEFS = `<defs>
<linearGradient id="guBossFill" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7A2CFF"/><stop offset="0.6" stop-color="#C02BD8"/><stop offset="1" stop-color="#FF3B6B"/></linearGradient>
<linearGradient id="guHpFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF7A86"/><stop offset="0.5" stop-color="#FF3B4E"/><stop offset="1" stop-color="#C21A33"/></linearGradient>
<linearGradient id="guGoldV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3B0"/><stop offset="0.45" stop-color="#FFD23F"/><stop offset="1" stop-color="#F29A0E"/></linearGradient>
<linearGradient id="guTealV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3FE0CF"/><stop offset="1" stop-color="#0FA597"/></linearGradient>
<linearGradient id="guOrangeV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB15E"/><stop offset="1" stop-color="#F06A1C"/></linearGradient>
<linearGradient id="guRedV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF6A76"/><stop offset="1" stop-color="#D1203A"/></linearGradient>
<linearGradient id="guPurpleV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B98AFF"/><stop offset="1" stop-color="#6A2FD8"/></linearGradient>
<linearGradient id="guNavyV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2B3A66"/><stop offset="1" stop-color="#172038"/></linearGradient>
<linearGradient id="guStage" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1F6F86"/><stop offset="0.7" stop-color="#2BB3B0"/><stop offset="1" stop-color="#8FE6D6"/></linearGradient>
<linearGradient id="guRetro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.48" stop-color="#7CF3FF"/><stop offset="0.52" stop-color="#FF4FB8"/><stop offset="1" stop-color="#FFE14D"/></linearGradient>
<linearGradient id="guSheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.75"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
<linearGradient id="guGlare" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.22"/><stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.04"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
<linearGradient id="guEdgeT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF2B3E" stop-opacity="0.85"/><stop offset="1" stop-color="#FF2B3E" stop-opacity="0"/></linearGradient>
<linearGradient id="guEdgeB" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FF2B3E" stop-opacity="0.85"/><stop offset="1" stop-color="#FF2B3E" stop-opacity="0"/></linearGradient>
<linearGradient id="guEdgeL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FF2B3E" stop-opacity="0.85"/><stop offset="1" stop-color="#FF2B3E" stop-opacity="0"/></linearGradient>
<linearGradient id="guEdgeR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#FF2B3E" stop-opacity="0.85"/><stop offset="1" stop-color="#FF2B3E" stop-opacity="0"/></linearGradient>
<linearGradient id="guBeam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#E9DBFF" stop-opacity="0.75"/><stop offset="1" stop-color="#B78CFF" stop-opacity="0"/></linearGradient>
<radialGradient id="guGlowC"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/><stop offset="0.35" stop-color="#7CF3FF" stop-opacity="0.5"/><stop offset="1" stop-color="#7C5CFF" stop-opacity="0"/></radialGradient>
<radialGradient id="guGlowGold"><stop offset="0" stop-color="#FFFBE0" stop-opacity="0.95"/><stop offset="0.45" stop-color="#FFD23F" stop-opacity="0.4"/><stop offset="1" stop-color="#FFB020" stop-opacity="0"/></radialGradient>
<radialGradient id="guGlowP"><stop offset="0" stop-color="#F3E6FF" stop-opacity="0.9"/><stop offset="0.45" stop-color="#B57BFF" stop-opacity="0.4"/><stop offset="1" stop-color="#7A2CFF" stop-opacity="0"/></radialGradient>
<radialGradient id="guFaceB"><stop offset="0" stop-color="#BFF2FF" stop-opacity="0.55"/><stop offset="0.5" stop-color="#7FD8FF" stop-opacity="0.25"/><stop offset="1" stop-color="#7FD8FF" stop-opacity="0"/></radialGradient>
<radialGradient id="guFaceW"><stop offset="0" stop-color="#FFE7B8" stop-opacity="0.55"/><stop offset="0.5" stop-color="#FFC46B" stop-opacity="0.25"/><stop offset="1" stop-color="#FFC46B" stop-opacity="0"/></radialGradient>
<radialGradient id="guFaceR"><stop offset="0" stop-color="#FF9AA5" stop-opacity="0.55"/><stop offset="0.5" stop-color="#FF3B4E" stop-opacity="0.25"/><stop offset="1" stop-color="#FF3B4E" stop-opacity="0"/></radialGradient>
<radialGradient id="guFaceP"><stop offset="0" stop-color="#E2CCFF" stop-opacity="0.55"/><stop offset="0.5" stop-color="#B57BFF" stop-opacity="0.25"/><stop offset="1" stop-color="#B57BFF" stop-opacity="0"/></radialGradient>
<radialGradient id="guFaceG"><stop offset="0" stop-color="#C8FFD8" stop-opacity="0.55"/><stop offset="0.5" stop-color="#5CFF9D" stop-opacity="0.25"/><stop offset="1" stop-color="#5CFF9D" stop-opacity="0"/></radialGradient>
<radialGradient id="guGlowW"><stop offset="0" stop-color="#FFFFFF" stop-opacity="1"/><stop offset="0.4" stop-color="#FFFFFF" stop-opacity="0.5"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
<pattern id="guHazard" width="56" height="56" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="56" height="56" fill="#FFD23F"/><rect width="28" height="56" fill="#151515"/></pattern>
<pattern id="guHex" width="30" height="52" patternUnits="userSpaceOnUse"><path d="M15 0 L30 8.66 L30 25.98 L15 34.64 L0 25.98 L0 8.66 Z M15 34.64 L15 52" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.55"/></pattern>
<pattern id="guDots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="2.4" fill="#FFFFFF" opacity="0.16"/><circle cx="18" cy="18" r="2.4" fill="#FFFFFF" opacity="0.16"/></pattern>
<pattern id="guScan" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="2" fill="#000000" opacity="0.16"/></pattern>
</defs>`;

// ---------------------------------------------------------------- small shared drawings
// isometric cube (the Cube City motif): r = half-height; cols = [top, left, right]
function isoCube(x, y, r, cols = [P.tealL, P.teal, P.tealD], lw = null) {
  const a = 0.866 * r, b = 0.5 * r, w = lw ?? Math.max(2, r * 0.14);
  const p = (pts) => 'M' + pts.map(([u, v]) => `${f(x + u)} ${f(y + v)}`).join(' L') + ' Z';
  return S.path(p([[0, -r], [a, -b], [0, 0], [-a, -b]]), { fill: cols[0] }) + S.path(p([[-a, -b], [0, 0], [0, r], [-a, b]]), { fill: cols[1] }) +
    S.path(p([[0, 0], [a, -b], [a, b], [0, r]]), { fill: cols[2] }) +
    S.path(p([[0, -r], [a, -b], [a, b], [0, r], [-a, b], [-a, -b]]), { fill: 'none', stroke: LINE, 'stroke-width': f(w), 'stroke-linejoin': 'round' }) +
    S.path(`M${f(x - a)} ${f(y - b)} L${f(x)} ${f(y)} L${f(x + a)} ${f(y - b)} M${f(x)} ${f(y)} V${f(y + r)}`, ln(f(w * 0.7), LINE));
}
// Cube City logo: cube + wordmark (x, y = centre)
function cubeLogo(x, y, s = 1, o = {}) {
  const { text = 'CUBE CITY', col = P.white, k = 1 } = o;
  if (k <= 0.001) return '';
  const tw = textW(text, 64, 'L');
  let c = isoCube(-tw / 2 - 26, -6, 40, [P.goldL, P.orange, P.orangeD], 6);
  c += T(text, 30, 18, 64, col, stroked(12));
  return S.g(c, tr(x, y, s * pop(k)));
}
// Cube City coin: gold disc with an embossed cube (NOT a Robux coin). spin = radians (flips around the vertical axis)
function coinIcon(x, y, r = 30, spin = 0, o = {}) {
  const sx = Math.max(0.14, Math.abs(Math.cos(spin)));
  const lw = Math.max(2.5, r * 0.13);
  let c = S.circle(0, 0, r, { fill: P.goldD, stroke: LINE, 'stroke-width': f(lw) });
  c += S.circle(-r * 0.06, -r * 0.06, r * 0.8, { fill: P.gold });
  c += S.circle(0, 0, r * 0.62, { fill: 'none', stroke: P.goldD, 'stroke-width': f(r * 0.08) });
  if (sx > 0.35) c += isoCube(0, 0, r * 0.36, [P.goldL, '#F5B82A', P.goldD], Math.max(1.5, r * 0.06));
  c += S.path(`M${f(-r * 0.55)} ${f(-r * 0.32)} Q${f(-r * 0.36)} ${f(-r * 0.66)} ${f(r * 0.05)} ${f(-r * 0.7)}`, ln(f(r * 0.12), '#FFFBE0', o.shine ?? 0.9));
  return S.g(c, `translate(${f(x)} ${f(y)}) scale(${f(sx)} 1)`);
}
const heartD = (x, y, r) => `M${f(x)} ${f(y + r * 0.85)} C${f(x - r * 1.35)} ${f(y + r * 0.05)} ${f(x - r * 0.95)} ${f(y - r * 1.05)} ${f(x)} ${f(y - r * 0.38)} C${f(x + r * 0.95)} ${f(y - r * 1.05)} ${f(x + r * 1.35)} ${f(y + r * 0.05)} ${f(x)} ${f(y + r * 0.85)} Z`;
function heart(x, y, r, col = P.red, lw = null, o = {}) {
  const w = lw ?? Math.max(2.5, r * 0.16);
  return S.path(heartD(x, y, r), { fill: col, stroke: LINE, 'stroke-width': f(w), 'stroke-linejoin': 'round', ...o }) +
    S.path(`M${f(x - r * 0.62)} ${f(y - r * 0.28)} Q${f(x - r * 0.6)} ${f(y - r * 0.62)} ${f(x - r * 0.3)} ${f(y - r * 0.62)}`, ln(f(r * 0.16), '#FFFFFF', 0.85));
}
function crown(x, y, r = 30, col = P.gold, lw = null) {   // (x, y) = bottom centre, r = half width
  const w = lw ?? Math.max(2.5, r * 0.14);
  const d = `M${f(x - r)} ${f(y)} L${f(x - r * 1.08)} ${f(y - r * 1.05)} L${f(x - r * 0.48)} ${f(y - r * 0.55)} L${f(x)} ${f(y - r * 1.25)} L${f(x + r * 0.48)} ${f(y - r * 0.55)} L${f(x + r * 1.08)} ${f(y - r * 1.05)} L${f(x + r)} ${f(y)} Z`;
  return S.path(d, { fill: col, stroke: LINE, 'stroke-width': f(w), 'stroke-linejoin': 'round' }) +
    S.rect(x - r, y - r * 0.26, r * 2, r * 0.26, 0, { fill: darker(col, 0.18) }) + S.path(`M${f(x - r)} ${f(y)} H${f(x + r)}`, ln(f(w), LINE)) +
    S.circle(x, y - r * 1.25, r * 0.17, ol(P.red, w * 0.6)) + S.circle(x - r * 1.08, y - r * 1.05, r * 0.13, ol('#7CC4FF', w * 0.5)) + S.circle(x + r * 1.08, y - r * 1.05, r * 0.13, ol('#7CC4FF', w * 0.5));
}
function trophy(x, y, r = 30, col = P.gold) {   // (x, y) = centre
  const w = Math.max(2.5, r * 0.13);
  let c = S.path(`M${f(-r * 0.62)} ${f(-r * 0.62)} Q${f(-r * 1.15)} ${f(-r * 0.6)} ${f(-r * 1.0)} ${f(-r * 0.2)} Q${f(-r * 0.85)} ${f(r * 0.12)} ${f(-r * 0.45)} ${f(r * 0.1)}`, ln(f(w * 1.1), LINE)) +
    S.path(`M${f(r * 0.62)} ${f(-r * 0.62)} Q${f(r * 1.15)} ${f(-r * 0.6)} ${f(r * 1.0)} ${f(-r * 0.2)} Q${f(r * 0.85)} ${f(r * 0.12)} ${f(r * 0.45)} ${f(r * 0.1)}`, ln(f(w * 1.1), LINE));
  c += S.path(`M${f(-r * 0.66)} ${f(-r * 0.78)} H${f(r * 0.66)} Q${f(r * 0.66)} ${f(r * 0.3)} ${f(0)} ${f(r * 0.34)} Q${f(-r * 0.66)} ${f(r * 0.3)} ${f(-r * 0.66)} ${f(-r * 0.78)} Z`, ol(col, w));
  c += S.rect(-r * 0.13, r * 0.3, r * 0.26, r * 0.36, 0, ol(darker(col, 0.15), w * 0.8)) + S.rect(-r * 0.5, r * 0.62, r, r * 0.26, r * 0.06, ol(darker(col, 0.25), w));
  c += S.path(star5(0, -r * 0.24, r * 0.26), { fill: '#FFFBE0' }) + S.path(`M${f(-r * 0.45)} ${f(-r * 0.6)} V${f(-r * 0.1)}`, ln(f(w * 0.8), '#FFFBE0', 0.8));
  return S.g(c, tr(x, y));
}
// sword pointing UP from (x, y) = the grip centre; len = blade length
function sword(x, y, s = 1, rot = 0, o = {}) {
  const { blade = P.gold, edge = '#FFFBE0', guard = P.goldD, grip = '#6B3A1E', gem = P.red } = o;
  let c = S.path('M-17 -40 L-17 -232 L0 -272 L17 -232 L17 -40 Z', ol(blade, 6)) + S.path('M0 -256 V-52', ln(5, edge, 0.9));
  c += S.rect(-52, -46, 104, 20, 10, ol(guard, 6)) + S.rect(-11, -26, 22, 54, 6, ol(grip, 6)) + S.circle(0, 38, 13, ol(gem, 5));
  return S.g(c, tr(x, y, s, rot));
}
function shieldIcon(x, y, r = 30, col = P.teal) {
  const w = Math.max(2.5, r * 0.13);
  return S.path(`M${f(x)} ${f(y - r)} L${f(x + r * 0.85)} ${f(y - r * 0.62)} Q${f(x + r * 0.85)} ${f(y + r * 0.55)} ${f(x)} ${f(y + r)} Q${f(x - r * 0.85)} ${f(y + r * 0.55)} ${f(x - r * 0.85)} ${f(y - r * 0.62)} Z`, ol(col, w)) +
    S.path(`M${f(x)} ${f(y - r * 0.7)} V${f(y + r * 0.7)} M${f(x - r * 0.55)} ${f(y - r * 0.15)} H${f(x + r * 0.55)}`, ln(f(w * 0.8), '#FFFFFF', 0.85));
}
function lockIcon(x, y, r = 20, col = P.gold) {
  const w = Math.max(2, r * 0.16);
  return S.path(`M${f(x - r * 0.5)} ${f(y - r * 0.1)} V${f(y - r * 0.5)} A${f(r * 0.5)} ${f(r * 0.5)} 0 0 1 ${f(x + r * 0.5)} ${f(y - r * 0.5)} V${f(y - r * 0.1)}`, ln(f(w * 1.2), LINE)) +
    S.rect(x - r * 0.8, y - r * 0.15, r * 1.6, r * 1.15, r * 0.25, ol(col, w)) + S.circle(x, y + r * 0.38, r * 0.17, { fill: LINE });
}
function clockIcon(x, y, r = 24, t = 0, col = P.white) {
  const w = Math.max(2, r * 0.14);
  const a = t * 6, b = t * 0.5;
  return S.circle(x, y, r, ol(col, w)) + S.path(`M${f(x)} ${f(y)} L${f(x + Math.sin(a) * r * 0.7)} ${f(y - Math.cos(a) * r * 0.7)} M${f(x)} ${f(y)} L${f(x + Math.sin(b) * r * 0.45)} ${f(y - Math.cos(b) * r * 0.45)}`, ln(f(w), LINE)) +
    S.circle(x, y, w * 0.8, { fill: LINE }) + S.rect(x - r * 0.25, y - r * 1.38, r * 0.5, r * 0.3, r * 0.08, ol(col, w * 0.8));
}
function serverIcon(x, y, r = 24, t = 0, col = P.white, alarm = false) {
  const w = Math.max(2, r * 0.13);
  let c = '';
  for (let i = 0; i < 3; i++) {
    const yy = y - r + i * r * 0.7;
    c += S.rect(x - r, yy, r * 2, r * 0.58, r * 0.14, ol(col, w));
    const on = alarm ? Math.floor(t * 6 + i) % 2 === 0 : Math.floor(t * 3 + i * 1.7) % 3 !== 0;
    c += S.circle(x + r * 0.62, yy + r * 0.29, r * 0.11, { fill: on ? (alarm ? P.red : P.green) : '#7A8399' }) + S.path(`M${f(x - r * 0.7)} ${f(yy + r * 0.29)} H${f(x + r * 0.2)}`, ln(f(w * 0.8), '#7A8399'));
  }
  return c;
}
function potion(x, y, s = 1, rot = 0, col = P.green) {   // (x, y) = bottle centre
  let c = S.path('M-14 -52 H14 V-30 Q46 -16 46 18 Q46 54 0 54 Q-46 54 -46 18 Q-46 -16 -14 -30 Z', ol('#EAF6FF', 6));
  c += S.path('M-40 12 Q-20 2 0 10 Q20 18 40 8 Q42 50 0 50 Q-42 50 -40 12 Z', { fill: col });
  c += S.rect(-18, -68, 36, 22, 6, ol('#B07A44', 5)) + S.path('M-28 -6 Q-30 20 -18 36', ln(7, '#FFFFFF', 0.85)) + S.circle(14, 24, 6, { fill: '#FFFFFF', opacity: 0.6 });
  c += S.path('M-6 22 h12 M0 16 v12', ln(6, '#FFFFFF'));
  return S.g(c, tr(x, y, s, rot));
}
// mouse pointer (tip at x, y); press 0..1 = click ripple + squish
function pointer(x, y, s = 1, press = 0, o = {}) {
  const { col = P.white, hand = false } = o;
  const sq_ = press > 0 && press < 1 ? 1 - 0.18 * bumpK(press * 2) : 1;
  let c = '';
  if (press > 0 && press < 1) c += S.circle(0, 0, 18 + 70 * ease.out(press), { fill: 'none', stroke: P.orange, 'stroke-width': f(10 * (1 - press)), opacity: f(1 - press) });
  if (hand) c += S.g(S.path('M-6 0 V-58 Q-6 -70 6 -70 Q18 -70 18 -58 V-28 Q30 -36 40 -26 Q52 -34 60 -22 Q72 -28 78 -14 V20 Q78 48 50 56 H14 Q-2 56 -14 40 L-44 4 Q-50 -6 -40 -12 Q-30 -16 -20 -6 Z', ol(col, 6)), `scale(${f(sq_)})`);
  else c += S.g(S.path('M0 0 L0 74 L18 58 L32 90 L48 82 L34 52 L58 52 Z', ol(col, 6)), `scale(${f(sq_)})`);
  return S.g(c, tr(x, y, s));
}
// keyboard key (SPACEBAR / CAPS LOCK ...): (x, y) = centre; press 0..1 pushes it down; led: null | true | false
function keycap(o = {}) {
  const { x = 960, y = 540, w = 160, h = 120, s = 1, label = 'SPACE', size = 34, led = null, col = P.cream, k = 1, t = 0 } = o;
  const press = clamp(o.press || 0, 0, 1);
  if (k <= 0.001) return '';
  const dep = 18, d = dep * (1 - 0.75 * press);
  let c = S.rect(-w / 2, -h / 2 + dep - d + 4, w, h, 22, ol(darker(col, 0.28), 7));
  c += S.rect(-w / 2, -h / 2 + dep - d - 6 + 6 * press, w, h - 4, 22, ol(col, 7));
  const ty = -h / 2 + dep - d + 6 * press;
  c += S.rect(-w / 2 + 14, ty + 4, w - 28, h - 34, 16, { fill: lighter(col, 0.45), opacity: 0.55 });
  c += TF(label, 0, ty + h * 0.5 + size * 0.28, size, P.ink);
  if (led !== null) c += S.circle(-w / 2 + 26, ty + 22, 8, ol(led ? '#5CFF7A' : '#4A5266', 3)) + (led ? S.circle(-w / 2 + 26, ty + 22, 16, { fill: '#5CFF7A', opacity: f(0.3 + 0.1 * Math.sin(t * 8)) }) : '');
  return S.g(c, tr(x, y, s * pop(k)));
}

// ---------------------------------------------------------------- mini portraits (avatar heads in circles)
// portrait(who, x, y, r, { bg, ring, gold, frame }) — who: 'you' | 'dad' | 'mom' | 'granny' | 'noodle' | 'darkblade' |
// 'kid' | 'boss' | 'cube' | null (generic head in `col`). Drawn in a 100x100 unit box scaled to radius r.
function headArt(who, col = P.teal, o = {}) {
  const L = 5;
  switch (who) {
    case 'you':
      return S.path('M-32 48 L-26 34 H26 L32 48 Z', ol('#D8262E', L)) + S.rect(-28, -26, 56, 58, 14, ol('#FFFFFF', L)) +
        S.path('M-36 2 Q-40 -42 0 -42 Q40 -42 36 2 L30 2 L30 -12 L-30 -12 L-30 2 Z', ol('#F28C28', L)) +
        S.ellipse(-11, 6, 10, 11, ol('#FFFFFF', 3.5)) + S.ellipse(11, 6, 10, 11, ol('#FFFFFF', 3.5)) + S.circle(-9, 7, 3.6, { fill: LINE }) + S.circle(13, 7, 3.6, { fill: LINE }) +
        S.path('M-8 22 Q0 27 8 22', ln(3.5));
    case 'dad':
      return S.rect(-30, -44, 60, 96, 30, ol('#F2C27A', L)) + S.rect(-20, -38, 40, 84, 20, ol('#E0533F', L)) +
        S.path('M-16 18 Q-8 10 0 18 Q8 26 16 18 M-16 34 Q-8 26 0 34 Q8 42 16 34', ln(5, '#FFD23F')) +
        S.circle(-7, -12, 4, { fill: LINE }) + S.circle(7, -12, 4, { fill: LINE }) + S.path('M-12 0 Q-6 -6 0 -1 Q6 -6 12 0', ln(5, '#4A2A16')) + S.path('M-14 -40 Q0 -48 14 -40', ln(4, '#FFFFFF', 0.6));
    case 'mom':
      return S.circle(0, -38, 13, ol(o.gold ? P.gold : '#9AA0AE', L)) + S.rect(-28, -28, 56, 60, 14, ol(o.gold ? P.gold : '#B9BEC8', L)) +
        (o.gold ? S.path('M-28 -6 H28', ln(5, LINE)) + S.rect(-20, -4, 40, 12, 4, { fill: LINE }) + S.rect(-15, -1, 9, 6, 2, { fill: '#7CF3FF' }) + S.rect(6, -1, 9, 6, 2, { fill: '#7CF3FF' })
          : S.circle(-10, 2, 4, { fill: LINE }) + S.circle(10, 2, 4, { fill: LINE }) + S.circle(-17, 13, 4, { fill: '#FF9CB8', opacity: 0.8 }) + S.circle(17, 13, 4, { fill: '#FF9CB8', opacity: 0.8 })) +
        S.path(o.gold ? 'M-8 20 Q0 24 8 20' : 'M-8 16 Q0 22 8 16', ln(3.5)) + S.path('M-28 40 Q0 50 28 40', ln(5, o.gold ? P.goldD : '#8A909E'));
    case 'granny':
      return S.rect(-26, -20, 52, 56, 14, ol('#FFD9B8', L)) + [[-26, -22], [-12, -34], [4, -36], [18, -30], [28, -16], [-30, -6]].map(([cx, cy]) => S.circle(cx, cy, 13, ol('#F4F4F8', 4))).join('') +
        S.circle(-10, 8, 3.6, { fill: LINE }) + S.circle(10, 8, 9, { fill: 'none', stroke: P.gold, 'stroke-width': 4 }) + S.circle(10, 8, 3.6, { fill: LINE }) + S.path('M19 12 Q24 30 18 42', ln(2.5, P.gold)) +
        S.path('M-7 22 Q0 27 7 22', ln(3.5)) + [-18, -9, 0, 9, 18].map((px, i) => S.circle(px, 42 + Math.abs(px) * -0.12, 5, ol('#FFFFFF', 2.5))).join('');
    case 'noodle':
      return S.path('M-20 -30 L18 -50 M-6 -34 L30 -48', ln(6, '#8A5A2E')) +
        S.path('M-34 -14 Q-30 -34 0 -34 Q30 -34 34 -14 Z', ol('#FFE08A', L)) + S.path('M-26 -18 Q-20 -28 -14 -18 Q-8 -28 -2 -18 Q4 -28 10 -18 Q16 -28 22 -18', ln(3.5, '#E8B640')) +
        S.path('M-38 -14 H38 Q36 32 0 38 Q-36 32 -38 -14 Z', ol('#E84A3C', L)) + S.path('M-36 0 H36', ln(6, '#FFFFFF')) +
        S.circle(-11, 14, 4, { fill: LINE }) + S.circle(11, 14, 4, { fill: LINE }) + S.path('M-7 24 Q0 30 7 24', ln(3.5));
    case 'darkblade':
      return S.path('M0 -50 L8 -34 H-8 Z', ol(P.red, 4)) + S.rect(-30, -34, 60, 70, 18, ol('#24252E', L)) + S.path('M-30 -4 H30', ln(4, '#3A3C48')) +
        S.path('M-22 -8 L-6 -2 L-6 4 L-22 0 Z M22 -8 L6 -2 L6 4 L22 0 Z', { fill: '#FF2E3E' }) + S.path('M-14 18 H14', ln(4, '#3A3C48')) + S.path('M-24 -26 Q0 -34 24 -26', ln(4, '#4A4C5A'));
    case 'kid':
      return S.rect(-26, -22, 52, 54, 14, ol('#FFD23F', L)) + S.path('M-30 -18 Q-28 -40 0 -40 Q28 -40 30 -18 Z', ol('#3A8DFF', L)) + S.path('M24 -20 H40', ln(6, '#3A8DFF')) +
        S.path('M0 -40 V-50 M-18 -54 H18', ln(5, LINE)) + S.ellipse(-10, -54, 10, 4, ol(P.red, 3)) + S.ellipse(10, -54, 10, 4, ol('#FFD23F', 3)) +
        S.circle(-9, 4, 4, { fill: LINE }) + S.circle(9, 4, 4, { fill: LINE }) + S.path('M-8 16 Q0 23 8 16', ln(3.5));
    case 'boss':
      return S.rect(-34, -26, 68, 66, 8, ol('#7D8494', L)) + S.path('M-34 4 H34 M0 -26 V4 M-14 4 V40 M18 4 V40', ln(3, '#5A6070')) +
        S.path('M-24 -8 L-6 -2 L-24 4 Z M24 -8 L6 -2 L24 4 Z', { fill: '#D47CFF' }) + S.path('M-14 22 H14', ln(5, '#2A1A3A')) + crown(0, -26, 20, P.gold, 3.5);
    case 'cube':
      return isoCube(0, 0, 36, [P.goldL, P.orange, P.orangeD], 4.5);
    default:
      return S.rect(-28, -28, 56, 60, 14, ol(col, L)) + S.circle(-10, 0, 4.5, { fill: LINE }) + S.circle(10, 0, 4.5, { fill: LINE }) + S.path('M-9 14 Q0 21 9 14', ln(3.5));
  }
}
const PORTRAIT_BG = { you: '#FFE1C2', dad: '#FFF0B8', mom: '#FFD3E8', granny: '#EAD9FF', noodle: '#C9F6EF', darkblade: '#3A2030', kid: '#D6ECFF', boss: '#3B2A5A', cube: '#D6F7F2' };
function portrait(who, x, y, r = 40, o = {}) {
  const { col = P.teal, bg = PORTRAIT_BG[who] || lighter(col, 0.65), ringCol = o.ring || LINE, gold = false } = o;
  let c = S.circle(0, 0, 50, { fill: bg, stroke: ringCol, 'stroke-width': f(o.ringW || 6) });
  c += S.g(headArt(who, col, { gold }), 'scale(0.86) translate(0 4)');
  return S.g(c, tr(x, y, r / 50));
}

// ================================================================ 1. CHAT
// bubble outline (rounded rect + tail) as one path; tail tip at (0, 0); bubble box (L, T)-(R, B)
function bubblePath(L, T_, R_, B, r, tx, tw, tail = true) {
  r = Math.min(r, (B - T_) / 2, (R_ - L) / 2);
  let d = `M${f(L + r)} ${f(T_)} H${f(R_ - r)} Q${f(R_)} ${f(T_)} ${f(R_)} ${f(T_ + r)} V${f(B - r)} Q${f(R_)} ${f(B)} ${f(R_ - r)} ${f(B)}`;
  if (tail) d += ` H${f(tx + tw)} Q${f(tx + tw * 0.35)} ${f(B + (0 - B) * 0.45)} 0 0 Q${f(tx - tw * 0.15)} ${f(B + (0 - B) * 0.4)} ${f(tx - tw)} ${f(B)}`;
  d += ` H${f(L + r)} Q${f(L)} ${f(B)} ${f(L)} ${f(B - r)} V${f(T_ + r)} Q${f(L)} ${f(T_)} ${f(L + r)} ${f(T_)} Z`;
  return d;
}
// chatBubble({ x, y, s, text, k, typed, caps, user, col, t, tail, out, maxW, size, dots, textCol, rot })
//   (x, y) = the tail tip (put it just above the nametag / head). k 0..1 pops it in with overshoot; out 0..1 floats it up + fades.
//   typed 0..1 = letters shown (typewriter); typed 0 = "..." typing dots; blinking cursor while typing.
//   caps: Dad's CAPS LOCK — upper-case Lilita, each new letter stomps in, the bubble jolts, a red CAPS LOCK tab.
//   user: name tab on the bubble (coloured by user). tail: -1..1 where the tail sits along the bottom edge (0 = centre),
//   false = no tail. Long text wraps at maxW (px). Bubble size = the full text (stable while typing).
function chatBubble(o = {}) {
  const { x = 960, y = 400, s = 1, t = 0, caps = false, user = null, maxW = caps ? 620 : 560, tail = 0, rot = 0 } = o;
  const k = clamp(o.k ?? 1, 0, 1), out = clamp(o.out || 0, 0, 1);
  if (k <= 0.001 || out >= 1) return '';
  let text = String(o.text ?? '').replace(/\s+/g, ' ').trim();
  if (caps) text = text.toUpperCase();
  const font = caps ? 'L' : 'F', size = o.size || (caps ? 48 : 40), lh = size * 1.16;
  const lines = text ? wrap(text, maxW, size, font) : [''];
  const N = text.length;
  const typed = clamp(o.typed ?? 1, 0, 1);
  const nf = typed * N, n = Math.floor(nf + 1e-6);
  const padX = size * 0.6, padY = size * 0.44;
  const fullW = Math.max(size * 3.2, ...lines.map((l) => textW(l, size, font))) + padX * 2;
  const fullH = lines.length * lh + padY * 2 - (lh - size) * 0.4;
  const dotsW = size * 3.4, dotsH = size * 1.7;
  const dotsMode = o.dots !== false && n === 0;
  const g_ = dotsMode ? 0 : ease.outBack(clamp(nf / 1.6, 0, 1));
  const bw = lerp(dotsW, fullW, g_), bh = lerp(dotsH, fullH, g_);
  const tailH = tail === false ? 0 : size * 0.62;
  const tpos = tail === false ? 0 : clamp(Number(tail) || 0, -1, 1);
  const cx = -tpos * (bw / 2 - size * 0.9);
  const L = cx - bw / 2, R_ = cx + bw / 2, B = -tailH, T_ = B - bh;
  const fill = o.col || P.white, ink = o.textCol || P.ink;
  // caps jolt on every new letter
  const frac = nf - Math.floor(nf);
  const jolt = caps && typed > 0 && typed < 1 ? Math.pow(1 - frac, 3) : 0;
  const bd = bubblePath(L, T_, R_, B, size * 0.62, 0, size * 0.42, tail !== false);
  let c = S.path(bd, { fill: '#000000', opacity: 0.22, transform: `translate(${f(size * 0.18)} ${f(size * 0.24)})` });
  c += S.path(bd, { fill, stroke: LINE, 'stroke-width': f(size * 0.14), 'stroke-linejoin': 'round' });
  c += S.path(`M${f(L + size * 0.6)} ${f(T_ + size * 0.24)} H${f(R_ - size * 0.6)}`, ln(f(size * 0.1), '#FFFFFF', 0.6));
  if (dotsMode) {
    for (let i = 0; i < 3; i++) c += S.circle(cx + (i - 1) * size * 0.8, T_ + bh / 2 - size * 0.18 * Math.max(0, Math.sin(t * 9 - i * 0.9)), size * 0.2, { fill: '#8A92A6' });
  } else if (g_ > 0.5) {
    const tx0 = L + padX;
    let off = 0, curLine = 0, curW = 0;
    let txt = '';
    lines.forEach((ln_, i) => {
      const shown = ln_.slice(0, clamp(n - off, 0, ln_.length));
      const yy = T_ + padY + size * 0.8 + i * lh;
      if (shown) {
        let body = shown;
        if (jolt > 0 && n - off <= ln_.length && n - off > 0) {   // the newest letter stomps in big
          body = shown.slice(0, -1);
          const lx = tx0 + textW(body, size, font);
          const ch = shown.slice(-1);
          const sc = 1 + 0.45 * jolt;
          txt += S.g((caps ? T : TF)(ch, 0, 0, size, ink, { 'text-anchor': 'start' }), `translate(${f(lx)} ${f(yy)}) scale(${f(sc)})`);
        }
        if (body) txt += (caps ? T : TF)(body, tx0, yy, size, ink, { 'text-anchor': 'start', ...(caps ? { 'letter-spacing': 1 } : {}) });
      }
      if (n >= off) { curLine = i; curW = textW(shown, size, font) + (caps ? shown.length : 0); }
      off += ln_.length + 1;
    });
    c += S.g(txt, null, g_ < 1 ? { opacity: f(seg(g_, 0.5, 1)) } : {});
    if (typed < 1 && Math.floor(t * 2.6) % 2 === 0) {
      const yy = T_ + padY + curLine * lh;
      c += S.rect(tx0 + curW + size * 0.08, yy + size * 0.08, size * 0.1, size * 0.86, size * 0.05, { fill: caps ? P.red : P.teal });
    }
  }
  if (user) {
    const uc = userColor(user), us = size * 0.7, uw = textW(user, us, 'F') + us * 1.2;
    c += S.g(S.rect(0, -us * 0.7, uw, us * 1.4, us * 0.7, ol(uc, size * 0.1)) + TF(user, uw / 2, us * 0.36, us, '#FFFFFF', stroked(us * 0.18)), `translate(${f(L + size * 0.4)} ${f(T_ - size * 0.08)}) rotate(-3)`);
  }
  if (caps && !dotsMode) {
    const cs = size * 0.5, cw = textW('CAPS LOCK', cs, 'F') + cs * 2.2;
    const blink = Math.floor(t * 4) % 2 === 0;
    c += S.g(S.rect(-cw, -cs * 0.75, cw, cs * 1.5, cs * 0.75, ol(P.red, size * 0.08)) + S.circle(-cw + cs * 0.85, 0, cs * 0.32, { fill: blink ? '#7CFF8A' : '#2E8A3E', stroke: LINE, 'stroke-width': 2 }) +
      TF('CAPS LOCK', -cw / 2 + cs * 0.45, cs * 0.36, cs, '#FFFFFF'), `translate(${f(R_ + size * 0.2)} ${f(T_ - size * 0.05)}) rotate(6)`);
  }
  const kk = pop(k), bk = bumpK(k);
  const jx = jolt * size * 0.06 * (Math.floor(nf) % 2 ? 1 : -1), jy = -jolt * size * 0.08;
  const sx = s * kk * (1 + 0.08 * bk + 0.025 * jolt), sy = s * kk * (1 - 0.05 * bk + 0.04 * jolt);
  const lift = -60 * s * ease.in(out);
  return S.g(c, `translate(${f(x + jx * s)} ${f(y + jy * s + lift)})${rot ? ` rotate(${f(rot)})` : ''} scale(${f(sx)} ${f(sy)})`, out > 0 || k < 0.3 ? { opacity: f(seg(k, 0, 0.3) * (1 - out)) } : {});
}

// chatSync(t, lineId, { from, to, lead, speed }) -> typed 0..1: the letters follow the voice line's spoken words, so a bubble
// with the line's text types along with the voice. from/to = word (string or index) range to sync over; lead = seconds the
// typing runs ahead (+) or behind (-) the voice.
function chatSync(t, lineId, o = {}) {
  const l = V.L(lineId);
  const ws = l.words;
  const norm = (w) => String(w).toLowerCase().replace(/[^a-z0-9#]/g, '');
  const idx = (w, d, from = 0) => (w === undefined ? d : typeof w === 'number' ? w : Math.max(from, ws.findIndex((x, i) => i >= from && norm(x[0]) === norm(w))));
  const i0 = idx(o.from, 0), i1 = idx(o.to, ws.length - 1, i0);
  const lead = o.lead || 0;
  let total = 0;
  const segs = ws.map(([w, a, b], i) => { const sg = { c0: total, n: w.length, a: a - lead, b: b - lead }; total += w.length + 1; return sg; });
  total -= 1;
  const c0 = segs[i0].c0, c1 = segs[i1].c0 + segs[i1].n;
  let n = c0;
  for (let i = i0; i <= i1; i++) {
    const sg = segs[i];
    if (t >= sg.b) n = sg.c0 + sg.n + (i < i1 ? 1 : 0);
    else { if (t > sg.a) n = sg.c0 + (sg.n * (t - sg.a)) / Math.max(0.04, sg.b - sg.a); break; }
  }
  if (o.from === undefined && o.to === undefined) return clamp(n / Math.max(1, total), 0, 1);
  return clamp((n - c0) / Math.max(1, c1 - c0), 0, 1);
}
// chatLine(t, lineId, { hold, pre, text, ...chatSync opts }) -> { text, typed, k, out } to spread into chatBubble():
// pops in `pre` s before the first word (0.3), types along with the voice, floats away `hold` s after the line (1.6).
function chatLine(t, lineId, o = {}) {
  const l = V.L(lineId);
  const { hold = 1.6, pre = 0.3 } = o;
  const text = o.text ?? l.text.replace(/["“”]/g, '');
  return { text, typed: chatSync(t, lineId, o), k: seg(t, l.a - pre, l.a - pre + 0.32), out: seg(t, l.b + hold, l.b + hold + 0.35) };
}

// flood presets: message pools for chatLog({ flood })
const FLOOD = {
  spacebar: ['SPACEBAR', 'spacebar', 'SPACEBAR!!!', 'space bar', 'its SPACEBAR', 'SPACE. BAR.', 'the long button', 'SPACEBAR lol', 'press space', 'lol is that ur dad', 'SPACEBAR', 'DAD!!', 'JUMP DAD', 'spacebar sir', 'SPACEBAR!!', 'bottom of keyboard', 'the BIG button', 'spacebar!!', 'SPACEBAR', 'omg', 'SPACE BAR', 'xD', 'SPACEBAR 100%', 'its spacebar mr hotdog'],
  lol: ['LOL', 'XD', 'DAD JOKE!!', 'lmao', 'HAHAHA', 'im crying', 'LOL', '10/10', 'XDDD', 'he fr said that', 'groan', 'LOLOL', 'DAD JOKE', 'best joke ever', 'XD', 'hahaha', 'lol is that ur dad', 'LOL!!'],
  dad: ['DAD!!', 'best dad', 'we love u dad', 'DAD DAD DAD', 'hot dog dad!!', 'DAD!!!', 'best dad ever', 'ily dad', 'can u be my dad', 'DAD', 'hotdog dad <3', 'DAD!!', 'legend', 'go dad', 'DAD FOR PRESIDENT'],
  jump: ['JUMP DAD', 'JUMP!!', 'JUMP DAD JUMP', 'u got this', 'GO DAD', 'JUMP!!!', 'GO HOT DOG', 'SPACEBAR!!', 'JUMP DAD!!', 'come on!!', 'JUMP', 'GO GO GO', 'JUMP DAD', 'dont fall', 'JUMP!!'],
  mix: ['lol is that ur dad', 'DAD!!', 'JUMP DAD', 'SPACEBAR', 'omg', 'xD', 'is that a hot dog', 'LOL', 'bro', 'who invited ur mom', 'GG', 'nice', 'brb', 'wait what', 'LOL'],
};
const FLOOD_USERS = ['noob_2011', 'PizzaKid', 'xX_Ninja_Xx', 'BloxyBea', 'CoolGuy77', 'ToastMan', 'Kitty4Ever', 'MegaJumper', 'LavaLord', 'BuilderBen', 'SkyRunner', 'Mr_Waffles', 'TacoTim', 'PixelPip', 'ObbyQueen', 'CubeKid9', 'SirLagsAlot', 'BananaBro', 'DinoDan', 'Sk8rGirl', 'BlockyBob', 'ZoomZoom', 'CookieCrumb', 'NotABot42'];
function floodMsg(i, set = 'spacebar', seed = 1) {
  const pool = Array.isArray(set) ? set : FLOOD[set] || FLOOD.mix;
  const user = FLOOD_USERS[Math.floor(hash(i * 3.7 + seed) * FLOOD_USERS.length)];
  return { user, text: pool[Math.floor(hash(i * 5.3 + seed * 2.1) * pool.length)] };
}
// chatLog({ x, y, w, h, lines:[{user, text, col, at, sys}], t, scroll, k, flood, floodSet, floodN, floodSeed, input, send, title, s, size })
//   The in-game chat window ((x, y) = top-left; bottom-left of the frame in game shots). Newest message at the bottom.
//   lines[].at = arrival time (s, absolute): the line slides in and flashes; lines without `at` are always there.
//   scroll = how many lines are in (fractional = the last one sliding in) when you don't use `at`.
//   sys: true (or no user) = a system line ("DadBod1978 joined the server"). col overrides the user colour.
//   flood 0..1: floodN (50) replies pour in after the lines (presets floodSet 'spacebar' | 'lol' | 'dad' | 'jump' | 'mix' or
//   an array of strings); the window shakes and a "+N" badge counts them.
//   input: { text, typed } shows the chat bar being typed (caps if the text is caps); send 0..1 = Enter flash.
function chatLog(o = {}) {
  const { x = 40, y = 560, w = 640, h = 380, t = 0, lines = [], s = 1, size = 30, title = 'Chat' } = o;
  const k = clamp(o.k ?? 1, 0, 1);
  if (k <= 0.001) return '';
  const flood = clamp(o.flood || 0, 0, 1);
  const pad = 18, inputH = 56, headH = 0, lh = size * 1.22;
  let msgs = [];
  lines.forEach((l) => { if (l.at === undefined || t >= l.at) msgs.push({ ...l, u: l.at === undefined ? 1 : clamp((t - l.at) / 0.22, 0, 1) }); });
  if (o.scroll !== undefined) { const sc = clamp(o.scroll, 0, msgs.length); msgs = msgs.slice(0, Math.ceil(sc - 1e-6)); if (msgs.length) msgs[msgs.length - 1].u = Math.min(msgs[msgs.length - 1].u, sc - (msgs.length - 1)); }
  const floodN = o.floodN || 50;
  const nf = flood * floodN;
  if (flood > 0) {
    const first = Math.max(0, Math.ceil(nf) - 14);
    for (let i = first; i < Math.ceil(nf - 1e-6); i++) msgs.push({ ...floodMsg(i, o.floodSet, o.floodSeed || 1), u: clamp(nf - i, 0, 1) * 1, flood: true });
  }
  // layout from the bottom up
  const areaT = pad, areaB = h - inputH - pad * 0.6, areaW = w - pad * 2;
  const items = [];
  let yb = areaB;
  for (let i = msgs.length - 1; i >= 0 && yb > areaT - lh; i--) {
    const m = msgs[i];
    const sys = m.sys || !m.user;
    const name = sys ? '' : `${m.user}:`;
    const nw = name ? textW(name, size, 'F') + size * 0.35 : 0;
    const wl = wrap(m.text, Math.max(80, areaW - nw), size, 'F');
    const hh = wl.length * lh;
    items.push({ m, name, nw, wl, y0: yb - hh, sys });
    yb -= hh + size * 0.18;
  }
  // slide: unfinished arrivals push everything down by their missing height
  let slide = 0;
  for (const it of items) if (it.m.u < 1) slide += (1 - ease.out(it.m.u)) * (it.wl.length * lh + size * 0.18);
  const cid = S.uid('guChat');
  let body = '';
  for (const it of items) {
    const yy = it.y0 + slide;
    const ucol = it.m.col || (it.sys ? USERS.SYSTEM.col : userColor(it.m.user));
    if (it.m.u < 1 && !it.m.flood) body += S.rect(pad - 8, yy - 4, areaW + 16, it.wl.length * lh + 6, 10, { fill: '#FFFFFF', opacity: f(0.22 * (1 - it.m.u)) });
    if (it.sys) body += isoCube(pad + size * 0.4, yy + size * 0.52, size * 0.36, [P.goldL, P.orange, P.orangeD], 2);
    if (it.name) body += TF(it.name, pad, yy + size * 0.9, size, ucol, stroked(size * 0.16, '#0B1020', { 'text-anchor': 'start' }));
    it.wl.forEach((lt, j) => { body += T6(lt, pad + (it.sys ? size * 0.95 : it.nw), yy + size * 0.9 + j * lh, size, it.sys ? ucol : '#FFFFFF', stroked(size * 0.16, '#0B1020', { 'text-anchor': 'start' })); });
  }
  const shake = flood > 0 && o.shake !== false ? Math.sin(t * 61) * 5 * Math.min(1, flood * 4) * (1 - seg(flood, 0.85, 1) * 0.6) : 0;
  let c = S.rect(8, 10, w, h, 24, { fill: '#000000', opacity: 0.22 });
  c += S.rect(0, 0, w, h, 24, { fill: P.navy, opacity: 0.8, stroke: LINE, 'stroke-width': 5 });
  c += S.rect(5, 5, w - 10, h - 10, 20, { fill: 'none', stroke: P.teal, 'stroke-width': 3, opacity: 0.55 });
  c += S.clipDef(cid, S.rect(4, 6, w - 8, h - inputH - 10, 18)) + S.g(body, null, { 'clip-path': `url(#${cid})` });
  // tab
  const tw_ = textW(title, 26, 'F') + 70;
  c += S.g(S.rect(0, -22, tw_, 44, 22, ol(P.teal, 5)) + S.path('M18 -12 H44 Q50 -12 50 -6 V6 Q50 12 44 12 H30 L22 19 V12 H18 Q12 12 12 6 V-6 Q12 -12 18 -12 Z', ol('#FFFFFF', 3)) + TF(title, 58, 9, 26, '#FFFFFF', { 'text-anchor': 'start' }), 'translate(18 -4)');
  if (flood > 0.05) {
    const nn = Math.round(nf), bs = 1 + 0.15 * Math.sin(t * 14);
    c += S.g(S.rect(-46, -22, 92, 44, 22, ol(P.red, 5)) + TF(`+${nn}`, 0, 10, 28, '#FFFFFF'), `translate(${f(tw_ + 76)} -4) scale(${f(bs)})`);
  }
  // input bar
  const ib = h - inputH - 4;
  c += S.rect(10, ib, w - 20, inputH - 6, 16, { fill: '#0E1428', opacity: 0.9, stroke: P.navy3, 'stroke-width': 3 });
  if (o.input && o.input.text) {
    const it = o.input, txt = String(it.text), nn = Math.round(clamp(it.typed ?? 1, 0, 1) * txt.length), shown = txt.slice(0, nn);
    const isCaps = txt === txt.toUpperCase() && /[A-Z]/.test(txt);
    const fs_ = size * 0.95;
    let sh = shown, tx = 28;
    const maxw = w - 70;
    while (textW(sh, fs_, isCaps ? 'L' : 'F') > maxw && sh.length > 1) sh = sh.slice(1);
    c += (isCaps ? T : TF)(sh, tx, ib + inputH / 2 + fs_ * 0.3, fs_, '#FFFFFF', { 'text-anchor': 'start' });
    if (nn <= txt.length && Math.floor(t * 2.6) % 2 === 0) c += S.rect(tx + textW(sh, fs_, isCaps ? 'L' : 'F') + 4, ib + 12, 4, inputH - 30, 2, { fill: P.teal });
  } else c += T6('Press / to chat', 28, ib + inputH / 2 + size * 0.28, size * 0.9, '#6E7A9C', { 'text-anchor': 'start' });
  const send = clamp(o.send || 0, 0, 1);
  if (send > 0 && send < 1) c += S.rect(10, ib, w - 20, inputH - 6, 16, { fill: P.teal, opacity: f(0.6 * (1 - send)) });
  const kk = pop(k);
  return S.g(c, `translate(${f(x + shake * s - (1 - ease.out(k)) * 120)} ${f(y)}) scale(${f(s * (0.6 + 0.4 * kk))})`, k < 1 ? { opacity: f(seg(k, 0, 0.4)) } : {});
}

// ================================================================ 2. SERVER MESSAGES
// joinToast({ x, y, k, user, text, t, out, s, anchor, col, who, icon, big })
//   "DadBod1978 joined the server": navy glass card, portrait + green "+" badge, user in colour. (x, y) = the anchor edge
//   centre (anchor 'right' default = slides in from the right edge; 'left'; 'center' pops). k 0..1 in; out 0..1 away.
//   icon: a portrait key ('dad', 'mom', 'cube'...) or an svg drawn in the 100-unit circle (centre 0,0) instead of the
//   portrait (default: the user's portrait if known, else a generic head). ~0.35 s in.
function joinToast(o = {}) {
  const { x = 1880, y = 140, user = 'DadBod1978', text = 'joined the server', t = 0, s = 1, anchor = 'right', size = 36 } = o;
  const k = clamp(o.k ?? 1, 0, 1), out = clamp(o.out || 0, 0, 1);
  if (k <= 0.001 || out >= 1) return '';
  const uc = o.col || userColor(user), who = o.who ?? userWho(user);
  const uw = textW(user, size, 'L'), tw = textW(' ' + text, size * 0.86, 'F');
  const Hh = 100, Wd = 128 + uw + tw + 40;
  const x0 = anchor === 'left' ? 0 : anchor === 'right' ? -Wd : -Wd / 2;
  let c = S.rect(x0 + 8, -Hh / 2 + 10, Wd, Hh, 26, { fill: '#000000', opacity: 0.24 });
  c += S.rect(x0, -Hh / 2, Wd, Hh, 26, { fill: P.navy, opacity: 0.93, stroke: LINE, 'stroke-width': 6 });
  c += S.rect(x0 + 7, -Hh / 2 + 7, Wd - 14, Hh - 14, 20, { fill: 'none', stroke: P.teal, 'stroke-width': 3.5, opacity: 0.7 });
  c += S.rect(x0, -Hh / 2, 16, Hh, 0, { fill: uc, opacity: 0.0 });
  c += o.icon && String(o.icon).includes('<') ? S.g(S.circle(0, 0, 50, ol(PORTRAIT_BG.cube, 6)) + o.icon, tr(x0 + 62, 0, 0.72)) : portrait(o.icon || who, x0 + 62, 0, 36, { col: uc });
  const bk = ease.outBack(seg(k, 0.35, 0.75));
  if (bk > 0) c += S.g(S.circle(0, 0, 16, ol(P.green, 4)) + S.path('M-8 0 H8 M0 -8 V8', ln(5, '#FFFFFF')), tr(x0 + 92, 26, bk));
  c += T(user, x0 + 118, size * 0.36, size, uc, stroked(size * 0.2, '#0B1020', { 'text-anchor': 'start' }));
  c += TF(text, x0 + 118 + uw + size * 0.24, size * 0.34, size * 0.86, '#FFFFFF', { 'text-anchor': 'start' });
  const sh = seg(k, 0.5, 1);
  if (sh > 0 && sh < 1) {
    const cid = S.uid('guToast');
    const sx = x0 - 140 + (Wd + 280) * sh;
    c += S.clipDef(cid, S.rect(x0, -Hh / 2, Wd, Hh, 26)) + S.g(S.path(`M${f(sx)} ${-Hh / 2} h80 l-50 ${Hh} h-80 Z`, { fill: 'url(#guSheen)', opacity: 0.6 }), null, { 'clip-path': `url(#${cid})` });
  }
  const dir = anchor === 'right' ? 1 : anchor === 'left' ? -1 : 0;
  const dx = dir * (1 - ease.outBack(k)) * (Wd + 60) + dir * ease.in(out) * (Wd * 0.6);
  const sc = s * (dir ? 1 : pop(k)) * (1 - 0.15 * out);
  return S.g(c, `translate(${f(x + dx * s)} ${f(y)}) scale(${f(sc)})`, { opacity: f(seg(k, 0, 0.2) * (1 - out)) });
}
// joinStack(t, items:[{user, at, text, who, icon, col}], { x, y, gap, hold, dir, s, anchor, size }) — a feed of joinToasts:
// each enters at `at`, stays `hold` s (4), leaves; the others slide to close the gap. dir 1 = newer below (default), -1 = above.
function joinStack(t, items = [], o = {}) {
  const { x = 1880, y = 120, gap = 116, hold = 4, dir = 1, s = 1, anchor = 'right', size } = o;
  let out = '', slot = 0;
  for (const it of items) {
    if (t < it.at) continue;
    const kIn = seg(t, it.at, it.at + 0.4), kOut = seg(t, it.at + (it.hold ?? hold), it.at + (it.hold ?? hold) + 0.35);
    if (kOut >= 1) continue;
    const yy = y + dir * slot * gap * s;
    out += joinToast({ x, y: yy, k: kIn, out: kOut, t, s, anchor, size, ...it });
    slot += ease.inOut(1 - kOut) * ease.out(clamp(kIn * 2, 0, 1));
  }
  return out;
}
// alarmEdges(t, k) — pulsing red light on all four frame edges (screen space; cheap linear gradients)
function alarmEdges(t, k = 1, o = {}) {
  if (k <= 0) return '';
  const { size = 190, rate = 3.2 } = o;
  const p = k * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * rate * Math.PI * 2)));
  return S.g(S.rect(0, 0, W, size, 0, { fill: 'url(#guEdgeT)' }) + S.rect(0, H - size, W, size, 0, { fill: 'url(#guEdgeB)' }) +
    S.rect(0, 0, size, H, 0, { fill: 'url(#guEdgeL)' }) + S.rect(W - size, 0, size, H, 0, { fill: 'url(#guEdgeR)' }), null, { opacity: f(p) });
}
const BANNER = {
  info: { band: 'url(#guTealV)', flat: P.teal, dark: P.tealDD, text: '#FFFFFF', sub: '#E6FFFB', icon: 'cube' },
  party: { band: 'url(#guPurpleV)', flat: P.purple, dark: P.purpleD, text: '#FFFFFF', sub: '#F1E6FF', icon: 'party' },
  alarm: { band: 'url(#guRedV)', flat: P.red, dark: '#7A0E1E', text: '#FFFFFF', sub: '#FFE14D', icon: 'warn' },
  victory: { band: 'url(#guGoldV)', flat: P.gold, dark: '#B86A00', text: '#FFFFFF', sub: P.ink, icon: 'star' },
};
// systemBanner({ k, text, theme:'info'|'party'|'alarm'|'victory', t, sub, x, y, w, s, out, size })
//   Big ribbon across the top of the frame: "Party formed: The Family" (party), "Warning! The Block King has awakened!"
//   (alarm: hazard stripes, blinking, shake — add alarmEdges for the red edge pulse), "VICTORY! Server saved!" (victory).
//   k 0..1 unfurls it from the centre (~0.5 s) and pops the text; out 0..1 folds it away. text may contain '\n'.
function systemBanner(o = {}) {
  const { text = 'Party formed: The Family', theme = 'info', t = 0, sub = '', x = 960, y = 190, s = 1, size = 76 } = o;
  const k = clamp(o.k ?? 1, 0, 1), out = clamp(o.out || 0, 0, 1);
  if (k <= 0.001 || out >= 1) return '';
  const th = BANNER[theme] || BANNER.info;
  const lines = String(text).split('\n');
  const lsz = lines.map((l, i) => (lines.length > 1 && i === 0 ? size * 1.25 : size));
  const tw = Math.max(...lines.map((l, i) => textW(l, lsz[i], 'L')), sub ? textW(sub, size * 0.56, 'F') : 0);
  const padY = theme === 'alarm' ? 64 : 40;
  const Wd = o.w || Math.max(900, tw + 420), Hh = lsz.reduce((a, b) => a + b * 1.08, 0) + (sub ? size * 0.8 : 0) + padY * 2 - size * 0.12;
  const un = ease.outBack(seg(k, 0, 0.55)), tk = pop(seg(k, 0.3, 0.8));
  const alarm = theme === 'alarm';
  const blink = alarm ? (Math.floor(t * 5) % 2 ? 1 : 0.55) : 1;
  let c = '';
  if (theme === 'victory') {
    let rays = '';
    for (let i = 0; i < 16; i++) { const a0 = (i / 16) * Math.PI * 2 + t * 0.3, a1 = a0 + 0.11; rays += `M0 0 L${f(Math.cos(a0) * 900)} ${f(Math.sin(a0) * 420)} L${f(Math.cos(a1) * 900)} ${f(Math.sin(a1) * 420)} Z`; }
    c += S.path(rays, { fill: '#FFF3B0', opacity: f(0.3 * tk) });
  }
  // ribbon tails
  const tailW = 120, tailY = Hh * 0.22;
  for (const sd of [-1, 1]) {
    const ex = sd * (Wd / 2 - 30), fx = sd * (Wd / 2 + tailW);
    c += S.path(`M${f(ex)} ${f(-Hh / 2 + tailY)} L${f(fx)} ${f(-Hh / 2 + tailY)} L${f(fx - sd * 50)} ${f(tailY / 2 + 10)} L${f(fx)} ${f(Hh / 2 + tailY)} L${f(ex)} ${f(Hh / 2 + tailY)} Z`, ol(th.dark, 6));
    c += S.path(`M${f(ex)} ${f(Hh / 2)} L${f(sd * (Wd / 2 - 30))} ${f(Hh / 2 + tailY)} L${f(sd * (Wd / 2 - 90))} ${f(Hh / 2)} Z`, { fill: darker(th.dark, 0.35), stroke: LINE, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  }
  c += S.rect(-Wd / 2 + 10, -Hh / 2 + 12, Wd, Hh, 22, { fill: '#000000', opacity: 0.25 });
  c += S.rect(-Wd / 2, -Hh / 2, Wd, Hh, 22, { fill: th.band, stroke: LINE, 'stroke-width': 7 });
  if (alarm) {
    c += S.rect(-Wd / 2 + 4, -Hh / 2 + 4, Wd - 8, 26, 0, { fill: 'url(#guHazard)' }) + S.rect(-Wd / 2 + 4, Hh / 2 - 30, Wd - 8, 26, 0, { fill: 'url(#guHazard)' });
    c += S.path(`M${f(-Wd / 2 + 4)} ${f(-Hh / 2 + 30)} H${f(Wd / 2 - 4)} M${f(-Wd / 2 + 4)} ${f(Hh / 2 - 30)} H${f(Wd / 2 - 4)}`, ln(5, LINE));
    c += S.rect(-Wd / 2, -Hh / 2, Wd, Hh, 22, { fill: '#FFFFFF', opacity: f(0.18 * (1 - blink)) });
  } else c += S.path(`M${f(-Wd / 2 + 24)} ${f(-Hh / 2 + 14)} H${f(Wd / 2 - 24)}`, ln(8, '#FFFFFF', 0.4));
  // icons at both ends
  const ic = (sd) => {
    const ix = sd * (Wd / 2 - 80);
    if (th.icon === 'warn') { const sc = 1 + 0.12 * blink; return S.g(S.path('M0 -46 L50 40 L-50 40 Z', ol('#FFD23F', 7)) + S.path('M0 -16 V12', ln(11)) + S.circle(0, 27, 6, { fill: LINE }), tr(ix, 0, sc)); }
    if (th.icon === 'star') return S.path(star5(ix, 0, 46), ol('#FFFFFF', 6)) + S.path(star5(ix, 0, 26), { fill: P.gold });
    if (th.icon === 'party') return [-1, 0, 1].map((j) => portrait([null, 'you', null][j + 1] || 'cube', ix + j * 26, j ? 10 : -6, 26, { col: j < 0 ? P.pink : P.gold })).join('');
    return isoCube(ix, 0, 40, [P.goldL, P.orange, P.orangeD], 6);
  };
  c += S.g(ic(-1) + ic(1), null, { opacity: f(tk) });
  let tx = '';
  let ty = -Hh / 2 + padY;
  lines.forEach((l, i) => { ty += lsz[i] * 0.8; tx += T(l, 0, ty, lsz[i], th.text, stroked(lsz[i] * 0.2, LINE, { 'letter-spacing': 1 })); ty += lsz[i] * 0.28; });
  if (sub) tx += TF(sub, 0, ty + size * 0.56, size * 0.56, th.sub, theme === 'victory' ? {} : stroked(size * 0.11));
  c += S.g(tx, `scale(${f(tk)})`);
  const sh = alarm ? Math.sin(t * 47) * 6 * (0.4 + 0.6 * (1 - seg(k, 0.6, 1))) : 0;
  return S.g(c, `translate(${f(x + sh)} ${f(y - (1 - ease.out(k)) * 40)}) scale(${f(s * un)} ${f(s * (1 - out) * (0.7 + 0.3 * un))})`, { opacity: f(seg(k, 0, 0.15) * (1 - out * out)) });
}

// ================================================================ 3. NAMETAGS
// head tops above the feet in body units (actor s 1, built-in nametag off) — measured from rig/cast.js; re-measure if the
// cast changes (tools/gameui_sheet.js renders them together)
const HEAD_TOP = { you: 946, dad: 1062, mom: 1118, grandma: 956, darkbladeMom: 1228, clan: 958, dadAvatar: 1238, momAvatar: 906, grandmaAvatar: 988, noodle: 1158, darkblade: 1018, player: 972, noob: 704, kid: 700 };
// overHead(x, y, s, who | { who, tagGap, chatGap, lift }) -> { x, head, tag, chat }: y positions over an actor (feet x, y,
// actor scale s, cast key who): the head top, a nametag centre and a chat-bubble tail tip (above the nametag). Gaps are in
// screen px (for a nametag at s ≈ 0.8–1); scale them with the UI if you zoom.
function overHead(x, y, s = 0.5, o = {}) {
  if (typeof o === 'string') o = { who: o };
  const head = y - (o.lift || 0) - (HEAD_TOP[o.who] ?? 950) * s;
  return { x, head, tag: head - (o.tagGap ?? 40), chat: head - (o.chatGap ?? 96) };
}
// nametag({ x, y, s, name, level, col, k, t, crown, hp, who, bob, portrait })
//   Floating name over an avatar: navy pill, name in white, coloured underline + rim, gold LVL chip, optional crown
//   (YOU · LVL 99), hp 0..1 bar under it, a mini portrait. who: 'you'|'dad'|'mom'|'granny'|'noodle'|'darkblade' fills
//   name/level/colour from the cast (YOU, DadBod1978, MOM_OFFICIAL, GrannyGoodies, NoodleBoi, xX_DarkBlade_Xx).
function nametag(o = {}) {
  const preset = o.who ? USERS[WHO_NAME[o.who]] || {} : USERS[o.name] || {};
  const name = o.name ?? (o.who ? WHO_NAME[o.who] : 'Player');
  const { x = 960, y = 300, s = 1, t = 0, size = 34, bob = true } = o;
  const level = o.level === undefined ? preset.level : o.level;
  const col = o.col || preset.col || userColor(name);
  const crownOn = o.crown ?? !!preset.crown;
  const k = clamp(o.k ?? 1, 0, 1);
  if (k <= 0.001) return '';
  const nw = textW(name, size, 'F');
  const lvTxt = level !== undefined && level !== null ? String(level) : '';
  const lvW = lvTxt ? textW(lvTxt, size * 0.8, 'L') + size * 1.9 : 0;
  const hasP = o.portrait;
  const Wd = nw + size * 1.2 + (hasP ? size * 1.3 : 0), Hh = size * 1.5;
  const x0 = -(Wd + lvW * 0.85) / 2;
  let c = S.rect(x0 + 5, -Hh / 2 + 7, Wd, Hh, Hh / 2, { fill: '#000000', opacity: 0.2 });
  c += S.rect(x0, -Hh / 2, Wd, Hh, Hh / 2, { fill: P.navy, opacity: 0.84, stroke: LINE, 'stroke-width': size * 0.14 });
  c += S.rect(x0 + 4, -Hh / 2 + 4, Wd - 8, Hh - 8, Hh / 2 - 4, { fill: 'none', stroke: col, 'stroke-width': size * 0.1, opacity: 0.9 });
  let nx = x0 + size * 0.6;
  if (hasP) { c += portrait(o.who || userWho(name), nx + size * 0.45, 0, size * 0.56, { col }); nx += size * 1.3; }
  c += TF(name, nx, size * 0.34, size, '#FFFFFF', { 'text-anchor': 'start' });
  c += S.path(`M${f(nx)} ${f(size * 0.52)} H${f(nx + nw)}`, ln(f(size * 0.09), col, 0.9));
  if (lvTxt) {
    const lx = x0 + Wd - size * 0.25, lw = lvW;
    c += S.rect(lx, -Hh * 0.46, lw, Hh * 0.92, Hh * 0.3, { fill: 'url(#guGoldV)', stroke: LINE, 'stroke-width': size * 0.13 });
    c += TF('LVL', lx + size * 0.18, size * 0.22, size * 0.42, P.ink, { 'text-anchor': 'start' });
    c += T(lvTxt, lx + size * 1.15, size * 0.3, size * 0.8, P.ink, { 'text-anchor': 'start' });
    if (crownOn) c += crown(lx + lw / 2, -Hh * 0.42, size * 0.42, P.gold, size * 0.08);
  } else if (crownOn) c += crown(0, -Hh * 0.5, size * 0.5, P.gold, size * 0.09);
  if (o.hp !== undefined) {
    const hw = Wd * 0.8, hx = x0 + (Wd - hw) / 2, hy = Hh / 2 + size * 0.22, v = clamp(o.hp, 0, 1);
    const hc = v > 0.5 ? P.green : v > 0.25 ? P.gold : P.red;
    c += S.rect(hx, hy, hw, size * 0.34, size * 0.17, { fill: '#0E1428', stroke: LINE, 'stroke-width': size * 0.08 }) + (v > 0 ? S.rect(hx + 3, hy + 3, Math.max(size * 0.2, (hw - 6) * v), size * 0.34 - 6, size * 0.14, { fill: hc }) : '');
  }
  const by = bob ? Math.sin(t * 2.4 + x * 0.01) * 3 : 0;
  return S.g(c, `translate(${f(x)} ${f(y + by * s)}) scale(${f(s * pop(k))})`, k < 1 ? { opacity: f(seg(k, 0, 0.3)) } : {});
}

// ================================================================ 4. LEADERBOARD
const MEDAL = { 1: [P.gold, P.goldD], 2: ['#DDE3EE', '#9AA4B8'], 3: ['#F0A860', '#B8692A'] };
function rankBadge(x, y, r, rank, o = {}) {
  const m = MEDAL[rank];
  const txt = `#${rank}`;
  const sz = r * (txt.length > 3 ? 0.62 : txt.length > 2 ? 0.78 : 0.95);
  if (m) return S.circle(x, y, r, ol(m[0], Math.max(3, r * 0.14))) + S.circle(x, y, r * 0.74, { fill: 'none', stroke: m[1], 'stroke-width': f(r * 0.1) }) + T(String(rank), x, y + r * 0.36, r * 1.05, P.ink);
  return S.circle(x, y, r, ol(o.bg || P.navy3, Math.max(3, r * 0.14))) + T(txt, x, y + sz * 0.36, sz, '#FFFFFF');
}
// leaderboard({ x, y, w, h, rows:[{rank, name, score, crown, from, scoreFrom, who, col}], k, t, highlight, roll, style,
//   title, unit, s, nShow, stand, lights })
//   style 'board' = the giant in-world billboard (marquee bulbs, gold header, portraits; (x, y) = its centre, default
//   1100x860 — `stand: true` adds two posts down to y + h/2 + stand px). style 'hud' = small top-right panel (x, y = top-right).
//   Rank changes: give rows a `from` (old rank) and animate roll 0..1 — rows slide from their old order to the new one
//   (a row from far below enters from the bottom edge), the rank number rolls (#500 -> #1). highlight = name (or rank) of
//   the row to glow (orange). scoreFrom rolls the score too. crown: true puts a crown on #1 (default for rank 1).
function leaderboard(o = {}) {
  const { t = 0, style = 'board', title = 'LEADERBOARD', unit = 'WINS', s = 1, rows = [] } = o;
  const k = clamp(o.k ?? 1, 0, 1);
  if (k <= 0.001) return '';
  const hud = style === 'hud';
  const w = o.w || (hud ? 460 : 1100), h = o.h || (hud ? 330 : 860);
  const x = o.x ?? (hud ? 1880 : 960), y = o.y ?? (hud ? 40 : 440);
  const nShow = o.nShow || Math.min(rows.length, hud ? 5 : 5);
  const roll = ease.inOut(clamp(o.roll ?? 1, 0, 1));
  const headH = hud ? 56 : 150, colH = hud ? 0 : 50, pad = hud ? 10 : 34;
  const x0 = hud ? -w : -w / 2, y0 = hud ? 0 : -h / 2;
  const rowsT = y0 + headH + colH + pad * 0.5, rowsB = y0 + h - pad;
  const rowH = (rowsB - rowsT) / nShow;
  const hiKey = o.highlight;
  const isHi = (r) => hiKey !== undefined && (r.name === hiKey || r.rank === hiKey);
  const byFrom = [...rows].sort((a, b) => (a.from ?? a.rank) - (b.from ?? b.rank));
  const byTo = [...rows].sort((a, b) => a.rank - b.rank);
  const maxRank = Math.max(...rows.map((r) => r.rank));
  const offBoard = (r) => r.from !== undefined && r.from > maxRank + 1;   // e.g. #500 -> #1: slides in from below the edge
  let c = '';
  if (!hud && o.stand) {
    const sh = o.stand === true ? 300 : o.stand;
    for (const sd of [-1, 1]) c += S.rect(sd * w * 0.3 - 26, y0 + h - 20, 52, sh + 20, 6, ol('#3A3F52', 7)) + S.rect(sd * w * 0.3 - 26, y0 + h + 40, 52, 18, 0, { fill: '#2A2E3D' });
  }
  c += S.rect(x0 + 12, y0 + 14, w, h, hud ? 20 : 36, { fill: '#000000', opacity: 0.28 });
  c += S.rect(x0, y0, w, h, hud ? 20 : 36, { fill: hud ? P.navy : 'url(#guNavyV)', opacity: hud ? 0.86 : 1, stroke: LINE, 'stroke-width': hud ? 5 : 10 });
  if (!hud) {
    c += S.rect(x0 + 18, y0 + 18, w - 36, h - 36, 24, { fill: 'none', stroke: P.navy3, 'stroke-width': 6 });
    if (o.lights !== false) {   // marquee bulbs chasing around the frame
      const per = 2 * (w + h) - 120, nb = Math.floor(per / 62);
      let on = '', off = '';
      const step = Math.floor(t * 7);
      for (let i = 0; i < nb; i++) {
        let d = (i / nb) * per, bx, by;
        const ww = w - 60, hh = h - 60;
        if (d < ww) { bx = x0 + 30 + d; by = y0 + 9; } else if ((d -= ww) < hh) { bx = x0 + w - 9; by = y0 + 30 + d; } else if ((d -= hh) < ww) { bx = x0 + w - 30 - d; by = y0 + h - 9; } else { d -= ww; bx = x0 + 9; by = y0 + h - 30 - d; }
        if ((i + step) % 3 === 0) on += ring(bx, by, 9); else off += ring(bx, by, 7);
      }
      c += S.path(off, { fill: '#8A6A2A', stroke: LINE, 'stroke-width': 3 }) + S.path(on, { fill: '#FFF3B0', stroke: LINE, 'stroke-width': 3 });
    }
    // header plaque
    const pw = Math.min(w - 120, textW(title, 92, 'L') + 260);
    c += S.rect(-pw / 2, y0 + 30, pw, 104, 26, { fill: 'url(#guGoldV)', stroke: LINE, 'stroke-width': 8 });
    c += S.path(`M${f(-pw / 2 + 24)} ${f(y0 + 44)} H${f(pw / 2 - 24)}`, ln(7, '#FFFFFF', 0.55));
    c += T(title, 0, y0 + 112, 84, P.ink, { 'letter-spacing': 2 });
    c += crown(-pw / 2 + 64, y0 + 108, 30, P.white, 5) + crown(pw / 2 - 64, y0 + 108, 30, P.white, 5);
    c += TF('RANK', x0 + pad + 46, y0 + headH + 34, 26, P.navyL, { 'letter-spacing': 3 }) + TF('PLAYER', x0 + pad + 250, y0 + headH + 34, 26, P.navyL, { 'letter-spacing': 3, 'text-anchor': 'start' }) +
      TF(unit, x0 + w - pad - 30, y0 + headH + 34, 26, P.navyL, { 'letter-spacing': 3, 'text-anchor': 'end' });
  } else {
    c += S.rect(x0, y0, w, headH, 20, { fill: 'url(#guTealV)', stroke: LINE, 'stroke-width': 5 }) + S.rect(x0 + 2.5, y0 + headH - 22, w - 5, 20, 0, { fill: P.teal });
    c += S.path(`M${x0} ${y0 + headH} H${x0 + w}`, ln(5));
    c += crown(x0 + 34, y0 + 40, 15, P.gold, 3) + TF(title, x0 + 60, y0 + 38, 28, '#FFFFFF', stroked(5, LINE, { 'text-anchor': 'start', 'letter-spacing': 1 })) + TF(unit, x0 + w - 18, y0 + 37, 20, P.tealDD, { 'text-anchor': 'end' });
  }
  // rows
  const cid = S.uid('guLb');
  const slotY = (i) => rowsT + i * rowH;
  let body = '', hiBody = '';
  const fs = hud ? rowH * 0.5 : rowH * 0.42;
  for (const r of rows) {
    const iF = offBoard(r) ? nShow + 0.4 : Math.min(byFrom.filter((q) => !offBoard(q)).indexOf(r), nShow + 0.4), iT = Math.min(byTo.indexOf(r), nShow + 0.4);
    const moving = r.from !== undefined && r.from !== r.rank;
    const yy = lerp(slotY(iF), slotY(iT), roll);
    if (yy > rowsB + 4 || yy < rowsT - rowH) continue;
    const hi = isHi(r);
    const rank = moving ? Math.round(lerp(r.from, r.rank, ease.out(clamp(o.roll ?? 1, 0, 1)))) : r.rank;
    const score = r.scoreFrom !== undefined ? lerp(r.scoreFrom, r.score, ease.out(clamp(o.roll ?? 1, 0, 1))) : r.score;
    const who = r.who ?? userWho(r.name);
    const uc = r.col || userColor(r.name);
    let rc = '';
    const rx = x0 + pad, rw = w - pad * 2, rh = rowH * 0.86, ry = yy + rowH * 0.07;
    const first = rank === 1;
    const fill = hi ? (hud ? P.orange : 'url(#guOrangeV)') : first ? (hud ? '#3B3320' : '#4A3F1E') : '#24304F';
    rc += S.rect(rx, ry, rw, rh, rh * 0.3, { fill, stroke: hi ? LINE : first ? P.gold : P.navy3, 'stroke-width': hi ? (hud ? 4 : 6) : hud ? 2 : 4 });
    if (hi) { const pu = 0.5 + 0.5 * Math.sin(t * 7); rc += S.rect(rx - 6, ry - 6, rw + 12, rh + 12, rh * 0.36, { fill: 'none', stroke: P.gold, 'stroke-width': hud ? 3 : 6, opacity: f(0.5 + 0.5 * pu) }); }
    const cy = ry + rh / 2;
    if (hud) {
      rc += T(`#${rank}`, rx + 14, cy + fs * 0.36, fs, first ? P.gold : '#FFFFFF', { 'text-anchor': 'start' });
      const scW = textW(R.fmt(score), fs, 'L') + 24, crW = (r.crown ?? first) ? 34 : 0;
      const nm = fitText(r.name, rw - 14 - fs * 2.6 - scW - crW - 8, fs * 0.9);
      rc += TF(nm.text, rx + 14 + fs * 2.6, cy + nm.size * 0.36, nm.size, hi ? '#FFFFFF' : uc, { 'text-anchor': 'start', ...(hi ? stroked(4) : {}) });
      if (r.crown ?? first) rc += crown(rx + 14 + fs * 2.6 + textW(nm.text, nm.size, 'F') + 22, cy + 8, 11, P.gold, 2.5);
      rc += T(R.fmt(score), rx + rw - 12, cy + fs * 0.36, fs, '#FFFFFF', { 'text-anchor': 'end' });
    } else {
      rc += rankBadge(rx + 46, cy, rh * 0.38, rank);
      if (who !== null || r.portrait) rc += portrait(who, rx + 136, cy, rh * 0.38, { col: uc, gold: r.gold });
      const nx = rx + 190;
      const sc = R.fmt(score);
      const nm = fitText(r.name, rw - 190 - textW(sc, fs * 1.1, 'L') - 60 - ((r.crown ?? first) ? fs * 1.3 : 0), fs);
      rc += TF(nm.text, nx, cy + nm.size * 0.36, nm.size, hi ? '#FFFFFF' : uc, stroked(nm.size * 0.14, '#0B1020', { 'text-anchor': 'start' }));
      if (r.crown ?? first) rc += crown(nx + textW(nm.text, nm.size, 'F') + 44, cy + fs * 0.25, fs * 0.5, P.gold, 4);
      rc += T(sc, rx + rw - 30, cy + fs * 0.4, fs * 1.1, first ? P.gold : '#FFFFFF', stroked(fs * 0.12, '#0B1020', { 'text-anchor': 'end' }));
      if (moving && roll > 0 && roll < 1) rc += S.path(`M${f(rx + rw + 22)} ${f(cy + 20)} l18 -30 l18 30 Z`, ol(P.green, 4));
    }
    if (hi) hiBody += S.g(rc, moving && roll > 0 && roll < 1 ? `translate(${f(rx + rw / 2)} ${f(cy)}) scale(1.04) translate(${f(-(rx + rw / 2))} ${f(-cy)})` : null);
    else body += rc;
  }
  c += S.clipDef(cid, S.rect(x0 + 4, rowsT - 6, w - 8, rowsB - rowsT + 12, 12)) + S.g(body + hiBody, null, { 'clip-path': `url(#${cid})` });
  const kk = pop(k);
  return S.g(c, `translate(${f(x)} ${f(y)}) scale(${f(s * kk)})`, k < 1 ? { opacity: f(seg(k, 0, 0.3)) } : {});
}
// rankClimb({ x, y, from, to, roll, k, t, s, name, label }) — the big "#500 -> #1" climbing rank counter (montage overlay):
// the number rolls down with roll 0..1, a green arrow pulses, gold burst + crown when it lands on #1.
function rankClimb(o = {}) {
  const { x = 960, y = 540, from = 500, to = 1, t = 0, s = 1, name = '', label = 'RANK' } = o;
  const k = clamp(o.k ?? 1, 0, 1), roll = clamp(o.roll ?? 1, 0, 1);
  if (k <= 0.001) return '';
  const cur = Math.round(lerp(from, to, ease.inOut(roll)));
  const land = seg(roll, 0.97, 1) >= 1 ? clamp((roll - 0.97) / 0.03, 0, 1) : 0;
  const isOne = cur === 1;
  const txt = `#${cur}`, size = 190;
  const tw = textW(txt, size, 'L');
  let c = '';
  if (isOne) { let rays = ''; for (let i = 0; i < 14; i++) { const a0 = (i / 14) * Math.PI * 2 + t * 0.6, a1 = a0 + 0.14; rays += `M0 -60 L${f(Math.cos(a0) * 520)} ${f(-60 + Math.sin(a0) * 520)} L${f(Math.cos(a1) * 520)} ${f(-60 + Math.sin(a1) * 520)} Z`; } c += S.path(rays, { fill: '#FFF3B0', opacity: 0.35 }); }
  c += S.rect(-tw / 2 - 150, -170, tw + 300, 250, 50, { fill: P.navy, opacity: 0.9, stroke: LINE, 'stroke-width': 9 });
  c += S.rect(-tw / 2 - 140, -160, tw + 280, 230, 42, { fill: 'none', stroke: isOne ? P.gold : P.teal, 'stroke-width': 6 });
  c += TF(label, 0, -116, 40, P.navyL, { 'letter-spacing': 6 });
  const jit = roll > 0 && roll < 0.97 ? (hash(Math.floor(t * 30)) - 0.5) * 6 : 0;
  c += T(txt, jit, 40, size, isOne ? P.gold : '#FFFFFF', stroked(22));
  const ap = 0.5 + 0.5 * Math.sin(t * 12);
  if (!isOne) c += S.g(S.path('M0 -60 L46 0 H18 V56 H-18 V0 H-46 Z', ol(P.green, 7)), tr(tw / 2 + 92, -10 - 10 * ap, 0.9));
  else c += crown(0, -164, 70, P.gold, 9) + S.path(star4(-tw / 2 - 90, -110, 36, t * 90) + star4(tw / 2 + 100, 0, 28, -t * 90), { fill: '#FFFFFF', stroke: P.gold, 'stroke-width': 4 });
  if (name) c += S.g(S.rect(-textW(name, 46, 'F') / 2 - 34, -32, textW(name, 46, 'F') + 68, 64, 32, ol(userColor(name), 7)) + TF(name, 0, 16, 46, '#FFFFFF', stroked(8)), tr(0, 130));
  const lb = land > 0 ? 1 + 0.25 * Math.sin(land * Math.PI) : 1;
  return S.g(c, `translate(${f(x)} ${f(y)}) scale(${f(s * pop(k) * lb)})`);
}

// ================================================================ 5. HUD
// rollNum({ x, y, value, cur, size, col, anchor, font, sw }) — number with odometer digits: every column rolls when the one to
// its right wraps (cur = the current animated value, value = the final one; width fixed to the final value). x = anchor edge.
function rollNum(o = {}) {
  const { x = 0, y = 0, value = 0, size = 60, col = '#FFFFFF', anchor = 'start', sw = size * 0.14 } = o;
  const cur = o.cur ?? value;
  const str = R.fmt(value);
  const cellW = size * 0.6, commaW = size * 0.3;
  const vw = [...str].reduce((a, ch) => a + (ch === ',' ? commaW : cellW), 0);
  const x0 = anchor === 'start' ? x : anchor === 'end' ? x - vw : x - vw / 2;
  if (Math.abs(cur - value) < 1e-6) return { svg: T(str, x0 + vw / 2, y + size * 0.36, size, col, stroked(sw)), w: vw };
  const cid = S.uid('guRoll');
  let dg = '', px = x0 + vw, pos = 0;
  const cv = Math.max(0, cur);
  for (let i = str.length - 1; i >= 0; i--) {
    if (str[i] === ',') { px -= commaW; if (cv >= Math.pow(10, pos)) dg += T(',', px + commaW / 2, y + size * 0.36, size, col, stroked(sw)); continue; }
    px -= cellW;
    const p10 = Math.pow(10, pos), pv = cv / p10, base = Math.floor(pv);
    const off = pos === 0 ? pv - base : clamp(((cv % p10) / p10 - 0.9) / 0.1, 0, 1);
    const d0 = base % 10, d1 = (d0 + 1) % 10, ccx = px + cellW / 2;
    if (!(pos > 0 && base === 0)) dg += T(String(d0), ccx, y + size * 0.36 - off * size, size, col, stroked(sw));
    if (off > 0.001) dg += T(String(d1), ccx, y + size * 0.36 + (1 - off) * size, size, col, stroked(sw));
    pos++;
  }
  return { svg: S.clipDef(cid, S.rect(x0 - 6, y - size * 0.62, vw + 12, size * 1.18)) + S.g(dg, null, { 'clip-path': `url(#${cid})` }), w: vw };
}
// statPill({ x, y, s, k, t, icon: svg (drawn at 0,0, ~60 px), label, value, roll, from, bump, anchor, col, rim, size, w })
//   The shared HUD pill (navy glass, coloured rim): icon badge · LABEL · value (odometer when roll < 1). bump 0..1 = pop.
function statPill(o = {}) {
  const { x = 60, y = 80, s = 1, t = 0, label = '', value = 0, anchor = 'left', col = '#FFFFFF', rim = P.teal, size = 60, labelSize = 26 } = o;
  const k = clamp(o.k ?? 1, 0, 1);
  if (k <= 0.001) return '';
  const bump = clamp(o.bump || 0, 0, 1);
  const rolling = o.roll !== undefined && o.roll < 1 && typeof value === 'number';
  const cur = rolling ? lerp(o.from ?? 0, value, ease.out(clamp(o.roll, 0, 1))) : value;
  const vStr = typeof value === 'number' ? R.fmt(value) : String(value);
  const vw = typeof value === 'number' ? [...vStr].reduce((a, ch) => a + (ch === ',' ? size * 0.3 : size * 0.6), 0) : textW(vStr, size, 'L');
  const lw = label ? textW(label, labelSize, 'F', 2) + 16 : 0;
  const iconW = o.icon ? 78 : 0, Hh = 92;
  const Wd = o.w || 26 + iconW + lw + vw + 34;
  const x0 = anchor === 'left' ? 0 : anchor === 'right' ? -Wd : -Wd / 2;
  let c = S.rect(x0 + 8, -Hh / 2 + 10, Wd, Hh, Hh / 2, { fill: '#000000', opacity: 0.25 });
  c += S.rect(x0, -Hh / 2, Wd, Hh, Hh / 2, { fill: P.navy, opacity: 0.9, stroke: LINE, 'stroke-width': 6 });
  c += S.rect(x0 + 7, -Hh / 2 + 7, Wd - 14, Hh - 14, Hh / 2 - 7, { fill: 'none', stroke: rim, 'stroke-width': 4, opacity: 0.85 });
  c += S.path(`M${f(x0 + Hh / 2)} ${-Hh / 2 + 14} H${f(x0 + Wd - Hh / 2)}`, ln(4, '#FFFFFF', 0.14));
  let cx = x0 + 20;
  if (o.icon) { c += S.g(o.icon, tr(cx + 34, 0)); cx += iconW; }
  if (label) { c += TF(label, cx, 9, labelSize, P.navyL, { 'text-anchor': 'start', 'letter-spacing': 2 }); cx += lw; }
  const pp = bump > 0 && bump < 1 ? 0.36 * Math.exp(-bump * 4.5) * Math.sin(bump * Math.PI * 2.6) : 0;
  const vc = bump > 0 && bump < 0.3 ? mix(col.startsWith('#') ? col : '#FFFFFF', '#FFFFFF', 1 - bump / 0.3) : col;
  const vcx = cx + vw / 2;
  const v = typeof value === 'number' ? rollNum({ x: cx, y: 0, value, cur, size, col: vc }).svg : T(vStr, vcx, size * 0.36, size, vc, stroked(size * 0.14));
  c += pp ? S.g(v, `translate(${f(vcx)} 0) scale(${f(1 + pp)}) translate(${f(-vcx)} 0)`) : v;
  if (bump > 0 && bump < 0.7) {
    const u = bump / 0.7;
    let sp = '';
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.55; sp += star4(vcx + Math.cos(a) * (vw / 2 + 30 + 50 * u), Math.sin(a) * (40 + 40 * u), 16 * bumpK(u), u * 180); }
    c += S.path(sp, { fill: '#FFFFFF', stroke: rim, 'stroke-width': 2.5 });
  }
  const slide = (1 - ease.out(k)) * (anchor === 'right' ? 90 : anchor === 'left' ? -90 : 0);
  return S.g(c, `translate(${f(x + slide * s)} ${f(y)}) scale(${f(s * pop(k) * (1 + pp * 0.1))})`, k < 1 ? { opacity: f(seg(k, 0, 0.3)) } : {});
}
// coinCounter({ x, y, value, roll, from, k, t, s, bump, anchor, label, rocket }) — gold coin pill (Granny's fortune, the
// hero's 12 coins). roll 0..1 + from = odometer roll (2 -> 9,999,999 "skyrocketing"); rocket 0..1 = green arrow + coins
// shooting up out of the pill (use while it climbs); bump on a +1.
function coinCounter(o = {}) {
  const { t = 0, x = 60, y = 80, s = 1, anchor = 'left' } = o;
  const k = clamp(o.k ?? 1, 0, 1);
  if (k <= 0.001) return '';
  const rocket = clamp(o.rocket || 0, 0, 1);
  const spin = t * 2.2;
  let out = statPill({ ...o, col: P.gold, rim: P.gold, icon: S.circle(0, 0, 33, { fill: '#3B3320', stroke: LINE, 'stroke-width': 4 }) + coinIcon(0, 0, 28, Math.sin(spin) * 0.9) });
  if (rocket > 0) {
    const vw = typeof o.value === 'number' ? R.fmt(o.value).length * 36 : 100;
    const ax = anchor === 'right' ? x + 40 * s : x + (120 + vw + 70) * s;
    const ap = Math.sin(t * 14) * 6;
    out += S.g(S.path('M0 -40 L32 0 H14 V36 H-14 V0 H-32 Z', ol(P.green, 6)), tr(ax, y - ap * s, s * pop(seg(rocket, 0, 0.3))));
    let cs = '';
    for (let i = 0; i < 8; i++) {
      const ph = mod(t * 1.6 + i / 8, 1), cx = (anchor === 'right' ? x - 140 * s : x + 60 * s) + (hash(i * 3.3) - 0.5) * 200 * s;
      cs += coinIcon(cx + Math.sin(ph * 6 + i) * 20 * s, y - 40 * s - ph * 260 * s, 16 * s * (1 - ph * 0.4), t * 6 + i);
    }
    out = S.g(cs, null, { opacity: f(rocket) }) + out;
  }
  return out;
}
// winsCounter({ x, y, value, roll, from, bump, k, t, s, anchor, label }) — trophy pill "WINS 2,000" -> "2,001" (bump)
function winsCounter(o = {}) {
  return statPill({ label: 'WINS', ...o, col: '#FFFFFF', rim: P.orange, icon: S.circle(0, 0, 33, { fill: '#3B2A20', stroke: LINE, 'stroke-width': 4 }) + trophy(0, 2, 22) });
}
// timerHUD({ x, y, sec, text, label, k, t, s, anchor, col }) — stopwatch pill counting UP ("3:12:45" walking into the wall).
// sec = seconds shown (format H:MM:SS), or a ready `text`. anchor 'center' (default, x = centre) | 'left' | 'right'.
const hms = (sec) => { const v = Math.max(0, Math.floor(sec)); return `${Math.floor(v / 3600)}:${String(Math.floor((v % 3600) / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`; };
function timerHUD(o = {}) {
  const { t = 0, sec = 0, label = 'TIME', anchor = 'center' } = o;
  const text = o.text ?? hms(sec);
  return statPill({ x: 960, y: 70, ...o, anchor, label, value: text, col: o.col || '#FFFFFF', rim: o.rim || P.orange, icon: S.circle(0, 0, 33, { fill: '#3B2A20', stroke: LINE, 'stroke-width': 4 }) + clockIcon(0, 4, 21, o.hand ?? t, P.cream) });
}
// levelBadge({ x, y, level, k, t, s, bump, xp, label }) — gold hexagon "LVL 99" with an XP ring (xp 0..1) and a star burst on bump
function levelBadge(o = {}) {
  const { x = 120, y = 120, level = 99, t = 0, s = 1, label = 'LVL' } = o;
  const k = clamp(o.k ?? 1, 0, 1), bump = clamp(o.bump || 0, 0, 1);
  if (k <= 0.001) return '';
  const hex = (r) => 'M' + Array.from({ length: 6 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 3; return `${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)}`; }).join(' L') + ' Z';
  let c = '';
  if (bump > 0 && bump < 1) {
    let rays = '';
    for (let i = 0; i < 12; i++) { const a0 = (i / 12) * Math.PI * 2 + bump * 2, a1 = a0 + 0.16, rr = 120 + 120 * ease.out(bump); rays += `M0 0 L${f(Math.cos(a0) * rr)} ${f(Math.sin(a0) * rr)} L${f(Math.cos(a1) * rr)} ${f(Math.sin(a1) * rr)} Z`; }
    c += S.path(rays, { fill: '#FFF3B0', opacity: f(0.7 * (1 - bump)) });
  }
  c += S.path(hex(92), { fill: P.navy, stroke: LINE, 'stroke-width': 8, 'stroke-linejoin': 'round' });
  if (o.xp !== undefined) {
    const xp = clamp(o.xp, 0, 1), rr = 80, a1 = -Math.PI / 2 + xp * Math.PI * 2;
    c += S.circle(0, 0, rr, { fill: 'none', stroke: '#0E1428', 'stroke-width': 10 });
    if (xp > 0.001) c += S.path(xp >= 0.999 ? ring(0, 0, rr) : `M0 ${-rr} A${rr} ${rr} 0 ${xp > 0.5 ? 1 : 0} 1 ${f(Math.cos(a1) * rr)} ${f(Math.sin(a1) * rr)}`, ln(10, P.teal));
  }
  c += S.path(hex(68), { fill: 'url(#guGoldV)', stroke: LINE, 'stroke-width': 7, 'stroke-linejoin': 'round' });
  c += S.path('M-40 -38 L0 -60 L40 -38', ln(6, '#FFFFFF', 0.6));
  c += TF(label, 0, -20, 24, P.ink, { 'letter-spacing': 2 }) + T(String(level), 0, 36, String(level).length > 2 ? 52 : 64, P.ink);
  c += S.path(star5(0, -96, 24), ol('#FFFFFF', 5)) + S.path(star5(0, -96, 13), { fill: P.gold });
  const pp = bump > 0 && bump < 1 ? 0.3 * Math.exp(-bump * 4) * Math.sin(bump * Math.PI * 3) : 0;
  return S.g(c, `translate(${f(x)} ${f(y)}) rotate(${f(Math.sin(t * 2) * 2)}) scale(${f(s * pop(k) * (1 + pp))})`);
}
// serverHealth({ x, y, w, value, trail, t, k, s, hit, label }) — the big SERVER HEALTH bar (x, y = centre; w = 1100):
// red fill with 10 % ticks, big % readout, a pale "damage trail" from trail (old value) down to value, blinking + warning
// icons under 30 %, hit 0..1 = white flash + shake (sync to the boss smashes).
function serverHealth(o = {}) {
  const { x = 960, y = 110, w = 1100, t = 0, s = 1, label = 'SERVER HEALTH' } = o;
  const k = clamp(o.k ?? 1, 0, 1), hit = clamp(o.hit || 0, 0, 1);
  if (k <= 0.001) return '';
  const v = clamp(o.value ?? 1, 0, 1), tv = clamp(o.trail ?? v, v, 1);
  const bh = 64, x0 = -w / 2;
  const low = v < 0.3;
  const blink = low ? 0.5 + 0.5 * Math.sin(t * 14) : 0;
  let c = S.rect(x0 - 30 + 10, -60 + 12, w + 60, 170, 32, { fill: '#000000', opacity: 0.28 });
  c += S.rect(x0 - 30, -60, w + 60, 170, 32, { fill: P.navy, opacity: 0.92, stroke: LINE, 'stroke-width': 7 });
  c += S.rect(x0 - 22, -52, w + 44, 154, 26, { fill: 'none', stroke: low ? P.red : '#FF8A96', 'stroke-width': 4, opacity: f(0.5 + 0.5 * blink) });
  c += serverIcon(x0 + 22, -18, 20, t, P.cream, low) + TF(label, x0 + 60, -8, 34, '#FFFFFF', { 'text-anchor': 'start', 'letter-spacing': 3 });
  const pct = `${Math.round(v * 100)}%`;
  c += T(pct, x0 + w, 2, 74, low ? (blink > 0.5 ? '#FFFFFF' : P.red) : '#FFFFFF', stroked(12, LINE, { 'text-anchor': 'end' }));
  const by = 26;
  c += S.rect(x0, by, w, bh, 20, { fill: '#2A0A14', stroke: LINE, 'stroke-width': 6 });
  if (tv > v + 0.001) c += S.rect(x0 + 6 + (w - 12) * v, by + 6, (w - 12) * (tv - v), bh - 12, 12, { fill: '#FFE7A8' });
  if (v > 0.002) {
    c += S.rect(x0 + 6, by + 6, Math.max(24, (w - 12) * v), bh - 12, 14, { fill: 'url(#guHpFill)' });
    c += S.rect(x0 + 16, by + 12, Math.max(4, (w - 12) * v - 20), 9, 4.5, { fill: '#FFFFFF', opacity: 0.45 });
  }
  let ticks = '';
  for (let i = 1; i < 10; i++) ticks += `M${f(x0 + (w * i) / 10)} ${by + 8} V${by + bh - 8} `;
  c += S.path(ticks, ln(3, '#000000', 0.35));
  if (low) {
    c += S.rect(x0, by, w, bh, 20, { fill: '#FF2B3E', opacity: f(0.15 * blink) });
    for (const sd of [-1, 1]) c += S.g(S.path('M0 -30 L33 26 L-33 26 Z', ol(P.gold, 5)) + S.path('M0 -10 V8', ln(7)) + S.circle(0, 17, 4, { fill: LINE }), tr(sd * (w / 2 + 70), by + bh / 2 - 4, 1 + 0.12 * blink));
  }
  if (hit > 0 && hit < 1) c += S.rect(x0 - 30, -60, w + 60, 170, 32, { fill: '#FFFFFF', opacity: f(0.65 * (1 - hit) * (1 - hit)) });
  const sh = hit > 0 && hit < 1 ? Math.sin(hit * 70) * 16 * (1 - hit) : 0;
  return S.g(c, `translate(${f(x + sh)} ${f(y - (1 - ease.out(k)) * 140)}) scale(${f(s)})`, k < 1 ? { opacity: f(seg(k, 0, 0.4)) } : {});
}

// ================================================================ 6. EMOTES + COMBAT FX
const HEART_COLS = ['#FF4B7A', '#FF6FB5', '#FF3B5C', '#FF8FC8'];
// emoteHearts({ x, y, age, n, s, to:[x, y], spread, seed, life }) — Mom's air kiss: hearts pop out of (x, y) and float up
// with a wobble (or fly in arcs to `to` = the target's face and pop there). age = s since the emote (≈ 1.8 s). n ≤ 30.
function emoteHearts(o = {}) {
  const { x = 960, y = 500, n = 12, s = 1, seed = 3, life = 1.6, spread = 1 } = o;
  const age = o.age ?? 0;
  if (age < 0 || age > life + n * 0.06 + 0.3) return '';
  let out = '', rings = '';
  for (let i = 0; i < Math.min(30, n); i++) {
    const a = age - i * 0.06;
    if (a < 0 || a > life + 0.25) continue;
    const h1 = hash(i * 3.1 + seed), h2 = hash(i * 7.7 + seed), h3 = hash(i * 1.9 + seed);
    const u = clamp(a / life, 0, 1);
    let px, py;
    if (o.to) {
      const [tx, ty] = o.to;
      const tx_ = tx + (h1 - 0.5) * 120 * s * spread, ty_ = ty + (h2 - 0.5) * 80 * s;
      const cx = (x + tx_) / 2 + (h3 - 0.5) * 200 * s, cy = Math.min(y, ty_) - (120 + 160 * h2) * s;
      const e = ease.inOut(u);
      px = (1 - e) * (1 - e) * x + 2 * (1 - e) * e * cx + e * e * tx_;
      py = (1 - e) * (1 - e) * y + 2 * (1 - e) * e * cy + e * e * ty_;
    } else {
      const ang = -Math.PI / 2 + (h1 - 0.5) * 1.6 * spread;
      const d = (140 + 260 * h2) * s * ease.out(u);
      px = x + Math.cos(ang) * d + Math.sin(a * 6 + i) * 16 * s;
      py = y + Math.sin(ang) * d - 120 * s * u;
    }
    const sc = (0.7 + 0.6 * h3) * s * (a < 0.18 ? ease.outBack(a / 0.18) : 1) * (u > 0.85 ? 1 + 0.6 * seg(u, 0.85, 1) : 1);
    const opv = 1 - seg(u, 0.88, 1);
    if (a > life && a < life + 0.25) { const v = (a - life) / 0.25; rings += ring(px, py, (20 + 40 * v) * s); }
    if (opv <= 0) continue;
    out += S.g(heart(0, 0, 26, HEART_COLS[i % 4], 5), `translate(${f(px)} ${f(py)}) rotate(${f(Math.sin(a * 7 + i) * 14)}) scale(${f(sc)})`, op(opv));
  }
  if (rings) out += S.path(rings, { fill: 'none', stroke: '#FF8FC8', 'stroke-width': f(5 * s) });
  return out;
}
// kissEmote({ x, y, age, s, to, text }) — the "MWAH!" emote: big lips pop with overshoot, MWAH! slams in, a puff of hearts
// (to = where they fly). ~1.8 s.
function kissEmote(o = {}) {
  const { x = 960, y = 400, s = 1, text = 'MWAH!' } = o;
  const age = o.age ?? 0;
  if (age < 0 || age > 2.4) return '';
  const k = pop(age / 0.28), outK = seg(age, 1.4, 1.8);
  let c = '';
  if (outK < 1) {
    let lips = S.path('M-70 0 Q-40 -42 -12 -26 Q0 -34 12 -26 Q40 -42 70 0 Q36 46 0 46 Q-36 46 -70 0 Z', ol('#FF3B5C', 7));
    lips += S.path('M-62 0 Q-30 10 0 4 Q30 10 62 0', ln(5, '#B0122E')) + S.path('M-38 -22 Q-26 -30 -14 -20', ln(6, '#FFFFFF', 0.7));
    const pucker = 1 + 0.12 * Math.sin(age * 18) * (1 - seg(age, 0, 0.6));
    c += S.g(lips, `rotate(-8) scale(${f(pucker)} ${f(1 / pucker)})`);
    const tk = pop(seg(age, 0.12, 0.38));
    c += S.g(T(text, 0, 0, 64, '#FFFFFF', stroked(14, '#C2185B')), tr(110, -50, tk, 10));
  }
  return S.g(c, `translate(${f(x)} ${f(y - 30 * s * ease.out(outK))}) scale(${f(s * k)})`, op(1 - outK)) + emoteHearts({ x: x + 40 * s, y: y - 10 * s, age: age - 0.15, n: 8, s: s * 0.9, to: o.to, seed: 11 });
}
// emoteWheel({ x, y, k, t, s, selected, press, items }) — the radial emote picker ("Mom found the emote button"): 6 slices
// (wave, dance, laugh, kiss, cry, cheer); selected = index (or id) glows orange; press 0..1 flash on the click.
const EMOTES = ['wave', 'dance', 'laugh', 'kiss', 'cry', 'cheer'];
function emoteGlyph(id, r = 30) {
  switch (id) {
    case 'kiss': return heart(0, 0, r * 0.8, '#FF3B5C', 4);
    case 'dance': return S.g(S.ellipse(0, 0, 11, 8, ol(P.teal, 4)) + S.path('M9 -2 V-34 L24 -26', ln(5)), `scale(${f(r / 30)}) translate(-4 12)`);
    case 'laugh': return S.circle(0, 0, r * 0.85, ol(P.gold, 4)) + S.path(`M${f(-r * 0.45)} ${f(-r * 0.2)} l${f(r * 0.2)} ${f(-r * 0.12)} M${f(r * 0.45)} ${f(-r * 0.2)} l${f(-r * 0.2)} ${f(-r * 0.12)}`, ln(4)) + S.path(`M${f(-r * 0.45)} ${f(r * 0.08)} Q0 ${f(r * 0.8)} ${f(r * 0.45)} ${f(r * 0.08)} Z`, ol('#7A2230', 3));
    case 'cry': return S.circle(0, 0, r * 0.85, ol('#8FD3FF', 4)) + S.path(`M${f(-r * 0.4)} ${f(-r * 0.1)} h${f(r * 0.25)} M${f(r * 0.15)} ${f(-r * 0.1)} h${f(r * 0.25)}`, ln(4)) + S.path(`M${f(-r * 0.3)} ${f(r * 0.45)} Q0 ${f(r * 0.2)} ${f(r * 0.3)} ${f(r * 0.45)}`, ln(4)) + S.path(`M${f(-r * 0.35)} ${f(r * 0.05)} q-4 14 0 18 q4 -4 0 -18`, ol('#3A8DFF', 2));
    case 'cheer': return S.path(star5(0, 0, r * 0.9), ol(P.gold, 4));
    default: return S.g(S.path('M-6 18 V-14 Q-6 -20 0 -20 Q6 -20 6 -14 V2 M6 -6 V-22 Q6 -28 12 -28 Q18 -28 18 -22 V0 M18 -4 V-16 Q18 -22 24 -22 Q30 -22 30 -16 V10 Q30 30 10 30 H0 Q-10 30 -16 20 L-28 2 Q-32 -6 -24 -8 Q-18 -10 -12 -2 L-6 6', ol('#FFE0C4', 4)), `scale(${f(r / 34)})`);
  }
}
function emoteWheel(o = {}) {
  const { x = 960, y = 540, t = 0, s = 1, items = EMOTES } = o;
  const k = clamp(o.k ?? 1, 0, 1), press = clamp(o.press || 0, 0, 1);
  if (k <= 0.001) return '';
  const n = items.length, R0 = 90, R1 = 260;
  const sel = typeof o.selected === 'number' ? o.selected : items.indexOf(o.selected);
  let c = S.circle(10, 12, R1 + 10, { fill: '#000000', opacity: 0.22 }) + S.circle(0, 0, R1 + 10, { fill: P.navy, opacity: 0.85, stroke: LINE, 'stroke-width': 7 });
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2 - Math.PI / 2 - Math.PI / n + 0.03, a1 = a0 + (Math.PI * 2) / n - 0.06, am = (a0 + a1) / 2;
    const ki = pop(seg(k, 0.15 + i * 0.07, 0.5 + i * 0.07));
    if (ki <= 0.01) continue;
    const on = i === sel;
    const r1 = R1 + (on ? 14 : 0);
    const d = `M${f(Math.cos(a0) * R0)} ${f(Math.sin(a0) * R0)} L${f(Math.cos(a0) * r1)} ${f(Math.sin(a0) * r1)} A${r1} ${r1} 0 0 1 ${f(Math.cos(a1) * r1)} ${f(Math.sin(a1) * r1)} L${f(Math.cos(a1) * R0)} ${f(Math.sin(a1) * R0)} A${R0} ${R0} 0 0 0 ${f(Math.cos(a0) * R0)} ${f(Math.sin(a0) * R0)} Z`;
    let sl = S.path(d, { fill: on ? 'url(#guOrangeV)' : P.navy2, stroke: on ? LINE : P.navy3, 'stroke-width': on ? 6 : 3 });
    const gx = Math.cos(am) * (R0 + R1) / 2, gy = Math.sin(am) * (R0 + R1) / 2;
    sl += S.g(emoteGlyph(items[i], 34), tr(gx, gy, on ? 1.15 + 0.06 * Math.sin(t * 10) : 1));
    c += S.g(sl, `scale(${f(ki)})`);
  }
  c += S.circle(0, 0, R0 - 12, ol(P.cream, 6)) + TF('EMOTES', 0, 10, 28, P.ink);
  if (press > 0 && press < 1) c += S.circle(0, 0, R1 + 10 + 80 * ease.out(press), { fill: 'none', stroke: P.orange, 'stroke-width': f(14 * (1 - press)), opacity: f(1 - press) });
  return S.g(c, `translate(${f(x)} ${f(y)}) rotate(${f((1 - ease.out(k)) * -60)}) scale(${f(s * pop(k))})`);
}
// danceNotes({ x, y, t, k, s, n }) — music notes bubbling up and swaying (dancing for joy); continuous while k > 0
function danceNotes(o = {}) {
  const { x = 960, y = 500, t = 0, s = 1, n = 5, seed = 2 } = o;
  const k = clamp(o.k ?? 1, 0, 1);
  if (k <= 0) return '';
  const cols = [P.teal, P.orange, P.pink, P.gold, '#7CC4FF'];
  let out = '';
  for (let i = 0; i < n; i++) {
    const ph = mod(t * 0.7 + i / n + hash(i + seed) * 0.3, 1);
    const nx = x + (hash(i * 3.3 + seed) - 0.5) * 220 * s + Math.sin(ph * 7 + i) * 34 * s, ny = y - ph * 300 * s;
    const col = cols[i % cols.length];
    const g = i % 3 === 2
      ? S.ellipse(-14, 4, 13, 10, { ...ol(col, 4), transform: 'rotate(-20 -14 4)' }) + S.ellipse(22, -2, 13, 10, { ...ol(col, 4), transform: 'rotate(-20 22 -2)' }) + S.path('M-3 0 V-40 L33 -46 V-6', ln(5)) + S.path('M-3 -40 L33 -46 V-36 L-3 -30 Z', { fill: LINE })
      : S.ellipse(0, 0, 15, 11, { ...ol(col, 4.5), transform: 'rotate(-20)' }) + S.path('M12 -4 V-50 Q24 -44 30 -30', ln(5.5));
    out += S.g(g, `translate(${f(nx)} ${f(ny)}) rotate(${f(Math.sin(t * 5 + i) * 15)}) scale(${f(s * (0.8 + 0.4 * hash(i)) * (ph < 0.12 ? ease.outBack(ph / 0.12) : 1))})`, op(k * (1 - seg(ph, 0.75, 1))));
  }
  return out;
}
// slash({ x, y, age, angle, col, s, r, dir }) — crescent sword swoosh: sweeps in 0–0.1 s, thins out by 0.32 s.
// (x, y) = centre of the arc, angle = direction the arc faces (deg, 0 = right), dir 1/-1 = sweep direction.
function slash(o = {}) {
  const { x = 960, y = 540, angle = 0, col = '#7CF3FF', s = 1, r = 170, dir = 1, arc = 160 } = o;
  const age = o.age ?? 0;
  if (age < 0 || age > 0.34) return '';
  const grow = ease.out(seg(age, 0, 0.09)), fadeK = seg(age, 0.09, 0.32);
  const span = (arc * Math.PI) / 180;
  const head = -span / 2 + span * grow, tail = -span / 2 + span * ease.in(fadeK);
  if (head - tail < 0.02) return '';
  const N = 20;
  const cres = (thick, inset = 0) => {
    const outer = [], inner = [];
    for (let i = 0; i <= N; i++) {
      const a = lerp(tail, head, i / N), u = i / N;
      const th = thick * Math.pow(Math.sin(u * Math.PI * 0.62 + 0.0001), 1.4) * (u > 0.9 ? 1 - (u - 0.9) * 4 : 1);
      const ro = r - inset;
      outer.push([Math.cos(a) * ro, Math.sin(a) * ro * dir]);
      inner.push([Math.cos(a) * (ro - th), Math.sin(a) * (ro - th) * dir]);
    }
    return 'M' + outer.map(([u, v]) => `${f(u)} ${f(v)}`).join(' L') + ' L' + inner.reverse().map(([u, v]) => `${f(u)} ${f(v)}`).join(' L') + ' Z';
  };
  const th = r * 0.36 * (1 - fadeK * 0.55);
  let c = S.path(cres(th * 1.25, -th * 0.12), { fill: col, opacity: f(0.35 * (1 - fadeK)) });
  c += S.path(cres(th), { fill: col, stroke: LINE, 'stroke-width': f(5 / s), 'stroke-linejoin': 'round', opacity: f(1 - fadeK * 0.7) });
  c += S.path(cres(th * 0.5), { fill: '#FFFFFF', opacity: f(1 - fadeK * 0.6) });
  let sp = '';
  for (let i = 0; i < 5; i++) { const a = head - 0.12 - i * 0.2, d_ = r * (1.12 + 0.1 * (i % 3)), l = 0.22 + 0.1 * (i % 2); sp += `M${f(Math.cos(a) * d_)} ${f(Math.sin(a) * d_ * dir)} L${f(Math.cos(a - l) * d_)} ${f(Math.sin(a - l) * d_ * dir)} `; }
  c += S.path(sp, ln(f(7 / s), '#FFFFFF', 0.9 * (1 - fadeK)));
  if (grow < 1 || age < 0.14) { const ha = head; c += S.path(star4(Math.cos(ha) * (r - th * 0.4), Math.sin(ha) * (r - th * 0.4) * dir, 34 * (1 - fadeK), age * 900), { fill: '#FFFFFF', stroke: col, 'stroke-width': 3 }); }
  return S.g(c, `translate(${f(x)} ${f(y)}) rotate(${f(angle)}) scale(${f(s)})`);
}
// hitSpark({ x, y, age, s, col, seed, text }) — impact star: white star flash, ring, flying chips (0.4 s). text = 'POW!' etc.
function hitSpark(o = {}) {
  const { x = 960, y = 540, s = 1, col = P.gold, seed = 1, text = null } = o;
  const age = o.age ?? 0;
  if (age < 0 || age > 0.6) return '';
  const u = seg(age, 0, 0.4);
  let c = '';
  if (u < 1) {
    const r = 110 * (age < 0.06 ? ease.out(age / 0.06) : 1 - 0.7 * seg(age, 0.06, 0.3));
    if (r > 2) {
      let d = '';
      const n = 8;
      for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2 + hash(seed) * 2, rr = i % 2 ? r * 0.38 : r * (0.8 + 0.4 * hash(i + seed)); d += (i ? 'L' : 'M') + `${f(Math.cos(a) * rr)} ${f(Math.sin(a) * rr)}`; }
      c += S.path(d + 'Z', { fill: col, stroke: LINE, 'stroke-width': 6, 'stroke-linejoin': 'round' }) + S.path(d + 'Z', { fill: '#FFFFFF', transform: 'scale(0.55)' });
    }
    c += S.circle(0, 0, 40 + 130 * ease.out(u), { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(16 * (1 - u)), opacity: f(1 - u) });
    let chips = '';
    for (let i = 0; i < 7; i++) { const a = hash(i * 2.3 + seed) * Math.PI * 2, d_ = (60 + 160 * hash(i * 5.1 + seed)) * ease.out(u); chips += R.sq(Math.cos(a) * d_, Math.sin(a) * d_ + 90 * u * u, 9 * (1 - u), age * 600 + i * 40); }
    c += S.path(chips, { fill: col, stroke: LINE, 'stroke-width': 3 });
  }
  if (text) c += S.g(T(text, 0, 0, 72, '#FFFFFF', stroked(14, LINE)), tr(10, -100 - 30 * seg(age, 0, 0.6), pop(seg(age, 0, 0.15)) * (1 - seg(age, 0.45, 0.6)), -10));
  return S.g(c, tr(x, y, s));
}
// damageNumber({ x, y, age, value, crit, heal, s, col, seed, text }) — pops (overshoot), floats up and drifts, fades by 1 s.
// value number -> "-25" (heal: "+25" green); crit: bigger, orange, CRIT! tag, star burst, shaking.
function damageNumber(o = {}) {
  const { x = 960, y = 400, s = 1, crit = false, heal = false, seed = 1 } = o;
  const age = o.age ?? 0;
  if (age < 0 || age > 1.05) return '';
  const v = o.value ?? 25;
  const txt = o.text ?? (typeof v === 'number' ? `${heal ? '+' : '-'}${R.fmt(Math.abs(v))}` : String(v));
  const size = crit ? 96 : 66;
  const col = o.col || (heal ? '#5CFF9D' : crit ? P.orange : '#FFFFFF');
  const sc = age < 0.16 ? ease.outBack(age / 0.16) * (crit ? 1.35 : 1.15) : lerp(crit ? 1.35 : 1.15, 1, seg(age, 0.16, 0.3));
  const dx = (hash(seed) - 0.5) * 120 * ease.out(age), dy = -130 * ease.out(age);
  const jx = crit && age < 0.3 ? Math.sin(age * 90) * 6 : 0;
  let c = '';
  if (crit && age < 0.4) { const u = age / 0.4; c += S.path(star5(0, -size * 0.3, size * (1.1 + 0.4 * u), size * 0.5), { fill: P.gold, stroke: LINE, 'stroke-width': 5, opacity: f(1 - u), 'stroke-linejoin': 'round' }); }
  c += T(txt, 0, size * 0.1, size, col, stroked(size * 0.2, LINE));
  if (crit) c += S.g(T('CRIT!', 0, 0, 40, P.gold, stroked(9, LINE)), tr(0, -size * 0.85, 1, -8));
  return S.g(c, `translate(${f(x + dx + jx)} ${f(y + dy)}) scale(${f(s * sc)})`, op(1 - seg(age, 0.7, 1.05)));
}
// koStars({ x, y, t, s, n, k, r, birds }) — dizzy stars (and little cube birds) orbiting a knocked-out head; (x, y) = above
// the head. k fades it. text: 'K.O.' pops a label above.
function koStars(o = {}) {
  const { x = 960, y = 400, t = 0, s = 1, n = 4, r = 120, birds = true } = o;
  const k = clamp(o.k ?? 1, 0, 1);
  if (k <= 0) return '';
  const items = [];
  for (let i = 0; i < n + (birds ? 2 : 0); i++) {
    const a = t * 4.2 + (i / (n + (birds ? 2 : 0))) * Math.PI * 2;
    const px = Math.cos(a) * r, py = Math.sin(a) * r * 0.28, depth = Math.sin(a);
    const sc = 0.75 + 0.3 * depth;
    let g;
    if (birds && i >= n) g = S.rect(-14, -12, 28, 24, 6, ol('#7CC4FF', 4)) + S.path('M-2 -4 L-14 -18 L4 -10 Z', ol('#FFFFFF', 3)) + S.circle(6, -4, 3, { fill: LINE }) + S.path('M14 -2 L22 2 L14 6 Z', ol(P.orange, 2.5));
    else g = S.path(star5(0, 0, 24), ol(P.gold, 4.5)) + S.path(star5(-3, -3, 9), { fill: '#FFFBE0' });
    items.push([depth, S.g(g, `translate(${f(px)} ${f(py)}) rotate(${f(t * 200 + i * 50)}) scale(${f(sc)})`, depth < 0 ? { opacity: 0.75 } : {})]);
  }
  items.sort((a, b) => a[0] - b[0]);
  let c = S.ellipse(0, 0, r, r * 0.28, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 3, opacity: 0.35, 'stroke-dasharray': '10 14' }) + items.map((i) => i[1]).join('');
  if (o.text) c += T(o.text, 0, -r * 0.5, 64, P.red, stroked(12));
  return S.g(c, tr(x, y, s), op(k));
}
// knockoutPath(age, { x0, y0, x1, y1, dur, spin, dir, arc }) -> { x, y, sc, rot, u, gone }: the flight of a player launched out of
// the arena (arc up and away, shrinking and spinning) — draw your own actor with it, or let knockoutFly draw everything.
function knockoutPath(age, o = {}) {
  const { x0 = 960, y0 = 800, dir = 1, dur = 1.1, spin = 1080, arc = 40 } = o;
  const x1 = o.x1 ?? x0 + dir * 760, y1 = o.y1 ?? 140;
  const u = clamp(age / dur, 0, 1), e = ease.out(u);
  const cx = x0 + (x1 - x0) * 0.3, cy = Math.min(y0, y1) - arc;
  const px = (1 - e) * (1 - e) * x0 + 2 * (1 - e) * e * cx + e * e * x1, py = (1 - e) * (1 - e) * y0 + 2 * (1 - e) * e * cy + e * e * y1;
  return { x: px, y: py, sc: lerp(1, 0.06, ease.in(u) * 0.6 + e * 0.4), rot: dir * spin * e, u, gone: u >= 1 };
}
function noobFigure() {   // generic R6 player (feet at 0,0, ~480 px tall at scale 1)
  return S.rect(-62, -210, 56, 210, 10, ol('#3E9B4F', 7)) + S.rect(6, -210, 56, 210, 10, ol('#3E9B4F', 7)) + S.rect(-132, -400, 60, 190, 12, ol('#FFD23F', 7)) + S.rect(72, -400, 60, 190, 12, ol('#FFD23F', 7)) +
    S.rect(-72, -410, 144, 210, 12, ol('#3A8DFF', 7)) + S.rect(-58, -530, 116, 112, 22, ol('#FFD23F', 7)) + S.circle(-22, -480, 8, { fill: LINE }) + S.circle(22, -480, 8, { fill: LINE }) + S.path('M-22 -456 Q0 -440 22 -456', ln(6));
}
// knockoutFly({ x0, y0, age, dir, s, svg, x1, y1, dur, spin, cy }) — a player flying out of the arena into a twinkle star:
// svg = the character drawn with its feet at (0, 0) (e.g. actor('darkblade', t, {x:0, y:0, s:.5})); default a generic noob.
// cy = the rotation centre above the feet in svg px (240 ≈ an s .5 actor). After `dur` s: a twinkle "ping" for 0.6 s.
function knockoutFly(o = {}) {
  const { age = 0, s = 0.5, dur = 1.1, cy = o.svg ? 240 : 480 * s } = o;
  if (age < 0) return '';
  const p = knockoutPath(age, o);
  let out = '';
  if (!p.gone) {
    let tr_ = '';
    for (let i = 1; i <= 5; i++) {
      const q = knockoutPath(age - i * 0.035, o);
      if (age - i * 0.035 < 0) break;
      tr_ += ring(q.x, q.y - cy * q.sc, (34 - i * 5) * q.sc * (o.svg ? 1 : s * 2));
    }
    out += S.path(tr_, { fill: '#FFFFFF', opacity: 0.5 });
    const body = o.svg || S.g(noobFigure(), `scale(${f(s)})`);
    out += S.g(body, `translate(${f(p.x)} ${f(p.y - cy * p.sc)}) rotate(${f(p.rot)}) scale(${f(p.sc)}) translate(0 ${f(cy)})`);
  } else {
    const a = age - dur;
    if (a < 0.7) {
      const u = a / 0.7, r = 60 * Math.sin(Math.min(1, u * 1.6) * Math.PI);
      out += S.path(star4(p.x, p.y, r * 1.3, u * 90), { fill: '#FFFFFF', stroke: '#FFE14D', 'stroke-width': 4 }) + S.path(star4(p.x, p.y, r * 0.6, 45 + u * 90), { fill: '#FFE14D' });
      if (u < 0.5) out += S.circle(p.x, p.y, 10 + 70 * u, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(8 * (1 - u * 2)) });
    }
  }
  return out;
}
// comboText({ x, y, k, text, t, s, count, col, out, rot }) — "TRIPLE COMBO!": slams in big and settles (overshoot + shake),
// speed stripes behind, a hits chip (count), stars. ~0.4 s in; out 0..1 zips it away.
function comboText(o = {}) {
  const { x = 960, y = 300, text = 'TRIPLE COMBO!', t = 0, s = 1, count = null, rot = -7, size = 110 } = o;
  const k = clamp(o.k ?? 1, 0, 1), out = clamp(o.out || 0, 0, 1);
  if (k <= 0.001 || out >= 1) return '';
  const tw = textW(text, size, 'L');
  const slam = k < 0.35 ? lerp(2.6, 0.92, ease.in(k / 0.35)) : lerp(0.92, 1, ease.outBack(seg(k, 0.35, 0.7)));
  const shake = k > 0.3 && k < 0.7 ? Math.sin(k * 120) * 10 * (1 - seg(k, 0.3, 0.7)) : 0;
  let c = '';
  let st = '';
  for (let i = 0; i < 9; i++) { const yy = -size * 0.6 + i * size * 0.16, len = tw * (0.6 + 0.6 * hash(i * 3.1)), xx = -len / 2 + (hash(i * 7.7) - 0.5) * 200 - ((t * 900 + i * 300) % 300); st += `M${f(xx)} ${f(yy)} h${f(len)} v${f(size * 0.07)} h${f(-len)} Z`; }
  c += S.path(st, { fill: '#FFFFFF', opacity: f(0.35 * seg(k, 0.3, 0.6)) });
  c += T(text, 0, size * 0.36, size, 'url(#guGoldV)', { stroke: LINE, 'stroke-width': size * 0.24, 'stroke-linejoin': 'round', 'paint-order': 'stroke' });
  c += T(text, 0, size * 0.36, size, 'url(#guGoldV)', { stroke: P.orangeD, 'stroke-width': size * 0.07, 'stroke-linejoin': 'round', 'paint-order': 'stroke' });
  if (count !== null) { const cs = pop(seg(k, 0.45, 0.8)); c += S.g(S.rect(-80, -34, 160, 68, 34, ol(P.red, 6)) + T(`${count} HITS`, 0, 16, 40, '#FFFFFF'), tr(tw / 2 - 40, size * 0.78, cs, 6)); }
  const sk = seg(k, 0.35, 0.9);
  c += S.path(star4(-tw / 2 - 30, -size * 0.5, 34 * bumpK(sk), t * 120) + star4(tw / 2 + 20, -size * 0.6, 26 * bumpK(sk), -t * 120), { fill: '#FFFFFF', stroke: P.gold, 'stroke-width': 4 });
  return S.g(c, `translate(${f(x + shake + 900 * ease.in(out))} ${f(y)}) rotate(${f(rot)}) scale(${f(s * slam)})`, op(seg(k, 0, 0.12) * (1 - out)));
}
// swordRain({ t, age, n, k, targets:[[x, y], ...], x0, x1, y0, floorY, s, seed, dur, stagger }) — golden swords raining
// down. With targets each sword falls into that point (a hand) and stays upright with a glint; without, they stick into
// floorY. age = s since the rain started (each sword starts at age ≈ hash·stagger, falls in `dur` s). n ≤ 40.
function swordRain(o = {}) {
  const { t = 0, n = 24, s = 1, seed = 7, x0 = 80, x1 = 1840, y0 = -180, floorY = 900, dur = 0.8, stagger = 1.2 } = o;
  const age = o.age ?? 0;
  if (age < 0) return '';
  const targets = o.targets || null;
  const cnt = Math.min(40, targets ? targets.length : n);
  let out = '', glints = '', puffs = '';
  for (let i = 0; i < cnt; i++) {
    const h1 = hash(i * 3.3 + seed), h2 = hash(i * 7.1 + seed), h3 = hash(i * 1.7 + seed);
    const ts = h1 * stagger, a = age - ts;
    if (a < 0) continue;
    const [tx, ty] = targets ? targets[i] : [lerp(x0, x1, (i + 0.5) / cnt + (h2 - 0.5) * 0.6 / cnt), floorY + (h3 - 0.5) * 40];
    const u = clamp(a / dur, 0, 1);
    const sx = tx + (h2 - 0.5) * 260 * s, sy = y0 - h3 * 140;
    const px = lerp(sx, tx, ease.out(u)), py = lerp(sy, ty, u * (0.35 + 0.65 * u));
    const sc = s * (0.5 + 0.12 * h3);
    if (u < 1) {
      const rot = lerp(180 + (h1 - 0.5) * 120, targets ? 360 : 180 + (h2 - 0.5) * 30, ease.out(u)) + (u < 0.8 ? Math.sin(a * 14) * 20 : 0);
      out += sword(px, py, sc, rot);
      glints += star4(px, py - 60 * sc, 16 * s, a * 400);
    } else {
      const la = a - dur;
      const bounce = Math.sin(Math.min(1, la / 0.25) * Math.PI) * 18 * s * (1 - clamp(la / 0.25, 0, 1));
      out += targets ? sword(tx, ty - bounce, sc, 0) : sword(tx, ty + 30 * sc, sc, 180 + (h2 - 0.5) * 30);
      if (la < 0.4) { glints += star4(tx + 10 * s, ty - (targets ? 150 : -40) * sc, 46 * s * bumpK(la / 0.4), la * 300); puffs += ring(tx, ty, (20 + 60 * la) * s); }
      else if (targets) glints += star4(tx + 8 * s, ty - 230 * sc + Math.sin(t * 3 + i) * 40 * sc, 14 * s * Math.max(0, Math.sin(t * 4 + i * 1.3)), t * 100);
    }
  }
  return out + (puffs ? S.path(puffs, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(5 * s), opacity: 0.6 }) : '') + S.path(glints, { fill: '#FFFFFF', stroke: P.gold, 'stroke-width': f(3 * s) });
}
// potionPop({ x, y, age, s, col, text }) — a healing potion pops up out of nowhere, glows, uncorks and bursts into rising
// green crosses + "+HP" (≈ 1.2 s). potion(x, y, s, rot, col) = the bottle alone (prop / pickups).
function potionPop(o = {}) {
  const { x = 960, y = 500, s = 1, col = P.green, text = '+HP', seed = 2 } = o;
  const age = o.age ?? 0;
  if (age < 0 || age > 1.5) return '';
  let c = '';
  const bk = age < 0.25 ? ease.outBack(age / 0.25) : 1 - ease.in(seg(age, 0.55, 0.75));
  if (bk > 0.01) c += S.ellipse(0, 0, 90 * bk, 90 * bk, { fill: 'url(#guGlowW)', opacity: 0.5 }) + potion(0, 0, bk * (1 + 0.05 * Math.sin(age * 30)), Math.sin(age * 20) * 8 * (1 - seg(age, 0, 0.5)), col);
  if (age > 0.55) {
    const a = age - 0.55, u = clamp(a / 0.9, 0, 1);
    c += S.circle(0, 0, 30 + 140 * ease.out(u), { fill: 'none', stroke: col, 'stroke-width': f(14 * (1 - u)), opacity: f(1 - u) });
    let cr = '';
    for (let i = 0; i < 9; i++) { const h1 = hash(i * 3.1 + seed), xx = (h1 - 0.5) * 220, yy = -40 - (80 + 200 * hash(i * 7.3 + seed)) * ease.out(u), r = 16 * (1 - u * 0.6); cr += `M${f(xx - r * 0.35)} ${f(yy - r)} h${f(r * 0.7)} v${f(r * 0.65)} h${f(r * 0.65)} v${f(r * 0.7)} h${f(-r * 0.65)} v${f(r * 0.65)} h${f(-r * 0.7)} v${f(-r * 0.65)} h${f(-r * 0.65)} v${f(-r * 0.7)} h${f(r * 0.65)} Z`; }
    c += S.path(cr, { fill: '#9DFFC4', stroke: LINE, 'stroke-width': 3.5, opacity: f(1 - seg(u, 0.7, 1)) });
    c += S.g(T(text, 0, 0, 64, '#5CFF9D', stroked(12)), tr(0, -110 - 70 * ease.out(u), pop(seg(a, 0, 0.2))), op(1 - seg(u, 0.7, 1)));
  }
  return S.g(c, tr(x, y, s));
}

// ================================================================ 7. BOSS UI
// bossBar({ name, value, shield, k, t, x, y, w, s, trail, hit, sub }) — top-centre boss health bar: crowned name plate,
// boss portrait badge, purple->red HP fill with ticks, pale damage trail (trail = old value), shield 0..1 = a cyan hex
// overlay + "SHIELD" lock chip (the bar is invulnerable while it's up), hit 0..1 = white flash + shake. (x, y) = bar centre.
function bossBar(o = {}) {
  const { name = 'THE BLOCK KING', x = 960, y = 120, w = 1200, t = 0, s = 1, sub = '' } = o;
  const k = clamp(o.k ?? 1, 0, 1), hit = clamp(o.hit || 0, 0, 1);
  if (k <= 0.001) return '';
  const v = clamp(o.value ?? 1, 0, 1), tv = clamp(o.trail ?? v, v, 1), sh = clamp(o.shield || 0, 0, 1);
  const bh = 58, x0 = -w / 2;
  let c = '';
  // name plate
  const nw = textW(name, 58, 'L') + 150;
  c += S.path(`M${f(-nw / 2)} -40 L${f(nw / 2)} -40 L${f(nw / 2 - 30)} 8 L${f(-nw / 2 + 30)} 8 Z`, { fill: '#2A1240', stroke: LINE, 'stroke-width': 7, 'stroke-linejoin': 'round' });
  c += T(name, 0, -2, 58, '#FFFFFF', stroked(10, '#5B26C2', { 'letter-spacing': 2 }));
  c += crown(-nw / 2 + 34, -6, 22, P.gold, 4) + crown(nw / 2 - 34, -6, 22, P.gold, 4);
  // bar
  const by = 18;
  c += S.rect(x0 - 10 + 8, by - 10 + 10, w + 20, bh + 20, 26, { fill: '#000000', opacity: 0.3 });
  c += S.rect(x0 - 10, by - 10, w + 20, bh + 20, 26, { fill: '#1A0E2E', stroke: LINE, 'stroke-width': 7 });
  if (tv > v + 0.001) c += S.rect(x0 + (w * v), by, w * (tv - v), bh, 14, { fill: '#FFE7A8' });
  if (v > 0.002) {
    c += S.rect(x0, by, Math.max(24, w * v), bh, 16, { fill: 'url(#guBossFill)' });
    c += S.rect(x0 + 10, by + 6, Math.max(4, w * v - 20), 10, 5, { fill: '#FFFFFF', opacity: 0.4 });
  }
  let ticks = '';
  for (let i = 1; i < 10; i++) ticks += `M${f(x0 + (w * i) / 10)} ${by + 6} V${by + bh - 6} `;
  c += S.path(ticks, ln(3, '#000000', 0.35));
  if (sh > 0.002) {
    const sw = w * sh;
    c += S.rect(x0 - 4, by - 4, sw + 8, bh + 8, 18, { fill: '#7CF3FF', opacity: 0.35, stroke: '#BFF8FF', 'stroke-width': 4 });
    c += S.rect(x0, by, sw, bh, 14, { fill: 'url(#guHex)' });
    const shx = x0 + mod(t * 500, sw + 200) - 100;
    if (shx > x0 && shx < x0 + sw) c += S.path(`M${f(shx)} ${by} h40 l-24 ${bh} h-40 Z`, { fill: '#FFFFFF', opacity: 0.45 });
  }
  c += S.g(S.circle(0, 0, 54, ol('#3B2A5A', 7)) + S.g(headArt('boss'), 'scale(0.84) translate(0 6)'), tr(x0 - 46, by + bh / 2));
  if (sh > 0.002) c += S.g(S.rect(-84, -27, 168, 54, 27, ol('#2A6E8A', 5)) + lockIcon(-50, -1, 17, '#BFF8FF') + TF('SHIELD', 12, 10, 27, '#FFFFFF'), tr(x0 + w - 70, by - 16, 1 + 0.05 * Math.sin(t * 6), 4));
  else c += T(`${Math.round(v * 100)}%`, x0 + w - 18, by + bh / 2 + 15, 40, '#FFFFFF', stroked(8, LINE, { 'text-anchor': 'end' }));
  if (sub) c += TF(sub, 0, by + bh + 50, 28, P.purpleL, stroked(7, LINE, { 'letter-spacing': 3 }));
  if (hit > 0 && hit < 1) c += S.rect(x0 - 10, by - 10, w + 20, bh + 20, 26, { fill: '#FFFFFF', opacity: f(0.7 * (1 - hit) * (1 - hit)) });
  const shx = hit > 0 && hit < 1 ? Math.sin(hit * 70) * 14 * (1 - hit) : 0;
  return S.g(c, `translate(${f(x + shx)} ${f(y - (1 - ease.out(k)) * 200)}) scale(${f(s)})`, k < 1 ? { opacity: f(seg(k, 0, 0.4)) } : {});
}

// hex lattice on the unit disk, warped to look spherical (cached)
const DOME_CELLS = (() => {
  const a = 0.1, cells = [];
  const warp = (u, v) => { const r = Math.hypot(u, v); if (r < 1e-6) return [0, 0]; const rr = Math.sin(Math.min(1, r) * Math.PI / 2); return [(u / r) * rr, (v / r) * rr]; };
  for (let j = -12; j <= 1; j++) for (let i = -12; i <= 12; i++) {
    const cy = j * 1.5 * a, cx = i * Math.sqrt(3) * a + (mod(j, 2) ? (Math.sqrt(3) / 2) * a : 0);
    if (Math.hypot(cx, cy) > 0.97 || cy > 0.02) continue;
    const vs = [];
    for (let q = 0; q < 6; q++) { const an = Math.PI / 6 + (q * Math.PI) / 3; vs.push(warp(cx + Math.cos(an) * a * 0.93, Math.min(0, cy + Math.sin(an) * a * 0.93))); }
    cells.push({ c: warp(cx, cy), vs, h: hash(i * 7.3 + j * 3.1) });
  }
  return cells;
})();
// shieldDome({ x, y, r, k, t, crack, shatter, hits:[{x, y, age}], col, ry, seed }) — the boss's translucent hex dome:
// (x, y) = centre of its base on the ground, r = radius (px). Cheap: one fill + 2–3 batched paths. A shimmer band sweeps
// across the cells; hits (absolute px + age s) light the nearby cells and send a ripple ring; crack 0..1 grows cracks from the
// top; shatter 0..1 blows the cells outward and the dome fades. k 0..1 = raise it (grows from the ground with a flash).
function shieldDome(o = {}) {
  const { x = 960, y = 900, r = 520, t = 0, col = '#C77DFF', seed = 3 } = o;
  const k = clamp(o.k ?? 1, 0, 1), crack = clamp(o.crack || 0, 0, 1), shatter = clamp(o.shatter || 0, 0, 1);
  if (k <= 0.001 || shatter >= 1) return '';
  const ry = o.ry ?? r * 0.2;
  const kk = ease.outBack(k);
  const R_ = r * kk;
  const P_ = ([u, v]) => [x + u * R_, y + v * R_];
  const vis = 1 - shatter;
  let out = '';
  // body
  const dome = `M${f(x - R_)} ${f(y)} A${f(R_)} ${f(R_)} 0 0 1 ${f(x + R_)} ${f(y)} A${f(R_)} ${f(ry * kk)} 0 0 1 ${f(x - R_)} ${f(y)} Z`;
  out += S.path(dome, { fill: col, opacity: f(0.16 * vis) });
  out += S.path(`M${f(x - R_)} ${f(y)} A${f(R_)} ${f(ry * kk)} 0 0 0 ${f(x + R_)} ${f(y)}`, ln(f(4), col, 0.35 * vis));
  // cells
  const band = mod(t * 0.45, 1) * 3 - 1.5;
  const hits = (o.hits || []).filter((h) => h.age >= 0 && h.age < 0.6);
  let lines = '', lit = '', hot = '', shards = '';
  for (const cell of DOME_CELLS) {
    const [cx, cy] = cell.c;
    const poly = cell.vs.map(P_);
    const d = 'M' + poly.map(([a, b]) => `${f(a)} ${f(b)}`).join(' L') + ' Z';
    if (shatter > 0) {
      if (cell.h > 0.55) continue;
      const sx = x + cx * R_, sy = y + cy * R_, vx = cx * 900, vy = cy * 700 - 300, e = ease.out(shatter);
      const ox = vx * e, oy = vy * e + 900 * shatter * shatter;
      shards += `<path d="${d}" transform="translate(${f(ox)} ${f(oy)}) rotate(${f((cell.h - 0.5) * 400 * shatter)} ${f(sx)} ${f(sy)})"/>`;
      continue;
    }
    lines += d;
    const proj = cx * 0.8 + cy * 0.6;
    if (Math.abs(proj - band) < 0.12) lit += d;
    for (const h of hits) {
      const hx = (h.x - x) / R_, hy = (h.y - y) / R_;
      if (Math.hypot(cx - hx, cy - hy) < 0.28 * (0.5 + h.age * 2)) { hot += d; break; }
    }
  }
  if (lines) out += S.path(lines, { fill: 'none', stroke: lighter(col, 0.5), 'stroke-width': 2.5, opacity: f(0.5 * vis), 'stroke-linejoin': 'round' });
  if (lit) out += S.path(lit, { fill: '#FFFFFF', opacity: 0.16, stroke: '#FFFFFF', 'stroke-width': 3 });
  if (hot) out += S.path(hot, { fill: lighter(col, 0.6), opacity: f(0.55 * (1 - Math.max(...hits.map((h) => h.age)) / 0.6)), stroke: '#FFFFFF', 'stroke-width': 4 });
  if (shards) { const so = f(0.8 * (1 - seg(shatter, 0.5, 1))); out += S.g(shards, null, { fill: lighter(col, 0.55), stroke: '#FFFFFF', 'stroke-width': 3, 'fill-opacity': so, 'stroke-opacity': so }); }
  // rim + gloss
  out += S.path(`M${f(x - R_)} ${f(y)} A${f(R_)} ${f(R_)} 0 0 1 ${f(x + R_)} ${f(y)}`, ln(14, col, 0.45 * vis)) + S.path(`M${f(x - R_)} ${f(y)} A${f(R_)} ${f(R_)} 0 0 1 ${f(x + R_)} ${f(y)}`, ln(4, '#FFFFFF', 0.8 * vis));
  out += S.path(`M${f(x - R_ * 0.78)} ${f(y - R_ * 0.42)} A${f(R_ * 0.88)} ${f(R_ * 0.88)} 0 0 1 ${f(x - R_ * 0.3)} ${f(y - R_ * 0.83)}`, ln(f(R_ * 0.035), '#FFFFFF', 0.45 * vis));
  // ripples
  for (const h of hits) { const u = h.age / 0.6; out += S.ellipse(h.x, h.y, 30 + 220 * ease.out(u), (30 + 220 * ease.out(u)) * 0.6, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(12 * (1 - u)), opacity: f(1 - u) }); }
  // cracks
  if (crack > 0 && shatter <= 0) {
    let d = '';
    const ox = x + (o.crackAt ? o.crackAt[0] - x : 0), oy = o.crackAt ? o.crackAt[1] : y - R_ * 0.96;
    for (let b = 0; b < 7; b++) {
      const ang = Math.PI * (0.1 + 0.8 * (b / 6)) + (hash(b + seed) - 0.5) * 0.3;
      let px = ox, py = oy;
      d += `M${f(px)} ${f(py)}`;
      const len = R_ * (0.5 + 0.5 * hash(b * 3.3 + seed)) * crack;
      const steps = 6;
      for (let q = 1; q <= steps; q++) {
        const jit = (hash(b * 11.1 + q * 3.7 + seed) - 0.5) * 0.9;
        px += Math.cos(ang + jit) * (len / steps); py += Math.sin(ang + jit) * (len / steps);
        d += ` L${f(px)} ${f(py)}`;
      }
    }
    out += S.path(d, ln(16, lighter(col, 0.6), 0.55)) + S.path(d, ln(8, '#FFFFFF', 0.95)) + S.path(d, ln(3, '#3A1A5A', 0.9));
    if (crack > 0.6) out += S.path(dome, { fill: '#FFFFFF', opacity: f(0.12 * (Math.floor(t * 12) % 2)) });
  }
  if (k < 1) out += S.path(dome, { fill: '#FFFFFF', opacity: f(0.5 * (1 - k)) });
  return out;
}
// crystal({ x, y, s, t, crack, k, glow, pedestal, beam, col }) — the glowing gem on top of the obby tower: a slowly turning
// faceted bipyramid (≈ 300 px tall at s 1, (x, y) = its centre), soft glow, orbiting sparkles, optional stone pedestal and a
// light beam to the sky. crack 0..1 = light-leaking cracks, from 0.6 it flickers and shakes (Dad is about to hit it).
function crystal(o = {}) {
  const { x = 960, y = 400, s = 1, t = 0, glow = 1, pedestal = true, beam = false, col = '#7CF3FF', col2 = '#B57BFF' } = o;
  const k = clamp(o.k ?? 1, 0, 1), crack = clamp(o.crack || 0, 0, 1);
  if (k <= 0.001) return '';
  let c = '';
  if (beam) c += S.rect(-60, -2600, 120, 2600, 0, { fill: 'url(#guBeam)', opacity: f(0.6 * glow * (0.85 + 0.15 * Math.sin(t * 5))) });
  const pulse = 1 + 0.08 * Math.sin(t * 3);
  c += S.ellipse(0, 0, 260 * pulse * glow, 260 * pulse * glow, { fill: 'url(#guGlowC)', opacity: f(0.8 * glow) });
  if (pedestal) {
    c += S.path('M-110 170 L110 170 L90 230 L-90 230 Z', ol('#6E7484', 7)) + S.rect(-125, 156, 250, 26, 6, ol(P.gold, 6)) + S.path('M-80 200 H80', ln(4, '#4E5464'));
  }
  const bob = Math.sin(t * 2) * 10;
  const shake = crack > 0.6 ? Math.sin(t * 70) * 5 * (crack - 0.6) / 0.4 : 0;
  // facets
  const top = [0, -160], bot = [0, 135], R0 = 78, yS = -30;
  const ring_ = [];
  for (let i = 0; i < 6; i++) { const th = (i * Math.PI) / 3 + t * 0.6; ring_.push({ x: Math.cos(th) * R0, z: Math.sin(th), th }); }
  let gem = '';
  for (let i = 0; i < 6; i++) {
    const a = ring_[i], b = ring_[(i + 1) % 6];
    if (a.z + b.z < -0.05) continue;
    const light = clamp(0.5 + 0.5 * Math.cos((a.th + b.th) / 2 + 2.2), 0, 1);
    const up = mix(col, '#FFFFFF', 0.15 + 0.6 * light), dn = mix(col2, col, 0.25 + 0.5 * light);
    gem += S.path(`M${top[0]} ${top[1]} L${f(a.x)} ${yS} L${f(b.x)} ${yS} Z`, { fill: up, stroke: LINE, 'stroke-width': 5, 'stroke-linejoin': 'round' });
    gem += S.path(`M${bot[0]} ${bot[1]} L${f(a.x)} ${yS} L${f(b.x)} ${yS} Z`, { fill: dn, stroke: LINE, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  }
  gem += S.path('M-20 -120 L-44 -46', ln(9, '#FFFFFF', 0.75)) + S.path('M-30 -10 L-20 60', ln(6, '#FFFFFF', 0.4));
  if (crack > 0) {
    let d = '';
    for (let b = 0; b < 5; b++) {
      let px = (hash(b + 2) - 0.5) * 30, py = -20 + (hash(b * 3) - 0.5) * 40;
      d += `M${f(px)} ${f(py)}`;
      const ang = (b / 5) * Math.PI * 2 + 0.4, steps = 5, len = 170 * crack;
      const inside = (u, v) => Math.abs(u) <= 0.9 * R0 * (v < yS ? (v - top[1]) / (yS - top[1]) : (bot[1] - v) / (bot[1] - yS));
      for (let q = 1; q <= steps; q++) {
        const j = (hash(b * 7.7 + q) - 0.5) * 1.1, nx = px + Math.cos(ang + j) * len / steps, ny = py + Math.sin(ang + j) * len / steps * 1.4;
        if (!inside(nx, ny)) break;
        px = nx; py = ny; d += ` L${f(px)} ${f(py)}`;
      }
    }
    gem += S.path(d, ln(11, '#FFFFFF', 0.85)) + S.path(d, ln(3.5, '#3A1A5A'));
    if (crack > 0.6 && Math.floor(t * 14) % 2) gem += S.path(`M${top[0]} ${top[1]} L${R0} ${yS} L0 ${bot[1]} L${-R0} ${yS} Z`, { fill: '#FFFFFF', opacity: 0.35 });
  }
  c += S.g(gem, `translate(${f(shake)} ${f(bob)})`);
  let sp = '';
  for (let i = 0; i < 4; i++) { const a = t * 1.4 + (i * Math.PI) / 2, rr = 150 + 20 * Math.sin(t * 3 + i); sp += star4(Math.cos(a) * rr, -10 + Math.sin(a) * rr * 0.45 + bob, 14 + 8 * Math.sin(t * 5 + i), t * 90); }
  c += S.path(sp, { fill: '#FFFFFF', stroke: col, 'stroke-width': 3 });
  return S.g(c, `translate(${f(x)} ${f(y)}) scale(${f(s * pop(k))})`);
}
// crystalShatter({ x, y, age, s, burst, col, seed }) — the crystal explodes: white core flash, ~30 gem shards flying out and
// falling, two shockwave rings, and (burst: true) a FULL-FRAME light burst — rays + white-out that fades over ~1.2 s
// (drawn huge so it covers the frame even inside a camera view). age = s since the hit (≈ 2 s).
function crystalShatter(o = {}) {
  const { x = 960, y = 400, s = 1, burst = true, col = '#7CF3FF', col2 = '#B57BFF', seed = 4 } = o;
  const age = o.age ?? 0;
  if (age < 0 || age > 2.4) return '';
  let out = '';
  if (burst) {
    const bk = age < 0.06 ? age / 0.06 : 1 - seg(age, 0.06, 1.3);
    if (bk > 0) {
      let rays = '';
      for (let i = 0; i < 18; i++) { const a0 = (i / 18) * Math.PI * 2 + age * 0.4 + hash(i) * 0.2, a1 = a0 + 0.07 + 0.05 * hash(i * 3); rays += `M${f(x)} ${f(y)} L${f(x + Math.cos(a0) * 3200)} ${f(y + Math.sin(a0) * 3200)} L${f(x + Math.cos(a1) * 3200)} ${f(y + Math.sin(a1) * 3200)} Z`; }
      out += S.rect(x - 4000, y - 4000, 8000, 8000, 0, { fill: '#F2FDFF', opacity: f(0.85 * Math.pow(bk, 1.6)) });
      out += S.path(rays, { fill: '#FFFFFF', opacity: f(0.55 * bk) });
    }
  }
  const u = seg(age, 0, 0.7);
  if (u < 1) {
    out += S.circle(x, y, (80 + 900 * ease.out(u)) * s, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(40 * s * (1 - u)), opacity: f(1 - u) });
    out += S.circle(x, y, (40 + 600 * ease.out(seg(age, 0.08, 0.7))) * s, { fill: 'none', stroke: col, 'stroke-width': f(24 * s * (1 - u)), opacity: f(1 - u) });
  }
  if (age < 0.2) out += S.circle(x, y, 200 * s * (1 - age / 0.2) + 40 * s, { fill: '#FFFFFF' });
  let sh = '';
  const gl = 1 - seg(age, 1.3, 2.2);
  for (let i = 0; i < 30; i++) {
    const h1 = hash(i * 3.1 + seed), h2 = hash(i * 5.7 + seed), h3 = hash(i * 9.3 + seed);
    const a = h1 * Math.PI * 2, v = (500 + 900 * h2) * s;
    const dr = 1 - Math.exp(-2.2 * age);
    const px = x + Math.cos(a) * v * dr / 2.2, py = y + Math.sin(a) * v * dr / 2.2 + 520 * s * age * age;
    const r = (14 + 30 * h3) * s, rot = age * (300 + 600 * h2) + h1 * 360;
    const cl = i % 3 === 0 ? '#FFFFFF' : i % 3 === 1 ? col : col2;
    sh += `<path d="M0 ${f(-r)} L${f(r * 0.6)} ${f(r * 0.3)} L${f(-r * 0.5)} ${f(r * 0.6)} Z" fill="${cl}" transform="translate(${f(px)} ${f(py)}) rotate(${f(rot)})"/>`;
  }
  out += S.g(sh, null, { stroke: LINE, 'stroke-width': f(3 * s), 'stroke-linejoin': 'round', 'fill-opacity': f(gl), 'stroke-opacity': f(gl) });
  return out;
}
const STONE = ['#8A909E', '#737A8A', '#9DA3B0', '#666C7C'];
// bossCrumble({ x, y, w, h, s, age, seed, n }) — the Block King breaks apart: a white flash over his body, ~40 stone cubes
// burst out of the w x h region above (x, y) (= his feet) with purple glints and tumble down, then the whole thing turns
// into a burst of colourful cube confetti (respawn.js blockConfetti). Stop drawing the boss at age 0. ≈ 3 s.
function bossCrumble(o = {}) {
  const { x = 960, y = 900, w = 700, h = 900, s = 1, seed = 5, n = 40 } = o;
  const age = o.age ?? 0;
  if (age < 0 || age > 4) return '';
  let out = '';
  if (age < 0.2) out += S.rect(x - w / 2, y - h, w, h, 60, { fill: '#FFFFFF', opacity: f(1 - age / 0.2) });
  const cols = Math.ceil(Math.sqrt((n * w) / h)), rows = Math.ceil(n / cols);
  let cubes = '';
  for (let i = 0; i < Math.min(44, n); i++) {
    const cx = i % cols, cy = Math.floor(i / cols);
    const h1 = hash(i * 3.7 + seed), h2 = hash(i * 1.9 + seed), h3 = hash(i * 8.3 + seed);
    const px0 = x - w / 2 + ((cx + 0.5) / cols) * w, py0 = y - h + ((cy + 0.5) / rows) * h;
    const vx = (px0 - x) * (1.6 + h1) + (h2 - 0.5) * 400, vy = -500 - 700 * h2 + (py0 - (y - h / 2)) * 0.5;
    const a = age;
    let px = px0 + vx * a * 0.9, py = py0 + vy * a + 1500 * a * a;
    const floor = y + (h3 - 0.5) * 60;
    if (py > floor) py = floor;
    const size = (60 + 50 * h3) * s, rot = (h1 - 0.5) * 600 * Math.min(a, 1.2);
    const opv = 1 - seg(age, 1.4 + h1 * 0.6, 2.2 + h1 * 0.6);
    if (opv <= 0) continue;
    cubes += S.g(S.rect(-size / 2, -size / 2, size, size, size * 0.12, ol(STONE[i % 4], Math.max(3, 5 * s))) + S.path(`M${f(-size / 2 + 5)} ${f(-size * 0.2)} H${f(size * 0.1)} V${f(size / 2 - 5)}`, ln(f(3 * s), '#4E5464', 0.6)) +
      (i % 5 === 0 ? S.rect(-size * 0.2, -size * 0.2, size * 0.4, size * 0.4, 4, { fill: '#D47CFF', opacity: f(0.8 * (1 - seg(age, 0, 0.8))) }) : ''), `translate(${f(px)} ${f(py)}) rotate(${f(rot)})`, op(opv));
  }
  out += cubes;
  out += R.blockConfetti({ x, y: y - h * 0.55, age: age - 0.35, n: 36, s: 1.6 * s, seed: seed + 3, life: 3, power: 1.1 });
  if (age > 0.35 && age < 0.65) { const u = (age - 0.35) / 0.3; out += S.circle(x, y - h * 0.55, (100 + 600 * u) * s, { fill: 'none', stroke: P.gold, 'stroke-width': f(30 * (1 - u) * s), opacity: f(1 - u) }); }
  return out;
}

// ================================================================ 8. PARTY + RESULTS
const ROLE = {
  tank: ['TANK', P.blue], gear: ['GEAR', P.gold], leader: ['LEADER', P.orange], healer: ['HEALER', P.green], dps: ['DPS', P.red], noob: ['NOOB', '#9AA4B8'], rogue: ['ROGUE', P.purple],
};
function roleIcon(role, x, y, r) {
  if (role === 'tank') return shieldIcon(x, y, r, P.blue);
  if (role === 'gear') return coinIcon(x, y, r * 0.9, 0);
  if (role === 'leader') return crown(x, y + r * 0.55, r * 0.8, P.gold, 3);
  if (role === 'healer') return potion(x, y + 2, r / 62, 0, P.green);
  if (role === 'dps') return sword(x, y + r * 0.6, r / 150, 35);
  return '';
}
// partyPanel({ x, y, members:[{name, hp, role, who, col, hit, heal}], k, t, s, title, w }) — party frames (left side,
// (x, y) = top-left): header "PARTY · THE FAMILY", one card per member: portrait, coloured name, role chip
// (tank | gear | leader | healer | dps | noob | rogue), HP bar (hp 0..1; hit 0..1 flashes red, heal 0..1 glows green).
// k 0..1 slides the cards in one by one.
function partyPanel(o = {}) {
  const { x = 40, y = 220, t = 0, s = 1, title = 'PARTY · THE FAMILY', w = 470 } = o;
  const members = o.members || [{ name: 'YOU', role: 'leader', hp: 1 }, { name: 'MOM_OFFICIAL', role: 'tank', hp: 1 }, { name: 'GrannyGoodies', role: 'gear', hp: 1 }, { name: 'DadBod1978', role: 'noob', hp: 1 }];
  const k = clamp(o.k ?? 1, 0, 1);
  if (k <= 0.001) return '';
  const rh = 104, gap = 12;
  let c = '';
  const hk = pop(seg(k, 0, 0.3));
  c += S.g(S.rect(0, -30, textW(title, 30, 'L') + 96, 60, 30, ol('url(#guPurpleV)', 6)) + heart(36, -2, 16, P.pink, 3.5) + T(title, 62, 11, 30, '#FFFFFF', stroked(6, LINE, { 'text-anchor': 'start', 'letter-spacing': 1 })), `translate(0 0) scale(${f(hk)})`);
  members.forEach((m, i) => {
    const ki = seg(k, 0.15 + i * 0.12, 0.5 + i * 0.12);
    if (ki <= 0) return;
    const yy = 46 + i * (rh + gap);
    const uc = m.col || userColor(m.name), who = m.who ?? userWho(m.name);
    const hit = clamp(m.hit || 0, 0, 1), heal = clamp(m.heal || 0, 0, 1);
    let cc = S.rect(8, 10, w, rh, 24, { fill: '#000000', opacity: 0.22 });
    cc += S.rect(0, 0, w, rh, 24, { fill: P.navy, opacity: 0.9, stroke: LINE, 'stroke-width': 5 });
    cc += S.rect(5, 5, w - 10, rh - 10, 19, { fill: 'none', stroke: uc, 'stroke-width': 3, opacity: 0.7 });
    cc += portrait(who, 54, rh / 2, 38, { col: uc, gold: m.gold });
    cc += TF(m.name, 106, 42, 30, uc, stroked(5, '#0B1020', { 'text-anchor': 'start' }));
    const ro = ROLE[m.role];
    if (ro) { const rw = textW(ro[0], 19, 'F') + 48; cc += S.g(S.rect(-rw, -17, rw, 34, 17, ol(ro[1], 4)) + TF(ro[0], -rw / 2 + 12, 7, 19, '#FFFFFF', stroked(3)) + S.g(roleIcon(m.role, 0, 0, 14), tr(-rw + 18, 0)), tr(w - 14, 30)); }
    const hv = clamp(m.hp ?? 1, 0, 1), hx = 106, hw = w - 130, hy = 62;
    const hc = hv > 0.5 ? P.green : hv > 0.25 ? P.gold : P.red;
    cc += S.rect(hx, hy, hw, 24, 12, { fill: '#0E1428', stroke: LINE, 'stroke-width': 3 });
    if (hv > 0) cc += S.rect(hx + 3, hy + 3, Math.max(14, (hw - 6) * hv), 18, 9, { fill: hc }) + S.rect(hx + 8, hy + 5, Math.max(4, (hw - 6) * hv - 12), 5, 2.5, { fill: '#FFFFFF', opacity: 0.4 });
    cc += TF(`${Math.round(hv * 100)}`, hx + hw - 10, hy + 19, 17, '#FFFFFF', stroked(3, LINE, { 'text-anchor': 'end' }));
    if (hit > 0 && hit < 1) cc += S.rect(0, 0, w, rh, 24, { fill: P.red, opacity: f(0.55 * (1 - hit)) });
    if (heal > 0 && heal < 1) cc += S.rect(-6, -6, w + 12, rh + 12, 28, { fill: 'none', stroke: '#5CFF9D', 'stroke-width': f(10 * (1 - heal)) }) + S.path(`M${hx + hw * 0.5 - 8} ${f(hy - 20 - 30 * heal)} h16 M${hx + hw * 0.5} ${f(hy - 28 - 30 * heal)} v16`, ln(6, '#5CFF9D', 1 - heal));
    const sx = (hit > 0 && hit < 1 ? Math.sin(hit * 60) * 8 * (1 - hit) : 0) - (1 - ease.outBack(ki)) * (w + 60);
    c += S.g(cc, `translate(${f(sx)} ${f(yy)})`, op(seg(ki, 0, 0.3)));
  });
  return S.g(c, tr(x, y, s));
}
// big gold-lettered word with per-letter drop-in (shared by victoryCard / bigTitle)
function dropLetters(text, k, size, opt = {}) {
  const { stagger = 0.05, fill = 'url(#guGoldV)', inner = P.orangeD, outer = LINE, wob = 0, t = 0, ls = 0 } = opt;
  const chars = [...text];
  const ws = chars.map((ch) => textW(ch, size, 'L') + ls);
  const total = ws.reduce((a, b) => a + b, 0) - ls;
  let x = -total / 2, o = '';
  const n = chars.length, span = Math.max(0.01, 1 - stagger * (n - 1));
  chars.forEach((ch, i) => {
    const cx = x + ws[i] / 2 - ls / 2;
    x += ws[i];
    if (ch === ' ') return;
    const u = clamp((k - i * stagger) / span, 0, 1);
    if (u <= 0) return;
    const dy = (1 - ease.outBack(u)) * -size * 1.4 + (wob ? Math.sin(t * 5 + i * 0.7) * wob : 0);
    const sc = u < 1 ? 0.6 + 0.4 * ease.outBack(u) : 1;
    const st = { stroke: outer, 'stroke-width': size * 0.22, 'stroke-linejoin': 'round', 'paint-order': 'stroke' };
    let g = T(ch, 0, size * 0.36, size, fill, st);
    if (inner) g += T(ch, 0, size * 0.36, size, fill, { stroke: inner, 'stroke-width': size * 0.07, 'stroke-linejoin': 'round', 'paint-order': 'stroke' });
    o += S.g(g, `translate(${f(cx)} ${f(dy)}) scale(${f(sc)})`, op(seg(u, 0, 0.25)));
  });
  return { svg: o, w: total };
}
function ribbon(x, y, w, h, fill, text, size, o = {}) {
  const tail = h * 0.9, dark = o.dark || darker(fill.startsWith('#') ? fill : P.teal, 0.3);
  let c = '';
  for (const sd of [-1, 1]) {
    c += S.path(`M${f(sd * (w / 2 - 20))} ${f(-h / 2 + h * 0.3)} L${f(sd * (w / 2 + tail))} ${f(-h / 2 + h * 0.3)} L${f(sd * (w / 2 + tail * 0.55))} ${f(h * 0.3 + h * 0.15)} L${f(sd * (w / 2 + tail))} ${f(h / 2 + h * 0.3)} L${f(sd * (w / 2 - 20))} ${f(h / 2 + h * 0.3)} Z`, ol(dark, 6));
  }
  c += S.rect(-w / 2, -h / 2, w, h, h * 0.2, ol(fill, 7)) + S.path(`M${f(-w / 2 + 16)} ${f(-h / 2 + 10)} H${f(w / 2 - 16)}`, ln(6, '#FFFFFF', 0.4));
  c += T(text, 0, size * 0.36, size, '#FFFFFF', stroked(size * 0.18, LINE, { 'letter-spacing': o.ls ?? 2 }));
  return S.g(c, tr(x, y));
}
// victoryCard({ k, t, x, y, s, title, sub, out }) — "VICTORY!" in giant gold letters dropping in one by one over crossed
// golden swords, spinning rays, a teal "SERVER SAVED" ribbon, twinkles. k 0..1 ≈ 1.2 s in; out 0..1 shrinks it away.
// Add R.blockConfettiRain / R.blockConfetti around it for the full moment.
function victoryCard(o = {}) {
  const { t = 0, x = 960, y = 400, s = 1, title = 'VICTORY!', sub = 'SERVER SAVED' } = o;
  const k = clamp(o.k ?? 1, 0, 1), out = clamp(o.out || 0, 0, 1);
  if (k <= 0.001 || out >= 1) return '';
  let c = '';
  const rk = ease.out(seg(k, 0, 0.5));
  let rays = '';
  for (let i = 0; i < 18; i++) { const a0 = (i / 18) * Math.PI * 2 + t * 0.35, a1 = a0 + 0.12; rays += `M0 0 L${f(Math.cos(a0) * 1000)} ${f(Math.sin(a0) * 1000)} L${f(Math.cos(a1) * 1000)} ${f(Math.sin(a1) * 1000)} Z`; }
  c += S.g(S.path(rays, { fill: '#FFD86B', opacity: 0.3 }), `scale(${f(rk)})`);
  c += S.ellipse(0, 0, 620 * rk, 330 * rk, { fill: 'url(#guGlowGold)', opacity: 0.85 });
  const swk = ease.outBack(seg(k, 0.1, 0.45));
  if (swk > 0) c += S.g(sword(-60, 230, 1.9, -38) + sword(60, 230, 1.9, 38), `scale(${f(swk)})`);
  const L_ = dropLetters(title, seg(k, 0.15, 0.85), 220, { t, wob: 4 });
  c += L_.svg;
  const rbk = ease.outBack(seg(k, 0.6, 0.95));
  if (rbk > 0) c += S.g(ribbon(0, 0, Math.max(620, textW(sub, 66, 'L') + 140), 100, 'url(#guTealV)', sub, 66, { dark: P.tealDD }), `translate(0 190) scale(${f(rbk)} ${f(Math.min(1, rbk))})`);
  let st = '';
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.3, rr = 560 + 60 * hash(i), tw = Math.max(0, Math.sin(t * 4 + i * 1.7)); st += star4(Math.cos(a) * rr, Math.sin(a) * rr * 0.5, (18 + 22 * tw) * seg(k, 0.5, 1), t * 60 + i * 20); }
  c += S.path(st, { fill: '#FFFFFF', stroke: P.gold, 'stroke-width': 4 });
  return S.g(c, `translate(${f(x)} ${f(y)}) scale(${f(s * (1 - 0.6 * ease.in(out)))})`, op(1 - out));
}
// mvpCard({ name, k, t, x, y, s, portrait, who, title, sub, stats:[{label, value}], out }) — the MVP moment: a gold card flips
// in over spinning rays, an MVP medal pops on top, the portrait slot (circle r 170 at the card's upper half: pass
// `portrait` = svg drawn around (0, 0) = slot centre, e.g. actor('dadAvatar', t, { x: 0, y: 330, s: 0.42 }); clipped to the
// circle), a name ribbon, "MOST VALUABLE PLAYER" and stat chips. ~1.4 s for k 0 -> 1.
function mvpCard(o = {}) {
  const { name = 'DadBod1978', t = 0, x = 960, y = 540, s = 1, title = 'MVP', sub = 'MOST VALUABLE PLAYER' } = o;
  const k = clamp(o.k ?? 1, 0, 1), out = clamp(o.out || 0, 0, 1);
  if (k <= 0.001 || out >= 1) return '';
  const who = o.who ?? userWho(name) ?? 'dad';
  const stats = o.stats || [{ label: 'JUMPS', value: '100' }, { label: 'CRYSTALS', value: '1' }];
  const Wc = 640, Hc = 820;
  let c = '';
  const rk = ease.out(seg(k, 0, 0.4));
  let rays = '';
  for (let i = 0; i < 20; i++) { const a0 = (i / 20) * Math.PI * 2 + t * 0.4, a1 = a0 + 0.11; rays += `M0 -80 L${f(Math.cos(a0) * 1100)} ${f(-80 + Math.sin(a0) * 1100)} L${f(Math.cos(a1) * 1100)} ${f(-80 + Math.sin(a1) * 1100)} Z`; }
  c += S.g(S.path(rays, { fill: '#FFD86B', opacity: 0.3 }), `scale(${f(rk)})`);
  c += S.ellipse(0, -60, 560 * rk, 560 * rk, { fill: 'url(#guGlowGold)', opacity: 0.7 });
  // card (flips in)
  const fk = seg(k, 0.05, 0.55), flip = Math.cos((1 - ease.out(fk)) * Math.PI * 0.5) * (fk > 0 ? 1 : 0);
  const sx = Math.max(0.02, Math.abs(flip)) * (fk < 1 ? 1 + 0.06 * Math.sin(fk * Math.PI) : 1);
  let card = S.rect(-Wc / 2 + 14, -Hc / 2 + 18, Wc, Hc, 50, { fill: '#000000', opacity: 0.3 });
  card += S.rect(-Wc / 2, -Hc / 2, Wc, Hc, 50, { fill: 'url(#guGoldV)', stroke: LINE, 'stroke-width': 10 });
  card += S.rect(-Wc / 2 + 26, -Hc / 2 + 26, Wc - 52, Hc - 52, 34, { fill: 'url(#guNavyV)', stroke: LINE, 'stroke-width': 6 });
  card += S.rect(-Wc / 2 + 26, -Hc / 2 + 26, Wc - 52, Hc - 52, 34, { fill: 'url(#guDots)' });
  const py = -110, pr = 175;
  const cid = S.uid('guMvp');
  card += S.circle(0, py, pr + 20, ol('url(#guGoldV)', 8));
  card += S.clipDef(cid, S.circle(0, py, pr)) + S.g(S.circle(0, py, pr, { fill: 'url(#guStage)' }) + S.g(o.portrait || S.g(headArt(who), 'scale(2.9)'), tr(0, py)), null, { 'clip-path': `url(#${cid})` });
  card += S.circle(0, py, pr, { fill: 'none', stroke: LINE, 'stroke-width': 7 });
  card += S.path(`M${f(-pr * 0.7)} ${f(py - pr * 0.55)} A${pr} ${pr} 0 0 1 ${f(-pr * 0.1)} ${f(py - pr * 0.98)}`, ln(10, '#FFFFFF', 0.4));
  card += TF(sub, 0, 175, 34, P.goldL, { 'letter-spacing': 3 });
  let chips = '';
  const cw = 210, gapc = 24, tot = stats.length * cw + (stats.length - 1) * gapc;
  stats.forEach((st, i) => {
    const ck = pop(seg(k, 0.75 + i * 0.08, 1));
    if (ck <= 0.01) return;
    const cx = -tot / 2 + i * (cw + gapc) + cw / 2;
    chips += S.g(S.rect(-cw / 2, -42, cw, 84, 22, { fill: P.navy2, stroke: P.gold, 'stroke-width': 4 }) + TF(st.label, 0, -10, 22, P.navyL, { 'letter-spacing': 2 }) + T(String(st.value), 0, 30, 40, '#FFFFFF'), tr(cx, 320, ck));
  });
  card += chips;
  c += S.g(card, `scale(${f(sx)} 1)`);
  // name ribbon
  const rbk = ease.outBack(seg(k, 0.5, 0.8));
  if (rbk > 0) c += S.g(ribbon(0, 0, Math.max(560, textW(name, 70, 'L') + 120), 110, 'url(#guOrangeV)', name, 70, { dark: P.orangeD, ls: 1 }), `translate(0 ${f(240 - Hc / 2 + 340)}) scale(${f(rbk)} ${f(Math.min(1, rbk))})`);
  // medal
  const mk = ease.outBack(seg(k, 0.4, 0.7));
  if (mk > 0) {
    let m = S.path('M-60 -10 L-90 120 L-40 96 L-14 140 L0 20 Z', ol(P.red, 6)) + S.path('M60 -10 L90 120 L40 96 L14 140 L0 20 Z', ol(P.blue, 6));
    m += S.circle(0, 0, 100, ol('url(#guGoldV)', 9)) + S.circle(0, 0, 78, { fill: 'none', stroke: P.goldD, 'stroke-width': 6 });
    m += T(title, 0, 30, 84, P.ink, { 'letter-spacing': 2 }) + S.path(star5(0, -52, 16), { fill: '#FFFFFF' });
    c += S.g(m, `translate(0 ${f(-Hc / 2 - 10)}) rotate(${f(Math.sin(t * 2.5) * 5)}) scale(${f(mk)})`);
  }
  let st = '';
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + 0.5, rr = 420 + 40 * hash(i * 2), tw = Math.max(0, Math.sin(t * 3.5 + i * 2.1)); st += star4(Math.cos(a) * rr, -60 + Math.sin(a) * rr * 0.9, (16 + 26 * tw) * seg(k, 0.6, 1), t * 50 + i * 30); }
  c += S.path(st, { fill: '#FFFFFF', stroke: P.gold, 'stroke-width': 4 });
  const drop = (1 - ease.out(seg(k, 0, 0.4))) * -200;
  return S.g(c, `translate(${f(x)} ${f(y + drop)}) scale(${f(s * (1 - 0.5 * ease.in(out)))})`, op(seg(k, 0, 0.12) * (1 - out)));
}

// ================================================================ 9. AVATAR EDITOR
// shop items: id -> drawn icon (≈ 140 px box around 0,0)
function itemIcon(id, s = 1) {
  let c;
  switch (id) {
    case 'tophat': c = S.ellipse(0, 40, 66, 16, ol('#26263A', 6)) + S.path('M-40 40 L-36 -50 H36 L40 40 Z', ol('#26263A', 6)) + S.rect(-39, 12, 78, 16, 0, { fill: P.red }) + S.path('M-30 -40 V0', ln(5, '#FFFFFF', 0.3)); break;
    case 'cowboy': c = S.path('M-72 30 Q-60 50 0 46 Q60 50 72 30 Q50 40 36 26 L30 -30 Q0 -44 -30 -30 L-36 26 Q-50 40 -72 30 Z', ol('#B9773A', 6)) + S.path('M-34 14 Q0 22 34 14', ln(8, '#6B3A1E')) + S.path('M0 -36 V-8', ln(4, '#8A5524')); break;
    case 'crown': c = crown(0, 34, 52, P.gold, 6); break;
    case 'propeller': c = S.path('M-52 30 Q-50 -26 0 -26 Q50 -26 52 30 Z', ol('#3A8DFF', 6)) + S.path('M-52 30 H70 Q72 40 60 40 H-52 Z', ol('#2E6FD0', 5)) + S.path('M0 -26 V-44', ln(6)) + S.ellipse(-24, -48, 26, 8, ol(P.red, 4)) + S.ellipse(24, -48, 26, 8, ol(P.gold, 4)) + S.circle(0, -46, 7, ol('#FFFFFF', 3)); break;
    case 'chef': c = S.path('M-38 40 V0 Q-66 -6 -60 -34 Q-52 -60 -24 -50 Q-14 -74 12 -66 Q36 -76 50 -50 Q72 -40 62 -10 Q56 2 38 0 V40 Z', ol('#FFFFFF', 6)) + S.path('M-38 22 H38', ln(4, '#C9CED8')); break;
    case 'viking': c = S.path('M-50 30 Q-50 -40 0 -40 Q50 -40 50 30 Z', ol('#9AA4B8', 6)) + S.rect(-56, 18, 112, 20, 8, ol('#6E7890', 5)) + S.path('M-48 -4 Q-80 -14 -76 -56 Q-60 -30 -42 -24 Z M48 -4 Q80 -14 76 -56 Q60 -30 42 -24 Z', ol('#FFF4DC', 5)); break;
    case 'sunglasses': c = S.path('M-66 -10 H66', ln(8)) + S.path('M-62 -12 H-8 Q-6 26 -34 26 Q-62 26 -62 -12 Z M8 -12 H62 Q62 26 34 26 Q6 26 8 -12 Z', ol('#1E2030', 6)) + S.path('M-50 -4 L-38 -4 M20 -4 L32 -4', ln(5, '#FFFFFF', 0.6)); break;
    case 'mustache': c = S.path('M0 -6 Q-20 -24 -46 -10 Q-66 2 -70 -14 Q-72 18 -40 20 Q-14 20 0 4 Q14 20 40 20 Q72 18 70 -14 Q66 2 46 -10 Q20 -24 0 -6 Z', ol('#5A3216', 6)); break;
    case 'hotdog': c = S.path('M-34 -62 Q-62 -62 -62 -20 V40 Q-62 70 -30 70 H30 Q62 70 62 40 V-20 Q62 -62 34 -62 Z', ol('#F2C27A', 6)) + S.rect(-36, -72, 72, 140, 36, ol('#E0533F', 6)) +
      S.path('M-22 -30 Q-11 -42 0 -30 Q11 -18 22 -30 M-22 0 Q-11 -12 0 0 Q11 12 22 0 M-22 30 Q-11 18 0 30 Q11 42 22 30', ln(7, '#FFD23F')) + S.path('M-62 4 L-80 20 M62 4 L80 20 M-20 70 V86 M20 70 V86', ln(9, '#FFFFFF')) + S.path('M-62 4 L-80 20 M62 4 L80 20 M-20 70 V86 M20 70 V86', ln(3)); break;
    case 'pizza': c = S.path('M0 70 L-60 -44 Q0 -74 60 -44 Z', ol('#FFC85A', 6)) + S.path('M-60 -44 Q0 -74 60 -44 L54 -32 Q0 -60 -54 -32 Z', ol('#D9893A', 4)) + [[-18, -24], [16, -18], [0, 16], [-6, -46]].map(([a, b]) => S.circle(a, b, 10, ol('#E0533F', 3))).join(''); break;
    case 'banana': c = S.path('M-40 -60 Q-74 10 -20 60 Q30 90 60 50 Q10 50 -10 10 Q-26 -30 -24 -62 Z', ol('#FFE14D', 6)) + S.path('M-34 -66 L-24 -62', ln(10, '#6B4A1E')) + S.path('M-30 -20 Q-34 20 0 46', ln(4, '#E0B020')); break;
    case 'dino': c = S.path('M-56 50 V-10 Q-56 -60 0 -60 Q50 -60 60 -20 L60 20 Q60 50 30 50 Z', ol('#5CC96B', 6)) + S.path('M-40 -50 L-30 -74 L-16 -56 L-2 -78 L10 -58 L26 -72 L30 -50', ol('#3E9B4F', 4)) + S.circle(20, -16, 9, ol('#FFFFFF', 3)) + S.circle(22, -16, 4, { fill: LINE }) + S.path('M30 20 L38 12 L44 22 L50 12', ln(4, '#FFFFFF')); break;
    case 'shark': c = S.path('M-58 56 V-6 Q-58 -64 0 -64 Q58 -64 58 -6 V56 Z', ol('#6FA8DC', 6)) + S.path('M0 -64 L14 -88 L22 -60', ol('#5A8FC2', 5)) + S.path('M-40 6 L-30 22 L-20 6 L-10 22 L0 6 L10 22 L20 6 L30 22 L40 6 Q40 44 0 46 Q-40 44 -40 6 Z', ol('#FFFFFF', 4)) + S.ellipse(0, 24, 30, 14, { fill: '#FFD9B8' }) + S.circle(-30, -22, 8, { fill: LINE }) + S.circle(30, -22, 8, { fill: LINE }); break;
    case 'robot': c = S.rect(-50, -50, 100, 96, 16, ol('#B9C0CC', 6)) + S.rect(-36, -30, 72, 34, 10, ol('#2A2D3A', 4)) + S.circle(-16, -13, 8, { fill: '#7CF3FF' }) + S.circle(16, -13, 8, { fill: '#7CF3FF' }) + S.path('M-24 24 H24 M-24 24 v6 M-8 24 v6 M8 24 v6 M24 24 v6', ln(4)) + S.path('M0 -50 V-70', ln(6)) + S.circle(0, -74, 9, ol(P.red, 4)) + S.rect(-62, -14, 12, 30, 4, ol('#8A93A6', 4)) + S.rect(50, -14, 12, 30, 4, ol('#8A93A6', 4)); break;
    case 'tutu': c = S.rect(-34, -40, 68, 30, 8, ol(P.pink, 5)) + S.path('M-34 -14 L-70 30 Q-50 40 -40 26 Q-30 44 -14 30 Q0 46 14 30 Q30 44 40 26 Q50 40 70 30 L34 -14 Z', ol('#FFB8DA', 6)); break;
    case 'wings': c = S.path('M-6 0 Q-30 -60 -76 -50 Q-60 -36 -70 -26 Q-50 -20 -62 -6 Q-40 -4 -48 10 Q-24 14 -6 0 Z', ol('#FFFFFF', 5)) + S.path('M6 0 Q30 -60 76 -50 Q60 -36 70 -26 Q50 -20 62 -6 Q40 -4 48 10 Q24 14 6 0 Z', ol('#FFFFFF', 5)) + S.ellipse(0, -66, 30, 9, { fill: 'none', stroke: P.gold, 'stroke-width': 6 }); break;
    case 'dragonwings': c = S.path('M-6 10 L-30 -60 L-80 -40 L-66 -14 L-80 0 L-58 6 L-64 26 Z', ol('#9B5CFF', 5)) + S.path('M6 10 L30 -60 L80 -40 L66 -14 L80 0 L58 6 L64 26 Z', ol('#9B5CFF', 5)) + S.path('M-30 -60 L-46 -4 M30 -60 L46 -4', ln(4, '#5B26C2')); break;
    case 'cape': c = S.path('M-36 -50 Q0 -40 36 -50 L60 60 Q0 74 -60 60 Z', ol('#D8262E', 6)) + S.path('M-20 -46 L-34 56 M20 -46 L34 56', ln(4, '#A81820')) + S.circle(-30, -48, 8, ol(P.gold, 3)) + S.circle(30, -48, 8, ol(P.gold, 3)); break;
    case 'armor': c = S.path('M-54 -40 Q-60 -60 -30 -60 Q0 -48 30 -60 Q60 -60 54 -40 L46 50 Q0 66 -46 50 Z', ol(P.gold, 6)) + S.path('M0 -50 V54 M-40 -10 Q0 4 40 -10', ln(5, P.goldD)) + S.path('M-40 -46 Q-30 -54 -18 -48', ln(5, '#FFFFFF', 0.7)); break;
    case 'potlid': c = S.ellipse(0, 6, 62, 56, ol('#B9C0CC', 6)) + S.ellipse(0, 6, 46, 41, { fill: 'none', stroke: '#8A93A6', 'stroke-width': 5 }) + S.rect(-16, -6, 32, 18, 8, ol('#3A3F52', 5)) + S.path('M-36 -22 Q-20 -40 0 -40', ln(6, '#FFFFFF', 0.7)); break;
    case 'pearls': c = Array.from({ length: 11 }, (_, i) => { const a = Math.PI * (0.1 + 0.8 * (i / 10)); return S.circle(Math.cos(a) * 58, -20 + Math.sin(a) * 58, 11, ol('#FFFFFF', 3.5)); }).join('') + S.circle(0, 48, 15, ol('#FFE8F2', 4)); break;
    case 'monocle': c = S.circle(-6, -6, 40, { fill: '#DFF3FF', opacity: 0.6, stroke: LINE, 'stroke-width': 6 }) + S.circle(-6, -6, 40, { fill: 'none', stroke: P.gold, 'stroke-width': 8 }) + S.path('M28 14 Q50 40 36 70', ln(4, P.gold)) + S.path('M-28 -22 Q-20 -34 -6 -34', ln(6, '#FFFFFF')); break;
    case 'furcoat': c = S.path('M-50 -50 Q0 -36 50 -50 L64 60 H-64 Z', ol('#F6E7F0', 6)) + S.path('M0 -40 V60', ln(5, '#D8BFD0')) + [[-40, -44], [-20, -38], [20, -38], [40, -44], [-56, 0], [56, 0], [-60, 50], [60, 50]].map(([a, b]) => S.circle(a, b, 13, ol('#FFFFFF', 3))).join(''); break;
    case 'cane': c = S.path('M-10 70 L20 -40 Q30 -70 6 -72 Q-16 -72 -18 -52', ln(16)) + S.path('M-10 70 L20 -40 Q30 -70 6 -72 Q-16 -72 -18 -52', ln(9, P.gold)) + S.circle(-18, -52, 9, ol(P.red, 3)); break;
    case 'shirt': c = S.path('M-30 -54 Q0 -40 30 -54 L70 -30 L56 0 L40 -8 V60 H-40 V-8 L-56 0 L-70 -30 Z', ol(P.teal, 6)) + isoCube(0, 10, 18, [P.goldL, P.orange, P.orangeD], 3); break;
    case 'face': c = S.circle(0, 0, 56, ol('#FFE14D', 6)) + S.circle(-18, -10, 8, { fill: LINE }) + S.circle(18, -10, 8, { fill: LINE }) + S.path('M-28 14 Q0 42 28 14', ln(7)); break;
    default: c = isoCube(0, 0, 50, [P.goldL, P.orange, P.orangeD], 6);
  }
  return s === 1 ? c : S.g(c, `scale(${f(s)})`);
}
const ITEMS = [
  { id: 'tophat', name: 'Top Hat', price: 120, tab: 'HATS' }, { id: 'cowboy', name: 'Cowboy Hat', price: 90, tab: 'HATS' }, { id: 'crown', name: 'Royal Crown', price: 9999, tab: 'HATS' },
  { id: 'propeller', name: 'Propeller Cap', price: 25, tab: 'HATS' }, { id: 'chef', name: 'Chef Hat', price: 60, tab: 'HATS' }, { id: 'viking', name: 'Viking Helm', price: 300, tab: 'HATS' },
  { id: 'sunglasses', name: 'Cool Shades', price: 75, tab: 'FACES' }, { id: 'mustache', name: 'Mustache', price: 40, tab: 'FACES' }, { id: 'monocle', name: 'Monocle', price: 500, tab: 'FACES' }, { id: 'face', name: 'Big Smile', price: 0, tab: 'FACES' },
  { id: 'hotdog', name: 'HOT DOG SUIT', price: 250, tab: 'COSTUMES' }, { id: 'pizza', name: 'Pizza Suit', price: 250, tab: 'COSTUMES' }, { id: 'banana', name: 'Banana Suit', price: 200, tab: 'COSTUMES' },
  { id: 'dino', name: 'Dino Hoodie', price: 180, tab: 'COSTUMES' }, { id: 'tutu', name: 'Tutu Skirt', price: 50, tab: 'COSTUMES' }, { id: 'armor', name: 'Gold Armor', price: 2000, tab: 'COSTUMES' },
  { id: 'shark', name: 'Shark Suit', price: 220, tab: 'COSTUMES' }, { id: 'robot', name: 'Robot Suit', price: 300, tab: 'COSTUMES' },
  { id: 'wings', name: 'Angel Wings', price: 400, tab: 'EXTRAS' }, { id: 'dragonwings', name: 'Dragon Wings', price: 650, tab: 'EXTRAS' }, { id: 'cape', name: 'Hero Cape', price: 150, tab: 'EXTRAS' },
  { id: 'potlid', name: 'Pot Lid Shield', price: 5, tab: 'EXTRAS' }, { id: 'pearls', name: 'Pearl Necklace', price: 5000, tab: 'EXTRAS' }, { id: 'furcoat', name: 'Fur Coat', price: 8000, tab: 'EXTRAS' }, { id: 'cane', name: 'Golden Cane', price: 7500, tab: 'EXTRAS' },
  { id: 'shirt', name: 'Cube Tee', price: 30, tab: 'SHIRTS' },
];
const TABS = ['HATS', 'FACES', 'SHIRTS', 'COSTUMES', 'EXTRAS'];
function editorLayout(o) {
  const { w = 1720, h = 940 } = o;
  const leftW = 560, gx0 = -w / 2 + 30 + leftW + 34, gx1 = w / 2 - 34;
  const gy0 = -h / 2 + 226, gy1 = h / 2 - 130;
  const cols = o.cols || 4, rows = o.rows || 2, gap = 22;
  const cw = (gx1 - gx0 - gap * (cols - 1)) / cols, ch = (gy1 - gy0 - gap * (rows - 1)) / rows;
  return { w, h, leftW, gx0, gx1, gy0, gy1, cols, rows, gap, cw, ch };
}
const editorItems = (o) => (o.items || ITEMS.filter((it) => it.tab === (o.tab || 'COSTUMES'))).map((it) => (typeof it === 'string' ? ITEMS.find((q) => q.id === it) || { id: it, name: it, price: 0 } : it)).slice(0, (o.cols || 4) * (o.rows || 2));
// editorCard(opts, idOrIndex) -> { x, y, bx, by }: absolute centre of a card and of its BUY button for the same opts you pass
// to avatarEditor (aim the pointer / Dad's clicks at it).
function editorCard(o = {}, which = 0) {
  const { x = 960, y = 540, s = 1 } = o;
  const Lo = editorLayout(o), its = editorItems(o);
  const i = typeof which === 'number' ? which : Math.max(0, its.findIndex((it) => it.id === which));
  const cx = Lo.gx0 + (i % Lo.cols) * (Lo.cw + Lo.gap) + Lo.cw / 2, cy = Lo.gy0 + Math.floor(i / Lo.cols) * (Lo.ch + Lo.gap) + Lo.ch / 2;
  return { x: x + cx * s, y: y + cy * s, bx: x + (cx + Lo.cw / 2 - 64) * s, by: y + (cy + Lo.ch / 2 - 36) * s };
}
// avatarEditor({ x, y, w, h, s, k, t, tab, items, selected, hover, press, purchased, preview, username, typed, password,
//   coins, bought, title, owned, cols, rows, pointer })
//   The character-creator / avatar shop (≈ full frame at s 1, (x, y) = centre): teal header with the Cube City cube, title and
//   coin balance; LEFT a stage with spotlight + turntable where `preview` (svg, feet at (0,0) on the pedestal, ≈ 520 px of
//   head room) stands, a USERNAME field typed letter by letter (username + typed 0..1, blinking cursor, green check when
//   done) and an optional password field (password: { text, typed, warn 0..1 -> "WEAK!" tag, show }); RIGHT the tab row
//   (HATS FACES SHIRTS COSTUMES EXTRAS) and a 4x2 grid of item cards (icon, name, price, BUY / OWNED).
//   selected = item id/index (orange, bouncing); hover = id/index; press 0..1 pushes its BUY; purchased 0..1 slams a
//   "PURCHASED!" stamp on it; owned = [ids]; bought = number on the cart badge (Dad "clicked everything").
//   pointer: { x, y, press, hand } in ABSOLUTE px (use editorCard() to aim). items default = ITEMS of `tab` (COSTUMES).
function avatarEditor(o = {}) {
  const { x = 960, y = 540, s = 1, t = 0, tab = 'COSTUMES', title = 'AVATAR SHOP', coins = 1000 } = o;
  const k = clamp(o.k ?? 1, 0, 1);
  if (k <= 0.001) return '';
  const Lo = editorLayout(o), { w, h, leftW } = Lo;
  const its = editorItems(o);
  const idx = (v) => (v === undefined || v === null ? -1 : typeof v === 'number' ? v : its.findIndex((it) => it.id === v));
  const sel = idx(o.selected), hov = idx(o.hover);
  const owned = new Set(o.owned || []);
  let c = S.rect(-w / 2 + 16, -h / 2 + 20, w, h, 44, { fill: '#000000', opacity: 0.3 });
  c += S.rect(-w / 2, -h / 2, w, h, 44, ol(P.cream, 9));
  // header
  c += S.path(`M${f(-w / 2 + 4.5)} ${f(-h / 2 + 104)} V${f(-h / 2 + 44)} Q${f(-w / 2 + 4.5)} ${f(-h / 2 + 4.5)} ${f(-w / 2 + 44)} ${f(-h / 2 + 4.5)} H${f(w / 2 - 44)} Q${f(w / 2 - 4.5)} ${f(-h / 2 + 4.5)} ${f(w / 2 - 4.5)} ${f(-h / 2 + 44)} V${f(-h / 2 + 104)} Z`, { fill: 'url(#guTealV)' });
  c += S.path(`M${f(-w / 2)} ${f(-h / 2 + 104)} H${f(w / 2)}`, ln(7));
  c += isoCube(-w / 2 + 70, -h / 2 + 54, 32, [P.goldL, P.orange, P.orangeD], 5) + T(title, -w / 2 + 120, -h / 2 + 78, 62, '#FFFFFF', stroked(11, LINE, { 'text-anchor': 'start', 'letter-spacing': 2 }));
  const cs = R.fmt(coins), cw_ = textW(cs, 44, 'L') + 110;
  c += S.g(S.rect(-cw_, -34, cw_, 68, 34, { fill: P.navy, stroke: LINE, 'stroke-width': 6 }) + coinIcon(-cw_ + 38, 0, 24, t * 2) + T(cs, -22, 16, 44, P.gold, { 'text-anchor': 'end' }), tr(w / 2 - 120, -h / 2 + 54));
  c += S.circle(w / 2 - 58, -h / 2 + 54, 26, ol(P.red, 6)) + S.path(`M${f(w / 2 - 68)} ${f(-h / 2 + 44)} l20 20 m0 -20 l-20 20`, ln(7, '#FFFFFF'));
  // LEFT: stage
  const bx0 = -w / 2 + 30, by0 = -h / 2 + 130, bw = leftW, bh = h - 380;
  c += S.rect(bx0, by0, bw, bh, 30, { fill: 'url(#guStage)', stroke: LINE, 'stroke-width': 7 });
  c += S.path(`M${f(bx0 + bw / 2 - 90)} ${f(by0 + 4)} L${f(bx0 + bw / 2 + 90)} ${f(by0 + 4)} L${f(bx0 + bw / 2 + 230)} ${f(by0 + bh - 70)} L${f(bx0 + bw / 2 - 230)} ${f(by0 + bh - 70)} Z`, { fill: '#FFFFFF', opacity: 0.13 });
  const pedX = bx0 + bw / 2, pedY = by0 + bh - 72;
  c += S.ellipse(pedX, pedY + 14, 200, 44, ol('#0E6F70', 6)) + S.ellipse(pedX, pedY, 200, 44, ol('#7FE3D6', 6)) + S.ellipse(pedX, pedY, 150, 30, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 4, opacity: 0.5, 'stroke-dasharray': '18 16', transform: `rotate(0)` });
  if (o.preview) c += S.g(o.preview, tr(pedX, pedY));
  c += S.g(S.rect(0, 0, 150, 40, 20, { fill: P.navy, opacity: 0.8 }) + TF('PREVIEW', 75, 28, 22, '#FFFFFF', { 'letter-spacing': 2 }), tr(bx0 + 18, by0 + 18));
  c += S.g(S.circle(0, 0, 28, ol(P.cream, 5)) + S.path('M-12 6 A13 13 0 1 1 6 12', ln(5)) + S.path('M2 4 L8 13 L-1 17', ln(5)), tr(bx0 + bw - 46, by0 + 46));
  // fields
  const field = (fy, label, inner, ok) => {
    let fo = S.rect(bx0, fy, bw, 70, 22, ol('#FFFFFF', 6)) + S.rect(bx0 + 8, fy + 8, 128, 54, 16, { fill: P.teal }) + TF(label, bx0 + 72, fy + 44, 22, '#FFFFFF', { 'letter-spacing': 1 });
    fo += inner;
    if (ok > 0) fo += S.g(S.circle(0, 0, 20, ol(P.green, 5)) + S.path('M-9 1 L-3 8 L10 -7', ln(6, '#FFFFFF')), tr(bx0 + bw - 36, fy + 35, pop(ok)));
    return fo;
  };
  const un = String(o.username ?? '');
  if (o.username !== undefined) {
    const ty = clamp(o.typed ?? 1, 0, 1), nn = Math.round(ty * un.length), shown = un.slice(0, nn);
    let inner = TF(shown, bx0 + 152, by0 + bh + 74, 38, P.ink, { 'text-anchor': 'start' });
    if (ty < 1 && Math.floor(t * 2.6) % 2 === 0) inner += S.rect(bx0 + 154 + textW(shown, 38, 'F'), by0 + bh + 40, 4, 44, 2, { fill: P.orange });
    if (nn === 0) inner += T6('Pick a username', bx0 + 160, by0 + bh + 72, 30, '#A9B0C2', { 'text-anchor': 'start' });
    c += field(by0 + bh + 26, 'NAME', inner, ty >= 1 ? (o.nameOk ?? 1) : 0);
  }
  if (o.password) {
    const pw = o.password, txt = String(pw.text || ''), nn = Math.round(clamp(pw.typed ?? 1, 0, 1) * txt.length);
    let inner = '';
    if (pw.show) inner += TF(txt.slice(0, nn), bx0 + 152, by0 + bh + 162, 36, P.ink, { 'text-anchor': 'start' });
    else for (let i = 0; i < nn; i++) inner += S.circle(bx0 + 166 + i * 30, by0 + bh + 150, 9, { fill: P.ink });
    if (nn < txt.length && Math.floor(t * 2.6) % 2 === 0) inner += S.rect(bx0 + 156 + (pw.show ? textW(txt.slice(0, nn), 36, 'F') + 2 : nn * 30), by0 + bh + 128, 4, 44, 2, { fill: P.orange });
    const wk = clamp(pw.warn || 0, 0, 1);
    if (wk > 0) inner += S.g(S.rect(-80, -26, 160, 52, 26, ol(P.red, 5)) + T('WEAK!', 0, 14, 34, '#FFFFFF'), tr(bx0 + bw - 100, by0 + bh + 150 - 2, pop(wk), -6));
    c += field(by0 + bh + 114, 'PASS', inner, 0);
  }
  // RIGHT: tabs
  const tw = (Lo.gx1 - Lo.gx0 - 4 * 14) / 5;
  TABS.forEach((tb, i) => {
    const on = tb === tab, tx = Lo.gx0 + i * (tw + 14);
    c += S.rect(tx, -h / 2 + 130, tw, 66, 22, { fill: on ? 'url(#guTealV)' : P.cream2, stroke: LINE, 'stroke-width': on ? 6 : 4 });
    c += TF(tb, tx + tw / 2, -h / 2 + 174, 26, on ? '#FFFFFF' : P.inkSoft, on ? stroked(5) : {});
  });
  // grid
  its.forEach((it, i) => {
    const cx = Lo.gx0 + (i % Lo.cols) * (Lo.cw + Lo.gap), cy = Lo.gy0 + Math.floor(i / Lo.cols) * (Lo.ch + Lo.gap);
    const on = i === sel, hv = i === hov;
    const lift = on ? -8 - 4 * Math.sin(t * 6) : hv ? -4 : 0;
    let cc = S.rect(6, 10, Lo.cw, Lo.ch, 26, { fill: '#000000', opacity: 0.12 });
    cc += S.rect(0, 0, Lo.cw, Lo.ch, 26, { fill: '#FFFFFF', stroke: on ? P.orangeD : LINE, 'stroke-width': on ? 8 : 5 });
    if (on) cc += S.rect(-8, -8, Lo.cw + 16, Lo.ch + 16, 32, { fill: 'none', stroke: P.orange, 'stroke-width': 5, opacity: f(0.5 + 0.5 * Math.sin(t * 8)) });
    cc += S.rect(10, 10, Lo.cw - 20, Lo.ch * 0.55, 20, { fill: on ? '#FFE4C7' : '#E4F7F4' });
    cc += S.g(itemIcon(it.id), tr(Lo.cw / 2, 10 + Lo.ch * 0.275, Math.min(1, (Lo.ch * 0.5) / 150) * (on ? 1 + 0.04 * Math.sin(t * 6) : 1)));
    cc += TF(it.name, Lo.cw / 2, Lo.ch * 0.55 + 48, Math.min(26, (Lo.cw - 20) / Math.max(6, it.name.length * 0.62)), P.ink);
    const isOwned = owned.has(it.id);
    const yb = Lo.ch - 36;
    if (isOwned) cc += S.rect(Lo.cw / 2 - 70, yb - 22, 140, 44, 22, ol(P.green, 4)) + TF('OWNED', Lo.cw / 2, yb + 9, 24, '#FFFFFF');
    else {
      const pf = fitText(it.price ? R.fmt(it.price) : 'FREE', Lo.cw - 118 - 56, 30, 'L', 0.6);
      cc += coinIcon(30, yb, 15, 0) + T(pf.text, 50, yb + pf.size * 0.36, pf.size, P.ink, { 'text-anchor': 'start' });
      const pr = on ? clamp(o.press || 0, 0, 1) : 0, d = 5 * bumpK(pr * 1.4);
      cc += S.rect(Lo.cw - 118, yb - 22 + 4, 104, 46, 23, { fill: P.orangeD, stroke: LINE, 'stroke-width': 4 }) + S.rect(Lo.cw - 118, yb - 22 + d, 104, 44, 22, { fill: 'url(#guOrangeV)', stroke: LINE, 'stroke-width': 4 }) + TF('BUY', Lo.cw - 66, yb + 9 + d, 24, '#FFFFFF', stroked(4));
      if (pr > 0 && pr < 1) cc += S.circle(Lo.cw - 66, yb, 20 + 60 * pr, { fill: 'none', stroke: P.orange, 'stroke-width': f(8 * (1 - pr)) });
    }
    if (on && o.purchased > 0) cc += stamp({ text: 'PURCHASED!', k: o.purchased, x: Lo.cw / 2, y: Lo.ch * 0.4, s: Math.min(0.62, (Lo.cw * 1.02) / (textW('PURCHASED!', 120, 'L', 7.2) + 132)), rot: -14, col: P.greenD });
    c += S.g(cc, tr(cx, cy + lift));
  });
  // bottom bar: cart + save
  const bb = h / 2 - 96;
  c += S.g(S.rect(0, 0, 250, 68, 34, ol('url(#guTealV)', 6)) + TF('SAVE', 125, 45, 32, '#FFFFFF', stroked(6)), tr(Lo.gx1 - 250, bb));
  c += S.g(S.rect(0, 0, 280, 68, 34, ol(P.cream2, 5)) + TF('RANDOMIZE', 140, 45, 28, P.inkSoft), tr(Lo.gx1 - 550, bb));
  const cartX = Lo.gx0 + 50;
  c += S.g(S.path('M-34 -22 H-22 L-12 16 H24 L32 -10 H-18', ln(6)) + S.circle(-8, 28, 6, { fill: LINE }) + S.circle(20, 28, 6, { fill: LINE }), tr(cartX, bb + 30));
  if (o.bought) { const bk = 1 + 0.2 * Math.sin(t * 12); c += S.g(S.circle(0, 0, 24, ol(P.red, 4)) + T(String(o.bought), 0, 11, 30, '#FFFFFF'), tr(cartX + 30, bb + 6, bk)); c += TF(`${o.bought} ITEMS IN CART`, cartX + 70, bb + 44, 26, P.red, { 'text-anchor': 'start' }); }
  let out = S.g(c, `translate(${f(x)} ${f(y)}) scale(${f(s * pop(k))})`, k < 1 ? { opacity: f(seg(k, 0, 0.3)) } : {});
  if (o.pointer) out += pointer(o.pointer.x, o.pointer.y, o.pointer.s ?? s, o.pointer.press || 0, { hand: o.pointer.hand });
  return out;
}

// ================================================================ 10. DEVICE FRAMES
const DEVICE = {
  laptopOld: { sw: 960, sh: 600 },
  tablet: { sw: 1000, sh: 690 },
  phone: { sw: 380, sh: 790 },
  pc: { sw: 1120, sh: 630 },
};
// deviceFrame({ type, x, y, s, screen, glow, glowCol, k, t, rot, sticker, base, landscape, col }) — a device showing game
// footage, for UI-style / full-screen shots (the props characters HOLD are rig/extras.js laptopOld/tablet/phone/gamingPC —
// same colours). (x, y) = the SCREEN centre. Screen sizes at s 1: laptopOld 960x600 (Dad's ancient grey laptop, "#1 DAD"
// star sticker, keyboard deck; base: false hides the deck), tablet 1000x690 (Mom's teal case), phone 380x790 (Granny's pink
// phone; landscape: true = 790x380), pc 1120x630 (the hero's gaming monitor with an RGB strip + stand). screen = svg authored for 1920x1080 (scaled to cover, cropped) or a
// function (w, h) -> svg in screen px (0,0 = top-left). glow 0..1 = light spill around it; k 0..1 = power on (CRT line for
// laptop/pc, fade for the others). deviceSize(type, landscape) -> { sw, sh }.
function deviceSize(type, landscape = false) {
  const d = DEVICE[type] || DEVICE.pc;
  return type === 'phone' && landscape ? { sw: d.sh, sh: d.sw } : { sw: d.sw, sh: d.sh };
}
function deviceFrame(o = {}) {
  const { type = 'pc', x = 960, y = 500, s = 1, t = 0, rot = 0, glow = 0, glowCol = '#9FE8FF', landscape = false } = o;
  const k = clamp(o.k ?? 1, 0, 1);
  const { sw, sh } = deviceSize(type, landscape);
  const L = -sw / 2, Tt = -sh / 2;
  let back = '', front = '';
  if (glow > 0) for (let i = 5; i >= 1; i--) back += S.rect(L - 40 * i, Tt - 40 * i, sw + 80 * i, sh + 80 * i, 40 + 40 * i, { fill: glowCol, opacity: f(0.045 * glow) });
  if (type === 'laptopOld') {
    const bz = 58;
    if (o.base !== false) {
      const by = sh / 2 + bz + 6;
      back += S.path(`M${f(L - bz - 10)} ${f(by)} H${f(-L + bz + 10)} L${f(-L + bz + 90)} ${f(by + 170)} H${f(L - bz - 90)} Z`, ol('#7A808E', 8));
      back += S.path(`M${f(L - bz + 30)} ${f(by + 20)} H${f(-L + bz - 30)} L${f(-L + bz + 10)} ${f(by + 110)} H${f(L - bz - 10)} Z`, { fill: '#3A3F4E', stroke: LINE, 'stroke-width': 5 });
      let keys = '';
      for (let r = 0; r < 4; r++) {
        const yy = by + 28 + r * 21, wrow = lerp(sw + bz * 2 - 70, sw + bz * 2 + 10, (r + 0.5) / 4), n = 15, kw = wrow / n;
        for (let q = 0; q < n; q++) keys += `M${f(-wrow / 2 + q * kw + 3)} ${f(yy)} h${f(kw - 6)} v15 h${f(-(kw - 6))} Z`;
      }
      back += S.path(keys, { fill: '#C9CED8', opacity: 0.9 });
      back += S.path(`M${f(-170)} ${f(by + 116)} H170 L180 ${f(by + 160)} H-180 Z`, { fill: '#8A909E', stroke: LINE, 'stroke-width': 4 });
    }
    back += S.rect(L - bz, Tt - bz, sw + bz * 2, sh + bz * 2 + 12, 34, ol('#9AA0AE', 8));
    back += S.path(`M${f(L - bz + 26)} ${f(Tt - bz + 16)} H${f(L + sw * 0.3)}`, ln(10, '#FFFFFF', 0.3));
    back += S.rect(L - 22, Tt - 22, sw + 44, sh + 44, 14, { fill: '#2E323E', stroke: LINE, 'stroke-width': 5 });
    back += S.circle(0, Tt - 38, 7, { fill: '#3A3F4E' });
    const st = o.sticker ?? '#1 DAD';
    if (st) front += S.g(S.path(star5(0, 0, 62, 42), { fill: '#FFD23F', stroke: LINE, 'stroke-width': 6, 'stroke-linejoin': 'round' }) + T(st, 0, 10, st.length > 4 ? 24 : 30, '#E8453C', stroked(6, '#FFFFFF')), tr(-L + bz - 4, Tt - bz + 8, 1, 14));
  } else if (type === 'tablet') {
    const bz = 46;
    back += S.rect(L - bz - 14, Tt - bz - 14, sw + bz * 2 + 28, sh + bz * 2 + 28, 70, ol(o.col || '#3FB8A8', 8));
    back += S.rect(L - bz, Tt - bz, sw + bz * 2, sh + bz * 2, 56, { fill: '#1E1E26', stroke: LINE, 'stroke-width': 5 });
    back += S.circle(L - bz / 2, 0, 7, { fill: '#3A3A48' });
    front += S.path(`M${f(-L + bz + 6)} ${f(Tt - 40)} V${f(Tt + 60)}`, ln(10, lighter(o.col || '#3FB8A8', 0.35)));
  } else if (type === 'phone') {
    const bz = 22, rr = landscape ? 50 : 54;
    back += S.rect(L - bz - 16, Tt - bz - 16, sw + bz * 2 + 32, sh + bz * 2 + 32, rr + 20, ol(o.col || '#FF9FC4', 8));
    back += S.rect(L - bz, Tt - bz, sw + bz * 2, sh + bz * 2, rr, { fill: '#16161C', stroke: LINE, 'stroke-width': 5 });
    front += landscape ? S.rect(L - 12, -40, 14, 80, 7, { fill: '#16161C' }) : S.rect(-50, Tt - 12, 100, 18, 9, { fill: '#16161C' });
    front += S.rect(landscape ? -sw / 2 + 8 : sw / 2 + bz + 10, landscape ? -sh / 2 - bz - 22 : -140, landscape ? 90 : 10, landscape ? 10 : 90, 5, { fill: darker(o.col || '#FF9FC4', 0.2) });
  } else {
    const bz = 24;
    if (o.base !== false) {
      back += S.path(`M-60 ${f(sh / 2 + bz)} L-80 ${f(sh / 2 + bz + 150)} H80 L60 ${f(sh / 2 + bz)} Z`, ol('#2A2D3A', 7));
      back += S.rect(-240, sh / 2 + bz + 140, 480, 36, 18, ol('#2A2D3A', 7));
    }
    back += S.rect(L - bz, Tt - bz, sw + bz * 2, sh + bz * 2 + 30, 26, ol('#1C1E28', 8));
    const nseg = 14, segW = (sw - 40) / nseg;
    for (let i = 0; i < nseg; i++) { const hue = mod(i * 25 + t * 120, 360); back += S.rect(L + 20 + i * segW, sh / 2 + bz + 8, segW + 1, 8, 0, { fill: `hsl(${f(hue)},95%,60%)` }); }
  }
  // screen
  let scr = '';
  if (typeof o.screen === 'function') scr = `<svg x="${f(L)}" y="${f(Tt)}" width="${f(sw)}" height="${f(sh)}" viewBox="0 0 ${f(sw)} ${f(sh)}" overflow="hidden">${o.screen(sw, sh)}</svg>`;
  else if (o.screen) scr = `<svg x="${f(L)}" y="${f(Tt)}" width="${f(sw)}" height="${f(sh)}" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" overflow="hidden">${o.screen}</svg>`;
  let sc = S.rect(L, Tt, sw, sh, type === 'phone' ? 30 : type === 'tablet' ? 18 : 6, { fill: '#0B0E18' }) + scr;
  if (type === 'laptopOld') sc += S.rect(L, Tt, sw, sh, 0, { fill: 'url(#guScan)' });
  if (k < 1) {
    if (type === 'laptopOld' || type === 'pc') {
      const u = k;
      const lh = sh * ease.in(seg(u, 0.35, 1));
      sc = S.rect(L, Tt, sw, sh, 6, { fill: '#05070C' }) + (u < 0.35 ? S.rect(-sw / 2 * ease.out(u / 0.35), -3, sw * ease.out(u / 0.35), 6, 3, { fill: '#FFFFFF' }) : S.g(sc, null, {}) + S.rect(L, Tt, sw, (sh - lh) / 2, 0, { fill: '#05070C' }) + S.rect(L, sh / 2 - (sh - lh) / 2, sw, (sh - lh) / 2, 0, { fill: '#05070C' }));
    } else sc += S.rect(L, Tt, sw, sh, 18, { fill: '#05070C', opacity: f(1 - k) });
  }
  sc += S.path(`M${f(L)} ${f(Tt)} H${f(L + sw * 0.55)} L${f(L + sw * 0.25)} ${f(Tt + sh)} H${f(L)} Z`, { fill: 'url(#guGlare)' });
  return S.g(back + sc + S.rect(L, Tt, sw, sh, type === 'phone' ? 30 : type === 'tablet' ? 18 : 6, { fill: 'none', stroke: '#000000', 'stroke-width': 4 }) + front, tr(x, y, s, rot));
}
// screenGlow(x, y, w, h, col, k, { flicker, t }) — cheap screen light on a face / wall, (x, y) = centre, w x h ≤ ~600 px.
// col 'blue' | 'warm' | 'red' | 'purple' | 'green' | 'white' = a soft radial gradient (static defs); any hex colour = three
// nested flat ellipses. Draw OVER the character (it brightens) — e.g. laptop blue on Dad's face at night; flicker: true + t.
const GLOW_GRAD = { blue: 'guFaceB', warm: 'guFaceW', red: 'guFaceR', purple: 'guFaceP', green: 'guFaceG', white: 'guGlowW' };
function screenGlow(x, y, w, h, col = 'blue', k = 1, o = {}) {
  if (k <= 0) return '';
  const fl = o.flicker ? 0.85 + 0.15 * Math.sin((o.t || 0) * 23) * Math.sin((o.t || 0) * 7) : 1;
  if (GLOW_GRAD[col]) return S.ellipse(x, y, w / 2, h / 2, { fill: `url(#${GLOW_GRAD[col]})`, opacity: f(clamp(0.75 * k * fl, 0, 1)) });
  const a = 0.11 * k * fl;
  return S.ellipse(x, y, w / 2, h / 2, { fill: col, opacity: f(a) }) + S.ellipse(x, y, w * 0.36, h * 0.36, { fill: col, opacity: f(a) }) + S.ellipse(x, y, w * 0.22, h * 0.22, { fill: col, opacity: f(a * 1.1) });
}

// ================================================================ 11. MISC
const TITLE_THEME = {
  gold: { fill: 'url(#guGoldV)', inner: P.orangeD, outer: LINE, sub: 'url(#guOrangeV)', subDark: P.orangeD, rays: '#FFF3B0' },
  teal: { fill: '#FFFFFF', inner: P.tealD, outer: LINE, sub: 'url(#guTealV)', subDark: P.tealDD, rays: '#C9FFF6' },
  retro: { fill: 'url(#guRetro)', inner: '#FF2E9A', outer: '#1A0A3A', sub: 'url(#guPurpleV)', subDark: '#3A0A5A', rays: '#FF8AD8', neon: '#7CF3FF' },
  night: { fill: '#E6E0FF', inner: P.purpleD, outer: '#0E0A24', sub: 'url(#guPurpleV)', subDark: '#2A1250', rays: '#B98AFF' },
  alarm: { fill: '#FFFFFF', inner: P.redD, outer: LINE, sub: 'url(#guRedV)', subDark: '#7A0E1E', rays: '#FF8A96' },
};
// bigTitle({ text, k, t, theme, sub, x, y, s, size, out, rays, stagger }) — title card lettering ("FAMILY GAME NIGHT",
// "ARCADE QUEEN 1998"): letters drop in one by one with overshoot and keep a gentle wave, optional sub ribbon and rays.
// themes: 'gold' | 'teal' (Cube City) | 'retro' (90s arcade chrome + neon) | 'night' | 'alarm'. text may contain '\n'.
function bigTitle(o = {}) {
  const { text = 'FAMILY GAME NIGHT', t = 0, theme = 'gold', sub = '', x = 960, y = 420, s = 1, size = 180, stagger = 0.045 } = o;
  const k = clamp(o.k ?? 1, 0, 1), out = clamp(o.out || 0, 0, 1);
  if (k <= 0.001 || out >= 1) return '';
  const th = TITLE_THEME[theme] || TITLE_THEME.gold;
  const lines = String(text).split('\n');
  let c = '';
  if (o.rays !== false) {
    let rays = '';
    for (let i = 0; i < 16; i++) { const a0 = (i / 16) * Math.PI * 2 + t * 0.3, a1 = a0 + 0.13; rays += `M0 0 L${f(Math.cos(a0) * 1100)} ${f(Math.sin(a0) * 700)} L${f(Math.cos(a1) * 1100)} ${f(Math.sin(a1) * 700)} Z`; }
    c += S.g(S.path(rays, { fill: th.rays, opacity: 0.28 }), `scale(${f(ease.out(seg(k, 0, 0.5)))})`);
  }
  const nl = lines.length, lh = size * 1.02;
  lines.forEach((ln_, i) => {
    const yy = (i - (nl - 1) / 2) * lh;
    const kk = seg(k, i * 0.15, 0.85 + i * 0.15);
    if (th.neon) {
      const L_ = dropLetters(ln_, kk, size, { stagger, fill: 'none', inner: null, outer: th.neon, t, wob: 3 });
      c += S.g(L_.svg, `translate(0 ${f(yy)})`, { opacity: 0.35, 'stroke-width': size * 0.4 });
    }
    const L_ = dropLetters(ln_, kk, size, { stagger, fill: th.fill, inner: th.inner, outer: th.outer, t, wob: 3 });
    c += S.g(L_.svg, `translate(0 ${f(yy)})`);
  });
  if (sub) {
    const rk = ease.outBack(seg(k, 0.65, 1));
    if (rk > 0) c += S.g(ribbon(0, 0, Math.max(520, textW(sub, size * 0.38, 'L') + 120), size * 0.56, th.sub, sub, size * 0.38, { dark: th.subDark }), `translate(0 ${f(((nl - 1) / 2) * lh + size * 0.92)}) scale(${f(rk)} ${f(Math.min(1, rk))})`);
  }
  let st = '';
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.4, tw = Math.max(0, Math.sin(t * 4 + i * 1.9)); st += star4(Math.cos(a) * (size * 3.6), Math.sin(a) * size * 1.2, (12 + 22 * tw) * seg(k, 0.5, 1), t * 60); }
  c += S.path(st, { fill: '#FFFFFF', stroke: theme === 'retro' ? '#FF4FB8' : P.gold, 'stroke-width': 4 });
  return S.g(c, `translate(${f(x)} ${f(y - 80 * ease.in(out))}) scale(${f(s)})`, op(1 - out));
}
// stamp({ text, k, x, y, s, rot, col, out }) — rubber stamp slam ("SOLD" on the castle gate, "MVP", "TONIGHT", "PURCHASED!"):
// drops from 2.4x and slams (k 0–0.3), ink splats + a shake, worn ink specks, double border. ~0.5 s for k 0 -> 1.
function stamp(o = {}) {
  const { text = 'SOLD', x = 960, y = 540, s = 1, rot = -12, col = P.red, size = 120, seed = 3 } = o;
  const k = clamp(o.k ?? 1, 0, 1), out = clamp(o.out || 0, 0, 1);
  if (k <= 0.001 || out >= 1) return '';
  const tw = textW(text, size, 'L', size * 0.06);
  const Wd = tw + size * 1.1, Hh = size * 1.45;
  const sl = k < 0.3 ? lerp(2.4, 0.94, ease.in(k / 0.3)) : lerp(0.94, 1, ease.outBack(seg(k, 0.3, 0.6)));
  let c = '';
  const ink = { fill: 'none', stroke: col, 'stroke-linejoin': 'round' };
  c += S.rect(-Wd / 2, -Hh / 2, Wd, Hh, size * 0.18, { ...ink, 'stroke-width': size * 0.12 });
  c += S.rect(-Wd / 2 + size * 0.16, -Hh / 2 + size * 0.16, Wd - size * 0.32, Hh - size * 0.32, size * 0.1, { ...ink, 'stroke-width': size * 0.04 });
  c += T(text, 0, size * 0.36, size, col, { 'letter-spacing': size * 0.06 });
  let sp = '';
  for (let i = 0; i < 14; i++) sp += ring((hash(i * 3.3 + seed) - 0.5) * Wd * 0.95, (hash(i * 7.1 + seed) - 0.5) * Hh * 0.9, size * (0.02 + 0.035 * hash(i * 1.3 + seed)));
  c += S.path(sp, { fill: '#FFFFFF', opacity: 0.55 });
  if (k > 0.28 && k < 0.8) {
    const u = seg(k, 0.28, 0.8);
    let dots = '';
    for (let i = 0; i < 10; i++) { const a = hash(i * 5.5 + seed) * Math.PI * 2, d = (Wd * 0.55 + 40 * ease.out(u)) * (0.8 + 0.4 * hash(i)); dots += ring(Math.cos(a) * d, Math.sin(a) * d * 0.6, size * 0.06 * (1 - u)); }
    c += S.path(dots, { fill: col });
  }
  const sh = k > 0.28 && k < 0.6 ? Math.sin(k * 140) * 8 * (1 - seg(k, 0.28, 0.6)) : 0;
  return S.g(c, `translate(${f(x + sh)} ${f(y)}) rotate(${f(rot)}) scale(${f(s * sl)})`, op(0.94 * seg(k, 0, 0.1) * (1 - out)));
}
// tumbleweed({ x, y, s, t, rot, k, dust }) — a tumbleweed made of little cubes (the awkward-silence gag): (x, y) = the
// ground point under it; rolls (rot deg; default from x so it rolls as you move it) and bounces with t; dust puffs behind.
const TW_PTS = (() => { const n = 26, pts = []; for (let i = 0; i < n; i++) { const yy = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - yy * yy), th = i * 2.399963; pts.push([Math.cos(th) * r, yy, Math.sin(th) * r]); } return pts; })();
function tumbleweed(o = {}) {
  const { x = 960, y = 900, s = 1, t = 0, dust = true, dir = 1 } = o;
  const k = clamp(o.k ?? 1, 0, 1);
  if (k <= 0) return '';
  const r = 80;
  const rot = ((o.rot ?? (x / r) * 57.3 * dir) * Math.PI) / 180;
  const bounce = Math.abs(Math.sin(t * 5.2)) * 34;
  const cy = -r - bounce;
  const cr = Math.cos(rot), sr = Math.sin(rot), ca = Math.cos(0.5), sa = Math.sin(0.5);
  const items = TW_PTS.map(([px, py, pz], i) => {
    const x1 = px * cr - py * sr, y1 = px * sr + py * cr;
    const y2 = y1 * ca - pz * sa, z2 = y1 * sa + pz * ca;
    return { x: x1 * r, y: cy + y2 * r, z: z2, i };
  }).sort((a, b) => a.z - b.z);
  const cols = ['#C9A26A', '#B48A50', '#D9B77E', '#A8783E'];
  let c = S.ellipse(0, 0, r * (1 - bounce / 120), r * 0.18, { fill: '#000000', opacity: 0.18 });
  if (dust) for (let i = 0; i < 3; i++) { const ph = mod(t * 2.2 + i / 3, 1); c += S.circle(-dir * (r * 0.8 + ph * 140), -10 - ph * 40, (12 + 26 * ph), { fill: '#E9DCC4', opacity: f(0.7 * (1 - ph)), stroke: LINE, 'stroke-width': 3 }); }
  c += S.circle(0, cy, r * 0.82, { fill: '#8A6232', opacity: 0.35 });
  for (const it of items) {
    const sz = (22 + 8 * (it.z + 1)) * (0.9 + 0.2 * hash(it.i));
    const col = cols[it.i % 4];
    c += S.g(S.rect(-sz / 2, -sz / 2, sz, sz, 4, ol(it.z < 0 ? darker(col, 0.25) : col, 3.5)) + S.path(`M${f(-sz / 2 + 4)} ${f(sz * 0.1)} H${f(sz * 0.1)} V${f(-sz / 2 + 4)}`, ln(2.5, '#FFFFFF', 0.35)), `translate(${f(it.x)} ${f(it.y)}) rotate(${f(it.i * 37 + rot * 57)})`);
  }
  return S.g(c, tr(x, y, s), op(k));
}
// wallet({ x, y, s, k, t, coins, moth }) — the hero's wallet opening: k 0..1 opens the flap, a "12 COINS" tag pops;
// moth 0..1 = a moth flutters out and away (the "you had twelve coins" beat).
function wallet(o = {}) {
  const { x = 960, y = 600, s = 1, t = 0, coins = 12 } = o;
  const k = clamp(o.k ?? 1, 0, 1), moth = clamp(o.moth || 0, 0, 1);
  const fl = ease.outBack(k);
  // the flap: hinged at the top edge; it swings up and BACK (behind the coins) once past halfway (k)
  const flap = S.g(S.path('M-180 -36 H180 V40 Q180 70 150 76 L0 104 L-150 76 Q-180 70 -180 40 Z', ol(fl > 0.5 ? '#7A4520' : '#A86A30', 8)) + (fl > 0.5 ? '' : S.path('M-150 30 Q0 70 150 30', ln(5, '#6B3A1E', 0.6)) + S.circle(0, 82, 16, ol(P.gold, 5))),
    `translate(0 -36) scale(1 ${f(1 - 2 * fl)}) translate(0 36)`);
  let c = fl > 0.5 ? flap : '';
  c += S.rect(-180, -50, 360, 220, 30, ol('#6B3A1E', 8));                          // back panel
  c += S.rect(-150, -62, 300, 40, 14, { fill: '#2A160A', stroke: LINE, 'stroke-width': 6 });   // the open slot
  for (let i = 0; i < 3; i++) c += coinIcon(-56 + i * 56, -54 - 26 * fl + (i % 2) * 8, 28, 0.25 * i);
  c += S.rect(-180, -36, 360, 206, 30, ol('#8A5524', 8)) + S.path('M-158 -12 H158', ln(5, '#6B3A1E', 0.6));
  c += S.path('M-156 140 ' + Array.from({ length: 31 }, (_, i) => `l10 ${i % 2 ? -6 : 6}`).join(' '), ln(3, '#E9C07A', 0.6));
  if (fl <= 0.5) c += flap;
  const tk = pop(seg(k, 0.4, 0.8));
  if (tk > 0) c += S.g(S.rect(-130, -38, 260, 76, 38, ol(P.navy, 6)) + coinIcon(-88, 0, 24, t * 2) + T(`${coins} COINS`, 20, 16, 44, P.gold), tr(0, 240, tk));
  if (moth > 0) {
    const mx = Math.sin(moth * 9) * 80 + moth * 260, my = -110 - moth * 520 + Math.sin(moth * 20) * 20;
    const fla = Math.abs(Math.sin(t * 30));
    const wing = (sd) => S.path(`M0 0 Q${sd * 40} ${f(-50 * fla - 10)} ${sd * 62} -8 Q${sd * 48} 24 0 8 Z`, ol('#C9C2B4', 4));
    c += S.g(wing(-1) + wing(1) + S.ellipse(0, 4, 9, 22, ol('#8A8070', 4)) + S.path('M-4 -16 Q-12 -32 -20 -34 M4 -16 Q12 -32 20 -34', ln(3)), tr(mx, my, 0.9, Math.sin(moth * 12) * 20), op(1 - seg(moth, 0.8, 1)));
    let dust = '';
    for (let i = 0; i < 6; i++) dust += ring(mx + (hash(i) - 0.5) * 60, my + 30 + i * 18, 4);
    c += S.path(dust, { fill: '#D8D0C0', opacity: f(0.6 * (1 - moth)) });
  }
  return S.g(c, tr(x, y, s));
}

module.exports = {
  DEFS, W, H, LINE, P, USERS, WHO_NAME, userColor, userWho,
  // shared drawings
  isoCube, cubeLogo, coinIcon, heart, crown, trophy, sword, shieldIcon, lockIcon, clockIcon, serverIcon, potion, pointer, keycap, portrait, headArt,
  // 1 chat
  chatBubble, chatSync, chatLine, chatLog, FLOOD, FLOOD_USERS, floodMsg,
  // 2 server messages
  joinToast, joinStack, systemBanner, alarmEdges,
  // 3 nametags
  nametag, overHead, HEAD_TOP,
  // 4 leaderboard
  leaderboard, rankClimb, rankBadge,
  // 5 HUD
  statPill, rollNum, coinCounter, winsCounter, timerHUD, hms, levelBadge, serverHealth,
  // 6 emotes + combat
  emoteHearts, kissEmote, emoteWheel, EMOTES, danceNotes, slash, hitSpark, damageNumber, koStars, knockoutPath, knockoutFly, comboText, swordRain, potionPop,
  // 7 boss
  bossBar, shieldDome, crystal, crystalShatter, bossCrumble,
  // 8 party + results
  partyPanel, ROLE, victoryCard, mvpCard, ribbon, dropLetters,
  // 9 editor
  avatarEditor, editorCard, itemIcon, ITEMS, TABS,
  // 10 devices
  deviceFrame, deviceSize, screenGlow,
  // 11 misc
  bigTitle, stamp, tumbleweed, wallet,
  // re-exported from respawn.js (same API, see /home/user/animation/respawn/docs/FX.md)
  rewind: R.rewind, rewindT: R.rewindT, flash: R.flash, blockConfetti: R.blockConfetti, blockConfettiRain: R.blockConfettiRain, lightning: R.lightning,
  hash, seg, textW, wrap, fitText,
};
