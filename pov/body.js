// Тело для вида от первого лица: корпус, ноги, руки с кистями и браслет-глубиномер на левом запястье.
// Камера сидит в голове, сама голова не рисуется. Руки ставятся через IK на два сустава.
import * as THREE from 'three';
import { box, canvasTexture, clamp, lambert } from './util.js';

const UPPER = 0.31; // плечо → локоть
const FORE = 0.27; // локоть → запястье

// Палитра заказчика (#A3B886, #A38B4A, #F3E6AB), чуть светлее — в сумерках так читается лучше
const COLORS = {
  jacket: 0xadc392, // шалфейная куртка-рубашка
  jacketDark: 0x8ea476, // швы, клапаны карманов
  shirt: 0xf6ebb6, // кремовая футболка под расстёгнутой курткой
  rib: 0xf1e3a6, // кремовые трикотажные манжеты и низ куртки
  trousers: 0xb19755, // брюки цвета хаки
  trousersDark: 0x947c43, // карманы-карго
  shoe: 0xf6ebb6, // кремовые кеды
  stripe: 0xadc392, // шалфейная полоса на кедах
  sole: 0xfbf8ef,
  skin: 0xd59d78,
  band: 0x2a2c30,
};

export function buildBody() {
  const m = Object.fromEntries(Object.entries(COLORS).map(([k, c]) => [k, lambert(c)]));
  const root = new THREE.Group();

  // Куртка нараспашку: шалфейные полы, между ними кремовая футболка, внизу трикотажная резинка
  const torso = box(0.44, 0.54, 0.23, m.jacket);
  torso.position.set(0, 1.2, 0.01);
  root.add(torso);
  const shirt = box(0.15, 0.5, 0.006, m.shirt);
  shirt.position.set(0, 1.21, -0.103);
  root.add(shirt);
  for (const s of [-1, 1]) {
    const placket = box(0.022, 0.5, 0.008, m.jacketDark);
    placket.position.set(0.085 * s, 1.21, -0.104);
    root.add(placket);
    const pocket = box(0.11, 0.1, 0.008, m.jacketDark);
    pocket.position.set(0.15 * s, 1.31, -0.105);
    root.add(pocket);
  }
  const hem = box(0.45, 0.05, 0.235, m.rib);
  hem.position.set(0, 0.95, 0.01);
  root.add(hem);
  const hips = box(0.38, 0.2, 0.22, m.trousers);
  hips.position.set(0, 0.86, 0);
  root.add(hips);

  const legs = [-1, 1].map((s) => {
    const hip = new THREE.Group();
    hip.position.set(0.1 * s, 0.935, 0);
    root.add(hip);
    const thigh = box(0.16, 0.44, 0.18, m.trousers);
    thigh.position.y = -0.22;
    hip.add(thigh);
    const cargo = box(0.012, 0.14, 0.12, m.trousersDark);
    cargo.position.set(0.086 * s, -0.27, 0);
    hip.add(cargo);
    const knee = new THREE.Group();
    knee.position.y = -0.44;
    hip.add(knee);
    const shin = box(0.14, 0.42, 0.16, m.trousers);
    shin.position.y = -0.21;
    knee.add(shin);
    const foot = new THREE.Group();
    foot.position.y = -0.425;
    knee.add(foot);
    const upper = box(0.13, 0.09, 0.29, m.shoe);
    upper.position.set(0, 0, -0.06);
    foot.add(upper);
    const stripe = box(0.134, 0.03, 0.16, m.stripe);
    stripe.position.set(0, -0.005, -0.04);
    foot.add(stripe);
    const sole = box(0.138, 0.04, 0.3, m.sole);
    sole.position.set(0, -0.062, -0.06);
    foot.add(sole);
    const tongue = box(0.07, 0.014, 0.12, m.stripe);
    tongue.position.set(0, 0.049, -0.1);
    foot.add(tongue);
    return { hip, knee, foot, s };
  });

  // Экран глубиномера: перерисовывается, только когда меняется число
  const screen = { canvas: null, text: '' };
  const screenTex = canvasTexture(160, 96, (ctx, w, h) => {
    screen.canvas = ctx;
    ctx.fillStyle = '#05090b';
    ctx.fillRect(0, 0, w, h);
  });

  const arms = [-1, 1].map((s) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(0.255 * s, 1.43, 0);
    root.add(shoulder);
    const upper = box(0.115, UPPER, 0.115, m.jacket);
    upper.position.y = -UPPER / 2;
    shoulder.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -UPPER;
    shoulder.add(elbow);
    const fore = box(0.105, FORE - 0.07, 0.105, m.jacket);
    fore.position.y = -(FORE - 0.07) / 2;
    elbow.add(fore);
    const cuff = box(0.118, 0.05, 0.118, m.rib);
    cuff.position.y = -FORE + 0.075;
    elbow.add(cuff);

    // Кисть: ладонь смотрит внутрь (к телу), пальцы вниз, большой палец вперёд
    const wrist = new THREE.Group();
    wrist.position.y = -FORE;
    elbow.add(wrist);
    const palm = box(0.034, 0.095, 0.085, m.skin);
    palm.position.y = -0.05;
    wrist.add(palm);
    for (let i = 0; i < 4; i++) {
      const len = 0.078 - Math.abs(i - 1.2) * 0.009;
      const finger = new THREE.Group();
      finger.position.set(0, -0.097, -0.03 + i * 0.02);
      finger.rotation.z = -s * 0.55; // пальцы чуть согнуты к ладони
      const f = box(0.02, len, 0.018, m.skin);
      f.position.y = -len / 2;
      finger.add(f);
      wrist.add(finger);
    }
    const thumb = box(0.022, 0.06, 0.024, m.skin);
    thumb.position.set(-s * 0.012, -0.045, -0.05);
    thumb.rotation.x = 0.6;
    wrist.add(thumb);

    if (s === -1) {
      // Браслет на тыльной стороне левого запястья
      const band = box(0.05, 0.04, 0.1, m.band);
      band.position.set(0.0, 0.022, 0);
      wrist.add(band);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(0.084, 0.05), new THREE.MeshBasicMaterial({ map: screenTex }));
      face.position.set(-0.026, 0.022, 0);
      face.rotation.set(0, -Math.PI / 2, -Math.PI / 2); // текст вдоль предплечья
      wrist.add(face);
    }
    return { shoulder, elbow, wrist, s };
  });

  // Свечение браслета: под землёй это единственный свет рядом с героем
  const glow = new THREE.PointLight(0xa8f4ee, 0, 10, 1.4);
  arms[0].wrist.add(glow);
  glow.position.set(-0.16, 0.05, 0); // в стороне от кисти, чтобы не пересвечивать её

  // Шея → камера: голова вращается вокруг шеи, глаза чуть впереди
  const neck = new THREE.Group();
  neck.position.set(0, 1.52, -0.02);
  neck.rotation.order = 'YXZ';
  root.add(neck);

  return { root, legs, arms, neck, glow, screen, screenTex };
}

// --- позы ---------------------------------------------------------------

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

// Цель кисти: позиция запястья, подсказка для локтя, направление пальцев, нормаль ладони (в системе тела)
function pose(s, name) {
  switch (name) {
    case 'rest':
      return { pos: v3(0.29 * s, 0.8, -0.02), pole: v3(0.3 * s, 0, 0.5), fingers: v3(0, -1, 0), palm: v3(-s, 0, 0) };
    case 'balance':
      return {
        pos: v3(0.46 * s, 0.92, -0.22),
        pole: v3(0.8 * s, -0.4, 0.2),
        fingers: v3(0.35 * s, -0.55, -0.75),
        palm: v3(-0.2 * s, -0.95, 0.15),
      };
    case 'check': {
      // левая рука перед лицом, тыльная сторона запястья — к глазам
      const pos = v3(0.0, 1.33, -0.44);
      const toEye = v3(0, 1.67, -0.1).sub(pos).normalize();
      return { pos, pole: v3(-0.7, -0.7, 0.1), fingers: v3(0.9, 0.05, -0.35), palm: toEye.negate() };
    }
    case 'shield':
      return { pos: v3(0.06, 1.52, -0.33), pole: v3(0.8, -0.5, 0.2), fingers: v3(-0.25, 0.75, -0.3), palm: v3(0.05, 0, -1) };
  }
}

function mix(a, b, k) {
  return {
    pos: a.pos.clone().lerp(b.pos, k),
    pole: a.pole.clone().lerp(b.pole, k),
    fingers: a.fingers.clone().lerp(b.fingers, k).normalize(),
    palm: a.palm.clone().lerp(b.palm, k).normalize(),
  };
}

const AX = v3(1, 0, 0);

function solveArm(arm, goal) {
  const S = arm.shoulder.position;
  const toT = goal.pos.clone().sub(S);
  const d = clamp(toT.length(), 0.05, UPPER + FORE - 1e-3);
  const u = toT.normalize();
  const cosA = clamp((UPPER * UPPER + d * d - FORE * FORE) / (2 * UPPER * d), -1, 1);
  const sinA = Math.sqrt(1 - cosA * cosA);
  const v = goal.pole.clone().sub(u.clone().multiplyScalar(goal.pole.dot(u))).normalize();
  const dirU = u.clone().multiplyScalar(cosA).addScaledVector(v, sinA);
  const elbowPos = S.clone().addScaledVector(dirU, UPPER);
  const dirF = S.clone().addScaledVector(u, d).sub(elbowPos).normalize();

  // Плечо: локальная -Y вдоль плеча, сгиб локтя — вокруг локальной X в сторону -Z
  const y = dirU.clone().negate();
  const zb = dirF.clone().addScaledVector(dirU, -dirF.dot(dirU));
  if (zb.lengthSq() < 1e-8) zb.copy(v);
  const z = zb.normalize().negate();
  const x = new THREE.Vector3().crossVectors(y, z).normalize();
  arm.shoulder.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  arm.elbow.quaternion.setFromAxisAngle(AX, Math.acos(clamp(dirU.dot(dirF), -1, 1)));

  // Кисть: локальная -Y — пальцы, ладонь — локальная -s·X
  const hy = goal.fingers.clone().negate();
  let hx = goal.palm.clone().multiplyScalar(-arm.s);
  const hz = new THREE.Vector3().crossVectors(hx, hy).normalize();
  hx = new THREE.Vector3().crossVectors(hy, hz).normalize();
  const hand = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(hx, hy, hz));
  const parent = arm.shoulder.quaternion.clone().multiply(arm.elbow.quaternion);
  arm.wrist.quaternion.copy(parent.invert().multiply(hand));
}

// Веса: balance — обе руки в стороны для равновесия; check — левая к глазам; shield — правая заслоняет лицо
export function poseBody(body, t, w) {
  for (const arm of body.arms) {
    let goal = mix(pose(arm.s, 'rest'), pose(arm.s, 'balance'), w.balance);
    if (arm.s === -1 && w.check > 0) goal = mix(goal, pose(-1, 'check'), w.check);
    if (arm.s === 1 && w.shield > 0) goal = mix(goal, pose(1, 'shield'), w.shield);
    // чуть дышат, даже когда стоим
    goal.pos.y += Math.sin(t * 1.6 + arm.s) * 0.006;
    solveArm(arm, goal);
  }
  for (const leg of body.legs) {
    // ноги слегка расходятся, когда опора уходит из-под ног
    leg.hip.rotation.z = leg.s * (0.03 + 0.06 * w.balance);
    leg.knee.rotation.x = 0.04 + 0.08 * w.balance;
    leg.foot.rotation.x = -0.04 - 0.08 * w.balance;
  }
}

// Число на экране браслета
export function drawGauge(body, depth) {
  const text = depth < 10 ? depth.toFixed(2) : depth < 100 ? depth.toFixed(1) : Math.round(depth).toString();
  if (text === body.screen.text) return;
  body.screen.text = text;
  const ctx = body.screen.canvas;
  const { width: w, height: h } = ctx.canvas;
  ctx.fillStyle = '#05090b';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#5ff2e8';
  ctx.font = '600 52px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2 - 10, h / 2 - 6);
  ctx.font = '600 24px "JetBrains Mono", monospace';
  ctx.fillText('m', w - 18, h / 2 + 14);
  ctx.fillRect(14, h - 14, (w - 28) * Math.min(1, Math.log10(1 + depth) / 4), 4);
  body.screenTex.needsUpdate = true;
}
