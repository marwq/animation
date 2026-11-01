// Part 12 (11:34 - 12:51): the hatch (a pixel chick), one wish, "tomorrow"; the flowers game pass;
// the rooftop at sunset — blushing, "for YOU", "Smooth... YOU.", the faint; the outro.
'use strict';

const S = require('../rig/svg');
const F = require('../rig/face');
const E = require('./env');
const E5 = require('./env5');
const G = require('./env4');
const C = require('./common');
const U = require('./ui');
const A = require('./acting');
const { drawHero } = require('../rig/hero');
const { drawNova } = require('../rig/nova');
const { secretEgg, bouquet, egg } = require('../rig/props');
const { f, ease, inv, lerp, clamp } = S;
const { W, H, bump, blinkAt, hash } = C;

const START = 694.0, END = 771.0;
const LINES = [
  [694.40, 697.60, 'NARRATOR', 'The Secret Egg glows. It cracks. Light everywhere...'],
  [698.00, 701.00, 'NARRATOR', 'And out pops... a tiny, glitchy... *pixel chick.*'],
  [701.40, 704.40, 'SYSTEM', 'Congratulations, YOU and Nova. Reward: *one wish.*'],
  [704.80, 706.20, 'NOVA', "It's your call, noob."],
  [706.60, 709.80, 'YOU', 'We could turn the world back to normal... *tomorrow.*'],
  [710.20, 711.40, 'NOVA', 'Why tomorrow?'],
  [711.80, 714.00, 'YOU', "'Cause today... I've got *something to do.*"],
  [714.60, 719.60, 'NARRATOR', 'So you go to the shop. Flowers are a game pass. They cost... *every single dollar* you have.'],
  [720.00, 721.00, 'YOU', '*Worth it.*'],
  [721.50, 724.60, 'NARRATOR', 'You find her on the roof of her base, watching the square sun go down.'],
  [725.00, 728.60, 'NARRATOR', "Your face turns red. Like, actually red. There's a *blush texture* now."],
  [729.00, 731.20, 'YOU', 'S-so... uh... these are for you.'],
  [731.60, 733.60, 'NOVA', 'For me? Or for *YOU?*'],
  [734.00, 738.60, 'YOU', "For you! Not me-YOU, you-you! You. ...I'm changing my *username.*"],
  [739.20, 742.60, 'NARRATOR', 'She looks at the flowers. She looks at you. And she *smirks.*'],
  [743.00, 745.60, 'NOVA', 'Smooth... *YOU.* Real smooth.'],
  [746.00, 747.20, 'NARRATOR', 'She takes the flowers.'],
  [747.50, 749.00, 'SYSTEM', '*Nova accepted your gift!*'],
  [749.40, 752.00, 'NARRATOR', 'And for the first time since the world turned into Roblox...'],
  [752.30, 753.80, 'NARRATOR', 'you forget how to *walk.*'],
  [754.20, 755.20, 'YOU', '...oof.'],
  [755.60, 756.40, 'NOVA', '*Noob.*'],
  [757.00, 762.00, 'NARRATOR', 'Which portal would *YOU* pick? Tell me in the comments! And comment *"EGG"* if you\'d pick Steal an Egg too.'],
  [762.40, 765.40, 'NARRATOR', 'And the wish? Still unused. Because honestly...'],
  [765.80, 768.20, 'NARRATOR', 'some things are just better in *Roblox.*'],
];
const TRACK = C.makeTrack(LINES);
const vis = (sp, t) => C.visemeAt(TRACK, sp, t);
const tag = { name: 'YOU', health: 1 };

// ---------------------------------------------------------------- pixel chick
function pixelChick({ x = 0, y = 0, s = 1, t = 0, blink = 0, look = 0 } = {}) {
  let o = S.ellipse(0, 6, 90, 14, { fill: '#000', opacity: 0.18 });
  for (const lx of [-26, 26]) o += S.rect(lx - 6, -40, 12, 42, 3, { fill: '#FF9F1C', stroke: '#151515', 'stroke-width': 4 });
  o += S.rect(-90, -200, 180, 170, 30, { fill: '#FFE14D', stroke: '#151515', 'stroke-width': 7 }) + S.rect(-70, -180, 60, 30, 10, { fill: '#FFF6B0' });
  o += S.rect(-110, -140, 40, 60, 12, { fill: '#F5C842', stroke: '#151515', 'stroke-width': 5 }) + S.rect(70, -140, 40, 60, 12, { fill: '#F5C842', stroke: '#151515', 'stroke-width': 5 });
  o += S.rect(-14, -236, 28, 40, 6, { fill: '#FFE14D', stroke: '#151515', 'stroke-width': 5 });
  for (const sx of [-1, 1]) o += blink > 0.6 ? S.path(`M${sx * 34 - 12 + look * 8} -140 l24 0`, { stroke: '#151515', 'stroke-width': 7 }) : S.rect(sx * 34 - 10 + look * 8, -156, 20, 26, 4, { fill: '#151515' }) + S.rect(sx * 34 - 6 + look * 8, -152, 6, 6, 1, { fill: '#FFFFFF' });
  o += S.path(`M${-18 + look * 8} -116 L${18 + look * 8} -116 L${look * 8} -96 Z`, { fill: '#FF9F1C', stroke: '#151515', 'stroke-width': 5, 'stroke-linejoin': 'round' });
  for (let i = 0; i < 8; i++) { const k = Math.floor(t * 10 + i * 3); if (hash(k) > 0.6) o += S.rect(-110 + hash(k * 3) * 220, -240 + hash(k * 7) * 230, 16, 16, 2, { fill: ['#00F0FF', '#FF3DF2', '#FFFFFF'][i % 3], opacity: 0.8 }); }
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

// ---------------------------------------------------------------- 694.0 - 714.3: hatch + wish
function padScene(t, cam, w) {
  let o = S.rect(0, 0, W, H, 0, { fill: '#1A0B3A' });
  for (let i = 0; i < 16; i++) o += S.path('M0 0 L-60 -1400 L60 -1400 Z', { fill: '#C77DFF', opacity: 0.07, transform: `translate(960 820) rotate(${f(i * 22.5 + t * 8)})` });
  let g = S.ellipse(960, 900, 700, 120, { fill: '#7B2FFF', opacity: 0.5 }) + S.ellipse(960, 900, 600, 100, { fill: 'none', stroke: '#C77DFF', 'stroke-width': 14 });
  return o + S.g(g + w, E.camTf(cam, 1));
}
function shotHatch(t) {
  if (t < 698.0) {
    const k = inv(694.4, 697.6, t);
    const cam = { zoom: 1.0 + 0.3 * k, fx: 960, fy: 640 };
    let w = drawHero({ x: 520, y: 900, s: 0.6, nametag: tag, turn: 0.5, face: { name: 'amazed', eyes: { look: [1, -0.2], cross: 0 } } });
    w += drawNova({ x: 1400, y: 900, s: 0.6, nametag: 'Nova', turn: -0.5, face: { name: 'shocked', glasses: false, eyes: { look: [-1, -0.2] } } });
    let eg = secretEgg({ x: 0, y: 0, size: 300, t, rot: Math.sin(t * 40) * 8 * k });
    const c = inv(695.6, 697.0, t);
    if (c > 0) eg += S.path(`M0 -120 L-20 -70 L14 -30 L-16 10 L10 50`.split(' ').slice(0, 2 + Math.floor(c * 8)).join(' '), { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 10, 'stroke-linejoin': 'round' });
    w += S.g(eg, 'translate(960 760)');
    let o = padScene(t, cam, w);
    if (t > 697.0) o += C.whiteFlash(inv(697.0, 697.9, t));
    return o;
  }
  if (t < 704.7) {
    const cam = { zoom: 1.7, fx: 960, fy: 540, y: 260 };
    const pop = ease.outBack(inv(698.8, 699.3, t));
    let w = pixelChick({ x: 960, y: 900, s: 0.9 * pop, t, blink: blinkAt(t, 700.2, 702.6), look: Math.sin(t * 1.5) });
    if (t < 700.0) w += S.g(S.path('M-60 0 Q-60 -80 0 -80 L-10 -50 L10 -30 L-5 0 Z', { fill: '#2A1352', stroke: '#151515', 'stroke-width': 6 }), `translate(${f(960 - 160 * pop)} 900) rotate(${f(-40 * pop)})`) + S.g(S.path('M60 0 Q60 -80 0 -80 L-10 -50 L10 -30 L-5 0 Z', { fill: '#2A1352', stroke: '#151515', 'stroke-width': 6 }), `translate(${f(960 + 160 * pop)} 900) rotate(${f(40 * pop)})`);
    let o = padScene(t, cam, w) + C.whiteFlash(1 - inv(698.0, 698.4, t));
    if (t > 700.2 && t < 701.2) o += C.sfx('beep!', 1300, 420, inv(700.2, 700.35, t), 70, 8, '#FFFFFF');
    if (t > 701.4) { // reward window with a wish button
      const k = ease.outBack(inv(701.5, 701.8, t));
      let win = S.rect(-460, -180, 920, 360, 40, { fill: '#121628', stroke: '#FFFFFF', 'stroke-width': 8, opacity: 0.95 });
      win += S.el('text', { x: 0, y: -90, 'font-family': 'Fredoka', 'font-weight': 700, 'font-size': 40, fill: '#9AA3BC', 'text-anchor': 'middle' }, 'CONGRATULATIONS, YOU & Nova');
      win += S.el('text', { x: 0, y: 6, 'font-family': 'Lilita One', 'font-size': 92, fill: '#FFE14D', 'text-anchor': 'middle' }, 'REWARD: 1 WISH');
      win += S.rect(-380, 60, 340, 90, 24, { fill: '#3BD16F', stroke: '#151515', 'stroke-width': 6 }) + S.el('text', { x: -210, y: 122, 'font-family': 'Lilita One', 'font-size': 60, fill: '#FFFFFF', 'text-anchor': 'middle' }, 'USE');
      win += S.rect(40, 60, 340, 90, 24, { fill: '#8A92A6', stroke: '#151515', 'stroke-width': 6 }) + S.el('text', { x: 210, y: 122, 'font-family': 'Lilita One', 'font-size': 60, fill: '#FFFFFF', 'text-anchor': 'middle' }, 'LATER');
      o += S.g(win, `translate(960 300) scale(${f(k)})`);
    }
    return o;
  }
  // the talk about the wish
  const focusNova = (t >= 704.7 && t < 706.5) || (t >= 710.1 && t < 711.7);
  const cam = { zoom: 1.5, fx: 960, fy: 540, x: focusNova ? 200 : -200, y: 60 };
  const later = t > 709.0;
  let w = drawHero({ x: 700, y: 900, s: 0.6, nametag: tag, turn: 0.5, face: t > 711.8 ? { name: 'nervous', mouth: vis('YOU', t) || 'smile', fx: ['blush'], eyes: { look: [1, 0], cross: 0 } } : { name: 'happy', mouth: vis('YOU', t) || 'smile', eyes: { look: t > 707.6 && t < 709 ? [0, -0.8] : [1, 0], cross: 0 } }, armR: later && t < 710 ? 120 : 9 });
  w += drawNova({ x: 1220, y: 900, s: 0.6, nametag: 'Nova', turn: -0.5, face: t > 710.1 ? { name: 'teasing', mouth: vis('NOVA', t) || 'smirk', glasses: 'half' } : { name: 'softSmile', mouth: vis('NOVA', t) || 'smallSmile', glasses: false } });
  w += pixelChick({ x: 960, y: 900, s: 0.5, t, blink: blinkAt(t, 707.0, 710.4), look: focusNova ? 1 : -1 });
  let o = padScene(t, cam, w);
  if (later) o += S.g(S.rect(-180, -50, 360, 100, 24, { fill: '#8A92A6', stroke: '#151515', 'stroke-width': 6 }) + S.el('text', { x: 0, y: 24, 'font-family': 'Lilita One', 'font-size': 62, fill: '#FFFFFF', 'text-anchor': 'middle' }, 'LATER ✓'), `translate(960 180) scale(${f(ease.outBack(inv(709.0, 709.2, t)) * (1 - inv(710.0, 710.2, t)))})`);
  return o;
}

// ---------------------------------------------------------------- 714.3 - 721.3: the flower shop
function shotShop(t) {
  let o = S.rect(0, 0, W, H, 0, { fill: '#FFD1E3' });
  for (let i = 0; i < 14; i++) o += S.path('M0 0 L-70 -1200 L70 -1200 Z', { fill: '#FFFFFF', opacity: 0.25, transform: `translate(960 480) rotate(${f(i * 25.7 + t * 15)})` });
  let card = S.rect(-460, -380, 920, 760, 40, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 8 });
  card += S.el('text', { x: 0, y: -300, 'font-family': 'Lilita One', 'font-size': 70, fill: '#FFE14D', 'text-anchor': 'middle' }, 'GAME PASS');
  card += bouquet({ x: 0, y: 40, size: 380 });
  card += S.el('text', { x: 0, y: 150, 'font-family': 'Lilita One', 'font-size': 80, fill: '#FF8FB0', 'text-anchor': 'middle' }, 'FLOWERS');
  const price = t > 717.6 ? '$999,999,999' : '$???';
  card += S.el('text', { x: 0, y: 230, 'font-family': 'Lilita One', 'font-size': 70, fill: '#5CFF7A', 'text-anchor': 'middle' }, price);
  const press = bump(t, 719.8, 720.2);
  card += S.g(S.rect(-170, -50, 340, 100, 24, { fill: '#3BD16F', stroke: '#151515', 'stroke-width': 6 }) + S.el('text', { x: 0, y: 24, 'font-family': 'Lilita One', 'font-size': 64, fill: '#FFFFFF', 'text-anchor': 'middle' }, 'BUY'), `translate(0 310) scale(${f(1 - 0.1 * press)})`);
  o += S.g(card, `translate(960 520) scale(${f(ease.outBack(inv(714.5, 714.8, t)) * 0.9)})`);
  if (t > 719.9) o += S.circle(960, 520 + 310 * 0.9, 30 + 120 * inv(719.9, 720.3, t), { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 14 * (1 - inv(719.9, 720.3, t)) });
  // the money counter drains to zero
  const m = t < 720.1 ? '$999,999,999' : `$${Math.floor(999999999 * (1 - inv(720.1, 720.9, t))).toLocaleString('en-US')}`;
  o += G.moneyHud(m, bump(t, 720.1, 720.5));
  if (t > 720.0) o += S.g(drawHero({ x: 0, y: 0, s: 0.45, face: { name: 'determined', mouth: vis('YOU', t) || 'smile' }, armR: 120, nametag: null, shadow: false }), 'translate(1660 1060)');
  return o;
}

// ---------------------------------------------------------------- 721.3 - 757.0: the rooftop at sunset
const ROOF_Y = 900;
function rooftop(t, cam, w) {
  let o = `<defs><linearGradient id="roofSunset" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B3C88"/><stop offset="0.45" stop-color="#E9677A"/><stop offset="0.8" stop-color="#FFB36B"/><stop offset="1" stop-color="#FFD98A"/></linearGradient>
    <radialGradient id="roofGlow"><stop offset="0" stop-color="#FFF1B0" stop-opacity="0.9"/><stop offset="1" stop-color="#FFF1B0" stop-opacity="0"/></radialGradient></defs>`;
  let bg = S.rect(-600, -600, 3120, 2280, 0, { fill: 'url(#roofSunset)' });
  const sunY = 640 + 60 * inv(721.3, 757.0, t);
  bg += S.circle(960, sunY, 420, { fill: 'url(#roofGlow)' }) + S.rect(870, sunY - 90, 180, 180, 18, { fill: '#FFE06B', stroke: '#F0A93A', 'stroke-width': 8 });
  for (const [x, y, w2] of [[-200, 700, 160], [0, 660, 120], [180, 720, 180], [420, 640, 140], [1250, 650, 150], [1450, 690, 200], [1700, 630, 120], [1880, 700, 160]]) bg += S.rect(x, y, w2, 500, 6, { fill: '#7B4A86', opacity: 0.75 });
  for (let i = 0; i < 5; i++) bg += E.cloud(-200 + i * 520 + (t * 10) % 520, 160 + (i % 2) * 90, 0.7, '#FFD3E6', '#E58AA0');
  let roof = S.rect(-600, ROOF_Y, 3120, 400, 0, { fill: '#3B2A4A' }) + S.rect(-600, ROOF_Y, 3120, 26, 0, { fill: '#58406B' }) + S.path(`M-600 ${ROOF_Y} L2520 ${ROOF_Y}`, { stroke: '#151515', 'stroke-width': 7 });
  roof += S.rect(1500, ROOF_Y - 160, 220, 160, 14, { fill: '#E0283F', stroke: '#151515', 'stroke-width': 6 }) + S.el('text', { x: 1610, y: ROOF_Y - 64, 'font-family': 'Lilita One', 'font-size': 40, fill: '#FFFFFF', 'text-anchor': 'middle' }, "NOVA'S");
  o += E.layer(bg, cam, 0.3) + E.layer(roof, cam, 1) + S.g(w, E.camTf(cam, 1));
  return o;
}
function shotRoof(t) {
  // 721.3 - 724.9: wide, Nova sitting on the edge watching the sun; YOU walks up with flowers behind his back
  if (t < 724.9) {
    const cam = { zoom: 1.0, fx: 960, fy: 540 };
    const yx = lerp(-200, 560, ease.out(inv(722.0, 724.6, t)));
    let w = drawNova({ view: 'back', x: 1160, y: ROOF_Y + 10, s: 0.62, bodyY: 0, nametag: 'Nova' });
    w += drawHero({ view: 'side', flip: true, x: yx, y: ROOF_Y + 10, s: 0.62, ...A.walk(t * 6), armL: -30, armR: -40, face: { name: 'nervous', fx: ['blush'] }, nametag: tag, props: [{ svg: bouquet({ x: 120, y: -460, size: 230, rot: 160 }), layer: 'back' }] });
    return rooftop(t, cam, w);
  }
  const YX = 760, NX = 1180;
  const v = vis('YOU', t), vn = vis('NOVA', t);
  const blush = clamp(inv(725.0, 727.0, t), 0, 1);
  let focus = 'both';
  if (t > 728.9 && t < 731.5) focus = 'you';
  if (t > 731.5 && t < 733.8) focus = 'nova';
  if (t > 733.8 && t < 739.0) focus = 'you';
  if (t > 739.0 && t < 746.0) focus = 'nova';
  const cam = focus === 'both' ? { zoom: 1.35 + 0.2 * blush * (t < 728.9 ? 1 : 0), fx: 960, fy: 560, x: 0, y: 40 } : { zoom: 2.0, fx: 960, fy: 540, x: (focus === 'you' ? YX : NX) - 960 + (focus === 'you' ? 60 : -60), y: 0 };
  // flowers: hidden behind back -> offered (729.0) -> taken by Nova (746.0)
  const offer = ease.outBack(inv(729.2, 729.6, t));
  const taken = t > 746.0;
  const [hx, hy] = A.hand(lerp(-30, 70, offer));
  let youP = { x: YX, y: ROOF_Y + 10, s: 0.62, turn: 0.55, nametag: tag, dimFar: false, armL: 6, armR: lerp(-40, 70, offer) };
  let youFace = { name: 'nervous', mouth: v || 'wavy', eyes: { look: [0.9, 0.2], pupil: 0.8, cross: 0 }, fx: blush > 0 ? [{ type: 'redface', k: 0.15 + 0.3 * blush }, 'sweat'] : ['sweat'] };
  if (t > 734.0 && t < 738.0) youFace = { ...youFace, eyes: { look: [Math.sin(t * 12) * 0.9, 0], pupil: 0.6, cross: 0 }, fx: [{ type: 'redface', k: 0.45 }, 'sweat2', 'steam'] };
  if (t > 737.0 && t < 739.0) youFace = { name: 'deadpan', mouth: v || 'line', fx: [{ type: 'redface', k: 0.45 }, 'steam'] };
  if (t > 746.0 && t < 752.2) youFace = { name: 'love', mouth: 'smallSmile', fx: [{ type: 'redface', k: 0.5 }, 'steam', 'hearts'] };
  youP.face = youFace;
  if (!taken) youP.props = [{ svg: bouquet({ x: hx + 40, y: hy - 30, size: 230, rot: lerp(160, 20, offer) }), layer: offer > 0.5 ? 'top' : 'back' }];
  // the faint: falls back like a plank
  if (t > 752.2) {
    const k = ease.in(inv(752.4, 753.6, t));
    youP = { ...youP, rot: -90 * k, rotY: -20, armR: 9, armL: 9, face: t > 753.6 ? { name: 'love', mouth: vis('YOU', t) || 'O', fx: [{ type: 'redface', k: 0.5 }, 'hearts'] } : youFace, props: [] };
  }
  let novaFace = { name: 'cool', eyes: { look: [0.3, -0.5] } };
  if (t > 728.9) novaFace = { name: 'cool', mouth: vn || 'smallSmile', eyes: { look: [-0.8, -0.3] } };
  if (t > 731.5 && t < 733.8) novaFace = { name: 'teasing', mouth: vn || 'smirk', eyes: { look: [-0.8, -0.3] } };
  if (t > 739.2 && t < 742.8) { const lk = t < 740.6 ? [-0.6, 0.6] : [-0.8, -0.4]; novaFace = { name: 'cool', eyes: { look: lk } }; }
  if (t > 741.6) novaFace = { name: 'smug', mouth: vn || 'smirk', eyes: { look: [-0.8, -0.3] }, glassesDy: 14 * ease.out(inv(742.0, 742.4, t)) };
  if (t > 746.0) novaFace = { name: 'smug', mouth: vn || 'smirk', glasses: t > 749.0 ? false : 'half', eyes: { look: [-0.8, -0.2] }, fx: t > 749.0 ? ['blush'] : [] };
  if (t > 755.4) novaFace = { name: 'laugh', mouth: vn || 'grin', glasses: false, fx: ['blush'] };
  const nTake = ease.outBack(inv(746.0, 746.4, t));
  const [nx, ny] = A.hand(lerp(9, 60, nTake), -1);
  let novaP = { x: NX, y: ROOF_Y + 10, s: 0.62, turn: -0.55, nametag: 'Nova', dimFar: false, face: novaFace, armL: taken ? lerp(9, 60, nTake) : 6, armR: 4, headRot: t > 742.0 && t < 746 ? -4 : 0 };
  if (taken) novaP.props = [{ svg: bouquet({ x: nx - 30, y: ny - 30, size: 230, rot: -20 }), layer: 'top' }];
  let w = drawHero(youP) + drawNova(novaP);
  if (taken && t < 749.5) for (let i = 0; i < 8; i++) { const ph = ((t - 746.0) * 0.6 + i / 8) % 1; w += S.g(S.path(F.heartPath(0, 0, 22), { fill: '#FF5A7A', stroke: '#151515', 'stroke-width': 4 }), `translate(${f(940 + Math.sin(i * 2 + ph * 6) * 140)} ${f(560 - ph * 400)})`, { opacity: f(1 - ph) }); }
  let o = rooftop(t, cam, w);
  // the blush texture label
  if (t > 726.6 && t < 728.9) o += S.g(S.rect(-260, -55, 520, 110, 26, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 6 }) + S.el('text', { x: 0, y: 24, 'font-family': 'Lilita One', 'font-size': 60, fill: '#FF8FB0', 'text-anchor': 'middle' }, '+ BLUSH TEXTURE'), `translate(1500 180) scale(${f(ease.outBack(inv(726.7, 726.9, t)))})`);
  if (t > 737.6 && t < 739.0) o += S.g(S.rect(-300, -55, 600, 110, 26, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 6 }) + S.el('text', { x: 0, y: 24, 'font-family': 'Lilita One', 'font-size': 52, fill: '#FFFFFF', 'text-anchor': 'middle' }, 'CHANGE USERNAME? (Y/N)'), `translate(960 180) scale(${f(ease.outBack(inv(737.7, 737.9, t)))})`);
  if (t > 747.5 && t < 749.4) o += U.toast('GIFT ACCEPTED', 'Nova accepted your gift! ♥', bouquet({ x: 0, y: 40, size: 100 }), inv(747.5, 747.8, t) * (1 - inv(749.1, 749.4, t)));
  if (t > 753.4 && t < 754.6) o += C.sfx('*thud*', 700, 760, inv(753.5, 753.6, t), 60, -6, '#FFFFFF');
  return o;
}

// ---------------------------------------------------------------- 757.0 - 771.0: outro
function shotOutro(t) {
  if (t < 762.3) {
    // comment prompt: a portal row + a giant comment box
    let o = E.plazaLayers({ zoom: 1.05, fx: 960, fy: 520 }, t).bg + S.rect(0, 0, W, H, 0, { fill: '#121628', opacity: 0.35 });
    const k = ease.outBack(inv(757.2, 757.5, t));
    let box = S.rect(-560, -150, 1120, 300, 40, { fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 8 }) + S.circle(-460, -60, 50, { fill: '#FF8FC8', stroke: '#151515', 'stroke-width': 5 });
    const typed = 'EGG 🥚';
    const n = t > 760.4 ? Math.min(typed.length, Math.floor((t - 760.4) * 6)) : 0;
    box += S.el('text', { x: -380, y: -40, 'font-family': 'Fredoka', 'font-weight': 700, 'font-size': 44, fill: '#9AA3BC' }, 'Add a comment...');
    box += S.el('text', { x: -380, y: 60, 'font-family': 'Lilita One', 'font-size': 90, fill: '#1F2233' }, typed.slice(0, n) + (Math.floor(t * 2) % 2 ? '|' : ''));
    o += S.g(box, `translate(960 380) scale(${f(k)})`);
    return o;
  }
  // the last shot: sunset on YOU's base, Rocky and the pixel chick side by side; a ??? egg rolls past on the belt
  const cam = { zoom: 1.6, fx: 960, fy: 540, x: 600 - 960 + 340, y: 320 };
  const M = G.eggMap(cam, t, { beltOff: t * 80, secretX: t > 766.0 ? lerp(-200, 1600, inv(766.0, 770.5, t)) : undefined, noBeltEggs: false });
  const b = G.base({ x0: 300, x1: 1500, col: '#FF8FC8', sign: "YOU's Base", doorSide: 'right', locked: true, pedestals: [null, null, null] }, t);
  let w = G.rocky({ x: 820, y: 1000, s: 0.85, t, blink: blinkAt(t, 764.0), face: 'happy', look: 0.6 }) + pixelChick({ x: 1060, y: 1000, s: 0.5, t, blink: blinkAt(t, 765.2), look: t > 768.6 ? 0 : -0.8 });
  let o = M.bg + M.ground + S.g(b + w, E.camTf(cam, 1));
  o += `<defs><linearGradient id="endSunset" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B3C88"/><stop offset="1" stop-color="#FFB36B"/></linearGradient></defs>` + S.rect(0, 0, W, H, 0, { fill: 'url(#endSunset)', opacity: 0.3, style: 'mix-blend-mode:multiply' });
  if (t > 768.6 && t < 769.8) o += C.sfx('beep.', 1300, 480, inv(768.6, 768.75, t), 70, 6, '#FFFFFF');
  if (t > 769.6) o += S.rect(0, 0, W, H, 0, { fill: '#000', opacity: f(inv(769.6, 771.0, t)) });
  return o;
}

function scene(t) {
  if (t < 714.3) return shotHatch(t);
  if (t < 721.3) return shotShop(t);
  if (t < 757.0) return shotRoof(t);
  return shotOutro(t);
}

module.exports = { scene, TRACK, LINES, START, END };
