// SC 01 · COLD OPEN — "the server is taken": night Cube City and the giant leaderboard billboard (#1 MOM_OFFICIAL, join toasts on
// "joined", fireworks), the billboard close-up (MOM rolls past YOU to #1), the arena: Mom's golden avatar one-shots three players
// (spin slash, TRIPLE K.O., two fly out of the arena, one is bonked flat) — "Good game, sweetie!" — she kneels with a water bottle
// ("Drink some water!", +HP) while a REAL LIFE cam shows the real Mom calmly on the couch. Tycoon Valley: tilt down Granny's
// skyscraper, SERVER OWNERSHIP 50 %, the hero's friends in aprons carrying giant cookies, Granny's cane "Faster, boys!", the
// workers sprint (REAL LIFE cam: Granny yelling at her phone), the coin counter rockets. The plaza: the hot dog walking into the
// same wall (BONK), TIME 3:12:45 with a time-lapse; real Dad yells JUMP! into his mouse; the game politely says PRESS SPACE TO
// JUMP; the webcam view of Dad's face ("Computer, I said JUMP!"); the hot dog floss-dances instead. The hero in the plaza among
// laughing players (chat: "lol is that ur dad"), the scream + pull back, the record-scratch freeze ("Well."), a VHS rewind
// through the whole cold open back to Saturday 8:00 AM — the paused family breakfast — and a pixel wipe into Cube City by day.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const R = require('./respawn');
const G = require('./gameui');
const GS = require('./sets_game');
const H = require('./sets_house');
const X = require('../rig/extras');
const AC = require('./acting');
const V = require('./vo');
const E = require('./s01_env');
const { handAt, D: DSG } = require('../rig/cast');
const { L } = V;
const { mod, tf, TS, TFS, pop, at, toScr, shakeAll, boing, whip, smash, fadeBlack, zoomLines, streaks, freezeFrame, pip, firework, rocket, pill } = E;

// ================================================================= timing (pure: only the voice timeline)
function timing() {
  const A = Array.from({ length: 9 }, (_, i) => L('01.' + i));
  const w = (i, word, n = 0) => A[i].word(word, n).t0, w1 = (i, word, n = 0) => A[i].word(word, n).t1;
  const T0 = 0, END = V.scene('SC 02').start;
  const C = {};
  C.open = T0;                                  // night Cube City: crane down to the leaderboard billboard
  C.board = A[1].a - 0.12;                      // billboard close-up: MOM rolls to #1
  C.arena = w(1, 'leaderboard') - 0.05;         // the arena: three players charge, Mom one-shots them
  C.momClose = w(2, 'sweetie') - 0.1;           // Mom close: waves, hearts
  C.water = w(2, 'Drink') - 0.25;               // Mom + the flattened player + water (REAL LIFE cam: Mom on the couch)
  C.granny = A[3].a - 0.15;                     // tilt down Granny's skyscraper, SERVER OWNERSHIP 50 %
  C.workers = w(3, 'Your', 1) - 0.1;            // friends in aprons carrying cookies
  C.faster = A[4].a - 0.1;                      // Granny's cane: "Faster, boys!"
  C.rush = w(4, 'Those') - 0.1;                 // the workers sprint (REAL LIFE cam: Granny + phone)
  C.cash = A[4].b - 0.55;                       // the coin counter rockets
  C.dad = A[5].a - 0.12;                        // whip to the plaza: the hot dog vs the wall
  C.wallClose = w(5, 'has') - 0.1;              // close: BONK BONK
  C.timer = w(5, 'for') - 0.1;                  // TIME 3:12:45 + time-lapse
  C.realDad = A[6].a - 0.1;                     // real Dad: "JUMP!" into his mouse
  C.noJump = w1(6, 'JUMP') + 0.15;              // the game: PRESS SPACE TO JUMP
  C.webcam = w(6, 'Computer') - 0.12;           // webcam view: "Computer, I said JUMP!"
  C.emote = A[6].b + 0.1;                       // the hot dog floss-dances instead
  C.hero = A[7].a - 0.25;                       // the hero among the laughing players
  C.scream = w(7, 'How') - 0.1;                 // "How did this even HAPPEN?!" + pull back
  C.freeze = A[8].a - 0.02;                     // "Well." freeze frame
  C.rewind = w(8, 'It') - 0.08;                 // VHS rewind through the cold open
  C.breakfast = w(8, 'family') - 0.1;           // paused: Saturday 8:00 AM, the family breakfast
  C.toDay = A[8].b + 0.45;                      // pixel wipe into Cube City by day
  const ks = Object.keys(C);
  for (let i = 1; i < ks.length; i++) if (C[ks[i]] < C[ks[i - 1]] + 0.25) C[ks[i]] = C[ks[i - 1]] + 0.25;
  const b = {
    parents: w(0, 'parents'), joined: w(0, 'joined'), roblox: w(0, 'Roblox'), server: w(0, 'server'),
    number: w(1, 'number'), one: w(1, 'one'),
    hit: A[2].a - 0.36, good: A[2].a, sweetie: w(2, 'sweetie'), drink: w(2, 'Drink'), water: w(2, 'water'),
    half: w(3, 'half'), server3: w(3, 'server'), friends: w(3, 'friends'), now: w(3, 'now'),
    boys: w(4, 'boys'), those: w(4, 'Those'), themselves: w(4, 'themselves'),
    dadW: w(5, 'dad'), walking: w(5, 'walking'), wall: w(5, 'wall'), three: w(5, 'three'), hours: w(5, 'hours'),
    jump1: w(6, 'JUMP'), computer: w(6, 'Computer'), jump2: w(6, 'JUMP', 1),
    my: w(7, 'MY'), server7: w(7, 'server'), happen: w(7, 'HAPPEN'),
    well: w(8, 'Well'), it: w(8, 'It'), family: w(8, 'family'), breakfast: w(8, 'breakfast'),
  };
  b.cashHit = C.cash + 0.25;
  b.potion = b.water + 0.45;
  b.sitUp = b.water + 0.85;
  b.spin = b.hit - 0.1;
  return { A, C, b, T0, END };
}
const { A, C, b, T0, END } = timing();

// ================================================================= shared bits
const SECS0 = 3 * 3600 + 12 * 60 + 45;   // the wall timer: 3:12:45 on "three"
const BOARD = { x: 700, y: 330, s: 0.55, k: 0.38 };
const ROWS_FINAL = [
  { rank: 1, name: 'MOM_OFFICIAL', score: 2104, from: 2 }, { rank: 2, name: 'YOU', score: 2001, from: 1 }, { rank: 3, name: 'xX_DarkBlade_Xx', score: 1530 },
  { rank: 4, name: 'NoodleBoi', score: 1288 }, { rank: 5, name: 'PizzaLord', score: 990 },
];
const player = (i, pose) => K.draw.player(i, { shade: true, shadow: true, ...pose });
const lying = (i, x, y, s, extra = {}, rot = -90) => S.g(player(i, { x: 0, y: 0, s, shadow: false, ...extra }), `translate(${f(x)} ${f(y)}) rotate(${f(rot)})`);
// cheap laughing pose for a crowd player (pointing toward px)
function laughPose(t, i, x, px) {
  const sh = Math.sin(t * 20 + i * 1.7), side = px > x ? 1 : -1;
  const p = { bodyY: 5 * Math.abs(sh), headRot: 6 * sh, face: i % 3 === 2 ? 'smug' : 'joy', turn: 0.3 * side };
  if (i % 2) Object.assign(p, side > 0 ? { armR: 88 + 6 * sh, armL: 30 + 10 * sh } : { armL: 88 + 6 * sh, armR: 30 + 10 * sh });
  else Object.assign(p, { armL: 50 + 20 * Math.abs(sh), armR: 50 + 20 * Math.abs(sh) });
  return p;
}
// the hot dog bonking the wall (side view facing right): phase u in each 0.55 s cycle -> pose + bonk impulse
const BONK = 0.55;
function bonkPose(t, t0 = 0) {
  const u = mod(t - t0, BONK) / BONK;
  const hit = u > 0.42 && u < 0.6 ? Math.sin(((u - 0.42) / 0.18) * Math.PI) : 0;
  return { ...AC.walk(u * Math.PI * 2, 0.9), x: -10 + 22 * ease.inOut(Math.min(u / 0.45, 1)) - 26 * hit, lean: 6 + 6 * hit, sx: 1 - 0.07 * hit, hit, u };
}
const bonkStar = (x, y, t, t0 = 0, s = 1) => {
  const u = mod(t - t0, BONK) / BONK;
  if (u < 0.45 || u > 0.8) return '';
  const k = 1 - (u - 0.45) / 0.35, r = 46 * s * (0.6 + 0.4 * k);
  let d = '';
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, rr = i % 2 ? r * 0.45 : r; d += (i ? 'L' : 'M') + f(x + Math.cos(a) * rr) + ' ' + f(y + Math.sin(a) * rr); }
  return S.path(d + 'Z', { fill: '#FFE14D', stroke: '#151515', 'stroke-width': 4 * s, opacity: f(k) }) + TS('BONK', x - 60 * s, y - 50 * s, 40 * s, '#FFFFFF', { opacity: f(k), transform: `rotate(-12 ${f(x - 60 * s)} ${f(y - 50 * s)})` });
};
const WALL = GS.SPOTS.plaza.wall;
const DADW = { x: WALL.dad.x, y: WALL.dad.y, s: WALL.dad.s };
function hotDogAtWall(t, o = {}) {
  const bp = bonkPose(t, o.t0 || 0);
  const face = o.face || (bp.hit > 0.3 ? { name: 'oof', mouth: 'wavy' } : { name: 'determined', mouth: 'line' });
  return actor('dadAvatar', t, { x: DADW.x + bp.x, y: DADW.y, s: DADW.s, view: 'side', flip: true, ...AC.walk(mod(t - (o.t0 || 0), BONK) / BONK * Math.PI * 2, 0.9), lean: bp.lean, sx: bp.sx, nametag: o.nametag ?? true, face }, { arms: false });
}
const plazaNight = (t, cam, o = {}) => GS.plaza.layers(t, cam, { time: 'night', skyscraper: true, ...o });
const DADCOL = ['#D63A2A', '#F2B705', '#E8A040', '#FFFFFF'];

// REAL LIFE cams (full-frame living room at night; the pip crops it)
const LS = H.SPOTS.livingRoom;
function livingNight(t, o = {}) {
  const l = H.livingRoom.layers(t, { time: 'night', glow: H.deviceGlows(o.glows || ['dad', 'mom', 'grandma', 'you']), tvScreen: o.tvScreen, ...(o.room || {}) });
  return l;
}
function realMomPip(t) {
  const l = livingNight(t, { glows: ['mom'] });
  const p = H.seatPose(LS.seats.mom, 1.04, { shadow: false, tablet: true, tabletFace: 'back', face: { name: 'happy', eyes: { type: 'happy' } }, headRot: 4 + 3 * Math.sin(t * 2) });
  return l.bg + l.mid + actor('mom', t, p) + l.front + X.tablet({ ...LS.devices.tablet, face: 'back', landscape: true }) + l.light + G.screenGlow(1340, 560, 420, 380, 'white', 0.55);
}
function realGrannyPip(t) {
  const l = livingNight(t, { glows: ['grandma'] });
  const shout = V.talking('GRANDMA', t) ? 1 : 0;
  const p = H.seatPose(LS.seats.grandma, 0.9, { shadow: false, phone: 'arm', face: { name: 'angry', fx: [] }, lean: -4 + 3 * shout * Math.sin(t * 16) });
  return l.bg + l.mid + actor('grandma', t, p) + l.front + l.light + G.screenGlow(1720, 590, 440, 400, 'white', 0.6);
}

// ================================================================= 1. night Cube City: crane down to the billboard
function boardSvg(t, o = {}) {
  return G.leaderboard({ rows: o.rows || ROWS_FINAL.map((r) => ({ ...r, from: undefined })), x: o.x ?? BOARD.x, y: o.y ?? BOARD.y, s: o.s ?? BOARD.s, t, highlight: 'MOM_OFFICIAL', stand: o.stand ?? 560, roll: o.roll ?? 1 });
}
function shCity(t) {
  const bx = (BOARD.x - 960) / BOARD.k, by = (BOARD.y - 540) / BOARD.k;
  const cam = camKeys(t, [
    [C.open, { zoom: 1, x: 0, y: -1150 }], [b.joined + 0.3, { zoom: 1, x: 0, y: -260 }], [b.server - 0.05, { zoom: 1.04, x: -30, y: 30 }],
    [C.board, { zoom: 2.6, x: bx * 0.92, y: by * 0.92 }],
  ], ease.inOut);
  shakeAll(cam, t, [[b.server, 0.3, 8]]);
  // glow + fireworks behind the board (k .3), the board itself (k .38)
  let fw = GS.glow(BOARD.x, BOARD.y - 20, 430, 'gsGlowGold', 0.32 + 0.08 * Math.sin(t * 5));
  fw += rocket(t, 1180, 170, 1.35, 3) + rocket(t, 280, 210, 2.05, 7) + rocket(t, 1350, 330, 2.6, 11, { r: 150 }) + rocket(t, 120, 120, 3.1, 5, { r: 240 }) + rocket(t, 1040, 80, 3.3, 2, { r: 220 });
  const city = E.nightCity(t, cam, { board: boardSvg(t) });
  let o = city.sky + E.V(cam, fw, 0.3) + city.board + city.row + city.front;
  // the hero on the rooftop ledge, from behind, looking up at the board
  const hp = { x: 300, y: 1000, s: 0.4 };
  const look = seg(t, b.parents, b.parents + 0.4);
  o += view(cam, actor('you', t, { ...hp, view: 'back', nametag: 'YOU', crown: true, headRot: -4 - 6 * look, armL: 8 + 30 * look, armR: 8, ...AC.breathe(t) }));
  // join toasts on "parents / joined / Roblox"
  o += G.joinStack(t, [
    { user: 'DadBod1978', at: b.parents - 0.08 }, { user: 'MOM_OFFICIAL', at: b.joined - 0.08 }, { user: 'GrannyGoodies', at: b.roblox - 0.08 },
  ], { x: 1880, y: 96, hold: 3.2 });
  o += zoomLines(960, 500, seg(t, b.server - 0.05, b.server + 0.25) * (1 - seg(t, C.board - 0.2, C.board)), t, '#FFF6C8', 20, 420);
  o += fadeBlack(1 - seg(t, C.open, C.open + 0.7));
  return o;
}

// ================================================================= 2. the billboard close-up: MOM rolls to #1
function shBoard(t) {
  const bx = (BOARD.x - 960) / BOARD.k, by = (BOARD.y - 540) / BOARD.k;
  const bgCam = { zoom: 2.7 + 0.15 * seg(t, C.board, C.arena), x: bx * 0.92, y: by * 0.92 - 120 };
  const city = E.nightCity(t, bgCam, { board: '' });
  let o = city.sky;
  let fw = '';
  for (let i = 0; i < 5; i++) fw += firework(lerp(260, 1660, hash(i * 3.3)), 160 + 260 * hash(i * 5.1), t - (b.one + 0.02 + i * 0.12), 20 + i, { r: 170 + 80 * hash(i), n: 16 });
  fw += K.rays(960, 400, 16, 1400 * seg(t, b.one - 0.05, b.one + 0.3), '#FFE9A0', 0.16 * seg(t, b.one - 0.05, b.one + 0.2), t * 20);
  o += fw;
  const roll = seg(t, b.number - 0.1, b.one + 0.15);
  const rows = ROWS_FINAL;
  const brd = G.leaderboard({ rows, x: 960, y: 560, s: 1, t, highlight: 'MOM_OFFICIAL', roll, stand: 300 });
  // camera on the board: start low on the rows, tilt up to #1, punch in on "one"
  const z = lerp(1.38, 1.12, ease.inOut(seg(t, C.board, b.number))) + 0.18 * ease.outBack(seg(t, b.one - 0.04, b.one + 0.22)) - 0.06 * seg(t, b.one + 0.3, C.arena);
  const cy = lerp(800, 430, ease.inOut(seg(t, C.board + 0.1, b.number + 0.1)));
  const sh = K.shake(t, b.one, 0.35, 12);
  o += S.g(brd, `translate(${f(960 + sh.sx)} ${f(540 + sh.sy)}) scale(${f(z)}) translate(-960 ${f(-cy)})`);
  const k1 = pop(t, b.one - 0.02, 0.3);
  if (k1 > 0.01) o += K.bang('#1!', 1590, 250, k1, 170, 10, '#FFD43B');
  o += zoomLines(960, 420, seg(t, b.one - 0.05, b.one + 0.15) * (1 - seg(t, b.one + 0.3, b.one + 0.6)), t, '#FFF6C8', 22, 520);
  o += smash(t, b.one, 0.12, 0.5);
  return o + smash(t, C.board, 0.1, 0.6);
}

// ================================================================= 3. the arena: the one-shot
const ARN = GS.SPOTS.arena;
const MOMP = { x: 960, y: 890, s: 0.44 };
const RUSH = [   // [player i, start x, start y, contact x, contact y, s, dir of the KO]
  { i: 6, x0: 180, y0: 905, x1: 740, y1: 905, s: 0.45, dir: -1 },
  { i: 9, x0: 1760, y0: 905, x1: 1190, y1: 905, s: 0.45, dir: 1 },
  { i: 12, x0: 1330, y0: 770, x1: 1160, y1: 840, s: 0.39, dir: 0 },
];
function arenaCrowd(t) {
  const ch = clamp(seg(t, b.hit + 0.08, b.hit + 0.4), 0.25, 1);
  return { time: 'night', cheer: ch, signs: ['GO MOM!', 'MOM #1', 'QUEEN!', 'HYDRATE!'] };
}
function momSpin(t, base = {}) {
  // spin: front -> side -> back -> side(flip) -> front over 0.24 s around b.spin
  const u = seg(t, b.spin, b.spin + 0.24);
  let p = { ...MOMP, armor: 1, nametag: false, swordGlow: 1, ...base };
  if (t < b.spin - 0.18) p = { ...p, armR: 18, armL: 24, face: { name: 'happy', eyes: { look: [0, 0] } }, ...AC.breathe(t) };
  else if (t < b.spin) { const k = seg(t, b.spin - 0.18, b.spin); p = { ...p, bodyY: 14 * k, armR: lerp(18, 60, k), armL: 40, face: 'determined' }; }
  else if (u < 1) {
    const q = Math.floor(u * 4);
    p = { ...p, armR: 100, armL: 70, face: 'determined', bodyY: 8, ...(q === 0 ? { view: 'side', flip: true } : q === 1 ? { view: 'back' } : q === 2 ? { view: 'side' } : { turn: 0.4 }) };
  } else {
    const k = seg(t, b.spin + 0.24, b.spin + 0.5);
    p = { ...p, armR: lerp(150, 110, k), armL: lerp(80, 30, k), shieldUp: false, face: { name: 'happy', eyes: { type: k > 0.5 ? 'happy' : undefined } }, ...boing(t, b.spin + 0.24, 0.18) };
  }
  return p;
}
function rushers(t) {
  let back = '', front = '', fly = '';
  RUSH.forEach((r, j) => {
    const u = seg(t, C.arena - 0.25, b.hit);
    const x = lerp(r.x0, r.x1, ease.in(u) * 0.4 + u * 0.6), y = lerp(r.y0, r.y1, u);
    if (t < b.hit) {
      const ph = (t - C.arena) * 16 + j;
      let p;
      if (r.dir === 0) p = { x, y, s: r.s, ...AC.walkFront(ph, 1.6), armR: 160, sword: 'steel', face: 'angry' };
      else p = { x, y, s: r.s, view: 'side', flip: r.dir < 0, ...AC.run(ph), armR: 150 + 10 * Math.sin(ph), sword: 'steel', face: 'angry', lean: 10 };
      if (r.dir === 0) back += player(r.i, p); else front += player(r.i, p);
    } else if (r.dir !== 0) {
      const svg = player(r.i, { x: 0, y: 0, s: r.s, face: 'dizzy', shadow: false, armL: 160, armR: 160 });
      fly += G.knockoutFly({ x0: r.x1, y0: r.y1, age: t - b.hit, dir: r.dir, svg, cy: 230 * r.s / 0.5, x1: r.dir < 0 ? 140 : 1780, y1: 110, dur: 1.0 });
    } else {
      // bonked flat into the sand
      const k = ease.outBack(seg(t, b.hit, b.hit + 0.2));
      back += lying(FLAT.i, lerp(r.x1, FLAT.x, k), lerp(r.y1, FLAT.y, k), lerp(r.s, FLAT.s, k), { face: 'dizzy' }, -90 * k);
      back += G.koStars({ x: FLAT.x - 470 * FLAT.s, y: FLAT.y - 70, t, s: 0.6, k: seg(t, b.hit + 0.15, b.hit + 0.4) });
    }
  });
  return { back, front, fly };
}
function shArena(t) {
  const cam = camKeys(t, [[C.arena, at(960, 660, 1.3)], [b.hit - 0.05, at(960, 640, 1.08)], [b.hit + 0.18, at(960, 600, 1.22)], [C.momClose, at(960, 600, 1.16)]]);
  shakeAll(cam, t, [[b.hit, 0.45, 22]]);
  const l = GS.arena.layers(t, cam, arenaCrowd(t));
  const rs = rushers(t);
  let w = rs.back;
  const mp = momSpin(t);
  w += actor('momAvatar', t, mp, { arms: false });
  w += rs.front;
  // the slash ring + hits
  const ha = t - b.hit;
  w += G.slash({ x: MOMP.x, y: MOMP.y - 220, age: t - b.spin - 0.02, angle: 180, col: '#FFD43B', s: 1.3, r: 260, dir: 1 }) + G.slash({ x: MOMP.x, y: MOMP.y - 220, age: t - b.spin - 0.12, angle: 0, col: '#FFD43B', s: 1.3, r: 260, dir: 1 });
  if (ha > -0.05 && ha < 0.5) w += S.ellipse(MOMP.x, MOMP.y - 10, 120 + 900 * seg(ha, 0, 0.4), 30 + 220 * seg(ha, 0, 0.4), { fill: 'none', stroke: '#FFE9A0', 'stroke-width': f(18 * (1 - seg(ha, 0, 0.45))), opacity: f(1 - seg(ha, 0.2, 0.45)) });
  RUSH.forEach((r, j) => {
    const hx = r.dir === 0 ? r.x1 : r.x1 + (r.dir < 0 ? 40 : -40), hy = r.y1 - 300 * r.s;
    w += G.hitSpark({ x: hx, y: hy, age: ha - 0.02 * j, s: 1.1, col: '#FFD43B', seed: j + 2, text: j === 0 ? 'POW!' : j === 1 ? 'BONK!' : null });
    if (j < 2) w += G.damageNumber({ x: hx + (j ? 60 : -60), y: hy - 60, age: ha - 0.05 - 0.04 * j, value: 999, crit: j === 1 });
  });
  w += rs.fly;
  // "Good game, sweetie!" bubble
  const oh = G.overHead(MOMP.x, MOMP.y, MOMP.s, { who: 'momAvatar', lift: 290 * MOMP.s });
  w += G.nametag({ who: 'mom', x: MOMP.x, y: oh.tag, s: 0.8, t, crown: true, k: 1 - seg(t, b.spin - 0.1, b.spin) + seg(t, b.hit + 0.3, b.hit + 0.5) });
  let o = view(cam, l.bg + l.mid + w + l.front + l.fg + l.light, 1);
  const [bx, by] = toScr(cam, MOMP.x, oh.chat);
  o += G.chatBubble({ x: bx + 40, y: by, t, maxW: 520, tail: -0.5, ...G.chatLine(t, '01.2', { to: 'sweetie', text: 'Good game, sweetie!', hold: 0.6 }) });
  o += G.comboText({ x: 1420, y: 170, k: seg(t, b.hit + 0.12, b.hit + 0.5), out: seg(t, C.momClose - 0.25, C.momClose), text: 'TRIPLE K.O.!', count: 3, t, s: 0.62, rot: 6 });
  o += smash(t, b.hit, 0.14, 0.7) + whip(t, C.arena, 1);
  return o;
}

// ================================================================= 4. Mom close: sweet wave + hearts
function shMomClose(t) {
  const cam = camKeys(t, [[C.momClose, at(960, 600, 2.05)], [C.water, at(960, 585, 2.2)]]);
  const l = GS.arena.layers(t, cam, arenaCrowd(t));
  const wv = Math.sin((t - C.momClose) * 11);
  const p = { ...MOMP, armor: 1, nametag: false, swordGlow: 1, armR: 30, armL: 140 + 18 * wv, headRot: 5 * Math.sin(t * 3), turn: 0.15, face: { name: 'happy', eyes: { type: 'happy' } }, ...AC.breathe(t) };
  let w = actor('momAvatar', t, p, { arms: false });
  const oh = G.overHead(MOMP.x, MOMP.y, MOMP.s, 'momAvatar');
  w += G.emoteHearts({ x: MOMP.x - 120, y: MOMP.y - 420, age: t - C.momClose - 0.05, n: 10, s: 0.8, seed: 3 });
  let o = view(cam, l.bg + l.mid + w + l.front + l.light, 1);
  // bubble in screen space (bigger)
  const [bx, by] = toScr(cam, MOMP.x + 20, oh.chat + 40);
  o += G.chatBubble({ x: bx + 160, y: Math.max(260, by), t, s: 1.05, maxW: 560, tail: -0.6, ...G.chatLine(t, '01.2', { to: 'sweetie', text: 'Good game, sweetie!', hold: 0.3 }) });
  // the two KO'd players twinkle away in the corners
  for (const [x, y, d] of [[170, 130, 0], [1760, 120, 0.12]]) {
    const a = t - (b.hit + 1.0 + d);
    if (a > 0 && a < 0.7) { const u = a / 0.7, r = 70 * Math.sin(Math.min(1, u * 1.6) * Math.PI); o += S.path(`M${x} ${y - r}L${x + r * 0.25} ${y - r * 0.25}L${x + r} ${y}L${x + r * 0.25} ${y + r * 0.25}L${x} ${y + r}L${x - r * 0.25} ${y + r * 0.25}L${x - r} ${y}L${x - r * 0.25} ${y - r * 0.25}Z`, { fill: '#FFFFFF', stroke: '#FFE14D', 'stroke-width': 5 }); }
  }
  return o + smash(t, C.momClose, 0.08, 0.4);
}

// ================================================================= 5. "Drink some water!" (+ REAL LIFE cam)
const FLAT = { i: 12, x: 1330, y: 905, s: 0.4 };
function waterBottle(x, y, s = 1, rot = 0) {
  let g = S.rect(-34, -70, 68, 140, 18, ol('#7FD6FF', 6)) + S.rect(-34, -10, 68, 40, 0, { fill: '#FFFFFF', opacity: 0.85 }) + S.rect(-34, -10, 68, 40, 0, { fill: 'none', stroke: '#151515', 'stroke-width': 4 });
  g += TF('H2O', 0, 20, 26, '#2E7BFF') + S.rect(-20, -96, 40, 30, 8, ol('#2E7BFF', 5)) + S.rect(-22, -60, 12, 46, 6, { fill: '#FFFFFF', opacity: 0.55 });
  return S.g(g, tf(x, y, s, rot));
}
function shWater(t) {
  const cam = camKeys(t, [[C.water, at(1060, 680, 1.5)], [C.granny, at(1090, 670, 1.62)]]);
  const l = GS.arena.layers(t, cam, arenaCrowd(t));
  // Mom leans toward the flattened player and holds out the bottle; it pops on him; he sits up with a thumbs up
  const throwK = seg(t, b.water - 0.1, b.potion);
  const pose = { x: 830, y: MOMP.y, s: MOMP.s, armor: 1, nametag: false, sword: false, turn: 0.55, lean: 10 + 4 * Math.sin(t * 3), armR: 95 + 20 * bump(t, b.water - 0.1, b.potion), armL: 30, face: { name: 'happy', mouth: 'smile', eyes: { type: 'happy' } } };
  const hd = handAt(DSG.momAvatar1, pose, 1);
  if (throwK < 0.98) pose.props = [{ svg: waterBottle(hd[0] + 30, hd[1] - 20, 1, 20 + 30 * throwK), layer: 'front' }];
  let w = actor('momAvatar', t, pose, { arms: false });
  const sit = seg(t, b.sitUp, b.sitUp + 0.3);
  if (sit <= 0) {
    w += lying(FLAT.i, FLAT.x, FLAT.y, FLAT.s, { face: 'dizzy' });
    w += G.koStars({ x: FLAT.x - 470 * FLAT.s, y: FLAT.y - 70, t, s: 0.6 });
  } else {
    w += player(FLAT.i, { x: FLAT.x - 90, y: FLAT.y, s: FLAT.s, turn: -0.4, armR: lerp(20, 165, ease.outBack(sit)), armL: 15, face: { name: 'happy', eyes: { type: 'happy' } }, ...boing(t, b.sitUp, 0.25) });
    w += S.g(S.circle(0, 0, 26, ol('#FFD23F', 4)) + S.path('M-8 4 v-16 q0 -8 8 -8 v12 h10 q8 0 6 8 l-4 14 h-20 Z', ol('#FFFFFF', 3)), tf(FLAT.x - 90 + 140, FLAT.y - 470, pop(t, b.sitUp + 0.2, 0.3)));
  }
  const pk = t - b.potion;
  if (pk > 0) w += G.potionPop({ x: FLAT.x - 110, y: FLAT.y - 120, age: pk, s: 1, col: '#5CC8FF', text: '+HP' });
  if (throwK > 0 && throwK < 1) { const bx = lerp(hd[0] * MOMP.s + 830, FLAT.x - 110, throwK), by = lerp(MOMP.y - 300, FLAT.y - 120, throwK) - 160 * Math.sin(throwK * Math.PI); w += waterBottle(bx, by, MOMP.s * 1.2, 400 * throwK); }
  const oh = G.overHead(830, MOMP.y, MOMP.s, { who: 'momAvatar', lift: 290 * MOMP.s });
  w += G.nametag({ who: 'mom', x: 830, y: oh.tag, s: 0.7, t, crown: true });
  let o = view(cam, l.bg + l.mid + w + l.front + l.light, 1);
  const [bx, by] = toScr(cam, 830, oh.chat);
  o += G.chatBubble({ x: bx + 40, y: Math.max(230, by + 10), t, s: 1, maxW: 520, tail: -0.5, ...G.chatLine(t, '01.2', { from: 'Drink', text: 'Drink some water!', hold: 0.6 }) });
  // REAL LIFE cam: the real Mom, calm on the couch
  const pk2 = seg(t, C.water + 0.05, C.water + 0.4) * (1 - seg(t, C.granny - 0.3, C.granny - 0.05));
  o += pip(realMomPip(t), 1240, 70, 620, pk2, { vx: 1340 - 330, vy: 552 - 220, vw: 660, t, label: 'REAL LIFE', labelCol: '#FF5FA8' });
  return o;
}

// ================================================================= 6. Tycoon Valley: Granny's skyscraper, SERVER OWNERSHIP 50 %
const TY = GS.SPOTS.tycoon;
function ownershipCard(t, k) {
  if (k <= 0.01) return '';
  const fill = ease.out(seg(t, b.half, b.half + 0.45)) * 0.5;
  const r = 150, c = 2 * Math.PI * r;
  let g = S.rect(-290, -250, 580, 520, 40, { fill: '#000', opacity: 0.3, transform: 'translate(12 16)' }) + S.rect(-290, -250, 580, 520, 40, { fill: '#1E2546', opacity: 0.92, stroke: '#151515', 'stroke-width': 8 });
  g += S.rect(-290, -250, 580, 86, 40, { fill: '#B57BFF' }) + S.rect(-290, -200, 580, 36, 0, { fill: '#B57BFF' }) + S.path('M-290 -164 H290', ln(6));
  g += TS('SERVER OWNERSHIP', 0, -190, 46, '#FFFFFF');
  g += S.circle(0, 40, r, { fill: 'none', stroke: '#4A5378', 'stroke-width': 70 });
  g += S.circle(0, 40, r, { fill: 'none', stroke: '#B57BFF', 'stroke-width': 70, 'stroke-dasharray': `${f(c * fill)} ${f(c)}`, transform: 'rotate(-90 0 40)' });
  g += S.circle(0, 40, r + 35, { fill: 'none', stroke: '#151515', 'stroke-width': 5 }) + S.circle(0, 40, r - 35, { fill: 'none', stroke: '#151515', 'stroke-width': 5 });
  g += G.portrait('granny', 0, 40, 92, { col: '#B57BFF' });
  g += TS(`${Math.round(fill * 100)}%`, 205, 210, 64, '#FFD43B');
  g += TF('GrannyGoodies', -60, 232, 34, '#D8B8FF');
  const sk = pop(t, b.server3 - 0.05, 0.3);
  if (sk > 0) g += G.stamp({ text: 'HALF!', k: seg(t, b.server3 - 0.1, b.server3 + 0.4), x: 170, y: -80, s: 0.75, rot: 14, col: '#FF4B5C' });
  return S.g(g, tf(1450, 470, ease.outBack(k), -3));
}
function shGranny(t) {
  const top = GS.camAt(1520, -2420, 0.9), mid = GS.camAt(1520, -900, 0.7), low = GS.camAt(1450, 330, 0.62);
  const cam = camKeys(t, [[C.granny, top], [C.granny + 0.35, top], [b.half - 0.15, low], [C.workers, { ...low, zoom: 0.66 }]], ease.inOut);
  const speed = bump(t, C.granny + 0.35, b.half - 0.15);
  const l = GS.tycoon.layers(t, cam, { time: 'night', granny: 4, billboard: 1, neon: 0.85 + 0.15 * Math.sin(t * 9) });
  // Granny (tiny) at her plot: cane up, coins popping out of the bag
  const gp = { x: TY.granny.front.x - 120, y: TY.granny.front.y, s: 0.4 };
  const g = actor('grandmaAvatar', t, { ...gp, coins: 0.5 + 0.5 * Math.sin(t * 4), armL: 120 + 10 * Math.sin(t * 6), turn: 0.2, face: 'smug' }, { arms: false });
  let o = l.bg + l.mid + view(cam, g, 1) + l.front + l.fg + l.light;
  if (speed > 0.05) o += S.path(Array.from({ length: 12 }, (_, i) => `M${f(hash(i * 3.3) * 1920)} ${f(hash(i * 7.1) * 1080)}v${f(200 + 300 * hash(i))}`).join(''), { stroke: '#FFFFFF', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: f(0.45 * speed) });
  o += ownershipCard(t, seg(t, b.half - 0.12, b.half + 0.2));
  return o + smash(t, C.granny, 0.1, 0.5);
}

// ================================================================= 7. the friends in aprons, carrying cookies
const APRON = { svg: '<path d="M-78 -470 H78 V-250 Q0 -226 -78 -250 Z" fill="#FF9FC8" stroke="#151515" stroke-width="9" stroke-linejoin="round"/><circle cx="0" cy="-380" r="34" fill="#C98A4E" stroke="#151515" stroke-width="6"/><text x="0" y="-368" font-family="Lilita One" font-size="38" fill="#FFFFFF" text-anchor="middle">GG</text>', layer: 'mid' };
const APRON_SIDE = { svg: '<path d="M-74 -470 H-20 V-250 Q-50 -236 -80 -250 Z" fill="#FF9FC8" stroke="#151515" stroke-width="9" stroke-linejoin="round"/>', layer: 'mid' };
const WORKERS = [{ who: 'noodle' }, { i: 2 }, { i: 5 }, { i: 8 }, { i: 14 }];
function worker(t, j, x, y, s, ph, o = {}) {
  const wk = WORKERS[j], amp = o.run ? 1 : 1;
  const cyc = o.run ? AC.run(ph, 1.1) : AC.walk(ph, 1);
  const stack = o.stack || 1;
  let cookies = '';
  for (let c = stack - 1; c >= 0; c--) cookies += X.cookie({ x: -260 + 10 * Math.sin(ph * 0.5 + c) + c * 6, y: -560 - c * 110 + 6 * Math.sin(ph + c), r: 150 - c * 12, rot: c * 40 + 8 * Math.sin(ph) });
  const pose = { x, y, s, view: 'side', flip: true, ...cyc, armL: 98, armR: 102, lean: o.run ? 12 : 3, props: [APRON_SIDE, { svg: cookies, layer: 'front' }], face: o.face || (o.run ? { name: 'scared', fx: ['sweat2'] } : 'happy') };
  void amp;
  if (wk.who === 'noodle') return actor('noodle', t, { ...pose, hairnet: true, apron: true, props: [{ svg: cookies, layer: 'front' }], nametag: o.tags ? 'NoodleBoi' : false });
  return player(wk.i, { ...pose, nametag: o.tags ? true : false });
}
function shWorkers(t) {
  const cam = camKeys(t, [[C.workers, GS.camAt(1380, 620, 1.0)], [C.faster, GS.camAt(1560, 620, 1.08)]]);
  const l = GS.tycoon.layers(t, cam, { time: 'night', granny: 4, billboard: 1, neon: 0.9 });
  let w = '';
  for (let j = WORKERS.length - 1; j >= 0; j--) {
    const x = 700 + (t - C.workers) * 260 + j * -330 + 330 * 2.2;
    w += worker(t, j, x, 935, 0.42, (t - C.workers) * 9 + j * 1.3, { tags: j === 0 });
  }
  let o = l.bg + l.mid + l.front + view(cam, w, 1) + l.fg + l.light;
  // STAFF ONLY sign + "employees" counter
  o += S.g(S.rect(-220, -46, 440, 92, 24, ol('#FF8FC8', 7)) + TS("GRANNY'S STAFF", 0, 18, 48, '#FFFFFF'), tf(380, 170, pop(t, b.friends - 0.05, 0.3), -4));
  o += S.g(S.rect(-170, -32, 340, 64, 20, ol('#1E2546', 6)) + TF('EMPLOYEES: 5', 0, 12, 34, '#9CF7C8'), tf(380, 260, pop(t, b.now - 0.1, 0.3), 3));
  return o + whip(t, C.workers, -1);
}

// ================================================================= 8. "Faster, boys!"
function shFaster(t) {
  const gp = { x: 1520, y: 930, s: 0.42 };
  const cam = camKeys(t, [[C.faster, GS.camAt(1520, 700, 2.05)], [C.rush, GS.camAt(1530, 690, 2.25)]]);
  shakeAll(cam, t, [[b.boys, 0.3, 14]]);
  const l = GS.tycoon.layers(t, cam, { time: 'night', granny: 4, billboard: 1, neon: 0.9 });
  const slam = seg(t, b.boys - 0.12, b.boys);
  const pose = { ...gp, turn: -0.3, armL: lerp(140, 40, ease.in(slam)) + 6 * Math.sin(t * 8) * (1 - slam), armR: 25, face: { name: 'angry', mouth: undefined }, nametag: false, ...boing(t, b.boys, 0.15) };
  let w = actor('grandmaAvatar', t, pose, { arms: false });
  if (t > b.boys) w += K.C.burst(gp.x - 150, gp.y - 10, seg(t, b.boys, b.boys + 0.35), '#FFE9A0');
  let o = l.bg + l.mid + view(cam, w, 1) + l.front + l.light;
  const [hx, hy] = toScr(cam, gp.x, G.overHead(gp.x, gp.y, gp.s, 'grandmaAvatar').chat);
  o += G.chatBubble({ x: hx + 60, y: Math.max(250, hy + 40), t, s: 1.15, maxW: 600, tail: -0.5, ...G.chatLine(t, '01.4', { to: 'boys', text: 'Faster, boys!', hold: 0.4 }) });
  if (t > b.boys) o += K.bang('TAP!', 640, 860, pop(t, b.boys, 0.2) * (1 - seg(t, b.boys + 0.4, b.boys + 0.6)), 90, -8, '#FFE14D');
  return o + smash(t, C.faster, 0.1, 0.5);
}

// ================================================================= 9. the workers sprint (REAL LIFE cam: Granny + phone)
function shRush(t) {
  const u = t - C.rush;
  const cam = GS.camAt(1450 + u * 420, 640, 1.05);
  const l = GS.tycoon.layers(t, cam, { time: 'night', granny: 4, billboard: 1, neon: 0.9 });
  let w = '';
  for (let j = WORKERS.length - 1; j >= 0; j--) {
    const x = 1150 + u * 1100 + j * -300;
    w += worker(t, j, x, 935, 0.42, u * 22 + j * 1.7, { run: true, stack: 2 + (j % 2) });
  }
  let o = l.bg + l.mid + l.front + view(cam, w, 1) + l.fg + l.light;
  o += streaks(0.8, 3, '#FFFFFF', 300, 1000);
  // Granny's line as a floating chat
  o += G.chatBubble({ x: 560, y: 300, t, s: 1.05, maxW: 760, tail: false, user: 'GrannyGoodies', ...G.chatLine(t, '01.4', { from: 'Those', text: "Those cookies won't sell themselves!", hold: 0.5, pre: 0.15 }) });
  o += pip(realGrannyPip(t), 1250, 60, 600, seg(t, C.rush + 0.05, C.rush + 0.35) * (1 - seg(t, C.cash - 0.25, C.cash)), { vx: 1700 - 330, vy: 590 - 230, vw: 660, t, label: 'REAL LIFE', labelCol: '#B57BFF' });
  return o + whip(t, C.rush, -1);
}

// ================================================================= 10. the coin counter rockets
function shCash(t) {
  const gp = { x: 1520, y: 930, s: 0.42 };
  const cam = camKeys(t, [[C.cash, GS.camAt(1500, 640, 1.35)], [C.dad, GS.camAt(1520, 660, 1.55)]]);
  const l = GS.tycoon.layers(t, cam, { time: 'night', granny: 4, billboard: 1, neon: 0.9 });
  const shake = Math.sin(t * 30) * 8 * bump(t, b.cashHit - 0.05, b.cashHit + 0.6);
  const pose = { ...gp, turn: 0.2, armR: 60 + shake, armL: 30, coins: seg(t, b.cashHit - 0.1, b.cashHit + 0.6), face: { name: 'rich', fx: ['sparkles'] }, nametag: false };
  let w = actor('grandmaAvatar', t, pose, { arms: false });
  // workers in the back dropping off cookies
  let o = l.bg + l.mid + view(cam, w, 1) + l.front + l.light;
  o += G.coinCounter({ x: 60, y: 90, value: 9999999, from: 1250000, roll: seg(t, C.cash + 0.05, b.cashHit + 0.3), rocket: 1, bump: seg(t, b.cashHit + 0.3, b.cashHit + 0.75), k: pop(t, C.cash, 0.25), t, s: 1.25, anchor: 'left' });
  if (t > b.cashHit) o += K.bang('KA-CHING!', 1380, 300, pop(t, b.cashHit, 0.22), 110, 8, '#FFD43B') + K.coinBurst(1050, 700, seg(t, b.cashHit, b.cashHit + 1.2), 22, 900, 26, 5);
  return o + smash(t, C.cash, 0.08, 0.4);
}

// ================================================================= 11. the plaza: the hot dog walking into the wall
function timerPill(t, sec, x = 960, y = 76, s = 1, bumpK = 0) {
  const sc = s * (1 + 0.25 * bumpK);
  return S.g(G.timerHUD({ x: 0, y: 0, sec, t, label: 'TIME' }), tf(x, y, sc));
}
const wallSec = (t) => SECS0 + Math.floor(t - b.three);
function noobWatchers(t, o = {}) {
  // two noobs watching from the crate (one eats popcorn)
  const cr = GS.SPOTS.plaza.crate;
  let w = K.draw.noob(3, { x: cr.x - 40, y: cr.y, s: 0.3, face: 'deadpan', armL: 30, armR: 40 + 10 * Math.sin(t * 6), ...AC.breathe(t) });
  w += K.draw.noob(7, { x: cr.x + 70, y: cr.y, s: 0.3, face: o.laugh ? 'joy' : 'neutral', armR: 20, armL: 20, bodyY: o.laugh ? 5 * Math.abs(Math.sin(t * 18)) : 0 });
  w += S.g(S.path('M-26 -30 L26 -30 L18 30 L-18 30 Z', ol('#FF5A5A', 4)) + S.path('M-8 -30 V30 M8 -30 V30', ln(4, '#FFFFFF')) + S.circle(-12, -38, 12, ol('#FFF6D0', 3)) + S.circle(8, -42, 12, ol('#FFF6D0', 3)), tf(cr.x - 40 + 75 * 0.3 * 2, cr.y - 120, 0.9));
  return w;
}
function shWallWide(t) {
  const cam = camKeys(t, [[C.dad, GS.camAt(2150, 620, 0.72)], [C.wallClose, GS.camAt(2420, 650, 0.95)]]);
  const l = plazaNight(t, cam);
  let w = noobWatchers(t) + hotDogAtWall(t);
  let o = l.bg + l.mid + view(cam, w, 1) + l.front + l.light;
  const [sx, sy] = toScr(cam, WALL.x0 + 4, WALL.top + 40);
  o += bonkStar(sx, sy, t, 0, 0.8);
  o += timerPill(t, wallSec(t), 960, 76, 0.9);
  return o + whip(t, C.dad, -1, 0.14);
}
function shWallClose(t) {
  const cam = camKeys(t, [[C.wallClose, GS.camAt(2470, 640, 2.0)], [C.timer, GS.camAt(2490, 630, 2.25)]]);
  const bp = bonkPose(t);
  shakeAll(cam, t, [[Math.floor(t / BONK) * BONK + 0.45 * BONK, 0.12, 8 * (bp.hit > 0 ? 1 : 0)]]);
  const l = plazaNight(t, cam);
  let o = l.bg + l.mid + view(cam, hotDogAtWall(t, { nametag: false }), 1) + l.front + l.light;
  const [sx, sy] = toScr(cam, WALL.x0 + 4, WALL.top + 40);
  o += bonkStar(sx, sy, t, 0, 1.4);
  o += timerPill(t, wallSec(t), 960, 76, 0.9);
  o += S.g(G.nametag({ who: 'dad', x: 0, y: 0, s: 1.1, t }), tf(700, 250, pop(t, C.wallClose + 0.1, 0.25)));
  return o;
}
function shTimer(t) {
  const cam = camKeys(t, [[C.timer, GS.camAt(2280, 520, 0.62)], [C.realDad, GS.camAt(2300, 530, 0.66)]]);
  const l = plazaNight(t, cam);
  // time-lapse: avatars zip around as ghost streaks while the hot dog keeps bonking
  const lapse = seg(t, b.hours - 0.1, b.hours + 0.1);
  let w = noobWatchers(t);
  if (lapse > 0) {
    for (let i = 0; i < 6; i++) {
      const sp = 2600 + 900 * hash(i), x = 1300 + mod((t - b.hours) * sp * (i % 2 ? 1 : -1) + i * 700, 1900), y = 780 + 60 * (i % 4);
      for (let g = 0; g < 3; g++) w += S.g(player(i + 2, { x: x - g * 60 * (i % 2 ? 1 : -1), y, s: GS.SPOTS.plaza.sAt(y), view: 'side', flip: i % 2 === 1, ...AC.run(t * 30 + i), shadow: false }), null, { opacity: f((0.5 - g * 0.15) * lapse) });
    }
  }
  w += hotDogAtWall(t);
  // cobweb on the hot dog
  const web = seg(t, b.hours + 0.1, b.hours + 0.6);
  if (web > 0) w += S.g(S.path('M0 0 L120 0 M0 0 L0 120 M0 0 L95 95 M30 0 Q22 22 0 30 M70 0 Q52 52 0 70 M110 0 Q80 80 0 110', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 5, opacity: 0.85 }), tf(DADW.x - 70, DADW.y - 1240 * DADW.s + 10, web * 0.9));
  let o = l.bg + l.mid + view(cam, w, 1) + l.front + l.light;
  const tk = pop(t, b.three - 0.08, 0.3);
  const sec = t < b.three ? SECS0 - 4 + Math.floor((t - C.timer) * 10) : wallSec(t) + (lapse > 0 ? Math.floor((t - b.hours) * 400) : 0);
  o += timerPill(t, Math.min(sec, SECS0 + 400), lerp(960, 960, tk), lerp(76, 330, tk), lerp(0.9, 2.3, tk), bump(t, b.three, b.three + 0.25));
  if (lapse > 0) o += S.g(S.rect(-170, -32, 340, 64, 20, ol('#1E2546', 6)) + TF('TIME-LAPSE ▸▸', 0, 12, 34, '#FFE14D'), tf(960, 470, pop(t, b.hours, 0.25)));
  return o + smash(t, b.three, 0.1, 0.4) + whip(t, C.timer, 1);
}

// ================================================================= 12. real Dad: "JUMP!" into the mouse
function shRealDad(t) {
  const cam = camKeys(t, [[C.realDad, { zoom: 1.55, x: 160, y: 60 }], [b.jump1 - 0.02, { zoom: 1.6, x: 150, y: 50 }], [b.jump1 + 0.12, { zoom: 2.3, x: 50, y: 20 }], [C.noJump, { zoom: 2.4, x: 50, y: 20 }]]);
  shakeAll(cam, t, [[b.jump1, 0.5, 20]]);
  const l = livingNight(t, { glows: ['dad', 'mom', 'grandma'] });
  const yell = seg(t, b.jump1 - 0.08, b.jump1 + 0.05);
  const dad = actor('dad', t, H.seatPose(LS.seats.dad, 1.1, { shadow: false, volume: false, mouse: true, glasses: 'on', lean: lerp(0, -8, yell) + 3 * Math.sin(t * 40) * yell, armL: 18, face: yell > 0.5 && t < b.jump1 + 0.5 ? { name: 'angry', mouth: 'scream', fx: ['anger'] } : { name: 'angry', fx: ['anger'] } }));
  const mom = actor('mom', t, H.seatPose(LS.seats.mom, 1.04, { shadow: false, volume: false, tablet: true, face: { name: 'neutral', eyes: { look: [0.2, 0.5] } } }));
  const gran = cam.zoom < 1.9 ? actor('grandma', t, H.seatPose(LS.seats.grandma, 0.9, { shadow: false, volume: false, phone: 'arm', face: { name: 'confused', eyes: { look: [0.6, -0.3] } } })) : '';
  const dev = X.laptopOld({ ...LS.devices.laptop, y: LS.devices.laptop.y + 70, s: 0.46, face: 'lid', glow: 1 }) + X.tablet({ ...LS.devices.tablet, face: 'back', landscape: true });
  let o = view(cam, l.bg + l.mid + dad + mom + gran + l.front + dev + (cam.zoom < 1.9 ? l.table : '') + l.light);
  o += zoomLines(960, 420, seg(t, b.jump1, b.jump1 + 0.15) * (1 - seg(t, b.jump1 + 0.4, b.jump1 + 0.6)), t, '#FFFFFF', 22, 460);
  return o + smash(t, b.jump1, 0.12, 0.7) + smash(t, C.realDad, 0.08, 0.5);
}

// ================================================================= 13. the game: PRESS SPACE TO JUMP
function shNoJump(t) {
  const cam = camKeys(t, [[C.noJump, GS.camAt(2460, 620, 1.55)], [C.webcam, GS.camAt(2470, 610, 1.7)]]);
  const l = plazaNight(t, cam);
  let o = l.bg + l.mid + view(cam, hotDogAtWall(t, { nametag: false }), 1) + l.front + l.light;
  const [sx, sy] = toScr(cam, WALL.x0 + 4, WALL.top + 40);
  o += bonkStar(sx, sy, t, 0, 1.1);
  const k = pop(t, C.noJump + 0.12, 0.3), bl = 0.6 + 0.4 * Math.abs(Math.sin(t * 6));
  if (k > 0) {
    let g = S.rect(-330, -70, 660, 140, 40, { fill: '#1E2546', opacity: 0.9, stroke: '#151515', 'stroke-width': 7 }) + TF('PRESS', -210, 18, 46, '#FFFFFF');
    g += G.keycap({ x: 10, y: 0, w: 230, h: 80, label: 'SPACE', t, press: 0 }) + TF('TO JUMP', 230, 18, 46, '#FFFFFF');
    o += S.g(g, tf(900, 250, 1.35 * k), { opacity: f(bl) });
  }
  o += S.g(TS('?', 0, 0, 120, '#FFFFFF'), tf(sx - 220, sy - 230, pop(t, C.noJump + 0.35, 0.3), 10));
  return o + smash(t, C.noJump, 0.08, 0.4);
}

// ================================================================= 14. webcam: "Computer, I said JUMP!"
function shWebcam(t) {
  const l = livingNight(t, { glows: ['mom', 'grandma'] });
  const bgCam = { zoom: 1.9, x: 40, y: -40 };
  let o = view(bgCam, l.bg + l.mid + l.front + l.light);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#0A0620', opacity: 0.35 });
  const lean = ease.inOut(seg(t, C.webcam, b.jump2)) , punch = ease.outBack(seg(t, b.jump2 - 0.05, b.jump2 + 0.2));
  const s = 1.25 + 0.2 * lean + 0.2 * punch;
  const sh = K.shake(t, b.jump2, 0.6, 26);
  const fy = 520 - 30 * lean;
  o += actor('dad', t, { x: 960 + sh.sx + 10 * Math.sin(t * 3), y: fy + 690 * s * 1.1, s, volume: false, glasses: 'on', shadow: false, armL: 10, armR: 10, headRot: 4 * Math.sin(t * 5), face: punch > 0.3 && t < b.jump2 + 0.45 ? { name: 'angry', mouth: 'scream', fx: ['anger', 'steam'] } : { name: 'angry', fx: ['anger'] } });
  // screen-light on the face
  o += G.screenGlow(960, 420, 900, 700, 'laptop', 0.6);
  o += zoomLines(960, 460, seg(t, b.jump2 - 0.02, b.jump2 + 0.1) * (1 - seg(t, b.jump2 + 0.35, b.jump2 + 0.5)), t, '#FFFFFF', 24, 520);
  // webcam UI
  let ui = S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#rspScan)', opacity: 0.35 });
  const br = (x, y, sx, sy) => S.path(`M${x} ${y + sy * 90} V${y} H${x + sx * 90}`, ln(10, '#FFFFFF'));
  ui += br(60, 60, 1, 1) + br(1860, 60, -1, 1) + br(60, 940, 1, -1) + br(1860, 940, -1, -1);
  ui += S.circle(120, 120, 18, { fill: '#FF3B4E', opacity: f(mod(Math.floor(t * 2.5), 2) ? 1 : 0.25) }) + TF('REC', 150, 134, 42, '#FFFFFF', { 'text-anchor': 'start' });
  ui += TF('DELL-O WEBCAM · 480p', 1840, 134, 34, '#FFFFFF', { 'text-anchor': 'end', opacity: 0.85 });
  ui += S.rect(1640, 880, 200, 34, 6, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 4 }) + S.rect(1646, 886, 188 * (0.6 + 0.4 * Math.abs(Math.sin(t * 20))) * (V.talking('DAD', t) ? 1 : 0.2), 22, 3, { fill: '#7CFF6B' });
  o += ui;
  return o + smash(t, b.jump2, 0.12, 0.6) + smash(t, C.webcam, 0.08, 0.6);
}

// ================================================================= 15. the hot dog floss-dances instead
function shEmote(t) {
  const cam = camKeys(t, [[C.emote, GS.camAt(2380, 660, 1.2)], [C.hero, GS.camAt(2360, 660, 1.3)]]);
  const l = plazaNight(t, cam);
  const u = t - C.emote;
  const turnK = seg(u, 0, 0.15);
  const hp = { x: DADW.x - 40, y: DADW.y, s: DADW.s };
  let w = noobWatchers(t, { laugh: true });
  w += actor('dadAvatar', t, { ...hp, ...(turnK < 1 ? { view: 'side', flip: true } : { turn: -0.2, ...AC.floss(t) }), face: { name: 'happy', eyes: { type: 'happy' } } }, { arms: false });
  w += G.danceNotes({ x: hp.x + 120, y: hp.y - 520, t, k: seg(u, 0.15, 0.4), s: 0.9 });
  // laughing players on the left
  for (const [i, x, y] of [[1, 1950, 900], [4, 2120, 960], [10, 1820, 980]]) w += player(i, { x, y, s: GS.SPOTS.plaza.sAt(y), ...laughPose(t, i, x, hp.x) });
  let o = l.bg + l.mid + view(cam, w, 1) + l.front + l.light;
  o += S.g(S.rect(-190, -38, 380, 76, 26, ol('#FF5FA8', 6)) + TF('EMOTE: FLOSS', 0, 13, 40, '#FFFFFF'), tf(1330, 210, pop(t, C.emote + 0.12, 0.28), -4));
  return o + smash(t, C.emote, 0.08, 0.5);
}

// ================================================================= 16. the hero among the laughing players
const HERO = { x: 1950, y: 965, s: 0.41 };
const CROWD = [   // [i, x, y] back -> front
  [3, 1560, 790], [7, 1700, 800], [11, 2200, 795], [13, 2340, 805], [0, 1480, 870], [5, 2420, 880], [8, 1620, 915], [15, 2290, 925],
  [2, 1430, 1035], [9, 2480, 1045],
];
function crowdSvg(t, faceX) {
  let w = '';
  for (const [i, x, y] of CROWD) w += player(i, { x, y, s: GS.SPOTS.plaza.sAt(y), ...laughPose(t, i, x, i % 3 ? DADW.x : faceX) });
  return w;
}
const CHAT_LINES = () => [
  { user: 'PizzaKid', text: 'lol is that ur dad', at: C.emote + 0.1 },
  { user: 'CubeKid9', text: 'XD', at: C.emote + 0.45 },
  { user: 'SkyRunner', text: 'hot dog guy LVL 1 lmao', at: C.hero + 0.2 },
  { user: 'ToastMan', text: 'DAD JUMP', at: b.my - 0.1 },
  { user: 'BloxyBea', text: 'lol is that ur dad', at: b.server7 + 0.2 },
  { user: 'xX_DarkBlade_Xx', text: 'LOL', at: C.scream + 0.2 },
];
function shHero(t) {
  const cam = camKeys(t, [[C.hero, GS.camAt(1950, 640, 1.0)], [b.my - 0.06, GS.camAt(1950, 620, 1.12)], [b.my + 0.1, GS.camAt(1950, 590, 1.75)], [C.scream, GS.camAt(1950, 590, 1.85)]]);
  shakeAll(cam, t, [[b.my, 0.4, 16]]);
  const l = plazaNight(t, cam);
  const mad = seg(t, b.my - 0.1, b.my + 0.05);
  const hp = { ...HERO, nametag: 'YOU', crown: true, armL: lerp(100, 40, mad) + 6 * Math.sin(t * 9), armR: lerp(100, 40, mad) + 6 * Math.sin(t * 9 + 1), face: mad > 0.5 ? { name: 'angry', fx: ['anger'] } : { name: 'shocked', fx: ['sweat2'] }, ...boing(t, b.my, 0.2) };
  let w = crowdSvg(t, HERO.x);
  w += actor('you', t, hp, { arms: false });
  // the hot dog still flossing by the wall in the back
  w += actor('dadAvatar', t, { x: DADW.x - 40, y: DADW.y, s: DADW.s, turn: -0.2, ...AC.floss(t) });
  const bub = G.overHead(1700, 800, GS.SPOTS.plaza.sAt(800), 'player');
  w += G.chatBubble({ x: 1700, y: bub.chat, t, user: 'PizzaKid', text: 'lol is that ur dad', typed: seg(t, C.hero, C.hero + 0.6), k: seg(t, C.hero - 0.1, C.hero + 0.2), out: seg(t, b.my - 0.2, b.my), s: 0.85, tail: 0.4 });
  let o = l.bg + l.mid + view(cam, w, 1) + l.front + l.light;
  o += G.chatLog({ x: 30, y: 560, w: 600, h: 330, t, lines: CHAT_LINES(), k: 1 });
  o += zoomLines(960, 450, seg(t, b.my - 0.03, b.my + 0.1) * (1 - seg(t, b.my + 0.35, b.my + 0.5)), t, '#FFFFFF', 22, 480);
  return o + smash(t, b.my, 0.12, 0.6) + whip(t, C.hero, -1);
}

// ================================================================= 17. "How did this even HAPPEN?!" + pull back
function screamScene(t) {
  const cam = camKeys(t, [[C.scream, GS.camAt(1950, 660, 2.35)], [b.happen - 0.04, GS.camAt(1950, 655, 2.5)], [b.happen + 0.45, GS.camAt(2120, 470, 0.6)], [C.freeze, GS.camAt(2120, 470, 0.58)]], ease.out);
  shakeAll(cam, t, [[b.happen, 0.6, 14]]);
  const l = plazaNight(t, cam);
  const jit = 6 * Math.sin(t * 50);
  const hp = { ...HERO, x: HERO.x + jit * 0.3, nametag: 'YOU', crown: true, armL: 168 + jit, armR: 168 - jit, face: { name: 'scream', fx: ['sweat2'] }, headRot: jit * 0.4 };
  let w = crowdSvg(t, HERO.x);
  // bleacher noobs + the hot dog
  const BL = GS.SPOTS.plaza.bleachers;
  BL.forEach((bl, r) => { for (let i = 0; i < 4; i++) { const x = bl.x0 + 40 + i * ((bl.x1 - bl.x0 - 80) / 3); w += K.draw.noob(r * 4 + i + 1, { x, y: bl.y, s: bl.s, face: 'joy', bodyY: 5 * Math.abs(Math.sin(t * 18 + i + r)), armL: 40, armR: 60 }); } });
  w += actor('you', t, hp, { arms: false });
  w += actor('dadAvatar', t, { x: DADW.x - 40, y: DADW.y, s: DADW.s, turn: -0.2, ...AC.floss(t) });
  // floating LOL bubbles over the crowd (world)
  const lols = [['LOL', 1560, 600, 0], ['XD', 2340, 610, 0.1], ['lol is that ur dad', 1700, 520, 0.2], ['LMAO', 2200, 520, 0.3], ['DAD!!', 2500, 560, 0.4]];
  for (const [txt, x, y, d] of lols) w += G.chatBubble({ x, y, t, text: txt, typed: 1, k: seg(t, b.happen + d, b.happen + d + 0.25), s: 1.2, tail: 0 });
  return l.bg + l.mid + view(cam, w, 1) + l.front + l.light;
}
function shScream(t) {
  let o = screamScene(t);
  o += G.chatLog({ x: 30, y: 560, w: 600, h: 330, t, lines: CHAT_LINES(), k: 1, flood: seg(t, b.happen, C.freeze), floodSet: 'mix', floodN: 30 });
  return o + smash(t, b.happen, 0.12, 0.5) + smash(t, C.scream, 0.08, 0.5);
}

// ================================================================= 18. "Well." — freeze frame
function shFreeze(t) {
  const k = ease.outBack(seg(t, C.freeze, C.freeze + 0.3));
  const still = screamScene(C.freeze - 0.03) + G.chatLog({ x: 30, y: 560, w: 600, h: 330, t: C.freeze - 0.03, lines: CHAT_LINES(), k: 1, flood: 1, floodSet: 'mix', floodN: 30 });
  let o = freezeFrame(still, k, { rot: -3.5, scale: 0.84 });
  // the hero tag
  const tk = pop(t, C.freeze + 0.2, 0.3);
  if (tk > 0.01) o += S.g(S.path('M0 0 L-70 120', ln(12, '#FFFFFF')) + S.path('M-70 120 l-8 -40 l36 18 Z', ol('#FFFFFF', 4)), tf(1060, 330, tk)) + pill(1150, 290, 'THE LEGEND?', 46, '#FF5A3D', '#FFFFFF', { rot: 4, s: tk });
  return o + smash(t, C.freeze, 0.1, 0.8);
}

// ================================================================= 19. VHS rewind through the cold open
const REW = () => [
  // [fn, src from, src to] played backwards; durations split evenly
  [shScream, C.freeze - 0.05, b.happen - 0.2],
  [shEmote, C.hero - 0.05, C.emote + 0.05],
  [shWallClose, C.timer - 0.05, C.wallClose + 0.1],
  [(tt) => shGrannyRew(tt), 0, 1],
  [shArena, C.momClose - 0.05, C.arena + 0.05],
  [shBoard, C.arena - 0.05, b.number - 0.1],
];
function shGrannyRew(u) {
  const cam = GS.camAt(1450, 420, 0.5);
  const l = GS.tycoon.layers(b.half, cam, { time: 'night', granny: lerp(4, 1, u), billboard: 1 - u });
  return String(l);
}
function rewClock(t) {
  const m0 = 22 * 60 + 47, m1 = 8 * 60;
  const u = ease.in(seg(t, C.rewind, C.breakfast));
  const m = Math.round(lerp(m0, m1 + 60 * 0, u));
  const hh = Math.floor(m / 60), mm = m % 60, h12 = ((hh + 11) % 12) + 1;
  return `SAT ${h12}:${String(mm).padStart(2, '0')} ${hh >= 12 ? 'PM' : 'AM'}`;
}
function shRewind(t) {
  const list = REW();
  const u = seg(t, C.rewind, C.breakfast), n = list.length;
  const i = Math.min(n - 1, Math.floor(u * n)), v = u * n - i;
  const [fn, a, bb] = list[i];
  let o = fn === list[3][0] ? shGrannyRew(v) : fn(lerp(a, bb, v));
  // tape tear: a horizontal band shifted
  const ty = mod(t * 1700, 1300) - 100;
  o += S.rect(0, ty, 1920, 70, 0, { fill: '#FFFFFF', opacity: 0.12 });
  o += R.rewind(t, 1, { label: 'REWIND', clock: rewClock(t), seed: 4 });
  if (v < 0.18) o += K.C.whiteFlash(0.25 * (1 - v / 0.18));
  return o + K.C.staticNoise(t, 0.25);
}

// ================================================================= 20. paused: Saturday 8:00 AM — the family breakfast
function breakfastScene(t) {
  const tf0 = C.breakfast + 0.25;   // the frozen moment
  const KS = H.SPOTS.kitchen.seats;
  const l = H.kitchen.layers(tf0, { time: 'morning', paper: false });
  let seated = actor('dad', tf0, H.seatPose(KS.dad, 1.1, { shadow: false, newspaper: true, face: 'happy' }));
  seated += actor('mom', tf0, H.seatPose(KS.mom, 1.04, { shadow: false, mug: true, mugUp: true, face: 'happy' }));
  seated += actor('grandma', tf0, H.seatPose(KS.grandma, 0.9, { shadow: false, knitting: true, face: 'happy' }));
  seated += actor('you', tf0, H.seatPose(KS.you, 1, { shadow: false, tablet: true, face: { name: 'happy', eyes: { look: [0.2, 0.6] } } }));
  return l.bg + l.mid + seated + l.front + l.fg + l.light;
}
function shBreakfast(t) {
  const z = lerp(1.12, 1.0, ease.out(seg(t, C.breakfast, C.breakfast + 0.5))) + 0.04 * seg(t, C.breakfast + 0.5, C.toDay);
  let o = S.g(breakfastScene(t), `translate(960 520) scale(${f(z)}) translate(-960 -520)`);
  const rk = 1 - seg(t, C.breakfast, C.breakfast + 0.35);
  if (rk > 0) o += R.rewind(t, rk, { label: 'REWIND', clock: 'SAT 8:00 AM' });
  // paused OSD + tracking band
  const pk = seg(t, C.breakfast + 0.3, C.breakfast + 0.4);
  if (pk > 0) {
    o += S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#rspScan)', opacity: 0.25 });
    const by = 860 + 10 * Math.sin(t * 30);
    o += S.rect(0, by, 1920, 26, 0, { fill: '#FFFFFF', opacity: 0.18 }) + S.rect(0, by + 30, 1920, 8, 0, { fill: '#FFFFFF', opacity: 0.25 });
    const on = mod(Math.floor(t * 2.4), 2) === 0;
    if (on) o += S.path('M88 92 h26 v90 h-26 Z M132 92 h26 v90 h-26 Z', { fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 6 });
    o += TF('PAUSE', 184, 164, 64, '#FFFFFF', { 'text-anchor': 'start', stroke: '#151515', 'stroke-width': 10, 'paint-order': 'stroke', 'letter-spacing': 4 });
    o += TF('SAT 8:00 AM', 1830, 164, 60, '#FFFFFF', { 'text-anchor': 'end', stroke: '#151515', 'stroke-width': 10, 'paint-order': 'stroke', 'letter-spacing': 3 });
  }
  // the title: SATURDAY · FAMILY BREAKFAST
  const tk = pop(t, b.breakfast - 0.15, 0.35);
  if (tk > 0.01) o += S.g(S.rect(-380, -58, 760, 116, 36, { fill: '#000', opacity: 0.3, transform: 'translate(10 12)' }) + S.rect(-380, -58, 760, 116, 36, ol('#FFD43B', 8)) + TS('FAMILY BREAKFAST', 0, 24, 72, '#FFFFFF'), tf(960, 300, tk, -3));
  return o;
}

// ================================================================= 21. pixel wipe into Cube City by day
function shToDay(t) {
  const u = t - C.toDay;
  const p = seg(u, 0, 0.5), q = seg(u, 0.55, 1.05);
  if (p < 1) return shBreakfast(Math.min(t, C.toDay - 0.01)) + K.C.pixelWipe(p, 'cover');
  const cam = camKeys(t, [[C.toDay + 0.5, { zoom: 1.12, x: 0, y: 60 }], [END, { zoom: 1.0, x: 0, y: 0 }]], ease.out);
  let o = GS.cityDay(t, cam, {});
  o += K.C.pixelWipe(q, 'reveal');
  // the hand-over: PLAY OSD + white flash
  const pk = seg(t, END - 0.55, END - 0.45) * (1 - seg(t, END - 0.08, END));
  if (pk > 0) o += S.g(S.path('M0 0 L54 34 L0 68 Z', { fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 6, 'stroke-linejoin': 'round' }) + TF('PLAY', 80, 58, 64, '#FFFFFF', { 'text-anchor': 'start', stroke: '#151515', 'stroke-width': 10, 'paint-order': 'stroke', 'letter-spacing': 4 }), 'translate(80 96)', { opacity: f(pk) });
  o += K.C.whiteFlash(0.8 * seg(t, END - 0.18, END));
  return o;
}

// ================================================================= dispatch
const SHOTS = [
  [C.open, shCity], [C.board, shBoard], [C.arena, shArena], [C.momClose, shMomClose], [C.water, shWater], [C.granny, shGranny], [C.workers, shWorkers],
  [C.faster, shFaster], [C.rush, shRush], [C.cash, shCash], [C.dad, shWallWide], [C.wallClose, shWallClose], [C.timer, shTimer], [C.realDad, shRealDad],
  [C.noJump, shNoJump], [C.webcam, shWebcam], [C.emote, shEmote], [C.hero, shHero], [C.scream, shScream], [C.freeze, shFreeze], [C.rewind, shRewind],
  [C.breakfast, shBreakfast], [C.toDay, shToDay],
];
function shotAt(t) { let i = SHOTS.length - 1; while (i > 0 && t < SHOTS[i][0]) i--; return i; }
function scene(t) { return SHOTS[shotAt(t)][1](t); }
function look(t) {
  if (t >= C.breakfast && t < C.toDay + 0.5) return { grade: 'warm', vignette: 0.7 };
  if (t >= C.toDay + 0.5) return { grade: null, vignette: 0.45 };
  if (t >= C.realDad && t < C.noJump) return { grade: null, vignette: 0.95 };
  if (t >= C.webcam && t < C.emote) return { grade: null, vignette: 0.8 };
  if (t >= C.freeze && t < C.breakfast) return { grade: null, vignette: 0.5 };
  return { grade: 'cool', vignette: 0.8 };
}
function captionY(t) { return 1010; }

const DEFS = E.DEFS;
module.exports = { scene, look, captionY, DEFS, CUT: C, BEATS: b, timing };
