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
//                moods: { angry, grin, big } — рты для превращения, voice — высота «ой»,
//                lie — на сколько поднять лежащего (толщина спины), vAngle — руки буквой V } }
//
// Звук — только эффекты, без музыки. Помощники и эффекты сами ставят звуковые метки:
// взмах перед ударом, удар, «ой» у того, кого ударили, прыжок, приземление, падение, дым…
// Сцена добавляет свои через sfx(вид, кадр, {who|at|x, gain}). Виды звуков — tools/sfx.py.
'use strict';

function Stage(cfg) {
  const FPS = 24, W = 1920, H = 1080, NF = cfg.frames || 600;
  const GROUND = cfg.ground || 816, EDGE = cfg.edge || 757;
  window.SCENE = { fps: FPS, duration: NF / FPS, width: W, height: H, name: cfg.name };
  const F = (f) => f / FPS;
  const TAU = Math.PI * 2;
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
    sweat: [], stars: [], twinkle: [], whoosh: [], hearteyes: [], hearts: [], wind: [], heartshot: [], suck: [], drool: [] };
  const SFX = [];
  const sfx = (kind, f, o = {}) => SFX.push({ kind, f, ...o });
  // эффект + его звук (если у эффекта он есть и не выключен snd: false)
  const ev = (kind, o) => {
    FX_EV[kind].push(o);
    if (o.snd === false) return;
    const g = o.gain;
    if (kind === 'spark') {
      // удар: взмах за 5 кадров, сам удар, «ой» у того, в кого попали ('кто:часть' или victim)
      if (o.swing !== false) sfx('swing', o.f - 5, { at: o.at, gain: 0.8 });
      sfx(o.snd || 'punch', o.f, { at: o.at, gain: g });
      const victim = o.victim || (typeof o.at === 'string' ? o.at.split(':')[0] : null);
      if (victim && o.hurt !== false) sfx('hurt', o.f + 2, { who: victim, gain: 0.9 });
    }
    else if (kind === 'twinkle') sfx((o.size || 46) >= 46 ? 'twinkle' : 'sparkle', o.f, { at: o.at, gain: g });
    else if (kind === 'stars') sfx('dizzy', o.f0, { who: o.who, dur: o.f1 - o.f0, gain: g ?? 0.8 });
    else if (kind === 'sweat') sfx('drip', o.f0 + 3, { who: o.who, gain: g ?? 0.7 });
    else if (kind === 'whoosh') sfx('whoosh', o.f - 3, { at: o.at, gain: g ?? 0.8 });
    else if (kind === 'hearts') sfx('love', o.f0, { who: o.who, gain: g });
    else if (kind === 'heartshot') {
      sfx('heart', o.f0, { at: o.from, gain: g });
      if (o.pop !== false) sfx('pop', o.f1, { at: o.to, gain: 0.6 });
    }
    else if (kind === 'wind') sfx('gust', o.f0, { x: (o.x0 + o.x1) / 2, dur: o.f1 - o.f0, gain: g });
    else if (kind === 'suck') sfx('suck', o.f0, { who: o.who, dur: o.f1 - o.f0, gain: g });
    else if (kind === 'drool') sfx('spit', o.f, { at: o.at, gain: g });
    else if (o.snd) sfx(o.snd, o.f ?? o.f0, { x: o.x, who: o.who, at: o.at, gain: g });
  };

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
    sfx('jump', f0 + 2, { who, gain: 0.55 });
    sfx('land', f1, { who, gain: 0.5 });
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
    sfx('whoosh', f0, { who, dur: (f1 - f0) * 0.6, gain: 0.5 });
    sfx('fall', f1, { who, gain: 0.9 });
    sfx('bounce', f1 + 5, { who, gain: 0.5 });
    if (o.hurt) sfx('hurt', f1 + 2, { who, gain: 0.8 });
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
  // o.fast — короткая злость и лучи (большой уже через ~1 с после начала)
  function transform(who, f, x, bigX, face, o = {}) {
    const A = o.fast ? 6 : 22, R = o.fast ? 8 : 14;   // злость, лучи — кадры
    key(who, f, { eyes: 'angry', mouth: mood(who, 'angry', 'sad') }, 0);
    ev('vein', { who, f0: f + 2, f1: f + A + 4 });
    ev('steam', { who, f0: f + 4, f1: f + A + 4 });
    tremble(who, f + 4, f + A, x, 2);
    key(who, f + A, { mouth: mood(who, 'grin', 'theeth smile') }, 0);
    ev('rays', { who, f0: f + A + 2, f1: f + A + 2 + R });
    tremble(who, f + A + 2, f + A + 2 + R, x, 6);
    key(who, f + A + 2, { sx: 1, sy: 1 }, 0);
    key(who, f + A + 2 + R, { sx: 1.1, sy: 1.1 }, R, 'lin');
    const g = f + A + 2 + R;
    sfx('anger', f + 2, { who, dur: A + 2, gain: 0.8 });
    sfx('powerup', f + A + 2, { who, dur: R, gain: 0.8 });
    sfx('poof', g, { who });
    sfx('grow', g + 6, { who, gain: 0.8 });
    ev('flash', { f: g, who });
    ev('smoke', { f: g, who, size: 700, dx: (bigX - x) / 2 });
    ev('shake', { f: g, amp: 14, n: 7 });
    ev('zoom', { f: g, n: 12, k: 0.05, who });
    key(who, g + 6, { form: 'big', x: bigX, face, sx: 0.55, sy: 0.55, look: 1, mouth: mood(who, 'big', 'mouth'), rot: 0, pivot: 0 }, 0);
    key(who, g + 10, { sx: 1.1, sy: 1.1 }, 4, 'out');
    key(who, g + 13, { sx: 0.96, sy: 0.96 }, 3);
    key(who, g + 16, { sx: 1, sy: 1 }, 3);
    // девушка стала большой — в неё влюбляются (o.love: кто, o.loveDur: сколько кадров)
    for (const w of [].concat(o.love || [])) love(w, g + 10, g + 10 + (o.loveDur || 50));
    return g + 6;
  }

  // обратно в маленькую версию: дым, вспышка, шарик выскакивает (0.6 -> 1.15 -> 1)
  function shrink(who, f, x, face, o = {}) {
    ev('flash', { f, who, strength: 0.25 });
    ev('smoke', { f, who, size: o.smoke || 460, dx: 0, y: GROUND - 210 });     // низко — над шариком
    ev('shake', { f, amp: 8, n: 6 });
    sfx('poof', f, { who });
    sfx('pop', f + 4, { who, gain: 0.7 });
    key(who, f + 4, { form: 'small', x, face, sx: 0.6, sy: 0.6, rot: 0, pivot: 0, look: o.look ?? 1,
      mouth: o.mouth || mood(who, 'small', 'smile normal'), eyes: o.eyes || 'normal' }, 0);
    key(who, f + 8, { sx: 1.15, sy: 1.15 }, 4, 'out');
    key(who, f + 12, { sx: 1, sy: 1 }, 4);
    return f + 4;
  }

  // ---------------------------------------------------------------- любовь
  // сердечки вместо глаз (центры глаз — animations/eyes.json), сердечки над головой, звук
  function love(who, f0, f1, o = {}) {
    ev('hearteyes', { who, f0, f1 });
    if (o.hearts !== false) ev('hearts', { who, f0: f0 + 2, f1: f1 - 2, snd: false });
    if (o.snd !== false) sfx('love', f0, { who, gain: o.gain ?? 0.8 });
    if (o.mouth !== false) key(who, f0, { mouth: o.mouth || mood(who, 'love', 'happy - spittle') }, 0);
  }
  // воздушный поцелуй: сердце летит по дуге от губ к лицу цели
  function blowKiss(who, f, tgt, o = {}) {
    sfx('kiss', f - 3, { who });
    ev('heartshot', { f0: f, f1: f + (o.n || 12), from: `${who}:lips`, to: tgt, size: o.size || 120 });
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
      sfx('step', fe, { x: tx, gain: 0.55 });
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

  // ---------------------------------------------------------------- приёмы больших
  // Длины и позы считаются от рига персонажа: руки — в долях длины руки, присед — в пикселях сцены.
  const big = (who) => C[who].big;
  const toRig = (who, v) => v / big(who).scale;                    // пиксели сцены -> пиксели рига
  function armLen(who, k = 'F') {
    const ch = big(who), a = ch.arm[k], b = ch.bones;
    const d = (i, j) => Math.hypot(b[j].base[0] - b[i].base[0], b[j].base[1] - b[i].base[1]);
    return d(a[0], a[1]) + d(a[1], a[2]);
  }
  const hand = (who, k, fwd, down) => { const L = armLen(who, k); return [fwd * L, down * L]; };

  // разворот на месте: на 1 кадр сжать, отразить, вернуть
  function turn(who, f, face, x) {
    key(who, f, { sx: 0.3 }, 1);
    key(who, f + 1, { face, ...big(who).feet(x, face) }, 0);
    key(who, f + 2, { sx: 1 }, 1);
  }

  // удар рукой: замах (рука назад) к f-4, в кадре f кисть точно в цели, проводка, возврат в стойку.
  // o: arm 'F'|'B', x, face (где стоит), back/to — позы кисти в долях руки, snd, hard (тряска и наезд), over
  function strike(who, f, tgt, o = {}) {
    const k = o.arm || 'F', H = 'hand' + k, HT = 'hit' + k;
    key(who, f - 4, { [H]: hand(who, k, ...(o.back || [-0.75, 0.25])), lean: -8, hip: [0, toRig(who, 18)], [HT]: 0 }, o.wind || 6);
    if (o.over !== false) key(who, f - 1, { over: k }, 0);
    key(who, f, { [H]: hand(who, k, ...(o.to || [0.95, -0.15])), lean: o.lean ?? 14, hip: [toRig(who, 6), toRig(who, 30)],
      [HT]: 1, [HT + 'to']: tgt, [HT + 'fix']: f, mouth: o.mouth || 'angry theeth' }, 4, 'in2');
    key(who, f + (o.hold || 4), { [HT]: 1 }, 0);
    key(who, f + (o.hold || 4) + 4, { [HT]: 0, over: null }, 4);
    if (o.x !== undefined) key(who, f + (o.ret || 16), stance(who, o.x, o.face), 10);
    ev('spark', { f, at: tgt, r: o.r || 70, snd: o.snd || 'punch', swing: false });
    sfx('swing', f - 5, { who, gain: 0.8 });
    ev('shake', { f, amp: o.hard ? 20 : 12, n: o.hard ? 14 : 9 });
    if (o.hard !== false) ev('zoom', { f, n: 12, k: o.hard ? 0.09 : 0.05, at: tgt });
  }

  // пинок: колено вверх (замах), стопа в цели в кадре f, нога назад, стойка
  function kick(who, f, tgt, o = {}) {
    key(who, f - 4, { legFfk: 1, legF: [62, -100], lean: -10, hip: [0, toRig(who, 10)], kickF: 0,
      handF: hand(who, 'F', -0.3, 0.6), handB: hand(who, 'B', -0.6, 0.5) }, o.wind || 6);
    key(who, f, { kickF: 1, kickFto: tgt, kickFfix: f, lean: -16, mouth: o.mouth || 'angry theeth' }, 4, 'in2');
    key(who, f + 5, { kickF: 1 }, 0);
    key(who, f + 11, { kickF: 0 }, 6);
    // нога обратно на землю (стопа — туда, где стояла), корпус ровно
    if (o.x !== undefined) key(who, f + 18, stance(who, o.x, o.face), 7);
    else key(who, f + 18, { legFfk: 0, lean: 0, hip: [0, toRig(who, 3)] }, 7);
    ev('spark', { f, at: tgt, r: o.r || 80, snd: o.snd || 'kick', swing: false });
    sfx('swing', f - 5, { who, gain: 0.8 });
    ev('shake', { f, amp: o.hard ? 22 : 14, n: o.hard ? 14 : 10 });
    if (o.hard !== false) ev('zoom', { f, n: 12, k: o.hard ? 0.1 : 0.05, at: tgt });
  }

  // отскок назад (уклон): корпус откинут, колени вперёд, приземлился на ноги
  function dodge(who, f, x0, x1, face, o = {}) {
    key(who, f, { hip: [0, toRig(who, 15)] }, 3);
    move(who, f, { x: x0, y: GROUND });
    key(who, f + 1, { legFfk: 1, legBfk: 1, legF: [12, -24], legB: [-14, 26], lean: -14, head: -6,
      hip: [toRig(who, -7), toRig(who, 15)], mouth: o.mouth || 'puzzlement' }, 3);
    move(who, f + 5, { y: GROUND - (o.h || 40) }, 'out2');
    move(who, f + 10, { y: GROUND }, 'in2');
    move(who, f + 10, { x: x1 }, 'out2');
    key(who, f + 8, { ...big(who).feet(x1, face), legFfk: 1, legBfk: 1 }, 0);
    key(who, f + 12, { legFfk: 0, legBfk: 0, hip: [0, toRig(who, 33)], lean: -4, head: 0 }, 3);
    key(who, f + 22, stance(who, x1, face), 10);
    ev('dust', { f: f + 10, x: x1, r: 30, n: 4, snd: 'land' });
    sfx('jump', f + 2, { who, gain: 0.5 });
  }

  // большой смеётся: голова кивает (f0..f1), рот смеётся
  function chuckle(who, f0, f1, o = {}) {
    key(who, f0, { mouth: o.mouth || 'happy with theeth', eyes: o.eyes || 'normal' }, 0);
    for (let f = f0 + 2; f < f1 - 2; f += 6) key(who, f, { head: ((f - f0) / 6) % 2 < 1 ? 6 : -4 }, 3);
    key(who, f1, { head: 0 }, 3);
  }

  // кружится после удара: n разворотов по 4 кадра, потом стойка и звёздочки
  function spinAround(who, f, x, face, o = {}) {
    const n = o.n || 6;
    key(who, f, { legFfk: 1, legBfk: 1, lean: 0, head: -6, hip: [0, toRig(who, 3)], mouth: 'puzzlement',
      handF: hand(who, 'F', 0.3, 0.9), handB: hand(who, 'B', -0.2, 0.9) }, 2);
    for (let i = 0; i < n; i++) {
      key(who, f + 3 + i * 4, { face: i % 2 ? face : -face }, 3);
      sfx('whoosh', f + 2 + i * 4, { who, dur: 4, gain: 0.35 });
    }
    const g = f + 3 + n * 4;
    key(who, g, { ...stance(who, x, face), head: -8 }, 3);
    ev('stars', { who, f0: g - 2, f1: g + (o.stars || 34) });
    for (let k = g + 4; k < g + (o.stars || 34) - 4; k += 8) key(who, k, { head: ((k - g) / 8) % 2 < 1 ? -8 : 4 }, 4);
    key(who, g + (o.stars || 34), { head: 0 }, 4);
    return g;
  }

  // большой прыгает невысоко и топает в точку x1 (o.h — высота, по гайду 80–100 px)
  function stomp(who, f, x0, x1, face, o = {}) {
    const n = o.n || 12, h = o.h || 90;
    key(who, f - 4, { hip: [0, toRig(who, 60)], lean: 8, mouth: 'angry theeth' }, 4);   // присел
    move(who, f, { x: x0, y: GROUND });
    key(who, f + 1, { legFfk: 1, legBfk: 1, legF: [40, -70], legB: [10, -60], hip: [0, 0], lean: 0,
      handF: hand(who, 'F', 0.4, -0.6), handB: hand(who, 'B', -0.4, -0.6) }, 3);
    move(who, f + n / 2, { y: GROUND - h }, 'out2');
    move(who, f + n, { y: GROUND }, 'in2');
    move(who, f + n, { x: x1 }, 'lin');
    key(who, f + n - 1, { ...big(who).feet(x1, face), legFfk: 1, legBfk: 1 }, 0);
    key(who, f + n + 1, { legFfk: 0, legBfk: 0, hip: [0, toRig(who, 40)], handF: hand(who, 'F', 0.3, 0.6),
      handB: hand(who, 'B', -0.3, 0.6) }, 2);
    key(who, f + n + 12, stance(who, x1, face), 8);
    sfx('jump', f + 1, { who, gain: 0.6 });
    ev('dust', { f: f + n, x: x1, r: 50, n: 6, snd: 'slam', gain: 0.8 });
    ev('shake', { f: f + n, amp: 16, n: 10 });
    return f + n;
  }

  // нырок вниз на согнутых коленях (удар проходит над головой): f0 вниз, f1 вверх.
  // Глубже 60 % длины ноги колени уже не сгибаются как надо — глубина ограничена.
  function duck(who, f0, f1, x, face, depth = 250) {
    const ch = big(who), lg = ch.leg.F, b = ch.bones;
    const d = (i, j) => Math.hypot(b[j].base[0] - b[i].base[0], b[j].base[1] - b[i].base[1]);
    depth = Math.min(depth, 0.6 * (d(lg[0], lg[1]) + d(lg[1], lg[2])) * ch.scale);
    key(who, f0, { hip: [0, toRig(who, depth)], lean: 0, head: -6, mouth: 'puzzlement',
      handF: hand(who, 'F', 0.2, 0.55), handB: hand(who, 'B', -0.1, 0.55) }, 5);
    key(who, f1, { hip: [0, toRig(who, depth)] }, 0);
    key(who, f1 + 8, stance(who, x, face), 8);
  }

  // получил удар: откинулся, отъехал назад на ногах (ступни скользят по земле), «ой»
  function recoil(who, f, x0, x1, face, o = {}) {
    key(who, f, { lean: -22, head: -14, hip: [toRig(who, -10), toRig(who, 20)], mouth: 'puzzlement', eyes: 'sad',
      handF: hand(who, 'F', 0.5, -0.4), handB: hand(who, 'B', -0.5, -0.3), legFfk: 1, legBfk: 1 }, 2, 'out');
    move(who, f, { x: x0 });
    move(who, f + 8, { x: x1 }, 'out2');
    key(who, f + 8, { ...big(who).feet(x1, face), legFfk: 1, legBfk: 1 }, 0);
    key(who, f + 12, { legFfk: 0, legBfk: 0, lean: -6, head: 0 }, 4);
    key(who, f + (o.ret || 22), stance(who, x1, face, { mouth: o.mouth || 'angry theeth', eyes: 'angry' }), 10);
    ev('dust', { f: f + 6, x: x1, r: 24, n: 3, snd: false });
  }

  // падает на спину: ноги прямые, руки за голову, лежит на траве; o.lift — толщина тела лёжа
  function fallBack(who, f, x, face, o = {}) {
    const n = o.n || 16;
    key(who, f, { legFfk: 1, legBfk: 1, legF: [0, 0, 0], legB: [0, 0, 0], mouth: o.mouth || 'puzzlement',
      handF: hand(who, 'F', 0.1, -0.95), handB: hand(who, 'B', -0.05, -0.95), zB: 'back', lean: 0, head: 0 }, o.dur || 5);
    key(who, f, { rot: 0, pivot: 0 }, 0);
    move(who, f, { x, y: GROUND });
    move(who, f + n, { rot: (o.forward ? 90 : -90) * face, y: GROUND - (o.lift || CAST[who].lie || 50) }, 'in');
    const h = big(who).height;
    const side = o.forward ? -face : face;                          // куда легла голова
    ev('dust', { f: f + n, x: x - side * h * 0.55, r: 80, n: 8, snd: 'slam' });
    ev('shake', { f: f + n, amp: 22, n: 16 });
    ev('zoom', { f: f + n, n: 14, k: 0.07, at: [x - side * h * 0.5, GROUND - 60] });
    sfx('whoosh', f + 2, { who, dur: n - 2, gain: 0.6 });
    if (o.stars !== false) ev('stars', { who, f0: f + n + 4, f1: f + n + 4 + (o.stars || 50) });
    return f + n;
  }

  // поскользнулся: передняя нога вылетает вперёд-вверх, падает на спину (ноги задраны), звёздочки
  function slip(who, f, x, face, o = {}) {
    const n = o.n || 12, h = big(who).height;
    // углы ног: положительный — назад, поэтому вперёд-вверх — отрицательный
    key(who, f, { legFfk: 1, legBfk: 1, legF: [-80, 10, 0], legB: [-40, 5, 0], lean: -10, head: -10,
      mouth: 'puzzlement', eyes: 'sad', handF: hand(who, 'F', 0.3, -0.95), handB: hand(who, 'B', -0.5, -0.8), zB: 'back' }, 3, 'out');
    key(who, f, { pivot: 0 }, 0);
    move(who, f, { x, y: GROUND, rot: 0 });
    move(who, f + n * 0.4, { y: GROUND - (o.up || 70) }, 'out2');
    move(who, f + n, { y: GROUND - (o.lift || CAST[who].lie || 50), rot: -90 * face }, 'in2');
    key(who, f + n, { legF: [-60, 10, 0], legB: [-30, 5, 0] }, 4);                 // лёжа ноги задраны
    sfx('whoosh', f, { who, dur: n, gain: 0.6 });
    sfx('scared', f + 1, { who, gain: 0.7 });
    ev('dust', { f: f + n, x: x - face * h * 0.5, r: 80, n: 8, snd: 'slam' });
    ev('shake', { f: f + n, amp: 20, n: 14 });
    sfx('hurt', f + n + 2, { who });
    if (o.stars !== false) ev('stars', { who, f0: f + n + 4, f1: f + n + 4 + (o.stars || 44) });
    return f + n;
  }

  // встаёт после падения на спину: поворот обратно за n кадров, стойка
  function getUp(who, f, x, face, o = {}) {
    const n = o.n || 14;
    move(who, f, { rot: (o.forward ? 90 : -90) * face, y: GROUND - (o.lift || CAST[who].lie || 50), x });
    move(who, f + n, { rot: 0, y: GROUND }, 'io');
    key(who, f + n, { ...stance(who, x, face), zB: null, mouth: o.mouth || 'angry theeth', eyes: 'angry' }, n);
    sfx('jump', f + 2, { who, gain: 0.4 });
    return f + n;
  }

  // улетает за кадр кувырком (o.to — куда, o.turns — обороты), на месте ухода — блеск
  function flyOff(who, f0, f1, from, to, o = {}) {
    const ch = big(who);
    key(who, f0, { pivot: (ch.anchor[1] - ch.top) / 2, legFfk: 1, legBfk: 1, legF: [-30, 50], legB: [25, -40],
      mouth: 'puzzlement', eyes: 'sad', handF: hand(who, 'F', -0.3, -0.8), handB: hand(who, 'B', -0.7, -0.5) }, 0);
    move(who, f0, { x: from[0], y: from[1], rot: 0 });
    move(who, f1, { x: to[0], rot: 360 * (o.turns || 3) * (to[0] > from[0] ? 1 : -1) }, 'lin');
    move(who, f1, { y: to[1] }, 'out2');
    sfx('whoosh', f0, { who, dur: f1 - f0, gain: 0.7 });
    sfx('scared', f0 + 2, { who, gain: 0.7 });
    const tx = E.clamp(to[0], 110, W - 110), ty = E.clamp(to[1], 90, H - 300);
    ev('twinkle', { f: f1 - 2, at: [tx, ty], n: 22, size: 56 });
  }

  // победа: идёт в центр (x = 960), поворачивается к зрителю, руки через стороны вверх буквой V, блеск
  function victory(who, f, x0, o = {}) {
    const face = o.face || (960 >= x0 ? 1 : -1), n = o.n || 10;
    const steps = Math.max(1, Math.round(Math.abs(960 - x0) / (o.stride || 95)));
    if (Math.abs(960 - x0) > 20) walk(who, f, x0, 960, steps, n, face);
    const g = f + (Math.abs(960 - x0) > 20 ? steps * n + 6 : 0);
    const a = E.rad(CAST[who].vAngle || 25);
    key(who, g, { look: 0, eyes: 'normal' }, 4);
    key(who, g + 6, { handF: hand(who, 'F', 0.97, -0.08), handB: hand(who, 'B', -0.97, -0.08) }, 3);
    key(who, g + 9, { handF: hand(who, 'F', 0.97 * Math.sin(a), -0.97 * Math.cos(a)),
      handB: hand(who, 'B', -0.97 * Math.sin(a), -0.97 * Math.cos(a)), head: -4, mouth: mood(who, 'win', 'happy with theeth') }, 3);
    const pts = [[-170, -560], [170, -620], [-200, -330], [210, -380], [0, -700], [-140, -460], [150, -240]];
    pts.forEach(([dx, dy], i) => { if (g + 10 + i * 8 < NF) ev('twinkle', { f: g + 10 + i * 8, at: [960 + dx, GROUND + dy], n: 16, size: 34 }); });
    return g + 9;
  }

  // ---------------------------------------------------------------- позы и точки
  const DEF = { x: 0, y: GROUND, face: 1, hip: [0, 0], lean: 0, head: 0, rot: 0, sx: 1, sy: 1, pivot: 0, look: 0,
    hide: [], legF: null, legB: null, hitF: 0, hitB: 0, kickF: 0, zF: null, zB: null, over: null, z: 0, alpha: 1, mouthK: 1 };

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
    front(ch, st, p) {                  // край тела со стороны взгляда, на середине высоты
      const c = ch.point(st, 'body');
      return [c[0] + (p.face || 1) * ch.width * 0.45 * (p.sx || 1), c[1]];
    },
    lips(ch, st) {
      const f = ch.point(st, 'face'), h = ch.point(st, 'head');
      return [h[0] + (f[0] - h[0]) * 1.3, f[1] + ch.height * 0.03];
    },
    jaw(ch, st) {
      const f = ch.point(st, 'face'), h = ch.point(st, 'head');
      return [f[0] - (f[0] - h[0]) * 0.2, f[1] + (ch.height * 0.06)];
    },
  };
  function target(spec, S) {
    if (Array.isArray(spec)) return spec;                          // точка сцены
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
  const hooks = { drawPose: null, afterChars: [], beforeChars: [] };   // сцена: скрыть слой, дорисовать предмет
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
    for (const fn of hooks.beforeChars) { fn(ctx, f, S, CAM); ctx.setTransform(...CAM); }   // деревья, домики — позади всех
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
    // персонажи от дальнего к ближнему; влюблённым прячем глаза — вместо них сердечки
    const loveEyes = (who) => FX_EV.hearteyes.filter((h) => h.who === who && f >= h.f0 && f <= h.f1);
    const ORD = [...ORDER].sort((a, b) => (S[a].p.z || 0) - (S[b].p.z || 0));   // z — временно дальше/ближе
    for (const who of ORD) {
      const { ch, st, p } = S[who];
      if (p.alpha === 0) continue;
      let pp = hooks.drawPose ? hooks.drawPose(who, p, f) : p;
      const info = (h) => (h.layer ? { layer: h.layer, eyes: h.eyes, hide: [h.layer] } : eyeInfo(ch));
      for (const h of loveEyes(who)) pp = { ...pp, hide: [...(pp.hide || []), ...info(h).hide] };
      ch.draw(ctx, { ...st, p: pp }, CAM);
      ctx.setTransform(...CAM);
      for (const h of loveEyes(who)) {
        const { layer, eyes } = info(h);
        const M = ch.eyeMatrix(st, layer), k = 1 + 0.12 * Math.sin(t * TAU * 3);
        for (const [ex, ey, er] of eyes) {
          const q = E.apply(M, [ex, ey]);
          FX.heart(ctx, q[0], q[1], er * 2.6 * ch.scale * k * Math.min(1, (f - h.f0 + 1) / 4));
        }
      }
    }
    // бьющая рука поверх соперника
    for (const who of ORDER) {
      const { ch, st, p } = S[who];
      if (p.over) ch.draw(ctx, { ...st, p: { ...p, only: p.over } }, CAM);
    }
    for (const fn of hooks.afterChars) fn(ctx, f, S, CAM);
    ctx.setTransform(...CAM);
    // любовь и ветер
    for (const h of FX_EV.hearts) {
      if (f < h.f0 || f > h.f1) continue;
      const { ch, st } = S[h.who], top = h.part ? target(`${h.who}:${h.part}`, S) : ch.point(st, 'top');
      FX.hearts(ctx, top[0], top[1] + 20, (f - h.f0) / FPS, Math.min(1, (h.f1 - f) / 8));
    }
    for (const w of FX_EV.wind) FX.wind(ctx, w.x0, w.x1, GROUND, (f - w.f0) / (w.f1 - w.f0), w.f0);
    for (const k of FX_EV.suck) {
      if (f < k.f0 || f > k.f1) continue;
      const m = target(k.at, S), fade = Math.min(1, (f - k.f0) / 6, (k.f1 - f) / 6);
      FX.suck(ctx, m[0], m[1], k.x0, GROUND, (f - k.f0) / FPS, fade, k.f0);
    }
    for (const d of FX_EV.drool) {
      const u = (f - d.f) / (d.n || 20);
      if (u < 0 || u > 1) continue;
      const m = typeof d.at === 'string' ? target(d.at, statesAt(d.f)) : d.at;
      FX.drool(ctx, m[0], m[1], u, d.dir || 1, d.f);
    }
    for (const h of FX_EV.heartshot) {           // большое сердце летит по дуге в лицо
      const u = (f - h.f0) / (h.f1 - h.f0);
      const a = typeof h.from === 'string' ? target(h.from, statesAt(h.f0)) : h.from;
      const b = typeof h.to === 'string' ? target(h.to, statesAt(h.f1)) : h.to;
      const size = h.size || 120;
      if (u >= 0 && u <= 1) {
        FX.heart(ctx, E.lerp(a[0], b[0], u), E.lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * 60,
          size * (0.5 + 0.5 * Math.min(1, u * 3)) * (1 + 0.1 * Math.sin(f * 1.3)), 1, Math.sin(f * 0.5) * 0.15);
      } else if (u > 1 && f - h.f1 <= 12) {     // лопнуло: колечко маленьких сердечек
        const v = (f - h.f1) / 12;
        for (let i = 0; i < 8; i++) {
          const ang = i / 8 * TAU;
          FX.heart(ctx, b[0] + Math.cos(ang) * (30 + 110 * v), b[1] + Math.sin(ang) * (30 + 90 * v), 34, 1 - v, ang);
        }
      }
    }
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
      FX.smoke(ctx, base[0] + (s.dx || 0), s.y ?? GROUND - 380, s.size, u, s.f);
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

  // глаза рига для сердечек: слой, центры, какие слои спрятать (весь переключатель глаз)
  let EYES = {};
  function eyeInfo(ch) {
    const e = EYES[ch.name];
    const sw = ch.rig.switches.find((x) => x.children.some((c) => c.name === e.layer));
    return { layer: e.layer, eyes: e.eyes, hide: sw ? sw.children.map((c) => c.name) : [e.layer] };
  }

  // звук ролика для tools/sfx.py: метки (секунды, вид, громкость, панорама по месту на сцене)
  function audio() {
    const xOf = (c) => {
      if (c.x !== undefined) return c.x;
      const S = statesAt(Math.min(NF - 1, Math.max(0, Math.round(c.f))));
      if (c.at) return (typeof c.at === 'string' ? target(c.at, S) : c.at)[0];
      return c.who ? S[c.who].p.x : W / 2;
    };
    // «ой»: маленький (шарик) пищит выше, большой — ниже; у каждого ещё свой голос (cast.voice)
    const pitchOf = (c) => {
      if (c.pitch || c.kind !== 'hurt' || !c.who) return c.pitch;
      const p = statesAt(Math.min(NF - 1, Math.round(c.f)))[c.who].p;
      return (p.form === 'big' ? 0.85 : 1.3) * (CAST[c.who].voice || 1);
    };
    const cues = SFX.filter((c) => c.f >= 0 && c.f < NF).sort((a, b) => a.f - b.f).map((c) => ({
      t: c.f / FPS, kind: c.kind, gain: c.gain ?? 1, dur: c.dur ? c.dur / FPS : 0, pitch: pitchOf(c),
      pan: (E.clamp((xOf(c) - W / 2) / (W / 2), -1, 1) * 0.6) || 0 }));
    return { duration: NF / FPS, cues };
  }

  // загрузка ригов, затем позы больших (им нужны размеры рук и ног), затем рендер по кадрам
  function start(big) {
    const ctx = document.getElementById('stage').getContext('2d');
    window.READY = (async () => {
      for (const [who, c] of Object.entries(CAST)) {
        C[who] = { small: new E.Character(await E.loadRig(c.small[0], c.small[1]), c.small[1]) };
        if (c.big) C[who].big = new E.Character(await E.loadRig(c.big[0], c.big[1]), c.big[1]);
      }
      EYES = await (await fetch('/animations/eyes.json')).json();
      if (big) big();
      for (const k of Object.keys(cache)) delete cache[k];             // состояния, посчитанные до всех ключей
      BG = FX.background(W, H, EDGE, cfg.background || {});
    })();
    window.renderFrame = (f) => renderFrame(f, ctx);
    window.SCENE.audio = audio;
  }

  // кусок фона поверх персонажа (воткнулся головой в землю — голова «под землёй»)
  function bgPatch(ctx, x, y, w, h) {
    ctx.drawImage(BG.canvas, x + BG.margin, y + BG.margin, w, h, x, y, w, h);
  }

  // stateAt — то же, что statesAt, но без кэша: можно звать, пока ключи ещё ставятся
  return { FPS, W, H, NF, GROUND, EDGE, F, CAST, C, key, move, ev, sfx, hop, tumble, laugh, tremble, transform,
    love, blowKiss, stance, walk, turn, strike, kick, dodge, duck, recoil, fallBack, flyOff, victory, hand, toRig,
    chuckle, spinAround, stomp, getUp, slip, shrink,
    target, parts, statesAt, stateAt: evalStates, hooks, start, bgPatch };
}
