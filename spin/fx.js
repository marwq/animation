// Катастрофы у вершины: извержения соседних вулканов (столб пепла, зонтик облака, молнии в пепле, свечение
// лавы ночью) и снежные лавины с края вершинного купола. Всё из «пуфов» — спрайтов с мягкой текстурой; состояние
// зависит только от времени ролика t (кадры рендерятся в любом порядке).
import * as THREE from 'three';
import { PEAKS, SUMMIT, drop, elevation } from './summit.js';
import { AVALANCHES, ERUPTIONS } from './timeline.js';
import { rng, smooth } from '../pov/util.js';

function puffTexture(seed) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const r = rng(seed);
  // несколько перекрывающихся мягких кругов — неровный клуб
  for (let i = 0; i < 9; i++) {
    const x = 64 + (r() - 0.5) * 40;
    const y = 64 + (r() - 0.5) * 40;
    const rad = 26 + r() * 30;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.25)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// мировые координаты точки (км на восток, км на север, высота над морем м)
function world(xk, yk, h, out = new THREE.Vector3()) {
  const d = Math.hypot(xk, yk) * 1000;
  return out.set(xk * 1000, h - SUMMIT - drop(d), -yk * 1000);
}

export function buildFx() {
  const group = new THREE.Group();
  const tex = [puffTexture(5), puffTexture(9), puffTexture(13)];

  // извержения: на каждый вулкан 70 пуфов столба и 90 пуфов зонтика, свечение у жерла, молнии
  const volcs = ERUPTIONS.map(([name, start, power], vi) => {
    const p = PEAKS.find((q) => q[0] === name);
    const az = (p[3] * Math.PI) / 180;
    const xk = p[2] * Math.sin(az);
    const yk = p[2] * Math.cos(az);
    const vent = world(xk, yk, p[1]);
    const r = rng(100 + vi);
    const puffs = [];
    for (let i = 0; i < 160; i++) {
      const mat = new THREE.SpriteMaterial({ map: tex[i % 3], color: 0x6f665e, transparent: true, opacity: 0, depthWrite: false, fog: false });
      const sp = new THREE.Sprite(mat);
      sp.material.rotation = r() * Math.PI * 2;
      group.add(sp);
      puffs.push({ sp, u: r(), v: r(), w: r(), col: i < 70 });
    }
    const glowMat = new THREE.SpriteMaterial({ map: tex[0], color: 0xff6a1e, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    const glow = new THREE.Sprite(glowMat);
    glow.position.copy(vent).add(new THREE.Vector3(0, 300, 0));
    group.add(glow);
    // молния: ломаная из 14 отрезков, перестраивается на каждую вспышку
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(15 * 3), 3));
    const bolt = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0xdfe8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    bolt.frustumCulled = false;
    group.add(bolt);
    return { name, start, power, vent, puffs, glow, bolt, h: p[1] };
  });

  // лавины: 26 пуфов на каждую — снежная пыль поднимается над краем купола и стекает вниз
  const avals = AVALANCHES.map(([start, azDeg, dist], ai) => {
    const az = (azDeg * Math.PI) / 180;
    const r = rng(300 + ai);
    const puffs = [];
    for (let i = 0; i < 26; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex[i % 3], color: 0xf4f7fb, transparent: true, opacity: 0, depthWrite: false, fog: false }));
      sp.material.rotation = r() * Math.PI * 2;
      group.add(sp);
      puffs.push({ sp, u: r(), v: r(), w: r() });
    }
    return { start, az, dist: dist * 0.25, puffs }; // край купола: 300–550 м от героя
  });

  return { group, volcs, avals };
}

// env: { t, sun (вектор), light (0…1 — сколько дневного света), ash (цвет), windX (м/с на запад в «секундах ролика») }
export function updateFx(fx, t, env) {
  let flash = 0;
  const tmp = new THREE.Vector3();
  for (const v of fx.volcs) {
    const age = t - v.start;
    const on = age > 0;
    v.glow.visible = on;
    v.bolt.visible = false;
    for (const p of v.puffs) p.sp.visible = on;
    if (!on) continue;
    const grow = 1 - Math.exp(-age / 1.6); // столб растёт за пару секунд (в истории — час)
    const top = (9000 + 13000 * v.power) * grow; // высота столба над жерлом, м
    const spread = Math.min(1, age / 30); // зонтик расползается
    const drift = Math.min(age, 40) * 380; // ветер на высоте несёт пепел на запад
    const lit = 0.25 + 0.75 * env.light;
    const life = 1 - smooth((age - 45) / 45); // извержение затихает за полторы минуты
    for (const p of v.puffs) {
      let x;
      let y;
      let z;
      let size;
      let op;
      if (p.col) {
        // столб: пуфы по высоте, у жерла уже, выше шире; медленно поднимаются (цикл), чуть качаются
        const k = (p.u + age * 0.06) % 1;
        const hgt = k * top;
        const rad = 400 + hgt * 0.18;
        const a = p.v * Math.PI * 2;
        x = Math.cos(a) * rad * p.w - drift * k * k * 0.4;
        z = Math.sin(a) * rad * p.w;
        y = hgt;
        size = (900 + hgt * 0.35) * (0.7 + 0.6 * p.w) * (0.6 + 0.4 * v.power);
        op = 0.85 * smooth(age / 0.6) * (1 - smooth((k - 0.9) / 0.1) * 0.5) * life;
      } else {
        // зонтик: на высоте вершины столба, расползается по кругу и уносится на запад
        const a = p.v * Math.PI * 2;
        const rr = (2000 + 26000 * spread * v.power) * Math.sqrt(p.u);
        x = Math.cos(a) * rr - drift * (0.6 + 0.4 * p.u);
        z = Math.sin(a) * rr * 0.7;
        y = top * (0.92 + 0.12 * (p.w - 0.5)) - 600 * p.u;
        size = (2600 + 5200 * spread) * (0.6 + 0.6 * p.w) * (0.6 + 0.4 * v.power);
        op = 0.8 * smooth((age - 1.2) / 2.5) * (1 - 0.4 * p.u) * (1 - smooth((age - 55) / 50));
      }
      p.sp.position.set(v.vent.x + x, v.vent.y + y, v.vent.z + z);
      p.sp.scale.setScalar(size);
      // свет: со стороны Солнца светлее; низ столба ночью подсвечен лавой
      tmp.set(x, y - top * 0.5, z).normalize();
      const side = 0.65 + 0.35 * Math.max(0, tmp.dot(env.sun));
      const c = p.sp.material.color;
      c.copy(env.ash).multiplyScalar(lit * side);
      if (p.col) c.lerp(new THREE.Color(1.0, 0.42, 0.14), (1 - env.light) * 0.55 * Math.max(0, 1 - y / 3000));
      p.sp.material.opacity = op;
    }
    v.glow.scale.setScalar(2600 * (0.6 + 0.4 * v.power));
    v.glow.material.opacity = (0.25 + 0.6 * (1 - env.light)) * smooth(age / 0.5) * life;
    // молнии: вспышки по 0,07 с в случайные моменты, чаще в начале
    const slot = Math.floor(t / 0.07);
    const p0 = 0.14 * Math.exp(-age / 25) + 0.03;
    if (age > 1.2 && life > 0.3 && hash(slot + v.start * 13) < p0) {
      const br = rng(slot * 7 + Math.round(v.start));
      const arr = v.bolt.geometry.attributes.position.array;
      let bx = (br() - 0.5) * 1500;
      let by = top * (0.3 + 0.5 * br());
      let bz = (br() - 0.5) * 1500;
      for (let i = 0; i < 15; i++) {
        arr[i * 3] = v.vent.x + bx;
        arr[i * 3 + 1] = v.vent.y + by;
        arr[i * 3 + 2] = v.vent.z + bz;
        bx += (br() - 0.5) * 900;
        by -= (top * 0.5) / 14 * (0.5 + br());
        bz += (br() - 0.5) * 900;
      }
      v.bolt.geometry.attributes.position.needsUpdate = true;
      v.bolt.visible = true;
      v.bolt.material.opacity = 1;
      flash = Math.max(flash, 0.5 * v.power);
      for (const p of v.puffs) if (p.col) p.sp.material.color.lerp(new THREE.Color(0.9, 0.9, 1.0), 0.5);
    }
  }
  for (const a of fx.avals) {
    const age = t - a.start;
    const on = age > 0 && age < 14;
    for (const p of a.puffs) p.sp.visible = on;
    if (!on) continue;
    const d0 = a.dist * 1000;
    for (const p of a.puffs) {
      // снежная пыль: облако растёт и сползает вниз по склону, поднимаясь над краем купола
      const k = smooth(age / 6);
      const rr = d0 + (200 + 900 * p.u) * k;
      const lateral = (p.v - 0.5) * (120 + 500 * k);
      const ax = Math.sin(a.az);
      const az = -Math.cos(a.az);
      const x = ax * rr + az * lateral;
      const z = az * rr - ax * lateral;
      const ground = elevation(x / 1000, -z / 1000) - SUMMIT - drop(Math.hypot(x, z));
      const y = ground + (40 + 260 * p.w) * k + 60 * Math.sin(age * 0.8 + p.u * 6);
      p.sp.position.set(x, y, z);
      p.sp.scale.setScalar((90 + 380 * p.w) * (0.4 + 0.9 * k));
      p.sp.material.opacity = 0.75 * smooth(age / 0.8) * (1 - smooth((age - 7) / 7));
      p.sp.material.color.setRGB(0.95, 0.97, 1.0).multiplyScalar(0.3 + 0.7 * env.light);
    }
  }
  return { flash };
}
