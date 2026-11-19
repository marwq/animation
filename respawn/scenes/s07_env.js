// Private helpers for SC 07 («ЛАГИ») and SC 08 («СОХРАНЕНИЕ ПОВРЕЖДЕНО»): shot router + transitions (whip, smash,
// glitch hit, lag stutter), camera helpers, the ghost-YOU fail loops (full ghosts near camera + ghostLite crowd poses),
// small props (party hat, floppy "save file", red fail toast, dream bubble, polaroid, cork board, loading ring).
'use strict';

const K = require('./kit');
const R = require('./respawn');
const X = require('../rig/extras');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, view, actor } = K;
const { draw } = require('../rig/cast');

const W = 1920, H = 1080;
const LINE = '#151515';
const mod = (a, n) => ((a % n) + n) % n;
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const TS = (txt, x, y, size, fill, extra = {}) => T(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const TFS = (txt, x, y, size, fill, extra = {}) => TF(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const pop = (t, t0, d = 0.28) => ease.outBack(seg(t, t0, t0 + d));
// camera that centres world (wx, wy) at the given zoom (parallax 1)
const at = (wx, wy, zoom = 1) => ({ zoom, x: wx - 960, y: wy - 540 });
// world -> screen through a cam at parallax k
const toScr = (cam, x, y, k = 1) => { const z = 1 + ((cam.zoom ?? 1) - 1) * k; return [960 + (cam.sx || 0) + z * (x - 960 - (cam.x || 0) * k), 540 + (cam.sy || 0) + z * (y - 540 - (cam.y || 0) * k), z]; };
function shakeAll(cam, t, list) {
  const c = { ...cam };
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); c.sx = (c.sx || 0) + s.sx; c.sy = (c.sy || 0) + s.sy; }
  return c;
}
// squash/stretch impulse after t0
function boing(t, t0, amp = 0.25, dur = 0.7) {
  const k = t - t0;
  if (k < 0 || k > dur) return { sx: 1, sy: 1 };
  const v = amp * Math.exp(-k * 7) * Math.cos(k * 20);
  return { sx: 1 - v * 0.6, sy: 1 + v };
}
const breathe = (t, ph = 0) => ({ bodyY: 3 + 3 * Math.sin(t * 4.2 + ph) });
const scaleG = (inner, z, cx = 960, cy = 540) => (z === 1 ? inner : S.g(inner, `translate(${f(cx)} ${f(cy)}) scale(${f(z)}) translate(${f(-cx)} ${f(-cy)})`));

// ---------------------------------------------------------------- transitions / accents (screen space)
function whip(t, tc, dir = 1, dur = 0.1) {
  const d = t - tc;
  if (Math.abs(d) > dur) return '';
  const k = 1 - Math.abs(d) / dur;
  let p = '';
  for (let i = 0; i < 16; i++) {
    const y = hash(i * 3.7) * H, len = 300 + hash(i) * 700, th = 8 + hash(i * 2.2) * 16;
    const x = mod(hash(i * 5.1) * 2600 + dir * d * 16000, 2600) - 400;
    p += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.rect(0, 0, W, H, 0, { fill: '#FFFFFF', opacity: f(0.6 * k) }) + S.path(p, { fill: '#FFFFFF', opacity: f(0.85 * k) });
}
const smash = (t, tc, dur = 0.14, a = 0.75, col = '#FFFFFF') => (t >= tc && t < tc + dur ? R.flash(a * (1 - (t - tc) / dur), col) : '');
// a "lag spike" cut: RGB bars + shifted blocks + a dark frame line, around tc (± dur)
function glitchHit(t, tc, dur = 0.16, seed = 1, k = 1) {
  const d = t - tc;
  if (d < -dur * 0.4 || d > dur) return '';
  const st = Math.floor(t * 30);
  const a = k * (1 - Math.abs(d) / dur);
  let o = '';
  for (let i = 0; i < 7; i++) {
    const y = hash(st * 3.1 + i * 7.7 + seed) * H, h = 8 + hash(st + i * 2.3 + seed) * 60;
    const x = (hash(st * 1.7 + i + seed) - 0.5) * 600;
    o += S.rect(x, y, W * (0.4 + 0.6 * hash(i * 9 + st)), h, 0, { fill: ['#FF2E63', '#2EE6FF', '#FFFFFF', '#111'][i % 4], opacity: f(0.55 * a) });
  }
  for (let i = 0; i < 10; i++) {
    const s = 30 + 70 * hash(st * 5.3 + i);
    o += S.rect(hash(st * 2.9 + i * 3.3 + seed) * W, hash(st * 4.1 + i * 1.9 + seed) * H, s, s, 0, { fill: i % 2 ? '#7E8596' : '#FF3B4E', opacity: f(0.7 * a) });
  }
  return o;
}
// radial speed lines around (cx, cy) for punchlines (k 0..1)
function zoomLines(cx, cy, k, t, col = '#FFFFFF', n = 22, r0b = 380) {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i * 3.1) * 0.2, r0 = r0b + hash(i + Math.floor(t * 12)) * 160, r1 = r0 + 600;
    const w = 10 + hash(i * 1.7) * 14;
    const ax = Math.cos(a), ay = Math.sin(a), nx = -ay * w, ny = ax * w;
    d += `M${f(cx + ax * r0)} ${f(cy + ay * r0)}L${f(cx + ax * r1 + nx)} ${f(cy + ay * r1 + ny)}L${f(cx + ax * r1 - nx)} ${f(cy + ay * r1 - ny)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.75 * k) });
}
// red alarm pulse over the frame (siren), k 0..1
const redPulse = (t, k, rate = 5.2) => (k > 0 ? S.rect(0, 0, W, H, 0, { fill: '#FF1A2E', opacity: f(k * (0.06 + 0.07 * (0.5 + 0.5 * Math.sin(t * rate)))) }) : '');
// letterbox-ish dark edges (cheap vignette for close-ups)
const edgeDark = (op = 0.35, col = '#0A0614') => S.rect(0, 0, W, 90, 0, { fill: col, opacity: f(op) }) + S.rect(0, H - 90, W, 90, 0, { fill: col, opacity: f(op) });
// "lag": time inside a shot that freezes in the given windows and then jumps forward (frame repeat)
const lagT = (t, segs) => R.freezeT(t, segs, true);
// choppy (low frame rate) time
const choppy = (t, fps = 8) => Math.floor(t * fps) / fps;

// ---------------------------------------------------------------- shot router
// SHOTS: [[tStart, fn(t)]...]; keeps cuts in order (≥ 0.2 s apart) and draws transitions at the cut times
function router(SHOTS, opts = {}) {
  const list = SHOTS.slice().sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < list.length; i++) if (list[i][0] < list[i - 1][0] + 0.2) list[i][0] = list[i - 1][0] + 0.2;
  const whips = opts.whips || [], glitches = opts.glitches || [], smashes = opts.smashes || [];
  const shotAt = (t) => { let i = list.length - 1; while (i > 0 && t < list[i][0]) i--; return i; };
  return {
    list, shotAt,
    scene(t) {
      const i = shotAt(t);
      let o = list[i][1](t, list[i][0], i + 1 < list.length ? list[i + 1][0] : Infinity);
      for (const [tc, d] of whips) if (Math.abs(t - tc) < 0.1) o += whip(t, tc, d || 1);
      for (const [tc, sd] of glitches) o += glitchHit(t, tc, 0.16, sd || 1);
      for (const [tc, a] of smashes) o += smash(t, tc, 0.14, a || 0.7);
      return o;
    },
  };
}

// ================================================================ the ghost fails (full ghost-YOU near the camera)
// ghostFail(kind, t, { x, y, s, ph, flip, alpha, P, freeze, dx, dy }) -> world-space svg
// kinds: 'skate' (rolls in, board shoots out, lands on his butt, gets up) · 'ball' (dodgeball to the face, falls over)
//        'tray' (walks with a spaghetti tray, slips, splat) · 'stairs' (tumbles down a slope dx/dy) · 'foam' (sits in a foam pile)
//        'trip' (walks, face-plants) · 'flail' (wobbles on an edge, arms windmilling)
// (x, y) = where the fail happens (ground / feet), s = actor scale. flip: side views face right; the ball comes from the right.
const GP = { skate: 2.3, ball: 2.0, tray: 2.4, stairs: 2.1, foam: 3.2, trip: 2.0, flail: 1.4 };
const gprop = (svg, a = 0.6) => R.tint(svg, 'ghost', a);
function ghostFail(kind, t, o = {}) {
  const { x = 960, y = 900, s = 0.4, ph = 0, flip = false, alpha = 0.6 } = o;
  const P = o.P || GP[kind] || 2;
  const tt = o.freeze !== undefined ? o.freeze : t;
  const u = mod((tt + ph) / P, 1);
  const dir = flip ? 1 : -1;                       // side view: screen direction he faces / travels
  const blink = u < 0.035 ? u / 0.035 : 1;         // re-spawn shimmer at the loop start
  const al = alpha * (0.35 + 0.65 * blink);
  const GH = (p) => draw.ghost(o.rim === false ? { ...p, rim: false } : p);
  const G = (pose) => GH({ x, y, s, alpha: al, ...pose });
  let out = '';
  if (kind === 'skate') {
    const tH = 0.36, D = 640 * s;
    const ub = Math.max(0, (u - tH) * P);
    // the board
    let bx, by = y - 52 * s, brot = 0, fk = 0, bop = 0.6;
    if (u < tH) bx = x - dir * D * (1 - u / tH);
    else { bx = x + dir * ub * 1100 * s; by = y - 52 * s - Math.max(0, 900 * ub - 3200 * ub * ub) * s; fk = ub * 2.2; brot = dir * -20 * Math.sin(ub * 8); bop = 0.6 * (1 - seg(ub, 0.35, 0.6)); }
    if (bop > 0.01) out += gprop(X.skateboard(bx, by, s, brot, { flipK: fk % 1 }), bop);
    if (u < tH) {
      const gx = bx, wob = Math.sin(tt * 9) * 4;
      out += GH({ x: gx, y: y - 62 * s, s, alpha: al, view: 'side', flip, legL: 12, legR: -14, kneeL: 24, kneeR: 18, armL: 70 + wob, armR: -40 - wob, lean: 5, face: 'smug' });
    } else if (u < 0.56) {
      const ua = seg(u, tH, 0.56);
      const gx = x + dir * ua * 170 * s, gy = y - 62 * s * (1 - ua) - Math.sin(ua * Math.PI) * 260 * s + ua * 200 * s;
      out += GH({ x: gx, y: gy, s, alpha: al, view: 'side', flip, rot: -dir * 55 * ease.out(ua), legL: 80, legR: 55, kneeL: 10, kneeR: 30, armL: 150 + 20 * Math.sin(tt * 30), armR: 120 - 20 * Math.sin(tt * 30), face: 'scream' });
    } else {
      const ul = seg(u, 0.56, 0.8), ug = ease.inOut(seg(u, 0.82, 1));
      const sq = 1 - 0.18 * Math.exp(-ul * 9) * Math.cos(ul * 26);
      const sitY = 200 * (1 - ug);
      out += GH({ x: x + dir * 170 * s, y: y, s, alpha: al, view: 'side', flip, bodyY: sitY, legL: lerp(85, 0, ug), legR: lerp(72, 0, ug), kneeL: lerp(10, 40 * bump(u, 0.82, 1), ug), kneeR: lerp(14, 30 * bump(u, 0.82, 1), ug), rot: -dir * 10 * (1 - ul), sy: sq, sx: 2 - sq, armL: lerp(-20, 0, ug), armR: lerp(30, 0, ug), face: u < 0.82 ? 'dizzy' : 'oof' });
      if (u < 0.82) out += starsAround(x + dir * 170 * s, y - 600 * s, s, tt);
    }
  } else if (kind === 'ball') {
    const tH = 0.3, side = flip ? 1 : -1;       // the ball comes from this side
    const fx = x, fy = y - 730 * s;
    if (u < tH) {
      const e = u / tH;
      out += gprop(X.dodgeball({ x: lerp(x + side * 1100 * s, fx + side * 70 * s, e), y: lerp(fy - 120 * s, fy, e) - Math.sin(e * Math.PI) * 60 * s, s, rot: e * 400 }), 0.75);
      out += G({ face: { name: 'neutral', eyes: { look: [side, 0] } }, armL: 8, armR: 8 });
    } else {
      const ub = (u - tH) * P;
      const ua = ease.in(seg(u, tH + 0.02, 0.48)), ug = ease.inOut(seg(u, 0.76, 0.96));
      const rot = -side * 88 * ua * (1 - ug);
      const sq = ub < 0.12 ? 0.5 * (1 - ub / 0.12) : 0;
      if (ub < 0.9) out += gprop(X.dodgeball({ x: fx + side * (70 + ub * 900) * s, y: fy - Math.max(-200, 700 * ub - 1800 * ub * ub) * s, s, squash: sq, rot: -ub * 500 }), 0.75 * (1 - seg(ub, 0.6, 0.9)));
      out += G({ rot, y: y + 235 * s * Math.sin((Math.abs(rot) * Math.PI) / 180), armL: lerp(20, 60, ua), armR: lerp(20, 60, ua), face: ub < 0.5 ? 'oof' : u < 0.76 ? 'dizzy' : 'sad' });
      if (u > 0.5 && u < 0.76) out += starsAround(x - side * 250 * s, y - 120 * s, s * 0.8, tt);
    }
  } else if (kind === 'tray') {
    const tH = 0.34, D = 520 * s;
    const sx0 = x - dir * D;
    if (u < tH) {
      const e = u / tH, gx = lerp(sx0, x, e);
      const wk = require('./acting').walk(tt * 9);
      out += GH({ x: gx, y, s, alpha: al, view: 'side', flip, ...wk, armL: 80, armR: 74, face: 'happy' });
      out += gprop(X.lunchTray({ x: gx + dir * 250 * s, y: y - 470 * s, s: s * 0.95, spaghetti: 1 }), 0.65);
    } else {
      const ub = (u - tH) * P;
      const ua = seg(u, tH, 0.52), ug = ease.inOut(seg(u, 0.8, 0.98));
      const rot = -dir * 84 * ease.out(ua) * (1 - ug);
      const air = Math.sin(ua * Math.PI) * 140 * s * (1 - ug);
      out += GH({ x: x + dir * 60 * s, y: y - air + 235 * s * Math.sin((Math.abs(rot) * Math.PI) / 180), s, alpha: al, view: 'side', flip, rot, legL: lerp(110, 0, ug), legR: lerp(70, 0, ug), kneeL: 10, kneeR: 20, armL: lerp(160, 0, ug), armR: lerp(130, 0, ug), face: u < 0.52 ? 'scream' : u < 0.8 ? 'dizzy' : 'oof' });
      if (ub < 1.2) {
        const tx = x + dir * (250 + ub * 520) * s, ty = y - 470 * s - (1000 * ub - 2300 * ub * ub) * s;
        if (ty < y) out += gprop(X.lunchTray({ x: tx, y: ty, s: s * 0.95, rot: dir * ub * 360, spaghetti: 0.2 }), 0.65);
        out += gprop(X.spaghetti({ x: tx + dir * 60 * s, y: Math.min(y - 20 * s, ty - 200 * s * Math.min(1, ub * 3)), s, mode: 'fly', k: clamp(ub * 2, 0, 1), t: tt, seed: 3 }), 0.7);
      } else out += gprop(X.spaghetti({ x: x + dir * 700 * s, y, s, mode: 'splat', seed: 3 }), 0.6);
    }
  } else if (kind === 'stairs') {
    const dx = o.dx ?? -dir * 420 * s, dy = o.dy ?? 200 * s;
    const ua = seg(u, 0.04, 0.6), ul = seg(u, 0.6, 0.86);
    if (u < 0.6) {
      const e = ease.in(ua) * 0.4 + ua * 0.6;
      const hop = Math.abs(Math.sin(e * Math.PI * 4)) * 70 * s;
      out += GH({ x: x + dx * e, y: y + dy * e - hop - 120 * s, s, alpha: al, view: 'side', flip: dx > 0, rot: (dx > 0 ? 1 : -1) * 720 * e, legL: 60, legR: 30, kneeL: 70, kneeR: 50, armL: 120, armR: 90, face: 'scream' });
    } else {
      const fade = 1 - seg(u, 0.86, 1);
      const sq = 1 - 0.2 * Math.exp(-ul * 8) * Math.cos(ul * 24);
      out += GH({ x: x + dx, y: y + dy + 235 * s, s, alpha: al * fade, view: 'side', flip: dx > 0, rot: (dx > 0 ? 1 : -1) * -90, sy: sq, armL: 150, armR: 40, legL: 20, legR: -10, face: 'dizzy' });
      out += starsAround(x + dx, y + dy - 150 * s, s * 0.8, tt, fade);
    }
  } else if (kind === 'foam') {
    const wipe = bump(u, 0.45, 0.7), drip = seg(u, 0, 0.3);
    out += GH({ x, y, s, alpha: al, view: 'side', flip, bodyY: 200, legL: 85, legR: 76, kneeL: 8, kneeR: 12, armL: lerp(20, 140, wipe), armR: 10, headRot: -4 + 3 * Math.sin(tt * 2), foam: 1, face: { name: 'deadpan', blink: u > 0.86 && u < 0.9 ? 1 : 0 } });
    out += S.g(R.foamPile(x + dir * 60 * s, y + 10 * s, 900 * s, 330 * s, { t: tt, seed: 4 }), null, { opacity: 0.8 });
    out += R.foamSplash(x, y - 640 * s, (u - 0.02) * P, { s: s * 1.4, n: 6, seed: 5 });
    if (drip > 0 && drip < 1) out += S.circle(x - dir * 40 * s, y - 600 * s + drip * 260 * s, 14 * s, { fill: '#FFFFFF', stroke: '#9AB', 'stroke-width': 3, opacity: 0.8 });
  } else if (kind === 'trip') {
    const tH = 0.32, D = 560 * s;
    if (u < tH) {
      const e = u / tH;
      out += GH({ x: lerp(x - dir * D, x, e), y, s, alpha: al, view: 'side', flip, ...require('./acting').run(tt * 11, 0.9), face: 'happy' });
    } else {
      const ua = ease.in(seg(u, tH, 0.46)), ug = ease.inOut(seg(u, 0.78, 0.98));
      const rot = dir * 86 * ua * (1 - ug);
      out += GH({ x: x + dir * 120 * s * ua, y: y + 235 * s * Math.sin((Math.abs(rot) * Math.PI) / 180), s, alpha: al, view: 'side', flip, rot, legL: -30 * (1 - ug), legR: 20 * (1 - ug), armL: lerp(130, 0, ug), armR: lerp(110, 0, ug), face: u < 0.46 ? 'scream' : 'oof' });
    }
  } else if (kind === 'flail') {
    const w = Math.sin(tt * 13 + ph * 3);
    out += G({ armL: 90 + 70 * w, armR: 90 - 70 * w, rot: 12 * Math.sin(tt * 5 + ph), lift: 0, face: 'scream' });
  }
  return out;
}
// little dizzy stars circling (world space)
function starsAround(cx, cy, s, t, op = 1) {
  if (op <= 0.02) return '';
  let o = '';
  for (let i = 0; i < 3; i++) {
    const a = t * 5 + (i * Math.PI * 2) / 3;
    const x = cx + Math.cos(a) * 170 * s, y = cy + Math.sin(a) * 50 * s;
    o += S.path(star5d(x, y, 34 * s * (0.8 + 0.2 * Math.sin(a))), { fill: '#FFE14D', stroke: LINE, 'stroke-width': f(5 * s), opacity: f(0.85 * op) });
  }
  return o;
}
function star5d(x, y, r) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    d += (i ? 'L' : 'M') + f(x + Math.cos(a) * rr) + ' ' + f(y + Math.sin(a) * rr);
  }
  return d + 'Z';
}

// ================================================================ ghostLite crowd poses (far ghosts)
// litePose(kind, t, a, i) -> pose for draw.ghostLite / draw.ghostCrowd at anchor a {x, y, s}
const LITE_KINDS = ['fall', 'trip', 'flail', 'sit', 'tumble', 'fall', 'flail', 'trip'];
function litePose(kind, t, a, i = 0, freeze) {
  const tt = freeze !== undefined ? freeze : t;
  const P = 1.5 + hash(i * 3.1 + 0.4) * 1.3;
  const u = mod(tt / P + hash(i * 7.7), 1);
  const s = a.s, side = hash(i * 5.3) > 0.5 ? 1 : -1;
  const base = { x: a.x, y: a.y, s };
  if (kind === 'fall') {
    const r = side * 88 * ease.in(seg(u, 0.15, 0.35)) * (1 - ease.inOut(seg(u, 0.75, 0.95)));
    return { ...base, rot: r, y: a.y + 235 * s * Math.sin((Math.abs(r) * Math.PI) / 180), armL: 40, armR: 40 };
  }
  if (kind === 'trip') {
    const r = side * 85 * ease.in(seg(u, 0.3, 0.45)) * (1 - ease.inOut(seg(u, 0.78, 0.96)));
    const wk = u < 0.3 ? require('./acting').walk(tt * 10) : {};
    return { ...base, view: 'side', flip: side > 0, rot: r, y: a.y + 235 * s * Math.sin((Math.abs(r) * Math.PI) / 180), ...wk, armL: u >= 0.3 ? 130 : wk.armL, armR: u >= 0.3 ? 100 : wk.armR };
  }
  if (kind === 'flail') {
    const w = Math.sin(tt * 12 + i * 1.7);
    return { ...base, armL: 90 + 75 * w, armR: 90 - 75 * w, rot: 14 * Math.sin(tt * 4.4 + i), y: a.y - Math.abs(Math.sin(tt * 6 + i)) * 30 * s };
  }
  if (kind === 'sit') return { ...base, view: 'side', flip: side > 0, bodyY: 200, legL: 85, legR: 74, kneeL: 8, armL: 20 + 20 * Math.sin(tt * 3 + i), armR: -10, rot: 4 * Math.sin(tt * 2 + i) };
  // tumble: rolling somersaults on the spot
  const r = side * 360 * u;
  return { ...base, view: 'side', flip: side > 0, rot: r, y: a.y - 120 * s - Math.abs(Math.sin(u * Math.PI * 2)) * 40 * s, legL: 70, legR: 50, kneeL: 80, kneeR: 70, armL: 120, armR: 90 };
}
// one crowd group for anchors that share a parallax k: list of {x, y, s, kind?, i?, born?}
function liteCrowd(t, list, o = {}) {
  const poses = [];
  for (const a of list) {
    if (a.born !== undefined && t < a.born) continue;
    let p = litePose(a.kind || LITE_KINDS[(a.i || 0) % LITE_KINDS.length], t, a, a.i || 0, o.freeze);
    if (a.born !== undefined) { const age = t - a.born; if (age < 0.3) { const pp = R.popPose(age, a.s); p = { ...p, sx: pp.sx, sy: pp.sy }; } }
    if (o.col) p.col = o.col;
    poses.push(p);
  }
  return poses.length ? draw.ghostCrowd(poses, { alpha: o.alpha ?? 0.62 }) : '';
}

// ================================================================ props
// little paper party hat (cone) — (x, y) = brim centre, s scale, rot deg
function partyHat(x, y, s = 1, rot = 0, col = '#FF6FB5', col2 = '#FFE14D') {
  let o = S.path('M-60 0 L0 -150 L60 0 Z', ol(col, 6));
  o += S.path('M-38 -52 L38 -52 M-20 -100 L20 -100', ln(10, col2));
  o += S.circle(0, -156, 16, ol(col2, 5));
  return S.g(o, tf(x, y, s, rot));
}
// floppy-disk "SAVE FILE" icon; (x, y) centre; size 300 at s 1; crack 0..1
function floppy(x, y, s = 1, rot = 0, o = {}) {
  const { col = '#3A5BD9', crack = 0, label = 'SAVE FILE', red = 0 } = o;
  const c = red > 0 ? R.mix(col, '#C8202E', red) : col;
  let g = S.path('M-150 -150 L110 -150 L150 -110 L150 150 L-150 150 Z', ol(c, 10));
  g += S.rect(-90, -150, 180, 100, 8, ol('#C9CED8', 8)) + S.rect(30, -136, 40, 72, 6, { fill: R.mix(c, '#000', 0.3) });
  g += S.rect(-110, 10, 220, 125, 12, ol('#F4F1E6', 8)) + S.path('M-90 50 H90 M-90 82 H90 M-90 114 H60', ln(5, '#B9B2A0'));
  g += T(label, 0, 46, 34, '#2A2246');
  if (crack > 0) g += S.path(`M-20 -150 L10 -70 L-30 0 L20 ${f(60 * crack)} L-10 ${f(150 * crack)}`, ln(9, LINE, Math.min(1, crack * 2)));
  return S.g(g, tf(x, y, s, rot));
}
// a red "fail saved" toast (the corrupted cousin of R.savedToast); k pops in
function redToast(x, y, k, text = 'Fail saved', o = {}) {
  const kk = clamp(k, 0, 1);
  if (kk <= 0.01) return '';
  const { size = 44, t = 0 } = o;
  const tw = R.textW(text, size, 'F');
  const Wd = tw + 150, Hh = 94;
  const sc = ease.outBack(kk);
  let c = S.rect(-Wd / 2 + 8, -Hh / 2 + 10, Wd, Hh, 47, { fill: '#000', opacity: 0.25 });
  c += S.rect(-Wd / 2, -Hh / 2, Wd, Hh, 47, { fill: '#2A0810', opacity: 0.95, stroke: LINE, 'stroke-width': 6 });
  c += S.rect(-Wd / 2 + 6, -Hh / 2 + 6, Wd - 12, Hh - 12, 41, { fill: 'none', stroke: '#FF3B4E', 'stroke-width': 4, opacity: f(0.6 + 0.4 * Math.sin(t * 10)) });
  c += S.circle(-Wd / 2 + 52, 0, 28, ol('#FF3B4E', 5)) + S.path(`M${f(-Wd / 2 + 40)} -12 L${f(-Wd / 2 + 64)} 12 M${f(-Wd / 2 + 64)} -12 L${f(-Wd / 2 + 40)} 12`, ln(7, '#FFFFFF'));
  c += TF(text, -Wd / 2 + 96, size * 0.36, size, '#FFFFFF', { 'text-anchor': 'start' });
  return S.g(c, `translate(${f(x)} ${f(y)}) scale(${f(sc)})`);
}
// thought/dream cloud bubble; (x, y) centre, w × h; inner svg is clipped to the ellipse; tail toward (tx, ty)
function dreamBubble(x, y, w, h, k, inner, tx, ty) {
  if (k <= 0.01) return '';
  const sc = ease.outBack(clamp(k, 0, 1));
  const id = S.uid('s07db');
  let o = '';
  const lumps = 12;
  for (let i = 0; i < lumps; i++) {
    const a = (i / lumps) * Math.PI * 2;
    o += S.circle(Math.cos(a) * w * 0.5, Math.sin(a) * h * 0.5, Math.min(w, h) * 0.17, ol('#FFFFFF', 7));
  }
  o += S.ellipse(0, 0, w * 0.52, h * 0.52, { fill: '#FFFFFF' });
  o += S.clipDef(id, S.ellipse(0, 0, w * 0.5, h * 0.48)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
  let tail = '';
  for (let i = 1; i <= 3; i++) {
    const u = i / 4;
    tail += S.circle(lerp(x, tx, u), lerp(y + h * 0.45, ty, u), 26 - i * 6, ol('#FFFFFF', 6));
  }
  return tail + S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(sc)})`);
}
// the polaroid "case photo": inner svg (a 1920x1080 frame) scaled into the photo window; (x, y) centre
function polaroid(x, y, s, rot, inner, o = {}) {
  const id = S.uid('s07pl');
  const w = 640, h = 360;
  let g = S.rect(-w / 2 - 34 + 10, -h / 2 - 34 + 14, w + 68, h + 150, 6, { fill: '#000', opacity: 0.3 });
  g += S.rect(-w / 2 - 34, -h / 2 - 34, w + 68, h + 150, 6, ol('#FBFAF4', 6));
  g += S.clipDef(id, S.rect(-w / 2, -h / 2, w, h)) + S.g(S.g(inner, `translate(${-w / 2} ${-h / 2}) scale(${w / 1920})`), null, { 'clip-path': `url(#${id})` });
  g += S.rect(-w / 2, -h / 2, w, h, 0, { fill: 'none', stroke: LINE, 'stroke-width': 4 });
  if (o.caption) g += S.el('text', { x: 0, y: h / 2 + 76, 'font-family': 'Fredoka, sans-serif', 'font-weight': 600, 'font-size': 44, fill: '#2A2A9A', 'text-anchor': 'middle', transform: 'rotate(-2)' }, o.caption);
  return S.g(g, tf(x, y, s, rot));
}
// a red push-pin
const pin = (x, y, s = 1) => S.g(S.circle(0, 0, 22, ol('#E8303F', 5)) + S.circle(-7, -7, 7, { fill: '#FF9AA2' }), tf(x, y, s));
// a rubber "UNSOLVED" style stamp; k 0..1 slams it in
function stamp(x, y, k, text, rot = -12, col = '#D81E2C', size = 96) {
  if (k <= 0.01) return '';
  const sc = lerp(2.4, 1, ease.outBack(clamp(k / 0.5, 0, 1)));
  const op = clamp(k * 4, 0, 1);
  const w = R.textW(text, size, 'L') + 80;
  let g = S.rect(-w / 2, -size * 0.75, w, size * 1.35, 14, { fill: 'none', stroke: col, 'stroke-width': 12 });
  g += T(text, 0, size * 0.33, size, col, { 'letter-spacing': 4 });
  return S.g(g, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(sc)})`, { opacity: f(op * 0.92) });
}
// spinner of dots around a point (loading)
const loadRing = (x, y, r, t, col = '#FFFFFF', k = 1) => (k > 0.01 ? S.g(R.spinner(x, y, r, t, col), null, { opacity: f(k) }) : '');

module.exports = {
  W, H, LINE, mod, tf, TS, TFS, pop, at, toScr, shakeAll, boing, breathe, scaleG,
  whip, smash, glitchHit, zoomLines, redPulse, edgeDark, lagT, choppy, router,
  ghostFail, starsAround, litePose, liteCrowd, LITE_KINDS, GP,
  partyHat, floppy, redToast, dreamBubble, polaroid, pin, stamp, loadRing, star5d,
};
