// Раскадровка теста. Всё, что зависит от времени, лежит в scene.json — его же читает pov/audio.py,
// поэтому звук совпадает с картинкой: такси, треск плитки, поезд, повороты головы.
import scene from './scene.json' with { type: 'json' };
import { monotone, track } from './util.js';

export const SCENE = scene;
export const DURATION = scene.duration;
export const PLAYER = scene.player; // стоим посреди площади Таймс-сквер, лицом на юг (-Z)
export const SIDEWALK = scene.plaza; // высота площади над проезжей частью

// Глубина подошв под площадью, м. Скорость только растёт: «не можешь остановиться».
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

export const CAPTIONS = scene.captions;
export const TITLE = scene.title;
export const CRACK = scene.crack;
export const UNDER = scene.under; // глаза проходят сквозь плитку площади
export const TRAIN = scene.train;

// Вехи пути вниз (по глубине подошв, м) — для строки «дальше» и шкалы справа
export const MILESTONES = [
  [1.65, 'under the street'],
  [3.4, 'water mains'],
  [7.1, 'subway tunnel'],
  [11.7, 'bedrock'],
  [55, 'deepest subway station'],
  [4000, 'deepest mine'],
];
