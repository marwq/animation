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
