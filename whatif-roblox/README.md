# What if the WHOLE WORLD became Roblox? — анимация

Ролик 12–14 мин в формате «what if» (референс — канал Skylox Story), озвучка на английском.
Сюжет: весь мир становится Roblox, внутри — 1–2 главы по игре **Steal an Egg**.

## Сценарий и озвучка

| Файл | Что это |
|---|---|
| `script/SCRIPT.md` | полный сценарий (~14 мин): пересказ, персонажи, 14 сцен — кадр, эмоции, камера, эффекты, реплики |
| `script/VOICEOVER_eleven_v4.txt` | озвучка для ElevenLabs v4 (Text to Dialogue): 16 дублей, теги интонаций, кастинг голосов |
| `script/lines.json` | все реплики с расчётным таймингом — для таймлайна анимации |

Сценарий — единственный источник: правим `SCRIPT.md`, потом `node tools/build_vo.js` пересобирает
файл озвучки, `lines.json` и таймкоды сцен.

## Концепт героя

| Файл | Что это |
|---|---|
| `concept/turnaround.png` | герой: спереди, 3/4, профиль, сзади |
| `concept/expressions.png` | 25 эмоций (глаза + брови-чёлка + рот) |
| `concept/mouths.png` | 9 ртов для липсинка (набор Rhubarb) + 16 «игровых» ртов |
| `concept/poses.png` | позы: idle, wave, cheer, shock, T-pose, кража яйца, бег, «oof» |
| `concept/rig.png` | разбор куклы: части, шарниры, плавный поворот, брови |
| `concept/rig_test.mp4` | 10-секундный тест анимации 1080p60 |

## Концепт Nova

| Файл | Что это |
|---|---|
| `concept/nova_turnaround.png` | Nova: спереди, 3/4, профиль, сзади |
| `concept/nova_expressions.png` | 14 эмоций + 4 положения очков (на носу, сползли, на лбу, сняты) |
| `concept/nova_poses.png` | позы: idle, peace, бег с тремя яйцами, сальто, «Talk less», шок, смех, цветы |
| `concept/keyart_flowers.png` | ключевой кадр финала: YOU дарит цветы |
| `concept/nova_test.mp4` | 6-секундный тест анимации Nova (1080p60) |

## Как устроено

Герой — «кукла» (cut-out rig) в коде, без покадровой отрисовки:

- `rig/body.js` — общий скелет для всех персонажей: иерархия, шарниры, виды, поворот, тень, ник.
  Каждый персонаж — это «дизайн» (свои волосы, одежда, лицо) поверх этого скелета.
- `rig/nova.js` — Nova: полулинзы (`glasses: 'half' | 'up' | 'off'`, `glassesDy`), хвост (`tail` — качание),
  свои эмоции (`cool`, `smirk`, `teasing`, `wink`, …), остальные берутся из общей библиотеки.
- `rig/hero.js` — YOU. Части на шарнирах (шея, плечи, бёдра), виды `front` / `side` / `back`,
  параметр `turn` (-1…1) плавно поворачивает до 3/4, squash & stretch, прыжок, наклон, реквизит.
- `rig/face.js` — глаза (веки, взгляд, зрачки-звёзды/Robux/сердца/спирали), рты, визем-рты,
  эффекты (пот, слёзы, румянец, «?», «!»), 25 готовых эмоций. Брови = V-вырез чёлки.
- `rig/props.js` — яйца в стиле Steal an Egg (common / rare / epic / legendary / mythic), букет.
- `tools/render.js` — SVG → Chromium → PNG → ffmpeg (MP4).
- `tools/sheets.js`, `tools/nova_sheets.js` — концепт-листы; `tools/anim_test.js`, `tools/nova_test.js` — тестовые сцены.
- `tools/build_vo.js` — сценарий → файл озвучки + тайминг.

Поза — обычный объект:

```js
drawHero({ x: 960, y: 975, s: 0.72, turn: 0.3, armR: 150, face: { name: 'talkHappy', mouth: 'D' } })
```

## Запуск

Нужны Node 18+, Playwright с Chromium и ffmpeg.

```bash
node tools/sheets.js all
```

```bash
node tools/anim_test.js concept/rig_test.mp4 60
```

```bash
node tools/build_vo.js
```

Шрифты Fredoka и Lilita One лежат в `assets/fonts` (лицензия SIL OFL).
