// Private helpers for SC 03 (avatar creation) and SC 04 (the lobby): transitions, split-screen panels, the hands that
// type on Dad's laptop / tap Granny's phone, the custom device screens (username field, voice typing, the BUY-only shop,
// chat input, PLAY), the living-room and plaza composers with culling, the item-stacked avatar previews, loadout cards,
// shout sound-waves, crowds that turn to stare.
'use strict';

const K = require('./kit');
const G = require('./gameui');
const H = require('./sets_house');
const GS = require('./sets_game');
const X = require('../rig/extras');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, view, actor } = K;

const LINE = '#151515';
const W = 1920, HH = 1080;
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const TS = (txt, x, y, size, fill, extra = {}) => T(esc(txt), x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const TFS = (txt, x, y, size, fill, extra = {}) => TF(esc(txt), x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const pop = (t, t0, d = 0.28) => ease.outBack(seg(t, t0, t0 + d));
const camAt = GS.camAt;
const toScr = (cam, x, y) => GS.toScreen(cam, x, y, 1);

function shakeCam(cam, t, list) {
  const c = { ...cam };
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); c.sx = (c.sx || 0) + s.sx; c.sy = (c.sy || 0) + s.sy; }
  return c;
}
function clipTo(x, y, w, h, inner, r = 0) {
  const id = S.uid('s34c');
  return S.clipDef(id, S.rect(x, y, w, h, r)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
}
// squash/stretch impulse after t0 -> {sx, sy}
function boing(t, t0, amp = 0.25, dur = 0.7) {
  const k = t - t0;
  if (k < 0 || k > dur) return { sx: 1, sy: 1 };
  const v = amp * Math.exp(-k * 7) * Math.cos(k * 20);
  return { sx: 1 - v * 0.6, sy: 1 + v };
}
// whip-pan streak flash centred on the cut time tc
function whip(t, tc, dir = 1, dur = 0.1) {
  const d = t - tc;
  if (Math.abs(d) > dur) return '';
  const k = 1 - Math.abs(d) / dur;
  let p = '';
  for (let i = 0; i < 16; i++) {
    const y = hash(i * 3.7) * HH, len = 300 + hash(i) * 700, th = 8 + hash(i * 2.2) * 16;
    const x = ((hash(i * 5.1) * 2600 + dir * d * 16000) % 2600 + 2600) % 2600 - 400;
    p += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.rect(0, 0, W, HH, 0, { fill: '#FFFFFF', opacity: f(0.6 * k) }) + S.path(p, { fill: '#FFFFFF', opacity: f(0.85 * k) });
}
const smash = (t, tc, dur = 0.14, a = 0.75) => (t >= tc && t < tc + dur ? K.C.whiteFlash(a * (1 - (t - tc) / dur)) : '');
function zoomLines(cx, cy, k, t, col = '#FFFFFF', n = 22, r0b = 380) {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i * 3.1) * 0.2, r0 = r0b + hash(i + Math.floor(t * 12)) * 160, r1 = r0 + 900;
    const w = 10 + hash(i * 1.7) * 14;
    const ax = Math.cos(a), ay = Math.sin(a), nx = -ay * w, ny = ax * w;
    d += `M${f(cx + ax * r0)} ${f(cy + ay * r0)}L${f(cx + ax * r1 + nx)} ${f(cy + ay * r1 + ny)}L${f(cx + ax * r1 - nx)} ${f(cy + ay * r1 - ny)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.75 * k) });
}
function streaks(t, y0, y1, n, seed, col = '#FFFFFF', op = 0.6, speed = 2600, dir = -1) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const y = lerp(y0, y1, hash(i * 2.3 + seed)), len = 160 + hash(i * 5.7 + seed) * 380, th = 5 + hash(i * 1.1 + seed) * 9;
    const x = (((hash(i * 7.9 + seed) * 2600 + dir * t * speed * (0.6 + 0.8 * hash(i + seed))) % 2600) + 2600) % 2600 - 340;
    d += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(op) });
}
const tint = (col, op) => (op > 0.003 ? S.rect(-20, -20, W + 40, HH + 40, 0, { fill: col, opacity: f(clamp(op, 0, 1)) }) : '');
// cheap vignette with 4 edge bands
function edgeDark(op = 0.35, col = '#0B0820') {
  if (op <= 0) return '';
  let o = '';
  for (let i = 0; i < 4; i++) {
    const w = 60 + i * 70, a = op * 0.22;
    o += S.path(`M-10 -10 H${W + 10} V${HH + 10} H-10 Z M${w} ${w * 0.6} V${HH - w * 0.6} H${W - w} V${w * 0.6} Z`, { fill: col, opacity: f(a), 'fill-rule': 'evenodd' });
  }
  return o;
}

// ---------------------------------------------------------------- split-screen panels
// draw `inner` (authored for the full 1920x1080 frame) scaled into the rect (x, y, w, h); white frame + dark rim
function panel(x, y, w, h, inner, o = {}) {
  const k = o.k ?? 1;
  if (k <= 0.001) return '';
  const sc = Math.max(w / W, h / HH) * (o.zoom || 1);
  const cx = x + w / 2, cy = y + h / 2;
  const id = S.uid('s34p');
  let g = S.clipDef(id, S.rect(x, y, w, h, o.r ?? 0));
  g += S.g(S.g(inner, `translate(${f(cx)} ${f(cy)}) scale(${f(sc)}) translate(${f(-960 - (o.dx || 0))} ${f(-540 - (o.dy || 0))})`), null, { 'clip-path': `url(#${id})` });
  if (o.tint) g += S.rect(x, y, w, h, 0, { fill: o.tint, opacity: f(o.tintOp ?? 0.35) });
  g += S.rect(x, y, w, h, o.r ?? 0, { fill: 'none', stroke: o.frame || '#FFFFFF', 'stroke-width': o.border ?? 10 });
  g += S.rect(x - 5, y - 5, w + 10, h + 10, o.r ?? 0, { fill: 'none', stroke: LINE, 'stroke-width': 4 });
  if (k < 1) {
    const e = ease.outBack(k);
    return S.g(g, `translate(${f(cx)} ${f(cy)}) scale(${f(e)}) translate(${f(-cx)} ${f(-cy)})`, { opacity: f(seg(k, 0, 0.3)) });
  }
  return g;
}
function panelTag(x, y, text, col = '#151A26', fg = '#FFFFFF', s = 1) {
  const w = (text.length * 19 + 40) * s;
  return S.g(S.rect(0, 0, w, 50 * s, 25 * s, { fill: col, opacity: 0.92, stroke: LINE, 'stroke-width': 4 }) + TF(esc(text), w / 2, 35 * s, 28 * s, fg, { 'letter-spacing': 1 }), tf(x, y));
}
// split frame background (behind panels)
const splitBg = (col1 = '#2A1640', col2 = '#3A2060') => S.rect(0, 0, W, HH, 0, { fill: col1 }) + S.path('M0 0 L1920 0 L1920 1080 Z', { fill: col2, opacity: 0.5 });

// ---------------------------------------------------------------- hands (seen from above: typing, tapping)
const HANDS = {
  dad: { skin: '#F4CDAE', shade: '#E3B48F', sleeve: '#BFD9F2', sleeve2: '#9FC0E0', cuff: '#A8C8E8' },
  you: { skin: '#FFFFFF', shade: '#E2E4EC', sleeve: '#D8262E', sleeve2: '#B01D24', cuff: '#F2D04A' },
  granny: { skin: '#F8DCCB', shade: '#E8C2AE', sleeve: '#E992B4', sleeve2: '#CC7598', cuff: '#FFFFFF' },
  mom: { skin: '#F6D5BC', shade: '#E6BC9E', sleeve: '#6FAE9C', sleeve2: '#558E7E', cuff: '#558E7E' },
};
// a pointing hand: tip (x, y), arm enters from (ax, ay); press 0..1 pushes it in; s scale (finger ≈ 32·s wide)
function hand(o) {
  const c = HANDS[o.kind || 'dad'], s0 = o.s ?? 1, pr = clamp(o.press || 0, 0, 1);
  const s = s0 * (1 - 0.06 * pr);
  const dx = o.x - o.ax, dy = o.y - o.ay;
  const th = (Math.atan2(dx, -dy) * 180) / Math.PI;
  const len = Math.hypot(dx, dy) / s + 200;
  let g = '';
  // shadow on the surface (offset grows when hovering)
  const hov = (1 - pr) * 26;
  const sh = S.ellipse(0, 0, 24, 16, { fill: '#000000', opacity: f(0.18 + 0.12 * pr) });
  let out = o.shadow === false ? '' : S.g(sh, tf(o.x + hov * 0.6 * s0, o.y + hov * s0, s0));
  // sleeve
  g += S.rect(-62, 190, 124, len, 30, ol(c.sleeve, 7));
  g += S.path('M-30 260 V' + f(len) + ' M28 300 V' + f(len), ln(5, c.sleeve2, 0.6));
  g += S.rect(-60, 158, 120, 48, 18, ol(c.cuff, 6));
  // index finger, then the fist over its base
  g += S.rect(-17, 0, 34, 112, 17, ol(c.skin, 7)) + S.path('M-8 12 Q0 4 8 12 V22 H-8 Z', { fill: '#FFFFFF', opacity: 0.55 });
  g += S.path('M-56 92 Q-58 64 -30 62 H30 Q58 62 56 96 L52 150 Q50 172 26 172 H-26 Q-52 172 -54 148 Z', ol(c.skin, 7));
  g += S.path('M-46 98 Q-30 88 -14 98 M-46 126 Q-30 116 -14 126 M10 98 Q26 88 42 98', ln(5, c.shade));
  g += S.path('M44 70 Q76 82 70 118 Q66 134 50 128', ol(c.skin, 7));
  out += S.g(g, `translate(${f(o.x)} ${f(o.y)}) rotate(${f(th)}) translate(0 ${f(-pr * 10)}) scale(${f(s)})`);
  if (o.ring && pr > 0 && pr < 1) out += S.circle(o.x, o.y, (14 + 50 * pr) * s0, { fill: 'none', stroke: o.ringCol || '#FFE45C', 'stroke-width': f(8 * (1 - pr) * s0) });
  return out;
}
// a hunting finger path: a small figure-of-eight drift around (x, y)
const hunt = (t, x, y, r = 90, sp = 2.4) => [x + r * Math.sin(t * sp), y + r * 0.45 * Math.sin(t * sp * 2)];

// ---------------------------------------------------------------- device screens
// keyboardClose display: content centred on (0,0), 1400 x 840; only y ≈ 50..420 is in frame at rest
function nameScreen(o = {}) {
  return (w, h) => {
    const t = o.t || 0;
    let s = S.rect(-w / 2, -h / 2, w, h, 0, { fill: '#1FA39A' }) + S.rect(-w / 2, -h / 2, w, h * 0.42, 0, { fill: '#2BC2B4' });
    for (let i = 0; i < 7; i++) s += G.isoCube(-600 + i * 200, -330 + 40 * Math.sin(t * 1.3 + i), 26, ['#5EE3D3', '#36CFC0', '#21A89B'], 0);
    s += TS(o.title || 'CREATE YOUR AVATAR', 0, -230, 84, '#FFFFFF', { 'stroke-width': 12 });
    // the field
    const fy = o.fy ?? 120, txt = String(o.text || ''), n = Math.round(clamp(o.typed ?? 1, 0, 1) * txt.length);
    const shown = txt.slice(0, n);
    s += S.rect(-600, fy, 1200, 150, 40, ol('#FFFFFF', 10)) + S.rect(-586, fy + 14, 250, 122, 30, { fill: '#17857D' });
    s += TF(o.label || 'NAME', -461, fy + 98, 54, '#FFFFFF', { 'letter-spacing': 3 });
    if (n === 0 && !o.password) s += TF('Pick a username', -300, fy + 100, 58, '#A9B0C2', { 'text-anchor': 'start' });
    if (o.password) for (let i = 0; i < n; i++) s += S.circle(-280 + i * 62, fy + 75, 20, { fill: '#2A2D3A' });
    else s += TF(esc(shown), -300, fy + 102, 88, '#1C2333', { 'text-anchor': 'start', 'letter-spacing': 2 });
    const cx = o.password ? -300 + n * 62 : -300 + G.textW(shown, 88, 'F') + n * 2;
    if ((o.cursor ?? true) && Math.floor(t * 2.6) % 2 === 0) s += S.rect(cx + 6, fy + 30, 9, 92, 4, { fill: '#FF8A2B' });
    if (o.ok) s += S.g(S.circle(0, 0, 46, ol('#3BD16F', 8)) + S.path('M-20 2 L-6 18 L22 -14', ln(12, '#FFFFFF')), tf(520, fy + 75, ease.outBack(clamp(o.ok, 0, 1))));
    if (o.warn) s += S.g(S.rect(-150, -50, 300, 100, 50, ol('#FF4B5C', 9)) + T('WEAK!', 0, 26, 70, '#FFFFFF'), tf(420, fy + 75, ease.outBack(clamp(o.warn, 0, 1)), -6));
    return s;
  };
}
// the game seen on a screen: tiny sky + tiles + the CHAT input bar (caps) — for keyboard / laptop inserts in SC04
function chatScreen(o = {}) {
  return (w, h) => {
    const t = o.t || 0;
    let s = S.rect(-w / 2, -h / 2, w, h, 0, { fill: '#7CCBFF' }) + S.rect(-w / 2, 40, w, h / 2, 0, { fill: '#E6D6F2' });
    s += S.path(`M${-w / 2} 40 H${w / 2}`, ln(6, '#B9A3D6'));
    for (let i = 0; i < 4; i++) s += S.ellipse(-520 + i * 340 + ((t * 30) % 340), -300 + 30 * hash(i), 90, 30, { fill: '#FFFFFF', opacity: 0.8 });
    if (o.inner) s += o.inner;
    const txt = String(o.text || ''), n = Math.round(clamp(o.typed ?? 1, 0, 1) * txt.length), shown = txt.slice(0, n);
    const by = o.by ?? 250;
    s += S.rect(-640, by, 1280, 130, 34, { fill: '#14182A', opacity: 0.92, stroke: '#36CFC0', 'stroke-width': 7 });
    s += S.rect(-620, by + 18, 150, 94, 26, { fill: '#36CFC0' }) + TF('CHAT', -545, by + 80, 40, '#14182A');
    if (n === 0) s += TF('Press / to chat', -440, by + 84, 50, '#7E8AA8', { 'text-anchor': 'start' });
    s += T(esc(shown), -440, by + 88, 64, '#FFFFFF', { 'text-anchor': 'start', 'letter-spacing': 1 });
    if (Math.floor(t * 2.6) % 2 === 0) s += S.rect(-436 + G.textW(shown, 64, 'L'), by + 30, 8, 72, 3, { fill: '#FF4B5C' });
    if (o.caps) s += S.g(S.rect(-110, -26, 220, 52, 26, ol('#FF4B5C', 5)) + S.circle(-80, 0, 9, { fill: '#7DFF8E' }) + TF('CAPS LOCK', 14, 10, 28, '#FFFFFF'), tf(520, by - 20));
    if (o.send > 0) s += S.rect(-640, by, 1280, 130, 34, { fill: '#36CFC0', opacity: f(0.6 * (1 - o.send)) });
    return s;
  };
}
// Granny's phone, portrait 380 x 790 (0,0 = top-left): the voice-typing screen
function voiceScreen(o = {}) {
  return (w, h) => {
    const t = o.t || 0, lvl = o.level || 0;
    let s = S.rect(0, 0, w, h, 0, { fill: '#FFF4FA' }) + S.rect(0, 0, w, 120, 0, { fill: '#FF8FC0' });
    s += TF('VOICE INPUT', w / 2, 76, 34, '#FFFFFF', { 'letter-spacing': 2 });
    // text box
    s += S.rect(20, 150, w - 40, 360, 26, ol('#FFFFFF', 5));
    const words = o.words || [];
    let line = 0, xx = 40, out = '';
    for (const wd of words) {
      const ww = G.textW(wd.text, 46, 'L') + 16;
      if (xx + ww > w - 30) { line++; xx = 40; }
      const k = clamp(wd.k, 0, 1);
      if (k > 0) out += S.g(T(esc(wd.text), 0, 0, 46, '#2A1640', { 'text-anchor': 'start' }), tf(xx, 214 + line * 62, 1 + 0.5 * (1 - ease.outBack(k)) * 0, 0) + ` scale(${f(0.6 + 0.4 * ease.outBack(k))})`, { opacity: f(seg(k, 0, 0.2)) });
      xx += ww;
    }
    s += out;
    if (Math.floor(t * 2.6) % 2 === 0) s += S.rect(xx, 176 + line * 62, 5, 48, 2, { fill: '#FF4FA0' });
    // mic + level rings + waveform
    const mx = w / 2, my = 640;
    for (let i = 0; i < 3; i++) s += S.circle(mx, my, 70 + i * 26 + lvl * 30, { fill: 'none', stroke: '#FF4FA0', 'stroke-width': 6, opacity: f(lvl * (0.6 - i * 0.18)) });
    s += S.circle(mx, my, 66, ol('#FF4FA0', 6)) + S.rect(mx - 18, my - 40, 36, 60, 18, { fill: '#FFFFFF' }) + S.path(`M${mx - 30} ${my - 4} Q${mx - 30} ${my + 34} ${mx} ${my + 34} Q${mx + 30} ${my + 34} ${mx + 30} ${my - 4} M${mx} ${my + 34} V${my + 48}`, ln(6, '#FFFFFF'));
    let bars = '';
    for (let i = 0; i < 9; i++) { const bh = 10 + 60 * lvl * Math.abs(Math.sin(t * 17 + i * 1.7)); bars += `M${f(40 + i * 12)} ${f(my - bh / 2)} v${f(bh)} M${f(w - 40 - i * 12)} ${f(my - bh / 2)} v${f(bh)}`; }
    s += S.path(bars, ln(6, '#FF8FC0'));
    if (lvl > 0.6) s += TF('TOO LOUD!', w / 2, 760, 30, '#FF3B4E', { opacity: f(seg(lvl, 0.6, 0.8)) });
    return s;
  };
}
// Granny's phone: the avatar shop where EVERY button says BUY (no GO)
const GRAN_ITEMS = ['furcoat', 'pearls', 'monocle', 'cane', 'tophat', 'crown', 'wings', 'chef', 'cape'];
function buyScreen(o = {}) {
  return (w, h) => {
    const t = o.t || 0;
    let s = S.rect(0, 0, w, h, 0, { fill: '#FFF7EC' }) + S.rect(0, 0, w, 104, 0, { fill: '#2BC2B4' });
    s += TF('AVATAR SHOP', w / 2 - 30, 68, 34, '#FFFFFF');
    s += S.g(S.rect(-60, -22, 120, 44, 22, { fill: '#14182A' }) + G.coinIcon(-38, 0, 15, t * 3) + T(o.coins || '1,000', 12, 13, 30, '#FFD23F'), tf(w - 78, 52, 0.9));
    const cw = 108, chh = 150, gx = (w - cw * 3 - 20) / 2;
    (o.items || GRAN_ITEMS).forEach((id, i) => {
      const cx = gx + (i % 3) * (cw + 10), cy = 124 + Math.floor(i / 3) * (chh + 12);
      const bought = (o.bought || {})[id] || 0, hl = o.hl === i;
      let c = S.rect(0, 0, cw, chh, 18, { fill: '#FFFFFF', stroke: hl ? '#FF8A2B' : LINE, 'stroke-width': hl ? 6 : 4 });
      c += S.g(G.itemIcon(id), tf(cw / 2, 56, 0.55));
      const bk = ease.outBack(clamp(bought, 0, 1));
      if (bought > 0) c += S.rect(10, chh - 42, cw - 20, 32, 16, ol('#3BD16F', 3)) + TF('OWNED', cw / 2, chh - 18, 18, '#FFFFFF');
      else c += S.rect(10, chh - 42, cw - 20, 32, 16, ol('#FF8A2B', 3)) + TF('BUY', cw / 2, chh - 18, 20, '#FFFFFF');
      if (bought > 0 && bought < 1.6) c += S.g(S.rect(-56, -18, 112, 36, 8, { fill: 'none', stroke: '#1E9E52', 'stroke-width': 5 }) + T('BOUGHT!', 0, 11, 26, '#1E9E52'), tf(cw / 2, 70, 0.4 + 0.6 * bk, -14), { opacity: f(1 - seg(bought, 1.2, 1.6)) });
      s += S.g(c, tf(cx, cy));
    });
    s += S.rect(30, h - 120, w - 60, 80, 40, ol('#FF8A2B', 5)) + TF('BUY ALL', w / 2, h - 66, 36, '#FFFFFF');
    if (o.note) s += S.g(S.rect(-130, -30, 260, 60, 30, ol('#FFE45C', 4)) + TF('NO "GO" BUTTON', 0, 10, 24, '#2A1640'), tf(w / 2, h - 170, ease.outBack(clamp(o.note, 0, 1)), -4));
    return s;
  };
}
// the big PLAY / JOIN screen for any device: fn(w, h) with 0,0 top-left (deviceFrame) — press 0..1, load 0..1
function playScreen(o = {}) {
  return (w, h) => {
    const t = o.t || 0, pr = clamp(o.press || 0, 0, 1), ld = clamp(o.load || 0, 0, 1);
    let s = S.rect(0, 0, w, h, 0, { fill: '#7CCBFF' }) + S.rect(0, h * 0.62, w, h * 0.38, 0, { fill: '#B9E86A' }) + S.path(`M0 ${f(h * 0.62)} H${w}`, ln(5, '#7FBF3A'));
    const u = Math.min(w, h * 1.6) / 600;
    s += S.g(G.cubeLogo(0, 0, 1), tf(w / 2, h * 0.26, u * 0.8));
    const bw = 300 * u, bh = 96 * u, d = 8 * u * bump(pr, 0, 1);
    s += S.rect(w / 2 - bw / 2, h * 0.58 - bh / 2 + 8 * u, bw, bh, bh / 2, { fill: '#1E9E52', stroke: LINE, 'stroke-width': 6 * u });
    s += S.rect(w / 2 - bw / 2, h * 0.58 - bh / 2 + d, bw, bh, bh / 2, { fill: ld > 0 ? '#9AA0AE' : '#3BD16F', stroke: LINE, 'stroke-width': 6 * u });
    s += T(ld > 0 ? 'JOINING...' : 'PLAY', w / 2, h * 0.58 + 22 * u + d, (ld > 0 ? 44 : 64) * u, '#FFFFFF', { stroke: LINE, 'stroke-width': 8 * u, 'paint-order': 'stroke' });
    if (ld > 0) s += K.loadingWheel(w / 2, h * 0.82, 30 * u, t, '#FFFFFF', 8, 7 * u);
    if (pr > 0 && pr < 1) s += S.circle(w / 2, h * 0.58, (60 + 220 * pr) * u, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 10 * u * (1 - pr) });
    return s;
  };
}

// ---------------------------------------------------------------- the living room
const LR = H.SPOTS.livingRoom;
// is a character standing at feet (x, y) with scale s visible through cam?
function inView(cam, x, y, s = 0.5, h = 1000) {
  const z = cam.zoom ?? 1, cx = 960 + (cam.x || 0), cy = 540 + (cam.y || 0);
  const hw = 960 / z + 320 * s, top = y - h * s;
  return Math.abs(x - cx) < hw && y > cy - 540 / z - 40 && top < cy + 540 / z + 40;
}
// o: { set: {...livingRoom opts}, seated, devices, standing, over } (world-space svg strings)
function room(t, cam, o = {}) {
  const Ly = H.livingRoom.layers(t, { time: 'evening', ...(o.set || {}) });
  let s = view(cam, Ly.bg, 0.8) + view(cam, Ly.mid);
  if (o.seated) s += view(cam, o.seated);
  s += view(cam, Ly.front);
  if (o.devices) s += view(cam, o.devices);
  s += view(cam, Ly.table);
  if (o.standing) s += view(cam, o.standing);
  s += view(cam, Ly.light);
  if (o.over) s += view(cam, o.over);
  return s;
}
const seat = (who, size, extra) => H.seatPose(LR.seats[who], size, extra);
const SIZE = { dad: 1.1, mom: 1.04, grandma: 0.9, you: 1 };

// ---------------------------------------------------------------- Cube City
function plaza(t, cam, o = {}) {
  const Ly = GS.plaza.layers(t, cam, { time: 'day', ...(o.set || {}) });
  let s = Ly.bg + Ly.mid;
  if (o.behind) s += view(cam, o.behind);
  s += Ly.front;
  if (o.chars) s += view(cam, o.chars);
  s += Ly.fg + Ly.light;
  if (o.over) s += view(cam, o.over);
  return s;
}
const PZ = GS.SPOTS.plaza;
const sAt = (y) => PZ.sAt(y);

// ---------------------------------------------------------------- avatar previews with stacked shop items
// noob anatomy at s 1 (feet 0,0): head top -615, eyes -500, mouth -440, shoulders -390, waist -215, head half-width 95
const ITEM_AT = {
  tophat: { y: -640, s: 0.95, z: 'top', stack: true }, cowboy: { y: -640, s: 1.1, z: 'top', stack: true }, crown: { y: -630, s: 0.9, z: 'top', stack: true },
  propeller: { y: -640, s: 0.9, z: 'top', stack: true }, chef: { y: -650, s: 0.9, z: 'top', stack: true }, viking: { y: -640, s: 1.0, z: 'top', stack: true },
  sunglasses: { y: -500, s: 0.95, z: 'front' }, mustache: { y: -445, s: 0.75, z: 'front' }, monocle: { x: 40, y: -500, s: 0.5, z: 'front' },
  wings: { y: -360, s: 2.4, z: 'back' }, dragonwings: { y: -330, s: 2.6, z: 'back' }, cape: { y: -260, s: 1.8, z: 'back' },
  tutu: { y: -200, s: 1.35, z: 'front' }, pearls: { y: -370, s: 0.75, z: 'front' }, potlid: { x: -150, y: -260, s: 0.7, z: 'front' },
  furcoat: { y: -290, s: 1.9, z: 'front' }, cane: { x: 150, y: -150, s: 1.3, z: 'front' }, armor: { y: -290, s: 1.5, z: 'front' },
};
// items: [{ id, k }] in purchase order; hats stack upward (a wobbling tower)
function itemsLayer(items, z, t = 0) {
  let o = '', hatY = 0, hatN = 0;
  for (const it of items) {
    const a = ITEM_AT[it.id];
    if (!a || it.k <= 0) continue;
    const k = ease.outBack(clamp(it.k, 0, 1));
    if (a.stack) {
      const y = a.y - hatY;
      if (a.z === z) o += S.g(G.itemIcon(it.id), tf((a.x || 0) + Math.sin(t * 3 + hatN) * 6 * hatN, y - 120 * (1 - clamp(it.k * 2, 0, 1)), a.s * k, (hatN % 2 ? 6 : -6) * Math.min(1, hatN) + Math.sin(t * 2.6 + hatN) * 3 * hatN));
      hatY += 60; hatN++;
    } else if (a.z === z) o += S.g(G.itemIcon(it.id), tf(a.x || 0, a.y, a.s * k));
  }
  return o;
}
// a noob dressed with items, feet at (x, y) with scale s (pose = noob pose fields)
function dressedNoob(i, t, x, y, s, items = [], pose = {}) {
  const body = K.draw.noob(i, { x: 0, y: 0, s: 1, nametag: false, shadow: false, ...pose });
  return S.g(itemsLayer(items, 'back', t) + body + itemsLayer(items, 'front', t) + itemsLayer(items, 'top', t), tf(x, y, s));
}

// ---------------------------------------------------------------- misc FX
// shout waves: arcs travelling from (x, y) in direction ang (deg, 0 = right), k = loudness
function shoutWaves(x, y, ang, t, k = 1, s = 1, col = '#FFFFFF') {
  if (k <= 0) return '';
  let o = '';
  for (let i = 0; i < 4; i++) {
    const ph = (t * 2.6 + i / 4) % 1, r = (40 + ph * 300) * s;
    const a0 = ((ang - 34) * Math.PI) / 180, a1 = ((ang + 34) * Math.PI) / 180;
    o += S.path(`M${f(x + Math.cos(a0) * r)} ${f(y + Math.sin(a0) * r)} A${f(r)} ${f(r)} 0 0 1 ${f(x + Math.cos(a1) * r)} ${f(y + Math.sin(a1) * r)}`, { fill: 'none', stroke: col, 'stroke-width': f((14 - 8 * ph) * s), 'stroke-linecap': 'round', opacity: f(k * (1 - ph) * 0.9) });
  }
  return o;
}
// little "!" / "?" / anger / sweat marks over a head
const mark = (txt, x, y, k, size = 90, rot = -8, col = '#FFE14D') => K.C.sfx(txt, x, y, k, size, rot, col);
// loadout card: device art + title + stars + stat line (k pops it, (x, y) = centre)
function loadoutCard(o) {
  const k = clamp(o.k ?? 1, 0, 1);
  if (k <= 0) return '';
  const w = 400, h = 560, good = o.stars >= 4;
  let c = S.rect(-w / 2 + 10, -h / 2 + 14, w, h, 34, { fill: '#000', opacity: 0.3 });
  c += S.rect(-w / 2, -h / 2, w, h, 34, ol(good ? '#2A2246' : '#3A3440', 8));
  c += S.rect(-w / 2 + 14, -h / 2 + 14, w - 28, 290, 24, { fill: good ? '#3B2F7A' : '#5A5560' });
  if (good) c += K.rays(0, -h / 2 + 160, 12, 260, '#B06BFF', 0.25, (o.t || 0) * 20);
  c += S.g(o.art || '', tf(0, -h / 2 + 160));
  c += S.rect(-w / 2 + 14, -h / 2 + 14, 150, 44, 22, { fill: o.col || '#FF8A2B' }) + TF(esc(o.who), -w / 2 + 89, -h / 2 + 45, 26, '#FFFFFF');
  c += TFS(o.title, 0, 70, 40, '#FFFFFF', { 'stroke-width': 6 });
  let st = '';
  for (let i = 0; i < 5; i++) st += S.path(starD(-120 + i * 60, 130, 24, 11), { fill: i < o.stars ? '#FFD23F' : '#4A4552', stroke: LINE, 'stroke-width': 4 });
  c += st;
  (o.stats || []).forEach((sl, i) => { c += TF(esc(sl), 0, 190 + i * 36, 26, i === 0 ? (good ? '#7DFF8E' : '#FF8A8A') : '#C9C4D8'); });
  if (o.loading) c += K.loadingWheel(150, -h / 2 + 260, 18, o.t || 0, '#FFFFFF', 8, 5);
  return S.g(c, tf(o.x, o.y + 300 * (1 - ease.out(k)), (o.s ?? 1) * (0.7 + 0.3 * ease.outBack(k)), o.rot || 0), { opacity: f(seg(k, 0, 0.3)) });
}
function starD(x, y, r, ri) {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? ri : r; d += (i ? 'L' : 'M') + f(x + Math.cos(a) * rr) + ' ' + f(y + Math.sin(a) * rr); }
  return d + 'Z';
}
// poof cloud (age s)
function poof(x, y, age, s = 1, col = '#FFFFFF', n = 9, line = true) {
  if (age < 0 || age > 0.8) return '';
  const u = age / 0.8;
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i) * 0.5, d = (60 + 160 * ease.out(u)) * s;
    o += S.circle(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, (70 - 40 * u) * s * (0.7 + 0.5 * hash(i * 3)), line ? { fill: col, stroke: LINE, 'stroke-width': 5, opacity: f(1 - u * u) } : { fill: col, opacity: f(0.85 * (1 - u * u)) });
  }
  o += S.circle(x, y, 120 * s * (1 - u), { fill: col, opacity: f(1 - u) });
  return o;
}
// rising gold sparkles around a point
function sparkleRing(x, y, t, k = 1, r = 200, n = 7) {
  if (k <= 0) return '';
  const pts = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + t * 1.5; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7 - ((t * 60 + i * 30) % 80), 26 * k]); }
  return K.sparkles(pts, t);
}

module.exports = {
  LINE, W, HH, tf, esc, TS, TFS, pop, camAt, toScr, shakeCam, clipTo, boing, whip, smash, zoomLines, streaks, tint, edgeDark,
  panel, panelTag, splitBg, hand, hunt, nameScreen, chatScreen, voiceScreen, buyScreen, playScreen, GRAN_ITEMS,
  LR, inView, room, seat, SIZE, plaza, PZ, sAt, ITEM_AT, itemsLayer, dressedNoob, shoutWaves, mark, loadoutCard, starD, poof, sparkleRing,
};
