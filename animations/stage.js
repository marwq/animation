// Общая сцена драки по стилю «animal hospital long» (docs/animal_hospital_long.md):
// дорожки ключей, эффекты, помощники движения и сборка кадра. Сцена ролика описывает
// только состав и сюжет:
//
//   const ST = Stage({ name: 'baby-vs-fat', cast: {...}, order: ['fat', 'baby'] });
//   const { key, move, ev, hop, ... } = ST;
//   key('baby', 0, {...}, 0);  ...
//   ST.start(() => { /* позы больших — после загрузки ригов */ });
//
// Время — в кадрах. key(кто, кадр, {свойства}, n) — поза-на-позу: прежняя поза держится
// и меняется за последние n кадров до кадра. move(...) — непрерывное движение от
// прошлого ключа (дуги прыжков, полёты). Свойства позы — см. animations/engine.js.
//
// cast: { кто: { small: [риг, опции], big: [риг, опции] (если есть), pivot,
//                moods: { angry, grin, big } — рты для превращения } }
'use strict';

function Stage(cfg) {
  const FPS = 24, W = 1920, H = 1080, NF = cfg.frames || 600;
  const GROUND = cfg.ground || 816, EDGE = cfg.edge || 757;
  window.SCENE = { fps: FPS, duration: NF / FPS, width: W, height: H, name: cfg.name };
  const F = (f) => f / FPS;
  const CAST = cfg.cast;
  const ORDER = cfg.order || Object.keys(CAST);   // от дальнего к ближнему
  const TR = {};
  for (const who of Object.keys(CAST)) TR[who] = new E.Track();
  const key = (who, f, props, n = 4, ease = 'io') => TR[who].add(F(f), props, ease, n === null ? null : F(n));
  const move = (who, f, props, ease = 'io') => TR[who].add(F(f), props, ease, null);
  const C = {};   // C.lord.small, C.lord.big ...
  const mood = (who, k, def) => (CAST[who].moods && CAST[who].moods[k]) || def;

  // ---------------------------------------------------------------- события эффектов
  const FX_EV = { spark: [], shake: [], zoom: [], dust: [], smoke: [], flash: [], rays: [], vein: [], steam: [],
    sweat: [], stars: [], twinkle: [], whoosh: [] };
  const ev = (kind, o) => FX_EV[kind].push(o);

  // ---------------------------------------------------------------- помощники движения
  // шарик: прыжок с подготовкой (сквош), отрывом (вытягивание) и приземлением
  function hop(who, f0, f1, x0, x1, h, o = {}) {
    const mid = Math.round((f0 + f1) / 2);
    key(who, f0, { sx: 1.2, sy: 0.82 }, o.prep ?? 4);
    move(who, f0, { x: x0, y: GROUND });
    key(who, f0 + 2, { sx: 0.86, sy: 1.16 }, 2);
    move(who, mid, { y: GROUND - h }, 'out2');
    key(who, mid, { sx: 1, sy: 1 }, 3);
    move(who, f1, { y: GROUND }, 'in2');
    move(who, f1, { x: x1 }, 'lin');
    key(who, f1, { sx: o.land || 1.22, sy: o.landY || 0.8 }, 1);
    key(who, f1 + 3, { sx: 0.95, sy: 1.06 }, 3);
    key(who, f1 + 7, { sx: 1, sy: 1 }, 4);
    if (o.dust) ev('dust', { f: f1, x: x1, r: 30, n: 4 });
  }

  // шарик: отлёт кувырком по дуге (вращение вокруг центра), приземление, отскок, звёздочки
  function tumble(who, f0, f1, x0, x1, h, turns, o = {}) {
    const mid = Math.round(f0 + (f1 - f0) * 0.42);
    key(who, f0, { pivot: CAST[who].pivot }, 0);
    move(who, f0, { x: x0, y: GROUND, rot: 0 });
    move(who, mid, { y: GROUND - h }, 'out2');
    move(who, f1, { y: GROUND }, 'in2');
    move(who, f1, { x: x1 }, 'out2');
    move(who, f1, { rot: 360 * turns }, 'lin');
    key(who, f1 + 1, { rot: 0 }, 0);
    key(who, f1, { sx: 1.32, sy: 0.7 }, 1);
    move(who, f1 + 5, { y: GROUND - 45 }, 'out2');
    key(who, f1 + 5, { sx: 0.94, sy: 1.08 }, 4);
    move(who, f1 + 10, { y: GROUND }, 'in2');
    key(who, f1 + 10, { sx: 1.12, sy: 0.9 }, 2);
    key(who, f1 + 16, { sx: 1, sy: 1 }, 5);
    ev('dust', { f: f1, x: x1, r: 36, n: 6 });
    ev('shake', { f: f1, amp: 8, n: 8 });
    if (o.stars) ev('stars', { who, f0: f1 + 4, f1: f1 + 4 + o.stars });
  }

  // смех шарика: пульс 1.05×0.95 <-> 0.97×1.03 каждые 4 кадра
  function laugh(who, f0, f1) {
    for (let f = f0, i = 0; f < f1; f += 4, i++) key(who, f, i % 2 ? { sx: 0.97, sy: 1.03 } : { sx: 1.05, sy: 0.95 }, 2);
    key(who, f1, { sx: 1, sy: 1 }, 3);
  }

  // дрожь: x вокруг x0 на ±a пикселей каждый кадр
  function tremble(who, f0, f1, x0, a) {
    const r = FX.rng(f0 + 7);
    key(who, f0, { x: x0 }, 0);
    for (let f = f0 + 1; f < f1; f++) key(who, f, { x: x0 + (r() * 2 - 1) * a }, 1, 'lin');
    key(who, f1, { x: x0 }, 1, 'lin');
  }

  // превращение по формуле гайда: злость (жилка, пар) -> ухмылка, лучи, дрожь и рост ->
  // вспышка и дым -> из дыма большая версия (0.55 -> 1.1 -> 0.96 -> 1)
  function transform(who, f, x, bigX, face) {
    key(who, f, { eyes: 'angry', mouth: mood(who, 'angry', 'sad') }, 0);
    ev('vein', { who, f0: f + 2, f1: f + 26 });
    ev('steam', { who, f0: f + 4, f1: f + 26 });
    tremble(who, f + 4, f + 22, x, 2);
    key(who, f + 22, { mouth: mood(who, 'grin', 'theeth smile') }, 0);
    ev('rays', { who, f0: f + 24, f1: f + 38 });
    tremble(who, f + 24, f + 38, x, 6);
    key(who, f + 24, { sx: 1, sy: 1 }, 0);
    key(who, f + 38, { sx: 1.1, sy: 1.1 }, 14, 'lin');
    const g = f + 38;
    ev('flash', { f: g, who });
    ev('smoke', { f: g, who, size: 700, dx: (bigX - x) / 2 });
    ev('shake', { f: g, amp: 14, n: 7 });
    ev('zoom', { f: g, n: 12, k: 0.05, who });
    key(who, g + 6, { form: 'big', x: bigX, face, sx: 0.55, sy: 0.55, look: 1, mouth: mood(who, 'big', 'mouth'), rot: 0, pivot: 0 }, 0);
    key(who, g + 10, { sx: 1.1, sy: 1.1 }, 4, 'out');
    key(who, g + 13, { sx: 0.96, sy: 0.96 }, 3);
    key(who, g + 16, { sx: 1, sy: 1 }, 3);
    return g + 6;
  }

  // большой: стойка как в риге (стопы на месте, руки висят чуть вперёд)
  function stance(who, x, face, extra = {}) {
    const ch = C[who].big;
    const rf = ch.handRest('F'), rb = ch.handRest('B');
    return { x, y: GROUND, face, hip: [0, 8], lean: 0, head: 0, ...ch.feet(x, face),
      handF: [rf[0] + 70, rf[1] - 60], handB: [rb[0] - 10, rb[1] - 20], legFfk: 0, legBfk: 0, ...extra };
  }

  // большой: ходьба. Опорная стопа стоит, задняя переносится вперёд с подъёмом
  // (колено вперёд), тело ниже всего, когда ноги шире всего; руки чуть качаются.
  function walk(who, f0, x0, x1, steps, n = 10, face = 1, swing = true) {
    const ch = C[who].big;
    const pos = ch.feet(x0, face);
    const rf = ch.handRest('F'), rb = ch.handRest('B');
    for (let i = 0; i < steps; i++) {
      const fs = f0 + i * n, fe = fs + n;
      const behind = face * pos.footF[0] < face * pos.footB[0] ? 'footF' : 'footB';
      const ahead = behind === 'footF' ? 'footB' : 'footF';
      const xb = x0 + (x1 - x0) * Math.min(1, (i + 2) / steps);
      let tx = ch.feet(xb, face)[behind][0];
      if (i < steps - 1 && face * (tx - pos[ahead][0]) < 50) tx = pos[ahead][0] + face * 80;
      key(who, fs, { [behind]: [pos[behind][0], 0] }, 0);
      move(who, fs + n / 2, { [behind]: [(pos[behind][0] + tx) / 2, 30] }, 'out2');
      move(who, fe, { [behind]: [tx, 0] }, 'in2');
      key(who, fs + n / 2, { hip: [0, -4] }, n / 2);
      key(who, fe, { hip: [0, 16] }, n / 2);
      if (swing) {
        const fw = behind === 'footB' ? 1 : -1;   // рука напротив ноги
        key(who, fs + n / 2, { handF: [rf[0] + 70 + fw * 70, rf[1] - 60], handB: [rb[0] - fw * 70, rb[1] - 20] }, n / 2);
      }
      pos[behind] = [tx, 0];
    }
    move(who, f0, { x: x0 });
    move(who, f0 + steps * n, { x: x1 }, 'lin');
    key(who, f0 + steps * n + 4, { hip: [0, 8] }, 4);
    if (swing) key(who, f0 + steps * n + 4, { handF: [rf[0] + 70, rf[1] - 60], handB: [rb[0] - 10, rb[1] - 20] }, 4);
  }

  // ---------------------------------------------------------------- позы и точки
  const DEF = { x: 0, y: GROUND, face: 1, hip: [0, 0], lean: 0, head: 0, rot: 0, sx: 1, sy: 1, pivot: 0, look: 0,
    hide: [], legF: null, legB: null, hitF: 0, hitB: 0, kickF: 0, zF: null, zB: null, over: null };

  function poseOf(who, f) {
    const p = TR[who].sample(F(f), { ...DEF });
    const ch = C[who][p.form || 'small'];
    if (p.form !== 'big') {   // у шарика нет рук и ног
      for (const k of Object.keys(p)) if (/^(foot|hand|leg|arm|hit|kick)/.test(k)) delete p[k];
    }
    return { p, ch };
  }

  // точки на персонаже для ударов и эффектов: 'кто:часть'. Свои части сцена добавляет в ST.parts
  const parts = {
    cheek(ch, st) {                     // край лица со стороны удара — сюда ложится ладонь
      const f = ch.point(st, 'face'), h = ch.point(st, 'head');
      return [h[0] + (f[0] - h[0]) * 1.4, f[1]];
    },
    jaw(ch, st) {
      const f = ch.point(st, 'face'), h = ch.point(st, 'head');
      return [f[0] - (f[0] - h[0]) * 0.2, f[1] + (ch.height * 0.06)];
    },
  };
  function target(spec, S) {
    const [who, part] = spec.split(':');
    const { ch, st } = S[who];
    return parts[part] ? parts[part](ch, st, S[who].p) : ch.point(st, part);
  }

  function evalStates(f) {
    const S = {};
    for (const who of Object.keys(TR)) {
      const { p, ch } = poseOf(who, f);
      S[who] = { ch, st: ch.pose(p, { ground: GROUND }), p };
    }
    for (const who of Object.keys(TR)) {
      const { p, ch } = S[who];
      const reach = {};
      // после кадра удара (…fix) цель замирает: рука не тянется за улетающим соперником
      for (const k of ['hitF', 'hitB', 'kickF']) {
        if (!(p[k] > 0)) continue;
        const fix = p[k + 'fix'];
        reach[k] = { at: target(p[k + 'to'], fix !== undefined && f > fix ? statesAt(fix) : S), w: p[k] };
      }
      if (Object.keys(reach).length) S[who].st = ch.pose(p, { ground: GROUND, ...reach });
    }
    return S;
  }
  const cache = {};
  const statesAt = (f) => cache[f] || (cache[f] = evalStates(f));

  // ---------------------------------------------------------------- сборка кадра
  const CLOUDS = cfg.clouds || [[140, 70, 1.2, 0, 26], [620, 200, 0.9, 1, 20], [980, 60, 1.0, 2, 30],
    [1320, 150, 1.3, 0, 22], [1700, 250, 0.8, 1, 34], [420, 300, 0.7, 2, 18]];
  const hooks = { drawPose: null, afterChars: [] };   // сцена: скрыть слой, дорисовать предмет
  let BG;

  function renderFrame(f, ctx) {
    const t = F(f);
    const S = evalStates(f);
    // камера: стоит; трясётся и коротко наезжает на ударах
    let sx = 0, sy = 0, zk = 0, zc = [W / 2, H / 2];
    for (const s of FX_EV.shake) {
      const u = (f - s.f) / s.n;
      if (u >= 0 && u < 1) { const a = s.amp * (1 - u); sx += a * Math.sin(f * 2.7 + s.f); sy += a * Math.cos(f * 3.1 + s.f); }
    }
    for (const z of FX_EV.zoom) {
      const u = (f - z.f) / z.n;
      if (u >= 0 && u < 1) {
        zk = z.k * Math.sin(Math.PI * Math.min(1, u * 1.6));
        zc = z.at ? (typeof z.at === 'string' ? target(z.at, statesAt(z.f)) : z.at) : S[z.who].ch.point(S[z.who].st, 'body');
      }
    }
    const zz = 1 + zk;
    const CAM = E.mul(E.T(sx + zc[0], sy + zc[1]), E.mul(E.S(zz, zz), E.T(-zc[0], -zc[1])));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.setTransform(...CAM);
    ctx.drawImage(BG.canvas, -BG.margin, -BG.margin);
    for (const [x0, y, s, kind, v] of CLOUDS) {
      const span = W + 300;
      FX.cloud(ctx, ((x0 + v * t + 150) % span) - 150, y, s, kind);
    }
    // тени
    for (const who of Object.keys(S)) {
      const { ch, st, p } = S[who];
      if (p.alpha === 0) continue;
      const foot = E.apply(st.G, ch.anchor);
      const air = Math.max(0, GROUND - foot[1]);
      const w = (p.form === 'big' ? 120 : ch.width * 0.42) * Math.max(0.35, 1 - air / 700);
      if (foot[1] > -200) FX.shadow(ctx, foot[0], GROUND + 6, w, 0.3 * Math.max(0.25, 1 - air / 600));
    }
    // лучи — за спиной
    for (const r of FX_EV.rays) {
      if (f < r.f0 || f > r.f1 + 6) continue;
      const { ch, st } = S[r.who];
      const c = ch.point(st, 'body');
      FX.rays(ctx, c[0], c[1], 420, Math.min(1, (f - r.f0) / (r.f1 - r.f0)) * (f > r.f1 ? 1 - (f - r.f1) / 6 : 1), t * 0.6);
    }
    // персонажи от дальнего к ближнему
    for (const who of ORDER) {
      const { ch, st, p } = S[who];
      const pp = hooks.drawPose ? hooks.drawPose(who, p, f) : p;
      ch.draw(ctx, { ...st, p: pp }, CAM);
    }
    // бьющая рука поверх соперника
    for (const who of ORDER) {
      const { ch, st, p } = S[who];
      if (p.over) ch.draw(ctx, { ...st, p: { ...p, only: p.over } }, CAM);
    }
    for (const fn of hooks.afterChars) fn(ctx, f, S, CAM);
    ctx.setTransform(...CAM);
    // эффекты поверх
    const at = (o, g) => (typeof o.at === 'string' ? target(o.at, statesAt(g)) : o.at);
    for (const d of FX_EV.dust) FX.dust(ctx, d.x, GROUND + 4, d.r, (f - d.f) / 18, d.n, d.f);
    for (const s of FX_EV.spark) { const u = (f - s.f) / 8; if (u >= 0 && u <= 1) { const p = at(s, s.f); FX.spark(ctx, p[0], p[1], s.r, u, s.f); } }
    for (const w of FX_EV.whoosh) { const u = (f - w.f) / 14; if (u >= 0 && u <= 1) FX.whoosh(ctx, w.at[0], w.at[1], u); }
    for (const s of FX_EV.smoke) {
      const u = (f - s.f) / 40;
      if (u < 0 || u > 1) continue;
      const { ch, st } = statesAt(s.f)[s.who];   // облако стоит там, где началось превращение
      const base = E.apply(st.G, ch.anchor);
      FX.smoke(ctx, base[0] + (s.dx || 0), GROUND - 380, s.size, u, s.f);
    }
    for (const v of FX_EV.vein) {
      if (f < v.f0 || f > v.f1) continue;
      const { ch, st } = S[v.who], top = ch.point(st, 'top'), h = ch.point(st, 'head');
      const side = (st.p.face || 1);
      FX.vein(ctx, h[0] - side * ch.height * 0.22, top[1] + ch.height * 0.12, 1.4, t);
    }
    for (const v of FX_EV.steam) {
      if (f < v.f0 || f > v.f1) continue;
      const { ch, st } = S[v.who], top = ch.point(st, 'top');
      FX.steam(ctx, top[0], top[1] - 10, (f - v.f0) / FPS, 1.1);
    }
    for (const v of FX_EV.sweat) {
      if (f < v.f0 || f > v.f1) continue;
      const { ch, st } = S[v.who], h = ch.point(st, 'head');
      const side = -(st.p.face || 1);
      const u = (f - v.f0) / (v.f1 - v.f0);
      FX.sweat(ctx, h[0] + side * (ch.height * (st.p.form === 'big' ? 0.16 : 0.42)), h[1] - ch.height * 0.08 + u * 30, 1.3, Math.min(1, (v.f1 - f) / 6));
    }
    for (const v of FX_EV.stars) {
      if (f < v.f0 || f > v.f1) continue;
      const { ch, st } = S[v.who], top = ch.point(st, 'top');
      FX.stars(ctx, top[0], top[1] - 18, (f - v.f0) / FPS, st.p.form === 'big' ? 80 : 70);
    }
    for (const w of FX_EV.twinkle) FX.twinkle(ctx, w.at[0], w.at[1], (f - w.f) / (w.n || 20), w.size || 46);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const fl of FX_EV.flash) {
      const u = (f - fl.f) / 4;
      if (u < 0 || u > 1) continue;
      const p = fl.at ? at(fl, fl.f) : S[fl.who].ch.point(S[fl.who].st, 'body');
      FX.flash(ctx, W, H, p[0], p[1], u, fl.strength || 0.35);
    }
  }

  // загрузка ригов, затем позы больших (им нужны размеры рук и ног), затем рендер по кадрам
  function start(big) {
    const ctx = document.getElementById('stage').getContext('2d');
    window.READY = (async () => {
      for (const [who, c] of Object.entries(CAST)) {
        C[who] = { small: new E.Character(await E.loadRig(c.small[0]), c.small[1]) };
        if (c.big) C[who].big = new E.Character(await E.loadRig(c.big[0]), c.big[1]);
      }
      if (big) big();
      BG = FX.background(W, H, EDGE, cfg.background || {});
    })();
    window.renderFrame = (f) => renderFrame(f, ctx);
  }

  return { FPS, W, H, NF, GROUND, EDGE, F, CAST, C, key, move, ev, hop, tumble, laugh, tremble, transform,
    stance, walk, target, parts, statesAt, hooks, start };
}
