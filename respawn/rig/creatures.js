// Blocky creatures and small UI props shared by scenes.
'use strict';

const S = require('./svg');
const C = require('./palette');
const { f } = S;

const LINE = C.line;
const outline = (fill, w = 7) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const lineOnly = (w = 7, color = LINE) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });

// Front-view blocky chicken standing at (x, y). Units like the characters (~460 tall at s=1).
function chicken({ x = 0, y = 0, s = 1, look = 0, blink = 0, headRot = 0, headY = 0, flap = 0, squash = 0, shocked = false } = {}) {
  let o = '';
  o += S.ellipse(0, 0, 120, 16, { fill: C.shadow });
  // legs + feet
  for (const sx of [-1, 1]) {
    const lx = sx * 34;
    o += S.path(`M${lx} -118 L${lx} -14`, lineOnly(15, LINE)) + S.path(`M${lx} -118 L${lx} -14`, lineOnly(8, '#FF9F1C'));
    o += S.path(`M${lx} -10 L${lx - 26} 0 M${lx} -10 L${lx} 2 M${lx} -10 L${lx + 26} 0`, lineOnly(13, LINE)) + S.path(`M${lx} -10 L${lx - 26} 0 M${lx} -10 L${lx} 2 M${lx} -10 L${lx + 26} 0`, lineOnly(6, '#FF9F1C'));
  }
  let body = '';
  // wings (behind body edge)
  for (const sx of [-1, 1]) {
    body += S.g(S.path(S.roundedPath([[-26, -10], [26, -10], [30, 110], [-30, 110]], 18), outline('#F2F2F7')), `translate(${sx * 116} -262) rotate(${f(sx * (14 + flap))})`);
  }
  const id = S.uid('ck');
  const bd = S.roundedPath([[-112, -304], [112, -304], [112, -110], [-112, -110]], 40);
  body += S.clipDef(id, S.path(bd)) + S.path(bd, { fill: '#FFFFFF' }) +
    S.g(S.rect(-130, -150, 260, 50, 0, { fill: '#E6E7EF' }) + S.path('M-60 -250 Q0 -232 60 -250 M-70 -208 Q0 -190 70 -208', lineOnly(5, '#D6D8E4')), null, { 'clip-path': `url(#${id})` }) +
    S.path(bd, outline('none'));
  // head
  let head = '';
  head += S.circle(-30, -444, 22, outline('#FF3B4E', 6)) + S.circle(0, -462, 26, outline('#FF3B4E', 6)) + S.circle(30, -444, 22, outline('#FF3B4E', 6));
  const hid = S.uid('ch');
  const hd = S.roundedPath([[-74, -440], [74, -440], [74, -290], [-74, -290]], 32);
  head += S.clipDef(hid, S.path(hd)) + S.path(hd, { fill: '#FFFFFF' }) + S.g(S.rect(-90, -312, 180, 30, 0, { fill: '#E6E7EF' }), null, { 'clip-path': `url(#${hid})` }) + S.path(hd, outline('none'));
  // eyes
  for (const sx of [-1, 1]) {
    const ex = sx * 34 + look * 8, ey = -386;
    if (blink > 0.6) head += S.path(`M${ex - 12} ${ey} Q${ex} ${ey + 8} ${ex + 12} ${ey}`, lineOnly(7));
    else if (shocked) head += S.circle(ex, ey, 16, outline('#fff', 5)) + S.circle(ex, ey, 4, { fill: LINE });
    else head += S.ellipse(ex, ey, 10, 14 * (1 - blink * 0.9), { fill: LINE }) + S.circle(ex - 3, ey - 5, 3.5, { fill: '#fff' });
  }
  // beak + wattle
  head += S.path(`M${-28 + look * 6} -362 L${28 + look * 6} -362 L${look * 10} -326 Z`, outline('#FFC52E', 6));
  head += S.path(`M${-24 + look * 6} -352 L${24 + look * 6} -352`, lineOnly(4));
  head += S.path(`M${look * 6} -326 q-14 18 0 32 q14 -14 0 -32 Z`, outline('#FF3B4E', 5));
  o += S.g(body + S.g(head, `translate(0 ${f(headY)}) rotate(${f(headRot)} 0 -300)`), `translate(0 ${f(squash * 40)}) scale(${f(1 + squash * 0.1)} ${f(1 - squash * 0.15)})`);
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

// Roblox-style chat bubble anchored at its tail tip (x, y).
function chatBubble(text, x, y, { s = 1, pop = 1, size = 54, color = '#151515' } = {}) {
  const w = Math.max(140, text.length * size * 0.56 + 70), h = size + 46;
  const sc = s * pop;
  let o = S.path(S.roundedPath([[-w / 2, -h - 30], [w / 2, -h - 30], [w / 2, -30], [-w / 2, -30]], 26), { fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 6 });
  o += S.path('M-22 -33 L0 0 L22 -33 Z', { fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 6, 'stroke-linejoin': 'round' });
  o += S.rect(-24, -40, 48, 12, 0, { fill: '#FFFFFF' });
  o += S.el('text', { x: 0, y: -30 - h / 2 + size * 0.36, 'font-family': 'Fredoka, sans-serif', 'font-weight': 600, 'font-size': size, fill: color, 'text-anchor': 'middle' }, text);
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(sc)})`);
}

module.exports = { chicken, chatBubble };

// ---- extra pets for the grind montage
const S2 = require('./svg');
function toastDog({ x = 0, y = 0, s = 1, t = 0, wag = 1 } = {}) {
  const ol2 = (fill, w = 6) => ({ fill, stroke: '#151515', 'stroke-width': w, 'stroke-linejoin': 'round' });
  let o = S2.ellipse(0, 4, 110, 14, { fill: 'rgba(0,0,0,0.16)' });
  for (const lx of [-70, -30, 30, 70]) o += S2.rect(lx - 12, -60, 24, 62, 6, ol2('#D99A4E', 5));
  o += S2.g(S2.rect(-10, -16, 20, 70, 8, ol2('#D99A4E', 5)), `translate(-110 -120) rotate(${-40 + 20 * Math.sin(t * 14 * wag)})`);
  o += S2.rect(-120, -170, 240, 120, 30, ol2('#E8B26A', 7)) + S2.rect(-104, -156, 208, 92, 20, { fill: '#F5D49A' });
  o += S2.rect(50, -270, 140, 130, 34, ol2('#E8B26A', 7)) + S2.rect(64, -256, 112, 102, 24, { fill: '#F5D49A' });
  o += S2.rect(40, -290, 40, 60, 14, ol2('#C98B48', 5)) + S2.rect(160, -290, 40, 60, 14, ol2('#C98B48', 5));
  o += S2.circle(100, -214, 9, { fill: '#151515' }) + S2.circle(150, -214, 9, { fill: '#151515' }) + S2.ellipse(176, -186, 12, 9, { fill: '#151515' }) + S2.path('M110 -176 Q125 -164 140 -176', { fill: 'none', stroke: '#151515', 'stroke-width': 5, 'stroke-linecap': 'round' });
  o += S2.path('M110 -168 q8 22 16 0', { fill: '#FF6F8A', stroke: '#151515', 'stroke-width': 4 });
  return S2.g(o, `translate(${x} ${y}) scale(${s})`);
}
function floatingEye({ x = 0, y = 0, s = 1, t = 0, look = [0, 0] } = {}) {
  const bob = Math.sin(t * 2) * 14;
  let o = S2.ellipse(0, 200, 70, 12, { fill: 'rgba(0,0,0,0.12)' });
  o += S2.circle(0, bob, 110, { fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 8 });
  o += S2.path(`M-90 ${bob - 30} q20 10 30 0 M80 ${bob + 40} q-14 -6 -24 6`, { fill: 'none', stroke: '#FF5A6A', 'stroke-width': 4 });
  o += S2.circle(look[0] * 40, bob + look[1] * 30, 52, { fill: '#8A4FD8', stroke: '#151515', 'stroke-width': 6 }) + S2.circle(look[0] * 46, bob + look[1] * 34, 26, { fill: '#151515' }) + S2.circle(look[0] * 46 - 12, bob + look[1] * 34 - 12, 9, { fill: '#FFFFFF' });
  return S2.g(o, `translate(${x} ${y}) scale(${s})`);
}
function chickenShades(opts = {}) {
  const c = chicken(opts);
  const sx = opts.x || 0, sy = opts.y || 0, s = opts.s || 1;
  const shades = S2.path('M-70 -400 L70 -400', { stroke: '#151515', 'stroke-width': 8 }) + S2.rect(-74, -406, 64, 34, 10, { fill: '#151515' }) + S2.rect(10, -406, 64, 34, 10, { fill: '#151515' }) + S2.rect(-64, -400, 22, 8, 3, { fill: '#FFFFFF', opacity: 0.6 });
  return c + S2.g(shades, `translate(${sx} ${sy}) scale(${s})`);
}
module.exports.toastDog = toastDog;
module.exports.floatingEye = floatingEye;
module.exports.chickenShades = chickenShades;
