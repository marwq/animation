// SC 06b · DAD GOES PRO — the brilliant idea → tie ripped off in a dramatic wind → RGB chair/headset/socks montage →
// the lava obby (attempt 312, OOF) → "The lava is RIGGED!" → Grandma's stream (NanaBea_Pro · LIVE · 2.1M) → Dad sulks back to work.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor, coin, coinBurst, rays, bang } = K;
const { L } = K.V;
const C = K.C;
const A = require('./acting');
const E6 = require('./s06_env');
const { rgb, hue, whip, flashAt, dadNoTie, actorWith, stamp } = E6;
const S01 = require('./s01');

const l0 = L('06b.0'), l1 = L('06b.1'), l2 = L('06b.2'), l3 = L('06b.3'), l4 = L('06b.4'), l5 = L('06b.5'), l6 = L('06b.6'), l7 = L('06b.7'), l8 = L('06b.8'), l9 = L('06b.9'), l10 = L('06b.10');
const START = K.V.scene('SC 06b').start, END = K.V.scene('SC 07').start;
const tIdea = l0.word('brilliant').t0;
const tB1 = l1.a - 0.1, tB2 = l1.word('quitting').t0 - 0.12, tJob = l1.word('job').t0, tGoing = l1.word('going').t0, tPro = l1.word('PRO').t0;
const tC1 = l2.a - 0.06, tRgb1 = l2.word('RGB').t0, tChair = l2.word('chair').t0;
const tC2 = l2.word('An', 1).t0 - 0.05, tRgb2 = l2.word('RGB', 1).t0, tHead = l2.word('headset').t0;
const tC3 = l2.word('And').t0 - 0.05, tRgb3 = l2.word('RGB', 2).t0, tSocks = l2.word('socks').t0;
const tD1 = l3.a - 0.06, tJ1 = l3.word('jump').t0, tJ2 = l3.word('jump', 1).t0, tJ3 = l3.word('jump', 2).t0;
const tD2 = tJ2 - 0.15, tD3 = tJ3 - 0.08;
const tOof = l4.a, tDied = l4.word('You').t0, tE2 = l4.word('Attempt').t0 - 0.12, tTwelve = l4.word('twelve').t0;
const tF = l5.a - 0.12, tRig = l5.word('RIGGED').t0;
const tG = l6.a - 0.05, tBut = l6.word('But').t0 - 0.12;
const tI1 = l7.a - 0.1, tNana = l7.word('NanaBea').t0, tSpeed = l7.word('Speedrun').t0, tNoJ = l7.word('no').t0, tEyes = l7.word('eyes').t0, tGo0 = l7.word("Let's").t0, tGo = l7.word('GO').t0;
const tJ1s = l8.a - 0.05, tWorld = l8.word('world').t0 - 0.1, tTwoM = l8.word('Two').t0 - 0.1, tMore0 = l8.word('She').t0 - 0.12, tMore = l8.word('more').t0, tDadW = l8.word('Dad').t0, tYear = l8.word('year').t0;
const tK = l9.a - 0.35, tL = l10.a - 0.06, tLike = l10.word('Like').t0, tSub = l10.word('subscribe').t0;

const DEFS = `<defs>
<linearGradient id="s6bLiving" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE7C8"/><stop offset="1" stop-color="#FFD3A8"/></linearGradient>
<radialGradient id="s6bDrama" cx="0.5" cy="0.7" r="0.8"><stop offset="0" stop-color="#FFB347"/><stop offset="0.5" stop-color="#D2426E"/><stop offset="1" stop-color="#2A1050"/></radialGradient>
<linearGradient id="s6bGamer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#140F2E"/><stop offset="1" stop-color="#2A1E52"/></linearGradient>
<linearGradient id="s6bObby" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2B1B6B"/><stop offset="1" stop-color="#7A3AB8"/></linearGradient>
<linearGradient id="s6bLava" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD23F"/><stop offset="0.3" stop-color="#FF7A1A"/><stop offset="1" stop-color="#C21E1E"/></linearGradient>
<linearGradient id="s6bNana" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A1E7A"/><stop offset="1" stop-color="#FF6FB5"/></linearGradient>
<linearGradient id="s6bDusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A1E6A"/><stop offset="0.6" stop-color="#A04A9A"/><stop offset="1" stop-color="#FF9C6B"/></linearGradient>
<radialGradient id="s6bHall" cx="0.5" cy="0.9" r="0.8"><stop offset="0" stop-color="#FF6FB5" stop-opacity="0.7"/><stop offset="1" stop-color="#FF6FB5" stop-opacity="0"/></radialGradient>
</defs>`;

// ---------------------------------------------------------------- props
const mug = () => S.rect(-34, -50, 68, 84, 12, ol('#FFFFFF', 6)) + S.path('M34 -30 Q70 -20 34 16', ln(10)) + S.path('M34 -30 Q62 -20 34 16', ln(4, '#FFFFFF')) + S.path(K.F.heartPath(0, -6, 14), ol('#FF5A7A', 3)) + S.path('M-14 -70 q10 -14 0 -26 M10 -66 q10 -14 0 -26', ln(5, '#FFFFFF', 0.7));
function headset(t, mic = true) {
  // RGB gamer headset in head space (front/back view)
  let o = S.path('M-196 -720 Q-210 -1010 0 -1018 Q210 -1010 196 -720', ln(30, '#1A1A22')) + S.path('M-190 -740 Q-200 -995 0 -1002 Q200 -995 190 -740', ln(10, rgb(t, 0)));
  for (const sx of [-1, 1]) {
    o += S.rect(sx * 205 - 50, -820, 100, 170, 34, ol('#1A1A22', 7)) + S.rect(sx * 205 - 34, -800, 68, 130, 24, { fill: rgb(t, sx > 0 ? 120 : 240) });
    o += S.rect(sx * 205 - 20, -780, 22, 60, 10, { fill: '#FFFFFF', opacity: 0.4 });
  }
  if (mic) o += S.path('M-205 -690 Q-190 -600 -70 -600', ln(12, '#1A1A22')) + S.circle(-66, -600, 18, ol(rgb(t, 60), 5));
  return o;
}
function tieProp(col = '#D2364B') {
  return S.path('M-16 0 L16 0 L22 140 L0 166 L-22 140 Z', ol(col, 5)) + S.path('M-22 -24 L22 -24 L16 4 L-16 4 Z', ol(col, 5));
}
// Dad with optional tie / headset / mug; speaker-driven acting
function dad(t, x, y, s, pose = {}, act = {}, o = {}) {
  const auto = K.V.perform('DAD', t, { seed: 3 * 3.7 + (act.seed || 0), ...act });
  const p = { ...auto, ...pose };
  const props = [...(pose.props || [])];
  if (o.headset) props.push(S01.headProp(headset(t, o.mic !== false), p));
  if (o.mug) {
    const a = pose.armL ?? 20;
    const [hx, hy] = A.hand(a, -1);
    props.push({ svg: S.g(mug(), `translate(${f(hx - 10)} ${f(hy + 10)})`), layer: 'front' });
  }
  const pp = { x, y, s, ...pose, props };
  return o.noTie ? actorWith(dadNoTie, 'DAD', t, pp, act) : actor('dad', t, pp, act);
}
function grandma(t, x, y, s, pose = {}, act = {}) { return actor('grandma', t, { x, y, s, ...pose }, act); }

// ---------------------------------------------------------------- living room
function livingRoom(t) {
  let o = S.rect(-600, -400, 3120, 1220, 0, { fill: 'url(#s6bLiving)' });
  for (let x = -600; x < 2520; x += 90) o += S.rect(x, -400, 40, 1220, 0, { fill: '#FFFFFF', opacity: 0.18 });
  o += S.rect(-600, 760, 3120, 600, 0, { fill: '#B98A6A' }) + S.rect(-600, 740, 3120, 30, 0, ol('#FFFFFF', 5));
  // window with evening light
  o += S.rect(1300, 120, 420, 360, 16, ol('#9FD8FF', 8)) + S.path('M1510 120 L1510 480 M1300 300 L1720 300', ln(8, '#FFFFFF'));
  o += S.path('M1270 100 Q1340 300 1290 500 L1240 500 L1240 100 Z', ol('#5BC0B0', 6)) + S.path('M1750 100 Q1680 300 1730 500 L1780 500 L1780 100 Z', ol('#5BC0B0', 6));
  // family photos
  o += S.rect(560, 160, 170, 130, 8, ol('#FFF4E0', 7)) + S.rect(580, 180, 130, 90, 4, { fill: '#9FD8FF' }) + S.circle(645, 230, 24, { fill: '#F2B53A' });
  o += S.rect(780, 200, 120, 150, 8, ol('#FFF4E0', 7)) + S.rect(796, 216, 88, 118, 4, { fill: '#FFB4C8' });
  // lamp
  o += S.rect(1890, 380, 14, 380, 4, ol('#5A4A3A', 4)) + S.path('M1830 380 L1960 380 L1930 290 L1860 290 Z', ol('#FFE9A8', 6));
  // rug
  o += S.ellipse(960, 960, 760, 110, ol('#E86F5A', 6)) + S.ellipse(960, 960, 640, 80, { fill: 'none', stroke: '#FFB38A', 'stroke-width': 12 });
  return o;
}
function couchBack() { return S.rect(560, 470, 900, 300, 50, ol('#3FB3A6', 8)) + S.rect(500, 560, 120, 270, 40, ol('#2E968A', 8)) + S.rect(1400, 560, 120, 270, 40, ol('#2E968A', 8)); }
function couchSeat() { return S.rect(600, 690, 820, 120, 30, ol('#46C2B4', 8)); }
function coffeeTable(t) {
  let o = S.rect(560, 790, 900, 46, 14, ol('#C98A5A', 7)) + S.rect(600, 836, 820, 150, 10, ol('#A86B3C', 7)) + S.rect(620, 980, 40, 40, 6, ol('#5A3B26', 5)) + S.rect(1360, 980, 40, 40, 6, ol('#5A3B26', 5));
  o += S.rect(680, 760, 160, 30, 6, ol('#FF6FB5', 5)) + S.rect(700, 740, 140, 22, 6, ol('#34C3FF', 5)) + S.rect(1220, 720, 70, 70, 14, ol('#4A4F66', 5)) + S.circle(1240, 748, 7, { fill: '#FF5A5A' }) + S.circle(1270, 748, 7, { fill: '#3BD16F' });
  return o;
}
function couchFront() { return S.rect(600, 700, 820, 140, 30, ol('#46C2B4', 8)) + S.path('M1010 710 L1010 830', ln(5, '#2E968A')) + S.rect(620, 840, 40, 40, 8, ol('#5A3B26', 5)) + S.rect(1360, 840, 40, 40, 8, ol('#5A3B26', 5)); }
function newsTV(t) {
  // TV on a stand at the left, angled toward the couch
  let o = S.rect(40, 640, 360, 130, 10, ol('#8A5A34', 6));
  let scr = S.rect(-150, -100, 300, 200, 0, { fill: '#123' }) + S.rect(-150, 40, 300, 60, 0, { fill: '#D7263D' }) + TF('GAMERS GET PAID!', 0, 82, 26, '#FFFFFF');
  scr += K.coin(-60, -20, 40, 0, t * 4) + S.rect(10, -50, 100, 60, 22, ol('#4A4F66', 4)) + S.circle(40, -20, 8, { fill: '#FF5A5A' }) + S.circle(80, -20, 8, { fill: '#3BD16F' });
  o += S.g(S.rect(-170, -120, 340, 240, 16, ol('#1A1A22', 10)) + scr, 'translate(220 520) skewY(8)');
  return o;
}
function shotIdea(t) {
  // A: Dad on the couch with his mug, watching "GAMERS GET PAID!"; on "brilliant idea" a lightbulb DINGs on
  const cam = camKeys(t, [[START, { zoom: 1.0, x: -40, y: 0 }], [tIdea, { zoom: 1.12, x: 40, y: -20 }], [tIdea + 0.15, { zoom: 1.32, x: 60, y: -60 }], [tB1, { zoom: 1.36, x: 60, y: -60 }]]);
  let o = livingRoom(t) + couchBack();
  const idea = t >= tIdea;
  o += couchSeat();
  o += dad(t, 1010, 870, 0.5, { turn: -0.45, armL: 70, armR: idea ? 150 : 14, bodyY: 60, face: idea ? { name: 'amazed', eyes: { look: [-0.2, -0.8] } } : { name: 'deadpan', eyes: { look: [-0.9, 0] } }, shadow: false }, { arms: false }, { mug: true });
  o += coffeeTable(t) + newsTV(t);
  // TV glow on Dad
  o += S.ellipse(1000, 560, 260, 200, { fill: '#9FD8FF', opacity: f(0.08 + 0.04 * Math.sin(t * 13)) });
  if (idea) {
    const k = ease.outBack(seg(t, tIdea, tIdea + 0.3));
    let b = rays(0, 0, 14, 230, '#FFF6A0', 0.5, t * 60) + S.circle(0, 0, 70, ol('#FFF4A0', 7)) + S.rect(-36, 56, 72, 50, 10, ol('#B8BCC8', 6)) + S.path('M-20 20 Q0 -30 20 20', ln(6, '#E0A21A'));
    o += S.g(b, `translate(1040 ${f(170 - 20 * Math.sin(t * 5))}) scale(${f(k)})`);
    o += bang('DING!', 1260, 200, seg(t, tIdea + 0.05, tIdea + 0.2) * (1 - seg(t, tB1 - 0.3, tB1)), 80, 10, '#FFE14D');
  }
  let out = K.view(cam, o, 1);
  out += whip(1 - seg(t, START, START + 0.2), -1);
  return out;
}

// ---------------------------------------------------------------- "I'm quitting my job. I'm going PRO."
function wind(t, k, col = '#FFFFFF') {
  let o = '';
  for (let i = 0; i < 26; i++) {
    const y = hash(i * 3.3) * 1100 - 10, len = 200 + hash(i) * 500, sp = 2600 + hash(i * 5) * 1800;
    const x = 2200 - ((t * sp + hash(i * 7) * 3000) % 3000);
    o += S.rect(x, y, len, 6 + hash(i * 9) * 10, 8, { fill: col, opacity: f(0.6 * k) });
  }
  return o;
}
function papers(t, k) {
  let o = '';
  for (let i = 0; i < 12; i++) {
    const sp = 1400 + hash(i) * 900, x = 2100 - ((t * sp + hash(i * 3) * 2400) % 2400), y = 100 + hash(i * 5) * 800 + Math.sin(t * 6 + i) * 60;
    o += S.g(S.rect(-40, -26, 80, 52, 4, ol('#FFFFFF', 4)) + S.path('M-28 -10 L28 -10 M-28 6 L20 6', ln(3, '#9AA0AE')), `translate(${f(x)} ${f(y)}) rotate(${f(t * 400 + i * 50)})`, { opacity: f(k) });
  }
  return o;
}
function shotStand(t) {
  // B1: Dad rises, mug in hand, slow push-in; the curtains start to blow
  const cam = camKeys(t, [[tB1, { zoom: 1.0, x: 0, y: 40 }], [tB2, { zoom: 1.25, x: 20, y: -40 }]]);
  const rise = ease.out(seg(t, tB1, tB1 + 0.5));
  let o = livingRoom(t) + couchBack() + couchFront();
  o += dad(t, 960, 1010, 0.6, { turn: -0.1, armL: 70, armR: 20, bodyY: lerp(90, 0, rise), sy: 1 + 0.04 * bump(t, tB1 + 0.3, tB1 + 0.6), face: { name: 'sneaky', eyes: { look: [0.2, 0] } } }, { energy: 0.8 }, { mug: true });
  let out = K.view(cam, o, 1);
  out += wind(t, 0.3 * seg(t, tB1 + 1.2, tB2));
  out += flashAt(t, tB1, 0.5);
  return out;
}
function shotPro(t) {
  // B2: anime power-up backdrop; on "quitting my job" he rips the tie off (it flies away), then "PRO" low-angle smash-zoom
  const pro = t >= tPro - 0.05;
  const cam = pro ? camKeys(t, [[tPro - 0.05, { zoom: 1.5, x: 0, y: -60 }], [tPro + 0.2, { zoom: 1.32, x: 0, y: -40 }], [tC1, { zoom: 1.4, x: 0, y: -50 }]])
    : camKeys(t, [[tB2, { zoom: 1.0, x: 0, y: 40 }], [tGoing, { zoom: 1.12, x: 0, y: 20 }]]);
  const sh = K.shake(t, tPro, 0.5, 18); cam.sx = sh.sx; cam.sy = sh.sy;
  let o = S.rect(-400, -400, 2720, 1880, 0, { fill: 'url(#s6bDrama)' }) + rays(960, 700, 22, 1800, '#FFE7A0', 0.18, t * (pro ? 60 : 20));
  const ripped = t >= tJob;
  const grab = seg(t, tB2 + 0.1, tJob);
  const fling = ease.out(seg(t, tJob, tJob + 0.25));
  const armR = ripped ? lerp(-150, 165, fling) : lerp(20, -150, ease.inOut(grab));
  let props = [];
  if (!ripped && grab > 0.6) props.push({ svg: S.g(tieProp(), 'translate(0 -500) rotate(-4)'), layer: 'front' });
  o += dad(t, 960, 1120, 0.64, { armR, armL: pro ? 30 : 16, lean: pro ? -3 : -6, headRot: pro ? -6 : 0, face: pro ? { name: 'determined', eyes: { look: [0, -0.4] } } : { name: 'determined' }, props }, { arms: false, energy: 1.2 }, { noTie: ripped });
  let out = K.view(cam, o, 1);
  // the tie flies off with the wind
  if (ripped) {
    const u = t - tJob;
    const tx = 1180 + u * 1300, ty = 380 - u * 500 + u * u * 200;
    if (tx < 2200) out += S.g(tieProp(), `translate(${f(tx)} ${f(ty)}) rotate(${f(u * 900)}) scale(0.8)`);
    out += bang('RIIIP!', 1400, 300, seg(t, tJob, tJob + 0.12) * (1 - seg(t, tJob + 0.7, tJob + 0.85)), 90, -8, '#FFFFFF');
  }
  out += wind(t, lerp(0.4, 1, seg(t, tB2, tJob))) + papers(t, seg(t, tB2, tJob + 0.3));
  if (pro) {
    out += S.g(T('PRO', 0, 0, 260, '#FFD21F', { stroke: '#151515', 'stroke-width': 24, 'paint-order': 'stroke' }), `translate(1500 360) rotate(-10) scale(${f(ease.outBack(seg(t, tPro, tPro + 0.25)))})`);
    out += C.whiteFlash(0.8 * bump(t, tPro - 0.05, tPro + 0.12));
  }
  out += flashAt(t, tB2, 0.5);
  return out;
}

// ---------------------------------------------------------------- Dad's gaming corner (lit by RGB)
function gamerRoom(t) {
  let o = S.rect(-600, -400, 3120, 1300, 0, { fill: 'url(#s6bGamer)' });
  // acoustic panels
  for (let i = 0; i < 6; i++) o += S.rect(-200 + i * 380, 120 + (i % 2) * 60, 140, 140, 14, { fill: hue(t * 140 + i * 50, 70, 35), opacity: 0.8, stroke: '#0B0820', 'stroke-width': 6 });
  // LED strip along the ceiling
  for (let i = 0; i < 22; i++) o += S.rect(-500 + i * 130, 20, 110, 18, 9, { fill: rgb(t, i * 25) });
  // posters
  o += S.rect(1500, 260, 220, 300, 10, ol('#2E3350', 7)) + T('GG', 1610, 420, 120, rgb(t, 90)) + TF('NO LAG', 1610, 500, 34, '#FFFFFF');
  o += S.rect(160, 280, 200, 260, 10, ol('#2E3350', 7)) + T('PRO', 260, 430, 80, rgb(t, 200));
  // floor
  o += S.rect(-600, 830, 3120, 600, 0, { fill: '#1E1838' }) + S.rect(-600, 820, 3120, 16, 0, { fill: rgb(t, 180), opacity: 0.8 });
  return o;
}
function obbyGame(t, mode = 'dad') {
  // a lava obby in a -800..800 × -450..450 box. mode 'dad': hops on jump words, falls on the third
  let o = S.rect(-800, -450, 1600, 900, 0, { fill: 'url(#s6bObby)' });
  for (let i = 0; i < 18; i++) o += S.circle(-780 + hash(i * 3) * 1560, -430 + hash(i * 5) * 400, 3 + hash(i) * 4, { fill: '#FFFFFF', opacity: 0.6 });
  const plats = [[-620, 80, 170], [-260, 40, 150], [90, 0, 130], [520, -40, 150]];
  const cols = ['#3BD16F', '#34C3FF', '#FFD21F', '#FF6FB5'];
  plats.forEach(([x, y, w], i) => { o += S.rect(x - w / 2, y, w, 40, 8, ol(cols[i], 6)) + S.rect(x - w / 2 + 6, y + 4, w - 12, 10, 5, { fill: '#FFFFFF', opacity: 0.35 }); });
  o += S.path('M440 -40 L440 -200 L520 -170 L440 -140', ol('#FF5A5A', 5)) + TF('FINISH', 520, -220, 30, '#FFFFFF');
  // lava
  let lt = 'M-820 260';
  for (let x = -820; x <= 820; x += 40) lt += ` L${x} ${f(250 + Math.sin(x * 0.03 + t * 4) * 12)}`;
  o += S.path(lt + ' L820 460 L-820 460 Z', { fill: 'url(#s6bLava)', stroke: '#151515', 'stroke-width': 6 });
  for (let i = 0; i < 6; i++) { const ph = (t * 1.3 + i / 6) % 1; o += S.circle(-700 + i * 260, 280 - ph * 40, 14 * (1 - ph), { fill: '#FFE14D', opacity: 1 - ph }); }
  if (mode !== 'dad') return o;
  // the avatar
  const hop = (t0, x0, y0, x1, y1, h, d = 0.45) => { const u = seg(t, t0, t0 + d); return [lerp(x0, x1, u), lerp(y0, y1, u) - Math.sin(u * Math.PI) * h, u]; };
  let ax = -620, ay = 80, air = 0;
  if (t >= tJ1) { const [x, y, u] = hop(tJ1, -620, 80, -260, 40, 140); ax = x; ay = y; air = u < 1 ? 1 : 0; }
  if (t >= tJ2) { const [x, y, u] = hop(tJ2, -260, 40, 90, 0, 140); ax = x; ay = y; air = u < 1 ? 1 : 0; }
  let dead = 0;
  if (t >= tJ3) {
    // falls short of the last platform
    const u = seg(t, tJ3, tJ3 + 0.75);
    ax = lerp(90, 380, u); ay = lerp(0, 330, u) - Math.sin(Math.min(1, u * 1.6) * Math.PI) * 120; air = 1;
    if (t > tJ3 + 0.62) dead = 1;
  }
  if (!dead || t < tOof) {
    if (t < tOof) o += actor('dad', t, { x: ax, y: ay, s: 0.12, view: 'side', flip: true, ...(air ? { legL: 40, kneeL: 60, legR: -30, kneeR: 50, armL: 150, armR: 120 } : A.walk(t * 6, 0.2)), face: { name: t > tJ3 + 0.3 ? 'scream' : 'determined' }, shadow: false });
  }
  if (t >= tJ3 + 0.62) {
    // SPLOOSH in the lava, then the classic Roblox fall-apart
    const age = t - (tJ3 + 0.62);
    o += C.burst(380, 250, seg(age, 0, 0.5), '#FFE14D');
    if (t >= tOof) {
      const k = t - tOof;
      const parts = [['#E0A985', 40, 50], ['#E6F0FF', 60, 60], ['#E0A985', 22, 60], ['#E0A985', 22, 60], ['#2E3A55', 26, 60], ['#2E3A55', 26, 60]];
      parts.forEach(([c, w, h], i) => {
        const a = -Math.PI / 2 + (i - 2.5) * 0.45, v = 500;
        const px = 380 + Math.cos(a) * v * k, py = 220 + Math.sin(a) * v * k + 0.5 * 1400 * k * k;
        if (py < 450) o += S.rect(px - w / 2, py - h / 2, w, h, 6, { ...ol(c, 5), transform: `rotate(${f(k * 500 * (i % 2 ? 1 : -1))} ${f(px)} ${f(py)})` });
      });
    }
  }
  return o;
}
function monitor(x, y, s, inner, t) {
  const id = S.uid('mon');
  let o = S.rect(-830, -480, 1660, 960, 36, ol('#0E0E14', 14)) + S.clipDef(id, S.rect(-800, -450, 1600, 900, 18));
  o += S.g(inner, null, { 'clip-path': `url(#${id})` });
  o += S.rect(-830, -480, 1660, 960, 36, { fill: 'none', stroke: rgb(t, 30), 'stroke-width': 8, opacity: 0.8 });
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function gamingChair(t, x, y, s = 1, back = false) {
  let o = '';
  o += S.rect(-20, -40, 40, 160, 8, ol('#2A2A36', 6)) + S.path('M-140 130 L140 130 M0 100 L0 140', ln(14, '#2A2A36')) + S.circle(-140, 140, 18, ol('#2A2A36', 5)) + S.circle(140, 140, 18, ol('#2A2A36', 5));
  o += S.rect(-170, -80, 340, 70, 24, ol('#1E1E28', 7)) + S.rect(-160, -60, 320, 12, 6, { fill: rgb(t, 0) });
  o += S.path('M-150 -60 L-170 -560 Q0 -620 170 -560 L150 -60 Z', ol('#1E1E28', 8));
  o += S.path('M-120 -100 L-136 -520', ln(14, rgb(t, 60))) + S.path('M120 -100 L136 -520', ln(14, rgb(t, 240)));
  if (!back) o += S.rect(-70, -500, 140, 70, 20, ol(rgb(t, 150), 5)) + T('PRO', 0, -450, 44, '#151515');
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function shotChair(t) {
  // C1: the RGB gaming chair slams down from the sky; Dad plops into it on "chair"
  const cam = camKeys(t, [[tC1, { zoom: 1.05, x: 0, y: 0 }], [tC2, { zoom: 1.15, x: 0, y: -20 }]]);
  const sh = K.shake(t, tRgb1 + 0.25, 0.3, 14); cam.sx = sh.sx; cam.sy = sh.sy;
  let o = gamerRoom(t);
  const drop = seg(t, tRgb1 - 0.05, tRgb1 + 0.25);
  const sq = bump(t, tRgb1 + 0.25, tRgb1 + 0.45);
  o += S.ellipse(960, 950, 360, 50, { fill: rgb(t, 0), opacity: 0.35 * drop });
  o += S.g(gamingChair(t, 0, 0, 1), `translate(960 ${f(lerp(-500, 820, ease.in(drop)))}) scale(${f(1 + 0.1 * sq)} ${f(1 - 0.12 * sq)})`);
  if (t >= tChair - 0.25) {
    const u = seg(t, tChair - 0.25, tChair + 0.1);
    const y = lerp(300, 905, ease.in(u)) - Math.sin(u * Math.PI) * 160;
    o += dad(t, 1040, y, 0.5, { view: 'side', legL: 90, kneeL: 90, legR: 84, kneeR: 92, armL: 40, armR: 30, face: { name: 'joy' }, shadow: false, rot: lerp(-30, 0, u), rotY: -300 }, { arms: false }, { noTie: true });
  }
  let out = K.view(cam, o, 1);
  out += K.priceTag(1460, 330, '2,499', 1.1, 8);
  out += stamp('RGB!', 450, 300, seg(t, tRgb1 + 0.2, tRgb1 + 0.4), 120, rgb(t, 0, 95, 55), -10);
  out += C.dust(780, 860, tRgb1 + 0.25, t) + C.dust(1100, 860, tRgb1 + 0.25, t);
  out += flashAt(t, tC1, 0.5);
  return out;
}
function shotHeadset(t) {
  // C2: close on Dad — the RGB headset descends and CLAMPS on "headset"
  const cam = camKeys(t, [[tC2, { zoom: 1.0, x: 0, y: 0 }], [tHead, { zoom: 1.0, x: 0, y: 0 }], [tHead + 0.1, { zoom: 1.1, x: 0, y: -20 }], [tC3, { zoom: 1.14, x: 0, y: -20 }]]);
  const sh = K.shake(t, tHead, 0.3, 12); cam.sx = sh.sx; cam.sy = sh.sy;
  let o = gamerRoom(t) + gamingChair(t, 960, 1700, 1.6);
  const d = ease.in(seg(t, tRgb2, tHead));
  const auto = K.V.perform('DAD', t, { seed: 11.1 });
  const p = { ...auto, headRot: 0, headY: 0 };
  const hsSvg = S.g(headset(t), `translate(0 ${f(lerp(-700, 0, d))})`);
  o += dad(t, 960, 1640, 1.25, { armL: 20, armR: 20, face: t >= tHead ? { name: 'excited' } : { name: 'amazed', eyes: { look: [0, -1] } }, props: [S01.headProp(hsSvg, p)], headRot: 0, headY: 0 }, { arms: false }, { noTie: true });
  let out = K.view(cam, o, 1);
  if (t >= tHead) out += bang('CLAMP!', 1500, 260, seg(t, tHead, tHead + 0.12) * (1 - seg(t, tC3 - 0.2, tC3)), 90, 8, rgb(t, 200, 95, 60)) + K.priceTag(420, 330, '899', 1.1, -8);
  out += flashAt(t, tC2, 0.5);
  return out;
}
function sock(t, side) {
  let o = S.path('M-70 -220 L70 -220 L70 -40 Q80 40 0 40 Q-80 40 -70 -40 Z', ol('#FFFFFF', 7));
  const id = S.uid('sk');
  let stripes = '';
  for (let i = 0; i < 8; i++) stripes += S.rect(-90, -230 + i * 36, 180, 36, 0, { fill: rgb(t, i * 45 + side * 90) });
  o += S.clipDef(id, S.path('M-70 -220 L70 -220 L70 -40 Q80 40 0 40 Q-80 40 -70 -40 Z')) + S.g(stripes, null, { 'clip-path': `url(#${id})` });
  o += S.path('M-70 -220 L70 -220 L70 -40 Q80 40 0 40 Q-80 40 -70 -40 Z', ol('none', 7)) + S.rect(-74, -236, 148, 34, 10, ol('#FFFFFF', 6));
  return o;
}
function shotSocks(t) {
  // C3: extreme close on the feet: the shoes fly off — RGB socks wiggle and glow
  const cam = camKeys(t, [[tC3, { zoom: 1.0, x: 0, y: 0 }], [tD1, { zoom: 1.12, x: 0, y: 30 }]]);
  let o = S.rect(-400, -400, 2720, 1880, 0, { fill: '#1E1838' }) + S.rect(-400, 760, 2720, 600, 0, { fill: '#2A2050' });
  for (let i = 0; i < 9; i++) o += S.rect(-200 + i * 280, 760, 6, 600, 0, { fill: '#3A3070' });
  const off = t >= tRgb3;
  const glow = seg(t, tSocks - 0.1, tSocks + 0.2);
  if (off) o += S.ellipse(960, 780, 560, 120, { fill: rgb(t, 0), opacity: 0.25 + 0.2 * glow });
  // trousers
  for (const [x, sd] of [[760, -1], [1160, 1]]) {
    const wig = off ? Math.sin(t * 18 + sd) * 8 : 0;
    o += S.rect(x - 110, -300, 220, 760, 20, ol('#2E3A55', 8)) + S.path(`M${x - 110} 420 L${x + 110} 420`, ln(6, '#232C42'));
    if (off) o += S.g(sock(t, sd), `translate(${x} ${720}) rotate(${f(wig)} 0 -220) scale(1.5)`);
    else o += S.g(S.rect(-74, -236, 148, 60, 10, ol('#2E3A55', 6)) + S.path('M-90 -200 L90 -200 L90 -30 Q200 -20 200 30 L-90 40 Z', ol('#5A3B26', 8)) + S.path('M-60 -150 L60 -150', ln(5, '#3E2A1A')), `translate(${x} 720) scale(1.4)`);
  }
  // the shoes flying away
  if (off) {
    const u = t - tRgb3;
    for (const [sd, x0] of [[-1, 760], [1, 1160]]) {
      const px = x0 + sd * u * 1400, py = 700 - u * 1200 + 0.5 * 2600 * u * u;
      if (py < 1300) o += S.g(S.path('M-90 -40 L90 -40 Q200 -30 200 20 L-90 30 Z', ol('#5A3B26', 8)), `translate(${f(px)} ${f(py)}) rotate(${f(u * 700 * sd)})`);
    }
  }
  let out = K.view(cam, o, 1);
  if (glow > 0) out += K.sparkles([[600, 400, 40], [1320, 420, 46], [960, 300, 30], [1500, 650, 26], [420, 640, 24]], t) + rays(960, 600, 18, 1500, '#FFFFFF', 0.12 * glow, t * 50);
  out += bang('POP! POP!', 960, 220, seg(t, tRgb3, tRgb3 + 0.12) * (1 - seg(t, tSocks - 0.1, tSocks)), 90, -6, '#FFFFFF');
  out += stamp('RGB SOCKS', 960, 240, seg(t, tSocks, tSocks + 0.2), 110, rgb(t, 300, 95, 60), -8);
  out += flashAt(t, tC3, 0.5);
  return out;
}

// ---------------------------------------------------------------- "Okay. Jump... jump... JUMP!" → OOF
function shotOTS(t) {
  // D1: over the shoulder — Dad (back view) in the RGB chair, the lava obby on the big monitor
  const cam = camKeys(t, [[tD1, { zoom: 1.0, x: 0, y: 0 }], [tD2, { zoom: 1.12, x: 0, y: -40 }]]);
  let o = gamerRoom(t);
  o += monitor(960, 430, 0.62, obbyGame(t), t) + S.rect(920, 710, 80, 80, 6, ol('#2A2A36', 6)) + S.rect(-400, 780, 2720, 60, 10, ol('#2A2A36', 7)) + S.rect(-400, 780, 2720, 12, 0, { fill: rgb(t, 120) });
  o += monitor(260, 470, 0.32, S.rect(-800, -450, 1600, 900, 0, { fill: '#1A2A4A' }) + TF('CHAT', 0, -300, 120, '#FFFFFF') + TF('0 viewers', 0, 0, 110, '#9AA0AE'), t);
  o += monitor(1660, 470, 0.32, S.rect(-800, -450, 1600, 900, 0, { fill: '#2A1A3A' }) + T('ATTEMPT', 0, -100, 180, '#FFFFFF') + T('309', 0, 160, 260, '#FF5A5A'), t);
  // Dad from behind, sitting low in the chair
  const lean = t > tJ1 - 0.2 ? 4 * Math.sin(t * 20) : 0;
  o += dad(t, 960, 1300, 0.72, { view: 'back', armL: 40, armR: 40, lean, shadow: false }, { arms: false }, { noTie: true, headset: true, mic: false });
  o += S.g(gamingChair(t, 0, 0, 1, true), 'translate(960 1420) scale(0.9)');
  let out = K.view(cam, o, 1);
  out += flashAt(t, tD1, 0.5);
  return out;
}
function shotSweat(t) {
  // D2: extreme close-up — sweating, RGB light rolling across his face
  const cam = camKeys(t, [[tD2, { zoom: 1.0, x: 0, y: 0 }], [tD3, { zoom: 1.1, x: 0, y: 0 }]]);
  let o = gamerRoom(t);
  o += dad(t, 960, 2240, 2.0, { armL: 10, armR: 10, face: { name: 'determined', eyes: { upper: 0.32, look: [0, -0.2] }, fx: ['sweat2'] }, headRot: Math.sin(t * 30) * 1.5 }, { arms: false, energy: 0.2 }, { noTie: true, headset: true });
  o += S.rect(-400, -400, 2720, 1880, 0, { fill: rgb(t, 0), opacity: 0.12 });
  let out = K.view(cam, o, 1);
  out += flashAt(t, tD2, 0.4);
  return out;
}
function shotGame(t) {
  // D3/E1: the monitor fills the frame: the third JUMP falls short → lava → OOF! → YOU DIED
  const cam = camKeys(t, [[tD3, { zoom: 1.0, x: 0, y: 0 }], [tJ3 + 0.6, { zoom: 1.1, x: 120, y: 60 }], [tOof, { zoom: 1.25, x: 200, y: 100 }], [tE2, { zoom: 1.3, x: 200, y: 100 }]]);
  const sh = K.shake(t, tOof, 0.4, 16); cam.sx = sh.sx; cam.sy = sh.sy;
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#2B1B6B' }) + K.view(cam, S.g(obbyGame(t), 'translate(960 540) scale(1.3)'), 1);
  // game HUD
  o += S.rect(40, 30, 380, 80, 20, { fill: '#000', opacity: 0.5 }) + TF('Lava Obby', 230, 85, 46, '#FFFFFF');
  o += S.rect(1520, 30, 360, 80, 20, { fill: '#000', opacity: 0.5 }) + TF('Stage 1 / 50', 1700, 85, 42, '#FFE14D');
  o += bang('OOF!', 960, 380, seg(t, tOof, tOof + 0.15) * (1 - seg(t, tE2 - 0.25, tE2)), 220, -8, '#FFFFFF');
  const kd = seg(t, tDied, tDied + 0.2);
  if (kd > 0) o += S.g(S.rect(-420, -80, 840, 150, 26, { fill: '#000', opacity: 0.65 }) + T('YOU DIED', 0, 40, 110, '#FF4D4D'), `translate(960 640) scale(${f(ease.outBack(kd))})`);
  o += flashAt(t, tD3, 0.4);
  return o;
}
function tally(x, y, n) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const g = Math.floor(i / 5), j = i % 5;
    const gx = x + (g % 8) * 70, gy = y + Math.floor(g / 8) * 70;
    o += j < 4 ? S.path(`M${gx + j * 12} ${gy} L${gx + j * 12} ${gy + 50}`, ln(5, '#FFFFFF', 0.6)) : S.path(`M${gx - 6} ${gy + 40} L${gx + 46} ${gy + 10}`, ln(5, '#FFFFFF', 0.6));
  }
  return o;
}
function deskFront(t) {
  return S.rect(-400, 830, 2720, 400, 10, ol('#22222E', 8)) + S.rect(-400, 830, 2720, 14, 0, { fill: rgb(t, 60) }) + S.rect(620, 800, 680, 50, 10, ol('#2A2A36', 6)) +
    Array.from({ length: 12 }, (_, i) => S.rect(640 + i * 54, 808, 44, 30, 5, { fill: rgb(t, i * 30, 90, 55) })).join('');
}
function shotAttempt(t) {
  // E2: reverse angle from the monitor: dead-eyed Dad, tally marks all over the wall, ATTEMPT 311 → 312 on "twelve"
  const cam = camKeys(t, [[tE2, { zoom: 1.0, x: 0, y: 0 }], [tF, { zoom: 1.15, x: 0, y: -40 }]]);
  let o = gamerRoom(t);
  o += tally(140, 160, 120) + tally(1240, 200, 95);
  for (let i = 0; i < 7; i++) o += S.rect(1500 + (i % 4) * 60, 760 - Math.floor(i / 4) * 90, 50, 86, 10, ol(['#3BD16F', '#FF5A5A', '#34C3FF'][i % 3], 5));
  o += gamingChair(t, 960, 1060, 1.1);
  o += dad(t, 960, 1120, 0.64, { armL: 50, armR: 50, face: { name: 'deadpan', eyes: { upper: 0.62 }, fx: ['eyebags'] }, headRot: -4 + (t > tTwelve ? Math.sin(t * 50) * 2 : 0) }, { arms: false, energy: 0.2 }, { noTie: true, headset: true });
  o += S.rect(-400, -400, 2720, 1880, 0, { fill: '#7A3AB8', opacity: 0.08 });
  o += deskFront(t);
  let out = K.view(cam, o, 1);
  // ATTEMPT counter (HUD reflected from the screen)
  const n = t < tTwelve ? 311 : 312;
  const k = bump(t, tTwelve - 0.02, tTwelve + 0.25);
  out += S.g(S.rect(-250, -70, 500, 140, 30, { fill: '#000', opacity: 0.6, stroke: '#FF5A5A', 'stroke-width': 6 }) + TF('ATTEMPT', -90, 22, 50, '#FFFFFF') + T(String(n), 130, 30, 90, '#FF5A5A'), `translate(960 130) scale(${f(1 + 0.25 * k)})`);
  out += flashAt(t, tE2, 0.4);
  return out;
}
function shotRigged(t) {
  // F: Dad erupts out of the chair — "The lava is RIGGED!" — red alert, smash-zoom, steam
  const smash = t >= tRig;
  const cam = smash ? camKeys(t, [[tRig, { zoom: 1.6, x: 0, y: -20 }], [tG, { zoom: 1.7, x: 0, y: -20 }]]) : camKeys(t, [[tF, { zoom: 1.0, x: 0, y: 0 }], [tRig, { zoom: 1.08, x: 0, y: -20 }]]);
  const sh = K.shake(t, tRig, 0.6, 20); cam.sx = sh.sx; cam.sy = sh.sy;
  let o = gamerRoom(t);
  if (smash) o += S.rect(-400, -400, 2720, 1880, 0, { fill: '#FF0022', opacity: f(0.25 + 0.15 * Math.sin(t * 30)) });
  o += tally(140, 160, 120) + tally(1240, 200, 95);
  const up = ease.outBack(seg(t, tF, tF + 0.3));
  const shake = Math.sin(t * 40);
  o += S.g(gamingChair(t, 0, 0, 1.1), `translate(${f(960 + 600 * seg(t, tF, tF + 0.6))} 1060) rotate(${f(40 * seg(t, tF, tF + 0.6))})`);
  o += dad(t, 960, lerp(1220, 1060, up), 0.64, { armL: 120 + 20 * shake, armR: 120 - 20 * shake, lift: 30 * bump(t, tF, tF + 0.4), face: { name: 'angry', mouth: smash ? 'scream' : undefined, fx: smash ? ['anger', 'steam', { type: 'redface', k: 0.4 }] : ['anger'] } }, { arms: false, energy: 1.6 }, { noTie: true, headset: true });
  o += deskFront(t);
  let out = K.view(cam, o, 1);
  if (smash) out += C.speedLines(0, 1920, 540, 22, 4, '#FFFFFF', 1000) + bang('RIGGED!', 1450, 300, seg(t, tRig, tRig + 0.15), 130, 8, '#FF4D4D');
  out += flashAt(t, tF, 0.4);
  return out;
}
function shotTerrible(t) {
  // G: "Dad was terrible." — slumped over the desk, a tiny storm cloud raining on him
  const cam = camKeys(t, [[tG, { zoom: 1.0, x: 0, y: 0 }], [tBut, { zoom: 1.1, x: 0, y: -30 }]]);
  let o = gamerRoom(t) + S.rect(-400, -400, 2720, 1880, 0, { fill: '#0A0A20', opacity: 0.35 });
  o += gamingChair(t, 960, 1060, 1.1);
  o += dad(t, 960, 1070, 0.64, { armL: 60, armR: 60, headY: 70, headRot: 12, bodyY: 30, face: { name: 'crying' } }, { arms: false, energy: 0.2 }, { noTie: true, headset: true });
  o += deskFront(t);
  // storm cloud
  const cx = 1000, cy = 140;
  o += S.g(S.circle(-70, 0, 60, ol('#6A6E80', 6)) + S.circle(10, -30, 76, ol('#6A6E80', 6)) + S.circle(90, 6, 54, ol('#6A6E80', 6)) + S.rect(-110, 0, 240, 56, 26, { fill: '#6A6E80' }), `translate(${cx} ${f(cy + Math.sin(t * 3) * 6)})`);
  for (let i = 0; i < 10; i++) { const ph = (t * 2.4 + hash(i)) % 1; o += S.path(`M${f(cx - 90 + hash(i * 3) * 200)} ${f(cy + 60 + ph * 300)} l-6 30`, ln(5, '#9FD8FF', 1 - ph)); }
  let out = K.view(cam, o, 1);
  out += S.g(S.rect(-260, -60, 520, 120, 24, { fill: '#000', opacity: 0.6 }) + T('GAME OVER', 0, 26, 76, '#FF5A5A'), 'translate(1500 120) rotate(6)');
  out += flashAt(t, tG, 0.4);
  return out;
}
function shotHall(t) {
  // H: whip to the hallway: Grandma's door glows pink, an ON AIR sign, hearts drift out from under the door
  const cam = camKeys(t, [[tBut, { zoom: 1.0, x: 0, y: 0 }], [tI1, { zoom: 1.35, x: 0, y: -40 }]]);
  let o = S.rect(-400, -400, 2720, 1880, 0, { fill: '#5A4A7A' });
  for (let x = -400; x < 2400; x += 120) o += S.rect(x, -400, 50, 1300, 0, { fill: '#6A5A8A' });
  o += S.rect(-400, 860, 2720, 600, 0, { fill: '#3A2A50' });
  o += S.rect(720, 220, 480, 660, 16, ol('#C98A5A', 9)) + S.rect(760, 260, 400, 260, 10, ol('#B07A48', 6)) + S.rect(760, 560, 400, 280, 10, ol('#B07A48', 6)) + S.circle(1130, 560, 16, ol('#FFD34D', 4));
  o += S.path('M720 880 L1200 880 L1340 1100 L580 1100 Z', { fill: 'url(#s6bHall)' }) + S.rect(720, 866, 480, 14, 4, { fill: '#FF9CCB' });
  const on = Math.floor(t * 3) % 2 ? 1 : 0.6;
  o += S.rect(800, 110, 320, 90, 20, ol('#3A0A14', 7)) + T('ON AIR', 960, 180, 66, on > 0.8 ? '#FF4D4D' : '#B03030');
  o += S.path(K.F.heartPath(820, 380, 26), ol('#FF6FB5', 4)) + S.path(K.F.heartPath(1100, 420, 20), ol('#FF6FB5', 4)) + TF('NANA', 960, 410, 48, '#FFF0F6');
  for (let i = 0; i < 6; i++) { const ph = (t * 0.9 + i / 6) % 1; o += S.path(K.F.heartPath(820 + hash(i) * 280 + Math.sin(t * 3 + i) * 30, 870 - ph * 500, 14 + 8 * hash(i * 3)), { fill: '#FF6FB5', stroke: '#151515', 'stroke-width': 3, opacity: f(1 - ph) }); }
  let out = K.view(cam, o, 1);
  out += whip(bump(t, tBut - 0.1, tBut + 0.15), 1);
  return out;
}

// ---------------------------------------------------------------- NanaBea_Pro · LIVE · 2.1M
function nanaGame(t) {
  // neon obby: Grandma's avatar runs in a straight line while the platforms slide in under her feet
  let o = S.rect(-800, -450, 1600, 900, 0, { fill: 'url(#s6bNana)' });
  for (let i = 0; i < 20; i++) o += S.circle(-780 + hash(i * 3) * 1560, -430 + hash(i * 5) * 500, 3 + hash(i) * 4, { fill: '#FFFFFF', opacity: 0.6 });
  let lt = 'M-820 280';
  for (let x = -820; x <= 820; x += 40) lt += ` L${x} ${f(270 + Math.sin(x * 0.03 + t * 4) * 12)}`;
  o += S.path(lt + ' L820 460 L-820 460 Z', { fill: 'url(#s6bLava)', stroke: '#151515', 'stroke-width': 6 });
  const run = (t - tI1) * 520;
  for (let i = 0; i < 9; i++) {
    const px = ((i * 260 - run) % 2340 + 2340) % 2340 - 1000;
    const near = Math.abs(px - -120) < 200;
    const py = near ? 100 : 100 + 120 * Math.sin(t * 3 + i * 2);
    o += S.rect(px - 90, py, 180, 38, 10, ol(hue(i * 50 + t * 60, 90, 60), 6)) + S.rect(px - 80, py + 4, 160, 8, 4, { fill: '#FFFFFF', opacity: 0.4 });
  }
  o += C.speedLines(-700, -300, 20, 8, 5, '#FFFFFF', 160);
  o += actor('grandma', t, { x: -120, y: 100, s: 0.15, view: 'side', flip: true, ...A.run(t * 16, 0.9), face: { name: 'happy', eyes: { type: 'closed' } }, shadow: false });
  return o;
}
function chatPanel(t, burst = 0) {
  const msgs = [['xX_Bloxer', 'NANA!!!', '#FF6FB5'], ['kidd0', 'GOAT', '#34C3FF'], ['obbyfan22', '<3 <3 <3', '#FF5A5A'], ['P1ckle', 'how is she so good', '#7EE05A'], ['zoom_zoom', 'EYES CLOSED?!', '#FFD21F'], ['luna', 'W NANA', '#B06BFF'], ['bigtoe', 'NO JUMPS???', '#FF9F1C'], ['xX_Bloxer', 'legend', '#FF6FB5'], ['mom_of_3', 'teach me!!', '#5CF2C0'], ['kidd0', 'WORLD RECORD', '#34C3FF']];
  let o = S.rect(0, 0, 560, 400, 24, { fill: '#0E0A20', opacity: 0.82, stroke: '#FF6FB5', 'stroke-width': 5 }) + S.rect(0, 0, 560, 60, 24, { fill: '#FF6FB5' }) + TF('LIVE CHAT', 280, 44, 34, '#FFFFFF');
  const id = S.uid('chat');
  let lines = '';
  const scroll = (t * 2.6) % msgs.length;
  for (let i = 0; i < 9; i++) {
    const m = msgs[(i + Math.floor(t * 2.6)) % msgs.length];
    const y = 384 - (i - (scroll % 1)) * 44;
    lines += TF(m[0] + ':', 24, y, 28, m[2], { 'text-anchor': 'start' }) + TF(m[1], 24 + m[0].length * 16 + 26, y, 28, '#FFFFFF', { 'text-anchor': 'start' });
  }
  o += S.clipDef(id, S.rect(0, 64, 560, 336)) + S.g(lines, null, { 'clip-path': `url(#${id})` });
  // hearts flying up the chat
  for (let i = 0; i < 10 + 10 * burst; i++) {
    const ph = (t * (0.7 + hash(i) * 0.5) + hash(i * 3)) % 1;
    o += S.path(K.F.heartPath(420 + hash(i * 7) * 120 + Math.sin(t * 4 + i) * 20, 400 - ph * 380, 14 + 10 * hash(i * 5)), { fill: ['#FF4D6D', '#FF6FB5', '#FFD21F'][i % 3], stroke: '#151515', 'stroke-width': 3, opacity: f(1 - ph * ph) });
  }
  return o;
}
function webcam(t, pose = {}, face = null) {
  // Grandma's webcam: pink gaming chair, ring light, fairy lights — box 0..600 × 0..400
  const id = S.uid('cam');
  let inner = S.rect(0, 0, 600, 400, 0, { fill: '#3A1E5A' }) + S.circle(300, 200, 190, { fill: 'none', stroke: '#FFF0F6', 'stroke-width': 16, opacity: 0.5 });
  for (let i = 0; i < 9; i++) inner += S.circle(30 + i * 68, 30 + Math.sin(i) * 10, 8, { fill: hue(i * 40 + t * 80, 90, 70) });
  inner += S.rect(170, 120, 260, 360, 60, ol('#FF6FB5', 6));
  inner += grandma(t, 300, 640, 0.52, { shadow: false, ...pose, ...(face ? { face } : {}) }, { energy: 1.2 });
  let o = S.clipDef(id, S.rect(0, 0, 600, 400, 20)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
  o += S.rect(0, 0, 600, 400, 20, { fill: 'none', stroke: '#FF6FB5', 'stroke-width': 10 });
  return o;
}
function overlayBar(t) {
  let o = S.rect(0, 0, 900, 90, 30, { fill: '#0E0A20', opacity: 0.85, stroke: '#FF6FB5', 'stroke-width': 5 });
  o += S.circle(54, 45, 30, ol('#FF6FB5', 4)) + TF('N', 54, 58, 38, '#FFFFFF');
  o += TF('NanaBea_Pro', 100, 60, 46, '#FFFFFF', { 'text-anchor': 'start' });
  o += S.rect(420, 18, 150, 54, 16, { fill: '#FF2D4D' }) + S.circle(450, 45, 10, { fill: '#FFFFFF', opacity: 0.6 + 0.4 * Math.sin(t * 8) }) + TF('LIVE', 515, 60, 38, '#FFFFFF');
  o += S.path('M610 45 Q650 15 690 45 Q650 75 610 45 Z', ol('#FFFFFF', 4)) + S.circle(650, 45, 11, { fill: '#151515' }) + TF('2.1M', 790, 60, 44, '#FFFFFF');
  return o;
}
function streamLayout(t, camK, opts = {}) {
  // full stream page: gameplay, overlay bar, webcam, chat
  let o = S.rect(-1500, -1500, 4920, 4080, 0, { fill: '#2A1640' }) + S.g(nanaGame(t), 'translate(960 540) scale(1.2)');
  if (opts.wr) {
    const k = ease.outBack(seg(t, opts.wr, opts.wr + 0.3));
    o += S.g(S.rect(-470, -90, 940, 180, 40, ol('#FFD21F', 10)) + T('WORLD RECORD!', 0, 36, 110, '#FFFFFF', { stroke: '#151515', 'stroke-width': 12, 'paint-order': 'stroke' }), `translate(700 420) rotate(-5) scale(${f(k)})`);
    o += K.confetti(t, opts.wr, 60, 4);
  }
  o += S.g(overlayBar(t), 'translate(40 30)');
  o += S.g(webcam(t, opts.pose, opts.face), 'translate(1290 140)');
  o += S.g(chatPanel(t, opts.burst || 0), 'translate(1300 560)');
  return K.view(camK, o, 1);
}
function shotStream(t) {
  // I: "What's up, chat!" — zoomed into the webcam; out to the full stream for the speedrun; eyes closed; LET'S GO → WORLD RECORD
  let cam;
  const camOnCam = { zoom: 2.6, x: 630, y: -200 };
  const full = { zoom: 1.0, x: 0, y: 0 };
  if (t < tSpeed - 0.1) cam = camKeys(t, [[tI1, { zoom: 2.9, x: 630, y: -200 }], [tNana, camOnCam], [tNana + 0.25, { zoom: 2.4, x: 630, y: -200 }], [tSpeed, { zoom: 2.5, x: 630, y: -200 }]]);
  else if (t < tEyes - 0.05) cam = camKeys(t, [[tSpeed - 0.1, { zoom: 1.0, x: 0, y: 0 }], [tEyes, { zoom: 1.12, x: -80, y: 0 }]]);
  else if (t < tGo0) cam = camKeys(t, [[tEyes - 0.05, { zoom: 3.0, x: 630, y: -210 }], [tGo0, { zoom: 3.2, x: 630, y: -210 }]]);
  else cam = camKeys(t, [[tGo0, full], [tGo, { zoom: 1.05, x: 0, y: 0 }], [tJ1s, { zoom: 1.0, x: 0, y: 0 }]]);
  const wave = Math.sin(t * 10);
  let pose = { armR: 140 + 25 * wave, armL: 20, face: { name: 'excited' } };
  if (t >= tSpeed - 0.1) pose = { armL: 60 + 20 * Math.sin(t * 40), armR: 60 + 20 * Math.sin(t * 43), face: { name: 'happy', eyes: t >= tEyes - 0.05 ? { type: 'closed' } : {} } };
  if (t >= tGo0) pose = { armL: 165, armR: 165, face: { name: 'joy', eyes: { type: 'closed' } }, lift: 0 };
  let o = streamLayout(t, cam, { pose: { ...pose, face: undefined }, face: pose.face, wr: t >= tGo ? tGo : 0, burst: t >= tGo ? 1 : 0 });
  if (t >= tNana && t < tSpeed - 0.1) {
    const k = ease.outBack(seg(t, tNana, tNana + 0.3));
    o += S.g(S.rect(-330, -70, 660, 140, 40, ol('#FF6FB5', 9)) + T('NanaBea', 0, 34, 100, '#FFFFFF', { stroke: '#151515', 'stroke-width': 10, 'paint-order': 'stroke' }) + K.F.sparkle(-300, -70, 34) + K.F.sparkle(310, 60, 26), `translate(960 170) rotate(-4) scale(${f(k)})`);
  }
  if (t >= tNoJ && t < tEyes - 0.05) o += stamp('NO JUMPS', 600, 820, seg(t, tNoJ, tNoJ + 0.2), 100, '#FFD21F', -8);
  if (t >= tEyes - 0.05 && t < tGo0) o += stamp('EYES CLOSED', 960, 160, seg(t, tEyes + 0.3, tEyes + 0.5), 100, '#FF6FB5', 6) + S.rect(0, 0, 1920, 1080, 0, { fill: '#FF6FB5', opacity: 0.06 });
  o += flashAt(t, tI1, 0.6) + flashAt(t, tSpeed - 0.1, 0.4) + flashAt(t, tEyes - 0.05, 0.4) + flashAt(t, tGo0, 0.4);
  return o;
}
function cityBillboard(t) {
  // J1: dusk city plaza — a giant billboard with NanaBea; kids filming it on their phones
  const cam = camKeys(t, [[tJ1s, { zoom: 1.0, x: -80, y: 40 }], [tWorld, { zoom: 1.12, x: 60, y: -20 }]]);
  let o = S.rect(-400, -400, 2720, 1880, 0, { fill: 'url(#s6bDusk)' });
  let b = '';
  [[-300, 300, 380], [140, 200, 340], [1500, 260, 360], [1900, 160, 300]].forEach(([x, y, w], i) => {
    b += S.rect(x, y, w, 900, 8, ol(['#3A2A6A', '#4A3A7A', '#3A2A6A', '#2A1E5A'][i], 6));
    for (let r = 0; r < 7; r++) for (let c = 0; c < 3; c++) if (hash(i * 31 + r * 7 + c) > 0.4) b += S.rect(x + 40 + c * (w - 80) / 3, y + 40 + r * 100, 50, 60, 6, { fill: '#FFE9A8', opacity: 0.85 });
  });
  o += K.view(cam, b, 0.6);
  // billboard
  let bb = S.rect(520, 120, 880, 560, 20, ol('#1A1A22', 12)) + S.rect(540, 140, 840, 520, 10, { fill: '#3A1E5A' });
  bb += S.g(webcam(t, { armR: 150 + 20 * Math.sin(t * 8), armL: 20 }, { name: 'joy' }), 'translate(580 160) scale(1.0 1.0)');
  bb += S.rect(1200, 170, 160, 60, 16, { fill: '#FF2D4D' }) + TF('LIVE', 1280, 214, 40, '#FFFFFF');
  bb += S.rect(560, 580, 800, 70, 14, { fill: '#FF6FB5' }) + T('NanaBea_Pro', 960, 634, 60, '#FFFFFF');
  bb += S.rect(940, 680, 40, 200, 6, ol('#2A2A36', 6));
  o += K.view(cam, bb, 0.85);
  // plaza + kids watching on phones
  let m = S.rect(-400, 860, 2720, 600, 0, { fill: '#4A3A6A' }) + S.rect(-400, 850, 2720, 16, 0, { fill: '#6A5A8A' });
  [[300, 2, 0.4], [620, 5, 0.36], [1300, 8, 0.4], [1620, 11, 0.37]].forEach(([x, i, s]) => {
    const [hx, hy] = A.hand(150, 1);
    m += K.draw.kid(i, { x, y: 1000, s, view: 'back', armR: 150, armL: 10, props: [{ svg: K.phone(hx, hy - 60, 0.4, 0, S.rect(-150, -280, 300, 560, 0, { fill: '#FF6FB5' }) + S.path(K.F.heartPath(0, 0, 60), ol('#FFFFFF', 6))), layer: 'front' }] });
  });
  o += K.view(cam, m, 1);
  return o;
}
function earthHeadset(t) {
  // J1b: "…in the world." — the whole Earth wears a pink gamer headset
  const cam = camKeys(t, [[tWorld, { zoom: 1.25, x: 0, y: 0 }], [tTwoM, { zoom: 1.0, x: 0, y: 0 }]]);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#120C30' });
  for (let i = 0; i < 40; i++) o += S.circle(hash(i * 3) * 1920, hash(i * 7) * 1080, 2 + hash(i) * 4, { fill: '#FFFFFF', opacity: 0.7 });
  let e = S.circle(0, 0, 300, ol('#3B8BFF', 9));
  e += S.path('M-220 -120 Q-120 -200 -40 -140 Q20 -60 -60 0 Q-160 40 -220 -40 Z', { fill: '#3BD16F', stroke: '#151515', 'stroke-width': 5 }) + S.path('M60 60 Q160 20 220 100 Q180 200 80 180 Q20 120 60 60 Z', { fill: '#3BD16F', stroke: '#151515', 'stroke-width': 5 });
  e += S.path('M-330 -40 Q-330 -400 0 -400 Q330 -400 330 -40', ln(46, '#FF4D8D')) + S.path('M-330 -40 Q-330 -400 0 -400 Q330 -400 330 -40', ln(14, '#FFB0CF'));
  for (const sx of [-1, 1]) e += S.rect(sx * 330 - 60, -120, 120, 200, 40, ol('#FF4D8D', 8));
  e += S.path(K.F.heartPath(0, -470, 40), ol('#FF6FB5', 5));
  o += K.view(cam, S.g(e, `translate(960 560) rotate(${f(Math.sin(t * 2) * 4)})`), 1);
  o += S.g(S.circle(0, 0, 90, ol('#FFD21F', 8)) + T('#1', 0, 30, 90, '#151515'), `translate(1540 300) rotate(12) scale(${f(ease.outBack(seg(t, tWorld + 0.2, tWorld + 0.5)))})`);
  o += flashAt(t, tWorld, 0.5);
  return o;
}
function viewers(t) {
  // J2: "Two million viewers." — the viewer counter rockets; a sea of avatar heads
  const cam = camKeys(t, [[tTwoM, { zoom: 1.0, x: 0, y: 0 }], [tMore0, { zoom: 1.1, x: 0, y: 0 }]]);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#2A1640' });
  let g = '';
  for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) {
    const x = 120 + c * 210 + (r % 2) * 100, y = 300 + r * 170;
    const pop = seg(t, tTwoM + (r * 9 + c) * 0.025, tTwoM + (r * 9 + c) * 0.025 + 0.2);
    if (pop > 0) g += S.g(S.rect(-60, -60, 120, 120, 26, ol(['#F8D9C0', '#E9B38B', '#C98D6A', '#8D5A3B'][(r + c) % 4], 6)) + S.circle(-24, -6, 10, { fill: '#151515' }) + S.circle(24, -6, 10, { fill: '#151515' }) + S.path('M-22 24 Q0 40 22 24', ln(5)) + S.rect(-64, -72, 128, 36, 14, ol(['#FF5A5A', '#34C3FF', '#FFD21F', '#3BD16F', '#B06BFF'][(r * 3 + c) % 5], 5)), `translate(${x} ${f(y + Math.sin(t * 6 + c + r) * 6)}) scale(${f(ease.outBack(pop))})`);
  }
  o += K.view(cam, g, 1);
  const v = Math.round(lerp(0, 2000000, ease.out(seg(t, tTwoM, tTwoM + 1.0))));
  let ctr = S.rect(-520, -100, 1040, 200, 50, ol('#0E0A20', 10)) + S.path('M-440 0 Q-380 -60 -320 0 Q-380 60 -440 0 Z', ol('#FFFFFF', 6)) + S.circle(-380, 0, 20, { fill: '#151515' });
  ctr += T(v.toLocaleString('en-US'), 60, 40, 120, '#FFFFFF') + S.rect(330, -70, 160, 56, 16, { fill: '#FF2D4D' }) + TF('LIVE', 410, -28, 40, '#FFFFFF');
  o += S.g(ctr, `translate(960 170) scale(${f(1 + 0.06 * bump(t, tTwoM + 0.9, tTwoM + 1.2))})`);
  o += flashAt(t, tTwoM, 0.5);
  return o;
}
function coinMound(x0, x1, base, h) {
  let d = `M${x0} ${base}`;
  for (let i = 0; i <= 16; i++) { const u = i / 16; d += ` L${f(lerp(x0, x1, u))} ${f(base - h * Math.pow(Math.sin(Math.PI * u), 0.7) - (hash(i) - 0.5) * 16)}`; }
  return S.path(d + ` L${x1} ${base + 300} L${x0} ${base + 300} Z`, { fill: 'url(#coinPile)', stroke: '#7A4A08', 'stroke-width': 7 });
}
function compare(t) {
  // J3: split — NANABEA · 1 STREAM (a coin mountain) vs DAD · 1 YEAR (three sad coins)
  let o = S.rect(0, 0, 960, 1080, 0, { fill: '#FF9CCB' }) + rays(480, 600, 16, 1300, '#FFFFFF', 0.25, t * 20);
  const grow = ease.out(seg(t, tMore - 0.1, tMore + 0.8));
  o += coinMound(60, 900, 900, lerp(120, 560, grow));
  o += K.coinRain(t, 18, { x0: 80, x1: 880, y1: 900, r: 26, seed: 4 });
  o += grandma(t, 480, 900 - lerp(120, 560, grow) + 40, 0.36, { armR: 150 + 20 * Math.sin(t * 9), armL: 30, face: { name: 'joy' }, shadow: false });
  o += S.g(S.rect(-300, -50, 600, 100, 30, ol('#FF6FB5', 7)) + T('NANA · 1 STREAM', 0, 24, 56, '#FFFFFF', { stroke: '#151515', 'stroke-width': 8, 'paint-order': 'stroke' }), 'translate(480 80)');
  let r = S.rect(960, 0, 960, 1080, 0, { fill: '#8A93A3' });
  r += S.rect(960, 860, 960, 220, 0, { fill: '#6A7080' });
  for (let i = 0; i < 3; i++) r += K.coin(1380, 850 - i * 16, 34, 0, 0.2);
  const plink = t >= tYear;
  if (plink) { const u = seg(t, tYear, tYear + 0.3); r += K.coin(1380, lerp(200, 802, ease.in(u)), 34, 0, u * 6); }
  r += dad(t, 1620, 900, 0.42, { turn: -0.4, armL: 10, armR: 10, face: t > tDadW ? { name: 'sad', eyes: { look: [-0.8, 0.6] } } : { name: 'nervous' } }, { arms: false }, { headset: true, mic: false });
  r += S.g(S.rect(-260, -50, 520, 100, 30, ol('#4A4F66', 7)) + T('DAD · 1 YEAR', 0, 24, 56, '#FFFFFF', { stroke: '#151515', 'stroke-width': 8, 'paint-order': 'stroke' }), 'translate(1440 80)');
  if (plink) r += bang('plink.', 1500, 700, seg(t, tYear + 0.3, tYear + 0.4), 60, 6, '#FFFFFF');
  const open = ease.out(seg(t, tMore0, tMore0 + 0.3));
  o = S.rect(0, 0, 1920, 1080, 0, { fill: '#1A1030' }) + T('VS', 1440, 580, 200, '#2E2450') + S.g(o, `translate(${f(-960 * (1 - open))} 0)`) + S.g(r, `translate(${f(960 * (1 - seg(t, tDadW - 0.3, tDadW)))} 0)`);
  o += S.path('M960 -20 L960 1100', ln(24, '#151515'));
  return o;
}
function shotBackToWork(t) {
  // K: "…I'm going back to my job." — tie back on (crooked), headset still on, RGB socks glowing, sulking out the door
  const cam = camKeys(t, [[tK, { zoom: 1.0, x: 0, y: 0 }], [tL, { zoom: 1.08, x: -40, y: 0 }]]);
  let o = livingRoom(t);
  o += S.rect(80, 260, 300, 520, 12, ol('#C98A5A', 8)) + S.circle(340, 540, 12, ol('#FFD34D', 4)) + S.rect(80, 230, 300, 30, 6, ol('#FFFFFF', 5));
  const u = seg(t, tK, tL + 0.2);
  const x = lerp(1300, 520, u);
  const ph = t * 7;
  o += dad(t, x, 960, 0.55, { view: 'side', ...A.walk(ph, 0.6), armR: 20, armL: -10, lean: 8, headRot: 10, face: { name: 'sad' }, props: [{ svg: S.rect(-80, -330, 160, 120, 12, ol('#6A4A2A', 6)) + S.rect(-30, -350, 60, 24, 8, ol('#4A3018', 5)), layer: 'front' }] }, { arms: false, energy: 0.3 }, { headset: true, mic: false });
  // glowing socks peeking out
  o += S.ellipse(x, 955, 120, 18, { fill: rgb(t, 0), opacity: 0.35 });
  let out = K.view(cam, o, 1);
  out += whip(1 - seg(t, tK, tK + 0.18), 1);
  return out;
}
function shotBye(t) {
  // L: Grandma waves bye on her webcam; LIKE & SUBSCRIBE buttons pop on the words; stream ends
  const c2 = camKeys(t, [[tL, { zoom: 2.6, x: 630, y: -200 }], [tLike - 0.1, { zoom: 2.3, x: 630, y: -150 }], [END, { zoom: 2.2, x: 600, y: -130 }]]);
  const wave = Math.sin(t * 11);
  let o = streamLayout(t, c2, { pose: { armR: 140 + 30 * wave, armL: t > tLike ? 120 : 20 }, face: { name: 'happy' } });
  const kL = ease.outBack(seg(t, tLike, tLike + 0.25)), kS = ease.outBack(seg(t, tSub, tSub + 0.25));
  if (kL > 0) o += S.g(S.rect(-170, -70, 340, 140, 40, ol('#FFFFFF', 8)) + S.path('M-110 30 L-110 -10 L-80 -10 L-50 -60 Q-30 -62 -36 -30 L-36 -10 L0 -10 Q12 0 0 30 Z', ol('#34C3FF', 5)) + T('LIKE', 60, 22, 60, '#151515'), `translate(560 760) rotate(-6) scale(${f(kL)})`);
  if (kS > 0) {
    o += S.g(S.rect(-280, -70, 560, 140, 40, ol('#FF2D4D', 8)) + T('SUBSCRIBE', -10, 22, 70, '#FFFFFF'), `translate(1280 760) rotate(4) scale(${f(kS)})`);
    const ring = Math.sin((t - tSub) * 30) * 20 * Math.exp(-(t - tSub) * 3);
    o += S.g(S.path('M-40 30 Q-40 -50 0 -50 Q40 -50 40 30 L50 40 L-50 40 Z', ol('#FFD21F', 6)) + S.circle(0, 52, 12, ol('#FFD21F', 5)), `translate(1610 700) rotate(${f(ring)} 0 -50) scale(${f(kS)})`);
  }
  // stream ends: the picture pinches to a line and blinks out
  const off = seg(t, END - 0.35, END - 0.08);
  if (off > 0) {
    o += S.rect(0, 0, 1920, 540 * off, 0, { fill: '#05030C' }) + S.rect(0, 1080 - 540 * off, 1920, 540 * off, 0, { fill: '#05030C' });
    if (off > 0.7) o += S.rect(lerp(0, 900, seg(t, END - 0.15, END - 0.03)), 534, lerp(1920, 120, seg(t, END - 0.15, END - 0.03)), 12, 6, { fill: '#FFFFFF' });
    if (t > END - 0.03) o += S.rect(0, 0, 1920, 1080, 0, { fill: '#05030C' });
  }
  o += flashAt(t, tL, 0.5);
  return o;
}

// ---------------------------------------------------------------- router
function scene(t) {
  if (t < tB1) return shotIdea(t);
  if (t < tB2) return shotStand(t);
  if (t < tC1) return shotPro(t);
  if (t < tC2) return shotChair(t);
  if (t < tC3) return shotHeadset(t);
  if (t < tD1) return shotSocks(t);
  if (t < tD2) return shotOTS(t);
  if (t < tD3) return shotSweat(t);
  if (t < tE2) return shotGame(t);
  if (t < tF) return shotAttempt(t);
  if (t < tG) return shotRigged(t);
  if (t < tBut) return shotTerrible(t);
  if (t < tI1) return shotHall(t);
  if (t < tJ1s) return shotStream(t);
  if (t < tWorld) return cityBillboard(t);
  if (t < tTwoM) return earthHeadset(t);
  if (t < tMore0) return viewers(t);
  if (t < tK) return compare(t);
  if (t < tL) return shotBackToWork(t);
  return shotBye(t);
}
const look = (t) => (t >= tC1 && t < tBut ? { grade: 'cool', vignette: 1 } : t >= tB2 && t < tC1 ? { grade: 'warm', vignette: 1 } : { grade: 'warm' });

module.exports = { scene, look, DEFS, START, END };
