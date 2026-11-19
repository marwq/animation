// RESPAWN FX + GAME-UI KIT — the visual signature of "What If You Could RESPAWN in Real Life?".
// Pure functions returning SVG strings (deterministic in their inputs; every random value comes from hash(seed)).
// Scenes: const R = require('./respawn');  API reference + recipes: docs/FX.md, contact sheets: concept/fx*.png.
//
//   Tip ............ tip({x,y,s,t,look,mood,glitch,fade,label,bob,talk}), tipCard(x,y,k,text,{t,w,type})
//   Checkpoint ..... checkpoint({x,y,s,t,state,save,glow,part}), flag({...,plant}), flagProp(), tinyFlag(), saveWave(u)
//   Fail ........... crumble({x,y,s,age,seed,colors,dir,spread,floorY,ghost})
//   Respawn ........ respawnOverlay(t,{t0,dur,label,reason,count,style}), respawnPop({x,y,s,age}), popPose(age,s),
//                    forcefield({x,y,s,t,k})
//   Pause menu ..... escMenu({x,y,s,k,hl,press,t,broken})
//   HUD ............ counterHUD({x,y,s,k,label,value,t,bump,theme,roll,from}), savedToast(x,y,k,{text,t,out})
//   Windows ........ sysWindow({x,y,w,h,k,theme,title,lines,small,buttons,hl,press,glitch,progress,t}), skyCrack({...})
//   Lag/glitch ..... freezeT, stutterVoiceT, rubberBand, lagJitter, glitchSlices, rgbSplit, tint, scramble,
//                    lowGfxBadge, loadingTexture, greyWash, pixelDissolve
//   Foam ........... foamFountain, foamPile, foamBlobs, foamSplash, foamSnowman, foamMustache
//   Other .......... blockConfetti, blockConfettiRain, ghostPop, lightning, rewind, rewindT, flash
//   Recipe ......... respawnSeq(u, { preset:'standard'|'fast'|'corner', fail, spawn, reason, t }) -> { view, heroAt, pose, under, over, screen }
//
// Units: world FX (checkpoint, flag, crumble, respawnPop, forcefield) use ACTOR units — pass the same `s` as the
// actor standing there (s .5 ≈ a 475 px tall hero). Tip / UI / foam use plain pixels at s 1.
// No SVG filters, masks or blend modes; a few clipPaths only in glitch slices / rolling digits / sheens.
'use strict';

const S = require('../rig/svg');
const V = require('./vo');
const { f, clamp, lerp, ease } = S;

const W = 1920, H = 1080;
const LINE = '#151515';
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const bumpK = (k) => Math.sin(clamp(k, 0, 1) * Math.PI);
const mod = (a, n) => ((a % n) + n) % n;   // modulo that is safe for negative t
const smooth = (a, b, v) => { const u = seg(v, a, b); return u * u * (3 - 2 * u); };
const ol = (fill, w = 6) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const ln = (w, c = LINE, op) => ({ fill: 'none', stroke: c, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(op !== undefined ? { opacity: f(op) } : {}) });
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const T = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, esc(s));
const TF = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, esc(s));
const stroked = (sw, extra = {}) => ({ stroke: LINE, 'stroke-width': sw, 'stroke-linejoin': 'round', 'paint-order': 'stroke', ...extra });
const tr = (x, y, s = 1, rot = 0) => `translate(${f(x)} ${f(y)})${rot ? ` rotate(${f(rot)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const ring = (x, y, r) => (r > 0.05 ? `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z` : '');
const sq = (x, y, r, rot = 0) => {   // square of half-size r rotated by rot (deg), as path data
  const c = Math.cos((rot * Math.PI) / 180) * r, s_ = Math.sin((rot * Math.PI) / 180) * r;
  return `M${f(x - c + s_)} ${f(y - s_ - c)}L${f(x + c + s_)} ${f(y + s_ - c)}L${f(x + c - s_)} ${f(y + s_ + c)}L${f(x - c - s_)} ${f(y - s_ + c)}Z`;
};
// 4-point twinkle star (path data)
const star4 = (x, y, r, rot = 0) => {
  if (r <= 0.05) return '';
  const p = (a, d) => [x + Math.cos(a + (rot * Math.PI) / 180) * d, y + Math.sin(a + (rot * Math.PI) / 180) * d];
  let d = '';
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 - Math.PI / 2, [px, py] = p(a, r), [qx, qy] = p(a + Math.PI / 4, r * 0.2), [nx, ny] = p(a + Math.PI / 2, r);
    d += (i ? '' : `M${f(px)} ${f(py)}`) + `Q${f(qx)} ${f(qy)} ${f(nx)} ${f(ny)}`;
  }
  return d + 'Z';
};
// 5-point star path data
const star5 = (x, y, R, r = R * 0.48) => {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r : R; d += (i ? 'L' : 'M') + `${f(x + Math.cos(a) * rr)} ${f(y + Math.sin(a) * rr)}`; }
  return d + 'Z';
};

// ---------------------------------------------------------------- colour helpers (memoised)
const _rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const _mixC = new Map();
function mix(a, b, k) {
  k = clamp(k, 0, 1);
  const key = a + b + Math.round(k * 100);
  let v = _mixC.get(key);
  if (!v) {
    const A = _rgb(a), B = _rgb(b);
    v = '#' + A.map((c, i) => Math.round(lerp(c, B[i], Math.round(k * 100) / 100)).toString(16).padStart(2, '0')).join('').toUpperCase();
    _mixC.set(key, v);
  }
  return v;
}
const darker = (c, k = 0.25) => mix(c, '#000000', k);
const lighter = (c, k = 0.3) => mix(c, '#FFFFFF', k);

// ---------------------------------------------------------------- text metrics (glyph advances measured in Chromium, size 100, chars 32..126)
const WL = [19, 29, 46, 83, 53, 80, 67, 30, 43, 42, 56, 60, 31, 53, 23, 57, 64, 41, 53, 53, 60, 52, 58, 50, 57, 57, 28, 28, 48, 58, 45, 58, 87, 66, 59, 56, 62, 49, 47, 62, 64, 43, 46, 62, 44, 91, 65, 70, 57, 71, 59, 53, 50, 63, 66, 95, 68, 62, 56, 39, 59, 39, 69, 64, 35, 52, 52, 42, 57, 49, 38, 52, 50, 27, 27, 53, 27, 79, 55, 51, 56, 51, 40, 45, 37, 54, 52, 75, 56, 54, 45, 36, 63, 36, 46];
const WFr = [24, 25, 40, 70, 44, 78, 70, 19, 36, 36, 47, 49, 22, 40, 22, 49, 57, 38, 57, 57, 55, 49, 52, 52, 54, 52, 22, 22, 58, 45, 58, 48, 84, 71, 61, 63, 66, 60, 61, 72, 65, 24, 53, 60, 57, 81, 67, 72, 60, 78, 60, 54, 64, 68, 73, 95, 69, 64, 60, 32, 49, 32, 49, 77, 45, 56, 55, 50, 55, 54, 42, 55, 56, 25, 23, 51, 31, 79, 57, 56, 54, 54, 43, 46, 43, 57, 58, 74, 54, 58, 55, 35, 20, 35, 56];
const WEX = { '…': [91, 80], '·': [31, 22], '—': [79, 67], '–': [55, 50] };
// advance width of a string; font 'L' = Lilita One, 'F' = Fredoka 700; spacing = letter-spacing px
function textW(str, size, font = 'F', spacing = 0) {
  const tab = font === 'L' ? WL : WFr;
  let w = 0, n = 0;
  for (const ch of String(str)) {
    const c = ch.charCodeAt(0);
    w += c >= 32 && c < 127 ? tab[c - 32] : (WEX[ch] || [72, 72])[font === 'L' ? 0 : 1];
    n++;
  }
  return (w / 100) * size + spacing * n;
}
// greedy word wrap to maxW px
function wrap(text, maxW, size, font = 'F') {
  const words = String(text).split(/\s+/).filter(Boolean);
  const out = [];
  let cur = '';
  for (const w of words) {
    const cand = cur ? cur + ' ' + w : w;
    if (cur && textW(cand, size, font) > maxW) { out.push(cur); cur = w; } else cur = cand;
  }
  if (cur) out.push(cur);
  return out;
}
const fmt = (v) => (typeof v === 'number' ? Math.round(v).toLocaleString('en-US') : String(v));
// glitchy text: replaces some characters (per frame step) with junk glyphs; k 0..1
const JUNK = ['#', '%', '&', '?', '0', '1', '_', '/', '*', '@', '!', '<', '>'];
function scramble(text, t = 0, k = 0.5, seed = 1, fps = 14) {
  if (k <= 0) return text;
  const st = Math.floor(t * fps);
  return [...String(text)].map((ch, i) => (ch !== ' ' && hash(st * 1.7 + i * 3.1 + seed) < k * 0.45 ? JUNK[Math.floor(hash(st * 2.3 + i * 7.7 + seed) * JUNK.length)] : ch)).join('');
}

// ---------------------------------------------------------------- tiny shared drawings
// classic dotted loading wheel
function spinner(x, y, r, t, col = '#FFFFFF', n = 8, speed = 1.4, dot = 0.22) {
  const head = mod(Math.floor(t * speed * n), n);
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2, age = (head - i + n) % n;
    o += S.circle(x + Math.cos(a) * r, y + Math.sin(a) * r, r * dot * (1 - age * 0.05), { fill: col, opacity: f(1 - (age / n) * 0.85) });
  }
  return o;
}
// check mark path data inside a box of half-size r
const checkD = (x, y, r) => `M${f(x - r * 0.55)} ${f(y + r * 0.02)} L${f(x - r * 0.15)} ${f(y + r * 0.42)} L${f(x + r * 0.6)} ${f(y - r * 0.45)}`;
// small UI icons inside a circle of radius r (white strokes unless col)
function icon(kind, x, y, r, col = '#FFFFFF', t = 0) {
  const w = Math.max(2.5, r * 0.2);
  switch (kind) {
    case 'retry': {   // clockwise circular arrow, gap at the top
      const rr = r * 0.5, a0 = -Math.PI * 0.32, a1 = a0 + Math.PI * 1.55;
      const P = (a) => [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
      const [sx_, sy_] = P(a0), [ex, ey] = P(a1);
      const tx = -Math.sin(a1), ty = Math.cos(a1), nx = Math.cos(a1), ny = Math.sin(a1), hl = r * 0.34;
      return S.path(`M${f(sx_)} ${f(sy_)} A${f(rr)} ${f(rr)} 0 1 1 ${f(ex)} ${f(ey)}`, ln(w, col)) +
        S.path(`M${f(ex + tx * hl)} ${f(ey + ty * hl)} L${f(ex + nx * hl * 0.75)} ${f(ey + ny * hl * 0.75)} L${f(ex - nx * hl * 0.75)} ${f(ey - ny * hl * 0.75)} Z`, { fill: col, stroke: col, 'stroke-width': w * 0.5, 'stroke-linejoin': 'round' });
    }
    case 'play': return S.path(`M${f(x - r * 0.3)} ${f(y - r * 0.45)} L${f(x + r * 0.5)} ${f(y)} L${f(x - r * 0.3)} ${f(y + r * 0.45)} Z`, { fill: col, stroke: col, 'stroke-width': w * 0.6, 'stroke-linejoin': 'round' });
    case 'leave': return S.path(`M${f(x - r * 0.1)} ${f(y - r * 0.5)} H${f(x - r * 0.52)} V${f(y + r * 0.5)} H${f(x - r * 0.1)}`, ln(w, col)) +
      S.path(`M${f(x - r * 0.2)} ${f(y)} H${f(x + r * 0.55)} M${f(x + r * 0.28)} ${f(y - r * 0.28)} L${f(x + r * 0.56)} ${f(y)} L${f(x + r * 0.28)} ${f(y + r * 0.28)}`, ln(w, col));
    case 'check': return S.path(checkD(x, y, r * 0.8), ln(w * 1.25, col));
    case 'flag': return S.path(`M${f(x - r * 0.35)} ${f(y + r * 0.55)} V${f(y - r * 0.55)}`, ln(w, col)) +
      S.path(`M${f(x - r * 0.3)} ${f(y - r * 0.55)} H${f(x + r * 0.5)} L${f(x + r * 0.32)} ${f(y - r * 0.27)} L${f(x + r * 0.5)} ${f(y + r * 0.02)} H${f(x - r * 0.3)} Z`, { fill: col });
    case 'warn': return S.path(`M${f(x)} ${f(y - r * 0.62)} L${f(x + r * 0.62)} ${f(y + r * 0.5)} L${f(x - r * 0.62)} ${f(y + r * 0.5)} Z`, { fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linejoin': 'round' }) +
      S.path(`M${f(x)} ${f(y - r * 0.2)} V${f(y + r * 0.12)}`, ln(w, col)) + S.circle(x, y + r * 0.32, w * 0.6, { fill: col });
    case 'star': return S.path(star5(x, y, r * 0.62), { fill: col, stroke: col, 'stroke-width': w * 0.4, 'stroke-linejoin': 'round' });
    case 'heart': return S.path(`M${f(x)} ${f(y + r * 0.5)} C${f(x - r * 0.9)} ${f(y - r * 0.05)} ${f(x - r * 0.45)} ${f(y - r * 0.75)} ${f(x)} ${f(y - r * 0.3)} C${f(x + r * 0.45)} ${f(y - r * 0.75)} ${f(x + r * 0.9)} ${f(y - r * 0.05)} ${f(x)} ${f(y + r * 0.5)}Z`, { fill: col });
    case 'cal': return S.rect(x - r * 0.48, y - r * 0.42, r * 0.96, r * 0.88, r * 0.12, { fill: 'none', stroke: col, 'stroke-width': w }) + S.path(`M${f(x - r * 0.48)} ${f(y - r * 0.12)} H${f(x + r * 0.48)} M${f(x - r * 0.24)} ${f(y - r * 0.58)} V${f(y - r * 0.32)} M${f(x + r * 0.24)} ${f(y - r * 0.58)} V${f(y - r * 0.32)}`, ln(w, col));
    case 'gfx': {   // monitor with 1 of 4 bars lit
      let o = S.rect(x - r * 0.62, y - r * 0.5, r * 1.24, r * 0.82, r * 0.1, { fill: 'none', stroke: col, 'stroke-width': w * 0.9 }) + S.path(`M${f(x - r * 0.25)} ${f(y + r * 0.56)} H${f(x + r * 0.25)}`, ln(w, col));
      for (let i = 0; i < 4; i++) o += S.rect(x - r * 0.42 + i * r * 0.24, y + r * 0.2 - (i + 1) * r * 0.13, r * 0.14, (i + 1) * r * 0.13, 1, { fill: col, opacity: i === 0 ? 1 : 0.25 });
      return o;
    }
    case 'info': return S.circle(x, y - r * 0.38, w * 0.65, { fill: col }) + S.path(`M${f(x)} ${f(y - r * 0.08)} V${f(y + r * 0.5)}`, ln(w * 1.1, col));
    case 'skull': return S.path(`M${f(x - r * 0.45)} ${f(y - r * 0.45)} L${f(x + r * 0.45)} ${f(y + r * 0.45)} M${f(x + r * 0.45)} ${f(y - r * 0.45)} L${f(x - r * 0.45)} ${f(y + r * 0.45)}`, ln(w * 1.2, col));
    case 'pause': return S.rect(x - r * 0.42, y - r * 0.48, r * 0.3, r * 0.96, r * 0.08, { fill: col }) + S.rect(x + r * 0.12, y - r * 0.48, r * 0.3, r * 0.96, r * 0.08, { fill: col });
    default: return '';
  }
}
// infinity sign (Fredoka has no ∞ glyph): centred at x, y, width w
function infinity(x, y, w, col, sw) {
  const a = w / 2, b = w * 0.26;
  const d = `M${f(x)} ${f(y)} C${f(x + a * 0.35)} ${f(y - b * 1.3)} ${f(x + a)} ${f(y - b * 1.3)} ${f(x + a)} ${f(y)} C${f(x + a)} ${f(y + b * 1.3)} ${f(x + a * 0.35)} ${f(y + b * 1.3)} ${f(x)} ${f(y)} C${f(x - a * 0.35)} ${f(y - b * 1.3)} ${f(x - a)} ${f(y - b * 1.3)} ${f(x - a)} ${f(y)} C${f(x - a)} ${f(y + b * 1.3)} ${f(x - a * 0.35)} ${f(y + b * 1.3)} ${f(x)} ${f(y)} Z`;
  return S.path(d, { fill: 'none', stroke: LINE, 'stroke-width': sw * 2.2, 'stroke-linejoin': 'round' }) + S.path(d, { fill: 'none', stroke: col, 'stroke-width': sw, 'stroke-linejoin': 'round' });
}

// ---------------------------------------------------------------- static defs (loaded by scenes/main.js)
const DEFS = `<defs>
<radialGradient id="rspGlowG"><stop offset="0" stop-color="#8CFFC0" stop-opacity="0.95"/><stop offset="0.45" stop-color="#3DDC84" stop-opacity="0.42"/><stop offset="1" stop-color="#3DDC84" stop-opacity="0"/></radialGradient>
<radialGradient id="rspGlowY"><stop offset="0" stop-color="#FFF6A8" stop-opacity="0.95"/><stop offset="0.45" stop-color="#FFD43B" stop-opacity="0.38"/><stop offset="1" stop-color="#FFD43B" stop-opacity="0"/></radialGradient>
<radialGradient id="rspGlowR"><stop offset="0" stop-color="#FF8A96" stop-opacity="0.95"/><stop offset="0.45" stop-color="#FF3B4E" stop-opacity="0.42"/><stop offset="1" stop-color="#FF3B4E" stop-opacity="0"/></radialGradient>
<radialGradient id="rspGlowW"><stop offset="0" stop-color="#FFFFFF" stop-opacity="1"/><stop offset="0.4" stop-color="#FFFFFF" stop-opacity="0.45"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
<radialGradient id="rspGlowB"><stop offset="0" stop-color="#E6F6FF" stop-opacity="1"/><stop offset="0.4" stop-color="#9FD8FF" stop-opacity="0.45"/><stop offset="1" stop-color="#9FD8FF" stop-opacity="0"/></radialGradient>
<linearGradient id="rspPillar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3DDC84" stop-opacity="0"/><stop offset="0.22" stop-color="#7CFFB2" stop-opacity="0.55"/><stop offset="0.5" stop-color="#FFFFFF" stop-opacity="1"/><stop offset="0.78" stop-color="#7CFFB2" stop-opacity="0.55"/><stop offset="1" stop-color="#3DDC84" stop-opacity="0"/></linearGradient>
<linearGradient id="rspHaze" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#5CFFA0" stop-opacity="0.55"/><stop offset="1" stop-color="#5CFFA0" stop-opacity="0"/></linearGradient>
<linearGradient id="rspHazeR" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FF5A6A" stop-opacity="0.55"/><stop offset="1" stop-color="#FF5A6A" stop-opacity="0"/></linearGradient>
<linearGradient id="rspWaveR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5CFFA0" stop-opacity="0"/><stop offset="1" stop-color="#5CFFA0" stop-opacity="0.85"/></linearGradient>
<linearGradient id="rspWaveL" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#5CFFA0" stop-opacity="0"/><stop offset="1" stop-color="#5CFFA0" stop-opacity="0.85"/></linearGradient>
<linearGradient id="rspSheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.7"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
<linearGradient id="rspBarR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF5A6A"/><stop offset="1" stop-color="#C8182F"/></linearGradient>
<linearGradient id="rspBarG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#47E58F"/><stop offset="1" stop-color="#16944F"/></linearGradient>
<linearGradient id="rspBarK" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6E7890"/><stop offset="1" stop-color="#48506A"/></linearGradient>
<pattern id="rspScan" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="3" fill="#000000" opacity="0.45"/></pattern>
<pattern id="rspScanW" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="2" fill="#FFFFFF" opacity="0.5"/></pattern>
<pattern id="rspChecker" width="80" height="80" patternUnits="userSpaceOnUse"><rect width="80" height="80" fill="#868C98"/><rect width="40" height="40" fill="#B1B6C0"/><rect x="40" y="40" width="40" height="40" fill="#B1B6C0"/></pattern>
<pattern id="rspHazard" width="44" height="44" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><rect width="22" height="44" fill="#000000" opacity="0.2"/></pattern>
<style>
.rspTR *{fill:#FF2E63!important;stroke:#FF2E63!important;filter:none!important}.rspTR [fill=none]{fill:none!important}
.rspTC *{fill:#2EE6FF!important;stroke:#2EE6FF!important;filter:none!important}.rspTC [fill=none]{fill:none!important}
.rspTW *{fill:#FFFFFF!important;stroke:#FFFFFF!important;filter:none!important}.rspTW [fill=none]{fill:none!important}
.rspTK *{fill:#151515!important;stroke:#151515!important;filter:none!important}.rspTK [fill=none]{fill:none!important}
.rspTG *{fill:#C7CDD8!important;stroke:#6F778A!important;filter:none!important}.rspTG [fill=none]{fill:none!important}
</style>
</defs>`;

// ================================================================ 1. TIP — the tutorial helper
const TIPC = { base: '#FFD43B', shade: '#F2A516', hi: '#FFF6C4', tab: '#FF8A1F', tabHi: '#FFB766', blush: '#FF9C7A', mouth: '#6B1A22', tongue: '#FF7F8E' };
const TIP_LABELS = ['T-T-TIP', 'T-TIP', 'TIP', 'T1P', '7IP', 'TI#', 'T_P', 'TIP?', 'T!P', 'TTIP'];
const TIP_MOODS = {
  happy: { mouth: 'smile', blush: 0.6, brows: null },
  smug: { lid: 0.44, lidTilt: 3, mouth: 'smirk', blush: 0.45, brows: [[6, -3], [-1, 3]] },
  suspicious: { lid: 0.5, lidTilt: -2, lidLow: 0.22, mouth: 'flat', blush: 0, brows: [[0, 5], [-4, 5]] },
  worried: { mouth: 'wavy', blush: 0, sweat: 1, eye: 1.1, brows: [[3, -6], [3, -6]] },
  sad: { lid: 0.3, lidTilt: 5, mouth: 'frown', blush: 0, look: [0, 0.45], brows: [[1, -5], [1, -5]] },
};
const VIS_OPEN = { X: 0, A: 0, B: 0.3, C: 0.55, D: 0.85, E: 0.62, F: 0.32, G: 0.2, H: 0.5 };
// mood from the current TIP voice line's [tags]
function tipAutoMood(t) {
  const l = V.lineAt('TIP', t, 0.35);
  if (!l) return null;
  const tags = (l.raw.match(/\[([^\]]*)\]/g) || []).join(' ').toLowerCase();
  if (/smug|proud/.test(tags)) return 'smug';
  if (/suspicious/.test(tags)) return 'suspicious';
  if (/whisper/.test(tags)) return 'smug';
  if (/urgent|glitch|quickly|panic|nervous/.test(tags)) return 'worried';
  return 'happy';
}
// speech bubble body with a small pointer tail (tail -1 left, 1 right, 0 none); 132 x 104
function tipBodyPath(tail = -1) {
  const x0 = -66, x1 = 66, y0 = -52, y1 = 52, r = 36;
  let bottom = `H${x0 + r}`;
  if (tail < 0) bottom = `L8 ${y1} Q-2 ${y1 + 20} -32 ${y1 + 30} Q-19 ${y1 + 14} -24 ${y1} H${x0 + r}`;
  else if (tail > 0) bottom = `L24 ${y1} Q19 ${y1 + 14} 32 ${y1 + 30} Q2 ${y1 + 20} -8 ${y1} H${x0 + r}`;
  return `M${x0 + r} ${y0} H${x1 - r} Q${x1} ${y0} ${x1} ${y0 + r} V${y1 - r} Q${x1} ${y1} ${x1 - r} ${y1} ${bottom} Q${x0} ${y1} ${x0} ${y1 - r} V${y0 + r} Q${x0} ${y0} ${x0 + r} ${y0} Z`;
}
function tipMouth(mood, vis, open) {
  const MY = 22;
  if (vis && vis !== 'X' && vis !== 'A' && open > 0.04) {
    if (vis === 'E' || vis === 'F') {
      const rx = 7 + 5 * open, ry = 5 + 11 * open;
      return S.ellipse(0, MY + ry * 0.35, rx, ry, ol(TIPC.mouth, 4)) + (open > 0.45 ? S.ellipse(0, MY + ry * 0.75, rx * 0.55, ry * 0.32, { fill: TIPC.tongue }) : '');
    }
    const w = 12 + 6 * open, top = MY - 3, bot = MY + 4 + 17 * open;
    let o = S.path(`M${f(-w)} ${top} Q0 ${top + 3} ${f(w)} ${top} Q${f(w * 0.9)} ${f(bot)} 0 ${f(bot)} Q${f(-w * 0.9)} ${f(bot)} ${f(-w)} ${top}Z`, ol(TIPC.mouth, 4));
    if (open > 0.45) o += S.ellipse(0, bot - 4 - 2 * open, w * 0.48, 2.5 + 3 * open, { fill: TIPC.tongue });
    if (vis === 'G' || vis === 'B') o += S.rect(-w * 0.55, top + 1, w * 1.1, 4, 1.5, { fill: '#FFFFFF' });
    return o;
  }
  if (vis === 'A') return S.path(`M-11 ${MY + 1} Q0 ${MY + 3} 11 ${MY + 1}`, ln(5.5));
  switch (mood.mouth) {
    case 'smirk': return S.path(`M-12 ${MY + 3} Q3 ${MY + 9} 15 ${MY - 6}`, ln(4.5));
    case 'flat': return S.path(`M-5 ${MY + 4} L12 ${MY + 1}`, ln(4.5));
    case 'wavy': return S.path(`M-15 ${MY + 3} Q-10 ${MY - 3} -5 ${MY + 3} Q0 ${MY + 9} 5 ${MY + 3} Q10 ${MY - 3} 15 ${MY + 3}`, ln(4));
    case 'frown': return S.path(`M-12 ${MY + 7} Q0 ${MY - 5} 12 ${MY + 7}`, ln(4.5));
    default: return S.path(`M-13 ${MY - 3} Q0 ${MY + 1} 13 ${MY - 3} Q12 ${MY + 13} 0 ${MY + 13} Q-12 ${MY + 13} -13 ${MY - 3}Z`, ol(TIPC.mouth, 4)) + S.ellipse(0, MY + 9, 6, 2.8, { fill: TIPC.tongue });
  }
}
function tipFace(mood, look, blink, vis, open, base, t) {
  let o = '';
  const lx = look[0] * 8, ly = look[1] * 6;
  if (mood.blush) for (const sd of [-1, 1]) o += S.ellipse(sd * 42 + lx * 0.6, 14 + ly * 0.5, 10, 6, { fill: TIPC.blush, opacity: f(mood.blush) });
  const ek = mood.eye || 1, rx = 11 * ek, ry = 15 * ek, ey = -8 + ly;
  for (const sd of [-1, 1]) {
    const cx = sd * 25 + lx;
    if (blink > 0.55) { o += S.path(`M${f(cx - rx)} ${f(ey + 1)} Q${f(cx)} ${f(ey + 8)} ${f(cx + rx)} ${f(ey + 1)}`, ln(4.5)); }
    else {
      const ryb = ry * (1 - blink * 0.85);
      o += S.ellipse(cx, ey, rx, ryb, { fill: LINE });
      if (ryb > 6) o += S.circle(cx - rx * 0.3 + look[0] * 1.5, ey - ryb * 0.4, rx * 0.4, { fill: '#FFFFFF' }) + S.circle(cx + rx * 0.32, ey + ryb * 0.36, rx * 0.17, { fill: '#FFFFFF' });
      const lid = mood.lid || 0;
      if (lid > 0) {
        const tl = (mood.lidTilt || 0) * sd, yl = ey - ry + 2 * ry * lid;
        o += S.path(`M${f(cx - rx - 4)} ${f(ey - ry - 5)} H${f(cx + rx + 4)} V${f(yl + tl)} L${f(cx - rx - 4)} ${f(yl - tl)} Z`, { fill: base });
        o += S.path(`M${f(cx - rx - 3)} ${f(yl - tl)} L${f(cx + rx + 3)} ${f(yl + tl)}`, ln(4.5));
      }
      if (mood.lidLow) {
        const yl = ey + ry - 2 * ry * mood.lidLow;
        o += S.path(`M${f(cx - rx - 4)} ${f(ey + ry + 5)} H${f(cx + rx + 4)} V${f(yl)} H${f(cx - rx - 4)} Z`, { fill: base }) + S.path(`M${f(cx - rx - 2)} ${f(yl)} L${f(cx + rx + 2)} ${f(yl)}`, ln(4));
      }
    }
    // brows: [raise, tilt] per side (tilt + = inner end lower)
    if (mood.brows) {
      const [rs, tl] = mood.brows[sd < 0 ? 0 : 1];
      const by = ey - ry - 9 - rs, xi = cx - sd * 2 - sd * -10, xo = cx + sd * 12;
      o += S.path(`M${f(xo)} ${f(by - tl * 0.4)} Q${f(cx)} ${f(by - 4)} ${f(cx - sd * 11)} ${f(by + tl)}`, ln(4.5));
      void xi;
    }
  }
  o += S.g(tipMouth(mood, vis, open), lx || ly ? `translate(${f(lx * 0.7)} ${f(ly * 0.5)})` : null);
  if (mood.sweat) o += S.path(`M58 -34 Q66 -22 64 -16 A6.5 6.5 0 1 1 52 -16 Q50 -22 58 -34Z`, ol('#8AD8FF', 3.5));
  return o;
}
// tip({ x, y, s, t, look, mood, glitch, fade, label, bob, talk, tail, glow, seed }) — (x, y) = bubble centre; ~132 x 104 px at s 1
function tip(o = {}) {
  const { x = 960, y = 400, s = 1, t = 0, look = [0, 0], label = true, bob = true, talk, seed = 1, tail = -1, glow = 1 } = o;
  const fade = clamp(o.fade || 0, 0, 1), g = clamp(o.glitch || 0, 0, 1);
  if (fade >= 1) return '';
  const mood = TIP_MOODS[o.mood || tipAutoMood(t) || 'happy'] || TIP_MOODS.happy;
  // speech -> viseme + open amount
  let vis = null, openO;
  if (talk === undefined) vis = V.viseme('TIP', t);
  else if (typeof talk === 'string') vis = talk;
  else if (typeof talk === 'number') { openO = clamp(talk, 0, 1); vis = openO > 0.05 ? 'C' : 'X'; }
  else if (talk === true) { const a = 0.5 + 0.5 * Math.sin(t * 19 + seed); openO = a * 0.8; vis = a > 0.15 ? 'C' : 'X'; }
  const open = vis ? (openO ?? VIS_OPEN[vis] ?? 0.4) : 0;
  const step = Math.floor(t * 18);
  let jx = 0, jy = 0;
  if (g > 0 && hash(step * 1.37 + seed) < 0.2 + 0.5 * g) { jx = (hash(step * 2.1 + seed) - 0.5) * 34 * g; jy = (hash(step * 4.3 + seed) - 0.5) * 12 * g; }
  const by = bob ? Math.sin(t * 2.6 + seed) * 6 : 0;
  const rot = (bob ? Math.sin(t * 1.9 + seed) * 3 : 0) + look[0] * 4;
  const sqz = 1 + (bob ? 0.025 * Math.sin(t * 5.2 + seed) : 0) + 0.07 * open;
  const shrink = 1 - 0.3 * ease.in(fade);
  const lookE = [look[0] + (mood.look ? mood.look[0] : 0), look[1] + (mood.look ? mood.look[1] : 0)];
  const bt = mod(t + seed * 0.71, 3.3);
  const blink = o.blink ?? (bt < 0.13 ? Math.sin((bt / 0.13) * Math.PI) : 0);
  const flick = g > 0 && hash(step * 3.7 + seed) < 0.16 * g;
  const base = flick ? '#FFFFFF' : TIPC.base, shade = flick ? '#C9D2E0' : TIPC.shade;
  let lab = 'TIP';
  if (g > 0 && hash(step * 0.71 + seed) < 0.3 + 0.6 * g) lab = TIP_LABELS[Math.floor(hash(step * 3.3 + seed) * TIP_LABELS.length)];
  const bp = tipBodyPath(tail);
  let b = '';
  if (glow > 0) b += S.ellipse(0, 2, 124, 110, { fill: 'url(#rspGlowY)', opacity: f(glow * (0.72 + 0.18 * Math.sin(t * 4.1 + seed))) });
  if (g > 0.02) {
    const d = (5 + 12 * g) * (0.6 + 0.8 * hash(step * 5.9 + seed));
    b += S.path(bp, { fill: '#FF2E63', opacity: f(0.65 * Math.min(1, g * 2)), transform: `translate(${f(-d)} ${f(-d * 0.15)})` }) +
      S.path(bp, { fill: '#2EE6FF', opacity: f(0.65 * Math.min(1, g * 2)), transform: `translate(${f(d)} ${f(d * 0.15)})` });
  }
  if (label) {
    const tw = textW(lab, 25, 'L', 1) + 26;
    b += S.rect(-tw / 2, -88, tw, 46, 14, ol(TIPC.tab, 5)) + S.rect(-tw / 2 + 6, -83, tw - 12, 7, 3.5, { fill: TIPC.tabHi }) +
      T(lab, 0, -61, 25, '#FFFFFF', stroked(5, { 'letter-spacing': 1 }));
  }
  b += S.path(bp, { fill: shade }) + S.rect(-62, -48, 118, 90, 30, { fill: base });
  b += S.path('M-50 -14 Q-51 -38 -26 -41', ln(7, TIPC.hi)) + S.circle(-51, 2, 3.6, { fill: TIPC.hi });
  b += S.path(bp, { fill: 'none', stroke: LINE, 'stroke-width': 6, 'stroke-linejoin': 'round' });
  b += tipFace(mood, lookE, blink, vis, open, base, t);
  const op = 1 - smooth(0.3, 0.82, fade);
  const tf = `translate(${f(x + jx * s)} ${f(y + (by + jy) * s)}) rotate(${f(rot)}) scale(${f((s * shrink) / Math.sqrt(sqz))} ${f(s * shrink * sqz)})`;
  let out = '';
  // twinkles (world-aligned)
  let tw = '';
  for (let i = 0; i < 3; i++) {
    const a = t * 0.8 + i * 2.09 + seed, r = 9 + 5 * Math.sin(t * 4 + i * 2.3);
    tw += star4(x + Math.cos(a) * 98 * s, y + by * s + Math.sin(a) * 80 * s, Math.max(0, r) * s, t * 40);
  }
  out += S.path(tw, { fill: '#FFF7C2', stroke: '#F2A516', 'stroke-width': f(1.5 * s), opacity: f(0.95 * op) });
  if (g > 0.02 && hash(step * 5.1 + seed) < 0.3 + 0.5 * g) {
    // horizontal slice offsets of the bubble (clipped <use> copies)
    const id = S.uid('rspTip');
    out += S.g(b, tf, { id, opacity: op < 1 ? f(op) : undefined });
    const nb = 1 + Math.round(g * 2);
    for (let i = 0; i < nb; i++) {
      const sy = y - 95 * s + hash(step * 7.1 + i * 13.3 + seed) * 180 * s, sh = (8 + hash(step + i * 5.7 + seed) * 26) * s;
      const cid = S.uid('rspTc');
      out += S.clipDef(cid, S.rect(x - 140 * s, sy, 280 * s, sh)) + S.g(S.el('use', { href: `#${id}`, x: f((hash(step * 3.3 + i + seed) - 0.5) * 60 * s * g) }), null, { 'clip-path': `url(#${cid})` });
    }
    let bl = '';
    for (let i = 0; i < 3 + Math.round(g * 5); i++) bl += `M${f(x + (hash(step * 1.7 + i * 3.1) - 0.5) * 220 * s)} ${f(y + (hash(step * 2.9 + i * 7.7) - 0.5) * 170 * s)}h${f((8 + hash(i + step) * 30) * s)}v${f((4 + hash(i * 2 + step) * 10) * s)}h${f(-(8 + hash(i + step) * 30) * s)}Z`;
    out += S.path(bl, { fill: step % 2 ? '#2EE6FF' : '#FF2E63', opacity: f(0.75 * g) });
  } else out += S.g(b, tf, op < 1 ? { opacity: f(op) } : {});
  // fade: the bubble breaks into small pixel squares that drift up, ending in one spark
  if (fade > 0) {
    const cols = [TIPC.base, '#FFE98A', TIPC.shade, '#FFFFFF'];
    const P = ['', '', '', ''];
    for (let i = 0; i < 40; i++) {
      const cx = -56 + (i % 8) * 16 + 8, cy = -44 + Math.floor(i / 8) * 18 + 9;
      const th = 0.06 + 0.5 * hash(i * 3.1 + seed) + 0.16 * (1 - (cy + 44) / 90);
      if (fade < th) continue;
      const a = (fade - th) / 0.42;
      if (a > 1.15) continue;
      const px = x + (cx + Math.sin(a * 5 + i) * 10 + (hash(i * 9.1) - 0.5) * a * 60) * s, py = y + by * s + (cy - a * 130 - a * a * 70) * s;
      P[i % 4] += sq(px, py, 7 * (1 - 0.55 * a) * s, a * 90 * (hash(i) - 0.5));
    }
    P.forEach((d, i) => { if (d) out += S.path(d, { fill: cols[i], stroke: i === 3 ? 'none' : '#C77A00', 'stroke-width': f(1.5 * s), opacity: f(1 - 0.5 * smooth(0.7, 1, fade)) }); });
    if (fade > 0.72) {
      const u = seg(fade, 0.72, 1), r = 46 * s * Math.sin(u * Math.PI);
      out += S.ellipse(x, y + by * s - 10 * s, r * 2.4, r * 2.4, { fill: 'url(#rspGlowY)', opacity: f(1 - u * 0.5) }) + S.path(star4(x, y + by * s - 10 * s, r, u * 120), { fill: '#FFFFFF', stroke: '#FFD43B', 'stroke-width': f(2 * s) });
    }
  }
  return out;
}

// tipCard(x, y, k, text, { t, w, s, type, size, accent, icon }) — yellow tutorial hint card, pops in with overshoot for k 0..1.
// (x, y) = card centre. "TIP:" prefix is drawn in the accent colour. type 0..1 = typewriter reveal (default 1).
function tipCard(x, y, k, text, o = {}) {
  const { t = 0, w = 640, s = 1, type = 1, size = 34, accent = '#E8650A', showIcon = true, rot = -2 } = o;
  const kk = clamp(k, 0, 1);
  if (kk <= 0.001) return '';
  const sc = ease.outBack(kk) * s;
  const pad = 26, iconW = showIcon ? 74 : 0;
  let prefix = '', body = String(text);
  const m = body.match(/^(T-*T*-*TIP:|TIP:)\s*/);
  if (m) { prefix = m[1]; body = body.slice(m[0].length); }
  const maxW = w - pad * 2 - iconW;
  const firstIndent = prefix ? textW(prefix, size * 1.02, 'L') + size * 0.32 : 0;
  // wrap with the prefix occupying the start of line 1
  const words = body.split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '', avail = maxW - firstIndent;
  for (const wd of words) {
    const cand = cur ? cur + ' ' + wd : wd;
    if (cur && textW(cand, size, 'F') > avail) { lines.push(cur); cur = wd; avail = maxW; } else cur = cand;
  }
  if (cur || !lines.length) lines.push(cur);
  const lh = size * 1.22, hh = Math.max(96, lines.length * lh + pad * 1.4);
  const x0 = -w / 2, y0 = -hh / 2;
  // typewriter
  const total = prefix.length + lines.join(' ').length;
  let shown = Math.round(clamp(type, 0, 1) * total);
  let c = S.rect(x0 + 10, y0 + 16, w, hh, 26, { fill: '#000000', opacity: 0.22 });
  c += S.rect(x0, y0 + 9, w, hh, 26, ol('#E0A200', 6));
  c += S.rect(x0, y0, w, hh, 26, ol('#FFE15A', 6));
  c += S.rect(x0 + 12, y0 + 9, w - 24, 12, 6, { fill: '#FFF3A6' });
  // dog-ear corner sparkle line
  c += S.path(`M${f(x0 + w - 34)} ${f(y0 + hh - 12)} L${f(x0 + w - 14)} ${f(y0 + hh - 30)}`, ln(5, '#E0A200'));
  if (showIcon) {
    const ix = x0 + pad + 30, iy = 0;
    const pulse = 1 + 0.06 * Math.sin(t * 6);
    c += S.circle(ix, iy, 32 * pulse, ol('#FF8A1F', 5));
    // light bulb
    c += S.path(`M${f(ix - 11)} ${f(iy + 6)} Q${f(ix - 17)} ${f(iy - 2)} ${f(ix - 15)} ${f(iy - 9)} A15 15 0 1 1 ${f(ix + 15)} ${f(iy - 9)} Q${f(ix + 17)} ${f(iy - 2)} ${f(ix + 11)} ${f(iy + 6)} Z`, ol('#FFF6B0', 3.5));
    c += S.rect(ix - 9, iy + 8, 18, 9, 3, ol('#C9CED8', 3));
    for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + (i - 1) * 0.8; c += S.path(`M${f(ix + Math.cos(a) * 21)} ${f(iy - 9 + Math.sin(a) * 21)} L${f(ix + Math.cos(a) * 27)} ${f(iy - 9 + Math.sin(a) * 27)}`, ln(3.5, '#FFFFFF')); }
  }
  const tx = x0 + pad + iconW;
  let ty = -((lines.length - 1) * lh) / 2 + size * 0.36;
  if (prefix) {
    const p = prefix.slice(0, Math.max(0, shown));
    shown -= prefix.length;
    if (p) c += T(p, tx, ty, size * 1.02, accent, { 'text-anchor': 'start' });
  }
  lines.forEach((l, i) => {
    if (shown <= 0) return;
    const part = l.slice(0, shown);
    shown -= l.length + 1;
    c += TF(part, tx + (i === 0 ? firstIndent : 0), ty + i * lh, size, '#3A2500', { 'text-anchor': 'start' });
  });
  // arrival flash
  if (kk < 1) c += S.rect(x0, y0, w, hh, 26, { fill: '#FFFFFF', opacity: f(0.7 * (1 - seg(kk, 0.2, 0.75))) });
  let fx = '';
  if (kk > 0.2 && kk < 1) { const u = seg(kk, 0.2, 1); fx = S.path(star4(x0 + w - 10 + 30 * u, y0 - 6 - 26 * u, 18 * bumpK(u)) + star4(x0 + 30 - 20 * u, y0 + hh + 8 * u, 12 * bumpK(u)), { fill: '#FFFFFF', stroke: '#F2A516', 'stroke-width': 2 }); }
  return S.g(c, `translate(${f(x)} ${f(y)}) rotate(${f(rot * (1 - 0.6 * ease.outBack(kk)) * 1)}) scale(${f(sc)})`) + fx;
}

// ================================================================ 2. CHECKPOINT — spawn pad, pole and flag
// Palettes per state. Geometry in ACTOR units (hero 950 tall at s 1): pad 840 x 224 (+62 thick), pole 700 tall at the back-right.
const CPAL = {
  green: { top: '#35D67E', topHi: '#6EF2A8', side: '#178A4C', sideHi: '#21A85E', rim: '#B6FFD6', ring: '#D6FFE8', led: '#F0FFF6', ledOff: '#0E6B39', glow: 'rspGlowG', haze: 'rspHaze', flag: '#2FD37A', flagShade: '#1E9F59', check: '#FFFFFF', ball: '#FFD21F', ringCol: '#7CFFB2' },
  red: { top: '#FF4A5C', topHi: '#FF8D98', side: '#A3182B', sideHi: '#C42037', rim: '#FFC2C8', ring: '#FFD8DC', led: '#FFE0E4', ledOff: '#5E0D18', glow: 'rspGlowR', haze: 'rspHazeR', flag: '#FF3B4E', flagShade: '#B81B31', check: '#FFE0E4', ball: '#FFB020', ringCol: '#FF7A88' },
  dead: { top: '#9DA3AE', topHi: '#B4B9C2', side: '#646A76', sideHi: '#737A86', rim: '#B8BDC6', ring: '#C9CDD5', led: '#7D838F', ledOff: '#555B66', glow: null, haze: null, flag: '#A6ACB6', flagShade: '#80868F', check: '#D5D9E0', ball: '#8E949F', ringCol: '#B8BDC6' },
};
const RX = 420, RY = 112, TH = 62, PX = 262, PY = -52, POLE = 700, FW = 250, FH = 160, LWW = 10;
const KP = RY / RX;   // floor perspective (ellipse ratio)

// waving cloth: attached at (0,0) to the pole, extends to +x. Returns { svg, at(u, v) }
function flagCloth(t, { w = FW, h = FH, wave = 1, col, shade, check = '#FFFFFF', torn = 0, lw = LWW, speed = 7, droop = 0, checkOn = true }) {
  const N = 7, top = [], bot = [];
  const dsp = (u, e) => wave * Math.sin(t * speed - u * 3.4 + e * 0.5) * 18 * u;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const xx = w * u * (1 - 0.05 * wave * Math.abs(Math.sin(t * speed * 0.5 - u * 2)));
    top.push([xx - droop * u * u * w * 0.35, dsp(u, 0) + droop * u * u * h * 0.9]);
    bot.push([xx - droop * u * u * w * 0.55, h + dsp(u, 1) + droop * u * u * h * 0.5 - droop * u * h * 0.3]);
  }
  if (torn > 0) {   // ragged right edge + missing lower corner
    bot[N] = [bot[N][0] - w * 0.18 * torn, bot[N][1] - h * 0.45 * torn];
    bot[N - 1] = [bot[N - 1][0], bot[N - 1][1] - h * 0.18 * torn];
  }
  const at = (u, v) => {
    const fi = clamp(u, 0, 1) * N, i = Math.min(N - 1, Math.floor(fi)), r = fi - i;
    const tx = lerp(top[i][0], top[i + 1][0], r), ty = lerp(top[i][1], top[i + 1][1], r), bx = lerp(bot[i][0], bot[i + 1][0], r), by = lerp(bot[i][1], bot[i + 1][1], r);
    return [lerp(tx, bx, v), lerp(ty, by, v)];
  };
  let edge = `L${f(top[N][0])} ${f(top[N][1])}`;
  if (torn > 0) {
    const a = top[N], b = bot[N];
    edge += ` L${f(lerp(a[0], b[0], 0.3) - 16 * torn)} ${f(lerp(a[1], b[1], 0.3))} L${f(lerp(a[0], b[0], 0.5) + 6)} ${f(lerp(a[1], b[1], 0.5))} L${f(lerp(a[0], b[0], 0.75) - 22 * torn)} ${f(lerp(a[1], b[1], 0.75))}`;
  }
  const d = 'M0 0 ' + top.slice(1).map((p) => `L${f(p[0])} ${f(p[1])}`).join(' ') + ` ${edge} L${f(bot[N][0])} ${f(bot[N][1])} ` + bot.slice(0, N).reverse().map((p) => `L${f(p[0])} ${f(p[1])}`).join(' ') + ' Z';
  let o = S.path(d, { fill: col, stroke: LINE, 'stroke-width': lw, 'stroke-linejoin': 'round' });
  // folds: shade the segments that face away
  let fd = '';
  for (let i = 0; i < N; i++) {
    const sl = top[i + 1][1] - top[i][1];
    if (sl > 3 * wave && i < N - (torn > 0 ? 1 : 0)) fd += `M${f(top[i][0])} ${f(top[i][1] + lw * 0.4)} L${f(top[i + 1][0])} ${f(top[i + 1][1] + lw * 0.4)} L${f(bot[i + 1][0])} ${f(bot[i + 1][1] - lw * 0.4)} L${f(bot[i][0])} ${f(bot[i][1] - lw * 0.4)} Z`;
  }
  if (fd) o += S.path(fd, { fill: shade, opacity: 0.7 });
  if (checkOn) {
    const c1 = at(0.24, 0.52), c2 = at(0.42, 0.74), c3 = at(0.74, 0.26);
    const cd = `M${f(c1[0])} ${f(c1[1])} L${f(c2[0])} ${f(c2[1])} L${f(c3[0])} ${f(c3[1])}`;
    if (torn > 0) {
      const m = at(0.58, 0.5);
      o += S.path(`M${f(c1[0])} ${f(c1[1])} L${f(c2[0])} ${f(c2[1])} L${f(m[0])} ${f(m[1])}`, ln(lw * 2.6)) + S.path(`M${f(c1[0])} ${f(c1[1])} L${f(c2[0])} ${f(c2[1])} L${f(m[0])} ${f(m[1])}`, ln(lw * 1.4, check));
      const hpt = at(0.66, 0.62);
      o += S.circle(hpt[0], hpt[1], 13, { fill: '#2A0C12', stroke: LINE, 'stroke-width': 4 });
    } else o += S.path(cd, ln(lw * 2.6)) + S.path(cd, ln(lw * 1.4, check));
  }
  return { svg: o, at };
}
function poleSVG(P, len = POLE, lw = LWW) {
  return S.rect(-13, -len, 26, len, 10, ol('#EEF2F8', lw * 0.8)) + S.rect(-5, -len + 16, 7, len - 32, 3.5, { fill: '#FFFFFF', opacity: 0.85 }) + S.rect(5, -len + 16, 4, len - 32, 2, { fill: '#B9C2D0' }) +
    S.circle(0, -len - 10, 20, ol(P.ball, lw * 0.8)) + S.circle(-6, -len - 16, 6, { fill: '#FFFFFF', opacity: 0.8 });
}
// checkpoint({ x, y, s, t, state:'idle'|'saved'|'red'|'dead', save 0..1, glow, part:'all'|'back'|'front', pole, flag })
// (x, y) = pad centre on the floor; s = the scale of the actor standing on it (s .5 -> a 420 px wide pad).
// Draw part 'back' before the actor and part 'front' after it (motes, burst sparkles, a light haze), or 'all' before the actor.
function checkpoint(o = {}) {
  const { x = 960, y = 900, s = 0.5, t = 0, state = 'saved', glow = 1, part = 'all', pole = true, flag: showFlag = true } = o;
  const P = state === 'red' ? CPAL.red : state === 'dead' ? CPAL.dead : CPAL.green;
  const save = o.save ?? (state === 'idle' ? 0 : 1);
  const blinkOn = state === 'red' ? (mod(Math.floor(t * 5), 2) === 0) : true;
  const sv = clamp(save, 0, 1);
  const pulse = save < 1 ? bumpK(seg(sv, 0, 0.55)) : 0;
  const boost = state === 'dead' ? 0 : glow * (state === 'idle' ? 0.55 : 1) * (1 + 1.2 * pulse) * (state === 'red' ? (blinkOn ? 1.1 : 0.45) : 1);
  let back = '', front = '';
  // floor glow + expanding save rings
  if (P.glow && boost > 0) back += S.ellipse(0, 18, 700, 220, { fill: `url(#${P.glow})`, opacity: f(Math.min(1, 0.66 * boost)) });
  if (sv > 0 && sv < 1) for (let j = 0; j < 2; j++) {
    const u = seg(sv, 0.04 + j * 0.13, 0.8 + j * 0.13);
    if (u <= 0 || u >= 1) continue;
    const rx = RX + RX * 4.6 * ease.out(u);
    back += S.ellipse(0, TH * 0.5, rx, rx * KP, { fill: 'none', stroke: P.ringCol, 'stroke-width': f(40 * (1 - u) + 5), opacity: f(0.95 * (1 - u)) });
    back += S.ellipse(0, TH * 0.5, rx * 0.97, rx * 0.97 * KP, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(12 * (1 - u)), opacity: f(0.85 * (1 - u)) });
  }
  // light haze above the pad (behind the actor)
  if (P.haze && boost > 0) {
    const hh = 640 * Math.min(1.5, 0.7 + 0.5 * boost);
    back += S.path(`M${-RX * 0.9} 0 L${RX * 0.9} 0 L${f(RX * 0.6)} ${f(-hh)} L${f(-RX * 0.6)} ${f(-hh)} Z`, { fill: `url(#${P.haze})`, opacity: f(Math.min(1, 0.55 * boost)) });
  }
  // the slab: side band, LEDs, top, emissive rim, rings, emblem
  const sideCol = blinkOn ? P.side : darker(P.side, 0.3);
  back += S.path(`M${-RX} 0 A${RX} ${RY} 0 0 0 ${RX} 0 V${TH} A${RX} ${RY} 0 0 1 ${-RX} ${TH} Z`, ol(sideCol, LWW));
  back += S.path(`M${-RX + 24} ${f(TH * 0.72)} A${RX - 24} ${RY - 8} 0 0 0 ${RX - 24} ${f(TH * 0.72)}`, ln(7, P.sideHi, 0.8));
  const nL = 13;
  let ledOn = '', ledOff = '';
  for (let i = 0; i < nL; i++) {
    const a = Math.PI * (0.08 + (0.84 * i) / (nL - 1));
    const lx = Math.cos(a) * RX * 0.95, ly = Math.sin(a) * RY * 0.95 + TH * 0.46;
    const lit = state === 'dead' ? false : state === 'red' ? blinkOn : ((i - t * (state === 'idle' ? 4 : 10)) % nL + nL) % nL < 4;
    const d = `M${f(lx - 15)} ${f(ly - 8)}h30v16h-30Z`;
    if (lit) ledOn += d; else ledOff += d;
  }
  if (ledOff) back += S.path(ledOff, { fill: P.ledOff, stroke: LINE, 'stroke-width': 3 });
  if (ledOn) back += S.path(ledOn, { fill: 'none', stroke: P.led, 'stroke-width': 14, opacity: 0.35, 'stroke-linejoin': 'round' }) + S.path(ledOn, { fill: P.led, stroke: LINE, 'stroke-width': 3 });
  const topCol = blinkOn ? P.top : darker(P.top, 0.35), hiCol = blinkOn ? P.topHi : darker(P.topHi, 0.35);
  back += S.ellipse(0, 0, RX, RY, ol(topCol, LWW));
  back += S.ellipse(0, -2, RX - 16, RY - 7, { fill: 'none', stroke: P.rim, 'stroke-width': 9, opacity: f(state === 'dead' ? 0.4 : 0.85) });
  back += S.ellipse(0, -4, RX * 0.78, RY * 0.72, { fill: hiCol });
  back += S.ellipse(0, -4, RX * 0.78, RY * 0.72, { fill: 'none', stroke: P.ring, 'stroke-width': 8, 'stroke-dasharray': '56 26', 'stroke-dashoffset': f(state === 'dead' ? 0 : -t * 70), opacity: 0.9 });
  back += S.ellipse(0, -3, RX * 0.48, RY * 0.44, { fill: topCol, stroke: P.ring, 'stroke-width': 6 });
  // painted check emblem (in floor perspective)
  const em = checkD(0, 0, RX * 0.32);
  back += S.g(S.path(em, ln(46, darker(topCol, 0.28))) + S.path(em, ln(26, state === 'dead' ? '#C9CDD5' : '#FFFFFF')), `translate(0 -3) scale(1 ${f(KP)})`, { opacity: f(state === 'dead' ? 0.5 : 0.95) });
  back += S.path(`M${f(-RX * 0.86)} ${f(-RY * 0.3)} A${RX * 0.9} ${RY * 0.82} 0 0 1 ${f(-RX * 0.32)} ${f(-RY * 0.8)}`, ln(10, '#FFFFFF', state === 'dead' ? 0.3 : 0.6));
  if (state === 'dead') back += S.path(`M-80 -40 L-30 -10 L-50 22 M150 -52 L190 -12 L240 -22 M-260 14 L-220 38`, ln(6, '#5C6270'));
  if (state === 'red') back += S.path(`M-120 -50 L-50 -14 L-90 26 L-40 52 M180 -64 L140 -14 L196 14`, ln(7, '#3A0610'));
  // save flash on the pad
  if (sv > 0.01 && sv < 0.5) back += S.ellipse(0, 0, RX, RY, { fill: '#FFFFFF', opacity: f(0.9 * (1 - seg(sv, 0.04, 0.45))) });
  // front: soft haze veil + rising motes
  if (P.haze && boost > 0) {
    const hh = 560;
    front += S.path(`M${-RX * 0.8} 0 L${RX * 0.8} 0 L${f(RX * 0.55)} ${f(-hh)} L${f(-RX * 0.55)} ${f(-hh)} Z`, { fill: `url(#${P.haze})`, opacity: f(Math.min(0.32, 0.12 * boost)) });
    let mo = '';
    for (let i = 0; i < 8; i++) {
      const u = mod(t * (0.35 + 0.2 * hash(i * 3.3)) + hash(i * 1.7), 1);
      mo += sq((hash(i * 5.1) - 0.5) * RX * 1.5 * (1 - u * 0.35), -u * hh, 11 * (1 - u * 0.6), u * 200);
    }
    front += S.path(mo, { fill: P.led, opacity: f(Math.min(1, 0.85 * boost)) });
  }
  // the save burst: sparkles + bits flying up
  if (sv > 0.02 && sv < 0.75) {
    const u = seg(sv, 0.02, 0.75);
    let sp = '', bl = '';
    for (let i = 0; i < 14; i++) {
      const a = -Math.PI / 2 + (hash(i * 2.7) - 0.5) * 2.2, v = 600 + 700 * hash(i * 4.1);
      const px = Math.cos(a) * v * u * 1.2, py = -TH + Math.sin(a) * v * u * 1.3 + 600 * u * u;
      if (i % 2) sp += star4(px, py, 32 * (1 - u), u * 200); else bl += sq(px, py, 14 * (1 - u), u * 300);
    }
    front += S.path(sp, { fill: '#FFFFFF', stroke: P.ringCol, 'stroke-width': 4 }) + S.path(bl, { fill: P.ringCol, stroke: LINE, 'stroke-width': 4 });
  }
  // pole + flag
  if (pole) {
    let pg = poleSVG(P);
    if (showFlag) {
      const up = state === 'dead' ? 1 : ease.outBack(seg(sv, 0.02, 0.32));
      const fy = lerp(-POLE * 0.34, -POLE + 12, up);
      const pale = state === 'idle' || sv < 0.15 ? 1 - seg(sv, 0.08, 0.3) : 0;
      const cloth = flagCloth(t, {
        wave: state === 'dead' ? 0 : state === 'idle' ? 0.5 : 1, col: mix(P.flag, '#CFEFDC', pale * 0.8), shade: P.flagShade,
        check: P.check, torn: state === 'red' ? 1 : 0, droop: state === 'dead' ? 0.35 : 0, speed: state === 'red' ? 11 : 7,
      });
      pg += S.g(cloth.svg, `translate(12 ${f(fy)})`);
    }
    const tfp = state === 'dead' ? `translate(${PX} ${PY}) rotate(-97) scale(-1 1)` : `translate(${PX} ${PY}) rotate(${f(state === 'red' ? 7 + Math.sin(t * 9) * 1.5 : 0)})`;
    back += S.g(S.ellipse(0, 0, 30, 11, ol('#BFC6D2', 6)) + pg, tfp);
    if (state === 'red' && mod(Math.floor(t * 7), 3) === 0) front += S.path(`M${PX + 50} ${PY - 460} l34 -22 l-12 34 l38 -18`, ln(7, '#FFE14D'));
  }
  const tf = `translate(${f(x)} ${f(y)}) scale(${f(s)})`;
  if (part === 'back') return S.g(back, tf);
  if (part === 'front') return front ? S.g(front, tf) : '';
  return S.g(back + front, tf);
}
// flag({ x, y, s, rot, state, t, plant 0..1, grip 0..1, wave }) — the portable checkpoint flag.
// (x, y) = the point of the pole at `grip` (0 = the spike at the bottom, 0.3 ≈ where a hand holds it).
// plant 0..1: slams down into the ground at 0.18 with a dirt puff, a green ring and a wobble.
function flag(o = {}) {
  const { x = 960, y = 900, s = 0.5, rot = 0, state = 'saved', t = 0, plant, grip = 0, wave = 1 } = o;
  const P = state === 'red' ? CPAL.red : state === 'dead' ? CPAL.dead : CPAL.green;
  const L = POLE;
  let r = rot, dy = 0, sink = 0, out = '';
  const pl = plant === undefined ? null : clamp(plant, 0, 1);
  const tI = 0.18;
  if (pl !== null) {
    if (pl < tI) { const u = ease.in(pl / tI); dy = -260 * (1 - u); r = rot * (1 - u); }
    else { const a = pl - tI; r = 12 * Math.exp(-a * 7) * Math.sin(a * 42); sink = 46 * ease.out(seg(pl, tI, tI + 0.06)); }
  }
  let g = '';
  // spike + pole
  if (sink <= 0) g += S.path(`M-11 -2 L0 34 L11 -2 Z`, ol('#C9CFDA', LWW * 0.8));
  g += poleSVG(P, L - sink);
  const cloth = flagCloth(t, { col: P.flag, shade: P.flagShade, check: P.check, wave: state === 'dead' ? 0 : wave, torn: state === 'red' ? 1 : 0, speed: 7 + Math.abs(rot) * 0.05 });
  g += S.g(cloth.svg, `translate(10 ${f(-L + sink + 10)})`);
  out += S.g(g, `translate(0 ${f(dy + grip * L)}) rotate(${f(r)} 0 ${f(-grip * L)})`);
  // dirt mound + puff after impact
  if (pl !== null && pl >= tI) {
    const a = seg(pl, tI, tI + 0.5);
    out = S.ellipse(0, 6, 84, 22, ol('#7A5232', 6)) + out + S.ellipse(0, 6, 56, 13, { fill: '#8E6440' });
    if (a < 1) {
      let dust = '', peb = '';
      const e = ease.out(a);
      for (let i = 0; i < 10; i++) {
        const sd = i % 2 ? 1 : -1, k = Math.floor(i / 2) / 4;
        const px = sd * (40 + (160 + 260 * k) * e), py = -(10 + 50 * k * (1 - k) * 4) * e;
        dust += ring(px, py - 6, (26 + 34 * k + 10 * hash(i)) * (0.5 + 0.7 * e));
        const ang = Math.PI * (1.15 + 0.7 * hash(i * 3.3)), v = 500 + 400 * hash(i * 7.1);
        if (i < 6) peb += sq(Math.cos(ang) * v * a, Math.sin(ang) * v * a + 1100 * a * a, 9 + 4 * hash(i), a * 500);
      }
      out += S.path(dust, { fill: '#E8D9C2', stroke: '#8A6A48', 'stroke-width': 4, opacity: f(0.95 * (1 - ease.in(a))) }) + S.path(peb, { fill: '#5A3B22', stroke: LINE, 'stroke-width': 3, opacity: f(1 - a * a) });
    }
    const u = seg(pl, tI, tI + 0.55);
    if (u > 0 && u < 1) out = S.ellipse(0, 6, 80 + 560 * ease.out(u), (80 + 560 * ease.out(u)) * 0.27, { fill: 'none', stroke: P.ringCol, 'stroke-width': f(30 * (1 - u) + 3), opacity: f(1 - u) }) + out;
  }
  return S.g(out, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
// props entry for actor(): the flag sticking out of the hero's backpack (body space, front view)
function flagProp(t, o = {}) {
  const { x = 120, y = -430, rot = 12, s = 0.95, state = 'saved', layer = 'back' } = o;
  return { svg: flag({ x, y, s, rot, state, t, wave: 0.8 }), layer };
}
// tinyFlag(x, y, s, t, { blink }) — mini pad + flag (≈ 80 px tall at s 1), e.g. at the bottom of Gary's bowl; blinks green
function tinyFlag(x, y, s = 1, t = 0, o = {}) {
  const { blink = true, state = 'saved' } = o;
  const P = state === 'red' ? CPAL.red : CPAL.green;
  const on = blink === true ? 0.5 + 0.5 * Math.sin(t * 5) : clamp(+blink || 0, 0, 1);
  let g = S.ellipse(0, 0, 70, 26, { fill: `url(#${P.glow})`, opacity: f(0.35 + 0.65 * on) });
  g += S.path('M-32 0 A32 9 0 0 0 32 0 V6 A32 9 0 0 1 -32 6 Z', ol(P.side, 3));
  g += S.ellipse(0, 0, 32, 9, ol(mix(P.top, '#FFFFFF', on * 0.35), 3)) + S.ellipse(0, -1, 18, 5, { fill: P.topHi });
  g += S.rect(14, -66, 5, 62, 2, ol('#EEF2F8', 2.5)) + S.circle(16.5, -68, 4, ol(P.ball, 2));
  const w = Math.sin(t * 6) * 2;
  g += S.path(`M19 -64 L44 ${f(-62 + w)} L44 ${f(-46 + w)} L19 -48 Z`, ol(P.flag, 3)) + S.path(`M25 ${f(-56 + w * 0.5)} L30 ${f(-51 + w * 0.6)} L38 ${f(-60 + w)}`, ln(3, '#FFFFFF'));
  g += S.path(star4(-20, -30 - 8 * on, 6 * on), { fill: '#FFFFFF' });
  return S.g(g, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

// ================================================================ 3. CRUMBLE — the fail: the hero breaks into blocks
const HERO_COLS = { hair: '#F28C28', skin: '#FFFFFF', jacket: '#D8262E', shirt: '#F2D04A', pants: '#1F3B2A', shoe: '#F4F5F8', line: '#151515' };
const GHOST_COLS = { hair: '#B9BFCB', skin: '#E9ECF2', jacket: '#9AA1AF', shirt: '#CDD2DB', pants: '#6F7686', shoe: '#E9ECF2', line: '#4A5060' };
// body-space blocks of the hero (front view, feet at 0,0, 950 tall): [x, y, size, part]
const BODY_BLOCKS = [
  [-110, -926, 118, 'hair'], [6, -952, 128, 'hair'], [118, -920, 112, 'hair'],
  [-78, -792, 118, 'skin'], [72, -800, 122, 'skin'], [-4, -672, 112, 'skin'],
  [-58, -762, 46, 'line'], [60, -758, 46, 'line'],
  [-132, -452, 104, 'jacket'], [128, -446, 104, 'jacket'], [0, -472, 108, 'shirt'], [4, -352, 100, 'shirt'],
  [-120, -330, 92, 'jacket'], [122, -326, 92, 'jacket'],
  [-238, -440, 92, 'jacket'], [236, -432, 92, 'jacket'], [-252, -300, 74, 'skin'], [254, -296, 74, 'skin'],
  [-66, -210, 100, 'pants'], [72, -206, 100, 'pants'], [-70, -98, 90, 'pants'], [68, -94, 90, 'pants'],
  [-76, -26, 72, 'shoe'], [80, -26, 72, 'shoe'],
];
// a 2-tone block (bevelled square) centred at cx, cy
function cube(cx, cy, size, rot, col, lw, op = 1) {
  const h = size / 2;
  if (h < 0.5) return '';
  const i = h - lw * 0.5, b = h * 0.34, c = h * 0.22;
  let o = S.rect(-h, -h, size, size, h * 0.16, { fill: col, stroke: LINE, 'stroke-width': f(lw) });
  o += S.path(`M${f(i)} ${f(-i + c)} L${f(i)} ${f(i - c * 0.3)} Q${f(i)} ${f(i)} ${f(i - c * 0.3)} ${f(i)} L${f(-i + c)} ${f(i)} L${f(-i + c + b * 0.7)} ${f(i - b * 0.7)} L${f(i - b * 0.7)} ${f(i - b * 0.7)} L${f(i - b * 0.7)} ${f(-i + c + b * 0.7)} Z`, { fill: darker(col, col === LINE ? 0 : 0.2) });
  o += S.rect(-i + h * 0.16, -i + h * 0.16, h * 0.46, h * 0.2, h * 0.1, { fill: col === LINE ? '#4A4A4A' : lighter(col, 0.45) });
  return S.g(o, `translate(${f(cx)} ${f(cy)}) rotate(${f(rot)})`, op < 1 ? { opacity: f(op) } : {});
}
// rough white silhouette of the hero (body space) for the first-frames "pop"
const SIL_D = 'M-262 -840 Q-262 -1010 -110 -1010 H110 Q262 -1010 262 -840 L250 -650 Q240 -560 160 -560 H-160 Q-240 -560 -250 -650 Z M-196 -560 H196 Q214 -560 222 -540 L300 -300 Q306 -270 276 -262 L236 -256 Q214 -252 206 -280 L190 -330 V-280 L166 -10 Q164 0 150 0 H-150 Q-164 0 -166 -10 L-190 -280 V-330 L-206 -280 Q-214 -252 -236 -256 L-276 -262 Q-306 -270 -300 -300 L-222 -540 Q-214 -560 -196 -560 Z';
// crumble({ x, y, s, age, seed, colors, dir, spread, floorY, ghost, life, chips })
//   (x, y) = feet like actor(); age = seconds since the fail (draw the actor only while age < 0)
//   dir: number (-1..1 horizontal bias) or [dx, dy] (e.g. [1, -0.3] = flung forward off a bike); spread scales the burst
//   colors: { hair, skin, jacket, shirt, pants, shoe, line } overrides or an array of colours to cycle; ghost 0..1 = grey copy
//   floorY: where blocks land (default y); blocks bounce once, settle flat and fade out by ≈ 1.5 s * life
function crumble(o = {}) {
  const { x = 960, y = 900, s = 0.5, seed = 1, spread = 1, ghost = 0, life = 1, chips = true, gravity = 1, pop = true } = o;
  const age = o.age ?? 0;
  if (age < 0 || age > 2.4 * life) return '';
  const fy = o.floorY ?? y;
  const D = Array.isArray(o.dir) ? o.dir : [o.dir || 0, 0];
  let cols = HERO_COLS;
  if (o.colors && !Array.isArray(o.colors)) cols = { ...HERO_COLS, ...o.colors };
  const gk = clamp(typeof ghost === 'number' ? ghost : ghost ? 1 : 0, 0, 1);
  const g = 5200 * s * gravity;
  const lw = Math.max(1.5, 8 * s);
  const a = Math.max(0, age - 0.03);
  let out = '';
  const pieces = [];
  const n = BODY_BLOCKS.length + (chips ? 10 : 0);
  for (let i = 0; i < n; i++) {
    const isChip = i >= BODY_BLOCKS.length;
    const src = isChip ? BODY_BLOCKS[(i * 7) % BODY_BLOCKS.length] : BODY_BLOCKS[i];
    const [bx, by, bs, part] = src;
    const h1 = hash(i * 3.17 + seed * 7.3), h2 = hash(i * 5.91 + seed * 1.9), h3 = hash(i * 9.4 + seed * 3.3);
    let col = Array.isArray(o.colors) ? o.colors[i % o.colors.length] : cols[part];
    if (gk > 0) col = mix(col, GHOST_COLS[part] || '#B9BFCB', gk);
    if (!isChip && part !== 'line' && part !== 'skin' && part !== 'shoe') col = mix(col, h3 > 0.5 ? '#FFFFFF' : '#000000', 0.06 * hash(i * 1.3 + seed));
    const size = (isChip ? bs * 0.34 : bs * (0.92 + 0.16 * h3)) * s;
    const x0 = x + (bx + (isChip ? (h1 - 0.5) * 80 : 0)) * s, y0 = y + (by + (isChip ? (h2 - 0.5) * 80 : 0)) * s;
    let dx = bx, dy = by + 500;
    const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
    const sp = (700 + 800 * h1) * s * spread * (isChip ? 1.35 : 1);
    const vx = dx * sp + (h2 - 0.5) * 600 * s + D[0] * 1500 * s * (0.75 + 0.5 * h3);
    const vy = dy * sp * 0.65 - (600 + 650 * h2) * s * spread + D[1] * 1500 * s;
    const w = (h3 - 0.5) * 1500 + (h3 > 0.5 ? 200 : -200);
    const yr = fy - size * 0.5;
    const A = 0.5 * g;
    let px, py, rot;
    let t1 = 0;
    if (y0 < yr) { const disc = vy * vy + 4 * A * (yr - y0); t1 = (-vy + Math.sqrt(Math.max(0, disc))) / (2 * A); }
    if (a < t1) { px = x0 + vx * a; py = y0 + vy * a + A * a * a; rot = w * a; }
    else {
      const vImp = vy + g * t1, vb = -Math.abs(vImp) * 0.34, vx2 = vx * 0.45, ta = a - t1, t2 = (-2 * vb) / g;
      const xI = x0 + vx * t1;
      if (ta < t2) { px = xI + vx2 * ta; py = yr + vb * ta + A * ta * ta; rot = w * t1 + w * 0.4 * ta; }
      else {
        const tb = ta - t2, r0 = w * t1 + w * 0.4 * t2;
        px = xI + vx2 * t2 + vx2 * 0.25 * (1 - Math.exp(-tb * 6)) / 1.5;
        py = yr;
        rot = lerp(r0, Math.round(r0 / 90) * 90, ease.out(clamp(tb / 0.16, 0, 1)));
      }
    }
    const end = (0.95 + 0.5 * h1) * life * (isChip ? 0.7 : 1);
    const fo = seg(age, end - 0.3, end);
    if (fo >= 1) continue;
    let sc = 1 - 0.45 * fo;
    if (age < 0.05) sc *= 0.9 + 2 * age;   // tiny anticipation swell
    const op = (1 - fo) * (1 - 0.4 * gk);
    pieces.push([py, isChip ? `<rect x="${f(px - size * sc / 2)}" y="${f(py - size * sc / 2)}" width="${f(size * sc)}" height="${f(size * sc)}" rx="${f(size * 0.15)}" fill="${col}" opacity="${f(op)}" transform="rotate(${f(rot)} ${f(px)} ${f(py)})"/>` : cube(px, py, size * sc, rot, col, lw, op)]);
  }
  // white pop silhouette + ring in the first frames
  if (pop && age < 0.4) {
    const u = age / 0.35;
    const ringCol = gk > 0.5 ? '#D9DEE7' : '#FFFFFF';
    if (u < 1) out += S.circle(x, y - 500 * s, (200 + 560 * ease.out(u)) * s, { fill: 'none', stroke: ringCol, 'stroke-width': f(44 * s * (1 - u)), opacity: f(1 - u) });
    if (age < 0.22) {
      const k = age / 0.22;
      let d = '';
      for (let i = 0; i < 10; i++) {
        const an = (i / 10) * Math.PI * 2 + seed, r0 = (220 + 560 * ease.out(k)) * s, r1 = r0 + 160 * s * (1 - k);
        d += `M${f(x + Math.cos(an) * r0)} ${f(y - 500 * s + Math.sin(an) * r0)} L${f(x + Math.cos(an) * r1)} ${f(y - 500 * s + Math.sin(an) * r1)} `;
      }
      out += S.path(d, ln(f(22 * s * (1 - k) + 2), ringCol));
    }
  }
  pieces.sort((p, q) => p[0] - q[0]);
  let sil = '';
  if (pop && age < 0.12) {   // the actor flashes white, then the blocks show through
    const k = age / 0.12;
    sil = S.path(SIL_D, { fill: '#FFFFFF', opacity: f(1 - k * k), transform: `translate(${f(x)} ${f(y - 500 * s)}) scale(${f(s * (1 + 0.25 * k))}) translate(0 500)` });
  }
  return out + pieces.map((p) => p[1]).join('') + sil;
}

// ================================================================ 4. RESPAWN — overlay, pop, forcefield
// respawnOverlay(t, { t0, dur, label, reason, count, marks, style:'full'|'banner'|'corner'|'mini', x, y, s, wash, flash, sub })
//   marks: [tThree, tTwo, tOne] makes each digit slam on that time (voice sync) instead of on thirds of dur.
//   the world "pauses": grey wash + scanlines + corner brackets, a big 3·2·1 (each digit slams in on its third of dur),
//   a progress ring and the fail reason. 'banner' = a grey band with 3 2 1 in a row; 'corner' = small pill (no wash);
//   'mini' = digit + ring only at (x, y). Returns '' outside [t0, t0+dur].
function respawnOverlay(t, o = {}) {
  const { t0 = 0, dur = 1.2, label = 'RESPAWNING', reason = '', count = 3, style = 'full', s = 1, wash = 1, flash = true, sub = '' } = o;
  const u = (t - t0) / dur;
  if (u < 0 || u > 1) return '';
  const fin = ease.out(seg(t, t0, t0 + 0.14)), fout = 1 - seg(t, t0 + dur - 0.08, t0 + dur);
  const vis = fin * fout;
  let step, p, digit, before = false;
  if (o.marks && o.marks.length) {   // digits pop exactly on the given times (e.g. the spoken "three", "two", "one")
    const M = o.marks;
    let i = 0;
    while (i + 1 < M.length && t >= M[i + 1]) i++;
    const a = M[i], b = i + 1 < M.length ? M[i + 1] : Math.max(a + 0.3, t0 + dur);
    step = i; p = clamp((t - a) / Math.max(0.05, b - a), 0, 1); before = t < M[0];
    digit = M.length - i;
  } else { step = Math.min(count - 1, Math.floor(u * count)); digit = count - step; p = u * count - step; }
  const slam = p < 0.24 ? lerp(2.2, 1, ease.outBack(p / 0.24)) : 1 - 0.05 * seg(p, 0.5, 1);
  const dOp = before ? 0 : clamp(p / 0.06, 0, 1);
  const dots = '.'.repeat(1 + mod(Math.floor(t * 5), 3));
  let o_ = '';
  // the big digit with a ring (shared by full / mini)
  const digitRing = (cx, cy, k, R = 168) => {
    let d = S.circle(cx, cy, R * k, { fill: '#121620', opacity: f(0.45 * vis), stroke: '#FFFFFF', 'stroke-opacity': 0.25, 'stroke-width': f(16 * k) });
    const C = 2 * Math.PI * R * k;
    d += S.circle(cx, cy, R * k, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(16 * k), 'stroke-linecap': 'round', 'stroke-dasharray': `${f(C * u)} ${f(C)}`, transform: `rotate(-90 ${f(cx)} ${f(cy)})`, opacity: f(vis) });
    for (let i = 1; i < count; i++) { const a = -Math.PI / 2 + (i / count) * Math.PI * 2; d += S.circle(cx + Math.cos(a) * R * k, cy + Math.sin(a) * R * k, 7 * k, { fill: u * count >= i ? '#FFFFFF' : '#7A8294', opacity: f(vis) }); }
    const hr = seg(p, 0, 0.5);
    if (hr < 1) d += S.circle(cx, cy, (R + 150 * ease.out(hr)) * k, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(12 * k * (1 - hr)), opacity: f((1 - hr) * vis) });
    d += S.g(T(String(digit), 6, 82, 250, '#000000', { opacity: 0.3 }) + T(String(digit), 0, 74, 250, '#FFFFFF', stroked(18)), `translate(${f(cx)} ${f(cy)}) scale(${f(k * slam)})`, { opacity: f(dOp * vis) });
    return d;
  };
  if (style === 'full' || style === 'mini') {
    const cx = o.x ?? 960, cy = o.y ?? (style === 'mini' ? 400 : 500);
    if (style === 'full') {
      o_ += S.rect(0, 0, W, H, 0, { fill: '#7E8596', opacity: f(0.5 * wash * vis) }) + S.rect(0, 0, W, H, 0, { fill: '#121624', opacity: f(0.3 * wash * vis) });
      o_ += S.rect(0, 0, W, H, 0, { fill: 'url(#rspScan)', opacity: f(0.55 * vis) });
      const ins = 70 + 30 * (1 - fin), L = 90;
      o_ += S.path(`M${ins} ${ins + L} V${ins} H${ins + L} M${W - ins - L} ${ins} H${W - ins} V${ins + L} M${W - ins} ${H - ins - L} V${H - ins} H${W - ins - L} M${ins + L} ${H - ins} H${ins} V${H - ins - L}`, ln(10, '#FFFFFF', 0.85 * vis));
      o_ += S.g(icon('pause', 0, 0, 30, '#FFFFFF') + TF('PAUSED', 42, 12, 34, '#FFFFFF', { 'text-anchor': 'start', 'letter-spacing': 4 }), `translate(${ins + 40} ${ins + 50})`, { opacity: f(0.85 * vis * (mod(Math.floor(t * 2.5), 2) ? 1 : 0.55)) });
      const lw_ = textW(label, 64, 'F', 8);
      o_ += S.g(TF(label, 0, 0, 64, '#FFFFFF', stroked(10, { 'letter-spacing': 8 })) + TF(dots, lw_ / 2 + 4, 0, 64, '#FFFFFF', stroked(10, { 'text-anchor': 'start', 'letter-spacing': 6 })), `translate(${f(cx)} ${f(cy - 230 * s)}) scale(${f(s * (0.85 + 0.15 * fin))})`, { opacity: f(vis) });
      if (sub) o_ += TF(sub, cx, cy - 178 * s, 30 * s, '#D5DAE4', { opacity: f(vis), 'letter-spacing': 3 });
    }
    o_ += digitRing(cx, cy, s * (style === 'mini' ? 0.6 : 1));
    if (reason && style === 'full') {
      const ru = ease.outBack(seg(t, t0 + 0.08, t0 + 0.32));
      const fs = 40 * s, rw = textW(reason, fs, 'F') + 110 * s;
      let r = S.rect(-rw / 2, -38 * s, rw, 76 * s, 38 * s, { fill: '#10131C', opacity: 0.88, stroke: '#FF5A6A', 'stroke-width': 4 * s });
      r += S.circle(-rw / 2 + 40 * s, 0, 22 * s, { fill: '#FF5A6A' }) + icon('skull', -rw / 2 + 40 * s, 0, 22 * s, '#FFFFFF');
      r += TF(reason, 24 * s, 14 * s, fs, '#FFFFFF');
      o_ += S.g(r, `translate(${f(cx)} ${f(cy + 255 * s + 30 * (1 - ru))}) scale(${f(0.6 + 0.4 * ru)})`, { opacity: f(seg(t, t0 + 0.08, t0 + 0.2) * vis) });
    }
  } else if (style === 'banner') {
    const cy = o.y ?? 540, bh = 230 * s * ease.outBack(fin) * fout;
    o_ += S.rect(0, 0, W, H, 0, { fill: '#7E8596', opacity: f(0.35 * wash * vis) });
    o_ += S.rect(0, cy - bh / 2, W, bh, 0, { fill: '#151A26', opacity: 0.82 }) + S.rect(0, cy - bh / 2, W, 8 * s, 0, { fill: '#FFFFFF', opacity: f(0.7 * vis) }) + S.rect(0, cy + bh / 2 - 8 * s, W, 8 * s, 0, { fill: '#FFFFFF', opacity: f(0.7 * vis) });
    o_ += S.rect(0, cy - bh / 2, W, bh, 0, { fill: 'url(#rspScan)', opacity: f(0.5 * vis) });
    if (bh > 60) {
      o_ += S.g(spinner(0, -14, 30, t, '#FFFFFF') + TF(label + dots.replace(/./g, '.'), 54, 0, 54, '#FFFFFF', { 'text-anchor': 'start', 'letter-spacing': 6 }) + (reason ? TF(reason, 54, 46, 30, '#FF9AA6', { 'text-anchor': 'start', 'letter-spacing': 2 }) : ''), `translate(${f(260 * s)} ${f(cy)}) scale(${f(s)})`, { opacity: f(vis) });
      const nD = o.marks ? o.marks.length : count;
      for (let i = 0; i < nD; i++) {
        const dgt = nD - i, cur = i === step && !before, past = i < step;
        const dx = W - 640 * s + i * 190 * s;
        const sc = cur ? slam : past ? 0.8 : 0.85;
        o_ += S.g(T(String(dgt), 0, 52, 150, cur ? '#FFFFFF' : past ? '#5C6476' : '#8A92A4', stroked(cur ? 14 : 8)), `translate(${f(dx)} ${f(cy)}) scale(${f(s * sc)})`, { opacity: f(vis) });
        if (i < nD - 1) o_ += S.circle(dx + 95 * s, cy, 9 * s, { fill: past ? '#FFFFFF' : '#5C6476', opacity: f(vis) });
      }
    }
  } else if (style === 'corner') {
    const cx = o.x ?? 1880, cy = o.y ?? 80, sc = s * ease.outBack(fin) * fout;
    const tw = textW(label, 30, 'F', 3);
    const wbox = tw + 190;
    let c = S.rect(-wbox, -46, wbox, 92, 46, { fill: '#151A26', opacity: 0.86, stroke: LINE, 'stroke-width': 6 });
    c += spinner(-wbox + 46, 0, 20, t, '#FFFFFF');
    c += TF(label, -wbox + 80, 11, 30, '#FFFFFF', { 'text-anchor': 'start', 'letter-spacing': 3 });
    c += S.circle(-48, 0, 34, ol('#FFFFFF', 5));
    c += S.g(T(String(digit), 0, 18, 52, '#151A26'), `translate(-48 0) scale(${f(slam * 0.9 + 0.1)})`);
    if (wash > 0 && o.wash !== undefined) o_ += S.rect(0, 0, W, H, 0, { fill: '#7E8596', opacity: f(0.35 * wash * vis) });
    o_ += S.g(c, `translate(${f(cx)} ${f(cy)}) scale(${f(sc)})`);
  }
  if (flash && u > 0.9) o_ += S.rect(0, 0, W, H, 0, { fill: '#FFFFFF', opacity: f(0.85 * seg(u, 0.9, 1)) });
  return o_;
}
// popPose(age, s) -> { sx, sy, lift, hidden } squash & stretch for the actor reappearing on the pad (spread into the pose)
function popPose(age, s = 0.5) {
  if (age < 0) return { hidden: true, sx: 1, sy: 1, lift: 0 };
  const e = Math.exp(-age * 8) * Math.cos(age * 24);
  return { hidden: false, sx: 1 - 0.2 * e, sy: 1 + 0.3 * e, lift: 140 * s * Math.max(0, 1 - age / 0.1) };
}
// respawnPop({ x, y, s, age, col, blocks }) — the hero reappears: blocks converge (age -0.3..0), white pop, light pillar,
// floor rings and rising sparkles (0..0.9). (x, y) = feet. Draw the actor from age 0 (with popPose for squash).
function respawnPop(o = {}) {
  const { x = 960, y = 900, s = 0.5, col = '#7CFFB2', blocks = true, seed = 2, height = 1900, part = 'all' } = o;
  const age = o.age ?? 0;
  if (age < -0.32 || age > 1.0) return '';
  if (part === 'all') return respawnPop({ ...o, part: 'back' }) + respawnPop({ ...o, part: 'front' });
  const BK = part === 'back';
  let out = '';
  const cy = y - 480 * s;
  if (age < 0) {
    const u = 1 + age / 0.32;   // 0 -> 1 as they arrive
    if (BK) return S.rect(x - 14 * s * u, y - height * s, 28 * s * u, height * s, 0, { fill: '#FFFFFF', opacity: f(0.6 * u) });
    if (blocks) {
      const cols = [HERO_COLS.jacket, HERO_COLS.shirt, HERO_COLS.hair, HERO_COLS.pants, '#FFFFFF', col];
      const P = cols.map(() => '');
      for (let i = 0; i < 18; i++) {
        const a0 = hash(i * 3.7 + seed) * Math.PI * 2, r0 = (700 + 500 * hash(i * 1.9 + seed)) * s;
        const e = ease.in(u), a = a0 + (1 - e) * 2.2;
        const r = r0 * (1 - e);
        const bx = x + Math.cos(a) * r, by = cy + Math.sin(a) * r * 0.8 + (hash(i * 5.3) - 0.5) * 500 * s * e;
        P[i % cols.length] += sq(bx, by, (30 + 14 * hash(i)) * s * (0.5 + 0.5 * (1 - e)), a * 120);
      }
      P.forEach((d, i) => { if (d) out += S.path(d, { fill: cols[i], stroke: LINE, 'stroke-width': f(5 * s), opacity: f(0.4 + 0.6 * u) }); });
    }
    return out;
  }
  if (BK) {
  // light pillar
  const pu = clamp(age / 0.6, 0, 1);
  const pw = 520 * s * Math.pow(Math.sin(Math.PI * Math.pow(pu, 0.6)), 0.8);
  if (pw > 1) {
    const top = y - height * s;
    out += S.path(`M${f(x - pw / 2)} ${f(y)} L${f(x - pw * 0.32)} ${f(top)} L${f(x + pw * 0.32)} ${f(top)} L${f(x + pw / 2)} ${f(y)} Z`, { fill: 'url(#rspPillar)', opacity: f(0.95 * (1 - seg(age, 0.25, 0.6))) });
    out += S.rect(x - pw * 0.09, top, pw * 0.18, height * s, pw * 0.09, { fill: '#FFFFFF', opacity: f(0.85 * (1 - seg(age, 0.1, 0.45))) });
  }
  // floor rings
  for (let j = 0; j < 2; j++) {
    const u = seg(age, j * 0.1, 0.55 + j * 0.1);
    if (u <= 0 || u >= 1) continue;
    const rx = (140 + 640 * ease.out(u)) * s;
    out += S.ellipse(x, y, rx, rx * 0.27, { fill: 'none', stroke: j ? '#FFFFFF' : col, 'stroke-width': f((30 * (1 - u) + 3) * s), opacity: f(1 - u) });
  }
  return out;
  }
  // front: core flash (washes the actor white for ~2 frames), thin front beam, sparkles
  if (age < 0.16) { const k = age / 0.16; out += S.ellipse(x, cy, (300 + 200 * k) * s, (560 + 200 * k) * s, { fill: 'url(#rspGlowW)', opacity: f(1 - k) }); }
  if (age < 0.25) { const k = age / 0.25; out += S.rect(x - 40 * s * (1 - k), y - height * s, 80 * s * (1 - k), height * s, 40 * s, { fill: '#FFFFFF', opacity: f(0.7 * (1 - k)) }); }
  // rising sparkles + green bits
  let sp = '', bl = '';
  for (let i = 0; i < 14; i++) {
    const st = hash(i * 2.3 + seed) * 0.15, a = age - st;
    if (a < 0 || a > 0.75) continue;
    const k = a / 0.75;
    const px = x + (hash(i * 4.7 + seed) - 0.5) * 520 * s + Math.sin(a * 8 + i) * 20 * s, py = y - (60 + 820 * hash(i * 6.1 + seed)) * s - 520 * s * a;
    if (i % 3) sp += star4(px, py, (34 - 10 * k) * s * bumpK(Math.min(1, k * 2.2)), a * 160); else bl += sq(px, py, 14 * s * (1 - k), a * 300);
  }
  out += S.path(sp, { fill: '#FFFFFF', stroke: col, 'stroke-width': f(4 * s) }) + S.path(bl, { fill: col, stroke: LINE, 'stroke-width': f(4 * s) });
  return out;
}
// forcefield({ x, y, s, t, k, col }) — shimmering translucent bubble with a hex rim around an actor (x, y = feet).
// k 0..1 fades it; below k .5 it blinks like a game spawn-protection running out.
function forcefield(o = {}) {
  const { x = 960, y = 900, s = 0.5, t = 0, col = '#7CFFB2', rim = '#E9FFF3', seed = 1 } = o;
  const k = clamp(o.k ?? 1, 0, 1);
  if (k <= 0.01) return '';
  if (k < 0.5 && mod(Math.floor(t * 15), 3) === 0) return '';
  const op = Math.min(1, k * 1.5);
  const rx = 330 * s * (1 + 0.025 * Math.sin(t * 5.3 + seed)), ry = 560 * s * (1 + 0.02 * Math.cos(t * 4.4 + seed));
  const cx = x, cy = y - 470 * s;
  let g = S.ellipse(cx, y, rx * 1.05, rx * 0.28, { fill: 'none', stroke: col, 'stroke-width': f(14 * s), opacity: 0.55 });
  g += S.ellipse(cx, cy, rx, ry, { fill: col, opacity: 0.14 });
  g += S.ellipse(cx, cy, rx, ry, { fill: 'none', stroke: col, 'stroke-width': f(34 * s), opacity: 0.35 });
  g += S.ellipse(cx, cy, rx - 12 * s, ry - 12 * s, { fill: 'none', stroke: '#2FD37A', 'stroke-width': f(6 * s), opacity: 0.6 });
  // hex cells along the rim, lit by a travelling shimmer band
  const B = ['', '', '', ''];
  const hexR = 30 * s;
  const hex = (hx, hy, r) => { let d = ''; for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; d += (i ? 'L' : 'M') + `${f(hx + Math.cos(a) * r)} ${f(hy + Math.sin(a) * r)}`; } return d + 'Z'; };
  for (const [rk, n, off] of [[0.97, 30, 0], [0.84, 24, 0.5]]) {
    for (let i = 0; i < n; i++) {
      const a = ((i + off) / n) * Math.PI * 2;
      const lit = Math.pow(Math.max(0, Math.sin(a * 2 - t * 4.2 + seed)), 3) * (rk > 0.9 ? 1 : 0.7);
      const b = Math.min(3, Math.floor(lit * 4));
      if (lit < 0.08 && hash(i * 3.3 + rk) > 0.45) continue;
      B[b] += hex(cx + Math.cos(a) * rx * rk, cy + Math.sin(a) * ry * rk, hexR * (0.85 + 0.25 * lit));
    }
  }
  B.forEach((d, i) => { if (d) g += S.path(d, { fill: i > 1 ? col : 'none', 'fill-opacity': i > 1 ? f(0.3 * i / 3) : undefined, stroke: i > 1 ? rim : '#3DDC84', 'stroke-width': f((3 + i) * s), opacity: f(0.35 + 0.22 * i) }); });
  g += S.ellipse(cx, cy, rx, ry, { fill: 'none', stroke: rim, 'stroke-width': f(6 * s), opacity: 0.85 });
  // glossy highlights + twinkles
  g += S.path(`M${f(cx - rx * 0.78)} ${f(cy - ry * 0.32)} A${f(rx * 0.86)} ${f(ry * 0.9)} 0 0 1 ${f(cx - rx * 0.22)} ${f(cy - ry * 0.84)}`, ln(f(16 * s), '#FFFFFF', 0.6));
  g += S.circle(cx - rx * 0.1, cy - ry * 0.88, 8 * s, { fill: '#FFFFFF', opacity: 0.8 });
  let tw = '';
  for (let i = 0; i < 5; i++) {
    const a = hash(i * 7.7 + seed) * Math.PI * 2 + t * 0.4, r = 26 * s * Math.max(0, Math.sin(t * 3.4 + i * 1.9));
    tw += star4(cx + Math.cos(a) * rx * 0.98, cy + Math.sin(a) * ry * 0.98, r, t * 30);
  }
  g += S.path(tw, { fill: '#FFFFFF' });
  return S.g(g, null, { opacity: f(op) });
}

// ================================================================ 5. PAUSE MENU — the in-world ESC menu
const MENU_ITEMS = [
  { key: 'resume', text: 'RESUME', cap: 'ESC', icon: 'play', acc: '#3DDC84' },
  { key: 'reset', text: 'RESET CHARACTER', cap: 'R', icon: 'retry', acc: '#FFB020' },
  { key: 'leave', text: 'LEAVE GAME', cap: 'L', icon: 'leave', acc: '#FF3B4E' },
];
function menuButton(it, { hl, press, t, w = 620 }) {
  const h = 96, hw = w / 2;
  const leave = it.key === 'leave';
  const pk = clamp(press || 0, 0, 1);
  const down = hl ? bumpK(seg(pk, 0, 0.3)) : 0;
  let o = '';
  if (hl) o += S.rect(-hw - 14, -h / 2 - 14, w + 28, h + 28, 40, { fill: 'none', stroke: leave ? '#FF8A96' : '#FFFFFF', 'stroke-width': 10, opacity: f(0.3 + 0.15 * Math.sin(t * 8)) });
  const fill = hl ? (leave ? '#FF3B4E' : '#F4F7FF') : '#28324D';
  const txt = hl ? (leave ? '#FFFFFF' : '#161C2E') : '#EEF2FF';
  o += S.rect(-hw, -h / 2 + 9, w, h, 28, { fill: hl ? darker(fill, 0.3) : '#151B2C', stroke: LINE, 'stroke-width': 6 });
  let b = S.rect(-hw, -h / 2, w, h, 28, ol(fill, 6));
  b += S.path(`M${-hw + 26} ${-h / 2 + 12} H${hw - 26}`, ln(6, '#FFFFFF', hl ? 0.6 : 0.14));
  b += S.circle(-hw + 52, 0, 31, { fill: hl ? (leave ? '#FFFFFF' : it.acc) : '#3D4870', stroke: LINE, 'stroke-width': 5 }) + icon(it.icon, -hw + 52, 0, 31, hl && leave ? '#FF3B4E' : '#FFFFFF');
  const cw = Math.max(58, textW(it.cap, 24, 'F') + 26);
  const fs = Math.min(40, (w - 130 - cw - 40) / Math.max(1, textW(it.text, 1, 'F', 0.025)));
  b += TF(it.text, -hw + 100, fs * 0.37, fs, txt, { 'text-anchor': 'start', 'letter-spacing': 1 });
  b += S.rect(hw - 30 - cw, -24, cw, 52, 12, { fill: '#9AA3B6', stroke: LINE, 'stroke-width': 4 }) + S.rect(hw - 30 - cw, -28, cw, 46, 12, ol('#E9EDF5', 4)) + TF(it.cap, hw - 30 - cw / 2, 3, 24, '#20263A');
  if (hl && pk > 0) b += S.rect(-hw, -h / 2, w, h, 28, { fill: '#FFFFFF', opacity: f(0.75 * (1 - seg(pk, 0.05, 0.5))) });
  o += S.g(b, `translate(0 ${f(8 * down)}) scale(${f(1 - 0.05 * down)})`);
  if (hl && pk > 0.08 && pk < 0.9) { const u = seg(pk, 0.08, 0.9); o += S.rect(-hw - 40 * u, -h / 2 - 30 * u, w + 80 * u, h + 60 * u, 30 + 20 * u, { fill: 'none', stroke: leave ? '#FF8A96' : it.acc, 'stroke-width': f(10 * (1 - u) + 1), opacity: f(1 - u) }); }
  if (hl) { const bx = -hw - 52 + Math.sin(t * 9) * 7; o += S.path(`M${f(bx - 22)} -22 L${f(bx + 8)} 0 L${f(bx - 22)} 22 Z`, ol(leave ? '#FF3B4E' : '#FFD21F', 5)); }
  return o;
}
// escMenu({ x, y, s, k, hl:'resume'|'reset'|'leave'|null, press 0..1, t, broken 0..1, title, footer })
// (x, y) = panel centre; 660 x 580 at s 1. k 0..1 unfolds it (line -> panel with overshoot -> buttons pop in one by one).
// broken 0..1 (finale): sputters open, static + "MENU UNAVAILABLE", collapses to a line, a dot, gone.
function escMenu(o = {}) {
  const { x = 960, y = 470, s = 1, hl = null, press = 0, t = 0, title = 'PAUSED', footer = 'REAL LIFE  v1.0' } = o;
  const k = clamp(o.k ?? 1, 0, 1), br = clamp(o.broken || 0, 0, 1);
  const PW = 720, PH = 540;
  let sxp, syp, content = true;
  const step = Math.floor(t * 20);
  if (br > 0) {
    content = false;
    if (br < 0.3) { sxp = 0.15 + 0.6 * hash(step * 1.3); syp = 0.04 + 0.3 * hash(step * 1.7); if (hash(step * 2.3) < 0.3) return ''; }
    else if (br < 0.76) { sxp = 1 + (hash(step) - 0.5) * 0.04; syp = 0.5 + (hash(step * 3.1) - 0.5) * 0.04; }
    else if (br < 0.88) { sxp = 1; syp = lerp(0.5, 0.012, ease.in(seg(br, 0.76, 0.88))); }
    else { sxp = lerp(1, 0.012, ease.in(seg(br, 0.88, 0.97))); syp = 0.012; }
  } else {
    if (k <= 0.001) return '';
    sxp = Math.max(0.02, ease.outBack(seg(k, 0, 0.42)));
    syp = Math.max(0.012, ease.outBack(seg(k, 0.14, 0.6)));
  }
  let pan = S.rect(-PW / 2 + 16, -PH / 2 + 24, PW, PH, 44, { fill: '#000000', opacity: 0.25 });
  pan += S.rect(-PW / 2 - 12, -PH / 2 - 12, PW + 24, PH + 24, 54, { fill: 'none', stroke: br > 0 ? '#FF5A6A' : '#8FD0FF', 'stroke-width': 22, opacity: 0.2 });
  pan += S.rect(-PW / 2, -PH / 2, PW, PH, 44, { fill: '#0E1322', opacity: 0.86, stroke: LINE, 'stroke-width': 8 });
  pan += S.rect(-PW / 2 + 12, -PH / 2 + 12, PW - 24, PH - 24, 34, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 3, opacity: 0.16 });
  pan += S.rect(-PW / 2 + 8, -PH / 2 + 8, PW - 16, PH - 16, 38, { fill: 'url(#rspScanW)', opacity: 0.06 });
  if (br > 0 && br < 0.88) {
    // static bars + the error
    let st = '';
    for (let i = 0; i < 26; i++) {
      const yy = -PH / 2 + 20 + hash(step * 3.7 + i * 1.3) * (PH - 40), xx = -PW / 2 + 24 + hash(step * 5.1 + i * 2.9) * (PW - 160);
      const ww = Math.min(60 + hash(i * 7 + step) * 220, PW / 2 - 24 - xx);
      st += `M${f(xx)} ${f(yy)}h${f(ww)}v${f(4 + hash(i + step) * 14)}h${f(-ww)}Z`;
    }
    pan += S.path(st, { fill: '#C9CED8', opacity: br < 0.3 ? 0.6 : 0.32 });
  }
  const tf = `translate(${f(x)} ${f(y)}) scale(${f(s)})`;
  let out = S.g(S.g(pan, `scale(${f(sxp)} ${f(syp)})`), tf);
  if (br >= 0.3 && br < 0.76) {
    const on = hash(step * 0.9) > 0.18;
    const jx = (hash(step * 4.1) - 0.5) * 14;
    let e = '';
    if (on) {
      e += T('MENU UNAVAILABLE', jx - 6, 22, 64, '#FF2E63', { opacity: 0.6 }) + T('MENU UNAVAILABLE', jx + 6, 22, 64, '#2EE6FF', { opacity: 0.6 }) + T('MENU UNAVAILABLE', jx, 22, 64, '#FF5A6A', stroked(10));
      e += TF(scramble('RESPAWN DISABLED', t, 0.4, 3), jx, 78, 30, '#FFB3BB', { 'letter-spacing': 4 });
      e += S.g(icon('warn', 0, 0, 44, '#FFD21F'), `translate(0 -80)`);
    }
    out += S.g(e, tf);
  }
  if (br >= 0.76) {
    const glowD = br < 0.97 ? 1 : 1 - seg(br, 0.97, 1);
    out += S.g(S.rect(-PW / 2 * sxp, -6, PW * sxp, 12, 6, { fill: '#FFFFFF', opacity: f(glowD) }) + (br > 0.88 ? S.circle(0, 0, 20 * (1 - seg(br, 0.95, 1)), { fill: '#FFFFFF', opacity: f(glowD) }) : ''), tf);
  }
  if (content) {
    const hk = seg(k, 0.32, 0.55);
    if (hk > 0) {
      let hd = S.circle(-PW / 2 + 74, -PH / 2 + 72, 34, ol('#FFFFFF', 5)) + icon('pause', -PW / 2 + 74, -PH / 2 + 72, 30, '#0E1322');
      hd += T(title, -PW / 2 + 126, -PH / 2 + 96, 64, '#FFFFFF', { 'text-anchor': 'start', 'letter-spacing': 2 });
      hd += TF(footer, PW / 2 - 40, -PH / 2 + 90, 22, '#7F8BA8', { 'text-anchor': 'end', 'letter-spacing': 2 });
      hd += S.path(`M${-PW / 2 + 40} ${-PH / 2 + 132} H${PW / 2 - 40}`, ln(4, '#FFFFFF', 0.18));
      out += S.g(hd, tf, { opacity: f(hk) });
    }
    const items = o.items || MENU_ITEMS;
    items.forEach((it, i) => {
      const kb = seg(k, 0.4 + 0.1 * i, 0.68 + 0.1 * i);
      if (kb <= 0) return;
      const bs = ease.outBack(kb), isH = hl === it.key;
      const by = -PH / 2 + 220 + i * 122;
      out += S.g(menuButton(it, { hl: isH, press: isH ? press : 0, t }), `${tf} translate(${f(60 * (1 - ease.out(kb)))} ${by}) scale(${f(isH ? 1.04 * bs : bs)})`, { opacity: f(seg(kb, 0, 0.25)) });
    });
    if (k > 0.3 && k < 0.95) {
      const u = seg(k, 0.3, 0.95);
      const sp = [[-PW / 2, -PH / 2], [PW / 2, -PH / 2], [PW / 2, PH / 2], [-PW / 2, PH / 2]].map(([a, b], i) => star4(x + a * s * (1 + 0.15 * u), y + b * s * (1 + 0.15 * u), 26 * s * bumpK(u), i * 45 + u * 90)).join('');
      out += S.path(sp, { fill: '#FFFFFF', stroke: '#8FD0FF', 'stroke-width': 3 });
    }
  }
  return out;
}

// ================================================================ 6. HUD — counters + toasts
const HUD_THEME = {
  white: { bg: '#141A2B', edge: '#46557A', label: '#AFBEDC', value: '#FFFFFF', icon: 'retry', iconBg: '#3A4A73' },
  green: { bg: '#0C2A1A', edge: '#3DDC84', label: '#94F0BA', value: '#5CFF9D', icon: 'flag', iconBg: '#1E9F59' },
  red: { bg: '#2C0A11', edge: '#FF3B4E', label: '#FFA3AD', value: '#FF5465', icon: 'warn', iconBg: '#C8182F' },
  gold: { bg: '#271E44', edge: '#FFD21F', label: '#FFE59A', value: '#FFD84A', icon: 'star', iconBg: '#E0A200' },
  grey: { bg: '#3B404C', edge: '#8A92A3', label: '#CDD3DE', value: '#F0F2F6', icon: 'gfx', iconBg: '#5C6475' },
};
// counterHUD({ x, y, s, k, label, value, t, bump, theme, roll, from, anchor, icon, size, labelSize })
//   value: number (formatted 4,816), string ('LOW'), or '∞'. bump 0..1 = scale pop when the number changes (pass
//   seg(t, tChange, tChange+0.45)). roll 0..1 + from = odometer digits rolling from `from` to `value`.
//   anchor 'left' | 'center' | 'right' (x is that edge). theme 'white' | 'green' | 'red' | 'gold' | 'grey'. 96 px tall at s 1.
function counterHUD(o = {}) {
  const { x = 60, y = 80, s = 1, t = 0, label = 'ATTEMPT', value = 1, theme = 'white', anchor = 'left', size = 66, labelSize = 30 } = o;
  const k = clamp(o.k ?? 1, 0, 1);
  if (k <= 0.001) return '';
  const th = HUD_THEME[theme] || HUD_THEME.white;
  const ic = o.icon === undefined ? th.icon : o.icon;
  const bump = clamp(o.bump || 0, 0, 1);
  const rolling = o.roll !== undefined && typeof value === 'number' && o.roll < 1;
  const cur = rolling ? lerp(o.from ?? 0, value, ease.out(clamp(o.roll, 0, 1))) : value;
  const isInf = value === '∞' || value === Infinity;
  const vStr = isInf ? '' : fmt(typeof value === 'number' ? value : value);
  const cellW = size * 0.6;
  const vw = isInf ? size * 1.25 : rolling ? [...fmt(value)].reduce((a, ch) => a + (ch === ',' ? size * 0.3 : cellW), 0) : textW(vStr, size, 'L');
  const lw_ = label ? textW(label, labelSize, 'F', 2) : 0;
  const pad = 30, iconW = ic ? 74 : 0, gap = label ? 18 : 0;
  const Wd = pad + iconW + lw_ + gap + vw + pad, Hh = 96;
  const x0 = anchor === 'left' ? 0 : anchor === 'right' ? -Wd : -Wd / 2;
  let c = S.rect(x0 + 8, -Hh / 2 + 10, Wd, Hh, Hh / 2, { fill: '#000000', opacity: 0.25 });
  const blink = theme === 'red' ? 0.5 + 0.5 * Math.sin(t * 9) : 0;
  c += S.rect(x0, -Hh / 2, Wd, Hh, Hh / 2, { fill: th.bg, opacity: 0.92, stroke: LINE, 'stroke-width': 6 });
  c += S.rect(x0 + 7, -Hh / 2 + 7, Wd - 14, Hh - 14, Hh / 2 - 7, { fill: 'none', stroke: th.edge, 'stroke-width': 4, opacity: f(0.55 + 0.45 * blink) });
  c += S.path(`M${f(x0 + Hh / 2)} ${-Hh / 2 + 14} H${f(x0 + Wd - Hh / 2)}`, ln(4, '#FFFFFF', 0.12));
  let cx = x0 + pad;
  if (ic) { c += S.circle(cx + 30, 0, 31, { fill: th.iconBg, stroke: LINE, 'stroke-width': 5 }) + icon(ic, cx + 30, 0, 30, '#FFFFFF', t); cx += iconW; }
  if (label) { c += TF(label, cx, 11, labelSize, th.label, { 'text-anchor': 'start', 'letter-spacing': 2 }); cx += lw_ + gap; }
  // value (+ bump pop around its centre)
  const pop = bump > 0 && bump < 1 ? 0.34 * Math.exp(-bump * 4.5) * Math.sin(bump * Math.PI * 2.6) : 0;
  const vc = bump > 0 && bump < 0.35 ? mix(th.value, '#FFFFFF', 1 - bump / 0.35) : th.value;
  const vcx = cx + vw / 2;
  let v = '';
  if (isInf) v = infinity(vcx, -2, size * 1.05, vc, size * 0.13);
  else if (!rolling) v = T(vStr, vcx, size * 0.36, size, vc, stroked(size * 0.14));
  else {
    const cid = S.uid('rspRoll');
    v += S.clipDef(cid, S.rect(cx - 4, -size * 0.58, vw + 8, size * 1.1));
    let dg = '';
    const fstr = [...fmt(value)];
    let px = cx + vw, pos = 0;
    for (let i = fstr.length - 1; i >= 0; i--) {
      const ch = fstr[i];
      if (ch === ',') {
        px -= size * 0.3;
        if (cur >= Math.pow(10, pos)) dg += T(',', px + size * 0.15, size * 0.36, size, vc, stroked(size * 0.14));
        continue;
      }
      px -= cellW;
      const p10 = Math.pow(10, pos);
      const pv = cur / p10, base = Math.floor(pv);
      let off = pos === 0 ? pv - base : clamp(((cur % p10) / p10 - 0.9) / 0.1, 0, 1);
      if (pos === 0 && Math.abs(value - cur) < 1e-6) off = 0;
      const d0 = base % 10, d1 = (d0 + 1) % 10;
      const show0 = !(pos > 0 && base === 0), show1 = !(pos > 0 && base + 1 === 0);
      const ccx = px + cellW / 2;
      if (show0) dg += T(String(d0), ccx, size * 0.36 - off * size, size, vc, stroked(size * 0.14));
      if (off > 0.001 && show1) dg += T(String(d1), ccx, size * 0.36 + (1 - off) * size, size, vc, stroked(size * 0.14));
      pos++;
    }
    v += S.g(dg, null, { 'clip-path': `url(#${cid})` });
  }
  c += pop ? S.g(v, `translate(${f(vcx)} 0) scale(${f(1 + pop)}) translate(${f(-vcx)} 0)`) : v;
  if (bump > 0 && bump < 0.7) {
    const u = bump / 0.7;
    let sp = '';
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.55; sp += star4(vcx + Math.cos(a) * (vw / 2 + 30 + 50 * u), Math.sin(a) * (40 + 40 * u), 16 * bumpK(u), u * 180); }
    c += S.path(sp, { fill: '#FFFFFF', stroke: th.edge, 'stroke-width': 2.5 });
  }
  const sc = s * ease.outBack(k) * (1 + pop * 0.12);
  const slide = (1 - ease.out(k)) * (anchor === 'right' ? 80 : anchor === 'left' ? -80 : 0);
  return S.g(c, `translate(${f(x + slide * s)} ${f(y)}) scale(${f(sc)})`, k < 1 ? { opacity: f(seg(k, 0, 0.3)) } : {});
}
// savedToast(x, y, k, { text, t, out, s, anchor, theme }) — "Checkpoint saved" toast: slides in (k 0..1) with a check drawn
// on, a sheen sweep; out 0..1 slides it up and away. (x, y) = left edge centre by default (anchor 'left'|'center'|'right').
function savedToast(x, y, k, o = {}) {
  const { text = 'Checkpoint saved', t = 0, s = 1, anchor = 'left', size = 42 } = o;
  const out = clamp(o.out || 0, 0, 1), kk = clamp(k, 0, 1);
  if (kk <= 0.001 || out >= 1) return '';
  const tw = textW(text, size, 'F');
  const Wd = tw + 150, Hh = 92;
  const x0 = anchor === 'left' ? 0 : anchor === 'right' ? -Wd : -Wd / 2;
  let c = S.rect(x0 + 8, -Hh / 2 + 10, Wd, Hh, 46, { fill: '#000000', opacity: 0.25 });
  c += S.rect(x0, -Hh / 2, Wd, Hh, 46, { fill: '#0C2A1A', opacity: 0.94, stroke: LINE, 'stroke-width': 6 });
  c += S.rect(x0 + 7, -Hh / 2 + 7, Wd - 14, Hh - 14, 39, { fill: 'none', stroke: '#3DDC84', 'stroke-width': 4 });
  const ck = ease.outBack(seg(kk, 0.25, 0.6));
  c += S.circle(x0 + 52, 0, 32 * ck, ol('#3DDC84', 5));
  const draw = seg(kk, 0.45, 0.8);
  if (draw > 0) c += S.path(checkD(x0 + 52, 2, 24), { ...ln(9, '#FFFFFF'), 'stroke-dasharray': `${f(64 * draw)} 80` });
  const rr = seg(kk, 0.3, 0.9);
  if (rr > 0 && rr < 1) c += S.circle(x0 + 52, 0, 32 + 40 * rr, { fill: 'none', stroke: '#7CFFB2', 'stroke-width': f(8 * (1 - rr)), opacity: f(1 - rr) });
  c += TF(text, x0 + 100, size * 0.36, size, '#FFFFFF', { 'text-anchor': 'start' });
  const sh = seg(kk, 0.55, 1);
  if (sh > 0 && sh < 1) {
    const cid = S.uid('rspToast');
    const sx = x0 - 120 + (Wd + 240) * sh;
    c += S.clipDef(cid, S.rect(x0, -Hh / 2, Wd, Hh, 46)) + S.g(S.path(`M${f(sx)} ${-Hh / 2} h70 l-50 ${Hh} h-70 Z`, { fill: 'url(#rspSheen)', opacity: 0.8 }), null, { 'clip-path': `url(#${cid})` });
  }
  const dx = (1 - ease.outBack(kk)) * -160 * (anchor === 'right' ? -1 : 1);
  return S.g(c, `translate(${f(x + dx * s)} ${f(y - 70 * ease.in(out) * s)}) scale(${f(s)})`, { opacity: f(seg(kk, 0, 0.25) * (1 - out)) });
}

// ================================================================ 7. SYSTEM WINDOWS + SKY CRACK
const WIN_THEME = {
  red: { bar: 'url(#rspBarR)', barFlat: '#E8283D', body: '#2A0911', text: '#FFE4E7', sub: '#FF9AA5', acc: '#FF3B4E', glow: '#FF3B4E', icon: 'warn', iconCol: '#FFD21F', btn: '#FF3B4E', btnText: '#FFFFFF', btn2: '#4A1620', btn2Text: '#FFD7DC', hazard: true },
  grey: { bar: 'url(#rspBarK)', barFlat: '#5B6479', body: '#EEF1F6', text: '#222936', sub: '#5C6578', acc: '#3A7BFF', glow: '#9AA3B6', icon: 'warn', iconCol: '#FFB020', btn: '#FF4D5E', btnText: '#FFFFFF', btn2: '#D5DAE3', btn2Text: '#222936', hazard: false },
  green: { bar: 'url(#rspBarG)', barFlat: '#25B868', body: '#0A2016', text: '#D8FFE8', sub: '#8FEFB6', acc: '#3DDC84', glow: '#3DDC84', icon: 'check', iconCol: '#3DDC84', btn: '#3DDC84', btnText: '#0A2016', btn2: '#1C3B2A', btn2Text: '#D8FFE8', hazard: false },
};
function winIcon(kind, x, y, r, th, t) {
  if (kind === 'warn') {
    const d = `M${f(x)} ${f(y - r)} L${f(x + r * 1.08)} ${f(y + r * 0.82)} L${f(x - r * 1.08)} ${f(y + r * 0.82)} Z`;
    return S.path(d, { fill: th.iconCol, stroke: LINE, 'stroke-width': f(Math.max(5, r * 0.1)), 'stroke-linejoin': 'round' }) +
      S.path(`M${f(x)} ${f(y - r * 0.4)} V${f(y + r * 0.22)}`, ln(f(r * 0.2), LINE)) + S.circle(x, y + r * 0.52, r * 0.12, { fill: LINE });
  }
  if (kind === 'check') return S.circle(x, y, r, ol(th.iconCol, Math.max(5, r * 0.1))) + S.path(checkD(x, y + r * 0.05, r * 0.75), ln(f(r * 0.22), '#FFFFFF'));
  if (kind === 'save') {   // floppy-ish save icon with a crack
    return S.rect(x - r, y - r, r * 2, r * 2, r * 0.2, ol('#3A7BFF', Math.max(5, r * 0.1))) + S.rect(x - r * 0.55, y - r, r * 1.1, r * 0.7, r * 0.08, ol('#DDE6F5', Math.max(4, r * 0.07))) + S.rect(x - r * 0.65, y + r * 0.15, r * 1.3, r * 0.75, r * 0.1, ol('#FFFFFF', Math.max(4, r * 0.07))) +
      S.path(`M${f(x + r * 0.2)} ${f(y - r)} L${f(x - r * 0.05)} ${f(y - r * 0.3)} L${f(x + r * 0.3)} ${f(y + r * 0.1)} L${f(x)} ${f(y + r)}`, ln(f(r * 0.1), LINE));
  }
  if (kind === 'trash') return S.rect(x - r * 0.7, y - r * 0.55, r * 1.4, r * 1.5, r * 0.15, ol('#DDE2EA', Math.max(5, r * 0.1))) + S.rect(x - r * 0.9, y - r * 0.8, r * 1.8, r * 0.3, r * 0.1, ol('#FF4D5E', Math.max(5, r * 0.1))) + S.path(`M${f(x - r * 0.3)} ${f(y - r * 0.3)} V${f(y + r * 0.7)} M${f(x + r * 0.3)} ${f(y - r * 0.3)} V${f(y + r * 0.7)}`, ln(f(r * 0.1), '#8A93A6'));
  if (kind === 'export') return S.circle(x, y, r, ol('#3DDC84', Math.max(5, r * 0.1))) + spinner(x, y, r * 0.6, t, '#FFFFFF');
  return '';
}
// sysWindow({ x, y, w, h, k, theme:'red'|'grey'|'green', title, lines, small, buttons, hl, press, glitch, t, icon,
//   progress 0..1, open:'pop'|'crt', s, seed }) — an original game-OS alert window. (x, y) = centre; w, h in px (works from
//   ~500x260 up to sky-size 1800x640: line widths, bar and fonts scale with the window). First line = headline (Lilita),
//   others Fredoka; `small` = fine print; `progress` = segmented export bar; hl = button index or label.
function sysWindow(o = {}) {
  const { x = 960, y = 420, w = 900, h = 420, theme = 'grey', title = 'WARNING', lines = [], small = '', buttons = [], t = 0, s = 1, open = 'pop', seed = 1 } = o;
  const k = clamp(o.k ?? 1, 0, 1);
  if (k <= 0.001) return '';
  const th = WIN_THEME[theme] || WIN_THEME.grey;
  const g = clamp(o.glitch || 0, 0, 1);
  const kind = o.icon === undefined ? th.icon : o.icon;
  const lw = clamp(Math.min(w, h * 2) / 130, 5, 14);
  const bh = clamp(h * 0.15, 46, 120), r = clamp(h * 0.07, 18, 40);
  const x0 = -w / 2, y0 = -h / 2;
  const step = Math.floor(t * 16);
  const alarm = theme === 'red' ? 0.5 + 0.5 * Math.sin(t * 7) : 0;
  let c = '';
  c += S.rect(x0 + w * 0.012 + 6, y0 + h * 0.03 + 6, w, h, r, { fill: '#000000', opacity: 0.3 });
  c += S.rect(x0 - lw * 2, y0 - lw * 2, w + lw * 4, h + lw * 4, r + lw * 2, { fill: 'none', stroke: th.glow, 'stroke-width': lw * 3, opacity: f(0.22 + 0.25 * alarm) });
  c += S.rect(x0, y0, w, h, r, { fill: th.body, stroke: LINE, 'stroke-width': lw });
  if (theme === 'red') c += S.rect(x0 + lw, y0 + lw, w - lw * 2, h - lw * 2, r, { fill: 'url(#rspScan)', opacity: 0.5 }) + S.rect(x0 + lw * 1.6, y0 + lw * 1.6, w - lw * 3.2, h - lw * 3.2, r * 0.8, { fill: 'none', stroke: '#FF3B4E', 'stroke-width': lw * 1.2, opacity: f(0.18 + 0.2 * alarm) });
  const barD = S.roundedPath([[x0, y0, r], [x0 + w, y0, r], [x0 + w, y0 + bh, 0], [x0, y0 + bh, 0]], r);
  c += S.path(barD, { fill: th.bar });
  if (th.hazard) c += S.path(barD, { fill: 'url(#rspHazard)' });
  if (alarm) c += S.path(barD, { fill: '#FFFFFF', opacity: f(0.18 * alarm) });
  c += S.path(`M${f(x0 + r)} ${f(y0 + lw * 1.4)} H${f(x0 + w - r)}`, ln(lw * 0.7, '#FFFFFF', 0.3));
  c += S.path(`M${f(x0)} ${f(y0 + bh)} H${f(x0 + w)}`, ln(lw, LINE));
  c += S.rect(x0, y0, w, h, r, { fill: 'none', stroke: LINE, 'stroke-width': lw });
  // title + window controls
  const tsz = bh * 0.56;
  const ttl = g > 0 ? scramble(title, t, g, seed) : title;
  c += S.g(icon(kind === 'check' || kind === 'export' ? 'check' : kind === 'info' ? 'info' : 'warn', 0, 0, tsz * 0.55, '#FFFFFF'), `translate(${f(x0 + bh * 0.55)} ${f(y0 + bh * 0.5)})`);
  c += T(ttl, x0 + bh * 1.0, y0 + bh * 0.5 + tsz * 0.36, tsz, '#FFFFFF', { 'text-anchor': 'start', 'letter-spacing': f(tsz * 0.06), ...stroked(lw * 0.9) });
  const cb = bh * 0.3;
  c += S.circle(x0 + w - bh * 0.55, y0 + bh * 0.5, cb, ol('#FF5A6A', lw * 0.6)) + S.path(`M${f(x0 + w - bh * 0.55 - cb * 0.4)} ${f(y0 + bh * 0.5 - cb * 0.4)} l${f(cb * 0.8)} ${f(cb * 0.8)} m0 ${f(-cb * 0.8)} l${f(-cb * 0.8)} ${f(cb * 0.8)}`, ln(lw * 0.55, '#FFFFFF'));
  c += S.rect(x0 + w - bh * 1.35 - cb, y0 + bh * 0.5 - cb, cb * 2, cb * 2, cb * 0.4, { fill: '#FFFFFF', opacity: 0.25, stroke: LINE, 'stroke-width': lw * 0.6 });
  // body layout
  const btnH = buttons.length ? clamp(h * 0.15, 46, 110) : 0;
  const pad = clamp(h * 0.07, 18, 56);
  const bodyTop = y0 + bh + pad * 0.6, bodyBot = y0 + h - pad - (btnH ? btnH + pad * 0.6 : 0);
  const icS = kind ? Math.min((bodyBot - bodyTop) * 0.38, w * 0.09) : 0;
  const txL = x0 + pad + (kind ? icS * 2.4 : 0), txR = x0 + w - pad;
  const tcx = (txL + txR) / 2, avail = txR - txL;
  const items = [];
  lines.forEach((l, i) => {
    const big = i === 0;
    const base = (bodyBot - bodyTop) * (big ? 0.27 : 0.17);
    const sz = Math.min(base, (avail * 0.96) / Math.max(1, textW(l, 1, big ? 'L' : 'F')));
    items.push({ text: l, size: sz, big });
  });
  const progOn = o.progress !== undefined && o.progress !== null;
  const smallSz = small ? Math.min((bodyBot - bodyTop) * 0.11, (avail * 0.96) / Math.max(1, textW(small, 1, 'F'))) : 0;
  const progH = progOn ? (bodyBot - bodyTop) * 0.16 : 0;
  const blockH = items.reduce((a, it) => a + it.size * 1.18, 0) + (smallSz ? smallSz * 1.6 : 0) + (progOn ? progH * 1.6 : 0);
  let ty = (bodyTop + bodyBot) / 2 - blockH / 2;
  if (kind) c += winIcon(kind, x0 + pad + icS * 1.1, (bodyTop + bodyBot) / 2, icS, th, t);
  for (const it of items) {
    ty += it.size * 1.0;
    const txt = g > 0 ? scramble(it.text, t, g, seed + it.size) : it.text;
    c += it.big ? T(txt, tcx, ty, it.size, theme === 'grey' ? '#1B2030' : '#FFFFFF', theme === 'grey' ? {} : stroked(it.size * 0.1)) : TF(txt, tcx, ty, it.size, th.text);
    ty += it.size * 0.18;
  }
  if (progOn) {
    ty += progH * 0.4;
    const n = 12, pw = Math.min(avail * 0.78, progH * 16), gap = pw * 0.012, bw = (pw - gap * (n - 1)) / n;
    const pv = clamp(o.progress, 0, 1) * n;
    let pb = S.rect(tcx - pw / 2 - gap * 2, ty - gap * 2, pw + gap * 4, progH + gap * 4, progH * 0.2, { fill: '#000000', opacity: 0.35, stroke: LINE, 'stroke-width': lw * 0.6 });
    for (let i = 0; i < n; i++) {
      const fl = clamp(pv - i, 0, 1);
      const on = fl >= 1 || (fl > 0 && mod(Math.floor(t * 6), 2) === 0);
      pb += S.rect(tcx - pw / 2 + i * (bw + gap), ty, bw, progH, progH * 0.12, { fill: on ? th.acc : '#FFFFFF', opacity: on ? 1 : 0.12 });
    }
    c += pb + TF(`${Math.floor(clamp(o.progress, 0, 1) * 100)}%`, tcx + pw / 2 + progH * 0.5, ty + progH * 0.82, progH * 0.95, th.text, { 'text-anchor': 'start' });
    ty += progH * 1.2;
  }
  if (smallSz) { ty += smallSz * 1.3; c += S.el('text', { x: tcx, y: ty, 'font-family': 'Fredoka, sans-serif', 'font-weight': 600, 'font-size': smallSz, fill: th.sub, 'text-anchor': 'middle', 'font-style': 'italic' }, esc(small)); }
  // buttons
  if (buttons.length) {
    const gapB = pad * 0.8, bw = Math.min(w * 0.3, (w - pad * 2 - gapB * (buttons.length - 1)) / buttons.length);
    const tot = bw * buttons.length + gapB * (buttons.length - 1);
    const by = y0 + h - pad - btnH / 2;
    buttons.forEach((lab, i) => {
      const isH = o.hl === i || o.hl === lab;
      const pk = isH ? clamp(o.press || 0, 0, 1) : 0;
      const dn = bumpK(seg(pk, 0, 0.3));
      const bx = x0 + w / 2 - tot / 2 + i * (bw + gapB) + bw / 2;
      const fill = i === 0 ? th.btn : th.btn2, tc = i === 0 ? th.btnText : th.btn2Text;
      let b = '';
      if (isH) b += S.rect(-bw / 2 - lw * 2, -btnH / 2 - lw * 2, bw + lw * 4, btnH + lw * 4, btnH * 0.36, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': lw * 1.3, opacity: f(0.55 + 0.3 * Math.sin(t * 8)) });
      b += S.rect(-bw / 2, -btnH / 2 + lw * 1.2, bw, btnH, btnH * 0.3, { fill: darker(fill, 0.35), stroke: LINE, 'stroke-width': lw });
      let face = S.rect(-bw / 2, -btnH / 2, bw, btnH, btnH * 0.3, ol(fill, lw)) + S.path(`M${f(-bw / 2 + btnH * 0.3)} ${f(-btnH / 2 + lw * 1.3)} H${f(bw / 2 - btnH * 0.3)}`, ln(lw * 0.7, '#FFFFFF', 0.35));
      const bsz = Math.min(btnH * 0.5, (bw * 0.8) / Math.max(1, textW(lab, 1, 'L')));
      face += T(lab, 0, bsz * 0.36, bsz, tc, i === 0 && theme !== 'green' ? stroked(bsz * 0.12) : {});
      if (pk > 0) face += S.rect(-bw / 2, -btnH / 2, bw, btnH, btnH * 0.3, { fill: '#FFFFFF', opacity: f(0.8 * (1 - seg(pk, 0.05, 0.5))) });
      b += S.g(face, `translate(0 ${f(lw * 1.1 * dn)}) scale(${f(1 - 0.05 * dn)})`);
      if (pk > 0.08 && pk < 0.9) { const u = seg(pk, 0.08, 0.9); b += S.rect(-bw / 2 - 30 * u, -btnH / 2 - 24 * u, bw + 60 * u, btnH + 48 * u, btnH * 0.3 + 16 * u, { fill: 'none', stroke: i === 0 ? th.btn : '#FFFFFF', 'stroke-width': f(lw * (1 - u) + 1), opacity: f(1 - u) }); }
      c += S.g(b, `translate(${f(bx)} ${f(by)}) scale(${f(isH ? 1.05 : 1)})`);
    });
  }
  // open animation
  let sx = 1, sy = 1, cop = 1;
  if (open === 'crt') { sx = Math.max(0.01, ease.out(seg(k, 0, 0.35))); sy = Math.max(0.012, ease.outBack(seg(k, 0.3, 0.8))); cop = seg(k, 0.2, 0.4); }
  else { sx = sy = ease.outBack(k); cop = seg(k, 0, 0.3); }
  let jx = 0, jy = 0;
  if (g > 0 && hash(step * 1.3 + seed) < 0.3 + 0.5 * g) { jx = (hash(step * 2.7 + seed) - 0.5) * 40 * g; jy = (hash(step * 3.9 + seed) - 0.5) * 12 * g; }
  const tf = `translate(${f(x + jx)} ${f(y + jy)}) scale(${f(s * sx)} ${f(s * sy)})`;
  let out = '';
  if (g > 0.02) {
    const d = (8 + 22 * g) * (0.6 + 0.8 * hash(step * 5.3 + seed));
    out += S.g(S.rect(x0, y0, w, h, r, { fill: '#FF2E63' }), `translate(${f(x + jx - d)} ${f(y + jy)}) scale(${f(s * sx)} ${f(s * sy)})`, { opacity: f(0.55 * Math.min(1, g * 2)) });
    out += S.g(S.rect(x0, y0, w, h, r, { fill: '#2EE6FF' }), `translate(${f(x + jx + d)} ${f(y + jy)}) scale(${f(s * sx)} ${f(s * sy)})`, { opacity: f(0.55 * Math.min(1, g * 2)) });
  }
  if (open === 'crt' && k < 0.4) {
    out += S.g(S.rect(x0, y0, w, h, r, { fill: '#FFFFFF' }), tf, { opacity: f(1 - seg(k, 0.25, 0.4)) });
    if (k < 0.3) return out;
  }
  const id = S.uid('rspWin');
  out += S.g(c, tf, { id, opacity: cop < 1 ? f(cop) : undefined });
  if (g > 0.02 && hash(step * 0.77 + seed) < 0.35 + 0.5 * g) {
    const nb = 1 + Math.round(g * 3);
    const sw = w * s * sx, sh = h * s * sy;
    for (let i = 0; i < nb; i++) {
      const yy = y - sh / 2 + hash(step * 7.1 + i * 13.3 + seed) * sh, hh = (0.03 + 0.08 * hash(step + i * 5.7 + seed)) * sh;
      const cid = S.uid('rspWc');
      out += S.clipDef(cid, S.rect(x - sw, yy, sw * 2, hh)) + S.g(S.el('use', { href: `#${id}`, x: f((hash(step * 3.3 + i + seed) - 0.5) * 120 * g * Math.max(1, w / 900)) }), null, { 'clip-path': `url(#${cid})` });
    }
  }
  return out;
}
// skyCrack({ cx, cy, k 0..1, t, wheel, s, seed, n }) — the sky cracks like a phone screen from (cx, cy): impact flash,
// cracks race outward, web rings, a dark hole with a spinning loading wheel, glass bits falling.
function skyCrack(o = {}) {
  const { cx = 960, cy = 300, t = 0, wheel = true, s = 1, seed = 3, n = 9, glow = '#FF5A6A' } = o;
  const k = clamp(o.k ?? 1, 0, 1);
  if (k <= 0) return '';
  const R = 820 * s, m = 7;
  const cracks = [];
  for (let i = 0; i < n; i++) {
    let a = (i / n) * Math.PI * 2 + (hash(i * 3.1 + seed) - 0.5) * 0.5;
    const L = R * (0.55 + 0.45 * hash(i * 7.7 + seed));
    const pts = [[cx, cy]];
    let px = cx, py = cy;
    for (let j = 1; j <= m; j++) {
      a += (hash(i * 13 + j * 5.3 + seed) - 0.5) * 0.55;
      const st = (L / m) * (0.7 + 0.6 * hash(i * 17 + j * 3.1 + seed));
      px += Math.cos(a) * st; py += Math.sin(a) * st;
      pts.push([px, py]);
    }
    cracks.push(pts);
  }
  const partial = (pts, g_) => {   // first g_ (0..1) of a polyline
    const nn = pts.length - 1, fi = g_ * nn, ii = Math.floor(fi);
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let j = 1; j <= Math.min(ii, nn); j++) d += ` L${f(pts[j][0])} ${f(pts[j][1])}`;
    if (ii < nn && fi > ii) { const a = pts[ii], b = pts[ii + 1], r = fi - ii; d += ` L${f(lerp(a[0], b[0], r))} ${f(lerp(a[1], b[1], r))}`; }
    return d;
  };
  const gr = ease.out(seg(k, 0.04, 0.55));
  let dMain = '', dWeb = '', shards = '';
  cracks.forEach((pts, i) => {
    dMain += partial(pts, gr) + ' ';
    for (const [j, sd] of [[2, 1], [4, -1]]) {
      const gb = seg(k, 0.2 + 0.05 * j, 0.6 + 0.05 * j);
      if (gb <= 0 || j >= pts.length) continue;
      let a = Math.atan2(pts[j][1] - pts[j - 1][1], pts[j][0] - pts[j - 1][0]) + sd * (0.5 + 0.3 * hash(i * 5 + j));
      const bp = [pts[j]];
      let px = pts[j][0], py = pts[j][1];
      for (let q = 1; q <= 3; q++) { a += (hash(i * 9 + j + q * 7.1 + seed) - 0.5) * 0.6; px += Math.cos(a) * R * 0.09; py += Math.sin(a) * R * 0.09; bp.push([px, py]); }
      dMain += partial(bp, gb) + ' ';
    }
    const nx = cracks[(i + 1) % n];
    for (const j of [2, 4]) {
      const gw = seg(k, 0.4 + 0.03 * i + 0.08 * j / 2, 0.65 + 0.03 * i + 0.08 * j / 2);
      if (gw <= 0) continue;
      const a = pts[j], b = nx[j];
      const mx = (a[0] + b[0]) / 2 + (hash(i * 3 + j) - 0.5) * 40 * s, my = (a[1] + b[1]) / 2 + (hash(i * 7 + j) - 0.5) * 40 * s;
      dWeb += partial([a, [mx, my], b], gw) + ' ';
    }
    if (k > 0.45 && i % 2 === 0) shards += `M${f(pts[1][0])} ${f(pts[1][1])} L${f(pts[3][0])} ${f(pts[3][1])} L${f(nx[3][0])} ${f(nx[3][1])} L${f(nx[1][0])} ${f(nx[1][1])} Z`;
  });
  let out = '';
  if (shards) out += S.path(shards, { fill: '#FFFFFF', opacity: f(0.1 * seg(k, 0.45, 0.7)) });
  out += S.path(dMain + dWeb, ln(f(16 * s), glow, 0.35)) + S.path(dMain + dWeb, ln(f(7 * s), '#14070C')) + S.path(dMain, { ...ln(f(2.5 * s), '#FFFFFF', 0.75), transform: `translate(${f(3 * s)} ${f(3 * s)})` });
  // the hole
  const hk = ease.outBack(seg(k, 0.05, 0.35));
  if (hk > 0) {
    let hd = '';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, rr = 120 * s * hk * (0.75 + 0.45 * hash(i * 2.9 + seed)); hd += (i ? 'L' : 'M') + `${f(cx + Math.cos(a) * rr)} ${f(cy + Math.sin(a) * rr)}`; }
    out += S.ellipse(cx, cy, 230 * s * hk, 230 * s * hk, { fill: 'url(#rspGlowR)', opacity: 0.8 });
    out += S.path(hd + 'Z', { fill: '#0A0610', stroke: glow, 'stroke-width': f(8 * s), 'stroke-linejoin': 'round' });
    if (wheel) out += spinner(cx, cy, 52 * s * hk, t, '#FFFFFF', 8, 1.6);
  }
  // impact flash + falling glass bits
  if (k < 0.14) out += S.circle(cx, cy, 380 * s * (0.4 + k * 4), { fill: 'url(#rspGlowW)', opacity: f(1 - k / 0.14) });
  if (k > 0.08) {
    const u = seg(k, 0.08, 1);
    let gb = '';
    for (let i = 0; i < 8; i++) {
      const a = hash(i * 4.1 + seed) * Math.PI * 2, sp = 140 + 160 * hash(i * 2.2);
      const px = cx + Math.cos(a) * (90 + sp * u) * s, py = cy + Math.sin(a) * (90 + sp * u * 0.5) * s + 900 * u * u * s;
      const r = (12 + 10 * hash(i)) * s, rot = u * 500 * (hash(i * 3) - 0.5);
      gb += `M${f(px + Math.cos(rot) * r)} ${f(py + Math.sin(rot) * r)} L${f(px + Math.cos(rot + 2.3) * r)} ${f(py + Math.sin(rot + 2.3) * r)} L${f(px + Math.cos(rot + 4.1) * r * 0.7)} ${f(py + Math.sin(rot + 4.1) * r * 0.7)} Z`;
    }
    out += S.path(gb, { fill: '#FFFFFF', stroke: '#14070C', 'stroke-width': f(3 * s), opacity: f(0.85 * (1 - u)) });
  }
  return out;
}

// ================================================================ 8. LAG & GLITCH
// freezeT(t, [[a, b], ...], catchUp = true) — time stops inside each interval. catchUp: afterwards time jumps back to real
// time (lag spike: things "teleport" to where they should be); false: the frozen time is lost (everything runs late).
// freezeT(t, { every, hold, t0, seed, jitter }) — periodic freezes (hold s in every `every` s, start jittered).
function freezeT(t, segs = [], catchUp = true) {
  if (!Array.isArray(segs)) {
    const { every = 1.2, hold = 0.35, t0 = 0, seed = 1, jitter = 0.5 } = segs;
    const i = Math.floor((t - t0) / every);
    const st = t0 + i * every + hash(i * 1.7 + seed) * jitter * Math.max(0, every - hold);
    if (t >= st && t < st + hold) return catchUp ? st : st - i * hold;
    return catchUp ? t : t - i * hold - (t >= st + hold ? hold : 0);
  }
  let off = 0;
  for (const [a, b] of segs) {
    if (t < a) break;
    if (t < b) return a - off;
    if (!catchUp) off += b - a;
  }
  return t - off;
}
// stutterVoiceT(t, t0, len = 0.12, reps = 3) — a "skipping record": the window [t0, t0+len] plays `reps` times, then time
// continues (delayed by len*(reps-1)). Use it to loop a pose / a prop (Dad stuck in "Why did the pan—").
function stutterVoiceT(t, t0, len = 0.12, reps = 3) {
  if (t < t0) return t;
  const span = len * reps;
  if (t < t0 + span) return t0 + ((t - t0) % len);
  return t - len * (reps - 1);
}
// rubberBand(t, { period, a, b, hold, t0, fps }) — moves a -> b over (period - hold), waits `hold`, teleports back to a.
// a, b: numbers or [x, y]. Returns { x, y, u, snap } (snap 1 -> 0 during the 0.12 s right after a teleport).
// fps > 0 makes the travel choppy (stepped at that rate).
function rubberBand(t, o = {}) {
  const { period = 1.4, a = 0, b = 300, hold = 0.2, t0 = 0, fps = 0 } = o;
  const ph = mod(t - t0, period);
  const travel = Math.max(0.05, period - hold);
  let u = clamp(ph / travel, 0, 1);
  if (fps) u = Math.floor(u * travel * fps) / (travel * fps);
  const snap = 1 - clamp(ph / 0.12, 0, 1);
  if (Array.isArray(a)) return { x: lerp(a[0], b[0], u), y: lerp(a[1], b[1], u), u, snap };
  return { x: lerp(a, b, u), y: 0, u, snap };
}
// lagJitter(t, seed, k, { fps, amp }) -> { dx, dy, rot } — stepped random hops (about half the steps stand still)
function lagJitter(t, seed = 1, k = 1, o = {}) {
  const { fps = 8, amp = 16 } = o;
  if (k <= 0) return { dx: 0, dy: 0, rot: 0 };
  const st = Math.floor(t * fps);
  if (hash(st * 1.31 + seed) < 0.5) return { dx: 0, dy: 0, rot: 0 };
  return { dx: (hash(st * 2.7 + seed) - 0.5) * 2 * amp * k, dy: (hash(st * 3.9 + seed) - 0.5) * amp * k * 0.6, rot: (hash(st * 5.3 + seed) - 0.5) * 4 * k };
}
// glitchSlices(svg, t, k, seed, { x, y, w, h, n, maxDx, fps, bars }) — horizontal slices of any group shifted sideways
// (clipped <use> copies; the original stays underneath). Intermittent: on ~35..100 % of the steps depending on k.
function glitchSlices(svg, t, k = 0.5, seed = 1, o = {}) {
  if (!(k > 0)) return svg;
  const { x = 0, y = 0, w = W, h = H, maxDx = 70, fps = 14, bars = true } = o;
  const st = Math.floor(t * fps);
  const id = S.uid('rspGs');
  let out = S.g(svg, null, { id });
  if (hash(st * 0.37 + seed) > 0.35 + 0.65 * k) return out;
  const cnt = o.n ?? 1 + Math.round(k * 4);
  for (let i = 0; i < cnt; i++) {
    const sy = y + hash(st * 7.1 + i * 13.3 + seed) * h, sh = (0.015 + 0.07 * hash(st + i * 5.7 + seed)) * h;
    const dx = (hash(st * 3.3 + i + seed) - 0.5) * 2 * maxDx * k;
    const cid = S.uid('rspGc');
    out += S.clipDef(cid, S.rect(x - maxDx, sy, w + 2 * maxDx, sh)) + S.g(S.el('use', { href: `#${id}`, x: f(dx) }), null, { 'clip-path': `url(#${cid})` });
    if (bars && i % 2 === 0) out += S.rect(x, sy, w, Math.max(2, sh * 0.08), 0, { fill: i % 4 ? '#2EE6FF' : '#FF2E63', opacity: f(0.5 * k) });
  }
  return out;
}
// rgbSplit(svg, k, { dx, dy, t, op }) — red / cyan tinted copies behind the original (CSS tint classes in DEFS; copies
// have filters off). Costs ~2 extra copies of the group; with t the offset flickers.
function rgbSplit(svg, k = 1, o = {}) {
  if (!(k > 0)) return svg;
  const { dx = 12, dy = 0, op = 0.6 } = o;
  let d = dx * k;
  if (o.t !== undefined) d *= 0.55 + 0.9 * hash(Math.floor(o.t * 15) * 1.3);
  const a = f(op * Math.min(1, k * 2));
  return S.g(svg, `translate(${f(-d)} ${f(-dy * k)})`, { class: 'rspTR', opacity: a }) + S.g(svg, `translate(${f(d)} ${f(dy * k)})`, { class: 'rspTC', opacity: a }) + svg;
}
// tint(svg, col, opacity) — flat silhouette copy of any group: col 'red'|'cyan'|'white'|'black'|'ghost' (grey fill + outline)
const TINT = { red: 'rspTR', cyan: 'rspTC', white: 'rspTW', black: 'rspTK', ghost: 'rspTG' };
const tint = (svg, col = 'white', opacity = 1) => S.g(svg, null, { class: TINT[col] || col, opacity: opacity < 1 ? f(opacity) : undefined });
// lowGfxBadge(x, y, k, t, { text, value, s, anchor, bump }) — "GRAPHICS: LOW" HUD badge (grey, monitor icon)
function lowGfxBadge(x, y, k = 1, t = 0, o = {}) {
  return counterHUD({ x, y, k, t, label: o.text || 'GRAPHICS:', value: o.value || 'LOW', theme: 'grey', icon: 'gfx', s: o.s || 1, anchor: o.anchor || 'left', bump: o.bump, size: 56 });
}
// loadingTexture(x, y, w, h, t, { k, cell, label, spinner, rx }) — grey checker "texture not loaded" placeholder with a
// shimmer sweep and an optional spinner + LOADING label. (x, y) = top-left.
function loadingTexture(x, y, w, h, t = 0, o = {}) {
  const { k = 1, cell = 40, label = true, spin = true, rx = 0 } = o;
  if (k <= 0) return '';
  const sc = cell / 40;
  let out = S.g(S.rect(0, 0, w / sc, h / sc, rx / sc, { fill: 'url(#rspChecker)' }), `translate(${f(x)} ${f(y)}) scale(${f(sc)})`);
  const cid = S.uid('rspLt');
  const u = mod(t * 0.55, 1.4) / 1.4, bx = x - w * 0.4 + u * w * 1.8, bw = Math.max(60, w * 0.18);
  out += S.clipDef(cid, S.rect(x, y, w, h, rx)) + S.g(S.path(`M${f(bx)} ${f(y)} h${f(bw)} l${f(-h * 0.35)} ${f(h)} h${f(-bw)} Z`, { fill: '#FFFFFF', opacity: 0.22 }), null, { 'clip-path': `url(#${cid})` });
  out += S.rect(x, y, w, h, rx, { fill: 'none', stroke: '#5E6470', 'stroke-width': 3, 'stroke-dasharray': '14 10' });
  if (spin && Math.min(w, h) > 120) {
    const cx = x + w / 2, cy = y + h / 2 - (label ? 18 : 0), r = Math.min(34, Math.min(w, h) * 0.14);
    out += spinner(cx, cy, r, t, '#FFFFFF');
    if (label) out += TF('LOADING' + '.'.repeat(1 + mod(Math.floor(t * 3), 3)), cx - textW('LOADING', 26, 'F') * 0.05, cy + r + 40, 26, '#FFFFFF', stroked(5, { 'letter-spacing': 3 }));
  }
  return k < 1 ? S.g(out, null, { opacity: f(k) }) : out;
}
// greyWash(k, { x, y, w, h, col, dark }) — cheap "desaturate" for whatever is drawn below it (grey + a little dark)
function greyWash(k = 1, o = {}) {
  if (k <= 0) return '';
  const { x = 0, y = 0, w = W, h = H, col = '#8C93A1', dark = 0.18 } = o;
  return S.rect(x, y, w, h, 0, { fill: col, opacity: f(0.55 * k) }) + (dark ? S.rect(x, y, w, h, 0, { fill: '#10131C', opacity: f(dark * k) }) : '');
}
// pixelDissolve({ x, y, w, h, k, seed, colors, cell, dir, mode }) — squares break off a rect area and drift away (mode 'out',
// k 0..1) or fly in and assemble (mode 'in'). Draw your object with opacity 1-k (out) / k (in) under it. ≤ 72 squares.
function pixelDissolve(o = {}) {
  const { x = 900, y = 400, w = 200, h = 200, seed = 1, colors = ['#FFD43B', '#FFE98A', '#F2A516', '#FFFFFF'], dir = 'up', mode = 'out', outline = false } = o;
  let k = clamp(o.k ?? 0.5, 0, 1);
  if (mode === 'in') k = 1 - k;
  if (k <= 0 || k >= 1) return '';
  const cell = o.cell || Math.max(10, Math.sqrt((w * h) / 64));
  const nx = Math.max(1, Math.floor(w / cell)), ny = Math.max(1, Math.floor(h / cell));
  const P = colors.map(() => '');
  const total = Math.min(72, nx * ny);
  for (let i = 0; i < total; i++) {
    const idx = nx * ny <= 72 ? i : Math.floor(hash(i * 7.31 + seed) * nx * ny);
    const cx = x + ((idx % nx) + 0.5) * (w / nx), cy = y + (Math.floor(idx / nx) + 0.5) * (h / ny);
    const th = 0.75 * hash(i * 3.1 + seed) + (dir === 'up' ? 0.2 * ((cy - y) / h) : 0);
    if (k < th) continue;
    const a = (k - th) / 0.45;
    if (a > 1.1) continue;
    const vy = dir === 'down' ? 1 : dir === 'up' ? -1 : 0;
    const px = cx + (hash(i * 9.1 + seed) - 0.5) * a * cell * 6 + Math.sin(a * 6 + i) * cell * 0.4, py = cy + vy * (a * cell * 7 + a * a * cell * 3) + (vy === 0 ? (hash(i * 4.3) - 0.5) * a * cell * 6 : 0);
    P[i % colors.length] += sq(px, py, (cell / 2) * (1 - 0.55 * a), a * 90 * (hash(i) - 0.5));
  }
  return P.map((d, i) => (d ? S.path(d, { fill: colors[i], stroke: outline ? LINE : 'none', 'stroke-width': outline ? 3 : undefined }) : '')).join('');
}

// ================================================================ 9. FOAM — elephant toothpaste
const FOAM = { line: '#151515', shade: '#D3DDEB', fill: '#FFFFFF', pastel: ['#FF9EBB', '#8FE8BF', '#FFE27A', '#C8B2FF', '#9FD8FF'] };
// batch-draw blobs [x, y, r] as 3 paths (outline, shade, highlight fill); swirls = [x, y, r, colourIndex, a0] short pastel
// arcs on top of blobs; stripes = [{ d, w, ci }] stroked pastel paths; bubbles = [x, y, r] tiny outlined circles
function foamDraw(blobs, lw, swirls = [], bubbles = [], stripes = []) {
  let dO = '', dS = '', dF = '';
  for (const [bx, by, r] of blobs) { if (r <= 0.5) continue; dO += ring(bx, by, r + lw); dS += ring(bx, by, r); dF += ring(bx - r * 0.1, by - r * 0.13, r * 0.84); }
  let o = S.path(dO, { fill: FOAM.line }) + S.path(dS, { fill: FOAM.shade }) + S.path(dF, { fill: FOAM.fill });
  for (const st of stripes) o += S.path(st.d, { fill: 'none', stroke: FOAM.pastel[st.ci % FOAM.pastel.length], 'stroke-width': f(st.w), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: st.op ?? 0.95 });
  if (swirls.length) {
    const P = FOAM.pastel.map(() => '');
    for (const [sx, sy, r, ci, a0 = 3.6] of swirls) {
      const a1 = a0 + 1.5;
      P[ci % P.length] += `M${f(sx + Math.cos(a0) * r)} ${f(sy + Math.sin(a0) * r)} A${f(r)} ${f(r)} 0 0 1 ${f(sx + Math.cos(a1) * r)} ${f(sy + Math.sin(a1) * r)} `;
    }
    P.forEach((d, i) => { if (d) o += S.path(d, { fill: 'none', stroke: FOAM.pastel[i], 'stroke-width': f(Math.max(3, lw * 1.3)), 'stroke-linecap': 'round' }); });
  }
  if (bubbles.length) o += S.path(bubbles.map(([bx, by, r]) => ring(bx, by, r)).join(''), { fill: 'none', stroke: '#B3C1D6', 'stroke-width': f(Math.max(1.5, lw * 0.45)) });
  return o;
}
// foamFountain({ x, y, s, t, age, dir, h, stripes, curl, fall, floorY, thick, pile, seed }) — a thick lumpy foam column erupting
// from (x, y) (a hat or a flask mouth): rises h px, curls over toward dir (-1 / 1; 0 = straight up into a cauliflower crown),
// falls `fall` px (or down to the screen-space floorY) and (pile) heaps up where it lands. age = seconds since the eruption (grows over ~1 s, then keeps
// flowing); t = clock for wobble + flow. stripes = pastel toothpaste stripes running along the flow.
function foamFountain(o = {}) {
  const { x = 960, y = 700, s = 1, t = 0, dir = 1, h = 520, stripes = true, curl = 1, thick = 1, seed = 1, pile = true } = o;
  const age = o.age ?? 1;
  if (age <= 0) return '';
  const lw = 7;
  const rc = h * 0.26 * curl, fallL = o.floorY !== undefined ? Math.max(40, h + (o.floorY - y) / s - 72 * thick) : o.fall ?? h * 0.95;
  const L1 = h, L2 = dir ? Math.PI * rc : 0, L3 = dir ? fallL : 0, LT = L1 + L2 + L3;
  const vis = LT * ease.out(seg(age, 0, 1.0)) + 1;
  const sway = (u) => Math.sin(u * 3 + t * 2.2 + seed) * 14 * u;
  const P = (l) => {
    if (l <= L1) { const u = l / L1; return [sway(u), -l]; }
    if (l <= L1 + L2) { const a = (l - L1) / rc; return [sway(1) * (1 - a / Math.PI) + dir * (rc - rc * Math.cos(a)), -L1 - rc * Math.sin(a)]; }
    const d = l - L1 - L2; return [dir * 2 * rc + Math.sin(d * 0.02 + t * 3) * 6, -L1 + d];
  };
  const rad = (l) => thick * (48 + 34 * (l / LT)) * (1 + 0.16 * Math.sin(l * 0.035 - t * 5 + seed) + 0.08 * Math.sin(l * 0.09 + t * 3));
  const norm = (l) => { const [ax, ay] = P(Math.min(LT, l + 3)), [bx, by] = P(Math.max(0, l - 3)); let nx = -(ay - by), ny = ax - bx; const nl = Math.hypot(nx, ny) || 1; return [nx / nl, ny / nl]; };
  const blobs = [], bub = [];
  const sp = Math.max(22, vis / 48);
  const flow = mod(t * 170, sp);
  // collar spilling over the rim
  const grow = ease.outBack(seg(age, 0, 0.35));
  for (let i = 0; i < 5; i++) blobs.push([(i - 2) * 32 * thick, -8 + Math.abs(i - 2) * 5, (36 + 6 * Math.sin(t * 5 + i)) * thick * grow]);
  for (let l = flow; l < vis; l += sp) {
    const [px, py] = P(l), r = rad(l), [nx, ny] = norm(l);
    blobs.push([px, py, r]);
    const k = Math.floor((l - flow) / sp + t * 170 / sp);
    const sd = hash(k * 1.7 + seed) > 0.5 ? 1 : -1;
    blobs.push([px + nx * r * 0.5 * sd, py + ny * r * 0.5 * sd, r * (0.55 + 0.15 * hash(k * 2.9 + seed))]);
    if (hash(k * 3.1 + seed) > 0.72) bub.push([px - nx * r * 0.3 * sd, py - ny * r * 0.3 * sd - r * 0.2, r * 0.12]);
  }
  // the leading cap / crown
  const [hx, hy] = P(Math.min(vis, LT));
  if (age < 1.15 && dir) blobs.push([hx, hy, rad(vis) * 1.3]);
  if (!dir) {
    const cr = ease.outBack(seg(age, 0.5, 1.1)) * thick;
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2 + t * 0.6; blobs.push([hx + Math.cos(a) * 78 * cr, hy - 30 * cr + Math.sin(a) * 52 * cr, (46 + 10 * Math.sin(t * 4 + i)) * cr]); }
    blobs.push([hx, hy - 30 * cr, 70 * cr]);
  }
  // globs dripping off the curl
  if (dir && age > 1) for (let i = 0; i < 4; i++) {
    const u = mod(t * 1.1 + hash(i * 3.3 + seed), 1);
    const [px, py] = P(L1 + L2 * (0.3 + 0.5 * hash(i * 7.7 + seed)));
    blobs.push([px + dir * 10 * u, py + 60 + 520 * u * u, (20 + 8 * hash(i)) * thick * (1 - 0.4 * u)]);
  }
  // stripes: 2-3 pastel bands along the flow, twisting slightly
  const strp = [];
  if (stripes) {
    const bands = [[0.42, 0, 0.3], [-0.4, 1, 0.26], [0.02, 2, 0.1]];
    for (const [off, ci, wk] of bands) {
      let d = '';
      for (let l = 4, i = 0; l < vis - 6; l += 16, i++) {
        const [px, py] = P(l), r = rad(l), [nx, ny] = norm(l), tw = off + 0.12 * Math.sin(l * 0.012 - t * 3 + ci);
        d += (i ? 'L' : 'M') + `${f(px + nx * r * tw)} ${f(py + ny * r * tw)}`;
      }
      if (d) strp.push({ d, w: thick * 64 * wk, ci: ci + seed - 1 });
    }
  }
  let out = foamDraw(blobs, lw, [], bub, strp);
  if (pile && dir && age > 0.75) {
    const [lx, ly] = P(LT);
    const pk = ease.out(seg(age, 0.75, 2.2));
    out = S.g(foamPile(lx, ly + 34 * thick, 320 * thick * (0.5 + 0.5 * pk), 120 * thick * (0.4 + 0.6 * pk), { t, seed: seed + 3 }), null) + out;
  }
  return S.g(out, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
// foamPile(x, y, w, h, { t, seed, stripes }) — a foam mound standing on the floor at y (x = centre, w x h px), flat bottom
function foamPile(x, y, w = 400, h = 160, o = {}) {
  const { t = 0, seed = 1, stripes = true } = o;
  if (w < 4 || h < 4) return '';
  const blobs = [], sw = [], bub = [];
  const lw = Math.min(7, 3 + h * 0.03);
  for (let row = 0; row < 3; row++) {
    const wr = w * (1 - 0.3 * row), r = h * (0.4 - 0.07 * row), yr = y - r * 0.95 - row * h * 0.3;
    const n = Math.max(1, Math.ceil(wr / (r * 1.25)));
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0.5 : i / (n - 1);
      const bx = x - wr / 2 + r * 0.8 + u * (wr - r * 1.6) + (hash(i * 3.1 + row * 7 + seed) - 0.5) * r * 0.4;
      const rr = r * (0.85 + 0.3 * hash(i * 5.3 + row + seed)) * (1 + 0.05 * Math.sin(t * 3 + i + row));
      blobs.push([bx, yr, rr]);
      if (stripes && hash(i * 2.3 + row * 1.7 + seed) > 0.45) sw.push([bx, yr, rr * 0.62, i + row + seed, 3.4 + hash(i * 4.4 + seed)]);
      if (hash(i * 9.1 + row + seed) > 0.62) bub.push([bx + rr * 0.35, yr - rr * 0.05, rr * 0.12]);
    }
  }
  // flat base along the floor
  const bw = w * 0.92, bh_ = h * 0.38;
  let out = S.rect(x - bw / 2 - lw, y - bh_ - lw, bw + lw * 2, bh_ + lw, Math.min(bh_ * 0.5, 30), { fill: FOAM.line });
  out += foamDraw(blobs, lw, [], [], []).replace(/^/, '');
  out += S.rect(x - bw / 2, y - bh_ * 0.75, bw, bh_ * 0.75 - lw * 0.1, Math.min(bh_ * 0.4, 24), { fill: FOAM.shade });
  out += foamDraw([], lw, sw, bub);
  return out;
}
// foamBlobs(x, y, s, k, seed, { t, stripes }) — a dollop of foam (e.g. on a head) growing in with k 0..1, with drips
function foamBlobs(x, y, s = 1, k = 1, seed = 1, o = {}) {
  const kk = clamp(k, 0, 1);
  if (kk <= 0.01) return '';
  const g = ease.outBack(kk), t = o.t || 0;
  const blobs = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + hash(seed) * 2, d = i === 0 ? 0 : 38 + 14 * hash(i * 3.3 + seed);
    const bx = i === 0 ? 0 : Math.cos(a) * d, by = i === 0 ? -16 : Math.sin(a) * d * 0.55 - 6;
    blobs.push([bx, by, (i === 0 ? 46 : 26 + 12 * hash(i * 5.1 + seed)) * (1 + 0.05 * Math.sin(t * 4 + i))]);
  }
  if (kk > 0.5) for (let i = 0; i < 2; i++) {
    const dx = (i ? 1 : -1) * (30 + 14 * hash(seed + i)), dl = 30 * seg(kk, 0.5, 1) + 6 * Math.sin(t * 3 + i);
    for (let j = 0; j < 3; j++) blobs.push([dx, 16 + dl * (j / 2), 12 - i * 2 - j * 1.5 + (j === 2 ? 3 : 0)]);
  }
  const sw = o.stripes === false ? [] : [[-6, -22, 28, seed, 3.5], [24, -12, 16, seed + 1, 3.9]];
  return S.g(foamDraw(blobs, 6, sw), `translate(${f(x)} ${f(y)}) scale(${f(s * g)})`);
}
// foamSplash(x, y, age, { s, dir, n, seed }) — a splat: centre burst + drops flying out with gravity (age in seconds)
function foamSplash(x, y, age, o = {}) {
  const { s = 1, dir = 0, n = 14, seed = 1 } = o;
  if (age < 0 || age > 1.0) return '';
  const blobs = [];
  for (let i = 0; i < Math.min(n, 40); i++) {
    const a = -Math.PI / 2 + (hash(i * 3.7 + seed) - 0.5) * 2.8 + dir * 0.6, v = (420 + 560 * hash(i * 1.3 + seed));
    const px = Math.cos(a) * v * age, py = Math.sin(a) * v * age + 1400 * age * age;
    const r = (10 + 16 * hash(i * 5.5 + seed)) * (1 - 0.5 * seg(age, 0.6, 1));
    blobs.push([px, py, r]);
  }
  if (age < 0.25) { const k = age / 0.25; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; blobs.push([Math.cos(a) * 50 * ease.out(k), Math.sin(a) * 30 * ease.out(k), 34 * (1 - k) + 8]); } blobs.push([0, 0, 56 * (1 - k * 0.6)]); }
  return S.g(foamDraw(blobs, 6), `translate(${f(x)} ${f(y)}) scale(${f(s)})`, { opacity: f(1 - seg(age, 0.8, 1)) });
}
// foamSnowman(x, y, s, t, { k }) — three foam balls (feet at x, y), coal eyes, carrot nose, stick arms, tiny top hat; k builds it
function foamSnowman(x, y, s = 1, t = 0, o = {}) {
  const k = clamp(o.k ?? 1, 0, 1);
  if (k <= 0) return '';
  const balls = [[0, -92, 92], [0, -232, 68], [0, -336, 50]];
  let out = '';
  const arms = seg(k, 0.6, 0.8);
  if (arms > 0) out += S.path(`M-50 -240 L${f(-50 - 110 * arms)} ${f(-300 - 30 * arms)} M-110 -282 l-20 -26 M50 -240 L${f(50 + 110 * arms)} ${f(-290 + Math.sin(t * 6) * 10)}`, ln(12, '#6B4426'));
  balls.forEach(([bx, by, r], i) => {
    const g = ease.outBack(seg(k, i * 0.2, i * 0.2 + 0.3));
    if (g <= 0) return;
    const blobs = [[bx, by, r * g]];
    for (let j = 0; j < 6; j++) { const a = (j / 6) * Math.PI * 2 + i; blobs.push([bx + Math.cos(a) * r * 0.62 * g, by + Math.sin(a) * r * 0.5 * g, r * 0.48 * g * (1 + 0.05 * Math.sin(t * 4 + j))]); }
    out += foamDraw(blobs, 7, [[bx, by, r * 0.62 * g, i * 2 + 1, 3.5 + i * 0.4]]);
  });
  const fk = seg(k, 0.75, 1);
  if (fk > 0) {
    out += S.g(S.circle(-18, -346, 7, { fill: LINE }) + S.circle(18, -346, 7, { fill: LINE }) + S.path('M-4 -330 L44 -320 L-2 -316 Z', ol('#FF8A1F', 4)) +
      [-24, -12, 0, 12, 24].map((dx, i) => S.circle(dx, -310 + Math.abs(dx) * -0.25 + 6, 3.5, { fill: LINE })).join('') +
      [-200, -240, -275].map((by, i) => S.circle(0, by, 8, { fill: FOAM.pastel[i] , stroke: LINE, 'stroke-width': 3 })).join('') +
      S.rect(-30, -386, 60, 8, 3, { fill: LINE }) + S.rect(-20, -430, 40, 46, 5, { fill: LINE }) + S.rect(-20, -398, 40, 8, 0, { fill: '#FF3B6B' }), `translate(0 0)`, { opacity: f(fk) });
  }
  return S.g(out, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
// foamMustache(x, y, s, t) — a curly foam moustache, (x, y) = under the nose; ≈ 200 x 70 px at s 1
function foamMustache(x, y, s = 1, t = 0) {
  const half = [[10, 4, 17], [30, 8, 18], [52, 9, 17], [72, 4, 15], [88, -8, 13], [95, -24, 11], [88, -37, 9], [75, -40, 8]];
  const blobs = [];
  for (const sd of [-1, 1]) half.forEach(([hx, hy, r], i) => blobs.push([sd * hx, hy + Math.sin(t * 5 + i * 0.6) * 1.5 * (i / 8), r * (1 + 0.04 * Math.sin(t * 6 + i))]));
  return S.g(foamDraw(blobs, 5, [[-40, 4, 12, 0, 3.3], [40, 4, 12, 3, 3.3]]), `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

// ================================================================ 10. OTHER — confetti, ghost pop, lightning, rewind
const CONF_COLS = ['#FF5A5A', '#FFB020', '#FFE14D', '#3DDC84', '#34C3FF', '#6B7BFF', '#B06BFF', '#FF6FB5'];
// a small 2-tone confetti cube (cheaper than cube(): rect + one bevel)
function miniCube(px, py, size, rot, col, lw, op) {
  const h = size / 2;
  return `<g transform="translate(${f(px)} ${f(py)}) rotate(${f(rot)})"${op < 1 ? ` opacity="${f(op)}"` : ''}><rect x="${f(-h)}" y="${f(-h)}" width="${f(size)}" height="${f(size)}" rx="${f(h * 0.2)}" fill="${col}" stroke="${LINE}" stroke-width="${f(lw)}"/><path d="M${f(h - lw / 2)} ${f(-h * 0.5)}V${f(h - lw / 2)}H${f(-h * 0.5)}L${f(-h * 0.2)} ${f(h * 0.45)}H${f(h * 0.45)}V${f(-h * 0.2)}Z" fill="${darker(col, 0.22)}"/></g>`;
}
// blockConfetti({ x, y, age, n, spread, colors, s, seed, life, up }) — multicolour cube confetti bursting from (x, y), then
// drifting down with air drag and sway; age in seconds (fades out by ~life s). n ≤ 80.
function blockConfetti(o = {}) {
  const { x = 960, y = 540, n = 40, spread = 1, colors = CONF_COLS, s = 1, seed = 5, life = 3, up = 1, power = 1 } = o;
  const age = o.age ?? 0;
  if (age < 0 || age > life * 1.25) return '';
  const c = 2.4, lw = Math.max(1.5, 3.5 * s);
  const items = [];
  for (let i = 0; i < Math.min(80, n); i++) {
    const h1 = hash(i * 3.17 + seed), h2 = hash(i * 7.31 + seed), h3 = hash(i * 1.93 + seed);
    const a = -Math.PI / 2 * up + (h1 - 0.5) * Math.PI * 1.7 * spread;
    const v0 = (900 + 1300 * h2) * s * power;
    const vx = Math.cos(a) * v0, vy = Math.sin(a) * v0;
    const vt = (170 + 150 * h3) * s;
    const e = 1 - Math.exp(-c * age);
    let px = x + (vx / c) * e, py = y + ((vy - vt) / c) * e + vt * age;
    px += Math.sin(age * (2 + 2 * h3) + i) * 26 * s * Math.min(1, age);
    const rot = h1 * 360 + age * (200 + 500 * h2) * (h3 > 0.5 ? 1 : -1);
    const end = life * (0.75 + 0.5 * h3);
    const op = 1 - seg(age, end - 0.5, end);
    if (op <= 0) continue;
    items.push(miniCube(px, py, (16 + 18 * h3) * s, rot, colors[i % colors.length], lw, op));
  }
  return items.join('');
}
// blockConfettiRain(t, { k, n, seed, colors, s, speed, t0 }) — full-screen cube confetti falling and tumbling.
// Without t0 it loops forever; with t0 the cubes enter from above starting at t0 (one pass, settles out by ~t0+8 s).
function blockConfettiRain(t, o = {}) {
  const { k = 1, n = 60, seed = 9, colors = CONF_COLS, s = 1, speed = 1 } = o;
  if (k <= 0) return '';
  const lw = Math.max(1.5, 3.5 * s);
  let out = '';
  const cnt = Math.min(80, Math.round(n * clamp(k, 0, 1)));
  for (let i = 0; i < cnt; i++) {
    const h1 = hash(i * 3.7 + seed), h2 = hash(i * 1.3 + seed), h3 = hash(i * 9.1 + seed);
    const v = (110 + 150 * h2) * speed * s;
    let y;
    if (o.t0 !== undefined) { y = -60 - h1 * 1100 + (t - o.t0) * v * 1.4; if (y > H + 60 || y < -60) continue; }
    else y = mod(t * v + h1 * 1300, 1300) - 110;
    const xx = h3 * 2000 - 40 + Math.sin(t * (1.5 + h1) + i) * 40 * s;
    out += miniCube(xx, y, (14 + 16 * h2) * s, h1 * 360 + t * (90 + 200 * h3) * (h2 > 0.5 ? 1 : -1), colors[i % colors.length], lw, 1);
  }
  return out;
}
// ghostPop({ x, y, s, age, seed }) — a grey ghost copy bursts into colourful cube confetti (draw the ghost while age < 0)
function ghostPop(o = {}) {
  const { x = 960, y = 900, s = 0.5, seed = 1 } = o;
  const age = o.age ?? 0;
  if (age < 0 || age > 1.6) return '';
  let out = '';
  if (age < 0.12) out += S.path(SIL_D, { fill: '#FFFFFF', opacity: f(1 - age / 0.12), transform: `translate(${f(x)} ${f(y - 500 * s)}) scale(${f(s * (1 + age * 2))}) translate(0 500)` });
  if (age < 0.35) { const u = age / 0.35; out += S.circle(x, y - 480 * s, (120 + 900 * ease.out(u)) * s, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(26 * s * (1 - u)), opacity: f(1 - u) }); }
  return out + blockConfetti({ x, y: y - 480 * s, age, n: 12, s: s * 1.6, seed, life: 1.4, power: 0.7 });
}
// lightning({ x0, y0, x1, y1, seed, k 0..1, width, branches, flash }) — a jagged bolt (grows in the first 12 %, flickers,
// fades) with branches, an impact glow and an optional full-frame flash.
function lightning(o = {}) {
  const { x0 = 900, y0 = -20, x1 = 1000, y1 = 700, seed = 1, width = 1, branches = 3, flash = true, col = '#A8DCFF' } = o;
  const k = clamp(o.k ?? 0.3, 0, 1);
  if (k <= 0 || k >= 1) return '';
  const bolt = (ax, ay, bx, by, sd, lev = 5) => {
    let pts = [[ax, ay], [bx, by]];
    let disp = Math.hypot(bx - ax, by - ay) * 0.16;
    for (let l = 0; l < lev; l++) {
      const np = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const [px, py] = pts[i], [qx, qy] = pts[i + 1];
        const dx = qx - px, dy = qy - py, dl = Math.hypot(dx, dy) || 1;
        const off = (hash(sd * 13.1 + l * 7.7 + i * 3.3) - 0.5) * 2 * disp;
        np.push([px, py], [(px + qx) / 2 - (dy / dl) * off, (py + qy) / 2 + (dx / dl) * off]);
      }
      np.push(pts[pts.length - 1]);
      pts = np; disp *= 0.52;
    }
    return pts;
  };
  const main = bolt(x0, y0, x1, y1, seed);
  const grow = seg(k, 0, 0.12);
  const br = k < 0.12 ? 1 : [1, 0.35, 1, 0.75, 0.95, 0.5, 0.9][Math.floor((k - 0.12) * 40) % 7] * (1 - seg(k, 0.5, 1));
  const toD = (pts, g_) => { const nn = Math.max(1, Math.floor(g_ * (pts.length - 1))); return 'M' + pts.slice(0, nn + 1).map(([a, b]) => `${f(a)} ${f(b)}`).join(' L'); };
  let d = toD(main, grow);
  for (let b = 0; b < branches; b++) {
    const i0 = Math.floor((0.2 + 0.55 * hash(b * 5.1 + seed)) * (main.length - 1));
    if (i0 / (main.length - 1) > grow) continue;
    const [sx, sy] = main[i0];
    const ang = Math.atan2(y1 - y0, x1 - x0) + (hash(b * 2.9 + seed) > 0.5 ? 0.7 : -0.7);
    const len = Math.hypot(x1 - x0, y1 - y0) * (0.2 + 0.2 * hash(b * 8.3 + seed));
    d += ' ' + toD(bolt(sx, sy, sx + Math.cos(ang) * len, sy + Math.sin(ang) * len, seed + b * 17, 4), seg(k, 0.03, 0.14));
  }
  let out = '';
  if (flash) out += S.rect(0, 0, W, H, 0, { fill: '#EAF6FF', opacity: f(0.75 * br * (1 - seg(k, 0.1, 0.4))) });
  if (grow >= 1) out += S.ellipse(x1, y1, 220 * width, 160 * width, { fill: 'url(#rspGlowB)', opacity: f(br) });
  out += S.path(d, { ...ln(f(48 * width), col, 0.25 * br), 'stroke-linejoin': 'miter' }) + S.path(d, { ...ln(f(20 * width), '#E6F6FF', 0.7 * br), 'stroke-linejoin': 'miter' }) + S.path(d, { ...ln(f(7 * width), '#FFFFFF', br), 'stroke-linejoin': 'miter' });
  return out;
}
// rewind(t, k, { label, clock, svg, seed }) — VHS ◀◀ rewind overlay (tint, scanlines, tracking band, streaks, backwards speed
// lines, blinking OSD "◀◀ REWIND" + optional clock text). Pass svg to also tear it with glitch slices (returned first).
function rewind(t, k = 1, o = {}) {
  if (k <= 0) return o.svg || '';
  const { label = 'REWIND', clock = null, seed = 4 } = o;
  let out = o.svg ? glitchSlices(o.svg, t, 0.55 * k, seed, { n: 3, maxDx: 60, fps: 22, bars: false }) : '';
  out += S.rect(0, 0, W, H, 0, { fill: '#3A2A7A', opacity: f(0.2 * k) }) + S.rect(0, 0, W, H, 0, { fill: 'url(#rspScan)', opacity: f(0.6 * k) });
  const by = H - (mod(t * 900, 1400) - 150);
  out += S.rect(0, by, W, 110, 0, { fill: '#FFFFFF', opacity: f(0.1 * k) }) + S.rect(0, by + 14, W, 8, 0, { fill: '#FFFFFF', opacity: f(0.35 * k) });
  let st = '';
  const step = Math.floor(t * 30);
  for (let i = 0; i < 16; i++) {
    const yy = hash(i * 5 + step * 1.3) * H, xx = hash(i * 9 + step * 0.7) * W;
    st += `M${f(xx)} ${f(yy)}h${f(100 + hash(i + step) * 300)}v3h${f(-(100 + hash(i + step) * 300))}Z`;
  }
  for (let i = 0; i < 6; i++) { const yy = by + hash(i * 3.1 + step) * 110, xx = hash(i * 7.3 + step) * W; st += `M${f(xx)} ${f(yy)}h${f(200 + hash(i) * 400)}v4h${f(-(200 + hash(i) * 400))}Z`; }
  out += S.path(st, { fill: '#FFFFFF', opacity: f(0.55 * k) });
  let sl = '';
  for (let i = 0; i < 10; i++) {
    const yy = 120 + hash(i * 4.4 + seed) * 840, len = 160 + hash(i * 2.2) * 320, xx = W - (mod(t * 2600 + hash(i * 6.6) * W * 2, W + len * 2) - len);
    sl += `M${f(xx)} ${f(yy)}h${f(len)}v8h${f(-len)}Z`;
  }
  out += S.path(sl, { fill: '#FFFFFF', opacity: f(0.35 * k) });
  if (label) {
    const on = mod(Math.floor(t * 2.6), 2) === 0;
    const osd = (on ? S.path('M78 70 L38 100 L78 130 Z M122 70 L82 100 L122 130 Z', { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 6, 'stroke-linejoin': 'round' }) : '') + TF(label, 142, 124, 64, '#FFFFFF', stroked(10, { 'text-anchor': 'start', 'letter-spacing': 4 }));
    out += S.g(osd, `translate(40 30)`, { opacity: f(k) });
  }
  if (clock) out += TF(clock, W - 90, 154, 60, '#FFFFFF', stroked(10, { 'text-anchor': 'end', 'letter-spacing': 3, opacity: f(k) }));
  return out;
}
// rewindT(t, a, b, from, to, e) — time mapping for a rewind: as t runs a -> b the source time runs from `from` back to `to`
// (eased in-out: slow start, fast middle, soft landing)
function rewindT(t, a, b, from, to, e = ease.inOut) { return lerp(from, to, e(seg(t, a, b))); }
// saveWave(u, { x, width, t }) — "Checkpoint saved": a green light wave sweeps through the whole frame from screen x outward
// (u 0..1, ~0.8 s). Pair it with checkpoint({ save }) and savedToast.
function saveWave(u, o = {}) {
  if (!(u > 0 && u < 1)) return '';
  const { x = 960, width = 300 } = o;
  const R_ = (0.6 * u + 0.4 * ease.out(u)) * 2300, op = 1 - u * u;
  let out = S.rect(0, 0, W, H, 0, { fill: '#5CFFA0', opacity: f(0.14 * (1 - u)) });
  let sp = '';
  for (const sd of [-1, 1]) {
    const ex = x + sd * R_;
    if ((sd < 0 && ex + width < 0) || (sd > 0 && ex - width > W)) continue;
    out += S.rect(sd < 0 ? ex : ex - width, 0, width, H, 0, { fill: `url(#${sd < 0 ? 'rspWaveL' : 'rspWaveR'})`, opacity: f(0.8 * op) });
    out += S.rect(ex - 6, 0, 12, H, 0, { fill: '#FFFFFF', opacity: f(0.85 * op) });
    for (let i = 0; i < 5; i++) sp += star4(ex - sd * (20 + 60 * hash(i * 3.1)), 120 + i * 200 + 60 * hash(i * 7.7), 22 * op, u * 300 + i * 40);
  }
  return out + S.path(sp, { fill: '#FFFFFF', stroke: '#3DDC84', 'stroke-width': 3 });
}
// whiteFlash(k) / colourFlash(k, col)
const flash = (k, col = '#FFFFFF') => (k > 0 ? S.rect(0, 0, W, H, 0, { fill: col, opacity: f(clamp(k, 0, 1)) }) : '');

// ================================================================ RECIPE — a complete fail -> respawn in one call
// Presets (u = seconds since the fail):
//   standard 1.6 s: crumble, the world pauses mid-burst (blocks hang in the air) under RESPAWNING 3·2·1 (0.3..1.3),
//                   white flash, cut, blocks converge, pop + pillar on the pad, forcefield 1.9 s
//   fast 0.5 s:     crumble + white pop, flash at 0.22, cut, pop at 0.3 (montages, repeated attempts)
//   corner 1.1 s:   the crumble plays out in full with a small corner counter, pop at 1.0
// respawnSeq(u, { preset, fail:{x,y,s,dir,floorY,seed,colors,spread}, spawn:{x,y,s}, reason, label, t, overlay:{...} })
//   -> { phase, view:'fail'|'spawn', heroAt:'fail'|'spawn'|null, pose (spread into the actor at the spawn), under, over,
//        screen, popAge, crumbleAge, end }
//   Draw: world(view) + under + [actor if heroAt] + over (all in world coords of that view) + screen (screen space).
const SEQ = {
  standard: { ov: [0.3, 1.0, 'full'], freeze: 0.36, pop: 1.3, conv: 0.12, field: 1.9 },
  fast: { ov: null, freeze: null, flashAt: 0.22, pop: 0.3, conv: 0.06, field: 1.1 },
  corner: { ov: [0.08, 0.86, 'corner'], freeze: null, pop: 1.0, conv: 0.14, field: 1.6 },
};
function respawnSeq(u, o = {}) {
  const P = { ...(SEQ[o.preset] || SEQ.standard), ...(o.timing || {}) };
  const fail = { x: 960, y: 900, s: 0.5, ...(o.fail || {}) }, spawn = { x: 960, y: 900, s: 0.5, ...(o.spawn || {}) };
  const t = o.t ?? u;
  const res = { phase: 'alive', view: 'fail', heroAt: 'fail', pose: {}, under: '', over: '', screen: '', popAge: u - P.pop, crumbleAge: u, end: P.pop + P.field };
  if (u < 0) return res;
  const view = u < P.pop - P.conv ? 'fail' : 'spawn';
  res.view = view; res.heroAt = null;
  if (view === 'fail') {
    res.phase = P.ov && u >= P.ov[0] ? 'count' : 'crumble';
    const ca = P.freeze !== null && P.ov && u >= P.freeze ? P.freeze : u;
    res.crumbleAge = ca;
    res.over += crumble({ ...fail, age: ca });
  } else {
    const pa = u - P.pop;
    res.phase = pa < 0 ? 'converge' : pa < 0.9 ? 'pop' : u < res.end ? 'protected' : 'done';
    res.under += respawnPop({ ...spawn, age: pa, part: 'back' });
    res.over += respawnPop({ ...spawn, age: pa, part: 'front' });
    if (pa >= 0) {
      res.heroAt = 'spawn';
      const pp = popPose(pa, spawn.s);
      res.pose = { sx: pp.sx, sy: pp.sy, lift: pp.lift };
      const fk = 1 - seg(u, res.end - 0.7, res.end);
      if (fk > 0) res.over += forcefield({ ...spawn, t, k: fk });
    }
  }
  if (P.ov) res.screen += respawnOverlay(u, { t0: P.ov[0], dur: P.ov[1], style: P.ov[2], reason: o.reason || '', label: o.label || 'RESPAWNING', ...(o.overlay || {}) });
  if (P.flashAt !== undefined) res.screen += flash(0.9 * (1 - Math.abs(u - P.flashAt) / 0.08));
  if (u >= P.pop && u < P.pop + 0.08 && !P.ov) res.screen += flash(0.6 * (1 - (u - P.pop) / 0.08));
  return res;
}

module.exports = {
  DEFS, W, H, LINE,
  // utilities
  hash, seg, bumpK, smooth, mod, mix, darker, lighter, textW, wrap, fmt, scramble, spinner, icon, star4, star5, ring, sq, T, TF, flash, saveWave,
  // 1 Tip
  tip, tipCard, TIP_MOODS, TIPC,
  // 2 checkpoint
  checkpoint, flag, flagProp, tinyFlag, CPAL,
  // 3 fail
  crumble, cube, HERO_COLS, GHOST_COLS, BODY_BLOCKS,
  // 4 respawn
  respawnOverlay, respawnPop, popPose, forcefield,
  // 5 menu
  escMenu, MENU_ITEMS,
  // 6 HUD
  counterHUD, savedToast, HUD_THEME,
  // 7 windows
  sysWindow, skyCrack, WIN_THEME,
  // 8 lag & glitch
  freezeT, stutterVoiceT, rubberBand, lagJitter, glitchSlices, rgbSplit, tint, lowGfxBadge, loadingTexture, greyWash, pixelDissolve,
  // 9 foam
  foamFountain, foamPile, foamBlobs, foamSplash, foamSnowman, foamMustache, FOAM,
  // 10 other
  blockConfetti, blockConfettiRain, ghostPop, lightning, rewind, rewindT, CONF_COLS,
  // recipe
  respawnSeq, SEQ,
};
