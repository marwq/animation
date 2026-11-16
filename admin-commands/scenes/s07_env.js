// Private helpers for SC 07 (the ADMIN) and SC 08 (the command battle): hero + laptop, auras, the kick pixel dissolve,
// teleport beams, ice block, hair dryer, sandwich, log tags, chat feed, sound rings, VS card bits...
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, actor } = K;
const SETS = require('./sets');
const A = require('./acting');

const LINE = '#151515';
const R = (x, y, w, h, r = 0, a = {}) => S.rect(x, y, w, h, r, a);
const P = (d, a = {}) => (d ? S.path(d, a) : '');
const Ci = (x, y, r, a = {}) => S.circle(x, y, r, a);
const El = (x, y, rx, ry, a = {}) => S.ellipse(x, y, rx, ry, a);
const G = (inner, tfm, extra) => (inner ? S.g(inner, tfm, extra) : '');
const tr = (x, y, s = 1, rot = 0) => `translate(${f(x)} ${f(y)})${rot ? ` rotate(${f(rot)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const OUT = (w = 8) => ({ stroke: LINE, 'stroke-width': w, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
const outT = (txt, x, y, size, fill, w = 8, extra = {}) => T(esc(txt), x, y, size, fill, { ...OUT(w), ...extra });
const outTF = (txt, x, y, size, fill, w = 6, extra = {}) => TF(esc(txt), x, y, size, fill, { ...OUT(w), ...extra });
const pop = (k) => (k <= 0 ? 0 : ease.outBack(clamp(k, 0, 1)));
const W = 1920, H = 1080;

// camera centred on world point (x, y)
const at = (x, y, zoom = 1, extra = {}) => ({ zoom, x: x - 960, y: y - 540, ...extra });
// camera + shakes: list of [t0, dur, amp]
function shook(cam, t, list) {
  let sx = 0, sy = 0;
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); sx += s.sx; sy += s.sy; }
  return sx || sy ? { ...cam, sx: (cam.sx || 0) + sx, sy: (cam.sy || 0) + sy } : cam;
}
// white (or coloured) flash that fades over dur from t0
function flash(t, t0, dur = 0.25, col = '#FFFFFF', peak = 1) {
  const u = (t - t0) / dur;
  if (u < 0 || u > 1) return '';
  return R(0, 0, W, H, 0, { fill: col, opacity: f(peak * (1 - u) * (1 - u)) });
}
// whip-pan streaks at the head of a cut
function whip(t, t0, dir = 1, dur = 0.16) {
  const u = (t - t0) / dur;
  if (u < 0 || u > 1) return '';
  let o = R(0, 0, W, H, 0, { fill: '#FFFFFF', opacity: f(0.55 * (1 - u)) });
  for (let i = 0; i < 18; i++) {
    const y = hash(i * 3.1) * H, len = 400 + hash(i * 7.7) * 900, x = (dir > 0 ? -len : W) + dir * (W + len) * (u + hash(i) * 0.3);
    o += R(x, y, len, 6 + hash(i * 5) * 10, 5, { fill: '#FFFFFF', opacity: f(0.8 * (1 - u)) });
  }
  return o;
}
// letterbox-free vignette for inserts
const darken = (k, col = '#000') => (k > 0 ? R(0, 0, W, H, 0, { fill: col, opacity: f(k) }) : '');

// ---------------------------------------------------------------- the hero + the magic laptop
// laptop held at the chest: 'back' (front view, lid back to camera), 'screen' (front view, screen to camera, cheat), 'side'
function lapProp(t, mode, o = {}) {
  const glow = o.glow ?? 0.85;
  if (mode === 'side') {
    const scr = o.screen || SETS.adminScreen(t, o.scr || {});
    return { svg: o.flip ? G(SETS.laptop(150, -318, 0.42, scr, { glow, t, dust: 0.4 }), 'scale(-1 1)') : SETS.laptop(-150, -318, 0.42, scr, { glow, t, dust: 0.4 }), layer: 'front' };
  }
  if (mode === 'screen') return { svg: SETS.laptop(0, -232, 0.5, o.screen || SETS.adminScreen(t, o.scr || {}), { glow, t, dust: 0.4 }), layer: 'front' };
  return { svg: SETS.laptop(0, -238, 0.55, null, { back: true, glow, t, dust: 0.5 }), layer: 'front' };
}
// warm golden aura behind a rig body (feet at x, y; scale s): the god-mode glow
function goldAura(x, y, s, k, t, col = '#FFC23A') {
  if (!(k > 0.01)) return '';
  const cy = y - 470 * s, b = 1 + 0.04 * Math.sin(t * 6);
  let o = '';
  for (const [q, c, a] of [[1, col, 0.12], [0.8, '#FFD45A', 0.16], [0.6, '#FFE38A', 0.2], [0.42, '#FFF2C4', 0.24]]) o += El(x, cy, 360 * s * q * b, 600 * s * q * b, { fill: c, opacity: f(a * k) });
  let rays = '';
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + t * 0.6, r0 = 300 * s, r1 = (640 + 90 * Math.sin(i * 1.7 + t * 3)) * s;
    rays += `M${f(x + Math.cos(a - 0.06) * r0)} ${f(cy + Math.sin(a - 0.06) * r0 * 1.3)}L${f(x + Math.cos(a) * r1)} ${f(cy + Math.sin(a) * r1 * 1.3)}L${f(x + Math.cos(a + 0.06) * r0)} ${f(cy + Math.sin(a + 0.06) * r0 * 1.3)}Z`;
  }
  return o + P(rays, { fill: '#FFE07A', opacity: f(0.35 * k) });
}
// hero: pose.laptop = 'back' | 'screen' | 'side' | true; pose.gold = god-mode aura 0..1; pose.lapGlow, pose.lapScreen
function hero(t, pose = {}, act = {}) {
  const { laptop, gold = 0, lapGlow, lapScreen, lapScr, ...p } = pose;
  const props = [...(p.props || [])];
  const mode = laptop === true ? 'back' : laptop;
  if (mode) props.push(lapProp(t, mode, { glow: lapGlow, screen: lapScreen, scr: lapScr, flip: p.flip }));
  const base = mode && mode !== 'side' ? { armL: 26, armR: 26 } : mode === 'side' ? { armL: 62, armR: 48 } : {};
  const a = mode && act.arms === undefined ? { ...act, arms: false } : act;
  return goldAura(p.x, p.y - (p.lift || 0), p.s * (p.sy || 1), gold, t) + actor('you', t, { ...base, ...p, props }, a);
}
// hero body palette for pixels (u = 0 feet .. 1 head top)
function heroPix(u, h) {
  if (u < 0.05) return '#FFFFFF';
  if (u < 0.33) return h > 0.8 ? '#2E5A40' : '#1F3B2A';
  if (u < 0.56) return h > 0.66 ? '#F2D04A' : h > 0.3 ? '#D8262E' : '#B01D24';
  if (u < 0.62) return '#FFFFFF';
  if (u < 0.86) return h > 0.5 ? '#FFFFFF' : '#EDEFF5';
  return h > 0.4 ? '#C9571F' : '#E07A2E';
}
const pixW = (u) => (u < 0.33 ? 95 : u < 0.6 ? 150 : 175);
// kick dissolve: inner = the hero svg (drawn in the same space), feet at (x, y), scale s, k = 0..1 dissolved from the feet up.
// Pixels fly off upward; with k going back down they fly back in (reassemble). opts.col (pixel tint) opts.seed
function dissolve(inner, x, y, s, k, t, opts = {}) {
  const Hh = 980 * s;
  if (k <= 0.001) return inner;
  const cutY = y - Hh * clamp(k, 0, 1);
  const id = S.uid('s07clip');
  let o = `<clipPath id="${id}"><rect x="${f(x - 700 * s)}" y="${f(y - 1400 * s)}" width="${f(1400 * s)}" height="${f(cutY - (y - 1400 * s))}"/></clipPath>`;
  if (k < 1) o += G(inner, null, { 'clip-path': `url(#${id})` });
  // jittery bright edge
  if (k < 0.995) {
    const j = (hash(Math.floor(t * 24)) - 0.5) * 30 * s;
    o += R(x - 180 * s + j, cutY - 5 * s, 360 * s, 10 * s, 4 * s, { fill: opts.edge || '#FFFFFF', opacity: 0.9 });
  }
  const N = opts.n || 48, seed = opts.seed || 7;
  let groups = {};
  for (let i = 0; i < N; i++) {
    const u = hash(i * 1.37 + seed), h = hash(i * 3.11 + seed);
    const p = clamp((k - u) / 0.32, 0, 1);
    if (p <= 0 || p >= 1) continue;
    const px = x + (h - 0.5) * 2 * pixW(u) * s, py = y - u * Hh;
    const dx = (hash(i * 5.3 + seed) - 0.5) * 520 * s * p, dy = -(160 + 520 * hash(i * 7.9 + seed)) * s * p;
    const sz = (22 + 22 * hash(i * 2.2 + seed)) * s * (1 - 0.55 * p);
    const col = opts.col || heroPix(u, hash(i * 9.1 + seed));
    const d = `M${f(px + dx - sz / 2)} ${f(py + dy - sz / 2)}h${f(sz)}v${f(sz)}h${f(-sz)}Z`;
    const key = col + '|' + (p < 0.5 ? 'a' : 'b');
    (groups[key] = groups[key] || []).push(d);
  }
  for (const key in groups) {
    const [col, ph] = key.split('|');
    o += P(groups[key].join(''), { fill: col, stroke: LINE, 'stroke-width': f(3 * s + 1), opacity: ph === 'a' ? 1 : 0.6 });
  }
  return o;
}
// teleport beam (column of light + rings + sparkles) at feet (x, y), scale s, k 0..1 (bell)
function tpBeam(x, y, s, k, t, col = '#BFF6FF') {
  if (!(k > 0.01)) return '';
  const w = 300 * s * k, top = y - 2400 * s;
  let o = R(x - w / 2, top, w, y - top, w / 2, { fill: col, opacity: f(0.45 * k) }) + R(x - w / 4, top, w / 2, y - top, w / 4, { fill: '#FFFFFF', opacity: f(0.8 * k) });
  for (let i = 0; i < 3; i++) { const ph = (t * 2.4 + i / 3) % 1; o += El(x, y - ph * 900 * s, 260 * s * k * (1 - ph * 0.4), 40 * s * k, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(8 * s + 2), opacity: f(k * (1 - ph)) }); }
  const sp = [];
  for (let i = 0; i < 6; i++) sp.push([x + (hash(i * 4.4) - 0.5) * 420 * s, y - (hash(i * 2.7) * 900 + ((t * 300) % 300)) * s, 18 * s * k + 4]);
  return o + K.sparkles(sp, t);
}
// teleport in/out squash for a pose: k 0 = normal, 1 = gone (thin vertical line)
const tpSquash = (k) => ({ sx: Math.max(0.02, 1 - ease.in(clamp(k, 0, 1))), sy: 1 + 0.5 * clamp(k, 0, 1) });

// ---------------------------------------------------------------- the Admin bits
// a cone of white-gold light from the sky onto a target (the Admin "focusing" on you)
function spotCone(x0, y0, x, y, w, k) {
  if (!(k > 0.01)) return '';
  return P(`M${f(x0 - 20)} ${f(y0)}L${f(x + w)} ${f(y)}L${f(x - w)} ${f(y)}Z`, { fill: '#FFF4C8', opacity: f(0.28 * k) }) + El(x, y, w, w * 0.18, { fill: '#FFF8DC', opacity: f(0.45 * k) });
}
// expanding sound rings (Dad's "Can you hear me now?!"), from (x, y) toward angle (deg), t0 start
function soundRings(x, y, t, t0, ang = 0, col = '#7FE3FF', n = 4, reach = 700, w = 10) {
  if (t < t0) return '';
  let o = '';
  for (let i = 0; i < n; i++) {
    const ph = ((t - t0) * 1.6 + i / n) % 1;
    const r = 40 + ph * reach;
    const a0 = (ang - 38) * Math.PI / 180, a1 = (ang + 38) * Math.PI / 180;
    o += P(`M${f(x + Math.cos(a0) * r)} ${f(y + Math.sin(a0) * r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + Math.cos(a1) * r)} ${f(y + Math.sin(a1) * r)}`, ln(w * (1 - ph * 0.5), col, 1 - ph));
  }
  return o;
}
// a little "log evidence" ticket: header ADMIN LOG #n, the command, red VIOLATION stamp
function logTag(x, y, num, cmd, k, rot = -4, s = 1) {
  const sc = pop(k) * s;
  if (sc < 0.01) return '';
  const w = Math.max(460, 120 + cmd.length * 25);
  let o = R(-w / 2 + 10, -64 + 12, w, 132, 22, { fill: '#000', opacity: 0.3 });
  o += R(-w / 2, -64, w, 132, 22, ol('#FFFFFF', 7)) + R(-w / 2, -64, w, 44, 22, { fill: '#FFC93C' }) + R(-w / 2, -40, w, 20, 0, { fill: '#FFC93C' }) + P(`M${-w / 2} -20H${w / 2}`, ln(6));
  o += TF(`ADMIN LOG  #${num}`, -w / 2 + 24, -30, 26, '#5A3A00', { 'text-anchor': 'start', 'letter-spacing': 2 });
  o += TF(esc(cmd), -w / 2 + 28, 38, 46, '#2A2140', { 'text-anchor': 'start' });
  const sk = clamp((k - 0.5) / 0.4, 0, 1);
  if (sk > 0) o += G(R(-110, -32, 220, 64, 10, { fill: 'none', stroke: '#E8243C', 'stroke-width': 7 }) + T('VIOLATION', 0, 14, 36, '#E8243C'), `translate(${f(w / 2 - 110)} 34) rotate(-12) scale(${f(lerp(2.2, 1, ease.out(sk)))})`, { opacity: f(sk) });
  return G(o, tr(x, y, sc, rot));
}
// the "YOU HAVE BEEN KICKED" disconnect window (original layout)
function kickedWindow(x, y, k, s = 1, t = 0) {
  const sc = pop(k) * s;
  if (sc < 0.01) return '';
  let o = R(-420 + 12, -170 + 16, 840, 340, 30, { fill: '#000', opacity: 0.35 });
  o += R(-420, -170, 840, 340, 30, ol('#20232E', 8)) + R(-420, -170, 840, 70, 30, { fill: '#E8243C' }) + R(-420, -130, 840, 30, 0, { fill: '#E8243C' }) + P('M-420 -100H420', ln(6));
  o += T('DISCONNECTED', 0, -118, 44, '#FFFFFF', { 'letter-spacing': 3 });
  o += Ci(-330, 6, 46, ol('#E8243C', 6)) + P('M-352 -16L-308 28M-308 -16L-352 28', ln(11, '#FFFFFF'));
  o += T('YOU HAVE BEEN KICKED', 40, -14, 54, '#FFFFFF');
  o += TF('Reason: abuse of commands', 40, 40, 36, '#FF8A96');
  const bl = Math.floor(t * 4) % 2;
  o += R(-110, 84, 220, 62, 18, ol(bl ? '#5A6478' : '#4A5266', 5)) + TF('LEAVE', 0, 126, 34, '#FFFFFF');
  return G(o, tr(x, y, sc));
}

// ---------------------------------------------------------------- ice
// ice block around a body: feet (x, y), w x h; grow 0..1 (rises from the feet), melt 0..1 (shrinks + drips)
function iceBlock(x, y, w, h, grow, melt, t) {
  const g = ease.out(clamp(grow, 0, 1)), m = clamp(melt, 0, 1);
  const hh = h * g * (1 - m), ww = w * (1 - 0.25 * m);
  if (hh < 4) return '';
  const top = y - hh, r = 26 + 40 * m;
  let o = R(x - ww / 2, top, ww, hh, r, { fill: '#BDEBFF', opacity: 0.5, stroke: '#2E6E96', 'stroke-width': 7 });
  o += R(x - ww / 2 + 10, top + 10, ww - 20, hh - 20, Math.max(6, r - 10), { fill: 'none', stroke: '#F2FDFF', 'stroke-width': 6, opacity: 0.85 });
  o += P(`M${f(x - ww / 2 + 30)} ${f(top + 40)}L${f(x - ww / 2 + 90)} ${f(top + 40)}L${f(x - ww / 2 + 30)} ${f(top + Math.min(hh - 20, 260))}Z`, { fill: '#FFFFFF', opacity: 0.55 });
  o += P(`M${f(x + ww / 2 - 60)} ${f(top + 30)}L${f(x + ww / 2 - 30)} ${f(top + 30)}L${f(x + ww / 2 - 30)} ${f(top + Math.min(hh - 30, 140))}Z`, { fill: '#FFFFFF', opacity: 0.4 });
  // frost cracks
  o += P(`M${f(x + ww * 0.1)} ${f(top + hh * 0.3)}l${f(ww * 0.12)} ${f(hh * 0.08)}l${f(-ww * 0.05)} ${f(hh * 0.1)}M${f(x - ww * 0.2)} ${f(top + hh * 0.65)}l${f(ww * 0.1)} ${f(-hh * 0.05)}l${f(ww * 0.06)} ${f(hh * 0.09)}`, ln(4, '#FFFFFF', 0.8));
  // frosty top rim
  o += R(x - ww / 2 + 4, top - 2, ww - 8, 22, 11, { fill: '#F2FDFF', opacity: 0.9 });
  if (m > 0.02) {
    let d = '';
    for (let i = 0; i < 6; i++) { const ph = (t * 1.8 + i / 6) % 1; const dx = x - ww / 2 + (i + 0.5) * ww / 6; d += `M${f(dx)} ${f(top + hh * 0.6 + ph * hh * 0.5)}q-10 16 0 24q10 -8 0 -24Z`; }
    o += P(d, { fill: '#8ED8FF', stroke: '#2E6E96', 'stroke-width': 3, opacity: f(Math.min(1, m * 3)) });
  }
  return o;
}
const puddle = (x, y, w, k) => (k > 0.01 ? El(x, y + 6, w * k, 26 * k, { fill: '#7FCBF2', opacity: 0.7, stroke: '#2E6E96', 'stroke-width': 4 }) + El(x - w * 0.3 * k, y, w * 0.25 * k, 6 * k, { fill: '#FFFFFF', opacity: 0.6 }) : '');
// cold snowflake sparkles around a point
function frost(x, y, r, t, k = 1) {
  if (!(k > 0.01)) return '';
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = hash(i * 3.3) * Math.PI * 2, rr = r * (0.4 + 0.6 * hash(i * 1.9)), s = (8 + 8 * Math.abs(Math.sin(t * 4 + i))) * k;
    const cx = x + Math.cos(a) * rr, cy = y + Math.sin(a) * rr * 0.8;
    d += `M${f(cx - s)} ${f(cy)}H${f(cx + s)}M${f(cx)} ${f(cy - s)}V${f(cy + s)}M${f(cx - s * 0.7)} ${f(cy - s * 0.7)}L${f(cx + s * 0.7)} ${f(cy + s * 0.7)}M${f(cx + s * 0.7)} ${f(cy - s * 0.7)}L${f(cx - s * 0.7)} ${f(cy + s * 0.7)}`;
  }
  return P(d, ln(4, '#FFFFFF', 0.9));
}

// ---------------------------------------------------------------- props
// Granny's pink hair dryer; nozzle points +x; (x, y) = grip; on 0..1 = hot air
function hairDryer(x, y, s, rot, t, on = 0) {
  let o = '';
  if (on > 0.01) {
    let d = '';
    for (let i = 0; i < 5; i++) {
      const ph = (t * 3 + i / 5) % 1, yy = -112 + (i - 2) * 22 * (1 + ph), x0 = 250 + ph * 260;
      d += `M${f(x0)} ${f(yy)}q30 -14 60 0t60 0t60 0`;
    }
    o += P(d, { ...ln(9, '#FF8A3D', 0.8 * on), fill: 'none' }) + El(330, -112, 120 * on, 60 * on, { fill: '#FFB86B', opacity: f(0.25 * on) });
  }
  o += P('M-20 -70L40 60Q46 78 30 82L6 86Q-8 88 -14 74L-60 -60Z', ol('#FF6FA8', 7)) + P('M-30 -40L20 70', ln(6, '#FFA8CC'));
  o += R(-120, -160, 330, 110, 55, ol('#FF8FC0', 8)) + R(-90, -150, 220, 22, 11, { fill: '#FFFFFF', opacity: 0.45 });
  o += R(190, -150, 70, 86, 20, ol('#C94F86', 7)) + P('M200 -134H250M200 -114H250M200 -94H250', ln(4, '#7A2A54'));
  o += Ci(-120, -105, 52, ol('#E85A9A', 7)) + P('M-150 -105H-90M-120 -135V-75', ln(5, '#7A2A54'));
  o += R(-6, -40, 30, 18, 6, ol(on > 0.5 ? '#3DFF9A' : '#FFFFFF', 4));
  return G(o, tr(x, y, s, rot));
}
// a big sandwich (side view, ~320 x 150 at s 1); bite 0..1 = a scalloped chomp out of the right end
function sandwich(x, y, s, rot, bite = 0) {
  const id = S.uid('s07sw');
  const br = 70 * clamp(bite, 0, 1.4), bx = 175, by = -60;
  let o = '';
  let b = R(-160, -110, 320, 44, 22, ol('#F2C27A', 7)) + R(-150, -104, 300, 10, 5, { fill: '#FFE0A8' });
  b += P('M-168 -62Q-130 -84 -90 -62T-10 -62T70 -62T150 -62L170 -50L160 -40H-160Z', ol('#6BD15A', 5));
  b += R(-158, -48, 316, 22, 6, ol('#E8453C', 5)) + R(-160, -28, 320, 18, 4, ol('#FFD84D', 5)) + P('M-120 -10l18 18l18 -18M40 -10l18 18l18 -18', ol('#FFD84D', 4));
  b += R(-160, -12, 320, 40, 18, ol('#E8AE62', 7));
  if (br > 1) {
    o += `<clipPath id="${id}"><path d="M-400 -400H400V400H-400Z M${f(bx - br)} ${f(by)}a${f(br)} ${f(br * 1.3)} 0 1 0 ${f(2 * br)} 0a${f(br)} ${f(br * 1.3)} 0 1 0 ${f(-2 * br)} 0Z" clip-rule="evenodd"/></clipPath>`;
    o += G(b, null, { 'clip-path': `url(#${id})` });
    let sc = '';
    for (let i = 0; i <= 6; i++) { const a = Math.PI * (0.55 + i / 6 * 0.9), px = bx + Math.cos(a) * br, py = by + Math.sin(a) * br * 1.3; sc += `${i ? 'L' : 'M'}${f(px)} ${f(py)}`; }
    o += P(sc, ln(5, '#B07A3A', 0.6));
  } else o += b;
  return G(o, tr(x, y, s, rot));
}
// coconut drink with a straw + paper umbrella
function coconut(x, y, s, rot = 0) {
  let o = P('M10 -60L40 -170', ln(10)) + P('M10 -60L40 -170', ln(5, '#FF5A8A'));
  o += P('M-6 -78Q30 -150 92 -110Z', ol('#FFD84D', 5)) + P('M-6 -78L44 -122L92 -110', ln(3));
  o += Ci(0, 0, 70, ol('#8A5A30', 7)) + P('M-66 -10Q0 -40 66 -10', ln(6, '#FFFFFF', 0.85)) + El(0, -26, 52, 16, ol('#FFF6E0', 5));
  return G(o, tr(x, y, s, rot));
}
// parasol (desert gag); (x, y) = hand grip
function parasol(x, y, s, rot = 0, t = 0) {
  let o = P('M0 0V-420', ln(12)) + P('M0 0V-420', ln(6, '#E8EEF8')) + P('M0 0q-26 4 -26 26', ln(10));
  let d = 'M-260 -420Q-130 -620 0 -640Q130 -620 260 -420Q195 -455 130 -420Q65 -455 0 -420Q-65 -455 -130 -420Q-195 -455 -260 -420Z';
  o += P(d, ol('#FFFFFF', 8)) + P('M-130 -420Q-90 -560 0 -640M130 -420Q90 -560 0 -640', ln(6, '#FFC93C')) + Ci(0, -646, 12, ol('#FFC93C', 5));
  return G(o, tr(x, y, s, rot + Math.sin(t * 2) * 2));
}
// framed "PATENT" certificate for ";teleport"
function patent(x, y, k, s = 1, rot = -5) {
  const sc = pop(k) * s;
  if (sc < 0.01) return '';
  let o = R(-300 + 12, -200 + 14, 600, 400, 18, { fill: '#000', opacity: 0.3 });
  o += R(-300, -200, 600, 400, 18, ol('#B07A2A', 9)) + R(-270, -170, 540, 340, 8, ol('#FFF7DE', 5)) + R(-256, -156, 512, 312, 6, { fill: 'none', stroke: '#E0B24A', 'stroke-width': 4 });
  o += T('PATENT No. 0001', 0, -104, 46, '#7A4A10') + TF('the command', 0, -54, 28, '#7A6A4A');
  o += TF(';teleport', 0, 12, 64, '#2A2140');
  o += TF('inventor:  ADMIN', 0, 72, 32, '#7A4A10') + TF('year: 1', 0, 112, 26, '#9A8A6A');
  o += Ci(200, 110, 44, ol('#E8453C', 5)) + P('M180 150L170 200L200 182L230 200L220 150', ol('#E8453C', 4)) + T('★', 200, 126, 50, '#FFD84D');
  return G(o, tr(x, y, sc, rot));
}
// a cat's pink tongue (licking): from (x, y) pointing down, length len, rot
function tongue(x, y, s, len, rot = 0) {
  if (len <= 1) return '';
  const w = 44;
  return G(P(`M${-w} 0Q${-w} ${f(len)} 0 ${f(len + 10)}Q${w} ${f(len)} ${w} 0Z`, ol('#FF8FA8', 6)) + P(`M0 6V${f(len * 0.75)}`, ln(5, '#E0607E')), tr(x, y, s, rot));
}
// a simple analogue clock face showing minutes elapsed (spins)
function clockFace(x, y, r, minutes, k = 1) {
  const sc = pop(k);
  if (sc < 0.01) return '';
  const am = (minutes / 60) * Math.PI * 2 - Math.PI / 2, ah = (minutes / 720) * Math.PI * 2 - Math.PI / 2;
  let o = Ci(0, 0, r, ol('#FFFFFF', 9)) + Ci(0, 0, r * 0.86, { fill: 'none', stroke: '#E8EEF8', 'stroke-width': 6 });
  let ticks = '';
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ticks += `M${f(Math.cos(a) * r * 0.78)} ${f(Math.sin(a) * r * 0.78)}L${f(Math.cos(a) * r * 0.9)} ${f(Math.sin(a) * r * 0.9)}`; }
  o += P(ticks, ln(7)) + P(`M0 0L${f(Math.cos(ah) * r * 0.45)} ${f(Math.sin(ah) * r * 0.45)}`, ln(14)) + P(`M0 0L${f(Math.cos(am) * r * 0.72)} ${f(Math.sin(am) * r * 0.72)}`, ln(9, '#E8243C')) + Ci(0, 0, 12, ol('#151515', 3));
  return G(o, tr(x, y, sc));
}

// ---------------------------------------------------------------- chat feed (the jail ping-pong log)
// entries: [{ who: 'you'|'ADMIN', text, a (typing start), b (enter) }]; shows the last n lines that started by t
function chatFeed(x, y, w, entries, t, opts = {}) {
  const { n = 5, lh = 64, s = 1 } = opts;
  const shown = entries.filter((e) => t >= e.a - 0.05).slice(-n);
  if (!shown.length) return '';
  const h = n * lh + 70;
  let o = R(-w / 2, -h, w, h, 26, { fill: '#10131C', opacity: 0.86, stroke: '#3A4560', 'stroke-width': 5 });
  o += TF('CHAT', -w / 2 + 26, -h + 38, 24, '#8A93A6', { 'text-anchor': 'start', 'letter-spacing': 3 });
  shown.forEach((e, i) => {
    const yy = -h + 90 + i * lh;
    const adm = e.who === 'ADMIN';
    const prog = clamp((t - e.a) / Math.max(0.05, e.b - e.a), 0, 1);
    const txt = e.text.slice(0, Math.round(prog * e.text.length));
    const fl = t >= e.b ? clamp(1 - (t - e.b) / 0.35, 0, 1) : 0;
    if (fl > 0) o += R(-w / 2 + 10, yy - 40, w - 20, lh - 6, 14, { fill: adm ? '#FFC93C' : '#3DFF9A', opacity: f(0.45 * fl) });
    o += TF(adm ? '[ADMIN]:' : '[you]:', -w / 2 + 26, yy, 32, adm ? '#FFD45A' : '#FFB13B', { 'text-anchor': 'start' });
    o += TF(esc(txt) + (t < e.b && Math.floor(t * 6) % 2 ? '|' : ''), -w / 2 + (adm ? 186 : 136), yy, 34, adm ? '#FFF6D0' : '#EAF2FF', { 'text-anchor': 'start' });
  });
  return G(o, tr(x, y, s));
}

module.exports = {
  K, S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, actor, A, SETS,
  R, P, Ci, El, G, tr, esc, OUT, outT, outTF, pop, at, shook, flash, whip, darken,
  lapProp, goldAura, hero, dissolve, tpBeam, tpSquash, spotCone, soundRings, logTag, kickedWindow,
  iceBlock, puddle, frost, hairDryer, sandwich, coconut, parasol, patent, tongue, clockFace, chatFeed,
};
