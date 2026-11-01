// More environments: living room (with the couch Dad sinks into), the front door,
// the cube Earth in space, world-obby postcards, the system message in the sky.
'use strict';

const S = require('../rig/svg');
const E = require('./env');
const { f, clamp, lerp } = S;
const LINE = '#151515';
const ol = (fill, w = 6) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const ln = (w, c = LINE, op) => ({ fill: 'none', stroke: c, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...(op !== undefined ? { opacity: op } : {}) });
const R = (x, y, w, h, r = 0, a = {}) => S.rect(x, y, w, h, r, a);
const T = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

// tiny generic avatar for distant crowds (front view), (x, y) = feet
function mini(x, y, s, col, head = '#F5CD3D', ph = 0, t = 0, jump = 0) {
  const by = -Math.abs(Math.sin(t * 6 + ph)) * jump;
  const o = R(-14, -40, 12, 40, 3, ol('#2B2F3A', 2)) + R(2, -40, 12, 40, 3, ol('#2B2F3A', 2)) + R(-18, -82, 36, 44, 5, ol(col, 2.5)) +
    R(-15, -112, 30, 30, 6, ol(head, 2.5)) + R(-28, -80, 10, 34, 3, ol(head, 2)) + R(18, -80, 10, 34, 3, ol(head, 2));
  return S.g(o, `translate(${f(x)} ${f(y + by)}) scale(${f(s)})`);
}

// ---------------------------------------------------------------- living room
function livingLayers(cam, t) {
  let back = R(-400, -300, 2720, 1500, 0, { fill: '#BFE9D9' }) + R(-400, -300, 2720, 1500, 0, { fill: 'url(#wallStripes)', opacity: 0.6 });
  back += R(-400, 820, 2720, 600, 0, { fill: '#C98B55' }) + R(-400, 820, 2720, 600, 0, { fill: 'url(#planks)' }) + R(-400, 802, 2720, 24, 0, ol('#FFFFFF', 5));
  // window
  back += R(1340, 170, 420, 330, 12, ol('#FFFFFF', 8)) + R(1360, 190, 380, 290, 6, { fill: 'url(#skyDay)' }) + S.path('M1550 190 L1550 480 M1360 335 L1740 335', ln(10, '#FFFFFF'));
  // framed family photo: three noobs
  back += S.g(R(-120, -90, 240, 180, 10, ol('#C98B55', 8)) + R(-104, -74, 208, 148, 4, { fill: '#FFF3D6' }) + mini(-50, 60, 1, '#1E73E8') + mini(0, 60, 1.1, '#FF7AA8', '#FFFFFF') + mini(50, 60, 0.9, '#1E2331', '#FFFFFF'), 'translate(420 300) rotate(-3)');
  // TV + stand
  back += R(700, 470, 300, 30, 8, ol('#8A5A33', 6)) + R(730, 300, 240, 170, 14, ol('#2B2F3A', 7)) + R(746, 316, 208, 138, 8, { fill: '#34C3FF' }) + S.path('M760 440 L900 330', ln(10, '#FFFFFF', 0.4));
  // lamp
  back += R(160, 520, 16, 300, 6, ol('#2B2F3A', 5)) + S.path('M100 520 L236 520 L206 420 L130 420 Z', ol('#FFE14D', 6)) + S.circle(168, 560, 120, { fill: 'url(#sunGlow)', opacity: 0.4 });
  // rug
  back += S.ellipse(960, 950, 620, 90, ol('#FF8FB0', 6)) + S.ellipse(960, 950, 520, 66, ln(6, '#FFFFFF', 0.7));
  // couch back (the part behind whoever sits)
  back += R(560, 560, 800, 200, 60, ol('#3B8BFF', 8)) + R(600, 580, 340, 150, 40, ol('#5AA0FF', 6)) + R(980, 580, 340, 150, 40, ol('#5AA0FF', 6));
  // couch front (seat cushions + arms) — drawn over the sitter
  let front = R(520, 730, 880, 130, 40, ol('#3B8BFF', 8)) + R(600, 712, 350, 90, 36, ol('#6FAEFF', 6)) + R(970, 712, 350, 90, 36, ol('#6FAEFF', 6));
  front += R(480, 600, 140, 270, 50, ol('#2F78E8', 8)) + R(1300, 600, 140, 270, 50, ol('#2F78E8', 8)) + R(560, 860, 40, 40, 8, ol('#8A5A33', 5)) + R(1320, 860, 40, 40, 8, ol('#8A5A33', 5));
  return { back: E.layer(back, cam, 1), front: E.layer(front, cam, 1) };
}

// ---------------------------------------------------------------- front door (interior, looking out)
function doorShot(t, open, cam) {
  let o = R(-400, -300, 2720, 1500, 0, { fill: '#FFD9A8' }) + R(-400, 820, 2720, 600, 0, { fill: '#C98B55' }) + R(-400, 820, 2720, 600, 0, { fill: 'url(#planks)' });
  o += R(640, 120, 640, 720, 12, ol('#8A5A33', 10));
  // outside light behind the door
  const L = E.townLayers({ zoom: 1.6, fx: 960, fy: 600, x: 2600 }, t);
  o += S.clipDef('doorClip', R(670, 150, 580, 690));
  o += S.g(L.bg + L.street, null, { 'clip-path': 'url(#doorClip)' });
  o += R(670, 150, 580, 690, 0, { fill: '#FFFFFF', opacity: f(0.9 * clamp(1 - open * 1.4, 0, 1) + 0.25 * open) });
  // the door leaf swings open (scaled toward the hinge)
  const w = 580 * (1 - open * 0.92);
  o += S.g(R(0, 0, 580, 690, 6, ol('#FF8A5B', 8)) + R(60, 60, 200, 260, 10, ln(6, '#D9663A')) + R(320, 60, 200, 260, 10, ln(6, '#D9663A')) + R(60, 380, 460, 240, 10, ln(6, '#D9663A')) + S.circle(510, 360, 18, ol('#FFD34D', 5)),
    `translate(670 150) scale(${f(w / 580)} 1)`);
  // light rays spilling in
  if (open > 0.2) o += S.path('M670 840 L1250 840 L1700 1100 L220 1100 Z', { fill: '#FFF6D8', opacity: f(0.5 * open) });
  return E.layer(o, cam, 1);
}

// ---------------------------------------------------------------- cube Earth
function cubeEarth(t, cx = 960, cy = 560, s = 1, rot = 0) {
  let o = '';
  // space
  o += R(-400, -300, 2720, 1700, 0, { fill: '#0B1033' });
  for (let i = 0; i < 120; i++) o += R(hash(i) * 1920, hash(i * 7) * 1080, 3 + hash(i * 3) * 4, 3 + hash(i * 3) * 4, 1, { fill: '#FFFFFF', opacity: f(0.3 + 0.6 * Math.abs(Math.sin(t * 1.5 + i))) });
  // isometric cube planet
  const a = 260 * s;
  const top = `M0 ${-a} L${a * 0.87} ${-a / 2} L0 0 L${-a * 0.87} ${-a / 2} Z`;
  const left = `M${-a * 0.87} ${-a / 2} L0 0 L0 ${a} L${-a * 0.87} ${a / 2} Z`;
  const right = `M${a * 0.87} ${-a / 2} L0 0 L0 ${a} L${a * 0.87} ${a / 2} Z`;
  let p = S.circle(0, 0, a * 1.6, { fill: 'url(#softWhite)', opacity: 0.12 });
  p += S.path(top, ol('#3FA9FF', 7)) + S.path(left, ol('#2C8BE0', 7)) + S.path(right, ol('#2378C8', 7));
  // pixel continents on the faces
  const land = (face, k, n) => {
    let g = '';
    for (let i = 0; i < n; i++) {
      const u = hash(i * 13 + k), v = hash(i * 17 + k);
      const sz = 0.12 + 0.12 * hash(i * 5 + k);
      if (face === 'top') {
        const px = (u - v) * a * 0.87 * 0.8, py = -a / 2 + (u + v - 1) * a / 2 * 0.8;
        g += S.path(`M${f(px)} ${f(py - sz * a / 2)} L${f(px + sz * a * 0.87)} ${f(py)} L${f(px)} ${f(py + sz * a / 2)} L${f(px - sz * a * 0.87)} ${f(py)} Z`, { fill: i % 3 ? '#3BD16F' : '#7BCB3A' });
      } else {
        const sx = face === 'left' ? -1 : 1;
        const px = sx * a * 0.87 * (0.15 + u * 0.7), py = (0.1 + v * 0.75) * a + (sx * px) * -0.58 * (sx > 0 ? 1 : 1) * 0;
        const yy = py - (Math.abs(px) / (a * 0.87)) * a / 2;
        g += S.path(`M${f(px)} ${f(yy)} l${f(sx * sz * a * 0.87)} ${f(-sz * a / 2)} l0 ${f(sz * a)} l${f(-sx * sz * a * 0.87)} ${f(sz * a / 2)} Z`, { fill: i % 2 ? '#2FAE6E' : '#5DA42A' });
      }
    }
    return g;
  };
  p += land('top', 1, 9) + land('left', 2, 6) + land('right', 3, 6);
  p += S.path(`M${-a * 0.87} ${-a / 2} L0 0 L${a * 0.87} ${-a / 2} M0 0 L0 ${a}`, ln(7));
  // blocky clouds orbiting
  for (let i = 0; i < 4; i++) { const ang = t * 0.6 + i * 1.57; p += R(Math.cos(ang) * a * 1.25 - 40, Math.sin(ang) * a * 0.45 - a * 0.2 - 14, 80, 28, 10, { fill: '#FFFFFF', opacity: Math.sin(ang) > 0 ? 0.95 : 0.5 }); }
  o += S.g(p, `translate(${f(cx)} ${f(cy)}) rotate(${f(rot)})`);
  return o;
}

// ---------------------------------------------------------------- postcards: Eiffel obby, Great Wall obby, ocean kill brick
function eiffelObby(t) {
  let o = R(-400, -300, 2720, 1700, 0, { fill: 'url(#skyMorning)' }) + E.sun(1560, 260, 110, t) + E.cloud(200 + t * 20, 160, 0.8, '#FFF4FA', '#FFD3E6');
  o += R(-400, 900, 2720, 400, 0, { fill: '#7FD77A' }) + R(-400, 900, 2720, 400, 0, { fill: 'url(#studs)' });
  // tower built from blocks
  const levels = [[960, 900, 520, 140], [960, 760, 380, 160], [960, 600, 240, 200], [960, 400, 130, 220], [960, 180, 60, 120]];
  for (const [x, y, w, h] of levels) o += S.path(`M${x - w / 2} ${y} L${x - w * 0.36} ${y - h} L${x + w * 0.36} ${y - h} L${x + w / 2} ${y} Z`, ol('#6B5A7A', 7)) + S.path(`M${x - w * 0.2} ${y} L${x} ${y - h * 0.55} L${x + w * 0.2} ${y} Z`, { fill: '#8A7AA0' });
  for (const [x, y, w] of [[960, 760, 420], [960, 600, 290], [960, 400, 170]]) o += R(x - w / 2, y - 14, w, 28, 6, ol('#4E4060', 5));
  // colourful obby platforms sticking out, with tiny players jumping between them
  const plats = [[620, 820, '#FF5A5A'], [1290, 700, '#FFB000'], [700, 560, '#3BD16F'], [1220, 430, '#3B8BFF'], [800, 300, '#B06BFF'], [1120, 200, '#FF6FB5']];
  plats.forEach(([x, y, c], i) => { o += R(x - 60, y, 120, 26, 8, ol(c, 5)); o += mini(x + Math.sin(t * 3 + i) * 20, y, 0.6, ['#FF5A5A', '#3B8BFF', '#3BD16F'][i % 3], '#F5CD3D', i, t, 30); });
  o += S.g(R(-200, -50, 400, 100, 20, ol('#FFFFFF', 6)) + T('PARIS OBBY', 0, 22, 56, '#1F2233'), 'translate(330 160) rotate(-4)');
  return o;
}

function wallObby(t) {
  let o = R(-400, -300, 2720, 1700, 0, { fill: 'url(#skyDay)' }) + E.sun(260, 200, 90, t);
  o += S.path('M-400 640 Q200 520 700 640 T1700 600 T2400 640 L2400 1400 L-400 1400 Z', { fill: '#5FB86A' }) + S.path('M-400 780 Q300 660 900 780 T2400 760 L2400 1400 L-400 1400 Z', { fill: '#4CA35A' });
  // the wall snaking into the distance
  let pts = [];
  for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push([lerp(-200, 2200, u), 900 - Math.sin(u * 7) * 120 - u * 260]); }
  const top = pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L');
  const bot = pts.slice().reverse().map((p) => `${f(p[0])} ${f(p[1] + 70 - 40 * (p[0] / 2200))}`).join(' L');
  o += S.path(`M${top} L${bot} Z`, ol('#C9B08A', 6));
  for (let i = 0; i < 40; i += 2) o += R(pts[i][0] - 14, pts[i][1] - 22, 28, 24, 3, ol('#B59A72', 3));
  // gaps with obby blocks + kill bricks
  for (let i = 4; i < 40; i += 6) { const [x, y] = pts[i]; o += R(x - 40, y - 70, 50, 20, 5, ol(['#FF5A5A', '#FFB000', '#3B8BFF'][i % 3], 4)); o += mini(x - 20, y - 70, 0.45, '#3BD16F', '#F5CD3D', i, t, 26); }
  o += S.g(R(-260, -50, 520, 100, 20, ol('#FFFFFF', 6)) + T('GREAT WALL OBBY', 0, 22, 54, '#1F2233'), 'translate(1500 180) rotate(3)');
  o += T('STAGE 1 / 99,999', 1500, 290, 40, '#FFFFFF', { stroke: LINE, 'stroke-width': 7, 'paint-order': 'stroke' });
  return o;
}

function oceanKill(t, oof = 0) {
  let o = R(-400, -300, 2720, 1700, 0, { fill: 'url(#skyDay)' }) + E.cloud(300, 150, 0.9) + E.cloud(1300, 100, 0.7);
  const glow = 0.5 + 0.5 * Math.sin(t * 6);
  o += R(-400, 560, 2720, 900, 0, { fill: '#FF3B3B' }) + R(-400, 560, 2720, 900, 0, { fill: '#FF8A3D', opacity: f(0.4 * glow) });
  for (let i = 0; i < 9; i++) o += S.path(`M${f(-200 + i * 260 + (t * 60) % 260)} ${620 + (i % 3) * 120} q60 -30 120 0`, ln(8, '#FFD0A0', 0.7));
  // beach + sign
  o += S.path('M-400 900 L700 900 L500 1400 L-400 1400 Z', ol('#FFE3A8', 6)) + R(260, 640, 18, 270, 4, ol('#8A5A33', 5));
  o += S.g(S.path('M-150 -70 L150 -70 L150 70 L-150 70 Z', ol('#FFE14D', 7)) + T('⚠ KILL BRICK', 0, 18, 50, '#151515'), 'translate(270 600) rotate(-4)');
  // a swimmer touches it: pieces fly
  if (oof > 0) {
    const k = clamp(oof, 0, 1);
    for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.4; o += R(1200 + Math.cos(a) * 260 * k - 15, 640 + Math.sin(a) * 260 * k + 300 * k * k - 15, 30, 30, 5, ol(['#3B8BFF', '#F5CD3D', '#3BD16F'][i % 3], 4)); }
    o += T('OOF!', 1200, 520 - 40 * k, 120, '#FFFFFF', { stroke: LINE, 'stroke-width': 14, 'paint-order': 'stroke' });
  } else {
    o += mini(1200, 660, 1.4, '#3B8BFF', '#F5CD3D', 0, t, 10);
  }
  return o;
}

// ---------------------------------------------------------------- system message window in the sky
function skyMessage(lines, k, opts = {}) {
  if (k <= 0) return '';
  const w = opts.w || 1300, h = opts.h || 420;
  let o = R(-w / 2, -h / 2, w, h, 40, { fill: '#121628', opacity: 0.93, stroke: '#FFFFFF', 'stroke-width': 8 });
  o += R(-w / 2, -h / 2, w, 90, 40, { fill: opts.headCol || '#E8243C' }) + R(-w / 2, -h / 2 + 50, w, 40, 0, { fill: opts.headCol || '#E8243C' });
  o += T(opts.title || '⚠ SYSTEM MESSAGE', 0, -h / 2 + 64, 56, '#FFFFFF');
  lines.forEach((l, i) => { o += S.el('text', { x: 0, y: -h / 2 + 170 + i * 84, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': l.size || 62, fill: l.col || '#FFFFFF', 'text-anchor': 'middle' }, l.text); });
  const s = S.ease.outBack(clamp(k, 0, 1));
  return S.g(o, `translate(${opts.x || 960} ${opts.y || 330}) scale(${f(s)})`);
}

module.exports = { livingLayers, doorShot, cubeEarth, eiffelObby, wallObby, oceanKill, skyMessage, mini };
