# Персонажи — развороты (спереди / сбоку / сзади)

Все персонажи нарисованы в стиле первого референса: большая голова, простое лицо
(глаза-овалы, нос «уголком»), толстый чёрный контур, плоская заливка с одной тенью.
**Руки и ноги — палки.**

## Элли

![Разворот Элли](characters/ellie/png/turnaround.png)

- **Одежда:** красная майка без рукавов.
- **Волосы:** каштановые с рыжиной — боковой пробор, чёлка набок, пряди у лица,
  хвост на тёмной резинке.
- **Рюкзак:** чёрно-серый. Спереди лямки с пряжками и нагрудным ремешком, сбоку — рюкзак
  в профиль с боковым карманом, сзади — молния и передний карман.
- Веснушки на щеках.

## Джоэл

![Разворот Джоэла](characters/joel/png/turnaround.png)

- **Одежда:** рубашка цвета хаки без рукавов — воротник, планка с пуговицами, два
  нагрудных кармана с клапанами.
- **Голова:** короткие тёмные волосы, короткая борода с проседью и усы, густые брови.
- **Рюкзак:** коричневый. Спереди лямки с металлическими D-кольцами и пряжками, сбоку —
  клапан и боковой карман, сзади — клапан с двумя ремешками на пряжках.
- **Рост:** Джоэл выше Элли. Его холст 600×1100 вместо 600×1000, земля на том же отступе
  снизу, поэтому в одном масштабе рост соотносится правильно.

## Сара

![Разворот Сары](characters/sarah/png/turnaround.png)

- **Одежда:** розовая майка без рукавов.
- **Волосы:** светлое каре до подбородка, чёлка набок от пробора, пряди заправлены за уши.
- **Детали:** бусы с кулоном-зубом, как на фото; румянец и улыбка.
- **Рост:** немного ниже Элли — голова и тело примерно 94 % от неё, холст тот же 600×1000.

## Файлы

| Путь | Что это |
|---|---|
| `characters/<имя>/front.svg`, `side.svg`, `back.svg` | отдельные виды, вектор |
| `characters/<имя>/turnaround.svg` | лист-разворот: три вида, направляющие по высоте, палитра |
| `characters/<имя>/png/*.png` | те же файлы в PNG ×2; отдельные виды — на прозрачном фоне |
| `tools/ellie.py`, `tools/joel.py`, `tools/sarah.py` | формы и палитра каждого персонажа |
| `tools/charlib.py` | общие функции: примитивы SVG, лист-разворот |
| `tools/build_characters.py` | сборка SVG |
| `tools/render.js` | рендер SVG → PNG |

## Слои для анимации

Каждая часть лежит в отдельной группе `<g id="вид-часть">`, например `front-arm-left`,
`side-beard`, `back-backpack`. `left`/`right` — сторона самого персонажа: на виде спереди
`front-arm-left` находится справа от зрителя.

| Персонаж и вид | Группы (снизу вверх по порядку отрисовки) |
|---|---|
| Элли, спереди | `ponytail`, `hair-back`, `leg-right`, `leg-left`, `arm-right`, `arm-left`, `neck`, `top`, `backpack-straps`, `ear-right`, `ear-left`, `face`, `face-features`, `hair-lock-left`, `hair-lock-right`, `hair-tuft`, `hair` |
| Элли, сбоку | `ponytail`, `leg-left`, `leg-right`, `backpack`, `top`, `backpack-strap`, `arm-right`, `head`, `face-features`, `ear-right`, `hair-lock-right`, `hair-tuft`, `hair`, `hair-tie` |
| Элли, сзади | `leg-left`, `leg-right`, `arm-left`, `arm-right`, `top`, `backpack`, `ear-left`, `ear-right`, `head`, `hair-tuft`, `hair`, `ponytail`, `hair-tie` |
| Джоэл, спереди | `hair-back`, `leg-right`, `leg-left`, `arm-right`, `arm-left`, `neck`, `shirt`, `backpack-straps`, `ear-right`, `ear-left`, `face`, `face-features`, `beard`, `hair` |
| Джоэл, сбоку | `leg-left`, `leg-right`, `backpack`, `shirt`, `backpack-strap`, `arm-right`, `head`, `ear-right`, `face-features`, `beard`, `hair` |
| Джоэл, сзади | `leg-left`, `leg-right`, `arm-left`, `arm-right`, `shirt`, `backpack`, `ear-left`, `ear-right`, `head`, `hair` |
| Сара, спереди | `hair-back`, `leg-right`, `leg-left`, `arm-right`, `arm-left`, `neck`, `top`, `necklace`, `face`, `face-features`, `hair`, `ear-right`, `ear-left` |
| Сара, сбоку | `leg-left`, `leg-right`, `top`, `necklace`, `arm-right`, `head`, `face-features`, `hair`, `ear-right` |
| Сара, сзади | `leg-left`, `leg-right`, `arm-left`, `arm-right`, `top`, `ear-left`, `ear-right`, `hair` |

Руки и ноги — одиночные линии; первая точка пути — плечо или бедро, её удобно брать за
точку поворота.

## Палитры

| Что | Элли | Джоэл | Сара |
|---|---|---|---|
| Кожа / тень | `#f8ccb1` / `#e8ab8e` | `#f0c09c` / `#d99f7e` | `#f9d0b6` / `#eab092` |
| Волосы / тень | `#8a4b2f` / `#6a3521` | `#4b3c31` / `#34291f` | `#dab57c` / `#b68f58` |
| Борода / тень | — | `#65574b` / `#51453a` | — |
| Одежда / тень | майка `#c2423a` / `#9c332e` | рубашка хаки `#7a7955` / `#5f5e41` | майка `#e3a0b5` / `#c47f96` |
| Рюкзак / карманы, клапан | `#4b4f55` / `#3b3e43` | `#8a6039` / `#6c4a2b` | — |
| Ремни, лямки | `#2a2c30` | `#553a24` | — |
| Пряжки, металл | `#8e949b` | `#b9b4a8` | — |
| Бусы: тёмные / светлые / кулон | — | — | `#5c4433` / `#d8c5a4` / `#f4efe4` |
| Веснушки, румянец | `#d4917a` | — | `#f4a9a3` |
| Контур | `#1c1a1a` | `#1c1a1a` | `#1c1a1a` |

## Как пересобрать

```bash
python3 tools/build_characters.py        # SVG всех персонажей (или: ... sarah)

# PNG: нужен Node.js и Playwright (ставится один раз)
npm i --no-save playwright && npx playwright install chromium
node tools/render.js                     # PNG ×2 (или: node tools/render.js 2 sarah)
```

## Фоны Minecraft

Квадратные картинки 1080×1080, отрендерены в Blender. Камера на высоте глаз и смотрит
строго прямо: вертикали ровные, без взгляда снизу.

| Файл | Что на картинке |
|---|---|
| `backgrounds/field/field.png` | поле с цветами, сзади деревья — в стиле роликов toonz CRAFT |
| `backgrounds/field/portal.png` | портал в Незер посередине того же поля; внутри рамки пусто |
| `backgrounds/field/field_toon.png` | поле в рисованном стиле |
| `backgrounds/field/portal_toon.png` | горящий портал в рисованном стиле: внутри фиолетовое пламя, вокруг свечение |
| `backgrounds/nether/nether_toon.png` | Незер в рисованном стиле: земля из незерака, огонь, лужа и река лавы, вдали скалы с лавопадами |
| `backgrounds/grass/grass_toon.png` | только трава Minecraft в рисованном стиле, фон прозрачный — слой поверх фона |
| `backgrounds/meadow/meadow.png` | поляна в стиле toonz CRAFT: дерево с кроной слева, посередине свободная трава под качели, фон размыт |
| `backgrounds/coast/coast.png` | поле без деревьев, спускается к пляжу, сзади море до горизонта — цвета как у поляны |
| `backgrounds/aerial/aerial.png` | вид с большой высоты: земля круглая, внизу поле с рощами и пляж, дальше море с островами, у горизонта полоска суши и свечение атмосферы |
| `backgrounds/sky/sky.png` | только небо с облаками Minecraft, низ кадра на горизонте — цвета как у поляны |
| `backgrounds/props/swing.png` | качели из блоков (ель, каменный кирпич, цепи), прямо спереди, фон прозрачный, тонкая чёрная обводка |

Рисованный стиль — как у персонажей: толстая чёрная обводка, плоские сочные цвета и одна
тень. Обводка вблизи толще, вдали тоньше.

### Как пересобрать

```bash
# нужен Blender 4.2+ (без аддонов); на процессоре ~3,5 мин на кадр, рисованный — ~1 мин
blender -b --factory-startup -P tools/mc_scene.py -- --shot field
blender -b --factory-startup -P tools/mc_scene.py -- --shot portal
blender -b --factory-startup -P tools/mc_scene.py -- --shot field --style toon
blender -b --factory-startup -P tools/mc_scene.py -- --shot portal --style toon
blender -b --factory-startup -P tools/mc_scene.py -- --shot nether --style toon
blender -b --factory-startup -P tools/mc_scene.py -- --shot meadow
blender -b --factory-startup -P tools/mc_scene.py -- --shot coast
blender -b --factory-startup -P tools/mc_scene.py -- --shot sky
blender -b --factory-startup -P tools/mc_scene.py -- --shot aerial
blender -b --factory-startup -P tools/mc_scene.py -- --shot swing   # качели, PNG с прозрачностью
python3 tools/mc_grass.py                       # трава, нужен Pillow
# черновик за полминуты: ... --scale 0.4 --samples 24 --out /tmp/draft.png
```

Камеры, солнце, цвета, сочность, палитра и обводка рисованного стиля (`TOON…`), рельеф
Незера и лавопады (`NETHER_FALLS`) — константы в `tools/mc_scene.py`.

### Текстуры

Картинки отрендерены с текстурами Minecraft 1.21.4 (из официального `client.jar`).
Их нет в репозитории: скрипты берут их из `backgrounds/textures/minecraft/`, а эта папка
в `.gitignore`. Чтобы её заполнить, распакуй `assets/minecraft/textures/block` из
`.minecraft/versions/<версия>/<версия>.jar` и положи туда файлы с теми же именами,
что в `backgrounds/textures/pixel-perfection/`.

Без этой папки скрипты берут свободные текстуры Pixel Perfection (XSSheep,
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), из игры
[Mineclonia](https://codeberg.org/mineclonia/mineclonia)) из `backgrounds/textures/pixel-perfection/`.

## Звук для мультика

```bash
python3 tools/add_sound.py ВИДЕО.mp4      # → videos/<имя>_sound.mp4 и <имя>_sound_vertical.mp4
```

Звуки Minecraft (портал, шаги по траве, слизень, жители, эндермен, гаст, Незер, лава, еда,
отрыжка) скачиваются с официального сервера Mojang в `sound/minecraft/` — эта папка в
`.gitignore`. «Вуш», «бум» и свист падения синтезируются в скрипте. Фоновая музыка — своя
тихая мелодия на звуках нотных блоков (арфа, бас, колокольчик) с эхом, без чужих треков.
Расстановка звуков — список `CUES` в начале скрипта: время, звук, громкость, высота.

| Файл | Что это |
|---|---|
| `videos/f1f435b4-01_1_sound.mp4` | мультик со звуком, ориентация как у исходника (лежит на боку) |
| `videos/f1f435b4-01_1_sound_vertical.mp4` | то же, повёрнуто в вертикаль 1080×1920 для Shorts |
