// SC 01 · COLD OPEN — Ty's coin-pool mansion at golden hour → the crash → a cardboard box in the rain → VHS rewind.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor, coin, coinBurst, coinRain, confetti, rays, chart, bang } = K;
const { L } = K.V;
const C = K.C;

const l0 = L('01.0'), l1 = L('01.1'), l2 = L('01.2'), l3 = L('01.3'), l4 = L('01.4'), l5 = L('01.5'), l6 = L('01.6'), l7 = L('01.7');
const tJump = l0.word('became').t0, tSplash = l0.word('REAL').t0;
const tB = l1.a, tRich = l1.word('richest').t0;
const tC1 = l2.a, tC2 = l2.word('robot').t0 - 0.12, tC3 = l2.word('And').t0 - 0.1, tCoins = l2.word('COINS').t0;
const tD = l3.a - 0.25, tFee = l3.word('Thirty').t0;
const tE = l4.a - 0.08;
const tF = l5.a - 0.3, tMinus = l5.word('minus').t0, tNinety = l5.word('ninety-nine').t0;
const tG = l6.a, tNooo = l6.word('NOOO').t0;
const tH = tNooo + 1.55, tRewind = l7.word('Rewind').t0;
const END = 32.27;

// ---------------------------------------------------------------- static art (patterns)
function coinTile(id, col) {
  const Wt = 300, Ht = 150;
  let o = '';
  for (let i = 0; i < 26; i++) {
    const x = hash(i * 3.1 + 1) * Wt, y = hash(i * 5.7 + 2) * Ht, r = 22 + hash(i * 1.3) * 12;
    for (const dx of [-Wt, 0, Wt]) for (const dy of [-Ht, 0, Ht]) {
      if (x + dx < -40 || x + dx > Wt + 40 || y + dy < -40 || y + dy > Ht + 40) continue;
      o += K.coin(x + dx, y + dy, r, hash(i) * 360, hash(i * 9) * 2, col);
    }
  }
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${Wt}" height="${Ht}"><rect width="${Wt}" height="${Ht}" fill="${col === '#FFC93C' ? '#C98A12' : '#6E7380'}"/>${o}</pattern>`;
}
const DEFS = `<defs>${coinTile('coinPile', '#FFC93C')}${coinTile('coinPileGray', '#9AA0AE')}
<linearGradient id="s01sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B6BE0"/><stop offset="0.38" stop-color="#F08AB0"/><stop offset="0.7" stop-color="#FFB86B"/><stop offset="1" stop-color="#FFE3A3"/></linearGradient>
<linearGradient id="s01glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.35"/><stop offset="0.25" stop-color="#9FE4FF" stop-opacity="0.12"/><stop offset="1" stop-color="#2A6AA8" stop-opacity="0.3"/></linearGradient>
<linearGradient id="s01win" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE3A3"/><stop offset="0.5" stop-color="#F59A8C"/><stop offset="1" stop-color="#6A5ACD"/></linearGradient>
<linearGradient id="s01alley" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151036"/><stop offset="1" stop-color="#2E2058"/></linearGradient>
<radialGradient id="s01lamp" cx="0.5" cy="0" r="1"><stop offset="0" stop-color="#FFD98A" stop-opacity="0.55"/><stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></radialGradient>
</defs>`;

// ---------------------------------------------------------------- environment
function goldenSky(t, red = 0) {
  let o = S.rect(-800, -800, 3520, 2680, 0, { fill: 'url(#s01sky)' });
  o += S.circle(1450, 470, 150, { fill: '#FFF1C4', opacity: 0.95 }) + S.circle(1450, 470, 230, { fill: '#FFE3A3', opacity: 0.35 });
  for (const [x, y, s] of [[200, 160, 1.2], [760, 90, 0.9], [1250, 200, 1], [1750, 120, 0.8]]) {
    const cx = ((x + t * 14) % 2400) - 200;
    o += S.g(S.ellipse(0, 0, 130, 34, { fill: '#FFD1E0', opacity: 0.9 }) + S.ellipse(-60, -16, 70, 34, { fill: '#FFE0EA' }) + S.ellipse(50, -22, 80, 40, { fill: '#FFE6EF' }), `translate(${f(cx)} ${y}) scale(${s})`);
  }
  if (red > 0) o += S.rect(-800, -800, 3520, 2680, 0, { fill: '#C8102E', opacity: f(0.55 * red) });
  return o;
}
function palm(x, y, s, t) {
  const sway = Math.sin(t * 1.3 + x) * 4;
  let o = S.path(`M0 0 Q${18 + sway} -160 ${10 + sway * 2} -320`, ln(30, '#8A5A34')) + S.path(`M0 0 Q${18 + sway} -160 ${10 + sway * 2} -320`, ln(18, '#B07A48'));
  for (let i = 0; i < 6; i++) {
    const a = -160 + i * 32 + sway;
    o += S.g(S.path('M0 0 Q90 -40 190 20 Q100 -6 0 0 Z', ol('#3FAE5A', 5)), `translate(${10 + sway * 2} -320) rotate(${a})`);
  }
  return S.g(o, `translate(${x} ${y}) scale(${s})`);
}
function obbyYard(t) {
  let o = '';
  const blocks = [[1560, 520, 120, 40, '#FF5A5A'], [1700, 460, 100, 40, '#34C3FF'], [1820, 400, 110, 40, '#FFD21F'], [1960, 340, 120, 40, '#3BD16F'], [1660, 600, 90, 34, '#B06BFF']];
  for (const [x, y, w, h, c] of blocks) o += S.rect(x, y + Math.sin(t * 1.5 + x) * 6, w, h, 10, ol(c, 5));
  o += S.path('M1520 760 L1520 560 M1900 760 L1900 420', ln(10, '#7A5A8A'));
  o += S.path('M1980 330 L1980 250 L2040 270 L1980 290', ol('#FF5A5A', 4));
  return o;
}
// the villa: list of blocks that can fall apart; collapse = seconds since the collapse started
const VILLA = (() => {
  const B = [];
  B.push([380, 470, 1160, 290, '#F8F2EA', 'wall']);
  for (let i = 0; i < 5; i++) B.push([430 + i * 220, 520, 170, 200, 'url(#s01win)', 'win']);
  B.push([520, 300, 880, 170, '#FFF8F0', 'wall']);
  for (let i = 0; i < 4; i++) B.push([560 + i * 210, 330, 150, 120, 'url(#s01win)', 'win']);
  B.push([340, 440, 1240, 34, '#E2B33C', 'trim']);
  B.push([480, 270, 960, 32, '#E2B33C', 'trim']);
  B.push([600, 230, 720, 44, '#2A2A36', 'roof']);
  B.push([380, 470, 60, 290, '#E9DFD2', 'col']);
  B.push([1480, 470, 60, 290, '#E9DFD2', 'col']);
  return B;
})();
function villa(t, collapse = -1) {
  let o = '';
  VILLA.forEach(([x, y, w, h, fill, kind], i) => {
    let tf = '';
    if (collapse > 0) {
      const d = collapse - hash(i * 3.3) * 0.5;
      if (d > 0) {
        const dy = 0.5 * 2200 * d * d, dx = (hash(i * 7.7) - 0.5) * 300 * d, r = (hash(i * 5.1) - 0.5) * 120 * d;
        tf = `translate(${f(dx)} ${f(dy)}) rotate(${f(r)} ${f(x + w / 2)} ${f(y + h / 2)})`;
      }
    }
    let g = S.rect(x, y, w, h, kind === 'win' ? 10 : 6, ol(fill, kind === 'trim' ? 5 : 6));
    if (kind === 'win') g += S.path(`M${x + w * 0.2} ${y + 20} L${x + w * 0.45} ${y + 20} L${x + w * 0.2} ${y + h * 0.6} Z`, { fill: '#FFFFFF', opacity: 0.35 }) + S.path(`M${x + w / 2} ${y} L${x + w / 2} ${y + h}`, ln(5));
    o += tf ? S.g(g, tf) : g;
  });
  // the coin emblem on the roof
  const ed = collapse > 0 ? collapse : 0;
  o += K.coin(960, 190 + 0.5 * 2200 * Math.max(0, ed - 0.2) ** 2, 70, Math.sin(t * 2) * 8 + ed * 200, t * 1.5);
  return o;
}
// coin pool: surface heap at y, glass front below; gray = 0..1 sweep from left
function poolFront(t, y = 800, gray = 0) {
  const bumpTop = (x) => y + Math.sin(x * 0.02 + t * 1.6) * 7 + Math.sin(x * 0.051 + 1) * 6;
  let top = `M-200 ${f(bumpTop(-200))}`;
  for (let x = -200; x <= 2120; x += 40) top += ` L${x} ${f(bumpTop(x))}`;
  const surf = `${top} L2120 ${y + 70} L-200 ${y + 70} Z`;
  const glassY = y + 64;
  let o = '';
  const grayX = -200 + gray * 2400;
  const body = (fill) => S.path(surf, { fill }) + S.rect(-200, glassY, 2400, 1200 - glassY, 0, { fill });
  o += body('url(#coinPile)');
  if (gray > 0) {
    const id = S.uid('gr');
    o += S.clipDef(id, S.rect(-200, -400, grayX + 200, 2000)) + S.g(body('url(#coinPileGray)'), null, { 'clip-path': `url(#${id})` });
  }
  o += S.path(top, ln(6, '#7A4A08'));
  // glass wall + tiled coping
  o += S.rect(-200, glassY, 2400, 1200 - glassY, 0, { fill: 'url(#s01glass)' });
  o += S.rect(-200, glassY - 14, 2400, 28, 8, ol('#F2EADF', 6)) + S.rect(-200, glassY + 14, 2400, 10, 0, { fill: '#0003' });
  for (let x = -160; x < 2120; x += 420) o += S.path(`M${x} ${glassY + 60} L${x + 120} ${glassY + 250}`, ln(14, '#FFFFFF', 0.25)) + S.path(`M${x + 40} ${glassY + 60} L${x + 90} ${glassY + 140}`, ln(6, '#FFFFFF', 0.35));
  for (let i = 0; i < 9; i++) {
    const sx = (hash(i * 4.4) * 2000 + t * 30 * (i % 3 + 1)) % 2000, sy = y + 10 + hash(i) * 40;
    o += K.F.sparkle(sx, sy, 14 * Math.abs(Math.sin(t * 3 + i)));
  }
  return o;
}
function divingBoard(x, y, flex = 0) {
  return S.rect(x + 160, y + 20, 40, 260, 8, ol('#C9CED8', 6)) + S.path(`M${x - 120} ${y + flex} Q${x} ${y + flex * 0.6} ${x + 200} ${y} L${x + 200} ${y + 26} Q${x} ${y + 26 + flex * 0.6} ${x - 120} ${y + 26 + flex} Z`, ol('#4FC3F7', 6));
}
function tyShades(dy = 0) {
  const g = (x0) => S.path(S.roundedPath([[x0, -748 + dy], [x0 + 118, -748 + dy], [x0 + 112, -672 + dy], [x0 + 6, -672 + dy]], 22), ol('#14141A', 7)) + S.path(`M${x0 + 18} ${-734 + dy} L${x0 + 56} ${-734 + dy}`, ln(7, '#FFFFFF', 0.55));
  return g(-130) + g(12) + S.path(`M-12 ${-726 + dy} L12 ${-726 + dy}`, ln(8));
}
const headProp = (svg, pose) => ({ svg: S.g(svg, `translate(0 ${f(pose.headY || 0)}) rotate(${f(pose.headRot || 0)} 0 -560)`), layer: 'front' });
function tyIn(t, x, y, s, pose = {}, act = {}, shades = true, shadesDy = 0) {
  const auto = K.V.perform('TY', t, { seed: 7, ...act });
  const p = { ...auto, ...pose };
  const props = [...(pose.props || [])];
  if (shades) props.push(headProp(tyShades(shadesDy), p));
  return actor('ty', t, { x, y, s, shadow: false, ...pose, props }, act);
}

// ---------------------------------------------------------------- shots
function shotPool(t) {
  // A: wide golden hour → board bounces → cannonball → coins erupt → Ty pops up in shades
  const cam = camKeys(t, [[0, { zoom: 1.0, x: 0, y: -40 }], [tJump, { zoom: 1.05, x: 60, y: -20 }], [tSplash, { zoom: 1.08, x: 0, y: 0 }], [tB, { zoom: 1.32, x: 30, y: 120 }]]);
  const sh = K.shake(t, tSplash, 0.5, 18);
  cam.sx = sh.sx; cam.sy = sh.sy;
  const w = goldenSky(t);
  let mid = palm(220, 760, 1, t) + palm(1720, 770, 0.9, t) + obbyYard(t) + villa(t);
  mid += S.rect(-400, 740, 2800, 60, 0, { fill: '#6FBF5A' }) + S.rect(-400, 740, 2800, 12, 0, { fill: '#8FD96E' });
  // Ty on the board / in the air
  const bx = 1560, by = 690;
  const bounces = t < tJump ? Math.abs(Math.sin(((t - 0.4) / (tJump - 0.4)) * Math.PI * 2)) : 0;
  let ty = '';
  if (t < tJump) {
    ty = tyIn(t, bx + 40, by - bounces * 40, 0.42, { view: 'side', face: { name: 'excited' }, armL: -30 - bounces * 60, armR: -20 - bounces * 60, legL: -6, kneeL: 10 + bounces * 30, legR: 6, kneeR: 10 + bounces * 30 }, { arms: false }, false);
  } else if (t < tSplash) {
    const u = seg(t, tJump, tSplash);
    const x = lerp(bx + 40, 960, u), y = lerp(by, 840, u) - Math.sin(u * Math.PI) * 360;
    ty = tyIn(t, x, y, 0.42, { view: 'side', face: { name: 'excited' }, legL: -80, kneeL: 130, legR: -70, kneeR: 130, armL: 60, armR: 50, rot: -360 * ease.inOut(u), rotY: -520 }, { arms: false }, false);
  }
  let front = divingBoard(1470, 700, t < tJump ? bounces * 26 : 0);
  if (t >= tSplash + 0.25) {
    const u = ease.outBack(seg(t, tSplash + 0.25, tSplash + 0.75));
    const sp = seg(t, tSplash + 0.55, tSplash + 0.8);
    front += tyIn(t, 960, lerp(1250, 1100, u), 0.5, { face: t < tSplash + 0.8 ? { name: 'joy' } : { name: 'smug' }, armR: 40 + 60 * u, armL: 20 }, {}, sp > 0.5, -40 * (1 - sp));
  }
  front += poolFront(t, 800);
  front += coinBurst(960, 800, t - tSplash, 40, 1100, 30, 3);
  if (t > tSplash + 0.75 && t < tSplash + 1.2) front += K.F.sparkle(1010, 640, 40 * bump(t, tSplash + 0.75, tSplash + 1.2));
  let o = w + K.view(cam, mid, 0.9) + K.view(cam, ty + front, 1);
  o += C.whiteFlash(0.7 * bump(t, tSplash - 0.02, tSplash + 0.16));
  o += K.view(cam, bang('SPLOOSH!', 1320, 520, seg(t, tSplash, tSplash + 0.12) * (1 - seg(t, tSplash + 0.9, tSplash + 1.1)), 110, -8, '#FFD21F'), 1);
  // fade in from black
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#000', opacity: f(1 - seg(t, 0, 0.45)) });
  return o;
}

function shotFloat(t) {
  // B: floating on a golden ring, then the "#1 RICHEST" banner drops in
  const cam = camKeys(t, [[tB, { zoom: 1.55, x: 0, y: 200 }], [tC1, { zoom: 1.25, x: 0, y: 140 }]]);
  let w = goldenSky(t) + K.view(cam, villa(t) + palm(220, 760, 1, t) + palm(1720, 770, 0.9, t) + obbyYard(t) + S.rect(-400, 740, 2800, 60, 0, { fill: '#6FBF5A' }), 0.85);
  const bob = Math.sin(t * 2.2) * 8;
  let mid = '';
  // golden donut float behind/around Ty
  const ring = (front) => S.path(front ? 'M-170 0 A170 56 0 0 0 170 0 L130 0 A130 36 0 0 1 -130 0 Z' : 'M-170 0 A170 56 0 0 1 170 0 L130 0 A130 36 0 0 0 -130 0 Z', ol('#FFC93C', 7)) +
    (front ? S.path('M-120 22 Q0 44 120 22', ln(10, '#FFF1B0')) : '');
  mid += S.g(ring(false), `translate(960 ${f(830 + bob)})`);
  mid += tyIn(t, 960, 1010 + bob, 0.5, { armL: 165, armR: 165, face: { name: 'smug' }, headRot: 4 * Math.sin(t * 1.3), bodyY: 0 }, { arms: false });
  mid += poolFront(t, 820);
  mid += S.g(ring(true), `translate(960 ${f(830 + bob)})`);
  let o = w + K.view(cam, mid, 1);
  // banner
  const k = seg(t, tRich - 0.05, tRich + 0.45);
  if (k > 0) {
    const y = lerp(-260, 170, ease.outBack(k));
    let b = S.rect(-520, -110, 1040, 220, 40, ol('#2A1640', 10)) + S.rect(-500, -92, 1000, 184, 30, { fill: 'url(#s01win)', opacity: 0.25 });
    b += T('#1 RICHEST KID', 0, -10, 96, '#FFD21F', { stroke: '#2A1640', 'stroke-width': 12, 'paint-order': 'stroke' }) + TF('ON THE PLANET', 0, 66, 54, '#FFFFFF');
    b += K.coin(-430, -40, 52, -12, t * 3) + K.coin(430, -40, 52, 12, t * 3 + 1);
    o += S.g(b, `translate(960 ${f(y)}) rotate(${f(-3 + Math.sin(t * 3) * 1.5)})`);
    o += K.confetti(t, tRich + 0.2, 70, 5);
  }
  return o;
}

function shotHover(t) {
  // C1: gold hoverboard whooshes over the backyard obby, coins dropping behind
  const u = seg(t, tC1 - 0.1, tC2 + 0.05);
  const x = lerp(-250, 2150, ease.inOut(u));
  let o = goldenSky(t);
  const pan = (x - 960) * 0.25;
  let bg = '';
  for (let i = 0; i < 8; i++) {
    const bx = i * 320 - 200 - pan * 0.6;
    bg += S.rect(bx, 560 + (i % 3) * 60, 220, 46, 12, ol(['#FF5A5A', '#34C3FF', '#FFD21F', '#3BD16F', '#B06BFF'][i % 5], 6)) + S.rect(bx + 90, 600 + (i % 3) * 60, 40, 600, 0, { fill: '#7A5A8A', opacity: 0.5 });
  }
  o += bg + S.rect(-200, 880, 2400, 300, 0, { fill: '#6FBF5A' }) + S.rect(-200, 880, 2400, 14, 0, { fill: '#8FD96E' });
  o += C.speedLines(x - 900, x - 150, 520, 14, 3, '#FFFFFF', 260);
  for (let i = 0; i < 9; i++) {
    const age = (t * 6 + i) % 9 / 9;
    o += K.coin(x - 160 - age * 500, 620 + age * age * 500 + i * 6, 22, i * 40, t * 8 + i);
  }
  const bob = Math.sin(t * 9) * 6;
  o += S.g(S.ellipse(0, 0, 200, 34, ol('#FFC93C', 7)) + S.ellipse(0, -6, 150, 14, { fill: '#FFF1B0', opacity: 0.8 }) + S.ellipse(0, 46, 170, 16, { fill: '#5CF2FF', opacity: 0.45 }), `translate(${f(x)} ${f(780 + bob)})`);
  o += tyIn(t, x + 10, 768 + bob, 0.45, { view: 'side', flip: true, legL: 18, kneeL: 30, legR: -24, kneeR: 34, armL: -70, armR: 60, lean: 14, face: { name: 'excited' } }, { arms: false });
  o += bang('WHOOSH!', x - 260, 420, seg(t, tC1 + 0.2, tC1 + 0.35), 90, -6, '#5CF2FF');
  return o;
}

function shotButler(t) {
  // C2: Jeeves 3000 glides in with golden cereal
  const u = ease.out(seg(t, tC2, tC2 + 0.5));
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#F3E7D6' }) + S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#wallStripes)', opacity: 0.6 });
  o += S.rect(560, 120, 800, 520, 24, ol('url(#s01win)', 10)) + S.path('M960 120 L960 640 M560 380 L1360 380', ln(10));
  o += S.rect(0, 800, 1920, 280, 0, { fill: '#C9A27A' }) + S.rect(0, 800, 1920, 14, 0, { fill: '#B08860' });
  for (let x = 0; x < 1920; x += 160) o += S.rect(x, 140, 30, 560, 8, { fill: '#E2B33C', opacity: 0.5 });
  const bx = lerp(-200, 700, u);
  const bow = bump(t, tC2 + 0.6, tC2 + 1.25);
  const tray = S.g(S.ellipse(0, 0, 150, 22, ol('#D9D9E0', 6)) + S.path('M-60 -6 Q0 50 60 -6 Z', ol('#FFC93C', 5)) + S.ellipse(0, -8, 60, 14, { fill: '#FFE14D' }) + K.F.sparkle(30, -40, 18 * Math.abs(Math.sin(t * 6))), 'translate(250 -470)');
  o += actor('butler', t, { x: bx, y: 900, s: 0.62, turn: 0.4, armR: 80, armL: 10, lean: 14 * bow, headRot: 10 * bow, face: { name: 'happy' }, props: [{ svg: tray, layer: 'front' }] });
  o += tyIn(t, 1420, 905, 0.62, { turn: -0.35, armR: 125, armL: 15, face: { name: 'smug' } }, { arms: false });
  o += K.nameTag('Jeeves 3000', bx, 250, '#5CF2FF');
  return o;
}

function shotSwim(t) {
  // C3: backstroke through coins; a coin geyser on "COINS"
  const cam = camKeys(t, [[tC3, { zoom: 1.0, x: -60, y: 80 }], [tD, { zoom: 1.12, x: 40, y: 140 }]]);
  let o = goldenSky(t) + K.view(cam, villa(t) + palm(220, 760, 1, t) + palm(1720, 770, 0.9, t) + obbyYard(t) + S.rect(-400, 740, 2800, 60, 0, { fill: '#6FBF5A' }), 0.85);
  const u = seg(t, tC3, tD);
  const x = lerp(520, 1180, u);
  const stroke = t * 5;
  let mid = tyIn(t, x, 1010, 0.42, { rot: -84, rotY: -520, armL: 180 * ((stroke % (2 * Math.PI)) / (2 * Math.PI)), armR: 180 * (((stroke + Math.PI) % (2 * Math.PI)) / (2 * Math.PI)), face: { name: 'joy' } }, { arms: false });
  mid += poolFront(t, 820);
  mid += coinBurst(x + 60, 820, t - tCoins, 36, 1200, 30, 11);
  o += K.view(cam, mid, 1);
  if (t > tCoins) o += K.view(cam, rays(x + 60, 700, 14, 900, '#FFF1B0', 0.25 * (1 - seg(t, tCoins + 0.4, tD)), t * 20), 1);
  return o;
}

function shotThirty(t, close = false) {
  // D/E: the Thirty Percent Guy erupts from the coins and snatches his fee; Ty: "Not now!"
  const z = close ? camKeys(t, [[tE, { zoom: 1.65, x: -170, y: 140 }], [tF, { zoom: 1.8, x: -170, y: 150 }]]) : camKeys(t, [[tD, { zoom: 1.35, x: 0, y: 160 }], [tE, { zoom: 1.4, x: 20, y: 160 }]]);
  let o = goldenSky(t) + K.view(z, villa(t) + palm(220, 760, 1, t) + S.rect(-400, 740, 2800, 60, 0, { fill: '#6FBF5A' }), 0.85);
  const up = ease.outBack(seg(t, tD + 0.15, tD + 0.55));
  const sink = close ? ease.in(seg(t, l4.word('Percent').t0, tF - 0.1)) : 0;
  const gy = lerp(1160, 1000, up) + sink * 260;
  let mid = '';
  mid += tyIn(t, 740, 1000, 0.5, { turn: 0.35, face: close ? { name: 'angry' } : { name: 'shocked' }, armR: close ? 95 : 30, armL: 10 }, close ? { arms: false } : {});
  // the pile he steals
  const steal = seg(t, tFee - 0.2, tFee + 0.2);
  const calc = S.g(S.rect(-40, -60, 80, 120, 10, ol('#3A3F55', 5)) + S.rect(-30, -50, 60, 28, 4, { fill: '#BFF5B0' }) + TF('-30%', 0, -28, 22, '#1A5A1A'), 'translate(-260 -520) rotate(-10)');
  let pile = '';
  for (let i = 0; i < 7; i++) pile += K.coin(-30 + (i % 3) * 30, -430 - Math.floor(i / 3) * 26, 26, i * 30, t * 4 + i);
  mid += actor('thirty', t, { x: 1180, y: gy, s: 0.6, turn: -0.4, armL: 110 + 20 * steal, armR: 60, face: { name: close ? 'smug' : 'joy' }, props: [{ svg: calc, layer: 'front' }, ...(steal > 0 ? [{ svg: S.g(pile, `translate(${f(260 - 160 * steal)} 0)`), layer: 'front' }] : [])] });
  mid += poolFront(t, 820);
  mid += coinBurst(1180, 820, t - (tD + 0.15), 26, 900, 26, 21);
  o += K.view(z, mid, 1);
  if (!close) {
    const k = seg(t, tFee, tFee + 0.12);
    if (k > 0) o += S.g(S.rect(-170, -70, 340, 140, 18, { fill: 'none', stroke: '#E2233B', 'stroke-width': 14 }) + T('-30%', 0, 40, 110, '#E2233B'), `translate(1350 330) rotate(-12) scale(${f(lerp(2.2, 1, ease.out(k)))})`, { opacity: f(k) });
  } else {
    o += bang('NOT NOW!', 520, 300, seg(t, tE + 0.1, tE + 0.25), 90, -8, '#FF5A5A');
  }
  return o;
}

function shotAlarm(t) {
  // F: everything flips red; hologram warning with the crash chart; coins drain to grey
  const pulse = 0.5 + 0.5 * Math.sin((t - tF) * 7);
  const cam = camKeys(t, [[tF, { zoom: 1.0, x: 0, y: 0 }], [tF + 0.6, { zoom: 1.0, x: 0, y: 0 }], [tMinus, { zoom: 1.45, x: 0, y: 230 }], [tG, { zoom: 1.6, x: 0, y: 250 }]]);
  let o = goldenSky(t, 0.6 + 0.3 * pulse);
  o += K.view(cam, villa(t) + palm(220, 760, 1, t) + palm(1720, 770, 0.9, t) + S.rect(-400, 740, 2800, 60, 0, { fill: '#6FBF5A' }), 0.9);
  const gray = seg(t, tMinus, tMinus + 1.6);
  let mid = tyIn(t, 960, 1060, 0.48, { face: { name: 'shocked' }, armL: 20 + 50 * gray, armR: 20 + 50 * gray }, { arms: false }, true, 60 * ease.out(seg(t, tF + 0.6, tF + 1.0)));
  mid += poolFront(t, 820, gray);
  o += K.view(cam, mid, 1);
  // hologram
  const k = ease.outBack(seg(t, tF + 0.05, tF + 0.45));
  if (k > 0) {
    let hg = S.rect(-460, -250, 920, 500, 30, { fill: '#2A0610', opacity: 0.86, stroke: '#FF3B5C', 'stroke-width': 10 });
    hg += S.rect(-460, -250, 920, 76, 30, { fill: '#FF3B5C' }) + S.rect(-460, -210, 920, 36, 0, { fill: '#FF3B5C' });
    hg += T('⚠ WARNING', 0, -192, 56, '#FFFFFF');
    const pts = Array.from({ length: 40 }, (_, i) => { const u = i / 39; return [u, u < 0.55 ? 0.8 + 0.1 * Math.sin(u * 30) : Math.max(0.02, 0.8 - (u - 0.55) * 2.6 + 0.05 * Math.sin(u * 50))]; });
    hg += chart(-400, -120, 800, 300, pts, seg(t, l5.word('value').t0, tNinety + 0.4), '#FF3B5C', t > tNinety ? '-99%' : '');
    const zk = seg(t, tMinus - 0.2, tMinus + 0.6);
    o += S.g(hg, `translate(${f(lerp(960, 1420, ease.inOut(zk)))} ${f(lerp(330, 290, zk))}) scale(${f(k * lerp(1, 0.72, ease.inOut(zk)))})`);
  }
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FF0022', opacity: f(0.12 * pulse) });
  return o;
}

function shotCollapse(t) {
  // G: the villa falls apart block by block; "NOOO!" smash-zooms on Ty
  const coll = t - (tG + 0.35);
  const close = t >= tNooo;
  const cam = close ? camKeys(t, [[tNooo, { zoom: 2.1, x: 0, y: 250 }], [tH, { zoom: 2.6, x: 0, y: 260 }]]) : camKeys(t, [[tG, { zoom: 1.08, x: 0, y: 40 }], [tNooo, { zoom: 1.2, x: 0, y: 120 }]]);
  const sh = K.shake(t, tG + 0.4, 2.6, close ? 22 : 12);
  cam.sx = sh.sx; cam.sy = sh.sy;
  let o = goldenSky(t, 0.8);
  o += K.view(cam, villa(t, coll) + S.rect(-400, 740, 2800, 60, 0, { fill: '#6A6A72' }), 0.9);
  let mid = tyIn(t, 960, 1060, 0.48, { face: close ? { name: 'scream', mouth: 'wail' } : { name: 'scared' }, armL: 150, armR: 150, headRot: Math.sin(t * 30) * 4 }, { arms: false }, false);
  mid += poolFront(t, 820, 1);
  o += K.view(cam, mid, 1);
  for (let i = 0; i < 18; i++) {
    const age = (t - tG - hash(i) * 2) % 2;
    if (age > 0) o += K.grayCoin(hash(i * 3) * 1920, -80 + age * 700, 22, i * 20, t * 6 + i);
  }
  if (close) o += C.speedLines(0, 1920, 540, 26, 7, '#FFFFFF', 1000);
  // fall to black
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#05030C', opacity: f(seg(t, tH - 0.55, tH)) });
  return o;
}

function shotBox(t) {
  // H: rain at night, Ty in a cardboard box, deadpan
  const cam = camKeys(t, [[tH, { zoom: 1.0, x: 0, y: 0 }], [tRewind, { zoom: 1.18, x: 0, y: 60 }]]);
  let w = S.rect(-400, -400, 2800, 1900, 0, { fill: 'url(#s01alley)' });
  for (let y = 80; y < 760; y += 70) for (let x = (y / 70) % 2 ? -60 : 0; x < 2000; x += 160) w += S.rect(x, y, 150, 62, 6, { fill: '#3A2A66', stroke: '#241848', 'stroke-width': 5 });
  w += S.path('M1500 760 L1500 120 Q1500 80 1540 80 L1640 80', ln(20, '#2A2240')) + S.ellipse(1640, 100, 60, 26, ol('#FFE9A8', 6));
  w += S.path('M1640 120 L1380 760 L1900 760 Z', { fill: 'url(#s01lamp)' });
  w += S.rect(-400, 760, 2800, 600, 0, { fill: '#1C1638' });
  for (let i = 0; i < 6; i++) w += S.ellipse(200 + i * 330, 900 + (i % 2) * 60, 120, 18, { fill: '#5A4A9A', opacity: 0.45 });
  const box = (front) => front
    ? S.path('M760 1000 L1160 1000 L1160 760 L760 760 Z', ol('#C9945A', 8)) + S.path('M760 760 L700 690 M1160 760 L1220 690', ln(10, '#B07A42')) + TF('THIS SIDE UP ↑', 960, 880, 40, '#7A4A1E') + S.path('M800 960 L1120 960', ln(6, '#A87442'))
    : S.path('M760 760 L700 690 L1220 690 L1160 760 Z', ol('#A87442', 8));
  let mid = box(false);
  const sigh = bump(t, l7.word('Okay').t0 - 0.1, l7.word('Okay').t0 + 0.6);
  mid += tyIn(t, 960, 1010, 0.6, { face: { name: 'deadpan', ...(sigh > 0.3 ? { eyes: { type: 'closed' } } : {}) }, armL: 6, armR: 6, bodyY: 10 * sigh }, { arms: false, energy: 0.3 }, false);
  // the drip from the beanie onto his nose
  for (const td of [tH + 0.9, l7.word('great').t0 + 0.2]) {
    const d = seg(t, td, td + 0.45);
    if (d > 0 && d < 1) mid += S.path(`M${960 + 50} ${f(410 + d * 120)} q-10 18 0 26 q10 -8 0 -26 Z`, ol('#9FD8FF', 3));
  }
  mid += box(true);
  let o = K.view(cam, w + mid, 1);
  o += K.rain(t, 160, { op: 0.5 });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#000', opacity: f(1 - seg(t, tH, tH + 0.5)) });
  return o;
}

// ---------------------------------------------------------------- router
function live(t) {
  if (t < tB) return shotPool(t);
  if (t < tC1) return shotFloat(t);
  if (t < tC2) return shotHover(t);
  if (t < tC3) return shotButler(t);
  if (t < tD) return shotSwim(t);
  if (t < tE) return shotThirty(t, false);
  if (t < tF) return shotThirty(t, true);
  if (t < tG) return shotAlarm(t);
  if (t < tH) return shotCollapse(t);
  return shotBox(t);
}
function scene(t) {
  const rw = tRewind + 0.15;
  if (t < rw) {
    // whip transitions between the montage shots
    let o = live(t);
    for (const tc of [tC1, tC2, tC3]) o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: f(0.55 * bump(t, tc - 0.06, tc + 0.08)) });
    return o;
  }
  // VHS rewind: the whole cold open plays backwards, fast
  const src = Math.max(0.5, tH - 0.2 - (t - rw) * 9);
  let o = live(src);
  o += C.vhs(t, '◀◀ REWIND', 1);
  if (t > END - 0.45) o += C.staticNoise(t, seg(t, END - 0.45, END - 0.1));
  o += C.whiteFlash(seg(t, END - 0.15, END));
  return o;
}

const look = (t) => (t >= tH && t < tRewind + 0.15 ? { grade: 'night', vignette: 1 } : t >= tF && t < tH ? { grade: 'cool', vignette: 1 } : { grade: 'warm' });

// shared with later scenes (mansion, coin pool, sunglasses) so locations stay consistent
module.exports = { scene, look, DEFS, goldenSky, villa, palm, poolFront, obbyYard, divingBoard, tyShades, headProp, tyIn };
