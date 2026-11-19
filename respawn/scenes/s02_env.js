// Private helpers for SC 02 («ТЫ ОЧЕНЬ БОИШЬСЯ ОШИБИТЬСЯ»): the voice-driven cut list (shared with audio/cues/gen_sc02.js),
// transitions, character intro tags, the hero's player card + fear meter, speech/thought bubbles, the BA-DUM TSS drum kit,
// the mushroom, the kindergarten polaroid, the talent-show poster, the "no checkpoint" toast, smoke, zipper.
'use strict';

const V = require('./vo');
const { L } = V;

// ================================================================= timing (pure: only the voice timeline)
// Every cut and beat of the scene, computed from the voice. audio/cues/gen_sc02.js requires this too.
function timing() {
  const A = Array.from({ length: 11 }, (_, i) => L('02a.' + i));
  const B = Array.from({ length: 11 }, (_, i) => L('02b.' + i));
  const wa = (i, w, n = 0) => A[i].word(w, n).t0, wa1 = (i, w, n = 0) => A[i].word(w, n).t1;
  const wb = (i, w, n = 0) => B[i].word(w, n).t0, wb1 = (i, w, n = 0) => B[i].word(w, n).t1;
  const T0 = V.scene('SC 02').start, END = V.scene('SC 03').start;
  const C = {};
  C.open = T0;                                    // Monday, Mr. Fig's class: push in, freeze on "you" + YOU tag
  C.card = wa(0, 'old') - 0.1;                    // the player card: AGE / SMART / FUNNY / FEAR
  C.board = A[1].a - 0.15;                        // Mr. Fig at the board: "Anyone?"
  C.blank = wa(1, 'Seven') - 0.08;                // the class: blank faces
  C.hero = A[2].a - 0.12;                         // the hero whispers 56, hand twitches
  C.whatif = wa(2, 'But') - 0.1;                  // imagination: WRONG! everybody laughs
  C.know = A[3].a - 0.1;                          // triptych: he always knows
  C.never = wa(3, 'You', 1) - 0.1;                // zipped mouth, twitching hand
  C.wrong = wa(3, 'Because') - 0.1;               // slow push-in, sweat
  C.shout = A[3].b - 0.08;                        // the neighbour: FIFTY-SIX!
  C.slide = Math.max(C.shout + 0.5, wa(4, 'fifty-six') - 0.05);   // CORRECT! the hero slides under the desk
  C.games = wa(5, 'games') - 0.1;                 // whip: his room, headphones, screaming happily
  C.obby = wa(5, 'fearless') - 0.15;              // inside the Mega Obby: fearless leap + flip
  C.obby2 = wa(5, 'Because') - 0.1;               // the jump, the lava, the respawn
  C.hop = A[6].a - 0.1;                           // kitchen: hopping on the spot for a checkpoint
  C.checked = wa(6, 'You') - 0.1;                 // close: CHECKPOINT NOT FOUND
  C.dad = A[7].a - 0.1;                           // Dad flips + DAD tag
  C.mornings = wa(7, 'He') - 0.1;                 // MON / TUE / WED split
  C.same = wa(7, 'and') - 0.1;                    // the table: SAME JOKE TOLD counter
  C.why = A[8].a - 0.1;                           // Dad: why did the pancake...
  C.along = wa(8, 'go') - 0.08;                   // hero + Bea (+ Gary) mouth along
  C.because = wa(8, 'Because') - 0.1;             // Dad builds up
  C.flat = wa(8, 'FLAT') - 0.05;                  // smash: FLAT! + BA-DUM TSS
  C.bea = A[9].a;                                 // the table, push to Bea + BEA tag
  C.six = wa(9, "She's") - 0.1;                   // Bea close: LIES TOLD 0
  C.hair = A[10].a - 0.1;                         // Bea turns to the hero
  C.mush = wa(10, 'mushroom') - 0.05;             // the hair = a mushroom
  C.sad = wa(10, 'A', 1) - 0.1;                   // a SAD mushroom
  C.gary = B[0].a - 0.1;                          // Gary's bowl + GARY tag
  C.seen = wb(0, 'Gary', 2) - 0.15;               // extreme close-up: Gary has seen things
  C.mom = B[1].a - 0.15;                          // Mom runs through, kisses
  C.remember = wb(1, 'Remember') - 0.15;          // Mom at the back door
  C.mumble = B[2].a - 0.1;                        // the hero mumbles
  C.ivy = B[3].a - 0.1;                           // the garage lab + IVY tag
  C.kinder = wb(3, 'Your') - 0.1;                 // kindergarten polaroid
  C.builds = wb(3, 'She') - 0.1;                  // Ivy presents the rocket sneakers
  C.launch = wb(3, 'They') - 0.12;                // ignition -> wall -> BOOM
  C.alot = wb(3, 'A') - 0.1;                      // chalkboard: DAYS SINCE LAST EXPLOSION 0 (a stray sneaker whizzes past)
  C.boom2 = wb(3, 'lot') + 0.55;                  // the silent beat: the stray sneaker hits the BOOM? box — explosion #2
  C.soot = B[4].a - 0.1;                          // sooty Ivy + the Book of Fails, FAIL #312
  C.book = wb(4, 'Lesson') - 0.1;                 // the page: LESSON
  C.indoors = wb(4, 'indoors') - 0.1;             // the sneaker falls on her head
  C.how = B[5].a - 0.1;                           // the hero: how are you HAPPY?
  C.lesson = B[6].a - 0.1;                        // Ivy: one more way it doesn't work
  C.anyway = wb(6, 'Anyway') - 0.1;               // whip: Big news!
  C.poster = B[7].a - 0.1;                        // the poster reveal
  C.whole = wb(7, 'In') - 0.1;                    // imagination: the WHOLE school
  C.horror = B[8].a - 0.1;                        // the hero: The WHOLE school?!
  C.mess = wb(8, 'Ivy') - 0.1;                    // panic two-shot
  C.flash = wb(8, 'mess') - 0.05;                 // imagination flash: crumble on stage, NO RESPAWN
  C.fun = B[9].a - 0.1;                           // Ivy: that's the fun part!
  C.stare = B[9].b + 0.1;                         // the horrified stare into the camera
  // keep the cuts in order even if the real voice squeezes them (min 0.2 s per shot)
  const ks = Object.keys(C);
  for (let i = 1; i < ks.length; i++) if (C[ks[i]] < C[ks[i - 1]] + 0.2) C[ks[i]] = C[ks[i - 1]] + 0.2;

  const b = {
    // classroom
    you: wa(0, 'you'), twelve: wa(0, 'Twelve'), smart: wa(0, 'smart'), funny: wa(0, 'funny'), very: wa(0, 'VERY'), scared: wa(0, 'scared'), messing: wa(0, 'messing'),
    anyone: wa(1, 'Anyone'), seven: wa(1, 'Seven'), eight: wa(1, 'eight'),
    fifty: wa(2, 'Fifty-six'), its: wa(2, "It's"), fifty2: wa(2, 'fifty-six', 1), what: wa(2, 'what'), not: wa(2, 'not'),
    always: wa(3, 'always'), know: wa(3, 'know'), answer: wa(3, 'answer'), never: wa(3, 'never'), say: wa(3, 'say'), wrongW: wa(3, 'wrong'),
    s56: C.shout + 0.06, correct: C.slide + 0.04,
    // games
    games: wa(5, 'games'), fearless: wa(5, 'fearless'), fall: wa(5, 'fall'), respawn: wa(5, 'respawn'),
    feature: wa(6, 'feature'), checked: wa(6, 'checked'),
    // Dad
    dad: wa(7, 'Dad'), makes: wa(7, 'makes'), pancakes: wa(7, 'pancakes'), every: wa(7, 'every'), morning: wa(7, 'morning'), same: wa(7, 'same'), joke: wa(7, 'joke'),
    why: wa(8, 'Why'), doctor: wa(8, 'doctor'), because: wa(8, 'Because'), little: wa(8, 'little'), flat: wa(8, 'FLAT'), rim: Math.max(A[8].b, wa(8, 'FLAT') + 0.3),
    // Bea
    beaW: wa(9, 'Bea'), sixW: wa(9, 'six'), neverB: wa(9, 'never'), lie: wa(9, 'lie'),
    hairW: wa(10, 'hair'), mushroom: wa(10, 'mushroom'), sadW: wa(10, 'sad'), mushroom2: wa(10, 'mushroom', 1),
    // Gary, Mom
    gary: wb(0, 'Gary'), goldfish: wb(0, 'goldfish'), seen: wb(0, 'seen'), things: wb(0, 'things'),
    bye: wb(1, 'Bye'), loves: wb(1, 'loves'), long: wb(1, 'Long'), shift: wb(1, 'shift'), mistakes: wb(1, 'mistakes'), learn: wb(1, 'learn'), momOut: B[1].b + 0.12,
    laughed: wb(2, 'laughed'),
    // Ivy
    ivyW: wb(3, 'Ivy'), best: wb(3, 'best'), kinder: wb(3, 'kindergarten'), inventions: wb(3, 'inventions'), explode: wb(3, 'explode'), hit: wb(3, 'explode') + 0.12, lot: wb(3, 'lot'),
    failW: wb(4, 'Fail'), twelve2: wb(4, 'twelve'), rocket: wb(4, 'Rocket'), lessonW: wb(4, 'Lesson'), learned: wb(4, 'learned'), neverW: wb(4, 'never'), wear: wb(4, 'wear'), sneakers2: wb(4, 'sneakers', 1), indoors: wb(4, 'indoors'), indoors1: wb1(4, 'indoors'),
    happy: wb(5, 'HAPPY'),
    now: wb(6, 'now'), work: wb(6, 'work'), anyway: wb(6, 'Anyway'), big: wb(6, 'Big'), news: wb(6, 'news'),
    signed: wb(7, 'signed'), up: wb1(7, 'up'), talent: wb(7, 'talent'), show: wb(7, 'show'), friday: wb(7, 'Friday'), whole: wb(7, 'WHOLE'), school: wb(7, 'school'),
    whole2: wb(8, 'WHOLE'), ivy2: wb(8, 'Ivy'), mess: wb(8, 'mess'),
    then: wb(9, 'Then'), mess3: wb(9, 'mess'), funW: wb(9, 'fun'), part: wb(9, 'part'),
    forW: B[10].a, notW: wb(10, 'not'), fun2: wb(10, 'fun'), part2: wb(10, 'part'),
  };
  return { A, B, C, b, T0, END };
}

// ================================================================= drawing helpers
const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const LINE = '#151515';
const W = 1920, H = 1080;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const TS = (txt, x, y, size, fill, extra = {}) => T(esc(txt), x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const TFS = (txt, x, y, size, fill, extra = {}) => TF(esc(txt), x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.14, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const pop = (t, t0, d = 0.28) => ease.outBack(seg(t, t0, t0 + d));
// camera that centres world (wx, wy) at screen centre with zoom
const at = (wx, wy, zoom = 1) => ({ zoom, x: wx - 960, y: wy - 540 });
// world point -> screen for a cam at parallax 1
const toScr = (cam, x, y) => { const z = cam.zoom ?? 1; return [960 + (cam.sx || 0) + z * (x - 960 - (cam.x || 0)), 540 + (cam.sy || 0) + z * (y - 540 - (cam.y || 0))]; };
function shakeAll(cam, t, list) {
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); cam.sx = (cam.sx || 0) + s.sx; cam.sy = (cam.sy || 0) + s.sy; }
  return cam;
}
function clipTo(x, y, w, h, inner, r = 0) {
  const id = S.uid('s02c');
  return S.clipDef(id, S.rect(x, y, w, h, r)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
}
function clipPath(d, inner) {
  const id = S.uid('s02p');
  return S.clipDef(id, S.path(d)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
}
// feet y that puts a rig character's face centre at screen y fy (size = the design's size factor)
const faceAt = (fy, s, size = 1) => fy + 690 * s * size;
// scale a group about a screen point
const zoomAbout = (svg, cx, cy, z) => (Math.abs(z - 1) < 1e-4 ? svg : S.g(svg, `translate(${f(cx)} ${f(cy)}) scale(${f(z)}) translate(${f(-cx)} ${f(-cy)})`));
// automatic blink value for a cheap character
const blinkV = (t, seed = 0) => { const u = (t + seed * 0.37) % 3.7; return u < 0.12 ? Math.sin((u / 0.12) * Math.PI) : 0; };
// squash/stretch impulse after t0
function boing(t, t0, amp = 0.2, dur = 0.7) {
  const k = t - t0;
  if (k < 0 || k > dur) return { sx: 1, sy: 1 };
  const v = amp * Math.exp(-k * 7) * Math.cos(k * 20);
  return { sx: 1 - v * 0.6, sy: 1 + v };
}

// ---------------------------------------------------------------- transitions
function whip(t, tc, dir = 1, dur = 0.1) {
  const d = t - tc;
  if (Math.abs(d) > dur) return '';
  const k = 1 - Math.abs(d) / dur;
  let p = '';
  for (let i = 0; i < 16; i++) {
    const y = hash(i * 3.7) * H, len = 300 + hash(i) * 700, th = 8 + hash(i * 2.2) * 16;
    const x = ((hash(i * 5.1) * 2600 + dir * d * 16000) % 2600 + 2600) % 2600 - 400;
    p += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.rect(0, 0, W, H, 0, { fill: '#FFFFFF', opacity: f(0.6 * k) }) + S.path(p, { fill: '#FFFFFF', opacity: f(0.85 * k) });
}
const smash = (t, tc, dur = 0.14, a = 0.75) => (t >= tc && t < tc + dur ? K.C.whiteFlash(a * (1 - (t - tc) / dur)) : '');
// radial zoom lines around (cx, cy) for punchlines (k 0..1)
function zoomLines(cx, cy, k, t, col = '#FFFFFF', n = 22, r0 = 380) {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i * 3.1) * 0.2, rr = r0 + hash(i + Math.floor(t * 12)) * 160, r1 = rr + 600;
    const w = 10 + hash(i * 1.7) * 14;
    const ax = Math.cos(a), ay = Math.sin(a), nx = -ay * w, ny = ax * w;
    d += `M${f(cx + ax * rr)} ${f(cy + ay * rr)}L${f(cx + ax * r1 + nx)} ${f(cy + ay * r1 + ny)}L${f(cx + ax * r1 - nx)} ${f(cy + ay * r1 - ny)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.75 * k) });
}
// speed streaks across the frame (whip-pan inside a shot), k 0..1
function streaks(k, dir = 1, seed = 1, col = '#FFFFFF') {
  if (k <= 0.01) return '';
  let p = '';
  for (let i = 0; i < 14; i++) {
    const y = hash(i * 3.7 + seed) * H, len = 400 + hash(i + seed) * 900, th = 6 + hash(i * 2.2 + seed) * 14;
    const x = hash(i * 5.1 + seed) * 2400 - 300;
    p += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.path(p, { fill: col, opacity: f(0.7 * k) });
}

// ---------------------------------------------------------------- character intro tag
// big chunky name pill that slams in (rotated, overshoot) + a dark sub ribbon + an optional pointer to (ax, ay)
function nameCard(t, t0, x, y, name, sub, col = '#FF5A3D', o = {}) {
  const k = pop(t, t0, 0.32);
  if (k <= 0.01) return '';
  const out = o.tOut !== undefined ? ease.in(seg(t, o.tOut, o.tOut + 0.22)) : 0;
  if (out >= 1) return '';
  const size = o.size || 104;
  const w = Math.max(240, name.length * size * 0.58 + 90), h = size * 1.18;
  const rot = (o.rot ?? -5) + 8 * (1 - seg(t, t0, t0 + 0.25));
  let g = '';
  if (o.ax !== undefined) {
    // pointer: a fat tapered arrow from the pill toward the character
    const dx = o.ax - x, dy = o.ay - y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
    const sx = x + ux * (w * 0.32), sy = y + uy * (h * 0.4), ex = o.ax - ux * 30, ey = o.ay - uy * 30;
    const nx = -uy, ny = ux;
    const d = `M${f(sx + nx * 26)} ${f(sy + ny * 26)} L${f(ex - ux * 40 + nx * 16)} ${f(ey - uy * 40 + ny * 16)} L${f(ex - ux * 40 + nx * 40)} ${f(ey - uy * 40 + ny * 40)} L${f(ex)} ${f(ey)} L${f(ex - ux * 40 - nx * 40)} ${f(ey - uy * 40 - ny * 40)} L${f(ex - ux * 40 - nx * 16)} ${f(ey - uy * 40 - ny * 16)} L${f(sx - nx * 26)} ${f(sy - ny * 26)} Z`;
    const ak = seg(t, t0 + 0.12, t0 + 0.36);
    if (ak > 0) g += S.g(S.path(d, ol('#FFFFFF', 7)), null, { opacity: f(ak * (1 - out)) });
  }
  let p = S.rect(-w / 2 + 12, -h / 2 + 16, w, h, h * 0.34, { fill: '#000', opacity: 0.3 });
  p += S.rect(-w / 2, -h / 2, w, h, h * 0.34, ol(col, 9));
  p += S.rect(-w / 2 + 14, -h / 2 + 12, w - 28, h * 0.3, h * 0.15, { fill: '#FFFFFF', opacity: 0.22 });
  p += TS(name, 0, size * 0.36, size, '#FFFFFF');
  if (sub) {
    const sw = Math.max(200, sub.length * 19 + 64), sk = pop(t, t0 + (o.subDelay ?? 0.14), 0.26);
    if (sk > 0.01) p += S.g(S.rect(-sw / 2, -24, sw, 50, 16, ol('#1E1A2E', 6)) + TF(esc(sub), 0, 11, 30, o.subCol || '#FFE14D'), `translate(${f(o.subDx ?? 30)} ${f(h / 2 + 22)}) rotate(3) scale(${f(sk)})`);
  }
  // corner sparkles on the slam
  const sp = bump(t, t0 + 0.05, t0 + 0.55);
  if (sp > 0) p += K.F.sparkle(-w / 2 - 10, -h / 2 - 6, 30 * sp, '#FFFFFF') + K.F.sparkle(w / 2 + 6, -h / 2 + 4, 22 * sp, '#FFE14D') + K.F.sparkle(w / 2 - 20, h / 2 + 4, 18 * sp, '#FFFFFF');
  g += S.g(p, `${tf(x, y + 60 * out, k * (1 - 0.3 * out), rot)}`, out > 0 ? { opacity: f(1 - out) } : {});
  return g;
}

// ---------------------------------------------------------------- bubbles
function speech(x, y, txt, k, o = {}) {
  if (k <= 0.01) return '';
  const size = o.size || 64, w = o.w || txt.length * size * 0.56 + 80, h = size * 1.5;
  const tx = o.tail ?? -1, col = o.col || '#FFFFFF', ink = o.ink || '#1E1A2E';
  let g = S.path(`M${f(tx * w * 0.18 - 26)} ${f(h / 2 - 8)} L${f(tx * (w * 0.32 + 30))} ${f(h / 2 + 60)} L${f(tx * w * 0.18 + 30)} ${f(h / 2 - 8)} Z`, ol(col, 7));
  g += S.rect(-w / 2, -h / 2, w, h, h * 0.42, ol(col, 7)) + S.path(`M${f(tx * w * 0.18 - 20)} ${f(h / 2 - 4)} L${f(tx * w * 0.18 + 24)} ${f(h / 2 - 4)}`, { stroke: col, 'stroke-width': 12 });
  g += T(esc(txt), 0, size * 0.36, size, ink);
  return S.g(g, tf(x, y, ease.outBack(clamp(k, 0, 1)), o.rot || 0));
}
// cloud-shaped thought bubble (w x h) with three trailing puffs toward (tx, ty) (relative)
function thought(x, y, w, h, k, inner = '', o = {}) {
  if (k <= 0.01) return '';
  const n = 12;
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, r = 0.5 + 0.08 * hash(i * 3.3 + (o.seed || 0));
    d += `M${f(Math.cos(a) * w * 0.46 - w * r * 0.22)} ${f(Math.sin(a) * h * 0.44)} a${f(w * r * 0.22)} ${f(h * r * 0.3)} 0 1 1 ${f(w * r * 0.44)} 0 a${f(w * r * 0.22)} ${f(h * r * 0.3)} 0 1 1 ${f(-w * r * 0.44)} 0Z`;
  }
  const col = o.col || '#FFFFFF';
  let g = S.path(d, { fill: col, stroke: LINE, 'stroke-width': 7 }) + S.ellipse(0, 0, w * 0.47, h * 0.44, { fill: col });
  const [px, py] = o.tail || [-w * 0.3, h * 0.75];
  for (let i = 0; i < 3; i++) { const u = 0.45 + i * 0.25; g += S.ellipse(px * u, py * u, 26 - i * 7, 20 - i * 5, ol(col, 6)); }
  g += inner;
  return S.g(g, tf(x, y, ease.outBack(clamp(k, 0, 1))));
}

// ---------------------------------------------------------------- the player card (SC02 intro): AGE / SMART / FUNNY / FEAR
// k* are pop progress per row; fear 0..2+ (1 = full, >1 overflows past the card's right edge); crack 0..1
function playerCard(t, o = {}) {
  const x = o.x ?? 1010, y = o.y ?? 170, w = 820, h = 700;
  let g = S.rect(x + 16, y + 22, w, h, 46, { fill: '#000', opacity: 0.28 });
  g += S.rect(x, y, w, h, 46, ol('#1E1A2E', 10)) + S.rect(x + 14, y + 14, w - 28, h - 28, 36, { fill: 'none', stroke: '#FFD21F', 'stroke-width': 5 });
  g += S.rect(x, y, w, 150, 46, { fill: '#FF5A3D' }) + S.rect(x, y + 100, w, 50, 0, { fill: '#FF5A3D' }) + S.path(`M${x} ${y + 150} H${x + w}`, ln(8));
  g += S.rect(x, y, w, 150, 46, { fill: 'none', stroke: LINE, 'stroke-width': 10 });
  g += TS('YOU', x + 230, y + 112, 110, '#FFFFFF');
  g += S.g(S.rect(-110, -30, 220, 60, 20, ol('#FFD21F', 6)) + T('PLAYER 1', 0, 16, 40, '#1E1A2E'), tf(x + w - 170, y + 76, 1, 4));
  const row = (i, k, label, val) => {
    if (k <= 0.01) return '';
    const ry = y + 230 + i * 128;
    let r = TF(label, 0, 0, 46, '#9AA6C0', { 'text-anchor': 'start', 'letter-spacing': 2 }) + val;
    return S.g(r, `translate(${f(x + 60 + 120 * (1 - ease.out(clamp(k, 0, 1))))} ${f(ry)})`, { opacity: f(clamp(k * 1.6, 0, 1)) });
  };
  const stars = (n, filled, k) => {
    let s = '';
    for (let i = 0; i < n; i++) {
      const sk = clamp((k - i * 0.14) / 0.3, 0, 1);
      const on = i < filled;
      s += S.g(S.path(starD(30), ol(on ? '#FFD21F' : '#3A3550', 5)), tf(380 + i * 76, -16, 0.4 + 0.6 * ease.outBack(sk)));
    }
    return s;
  };
  g += row(0, o.kAge ?? 1, 'AGE', T('12', 330, 6, 84, '#FFFFFF', { 'text-anchor': 'start' }));
  g += row(1, o.kSmart ?? 1, 'SMART', stars(5, 4, (o.kSmart ?? 1) * 1.6));
  g += row(2, o.kFunny ?? 1, 'FUNNY', stars(5, 4, (o.kFunny ?? 1) * 1.6));
  // fear: a bar
  if ((o.kFear ?? 1) > 0.01) {
    const fk = o.kFear ?? 1, fear = o.fear ?? 0;
    const ry = y + 230 + 3 * 128 + 10;
    let r = TF('FEAR OF MESSING UP', x + 60, ry - 6, 40, '#FF8A7A', { 'text-anchor': 'start', 'letter-spacing': 1 });
    const bx = x + 60, by = ry + 18, bw = w - 120, bh = 70;
    const fw = bw * fear;
    const blink = fear > 1 ? (Math.floor(t * 10) % 2 ? '#FF2E3E' : '#FFD21F') : '#FF5A3D';
    r += S.rect(bx, by, bw, bh, 20, ol('#2A2440', 7));
    if (fw > 4) {
      r += S.rect(bx + 6, by + 6, Math.max(0, fw - 12), bh - 12, 14, { fill: blink, stroke: LINE, 'stroke-width': fear > 1 ? 6 : 0 });
      for (let i = 0; i * 60 < fw - 30; i++) r += S.path(`M${f(bx + 30 + i * 60)} ${by + 8} l-24 ${bh - 16}`, ln(10, '#FFFFFF', 0.25));
    }
    if (fear > 1) r += TS('MAX!!!', bx + Math.min(fw, 2100) - 90, by - 24, 64, '#FFD21F', { transform: `rotate(-8 ${f(bx + Math.min(fw, 2100) - 90)} ${f(by - 24)})` });
    g += S.g(r, null, { opacity: f(clamp(fk * 1.8, 0, 1)) });
  }
  if ((o.crack ?? 0) > 0) {
    const c = o.crack;
    const cx = x + w - 60, cy = y + h - 120;
    let d = '';
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI * 0.5 - i * 0.45 + hash(i) * 0.3, L1 = (120 + 220 * hash(i * 3)) * c;
      d += `M${cx} ${cy} l${f(Math.cos(a) * L1 * 0.5)} ${f(Math.sin(a) * L1 * 0.5 + 10)} l${f(Math.cos(a + 0.3) * L1 * 0.5)} ${f(Math.sin(a + 0.3) * L1 * 0.5)}`;
    }
    g += S.path(d, ln(6, '#FFFFFF', 0.9)) + S.path(d, ln(2.5, LINE, 0.8));
  }
  return g;
}
function starD(r) {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.46 : r; d += (i ? 'L' : 'M') + f(Math.cos(a) * rr) + ' ' + f(Math.sin(a) * rr); }
  return d + 'Z';
}

// ---------------------------------------------------------------- BA-DUM TSS drum kit (bottom-right corner pop-in)
// k 0..1 pops it in; hit = seconds since the "TSS" (cymbal crash)
function drumKit(x, y, s, t, k, hit) {
  if (k <= 0.01) return '';
  let g = '';
  // hi-hat / cymbal on a stand (right)
  const wob = hit > 0 ? Math.exp(-hit * 4) * Math.sin(hit * 30) * 14 : 0;
  g += S.path('M150 140 L150 -60 M110 140 L150 60 L190 140', ln(8, '#8A93A6')) + S.path('M150 140 L150 -60 M110 140 L150 60 L190 140', ln(3, '#C9D2DC'));
  g += S.g(S.ellipse(0, 0, 110, 18, ol('#FFC93C', 6)) + S.ellipse(0, -3, 30, 7, { fill: '#E0A21A' }) + S.path('M-80 -4 Q0 -14 80 -4', ln(4, '#FFF4C4')), `translate(150 -66) rotate(${f(wob)})`);
  // snare (left) + bass drum behind
  g += S.ellipse(-40, 40, 150, 120, ol('#2E7BFF', 7)) + S.ellipse(-40, 40, 110, 86, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 6, opacity: 0.6 }) + T('BA-DUM', -40, 56, 42, '#FFFFFF', { opacity: 0.85 });
  g += S.path('M-170 60 L-170 120 Q-90 150 -10 120 L-10 60 Z', ol('#E8243C', 6)) + S.ellipse(-90, 60, 80, 22, ol('#F4F4F8', 6));
  for (let i = 0; i < 5; i++) g += S.path(`M${-162 + i * 36} 76 L${-162 + i * 36} 126`, ln(4, '#FFD21F'));
  // sticks: the left one hits the snare, the right one the cymbal (on hit)
  const sw1 = hit > -0.35 && hit < 0 ? Math.sin(((hit + 0.35) / 0.35) * Math.PI * 2) * 22 : 0;
  const sw2 = hit >= 0 && hit < 0.25 ? 26 * (1 - hit / 0.25) : 0;
  g += S.g(S.path('M0 0 L-150 -40', ln(14, '#7A4A2A')) + S.path('M0 0 L-150 -40', ln(7, '#E8C08A')), `translate(-10 -20) rotate(${f(-sw1)})`);
  g += S.g(S.path('M0 0 L150 -50', ln(14, '#7A4A2A')) + S.path('M0 0 L150 -50', ln(7, '#E8C08A')), `translate(40 -100) rotate(${f(sw2 - 10)})`);
  return S.g(g, tf(x, y, s * ease.outBack(clamp(k, 0, 1)), -4));
}

// ---------------------------------------------------------------- the mushroom (orange cap like the bowl cut, white stem with a face)
function mushroom(x, y, s, o = {}) {
  const sad = o.sad || 0, rot = o.rot || 0, droop = sad * 18;
  let g = '';
  // stem
  g += S.path('M-110 0 Q-130 -200 -90 -300 L90 -300 Q130 -200 110 0 Q0 30 -110 0 Z', ol('#FFF8EE', 9));
  // face
  const ey = -190 + 8 * sad;
  if (o.face !== false) {
    g += S.ellipse(-42, ey, 26, 32, ol('#FFFFFF', 6)) + S.ellipse(42, ey, 26, 32, ol('#FFFFFF', 6));
    g += S.circle(-40, ey + 6 + 6 * sad, 9, { fill: LINE }) + S.circle(40, ey + 6 + 6 * sad, 9, { fill: LINE });
    if (sad > 0.2) g += S.path(`M-74 ${ey - 44} L-20 ${ey - 34 - 18 * sad} M74 ${ey - 44} L20 ${ey - 34 - 18 * sad}`, ln(8));
    g += sad > 0.2 ? S.path(`M-34 ${ey + 86} Q0 ${ey + 60} 34 ${ey + 86}`, ln(8)) : S.path(`M-34 ${ey + 70} Q0 ${ey + 92} 34 ${ey + 70}`, ln(8));
  }
  // cap: big rounded dome in the hero's hair orange with dark strand lines + white spots
  const cap = `M-300 ${-250 + droop} Q-310 -420 -170 -500 Q0 -580 170 -500 Q310 -420 300 ${-250 + droop} Q240 ${-280 + droop * 0.5} 150 -290 Q0 -300 -150 -290 Q-240 ${-280 + droop * 0.5} -300 ${-250 + droop} Z`;
  g += S.path(cap, ol('#C6531B', 10));
  g += S.path('M-160 -470 Q-60 -530 60 -520', ln(14, '#E8823C', 0.8));
  g += S.path(`M-200 -460 Q-230 -360 -210 ${-290 + droop * 0.4} M210 -460 Q230 -360 210 ${-290 + droop * 0.4} M-60 -520 Q-80 -420 -70 -300 M60 -520 Q80 -420 70 -300`, ln(6, '#7A2E10', 0.6));
  g += S.circle(-120, -420, 34, ol('#FFF8EE', 6)) + S.circle(110, -450, 26, ol('#FFF8EE', 6)) + S.circle(10, -480, 18, ol('#FFF8EE', 5));
  return S.g(g, tf(x, y, s, rot));
}

// ---------------------------------------------------------------- small toast: CHECKPOINT NOT FOUND (grey, red X)
function notFound(x, y, k, o = {}) {
  if (k <= 0.01) return '';
  const txt = o.text || 'CHECKPOINT NOT FOUND', w = txt.length * 24 + 150;
  let g = S.rect(-w / 2 + 8, -38 + 10, w, 84, 30, { fill: '#000', opacity: 0.25 });
  g += S.rect(-w / 2, -42, w, 84, 30, ol('#3A3F52', 7)) + S.rect(-w / 2 + 10, -32, w - 20, 22, 11, { fill: '#FFFFFF', opacity: 0.1 });
  g += S.circle(-w / 2 + 50, 0, 26, ol('#FF3B4E', 5)) + S.path(`M${-w / 2 + 39} -11 l22 22 m0 -22 l-22 22`, ln(7, '#FFFFFF'));
  g += TF(txt, 30, 14, 40, '#E9EDF3', { 'letter-spacing': 1 });
  return S.g(g, tf(x, y, ease.outBack(clamp(k, 0, 1)), o.rot || -2), o.out ? { opacity: f(1 - o.out) } : {});
}

// ---------------------------------------------------------------- smoke puffs (cheap, batched), age in s
function smokeCloud(x, y, age, o = {}) {
  if (age < 0) return '';
  const n = o.n || 9, R0 = o.r || 90, life = o.life || 2.2, seed = o.seed || 1, col = o.col || '#8E8898';
  let d = '', d2 = '';
  for (let i = 0; i < n; i++) {
    const a = hash(i * 3.1 + seed) * Math.PI * 2, sp = (0.5 + hash(i * 7.3 + seed)) * (o.spread || 260);
    const u = clamp(age / life, 0, 1), e = ease.out(clamp(age / 0.6, 0, 1));
    const px = x + Math.cos(a) * sp * e + (o.drift || 0) * age, py = y + Math.sin(a) * sp * 0.6 * e - (o.rise ?? 80) * age;
    const r = R0 * (0.6 + 0.6 * hash(i * 1.7 + seed)) * (0.5 + 0.9 * e) * (1 - 0.3 * u);
    if (r < 2) continue;
    d += `M${f(px - r)} ${f(py)}a${f(r)} ${f(r)} 0 1 1 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 1 ${f(-2 * r)} 0Z`;
    d2 += `M${f(px - r * 0.62)} ${f(py - r * 0.3)}a${f(r * 0.42)} ${f(r * 0.3)} 0 1 1 ${f(r * 0.84)} 0a${f(r * 0.42)} ${f(r * 0.3)} 0 1 1 ${f(-r * 0.84)} 0Z`;
  }
  const op = clamp(1 - (age - life * 0.6) / (life * 0.4), 0, 1) * (o.op ?? 1);
  if (op <= 0.01) return '';
  // one merged puffy silhouette: the outline pass under a stroke-less fill pass (no inner rings)
  return S.g(S.path(d, { fill: LINE, stroke: LINE, 'stroke-width': 12 }) + S.path(d, { fill: col }) + S.path(d2, { fill: '#FFFFFF', opacity: 0.22 }), null, { opacity: f(op) });
}

// fiery starburst under an explosion's smoke (k 0..1 over ~0.4 s)
function fireBurst(x, y, k, s = 1, seed = 1) {
  if (k <= 0 || k >= 1) return '';
  const star = (r0, r1, n, rot) => {
    let d = '';
    for (let i = 0; i < n * 2; i++) { const a = rot + (i / (n * 2)) * Math.PI * 2, r = i % 2 ? r0 : r1 * (0.8 + 0.4 * hash(i * 1.3 + seed)); d += (i ? 'L' : 'M') + f(x + Math.cos(a) * r) + ' ' + f(y + Math.sin(a) * r); }
    return d + 'Z';
  };
  const e = ease.out(k), R = 360 * s * (0.4 + 0.6 * e), op = 1 - ease.in(k);
  return S.g(S.path(star(R * 0.45, R, 11, k), { fill: '#FF5A1F', stroke: LINE, 'stroke-width': 8 }) + S.path(star(R * 0.3, R * 0.68, 9, 0.3 + k), { fill: '#FFD21F' }) + S.circle(x, y, R * 0.28, { fill: '#FFFFFF' }), null, { opacity: f(op) });
}

// ---------------------------------------------------------------- the zipper over the mouth (k 0..1 = zipping shut)
function zipper(x, y, s, k) {
  if (k <= 0.01) return '';
  const w = 180;
  let g = S.path(`M${-w / 2} 0 H${w / 2}`, ln(16, '#8A93A6')) + S.path(`M${-w / 2} 0 H${w / 2}`, ln(5, LINE));
  let teeth = '';
  for (let i = 0; i < 12; i++) teeth += `M${f(-w / 2 + 8 + i * 15)} -8 v16 `;
  g += S.path(teeth, ln(4, '#C9D2DC'));
  const px = -w / 2 + w * ease.inOut(clamp(k, 0, 1));
  g += S.g(S.rect(-14, -18, 28, 36, 6, ol('#C9D2DC', 4)) + S.rect(-8, 16, 16, 38, 6, ol('#8A93A6', 4)), `translate(${f(px)} 0)`);
  return S.g(g, tf(x, y, s), { opacity: f(clamp(k * 4, 0, 1)) });
}

// ---------------------------------------------------------------- the talent show poster (centre x, top y), ~900 x 1240
// o: { unroll 0..1, hand 0..1 (Ivy's handwriting scribbled in), friday 0..1 (stamp bump) }
function talentPoster(x, y, s, t, o = {}) {
  const pw = 900, ph = 1240;
  const un = clamp(o.unroll ?? 1, 0, 1), vis = ph * ease.out(un);
  let p = '';
  p += S.rect(-pw / 2, 0, pw, ph, 18, ol('#4B2A8C', 9));
  // star field
  let st = '';
  for (let i = 0; i < 22; i++) st += `M${f(-pw / 2 + 40 + hash(i * 3.3) * (pw - 80))} ${f(40 + hash(i * 5.1) * (ph - 80))} m-6 0 l6 -12 l6 12 l-6 12 Z `;
  p += S.path(st, { fill: '#FFD21F', opacity: 0.45 });
  // marquee header
  p += TS('SCHOOL', 0, 120, 70, '#FFFFFF');
  p += S.rect(-380, 150, 760, 210, 40, ol('#D8262E', 8)) + S.rect(-362, 166, 724, 178, 30, { fill: 'none', stroke: '#FFD21F', 'stroke-width': 6, 'stroke-dasharray': '2 26', 'stroke-linecap': 'round' });
  p += TS('TALENT', 0, 248, 104, '#FFD21F') + TS('SHOW', 0, 340, 96, '#FFFFFF');
  // comet
  p += S.path('M250 470 Q120 470 -60 520 Q140 500 250 500 Z', { fill: '#FFD21F', opacity: 0.7 }) + S.g(S.path(starD(56), ol('#FFD21F', 6)), 'translate(280 482)');
  // FRIDAY ribbon
  const fb = o.friday || 0;
  p += S.g(S.rect(-300, -56, 600, 112, 24, ol('#3DDC84', 8)) + TS('FRIDAY!', 0, 32, 92, '#FFFFFF'), tf(-40, 600, 1 + 0.25 * bump(fb, 0, 1) * (fb < 1 ? 1 : 0), -4));
  p += TF('7 PM · AUDITORIUM · EVERYONE WELCOME!', 0, 720, 34, '#E9D8FF');
  // sign-up lines
  p += S.rect(-380, 760, 760, 300, 20, ol('#FFF8EC', 6));
  p += TF('SIGN UP:', -350, 806, 32, '#4B2A8C', { 'text-anchor': 'start' });
  const acts = ['1. Juggling — Mia', '2. Beatbox — Theo', '3. Yo-yo — Sam'];
  acts.forEach((a, i) => { p += TF(a, -350, 852 + i * 40, 30, '#2A3A6A', { 'text-anchor': 'start', opacity: 0.8 }); });
  p += S.path('M-350 1000 H350', ln(3, '#9FC4E8'));
  // Ivy's handwriting (green marker), scribbled in
  const hk = clamp(o.hand ?? 1, 0, 1);
  if (hk > 0) {
    const id = S.uid('s02h');
    const tw = 780 * hk;
    p += S.clipDef(id, S.rect(-390, 960, tw, 280));
    let hw = S.g(T('4. IVY &amp; YOU:', -350, 1012, 50, '#1E9A4A', { 'text-anchor': 'start' }), 'rotate(-2 -350 1012)');
    hw += S.g(T('SCIENCE MAGIC!', 20, 1150, 96, '#1E9A4A', { stroke: '#FFFFFF', 'stroke-width': 10, 'paint-order': 'stroke' }), 'rotate(-4 20 1150)');
    hw += S.path('M-300 1170 Q20 1196 340 1160', ln(8, '#1E9A4A'));
    // doodles: flask + top hat + heart
    hw += S.g(S.path('M-14 -50 L14 -50 L14 -10 L44 40 Q50 52 36 52 L-36 52 Q-50 52 -44 40 L-14 -10 Z', ol('#B8F5D0', 5)) + S.path('M-34 30 L34 30', ln(5, '#1E9A4A')), 'translate(-330 1110) rotate(-10) scale(0.9)');
    hw += S.g(S.rect(-40, -60, 80, 60, 6, ol('#1E1A2E', 5)) + S.rect(-62, -2, 124, 16, 6, ol('#1E1A2E', 5)) + S.rect(-40, -24, 80, 12, 0, { fill: '#D8262E' }), 'translate(380 1080) rotate(12) scale(0.8)');
    hw += S.path('M300 980 c-20 -30 -60 -10 -40 20 l40 40 l40 -40 c20 -30 -20 -50 -40 -20 Z', ol('#FF6FA8', 5));
    p += S.g(hw, null, { 'clip-path': `url(#${id})` });
  }
  // unroll: clip to the visible part + the roll at the bottom edge
  let out = clipTo(-pw / 2 - 20, -20, pw + 40, vis + 20, p);
  if (un < 1) out += S.rect(-pw / 2 - 16, vis - 30, pw + 32, 60, 30, ol('#6B4AAC', 7)) + S.path(`M${-pw / 2} ${f(vis - 10)} H${pw / 2}`, ln(4, '#FFFFFF', 0.3));
  return S.g(out, tf(x, y, s, o.rot || 0));
}

// ---------------------------------------------------------------- the kindergarten polaroid (centre), inner = svg drawn in a 760x620 box at (-380,-360)
function polaroid(x, y, s, rot, inner, caption) {
  let g = S.rect(-430 + 18, -410 + 24, 860, 900, 10, { fill: '#000', opacity: 0.3 });
  g += S.rect(-430, -410, 860, 900, 10, ol('#FFFDF6', 7));
  g += clipTo(-380, -360, 760, 620, S.rect(-380, -360, 760, 620, 0, { fill: '#BFE6F2' }) + inner);
  g += S.rect(-380, -360, 760, 620, 0, { fill: '#FFB86A', opacity: 0.12 }) + S.rect(-380, -360, 760, 620, 0, { fill: 'none', stroke: LINE, 'stroke-width': 5 });
  g += S.g(T(esc(caption), 0, 360, 58, '#2A3A6A'), 'rotate(-2)');
  // tape
  g += S.g(S.rect(-90, -26, 180, 52, 4, { fill: '#FFF2B0', opacity: 0.85, stroke: LINE, 'stroke-width': 3 }), 'translate(0 -410) rotate(-6)');
  return S.g(g, tf(x, y, s, rot));
}

// ---------------------------------------------------------------- "HA HA" echo letters (the class laughing in his head)
function haha(t, x, y, k, seed = 1) {
  if (k <= 0.01) return '';
  let g = '';
  for (let i = 0; i < 7; i++) {
    const a = hash(i * 3 + seed) * Math.PI * 2, r = 260 + 120 * hash(i * 5 + seed);
    const ph = (t * 0.6 + hash(i * 7 + seed)) % 1;
    const op = Math.sin(ph * Math.PI) * k;
    g += S.g(T('HA', 0, 0, 50 + 30 * hash(i), '#9AA6C0', { opacity: f(0.7 * op), stroke: LINE, 'stroke-width': 5, 'paint-order': 'stroke' }), tf(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6 - ph * 40, 1, (hash(i * 9) - 0.5) * 30));
  }
  return g;
}

module.exports = {
  timing,
  esc, tf, TS, TFS, pop, at, toScr, shakeAll, clipTo, clipPath, faceAt, zoomAbout, blinkV, boing,
  whip, smash, zoomLines, streaks,
  nameCard, speech, thought, playerCard, starD, drumKit, mushroom, notFound, smokeCloud, fireBurst, zipper, talentPoster, polaroid, haha,
};
