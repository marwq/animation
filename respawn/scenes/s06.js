// SC 06 · СЛИШКОМ ИДЕАЛЬНО — the emotional dip. Wednesday rehearsal in Ivy's workshop: "Elephant Toothpaste" (the easel,
// the chalk volcano, the hat burps); the hero mouths Ivy's lines and finishes them; the foam blasts him in the face -> a
// casual finger-snap reset (banner RESETTING), "and again" (the knocked flask rewinds ◀◀), "and again" (Ivy-POV fast pop, the
// RESETS counter rolls to 27); he hands Ivy the flask before she reaches, she laughs alone, the "VERSION 87" memory polaroid
// ("on the ceiling"); THURSDAY · VERSION 412: the same framing loops, colour drains, the frame shrinks into a wall of 412
// identical thumbnails; the perfect trick, the too-perfect hero. Then the quiet part: Ivy closes the Book of Fails, "not even
// here" (he turns half ghost), the crayon kindergarten flashback (chibi kids, his hand glued to her backpack, a whole day),
// "I miss that guy", Ivy leaves, he is alone on his dim pad. Dinner: he cuts off Dad's joke (the rimshot kit fizzles), Dad
// lowers the spatula, Bea "you're not fun anymore", Gary turns his tail. Dip to night blue for SC 07.
'use strict';

const K = require('./kit');
const R = require('./respawn');
const H = require('./sets_home');
const X = require('../rig/extras');
const AC = require('./acting');
const E6 = require('./s06_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor } = K;
const { L } = K.V;
const { tf, TS, TFS, pop, popOut, at, toScr, mixCam, shakeAll, drift, clipTo, zoomAbout, whip, smash, dip, zoomLines, bars, room, SW, SK, PAD, BOWL, Z, flat, LIGHT } = E6;

// ================================================================= timing (all from the voice)
function timing() {
  const A = Array.from({ length: 18 }, (_, i) => L('06.' + i));
  const T0 = K.V.scene('SC 06').start;
  const END = K.V.scene('SC 07').start;
  const w = (i, word, n = 0) => A[i].word(word, n).t0;
  const w1 = (i, word, n = 0) => A[i].word(word, n).t1;
  const C = {};
  C.open = T0;
  C.trick = w(0, "Ivy's") - 0.15;
  C.hat = w(0, 'A') - 0.12;
  C.hatReal = w(0, 'out') - 0.1;
  C.ladies = A[1].a - 0.1;
  C.pull = w(1, 'I') - 0.1;
  C.know = A[2].a - 0.06;
  C.how = A[3].a - 0.08;
  C.blast = A[3].b - 0.06;
  C.drip = w(4, 'went') - 0.15;
  C.again1 = w(4, 'And') - 0.24;
  C.again2 = w(4, 'And', 1) - 0.1;
  C.mont = w1(4, 'again', 1) + 0.25;
  C.flask = A[5].a - 0.12;
  C.sneeze = w(5, 'sneeze') - 0.15;
  C.ceiling = A[6].a - 0.1;
  C.dont = w(6, 'Yeah') - 0.1;
  C.weird = A[7].a - 0.1;
  C.thu = A[8].a - 0.12;
  C.perfect = w(8, 'Until') - 0.12;
  C.youPerfect = w(8, 'Until', 1) - 0.12;
  C.book = A[9].a - 0.15;
  C.wide = w(9, "You're") - 0.12;
  C.notHere = w(9, "It's") - 0.12;
  C.practice = A[10].a - 0.1;
  C.friends = A[11].a - 0.12;
  C.kinder = w(11, 'Kindergarten') - 0.2;
  C.best = A[13].a - 0.1;
  C.miss = w(13, 'I') - 0.15;
  C.alone = w1(13, 'guy') - 0.25;
  C.dinner = w(14, 'pancake') - 0.12;
  C.cutoff = A[15].a - 0.08;
  C.dadFreeze = w(15, 'Dad') - 0.1;
  C.knowAll = w(15, 'I', 1) - 0.1;
  C.bea = A[16].a - 0.1;
  C.gary = w(16, 'Even') - 0.12;
  C.garyClose = A[16].b + 0.02;
  const ks = Object.keys(C);
  for (let i = 1; i < ks.length; i++) if (C[ks[i]] < C[ks[i - 1]] + 0.2) C[ks[i]] = C[ks[i - 1]] + 0.2;
  const B = {};      // beats inside shots
  B.wed = T0 + 0.05; B.reh = w(0, 'Rehearsal'); B.sheet = w(0, 'Elephant') - 0.05; B.volcano = w(0, 'volcano'); B.foamW = w(0, 'foam'); B.burp = w(0, 'hat') + 0.08;
  B.gent = w(1, 'gentlemen'); B.ordinary = w(1, 'ordinary'); B.dip = w(1, 'pull');
  B.iknow = w(2, 'I'); B.tell = w(3, 'tell'); B.pour = w(3, 'that', 1) - 0.1; B.blast = A[3].b - 0.02;
  B.snap = w(4, 'you') - 0.05; B.crumble = w(4, 'reset') + 0.04; B.pop1 = w(4, 'And') - 0.08;
  B.knock = w(4, 'again') - 0.02; B.crash = B.knock + 0.3; B.snap2 = B.crash + 0.12; B.rew0 = B.crash + 0.2; B.rew1 = C.again2 - 0.04;
  B.plop = w(4, 'again', 1) - 0.12; B.fail3 = B.plop + 0.16;
  B.offer = C.flask + 0.1; B.reach = w(5, 'what'); B.take = w(5, 'I'); B.sneeze = w(5, 'sneeze'); B.choo = w(5, 'middle'); B.goes = w(5, 'goes');
  B.ceil = w(6, 'ceiling'); B.dontDo = w(6, "Don't");
  B.thuIn = A[8].a; B.four = w(8, 'four'); B.twelve = w(8, 'twelve'); B.times = w(8, 'times'); B.perf1 = w(8, 'perfect'); B.YOU = w(8, 'YOU', 1); B.perf2 = w(8, 'perfect', 1);
  B.close = w(9, 'anymore'); B.notEven = w(9, 'not'); B.here = w(9, 'here');
  B.kinder = w(11, 'Kindergarten'); B.glued = w(11, 'glued'); B.stick = w(11, 'backpack'); B.day0 = A[12].a; B.day1 = A[12].b;
  B.miss = w(13, 'miss'); B.leave = w(13, 'guy');
  B.go = w(14, 'go'); B.doctor = A[15].a; B.flat = w(15, 'flat'); B.know = w(15, 'know'); B.ALL = w(15, 'ALL');
  B.notFun = w(16, 'fun'); B.garyW = w(16, 'Gary'); B.turn0 = A[16].b + 0.05; B.turn1 = Math.max(B.turn0 + 0.6, A[17].a - 0.05); B.evenGary = A[17].a;
  return { A, T0, END, C, B };
}
const { A, T0, END, C: CUT, B } = timing();

// ================================================================= shared drawing
// the hero's pad (state saved during Wednesday/Thursday, idle in the quiet part)
const padBack = (t, o = {}) => R.checkpoint({ ...PAD, t, state: 'saved', glow: 0.8, part: 'back', ...o });
const padFront = (t, o = {}) => R.checkpoint({ ...PAD, t, state: 'saved', glow: 0.8, part: 'front', ...o });
const IVY = { x: SW.behindTable.x, y: SW.behindTable.y, s: SW.behindTable.s };
const HAT_TABLE = { x: SW.hat.x, y: SW.hat.y - 95, s: 0.5 };
const FLASK_COLS = ['#3BD16F', '#FF6FA8', '#FFD23F'];
function tableProps(t, o = {}) {
  const { hat = true, flasks = [true, true, true], hatFoam = 0, cols = FLASK_COLS } = o;
  let p = '';
  const xs = [745, 830, 905], kinds = ['erlenmeyer', 'round', 'tube'];
  xs.forEach((x, i) => { if (flasks[i]) p += X.flask({ x, y: SW.flasks.y + 2, s: 0.45, col: cols[i % cols.length], kind: kinds[i], t: t + i, fill: 0.62 }); });
  if (hat) p += X.topHat({ ...HAT_TABLE, mouth: 'up', foam: hatFoam });
  return p;
}
// Ivy behind the rehearsal table. hold: { hat: {rot, foam}, flask: {col, rot}, book: true|'open' }
function ivy(t, pose = {}, act = {}, hold = {}) {
  const p = { ...IVY, ...pose };
  const props = [...(p.props || [])];
  if (hold.hat) {
    const h = AC.hand(p.armL ?? 40, -1), th = ((hold.hat.rot || 0) * Math.PI) / 180;
    props.push({ svg: X.topHat({ x: h[0] + 180 * Math.sin(th) + (hold.hat.dx || 0), y: h[1] - 180 * Math.cos(th) - 10 + (hold.hat.dy || 0), s: 0.95, rot: hold.hat.rot || 0, mouth: 'up', foam: hold.hat.foam || 0 }), layer: 'front' });
  }
  if (hold.flask) {
    const h = AC.hand(p.armR ?? 30, 1);
    props.push({ svg: X.flask({ x: h[0], y: h[1] + 70, s: 0.75, rot: hold.flask.rot || 0, col: hold.flask.col || '#FF6FA8', kind: hold.flask.kind || 'round', t, fill: hold.flask.fill ?? 0.6 }), layer: 'front' });
  }
  p.props = props;
  return actor('ivy', t, p, act);
}
const IVY_K = IVY.s * 0.96;   // Ivy's body units -> px
// world point of the hat's opening when Ivy holds it on her left palm (armL, rot)
function hatMouth(armL, rot) { const h = AC.hand(armL, -1), th = (rot * Math.PI) / 180; return [IVY.x + (h[0] + 180 * Math.sin(th)) * IVY_K, IVY.y + (h[1] - 180 * Math.cos(th) - 10) * IVY_K]; }
const hero = (t, pose = {}, act = {}) => actor('you', t, { x: PAD.x, y: PAD.y, s: PAD.s, ...pose }, act);
// the whole workshop (Wednesday/Thursday look); o.set = workshop opts, o.ivy = svg (behind the table), o.floor = svg after the table
function workshopShot(t, cam, o = {}) {
  const Lw = H.workshop.layers(t, { poster: true, ...(o.set || {}) });
  const behind = (o.behindExtra || '') + (o.ivy || '');
  const pad = o.pad === false ? '' : padBack(t, o.padOpts) + (o.hero || '') + padFront(t, o.padOpts);
  const floor = (o.table === false ? '' : tableProps(t, o.tableOpts)) + (o.beforePad || '') + pad + (o.floor || '');
  return room(Lw, cam, { behind, floor, over: o.over || '', light: o.set && o.set.quiet ? LIGHT.workshopQuiet : undefined });
}
const deadpanEyes = (look = [0, 0], upper = 0.45) => ({ name: 'deadpan', eyes: { look, upper } });
// the hero mouths someone else's line (he has heard it 90 times)
const mouthing = (sp, t, base = 'deadpan', look = [0, 0]) => { const v = K.V.viseme(sp, t); return { name: base, eyes: { look }, ...(v ? { mouth: v } : {}) }; };
// a foam jet from the hat (world point hx, hy) shooting toward angle ang (deg, 0 = up), growing with age
function foamJet(t, hx, hy, ang, age, s = 0.95, h = 520) {
  if (age <= 0) return '';
  return S.g(R.foamFountain({ x: 0, y: 0, s, t, age, dir: 1, h, curl: 0.9, fall: 90, pile: false, thick: 0.9, seed: 4 }), `translate(${f(hx)} ${f(hy)}) rotate(${f(ang)})`);
}
// the RESETS counter (06.4 montage)
function resetsHUD(t) {
  if (t < B.pop1 - 0.05 || t > CUT.flask + 0.5) return '';
  const k = seg(t, B.pop1 - 0.05, B.pop1 + 0.25) * (1 - seg(t, CUT.flask + 0.1, CUT.flask + 0.4));
  let value = 1, bmp = seg(t, B.pop1, B.pop1 + 0.45);
  if (t >= B.rew1) { value = 2; bmp = seg(t, B.rew1, B.rew1 + 0.45); }
  if (t >= B.fail3 + 0.3) { value = Math.round(lerp(3, 27, ease.in(seg(t, B.fail3 + 0.3, CUT.flask - 0.15)))); bmp = value === 27 ? seg(t, CUT.flask - 0.1, CUT.flask + 0.35) : 0.3 * (Math.floor(t * 20) % 2); }
  return R.counterHUD({ x: 56, y: 70, k, label: 'RESETS:', value, icon: 'retry', t, bump: bmp });
}

// ================================================================= SHOTS
// ---- 1. WEDNESDAY: the workshop wide out of SC 05's white flash; Ivy sets up the flasks; calendar slam + REHEARSAL stamp
function shOpen(t) {
  const cam = drift(t, CUT.open, CUT.trick, at(1060, 600, 1.02), at(1040, 610, 1.1));
  const busy = Math.sin(t * 5);
  let iv = ivy(t, { turn: -0.3, armR: 30 + 16 * busy, armL: 22, headRot: -4, face: { name: 'happy', eyes: { look: [-0.4, 0.4] } } }, { arms: false });
  const he = hero(t, { turn: -0.25, armL: 8, armR: 8, face: deadpanEyes([-0.5, 0.1]), ...AC.breathe(t, 1) }, { arms: false });
  let o = workshopShot(t, cam, { ivy: iv, hero: he });
  o += E6.calendarCard(360, 300, seg(t, B.wed, B.wed + 0.3), 'WEDNESDAY', { stamp: 'REHEARSAL', kStamp: seg(t, B.reh, B.reh + 0.25), sub: '2 DAYS TO THE SHOW', out: seg(t, CUT.trick - 0.3, CUT.trick) });
  o += K.C.whiteFlash(0.9 * (1 - seg(t, T0, T0 + 0.28)));
  return o;
}
// ---- 2. "Ivy's big trick: Elephant Toothpaste." — Ivy yanks the sheet off the easel
function shTrick(t) {
  const cam = drift(t, CUT.trick, CUT.hat, at(760, 640, 1.4), at(740, 620, 1.55));
  const yank = seg(t, B.sheet - 0.15, B.sheet + 0.05);
  const after = t >= B.sheet;
  const iv = ivy(t, { turn: after ? -0.5 : -0.2, armL: after ? lerp(150, 110, seg(t, B.sheet, B.sheet + 0.5)) : lerp(40, 80, yank), armR: after ? 150 : 40, lift: 18 * bump(t, B.sheet, B.sheet + 0.35), face: after ? 'excited' : 'sneaky' }, { arms: false });
  const ez = E6.easel(520, 992, 0.66, t, seg(t, B.sheet, B.sheet + 0.45));
  let o = workshopShot(t, cam, { ivy: iv, floor: ez, pad: false });
  if (after) o += K.sparkles([[300, 300, 30], [560, 200, 22], [760, 330, 26]].map(([x, y, r]) => [x, y, r * pop(t, B.sheet, 0.3) * (1 - seg(t, B.sheet + 1.2, B.sheet + 1.6))]), t);
  o += whip(t, CUT.trick, 1);
  return o;
}
// ---- 3a. "A volcano of foam..." — Ivy's blueprint draws itself on (hat -> volcano -> FOAM!!!)
function shBlueprint(t) {
  const z = lerp(1.0, 1.08, ease.inOut(seg(t, CUT.hat, CUT.hatReal)));
  const k = { hat: seg(t, CUT.hat, CUT.hat + 0.35), volcano: seg(t, B.volcano - 0.05, B.volcano + 0.5), foam: seg(t, B.foamW - 0.05, B.foamW + 0.45), labels: seg(t, B.volcano + 0.2, CUT.hatReal - 0.1) };
  let o = zoomAbout(E6.blueprint(t, k), 960, 520, z);
  if (k.foam > 0) o += zoomLines(960, 260, 0.5 * bump(t, B.foamW, B.foamW + 0.5), t, '#BFD8F6', 18, 420);
  return o + whip(t, CUT.hat, 1);
}
// ---- 3b. "...out of a magic hat." — the real hat on the table burps a puff of foam
function shHat(t) {
  const cam = drift(t, CUT.hatReal, CUT.ladies, at(1060, 640, 2.3), at(1068, 640, 2.6));
  const burp = t - B.burp;
  const iv = ivy(t, { turn: 0.2, armL: 26, armR: 30, face: { name: 'excited', eyes: { look: [0.5, 0.6] } } }, { arms: false });
  let over = '';
  if (burp > 0) {
    over += R.foamBlobs(SW.hat.x, HAT_TABLE.y - 18 - 30 * ease.out(seg(burp, 0, 0.3)), 0.45, pop(t, B.burp, 0.2) * (1 - 0.3 * seg(burp, 0.5, 1)), 7, { t });
    over += R.foamSplash(SW.hat.x, HAT_TABLE.y - 40, burp, { s: 0.4, n: 6, seed: 3 });
  }
  let o = workshopShot(t, cam, { ivy: iv, over, pad: false, hero: '' });
  const [sx, sy] = toScr(cam, SW.hat.x, HAT_TABLE.y);
  o += K.sparkles([[sx - 160, sy - 120, 22], [sx + 170, sy - 60, 18], [sx + 60, sy - 200, 14]].map(([x, y, r], i) => [x, y, r * (0.5 + 0.5 * Math.sin(t * 7 + i * 2))]), t);
  if (burp > 0) o += K.bang('pfft!', sx + 220, sy - 300, pop(t, B.burp, 0.2) * (1 - seg(burp, 0.7, 0.9)), 100, 8, '#FFFFFF');
  return o;
}
// ---- 4. IVY: "Ladies and gentlemen! From this ordinary hat," — showman; the hero mouths every word along with her
function shLadies(t) {
  const cam = drift(t, CUT.ladies, CUT.pull, at(1200, 560, 1.55), at(1190, 555, 1.66));
  const up = seg(t, B.gent - 0.25, B.gent + 0.1) * (1 - seg(t, B.ordinary - 0.3, B.ordinary));
  const tilt = seg(t, B.ordinary - 0.2, B.ordinary + 0.3);
  const armL = lerp(40, 160, ease.outBack(up)) - 10 * tilt;
  const iv = ivy(t, { turn: 0.15, armL, armR: lerp(30, 130, ease.outBack(up)), lift: 14 * bump(t, B.gent, B.gent + 0.3), face: 'excited' }, { arms: false, energy: 1.3 }, { hat: { rot: lerp(0, -40, tilt) } });
  const he = hero(t, { turn: -0.3, ...AC.breathe(t, 2), face: mouthing('IVY', t, 'deadpan', [-0.7, 0]) }, { arms: false });
  let o = workshopShot(t, cam, { ivy: iv, hero: he, tableOpts: { hat: false } });
  if (up > 0.5) o += K.sparkles([[520, 260, 28], [880, 190, 22], [1060, 300, 18]].map(([x, y, r]) => [x, y, r * up]), t);
  return o + whip(t, CUT.ladies, -1);
}
// ---- 5. IVY: "I will now pull out... a—" — close, her hand dips into the hat
function shPull(t) {
  const cam = drift(t, CUT.pull, CUT.know, at(930, 560, 2.15), at(925, 570, 2.55));
  const dipK = ease.inOut(seg(t, B.dip - 0.2, B.dip + 0.3));
  const iv = ivy(t, { turn: 0.05, armL: 64, armR: lerp(82, 40, dipK), headRot: -4, face: { name: 'sneaky', eyes: { look: [0.2, 0.4] } } }, { arms: false }, { hat: { rot: 8 } });
  let o = workshopShot(t, cam, { ivy: iv, tableOpts: { hat: false }, pad: false });
  const [sx, sy] = toScr(cam, 820, 760);
  o += K.sparkles([[sx - 60, sy - 140, 26], [sx + 120, sy - 220, 20], [sx + 40, sy - 300, 16]].map(([x, y, r], i) => [x, y, r * (0.5 + 0.5 * Math.sin(t * 6 + i))]), t);
  return o;
}
// ---- 6. YOU: "A volcano of foam. I know." — flat close-up, he shrugs
function shKnow(t) {
  const cam = drift(t, CUT.know, CUT.how, at(1470, 590, 2.35), at(1470, 585, 2.45));
  const shrug = bump(t, B.iknow, B.iknow + 0.5);
  const he = hero(t, { armL: 10 + 14 * shrug, armR: 10 + 14 * shrug, bodyY: -10 * shrug, headRot: 3, face: { name: 'deadpan', eyes: { look: [-0.6, t > B.iknow ? -0.5 : 0], upper: 0.55 } } }, { arms: false });
  return workshopShot(t, cam, { ivy: ivy(t, { face: 'neutral' }), hero: he }) + smash(t, CUT.know, 0.1, 0.5);
}
// ---- 7. IVY: "...How do you know that? I didn't tell you that." — she leans in; the flask tips into the hat
function shHow(t) {
  const cam = drift(t, CUT.how, CUT.blast, at(1140, 610, 1.65), at(1130, 600, 1.8));
  const gest = seg(t, B.tell - 0.2, B.tell + 0.2);
  const pour = seg(t, B.pour, B.pour + 0.25);
  const fizz = seg(t, B.pour + 0.1, B.blast);
  const iv = ivy(t, { turn: 0.45, lean: -5 * ease.out(seg(t, CUT.how, CUT.how + 0.6)), armL: 52, armR: lerp(30, 70, gest) - 20 * pour, face: { name: 'confused', eyes: { look: [0.8, 0] } } }, { arms: false }, { hat: { rot: 18 + 10 * pour, foam: 0.35 * fizz }, flask: { col: '#FF6FA8', rot: -lerp(0, 120, pour) } });
  const he = hero(t, { turn: -0.35, face: { name: 'deadpan', eyes: { look: [-0.8, 0], upper: 0.5 } }, ...AC.breathe(t, 3) }, { arms: false });
  let o = workshopShot(t, cam, { ivy: iv, hero: he, tableOpts: { hat: false, flasks: [true, false, true] } });
  if (fizz > 0) o += K.bang('fzzz…', 760, 360, pop(t, B.pour + 0.1, 0.2), 70, -6, '#FF9EBB');
  return o;
}
// ---- 8. the foam blasts him in the face (end of 06.3 / "Every time something...")
function shBlast(t) {
  const age = t - B.blast;
  const cam = shakeAll(drift(t, CUT.blast, CUT.drip, at(1170, 600, 1.18), at(1220, 600, 1.3), ease.out), t, [[B.blast + 0.12, 0.45, 22]]);
  const hit = seg(age, 0.18, 0.3);
  const iv = ivy(t, { turn: 0.45, lean: 6 * seg(age, 0, 0.2), armL: 56, armR: 60, face: age < 0.5 ? 'shocked' : { name: 'joy', fx: ['sweat'] }, lift: 20 * bump(age, 0, 0.3) }, { arms: false }, { hat: { rot: 70, foam: 0.6 }, flask: { col: '#FF6FA8', rot: -120, fill: 0.1 } });
  const he = hero(t, { foam: hit, lean: -8 * bump(age, 0.18, 0.6), armL: 30 * hit, armR: 30 * hit, sx: 1 + 0.1 * bump(age, 0.18, 0.4), sy: 1 - 0.1 * bump(age, 0.18, 0.4), face: hit ? { name: 'deadpan', eyes: { upper: 0.6 } } : { name: 'deadpan', eyes: { look: [-0.8, 0] } } }, { arms: false });
  // the hat in Ivy's hand: opening world point (left hand, armL 56, tilted 70)
  const [hx, hy] = hatMouth(56, 70);
  let over = foamJet(t, hx, hy, 72, age * 1.6, 0.8, 520);
  if (hit > 0) over += R.foamPile(PAD.x, PAD.y, 380 * ease.out(seg(age, 0.3, 1.4)), 150 * ease.out(seg(age, 0.3, 1.4)), { t, seed: 5 }) + R.foamSplash(PAD.x - 10, PAD.y - 400, age - 0.22, { s: 1.2, n: 12, dir: 1, seed: 8 });
  let o = workshopShot(t, cam, { ivy: iv, hero: he, over, tableOpts: { hat: false, flasks: [true, false, true] } });
  o += K.bang('SPLOOSH!', 1450, 240, pop(t, B.blast + 0.22, 0.2), 140, -8, '#FFFFFF');
  return o + smash(t, CUT.blast, 0.12, 0.6);
}
// ---- 9. foam-faced close-up: "...went wrong... you reset." — casual finger snap -> crumble -> banner RESETTING -> pop on the pad
function shDrip(t) {
  const camClose = drift(t, CUT.drip, B.crumble, at(1460, 590, 2.3), at(1460, 595, 2.4));
  const camWide = at(1150, 610, 1.22);
  const q = R.respawnSeq(t - B.crumble, {
    preset: 'standard', t, reason: 'FOAM TO THE FACE', label: 'RESETTING',
    fail: { ...PAD, dir: [0.2, -0.6], seed: 11, spread: 1.1 }, spawn: { ...PAD },
    timing: { ov: [0.1, B.pop1 - B.crumble - 0.1, 'banner'], freeze: 0.3, pop: B.pop1 - B.crumble, conv: 0.12, field: 1.2 },
    overlay: { y: 540 },
  });
  if (q.view === 'fail') {
    const snapK = seg(t, B.snap - 0.25, B.snap);
    const drips = [];
    let he = '';
    if (q.heroAt === 'fail') he = hero(t, { foam: 1, armR: lerp(10, 112, ease.out(snapK)), armL: 10, face: { name: 'deadpan', blink: bump(t, B.snap - 0.9, B.snap - 0.6), eyes: { upper: 0.6, look: [0.1, 0.2] } } }, { arms: false });
    let over = R.foamPile(PAD.x, PAD.y, 380, 150, { t, seed: 5 });
    if (q.heroAt === 'fail') {
      for (let i = 0; i < 3; i++) { const u = ((t * 0.9 + i * 0.37) % 1); drips.push(S.ellipse(PAD.x - 110 + i * 110, PAD.y - 520 + u * 260, 12, 18, ol('#FFFFFF', 4))); }
      over += drips.join('') + R.foamBlobs(PAD.x + 30, PAD.y - 905 * PAD.s, 0.5, 1, 9, { t });
    }
    over += q.under + q.over;
    let o = workshopShot(t, camClose, { ivy: ivy(t, { face: { name: 'joy', fx: ['sweat'] }, turn: 0.4 }), hero: he, over, tableOpts: { hat: false, flasks: [true, false, true] } });
    if (t >= B.snap && t < B.crumble) {
      const [sx, sy] = toScr(camClose, PAD.x + AC.hand(112, 1)[0] * PAD.s, PAD.y + AC.hand(112, 1)[1] * PAD.s);
      o += K.C.burst(sx, sy, seg(t, B.snap, B.snap + 0.3), '#FFFFFF') + K.bang('snap', sx + 40, sy - 110, pop(t, B.snap, 0.15), 70, -10, '#FFE14D');
    }
    return o + q.screen;
  }
  // spawn view: the rehearsal starts over — Ivy back at the top of her act, table clean
  const he = q.heroAt ? hero(t, { ...q.pose, face: { name: 'deadpan', eyes: { look: [-0.6, 0] } } }) : '';
  const iv = ivy(t, { turn: 0.1, armL: 150, armR: 130, face: 'excited' }, { arms: false }, { hat: { rot: 0 } });
  return workshopShot(t, camWide, { ivy: iv, hero: he, over: q.under + q.over, tableOpts: { hat: false } }) + q.screen + resetsHUD(t);
}
// ---- 10. "And again." — Ivy knocks the green flask off the table; CRASH; he snaps; the world rewinds ◀◀
function flaskFallSVG(u) {
  // u = seconds since the knock (0..0.3 falling, then shattered on the floor)
  if (u <= 0) return X.flask({ x: 745, y: SW.flasks.y + 2, s: 0.45, col: '#3BD16F', kind: 'erlenmeyer', fill: 0.62 });
  if (u < 0.3) { const k = u / 0.3; return X.flask({ x: lerp(745, 640, k), y: lerp(SW.flasks.y + 2, 985, k * k), s: 0.45, rot: -160 * k, col: '#3BD16F', kind: 'erlenmeyer', fill: 0.62 }); }
  let o = R.foamPile(640, 988, 200 * ease.out(seg(u, 0.3, 0.8)), 60 * ease.out(seg(u, 0.3, 0.8)), { t: u, seed: 12 });
  for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.15 + 0.7 * hash(i)), d = 40 + 160 * ease.out(seg(u, 0.3, 0.7)) * (0.5 + hash(i * 3)); o += S.path(`M0 -10 L12 8 L-8 10 Z`, { ...ol('#DDF4FF', 3), transform: `translate(${f(640 + Math.cos(a) * d)} ${f(985 + Math.sin(a) * d * 0.4)}) rotate(${f(i * 50 + u * 300)})` }); }
  return o + R.foamSplash(640, 980, u - 0.3, { s: 0.6, n: 8, seed: 21 });
}
function shAgain1(t) {
  // world time: plays forward until the rewind, then runs backward to the knock
  const tw = t < B.rew0 ? t : R.rewindT(t, B.rew0, B.rew1, B.rew0, B.knock - 0.25);
  const cam = at(1150, 610, 1.22);
  const pa = t - B.pop1;
  const reach = seg(tw, B.knock - 0.35, B.knock);
  const iv = ivy(tw, { turn: -0.2 * reach, armL: lerp(150, 40, seg(tw, B.pop1, B.pop1 + 0.3)) + 38 * reach * (1 - seg(tw, B.crash, B.crash + 0.3)), armR: lerp(130, 20, seg(tw, B.pop1, B.pop1 + 0.3)), face: tw > B.crash ? 'shocked' : 'excited', lift: 16 * bump(tw, B.crash, B.crash + 0.3) }, { arms: false }, { hat: { rot: 0 } });
  // he re-uses the pop pose for the first instants, then stands; snaps on the crash
  const pp = pa < 0.5 ? R.popPose(pa, PAD.s) : {};
  const sn = seg(tw, B.snap2 - 0.15, B.snap2);
  const he = pp.hidden ? '' : hero(tw, { sx: pp.sx, sy: pp.sy, lift: pp.lift, armR: lerp(10, 112, sn), face: { name: 'deadpan', eyes: { look: [-0.7, 0.5] } } }, { arms: false });
  let over = R.respawnPop({ ...PAD, age: pa, part: 'front' }) + (pa < 1.2 ? R.forcefield({ ...PAD, t, k: 1 - seg(pa, 0.6, 1.2) }) : '');
  // the knocked flask: Ivy's right hand sweeps it off the table
  let o = workshopShot(tw, cam, { ivy: iv, hero: he, beforePad: flaskFallSVG(tw - B.knock), over, tableOpts: { hat: false, flasks: [false, true, true] } });
  if (tw >= B.crash && t < B.rew0 + 0.05) o += K.bang('CRASH!', 520, 330, pop(t, B.crash, 0.18), 120, -8, '#7DFFB0');
  if (t >= B.snap2 && t < B.rew0 + 0.1) { const [sx, sy] = toScr(cam, PAD.x + AC.hand(112, 1)[0] * PAD.s, PAD.y + AC.hand(112, 1)[1] * PAD.s); o += K.C.burst(sx, sy, seg(t, B.snap2, B.snap2 + 0.3), '#FFFFFF'); }
  if (t >= B.rew0) o = R.rewind(t, 1 - seg(t, B.rew1 - 0.1, B.rew1), { label: 'RESET', clock: 'WED 4:12 PM', svg: o, seed: 3 });
  return o + resetsHUD(t) + (t < B.pop1 + 0.1 ? R.flash(0.6 * (1 - seg(t, B.pop1, B.pop1 + 0.1))) : '');
}
// ---- 11. "And again." — Ivy's POV across the table: a dollop drops on his head -> fast crumble/pop; the counter rolls to 27
function shAgain2(t) {
  const cam = drift(t, CUT.again2, CUT.flask, at(1420, 600, 1.9), at(1430, 610, 2.05));
  const q = R.respawnSeq(t - B.fail3, { preset: 'fast', t, fail: { ...PAD, dir: [-0.4, -0.5], seed: 23 }, spawn: { ...PAD } });
  const plop = t - B.plop;
  let he = '';
  if (q.heroAt === 'fail') he = hero(t, { foam: plop > 0.08 ? 0.7 : 0, sy: 1 - 0.1 * bump(plop, 0.06, 0.2), face: { name: 'deadpan', eyes: { look: [0, -0.4], upper: 0.55 } } }, { arms: false });
  else if (q.heroAt === 'spawn') he = hero(t, { ...q.pose, face: deadpanEyes([-0.3, 0]) }, { arms: false });
  let over = q.under + q.over;
  if (plop > -0.3 && plop < 0.1) over += R.foamBlobs(PAD.x, lerp(PAD.y - 1300, PAD.y - 720, ease.in(seg(plop, -0.3, 0.08))), 0.7, 1, 13, { t });
  let o = workshopShot(t, cam, { ivy: '', hero: he, over });
  // Ivy's shoulder + puff in the foreground (her POV)
  o += S.g(actor('ivy', t, { x: 300, y: 1500, s: 0.95, view: 'back', volume: false, headRot: 4 }), '', { opacity: 0.98 });
  return o + q.screen + resetsHUD(t);
}
// ---- 11b. the silent beat after "...and again.": a strobe of micro-fails, each one reset with a pop; the angle flips every time
const MONT = (() => { const a = CUT.mont, b = CUT.flask - 0.02; const n = Math.max(2, Math.round((b - a) / 0.44)); return { a, b, n, p: (b - a) / n }; })();
function shMontage(t) {
  const i = clamp(Math.floor((t - MONT.a) / MONT.p), 0, MONT.n - 1), u = t - MONT.a - i * MONT.p;
  const kind = (i + 1) % 5, tf0 = Math.min(0.2, MONT.p * 0.45);
  const cams = [at(1180, 610, 1.3), at(1430, 600, 2.0), at(1280, 650, 1.6)];
  const c0 = cams[i % 3];
  const cam = shakeAll({ ...c0, zoom: c0.zoom * (1 + 0.04 * u) }, t, [[MONT.a + i * MONT.p + tf0, 0.15, 10]]);
  const dirs = [[0.2, -0.7], [0.6, -0.3], [-0.5, -0.5], [0.8, -0.2], [-0.2, -0.9]];
  const q = R.respawnSeq(u - tf0, { preset: 'fast', t, fail: { ...PAD, dir: dirs[kind], seed: 40 + i, life: 0.6 }, spawn: { ...PAD } });
  const fk = seg(u, 0, tf0);      // the fail happening
  let over = '', heP = {}, ivP = { turn: 0.1, armL: 40, armR: 30, face: 'excited' }, ivHold = {}, table = {};
  if (kind === 0) over += R.foamBlobs(PAD.x, lerp(PAD.y - 1250, PAD.y - 900, ease.in(fk)), 0.7, 1, 13 + i, { t });
  if (kind === 1) { table.hat = false; const k = ease.in(fk); over += X.topHat({ x: lerp(SW.hat.x, PAD.x, k), y: lerp(HAT_TABLE.y, PAD.y - 880, k) - 260 * Math.sin(k * Math.PI), s: 0.5, rot: lerp(0, 180, k), mouth: 'up' }); }
  if (kind === 2) { const k = fk; over += S.g(S.rect(-14, -10, 28, 20, 6, ol('#C98A52', 4)), `translate(${f(lerp(905, PAD.x - 40, k))} ${f(lerp(700, PAD.y - 740, k) - 160 * Math.sin(k * Math.PI))}) rotate(${f(k * 720)})`); }
  if (kind === 3) { ivP = { turn: 0.3, headRot: 14, lean: 8, armL: 60, armR: 60, face: { name: 'joy', mouth: 'O' } }; over += R.foamSplash(1060, 560, fk * 0.8, { s: 1.0, n: 10, dir: 1, seed: 50 + i }); }
  if (kind === 4) heP = { rot: -18 * fk, lean: -10 * fk, armL: 60 * fk, armR: 90 * fk };
  const he = q.heroAt === 'fail' ? hero(t, { ...heP, ...R.popPose(u * 1.4 + 0.12, PAD.s), face: { name: 'deadpan', eyes: { upper: 0.55, look: [-0.4, 0] } } }, { arms: false }) : q.heroAt === 'spawn' ? hero(t, { ...q.pose, face: 'deadpan' }) : '';
  over += q.under + q.over + (u < 0.1 ? R.respawnPop({ ...PAD, age: u + 0.05, part: 'front', blocks: false }) : '');
  let o = workshopShot(t, cam, { ivy: i % 3 === 1 ? '' : ivy(t, ivP, { arms: false }, ivHold), hero: he, over, tableOpts: table });
  if (i % 3 === 1) o += actor('ivy', t, { x: 300, y: 1500, s: 0.95, view: 'back', volume: false, headRot: 4 });
  const words = ['PLOP', 'CLONK', 'BONK', 'ACHOO', 'SLIP'];
  if (fk > 0) o += K.bang(words[kind], 560 + 280 * (i % 2), 300, pop(t, MONT.a + i * MONT.p + tf0 * 0.6, 0.12) * (1 - seg(u, MONT.p - 0.06, MONT.p)), 90, i % 2 ? 8 : -8, ['#FFFFFF', '#FFE14D', '#FF9EBB', '#8FE8BF', '#9FD8FF'][kind]);
  return o + q.screen + resetsHUD(t) + (u < 0.05 ? R.flash(0.5 * (1 - u / 0.05)) : '');
}
// ---- 12. IVY (laughing): "Okay, okay, what if I..." — he holds the flask out BEFORE she reaches for it
function shFlask(t) {
  const cam = drift(t, CUT.flask, CUT.sneeze, at(1150, 620, 1.55), at(1140, 610, 1.62));
  const reach = ease.out(seg(t, B.reach - 0.15, B.take));
  const took = t >= B.take;
  const iv = ivy(t, { turn: lerp(0, 0.5, reach), armR: took ? lerp(90, 40, seg(t, B.take, B.take + 0.4)) : lerp(20, 92, reach), armL: 20, bodyY: 5 * Math.abs(Math.sin(t * 14)) * (1 - reach), face: took ? { name: 'joy', eyes: { look: [0.7, 0] } } : 'joy' }, { arms: false }, took ? { flask: { col: '#FF6FA8', rot: 0 } } : {});
  // the hero, already holding the flask out (since before she started reaching)
  const hold = ease.out(seg(t, B.offer, B.offer + 0.35));
  const hand = AC.hand(lerp(10, 78, hold), -1);
  const heProps = took ? [] : [{ svg: X.flask({ x: hand[0] - 10, y: hand[1] + 80, s: 0.8, col: '#FF6FA8', kind: 'round', t }), layer: 'front' }];
  const he = hero(t, { x: PAD.x - 110, turn: -0.4, armL: took ? lerp(78, 10, seg(t, B.take, B.take + 0.4)) : lerp(10, 78, hold), armR: 8, props: heProps, face: deadpanEyes([-0.8, 0.1]) }, { arms: false });
  return workshopShot(t, cam, { ivy: iv, hero: he, tableOpts: { hat: true, flasks: [true, false, true] } });
}
// ---- 13. IVY: "...sneeze in the middle and the foam goes—" — the sneeze mime; he doesn't laugh
function shSneeze(t) {
  const cam = drift(t, CUT.sneeze, CUT.ceiling, at(1060, 580, 1.72), at(1080, 590, 1.82));
  const ah = seg(t, B.sneeze - 0.1, B.choo - 0.1), choo = seg(t, B.choo - 0.1, B.choo + 0.12), rec = seg(t, B.choo + 0.3, B.choo + 0.8);
  const point = seg(t, B.goes - 0.25, B.goes + 0.05);
  const headRot = -14 * ah * (1 - choo) + 16 * choo * (1 - rec);
  const lean = -6 * ah * (1 - choo) + 9 * choo * (1 - rec);
  const iv = ivy(t, { turn: 0.15, headRot, lean, armL: 24 + 40 * choo * (1 - rec), armR: lerp(40, 172, ease.outBack(point)), bodyY: 6 * Math.abs(Math.sin(t * 15)), face: choo > 0 && rec < 1 ? { name: 'joy', mouth: 'O' } : 'joy' }, { arms: false }, { flask: { col: '#FF6FA8', rot: lerp(0, -20, point) } });
  const he = hero(t, { turn: -0.35, face: { name: 'deadpan', eyes: { look: [-0.8, 0], upper: 0.55 } }, ...AC.breathe(t, 4) }, { arms: false });
  let o = workshopShot(t, cam, { ivy: iv, hero: he, tableOpts: { flasks: [true, false, true] } });
  if (choo > 0 && rec < 1) o += K.bang('ah-CHOO!', 640, 280, pop(t, B.choo - 0.05, 0.2) * (1 - rec), 96, -10, '#FFE14D');
  return o;
}
// ---- 14. YOU: "—on the ceiling." — flat close; the memory polaroid "VERSION 87" (foam on the ceiling)
function memoryInner(t) {
  let o = S.rect(-210, -190, 420, 330, 0, { fill: '#EBCB9C' }) + S.rect(-210, -190, 420, 40, 0, { fill: '#D9B080' }) + S.path('M-210 -150 H210', ln(5));
  o += S.g(R.foamPile(0, 0, 440, 90, { t: 0, seed: 31 }), 'translate(0 -150) scale(1 -1)');
  for (let i = 0; i < 4; i++) o += S.ellipse(-150 + i * 100, -90 + ((t * 0.8 + i * 0.3) % 1) * 160, 10, 16, ol('#FFFFFF', 3));
  o += actor('ivy', 2, { x: -90, y: 130, s: 0.26, foam: 0.9, face: 'joy', armL: 120, armR: 120, volume: false, shadow: false });
  o += actor('you', 2, { x: 100, y: 130, s: 0.28, foam: 1, face: { name: 'deadpan', eyes: { upper: 0.6 } }, volume: false, shadow: false });
  o += R.greyWash(0.55, { x: -210, y: -190, w: 420, h: 330, dark: 0.08 });
  return o;
}
function shCeiling(t) {
  const cam = drift(t, CUT.ceiling, CUT.dont, at(1440, 590, 2.1), at(1450, 590, 2.2));
  const he = hero(t, { turn: -0.2, face: { name: 'deadpan', eyes: { look: [-0.5, -0.3], upper: 0.55 } } }, { arms: false });
  let o = workshopShot(t, cam, { ivy: ivy(t, { face: 'joy' }), hero: he });
  o += E6.polaroid(520, 430, 0.95, -7, pop(t, B.ceil - 0.05, 0.3), memoryInner(t), 'VERSION 87');
  return o + smash(t, CUT.ceiling, 0.1, 0.4);
}
// ---- 15. YOU: "Yeah. Don't do that." — two-shot, his finger wag; her laugh dies
function shDont(t) {
  const cam = drift(t, CUT.dont, CUT.weird, at(1180, 620, 1.42), at(1190, 615, 1.5));
  const wag = t >= B.dontDo - 0.1 ? Math.sin((t - B.dontDo) * 16) * 12 * (1 - seg(t, B.dontDo + 0.7, B.dontDo + 0.9)) : 0;
  const fade = seg(t, CUT.dont, B.dontDo + 0.3);
  const iv = ivy(t, { turn: 0.35, bodyY: 5 * Math.abs(Math.sin(t * 14)) * (1 - fade), face: fade < 0.6 ? 'joy' : { name: 'confused', eyes: { look: [0.8, 0] } } }, { arms: false }, { flask: { col: '#FF6FA8' } });
  const he = hero(t, { turn: -0.35, armL: t >= B.dontDo - 0.1 ? 62 + wag : 10, armR: 8, face: deadpanEyes([-0.8, 0]) }, { arms: false });
  let o = workshopShot(t, cam, { ivy: iv, hero: he, tableOpts: { flasks: [true, false, true] } });
  const pk = 1 - seg(t, CUT.dont, CUT.dont + 0.25);
  if (pk > 0) o += S.g(E6.polaroid(520, 430, 0.95, -7, 1, memoryInner(t), 'VERSION 87'), `translate(${f(-700 * (1 - pk))} 0)`);
  return o;
}
// ---- 16. IVY: "...You're being so weird." — slow push, she leans back
function shWeird(t) {
  const cam = drift(t, CUT.weird, CUT.thu, at(945, 560, 2.25), at(950, 565, 2.6));
  const iv = ivy(t, { turn: 0.3, lean: -5 * seg(t, CUT.weird, CUT.thu), headRot: 4, face: { name: 'confused', eyes: { look: [0.9, 0], upper: 0.3 } } }, { arms: false }, { flask: { col: '#FF6FA8' } });
  return workshopShot(t, cam, { ivy: iv, hero: hero(t, {}), tableOpts: { flasks: [true, false, true] } });
}
// ---- 17. THURSDAY · VERSION 412 — the same framing loops; colour drains; the frame shrinks into a wall of 412 thumbnails
const LOOP = 0.52;
function loopFrame(t, n, u, drain) {
  // n = loop index (tiny differences), u = seconds inside the loop
  const cols = [FLASK_COLS, ['#FF6FA8', '#FFD23F', '#3BD16F'], ['#FFD23F', '#3BD16F', '#FF6FA8']][n % 3];
  const up = ease.outBack(seg(u, 0.02, 0.2));
  const iv = ivy(t, { turn: 0.1, armL: lerp(30, 160, up), armR: lerp(30, 140, up), goggles: n % 4 === 2 ? 'down' : 'up', face: n % 5 === 3 ? 'joy' : 'excited' }, { arms: false });
  const he = u < 0.07 ? '' : hero(t, { turn: -0.2 + 0.05 * (n % 3), face: { name: 'neutral', eyes: { look: [-0.4, 0] } }, ...R.popPose(u - 0.07, PAD.s) });
  const over = R.foamFountain({ x: SW.hat.x, y: HAT_TABLE.y - 6, s: 0.62, t: t + n, age: u * 2.2, dir: 0, h: 380, seed: 2 + (n % 4) }) + R.respawnPop({ ...PAD, age: u - 0.07, part: 'front', blocks: false });
  let o = workshopShot(t, at(1150, 600, 1.22), { ivy: iv, hero: he, over, tableOpts: { cols }, padOpts: { glow: 0.6 } });
  return o + R.greyWash(drain) + (u < 0.06 ? R.flash(0.55 * (1 - u / 0.06)) : '');
}
function shThursday(t) {
  const drain = 0.42 * seg(t, CUT.thu, CUT.perfect);
  const tl = t - CUT.thu, n = Math.floor(tl / LOOP), u = tl - n * LOOP;
  // zoom out into the wall
  const zk = ease.inOut(seg(t, B.four - 0.15, B.times + 0.1));
  const z = lerp(1, 0.1, zk);
  let o = '';
  if (zk > 0) o += S.g(S.rect(-60000, -60000, 120000, 120000, 0, { fill: 'url(#s06thumbs)' }), `translate(960 540) scale(${f(z)}) translate(-960 -540)`);
  o += zoomAbout(zk > 0 ? clipTo(0, 0, 1920, 1080, loopFrame(t, n, u, drain)) + S.rect(0, 0, 1920, 1080, 0, { fill: 'none', stroke: '#151515', 'stroke-width': 24 }) : loopFrame(t, n, u, drain), 960, 540, z);
  if (zk > 0) o += R.greyWash(drain * zk * 0.6);
  // the counter: rolls 1 -> 412 (accelerating), lands on "twelve"
  const v = Math.max(1, Math.round(lerp(1, 412, ease.in(seg(t, B.thuIn, B.twelve)))));
  o += R.counterHUD({ x: 960, y: 92, anchor: 'center', k: seg(t, CUT.thu, CUT.thu + 0.25), label: 'THURSDAY · VERSION', value: v, icon: 'cal', t, bump: v === 412 ? seg(t, B.twelve, B.twelve + 0.45) : 0, size: 72 });
  return o + whip(t, CUT.thu, 1);
}
// ---- 18. "Until the trick was perfect." — the perfect crown; Ivy cheers; he doesn't move
function shPerfect(t) {
  const cam = drift(t, CUT.perfect, CUT.youPerfect, at(1110, 560, 1.32), at(1120, 560, 1.45));
  const age = t - CUT.perfect + 0.3;
  const iv = ivy(t, { turn: 0.1, armL: 160 + 6 * Math.sin(t * 8), armR: 150 + 6 * Math.sin(t * 8 + 1), lift: 10 * Math.abs(Math.sin(t * 7)), face: 'excited' }, { arms: false });
  const he = hero(t, { face: { name: 'neutral', eyes: { look: [0, 0] } }, armL: 6, armR: 6 }, { arms: false });
  const over = R.foamFountain({ x: SW.hat.x, y: HAT_TABLE.y - 6, s: 0.72, t, age, dir: 0, h: 420, seed: 3 });
  let o = workshopShot(t, cam, { ivy: iv, hero: he, over, padOpts: { glow: 0.5 } });
  o += R.greyWash(lerp(0.42, 0.5, seg(t, CUT.perfect, CUT.youPerfect)));
  const k = pop(t, B.perf1 - 0.05, 0.3);
  if (k > 0) {
    let st = S.rect(-300, -80, 600, 160, 40, ol('#FFD23F', 8)) + T('PERFECT!', 0, 32, 96, '#2A1640');
    for (let i = 0; i < 3; i++) st += S.g(S.path('M0 -26 L7 -8 L26 -8 L11 4 L17 23 L0 12 L-17 23 L-11 4 L-26 -8 L-7 -8 Z', ol('#FFFFFF', 4)), `translate(${-80 + i * 80} -110) scale(${f(1.4 * pop(t, B.perf1 + 0.1 * i, 0.25))})`);
    o += S.g(st, `translate(560 300) rotate(-8) scale(${f(k)})`);
  }
  return o;
}
// ---- 19. "Until YOU were perfect." — slow push on his blank face; a grey quest-marker check spins over him
function shYouPerfect(t) {
  const camA = drift(t, CUT.youPerfect, B.YOU, at(1460, 560, 1.55), at(1465, 575, 1.9));
  const camB = drift(t, B.YOU, CUT.book, at(1468, 590, 2.5), at(1470, 600, 2.7));
  const cam = t < B.YOU ? camA : camB;
  const he = hero(t, { face: { name: 'neutral', eyes: { look: [0, 0] } }, armL: 6, armR: 6 }, { arms: false });
  let over = '';
  const mk = seg(t, CUT.youPerfect + 0.2, CUT.youPerfect + 0.6);
  if (mk > 0) {
    const sp = Math.cos(t * 3);
    over += S.g(S.circle(0, 0, 60, ol('#B9C0CC', 7)) + S.path('M-26 0 L-6 22 L28 -22', ln(14, '#FFFFFF')), `translate(${PAD.x} ${PAD.y - 560}) scale(${f(sp * ease.outBack(mk))} ${f(ease.outBack(mk))})`);
  }
  let o = workshopShot(t, cam, { ivy: ivy(t, { face: 'excited', armL: 150, armR: 140 }, { arms: false }), hero: he, over, padOpts: { glow: 0.4 } });
  o += R.greyWash(lerp(0.5, 0.62, seg(t, CUT.youPerfect, CUT.book)));
  return o + smash(t, B.YOU, 0.1, 0.35);
}
// ---- the quiet workshop (dusk, string lights off, the lamp pool); the pad idles
const QUIET = { quiet: true, poster: true };
const quietShot = (t, cam, o = {}) => workshopShot(t, cam, { set: QUIET, padOpts: { state: 'idle', glow: 0.35, ...(o.padOpts || {}) }, ...o });
// ---- 20. Ivy closes the Book of Fails ("You don't laugh anymore.")
function shBook(t) {
  const cam = drift(t, CUT.book, CUT.wide, at(930, 690, 2.7), at(930, 700, 2.85));
  const cu = ease.inOut(seg(t, B.close - 0.12, B.close + 0.12));
  const iv = ivy(t, { turn: 0, armL: 26, armR: 26, headRot: 6, face: { name: 'sad', eyes: { look: [0, 0.8] } } }, { arms: false });
  let over = E6.bookClosing(930, 742, 0.62, -3, cu, { vol: 1, lines: [{ txt: 'FAIL #312', x: -170, y: -56, size: 26, col: '#E8453C' }, { txt: 'Rocket sneakers', x: -170, y: -26, size: 21 }, { txt: 'LESSON:', x: 24, y: -56, size: 24, col: '#3A8A3A' }, { txt: 'not indoors!!', x: 24, y: -26, size: 21 }] });
  if (cu >= 1) { const u = seg(t, B.close + 0.12, B.close + 0.8); for (let i = 0; i < 6; i++) over += S.circle(930 + (i - 2.5) * 40 * (1 + u), 735 - 30 * u - 10 * (i % 2), 14 + 22 * u, { fill: '#F4EEDC', opacity: f(0.75 * (1 - u)) }); }
  let o = quietShot(t, cam, { ivy: iv, hero: '', pad: false, tableOpts: { hat: true, flasks: [true, true, true] }, over });
  return o + bars(seg(t, CUT.book, CUT.book + 0.6));
}
// ---- 21. "You're never surprised." — the wide: the distance between them
function shWide(t) {
  const cam = drift(t, CUT.wide, CUT.notHere, at(1150, 620, 1.12), at(1160, 615, 1.2));
  const iv = ivy(t, { turn: 0.3, book: true, armL: 18, face: { name: 'sad', eyes: { look: [0.9, 0.1] } } }, {});
  const he = hero(t, { turn: -0.15, face: { name: 'neutral', eyes: { look: [-0.2, 0.6] } }, ...AC.breathe(t, 5) }, { arms: false });
  return quietShot(t, cam, { ivy: iv, hero: he }) + bars(1);
}
// ---- 22. "It's like you're not even here." — close on him; he fades toward a grey ghost for a moment
function shNotHere(t) {
  const cam = drift(t, CUT.notHere, CUT.practice, at(1470, 610, 2.15), at(1470, 615, 2.35));
  const g = seg(t, B.notEven - 0.2, B.here + 0.2) * (1 - seg(t, CUT.practice - 0.5, CUT.practice));
  const pose = { turn: -0.1, headRot: -3, face: { name: 'neutral', eyes: { look: [0.3, 0.6] } } };
  let he = S.g(hero(t, pose, { arms: false }), '', g > 0 ? { opacity: f(1 - 0.55 * g) } : {});
  if (g > 0) he += actor('ghost', t, { x: PAD.x, y: PAD.y, s: PAD.s, ...pose, alpha: 0.6 * g });
  return quietShot(t, cam, { ivy: ivy(t, { book: true }), hero: he }) + bars(1);
}
// ---- 23. YOU: "I'm just... practicing." — over Ivy's shoulder
function shPractice(t) {
  const cam = drift(t, CUT.practice, CUT.friends, at(1400, 610, 1.55), at(1410, 615, 1.62));
  const he = hero(t, { turn: -0.35, armL: 12 + 8 * bump(t, A[10].a + 0.3, A[10].a + 0.9), armR: 12 + 8 * bump(t, A[10].a + 0.3, A[10].a + 0.9), face: { name: 'sad', eyes: { look: [-0.4, 0.5] } } }, { arms: false });
  let o = quietShot(t, cam, { ivy: '', hero: he });
  o += S.g(actor('ivy', t, { x: 520, y: 1560, s: 1.0, view: 'back', volume: false, headRot: 6 }), '', { opacity: 0.97 }) + S.rect(0, 0, 1920, 1080, 0, { fill: '#1A1030', opacity: 0.08 });
  return o + bars(1);
}
// ---- 24. IVY: "You know how we became friends?" — soft close-up
function shFriends(t) {
  const cam = drift(t, CUT.friends, CUT.kinder, at(935, 560, 2.3), at(935, 565, 2.5));
  const look = t < A[11].a + 0.8 ? [0.1, 0.8] : [0.8, 0];
  const iv = ivy(t, { turn: 0.25, book: true, armL: 20, face: { name: 'happy', eyes: { look } } }, { arms: false });
  let o = quietShot(t, cam, { ivy: iv, hero: hero(t, {}) });
  o += K.C.whiteFlash(0.85 * seg(t, CUT.kinder - 0.25, CUT.kinder));
  return o + bars(1);
}
// ---- 25. the kindergarten flashback (crayon drawing; chibi kids; his hand glued to her backpack; a whole day)
function shKinder(t) {
  const walk0 = B.stick + 0.35, wu = Math.max(0, t - walk0);
  const ivX = 1000 + wu * 230;
  const cam = camKeys(t, [[CUT.kinder, at(840, 690, 1.5)], [walk0, at(870, 700, 1.6)], [CUT.best, at(1250, 690, 1.6)]]);
  const sunU = seg(t, B.day0 - 0.2, B.day1 + 0.1);
  let w = E6.kinderRoom(t, sunU);
  const stuck = t >= B.stick, walking = t >= walk0;
  const squeeze = bump(t, B.glued - 0.1, B.glued + 0.5);
  const FY = 905, KS = 0.27, HS = 0.47;
  // little Ivy: side view facing right, the big backpack on her back
  const iw = walking ? AC.walk(wu * 9, 1.2) : { armL: 6, armR: 6 };
  let kids = E6.chibi('ivy', t, { x: ivX, y: FY, s: KS, view: 'side', flip: true, goggles: false, ...iw, face: stuck ? (t < walk0 + 0.3 ? 'shocked' : 'joy') : 'happy', headRot: walking ? 0 : -4 }, HS, { arms: false });
  kids += X.backpack({ x: ivX - 58, y: FY - 92, s: 0.42 });
  // little you: glue bottle (left hand) -> right hand slaps the backpack -> stuck, stumbling behind her
  const reach = ease.outBack(seg(t, B.stick - 0.3, B.stick));
  const heX = walking ? ivX - 196 + 6 * Math.sin(wu * 9) : lerp(640, ivX - 190, ease.inOut(seg(t, B.glued + 0.35, B.stick - 0.25)));
  let he;
  if (!walking) {
    const gh = AC.hand(34, -1);
    const props = t < B.stick + 0.2 ? [{ svg: E6.glueBottle(gh[0] - 10, gh[1] + 150, 1.5, -12, squeeze), layer: 'front' }] : [];
    he = E6.chibi('you', t, { x: heX, y: FY, s: KS, turn: 0.45, armL: 34, armR: lerp(20, 88, reach), props, face: stuck ? 'shocked' : squeeze > 0.2 ? { name: 'joy' } : 'happy', lift: 14 * bump(t, B.stick, B.stick + 0.25) }, HS, { arms: false });
  } else {
    he = E6.chibi('you', t, { x: heX, y: FY, s: KS, view: 'side', flip: true, ...AC.walk(wu * 9 + 1.6, 1.3), armR: 82, lean: 10 + 6 * Math.sin(wu * 9), face: 'joy' }, HS, { arms: false });
  }
  kids += he;
  if (stuck) kids += K.bang('!', heX + 40, FY - 330, pop(t, B.stick, 0.2) * (1 - seg(t, B.stick + 0.7, B.stick + 0.9)), 90, 0, '#E8453C') + K.bang('!', ivX, FY - 360, pop(t, B.stick + 0.08, 0.2) * (1 - seg(t, B.stick + 0.7, B.stick + 0.9)), 80, 8, '#E8453C');
  if (t >= B.glued && t < B.stick) kids += K.bang('squish', heX - 150, FY - 300, pop(t, B.glued + 0.1, 0.2) * (1 - seg(t, B.glued + 0.7, B.glued + 0.9)), 56, -8, '#FFFFFF');
  w += kids;
  let o = view(cam, w);
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FFC870', opacity: 0.12 }) + E6.paperFrame(1);
  if (sunU > 0) {
    // a crayon sun arcs over the page and turns into the moon: the whole day
    const ax = lerp(260, 1660, sunU), ay = 300 - Math.sin(sunU * Math.PI) * 170, night = seg(sunU, 0.7, 0.95);
    if (night < 1) o += S.circle(ax, ay, 46, { fill: '#FFD23F', stroke: '#FFB800', 'stroke-width': 8, opacity: f(1 - night) });
    if (night > 0) o += S.path(`M${f(ax - 20)} ${f(ay - 40)} A44 44 0 1 0 ${f(ax + 30)} ${f(ay + 34)} A34 34 0 1 1 ${f(ax - 20)} ${f(ay - 40)} Z`, { fill: '#FFF2A8', stroke: '#E0C060', 'stroke-width': 6, opacity: f(night) });
    o += TF('...the whole day', 470, 880, 52, '#B98552', { opacity: f(seg(sunU, 0, 0.2)), transform: 'rotate(-3 470 880)' });
  }
  o += K.C.whiteFlash(0.85 * (1 - seg(t, CUT.kinder, CUT.kinder + 0.3)) + 0.85 * seg(t, CUT.best - 0.25, CUT.best));
  return o;
}
// ---- 26. IVY: "Best mistake you ever made." — two-shot; his small smile fades
function shBest(t) {
  const cam = drift(t, CUT.best, CUT.miss, at(1180, 620, 1.48), at(1190, 615, 1.56));
  const iv = ivy(t, { turn: 0.35, book: true, armL: 18, face: { name: 'happy', eyes: { look: [0.8, 0] } } }, { arms: false });
  const he = hero(t, { turn: -0.3, face: { name: t < CUT.best + 1.2 ? 'happy' : 'sad', eyes: { look: [-0.6, 0.2] } } }, { arms: false });
  return quietShot(t, cam, { ivy: iv, hero: he }) + bars(1) + K.C.whiteFlash(0.6 * (1 - seg(t, CUT.best, CUT.best + 0.3)));
}
// ---- 27. IVY: "...I miss that guy." — close; she puts the book down
function shMiss(t) {
  const cam = drift(t, CUT.miss, CUT.alone, at(940, 570, 2.35), at(940, 580, 2.55));
  const down = seg(t, B.miss, B.leave);
  const iv = ivy(t, { turn: 0.15, armL: lerp(18, 34, down), headRot: 5, face: { name: 'sad', eyes: { look: [0.3, 0.7] } } }, { arms: false });
  const book = down > 0.5 ? X.bookOfFails({ x: 860, y: 728, s: 0.32, rot: -6 }) : '';
  return quietShot(t, cam, { ivy: down > 0.5 ? iv : ivy(t, { turn: 0.15, book: true, armL: 18, headRot: 5, face: { name: 'sad', eyes: { look: [0.3, 0.7] } } }, { arms: false }), hero: hero(t, {}), over: book }) + bars(1);
}
// ---- 28. Ivy leaves. He is alone on his dim pad (let it breathe; Dad's voice pre-laps)
function shAlone(t) {
  const cam = drift(t, CUT.alone, CUT.dinner, at(1000, 600, 1.04), at(1010, 600, 1.08));
  const wu = t - CUT.alone;
  const turnK = seg(wu, 0, 0.3);
  const ix = lerp(IVY.x, -260, ease.inOut(seg(wu, 0.2, 1.75)));
  const dk = seg(ix, 780, 600) ;
  const iv = wu < 0.3 ? ivy(t, { turn: lerp(0.15, -0.8, turnK), face: 'sad' }, { arms: false })
    : actor('ivy', t, { x: ix, y: lerp(900, 990, ease.inOut(1 - seg(ix, 600, 780))), s: lerp(0.46, 0.5, 1 - seg(ix, 600, 780)), view: 'side', ...AC.walk(wu * 9), face: 'sad' }, { arms: false });
  void dk;
  const he = hero(t, { turn: lerp(-0.2, -0.6, seg(wu, 0.2, 1.2)), headRot: lerp(0, 6, seg(wu, 1.5, 2.4)), face: { name: 'sad', eyes: { look: [lerp(-0.3, -0.9, seg(wu, 0.2, 1.4)), lerp(0, 0.6, seg(wu, 1.6, 2.4))] } } }, { arms: false });
  const book = X.bookOfFails({ x: 860, y: 728, s: 0.32, rot: -6 });
  const ivyBehind = ix >= 640 ? iv : '';
  const ivyFloor = ix < 640 ? iv : '';
  const flick = 0.35 * (1 - 0.6 * bump(t, CUT.dinner - 0.8, CUT.dinner - 0.6));
  return quietShot(t, cam, { ivy: ivyBehind, hero: he, over: book, floor: ivyFloor, padOpts: { glow: flick } }) + bars(1 - seg(t, CUT.dinner - 0.3, CUT.dinner));
}
// ---- the evening kitchen (dinner, Mom on shift: coat gone) + Gary's bowl on the counter
function kitchenShot(t, cam, o = {}) {
  const Lk = H.kitchen.layers(t, { time: 'evening', meal: 'dinner', coat: false, ...(o.set || {}) });
  const bowl = X.fishbowl({ ...BOWL, t, gary: { yaw: o.garyYaw ?? 90, s: 0.62, blink: o.garyBlink || 0, lids: 0.5 } });
  const behind = bowl + (o.dad || '') + (o.seated || '');
  return room(Lk, cam, { behind, floor: o.floor || '', over: o.over || '', light: LIGHT.kitchenEve });
}
const BEA_S = 0.36, YOU_S = SK.seats[1].s;
const beaSeat = (t, pose = {}, act = {}) => actor('bea', t, { x: SK.seats[0].x, y: SK.seats[0].hip + 306 * BEA_S * 0.68, s: BEA_S, t, ...pose }, act);
const youSeat = (t, pose = {}, act = {}) => actor('you', t, { x: SK.seats[1].x, y: SK.seats[1].y, s: YOU_S, ...pose }, act);
function dadPose(t, armR, rot, item, extra = {}, act = {}) {
  const p = E6.dadSpatula({ ...SK.dad, armR, armL: 14, ...extra }, rot, item, extra.itemOpts || {});
  delete p._blade;
  return actor('dad', t, p, { arms: false, ...act });
}
// the cut-off rimshot (screen space): pops in on "go", fizzles when he cuts Dad off
function kitScreen(t) {
  const k = seg(t, B.go - 0.1, B.go + 0.2) * (1 - seg(t, B.flat + 0.2, B.flat + 0.6));
  if (k <= 0) return '';
  let o = E6.drumKit(330, 1000, 0.85, t, { k, fizzle: seg(t, B.doctor, B.doctor + 0.35) });
  if (t > B.doctor + 0.2) o += K.bang('tss…', 520, 700, pop(t, B.doctor + 0.25, 0.2) * k, 54, -6, '#B9C0CC');
  return o;
}
// ---- 29. DAD: "Why did the pancake go to the—"
function shDinner(t) {
  const cam = drift(t, CUT.dinner, CUT.cutoff, at(1060, 600, 1.12), at(1000, 590, 1.2));
  const raise = ease.outBack(seg(t, CUT.dinner, CUT.dinner + 0.4));
  const dad = dadPose(t, lerp(70, 150, raise), lerp(70, 25, raise), 'pancake', { face: 'happy', turn: 0.2 }, { energy: 1.2 });
  const seated = beaSeat(t, { spoon: true, face: { name: 'neutral', eyes: { look: [-0.6, -0.2] } } }) + youSeat(t, { face: { name: 'deadpan', eyes: { look: [0, 0.6] } }, armL: 20, armR: 20 }, { arms: false });
  let o = kitchenShot(t, cam, { dad, seated });
  return o + kitScreen(t) + dip(1 - seg(t, CUT.dinner, CUT.dinner + 0.25), '#0A0812');
}
// ---- 30. YOU: "—doctor. It felt flat. Dad, I know." — bored, not even looking up
function shCutoff(t) {
  const cam = drift(t, CUT.cutoff, CUT.dadFreeze, at(1420, 610, 1.95), at(1430, 615, 2.05));
  const he = youSeat(t, { turn: 0.1, armL: 22, armR: 30, headRot: -6, face: { name: 'deadpan', eyes: { look: [0.2, 0.8], upper: 0.6 } } }, { arms: false });
  const seated = beaSeat(t, { spoon: true, face: { name: 'neutral', eyes: { look: [0.8, -0.2] } } }) + he;
  const dad = dadPose(t, 150, 25, 'pancake', { face: 'shocked' });
  return kitchenShot(t, cam, { dad, seated }) + kitScreen(t);
}
// ---- 31. Dad's proud smile freezes ("Dad, I know.")
function shDadFreeze(t) {
  const cam = drift(t, CUT.dadFreeze, CUT.knowAll, at(660, 470, 2.05), at(660, 480, 2.2));
  const tilt = seg(t, B.know, CUT.knowAll);
  const dad = dadPose(t, 150 - 6 * tilt, 25 + 30 * tilt, 'pancake', { face: t < B.know ? { name: 'joy', eyes: { look: [0.8, 0] } } : { name: 'sad', eyes: { look: [0.8, 0] } }, turn: 0.3, itemOpts: { itemRot: 20 * tilt, dx: 20 * tilt } });
  return kitchenShot(t, cam, { dad });
}
// ---- 32. YOU: "I know ALL of them." — flat close; accent on ALL
function shKnowAll(t) {
  const camA = at(1490, 610, 2.3), camB = at(1490, 612, 2.55);
  const cam = t < B.ALL ? drift(t, CUT.knowAll, B.ALL, camA, { ...camA, zoom: 2.36 }) : drift(t, B.ALL, CUT.bea, camB, { ...camB, zoom: 2.6 }, ease.out);
  const he = youSeat(t, { turn: -0.1, armL: 22, armR: 22, face: { name: 'deadpan', eyes: { look: [-0.6, 0], upper: 0.6 } } }, { arms: false });
  return kitchenShot(t, cam, { seated: beaSeat(t, { face: 'neutral' }) + he, dad: dadPose(t, 150, 50, 'pancake', { face: 'sad' }) }) + smash(t, B.ALL, 0.08, 0.25);
}
// ---- 33. BEA: "You're not fun anymore." — Bea looks at her brother; behind them Dad slowly lowers the spatula (the pancake flops)
function shBea(t) {
  const cam = drift(t, CUT.bea, CUT.gary, at(1120, 590, 1.58), at(1130, 600, 1.66));
  const low = ease.inOut(seg(t, CUT.bea, CUT.gary));
  const slide = seg(low, 0.45, 0.75);
  const dad = dadPose(t, lerp(150, 26, low), lerp(50, 165, low), slide < 0.05 ? 'pancake' : null, { face: { name: 'sad', eyes: { look: [0.8, 0.2] } }, turn: 0.3 });
  let fall = '';
  if (slide > 0.05) { const k = ease.in(slide); fall = X.pancake({ x: lerp(760, 700, k), y: lerp(380, SK.pan.y, k), s: 0.45, rot: 40 * k, flip: 0.2 * k }); }
  const seated = beaSeat(t, { spoon: true, turn: 0.3, face: { name: 'neutral', eyes: { look: [0.9, 0] } } }) + youSeat(t, { turn: -0.1, face: { name: 'sad', eyes: { look: [0, 0.7] } } }, { arms: false });
  return kitchenShot(t, cam, { dad: dad + fall, seated });
}
// ---- 34. BEA: "Even Gary thinks so." — she points at the bowl on the counter
function shGaryPoint(t) {
  const cam = drift(t, CUT.gary, CUT.garyClose, at(1360, 590, 2.25), at(1330, 575, 2.45));
  const point = ease.outBack(seg(t, B.garyW - 0.3, B.garyW));
  const seated = beaSeat(t, { turn: 0.2, armL: lerp(10, 135, point), face: { name: 'neutral', eyes: { look: [-0.6, -0.6] } } }) + youSeat(t, { turn: -0.25, face: { name: 'sad', eyes: { look: [-0.8, -0.3] } } }, { arms: false });
  return kitchenShot(t, cam, { seated, garyYaw: 90, garyBlink: bump(t, B.garyW + 0.2, B.garyW + 0.5), dad: dadPose(t, 26, 165, null, { face: 'sad' }) });
}
// ---- 35. Gary slowly turns his tail on the hero (beat) — NARRATOR: "Even Gary." — reveal the hero's face; dip to night
function shGaryTurn(t) {
  const cam = camKeys(t, [[CUT.garyClose, at(1222, 500, 4.8)], [B.evenGary - 0.1, at(1224, 502, 5.0)], [END, at(1345, 560, 2.85)]]);
  const yaw = lerp(90, 270, ease.inOut(seg(t, B.turn0, B.turn1)));
  const seated = beaSeat(t, { turn: 0.2, armL: 120, face: 'neutral' }) + youSeat(t, { turn: -0.25, headRot: 4, face: { name: 'sad', eyes: { look: [-0.7, -0.2] } } }, { arms: false });
  let o = kitchenShot(t, cam, { seated, garyYaw: yaw, garyBlink: bump(t, B.turn1 + 0.05, B.turn1 + 0.35), dad: '' });
  return o + dip(seg(t, END - 0.32, END), '#0B1030');
}

// ================================================================= dispatch
const SHOTS = [
  [CUT.open, shOpen], [CUT.trick, shTrick], [CUT.hat, shBlueprint], [CUT.hatReal, shHat], [CUT.ladies, shLadies], [CUT.pull, shPull], [CUT.know, shKnow], [CUT.how, shHow],
  [CUT.blast, shBlast], [CUT.drip, shDrip], [B.pop1 + 0.02, shAgain1], [CUT.again2, shAgain2], [CUT.mont, shMontage], [CUT.flask, shFlask], [CUT.sneeze, shSneeze],
  [CUT.ceiling, shCeiling], [CUT.dont, shDont], [CUT.weird, shWeird], [CUT.thu, shThursday], [CUT.perfect, shPerfect], [CUT.youPerfect, shYouPerfect],
  [CUT.book, shBook], [CUT.wide, shWide], [CUT.notHere, shNotHere], [CUT.practice, shPractice], [CUT.friends, shFriends], [CUT.kinder, shKinder],
  [CUT.best, shBest], [CUT.miss, shMiss], [CUT.alone, shAlone], [CUT.dinner, shDinner], [CUT.cutoff, shCutoff], [CUT.dadFreeze, shDadFreeze],
  [CUT.knowAll, shKnowAll], [CUT.bea, shBea], [CUT.gary, shGaryPoint], [CUT.garyClose, shGaryTurn],
].sort((a, b) => a[0] - b[0]);
function shotAt(t) {
  let i = SHOTS.length - 1;
  while (i > 0 && t < SHOTS[i][0]) i--;
  return SHOTS[i][1];
}
function scene(t) {
  Z.last = 1;
  const o = shotAt(t)(t);
  return Z.last >= 1.75 ? flat(o) : o;
}
function look(t) {
  if (t >= CUT.dinner) return { grade: 'warm', vignette: 0.75 };
  if (t >= CUT.book) return { grade: t >= CUT.kinder && t < CUT.best ? 'warm' : null, vignette: 0.95 };
  if (t >= CUT.thu) return { grade: 'cool', vignette: 0.7 };
  return { grade: 'warm', vignette: 0.5 };
}
// the wall of 412 identical Thursdays: one cheap thumbnail of the loop moment, tiled (pattern in user space of the frame)
const THUMB = (() => {
  const P = (d, fill, w = 12) => `<path d="${d}" fill="${fill}" stroke="#151515" stroke-width="${w}" stroke-linejoin="round"/>`;
  let o = '<rect x="-400" y="-200" width="2800" height="1400" fill="#E8C898"/><rect x="-400" y="-200" width="2800" height="240" fill="#D9B080"/><rect x="-400" y="800" width="2800" height="400" fill="#B9B3AE"/>';
  o += '<rect x="-120" y="190" width="650" height="610" fill="#8FD0F2"/><rect x="-120" y="640" width="650" height="160" fill="#79C96A"/><path d="M60 640 L60 470 L220 390 L380 470 L380 640 Z" fill="#C9B0F2"/>';
  o += P('M760 150 L1110 150 L1110 560 L760 560 Z', '#FFFDF4', 10) + '<rect x="760" y="150" width="350" height="70" fill="#7A3FD0"/>';
  o += P('M1560 120 L1560 960 M1860 120 L1860 960', 'none', 14) + P('M1560 330 H1860 M1560 520 H1860 M1560 710 H1860', 'none', 10);
  o += P('M700 760 L1180 760 L1180 900 L700 900 Z', '#5B3FA8');
  o += P('M1010 700 Q960 560 1010 440 Q960 330 1060 300 Q1160 330 1110 440 Q1160 560 1110 700 Z', '#FFFFFF');
  o += '<path d="M1040 690 Q1000 560 1050 450 M1080 690 Q1120 560 1070 450" fill="none" stroke="#8FE8BF" stroke-width="14"/>';
  o += P('M860 600 L1010 600 L1010 760 L860 760 Z', '#F08A3C') + P('M935 600 m-90 -50 a90 90 0 1 0 180 0 a90 90 0 1 0 -180 0', '#2A1E1A');
  o += P('M800 470 L870 560 M1070 470 L1000 560', 'none', 22);
  o += P('M1250 985 a220 60 0 1 0 440 0 a220 60 0 1 0 -440 0', '#3DDC84');
  o += P('M1400 680 L1540 680 L1540 960 L1400 960 Z', '#1F4A2C') + P('M1390 540 L1550 540 L1550 700 L1390 700 Z', '#E23B34') + P('M1440 540 L1500 540 L1500 700 L1440 700 Z', '#FFD23F', 8);
  o += P('M1370 300 L1570 300 L1580 470 L1360 470 Z', '#FFFFFF') + P('M1350 250 L1590 250 L1600 360 L1550 360 L1550 300 L1390 300 L1390 360 L1340 360 Z', '#D9661E');
  return o;
})();
const DEFS = `<defs><pattern id="s06thumbs" width="1920" height="1080" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="1920" height="1080" fill="#E8C898"/><g transform="${K.E.camTf(at(1150, 600, 1.22), 1)}">${THUMB}</g><rect x="8" y="8" width="1904" height="1064" fill="none" stroke="#151515" stroke-width="24"/></pattern>` +
  '<pattern id="s06grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0 L0 0 0 80" fill="none" stroke="#3F72B8" stroke-width="2"/><path d="M40 0 V80 M0 40 H80" fill="none" stroke="#2F62A8" stroke-width="1"/></pattern></defs>';

module.exports = { scene, look, DEFS, SHOTS, CUT, B, timing };
