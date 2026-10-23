// Движок анимации риговых персонажей (rigs/<имя>/): PNG-слои, кости, IK, ключи.
//
// Каждый PNG-слой привязан к кости (rig.json: layers[].bone). Поза — это повороты
// костей вокруг их суставов; дочерние кости едут вместе с родительской, поэтому
// локоть всегда на конце плеча, колено на конце бедра.
//
// Персонажи нарисованы в три четверти: носки смотрят в одну сторону (dir: +1 —
// вправо, -1 — влево). Отсюда правила сгиба (стиль «animal hospital long»):
//   - оба колена сгибаются вперёд, туда, куда смотрят носки (никакой «лягушки»);
//   - локти сгибаются назад, при вытянутой вперёд руке — вниз;
//   - стопа, поставленная на землю, стоит ровно и не скользит.
// Персонаж разворачивается к сопернику свойством face (+1/-1); если face совпадает
// с dir, картинка не отражается.
//
// Углы и смещения в позе пишутся «по-человечески»: + вперёд (к носкам), а не в
// координатах холста, — поэтому одна и та же поза подходит персонажу, нарисованному
// лицом вправо и лицом влево.
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
  const I = [1, 0, 0, 1, 0, 0];
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

  // Перекраска рига при загрузке (для персонажей, у которых нет своей маленькой версии):
  //   yellow  — розовую девочку в жёлтую (как verity big girl): розовый -> жёлтый, красный -> оранжевый
  //   rainbow — серый шарик-скелет в радужный (как All verity color): светло-серое -> радуга сверху вниз
  const hsv = (r, g, b) => {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d > 0) h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h / 6, mx ? d / mx : 0, mx / 255];
  };
  const RAINBOW = [[40, 90, 255], [0, 200, 255], [40, 220, 60], [255, 235, 30], [255, 140, 0], [255, 40, 60],
    [230, 40, 200]];
  const RECOLOR = {
    yellow(px) {
      for (let i = 0; i < px.length; i += 4) {
        if (!px[i + 3]) continue;
        const [h, s, v] = hsv(px[i], px[i + 1], px[i + 2]);
        if (s < 0.35 || v < 0.15) continue;
        let to = null;
        if (h > 0.8 && h < 0.92) to = [252, 252, 44];                          // розовый -> жёлтый
        else if (h >= 0.92 || h < 0.03) to = [252, 124, 0];                     // красный -> оранжевый
        if (!to) continue;
        const k = v / (h > 0.8 && h < 0.92 ? 0.99 : 0.88);
        for (let c = 0; c < 3; c++) px[i + c] = Math.min(255, to[c] * k);
      }
    },
    rainbow(px, w, h, box) {
      for (let y = 0, i = 0; y < h; y++) {
        const u = Math.min(0.999, Math.max(0, (y - box[1]) / (box[3] - box[1]))) * (RAINBOW.length - 1);
        const a = RAINBOW[Math.floor(u)], b = RAINBOW[Math.floor(u) + 1], t = u - Math.floor(u);
        for (let x = 0; x < w; x++, i += 4) {
          if (!px[i + 3]) continue;
          const [, s, v] = hsv(px[i], px[i + 1], px[i + 2]);
          if (s > 0.12 || v < 0.3 || v > 0.95) continue;                       // контур, блик, цветное — как есть
          const k = v / 0.86;
          for (let c = 0; c < 3; c++) px[i + c] = Math.min(255, (a[c] + (b[c] - a[c]) * t) * k);
        }
      }
    },
  };

  async function loadRig(name, opts = {}) {
    const base = `/rigs/${name}/`;
    const rig = await (await fetch(base + 'rig.json')).json();
    const layers = rig.layers.map((l) => ({ ...l, sw: null }));
    for (const s of rig.switches) for (const c of s.children) layers.push({ ...c, sw: s.name });
    layers.sort((a, b) => a.order - b.order);
    await Promise.all(layers.map(async (l) => { l.full = await loadImage(base + l.png); }));
    if (opts.recolor) {
      const body = (layers.find((l) => l.name === 'body') || layers[0]).bbox;
      for (const l of layers) {
        const c = document.createElement('canvas');
        c.width = l.full.width; c.height = l.full.height;
        const g = c.getContext('2d');
        g.drawImage(l.full, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height);
        RECOLOR[opts.recolor](d.data, c.width, c.height, body);
        g.putImageData(d, 0, 0);
        l.full = c;
      }
    }
    return { name, rig, layers };
  }

  // ---------------------------------------------------------------- персонаж
  class Character {
    // opts.scale — масштаб пикселей рига; или opts.height — рост на сцене (верх
    // шляпы/черепа/банта — подошвы), или opts.body + opts.bodyHeight — высота одного слоя.
    constructor(data, opts = {}) {
      this.name = data.name;
      this.rig = data.rig;
      this.bones = this.rig.bones;
      const bones = this.bones;
      this.idx = Object.fromEntries(bones.map((b, i) => [b.name, i]));
      this.parent = bones.map((b) => (b.parent === null ? -1 : this.idx[b.parent]));
      this.topo = [];
      const seen = new Set();
      const visit = (i) => {
        if (seen.has(i)) return;
        if (this.parent[i] >= 0) visit(this.parent[i]);
        seen.add(i); this.topo.push(i);
      };
      bones.forEach((_, i) => visit(i));
      const byLayer = {};
      for (const l of data.layers) byLayer[l.name] = l.bone;
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
      const legsAll = ['left', 'right'].map((s) => chain('leg', s)).filter(Boolean);
      // куда смотрят носки: стопа — от щиколотки к носку
      let toe = 0;
      for (const c of legsAll) toe += bones[c[2]].tip[0] - bones[c[2]].base[0];
      this.dir = toe < 0 ? -1 : 1;
      const limbs = (kind) => {
        const out = ['left', 'right'].map((s) => chain(kind, s)).filter(Boolean);
        out.sort((p, q) => (bones[q[0]].base[0] - bones[p[0]].base[0]) * this.dir);
        return { F: out[0] || null, B: out[1] || null };   // F — со стороны носков (к сопернику)
      };
      this.arm = limbs('hand'); this.leg = limbs('leg');
      this.armLayers = { F: new Set(), B: new Set() };
      for (const k of ['F', 'B']) {
        if (!this.arm[k]) continue;
        const ids = new Set(this.arm[k].map((i) => bones[i].name));
        for (const l of data.layers) if (ids.has(l.bone)) this.armLayers[k].add(l.name);
      }
      const anc = (i) => { const r = []; for (; i >= 0; i = this.parent[i]) r.push(i); return r; };
      const a = anc(this.leg.F ? this.leg.F[0] : (this.spine >= 0 ? this.spine : 0));
      this.root = a[a.length - 1];
      // точка постановки: между щиколотками на уровне подошв (или низ тела)
      const solid = data.layers.filter((l) => !l.sw);
      const bottom = Math.max(...solid.map((l) => l.bbox[3]));
      if (this.leg.F && this.leg.B) {
        const fx = bones[this.leg.F[2]].base[0], bx = bones[this.leg.B[2]].base[0];
        this.anchor = [(fx + bx) / 2, bottom - 4];
        this.ankleH = this.anchor[1] - (bones[this.leg.F[2]].base[1] + bones[this.leg.B[2]].base[1]) / 2;
      } else {
        const b = data.layers.find((l) => l.name === 'body');
        this.anchor = [(b.bbox[0] + b.bbox[2]) / 2, b.bbox[3] - 4];
        this.ankleH = 0;
      }
      this.top = Math.min(...solid.map((l) => l.bbox[1]));
      const face = data.layers.find((l) => l.name === 'head') || data.layers.find((l) => l.name === 'body');
      this.faceBox = face.bbox;
      // кусок слоя по строкам рига y0..y1 (полный холст рига, остальное прозрачно)
      const cropRows = (L, y0, y1) => {
        const c = document.createElement('canvas');
        c.width = L.full.width; c.height = L.full.height;
        c.getContext('2d').drawImage(L.full, 0, y0, c.width, y1 - y0, 0, y0, c.width, y1 - y0);
        return c;
      };
      // У некоторых ригов стопа нарисована на одном слое с голенью: режем слой по щиколотке,
      // нижний кусок (с запасом 40 px рига вверх) едет за костью стопы и остаётся ровным.
      if (opts.splitFeet) {
        for (const k of ['F', 'B']) {
          const ch = this.leg[k];
          if (!ch || data.layers.some((l) => l.bone === bones[ch[2]].name)) continue;
          const li = data.layers.findIndex((l) => !l.sw && l.bone === bones[ch[1]].name);
          if (li < 0) continue;
          const L = data.layers[li], ank = bones[ch[2]].base[1];
          const crop = (y0, y1) => cropRows(L, y0, y1);
          const shin = { ...L, full: crop(0, ank), bbox: [L.bbox[0], L.bbox[1], L.bbox[2], Math.min(L.bbox[3], ank)] };
          const foot = { ...L, name: L.name + ' foot', bone: bones[ch[2]].name, full: crop(ank - 40, L.full.height),
            bbox: [L.bbox[0], ank - 40, L.bbox[2], L.bbox[3]] };
          data.layers.splice(li, 1, shin, foot);
        }
      }
      // Пропеллер: верх слоя (выше строки cut) отдельным слоем, который крутится вокруг
      // вертикальной оси axis (поза: spin — обороты, spinBlur 0..1 — размытый диск).
      if (opts.spin) {
        const { layer, cut, axis } = opts.spin;
        const li = data.layers.findIndex((l) => l.name === layer);
        const L = data.layers[li];
        const cap = { ...L, full: cropRows(L, cut, L.full.height), bbox: [L.bbox[0], cut, L.bbox[2], L.bbox[3]] };
        const blades = { ...L, name: layer + ' spin', full: cropRows(L, 0, cut), bbox: [L.bbox[0], L.bbox[1], L.bbox[2], cut],
          spinAxis: axis };
        data.layers.splice(li, 1, cap, blades);
      }
      if (opts.scale) this.scale = opts.scale;
      else if (opts.height) this.scale = opts.height / (this.anchor[1] - this.top);
      else {
        const b = data.layers.find((l) => l.name === (opts.body || 'body'));
        this.scale = (opts.bodyHeight || 300) / (b.bbox[3] - b.bbox[1]);
      }
      // слои — заранее уменьшенные до масштаба сцены (с запасом на наезд камеры)
      this.layers = data.layers.map((l) => ({ ...l, img: prescale(l.full, l.bbox, this.scale * 1.25) }));
      this.width = (Math.max(...solid.map((l) => l.bbox[2])) - Math.min(...solid.map((l) => l.bbox[0]))) * this.scale;
      this.height = (this.anchor[1] - this.top) * this.scale;
    }

    // Стопы на месте как в риге (чуть шире/уже — spread, пиксели рига вперёд/назад):
    // {footF, footB} для персонажа в x, смотрящего в face.
    feet(x, face, spreadF = 0, spreadB = 0, lift = [0, 0]) {
      const out = {};
      for (const [k, sp, li] of [['F', spreadF, lift[0]], ['B', -spreadB, lift[1]]]) {
        if (!this.leg[k]) continue;
        const fwd = (this.bones[this.leg[k][2]].base[0] - this.anchor[0]) * this.dir + sp;
        out['foot' + k] = [x + face * fwd * this.scale, li];
      }
      return out;
    }

    // кисть в покое относительно плеча: [вперёд, вниз] в пикселях рига
    handRest(k) {
      const ch = this.arm[k];
      if (!ch) return [0, 0];
      const a = this.bones[ch[0]].base, c = this.bones[ch[2]].base;
      return [(c[0] - a[0]) * this.dir, c[1] - a[1]];
    }

    // матрица персонажа: локальные пиксели холста -> пиксели сцены.
    // rot вращает вокруг точки на pivot пикселей рига выше стоп.
    globalMatrix(p) {
      const s = this.scale, pv = (p.pivot || 0) * s * (p.sy || 1);
      const flip = (p.face || this.dir) * this.dir;
      return mul(T(p.x, p.y - pv), mul(R(rad(p.rot || 0)), mul(T(0, pv),
        mul(S(flip * s * (p.sx || 1), s * (p.sy || 1)), T(-this.anchor[0], -this.anchor[1])))));
    }

    fk(delta, hip) {
      const W = new Array(this.bones.length);
      for (const i of this.topo) {
        const L = rotAbout(this.bones[i].base, delta[i] || 0);
        W[i] = this.parent[i] >= 0 ? mul(W[this.parent[i]], L) : (i === this.root ? mul(T(hip[0], hip[1]), L) : L);
      }
      return W;
    }

    // IK по двум звеньям: target — точка конца второго звена (локальные пиксели),
    // bend +1/-1 — в какую сторону от линии «сустав–цель» уходит средний сустав.
    solve2(W, delta, ch, target, bend) {
      const [a, b, c] = ch;
      const Wp = this.parent[a] >= 0 ? W[this.parent[a]] : I;
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
    }

    // Поза. Свойства p (все необязательные):
    //   x, y, face, rot, pivot, sx, sy        положение на сцене, разворот, наклон, сквош
    //   hip [вперёд, вниз]                     сдвиг таза (присед — вниз)
    //   lean, head, neck                       наклон корпуса / головы (+ вперёд), градусы
    //   footF/footB [x на сцене, подъём]       стопа в точке на земле (IK), legF/legB [бедро,
    //                                          голень, стопа] — углы, legFfk — смесь углов и точки
    //   handF/handB [вперёд, вниз]             кисть относительно плеча (IK), armF/armB — углы,
    //                                          bendF/bendB = -1 — локоть в другую сторону (руки в боки)
    //   b_<кость>                              дополнительный поворот любой кости (крылья)
    //   look -1..1, zF/zB 'front'|'back', mouth, eyes, hide, alpha
    //   spin (обороты), spinBlur 0..1                пропеллер (opts.spin в конструкторе)
    //   mouthK                                       рот крупнее в mouthK раз (вокруг его центра)
    // world.hitF/hitB/kickF {at, w} — тянуть кулак/стопу к точке сцены с весом w.
    pose(p, world = {}) {
      const dir = this.dir;
      const delta = {};
      if (this.spine >= 0) delta[this.spine] = rad(p.lean || 0) * dir;
      if (this.head >= 0) delta[this.head] = rad(p.head || 0) * dir;
      if (this.neck >= 0 && p.neck) delta[this.neck] = rad(p.neck) * dir;
      for (const k of Object.keys(p)) {
        if (k.startsWith('b_') && k.slice(2) in this.idx) delta[this.idx[k.slice(2)]] = rad(p[k]) * dir;
      }
      const hp = p.hip || [0, 0];
      const hip = [hp[0] * dir, hp[1]];
      const G = this.globalMatrix(p);
      const Gi = inv(G);
      const flip = (p.face || dir) * dir;
      let W = this.fk(delta, hip);

      // Конечность: углы, точка (IK) или их смесь с весом fk; удар тянет конец к цели.
      const limb = (ch, angles, point, reach, bend, endRot, fk) => {
        const ids = [ch[0], ch[1], ch[2]];
        let ikD = null;
        if (point) {
          const d2 = { ...delta };
          this.solve2(W, d2, ch, point, bend);
          if (endRot !== null) d2[ch[2]] = endRot - ang(W[this.parent[ch[0]]]) - d2[ch[0]] - d2[ch[1]];
          ikD = ids.map((i) => d2[i] || 0);
        }
        const fkD = angles ? [rad(angles[0]) * dir, rad(angles[1]) * dir, rad(angles[2] || 0) * dir] : null;
        const w = clamp(fk === undefined || fk === null ? (point ? 0 : 1) : fk, 0, 1);
        const res = ikD && fkD ? ikD.map((v, j) => lerp(v, fkD[j], w)) : (ikD || fkD);
        if (res) { ids.forEach((i, j) => { delta[i] = res[j]; }); W = this.fk(delta, hip); }
        if (reach && reach.w > 0) {
          const from = apply(W[ch[1]], this.bones[ch[2]].base);
          const rt = apply(Gi, reach.at);
          const keep = delta[ch[2]];
          this.solve2(W, delta, ch, [lerp(from[0], rt[0], reach.w), lerp(from[1], rt[1], reach.w)], bend);
          delta[ch[2]] = keep;
          W = this.fk(delta, hip);
        }
      };
      for (const k of ['F', 'B']) {
        const ch = this.leg[k];
        if (!ch) continue;
        const foot = p['foot' + k];
        const point = foot ? apply(Gi, [foot[0], world.ground - this.ankleH * this.scale * (p.sy || 1) - (foot[1] || 0)]) : null;
        // стопа стоит ровно: её поворот на сцене как в риге, даже если персонаж наклонён
        const endRot = foot ? rad(p['footRot' + k] || 0) * dir - rad(p.rot || 0) * flip : null;
        limb(ch, p['leg' + k], point, world['kick' + k], dir, endRot, p['leg' + k + 'fk']);
      }
      for (const k of ['F', 'B']) {
        const ch = this.arm[k];
        if (!ch) continue;
        const hand = p['hand' + k];
        let point = null;
        if (hand) {
          const sh = apply(W[this.parent[ch[0]]], this.bones[ch[0]].base);
          point = [sh[0] + hand[0] * dir, sh[1] + hand[1]];
        }
        limb(ch, p['arm' + k], point, world['hit' + k], -dir * (p['bend' + k] || 1), null, p['arm' + k + 'fk']);
        if (p['wrist' + k]) { delta[ch[2]] = (delta[ch[2]] || 0) + rad(p['wrist' + k]) * dir; W = this.fk(delta, hip); }
      }
      return { G, W, p };
    }

    // точки тела на сцене (для попаданий, эффектов)
    point(st, what) {
      const { G, W, p } = st;
      const layerCenter = (name) => {
        const l = this.layers.find((x) => x.name === name);
        const i = l.bone in this.idx ? this.idx[l.bone] : this.root;
        return apply(G, apply(W[i], [(l.bbox[0] + l.bbox[2]) / 2, (l.bbox[1] + l.bbox[3]) / 2]));
      };
      const has = (n) => this.layers.some((l) => l.name === n);
      if (what === 'head' || what === 'face' || what === 'top') {
        const c = layerCenter(has('head') ? 'head' : 'body');
        const fb = this.faceBox, s = this.scale;
        if (what === 'top') return [c[0], c[1] - (fb[3] - fb[1]) * s * 0.5 * (p.sy || 1)];
        if (what === 'head') return c;
        return [c[0] + (p.face || this.dir) * (fb[2] - fb[0]) * s * 0.32 * (p.sx || 1), c[1] + (fb[3] - fb[1]) * s * 0.08];
      }
      if (what === 'body') return layerCenter('body');
      if (what === 'hat') return layerCenter('hat');
      if (what === 'handF' && this.arm.F) return apply(G, apply(W[this.arm.F[2]], this.bones[this.arm.F[2]].base));
      if (what === 'handB' && this.arm.B) return apply(G, apply(W[this.arm.B[2]], this.bones[this.arm.B[2]].base));
      return apply(G, this.anchor);
    }

    layerMatrix(st, name) {
      const l = this.layers.find((x) => x.name === name);
      return mul(st.G, st.W[l.bone in this.idx ? this.idx[l.bone] : this.root]);
    }

    // сдвиг глаз и рта к сопернику (look) в пикселях рига
    lookShift(p) {
      const fw = this.faceBox[2] - this.faceBox[0];
      return (p.look || 0) * this.dir * fw * (this.layers.some((l) => l.name === 'head') ? 0.07 : 0.1);
    }

    // матрица, которой рисуется слой глаз (со сдвигом look) — для сердечек вместо глаз
    eyeMatrix(st, name) {
      return mul(this.layerMatrix(st, name), T(this.lookShift(st.p), 0));
    }

    // Слои рисуются в порядке рига. Руку можно временно поднять над телом
    // (zF/zB = 'front') или убрать за всё (= 'back'); only = 'F'/'B' — рисует одну руку
    // (чтобы бьющая рука легла поверх соперника). look сдвигает глаза и рот к
    // сопернику и чуть сужает голову — лицо в три четверти.
    draw(ctx, st, cam) {
      const p = st.p;
      const hide = new Set(p.hide || []);
      const pick = { mouth: p.mouth, eyes: p.eyes };
      const look = p.look || 0;
      const fb = this.faceBox;
      const bigHead = this.layers.some((l) => l.name === 'head');
      const shift = this.lookShift(p);
      const narrow = bigHead ? 1 - 0.06 * Math.abs(look) : 1;
      const fcx = (fb[0] + fb[2]) / 2;
      const visible = this.layers.filter((l) => {
        if (hide.has(l.name)) return false;
        if (p.only && !this.armLayers[p.only].has(l.name)) return false;
        if (!l.sw) return true;
        const sw = this.rig.switches.find((s) => s.name === l.sw);
        const want = pick[l.sw] || sw.default;
        return l.name === (sw.children.some((c) => c.name === want) ? want : sw.default);
      });
      const zOf = (l) => {
        for (const k of ['F', 'B']) {
          if (this.armLayers[k].has(l.name)) return p['z' + k] === 'front' ? 1 : p['z' + k] === 'back' ? -1 : 0;
        }
        return 0;
      };
      const order = [...visible.filter((l) => zOf(l) < 0), ...visible.filter((l) => zOf(l) === 0),
        ...visible.filter((l) => zOf(l) > 0)];
      ctx.globalAlpha = p.alpha === undefined ? 1 : p.alpha;
      for (const l of order) {
        const i = l.bone in this.idx ? this.idx[l.bone] : this.root;
        let M = mul(cam, mul(st.G, st.W[i]));
        if (l.sw === 'mouth' || l.sw === 'eyes' || l.name === 'eye') M = mul(M, T(shift, 0));
        if (l.sw === 'mouth' && p.mouthK && p.mouthK !== 1) {          // огромный рот (засасывает, кричит)
          const cx = (l.bbox[0] + l.bbox[2]) / 2, cy = (l.bbox[1] + l.bbox[3]) / 2;
          M = mul(M, mul(T(cx, cy), mul(S(p.mouthK, p.mouthK), T(-cx, -cy))));
        }
        else if (narrow !== 1 && l.name === 'head') M = mul(M, mul(T(fcx, 0), mul(S(narrow, 1), T(-fcx, 0))));
        if (l.spinAxis !== undefined && (p.spin || p.spinBlur)) {
          const blur = clamp(p.spinBlur || 0, 0, 1), b = l.bbox, a = l.spinAxis;
          if (blur > 0) {                          // размытый диск от лопастей
            ctx.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);
            ctx.beginPath();
            ctx.ellipse(a, (b[1] + b[3]) / 2 - (b[3] - b[1]) * 0.12, (b[2] - b[0]) / 2, (b[3] - b[1]) * 0.22, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(20, 110, 20, ${0.45 * blur})`; ctx.fill();
            ctx.lineWidth = 6; ctx.strokeStyle = `rgba(0, 0, 0, ${0.35 * blur})`; ctx.stroke();
          }
          const c = Math.cos(2 * Math.PI * (p.spin || 0));
          const k = (c < 0 ? -1 : 1) * Math.max(0.1, Math.abs(c));
          M = mul(M, mul(T(a, 0), mul(S(k, 1), T(-a, 0))));
          ctx.globalAlpha = (p.alpha === undefined ? 1 : p.alpha) * (1 - 0.45 * blur);
        }
        ctx.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);
        ctx.drawImage(l.img.canvas, l.img.x, l.img.y, l.img.w, l.img.h);
        ctx.globalAlpha = p.alpha === undefined ? 1 : p.alpha;
      }
      ctx.globalAlpha = 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  // ---------------------------------------------------------------- ключи
  const EASE = {
    lin: (t) => t,
    io: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),
    in: (t) => t * t * t,
    in2: (t) => t * t,
    out: (t) => 1 - Math.pow(1 - t, 3),
    out2: (t) => 1 - (1 - t) * (1 - t),
    back: (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    step: (t) => (t >= 1 ? 1 : 0),
  };

  // Дорожка ключей. add(t, {свойство: значение}, ease, dur):
  //   dur — за сколько секунд до t начинается переход; до этого держится прежнее
  //   значение (поза-на-позу, без дрейфа). Без dur переход идёт от прошлого ключа.
  // Числа и массивы меняются плавно, строки и прочее — ступенькой в момент t.
  class Track {
    constructor() { this.keys = {}; }
    add(t, props, ease = 'io', dur = null) {
      for (const [k, v] of Object.entries(props)) {
        const ks = (this.keys[k] = this.keys[k] || []);
        ks.push([t, v, ease, dur]);
        ks.sorted = false;
      }
      return this;
    }
    get(k, t, def) {
      const ks = this.keys[k];
      if (!ks) return def;
      if (!ks.sorted) { ks.sort((a, b) => a[0] - b[0]); ks.sorted = true; }
      if (t < ks[0][0]) return def !== undefined ? def : ks[0][1];
      for (let i = 1; i < ks.length; i++) {
        if (t < ks[i][0]) {
          const [t0, v0] = ks[i - 1], [t1, v1, e, dur] = ks[i];
          const start = dur === null || dur === undefined ? t0 : Math.max(t0, t1 - dur);
          if (t < start) return v0;
          const u = EASE[e]((t - start) / (t1 - start));
          if (typeof v0 === 'number' && typeof v1 === 'number') return lerp(v0, v1, u);
          if (Array.isArray(v0) && Array.isArray(v1) && v0.length === v1.length &&
            v0.every((x) => typeof x === 'number') && v1.every((x) => typeof x === 'number')) {
            return v0.map((x, j) => lerp(x, v1[j], u));
          }
          return u >= 1 ? v1 : v0;
        }
      }
      return ks[ks.length - 1][1];
    }
    sample(t, defs) {
      const out = { ...defs };
      for (const k of Object.keys(this.keys)) out[k] = this.get(k, t, out[k]);
      return out;
    }
  }

  return { mul, apply, inv, T, R, S, I, rad, lerp, clamp, loadRig, Character, Track, EASE };
})();
