# What if the WHOLE WORLD became Roblox? — анимация

Ролик 12–14 мин в формате «what if» (референс — канал Skylox Story), озвучка на английском.
Сюжет: весь мир становится Roblox, внутри — 1–2 главы по игре **Steal an Egg**.

## Что уже есть

| Файл | Что это |
|---|---|
| `concept/turnaround.png` | герой: спереди, 3/4, профиль, сзади |
| `concept/expressions.png` | 25 эмоций (глаза + брови-чёлка + рот) |
| `concept/mouths.png` | 9 ртов для липсинка (набор Rhubarb) + 16 «игровых» ртов |
| `concept/poses.png` | позы: idle, wave, cheer, shock, T-pose, кража яйца, бег, «oof» |
| `concept/rig.png` | разбор куклы: части, шарниры, плавный поворот, брови |
| `concept/rig_test.mp4` | 10-секундный тест анимации 1080p60 |

## Как устроено

Герой — «кукла» (cut-out rig) в коде, без покадровой отрисовки:

- `rig/hero.js` — тело. Части на шарнирах (шея, плечи, бёдра), виды `front` / `side` / `back`,
  параметр `turn` (-1…1) плавно поворачивает до 3/4, squash & stretch, прыжок, наклон, реквизит.
- `rig/face.js` — глаза (веки, взгляд, зрачки-звёзды/Robux/сердца/спирали), рты, визем-рты,
  эффекты (пот, слёзы, румянец, «?», «!»), 25 готовых эмоций. Брови = V-вырез чёлки.
- `rig/props.js` — яйца в стиле Steal an Egg (common / rare / epic / legendary / mythic).
- `tools/render.js` — SVG → Chromium → PNG → ffmpeg (MP4).
- `tools/sheets.js` — концепт-листы, `tools/anim_test.js` — тестовая сцена.

Поза — обычный объект:

```js
drawHero({ x: 960, y: 975, s: 0.72, turn: 0.3, armR: 150, face: { name: 'talkHappy', mouth: 'D' } })
```

## Запуск

Нужны Node 18+, Playwright с Chromium и ffmpeg.

```bash
node tools/sheets.js all
node tools/anim_test.js concept/rig_test.mp4 60
```

Шрифты Fredoka и Lilita One лежат в `assets/fonts` (лицензия SIL OFL).
