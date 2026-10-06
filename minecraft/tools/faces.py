"""Детали лиц для наклеек на переднюю грань головы: глаза, брови, рты, слёзы.

Все координаты — в единицах грани (голова человека 10×10, u вправо, v вниз).
Толщина линий — в px экрана (линии не масштабируются вместе с гранью).
"""
from blocky import OUT, ell, line, path, poly, n

WHITE = '#ffffff'
MOUTH = '#6e2230'
TONGUE = '#e56a72'
TEETH = '#fffaf0'
TEAR = '#86d0f5'
SWEAT = '#bfe9ff'
BLUSH = '#f39a9a'
VEIN = '#e0413a'

BROW = 8          # толщина бровей, px
FEATURE = 5.5     # толщина рта и закрытых глаз, px


# ------------------------------------------------------------------ глаза
def eye(cx, cy, rx=1.05, ry=1.3, look=(0, 0), pupil=(0.5, 0.62), lid=0.0, lid_color='#000',
        lashes=0, white=WHITE, pupil_color=OUT, shine=True):
    """Открытый глаз. look — смещение зрачка; lid — доля глаза, закрытая веком сверху;
    lashes = -1/1 — ресницы у внешнего угла слева/справа."""
    out = [ell(cx, cy, rx, ry, white)]
    px, py = cx + look[0], cy + look[1]
    prx, pry = pupil
    out.append(ell(px, py, prx, pry, pupil_color, stroke=None))
    if shine:
        out.append(ell(px + prx * 0.38, py - pry * 0.42, prx * 0.36, prx * 0.36, WHITE, stroke=None))
    out.append(ell(cx, cy, rx, ry, 'none'))
    if lid > 0:
        ly = cy - ry + 2 * ry * lid
        k = max(0.0, 1 - ((ly - cy) / ry) ** 2) ** 0.5
        x1 = rx * k
        out.append(path(f'M{n(cx - x1)} {n(ly)} A{n(rx)} {n(ry)} 0 0 1 {n(cx + x1)} {n(ly)} Z',
                        lid_color, stroke=None))
        out.append(path(f'M{n(cx - x1 - 0.12)} {n(ly)} L{n(cx + x1 + 0.12)} {n(ly)}', sw=FEATURE))
        out.append(ell(cx, cy, rx, ry, 'none'))
    if lashes:
        s = lashes
        ox, oy = cx + s * rx * 0.78, cy - ry * 0.62
        out.append(line([(ox, oy), (ox + s * 0.55, oy - 0.42)], sw=FEATURE * 0.8))
        ox2, oy2 = cx + s * rx * 0.98, cy - ry * 0.18
        out.append(line([(ox2, oy2), (ox2 + s * 0.6, oy2 - 0.18)], sw=FEATURE * 0.8))
    return out


def eye_happy(cx, cy, w=0.95):
    """Глаз-дуга ∩ (улыбка глазами)."""
    return [path(f'M{n(cx - w)} {n(cy + 0.35)} Q{n(cx)} {n(cy - 1.0)} {n(cx + w)} {n(cy + 0.35)}',
                 sw=FEATURE * 1.2)]


def eye_squeeze(cx, cy, side, w=0.85):
    """Зажмуренный глаз > или < (смех, боль). side=-1 — левый от зрителя."""
    tip = cx - side * w * 0.8
    back = cx + side * w * 0.9
    return [line([(back, cy - 0.75), (tip, cy), (back, cy + 0.75)], sw=FEATURE * 1.2)]


def eye_closed_down(cx, cy, w=0.95):
    """Закрытый глаз ∪ (плач, умиление)."""
    return [path(f'M{n(cx - w)} {n(cy - 0.2)} Q{n(cx)} {n(cy + 0.75)} {n(cx + w)} {n(cy - 0.2)}',
                 sw=FEATURE * 1.2)]


# ------------------------------------------------------------------ брови
def brow(cx, cy, side, color, half=1.0, inner=0.0, outer=0.0, arch=-0.18, sw=BROW):
    """Бровь над глазом. side=-1 — глаз слева от зрителя (внутренний конец справа).
    inner/outer — сдвиг концов по вертикали (+ вниз)."""
    xo, xi = cx + side * half, cx - side * half
    yo, yi = cy + outer, cy + inner
    mx, my = (xo + xi) / 2, (yo + yi) / 2 + arch
    return [path(f'M{n(xo)} {n(yo)} Q{n(mx)} {n(my)} {n(xi)} {n(yi)}', stroke=color, sw=sw)]


# ------------------------------------------------------------------ рты
def mouth_smile(mx, my, w=1.1, depth=0.75):
    return [path(f'M{n(mx - w)} {n(my - 0.15)} Q{n(mx)} {n(my + depth)} {n(mx + w)} {n(my - 0.15)}',
                 sw=FEATURE)]


def mouth_flat(mx, my, w=0.9):
    return [line([(mx - w, my + 0.15), (mx + w, my + 0.15)], sw=FEATURE)]


def mouth_frown(mx, my, w=1.0, depth=0.7):
    return [path(f'M{n(mx - w)} {n(my + 0.5)} Q{n(mx)} {n(my + 0.5 - depth)} {n(mx + w)} {n(my + 0.5)}',
                 sw=FEATURE)]


def mouth_open(mx, my, w=1.4, depth=1.6, teeth=True, tongue=True):
    """Открытый рот «D»: смех, радость."""
    d = (f'M{n(mx - w)} {n(my - 0.3)} L{n(mx + w)} {n(my - 0.3)} '
         f'Q{n(mx + w * 0.95)} {n(my + depth)} {n(mx)} {n(my + depth)} '
         f'Q{n(mx - w * 0.95)} {n(my + depth)} {n(mx - w)} {n(my - 0.3)} Z')
    out = [path(d, MOUTH, stroke=None)]
    if teeth:
        out.append(path(f'M{n(mx - w * 0.86)} {n(my - 0.3)} L{n(mx + w * 0.86)} {n(my - 0.3)} '
                        f'L{n(mx + w * 0.8)} {n(my + 0.12)} L{n(mx - w * 0.8)} {n(my + 0.12)} Z',
                        TEETH, stroke=None))
    if tongue:
        ty = my + depth
        out.append(path(f'M{n(mx - w * 0.55)} {n(ty - 0.12)} Q{n(mx)} {n(ty - depth * 0.62)} '
                        f'{n(mx + w * 0.55)} {n(ty - 0.12)} Q{n(mx)} {n(ty + 0.05)} '
                        f'{n(mx - w * 0.55)} {n(ty - 0.12)} Z', TONGUE, stroke=None))
    out.append(path(d, 'none', sw=FEATURE))
    return out


def mouth_o(mx, my, rx=0.75, ry=1.05, tongue=True):
    """Рот «О»: шок, крик."""
    out = [ell(mx, my + ry * 0.5, rx, ry, MOUTH, stroke=None)]
    if tongue:
        out.append(ell(mx, my + ry * 1.12, rx * 0.6, ry * 0.34, TONGUE, stroke=None))
    out.append(ell(mx, my + ry * 0.5, rx, ry, 'none', sw=FEATURE))
    return out


def mouth_wail(mx, my, w=1.5):
    """Рот-плач: широкая трапеция уголками вниз."""
    d = (f'M{n(mx - w)} {n(my + 1.3)} Q{n(mx)} {n(my - 0.5)} {n(mx + w)} {n(my + 1.3)} '
         f'Q{n(mx)} {n(my + 2.0)} {n(mx - w)} {n(my + 1.3)} Z')
    return [path(d, MOUTH, stroke=None),
            path(f'M{n(mx - w * 0.6)} {n(my + 1.55)} Q{n(mx)} {n(my + 1.05)} {n(mx + w * 0.6)} {n(my + 1.55)} '
                 f'Q{n(mx)} {n(my + 1.85)} {n(mx - w * 0.6)} {n(my + 1.55)} Z', TONGUE, stroke=None),
            path(d, 'none', sw=FEATURE)]


def mouth_wavy(mx, my, w=1.3, amp=0.22, waves=4):
    pts = []
    for i in range(waves * 2 + 1):
        x = mx - w + (2 * w) * i / (waves * 2)
        y = my + (amp if i % 2 else -amp)
        pts.append((x, y))
    return [line(pts, sw=FEATURE)]


def mouth_gritted(mx, my, w=1.4, h=1.0):
    """Сжатые зубы: злость, усилие."""
    out = [path(f'M{n(mx - w)} {n(my - 0.2)} L{n(mx + w)} {n(my - 0.2)} L{n(mx + w)} {n(my - 0.2 + h)} '
                f'L{n(mx - w)} {n(my - 0.2 + h)} Z', TEETH, sw=FEATURE)]
    out.append(line([(mx - w, my - 0.2 + h / 2), (mx + w, my - 0.2 + h / 2)], sw=FEATURE * 0.6))
    for i in range(1, 4):
        x = mx - w + 2 * w * i / 4
        out.append(line([(x, my - 0.2), (x, my - 0.2 + h)], sw=FEATURE * 0.6))
    return out


def mouth_smirk(mx, my, w=1.1, side=1):
    """Ухмылка: один уголок выше. side=1 — поднят правый от зрителя."""
    a, b = mx - side * w, mx + side * w
    return [path(f'M{n(a)} {n(my + 0.15)} Q{n(mx + side * 0.25)} {n(my + 0.55)} {n(b)} {n(my - 0.45)}',
                 sw=FEATURE),
            line([(b - side * 0.08, my - 0.45), (b + side * 0.22, my - 0.68)], sw=FEATURE * 0.8)]


# ------------------------------------------------------------------ добавки
def tear(x, y, s=1.0):
    return [path(f'M{n(x)} {n(y - 0.55 * s)} Q{n(x + 0.42 * s)} {n(y + 0.05 * s)} {n(x)} {n(y + 0.3 * s)} '
                 f'Q{n(x - 0.42 * s)} {n(y + 0.05 * s)} {n(x)} {n(y - 0.55 * s)} Z', TEAR, sw=3)]


def tear_stream(x, y0, y1, w=0.55):
    d = (f'M{n(x - w / 2)} {n(y0)} Q{n(x - w / 2 - 0.15)} {n((y0 + y1) / 2)} {n(x - w / 2)} {n(y1)} '
         f'L{n(x + w / 2)} {n(y1)} Q{n(x + w / 2 + 0.15)} {n((y0 + y1) / 2)} {n(x + w / 2)} {n(y0)} Z')
    return [path(d, TEAR, sw=3, extra='opacity="0.95"')]


def sweat(x, y, s=1.0):
    return [path(f'M{n(x)} {n(y - 0.7 * s)} Q{n(x + 0.55 * s)} {n(y + 0.1 * s)} {n(x)} {n(y + 0.4 * s)} '
                 f'Q{n(x - 0.55 * s)} {n(y + 0.1 * s)} {n(x)} {n(y - 0.7 * s)} Z', SWEAT, sw=3)]


def blush(cx, cy, rx=0.85, ry=0.42, opacity=0.65):
    return [ell(cx, cy, rx, ry, BLUSH, stroke=None, extra=f'opacity="{opacity}"')]


def vein(x, y, s=0.55):
    """Знак злости ╬ — четыре дужки."""
    out = []
    for dx, dy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        cx, cy = x + dx * s * 0.55, y + dy * s * 0.55
        out.append(path(f'M{n(cx + dx * s * 0.5)} {n(cy - dy * s * 0.05)} '
                        f'Q{n(cx)} {n(cy)} {n(cx - dx * s * 0.05)} {n(cy + dy * s * 0.5)}',
                        stroke=VEIN, sw=4.5))
    return out


def gloom(w, top, depth=2.2, color='#3a2f7a'):
    """Синие полосы ужаса на лбу: от линии волос top вниз на depth."""
    out = []
    for i, op in enumerate((0.4, 0.26, 0.14)):
        out.append(f'<rect x="0" y="{n(top + depth / 3 * i)}" width="{n(w)}" height="{n(depth / 3 + 0.02)}" '
                   f'fill="{color}" opacity="{op}"/>')
    for i in range(4):
        x = w * (0.26 + 0.16 * i)
        out.append(line([(x, top + 0.15), (x, top + depth * (0.55 + 0.15 * (i % 2)))], sw=3, stroke=color))
    return out


def poly_fill(points, color):
    return poly(points, color, stroke=None)
