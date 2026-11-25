// SC 08 / SC 09 shared helpers: the SC 08 cut list + beats from the voice (shared with audio/cues/gen_sc08.js), camera helpers
// (whip, flash, focus lines, shake), the fair world + hand-placed crowd rows (so the hero can stand INSIDE the crowd), batched
// cheap HUD tags over every head / opaque plates over every face (the "sea of numbers"), the PARTY panel, the NEW AREA banner,
// the JOURNAL card ("Max wanted to go up. Remember that."), the search bar ("GREEN DINOSAUR... 2,413 matches").
'use strict';

const K = require('./kit');
const H = require('./hud');
const FS = require('./sets_fair');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln } = K;

// ================================================================ times (from the voice only)
function times(V) {
  const { L } = V;
  const l = (i) => L('08.' + i);
  const START = V.scene('SC 08').start, END = V.scene('SC 09').start;
  const C = {}, B = {};
  // -- "Saturday. The town fair." the TOWN FAIR arch, the family walks in
  C.sign = START;
  B.sat = l(0).word('Saturday').t0;
  B.tilt = l(0).word('The').t0 - 0.05;
  B.area = l(0).word('town').t0 - 0.12;
  B.famPlates = l(0).word('fair').t1 + 0.1;
  // -- "Mom's first day off in a year."
  C.mom = l(0).word("Mom's").t0 - 0.28;
  B.momPlate = l(0).word("Mom's").t0 - 0.12;
  B.dayoff = l(0).word('off').t0 - 0.05;
  B.year = l(0).word('year').t0 - 0.05;
  // -- the fair, wide (2 s beat)
  C.wide = l(0).b + 0.32;
  // -- "Everybody stay together, okay?"
  C.together = l(1).a - 0.26;
  B.party = l(1).word('together').t0 - 0.1;
  B.okay = l(1).word('okay').t0;
  // -- "I wanna go UP! Way up! Where the clouds are!"
  C.up = l(2).a - 0.12;
  B.up = l(2).word('UP').t0;
  C.sky = l(2).word('Way').t0 - 0.1;
  B.clouds = l(2).word('clouds').t0;
  // -- "Max wanted to go up. Remember that. It's important."
  C.remember = l(3).a - 0.08;
  B.freeze = l(3).word('Remember').t0 - 0.06;
  C.hero = l(3).word("It's").t0 - 0.16;
  B.important = l(3).word('important').t0;
  // -- "But there were thousands of people. And thousands of numbers." + the fly-over (3 s beat)
  C.people = l(4).a - 0.1;
  B.wave = l(4).word('thousands', 1).t0 - 0.25;
  B.waveEnd = l(4).word('numbers').t1;
  C.over = l(4).b + 0.12;
  // -- "Wait. Where's Max?"
  C.wait = l(5).a - 0.16;
  B.wait = l(5).a;
  C.gone = l(5).word("Where's").t0 - 0.2;
  B.lost = l(5).word('Max').t0;
  // -- "Max? MAX!"
  C.momCall = l(6).a - 0.1;
  B.max1 = l(6).word('Max').t0;
  B.max2 = l(6).word('MAX', 1).t0;
  // -- SYSTEM "New quest. Find Max. Location... unknown."
  C.quest = l(7).a - 0.16;
  B.quest = l(7).a - 0.1;
  C.arrow = l(7).word('Find').t0 - 0.2;
  B.find = l(7).word('Find').t0;
  B.location = l(7).word('Location').t0;
  B.unknown = l(7).word('unknown').t0;
  // -- SYSTEM "Warning. Too many players. HUD overload." + numbers over everything (2.5 s beat)
  C.warn = l(8).a - 0.16;
  B.warn = l(8).a - 0.1;
  B.players = l(8).word('players').t0;
  C.overload = l(8).word('HUD').t0 - 0.12;
  B.overload = l(8).word('overload').t0;
  C.flood = l(8).b + 0.16;
  // -- "You looked everywhere. But all you could see... were numbers."
  C.looked = l(9).a - 0.12;
  B.whips = [l(9).a - 0.12, l(9).word('looked').t0 + 0.05, l(9).word('everywhere').t0 + 0.2];
  C.see = l(9).word('But').t0 - 0.1;
  B.numbers9 = l(9).word('numbers').t0;
  // -- "Level twelve! Level forty! Level eight! I can't see FACES!"
  C.lv12 = l(10).a - 0.12;
  B.lv12 = l(10).word('twelve').t0;
  C.lv40 = l(10).word('Level', 1).t0 - 0.12;
  B.lv40 = l(10).word('forty').t0;
  C.lv8 = l(10).word('Level', 2).t0 - 0.12;
  B.lv8 = l(10).word('eight').t0;
  C.faces = l(10).word('I').t0 - 0.16;
  B.faces = l(10).word('FACES').t0;
  // -- MOM "He's wearing a dinosaur suit! A green dinosaur!"
  C.dino = l(11).a - 0.16;
  B.grab = l(11).a - 0.05;
  C.green = l(11).word('A').t0 - 0.12;
  B.search = l(11).word('green').t0 - 0.1;
  B.results = l(11).word('dinosaur', 1).t1 - 0.05;
  // -- "I can't tell! Everybody's just... a number!" + the flood fills the screen, he covers his ears (3 s beat)
  C.tell = l(12).a - 0.12;
  C.number = l(12).word("Everybody's").t0 - 0.12;
  B.number = l(12).word('number').t0;
  C.ears = l(12).b + 0.14;
  // -- "You could see everyone's stats. But you couldn't see your brother."
  C.quiet = l(13).a - 0.22;
  C.brother = l(13).word('But').t0 - 0.12;
  B.brother = l(13).word('brother').t0;
  return { START, END, C, B };
}

// ================================================================ camera helpers
const camAt = (x, y, z, sx = 960, sy = 540, rot = 0) => ({ ...FS.camAt(x, y, z, sx, sy), rot });
const camLerp = (a, b, u, e = ease.inOut) => { const k = e(clamp(u, 0, 1)); return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), zoom: lerp(a.zoom, b.zoom, k), rot: lerp(a.rot || 0, b.rot || 0, k) }; };
function shook(cam, t, hits) {
  let sx = 0, sy = 0;
  for (const [t0, dur, amp] of hits) { const s = K.shake(t, t0, dur, amp); sx += s.sx; sy += s.sy; }
  return { ...cam, sx: (cam.sx || 0) + sx, sy: (cam.sy || 0) + sy };
}
const toScr = (cam, x, y, k = 1) => { const p = FS.toScreen(cam, { x, y, k }); return [p.x, p.y]; };
const view = (cam, svg, k = 1) => (svg ? S.g(svg, FS.camTf(cam, k)) : '');
const roll = (cam, svg) => (cam.rot ? S.g(svg, `rotate(${f(cam.rot)} 960 540) scale(${f(1 + Math.abs(cam.rot) * 0.012)})`) : svg);
// white flash + streaks at a cut (whip-pan feel); dir ±1 = horizontal, 'up' / 'down' = vertical streaks
function whip(t, t0, dir = 1, dur = 0.12, col = '#FFFFFF') {
  const u = (t - t0) / dur;
  if (u < 0 || u > 1) return '';
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: col, opacity: f(0.5 * (1 - u) * (1 - u)) });
  let d = '';
  for (let i = 0; i < 18; i++) {
    const a = hash(i * 3.3 + t0), b = hash(i * 7.7 + t0);
    if (typeof dir === 'string') { const x = a * 1920, y = (b * 1400 - 200) + (dir === 'up' ? 1 : -1) * u * 500; d += `M${f(x)} ${f(y)} v${f(160 + 260 * b)}`; }
    else { const y = a * 1080, x = b * 2200 - 200 - dir * u * 600; d += `M${f(x)} ${f(y)} h${f(200 + 340 * b)}`; }
  }
  return o + S.path(d, ln(10, col, 0.8 * (1 - u)));
}
const flashAt = (t, t0, dur = 0.15, amp = 0.8, col = '#FFFFFF') => { const u = (t - t0) / dur; return u < 0 || u > 1 ? '' : S.rect(0, 0, 1920, 1080, 0, { fill: col, opacity: f(amp * (1 - u) * (1 - u)) }); };
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
const dark = (k, col = '#0A0614') => (k > 0.003 ? S.rect(-20, -20, 1960, 1120, 0, { fill: col, opacity: f(clamp(k, 0, 1)) }) : '');

// ================================================================ the fair + hand-placed crowd rows
const SPF = FS.SPOTS.fair;
const sAt = SPF.sAt;
// a crowd row at world y (fill people, deterministic per seed): FS.crowd rows
const row = (y, seed, dens = 0.95, gaps = []) => ({ y, s: sAt(y), seed, dens, dx: 270, jit: 10, gaps });
function rowsDraw(rows, cam, t, o = {}) {
  if (!rows.length) return '';
  const st = FS.frameState({ time: o.time || 'dusk', quiet: o.quiet || 0 });
  const v = FS.vis(cam, 1);
  return view(cam, FS.crowd(rows, { tone: st.tnCrowd, t, zoom: cam.zoom, x0: v.x0 - 200, x1: v.x1 + 200, cheer: o.cheer || 0, faces: o.faces }));
}
// the people of the rows in view: [{x, y, s, i, kid, back, row}] (world)
function rowsPeople(rows, cam) {
  const v = FS.vis(cam, 1), out = [];
  for (const r of rows) for (const p of FS.crowdPeople(r, v.x0 - 200, v.x1 + 200, 1)) out.push({ ...p, row: r.y });
  return out;
}
// the fair set with the hero (and friends) inside the crowd: behind rows -> chars -> front rows
function fairWith(t, cam, o = {}, chars = '', over = '') {
  const L = FS.fair.layers(t, cam, { crowd: o.crowd ?? 0.8, packed: o.packed ?? 0, near: o.near || 0, time: o.time || 'dusk', quiet: o.quiet || 0, balloon: o.balloon, cheer: o.cheer || 0, dinoLook: o.dinoLook, wobble: o.wobble, canopy: o.canopy, lights: o.lights });
  let out = L.bg + L.mid + (o.behindFront ? view(cam, o.behindFront) : '') + L.front;
  out += rowsDraw(o.back || [], cam, t, o);
  out += view(cam, chars);
  out += rowsDraw(o.front || [], cam, t, o);
  out += L.crowd + (o.mid2 || '') + L.fg + L.light;
  return out + over;
}

// ================================================================ cheap HUD tags over heads + plates over faces (batched)
const TAG_LV = (i) => 2 + Math.floor(hash(i * 3.71 + 0.3) * 97);
const chamD = (x, y, w, h, c) => `M${f(x + c)} ${f(y)}H${f(x + w)}V${f(y + h - c)}L${f(x + w - c)} ${f(y + h)}H${f(x)}V${f(y + c)}Z`;
// tags over heads: pts = [{x, y (head top), s (screen scale ~ .1-.6), i}] in SCREEN space. k(p) -> 0..1 pop per tag.
// o: { t, glitch, theme 'cyan'|'cold'|'warn', jit, lvl(p) }
function headTags(pts, o = {}) {
  const t = o.t || 0, g = o.glitch || 0, kOf = o.k || (() => 1);
  const rim = o.rim || '#3BE8FF', glass = o.glass || '#061624', bar = o.bar || '#3DFF8F';
  let dBody = '', dBar = '', dRim = '', txt = '', dTeth = '';
  const st = Math.floor(t * 12);
  for (const p of pts) {
    const k = kOf(p);
    if (k <= 0) continue;
    const sc = p.s * 2.1 * ease.outBack(clamp(k, 0, 1));
    if (sc < 0.06) continue;
    const jx = g > 0 ? (hash(st + p.i * 1.7) - 0.5) * 30 * g * sc : 0, jy = g > 0 ? (hash(st * 1.3 + p.i) - 0.5) * 16 * g * sc : 0;
    const w = 150 * sc, h = 48 * sc, x = p.x - w / 2 + jx, y = p.y - 26 * sc - h + jy + Math.sin(t * 2 + p.i) * 2;
    dBody += chamD(x, y, w, h, 10 * sc);
    dRim += chamD(x + 3 * sc, y + 3 * sc, w - 6 * sc, h - 6 * sc, 8 * sc);
    const hp = 0.2 + 0.8 * hash(p.i * 5.3);
    dBar += `M${f(x + 12 * sc)} ${f(y + h - 13 * sc)}h${f((w - 24 * sc) * hp)}v${f(6 * sc)}h${f(-(w - 24 * sc) * hp)}Z`;
    dTeth += `M${f(p.x + jx)} ${f(y + h)}V${f(p.y - 4 * sc)}`;
    const lv = o.lvl ? o.lvl(p) : TAG_LV(p.i);
    const s_ = g > 0.4 && hash(st + p.i * 3.1) < g * 0.3 ? String(Math.floor(hash(st + p.i) * 999)) : `LV ${lv}`;
    if (sc > 0.16) txt += `<text x="${f(p.x + jx)}" y="${f(y + 27 * sc)}" font-size="${f(26 * sc)}">${s_}</text>`;
  }
  if (!dBody) return '';
  return S.path(dTeth, { fill: 'none', stroke: rim, 'stroke-width': 2.2, opacity: 0.8 }) + S.path(dBody, { fill: glass, 'fill-opacity': 0.82, stroke: '#020C16', 'stroke-width': 3 }) +
    S.path(dRim, { fill: 'none', stroke: rim, 'stroke-width': 1.6 }) + S.path(dBar, { fill: bar }) +
    (txt ? `<g font-family="Lilita One, sans-serif" fill="#F2FDFF" text-anchor="middle">${txt}</g>` : '');
}
// opaque plates slammed over faces: pts = [{x, y (face centre), r (half face width, screen px), i}], screen space. k(p) 0..1
function facePlates(pts, o = {}) {
  const t = o.t || 0, kOf = o.k || (() => 1), g = o.glitch || 0;
  let dB = '', dR = '', dR2 = '', dBar = '', dFl = '', txt = '';
  const st = Math.floor(t * 14);
  for (const p of pts) {
    const k = kOf(p);
    if (k <= 0) continue;
    const r = p.r, sc = lerp(1.7, 1, ease.out(clamp(k * 1.4, 0, 1)));
    const w = r * 2.5 * sc, h = r * 1.5 * sc;
    const jx = g > 0 ? (hash(st + p.i * 2.3) - 0.5) * r * 0.5 * g : 0;
    const x = p.x - w / 2 + jx, y = p.y - h / 2 + (hash(p.i * 4.1) - 0.5) * r * 0.2;
    dB += chamD(x, y, w, h, r * 0.22);
    if (p.i % 3 === 0) dR2 += chamD(x + 4, y + 4, w - 8, h - 8, r * 0.18); else dR += chamD(x + 4, y + 4, w - 8, h - 8, r * 0.18);
    const hp = 0.15 + 0.85 * hash(p.i * 7.1);
    dBar += `M${f(x + r * 0.3)} ${f(y + h * 0.7)}h${f((w - r * 0.6) * hp)}v${f(r * 0.16)}h${f(-(w - r * 0.6) * hp)}Z`;
    if (k < 0.7) dFl += chamD(x, y, w, h, r * 0.22);
    const lv = p.lv !== undefined ? p.lv : TAG_LV(p.i + 17);
    const label = g > 0.3 && hash(st + p.i) < g * 0.25 ? `${Math.floor(hash(st * 2 + p.i) * 9999)}` : `LV ${lv}`;
    if (r * sc > 9) txt += `<text x="${f(x + w / 2)}" y="${f(y + h * 0.56)}" font-size="${f(r * 0.66 * sc)}">${label}</text>`;
  }
  if (!dB) return '';
  return S.path(dB, { fill: '#061624', 'fill-opacity': 0.96, stroke: '#020C16', 'stroke-width': 4 }) + (dR ? S.path(dR, { fill: 'none', stroke: '#3BE8FF', 'stroke-width': 2.5 }) : '') +
    (dR2 ? S.path(dR2, { fill: 'none', stroke: '#FF4D66', 'stroke-width': 2.5 }) : '') + S.path(dBar, { fill: '#3DFF8F' }) +
    (txt ? `<g font-family="Lilita One, sans-serif" fill="#FFFFFF" text-anchor="middle" stroke="#020C16" stroke-width="3" paint-order="stroke">${txt}</g>` : '') +
    (dFl ? S.path(dFl, { fill: '#FFFFFF', opacity: 0.55 }) : '');
}
// crowd people -> screen head tops / face centres (world fill people from rowsPeople or the set's own rows)
function headsOf(people, cam) {
  return people.map((p) => {
    const hs = FS.toScreen(cam, { x: p.x, y: p.y - 754 * p.s, k: 1 }), fc = FS.toScreen(cam, { x: p.x, y: p.y - 651 * p.s, k: 1 });
    return { x: hs.x, y: hs.y, s: p.s * hs.z, fx: fc.x, fy: fc.y, r: 100 * p.s * hs.z, i: p.i + Math.round(p.row || p.y) * 31, back: p.back, kid: p.kid };
  }).filter((h) => h.x > -100 && h.x < 2020 && h.y > -120 && h.y < 1150);
}
// the set's own fill people (crowd rows behind the stand lines + packed rows) for a cam
function setPeople(cam, o = {}, which = 'all') {
  return FS.crowdHeads(cam, o, which).map((h) => ({ x: h.x, y: h.y, s: h.s, fx: h.x, fy: h.y + 103 * h.s, r: 100 * h.s, i: h.i + Math.round(h.row) * 31, kid: h.kid }));
}

// ================================================================ HUD bits of this scene
const clockAt = (t, t0, t1) => { const m = Math.round(lerp(12, 49, clamp((t - t0) / (t1 - t0), 0, 1))); return `4:${String(m).padStart(2, '0')} PM`; };
// PARTY panel (top-left under the logo): MOM / GRANDPA / MAX / YOU; lost 0..1 turns MAX red: SIGNAL LOST
function partyPanel(o = {}) {
  const { k = 1, t = 0, lost = 0, glitch = 0, x = 40, y = 128, s = 0.9 } = o;
  if (k <= 0) return '';
  const th = H.theme('cyan');
  const kk = ease.outBack(clamp(k, 0, 1));
  const rows = [['MOM', 38, 0.22, '#FFD21F'], ['GRANDPA', 87, 0.9, '#3DFF8F'], ['MAX', 5, 1, '#FF5ACD'], ['YOU', '??', 0.7, '#3DFF8F']];
  const Wd = 300, rh = 40, Hd = 56 + rows.length * rh;
  let g = H.panel(0, 0, Wd, Hd, 'cyan', { c: 12, br: 14, shadow: false });
  const n = lost > 0.5 ? 3 : 4;
  g += H.TF('PARTY', 20, 34, 18, th.label, { 'text-anchor': 'start', 'letter-spacing': 3 }) + H.TL(`${n}/4`, Wd - 22, 36, 26, lost > 0.5 ? '#FF4D66' : th.text, { 'text-anchor': 'end' });
  rows.forEach(([nm, lv, hp, col], i) => {
    const ry = 56 + i * rh, isMax = nm === 'MAX', red = isMax && lost > 0;
    const blink = red && Math.floor(t * 5) % 2 === 0;
    let r = S.path(H.para(18, ry + 4, 40, 22, 6), { fill: red ? '#FF3355' : th.badge, stroke: th.edge, 'stroke-width': 2.5 }) + H.TL(String(lv), 38, ry + 22, 17, th.badgeTx);
    const label = red ? (lost > 0.5 ? (glitch > 0 && Math.floor(t * 9) % 3 === 0 ? 'M@X ?#!' : 'SIGNAL LOST') : nm) : nm;
    r += H.TL(label, 68, ry + 23, 22, red ? (blink ? '#FF4D66' : '#FFB3C0') : th.text, { 'text-anchor': 'start' });
    r += H.segBar(196, ry + 9, 84, 12, red ? 0.02 : hp, red ? '#FF3355' : col, { th, t, cell: 12, blink: red });
    g += r;
  });
  if (lost > 0 && lost < 1) g += S.rect(14, 56 + 2 * rh, Wd - 28, rh, 6, { fill: '#FF3355', opacity: f(0.5 * (1 - lost)) });
  const out = S.g(g, `translate(${f(x)} ${f(y)}) scale(${f(s * kk)})`, k < 1 ? { opacity: f(clamp(k * 2, 0, 1)) } : {});
  return glitch > 0 ? H.glitchWrap(out, t, glitch, 7, 8) : out;
}
// NEW AREA banner (game zone title): "◆ NEW AREA DISCOVERED ◆ / TOWN FAIR / SATURDAY · 4:12 PM"
function areaBanner(o = {}) {
  const { k = 0, out = 0, t = 0, x = 960, y = 300, s = 1 } = o;
  if (k <= 0 || out >= 1) return '';
  const th = H.theme('gold');
  const uf = H.unfold(seg(k, 0, 0.6));
  const W_ = 780, H_ = 190;
  let g = '';
  if (uf.line > 0.01) g += S.rect(-W_ / 2 * uf.sx, -2, W_ * uf.sx, 4, 2, { fill: '#FFF1B8', opacity: f(uf.line) });
  if (uf.sy > 0.02) {
    let p = H.panel(-W_ / 2, -H_ / 2, W_, H_, 'gold', { c: 22, br: 26 });
    const tk = seg(k, 0.35, 1);
    p += H.TF('◆  NEW AREA DISCOVERED  ◆', 0, -H_ / 2 + 46, 24, th.label, { 'letter-spacing': 5, opacity: f(seg(k, 0.3, 0.6)) });
    const title = 'TOWN FAIR', n = Math.round(title.length * clamp(tk * 1.4, 0, 1));
    p += H.TL(title.slice(0, n), 0, 42, 92, '#FFF8E6', { 'letter-spacing': 6, stroke: '#120A00', 'stroke-width': 10, 'paint-order': 'stroke' });
    p += H.TF('SATURDAY  ·  RESIDENTS: 3,000+', 0, H_ / 2 - 22, 22, '#FFD07A', { 'letter-spacing': 3, opacity: f(seg(k, 0.7, 1)) });
    p += H.sheen(-W_ / 2, -H_ / 2, W_, H_, t);
    g += S.g(p, `scale(${f(uf.sx)} ${f(uf.sy)})`);
  }
  const op = 1 - ease.in(clamp(out, 0, 1));
  return S.g(g, `translate(${f(x)} ${f(y - 40 * ease.in(out))}) scale(${f(s)})`, op < 1 ? { opacity: f(op) } : {});
}
// the JOURNAL card: a snapshot (svg drawn at screen coords inside a 1920x1080 frame) shrunk into a polaroid with a caption
// k 0..1 = freeze/flash -> frame grows in; fly 0..1 = shrinks + flies to the HUD journal slot (top-left)
function journalCard(inner, o = {}) {
  const { k = 1, fly = 0, t = 0, cx = 960, cy = 520 } = o;
  if (k <= 0) return '';
  const id = S.uid('s08jc');
  const fw = 1920 * 0.52, fh = 1080 * 0.52;
  const kk = ease.outBack(clamp(k, 0, 1)), fu = ease.inOut(clamp(fly, 0, 1));
  const sc = lerp(1 / 0.52, 1, kk) * lerp(1, 0.16, fu);
  const x = lerp(cx, 120, fu), y = lerp(cy, 222, fu), rot = lerp(lerp(0, -4, kk), -8, fu);
  let g = S.rect(-fw / 2 - 26 + 10, -fh / 2 - 26 + 14, fw + 52, fh + 120, 12, { fill: '#000', opacity: 0.3 });
  g += S.rect(-fw / 2 - 26, -fh / 2 - 26, fw + 52, fh + 120, 12, ol('#FFFDF4', 7));
  g += S.clipDef(id, S.rect(-fw / 2, -fh / 2, fw, fh, 4)) + S.g(S.g(inner, `translate(${f(-fw / 2)} ${f(-fh / 2)}) scale(0.52)`), null, { 'clip-path': `url(#${id})` });
  g += S.rect(-fw / 2, -fh / 2, fw, fh, 4, { fill: 'none', stroke: '#151515', 'stroke-width': 4 });
  g += K.T('MAX WANTS TO GO UP', -20, fh / 2 + 70, 54, '#2A2246');
  g += S.path(`M${f(fw / 2 - 40)} ${f(fh / 2 + 76)} l0 -56 l-22 26 M${f(fw / 2 - 40)} ${f(fh / 2 + 20)} l22 26`, ln(9, '#E8453C'));
  // a red pin
  g += S.circle(0, -fh / 2 - 30, 20, ol('#E8453C', 5)) + S.circle(-6, -fh / 2 - 36, 6, { fill: '#FFB3B3' });
  // the tag
  if (fu < 0.6) g += S.g(H.panel(-170, -fh / 2 - 96, 340, 50, 'gold', { c: 10, br: 12, shadow: false }) + H.TF('◆ JOURNAL UPDATED', 0, -fh / 2 - 63, 22, '#FFD98A', { 'letter-spacing': 2 }), null, { opacity: f(seg(k, 0.4, 0.8) * (1 - seg(fly, 0, 0.6))) });
  return S.g(g, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(sc)})`);
}
// the journal slot in the HUD (top-left under the logo) once the card is in: a tiny photo + "!" pulse
function journalSlot(o = {}) {
  const { k = 1, t = 0, x = 120, y = 222, pulse = 0 } = o;
  if (k <= 0) return '';
  let g = S.rect(-62, -44, 124, 98, 6, ol('#FFFDF4', 4)) + S.rect(-52, -36, 104, 62, 2, { fill: '#5DBB4A', stroke: '#151515', 'stroke-width': 3 });
  g += S.path('M0 22 L0 -26 M-16 -10 L0 -28 L16 -10', ln(7, '#FFFFFF')) + K.TF('MAX: UP', 0, 46, 13, '#2A2246');
  if (pulse > 0) g += S.circle(0, 4, 70 + 50 * pulse, { fill: 'none', stroke: '#FFD21F', 'stroke-width': f(8 * (1 - pulse)), opacity: f(1 - pulse) });
  return S.g(g, `translate(${f(x)} ${f(y)}) rotate(-8) scale(${f(ease.outBack(clamp(k, 0, 1)))})`);
}
// SEARCH bar: "SEARCH: GREEN DINOSAUR" types in, then "2,413 MATCHES" (red, blinking)
function searchBar(o = {}) {
  const { k = 0, t = 0, type = 1, res = 0, x = 960, y = 150, glitch = 0 } = o;
  if (k <= 0) return '';
  const q = 'GREEN DINOSAUR', n = Math.round(q.length * clamp(type, 0, 1));
  const W_ = 720, H_ = 84;
  let g = H.panel(-W_ / 2, -H_ / 2, W_, H_, 'cyan', { c: 14, br: 16 });
  g += S.circle(-W_ / 2 + 48, -4, 17, { fill: 'none', stroke: '#3BE8FF', 'stroke-width': 5 }) + S.path(`M${-W_ / 2 + 60} 8 l14 14`, ln(6, '#3BE8FF'));
  g += H.TF('SEARCH:', -W_ / 2 + 84, 12, 24, '#8BDCEB', { 'text-anchor': 'start', 'letter-spacing': 2 });
  g += H.TL(q.slice(0, n) + (type < 1 && Math.floor(t * 6) % 2 ? '|' : ''), -W_ / 2 + 210, 15, 38, '#F2FDFF', { 'text-anchor': 'start' });
  if (res > 0) {
    const cnt = Math.round(2413 * ease.out(clamp(res * 1.6, 0, 1)));
    const blink = Math.floor(t * 5) % 2 === 0;
    let r = H.panel(-W_ / 2 + 120, H_ / 2 + 8, W_ - 240, 56, 'boss', { c: 10, br: 12, shadow: false });
    r += H.TL(`${cnt.toLocaleString('en-US')} MATCHES`, 0, H_ / 2 + 48, 34, blink ? '#FF4D66' : '#FFF2F4');
    g += S.g(r, null, { opacity: f(clamp(res * 3, 0, 1)) });
  }
  const out = S.g(g, `translate(${f(x)} ${f(y)}) scale(${f(ease.outBack(clamp(k, 0, 1)))})`);
  return glitch > 0 ? H.glitchWrap(out, t, glitch, 5, 10) : out;
}
// the hero's own hand (white R6 hand + red jacket cuff) reaching in from screen-left, grabbing a shoulder at (x, y)
function heroHand(x, y, s = 1, rot = -10, grip = 0) {
  let g = S.rect(-520, -46, 420, 92, 14, ol('#D8262E', 6)) + S.rect(-150, -50, 60, 100, 10, ol('#B01D24', 6));
  g += S.rect(-100, -44, 120, 88, 26, ol('#FFFFFF', 6)) + S.path(`M-20 ${f(-30 + 10 * grip)} q28 6 30 ${f(28 - 10 * grip)}`, ln(5, '#C9CBD8'));
  return S.g(g, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}

module.exports = {
  times, camAt, camLerp, shook, toScr, view, roll, whip, flashAt, focusLines, dark,
  SPF, sAt, row, rowsDraw, rowsPeople, fairWith, headTags, facePlates, headsOf, setPeople, chamD,
  clockAt, partyPanel, areaBanner, journalCard, journalSlot, searchBar, heroHand,
};
