"""Инструменты для фонов в стиле рисованных Minecraft-анимаций (канал Kopee).

Что взято из фонов референса:
- небо — чистый вертикальный градиент, облака — плоские белые блоки;
- всё блочное: деревья с квадратной кроной, ступенчатые холмы и берега;
- плоская заливка с мягкими градиентами, тонкая тёмная слегка неровная обводка у ближних и
  средних объектов (фильтр «ink»), пиксельная текстура — только как акцент (листва, вода);
- дальний план размыт (глубина резкости), по краям кадра — виньетка.

Холст 1080×1920 (9:16). Фон собирается из слоёв far / mid / near / fx — их можно двигать
по отдельности для параллакса.
"""
import random

W, H = 1080, 1920

# ------------------------------------------------------------------ палитры времени суток
TIMES = {
    'night': dict(
        sky=[(0, '#0a1030'), (0.5, '#16245a'), (1, '#2f4b8c')],
        hill_far='#22346e', hill_mid='#1b3550', tree_far='#183044',
        grass='#2e6650', grass_dark='#22503f', grass_light='#3c7a60', grass_far='#2c5868',
        dirt='#45384a', dirt_dark='#2f2636',
        trunk='#4a3a46', trunk_dark='#2e2430', trunk_light='#6f6a9a',
        leaves='#1d4a3d', leaves_dark='#12342b', leaves_light='#2f6a58',
        water='#173064', water_light='#2b5596', water_dark='#0e2048', water_far='#2a4a8a',
        sand='#6d6c80', gravel='#555a70', cloud='#2a3a74', cloud_light='#35498a',
        red='#7e2a46', yellow='#9c9450', cane='#3f7a5c', cane_dark='#2c5a45',
        ink='#080b1c', vignette=('#02040f', 0.62), rim='#9fb6ff'),
    'dawn': dict(
        sky=[(0, '#2a3474'), (0.45, '#8a6aa8'), (0.8, '#f09aa6'), (1, '#ffc49a')],
        hill_far='#7c6aa0', hill_mid='#5a5a7e', tree_far='#4e5070',
        grass='#5a9a58', grass_dark='#467e48', grass_light='#72b066', grass_far='#8a96a0',
        dirt='#7a5048', dirt_dark='#5a3a3a',
        trunk='#6a4a3e', trunk_dark='#4a3230', trunk_light='#b08070',
        leaves='#3a7046', leaves_dark='#2a5436', leaves_light='#5a8c58',
        water='#4a5a9a', water_light='#c890a8', water_dark='#33447a', water_far='#e0a0b0',
        sand='#c8a890', gravel='#8a8090', cloud='#f6b8c0', cloud_light='#ffd6d0',
        red='#c83a4a', yellow='#e8c050', cane='#6aa860', cane_dark='#4a8048',
        ink='#24152a', vignette=('#1a0a2a', 0.38), rim='#ffc0a0'),
    'sunrise': dict(
        sky=[(0, '#3a5aa8'), (0.45, '#f08a7a'), (0.8, '#ffb46a'), (1, '#ffe2a0')],
        hill_far='#c08a8a', hill_mid='#7a7a6e', tree_far='#6a6a5a',
        grass='#7ab84a', grass_dark='#5e9a3a', grass_light='#9ccc5a', grass_far='#b8b88a',
        dirt='#8e5a34', dirt_dark='#6a4024',
        trunk='#7a5434', trunk_dark='#523620', trunk_light='#d89a60',
        leaves='#4a8a2e', leaves_dark='#346a22', leaves_light='#7aae40',
        water='#4a7ac8', water_light='#ffb070', water_dark='#3058a0', water_far='#ffc890',
        sand='#e8c890', gravel='#a09080', cloud='#ffd0a8', cloud_light='#fff0d8',
        red='#e0322f', yellow='#f6d335', cane='#7ac05a', cane_dark='#589a40',
        ink='#2a1810', vignette=('#3a1408', 0.28), rim='#ffd08a'),
    'morning': dict(
        sky=[(0, '#4e9ce8'), (0.6, '#8ccaf6'), (1, '#d8f2ff')],
        hill_far='#9cc0e0', hill_mid='#7ab07a', tree_far='#5e9a5e',
        grass='#6cc04a', grass_dark='#56a43a', grass_light='#8ad65e', grass_far='#a8d890',
        dirt='#8b5a2f', dirt_dark='#6b4423',
        trunk='#6e4f2e', trunk_dark='#4e3820', trunk_light='#9a7448',
        leaves='#3e8f2c', leaves_dark='#2d6e1f', leaves_light='#5cae3e',
        water='#3a78d8', water_light='#78b4f6', water_dark='#2858b0', water_far='#9cd0ff',
        sand='#e3d49a', gravel='#9a9a9a', cloud='#ffffff', cloud_light='#ffffff',
        red='#e0322f', yellow='#f2d335', cane='#7cc45a', cane_dark='#5a9e3e',
        ink='#1c1b1f', vignette=('#10202a', 0.22), rim='#ffffff'),
}


# ------------------------------------------------------------------ примитивы
def f(v):
    s = f'{v:.1f}'.rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


def R(x, y, w, h, fill, extra=''):
    return f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" fill="{fill}"{" " + extra if extra else ""}/>'


def P(pts, fill, extra=''):
    d = 'M' + ' L'.join(f'{f(x)} {f(y)}' for x, y in pts) + ' Z'
    return f'<path d="{d}" fill="{fill}"{" " + extra if extra else ""}/>'


def G(items, extra=''):
    return f'<g{" " + extra if extra else ""}>' + ''.join(items) + '</g>'


def defs(pal, uid):
    """Градиенты и фильтры одного фона. uid — префикс id, чтобы фоны не путались."""
    sky = ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in pal['sky'])
    vc, vo = pal['vignette']
    ink = pal['ink']
    return f'''
<linearGradient id="{uid}-sky" x1="0" y1="0" x2="0" y2="1">{sky}</linearGradient>
<radialGradient id="{uid}-vig" cx="0.5" cy="0.46" r="0.78">
  <stop offset="0.55" stop-color="{vc}" stop-opacity="0"/>
  <stop offset="1" stop-color="{vc}" stop-opacity="{vo}"/>
</radialGradient>
<filter id="{uid}-ink" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
  <feMorphology in="SourceAlpha" operator="dilate" radius="3.3" result="d"/>
  <feFlood flood-color="{ink}" result="c"/>
  <feComposite in="c" in2="d" operator="in" result="o"/>
  <feMerge result="m"><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge>
  <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="5" result="t"/>
  <feDisplacementMap in="m" in2="t" scale="4" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="{uid}-ink-soft" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
  <feMorphology in="SourceAlpha" operator="dilate" radius="1.6" result="d"/>
  <feFlood flood-color="{ink}" flood-opacity="0.55" result="c"/>
  <feComposite in="c" in2="d" operator="in" result="o"/>
  <feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
<filter id="{uid}-blur-far" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="4.5"/></filter>
<filter id="{uid}-blur-mid" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.8"/></filter>
<filter id="{uid}-blur-dof" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="11"/></filter>
<filter id="{uid}-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="28"/></filter>
<filter id="{uid}-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>
<filter id="{uid}-blur-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
'''


def ink(uid, items, soft=False):
    return G(items, f'filter="url(#{uid}-ink{"-soft" if soft else ""})"')


def blur(uid, items, kind='far'):
    return G(items, f'filter="url(#{uid}-blur-{kind})"')


def sky(uid, y1=H):
    return R(0, 0, W, y1, f'url(#{uid}-sky)')


def vignette(uid):
    return R(0, 0, W, H, f'url(#{uid}-vig)')


# ------------------------------------------------------------------ текстуры
def pixels(x, y, w, h, size, colors, density, seed, opacity=1.0):
    """Пиксельная текстура: квадраты size×size случайного цвета из colors."""
    rnd = random.Random(seed)
    out = []
    cols, rows = max(1, int(w // size)), max(1, int(h // size))
    op = f' opacity="{opacity}"' if opacity < 1 else ''
    for r in range(rows):
        for c in range(cols):
            if rnd.random() < density:
                out.append(R(x + c * size, y + r * size, size, size, rnd.choice(colors), op.strip()))
    return out


def stars(seed, y_max, count=70):
    rnd = random.Random(seed)
    out = []
    for _ in range(count):
        x, y = rnd.uniform(20, W - 20), rnd.uniform(20, y_max)
        s = rnd.choice((3, 4, 4, 6, 6, 8))
        op = rnd.uniform(0.45, 1.0)
        out.append(R(x, y, s, s, '#eaf0ff', f'opacity="{op:.2f}"'))
        if s >= 8:   # «крестик»-мерцание у крупных звёзд
            out.append(R(x - s, y + s / 2 - 1.5, s * 3, 3, '#eaf0ff', f'opacity="{op * 0.6:.2f}"'))
            out.append(R(x + s / 2 - 1.5, y - s, 3, s * 3, '#eaf0ff', f'opacity="{op * 0.6:.2f}"'))
    return out


def moon(uid, cx, cy, s=130):
    """Квадратная луна Minecraft с кратерами и свечением."""
    p = s / 8
    craters = [(1, 1, 2, 1), (4, 2, 2, 2), (2, 5, 1, 1), (5, 5, 2, 1), (1, 3, 1, 1)]
    out = [f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(s * 1.05)}" fill="#9fb6ff" opacity="0.45" '
           f'filter="url(#{uid}-glow)"/>',
           R(cx - s / 2, cy - s / 2, s, s, '#e9eefc')]
    for c, r, w, h in craters:
        out.append(R(cx - s / 2 + c * p, cy - s / 2 + r * p, w * p, h * p, '#c2cbe6'))
    out.append(R(cx - s / 2, cy - s / 2, s, s, 'none', 'stroke="#c2cbe6" stroke-width="3"'))
    return out


def sun(uid, cx, cy, s=170, glow='#ffd27a'):
    """Квадратное солнце Minecraft: светлое ядро, жёлтая рамка, мягкое свечение."""
    out = [f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(s * 1.5)}" fill="{glow}" opacity="0.55" '
           f'filter="url(#{uid}-glow)"/>',
           R(cx - s / 2, cy - s / 2, s, s, '#ffe86a'),
           R(cx - s * 0.36, cy - s * 0.36, s * 0.72, s * 0.72, '#fff6b8'),
           R(cx - s * 0.22, cy - s * 0.22, s * 0.44, s * 0.44, '#ffffff')]
    return out


def cloud(x, y, blocks, s, color, light):
    """Плоское блочное облако: blocks — список (col, row, w) в блоках размера s."""
    out = []
    for c, r, w in blocks:
        out.append(R(x + c * s, y + r * s * 0.5, w * s, s * 0.5, color))
    for c, r, w in blocks:
        if r == 0:
            out.append(R(x + c * s, y, w * s, s * 0.12, light))
    return out


CLOUD_A = [(0, 0, 3), (1, 1, 4), (-1, 1, 2)]
CLOUD_B = [(0, 0, 2), (-1, 1, 5), (3, 1, 2)]
CLOUD_C = [(0, 0, 4), (1, 1, 2)]


def ridge(x0, x1, y_base, step, amp, seed, y_min=None):
    """Ступенчатый силуэт холмов: точки ломаной от x0 до x1 с горизонтальными ступенями."""
    rnd = random.Random(seed)
    pts = [(x0, H), (x0, y_base)]
    y = y_base - rnd.uniform(0, amp)
    x = x0
    while x < x1:
        w = step * rnd.choice((1, 1, 2, 2, 3))
        pts += [(x, y), (min(x + w, x1), y)]
        x += w
        y = min(y_base, max(y_base - amp if y_min is None else y_min, y + rnd.choice((-1, -1, 0, 1, 1)) * step * 0.5))
    pts += [(x1, y), (x1, H)]
    return pts


def far_tree(x, base, s, color):
    """Маленький далёкий дуб: силуэт без деталей."""
    return [R(x - s * 0.15, base - s * 1.1, s * 0.3, s * 1.1, color),
            R(x - s * 0.75, base - s * 1.9, s * 1.5, s * 0.6, color),
            R(x - s * 0.5, base - s * 2.3, s * 1.0, s * 0.45, color)]


# ------------------------------------------------------------------ дуб
def oak(pal, cx, base, s, seed, rows=((-1, 1), (-1, 1), (-2, 2), (-2, 2)), trunk_h=5.0,
        leaf_px=8, rim_left=False):
    """Дуб Minecraft. cx — центр ствола, base — y земли, s — размер блока в px.
    rows — ряды кроны сверху вниз: (левый, правый) блок относительно ствола.
    Возвращает (ствол, крона) — отдельные группы для обводки."""
    rnd = random.Random(seed)
    trunk_top = base - trunk_h * s
    # ствол с корой: вертикальные полосы
    t = [R(cx - s / 2, trunk_top, s, trunk_h * s + 2, pal['trunk'])]
    p = s / 8
    for i in range(8):
        if rnd.random() < 0.55:
            y0 = trunk_top + rnd.uniform(0, trunk_h * s * 0.7)
            t.append(R(cx - s / 2 + i * p, y0, p, rnd.uniform(s * 0.6, s * 2.2), pal['trunk_dark']))
    t.append(R(cx + s / 2 - p * 2, trunk_top, p * 2, trunk_h * s + 2, pal['trunk_dark'], 'opacity="0.55"'))
    if rim_left:
        t.append(R(cx - s / 2, trunk_top, p * 1.2, trunk_h * s + 2, pal['trunk_light'], 'opacity="0.7"'))
    # крона из блоков
    canopy_bottom = trunk_top + s * 0.6
    crown = []
    top = canopy_bottom - len(rows) * s
    cells = set()
    for r, (a, b) in enumerate(rows):
        for c in range(a, b + 1):
            # углы кроны иногда пропускаем — как в игре
            if (c in (a, b)) and r in (0, len(rows) - 1) and rnd.random() < 0.35:
                continue
            cells.add((r, c))
    for r, c in sorted(cells):
        x, y = cx - s / 2 + c * s, top + r * s
        crown.append(R(x, y, s + 0.5, s + 0.5, pal['leaves']))
        crown += pixels(x, y, s, s, s / leaf_px, (pal['leaves_dark'],), 0.10, rnd.randrange(10 ** 6),
                        opacity=0.55)
        crown += pixels(x, y, s, s * 0.6, s / leaf_px, (pal['leaves_light'],), 0.12, rnd.randrange(10 ** 6),
                        opacity=0.7)
    # подсветка открытых сверху блоков и тень у открытых снизу
    for r, c in sorted(cells):
        x, y = cx - s / 2 + c * s, top + r * s
        if (r - 1, c) not in cells:
            crown.append(R(x, y, s + 0.5, s * 0.12, pal['leaves_light'], 'opacity="0.5"'))
        if (r + 1, c) not in cells:
            crown.append(R(x, y + s * 0.6, s + 0.5, s * 0.4, pal['leaves_dark'], 'opacity="0.5"'))
    return t, crown


# ------------------------------------------------------------------ мелочи на траве
def tuft(x, y, k, pal, seed):
    """Пучок высокой травы, k — масштаб (1 пиксель = k px)."""
    rnd = random.Random(seed)
    out = []
    for i in range(5):
        h = rnd.choice((3, 4, 5, 6))
        col = pal['grass_light'] if i % 2 else pal['grass_dark']
        out.append(R(x + i * k, y - h * k, k, h * k, col))
    return out


def poppy(x, y, k, pal):
    return [R(x + k, y - 4 * k, k, 4 * k, pal['grass_dark']),
            R(x, y - 6 * k, 3 * k, 2 * k, pal['red']),
            R(x + k, y - 7 * k, k, k, pal['red']),
            R(x + k, y - 5.5 * k, k, k, '#2a1a1a')]


def dandelion(x, y, k, pal):
    return [R(x + k, y - 4 * k, k, 4 * k, pal['grass_dark']),
            R(x, y - 6 * k, 3 * k, 2 * k, pal['yellow']),
            R(x + k, y - 7 * k, k, k, pal['yellow'])]


def meadow_details(pal, y0, y1, seed, count, avoid=()):
    """Трава и цветы по лугу с перспективой: ближе к низу — крупнее."""
    rnd = random.Random(seed)
    out = []
    for _ in range(count):
        y = rnd.uniform(y0, y1)
        x = rnd.uniform(-10, W - 10)
        if any(ax0 <= x <= ax1 and ay0 <= y <= ay1 for ax0, ay0, ax1, ay1 in avoid):
            continue
        k = 2 + (y - y0) / (y1 - y0) * 7
        kind = rnd.random()
        if kind < 0.6:
            out += tuft(x, y, k, pal, rnd.randrange(10 ** 6))
        elif kind < 0.8:
            out += poppy(x, y, k, pal)
        else:
            out += dandelion(x, y, k, pal)
    return out


def ground_texture(pal, y0, y1, seed, count=80):
    """Редкие пятна чуть другого тона на траве, крупнее ближе к камере."""
    rnd = random.Random(seed)
    out = []
    for _ in range(count):
        y = rnd.uniform(y0, y1)
        k = 6 + (y - y0) / (y1 - y0) * 26
        x = rnd.uniform(0, W)
        out.append(R(x, y, k * rnd.choice((1, 2, 3)), k * 0.5, rnd.choice((pal['grass_dark'], pal['grass_light'])),
                     'opacity="0.4"'))
    return out


def water_texture(pal, x, y, w, h, seed, near_k=36, far_k=8):
    """Рябь на воде: светлые полоски-«пиксели», ближе к камере крупнее."""
    rnd = random.Random(seed)
    out = []
    for _ in range(int(w * h / 5200)):
        yy = rnd.uniform(y, y + h)
        k = far_k + (yy - y) / max(1, h) * (near_k - far_k)
        xx = rnd.uniform(x, x + w)
        out.append(R(xx, yy, k * rnd.choice((1, 2, 3)), k * 0.32,
                     rnd.choice((pal['water_light'], pal['water_dark'])), 'opacity="0.7"'))
    return out


def sugar_cane(x, base, k, pal, height=3):
    """Сахарный тростник: height блоков по 16 пикселей размера k."""
    out = []
    for b in range(height):
        y = base - (b + 1) * 16 * k
        for i, dx in enumerate((1, 6, 11)):
            col = pal['cane'] if i != 1 else pal['cane_dark']
            out.append(R(x + dx * k, y + (i % 2) * 3 * k, 3 * k, 16 * k - (i % 2) * 3 * k, col))
            out.append(R(x + dx * k, y + 7 * k, 3 * k, k, pal['cane_dark']))
        out.append(R(x + 3 * k, y + 2 * k, 2 * k, k, pal['cane']))
    return out


def lily(x, y, w, pal):
    """Кувшинка в перспективе — приплюснутый блочный лист."""
    h = w * 0.32
    return [R(x, y + h * 0.25, w, h * 0.5, '#2f7a2a'), R(x + w * 0.15, y, w * 0.6, h, '#2f7a2a'),
            R(x + w * 0.45, y + h * 0.2, w * 0.12, h * 0.6, '#1f5a1c')]


def house(pal, x, base, s, night=False, uid=''):
    """Маленький деревянный домик (далеко): стены из досок, тёмная крыша, дверь, окно.
    Ночью окно светится."""
    plank = '#a8834e' if not night else '#4a4256'
    plank_dark = '#7d5f36' if not night else '#352f42'
    roof = '#5a3d24' if not night else '#2a2232'
    w, h = s * 4, s * 2.6
    out = [R(x, base - h, w, h, plank)]
    for i in range(1, 4):
        out.append(R(x, base - h + i * h / 4, w, 2, plank_dark))
    out += [R(x - s * 0.3, base - h - s * 0.5, w + s * 0.6, s * 0.5, roof),
            R(x + s * 0.2, base - h - s * 1.0, w - s * 0.4, s * 0.5, roof),
            R(x + s * 0.8, base - h - s * 1.45, w - s * 1.6, s * 0.45, roof),
            R(x + s * 0.4, base - s * 1.6, s * 0.8, s * 1.6, plank_dark)]
    win = '#ffd772' if night else '#8fc6e8'
    if night:
        out.append(f'<rect x="{f(x + s * 2.2 - s * 0.6)}" y="{f(base - h + s * 0.5 - s * 0.6)}" '
                   f'width="{f(s * 2.1)}" height="{f(s * 2.0)}" fill="#ffb84a" opacity="0.55" '
                   f'filter="url(#{uid}-soft)"/>')
    out += [R(x + s * 2.2, base - h + s * 0.5, s * 0.9, s * 0.8, win),
            R(x + s * 2.62, base - h + s * 0.5, s * 0.08, s * 0.8, plank_dark),
            R(x + s * 2.2, base - h + s * 0.86, s * 0.9, s * 0.08, plank_dark)]
    return out


def stone_block(pal, x, y, s, night=False):
    """Блок камня с гранью сверху (вид чуть сверху)."""
    top = '#a9a9a9' if not night else '#5a6078'
    side = '#8a8a8a' if not night else '#454a62'
    dark = '#6e6e6e' if not night else '#363a50'
    out = [R(x, y, s, s * 0.35, top), R(x, y + s * 0.35, s, s * 0.8, side)]
    out += pixels(x, y + s * 0.35, s, s * 0.8, s / 6, (dark, top), 0.22, int(x * 7 + y))
    return out


def bush(pal, x, y, s, seed):
    """Куст — один-два блока листвы на земле."""
    rnd = random.Random(seed)
    out = [R(x, y - s, s * 1.6, s, pal['leaves']), R(x + s * 0.3, y - s * 1.45, s, s * 0.5, pal['leaves'])]
    out += pixels(x, y - s, s * 1.6, s, s / 6, (pal['leaves_light'],), 0.14, rnd.randrange(10 ** 6), 0.7)
    out.append(R(x, y - s * 0.35, s * 1.6, s * 0.35, pal['leaves_dark'], 'opacity="0.5"'))
    return out


def mountain(x0, x1, base, step, height, seed, color):
    """Блочная гора: ступенчатая пирамида со случайными уступами."""
    rnd = random.Random(seed)
    pts = [(x0, base)]
    cols = int((x1 - x0) / step)
    mid = cols / 2
    y = base
    for c in range(cols + 1):
        target = base - height * (1 - abs(c - mid) / mid) ** 0.9
        y = round((target + rnd.uniform(-step * 0.6, step * 0.6)) / (step * 0.5)) * step * 0.5
        y = min(base, y)
        pts += [(x0 + c * step, y), (x0 + (c + 1) * step, y)]
    pts += [(x1 + step, base)]
    return [P(pts, color)]
