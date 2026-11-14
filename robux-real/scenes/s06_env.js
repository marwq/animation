// Private helpers shared by SC 06 / SC 06b / SC 07: hats, hoverboard, RGB colours, Ty's house, cut flashes, chat pop-ups.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const C = K.C;
const { D } = require('../rig/cast');
const { makeDesign, makeDraw } = require('../rig/r6');

// ---------------------------------------------------------------- colour helpers
const hue = (h, s = 95, l = 60) => `hsl(${f(((h % 360) + 360) % 360)},${s}%,${l}%)`;
const rgb = (t, off = 0, s = 95, l = 60) => hue(t * 140 + off, s, l);

// ---------------------------------------------------------------- hats (origin = brim centre, ~240 px wide at s=1)
function hat(kind, col = '#C0392B', band = '#2A1E3A') {
  let o = '';
  switch (kind) {
    case 'fedora':
      o += S.ellipse(0, -4, 124, 26, ol(col, 6));
      o += S.path('M-72 -8 L-64 -96 Q-34 -118 0 -100 Q34 -118 64 -96 L72 -8 Q0 6 -72 -8 Z', ol(col, 6));
      o += S.path('M-70 -34 Q0 -22 70 -34 L68 -12 Q0 0 -70 -12 Z', ol(band, 4));
      o += S.path('M-20 -98 Q0 -80 20 -98', ln(4, '#0004'));
      break;
    case 'top':
      o += S.ellipse(0, -4, 112, 22, ol(band, 6));
      o += S.rect(-62, -176, 124, 172, 10, ol(band, 6)) + S.ellipse(0, -176, 62, 14, ol('#3A3050', 5));
      o += S.rect(-62, -54, 124, 26, 0, ol(col, 4));
      o += S.rect(-48, -160, 18, 96, 8, { fill: '#FFFFFF', opacity: 0.18 });
      break;
    case 'cowboy':
      o += S.path('M-62 -6 L-54 -96 Q-26 -112 0 -92 Q26 -112 54 -96 L62 -6 Z', ol(col, 6));
      o += S.path('M-160 -36 Q-130 16 0 12 Q130 16 160 -36 Q120 -4 0 -12 Q-120 -4 -160 -36 Z', ol(col, 6));
      o += S.path('M-58 -30 Q0 -22 58 -30 L58 -16 Q0 -8 -58 -16 Z', ol(band, 4));
      break;
    case 'cap':
      o += S.path('M-84 0 Q-84 -110 0 -110 Q84 -110 84 0 Z', ol(col, 6));
      o += S.path('M30 -10 Q140 -20 170 4 Q120 18 30 10 Z', ol(band, 6));
      o += S.circle(0, -110, 12, ol(band, 4)) + S.path('M0 -110 L0 -4', ln(4, '#0003'));
      break;
    case 'party':
      o += S.path('M-66 0 L0 -190 L66 0 Z', ol(col, 6));
      o += S.path('M-44 -64 L44 -64 M-22 -128 L22 -128', ln(14, '#FFFFFF', 0.7));
      o += S.circle(0, -196, 22, ol('#FFE14D', 5));
      break;
    case 'wizard':
      o += S.ellipse(0, -4, 120, 24, ol(col, 6));
      o += S.path('M-66 -8 L-10 -150 Q10 -210 70 -214 Q30 -180 30 -150 L66 -8 Z', ol(col, 6));
      o += K.F.sparkle(-8, -70, 20, '#FFE14D') + K.F.sparkle(22, -120, 12, '#FFE14D');
      break;
    case 'crown':
      o += S.path('M-84 0 L-92 -96 L-46 -50 L0 -118 L46 -50 L92 -96 L84 0 Z', ol('#FFC93C', 6));
      o += S.rect(-84, -26, 168, 26, 6, ol('#E0A21A', 5));
      o += S.circle(-46, -13, 9, ol('#FF4D6D', 3)) + S.circle(0, -13, 10, ol('#34C3FF', 3)) + S.circle(46, -13, 9, ol('#3BD16F', 3));
      break;
    case 'beanie':
      o += S.path('M-82 -20 Q-82 -134 0 -134 Q82 -134 82 -20 Z', ol(col, 6));
      o += S.rect(-88, -34, 176, 38, 12, ol(band, 6));
      o += S.circle(0, -144, 22, ol('#FFFFFF', 5));
      break;
    case 'viking':
      o += S.path('M-80 -6 Q-80 -120 0 -120 Q80 -120 80 -6 Z', ol('#AEB6C4', 6));
      o += S.path('M-74 -60 Q-150 -80 -140 -170 Q-120 -110 -70 -96 Z M74 -60 Q150 -80 140 -170 Q120 -110 70 -96 Z', ol('#FFF4D6', 6));
      o += S.rect(-84, -26, 168, 26, 6, ol('#8A93A3', 5));
      break;
    case 'chef':
      o += S.rect(-56, -70, 112, 70, 8, ol('#FFFFFF', 6));
      o += S.circle(-46, -96, 44, ol('#FFFFFF', 6)) + S.circle(46, -96, 44, ol('#FFFFFF', 6)) + S.circle(0, -122, 50, ol('#FFFFFF', 6));
      o += S.rect(-52, -80, 104, 30, 0, { fill: '#FFFFFF' });
      break;
    case 'cone':
      o += S.rect(-90, -16, 180, 20, 6, ol('#FF7A1A', 6)) + S.path('M-60 -16 L-14 -170 L14 -170 L60 -16 Z', ol('#FF7A1A', 6));
      o += S.path('M-46 -60 L46 -60 M-30 -112 L30 -112', ln(16, '#FFFFFF'));
      break;
    default:
      o += S.ellipse(0, -4, 110, 24, ol(col, 6)) + S.path('M-64 -8 Q-64 -110 0 -110 Q64 -110 64 -8 Z', ol(col, 6));
  }
  return o;
}
const HAT_KINDS = ['fedora', 'top', 'cowboy', 'cap', 'party', 'wizard', 'crown', 'beanie', 'viking', 'chef', 'cone', 'bowler'];
const HAT_COLS = ['#FF5A5A', '#34C3FF', '#FFD21F', '#3BD16F', '#B06BFF', '#FF6FB5', '#FF9F1C', '#2E3A55', '#8A5A34', '#1FB5A8'];
const randHat = (i) => hat(HAT_KINDS[Math.floor(hash(i * 3.7 + 1) * HAT_KINDS.length)], HAT_COLS[Math.floor(hash(i * 5.3 + 2) * HAT_COLS.length)], HAT_COLS[Math.floor(hash(i * 9.1 + 4) * HAT_COLS.length)]);
const placeHat = (svg, x, y, s, rot = 0) => S.g(svg, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);

// the glowing rainbow "Sparkle Time Fedora"
function sparkleFedora(t, glow = 1) {
  let o = '';
  if (glow > 0) o += K.rays(0, -60, 14, 330 * glow, '#FFFFFF', 0.22 * glow, t * 40) + S.ellipse(0, -60, 210 * glow, 150 * glow, { fill: 'url(#s06glow)' });
  o += S.ellipse(0, -4, 128, 28, ol('url(#s06rainbow)', 6));
  o += S.path('M-74 -8 L-66 -100 Q-34 -122 0 -104 Q34 -122 66 -100 L74 -8 Q0 6 -74 -8 Z', ol('url(#s06rainbow)', 6));
  o += S.path('M-72 -36 Q0 -24 72 -36 L70 -12 Q0 0 -72 -12 Z', ol('#5B2A9A', 4));
  o += S.path('M-50 -88 Q-40 -98 -24 -100', ln(8, '#FFFFFF', 0.7));
  for (let i = 0; i < 5; i++) {
    const a = t * 2 + i * 1.26, r = 0.5 + 0.5 * Math.sin(t * 6 + i * 2);
    o += K.F.sparkle(Math.cos(a) * 120, -60 + Math.sin(a) * 70, 10 + 16 * r, i % 2 ? '#FFFFFF' : '#FFE14D');
  }
  return o;
}

// hats tile (static pattern) for hat mountains
function hatTile(id) {
  const Wt = 420, Ht = 260;
  let o = '';
  for (let i = 0; i < 16; i++) {
    const x = hash(i * 3.1 + 7) * Wt, y = hash(i * 5.7 + 3) * Ht, r = (hash(i * 1.3) - 0.5) * 70, s = 0.42 + hash(i * 2.2) * 0.22;
    for (const dx of [-Wt, 0, Wt]) for (const dy of [-Ht, 0, Ht]) {
      if (x + dx < -90 || x + dx > Wt + 90 || y + dy < -90 || y + dy > Ht + 90) continue;
      o += placeHat(randHat(i + 30), x + dx, y + dy + 30, s, r);
    }
  }
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${Wt}" height="${Ht}"><rect width="${Wt}" height="${Ht}" fill="#7A4FA8"/>${o}</pattern>`;
}

// a mound of hats: base y, from x0 to x1, peak height h; silhouette hats on top
function hatMound(x0, x1, base, h, seed = 1, t = 0, extra = 1) {
  const n = 18;
  let d = `M${x0} ${base}`;
  const top = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = lerp(x0, x1, u);
    const y = base - h * Math.pow(Math.sin(Math.PI * u), 0.8) - (hash(i + seed * 13) - 0.5) * 30;
    top.push([x, y]);
    d += ` L${f(x)} ${f(y)}`;
  }
  d += ` L${x1} ${base + 400} L${x0} ${base + 400} Z`;
  let o = S.path(d, { fill: 'url(#s06hats)', stroke: '#151515', 'stroke-width': 6 });
  if (extra) {
    top.forEach(([x, y], i) => {
      if (i === 0 || i === n || i % 2) return;
      o += placeHat(randHat(i + seed * 7), x, y + 26, 0.5 + hash(i + seed) * 0.15, (hash(i * 3 + seed) - 0.5) * 40 + Math.sin(t * 2 + i) * 2);
    });
  }
  return o;
}

// ---------------------------------------------------------------- hoverboard
function hoverboard(x, y, s = 1, t = 0, gold = true) {
  let o = S.ellipse(0, 46, 170, 16, { fill: '#5CF2FF', opacity: 0.35 + 0.15 * Math.sin(t * 20) }) + S.ellipse(0, 70, 120, 10, { fill: '#5CF2FF', opacity: 0.2 });
  o += S.ellipse(0, 0, 200, 34, ol(gold ? '#FFC93C' : '#34C3FF', 7)) + S.ellipse(0, -6, 150, 14, { fill: '#FFF1B0', opacity: 0.8 });
  o += S.rect(-130, 18, 40, 14, 6, ol('#5CF2FF', 4)) + S.rect(90, 18, 40, 14, 6, ol('#5CF2FF', 4));
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

// ---------------------------------------------------------------- Ty's house (mint-green two-storey, coral roof, white trim)
// x = centre, base = ground y. width ~ 900 at s=1. holeK > 0: hats burst through the roof
function tyHouse(x, base, s = 1, t = 0, opts = {}) {
  const { hole = 0, winHats = 0, night = 0 } = opts;
  const wall = '#9EE6C8', wallSh = '#7FCFAF', roof = '#FF7F6B', roofSh = '#E05E4B', trim = '#FFFFFF';
  let o = '';
  // chimney
  o += S.rect(220, -760, 80, 160, 6, ol('#D9826E', 6));
  // walls
  o += S.rect(-420, -560, 840, 560, 8, ol(wall, 7));
  o += S.rect(-420, -290, 840, 22, 0, ol(trim, 5));
  for (let y = -540; y < 0; y += 40) o += S.path(`M-414 ${y} L414 ${y}`, ln(2, wallSh, 0.7));
  // roof
  if (!hole) {
    o += S.path('M-480 -548 L0 -830 L480 -548 Z', ol(roof, 7)) + S.path('M-480 -548 L480 -548', ln(16, trim)) + S.path('M-470 -548 L480 -548', ln(5));
    o += S.path('M-300 -620 L-120 -725', ln(10, '#FFFFFF', 0.25));
  } else {
    // broken roof: two halves pushed apart by the hat mountain
    o += S.path('M-480 -548 L-170 -730 L-120 -660 L-200 -600 L-150 -548 Z', ol(roof, 7));
    o += S.path('M480 -548 L170 -730 L130 -650 L210 -600 L160 -548 Z', ol(roof, 7));
    o += S.path('M-480 -548 L-150 -548 M160 -548 L480 -548', ln(16, trim));
  }
  // windows (upper + lower)
  const win = (wx, wy, w, h, lit) => {
    let g = S.rect(wx, wy, w, h, 8, ol(night ? (lit ? '#FFE9A8' : '#3A3F6A') : '#CFF3FF', 6));
    if (!night) g += S.path(`M${wx + w * 0.15} ${wy + h * 0.85} L${wx + w * 0.5} ${wy + h * 0.15} L${wx + w * 0.68} ${wy + h * 0.15} L${wx + w * 0.33} ${wy + h * 0.85} Z`, { fill: '#FFFFFF', opacity: 0.6 });
    g += S.path(`M${wx + w / 2} ${wy} L${wx + w / 2} ${wy + h} M${wx} ${wy + h / 2} L${wx + w} ${wy + h / 2}`, ln(6, trim));
    g += S.rect(wx - 12, wy + h - 4, w + 24, 18, 5, ol(trim, 5));
    return g;
  };
  o += win(-340, -500, 170, 150, 1) + win(170, -500, 170, 150, 0);
  if (winHats) {
    // hats spilling out of the upstairs windows
    for (let i = 0; i < 6; i++) o += placeHat(randHat(i + 70), -300 + (i % 3) * 50, -350 + Math.floor(i / 3) * 30 - 40 * winHats, 0.36, (hash(i) - 0.5) * 60);
    for (let i = 0; i < 6; i++) o += placeHat(randHat(i + 90), 210 + (i % 3) * 50, -350 + Math.floor(i / 3) * 30 - 40 * winHats, 0.36, (hash(i * 2) - 0.5) * 60);
  }
  o += win(-340, -230, 170, 150, 1) + win(170, -230, 170, 150, 1);
  // door + porch
  o += S.rect(-80, -240, 160, 240, 10, ol('#FF9C8A', 7)) + S.rect(-60, -220, 120, 90, 8, { fill: '#FFFFFF', opacity: 0.25 }) + S.circle(48, -110, 9, ol('#FFD34D', 3));
  o += S.rect(-130, -14, 260, 18, 5, ol('#E6E6EE', 5));
  // little coin-badge plaque (Ty lives here)
  o += S.circle(0, -266, 22, ol('#FFC93C', 5));
  return S.g(o, `translate(${f(x)} ${f(base)}) scale(${f(s)})`);
}

// simple tree & bush
function bushy(x, base, s = 1, c = '#4CC46A') {
  const o = S.circle(-60, -50, 60, ol(c, 6)) + S.circle(20, -80, 76, ol(c, 6)) + S.circle(90, -44, 54, ol(c, 6)) + S.rect(-120, -40, 260, 44, 20, { fill: c }) + S.path('M-120 4 L150 4', ln(6)) + S.circle(0, -110, 20, { fill: '#FFFFFF', opacity: 0.25 });
  return S.g(o, `translate(${f(x)} ${f(base)}) scale(${f(s)})`);
}
function tree(x, base, s = 1, c = '#3FBF5A', t = 0) {
  const sw = Math.sin(t * 1.4 + x) * 3;
  let o = S.rect(-22, -260, 44, 262, 8, ol('#8A5A34', 6));
  o += S.g(S.circle(-70, -300, 90, ol(c, 6)) + S.circle(60, -320, 100, ol(c, 6)) + S.circle(0, -400, 100, ol(c, 6)) + S.circle(-30, -430, 30, { fill: '#FFFFFF', opacity: 0.2 }), `rotate(${f(sw)} 0 -260)`);
  return S.g(o, `translate(${f(x)} ${f(base)}) scale(${f(s)})`);
}

// ---------------------------------------------------------------- transitions
// whip pan streaks: k 0..1..0 around a cut
function whip(k, dir = 1) {
  if (k <= 0) return '';
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: f(0.5 * k) });
  for (let i = 0; i < 18; i++) {
    const y = hash(i * 3.3) * 1080, w = 300 + hash(i) * 900;
    o += S.rect((hash(i * 7) * 1920 - w / 2) + dir * (1 - k) * 400, y, w, 10 + hash(i * 5) * 26, 10, { fill: '#FFFFFF', opacity: f(0.75 * k) });
  }
  return o;
}
const flashAt = (t, tc, a = 0.6, d = 0.09) => C.whiteFlash(a * bump(t, tc - d, tc + d));

// ---------------------------------------------------------------- characters with custom looks
// Dad without his tie (after he rips it off)
const dadNoTie = makeDraw(makeDesign({ ...D.dad.style, col: { ...D.dad.style.col, tie: null } }));
function actorWith(drawFn, speaker, t, pose = {}, act = {}) {
  const auto = K.V.perform(speaker, t, { seed: speaker.length * 3.7 + (act.seed || 0), ...act });
  const p = { shade: true, shadow: true, ...auto, ...pose };
  if (pose.face && auto.face) {
    const fo = typeof pose.face === 'string' ? { name: pose.face } : { ...pose.face };
    if (auto.face.mouth && K.V.talking(speaker, t) && fo.mouth === undefined) fo.mouth = auto.face.mouth;
    if (auto.face.blink && fo.blink === undefined) fo.blink = auto.face.blink;
    p.face = fo;
  }
  return drawFn(p);
}
// traders in suits for the hat exchange
const TRADER_LOOK = [
  ['slick', '#C98D6A', '#B0754F', '#3A2A1A', '#4A4F66', '#FFD21F'],
  ['shortPart', '#F2C9A0', '#DDB083', '#C2452D', '#2E3A55', '#FF5A5A'],
  ['quiff', '#8D5A3B', '#764830', '#1E1A1C', '#5A3A6A', '#3BD16F'],
  ['spiky', '#F8D9C0', '#EBC0A2', '#E0A23A', '#3A4A3A', '#34C3FF'],
  ['wavy', '#E9B38B', '#D29A72', '#5A3A22', '#6A2A3A', '#FFFFFF'],
  ['buns', '#B9805D', '#A16B4B', '#1E1A1C', '#2B2F3A', '#FF6FB5'],
];
const traders = TRADER_LOOK.map(([hair, skin, skinShade, hc, suit, tie]) => makeDraw(makeDesign({
  hair, eyeStyle: 'dot', top: 'suit', sleeve: 'long', pantsShape: 'straight', brows: { L: [0, 0], R: [0, 0] },
  col: { skin, skinShade, hair: hc, hairShade: hc, hairHi: '#FFFFFF55', brow: hc, top: suit, topShade: '#0003', sleeve: suit, cuff: '#FFFFFF', shirt: '#FFFFFF', tie, pants: suit, pantsShade: suit, sole: '#1A1A1E', soleShade: '#101013', toe: '#1A1A1E' },
})));

// ---------------------------------------------------------------- UI bits
// a speech bubble with text (Roblox chat-ish)
function bubble(txt, x, y, k = 1, size = 54, col = '#151515', bg = '#FFFFFF', rot = 0) {
  if (k <= 0) return '';
  const w = txt.length * size * 0.56 + 60, h = size + 40;
  let o = S.rect(-w / 2, -h - 26, w, h, 26, ol(bg, 6)) + S.path('M-18 -30 L0 0 L18 -30 Z', ol(bg, 6)) + S.rect(-20, -36, 40, 12, 0, { fill: bg });
  o += TF(txt, 0, -26 - h / 2 + size * 0.36, size, col);
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(ease.outBack(clamp(k, 0, 1)))})`);
}
// stamp: big rotated outlined word that slams down (k 0..1)
function stamp(txt, x, y, k, size = 140, col = '#E2233B', rot = -12) {
  if (k <= 0) return '';
  const sc = lerp(2.4, 1, ease.out(clamp(k, 0, 1)));
  const w = txt.length * size * 0.6 + 80;
  const o = S.rect(-w / 2, -size * 0.8, w, size * 1.15, 24, { fill: 'none', stroke: col, 'stroke-width': size * 0.1 }) + T(txt, 0, size * 0.22, size, col);
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${f(sc)})`, { opacity: f(clamp(k * 3, 0, 1)) });
}

const DEFS = `<defs>${hatTile('s06hats')}
<linearGradient id="s06rainbow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF5A9E"/><stop offset="0.25" stop-color="#FFB84D"/><stop offset="0.5" stop-color="#FFF06A"/><stop offset="0.75" stop-color="#5CF2C0"/><stop offset="1" stop-color="#8A7CFF"/></linearGradient>
<radialGradient id="s06glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF6C8" stop-opacity="0.9"/><stop offset="1" stop-color="#FFB8F0" stop-opacity="0"/></radialGradient>
<radialGradient id="s06spot" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.55"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
</defs>`;

module.exports = { hue, rgb, hat, randHat, placeHat, HAT_KINDS, sparkleFedora, hatMound, hoverboard, tyHouse, bushy, tree, whip, flashAt, dadNoTie, actorWith, traders, bubble, stamp, DEFS };
