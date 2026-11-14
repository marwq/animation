// SC 11 · THE BUTTON — the top of the Central Bank: the quiet Robux Printer, the RESET ECONOMY button under a glass dome,
// Ty's flashbacks (mansion, gold toothbrush, vanishing friends), the two who stayed, the umbrella, "RESET!" → coins fly home.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor, coin, rays, bang } = K;
const { L } = K.V;
const C = K.C;
const A = require('./acting');
const S01 = require('./s01');

const T0 = K.V.scene('SC 11').start, END = K.V.scene('SC 12').start;
const l0 = L('11.0'), l1 = L('11.1'), l2 = L('11.2'), l3 = L('11.3'), l4 = L('11.4'), l5 = L('11.5'), l6 = L('11.6'), l7 = L('11.7');

// ---------------------------------------------------------------- beats (all from the voice)
const tAll = l0.word('All').t0, tTurn = l0.word('turn').t0, tGame = l0.word('game').t0, tCur = l0.word('currency').t0;
const tYour = l0.word('Your').t0, tBecome = l0.word('become').t0, tJust = l0.word('just').t0;
const tSysCut = tYour - 0.12;                       // holo diagram -> close on Ty
const tHes = l0.b + 0.2;                            // Ty walks up to the dome
const tEyes = l2.a - 0.08;                          // eyes close: "I thought about..."
const tMan = l2.word('mansion').t0 - 0.12;          // flashback: the mansion
const tBrush = l2.word('gold').t0 - 0.2;            // flashback: gold toothbrush
const tFriends = l2.word('hundred').t0 - 0.3;       // flashback: the hundred friends
const tVanish = l2.word('vanished').t0, tMoney = l2.word('money').t0;
const tBack = l2.b + 0.02;                          // present: Ty opens his eyes
const tLook = l3.word('looked').t0;
const tTwo = l3.word('two').t0 - 0.25;              // reverse: Pickle + Mia, backlit
const tGate = l4.a - 0.1;                           // flashback: Pickle outside the gate
const tShoe = l4.word('one').t0 - 0.12;             // present: tilt down to the one shoe
const tRain = l4.word('And').t0 - 0.1;              // flashback: Mia in the rain
const tMia = l4.word('rain').t0 + 0.3;              // present: Mia
const tPk = l5.a - 0.06;                            // Pickle close
const tUmb2 = l5.word("I'll").t0 - 0.16;            // two-shot
const tUmb = l5.word('umbrella').t0;                // the umbrella pops open
const tMiaIn = l6.a - 0.06;                         // three-shot
const tMeToo = l6.word('Me').t0;
const tBlock = l6.word("Don't").t0;                 // palm block
const tHug = tBlock - 0.5;
const tTurnBtn = l6.b + 0.06;                       // Ty turns to the button, flips the dome
const tShout = l7.a;                                // RESET!
const tSlam = l7.b - 0.1;                           // fist hits the button
const tWorld = tSlam + 0.22;                        // coins fly back into the screens

// ---------------------------------------------------------------- staging
const PED = 1000, BASE = 930, BTN_Y = BASE - 236;   // pedestal x, its floor line, the button's base
const FL = 1000;                                    // feet line of the trio
const TYX = 1300, PKX = 1540, MIX = 1750;           // wide-shot marks
const SC = 0.48;                                    // trio scale
const at = (px, py, zoom) => ({ zoom, x: px - 960, y: py - 540 });
const ob = (u) => (u <= 0 ? 0 : ease.outBack(u)); // outBack that is exactly 0 before it starts
const headY = (y, s, z = 1) => y - 725 * s * z;    // head centre of a standing actor

// ---------------------------------------------------------------- defs
const DEFS = `<defs>
<linearGradient id="s11wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#082A31"/><stop offset="0.6" stop-color="#0F3F48"/><stop offset="1" stop-color="#155560"/></linearGradient>
<linearGradient id="s11floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9D0C2"/><stop offset="0.25" stop-color="#EFE8DC"/><stop offset="1" stop-color="#F7F2EA"/></linearGradient>
<linearGradient id="s11dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E2470"/><stop offset="0.45" stop-color="#B9509A"/><stop offset="0.75" stop-color="#FF9466"/><stop offset="1" stop-color="#FFD08A"/></linearGradient>
<linearGradient id="s11beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD9A8" stop-opacity="0.32"/><stop offset="1" stop-color="#FFD9A8" stop-opacity="0"/></linearGradient>
<linearGradient id="s11holoBeam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#7CF7FF" stop-opacity="0.45"/><stop offset="1" stop-color="#7CF7FF" stop-opacity="0.04"/></linearGradient>
<linearGradient id="s11glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.55"/><stop offset="0.4" stop-color="#BFF3FF" stop-opacity="0.16"/><stop offset="1" stop-color="#7FD3F0" stop-opacity="0.3"/></linearGradient>
<radialGradient id="s11red"><stop offset="0" stop-color="#FF3B4E" stop-opacity="0.75"/><stop offset="1" stop-color="#FF3B4E" stop-opacity="0"/></radialGradient>
<radialGradient id="s11warm"><stop offset="0" stop-color="#FFE7B8" stop-opacity="0.6"/><stop offset="1" stop-color="#FFE7B8" stop-opacity="0"/></radialGradient>
<radialGradient id="s11cyan"><stop offset="0" stop-color="#7CF7FF" stop-opacity="0.5"/><stop offset="1" stop-color="#7CF7FF" stop-opacity="0"/></radialGradient>
<radialGradient id="s11mem" cx="0.5" cy="0.5" r="0.72"><stop offset="0.55" stop-color="#FFF6E2" stop-opacity="0"/><stop offset="0.86" stop-color="#FFF6E2" stop-opacity="0.55"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.95"/></radialGradient>
<pattern id="s11hazard" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="rotate(45)"><rect width="40" height="40" fill="#FFD21F"/><rect width="20" height="40" fill="#1A1A22"/></pattern>
<pattern id="s11gold" patternUnits="userSpaceOnUse" width="120" height="120"><rect width="120" height="120" fill="#E9B83A"/><rect x="6" y="6" width="108" height="108" rx="12" fill="#F7D774"/><path d="M18 30 L50 18" stroke="#FFF4C4" stroke-width="8" stroke-linecap="round"/></pattern>
<pattern id="s11brick" patternUnits="userSpaceOnUse" width="160" height="140"><rect width="160" height="140" fill="#1C1640"/><rect x="4" y="4" width="152" height="62" rx="6" fill="#30285E"/><rect x="-76" y="74" width="152" height="62" rx="6" fill="#30285E"/><rect x="84" y="74" width="152" height="62" rx="6" fill="#30285E"/></pattern>
<pattern id="s11win" patternUnits="userSpaceOnUse" width="46" height="60"><rect x="10" y="12" width="22" height="28" rx="3" fill="#FFE08A" opacity="0.85"/></pattern>
</defs>`;

// ---------------------------------------------------------------- the bank top
function wall(t) {
  let o = S.rect(-800, -800, 3520, 1630, 0, { fill: 'url(#s11wall)' });
  for (let i = -3; i < 10; i++) o += S.rect(i * 300 + 60, 90, 200, 560, 22, { fill: 'none', stroke: '#1F6B74', 'stroke-width': 6 });
  // gold cornice + dado + skirting
  o += S.rect(-800, -40, 3520, 46, 0, ol('#E2B33C', 6)) + S.rect(-800, 6, 3520, 14, 0, { fill: '#B98A1E' });
  o += S.rect(-800, 690, 3520, 16, 0, ol('#E2B33C', 5));
  o += S.rect(-800, 760, 3520, 64, 0, { fill: '#082A31' }) + S.rect(-800, 756, 3520, 10, 0, { fill: '#E2B33C' });
  // pilasters
  for (const x of [-360, 860, 1140, 1820, 2180]) {
    o += S.rect(x - 30, -40, 60, 800, 6, ol('#E2B33C', 6));
    o += S.path(`M${x - 10} 20 L${x - 10} 740 M${x + 10} 20 L${x + 10} 740`, ln(5, '#B98A1E'));
    o += S.rect(x - 44, -60, 88, 40, 8, ol('#F2CF63', 5)) + S.rect(x - 44, 730, 88, 36, 8, ol('#F2CF63', 5));
  }
  // the round window with the dusk city
  const wx = 1480, wy = 330, r = 236;
  const id = S.uid('s11w');
  let sky = S.rect(wx - r, wy - r, 2 * r, 2 * r, 0, { fill: 'url(#s11dusk)' });
  sky += S.circle(wx + 60, wy + 110, 70, { fill: '#FFE7A0', opacity: 0.95 }) + S.circle(wx + 60, wy + 110, 120, { fill: '#FFE7A0', opacity: 0.25 });
  for (let i = 0; i < 9; i++) {
    const bx = wx - r + i * 56 - 10, bh = 90 + hash(i * 3.3) * 170;
    sky += S.rect(bx, wy + r - bh, 50, bh + 10, 4, { fill: '#3A2560' }) + S.rect(bx, wy + r - bh, 50, bh, 0, { fill: 'url(#s11win)', opacity: 0.8 });
  }
  for (let i = 0; i < 3; i++) sky += S.ellipse(((wx - 260 + i * 210 + t * 12) % 600) + wx - 300, wy - 120 + i * 50, 80, 18, { fill: '#FFC2D9', opacity: 0.7 });
  o += S.clipDef(id, S.circle(wx, wy, r)) + S.g(sky, null, { 'clip-path': `url(#${id})` });
  o += S.circle(wx, wy, r, { fill: 'none', stroke: '#E2B33C', 'stroke-width': 30 }) + S.circle(wx, wy, r + 16, { fill: 'none', stroke: '#151515', 'stroke-width': 6 }) + S.circle(wx, wy, r - 16, { fill: 'none', stroke: '#151515', 'stroke-width': 5 });
  o += S.path(`M${wx} ${wy - r} L${wx} ${wy + r} M${wx - r} ${wy} L${wx + r} ${wy}`, ln(16, '#E2B33C')) + S.circle(wx, wy, r * 0.42, { fill: 'none', stroke: '#E2B33C', 'stroke-width': 12 });
  o += S.path(`M${wx - 150} ${wy - 120} Q${wx - 120} ${wy - 190} ${wx - 40} ${wy - 205}`, ln(16, '#FFFFFF', 0.25));
  return o;
}
function floor() {
  let o = S.rect(-800, 822, 3520, 800, 0, { fill: 'url(#s11floor)' });
  for (let x = -760; x <= 2700; x += 220) o += S.path(`M${x} 822 L${f(960 + (x - 960) * 2.6)} 1400`, ln(3, '#C9BFAE', 0.7));
  for (const y of [850, 895, 960, 1050, 1180]) o += S.path(`M-800 ${y} L2720 ${y}`, ln(3, '#C9BFAE', 0.6));
  for (const [x, y] of [[200, 900], [700, 1050], [1500, 940], [1900, 1120], [-200, 1000], [1200, 1200]]) o += S.path(`M${x} ${y} q60 -10 110 20 q50 30 120 10`, ln(4, '#B9AE9C', 0.45));
  o += S.ellipse(PED, BASE + 6, 330, 66, { fill: 'none', stroke: '#E2B33C', 'stroke-width': 10 }) + S.ellipse(PED, BASE + 6, 380, 80, { fill: 'none', stroke: '#E2B33C', 'stroke-width': 4, opacity: 0.6 });
  return o;
}
// SC 10's leftovers: confetti from the exploded goblin and exactly 3.6 coins
function leftovers(t) {
  let o = '';
  const cols = ['#FF5A5A', '#FFD21F', '#3BD16F', '#34C3FF', '#B06BFF', '#FF6FB5'];
  for (let i = 0; i < 26; i++) {
    const x = -200 + hash(i * 3.7) * 2300, y = 840 + hash(i * 1.9) * 260;
    o += S.rect(x, y, 16, 9, 2, { fill: cols[i % 6], transform: `rotate(${f(hash(i) * 180)} ${f(x)} ${f(y)})` });
  }
  o += coin(560, 1020, 26, 0, 1.3) + coin(612, 1034, 26, 0, 1.2) + coin(1980, 990, 26, 0, 1.4);
  const id = S.uid('s11p');
  o += S.clipDef(id, S.path('M640 990 L700 990 L700 1060 L660 1060 Z')) + S.g(coin(660, 1028, 26, 0, 1.3), null, { 'clip-path': `url(#${id})` });
  return o;
}
function printer(t) {
  let o = '';
  // pipes up into the ceiling
  for (const [x, w] of [[150, 46], [300, 60], [560, 40]]) o += S.rect(x - w / 2, -800, w, 950, 10, ol('#C98A3C', 6)) + S.rect(x - w / 2 + 8, -800, 10, 950, 4, { fill: '#F2C48A', opacity: 0.6 });
  o += S.path('M560 -60 Q560 -140 640 -140 L1100 -140', ln(40, '#151515')) + S.path('M560 -60 Q560 -140 640 -140 L1100 -140', ln(28, '#C98A3C'));
  for (const [x, y] of [[150, 60], [300, -20], [560, 40]]) o += S.rect(x - 40, y, 80, 30, 8, ol('#E2B33C', 5));
  o += S.circle(300, 30, 34, { fill: 'none', stroke: '#B0182E', 'stroke-width': 10 }) + S.path('M266 30 L334 30 M300 -4 L300 64', ln(8, '#B0182E'));
  // quiet: thin wisps of steam
  for (let i = 0; i < 3; i++) {
    const ph = (t * 0.35 + i / 3) % 1;
    o += S.circle(150 + Math.sin(ph * 6 + i) * 20, 60 - ph * 220, 18 + ph * 30, { fill: '#FFFFFF', opacity: f(0.25 * (1 - ph)) });
  }
  // body
  o += S.rect(30, 170, 720, 720, 48, ol('#155E67', 8)) + S.rect(50, 190, 40, 680, 16, { fill: '#1E7580', opacity: 0.7 });
  o += S.rect(60, 196, 660, 74, 22, ol('#E2B33C', 6)) + T('ROBUX PRINTER', 390, 252, 52, '#2A1640');
  // porthole with stacked coins
  o += S.circle(300, 500, 168, ol('#E2B33C', 8)) + S.circle(300, 500, 140, ol('#0B2A30', 6));
  for (let i = 0; i < 9; i++) o += coin(220 + (i % 3) * 80, 580 - Math.floor(i / 3) * 52, 34, 0, 1.45);
  o += S.path('M210 410 Q250 380 300 376', ln(12, '#FFFFFF', 0.4));
  for (let a = 0; a < 8; a++) o += S.circle(300 + Math.cos(a * 0.785) * 154, 500 + Math.sin(a * 0.785) * 154, 7, ol('#B98A1E', 3));
  // gauges at zero, needles twitching
  for (const [gx, gy] of [[560, 380], [670, 380], [615, 500]]) {
    o += S.circle(gx, gy, 44, ol('#F7F2EA', 6)) + S.path(`M${gx - 30} ${gy + 6} A32 32 0 0 1 ${gx + 30} ${gy + 6}`, ln(5, '#3BD16F'));
    const a = -150 + Math.sin(t * 9 + gx) * 3;
    o += S.path(`M${gx} ${gy + 4} L${f(gx + Math.cos((a * Math.PI) / 180) * 32)} ${f(gy + 4 + Math.sin((a * Math.PI) / 180) * 32)}`, ln(6, '#E2233B')) + S.circle(gx, gy + 4, 7, { fill: '#151515' });
  }
  // status panel
  o += S.rect(520, 600, 190, 70, 14, ol('#0B1C22', 6)) + TF('IDLE', 630, 648, 36, '#FFB000') + S.circle(552, 635, 10, { fill: Math.floor(t * 1.5) % 2 ? '#FFB000' : '#5A4010' });
  // output chute + tray
  o += S.path('M740 660 L880 700 L880 790 L740 760 Z', ol('#1A4A52', 6)) + S.path('M760 790 L920 790 L900 850 L780 850 Z', ol('#E2B33C', 6));
  o += coin(830, 800, 22, 0, 1.4) + coin(866, 806, 22, 0, 1.3);
  // base
  o += S.rect(10, 850, 760, 54, 16, ol('#0B3A41', 7));
  for (let x = 70; x < 760; x += 110) o += S.circle(x, 877, 8, ol('#E2B33C', 3));
  return o;
}
// the pedestal: marble column, hazard plate, red button, glass dome. open: dome hinged back 0..1; press: 0..1 squash
function pedestal(t, { open = 0, press = 0, glow = 0.6, holoBeam = 0 } = {}) {
  const x = PED, b = BASE, by = BTN_Y;
  let o = S.ellipse(x, b + 4, 260, 44, { fill: '#000', opacity: 0.16 });
  o += S.circle(x, by - 40, 340, { fill: 'url(#s11red)', opacity: f(glow * (0.75 + 0.25 * Math.sin(t * 3))) });
  o += S.rect(x - 190, b - 54, 380, 58, 14, ol('#EAE3D6', 7));
  o += S.rect(x - 150, b - 206, 300, 156, 10, ol('#F4EFE6', 7));
  o += S.path(`M${x - 128} ${b - 190} q30 40 4 80 M${x + 120} ${b - 180} q-22 30 6 60`, ln(4, '#BDB3A3', 0.55));
  o += S.rect(x - 162, b - 76, 324, 26, 8, ol('#E2B33C', 6));
  // hazard plate
  o += S.rect(x - 112, b - 196, 224, 116, 12, ol('url(#s11hazard)', 6)) + S.rect(x - 96, b - 182, 192, 88, 8, ol('#1A1A22', 4));
  o += T('RESET', x, b - 140, 42, '#FF3B4E') + T('ECONOMY', x, b - 102, 32, '#FFFFFF');
  // console top
  o += S.rect(x - 196, b - 226, 392, 30, 8, ol('#E2B33C', 6));
  o += S.path(`M${x - 210} ${b - 222} L${x + 210} ${b - 222} L${x + 186} ${by + 10} L${x - 186} ${by + 10} Z`, ol('#1A4A52', 7));
  // button
  const h = 56 * (1 - 0.75 * press), rx = 150 * (1 + 0.08 * press);
  o += S.ellipse(x, by + 6, 176, 42, ol('#2A2A33', 7));
  o += S.path(`M${x - rx} ${by} L${x - rx} ${f(by - h)} A${rx} 38 0 0 1 ${x + rx} ${f(by - h)} L${x + rx} ${by} A${rx} 38 0 0 1 ${x - rx} ${by} Z`, ol('#C8102E', 7));
  o += S.ellipse(x, by - h, rx, 38, ol('#FF3B4E', 7)) + S.ellipse(x - 50, by - h - 10, 56, 12, { fill: '#FFFFFF', opacity: 0.45 });
  if (holoBeam > 0) o += S.path(`M${x - 40} ${by - 60} L${x - 380} 500 L${x + 380} 500 L${x + 40} ${by - 60} Z`, { fill: 'url(#s11holoBeam)', opacity: f(holoBeam) });
  // glass dome: lifts off and flies away when opened
  if (open < 1) {
    const d = S.path(`M${x - 194} ${by + 8} A194 200 0 0 1 ${x + 194} ${by + 8} Z`, { fill: 'url(#s11glass)', stroke: '#E8FBFF', 'stroke-width': 6 }) +
      S.path(`M${x - 132} ${by - 84} Q${x - 108} ${by - 150} ${x - 40} ${by - 172}`, ln(14, '#FFFFFF', 0.7)) + S.ellipse(x, by + 8, 194, 22, { fill: 'none', stroke: '#E2B33C', 'stroke-width': 10 });
    const e = ease.out(open);
    o += S.g(d, `translate(${f(e * 420)} ${f(-e * 700)}) rotate(${f(50 * e)} ${x} ${by})`);
  }
  return o;
}
// the SYSTEM hologram panel (world space, centred on cx, cy)
function holo(t, cx, cy, k) {
  if (k <= 0) return '';
  const s = ease.outBack(clamp(k, 0, 1));
  const W = 760, H = 440;
  let o = S.rect(-W / 2, -H / 2, W, H, 30, { fill: '#06202E', opacity: 0.86, stroke: '#7CF7FF', 'stroke-width': 8 });
  o += S.rect(-W / 2, -H / 2, W, 74, 30, { fill: '#7CF7FF', opacity: 0.9 }) + S.rect(-W / 2, -H / 2 + 40, W, 34, 0, { fill: '#7CF7FF', opacity: 0.9 });
  o += T('RESET ECONOMY?', 0, -H / 2 + 56, 50, '#06202E');
  let body = '';
  if (t < tAll - 0.05) {
    // reset arrow circling a coin
    const sp = t * 2.2;
    body += S.g(S.path('M-120 0 A120 120 0 1 1 0 120', ln(18, '#7CF7FF')) + S.path('M-150 -10 L-120 30 L-86 -6', ln(18, '#7CF7FF')), `translate(0 40) rotate(${f(sp * 57)})`);
    body += coin(0, 40, 64, 0, t * 3);
  } else if (t < tYour - 0.1) {
    // $ bill -> coin -> game controller
    const k1 = ob(seg(t, tAll, tAll + 0.25)), k2 = seg(t, tTurn, tTurn + 0.5), k3 = ob(seg(t, tGame - 0.1, tGame + 0.15)), k4 = seg(t, tCur, tCur + 0.5);
    const bill = S.rect(-80, -44, 160, 88, 12, ol('#7BD88F', 6)) + S.circle(0, 0, 28, ol('#BFF5C8', 4)) + T('$', 0, 16, 46, '#1E6B33');
    body += S.g(bill, `translate(-250 40) scale(${f(k1 * (1 - 0.6 * k2))})`, { opacity: f(1 - k2 * 0.8) });
    body += S.path('M-150 40 L-70 40', ln(10, '#7CF7FF', f(k2))) + S.path('M-90 22 L-68 40 L-90 58', ln(10, '#7CF7FF', f(k2)));
    const cx2 = lerp(-250, 0, ease.inOut(k2)), cx3 = lerp(0, 230, ease.inOut(k4));
    body += coin(k4 > 0 ? cx3 : cx2, 40 - Math.sin(k4 * Math.PI) * 60, 46 * (1 - 0.5 * k4), 0, t * 5);
    body += S.path('M80 40 L150 40', ln(10, '#7CF7FF', f(k3))) + S.path('M130 22 L152 40 L130 58', ln(10, '#7CF7FF', f(k3)));
    const pad = S.path('M-90 -30 Q-110 -30 -118 0 L-130 50 Q-136 76 -110 76 Q-90 76 -70 46 L70 46 Q90 76 110 76 Q136 76 130 50 L118 0 Q110 -30 90 -30 Z', ol('#B06BFF', 6)) +
      S.path('M-74 6 L-34 6 M-54 -14 L-54 26', ln(9, '#FFFFFF')) + S.circle(50, -2, 10, { fill: '#FFD21F' }) + S.circle(78, 18, 10, { fill: '#3BD16F' });
    body += S.g(pad, `translate(250 40) scale(${f(0.8 * k3 * (1 + 0.15 * bump(t, tCur + 0.35, tCur + 0.6)))})`);
    body = S.g(body, 'translate(0 20) scale(1.25)') + TF('GAME CURRENCY', 0, 190, 44, '#7CF7FF', { opacity: f(seg(t, tCur, tCur + 0.3)) });
  } else {
    // R$ 3,000,000 = $3,000,000  ->  = just Robux
    const crack = seg(t, tJust - 0.05, tJust + 0.3);
    body += S.g(K.robuxText(0, 30, '3,000,000', 84, '#FFFFFF'), `scale(${f(1 + 0.04 * Math.sin(t * 6))})`);
    if (crack < 1) {
      const sh = t > tBecome ? Math.sin(t * 60) * 6 * seg(t, tBecome, tJust) : 0;
      body += S.g(TF('= $3,000,000', 0, 130, 64, '#5CFF7A'), `translate(${f(sh)} 0)`, { opacity: f(1 - crack) });
      if (crack > 0) for (let i = 0; i < 16; i++) body += S.rect(-200 + i * 26, 100 + crack * (60 + hash(i) * 120), 18, 18, 3, { fill: '#5CFF7A', opacity: f(1 - crack) });
    }
    body += TF('= just Robux 🎮', 0, 140, 60, '#7CF7FF', { opacity: f(seg(t, tJust + 0.15, tJust + 0.4)) });
  }
  o += body;
  for (let y = -H / 2 + 80; y < H / 2; y += 16) o += S.rect(-W / 2 + 10, y, W - 20, 3, 0, { fill: '#7CF7FF', opacity: 0.08 });
  const flick = 0.92 + 0.08 * Math.sin(t * 37);
  return S.g(o, `translate(${f(cx)} ${f(cy)}) scale(${f(s)})`, { opacity: f(flick) });
}
function bankBg(t) { return wall(t) + S.path('M1260 470 L1700 470 L2000 1200 L1000 1200 Z', { fill: 'url(#s11beam)' }) + floor() + printer(t) + leftovers(t); }

// ---------------------------------------------------------------- props + helpers
const LS = 1; // light soft overlays
function soft(x, y, r, id = 's11warm', op = 1) { return S.circle(x, y, r, { fill: `url(#${id})`, opacity: f(op) }); }
// Mia's phone in body space (held at chest height)
const miaPhone = (a = 40, side = -1) => { const [hx, hy] = A.hand(a, side); return { svg: S.g(K.phone(0, 0, 0.32, side * -8, S.rect(-150, -280, 300, 560, 0, { fill: '#B79BE8' }) + S.circle(0, -60, 60, { fill: '#FFFFFF', opacity: 0.6 })), `translate(${f(hx)} ${f(hy - 40)})`), layer: 'front' }; };
// a small yellow umbrella, world space: shaft foot at (x, y), canopy radius r
function umbrella(x, y, r, k, tilt = 0, sl = r * 0.62) {
  if (k <= 0) return '';
  const s = ease.outBack(clamp(k, 0, 1));
  let can = S.path(`M${-r} 0 Q${-r} ${-r * 0.9} 0 ${-r * 0.92} Q${r} ${-r * 0.9} ${r} 0 Q${r * 0.75} ${-r * 0.16} ${r * 0.5} 0 Q${r * 0.25} ${-r * 0.16} 0 0 Q${-r * 0.25} ${-r * 0.16} ${-r * 0.5} 0 Q${-r * 0.75} ${-r * 0.16} ${-r} 0 Z`, ol('#FFD21F', 6));
  can += S.path(`M0 ${-r * 0.92} Q${-r * 0.3} ${-r * 0.5} ${-r * 0.5} 0 M0 ${-r * 0.92} Q${r * 0.3} ${-r * 0.5} ${r * 0.5} 0`, ln(4));
  can += S.circle(-r * 0.62, -r * 0.42, r * 0.08, { fill: '#58B947' }) + S.circle(r * 0.2, -r * 0.6, r * 0.08, { fill: '#58B947' }) + S.circle(r * 0.6, -r * 0.3, r * 0.08, { fill: '#58B947' });
  can += S.path(`M0 ${-r * 0.92} L0 ${-r * 1.05}`, ln(6));
  const shaft = S.path(`M0 0 L0 ${f(-sl)}`, ln(7, '#5A3B26')) + S.path('M0 0 q0 26 -20 26', ln(7, '#5A3B26'));
  return S.g(shaft + S.g(can, `translate(0 ${f(-sl)}) scale(${f(s)} ${f(lerp(0.3, 1, s))})`), `translate(${f(x)} ${f(y)}) rotate(${f(tilt)})`);
}
// memory flash look: warm wash, dreamy white edges, dust motes, white flashes at both ends
function memory(inner, t, a, b, tint = '#FFC97A') {
  const u = seg(t, a, b);
  let o = S.g(inner, `translate(960 540) scale(${f(1.02 + 0.03 * u)}) translate(-960 -540)`);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: tint, opacity: 0.2 });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s11mem)' });
  for (let i = 0; i < 16; i++) {
    const ph = (t * 0.12 + hash(i * 2.1)) % 1;
    o += S.circle(hash(i * 5.3) * 1920 + Math.sin(t + i) * 30, 1080 - ph * 1080, 4 + hash(i) * 6, { fill: '#FFFFFF', opacity: f(0.55 * Math.sin(ph * Math.PI)) });
  }
  o += C.whiteFlash(0.95 * (1 - seg(t, a, a + 0.16)));
  o += C.whiteFlash(0.85 * seg(t, b - 0.09, b));
  return o;
}
function pixelPoof(x, y, age, n = 10, col = '#FFFFFF', seed = 1) {
  if (age < 0 || age > 0.45) return '';
  const k = age / 0.45;
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = hash(i * 3.1 + seed) * Math.PI * 2, v = 80 + 160 * hash(i * 7.3 + seed);
    const s = 22 * (1 - k);
    o += S.rect(x + Math.cos(a) * v * k - s / 2, y + Math.sin(a) * v * k - s / 2 - 40 * k, s, s, 3, { fill: i % 3 ? col : '#FFD21F', stroke: '#151515', 'stroke-width': 3, opacity: f(1 - k * 0.6) });
  }
  return o;
}

// ---------------------------------------------------------------- shots
function trioWide(t, faces = {}) {
  const lookUp = [-0.6, -0.6];
  let o = actor('mia', t, { x: MIX, y: FL, s: SC, turn: -0.45, face: faces.mia || { name: 'deadpan', eyes: { look: lookUp } }, armL: 40, armR: 10, props: [miaPhone(40, -1)] }, { arms: false });
  o += actor('pickle', t, { x: PKX, y: FL, s: SC, turn: -0.45, face: faces.pickle || { name: 'amazed', eyes: { look: lookUp } }, armL: 14, armR: 14 }, { arms: false });
  o += actor('ty', t, { x: TYX, y: FL, s: SC, turn: -0.5, face: faces.ty || { name: 'nervous', eyes: { look: lookUp } }, armL: 10, armR: 10 }, { arms: false });
  return o;
}

function shotEstablish(t) {
  // A: crane down from the quiet printer's pipes to the button; the SYSTEM hologram pops up
  const cam = camKeys(t, [[T0, { ...at(700, 300, 1.45) }], [T0 + 0.5, { ...at(680, 330, 1.38) }], [tAll - 0.2, { ...at(1090, 545, 0.98) }]]);
  // the last confetti from SC 10 still drifting down
  let conf = '';
  const cols = ['#FF5A5A', '#FFD21F', '#3BD16F', '#34C3FF', '#B06BFF'];
  for (let i = 0; i < 22; i++) {
    const y = ((t - T0) * (90 + hash(i) * 60) + hash(i * 3.3) * 900) % 1000 - 100, x = hash(i * 7.1) * 2200 - 100 + Math.sin(t * 2 + i) * 30;
    conf += S.rect(x, y, 16, 24, 3, { fill: cols[i % 5], transform: `rotate(${f(t * 140 + i * 40)} ${f(x + 8)} ${f(y + 12)})` });
  }
  let w = bankBg(t) + pedestal(t, { holoBeam: seg(t, tAll - 1.6, tAll - 1.4) }) + trioWide(t);
  w += holo(t, PED, 285, seg(t, l0.a + 0.05, l0.a + 0.4));
  let o = view(cam, w, 1) + conf;
  return o;
}
function shotDiagram(t) {
  // B: over the trio's shoulders (backs to us) into the hologram diagram; slow push
  const cam = camKeys(t, [[tAll - 0.2, { ...at(1000, 440, 1.22) }], [tSysCut, { ...at(1000, 420, 1.34) }]]);
  let w = bankBg(t) + pedestal(t, { holoBeam: 1 }) + holo(t, PED, 285, 1);
  // backs: Ty, Pickle, Mia in the foreground (bigger, closer to camera)
  w += actor('pickle', t, { x: 1500, y: 1210, s: 0.6, view: 'back', armL: 10, armR: 10 });
  w += actor('ty', t, { x: 1270, y: 1240, s: 0.64, view: 'back', armL: 8, armR: 8, headRot: Math.sin(t * 0.8) * 2 });
  w += actor('mia', t, { x: 640, y: 1210, s: 0.6, view: 'back', armL: 30, armR: 10 });
  let o = view(cam, w, 1);
  o += soft(960, 380, 700, 's11cyan', 0.6);
  return o;
}
function shotTyLit(t) {
  // C: close on Ty, lit cyan by the hologram and red by the button; his 3,000,000 turns into "just Robux"
  const cam = camKeys(t, [[tSysCut, { ...at(TYX - 60, headY(FL, SC) + 20, 2.25) }], [tHes, { ...at(TYX - 60, headY(FL, SC) + 10, 2.6) }]]);
  const gulp = bump(t, tJust + 0.35, tJust + 0.75);
  let w = bankBg(t) + pedestal(t, { holoBeam: 1 });
  w += actor('pickle', t, { x: PKX, y: FL, s: SC, turn: -0.45, face: { name: 'amazed', eyes: { look: [-0.6, -0.6] } } });
  w += actor('ty', t, { x: TYX, y: FL, s: SC, turn: -0.4, face: { name: t > tJust ? 'scared' : 'nervous', eyes: { look: [-0.7, -0.5], pupil: t > tJust ? 0.5 : 0.75 }, mouth: t > tJust + 0.3 ? 'wavy' : undefined }, bodyY: 4 * gulp, headY: 6 * gulp, armL: 8, armR: 8 });
  let o = view(cam, w, 1);
  o += soft(300, 300, 700, 's11cyan', 0.75) + soft(400, 1000, 500, 's11red', 0.5);
  // the holo reflected as a floating counter, screen space
  const k = ob(seg(t, tSysCut + 0.15, tSysCut + 0.45));
  if (k > 0) {
    let c = S.rect(-330, -110, 660, 230, 30, { fill: '#06202E', opacity: 0.82, stroke: '#7CF7FF', 'stroke-width': 7 });
    c += K.robuxText(0, -10, '3,000,000', 72, '#FFFFFF');
    const crack = seg(t, tJust - 0.05, tJust + 0.3);
    const sh = t > tBecome ? Math.sin(t * 60) * 5 * seg(t, tBecome, tJust) : 0;
    if (crack < 1) c += S.g(TF('= $3,000,000', 0, 80, 54, '#5CFF7A'), `translate(${f(sh)} 0)`, { opacity: f(1 - crack) });
    if (crack > 0 && crack < 1) for (let i = 0; i < 14; i++) c += S.rect(-170 + i * 26, 50 + crack * (40 + hash(i) * 110), 16, 16, 3, { fill: '#5CFF7A', opacity: f(1 - crack) });
    c += TF('= just Robux', 0, 84, 54, '#7CF7FF', { opacity: f(seg(t, tJust + 0.12, tJust + 0.4)) });
    o += S.g(c, `translate(470 300) rotate(-4) scale(${f(k * 0.9)})`);
  }
  if (gulp > 0) o += bang('gulp', 1290, 700, gulp, 64, 8, '#FFFFFF');
  return o;
}
function shotHesitate(t) {
  // D: profile — Ty walks up to the dome, reaches out, lays his hand on the glass. Slow push, soft red light.
  const cam = camKeys(t, [[tHes, { ...at(1230, 620, 1.6) }], [tEyes, { ...at(1210, 640, 2.0) }]]);
  const walkU = seg(t, tHes, tHes + 1.1);
  const x = lerp(1440, 1290, ease.out(walkU));
  const reach = ease.inOut(seg(t, l1.a - 0.3, l1.a + 0.6));
  let w = bankBg(t) + pedestal(t, { glow: 0.8 });
  const ph = walkU < 1 ? (t - tHes) * 7 : 0;
  w += actor('ty', t, { x, y: FL, s: SC, view: 'side', ...(walkU < 1 ? A.walk(ph, 0.8) : {}), armL: walkU < 1 ? A.walk(ph, 0.8).armL : lerp(0, 112, reach), armR: -6, face: { name: 'deadpan', mouth: t > l1.b ? 'frown' : undefined, eyes: { upper: 0.35, look: [-0.4, -0.3] } }, headRot: -4 * reach }, { arms: false });
  let o = view(cam, w, 1);
  o += soft(700, 520, 700, 's11red', 0.55) + soft(1700, 200, 700, 's11warm', 0.5);
  return o;
}
function shotEyes(t) {
  // E: extreme close — Ty closes his eyes ("I thought about...")
  const cam = camKeys(t, [[tEyes, { ...at(TYX - 20, headY(FL, SC), 2.9) }], [tMan, { ...at(TYX - 20, headY(FL, SC), 3.15) }]]);
  let w = bankBg(t) + pedestal(t, { glow: 0.8 });
  const shut = seg(t, tEyes + 0.15, tEyes + 0.4);
  w += actor('ty', t, { x: TYX, y: FL, s: SC, turn: -0.2, face: { name: 'sad', eyes: shut > 0.5 ? { type: 'closed' } : { look: [0, 0.4] } } }, { arms: false, energy: 0.3 });
  return view(cam, w, 1) + soft(1500, 300, 800, 's11warm', 0.7);
}

// ---------------------------------------------------------------- flashbacks
function fbMansion(t) {
  const cam = { zoom: lerp(1.04, 1.14, seg(t, tMan, tBrush)), x: 0, y: 60 };
  let o = S01.goldenSky(t) + view(cam, S01.villa(t) + S01.palm(220, 760, 1, t) + S01.palm(1720, 770, 0.9, t) + S01.obbyYard(t) + S.rect(-400, 740, 2800, 60, 0, { fill: '#6FBF5A' }), 0.85);
  const bob = Math.sin(t * 2.2) * 8;
  const ring = (front) => S.path(front ? 'M-170 0 A170 56 0 0 0 170 0 L130 0 A130 36 0 0 1 -130 0 Z' : 'M-170 0 A170 56 0 0 1 170 0 L130 0 A130 36 0 0 0 -130 0 Z', ol('#FFC93C', 7));
  let mid = S.g(ring(false), `translate(960 ${f(830 + bob)})`);
  mid += S01.tyIn(t, 960, 1010 + bob, 0.5, { armL: 165, armR: 120 + 30 * Math.sin(t * 8), face: { name: 'smug', mouth: 'smirk' } }, { arms: false, energy: 0 });
  mid += S01.poolFront(t, 820) + S.g(ring(true), `translate(960 ${f(830 + bob)})`);
  o += view(cam, mid, 1);
  return memory(o, t, tMan, tBrush);
}
function fbBrush(t) {
  const u = seg(t, tBrush, tFriends);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s11gold)' });
  o += S.ellipse(560, 420, 330, 400, ol('#E2B33C', 14)) + S.ellipse(560, 420, 290, 360, { fill: '#BFEFFF' }) + S.path('M380 260 L520 120 M400 380 L620 160', ln(26, '#FFFFFF', 0.5));
  for (const [x, y, r] of [[300, 120, 30], [800, 200, 40], [1600, 160, 34], [1700, 700, 26]]) o += K.F.sparkle(x, y, r * (0.6 + 0.4 * Math.abs(Math.sin(t * 4 + x))));
  const sc = lerp(1.12, 1.2, u);
  const brush = Math.sin(t * 22) * 7;
  const armR = 118 + brush;
  const [hx, hy] = A.hand(armR, 1);
  // brush in body space: handle from the hand to the mouth (head ~ y -640)
  const bx = 40, by = -604;
  let tb = S.path(`M${f(hx)} ${f(hy)} L${bx + 60} ${by}`, ln(46, '#151515')) + S.path(`M${f(hx)} ${f(hy)} L${bx + 60} ${by}`, ln(34, '#FFC93C'));
  tb += S.path(`M${f(hx - 30)} ${f(hy - 10)} L${bx + 100} ${by - 8}`, ln(8, '#FFF4C4'));
  tb += S.rect(bx - 40, by - 20, 120, 34, 10, ol('#FFC93C', 5)) + S.rect(bx - 34, by + 12, 108, 30, 6, ol('#FFFFFF', 5)) + S.path(`M${bx - 20} ${by + 14} L${bx - 20} ${by + 40} M${bx + 10} ${by + 14} L${bx + 10} ${by + 40} M${bx + 40} ${by + 14} L${bx + 40} ${by + 40}`, ln(4, '#BFE8FF'));
  let foam = '';
  for (let i = 0; i < 6; i++) foam += S.circle(-90 + i * 26 + Math.sin(t * 9 + i) * 6, -592 + (i % 2) * 16, 14 + (i % 3) * 5, ol('#FFFFFF', 4));
  const ty = S01.tyIn(t, 960, 1390, sc, { armR, armL: 12, face: { name: 'joy', mouth: 'teeth' }, props: [{ svg: foam + tb, layer: 'top' }] }, { arms: false, energy: 0 });
  o += ty;
  o += bang('BLING!', 1460, 330, ease.out(seg(t, l2.word('toothbrush').t0, l2.word('toothbrush').t0 + 0.2)), 120, -10, '#FFD21F');
  o += K.F.sparkle(1300, 520, 50 * bump(t, l2.word('toothbrush').t0, l2.word('toothbrush').t0 + 0.6));
  return memory(o, t, tBrush, tFriends);
}
const KIDS = [[230, 1000, 0.42], [430, 1050, 0.46], [600, 990, 0.4], [1320, 990, 0.4], [1500, 1050, 0.46], [1700, 1000, 0.43], [330, 930, 0.36], [760, 940, 0.36], [1180, 940, 0.36], [1600, 930, 0.36], [90, 1080, 0.48], [1840, 1080, 0.48]];
const KID_ORDER = [5, 0, 9, 3, 6, 11, 1, 7, 4, 10, 2, 8];
function fbFriends(t) {
  const cam = { zoom: lerp(1.0, 1.1, seg(t, tFriends, tBack)), x: 0, y: 60 };
  let o = S01.goldenSky(t) + view(cam, S01.villa(t) + S01.palm(220, 760, 1, t) + S01.palm(1720, 770, 0.9, t) + S.rect(-400, 740, 2800, 600, 0, { fill: '#6FBF5A' }) + S.rect(-400, 740, 2800, 12, 0, { fill: '#8FD96E' }), 0.85);
  // party string lights
  let lights = S.path('M-100 120 Q480 260 960 150 Q1440 260 2020 120', ln(5, '#2A1640'));
  for (let i = 0; i < 14; i++) { const x = -40 + i * 150, y = 140 + Math.abs(Math.sin(i * 0.9)) * 70; lights += S.circle(x, y, 14, ol(['#FF5A5A', '#FFD21F', '#3BD16F', '#34C3FF'][i % 4], 4)); }
  o += view(cam, lights, 0.9);
  const span = tMoney + 0.25 - tVanish;
  let mid = '';
  const order = [...KIDS.keys()].sort((a, b) => KIDS[a][1] - KIDS[b][1]);
  for (const i of order) {
    const [x, y, s] = KIDS[i];
    const tv = tVanish + (KID_ORDER.indexOf(i) / KIDS.length) * span;
    if (t < tv) {
      const jump = Math.abs(Math.sin(t * 7 + i * 1.3)) * 26;
      mid += K.draw.kid(i * 3 + 2, { x, y, s, volume: s > 0.38, lift: jump, armL: 140 + 20 * Math.sin(t * 9 + i), armR: 150 + 20 * Math.cos(t * 8 + i), turn: x < 960 ? 0.35 : -0.35, face: { name: i % 2 ? 'joy' : 'excited' }, shadow: true });
    } else mid += pixelPoof(x, y - 380 * s, t - tv, 10, '#FFFFFF', i);
  }
  const broke = seg(t, tMoney, tMoney + 0.3);
  const coinsOn = t < tMoney;
  const ty = S01.tyIn(t, 960, 1030, 0.5, { armL: coinsOn ? 150 : lerp(150, 10, broke), armR: coinsOn ? 150 : lerp(150, 10, broke), face: t < tVanish + 0.4 ? { name: 'joy', mouth: 'bigGrin' } : t < tMoney ? { name: 'nervous', mouth: 'teeth' } : { name: 'sad', mouth: 'frown' } }, { arms: false, energy: 0 }, true);
  mid += ty;
  if (coinsOn) for (let i = 0; i < 12; i++) { const age = ((t - tFriends) * 1.4 + i / 12) % 1; mid += coin(960 + (i % 2 ? 1 : -1) * (220 + age * 400 * hash(i)), 470 - Math.sin(age * Math.PI) * 260 + age * 300, 22, i * 30, t * 8 + i); }
  o += view(cam, mid, 1);
  // HUD: the money and the friends draining together
  const drain = ease.inOut(seg(t, tVanish - 0.2, tMoney + 0.25));
  o += K.counter(390, 110, 3000000 * (1 - drain), 0.9, drain > 0.98 ? '#FF5A5A' : '#3BD16F');
  const fr = Math.round(100 * (1 - drain));
  o += S.g(S.rect(-190, -50, 380, 100, 30, ol('#14182A', 6)) + S.circle(-130, 0, 26, ol('#FFD21F', 4)) + S.circle(-112, 4, 26, ol('#FF6FB5', 4)) + T(`FRIENDS: ${fr}`, 40, 18, 52, fr < 10 ? '#FF5A5A' : '#FFFFFF'), 'translate(1530 110) scale(0.9)');
  // the tumbleweed
  const tw = seg(t, tMoney + 0.1, tBack + 0.2);
  if (tw > 0) o += S.g(S.circle(0, 0, 46, { fill: 'none', stroke: '#B07A42', 'stroke-width': 8 }) + S.path('M-30 -20 Q0 30 34 -10 M-36 10 Q0 -34 30 26', ln(6, '#8A5A34')), `translate(${f(lerp(-80, 1100, tw))} ${f(900 - Math.abs(Math.sin(tw * 12)) * 40)}) rotate(${f(tw * 720)})`);
  return memory(o, t, tFriends, tBack);
}
function fbGate(t) {
  // Pickle outside the mansion gates at dusk, one shoe, holding a tiny gift; the party glows beyond the bars
  const u = seg(t, tGate, tShoe);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#5B4BA8' }) + S.rect(0, 0, 1920, 560, 0, { fill: '#7A5CC0' });
  for (let i = 0; i < 24; i++) o += S.circle(hash(i * 3.1) * 1920, hash(i * 7.7) * 360, 3, { fill: '#FFFFFF', opacity: f(0.5 + 0.5 * Math.sin(t * 3 + i)) });
  const party = 0.5 + 0.5 * Math.sin(t * 9);
  o += S.circle(960, 470, 520, { fill: 'url(#s11warm)', opacity: 0.9 });
  o += S.g(S01.villa(t), 'translate(960 600) scale(0.62) translate(-960 -500)');
  o += S.circle(760, 470, 260, { fill: '#FF6FB5', opacity: f(0.18 * party) }) + S.circle(1180, 470, 260, { fill: '#34C3FF', opacity: f(0.18 * (1 - party)) });
  o += C.musicNotes(t, 860, 360) + C.musicNotes(t + 0.5, 1120, 380);
  o += S.rect(-100, 720, 2200, 500, 0, { fill: '#4A5A8A' }) + S.rect(-100, 720, 2200, 12, 0, { fill: '#6A7AAA' });
  // the gate
  let gate = S.rect(-100, 300, 2200, 30, 6, ol('#E2B33C', 6)) + S.rect(-100, 650, 2200, 26, 6, ol('#E2B33C', 6));
  for (let x = -60; x < 2000; x += 110) gate += S.rect(x, 310, 22, 520, 6, ol('#E2B33C', 5)) + S.path(`M${x - 6} 310 L${x + 11} 272 L${x + 28} 310 Z`, ol('#E2B33C', 5));
  gate += S.rect(760, 350, 280, 90, 14, ol('#2A1640', 6)) + T('VIP ONLY', 900, 412, 54, '#FFD21F');
  o += gate;
  // a street lamp lights Pickle
  o += S.path('M1480 1000 L1480 260 Q1480 220 1440 220 L1380 220', ln(18, '#2A2240')) + S.ellipse(1370, 236, 50, 22, ol('#FFE9A8', 5));
  o += S.path('M1370 250 L1060 1000 L1660 1000 Z', { fill: '#FFE9A8', opacity: 0.18 });
  const gift = S.rect(-60, -470, 120, 100, 10, ol('#FF5A8A', 5)) + S.rect(-12, -470, 24, 100, 0, { fill: '#FFD21F' }) + S.path('M0 -470 q-40 -40 -50 -6 q20 10 50 6 q40 -40 50 -6 q-20 10 -50 6', ol('#FFD21F', 4));
  const cam = { zoom: lerp(1.0, 1.12, u), x: 260, y: 120 };
  o = S.g(o, K.E.camTf(cam, 0.6));
  o += view(cam, actor('pickle', t, { x: 1300, y: 1020, s: 0.62, turn: -0.3, armL: 40, armR: 40, face: { name: 'sad', mouth: 'smallSmile', eyes: { look: [-0.6, -0.3] } }, props: [{ svg: gift, layer: 'front' }] }), 1);
  return memory(o, t, tGate, tShoe, '#C9B8FF');
}
function fbRain(t) {
  // the alley, the box, the rain — and Mia walking in with her phone light
  const cam = { zoom: lerp(1.0, 1.1, seg(t, tRain, tMia)), x: 60, y: 60 };
  let w = S.rect(-200, -200, 2400, 1000, 0, { fill: 'url(#s11brick)' }) + S.rect(-200, 760, 2400, 600, 0, { fill: '#3A3270' });
  w += S.path('M300 1000 L300 140 Q300 100 340 100 L440 100', ln(20, '#2A2240')) + S.ellipse(440, 120, 60, 26, ol('#FFE9A8', 6)) + S.path('M440 140 L180 1000 L760 1000 Z', { fill: '#FFE9A8', opacity: 0.2 });
  for (let i = 0; i < 5; i++) w += S.ellipse(200 + i * 380, 900 + (i % 2) * 60, 120, 16, { fill: '#8A7ACA', opacity: 0.45 });
  const box = (front) => front
    ? S.path('M560 1000 L960 1000 L960 760 L560 760 Z', ol('#C9945A', 8)) + S.path('M560 760 L500 690 M960 760 L1020 690', ln(10, '#B07A42')) + TF('THIS SIDE UP ↑', 760, 880, 40, '#7A4A1E')
    : S.path('M560 760 L500 690 L1020 690 L960 760 Z', ol('#A87442', 8));
  w += box(false);
  const looks = seg(t, tRain + 0.7, tRain + 1.0);
  w += actor('ty', t, { x: 760, y: 1010, s: 0.6, turn: 0.3 * looks, face: { name: looks > 0.5 ? 'amazed' : 'sad', mouth: looks > 0.5 ? 'o' : 'frown', eyes: { look: [0.6 * looks, -0.3 * looks] } }, armL: 6, armR: 6 }, { arms: false, energy: 0 });
  w += box(true);
  const walkU = seg(t, tRain, tRain + 0.9);
  const mx = lerp(1750, 1300, ease.out(walkU));
  if (walkU < 1) w += actor('mia', t, { x: mx, y: 1010, s: 0.6, view: 'side', ...A.walk((t - tRain) * 8, 0.8), armR: 50, face: { name: 'sad', mouth: 'line' } }, { arms: false, energy: 0 });
  else w += actor('mia', t, { x: mx, y: 1010, s: 0.6, turn: -0.5, armL: lerp(10, 70, seg(t, tRain + 0.9, tRain + 1.3)), armR: 30, face: { name: 'happy', mouth: 'smallSmile', eyes: { look: [-0.7, 0.2] } }, props: [miaPhone(30, 1)] }, { arms: false, energy: 0 });
  w += S.path(`M${f(mx + 60)} 640 L${f(mx - 500)} 760 L${f(mx - 520)} 1000 Z`, { fill: '#FFF6C8', opacity: 0.16 });
  let o = view(cam, w, 1) + K.rain(t, 110, { op: 0.45 });
  return memory(o, t, tRain, tMia, '#9FB8FF');
}

// ---------------------------------------------------------------- the two who stayed
function shotOpenEyes(t) {
  // F1: Ty opens his eyes, then looks back over his shoulder
  const cam = camKeys(t, [[tBack, { ...at(TYX + 30, headY(FL, SC) + 10, 2.5) }], [tTwo, { ...at(TYX + 80, headY(FL, SC) + 10, 2.25) }]]);
  const open = seg(t, tBack + 0.3, tBack + 0.5);
  const turn = ease.inOut(seg(t, tLook - 0.2, tLook + 0.3));
  let w = bankBg(t) + pedestal(t, { glow: 0.7 });
  w += actor('ty', t, { x: TYX, y: FL, s: SC, turn: lerp(-0.2, 0.55, turn), face: { name: 'sad', eyes: open < 0.5 ? { type: 'closed' } : { look: [lerp(0, 0.9, turn), 0] } }, headRot: 3 * turn }, { arms: false, energy: 0.4 });
  return view(cam, w, 1) + soft(1700, 400, 800, 's11warm', 0.8);
}
function shotTwo(t) {
  // F2: reverse — Pickle and Mia, backlit by the round window; slow push-in
  const cam = camKeys(t, [[tTwo, { ...at(1650, 650, 1.95) }], [tGate, { ...at(1650, 660, 2.2) }]]);
  const wave = seg(t, tTwo + 0.6, tTwo + 0.9);
  let w = bankBg(t);
  w += actor('pickle', t, { x: PKX, y: FL, s: SC, turn: -0.15, face: { name: 'happy', eyes: { look: [-0.3, 0] } }, armR: lerp(12, 120 + 14 * Math.sin(t * 10), wave), armL: 12 }, { arms: false });
  const down = seg(t, tTwo + 1.0, tTwo + 1.4);
  w += actor('mia', t, { x: MIX, y: FL, s: SC, turn: -0.2, face: { name: down > 0.5 ? 'happy' : 'deadpan', mouth: down > 0.5 ? 'smallSmile' : undefined, eyes: { look: [lerp(0, -0.4, down), lerp(0.5, 0, down)] } }, armL: lerp(40, 14, down), armR: 10, props: down < 0.8 ? [miaPhone(lerp(40, 14, down), -1)] : [] }, { arms: false });
  return view(cam, w, 1) + soft(1500, 330, 650, 's11warm', 0.9);
}
function shotShoe(t) {
  // G: present — tilt from Pickle's shy smile down to the one red shoe and the sock; toes wiggle
  const hy = headY(FL, SC, 0.95), fy = FL - 50;
  const cam = camKeys(t, [[tShoe, { ...at(PKX, hy, 2.2) }], [tShoe + 0.6, { ...at(PKX, fy - 20, 2.4) }], [tRain, { ...at(PKX, fy - 30, 2.5) }]]);
  let w = bankBg(t);
  const wig = Math.sin(t * 18) * seg(t, tShoe + 0.5, tShoe + 0.7);
  w += actor('pickle', t, { x: PKX, y: FL, s: SC, face: { name: 'cute', mouth: 'smallSmile' }, armL: 10, armR: 10, legL: -2 + 2 * wig });
  let o = view(cam, w, 1);
  if (wig !== 0) o += S.path('M700 640 q-30 20 0 40 M660 600 q-40 30 0 60', ln(8, '#FFFFFF', 0.8)) + K.F.sparkle(1180, 600, 30 * Math.abs(Math.sin(t * 6)));
  return o;
}
function shotMiaNow(t) {
  // H: Mia, present: she looks up from her phone, a tiny smile, looks away
  const cam = camKeys(t, [[tMia, { ...at(MIX - 20, headY(FL, SC, 1.04), 2.3) }], [tPk, { ...at(MIX - 20, headY(FL, SC, 1.04), 2.45) }]]);
  const up = seg(t, tMia + 0.1, tMia + 0.3);
  let w = bankBg(t);
  w += actor('mia', t, { x: MIX, y: FL, s: SC, turn: -0.25, face: { name: 'happy', mouth: 'smallSmile', eyes: { look: [lerp(0, 0.7, seg(t, tMia + 0.6, tMia + 0.8)), lerp(0.5, 0, up)] }, fx: ['blush'] }, armL: 40, armR: 10, props: [miaPhone(40, -1)] }, { arms: false });
  return view(cam, w, 1) + soft(1500, 300, 600, 's11warm', 0.8);
}
// two-shot / three-shot staging
const T2 = 1170, P2 = 1400, M2 = 960;
function underUmbrella(t) {
  // umbrella foot follows Pickle's raised screen-left hand; it leans over Ty, then stretches to cover Mia too
  const raise = ease.inOut(seg(t, tUmb - 0.5, tUmb - 0.1));
  const cover = ease.inOut(seg(t, tMeToo + 0.2, tMeToo + 0.7));
  const armL = lerp(14, lerp(128, 104, cover), raise);
  const [hx, hy] = A.hand(armL, -1);
  const s = SC * 0.95;
  return { armL, hx: P2 + hx * s, hy: FL + hy * s, open: seg(t, tUmb, tUmb + 0.3), tilt: lerp(-16, -8, cover), r: lerp(220, 300, cover), sl: lerp(190, 235, cover) };
}
function shotPickle(t) {
  // I1: Pickle close, warm: "Whatever you pick, Ty..."
  const cam = camKeys(t, [[tPk, { ...at(PKX - 10, headY(FL, SC, 0.95) + 40, 2.45) }], [tUmb2, { ...at(PKX - 10, headY(FL, SC, 0.95) + 40, 2.7) }]]);
  let w = bankBg(t);
  w += actor('pickle', t, { x: PKX, y: FL, s: SC, turn: -0.3, face: { name: 'happy', eyes: { look: [-0.6, 0] } } }, { energy: 0.7 });
  return view(cam, w, 1) + soft(1300, 250, 700, 's11warm', 0.9);
}
function shotUmbrella(t, three = false) {
  // I2 / J: Ty + Pickle under the tiny umbrella; Mia steps in; Ty goes for a hug — palm block
  const U = underUmbrella(t);
  let cam = three ? camKeys(t, [[tMiaIn, { ...at(1170, 640, 1.42) }], [tBlock - 0.02, { ...at(1160, 640, 1.52) }], [tBlock + 0.12, { ...at(1080, 650, 1.95) }], [tTurnBtn, { ...at(1080, 650, 2.05) }]])
    : camKeys(t, [[tUmb2, { ...at(1290, 640, 1.5) }], [tMiaIn, { ...at(1290, 620, 1.62) }]]);
  if (three && t > tBlock) { const sh = K.shake(t, tBlock, 0.25, 10); cam = { ...cam, sx: sh.sx, sy: sh.sy }; }
  let w = bankBg(t) + pedestal(t, { glow: 0.5 });
  // Mia: steps in on "Me too", then the palm
  const step = ease.inOut(seg(t, tMeToo - 0.1, tMeToo + 0.5));
  const block = ob(seg(t, tBlock - 0.06, tBlock + 0.1));
  const hug = ease.inOut(seg(t, tHug, tBlock - 0.05));
  let palmW = '';
  if (three) {
    const mx = lerp(760, M2, step);
    const walking = step > 0 && step < 1;
    const miaFace = t > tBlock ? { name: 'deadpan', eyes: { look: [0.7, 0] } } : { name: step > 0.6 ? 'happy' : 'deadpan', mouth: undefined, eyes: { look: [0.6, 0] }, fx: step > 0.6 ? ['blush'] : [] };
    const armR = block > 0 ? lerp(12, 112, block) : 12;
    if (block > 0) {
      // the palm is drawn after Ty (world space) so it lands ON his face
      const [hx, hy] = A.hand(armR, 1), z = SC * 1.04;
      palmW = S.g(S.path('M-26 -50 L-26 -96 M-4 -54 L-4 -108 M18 -50 L18 -100 M38 -30 L60 -62', ln(30, '#151515')) + S.path('M-26 -50 L-26 -96 M-4 -54 L-4 -108 M18 -50 L18 -100 M38 -30 L60 -62', ln(18, '#F4D3BC')) +
        S.rect(-46, -64, 96, 116, 26, ol('#F4D3BC', 6)) + S.path('M-20 10 Q0 22 24 10', ln(4, '#D9A88A')), `translate(${f(mx + (hx + 40) * z)} ${f(FL + (hy - 30) * z)}) scale(${f(z * 1.25 * block)}) rotate(8)`);
    }
    w += actor('mia', t, { x: mx, y: FL, s: SC, turn: 0.4, ...(walking ? A.walkFront((t - tMeToo) * 9, 0.6) : {}), armL: 30, armR, face: miaFace, props: [miaPhone(30, -1)] }, { arms: false });
  }
  // Ty: looks at Pickle; at the hug he turns to Mia, arms wide, squished by the palm
  const tyTurn = three ? lerp(0.45, -0.55, ease.inOut(seg(t, tMeToo + 0.3, tMeToo + 0.7))) : 0.45;
  let tyFace = { name: 'happy', eyes: { look: [0.8, -0.2] }, fx: ['sparkles'] };
  if (three && t > tMeToo + 0.4) tyFace = { name: 'cute', mouth: 'wavy', fx: ['blush'] };
  if (three && t > tBlock) tyFace = { name: 'oof', mouth: 'wavy', eyes: { type: 'x' } };
  const tyArm = three ? lerp(10, 100, hug) * (1 - 0.6 * seg(t, tBlock + 0.3, tBlock + 0.8)) : 10;
  w += actor('ty', t, { x: three ? T2 - 30 * hug + 20 * block : T2, y: FL, s: SC, turn: tyTurn, armL: tyArm, armR: tyArm, lean: three ? -8 * hug + 6 * block : 0, face: tyFace }, { arms: false });
  // Pickle with the umbrella
  w += actor('pickle', t, { x: P2, y: FL, s: SC, turn: -0.4, armL: U.armL, armR: 12, face: { name: three && t > tBlock ? 'confused' : 'happy', eyes: { look: [-0.7, -0.2] } } }, { arms: false });
  w += palmW + umbrella(U.hx, U.hy, U.r, U.open, U.tilt, U.sl);
  let o = view(cam, w, 1) + soft(1500, 260, 700, 's11warm', 0.85);
  if (!three && U.open > 0 && U.open < 1) o += view(cam, C.burst(U.hx - 120, U.hy - U.r * 0.9, U.open, '#FFD21F'), 1);
  if (!three && t > tUmb) o += bang('POMF!', 560, 260, seg(t, tUmb, tUmb + 0.1) * (1 - seg(t, tUmb + 0.8, tUmb + 1.0)), 80, -8, '#FFD21F');
  if (three && t > tBlock) o += bang('BLOCKED!', 1440, 300, seg(t, tBlock, tBlock + 0.1) * (1 - seg(t, tBlock + 0.8, tBlock + 1.0)), 96, 8, '#FF6FB5');
  return o;
}
function shotTurn(t) {
  // K: Ty turns back to the button — the glass dome flips off; the fist goes up
  const cam = camKeys(t, [[tTurnBtn, { ...at(1110, 610, 1.5) }], [tShout, { ...at(1090, 590, 1.75) }]]);
  const open = seg(t, tTurnBtn + 0.04, tTurnBtn + 0.4);
  const fist = ease.out(seg(t, tTurnBtn + 0.2, tShout));
  let w = bankBg(t) + pedestal(t, { open, glow: 0.9 });
  w += actor('pickle', t, { x: 1560, y: FL, s: SC, turn: -0.5, face: { name: 'amazed', eyes: { look: [-0.8, 0] } } });
  w += actor('mia', t, { x: 1760, y: FL, s: SC, turn: -0.5, face: { name: 'shocked', eyes: { look: [-0.8, 0] } }, props: [miaPhone(30, -1)], armL: 30 });
  w += actor('ty', t, { x: 1250, y: FL, s: SC, view: 'side', armL: lerp(60, 190, fist), armR: -10, lean: -4 * fist, face: { name: 'determined' } }, { arms: false });
  return view(cam, w, 1) + soft(700, 500, 700, 's11red', 0.6);
}
function shotShout(t) {
  // L: smash zoom — "RESET!", red light, speed lines
  const u = seg(t, tShout, tSlam);
  const cam = { ...at(TYX - 40, headY(FL, SC) - 30, lerp(2.6, 3.0, ease.out(u))) };
  const sh = K.shake(t, tShout, 0.3, 14); cam.sx = sh.sx; cam.sy = sh.sy;
  let w = bankBg(t) + pedestal(t, { open: 1, glow: 1 });
  w += actor('ty', t, { x: TYX, y: FL, s: SC, turn: -0.3, armR: 170, armL: 20, face: { name: 'angry', fx: [] } }, { arms: false, energy: 1.5 });
  let o = view(cam, w, 1);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FF2040', opacity: 0.18 });
  o += C.speedLines(0, 1920, 540, 26, 11, '#FFFFFF', 1100);
  return o;
}
function shotSlam(t) {
  // M: the fist hits the button; squash, shockwave, flash
  const u = seg(t, tSlam - 0.05, tSlam + 0.03);
  const press = t < tSlam ? 0 : 1 - 0.4 * seg(t, tSlam + 0.1, tWorld);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#0F3F48' });
  o += S.circle(960, 640, 900, { fill: 'url(#s11red)' });
  // button big in screen space
  const x = 960, by = 760, rx = 560, h = 200 * (1 - 0.75 * press);
  o += S.ellipse(x, by + 30, 680, 170, ol('#2A2A33', 14));
  o += S.path(`M${x - rx} ${by} L${x - rx} ${f(by - h)} A${rx} 150 0 0 1 ${x + rx} ${f(by - h)} L${x + rx} ${by} A${rx} 150 0 0 1 ${x - rx} ${by} Z`, ol('#C8102E', 14));
  o += S.ellipse(x, by - h, rx, 150, ol('#FF3B4E', 14)) + S.ellipse(x - 200, by - h - 50, 200, 46, { fill: '#FFFFFF', opacity: 0.4 });
  // the fist (mustard sleeve + skin block) from above
  const fy = lerp(-500, by - h - 140, ease.in(u));
  o += S.rect(800, fy - 900, 320, 860, 30, ol('#F2B53A', 12)) + S.rect(790, fy - 120, 340, 80, 24, ol('#D9962A', 12)) + S.rect(820, fy - 60, 280, 200, 40, ol('#E9B38B', 12));
  if (t >= tSlam) {
    const k = seg(t, tSlam, tSlam + 0.35);
    for (let i = 0; i < 3; i++) { const kk = clamp(k * 1.4 - i * 0.2, 0, 1); if (kk > 0 && kk < 1) o += S.ellipse(x, by - 40, 600 + 900 * kk, 160 + 240 * kk, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 30 * (1 - kk), opacity: f(1 - kk) }); }
    o += bang('KA-CHUNK!', 960, 260, seg(t, tSlam, tSlam + 0.06), 150, -6, '#FFD21F');
  }
  const sh = K.shake(t, tSlam, 0.3, 30);
  return S.g(o, `translate(${f(sh.sx)} ${f(sh.sy)})`) + C.whiteFlash(seg(t, tSlam + 0.05, tWorld - 0.02));
}

// ---------------------------------------------------------------- the reset wave: coins fly back into screens (shared with SC 12)
const SCREENS = [
  { x: 440, y: 330, w: 460, h: 260 },   // billboard on the left tower
  { x: 1480, y: 420, w: 330, h: 210 },  // TV in an apartment window
  { x: 1660, y: 770, w: 210, h: 360, phone: true }, // a phone in someone's hand
];
function screenFace(sc, t, glow) {
  let o = S.rect(-sc.w / 2, -sc.h / 2, sc.w, sc.h, 18, ol('#1A1A22', 10));
  o += S.rect(-sc.w / 2 + 12, -sc.h / 2 + 12, sc.w - 24, sc.h - 24, 10, { fill: '#4FC3F7' });
  o += S.rect(-sc.w / 2 + 12, sc.h / 2 - 60, sc.w - 24, 48, 0, { fill: '#3BD16F' });
  for (let i = 0; i < 3; i++) o += S.rect(-sc.w / 2 + 30 + i * (sc.w / 3.4), -10 - i * 18, sc.w / 5, 18, 5, ol(['#FF5A5A', '#FFD21F', '#B06BFF'][i], 3));
  o += coin(sc.w / 2 - 50, -sc.h / 2 + 46, 26, 0, t * 4);
  o += S.rect(-sc.w / 2 + 12, -sc.h / 2 + 12, sc.w - 24, sc.h - 24, 10, { fill: '#FFFFFF', opacity: f(0.75 * glow) });
  return o;
}
// The reset wave: every coin in the world leaps up and streams back into the nearest screen, then pops into pixels.
function coinReturn(t, t0 = tWorld) {
  const age = t - t0;
  const cam = { zoom: lerp(1.16, 1.02, ease.out(seg(age, 0, 1.8))), x: 0, y: 40 };
  let w = S.rect(-400, -400, 2720, 1880, 0, { fill: 'url(#s11dusk)' });
  w += S.circle(960, 780, 200, { fill: '#FFE7A0', opacity: 0.9 });
  for (let i = 0; i < 16; i++) { const bx = -200 + i * 150, bh = 260 + hash(i * 5.1) * 340; w += S.rect(bx, 1000 - bh, 140, bh + 200, 6, { fill: '#4A2E78' }) + S.rect(bx + 4, 1010 - bh, 132, bh, 0, { fill: 'url(#s11win)', opacity: 0.7 }); }
  // the bank tower in the middle, ringing out the reset
  w += S.rect(860, 300, 200, 800, 8, ol('#0F3F48', 7)) + S.path('M840 300 L960 180 L1080 300 Z', ol('#E2B33C', 7)) + coin(960, 250, 34, 0, t * 2);
  for (let i = 0; i < 2; i++) { const k = clamp(age * 1.1 - i * 0.35, 0, 1); if (k > 0 && k < 1) w += S.circle(960, 250, 80 + k * 1400, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 26 * (1 - k), opacity: f(0.7 * (1 - k)) }); }
  w += S.rect(300, 220, 280, 900, 6, { fill: '#3A2560' }) + S.rect(1330, 330, 300, 790, 6, { fill: '#3A2560' });
  const hits = [0, 0, 0];
  let trails = '', coins = '';
  const N = 44;
  for (let i = 0; i < N; i++) {
    const si = i % 3, sc = SCREENS[si];
    const st = hash(i * 1.7) * 0.55, dur = 0.55 + 0.35 * hash(i * 2.9);
    const u = (age - st) / dur;
    const x0 = -100 + hash(i * 4.3) * 2100, y0 = 900 + hash(i * 6.1) * 120;
    if (u < 0) { coins += coin(x0, y0 - Math.abs(Math.sin(t * 20 + i)) * 10, 30, i * 30, i); continue; }
    if (u > 1) { hits[si] += 1; coins += pixelPoof(sc.x, sc.y, (u - 1) * dur, 5, '#FFD21F', i); continue; }
    const bz = (e) => {
      const B = (a, b, c, d) => (1 - e) ** 3 * a + 3 * (1 - e) ** 2 * e * b + 3 * (1 - e) * e * e * c + e ** 3 * d;
      return [B(x0, x0, sc.x + (hash(i) - 0.5) * 500, sc.x), B(y0, y0 - 650, sc.y - 320, sc.y)];
    };
    const e = ease.inOut(u);
    const [x, y] = bz(e);
    let tr = '';
    for (let q = 0; q <= 6; q++) { const [a, b] = bz(Math.max(0, e - 0.25 + q * 0.04)); tr += (q ? ' L' : 'M') + f(a) + ' ' + f(b); }
    trails += S.path(tr, ln(12, '#FFE98A', 0.55));
    if (u > 0.82) { const k = 1 - (u - 0.82) / 0.18; for (let q = 0; q < 4; q++) coins += S.rect(x - 18 + (q % 2) * 20, y - 18 + Math.floor(q / 2) * 20, 16 * k, 16 * k, 2, { fill: '#FFD21F', stroke: '#151515', 'stroke-width': 2 }); }
    else coins += coin(x, y, 34 * (1 - 0.55 * e), i * 40, t * 9 + i);
  }
  let scr = '';
  SCREENS.forEach((sc, i) => {
    const glow = clamp(0.1 + 0.07 * hits[i] * (0.6 + 0.4 * Math.sin(t * 24 + i)), 0, 0.85);
    if (sc.phone) scr += S.g(S.rect(-70, 150, 140, 400, 44, ol('#E0A985', 8)) + S.rect(-130, 40, 130, 80, 34, ol('#E0A985', 7)), `translate(${sc.x} ${sc.y}) rotate(-8)`);
    scr += S.g(screenFace(sc, t, glow), `translate(${sc.x} ${sc.y}) rotate(${sc.phone ? -8 : 0}) scale(${f(1 + 0.03 * Math.sin(t * 30 + i) * Math.min(1, hits[i]))})`);
  });
  w += scr + trails + coins;
  return view(cam, w, 1);
}

// ---------------------------------------------------------------- router
function scene(t) {
  if (t < tAll - 0.2) return shotEstablish(t);
  if (t < tSysCut) return shotDiagram(t);
  if (t < tHes) return shotTyLit(t);
  if (t < tEyes) return shotHesitate(t);
  if (t < tMan) return shotEyes(t);
  if (t < tBrush) return fbMansion(t);
  if (t < tFriends) return fbBrush(t);
  if (t < tBack) return fbFriends(t);
  if (t < tTwo) return shotOpenEyes(t);
  if (t < tGate) return shotTwo(t);
  if (t < tShoe) return fbGate(t);
  if (t < tRain) return shotShoe(t);
  if (t < tMia) return fbRain(t);
  if (t < tPk) return shotMiaNow(t);
  if (t < tUmb2) return shotPickle(t);
  if (t < tMiaIn) return shotUmbrella(t, false);
  if (t < tTurnBtn) return shotUmbrella(t, true);
  if (t < tShout) return shotTurn(t);
  if (t < tSlam) return shotShout(t);
  if (t < tWorld) return shotSlam(t);
  return coinReturn(t, tWorld) + C.whiteFlash(1 - seg(t, tWorld, tWorld + 0.3));
}

function look(t) {
  if (t >= tMan && t < tBack) return { grade: 'warm', vignette: 0.6 };
  if (t >= tRain && t < tMia) return { grade: 'cool', vignette: 0.7 };
  if (t >= tGate && t < tShoe) return { grade: 'cool', vignette: 0.7 };
  if (t >= tSlam) return { grade: 'warm', vignette: 0.5 };
  return { grade: 'warm', vignette: 1 };
}

module.exports = { scene, look, DEFS, coinReturn, tWorld, pixelPoof, umbrella, memory };
