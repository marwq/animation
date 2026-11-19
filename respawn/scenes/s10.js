// SC 10 · ШОУ ТАЛАНТОВ БЕЗ РЕСПАУНА — the climax. Friday night: the perfect acts (7 pins, the synchronized twins), the
// family (Dad, Mom straight from her shift, Bea's GO MUSHROOM! sign), Pemberton's announcement; backstage: no checkpoint,
// no reset, no pause menu (the menu sputters and dies), 400 people, shaking hands. The act: Ivy's dramatic line, the
// mic-cable trip in slow motion, flasks flying, the hat erupts too early and buries the principal -> gasp -> DEAD SILENCE
// (cricket, drips) -> "Reset... reset... RESET!" (a ghost of the respawn overlay flickers and dies) -> Ivy's whisper
// "Fail number 313" -> she slides into the foam, he hesitates... and jumps: the FOAM DISCO (disco ball, sweeping beams,
// confetti, snowman, the principal's foam moustache), the house chanting FOAM!, Mom filming, Bea on her chair,
// "Best. Disaster. Ever.", the trophies (7 pins wins; MOST UNFORGETTABLE ACT) and the final laughing two-shot.
// Every cut and beat comes from the voice via s10_env.times() (shared with audio/cues/gen_sc10.js).
'use strict';

const K = require('./kit');
const R = require('./respawn');
const SS = require('./sets_school');
const X = require('../rig/extras');
const AC = require('./acting');
const E = require('./s10_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, actor } = K;
const V = K.V;
const TM = E.times(V);
const { START, END, C, B } = TM;
const { ST, at, view, shook, camLerp, whip, flashAt, zoomLines, pop, TS, TFS, tf } = E;
const SP = SS.SPOTS.auditorium;
const HS = SP.house;
const WG = SP.wings;
const camAt = (x, y, z, rot = 0) => ({ ...SS.camAt(x, y, z), rot });
const kid = (i, pose) => K.draw.kid(i, { shade: true, shadow: true, ...pose });
const S45 = ST.s;
const TWIN = 5;                                   // kid design used for the synchronized twins

// ================================================================ world builders
const SPOTS3 = [SP.stage.spots.left, SP.stage.spots.centre, SP.stage.spots.right];
function stageFrame(t, cam, o = {}, { back = '', chars = '', front = '', top = '', over = '' } = {}) {
  const Ly = SS.auditorium.layers(o.tw ?? t, { view: 'stage', lights: 0, mic: false, spots: SPOTS3, ...o });
  return view(cam, Ly.mid + back + chars + (Ly.front || '') + front + Ly.fg + Ly.light + top) + over;
}
function houseFrame(t, cam, o = {}, chars = '', over = '') {
  const Ly = SS.auditorium.layers(t, { view: 'house', lights: 0.2, cam, ...o });
  return view(cam, Ly.mid + chars + Ly.fg + Ly.light) + over;
}
function wingsFrame(t, cam, chars = '', over = '', dark = 0) {
  const Ly = SS.auditorium.layers(t, { view: 'wings' });
  let o = view(cam, Ly.mid + chars + Ly.light);
  if (dark > 0) o += S.rect(0, 0, 1920, 1080, 0, { fill: '#06030C', opacity: f(dark) });
  return o + over;
}
// the family in the front row; o: { mom: 'seat' | {x, y, ...} | false, bea: 'lap' | 'seat', cheer, ... }
function family(t, o = {}) {
  let out = '';
  out += actor('dad', t, { ...HS.dad, t, face: o.dadFace, armL: o.dadArms?.[0], armR: o.dadArms?.[1], headRot: o.dadHead }, { arms: !o.dadArms, energy: 1 });
  if (o.bea === 'lap') out += '';
  if (o.mom !== false) {
    const mp = o.mom && typeof o.mom === 'object' ? o.mom : {};
    out += actor('mom', t, { ...HS.mom, t, ...mp }, { arms: mp.armL === undefined, energy: 1 });
  }
  if (o.bea === 'lap') out += actor('bea', t, { x: HS.dad.x + 70, y: 1176, s: 0.5, t, sign: true, gapSmile: true, ...(o.beaPose || {}) }, { arms: false });
  else if (o.bea) out += actor('bea', t, { ...HS.bea, t, ...(o.beaPose || {}) }, { arms: false, energy: 1.3 });
  return out;
}

// ================================================================ the act (one continuous choreography, any shot can look at it)
const FLASKS = [
  { col: '#FF6FA8', kind: 'round', from: [ST.trip + 90, 612], ctl: [820, 120], to: [ST.hat.x, ST.hat.y + 10], v: [0.1, 1], spin: 420 },
  { col: '#3BD16F', kind: 'erlenmeyer', from: [ST.trip + 60, 616], ctl: [700, 330], to: [935, 772], v: [0.1, 0.72], spin: -300 },
  { col: '#FFD23F', kind: 'erlenmeyer', from: [ST.trip + 120, 616], ctl: [1050, 180], to: [1215, 772], v: [0.12, 0.9], spin: 380 },
];
const qb = (a, c, b, v) => (1 - v) * (1 - v) * a + 2 * (1 - v) * v * c + v * v * b;
function flaskAt(F, u) {
  const v = seg(u, F.v[0], F.v[1]);
  return { v, x: qb(F.from[0], F.ctl[0], F.to[0], v), y: qb(F.from[1], F.ctl[1], F.to[1], v), rot: F.spin * v };
}
const tripU = (t) => seg(t, B.trip, B.land);
// the hero during the act (walk in -> trip -> flight -> face-down)
function heroAct(t, extra = {}) {
  const s = S45;
  if (t < C.walk) return '';
  const fo = extra.foam ?? (t >= B.erupt + 0.12 ? 0.3 : 0);
  if (t < B.trip) {
    const k = seg(t, C.walk - 0.2, B.trip);
    const x = lerp(ST.wingX, ST.trip, k);
    const cyc = AC.walk(t * 10, 1.1);
    return actor('you', t, { x, y: ST.floor, s, t, view: 'side', flip: true, ...cyc, armL: 62, armR: 58, face: { name: 'nervous', eyes: { look: [0.8, 0.2] }, fx: ['sweat'] },
      props: [{ svg: X.flaskTray({ x: -170, y: -336, s: 1.15, t, tilt: Math.sin(t * 17) * 4 }), layer: 'front' }] }, { arms: false, energy: 0.3 });
  }
  const u = tripU(t);
  if (t < B.land && u < 0.8) {
    const fall = ease.inOut(seg(u, 0, 0.62));
    const rot = lerp(-6, -84, fall);
    const lift = 110 * Math.sin(Math.PI * seg(u, 0.06, 0.8)) * (1 - 0.3 * seg(u, 0.5, 0.8));
    const x = lerp(ST.trip, ST.fall - 30, seg(u, 0, 0.8));
    const y = ST.floor + 395 * s * (rot / -88);
    const tray = u < 0.1 ? [{ svg: X.flaskTray({ x: -170, y: -336, s: 1.15, t, tilt: 30 * seg(u, 0, 0.1) }), layer: 'front' }] : [];
    return actor('you', t, { x, y, s, t, view: 'side', flip: true, rot, lift, armL: 150 + 26 * Math.sin(t * 6), armR: 110 + 30 * Math.sin(t * 5 + 1), legL: -34, kneeL: 30, legR: 26, kneeR: 50,
      face: { name: 'scream', mouth: 'scream', eyes: { pupil: 0.5 } }, foam: fo, props: tray, shadow: false }, { arms: false, energy: 0 });
  }
  // face-down on the floor (slides the last bit)
  const x = t < B.land ? lerp(ST.fall - 30, ST.fall, seg(u, 0.8, 1)) : ST.fall;
  return E.lying('you', t, x, ST.floor, s, { t, foam: fo, face: { name: 'oof', eyes: { type: 'x' } }, armL: 160, armR: 150 });
}
function ivyAct(t, extra = {}) {
  const s = S45, x = ST.ivy;
  const u = tripU(t);
  // before the hat goes on the table: holding it (mouth down) in the right hand
  if (t < C.walk) {
    const intro = seg(t, B.spots - 0.05, B.spots + 0.35);
    const jumpY = -90 * Math.sin(Math.PI * intro);
    const show = seg(t, B.hatShow - 0.2, B.hatShow + 0.15);
    const armR = lerp(150, 118, ease.inOut(seg(t, B.gentlemen + 0.2, C.hat + 0.3)));
    const [hx, hy] = AC.hand(armR, 1);
    const hat = show > 0 ? X.topHat({ x: hx + 6, y: hy - 30, s: 0.95, mouth: 'up', rot: lerp(-160, -12, ease.outBack(show)) }) : X.topHat({ x: hx + 10, y: hy - 10, s: 0.95, mouth: 'down', rot: 12 });
    const [wx, wy] = AC.hand(64, -1);
    const tap = bump(t, B.hatShow + 0.15, B.hatShow + 0.45);
    return actor('ivy', t, { x: lerp(x - 260, x, ease.out(intro)), y: ST.floor, s, t, lift: -jumpY, armR, armL: 64 + 40 * tap, face: t < B.spots + 0.3 ? 'excited' : undefined,
      props: [{ svg: hat, layer: 'front' }, { svg: S.g(E.wand(-30 - 30 * tap, 1), tf(wx, wy)), layer: 'front' }] }, { arms: false, energy: 1.2 });
  }
  // presenting over the table with the wand
  if (t < B.trip) {
    const reach = seg(t, C.walk + 0.2, B.trip);
    const [wx, wy] = AC.hand(lerp(80, 104, reach), 1);
    return actor('ivy', t, { x, y: ST.floor, s, t, turn: 0.25, armR: lerp(80, 104, reach), armL: 140, props: [{ svg: S.g(E.wand(60, 1), tf(wx, wy)), layer: 'front' }] }, { arms: false, energy: 1.2 });
  }
  // the trip: she sees it, ducks, gets blasted back by the eruption
  const blast = seg(t, B.erupt, B.erupt + 0.25);
  const duck = bump(t, lerp(B.trip, B.land, 0.3), lerp(B.trip, B.land, 0.85));
  const fo = t >= B.erupt + 0.15 ? 0.32 : 0;
  const frozen = t >= C.silence;
  return actor('ivy', t, { x: x - 30 * blast, y: ST.floor, s, t, turn: frozen ? -0.2 : 0.3, lean: -6 * seg(u, 0.15, 0.35) - 10 * blast, bodyY: 46 * duck, armL: 150 - 40 * duck, armR: 160 - 40 * duck, foam: fo,
    face: { name: 'shocked', mouth: frozen ? 'O' : 'scream', eyes: { look: frozen ? [-0.6, 0.3] : [0.8, -0.4] } } }, { arms: false, energy: 0 });
}
function principalAct(t, extra = {}) {
  const s = S45, u = tripU(t);
  const hit = t >= B.splat;
  const face = extra.face || (hit ? { name: 'deadpan', eyes: { upper: 0.5 } } : t >= B.trip + 0.3 ? { name: 'shocked', eyes: { look: [-0.8, 0] } } : { name: 'neutral', eyes: { look: [-0.7, 0.1] } });
  let o = actor('principal', t, { x: ST.prin, y: 765, s, t, foam: hit ? 0.28 : 0, turn: -0.25, armL: 26, armR: hit ? 20 : 30 + 20 * seg(u, 0.4, 0.7), face, ...extra.pose }, { arms: false, energy: 0.5 });
  if (hit) o += R.foamBlobs(ST.prin + 4, 262, 1.05, seg(t, B.splat, B.splat + 0.25), 3, { t });
  return o;
}
function actProps(t) {
  const u = tripU(t);
  let back = '', mid = '', front = '';
  const tipped = t >= B.trip ? -86 * ease.in(seg(u, 0.05, 0.5)) + (u > 0.5 ? 6 * Math.sin((u - 0.5) * 30) * (1 - seg(u, 0.5, 0.8)) : 0) : 0;
  back += E.cable(t >= B.trip ? bump(t, B.trip - 0.05, B.trip + 0.5) : 0, ST.trip, tipped ? 1 : 0);
  back += E.micStand(ST.mic, 776, 0.95, tipped);
  back += E.magicTable(ST.table);
  // puddles + shards where the flasks crashed
  if (t >= B.trip) {
    const g = FLASKS[1], y = FLASKS[2];
    const tg = lerp(B.trip, B.land, g.v[1]), ty = lerp(B.trip, B.land, y.v[1]);
    back += E.shards(g.to[0], 774, seg(t, tg, tg + 0.15), g.col, 2) + E.shards(y.to[0], 774, seg(t, ty, ty + 0.15), y.col, 3);
  }
  // the hat (wobbles when the flask drops in)
  const wob = t >= B.land ? 1 - seg(t, B.land, B.land + 0.8) : 0;
  const hatOn = t >= C.walk;
  // flying flasks: the pink one goes INTO the hat (drawn before the hat at the end)
  let fl = '', flBehind = '';
  if (t >= B.trip && t < B.land + 0.05) {
    for (const [i, F] of FLASKS.entries()) {
      const p = flaskAt(F, u);
      if (p.v <= 0 || p.v >= 1) continue;
      let trail = '';
      for (let j = 1; j <= 4; j++) { const q = flaskAt(F, u - j * 0.025); if (q.v > 0) trail += S.circle(q.x + Math.sin(j + i) * 6, q.y - 30, 9 - j * 1.5, { fill: F.col, opacity: f(0.7 - j * 0.14), stroke: LINE_, 'stroke-width': 2 }); }
      const svg = trail + X.flask({ x: p.x, y: p.y + 34, s: 0.36, rot: p.rot, col: F.col, fill: 0.55, kind: F.kind, t });
      if (i === 0 && p.v > 0.86) flBehind += svg; else fl += svg;
    }
    // the tray tumbling to the floor
    const tv = seg(u, 0.1, 0.7);
    if (tv > 0) {
      const tx = lerp(ST.trip + 70, 780, tv), ty = qb(640, 470, 772, tv);
      mid += S.g(X.flaskTray({ x: 0, y: 0, s: 0.52, cols: [], t }), tf(tx, ty, 1, 380 * ease.out(tv)));
    }
  }
  if (t >= B.trip && tripU(t) >= 0.7) mid += S.g(X.flaskTray({ x: 0, y: 0, s: 0.52, cols: [], t }), tf(780, 772, 1, 20));
  if (hatOn) back += flBehind + E.tableHat(t, wob, t >= B.erupt ? 0.4 : 0);
  return { back, mid, fly: fl };
}
const LINE_ = '#151515';
// the fountain: age stretched so it lands on the principal exactly on "up"
function fountainAge(t) {
  if (t < B.erupt) return 0;
  if (t < B.splat) return seg(t, B.erupt, B.splat);
  return 1 + (t - B.splat);
}
function fountain(t) {
  const age = fountainAge(t);
  if (age <= 0) return '';
  return R.foamFountain({ x: ST.hat.x, y: ST.hat.y + 6, s: 1, t, age, dir: 1, h: 400, curl: 2.3, thick: 1.35, floorY: 765, seed: 2 });
}
// everything on the stage during the act, world space
function actWorld(t, o = {}) {
  const P = actProps(t);
  const scapeK = o.scape ?? (t >= B.erupt ? seg(t, B.erupt + 0.1, B.splat + 0.4) : 0);
  const FS = E.foamScape(t, scapeK);
  let back = P.back + FS.back;
  let chars = principalAct(t, o.prin || {});
  chars += FS.front;
  chars += P.mid;
  chars += o.ivy === false ? '' : ivyAct(t);
  chars += o.hero === false ? '' : heroAct(t);
  chars += P.fly;
  if (o.fountain !== false && t >= B.erupt && t < C.silence) chars += fountain(t);
  if (t >= B.splat) chars += R.foamSplash(ST.prin, 440, t - B.splat, { s: 2.2, n: 22, seed: 4 }) + E.drips(ST.prin - 10, 470, t, 1, { n: 3, fall: 140, spread: 70 });
  if (t >= B.splat - 0.1) chars += E.bannerFoam(t, seg(t, B.splat - 0.1, B.splat + 0.2));
  return { back, chars };
}

// ================================================================ the aftermath / slide / jump world (after the silence)
// hero kneeling/standing in the foam at x (legs hidden by a foreground pile)
function heroIn(t, x, pose = {}, act = {}) {
  return actor('you', t, { x, y: ST.floor + (pose.sink ?? 120), s: S45, t, foam: 0.6, ...pose }, { energy: 0.8, ...act });
}
function ivyIn(t, x, pose = {}, act = {}) {
  return actor('ivy', t, { x, y: ST.floor + (pose.sink ?? 120), s: S45, t, foam: 0.35, ...pose }, { energy: 0.9, ...act });
}
const frontFoam = (t, x, w = 420, h = 170, seed = 6) => R.foamPile(x, 806, w, h, { t, seed });
function aftermath(t, o = {}) {
  const P = actProps(Math.max(t, B.land + 1));
  const FS = E.foamScape(t, 1, o);
  let back = P.back + FS.back;
  let chars = principalAct(t, o.prin || {});
  if (o.stache) chars += R.foamMustache(ST.prin + 2, 404, 0.42 * ease.outBack(clamp(o.stache, 0, 1)), t);
  chars += o.behindMound || '';
  chars += FS.front;
  chars += P.mid;
  chars += E.drips(ST.prin - 10, 470, t, o.drips ?? 1, { n: 3, fall: 140, spread: 70 }) + E.bannerFoam(t, 1);
  return { back, chars };
}

// ================================================================ SHOTS
// A1 — "Friday night." Marquee bulbs, pull back from the banner; house lights going down; curtain closed
function shotA1(t) {
  const u = seg(t, C.marquee, C.house);
  const cam = camLerp(camAt(960, 215, 2.3), camAt(960, 400, 1.12), u, ease.out);
  const lights = lerp(1, 0.55, u);
  const o = stageFrame(t, cam, { lights, curtain: 0, spots: [{ x: 960, y: 770, w: 460 }] });
  return o + R.flash(1 - seg(t, START, START + 0.28)) + K.sparkles([[700, 160, 22], [1230, 180, 18], [1010, 120, 14]].map(([x, y, r]) => { const p = E.toScr(cam, x, y); return [p[0], p[1], r * cam.zoom * 0.6]; }), t);
}
// A2 — "The whole school was there." The full house, pan; Dad + Bea in the front row, Mom's seat empty
function shotA2(t) {
  const u = seg(t, C.house, C.juggler);
  const cam = camLerp(camAt(760, 560, 1.12), camAt(1180, 520, 1.12), u);
  const lights = lerp(0.75, 0.25, seg(t, C.house, B.lightsOut + 0.3));
  const fam = actor('dad', t, { ...HS.dad, t, turn: 0.2, face: 'happy' }, { energy: 0.6 }) + actor('bea', t, { x: HS.dad.x + 70, y: 1176, s: 0.5, t, sign: true, face: 'happy' }, { arms: false });
  return houseFrame(t, cam, { lights }, fam) + whip(t, C.house, 1, 0.1);
}
// A3 — "And every act" — the juggler, 7 pins
function shotA3(t) {
  const u = seg(t, C.juggler, C.twins);
  const cam = camLerp(camAt(960, 540, 1.05), camAt(960, 470, 1.4), u);
  const flour = bump(t, B.pin - 0.1, B.pin + 0.4);
  const chars = actor('juggler', t, { x: 960, y: 772, s: 0.5, t, juggle: t * 1.7, face: { name: 'happy', eyes: { look: [0, -0.8] } }, bodyY: -10 * flour }, { arms: false });
  const spk = K.sparkles([[960, 170, 26], [860, 220, 18], [1060, 200, 20]].map(([x, y, r]) => { const p = E.toScr(cam, x, y); return [p[0], p[1], r * (0.5 + flour)]; }), t);
  return stageFrame(t, cam, { spots: [SP.stage.spots.centre] }, { chars }) + spk + whip(t, C.juggler, -1, 0.1);
}
// A4 — "before yours... was perfect." — synchronized twins, perfect mirrored moves, final pose on "perfect"
function twinPose(t, side) {
  const fin = seg(t, B.perfect - 0.12, B.perfect + 0.05);
  const ph = t * 7.5;
  const a = 90 + 60 * Math.sin(ph), b = 90 - 60 * Math.sin(ph);
  const base = { armL: side < 0 ? a : b, armR: side < 0 ? b : a, turn: side * 0.3 * Math.sin(ph * 0.5), bodyY: 10 * Math.abs(Math.sin(ph)), legL: 4 * Math.sin(ph), legR: -4 * Math.sin(ph) };
  const end = { armL: side < 0 ? 160 : 60, armR: side < 0 ? 60 : 160, turn: side * 0.45, bodyY: 0, legL: side < 0 ? 14 : 0, legR: side < 0 ? 0 : -14, lean: side * -6 };
  const o = {};
  for (const k of Object.keys(base)) o[k] = lerp(base[k], end[k], ease.outBack(fin));
  return o;
}
function shotA4(t) {
  const u = seg(t, C.twins, C.dad);
  const snap = ease.out(seg(t, B.perfect, B.perfect + 0.18));
  const cam = shook(camLerp(camAt(960, 520, 1.12), camAt(960, 500, 1.2), u), t, [[B.perfect, 0.25, 6]]);
  cam.zoom += 0.12 * snap;
  const face = t >= B.perfect ? { name: 'smug', eyes: { type: 'happy' } } : { name: 'happy' };
  const chars = kid(TWIN, { x: 790, y: 772, s: 0.47, ...twinPose(t, -1), face }) + kid(TWIN, { x: 1130, y: 772, s: 0.47, ...twinPose(t, 1), face });
  const k = seg(t, B.perfect, B.perfect + 0.5);
  const spk = k > 0 && k < 1 ? K.sparkles([[760, 300, 34], [1160, 300, 34], [960, 220, 44], [640, 460, 22], [1280, 460, 22]].map(([x, y, r]) => { const p = E.toScr(cam, x, y); return [p[0], p[1], r * (1 - k)]; }), t) + K.C.burst(960, 330, k, '#FFE14D') : '';
  return stageFrame(t, cam, { spots: [SP.stage.spots.left, SP.stage.spots.right] }, { chars }) + spk;
}
// B1 — "Dad came." Dad waving like a proud dad, Bea on his lap, Mom's seat empty
function shotB1(t) {
  const u = seg(t, C.dad, C.mom);
  const cam = camLerp(camAt(880, 820, 1.62), camAt(860, 810, 1.75), u);
  const wv = Math.sin(t * 14);
  const fam = actor('dad', t, { ...HS.dad, t, armR: 150 + 20 * wv, armL: 40, face: { name: 'excited' }, headRot: 4 * wv }, { arms: false }) + actor('bea', t, { x: HS.dad.x + 70, y: 1176, s: 0.5, t, sign: true, face: 'happy' }, { arms: false });
  return houseFrame(t, cam, { lights: 0.25 }, fam) + whip(t, C.dad, -1, 0.1);
}
// B2 — "Mom came straight from her shift." She hurries along the row in her scrubs, drops into her seat: phew
function shotB2(t) {
  const u = seg(t, C.mom, C.bea);
  const sit = seg(t, B.momSit - 0.15, B.momSit + 0.1);
  const walkK = seg(t, C.mom, B.momSit - 0.15);
  const mx = lerp(1640, HS.mom.x, ease.out(walkK) * 0.3 + walkK * 0.7);
  const cam = camLerp(camAt(1380, 800, 1.55), camAt(950, 810, 1.62), seg(t, C.mom, B.momSit + 0.2));
  let mom;
  if (sit <= 0) {
    mom = actor('mom', t, { x: mx, y: HS.mom.y - 150, s: 0.5, t, view: 'side', ...AC.walk(t * 13, 1.2), thermos: true, face: { name: 'nervous', fx: ['eyebags', 'sweat'] } }, { arms: false });
  } else {
    const sq = bump(t, B.momSit, B.momSit + 0.3);
    mom = actor('mom', t, { ...HS.mom, y: lerp(HS.mom.y - 150, HS.mom.y, ease.in(sit)), t, thermos: true, sy: 1 - 0.08 * sq, sx: 1 + 0.06 * sq, face: { name: 'happy', eyes: { type: 'closed' }, fx: ['eyebags'] }, armL: 30, armR: 20 }, { arms: false });
  }
  const dadLook = t > C.mom + 0.4 ? 0.5 : 0.1;
  const fam = actor('dad', t, { ...HS.dad, t, turn: dadLook, face: { name: 'happy', eyes: { look: [0.8, 0] } }, armR: 60 * bump(t, B.momSit, B.momSit + 0.8) + 10, armL: 12 }, { arms: false }) +
    actor('bea', t, { x: HS.dad.x + 70, y: 1176, s: 0.5, t, sign: true, face: { name: 'happy', eyes: { look: [0.8, 0] } } }, { arms: false });
  const phew = seg(t, B.momSit + 0.1, B.momSit + 0.35) * (1 - seg(t, C.bea - 0.2, C.bea));
  const [px, py] = E.toScr(cam, HS.mom.x + 70, 700);
  return houseFrame(t, cam, { lights: 0.25 }, fam + mom) + (phew > 0 ? TFS('phew!', px, py, 46, '#FFFFFF', { opacity: f(phew) }) : '');
}
// B3 — "And Bea made a sign." Bea bounces up on Dad's lap, sign high
function shotB3(t) {
  const u = seg(t, C.bea, C.sign);
  const up = ease.outBack(seg(t, B.signUp - 0.25, B.signUp + 0.1));
  const cam = camLerp(camAt(860, 800, 1.9), camAt(850, 780, 2.1), u);
  const bounce = Math.abs(Math.sin(t * 9)) * 10 * up;
  const fam = actor('dad', t, { ...HS.dad, t, turn: 0.15, face: { name: 'happy', eyes: { look: [0.4, 0.4] } }, armL: 30, armR: 40 }, { arms: false }) +
    actor('mom', t, { ...HS.mom, t, thermos: true, face: { name: 'happy', fx: ['eyebags'], eyes: { look: [-0.6, 0.3] } } }, { arms: false }) +
    actor('bea', t, { x: HS.dad.x + 70, y: 1176 - 80 * up - bounce, s: 0.5, t, sign: true, gapSmile: true, face: { name: 'excited', mouth: 'grin' } }, { arms: false });
  return houseFrame(t, cam, { lights: 0.25 }, fam);
}
// B4 — the beat: the GO MUSHROOM! sign close-up, Bea's eyes peeking over the top
function shotB4(t) {
  const u = seg(t, C.sign, C.principal);
  const z = lerp(1, 1.1, ease.out(u));
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#2A1440' });
  for (let i = 0; i < 14; i++) o += S.circle(hash(i * 3.3) * 1920, hash(i * 7.1) * 1080, 40 + 80 * hash(i), { fill: ['#FFD98A', '#FF6FB5', '#9B6BFF'][i % 3], opacity: 0.18 });
  let w = actor('bea', t, { x: 960, y: 1640, s: 1.55, t, volume: false, armL: 40, armR: 40, face: { name: 'excited', eyes: { look: [0.2, 0.4] } } }, { arms: false });
  w += X.goSign({ x: 960, y: 640, s: 2.1, rot: -3 + 2 * Math.sin(t * 2.4), t });
  // little hands holding the sign
  w += S.rect(520, 690, 70, 90, 30, ol('#F8C9A8', 6)) + S.rect(1340, 670, 70, 90, 30, ol('#F8C9A8', 6));
  o += S.g(w, `translate(960 600) scale(${f(z)}) translate(-960 -600)`);
  const k = seg(t, C.sign + 0.1, C.sign + 0.6);
  o += K.sparkles([[1420, 280, 40 * Math.sin(Math.PI * k)], [480, 330, 30 * Math.sin(Math.PI * k)], [1500, 840, 26 * Math.sin(Math.PI * seg(t, C.sign + 0.3, C.sign + 0.9))]], t);
  return o + whip(t, C.sign, 1, 0.08);
}
// C1 — "And next... Ivy and... you!" — Pemberton at the mic, reading her card, squints at it
function shotC1(t) {
  const u = seg(t, C.principal, C.you);
  const cam = camLerp(camAt(960, 480, 1.7), camAt(960, 455, 1.95), u);
  const sq = seg(t, B.squint - 0.15, B.squint + 0.2);
  const [hx, hy] = AC.hand(lerp(40, 70, sq), -1);
  const card = S.g(S.rect(-50, -34, 100, 68, 6, ol('#FFFDF2', 4)) + S.path('M-34 -14 H30 M-34 0 H20 M-34 14 H26', ln(4, '#7A8AA8')), tf(hx - 10, hy - 30, 1, -8));
  const face = sq > 0.3 && t < B.spot - 0.05 ? { name: 'confused', eyes: { look: [-0.6, 0.7], upper: 0.45 } } : undefined;
  const chars = actor('principal', t, { x: 960, y: 770, s: 0.46, t, armL: lerp(40, 70, sq), headRot: -6 * sq, lean: 3 * sq, face, props: [{ svg: card, layer: 'front' }] }, { arms: false, energy: 0.7 });
  return stageFrame(t, cam, { mic: 960, spots: [SP.stage.spots.centre] }, { chars }) + whip(t, C.principal, -1, 0.1);
}
// C2 — "you!" — backstage, a spotlight slams onto the hero; Ivy fist-pumps
function shotC2(t) {
  const cam = shook(camAt(1240, 640, 1.45), t, [[B.spot, 0.25, 10]]);
  const hit = seg(t, B.spot, B.spot + 0.08);
  const jolt = bump(t, B.spot, B.spot + 0.3);
  let ch = actor('you', t, { ...WG.hero, t, sy: 1 + 0.06 * jolt, sx: 1 - 0.04 * jolt, armL: 30 + 50 * jolt, armR: 30 + 50 * jolt, face: { name: 'shocked', mouth: 'O', fx: ['exclaim'] },
    props: [{ svg: X.flaskTray({ x: 0, y: -293, s: 1.15, t }), layer: 'front' }] }, { arms: false });
  ch += actor('ivy', t, { ...WG.ivy, t, armR: 150 + 20 * Math.sin(t * 16), armL: 140 + 20 * Math.sin(t * 16 + 1), face: 'excited', lift: 20 * Math.abs(Math.sin(t * 8)) }, { arms: false });
  const spot = hit > 0 ? S.path(`M1500 -300 L1700 -300 L${1150 + 210} 960 L${1150 - 210} 960 Z`, { fill: '#FFF6D8', opacity: f(0.28 * hit) }) + S.ellipse(1150, 956, 230, 40, { fill: '#FFF6D8', opacity: f(0.5 * hit) }) : '';
  return wingsFrame(t, cam, ch + spot) + flashAt(t, B.spot, 0.12, 0.6);
}
// C3 — "With Science Magic!" — the marquee flips to SCIENCE MAGIC, applause sparkles
function shotC3(t) {
  const u = seg(t, C.magic, C.noCp);
  const cam = camLerp(camAt(960, 240, 1.75), camAt(960, 300, 1.5), u);
  const fl = seg(t, B.banner - 0.18, B.banner + 0.12);
  let top = '';
  // the new banner flips in over the set's banner (scaleY)
  const sy = fl < 0.5 ? 1 - fl * 2 : (fl - 0.5) * 2;
  const txt = fl < 0.5 ? 'TALENT SHOW' : 'SCIENCE MAGIC!';
  top += S.g(SS.marqueeBanner(0, 0, 0.85, t, txt, 1), `translate(960 205) scale(1 ${f(Math.max(0.02, sy))})`);
  const k = seg(t, B.banner + 0.1, B.banner + 0.8);
  let o = stageFrame(t, cam, { spots: SPOTS3, banner: 'TALENT SHOW' }, { top });
  if (k > 0 && k < 1) o += K.sparkles([[420, 250, 50 * (1 - k)], [1500, 230, 44 * (1 - k)], [700, 520, 30 * (1 - k)], [1240, 540, 34 * (1 - k)]], t) + K.C.burst(960, 300, k, '#FFE14D');
  return o;
}
// D1 — "No checkpoint." — he looks into his empty hand: where the flag used to be
function shotD1(t) {
  const u = seg(t, C.noCp, C.noReset);
  const cam = camLerp(camAt(1140, 600, 1.7), camAt(1130, 590, 1.85), u);
  const k = seg(t, B.cp - 0.1, B.cp + 0.25);
  const ch = actor('you', t, { ...WG.hero, t, armR: 64, armL: 22, headRot: 6, face: { name: 'nervous', eyes: { look: [0.5, 0.6] }, fx: ['sweat'] } }, { arms: false });
  const [hx, hy] = AC.hand(64, 1);
  const icon = E.missingFlag(WG.hero.x + hx * 0.5 + 20, WG.hero.y + hy * 0.5 - 10, 0.42, k, t);
  return wingsFrame(t, cam, ch + icon, '', 0.1) + whip(t, C.noCp, 1, 0.08);
}
// D2 — "No reset." — the RESET button is greyed out and locked; LIVES: 1
function shotD2(t) {
  const cam = camAt(1180, 610, 1.6, -3);
  const pr = bump(t, B.reset - 0.05, B.reset + 0.3);
  const ch = actor('you', t, { ...WG.hero, t, turn: -0.3, armR: 90 + 20 * pr, armL: 20, face: { name: 'scared', eyes: { look: [0.6, -0.2] } } }, { arms: false });
  const k = pop(t, B.reset - 0.08, 0.3);
  const jig = Math.sin(t * 70) * 10 * bump(t, B.reset + 0.15, B.reset + 0.5);
  const btn = E.lockedButton(1380 + jig, 300, k, t);
  const hud = R.counterHUD({ x: 60, y: 80, label: 'LIVES:', value: 1, theme: 'white', icon: 'heart', t, k: pop(t, C.noReset, 0.3), bump: seg(t, B.reset + 0.1, B.reset + 0.55) });
  return wingsFrame(t, cam, ch, '', 0.12) + btn + hud;
}
// D3 — "No pause menu." — the snap... the menu sputters, MENU UNAVAILABLE, collapses to a dot
function shotD3(t) {
  const u = seg(t, C.noMenu, C.justYou);
  const cam = camLerp(camAt(1080, 560, 1.25), camAt(1100, 580, 1.35), u);
  const sn = seg(t, B.snap - 0.25, B.snap);
  const ch = actor('you', t, { ...WG.hero, t, armR: lerp(40, 150, ease.out(sn)), armL: 24, face: { name: 'determined', eyes: { look: [0.6, -0.8] } } }, { arms: false });
  const hud = R.counterHUD({ x: 60, y: 80, label: 'LIVES:', value: 1, theme: 'white', icon: 'heart', t });
  const [hx, hy] = AC.hand(150, 1);
  const [sx, sy] = E.toScr(cam, WG.hero.x + hx * 0.5, WG.hero.y + hy * 0.5);
  const menu = t >= B.snap ? R.escMenu({ x: 760, y: 380, s: 0.78, broken: seg(t, B.snap, B.snap + 1.4), t }) : '';
  return wingsFrame(t, cam, ch, '', 0.12) + menu + E.snapFx(sx, sy, t - B.snap, 1.2) + hud;
}
// D4 — "Just you..." — slow push on him alone in the dark, knees knocking
function shotD4(t) {
  const u = seg(t, C.justYou, C.people);
  const cam = camLerp(camAt(1150, 600, 1.6), camAt(1150, 580, 2.0), u, ease.out);
  const knock = Math.sin(t * 30) * 5;
  const ch = actor('you', t, { ...WG.hero, t, legL: knock, legR: -knock, armL: 14, armR: 14, face: { name: 'scared', fx: ['sweat2'] }, sy: 0.98 }, { arms: false });
  const spot = S.ellipse(1150, 950, 260, 50, { fill: '#FFF6D8', opacity: 0.25 });
  return wingsFrame(t, cam, spot + ch, '', 0.35) + R.counterHUD({ x: 60, y: 80, label: 'LIVES:', value: 1, theme: 'white', icon: 'heart', t, k: 1 - seg(t, C.people - 0.2, C.people) });
}
// D5 — "...and four hundred people." — POV through the curtain gap: the full house; PLAYERS IN SERVER: 400
function shotD5(t) {
  const u = seg(t, C.people, C.hands);
  const cam = camLerp(camAt(960, 560, 1.35), camAt(960, 560, 1.0), u, ease.out);
  let o = houseFrame(t, cam, { lights: 0.15 }, family(t, { mom: { face: 'happy' }, bea: 'lap' }));
  // the curtain edges (we're peeking from the wings)
  const gap = lerp(260, 420, ease.out(u));
  o += S.path(`M-20 -20 L${f(960 - gap)} -20 Q${f(960 - gap - 40)} 540 ${f(960 - gap)} 1100 L-20 1100 Z`, { fill: 'url(#ssVelvet)', stroke: LINE_, 'stroke-width': 8 });
  o += S.path(`M1940 -20 L${f(960 + gap)} -20 Q${f(960 + gap + 40)} 540 ${f(960 + gap)} 1100 L1940 1100 Z`, { fill: 'url(#ssVelvet)', stroke: LINE_, 'stroke-width': 8 });
  o += R.counterHUD({ x: 960, y: 130, anchor: 'center', label: 'PLAYERS IN SERVER:', value: 400, theme: 'grey', icon: 'gfx', roll: seg(t, B.four, B.people), from: 1, t, k: pop(t, C.people + 0.05, 0.3), bump: seg(t, B.people, B.people + 0.4) });
  return o + whip(t, C.people, 1, 0.08);
}
// E1 — "Okay. One try." — the shaking hands, the flasks rattling on the tray
function shotE1(t) {
  const u = seg(t, C.hands, C.oneTry);
  const cam = camLerp(camAt(1150, 760, 2.5), camAt(1150, 745, 2.75), u);
  const sh = Math.sin(t * 47) * 3;
  const tray = X.flaskTray({ x: 0, y: -293, s: 1.15, t, tilt: Math.sin(t * 41) * 5 });
  const ch = actor('you', t, { ...WG.hero, t, armL: 26 + sh, armR: 26 - sh, volume: false, props: [{ svg: tray, layer: 'front' }], face: { name: 'nervous', fx: ['sweat'] } }, { arms: false });
  let o = wingsFrame(t, cam, ch, '', 0.15);
  const k = (Math.floor(t * 7) % 2) * 0.9;
  o += TFS('clink', 760 + 30 * Math.sin(t * 3), 400, 40, '#FFFFFF', { opacity: f(k), transform: 'rotate(-8 760 400)' }) + TFS('clink', 1240, 330, 34, '#FFFFFF', { opacity: f(0.9 - k), transform: 'rotate(10 1240 330)' });
  return o;
}
// E2 — "Only one try." — face close-up, whisper; Ivy's hand lands on his shoulder
function shotE2(t) {
  const u = seg(t, C.oneTry, C.ladies);
  const cam = camLerp(camAt(1180, 580, 2.2), camAt(1180, 575, 2.45), u);
  const hand = seg(t, C.oneTry + 0.2, C.oneTry + 0.45);
  const ch = actor('you', t, { ...WG.hero, t, armL: 26, armR: 26, volume: false, props: [{ svg: X.flaskTray({ x: 0, y: -293, s: 1.15, t }), layer: 'front' }], face: { name: 'nervous', eyes: { look: [-0.2, 0.1] }, fx: ['sweat'] } }, { arms: false }) +
    actor('ivy', t, { x: WG.ivy.x - 40 * hand, y: WG.ivy.y, s: 0.5, t, turn: -0.5, armR: 20, armL: 40 + 50 * hand, face: { name: 'happy', eyes: { look: [-1, 0] } }, volume: false }, { arms: false });
  return wingsFrame(t, cam, ch, '', 0.15);
}
// F1 — "Ladies and gentlemen!" — the spots slam on, Ivy leaps into the light, hat in hand
function shotF1(t) {
  const u = seg(t, C.ladies, C.hat);
  const cam = shook(camLerp(camAt(960, 520, 1.0), camAt(940, 500, 1.18), seg(t, B.gentlemen - 0.2, C.hat)), t, [[B.spots, 0.25, 8]]);
  const on = t >= B.spots ? 1 : 0;
  const W_ = actWorld(t);
  const o = stageFrame(t, cam, { spots: on ? [SP.stage.spots.left, { x: ST.ivy, y: 765, w: 460 }, SP.stage.spots.right] : [] }, { back: W_.back, chars: W_.chars });
  return o + (t < B.spots ? S.rect(0, 0, 1920, 1080, 0, { fill: '#05020A', opacity: 0.55 }) : '') + flashAt(t, B.spots, 0.14, 0.7, '#FFF6D8');
}
// F2 — "From this ordinary hat," — Ivy close: shows the empty hat, taps it with the wand
function shotF2(t) {
  const u = seg(t, C.hat, C.walk);
  const cam = camLerp(camAt(ST.ivy + 40, 500, 1.85), camAt(ST.ivy + 60, 490, 2.05), u);
  const W_ = actWorld(t);
  const k = seg(t, B.hatShow + 0.1, B.hatShow + 0.5);
  const [px, py] = E.toScr(cam, ST.ivy + 120, 420);
  return stageFrame(t, cam, { spots: [{ x: ST.ivy, y: 765, w: 460 }, SP.stage.spots.right] }, { back: W_.back, chars: W_.chars }) + (k > 0 && k < 1 ? K.sparkles([[px, py, 30 * Math.sin(Math.PI * k)], [px + 60, py - 50, 20 * Math.sin(Math.PI * k)]], t) : '');
}
// F3 — "I will now pull out—" — wide: hat on the table, Ivy's wand over it, the hero walks in with the tray...
function shotF3(t) {
  const cam = camLerp(camAt(900, 520, 1.05), camAt(820, 540, 1.12), seg(t, C.walk, C.foot));
  const W_ = actWorld(t);
  return stageFrame(t, cam, { spots: [{ x: ST.ivy, y: 765, w: 460 }, SP.stage.spots.right, { x: 560, y: 768, w: 380 }] }, { back: W_.back, chars: W_.chars }) + whip(t, C.walk, -1, 0.08);
}
// F4 — the foot hooks the mic cable (low close-up), time starts to slow
function shotF4(t) {
  const cam = camLerp(camAt(ST.trip + 40, 700, 2.7), camAt(ST.trip + 90, 680, 2.9), seg(t, C.foot, C.slowmo));
  const W_ = actWorld(t);
  const ex = pop(t, B.trip, 0.2);
  let o = stageFrame(t, cam, { spots: [{ x: 560, y: 768, w: 380 }, SP.stage.spots.right] }, { back: W_.back, chars: W_.chars });
  if (ex > 0) o += TS('!', 1180, 300, 220 * ex, '#FFE14D', { transform: 'rotate(8 1180 300)' });
  return o + slowGradeK(t, seg(t, B.trip, C.slowmo)) + flashAt(t, B.trip, 0.1, 0.4);
}
const slowGradeK = (t, k) => E.slowGrade(t, k);
// G — "And of course..." — slow motion: he flies, the flasks spin through the air, Ivy ducks, the mic stand topples
function shotG(t) {
  const u = seg(t, C.slowmo, C.erupt);
  const k3 = ease.inOut(u);
  // follow the pink flask
  const p = flaskAt(FLASKS[0], tripU(t));
  const cam = camLerp(camAt(700, 520, 1.5, -4), camAt(p.x * 0.6 + 980 * 0.4, Math.min(560, p.y + 160), 1.45, 3), k3);
  const W_ = actWorld(t);
  const tw = C.slowmo + (t - C.slowmo) * 0.25;   // the world's idle motion crawls
  let o = stageFrame(t, cam, { tw, spots: [{ x: ST.ivy, y: 765, w: 460 }, SP.stage.spots.right, { x: 560, y: 768, w: 380 }] }, { back: W_.back, chars: W_.chars });
  return o + E.slowGrade(t, 1 - seg(t, C.erupt - 0.08, C.erupt));
}
// H — "...you messed up." — the hat ERUPTS (too early, huge), curls over and buries Principal Pemberton
function shotH(t) {
  const u = seg(t, C.erupt, C.gasp);
  const base = camLerp(camAt(ST.hat.x, 420, 1.6), camAt(1120, 380, 0.74), seg(t, B.erupt, B.erupt + 0.3), ease.out);
  const cam = shook(base, t, [[B.erupt, 0.5, 22], [B.splat, 0.4, 18]]);
  const W_ = actWorld(t);
  let o = stageFrame(t, cam, { spots: SPOTS3 }, { back: W_.back, chars: W_.chars });
  const [hx, hy] = E.toScr(cam, ST.hat.x, 200);
  o += K.bang('KA-FOOSH!', hx - 260, hy, seg(t, B.erupt + 0.05, B.erupt + 0.25), 110, -8, '#FFFFFF');
  const [sx, sy] = E.toScr(cam, ST.prin, 330);
  o += K.bang('SPLAT!', sx + 40, sy - 40, seg(t, B.splat, B.splat + 0.15), 100, 8, '#FF6FA8');
  return o + flashAt(t, B.erupt, 0.18, 0.85) + flashAt(t, B.splat, 0.1, 0.35) + E.slowGrade(t, 1 - seg(t, C.erupt, C.erupt + 0.1));
}
// I1 — the house GASPS
function shotI1(t) {
  const u = seg(t, C.gasp, C.silence);
  const cam = camLerp(camAt(960, 760, 1.3), camAt(960, 760, 1.42), u, ease.out);
  const fam = family(t, { dadFace: { name: 'shocked', mouth: 'O' }, dadArms: [20, 20], mom: { face: { name: 'shocked', mouth: 'O' }, armL: 40, armR: 70, phone: false }, bea: 'seat', beaPose: { sign: true, face: { name: 'shocked', mouth: 'O' } } });
  return houseFrame(t, cam, { lights: 0.15, gasp: 1 }, fam) + whip(t, C.gasp, 1, 0.07);
}
// I2 — DEAD SILENCE. Static wide; foam drips off the principal; a cricket. Hold the awkward beat.
function shotI2(t) {
  const cam = camAt(980, 520, 1.06);
  const A = aftermath(t, { prin: { face: { name: 'deadpan', eyes: { upper: 0.55, blink: bump(t, B.drip - 0.4, B.drip - 0.1) } } } });
  let chars = A.chars + E.dropAt(ST.prin + 2, 420, t, B.drip, 200);
  chars += E.lying('you', t, ST.fall, ST.floor, S45, { t, foam: 0.3, face: { name: 'oof', eyes: { type: 'x' } }, armL: 160, armR: 150 });
  chars += ivyAct(t);
  chars += E.cricket(330, 800, 0.45, t, [B.chirp1, B.chirp1 + 0.45]);
  return stageFrame(t, cam, { spots: SPOTS3, tw: C.silence }, { back: A.back, chars });
}
// the kneeling hero CU (J1-J3) — x = ST.fall
function heroKneel(t, pose = {}) {
  return heroIn(t, ST.fall, { volume: false, foam: 0.6, ...pose }, { arms: false });
}
// J1 — "Reset..." — he snaps: nothing
function shotJ1(t) {
  const cam = camAt(ST.fall + 20, 560, 2.2);
  const A = aftermath(t);
  const sn = seg(t, B.snap1 - 0.2, B.snap1);
  const chars = A.chars + ivyAct(t) + heroKneel(t, { armR: lerp(30, 120, ease.out(sn)), armL: 20, face: { name: 'scared', eyes: { pupil: 0.55 }, fx: ['sweat'] } }) + frontFoam(t, ST.fall, 460, 180);
  const [hx, hy] = AC.hand(120, 1);
  const [sx, sy] = E.toScr(cam, ST.fall + hx * S45, ST.floor + 120 + hy * S45);
  const menu = t >= B.snap1 ? R.escMenu({ x: sx - 150, y: sy - 220, s: 0.45, broken: 0.25 * seg(t, B.snap1, B.snap1 + 0.5), t }) : '';
  return stageFrame(t, cam, { spots: SPOTS3, tw: C.silence }, { back: A.back, chars }) + menu + E.snapFx(sx, sy, t - B.snap1, 1.1);
}
// J2 — "reset..." — snap: a ghost of the RESPAWNING overlay flickers... and dies
function shotJ2(t) {
  const cam = camAt(ST.fall + 10, 545, 2.6, 4);
  const A = aftermath(t);
  const sn = seg(t, B.snap2 - 0.2, B.snap2);
  const chars = A.chars + heroKneel(t, { armR: lerp(60, 135, ease.out(sn)), armL: 30, face: { name: 'scared', mouth: 'wavy', eyes: { pupil: 0.5 }, fx: ['sweat2'] } }) + frontFoam(t, ST.fall, 460, 180);
  const [hx, hy] = AC.hand(135, 1);
  const [sx, sy] = E.toScr(cam, ST.fall + hx * S45, ST.floor + 120 + hy * S45);
  let o = stageFrame(t, cam, { spots: SPOTS3, tw: C.silence }, { back: A.back, chars }) + E.snapFx(sx, sy, t - B.snap2, 1.1);
  const g = t - B.snap2;
  if (g > 0 && g < 0.55) {
    const fl = hash(Math.floor(t * 24)) > 0.35 ? 1 : 0.2;
    const op = 0.5 * fl * (1 - seg(g, 0.3, 0.55));
    const dx = (hash(Math.floor(t * 30)) - 0.5) * 40;
    const ov = R.respawnOverlay(t, { t0: B.snap2, dur: 0.9, label: R.scramble('RESPAWNING', t, seg(g, 0.1, 0.4), 3), flash: false });
    o += S.g(ov, `translate(${f(dx)} 0) translate(960 540) scale(1 ${f(1 - 0.97 * ease.in(seg(g, 0.32, 0.55)))}) translate(-960 -540)`, { opacity: f(op) });
    o += R.flash(0.12 * fl * (1 - seg(g, 0.3, 0.55)), '#B9C0CC');
  }
  return o;
}
// J3 — "RESET!" — he screams at the ceiling; nothing. LIVES: 1 pulses red
function shotJ3(t) {
  const sm = ease.out(seg(t, B.scream - 0.05, B.scream + 0.08));
  const cam = shook({ ...camAt(ST.fall + 10, lerp(540, 520, sm), lerp(2.3, 3.0, sm)), rot: -3 }, t, [[B.scream, 0.4, 14]]);
  const A = aftermath(t);
  const chars = A.chars + heroKneel(t, { armR: 165, armL: 165, headRot: -6, face: { name: 'scream', eyes: { type: 'closed' } } }) + frontFoam(t, ST.fall, 460, 180);
  let o = stageFrame(t, cam, { spots: SPOTS3, tw: C.silence }, { back: A.back, chars });
  o += zoomLines(960, 420, sm * (1 - seg(t, B.scream + 0.4, C.whisper)), t);
  o += R.counterHUD({ x: 60, y: 80, label: 'LIVES:', value: 1, theme: 'red', icon: 'heart', t, bump: seg(t, B.scream, B.scream + 0.45) });
  return o;
}
// K1 — "Fail number three hundred and thirteen." — Ivy kneels beside him, whispering, the BOOK OF FAILS
function bookProp(open = 1, hl = 0) {
  const pages = [['FAIL #313', 'Talent show'], ['LESSON:', '...TBD']];
  return S.g(X.bookOfFails({ x: 0, y: 0, s: 0.62, open: true, pages }) + (hl > 0 ? S.ellipse(-90, -52, 110 * hl, 30 * hl, { fill: 'none', stroke: '#E8453C', 'stroke-width': 6 }) : ''), `translate(0 -400) scale(${f(Math.max(0.05, open))} 1)`);
}
function shotK1(t) {
  const u = seg(t, C.whisper, C.letsMake);
  const cam = camLerp(camAt(ST.fall + 80, 560, 1.95), camAt(ST.fall + 80, 555, 2.2), u);
  const A = aftermath(t);
  const op = ease.outBack(seg(t, B.book - 0.1, B.book + 0.25));
  const hl = ease.out(seg(t, B.n313, B.n313 + 0.3));
  const look = seg(t, C.whisper + 0.4, C.whisper + 1.2);
  const chars = A.chars +
    heroKneel(t, { x: ST.fall - 40, armL: 18, armR: 18, turn: 0.35 * look, face: { name: look > 0.5 ? 'sad' : 'scared', eyes: { look: [0.7 * look, 0.1] }, fx: look > 0.8 && u > 0.7 ? ['blush'] : [] } }) +
    ivyIn(t, ST.fall + 190, { x: ST.fall + 190, sink: 110, turn: -0.45, lean: 6, headRot: 8, armL: 34, armR: 34, props: [{ svg: bookProp(op, hl), layer: 'front' }], face: { name: 'happy', eyes: { look: [-0.8, 0.2] } } }, { arms: false }) +
    frontFoam(t, ST.fall + 80, 620, 190);
  return stageFrame(t, cam, { spots: SPOTS3, tw: C.silence + (t - C.whisper) * 0.3 }, { back: A.back, chars });
}
// K2 — "Let's make it a good one." — the wink, she snaps the book shut and springs up
function shotK2(t) {
  const u = seg(t, C.letsMake, C.slide);
  const cam = camLerp(camAt(ST.fall + 190, 520, 2.5), camAt(ST.fall + 160, 470, 2.1), seg(t, B.wink + 0.2, C.slide));
  const A = aftermath(t);
  const shut = 1 - seg(t, B.wink + 0.15, B.wink + 0.35);
  const rise = ease.inOut(seg(t, B.wink + 0.35, C.slide - 0.1));
  const wink = bump(t, B.wink - 0.05, B.wink + 0.45);
  const chars = A.chars +
    heroKneel(t, { x: ST.fall - 40, armL: 18, armR: 18, turn: 0.4, face: { name: rise > 0.3 ? 'confused' : 'sad', eyes: { look: [0.6, -0.6 * rise] } } }) +
    ivyIn(t, ST.fall + 190, { x: ST.fall + 190, sink: lerp(110, 0, rise), turn: -0.45 + 0.3 * rise, lean: 6 - 6 * rise, armL: shut > 0.05 ? 34 : 30 + 100 * rise, armR: shut > 0.05 ? 34 : 20, volume: false,
      props: shut > 0.05 ? [{ svg: bookProp(shut, 1), layer: 'front' }] : [], face: wink > 0.3 ? { name: 'smug', eyes: { type: 'happy' }, fx: ['sparkles'] } : { name: 'smug', eyes: { look: [-0.8, 0.2] } } }, { arms: false }) +
    frontFoam(t, ST.fall + 80, 620, 190);
  return stageFrame(t, cam, { spots: SPOTS3, tw: C.silence + (t - C.whisper) * 0.3 }, { back: A.back, chars });
}
// L1 — "So you did something..." — Ivy runs, dives and belly-slides across the foam into the mound: SPLOOSH
function ivySlide(t, x0 = ST.ivy - 60) {
  const run = seg(t, C.slide, B.dive);
  const sl = seg(t, B.dive, B.plunge);
  if (t < B.dive) {
    const x = lerp(x0, x0 + 260, run);
    return actor('ivy', t, { x, y: ST.floor, s: S45, t, view: 'side', flip: true, ...AC.run(t * 16), foam: 0.35, face: { name: 'joy' } }, { arms: false });
  }
  if (t < B.plunge) {
    const x = lerp(x0 + 260, ST.mound.x - 180, ease.out(sl));
    const lift = 70 * Math.sin(Math.PI * seg(sl, 0, 0.25));
    return actor('ivy', t, { x, y: ST.floor + 395 * S45 * clamp(sl * 4, 0, 1) - 20, s: S45, t, view: 'side', flip: true, rot: lerp(-30, -88, clamp(sl * 4, 0, 1)), lift, armL: 170, armR: 170, legL: -10, legR: 10, foam: 0.5, face: { name: 'joy' }, shadow: false }, { arms: false }) +
      K.C.speedLines(x - 420, x - 200, 720, 6, 3, '#FFFFFF', 80);
  }
  return '';
}
function shotL1(t) {
  const u = seg(t, C.slide, C.hesitate);
  const cam = camLerp(camAt(980, 520, 1.02), camAt(1080, 520, 1.1), u);
  const A = aftermath(t);
  let chars = A.chars + ivySlide(t);
  chars += heroIn(t, ST.fall - 40, { x: ST.fall - 40, sink: 110, turn: 0.5, face: { name: 'shocked', mouth: 'O', eyes: { look: [1, 0] } }, armL: 20, armR: 30 }, { arms: false }) + frontFoam(t, ST.fall - 40, 380, 150, 9);
  if (t >= B.plunge) {
    const g = t - B.plunge;
    chars += R.foamSplash(ST.mound.x - 150, 600, g, { s: 1.8, n: 20, seed: 6 });
    const pop_ = ease.outBack(seg(g, 0.25, 0.6));
    if (pop_ > 0) chars += ivyIn(t, ST.mound.x - 150, { x: ST.mound.x - 150, y: 700 - 0 * pop_, sink: 0, s: S45 * pop_ + 0.001, armL: 160, armR: 160, foam: 0.9, face: 'joy' }, { arms: false });
  }
  let o = stageFrame(t, cam, { spots: SPOTS3 }, { back: A.back, chars });
  const [px, py] = E.toScr(cam, ST.mound.x - 150, 420);
  o += K.bang('WHEEE!', px - 300, py - 60, seg(t, B.dive, B.dive + 0.2) * (1 - seg(t, B.plunge + 0.3, B.plunge + 0.5)), 90, -10, '#3FE0FF');
  o += K.bang('SPLOOSH!', px + 80, py, seg(t, B.plunge, B.plunge + 0.15), 90, 8, '#FFFFFF');
  return o + whip(t, C.slide, 1, 0.08);
}
// the mound with Ivy popped out of it (for L2/L3 backgrounds)
function ivyInMound(t, wave = 0) {
  return ivyIn(t, ST.mound.x - 150, { x: ST.mound.x - 150, y: 700, sink: 0, armL: 150 + 20 * Math.sin(t * 9) * wave, armR: 40 + 100 * wave * (0.5 + 0.5 * Math.sin(t * 9)), foam: 0.9, face: 'joy' }, { arms: false });
}
// L2 — "...you had never done before." — he stands, hesitates: the foam... the 400 people... the foam. Deep breath.
function shotL2(t) {
  const u = seg(t, C.hesitate, C.jump);
  const beat = 1 + 0.012 * Math.max(0, Math.sin(t * 7.5)) ** 8;
  const c0 = camLerp(camAt(ST.fall + 40, 540, 1.9), camAt(ST.fall + 40, 520, 2.5), u, ease.inOut);
  const cam = { ...c0, zoom: c0.zoom * beat };
  const A = aftermath(t, { behindMound: ivyInMound(t, 1) });
  const lookA = seg(t, C.hesitate, C.hesitate + 0.3), lookB = seg(t, B.gulp - 0.2, B.gulp), lookC = seg(t, B.breath - 0.3, B.breath);
  const lx = lookB > 0 && lookC < 1 ? lerp(1, 0, lookB) + lerp(0, 1, lookC) : lookA;
  const face = t < B.gulp ? { name: 'nervous', eyes: { look: [lx, 0] }, fx: ['sweat'] } : t < B.breath ? { name: 'scared', mouth: 'wavy', eyes: { look: [lx, 0.1] }, fx: ['sweat2'] } : { name: 'determined', eyes: { look: [lx, 0] } };
  const breath = bump(t, B.breath, C.jump);
  const chars = A.chars + heroIn(t, ST.fall + 40, { x: ST.fall + 40, sink: 0, foam: 0.6, armL: 16, armR: 16, sy: 1 + 0.04 * breath, sx: 1 + 0.02 * breath, face, volume: false }, { arms: false }) + frontFoam(t, ST.fall + 40, 440, 120, 9);
  let o = stageFrame(t, cam, { spots: SPOTS3 }, { back: A.back, chars });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#05020A', opacity: f(0.18 * u) });
  if (t >= B.gulp && t < B.gulp + 0.5) o += TFS('gulp', 1280, 420, 46, '#FFFFFF', { opacity: f(1 - seg(t, B.gulp + 0.3, B.gulp + 0.5)) });
  return o + E.letterbox(seg(t, C.hesitate, C.hesitate + 0.4), 70);
}
// L3 — "You kept going." — he runs and cannonballs into the foam: KER-SPLOOSH
function heroJump(t) {
  const run = seg(t, C.jump, B.leap), air = seg(t, B.leap, B.splash);
  if (t < B.leap) {
    const x = lerp(ST.fall + 40, ST.fall + 330, run);
    return actor('you', t, { x, y: ST.floor, s: S45, t, view: 'side', flip: true, ...AC.run(t * 17), foam: 0.6, face: { name: 'determined' } }, { arms: false });
  }
  if (t < B.splash) {
    const x = lerp(ST.fall + 330, ST.mound.x - 120, air);
    const lift = 300 * Math.sin(Math.PI * air) * (1 - 0.3 * air);
    const tuck = seg(air, 0.2, 0.45);
    return actor('you', t, { x, y: ST.floor - (air > 0.7 ? 120 * seg(air, 0.7, 1) : 0), s: S45, t, view: 'side', flip: true, lift, rot: -40 * Math.sin(Math.PI * air), legL: lerp(-30, 100, tuck), kneeL: lerp(20, 120, tuck), legR: lerp(30, 100, tuck), kneeR: lerp(30, 120, tuck), armL: lerp(160, 60, tuck), armR: lerp(160, 70, tuck), foam: 0.6, face: { name: 'excited', mouth: 'scream' }, shadow: false }, { arms: false });
  }
  return '';
}
function shotL3(t) {
  const u = seg(t, C.jump, C.disco);
  const cam = shook(camLerp(camAt(ST.fall + 200, 520, 1.3), camAt(ST.mound.x - 140, 470, 1.15), seg(t, C.jump, B.splash)), t, [[B.splash, 0.45, 20]]);
  const A = aftermath(t, { behindMound: t < B.splash ? ivyInMound(t, 1) : '' });
  let chars = A.chars + heroJump(t);
  if (t >= B.splash) {
    const g = t - B.splash;
    chars += R.foamSplash(ST.mound.x - 120, 560, g, { s: 3, n: 30, seed: 9 });
  }
  let o = stageFrame(t, cam, { spots: SPOTS3 }, { back: A.back, chars });
  o += K.bang('KER-SPLOOSH!', 960, 300, seg(t, B.splash, B.splash + 0.15), 120, -6, '#FFFFFF');
  return o + flashAt(t, B.splash, 0.14, 0.7);
}

// ================================================================ the FOAM DISCO
const STACHE_T = () => B.chant[1] + 0.32;
function discoWorld(t, o = {}) {
  const A = aftermath(t, { stache: seg(t, STACHE_T(), STACHE_T() + 0.25), drips: 0.5 });
  let chars = A.chars;
  // snowman at stage left (built on the 4th FOAM)
  const snowK = o.snow ?? seg(t, B.chant[3] - 0.15, B.chant[3] + 0.25);
  chars += R.foamSnowman(470, 772, 0.72, t, { k: t >= B.chant[3] - 0.15 ? snowK : 0 });
  return { back: A.back, chars };
}
// the two dancing in the foam (world), dx = offset
function dancers(t, o = {}) {
  const ph = t * 1.0;
  const hx = o.heroX ?? 980, ix = o.ivyX ?? 1200;
  let out = '';
  out += actor('ivy', t, { x: ix, y: ST.floor + 40, s: S45, t, ...AC.floss(t * 1.1 + 0.5), foam: 0.9, face: { name: 'joy' }, ...(o.ivy || {}) }, { arms: false, energy: 1.4 });
  out += actor('you', t, { x: hx, y: ST.floor + 40, s: S45, t, armL: 150 + 25 * Math.sin(ph * 9), armR: 150 + 25 * Math.sin(ph * 9 + Math.PI), lean: 6 * Math.sin(ph * 4.5), bodyY: 12 * Math.abs(Math.sin(ph * 9)), foam: 1, face: { name: 'joy' }, ...(o.hero || {}) }, { arms: false, energy: 1.4 });
  out += R.foamPile((hx + ix) / 2, 800, 640, 130, { t, seed: 12 });
  return out;
}
const partyTop = (t, k = 1) => E.beams(t, k) + E.bubbles(t, k * 0.9) + E.discoBall(960, 250, 64, t, seg(t, B.ball, B.ball + 0.8), -300);
// M — the beat: the FOAM DISCO opens — disco ball drops, beams sweep, they burst out of the foam dancing
function shotM(t) {
  const u = seg(t, C.disco, C.foam1);
  const cam = camLerp(camAt(1120, 330, 0.86, -7), camAt(1100, 520, 1.28, 4), u, ease.inOut);
  const D = discoWorld(t);
  const up = ease.outBack(seg(t, C.disco, C.disco + 0.45));
  const chars = D.chars + dancers(t, { hero: { y: ST.floor + 40 + 260 * (1 - up) }, ivy: { y: ST.floor + 40 + 260 * (1 - seg(t, C.disco + 0.1, C.disco + 0.55)) } });
  let o = stageFrame(t, cam, { spots: SPOTS3, confetti: 1, lights: 0 }, { back: D.back, chars, top: partyTop(t) });
  o += E.specks(t, seg(t, B.ball + 0.4, B.ball + 1));
  return o + flashAt(t, C.disco, 0.12, 0.6);
}
// house chant shots
function shotN1(t) {
  const u = seg(t, C.foam1, C.foam2);
  const cam = shook(camLerp(camAt(960, 560, 1.02, -2), camAt(960, 580, 1.1, 2), u), t, [[B.chant[0], 0.2, 8]]);
  const fam = family(t, { dadFace: 'joy', dadArms: [150, 150], mom: { phone: true, face: 'joy', armL: 140 }, bea: 'seat', beaPose: { sign: 'up', face: 'excited', lift: 20 * Math.abs(Math.sin(t * 8)) } });
  let o = houseFrame(t, cam, { lights: 0.2, cheer: 1, wave: true, phones: 1 }, fam);
  return o + E.specks(t, 0.7) + chantWord(t, 0) + whip(t, C.foam1, -1, 0.08);
}
function chantWord(t, i, x = 960, y = 330) {
  const t0 = B.chant[i];
  const k = seg(t, t0 - 0.02, t0 + 0.14);
  return k > 0 ? K.bang('FOAM!', x, y, k, 170 + 20 * i, i % 2 ? 6 : -6, ['#FFFFFF', '#3FE0FF', '#FF6FD8', '#FFE14D'][i]) : '';
}
// N2 — Ivy slides down the mound past the principal (the foam moustache lands on her lip)
function shotN2(t) {
  const u = seg(t, C.foam2, C.foam3);
  const cam = camLerp(camAt(1420, 470, 1.45, 6), camAt(1300, 520, 1.55, -3), u);
  const D = discoWorld(t);
  const sl = seg(t, C.foam2, C.foam3 + 0.1);
  const ix = lerp(1720, 1060, sl), iy = lerp(560, 770, sl);
  const ivy = actor('ivy', t, { x: ix, y: iy + 395 * S45 - 30, s: S45, t, view: 'side', rot: 75, armL: 170, armR: 170, foam: 0.9, face: { name: 'joy' }, shadow: false }, { arms: false });
  const chars = D.chars + actor('you', t, { x: 900, y: ST.floor + 40, s: S45, t, ...AC.floss(t * 1.2), foam: 1, face: 'joy' }, { arms: false }) + ivy + R.foamSplash(ix + 80, iy - 40, ((t - C.foam2) % 0.5), { s: 0.8, n: 8, seed: 3 });
  let o = stageFrame(t, cam, { spots: SPOTS3, confetti: 1 }, { back: D.back, chars, top: partyTop(t) });
  return o + chantWord(t, 1) + E.specks(t, 0.8);
}
// N3 — kids rush the stage edge, fists pumping
function shotN3(t) {
  const cam = shook(camAt(430, 760, 1.45, -3), t, [[B.chant[2], 0.2, 8]]);
  let kids = '';
  [[200, 3], [430, 8], [660, 12], [330, 6], [560, 1]].forEach(([x, i], j) => {
    const pump = Math.abs(Math.sin(t * 9 + j));
    kids += actor('kid', t, { i, x, y: 1150 - (j > 2 ? 40 : 0), s: 0.52, t, armR: 150 + 20 * pump, armL: j % 2 ? 150 - 20 * pump : 40, lift: 16 * pump, face: { name: 'excited', mouth: 'scream' }, volume: false }, { arms: false });
  });
  const o = houseFrame(t, cam, { lights: 0.2, cheer: 1, phones: 1, wave: true }, kids);
  return o + chantWord(t, 2, 1060, 300) + E.specks(t, 0.6) + whip(t, C.foam3, 1, 0.07);
}
// N4 — the foam snowman gets its head (WHOMP), the hero poses next to it
function shotN4(t) {
  const u = seg(t, C.foam4, C.mom2);
  const cam = camLerp(camAt(560, 520, 1.6, -4), camAt(600, 520, 1.45, 2), u);
  const D = discoWorld(t);
  const slap = bump(t, B.chant[3] - 0.2, B.chant[3] + 0.15);
  const chars = D.chars + actor('you', t, { x: 690, y: ST.floor, s: S45, t, turn: -0.5, armL: 120 + 50 * slap, armR: 140, foam: 1, face: { name: 'joy' } }, { arms: false }) +
    actor('ivy', t, { x: 300, y: ST.floor, s: S45, t, turn: 0.4, armL: 150, armR: 150 + 20 * Math.sin(t * 10), foam: 0.9, face: 'joy' }, { arms: false });
  let o = stageFrame(t, cam, { spots: SPOTS3, confetti: 1 }, { back: D.back, chars, top: partyTop(t) });
  const [sx, sy] = E.toScr(cam, 470, 500);
  o += K.bang('WHOMP!', sx + 120, sy - 40, seg(t, B.chant[3] + 0.05, B.chant[3] + 0.2) * (1 - seg(t, C.mom2 - 0.15, C.mom2)), 70, 10, '#FFFFFF');
  return o + chantWord(t, 3, 1240, 260) + E.specks(t, 0.8);
}
// O1 — "I'm sending this to the WHOLE family!" — Mom filming, Dad crying with laughter, Bea on her chair
function shotO1(t) {
  const u = seg(t, C.mom2, C.phone);
  const cam = camLerp(camAt(930, 780, 1.6, -2), camAt(940, 760, 1.85, 1), u);
  const fam = family(t, { dadFace: { name: 'joy', fx: ['tears'] }, dadArms: [40 + 30 * Math.abs(Math.sin(t * 12)), 120], mom: { phone: true, face: undefined }, bea: 'seat', beaPose: { sign: 'up', face: 'excited', lift: 20 * Math.abs(Math.sin(t * 8)) } });
  return houseFrame(t, cam, { lights: 0.2, cheer: 1, phones: 1 }, fam) + E.specks(t, 0.5) + whip(t, C.mom2, -1, 0.08);
}
// O2 — the phone screen: the disco in portrait mode; SENDING TO: WHOLE FAMILY (47) -> SENT!
function shotO2(t) {
  const u = seg(t, C.phone, C.bea2);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#1A0C2A' });
  for (let i = 0; i < 16; i++) o += S.circle(hash(i * 3.3) * 1920, hash(i * 7.1) * 1080, 30 + 90 * hash(i), { fill: ['#FF4FD8', '#3FE0FF', '#FFE14D', '#9B6BFF'][i % 4], opacity: f(0.14 + 0.08 * Math.sin(t * 3 + i)) });
  const s = 1.55, rot = -4 + 2 * Math.sin(t * 2);
  const id = S.uid('s10ph');
  // the screen: a mini render of the stage (portrait crop)
  const cam = camAt(1080, 540, 0.62);
  const D = discoWorld(t);
  const scr = stageFrame(t, cam, { spots: SPOTS3, confetti: 1 }, { back: D.back, chars: D.chars + dancers(t), top: partyTop(t) });
  let ph = S.rect(-180, -340, 360, 680, 50, ol('#20232E', 10));
  ph += S.clipDef(id, S.rect(-160, -300, 320, 600, 26));
  ph += S.g(S.rect(-160, -300, 320, 600, 0, { fill: '#000' }) + S.g(scr, 'translate(-160 -300) scale(0.3125)'), null, { 'clip-path': `url(#${id})` });
  ph += S.rect(-44, -326, 88, 14, 7, { fill: '#0B0C10' });
  const prog = seg(t, C.phone + 0.1, B.sent);
  ph += E.sendUI(prog, seg(t, B.sent, B.sent + 0.3), t);
  // Mom's thumb
  ph += S.path('M150 260 Q210 230 240 300 L250 420 L120 420 Q110 330 150 260 Z', ol('#F2C29E', 7)) + S.path('M168 268 Q196 256 212 286', ln(5, '#FFFFFF', 0.5));
  o += S.g(ph, `translate(960 ${f(560 - 10 * u)}) rotate(${f(rot)}) scale(${f(s)})`);
  return o + whip(t, C.phone, 1, 0.07);
}
// P1 — "THAT'S MY BROTHER!" — Bea on her chair, sign up, screaming with joy
function shotP1(t) {
  const u = seg(t, C.bea2, C.mushroom);
  const punch = ease.out(seg(t, B.brother, B.brother + 0.15));
  const cam = shook(camLerp(camAt(1110, 760, 1.85), camAt(1120, 740, 2.1), u), t, [[B.brother, 0.3, 10]]);
  cam.zoom += 0.15 * punch;
  const fam = family(t, { dadFace: 'joy', dadArms: [140, 150], mom: { phone: true, face: 'joy' }, bea: 'seat', beaPose: { sign: 'up', face: { name: 'excited', mouth: 'scream' }, lift: 26 * Math.abs(Math.sin(t * 9)) } });
  let o = houseFrame(t, cam, { lights: 0.2, cheer: 1, phones: 1 }, fam);
  return o + E.specks(t, 0.5) + whip(t, C.bea2, 1, 0.07);
}
// P2 — "He's a mushroom!" — the hero in a giant mushroom-cap of foam, crayon doodle frame like Bea's sign
function shotP2(t) {
  const u = seg(t, C.mushroom, C.best);
  const cam = camLerp(camAt(980, 470, 2.0), camAt(980, 460, 2.2), u);
  const D = discoWorld(t);
  const pose = ease.outBack(seg(t, C.mushroom, C.mushroom + 0.3));
  const hx = 980, hy = ST.floor + 40;
  const cap = S.g(R.foamBlobs(0, 0, 1, 1, 11, { t }), `translate(${hx} ${f(hy - 860 * S45 - 10)}) scale(2.3 1.25)`);
  const chars = D.chars + actor('you', t, { x: hx, y: hy, s: S45, t, armL: lerp(20, 135, pose), armR: lerp(20, 135, pose), foam: 0.4, face: { name: 'joy', mouth: 'bigGrin' }, volume: false }, { arms: false }) + cap + R.foamPile(hx, 820, 460, 130, { t, seed: 12 });
  let o = stageFrame(t, cam, { spots: SPOTS3, confetti: 1 }, { back: D.back, chars, top: partyTop(t) });
  const [cx, cy] = E.toScr(cam, hx, hy - 260);
  const k = seg(t, B.mush - 0.1, B.mush + 0.35);
  o += E.crayonFrame(cx, cy, 380, 470, k, t) + E.crayonText('MUSHROOM!', cx, 140, 92, t, seg(t, B.mush, B.mush + 0.3), 2);
  return o + whip(t, C.mushroom, -1, 0.07);
}
// Q — "...Best. Disaster. Ever." — the principal, foam moustache, deadpan; a punch-in per word
function shotQ(t) {
  const z = 2.3 + 0.45 * ease.out(seg(t, B.disaster - 0.03, B.disaster + 0.07)) + 0.55 * ease.out(seg(t, B.ever - 0.03, B.ever + 0.07));
  const cam = camAt(ST.prin + 4, 400, z, t >= B.disaster && t < B.ever ? -3 : 0);
  const D = discoWorld(t, { snow: 1 });
  const chars = D.chars + dancers(t, { heroX: 1180, ivyX: 1330 });
  let o = stageFrame(t, cam, { spots: SPOTS3, confetti: 0.6 }, { back: D.back, chars: chars, top: E.beams(t, 0.5) + principalCU(t) });
  return o + whip(t, C.best, 1, 0.07);
}
// the principal drawn again on top (in front of the dancers) for her close-up
function principalCU(t) {
  let o = actor('principal', t, { x: ST.prin, y: 765, s: S45, t, foam: 0.28, turn: -0.1, volume: false, face: { name: 'deadpan', eyes: { upper: 0.5 } } }, { arms: false, energy: 0.15 });
  o += R.foamBlobs(ST.prin + 4, 262, 1.05, 1, 3, { t });
  o += R.foamMustache(ST.prin + 2, 404, 0.42, t);
  o += R.foamPile(ST.mound.x, 776, ST.mound.w, ST.mound.h, { t, seed: 2 });
  o += E.dropAt(ST.prin + 30, 412, t, B.ever + 0.3, 200);
  return o;
}

// ================================================================ trophies
function awardBase(t) {
  const FS = E.foamScape(t, 1, { moundH: 0.7 });
  return { back: E.cable(0) + E.micStand(ST.mic, 776, 0.95, -86) + FS.back + E.magicTable(ST.table) + E.tableHat(t, 0, 0.5), front: FS.front };
}
const BIG_TROPHY = (x, y, s) => X.trophy({ x, y, s, text: '1ST PLACE' });
// R1 — "You didn't win." — the big trophy comes... and passes him by
function shotR1(t) {
  const u = seg(t, C.noWin, C.pins);
  const cam = camLerp(camAt(840, 500, 1.55), camAt(980, 500, 1.55), seg(t, C.noWin + 0.3, C.pins));
  const A = awardBase(t);
  const hope = seg(t, C.noWin, B.notWin - 0.1), pass = seg(t, B.notWin - 0.1, C.pins - 0.2);
  let chars = A.front;
  chars += actor('ivy', t, { x: 640, y: ST.floor, s: S45, t, foam: 0.9, armL: 20, armR: 20, face: { name: 'happy', eyes: { look: [0.6, 0] } } }, { arms: false });
  chars += actor('you', t, { x: 800, y: ST.floor, s: S45, t, foam: 1, lean: 8 * hope * (1 - pass), armR: lerp(20, 70, hope) * (1 - pass) + 20 * pass, armL: 20, face: pass > 0.3 ? { name: 'sad', eyes: { look: [0.8, 0] } } : { name: 'excited', eyes: { look: [0.8, 0] } } }, { arms: false });
  const px = lerp(1240, 1120, hope) + lerp(0, 60, pass);
  const [hx, hy] = AC.hand(80, -1);
  chars += actor('juggler', t, { x: 1200, y: ST.floor, s: 0.45, t, juggle: t * 1.7, face: 'happy' }, { arms: false });
  chars += actor('principal', t, { x: px, y: ST.floor - 6, s: S45, t, view: 'front', turn: lerp(-0.6, 0.6, pass), foam: 0.7, armL: 80, armR: 30, props: [{ svg: BIG_TROPHY(hx, hy + 100, 1.6), layer: 'front' }], face: { name: 'deadpan' } }, { arms: false });
  return stageFrame(t, cam, { spots: SPOTS3, lights: 0.4 }, { back: A.back, chars }) + whip(t, C.noWin, -1, 0.08);
}
// R2 — "The girl with seven bowling pins won." — trophy on her head, still juggling 7 pins; confetti
function shotR2(t) {
  const u = seg(t, C.pins, C.fair);
  const cam = camLerp(camAt(1120, 440, 1.9), camAt(1040, 480, 1.45), seg(t, B.won + 0.3, C.fair), ease.inOut);
  const A = awardBase(t);
  let chars = A.front;
  chars += kid(TWIN, { x: 1400, y: ST.floor, s: 0.45, armL: 110 + 30 * Math.sin(t * 14), armR: 110 + 30 * Math.sin(t * 14 + 1), face: 'joy' }) + kid(TWIN, { x: 1530, y: ST.floor, s: 0.45, armL: 110 + 30 * Math.sin(t * 14 + 1), armR: 110 + 30 * Math.sin(t * 14), face: 'joy' });
  chars += actor('ivy', t, { x: 640, y: ST.floor, s: S45, t, foam: 0.9, armL: 60 + 30 * Math.abs(Math.sin(t * 12)), armR: 60 + 30 * Math.abs(Math.sin(t * 12)), face: 'happy' }, { arms: false });
  chars += actor('you', t, { x: 800, y: ST.floor, s: S45, t, foam: 1, armL: 60 + 30 * Math.abs(Math.sin(t * 12 + 1)), armR: 60 + 30 * Math.abs(Math.sin(t * 12 + 1)), face: { name: 'happy', eyes: { look: [0.8, 0] } } }, { arms: false });
  const won = ease.outBack(seg(t, B.won - 0.1, B.won + 0.2));
  chars += actor('juggler', t, { x: 1140, y: ST.floor, s: 0.5, t, juggle: t * 1.7, face: { name: 'excited', eyes: { type: won > 0.5 ? 'happy' : undefined } },
    props: [{ svg: BIG_TROPHY(0, -905, 0.9 + 0.1 * won), layer: 'top' }] }, { arms: false });
  chars += actor('principal', t, { x: 1300, y: ST.floor - 6, s: S45, t, foam: 0.7, armL: 30 + 30 * Math.abs(Math.sin(t * 10)), armR: 30 + 30 * Math.abs(Math.sin(t * 10 + 1)), face: { name: 'deadpan' } }, { arms: false });
  let o = stageFrame(t, cam, { spots: [{ x: 1140, y: 770, w: 520 }, SP.stage.spots.left], lights: 0.4, confetti: seg(t, B.won - 0.1, B.won + 0.3) }, { back: A.back, chars });
  const k = seg(t, B.won, B.won + 0.6);
  if (k > 0 && k < 1) { const [jx, jy] = E.toScr(cam, 1140, 260); o += K.C.burst(jx, jy, k, '#FFE14D') + K.sparkles([[jx - 160, jy + 40, 40 * (1 - k)], [jx + 170, jy + 20, 36 * (1 - k)]], t); }
  return o + whip(t, C.pins, 1, 0.07);
}
// R3 — "Honestly? Fair." — a look, a shrug, a nod, applause
function shotR3(t) {
  const u = seg(t, C.fair, C.unforget);
  const cam = camLerp(camAt(720, 500, 2.1), camAt(720, 495, 2.25), u);
  const A = awardBase(t);
  const shrug = bump(t, C.fair + 0.05, B.fair);
  const clap = t > B.fair ? Math.abs(Math.sin(t * 13)) : 0;
  let chars = A.front;
  chars += actor('ivy', t, { x: 640, y: ST.floor, s: S45, t, foam: 0.9, turn: 0.5, armL: 30 + 30 * shrug + 40 * clap, armR: 30 + 30 * shrug + 40 * clap, volume: false, face: t > B.fair ? { name: 'happy', eyes: { type: 'happy' } } : { name: 'deadpan', eyes: { look: [0.8, 0] } } }, { arms: false });
  chars += actor('you', t, { x: 800, y: ST.floor, s: S45, t, foam: 1, turn: -0.5, armL: 30 + 40 * shrug + 40 * clap, armR: 30 + 40 * shrug + 40 * clap, headRot: t > B.fair ? 6 * Math.sin(t * 10) : 0, volume: false, face: t > B.fair ? { name: 'happy', eyes: { type: 'happy' } } : { name: 'deadpan', eyes: { look: [-0.8, 0] } } }, { arms: false });
  return stageFrame(t, cam, { spots: SPOTS3, lights: 0.4 }, { back: A.back, chars }) + whip(t, C.fair, -1, 0.07);
}
// S1 — "We got Most Unforgettable!" — the small trophy goes up over his head, shine
function shotS1(t) {
  const u = seg(t, C.unforget, C.final);
  const cam = camLerp(camAt(820, 470, 1.7), camAt(800, 430, 2.0), u);
  const A = awardBase(t);
  const up = ease.outBack(seg(t, C.unforget, B.most));
  const [hx, hy] = AC.hand(lerp(30, 160, up), 1), [hx2] = AC.hand(lerp(30, 160, up), -1);
  const tro = X.trophy({ x: (hx + hx2) / 2, y: hy - 10, s: 0.8, text: 'MOST UNFORGETTABLE ACT' });
  let chars = A.front;
  chars += actor('ivy', t, { x: 620, y: ST.floor, s: S45, t, foam: 0.9, turn: 0.3, armL: 150 + 20 * Math.sin(t * 11), armR: 150 + 20 * Math.sin(t * 11 + 1), face: 'joy', volume: false }, { arms: false });
  chars += actor('you', t, { x: 820, y: ST.floor, s: S45, t, foam: 1, armL: lerp(30, 160, up), armR: lerp(30, 160, up), volume: false, props: [{ svg: tro, layer: 'front' }] }, { arms: false, energy: 1.3 });
  let o = stageFrame(t, cam, { spots: [{ x: 760, y: 770, w: 560 }, SP.stage.spots.right], lights: 0.35, confetti: 0.7 }, { back: A.back, chars });
  const [sx, sy] = E.toScr(cam, 820, ST.floor + (hy - 200) * S45);
  const k = seg(t, B.most, B.most + 0.6);
  if (k > 0 && k < 1) o += K.C.burst(sx, sy, k, '#FFE14D') + K.sparkles([[sx + 120, sy - 40, 44 * (1 - k)], [sx - 110, sy + 10, 32 * (1 - k)]], t);
  return o + flashAt(t, B.most, 0.1, 0.35, '#FFF6C0');
}
// S2 — "See? Told you! The mess-up IS the fun part!" — final laughing two-shot covered in foam -> foam wipe out
function shotS2(t) {
  const u = seg(t, C.final, END);
  const cam = camLerp(camAt(760, 500, 1.65, -2), camAt(760, 470, 2.15, 1), u, ease.inOut);
  const A = awardBase(t);
  const fall = ease.inOut(seg(t, B.fun + 0.1, B.fun + 0.6));
  const laugh = Math.sin(t * 16);
  const tro = X.trophy({ x: AC.hand(120, 1)[0] - 20, y: AC.hand(120, 1)[1] - 10, s: 0.7, text: 'MOST UNFORGETTABLE ACT' });
  let chars = A.front;
  chars += actor('you', t, { x: 840, y: ST.floor, s: S45, t, foam: 1, turn: -0.35, lean: -12 * fall, armR: 120, armL: 40 + 20 * laugh, headRot: 4 * laugh - 6 * fall, bodyY: 4 * Math.abs(laugh), volume: false, face: { name: 'joy', fx: t > B.fun ? ['tears'] : [] }, props: [{ svg: tro, layer: 'front' }] }, { arms: false, energy: 1.2 });
  const pointK = bump(t, B.see - 0.1, B.told + 0.3);
  chars += actor('ivy', t, { x: 660, y: ST.floor, s: S45, t, foam: 0.9, turn: 0.4, lean: 10 * fall, armR: 100 + 30 * pointK, armL: 30 + 120 * seg(t, B.told + 0.2, B.told + 0.5) * (1 - fall * 0.4), headRot: -4 * laugh, bodyY: 4 * Math.abs(laugh), volume: false, face: { name: 'joy' } }, { arms: false, energy: 1.2 });
  chars += R.foamPile(760, 812, 640, 120, { t, seed: 13 });
  let o = stageFrame(t, cam, { spots: [{ x: 760, y: 770, w: 600 }, SP.stage.spots.right], lights: 0.3, confetti: 1 }, { back: A.back, chars, top: E.bubbles(t, 1) + E.beams(t, 0.45) });
  o += E.specks(t, 0.6);
  const k = seg(t, B.fun, B.fun + 0.6);
  if (k > 0 && k < 1) o += R.blockConfetti({ x: 960, y: 640, age: t - B.fun, n: 40, s: 1.2, seed: 5 });
  o += foamWipe(seg(t, END - 0.3, END));
  return o;
}
// foam bubbles covering the frame from the bottom (k 0..1) -> white
function foamWipe(k) {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < 22; i++) {
    const x = (i % 6) * 380 - 40 + hash(i) * 80, y0 = 1300 + hash(i * 3.1) * 300, y = lerp(y0, -200 + hash(i * 2.2) * 900, ease.in(k)), r = 260 + 120 * hash(i * 5.5);
    d += `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
  }
  return S.path(d, { fill: '#FFFFFF', stroke: '#CFE0F2', 'stroke-width': 10 }) + S.rect(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: f(ease.in(seg(k, 0.6, 1))) });
}

// ---------------------------------------------------------------- router
const SHOTS = [
  [C.house, shotA1], [C.juggler, shotA2], [C.twins, shotA3], [C.dad, shotA4],
  [C.mom, shotB1], [C.bea, shotB2], [C.sign, shotB3], [C.principal, shotB4],
  [C.you, shotC1], [C.magic, shotC2], [C.noCp, shotC3],
  [C.noReset, shotD1], [C.noMenu, shotD2], [C.justYou, shotD3], [C.people, shotD4], [C.hands, shotD5],
  [C.oneTry, shotE1], [C.ladies, shotE2],
  [C.hat, shotF1], [C.walk, shotF2], [C.foot, shotF3], [C.slowmo, shotF4], [C.erupt, shotG], [C.gasp, shotH],
  [C.silence, shotI1], [C.reset1, shotI2], [C.reset2, shotJ1], [C.reset3, shotJ2], [C.whisper, shotJ3],
  [C.letsMake, shotK1], [C.slide, shotK2], [C.hesitate, shotL1], [C.jump, shotL2], [C.disco, shotL3],
  [C.foam1, shotM], [C.foam2, shotN1], [C.foam3, shotN2], [C.foam4, shotN3], [C.mom2, shotN4],
  [C.phone, shotO1], [C.bea2, shotO2], [C.mushroom, shotP1], [C.best, shotP2], [C.noWin, shotQ],
  [C.pins, shotR1], [C.fair, shotR2], [C.unforget, shotR3], [C.final, shotS1], [Infinity, shotS2],
];
function scene(t) {
  for (const [end, fn] of SHOTS) if (t < end) return fn(t);
  return shotS2(t);
}
function look(t) {
  if (t >= C.noCp && t < C.ladies) return { grade: 'cool', vignette: 0.95 };          // backstage nerves
  if (t >= C.slowmo && t < C.erupt) return { grade: 'cool', vignette: 0.9 };          // slow motion
  if (t >= C.silence && t < C.whisper) return { grade: 'cool', vignette: 0.95 };      // the silence + RESET
  if (t >= C.hesitate && t < C.jump) return { grade: null, vignette: 1 };
  if (t >= C.disco && t < C.noWin) return { grade: null, vignette: 0.6 };             // the disco: keep it saturated
  return { grade: 'warm', vignette: 0.8 };
}
function captionY(t) {
  if (t >= C.phone && t < C.bea2) return 1040;
  return 1010;
}

module.exports = { scene, look, captionY, TIMES: TM };
