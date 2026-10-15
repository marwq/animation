// Узнаваемые силуэты Нью-Йорка в низкополигональном стиле: Эмпайр-стейт-билдинг и Крайслер-билдинг
// на горизонте, башня One Times Square с экранами и новогодним шаром, красная лестница на площади Даффи.
// Только архитектура, никаких логотипов.
import * as THREE from 'three';
import { Batch, canvasTexture, uvBox } from './util.js';

const glow = (color, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k) });

// Фасад ар-деко: вертикальные светлые простенки и тёплые окна между ними
export function artDecoTexture(base = '#b9ae98', light = '#ffe2a6') {
  const tex = canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 16) {
      for (let y = 0; y < h; y += 8) {
        ctx.fillStyle = Math.sin(x * 12.9 + y * 78.2) > 0.1 ? light : '#2b2a33';
        ctx.fillRect(x + 6, y + 2, 5, 5);
      }
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Эмпайр-стейт-билдинг: ступенчатые уступы, светящаяся корона, мачта и антенна
export function empireState() {
  const g = new THREE.Group();
  const tex = artDecoTexture();
  const mat = new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.55 });
  const b = new Batch();
  const tiers = [
    [110, 26, 60],
    [76, 60, 46],
    [58, 214, 38],
    [46, 26, 30],
    [34, 22, 24],
    [24, 20, 17],
  ];
  let y = 0;
  for (const [w, h, d] of tiers) {
    b.add(uvBox(w, h, d, 16, 16), mat, 0, y + h / 2, 0);
    y += h;
  }
  b.build(g);
  // корона: подсвеченные белым и голубым ярусы
  const crownMats = [glow(0xffffff, 1.25), glow(0x9fd0ff, 1.2), glow(0xffffff, 1.3)];
  [[17, 9], [13, 10], [9, 9]].forEach(([r, h], i) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.82, r, h, 8), crownMats[i]);
    c.position.y = y + h / 2;
    g.add(c);
    y += h;
  });
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 5, 34, 8), new THREE.MeshLambertMaterial({ color: 0xc9c2b4, emissive: 0x8899aa, emissiveIntensity: 0.4 }));
  mast.position.y = y + 17;
  g.add(mast);
  y += 34;
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.2, 62, 6), new THREE.MeshLambertMaterial({ color: 0xbbbbbb }));
  antenna.position.y = y + 31;
  g.add(antenna);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 6), glow(0xff3030, 1.5));
  beacon.position.y = y + 62;
  g.add(beacon);
  return g;
}

// Крайслер-билдинг: серебристый ствол и знаменитая корона из ступенчатых арок со шпилем
export function chrysler() {
  const g = new THREE.Group();
  const tex = artDecoTexture('#b8bcc4', '#ffe7b8');
  const mat = new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.5 });
  const b = new Batch();
  b.add(uvBox(60, 70, 60, 16, 16), mat, 0, 35, 0);
  b.add(uvBox(44, 170, 44, 16, 16), mat, 0, 70 + 85, 0);
  b.build(g);
  let y = 240;
  const steel = new THREE.MeshLambertMaterial({ color: 0xd9dde4, emissive: 0x707784, emissiveIntensity: 0.35, flatShading: true });
  const arch = glow(0xfff1cc, 1.35);
  for (let i = 0; i < 6; i++) {
    const hw = 19 - i * 3;
    const h = 9;
    const tier = new THREE.Mesh(new THREE.BoxGeometry(hw * 2, h, hw * 2), steel);
    tier.position.y = y + h / 2;
    g.add(tier);
    // светящиеся полукруглые арки на каждой из четырёх сторон
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(hw * 0.86, 0.55, 4, 14, Math.PI), arch);
      ring.position.set(Math.sin(a) * (hw + 0.1), y + h * 0.35, Math.cos(a) * (hw + 0.1));
      ring.rotation.y = a;
      g.add(ring);
      // треугольные окна-«лучи» под аркой
      for (let j = -2; j <= 2; j++) {
        const tri = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.6, 3), arch);
        tri.position.set(Math.sin(a) * (hw + 0.2) + Math.cos(a) * j * hw * 0.32, y + h * 0.3 + 1.4, Math.cos(a) * (hw + 0.2) - Math.sin(a) * j * hw * 0.32);
        tri.rotation.y = a;
        g.add(tri);
      }
    }
    y += h;
  }
  const spire = new THREE.Mesh(new THREE.ConeGeometry(2.4, 58, 8), steel);
  spire.position.y = y + 29;
  g.add(spire);
  return g;
}

// Тикер новостей: бегущая строка из обычных слов, без брендов
export function tickerTexture(text) {
  const tex = canvasTexture(2048, 64, (ctx, w, h) => {
    ctx.fillStyle = '#060606';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffb53a';
    ctx.font = '700 40px "Space Grotesk", sans-serif';
    ctx.textBaseline = 'middle';
    let x = 10;
    while (x < w) {
      ctx.fillText(text, x, h / 2 + 2);
      x += ctx.measureText(text).width + 40;
    }
  });
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

// One Times Square: узкая башня, вся северная грань — стопка экранов, сверху мачта с шаром
export function oneTimesSquare(screens) {
  const g = new THREE.Group();
  const facade = new THREE.MeshLambertMaterial({ color: 0x3a3d44 });
  const tower = new THREE.Mesh(new THREE.BoxGeometry(18, 112, 26), facade);
  tower.position.y = 56;
  g.add(tower);
  // экраны на северной (обращённой к нам) грани и по бокам
  const heights = [[10, 16], [28, 18], [48, 16], [66, 15], [83, 13]];
  heights.forEach(([y, h], i) => {
    const tex = screens.pick(i + 3);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(17.4, h), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.3, 1.3, 1.3) }));
    panel.position.set(0, y + h / 2, 13.05);
    g.add(panel);
    for (const s of [-1, 1]) {
      const side = new THREE.Mesh(new THREE.PlaneGeometry(25, h), new THREE.MeshBasicMaterial({ map: screens.pick(i + 7), color: new THREE.Color(1.2, 1.2, 1.2) }));
      side.position.set(s * 9.05, y + h / 2, 0);
      side.rotation.y = s * Math.PI / 2;
      g.add(side);
    }
  });
  // бегущая строка по низу
  const ticker = tickerTexture('TIMES SQUARE  •  NEW YORK CITY  •  TUESDAY 7:12 PM  •  72°F  •  ');
  ticker.repeat.set(1.6, 1);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(15.8, 15.8, 2.2, 32, 1, true, -Math.PI / 2, Math.PI), new THREE.MeshBasicMaterial({ map: ticker, side: THREE.DoubleSide }));
  band.scale.set(0.6, 1, 0.86);
  band.position.set(0, 7.2, 1.6);
  g.add(band);
  // мачта с новогодним шаром из граней
  const pole = new THREE.Mesh(new THREE.BoxGeometry(1.4, 22, 1.4), new THREE.MeshLambertMaterial({ color: 0x9aa0a8 }));
  pole.position.y = 112 + 11;
  g.add(pole);
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 1), new THREE.MeshBasicMaterial({ color: 0xcfe8ff, vertexColors: false }));
  ball.position.y = 112 + 23;
  g.add(ball);
  const sparkle = new THREE.Mesh(new THREE.IcosahedronGeometry(2.75, 1), new THREE.MeshBasicMaterial({ color: 0xff7ad9, wireframe: true }));
  sparkle.position.copy(ball.position);
  g.add(sparkle);
  return { group: g, ticker, ball: sparkle };
}

// Красная стеклянная лестница-трибуна (площадь Даффи): светится изнутри, на ступенях сидят люди
export function redSteps() {
  const g = new THREE.Group();
  const tread = glow(0xff2a20, 1.15);
  const riser = new THREE.MeshLambertMaterial({ color: 0x8a120e, emissive: 0xc0180f, emissiveIntensity: 0.9 });
  const b = new Batch();
  const steps = 12;
  for (let i = 0; i < steps; i++) {
    const y = (i + 1) * 0.4;
    b.box(14, 0.06, 1.05, tread, 0, y, i * 1.05 + 0.52);
    b.box(14, 0.4, 0.06, riser, 0, y - 0.2, i * 1.05);
  }
  // боковины
  for (const s of [-1, 1]) b.box(0.3, 4.8, 12.6, riser, s * 7.1, 2.4, 6.3);
  b.build(g);
  // будка под лестницей светится
  const booth = new THREE.Mesh(new THREE.BoxGeometry(12, 2.6, 2.2), new THREE.MeshBasicMaterial({ color: 0xffe0c8 }));
  booth.position.set(0, 1.3, 11.5);
  g.add(booth);
  const light = new THREE.PointLight(0xff3a2a, 25, 30, 1.3);
  light.position.set(0, 3, -3);
  g.add(light);
  return g;
}
