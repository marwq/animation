// Private helpers for SC 05 (Tank) and SC 06 (levelling up): transitions (whip, smash, zoom lines, letterbox, streaks),
// set composers (cafeteria, street, living room) with screen-space HUD anchors, and the custom HUD bits of these two scenes:
// the game-style choice menu ("Run? Fight? Hide under the table?"), the boss-intro card, the deep-scan sweep, the memory
// bubble (Tank's dad works nights), the "THE RULE" tutorial card, the QUEST SPREE title, day stamps, split-screen panels,
// a stomach growl, Tank's creeping shadow, a cold desaturation wash.
'use strict';

const K = require('./kit');
const H = require('./hud');
const ST = require('./sets_town');
const SH = require('./sets_home');
const X = require('../rig/extras');
const CAST = require('../rig/cast');
const { S, f, clamp, lerp, ease, seg, hash, ol, ln, T, TF, view, actor } = K;

const LINE = '#151515';
const W = 1920, HH = 1080;
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const TS = (txt, x, y, size, fill, extra = {}) => T(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const TFS = (txt, x, y, size, fill, extra = {}) => TF(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const pop = (t, t0, d = 0.28) => ease.outBack(seg(t, t0, t0 + d));
const sc = (inner, x, y, k) => (k <= 0.001 ? '' : Math.abs(k - 1) < 1e-4 ? inner : S.g(inner, `translate(${f(x)} ${f(y)}) scale(${f(k)}) translate(${f(-x)} ${f(-y)})`));
const fade = (inner, op) => (op <= 0.003 ? '' : op >= 0.997 ? inner : S.g(inner, null, { opacity: f(op) }));
function shakeAll(cam, t, list) {
  const c = { ...cam };
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); c.sx = (c.sx || 0) + s.sx; c.sy = (c.sy || 0) + s.sy; }
  return c;
}
// squash/stretch impulse after t0 -> { sx, sy }
function boing(t, t0, amp = 0.25, dur = 0.7) {
  const k = t - t0;
  if (k < 0 || k > dur) return { sx: 1, sy: 1 };
  const v = amp * Math.exp(-k * 7) * Math.cos(k * 20);
  return { sx: 1 - v * 0.6, sy: 1 + v };
}
const camAt = ST.camAt;
const toScr = (cam, x, y, k = 1) => { const p = ST.toScreen(cam, x, y, k); return { x: p[0], y: p[1], z: p[2] }; };

// ---------------------------------------------------------------- transitions
function whip(t, tc, dir = 1, dur = 0.12) {
  const d = t - tc;
  if (Math.abs(d) > dur) return '';
  const k = 1 - Math.abs(d) / dur;
  let p = '';
  for (let i = 0; i < 16; i++) {
    const y = hash(i * 3.7) * HH, len = 300 + hash(i) * 700, th = 8 + hash(i * 2.2) * 16;
    const x = ((hash(i * 5.1) * 2600 + dir * d * 16000) % 2600 + 2600) % 2600 - 400;
    p += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.rect(0, 0, W, HH, 0, { fill: '#FFFFFF', opacity: f(0.55 * k) }) + S.path(p, { fill: '#FFFFFF', opacity: f(0.85 * k) });
}
const smash = (t, tc, dur = 0.14, a = 0.75) => (t >= tc && t < tc + dur ? K.C.whiteFlash(a * (1 - (t - tc) / dur)) : '');
const flashCol = (t, tc, dur, col, a = 0.6) => (t >= tc && t < tc + dur ? S.rect(0, 0, W, HH, 0, { fill: col, opacity: f(a * (1 - (t - tc) / dur)) }) : '');
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
  if (op <= 0) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const y = lerp(y0, y1, hash(i * 2.3 + seed)), len = 160 + hash(i * 5.7 + seed) * 380, th = 5 + hash(i * 1.1 + seed) * 9;
    const x = (((hash(i * 7.9 + seed) * 2600 + dir * t * speed * (0.6 + 0.8 * hash(i + seed))) % 2600) + 2600) % 2600 - 340;
    d += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(op) });
}
const letterbox = (k, h = 96) => (k > 0 ? S.rect(-10, -10, W + 20, 10 + h * k, 0, { fill: '#05070C' }) + S.rect(-10, HH - h * k, W + 20, h * k + 10, 0, { fill: '#05070C' }) : '');
// cheap desaturation / cold wash (two translucent full-frame rects)
const coldWash = (k) => (k > 0 ? S.rect(0, 0, W, HH, 0, { fill: '#8A96A6', opacity: f(0.26 * k) }) + S.rect(0, 0, W, HH, 0, { fill: '#0E1A2C', opacity: f(0.14 * k) }) : '');
const dim = (k, col = '#120C24') => (k > 0 ? S.rect(0, 0, W, HH, 0, { fill: col, opacity: f(k) }) : '');
// (was a soft dark ring of stacked translucent frames: ~30 ms per frame in this renderer — the scenes' look() vignette does it now)
function softEdge() { return ''; }

// ---------------------------------------------------------------- sets
const CF = ST.SPOTS.cafeteria;
// cafeteria: back = kids at the back table, table = the front-table kids (hero, Benji, Tank seated), lady = behind the counter,
// lane = Tank / the line kids (after the counter), over = world-space fx after the lane
function caf(t, cam, o = {}) {
  const set = { quiet: o.quiet || 0, crowd: o.crowd ?? 1, heroTray: o.heroTray, steam: o.steam, clock: o.clock, menu: o.menu };
  return ST.cafeteria.compose(t, set, [o.back || '', o.table || '', o.lady || ''], (o.lane || '') + (o.over || ''), cam);
}
// street (camera set): chars in world space between mid and fg
function street(t, cam, o = {}, chars = '', over = '') {
  const L = SH.street.layers(t, cam, { time: o.time || 'day', ball: o.ball, bags: o.bags, cars: o.cars, leaves: o.leaves });
  return L.bg + L.mid + (chars ? view(cam, chars) : '') + L.fg + (over ? view(cam, over) : '') + L.light;
}
// living room (room set): seated before front, standing after
function living(t, cam, o = {}, seated = '', standing = '', over = '') {
  const L = SH.livingRoom.layers(t, { time: o.time || 'day', fort: o.fort || 0, toys: o.toys, recline: o.recline, lamp: o.lamp });
  return view(cam, L.bg, 0.8) + view(cam, L.mid + seated + L.front + standing + (over || '') + L.light);
}
const LV = SH.SPOTS.livingRoom, STR = SH.SPOTS.street;

// ---------------------------------------------------------------- HUD helpers
// screen point over a cast member's head (world pose → cam) with a little air
function headAt(cam, key, pose, dy = 0) {
  const p = CAST.headTop(key, pose);
  return toScr(cam, p.x, p.y + dy);
}
// HUD scale for a plate seen through a zoom (grows slower than the world)
const hudS = (z, base = 0.9, g = 0.55) => base * Math.pow(z, g);
// the standing HUD chrome + the hero's XP bar (drawn last)
function hudFrame(t, o = {}) { return H.hudFrame({ t, clock: o.clock || '12:05 PM', day: o.day || 'MON', quest: o.quest, questSub: o.questSub, theme: o.theme, k: o.k ?? 1, dots: o.dots }); }

// game-style choice menu: items [{ label, chip, k }], sel = float index of the cursor; k pops it open
function choiceMenu(o = {}) {
  const { x = 1380, y = 300, s = 1, k = 1, t = 0, title = 'WHAT DO YOU DO?', items = [], sel = -1, theme = 'cyan', w = 520 } = o;
  if (k <= 0) return '';
  const th = H.theme(theme);
  const rowH = 96, hd = 70, Hd = hd + rowH * items.length + 26;
  const uf = H.unfold(seg(k, 0, 0.6));
  let c = H.panel(0, 0, w, Hd, th, { c: 20, br: 26 });
  const tw = H.richW(title, 19, 'F', 4) + 56;
  c += S.path(H.para(26, -20, tw, 36, 10), ol(th.rim, 3.5, th.edge)) + H.TF(title, 26 + tw / 2, 6, 19, th.edge, { 'letter-spacing': 4 });
  items.forEach((it, i) => {
    const ik = ease.outBack(seg(it.k ?? 1, 0, 1));
    if (ik <= 0) return;
    const ry = hd + i * rowH;
    const hi = clamp(1 - Math.abs(sel - i) * 1.6, 0, 1);
    let r = '';
    if (hi > 0) r += S.path(H.cham(18, ry - 8, w - 36, rowH - 14, 14), { fill: th.rim, opacity: f(0.22 * hi) }) + S.path(H.cham(18, ry - 8, w - 36, rowH - 14, 14), { fill: 'none', stroke: th.rim, 'stroke-width': 3, opacity: f(hi) });
    r += H.TL(it.label, 74, ry + 48, 46, hi > 0.5 ? '#FFFFFF' : th.text, { 'text-anchor': 'start', stroke: th.edge, 'stroke-width': 6, 'paint-order': 'stroke' });
    if (it.chip) {
      const cw = H.richW(it.chip, 25, 'F', 1) + 34;
      const cc = it.chipCol || '#FF3355';
      r += S.g(S.path(H.para(-cw, -19, cw, 38, 9), ol('#14020A', 3, th.edge)) + S.path(H.para(-cw + 2, -17, cw - 4, 34, 8), { fill: 'none', stroke: cc, 'stroke-width': 2 }) + H.TF(it.chip, -cw / 2, 9, 25, cc, { 'letter-spacing': 1 }), `translate(${f(w - 30)} ${f(ry + 32)}) scale(${f(ease.outBack(seg(it.ck ?? ik, 0, 1)))})`);
    }
    c += S.g(r, `translate(${f(-40 * (1 - ik))} 0)`, ik < 1 ? { opacity: f(clamp(ik, 0, 1)) } : {});
  });
  // the cursor (a gold chevron that slides between rows)
  if (sel >= 0) {
    const cy = hd + sel * rowH + 32 + Math.sin(t * 10) * 2;
    c += S.path(`M${f(34 + Math.sin(t * 9) * 4)} ${f(cy - 16)}l22 16l-22 16z`, ol('#FFD21F', 4, th.edge));
  }
  let g = S.g(c, `translate(${f(-w / 2)} ${f(-Hd / 2)})`);
  g = S.g(g, `scale(${f(uf.sx)} ${f(uf.sy)})`);
  if (uf.line > 0) g += S.path(`M${f(-w / 2 * uf.sx)} 0H${f(w / 2 * uf.sx)}`, ln(6, '#FFFFFF', uf.line));
  return S.g(g, tf(x, y + Hd / 2, s));
}

// the fighting-game boss intro: a red diagonal band slams across, giant name letters, title, LV hex, skulls (screen space)
function bossCard(o = {}) {
  const { k = 1, t = 0, name = 'TANK', sub = 'THE LUNCH TAKER', level = 80, out = 0 } = o;
  if (k <= 0 || out >= 1) return '';
  const band = ease.out(seg(k, 0, 0.3)), op = 1 - out;
  let g = '';
  // diagonal band
  const bx = lerp(-2400, 0, band);
  g += S.g(S.rect(-300, 610, 2600, 270, 0, { fill: '#14020A', opacity: 0.86 }) + S.rect(-300, 610, 2600, 16, 0, { fill: '#FF3355' }) + S.rect(-300, 864, 2600, 16, 0, { fill: '#FF3355' }) +
    S.rect(-300, 640, 2600, 6, 0, { fill: '#FF3355', opacity: 0.5 }) + S.rect(-300, 846, 2600, 6, 0, { fill: '#FF3355', opacity: 0.5 }), `rotate(-7 960 745) translate(${f(bx)} 0)`);
  // giant name letters drop in
  const TSZ = 230;
  let lx = 820 - H.richW(name, TSZ, 'L') / 2;
  [...name].forEach((ch, i) => {
    const li = seg(k, 0.18 + i * 0.05, 0.36 + i * 0.05), cw = H.richW(ch, TSZ, 'L');
    if (li > 0) g += S.g(H.TL(ch, 0, 0, TSZ, '#FFFFFF', { 'text-anchor': 'start', stroke: '#14020A', 'stroke-width': 18, 'paint-order': 'stroke' }), `rotate(-7 960 745) translate(${f(lx)} ${f(830 - 140 * (1 - ease.outBack(li)))}) scale(${f(lerp(1.6, 1, ease.out(li)))})`, { opacity: f(clamp(li * 3, 0, 1)) });
    lx += cw;
  });
  const sk = seg(k, 0.45, 0.7);
  if (sk > 0) {
    g += S.g(H.TF(sub, 0, 0, 40, '#FF9DAD', { 'letter-spacing': 10, stroke: '#14020A', 'stroke-width': 6, 'paint-order': 'stroke' }), `rotate(-7 960 745) translate(${f(820 + 60 * (1 - sk))} 905)`, { opacity: f(sk) });
    // LV hex + skulls
    const hk = ease.outBack(seg(k, 0.5, 0.75));
    let hx = S.path(H.hexD(0, 0, 92), ol('#C8102E', 9, '#14020A')) + S.path(H.hexD(0, 0, 76), { fill: 'none', stroke: '#FFC2CC', 'stroke-width': 4 });
    hx += H.TF('LV', 0, -30, 30, '#FFC2CC', { 'letter-spacing': 3 }) + H.TL(String(level), 0, 46, 86, '#FFFFFF', { stroke: '#14020A', 'stroke-width': 9, 'paint-order': 'stroke' });
    g += S.g(hx, `translate(1560 640) scale(${f(hk)}) rotate(${f(-7 + 30 * (1 - hk))})`);
  }
  // red flashes / impact rays
  if (k < 0.25) g += S.rect(0, 0, W, HH, 0, { fill: '#FF3355', opacity: f(0.35 * (1 - k / 0.25)) });
  return fade(g, op);
}

// cyan deep-scan sweep: a bright line crossing the frame top→bottom with a grid trail + "DEEP SCAN" label (u 0..1)
function scanSweep(u, label = 'DEEP SCAN...') {
  if (u <= 0 || u >= 1) return '';
  const y = lerp(-40, 1120, ease.inOut(u));
  let g = S.rect(0, y - 160, W, 160, 0, { fill: '#3BE8FF', opacity: 0.07 }) + S.rect(0, y - 60, W, 60, 0, { fill: '#3BE8FF', opacity: 0.08 });
  let d = '';
  for (let x = 0; x <= W; x += 80) d += `M${x} ${f(y - 160)}V${f(y)}`;
  g += S.path(d, ln(1.5, '#8FF6FF', 0.25)) + S.rect(0, y - 4, W, 8, 0, { fill: '#C6FBFF', opacity: 0.9 }) + S.rect(0, y - 1.5, W, 3, 0, { fill: '#FFFFFF' });
  g += H.TF(label, 60, y - 18, 24, '#C6FBFF', { 'text-anchor': 'start', 'letter-spacing': 6, stroke: '#020C16', 'stroke-width': 5, 'paint-order': 'stroke' });
  return g;
}

// a soft thought/memory bubble (cream cloud with a clipped inner picture). (x, y) = centre, inner drawn in a w×h box centred on 0,0
function bubble(x, y, w, h, k, inner, tail = [-1, 1]) {
  if (k <= 0) return '';
  const id = S.uid('s05b');
  const sk = ease.outBack(clamp(k, 0, 1));
  const rx = w / 2, ry = h / 2;
  let lobes = '';
  const n = 14;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; lobes += S.circle(Math.cos(a) * rx * 0.94, Math.sin(a) * ry * 0.92, Math.min(rx, ry) * 0.3, { fill: '#FFF8EC', stroke: LINE, 'stroke-width': 7 }); }
  let g = lobes + S.ellipse(0, 0, rx * 0.96, ry * 0.94, { fill: '#FFF8EC' });
  g += S.clipDef(id, S.ellipse(0, 0, rx * 0.88, ry * 0.84)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
  g += S.ellipse(0, 0, rx * 0.88, ry * 0.84, { fill: 'none', stroke: '#E6D6BE', 'stroke-width': 5 });
  // tail dots toward the thinker
  const [tx, ty] = tail;
  for (let i = 0; i < 3; i++) { const r = 26 - i * 7, d = 1.08 + i * 0.22; g += S.circle(tx * rx * d * 0.7, ty * ry * d, r, { fill: '#FFF8EC', stroke: LINE, 'stroke-width': 6 }); }
  return S.g(g, tf(x, y, sk));
}

// "THE RULE" tutorial card: lines [{ text, k, col, icon: 'heart'|'star' }]
function ruleCard(o = {}) {
  const { x = 1340, y = 300, s = 1, k = 1, t = 0, title = 'NEW RULE UNLOCKED', lines = [], out = 0 } = o;
  if (k <= 0 || out >= 1) return '';
  const th = H.theme('gold');
  const w = 760, hd = 92, rowH = 92, Hd = hd + rowH * lines.length + 20;
  const uf = H.unfold(seg(k, 0, 0.6));
  let c = H.panel(-w / 2, 0, w, Hd, th, { c: 22, br: 28 });
  c += H.sheen(-w / 2 + 8, 6, w - 16, Hd - 12, t, 3, 5);
  c += S.path(H.para(-170, -22, 340, 40, 12), ol('#FFC83A', 4, th.edge)) + H.TF(title, 0, 6, 21, th.edge, { 'letter-spacing': 5 });
  c += H.TL('THE RULE', 0, 70, 46, '#FFF1B8', { stroke: th.edge, 'stroke-width': 6, 'paint-order': 'stroke', 'letter-spacing': 4 });
  lines.forEach((l, i) => {
    const lk = seg(l.k ?? 1, 0, 1);
    if (lk <= 0) return;
    const ry = hd + 16 + i * rowH;
    let r = S.path(H.cham(-w / 2 + 24, ry, w - 48, rowH - 16, 12), { fill: '#000', opacity: 0.25 });
    const ic = l.icon === 'star' ? S.path(K.F.starPath ? K.F.starPath(0, 0, 24, 11, 5) : H.diamondD(0, 0, 22), ol('#FFC83A', 4, th.edge)) : S.path(H.heartD(0, 2, 21), ol('#FF5F7A', 4, th.edge));
    r += S.g(ic, `translate(${f(-w / 2 + 70)} ${f(ry + 38)}) scale(${f(1 + 0.25 * Math.sin(t * 6 + i) * (l.pulse || 0))})`);
    r += H.TL(l.text, -w / 2 + 112, ry + 56, 46, l.col || '#FFFFFF', { 'text-anchor': 'start', stroke: th.edge, 'stroke-width': 6, 'paint-order': 'stroke' });
    c += S.g(r, `translate(${f(60 * (1 - ease.out(lk)))} 0)`, { opacity: f(clamp(lk * 2, 0, 1)) });
  });
  let g = S.g(c, `translate(0 ${f(-Hd / 2)})`);
  g = S.g(g, `scale(${f(uf.sx)} ${f(uf.sy)})`);
  if (uf.line > 0) g += S.path(`M${f(-w / 2 * uf.sx)} 0H${f(w / 2 * uf.sx)}`, ln(6, '#FFFFFF', uf.line));
  return S.g(g, tf(x, y + Hd / 2 - 40 * ease.in(out), s), out > 0 ? { opacity: f(1 - out) } : {});
}

// a game-mode title slam: big gold letters on a purple ribbon with stars ("QUEST SPREE!")
function titleSlam(o = {}) {
  const { k = 1, t = 0, x = 960, y = 300, s = 1, text = 'QUEST SPREE!', sub = '', out = 0, col = '#FFD84A' } = o;
  if (k <= 0 || out >= 1) return '';
  let g = '';
  g += H.rays(0, 0, 18, 700, '#FFE88A', 0.22 * seg(k, 0, 0.3) * (1 - out), t * 30, 60);
  const rk = ease.out(seg(k, 0, 0.35));
  const rw = 1100 * rk;
  g += S.path(`M${f(-rw / 2)} -70 L${f(rw / 2)} -70 L${f(rw / 2 + 50)} 0 L${f(rw / 2)} 70 L${f(-rw / 2)} 70 L${f(-rw / 2 - 50)} 0 Z`, ol('#5B2BB5', 9));
  g += S.path(`M${f(-rw / 2 + 10)} -52 H${f(rw / 2 - 10)}`, ln(5, '#9B7BFF', 0.8));
  const TSZ = 150;
  let lx = -H.richW(text, TSZ, 'L') / 2;
  [...text].forEach((ch, i) => {
    const li = seg(k, 0.12 + i * 0.035, 0.34 + i * 0.035), cw = H.richW(ch, TSZ, 'L');
    if (li > 0 && ch !== ' ') g += S.g(H.TL(ch, 0, 0, TSZ, col, { 'text-anchor': 'start', stroke: LINE, 'stroke-width': 16, 'paint-order': 'stroke' }), `translate(${f(lx)} ${f(48 - 120 * (1 - ease.outBack(li)))}) rotate(${f(-8 * (1 - li))})`, { opacity: f(clamp(li * 3, 0, 1)) });
    lx += cw;
  });
  if (sub) g += S.g(TFS(sub, 0, 0, 40, '#FFFFFF'), `translate(0 ${f(126)})`, { opacity: f(seg(k, 0.6, 0.9)) });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + t * 1.5, r = 600 + 30 * Math.sin(t * 4 + i);
    g += S.path(H.diamondD(Math.cos(a) * r, Math.sin(a) * r * 0.25, 16, 20), { fill: '#FFF1B8', opacity: f(seg(k, 0.4, 0.8)) });
  }
  return S.g(g, tf(x, y - 60 * ease.in(out), s * (1 + 0.1 * out)), out > 0 ? { opacity: f(1 - out) } : {});
}

// a calendar day stamp ("MON", "DAY 3")
function dayStamp(o = {}) {
  const { k = 1, x = 220, y = 230, s = 1, day = 'MON', sub = '', rot = -6, col = '#FF5A5A' } = o;
  if (k <= 0) return '';
  const sk = k < 1 ? lerp(2.2, 1, ease.in(clamp(k * 1.4, 0, 1))) : 1;
  let g = S.rect(-120, -110, 240, 220, 20, ol('#FFFFFF', 7)) + S.rect(-120, -110, 240, 64, 20, { fill: col }) + S.rect(-120, -66, 240, 20, 0, { fill: col }) + S.path('M-120 -46 H120', ln(7));
  for (const rx of [-60, 60]) g += S.rect(rx - 10, -130, 20, 44, 8, ol('#DADDE6', 5));
  g += T(day, 0, 50, 92, '#2A1640') + (sub ? TF(sub, 0, 92, 24, '#7A6A90') : '') + TF('DAY', 0, -64, 28, '#FFFFFF', { 'letter-spacing': 4 });
  return S.g(g, tf(x, y, s * sk, rot), { opacity: f(clamp(k * 3, 0, 1)) });
}

// split-screen panel: inner drawn in a 1920×1080 world scaled into the box (x, y, w, h); k slides it in; border + label
function panelBox(x, y, w, h, k, inner, o = {}) {
  if (k <= 0) return '';
  const id = S.uid('s05p');
  const u = ease.outBack(clamp(k, 0, 1));
  const sx = w / W, sy = h / HH, s_ = Math.max(sx, sy);
  const dx = (o.dir || 1) * (1 - ease.out(clamp(k, 0, 1))) * 260;
  let g = S.clipDef(id, S.rect(x, y, w, h, 18)) + S.g(S.g(inner, `translate(${f(x + w / 2 - W * s_ / 2)} ${f(y + h / 2 - HH * s_ / 2)}) scale(${f(s_)})`), null, { 'clip-path': `url(#${id})` });
  g += S.rect(x, y, w, h, 18, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 14 }) + S.rect(x, y, w, h, 18, { fill: 'none', stroke: LINE, 'stroke-width': 5 });
  if (o.label) g += S.g(S.rect(-14, -26, H.richW(o.label, 30, 'L') + 28, 50, 12, ol(o.labelCol || '#FFD21F', 5)) + H.TL(o.label, 0, 11, 30, '#2A1640', { 'text-anchor': 'start' }), tf(x + 24, y + 30));
  return S.g(g, `translate(${f(dx)} 0) translate(${f(x + w / 2)} ${f(y + h / 2)}) scale(${f(0.6 + 0.4 * u)}) translate(${f(-x - w / 2)} ${f(-y - h / 2)})`, k < 0.25 ? { opacity: f(k / 0.25) } : {});
}

// stomach growl: wobbly arcs + "grrr" around a belly point (screen or world), k 0..1 strength
function growl(x, y, t, k, s = 1) {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < 3; i++) {
    const r = 46 + i * 22 + 6 * Math.sin(t * 30 + i), a0 = -0.5, a1 = 0.5;
    for (const side of [-1, 1]) d += `M${f(x + side * r * Math.cos(a0) * s)} ${f(y + r * Math.sin(a0) * s)} Q${f(x + side * (r + 10) * s)} ${f(y)} ${f(x + side * r * Math.cos(a1) * s)} ${f(y + r * Math.sin(a1) * s)} `;
  }
  return S.path(d, ln(6 * s, '#FFFFFF', 0.85 * k)) + S.path(d, ln(2.5 * s, LINE, 0.5 * k)) +
    S.g(TFS('grrr', 0, 0, 34, '#FFD84A'), tf(x + 120 * s + 4 * Math.sin(t * 40), y - 60 * s, s * (0.8 + 0.3 * k), -10), { opacity: f(k) });
}

// Tank's shadow creeping over the hero (screen space): a big dark rounded silhouette from the right, k 0..1
function bigShadow(k, x0 = 2300, x1 = 1250) {
  if (k <= 0) return '';
  const x = lerp(x0, x1, ease.out(k));
  const sil = `M${f(x - 330)} 1180 L${f(x - 330)} 470 Q${f(x - 330)} 380 ${f(x - 250)} 380 L${f(x - 150)} 380 L${f(x - 150)} 160 Q${f(x - 150)} 40 ${f(x)} 40 Q${f(x + 150)} 40 ${f(x + 150)} 160 L${f(x + 150)} 380 L${f(x + 250)} 380 Q${f(x + 330)} 380 ${f(x + 330)} 470 L${f(x + 330)} 1180 Z`;
  return S.path(sil, { fill: '#0C0618', opacity: f(0.32 * clamp(k * 2, 0, 1)) });
}

// a red/gold "stamp" text (e.g. NEW RECORD)
function stamp(o = {}) {
  const { k = 1, x = 960, y = 540, text = 'STAMP', sub = '', col = '#FF3355', size = 90, rot = -8, s = 1 } = o;
  if (k <= 0) return '';
  const sk = lerp(2.4, 1, ease.in(clamp(k * 1.5, 0, 1)));
  const w = H.richW(text, size, 'L') + 70;
  let g = S.rect(-w / 2, -size * 0.75, w, size * 1.3 + (sub ? size * 0.45 : 0), 16, { fill: '#FFFFFF', opacity: 0.85, stroke: col, 'stroke-width': 9 }) + S.rect(-w / 2 + 12, -size * 0.75 + 12, w - 24, size * 1.3 - 24 + (sub ? size * 0.45 : 0), 10, { fill: 'none', stroke: col, 'stroke-width': 4 });
  g += H.TL(text, 0, size * 0.34, size, col);
  if (sub) g += H.TF(sub, 0, size * 0.34 + size * 0.5, size * 0.32, col, { 'letter-spacing': 3 });
  return S.g(g, tf(x, y, s * sk, rot), { opacity: f(clamp(k * 3, 0, 1)) });
}
// "zip your lips" — a zipper glyph across a mouth (screen)
function zipper(x, y, w, k, s = 1) {
  if (k <= 0) return '';
  const n = Math.max(1, Math.round(9 * clamp(k, 0, 1)));
  let d = '';
  for (let i = 0; i < n; i++) { const xx = -w / 2 + (i / 8) * w; d += `M${f(xx)} -9 V9 `; }
  const px = -w / 2 + clamp(k, 0, 1) * w;
  return S.g(S.path(`M${f(-w / 2)} 0 H${f(px)}`, ln(14, LINE)) + S.path(d, ln(5, '#D8DEE8')) + S.rect(px - 14, -22, 28, 44, 6, ol('#FFD21F', 5)) + S.rect(px - 6, 18, 12, 26, 5, ol('#FFD21F', 4)), tf(x, y, s));
}

module.exports = {
  LINE, W, HH, tf, TS, TFS, pop, sc, fade, shakeAll, boing, camAt, toScr,
  whip, smash, flashCol, zoomLines, streaks, letterbox, coldWash, dim, softEdge,
  CF, caf, street, living, LV, STR, headAt, hudS, hudFrame,
  choiceMenu, bossCard, scanSweep, bubble, ruleCard, titleSlam, dayStamp, panelBox, growl, bigShadow, stamp, zipper,
};
