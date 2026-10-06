"""Фоны к сценарию №1 «Рано радовался». Каждая функция возвращает слои фона:
{'defs': ..., 'far': [...], 'mid': [...], 'near': [...], 'fx': [...]}.
Холст 1080×1920. Координаты — px.
"""
import random

import bgkit as K
from bgkit import H, W, R, P

HORIZON = 980


def ground_gradient(uid, pal, y0=HORIZON):
    return (f'<linearGradient id="{uid}-ground" x1="0" y1="{y0}" x2="0" y2="{H}" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="{pal["grass_far"]}"/>'
            f'<stop offset="0.18" stop-color="{pal["grass"]}"/>'
            f'<stop offset="1" stop-color="{pal["grass_dark"]}"/></linearGradient>')


def water_gradient(uid, pal, y0, y1, name='water'):
    return (f'<linearGradient id="{uid}-{name}" x1="0" y1="{y0}" x2="0" y2="{y1}" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="{pal["water_far"]}"/>'
            f'<stop offset="0.35" stop-color="{pal["water"]}"/>'
            f'<stop offset="1" stop-color="{pal["water_dark"]}"/></linearGradient>')


def sky_layer(uid, pal, time, horizon, moon_at=None, sun_at=None, clouds=(), seed=1):
    out = [K.sky(uid, horizon + 40)]
    if time == 'night':
        out += K.stars(seed, horizon - 120)
    for cx, cy, blocks, s in clouds:
        out += K.cloud(cx, cy, blocks, s, pal['cloud'], pal['cloud_light'])
    if moon_at:
        out += K.moon(uid, *moon_at)
    if sun_at:
        out += K.sun(uid, *sun_at)
    return out


def hills(uid, pal, horizon, seed, trees=True, mountain_at=None):
    far = []
    if mountain_at:
        x0, x1, height = mountain_at
        far += K.mountain(x0, x1, horizon + 5, 40, height, seed + 5, pal['hill_far'])
    far += [P(K.ridge(-40, W + 40, horizon + 5, 44, 110, seed), pal['hill_far'])]
    mid = [P(K.ridge(-40, W + 40, horizon + 10, 36, 46, seed + 1), pal['hill_mid'])]
    if trees:
        for x, s in ((70, 30), (190, 38), (330, 28), (470, 34), (610, 26), (930, 32), (1030, 36)):
            mid += K.far_tree(x, horizon + 4, s, pal['tree_far'])
    return [K.blur(uid, far, 'far'), K.blur(uid, mid, 'mid')]


def pond(uid, pal, rows, y_bottom, x_right=W + 20, seed=7, lilies=()):
    """Блочный пруд в перспективе. rows — ряды (y_верх, x_левый) сверху вниз;
    у каждого верхнего края видна земляная стенка (вода на блок ниже травы)."""
    pts = [(rows[0][1], rows[0][0]), (x_right, rows[0][0]), (x_right, y_bottom)]
    for i in range(len(rows) - 1, -1, -1):
        y_top, x_left = rows[i]
        y_next = rows[i + 1][0] if i + 1 < len(rows) else y_bottom
        pts += [(x_left, y_next), (x_left, y_top)]
    y0 = rows[0][0]
    water = [P(pts, f'url(#{uid}-water)')]
    water += K.water_texture(pal, rows[0][1], y0, x_right - rows[0][1], y_bottom - y0, seed)
    # земляные стенки у дальних краёв
    banks = []
    prev_left = x_right
    for y_top, x_left in rows:
        k = 14 + (y_top - y0) / max(1, y_bottom - y0) * 16
        x_end = prev_left if prev_left < x_right else x_right
        banks.append(R(x_left, y_top, x_end - x_left, k, pal['dirt']))
        banks.append(R(x_left, y_top + k * 0.6, x_end - x_left, k * 0.4, pal['dirt_dark']))
        banks.append(R(x_left, y_top - 4, x_end - x_left, 8, pal['grass']))
        prev_left = x_left
    for x, y, w in lilies:
        water += K.lily(x, y, w, pal)
    return water, banks


def finish(uid, pal, layers, extra_defs=''):
    layers['defs'] = K.defs(pal, uid) + extra_defs
    layers.setdefault('fx', []).append(K.vignette(uid))
    return layers


# ====================================================================== BG-01
def bg01(time):
    """Поляна у пруда — общий план сбоку. Большой дуб справа, пруд справа внизу,
    вдали холмы, гора и домик Стива (ночью в окне свет — он «забыл лечь спать»).
    Кадры 2, 8, 10."""
    pal = K.TIMES[time]
    night = time == 'night'
    uid = f'bg01-{time}'
    clouds = ([(110, 300, K.CLOUD_A, 78), (560, 150, K.CLOUD_B, 70), (330, 640, K.CLOUD_C, 54)]
              if not night else [(520, 560, K.CLOUD_C, 60)])
    far = sky_layer(uid, pal, time, HORIZON, moon_at=(210, 360) if night else None, clouds=clouds, seed=11)
    far += hills(uid, pal, HORIZON, 21, mountain_at=(380, 860, 300))
    far.append(K.blur(uid, K.house(pal, 120, HORIZON + 6, 30, night=night, uid=uid), 'mid'))

    mid = [R(0, HORIZON, W, H - HORIZON, f'url(#{uid}-ground)')]
    mid += K.ground_texture(pal, HORIZON + 10, H, 31)
    mid.append(K.ink(uid, K.bush(pal, 40, 1150, 70, 5) + K.bush(pal, 330, 1060, 44, 6)))
    water, banks = pond(uid, pal, [(1450, 640), (1520, 500), (1620, 440), (1740, 480), (1840, 580)], 1925,
                        lilies=[(720, 1560, 80), (930, 1660, 100), (600, 1770, 70), (1000, 1820, 90)])
    mid.append(K.ink(uid, water + banks, soft=True))
    mid.append(K.ink(uid, K.stone_block(pal, 470, 1430, 70, night) + K.stone_block(pal, 540, 1455, 52, night)))
    mid.append(K.ink(uid, K.sugar_cane(1000, 1454, 4.4, pal, 3) + K.sugar_cane(1046, 1458, 4.4, pal, 2)))
    mid += K.meadow_details(pal, HORIZON + 20, 1440, 41, 60,
                            avoid=[(430, 1400, W, H), (700, 1280, 1000, 1450), (0, 1080, 160, 1160)])
    trunk, crown = K.oak(pal, 880, 1432, 125, 51,
                         rows=((-1, 1), (-2, 2), (-3, 2), (-3, 3), (-2, 2)), trunk_h=5.4, rim_left=night)
    mid.append(K.ink(uid, trunk))
    mid.append(K.ink(uid, crown))
    mid += K.tuft(790, 1440, 6, pal, 3) + K.tuft(905, 1442, 6, pal, 4)

    near = K.meadow_details(pal, 1830, 1925, 61, 14, avoid=[(420, 1400, W, 1930)])
    layers = {'far': far, 'mid': mid, 'near': [K.ink(uid, near, soft=True)], 'fx': []}
    if night:
        layers['fx'].append(R(0, 0, W, H, '#1a2a6a', 'opacity="0.12"'))
    return finish(uid, pal, layers, ground_gradient(uid, pal) + water_gradient(uid, pal, 1450, 1925))


def grass_bank(pal, y, height, seed, step=80):
    """Берег у воды со стороны камеры: травяная кромка с «подтёками» и земляная стенка блоков,
    некоторые блоки на ступень выше."""
    rnd = random.Random(seed)
    out = []
    for i in range(-1, W // step + 2):
        x = i * step
        lift = step * 0.5 if rnd.random() < 0.25 else 0
        top = y - lift
        out.append(R(x, top, step + 1, height + lift, pal['dirt']))
        out += K.pixels(x, top + 12, step, height + lift - 12, step / 6, (pal['dirt_dark'],), 0.25,
                        rnd.randrange(10 ** 6), opacity=0.8)
        out.append(R(x, top, step + 1, 12, pal['grass']))
        for d in range(6):   # зелёные «подтёки» травы на боку блока, как у блока дёрна
            if rnd.random() < 0.6:
                out.append(R(x + d * step / 6, top + 12, step / 6, rnd.choice((4, 8, 12)), pal['grass_dark']))
        out.append(R(x + step - 2, top, 2, height + lift, pal['dirt_dark'], 'opacity="0.6"'))
    return out


def bg01_reverse(time='morning'):
    """Та же поляна с обратной стороны пруда: камера в воде за плечом Утопленника, смотрит
    на берег и дуб. Кадр 15."""
    pal = K.TIMES[time]
    uid = f'bg01r-{time}'
    horizon = 1060
    far = sky_layer(uid, pal, time, horizon,
                    clouds=[(140, 260, K.CLOUD_B, 74), (700, 420, K.CLOUD_A, 62), (420, 760, K.CLOUD_C, 46)])
    far += hills(uid, pal, horizon, 23, mountain_at=(-60, 380, 240))
    shore = 1250
    mid = [R(0, horizon, W, shore - horizon + 10, f'url(#{uid}-ground)')]
    mid += K.ground_texture(pal, horizon + 10, shore, 33, count=40)
    mid += K.meadow_details(pal, horizon + 20, shore - 20, 43, 36, avoid=[(560, 1120, 820, 1260)])
    mid.append(K.ink(uid, K.bush(pal, 880, 1180, 54, 8)))
    trunk, crown = K.oak(pal, 640, shore - 30, 92, 52,
                         rows=((-1, 1), (-2, 2), (-2, 3), (-3, 3), (-2, 2)), trunk_h=5.4)
    mid.append(K.ink(uid, trunk))
    mid.append(K.ink(uid, crown))
    bank = grass_bank(pal, shore - 20, 84, 71)
    bank += K.sugar_cane(40, shore - 20, 4.6, pal, 3) + K.sugar_cane(98, shore - 18, 4.6, pal, 2)
    mid.append(K.ink(uid, bank))
    wy = shore + 64
    water = [R(0, wy, W, H - wy, f'url(#{uid}-water)'),
             R(600, wy, 90, 380, pal['water_dark'], 'opacity="0.35"'),       # отражение ствола
             R(420, wy + 10, 460, 120, pal['leaves_dark'], 'opacity="0.18"')]  # отражение кроны
    water += K.water_texture(pal, 0, wy, W, H - wy, 73, near_k=70, far_k=12)
    water.append(R(0, wy, W, 10, pal['water_dark'], 'opacity="0.6"'))
    near = [K.G(water), K.ink(uid, K.lily(80, 1520, 150, pal) + K.lily(860, 1400, 110, pal), soft=True)]
    layers = {'far': far, 'mid': mid, 'near': near, 'fx': []}
    return finish(uid, pal, layers, ground_gradient(uid, pal, horizon) + water_gradient(uid, pal, wy, H))


# ---------------------------------------------------------------------- общие крупные детали
def bark(pal, x, y, w, h, px, seed, rim=False):
    """Кора ствола дуба крупным планом: вертикальные тёмные бороздки и светлые прожилки."""
    rnd = random.Random(seed)
    out = [R(x, y, w, h, pal['trunk'])]
    cols = int(w // px)
    for c in range(cols):
        yy = y
        while yy < y + h:
            seg = rnd.uniform(px * 2, px * 9)
            if rnd.random() < 0.45:
                out.append(R(x + c * px, yy, px, seg, pal['trunk_dark']))
            elif rnd.random() < 0.18:
                out.append(R(x + c * px, yy, px, seg * 0.6, pal['trunk_light'], 'opacity="0.35"'))
            yy += seg
    out.append(R(x + w - px * 2.5, y, px * 2.5, h, pal['trunk_dark'], 'opacity="0.45"'))
    if rim:
        out.append(R(x, y, px * 1.2, h, pal['rim'], 'opacity="0.35"'))
    return out


def leaf_ceiling(pal, x0, x1, base, s, seed):
    """Нижний край кроны над головой: блоки листвы со ступенчатым низом."""
    rnd = random.Random(seed)
    out = []
    x = x0
    while x < x1:
        drop = rnd.choice((-1, 0, 0, 1, 1, 2)) * s * 0.5
        out.append(R(x, -10, s + 0.5, base + drop + 10, pal['leaves']))
        out += K.pixels(x, 0, s, base + drop, s / 7, (pal['leaves_dark'],), 0.12, rnd.randrange(10 ** 6), 0.55)
        out += K.pixels(x, 0, s, base + drop, s / 7, (pal['leaves_light'],), 0.08, rnd.randrange(10 ** 6), 0.6)
        out.append(R(x, base + drop - s * 0.4, s + 0.5, s * 0.4, pal['leaves_dark'], 'opacity="0.5"'))
        x += s
    return out


def blades(pal, y_base, count, seed, h_min=120, h_max=320, w=22):
    """Крупные травинки на переднем плане (пиксельные столбики)."""
    rnd = random.Random(seed)
    out = []
    for _ in range(count):
        x = rnd.uniform(-20, W)
        hgt = rnd.uniform(h_min, h_max)
        col = rnd.choice((pal['grass'], pal['grass_dark'], pal['grass_light']))
        out.append(R(x, y_base - hgt, w, hgt + 40, col))
        out.append(R(x + w, y_base - hgt * 0.6, w, hgt * 0.6 + 40, col))
    return out


def rays(x, y, spread, length, count, color, opacity, seed):
    """Лучи света веером из точки (x, y) вниз."""
    rnd = random.Random(seed)
    out = []
    for i in range(count):
        a = -spread / 2 + spread * (i + rnd.uniform(0.2, 0.8)) / count
        w = rnd.uniform(30, 90)
        x2 = x + a * length
        out.append(P([(x - w * 0.2, y), (x + w * 0.2, y), (x2 + w, y + length), (x2 - w, y + length)], color,
                     f'opacity="{opacity * rnd.uniform(0.5, 1):.2f}"'))
    return out


# ====================================================================== BG-02
def bg02(time):
    """Ствол дуба крупным планом — фон для крупных планов Стива. Камера чуть снизу:
    сверху нависает крона, слева размытые поле и небо. Кадры 1, 4, 5, 9, 14, 16."""
    pal = K.TIMES[time]
    night = time == 'night'
    uid = f'bg02-{time}'
    horizon = 1240
    far = [K.sky(uid, horizon + 40)]
    if night:
        far += K.stars(12, horizon - 200, count=40)
    else:
        far += K.cloud(40, 560, K.CLOUD_A, 70, pal['cloud'], pal['cloud_light'])
    dist = [P(K.ridge(-40, W, horizon, 44, 90, 25), pal['hill_far']),
            P(K.ridge(-40, W, horizon + 10, 36, 40, 26), pal['hill_mid'])]
    for x, sz in ((60, 60), (250, 46)):
        dist += K.far_tree(x, horizon + 8, sz, pal['tree_far'])
    dist.append(R(0, horizon + 8, W, H - horizon, pal['grass']))
    if night:
        dist += K.house(pal, 150, horizon + 10, 34, night=True, uid=uid)
    far.append(K.blur(uid, dist, 'dof'))
    mid = [K.ink(uid, bark(pal, 400, -20, 560, H + 40, 32, 81, rim=night))]
    mid.append(K.ink(uid, leaf_ceiling(pal, -40, W + 40, 380, 135, 82)))
    near = [K.blur(uid, blades(pal, H + 10, 22, 83, 160, 420, 26), 'dof')]
    layers = {'far': far, 'mid': mid, 'near': near, 'fx': []}
    if night:
        layers['fx'].append(R(0, 0, W, H, '#1a2a6a', 'opacity="0.18"'))
    return finish(uid, pal, layers)


# ====================================================================== BG-03
def bg03(time):
    """Обратная точка: от дерева в поле, туда, откуда пришёл зомби. Тропинка уходит к
    домику на горизонте. Камера на уровне глаз. Кадры 3 (ночь), 7 (рассвет)."""
    pal = K.TIMES[time]
    night = time == 'night'
    uid = f'bg03-{time}'
    horizon = 960
    clouds = [(600, 330, K.CLOUD_B, 66), (80, 600, K.CLOUD_C, 50)]
    far = sky_layer(uid, pal, time, horizon, clouds=clouds, seed=13)
    if night:   # отсвет луны за краем кадра
        far.append(f'<circle cx="{W}" cy="120" r="520" fill="url(#{uid}-moonlight)"/>')
    else:   # отсвет рассвета у горизонта (солнце за спиной камеры)
        far.append(R(0, horizon - 260, W, 300, '#ffb0a0', f'opacity="0.35" filter="url(#{uid}-soft)"'))
    far += hills(uid, pal, horizon, 27, mountain_at=(620, 1140, 260))
    far.append(K.blur(uid, K.house(pal, 470, horizon + 8, 30, night=night, uid=uid), 'mid'))
    mid = [R(0, horizon, W, H - horizon, f'url(#{uid}-ground)')]
    mid += K.ground_texture(pal, horizon + 10, H, 35)
    trail = [(520, horizon + 6), (560, horizon + 6), (760, H), (330, H)]
    path = P(trail, pal['dirt'], 'opacity="0.85"')
    clip = P(trail, '#000')
    mid.append(f'<clipPath id="{uid}-trail">{clip}</clipPath>')
    mid.append(K.blur(uid, [path, K.G(K.pixels(330, horizon + 200, 430, H - horizon - 200, 26,
                                                   (pal['dirt_dark'],), 0.2, 36, 0.7),
                                          f'clip-path="url(#{uid}-trail)"')], 'mid'))
    mid.append(K.ink(uid, K.bush(pal, 60, 1130, 66, 9) + K.bush(pal, 900, 1080, 50, 10)))
    mid += K.meadow_details(pal, horizon + 20, H, 45, 80, avoid=[(330, horizon, 780, H)])
    near = [K.blur(uid, blades(pal, H + 10, 10, 84, 100, 260, 22), 'dof')]
    layers = {'far': far, 'mid': mid, 'near': near, 'fx': []}
    if night:
        layers['fx'].append(R(0, 0, W, H, '#1a2a6a', 'opacity="0.12"'))
    else:
        layers['fx'].append(R(0, 0, W, H, '#ff9a60', 'opacity="0.08"'))
    moonlight = (f'<radialGradient id="{uid}-moonlight"><stop offset="0" stop-color="#9fb6ff" stop-opacity="0.35"/>'
                 f'<stop offset="1" stop-color="#9fb6ff" stop-opacity="0"/></radialGradient>')
    return finish(uid, pal, layers, ground_gradient(uid, pal, horizon) + moonlight)


# ====================================================================== BG-04
def bg04(time):
    """Небо и горизонт с очень низкой точки, из травы. Восход: солнце (отдельный спрайт)
    выходит из-за холмов в центре. Кадр 6. Три состояния неба: night → dawn → sunrise."""
    pal = K.TIMES[time]
    uid = f'bg04-{time}'
    horizon = 1430
    far = [K.sky(uid, horizon + 40)]
    if time == 'night':
        far += K.stars(14, horizon - 250, count=90)
    else:
        far.append(f'<ellipse cx="540" cy="{horizon}" rx="560" ry="300" fill="{pal["sky"][-1][1]}" '
                   f'opacity="0.9" filter="url(#{uid}-glow)"/>')
        far.append(f'<ellipse cx="540" cy="{horizon}" rx="220" ry="150" fill="#fff4c8" '
                   f'opacity="{0.35 if time == "dawn" else 0.75}" filter="url(#{uid}-glow)"/>')
        for cx, cy, b, sz in ((80, 420, K.CLOUD_A, 90), (640, 760, K.CLOUD_B, 76), (240, 1060, K.CLOUD_C, 60)):
            far += K.cloud(cx, cy, b, sz, pal['cloud'], pal['cloud_light'])
    far.append(K.blur(uid, K.mountain(-80, 420, horizon + 10, 46, 330, 41, pal['hill_far']), 'mid'))
    far.append(K.blur(uid, [P(K.ridge(-40, W + 40, horizon + 10, 50, 120, 42), pal['hill_far'])], 'mid'))
    mid = [K.ink(uid, [P(K.ridge(-40, W + 40, horizon + 40, 60, 70, 43), pal['hill_mid'])]
                 + K.far_tree(860, horizon - 10, 70, pal['tree_far']) + K.far_tree(140, horizon + 10, 56, pal['tree_far']),
                 soft=True),
           R(0, horizon + 30, W, H - horizon, pal['grass_dark'])]
    near = [K.blur(uid, blades(pal, H + 10, 26, 85, 220, 520, 30), 'mid')]
    near += [K.blur(uid, K.poppy(120, 1760, 22, pal) + K.dandelion(860, 1800, 20, pal), 'mid')]
    layers = {'far': far, 'mid': mid, 'near': near, 'fx': []}
    if time == 'night':
        layers['fx'].append(R(0, 0, W, H, '#1a2a6a', 'opacity="0.12"'))
    return finish(uid, pal, layers)


# ====================================================================== BG-05
def bg05(time='morning'):
    """Берег пруда, средний план сбоку в 3/4: Стив стоит на краю (слева), вода справа и снизу,
    на дне блестит трезубец (слой props). Кадр 11."""
    pal = K.TIMES[time]
    uid = f'bg05-{time}'
    horizon = 760
    far = sky_layer(uid, pal, time, horizon, clouds=[(520, 220, K.CLOUD_A, 70), (60, 440, K.CLOUD_C, 54)])
    far += hills(uid, pal, horizon, 29, mountain_at=(500, 1000, 220))
    # дальний берег за прудом
    far_bank = [R(0, horizon, W, 260, f'url(#{uid}-ground)')]
    far_bank += K.meadow_details(pal, horizon + 10, horizon + 240, 47, 30)
    far.append(K.blur(uid, far_bank, 'mid'))
    mid = []
    wy = 1010
    water = [R(0, wy, W, H - wy, f'url(#{uid}-water)')]
    # дно у берега просвечивает: песок и гравий
    water.append(P([(380, wy), (W, wy), (W, 1240), (700, 1500), (480, H), (380, H)], pal['sand'],
                   f'opacity="0.2" filter="url(#{uid}-blur-soft)"'))
    water += K.water_texture(pal, 0, wy, W, H - wy, 75, near_k=46, far_k=10)
    water.append(R(0, wy, W, 14, pal['water_light'], 'opacity="0.6"'))
    mid.append(K.G(water))
    mid.append(K.ink(uid, K.sugar_cane(820, wy + 4, 4.0, pal, 3) + K.sugar_cane(872, wy + 6, 4.0, pal, 2)
                     + K.bush(pal, 980, wy + 6, 50, 11), soft=True))
    mid.append(K.ink(uid, K.lily(560, 1150, 120, pal) + K.lily(860, 1330, 150, pal) + K.lily(640, 1620, 170, pal),
                     soft=True))
    # ближний берег: блоки дёрна ступенями, вид сбоку в 3/4
    bank = []
    steps = [(0, 1250, 420), (0, 1430, 470), (0, 1640, 400), (0, 1830, 330)]
    for x0, y, x1 in steps:
        bank.append(R(x0, y, x1 - x0, H - y, pal['grass']))
        bank += K.ground_texture(pal, y, y + 160, int(y), count=10)
        bank.append(R(x1 - 2, y, 80, H - y, pal['dirt']))
        bank += K.pixels(x1, y + 14, 76, H - y - 14, 13, (pal['dirt_dark'],), 0.25, int(y) + 1, 0.8)
        for d in range(6):
            bank.append(R(x1 + d * 13, y, 13, 14 + (d % 3) * 6, pal['grass_dark']))
        bank.append(R(x1 - 2, y, 80, 10, pal['grass']))
    bank += K.tuft(60, 1250, 7, pal, 21) + K.poppy(250, 1252, 7, pal)
    mid.append(K.ink(uid, bank))
    props = [f'<g id="glint">'
             f'<rect x="700" y="1440" width="60" height="60" fill="#bff8ff" opacity="0.6" filter="url(#{uid}-soft)"/>'
             + R(726, 1416, 8, 108, '#e8ffff', 'opacity="0.9"') + R(676, 1466, 108, 8, '#e8ffff', 'opacity="0.9"')
             + R(718, 1458, 24, 24, '#ffffff') + '</g>']
    layers = {'far': far, 'mid': mid, 'props': props, 'near': [], 'fx': []}
    return finish(uid, pal, layers, ground_gradient(uid, pal, horizon) + water_gradient(uid, pal, wy, H))


# ====================================================================== BG-06
UW = dict(top='#7fe0e8', mid='#1d6a7a', deep='#0b3240', floor='#c9b98a', floor_dark='#a8966a',
          gravel='#7d7f84', gravel_dark='#5e6066', grass='#2f8a54', grass_dark='#1f6a3e', kelp='#3a8a3a')


def trident(x, y, length, angle):
    """Трезубец Minecraft (бирюзово-серый). (x, y) — середина древка, angle — градусы."""
    k = length / 30
    parts = [R(-15 * k, -k, 22 * k, 2 * k, '#5f9a92'),            # древко
             R(-15 * k, -k, 22 * k, k * 0.7, '#9fd6cc'),
             R(7 * k, -2.5 * k, 2 * k, 5 * k, '#4f7f78'),          # поперечина
             R(9 * k, -k, 6 * k, 2 * k, '#8fd0c6'),                # средний зубец
             R(9 * k, -3 * k, 4 * k, 1.4 * k, '#8fd0c6'), R(9 * k, 1.6 * k, 4 * k, 1.4 * k, '#8fd0c6'),
             R(13 * k, -3.4 * k, 1.4 * k, 1.4 * k, '#cffff6'), R(13 * k, 2 * k, 1.4 * k, 1.4 * k, '#cffff6'),
             R(15 * k, -0.6 * k, 1.4 * k, 1.2 * k, '#cffff6')]
    return f'<g transform="translate({x} {y}) rotate({angle})">' + ''.join(parts) + '</g>'


def bg06():
    """Под водой, взгляд со дна вверх: светлая рябь поверхности, лучи, тёмная толща, дно из
    песка и гравия с морской травой. Трезубец на дне — отдельный слой props. Кадр 12."""
    uid = 'bg06-underwater'
    pal = dict(K.TIMES['morning'])
    pal['sky'] = [(0, UW['top']), (0.22, '#3aa0b0'), (0.55, UW['mid']), (1, UW['deep'])]
    pal['vignette'] = ('#021820', 0.7)
    pal['ink'] = '#06222a'
    rnd = random.Random(91)
    far = [K.sky(uid)]
    # поверхность снизу: светлые волнистые полосы и «окно» в небо
    surf = []
    for i in range(70):
        y = rnd.uniform(0, 300)
        surf.append(R(rnd.uniform(-40, W), y, rnd.uniform(40, 180), rnd.uniform(6, 14), '#d8fbff',
                      f'opacity="{rnd.uniform(0.25, 0.7):.2f}"'))
    surf.append(f'<ellipse cx="560" cy="40" rx="420" ry="190" fill="#e8ffff" opacity="0.55" filter="url(#{uid}-glow)"/>')
    # тёмный край берега наверху слева (там стоит Стив)
    surf.append(P([(-20, -20), (360, -20), (360, 70), (250, 70), (250, 130), (120, 130), (120, 190), (-20, 190)],
                  '#0f3a3a', 'opacity="0.85"'))
    far.append(K.blur(uid, surf, 'mid'))
    far.append(K.blur(uid, rays(560, -40, 1.4, 1500, 9, '#c8fbff', 0.16, 92), 'soft'))
    bubbles = []
    for i in range(36):
        sz = rnd.choice((6, 8, 10, 14))
        bubbles.append(R(rnd.uniform(40, W - 40), rnd.uniform(300, 1500), sz, sz, 'none',
                         f'stroke="#d8fbff" stroke-width="2.5" opacity="{rnd.uniform(0.3, 0.7):.2f}"'))
    mid = [K.G(bubbles)]
    # морская трава и ламинария
    weeds = []
    for x0, hgt, col in ((70, 900, UW['kelp']), (160, 640, UW['grass']), (930, 760, UW['kelp']),
                         (1010, 520, UW['grass_dark']), (820, 300, UW['grass'])):
        y = 1720
        seg = 0
        while y > 1720 - hgt:
            dx = 10 if (seg // 2) % 2 else -10
            weeds.append(R(x0 + dx, y - 60, 26, 62, col))
            if seg % 3 == 1:
                weeds.append(R(x0 + dx + (26 if dx > 0 else -22), y - 40, 22, 18, col))
            y -= 60
            seg += 1
    mid.append(K.ink(uid, weeds, soft=True))
    # дно: блоки песка и гравия, ступени
    floor = []
    x = -20
    for i, (w, top) in enumerate(((180, 1700), (160, 1740), (220, 1690), (140, 1760), (200, 1720), (200, 1680))):
        col, dark = (UW['floor'], UW['floor_dark']) if i % 3 else (UW['gravel'], UW['gravel_dark'])
        floor.append(R(x, top, w + 1, H - top, col))
        floor += K.pixels(x, top, w, H - top, 20, (dark,), 0.22, 93 + i, 0.8)
        floor.append(R(x, top, w + 1, 10, '#ffffff', 'opacity="0.18"'))
        x += w
    mid.append(K.ink(uid, floor, soft=True))
    mid.append(R(0, 1640, W, 280, UW['deep'], 'opacity="0.35"'))
    props = [f'<g id="trident">'
             f'<ellipse cx="700" cy="1690" rx="200" ry="40" fill="#bff8ff" opacity="0.35" filter="url(#{uid}-soft)"/>'
             + trident(700, 1688, 380, -8) + '</g>']
    layers = {'far': far, 'mid': mid, 'props': props, 'near': [], 'fx': []}
    return finish(uid, pal, layers)


# ====================================================================== BG-07
def bg07(time='sunrise'):
    """Пруд с уровня воды, сильно снизу. Низкое солнце за спиной Утопленника — контровой
    свет, дорожка бликов на воде. Кадр 13 и обложка."""
    pal = K.TIMES[time]
    uid = f'bg07-{time}'
    horizon = 1180
    far = sky_layer(uid, pal, time, horizon,
                    clouds=[(40, 380, K.CLOUD_A, 92), (620, 600, K.CLOUD_B, 80), (300, 900, K.CLOUD_C, 60)])
    far += K.sun(uid, 540, horizon - 170, 190, glow='#ffd27a' if time == 'sunrise' else '#fff2c0')
    far.append(K.blur(uid, rays(540, horizon - 170, 3.2, 1300, 12, '#fff2c8', 0.10, 94), 'soft'))
    far += hills(uid, pal, horizon, 31)
    shore = 1290
    mid = [K.blur(uid, [R(0, horizon, W, shore - horizon + 10, f'url(#{uid}-ground)')]
                  + K.meadow_details(pal, horizon + 10, shore - 10, 49, 24), 'mid')]
    bank = grass_bank(pal, shore - 14, 50, 77, step=64)
    bank += K.sugar_cane(820, shore - 14, 3.6, pal, 3) + K.sugar_cane(866, shore - 12, 3.6, pal, 2)
    bank += K.bush(pal, 90, shore - 14, 52, 12)
    mid.append(K.ink(uid, bank))
    wy = shore + 36
    water = [R(0, wy, W, H - wy, f'url(#{uid}-water)')]
    water += K.water_texture(pal, 0, wy, W, H - wy, 79, near_k=90, far_k=14)
    # дорожка бликов от солнца
    rnd = random.Random(95)
    for i in range(46):
        y = rnd.uniform(wy, H)
        k = 10 + (y - wy) / (H - wy) * 70
        x = 540 + rnd.uniform(-1, 1) * (40 + (y - wy) * 0.25)
        water.append(R(x - k, y, k * 2, k * 0.25, '#fff2c0', f'opacity="{rnd.uniform(0.5, 0.95):.2f}"'))
    near = [K.G(water)]
    layers = {'far': far, 'mid': mid, 'near': near, 'fx': []}
    layers['fx'].append(R(0, 0, W, H, '#ff9a50', 'opacity="0.06"'))
    return finish(uid, pal, layers, ground_gradient(uid, pal, horizon) + water_gradient(uid, pal, wy, H))


# ====================================================================== спрайты
def sprite_sun():
    uid = 'sprite-sun'
    return {'defs': K.defs(K.TIMES['sunrise'], uid), 'size': (520, 520),
            'body': ''.join(K.sun(uid, 260, 260, 190))}


def sprite_moon():
    uid = 'sprite-moon'
    return {'defs': K.defs(K.TIMES['night'], uid), 'size': (420, 420),
            'body': ''.join(K.moon(uid, 210, 210, 150))}


SCENES = {
    'bg01-meadow': [('night', lambda: bg01('night')), ('morning', lambda: bg01('morning')),
                    ('reverse-morning', lambda: bg01_reverse('morning'))],
    'bg02-trunk': [('night', lambda: bg02('night')), ('morning', lambda: bg02('morning'))],
    'bg03-field': [('night', lambda: bg03('night')), ('sunrise', lambda: bg03('sunrise'))],
    'bg04-sky': [('night', lambda: bg04('night')), ('dawn', lambda: bg04('dawn')), ('sunrise', lambda: bg04('sunrise'))],
    'bg05-bank': [('morning', lambda: bg05('morning'))],
    'bg06-underwater': [('underwater', bg06)],
    'bg07-water-level': [('sunrise', lambda: bg07('sunrise')), ('morning', lambda: bg07('morning'))],
}
SPRITES = {'sun': sprite_sun, 'moon': sprite_moon}
