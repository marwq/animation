// Contact sheet of the TOWN FAIR sets (scenes/sets_fair.js) -> concept/sets_fair.png
// Usage:
//   node tools/sheet_fair.js                      all tiles -> concept/sets_fair.png (3 columns, 640x360 tiles)
//   node tools/sheet_fair.js --only fair,bench    just those tiles (by key prefix)
//   node tools/sheet_fair.js --full DIR           also write every tile as a full 1920x1080 PNG into DIR
//   node tools/sheet_fair.js --noref              no hero / anchor marks (default: the hero YOU stands on stand lines at the set's s)
//   node tools/sheet_fair.js --out FILE --t 2.3   output file / time
// Prints per tile: elements, JS build ms and browser render ms of the SET ALONE (all layers incl. the crowd, no hero, minus an
// empty-frame baseline; median of 5) — the budget is < 90 ms build + render.
// Max / Grandpa are drawn from rig/cast.js when they exist there; otherwise the hero stands in (smaller for Max).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const S = require('../rig/svg');
const { openRenderer } = require('./render');
const X = require('../scenes/sets_fair');

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const ONLY = arg('--only') ? arg('--only').split(',') : null;
const FULL = arg('--full');
const REF = !args.includes('--noref');
const OUT = arg('--out') || path.join(__dirname, '..', 'concept', 'sets_fair.png');
const T0 = Number(arg('--t') || 2.3);

// the hero (YOU) for scale: s .5 ~ 475 px tall (r6 default construction + his colours)
const R6 = require('../rig/r6');
const hero = R6.makeDraw(R6.makeDesign({ col: { jacket: '#D8262E', jacketLine: '#B01D24', shirt: '#F2D04A', shirtShade: '#D9B73A', pants: '#1F3B2A', pantsShade: '#162C1F' } }));
const CAST = (() => { try { return require('../rig/cast').draw || {}; } catch (e) { return {}; } })();
const maxDraw = (p) => (CAST.max ? CAST.max(p) : hero({ ...p, s: p.s * 0.66 }));
const gpaDraw = (p) => (CAST.grandpa ? CAST.grandpa(p) : hero({ ...p, s: p.s * 1.08 }));
let refOn = true;
const on = () => REF && refOn;
const line = (y, col = '#FF2E63', x0 = -6000, x1 = 9000) => `<path d="M${x0} ${y} L${x1} ${y}" stroke="${col}" stroke-width="3" stroke-dasharray="14 10" opacity="0.8"/>`;
const H = (x, y, s, pose = {}) => (on() ? hero({ x, y, s, shade: true, shadow: true, ...pose }) : '');
const MAX = (x, y, s, pose = {}) => (on() ? maxDraw({ x, y, s, shade: true, shadow: true, ...pose }) : '');
const GPA = (x, y, s, pose = {}) => (on() ? gpaDraw({ x, y, s, shade: true, shadow: true, ...pose }) : '');
const mark = (x, y, col = '#FF2E63', r = 9) => (on() ? `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${col}" stroke-width="4"/><path d="M${x - 16} ${y} h32 M${x} ${y - 16} v32" stroke="${col}" stroke-width="3"/>` : '');
const bgCard = (c1 = '#2A2246', c2 = '#3E3366') => `<defs><linearGradient id="sheetBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect x="0" y="0" width="1920" height="1080" fill="url(#sheetBg)"/>`;
const V = (cam, svg, k = 1) => (svg ? `<g transform="${X.camTf(cam, k)}">${svg}</g>` : '');
// camera set with characters: behind = before L.front, floor = after L.front (world space, k 1)
const LC = (fn, t, cam, o, behind = '', floor = '') => { const l = fn.layers(t, cam, o); return l.bg + l.mid + V(cam, behind) + l.front + V(cam, floor) + l.crowd + l.fg + l.light; };
const quad4 = (svgs) => svgs.map((v, i) => `<svg x="${(i % 2) * 960}" y="${Math.floor(i / 2) * 540}" width="960" height="540" viewBox="0 0 1920 1080">${v}</svg>`).join('') + '<path d="M960 0 V1080 M0 540 H1920" stroke="#000" stroke-width="6"/>';
const SP = X.SPOTS;
const at = (cam, a) => X.toScreen(cam, a);
const markA = (cam, a, col) => { const p = at(cam, a); return mark(Math.round(p.x), Math.round(p.y), col); };
// hero on stand lines (a few copies) + line marks
const onLines = (lines, every = 700, x0 = null, pose = {}) => (on() ? lines.map((l, i) => { let s = line(l.y, i % 2 ? '#FFE14D' : '#FF2E63'); for (let x = (x0 ?? l.x0) + 120 + (i * 230) % every; x < l.x1; x += every) s += hero({ x, y: l.y, s: l.s, shade: true, shadow: true, ...pose }); return s; }).join('') : '');
const climbMarks = (cam, fnAt, n = 12) => { if (!on()) return ''; let d = ''; for (let i = 0; i <= n; i++) { const p = at(cam, fnAt(i / n)); d += `${i ? 'L' : 'M'}${Math.round(p.x)} ${Math.round(p.y)}`; } return `<path d="${d}" fill="none" stroke="#3DFF9A" stroke-width="5" stroke-dasharray="12 8"/>`; };

const TILES = [];
const tile = (key, label, fn) => TILES.push([key, label, fn]);

// ---------------------------------------------------------------- FAIR
{
  const Z = SP.fair, c = Z.cams;
  tile('fair', 'fair · dusk · cams.main (booth, balloon cart, Ferris wheel, cotton candy) · stand lines', (t) => LC(X.fair, t, c.main, {}, H(Z.booth.vendor.x, Z.booth.vendor.y, Z.booth.vendor.s) + H(Z.cotton.vendor.x, Z.cotton.vendor.y, Z.cotton.vendor.s), onLines(Z.lines.slice(1, 3), 900, 0)));
  tile('fair_wide', 'fair · dusk · cams.wide · crowd .8', (t) => LC(X.fair, t, c.wide, { crowd: 0.8 }, '', H(1000, 960, 0.4) + H(2400, 960, 0.4)));
  tile('fair_crowd', 'fair · cams.crowd · crowd 1 + packed 1 + near (sea of heads) · crowdHeads marks', (t) => LC(X.fair, t, c.crowd, { crowd: 1, packed: 1, near: 1 }, '', H(1300, 960, 0.4, { face: 'scared' })) + X.crowdHeads(c.crowd, { crowd: 1, packed: 1 }, 'all').filter((_, i) => i % 9 === 0).map((h) => mark(h.x, h.y, '#3DFF9A', 6)).join(''));
  tile('fair_over', 'fair · cams.over · packed 1 · cheer .4 (the camera flies over the crowd)', (t) => LC(X.fair, t, c.over, { crowd: 1, packed: 1, cheer: 0.4 }));
  tile('fair_bench', 'fair · cams.bench · SPOTS.fair.bench.seats (SIT) + lamp', (t) => LC(X.fair, t, c.bench, {}, '', H(Z.bench.seats[0].x, Z.bench.seats[0].y, Z.bench.seats[0].s, X.SIT) + GPA(Z.bench.seats[1].x, Z.bench.seats[1].y, Z.bench.seats[1].s, X.SIT)) + markA(c.bench, Z.bench.lamp, '#FFE14D'));
  tile('fair_cotton', 'fair · cams.cotton · vendor behind the counter (before L.front) + hero at .front', (t) => LC(X.fair, t, c.cotton, {}, H(Z.cotton.vendor.x, Z.cotton.vendor.y, Z.cotton.vendor.s, { face: 'happy' }), H(Z.cotton.front.x, Z.cotton.front.y, Z.cotton.front.s, { turn: -0.5 }) + MAX(Z.cotton.front.x + 160, 980, 0.42)));
  tile('fair_teacups', 'fair · cams.teacups · gate + front spots (riders in the cups are drawn by the set)', (t) => LC(X.fair, t, c.teacups, {}, '', H(Z.teacups.gate.x, Z.teacups.gate.y, Z.teacups.gate.s) + H(Z.teacups.front.x + 300, Z.teacups.front.y, Z.teacups.front.s)));
  tile('fair_ferris', 'fair · cams.ferris · "I wanna go UP!" (ferris.stand + top mark, k .6)', (t) => LC(X.fair, t, c.ferris, {}, '', H(Z.ferris.stand.x - 200, Z.ferris.stand.y, Z.ferris.stand.s, { armR: 160, face: 'excited' }) + MAX(Z.ferris.stand.x + 120, Z.ferris.stand.y, Z.ferris.stand.s, { armL: 170 })) + markA(c.ferris, Z.ferris.top, '#FFE14D'));
  tile('fair_dino', 'fair · cams.dino · wobble .5 · dino.seat(t) (Max) + climb path + climbAt(.45)', (t) => { const s = Z.dino.seat(t), cl = Z.dino.climbAt(0.45, t); return LC(X.fair, t, c.dino, { crowd: 0.8 }, '', MAX(s.x, s.y + 306 * s.s * 0.66, s.s, { ...X.SIT, rot: s.rot }) + H(cl.x, cl.y, cl.s, { view: 'side', lean: -10 })) + climbMarks(c.dino, (u) => Z.dino.climbAt(u, t)) + markA(c.dino, s, '#FFE14D'); });
  tile('fair_dinoFar', 'fair · cams.dinoFar · "THERE! On top of the dinosaur!" (dusk, crowd .9)', (t) => { const s = Z.dino.seat(t); return LC(X.fair, t, c.dinoFar, { crowd: 0.9 }, '', MAX(s.x, s.y + 306 * s.s * 0.66, s.s, { ...X.SIT, armL: 160, armR: 160 }) + H(3900, 960, 0.4, { view: 'back' })); });
  tile('fair_golden', 'fair · golden · cams.run[1] · canopy lights · crowd .7 (HUD-off reunion light)', (t) => LC(X.fair, t, c.run[1], { time: 'golden', canopy: true, crowd: 0.7 }, '', H(1700, 960, 0.4, { view: 'side', flip: true })));
  tile('fair_arch', 'fair · afternoon · cams.arch (TOWN FAIR arch + ticket booth)', (t) => LC(X.fair, t, c.arch, { time: 'afternoon' }, '', H(Z.arch.under.x, Z.arch.under.y, Z.arch.under.s) + H(-2000, 960, 0.4) + MAX(-1900, 960, 0.4)));
  tile('fair_quiet', 'fair · quiet 0 / quiet 1 (HUD-off silence: crowd desaturates) · golden quiet .5 / afternoon', (t) => quad4([LC(X.fair, t, c.crowd, { crowd: 1, packed: 0.6 }), LC(X.fair, t, c.crowd, { crowd: 1, packed: 0.6, quiet: 1 }), LC(X.fair, t, c.crowd, { crowd: 1, packed: 0.6, quiet: 0.5, time: 'golden' }), LC(X.fair, t, c.main, { time: 'afternoon', crowd: 0.5 })]));
  tile('fair_head', 'fair · golden · cams.dinoHead · hug(t) + seat(t) on the head', (t) => { const s = Z.dino.seat(t), hg = Z.dino.hug(t); return LC(X.fair, t, c.dinoHead, { time: 'golden', cheer: 1 }, '', MAX(s.x, s.y + 306 * s.s * 0.66, s.s, { ...X.SIT, rot: s.rot }) + H(hg.x, hg.y, hg.s, { rot: hg.rot, armL: 120 })); });
}
// ---------------------------------------------------------------- BENCH
{
  const Z = SP.fairBench, c = Z.cams;
  const two = (t, o, cam, pose = {}) => X.fairBench.compose(t, o, '', H(Z.hero.x, Z.hero.y, Z.hero.s, { ...X.SIT, turn: 0.35, ...pose }) + GPA(Z.grandpa.x, Z.grandpa.y, Z.grandpa.s, { ...X.SIT, turn: -0.35 }), cam);
  tile('bench', 'fairBench · dusk · SPOTS.fairBench.hero / .grandpa (SIT, hips on the seat) + lamp', (t) => two(t, {}, c.wide) + markA(c.wide, Z.lamp, '#FFE14D'));
  tile('bench_cams', 'fairBench · cams.two (golden) / .hero / .grandpa / .lamp (quiet 1)', (t) => quad4([two(t, { time: 'golden', balloon: true }, c.two), two(t, {}, c.hero, { face: 'sad' }), two(t, {}, c.grandpa), two(t, { quiet: 1 }, c.lamp)]));
}
// ---------------------------------------------------------------- DINO TOP
{
  const Z = SP.dinoTop, c = Z.cams;
  const scene = (t, o, cam, u = 0.55) => { const s = Z.seat(t, o.wobble ?? 0.5), cl = Z.climbAt(u, t, o.wobble ?? 0.5); return LC(X.dinoTop, t, cam, o, '', MAX(s.x, s.y + 306 * s.s * 0.66, s.s, { ...X.SIT, rot: s.rot, armL: 150, armR: 150 }) + (u >= 0 ? H(cl.x, cl.y, cl.s, { view: 'side', lean: -12, armL: 140, armR: 120 }) : '')) + climbMarks(cam, (k) => Z.climbAt(k, t, o.wobble ?? 0.5)); };
  tile('dinoTop', 'dinoTop · golden · cams.close · seat(t) (Max) + climbAt(.55) + climb path · crowd cheering below', (t) => scene(t, {}, c.close));
  tile('dinoTop_cams', 'dinoTop · cams.wide (dusk) / .hug (hug(t)) / .max / .below (wobble 1)', (t) => quad4([scene(t, { time: 'dusk' }, c.wide, 0.2), (() => { const s = Z.seat(t), hg = Z.hug(t); return LC(X.dinoTop, t, c.hug, { confetti: 1 }, '', MAX(s.x, s.y + 306 * s.s * 0.66, s.s, { ...X.SIT, rot: s.rot }) + H(hg.x, hg.y, hg.s, { rot: hg.rot, armL: 120, face: 'joy' })); })(), scene(t, {}, c.max, -1), scene(t, { wobble: 1 }, c.below, 0.05)]));
}
// ---------------------------------------------------------------- ENTRANCE
{
  const Z = SP.fairEntrance, c = Z.cams;
  tile('entrance', 'fairEntrance · afternoon · cams.wide · family under the arch (lines 960 / 1010)', (t) => LC(X.fairEntrance, t, c.wide, {}, '', H(Z.under.x - 120, Z.under.y, Z.under.s) + MAX(Z.under.x + 60, Z.under.y, Z.under.s) + GPA(Z.under.x + 260, Z.under.y, Z.under.s) + H(Z.walkIn.from.x - 500, 1060, Z.lines[3].s, { view: 'back' })) + markA(c.wide, Z.arch.sign, '#FFE14D'));
  tile('entrance_cams', 'fairEntrance · dusk cams.family / golden .sign / .low / afternoon walkIn', (t) => quad4([LC(X.fairEntrance, t, c.family, { time: 'dusk' }, '', H(Z.under.x - 100, Z.under.y, Z.under.s) + MAX(Z.under.x + 80, Z.under.y, Z.under.s)), LC(X.fairEntrance, t, c.sign, { time: 'golden' }), LC(X.fairEntrance, t, c.low, { time: 'dusk', crowd: 1 }), LC(X.fairEntrance, t, c.wide, {}, '', H(Z.walkIn.from.x, Z.walkIn.from.y, Z.walkIn.from.s, { view: 'back' }) + H(Z.walkIn.to.x, Z.walkIn.to.y, Z.walkIn.to.s, { view: 'back' }))]));
}
// ---------------------------------------------------------------- PROPS + perf worst cases
tile('props', 'props · dinoBalloon, balloon, cottonCandy, bench, lampPost, tent, stall, teacup, Ferris wheel, inflatableDino (roar)', (t) => {
  const tn = X.tone();
  let s = bgCard('#9FD8FF', '#FFE8C8');
  s += X.dinoBalloon(150, 260, 0.6, t) + X.balloon(330, 240, 0.6, '#FF4D6D', t) + X.balloon(440, 260, 0.6, '#4A9CFF', t + 1) + X.cottonCandy(560, 330, 0.8);
  s += `<g transform="translate(820 470) scale(0.3)">${X.bench(tn, 20)}</g><g transform="translate(1040 470) scale(0.2)">${X.lampPost(tn, 30, 1)}</g>`;
  s += `<g transform="translate(1260 470) scale(0.22)">${X.tent(1350, 1200, '#EE3B4C', '#FFFDF6', tn, 27, 0, t)}</g><g transform="translate(1560 470) scale(0.22)">${X.stall(1150, 'POPCORN', '#EE3B4C', '#FFFDF6', tn, 27, 0)}</g>`;
  s += `<g transform="translate(1800 460) scale(0.3)">${X.teacup(0, 0, 1, ['#FF8AC0', '#E8609E'], 0.4, tn, 20, t, 1, true)}</g>`;
  s += `<g transform="translate(330 760) scale(0.55)">${X.ferrisWheel(400, tn, 7, 0, t)}</g>`;
  s += `<g transform="translate(1300 1050) scale(0.62)">${X.inflatableDino(t, { tone: tn, lw: 10, face: 'roar', wobble: 1 })}</g>`;
  return s;
});
tile('perf_worst', 'perf · fair dusk · cams.wide · crowd 1 + packed 1 + near + canopy + cheer 1', (t) => LC(X.fair, t, SP.fair.cams.wide, { crowd: 1, packed: 1, near: 1, canopy: true, cheer: 1 }));
tile('perf_dino', 'perf · fair dusk · cams.dinoFar · crowd 1 · cheer 1 · wobble 1', (t) => LC(X.fair, t, SP.fair.cams.dinoFar, { crowd: 1, cheer: 1, wobble: 1, packed: 0.5 }));

(async () => {
  const tiles = TILES.filter(([k]) => !ONLY || ONLY.some((o) => k.startsWith(o)));
  const r = await openRenderer(1920, 1080, { staticDefs: X.DEFS + require('../rig/style').DEFS });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sfsheet-'));
  if (FULL) fs.mkdirSync(FULL, { recursive: true });
  const timeIt = async (svg) => { const ts = []; for (let i = 0; i < 5; i++) { const b = Date.now(); await r.render(svg, 'jpeg'); ts.push(Date.now() - b); } return ts.sort((x, y) => x - y)[2]; };
  const base = await timeIt('<rect width="1920" height="1080" fill="#888"/>');
  const files = [];
  console.log('tile'.padEnd(18), 'elems'.padStart(6), 'js ms'.padStart(7), 'svg ms'.padStart(8), 'total'.padStart(7));
  for (const [key, label, fn] of tiles) {
    let svg;
    try {
      refOn = false;
      const js = [];
      for (let i = 0; i < 3; i++) { S.resetIds(); const a = process.hrtime.bigint(); svg = fn(T0); js.push(Number(process.hrtime.bigint() - a) / 1e6); }
      js.sort((a, b) => a - b);
      const n = (svg.match(/<[a-zA-Z]/g) || []).length;
      const rt = Math.max(0, Math.round((await timeIt(svg)) - base));
      console.log(key.padEnd(18), String(n).padStart(6), js[1].toFixed(1).padStart(7), String(rt).padStart(8), String(Math.round(js[1] + rt)).padStart(7));
      refOn = true;
      S.resetIds();
      svg = fn(T0);
    } catch (e) {
      console.log(key.padEnd(18), 'ERROR', e.stack.split('\n').slice(0, 3).join(' | '));
      svg = bgCard('#600', '#300') + `<text x="960" y="540" font-size="60" fill="#fff" text-anchor="middle">${key}: ${String(e.message).slice(0, 60).replace(/[<&]/g, '')}</text>`;
    }
    if (FULL) fs.writeFileSync(path.join(FULL, key + '.png'), await r.render(svg));
    const lab = `<rect x="0" y="0" width="1920" height="86" fill="#000" opacity="0.62"/><text x="24" y="62" font-family="Fredoka" font-weight="700" font-size="50" fill="#FFE14D">${label.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`;
    const p = path.join(tmp, `t${String(files.length).padStart(3, '0')}.png`);
    fs.writeFileSync(p, await r.render(svg + lab));
    files.push(p);
  }
  await r.close();
  const cols = Math.min(3, files.length), rows = Math.ceil(files.length / cols);
  const ff = ['-v', 'error', '-y'];
  for (const p of files) ff.push('-i', p);
  let fc = files.map((_, i) => `[${i}:v]scale=640:360[s${i}];`).join('');
  const pad = rows * cols - files.length;
  for (let i = 0; i < pad; i++) { ff.push('-f', 'lavfi', '-i', 'color=c=black:s=640x360'); fc += `[${files.length + i}:v]null[s${files.length + i}];`; }
  const n = rows * cols;
  if (n === 1) fc += '[s0]null';
  else fc += Array.from({ length: n }, (_, i) => `[s${i}]`).join('') + `xstack=inputs=${n}:layout=` + Array.from({ length: n }, (_, i) => `${(i % cols) * 640}_${Math.floor(i / cols) * 360}`).join('|');
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  execFileSync('ffmpeg', [...ff, '-filter_complex', fc, '-frames:v', '1', OUT]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('wrote', OUT);
})().catch((e) => { console.error(e); process.exit(1); });
