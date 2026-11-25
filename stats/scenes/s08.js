// SC 08 · THE FAIR — Saturday, the town fair at dusk, Mom's first day off in a year (NEW AREA: TOWN FAIR, her ENERGY rolls up,
// a DAY OFF tag); "Everybody stay together" (the PARTY 4/4 panel); Max: "I wanna go UP!" — his finger points past the Ferris
// wheel at the giant inflatable dinosaur (it looks back at him); "Remember that." -> a JOURNAL snapshot (MAX WANTS TO GO UP)
// flies into the HUD; thousands of people -> a wave of plates over every head, the camera flies over the sea of numbers; the
// hero, distracted by the plates, turns: "Wait. Where's Max?" — only his dino balloon drifts up (PARTY 3/4: SIGNAL LOST); Mom's
// face goes from joy to panic ("MAX!", her ENERGY drains); NEW QUEST: Find Max — the quest arrow spins; WARNING: TOO MANY
// PLAYERS -> HUD OVERLOAD: numbers over the sky, the rides, everyone; whip-pans over faces that are only plates; "Level twelve!
// Level forty! Level eight!" (strangers turn around: plates for faces); he spins; even Mom's face is a plate; SEARCH: GREEN
// DINOSAUR -> 2,413 MATCHES; "Everybody's just... a number!"; the flood fills the screen, he covers his ears; then silence:
// the hero alone and small in a frozen sea of numbers.
// Every cut and beat comes from the voice through s08_env.times() (shared with audio/cues/gen_sc08.js).
'use strict';

const K = require('./kit');
const H = require('./hud');
const FS = require('./sets_fair');
const AC = require('./acting');
const CAST = require('../rig/cast');
const E = require('./s08_env');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln } = K;
const V = K.V;
const TM = E.times(V);
const { START, END, C, B } = TM;
const { camAt, camLerp, shook, toScr, view, roll, whip, flashAt, focusLines, dark, row, rowsPeople, fairWith, headTags, facePlates, headsOf, setPeople } = E;
const SPF = FS.SPOTS.fair, sAt = SPF.sAt;

// close-ups render rig characters without the body-volume filter (perf); the router sets VOL_OFF per shot
let VOL_OFF = false;
const actor = (name, t, pose = {}, act) => K.actor(name, t, VOL_OFF && pose.volume === undefined ? { ...pose, volume: false } : pose, act);

// ================================================================ the family at the fair (world, k 1): by the cotton candy stand
const FAM = { max: { x: 2010, y: 1000 }, mom: { x: 2150, y: 990 }, gpa: { x: 2330, y: 972 }, you: { x: 2480, y: 1002 } };
for (const k of Object.keys(FAM)) FAM[k].s = +sAt(FAM[k].y).toFixed(3);
const head = (who, p, pose = {}) => H.overHead(who, p.x, p.y, p.s, 0, pose);
const clock = (t) => E.clockAt(t, START, END);
// the HUD chrome of this scene (screen space): frame + party + journal slot; o: { glitch, quest, party, lost, dots, k, journal }
function hud(t, o = {}) {
  let dots;
  if (o.crowdDots) { dots = []; for (let i = 0; i < o.crowdDots; i++) dots.push([(hash(i * 3.1) - 0.5) * 1.8, (hash(i * 5.7) - 0.5) * 1.8, i % 5 === 0 ? '#FF4D66' : '#FFFFFF']); }
  let g = H.hudFrame({ t, k: o.k ?? 1, glitch: o.glitch || 0, clock: clock(t), day: 'SAT', dots, quest: o.quest ? 'FIND MAX' : undefined, questSub: o.quest ? 'LOCATION: UNKNOWN' : undefined });
  if (o.party !== false && t >= B.party - 0.05 && t < C.flood) g += E.partyPanel({ t, k: seg(t, B.party - 0.05, B.party + 0.45), lost: t >= B.lost ? seg(t, B.lost, B.lost + 0.5) : 0, glitch: o.glitch ? o.glitch * 0.6 : 0 });
  if (t >= C.hero + 0.95) g += E.journalSlot({ t, x: 400, y: 96, k: seg(t, C.hero + 0.95, C.hero + 1.1), pulse: seg(t, C.hero + 0.95, C.hero + 1.6) });
  return g;
}

// ================================================================ SHOTS
// 1 — "Saturday. The town fair." the TOWN FAIR arch (golden dusk): from the sign down to the family walking in; NEW AREA banner
function shotSign(t) {
  const Z = FS.SPOTS.fairEntrance;
  const u = seg(t, B.tilt - 0.2, B.famPlates + 0.3);
  const cam = camLerp(camAt(960, 270, 1.32), camAt(960, 630, 1.05), u);
  const L = FS.fairEntrance.layers(t, cam, { time: { golden: 0.65, dusk: 0.35 }, crowd: 0.9 });
  const walkU = seg(t, C.sign, C.mom + 0.4);
  const fam = [['grandpa', 770, 0.0], ['mom', 905, 0.9], ['max', 1020, 1.7], ['you', 1150, 2.6]];
  let w = '';
  const plates = [];
  for (const [who, x, ph] of fam) {
    const y = lerp(902, 968, walkU) + (who === 'max' ? 6 : who === 'grandpa' ? -8 : 0), s = Z.sAt(y);
    const wk = AC.walkFront(t * 7.5 + ph, 1);
    const pose = { x, y, s, t, ...wk, face: who === 'mom' ? 'joy' : who === 'max' ? 'excited' : 'happy' };
    if (who === 'mom') Object.assign(pose, { dayoff: true, turn: 0.15 });
    if (who === 'max') Object.assign(pose, { balloon: true });
    if (who === 'you') Object.assign(pose, { turn: -0.2, face: { name: 'amazed', eyes: { look: [-0.3, -0.8] } } });
    w = actor(who, t, pose, { arms: false }) + w;
    plates.push([who, H.overHead(who, x, y - (wk.bodyY || 0), s, 0, who === 'mom' ? { dayoff: true } : {})]);
  }
  let o = L.bg + L.mid + L.front + view(cam, w) + L.crowd + L.fg + L.light;
  // mini plates over the family
  const pk = (i) => seg(t, B.famPlates + i * 0.12, B.famPlates + i * 0.12 + 0.4);
  const info = { grandpa: ['GRANDPA', 87, 0.9], mom: ['MOM', 38, 0.05], max: ['MAX', 5, 1], you: ['???', '??', 0.5] };
  plates.forEach(([who, p], i) => { const [x, y] = toScr(cam, p.x, p.y); const [nm, lv, hp] = info[who]; o += H.miniPlate({ x, y, s: 0.78, k: pk(i), t, name: nm, level: lv, hp, theme: who === 'you' ? 'error' : undefined }); });
  o += hud(t);
  // SAT pops in the clock pill on "Saturday"
  const sp = bump(t, B.sat, B.sat + 0.5);
  if (sp > 0) o += S.circle(1612, 51, 34 + 26 * sp, { fill: 'none', stroke: '#FFD21F', 'stroke-width': f(5 * sp), opacity: f(sp) });
  o += E.areaBanner({ t, k: seg(t, B.area, B.area + 0.8), out: seg(t, C.mom - 0.4, C.mom), y: 330 });
  return o + whip(t, C.sign, 'down', 0.16);
}
// 2 — "Mom's first day off in a year." Mom under the arch stretches in the sun: DAY OFF tag, ENERGY 2 -> 22
function shotMom(t) {
  const Z = FS.SPOTS.fairEntrance;
  const u = seg(t, C.mom, C.wide);
  const mp = { x: 905, y: 968 }; mp.s = Z.sAt(mp.y);
  const cam = camLerp(camAt(955, 700, 1.75), camAt(935, 690, 1.95), u, ease.out);
  const L = FS.fairEntrance.layers(t, cam, { time: { golden: 0.65, dusk: 0.35 }, crowd: 0.9 });
  const st = ease.inOut(seg(t, B.dayoff - 0.25, B.dayoff + 0.35)) * (1 - ease.inOut(seg(t, B.year + 0.25, B.year + 0.8)));
  const sigh = bump(t, B.year + 0.2, B.year + 0.9);
  let w = actor('grandpa', t, { x: 770, y: 960, s: Z.sAt(960), t, turn: 0.4, face: { name: 'happy', eyes: { look: [0.7, -0.2] } } });
  w += actor('mom', t, { ...mp, t, dayoff: true, armL: lerp(14, 158, st), armR: lerp(14, 158, st), bendL: 30 * st, bendR: 30 * st, lean: -2 * sigh, headRot: -6 * st, bodyY: -10 * st,
    face: st > 0.3 ? { name: 'joy', eyes: { type: 'happy' } } : { name: 'happy', eyes: { look: [0.2, -0.3] } } });
  w += actor('max', t, { x: 1040, y: 975, s: Z.sAt(975), t, balloon: true, turn: -0.4, face: { name: 'happy', eyes: { look: [-0.6, -0.5] } } });
  let o = L.bg + L.mid + L.front + view(cam, w) + L.crowd + L.fg + L.light;
  const hp = head('mom', mp, { dayoff: true });
  const [hx, hy] = toScr(cam, hp.x, hp.y - 10 * st);
  o += H.plateFor('mom', { x: hx, y: hy, s: 0.95, t, k: seg(t, B.momPlate, B.momPlate + 0.5), title: 'FIRST DAY OFF IN 365 DAYS',
    bars: [{ label: 'ENERGY', value: t >= B.year ? 22 : 2, from: 2, roll: t >= B.year ? seg(t, B.year, B.year + 1.0) : undefined, blink: t < B.year + 0.6 ? undefined : false }],
    tags: [{ text: 'DAY OFF!', col: '#FFC83A', k: seg(t, B.dayoff - 0.05, B.dayoff + 0.3) }] });
  if (t > B.year + 0.3 && t < B.year + 1.6) o += H.xpPop({ x: hx + 150, y: hy - 40, age: t - B.year - 0.3, text: '+20% ENERGY', col: '#FFD21F', to: [hx + 150, hy - 200] });
  return o + hud(t) + whip(t, C.mom, 1, 0.1);
}
// 3 — the fair, wide: a crane over the dusk fair, the family walks in, a few plates over the crowd
function shotWide(t) {
  const u = seg(t, C.wide, C.together);
  const cam = camLerp(camAt(1450, 400, 0.57), camAt(1800, 450, 0.62), u);
  const fam = [['grandpa', 1220, 1010], ['mom', 1340, 1012], ['max', 1430, 1020], ['you', 1540, 1015]];
  let w = '';
  for (const [who, x0, y] of fam) {
    const x = x0 + 260 * u, s = sAt(y);
    w += actor(who, t, { x, y, s, t, view: 'side', flip: true, ...AC.walk(t * 8 + x0, 1), dayoff: who === 'mom', balloon: who === 'max', face: 'happy' }, { arms: false });
  }
  let o = fairWith(t, cam, { crowd: 0.85 }, w);
  const heads = setPeople(cam, { crowd: 0.85 }, 'back').filter((h, i) => i % 3 === 0 && h.s > 0.07);
  o += headTags(heads, { t, k: (h) => seg(t, C.wide + 0.2 + (h.x / 1920) * 0.8, C.wide + 0.5 + (h.x / 1920) * 0.8) });
  return o + hud(t) + whip(t, C.wide, 1, 0.1);
}
// 4 — "Everybody stay together, okay?" Mom counts heads at the cotton candy stand; PARTY 4/4 pops; the hero stares at plates
function famPose(t, who, extra = {}) {
  const p = FAM[who];
  return { x: p.x, y: p.y, s: p.s, t, ...(who === 'mom' ? { dayoff: true } : {}), ...(who === 'max' ? { balloon: true } : {}), ...extra };
}
function cottonVendor(t) { const v = SPF.cotton.vendor; return K.draw.adult(5, { x: v.x, y: v.y, s: v.s, t, turn: 0.2, armR: 40 + 20 * Math.sin(t * 3), face: 'happy' }); }
function shotTogether(t) {
  const u = seg(t, C.together, C.up);
  const cam = camLerp(camAt(2230, 720, 1.28), camAt(2210, 715, 1.38), u);
  const fing = ease.outBack(seg(t, B.party - 0.3, B.party));
  let w = actor('grandpa', t, { ...famPose(t, 'gpa'), turn: -0.3, face: { name: 'happy', eyes: { look: [-0.6, 0] } } });
  w += actor('mom', t, { ...famPose(t, 'mom'), turn: 0.35, armR: lerp(14, 150, fing), armL: 16, face: 'happy' }, { arms: false });
  w += actor('max', t, { ...famPose(t, 'max'), turn: 0.3, lift: 14 * Math.abs(Math.sin(t * 7)), face: { name: 'excited', eyes: { look: [0.5, -0.8] } } });
  w += actor('you', t, { ...famPose(t, 'you'), turn: -0.45, headRot: 6 * Math.sin(t * 2), face: { name: 'amazed', eyes: { look: [0.6 * Math.sin(t * 2.6), -0.85] } } });
  let o = fairWith(t, cam, { crowd: 0.9, behindFront: cottonVendor(t) }, w);
  // a few plates pop around the hero (what he's looking at)
  const heads = setPeople(cam, { crowd: 0.9 }, 'back').filter((h) => h.x > 1150 && h.s > 0.2).slice(0, 7);
  o += headTags(heads, { t, k: (h) => seg(t, C.together + 0.2 + (h.i % 7) * 0.18, C.together + 0.5 + (h.i % 7) * 0.18) });
  return o + hud(t) + whip(t, C.together, -1, 0.1);
}
// 5 — "I wanna go UP!" Max hops, arms up (CHAOS 9999 over his head)
function shotUp(t) {
  const u = seg(t, C.up, C.sky);
  const cam = camLerp(camAt(2040, 820, 2.2), camAt(2030, 800, 2.45), u, ease.out);
  const hop = Math.abs(Math.sin((t - C.up) * 8.5)) * (1 - 0.6 * seg(t, B.up + 0.5, C.sky));
  const big = bump(t, B.up - 0.05, B.up + 0.4);
  let w = actor('mom', t, { ...famPose(t, 'mom'), turn: -0.3, face: { name: 'joy', eyes: { look: [-0.6, 0.3] } } });
  w += actor('max', t, { ...famPose(t, 'max'), freeArms: true, armL: 150 + 20 * Math.sin(t * 9), armR: 140 - 20 * Math.sin(t * 9), lift: 26 * hop + 30 * big, sy: 1 + 0.05 * big, sx: 1 - 0.03 * big, face: 'excited' }, { arms: false, energy: 1.5 });
  let o = fairWith(t, cam, { crowd: 0.8 }, w);
  const hp = head('max', FAM.max);
  const [hx, hy] = toScr(cam, hp.x, hp.y - 26 * hop - 30 * big);
  o += H.plateFor('max', { x: hx, y: hy, s: 0.9, t, k: seg(t, C.up, C.up + 0.4) });
  o += focusLines(hx, hy + 200, big * 0.6, 4);
  return o + hud(t) + whip(t, C.up, 1, 0.1);
}
// 6 — "Way up! Where the clouds are!" behind Max: his finger points past the Ferris wheel at the giant dinosaur (it looks back)
function shotSky(t) {
  const u = seg(t, C.sky, C.remember);
  const cam = camLerp(camAt(4520, 330, 0.5), camAt(4620, 170, 0.56), u);
  const look = ease.inOut(seg(t, B.clouds - 0.3, B.clouds + 0.4));
  let o = fairWith(t, cam, { crowd: 0.9, dinoLook: [lerp(0, -0.8, look), lerp(0, 0.7, look)], wobble: 0.6 });
  // Max (foreground, screen space, from behind): pointing up-right at the dinosaur's head
  const [dx, dy] = toScr(cam, SPF.dino.headTop.x, SPF.dino.headTop.y + 120);
  const hop = Math.abs(Math.sin((t - C.sky) * 7)) * 22 * (1 - look * 0.6);
  const ms = 1.0, mx = 480, my = 1190 - hop;
  const shx = mx + 60 * ms, shy = my - 380 * ms;
  const ang = Math.atan2(dx - shx, dy - shy) * 180 / Math.PI;
  o += actor('max', t, { x: mx, y: my, s: ms, t, view: 'back', flip: true, freeArms: true, armL: clamp(ang, 100, 178), armR: 24, volume: false }, { arms: false });
  if (look > 0.5) o += K.sparkles([[dx - 70, dy - 40, 26], [dx + 80, dy - 70, 20]], t);
  return o + hud(t) + whip(t, C.sky, 'up', 0.12);
}
// 7 — "Max wanted to go up. Remember that." Max hops; SNAP — a JOURNAL snapshot: MAX WANTS TO GO UP
function maxSnap(t) {
  // the snapshot's content: Max arms up against the dusk sky with the dinosaur's head (1920x1080 frame, cheap)
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#B98CD8' }) + S.rect(0, 640, 1920, 440, 0, { fill: '#E9A0B8' }) + S.circle(1500, 260, 120, { fill: '#FFE6A8' });
  o += S.g(FS.inflatableDino(B.freeze, { tone: FS.tone({ dusk: 0.5 }), lw: 14, wobble: 0.4, look: [-0.7, 0.6], sign: false, ropes: false }), 'translate(1650 1300) scale(0.62)');
  o += K.actor('max', B.freeze, { x: 760, y: 1060, s: 1.05, t: B.freeze, freeArms: true, balloon: true, armL: 160, armR: 150, face: { name: 'joy', mouth: 'bigGrin' }, volume: false }, { arms: false });
  return o;
}
function shotRemember(t) {
  const u = seg(t, C.remember, C.hero);
  const tf = Math.min(t, B.freeze + 0.02);
  const cam = camLerp(camAt(2080, 760, 1.65), camAt(2060, 760, 1.8), u);
  const hop = Math.abs(Math.sin((tf - C.remember) * 7.5));
  let w = actor('mom', tf, { ...famPose(tf, 'mom'), turn: -0.2, face: { name: 'joy', eyes: { type: 'happy' } } });
  w += actor('max', tf, { ...famPose(tf, 'max'), freeArms: true, armL: 155, armR: 150, lift: 30 * hop, face: { name: 'joy', mouth: 'bigGrin' } }, { arms: false });
  w += actor('you', tf, { ...famPose(tf, 'you'), turn: 0.5, face: { name: 'amazed', eyes: { look: [0.8, -0.9] } } });
  let o = fairWith(tf, cam, { crowd: 0.85 }, w);
  if (t >= B.freeze) {
    const fk = seg(t, B.freeze, B.freeze + 0.25);
    o += S.rect(0, 0, 1920, 1080, 0, { fill: '#1A1030', opacity: f(0.45 * fk) });
    o += E.journalCard(maxSnap(t), { k: seg(t, B.freeze + 0.05, B.freeze + 0.6), t });
    o += flashAt(t, B.freeze, 0.22, 0.9);
  }
  return o + hud(t) + whip(t, C.remember, -1, 0.1);
}
// 8 — "It's important." the snapshot flies into the HUD; the hero isn't looking at Max at all: he's reading plates
function shotHero(t) {
  const u = seg(t, C.hero, C.people);
  const cam = camLerp(camAt(2450, 740, 1.75), camAt(2440, 730, 1.95), u);
  const dart = Math.floor((t - C.hero) * 2.5);
  const lk = [[0.7, -0.9], [-0.2, -0.95], [0.9, -0.6], [0.3, -1]][dart % 4];
  let w = actor('grandpa', t, { ...famPose(t, 'gpa'), turn: 0.5, face: { name: 'neutral', eyes: { look: [0.7, 0] } } });
  w += actor('you', t, { ...famPose(t, 'you'), turn: 0.35, headRot: 4 * Math.sin(t * 3), face: { name: 'amazed', mouth: 'smallSmile', eyes: { look: lk, type: 'star' } } });
  let o = fairWith(t, cam, { crowd: 0.95 }, w);
  const heads = setPeople(cam, { crowd: 0.95 }, 'back').filter((h) => h.s > 0.25 && h.x > 900).slice(0, 8);
  o += headTags(heads, { t, k: (h) => seg(t, C.hero + (h.i % 5) * 0.2, C.hero + 0.3 + (h.i % 5) * 0.2) });
  o += hud(t);
  if (t < C.hero + 1.1) o += E.journalCard(maxSnap(t), { k: 1, fly: seg(t, C.hero + 0.2, C.hero + 1.0), t, cx: 960, cy: 520 });
  return o;
}
// 9 — "But there were thousands of people. And thousands of numbers." the sea of heads; plates wave on over every head
function shotPeople(t) {
  const u = seg(t, C.people, C.over);
  const cam = camLerp(camAt(1300, 700, 0.72), camAt(1320, 720, 0.6), u, ease.out);
  const o_ = { crowd: 1, packed: 1, near: 0 };
  let o = fairWith(t, cam, o_);
  const heads = setPeople(cam, o_).filter((h) => h.s > 0.15 || (h.s > 0.085 && h.i % 2 === 0));
  o += headTags(heads, { t, k: (h) => seg(t, B.wave + (h.x / 1920) * 0.85 + (h.i % 3) * 0.05, B.wave + 0.25 + (h.x / 1920) * 0.85 + (h.i % 3) * 0.05) });
  return o + hud(t) + whip(t, C.people, 1, 0.1);
}
// 10 — the camera flies over the crowd: plates, plates, plates
function shotOver(t) {
  const u = seg(t, C.over, C.wait);
  const cam = camLerp(camAt(1250, 860, 0.74), camAt(2050, 800, 0.82), u, (x) => x);
  const o_ = { crowd: 1, packed: 1 };
  let o = fairWith(t, cam, o_);
  const heads = setPeople(cam, o_).filter((h) => h.s > 0.15 || (h.s > 0.08 && h.i % 2 === 0));
  o += headTags(heads, { t, glitch: 0.15 * u });
  return o + hud(t);
}
// 11 — "Wait." the hero snaps out of it, turns
function shotWait(t) {
  const tw = ease.inOut(seg(t, B.wait - 0.05, B.wait + 0.3));
  const cam = camLerp(camAt(2450, 740, 1.75), camAt(2440, 735, 1.9), seg(t, C.wait, C.gone));
  let w = actor('you', t, { ...famPose(t, 'you'), turn: lerp(0.4, -0.75, tw), headRot: lerp(0, -6, tw), face: tw < 0.3 ? { name: 'amazed', eyes: { look: [0.6, -0.9] } } : { name: 'scared', eyes: { look: [-0.9, 0.3] } } });
  let o = fairWith(t, cam, { crowd: 0.95 }, w);
  const heads = setPeople(cam, { crowd: 0.95 }, 'back').filter((h) => h.s > 0.25 && h.x > 900).slice(0, 8);
  o += headTags(heads, { t, k: () => 1 - seg(t, B.wait + 0.3, B.wait + 0.6) * 0.5 });
  return o + hud(t) + whip(t, C.wait, 1, 0.08);
}
// 12 — "Where's Max?" where Max stood: nobody. Only his dino balloon, drifting up. PARTY 3/4 — MAX: SIGNAL LOST
function shotGone(t) {
  const u = seg(t, C.gone, C.momCall);
  const cam = camLerp(camAt(2110, 720, 1.3), camAt(2090, 660, 1.4), u);
  const bu = ease.inOut(seg(t, C.gone - 0.6, C.momCall + 0.4));
  const mp = { ...famPose(t, 'mom'), turn: 0.4, armR: 34, bendR: -70, armL: 12, face: { name: 'happy', eyes: { look: [0.7, 0] } } };
  let w = actor('mom', t, mp, { arms: false });
  const hnd = CAST.handPos('mom', mp, 1);
  w += FS.cottonCandy(hnd[0], hnd[1], 0.42);
  w += actor('you', t, { ...famPose(t, 'you'), turn: -0.75, face: { name: 'scared', eyes: { look: [-1, 0] } } });
  let o = fairWith(t, cam, { crowd: 0.9, balloon: { x: 2035 + 30 * Math.sin(t * 1.3), y: lerp(640, 230, bu), s: 0.42 } }, w);
  // where he stood: a hologram of Max (LAST SEEN), a red "?" + PLAYER NOT FOUND
  const gk = seg(t, B.lost - 0.25, B.lost + 0.1);
  if (gk > 0) {
    const gp = { ...famPose(t, 'max'), balloon: false, face: { name: 'happy' }, shadow: false, volume: false };
    const [gx, gy] = toScr(cam, gp.x, gp.y);
    o += S.g(view(cam, actor('max', t, gp, { arms: false })), null, { opacity: f(0.5 * gk * (0.8 + 0.2 * Math.sin(t * 20))) });
    o += S.ellipse(gx, gy, 90 * cam.zoom * 0.6, 24 * cam.zoom * 0.6, { fill: 'none', stroke: '#3BE8FF', 'stroke-width': 4, 'stroke-dasharray': '14 10', opacity: f(gk) });
    o += H.TF('LAST SEEN', gx, gy - 330 * cam.zoom * 0.5, 22, '#8BDCEB', { 'letter-spacing': 3, stroke: '#020C16', 'stroke-width': 5, 'paint-order': 'stroke', opacity: f(gk) });
  }
  const [qx, qy] = toScr(cam, 2010, 700);
  o += H.questMarker({ x: qx, y: qy, kind: '?', s: 0.9, t, k: seg(t, B.lost - 0.1, B.lost + 0.3), col: '#FF4D66' });
  if (t > B.lost) o += H.TL('PLAYER NOT FOUND', qx, qy - 110, 30, '#FF4D66', { stroke: '#020C16', 'stroke-width': 6, 'paint-order': 'stroke', opacity: f(seg(t, B.lost, B.lost + 0.2) * (Math.floor(t * 6) % 2 ? 1 : 0.6)) });
  return o + hud(t) + whip(t, C.gone, -1, 0.1);
}
// 13 — "Max? MAX!" Mom's face: joy -> panic; ENERGY drains
function shotMomCall(t) {
  const sm = ease.out(seg(t, B.max2 - 0.06, B.max2 + 0.1));
  let cam = camLerp(camAt(2150, 655, 2.3), camAt(2150, 640, 2.85), sm);
  cam = shook(cam, t, [[B.max2, 0.5, 14]]);
  const cup = ease.outBack(seg(t, B.max2 - 0.35, B.max2 - 0.05));
  const panic = seg(t, B.max1 - 0.1, B.max1 + 0.2);
  let w = actor('mom', t, { ...famPose(t, 'mom'), turn: lerp(0.4, -0.2, panic), armL: lerp(16, 120, cup), armR: lerp(16, 120, cup), bendL: 100 * cup, bendR: 100 * cup, headRot: lerp(0, -5, panic),
    face: panic < 0.5 ? { name: 'happy', eyes: { look: [0.7, 0] } } : t < B.max2 ? { name: 'scared', fx: ['sweat'] } : { name: 'scared', mouth: 'scream', fx: ['sweat'] } }, { arms: false });
  let o = fairWith(t, cam, { crowd: 0.9 }, w);
  const hp = head('mom', FAM.mom, { dayoff: true });
  const [hx, hy] = toScr(cam, hp.x, hp.y);
  o += H.plateFor('mom', { x: hx + 400, y: Math.max(330, hy + 60), s: 0.9, t, lift: 20, tether: false, bars: [{ label: 'ENERGY', value: t >= B.max2 ? 1 : 22, from: 22, roll: t >= B.max2 ? seg(t, B.max2, B.max2 + 0.5) : undefined }],
    tags: [{ text: 'WORRIED', col: '#FF4D66', k: seg(t, B.max1, B.max1 + 0.3) }] });
  o += focusLines(960, 520, bump(t, B.max2 - 0.05, B.max2 + 0.5), 7);
  return o + hud(t) + whip(t, C.momCall, 1, 0.08);
}
// 14 — "New quest." the hero + Mom turning in the crowd; NEW QUEST: Find Max drops in
function questToast(t) {
  return H.questToast({ t, k: seg(t, B.quest - 0.05, B.quest + 0.55), title: 'Find Max', sub: t > B.location ? 'Location... unknown' : 'Reward: ???', kind: 'new', y: 170, s: 0.95,
    glitch: seg(t, B.unknown - 0.1, B.unknown + 0.3) * 0.8, out: seg(t, C.warn - 0.25, C.warn) });
}
function shotQuest(t) {
  const cam = camLerp(camAt(2300, 700, 1.08), camAt(2310, 690, 1.16), seg(t, C.quest, C.arrow));
  const lk = Math.sin((t - C.quest) * 5);
  let w = actor('mom', t, { ...famPose(t, 'mom'), turn: -0.6 * Math.sign(lk) || -0.6, face: { name: 'scared', fx: ['sweat'], eyes: { look: [lk, 0] } } });
  w += actor('you', t, { ...famPose(t, 'you'), turn: 0.7 * Math.sin((t - C.quest) * 4), face: { name: 'scared', eyes: { look: [Math.sin((t - C.quest) * 4), 0] } } });
  let o = fairWith(t, cam, { crowd: 1, back: [row(1060, 41, 0.6, [[2050, 2600]])] }, w);
  return o + hud(t, { quest: t > B.quest + 0.5 }) + questToast(t) + whip(t, C.quest, -1, 0.1);
}
// 15 — "Find Max. Location... unknown." the quest arrow at his feet points... and spins
function shotArrow(t) {
  const u = seg(t, C.arrow, C.warn);
  const cam = camLerp(camAt(2480, 865, 1.15), camAt(2480, 845, 1.3), u);
  const gl = seg(t, B.location - 0.1, B.location + 0.4);
  const ring = [row(1035, 51, 1, [[2330, 2630]]), row(1080, 52, 1, [[2300, 2660]])];
  let w = actor('you', t, { ...famPose(t, 'you'), turn: Math.sin((t - C.arrow) * 3) * 0.7 * gl, face: { name: gl > 0.5 ? 'scared' : 'determined', eyes: { look: [Math.sin((t - C.arrow) * 3) * gl, 0.6] } } });
  // the arrow on the ground (under him): drawn before the hero so his feet stand on it
  const [fx, fy] = toScr(cam, FAM.you.x, FAM.you.y);
  const arrow = H.questArrow({ x: fx, y: fy + 6, t, angle: -20, glitch: gl, k: seg(t, B.find - 0.2, B.find + 0.3), s: 1.15 * cam.zoom / 1.2, label: 'FIND MAX', dist: gl > 0.5 ? '??? m' : '120 m' });
  const L = FS.fair.layers(t, cam, { crowd: 1 });
  const o = L.bg + L.mid + L.front + E.rowsDraw([row(950, 53, 1)], cam, t) + arrow + view(cam, w) + E.rowsDraw(ring, cam, t) + L.fg + L.light;
  return o + hud(t, { quest: true, glitch: 0.1 * gl }) + questToast(t);
}
// 16 — "Warning. Too many players." the crowd's plates jitter, the minimap fills with dots, WARNING
function shotWarn(t) {
  const u = seg(t, C.warn, C.overload);
  const cam = camLerp(camAt(1500, 720, 0.66), camAt(1560, 700, 0.74), u);
  const o_ = { crowd: 1, packed: 1, near: 1 };
  let o = fairWith(t, cam, o_);
  const heads = setPeople(cam, o_).filter((h) => h.s > 0.075);
  const g = 0.2 + 0.6 * u;
  o += headTags(heads, { t, glitch: g, rim: Math.floor(t * 8) % 2 ? '#3BE8FF' : '#FF4D66' });
  o += hud(t, { quest: true, glitch: 0.15 + 0.3 * u, crowdDots: Math.round(10 + 40 * seg(t, B.players, B.players + 0.6)) });
  o += H.systemMsg({ t, theme: 'warn', text: 'WARNING', sub: 'Too many players.', k: seg(t, B.warn, B.warn + 0.5), y: 150, glitch: 0.2 + 0.3 * u, type: seg(t, B.warn, B.players + 0.3) });
  o += H.edgePulse(0, 0, 1920, 1080, 0.4 * (0.6 + 0.4 * Math.sin(t * 10)));
  return o + whip(t, C.warn, 1, 0.1);
}
// 17 — "HUD overload." smash zoom on the hero's face; the whole HUD glitches
function shotOverload(t) {
  const sm = ease.out(seg(t, C.overload, C.overload + 0.18));
  let cam = camLerp(camAt(2480, 690, 2.2), camAt(2480, 660, 3.0), sm);
  cam = shook(cam, t, [[B.overload, 0.6, 22]]);
  let w = actor('you', t, { ...famPose(t, 'you'), turn: 0, face: { name: 'shocked', fx: ['sweat'] } });
  let o = fairWith(t, cam, { crowd: 1 }, w);
  const gk = 0.3 + 0.7 * seg(t, B.overload - 0.1, B.overload + 0.1);
  let hudL = hud(t, { quest: true, crowdDots: 60 }) + H.systemMsg({ t, theme: 'error', text: 'HUD OVERLOAD', sub: 'Too many players.', k: seg(t, C.overload, C.overload + 0.35), y: 150 });
  o += H.hudGlitch(hudL, t, gk, { seed: 9, drop: false });
  o += H.numbersFlood({ t, k: 0.25 * seg(t, B.overload, C.flood), seed: 3, n: 30, tint: false });
  o += flashAt(t, B.overload, 0.2, 0.5, '#FF3355') + focusLines(960, 520, bump(t, C.overload, C.overload + 0.5), 5);
  return o + whip(t, C.overload, 1, 0.06);
}
// 18 — numbers over EVERYTHING: the sky, the rides, the crowd (the 2.5 s beat)
function shotFlood(t) {
  const u = seg(t, C.flood, C.looked);
  const cam = camLerp(camAt(1650, 380, 0.56), camAt(1700, 420, 0.63), u);
  const o_ = { crowd: 0.9 };
  let o = fairWith(t, cam, o_);
  const heads = setPeople(cam, o_).filter((h) => h.s > 0.11);
  o += headTags(heads, { t, glitch: 0.3 });
  const tip = (x, y, k0, title, lines, side = 'up', rar) => H.tooltip({ x, y, t, k: seg(t, k0, k0 + 0.45), title, lines, side, rarity: rar, s: 0.75, dist: 50 });
  const [wx, wy] = toScr(cam, SPF.ferris.x, SPF.ferris.y - 300, SPF.ferris.k);
  const [cx, cy] = toScr(cam, SPF.cotton.sign.x, SPF.cotton.sign.y);
  o += tip(wx, wy + 300 * cam.zoom, C.flood + 0.1, 'FERRIS WHEEL', ['LV 40', 'SPEED 2 · TOO SLOW'], 'right', 'common');
  o += tip(cx + 60, cy + 60, C.flood + 0.5, 'COTTON CANDY', ['SUGAR +99', 'HAPPINESS +40'], 'right', 'rare');
  o += tip(560, 250, C.flood + 0.9, 'CLOUD', ['LV 2', 'FLUFF 100%'], 'down', 'common');
  o += tip(1560, 120, C.flood + 1.3, 'SKY', ['LV ???', 'BLUE 12%'], 'down', 'mystery');
  o += H.numbersFlood({ t, k: lerp(0.15, 0.5, u), seed: 5, n: 50, tint: false });
  return o + hud(t, { quest: true, crowdDots: 60 });
}
// ---- crowd shots with real layering: E.crowdShot (set -> back rows -> plates -> under -> chars -> front rows -> plates)
const { crowdShot, COLD } = E;
const EYE_ROWS = [row(990, 61, 1), row(1040, 62, 1), row(1100, 63, 1), row(1170, 64, 1)];
// 19 — "You looked everywhere." whip pans across faces that are only plates
function shotLooked(t) {
  const W_ = B.whips, xs = [1500, 2700, 1900];
  let i = 0; while (i < 2 && t >= W_[i + 1]) i++;
  const a = W_[i], x0 = i ? xs[i - 1] : xs[0] - 300;
  const x = lerp(x0, xs[i], ease.out(seg(t, a, a + 0.16))) + (t - a) * 60;
  const cam = camAt(x, 720, 1.05);
  let o = crowdShot(t, cam, { front: EYE_ROWS, crowd: 0.6, glitch: 0.15 });
  o += H.numbersFlood({ t, k: 0.45, seed: 7 + i, n: 45, tint: false });
  return o + hud(t, { quest: true, glitch: 0.25, crowdDots: 60 }) + whip(t, a, i % 2 ? -1 : 1, 0.12);
}
// 20 — "But all you could see... were numbers." POV push into the crowd
function shotSee(t) {
  const u = seg(t, C.see, C.lv12);
  const cam = camLerp(camAt(2100, 730, 1.0), camAt(2140, 740, 1.32), u);
  const jump = seg(t, B.numbers9 - 0.05, B.numbers9 + 0.15);
  let o = crowdShot(t, cam, { front: EYE_ROWS, crowd: 0.6, glitch: 0.2 + 0.5 * jump });
  o += H.numbersFlood({ t, k: lerp(0.45, 0.6, u) + 0.12 * jump, seed: 11, n: 60 });
  return o + hud(t, { quest: true, glitch: 0.2 + 0.4 * jump, crowdDots: 60 }) + whip(t, C.see, 1, 0.08);
}
// 21-23 — "Level twelve! Level forty! Level eight!" strangers in green turn around: plates for faces
const STRANGERS = [
  { kind: 'kid', i: 12, lv: 12, s: 1.25, x: 1060, y: 1560, word: () => B.lv12, c0: () => C.lv12 },
  { kind: 'adult', i: 14, lv: 40, s: 1.0, x: 980, y: 1600, word: () => B.lv40, c0: () => C.lv40 },
  { kind: 'kid', i: 18, lv: 8, s: 1.3, x: 1000, y: 1520, word: () => B.lv8, c0: () => C.lv8 },
];
function shotStranger(t, n) {
  const P = STRANGERS[n], c0 = P.c0(), wt = P.word();
  const cam = camAt(1900 + n * 500, 700, 1.7);
  let o = crowdShot(t, cam, { front: [row(1000, 70 + n, 1), row(1060, 72 + n, 1)], crowd: 0.6, glitch: 0.2 });
  o += H.numbersFlood({ t, k: 0.5, seed: 20 + n, n: 40, tint: true });
  const turn = ease.out(seg(t, c0 + 0.18, wt - 0.02));
  const tn = turn < 0.35 ? 0 : lerp(-0.8, -0.15, (turn - 0.35) / 0.65);
  const pose = { x: P.x, y: P.y, s: P.s, t, i: P.i, armL: 10, armR: 10, face: { name: 'neutral' } };
  if (turn < 0.35) Object.assign(pose, { view: 'back' }); else Object.assign(pose, { turn: tn });
  o += K.draw[P.kind](P.i, pose);
  const ht = H.overHead(P.kind, P.x, P.y, P.s, 0, { i: P.i });
  // the hero's hand on the shoulder (from the left)
  const grab = ease.outBack(seg(t, c0, c0 + 0.18));
  o += E.heroHand(lerp(-200, ht.x - 170 * P.s, grab), ht.y + 300 * P.s, P.s * 1.1, -6, grab);
  // the face: a plate slams on as he turns
  const fy = ht.y + 125 * P.s;
  if (turn >= 0.35) o += facePlates([{ x: ht.x + tn * 50 * P.s, y: fy, r: 112 * P.s, i: 5 + n, lv: P.lv }], { t, k: () => seg(t, wt - 0.1, wt + 0.12), glitch: 0.1 });
  o += focusLines(ht.x, fy, bump(t, wt - 0.05, wt + 0.4), 3 + n) + flashAt(t, wt - 0.02, 0.12, 0.35);
  return o + hud(t, { quest: true, glitch: 0.3, crowdDots: 60 }) + whip(t, c0, n % 2 ? -1 : 1, 0.08);
}
// the hero inside the crowd (rows behind him / a ring in front with a gap where he stands)
const { RING_B, RING_F } = E;
// 24 — "I can't see FACES!" he spins in the crowd, hands on his head; the camera circles
function shotFaces(t) {
  const u = seg(t, C.faces, C.dino);
  const ph = (t - C.faces) * 2.2;
  let cam = { ...camAt(2480, 760, lerp(1.5, 1.75, u)), rot: 7 * Math.sin(ph * 2.4) };
  cam = shook(cam, t, [[B.faces, 0.5, 14]]);
  const spin = ph % 1, views = ['front', 'side', 'back', 'side'], vi = Math.floor(spin * 4);
  const pose = { ...famPose(t, 'you'), armL: 128, armR: 128, bendL: 86, bendR: 86, view: views[vi], flip: vi === 3, face: { name: 'scared', mouth: t > B.faces - 0.05 ? 'scream' : 'O', fx: ['sweat'] } };
  if (vi % 2) Object.assign(pose, { armL: 150, armR: 150, bendL: 60, bendR: 60 });
  const o = crowdShot(t, cam, { back: RING_B, front: RING_F, glitch: 0.4, chars: actor('you', t, pose, { arms: false }), under: H.numbersFlood({ t, k: 0.68, seed: 13, n: 45 }) });
  return roll(cam, o) + hud(t, { quest: true, glitch: 0.4, crowdDots: 60 }) + whip(t, C.faces, 1, 0.08);
}
// 25 — "He's wearing a dinosaur suit!" Mom grabs him — and even her face is a plate (flickering)
function shotDino(t) {
  const u = seg(t, C.dino, C.green);
  const cam = camLerp(camAt(2340, 700, 1.85), camAt(2345, 690, 2.0), u);
  const grab = ease.outBack(seg(t, B.grab - 0.2, B.grab + 0.15));
  const mx = lerp(2120, 2250, ease.out(seg(t, C.dino, B.grab + 0.1)));
  const ms = sAt(995);
  let w = actor('mom', t, { x: mx, y: 995, s: ms, t, dayoff: true, turn: 0.7, armR: lerp(20, 78, grab), armL: lerp(20, 60, grab), bendR: -20 * grab, lean: 4 * grab, face: { name: 'scared', fx: ['sweat'] } }, { arms: false, energy: 1.5 });
  w += actor('you', t, { ...famPose(t, 'you'), x: 2440, turn: -0.6, face: { name: 'scared', eyes: { look: [-0.8, -0.2] } } }, { arms: false });
  let o = crowdShot(t, cam, { back: [row(935, 90, 1), row(965, 93, 1)], front: [row(1080, 91, 1, [[2080, 2620]]), row(1150, 92, 1, [[2120, 2580]])], glitch: 0.35, chars: w, under: H.numbersFlood({ t, k: 0.45, seed: 17, n: 40 }) });
  // Mom's face: her own plate, flickering on/off
  const mh = H.overHead('mom', mx, 995, ms, 0, { dayoff: true });
  const [mfx, mfy] = toScr(cam, mh.x + 30, mh.y + 300 * ms);
  if (hash(Math.floor(t * 9) * 1.37) > 0.22) o += facePlates([{ x: mfx, y: mfy, r: 118 * ms * cam.zoom, i: 3, lv: 38 }], { t, glitch: 0.3 });
  return o + hud(t, { quest: true, glitch: 0.35, crowdDots: 60 }) + whip(t, C.dino, -1, 0.08);
}
// 26 — "A green dinosaur!" SEARCH: GREEN DINOSAUR -> 2,413 MATCHES all over the crowd
function shotGreen(t) {
  const u = seg(t, C.green, C.tell);
  const cam = camLerp(camAt(1500, 720, 0.66), camAt(1480, 730, 0.72), u);
  const o_ = { crowd: 1, packed: 1, near: 1 };
  let o = fairWith(t, cam, o_);
  const heads = setPeople(cam, o_).filter((h) => h.s > 0.075);
  const res = seg(t, B.results, B.results + 0.3);
  const st = Math.floor(t * 6);
  const hit = (h) => res > 0 && hash(h.i * 1.9) < 0.45 && hash(h.i * 3.3 + st) > 0.15;
  o += headTags(heads.filter((h) => !hit(h)), { t, glitch: 0.4 });
  o += headTags(heads.filter(hit), { t, glitch: 0.3, rim: '#3DFF8F', glass: '#06240E', bar: '#C6FF86', lvl: () => '??' });
  o += hud(t, { quest: true, glitch: 0.3, crowdDots: 60 });
  o += E.searchBar({ t, k: seg(t, B.search - 0.2, B.search + 0.2), type: seg(t, B.search, B.results - 0.1), res, y: 150, glitch: 0.15 });
  return o + whip(t, C.green, 1, 0.08);
}
// 27 — "I can't tell!" the hero's face (the only face), plates swirling
function shotTell(t) {
  const u = seg(t, C.tell, C.number);
  const cam = camLerp(camAt(2480, 660, 2.6), camAt(2480, 650, 2.9), u);
  const sh = Math.sin(t * 11);
  const w = actor('you', t, { ...famPose(t, 'you'), turn: 0.12 * sh, armL: 40 + 10 * sh, armR: 40 - 10 * sh, face: { name: 'scared', fx: ['sweat', 'sweat2'] } }, { arms: false, energy: 1.6 });
  const o = crowdShot(t, cam, { back: RING_B, plates: true, glitch: 0.4, chars: w, under: H.numbersFlood({ t, k: 0.62, seed: 23, n: 55 }) });
  return o + H.numbersFlood({ t, k: 0.2, seed: 24, n: 20, tint: false, rect: [0, 0, 1920, 330] }) + hud(t, { quest: true, glitch: 0.35, crowdDots: 60 }) + whip(t, C.tell, -1, 0.06);
}
// 28 — "Everybody's just... a number!" pull back: the crowd around him is all plates
function shotNumber(t) {
  const u = seg(t, C.number, C.ears);
  const cam = camLerp(camAt(2480, 640, 2.4), camAt(2480, 720, 0.95), u, ease.inOut);
  const w = actor('you', t, { ...famPose(t, 'you'), armL: 60, armR: 60, face: { name: 'scared', fx: ['sweat'] } }, { arms: true });
  const fk = lerp(0.6, 0.82, u) + 0.08 * bump(t, B.number - 0.05, B.number + 0.4);
  const o = crowdShot(t, cam, { back: RING_B, front: RING_F, glitch: 0.4, chars: w, under: H.numbersFlood({ t, k: fk, seed: 29, n: 70 }) });
  return o + hud(t, { quest: true, glitch: 0.45, crowdDots: 60 }) + whip(t, C.number, 'up', 0.06);
}
// 29 — the numbers fill the whole screen; noise; he covers his ears (3 s beat)
function shotEars(t) {
  const u = seg(t, C.ears, C.quiet);
  let cam = camLerp(camAt(2480, 800, 1.45), camAt(2480, 820, 1.7), u);
  cam = shook(cam, t, [[C.ears, 3.2, 6 + 6 * u]]);
  const cover = ease.outBack(seg(t, C.ears, C.ears + 0.35));
  const pose = { ...famPose(t, 'you'), armL: lerp(40, 120, cover), armR: lerp(40, 120, cover), bendL: 92 * cover, bendR: 92 * cover, bodyY: 26 * cover, sy: 1 - 0.05 * cover, headRot: 4 * Math.sin(t * 13) * u,
    face: { name: 'scared', eyes: { type: 'closed' }, mouth: 'wavy', fx: ['sweat', 'sweat2'] } };
  let o = crowdShot(t, cam, { back: RING_B, front: RING_F, glitch: 0.6, chars: actor('you', t, pose, { arms: false }), under: dark(0.35, '#040A12') + H.numbersFlood({ t, k: lerp(0.85, 1, u), seed: 31, n: 60, tint: false }) });
  // a second, thinner layer of numbers in front (the edges only — his face stays visible)
  o += H.numbersFlood({ t, k: 0.5 + 0.4 * u, seed: 32, n: 18, tint: false, rect: [0, 0, 400, 1080] }) + H.numbersFlood({ t, k: 0.5 + 0.4 * u, seed: 33, n: 18, tint: false, rect: [1520, 0, 400, 1080] });
  o += H.edgePulse(0, 0, 1920, 1080, 0.5 + 0.4 * Math.sin(t * 10));
  return o + hud(t, { quest: true, glitch: 0.3, crowdDots: 80 });
}
// 30 — "You could see everyone's stats." silence: the flood freezes, goes cold; push in on his face
const FREEZE = () => C.quiet;
const coldFlood = (k, seed, n) => H.numbersFlood({ t: FREEZE(), k, seed, n, tint: false }).replace(/#3BE8FF|#FFD21F|#3DFF8F|#FF4D66|#FF5ACD|#FFFFFF/g, '#B8C6D4');
function shotQuiet(t) {
  const u = seg(t, C.quiet, C.brother);
  const cam = camLerp(camAt(2480, 660, 1.9), camAt(2480, 650, 2.3), u, ease.inOut);
  const pose = { ...famPose(t, 'you'), armL: 14, armR: 14, headRot: -4, face: { name: 'sad', eyes: { look: [0, 0.7] } } };
  let o = crowdShot(t, cam, { back: RING_B, front: RING_F, quiet: 1, cold: true, pt: FREEZE(), chars: actor('you', t, pose, { arms: false }), under: dark(0.35, '#0A1020') + coldFlood(0.8, 31, 50) });
  return o + H.hudFrame({ t: FREEZE(), clock: clock(FREEZE()), day: 'SAT', theme: 'cold', quest: 'FIND MAX', questSub: 'LOCATION: UNKNOWN' });
}
// 31 — "But you couldn't see your brother." pull back: the hero alone and small in a sea of numbers
function shotBrother(t) {
  const u = seg(t, C.brother, END - 0.6);
  const cam = camLerp(camAt(2480, 700, 1.6), camAt(2400, 640, 0.6), u, ease.inOut);
  const pose = { ...famPose(t, 'you'), armL: 12, armR: 12, headRot: -5, face: { name: 'sad', eyes: { look: [0, 0.8] } } };
  let o = crowdShot(t, cam, { back: RING_B.slice(1), front: RING_F.slice(0, 2), quiet: 1, cold: true, pt: FREEZE(), crowd: 0.85, chars: actor('you', t, pose, { arms: false }) });
  // the rest of the fair: plates over every far head too
  const far = setPeople(cam, { crowd: 0.85 }, 'back').filter((h) => h.s > 0.08);
  o += headTags(far, { t: FREEZE(), rim: '#7FA3BF', bar: '#7F96AA', glass: '#0B141E' });
  // a pool of light on him, the rest falls into the dark (evenodd rings — no masks)
  const [hx, hy] = toScr(cam, FAM.you.x, FAM.you.y - 200);
  const R0 = 230 * cam.zoom + 70, dk = 0.3 + 0.5 * u;
  [[1.1, 0.35], [1.9, 0.4]].forEach(([m, a]) => {
    o += S.path(`M-20 -20H1940V1100H-20Z M${f(hx - R0 * m)} ${f(hy)}a${f(R0 * m)} ${f(R0 * m * 0.85)} 0 1 0 ${f(2 * R0 * m)} 0a${f(R0 * m)} ${f(R0 * m * 0.85)} 0 1 0 ${f(-2 * R0 * m)} 0Z`, { fill: '#05060E', opacity: f(a * dk), 'fill-rule': 'evenodd' });
  });
  o += H.hudFrame({ t: FREEZE(), clock: clock(FREEZE()), day: 'SAT', theme: 'cold', quest: 'FIND MAX', questSub: 'LOCATION: UNKNOWN' });
  return o;
}

// ---------------------------------------------------------------- router
const SHOTS = [
  [C.mom, shotSign], [C.wide, shotMom], [C.together, shotWide], [C.up, shotTogether], [C.sky, shotUp], [C.remember, shotSky], [C.hero, shotRemember],
  [C.people, shotHero], [C.over, shotPeople], [C.wait, shotOver], [C.gone, shotWait], [C.momCall, shotGone], [C.quest, shotMomCall], [C.arrow, shotQuest],
  [C.warn, shotArrow], [C.overload, shotWarn], [C.flood, shotOverload], [C.looked, shotFlood], [C.see, shotLooked], [C.lv12, shotSee],
  [C.lv40, (t) => shotStranger(t, 0)], [C.lv8, (t) => shotStranger(t, 1)], [C.faces, (t) => shotStranger(t, 2)], [C.dino, shotFaces], [C.green, shotDino],
  [C.tell, shotGreen], [C.number, shotTell], [C.ears, shotNumber], [C.quiet, shotEars], [C.brother, shotQuiet], [Infinity, shotBrother],
];
// rig characters render without the body-volume filter wherever they are bigger than ~half the hero (perf: the filter cost grows
// with the on-screen area); only the two wides keep it
const FULLVOL = new Set([shotWide, shotPeople, shotOver, shotWarn, shotGreen, shotFlood]);
const shotAt = (t) => { for (const [end, g] of SHOTS) if (t < end) return g; return shotBrother; };
function scene(t) {
  const fn = shotAt(t);
  VOL_OFF = !FULLVOL.has(fn);
  return fn(t);
}
function look(t) {
  if (t < C.wait) return { grade: 'warm', vignette: 0.55 };
  if (t < C.flood) return { grade: null, vignette: 0.75 };
  if (t < C.quiet) return { grade: 'cool', vignette: 1 };
  return { grade: 'night', vignette: 1 };
}

module.exports = { scene, look, TIMES: TM, CUT: C, BEATS: B, FAM };
