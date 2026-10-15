// Раскадровка теста. Всё, что зависит от времени, лежит в scene.json — его же читает pov/audio.py,
// поэтому звук совпадает с картинкой: такси, треск плитки, поезд, повороты головы.
import scene from './scene.json' with { type: 'json' };
import { monotone, track } from './util.js';

export const SCENE = scene;
export const DURATION = scene.duration;
export const PLAYER = scene.player; // стоим посреди площади Таймс-сквер, лицом на юг (-Z)
export const SIDEWALK = scene.plaza; // высота площади над проезжей частью

// Глубина подошв под площадью, м. Герой стоит на крышке люка; крышка медленно уходит вниз по шахте
// в коллектор, тонет в воде — и дальше он проваливается сквозь грунт, всё быстрее.
export const depthAt = monotone(scene.depth);

// Голова и корпус: градусы, влево (+) / вправо (-), вверх (+) / вниз (-).
// Сплайн по ключам + пружина: повороты начинаются и заканчиваются мягко, без рывков.
export const headYaw = track(scene.head_yaw, 5.5);
export const headPitch = track(scene.head_pitch, 5.5);
export const bodyYaw = track(scene.body_yaw, 4);

// Веса поз рук: balance — руки в стороны, check — браслет к глазам, shield — заслониться от фар
export const balance = track(scene.balance, 6);
export const check = track(scene.check, 7);
export const shield = track(scene.shield, 8);
export const floatW = track(scene.float, 3.5); // невесомость в центре и подъём в океане
export const treadW = track(scene.tread, 3); // держаться на воде

export const CAPTIONS = scene.captions;
export const TITLE = scene.title;
export const CRACK = scene.crack; // крышка люка лязгает и проседает
export const UNDER = scene.under; // глаза уходят под воду коллектора — дальше грунт
export const MANHOLE = scene.manhole; // люк, шахта и коллектор: размеры по Y, капли, крыса
export const SOIL_TOP = scene.soil_top; // верх грунта под коллектором: трубы, тоннель метро и скала — ниже
export const PIPES = scene.pipes; // высоты труб под коллектором (y мира)
export const ROCK = scene.rock; // скала под тоннелем: пузырь видимости, слои, водовод, трещина, гранаты
export const SLABS = scene.slabs; // сплошные перекрытия: когда глаза проходят сквозь них, кадр на миг гаснет
export const COMPARE = scene.compare; // подпись под глубиной: «глубже, чем…»
export const EARTH = scene.earth; // м: насквозь до поверхности океана на другой стороне
export const CENTER = scene.center; // [начало, конец] невесомости в центре, с
export const OCEAN = scene.ocean; // дно, когда выныриваем из дна, когда выходим на поверхность
export const LAYERS = scene.layers; // слои вокруг «пузыря» глубже километра

// Температура вокруг (°C) по пройденному пути: линейно между ключами
export function temperatureAt(s) {
  const T = scene.temperature;
  if (s <= T[0][0]) return T[0][1];
  for (let i = 1; i < T.length; i++) {
    if (s <= T[i][0]) {
      const k = (s - T[i - 1][0]) / (T[i][0] - T[i - 1][0]);
      return T[i - 1][1] + (T[i][1] - T[i - 1][1]) * k;
    }
  }
  return T[T.length - 1][1];
}
export const TRAIN = scene.train;

// Вехи пути вниз (по глубине подошв, м) — для строки «дальше»
export const MILESTONES = scene.milestones;
