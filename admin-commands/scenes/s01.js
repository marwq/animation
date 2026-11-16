// SC 01 · COLD OPEN — a flash-forward to the end of SC 06: the city in chaos at night. Pop-ups fill the sky, the admin
// command chips burst out ("admin commands?"), Brick sulks in a cage on the crane ("In real life?"), a command typed on
// the narrator's words launches a bus ("...and it just... happens."), the fast list: Dad tumbling past a giant moon, Granny
// breaking the sound barrier, and a cat licking his paw → the pull-back reveals he is sitting ON a skyscraper. YOU float
// above the city with the laptop: ";unfly everyone" → PERMISSION DENIED → "But I'm the admin!" → the sky cracks like
// glass, the Admin's giant sky chat "No. I am." (a glimpse of his silhouette in the light) → freeze frame with call-outs
// ("Things got a little... out of hand") → VHS rewind, the day counter rolls back to MONDAY.
// The floating / denied / crack shots are built with the same helpers as the end of SC 06 (s06_env.js) so they match.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, actor } = K;
const { L } = K.V;
const C = K.C;
const CS = require('./city');
const SETS = require('./sets');
const CAST = require('../rig/cast');
const E = require('./s06_env');
const { CITY, KF } = CS;
const { pop, camOn, scr, withShake, whip, flash, punch, zoomAt, outT, outTF } = E;

const END = K.V.scene('SC 02').start;
const l0 = L('01.0'), l1 = L('01.1'), l2 = L('01.2'), l3 = L('01.3'), l4 = L('01.4'), l5 = L('01.5'), l6 = L('01.6');

// ---------------------------------------------------------------- beats (all from the voice)
const tAdmin = l0.word('admin').t0, tCmds = l0.word('commands').t0;
const tB = tAdmin - 0.12;                          // B: the command chips burst over the city
const tC = l0.word('In').t0 - 0.08;               // C: Brick in the cage ("In real life?")
const tD = l1.a - 0.1;                            // D: street, a command is typed → the bus launches
const tType0 = l1.word('type').t0, tType1 = l1.word('chat').t1, tEnterD = l1.word('and').t0 + 0.05;
const tJust = l1.word('just').t0, tHappens = l1.word('happens').t0;
const tE = l2.a - 0.1;                            // E: Dad in orbit
const tF = l2.word('Your', 1).t0 - 0.08;          // F: Granny faster than sound
const tSound = l2.word('sound').t0;
const tG = l2.word('And').t0 - 0.08;              // G: the cat licking his paw…
const tReveal = l2.word('is', 2).t0;               // …pull back: the size of a building
const tBuilding = l2.word('building').t0;
const tH = l3.a - 0.1;                            // H: YOU floating with the laptop
const tI = l3.word('Un').t0 - 0.14;               // I: close-up, typing ";unfly everyone"
const tEnter = l3.b + 0.04;
const tDenied = l4.a;                             // the PERMISSION DENIED stamp
const tDeniedW = l4.word('DENIED').t0;
const tK = l4.word('But').t0 - 0.1;               // K: "But I'm the admin!" — shaking the laptop at the sky
const tL = l5.a - 0.08;                           // L: the sky cracks, the Admin's chat
const tNo = l5.a, tIam = l5.word('I').t0;
const tM = l6.a - 0.06;                           // M: freeze frame + call-outs
const tN = l6.word("Let's").t0 - 0.12;            // N: VHS rewind to Monday
const tMonday = l6.word('Monday').t0;

// ---------------------------------------------------------------- A + B: the wide chaos city, command chips
const camWide = (t) => K.camKeys(t, [[0, { zoom: 1.14, x: 40, y: -330 }], [tB, { zoom: 1.07, x: 10, y: -280 }], [tC, { zoom: 1.02, x: -10, y: -250 }]], ease.inOut);
function chips(t) {
  let o = '';
  const cmds = SETS.ADMIN_CMDS;
  const a0 = tAdmin - 0.05, a1 = l0.word('commands').t1;
  cmds.forEach((c, i) => {
    const k = seg(t, a0 + (i / cmds.length) * (a1 - a0) * 0.9, a0 + (i / cmds.length) * (a1 - a0) * 0.9 + 0.18);
    if (k <= 0) return;
    const ang = (-160 + (i / (cmds.length - 1)) * 140) * Math.PI / 180;
    const drift = seg(t, a1, tC) * 40;
    const x = 960 + Math.cos(ang) * (560 + drift), y = 520 + Math.sin(ang) * (330 + drift) + Math.sin(t * 3 + i) * 8;
    const w = 60 + c.length * 26;
    let g = S.rect(-w / 2 + 6, -34 + 8, w, 68, 20, { fill: '#000', opacity: 0.3 }) + S.rect(-w / 2, -34, w, 68, 20, { fill: '#0F2A1E', stroke: '#3DFF9A', 'stroke-width': 6 }) + TF(c, 0, 14, 42, '#EAFFF3');
    o += S.g(g, `translate(${f(x)} ${f(y)}) rotate(${f((hash(i * 3.3) - 0.5) * 16)}) scale(${f(pop(k))})`);
  });
  // the golden crown in the middle, on "commands"
  const ck = seg(t, tCmds - 0.05, tCmds + 0.2);
  if (ck > 0) {
    let cr = K.rays(0, 0, 14, 300, '#FFF1B8', 0.25, t * 30) + CATS_CROWN();
    o += S.g(cr, `translate(960 300) scale(${f(1.6 * pop(ck))})`);
  }
  return o;
}
const CATS_CROWN = () => require('../rig/cats').tinyCrown(0, 10, 7);
function shotAB(t) {
  const cam = camWide(t);
  const popK = clamp(seg(t, 0.1, tAdmin) * 1.15, 0, 1);
  let o = E.chaosWide(t, cam, { popups: popK, waterFall: 1, flying: lerp(0.75, 1, seg(t, 0, tC)) });
  if (t >= tB) o += chips(t) + flash(t, tB, 0.12, 0.5);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#000', opacity: f(1 - ease.out(seg(t, 0, 0.55))) });
  return o;
}

// ---------------------------------------------------------------- C: Brick in the cage, high above the city
function shotC(t) {
  const u = seg(t, tC, tD);
  const cam = { zoom: 1.08, x: lerp(-60, 40, u), y: -40 };
  const Lr = CS.rooftop(t, cam, { time: 1, popups: 0.7, flying: 1 });
  const hx = lerp(1000, 970, u), sw = 4 * Math.sin(t * 1.1) - 3 * bump(t, tC, tC + 0.6);
  let o = Lr.bg + Lr.fg;
  // the crane jib + trolley at the top of the frame
  o += S.path('M-40 40 L1960 70', ln(70, '#151515')) + S.path('M-40 40 L1960 70', { stroke: 'url(#cityLatN)', 'stroke-width': 56, fill: 'none' }) + S.rect(hx - 50, 40, 100, 50, 10, ol('#4A4E60', 6));
  o += E.hangingCage(t, hx, 60, 1.0, { swing: sw, volume: false, face: { name: 'angry', fx: ['anger'], mouth: 'frown', eyes: { look: [0, 0.2] } } });
  // "Real life?" — Brick scowls at the camera, a tiny ";jail Brick" log tag on the plate
  o += Lr.light;
  o += whip(t, tC, 1);
  return o;
}

// ---------------------------------------------------------------- D: the street — "You type it in the chat… and it just… happens."
const BUS = { x: 1040, y: CITY.street.laneR };
function busLift(t) {
  const shud = t >= tJust && t < tHappens ? Math.sin(t * 70) * 5 * seg(t, tJust, tHappens) : 0;
  const up = t >= tHappens ? (t - tHappens) : 0;
  return { x: BUS.x + shud, y: BUS.y - 900 * up * up - 300 * up, rot: up > 0 ? -6 * Math.min(1, up * 3) : 0, sq: t >= tHappens ? 1 + 0.25 * bump(t, tHappens, tHappens + 0.18) : 1 - 0.08 * seg(t, tJust, tHappens) };
}
function shotD(t) {
  const camY = t < tHappens ? 0 : -ease.inOut(seg(t, tHappens + 0.05, tHappens + 0.55)) * 520;
  const cam0 = camOn(1000, 820, 1, 1.35);
  const cam = withShake({ ...cam0, y: cam0.y + camY, zoom: cam0.zoom * (1 + 0.03 * seg(t, tD, tHappens)) }, t, [[tHappens, 0.4, 16]]);
  const fly = lerp(0.12, 0.85, seg(t, tHappens + 0.1, tE));
  const L0 = CS.city(t, cam, { time: 1, flying: fly, popups: 0.5, blimp: true, waterFall: 1, flyNear: t > tHappens + 0.6 });
  const b = busLift(t);
  let bus = CS.bus(b.x, b.y, 0.5, b.rot, { t, lights: 1, wave: t > tHappens ? 1 : 0 });
  if (b.sq !== 1) bus = S.g(bus, `translate(${f(b.x)} ${f(b.y)}) scale(${f(2 - b.sq)} ${f(b.sq)}) translate(${f(-b.x)} ${f(-b.y)})`);
  let w = bus + K.commandBurst(BUS.x, BUS.y - 70, t - tHappens, '#3DFF9A', 260);
  if (t > tHappens) w += C.dust(BUS.x - 160, BUS.y, tHappens, t) + C.dust(BUS.x + 60, BUS.y, tHappens + 0.03, t);
  let o = L0.bg + L0.mid + L0.fg + K.view(cam, w, 1) + L0.light;
  // the chat bar types on the narrator's words, ENTER on "and"
  const prog = K.typeProgress(t, l1, 'type', 'chat');
  const ent = seg(t, tEnterD, tEnterD + 0.3);
  o += K.chatCommand(960, 150, ';fly bus', prog, { t, enter: ent, s: 1.5 });
  if (t > tHappens) o += K.bang('WHOOSH!', 1420, 330, seg(t, tHappens, tHappens + 0.15) * (1 - seg(t, tE - 0.25, tE)), 110, -8, '#7DFF8A');
  o += whip(t, tD, -1);
  return o;
}

// ---------------------------------------------------------------- E: "Your dad is in orbit."
function bigMoon(cx, cy, r) {
  let o = S.circle(cx, cy, r * 1.35, { fill: '#FFF4D6', opacity: 0.06 }) + S.circle(cx, cy, r * 1.15, { fill: '#FFF4D6', opacity: 0.09 });
  o += S.circle(cx, cy, r, ol('#FFF3D4', 8));
  o += S.path(`M${f(cx + r * 0.55)} ${f(cy - r * 0.83)}A${r} ${r} 0 0 1 ${f(cx - r * 0.3)} ${f(cy + r * 0.95)}A${f(r * 1.05)} ${f(r * 1.05)} 0 0 0 ${f(cx + r * 0.55)} ${f(cy - r * 0.83)}Z`, { fill: '#E9D7A8', opacity: 0.55 });
  for (const [dx, dy, rr] of [[-0.35, -0.25, 0.18], [0.25, 0.18, 0.24], [-0.2, 0.43, 0.11], [0.38, -0.42, 0.1], [-0.58, 0.08, 0.08], [0.05, -0.6, 0.07]]) o += S.circle(cx + dx * r, cy + dy * r, rr * r, { fill: '#E6D2A2', stroke: '#D4BE8A', 'stroke-width': 5 });
  return o;
}
function shotE(t) {
  const u = seg(t, tE, tF);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#0A0A2A' }) + S.rect(-200, -200, 2400, 1500, 0, { fill: 'url(#cityStars)' });
  o += S.g(bigMoon(0, 0, 430), `translate(${f(1320 - 60 * u)} ${f(470)})`);
  // the Earth's night edge with city lights far below
  o += S.ellipse(960, 1650, 1500, 700, { fill: '#1A2160', stroke: '#4FA6FA', 'stroke-width': 10 }) + S.ellipse(960, 1650, 1500, 700, { fill: 'none', stroke: '#8FD0FF', 'stroke-width': 40, opacity: 0.18 });
  let lights = '';
  for (let i = 0; i < 26; i++) { const a = -Math.PI / 2 + (hash(i * 3.7) - 0.5) * 1.4, rr = 0.86 + hash(i * 1.9) * 0.1; lights += `M${f(960 + Math.cos(a) * 1500 * rr)} ${f(1650 + Math.sin(a) * 700 * rr)}h6v6h-6Z`; }
  o += S.path(lights, { fill: '#FFD98A' });
  // Dad drifts across, slowly tumbling, tie floating, still on his call
  const dx = lerp(560, 1060, u), dy = 520 + Math.sin(t * 1.3) * 18;
  o += actor('dad', t, { x: dx, y: dy, s: 0.42, rot: lerp(-18, 34, u), armL: 120 + 15 * Math.sin(t * 2), armR: 150, legL: 30, kneeL: 40, legR: -26, kneeR: 50, face: { name: 'scared', mouth: 'O' }, shadow: false }, { arms: false });
  const bk = seg(t, l2.word('orbit').t0 - 0.2, l2.word('orbit').t0);
  if (bk > 0) {
    const bx = dx + 420, by = dy - 330;
    o += S.g(S.rect(-250, -62, 500, 124, 50, ol('#FFFFFF', 6)) + S.path('M-190 30 L-300 60 L-170 -10 Z', ol('#FFFFFF', 6)) + S.rect(-200, -20, 40, 60, 0, { fill: '#FFFFFF' }) + TF('Can you hear me now?', 0, 14, 40, '#2A2246'), `translate(${f(bx)} ${f(by)}) scale(${f(pop(bk))})`);
  }
  o += whip(t, tE, 1);
  return o;
}

// ---------------------------------------------------------------- F: "Your granny is faster than sound."
function shotF(t) {
  const cam = withShake({ zoom: 1.25, x: 900 - (t - tF) * 1500, y: -220 }, t, [[tSound, 0.5, 22]]);
  const Lc = CS.city(t, cam, { time: 1, flying: 1, popups: 0.6, blimp: false, waterFall: 1, flyNear: false });
  let o = Lc.bg + Lc.mid + Lc.fg + Lc.light;
  o += C.speedLines(-300, 2200, 520, 14, 11, '#FFFFFF', 900).replace(/<rect/g, '<rect opacity="0.18"');
  const boom = seg(t, tSound, tSound + 0.6);
  const gx = 900 + 120 * seg(t, tF, tSound) - 260 * ease.out(boom), gy = 720 + Math.sin(t * 9) * 8;
  o += E.grannyRun(t, gx, gy, 0.46, { boom: t >= tSound ? boom : 0, len: 1400 });
  o += K.bang('BOOM!', 520, 280, seg(t, tSound, tSound + 0.12) * (1 - seg(t, tG - 0.2, tG)), 150, -8, '#FFFFFF');
  o += whip(t, tF, -1);
  return o;
}

// ---------------------------------------------------------------- G: the cat licking his paw → the size of a building
function camG(t) {
  const hold = seg(t, tG, tReveal), u = ease.inOut(seg(t, tReveal - 0.05, Math.min(tBuilding + 0.25, tH - 0.25)));
  const zk = Math.exp(lerp(Math.log(lerp(4.0, 3.75, hold)), Math.log(1.0), u));
  // the head (720, 70) sits at (900, 520) in the close-up and drifts to where it lands in the wide ({zoom 1, x -40, y -240})
  return camOn(720, 70, KF.mid, zk, lerp(900, 736, u), lerp(520, 166, u));
}
function shotG(t) {
  const cam = camG(t);
  const zk = 1 + (cam.zoom - 1) * KF.mid;
  const p = scr(cam, { ...CITY.tower, y: CITY.tower.y + 4 });
  const Lc = CS.city(t, cam, { time: 1, flying: 1, popups: lerp(0.15, 1, seg(t, tReveal, tBuilding)), blimp: true, waterFall: 1, flyNear: zk < 2 });
  let o = Lc.bg + K.view(cam, E.dadAtMoon(t), KF.sun) + K.view(cam, E.grannyLoop(t), 0.3) + Lc.mid;
  o += E.lickCat(p.x, p.y, 1.05 * zk, t, { rate: 1.25 });
  o += Lc.fg + Lc.light;
  o += K.bang('?!', 1500, 260, seg(t, tBuilding, tBuilding + 0.15), 160, 10, '#FFE14D');
  o += whip(t, tG, 1);
  return o;
}

// ---------------------------------------------------------------- H–K: YOU float above the city with the laptop (≡ SC 06 end)
const SCREEN_LINES = [';fly all', ';size all cats 100', ';fly Dad', ';speed Granny'];
function shotH(t) {
  const u = seg(t, tH, tI);
  const cam = { zoom: lerp(1.0, 1.08, ease.inOut(u)), x: lerp(-40, 20, u), y: 0 };
  return E.floatShot(t, {
    cam, popups: 1, dim: 0.22,
    hero: { x: 900, y: 1040, s: 0.66, face: { name: 'scared', fx: ['sweat'] }, typing: 1, screen: { lines: SCREEN_LINES, typed: '' } },
  }) + whip(t, tH, -1);
}
// close-up while typing ";unfly everyone" on his words; ENTER, then the stamp
function shotIJ(t) {
  const u = seg(t, tI, tK);
  const z = (1 + 0.06 * ease.inOut(u)) * punch(t, tDeniedW, 0.12);
  const cam = withShake({ zoom: 1.0, x: 0, y: 0 }, t, [[tDenied, 0.45, 26], [tDeniedW, 0.3, 14]]);
  const prog = K.typeProgress(t, l3, 'Un', 'everyone');
  const ent = seg(t, tEnter, tEnter + 0.3);
  const den = seg(t, tDenied, tDenied + 0.22);
  const shock = t >= tDenied;
  const lines = shock ? [...SCREEN_LINES, ';unfly everyone', 'PERMISSION DENIED'] : SCREEN_LINES;
  let o = E.floatShot(t, {
    cam, popups: 1, dim: 0.22,
    hero: { x: 640, y: 1390, s: 1.02, volume: false, face: shock ? { name: 'shocked', fx: ['sweat2'] } : { name: 'determined', fx: ['sweat'] }, typing: shock ? 0 : 1, screen: { lines, typed: shock ? '' : ';unfly everyone'.slice(0, Math.round(prog * 15)), glitch: shock ? 0.5 : 0 } },
  });
  let ui = K.chatCommand(1330, 360, ';unfly everyone', prog, { t, enter: ent, s: 1.35 });
  if (t >= tEnter) ui += K.commandBurst(1330, 360, t - tEnter, '#3DFF9A', 300);
  ui += S.g(K.denied(0, 0, den, 1.05), `translate(1340 380) rotate(${f(-6 * pop(den))})`);
  o += zoomAt(ui, 1 + 0.04 * Math.sin(t * 40) * seg(t, tDenied, tDenied + 0.3) * (1 - seg(t, tDenied + 0.3, tDenied + 0.6)), 1330, 370);
  o = zoomAt(o, z, 900, 520);
  o += E.redHit(t, tDenied, 0.45);
  o += whip(t, tI, 1);
  return o;
}
function shotK(t) {
  const u = seg(t, tK, tL);
  const cam = { zoom: 1.05, x: 0, y: lerp(-30, -60, u) };
  const up = ease.out(seg(t, tK + 0.05, tK + 0.45));
  return E.floatShot(t, {
    cam, popups: 1, admin: 0.12 * seg(t, tK, tL), dim: 0.18,
    hero: { x: 900, y: 1240, s: 0.9, armsUp: up, typing: 0, face: { name: 'angry', fx: ['anger'] }, energy: 1.5, screen: { lines: [';unfly everyone', 'PERMISSION DENIED', 'PERMISSION DENIED'] } },
  }) + whip(t, tK, -1);
}

// ---------------------------------------------------------------- L: "No. … I am." — the sky cracks, the Admin's chat
const crackK = (t) => 0.8 * ease.out(seg(t, tNo - 0.02, tNo + 0.5));
const chatProg = (t) => (t < tIam ? 0.36 * seg(t, tNo, tNo + 0.25) : 0.36 + 0.64 * seg(t, tIam, l5.b));
const camL = (t) => withShake(K.camKeys(t, [[tL, { zoom: 1.0, x: 0, y: -240 }], [tM, { zoom: 1.08, x: 0, y: -250 }]]), t, [[tNo, 0.6, 26], [tIam, 0.35, 12]]);
function shotL(t, freezeT) {
  const tt = freezeT ?? t;
  const cam = freezeT ? camM(t) : camL(t);
  const ck = crackK(tt);
  const silK = seg(tt, tNo + 0.15, tNo + 0.5);
  let o = E.chaosWide(tt, cam, {
    crack: ck, admin: 0.25 * ck, waterFall: 1, popups: 1,
    onSky: E.silhouette(960, 225, 0.74, silK, tt, seg(tt, tIam, tIam + 0.15) * (1 - seg(tt, l5.b, l5.b + 0.5))),
    skyChat: { text: 'No. I am.', progress: chatProg(tt), emerge: seg(tt, tNo + 0.05, tNo + 0.55), w: 860, h: 260, dy: 250, size: 92 },
    hero: { x: 960, y: 640, s: 0.22, typing: 0, face: { name: 'shocked', eyes: { look: [0, -1] } }, headRot: -8, screen: { lines: ['PERMISSION DENIED'] } },
  });
  if (!freezeT) o += flash(t, tNo, 0.22, 0.95) + flash(t, tIam, 0.12, 0.4, '#FFF4C4');
  return o;
}

// ---------------------------------------------------------------- M: freeze frame + call-outs — "out of hand"
const FREEZE = () => tM - 0.02;
const camM = (t) => K.camKeys(t, [[tM, { zoom: 1.08, x: 0, y: -250 }], [tM + 0.15, { zoom: 1.08, x: 0, y: -250 }], [tN, { zoom: 1.0, x: 0, y: -235 }]], ease.inOut);
function callout(x, y, txt, k, dir = 1, col = '#FFE14D', dy = -90) {
  if (k <= 0) return '';
  const w = 40 + txt.length * 22;
  const bx = clamp(x + dir * 90, 30 + (dir < 0 ? w : 0), 1890 - (dir > 0 ? w : 0)), by = y + dy;
  let o = S.path(`M${f(x)} ${f(y)} L${f(bx)} ${f(by + 20)}`, ln(10)) + S.path(`M${f(x)} ${f(y)} L${f(bx)} ${f(by + 20)}`, ln(5, col)) + S.circle(x, y, 10, ol(col, 4));
  o += S.g(S.rect(-w / 2, -34, w, 64, 16, ol('#151515', 5)) + TF(txt, 0, 12, 36, col), `translate(${f(bx + dir * w / 2)} ${f(by)}) rotate(${f(-3 * dir)}) scale(${f(pop(k))})`);
  return o;
}
function shotM(t) {
  const ft = FREEZE();
  const cam = camM(t);
  let o = shotL(t, ft);
  // frozen: cool desaturated tint + scanlines
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#7F90C8', opacity: 0.16 }) + S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#setsScan)', opacity: 0.35 });
  const ws = [['Things', 0], ['got', 0], ['little', 0], ['out', 0], ['hand', 0]].map(([w]) => l6.word(w).t0);
  const pin = (a) => scr(cam, a);
  const moon = pin({ x: CITY.moon.x - 60, y: CITY.moon.y + 30, k: KF.sun });
  const tower = pin({ x: CITY.tower.x + 60, y: CITY.tower.y - 110, k: KF.mid });
  const hook = CS.craneHook(ft, { hookLen: 330, hookSwing: 3 });
  const cage = pin({ x: hook.x, y: hook.y + 40, k: KF.mid });
  const hero = pin({ x: 960, y: 470, k: 1 });
  const gran = pin({ x: 960 + Math.cos(ft * 0.55) * 1050, y: 300 + Math.sin(ft * 0.55) * 150, k: 0.3 });
  const ck = (i) => seg(t, ws[i] - 0.05, ws[i] + 0.15);
  o += callout(moon.x, moon.y, 'DAD (in orbit)', ck(0), 1, '#8FD0FF', -110);
  o += callout(gran.x, gran.y, 'GRANNY (Mach 2)', ck(1), -1, '#FFB347', 100);
  o += callout(tower.x - 40, tower.y, 'PANCAKE (building-sized)', ck(2), -1, '#FFB347', 50);
  o += callout(cage.x, cage.y, 'BRICK (jailed)', ck(3), -1, '#7DFF8A', 90);
  o += callout(hero.x - 40, hero.y + 60, 'YOU (not the admin)', ck(4), -1, '#FF7A7A', 0);
  // pause marks top-left
  o += S.g(S.rect(-12, -40, 26, 80, 6, { fill: '#FFFFFF' }) + S.rect(28, -40, 26, 80, 6, { fill: '#FFFFFF' }), 'translate(110 120)', { opacity: f(0.85 * (Math.floor(t * 1.6) % 2 ? 0.55 : 1)) });
  o += flash(t, tM, 0.14, 0.7);
  return o;
}

// ---------------------------------------------------------------- live shots (also replayed backwards by the rewind)
function live(t) {
  if (t < tC) return shotAB(t);
  if (t < tD) return shotC(t);
  if (t < tE) return shotD(t);
  if (t < tF) return shotE(t);
  if (t < tG) return shotF(t);
  if (t < tH) return shotG(t);
  if (t < tI) return shotH(t);
  if (t < tK) return shotIJ(t);
  if (t < tL) return shotK(t);
  return shotL(t);
}

// ---------------------------------------------------------------- N: VHS rewind back to MONDAY
const DAYS = ['SATURDAY', 'FRIDAY', 'THURSDAY', 'WEDNESDAY', 'TUESDAY', 'MONDAY'];
function rewindTri(x, y, s) {
  return S.g(S.path('M0 -30 L-44 0 L0 30 Z M44 -30 L0 0 L44 30 Z', { fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 5, 'stroke-linejoin': 'round' }), `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function shotN(t) {
  const span = END - 0.22 - tN;
  const u = seg(t, tN, END - 0.22);
  const src = Math.max(0.6, tM - 0.08 - ease.in(u) * (tM - 0.9));
  let o = live(src);
  // the frame jitters like an old tape
  const jy = (hash(Math.floor(t * 24)) - 0.5) * 18;
  o = S.g(o, `translate(0 ${f(jy)})`);
  o += C.vhs(t, '', 1);
  o += rewindTri(140, 120, 1.1) + outT('REWIND', 300, 145, 72, '#FFFFFF', 10, { 'text-anchor': 'start' });
  // the day counter rolls back to MONDAY (lands on the word)
  const dk = clamp(seg(t, tN + 0.1, tMonday) * (DAYS.length - 1), 0, DAYS.length - 1);
  const i = Math.floor(dk + 1e-6), fr = dk - i;
  const day = DAYS[Math.min(DAYS.length - 1, i)];
  const big = i === DAYS.length - 1 ? pop(seg(t, tMonday, tMonday + 0.2)) : 1;
  o += S.g(S.rect(-330, -90, 660, 180, 30, { fill: '#10131C', opacity: 0.82, stroke: '#FFFFFF', 'stroke-width': 6 }) + outT(day, 0, 34 - fr * 30, 100, i === DAYS.length - 1 ? '#FFE14D' : '#FFFFFF', 12), `translate(1480 150) scale(${f(0.8 + 0.2 * big)})`);
  void span;
  o += flash(t, tN, 0.12, 0.6);
  o += C.whiteFlash(seg(t, END - 0.22, END - 0.02));
  return o;
}

function scene(t) {
  if (t < tM) return live(t);
  if (t < tN) return shotM(t);
  return shotN(t);
}

function look(t) {
  if (t >= tN) return { grade: null, vignette: 0.6 };
  if (t >= tM) return { grade: 'cool', vignette: 1 };
  if (t >= tE && t < tF) return { grade: 'cool', vignette: 1 };
  return { grade: 'cool', vignette: 0.85 };
}

module.exports = { scene, look };
