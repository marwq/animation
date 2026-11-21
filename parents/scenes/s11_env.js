// SC 11 helpers: the cut list + beats from the voice (shared with audio/cues/gen_sc11.js), the hot dog's whole climb as one
// route (any shot can ask where Dad is at time t), camera helpers, letterbox, HUD, Dad's real hand over the space bar,
// the VS card and the replay card.
'use strict';

const K = require('./kit');
const GS = require('./sets_game');
const G = require('./gameui');
const R = require('./respawn');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;

const SP = GS.SPOTS.tower;
const FL = (i) => SP.floors[clamp(Math.round(i), 1, 99) - 1];

// ================================================================ times (from the voice only)
function times(V) {
  const { L } = V;
  const l = (i) => L('11.' + i);
  const START = V.scene('SC 11').start, END = V.scene('SC 12').start;
  const C = {}, B = {};
  // -- intro: "Dad. The man who couldn't jump. Versus one hundred floors of obby."
  C.dad = START;
  C.replay = l(0).word('The').t0 - 0.08;
  B.bonk = l(0).word("couldn't").t0 + 0.05;
  C.splash = l(0).word('jump').t0 - 0.12;
  B.splash = l(0).word('jump').t0 + 0.22;
  C.look = l(0).word('jump').t1 + 0.12;
  C.vs = l(0).word('Versus').t0 - 0.14;
  B.vs = l(0).word('Versus').t0 + 0.05;
  C.tilt = l(0).word('one').t0 - 0.12;
  B.top = l(0).word('obby').t0 + 0.05;
  // -- the real Dad + "Space... bar."
  C.real = l(0).b + 0.32;
  C.keys = l(1).a - 0.3;
  B.press = l(1).word('bar').t0 + 0.12;
  // -- "He jumped. He jumped again. He slipped... and didn't fall."
  C.jump1 = B.press + 0.3;
  B.go1 = C.jump1 + 0.12;
  B.land1 = l(2).word('jumped').t0 + 0.22;
  C.gasp = l(2).word('jumped').t1 + 0.02;
  C.again = l(2).word('He', 1).t0 - 0.12;
  B.go2 = l(2).word('He', 1).t0 - 0.02;
  B.land2 = l(2).word('again').t0 + 0.08;
  B.go3 = B.land2 + 0.28;
  B.land3 = B.go3 + 0.38;
  C.slip = l(2).word('He', 2).t0 - 0.28;
  B.slip = l(2).word('slipped').t0;
  B.go7 = B.slip - 0.4;
  B.catch = l(2).word('fall').t0;
  // -- checkpoint 10, the whole server stops and watches; Noodle starts the chant
  C.cp10 = l(2).b + 0.22;
  B.go10 = C.cp10 - 0.05;
  B.land10 = C.cp10 + 0.3;
  C.watch = C.cp10 + 0.68;
  C.noodle = l(3).word('Jump', 1).t0 - 0.3;
  B.chant = [l(3).word('Jump').t0, l(3).word('Dad').t0, l(3).word('Jump', 1).t0, l(3).word('Dad', 1).t0];
  // -- "And then the whole server started chanting." -> montage + the chanting wide
  C.climb2 = l(4).a - 0.1;
  C.climb2b = l(4).word('whole').t0 - 0.05;
  C.chant = l(4).word('started').t0 - 0.12;
  C.climb3 = l(4).b + 0.12;
  // -- DarkBlade
  C.dark = l(5).a - 0.22;
  C.dark2 = l(5).word('JUMP', 1).t0 - 0.12;
  B.darkJump = l(5).word('JUMP', 1).t0;
  // -- "No no no no no... Okay. Okay! I'm okay!" (icy floor 88)
  C.wobble = l(6).a - 0.18;
  B.go88 = C.wobble - 0.02;
  B.land88 = l(6).a + 0.1;
  C.realWob = l(6).word('no', 4).t0 - 0.06;
  C.okay = l(6).word('Okay').t0 - 0.12;
  B.okay1 = l(6).word('Okay').t0;
  B.okay2 = l(6).word('Okay', 1).t0;
  B.okay3 = l(6).word('okay', 2).t0;
  // -- floor 99, the final gap; "JUMP, DAD, JUMP!"
  C.gap = l(6).b + 0.08;
  B.go99 = C.gap + 0.02;
  B.land99 = C.gap + 0.4;
  C.you = l(7).a - 0.14;
  B.youW = [l(7).word('JUMP').t0, l(7).word('DAD').t0, l(7).word('JUMP', 1).t0];
  // -- "For my son." -> the press -> the slow-motion leap, the grab, the climb, the hot dog hits the crystal
  C.son1 = l(7).b + 0.08;
  C.son2 = l(8).word('son').t0 - 0.1;
  C.press2 = l(8).b - 0.04;
  B.press2 = l(8).b + 0.1;
  B.hit = l(9).a - 0.44;                        // the crystal shatters (the light is still on screen for "NO!")
  C.leap = B.press2 + 0.16;
  B.launch = C.leap + 0.06;
  B.grab = B.launch + 1.12;
  C.grab = B.grab - 0.06;
  C.pull = B.grab + 0.38;
  B.up = C.pull + 0.42;                          // standing on the top
  C.dive = B.up - 0.02;
  B.dive = lerp(B.up, B.hit, 0.45);
  // -- the Block King
  C.no = l(9).a - 0.1;
  C.attack = l(9).word('NO').t1 + 0.12;
  C.defeat = l(9).word('by').t0 - 0.12;
  B.hotdog = l(9).word('HOT').t0;
  B.crumble = l(9).b + 0.12;
  C.crumble = l(9).b + 0.02;
  // -- VICTORY, dawn, the summit
  C.victory = l(10).a - 0.16;
  B.victory = l(10).a;
  B.saved = l(10).word('Server').t0;
  C.summit = l(10).b + 0.08;
  B.pops = C.summit + 0.06;
  C.mom = l(11).a - 0.14;
  B.momJump = l(11).a - 0.02;
  C.toss = l(11).word("THAT'S", 1).t0 - 0.14;
  B.toss = [C.toss + 0.08, C.toss + 1.25];
  // -- "I did a jump! Son, I did a JUMP!" / "You did a HUNDRED jumps, Dad!" / MVP
  C.did = l(12).a - 0.16;
  C.sonReal = l(12).word('Son').t0 - 0.14;
  C.bigJump = l(12).word('JUMP', 1).t0 - 0.32;
  B.bigJump = l(12).word('JUMP', 1).t0 - 0.12;
  C.hug = l(13).a - 0.3;
  B.hug = l(13).a + 0.1;
  B.hundred = l(13).word('HUNDRED').t0;
  C.mvp = l(14).a - 0.32;
  B.mvpA = l(14).a - 0.15;
  B.mvpName = l(14).word('DadBod1978').t0;
  B.out = l(14).b + 0.3;
  return { START, END, C, B };
}

// ================================================================ the route: every jump of the climb, absolute times
// points: 'base' = the foot of the tower; a number = floor i (feet on the platform)
function pt(p) {
  if (p === 'base') return { x: SP.base.x, y: SP.base.y, s: 0.36 };
  if (p >= 100) return { x: SP.top.x0 + 130, y: SP.top.y, s: 0.3 };
  const q = FL(p);
  return { x: q.x, y: q.y, s: 0.3 };
}
function route(TM) {
  const { C, B } = TM;
  const hops = [];
  const add = (a, b, t0, t1, h) => hops.push({ a, b, t0, t1, h });
  add('base', 1, B.go1, B.land1, 190);
  add(1, 2, B.go2, B.land2);
  add(2, 3, B.go3, B.land3);
  add(6, 7, B.go7, B.slip);
  add(9, 10, B.go10, B.land10);
  // auto climbs (even hops) — the montage cuts look at them
  const auto = (i0, i1, ta, tb) => { const p = (tb - ta) / (i1 - i0); for (let i = i0; i < i1; i++) add(i, i + 1, ta + (i - i0) * p + p * 0.18, ta + (i - i0 + 1) * p - p * 0.04); };
  auto(10, 16, B.land10 + 0.25, C.noodle + 0.6);
  auto(21, 25, C.climb2, C.climb2b + 0.02);
  auto(37, 41, C.climb2b + 0.02, C.chant + 0.05);
  auto(41, 52, C.chant + 0.05, C.climb3);
  auto(57, 60, C.climb3, C.dark - 0.12);
  auto(60, 87, C.dark - 0.12, B.go88 - 0.05);
  add(87, 88, B.go88, B.land88);
  auto(88, 98, B.okay3 + 0.75, B.go99 - 0.02);
  add(98, 99, B.go99, B.land99);
  hops.sort((a, b) => a.t0 - b.t0);
  return hops;
}
// where the hot dog is (before the final leap): { x, y, s, air, u, dir, hop, floor, landAge }
function dadAt(t, hops) {
  let prev = null;
  for (const h of hops) {
    if (t < h.t0) break;
    if (t <= h.t1) {
      const a = pt(h.a), b = pt(h.b), u = (t - h.t0) / (h.t1 - h.t0);
      const top = Math.min(a.y, b.y) - (h.h || 120);
      const cy = 2 * top - (a.y + b.y) / 2;
      const y = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * cy + u * u * b.y;
      return { x: lerp(a.x, b.x, u), y, s: lerp(a.s, b.s, u), air: true, u, dir: Math.sign(b.x - a.x) || 1, hop: h, floor: h.a, landAge: -1 };
    }
    prev = h;
  }
  if (!prev) return { ...pt('base'), air: false, u: 0, dir: 1, floor: 'base', landAge: 9 };
  const b = pt(prev.b);
  return { ...b, air: false, u: 1, dir: Math.sign(pt(prev.b).x - pt(prev.a).x) || 1, hop: prev, floor: prev.b, landAge: t - prev.t1 };
}
// hot dog pose for a route state (side view in the air, squash on the landing, front-ish idle)
function dadPose(t, st, o = {}) {
  const p = { x: st.x, y: st.y, s: st.s, t };
  if (st.air) {
    const u = st.u;
    Object.assign(p, { view: 'side', flip: st.dir > 0, armL: lerp(60, 170, seg(u, 0, 0.3)), armR: lerp(40, 160, seg(u, 0, 0.3)), legL: -26, kneeL: 46, legR: 30, kneeR: 24,
      sy: 1 + 0.12 * bump(u, 0, 0.35), sx: 1 - 0.08 * bump(u, 0, 0.35), rot: st.dir * lerp(-6, 8, u), shadow: false, nametag: false,
      face: { name: 'determined', mouth: 'O' } });
  } else {
    const la = st.landAge;
    const sq = la >= 0 && la < 0.25 ? bump(la, 0, 0.25) : 0;
    const crouch = st.next ? bump(t, st.next.t0 - 0.16, st.next.t0) : 0;
    Object.assign(p, { turn: 0.35 * st.dir, sy: 1 - 0.14 * Math.max(sq, crouch), sx: 1 + 0.1 * Math.max(sq, crouch), armL: 20 + 30 * sq, armR: 20 + 30 * sq, nametag: false, face: 'determined' });
  }
  return { ...p, ...o };
}

// ================================================================ camera helpers
const camLerp = (a, b, u, e = ease.inOut) => { const k = e(clamp(u, 0, 1)); return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), zoom: lerp(a.zoom, b.zoom, k), rot: lerp(a.rot || 0, b.rot || 0, k) }; };
function shook(cam, t, hits) {
  let sx = 0, sy = 0;
  for (const [t0, dur, amp] of hits) { const s = K.shake(t, t0, dur, amp); sx += s.sx; sy += s.sy; }
  return { ...cam, sx: (cam.sx || 0) + sx, sy: (cam.sy || 0) + sy };
}
const camAt = (x, y, z, sx = 960, sy = 540, rot = 0) => ({ ...GS.camAt(x, y, z, sx, sy), rot });
const toScr = (cam, x, y, k = 1) => { const p = GS.toScreen(cam, { x, y, k }); return [p.x, p.y]; };
// view() with camera roll (rot around the screen centre)
const view = (cam, svg, k = 1) => (cam.rot ? S.g(K.view(cam, svg, k), `rotate(${f(cam.rot)} 960 540)`) : K.view(cam, svg, k));
const roll = (cam, svg) => (cam.rot ? S.g(svg, `rotate(${f(cam.rot)} 960 540) scale(${f(1 + Math.abs(cam.rot) * 0.012)})`) : svg);
// white flash + streaks at a cut (whip-pan feel); dir ±1 = horizontal, 'up' / 'down' = vertical streaks
function whip(t, t0, dir = 1, dur = 0.12) {
  const u = (t - t0) / dur;
  if (u < 0 || u > 1) return '';
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: f(0.75 * (1 - u)) });
  let d = '';
  for (let i = 0; i < 18; i++) {
    const a = hash(i * 3.3 + t0), b = hash(i * 7.7 + t0);
    if (typeof dir === 'string') { const x = a * 1920, y = (b * 1400 - 200) + (dir === 'up' ? 1 : -1) * u * 500; d += `M${f(x)} ${f(y)} v${f(160 + 260 * b)}`; }
    else { const y = a * 1080, x = b * 2200 - 200 - dir * u * 600; d += `M${f(x)} ${f(y)} h${f(200 + 340 * b)}`; }
  }
  o += S.path(d, ln(10, '#FFFFFF', 0.8 * (1 - u)));
  return o;
}
const flashAt = (t, t0, dur = 0.15, amp = 0.8, col = '#FFFFFF') => { const u = (t - t0) / dur; return u < 0 || u > 1 ? '' : S.rect(0, 0, 1920, 1080, 0, { fill: col, opacity: f(amp * (1 - u) * (1 - u)) }); };
// vertical speed streaks for fast tilts (k 0..1)
function vStreaks(t, k, seed = 1, col = '#FFFFFF') {
  if (k <= 0.02) return '';
  let d = '';
  for (let i = 0; i < 26; i++) { const x = hash(i * 5.1 + seed) * 1920, y = ((t * 3000 * (0.6 + hash(i)) + hash(i * 2.3) * 1400) % 1400) - 200; d += `M${f(x)} ${f(y)} v${f(140 + 260 * hash(i * 9.7) * k)}`; }
  return S.path(d, ln(6 + 4 * k, col, 0.55 * k));
}
// cinema bars (k 0..1)
const letterbox = (k) => (k <= 0 ? '' : S.rect(0, -1, 1920, 118 * ease.out(k) + 1, 0, { fill: '#05040A' }) + S.rect(0, 1080 - 118 * ease.out(k), 1920, 119, 0, { fill: '#05040A' }));
// zoom-burst lines from a point (focus lines) for smash zooms
function focusLines(x, y, k, seed = 2, col = '#FFFFFF') {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2 + hash(i + seed) * 0.15, r0 = 360 + 260 * hash(i * 3 + seed), r1 = 1500;
    const w = 0.012 + 0.012 * hash(i * 7 + seed);
    d += `M${f(x + Math.cos(a) * r0)} ${f(y + Math.sin(a) * r0)} L${f(x + Math.cos(a - w) * r1)} ${f(y + Math.sin(a - w) * r1)} L${f(x + Math.cos(a + w) * r1)} ${f(y + Math.sin(a + w) * r1)} Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.55 * k) });
}

// ================================================================ HUD: the floor counter (top-left)
function floorHUD(t, n, o = {}) {
  const icon = S.g(S.rect(-14, -26, 28, 52, 4, ol('#B98CFF', 4)) + S.rect(-22, -34, 44, 12, 3, ol('#FF6FD0', 4)) + S.rect(-6, 4, 12, 16, 2, { fill: '#151515' }), 'scale(0.95)');
  return G.statPill({ x: o.x ?? 44, y: o.y ?? 82, s: o.s ?? 0.9, t, label: 'FLOOR', value: `${n}/100`, icon, rim: o.rim || '#B98CFF', k: o.k ?? 1, bump: o.bump || 0, col: n >= 100 ? '#FFD21F' : '#FFFFFF' });
}

// ================================================================ Dad's real hand over the keyboard (keyboardClose space)
// (tx, ty) = fingertip; s scale; press 0..1 pushes it in; from = where the arm leaves the frame
function dadHand(tx, ty, o = {}) {
  const { s = 1, press = 0, from = [1760, 1400], t = 0, shake = 0 } = o;
  const jx = shake ? Math.sin(t * 61) * 5 * shake : 0, jy = shake ? Math.cos(t * 47) * 4 * shake : 0;
  const x = tx + jx, y = ty + jy + 14 * press;
  const dx = from[0] - x, dy = from[1] - y, L_ = Math.hypot(dx, dy) || 1;
  const rot = Math.atan2(-dx / L_, dy / L_) * 180 / Math.PI;
  const skin = '#F4CDAE', shade = '#E3B48F', sleeve = '#BFD9F2', cuff = '#A8C8E8';
  const fl = 112 * (1 - 0.18 * press);
  let h = S.rect(-92, 236, 184, 1400, 60, ol(sleeve, 9)) + S.path('M-60 300 V1500 M50 330 V1500', ln(6, '#9FC0E0', 0.7));
  h += S.rect(-84, 196, 168, 58, 22, ol(cuff, 8));
  h += S.g(S.rect(-26, -6, 52, 96, 24, ol(skin, 8)), 'translate(-80 130) rotate(-34)');                 // thumb
  h += S.rect(-72, 82, 140, 132, 42, ol(skin, 8));                                                         // palm
  h += S.path('M-6 96 h66 M-2 124 h62 M2 152 h56', ln(6, shade));                                          // curled fingers
  h += S.rect(-22, 100 - fl, 44, fl + 20, 22, ol(skin, 8));                                                // the index finger
  h += S.rect(-13, 104 - fl, 26, 18, 9, { fill: '#FFF2E6', stroke: shade, 'stroke-width': 3 });           // the nail
  return S.g(h, `translate(${f(x)} ${f(y + fl - 100)}) rotate(${f(rot)}) scale(${f(s)})`);
}
// sweat drops falling from above the frame onto the keys
function sweatDrops(t, t0, pts) {
  let o = '';
  pts.forEach(([x, y, d], i) => {
    const age = t - t0 - d;
    if (age < 0 || age > 0.9) return;
    const yy = lerp(-60, y, Math.min(1, (age / 0.45) ** 2));
    if (age < 0.45) o += S.path(`M${f(x)} ${f(yy - 34)} Q${f(x + 18)} ${f(yy)} ${f(x)} ${f(yy + 10)} Q${f(x - 18)} ${f(yy)} ${f(x)} ${f(yy - 34)} Z`, ol('#8FD8FF', 4));
    else { const u = (age - 0.45) / 0.45; o += S.ellipse(x, y + 6, 26 + 30 * u, 8 + 6 * u, { fill: '#8FD8FF', opacity: f(0.8 * (1 - u)), stroke: '#151515', 'stroke-width': 3 }); }
  });
  return o;
}

// ================================================================ VS card ("Versus")
function vsCard(t, k, o = {}) {
  const { hotdog = '', tower = '', out = 0 } = o;
  const kl = ease.out(seg(k, 0, 0.35)), kr = ease.out(seg(k, 0.08, 0.43)), kv = seg(k, 0.3, 0.55);
  let c = S.rect(0, 0, 1920, 1080, 0, { fill: '#170C2E' });
  // speed stripes
  let d = '';
  for (let i = 0; i < 16; i++) { const y = i * 72 + ((t * 900 * (i % 2 ? 1 : -1)) % 72); d += `M-100 ${f(y)} h2200`; }
  c += S.path(d, ln(18, '#2A1A4E', 0.6));
  // left panel (hot dog), slides from the left; diagonal edge
  const lx = -1100 * (1 - kl);
  c += S.g(S.path('M0 0 H1060 L860 1080 H0 Z', { fill: '#FF8A2B' }) + S.path('M0 0 H1060 L860 1080 H0 Z', { fill: 'url(#s11Dots)', opacity: 0.35 }) + hotdog +
    T('DadBod1978', 440, 150, 96, '#FFFFFF', { stroke: '#151515', 'stroke-width': 14, 'paint-order': 'stroke' }) +
    S.g(S.rect(-200, -34, 400, 68, 34, ol('#151515', 0)) + TF('LVL 1  ·  JUMPS: 0', 0, 13, 36, '#FFD21F'), 'translate(440 236)'), `translate(${f(lx)} 0)`);
  // right panel (the tower)
  const rx = 1100 * (1 - kr);
  c += S.g(S.path('M1060 0 H1920 V1080 H860 Z', { fill: '#5B26C2' }) + S.path('M1060 0 H1920 V1080 H860 Z', { fill: 'url(#s11Dots)', opacity: 0.3 }) + tower +
    T('OBBY TOWER', 1490, 150, 96, '#FFFFFF', { stroke: '#151515', 'stroke-width': 14, 'paint-order': 'stroke' }) +
    S.g(S.rect(-210, -34, 420, 68, 34, { fill: '#151515' }) + TF('100 FLOORS  ·  LAVA', 0, 13, 36, '#7FF6FF'), 'translate(1490 236)'), `translate(${f(rx)} 0)`);
  // the split line glow
  if (kr > 0.95) c += S.path('M1060 0 L860 1080', ln(18, '#FFFFFF', 0.9)) + S.path('M1060 0 L860 1080', ln(6, '#FFD21F'));
  // VS slams in
  if (kv > 0) {
    const sc = lerp(3.2, 1, ease.out(kv)) * (1 + 0.06 * Math.sin(t * 9) * seg(kv, 0.9, 1));
    let v = K.rays(0, 0, 14, 420, '#FFE14D', 0.35 * kv, t * 40);
    v += T('VS', 0, 70, 260, '#FFD21F', { stroke: '#151515', 'stroke-width': 26, 'paint-order': 'stroke', 'font-style': 'italic' }) + T('VS', -6, 64, 260, '#FFF4B8', { opacity: 0.0 });
    c += S.g(v, `translate(960 560) rotate(-8) scale(${f(sc)})`, kv < 1 ? { opacity: f(seg(kv, 0, 0.3)) } : {});
  }
  return out > 0 ? S.g(c, `translate(${f(-1920 * ease.in(out))} 0)`) : c;
}
// the stylised tower for the VS card (100 numbered blocks shrinking to a point + the crystal)
function vsTower(t) {
  let o = '';
  const cols = ['#FF5A5A', '#FF9A3C', '#FFD21F', '#3BD16F', '#34C3FF', '#B06BFF', '#FF6FB5'];
  o += S.rect(1440, 330, 100, 760, 0, ol('#3A2A70', 8));
  for (let i = 0; i < 12; i++) {
    const y = 1040 - i * 62, w = 170 - i * 6, x = 1490 + (i % 2 ? 1 : -1) * (70 - i * 3);
    o += S.rect(x - w / 2, y, w, 34, 8, ol(cols[i % cols.length], 6)) + TF(String(i === 11 ? 100 : i + 1 + (i > 8 ? (i - 8) * 30 : 0)), x, y + 27, 24, '#FFFFFF', { stroke: '#151515', 'stroke-width': 5, 'paint-order': 'stroke' });
  }
  o += G.crystal({ x: 1490, y: 320, s: 0.5, t, beam: true, pedestal: false });
  return o;
}

module.exports = {
  SP, FL, times, route, pt, dadAt, dadPose, camLerp, shook, camAt, toScr, view, roll, whip, flashAt, vStreaks, letterbox, focusLines,
  floorHUD, dadHand, sweatDrops, vsCard, vsTower,
  DEFS: '<defs><pattern id="s11Dots" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="6" fill="#FFFFFF"/><circle cx="30" cy="30" r="6" fill="#FFFFFF"/></pattern></defs>',
};
