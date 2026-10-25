// Ролик 22 (серия по образцу): Скакалка — Толстый против Малыша, 25 с, 24 кадра/с. Плотно, как у HugyTi:
// скакалка обматывает, хлещет, Толстый становится йо-йо, глотает скакалку как спагетти и крутится волчком.
// Музыка превращения — присланная, ~4 с с затиханием, только при первом превращении. Фон — деревня.
//
//   0–1.8 с   шарик-Малыш (слева), скакалка на траве, шарик-Толстый (справа)
//   1.8–3.8 с Малыш на пропеллере хватает ручку ртом и облетает Толстого — тот обмотан; Толстый надувается —
//             скакалка лопается с него и хлещет Малыша по лицу, он кувыркается
//   3.8–5 с   Малыш «растёт» под музыку
//   5.3–7.7 с прыгает через скакалку; Толстый прыгает к нему — петля подхватывает его и обматывает
//   7.7–10.9 с Толстый — йо-йо: вниз-вверх, вниз-вверх, «выгул собачки» — катится по траве и отлетает, звёзды
//   11.2–15 с Толстый всасывает скакалку из рук, глотает её как спагетти и выплёвывает лассо — ноги Малыша
//             спутаны, он падает как дерево — «пуф», снова шарик
//   15.3–16.6 с Малыш «растёт» снова
//   17–20 с   Толстый снова разевает рот — Малыш сам «кормит» его скакалкой и дёргает за ручку: Толстый
//             крутится волчком и уносится за кадр
//   20–25 с   Малыш в центре, руки вверх
'use strict';

const ST = Stage({
  name: 'mc22-jumprope',
  cast: {
    baby: { small: ['child-verity-pink', { bodyHeight: 300, spin: { layer: 'hat', cut: 122, axis: 389 } }],
      big: ['child-verity-big', { height: 730, spin: { layer: 'hat', cut: 106, axis: 330 } }], pivot: 338, voice: 1.25,
      lie: 60, color: '#ffd9b8', moods: { angry: ' 2', grin: ' 2', big: 'theeth smile', love: ' 1' } },
    fat: { small: ['fat-verity-small', { bodyHeight: 450 }], pivot: 508, voice: 0.75, moods: { love: 'happy' } },
  },
  order: ['baby', 'fat'],
  background: { theme: 'village', seed: 221, sunX: 420, sunY: 140 },
  clouds: [[150, 80, 2.4, 0, 12], [700, 200, 1.8, 1, 16], [1200, 60, 2.6, 2, 10], [1700, 250, 1.6, 0, 18]],
});
const { FPS, NF, GROUND, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform, shrink, stance, walk, turn,
  fallBack, victory, chuckle, hand, toRig, statesAt, stateAt, target } = ST;

const BMOUTH = [315, 740];
ST.parts.mouth = (ch, st, p) => (ch === C.baby.small ? E.apply(ch.eyeMatrix(st, ' 2'), BMOUTH) : E.apply(ch.eyeMatrix(st, 'puzzlement'), [611, 456]));
function propeller(who, f0, f1, rps = 7, o = {}) {
  key(who, f0, { spin: 0, spinBlur: 0 }, 0);
  key(who, f0 + 8, { spinBlur: 1 }, 8);
  move(who, f1, { spin: rps * (f1 - f0) / 24 }, 'lin');
  key(who, f1, { spinBlur: 0 }, 6);
  key(who, f1 + 1, { spin: 0 }, 0);
  if (o.snd !== false) sfx('whirr', f0, { who, dur: f1 - f0, gain: o.gain ?? 0.4 });
}
function fatOpen(f, k, n, extra = {}) { key('fat', f - n, { mouth: 'puzzlement' }, 0); key('fat', f, { mouthK: k, ...extra }, n, 'out'); }
const lerp2 = (a, b, u) => [E.lerp(a[0], b[0], u), E.lerp(a[1], b[1], u)];

// ------------------------------------------------------------------ скакалка: режимы по времени
const ROPE = [];                                   // {f0, mode, ...}
const rope = (f0, mode, o = {}) => ROPE.push({ f0, mode, ...o });
const fatC = (S) => target('fat:body', S);
const fatR = (S) => { const { ch, p } = S.fat; return [ch.width * 0.47 * (p.sx || 1), ch.height * 0.47 * (p.sy || 1)]; };
const bHand = (S, k = 'F') => C.baby.big.point(S.baby.st, 'hand' + k);
const G1 = [610, GROUND - 14], G2 = [680, GROUND - 14];          // где лежит скакалка (ручки) после хлыста
const uShape = (a, b, far) => [a, [a[0] + 60, GROUND - 6], [far - 40, GROUND - 4], [far, GROUND - 20], [far - 40, GROUND - 8], [b[0] + 60, GROUND - 6], b];
function ropeAt(f, S) {
  let cur = null, i = 0;
  for (; i < ROPE.length; i++) if (f >= ROPE[i].f0) cur = ROPE[i];
  if (!cur) return null;
  const nxt = ROPE[ROPE.indexOf(cur) + 1], u = nxt ? E.clamp((f - cur.f0) / (nxt.f0 - cur.f0), 0, 1) : 1;
  const out = { pts: null, h: [], coils: null };
  switch (cur.mode) {
    case 'ground': {
      const [a, b] = cur.at;
      out.pts = [a, [a[0] + 70, a[1] + 6], [(a[0] + b[0]) / 2, a[1] + 8], [b[0] - 70, b[1] + 6], b];
      out.h = [[...a, Math.PI], [...b, 0]];
      break;
    }
    case 'wrap': case 'wrapped': {
      const c = fatC(S), [rx, ry] = fatR(S), n = cur.mode === 'wrap' ? 3 * u : 3;
      out.coils = { c, rx, ry, n };
      if (cur.mode === 'wrap') {
        const m = target('baby:mouth', S);
        out.pts = [m, [(m[0] + c[0] - rx) / 2, (m[1] + c[1]) / 2 + 30], [c[0] - rx * 0.9, c[1] + ry * 0.2]];
        out.h = [[m[0] + 10, m[1] + 4, Math.PI * 0.75]];
      } else {
        const a = [c[0] - rx * 0.7, c[1] + ry * 0.5];
        out.pts = [a, [a[0] - 30, a[1] + 60], [a[0] - 20, a[1] + 120]];
        out.h = [[a[0] - 20, a[1] + 120, Math.PI / 2]];
      }
      break;
    }
    case 'whip': {                                  // хлещет от Толстого к лицу Малыша
      const a = cur.from, b = target('baby:face', S), e = lerp2(a, b, E.EASE.out(u));
      out.pts = [a, [(a[0] + e[0]) / 2, Math.min(a[1], e[1]) - 120 * (1 - u)], e];
      out.h = [[...a, 0], [...e, Math.PI]];
      break;
    }
    case 'fall': {
      const a0 = cur.from, b0 = cur.to, k = E.EASE.in2(u);
      const g = uShape(G1, G2, 980);
      const air = [a0, [(a0[0] + b0[0]) / 2, Math.min(a0[1], b0[1]) - 60], b0];
      out.pts = g.map((p, j) => lerp2(air[Math.min(2, Math.round(j / (g.length - 1) * 2))], p, k));
      out.h = [[...out.pts[0], Math.PI], [...out.pts[out.pts.length - 1], Math.PI]];
      break;
    }
    case 'ground2': {
      out.pts = uShape(cur.a || G1, cur.b || G2, cur.far || 980);
      out.h = [[...out.pts[0], Math.PI], [...out.pts[out.pts.length - 1], Math.PI]];
      break;
    }
    case 'skip': {
      const hf = bHand(S, 'F'), hb = bHand(S, 'B'), phi = cur.phi(f), c = [S.baby.p.x, (hf[1] + hb[1]) / 2 - 20];
      const P = [c[0] + cur.rx * Math.cos(phi), Math.min(GROUND - 10, c[1] + cur.ry * Math.sin(phi))];
      out.pts = [hf, [(hf[0] + P[0]) / 2 + 40 * Math.cos(phi), (hf[1] + P[1]) / 2], P, [(hb[0] + P[0]) / 2 + 40 * Math.cos(phi), (hb[1] + P[1]) / 2], hb];
      out.h = [[...hf, Math.PI / 2 + 0.3], [...hb, Math.PI / 2 - 0.3]];
      out.behind = Math.sin(phi) < -0.2;
      break;
    }
    case 'yoyo': {                                  // обе ручки в руке, шнур к макушке Толстого (обмотан)
      const h = bHand(S, 'F'), c = fatC(S), [rx, ry] = fatR(S), t = [c[0], c[1] - ry];
      out.pts = [h, [(h[0] + t[0]) / 2, (h[1] + t[1]) / 2], t];
      out.h = [[h[0] - 6, h[1], Math.PI / 2], [h[0] + 6, h[1], Math.PI / 2]];
      out.coils = { c, rx, ry, n: cur.n ?? 2, spin: S.fat.p.rot || 0 };
      break;
    }
    case 'walk': {                                  // «выгул собачки»: шнур от руки к низу Толстого
      const h = bHand(S, 'F'), c = fatC(S), [rx, ry] = fatR(S), t = [c[0] - rx * 0.3, c[1] + ry * 0.6];
      out.pts = [h, [(h[0] + t[0]) / 2, Math.max(h[1], t[1]) - 20], t];
      out.h = [[h[0] - 6, h[1], Math.PI / 2], [h[0] + 6, h[1], Math.PI / 2]];
      out.coils = { c, rx, ry, n: 2 * (1 - u), spin: S.fat.p.rot || 0 };
      break;
    }
    case 'hang': {
      const h = bHand(S, cur.arm || 'F'), e = [h[0] + 260, GROUND - 6];
      out.pts = [h, [h[0] + 30, GROUND - 40], [h[0] + 110, GROUND - 6], e];
      out.h = [[h[0] - 6, h[1], Math.PI / 2], [h[0] + 6, h[1], Math.PI / 2]];
      break;
    }
    case 'suck': {                                  // шнур натянут от руки в рот Толстого
      const h = bHand(S, 'F'), m = target('fat:mouth', S), w = Math.sin(f * 1.3) * 10;
      out.pts = [h, [(h[0] + m[0]) / 2, (h[1] + m[1]) / 2 + w], m];
      out.h = [[h[0] - 6, h[1], Math.PI / 2], [h[0] + 6, h[1], Math.PI / 2]];
      break;
    }
    case 'slurp': {                                 // отпустил: ручки летят в рот, шнур короче
      const a = cur.from, m = target('fat:mouth', S), e = lerp2(a, m, E.EASE.in2(u));
      out.pts = [e, [(e[0] + m[0]) / 2, (e[1] + m[1]) / 2 + Math.sin(f) * 14], m];
      out.h = [[...e, Math.PI], [e[0] + 8, e[1] + 8, Math.PI]];
      break;
    }
    case 'lasso': {                                 // выплюнул: петля летит к ногам Малыша
      const m = cur.from, ft = S.baby.p.footF || [S.baby.p.x, 0], b = [ft[0] - 20, GROUND - 40], e = lerp2(m, b, E.EASE.out(u));
      out.pts = [m, [(m[0] + e[0]) / 2, Math.min(m[1], e[1]) - 100 * Math.sin(Math.PI * u)], e];
      out.h = [[...m, 0], [...e, Math.PI]];
      out.loop = { at: e, r: 50 };
      break;
    }
    case 'legs': {                                  // спутаны ноги
      const p = S.baby.p, fF = p.footF || [p.x, 0], fB = p.footB || [p.x, 0];
      const big = p.form === 'big';
      if (big) {
        const x0 = Math.min(fF[0], fB[0]) - 30, x1 = Math.max(fF[0], fB[0]) + 30, y = GROUND - 60;
        out.ankles = { x0, x1, y: p.rot ? null : y };
        out.pts = [[x1, y], [x1 + 60, y + 30], [x1 + 140, GROUND - 6]];
        out.h = [[x1 + 140, GROUND - 6, 0]];
      }
      break;
    }
    case 'feed': {                                  // Малыш «кормит»: ручка в руке, шнур уходит в рот
      const h = bHand(S, 'F'), m = target('fat:mouth', S), e = lerp2(cur.from, m, E.EASE.out(u));
      out.pts = [h, [(h[0] + e[0]) / 2, (h[1] + e[1]) / 2 - 60 * (1 - u)], e];
      out.h = [[h[0] - 4, h[1], Math.PI / 2]];
      if (u < 1) out.h.push([...e, 0]);
      break;
    }
    case 'pull': {                                  // дёрнул: шнур от рта к руке, вытягивается
      const h = bHand(S, 'F'), m = target('fat:mouth', S);
      out.pts = [h, [(h[0] + m[0]) / 2, (h[1] + m[1]) / 2 + Math.sin(f * 2) * 20], m];
      out.h = [[h[0] - 4, h[1], Math.PI / 2]];
      break;
    }
    case 'held': {
      const h = bHand(S, 'F');
      const yy = (d) => Math.min(GROUND - 8, h[1] + d), e = [h[0] + 10 + Math.max(0, h[1] + 300 - GROUND) * 0.8, yy(300)];
      out.pts = [h, [h[0] + 20, yy(120)], [h[0] - 10, yy(240)], e];
      out.h = [[h[0] - 4, h[1], Math.PI / 2], [...e, Math.max(0, h[1] + 300 - GROUND) > 0 ? 0 : Math.PI / 2]];
      break;
    }
    default: return null;
  }
  return out;
}

const BS = 520, FS = 1320;
// ================================================================== 0–1.8 с: стойка
key('baby', 0, { form: 'small', x: BS, y: GROUND, face: 1, look: 1, eyes: 'normal', mouth: ' 6', sx: 1, sy: 1, rot: 0, pivot: 0, alpha: 1 }, 0);
key('fat', 0, { form: 'small', x: FS, y: GROUND, face: -1, look: 1, eyes: 'normal', mouth: 'smile normal', sx: 1, sy: 1, rot: 0, pivot: 0, mouthK: 1 }, 0);
const H1 = [840, GROUND - 14], H2 = [1060, GROUND - 14];
rope(0, 'ground', { at: [H1, H2] });

const BIG = () => {
  // ---- 1.8–3.8 с: хватает ручку ртом, облетает Толстого — обмотан; надувается — скакалка хлещет Малыша
  key('baby', 34, { eyes: 'angry', mouth: ' 2' }, 0);
  sfx('ref:grin-eee', 34, { who: 'baby', gain: 0.45, pitch: 1.3 });
  propeller('baby', 36, 72, 10);
  const S1 = stateAt(1), dM = [target('baby:mouth', S1)[0] - BS, target('baby:mouth', S1)[1] - GROUND];
  const GRAB = 44;
  move('baby', 38, { x: BS, y: GROUND });
  move('baby', GRAB, { x: H1[0] - dM[0] - 10, y: H1[1] - dM[1] }, 'io');
  sfx('chomp', GRAB, { who: 'baby', gain: 0.6 });
  rope(GRAB, 'wrap');
  const fc = [FS, GROUND - 225], RX = 340, RY = 150, C0 = GRAB + 2, C1 = GRAB + 16;
  for (let f = C0; f <= C1; f += 2) {
    const th = Math.PI + 2 * Math.PI * (f - C0) / (C1 - C0);
    move('baby', f, { x: fc[0] + RX * Math.cos(th), y: fc[1] + RY * Math.sin(th) + 120 }, 'lin');
    key('baby', f, { z: Math.sin(th) < 0 ? 0 : 2 }, 0);
  }
  sfx('whoosh', C0, { who: 'baby', dur: 14, gain: 0.6 });
  key('fat', C0 + 4, { mouth: 'puzzlement', eyes: 'sad', sx: 0.94, sy: 1.04 }, 4);
  const DROP = C1, LB = DROP + 8, BL = 560;
  rope(DROP, 'wrapped');
  move('baby', LB, { x: BL, y: GROUND }, 'io');
  key('baby', LB, { z: 0, sx: 1.2, sy: 0.82, mouth: ' 1', eyes: 'normal' }, 1);
  key('baby', LB + 4, { sx: 1, sy: 1 }, 3);
  sfx('land', LB, { who: 'baby', gain: 0.5 });
  sfx('ref:laugh', LB, { who: 'baby', gain: 0.8, pitch: 1.3 });
  laugh('baby', LB + 2, LB + 14);
  tremble('fat', DROP, DROP + 8, FS, 4);
  ev('vein', { who: 'fat', f0: DROP, f1: DROP + 14 });
  key('fat', DROP + 2, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  const POP = DROP + 16;
  key('fat', POP, { sx: 1.35, sy: 1.32 }, 10, 'in');
  sfx('inflate', POP - 10, { who: 'fat', dur: 10, gain: 0.7 });
  key('fat', POP + 3, { sx: 0.92, sy: 0.94 }, 3, 'out');
  key('fat', POP + 8, { sx: 1, sy: 1, mouth: 'happy', eyes: 'normal' }, 5);
  sfx('pop', POP, { who: 'fat', gain: 1.0 });
  sfx('whoosh', POP + 1, { who: 'fat', dur: 4, gain: 0.7 });
  const WH = POP + 4;
  rope(POP, 'whip', { from: [FS - 200, GROUND - 260] });
  sfx('slap', WH, { who: 'baby', gain: 1.0 });
  ev('stars', { who: 'baby', f0: WH + 14, f1: WH + 30, snd: false });
  tumble('baby', WH, WH + 12, BL, 460, 110, -1, { hurt: true });
  key('baby', WH, { mouth: ' 5', eyes: 'sad' }, 0);
  rope(WH, 'fall', { from: target('baby:face', stateAt(WH)), to: [FS - 200, GROUND - 200] });
  rope(WH + 14, 'ground2');
  sfx('land', WH + 14, { x: 800, gain: 0.4 });
  sfx('ref:laugh', WH + 2, { who: 'fat', gain: 0.85, pitch: 0.75 });
  laugh('fat', WH + 2, WH + 18);

  // ---- 3.8–5 с: Малыш «растёт»
  const BX = 480;
  key('baby', WH + 12, { eyes: 'angry', mouth: ' 2' }, 0);
  const BB = transform('baby', WH + 12, 460, BX, 1, { style: 'grow' });
  key('baby', BB, stance('baby', BX, 1), 0);
  key('baby', BB + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('fat', BB - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('sweat', { who: 'fat', f0: BB, f1: BB + 20 });

  // ---- 5.3–7.7 с: прыгает через скакалку; Толстый прыгает к нему — петля его подхватывает
  const KB = C.baby.big, PU = BB + 10;
  key('baby', PU - 8, { lean: 24, hip: [0, toRig('baby', 110)], head: 8 }, 8);
  key('baby', PU, { hitF: 1, hitFto: [G2[0], G2[1] - 6], hitB: 1, hitBto: [G1[0], G1[1] - 6], hitFfix: PU, hitBfix: PU }, 6);
  sfx('pop', PU, { who: 'baby', gain: 0.5 });
  const HF = hand('baby', 'F', 0.35, 0.2), HB = hand('baby', 'B', -0.2, 0.25);
  key('baby', PU + 10, { ...stance('baby', BX, 1), hitF: 0, hitB: 0, handF: HF, handB: HB, mouth: 'happy with theeth', eyes: 'normal' }, 8);
  const SK0 = PU + 12, T0 = SK0 + 6, PER = 14;
  const phi = (f) => Math.PI / 2 + 2 * Math.PI * (f - T0) / PER;      // внизу в T0 + PER·k
  rope(PU, 'skip', { phi: (f) => (f < SK0 ? Math.PI / 2 + (f - PU) * 0.05 : phi(f)), rx: 300, ry: 330 });
  for (let k = 0; k < 3; k++) {
    const b = T0 + k * PER;
    move('baby', b - 5, { x: BX, y: GROUND });
    move('baby', b, { y: GROUND - 80 }, 'out2');
    move('baby', b + 5, { y: GROUND }, 'in2');
    key('baby', b - 4, { legFfk: 1, legBfk: 1, legF: [-20, 40], legB: [20, -30] }, 2);
    key('baby', b + 5, { legFfk: 0, legBfk: 0 }, 2);
    sfx('whoosh', b - 3, { who: 'baby', dur: 4, gain: 0.35 });
    sfx('flick', b, { x: BX, gain: 0.5 });
  }
  key('fat', SK0, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  hop('fat', SK0 + 4, SK0 + 14, FS, 1160, 120);
  hop('fat', SK0 + 18, SK0 + 28, 1160, 1000, 120);
  const CATCH = T0 + 2 * PER + 10;                                  // петля идёт вниз справа — подхватывает
  rope(CATCH, 'yoyo', { n: 2 });
  sfx('whoosh', CATCH - 2, { who: 'baby', gain: 0.6, dur: 6 });
  sfx('squish', CATCH, { who: 'fat', gain: 0.8 });
  key('fat', CATCH, { mouth: 'puzzlement', eyes: 'sad', sx: 0.9, sy: 1.08 }, 2);
  key('fat', CATCH + 4, { sx: 1, sy: 1 }, 3);

  // ---- 7.7–10.9 с: Толстый — йо-йо; «выгул собачки»
  const UP = CATCH + 8, HY = hand('baby', 'F', 0.95, -0.45);
  key('baby', UP, { handF: HY, handB: hand('baby', 'B', -0.3, 0.3), mouth: 'happy with theeth' }, 6);
  const dTopF = target('fat:top', stateAt(1))[1] - GROUND;
  const fatAt = (f, L) => { const h = KB.point(stateAt(f).baby.st, 'handF'); return [h[0] + 170, h[1] + L - dTopF]; };
  const hang = fatAt(UP + 4, 40), down = fatAt(UP + 4, 900);
  move('fat', CATCH, { x: 1000, y: GROUND, rot: 0 });
  key('fat', CATCH, { pivot: 508 }, 0);
  move('fat', UP + 4, { x: hang[0], y: hang[1] }, 'out2');
  sfx('whoosh', CATCH + 2, { who: 'fat', dur: 8, gain: 0.5 });
  let yo = UP + 4, rot = 0;
  for (let k = 0; k < 2; k++) {
    move('fat', yo + 10, { y: GROUND - 45 }, 'in2');
    move('fat', yo + 10, { rot: (rot += 540) }, 'lin');
    key('baby', yo + 8, { handF: hand('baby', 'F', 0.8, -0.35) }, 4);
    key('baby', yo + 12, { handF: HY }, 3, 'in2');
    sfx('whirr', yo, { who: 'fat', dur: 20, gain: 0.5 });
    sfx('bonk', yo + 10, { who: 'fat', gain: 0.5 });
    move('fat', yo + 20, { y: hang[1] }, 'out2');
    move('fat', yo + 20, { rot: (rot += 540) }, 'lin');
    sfx('ref:grunt', yo + 11, { who: 'fat', gain: 0.5, pitch: 0.8 });
    yo += 20;
  }
  key('fat', UP + 6, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  ev('stars', { who: 'fat', f0: UP + 10, f1: yo + 4, snd: false });
  sfx('ref:laugh', UP + 10, { who: 'baby', gain: 0.8, pitch: 1.25 });
  // «выгул собачки»: вниз — и катится по траве вперёд, шнур разматывается — отцепился
  const WK = yo, ROLL = WK + 8, DET = ROLL + 14, STOP = DET + 10, FX1 = 1560;
  key('baby', WK, { handF: hand('baby', 'F', 0.95, 0.05), lean: 8 }, 6);
  move('fat', ROLL, { x: hang[0] + 40, y: GROUND - 40 }, 'in2');
  move('fat', ROLL, { rot: (rot += 360) }, 'lin');
  rope(ROLL, 'walk');
  move('fat', DET, { x: 1350, y: GROUND - 40 }, 'lin');
  move('fat', DET, { rot: (rot += ((1350 - hang[0]) / (Math.PI * 450)) * 360) }, 'lin');
  sfx('whirr', ROLL, { who: 'fat', dur: STOP - ROLL, gain: 0.6 });
  rope(DET, 'hang');
  sfx('pop', DET, { who: 'fat', gain: 0.6 });
  move('fat', STOP, { x: FX1, y: GROUND }, 'out2');
  move('fat', STOP, { rot: rot + ((FX1 - 1350) / (Math.PI * 450)) * 360 }, 'out2');
  key('fat', STOP + 1, { rot: 0, pivot: 0 }, 0);
  key('fat', STOP, { sx: 1.15, sy: 0.88 }, 1);
  key('fat', STOP + 5, { sx: 1, sy: 1 }, 4);
  ev('stars', { who: 'fat', f0: STOP + 2, f1: STOP + 24, snd: false });
  sfx('bonk', STOP, { who: 'fat', gain: 0.6 });
  key('baby', DET + 2, { handF: hand('baby', 'F', 0.4, 0.1), lean: 0 }, 6);
  sfx('ref:laugh', DET + 4, { who: 'baby', gain: 0.85, pitch: 1.25 });
  chuckle('baby', DET + 4, DET + 26, { mouth: 'happy with theeth' });

  // ---- 11.2–15 с: всасывает скакалку, глотает спагетти, выплёвывает лассо — Малыш падает — «пуф»
  const MAD = STOP + 20;
  key('fat', MAD, { mouth: 'theeth smile', eyes: 'angry' }, 0);
  ev('vein', { who: 'fat', f0: MAD, f1: MAD + 12 });
  const SU = MAD + 10;
  fatOpen(SU, 2.8, 5, { eyes: 'angry' });
  sfx('suck', SU, { who: 'fat', dur: 24, gain: 0.9 });
  rope(SU, 'suck');
  key('baby', SU + 2, { mouth: 'puzzlement', eyes: 'sad', lean: 16, handF: hand('baby', 'F', 0.95, -0.25), handB: hand('baby', 'B', 0.7, -0.2) }, 4);
  const BX2 = BX + 90, KB2 = KB;
  move('baby', SU + 2, { x: BX, y: GROUND });
  move('baby', SU + 12, { x: BX2 }, 'in');
  key('baby', SU + 2, { ...KB2.feet(BX, 1) }, 0);
  key('baby', SU + 12, { ...KB2.feet(BX2, 1) }, 10, 'in');
  sfx('slide', SU + 2, { who: 'baby', gain: 0.6 });
  const LET = SU + 12, GULP = LET + 10;
  rope(LET, 'slurp', { from: KB.point(stateAt(LET).baby.st, 'handF') });
  key('baby', LET, { lean: -10, handF: hand('baby', 'F', 0.3, -0.5), handB: hand('baby', 'B', -0.3, -0.4) }, 3);
  key('baby', LET + 10, { ...stance('baby', BX2, 1), lean: 0, mouth: 'puzzlement' }, 8);
  sfx('slide', LET, { who: 'fat', gain: 0.6, pitch: 1.4 });
  rope(GULP, 'none');
  key('fat', GULP, { mouthK: 1, mouth: 'smile normal', sx: 1.12, sy: 0.92 }, 2);
  sfx('gulp', GULP, { who: 'fat', gain: 1.0 });
  for (let i = 0; i < 2; i++) {
    key('fat', GULP + 4 + i * 6, { sx: 1.1, sy: 0.94, mouth: 'happy' }, 3);
    key('fat', GULP + 7 + i * 6, { sx: 0.95, sy: 1.05, mouth: 'smile normal' }, 3);
    sfx('chomp', GULP + 4 + i * 6, { who: 'fat', gain: 0.6 });
  }
  const SPIT = GULP + 18, TIE = SPIT + 10;
  fatOpen(SPIT, 2.2, 2, { sx: 0.92, sy: 1.08 });
  key('fat', SPIT + 8, { mouthK: 1, sx: 1, sy: 1, mouth: 'theeth smile', eyes: 'angry' }, 5);
  sfx('spit', SPIT, { who: 'fat', gain: 1.0 });
  rope(SPIT, 'lasso', { from: target('fat:mouth', stateAt(SPIT)) });
  sfx('whoosh', SPIT, { who: 'fat', dur: 8, gain: 0.6 });
  rope(TIE, 'legs');
  sfx('flick', TIE, { who: 'baby', gain: 0.8 });
  key('baby', TIE, { mouth: 'puzzlement', eyes: 'sad', handF: hand('baby', 'F', 0.6, -0.6), handB: hand('baby', 'B', -0.5, -0.6) }, 3);
  for (let i = 0; i < 2; i++) { key('baby', TIE + 3 + i * 5, { lean: i % 2 ? -10 : 12 }, 3); }
  const FALL = TIE + 12, LIE = fallBack('baby', FALL, BX2, 1, { forward: true, n: 14, stars: 20, mouth: 'puzzlement' });
  sfx('ref:hit-ow', LIE + 1, { who: 'baby', gain: 0.9, pitch: 1.2 });
  key('fat', LIE, { mouth: 'happy', eyes: 'normal' }, 0);
  sfx('ref:laugh', LIE + 2, { who: 'fat', gain: 0.85, pitch: 0.75 });
  laugh('fat', LIE + 2, LIE + 20);
  const sm = shrink('baby', LIE + 14, BX2 + 160, 1, { mouth: ' 5', eyes: 'sad', smoke: 380 });
  key('baby', sm, { lean: 0, head: 0, hip: [0, 0], rot: 0, legF: null, legB: null, zB: null }, 0);
  move('baby', sm, { x: BX2 + 160, y: GROUND, rot: 0 });
  const G3a = [BX2 + 20, GROUND - 14], G3b = [BX2 + 90, GROUND - 14];
  rope(sm, 'ground2', { a: G3a, b: G3b, far: BX2 + 380 });

  // ---- 15.3–16.6 с: Малыш «растёт» снова
  key('baby', sm + 8, { eyes: 'angry', mouth: ' 2' }, 0);
  ev('vein', { who: 'baby', f0: sm + 8, f1: sm + 18 });
  const BX3 = BX2 + 160, BB2 = transform('baby', sm + 12, BX3, BX3 - 100, 1, { style: 'grow' });
  key('baby', BB2, stance('baby', BX3 - 100, 1), 0);
  key('baby', BB2 + 6, { mouth: 'happy with theeth', eyes: 'angry' }, 0);
  key('fat', BB2 - 2, { mouth: 'puzzlement', eyes: 'sad' }, 0);
  const BX4 = BX3 - 100;

  // ---- 17–20 с: Толстый разевает рот — Малыш «кормит» его скакалкой — дёргает: волчок
  const PK = BB2 + 8;
  key('baby', PK - 8, { lean: 24, hip: [0, toRig('baby', 110)], head: 8 }, 8);
  key('baby', PK, { hitF: 1, hitFto: [G3b[0], G3b[1] - 6], hitFfix: PK }, 6);
  sfx('pop', PK, { who: 'baby', gain: 0.5 });
  rope(PK, 'held');
  key('baby', PK + 10, { ...stance('baby', BX4, 1), hitF: 0, handF: hand('baby', 'F', 0.5, -0.4) }, 8);
  const SU2 = PK + 10;
  fatOpen(SU2, 2.8, 5, { eyes: 'angry', mouth: 'puzzlement' });
  sfx('suck', SU2, { who: 'fat', dur: 14, gain: 0.8 });
  const FEED = SU2 + 4, IN = FEED + 10;
  key('baby', FEED, { handF: hand('baby', 'F', 0.95, -0.35), lean: 8, mouth: 'happy with theeth' }, 4);
  rope(FEED, 'feed', { from: KB.point(stateAt(FEED).baby.st, 'handF') });
  sfx('whoosh', FEED, { who: 'baby', dur: 8, gain: 0.5 });
  rope(IN, 'pull');
  key('fat', IN, { mouthK: 1, mouth: 'smile normal', sx: 1.1, sy: 0.92 }, 2);
  sfx('gulp', IN, { who: 'fat', gain: 0.9 });
  key('fat', IN + 4, { sx: 1, sy: 1, mouth: 'happy', eyes: 'normal' }, 3);
  const YANK = IN + 12;
  key('baby', YANK - 3, { handF: hand('baby', 'F', 0.95, -0.3), lean: 10 }, 3);
  key('baby', YANK + 2, { handF: hand('baby', 'F', -0.6, 0.0), lean: -14, head: -6 }, 3, 'in2');
  key('baby', YANK + 12, { ...stance('baby', BX4, 1), handF: hand('baby', 'F', 0.2, 0.3), lean: 0, head: 0 }, 8);
  sfx('swing', YANK - 2, { who: 'baby', gain: 0.9 });
  rope(YANK + 4, 'held');
  // волчок: бешено крутится и носится зигзагом — за кадр
  key('fat', YANK, { pivot: 508, mouth: 'puzzlement', eyes: 'sad' }, 0);
  const path = [[YANK, FX1], [YANK + 8, 1300], [YANK + 16, 1720], [YANK + 24, 1380], [YANK + 34, 2300]];
  for (const [f, x] of path) move('fat', f, { x, y: GROUND - 40 }, 'io');
  move('fat', YANK, { rot: 0 });
  move('fat', YANK + 34, { rot: -3600 }, 'lin');
  key('fat', YANK, { sx: 0.92, sy: 1.06 }, 2);
  sfx('whirr', YANK, { who: 'fat', dur: 34, gain: 1.0 });
  sfx('scared', YANK + 4, { who: 'fat', gain: 0.7, pitch: 0.8 });
  for (const [f, x] of path.slice(1, 4)) ev('dust', { f, x, r: 40, n: 5 });
  ev('twinkle', { f: YANK + 32, at: [1810, GROUND - 260], n: 22, size: 56 });
  sfx('ref:laugh', YANK + 8, { who: 'baby', gain: 0.85, pitch: 1.25 });
  chuckle('baby', YANK + 8, YANK + 30, { mouth: 'happy with theeth' });
  const WIN = victory('baby', YANK + 30, BX4, { n: 9, stride: 110 });
  window.T = { GRAB, POP, WH, BB, SK0, CATCH, WK, DET, SU, GULP, SPIT, LIE, BB2, IN, YANK, WIN };
};

// ------------------------------------------------------------------ рисование
function drawRope(ctx, f, S, front) {
  const r = ropeAt(f, S);
  if (!r) return;
  if (!!r.behind === front) return;
  if (r.coils && front) {                          // витки вокруг Толстого
    const { c, rx, ry, n } = r.coils, full = Math.floor(n), part = n - full;
    for (let i = 0; i < Math.ceil(n); i++) {
      const dy = (-0.42 + i * 0.36) * ry, hw = rx * Math.sqrt(Math.max(0, 1 - (dy / ry) ** 2)) * 1.02, y = c[1] + dy;
      const k = i < full ? 1 : part;
      FX.jumpCord(ctx, [[c[0] - hw, y - 6], [c[0] - hw + hw * k, y + 22 * k], [c[0] - hw + 2 * hw * k, y - 6 * k]]);
    }
  }
  if (r.ankles && front) {
    const { x0, x1, y } = r.ankles;
    if (y !== null) for (let i = 0; i < 3; i++) FX.jumpCord(ctx, [[x0, y - 20 + i * 18], [(x0 + x1) / 2, y - 6 + i * 18], [x1, y - 20 + i * 18]]);
  }
  if (r.pts) FX.jumpCord(ctx, r.pts);
  if (r.loop) { ctx.save(); ctx.lineWidth = 12; ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.ellipse(r.loop.at[0], r.loop.at[1], r.loop.r, r.loop.r * 0.5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = '#ff4f9a'; ctx.stroke(); ctx.restore(); }
  for (const [x, y, a] of r.h) FX.ropeHandle(ctx, x, y, a);
}
ST.hooks.beforeChars.push((ctx, f, S, CAM) => { ctx.setTransform(...CAM); drawRope(ctx, f, S, false); });
ST.hooks.afterChars.push((ctx, f, S, CAM) => { ctx.setTransform(...CAM); drawRope(ctx, f, S, true); });

ST.start(BIG);
