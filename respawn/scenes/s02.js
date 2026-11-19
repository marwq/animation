// SC 02 · ТЫ ОЧЕНЬ БОИШЬСЯ ОШИБИТЬСЯ — Monday. Mr. Fig's class: the hero knows 7 × 8 but never says it (player card, the
// twitching hand, WRONG! daydream, the neighbour shouts FIFTY-SIX!, the slow slide under the desk). In games he's fearless
// (the Mega Obby: leap, flip, lava, respawn). In the kitchen he hops on the spot looking for a checkpoint: nothing. Dad's
// pancake joke (MON/TUE/WED, the family mouths along, FLAT! BA-DUM TSS), Bea's honesty (a sad mushroom), Gary has seen things,
// Mom rushes out (mistakes are how we learn), Ivy's rocket sneakers explode in her garage lab (soot, FAIL #312, the Book of
// Fails), the TALENT SHOW poster ("IVY & YOU: SCIENCE MAGIC!"), the whole school, the horror, the deadpan button.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const R = require('./respawn');
const H = require('./sets_home');
const SS = require('./sets_school');
const X = require('../rig/extras');
const { D: DSG, handAt } = require('../rig/cast');
const AC = require('./acting');
const E = require('./s02_env');
const { tf, TS, TFS, pop, at, toScr, shakeAll, clipTo, faceAt, zoomAbout, blinkV, boing, whip, smash, zoomLines, streaks, nameCard, speech, thought } = E;

const { C, b, T0, END } = E.timing();
const LINE = '#151515';
const kidDraw = (i, pose) => K.draw.kid(i, { shade: true, shadow: false, ...pose });
const breathe = (t, ph = 0) => ({ bodyY: 3 + 3 * Math.sin(t * 4.2 + ph) });
const room = (Lr, cam, behind, chars, kbg = 0.8) => view(cam, Lr.bg, kbg) + view(cam, (Lr.mid || '') + behind + (Lr.front || '') + chars + (Lr.fg || '') + (Lr.light || ''), 1);
const typing = (t, on = 1, base = 22) => ({ armL: base + (on ? Math.sin(t * 38) * 5 : 0), armR: base + (on ? Math.sin(t * 41 + 1.3) * 5 : 0) });

// ================================================================= CLASSROOM (Mr. Fig, Monday 8:00)
const CL = SS.SPOTS.classroom;
const ROW_KIDS = [[2, 5, 7, 9, 11], [3, 6, 8, 10, 12], [13, 4, -1, 1, 14]];   // -1 = the hero's seat; row1[3] = the neighbour
const NEIGH = 1;
// the seated kids, back -> front: [row3, row2, row1-without-hero]; mode: 'blank' | 'clap' | 'laugh' | 'stare'
function classKids(t, mode = 'blank', o = {}) {
  const out = ['', '', ''];
  // cull kids outside the camera (o.cam) — a seated kid is ~260 px wide at s .5
  const z = o.cam ? (o.cam.zoom ?? 1) : 1, vx0 = o.cam ? 960 + (o.cam.x || 0) - 960 / z - 180 : -1e9, vx1 = o.cam ? 960 + (o.cam.x || 0) + 960 / z + 180 : 1e9;
  CL.rows.forEach((row, r) => row.forEach((st, c) => {
    const i = ROW_KIDS[r][c];
    if (i < 0) return;
    if (r === 2 && c === 3 && o.noNeighbour) return;
    if (st.x < vx0 || st.x > vx1) return;
    const seed = i * 1.7;
    let pose = { x: st.x, y: st.y, s: st.s, volume: false, ...breathe(t, seed) };
    const lookX = clamp((960 - st.x) / 900, -0.8, 0.8);
    if (mode === 'blank') pose.face = { name: (i % 3) ? 'deadpan' : 'neutral', eyes: { look: [hash(i) - 0.5, -0.3] }, blink: blinkV(t, i) };
    else if (mode === 'stare') pose.face = { name: 'neutral', eyes: { look: [lookX, 0.3] }, blink: blinkV(t, i) };
    else if (mode === 'clap') {
      const cl = Math.abs(Math.sin(t * 13 + i));
      pose = { ...pose, face: { name: 'happy', eyes: { look: [clamp((1440 - st.x) / 900, -0.8, 0.8), 0] } }, armL: 40 + 30 * cl, armR: 40 + 30 * cl };
    } else if (mode === 'laugh') {
      const sh = Math.sin(t * 22 + i);
      const side = st.x < 960 ? 1 : -1;
      pose = { ...pose, face: { name: 'joy' }, bodyY: 6 * Math.abs(sh), headRot: 6 * sh, ...(side > 0 ? { armR: 80 + 6 * sh, armL: 12 } : { armL: 80 + 6 * sh, armR: 12 }), turn: 0.25 * side };
    }
    if (o.faceFn) pose = { ...pose, ...o.faceFn(i, r, c, t) };
    out[r] += kidDraw(i, pose);
  }));
  return out;
}
function teacherFront(t, pose = {}) {
  return actor('teacher', t, { x: CL.teacher.x, y: CL.teacher.y, s: CL.teacher.s, view: 'back', ...breathe(t, 2), ...pose });
}
const classOpts = { time: 'morning', clock: '8:00' };

// ---- 1. Monday morning: push in; freeze on "you" + YOU tag
function shOpen(t) {
  const ft = Math.min(t, b.you + 0.02);
  const u = ease.inOut(seg(t, C.open, b.you));
  const cam = { zoom: lerp(1.02, 1.62, u), x: 0, y: lerp(0, 200, u) };
  const kids = classKids(ft, 'blank', { cam });
  const doodle = Math.sin(ft * 9) * 6;
  kids[2] += actor('you', ft, { ...CL.heroDesk, armL: 22 + doodle * 0.3, armR: 26 - doodle * 0.3, headRot: t < b.you ? 4 : 0,
    face: t < b.you ? { name: 'neutral', eyes: { look: [0.1, 0.6] } } : { name: 'nervous', mouth: 'smallSmile', eyes: { look: [0, 0] }, fx: [] } });
  let o = SS.classroom.compose(ft, classOpts, kids, teacherFront(ft), cam);
  if (t >= b.you) {
    // freeze-frame: the picture tilts into a white-bordered still on a dark ground
    const k = ease.outBack(seg(t, b.you, b.you + 0.25));
    const sc = lerp(1, 0.9, k), rot = lerp(0, -2.5, k);
    o = S.rect(0, 0, 1920, 1080, 0, { fill: '#1E1A2E' }) + S.g(S.rect(-14, -14, 1948, 1108, 6, { fill: '#FFFFFF' }) + o + S.rect(0, 0, 1920, 1080, 0, { fill: '#FFE8C8', opacity: f(0.1 * k) }), `translate(960 540) rotate(${f(rot)}) scale(${f(sc)}) translate(-960 -540)`);
    o += nameCard(t, b.you + 0.03, 1480, 250, 'YOU', 'THE HERO · PLAYER 1', '#FF5A3D', { ax: 1120, ay: 420 });
    o += smash(t, b.you, 0.12, 0.85);
    const ak = pop(t, b.twelve - 0.02, 0.25);
    if (ak > 0.01) o += S.g(S.circle(0, 0, 96, ol('#FFD21F', 8)) + TF('AGE', 0, -30, 34, '#1E1A2E') + T('12', 0, 52, 96, '#1E1A2E'), tf(1700, 560, ak, 12));
  }
  // the title: Monday, 8:00 AM
  const tk = pop(t, C.open + 0.15, 0.3) * (1 - seg(t, b.you - 0.1, b.you));
  if (tk > 0.01) o += S.g(S.rect(-250, -44, 500, 88, 30, ol('#1E1A2E', 6)) + TF('MONDAY · 8:00 AM', 0, 14, 42, '#FFE14D', { 'letter-spacing': 2 }), tf(1580, 110, tk, 3));
  // hand-over from SC01's rewind: white flash out + a VHS "PLAY" tail
  const v = 1 - seg(t, C.open, C.open + 0.35);
  if (v > 0) o += K.C.vhs(t, '▶ PLAY', v) + K.C.whiteFlash(1 - seg(t, C.open, C.open + 0.2));
  return o;
}

// ---- 2. the player card: AGE 12 · SMART · FUNNY · FEAR OF MESSING UP (overflows) — smash-zooms on VERY / scared
function shCard(t) {
  const kAge = pop(t, b.twelve - 0.05, 0.3), kSmart = pop(t, b.smart - 0.05, 0.3), kFunny = pop(t, b.funny - 0.05, 0.3);
  const kFear = pop(t, b.very - 0.35, 0.25);
  const fear = clamp(seg(t, b.very - 0.1, b.scared + 0.08) * 1.05 + 2.2 * ease.in(seg(t, b.scared + 0.08, b.messing + 0.5)), 0, 3.5);
  const alarm = t > b.very ? 1 : 0;
  // backdrop: purple diagonal stripes (red pulse once FEAR overflows)
  let w = S.rect(-400, -400, 2720, 1880, 0, { fill: 'url(#s02CardBg)' }) + S.rect(-400, -400, 2720, 1880, 0, { fill: 'url(#s02Stripes)', transform: `translate(${f((t * 60) % 120)} 0)` });
  if (alarm) w += S.rect(-400, -400, 2720, 1880, 0, { fill: '#FF2E3E', opacity: f(0.18 + 0.14 * Math.sin(t * 18)) });
  w += T('PLAYER 1', 960, 1000, 300, '#FFFFFF', { opacity: 0.06 });
  // the hero
  let pose = { x: 520, y: 965, s: 0.78, turn: 0.25, volume: undefined };
  let face = { name: 'happy' };
  if (t < b.smart - 0.1) { pose = { ...pose, armR: 150 + 14 * Math.sin(t * 14), armL: 10 }; face = { name: 'happy' }; }
  else if (t < b.funny - 0.1) { const k = ease.outBack(seg(t, b.smart - 0.1, b.smart + 0.2)); pose = { ...pose, armR: lerp(150, 170, k), armL: 14, headRot: -6 }; face = { name: 'smug', fx: ['sparkles'] }; }
  else if (t < b.very - 0.1) { const k = ease.outBack(seg(t, b.funny - 0.1, b.funny + 0.2)); pose = { ...pose, armL: lerp(14, 115, k), armR: lerp(170, 115, k), lift: 40 * bump(t, b.funny - 0.1, b.funny + 0.3), headRot: 8 * Math.sin(t * 9) }; face = { name: 'yuck', eyes: { type: 'happy' } }; }
  else { pose = { ...pose, armL: 8, armR: 8, x: 520 + 5 * Math.sin(t * 60), turn: 0.1, ...boing(t, b.very, 0.25) }; face = { name: 'scared', fx: ['sweat2'] }; }
  w += actor('you', t, { ...pose, face }, { arms: false });
  if (t >= b.smart - 0.1 && t < b.funny - 0.1) w += K.F.sparkle(560, 150, 36 * bump(t, b.smart, b.smart + 0.6), '#FFE14D');
  w += E.playerCard(t, { kAge, kSmart, kFunny, kFear, fear, crack: seg(t, b.scared + 0.2, b.scared + 0.45) });
  if (fear > 1) w += E.zoomLines(1500, 860, 0.5, t, '#FFE14D', 18, 300);
  const bar = { x: 1430, y: 850 }, face0 = { x: 545, y: 425 };
  const cam = camKeys(t, [
    [C.card, { zoom: 1.0, x: 0, y: 0 }], [b.very - 0.08, { zoom: 1.05, x: 20, y: 10 }],
    [b.very, { zoom: 1.75, x: bar.x - 960, y: bar.y - 540 }], [b.scared - 0.02, { zoom: 1.8, x: bar.x - 900, y: bar.y - 540 }],
    [b.scared + 0.05, { zoom: 2.1, x: face0.x - 960, y: face0.y - 540 }], [C.board, { zoom: 2.3, x: face0.x - 960, y: face0.y - 530 }],
  ]);
  shakeAll(cam, t, [[b.very, 0.3, 14], [b.scared + 0.05, 0.6, 18]]);
  let o = view(cam, w);
  o += smash(t, b.very, 0.1, 0.6) + smash(t, b.scared + 0.05, 0.1, 0.6);
  if (t > b.scared + 0.05) o += K.bang('!!!', 1480, 280, pop(t, b.scared + 0.1, 0.2), 150, 8, '#FF3B4E');
  return o;
}

// ---- 3. the whiteboard: Mr. Fig, "Anyone?" + MR. FIG tag
function shBoard(t) {
  const Lb = SS.classroom.layers(t, { view: 'board', time: 'morning', board: ['7 × 8 = ?'] });
  const u = seg(t, C.board, C.blank);
  const cam = { zoom: lerp(1.3, 1.38, u), x: 620 - 960, y: 520 - 540 };
  const tap = t > b.anyone + 0.25 ? Math.max(0, Math.sin((t - b.anyone) * 10)) : 0;
  const fig = actor('teacher', t, { ...CL.board.teacher, turn: 0.45, armR: 70 + 10 * tap, armL: 10, marker: true, face: { name: 'deadpan', eyes: { look: [0.3, 0] } } }, { arms: false, energy: 0.6 });
  const fgKids = actor('you', t, { ...CL.board.seats[0], view: 'back', volume: false, ...breathe(t) }) + kidDraw(NEIGH, { ...CL.board.seats[1], view: 'back', volume: false, ...breathe(t, 2) });
  let o = view(cam, Lb.mid + fig + Lb.front + fgKids + Lb.fg + Lb.light);
  o += nameCard(t, b.anyone + 0.15, 1360, 720, 'MR. FIG', 'MATHS · BORED SINCE 1998', '#5A8A3A', { size: 88, rot: 4, ax: 640, ay: 420 });
  return o;
}

// ---- 4. the class: blank faces (a cricket)
function shBlank(t) {
  const u = seg(t, C.blank, C.hero);
  const cam = { zoom: lerp(1.05, 1.2, ease.inOut(u)), x: 0, y: lerp(30, 90, u) };
  const kids = classKids(t, 'blank', { cam });
  const tw = Math.max(0, Math.sin((t - C.blank) * 7)) * (t > b.eight ? 1 : 0);
  kids[2] += actor('you', t, { ...CL.heroDesk, armL: 18, armR: 18 + 30 * tw, face: { name: 'nervous', eyes: { look: [0, -0.4] } } }, { arms: false });
  let o = SS.classroom.compose(t, classOpts, kids, teacherFront(t, { armR: 30, headRot: -4 }), cam);
  // a lone cricket chirps on the front desk
  o += K.bang('chirp', 1520, 470, pop(t, b.eight + 0.2, 0.2) * (1 - seg(t, C.hero - 0.2, C.hero)), 46, 6, '#B8F5D0');
  return o;
}

// ---- 5. the hero whispers "Fifty-six" — the hand twitches up a centimetre and drops
function heroHandRaise(t) {
  // two attempts + jitter; returns armR
  const a1 = bump(t, b.fifty - 0.05, b.its - 0.2) * 88, a2 = bump(t, b.its - 0.05, b.what - 0.1) * 112;
  const jit = (a1 + a2 > 4) ? 4 * Math.sin(t * 55) : 0;
  return 12 + a1 + a2 + jit;
}
function shHero(t) {
  const u = seg(t, C.hero, C.whatif);
  const cam = shakeAll({ zoom: lerp(1.75, 1.95, u), x: 0, y: 210 }, t, []);
  const kids = classKids(t, 'blank', { cam });
  const armR = heroHandRaise(t);
  kids[2] += actor('you', t, { ...CL.heroDesk, armL: 18, armR, headRot: -3, face: { name: 'nervous', eyes: { look: [0.15, -0.5] }, fx: t > b.its ? ['sweat'] : [] } }, { arms: false, energy: 0.4 });
  let o = SS.classroom.compose(t, classOpts, kids, '', cam);
  // twitch marks next to the hand
  const tk = armR > 70 ? 1 : 0;
  if (tk) {
    const [hx, hy] = toScr(cam, 960 + 0.5 * (100 + 250 * Math.sin((armR * Math.PI) / 180)) + 30, 1080 - 0.5 * (515 - 250 * Math.cos((armR * Math.PI) / 180)));
    o += S.path(`M${f(hx + 20)} ${f(hy - 40)} l26 -20 M${f(hx + 30)} ${f(hy)} l34 0 M${f(hx + 20)} ${f(hy + 40)} l26 20`, ln(7, '#FFFFFF')) + S.path(`M${f(hx + 20)} ${f(hy - 40)} l26 -20 M${f(hx + 30)} ${f(hy)} l34 0 M${f(hx + 20)} ${f(hy + 40)} l26 20`, ln(3, LINE));
  }
  return o;
}

// ---- 6. "...But what if it's not?" — daydream: WRONG! (buzzer), the whole class laughs
function cloudBorder(t, k) {
  if (k <= 0.01) return '';
  let d = '';
  const ring = [];
  for (let i = 0; i < 18; i++) ring.push([i / 17 * 1920, -10], [i / 17 * 1920, 1090]);
  for (let i = 1; i < 10; i++) ring.push([-10, i / 10 * 1080], [1930, i / 10 * 1080]);
  ring.forEach(([x, y], i) => { const r = (110 + 40 * hash(i * 1.3)) * k + 8 * Math.sin(t * 3 + i); d += `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 1 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 1 ${f(-2 * r)} 0Z`; });
  return S.path(d, { fill: LINE, stroke: LINE, 'stroke-width': 16 }) + S.path(d, { fill: '#F4EEFF' }) + S.path(d, { fill: '#D9C8FF', opacity: 0.35, transform: 'translate(0 10)' });
}
function shWhatIf(t) {
  const tWrong = b.what + 0.12;
  const wrong = t >= tWrong;
  const cam = shakeAll({ zoom: lerp(1.05, 1.12, seg(t, C.whatif, C.know)), x: 0, y: 60 }, t, [[tWrong, 0.45, 20]]);
  const kids = classKids(t, wrong ? 'laugh' : 'stare', { cam });
  const st = ease.outBack(seg(t, C.whatif, C.whatif + 0.3));
  kids[2] += actor('you', t, { x: 960, y: 1080 - 120 * st, s: 0.5, armR: wrong ? 30 : 165, armL: 10, ...boing(t, tWrong, 0.25),
    face: wrong ? { name: 'scared', mouth: 'O' } : { name: 'happy', mouth: 'grin' } }, { arms: false });
  let o = SS.classroom.compose(t, classOpts, kids, '', cam);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#B46BFF', opacity: 0.16 });
  if (!wrong) o += speech(1240, 330, '56!', pop(t, C.whatif + 0.15, 0.25), { size: 90, tail: -1 });
  if (wrong) {
    const k = pop(t, tWrong, 0.22);
    o += S.g(S.path('M-190 -190 L190 190 M190 -190 L-190 190', ln(110, '#151515')) + S.path('M-190 -190 L190 190 M190 -190 L-190 190', ln(80, '#FF3B4E')), tf(960, 470, k, 0));
    o += K.bang('WRONG!', 960, 230, k, 150, -4, '#FF3B4E');
    o += K.bang('HA HA HA', 380, 760, pop(t, tWrong + 0.2, 0.2), 80, -10, '#FFFFFF') + K.bang('HAHA', 1580, 700, pop(t, tWrong + 0.28, 0.2), 80, 8, '#FFFFFF');
  }
  o += cloudBorder(t, 1);
  o += S.g(S.rect(-150, -38, 300, 76, 26, ol('#B46BFF', 6)) + TF('WHAT IF...', 0, 14, 40, '#FFFFFF'), tf(240, 120, pop(t, C.whatif, 0.25), -6));
  return o;
}

// ---- 7. "You always know the answer." — triptych: three classes, three right answers, the hand stays down
const KNOW = [
  { q: '12 ÷ 4 = ?', a: '3', col: '#BEEBD8', ink: '#2457C5' },
  { q: 'CAPITAL OF FRANCE?', a: 'PARIS', col: '#BFE3FF', ink: '#D8262E' },
  { q: 'H₂O = ?', a: 'WATER', col: '#FFE8A8', ink: '#2E9E4A' },
];
function shKnow(t) {
  const ts = [b.always - 0.05, b.know - 0.05, b.answer - 0.05];
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#1E1A2E' });
  KNOW.forEach((P, i) => {
    const k = ease.out(seg(t, ts[i], ts[i] + 0.25));
    if (k <= 0) return;
    const x0 = i * 640, dy = (1 - k) * (i % 2 ? -1100 : 1100);
    let p = S.rect(x0 - 60, -60, 760, 1200, 0, { fill: P.col });
    // mini whiteboard
    p += S.rect(x0 + 60, 70, 520, 210, 14, ol('#FFFFFF', 7)) + TF(P.q, x0 + 320, 200, P.q.length > 10 ? 44 : 70, P.ink);
    // the hero at his desk: answer in a thought bubble, hand stays down
    const hx = x0 + 300, fy = 690;
    p += actor('you', t + i * 0.7, { x: hx, y: faceAt(fy, 0.6), s: 0.6, armL: 16, armR: 16, turn: (i - 1) * 0.25, volume: false,
      face: { name: i === 2 ? 'nervous' : 'smug', eyes: { look: [0.3, -0.5] }, fx: i === 2 ? ['sweat'] : [] } }, { arms: false });
    p += S.rect(x0 - 60, 935, 760, 300, 0, ol('#C98A52', 8)) + S.rect(x0 - 60, 935, 760, 22, 0, { fill: '#E3A86A' });
    const bk = pop(t, ts[i] + 0.25, 0.25);
    p += thought(hx + 170, 410, 250, 150, bk, T(P.a, 0, 22, P.a.length > 2 ? 52 : 90, '#1E1A2E') + S.g(S.circle(0, 0, 26, ol('#3DDC84', 5)) + S.path('M-12 0 l8 10 l16 -18', ln(6, '#FFFFFF')), 'translate(110 -60)'), { tail: [-120, 110], seed: i });
    o += clipTo(x0 + (i ? 6 : 0), 0, 640 - (i ? 6 : 0), 1080, S.g(p, `translate(0 ${f(dy)})`));
  });
  return o;
}

// ---- 8. "You just never say it." — zip! the hand twitches, gets yanked back down
function shNever(t) {
  const u = seg(t, C.never, C.wrong);
  const cam = { zoom: lerp(2.15, 2.3, u), x: 0, y: 190 };
  const kids = classKids(t, 'blank', { cam });
  const yank = b.say + 0.15;
  let armR = 14 + Math.max(0, Math.sin((t - C.never) * 16)) * 16 * (t < b.say ? 1 : 0);
  if (t >= b.say - 0.15 && t < yank) armR = lerp(30, 95, ease.out(seg(t, b.say - 0.15, yank)));
  else if (t >= yank) armR = lerp(95, 6, ease.outBack(seg(t, yank, yank + 0.18)));
  kids[2] += actor('you', t, { ...CL.heroDesk, armL: t >= yank ? lerp(16, 40, seg(t, yank, yank + 0.1)) : 16, armR, ...boing(t, yank + 0.05, 0.15),
    face: { name: 'nervous', mouth: 'line', eyes: { look: [0, 0] }, fx: ['sweat'] } }, { arms: false });
  let o = SS.classroom.compose(t, classOpts, kids, '', cam);
  const [mx, my] = toScr(cam, 960, 1080 - 600 * 0.5);
  o += E.zipper(mx, my, 0.5 * cam.zoom * 0.62, seg(t, b.never - 0.08, b.never + 0.35));
  o += K.bang('ZIP!', mx + 330, my - 160, pop(t, b.never + 0.2, 0.2) * (1 - seg(t, b.say, b.say + 0.2)), 80, 10, '#FFFFFF');
  o += K.bang('NOPE.', mx - 380, my - 120, pop(t, yank, 0.2), 90, -8, '#FFE14D');
  return o;
}

// ---- 9. "Because what if you're wrong?" — slow push into the sweating face, heartbeat
function shWrong(t) {
  const u = ease.in(seg(t, C.wrong, C.shout));
  const beat = Math.pow(Math.max(0, Math.sin((t - C.wrong) * Math.PI * 2.4)), 8);
  const cam = { zoom: lerp(2.3, 3.6, u) * (1 + 0.025 * beat), x: 0, y: lerp(190, 200, u) };
  const kids = classKids(t, 'stare', { cam });
  const look = Math.sin(t * 5) > 0 ? 0.6 : -0.6;
  kids[2] += actor('you', t, { ...CL.heroDesk, armL: 14, armR: 14, x: 960 + 2 * Math.sin(t * 50), face: { name: 'scared', eyes: { look: [look, 0] }, fx: ['sweat2'] } }, { arms: false });
  let o = SS.classroom.compose(t, classOpts, kids, '', cam);
  o += H.darkRing(960, 470, 560, 430, '#120818', 0.55 + 0.25 * u);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FF2E3E', opacity: f(0.12 * beat) });
  return o;
}

// ---- 10. SMASH: the neighbour jumps up: "FIFTY-SIX!"
function shShout(t) {
  const t0 = b.s56;
  const cam = shakeAll(camKeys(t, [[C.shout, { zoom: 1.35, x: 240, y: 160 }], [t0 + 0.05, { zoom: 1.4, x: 250, y: 160 }], [t0 + 0.14, { zoom: 2.1, x: 1440 - 960, y: 600 - 540 }], [C.slide, { zoom: 2.2, x: 1440 - 960, y: 590 - 540 }]], ease.out), t, [[t0 + 0.1, 0.4, 16]]);
  const kids = classKids(t, 'stare', { noNeighbour: true, cam });
  const up = ease.outBack(seg(t, t0 - 0.06, t0 + 0.18));
  kids[2] += kidDraw(NEIGH, { ...CL.neighbour, lift: 110 * up, armR: lerp(10, 172, up) + 6 * Math.sin(t * 30), armL: lerp(10, 40, up), turn: -0.2, ...boing(t, t0 + 0.1, 0.2),
    face: { name: 'excited', mouth: 'scream' } });
  kids[2] += actor('you', t, { ...CL.heroDesk, lean: -6 * up, armL: 10, armR: 10, face: { name: 'shocked', eyes: { look: [0.8, 0] } } }, { arms: false });
  let o = SS.classroom.compose(t, classOpts, kids, '', cam);
  o += zoomLines(1140, 360, up, t, '#FFFFFF');
  o += K.bang('FIFTY-SIX!', 1060, 220, pop(t, t0 + 0.04, 0.2), 170, -6, '#FFE14D');
  return o + smash(t, t0 + 0.12, 0.12, 0.6);
}

// ---- 11. "It was fifty-six." — CORRECT! the class claps, the neighbour gets a star, the hero slides under the desk
function shSlide(t) {
  const u = seg(t, C.slide, C.games);
  const cam = { zoom: lerp(1.62, 1.72, u), x: 30, y: 230 };
  const kids = classKids(t, 'clap', { noNeighbour: true, cam });
  const nb = Math.abs(Math.sin(t * 8));
  kids[2] += kidDraw(NEIGH, { ...CL.neighbour, lift: 30 * nb, armR: 160, armL: 150, face: { name: 'joy' } });
  const sl = ease.inOut(seg(t, b.correct + 0.1, C.games - 0.05));
  kids[2] += actor('you', t, { ...CL.heroDesk, y: CL.heroDesk.y + 82 * sl, sy: 1 - 0.08 * sl, sx: 1 + 0.04 * sl, armL: 6, armR: 6, headRot: 4 * sl,
    face: { name: 'sad', eyes: { look: [0.7, 0], upper: 0.5 } } }, { arms: false });
  let o = SS.classroom.compose(t, classOpts, kids, '', cam);
  o += speech(330, 250, 'CORRECT!', pop(t, b.correct, 0.25), { size: 84, tail: -1, rot: -4 });
  // a gold star sticker flies onto the neighbour
  const sk = seg(t, b.correct + 0.25, b.correct + 0.6);
  if (sk > 0) {
    const [nx, ny] = toScr(cam, 1440, 1080 - 0.5 * 700 - 30 * nb);
    const sx = lerp(80, nx, ease.out(sk)), sy = lerp(80, ny - 40, ease.out(sk)) - 200 * Math.sin(sk * Math.PI);
    o += S.g(S.path(E.starD(60), ol('#FFD21F', 6)) + T('56', 0, 16, 40, '#1E1A2E'), tf(sx, sy, 1, sk * 360));
  }
  o += K.bang('clap', 520, 380, pop(t, b.correct + 0.2, 0.2), 60, -8, '#FFFFFF') + K.bang('clap', 1400, 330, pop(t, b.correct + 0.35, 0.2), 60, 8, '#FFFFFF');
  return o;
}

// ================================================================= GAMES (his room, the Mega Obby)
// ---- 12. "But in games?" — his room, headphones, screaming happily in the lava light
function shGames(t) {
  const Lf = H.deskFace.layers(t, { time: 'day', glow: 'orange', glowK: 1, flicker: 0.8 });
  const u = seg(t, C.games, C.obby);
  const cam = shakeAll({ zoom: lerp(1.0, 1.18, ease.out(u)), x: 0, y: lerp(0, -40, u) }, t, [[b.games, 0.5, 6]]);
  const sp = H.SPOTS.deskFace.hero;
  const hero = actor('you', t, { x: sp.x, y: sp.seat + 306 * sp.s, s: sp.s, headphones: true, volume: false, ...typing(t, 1, 24), bodyY: 8 * Math.abs(Math.sin(t * 9)), headRot: 5 * Math.sin(t * 7),
    face: { name: 'excited', mouth: 'scream', eyes: { type: 'star' } } }, { arms: false });
  let o = view(cam, Lf.bg, 0.8) + view(cam, Lf.mid + hero + Lf.front + Lf.light);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FF7A2A', opacity: f(0.06 + 0.05 * Math.sin(t * 17)) });
  o += K.bang('WOOO!', 1450, 250, pop(t, C.games + 0.2, 0.2), 120, 8, '#FFE14D');
  return o;
}

// ---- 13 + 14. inside the Mega Obby: fearless leap + flip; then the jump, the lava, the respawn
const OB = H.SPOTS.obbyWorld;
const OBS = 0.4;
// the avatar's path: [t, x, y(feet), mode] keyframes resolved below
function obbyHero(t) {
  // segment 1 (C.obby): run on cp0 -> leap with a flip -> land on platform 1
  const r0 = C.obby, j0 = C.obby + 0.45, l0 = C.obby2 - 0.12;
  // segment 2 (C.obby2): run -> leap over the kill platform -> land on platform 3 -> run -> jump short -> lava
  const r1 = C.obby2, j1 = C.obby2 + 0.3, l1 = j1 + 0.75, j2 = b.fall - 0.55, tLava = b.fall + 0.1;
  const P1 = OB.platforms[1], P3 = OB.platforms[3];
  if (t < j0) { const x = lerp(260, 560, seg(t, r0 - 0.3, j0)); return { x, y: 748, mode: 'run' }; }
  if (t < l0) {
    const k = seg(t, j0, l0);
    return { x: lerp(560, P1.x - 30, k), y: lerp(748, P1.y, k) - 330 * Math.sin(k * Math.PI), rot: -360 * ease.inOut(seg(k, 0.15, 0.85)), mode: 'air' };
  }
  if (t < r1) return { x: P1.x - 30, y: P1.y, mode: 'land', landT: l0 };
  if (t < j1) return { x: lerp(P1.x - 30, P1.x1 - 10, seg(t, r1, j1)), y: P1.y, mode: 'run' };
  if (t < l1) { const k = seg(t, j1, l1); return { x: lerp(P1.x1 - 10, P3.x0 + 40, k), y: lerp(P1.y, P3.y, k) - 250 * Math.sin(k * Math.PI), mode: 'air', rot: -20 * Math.sin(k * Math.PI) }; }
  if (t < j2) return { x: lerp(P3.x0 + 40, P3.x1 - 10, seg(t, l1 + 0.05, j2)), y: P3.y, mode: t < l1 + 0.12 ? 'land' : 'run', landT: l1 };
  if (t < tLava) {
    // jumps for platform 4... comes up short: smacks into its side (BONK) and drops into the lava
    const tWall = lerp(j2, tLava, 0.5);
    if (t < tWall) { const k = seg(t, j2, tWall); return { x: lerp(P3.x1 - 10, 1848, k), y: lerp(P3.y, 640, k) - 120 * Math.sin(k * Math.PI), mode: 'air', rot: 10 * k }; }
    const k = seg(t, tWall, tLava);
    return { x: 1848 - 40 * k, y: lerp(640, 950, k * k), mode: 'air', rot: 10 + 50 * k, fallK: 0.6 + 0.4 * k, wallT: tWall };
  }
  return { x: 1850, y: 950, mode: 'gone', tLava };
}
function obbyPose(t, h) {
  if (h.mode === 'run') return { view: 'side', flip: true, ...AC.run(t * 16, 1.1), lean: 10 };
  if (h.mode === 'air') return { view: 'side', flip: true, armL: 150, armR: 120, legL: 30, legR: -20, kneeL: 40, kneeR: 30, rot: h.rot || 0, lift: 0 };
  if (h.mode === 'land') return { view: 'side', flip: true, ...boing(t, h.landT, 0.3), armL: 40, armR: 40 };
  return {};
}
function obbyFallsHUD(t, tLava) {
  const fell = t >= tLava;
  return R.counterHUD({ x: 50, y: 70, s: 0.9, t, label: 'FALLS:', value: fell ? 4791 : 4790, bump: seg(t, tLava, tLava + 0.45), k: pop(t, C.obby + 0.1, 0.3) });
}
function shObby(t) {
  const h = obbyHero(t);
  const cam = { zoom: lerp(1.0, 1.12, seg(t, C.obby, C.obby2)), x: clamp(h.x - 760, -200, 6000), y: -60 + Math.min(0, (h.y - 748) * 0.4) };
  const Lo = H.obbyWorld.layers(t, cam, { stage: 997 });
  const hero = actor('you', t, { x: h.x, y: h.y, s: OBS, ...obbyPose(t, h), face: { name: 'excited', mouth: 'bigGrin' } }, { arms: false });
  let o = Lo.bg + Lo.mid + view(cam, hero) + Lo.fg + Lo.light;
  o += K.bang('FEARLESS!', 1420, 380, pop(t, b.fearless + 0.05, 0.25), 130, -6, '#FFE14D');
  o += obbyFallsHUD(t, b.fall + 0.1);
  return o;
}
function shObby2(t) {
  const tLava = b.fall + 0.1;
  const h = obbyHero(t);
  const u = t - tLava;
  const SP = { x: 260, y: 748, s: OBS };
  const popAt = b.respawn - tLava;
  const q = R.respawnSeq(u, { preset: 'corner', fail: { x: 1850, y: 950, s: OBS, dir: [0.2, -1], floorY: 950 }, spawn: SP, t,
    timing: { pop: popAt, ov: [0.08, Math.max(0.4, popAt - 0.14), 'corner'] }, overlay: { x: 1880, y: 70 } });
  const atSpawn = u >= 0 && q.view === 'spawn';
  let cam;
  if (!atSpawn) cam = { zoom: 0.95, x: clamp(Math.min(h.x, 1850) - 880, -200, 6000), y: -40 + Math.min(0, (h.y - 700) * 0.5) * (u < 0 ? 1 : 0) + (u > 0 ? 40 * seg(u, 0, 0.3) : 0) };
  else cam = { zoom: 1.25, x: SP.x - 760, y: 130 };
  shakeAll(cam, t, [[tLava, 0.35, 16]]);
  const Lo = H.obbyWorld.layers(t, cam, { stage: 997 });
  let w = '';
  if (u < 0) w += actor('you', t, { x: h.x, y: h.y, s: OBS, ...obbyPose(t, h), face: h.fallK > 0.55 ? { name: 'scream' } : { name: 'excited', mouth: 'bigGrin' } }, { arms: false });
  // lava splash
  if (u >= 0 && u < 0.9) {
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (hash(i * 3.3) - 0.5) * 1.6, v = 500 + 400 * hash(i * 1.9);
      const px = 1850 + Math.cos(a) * v * u, py = 950 + Math.sin(a) * v * u + 1200 * u * u;
      if (py < 990) w += S.circle(px, py, 14 + 10 * hash(i), ol('#FF8A2A', 4));
    }
  }
  w += q.under;
  if (q.heroAt === 'spawn') {
    const hop = seg(u, popAt + 0.45, popAt + 0.85);
    w += actor('you', t, { ...SP, ...q.pose, lift: (q.pose.lift || 0) + 90 * Math.sin(hop * Math.PI), armL: hop > 0 ? 150 : 20, armR: hop > 0 ? 150 : 20, face: { name: 'joy' } }, { arms: false });
  }
  w += q.over;
  let o = Lo.bg + Lo.mid + view(cam, w) + Lo.fg + Lo.light;
  if (u >= 0 && u < 0.5) o += K.bang('SPLASH!', 1500, 520, pop(t, tLava, 0.2), 110, 6, '#FF8A2A');
  if (h.wallT && u < 0) { const [wx, wy] = toScr(cam, 1870, 600); o += K.C.burst(wx, wy, seg(t, h.wallT, h.wallT + 0.4), '#FFE14D') + K.bang('BONK', wx + 80, wy - 120, pop(t, h.wallT, 0.15), 70, 8, '#FFFFFF'); }
  o += q.screen;
  if (q.heroAt === 'spawn') o += K.bang('AGAIN!', 1350, 600, pop(t, b.respawn + 0.35, 0.22), 120, -6, '#3DDC84');
  o += obbyFallsHUD(t, tLava);
  return o;
}

// ================================================================= KITCHEN (Monday breakfast)
const KS = H.SPOTS.kitchen;
const SEAT = { bea: KS.seats[0], you: KS.seats[1], par: KS.seats[2] };
const BOWL = { x: 1230, y: 560, s: 0.2 };   // Gary's bowl on the counter (agreed with SC06/SC11)
function bowl(t, gary = {}, o = {}) { return X.fishbowl({ ...BOWL, t, line: 17, gary: { yaw: 90, ...gary }, ...o }); }
function kitchen(t, cam, behind, front, opts = {}) {
  const Lk = H.kitchen.layers(t, { time: 'morning', ...opts });
  return room(Lk, cam, behind, front, 0.8);
}
// Dad behind the island; flip = progress of a pancake flip (pancake drawn separately), pose overrides
function dadAt(t, pose = {}, act = {}) {
  const p = { x: KS.dad.x, y: KS.dad.y, s: KS.dad.s, armR: 56, armL: 30, ...breathe(t, 1), ...pose };
  const h = handAt(DSG.dad, p, 1);
  const rot = pose.spatRot ?? 14;
  p.props = [...(p.props || []), { svg: X.spatula({ x: h[0], y: h[1], s: 0.8, rot, pancake: pose.pancake || false }), layer: 'front' }];
  delete p.pancake;
  return actor('dad', t, p, { arms: false, ...act });
}
// a pancake flipping out of the pan: k 0..1
function panFlip(k, x = KS.pan.x, y = KS.pan.y - 6, hgt = 320, s = 0.5) {
  if (k <= 0 || k >= 1) return X.pancake(x, y, s, 0, 0);
  return X.pancake(x + 150 * Math.sin(k * Math.PI * 0.5), y - hgt * Math.sin(k * Math.PI), s, 0, k);
}
const flipK = (t, period = 1.6, off = 0) => { const u = ((t - off) % period + period) % period; return seg(u, 0, 0.62); };
const SEAT_LIFT = { you: -42, bea: -22, par: 0 };   // sit up a bit so the faces clear the plates
function seated(t, who, pose = {}, act = {}) {
  const st = SEAT[who];
  const key = who === 'par' ? 'dad' : who;
  return actor(key, t, { x: st.x, y: st.y + SEAT_LIFT[who], s: st.s, ...breathe(t, st.x), ...pose }, act);
}

// ---- 15. "Real life does not have that feature." — hopping on the spot in the kitchen
function hopAt(t, t0, period = 0.62) {
  if (t < t0) return { lift: 0, sq: 0, n: 0 };
  const u = (t - t0) / period, n = Math.floor(u), ph = u - n;
  const lift = 150 * Math.sin(Math.min(1, ph / 0.7) * Math.PI) * (ph < 0.7 ? 1 : 0);
  const sq = ph >= 0.7 ? Math.sin(((ph - 0.7) / 0.3) * Math.PI) : 0;
  return { lift, sq, n, ph };
}
function shHop(t) {
  const u = seg(t, C.hop, C.checked);
  const cam = { zoom: lerp(1.0, 1.1, u), x: 0, y: lerp(0, 40, u) };
  const hp = hopAt(t, C.hop + 0.15);
  const hero = actor('you', t, { x: 980, y: 990, s: 0.5, lift: hp.lift, sy: 1 - 0.14 * hp.sq, sx: 1 + 0.1 * hp.sq, armL: 40 + 30 * Math.sin(hp.ph * Math.PI), armR: 40 + 30 * Math.sin(hp.ph * Math.PI),
    headRot: hp.lift > 20 ? 0 : 8, face: { name: hp.lift > 20 ? 'determined' : 'confused', eyes: { look: [0, 0.9] } } }, { arms: false });
  // on each landing: a dashed "checkpoint?" ring flickers under his feet and fizzles
  let ring = '';
  if (hp.sq > 0) ring = S.ellipse(980, 990, 190 * (1 + 0.2 * hp.sq), 40, { fill: 'none', stroke: '#9AA6C0', 'stroke-width': 6, 'stroke-dasharray': '18 14', opacity: f(0.8 * hp.sq) }) + K.F.sparkle(1150, 930, 18 * hp.sq, '#C9D2DC');
  const fk = flipK(t, 1.5, C.hop);
  const behind = dadAt(t, { armR: 56 + 40 * bump(fk, 0, 0.3), face: { name: 'happy', eyes: { look: [0.8, 0.3] } } }) + panFlip(fk) + bowl(t, { yaw: 30 }) +
    seated(t, 'bea', { spoon: true, armR: 30, face: { name: 'deadpan', eyes: { look: [-0.9, 0.4] } } }, { arms: false });
  let o = kitchen(t, cam, behind, ring + hero);
  if (hp.sq > 0.2) o += K.bang('?', 1180, 330, 1, 110, 8, '#FFFFFF');
  return o;
}
// ---- 16. "You checked." — close: CHECKPOINT NOT FOUND
function shChecked(t) {
  const u = seg(t, C.checked, C.dad);
  const cam = { zoom: lerp(1.4, 1.5, u), x: 1000 - 960, y: 700 - 540 };
  const tLand = C.checked + 0.38;
  const hk = seg(t, C.checked, tLand);
  const lift = 90 * Math.sin(Math.min(1, hk) * Math.PI) * (t < tLand ? 1 : 0);
  const hero = actor('you', t, { x: 980, y: 990, s: 0.5, lift, ...boing(t, tLand, 0.12), armL: 30, armR: 30, headRot: t > tLand + 0.2 ? 10 : 0,
    face: t > tLand + 0.15 ? { name: 'deadpan', eyes: { look: [0, 0.9], upper: 0.4 } } : { name: 'determined', eyes: { look: [0, 0.9] } } }, { arms: false });
  let o = kitchen(t, cam, '', hero, { steam: false });
  o += E.notFound(1340, 250, pop(t, b.checked + 0.05, 0.28)) + K.bang('?', 1180, 380, pop(t, b.checked + 0.3, 0.2), 120, 10, '#FFFFFF');
  return o;
}

// ---- 17. "At home, there's Dad." — the flip + DAD tag
function shDad(t) {
  const u = seg(t, C.dad, C.mornings);
  const cam = { zoom: lerp(1.45, 1.75, ease.inOut(u)), x: 700 - 960, y: 520 - 540 };
  const fl = seg(t, C.dad + 0.15, C.dad + 0.15 + 1.05);
  const behind = dadAt(t, { armR: 56 + 60 * bump(fl, 0, 0.25), lean: -3 * bump(fl, 0.4, 1), face: { name: 'joy', eyes: { look: [0.1, -0.8] } } }) + panFlip(fl, KS.pan.x, KS.pan.y - 6, 420, 0.55);
  let o = kitchen(t, cam, behind, '');
  o += nameCard(t, b.dad - 0.02, 1420, 250, 'DAD', 'FLIP MASTER · PUN MASTER', '#E8823C', { ax: 1010, ay: 420 });
  return o;
}

// ---- 18. "He makes pancakes every morning..." — MON / TUE / WED, the same flip
function shMornings(t) {
  const ts = [b.makes - 0.1, b.pancakes - 0.1, b.every - 0.1];
  const days = ['MON', 'TUE', 'WED'];
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#1E1A2E' });
  const sync = seg(t, b.morning - 0.1, b.morning + 0.9);
  ts.forEach((t0, i) => {
    const k = ease.out(seg(t, t0, t0 + 0.22));
    if (k <= 0) return;
    const x0 = i * 640;
    const cam = { zoom: 1.35, x: 650 - 960 - (x0 + 320 - 960) / 1.35, y: 480 - 540 };
    const fl = sync > 0 ? sync : seg(t, t0 + 0.05, t0 + 1.0);
    const behind = dadAt(t, { armR: 56 + 60 * bump(fl, 0, 0.25), face: { name: 'joy' } }, { seed: 0 }) + panFlip(fl, KS.pan.x, KS.pan.y - 6, 300, 0.55);
    const Lk = H.kitchen.layers(t, { time: 'morning', birds: false, steam: false });
    let p = view(cam, Lk.mid + behind + Lk.front + Lk.light);
    p += S.g(S.rect(-80, -40, 160, 80, 20, ol('#FFFFFF', 6)) + S.rect(-80, -40, 160, 30, 14, { fill: '#E8453C' }) + T(days[i], 0, 30, 42, '#1E1A2E'), tf(x0 + 320, 110, 1, (i - 1) * 4));
    o += clipTo(x0 + (i ? 8 : 0), 0, 640 - (i ? 8 : 0), 1080, S.g(p, `translate(0 ${f((1 - k) * -1100)})`));
  });
  return o;
}

// ---- 19. "...and the same joke every morning." — the table, SAME JOKE TOLD: 1,461
function shSame(t) {
  const u = seg(t, C.same, C.why);
  const cam = { zoom: lerp(1.85, 1.95, u), x: 1400 - 960, y: 640 - 540 };
  const behind = bowl(t, { yaw: 0, lids: 0.6 }) + seated(t, 'bea', { spoon: true, armR: 30, headRot: -4, face: { name: 'deadpan', eyes: { look: [0, 0], upper: 0.55 } } }, { arms: false }) +
    seated(t, 'you', { armL: 24, armR: 24, headRot: 6, face: { name: 'deadpan', eyes: { look: [0, 0], upper: 0.6 } } }, { arms: false });
  let o = kitchen(t, cam, behind, '');
  o += R.counterHUD({ x: 960, y: 150, anchor: 'center', s: 1.1, t, label: 'SAME JOKE TOLD:', value: 1461, theme: 'gold', icon: 'star', roll: seg(t, b.same - 0.1, b.joke + 0.6), from: 1, k: pop(t, b.same - 0.25, 0.3), bump: seg(t, b.joke + 0.6, b.joke + 1.05) });
  return o;
}

// ---- 20. Dad: "Why did the pancake go to the doctor?" — spatula pointed at the camera
function shWhy(t) {
  const u = seg(t, C.why, C.along);
  const cam = { zoom: lerp(2.1, 2.25, u), x: 680 - 960, y: 470 - 540 };
  const behind = dadAt(t, { armR: 78, spatRot: 60, pancake: true, turn: 0.15, face: { name: 'smug', eyes: { look: [0, 0] } } }, { energy: 1.2 });
  return kitchen(t, cam, behind, '', { steam: true });
}
// ---- 21. the family mouths along (deadpan) — even Gary
function shAlong(t) {
  const u = seg(t, C.along, C.because);
  const cam = { zoom: lerp(1.75, 1.8, u), x: 1380 - 960, y: 580 - 540 };
  const vis = K.V.viseme('DAD', t);
  const mouth = vis || 'line';
  const gm = vis && vis !== 'X' && vis !== 'A' ? 'open' : 'line';
  const behind = bowl(t, { yaw: 0, mouth: gm, lids: 0.6 }) +
    seated(t, 'bea', { spoon: true, armR: 26, face: { name: 'deadpan', mouth, eyes: { look: [0, 0], upper: 0.55 } } }, { arms: false }) +
    seated(t, 'you', { armL: 24, armR: 24, face: { name: 'deadpan', mouth, eyes: { look: [0, 0], upper: 0.6 } } }, { arms: false });
  return kitchen(t, cam, behind, '');
}
// ---- 22. "Because it was feeling a little..." — Dad leans in, push-in
function shBecause(t) {
  const u = ease.in(seg(t, C.because, C.flat));
  const cam = { zoom: lerp(1.6, 2.6, u), x: 660 - 960, y: lerp(470, 430, u) - 540 };
  const behind = dadAt(t, { armR: lerp(60, 110, u), spatRot: 40, pancake: true, lean: 6 * u, headRot: -4 * u, face: { name: 'happy', eyes: { look: [0, 0] } } }, { energy: 0.8 });
  let o = kitchen(t, cam, behind, '');
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FFB060', opacity: f(0.08 * u) });
  return o;
}
// ---- 23. FLAT! — smash-zoom, the pancake splats flat on the island, BA-DUM TSS
function shFlat(t) {
  const tf0 = b.flat;
  const cam = shakeAll({ zoom: 1.9, x: 640 - 960, y: 440 - 540 }, t, [[tf0, 0.3, 18]]);
  const slam = seg(t, tf0 - 0.05, tf0 + 0.1);
  const laugh = t > tf0 + 0.2 ? Math.abs(Math.sin(t * 14)) : 0;
  let behind = dadAt(t, { armR: lerp(110, 40, ease.in(slam)), spatRot: lerp(40, 100, slam), lean: lerp(6, 14, slam) - 4 * laugh, bodyY: 8 * laugh, face: t > tf0 + 0.2 ? { name: 'joy' } : { name: 'excited' } }, { energy: 1.4 });
  // the pancake: squashed paper-thin on the island top
  let fr = '';
  if (slam > 0.6) fr += S.ellipse(520, 636, 120 + 30 * seg(t, tf0, tf0 + 0.15), 10, ol('#E8A64A', 5)) + K.C.dust(460, 630, tf0 + 0.02, t);
  let o = kitchen(t, cam, behind, fr);
  o += zoomLines(760, 470, 1 - seg(t, tf0 + 0.2, tf0 + 0.6), t, '#FFFFFF');
  o += K.bang('FLAT!', 420, 300, pop(t, tf0, 0.18), 190, -8, '#FFE14D');
  o += drumAndRim(t);
  return o + smash(t, tf0, 0.1, 0.7);
}
function drumAndRim(t) {
  const hitAge = t - b.rim;
  const k = pop(t, b.rim - 0.4, 0.25) * (1 - seg(t, b.rim + 1.3, b.rim + 1.55));
  if (k <= 0.01) return '';
  return E.drumKit(1690, 830, 0.8, t, k, hitAge) + K.bang('BA-DUM TSS!', 1640, 650, pop(t, b.rim, 0.2) * (1 - seg(t, b.rim + 1.3, b.rim + 1.55)), 84, -6, '#FFE14D');
}

// ---- 24. "There's your little sister, Bea." — the table (deadpan after the joke), push to Bea + BEA tag
function shBea(t) {
  const u = ease.inOut(seg(t, C.bea + 0.4, b.beaW));
  const cam = { zoom: lerp(1.55, 2.4, u), x: lerp(1400, 1290, u) - 960, y: lerp(590, 640, u) - 540 };
  const behind = bowl(t, { yaw: 0, lids: 0.6 }) + seated(t, 'bea', { spoon: true, armR: 26, face: { name: 'deadpan', eyes: { look: [0, 0], upper: 0.5 } } }, { arms: false }) +
    seated(t, 'you', { armL: 24, armR: 24, face: { name: 'deadpan', eyes: { look: [0, 0], upper: 0.6 } } }, { arms: false });
  let o = kitchen(t, cam, behind, '');
  o += K.bang('chirp...', 360, 260, pop(t, C.bea + 0.1, 0.2) * (1 - seg(t, b.beaW - 0.5, b.beaW - 0.3)), 56, -6, '#B8F5D0');
  o += drumAndRim(t);
  o += nameCard(t, b.beaW - 0.02, 470, 280, 'BEA', 'LITTLE SISTER · AGE 6', '#FF6FA8', { ax: 850, ay: 520 });
  return o;
}
// ---- 25. "She's six... and she has never told a lie in her life." — Bea close: unblinking, LIES TOLD: 0
function shSix(t) {
  const u = seg(t, C.six, C.hair);
  const cam = { zoom: lerp(3.2, 3.6, u), x: 1300 - 960, y: 650 - 540 };
  const behind = bowl(t, { yaw: 30 }) + seated(t, 'bea', { spoon: true, armR: 26, volume: false, headRot: 4 * Math.sin(t * 1.5),
    face: { name: 'neutral', eyes: { pupil: lerp(1.2, 1.7, u), look: [0, 0], sparkle: true }, blink: 0 } }, { arms: false });
  let o = kitchen(t, cam, behind, '');
  o += R.counterHUD({ x: 960, y: 140, anchor: 'center', s: 1.1, t, label: 'LIES TOLD:', value: 0, theme: 'gold', icon: 'star', k: pop(t, b.neverB, 0.3), bump: seg(t, b.lie, b.lie + 0.45) });
  o += S.g(S.rect(-170, -46, 340, 92, 20, { fill: 'none', stroke: '#E8243C', 'stroke-width': 9 }) + T('100% HONEST', 0, 18, 50, '#E8243C'), tf(1480, 760, pop(t, b.lie + 0.35, 0.2) * 1.4, -10));
  return o;
}
// ---- 26. "Your hair looks like a mushroom." — Bea turns to him, points the spoon
function shHair(t) {
  const u = seg(t, C.hair, C.mush);
  const cam = { zoom: lerp(2.0, 2.15, u), x: 1400 - 960, y: 620 - 540 };
  const turnK = ease.out(seg(t, C.hair, C.hair + 0.3));
  const behind = bowl(t, { yaw: 60 }) + seated(t, 'bea', { spoon: true, armR: lerp(26, 70, turnK), turn: 0.5 * turnK, face: { name: 'neutral', eyes: { look: [0.9, -0.2] } } }, { arms: false }) +
    seated(t, 'you', { armL: 24, armR: 24, turn: -0.3, face: { name: t > b.hairW ? 'shocked' : 'neutral', eyes: { look: [-0.9, 0] }, fx: [] } }, { arms: false });
  return kitchen(t, cam, behind, '');
}
// ---- 27 + 28. the hair = a mushroom ... a SAD mushroom
function shMush(t) {
  const sad = t >= C.sad;
  const sk = ease.inOut(seg(t, b.sadW - 0.05, b.sadW + 0.5));
  const cam = sad ? shakeAll({ zoom: lerp(1.0, 1.12, seg(t, C.sad, C.gary)) }, t, [[b.sadW, 0.3, 10]]) : { zoom: lerp(1.0, 1.06, seg(t, C.mush, C.sad)) };
  let w = S.rect(-200, -200, 2320, 1480, 0, { fill: sad ? '#8A9AB8' : '#FFD9A8' }) + K.rays(960, 540, 18, 1600, '#FFFFFF', sad ? 0.05 : 0.16, t * 10);
  // the hero's head (close-up, hair!) left, the mushroom right
  w += actor('you', t, { x: 560, y: faceAt(540, 1.25), s: 1.25, volume: false, headRot: sad ? -8 * sk : 0, armL: 10, armR: 10,
    face: sad ? { name: 'sad', eyes: { look: [0.3, 0.5] } } : { name: 'shocked', eyes: { look: [0.6, -0.6] }, fx: [] } }, { arms: false });
  const mk = pop(t, b.mushroom - 0.02, 0.3);
  if (mk > 0.01) w += E.mushroom(1380, 980, 1.05 * mk, { sad: sk, rot: sad ? 6 * sk : 0 });
  w += T('=', 970, 560, 220, '#FFFFFF', { stroke: LINE, 'stroke-width': 14, 'paint-order': 'stroke', opacity: f(mk) });
  if (sad) {
    // a tiny rain cloud over both
    const ck = pop(t, b.sadW + 0.1, 0.3);
    w += S.g(H.cloud(0, 0, 0.9, undefined, '#9AA0AE', '#7E8596'), tf(960, 150, ck));
    let dr = '';
    for (let i = 0; i < 16; i++) { const x = 700 + hash(i) * 520, y = 200 + ((t * 900 + hash(i * 3) * 300) % 300); dr += `M${f(x)} ${f(y)} l-6 26 `; }
    if (ck > 0.5) w += S.path(dr, ln(6, '#4A7ACF'));
  }
  let o = view(cam, w);
  if (!sad) o += K.bang('MUSHROOM.', 1420, 150, pop(t, b.mushroom + 0.05, 0.2), 90, 6, '#FFFFFF');
  else o += K.bang('SAD.', 1500, 160, pop(t, b.sadW + 0.02, 0.2), 130, -8, '#9AB0D0');
  return o + smash(t, C.mush, 0.1, 0.6) + smash(t, C.sad, 0.1, 0.5);
}

// ---- 29. "And there's Gary. Gary is a goldfish." + GARY tag
function shGary(t) {
  const u = seg(t, C.gary, C.seen);
  const cam = { zoom: lerp(4.2, 4.8, ease.inOut(u)), x: BOWL.x - 960, y: BOWL.y - 54 - 540 };
  const turn = ease.inOut(seg(t, b.goldfish - 0.3, b.goldfish + 0.3));
  const swim = t < b.goldfish - 0.3 ? Math.sin(t * 1.2) * 16 : 0;
  const behind = bowl(t, { yaw: lerp(90, 0, turn), x: -40 + swim, lids: 0.46 + 0.1 * turn, look: [0, 0] });
  let o = kitchen(t, cam, behind, '', { steam: false });
  o += nameCard(t, b.gary - 0.02, 1430, 260, 'GARY', 'GOLDFISH', '#FF8A2A', { ax: 1120, ay: 470 });
  return o;
}
// ---- 30. "Gary has seen things." — extreme close-up, the thousand-yard stare, a slow blink
function shSeen(t) {
  const u = seg(t, C.seen, C.mom);
  const blink = bump(t, b.things + 0.05, b.things + 0.75);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#0E2A3A' });
  const z = lerp(1.0, 1.18, ease.in(u));
  let g = S.rect(-200, -200, 2320, 1480, 0, { fill: '#4FA8C8' }) + S.rect(-200, 800, 2320, 600, 0, { fill: '#3A8AAA' });
  for (let i = 0; i < 9; i++) { const by = (1200 - ((t * 120 + hash(i) * 1200) % 1300)); g += S.circle(200 + hash(i * 3) * 1500, by, 10 + 14 * hash(i * 5), { fill: 'none', stroke: '#DFF6FF', 'stroke-width': 5, opacity: 0.6 }); }
  g += X.gary({ x: 960, y: 560, s: 3.4, t, turn: 'front', yaw: 0, lids: 0.5, blink, look: [0.15, 0.05] });
  o += zoomAbout(g, 960, 520, z);
  o += H.darkRing(960, 540, 720, 460, '#020812', 0.75);
  return o;
}

// ---- 31. Mom rushes through behind the table: "Bye, loves! Long shift!" — kisses + MOM tag
function shMom(t) {
  const cam = { zoom: 1.55, x: 1360 - 960, y: 600 - 540 };
  // path: runs in from the left behind the table, stops at Bea (kiss), at the hero (kiss), runs out right to the back door
  const tK1 = b.loves - 0.05, tK2 = b.long - 0.05, tOut = b.shift;
  let mx, lean = 0, run = true;
  if (t < tK1) mx = lerp(760, 1250, ease.out(seg(t, C.mom, tK1)));
  else if (t < tK1 + 0.3) { mx = 1250; run = false; lean = bump(t, tK1, tK1 + 0.3); }
  else if (t < tK2) mx = lerp(1250, 1440, seg(t, tK1 + 0.3, tK2));
  else if (t < tK2 + 0.3) { mx = 1440; run = false; lean = bump(t, tK2, tK2 + 0.3); }
  else mx = lerp(1440, 2200, ease.in(seg(t, tK2 + 0.3, tOut + 0.7)));
  const mom = actor('mom', t, { x: mx, y: 835, s: 0.4, view: 'side', flip: true, thermos: true, ...(run ? AC.run(t * 18, 1) : { armL: 30, armR: 20 }), lean: run ? 12 : 30 * lean, headRot: 20 * lean, face: { name: 'happy' } }, { arms: false });
  const kiss1 = t > tK1 + 0.15, kiss2 = t > tK2 + 0.15;
  const behind = bowl(t, { yaw: -60 }) + mom + seated(t, 'bea', { spoon: true, armR: 26, face: kiss1 ? { name: 'cute' } : { name: 'neutral', eyes: { look: [-0.8, 0] } } }, { arms: false }) +
    seated(t, 'you', { armL: 24, armR: 24, face: kiss2 ? { name: 'happy', fx: ['blush'] } : { name: 'neutral', eyes: { look: [-0.6, 0] } } }, { arms: false });
  const heart = (x, y, k, op) => S.g(S.path('M0 -10 c-10 -20 -40 -10 -30 12 l30 28 l30 -28 c10 -22 -20 -32 -30 -12 Z', ol('#FF4F8B', 5)), tf(x, y, k), { opacity: f(op) });
  let fx = '';
  if (kiss1) fx += heart(1290, 560 - 80 * seg(t, tK1 + 0.15, tK1 + 1.2), pop(t, tK1 + 0.15, 0.2), 1 - seg(t, tK1 + 0.9, tK1 + 1.2));
  if (kiss2) fx += heart(1480, 500 - 80 * seg(t, tK2 + 0.15, tK2 + 1.2), pop(t, tK2 + 0.15, 0.2), 1 - seg(t, tK2 + 0.9, tK2 + 1.2));
  if (run) fx += K.C.speedLines(mx - 420, mx - 160, 620, 5, 3, '#FFFFFF', 240);
  let o = kitchen(t, cam, behind, fx, { coat: t < tK1 });
  o += K.bang('MWAH!', 1060, 300, pop(t, tK1 + 0.12, 0.18) * (1 - seg(t, tK1 + 0.5, tK1 + 0.7)), 70, -8, '#FF6FA8') + K.bang('MWAH!', 1500, 250, pop(t, tK2 + 0.12, 0.18) * (1 - seg(t, tK2 + 0.5, tK2 + 0.7)), 70, 8, '#FF6FA8');
  o += nameCard(t, b.bye + 0.05, 470, 220, 'MOM', 'ER NURSE · ALWAYS ON SHIFT', '#2FB3A0', { tOut: C.remember - 0.15, rot: -4 });
  return o;
}
// ---- 32. "Remember, mistakes are how we learn!" — at the back door, finger up, then gone
function shRemember(t) {
  const u = seg(t, C.remember, C.mumble);
  const cam = { zoom: lerp(1.7, 1.8, u), x: 1690 - 960, y: 490 - 540 };
  const gone = t > b.momOut;
  const ox = gone ? lerp(1720, 2200, ease.in(seg(t, b.momOut, b.momOut + 0.3))) : 1720;
  const ex = H.SPOTS.kitchen.backDoor.exit;
  const mom = actor('mom', t, { x: ox, y: ex.y + 60, s: 0.48, thermos: true, turn: -0.35, armR: 155 + 6 * Math.sin(t * 8), armL: 20, face: { name: 'happy' } }, { arms: false });
  const behind = mom;
  let o = kitchen(t, cam, behind, '', { coat: false });
  o += K.F.sparkle(1840, 330, 40 * bump(t, b.learn, b.learn + 0.6), '#FFFFFF');
  if (gone) o += K.bang('SLAM!', 1100, 300, pop(t, b.momOut + 0.12, 0.18), 90, -6, '#FFFFFF');
  return o;
}
// ---- 33. "Mistakes are how we get laughed at." — the hero mumbles into his pancakes
function shMumble(t) {
  const u = seg(t, C.mumble, C.ivy);
  const cam = { zoom: lerp(2.5, 2.7, u), x: 1490 - 960, y: 620 - 540 };
  const behind = seated(t, 'bea', { spoon: true, armR: 26, face: { name: 'neutral', eyes: { look: [0.9, 0] } } }, { arms: false }) +
    seated(t, 'you', { armL: 34, armR: 34 + 8 * Math.sin(t * 6), headRot: 8, bodyY: 10, volume: false, face: { name: 'sad', eyes: { look: [0, 0.8] } } }, { arms: false, energy: 0.3 });
  let o = kitchen(t, cam, behind, '', { coat: false });
  o += E.haha(t, 960, 420, seg(t, b.laughed - 0.2, b.laughed + 0.3));
  return o;
}

// ================================================================= IVY'S LAB (the garage)
const WS = H.SPOTS.workshop;
function workshop(t, cam, behind, front, opts = {}) {
  const Lw = H.workshop.layers(t, { time: 'day', ...opts });
  return room(Lw, cam, behind, front, 0.7);
}
function sparksAt(x, y, t, n = 8, seed = 1) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const ph = (t * 3 + hash(i * 3.1 + seed)) % 1, a = -Math.PI / 2 + (hash(i * 7.7 + seed) - 0.5) * 2.4, v = 120 + 160 * hash(i * 1.3 + seed);
    const px = x + Math.cos(a) * v * ph, py = y + Math.sin(a) * v * ph + 300 * ph * ph;
    d += `M${f(px)} ${f(py)} l${f(Math.cos(a) * 18)} ${f(Math.sin(a) * 18)} `;
  }
  return S.path(d, ln(6, '#FFE14D')) + S.circle(x, y, 18, { fill: '#FFFFFF', opacity: 0.8 });
}
// ---- 34. "And then there's Ivy." — goggles down, sparks + IVY tag
function shIvy(t) {
  const u = seg(t, C.ivy, C.kinder);
  const cam = { zoom: lerp(1.6, 1.8, ease.inOut(u)), x: lerp(900, 960, u) - 960, y: 630 - 540 };
  const bt = WS.behindTable;
  const ivy = actor('ivy', t, { x: bt.x, y: bt.y, s: bt.s, goggles: 'down', armL: 40, armR: 46 + 4 * Math.sin(t * 30), headRot: 6, face: { name: 'determined', eyes: { look: [0, 0.8] } } }, { arms: false });
  const table = X.rocketSneakers({ x: 900, y: 752, s: 0.55, t, flame: 0 }) + sparksAt(1000, 740, t, 8);
  let o = workshop(t, cam, ivy, table, { boom: 0 });
  o += nameCard(t, b.ivyW - 0.02, 1450, 250, 'IVY', 'INVENTOR · BEST FRIEND', '#2E9E4A', { ax: 1080, ay: 430 });
  return o;
}
// ---- 35. "Your best friend since kindergarten." — the polaroid
function shKinder(t) {
  const u = seg(t, C.kinder, C.builds);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#C98A52' }) + S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s02Cork)' });
  // two other faded photos behind
  o += S.g(S.rect(-200, -150, 400, 300, 8, ol('#FFFDF6', 6)) + S.rect(-170, -120, 340, 210, 0, { fill: '#9ACBE8' }), tf(260, 260, 1, -12)) + S.g(S.rect(-200, -150, 400, 300, 8, ol('#FFFDF6', 6)) + S.rect(-170, -120, 340, 210, 0, { fill: '#F2B6C8' }), tf(1700, 820, 1, 10));
  const k = ease.outBack(seg(t, C.kinder, C.kinder + 0.4));
  let inner = S.rect(-380, 120, 760, 160, 0, { fill: '#9AD98A' }) + S.rect(-380, 120, 760, 8, 0, { fill: '#6AB85A' });
  // the kindergarten wall: alphabet + finger paint
  inner += TF('A B C', -260, -280, 54, '#E8453C') + S.circle(220, -260, 40, { fill: '#FFD21F' });
  inner += actor('ivy', 0.5, { x: 90, y: 230, s: 0.4, turn: -0.2, armL: 60, armR: 30, volume: false, face: { name: 'joy' } }, { arms: false });
  inner += actor('you', 0.5, { x: -110, y: 230, s: 0.42, turn: 0.2, armL: 10, armR: 62, volume: false, face: { name: 'happy', mouth: 'grin' } }, { arms: false });
  // glue bottle on the floor + a glue blob where his hand meets her backpack strap
  inner += S.g(S.rect(-20, -60, 40, 60, 8, ol('#FFFFFF', 4)) + S.path('M-8 -60 L0 -80 L8 -60 Z', ol('#FF8A2A', 3)) + TF('GLUE', 0, -24, 14, '#2457C5'), 'translate(250 250) rotate(14)');
  inner += S.ellipse(0, 50, 22, 14, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 3, opacity: 0.9 });
  o += E.polaroid(lerp(900, 960, u), 480, lerp(0.95, 1.0, u) * k, lerp(-8, -4, u), inner, 'BEST FRIENDS!! ♥');
  return o;
}
// ---- 36. "She builds inventions." — the rocket sneakers on her feet, the hero walks in
function shBuilds(t) {
  const u = seg(t, C.builds, C.launch);
  const cam = { zoom: lerp(1.05, 1.15, u), x: 30, y: 30 };
  const ivy = actor('ivy', t, { x: 1250, y: 990, s: 0.5, goggles: 'down', rockets: 0.15, turn: -0.2, armR: 150, armL: 30, ...breathe(t), face: { name: 'excited' } }, { arms: false });
  const hx = lerp(260, 560, ease.out(seg(t, C.builds, C.builds + 1.4)));
  const walking = t < C.builds + 1.3;
  const hero = actor('you', t, { x: hx, y: 990, s: 0.5, ...(walking ? { view: 'side', flip: true, ...AC.walk(t * 9) } : { turn: 0.4, armL: 10, armR: 10 }), face: { name: 'nervous', eyes: { look: [0.8, 0] } } }, { arms: false });
  let o = workshop(t, cam, '', hero + ivy);
  o += S.g(S.rect(-150, -34, 300, 68, 20, ol('#FFFFFF', 5)) + TF('ROCKET SNEAKERS v12', 0, 12, 28, '#1E1A2E'), tf(1560, 900, pop(t, b.inventions, 0.25), 4)) + S.path('M1420 920 L1330 960', ln(6, '#FFFFFF')) ;
  return o;
}
// ---- 37. "They explode." — ignition, into the wall, KA-BOOM
function shLaunch(t) {
  const tIg = C.launch + 0.1, tHit = b.hit;
  const fly = ease.in(seg(t, tIg + 0.1, tHit));
  const cam = shakeAll({ zoom: 1.05, x: 0, y: 20 }, t, [[tIg, 0.4, 5], [tHit, 0.7, 30]]);
  const boom = seg(t, tHit, tHit + 0.05) * (1 - 0.5 * seg(t, tHit + 0.5, tHit + 2));
  let ivy = '';
  if (t < tHit) {
    const ix = lerp(1250, 830, fly), iy = lerp(990, 640, fly) - 30 * Math.sin(t * 30) * seg(t, tIg, tIg + 0.1) * (1 - fly);
    ivy = actor('ivy', t, { x: ix, y: iy, s: 0.5, view: 'side', goggles: 'down', rockets: 1, lean: -18 * fly, armL: 150 + 30 * Math.sin(t * 25), armR: 120 + 30 * Math.sin(t * 23 + 1), legL: 20, legR: -10, face: { name: 'excited', mouth: 'scream' } }, { arms: false });
  }
  const blown = seg(t, tHit, tHit + 0.25);
  const hero = actor('you', t, { x: 560 - 60 * blown, y: 990, s: 0.5, turn: 0.4, lean: -14 * blown, armL: 10 + 60 * blown, armR: 10 + 60 * blown, face: t > tHit ? { name: 'scream' } : { name: 'shocked', eyes: { look: [0.8, 0] } } }, { arms: false });
  let front = hero + ivy;
  if (t >= tHit) front += E.fireBurst(800, 520, seg(t, tHit, tHit + 0.45), 1, 2) + E.smokeCloud(800, 560, t - tHit, { n: 11, r: 110, spread: 320, life: 2.5, seed: 4 }) + K.C.burst(800, 520, seg(t, tHit, tHit + 0.5), '#FFB23A');
  let o = workshop(t, cam, '', front, { boom, soot: t > tHit ? 1 : 0.4, days: 1 });
  if (t >= tHit) o += K.bang('KA-BOOM!', 960, 260, pop(t, tHit, 0.2), 200, -6, '#FF8A2A') + smash(t, tHit, 0.14, 0.9);
  if (t < tHit && t > tIg) o += K.bang('WHOOSH', 1300, 380, pop(t, tIg, 0.2), 80, 6, '#FFFFFF');
  return o;
}
// ---- 38. "A lot." — the chalkboard: DAYS SINCE LAST EXPLOSION 1 -> 0
function shALot(t) {
  const cam = { zoom: 3.2, x: 770 - 960, y: 205 - 540 };
  const tW = b.lot - 0.05;
  let o = workshop(t, cam, '', E.smokeCloud(560, 330, t - C.alot + 0.4, { n: 4, r: 30, life: 2.4, seed: 7, op: 1, spread: 90, rise: 30, col: '#B8B2C2' }), { soot: 1, days: t < tW ? 1 : 0 });
  o += K.C.dust(1260, 820, tW, t);
  o += K.bang('AGAIN.', 1500, 830, pop(t, tW + 0.1, 0.18), 90, -6, '#FFFFFF');
  // the other sneaker, still lit, whizzes across the board
  const wk = seg(t, b.lot + 0.2, C.boom2);
  if (wk > 0 && wk < 1) {
    const sx = lerp(-300, 2200, wk), sy = 560 - 140 * Math.sin(wk * Math.PI);
    o += K.C.speedLines(sx + 120, sx + 420, sy, 4, 9, '#FFE14D', 120) + X.rocketSneakers({ x: sx, y: sy, s: 1.6, rot: 180 + 12 * Math.sin(wk * 9), t, flame: 1, pair: false });
  }
  return o;
}
// ---- 38b. the silent beat after "A lot.": the stray sneaker loops round the garage into the BOOM? box — explosion #2
function shBoom2(t) {
  const t0 = C.boom2, tB = t0 + 0.6;
  const cam = shakeAll({ zoom: 1.05, x: 40, y: 20 }, t, [[tB, 0.8, 34]]);
  const path = (k) => [lerp(260, 1790, ease.inOut(k)), 470 - 300 * Math.sin(k * Math.PI) + 70 * Math.sin(k * Math.PI * 3)];
  let fx = E.smokeCloud(800, 560, t - b.hit, { n: 11, r: 110, spread: 320, life: 4.5, seed: 4, op: 0.8 });
  if (t < tB) {
    const k = seg(t, t0, tB);
    const [x, y] = path(k), [x2, y2] = path(Math.min(1, k + 0.02));
    const rot = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI + 180;
    for (let i = 1; i < 6; i++) { const [px, py] = path(Math.max(0, k - i * 0.05)); fx += S.circle(px, py, 14 + i * 5, { fill: '#C9C4D2', stroke: LINE, 'stroke-width': 4, opacity: f(0.8 - i * 0.12) }); }
    fx += X.rocketSneakers({ x, y, s: 0.6, rot, t, flame: 1, pair: false });
  } else {
    fx += E.fireBurst(1760, 460, seg(t, tB, tB + 0.5), 1.3, 5) + E.smokeCloud(1760, 470, t - tB, { n: 12, r: 120, spread: 380, life: 2.6, seed: 8 }) + K.C.burst(1760, 460, seg(t, tB, tB + 0.5), '#FFB23A');
  }
  const duck = ease.out(seg(t, t0 + 0.15, t0 + 0.35));
  const hero = actor('you', t, { x: 520, y: 990, s: 0.5, turn: 0.3, armL: lerp(10, 168, duck), armR: lerp(10, 168, duck), sy: 1 - 0.14 * duck, sx: 1 + 0.06 * duck,
    face: t > tB ? { name: 'scream' } : { name: 'scared', eyes: { look: [0.6, -0.6] } } }, { arms: false });
  let o = workshop(t, cam, '', hero + fx, { soot: 1, boom: 0, days: 0 });
  if (t >= tB) o += K.bang('KA-BLAM!', 1280, 240, pop(t, tB, 0.2), 210, 6, '#FF5A3D') + smash(t, tB, 0.14, 0.9) + S.rect(0, 0, 1920, 1080, 0, { fill: '#2A2230', opacity: f(0.25 * seg(t, tB + 0.6, C.soot)) });
  else o += K.bang('NOT AGAIN!', 640, 280, pop(t, t0 + 0.2, 0.2), 90, -6, '#FFFFFF');
  return o;
}
// ---- 39. "Fail number three hundred and twelve! Rocket sneakers!" — sooty, delighted, the Book of Fails
function shSoot(t) {
  const u = seg(t, C.soot, C.book);
  const IX = 600;
  const cam = { zoom: lerp(1.6, 1.95, ease.inOut(u)), x: IX + 60 - 960, y: 600 - 540 };
  const open = t > b.failW + 0.15;
  const cough = bump(t, C.soot + 0.1, C.soot + 0.45);
  const ivy = actor('ivy', t, { x: IX, y: 990, s: 0.5, soot: 1, goggles: 'up', book: open ? 'open' : true, armL: open ? undefined : 20, lean: 4 * cough, headRot: -8 * cough, turn: 0.15, ...breathe(t),
    face: cough > 0.3 ? { name: 'joy', mouth: 'O' } : { name: 'excited' } }, { arms: !open ? false : undefined, energy: 1.2 });
  let fx = E.smokeCloud(IX - 40, 380, t - C.soot + 0.8, { n: 6, r: 70, life: 2.6, seed: 9, op: 0.75, rise: 60 });
  if (cough > 0) fx += E.smokeCloud(IX + 190, 600, t - C.soot - 0.12, { n: 3, r: 26, life: 0.9, seed: 3, spread: 50, rise: 50, drift: 120, col: '#D8D4E0' });
  let o = workshop(t, cam, '', ivy + fx, { soot: 1, boom: 0, days: 0 });
  o += R.counterHUD({ x: 60, y: 80, t, label: 'FAIL #', value: 312, theme: 'white', icon: 'retry', roll: seg(t, b.failW, b.twelve2 + 0.3), from: 311, k: pop(t, b.failW - 0.1, 0.3), bump: seg(t, b.twelve2 + 0.3, b.twelve2 + 0.75) });
  o += K.bang('*cough*', 1300, 330, pop(t, C.soot + 0.12, 0.18) * (1 - seg(t, C.soot + 0.7, C.soot + 0.9)), 64, 8, '#C9D2DC');
  return o;
}
// ---- 40. the page: "Lesson learned: never wear rocket sneakers... indoors."
function shBook(t) {
  const u = seg(t, C.book, C.indoors);
  const right = ['LESSON:'];
  if (t > b.neverW - 0.05) right.push('never wear');
  if (t > b.sneakers2 - 0.6) right.push('rocket sneakers...');
  if (t > b.indoors - 0.05) right.push('INDOORS!!');
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#7A5A3A' }) + S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s02Cork)', opacity: 0.5 });
  const z = lerp(1.0, 1.1, u);
  let g = X.bookOfFails({ x: 960, y: 540, s: 3.6, rot: -2, open: true, pages: [['FAIL #312', 'Rocket', 'sneakers'], right] });
  // pencil at the end of the newest line
  const li = right.length - 1, lx = 960 + 3.6 * (24 + right[li].length * 11.5), ly = 540 + 3.6 * (-56 + li * 30) - 20;
  g += S.g(S.rect(-14, -170, 28, 170, 4, ol('#FFD21F', 5)) + S.path('M-14 0 L0 36 L14 0 Z', ol('#F2D2A8', 4)) + S.rect(-14, -196, 28, 30, 6, ol('#FF8AA8', 4)), tf(lx + 8 * Math.sin(t * 30), ly, 1, 24));
  if (t > b.indoors) g += S.path(`M${f(960 + 3.6 * 22)} ${f(540 + 3.6 * 40)} q${f(3.6 * 60)} 12 ${f(3.6 * 130)} -4`, ln(12, '#E8453C'));
  o += zoomAbout(g, 960, 540, z);
  return o;
}
// ---- 41. "...indoors." — the last smoking sneaker drops out of the ceiling: BONK
function shIndoors(t) {
  const cam = { zoom: 1.9, x: 660 - 960, y: 560 - 540 };
  const tB = b.indoors + 0.35;
  const hit = t >= tB;
  const ivy = actor('ivy', t, { x: 600, y: 990, s: 0.5, soot: 1, book: true, armR: hit ? 60 : 150, armL: 20, ...boing(t, tB, 0.3), face: hit ? { name: 'dizzy' } : { name: 'joy' } }, { arms: false });
  let fx = '';
  const fk = seg(t, b.indoors - 0.1, tB);
  if (!hit) fx += X.rocketSneakers({ x: 600 + 30, y: lerp(-60, 990 - 0.5 * 1000, ease.in(fk)), s: 0.5, rot: fk * 300, t, flame: 0, pair: false }) + E.smokeCloud(620, lerp(-60, 480, ease.in(fk)) - 40, 0.4, { n: 3, r: 22, seed: 5, spread: 30, life: 1, col: '#D8D4E0' });
  else fx += X.rocketSneakers({ x: 800, y: 990, s: 0.5, rot: 180, t, flame: 0, pair: false }) + K.C.burst(610, 470, seg(t, tB, tB + 0.4), '#FFE14D');
  let o = workshop(t, cam, '', ivy + fx, { soot: 1, days: 0 });
  if (hit) o += K.bang('BONK!', 1180, 300, pop(t, tB, 0.18), 120, 8, '#FFE14D');
  return o;
}
// ---- 42. "How are you HAPPY about this?" — two-shot, smash-zoom on HAPPY
function shHow(t) {
  const tH = b.happy;
  const wide = { zoom: 1.25, x: 900 - 960, y: 620 - 540 }, close = { zoom: 2.5, x: 620 - 960, y: 640 - 540 };
  const cam = shakeAll(camKeys(t, [[C.how, wide], [tH - 0.06, { ...wide, zoom: 1.3 }], [tH + 0.02, close], [C.lesson, { ...close, zoom: 2.6 }]], ease.out), t, [[tH, 0.3, 10]]);
  const hero = actor('you', t, { x: 620, y: 990, s: 0.5, turn: 0.45, armL: 70 + 10 * Math.sin(t * 8), armR: 80 + 10 * Math.sin(t * 8 + 1), face: t > tH - 0.05 ? { name: 'shocked' } : { name: 'confused' } }, { arms: false, energy: 1.3 });
  const ivy = actor('ivy', t, { x: 1200, y: 990, s: 0.5, soot: 1, book: true, armR: 30, turn: -0.3, face: { name: 'joy' } }, { arms: false });
  let o = workshop(t, cam, '', hero + ivy, { soot: 1, days: 0 });
  o += zoomLines(960, 420, bump(t, tH, tH + 0.6), t);
  return o + smash(t, tH, 0.1, 0.5);
}
// ---- 43. "Because now I know one more way it doesn't work!" — close, finger up, +1 LESSON
function shLesson(t) {
  const u = seg(t, C.lesson, C.anyway);
  const cam = { zoom: lerp(1.0, 1.08, u), x: 0, y: 0 };
  const Lw = H.workshop.layers(t, { time: 'day', soot: 1, days: 0 });
  const ivy = actor('ivy', t, { x: 1000, y: faceAt(540, 0.95, 0.96), s: 0.95, soot: 1, volume: false, armR: 160 + 6 * Math.sin(t * 6), armL: 20, turn: -0.15, face: { name: t > b.work ? 'excited' : 'joy' } }, { arms: false, energy: 1.1 });
  let o = view({ zoom: 1.7, x: 1250 - 960, y: 400 - 540 }, Lw.mid, 1) + S.rect(0, 0, 1920, 1080, 0, { fill: '#FFF0D8', opacity: 0.25 }) + view(cam, ivy);
  o += K.badge(1460, 300, 'LESSON +1', 'ACHIEVEMENT!', pop(t, b.work, 0.3), t);
  o += K.F.sparkle(1180, 200, 40 * bump(t, b.now, b.now + 0.6), '#FFE14D');
  return o;
}
// ---- 44. "Anyway! Big news!" — whip to the rack, the rolled poster
function shAnyway(t) {
  const u = ease.inOut(seg(t, C.anyway, C.anyway + 0.4));
  const cam = { zoom: 1.4, x: lerp(900, 1380, u) - 960, y: 600 - 540 };
  const run = t < C.anyway + 0.5;
  const ix = lerp(1000, 1400, ease.out(seg(t, C.anyway, C.anyway + 0.5)));
  const raise = ease.outBack(seg(t, b.big - 0.1, b.big + 0.2));
  const ivy = actor('ivy', t, { x: ix, y: 990, s: 0.5, soot: 1, ...(run ? { view: 'side', flip: true, ...AC.run(t * 16) } : { turn: -0.2, armR: lerp(40, 165, raise), armL: 20 }), face: { name: 'excited' } }, { arms: false });
  let roll = '';
  if (!run) {
    const hx = ix + 0.48 * (100 + 250 * Math.sin((lerp(40, 165, raise) * Math.PI) / 180)), hy = 990 - 0.48 * (515 - 250 * Math.cos((lerp(40, 165, raise) * Math.PI) / 180));
    roll = S.g(S.rect(-28, -150, 56, 300, 28, ol('#6B4AAC', 6)) + S.ellipse(0, -150, 28, 12, ol('#9A7ADC', 5)) + S.path('M-28 -40 H28 M-28 40 H28', ln(5, '#FFD21F')), tf(hx, hy - 60, 1, 10));
  }
  let o = workshop(t, cam, '', ivy + roll, { soot: 1, days: 0 });
  o += streaks(1 - seg(t, C.anyway + 0.15, C.anyway + 0.4), 1, 3);
  if (!run) o += K.F.sparkle(1300, 260, 46 * bump(t, b.big, b.big + 0.6), '#FFE14D') + K.bang('BIG NEWS!', 640, 260, pop(t, b.big, 0.2), 110, -6, '#FFE14D');
  return o;
}

// ================================================================= THE POSTER, THE WHOLE SCHOOL, THE HORROR
// ---- 45. the poster: "I signed us up..." (IVY & YOU: SCIENCE MAGIC! scribbles in) — "the talent show!" (tilt up) — "Friday!"
const PST = { x: 960, y: 260, s: 0.85 };
function shPoster(t) {
  const un = seg(t, C.poster, C.poster + 0.35);
  const hand = seg(t, b.signed, b.up + 0.1);
  const fri = seg(t, b.friday, b.friday + 0.35);
  const handY = PST.y + PST.s * 1080, headY = PST.y + PST.s * 260;
  const cam = camKeys(t, [
    [C.poster, { zoom: 0.72, x: 0, y: 690 - 540 }], [C.poster + 0.35, { zoom: 0.74, x: 0, y: 690 - 540 }],
    [b.signed + 0.1, { zoom: 1.35, x: 0, y: handY - 540 }], [b.talent - 0.15, { zoom: 1.4, x: 0, y: handY - 520 }],
    [b.talent + 0.15, { zoom: 1.25, x: 0, y: headY - 470 }], [b.friday - 0.1, { zoom: 1.25, x: 0, y: headY - 460 }],
    [b.friday + 0.15, { zoom: 0.86, x: 0, y: 700 - 540 }], [C.whole, { zoom: 0.84, x: 0, y: 700 - 540 }],
  ], ease.inOut);
  let w = S.rect(-800, -900, 3520, 3200, 0, { fill: '#C98A52' }) + S.rect(-800, -900, 3520, 3200, 0, { fill: 'url(#s02Cork)', opacity: 0.35 });
  // Ivy behind the poster: her head peeks over the top, her hands hold the top corners
  const ivy = actor('ivy', t, { x: PST.x, y: PST.y + 453, s: 0.82, soot: 1, armL: 100, armR: 100, volume: false, headY: -6 * Math.abs(Math.sin(t * 6)), face: { name: 'excited', eyes: { look: [0, 0.6] } } }, { arms: false, energy: 1.2 });
  w += ivy;
  w += E.talentPoster(PST.x, PST.y, PST.s, t, { unroll: un, hand, friday: fri });
  let o = view(cam, w);
  o += K.bang('FRIDAY!', 1500, 820, pop(t, b.friday, 0.18), 110, -8, '#3DDC84');
  return o;
}
// ---- 46. "In front of the WHOLE school!" — imagination: the packed auditorium, zoom OUT on WHOLE
function shWhole(t) {
  const tW = b.whole;
  const cam = camKeys(t, [[C.whole, { zoom: 2.3, x: 0, y: 780 - 540 }], [tW - 0.05, { zoom: 2.45, x: 0, y: 780 - 540 }], [tW + 0.35, { zoom: 0.9, x: 0, y: 590 - 540 }], [C.horror, { zoom: 0.86, x: 0, y: 590 - 540 }]], ease.inOut);
  const Lh = SS.auditorium.layers(t, { view: 'house', lights: 0.35, family: false, cam, gasp: false });
  let o = view(cam, Lh.bg || '', 1) + view(cam, (Lh.mid || '') + (Lh.front || '') + (Lh.fg || '') + (Lh.light || ''), 1);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#2A0E4A', opacity: 0.15 });
  // the follow spot swings onto the camera
  const sp = seg(t, b.school - 0.1, b.school + 0.25);
  if (sp > 0) o += S.circle(960, 540, 900 * ease.out(sp), { fill: '#FFF6D0', opacity: f(0.55 * sp) });
  o += K.bang('THE WHOLE SCHOOL', 960, 160, pop(t, tW + 0.3, 0.22), 100, -3, '#FFE14D');
  return o;
}
// ---- 47. "The WHOLE school?!" — the hero, smash-zoom, scream
function shHorror(t) {
  const tW = b.whole2;
  const cam = shakeAll(camKeys(t, [[C.horror, { zoom: 1.0 }], [tW - 0.05, { zoom: 1.05 }], [tW + 0.04, { zoom: 1.5, y: -40 }], [C.mess, { zoom: 1.55, y: -40 }]], ease.out), t, [[tW, 0.5, 22]]);
  const Lw = H.workshop.layers(t, { time: 'day', soot: 1, days: 0 });
  const scream = t > tW - 0.05;
  const hero = actor('you', t, { x: 960, y: faceAt(500, 1.0), s: 1.0, volume: false, armL: scream ? 150 : 20, armR: scream ? 150 : 20, ...boing(t, tW, 0.2),
    face: scream ? { name: 'scream', ...(t < tW + 0.45 ? { mouth: 'scream' } : {}) } : { name: 'shocked' } }, { arms: false });
  let o = view({ zoom: 1.8, x: 1100 - 960, y: 430 - 540 }, Lw.mid, 1) + S.rect(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: 0.25 });
  o += view(cam, hero);
  o += zoomLines(960, 500, scream ? 1 : 0, t, '#FFFFFF', 24, 520);
  return o + smash(t, tW, 0.1, 0.6);
}
// ---- 48. "Ivy! What if I mess up?!" — panic two-shot
function shMess(t) {
  const cam = { zoom: 1.35, x: 960 - 960, y: 620 - 540 };
  const fl = Math.sin(t * 16);
  const hero = actor('you', t, { x: 700, y: 990, s: 0.5, turn: 0.12, armL: 140 + 30 * fl, armR: 140 - 30 * fl, lift: 30 * Math.abs(Math.sin(t * 8)), face: { name: 'scream', eyes: { look: [0.8, 0] } } }, { arms: false, energy: 1.6 });
  const ivy = actor('ivy', t, { x: 1220, y: 990, s: 0.5, soot: 1, armR: 30, armL: 20, turn: -0.3, face: { name: 'happy', eyes: { look: [-0.8, 0] } } }, { arms: false });
  const tube = S.g(S.rect(-24, -130, 48, 260, 24, ol('#6B4AAC', 6)) + S.path('M-24 -40 H24 M-24 40 H24', ln(5, '#FFD21F')), tf(1300, 760, 1, 30));
  return workshop(t, cam, '', hero + ivy + tube, { soot: 1, days: 0 });
}
// ---- 49. imagination flash: on stage, trip, CRUMBLE... NO RESPAWN
function shFlash(t) {
  const tTrip = C.flash + 0.06, tCr = C.flash + 0.2;
  const cam = shakeAll({ zoom: 1.5, x: 0, y: 560 - 540 }, t, [[tCr, 0.4, 18]]);
  const La = SS.auditorium.layers(t, { view: 'stage', lights: 0, mic: false, spots: [SS.SPOTS.auditorium.stage.spots.centre] });
  let w = (La.mid || '');
  if (t < tCr) w += actor('you', t, { x: 960, y: 770, s: 0.45, lean: 30 * seg(t, tTrip, tCr), rot: 20 * seg(t, tTrip, tCr), armL: 120, armR: 120, face: { name: 'scream' } }, { arms: false });
  w += R.crumble({ x: 960, y: 770, s: 0.45, age: t - tCr, seed: 12, dir: [0.4, -0.6] });
  w += (La.front || '') + (La.fg || '') + (La.light || '');
  let o = view(cam, w);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FF2E3E', opacity: f(0.25 * seg(t, tCr + 0.1, tCr + 0.2)) });
  const nk = pop(t, tCr + 0.15, 0.18);
  if (nk > 0.01) o += S.g(S.rect(-420, -80, 840, 160, 30, ol('#2A0C12', 9)) + S.rect(-404, -64, 808, 128, 22, { fill: 'none', stroke: '#FF3B4E', 'stroke-width': 7 }) + T('NO RESPAWN', 0, 36, 104, '#FF3B4E'), tf(960, 300, nk, -4));
  o += K.C.vhs(t, '', 0.6);
  return o;
}
// ---- 50. "Then you mess up! That's the fun part!" — Ivy shrugs, jazz hands
function shFun(t) {
  const u = seg(t, C.fun, C.stare);
  const cam = { zoom: lerp(1.0, 1.06, u), x: 0, y: 0 };
  const Lw = H.workshop.layers(t, { time: 'day', soot: 1, days: 0 });
  const jazz = t > b.funW - 0.1;
  const sh = ease.outBack(seg(t, b.then, b.then + 0.3)) * (1 - seg(t, b.funW - 0.2, b.funW));
  const jz = Math.sin(t * 30);
  const ivy = actor('ivy', t, { x: 1180, y: faceAt(430, 0.75, 0.96), s: 0.75, soot: 1, volume: false,
    ...(jazz ? { armL: 140 + 8 * jz, armR: 140 - 8 * jz, lift: 30 * bump(t, b.funW, b.funW + 0.4) } : { armL: 30 + 40 * sh, armR: 30 + 40 * sh, headRot: 10 * sh, lean: 0 }),
    face: jazz ? { name: 'excited' } : { name: 'joy' } }, { arms: false, energy: 1.2 });
  const hero = actor('you', t, { x: 420, y: faceAt(560, 1.05), s: 1.05, turn: 0.55, volume: false, armL: 10, armR: 10, face: { name: 'scared', eyes: { look: [0.9, 0] } } }, { arms: false });
  let o = view({ zoom: 1.6, x: 1200 - 960, y: 450 - 540 }, Lw.mid, 1) + S.rect(0, 0, 1920, 1080, 0, { fill: '#FFF0D8', opacity: 0.3 });
  o += view(cam, ivy + hero);
  if (jazz) o += K.confetti(t, b.funW, 40, 5) + K.F.sparkle(1500, 260, 40 * bump(t, b.funW, b.funW + 0.7), '#FFE14D') + K.F.sparkle(880, 300, 30 * bump(t, b.funW + 0.1, b.funW + 0.7), '#FFFFFF');
  if (jazz) o += K.bang('FUN!', 1560, 200, pop(t, b.funW + 0.02, 0.2), 120, 8, '#FFE14D');
  return o;
}
// ---- 51 + 52. the stare (silent beat) + "For you... it was not the fun part." — FEAR meter callback, dip to night
function shStare(t) {
  const u = seg(t, C.stare, END);
  const turnK = ease.inOut(seg(t, C.stare + 0.1, C.stare + 0.6));
  const tw = t > b.notW ? (Math.floor(t * 14) % 5 === 0 ? 1 : 0) : 0;
  const Lw = H.workshop.layers(t, { time: 'day', soot: 1, days: 0 });
  let o = view({ zoom: 1.4, x: 1150 - 960, y: 520 - 540 }, Lw.mid, 1) + S.rect(0, 0, 1920, 1080, 0, { fill: '#2A1E3A', opacity: 0.45 });
  // Ivy still celebrating, soft in the background
  o += S.g(actor('ivy', t, { x: 1500, y: 1060, s: 0.42, soot: 1, volume: false, armL: 140 + 20 * Math.sin(t * 9), armR: 140 - 20 * Math.sin(t * 9), lift: 20 * Math.abs(Math.sin(t * 6)), face: { name: 'joy' } }, { arms: false }), null, { opacity: 0.55 });
  const z = lerp(1.0, 1.22, ease.inOut(u));
  const hero = actor('you', t, { x: 900, y: faceAt(500, 1.45), s: 1.45, volume: false, turn: lerp(0.5, 0, turnK), armL: 6, armR: 6,
    face: { name: 'scared', eyes: { look: [lerp(0.8, 0, turnK), 0], pupil: tw ? 0.3 : 0.45 }, fx: ['sweat2'] } }, { arms: false });
  o += zoomAbout(hero, 900, 480, z);
  o += H.darkRing(960, 520, 760, 520, '#0A0612', 0.6);
  // the FEAR meter is back, overflowing
  const fk = pop(t, b.fun2 - 0.1, 0.3);
  if (fk > 0.01) {
    const fear = 1 + 1.4 * ease.in(seg(t, b.fun2, END - 0.2));
    o += fearBar(t, 1460, 150, fk, fear);
  }
  // hand-over to SC03 (2 AM, night): dip to navy
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#070A1E', opacity: f(seg(t, END - 0.3, END - 0.02)) });
  return o;
}
function fearBar(t, x, y, k, fear) {
  const w = 620, h = 64;
  let g = S.rect(-w / 2 - 20, -70, w + 40, 160, 30, ol('#1E1A2E', 7));
  g += TF('FEAR OF MESSING UP', -w / 2, -24, 32, '#FF8A7A', { 'text-anchor': 'start' });
  const fw = w * Math.min(fear, 3);
  const blink = Math.floor(t * 10) % 2 ? '#FF2E3E' : '#FFD21F';
  g += S.rect(-w / 2, 0, w, h, 18, ol('#2A2440', 6)) + S.rect(-w / 2 + 6, 6, Math.max(0, fw - 12), h - 12, 12, { fill: blink, stroke: LINE, 'stroke-width': 5 });
  g += TS('MAX!!!', -w / 2 + Math.min(fw, 1300) - 60, -10, 56, '#FFD21F');
  return S.g(g, tf(x, y, ease.outBack(clamp(k, 0, 1)), -3));
}

// ================================================================= dispatch
const SHOTS = [
  [C.open, shOpen], [C.card, shCard], [C.board, shBoard], [C.blank, shBlank], [C.hero, shHero], [C.whatif, shWhatIf], [C.know, shKnow], [C.never, shNever],
  [C.wrong, shWrong], [C.shout, shShout], [C.slide, shSlide],
  [C.games, shGames], [C.obby, shObby], [C.obby2, shObby2], [C.hop, shHop], [C.checked, shChecked],
  [C.dad, shDad], [C.mornings, shMornings], [C.same, shSame], [C.why, shWhy], [C.along, shAlong], [C.because, shBecause], [C.flat, shFlat],
  [C.bea, shBea], [C.six, shSix], [C.hair, shHair], [C.mush, shMush],
  [C.gary, shGary], [C.seen, shSeen], [C.mom, shMom], [C.remember, shRemember], [C.mumble, shMumble],
  [C.ivy, shIvy], [C.kinder, shKinder], [C.builds, shBuilds], [C.launch, shLaunch], [C.alot, shALot], [C.boom2, shBoom2], [C.soot, shSoot], [C.book, shBook], [C.indoors, shIndoors],
  [C.how, shHow], [C.lesson, shLesson], [C.anyway, shAnyway],
  [C.poster, shPoster], [C.whole, shWhole], [C.horror, shHorror], [C.mess, shMess], [C.flash, shFlash], [C.fun, shFun], [C.stare, shStare],
].sort((a, b_) => a[0] - b_[0]);
const WHIPS = [[C.games, 1], [C.hop, -1], [C.ivy, 1], [C.gary, -1], [C.horror, 1], [C.fun, -1]];
function shotAt(t) {
  let i = SHOTS.length - 1;
  while (i > 0 && t < SHOTS[i][0]) i--;
  return i;
}
function scene(t) {
  let o = SHOTS[shotAt(t)][1](t);
  for (const [tc, dir] of WHIPS) if (Math.abs(t - tc) < 0.1) o += whip(t, tc, dir);
  return o;
}
function look(t) {
  if (t >= C.stare) return { grade: null, vignette: 1 };
  if (t >= C.seen && t < C.mom) return { grade: 'cool', vignette: 1 };
  if (t >= C.whole && t < C.horror) return { grade: null, vignette: 0.8 };
  if (t >= C.flash && t < C.fun) return { grade: null, vignette: 0.9 };
  if (t >= C.games && t < C.hop) return { grade: null, vignette: 0.5 };
  if (t >= C.card && t < C.board) return { grade: null, vignette: 0.6 };
  if (t >= C.know && t < C.never) return { grade: null, vignette: 0.4 };
  if (t >= C.hop && t < C.ivy) return { grade: 'warm', vignette: 0.55 };
  return { grade: 'warm', vignette: 0.5 };
}

const DEFS = '<defs>' +
  '<linearGradient id="s02CardBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3A1E7A"/><stop offset="1" stop-color="#8A2E9A"/></linearGradient>' +
  '<pattern id="s02Stripes" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><rect x="0" y="0" width="60" height="120" fill="#FFFFFF" opacity="0.07"/></pattern>' +
  '<pattern id="s02Cork" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="10" cy="12" r="3" fill="#8A5A2A" opacity="0.4"/><circle cx="40" cy="30" r="2.5" fill="#E8B07A" opacity="0.5"/><circle cx="25" cy="50" r="2" fill="#8A5A2A" opacity="0.35"/><circle cx="52" cy="6" r="2" fill="#E8B07A" opacity="0.4"/></pattern>' +
  '</defs>';

module.exports = { scene, look, DEFS, SHOTS, CUT: C, BEAT: b };
