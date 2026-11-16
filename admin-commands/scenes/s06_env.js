// Private helpers shared by SC 01 (the cold open = a flash-forward to the end of SC 06) and SC 06 (the city in chaos).
// - camOn / scr / whip / flash / punch: camera + transition helpers
// - chaosWide(t, cam, o): the wide city with all the chaos (Pancake licking his paw on the tower, Brick's cage on the crane,
//   Granny's fire loop, Dad drifting past the moon, giant cats on the roofs / in the stadium, the blimp, pop-ups, crack + sky chat)
// - floatShot(t, o): THE matching shot of both scenes: YOU floating high above the night city with the laptop, typing
//   (chat bars typed on his words → spinner → PERMISSION DENIED stamps), the sky cracking behind him
// - lickCat / pushPaw / swatCat: giant cats with personality; heroLap: the hero holding the glowing laptop
// - grannyRun: Granny breaking the sound barrier (SC 01 list + SC 06 news footage)
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, actor } = K;
const C = K.C;
const CS = require('./city');
const SETS = require('./sets');
const CATS = require('../rig/cats');
const CAST = require('../rig/cast');
const AC = require('./acting');
const { CITY, KF } = CS;

const W = 1920, H = 1080, LINE = '#151515';
const pop = (k) => ease.outBack(clamp(k, 0, 1));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const outT = (txt, x, y, size, fill, sw = 10, extra = {}) => T(esc(txt), x, y, size, fill, { stroke: LINE, 'stroke-width': sw, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const outTF = (txt, x, y, size, fill, sw = 8, extra = {}) => TF(esc(txt), x, y, size, fill, { stroke: LINE, 'stroke-width': sw, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });

// ---------------------------------------------------------------- camera + transitions
// camera that puts layer-k point (ax, ay) at screen (sx, sy) with that layer magnified zk
function camOn(ax, ay, k, zk, sx = 960, sy = 540) {
  return { zoom: 1 + (zk - 1) / k, x: (ax - 960 - (sx - 960) / zk) / k, y: (ay - 540 - (sy - 540) / zk) / k };
}
const scr = (cam, a) => CS.toScreen(cam, a);
const withShake = (cam, t, hits) => {
  let sx = 0, sy = 0;
  for (const [t0, dur, amp] of hits) { const s = K.shake(t, t0, dur, amp); sx += s.sx; sy += s.sy; }
  return sx || sy ? { ...cam, sx: (cam.sx || 0) + sx, sy: (cam.sy || 0) + sy } : cam;
};
// whip-pan: white streaks + flash for a few frames after a cut
function whip(t, t0, dir = 1, dur = 0.16) {
  if (t < t0 || t > t0 + dur) return '';
  const u = (t - t0) / dur, k = 1 - u;
  let o = S.rect(0, 0, W, H, 0, { fill: '#FFFFFF', opacity: f(0.7 * k) });
  let d = '';
  for (let i = 0; i < 16; i++) {
    const y = hash(i * 3.1) * H, x = hash(i * 7.7) * W - dir * u * 900, w = 500 + hash(i * 1.3) * 700, h = 8 + hash(i * 2.9) * 22;
    d += `M${f(x - w / 2)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
  }
  return o + S.path(d, { fill: '#FFFFFF', opacity: f(0.85 * k) });
}
const flash = (t, t0, dur = 0.16, a = 0.9, col = '#FFFFFF') => (t >= t0 && t < t0 + dur ? S.rect(0, 0, W, H, 0, { fill: col, opacity: f(a * (1 - (t - t0) / dur)) }) : '');
// punch-in: the zoom jumps up on a hit and stays (smash zoom)
const punch = (t, t0, amt = 0.2, dur = 0.09) => 1 + amt * ease.out(seg(t, t0, t0 + dur));
// zoom applied around the screen centre to a screen-space svg
const zoomAt = (svg, z, cx = 960, cy = 540) => (Math.abs(z - 1) < 1e-4 ? svg : S.g(svg, `translate(${f(cx)} ${f(cy)}) scale(${f(z)}) translate(${f(-cx)} ${f(-cy)})`));
const tilt = (svg, deg, cx = 960, cy = 540) => (Math.abs(deg) < 0.01 ? svg : S.g(svg, `rotate(${f(deg)} ${f(cx)} ${f(cy)})`));
const letterbox = (k) => (k > 0 ? S.rect(0, 0, W, 70 * k, 0, { fill: '#000' }) + S.rect(0, H - 70 * k, W, 70 * k, 0, { fill: '#000' }) : '');

// ---------------------------------------------------------------- cats with personality
const COAT = CATS.COATS;
const catLw = (s) => 9 / Math.pow(Math.max(0.05, s), 0.35);
const capsule = (x1, y1, x2, y2, w, col, lw) => S.path(`M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`, ln(w + 2 * lw, LINE)) + S.path(`M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`, ln(w, col));
function pawBlob(x, y, rx, ry, col, lw, rot = 0, beansCol = null) {
  let o = S.ellipse(x, y, rx, ry, { fill: col, stroke: LINE, 'stroke-width': f(lw) });
  if (beansCol) o += S.ellipse(x, y + ry * 0.2, rx * 0.4, ry * 0.32, { fill: beansCol }) + [-0.5, -0.17, 0.17, 0.5].map((dx) => S.ellipse(x + dx * rx, y - ry * 0.5 + Math.abs(dx) * ry * 0.3, rx * 0.15, ry * 0.18, { fill: beansCol })).join('');
  else o += S.path(`M${f(x - rx * 0.3)} ${f(y + ry * 0.1)}L${f(x - rx * 0.3)} ${f(y + ry * 0.75)}M${f(x + rx * 0.3)} ${f(y + ry * 0.1)}L${f(x + rx * 0.3)} ${f(y + ry * 0.75)}`, ln(lw * 0.6));
  return rot ? S.g(o, `rotate(${f(rot)} ${f(x)} ${f(y)})`) : o;
}
// Pancake (or any coat) sitting and licking his raised paw, eyes closed, very pleased with himself. (x, y) = ground, s = cat scale.
// o: { coat ('orange' = Pancake), rate (licks / s), look (eyes open between licks), mood }
function lickCat(x, y, s, t, o = {}) {
  const coat = o.coat || 'orange', c = COAT[coat];
  const rate = o.rate ?? 1.6, lw = catLw(s), sc = s * 0.68;
  const ph = (t * rate + (o.ph || 0)) % 1, lick = Math.max(0, Math.sin(ph * Math.PI * 2));
  const rot = (-6 + 3 * lick) * (o.tiltK ?? 1);
  const draw = coat === 'orange' ? CATS.pancake : CATS.cat;
  let out = draw({ x, y, s, t, rot, pose: 'sit', mood: o.mood || 'happy', mouth: lick > 0.15 ? 'open' : 'w', coat, seed: o.seed, shadow: o.shadow });
  // the licking paw (cat units, over the mouth) + the tongue; head origin ≈ (0, -222), mouth ≈ y -190..-160
  const px = 34 - 8 * lick, py = -150 - 16 * lick;
  let p = '';
  if (lick > 0.2) { const d = `M2 -152 Q${f(10 + 8 * lick)} ${f(-160 - 12 * lick)} ${f(px - 14)} ${f(py)}`; p += S.path(d, ln(18 * lick + 4, '#FF8FA8')) + S.path(d, ln(lw * 0.5, '#C9506E', 0.7)); }
  p += capsule(84, -70, px + 12, py + 16, 44, c.base, lw) + pawBlob(px, py, 34, 28, c.paw === c.cream ? c.cream : c.paw, lw, -30, null);
  return out + S.g(p, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(sc)})`);
}
// a giant cat reaching one paw out to (tx, ty) (screen / layer coords) — pushing the water tower off its roof
// reach 0..1 = how far the paw is extended toward the target; o: { coat, seed, mood, look, flip }
function pushCat(x, y, s, t, tx, ty, reach, o = {}) {
  const coat = o.coat || 'grey', c = COAT[coat], lw = catLw(s), sc = s * 0.68, fx = o.flip ? -1 : 1;
  let out = CATS.cat({ x, y, s, t, pose: 'sit', mood: o.mood || 'smug', coat, seed: o.seed ?? 3, look: o.look, blink: o.blink, mouth: o.mouth, flip: o.flip });
  const ux = ((tx - x) / sc) * fx, uy = (ty - y) / sc;   // target in cat units
  const sx0 = 92, sy0 = -96, r = ease.inOut(clamp(reach, 0, 1));
  const ex = lerp(sx0 + 24, ux, r), ey = lerp(sy0 + 40, uy, r);
  if (reach < 0.04) return out;
  const arm = capsule(sx0, sy0, ex, ey, 44, c.base, lw) + pawBlob(ex, ey, 32, 26, c.paw === c.cream ? c.cream : c.paw, lw, -80);
  return out + S.g(arm, `translate(${f(x)} ${f(y)}) scale(${f(fx * sc)} ${f(sc)})`);
}

// ---------------------------------------------------------------- the hero with the glowing laptop
// o: { x, y, s, typing 0..1, screen (adminScreen opts), face, energy, lift, armsUp 0..1 (shaking the laptop at the sky),
//      turn, rot, legs ('dangle' | 'stand'), bob }
function heroLap(t, o = {}) {
  const typ = o.typing ?? 1, up = clamp(o.armsUp || 0, 0, 1);
  const jl = typ * (Math.sin(t * 27) * 5 + Math.sin(t * 13) * 3), jr = typ * (Math.sin(t * 24 + 1.3) * 5 + Math.sin(t * 11) * 3);
  const scr0 = SETS.adminScreen(t, o.screen || {});
  const dangle = o.legs !== 'stand';
  const sw = Math.sin(t * 1.7 + 0.4);
  // armsUp: the right arm lifts the laptop beside his head toward the sky, the left fist shakes
  const armR = lerp(22 + jr, 166, ease.inOut(up)), armL = lerp(22 + jl, 128 + 22 * Math.sin(t * 15), ease.inOut(up));
  let lap;
  if (up < 0.5) lap = { svg: SETS.laptop(0, -300 - 80 * up, 0.42, scr0, { t, glow: o.glow ?? 0.8, dust: 0 }), layer: 'front' };
  else {
    const a = (armR * Math.PI) / 180, hx = 100 + 252 * Math.sin(a), hy = -515 + 252 * Math.cos(a);
    lap = { svg: SETS.laptop(hx + 120, hy + 70 + 8 * Math.sin(t * 15), 0.42, scr0, { t, glow: o.glow ?? 0.8, dust: 0, rot: -10 + 4 * Math.sin(t * 15) }), layer: 'top' };
  }
  const pose = {
    x: o.x, y: o.y + (o.bob ?? 1) * Math.sin(t * 2.1) * 10, s: o.s, lift: o.lift || 0, turn: o.turn || 0, rot: o.rot || 0, armL, armR,
    ...(dangle ? { legL: 6 + 5 * sw, kneeL: 26 + 8 * sw, legR: -10 - 5 * sw, kneeR: 38 - 8 * sw } : {}),
    shadow: false, props: [lap], volume: o.volume, headRot: o.headRot,
  };
  if (o.face) pose.face = o.face;
  return actor('you', t, pose, { arms: false, energy: o.energy ?? 0.9 });
}

// ---------------------------------------------------------------- chat → spinner → denied, as one stack near the hero
// cmds: [{ text, prog, enter, spin (0..1 waiting), denied (0..1 pop), deniedText }], laid out upward from (x, y)
function cmdStack(t, x, y, cmds, s = 1) {
  let o = '';
  cmds.forEach((c, i) => {
    const yy = y - (cmds.length - 1 - i) * 112 * s;
    o += K.chatCommand(x, yy, c.text, c.prog, { t, enter: c.enter || 0, s, user: 'you' });
    const w = Math.max(360, 70 + 6 * 15 + c.text.length * 16.5 + 60) * s;
    if (c.spin > 0 && !(c.denied > 0.6)) o += S.circle(x + w / 2 + 52 * s, yy - 2 * s, 34 * s, { fill: '#141824', stroke: LINE, 'stroke-width': 5 }) + K.loadingWheel(x + w / 2 + 52 * s, yy - 2 * s, 20 * s, t, '#FFFFFF', 8, 5 * s, 2.2);
    if (c.denied > 0) o += K.denied(x + 18 * s, yy + 4 * s, c.denied, 0.82 * s, c.deniedText || 'PERMISSION DENIED');
  });
  return o;
}
// red frame flash + scanline glitch when a denial hits
function redHit(t, t0, dur = 0.35) {
  if (t < t0 || t > t0 + dur) return '';
  const k = 1 - (t - t0) / dur;
  return S.rect(0, 0, W, H, 0, { fill: '#FF2A3C', opacity: f(0.28 * k) }) + S.rect(14, 14, W - 28, H - 28, 30, { fill: 'none', stroke: '#FF3B4E', 'stroke-width': 28, opacity: f(0.8 * k) });
}
// the "ADMIN RIGHTS UNDER REVIEW" system window (amber, with a slow spinner)
function reviewWin(x, y, k, t, s = 1) {
  const sc = pop(k) * s;
  if (sc < 0.01) return '';
  let o = S.rect(-430 + 12, -150 + 16, 860, 300, 30, { fill: '#000', opacity: 0.3 });
  o += S.rect(-430, -150, 860, 300, 30, ol('#2A1C08', 8)) + S.rect(-430, -150, 860, 74, 30, { fill: '#FFB13B' }) + S.rect(-430, -110, 860, 34, 0, { fill: '#FFB13B' }) + S.path('M-430 -76H430', ln(6));
  o += TF('SYSTEM', -400, -100, 34, '#2A1C08', { 'text-anchor': 'start', 'letter-spacing': 3 });
  o += S.circle(390, -114, 15, ol('#FF5A5A', 4));
  o += K.loadingWheel(-310, 34, 46, t, '#FFB13B', 10, 10, 1.1);
  o += T('ADMIN RIGHTS', 70, 10, 66, '#FFB13B') + T('UNDER REVIEW', 70, 86, 66, '#FFFFFF');
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(sc)})`);
}

// ---------------------------------------------------------------- the floating-over-the-night-city shot (SC 01 ≡ end of SC 06)
// o: { cam, time (1), popups, crack, crackAt, admin, flying, hero {x, y, s, ...heroLap opts}, cmds (cmdStack list),
//      stack {x, y, s}, over (extra screen svg), heroK (parallax of the hero, default 1) }
function floatShot(t, o = {}) {
  const cam = o.cam || { zoom: 1, x: 0, y: 0 };
  const X = o.cats === false ? { onMid: '', inStadium: '' } : midExtras(t, o);
  const Lr = CS.rooftop(t, cam, { time: o.time ?? 1, popups: o.popups ?? 1, flying: o.flying ?? 1, crack: o.crack || 0, crackAt: o.crackAt, admin: o.admin || 0, onSky: o.onSky || '', onMid: X.onMid, inStadium: X.inStadium, waterFall: o.waterFall ?? 1, blimp: o.blimp });
  let out = Lr.bg + (o.behind || '') + Lr.fg;
  if (o.dim) out += S.rect(0, 0, W, H, 0, { fill: '#0C0A2A', opacity: f(o.dim) });
  if (o.hero) out += K.view(cam, heroLap(t, o.hero), o.heroK ?? 1);
  out += Lr.light;
  if (o.cmds && o.cmds.length) out += cmdStack(t, o.stack.x, o.stack.y, o.cmds, o.stack.s || 1);
  return out + (o.over || '');
}

// ---------------------------------------------------------------- Granny breaking the sound barrier (side view, running on air)
// (x, y) = Granny's feet; dir -1 = runs to screen-left (default), trail behind her; boom 0..1 (sonic cone + shock ring)
function grannyRun(t, x, y, s, o = {}) {
  const dir = o.dir ?? -1, ph = t * 22;
  const rn = AC.run(ph, 1.15);
  let g = CAST.fireTrail({ x: x - dir * 60 * s / 0.4, y: y - 200 * s / 0.4, len: (o.len || 900) * s / 0.4, angle: dir < 0 ? 0 : 180, w: 120 * s / 0.4, t });
  g += actor('granny', t, { x, y, s, fast: true, view: 'side', flip: dir > 0, ...rn, lift: rn.lift, lean: -16, face: o.face || 'excited', shadow: false, armL: 60 + rn.armL * 0.4, armR: -50 + rn.armR * 0.4 }, { arms: false });
  const b = o.boom || 0;
  if (b > 0 && b < 1) {
    const k = s / 0.4, hx = x + dir * 90 * k, hy = y - 300 * k, u = ease.out(b);
    let d = '';
    for (let i = 0; i < 3; i++) { const r = (90 + 260 * u + i * 70) * k, a = (0.5 + 0.2 * i) * r; d += `M${f(hx - dir * i * 40 * k)} ${f(hy - r)}Q${f(hx + dir * a)} ${f(hy)} ${f(hx - dir * i * 40 * k)} ${f(hy + r)}`; }
    g += S.path(d, ln((16 * (1 - b) + 4) * k, '#FFFFFF', 0.9 * (1 - b)));
    g += S.ellipse(hx + dir * 20 * k, hy, (40 + 60 * u) * k, (120 + 220 * u) * k, { fill: '#E8F6FF', opacity: f(0.45 * (1 - b)) });
  }
  return g;
}

// ---------------------------------------------------------------- Brick in the cage (hanging; (x, y) = the hook point)
function hangingCage(t, x, y, s, o = {}) {
  const sw = o.swing ?? Math.sin(t * 0.9) * 4, spin = o.spin ?? 0;
  const ch = 70 * s / 0.5;                       // chain length
  const cy = y + ch + 720 * s;                   // cage bottom
  let o2 = S.path(`M${f(x)} ${f(y)}V${f(y + ch + 20 * s)}`, { ...ln(9 * s / 0.5 + 3, '#9AA0AE'), 'stroke-dasharray': `${f(14 * s / 0.5)} ${f(6 * s / 0.5)}` }) + S.path(`M${f(x)} ${f(y)}V${f(y + ch + 20 * s)}`, ln(2, LINE, 0.5));
  let cage = SETS.cage(x, cy, s, t, { part: 'back', glow: o.glow ?? 1 });
  const bs = s * 0.45, look = o.brickPose || {};
  cage += actor('brick', t, { x: x - 10 * s, y: cy - 30 * s, s: bs, turn: 0.15 * Math.sin(t * 0.8), armL: 150, armR: 150, legL: 6, legR: -6, shadow: false, face: o.face || { name: 'angry', fx: ['anger'] }, ...look, volume: o.volume }, { arms: false });
  cage += SETS.cage(x, cy, s, t, { part: 'front', glow: o.glow ?? 1, plate: 'JAILED' });
  o2 += spin ? S.g(cage, `translate(${f(x)} 0) scale(${f(Math.cos(spin))} 1) translate(${f(-x)} 0)`) : cage;
  return S.g(o2, `rotate(${f(sw)} ${f(x)} ${f(y)})`);
}

// ---------------------------------------------------------------- tiny Dad drifting past the moon (for wides; k = KF.sun)
function dadAtMoon(t, s = 0.075, o = {}) {
  const M = CITY.moon, u = ((t * 0.035) + (o.ph || 0.15)) % 1;
  const x = lerp(M.x - 260, M.x + 260, u), y = M.y + 40 - Math.sin(u * Math.PI) * 50;
  return actor('dad', t, { x, y, s, rot: t * 25, armL: 110, armR: 150, legL: 25, legR: -30, kneeL: 30, kneeR: 50, face: 'scared', shadow: false, volume: false }, { arms: false });
}
// Granny's fire loop round the skyline in the wides (drawn at parallax k .3, behind the mid towers)
function grannyLoop(t, o = {}) {
  const cx = o.cx ?? 960, cy = o.cy ?? 300, rx = o.rx ?? 1050, ry = o.ry ?? 150, sp = o.speed ?? 0.55;
  const a = t * sp + (o.ph || 0);
  const at = (q) => [cx + Math.cos(q) * rx, cy + Math.sin(q) * ry];
  const pts = [];
  for (let i = 0; i <= 10; i++) pts.push(at(a - i * 0.14));
  let g = CAST.fireTrail({ pts, w: 34, t });
  const [gx, gy] = at(a), dirx = -Math.sin(a);
  g += actor('granny', t, { x: gx, y: gy + 40, s: 0.085, fast: true, view: 'side', flip: dirx > 0, ...AC.run(t * 22, 1), lean: -16, face: 'excited', shadow: false, volume: false }, { arms: false });
  return g;
}

// ---------------------------------------------------------------- the wide chaos city
// the giant cats + Brick's cage that live on the MID layer (k .4) and in the stadium; shared by city() and rooftop() shots
// o: { grow 0..1, growEach(i) → 0..1, pancake (true), cage (true), hookT (crane sway time) }
function midExtras(t, o = {}) {
  const g = o.grow ?? 1;
  const gs = (base, i = 0) => base * clamp(o.growEach ? o.growEach(i) : g, 0, 1);
  const T0 = CITY.tower, h = CS.craneHook(t, { hookLen: 330, hookSwing: 3 });
  let onMid = '';
  if (o.pancake !== false && gs(1, 0) > 0.02) onMid += lickCat(T0.x, T0.y + 4, gs(1.05, 0), t, { rate: 1.3 });
  if (o.cage !== false) onMid += hangingCage(t, h.x, h.y - 8, 0.105, { swing: h.rot, volume: false });
  if (o.calico !== false && gs(1, 1) > 0.02) onMid += CATS.cat({ x: 1290, y: 470, s: gs(0.55, 1), t, pose: 'lie', coat: 'calico', seed: 2 });
  if (gs(1, 2) > 0.02) onMid += CATS.cat({ x: 1110, y: 582, s: gs(0.42, 2), t, pose: 'loaf', keyboard: false, coat: 'siamese', seed: 5, mood: 'smug' });
  const inStadium = gs(1, 3) > 0.02 ? CATS.cat({ x: CITY.stadium.x, y: CITY.stadium.y + 28, s: gs(0.95, 3), t, pose: 'sleep', coat: 'black', seed: 1 }) : '';
  return { onMid: onMid + (o.extraMid || ''), inStadium };
}
// o: { time, flying, popups, crack, crackAt, admin, blimp, waterTip, waterFall, grow 0..1 (giant cats), growEach, cage, granny,
//      dad, pancake, hero ({x, y, s, ...heroLap opts}; heroK parallax, default 1), skyChat ({text, progress, emerge, w, h, dy, size}),
//      onSky, flyNear, extraMid (mid-layer svg), front (k 1 svg), loop (grannyLoop opts) }
function chaosWide(t, cam, o = {}) {
  const g = o.grow ?? 1;
  const gs = (base, i = 0) => base * clamp(o.growEach ? o.growEach(i) : g, 0, 1);
  const X = midExtras(t, o);
  const R5 = CITY.roofs[5], R7 = CITY.roofs[7], R1 = CITY.roofs[1];
  let onNear = '';
  if (gs(1, 4) > 0.02) onNear += CATS.cat({ x: R5.x0 + 70, y: R5.y + 2, s: gs(0.5, 4), t, pose: 'lie', coat: 'white', seed: 4 });
  if (gs(1, 5) > 0.02) onNear += CATS.cat({ x: R7.x1 - 60, y: R7.y + 2, s: gs(0.48, 5), t, pose: 'sit', coat: 'tabby', seed: 6, mood: 'happy' });
  if (gs(1, 6) > 0.02) onNear += CATS.cat({ x: R1.x0 + 90, y: R1.y + 2, s: gs(0.5, 6), t, pose: 'sit', coat: 'grey', seed: 8, mood: 'lazy' });
  onNear += o.extraNear || '';
  const L = CS.city(t, cam, {
    time: o.time ?? 1, flying: o.flying ?? 1, popups: o.popups ?? 1, crack: o.crack || 0, crackAt: o.crackAt, admin: o.admin || 0,
    blimp: o.blimp ?? true, waterFall: o.waterFall || 0, waterTip: o.waterTip || 0, flyNear: o.flyNear ?? true, inStadium: X.inStadium, onSky: o.onSky || '',
  });
  let out = L.bg;
  if (o.dad !== false) out += K.view(cam, dadAtMoon(t), KF.sun);
  if (o.granny !== false) out += K.view(cam, grannyLoop(t, o.loop || {}), 0.3);
  out += L.mid + K.view(cam, X.onMid, KF.mid) + K.view(cam, onNear, KF.near) + L.fg;
  if (o.hero) out += K.view(cam, heroLap(t, { typing: 0.6, ...o.hero }), o.heroK ?? 1);
  if (o.heroSvg) out += K.view(cam, o.heroSvg, o.heroK ?? 1);
  out += (o.front ? K.view(cam, o.front, 1) : '') + L.light;
  if (o.skyChat) {
    const sc = o.skyChat, A = { ...CITY.crack, ...(o.crackAt || {}) }, e = sc.emerge ?? 1;
    out += K.view(cam, CS.skyChat(A.x, A.y + (sc.dy ?? 330) * ease.out(e), sc.w || 980, sc.h || 300, t, { text: sc.text, progress: sc.progress ?? 1, glow: 1, k: 1, s: lerp(0.08, 1, ease.outBack(e)), size: sc.size }), KF.crack);
  }
  return out;
}

// the Admin as a dark silhouette in the light behind the crack (SC 01 only allows a glimpse): draw with onSky (k .04)
function silhouette(x, y, s, k, t, flare = 0) {
  if (k <= 0.01) return '';
  const e = 0.7 + 0.3 * Math.sin(t * 5) + 0.6 * flare;
  let o = S.path('M-150 420 L-110 40 Q-100 -20 -60 -40 L60 -40 Q100 -20 110 40 L150 420 Z', { fill: '#221A36' }) + S.rect(-62, -170, 124, 140, 26, { fill: '#221A36' });
  o += S.path('M-70 -170 L-80 -230 L-40 -195 L0 -250 L40 -195 L80 -230 L70 -170 Z', { fill: '#221A36' }) + S.path('M-70 -172 L70 -172', ln(8, '#FFD24F', 0.7));
  if (flare > 0) o += S.ellipse(0, -110, 90 * (1 + flare), 30 * (1 + flare), { fill: '#FFE9A0', opacity: f(0.35 * flare) });
  o += S.ellipse(-26, -110, 17, 9, { fill: '#FFD24F', opacity: f(clamp(e, 0, 1)) }) + S.ellipse(26, -110, 17, 9, { fill: '#FFD24F', opacity: f(clamp(e, 0, 1)) });
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`, { opacity: f(0.92 * k) });
}

// ---------------------------------------------------------------- news-footage overlays (SC 06 cutaways; also usable in SC 01)
function liveBug(t, label = 'LIVE') {
  const on = Math.floor(t * 2) % 2 === 0;
  return S.g(S.rect(0, 0, 170, 58, 10, { fill: '#E8243C' }) + S.circle(34, 29, 11, { fill: '#FFFFFF', opacity: on ? 1 : 0.35 }) + T(label, 104, 45, 38, '#FFFFFF'), 'translate(70 64)') +
    S.g(S.rect(0, 0, 220, 58, 10, { fill: '#10162A', opacity: 0.85 }) + T('NEWS 7', 110, 44, 38, '#FFFFFF'), 'translate(1630 64)');
}
function lowerThird(title, sub, k = 1, y = 760) {
  if (k <= 0) return '';
  const x = lerp(-1300, 0, ease.out(clamp(k, 0, 1)));
  let o = S.rect(60, y, 1060, 92, 6, { fill: '#E8243C' }) + T(esc(title), 90, y + 68, 60, '#FFFFFF', { 'text-anchor': 'start' });
  o += S.rect(60, y + 92, 1060, 62, 6, { fill: '#10162A', opacity: 0.94 }) + TF(esc(sub), 90, y + 137, 38, '#FFE14D', { 'text-anchor': 'start' });
  return S.g(o, `translate(${f(x)} 0)`);
}

module.exports = {
  W, H, LINE, pop, esc, outT, outTF, camOn, scr, withShake, whip, flash, punch, zoomAt, tilt, letterbox,
  lickCat, pushCat, capsule, pawBlob, catLw, heroLap, cmdStack, redHit, reviewWin, floatShot, grannyRun, hangingCage,
  dadAtMoon, grannyLoop, midExtras, chaosWide, silhouette, liveBug, lowerThird,
};
