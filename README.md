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

---

# Персонажи из Moho — каждый слой в PNG

Исходники лежат в `moho/*.moho`: риги с костями из Moho. Каждый векторный слой выгружен
в отдельный PNG **на общем холсте персонажа**. У всех PNG одного персонажа одинаковый
размер, а часть нарисована ровно на своём месте. Положите файлы друг на друга по порядку
номеров, и руки, локти, колени встанут туда же, где они в Moho.

Всё снято в позе покоя (кадр 0 Moho). Кости в ней ничего не деформируют, поэтому каждая
часть выглядит так, как нарисована. Масштаб тот же, что в проекте: 1 единица Moho =
1000 px (кадр 2000×2000).

| Персонаж | Папка | Холст | Слоёв | Рты | Глаза | Костей |
|---|---|---|---|---|---|---|
| <img src="rigs/child-verity-big/preview.png" height="140"> child verity big | `rigs/child-verity-big/` | 709×2031 | 18 | 12 | — | 24 |
| <img src="rigs/child-verity-pink/preview.png" height="100"> child verity pink | `rigs/child-verity-pink/` | 733×946 | 2 | 6 | 3 | 6 |
| <img src="rigs/fat-verity-small/preview.png" height="100"> fat verity small | `rigs/fat-verity-small/` | 1213×1072 | 1 | 4 | 3 | 4 |
| <img src="rigs/girl-verity-big/preview.png" height="140"> girl verity big | `rigs/girl-verity-big/` | 734×2045 | 12 | 11 | 3 | 27 |
| <img src="rigs/girl-verity-small/preview.png" height="100"> girl verity small | `rigs/girl-verity-small/` | 731×816 | 3 | 11 | 3 | 5 |
| <img src="rigs/lord-verity-big/preview.png" height="140"> lord verity big | `rigs/lord-verity-big/` | 697×2035 | 17 | 12 | — | 27 |
| <img src="rigs/lord-verity-small/preview.png" height="100"> lord verity small | `rigs/lord-verity-small/` | 801×824 | 2 | 11 | 3 | 7 |
| <img src="rigs/skeleton-verity-big/preview.png" height="120"> skeleton verity big | `rigs/skeleton-verity-big/` | 2054×1773 | 19 | 12 | — | 25 |
| <img src="rigs/skeleton-verity-small/preview.png" height="100"> skeleton verity small | `rigs/skeleton-verity-small/` | 1266×812 | 1 | 11 | 3 | 6 |
| <img src="rigs/verity-big-girl/preview.png" height="140"> verity big girl | `rigs/verity-big-girl/` | 734×2045 | 12 | 11 | 3 | 27 |

«Слоёв» — обычные слои без вариантов рта и глаз. У child, lord и skeleton verity big
глаза — один слой `eye`, без вариантов.

**All verity color** (радужный скелет) пока не выгружен. Его радуга — это картинка
`Снимок экрана 2026-10-23 141923.png`, которой нет в архиве; персонаж придёт отдельно.

## Что лежит в папке персонажа

| Файл | Что это |
|---|---|
| `png/NN-слой.png` | слой на прозрачном фоне, холст общий для всего персонажа. `NN` — порядок отрисовки снизу вверх |
| `png/NN-mouth--вариант.png`, `png/NN-eyes--вариант.png` | варианты switch-слоя: у них общий номер `NN`, показывать нужно один |
| `svg/…` | те же слои в векторе |
| `preview.png` | персонаж целиком из тех же слоёв, с вариантами по умолчанию, как в Moho на кадре 0 |
| `bones.png` | то же с костями: синяя линия — кость, красный кружок — её сустав (точка поворота) |
| `variants.png` | все рты и глаза, каждый на лице на своём месте; красная рамка — вариант по умолчанию |
| `rig.json` | кости, привязка слоёв, порядок, рамки — всё в пикселях холста |

Названия слоёв взяты из Moho: `hand left 1/2/3` — плечо, предплечье, кисть;
`leg left 1/2/3` — бедро, голень, стопа. `left`/`right` — как назвали в Moho.

<img src="rigs/lord-verity-big/bones.png" height="420"> <img src="rigs/lord-verity-big/variants.png" height="210">

## rig.json — для анимации

- `bones[]`: `base` — сустав (начало кости), `tip` — конец, `angle_deg` — угол на экране
  (0° = вправо, по часовой), `parent` — родительская кость, `drives` — какие слои она
  ведёт.
- `layers[]` и `switches[].children[]`: `png`, `order`, `bbox` (где на холсте нарисована
  часть) и привязка:
  - `bone` + `pivot` — кость слоя и её сустав. Поворачивать PNG нужно вокруг `pivot`,
    а дочерние кости и слои двигать вместе с родительской костью;
  - `binding: "rigid"` — слой целиком следует за одной костью, как в Moho;
  - `binding: "points"` — точки слоя в Moho привязаны к двум костям (`point_bones`).
    Например, у девочек `hand left 2` — предплечье с кистью, у лорда `leg left 3` —
    ботинок. Одним PNG такой слой может только повернуться за главной костью `bone`,
    сгиб внутри него не получится;
  - `binding: "flexible"` — слой гнётся по нескольким костям (`flexible_bones`, туловище
    девочек и лорда). В PNG он следует за корневой из них;
  - `binding: "none"` — слой не привязан ни к одной существующей кости.
- `switches[]`: `default` — вариант на кадре 0. `smart_bone` и `smart_bone_frames`
  показывают, какая умная кость (`mouth`, `eye`) переключает варианты в Moho и на каком
  кадре её действия стоит каждый вариант.
- `moho_frame.offset` переводит пиксели холста в пиксели кадра Moho 2000×2000:
  `кадр = холст + offset`.

**Замечание по ригу.** В `girl verity small` switch-слой `mouth` привязан к кости с номером 8
(счёт с нуля), а в файле всего 5 костей: похоже, слой скопирован из большой версии. Поэтому в
`rig.json` у её ртов стоит `binding: "none"`. Если в Moho рот не едет вместе с
головой, причина в этом: его нужно заново привязать к кости.

## Как пересобрать

```bash
python3 tools/moho_export.py                       # SVG + rig.json для всех файлов из moho/
python3 tools/moho_export.py "moho/fat verity small.moho"   # или только один
node tools/render_rigs.js                          # PNG (нужен Playwright, см. выше)
```

`tools/moho_export.py` читает `.moho` (zip с JSON Moho) без сторонних библиотек.
Кривые строятся так же, как в Moho: из кривизны, веса и поворота ручек каждой точки.
Формулы сверены с [описанием формата](https://github.com/vinhio/moho2svg), восстановленным
по экспорту самого Moho. Результат проверен наложением на превью, которое Moho сохраняет
внутри `.moho`.
