// Движок анимации риговых персонажей (rigs/<имя>/): PNG-слои, кости, IK, сцена.
//
// Каждый PNG-слой привязан к кости (rig.json: layers[].bone). Поза задаётся
// поворотами костей вокруг их суставов (base), дочерние кости едут вместе с
// родительской — так локоть всегда остаётся на конце плеча, колено на конце бедра.
// Руки и ноги можно ставить через IK по двум звеньям (плечо–предплечье,
// бедро–голень): задаётся точка кисти/щиколотки, углы считаются сами, а сторона
// сгиба фиксирована — колени наружу, локти вниз.
//
// Координаты персонажа — пиксели его холста из rig.json (+x вперёд, к сопернику,
// +y вниз). На сцену персонаж ставится точкой между стопами на линии земли.
'use strict';

const E = (() => {
  // ---------------------------------------------------------------- матрицы 2D
  // [a, b, c, d, e, f] как у canvas.setTransform: x' = a*x + c*y + e, y' = b*x + d*y + f
  const mul = (m, n) => [
    m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
  ];
  const apply = (m, p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
  const inv = (m) => {
    const det = m[0] * m[3] - m[1] * m[2];
    return [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det,
      (m[2] * m[5] - m[3] * m[4]) / det, (m[1] * m[4] - m[0] * m[5]) / det];
  };
  const T = (x, y) => [1, 0, 0, 1, x, y];
  const R = (a) => [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0];
  const S = (x, y) => [x, 0, 0, y, 0, 0];
  const rotAbout = (p, a) => mul(T(p[0], p[1]), mul(R(a), T(-p[0], -p[1])));
  const ang = (m) => Math.atan2(m[1], m[0]);
  const rad = (d) => (d * Math.PI) / 180;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const len = (v) => Math.hypot(v[0], v[1]);

  // ---------------------------------------------------------------- загрузка
  const loadImage = (src) => new Promise((ok, fail) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = () => fail(new Error('нет картинки ' + src));
    im.src = src;
  });

  // Слой вырезается по своей рамке и заранее уменьшается до k (меньше работы на кадр).
  function prescale(im, box, k) {
    const x0 = Math.floor(box[0]) - 2, y0 = Math.floor(box[1]) - 2;
    const w = Math.ceil(box[2]) + 2 - x0, h = Math.ceil(box[3]) + 2 - y0;
    let src = document.createElement('canvas');
    src.width = w; src.height = h;
    src.getContext('2d').drawImage(im, x0, y0, w, h, 0, 0, w, h);
    // уменьшение в несколько шагов по 2 раза — без «лесенки» на тонких линиях
    let cw = w, ch = h;
    while (cw / 2 >= w * k) {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(cw / 2)); c.height = Math.max(1, Math.round(ch / 2));
      const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(src, 0, 0, cw, ch, 0, 0, c.width, c.height);
      src = c; cw = c.width; ch = c.height;
    }
    const out = document.createElement('canvas');
    out.width = Math.max(1, Math.round(w * k)); out.height = Math.max(1, Math.round(h * k));
    const g = out.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(src, 0, 0, cw, ch, 0, 0, out.width, out.height);
    return { canvas: out, x: x0, y: y0, w, h };
  }

  async function loadRig(name, k) {
    const base = `/rigs/${name}/`;
    const rig = await (await fetch(base + 'rig.json')).json();
    const layers = rig.layers.map((l) => ({ ...l, sw: null }));
    for (const s of rig.switches) for (const c of s.children) layers.push({ ...c, sw: s.name });
    layers.sort((a, b) => a.order - b.order);
    await Promise.all(layers.map(async (l) => {
      l.img = prescale(await loadImage(base + l.png), l.bbox, k);
    }));
    return { name, rig, layers };
  }

  // ---------------------------------------------------------------- персонаж
  class Character {
    constructor(data, opts = {}) {
      this.name = data.name;
      this.rig = data.rig;
      this.layers = data.layers;
      this.scale = opts.scale || 0.3;
      const bones = this.rig.bones;
      this.bones = bones;
      this.idx = Object.fromEntries(bones.map((b, i) => [b.name, i]));
      this.parent = bones.map((b) => (b.parent === null ? -1 : this.idx[b.parent]));
      // родители раньше детей
      this.topo = [];
      const seen = new Set();
      const visit = (i) => {
        if (seen.has(i)) return;
        if (this.parent[i] >= 0) visit(this.parent[i]);
        seen.add(i); this.topo.push(i);
      };
      bones.forEach((_, i) => visit(i));
      const byLayer = {};
      for (const l of this.layers) byLayer[l.name] = l.bone;
      const bi = (n) => (n in this.idx ? this.idx[n] : -1);
      this.spine = bi(byLayer.body);
      this.head = bi(byLayer.head);
      this.neck = bi(byLayer.neck);
      // руки и ноги: цепочки «сустав → сустав → сустав» по слоям `hand/leg <сторона> 1/2/3`
      const chain = (kind, side) => {
        const a = bi(byLayer[`${kind} ${side} 1`]), b = bi(byLayer[`${kind} ${side} 2`]);
        if (a < 0 || b < 0) return null;
        let c = bi(byLayer[`${kind} ${side} 3`]);
        if (c < 0) c = bones.findIndex((x, i) => this.parent[i] === b);
        return c < 0 ? null : [a, b, c];
      };
      const limbs = (kind) => {
        const out = ['left', 'right'].map((s) => chain(kind, s)).filter(Boolean);
        out.sort((p, q) => bones[q[0]].base[0] - bones[p[0]].base[0]);
        return { F: out[0] || null, B: out[1] || null };   // F — ближняя к +x (вперёд)
      };
      const arms = limbs('hand'), legs = limbs('leg');
      this.arm = arms; this.leg = legs;
      // корень — общий предок ног (или кость туловища у шариков без ног)
      const anc = (i) => { const r = []; for (; i >= 0; i = this.parent[i]) r.push(i); return r; };
      if (legs.F) {
        const a = anc(legs.F[0]);
        this.root = a[a.length - 1];
      } else {
        const a = anc(this.spine >= 0 ? this.spine : 0);
        this.root = a[a.length - 1];
      }
      // точка постановки: между щиколотками на уровне подошв (или низ тела)
      let bottom = 0;
      for (const l of this.layers) if (!l.sw) bottom = Math.max(bottom, l.bbox[3]);
      if (legs.F && legs.B) {
        const fx = bones[legs.F[2]].base[0], bx = bones[legs.B[2]].base[0];
        this.anchor = [(fx + bx) / 2, bottom - 6];
        this.ankleH = bottom - 6 - (bones[legs.F[2]].base[1] + bones[legs.B[2]].base[1]) / 2;
      } else {
        const b = this.layers.find((l) => l.name === 'body');
        this.anchor = [(b.bbox[0] + b.bbox[2]) / 2, b.bbox[3] - 6];
        this.ankleH = 0;
      }
      this.width = Math.max(...this.layers.map((l) => l.bbox[2])) - Math.min(...this.layers.map((l) => l.bbox[0]));
      this.height = this.anchor[1] - Math.min(...this.layers.map((l) => l.bbox[1]));
    }

    boneLen(i, j) { return len(sub(this.bones[j].base, this.bones[i].base)); }

    // матрица персонажа: локальные пиксели холста -> пиксели сцены
    // pivot — центр поворота rot: на сколько пикселей персонажа выше точки постановки
    globalMatrix(p) {
      const s = this.scale, pv = (p.pivot || 0) * s * (p.sy || 1);
      return mul(T(p.x, p.y - pv), mul(R(rad(p.rot || 0)), mul(T(0, pv),
        mul(S((p.facing || 1) * s * (p.sx || 1), s * (p.sy || 1)), T(-this.anchor[0], -this.anchor[1])))));
    }

    fk(delta, hip) {
      const W = new Array(this.bones.length);
      for (const i of this.topo) {
        const L = rotAbout(this.bones[i].base, delta[i] || 0);
        W[i] = this.parent[i] >= 0 ? mul(W[this.parent[i]], L) : (i === this.root ? mul(T(hip[0], hip[1]), L) : L);
      }
      return W;
    }

    // IK по двум звеньям. target — точка конца второго звена (локальные пиксели).
    // bend: +1/-1 — по какую сторону от линии «сустав–цель» уходит средний сустав.
    solve2(W, delta, ch, target, bend, endRot) {
      const [a, b, c] = ch;
      const pa = this.parent[a];
      const Wp = pa >= 0 ? W[pa] : (a === this.root ? T(0, 0) : [1, 0, 0, 1, 0, 0]);
      const rho = ang(Wp);
      const j0 = apply(Wp, this.bones[a].base);
      const r1 = sub(this.bones[b].base, this.bones[a].base), r2 = sub(this.bones[c].base, this.bones[b].base);
      const L1 = len(r1), L2 = len(r2);
      const v = sub(target, j0);
      const d = clamp(len(v), Math.abs(L1 - L2) + 1e-3, L1 + L2 - 1e-3);
      const base = Math.atan2(v[1], v[0]);
      const off = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
      const th1 = base - bend * off;
      const knee = [j0[0] + L1 * Math.cos(th1), j0[1] + L1 * Math.sin(th1)];
      const end = [j0[0] + d * Math.cos(base), j0[1] + d * Math.sin(base)];
      const th2 = Math.atan2(end[1] - knee[1], end[0] - knee[0]);
      delta[a] = th1 - Math.atan2(r1[1], r1[0]) - rho;
      delta[b] = th2 - Math.atan2(r2[1], r2[0]) - rho - delta[a];
      if (endRot !== undefined && endRot !== null) delta[c] = endRot - rho - delta[a] - delta[b];
    }

    // колени наружу от середины тела: у передней ноги колено уходит в +x (и вверх при ударе)
    kneeBend(ch) {
      return this.bones[ch[0]].base[0] > this.anchor[0] ? 1 : -1;
    }

    pose(p, world = {}) {
      const delta = {};
      const r = this.root;
      if (this.spine >= 0) delta[this.spine] = rad(p.lean || 0);
      if (this.head >= 0) delta[this.head] = rad(p.head || 0);
      if (this.neck >= 0 && p.neck) delta[this.neck] = rad(p.neck);
      const hip = p.hip || [0, 0];
      const G = this.globalMatrix(p);
      const Gi = inv(G);
      let W = this.fk(delta, hip);

      // Конечность ставится тремя способами:
      //   точка  — IK: стопа на сцене / кисть относительно плеча, сустав гнётся сам;
      //   углы   — повороты трёх костей в градусах;
      //   точка + углы — смесь с весом fk (0 — точка, 1 — углы): так нога плавно
      //   переходит от «стоит на земле» к «поджата в прыжке» без рывка.
      // Удар (world.kick*/hit*) затем тянет конец конечности к цели с весом w.
      const limb = (ch, angles, point, reach, solve, endRot, fk) => {
        const ids = [ch[0], ch[1], ch[2]];
        let ikD = null;
        if (point) {
          const d2 = { ...delta };
          solve(ch, point, d2);
          if (endRot !== null) d2[ch[2]] = endRot - ang(W[this.parent[ch[0]]]) - d2[ch[0]] - d2[ch[1]];
          ikD = ids.map((i) => d2[i] || 0);
        }
        const fkD = angles ? [rad(angles[0]), rad(angles[1]), rad(angles[2] || 0)] : null;
        const w = clamp(fk === undefined || fk === null ? (point ? 0 : 1) : fk, 0, 1);
        const res = ikD && fkD ? ikD.map((v, j) => lerp(v, fkD[j], w)) : (ikD || fkD);
        if (res) { ids.forEach((i, j) => { delta[i] = res[j]; }); W = this.fk(delta, hip); }
        if (reach && reach.w > 0) {
          const from = apply(W[ch[1]], this.bones[ch[2]].base);
          const rt = apply(Gi, reach.at);
          solve(ch, [lerp(from[0], rt[0], reach.w), lerp(from[1], rt[1], reach.w)], delta);
          W = this.fk(delta, hip);
        }
      };
      for (const k of ['F', 'B']) {
        const ch = this.leg[k];
        if (!ch) continue;
        const foot = p['foot' + k];
        const point = foot ? apply(Gi, [foot[0], world.ground - this.ankleH * this.scale - (foot[1] || 0)]) : null;
        // стопа на земле стоит ровно, даже если персонаж наклонён целиком
        const endRot = foot ? rad(p['footRot' + k] || 0) - rad(p.rot || 0) * (p.facing || 1) : null;
        limb(ch, p['leg' + k], point, world['kick' + k],
          (c, tgt, d) => this.solve2(W, d, c, tgt, this.kneeBend(c)), endRot, p['leg' + k + 'fk']);
      }
      for (const k of ['F', 'B']) {
        const ch = this.arm[k];
        if (!ch) continue;
        const hand = p['hand' + k];
        let point = null;
        if (hand) {
          const sh = apply(W[this.parent[ch[0]]], this.bones[ch[0]].base);
          point = [sh[0] + hand[0], sh[1] + hand[1]];
        }
        // локоть вниз: из двух решений берём то, где он ниже
        const elbowDown = (c, tgt, d) => {
          const tryBend = (sgn) => {
            const d2 = { ...d };
            this.solve2(W, d2, c, tgt, sgn);
            return [d2, apply(this.fk(d2, hip)[c[1]], this.bones[c[1]].base)[1]];
          };
          const [da, ya] = tryBend(1), [db, yb] = tryBend(-1);
          const best = ya >= yb ? da : db;
          d[c[0]] = best[c[0]]; d[c[1]] = best[c[1]];
        };
        limb(ch, p['arm' + k], point, world['hit' + k], elbowDown, null, p['arm' + k + 'fk']);
        if (p['wrist' + k]) { delta[ch[2]] = (delta[ch[2]] || 0) + rad(p['wrist' + k]); W = this.fk(delta, hip); }
      }
      return { G, W, p };
    }

    // точки тела на сцене (для попаданий, эффектов)
    point(st, what) {
      const { G, W } = st;
      const bone = (i, t = 0.5) => {
        const b = this.bones[i];
        const q = [lerp(b.base[0], b.tip[0], t), lerp(b.base[1], b.tip[1], t)];
        return apply(G, apply(W[i], q));
      };
      const layerCenter = (name) => {
        const l = this.layers.find((x) => x.name === name);
        const i = this.idx[l.bone];
        return apply(G, apply(W[i], [(l.bbox[0] + l.bbox[2]) / 2, (l.bbox[1] + l.bbox[3]) / 2]));
      };
      if (what === 'head') return layerCenter(this.layers.some((l) => l.name === 'head') ? 'head' : 'body');
      if (what === 'body') return layerCenter('body');
      if (what === 'hat') return layerCenter('hat');
      if (what === 'handF' && this.arm.F) return bone(this.arm.F[2], 0.5);
      if (what === 'footF' && this.leg.F) return bone(this.leg.F[2], 0.5);
      return apply(G, this.anchor);
    }

    layerMatrix(st, name) {
      const l = this.layers.find((x) => x.name === name);
      return mul(st.G, st.W[this.idx[l.bone]]);
    }

    draw(ctx, st, cam) {
      const p = st.p;
      const hide = new Set(p.hide || []);
      const pick = { mouth: p.mouth, eyes: p.eyes };
      for (const l of this.layers) {
        if (hide.has(l.name)) continue;
        if (l.sw) {
          const sw = this.rig.switches.find((s) => s.name === l.sw);
          const want = pick[l.sw] || sw.default;
          const has = sw.children.some((c) => c.name === want);
          if (l.name !== (has ? want : sw.default)) continue;
        }
        const i = l.bone in this.idx ? this.idx[l.bone] : this.root;
        const M = mul(cam, mul(st.G, st.W[i]));
        ctx.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);
        ctx.globalAlpha = p.alpha === undefined ? 1 : p.alpha;
        ctx.drawImage(l.img.canvas, l.img.x, l.img.y, l.img.w, l.img.h);
      }
      ctx.globalAlpha = 1;
    }
  }

  // ---------------------------------------------------------------- ключи
  const EASE = {
    lin: (t) => t,
    io: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),
    in: (t) => t * t * t,
    in2: (t) => t * t,
    out: (t) => 1 - Math.pow(1 - t, 3),
    back: (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    step: (t) => (t >= 1 ? 1 : 0),
  };

  // Дорожка ключей: add(t, {свойство: значение}, ease). Значение держится до
  // следующего ключа этого свойства; числа и массивы плавно, строки — ступенькой.
  class Track {
    constructor() { this.keys = {}; }
    add(t, props, ease = 'io') {
      for (const [k, v] of Object.entries(props)) (this.keys[k] = this.keys[k] || []).push([t, v, ease]);
      return this;
    }
    get(k, t, def) {
      const ks = this.keys[k];
      if (!ks) return def;
      if (!ks.sorted) { ks.sort((a, b) => a[0] - b[0]); ks.sorted = true; }
      // до первого ключа — значение по умолчанию (если задано), иначе первый ключ
      if (t < ks[0][0]) return def !== undefined ? def : ks[0][1];
      for (let i = 1; i < ks.length; i++) {
        if (t < ks[i][0]) {
          const [t0, v0] = ks[i - 1], [t1, v1, e] = ks[i];
          const u = EASE[e]((t - t0) / (t1 - t0));
          if (typeof v0 === 'number' && typeof v1 === 'number') return lerp(v0, v1, u);
          if (Array.isArray(v0) && Array.isArray(v1) && v0.length === v1.length) return v0.map((x, j) => lerp(x, v1[j], u));
          return u >= 1 ? v1 : v0;
        }
      }
      return ks[ks.length - 1][1];
    }
    sample(t, names, defs) {
      const out = { ...defs };
      for (const k of Object.keys(this.keys)) if (!names || names.includes(k)) out[k] = this.get(k, t, out[k]);
      return out;
    }
  }

  // ---------------------------------------------------------------- пиксельный шрифт
  // Буквы 5×7, как в надписях «FIGHT» / «WIN» у референсов: белые блоки с чёрной обводкой.
  const GLYPHS = {
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
    G: ['01111', '10000', '10000', '10011', '10001', '10001', '01111'],
    H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
    L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
    '1': ['00100', '01100', '10100', '00100', '00100', '00100', '11111'],
    '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
    '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
    '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
    '.': ['00000', '00000', '00000', '00000', '00000', '00000', '00100'],
    ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  };

  function pixelText(ctx, text, cx, cy, px, opts = {}) {
    const chars = [...text.toUpperCase()];
    const gw = 5, gap = 1;
    const W = (chars.length * (gw + gap) - gap) * px, H = 7 * px;
    const x0 = cx - W / 2, y0 = cy - H / 2;
    const cells = [];
    chars.forEach((ch, n) => {
      const g = GLYPHS[ch] || GLYPHS[' '];
      g.forEach((row, y) => [...row].forEach((b, x) => {
        if (b === '1') cells.push([x0 + (n * (gw + gap) + x) * px, y0 + y * px]);
      }));
    });
    const ol = opts.outline || px * 0.42;
    const r = px * 0.28;
    const rect = (x, y, w, h, rr) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, rr); ctx.fill(); };
    ctx.save();
    ctx.fillStyle = '#111';
    for (const [x, y] of cells) rect(x - ol, y - ol, px + 2 * ol, px + 2 * ol, r + ol * 0.6);
    // белые клетки вплотную, без щелей — буква сплошная
    ctx.fillStyle = opts.color || '#fff';
    for (const [x, y] of cells) ctx.fillRect(x - 0.5, y - 0.5, px + 1, px + 1);
    ctx.restore();
  }

  return { mul, apply, inv, T, R, S, rad, lerp, clamp, loadRig, Character, Track, EASE, pixelText };
})();
