// Contact sheet of the shared HOME + WORLD sets (scenes/sets.js) -> concept/sets_home.png
// Usage:
//   node tools/sets_sheet.js                      all tiles -> concept/sets_home.png (3 columns, 640x360 tiles)
//   node tools/sets_sheet.js --only attic,porch   just those tiles (by key prefix)
//   node tools/sets_sheet.js --full DIR           also write every tile as a full 1920x1080 PNG into DIR
//   node tools/sets_sheet.js --ref                overlay a rig character at each set's FLOOR line (scale check)
// Prints per-tile element counts, JS build time and browser render time (minus an empty-frame baseline).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const S = require('../rig/svg');
const { openRenderer } = require('./render');
const X = require('../scenes/sets');

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const ONLY = arg('--only') ? arg('--only').split(',') : null;
const FULL = arg('--full');
const REF = args.includes('--ref');
const OUT = arg('--out') || path.join(__dirname, '..', 'concept', 'sets_home.png');
const T0 = Number(arg('--t') || 2.3);

const bgCard = (c1 = '#2A2246', c2 = '#3E3366') => `<defs><linearGradient id="sheetBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect x="0" y="0" width="1920" height="1080" fill="url(#sheetBg)"/>`;
const popup = (w, h) => {
  // a stand-in for K.popup(...) so the sheet does not depend on kit.js
  const s = Math.min(w / 1100, h / 520);
  let o = `<rect x="-540" y="-250" width="1080" height="500" rx="30" fill="#E9EDF3" stroke="#151515" stroke-width="8"/><rect x="-540" y="-250" width="1080" height="80" rx="30" fill="#5A6478"/><rect x="-540" y="-200" width="1080" height="30" fill="#5A6478"/>`;
  o += `<text x="0" y="-196" font-family="Fredoka" font-weight="700" font-size="40" fill="#FFF" text-anchor="middle">SYSTEM</text>`;
  o += `<text x="0" y="-20" font-family="Fredoka" font-weight="700" font-size="58" fill="#2A3140" text-anchor="middle">Roblox will shut down</text><text x="0" y="60" font-family="Fredoka" font-weight="700" font-size="58" fill="#2A3140" text-anchor="middle">in 24 hours.</text><text x="0" y="160" font-family="Fredoka" font-weight="700" font-size="44" fill="#5A6478" text-anchor="middle">Thanks for playing! :)</text>`;
  return `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#3A4256"/><g transform="scale(${s.toFixed(4)})">${o}</g>`;
};

let refDraw = null;
if (REF) { try { const c = require('../rig/cast'); refDraw = c.draw.juno || c.draw.ty; } catch (e) { refDraw = null; } }
const ref = (x, y, s = 0.55) => (refDraw ? `<g opacity="0.85">${refDraw({ x, y, s, shade: false, shadow: true })}</g><path d="M0 ${y} L1920 ${y}" stroke="#FF2E63" stroke-width="3" stroke-dasharray="14 10"/>` : '');

const TILES = [
  ['attic', 'attic · day', (t) => X.attic(t, { juice: 3 }) + ref(960, X.FLOOR.attic)],
  ['attic_hatch', 'attic · hatch open, cat on keyboard, evening', (t) => { const L = X.attic.layers(t, { hatchOpen: 1, cat: 'keyboard', time: 'evening', screen: (w, h) => X.frameIn(X.bubbleIsland(t, {}), w, h) }); return L.bg + L.mid + ref(X.SPOTS.attic.hatch.x, X.SPOTS.attic.hatch.y + 260) + X.attic.hatchFront(t, { hatchOpen: 1 }) + L.fg + L.light; }],
  ['attic_night', 'attic · night (laptop glow), juice 9', (t) => X.attic(t, { night: true, juice: 9, screen: (w, h) => X.frameIn(X.bubbleIsland(t, { bites: 2 }), w, h) })],
  ['attic_lag', 'attic · night + lag 0.8', (t) => X.attic(t, { night: true, lag: 0.8, juice: 6, screen: (w, h) => X.frameIn(X.bubbleIsland(t, { grey: 0.6, bites: 4 }), w, h) })],
  ['atticStairs', 'atticStairs (ladder below the hatch)', (t) => X.atticStairs(t, {}) + ref(X.atticStairs.at(0.35).x, X.atticStairs.at(0.35).y)],
  ['laptop', 'laptop prop · screens via frameIn', (t) => bgCard() + X.laptop(560, 860, 1.6, (w, h) => X.frameIn(X.bubbleIsland(t, {}), w, h)) + X.laptop(1480, 820, 1.1, popup, { cat: true, t }) + X.cat(1480, 1040, 1, t, { pose: 'sit' })],
  ['bubbleIsland', 'bubbleIsland · visits 3 + avatar', (t) => X.bubbleIsland(t, { visits: 3 }) + X.bubbleIsland.avatar(X.bubbleIsland.ISLANDS[0].x - 40, X.bubbleIsland.ISLANDS[0].top, 1.1, t, {})],
  ['bubbleIsland_bites', 'bubbleIsland · bites 5, grey .5, freeze', (t) => X.bubbleIsland(t, { bites: 5, grey: 0.5, freeze: true })],
  ['bubbleIsland_pop', 'bubbleIsland · pop .45, visits 3,000,000', (t) => X.bubbleIsland(t, { pop: 0.45, visits: 3000000 })],
  ['bubbleIsland_void', 'bubbleIsland · void (secret underwater level)', (t) => X.bubbleIsland(t, { void: true }) + X.bubbleIsland.avatar(960, 640, 1.4, t, { who: 'dex', pose: 'fall' })],
  ['livingRoom', 'livingRoom · day', (t) => X.livingRoom(t, { time: 'day' }) + ref(760, X.FLOOR.livingRoom)],
  ['livingRoom_eve', 'livingRoom · evening, newspaper prop', (t) => { const L = X.livingRoom.layers(t, { time: 'evening' }); return L.bg + L.mid + ref(1060, X.SPOTS.livingRoom.seat.feet) + L.seat + X.newspaper(1060, 640, 1, t, {}) + L.fg + L.light; }],
  ['livingRoom_night', 'livingRoom · night, router frantic + wifiDown', (t) => X.livingRoom(t, { time: 'night', routerBlink: 1, wifiDown: true })],
  ['pipBox', 'pipBox (back+front) · ding', (t) => bgCard('#FFE9C2', '#F7C98A') + X.pipBox(560, 900, 1.6, t, {}) + X.pipBox(1400, 900, 1.6, t, { ding: 0.7, floor: 2 })],
  ['elevatorGame', 'elevatorGame · doors .7', (t) => X.elevatorGame(t, { doors: 0.7, wave: 1 })],
  ['elevatorGame_closed', 'elevatorGame · doors closed, grey .4', (t) => X.elevatorGame(t, { doors: 0, grey: 0.4, floor: 41, ding: 1 })],
  ['newsStudio', 'newsStudio · timer 24:00:00 + ticker', (t) => X.newsStudio(t, { timer: '24:00:00', ticker: 'ROBLOX TO SHUT DOWN IN 24 HOURS · KIDS PANIC · ONE KID FAINTED (TWICE)' }) + ref(X.SPOTS.newsStudio.anchor.x, X.SPOTS.newsStudio.anchor.y, X.SPOTS.newsStudio.anchor.s)],
  ['newsStudio_sunny', 'newsStudio · sunny', (t) => X.newsStudio(t, { sunny: true, ticker: 'THE GREAT AFK · WHOLE WORLD WENT OUTSIDE · ROBLOX IS STAYING' })],
  ['screens_a', 'screens: phone / laptop / tv / watch', (t) => bgCard() + X.screens('phone', 260, 520, 0.95, popup, t) + X.screens('laptop', 820, 470, 0.9, popup, t) + X.screens('tv', 1500, 430, 0.85, popup, t) + X.screens('watch', 330, 930, 0.7, popup, t)],
  ['screens_b', 'screens: microwave / register / planeSeat', (t) => bgCard('#33415E', '#22293D') + X.screens('microwave', 470, 330, 1.05, popup, t) + X.screens('register', 1400, 520, 1, popup, t) + X.screens('planeSeat', 560, 800, 0.8, popup, t)],
  ['screens_billboard', 'screens: billboard (city at dusk)', (t) => X.screens('billboard', 0, 0, 1, popup, t)],
  ['bathroom', 'bathroom · direct', (t) => { const L = X.bathroom.layers(t, {}); return L.bg + L.mid + ref(X.SPOTS.bathroom.mom.x, X.SPOTS.bathroom.mom.y) + L.fg; }],
  ['bathroom_window', 'bathroom · through the window', (t) => X.bathroom(t, { view: 'window' })],
  ['classroom', 'classroom · cancel .8', (t) => X.classroom(t, { cancel: 0.8 }) + ref(X.SPOTS.classroom.teacher.x, X.SPOTS.classroom.teacher.y)],
  ['streamerRoom', 'streamerRoom · overlay', (t) => X.streamerRoom(t, { overlay: true }) + ref(X.SPOTS.streamerRoom.streamer.x, X.SPOTS.streamerRoom.streamer.y, X.SPOTS.streamerRoom.streamer.s)],
  ['dexRoom', 'dexRoom · 9,999 badges', (t) => X.dexRoom(t, {}) + ref(800, X.FLOOR.dexRoom)],
  ['dexRoom_filled', 'dexRoom · filled 1 (Touch Grass)', (t) => X.dexRoom(t, { filled: 1 })],
  ['porch', 'porch · sunset 0', (t) => X.porch(t, { sunset: 0 }) + ref(700, X.FLOOR.porch)],
  ['porch_late', 'porch · sunset 1, phones', (t) => X.porch(t, { sunset: 1, phones: 4 })],
  ['earth', 'earth · wave .35', (t) => X.earth(t, { wave: 0.35 })],
  ['earth_night', 'earth · night, lightsOut .5', (t) => X.earth(t, { night: 1, lightsOut: 0.5 })],
];

(async () => {
  const tiles = TILES.filter(([k]) => !ONLY || ONLY.some((o) => k.startsWith(o)));
  const r = await openRenderer(1920, 1080, { staticDefs: X.DEFS + (REF ? require('../rig/style').DEFS : '') });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sets-'));
  if (FULL) fs.mkdirSync(FULL, { recursive: true });
  // baseline: an empty frame
  // timing = median of 5 JPEG renders (what renderVideo does) minus the median for an empty frame
  const timeIt = async (svg) => { const ts = []; for (let i = 0; i < 5; i++) { const b = Date.now(); await r.render(svg, 'jpeg'); ts.push(Date.now() - b); } return ts.sort((x, y) => x - y)[2]; };
  const base = await timeIt('<rect width="1920" height="1080" fill="#888"/>');
  const files = [];
  console.log('tile'.padEnd(22), 'elems'.padStart(6), 'js ms'.padStart(7), 'svg ms'.padStart(8));
  for (const [key, label, fn] of tiles) {
    S.resetIds();
    const a = Date.now();
    const svg = fn(T0);
    const js = Date.now() - a;
    const n = (svg.match(/<[a-zA-Z]/g) || []).length;
    const rt = await timeIt(svg);
    console.log(key.padEnd(22), String(n).padStart(6), String(js).padStart(7), String(Math.max(0, Math.round(rt - base))).padStart(8));
    if (FULL) fs.writeFileSync(path.join(FULL, key + '.png'), await r.render(svg));
    const lab = `<rect x="0" y="0" width="1920" height="86" fill="#000" opacity="0.62"/><text x="24" y="62" font-family="Fredoka" font-weight="700" font-size="52" fill="#FFE14D">${label}</text>`;
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
